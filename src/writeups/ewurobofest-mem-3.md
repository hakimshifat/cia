---
title: "Mem 3"
description: "Memory forensics writeup for reassembling XOR-encoded CTXBLK fragments hidden in conhost.exe memory."
date: "2026-05-18"
author: "Carnage"
image: "/assets/images/writeups/ewurobofest-mem-3/ewu.jpeg"
tags:
  - "EWU National ROBOFEST"
  - "Memory Forensics"
  - "XOR"
  - "CTF"
draft: false
---

## Overview

`Mem 3` required recovering a flag split across three labeled fragments in `conhost.exe` memory. The fragments were marked as `CTXBLK_A`, `CTXBLK_B`, and `CTXBLK_C`, encoded with the same single-byte XOR key, and assembled in label order.

```text
Category: Memory Forensics
Platform: Windows 7 memory image captured with DumpIt.exe
Primary Artifact: conhost.exe CTXBLK_A/B/C fragments
Points: 300
Recovered Flag: ROBOFEST{ppr1d_sp00f1ng_d3t3ct3d}
Core Technique: Marker search, fragment extraction, shared XOR key brute force, ordered assembly
```

## Investigation

The first step was to search for the fragment labels and record where each marker appeared. After extracting the bytes after each marker, the fragments could be decoded with a shared single-byte XOR key.

```bash
grep -abo 'CTXBLK_A\|CTXBLK_B\|CTXBLK_C' Shadow_Memory.raw
```

## Fragment Evidence

```text
Marker    Encoded Fragment    Decoded Fragment
CTXBLK_A  A\Q\UV@Ghcc         ROBOFEST{pp
CTXBLK_B  a"wL`c##u"}         r1d_sp00f1n
CTXBLK_C  tLw g pg wn         g_d3t3ct3d}

Recovered key: 0x13
```

## Reproducible Decoder

The helper below locates the markers, extracts the null-terminated encoded values, brute-forces the shared key, and prints the assembled flag.

```python
#!/usr/bin/env python3
from pathlib import Path

mem = Path("Shadow_Memory.raw").read_bytes()
markers = [b"CTXBLK_A", b"CTXBLK_B", b"CTXBLK_C"]
fragments = []

for marker in markers:
    pos = mem.find(marker)
    if pos == -1:
        print(f"[-] Missing marker: {marker.decode()}")
        raise SystemExit(1)
    start = pos + len(marker) + 1
    end = mem.find(b"\x00", start)
    if end == -1:
        end = start + 64
    encoded = mem[start:end]
    fragments.append(encoded)
    print(f"[+] {marker.decode()} at {hex(pos)}")
    print(f"    Encoded: {encoded!r}")

for key in range(256):
    decoded = b"".join(bytes(b ^ key for b in frag) for frag in fragments)
    if b"ROBOFEST{" in decoded and b"}" in decoded:
        flag = decoded.split(b"}")[0] + b"}"
        print(f"[+] Key : {hex(key)}")
        print(f"[+] Flag: {flag.decode(errors='ignore')}")
```

Assembly:

```text
ROBOFEST{pp + r1d_sp00f1n + g_d3t3ct3d}
= ROBOFEST{ppr1d_sp00f1ng_d3t3ct3d}
```

## Result

All three fragments decoded cleanly under the shared key `0x13`. Assembling the plaintext values in A-B-C order produced a complete flag.

```text
ROBOFEST{ppr1d_sp00f1ng_d3t3ct3d}
```

## Notes

- Fragmented evidence should be documented with marker names, offsets, encoded values, decoded values, and assembly order.
- Shared-key encodings can be solved by concatenating decoded candidates and looking for a complete known-format token.
- `conhost.exe` artifacts can preserve console-related operational clues even after the visible command window is gone.
