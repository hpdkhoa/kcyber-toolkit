import { h, field, select, row, button, output, note, toB64 } from '../assets/js/ui.js';

function pem(label, buf) {
  const b64 = toB64(buf).replace(/(.{64})/g, '$1\n').replace(/\n$/, '');
  return '-----BEGIN ' + label + '-----\n' + b64 + '\n-----END ' + label + '-----';
}

export default {
  id: 'keygen', cat: 'baseline', tier: 'a',
  title: 'RSA / EC key generator',
  desc: 'Generate a keypair as PEM',
  render(root) {
    const kind = select([['RSA-2048', 'RSA 2048'], ['RSA-4096', 'RSA 4096'], ['EC-P-256', 'EC P-256'], ['EC-P-384', 'EC P-384']]);
    const pub = output({ label: 'public key (SPKI)' });
    const priv = output({ label: 'private key (PKCS8)' });
    const gen = async () => {
      pub.set('generating…'); priv.set('');
      try {
        let algo, usages;
        if (kind.value.startsWith('RSA')) { algo = { name: 'RSA-OAEP', modulusLength: +kind.value.split('-')[1], publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }; usages = ['encrypt', 'decrypt']; }
        else { algo = { name: 'ECDSA', namedCurve: kind.value.slice(3) }; usages = ['sign', 'verify']; }
        const kp = await crypto.subtle.generateKey(algo, true, usages);
        const spki = await crypto.subtle.exportKey('spki', kp.publicKey);
        const pkcs8 = await crypto.subtle.exportKey('pkcs8', kp.privateKey);
        pub.set(pem('PUBLIC KEY', spki), 'ok');
        priv.set(pem('PRIVATE KEY', pkcs8), 'ok');
      } catch (e) { pub.set('failed: ' + e.message, 'err'); }
    };
    root.append(
      row(field('key type', kind), button('Generate', gen)),
      pub.el, priv.el,
      note('Generated with the browser WebCrypto RNG; the private key never leaves the page. RSA keys are OAEP (encryption), EC keys are ECDSA (signing).'));
  },
};
