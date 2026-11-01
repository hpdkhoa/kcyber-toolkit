import { h, field, input, textarea, select, button, row, note, warn } from '../assets/js/ui.js';
import { apiPost, consentBox } from '../assets/js/api.js';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export default {
  id: 'httpreq', cat: 'web', tier: 'b',
  title: 'Request replay',
  desc: 'Send a crafted HTTP request (Repeater)',
  render(root) {
    const method = select(METHODS);
    const url = input({ placeholder: 'https://example.com/api', class: 'mono' });
    const headers = textarea({ placeholder: 'X-Header: value\nAuthorization: Bearer ...', class: 'mono' });
    const body = textarea({ placeholder: 'request body (for POST/PUT/PATCH)', class: 'mono' });
    const follow = h('input', { type: 'checkbox' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('sending…'));
      try {
        const d = await apiPost('/httpreq', { method: method.value, url: url.value.trim(), headers: headers.value, body: body.value, followRedirects: follow.checked }, { consent: true });
        out.innerHTML = '';
        out.append(h('div', { class: 'row' }, h('strong', {}, 'HTTP ' + d.status + ' ' + (d.statusText || '')), h('span', { class: 'note' }, d.timeMs + ' ms · ' + d.size + ' bytes')));
        const ht = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'response header'), h('th', {}, 'value')));
        for (const [k, v] of Object.entries(d.headers || {})) ht.append(h('tr', {}, h('td', { class: 'mono' }, k), h('td', { class: 'mono' }, String(v).slice(0, 160))));
        out.append(h('details', { open: true }, h('summary', {}, 'response headers'), ht));
        out.append(h('details', { open: true }, h('summary', {}, 'body' + (d.truncated ? ' (truncated)' : '')), h('pre', { class: 'out mono' }, d.body || '')));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Sends your exact request to the URL you name, through the backend. Authorised targets only. Private and loopback hosts are refused unless the deploy opts in.'),
      row(field('method', method), field('URL', url, { grow: true })),
      field('request headers (one per line)', headers, { grow: true }),
      field('body', body, { grow: true }),
      row(field('', h('label', { class: 'inline' }, follow, ' follow redirects')), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Send', run)))),
      field('', consent.el), out,
      note('Private/loopback/metadata hosts are blocked by default (SSRF guard).'));
  },
};
