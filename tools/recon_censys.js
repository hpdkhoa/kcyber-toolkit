import { h, field, input, button, row, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'censys', cat: 'recon', tier: 'b',
  title: 'Censys lookup',
  desc: 'Host data from Censys (needs token)',
  render(root) {
    const ip = input({ placeholder: '1.1.1.1', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('querying Censys…'));
      try {
        const d = await apiGet('/censys', { ip: ip.value.trim() });
        out.innerHTML = '';
        if (!d.found) { out.append(h('div', { class: 'out' }, d.note || 'no data')); return; }
        const as = d.autonomousSystem || {};
        out.append(h('table', { class: 'kv' },
          h('tr', {}, h('td', {}, 'ASN'), h('td', {}, (as.asn ? 'AS' + as.asn : '') + ' ' + (as.name || ''))),
          h('tr', {}, h('td', {}, 'location'), h('td', {}, [d.location?.city, d.location?.country].filter(Boolean).join(', ')))));
        if (d.services?.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'port'), h('th', {}, 'protocol'), h('th', {}, 'software')));
          for (const s of d.services) t.append(h('tr', {}, h('td', {}, s.port + '/' + (s.transport || '')), h('td', {}, s.protocol || ''), h('td', { class: 'mono' }, JSON.stringify(s.software || '').slice(0, 80))));
          out.append(t);
        }
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    ip.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('IP address', ip, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Lookup', run)))), out,
      note('Reads the Censys database (passive). Needs a Censys Personal Access Token on the backend (env.CENSYS_PAT).'));
  },
};
