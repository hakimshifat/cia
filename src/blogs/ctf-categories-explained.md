---
title: "CTF Categories Explained"
description: "Web, Pwn, Crypto, Reverse, Forensics, OSINT — broken down in plain language with real examples. Your map to the CTF battlefield."
date: "2026-05-20"
author: "Carnage"
tags:
  - "Blog"
  - "CTF"
  - "Beginner Guide"
  - "Cybersecurity"
draft: false
---

<div class="blog-hero">
  <div class="blog-hero-tag">Blog | CTF | Beginner Guide | Cybersecurity</div>
  <h1>CTF Categories <span>Explained</span></h1>
  <p class="blog-hero-sub">Web, Pwn, Crypto, Reverse, Forensics, OSINT — broken down in plain language with real examples. Your map to the CTF battlefield.</p>
  <div class="blog-hero-meta">
    <div>BY <span>Carnage</span></div>
    <div>PUBLISHED <span>May 2026</span></div>
    <div>READ TIME <span>~8 MIN</span></div>
  </div>
</div>

<div class="blog-highlight">
  <p>You've heard about CTFs. Maybe you even tried one. But then you opened the challenge list and saw: <em>Web, Pwn, Crypto, Rev, Forensics, OSINT</em> — and had absolutely no idea where to start. This post fixes that. Each category, explained from scratch.</p>
</div>

## 🌐 01. Web Exploitation

Web challenges are about finding and exploiting vulnerabilities in websites and web apps — the same bugs that real hackers use against real targets. Think of every website you've ever visited: they all run on code, and code has bugs. Your job is to find them.

Common targets include login forms, URLs, cookies, and input fields. You'll learn to spot when a site trusts user input blindly — and abuse that trust to read secret data or steal sessions.

### What you actually do:
- Inject SQL into login forms to bypass authentication
- Plant malicious scripts (XSS) that steal cookies
- Tamper with JWT tokens to impersonate admins
- Force the server to fetch internal resources (SSRF)
- Exploit broken access controls to reach hidden pages

```python
# REAL EXAMPLE — SQLi Login Bypass
# Login form sends: username + password to the DB
# Normal query built by the server:
# SELECT * FROM users WHERE user='admin' AND pass='secret'

# You type into the username field:
# admin'--

# The query becomes:
# SELECT * FROM users WHERE user='admin'--' AND pass='...'
# The -- comments out the password check → logged in!

# Flag: CIA{sql_1nj3ct10n_bypass_success}
```

**Tools of the Trade:** `Burp Suite` · `curl` · `sqlmap` · `ffuf` · `Browser DevTools`

**Difficulty:** `Beginner-Friendly`

---

## 💥 02. Binary Exploitation (Pwn)

"Pwn" means to own — to fully take control. These challenges give you a compiled binary program running on a remote server. Your goal: find a vulnerability in how it manages memory, then exploit it to hijack execution and read the flag.

This is the deepest, most technical CTF category. You're working at the level of CPU registers and raw memory addresses. It's hard — but solving a pwn challenge feels incredible.

### What you actually do:
- Overflow a buffer on the stack to overwrite the return address
- Redirect execution to shellcode you injected
- Use Return-Oriented Programming (ROP) to chain gadgets
- Leak memory addresses to defeat ASLR
- Exploit heap corruption via use-after-free or double-free

```c
// REAL EXAMPLE — Stack Buffer Overflow
// Vulnerable C code:
char buf[64];
gets(buf);  // reads unlimited input!

// Stack layout (64 bytes buf, then saved return addr)
// If we write 72 bytes → overwrite return address

python3 -c "print('A'*72 + addr_of_win_func)" | ./vuln

// Flag: CIA{buff3r_0v3rfl0w_p0wn3d}
```

**Tools of the Trade:** `pwntools` · `GDB + pwndbg` · `Ghidra` · `ROPgadget` · `checksec`

**Difficulty:** `Advanced`

---

## 🔐 03. Cryptography

Cryptography challenges are about breaking encryption — or at least badly implemented encryption. The cipher might be ancient (Caesar, Vigenère) or modern (RSA, AES), but there's always a flaw in how it was used.

Beginners start with classical ciphers: rotating letters, substitution codes, and Base64. Advanced players deal with number theory, modular arithmetic, and exploiting tiny mathematical mistakes in RSA that let you factor private keys.

### What you actually do:
- Decode Base64, hex, or binary blobs to find hidden text
- Break substitution ciphers using frequency analysis
- Exploit RSA with small exponents or repeated nonces
- Attack weak XOR encryption when key length is known
- Exploit padding oracle attacks on AES-CBC

```python
# REAL EXAMPLE — Caesar Cipher to RSA Chain
# You're given this ciphertext:
# FLD{pnrfne_vf_gbb_rnfl}

# Every letter is shifted by 13 (ROT13)
# F → C, L → Y, D → A ...

python3 -c "import codecs; print(codecs.decode('FLD{pnrfne_vf_gbb_rnfl}','rot13'))"

# Flag: CIA{caesar_is_too_easy}
```

**Tools of the Trade:** `CyberChef` · `SageMath` · `Python (pycryptodome)` · `RsaCtfTool` · `dCode.fr`

**Difficulty:** `Intermediate`

---

## ⚙️ 04. Reverse Engineering

