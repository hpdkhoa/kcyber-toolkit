import { h, field, input, button, row, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'whois', cat: 'recon', tier: 'b',
  title: 'WHOIS / RDAP',
  desc: 'Registration data for a domain or IP (passive)',
  render(root) {
    const q = input({ placeholder: 'example.com  or  1.1.1.1', class: 'mono' });
    const out = h('div');
    const kv = (k, v) => v == null || (Array.isArray(v) && !v.length) ? null : h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, Array.isArray(v) ? v.join(', ') : String(v)));
    const run = async () => {
      out.innerHTML = ''; out.append(note('querying…'));
      try {
        const d = await apiGet('/whois', { q: q.value.trim() });
        out.innerHTML = '';
        if (!d.found) { out.append(h('div', { class: 'out' }, d.note || 'not found')); return; }
        out.append(h('table', { class: 'kv' },
          kv('name', d.ldhName), kv('handle', d.handle),
          kv('registrar', d.registrar),
          kv('registered', d.registered), kv('expires', d.expires), kv('last changed', d.lastChanged),
          kv('status', d.status), kv('nameservers', d.nameservers),
          kv('range', d.startAddress && (d.startAddress + ' – ' + d.endAddress)), kv('CIDR', d.cidr?.map(c => c.v4prefix || c.v6prefix ? (c.v4prefix || c.v6prefix) + '/' + c.length : '')),
          kv('country', d.country), kv('RDAP server', d.rdapServer)));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    q.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('domain or IP', q, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Lookup', run)))), out,
      note('Queries the authoritative RDAP server (resolved from the IANA bootstrap). Public registration data only.'));
  },
};
