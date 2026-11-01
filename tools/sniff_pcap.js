import { h, field, filePicker, note, toHex } from '../assets/js/ui.js';

const PROTO = { 1: 'ICMP', 6: 'TCP', 17: 'UDP', 2: 'IGMP', 47: 'GRE', 50: 'ESP' };
const ipS = (b, o) => b[o] + '.' + b[o + 1] + '.' + b[o + 2] + '.' + b[o + 3];

function decodeEth(b) {
  if (b.length < 34) return { summary: 'short frame (' + b.length + 'B)' };
  const etype = (b[12] << 8) | b[13];
  if (etype === 0x0806) return { summary: 'ARP' };
  if (etype === 0x86dd) return { summary: 'IPv6' };
  if (etype !== 0x0800) return { summary: 'EtherType 0x' + etype.toString(16) };
  const ihl = (b[14] & 0x0f) * 4, proto = b[23], l4 = 14 + ihl;
  const src = ipS(b, 26), dst = ipS(b, 30);
  let ports = '';
  if ((proto === 6 || proto === 17) && b.length >= l4 + 4) ports = ' ' + ((b[l4] << 8) | b[l4 + 1]) + '→' + ((b[l4 + 2] << 8) | b[l4 + 3]);
  return { summary: (PROTO[proto] || 'IP') + ' ' + src + '→' + dst + ports };
}

export default {
  id: 'pcap', cat: 'sniff', tier: 'a',
  title: 'PCAP parser',
  desc: 'List packets from a capture file',
  render(root) {
    const out = h('div');
    const go = (b, f) => {
      out.innerHTML = '';
      const m = toHex(b.slice(0, 4));
      if (m === '0a0d0d0a') { out.append(h('div', { class: 'out err' }, 'this is a pcapng file; this tool reads classic .pcap. Re-export as pcap (Wireshark: Save As → tcpdump pcap).')); return; }
      const le = m === 'd4c3b2a1' || m === '4d3cb2a1';
      if (!['a1b2c3d4', 'd4c3b2a1', 'a1b23c4d', '4d3cb2a1'].includes(m)) { out.append(h('div', { class: 'out err' }, 'not a pcap (magic ' + m + ')')); return; }
      const dv = new DataView(b.buffer);
      const u32 = o => dv.getUint32(o, le), u16 = o => dv.getUint16(o, le);
      const linktype = u32(20);
      let off = 24, i = 0;
      const rows = [];
      while (off + 16 <= b.length && i < 5000) {
        const tsSec = u32(off), tsUsec = u32(off + 4), inclLen = u32(off + 8);
        const data = b.slice(off + 16, off + 16 + inclLen);
        const info = linktype === 1 ? decodeEth(data) : { summary: 'linktype ' + linktype };
        rows.push({ n: ++i, ts: tsSec + '.' + String(tsUsec).padStart(6, '0'), len: inclLen, info: info.summary });
        off += 16 + inclLen;
      }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, '#'), h('th', {}, 'time'), h('th', {}, 'len'), h('th', {}, 'summary')));
      const t0 = rows.length ? parseFloat(rows[0].ts) : 0;
      for (const r of rows.slice(0, 2000)) t.append(h('tr', {}, h('td', {}, r.n), h('td', { class: 'mono' }, (parseFloat(r.ts) - t0).toFixed(6)), h('td', {}, r.len), h('td', { class: 'mono' }, r.info)));
      out.append(h('div', { class: 'note' }, rows.length + ' packet(s), link type ' + linktype + (linktype === 1 ? ' (Ethernet)' : '') + (rows.length > 2000 ? ', showing 2000' : '')), t);
    };
    root.append(field('.pcap file', filePicker(go, { accept: '.pcap,.cap' })),
      note('Classic libpcap format, Ethernet link type decoded to protocol and addresses. Parsed in your browser.'), out);
  },
};
