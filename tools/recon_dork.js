import { h, field, input, select, output, note, copyText } from '../assets/js/ui.js';

const ENGINES = {
  'Google': { url: q => 'https://www.google.com/search?q=' + encodeURIComponent(q), ops: ['site', 'filetype', 'inurl', 'intitle', 'intext', 'ext', '-site'] },
  'Bing': { url: q => 'https://www.bing.com/search?q=' + encodeURIComponent(q), ops: ['site', 'filetype', 'inurl', 'intitle', 'ext'] },
  'DuckDuckGo': { url: q => 'https://duckduckgo.com/?q=' + encodeURIComponent(q), ops: ['site', 'filetype', 'inurl', 'intitle'] },
  'GitHub code': { url: q => 'https://github.com/search?type=code&q=' + encodeURIComponent(q), ops: ['filename', 'extension', 'path', 'language', 'user', 'org'] },
  'Shodan': { url: q => 'https://www.shodan.io/search?query=' + encodeURIComponent(q), ops: ['hostname', 'port', 'org', 'product', 'country', 'http.title'] },
};
const PRESETS = {
  'Google': ['site:example.com ext:sql', 'intitle:"index of" "parent directory"', 'inurl:admin login', 'filetype:env "DB_PASSWORD"', 'site:example.com -www'],
  'GitHub code': ['org:example AWS_SECRET_ACCESS_KEY', 'filename:.env DB_PASSWORD', 'extension:pem private'],
  'Shodan': ['org:"Example Inc" port:22', 'http.title:"admin" country:US', 'product:nginx'],
};

export default {
  id: 'dork', cat: 'recon', tier: 'a',
  title: 'Dork builder',
  desc: 'Build Google / GitHub / Shodan queries',
  render(root) {
    const eng = select(Object.keys(ENGINES));
    const kw = input({ placeholder: 'free keywords' });
    const opWrap = h('div', { class: 'row' });
    const opInputs = {};
    const out = output({ label: 'query' });
    const link = h('div', { class: 'note' });
    const presetChips = h('div', { class: 'chips' });
    const buildFields = () => {
      opWrap.innerHTML = ''; for (const k in opInputs) delete opInputs[k];
      for (const op of ENGINES[eng.value].ops) { const i = input({ placeholder: op }); opInputs[op] = i; i.addEventListener('input', build); opWrap.append(field(op, i)); }
      presetChips.innerHTML = '';
      for (const p of (PRESETS[eng.value] || [])) presetChips.append(h('span', { class: 'chip', onclick: () => { kw.value = p; Object.values(opInputs).forEach(i => i.value = ''); build(); } }, p));
    };
    const build = () => {
      const parts = [];
      for (const [op, i] of Object.entries(opInputs)) if (i.value.trim()) parts.push(op + ':' + (i.value.includes(' ') ? '"' + i.value + '"' : i.value));
      if (kw.value.trim()) parts.unshift(kw.value.trim());
      const q = parts.join(' ');
      out.set(q || '(empty)', q ? 'ok' : '');
      link.innerHTML = '';
      if (q) link.append(h('a', { href: ENGINES[eng.value].url(q), target: '_blank', rel: 'noopener' }, 'open in ' + eng.value), '  ',
        h('button', { class: 'copy', onclick: () => copyText(q) }, 'copy'));
    };
    eng.addEventListener('change', () => { buildFields(); build(); });
    kw.addEventListener('input', build);
    root.append(field('engine', eng), field('keywords', kw, { grow: true }), opWrap,
      note('Click a preset or fill the operators. The query runs only when you open the link.'), presetChips, out.el, link);
    buildFields(); build();
  },
};
