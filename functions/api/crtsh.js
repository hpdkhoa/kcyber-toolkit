// Certificate-transparency search via crt.sh. Passive: reads public CT logs.
// Doubles as a passive subdomain finder (names seen in issued certs).
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'crtsh', limit: 15, windowMs: 60000 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const domain = (new URL(request.url).searchParams.get('domain') || '').trim().toLowerCase().replace(/^\*\./, '');
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return bad('domain required, e.g. example.com');
  const url = 'https://crt.sh/?q=' + encodeURIComponent('%.' + domain) + '&output=json&exclude=expired';
  let rows, lastErr;
  for (let attempt = 0; attempt < 2 && !rows; attempt++) {
    try {
      const r = await fetchT(url, { headers: { accept: 'application/json' }, redirect: 'follow' }, 28000);
      const txt = await r.text();
      if (!txt.trim()) { rows = []; break; }
      rows = JSON.parse(txt);
    } catch (e) { lastErr = e; }
  }
  if (!rows) return bad('crt.sh did not respond in time (it is often slow); try again. ' + (lastErr ? lastErr.message : ''), 504);
  const subs = new Set();
  const certs = [];
  for (const row of rows) {
    for (const n of String(row.name_value || '').split(/\n/)) {
      const name = n.trim().toLowerCase();
      if (name && !name.startsWith('*') && (name === domain || name.endsWith('.' + domain))) subs.add(name);
    }
    certs.push({ id: row.id, issuer: row.issuer_name, notBefore: row.not_before, notAfter: row.not_after, cn: row.common_name });
  }
  const subdomains = [...subs].sort();
  return json({ domain, subdomains, subdomainCount: subdomains.length, certCount: certs.length, certs: certs.slice(0, 100) });
}
