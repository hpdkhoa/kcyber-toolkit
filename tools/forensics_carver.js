import { h, field, filePicker, note, button, download, fromHex, toHex } from '../assets/js/ui.js';

function indexOf(buf, pat, from) {
  outer: for (let i = from; i <= buf.length - pat.length; i++) {
    for (let j = 0; j < pat.length; j++) if (buf[i + j] !== pat[j]) continue outer;
    return i;
  }
  return -1;
}
const hx = s => fromHex(s);
// name, header, footer, extension. Footer length is added to the carved size.
const TYPES = [
  { name: 'JPEG', hdr: hx('ffd8ff'), ftr: hx('ffd9'), ext: 'jpg' },
  { name: 'PNG', hdr: hx('89504e470d0a1a0a'), ftr: hx('49454e44ae426082'), ext: 'png' },
  { name: 'GIF', hdr: hx('474946383961'), ftr: hx('003b'), ext: 'gif' },
  { name: 'PDF', hdr: new TextEncoder().encode('%PDF'), ftr: new TextEncoder().encode('%%EOF'), ext: 'pdf' },
  { name: 'ZIP', hdr: hx('504b0304'), ftr: hx('504b0506'), ext: 'zip' },
];

export default {
  id: 'carver', cat: 'forensics', tier: 'a',
  title: 'File carver',
  desc: 'Pull embedded files out of a blob by signature',
  render(root) {
    const out = h('div');
    const go = buf => {
      out.innerHTML = '';
      const found = [];
      for (const t of TYPES) {
        let from = 0;
        while (true) {
          const s = indexOf(buf, t.hdr, from);
          if (s < 0) break;
          const f = indexOf(buf, t.ftr, s + t.hdr.length);
          if (f < 0) { from = s + 1; continue; }
          const end = f + t.ftr.length;
          found.push({ type: t.name, ext: t.ext, off: s, size: end - s, bytes: buf.slice(s, end) });
          from = end;
        }
      }
      found.sort((a, b) => a.off - b.off);
      if (!found.length) { out.append(h('div', { class: 'out' }, 'no embedded JPEG/PNG/GIF/PDF/ZIP found')); return; }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'type'), h('th', {}, 'offset'), h('th', {}, 'size'), h('th', {}, '')));
      found.forEach((x, i) => t.append(h('tr', {},
        h('td', {}, x.type),
        h('td', { class: 'mono' }, '0x' + x.off.toString(16)),
        h('td', {}, x.size + ' B'),
        h('td', {}, h('button', { class: 'copy', onclick: () => download(x.bytes, 'carved_' + i + '.' + x.ext) }, 'save')))));
      out.append(h('div', { class: 'note' }, found.length + ' object(s) found'), t);
    };
    root.append(field('file to carve', filePicker(go)),
      note('Scans for known header/footer pairs (JPEG, PNG, GIF, PDF, ZIP) and extracts each. Runs in your browser.'), out);
  },
};
