---
title: "TJCTF — rev/rotated"
description: "Reverse engineering writeup for TJCTF rotated: reversing a per-byte 0x1d shift to recover a hidden ELF, extracting and deobfuscating a shell script payload, and base64-decoding the embedded flag."
date: "2026-05-24"
author: "Carnage_"
image: "/assets/images/writeups/tjctf-rotated/tjctf2026.jpeg"
tags:
  - "CTF"
  - "Reverse Engineering"
  - "TJCTF"
  - "ELF"
  - "Writeup"
draft: false
---

**Category:** Reverse Engineering &nbsp;|&nbsp; **Flag:** `tjctf{b45h_d3bu6_m4573r}`

## Executive Summary

`rotated` is a reverse engineering challenge where the provided file is intentionally transformed so it does not initially resemble a valid executable. The title and hint indicate that the transformation should be reversed at the byte level. Testing byte-wise rotations/shifts reveals that subtracting `0x1d` from every byte restores a valid ELF binary. Running or inspecting the recovered executable exposes an obfuscated shell script, which contains a base64-encoded gzip payload. Decompressing that payload reveals another base64 string containing the flag.

---

## Step 1 — Challenge Context

The hints were the central guide for the solve path:

| Hint | Interpretation |
|------|---------------|
| *look at the title* | The challenge name `rotated` suggests a rotation or shift operation |
| *consider each byte separately* | The transformation likely applies independently to every byte, not to text strings or file blocks |

---

## Step 2 — Initial Triage

The original file did not identify as a standard executable. A hex dump of the first bytes showed no familiar magic value.

```bash
file chall
xxd -g 1 -l 16 chall
```

| Observation | Value |
|-------------|-------|
| Original leading bytes | `9c 62 69 63 1f 1e 1e 1d 1d 1d 1d 1d 1d 1d 1d 1d` |
| Expected ELF magic | `7f 45 4c 46` |
| Difference per first four bytes | `0x1d` |

The difference between the observed bytes and the ELF magic bytes is consistent: each byte appears to have been increased by `0x1d` modulo 256. The inverse operation is to **subtract `0x1d` from every byte**.

---

## Step 3 — Recovering the Hidden ELF

```python
#!/usr/bin/env python3
from pathlib import Path

data = Path("chall").read_bytes()
decoded = bytes((b - 0x1d) & 0xff for b in data)
Path("chall_unrot").write_bytes(decoded)
```

After decoding, the first bytes become a valid ELF header:

| Index | Encoded Byte | Subtract `0x1d` | Decoded Meaning |
|-------|-------------|------------------|----------------|
| 0 | `0x9c` | `0x7f` | ELF magic byte 1 |
| 1 | `0x62` | `0x45` | ASCII `E` |
| 2 | `0x69` | `0x4c` | ASCII `L` |
| 3 | `0x63` | `0x46` | ASCII `F` |

```bash
file chall_unrot
readelf -h chall_unrot
```

| Recovered Property | Value |
|-------------------|-------|
| Format | ELF 64-bit LSB PIE executable |
| Architecture | x86-64 |
| Linking | Statically linked |
| Entry Point | `0x58c8` |

---

## Step 4 — Binary and Payload Analysis

Executing the recovered binary inside a disposable workspace drops a file named `script.sh`.

```bash
chmod +x chall_unrot
./chall_unrot
ls -la
cat script.sh
```

The script is intentionally noisy and uses shell expansion tricks to obscure a simple pipeline. The important portion is a base64-encoded gzip blob:

```bash
#!/bin/bash
${*,} ${@//nj2p#@$\!/^Bis\X} e\val "$(
  ...
  'p'r\i"n"tf
  'H4sIAEDAzmkC/0tNzshXUPLJz8/OzEtXSMsvUkhUSMtJTLdXUlBWSHEvyEpxjzKPzAo0THSzzPY18jL
  0y7Es8XMJNfY19rJ0Tre1BQCG
  qZA9QQAAAA=='
  ... b""'a'''s"e"6"${@^^}"4 -d ...
  ... \gu...n$'\172''i'p -c ...
)"
```

Cleaning up the obfuscation yields the underlying operation:

```bash
printf '<base64 gzip payload>' | base64 -d | gzip -c
```

---

## Step 5 — Final Flag Extraction

The embedded gzip payload decompresses to a shell command containing another base64 string in a comment:

```bash
echo "Looking for a flag?" # dGpjdGZ7YjQ1aF9kM2J1Nl9tNDU3M3J9Cg==
```

The final base64 value decodes directly to the flag:

```bash
echo 'dGpjdGZ7YjQ1aF9kM2J1Nl9tNDU3M3J9Cg==' | base64 -d
```

---

## Flag

```
tjctf{b45h_d3bu6_m4573r}
```

---

## Complete Solve Script

```python
#!/usr/bin/env python3
import base64
import gzip
import os
import re
import subprocess
from pathlib import Path

INPUT     = Path("chall")
RECOVERED = Path("chall_unrot")

# 1. Reverse the per-byte shift.
data = INPUT.read_bytes()
RECOVERED.write_bytes(bytes((b - 0x1d) & 0xff for b in data))
os.chmod(RECOVERED, 0o755)

# 2. Execute the recovered binary to produce script.sh.
subprocess.run([f"./{RECOVERED.name}"], check=True)

# 3. Extract the base64 gzip blob from the generated script.
script   = Path("script.sh").read_text(errors="replace")
gzip_b64 = re.search(r"H4sI[A-Za-z0-9+/=]+", script).group(0)

payload = gzip.decompress(base64.b64decode(gzip_b64)).decode()
print(payload)

# 4. Decode the final base64 string from the payload comment.
flag_b64 = re.search(r"#\s*([A-Za-z0-9+/=]+)", payload).group(1)
flag     = base64.b64decode(flag_b64).decode().strip()
print(flag)
```

---

## Key Takeaways

| Lesson | Why It Mattered |
|--------|----------------|
| **Use file signatures as anchors** | ELF magic `7f 45 4c 46` is an excellent target when reversing unknown byte transformations |
| **Take hints literally** | *"consider each byte separately"* strongly suggested a byte-wise operation instead of a block cipher |
| **Reduce obfuscation to data flow** | The shell script looked complex, but its useful behavior was only base64 decode → gzip decompress |
| **Keep execution controlled** | Recovered binaries should be run in disposable CTF workspaces to avoid unintended side effects |
