import { h, field, input, textarea, select, row, button, output, note, enc, dec, toB64, fromB64 } from '../assets/js/ui.js';

async function keyFromPass(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function aesEnc(text, pass) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFromPass(pass, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  const out = new Uint8Array(salt.length + iv.length + ct.length);
  out.set(salt); out.set(iv, 16); out.set(ct, 28);
  return toB64(out);
}
async function aesDec(b64, pass) {
  const all = fromB64(b64);
  const key = await keyFromPass(pass, all.slice(0, 16));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(16, 28) }, key, all.slice(28));
  return dec.decode(pt);
}

function xor(text, keyStr) {
  const k = enc.encode(keyStr), b = enc.encode(text), o = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length];
  return o;
}
function caesar(s, n) {
  return s.replace(/[a-z]/gi, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + (n % 26) + 26) % 26 + base);
  });
}

export default {
  id: 'crypto', cat: 'baseline', tier: 'a',
  title: 'Encrypt / Decrypt',
  desc: 'AES-256-GCM (password), XOR, Caesar',
  render(root) {
    const algo = select(['AES-256-GCM', 'XOR', 'Caesar']);
    const inp = textarea({ placeholder: 'text or ciphertext' });
    const key = input({ placeholder: 'password / key / shift number' });
    const out = output();
    const run = dir => async () => {
      try {
        if (algo.value === 'AES-256-GCM') {
          if (!key.value) throw new Error('password required');
          out.set(dir === 'e' ? await aesEnc(inp.value, key.value) : await aesDec(inp.value, key.value), 'ok');
        } else if (algo.value === 'XOR') {
          const bytes = xor(inp.value, key.value || 'key');
          out.set(dir === 'e' ? toB64(bytes) : dec.decode(xor(dec.decode(fromB64(inp.value)), key.value || 'key')), 'ok');
        } else {
          const n = parseInt(key.value || '3', 10);
          out.set(caesar(inp.value, dir === 'e' ? n : -n), 'ok');
        }
      } catch (e) { out.set('failed: ' + e.message, 'err'); }
    };
    root.append(
      row(field('algorithm', algo), field('password / key', key)),
      field('input', inp, { grow: true }),
      row(button('Encrypt', run('e')), button('Decrypt', run('d'), 'alt')),
      note('AES output is base64 of salt(16) + iv(12) + ciphertext. PBKDF2-SHA256, 200k iterations, per-message random salt and IV.'),
      out.el);
  },
};
