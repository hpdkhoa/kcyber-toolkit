import { h, field, input, button, row, note, findings } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'spf', cat: 'social', tier: 'b',
  title: 'SPF / DKIM / DMARC',
  desc: 'Email authentication analyzer (passive)',
  render(root) {
    const domain = input({ placeholder: 'example.com', class: 'mono' });
    const selector = input({ placeholder: 'DKIM selector (optional, e.g. google)', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('reading DNS…'));
      try {
        const d = await apiGet('/spf', { domain: domain.value.trim(), selector: selector.value.trim() });
        out.innerHTML = '';
        out.append(h('table', { class: 'kv' },
          h('tr', {}, h('td', {}, 'SPF'), h('td', { class: 'mono' }, d.spf || '—')),
          h('tr', {}, h('td', {}, 'DMARC'), h('td', { class: 'mono' }, d.dmarc || '—')),
          d.dkim ? h('tr', {}, h('td', {}, 'DKIM (' + d.dkim.selector + ')'), h('td', { class: 'mono' }, d.dkim.found ? (d.dkim.record || '').slice(0, 120) : 'not found')) : null));
        out.append(h('h4', {}, 'findings'), findings(d.findings));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    domain.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(
      row(field('domain', domain, { grow: true }), field('DKIM selector', selector)),
      row(h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Analyze', run)))),
      out,
      note('Reads SPF and DMARC TXT records over DoH, and a DKIM key if you give the selector. Passive, DNS only.'));
  },
};
