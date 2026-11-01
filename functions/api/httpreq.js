// Request editor and replay: send a crafted HTTP request to the target and
// return the full response. Active, consent-gated, SSRF-guarded. A hosted
// Repeater for authorised testing, not an open relay.
import { json, bad, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export async function onRequestPost(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'httpreq', limit: 30 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  let spec;
  try { spec = await request.json(); } catch { return bad('send a JSON body'); }
  const method = (spec.method || 'GET').toUpperCase();
  if (!METHODS.includes(method)) return bad('method must be one of ' + METHODS.join(', '));
  const t = safeTarget(spec.url || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);

  const headers = new Headers();
  if (spec.headers && typeof spec.headers === 'object' && !Array.isArray(spec.headers)) {
    for (const [k, v] of Object.entries(spec.headers)) headers.set(k, String(v));
  } else if (typeof spec.headers === 'string') {
    for (const line of spec.headers.split(/\r?\n/)) { const i = line.indexOf(':'); if (i > 0) headers.set(line.slice(0, i).trim(), line.slice(i + 1).trim()); }
  }
  if (!headers.has('user-agent')) headers.set('user-agent', 'CyberKit replay');

  const started = Date.now();
  let res;
  try {
    res = await fetchT(t.url.href, {
      method, headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : (spec.body != null ? String(spec.body) : undefined),
      redirect: spec.followRedirects ? 'follow' : 'manual',
    }, 15000);
  } catch (e) { return json({ error: 'request failed: ' + e.message }, 502); }
  const ms = Date.now() - started;

  const respHeaders = {}; res.headers.forEach((v, k) => { respHeaders[k] = v; });
  const buf = new Uint8Array(await res.arrayBuffer());
  const limit = 200000;
  const ct = res.headers.get('content-type') || '';
  const textual = /text|json|xml|javascript|html|csv|urlencoded/.test(ct);
  const body = textual ? new TextDecoder().decode(buf.slice(0, limit)) : '[' + buf.length + ' bytes of ' + (ct || 'binary') + ']';

  return json({
    request: { method, url: t.url.href },
    status: res.status, statusText: res.statusText, timeMs: ms, size: buf.length,
    headers: respHeaders, truncated: textual && buf.length > limit, body,
  });
}
