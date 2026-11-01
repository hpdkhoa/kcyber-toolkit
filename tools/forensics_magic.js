import { h, field, filePicker, note, toHex } from '../assets/js/ui.js';

// prefix signatures (hex). Checked longest-first.
const SIGS = [
  ['89504e470d0a1a0a', 'PNG image', 'png'],
  ['ffd8ff', 'JPEG image', 'jpg'],
  ['474946383961', 'GIF image (89a)', 'gif'],
  ['474946383761', 'GIF image (87a)', 'gif'],
  ['424d', 'BMP image', 'bmp'],
  ['25504446', 'PDF document', 'pdf'],
  ['504b0304', 'ZIP / Office / JAR', 'zip'],
  ['504b0506', 'ZIP (empty)', 'zip'],
  ['1f8b', 'GZIP', 'gz'],
  ['425a68', 'BZIP2', 'bz2'],
  ['377abcaf271c', '7-Zip', '7z'],
  ['526172211a0700', 'RAR', 'rar'],
  ['7f454c46', 'ELF executable', 'elf'],
  ['4d5a', 'Windows PE (EXE/DLL)', 'exe'],
  ['cafebabe', 'Java class / Mach-O fat', 'class'],
  ['feedface', 'Mach-O 32', 'macho'],
  ['feedfacf', 'Mach-O 64', 'macho'],
  ['cffaedfe', 'Mach-O 64 (LE)', 'macho'],
  ['d0cf11e0a1b11ae1', 'MS Office (legacy OLE)', 'doc'],
  ['53514c69746520666f726d6174203300', 'SQLite database', 'sqlite'],
  ['4f676753', 'OGG', 'ogg'],
  ['494433', 'MP3 (ID3)', 'mp3'],
  ['000001ba', 'MPEG program stream', 'mpg'],
  ['3c3f786d6c', 'XML', 'xml'],
  ['7b', 'JSON / text ({)', 'json'],
];
// RIFF container needs bytes 8-12
function riff(b) {
  if (toHex(b.slice(0, 4)) !== '52494646') return null;
  const t = new TextDecoder().decode(b.slice(8, 12));
  return { WEBP: 'WebP image', WAVE: 'WAV audio', AVI: 'AVI video' }[t] || 'RIFF container';
}

export default {
  id: 'magicbytes', cat: 'forensics', tier: 'a',
  title: 'File-type / magic bytes',
  desc: 'What a file really is, from its signature',
  render(root) {
    const out = h('div');
    const inspect = (b, f) => {
      out.innerHTML = '';
      const hex = toHex(b.slice(0, 16));
      let match = riff(b);
      if (!match) {
        for (const [sig, name] of [...SIGS].sort((a, c) => c[0].length - a[0].length))
          if (hex.startsWith(sig)) { match = name; break; }
      }
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      const t = h('table', { class: 'kv' },
        h('tr', {}, h('td', {}, 'name'), h('td', {}, f.name)),
        h('tr', {}, h('td', {}, 'size'), h('td', {}, f.size + ' bytes')),
        h('tr', {}, h('td', {}, 'detected'), h('td', {}, match || 'unknown')),
        h('tr', {}, h('td', {}, 'first 16 bytes'), h('td', { class: 'mono' }, hex.replace(/(..)/g, '$1 ').trim())));
      out.append(t);
      if (match && ext) {
        const names = match.toLowerCase();
        const mismatch = !names.includes(ext) && !(ext === 'jpeg' && names.includes('jpeg')) && !(['docx', 'xlsx', 'pptx', 'jar', 'apk'].includes(ext) && match.includes('ZIP'));
        if (mismatch) out.append(h('div', { class: 'warn' }, 'extension .' + ext + ' does not match the detected type — possible renamed or spoofed file'));
      }
    };
    root.append(field('file', filePicker(inspect)), note('Reads only the first bytes. The file never leaves your browser.'), out);
  },
};
