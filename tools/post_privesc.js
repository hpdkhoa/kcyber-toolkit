import { h, field, select, input, note, copyText } from '../assets/js/ui.js';

const CHECKS = {
  linux: [
    ['Who am I', 'id; whoami; groups'],
    ['Sudo rights', 'sudo -l'],
    ['Kernel / OS', 'uname -a; cat /etc/os-release'],
    ['SUID binaries', 'find / -perm -4000 -type f 2>/dev/null'],
    ['SGID binaries', 'find / -perm -2000 -type f 2>/dev/null'],
    ['World-writable files', 'find / -writable -type f 2>/dev/null | grep -v /proc'],
    ['Cron jobs', 'cat /etc/crontab; ls -la /etc/cron.*'],
    ['Capabilities', 'getcap -r / 2>/dev/null'],
    ['Writable PATH dirs', "echo $PATH | tr ':' '\\n' | xargs -I{} find {} -writable 2>/dev/null"],
    ['Passwords in files', "grep -rniE 'password|passwd|secret' /etc /var/www 2>/dev/null"],
    ['Running services', 'ps aux; netstat -tulpn 2>/dev/null'],
    ['Docker / lxd group', 'id | grep -E "docker|lxd"'],
    ['NFS no_root_squash', 'cat /etc/exports 2>/dev/null'],
  ],
  windows: [
    ['Who am I / privileges', 'whoami /all'],
    ['System info', 'systeminfo'],
    ['Unquoted service paths', 'wmic service get name,displayname,pathname,startmode | findstr /i /v "C:\\Windows\\\\" | findstr /i /v """'],
    ['Weak service perms', 'accesschk.exe -uwcqv "Everyone" *'],
    ['AlwaysInstallElevated', 'reg query HKCU\\SOFTWARE\\Policies\\Microsoft\\Windows\\Installer /v AlwaysInstallElevated'],
    ['Stored credentials', 'cmdkey /list; dir /s *pass* == *.config 2>nul'],
    ['Scheduled tasks', 'schtasks /query /fo LIST /v'],
    ['Autoruns / startup', 'reg query HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'],
    ['Patch level', 'wmic qfe get HotFixID,InstalledOn'],
    ['Saved WiFi keys', 'netsh wlan show profiles'],
    ['Local admins', 'net localgroup administrators'],
    ['Token privileges (SeImpersonate)', 'whoami /priv | findstr /i impersonate'],
  ],
};

export default {
  id: 'privesc', cat: 'post', tier: 'a',
  title: 'Priv-esc checklist',
  desc: 'Local privilege-escalation checks',
  render(root) {
    const os = select([['linux', 'Linux'], ['windows', 'Windows']]);
    const q = input({ placeholder: 'filter' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      const f = q.value.toLowerCase();
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'check'), h('th', {}, 'command')));
      for (const [name, cmd] of CHECKS[os.value]) {
        if (f && !(name + cmd).toLowerCase().includes(f)) continue;
        t.append(h('tr', {}, h('td', {}, name), h('td', { class: 'mono' }, cmd, h('button', { class: 'copy', onclick: () => copyText(cmd) }, 'copy'))));
      }
      out.append(t);
    };
    os.addEventListener('change', run); q.addEventListener('input', run);
    root.append(field('target OS', os), field('filter', q, { grow: true }),
      note('For authorised testing. Run these on a host you are permitted to assess.'), out);
    run();
  },
};
