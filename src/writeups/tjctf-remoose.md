---
title: "TJCTF — rev/remoose"
description: "Reverse engineering writeup for TJCTF remoose: repairing a deliberately corrupted ELF binary by fixing the magic bytes and replacing NUL-byte corruption, then reconstructing the flag from character constants in helper routines."
date: "2026-05-24"
author: "Carnage_"
image: "/assets/images/writeups/tjctf-remoose/tjctf2026.jpeg"
tags:
  - "CTF"
  - "Reverse Engineering"
  - "TJCTF"
  - "ELF"
  - "Writeup"
draft: false
---

**Category:** Reverse Engineering &nbsp;|&nbsp; **Artifact:** `chall` (corrupted ELF) &nbsp;|&nbsp; **Flag:** `tjctf{5ma11_m00s3}`

## Summary

The provided file was a deliberately corrupted ELF executable. The visible clue was the ELF magic being changed from `ELF` to `ELK`, and the deeper corruption pattern was that NUL bytes were replaced with ASCII space bytes. Reversing those changes made the binary parseable for static analysis. The flag was then reconstructed from the character constants passed into printing routines.

| Field | Value |
|-------|-------|
| Original SHA-256 | `809dce67817bef879a2f573da162614fbe2a01f2b04633128e4921cf6968d627` |
| Flag | `tjctf{5ma11_m00s3}` |

---

## Step 1 — Initial Triage

The challenge name and prompt suggested that only a small modification prevented the executable from running. The first triage step was to inspect the file header. The system did not classify the file as an executable, but the first bytes strongly resembled an ELF header: `7f 45 4c 4b`. The correct ELF magic should be `7f 45 4c 46`, so the final byte had been changed from `F` to `K`.

```
Original first 64 bytes:
7f 45 4c 4b 02 01 01 20 20 20 20 20 20 20 20 20
03 20 3e 20 01 20 20 20 60 10 20 20 20 20 20 20
40 20 20 20 20 20 20 20 28 3a 20 20 20 20 20 20
20 20 20 20 40 20 38 20 0b 20 40 20 1e 20 1d 20

Expected ELF pattern after reversing corruption:
7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
03 00 3e 00 01 00 00 00 60 10 00 00 00 00 00 00
```

---

## Step 2 — Corruption Pattern

After the magic-byte anomaly, the header contained many `0x20` bytes in locations where ELF headers normally contain `0x00`. This was too systematic to be normal data. The repair hypothesis was that the challenge author replaced NUL bytes with spaces.

A simple patch restored the ELF magic and converted spaces back into NUL bytes:

```python
from pathlib import Path

data = bytearray(Path("chall").read_bytes())

# Fix: 7f 45 4c 4b ("ELK") → 7f 45 4c 46 ("ELF")
data[3] = ord("F")

# Reverse NUL → space corruption
data = data.replace(b" ", b"\x00")

Path("chall_fixed").write_bytes(data)
```

This repair was sufficient for static analysis. Full execution was unnecessary because the relevant routines were recoverable with standard ELF tools after the header and NUL-byte corruption were reversed.

---

## Step 3 — Verification

```bash
$ file chall
chall: data

$ python3 fix.py

$ file chall_fixed
chall_fixed: ELF 64-bit LSB pie executable, x86-64, dynamically linked, not stripped

$ objdump -d -M intel chall_fixed
# main calls flag(), which emits the flag in several helper routines.
```

---

## Step 4 — Static Analysis

The binary does not store the complete flag as one contiguous string. Instead, it emits individual characters through small helper functions named `flag`, `flag1`, `flag2`, `flag3`, and `flag4`. Reading the immediate values in call order reconstructs the flag.

```asm
0000000000001145 <main>:
  114e: e8 2c 00 00 00   call  117f <flag>

000000000000117f <flag>:
  1183: bf 74 00 00 00   mov  edi, 0x74   ; 't'
  118d: bf 6a 00 00 00   mov  edi, 0x6a   ; 'j'
  1197: bf 63 00 00 00   mov  edi, 0x63   ; 'c'
  11a1: bf 74 00 00 00   mov  edi, 0x74   ; 't'
  11ab: lea rdi, [rip+0xe52]              ; "f{"
  11c1: call 11c9 <flag1>

00000000000011c9 <flag1>:
  11cd: bf 35 00 00 00   mov  edi, 0x35   ; '5'
  11d7: bf 6d 00 00 00   mov  edi, 0x6d   ; 'm'
  11e6: call 1229 <flag2>

0000000000001229 <flag2>:
  122d: bf 61 00 00 00   mov  edi, 0x61   ; 'a'
  1237: bf 31 00 00 00   mov  edi, 0x31   ; '1'
  1241: bf 31 00 00 00   mov  edi, 0x31   ; '1'
  124b: bf 5f 00 00 00   mov  edi, 0x5f   ; '_'
  125a: call 115a <flag3>

000000000000115a <flag3>:
  115e: bf 6d 00 00 00   mov  edi, 0x6d   ; 'm'
  1168: bf 30 00 00 00   mov  edi, 0x30   ; '0'
  1177: call 11ee <flag4>

00000000000011ee <flag4>:
  11f2: bf 30 00 00 00   mov  edi, 0x30   ; '0'
  11fc: bf 73 00 00 00   mov  edi, 0x73   ; 's'
  1206: bf 33 00 00 00   mov  edi, 0x33   ; '3'
  1210: be 7d 00 00 00   mov  esi, 0x7d   ; '}'
```

---

## Step 5 — Flag Reconstruction

| Routine | Recovered Characters |
|---------|---------------------|
| `flag`  | `t j c t f {` |
| `flag1` | `5 m` |
| `flag2` | `a 1 1 _` |
| `flag3` | `m 0` |
| `flag4` | `0 s 3 }` |

Concatenating in execution order gives:

```
tjctf{5ma11_m00s3}
```

---

## Flag

```
tjctf{5ma11_m00s3}
```

---

## Key Takeaways

| Lesson | Why It Mattered |
|--------|----------------|
| **Single invalid magic byte** | Caused all normal tools to reject the binary as generic data |
| **Systematic header anomalies** | Repeated spaces in NUL positions were more informative than `strings` output |
| **Repair without execution** | Making a damaged ELF parseable is often enough — running it is optional when disassembly exposes the flag path |
