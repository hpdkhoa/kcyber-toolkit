import { h, field, textarea, input, select, row, button, note, fromHex, toHex } from '../assets/js/ui.js';

let capMod = null;
async function cap() {
  if (capMod) return capMod;
  const m = await import('../assets/vendor/capstone.mjs');
  await m.loadCapstone();
  capMod = m;
  return m;
}
const ARCHES = {
  'x86 64-bit': ['CS_ARCH_X86', 'CS_MODE_64'],
  'x86 32-bit': ['CS_ARCH_X86', 'CS_MODE_32'],
  'x86 16-bit': ['CS_ARCH_X86', 'CS_MODE_16'],
  'ARM': ['CS_ARCH_ARM', 'CS_MODE_ARM'],
  'ARM Thumb': ['CS_ARCH_ARM', 'CS_MODE_THUMB'],
  'ARM64 / AArch64': ['CS_ARCH_ARM64', 'CS_MODE_ARM'],
  'MIPS32': ['CS_ARCH_MIPS', 'CS_MODE_MIPS32'],
  'MIPS64': ['CS_ARCH_MIPS', 'CS_MODE_MIPS64'],
};

export async function disassemble(bytes, archKey, base = 0x1000) {
  const m = await cap();
  const [a, md] = ARCHES[archKey];
  const cs = new m.Capstone(m.Const[a], m.Const[md]);
  try { return cs.disasm(bytes, { address: base }); }
  finally { cs.close(); }
}

export default {
  id: 'disasm', cat: 're', tier: 'a',
  title: 'Disassembler',
  desc: 'Bytes to assembly (Capstone, vendored)',
  render(root) {
    const inp = textarea({ placeholder: 'hex bytes, e.g. 554889e5  (spaces / \\x / 0x ok)' });
    const arch = select(Object.keys(ARCHES));
    const base = input({ value: '0x1000', class: 'mono' });
    const out = h('div');
    const clean = s => s.replace(/0x/g, '').replace(/\\x/g, '').replace(/[^0-9a-fA-F]/g, '');
    const run = async () => {
      out.innerHTML = '';
      const bytes = fromHex(clean(inp.value));
      if (!bytes.length) return;
      out.append(h('div', { class: 'note' }, 'disassembling…'));
      try {
        const addr = base.value.startsWith('0x') ? parseInt(base.value, 16) : parseInt(base.value, 10) || 0;
        const insns = await disassemble(bytes, arch.value, addr);
        out.innerHTML = '';
        if (!insns.length) { out.append(h('div', { class: 'out err' }, 'no instructions decoded (wrong architecture or truncated bytes)')); return; }
        const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'address'), h('th', {}, 'bytes'), h('th', {}, 'instruction')));
        for (const i of insns) {
          const op = i.opStr ?? i.op_str ?? '';
          const bs = i.bytes ? toHex(new Uint8Array(i.bytes)) : '';
          t.append(h('tr', {}, h('td', { class: 'mono' }, '0x' + Number(i.address).toString(16)), h('td', { class: 'mono' }, bs), h('td', { class: 'mono' }, i.mnemonic + ' ' + op)));
        }
        out.append(h('div', { class: 'note' }, insns.length + ' instruction(s)'), t);
      } catch (e) { out.innerHTML = ''; out.append(h('div', { class: 'out err' }, 'failed: ' + e.message)); }
    };
    root.append(
      row(field('architecture', arch), field('base address', base), h('div', { class: 'fld' }, h('label', {}, ' '), h('div', {}, button('Disassemble', run)))),
      field('bytes', inp, { grow: true }), out,
      note('Capstone compiled to WebAssembly, vendored in the repo. Runs in your browser.'));
  },
};
