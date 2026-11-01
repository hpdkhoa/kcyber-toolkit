// Shodan host lookup. Passive (reads Shodan's database, does not touch the host).
// Needs a Shodan API key bound as env.SHODAN_KEY.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'shodan', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!(env && env.SHODAN_KEY)) return json({ error: 'Shodan lookup needs an API key (env.SHODAN_KEY on the Pages project)' }, 501);
  const ip = (new URL(request.url).searchParams.get('ip') || '').trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !ip.includes(':')) return bad('ip required');
  let d;
  try {
    const r = await fetchT('https://api.shodan.io/shodan/host/' + encodeURIComponent(ip) + '?key=' + env.SHODAN_KEY + '&minify=false', { headers: { accept: 'application/json' }, redirect: 'follow' }, 12000);
    if (r.status === 404) return json({ ip, found: false, note: 'no information in Shodan' });
    if (r.status === 401) return json({ error: 'Shodan key rejected' }, 502);
    d = await r.json();
  } catch (e) { return json({ error: 'Shodan failed: ' + e.message }, 502); }
  return json({
    ip, found: true, org: d.org, isp: d.isp, asn: d.asn, os: d.os,
    country: d.country_name, city: d.city, hostnames: d.hostnames, ports: d.ports,
    vulns: d.vulns, tags: d.tags, lastUpdate: d.last_update,
    services: (d.data || []).map(s => ({ port: s.port, transport: s.transport, product: s.product, version: s.version, banner: (s.data || '').slice(0, 300) })),
  });
}
