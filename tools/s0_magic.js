import { h, field, textarea, output, note, enc, dec, fromHex, fromB64 } from '../assets/js/ui.js';

function score(s) {
  if (!s) return -1;
  let printable = 0, letters = 0;
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 32 && c < 127) printable++;
    if (/[a-z ]/i.test(ch)) letters++;
  }
  return (printable / s.length) * 0.7 + (letters / s.length) * 0.3;
}

const tries = {
  'Base64': s => dec.decode(fromB64(s)),
  'Base64 URL': s => dec.decode(fromB64(s.replace(/-/g, '+').replace(/_/g, '/'))),
  'Hex': s => dec.decode(fromHex(s)),
  'URL percent': s => decodeURIComponent(s),
  'ROT13': s => s.replace(/[a-z]/gi, c => String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)),
  'ASCII decimal': s => dec.decode(new Uint8Array(s.trim().split(/[\s,]+/).map(Number))),
  'Binary': s => dec.decode(new Uint8Array(s.trim().split(/\s+/).map(b => parseInt(b, 2)))),
};

export default {
  id: 'magic', cat: 'baseline', tier: 'a',
  title: 'Magic / auto-decode',
  desc: 'Try many decodings, rank by how much looks like text',
  render(root) {
    const inp = textarea({ placeholder: 'encoded blob' });
    const box = h('div');
    const run = () => {
      box.innerHTML = '';
      const v = inp.value.trim();
      if (!v) return;
      const results = [];
      for (const [name, fn] of Object.entries(tries)) {
        try { const r = fn(v); if (r && r !== v) results.push([name, r, score(r)]); } catch {}
      }
      results.sort((a, b) => b[2] - a[2]);
      if (!results.length) { box.append(h('div', { class: 'out' }, 'no decoding produced different text')); return; }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'scheme'), h('th', {}, 'score'), h('th', {}, 'output')));
      for (const [name, r, sc] of results.slice(0, 8))
        t.append(h('tr', {}, h('td', {}, name), h('td', {}, sc.toFixed(2)),
          h('td', { class: 'mono' }, r.length > 200 ? r.slice(0, 200) + '…' : r)));
      box.append(t);
    };
    inp.addEventListener('input', run);
    root.append(field('input', inp, { grow: true }), note('Score 1.0 = all printable readable text. Top rows are the likeliest decodings.'), box);
  },
};
