import { h, field, textarea, filePicker, note, dec } from '../assets/js/ui.js';

// Field extractor for nuclei YAML templates. Not a full YAML engine.
function extract(y) {
  const g = re => (re.exec(y) || [])[1];
  const all = re => [...y.matchAll(re)].map(m => m[1].trim());
  return {
    id: g(/^id:\s*(.+)$/m),
    name: g(/\bname:\s*(.+)$/m),
    severity: g(/severity:\s*(.+)$/m),
    author: g(/author:\s*(.+)$/m),
    tags: g(/tags:\s*(.+)$/m),
    description: g(/description:\s*(.+)$/m),
    methods: all(/^\s*(?:-\s*)?method:\s*(.+)$/gm),
    paths: all(/^\s*-\s*["']?(\{\{BaseURL\}\}[^"'\n]*)["']?/gm),
    matchers: all(/^\s*-\s*type:\s*(.+)$/gm),
    cves: all(/\b(CVE-\d{4}-\d+)\b/g),
  };
}

export default {
  id: 'nuclei', cat: 'vuln', tier: 'a',
  title: 'nuclei template viewer',
  desc: 'Read a nuclei template offline',
  render(root) {
    const inp = textarea({ placeholder: 'paste a nuclei YAML template', style: 'min-height:200px' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      if (!inp.value.trim()) return;
      const d = extract(inp.value);
      const t = h('table', { class: 'kv' });
      const add = (k, v) => { if (v && v.length) t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, Array.isArray(v) ? v.join(', ') : v))); };
      add('id', d.id); add('name', d.name); add('severity', d.severity); add('author', d.author);
      add('tags', d.tags); add('CVEs', [...new Set(d.cves)]); add('description', d.description);
      add('HTTP methods', d.methods); add('paths', d.paths); add('matcher types', d.matchers);
      out.append(t.children.length ? t : h('div', { class: 'out' }, 'no recognised fields'));
    };
    inp.addEventListener('input', run);
    const onfile = b => { inp.value = dec.decode(b); run(); };
    root.append(field('load .yaml', filePicker(onfile, { accept: '.yaml,.yml' })),
      field('template', inp, { grow: true }), out,
      note('Extracts the common fields (id, info, matchers, paths, CVEs). It reads templates, it does not scan anything.'));
  },
};
