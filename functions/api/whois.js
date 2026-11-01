// RDAP lookup (the structured successor to WHOIS). Passive. Resolves the
// authoritative RDAP server from the IANA bootstrap, then queries it directly.
// (rdap.org is skipped: it challenges server-to-server calls.)
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'whois', limit: 30 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = (new URL(request.url).searchParams.get('q') || '').trim().toLowerCase().replace(/\.$/, '');
  if (!q) return bad('q required (a domain or IP)');
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(q) || q.includes(':');
  let base, d;
  try {
    base = isIp ? await ipBase(q) : await domainBase(q);
    if (!base) return json({ q, found: false, note: 'no RDAP server is registered for this ' + (isIp ? 'address block' : 'TLD') });
    const url = base.replace(/\/?$/, '/') + (isIp ? 'ip/' : 'domain/') + encodeURIComponent(q);
    const r = await fetchT(url, { headers: { accept: 'application/rdap+json' }, redirect: 'follow' }, 12000);
    if (r.status === 404) return json({ q, found: false, note: 'no RDAP record' });
    if (!/json/.test(r.headers.get('content-type') || '')) return bad('RDAP server did not return JSON (status ' + r.status + ')', 502);
    d = await r.json();
  } catch (e) { return bad('lookup failed: ' + e.message, 502); }
  const events = {};
  for (const e of d.events || []) events[e.eventAction] = e.eventDate;
  const registrar = (d.entities || []).find(e => (e.roles || []).includes('registrar'));
  return json({
    q, found: true, rdapServer: base,
    handle: d.handle, ldhName: (d.ldhName || d.name || '').toLowerCase() || undefined,
    status: d.status || [],
    registered: events.registration, expires: events.expiration, lastChanged: events['last changed'],
    registrar: registrar ? vcardName(registrar) : undefined,
    nameservers: (d.nameservers || []).map(n => (n.ldhName || '').toLowerCase()),
    cidr: d.cidr0_cidrs, startAddress: d.startAddress, endAddress: d.endAddress, country: d.country, rir: d.port43,
  });
}

let dnsBoot = null, v4Boot = null, v6Boot = null;
async function boot(file, cache) {
  if (cache.v) return cache.v;
  const r = await fetchT('https://data.iana.org/rdap/' + file, { redirect: 'follow' }, 12000);
  cache.v = await r.json();
  return cache.v;
}
async function domainBase(domain) {
  const tld = domain.split('.').pop();
  const d = await boot('dns.json', dnsBoot ||= {});
  const svc = (d.services || []).find(s => s[0].includes(tld));
  return svc ? pickHttps(svc[1]) : null;
}
async function ipBase(ip) {
  const v6 = ip.includes(':');
  const d = await boot(v6 ? 'ipv6.json' : 'ipv4.json', v6 ? (v6Boot ||= {}) : (v4Boot ||= {}));
  const val = v6 ? ip6ToBig(ip) : ip4ToInt(ip);
  let best = null, bestLen = -1;
  for (const svc of d.services || []) {
    for (const cidr of svc[0]) {
      const [net, bits] = cidr.split('/');
      const len = Number(bits);
      const mask = v6 ? (len === 0 ? 0n : (~0n << BigInt(128 - len)) & ((1n << 128n) - 1n)) : (len === 0 ? 0 : (~0 << (32 - len)) >>> 0);
      const netV = v6 ? ip6ToBig(net) : ip4ToInt(net);
      const inside = v6 ? (val & mask) === (netV & mask) : (val & mask) >>> 0 === (netV & mask) >>> 0;
      if (inside && len > bestLen) { best = pickHttps(svc[1]); bestLen = len; }
    }
  }
  return best;
}
function pickHttps(urls) { return urls.find(u => u.startsWith('https')) || urls[0]; }
function ip4ToInt(ip) { return ip.split('.').reduce((a, o) => ((a << 8) >>> 0) + (Number(o) & 255), 0) >>> 0; }
function ip6ToBig(ip) {
  let [head, tail = ''] = ip.replace(/^\[|\]$/g, '').split('::');
  const hp = head ? head.split(':') : [], tp = tail ? tail.split(':') : [];
  const groups = [...hp, ...Array(8 - hp.length - tp.length).fill('0'), ...tp];
  return groups.reduce((a, g) => (a << 16n) + BigInt(parseInt(g || '0', 16)), 0n);
}
function vcardName(entity) {
  const arr = entity.vcardArray && entity.vcardArray[1];
  if (!arr) return entity.handle;
  const fn = arr.find(x => x[0] === 'fn');
  return fn ? fn[3] : entity.handle;
}
