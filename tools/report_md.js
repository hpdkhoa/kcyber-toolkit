import { h, field, textarea, row, button, note, download, enc } from '../assets/js/ui.js';

function esc(s) { return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function md(src) {
  const lines = esc(src).split('\n');
  let html = '', inCode = false, inList = false;
  const inline = s => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/\*([^*]+)\*/g, '<i>$1</i>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  for (let line of lines) {
    if (/^```/.test(line)) { if (inCode) { html += '</pre>'; inCode = false; } else { html += '<pre class="out mono">'; inCode = true; } continue; }
    if (inCode) { html += line + '\n'; continue; }
    const m = /^(#{1,6})\s+(.*)/.exec(line);
    if (m) { if (inList) { html += '</ul>'; inList = false; } html += '<h' + m[1].length + '>' + inline(m[2]) + '</h' + m[1].length + '>'; continue; }
    if (/^\s*[-*]\s+/.test(line)) { if (!inList) { html += '<ul>'; inList = true; } html += '<li>' + inline(line.replace(/^\s*[-*]\s+/, '')) + '</li>'; continue; }
    if (inList) { html += '</ul>'; inList = false; }
    if (!line.trim()) { html += '<br>'; continue; }
    html += '<p>' + inline(line) + '</p>';
  }
  if (inList) html += '</ul>'; if (inCode) html += '</pre>';
  return html;
}

const SAMPLE = `# Penetration Test Report

## Executive summary
One paragraph for non-technical readers.

## Findings
- **[High] SQL injection** in /search
- **[Medium] Missing security headers**

## Details
### SQL injection
**Affected:** https://example.com/search?q=
**Impact:** database read access.
**Remediation:** use parameterised queries.
`;

export default {
  id: 'reportmd', cat: 'report', tier: 'a',
  title: 'Markdown report builder',
  desc: 'Write and export a report',
  render(root) {
    const inp = textarea({ style: 'min-height:320px' }); inp.value = SAMPLE;
    const prev = h('div', { class: 'out', style: 'min-height:320px;overflow:auto' });
    const run = () => { prev.innerHTML = md(inp.value); };
    inp.addEventListener('input', run);
    root.append(
      row(button('Download .md', () => download(enc.encode(inp.value), 'report.md', 'text/markdown'), 'alt')),
      h('div', { class: 'grid2' }, field('markdown', inp), field('preview', prev)),
      note('Live preview of a GitHub-style subset. Exports a .md file.'));
    run();
  },
};
