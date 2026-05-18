---
title: "Mem 2"
description: "Memory forensics writeup for decoding a single-byte XOR-obfuscated blob recovered from explorer.exe memory."
date: "2026-05-18"
author: "Carnage"
tags:
  - "EWU National ROBOFEST"
  - "Memory Forensics"
  - "XOR"
  - "CTF"
draft: false
---

## Overview

`Mem 2` covered a memory artifact found in `explorer.exe`. The hidden data was encoded with a single-byte repeating XOR key. By leveraging the known `ROBOFEST{` flag prefix, the encoded location and XOR key were recovered efficiently.

```text
Category: Memory Forensics
Platform: Windows 7 memory image captured with DumpIt.exe
Primary Artifact: explorer.exe anomalous XOR blob
Points: 150
Recovered Flag: ROBOFEST{dll_p4th_r3v34ls_th3_truth}
Core Technique: Single-byte XOR brute force using known flag prefix
```

## Environment

The analysis used `Shadow_Memory.raw`, a Windows 7 workstation memory image. UTF-16LE string extraction is still useful for first-pass memory triage, and Volatility can be used later for process attribution.

```bash
file Shadow_Memory.raw
ls -lh Shadow_Memory.raw
strings -a -el Shadow_Memory.raw | grep -iE 'ROBOFEST|StikyNot|CTXBLK'
```

## Investigation

The artifact was described as anomalous data inside `explorer.exe`. Since the encoding used a single-byte repeating XOR key, the scanner tested all 256 keys and searched for an encoded version of the expected `ROBOFEST{` prefix.

```python
#!/usr/bin/env python3
from pathlib import Path

data = Path("Shadow_Memory.raw").read_bytes()
prefix = b"ROBOFEST{"

for key in range(256):
    encoded_prefix = bytes(b ^ key for b in prefix)
    pos = data.find(encoded_prefix)
    if pos != -1:
        blob = data[pos:pos + 100]
        decoded = bytes(b ^ key for b in blob)
        print(f"[+] key = {key:#x}, offset = {pos:#x}")
        print(decoded)
```

## Evidence

```text
Recovered XOR key: 0x41
ASCII equivalent: A
Decoded plaintext: ROBOFEST{dll_p4th_r3v34ls_th3_truth}
```

## Optional Process Attribution

The same recovery can be validated against an `explorer.exe`-specific memory dump instead of the full raw image.

```bash
# Volatility 2 style
vol.py -f Shadow_Memory.raw imageinfo
vol.py -f Shadow_Memory.raw --profile=Win7SP1x64 pslist | grep -i explorer
mkdir -p dumps
vol.py -f Shadow_Memory.raw --profile=Win7SP1x64 memdump -p <EXPLORER_PID> -D dumps
python3 xor_flag_scan.py dumps/<EXPLORER_PID>.dmp

# Volatility 3 style
vol -f Shadow_Memory.raw windows.pslist | grep -i explorer
mkdir -p dumps
vol -f Shadow_Memory.raw -o dumps windows.memmap --pid <EXPLORER_PID> --dump
python3 xor_flag_scan.py dumps/*
```

The decoder XORs the known plaintext prefix with each candidate key and searches for the encoded prefix in memory. A hit identifies both the blob location and the candidate key. Decoding nearby bytes reveals the flag.

## Result

The scanner found a valid encoded `ROBOFEST{` prefix and decoded the blob with key `0x41`, the ASCII character `A`.

```text
ROBOFEST{dll_p4th_r3v34ls_th3_truth}
```

## Notes

- Known-format values such as CTF flag prefixes make XOR key discovery practical.
- Process attribution is stronger when the target process memory is dumped separately and the same decoder is run against that dump.
- A recovered plaintext that references DLL paths should prompt reviewers to inspect module lists and load paths in a full investigation.
