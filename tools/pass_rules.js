import { h, field, textarea, row, button, output, note, download, enc } from '../assets/js/ui.js';

const LEET = { a: '@', e: '3', i: '1', o: '0', s: '$', t: '7' };
// hashcat-style rules, each maps a word to one or more words
const RULES = {
  'l  lowercase': w => w.toLowerCase(),
  'u  uppercase': w => w.toUpperCase(),
  'c  capitalise': w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w,
  'r  reverse': w => [...w].reverse().join(''),
  'd  duplicate': w => w + w,
  "$! append !": w => w + '!',
  '$1 append 1': w => w + '1',
  '$123 append 123': w => w + '123',
  'append 0-9': w => Array.from({ length: 10 }, (_, i) => w + i),
  'append 00-99': w => Array.from({ length: 100 }, (_, i) => w + String(i).padStart(2, '0')),
  'append year 2000-2025': w => Array.from({ length: 26 }, (_, i) => w + (2000 + i)),
  'sa leet': w => [...w].map(c => LEET[c.toLowerCase()] || c).join(''),
  '^1 prepend 1': w => '1' + w,
};

export default {
  id: 'rules', cat: 'pass', tier: 'a',
  title: 'Rule / mutation engine',
  desc: 'Apply hashcat-style rules to a base list',
  render(root) {
    const base = textarea({ placeholder: 'base words, one per line' });
    const chips = h('div', { class: 'chips' });
    const picks = {};
    for (const name of Object.keys(RULES)) { const cb = h('input', { type: 'checkbox' }); picks[name] = cb; chips.append(h('label', { class: 'chip' }, cb, ' ' + name)); }
    const keepBase = h('input', { type: 'checkbox' }); keepBase.checked = true;
    const out = output();
    let last = [];
    const run = () => {
      const words = base.value.split(/\n/).map(s => s.trim()).filter(Boolean);
      const chosen = Object.keys(RULES).filter(n => picks[n].checked);
      const set = new Set();
      for (const w of words) {
        if (keepBase.checked) set.add(w);
        for (const n of chosen) { const r = RULES[n](w); (Array.isArray(r) ? r : [r]).forEach(x => set.add(x)); }
      }
      last = [...set].slice(0, 50000);
      out.set(last.slice(0, 500).join('\n') + (last.length > 500 ? '\n... (' + (last.length - 500) + ' more)' : ''), 'ok');
      cnt.textContent = last.length + ' words';
    };
    const cnt = h('div', { class: 'note' });
    [base, keepBase, ...Object.values(picks)].forEach(el => el.addEventListener('input', run));
    root.append(
      field('base words', base, { grow: true }),
      h('div', { class: 'row' }, h('label', { class: 'chip' }, keepBase, ' keep base words')),
      field('rules', chips),
      row(button('Apply', run), button('Download .txt', () => download(enc.encode(last.join('\n')), 'mutated.txt', 'text/plain'), 'alt')),
      cnt, out.el, note('Capped at 50,000 lines.'));
    run();
  },
};
