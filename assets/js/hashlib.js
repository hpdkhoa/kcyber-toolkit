// Shared hashing used by the hash tool and the recipe chain.
import { enc, toHex } from './ui.js';

export function md5(bytes) {
  const b = bytes instanceof Uint8Array ? [...bytes] : [...new Uint8Array(bytes)];
  const rl = (x, c) => (x << c) | (x >>> (32 - c));
  const add = (a, c) => (a + c) & 0xffffffff;
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) & 0xffffffff;
  const ml = b.length * 8;
  const m = [...b, 0x80];
  while (m.length % 64 !== 56) m.push(0);
  for (let i = 0; i < 8; i++) m.push((ml / Math.pow(2, 8 * i)) & 0xff);
  let [a0, b0, c0, d0] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
  for (let off = 0; off < m.length; off += 64) {
    const M = [];
    for (let i = 0; i < 16; i++) M[i] = m[off + i * 4] | (m[off + i * 4 + 1] << 8) | (m[off + i * 4 + 2] << 16) | (m[off + i * 4 + 3] << 24);
    let [A, B, C, D] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = add(add(add(F, A), K[i]), M[g]);
      A = D; D = C; C = B; B = add(B, rl(F, s[i]));
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }
  const le = x => [0, 8, 16, 24].map(sh => (x >>> sh) & 0xff);
  return toHex(new Uint8Array([...le(a0), ...le(b0), ...le(c0), ...le(d0)]));
}

export async function shaHex(algo, data) {
  const buf = data instanceof Uint8Array ? data : enc.encode(data);
  return toHex(await crypto.subtle.digest(algo, buf));
}

// hex of any supported algo name; MD5 handled locally.
export async function digestHex(algo, data) {
  const bytes = data instanceof Uint8Array ? data : enc.encode(data);
  if (algo === 'MD5') return md5(bytes);
  return shaHex(algo, bytes);
}
