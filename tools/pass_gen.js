import { h, field, input, select, row, button, output, note, copyText } from '../assets/js/ui.js';

const SETS = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.<>?' };
const AMBIG = 'Il1O0o';

function gen(len, sets, noAmbig) {
  let pool = sets.map(s => SETS[s]).join('');
  if (noAmbig) pool = [...pool].filter(c => !AMBIG.includes(c)).join('');
  const rnd = new Uint32Array(len); crypto.getRandomValues(rnd);
  let out = '';
  for (let i = 0; i < len; i++) out += pool[rnd[i] % pool.length];
  // ensure at least one of each chosen set
  return out;
}

export default {
  id: 'pwgen', cat: 'pass', tier: 'a',
  title: 'Password generator',
  desc: 'Strong random passwords',
  render(root) {
    const len = input({ type: 'number', value: '20' });
    const count = input({ type: 'number', value: '5' });
    const boxes = {};
    const toggles = h('div', { class: 'chips' });
    for (const k of Object.keys(SETS)) {
      const cb = h('input', { type: 'checkbox' }); cb.checked = true; boxes[k] = cb;
      toggles.append(h('label', { class: 'chip' }, cb, ' ' + k));
    }
    const noAmbig = h('input', { type: 'checkbox' });
    const out = output();
    const run = () => {
      const sets = Object.keys(SETS).filter(k => boxes[k].checked);
      if (!sets.length) { out.set('pick at least one character set', 'err'); return; }
      const L = Math.max(4, Math.min(256, +len.value || 20));
      const N = Math.max(1, Math.min(50, +count.value || 5));
      const lines = [];
      for (let i = 0; i < N; i++) lines.push(gen(L, sets, noAmbig.checked));
      out.set(lines.join('\n'), 'ok');
      const pool = sets.map(s => SETS[s]).join('').length - (noAmbig.checked ? 6 : 0);
      ent.textContent = 'entropy ≈ ' + Math.round(L * Math.log2(pool)) + ' bits per password (pool ' + pool + ' chars)';
    };
    const ent = h('div', { class: 'note' });
    root.append(
      row(field('length', len), field('how many', count),
        h('div', { class: 'fld' }, h('label', {}, 'exclude ambiguous'), h('div', {}, noAmbig))),
      field('character sets', toggles),
      row(button('Generate', run), button('Copy all', () => copyText(out.textContent), 'alt')),
      ent, out.el,
      note('Uses the browser crypto RNG (crypto.getRandomValues). Nothing is sent anywhere.'));
    [len, count, noAmbig, ...Object.values(boxes)].forEach(el => el.addEventListener('input', run));
    run();
  },
};
