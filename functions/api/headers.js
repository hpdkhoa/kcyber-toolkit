// Security-header checker. Active: makes one request to the target you name.
// Consent-gated, rate-limited, SSRF-guarded.
import { json, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const WANT = {
  'strict-transport-security': { label: 'HSTS', weight: 2, good: v => /max-age=\d{5,}/.test(v) },
  'content-security-policy': { label: 'CSP', weight: 2, good: v => v.length > 0 && !/unsafe-inline/.test(v) },
  'x-content-type-options': { label: 'X-Content-Type-Options', weight: 1, good: v => /nosniff/i.test(v) },
  'x-frame-options': { label: 'X-Frame-Options', weight: 1, good: v => /deny|sameorigin/i.test(v) },
  'referrer-policy': { label: 'Referrer-Policy', weight: 1, good: () => true },
  'permissions-policy': { label: 'Permissions-Policy', weight: 1, good: () => true },
  'cross-origin-opener-policy': { label: 'COOP', weight: 1, good: () => true },
  'cross-origin-resource-policy': { label: 'CORP', weight: 1, good: () => true },
};
const LEAK = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version', 'via'];

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'headers', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const t = safeTarget(new URL(request.url).searchParams.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);

  let res;
  try { res = await fetchT(t.url.href, { headers: { 'user-agent': 'CyberKit header check' }, redirect: 'follow' }, 12000); }
  catch (e) { return json({ error: 'request failed: ' + e.message }, 502); }

  const got = {};
  res.headers.forEach((v, k) => { got[k.toLowerCase()] = v; });
  const findings = [];
  let score = 0, max = 0;
  const present = {};
  for (const [name, spec] of Object.entries(WANT)) {
    max += spec.weight;
    const v = got[name];
    if (v == null) findings.push({ level: spec.weight >= 2 ? 'high' : 'med', msg: 'missing ' + spec.label });
    else {
      present[name] = v;
      if (spec.good(v)) score += spec.weight;
      else findings.push({ level: 'low', msg: spec.label + ' present but weak: ' + v.slice(0, 80) });
    }
  }
  const leaks = {};
  for (const h of LEAK) if (got[h]) { leaks[h] = got[h]; findings.push({ level: 'low', msg: 'information disclosure: ' + h + ': ' + got[h] }); }

  const grade = pct => pct >= 0.9 ? 'A' : pct >= 0.75 ? 'B' : pct >= 0.5 ? 'C' : pct >= 0.25 ? 'D' : 'F';
  return json({ url: t.url.href, status: res.status, grade: grade(score / max), score, max, present, leaks, findings });
}
