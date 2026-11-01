import { h, field, textarea, select, note, fromHex } from '../assets/js/ui.js';

const mac = (b, o) => [...b.slice(o, o + 6)].map(x => x.toString(16).padStart(2, '0')).join(':');
const ip = (b, o) => [b[o], b[o + 1], b[o + 2], b[o + 3]].join('.');
const u16 = (b, o) => (b[o] << 8) | b[o + 1];
const PROTO = { 1: 'ICMP', 6: 'TCP', 17: 'UDP', 2: 'IGMP', 41: 'IPv6', 47: 'GRE', 50: 'ESP' };
const ETH = { 0x0800: 'IPv4', 0x0806: 'ARP', 0x86dd: 'IPv6', 0x8100: '802.1Q VLAN' };

export default {
  id: 'packet', cat: 'sniff', tier: 'a',
  title: 'Packet / hex decoder',
  desc: 'Decode a pasted packet (Ethernet / IP / TCP / UDP)',
  render(root) {
    const inp = textarea({ placeholder: 'paste packet bytes as hex' });
    const start = select([['eth', 'Ethernet frame'], ['ip', 'IPv4 packet']]);
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      const b = fromHex(inp.value);
      if (b.length < 20) { if (inp.value.trim()) out.append(h('div', { class: 'out err' }, 'need at least 20 bytes')); return; }
      const rows = [];
      let off = 0, ethType = 0x0800;
      if (start.value === 'eth') {
        if (b.length < 14) { out.append(h('div', { class: 'out err' }, 'too short for Ethernet')); return; }
        ethType = u16(b, 12);
        rows.push(['Ethernet dst', mac(b, 0)], ['Ethernet src', mac(b, 6)], ['EtherType', '0x' + ethType.toString(16) + ' (' + (ETH[ethType] || '?') + ')']);
        off = 14;
      }
      if (ethType === 0x0800) {
        const ihl = (b[off] & 0x0f) * 4;
        const proto = b[off + 9];
        rows.push(['IP version', b[off] >> 4], ['IP header len', ihl + ' bytes'], ['Total length', u16(b, off + 2)],
          ['TTL', b[off + 8]], ['Protocol', proto + ' (' + (PROTO[proto] || '?') + ')'],
          ['Source IP', ip(b, off + 12)], ['Dest IP', ip(b, off + 16)]);
        const l4 = off + ihl;
        if (proto === 6 && b.length >= l4 + 20) {
          const flags = b[l4 + 13];
          const names = ['FIN', 'SYN', 'RST', 'PSH', 'ACK', 'URG'].filter((_, i) => flags & (1 << i));
          rows.push(['TCP src port', u16(b, l4)], ['TCP dst port', u16(b, l4 + 2)],
            ['Seq', (b[l4 + 4] * 2 ** 24 + b[l4 + 5] * 2 ** 16 + u16(b, l4 + 6)) >>> 0],
            ['TCP flags', '0x' + flags.toString(16) + ' [' + names.join(' ') + ']']);
        } else if (proto === 17 && b.length >= l4 + 8) {
          rows.push(['UDP src port', u16(b, l4)], ['UDP dst port', u16(b, l4 + 2)], ['UDP length', u16(b, l4 + 4)]);
        }
      } else {
        rows.push(['note', 'only IPv4 payloads are decoded further']);
      }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'field'), h('th', {}, 'value')));
      for (const [k, v] of rows) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, String(v))));
      out.append(t);
    };
    inp.addEventListener('input', run); start.addEventListener('change', run);
    root.append(field('starts at', start), field('packet hex', inp, { grow: true }),
      note('Parses Ethernet, IPv4 and the TCP/UDP header. Paste hex (spaces ok).'), out);
  },
};
