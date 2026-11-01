import { h, field, input, button, row, note, warn, findings } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'headers', cat: 'web', tier: 'b',
  title: 'Security headers',
  desc: 'Grade the response security headers',
  render(root) {
    const url = input({ placeholder: 'https://example.com', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('requesting…'));
      try {
        const d = await apiGet('/headers', { url: url.value.trim() }, { consent: true });
        out.innerHTML = '';
        out.append(h('div', { class: 'row' }, h('span', { class: 'note' }, d.url + ' — HTTP ' + d.status), h('span', { class: 'grade grade-' + d.grade }, 'grade ' + d.grade + ' (' + d.score + '/' + d.max + ')')));
        out.append(h('h4', {}, 'findings'), findings(d.findings));
        const present = Object.entries(d.present || {});
        if (present.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'header'), h('th', {}, 'value')));
          for (const [k, v] of present) t.append(h('tr', {}, h('td', { class: 'mono' }, k), h('td', { class: 'mono' }, v.slice(0, 120))));
          out.append(h('details', {}, h('summary', {}, 'present headers'), t));
        }
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Makes one request to the URL you name. Use it only on systems you own or are authorised to test.'),
      row(field('URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Check', run)))),
      field('', consent.el), out,
      note('Checks HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, and flags information-leak headers.'));
  },
};
