// TLS / SSL scan. A serverless worker cannot read a peer certificate or the
// negotiated protocol itself, so this proxies the Qualys SSL Labs API, which
// runs the real scan. Active (SSL Labs connects to the target), consent-gated.
// SSL Labs is slow: the client polls until status is READY.
import { json, bad, rateLimit, tooMany, needConsent, isPrivateHost, allowPrivate, targetError, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'tls', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const host = (q.get('host') || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return bad('host required, e.g. example.com');
  if (!allowPrivate(env) && isPrivateHost(host)) return targetError('private or loopback host refused (set CK_ALLOW_PRIVATE)');

  const start = q.get('start') === '1';
  let url = 'https://api.ssllabs.com/api/v3/analyze?host=' + encodeURIComponent(host) + '&all=done&ignoreMismatch=on';
  if (start) url += '&startNew=on';
  let d;
  try {
    const r = await fetchT(url, { headers: { accept: 'application/json' }, redirect: 'follow' }, 15000);
    if (r.status === 429 || r.status === 529) return json({ host, status: 'THROTTLED', note: 'SSL Labs is busy; wait and retry' }, 200);
    d = await r.json();
  } catch (e) { return json({ error: 'SSL Labs failed: ' + e.message }, 502); }

  if (d.status !== 'READY') return json({ host, status: d.status, statusMessage: d.statusMessage, progress: (d.endpoints || []).map(e => ({ ip: e.ipAddress, statusMessage: e.statusMessage, progress: e.progress })) });

  const endpoints = (d.endpoints || []).map(e => {
    const dt = e.details || {};
    const cert = (d.certs || [])[0] || {};
    return {
      ip: e.ipAddress, grade: e.grade, gradeTrustIgnored: e.gradeTrustIgnored,
      protocols: (dt.protocols || []).map(p => p.name + ' ' + p.version),
      vulnBeast: dt.vulnBeast, heartbleed: dt.heartbleed, poodle: dt.poodle, freak: dt.freak, logjam: dt.logjam,
      supportsRc4: dt.supportsRc4, forwardSecrecy: dt.forwardSecrecy,
      cert: { subject: cert.subject, issuer: cert.issuerSubject, notBefore: cert.notBefore && new Date(cert.notBefore).toISOString(), notAfter: cert.notAfter && new Date(cert.notAfter).toISOString(), keyAlg: cert.keyAlg, keySize: cert.keySize, sigAlg: cert.sigAlg },
    };
  });
  return json({ host, status: 'READY', endpoints });
}
