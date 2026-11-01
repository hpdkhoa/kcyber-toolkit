import { h, field, input, button, row, note, warn } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'fingerprint', cat: 'recon', tier: 'b',
  title: 'HTTP fingerprint',
  desc: 'Redirects, server, technologies',
  render(root) {
    const url = input({ placeholder: 'https://example.com', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('requesting…'));
      try {
        const d = await apiGet('/fingerprint', { url: url.value.trim() }, { consent: true });
        out.innerHTML = '';
        out.append(h('table', { class: 'kv' },
          d.title ? h('tr', {}, h('td', {}, 'title'), h('td', {}, d.title)) : null,
          h('tr', {}, h('td', {}, 'final URL'), h('td', { class: 'mono' }, d.finalUrl + ' (HTTP ' + d.status + ')')),
          d.server ? h('tr', {}, h('td', {}, 'server'), h('td', { class: 'mono' }, d.server)) : null,
          d.poweredBy ? h('tr', {}, h('td', {}, 'x-powered-by'), h('td', { class: 'mono' }, d.poweredBy)) : null));
        if (d.technologies?.length) out.append(h('div', { class: 'chips' }, ...d.technologies.map(t => h('span', { class: 'chip' }, t))));
        if (d.redirectChain?.length > 1) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'url'), h('th', {}, 'status'), h('th', {}, '→ location')));
          for (const hop of d.redirectChain) t.append(h('tr', {}, h('td', { class: 'mono' }, hop.url), h('td', {}, String(hop.status)), h('td', { class: 'mono' }, hop.location || '')));
          out.append(h('details', {}, h('summary', {}, 'redirect chain (' + d.redirectChain.length + ')'), t));
        }
        const ht = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'header'), h('th', {}, 'value')));
        for (const [k, v] of Object.entries(d.headers || {})) ht.append(h('tr', {}, h('td', { class: 'mono' }, k), h('td', { class: 'mono' }, String(v).slice(0, 140))));
        out.append(h('details', {}, h('summary', {}, 'response headers'), ht));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Makes requests to the URL you name (following redirects). Authorised targets only.'),
      row(field('URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Fingerprint', run)))),
      field('', consent.el), out,
      note('Detects frameworks, CMSs and CDNs from headers, cookies and the HTML. Best-effort, not exhaustive.'));
  },
};
