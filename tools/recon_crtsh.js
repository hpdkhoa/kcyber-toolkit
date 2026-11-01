import { h, field, input, button, row, note, copyText, download, enc } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'crtsh', cat: 'recon', tier: 'b',
  title: 'Certificate search',
  desc: 'crt.sh CT logs + passive subdomains',
  render(root) {
    const domain = input({ placeholder: 'example.com', class: 'mono' });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('searching crt.sh (can take a while)…'));
      try {
        const d = await apiGet('/crtsh', { domain: domain.value.trim() });
        out.innerHTML = '';
        out.append(h('div', { class: 'note' }, d.subdomainCount + ' subdomain' + (d.subdomainCount === 1 ? '' : 's') + ' from ' + d.certCount + ' certificate' + (d.certCount === 1 ? '' : 's')));
        if (d.subdomains.length) {
          const list = d.subdomains.join('\n');
          out.append(row(
            button('copy subdomains', () => copyText(list)),
            button('download .txt', () => download(enc.encode(list), d.domain + '-subdomains.txt', 'text/plain'))));
          out.append(h('pre', { class: 'out mono' }, list));
        }
        if (d.certs?.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'CN'), h('th', {}, 'issuer'), h('th', {}, 'not after')));
          for (const c of d.certs.slice(0, 50)) t.append(h('tr', {}, h('td', { class: 'mono' }, c.cn || ''), h('td', {}, (c.issuer || '').slice(0, 60)), h('td', { class: 'mono' }, c.notAfter || '')));
          out.append(h('details', {}, h('summary', {}, 'certificates (' + Math.min(d.certs.length, 50) + ' shown)'), t));
        }
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    domain.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(row(field('domain', domain, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Search', run)))), out,
      note('Reads public certificate-transparency logs. Expired certs are excluded for speed. Passive: nothing is sent to the domain.'));
  },
};
