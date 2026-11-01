import { h, field, textarea, note } from '../assets/js/ui.js';

const INTERESTING = /admin|login|backup|\.git|config|private|secret|internal|api|upload|wp-admin|phpmyadmin|test|dev|staging|db|sql/i;

export default {
  id: 'robots', cat: 'web', tier: 'a',
  title: 'robots / sitemap parser',
  desc: 'Read robots.txt and sitemap.xml',
  render(root) {
    const inp = textarea({ placeholder: 'paste robots.txt or sitemap.xml content' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      const txt = inp.value;
      if (!txt.trim()) return;
      if (/<urlset|<sitemapindex|<loc>/i.test(txt)) {
        const urls = [...txt.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m => m[1]);
        const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, '#'), h('th', {}, 'URL')));
        urls.forEach((u, i) => t.append(h('tr', {}, h('td', {}, i + 1), h('td', { class: 'mono' }, u))));
        out.append(h('div', { class: 'note' }, urls.length + ' URL(s) in sitemap'), t);
        return;
      }
      const agents = {}; let cur = '*'; const sitemaps = [];
      for (let line of txt.split('\n')) {
        line = line.replace(/#.*/, '').trim(); if (!line) continue;
        const [k, ...rest] = line.split(':'); const v = rest.join(':').trim();
        const key = k.trim().toLowerCase();
        if (key === 'user-agent') { cur = v; agents[cur] = agents[cur] || { allow: [], disallow: [] }; }
        else if (key === 'disallow') { (agents[cur] = agents[cur] || { allow: [], disallow: [] }).disallow.push(v); }
        else if (key === 'allow') { (agents[cur] = agents[cur] || { allow: [], disallow: [] }).allow.push(v); }
        else if (key === 'sitemap') sitemaps.push(v);
      }
      for (const [ua, r] of Object.entries(agents)) {
        out.append(h('h3', {}, 'User-agent: ' + ua));
        const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'rule'), h('th', {}, 'path')));
        for (const p of r.disallow) t.append(h('tr', {}, h('td', {}, 'Disallow'), h('td', { class: 'mono' }, p, INTERESTING.test(p) ? h('span', { class: 'pill b' }, ' interesting') : null)));
        for (const p of r.allow) t.append(h('tr', {}, h('td', {}, 'Allow'), h('td', { class: 'mono' }, p)));
        out.append(t);
      }
      if (sitemaps.length) out.append(h('div', { class: 'note' }, 'Sitemaps: ' + sitemaps.join(', ')));
    };
    inp.addEventListener('input', run);
    root.append(field('content', inp, { grow: true }),
      note('Paste the file content. Disallowed paths that often hide admin or backup areas are flagged. Fetching a live file is a Tier B tool.'), out);
  },
};
