import { h, field, filePicker, note, toHex } from '../assets/js/ui.js';

const txt = (b, o, n) => new TextDecoder().decode(b.slice(o, o + n)).replace(/\0.*$/, '');

function parseELF(b, dv) {
  const le = b[5] === 1;
  const is64 = b[4] === 2;
  const u16 = o => dv.getUint16(o, le), u32 = o => dv.getUint32(o, le);
  const cls = is64 ? '64-bit' : '32-bit';
  const types = { 1: 'relocatable', 2: 'executable', 3: 'shared object (PIE/.so)', 4: 'core' };
  const machines = { 0x03: 'x86', 0x3e: 'x86-64', 0x28: 'ARM', 0xb7: 'AArch64', 0xf3: 'RISC-V' };
  const rows = [['Format', 'ELF'], ['Class', cls], ['Endian', le ? 'little' : 'big'],
    ['Type', types[u16(16)] || u16(16)], ['Machine', machines[u16(18)] || '0x' + u16(18).toString(16)],
    ['Entry point', '0x' + (is64 ? dv.getBigUint64(24, le).toString(16) : u32(24).toString(16))]];
  return rows;
}

function parsePE(b, dv) {
  const peOff = dv.getUint32(0x3c, true);
  if (txt(b, peOff, 4).slice(0, 2) !== 'PE') return [['Format', 'MZ (DOS) — no PE header found']];
  const machine = dv.getUint16(peOff + 4, true);
  const nSec = dv.getUint16(peOff + 6, true);
  const chars = dv.getUint16(peOff + 22, true);
  const opt = peOff + 24;
  const magic = dv.getUint16(opt, true);
  const is64 = magic === 0x20b;
  const machines = { 0x14c: 'x86', 0x8664: 'x86-64', 0x1c0: 'ARM', 0xaa64: 'ARM64' };
  const subsys = dv.getUint16(opt + 68, true);
  const subN = { 2: 'GUI', 3: 'console', 1: 'native', 9: 'Windows CE' };
  const rows = [['Format', 'PE / ' + (is64 ? 'PE32+' : 'PE32')], ['Machine', machines[machine] || '0x' + machine.toString(16)],
    ['Sections', nSec], ['DLL?', (chars & 0x2000) ? 'yes' : 'no'],
    ['Subsystem', subN[subsys] || subsys],
    ['Entry (RVA)', '0x' + dv.getUint32(opt + 16, true).toString(16)],
    ['Image base', '0x' + (is64 ? dv.getBigUint64(opt + 24, true).toString(16) : dv.getUint32(opt + 28, true).toString(16))]];
  // section names
  const secStart = opt + (is64 ? 240 : 224);
  const names = [];
  for (let i = 0; i < Math.min(nSec, 12); i++) names.push(txt(b, secStart + i * 40, 8));
  rows.push(['Section names', names.join(', ')]);
  return rows;
}

function parseMachO(b, dv) {
  const magic = dv.getUint32(0, false);
  const le = magic === 0xcffaedfe || magic === 0xcefaedfe;
  const is64 = magic === 0xfeedfacf || magic === 0xcffaedfe;
  const cpu = dv.getUint32(4, le);
  const cpus = { 0x7: 'x86', 0x1000007: 'x86-64', 0xc: 'ARM', 0x100000c: 'ARM64' };
  return [['Format', 'Mach-O ' + (is64 ? '64' : '32')], ['CPU', cpus[cpu] || '0x' + cpu.toString(16)], ['Load commands', dv.getUint32(16, le)]];
}

export default {
  id: 'binfmt', cat: 're', tier: 'a',
  title: 'ELF / PE / Mach-O parser',
  desc: 'Executable headers and sections',
  render(root) {
    const out = h('div');
    const go = (b, f) => {
      out.innerHTML = '';
      const dv = new DataView(b.buffer);
      let rows;
      try {
        const m = toHex(b.slice(0, 4));
        if (m === '7f454c46') rows = parseELF(b, dv);
        else if (b[0] === 0x4d && b[1] === 0x5a) rows = parsePE(b, dv);
        else if (['feedface', 'feedfacf', 'cffaedfe', 'cefaedfe'].includes(m)) rows = parseMachO(b, dv);
        else { out.append(h('div', { class: 'out err' }, 'not an ELF, PE or Mach-O (magic ' + m + ')')); return; }
      } catch (e) { out.append(h('div', { class: 'out err' }, 'parse error: ' + e.message)); return; }
      const t = h('table', { class: 'kv' });
      t.append(h('tr', {}, h('td', {}, 'file'), h('td', {}, f.name + ', ' + f.size + ' B')));
      for (const [k, v] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, String(v))));
      out.append(t);
    };
    root.append(field('executable', filePicker(go)), note('Reads the headers of ELF, PE (EXE/DLL) and Mach-O binaries in your browser.'), out);
  },
};
