import { field, input, output, note } from '../assets/js/ui.js';

// length + shape based guesser. Reports candidates, not certainty.
function identify(s) {
  s = s.trim();
  const hex = /^[a-f0-9]+$/i.test(s);
  const L = s.length;
  const out = [];
  if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(s)) out.push('bcrypt');
  if (/^\$argon2(id|i|d)\$/.test(s)) out.push('Argon2');
  if (/^\$6\$/.test(s)) out.push('sha512crypt ($6$)');
  if (/^\$5\$/.test(s)) out.push('sha256crypt ($5$)');
  if (/^\$1\$/.test(s)) out.push('md5crypt ($1$)');
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(s) && L % 4 === 0) out.push('Base64 (maybe a raw digest)');
  if (hex) {
    const byLen = { 32: ['MD5', 'MD4', 'NTLM'], 40: ['SHA-1'], 56: ['SHA-224'], 64: ['SHA-256'], 96: ['SHA-384'], 128: ['SHA-512'] };
    if (byLen[L]) out.push(...byLen[L]);
    if (L === 16) out.push('MySQL<4.1 / CRC');
    if (L === 8) out.push('CRC32');
  }
  if (/^[a-f0-9]{32}:[a-f0-9]{32}$/i.test(s)) out.push('salted MD5 (hash:salt)');
  return out.length ? out : ['unknown shape (' + L + ' chars, ' + (hex ? 'hex' : 'mixed') + ')'];
}

export default {
  id: 'hashid', cat: 'baseline', tier: 'a',
  title: 'Hash identifier',
  desc: 'Guess hash type from its shape',
  render(root) {
    const inp = input({ placeholder: 'paste a hash', class: 'mono' });
    const out = output();
    const run = () => out.set(inp.value.trim() ? identify(inp.value).join('\n') : '', inp.value.trim() ? 'ok' : '');
    inp.addEventListener('input', run);
    root.append(field('hash', inp, { grow: true }), out.el,
      note('Based on length and prefix only. Several types share a length, so this lists candidates, not a verdict.'));
  },
};
