import { CATEGORIES, TOOLS } from './registry.js';
import { h } from './ui.js';

const nav = document.getElementById('nav');
const main = document.getElementById('main');
const welcome = document.getElementById('welcome');
const toolSec = document.getElementById('tool');
const catgrid = document.getElementById('catgrid');
const search = document.getElementById('search');

const byId = Object.fromEntries(TOOLS.map(t => [t.id, t]));
const catOf = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

function pill(tier) {
  return tier === 'b' ? h('span', { class: 'pill b' }, 'live') : h('span', { class: 'pill a' }, 'static');
}

function buildNav(filter = '') {
  nav.innerHTML = '';
  const f = filter.trim().toLowerCase();
  for (const c of CATEGORIES) {
    const items = TOOLS.filter(t => t.cat === c.id &&
      (!f || (t.title + ' ' + (t.desc || '')).toLowerCase().includes(f)));
    if (!items.length) continue;
    nav.append(h('div', { class: 'cat' }, c.label));
    for (const t of items) {
      const a = h('a', { class: 'item', href: '#' + t.id, 'data-id': t.id, onclick: (e) => { e.preventDefault(); go(t.id); } }, t.title, pill(t.tier));
      nav.append(a);
    }
  }
}

function buildGrid() {
  catgrid.innerHTML = '';
  for (const c of CATEGORIES) {
    const items = TOOLS.filter(t => t.cat === c.id);
    if (!items.length) continue;
    const card = h('div', { class: 'card' },
      h('h3', {}, c.label),
      h('div', { class: 'n' }, items.length + ' tool' + (items.length > 1 ? 's' : '')));
    for (const t of items) card.append(h('a', { href: '#' + t.id, onclick: (e) => { e.preventDefault(); go(t.id); } }, t.title));
    catgrid.append(card);
  }
}

function go(id) {
  const t = byId[id];
  if (!t) return home();
  welcome.hidden = true;
  toolSec.hidden = false;
  toolSec.innerHTML = '';
  toolSec.append(
    h('h2', {}, t.title, ' ', pill(t.tier)),
    h('p', { class: 'sub' }, (catOf[t.cat]?.label || '') + (t.desc ? ' — ' + t.desc : '')));
  const mount = h('div');
  toolSec.append(mount);
  try { t.render(mount); } catch (e) { mount.append(h('div', { class: 'out err' }, String(e))); }
  document.querySelectorAll('.nav .item').forEach(a =>
    a.classList.toggle('active', a.dataset.id === id));
  if (location.hash !== '#' + id) history.pushState({ id }, '', '#' + id);
  main.scrollTop = 0;
}

function home() {
  welcome.hidden = false;
  toolSec.hidden = true;
  document.querySelectorAll('.nav .item').forEach(a => a.classList.remove('active'));
  if (location.hash) history.pushState({}, '', location.pathname);
}

const homeEl = document.getElementById('home');
homeEl.addEventListener('click', home);
homeEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); home(); } });
search.addEventListener('input', () => buildNav(search.value));
window.addEventListener('keydown', e => {
  if (e.key === '/' && document.activeElement !== search) { e.preventDefault(); search.focus(); }
});
window.addEventListener('popstate', () => {
  const id = location.hash.slice(1);
  if (id && byId[id]) go(id); else home();
});

buildNav();
buildGrid();
const start = location.hash.slice(1);
if (start && byId[start]) go(start);
