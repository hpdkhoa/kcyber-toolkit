import { h, field, input, textarea, select, row, button, output, note, warn, enc, dec, toB64, fromB64 } from '../assets/js/ui.js';

const b64urlStr = s => toB64(enc.encode(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64urlBuf = buf => toB64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = s => dec.decode(fromB64(s.replace(/-/g, '+').replace(/_/g, '/')));

async function hsSign(signingInput, secret, bits) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-' + bits }, false, ['sign']);
  return b64urlBuf(await crypto.subtle.sign('HMAC', key, enc.encode(signingInput)));
}

export default {
  id: 'jwt', cat: 'web', tier: 'a',
  title: 'JWT decode / verify / forge',
  desc: 'Read, check (HS*), and sign test tokens',
  render(root) {
    const tok = textarea({ placeholder: 'paste a JWT, or build one below' });
    const decOut = h('div');
    const decode = () => {
      decOut.innerHTML = '';
      const parts = tok.value.trim().split('.');
      if (parts.length < 2) { decOut.append(h('div', { class: 'out err' }, 'not a JWT (need header.payload.signature)')); return; }
      try {
        const header = JSON.parse(unb64url(parts[0]));
        const payload = JSON.parse(unb64url(parts[1]));
        const rows = [];
        if (payload.exp) { const d = new Date(payload.exp * 1000); rows.push(['exp', d.toISOString() + (Date.now() > payload.exp * 1000 ? '  ⚠ expired' : '  (valid)')]); }
        if (payload.iat) rows.push(['iat', new Date(payload.iat * 1000).toISOString()]);
        decOut.append(
          h('div', { class: 'grid2' },
            h('div', {}, h('label', {}, 'header'), h('div', { class: 'out' }, JSON.stringify(header, null, 2))),
            h('div', {}, h('label', {}, 'payload'), h('div', { class: 'out' }, JSON.stringify(payload, null, 2)))));
        if (header.alg === 'none') decOut.append(warn('alg is "none": the signature is not checked. Accepting this token is a known vulnerability.'));
        if (rows.length) { const t = h('table', { class: 'kv' }); for (const [k, v] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', {}, v))); decOut.append(t); }
        decOut.append(h('div', { class: 'note' }, 'signature: ' + (parts[2] || '(none)')));
      } catch (e) { decOut.append(h('div', { class: 'out err' }, 'decode failed: ' + e.message)); }
    };
    tok.addEventListener('input', decode);

    // verify
    const secret = input({ placeholder: 'HMAC secret' });
    const vOut = output();
    const verify = async () => {
      const parts = tok.value.trim().split('.');
      try {
        const header = JSON.parse(unb64url(parts[0]));
        if (!/^HS(256|384|512)$/.test(header.alg)) { vOut.set('this tool verifies HS256/384/512 only; token alg is ' + header.alg, 'err'); return; }
        const sig = await hsSign(parts[0] + '.' + parts[1], secret.value, header.alg.slice(2));
        vOut.set(sig === parts[2] ? 'VALID — signature matches this secret' : 'INVALID — signature does not match', sig === parts[2] ? 'ok' : 'err');
      } catch (e) { vOut.set('verify failed: ' + e.message, 'err'); }
    };

    // forge / sign
    const fHeader = textarea({ html: '' }); fHeader.value = '{\n "alg": "HS256",\n "typ": "JWT"\n}';
    const fPayload = textarea({}); fPayload.value = '{\n "sub": "1234567890",\n "name": "test",\n "admin": true\n}';
    const fSecret = input({ placeholder: 'secret (for HS*)' });
    const fOut = output({ label: 'token' });
    const sign = async () => {
      try {
        const header = JSON.parse(fHeader.value), payload = JSON.parse(fPayload.value);
        const si = b64urlStr(JSON.stringify(header)) + '.' + b64urlStr(JSON.stringify(payload));
        if (header.alg === 'none') { fOut.set(si + '.', 'ok'); return; }
        const m = /^HS(256|384|512)$/.exec(header.alg);
        if (!m) { fOut.set('signing supports HS256/384/512 and alg:none', 'err'); return; }
        fOut.set(si + '.' + await hsSign(si, fSecret.value, m[1]), 'ok');
      } catch (e) { fOut.set('sign failed: ' + e.message, 'err'); }
    };
    const toTok = () => { tok.value = fOut.textContent; decode(); };

    root.append(
      field('token', tok, { grow: true }), decOut,
      h('h3', {}, 'Verify (HS*)'),
      row(field('secret', secret), button('Verify', verify)), vOut.el,
      h('h3', {}, 'Forge / sign'),
      h('div', { class: 'grid2' }, field('header', fHeader), field('payload', fPayload)),
      row(field('secret', fSecret), button('Sign', sign), button('alg:none', () => { fHeader.value = '{\n "alg": "none",\n "typ": "JWT"\n}'; sign(); }, 'alt'), button('→ load above', toTok, 'alt')),
      fOut.el,
      note('For authorised testing and learning. RS*/ES* verification (public-key) is a later add; this covers HMAC tokens and the alg:none case.'));
    decode();
  },
};
