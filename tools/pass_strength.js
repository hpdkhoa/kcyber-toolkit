import { h, field, input, output, note } from '../assets/js/ui.js';

const COMMON = new Set(['password', '123456', '123456789', 'qwerty', 'abc123', 'password1', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'iloveyou', '111111', 'sunshine', 'princess', 'football', 'charlie', 'root', 'toor', 'pass']);

function charsetSize(p) {
  let s = 0;
  if (/[a-z]/.test(p)) s += 26;
  if (/[A-Z]/.test(p)) s += 26;
  if (/[0-9]/.test(p)) s += 10;
  if (/[^a-zA-Z0-9]/.test(p)) s += 33;
  return s;
}
function analyse(p) {
  if (!p) return null;
  const base = charsetSize(p);
  let bits = p.length * Math.log2(base || 1);
  const flags = [];
  const low = p.toLowerCase();
  if (COMMON.has(low)) { bits = Math.min(bits, 8); flags.push('is a common password'); }
  if (/^(.)\1+$/.test(p)) { bits = Math.min(bits, 10); flags.push('single repeated character'); }
  if (/(.)\1{2,}/.test(p)) flags.push('repeated runs');
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf/i.test(p)) { bits -= 10; flags.push('sequential pattern'); }
  if (/(19|20)\d\d/.test(p)) flags.push('contains a year');
  bits = Math.max(0, bits);
  const score = bits < 28 ? 0 : bits < 36 ? 1 : bits < 60 ? 2 : bits < 128 ? 3 : 4;
  const label = ['very weak', 'weak', 'fair', 'strong', 'very strong'][score];
  // crack time at 1e10 guesses/sec (offline fast hash)
  const secs = Math.pow(2, bits) / 1e10;
  return { bits: Math.round(bits), base, score, label, flags, crack: humanTime(secs) };
}
function humanTime(s) {
  if (s < 1) return 'instant';
  const u = [['years', 31536000], ['days', 86400], ['hours', 3600], ['minutes', 60], ['seconds', 1]];
  for (const [n, v] of u) if (s >= v) return (s / v >= 1e9 ? (s / v).toExponential(1) : Math.round(s / v).toLocaleString()) + ' ' + n;
  return '< 1 second';
}

export default {
  id: 'pwstrength', cat: 'pass', tier: 'a',
  title: 'Strength / entropy meter',
  desc: 'Entropy, score and crack-time estimate',
  render(root) {
    const inp = input({ placeholder: 'password to test', class: 'mono' });
    const bar = h('div', { style: 'height:8px;border-radius:4px;background:var(--panel2);overflow:hidden;margin:6px 0' });
    const fill = h('div', { style: 'height:100%;width:0;transition:.2s' }); bar.append(fill);
    const out = h('div');
    const colors = ['#f85149', '#f85149', '#d29922', '#3fb950', '#2f81f7'];
    const run = () => {
      out.innerHTML = '';
      const a = analyse(inp.value);
      if (!a) { fill.style.width = '0'; return; }
      fill.style.width = (a.score + 1) * 20 + '%'; fill.style.background = colors[a.score];
      const t = h('table', { class: 'kv' },
        h('tr', {}, h('td', {}, 'verdict'), h('td', {}, a.label + ' (' + a.score + '/4)')),
        h('tr', {}, h('td', {}, 'entropy'), h('td', {}, a.bits + ' bits')),
        h('tr', {}, h('td', {}, 'charset size'), h('td', {}, a.base)),
        h('tr', {}, h('td', {}, 'offline crack (1e10/s)'), h('td', {}, a.crack)));
      out.append(t);
      if (a.flags.length) out.append(h('div', { class: 'warn' }, 'weaknesses: ' + a.flags.join('; ')));
    };
    inp.addEventListener('input', run);
    root.append(field('password', inp, { grow: true }), bar, out,
      note('Entropy from charset and length, reduced for common passwords and patterns. Crack time assumes a fast offline hash at 10 billion guesses/second. Typed text stays in your browser.'));
  },
};
