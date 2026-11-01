import { h, note } from '../assets/js/ui.js';

const SIGNS = [
  ['Sender address', 'Display name looks right but the email domain is odd, misspelled, or a lookalike (rn vs m, 0 vs o, extra words).'],
  ['Urgency / threat', 'Pressure to act now: account locked, payment overdue, legal action, gift expiring.'],
  ['Unexpected attachment', 'Invoices, receipts, .html, .zip, .iso, macro-enabled Office files you did not ask for.'],
  ['Link mismatch', 'The visible text and the real href differ. Hover to see the true destination; watch for URL shorteners and lookalike domains.'],
  ['Credential request', 'Any email asking you to log in via its link, confirm a password, or enter MFA codes.'],
  ['Generic greeting', '"Dear customer / user" instead of your name, from a service that knows your name.'],
  ['Spelling / grammar', 'Odd phrasing, wrong fonts, low-resolution logos.'],
  ['Reply-To redirect', 'Reply-To points to a different domain than From.'],
  ['Payment change', 'A supplier "updating bank details" — verify by phone on a known number (BEC fraud).'],
  ['Too good to be true', 'Prizes, refunds, crypto returns, job offers with upfront steps.'],
];
const DO = [
  'Verify through a channel you already trust (type the known URL, call a saved number).',
  'Hover links and inspect the real domain before clicking.',
  'Report to your security team / use the report-phishing button.',
  'Never enter credentials from an email link; open the site yourself.',
  'When in doubt, slow down. Urgency is the attacker’s tool.',
];

export default {
  id: 'phishing', cat: 'social', tier: 'a',
  title: 'Phishing-awareness reference',
  desc: 'Signs of a phishing message and what to do',
  render(root) {
    const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'sign'), h('th', {}, 'what to look for')));
    for (const [s, d] of SIGNS) t.append(h('tr', {}, h('td', {}, s), h('td', {}, d)));
    const ul = h('ul'); for (const d of DO) ul.append(h('li', {}, d));
    root.append(h('h3', {}, 'Warning signs'), t, h('h3', {}, 'What to do'), ul,
      note('A defensive checklist for spotting phishing. Pair it with the email-header analyzer.'));
  },
};
