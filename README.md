# CyberKit

A browser cybersecurity toolkit. Static tools run fully client-side. Live tools reach a
target through one backend worker, with rate limits and a consent gate.

A superset of the COFFSec model: it keeps the crypto/encoding/hashing/recon baseline and
adds Kali-style categories that are safe to host (builders, parsers, calculators, passive
recon). Attack delivery stays out on purpose (see TOOL-LIST.md, Tier C).

## Run locally

No build step. Serve the folder over http (ES modules need a server, not file://):

```bash
python -m http.server 8793
```

Open http://localhost:8793/

## Layout

```
index.html            shell
assets/css/app.css     theme
assets/js/app.js       nav, router, search
assets/js/registry.js  category order + tool list (register a tool here)
assets/js/ui.js        shared DOM + byte/hex/base64 helpers
assets/js/hashlib.js   shared MD5 / SHA
assets/vendor/         vendored libraries (bcrypt, scrypt, argon2, capstone wasm) — served locally, no CDN
tools/*.js             one module per tool, default-exports { id, cat, tier, title, desc, render }
functions/api/         Cloudflare Pages Functions (Tier B worker) — added with the live tools
```

## Add a tool

1. Create `tools/<name>.js` exporting a descriptor with `render(root)`.
2. Import it in `assets/js/registry.js` and add it to `TOOLS`.

## Deploy

Cloudflare Pages: connect the repo, build command none, output directory `/`.
Tier B tools need the Pages Functions in `functions/` plus any API keys as env vars.

## Scope

- Tier A (static): ships today, no server.
- Tier B (live): one worker, rate-limited, target-consent gate.
- Tier C: left out on purpose. Use a real Kali box.

Use only on systems you own or are authorised to test.
