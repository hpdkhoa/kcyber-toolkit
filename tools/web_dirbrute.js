import { h, field, input, textarea, button, row, note, warn } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'dirbrute', cat: 'web', tier: 'b',
  title: 'Directory brute',
  desc: 'Probe common paths (built-in wordlist)',
  render(root) {
    const url = input({ placeholder: 'https://example.com', class: 'mono' });
    const extra = textarea({ placeholder: 'extra paths, space or comma separated (optional)', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('probing…'));
      try {
        const d = await apiGet('/dirbrute', { url: url.value.trim(), extra: extra.value.trim() }, { consent: true });
        out.innerHTML = '';
        out.append(h('div', { class: 'note' }, 'tested ' + d.tested + ' paths · not-found baseline HTTP ' + d.baselineStatus + ' · ' + d.hits.length + ' hit(s)'));
        if (d.hits.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'path'), h('th', {}, 'status'), h('th', {}, 'length'), h('th', {}, 'location')));
          for (const r of d.hits) t.append(h('tr', {}, h('td', { class: 'mono' }, r.path), h('td', {}, String(r.status)), h('td', {}, r.length != null ? String(r.length) : ''), h('td', { class: 'mono' }, r.location || '')));
          out.append(t);
        } else out.append(h('div', { class: 'out' }, 'nothing stood out from the baseline'));
        out.append(h('div', { class: 'note' }, d.note));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Sends many requests to the host you name. Rate-limited and capped. Authorised targets only.'),
      row(field('base URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Run', run)))),
      field('extra paths', extra, { grow: true }),
      field('', consent.el), out,
      note('Built-in list of ~70 common paths plus any you add. Results above the not-found baseline are shown; verify each hit.'));
  },
};
