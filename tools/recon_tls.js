import { h, field, input, button, row, note, warn } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default {
  id: 'tls', cat: 'recon', tier: 'b',
  title: 'TLS / SSL scan',
  desc: 'Protocols, grade and certificate (SSL Labs)',
  render(root) {
    const host = input({ placeholder: 'example.com', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    let runId = 0;
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      const me = ++runId;
      const h0 = host.value.trim();
      out.innerHTML = ''; out.append(note('starting SSL Labs scan (can take 1–2 minutes)…'));
      try {
        let d = await apiGet('/tls', { host: h0, start: 1 }, { consent: true });
        for (let i = 0; i < 30 && me === runId && d.status !== 'READY' && d.status !== 'ERROR'; i++) {
          out.innerHTML = '';
          out.append(note('SSL Labs: ' + d.status + (d.statusMessage ? ' — ' + d.statusMessage : '') + ' …'));
          if (d.progress?.length) out.append(h('div', { class: 'note mono' }, d.progress.map(p => (p.ip || '') + ' ' + (p.progress ?? '') + '%').join('  ')));
          await sleep(6000);
          if (me !== runId) return;
          d = await apiGet('/tls', { host: h0 }, { consent: true });
        }
        if (me !== runId) return;
        out.innerHTML = '';
        if (d.status !== 'READY') { out.append(h('div', { class: 'out err' }, 'SSL Labs: ' + d.status + (d.statusMessage ? ' — ' + d.statusMessage : ''))); return; }
        for (const e of d.endpoints || []) {
          out.append(h('div', { class: 'row' }, h('strong', { class: 'mono' }, e.ip), h('span', { class: 'grade grade-' + (e.grade || '?')[0] }, 'grade ' + (e.grade || '?'))));
          out.append(h('table', { class: 'kv' },
            h('tr', {}, h('td', {}, 'protocols'), h('td', { class: 'mono' }, (e.protocols || []).join(', '))),
            h('tr', {}, h('td', {}, 'forward secrecy'), h('td', {}, e.forwardSecrecy >= 2 ? 'yes' : 'partial/no')),
            h('tr', {}, h('td', {}, 'RC4'), h('td', {}, e.supportsRc4 ? 'yes (weak)' : 'no')),
            h('tr', {}, h('td', {}, 'Heartbleed / POODLE'), h('td', {}, (e.heartbleed ? 'vulnerable' : 'no') + ' / ' + (e.poodle ? 'vulnerable' : 'no'))),
            e.cert ? h('tr', {}, h('td', {}, 'certificate'), h('td', { class: 'mono' }, (e.cert.subject || '') + ' · ' + (e.cert.keyAlg || '') + ' ' + (e.cert.keySize || '') + ' · exp ' + (e.cert.notAfter || '').slice(0, 10))) : null));
        }
      } catch (e) { if (me === runId) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); } }
    };
    root.append(
      warn('Starts a Qualys SSL Labs scan of the host you name (SSL Labs connects to it). Authorised targets only.'),
      row(field('host', host, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Scan', run)))),
      field('', consent.el), out,
      note('A serverless worker cannot read TLS internals itself, so this uses the public SSL Labs API. The scan is slow; results poll in automatically.'));
  },
};
