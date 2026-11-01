import { h, field, textarea, note, warn } from '../assets/js/ui.js';

function unfold(raw) {
  // join folded header lines (continuation starts with space/tab)
  return raw.replace(/\r\n/g, '\n').replace(/\n[ \t]+/g, ' ');
}
function headers(raw) {
  const out = [];
  for (const line of unfold(raw).split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return out;
}
const domainOf = s => (/@([a-z0-9.\-]+)/i.exec(s || '') || [])[1] || (/\bfrom\s+([a-z0-9.\-]+)/i.exec(s || '') || [])[1];

export default {
  id: 'emailhdr', cat: 'social', tier: 'a',
  title: 'Email-header analyzer',
  desc: 'Trace hops and spot spoofing signs',
  render(root) {
    const inp = textarea({ placeholder: 'paste full email headers', style: 'min-height:160px' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      if (!inp.value.trim()) return;
      const hs = headers(inp.value);
      const get = n => hs.filter(([k]) => k.toLowerCase() === n).map(([, v]) => v);
      const from = get('from')[0], returnPath = get('return-path')[0], replyTo = get('reply-to')[0];
      const auth = get('authentication-results').join(' ; ');
      const flags = [];
      const fromD = domainOf(from), rpD = domainOf(returnPath);
      if (fromD && rpD && fromD !== rpD) flags.push('From domain (' + fromD + ') ≠ Return-Path (' + rpD + ')');
      if (replyTo && domainOf(replyTo) !== fromD) flags.push('Reply-To domain differs from From');
      for (const m of ['spf', 'dkim', 'dmarc']) { const r = new RegExp(m + '=(\\w+)', 'i').exec(auth); if (r && !/pass/i.test(r[1])) flags.push(m.toUpperCase() + '=' + r[1]); }

      const kv = h('table', { class: 'kv' });
      for (const [k, v] of [['From', from], ['Return-Path', returnPath], ['Reply-To', replyTo], ['Subject', get('subject')[0]], ['Message-ID', get('message-id')[0]], ['Auth results', auth]])
        if (v) kv.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, v)));
      out.append(kv);

      const hops = get('received').reverse();
      if (hops.length) {
        out.append(h('h3', {}, 'Received hops (oldest first)'));
        const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, '#'), h('th', {}, 'hop')));
        hops.forEach((v, i) => t.append(h('tr', {}, h('td', {}, i + 1), h('td', { class: 'mono' }, v.length > 160 ? v.slice(0, 160) + '…' : v))));
        out.append(t);
      }
      out.append(flags.length ? h('div', { class: 'warn' }, 'spoofing signs: ' + flags.join('; ')) : h('div', { class: 'out ok' }, 'no obvious From/auth mismatch'));
    };
    inp.addEventListener('input', run);
    root.append(warn('Parsing is local. Headers can contain personal data; nothing is uploaded.'),
      field('headers', inp, { grow: true }), out,
      note('Reads From, Return-Path, Reply-To and Authentication-Results, lists the Received chain, and flags domain or SPF/DKIM/DMARC mismatches.'));
  },
};
