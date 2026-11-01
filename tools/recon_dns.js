import { h, field, input, select, row, button, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

const TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'SRV', 'CAA', 'PTR'];

export default {
  id: 'livedns', cat: 'recon', tier: 'b',
  title: 'DNS lookup',
  desc: 'Resolve records over DoH (passive)',
  render(root) {
    const name = input({ placeholder: 'example.com', class: 'mono' });
    const type = select(TYPES);
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('querying…'));
      try {
        const d = await apiGet('/dns', { name: name.value.trim(), type: type.value });
        out.innerHTML = '';
        out.append(h('div', { class: 'note' }, d.name + ' ' + d.type + ' — ' + d.rcode + ' (' + d.answers.length + ' answer' + (d.answers.length === 1 ? '' : 's') + ')'));
        if (d.answers.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'name'), h('th', {}, 'type'), h('th', {}, 'ttl'), h('th', {}, 'data')));
          for (const a of d.answers) t.append(h('tr', {}, h('td', { class: 'mono' }, a.name), h('td', {}, a.type), h('td', {}, String(a.ttl)), h('td', { class: 'mono' }, a.data)));
          out.append(t);
        }
        if (d.authority?.length) out.append(h('div', { class: 'note' }, 'authority: ' + d.authority.join(', ')));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    name.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(
      row(field('domain', name, { grow: true }), field('type', type), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Lookup', run)))),
      out,
      note('DNS-over-HTTPS through the backend. It queries public resolvers, it does not connect to the host.'));
  },
};
