// CVE lookup via the NVD API 2.0. Passive. Search by CVE id or keyword.
// NVD throttles hard without a key; bind env.NVD_KEY to raise the ceiling.
import { json, bad, rateLimit, tooMany, fetchT } from './_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const rl = await rateLimit(request, env, { tag: 'cve', limit: 10, windowMs: 60000 });
  if (!rl.ok) return tooMany(rl.retryAfter);
  const q = new URL(request.url).searchParams;
  const id = (q.get('id') || '').trim().toUpperCase();
  const kw = (q.get('keyword') || '').trim();
  if (!id && !kw) return bad('id (CVE-YYYY-NNNN) or keyword required');
  let url = 'https://services.nvd.nist.gov/rest/json/cves/2.0?';
  if (id) {
    if (!/^CVE-\d{4}-\d{4,}$/.test(id)) return bad('id must look like CVE-2021-44228');
    url += 'cveId=' + id;
  } else {
    url += 'keywordSearch=' + encodeURIComponent(kw) + '&resultsPerPage=20';
  }
  const headers = { accept: 'application/json' };
  if (env && env.NVD_KEY) headers.apiKey = env.NVD_KEY;
  let d;
  try {
    const r = await fetchT(url, { headers, redirect: 'follow' }, 20000);
    if (r.status === 403 || r.status === 429) return bad('NVD throttled the request; try again shortly or add an API key', 429);
    d = await r.json();
  } catch (e) { return bad('NVD failed: ' + e.message, 502); }
  const items = (d.vulnerabilities || []).map(v => {
    const c = v.cve;
    const metric = pickMetric(c.metrics);
    return {
      id: c.id, published: c.published, lastModified: c.lastModified,
      status: c.vulnStatus,
      description: (c.descriptions || []).find(x => x.lang === 'en')?.value,
      cvss: metric ? { version: metric.version, score: metric.baseScore, severity: metric.baseSeverity, vector: metric.vectorString } : undefined,
      refs: (c.references || []).slice(0, 8).map(r => r.url),
    };
  });
  return json({ query: id || kw, total: d.totalResults ?? items.length, results: items });
}

function pickMetric(m) {
  if (!m) return null;
  const order = ['cvssMetricV31', 'cvssMetricV30', 'cvssMetricV2'];
  for (const k of order) {
    if (m[k] && m[k][0]) {
      const d = m[k][0].cvssData;
      return { version: d.version, baseScore: d.baseScore, baseSeverity: d.baseSeverity || m[k][0].baseSeverity, vectorString: d.vectorString };
    }
  }
  return null;
}
