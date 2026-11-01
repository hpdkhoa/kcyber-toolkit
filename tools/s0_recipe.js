import { h, field, textarea, input, select, output, note, enc, dec, toHex, fromHex, toB64, fromB64 } from '../assets/js/ui.js';
import { digestHex } from '../assets/js/hashlib.js';

const rot = (s, n) => s.replace(/[a-z]/gi, c => {
  const base = c <= 'Z' ? 65 : 97;
  return String.fromCharCode((c.charCodeAt(0) - base + (n % 26) + 26) % 26 + base);
});
const rot47 = s => [...s].map(c => {
  const o = c.charCodeAt(0);
  return o >= 33 && o <= 126 ? String.fromCharCode(33 + (o - 33 + 47) % 94) : c;
}).join('');
const htmlEnc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const htmlDec = s => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };

// each op: run(input:string, p:params) -> string | Promise<string>
const OPS = [
  // encoding
  { id: 'to_b64', cat: 'Encoding', name: 'To Base64', run: s => toB64(enc.encode(s)) },
  { id: 'from_b64', cat: 'Encoding', name: 'From Base64', run: s => dec.decode(fromB64(s)) },
  { id: 'to_b64url', cat: 'Encoding', name: 'To Base64 URL', run: s => toB64(enc.encode(s)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') },
  { id: 'from_b64url', cat: 'Encoding', name: 'From Base64 URL', run: s => dec.decode(fromB64(s.replace(/-/g, '+').replace(/_/g, '/'))) },
  { id: 'to_hex', cat: 'Encoding', name: 'To Hex', params: [{ key: 'sep', label: 'separator', type: 'select', def: 'none', options: [['none', 'none'], ['space', 'space']] }], run: (s, p) => { const hx = toHex(enc.encode(s)); return p.sep === 'space' ? hx.replace(/(..)/g, '$1 ').trim() : hx; } },
  { id: 'from_hex', cat: 'Encoding', name: 'From Hex', run: s => dec.decode(fromHex(s)) },
  { id: 'url_enc', cat: 'Encoding', name: 'URL Encode', run: s => encodeURIComponent(s) },
  { id: 'url_dec', cat: 'Encoding', name: 'URL Decode', run: s => decodeURIComponent(s) },
  { id: 'to_bin', cat: 'Encoding', name: 'To Binary', run: s => [...enc.encode(s)].map(b => b.toString(2).padStart(8, '0')).join(' ') },
  { id: 'from_bin', cat: 'Encoding', name: 'From Binary', run: s => dec.decode(new Uint8Array(s.trim().split(/\s+/).map(b => parseInt(b, 2)))) },
  { id: 'to_dec', cat: 'Encoding', name: 'To Decimal', run: s => [...enc.encode(s)].join(' ') },
  { id: 'from_dec', cat: 'Encoding', name: 'From Decimal', run: s => dec.decode(new Uint8Array(s.trim().split(/[\s,]+/).map(Number))) },
  { id: 'html_enc', cat: 'Encoding', name: 'HTML Encode', run: htmlEnc },
  { id: 'html_dec', cat: 'Encoding', name: 'HTML Decode', run: htmlDec },
  // ciphers
  { id: 'rot13', cat: 'Ciphers', name: 'ROT13', run: s => rot(s, 13) },
  { id: 'rot47', cat: 'Ciphers', name: 'ROT47', run: rot47 },
  { id: 'caesar', cat: 'Ciphers', name: 'Caesar shift', params: [{ key: 'n', label: 'shift', type: 'number', def: 3 }], run: (s, p) => rot(s, +p.n) },
  { id: 'atbash', cat: 'Ciphers', name: 'Atbash', run: s => s.replace(/[a-z]/gi, c => { const base = c <= 'Z' ? 65 : 97; return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base)); }) },
  { id: 'xor', cat: 'Ciphers', name: 'XOR (out hex)', params: [{ key: 'key', label: 'key', type: 'text', def: 'key' }, { key: 'kt', label: 'key as', type: 'select', def: 'utf8', options: [['utf8', 'utf8'], ['hex', 'hex']] }], run: (s, p) => { const k = p.kt === 'hex' ? fromHex(p.key) : enc.encode(p.key || 'key'); const b = enc.encode(s), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b[i] ^ k[i % k.length]; return toHex(o); } },
  { id: 'reverse', cat: 'Ciphers', name: 'Reverse', run: s => [...s].reverse().join('') },
  // hashing
  { id: 'md5', cat: 'Hashing', name: 'MD5', run: s => digestHex('MD5', s) },
  { id: 'sha1', cat: 'Hashing', name: 'SHA-1', run: s => digestHex('SHA-1', s) },
  { id: 'sha256', cat: 'Hashing', name: 'SHA-256', run: s => digestHex('SHA-256', s) },
  { id: 'sha512', cat: 'Hashing', name: 'SHA-512', run: s => digestHex('SHA-512', s) },
  // text
  { id: 'upper', cat: 'Text', name: 'To Upper', run: s => s.toUpperCase() },
  { id: 'lower', cat: 'Text', name: 'To Lower', run: s => s.toLowerCase() },
  { id: 'trim', cat: 'Text', name: 'Trim', run: s => s.trim() },
  { id: 'rm_ws', cat: 'Text', name: 'Remove whitespace', run: s => s.replace(/\s+/g, '') },
  { id: 'replace', cat: 'Text', name: 'Find / Replace', params: [{ key: 'find', label: 'find', type: 'text', def: '' }, { key: 'rep', label: 'replace', type: 'text', def: '' }, { key: 're', label: 'regex', type: 'checkbox', def: false }], run: (s, p) => { if (!p.find) return s; const pat = p.re ? new RegExp(p.find, 'g') : new RegExp(p.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'); return s.replace(pat, p.rep); } },
  { id: 'sort_lines', cat: 'Text', name: 'Sort lines', run: s => s.split('\n').sort().join('\n') },
  { id: 'uniq_lines', cat: 'Text', name: 'Unique lines', run: s => [...new Set(s.split('\n'))].join('\n') },
  { id: 'len', cat: 'Text', name: 'Length', run: s => String([...s].length) },
  // data
  { id: 'json_pretty', cat: 'Data', name: 'JSON beautify', run: s => JSON.stringify(JSON.parse(s), null, 2) },
  { id: 'json_min', cat: 'Data', name: 'JSON minify', run: s => JSON.stringify(JSON.parse(s)) },
];
const OP = Object.fromEntries(OPS.map(o => [o.id, o]));

export default {
  id: 'recipe', cat: 'baseline', tier: 'a',
  title: 'Recipe chain',
  desc: 'Stack encode, decode, cipher and hash steps in one pipe',
  render(root) {
    let recipe = []; // { opId, params, on }
    const inp = textarea({ placeholder: 'input' });
    const out = output({ label: 'output' });
    const recEl = h('div', { class: 'recipe' });

    const bake = async () => {
      let cur = inp.value;
      recEl.querySelectorAll('.step').forEach(s => s.classList.remove('err'));
      for (let i = 0; i < recipe.length; i++) {
        const step = recipe[i];
        if (!step.on) continue;
        try { cur = await OP[step.opId].run(cur, step.params); }
        catch (e) {
          recEl.children[i]?.classList.add('err');
          out.set('step ' + (i + 1) + ' (' + OP[step.opId].name + ') failed: ' + e.message, 'err');
          return;
        }
      }
      out.set(cur, 'ok');
    };

    const renderRecipe = () => {
      recEl.innerHTML = '';
      if (!recipe.length) { recEl.append(h('div', { class: 'empty' }, 'click an operation on the left to add it')); return; }
      recipe.forEach((step, i) => {
        const op = OP[step.opId];
        const stepEl = h('div', { class: 'step' + (step.on ? '' : ' off') });
        const head = h('div', { class: 'sh' },
          h('b', {}, (i + 1) + '. ' + op.name),
          h('button', { title: 'disable', onclick: () => { step.on = !step.on; renderRecipe(); bake(); } }, step.on ? '●' : '○'),
          h('button', { title: 'up', onclick: () => { if (i) { [recipe[i - 1], recipe[i]] = [recipe[i], recipe[i - 1]]; renderRecipe(); bake(); } } }, '↑'),
          h('button', { title: 'down', onclick: () => { if (i < recipe.length - 1) { [recipe[i + 1], recipe[i]] = [recipe[i], recipe[i + 1]]; renderRecipe(); bake(); } } }, '↓'),
          h('button', { title: 'remove', onclick: () => { recipe.splice(i, 1); renderRecipe(); bake(); } }, '✕'));
        stepEl.append(head);
        if (op.params) {
          const sp = h('div', { class: 'sp' });
          for (const pr of op.params) {
            let ctrl;
            if (pr.type === 'select') ctrl = select(pr.options, {});
            else if (pr.type === 'checkbox') ctrl = h('input', { type: 'checkbox' });
            else ctrl = input({ type: pr.type === 'number' ? 'number' : 'text' });
            if (pr.type === 'checkbox') { ctrl.checked = step.params[pr.key]; ctrl.addEventListener('change', () => { step.params[pr.key] = ctrl.checked; bake(); }); }
            else { ctrl.value = step.params[pr.key]; ctrl.addEventListener('input', () => { step.params[pr.key] = ctrl.value; bake(); }); }
            sp.append(field(pr.label, ctrl));
          }
          stepEl.append(sp);
        }
        recEl.append(stepEl);
      });
    };

    const addOp = id => {
      const op = OP[id];
      const params = {};
      (op.params || []).forEach(pr => params[pr.key] = pr.def);
      recipe.push({ opId: id, params, on: true });
      renderRecipe(); bake();
    };

    // palette
    const palette = h('div', { class: 'palette' });
    const psearch = h('input', { class: 'psearch', type: 'search', placeholder: 'filter operations' });
    const plist = h('div');
    const buildPalette = (f = '') => {
      plist.innerHTML = ''; f = f.toLowerCase();
      let cat = '';
      for (const op of OPS) {
        if (f && !op.name.toLowerCase().includes(f)) continue;
        if (op.cat !== cat) { cat = op.cat; plist.append(h('div', { class: 'pcat' }, cat)); }
        plist.append(h('div', { class: 'pop', onclick: () => addOp(op.id) }, op.name));
      }
    };
    psearch.addEventListener('input', () => buildPalette(psearch.value));
    buildPalette();
    palette.append(psearch, plist);

    inp.addEventListener('input', bake);
    const clear = h('button', { class: 'alt', onclick: () => { recipe = []; renderRecipe(); bake(); } }, 'Clear recipe');

    const right = h('div', {},
      field('input', inp, { grow: true }),
      h('div', { class: 'row', style: 'justify-content:space-between' }, h('label', {}, 'recipe'), clear),
      recEl,
      out.el);

    root.append(
      note('Each step feeds the next. Byte steps (XOR, hashes, To Hex) output hex so the next step can read them. Runs live.'),
      h('div', { class: 'rc' }, palette, right));
    renderRecipe();
    bake();
  },
};
