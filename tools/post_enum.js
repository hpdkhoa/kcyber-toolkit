import { h, field, select, output, note, copyText } from '../assets/js/ui.js';

const PARTS = {
  linux: {
    'identity': 'id;whoami;hostname', 'system': 'uname -a;cat /etc/os-release',
    'users': 'cat /etc/passwd;cat /etc/group', 'sudo': 'sudo -l',
    'suid': 'find / -perm -4000 -type f 2>/dev/null', 'network': 'ip a;netstat -tulpn 2>/dev/null',
    'processes': 'ps aux', 'cron': 'cat /etc/crontab;ls -la /etc/cron.*',
  },
  windows: {
    'identity': 'whoami /all', 'system': 'systeminfo', 'users': 'net user;net localgroup administrators',
    'network': 'ipconfig /all & netstat -ano', 'services': 'wmic service get name,pathname,startmode',
    'tasks': 'schtasks /query /fo LIST', 'patches': 'wmic qfe get HotFixID,InstalledOn',
  },
};

export default {
  id: 'enum', cat: 'post', tier: 'a',
  title: 'Enum one-liner builder',
  desc: 'Build a combined recon command',
  render(root) {
    const os = select([['linux', 'Linux'], ['windows', 'Windows']]);
    const chips = h('div', { class: 'chips' });
    const out = output();
    let boxes = {};
    const buildChips = () => {
      chips.innerHTML = ''; boxes = {};
      for (const k of Object.keys(PARTS[os.value])) { const cb = h('input', { type: 'checkbox' }); cb.checked = true; boxes[k] = cb; chips.append(h('label', { class: 'chip' }, cb, ' ' + k)); cb.addEventListener('change', run); }
    };
    const run = () => {
      const sep = os.value === 'linux' ? ';' : ' & ';
      const cmds = Object.keys(PARTS[os.value]).filter(k => boxes[k]?.checked).map(k => PARTS[os.value][k]);
      out.set(cmds.join(sep) || '(select at least one)', cmds.length ? 'ok' : '');
    };
    os.addEventListener('change', () => { buildChips(); run(); });
    root.append(field('target OS', os), field('include', chips),
      h('div', { class: 'row' }, h('button', { class: 'copy', onclick: () => copyText(out.textContent) }, 'copy')), out.el,
      note('One pasteable recon line. For authorised testing only.'));
    buildChips(); run();
  },
};
