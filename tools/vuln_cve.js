import { h, field, input, button, row, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

const SEV = { CRITICAL: '#f85149', HIGH: '#db6d28', MEDIUM: '#d29922', LOW: '#3fb950', NONE: '#8b949e' };

export default {
  id: 'cve', cat: 'vuln', tier: 'b',
  title: 'CVE search',
  desc: 'NVD lookup by id or keyword (passive)',
  render(root) {
    const q = input({ placeholder: 'CVE-2021-44228  or  keyword', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('searching NVD…'));
      const v = q.value.trim();
      const params = /^cve-\d{4}-\d+$/i.test(v) ? { id: v } : { keyword: v };
      try {
        const d = await apiGet('/cve', params);
        out.innerHTML = '';
        out.append(h('div', { class: 'note' }, d.total + ' result' + (d.total === 1 ? '' : 's') + ' for "' + d.query + '"'));
        for (const r of d.results || []) {
          const sev = r.cvss?.severity;
          out.append(h('div', { class: 'card2' },
            h('div', { class: 'row' }, h('strong', { class: 'mono' }, r.id),
              sev ? h('span', { class: 'pill', html: '', style: 'background:' + (SEV[sev] || '#8b949e') + ';color:#000' }, sev + ' ' + r.cvss.score) : null,
              h('span', { class: 'note' }, (r.published || '').slice(0, 10))),
            h('div', {}, r.description || ''),
            r.cvss ? h('div', { class: 'note mono' }, r.cvss.vector || '') : null));
        }
        if (!(d.results || []).length) out.append(h('div', { class: 'out' }, 'no matches'));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('CVE id or keyword', q, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Search', run)))), out,
      note('Queries the NVD API. Without an API key the NVD throttles hard, so a busy period may need a retry.'));
  },
};
