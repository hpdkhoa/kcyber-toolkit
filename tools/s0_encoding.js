import { h, field, textarea, select, row, button, output, enc, dec, toHex, fromHex, toB64, fromB64 } from '../assets/js/ui.js';

const schemes = {
  'Base64': {
    e: s => toB64(enc.encode(s)),
    d: s => dec.decode(fromB64(s)),
  },
  'Base64 URL': {
    e: s => toB64(enc.encode(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    d: s => dec.decode(fromB64(s.replace(/-/g, '+').replace(/_/g, '/'))),
  },
  'Hex': {
    e: s => toHex(enc.encode(s)),
    d: s => dec.decode(fromHex(s)),
  },
  'URL (percent)': {
    e: s => encodeURIComponent(s),
    d: s => decodeURIComponent(s),
  },
  'HTML entities': {
    e: s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    d: s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; },
  },
  'ASCII decimal': {
    e: s => [...enc.encode(s)].join(' '),
    d: s => dec.decode(new Uint8Array(s.trim().split(/[\s,]+/).map(Number))),
  },
  'Binary': {
    e: s => [...enc.encode(s)].map(b => b.toString(2).padStart(8, '0')).join(' '),
    d: s => dec.decode(new Uint8Array(s.trim().split(/\s+/).map(b => parseInt(b, 2)))),
  },
  'ROT13': {
    e: s => s.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)),
    d: s => schemes['ROT13'].e(s),
  },
};

export default {
  id: 'encoding', cat: 'baseline', tier: 'a',
  title: 'Encode / Decode',
  desc: 'Base64, hex, URL, HTML, ASCII, binary, ROT13',
  render(root) {
    const inp = textarea({ placeholder: 'text or encoded input' });
    const sch = select(Object.keys(schemes));
    const out = output({ label: 'result' });
    const run = dir => () => {
      try { out.set(schemes[sch.value][dir](inp.value), 'ok'); }
      catch (e) { out.set('cannot ' + (dir === 'e' ? 'encode' : 'decode') + ': ' + e.message, 'err'); }
    };
    root.append(
      field('input', inp, { grow: true }),
      row(field('scheme', sch),
        h('div', { class: 'fld' }, h('label', {}, ' '),
          h('div', {}, button('Encode', run('e')), ' ', button('Decode', run('d'), 'alt')))),
      out.el);
  },
};
