import { h, field, select, row, output, note } from '../assets/js/ui.js';

// CVSS 3.1 base score. Weights from the specification.
const W = {
  AV: { N: 0.85, A: 0.62, L: 0.55, P: 0.2 },
  AC: { L: 0.77, H: 0.44 },
  PR: { U: { N: 0.85, L: 0.62, H: 0.27 }, C: { N: 0.85, L: 0.68, H: 0.5 } },
  UI: { N: 0.85, R: 0.62 },
  CIA: { H: 0.56, L: 0.22, N: 0 },
};
const roundup = x => { const i = Math.round(x * 100000); return i % 10000 === 0 ? i / 100000 : (Math.floor(i / 10000) + 1) / 10; };
const severity = s => s === 0 ? 'None' : s < 4 ? 'Low' : s < 7 ? 'Medium' : s < 9 ? 'High' : 'Critical';

const METRICS = [
  ['AV', 'Attack Vector', [['N', 'Network'], ['A', 'Adjacent'], ['L', 'Local'], ['P', 'Physical']]],
  ['AC', 'Attack Complexity', [['L', 'Low'], ['H', 'High']]],
  ['PR', 'Privileges Required', [['N', 'None'], ['L', 'Low'], ['H', 'High']]],
  ['UI', 'User Interaction', [['N', 'None'], ['R', 'Required']]],
  ['S', 'Scope', [['U', 'Unchanged'], ['C', 'Changed']]],
  ['C', 'Confidentiality', [['N', 'None'], ['L', 'Low'], ['H', 'High']]],
  ['I', 'Integrity', [['N', 'None'], ['L', 'Low'], ['H', 'High']]],
  ['A', 'Availability', [['N', 'None'], ['L', 'Low'], ['H', 'High']]],
];

export default {
  id: 'cvss', cat: 'vuln', tier: 'a',
  title: 'CVSS 3.1 calculator',
  desc: 'Base score and vector string',
  render(root) {
    const sels = {};
    const grid = h('div', { class: 'row' });
    for (const [k, label, opts] of METRICS) {
      const s = select(opts.map(([v, l]) => [v, l]), {});
      sels[k] = s; s.addEventListener('change', calc);
      grid.append(field(label + ' (' + k + ')', s));
    }
    const out = output({ label: 'result' });
    const vec = output({ label: 'vector' });
    function calc() {
      const v = Object.fromEntries(Object.entries(sels).map(([k, s]) => [k, s.value]));
      const iss = 1 - (1 - W.CIA[v.C]) * (1 - W.CIA[v.I]) * (1 - W.CIA[v.A]);
      const impact = v.S === 'U' ? 6.42 * iss : 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
      const expl = 8.22 * W.AV[v.AV] * W.AC[v.AC] * W.PR[v.S][v.PR] * W.UI[v.UI];
      let score;
      if (impact <= 0) score = 0;
      else score = v.S === 'U' ? roundup(Math.min(impact + expl, 10)) : roundup(Math.min(1.08 * (impact + expl), 10));
      out.set(score.toFixed(1) + '  (' + severity(score) + ')', 'ok');
      vec.set('CVSS:3.1/AV:' + v.AV + '/AC:' + v.AC + '/PR:' + v.PR + '/UI:' + v.UI + '/S:' + v.S + '/C:' + v.C + '/I:' + v.I + '/A:' + v.A, 'ok');
    }
    root.append(grid, out.el, vec.el,
      note('CVSS v3.1 base metrics. Temporal, environmental and the v4.0 model are later adds.'));
    calc();
  },
};
