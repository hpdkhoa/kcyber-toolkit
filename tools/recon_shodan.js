import { h, field, input, button, row, note } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'shodan', cat: 'recon', tier: 'b',
  title: 'Shodan lookup',
  desc: 'Host data from Shodan (needs key)',
  render(root) {
    const ip = input({ placeholder: '1.1.1.1', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('querying Shodan…'));
      try {
        const d = await apiGet('/shodan', { ip: ip.value.trim() });
        out.innerHTML = '';
        if (!d.found) { out.append(h('div', { class: 'out' }, d.note || 'no data')); return; }
        out.append(h('table', { class: 'kv' },
          h('tr', {}, h('td', {}, 'org'), h('td', {}, d.org || '')),
          h('tr', {}, h('td', {}, 'ASN'), h('td', {}, d.asn || '')),
          h('tr', {}, h('td', {}, 'location'), h('td', {}, [d.city, d.country].filter(Boolean).join(', '))),
          h('tr', {}, h('td', {}, 'hostnames'), h('td', { class: 'mono' }, (d.hostnames || []).join(', '))),
          h('tr', {}, h('td', {}, 'ports'), h('td', { class: 'mono' }, (d.ports || []).join(', '))),
          d.vulns ? h('tr', {}, h('td', {}, 'vulns'), h('td', { class: 'mono' }, (d.vulns || []).join(', '))) : null));
        if (d.services?.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'port'), h('th', {}, 'product'), h('th', {}, 'banner')));
          for (const s of d.services) t.append(h('tr', {}, h('td', {}, s.port + '/' + (s.transport || '')), h('td', {}, [s.product, s.version].filter(Boolean).join(' ')), h('td', { class: 'mono' }, (s.banner || '').slice(0, 80))));
          out.append(h('details', {}, h('summary', {}, 'services'), t));
        }
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    ip.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('IP address', ip, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Lookup', run)))), out,
      note('Reads the Shodan database (passive). Needs a Shodan API key configured on the backend (env.SHODAN_KEY).'));
  },
};
