import { h, field, input, select, row, output, note } from '../assets/js/ui.js';

function freq(band, ch) {
  if (band === '2.4') return ch === 14 ? 2484 : 2407 + ch * 5;
  return 5000 + ch * 5;
}

export default {
  id: 'wifichan', cat: 'wifi', tier: 'a',
  title: 'Wi-Fi channel / power calc',
  desc: 'Channel to frequency, overlap, EIRP',
  render(root) {
    const band = select([['2.4', '2.4 GHz'], ['5', '5 GHz']]);
    const ch = input({ type: 'number', value: '6' });
    const chOut = output({ label: 'frequency' });
    const runCh = () => {
      const c = +ch.value;
      const f = freq(band.value, c);
      let note2 = '';
      if (band.value === '2.4') note2 = [1, 6, 11].includes(c) ? '  (non-overlapping)' : '  (overlaps neighbours; prefer 1, 6 or 11)';
      chOut.set('channel ' + c + ' = ' + f + ' MHz (center)' + note2, 'ok');
    };
    band.addEventListener('change', runCh); ch.addEventListener('input', runCh);

    // EIRP
    const tx = input({ type: 'number', value: '20' });
    const gain = input({ type: 'number', value: '5' });
    const loss = input({ type: 'number', value: '1' });
    const eOut = output({ label: 'EIRP' });
    const runE = () => {
      const dbm = (+tx.value) + (+gain.value) - (+loss.value);
      const mw = Math.pow(10, dbm / 10);
      eOut.set(dbm.toFixed(1) + ' dBm  =  ' + mw.toFixed(1) + ' mW', 'ok');
    };
    [tx, gain, loss].forEach(el => el.addEventListener('input', runE));

    root.append(
      h('h3', {}, 'Channel ↔ frequency'),
      row(field('band', band), field('channel', ch)), chOut.el,
      h('h3', {}, 'EIRP (effective radiated power)'),
      row(field('TX power (dBm)', tx), field('antenna gain (dBi)', gain), field('cable loss (dB)', loss)), eOut.el,
      note('EIRP = TX power + antenna gain − cable loss. 2.4 GHz channels 1/6/11 do not overlap.'));
    runCh(); runE();
  },
};
