// HTTP fingerprint: redirect chain, server headers, and best-effort technology
// detection from headers, cookies and a slice of the HTML. Active, consent-gated.
import { json, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const HEADER_SIGS = [
  [/cloudflare/i, 'server', 'Cloudflare'], [null, 'cf-ray', 'Cloudflare'],
  [null, 'x-vercel-id', 'Vercel'], [null, 'x-amz-cf-id', 'AWS CloudFront'], [null, 'x-amz-request-id', 'AWS S3'],
  [null, 'x-drupal-cache', 'Drupal'], [null, 'x-generator', null], [null, 'x-shopify-stage', 'Shopify'],
  [/nginx/i, 'server', 'nginx'], [/apache/i, 'server', 'Apache'], [/microsoft-iis/i, 'server', 'IIS'],
  [/express/i, 'x-powered-by', 'Express'], [/php/i, 'x-powered-by', 'PHP'], [/asp\.net/i, 'x-powered-by', 'ASP.NET'],
  [null, 'x-fastly-request-id', 'Fastly'], [null, 'fly-request-id', 'Fly.io'],
];
const COOKIE_SIGS = [[/PHPSESSID/, 'PHP'], [/JSESSIONID/, 'Java'], [/ASP\.NET_SessionId/, 'ASP.NET'], [/laravel_session/, 'Laravel'], [/_shopify/, 'Shopify'], [/wordpress_/, 'WordPress']];
const BODY_SIGS = [
  [/wp-content|wp-includes|name=["']generator["'] content=["']WordPress/i, 'WordPress'],
  [/Drupal\.settings|sites\/default\/files/i, 'Drupal'],
  [/Joomla!|\/media\/jui\//i, 'Joomla'],
  [/cdn\.shopify\.com|Shopify\.theme/i, 'Shopify'],
  [/static\.wixstatic\.com|X-Wix/i, 'Wix'],
  [/squarespace\.com|static1\.squarespace/i, 'Squarespace'],
  [/\/_next\/static\//i, 'Next.js'], [/\/_nuxt\//i, 'Nuxt'],
  [/react(?:\.min)?\.js|data-reactroot/i, 'React'], [/ng-version=|angular/i, 'Angular'], [/vue(?:\.min)?\.js|data-v-/i, 'Vue'],
  [/jquery(?:-|\.min)/i, 'jQuery'], [/bootstrap(?:\.min)?\.css/i, 'Bootstrap'],
  [/gtag\(|googletagmanager/i, 'Google Analytics'],
];

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'fp', limit: 20 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const t = safeTarget(new URL(request.url).searchParams.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);

  const chain = [];
  let url = t.url.href, res, hops = 0;
  try {
    while (hops++ < 6) {
      res = await fetchT(url, { headers: { 'user-agent': 'CyberKit fingerprint' }, redirect: 'manual' }, 12000);
      const loc = res.headers.get('location');
      chain.push({ url, status: res.status, location: loc || undefined });
      if (res.status >= 300 && res.status < 400 && loc) {
        const next = safeTarget(new URL(loc, url).href, allowPrivate(env));
        if (!next.ok) { chain[chain.length - 1].stopped = next.reason; break; }
        url = next.url.href; continue;
      }
      break;
    }
  } catch (e) { return json({ error: 'request failed: ' + e.message }, 502); }

  const got = {}; res.headers.forEach((v, k) => { got[k.toLowerCase()] = v; });
  const cookies = res.headers.get('set-cookie') || '';
  let body = '';
  try { body = (await res.text()).slice(0, 60000); } catch {}
  const title = (body.match(/<title[^>]*>([^<]{0,200})/i) || [])[1]?.trim();

  const tech = new Set();
  for (const [rx, hdr, name] of HEADER_SIGS) { const v = got[hdr]; if (v && (!rx || rx.test(v))) tech.add(name || v); }
  for (const [rx, name] of COOKIE_SIGS) if (rx.test(cookies)) tech.add(name);
  for (const [rx, name] of BODY_SIGS) if (rx.test(body)) tech.add(name);

  return json({
    target: t.url.href, finalUrl: url, status: res.status, title,
    server: got['server'], poweredBy: got['x-powered-by'], generator: got['x-generator'],
    redirectChain: chain, technologies: [...tech].sort(),
    headers: got,
  });
}
