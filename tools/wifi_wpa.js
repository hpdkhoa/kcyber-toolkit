import { h, field, textarea, filePicker, note, warn, toHex, dec } from '../assets/js/ui.js';

const hexToAscii = hx => { try { return dec.decode(new Uint8Array((hx.match(/../g) || []).map(x => parseInt(x, 16)))); } catch { return hx; } };
const macFmt = hx => (hx.match(/../g) || []).join(':');

// hashcat 22000 line: WPA*<type>*<PMKID|MIC>*<MAC_AP>*<MAC_STA>*<ESSID_hex>*...
function parse22000(text) {
  const out = [];
  for (const line of text.split('\n')) {
    const p = line.trim().split('*');
    if (p[0] !== 'WPA' || p.length < 6) continue;
    out.push({
      kind: p[1] === '01' ? 'PMKID' : p[1] === '02' ? 'EAPOL (MIC)' : p[1],
      hashOrMic: p[2], ap: macFmt(p[3]), sta: macFmt(p[4]), essid: hexToAscii(p[5]),
    });
  }
  return out;
}

export default {
  id: 'wpa', cat: 'wifi', tier: 'a',
  title: 'WPA handshake / PMKID parser',
  desc: 'Read a hashcat 22000 / hccapx capture',
  render(root) {
    const inp = textarea({ placeholder: 'paste hashcat 22000 lines (WPA*01*... / WPA*02*...)', style: 'min-height:120px' });
    const out = h('div');
    const show = rows => {
      out.innerHTML = '';
      if (!rows.length) { out.append(h('div', { class: 'out' }, 'no WPA records found')); return; }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'type'), h('th', {}, 'ESSID'), h('th', {}, 'AP MAC'), h('th', {}, 'STA MAC'), h('th', {}, 'PMKID/MIC')));
      for (const r of rows) t.append(h('tr', {}, h('td', {}, r.kind), h('td', {}, r.essid), h('td', { class: 'mono' }, r.ap), h('td', { class: 'mono' }, r.sta), h('td', { class: 'mono' }, r.hashOrMic.slice(0, 20) + '…')));
      out.append(h('div', { class: 'note' }, rows.length + ' record(s)'), t);
    };
    const run = () => show(parse22000(inp.value));
    inp.addEventListener('input', run);
    const onfile = (b, f) => {
      if (toHex(b.slice(0, 4)) === '48435058') { out.innerHTML = ''; out.append(h('div', { class: 'out' }, 'hccapx file: ' + Math.floor(b.length / 393) + ' record(s). Convert to the 22000 format with hcxtools for full fields.')); return; }
      inp.value = dec.decode(b); run();
    };
    root.append(
      warn('Parses your own captures for cracking you are authorised to perform. It reads records; it does not capture traffic or crack keys.'),
      field('load file (.22000 / .hc22000 / .hccapx)', filePicker(onfile)),
      field('or paste', inp, { grow: true }), out,
      note('The 22000 format is what hcxdumptool/hcxpcapngtool produce. ESSID is shown decoded from hex.'));
  },
};
