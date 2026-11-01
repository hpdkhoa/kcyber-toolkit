import { field, textarea, select, row, button, output, enc } from '../assets/js/ui.js';
import { digestHex } from '../assets/js/hashlib.js';

const algos = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export default {
  id: 'hash', cat: 'baseline', tier: 'a',
  title: 'Hashing',
  desc: 'MD5, SHA-1, SHA-256/384/512',
  render(root) {
    const inp = textarea({ placeholder: 'text to hash' });
    const which = select(['all', ...algos]);
    const out = output();
    const run = async () => {
      const data = enc.encode(inp.value);
      const want = which.value === 'all' ? algos : [which.value];
      const lines = [];
      for (const a of want) lines.push(a.padEnd(8) + ' ' + await digestHex(a, data));
      out.set(lines.join('\n'), 'ok');
    };
    inp.addEventListener('input', run);
    which.addEventListener('change', run);
    root.append(field('input', inp, { grow: true }), row(field('algorithm', which), button('Hash', run)), out.el);
    run();
  },
};
