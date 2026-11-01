// Category order and labels. Add a category here, then register tools below.
export const CATEGORIES = [
  { id: 'baseline', label: 'Crypto / Encoding / Hashing' },
  { id: 'recon', label: 'Information Gathering' },
  { id: 'vuln', label: 'Vulnerability Analysis' },
  { id: 'web', label: 'Web Application' },
  { id: 'db', label: 'Database' },
  { id: 'pass', label: 'Password' },
  { id: 'wifi', label: 'Wireless' },
  { id: 're', label: 'Reverse Engineering' },
  { id: 'exploit', label: 'Exploitation (builders)' },
  { id: 'sniff', label: 'Sniffing / Traffic' },
  { id: 'post', label: 'Post-Exploitation' },
  { id: 'forensics', label: 'Forensics' },
  { id: 'report', label: 'Reporting' },
  { id: 'social', label: 'Social Engineering (defensive)' },
];

// Each module default-exports a tool descriptor { id, cat, tier, title, desc, render }.
import encoding from '../../tools/s0_encoding.js';
import hash from '../../tools/s0_hash.js';
import crypto from '../../tools/s0_crypto.js';
import hashid from '../../tools/s0_hashid.js';
import hmac from '../../tools/s0_hmac.js';
import magic from '../../tools/s0_magic.js';
import recipe from '../../tools/s0_recipe.js';
import jwt from '../../tools/web_jwt.js';
import payloads from '../../tools/web_payloads.js';
import revshell from '../../tools/exploit_revshell.js';
import sqli from '../../tools/db_sqli.js';
import cvss from '../../tools/vuln_cvss.js';
import fMagic from '../../tools/forensics_magic.js';
import fExif from '../../tools/forensics_exif.js';
import fStego from '../../tools/forensics_stego.js';
import fCarver from '../../tools/forensics_carver.js';
import fTime from '../../tools/forensics_timestamp.js';
import reHex from '../../tools/re_hex.js';
import reStrings from '../../tools/re_strings.js';
import pwgen from '../../tools/pass_gen.js';
import pwstrength from '../../tools/pass_strength.js';
import wordlist from '../../tools/pass_wordlist.js';
import rules from '../../tools/pass_rules.js';
import cracker from '../../tools/pass_cracker.js';
import cidr from '../../tools/recon_cidr.js';
import ipobf from '../../tools/recon_ipobf.js';
import favicon from '../../tools/recon_favicon.js';
import dork from '../../tools/recon_dork.js';
import osint from '../../tools/recon_osint.js';
import encoder from '../../tools/exploit_encoder.js';
import lolbins from '../../tools/exploit_lolbins.js';
import privesc from '../../tools/post_privesc.js';
import enumtool from '../../tools/post_enum.js';
import connstr from '../../tools/db_connstr.js';
import robots from '../../tools/web_robots.js';
import reportmd from '../../tools/report_md.js';
import finding from '../../tools/report_finding.js';
import emailhdr from '../../tools/social_email.js';
import phishing from '../../tools/social_phishing.js';
import wifichan from '../../tools/wifi_channel.js';
import packet from '../../tools/sniff_packet.js';
import binfmt from '../../tools/re_binfmt.js';
import pcap from '../../tools/sniff_pcap.js';
import nuclei from '../../tools/vuln_nuclei.js';
import keygen from '../../tools/crypto_keygen.js';
import wpa from '../../tools/wifi_wpa.js';
import kdf from '../../tools/crypto_kdf.js';
import disasm from '../../tools/re_disasm.js';
import shellcode from '../../tools/re_shellcode.js';

export const TOOLS = [
  encoding, recipe, hash, crypto, keygen, hashid, hmac, kdf, magic,
  cidr, ipobf, favicon, dork, osint,
  cvss, nuclei,
  jwt, payloads, robots,
  sqli, connstr,
  pwgen, pwstrength, wordlist, rules, cracker,
  wifichan, wpa,
  reHex, reStrings, binfmt, disasm, shellcode,
  revshell, encoder, lolbins,
  packet, pcap,
  privesc, enumtool,
  fMagic, fExif, fStego, fCarver, fTime,
  reportmd, finding,
  emailhdr, phishing,
];
