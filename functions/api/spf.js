// SPF / DKIM / DMARC analyzer. Passive: reads DNS TXT records over DoH.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

async function txt(name) {
  const r = await fetchT('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=TXT',
    { headers: { accept: 'application/dns-json' }, redirect: 'follow' });
  const d = await r.json();
  return (d.Answer || []).filter(a => a.type === 16).map(a => a.data.replace(/^"|"$/g, '').replace(/" "/g, ''));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'spf', limit: 30 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const domain = (q.get('domain') || '').trim().toLowerCase().replace(/\.$/, '');
  const selector = (q.get('selector') || '').trim();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return bad('domain required, e.g. example.com');

  const findings = [];
  const [spfRecs, dmarcRecs] = await Promise.all([txt(domain), txt('_dmarc.' + domain)]);

  const spf = spfRecs.find(r => /^v=spf1/i.test(r));
  if (!spf) findings.push({ level: 'high', area: 'SPF', msg: 'no SPF record — senders cannot be authorised by IP' });
  else {
    const all = spf.match(/[-~?+]all\b/i);
    if (!all) findings.push({ level: 'med', area: 'SPF', msg: 'no "all" mechanism; policy is undefined for unlisted senders' });
    else if (/\+all/i.test(spf)) findings.push({ level: 'high', area: 'SPF', msg: '+all allows anyone to send as this domain' });
    else if (/~all/i.test(spf)) findings.push({ level: 'low', area: 'SPF', msg: '~all is softfail; -all (hardfail) is stronger' });
    const lookups = (spf.match(/\b(include|a|mx|ptr|exists|redirect):?/gi) || []).length;
    if (lookups > 10) findings.push({ level: 'med', area: 'SPF', msg: lookups + ' mechanisms; SPF allows at most 10 DNS lookups' });
  }

  const dmarc = dmarcRecs.find(r => /^v=DMARC1/i.test(r));
  if (!dmarc) findings.push({ level: 'high', area: 'DMARC', msg: 'no DMARC record at _dmarc.' + domain });
  else {
    const p = (dmarc.match(/\bp=(\w+)/i) || [])[1]?.toLowerCase();
    if (p === 'none') findings.push({ level: 'med', area: 'DMARC', msg: 'p=none only monitors; move to quarantine or reject to enforce' });
    if (!p) findings.push({ level: 'high', area: 'DMARC', msg: 'DMARC record has no policy (p=)' });
    if (!/\brua=/.test(dmarc)) findings.push({ level: 'low', area: 'DMARC', msg: 'no rua= aggregate-report address' });
  }

  let dkim = null;
  if (selector) {
    const recs = await txt(selector + '._domainkey.' + domain);
    const d = recs.find(r => /v=DKIM1|k=|p=/i.test(r));
    dkim = { selector, found: !!d, record: d || null };
    if (!d) findings.push({ level: 'med', area: 'DKIM', msg: 'no DKIM key at ' + selector + '._domainkey.' + domain });
    else if (/\bp=;?\s*$/.test(d) || /\bp=(["\s]|$)/.test(d)) findings.push({ level: 'high', area: 'DKIM', msg: 'DKIM key is revoked (empty p=)' });
  }

  return json({ domain, spf: spf || null, dmarc: dmarc || null, dkim, findings });
}
