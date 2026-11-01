import { h, field, input, filePicker, row, button, note, download, fromHex, toHex, enc } from '../assets/js/ui.js';

const CAP = 65536;
function dump(buf, max) {
  const n = Math.min(buf.length, max);
  let s = '';
  for (let i = 0; i < n; i += 16) {
    const off = i.toString(16).padStart(8, '0');
    let hex = '', asc = '';
    for (let j = 0; j < 16; j++) {
      if (i + j < n) { const b = buf[i + j]; hex += b.toString(16).padStart(2, '0') + ' '; asc += (b >= 32 && b < 127) ? String.fromCharCode(b) : '.'; }
      else hex += '   ';
      if (j === 7) hex += ' ';
    }
    s += off + '  ' + hex + ' ' + asc + '\n';
  }
  if (buf.length > max) s += '... (' + (buf.length - max) + ' more bytes not shown)\n';
  return s;
}

export default {
  id: 'hexview', cat: 're', tier: 'a',
  title: 'Hex viewer / editor',
  desc: 'Inspect bytes, search, patch and download',
  render(root) {
    let buf = null, name = 'file.bin';
    const view = h('div', { class: 'out mono', style: 'max-height:50vh;overflow:auto' });
    const refresh = () => { view.textContent = buf ? dump(buf, CAP) : ''; };
    const onload = (b, f) => { buf = b.slice(); name = f.name; refresh(); findOut.textContent = ''; };

    const findIn = input({ placeholder: 'hex (e.g. 504b) or /text/' });
    const findOut = h('div', { class: 'note mono' });
    const find = () => {
      if (!buf) return;
      const q = findIn.value.trim();
      let pat;
      if (q.startsWith('/') && q.endsWith('/')) pat = enc.encode(q.slice(1, -1));
      else pat = fromHex(q);
      if (!pat.length) { findOut.textContent = 'enter hex or /text/'; return; }
      const hits = [];
      outer: for (let i = 0; i <= buf.length - pat.length && hits.length < 50; i++) {
        for (let j = 0; j < pat.length; j++) if (buf[i + j] !== pat[j]) continue outer;
        hits.push('0x' + i.toString(16));
      }
      findOut.textContent = hits.length ? hits.length + ' hit(s): ' + hits.join(', ') : 'not found';
    };

    const patchOff = input({ placeholder: 'offset (0x.. or dec)' });
    const patchHex = input({ placeholder: 'new bytes hex (e.g. 90 90)' });
    const patchMsg = h('div', { class: 'note' });
    const patch = () => {
      if (!buf) return;
      const off = patchOff.value.trim().startsWith('0x') ? parseInt(patchOff.value, 16) : parseInt(patchOff.value, 10);
      const nb = fromHex(patchHex.value);
      if (isNaN(off) || off < 0 || off + nb.length > buf.length) { patchMsg.textContent = 'offset out of range'; return; }
      buf.set(nb, off); refresh();
      patchMsg.textContent = 'patched ' + nb.length + ' byte(s) at 0x' + off.toString(16);
    };

    root.append(
      field('file', filePicker(onload)),
      note('Shows the first 64 KB. Search, patch bytes, then download the modified file. All in your browser.'),
      view,
      h('h3', {}, 'Search'),
      row(field('pattern', findIn), button('Find', find)), findOut,
      h('h3', {}, 'Patch'),
      row(field('offset', patchOff), field('new bytes (hex)', patchHex), button('Apply', patch)), patchMsg,
      row(button('Download file', () => buf && download(buf, name), 'alt')));
  },
};
