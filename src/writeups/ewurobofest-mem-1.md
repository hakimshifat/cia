---
title: "Mem 1"
description: "Memory forensics writeup for recovering a flag hidden in a suspicious Sticky Notes command-line argument."
date: "2026-05-18"
author: "Carnage"
tags:
  - "EWU National ROBOFEST"
  - "Memory Forensics"
  - "Windows"
  - "CTF"
draft: false
---

## Overview

`Mem 1` involved recovering a flag hidden in a command-line argument for `StikyNot.exe`, the Windows Sticky Notes application. The process normally does not require a custom flag-like argument, making the command line a high-value artifact during memory triage.

```text
Category: Memory Forensics
Platform: Windows 7 memory image captured with DumpIt.exe
Primary Artifact: StikyNot.exe command line
Points: 100
Recovered Flag: ROBOFEST{wh0_15_h1d1ng_1n_pl41n_s1ght}
Core Technique: UTF-16LE string carving and command-line artifact review
```

## Environment

The analysis was based on a Windows 7 workstation memory image named `Shadow_Memory.raw`. Windows command-line strings are commonly stored as UTF-16 little-endian, so UTF-16LE extraction was important.

Common first checks:

```bash
file Shadow_Memory.raw
ls -lh Shadow_Memory.raw
strings -a -el Shadow_Memory.raw | grep -iE 'ROBOFEST|StikyNot|CTXBLK'
```

## Investigation

The challenge prompt indicated that `StikyNot.exe` had an unusual command-line argument. The fastest path was to carve Unicode strings from the memory image and filter for the executable name.

```bash
strings -a -el Shadow_Memory.raw | grep -i "StikyNot"
```

A more targeted query searches for a full Sticky Notes command line containing the custom argument.

```bash
strings -a -el Shadow_Memory.raw | grep -i 'StikyNot.exe" /sticky'
```

## Evidence

The suspicious command line was recovered from memory:

```text
"C:\Windows\System32\StikyNot.exe" /sticky:ROBOFEST{wh0_15_h1d1ng_1n_pl41n_s1ght}
```

```text
Executable: C:\Windows\System32\StikyNot.exe
Unexpected Argument: /sticky:ROBOFEST{wh0_15_h1d1ng_1n_pl41n_s1ght}
Extracted Flag: ROBOFEST{wh0_15_h1d1ng_1n_pl41n_s1ght}
```

## Why This Worked

GNU `strings -a -el` extracts 16-bit little-endian text, which exposes Windows command-line values that may not appear in plain ASCII output. Once the command line was visible, the custom `/sticky:` value was directly recoverable.

## Result

The recovered value was embedded directly after the custom `/sticky:` argument. Because the string appeared as part of the process command line and matched the expected flag format, no additional decoding was required.

```text
ROBOFEST{wh0_15_h1d1ng_1n_pl41n_s1ght}
```

## Notes

- Always inspect command-line arguments for user-mode processes.
- Use UTF-16LE string extraction for Windows memory images before assuming a string artifact is absent.
- Record suspicious arguments exactly, including prefixes such as `/sticky:`, because the prefix explains the recovery path.
