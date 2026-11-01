// DNS lookup over DoH (Cloudflare 1.1.1.1 JSON). Passive: queries public DNS,
// does not touch the named host.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

const TYPES = { A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257 };

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'dns', limit: 40 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const name = (q.get('name') || '').trim();
  const type = (q.get('type') || 'A').toUpperCase();
  if (!name) return bad('name required');
  if (!TYPES[type]) return bad('type must be one of ' + Object.keys(TYPES).join(', '));
  let r;
  try {
    r = await fetchT('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=' + type,
      { headers: { accept: 'application/dns-json' }, redirect: 'follow' });
  } catch (e) { return bad('lookup failed: ' + e.message, 502); }
  const d = await r.json();
  const answers = (d.Answer || []).map(a => ({ name: a.name, type: rtype(a.type), ttl: a.TTL, data: a.data }));
  return json({ name, type, status: d.Status, rcode: rcode(d.Status), answers, authority: (d.Authority || []).map(a => a.data) });
}

function rtype(n) { return Object.keys(TYPES).find(k => TYPES[k] === n) || String(n); }
function rcode(n) { return ({ 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 5: 'REFUSED' })[n] || String(n); }
