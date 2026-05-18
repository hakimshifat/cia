---
title: "Mem_Ready to Send"
description: "Memory forensics writeup for recovering a Base64 staged exfiltration payload hidden behind a SYSLOG marker."
date: "2026-05-18"
author: "Carnage"
tags:
  - "EWU National ROBOFEST"
  - "Memory Forensics"
  - "Base64"
  - "CTF"
draft: false
---

## Overview

The `Mem_Ready to Send` challenge required analysis of a raw memory image to locate data staged before exfiltration. The payload was disguised as a system log entry inside memory associated with `conhost.exe`.

By extracting printable strings, filtering for the `SYSLOG` marker, and decoding the Base64 payload, the hidden flag was recovered.

```text
Challenge Name: Mem_Ready to Send
Category: Memory Forensics
Points: 400
Artifact: Shadow_Memory.raw
Process Hint: conhost.exe
Encoding: Base64
Recovered Flag: ROBOFEST{b4s364_1n_m3m0ry_3xf1l}
```

## Objective

The goal was to identify the staged exfiltration payload inside the memory dump, determine its encoding, decode it, and submit the recovered flag.

## Tools Used

```text
strings  Extract printable strings from the raw memory image
grep     Filter extracted strings for log-related indicators
awk      Extract the encoded value after the SYSLOG marker
base64   Decode the staged payload into readable flag content
```

## Investigation

Because the challenge described the payload as a system log entry, the first step was to extract printable strings from the memory image and search for log-related markers.

```bash
strings -a Shadow_Memory.raw | grep -i "syslog"
```

This returned a suspicious entry:

```text
[SYSLOG]: Uk9CT0ZFU1R7YjRzMzY0XzFuX20zbTByeV8zeGYxbH0=
```

The value after the `SYSLOG` prefix had the usual shape of Base64 encoded data: printable alphanumeric characters with padding at the end.

```text
Uk9CT0ZFU1R7YjRzMzY0XzFuX20zbTByeV8zeGYxbH0=
```

Decoding it produced the flag.

```bash
echo 'Uk9CT0ZFU1R7YjRzMzY0XzFuX20zbTByeV8zeGYxbH0=' | base64 -d
```

```text
ROBOFEST{b4s364_1n_m3m0ry_3xf1l}
```

## One-Line Solution

```bash
strings -a Shadow_Memory.raw | grep -i "syslog" | awk -F': ' '{print $2}' | base64 -d
```

## Python Reproduction

```python
#!/usr/bin/env python3
import base64
import re
import sys

if len(sys.argv) != 2:
    print(f"Usage: python3 {sys.argv[0]} Shadow_Memory.raw")
    sys.exit(1)

path = sys.argv[1]

with open(path, "rb") as f:
    data = f.read()

strings = re.findall(rb"[\x20-\x7e]{6,}", data)
b64_re = re.compile(rb"\[SYSLOG\]:\s*([A-Za-z0-9+/=]{16,})")

for s in strings:
    match = b64_re.search(s)
    if not match:
        continue

    payload = match.group(1)

    try:
        decoded = base64.b64decode(payload, validate=True)
    except Exception:
        continue

    if b"ROBOFEST{" in decoded:
        print("[+] SYSLOG entry:", s.decode(errors="ignore"))
        print("[+] Base64:", payload.decode())
        print("[+] Decoded:", decoded.decode(errors="ignore"))
```

## Why This Worked

Memory captures preserve process buffers, command output, and printable data that may never appear as files on disk. Here, the staged payload was left in RAM with a believable `SYSLOG` prefix. String extraction exposed the fake log entry, and Base64 decoding revealed the original payload.

## Final Flag

```text
ROBOFEST{b4s364_1n_m3m0ry_3xf1l}
```
