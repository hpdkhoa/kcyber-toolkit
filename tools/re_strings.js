import { h, field, input, filePicker, row, button, note, copyText } from '../assets/js/ui.js';

export default {
  id: 'strings', cat: 're', tier: 'a',
  title: 'Strings',
  desc: 'Pull printable text out of a binary',
  render(root) {
    let buf = null;
    const minLen = input({ type: 'number', value: '4' });
    const utf16 = h('input', { type: 'checkbox' });
    const out = h('div');
    const onload = b => { buf = b; run(); };
    const run = () => {
      out.innerHTML = '';
      if (!buf) return;
      const min = Math.max(1, +minLen.value || 4);
      const hits = [];
      // ASCII runs
      let start = -1, cur = '';
      for (let i = 0; i <= buf.length; i++) {
        const b = buf[i];
        if (b >= 32 && b < 127) { if (start < 0) start = i; cur += String.fromCharCode(b); }
        else { if (cur.length >= min) hits.push([start, cur]); start = -1; cur = ''; }
      }
      // UTF-16LE runs
      if (utf16.checked) {
        start = -1; cur = '';
        for (let i = 0; i + 1 < buf.length; i += 2) {
          const b = buf[i], hi = buf[i + 1];
          if (hi === 0 && b >= 32 && b < 127) { if (start < 0) start = i; cur += String.fromCharCode(b); }
          else { if (cur.length >= min) hits.push([start, cur + '  (utf16)']); start = -1; cur = ''; }
        }
      }
      hits.sort((a, b) => a[0] - b[0]);
      const capped = hits.slice(0, 2000);
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'offset'), h('th', {}, 'string')));
      for (const [o, s] of capped) t.append(h('tr', {}, h('td', { class: 'mono' }, '0x' + o.toString(16)), h('td', { class: 'mono' }, s)));
      out.append(h('div', { class: 'note' }, hits.length + ' string(s)' + (hits.length > capped.length ? ', showing first 2000' : '') + '  ',
        h('button', { class: 'copy', onclick: () => copyText(capped.map(x => x[1]).join('\n')) }, 'copy all')), t);
    };
    minLen.addEventListener('input', run); utf16.addEventListener('change', run);
    root.append(
      field('file', filePicker(onload)),
      row(field('min length', minLen), h('div', { class: 'fld' }, h('label', {}, 'include UTF-16LE'), h('div', {}, utf16)), button('Run', run)),
      note('Lists printable runs and their offsets, like the Unix strings command.'), out);
  },
};
