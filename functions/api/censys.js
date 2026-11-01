// Censys host lookup. Passive. Needs a Censys Personal Access Token bound as
// env.CENSYS_PAT (Platform API). Without it, the tool reports that it is unset.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'censys', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  if (!(env && env.CENSYS_PAT)) return json({ error: 'Censys lookup needs a Personal Access Token (env.CENSYS_PAT on the Pages project)' }, 501);
  const ip = (new URL(request.url).searchParams.get('ip') || '').trim();
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && !ip.includes(':')) return bad('ip required');
  let d;
  try {
    const r = await fetchT('https://api.platform.censys.io/v3/global/asset/host/' + encodeURIComponent(ip),
      { headers: { accept: 'application/json', authorization: 'Bearer ' + env.CENSYS_PAT }, redirect: 'follow' }, 12000);
    if (r.status === 404) return json({ ip, found: false, note: 'no information in Censys' });
    if (r.status === 401 || r.status === 403) return json({ error: 'Censys token rejected' }, 502);
    d = await r.json();
  } catch (e) { return json({ error: 'Censys failed: ' + e.message }, 502); }
  const host = d.result || d;
  return json({
    ip, found: true,
    location: host.location, autonomousSystem: host.autonomous_system,
    services: (host.services || []).map(s => ({ port: s.port, protocol: s.service_name || s.extended_service_name, transport: s.transport_protocol, software: s.software })),
    raw: undefined,
  });
}
