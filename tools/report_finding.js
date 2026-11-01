import { h, field, input, textarea, select, row, button, output, note, copyText } from '../assets/js/ui.js';

const TEMPLATES = {
  'SQL injection': { sev: 'High', desc: 'The application concatenates user input into a SQL query, allowing an attacker to alter the query.', impact: 'Read or modify database contents, authentication bypass, in some cases command execution.', rem: 'Use parameterised queries / prepared statements. Apply least-privilege DB accounts.', ref: 'https://owasp.org/www-community/attacks/SQL_Injection' },
  'Reflected XSS': { sev: 'Medium', desc: 'User input is reflected into the page without encoding, executing attacker script in the victim browser.', impact: 'Session theft, actions as the victim, credential capture.', rem: 'Context-aware output encoding. Set a strict Content-Security-Policy.', ref: 'https://owasp.org/www-community/attacks/xss/' },
  'Missing security headers': { sev: 'Low', desc: 'Responses lack headers such as Content-Security-Policy, HSTS and X-Content-Type-Options.', impact: 'Weakens defence in depth against XSS, clickjacking and downgrade attacks.', rem: 'Add CSP, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options.', ref: 'https://owasp.org/www-project-secure-headers/' },
  'Custom (blank)': { sev: 'Medium', desc: '', impact: '', rem: '', ref: '' },
};

export default {
  id: 'finding', cat: 'report', tier: 'a',
  title: 'Finding templates',
  desc: 'Turn details into a written finding',
  render(root) {
    const tmpl = select(Object.keys(TEMPLATES));
    const title = input({ value: 'SQL injection' });
    const sev = select(['Critical', 'High', 'Medium', 'Low', 'Info']);
    const cvss = input({ placeholder: 'CVSS vector (optional)' });
    const affected = input({ placeholder: 'URL / component' });
    const desc = textarea(), impact = textarea(), rem = textarea(), ref = input();
    const out = output({ label: 'markdown' });
    const build = () => {
      const md = `## [${sev.value}] ${title.value}

**Affected:** ${affected.value || '—'}
${cvss.value ? '**CVSS:** ' + cvss.value + '\n' : ''}
### Description
${desc.value}

### Impact
${impact.value}

### Remediation
${rem.value}

### References
${ref.value}`;
      out.set(md, 'ok');
    };
    const load = () => { const t = TEMPLATES[tmpl.value]; title.value = tmpl.value === 'Custom (blank)' ? '' : tmpl.value; sev.value = t.sev; desc.value = t.desc; impact.value = t.impact; rem.value = t.rem; ref.value = t.ref; build(); };
    tmpl.addEventListener('change', load);
    [title, sev, cvss, affected, desc, impact, rem, ref].forEach(el => el.addEventListener('input', build));
    root.append(
      row(field('template', tmpl), field('severity', sev)),
      row(field('title', title), field('CVSS vector', cvss)),
      field('affected', affected, { grow: true }),
      field('description', desc, { grow: true }), field('impact', impact, { grow: true }),
      field('remediation', rem, { grow: true }), field('references', ref, { grow: true }),
      row(button('Copy markdown', () => copyText(out.textContent))),
      out.el, note('Fill or pick a template; the formatted finding builds live.'));
    load();
  },
};
