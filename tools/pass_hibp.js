import { h, field, input, button, row, note, warn, toHex, enc } from '../assets/js/ui.js';
import { apiGet } from '../assets/js/api.js';

export default {
  id: 'hibp', cat: 'pass', tier: 'b',
  title: 'Breach check',
  desc: 'Have I Been Pwned (k-anonymity)',
  render(root) {
    const pw = input({ type: 'password', placeholder: 'password to test', class: 'mono' });
    const show = h('input', { type: 'checkbox' });
    show.addEventListener('change', () => { pw.type = show.checked ? 'text' : 'password'; });
    const out = h('div');
    const run = async () => {
      out.innerHTML = ''; out.append(note('hashing locally and checking the range…'));
      try {
        const digest = await crypto.subtle.digest('SHA-1', enc.encode(pw.value));
        const hashHex = toHex(digest).toUpperCase();
        const prefix = hashHex.slice(0, 5), suffix = hashHex.slice(5);
        const d = await apiGet('/hibp', { prefix });
        const hit = (d.suffixes || []).find(s => s.suffix === suffix);
        out.innerHTML = '';
        out.append(h('div', { class: 'note mono' }, 'SHA-1 ' + prefix + '… (only these 5 chars were sent; ' + d.returned + ' candidates returned)'));
        out.append(hit
          ? h('div', { class: 'out err' }, 'PWNED — this password appears in breach corpora ' + hit.count.toLocaleString() + ' time' + (hit.count === 1 ? '' : 's') + '. Do not use it.')
          : h('div', { class: 'out ok' }, 'not found in the Pwned Passwords set. (Absence is not proof a password is strong.)'));
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, e.message)); }
    };
    pw.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
    root.append(
      warn('The password is hashed in your browser with SHA-1. Only the first 5 hex characters of that hash are sent (k-anonymity). The password itself never leaves the browser.'),
      row(field('password', pw, { grow: true }), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Check', run)))),
      field('', h('label', { class: 'inline' }, show, ' show')),
      out,
      note('Uses the HIBP Pwned Passwords range API. Checking an email/account instead needs a paid HIBP key on the backend.'));
  },
};
