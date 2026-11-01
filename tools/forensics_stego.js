import { h, field, filePicker, textarea, button, row, note, warn, download, enc, dec } from '../assets/js/ui.js';

// LSB in R,G,B channels. 32-bit big-endian length header, then UTF-8 bytes.
function toImageData(bytes, type) {
  return new Promise((res, rej) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([bytes], { type }));
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      res({ ctx, data: ctx.getImageData(0, 0, c.width, c.height), c });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => rej(new Error('cannot read image'));
    img.src = url;
  });
}
function bitsOf(bytes) { const out = []; for (const b of bytes) for (let i = 7; i >= 0; i--) out.push((b >> i) & 1); return out; }

export default {
  id: 'stego', cat: 'forensics', tier: 'a',
  title: 'Stego (LSB)',
  desc: 'Hide and extract a message in an image',
  render(root) {
    let img = null, imgType = 'image/png';
    const msg = textarea({ placeholder: 'message to hide' });
    const status = h('div', { class: 'note' });
    const out = h('div');
    const onimg = (b, f) => { img = b; imgType = f.type || 'image/png'; status.textContent = 'loaded ' + f.name; };

    const hide = async () => {
      out.innerHTML = '';
      if (!img) { out.append(h('div', { class: 'out err' }, 'load a cover image first')); return; }
      try {
        const { data, ctx, c } = await toImageData(img, imgType);
        const payload = enc.encode(msg.value);
        const header = new Uint8Array([(payload.length >> 24) & 255, (payload.length >> 16) & 255, (payload.length >> 8) & 255, payload.length & 255]);
        const bits = bitsOf(new Uint8Array([...header, ...payload]));
        const cap = Math.floor(data.data.length / 4) * 3;
        if (bits.length > cap) { out.append(h('div', { class: 'out err' }, 'message too large: needs ' + bits.length + ' bits, image holds ' + cap)); return; }
        let bi = 0;
        for (let p = 0; p < data.data.length && bi < bits.length; p += 4)
          for (let ch = 0; ch < 3 && bi < bits.length; ch++) { data.data[p + ch] = (data.data[p + ch] & 0xfe) | bits[bi++]; }
        ctx.putImageData(data, 0, 0);
        c.toBlob(blob => blob.arrayBuffer().then(ab => {
          download(new Uint8Array(ab), 'stego.png', 'image/png');
          out.append(h('div', { class: 'out ok' }, 'embedded ' + payload.length + ' bytes, stego.png downloaded (PNG, lossless)'));
        }), 'image/png');
      } catch (e) { out.append(h('div', { class: 'out err' }, e.message)); }
    };
    const extract = async () => {
      out.innerHTML = '';
      if (!img) { out.append(h('div', { class: 'out err' }, 'load a stego image first')); return; }
      try {
        const { data } = await toImageData(img, imgType);
        const read = n => { const bytes = new Uint8Array(n); let bi = 0;
          for (let p = 0; p < data.data.length && bi < n * 8; p += 4)
            for (let ch = 0; ch < 3 && bi < n * 8; ch++) { bytes[(bi / 8) | 0] = (bytes[(bi / 8) | 0] << 1) | (data.data[p + ch] & 1); bi++; }
          return bytes; };
        const all = read(4 + 0);
        const len = (all[0] << 24) | (all[1] << 16) | (all[2] << 8) | all[3];
        if (len < 0 || len > data.data.length) { out.append(h('div', { class: 'out err' }, 'no LSB message found (or not made by this tool)')); return; }
        const full = read(4 + len);
        out.append(h('div', { class: 'out ok' }, dec.decode(full.slice(4))));
      } catch (e) { out.append(h('div', { class: 'out err' }, e.message)); }
    };

    root.append(
      warn('Use a PNG or other lossless image as the carrier. JPEG re-compression destroys LSB data.'),
      field('image', filePicker(onimg)), status,
      field('message (for hiding)', msg, { grow: true }),
      row(button('Hide → download PNG', hide), button('Extract', extract, 'alt')),
      note('Embeds in the low bit of R, G, B. 3 bits per pixel. Capacity ≈ width × height × 3 / 8 bytes.'),
      out);
  },
};
