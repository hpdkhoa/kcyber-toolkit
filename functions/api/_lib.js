// Shared helpers for the Tier B worker (Cloudflare Pages Functions).
// Every live endpoint imports from here: JSON responses, CORS, a rate limit,
// a consent gate for target-touching tools, and an SSRF guard for the proxy.

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-ck-consent',
};

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra },
  });
}

export function bad(msg, status = 400) {
  return json({ error: msg }, status);
}

// The consent affirmation the UI sends for active (target-touching) tools.
export const CONSENT = 'i-am-authorised-to-test-this-target';

export function hasConsent(request) {
  return request.headers.get('x-ck-consent') === CONSENT;
}

export function needConsent(request) {
  return hasConsent(request) ? null : json({
    error: 'consent required',
    detail: 'This tool contacts the target you name. Tick the authorisation box so the ' +
            'request carries the consent header. Use it only on systems you own or may test.',
  }, 403);
}

// Best-effort rate limit. Uses a bound KV namespace (env.CK_RL) when present for a
// global limit; falls back to an in-memory window that is per-isolate only.
const mem = new Map();
export async function rateLimit(request, env, { limit = 20, windowMs = 60000, tag = 'g' } = {}) {
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'anon';
  const now = Date.now();
  const key = tag + ':' + ip;
  if (env && env.CK_RL) {
    const raw = await env.CK_RL.get(key);
    const rec = raw ? JSON.parse(raw) : { n: 0, reset: now + windowMs };
    if (now > rec.reset) { rec.n = 0; rec.reset = now + windowMs; }
    rec.n++;
    await env.CK_RL.put(key, JSON.stringify(rec), { expirationTtl: Math.ceil(windowMs / 1000) + 1 });
    if (rec.n > limit) return { ok: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
    return { ok: true, remaining: limit - rec.n };
  }
  let rec = mem.get(key);
  if (!rec || now > rec.reset) { rec = { n: 0, reset: now + windowMs }; mem.set(key, rec); }
  rec.n++;
  if (rec.n > limit) return { ok: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
  return { ok: true, remaining: limit - rec.n };
}

export function tooMany(retryAfter) {
  return json({ error: 'rate limit', retryAfter }, 429, { 'retry-after': String(retryAfter) });
}

// Block SSRF pivots on the HTTP proxy: only http/https, no private, loopback,
// link-local, or cloud-metadata hosts. Hostnames are allowed (the edge resolves
// them); literal private IPs are refused.
const V4_PRIV = [
  /^0\./, /^10\./, /^127\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
];
export function isPrivateHost(host) {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h === 'metadata.google.internal') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return V4_PRIV.some(r => r.test(h));
  if (h.includes(':')) { // IPv6
    if (h === '::1' || h === '::') return true;
    if (/^fc|^fd/.test(h) || /^fe80:/.test(h)) return true; // ULA + link-local
    if (/^::ffff:/.test(h)) return V4_PRIV.some(r => r.test(h.split(':').pop()));
  }
  return false;
}

export function safeTarget(urlStr) {
  let u;
  try { u = new URL(/^https?:\/\//i.test(urlStr) ? urlStr : 'https://' + urlStr); }
  catch { return { ok: false, reason: 'not a valid URL' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, reason: 'only http and https' };
  if (isPrivateHost(u.hostname)) return { ok: false, reason: 'private, loopback or metadata host refused' };
  return { ok: true, url: u };
}

// Fetch with a timeout; returns the Response or throws a tidy error.
export async function fetchT(url, opts = {}, ms = 10000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal, redirect: opts.redirect || 'manual' }); }
  catch (e) { throw new Error(e.name === 'AbortError' ? 'upstream timed out' : e.message); }
  finally { clearTimeout(t); }
}
