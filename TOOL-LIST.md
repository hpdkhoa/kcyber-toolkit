# Cyber toolkit: tool list to pick from

Pick by putting `x` in the box. Working name only; change it anytime.

**Tiers:** A = runs fully in the browser, static, no server. B = needs one backend worker (live recon on a target). C = not hosted (left out on purpose).
**Effort:** S = a few hours. M = about half a day. L = a day or more (heavy WASM, or a worker + API).
**Have** = COFFSec already ships it; listed so the new toolkit is a clear superset.

---

## 0. Crypto, encoding, hashing (baseline)

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | AES / RSA / ECC / Bcrypt / XOR / Caesar | Encrypt, decrypt, teach | A | S | Have |
| [ ] | MD5 / SHA-1/256/384/512 | Hashing | A | S | Have |
| [ ] | Base64 / Hex / ASCII / URL | Encode, decode | A | S | Have |
| [ ] | Recipe chain (CyberChef-style) | Stack many encode/decode/crypto steps in one pipe | A | L | Big value add over COFFSec |
| [ ] | Hash identifier | Guess hash type from its shape | A | S | |
| [ ] | HMAC / PBKDF2 / scrypt / Argon2 | Keyed and slow hashes (WASM) | A | M | |
| [ ] | Magic / auto-decode | Try many decodings, rank by what looks like text | A | M | |

## 1. Information gathering

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | CIDR / subnet calculator | Ranges, masks, hosts | A | S | Have |
| [ ] | IP obfuscation | Decimal, hex, octal | A | S | Have |
| [ ] | Favicon hash | mmh3 hash for asset hunting | A | S | Have |
| [ ] | Google / GitHub dork builder | Build search queries from a form | A | S | |
| [ ] | OSINT link builder | One username to many site profile URLs | A | S | Builds links only |
| [ ] | DNS lookup | A, AAAA, MX, TXT, NS, CNAME | B | M | |
| [ ] | Reverse DNS / PTR | IP to name | B | S | |
| [ ] | WHOIS / RDAP | Domain and IP ownership | B | M | |
| [ ] | Subdomain finder (passive) | From crt.sh and public sources | B | M | No brute force |
| [ ] | crt.sh certificate search | Certs and names for a domain | B | S | |
| [ ] | Shodan / Censys lookup | Open ports and banners (your API key) | B | M | |
| [ ] | HTTP fingerprint | Server, tech, headers | B | M | |

## 2. Vulnerability analysis

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | CVSS 3.1 + 4.0 calculator | Score from the vector | A | M | |
| [ ] | CVE search | Lookup by id or keyword | B | M | NVD API |
| [ ] | TLS / SSL scanner | Cert chain, protocols, weak ciphers | B | L | |
| [ ] | Security-header checker | CSP, HSTS, etc. with grade | B | M | |
| [ ] | nuclei template viewer | Read and search templates offline | A | M | No scanning |

## 3. Web application analysis

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Payload builder | XSS, SQLi, SSTI, cmd, LFI, with encodings | A | M | Dual-use, standard |
| [ ] | JWT decode / verify / forge | Read, check, and sign test tokens (incl. alg=none, weak key) | A | M | |
| [ ] | Request editor + replay | Edit an HTTP request, send via worker, see response | B | L | |
| [ ] | Directory brute | Find paths from a wordlist | B | L | Rate-limited, consent gate |
| [ ] | CMS / tech detect | WhatWeb-style | B | M | |
| [ ] | robots / sitemap / .htaccess parser | Pull and read | A | S | Parse client-side |
| [ ] | SSRF / open-redirect tester | Fire test URLs, watch a callback | B | L | Consent gate |
| [ ] | Cookie / CORS analyzer | Flags, SameSite, CORS policy read | B | M | |

## 4. Database assessment

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | SQLi cheat-sheet + builder | Per-DBMS payloads | A | S | |
| [ ] | Connection-string parser | Break down and flag secrets | A | S | |

## 5. Password attacks

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Password generator | Strong random, rules | A | S | Have |
| [ ] | Strength / entropy meter | zxcvbn-style score | A | S | |
| [ ] | Hash cracker (small wordlist) | Dictionary crack in WASM, your list | A | M | Teaching scale |
| [ ] | Wordlist generator | From keywords, dates, patterns | A | M | |
| [ ] | Rule / mutation engine | Hashcat-style leet, append, case | A | M | |
| [ ] | HIBP breach lookup | Has this email or password leaked | B | S | k-anonymity API |

## 6. Wireless

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Wi-Fi channel / power calc | Channels, EIRP, overlap | A | S | |
| [ ] | WPA handshake / PMKID parser | Read an uploaded capture | A | M | Parse only, no capture |

## 7. Reverse engineering

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Hex viewer / editor | Upload, inspect, edit bytes | A | M | |
| [ ] | Strings | Pull text from a binary | A | S | |
| [ ] | ELF / PE / Mach-O parser | Headers, sections, imports | A | L | |
| [ ] | Disassembler | x86/ARM via WASM capstone | A | L | |
| [ ] | Shellcode decoder | Bytes to instructions, deobfuscate | A | M | |

## 8. Exploitation (builders only, no delivery)

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Reverse-shell generator | bash, python, nc, PS, by IP and port | A | S | Text only |
| [ ] | Payload encoder | Encode a given payload many ways | A | M | Encoding, not weaponizing |
| [ ] | GTFOBins / LOLBAS reference | Searchable local copy | A | M | |

## 9. Sniffing and traffic

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | PCAP parser | Upload a capture, read flows and fields | A | L | Client-side |
| [ ] | Packet / hex decoder | Decode a pasted packet | A | M | |

## 10. Post-exploitation

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Priv-esc checklist | Linux and Windows, interactive | A | S | |
| [ ] | Enum one-liner builder | Build the recon command to run on a host | A | S | |

## 11. Forensics

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | EXIF / metadata viewer | Read image and doc metadata | A | M | |
| [ ] | File-type / magic-bytes ID | What is this file really | A | S | |
| [ ] | Stego (LSB) | Hide and extract in an image | A | M | |
| [ ] | File carver | Pull embedded files from an upload | A | M | |
| [ ] | Timestamp / epoch decoder | Many formats | A | S | |

## 12. Reporting

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | Markdown report builder | Write and export | A | S | Have |
| [ ] | Finding templates | CVSS to a written finding | A | S | |

## 13. Social engineering (defensive)

| Pick | Tool | What | Tier | Effort | Note |
|---|---|---|---|---|---|
| [ ] | SPF / DKIM / DMARC analyzer | Parse and grade a domain's email auth | B | M | |
| [ ] | Email-header analyzer | Trace hops, flags, spoof signs | A | M | Paste header, parse client-side |
| [ ] | Phishing-awareness reference | Signs and checklists | A | S | |

---

## Left out on purpose (Tier C)
Metasploit and live exploit delivery, online brute-force (Hydra, Medusa), active scanners (nmap engine, masscan, sqlmap), wireless attacks (deauth, aircrack), MITM and spoofing (ettercap, bettercap, Responder), C2, DoS, phishing-kit delivery (SET). These need raw sockets, L2 access, or hardware, or hosting them is itself the harm. They stay on a real Kali box.

## My suggested starter set (if you want a default)
All Tier A marked S or M, plus the recipe chain. That is a full static site, no server, hostable today. Add Tier B recon (DNS, WHOIS, crt.sh, TLS, headers, HIBP) in a second pass behind one worker with rate limits.
