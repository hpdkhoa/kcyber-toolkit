// Open-redirect tester. Active, consent-gated. Injects an external canary into
// common redirect parameters and reports which ones send the browser off-site.
// (Full blind-SSRF detection needs an out-of-band collaborator and is out of scope.)
import { json, bad, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const CANARY = 'cyberkit-canary.example';
const PARAMS = ['next', 'url', 'redirect', 'redirect_uri', 'redirect_url', 'return', 'returnTo', 'return_url', 'dest', 'destination', 'continue', 'r', 'u', 'go', 'target'];
const PAYLOADS = ['https://' + CANARY + '/', '//' + CANARY + '/', 'https:/' + CANARY + '/'];

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'redirect', limit: 6, windowMs: 60000 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const t = safeTarget(q.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);

  // If the URL already has a param, test that one; else sweep the common names.
  const base = t.url;
  const existing = [...base.searchParams.keys()];
  const names = existing.length ? existing : PARAMS;
  const tests = [];
  for (const name of names) for (const payload of (existing.length ? [PAYLOADS[0]] : PAYLOADS)) {
    const u = new URL(base.href);
    u.searchParams.set(name, payload);
    tests.push({ name, payload, url: u.href });
  }
  tests.length = Math.min(tests.length, 40);

  const findings = [];
  for (const test of tests) {
    try {
      const r = await fetchT(test.url, { headers: { 'user-agent': 'CyberKit redirect' }, redirect: 'manual' }, 7000);
      const loc = r.headers.get('location') || '';
      let hit = r.status >= 300 && r.status < 400 && loc.includes(CANARY);
      if (!hit && r.status === 200) { // meta-refresh / JS redirect
        const body = (await r.text()).slice(0, 8000);
        if (new RegExp('(http-equiv=["\']refresh["\'][^>]*' + CANARY + ')|(location\\s*=\\s*["\'][^"\']*' + CANARY + ')', 'i').test(body)) hit = true;
      }
      if (hit) findings.push({ param: test.name, payload: test.payload, status: r.status, location: loc || 'client-side' });
    } catch {}
  }
  return json({ url: base.href, paramsTested: names, vulnerable: findings.length > 0, findings, note: findings.length ? 'Open redirect: these parameters redirect to an external host.' : 'No open redirect found in the tested parameters.' });
}
