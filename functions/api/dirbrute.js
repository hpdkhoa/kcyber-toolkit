// Directory and file brute with a small built-in wordlist. Active, consent-gated,
// hard rate limit, capped request count and concurrency. For authorised testing.
import { json, bad, rateLimit, tooMany, needConsent, safeTarget, allowPrivate, targetError, fetchT } from './_lib.js';

const LIST = [
  'admin', 'administrator', 'login', 'wp-admin', 'wp-login.php', 'dashboard', 'phpmyadmin',
  'api', 'api/v1', 'graphql', 'swagger', 'swagger-ui', 'openapi.json', 'docs',
  'backup', 'backups', 'backup.zip', 'backup.sql', 'db.sql', 'dump.sql', 'database.sql',
  '.git/config', '.git/HEAD', '.env', '.env.local', 'config.php', 'config.json', 'settings.py', 'web.config',
  'robots.txt', 'sitemap.xml', '.well-known/security.txt', 'crossdomain.xml', '.htaccess',
  'test', 'dev', 'staging', 'old', 'tmp', 'temp', 'uploads', 'files', 'assets', 'static', 'private',
  'server-status', 'server-info', 'actuator', 'actuator/health', 'metrics', 'debug',
  'user', 'users', 'account', 'register', 'signup', 'logout', 'console', 'portal',
  'index.php', 'info.php', 'phpinfo.php', 'readme.txt', 'README.md', 'CHANGELOG.txt', 'LICENSE',
];

async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } });
  await Promise.all(workers);
  return out;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const deny = needConsent(request); if (deny) return deny;
  const rl = await rateLimit(request, env, { tag: 'dirbrute', limit: 4, windowMs: 60000 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const t = safeTarget(q.get('url') || '', allowPrivate(env));
  if (!t.ok) return targetError(t.reason);
  const extra = (q.get('extra') || '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean).slice(0, 40);
  const words = [...new Set([...LIST, ...extra])].slice(0, 120);
  const origin = t.url.origin;

  // baseline: a random path tells us how the server answers for "not found"
  let baseStatus = 404;
  try { const r = await fetchT(origin + '/cyberkit-' + Math.random().toString(36).slice(2) + '-nope', { redirect: 'manual' }, 7000); baseStatus = r.status; } catch {}

  const results = await pool(words, 8, async (w) => {
    try {
      const r = await fetchT(origin + '/' + w, { headers: { 'user-agent': 'CyberKit dirbrute' }, redirect: 'manual' }, 7000);
      const len = r.headers.get('content-length');
      return { path: '/' + w, status: r.status, length: len ? Number(len) : undefined, location: r.headers.get('location') || undefined };
    } catch { return { path: '/' + w, status: 0 }; }
  });

  const hits = results.filter(r => r.status && r.status !== 0 && !(r.status === baseStatus) && r.status !== 404)
    .sort((a, b) => a.status - b.status);
  return json({ url: origin, tested: words.length, baselineStatus: baseStatus, hits, note: 'Soft-404 servers may still list false positives; verify each hit.' });
}
