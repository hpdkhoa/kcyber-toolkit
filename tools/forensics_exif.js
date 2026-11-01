import { h, field, filePicker, note } from '../assets/js/ui.js';

const TAGS = {
  0x0100: 'ImageWidth', 0x0101: 'ImageHeight', 0x010f: 'Make', 0x0110: 'Model',
  0x0112: 'Orientation', 0x0131: 'Software', 0x0132: 'DateTime', 0x013b: 'Artist',
  0x8298: 'Copyright', 0x829a: 'ExposureTime', 0x829d: 'FNumber', 0x8827: 'ISO',
  0x9003: 'DateTimeOriginal', 0x9004: 'DateTimeDigitized', 0x920a: 'FocalLength',
  0xa002: 'PixelXDimension', 0xa003: 'PixelYDimension', 0xa432: 'LensInfo',
  0xa434: 'LensModel', 0x8825: '_GPSIFD',
};
const GPS = { 1: 'GPSLatitudeRef', 2: 'GPSLatitude', 3: 'GPSLongitudeRef', 4: 'GPSLongitude', 5: 'GPSAltitudeRef', 6: 'GPSAltitude' };
const ORIENT = { 1: 'normal', 2: 'flip H', 3: 'rotate 180', 4: 'flip V', 5: 'transpose', 6: 'rotate 90 CW', 7: 'transverse', 8: 'rotate 90 CCW' };
const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

function readExif(bytes) {
  const dv = new DataView(bytes.buffer);
  if (dv.getUint16(0) !== 0xffd8) throw new Error('not a JPEG');
  let off = 2, exifStart = -1;
  while (off < bytes.length) {
    if (dv.getUint16(off) === 0xffe1) { exifStart = off + 4; break; }
    if ((dv.getUint16(off) & 0xff00) !== 0xff00) break;
    off += 2 + dv.getUint16(off + 2);
  }
  if (exifStart < 0) throw new Error('no EXIF (APP1) block found');
  if (new TextDecoder().decode(bytes.slice(exifStart, exifStart + 4)) !== 'Exif') throw new Error('no Exif header');
  const tiff = exifStart + 6;
  const le = dv.getUint16(tiff) === 0x4949;
  const g16 = o => dv.getUint16(tiff + o, le), g32 = o => dv.getUint32(tiff + o, le);
  const out = {};
  const readVal = (type, count, valOff) => {
    const size = TYPE_SIZE[type] || 1, total = size * count;
    const base = total > 4 ? g32(valOff) : valOff;
    if (type === 2) return new TextDecoder().decode(bytes.slice(tiff + base, tiff + base + count)).replace(/\0+$/, '');
    const vals = [];
    for (let i = 0; i < count; i++) {
      const o = base + i * size;
      if (type === 3) vals.push(g16(o));
      else if (type === 4 || type === 9) vals.push(dv.getUint32(tiff + o, le));
      else if (type === 5) vals.push(g32(o) + '/' + g32(o + 4));
      else if (type === 1 || type === 7) vals.push(bytes[tiff + o]);
      else vals.push(bytes[tiff + o]);
    }
    return vals.length === 1 ? vals[0] : vals;
  };
  const parseIFD = (ifdOff, map, dest) => {
    const n = g16(ifdOff);
    for (let i = 0; i < n; i++) {
      const e = ifdOff + 2 + i * 12;
      const tag = g16(e), type = g16(e + 2), count = g32(e + 4);
      const name = map[tag];
      if (map === TAGS && tag === 0x8825) { dest._gps = g32(e + 8); continue; }
      if (!name) continue;
      try { dest[name] = readVal(type, count, e + 8); } catch {}
    }
    return g32(ifdOff + 2 + n * 12);
  };
  const ifd0 = g32(4);
  parseIFD(ifd0, TAGS, out);
  // ExifIFD pointer 0x8769
  const n0 = g16(ifd0);
  for (let i = 0; i < n0; i++) { const e = ifd0 + 2 + i * 12; if (g16(e) === 0x8769) parseIFD(g32(e + 8), TAGS, out); }
  if (out._gps) { const gps = {}; parseIFD(out._gps, GPS, gps); out.GPS = gps; delete out._gps; }
  return out;
}

function dms(arr, ref) {
  if (!Array.isArray(arr)) return null;
  const f = r => { const [a, b] = String(r).split('/').map(Number); return b ? a / b : a; };
  let d = f(arr[0]) + f(arr[1]) / 60 + f(arr[2]) / 3600;
  if (ref === 'S' || ref === 'W') d = -d;
  return d.toFixed(6);
}

export default {
  id: 'exif', cat: 'forensics', tier: 'a',
  title: 'EXIF / metadata viewer',
  desc: 'Camera, timestamps and GPS from a JPEG',
  render(root) {
    const out = h('div');
    const go = bytes => {
      out.innerHTML = '';
      let data;
      try { data = readExif(bytes); } catch (e) { out.append(h('div', { class: 'out err' }, e.message)); return; }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'tag'), h('th', {}, 'value')));
      for (const [k, v] of Object.entries(data)) {
        if (k === 'GPS') continue;
        let val = v;
        if (k === 'Orientation') val = v + ' (' + (ORIENT[v] || '?') + ')';
        t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, String(val))));
      }
      out.append(t);
      if (data.GPS && data.GPS.GPSLatitude) {
        const lat = dms(data.GPS.GPSLatitude, data.GPS.GPSLatitudeRef), lon = dms(data.GPS.GPSLongitude, data.GPS.GPSLongitudeRef);
        out.append(h('div', { class: 'warn' }, 'GPS location present: ' + lat + ', ' + lon + '  ',
          h('a', { href: 'https://www.openstreetmap.org/?mlat=' + lat + '&mlon=' + lon + '#map=15/' + lat + '/' + lon, target: '_blank', rel: 'noopener' }, 'map')));
      }
    };
    root.append(field('JPEG file', filePicker(go, { accept: 'image/jpeg' })),
      note('Parses the JPEG APP1/Exif block in your browser. Many images carry the camera model and GPS coordinates.'), out);
  },
};
