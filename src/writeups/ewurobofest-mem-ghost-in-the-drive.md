---
title: "Mem_Ghost in the Drive"
description: "Memory forensics writeup for recovering a previous DumpIt memory capture filename from Windows RAM."
date: "2026-05-18"
author: "Carnage"
image: "/assets/images/writeups/ewurobofest-mem-ghost-in-the-drive/ewu.jpeg"
tags:
  - "EWU National ROBOFEST"
  - "Memory Forensics"
  - "Windows"
  - "CTF"
draft: false
---

## Overview

`Mem_Ghost in the Drive` required analysis of a Windows memory image to locate a previous memory capture that was still referenced in RAM. The expected answer was the filename of that previous capture, submitted using the event flag format.

```text
Challenge Name: Mem_Ghost in the Drive
Category: Memory Forensics
Points: 150
Final Artifact: Previous DumpIt memory capture filename
Final Flag: ROBOFEST{2pac-20190626-122526.raw}
```

## Objective

The goal was to recover the filename of a prior DumpIt memory capture from the memory image. Since the system was Windows-based, the investigation focused on UTF-16LE encoded strings, file paths, and artifacts containing DumpIt-style raw memory capture filenames.

## Methodology

Windows file paths and command-line artifacts are commonly stored in memory as UTF-16LE strings. A normal ASCII `strings` pass can miss these artifacts, so the analysis used little-endian string mode and filtered for DumpIt-related paths and timestamped raw filenames.

```bash
strings -a -el -n 6 Shadow_Memory.raw \
  | grep -iE 'dumpit|2pac-[0-9]{8}-[0-9]{6}\.raw'
```

## Evidence

The string extraction produced multiple filename candidates. The strongest hit was a full path under the user profile Desktop DumpIt folder.

```text
c:\users\eminem\desktop\dumpit\2pac-20190626-122526.raw
2PAC-20190629-072925.raw
2PAC-20190625-132823.raw
\Users\eminem\Desktop\DumpIt\2PAC-20190629-072925.raw
```

The June 29 filename corresponded to the current memory acquisition referenced by the scenario, so it was not the previous capture. The June 26 filename appeared as a complete DumpIt path, making it the strongest candidate.

## Candidate Evaluation

```text
2PAC-20190629-072925.raw  Current acquisition timeframe; excluded as the previous capture.
2PAC-20190625-132823.raw  Stale directory or MFT-style fragment; weaker context.
2pac-20190626-122526.raw  Full path under c:\users\eminem\desktop\dumpit\; best-supported answer.
```

## Cleaner Extraction

```bash
strings -a -el -n 6 Shadow_Memory.raw \
  | grep -ioE '2pac-[0-9]{8}-[0-9]{6}\.raw' \
  | sort -fu
```

```text
2PAC-20190625-132823.raw
2pac-20190626-122526.raw
2PAC-20190629-072925.raw
```

## Reproducible Python Extractor

```python
#!/usr/bin/env python3
import re
from pathlib import Path

data = Path("Shadow_Memory.raw").read_bytes()
pattern = re.compile(
    b"(?:[A-Za-z0-9_\\:\\.\\-]\x00){0,120}"
    b"2\x00[Pp]\x00[Aa]\x00[Cc]\x00-\x00"
    b"(?:[0-9]\x00){8}-\x00(?:[0-9]\x00){6}"
    b"\.\x00[Rr]\x00[Aa]\x00[Ww]\x00"
)

hits = set()
for match in pattern.finditer(data):
    text = match.group().decode("utf-16le", errors="ignore")
    idx = text.lower().find("c:\\")
    if idx == -1:
        idx = text.lower().find("2pac-")
    if idx != -1:
        hits.add(text[idx:])

for hit in sorted(hits, key=str.lower):
    print(hit)
```

## Conclusion

The previous memory capture filename was `2pac-20190626-122526.raw`. This conclusion is supported by the recovered full DumpIt path and by excluding the current June 29 acquisition artifact.

```text
ROBOFEST{2pac-20190626-122526.raw}
```
