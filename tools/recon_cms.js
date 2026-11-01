import { h, field, input, button, row, note, warn } from '../assets/js/ui.js';
import { apiGet, consentBox } from '../assets/js/api.js';

export default {
  id: 'cms', cat: 'recon', tier: 'b',
  title: 'CMS detect',
  desc: 'Probe known CMS paths',
  render(root) {
    const url = input({ placeholder: 'https://example.com', class: 'mono' });
    const consent = consentBox();
    const out = h('div');
    const run = async () => {
      if (!consent.ok()) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'tick the authorisation box first')); return; }
      out.innerHTML = ''; out.append(note('probing…'));
      try {
        const d = await apiGet('/cms', { url: url.value.trim() }, { consent: true });
        out.innerHTML = '';
        if (!d.detected.length) { out.append(h('div', { class: 'out' }, d.note || 'no CMS matched')); return; }
        for (const r of d.detected) {
          out.append(h('div', { class: 'card2' },
            h('div', { class: 'row' }, h('strong', {}, r.cms), h('span', { class: 'pill ' + (r.confidence === 'high' ? 'b' : 'a') }, r.confidence + ' confidence'), h('span', { class: 'note' }, r.hits + '/' + r.of + ' probes')),
            h('div', { class: 'note mono' }, r.evidence.join('  '))));
        }
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    root.append(
      warn('Requests a small set of known CMS paths on the host you name. Authorised targets only.'),
      row(field('URL', url, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Detect', run)))),
      field('', consent.el), out,
      note('Checks WordPress, Drupal, Joomla, Magento, Ghost and TYPO3 by their characteristic paths.'));
  },
};
