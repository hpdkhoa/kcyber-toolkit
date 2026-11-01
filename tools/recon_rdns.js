import { h, field, input, button, row, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'rdns', cat: 'recon', tier: 'b',
  title: 'Reverse DNS',
  desc: 'PTR record for an IP (passive)',
  render(root) {
    const ip = input({ placeholder: '1.1.1.1', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('querying…'));
      try {
        const d = await apiGet('/rdns', { ip: ip.value.trim() });
        out.innerHTML = '';
        if (!d.found) { out.append(h('div', { class: 'out' }, 'no PTR record for ' + d.ip)); return; }
        out.append(h('table', { class: 'kv' },
          h('tr', {}, h('td', {}, 'ip'), h('td', { class: 'mono' }, d.ip)),
          h('tr', {}, h('td', {}, 'query'), h('td', { class: 'mono' }, d.query)),
          h('tr', {}, h('td', {}, 'PTR'), h('td', { class: 'mono' }, d.ptr.join(', ')))));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    ip.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('IP address', ip, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Resolve', run)))), out,
      note('Looks up the PTR record over DoH. IPv4 and IPv6.'));
  },
};
