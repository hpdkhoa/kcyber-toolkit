// Reverse DNS (PTR) over DoH. Passive. Accepts an IPv4 or IPv6 address.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

function arpa(ip) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  if (ip.includes(':')) {
    // expand IPv6 to full 32 nibbles
    let [head, tail = ''] = ip.split('::');
    const hp = head ? head.split(':') : [], tp = tail ? tail.split(':') : [];
    const miss = 8 - hp.length - tp.length;
    const groups = [...hp, ...Array(miss).fill('0'), ...tp].map(g => g.padStart(4, '0')).join('');
    return groups.split('').reverse().join('.') + '.ip6.arpa';
  }
  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'rdns', limit: 40 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const ip = (new URL(request.url).searchParams.get('ip') || '').trim();
  const name = arpa(ip);
  if (!name) return bad('ip must be a valid IPv4 or IPv6 address');
  let r;
  try {
    r = await fetchT('https://cloudflare-dns.com/dns-query?name=' + name + '&type=PTR',
      { headers: { accept: 'application/dns-json' }, redirect: 'follow' });
  } catch (e) { return bad('lookup failed: ' + e.message, 502); }
  const d = await r.json();
  const ptr = (d.Answer || []).filter(a => a.type === 12).map(a => a.data.replace(/\.$/, ''));
  return json({ ip, query: name, ptr, found: ptr.length > 0 });
}
