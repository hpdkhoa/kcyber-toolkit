import { h, field, input, output, note } from '../assets/js/ui.js';

function parse(cidr) {
  const [ip, bitsStr] = cidr.trim().split('/');
  const bits = bitsStr === undefined ? 32 : +bitsStr;
  const octs = ip.split('.').map(Number);
  if (octs.length !== 4 || octs.some(o => isNaN(o) || o < 0 || o > 255) || bits < 0 || bits > 32) throw new Error('invalid CIDR, e.g. 192.168.1.0/24');
  const ipn = ((octs[0] << 24) >>> 0) + (octs[1] << 16) + (octs[2] << 8) + octs[3];
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  const net = (ipn & mask) >>> 0;
  const bcast = (net | (~mask >>> 0)) >>> 0;
  const toIp = n => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  const total = Math.pow(2, 32 - bits);
  const usable = bits >= 31 ? total : total - 2;
  return { net: toIp(net), bcast: toIp(bcast), mask: toIp(mask), wildcard: toIp(~mask >>> 0), bits, total, usable, first: toIp(bits >= 31 ? net : net + 1), last: toIp(bits >= 31 ? bcast : bcast - 1) };
}

export default {
  id: 'cidr', cat: 'recon', tier: 'a',
  title: 'CIDR / subnet calculator',
  desc: 'Network, broadcast, mask, host range',
  render(root) {
    const inp = input({ value: '192.168.1.0/24', class: 'mono' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      try {
        const r = parse(inp.value);
        const t = h('table', { class: 'kv' });
        const rows = [['Network', r.net + '/' + r.bits], ['Netmask', r.mask], ['Wildcard', r.wildcard], ['Broadcast', r.bcast], ['First host', r.first], ['Last host', r.last], ['Total addresses', r.total.toLocaleString()], ['Usable hosts', r.usable.toLocaleString()]];
        for (const [k, v] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, String(v))));
        out.append(t);
      } catch (e) { out.append(h('div', { class: 'out err' }, e.message)); }
    };
    inp.addEventListener('input', run);
    root.append(field('CIDR', inp, { grow: true }), note('IPv4. Enter an address and prefix, e.g. 10.0.0.0/8.'), out);
    run();
  },
};
