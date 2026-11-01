import { h, field, input, button, row, note, warn, findings } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'cookies', cat: 'web', tier: 'b',
  title: 'Cookie / CORS analyzer',
  desc: 'Cookie flags and CORS reflection',
  render(root) {
    const url = input({ placeholder: 'https://example.com', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const yn = b => b ? 'yes' : 'no';
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('requesting…'));
      try {
        const d = await apiGet('/cookies', { url: url.value.trim() }, { consent: true });
        out.innerHTML = '';
        out.append(h('div', { class: 'note' }, d.url + ' — ' + d.cookieCount + ' cookie' + (d.cookieCount === 1 ? '' : 's')));
        if (d.cookies.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'name'), h('th', {}, 'Secure'), h('th', {}, 'HttpOnly'), h('th', {}, 'SameSite')));
          for (const c of d.cookies) t.append(h('tr', {}, h('td', { class: 'mono' }, c.name), h('td', {}, yn(c.secure)), h('td', {}, yn(c.httpOnly)), h('td', {}, c.sameSite || '—')));
          out.append(t);
        }
        out.append(h('table', { class: 'kv' },
          h('tr', {}, h('td', {}, 'CORS allow-origin'), h('td', { class: 'mono' }, d.cors.allowOrigin || '—')),
          h('tr', {}, h('td', {}, 'allow-credentials'), h('td', { class: 'mono' }, d.cors.allowCredentials || '—'))));
        out.append(h('h4', {}, 'findings'), findings(d.findings));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Makes one request to the URL you name (with a test Origin header). Authorised targets only.'),
      row(field('URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Analyze', run)))),
      field('', consent.el), out,
      note('Reads Set-Cookie flags and probes whether the server reflects an arbitrary CORS Origin.'));
  },
};
