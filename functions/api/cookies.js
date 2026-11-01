// Cookie and CORS analyzer. Active, consent-gated. Reads Set-Cookie flags and
// probes CORS by sending a test Origin and reading the response.
import { json, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const TEST_ORIGIN = 'https://cyberkit-cors-probe.example';

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'cookies', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const t = safeTarget(new URL(request.url).searchParams.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);

  let res;
  try { res = await fetchT(t.url.href, { headers: { 'user-agent': 'CyberKit', origin: TEST_ORIGIN }, redirect: 'follow' }, 12000); }
  catch (e) { return json({ error: 'request failed: ' + e.message }, 502); }

  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : []);
  const findings = [];
  const cookies = raw.map(c => {
    const name = c.split('=')[0];
    const secure = /;\s*secure/i.test(c), httpOnly = /;\s*httponly/i.test(c);
    const ss = (c.match(/;\s*samesite=(\w+)/i) || [])[1];
    if (!secure) findings.push({ level: 'med', msg: 'cookie ' + name + ' lacks Secure' });
    if (!httpOnly) findings.push({ level: 'med', msg: 'cookie ' + name + ' lacks HttpOnly' });
    if (!ss) findings.push({ level: 'low', msg: 'cookie ' + name + ' has no SameSite' });
    else if (/none/i.test(ss) && !secure) findings.push({ level: 'high', msg: 'cookie ' + name + ' is SameSite=None without Secure' });
    return { name, secure, httpOnly, sameSite: ss || null };
  });

  const acao = res.headers.get('access-control-allow-origin');
  const acac = res.headers.get('access-control-allow-credentials');
  const cors = { allowOrigin: acao, allowCredentials: acac };
  if (acao === TEST_ORIGIN) { cors.reflectsOrigin = true; findings.push({ level: acac === 'true' ? 'high' : 'med', msg: 'CORS reflects an arbitrary Origin' + (acac === 'true' ? ' with credentials — any site can read authenticated responses' : '') }); }
  if (acao === '*' && acac === 'true') findings.push({ level: 'high', msg: 'ACAO:* with credentials is invalid and unsafe' });

  return json({ url: t.url.href, status: res.status, cookieCount: cookies.length, cookies, cors, findings });
}
