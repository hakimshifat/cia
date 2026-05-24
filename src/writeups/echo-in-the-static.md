---
title: "Echo in the Static"
description: "CTF writeup for Echo in the Static: recovering an AES-256-GCM encrypted flag from a passphrase hidden in the challenge title, then decoding audio steganography."
date: "2026-05-24"
author: "Carnage_"
image: "/assets/images/writeups/hack-er-hat-2026-ctf-reverse-writeups/pasted-image-20260524090418.png"
tags:
  - "CTF"
  - "Cryptography"
  - "Steganography"
  - "AES"
  - "Writeup"
draft: false
---

**Category:** Cryptography &nbsp;|&nbsp; **Difficulty:** Medium &nbsp;|&nbsp; **Tools:** CyberChef

## Challenge Overview

This challenge presented a ciphertext string segmented by `$` delimiters, each field encoding a specific cryptographic parameter. The objective was to identify the encryption scheme, recover the decryption key from a hidden hint embedded in the challenge title, and ultimately extract the plaintext flag from an audio file.

---

## Extracted Cryptographic Parameters

| Parameter   | Value                                    | Description                          |
|-------------|------------------------------------------|--------------------------------------|
| Algorithm   | AES-256-GCM                              | Authenticated symmetric encryption   |
| KDF         | PBKDF2-HMAC-SHA256                       | Key derivation from passphrase       |
| Iterations  | 200000                                   | PBKDF2 hashing rounds                |
| Salt        | `c17032827dd15692570ffe18fc2a335d`       | Hex-encoded PBKDF2 salt              |
| IV          | `0b6cf7d91c0a215d62e19394`               | AES-GCM Initialization Vector        |
| Auth Tag    | `0644f2e6f068a1bc34bdd20999832cba`       | GCM authentication tag               |
| Passphrase  | `echoes-in-the-static`                   | Hidden in the challenge title        |

---

## Solution Walkthrough

### Step 1 — Identify the Encryption Scheme

The ciphertext string was divided into distinct fields by `$` separators. Reading each field revealed a standard format: `algorithm · KDF · iterations · salt · IV · auth tag · ciphertext`. The identifier `AES-256-GCM` confirmed authenticated symmetric encryption was in use.

### Step 2 — Recover the Passphrase

The passphrase field displayed the message `"No clue for you"` — an intentional red herring. The actual key was concealed in the challenge title itself: **echoes-in-the-static**. Hiding secrets in challenge metadata is a classic CTF technique worth recognising.

### Step 3 — Derive the AES-256 Key via PBKDF2

With the passphrase recovered, it was stretched into a 256-bit AES key using PBKDF2-HMAC-SHA256 in CyberChef's **Derive PBKDF2 Key** operation:

| Field      | Value                              |
|------------|------------------------------------|
| Passphrase | `echoes-in-the-static` (UTF-8)     |
| Key Size   | 256 bits                           |
| Iterations | 200000                             |
| Hash Func  | SHA-256                            |
| Salt       | `c17032827dd15692570ffe18fc2a335d` (Hex) |

**Derived Key:**
```
4f3c9c1037d7857356634b0a674d721e60406506385c20d809b7a752cd15cf61
```

![CyberChef: Derive PBKDF2 Key — producing the 256-bit AES key from the passphrase](/assets/images/writeups/echo-in-the-static/img-000.png)

### Step 4 — Decrypt the Ciphertext with AES-256-GCM

The derived key was fed into CyberChef's **AES Decrypt** operation in GCM mode. Supplying the correct IV and authentication tag successfully verified integrity and produced the plaintext.

| Field | Value |
|-------|-------|
| Key   | `4f3c9c1037d7857356634b0a674d721e60406506385c20d809b7a752cd15cf61` |
| IV    | `0b6cf7d91c0a215d62e19394` |
| Mode  | GCM |
| Tag   | `0644f2e6f068a1bc34bdd20999832cba` |
| Output | `https://drive.google.com/file/d/1fmbUdymZpiT2RLCy6GOYjr3pUtynGnJ7/view` |

![CyberChef: AES-256-GCM Decrypt — output reveals a Google Drive link](/assets/images/writeups/echo-in-the-static/img-001.png)

### Step 5 — Retrieve and Analyse the Audio File

The decrypted plaintext contained a Google Drive link hosting `flag.wav`. The file played a distorted, radio-static-style voice — thematically consistent with "Echo in the Static". Careful listening revealed the spoken flag encoded in leet-speak.

![flag.wav playing in Google Drive — distorted radio voice reveals the flag](/assets/images/writeups/echo-in-the-static/img-002.png)

---

## Flag

```
HAAT{W0W_Y0U_R3411Y_1157N3D}
```

---

## Key Takeaways

| Concept | Notes |
|---------|-------|
| **AES-256-GCM** | Provides both confidentiality and integrity. The auth tag must be correct or decryption fails. |
| **PBKDF2** | A computationally expensive KDF designed to slow brute-force attacks. High iteration counts are intentional. |
| **Steganographic Hints** | CTF titles, descriptions, and flavour text frequently conceal passphrases — read everything carefully. |
| **CyberChef** | An indispensable browser-based toolkit for chaining cryptographic operations without writing code. |
