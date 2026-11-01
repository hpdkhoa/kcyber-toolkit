// Small DOM helpers shared by every tool. No framework, no build step.

export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}

// labelled field wrapping any control
export function field(label, control, opts = {}) {
  const f = h('div', { class: 'fld' + (opts.grow ? ' grow' : '') });
  if (label) f.append(h('label', {}, label));
  f.append(control);
  return f;
}

export function input(attrs = {}) { return h('input', { type: 'text', ...attrs }); }
export function textarea(attrs = {}) { return h('textarea', attrs); }
export function select(options, attrs = {}) {
  const s = h('select', attrs);
  for (const o of options) {
    const [val, lbl] = Array.isArray(o) ? o : [o, o];
    s.append(h('option', { value: val }, lbl));
  }
  return s;
}
export function button(label, onclick, cls = '') {
  return h('button', { class: cls, onclick }, label);
}
export function row(...kids) { return h('div', { class: 'row' }, ...kids); }

// output box with a copy button
export function output(opts = {}) {
  const box = h('div', { class: 'out' });
  const wrap = h('div');
  const copy = h('button', { class: 'copy', onclick: () => copyText(box.textContent) }, 'copy');
  if (opts.label) wrap.append(h('label', {}, opts.label));
  wrap.append(copy, box);
  box.set = (txt, state) => {
    box.textContent = txt;
    box.className = 'out' + (state ? ' ' + state : '');
  };
  box.el = wrap;
  return box;
}

export function copyText(t) {
  navigator.clipboard?.writeText(t).catch(() => {});
}

export function warn(text) { return h('div', { class: 'warn' }, text); }
export function note(text) { return h('div', { class: 'note' }, text); }

// render a list of {level, area?, msg} findings with a coloured severity tag
export function findings(list) {
  const colors = { high: '#f85149', med: '#d29922', low: '#8b949e' };
  const box = h('div', { class: 'findings' });
  if (!list || !list.length) { box.append(h('div', { class: 'out ok' }, 'no issues flagged')); return box; }
  for (const f of list) {
    box.append(h('div', { class: 'finding' },
      h('span', { class: 'lvl', style: 'color:' + (colors[f.level] || '#8b949e') }, (f.level || '').toUpperCase()),
      ' ', f.area ? h('strong', {}, f.area + ': ') : null, f.msg || f.message || ''));
  }
  return box;
}

// file input that hands back the bytes. Everything stays in the browser.
export function filePicker(onload, attrs = {}) {
  const inp = h('input', { type: 'file', ...attrs });
  inp.addEventListener('change', async () => {
    const f = inp.files[0];
    if (!f) return;
    onload(new Uint8Array(await f.arrayBuffer()), f);
  });
  return inp;
}

// load a classic (non-module) vendored script once; resolves when ready
const _scripts = {};
export function loadScript(src) {
  if (_scripts[src]) return _scripts[src];
  _scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.onload = () => res(); s.onerror = () => rej(new Error('failed to load ' + src));
    document.head.append(s);
  });
  return _scripts[src];
}

// trigger a download of bytes without a server
export function download(bytes, name, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// bytes <-> hex / base64 helpers (used widely)
export const enc = new TextEncoder();
export const dec = new TextDecoder();
export function toHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function fromHex(s) {
  s = s.replace(/[^0-9a-fA-F]/g, '');
  const a = new Uint8Array(s.length / 2);
  for (let i = 0; i < a.length; i++) a[i] = parseInt(s.substr(i * 2, 2), 16);
  return a;
}
export function toB64(buf) {
  let s = ''; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
export function fromB64(s) {
  const bin = atob(s.replace(/\s/g, ''));
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
