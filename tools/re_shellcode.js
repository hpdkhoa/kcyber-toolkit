import { h, field, textarea, input, select, row, button, output, note, warn, fromHex, toHex, fromB64 } from '../assets/js/ui.js';
import { disassemble } from './re_disasm.js';

const ARCHES = ['x86 64-bit', 'x86 32-bit', 'x86 16-bit', 'ARM', 'ARM Thumb', 'ARM64 / AArch64'];

// accept hex, \x.., 0x.., comma C-array, or base64
function toBytes(s) {
  s = s.trim();
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && /[+/=]/.test(s) && !/\\x|0x/.test(s)) { try { return fromB64(s); } catch {} }
  const hex = s.replace(/0x/g, '').replace(/\\x/g, '').replace(/[^0-9a-fA-F]/g, '');
  return fromHex(hex);
}

export default {
  id: 'shellcode', cat: 're', tier: 'a',
  title: 'Shellcode decoder',
  desc: 'Disassemble shellcode and check bad chars',
  render(root) {
    const inp = textarea({ placeholder: 'shellcode as hex, \\x.., 0x.., C array, or base64' });
    const arch = select(ARCHES);
    const bad = input({ value: '00', class: 'mono', placeholder: 'bad chars hex, e.g. 00 0a 0d' });
    const summary = h('div');
    const out = h('div');
    const run = async () => {
      summary.innerHTML = ''; out.innerHTML = '';
      const bytes = toBytes(inp.value);
      if (!bytes.length) return;
      // bad char scan
      const badSet = new Set(fromHex(bad.value.replace(/[^0-9a-fA-F]/g, '')));
      const hits = [];
      bytes.forEach((b, i) => { if (badSet.has(b)) hits.push('0x' + i.toString(16) + '=' + b.toString(16).padStart(2, '0')); });
      summary.append(h('table', { class: 'kv' },
        h('tr', {}, h('td', {}, 'length'), h('td', {}, bytes.length + ' bytes')),
        h('tr', {}, h('td', {}, 'hex'), h('td', { class: 'mono' }, toHex(bytes).replace(/(..)/g, '$1 ').trim().slice(0, 300)))));
      if (badSet.size) summary.append(hits.length
        ? h('div', { class: 'warn' }, hits.length + ' bad char(s) found: ' + hits.slice(0, 40).join(', '))
        : h('div', { class: 'out ok' }, 'no bad chars from the set present'));
      // disassemble
      out.append(h('div', { class: 'note' }, 'disassembling…'));
      try {
        const insns = await disassemble(bytes, arch.value, 0);
        out.innerHTML = '';
        const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'offset'), h('th', {}, 'bytes'), h('th', {}, 'instruction')));
        for (const i of insns) {
          const op = i.opStr ?? i.op_str ?? '';
          t.append(h('tr', {}, h('td', { class: 'mono' }, '0x' + Number(i.address).toString(16)), h('td', { class: 'mono' }, i.bytes ? toHex(new Uint8Array(i.bytes)) : ''), h('td', { class: 'mono' }, i.mnemonic + ' ' + op)));
        }
        out.append(h('div', { class: 'note' }, insns.length + ' instruction(s)'), t);
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'disasm failed: ' + e.message)); }
    };
    root.append(
      warn('For analysing shellcode you are authorised to handle. It decodes and disassembles; it does not execute anything.'),
      row(field('architecture', arch), field('bad chars (hex)', bad), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Analyse', run)))),
      field('shellcode', inp, { grow: true }), summary, out,
      note('Accepts hex, \\x, 0x, C arrays and base64. Bad-char scan flags byte offsets that would break the payload.'));
  },
};
