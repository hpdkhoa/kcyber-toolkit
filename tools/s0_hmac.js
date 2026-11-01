import { h, field, input, textarea, select, row, button, output, note, enc, toHex } from '../assets/js/ui.js';

async function hmac(msg, keyStr, hash) {
  const key = await crypto.subtle.importKey('raw', enc.encode(keyStr), { name: 'HMAC', hash }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
}
async function pbkdf2(pass, saltStr, iter, dkLen, hash) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(saltStr), iterations: iter, hash }, base, dkLen * 8);
  return toHex(bits);
}

export default {
  id: 'hmac', cat: 'baseline', tier: 'a',
  title: 'HMAC / PBKDF2',
  desc: 'Keyed hash and password-based key derivation',
  render(root) {
    const mode = select(['HMAC', 'PBKDF2']);
    const hash = select(['SHA-256', 'SHA-1', 'SHA-384', 'SHA-512']);
    const msg = textarea({ placeholder: 'message / password' });
    const key = input({ placeholder: 'key / salt' });
    const iter = input({ type: 'number', value: '100000' });
    const dk = input({ type: 'number', value: '32' });
    const out = output();
    const iterFld = field('iterations', iter), dkFld = field('key bytes', dk);
    const sync = () => { const p = mode.value === 'PBKDF2'; iterFld.style.display = dkFld.style.display = p ? '' : 'none'; };
    mode.addEventListener('change', sync); sync();
    const run = async () => {
      try {
        out.set(mode.value === 'HMAC'
          ? await hmac(msg.value, key.value, hash.value)
          : await pbkdf2(msg.value, key.value, +iter.value, +dk.value, hash.value), 'ok');
      } catch (e) { out.set('failed: ' + e.message, 'err'); }
    };
    root.append(
      row(field('mode', mode), field('hash', hash), iterFld, dkFld),
      field('message / password', msg, { grow: true }),
      row(field('key / salt', key), button('Compute', run)),
      note('scrypt and Argon2 are added in the WASM batch; these two run on the built-in WebCrypto.'),
      out.el);
  },
};
