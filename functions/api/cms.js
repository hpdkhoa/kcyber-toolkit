// CMS detection by probing well-known, non-destructive paths. Active,
// consent-gated and rate-limited. GET only, a small fixed path set.
import { json, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const PROBES = {
  WordPress: [['/wp-login.php', r => r.status < 400], ['/wp-json/', r => /json/.test(r.ct)], ['/wp-content/', r => r.status !== 404]],
  Drupal: [['/CHANGELOG.txt', r => /drupal/i.test(r.body)], ['/core/CHANGELOG.txt', r => /drupal/i.test(r.body)], ['/user/login', r => r.status < 400]],
  Joomla: [['/administrator/', r => r.status < 400 && /joomla/i.test(r.body)], ['/language/en-GB/en-GB.xml', r => r.status < 400]],
  Magento: [['/magento_version', r => r.status === 200], ['/static/version', r => r.status < 400]],
  Ghost: [['/ghost/', r => r.status < 400]],
  Typo3: [['/typo3/', r => r.status < 400]],
};

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'cms', limit: 8, windowMs: 60000 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const t = safeTarget(new URL(request.url).searchParams.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);
  const origin = t.url.origin;

  const probe = async (path) => {
    try {
      const r = await fetchT(origin + path, { headers: { 'user-agent': 'CyberKit cms' }, redirect: 'manual' }, 8000);
      const ct = r.headers.get('content-type') || '';
      const body = /text|json|xml|html/.test(ct) ? (await r.text()).slice(0, 4000) : '';
      return { status: r.status, ct, body };
    } catch { return { status: 0, ct: '', body: '' }; }
  };

  const results = [];
  for (const [cms, checks] of Object.entries(PROBES)) {
    let hits = 0; const evidence = [];
    for (const [path, test] of checks) {
      const r = await probe(path);
      const ok = test(r);
      if (ok) { hits++; evidence.push(path + ' (' + r.status + ')'); }
    }
    if (hits) results.push({ cms, hits, of: checks.length, evidence, confidence: hits >= 2 ? 'high' : 'low' });
  }
  results.sort((a, b) => b.hits - a.hits);
  return json({ url: origin, detected: results, note: results.length ? undefined : 'no CMS matched the probe set' });
}
