import { h, field, input, textarea, row, button, output, note, download, enc } from '../assets/js/ui.js';

const LEET = { a: '@', e: '3', i: '1', o: '0', s: '$', t: '7' };
function leet(w) { return [...w].map(c => LEET[c.toLowerCase()] || c).join(''); }
function caps(w) { return [w, w.toLowerCase(), w.toUpperCase(), w[0].toUpperCase() + w.slice(1).toLowerCase()]; }

export default {
  id: 'wordlist', cat: 'pass', tier: 'a',
  title: 'Wordlist generator',
  desc: 'Build candidates from keywords and patterns',
  render(root) {
    const words = textarea({ placeholder: 'base keywords, one per line (names, company, pet, city...)' });
    const y0 = input({ type: 'number', value: '2015' });
    const y1 = input({ type: 'number', value: '2025' });
    const suffixes = input({ value: '!,123,@,1,2024,#' });
    const opt = {};
    const chips = h('div', { class: 'chips' });
    for (const [k, l] of [['caps', 'case variants'], ['leet', 'leet substitution'], ['years', 'append years'], ['suf', 'append suffixes'], ['combine', 'combine two words']]) {
      const cb = h('input', { type: 'checkbox' }); if (k !== 'combine') cb.checked = true; opt[k] = cb;
      chips.append(h('label', { class: 'chip' }, cb, ' ' + l));
    }
    const out = output();
    let last = [];
    const run = () => {
      const base = words.value.split(/\n/).map(s => s.trim()).filter(Boolean);
      let set = new Set();
      let variants = [];
      for (const w of base) variants.push(...(opt.caps.checked ? caps(w) : [w]));
      if (opt.combine.checked) { const extra = []; for (const a of base) for (const b of base) if (a !== b) extra.push(a + b); variants.push(...extra); }
      if (opt.leet.checked) variants.push(...variants.map(leet));
      const sufs = opt.suf.checked ? suffixes.value.split(',').map(s => s.trim()) : [];
      const years = opt.years.checked ? Array.from({ length: Math.max(0, (+y1.value) - (+y0.value) + 1) }, (_, i) => String(+y0.value + i)) : [];
      for (const v of variants) {
        set.add(v);
        for (const s of sufs) set.add(v + s);
        for (const y of years) set.add(v + y);
      }
      last = [...set].slice(0, 20000);
      out.set(last.slice(0, 500).join('\n') + (last.length > 500 ? '\n... (' + (last.length - 500) + ' more, use Download)' : ''), 'ok');
      cnt.textContent = last.length + ' candidates';
    };
    const cnt = h('div', { class: 'note' });
    [words, y0, y1, suffixes, ...Object.values(opt)].forEach(el => el.addEventListener('input', run));
    root.append(
      field('keywords', words, { grow: true }),
      row(field('year from', y0), field('year to', y1), field('suffixes (comma)', suffixes)),
      field('options', chips),
      row(button('Generate', run), button('Download .txt', () => download(enc.encode(last.join('\n')), 'wordlist.txt', 'text/plain'), 'alt')),
      cnt, out.el,
      note('For cracking your own hashes or authorised testing. Capped at 20,000 lines.'));
    run();
  },
};
