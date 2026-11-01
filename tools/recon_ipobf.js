import { h, field, input, output, note } from '../assets/js/ui.js';

export default {
  id: 'ipobf', cat: 'recon', tier: 'a',
  title: 'IP obfuscation',
  desc: 'Decimal, hex, octal and mixed forms',
  render(root) {
    const inp = input({ value: '192.168.0.1', class: 'mono' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      const octs = inp.value.trim().split('.').map(Number);
      if (octs.length !== 4 || octs.some(o => isNaN(o) || o < 0 || o > 255)) { out.append(h('div', { class: 'out err' }, 'enter a dotted IPv4, e.g. 192.168.0.1')); return; }
      const n = ((octs[0] << 24) >>> 0) + (octs[1] << 16) + (octs[2] << 8) + octs[3];
      const rows = [
        ['Dotted decimal', octs.join('.')],
        ['Integer (decimal)', String(n >>> 0)],
        ['Hex (0x)', '0x' + (n >>> 0).toString(16)],
        ['Dotted hex', octs.map(o => '0x' + o.toString(16).padStart(2, '0')).join('.')],
        ['Octal', '0' + (n >>> 0).toString(8)],
        ['Dotted octal', octs.map(o => '0' + o.toString(8)).join('.')],
        ['IPv6 mapped', '::ffff:' + octs.join('.')],
        ['IPv6 hex', '::ffff:' + ((octs[0] << 8) + octs[1]).toString(16) + ':' + ((octs[2] << 8) + octs[3]).toString(16)],
      ];
      const t = h('table', { class: 'kv' });
      for (const [k, v] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, v)));
      out.append(t);
    };
    inp.addEventListener('input', run);
    root.append(field('IPv4', inp, { grow: true }), note('Different encodings of the same address. Useful for recognising obfuscated IPs in logs and URLs.'), out);
    run();
  },
};
