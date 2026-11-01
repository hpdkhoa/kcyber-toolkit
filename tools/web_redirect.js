import { h, field, input, button, row, note, warn, findings } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'redirect', cat: 'web', tier: 'b',
  title: 'Open-redirect tester',
  desc: 'Inject a canary into redirect params',
  render(root) {
    const url = input({ placeholder: 'https://example.com/go  (or a URL with ?next=)', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('testing redirect parameters…'));
      try {
        const d = await apiGet('/redirect', { url: url.value.trim() }, { consent: true });
        out.innerHTML = '';
        out.append(d.vulnerable ? h('div', { class: 'out err' }, 'OPEN REDIRECT — ' + d.findings.length + ' parameter(s) redirect off-site') : h('div', { class: 'out ok' }, d.note));
        if (d.findings?.length) {
          const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'param'), h('th', {}, 'payload'), h('th', {}, 'status'), h('th', {}, 'location')));
          for (const f of d.findings) t.append(h('tr', {}, h('td', { class: 'mono' }, f.param), h('td', { class: 'mono' }, f.payload), h('td', {}, String(f.status)), h('td', { class: 'mono' }, f.location)));
          out.append(t);
        }
        out.append(h('div', { class: 'note' }, 'tested parameters: ' + (d.paramsTested || []).join(', ')));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Sends crafted requests to the URL you name. Authorised targets only. Full blind-SSRF detection needs an out-of-band collaborator and is out of scope here.'),
      row(field('URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Test', run)))),
      field('', consent.el), out,
      note('If the URL has parameters, those are tested; otherwise a set of common redirect parameter names is swept with an external canary.'));
  },
};
