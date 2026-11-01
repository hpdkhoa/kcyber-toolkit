import { h, field, input, note, copyText } from '../assets/js/ui.js';

const SITES = {
  'GitHub': u => 'https://github.com/' + u,
  'GitLab': u => 'https://gitlab.com/' + u,
  'X / Twitter': u => 'https://x.com/' + u,
  'Instagram': u => 'https://instagram.com/' + u,
  'Reddit': u => 'https://reddit.com/user/' + u,
  'TikTok': u => 'https://tiktok.com/@' + u,
  'YouTube': u => 'https://youtube.com/@' + u,
  'Facebook': u => 'https://facebook.com/' + u,
  'LinkedIn': u => 'https://linkedin.com/in/' + u,
  'Medium': u => 'https://medium.com/@' + u,
  'Keybase': u => 'https://keybase.io/' + u,
  'Telegram': u => 'https://t.me/' + u,
  'Pinterest': u => 'https://pinterest.com/' + u,
  'Twitch': u => 'https://twitch.tv/' + u,
  'Steam': u => 'https://steamcommunity.com/id/' + u,
  'HackerNews': u => 'https://news.ycombinator.com/user?id=' + u,
  'Dev.to': u => 'https://dev.to/' + u,
  'StackOverflow': u => 'https://stackoverflow.com/users?filter=' + u,
};

export default {
  id: 'osint', cat: 'recon', tier: 'a',
  title: 'OSINT link builder',
  desc: 'One username to many profile URLs',
  render(root) {
    const inp = input({ placeholder: 'username', class: 'mono' });
    const out = h('div');
    const run = () => {
      out.innerHTML = '';
      const u = inp.value.trim();
      if (!u) return;
      const all = Object.entries(SITES).map(([n, f]) => f(encodeURIComponent(u)));
      const t = h('table', { class: 'kv' });
      for (const [name, f] of Object.entries(SITES)) {
        const url = f(encodeURIComponent(u));
        t.append(h('tr', {}, h('td', {}, name), h('td', { class: 'mono' }, h('a', { href: url, target: '_blank', rel: 'noopener' }, url))));
      }
      out.append(h('div', { class: 'note' }, h('button', { class: 'copy', onclick: () => copyText(all.join('\n')) }, 'copy all links')), t);
    };
    inp.addEventListener('input', run);
    root.append(field('username', inp, { grow: true }),
      note('Builds candidate profile URLs only. It does not check whether each account exists; open the links to see. Nothing is requested until you click.'), out);
  },
};
