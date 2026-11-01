// Have I Been Pwned.
//  - Pwned Passwords by k-anonymity: the browser hashes the password with SHA-1,
//    sends only the first 5 hex chars here, and matches the returned suffixes
//    locally. The full hash and the password never leave the browser.
//  - Breach-by-account needs a paid HIBP key; bound as env.HIBP_KEY.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'hibp', limit: 30 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const prefix = (q.get('prefix') || '').trim().toUpperCase();
  const account = (q.get('account') || '').trim();

  if (prefix) {
    if (!/^[0-9A-F]{5}$/.test(prefix)) return bad('prefix must be 5 hex chars (first 5 of the SHA-1)');
    let txt;
    try {
      const r = await fetchT('https://api.pwnedpasswords.com/range/' + prefix,
        { headers: { 'add-padding': 'true' }, redirect: 'follow' });
      txt = await r.text();
    } catch (e) { return bad('HIBP failed: ' + e.message, 502); }
    const suffixes = txt.split('\n').map(l => {
      const [suf, count] = l.trim().split(':');
      return { suffix: suf, count: Number(count) };
    }).filter(x => x.suffix && x.count > 0);
    return json({ prefix, returned: suffixes.length, suffixes });
  }

  if (account) {
    if (!(env && env.HIBP_KEY)) return json({ account, error: 'breach-by-account needs an HIBP API key (env.HIBP_KEY). The password check works without a key.' }, 501);
    let d, status;
    try {
      const r = await fetchT('https://haveibeenpwned.com/api/v3/breachedaccount/' + encodeURIComponent(account) + '?truncateResponse=false',
        { headers: { 'hibp-api-key': env.HIBP_KEY, 'user-agent': 'CyberKit' }, redirect: 'follow' });
      status = r.status;
      if (status === 404) return json({ account, breached: false, breaches: [] });
      d = await r.json();
    } catch (e) { return bad('HIBP failed: ' + e.message, 502); }
    if (status !== 200) return bad('HIBP returned ' + status, 502);
    return json({ account, breached: true, count: d.length, breaches: d.map(b => ({ name: b.Name, domain: b.Domain, date: b.BreachDate, pwnCount: b.PwnCount, data: b.DataClasses })) });
  }

  return bad('prefix (5 hex, for the password check) or account required');
}
