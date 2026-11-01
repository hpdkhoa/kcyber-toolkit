import { h, field, filePicker, output, note, enc, toB64 } from '../assets/js/ui.js';

// MurmurHash3 x86_32, signed output (matches python mmh3.hash)
function murmur3(key, seed = 0) {
  const c1 = 0xcc9e2d51, c2 = 0x1b873593;
  let h1 = seed >>> 0;
  const len = key.length, nblocks = len & ~3;
  for (let i = 0; i < nblocks; i += 4) {
    let k1 = key[i] | (key[i + 1] << 8) | (key[i + 2] << 16) | (key[i + 3] << 24);
    k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2);
    h1 ^= k1; h1 = (h1 << 13) | (h1 >>> 19); h1 = (Math.imul(h1, 5) + 0xe6546b64) | 0;
  }
  let k1 = 0;
  switch (len & 3) {
    case 3: k1 ^= key[nblocks + 2] << 16;
    case 2: k1 ^= key[nblocks + 1] << 8;
    case 1: k1 ^= key[nblocks]; k1 = Math.imul(k1, c1); k1 = (k1 << 15) | (k1 >>> 17); k1 = Math.imul(k1, c2); h1 ^= k1;
  }
  h1 ^= len;
  h1 ^= h1 >>> 16; h1 = Math.imul(h1, 0x85ebca6b); h1 ^= h1 >>> 13; h1 = Math.imul(h1, 0xc2b2ae35); h1 ^= h1 >>> 16;
  return h1 | 0;
}
// python base64.encodebytes: wrap at 76 chars, trailing newline
function encodebytes(bytes) {
  const b64 = toB64(bytes);
  let out = '';
  for (let i = 0; i < b64.length; i += 76) out += b64.slice(i, i + 76) + '\n';
  return out;
}

export default {
  id: 'favicon', cat: 'recon', tier: 'a',
  title: 'Favicon hash',
  desc: 'Shodan-style mmh3 hash for asset hunting',
  render(root) {
    const out = output();
    const extra = h('div', { class: 'note' });
    const go = bytes => {
      const b64 = encodebytes(bytes);
      const hash = murmur3(enc.encode(b64), 0);
      out.set(String(hash), 'ok');
      extra.innerHTML = '';
      extra.append('Search: ',
        h('a', { href: 'https://www.shodan.io/search?query=http.favicon.hash:' + hash, target: '_blank', rel: 'noopener' }, 'Shodan http.favicon.hash:' + hash));
    };
    root.append(field('favicon file (.ico / .png)', filePicker(go)), out.el, extra,
      note('MurmurHash3 (x86, 32-bit, signed) of the MIME-base64 favicon, the same value Shodan and Censys index. Hashing is local; the Shodan link opens only if you click it.'));
  },
};
