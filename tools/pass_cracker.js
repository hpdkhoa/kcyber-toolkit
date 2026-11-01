import { h, field, input, textarea, select, filePicker, row, button, output, note, warn, dec } from '../assets/js/ui.js';
import { digestHex } from '../assets/js/hashlib.js';

const byLen = { 32: 'MD5', 40: 'SHA-1', 64: 'SHA-256', 128: 'SHA-512' };

export default {
  id: 'cracker', cat: 'pass', tier: 'a',
  title: 'Hash cracker (wordlist)',
  desc: 'Dictionary crack in the browser',
  render(root) {
    const targets = textarea({ placeholder: 'target hashes, one per line' });
    const algo = select(['auto', 'MD5', 'SHA-1', 'SHA-256', 'SHA-512']);
    const list = textarea({ placeholder: 'wordlist, one candidate per line' });
    const mut = h('input', { type: 'checkbox' });
    const out = output();
    const onfile = b => { list.value = dec.decode(b); };
    const run = async () => {
      const want = targets.value.split(/\n/).map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!want.length) { out.set('enter at least one target hash', 'err'); return; }
      let words = list.value.split(/\n/).map(s => s.trim()).filter(Boolean);
      if (mut.checked) { const ex = []; for (const w of words) { ex.push(w + '1', w + '123', w + '!', w[0]?.toUpperCase() + w.slice(1)); } words = [...new Set([...words, ...ex])]; }
      const remaining = new Map(want.map(hcheck => [hcheck, algo.value === 'auto' ? (byLen[hcheck.length] || 'MD5') : algo.value]));
      const found = {};
      let tried = 0;
      for (const w of words) {
        if (!remaining.size) break;
        // group by algorithm needed
        const algosNeeded = new Set([...remaining.values()]);
        for (const a of algosNeeded) {
          const hx = (await digestHex(a, w)).toLowerCase();
          if (remaining.has(hx) && remaining.get(hx) === a) { found[hx] = w; remaining.delete(hx); }
        }
        tried++;
      }
      const lines = want.map(hx => hx + ' : ' + (found[hx] !== undefined ? found[hx] : '(not found)'));
      out.set(lines.join('\n') + '\n\ntried ' + tried + ' candidates, cracked ' + Object.keys(found).length + '/' + want.length, Object.keys(found).length ? 'ok' : 'err');
    };
    root.append(
      warn('For your own hashes or authorised testing only.'),
      field('target hashes', targets, { grow: true }),
      row(field('algorithm', algo), h('div', { class: 'fld' }, h('label', {}, 'try common mutations'), h('div', {}, mut)),
        field('load wordlist file', filePicker(onfile, { accept: '.txt' }))),
      field('wordlist', list, { grow: true }),
      row(button('Crack', run)),
      out.el,
      note('auto picks the algorithm from hash length (32=MD5, 40=SHA-1, 64=SHA-256, 128=SHA-512). Runs in your browser; large lists are slow.'));
  },
};
