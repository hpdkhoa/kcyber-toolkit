// Client helpers for the Tier B worker. Same-origin /api by default; override
// with window.CK_API (e.g. a wrangler dev URL) when testing locally.
export const API_BASE = (typeof window !== 'undefined' && window.CK_API) || '/api';

// Affirmation the active (target-touching) tools must send.
export const CONSENT = 'i-am-authorised-to-test-this-target';

async function call(path, { params, method = 'GET', body, consent } = {}) {
  let url = API_BASE + path;
  if (params) {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    url += '?' + qs.toString();
  }
  const headers = {};
  if (consent) headers['x-ck-consent'] = CONSENT;
  if (body != null) headers['content-type'] = 'application/json';
  let res;
  try {
    res = await fetch(url, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('cannot reach the backend. Tier B needs the deployed worker (or `wrangler pages dev`); the plain static server has no /api. ' + e.message);
  }
  let data;
  const txt = await res.text();
  try { data = txt ? JSON.parse(txt) : {}; } catch { data = { raw: txt }; }
  if (!res.ok) {
    const msg = data.error || ('HTTP ' + res.status);
    const err = new Error(msg + (data.detail ? ' — ' + data.detail : ''));
    err.status = res.status; err.data = data;
    throw err;
  }
  return data;
}

export const apiGet = (path, params, opts = {}) => call(path, { ...opts, params });
export const apiPost = (path, body, opts = {}) => call(path, { ...opts, method: 'POST', body });

// A consent checkbox for active tools. ok() is true once ticked; el mounts it.
export function consentBox(text = 'I am authorised to test this target') {
  const cb = document.createElement('input'); cb.type = 'checkbox';
  const label = document.createElement('label'); label.className = 'inline consent';
  label.append(cb, document.createTextNode(' ' + text));
  return { el: label, ok: () => cb.checked };
}
