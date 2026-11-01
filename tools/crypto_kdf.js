import { h, field, input, select, row, button, output, note, loadScript, enc, toHex } from '../assets/js/ui.js';

const V = '../assets/vendor/';

async function doScrypt(pw, salt, N, r, p, dk) {
  await loadScript(V + 'scrypt.js');
  const lib = window.scrypt;
  const out = await lib.scrypt(enc.encode(pw), enc.encode(salt), N, r, p, dk);
  return toHex(out);
}
async function doBcrypt(pw, rounds) {
  await loadScript(V + 'bcrypt.min.js');
  const b = (window.dcodeIO && window.dcodeIO.bcrypt) || window.bcrypt;
  return new Promise((res, rej) => b.hash(pw, rounds, (e, h) => e ? rej(e) : res(h)));
}
async function doArgon2(pw, salt, type, time, mem, par, len) {
  await loadScript(V + 'argon2-bundled.min.js');
  const a = window.argon2;
  const r = await a.hash({ pass: pw, salt, type: a.ArgonType[type], time, mem, parallelism: par, hashLen: len });
  return r.encoded + '\n\nhex: ' + r.hashHex;
}

export default {
  id: 'kdf', cat: 'baseline', tier: 'a',
  title: 'scrypt / Argon2 / bcrypt',
  desc: 'Slow password hashes (vendored, offline)',
  render(root) {
    const algo = select(['bcrypt', 'scrypt', 'Argon2id', 'Argon2i', 'Argon2d']);
    const pw = input({ placeholder: 'password' });
    const salt = input({ placeholder: 'salt', value: 'saltsalt' });
    const out = output();
    // params
    const rounds = input({ type: 'number', value: '10' });
    const N = input({ type: 'number', value: '16384' }), r = input({ type: 'number', value: '8' }), p = input({ type: 'number', value: '1' });
    const time = input({ type: 'number', value: '3' }), mem = input({ type: 'number', value: '4096' }), par = input({ type: 'number', value: '1' }), len = input({ type: 'number', value: '32' });
    const fScrypt = row(field('N (cost)', N), field('r', r), field('p', p));
    const fBcrypt = row(field('rounds (cost)', rounds));
    const fArgon = row(field('time', time), field('memory (KiB)', mem), field('parallelism', par), field('hash len', len));
    const fSalt = field('salt', salt);
    const sync = () => {
      const a = algo.value;
      fBcrypt.style.display = a === 'bcrypt' ? '' : 'none';
      fScrypt.style.display = a === 'scrypt' ? '' : 'none';
      fArgon.style.display = a.startsWith('Argon') ? '' : 'none';
      fSalt.style.display = a === 'bcrypt' ? 'none' : '';
    };
    algo.addEventListener('change', sync); sync();
    const run = async () => {
      out.set('computing… (slow by design)');
      try {
        const a = algo.value;
        if (a === 'bcrypt') out.set(await doBcrypt(pw.value, +rounds.value), 'ok');
        else if (a === 'scrypt') out.set(await doScrypt(pw.value, salt.value, +N.value, +r.value, +p.value, +len.value), 'ok');
        else out.set(await doArgon2(pw.value, salt.value, a, +time.value, +mem.value, +par.value, +len.value), 'ok');
      } catch (e) { out.set('failed: ' + e.message, 'err'); }
    };
    root.append(
      row(field('algorithm', algo), field('password', pw)), fSalt,
      fBcrypt, fScrypt, fArgon,
      row(button('Hash', run)), out.el,
      note('Libraries are vendored in the repo and run in your browser; nothing is sent anywhere. These are intentionally slow (memory-hard for scrypt/Argon2).'));
  },
};
