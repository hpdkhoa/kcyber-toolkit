import { h, field, textarea, note, warn } from '../assets/js/ui.js';

function parse(s) {
  s = s.trim();
  const fields = {};
  // URI form: scheme://user:pass@host:port/db?params
  const uri = /^([a-z0-9+]+):\/\/(?:([^:@/]+)(?::([^@/]*))?@)?([^:/?]+)?(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/i.exec(s);
  if (uri) {
    fields.scheme = uri[1];
    if (uri[2]) fields.user = decodeURIComponent(uri[2]);
    if (uri[3] !== undefined) fields.password = decodeURIComponent(uri[3]);
    if (uri[4]) fields.host = uri[4];
    if (uri[5]) fields.port = uri[5];
    if (uri[6]) fields.database = uri[6];
    if (uri[7]) for (const kv of uri[7].split('&')) { const [k, v] = kv.split('='); fields[k] = decodeURIComponent(v || ''); }
    return fields;
  }
  // key=value; form (ADO.NET / JDBC props)
  for (const part of s.split(/[;]+/)) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    fields[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return fields;
}
const SECRET = /pass|pwd|secret|key|token/i;

export default {
  id: 'connstr', cat: 'db', tier: 'a',
  title: 'Connection-string parser',
  desc: 'Break a DB connection string into fields',
  render(root) {
    const inp = textarea({ placeholder: 'postgres://user:pass@host:5432/db  or  Server=...;Database=...;User Id=...;Password=...;' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      if (!inp.value.trim()) return;
      const f = parse(inp.value);
      const keys = Object.keys(f);
      if (!keys.length) { out.append(h('div', { class: 'out err' }, 'could not parse')); return; }
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'key'), h('th', {}, 'value')));
      let hasSecret = false;
      for (const k of keys) { if (SECRET.test(k)) hasSecret = true; t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' + (SECRET.test(k) ? ' ' : '') }, String(f[k])))); }
      out.append(t);
      if (hasSecret) out.append(h('div', { class: 'warn' }, 'contains a credential — handle and store this string as a secret'));
    };
    inp.addEventListener('input', run);
    root.append(warn('Parsing is local. Do not paste production secrets into any site you do not control; this one keeps it in your browser.'),
      field('connection string', inp, { grow: true }), out, note('Handles URI form and key=value form (ADO.NET, JDBC, postgres/mysql/mongodb URIs).'));
  },
};
