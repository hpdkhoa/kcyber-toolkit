import { h, field, input, output, note } from '../assets/js/ui.js';

const fmt = ms => (ms < -62135596800000 || ms > 253402300799000) ? null : new Date(ms).toISOString().replace('T', ' ').replace('.000Z', ' UTC');

export default {
  id: 'timestamp', cat: 'forensics', tier: 'a',
  title: 'Timestamp / epoch decoder',
  desc: 'Decode a number as many time formats',
  render(root) {
    const inp = input({ placeholder: 'number or date string', class: 'mono' });
    const out = h('div');
    const go = () => {
      out.innerHTML = '';
      const v = inp.value.trim();
      if (!v) return;
      const rows = [];
      const n = Number(v);
      if (!isNaN(n) && v !== '') {
        rows.push(['Unix seconds', fmt(n * 1000)]);
        rows.push(['Unix milliseconds', fmt(n)]);
        rows.push(['Unix microseconds', fmt(n / 1000)]);
        rows.push(['Windows FILETIME (100ns since 1601)', fmt(n / 10000 - 11644473600000)]);
        rows.push(['Mac HFS+ (seconds since 1904)', fmt((n - 2082844800) * 1000)]);
        rows.push(['Apple Cocoa (seconds since 2001)', fmt((n + 978307200) * 1000)]);
      }
      const p = Date.parse(v);
      if (!isNaN(p)) rows.push(['Parsed as date → Unix seconds', Math.floor(p / 1000) + '   (' + fmt(p) + ')']);
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'interpretation'), h('th', {}, 'value')));
      for (const [k, val] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, val || '— out of range')));
      out.append(t);
    };
    inp.addEventListener('input', go);
    root.append(field('input', inp, { grow: true }),
      note('Enter an epoch number to see every common interpretation, or a date string to get its Unix time.'), out);
    inp.value = String(Math.floor(Date.now() / 1000)); go();
  },
};