You're given a compiled binary — an EXE or ELF file — with no source code. Your mission: figure out what it does and how to make it give you the flag. It's like reading a book that's been shredded into confetti and then reassembled badly.

You'll use decompilers that turn machine code back into C-like pseudocode, and debuggers that let you step through execution one instruction at a time. Sometimes the flag is hidden in a string. Sometimes you have to understand a complex algorithm and run it in reverse.

### What you actually do:
- Decompile binaries in Ghidra or IDA to read pseudocode
- Use strings/ltrace/strace to spy on runtime behavior
- Identify the validation algorithm and reverse its logic
- Patch conditional jumps to bypass password checks
- Unpack obfuscated or packed binaries (UPX, custom packers)

```c
// REAL EXAMPLE — Patching a Binary Check
// The binary checks your input against a scrambled key
// In Ghidra you see:
if (strcmp(input, expected) != 0) {
  puts("Wrong password!");
  exit(1);
}

// expected[] in memory = {0x43,0x49,0x41,0x7b,...}
// Convert hex bytes to ASCII:
bytes.fromhex('434941...').decode()

// Flag: CIA{r3v3rs3_3ng1n33r1ng_ftw}
```

**Tools of the Trade:** `Ghidra` · `IDA Free` · `GDB` · `radare2` · `strings` · `ltrace`

**Difficulty:** `Intermediate`

---

## 🔍 05. Forensics

Forensics challenges are digital crime scenes. Someone left a flag behind — hidden in an image, buried in a network capture, encoded in file metadata, or stashed in a deleted folder. Your job: find it.

This category is extremely beginner-friendly because many challenges just need curiosity and the right tool. That innocent-looking PNG might have another file hidden inside it using steganography. That PCAP file might have a password sent in plaintext over HTTP.

### What you actually do:
- Extract hidden files from images using steghide / binwalk
- Analyze network traffic captures (.pcap) in Wireshark
- Read EXIF metadata from photos for hidden clues
- Recover deleted files from disk images
- Decode files from unusual formats (MIDI, audio spectrograms)

```bash
# REAL EXAMPLE — File Hidden in an Image
# You receive: suspicious.png (looks like a normal photo)
# Run binwalk to check for hidden files:
$ binwalk suspicious.png

# Output reveals a ZIP archive at offset 0x12A4
$ binwalk --extract suspicious.png
$ cd _suspicious.png.extracted/
$ cat secret.txt

# Flag: CIA{st3g4n0gr4phy_1s_n0t_h1d1ng}
```

**Tools of the Trade:** `Wireshark` · `binwalk` · `steghide` · `exiftool` · `Autopsy` · `Audacity`

**Difficulty:** `Beginner-Friendly`

---

## 🕵️ 06. OSINT

Open Source Intelligence. Every clue is already publicly available on the internet — you just have to find it. These challenges test your research skills, creative thinking, and knowledge of how to extract information from public sources.

No hacking tools required. Sometimes all you need is Google, a reverse image search, and the patience to dig through cached websites, social media profiles, or satellite maps. OSINT is often the most approachable category for complete beginners.

### What you actually do:
- Reverse image search a photo to find its exact location
- Hunt through old archived versions of websites (Wayback Machine)
- Trace a username across social media platforms
- Read WHOIS records, DNS data, and certificate transparency logs
- Identify a building or landmark from subtle visual clues

```text
# REAL EXAMPLE — Geolocation from a Photo
# Challenge: "Where was this photo taken? Flag = city name"
# You see a blurry street corner with a partial sign

# Step 1: reverse image search → no direct match
# Step 2: notice a yellow cab + left-hand traffic
# Step 3: spot text on awning: "Banglatown"
# Step 4: Google Maps Street View confirms...

Location identified: Whitechapel, London
# Flag: CIA{wh1t3ch4p3l_l0nd0n}
```

**Tools of the Trade:** `Google Dorking` · `Wayback Machine` · `Sherlock` · `Shodan` · `GeoGuessr` · `Maltego`

**Difficulty:** `Most Accessible`

---

## Quick Reference — All 6 Categories

| Category | Core Skill | Start With | Difficulty |
| :--- | :--- | :--- | :--- |
| 🌐 Web | Finding website vulnerabilities | PortSwigger Web Academy | Easy |
| 💥 Pwn | Memory exploitation | pwn.college | Hard |
| 🔐 Crypto | Breaking weak encryption | CryptoHack | Medium |
| ⚙️ Reverse | Reading compiled code | picoCTF Rev challenges | Medium |
| 🔍 Forensics | Recovering hidden data | PicoCTF Forensics | Easy |
| 🕵️ OSINT | Public internet research | TraceLabs / CTFtime events | Easy |

## Ready to Pick Your First Category?

Start with Forensics or OSINT if you're completely new. Add Web once you know basic HTTP. The rest will follow. Pick a platform and go.

<div class="blog-cta-links">
  <a href="https://picoctf.org" target="_blank">picoCTF →</a>
  <a href="https://ctftime.org" target="_blank">CTFtime</a>
  <a href="https://cryptohack.org" target="_blank">CryptoHack</a>
  <a href="https://pwn.college" target="_blank">pwn.college</a>
  <a href="/resources/blogs/" target="_blank">More Blogs</a>
</div>
