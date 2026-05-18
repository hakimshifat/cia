---
title: "Phishing Link Checker"
description: "A Python CLI tool for analyzing suspicious .eml files, extracting phishing indicators, and generating structured incident reports."
date: "2026-05-18"
author: "Cyber Invasion Army"
tags:
  - "Security Tool"
  - "Phishing"
  - "Email Analysis"
  - "Project"
draft: false
---

## Description

Phishing Link Checker is a lightweight Python command-line tool built for fast triage of suspicious email samples. It reads `.eml` files, extracts the most useful investigation artifacts, flags phishing indicators, and produces both a readable terminal report and a structured JSON report for later review.

The project is designed for CTF-style analysis, blue-team practice, and quick email-security investigations where the goal is to understand whether a message contains suspicious links, spoofed sender details, risky infrastructure, or unsafe attachments.

## What It Does

- Parses `.eml` email files using Python's standard email tooling.
- Extracts headers such as `From`, `Reply-To`, `Return-Path`, `Subject`, `Date`, and `Message-ID`.
- Reviews `Received` headers and highlights suspicious mail-routing patterns.
- Parses SPF, DKIM, and DMARC results from `Authentication-Results`.
- Extracts URLs from plain-text and HTML email bodies.
- Flags risky URL patterns such as IP-based links, punycode domains, shorteners, encoded paths, unusual ports, suspicious TLDs, and lookalike domains.
- Detects display-name and sender-address mismatches.
- Lists attachments, records metadata, and calculates SHA256 hashes.
- Saves analysis output as JSON for repeatable review and reporting.

## Detection Focus

The analyzer combines several practical signals instead of relying on one indicator. It checks whether message authentication looks weak, whether mail routing appears unusual, whether sender names and domains line up, and whether extracted URLs show common phishing traits.

These findings are combined into a low, medium, or high risk assessment so the report stays useful during quick triage.

## Optional Integrations

The core analyzer works offline by default. Optional integrations can be enabled when API keys or extra tooling are available:

- VirusTotal URL and file-hash lookups through `VT_API_KEY`.
- Google Safe Browsing URL and hash-prefix checks through `GSB_API_KEY`.
- WHOIS-based domain-age lookup when `python-whois` is installed.
- YARA attachment scanning when `yara-python` and rules are provided.

## Tech Stack

- Python 3.9+
- Standard-library email parsing
- `urllib.parse` for URL handling
- `hashlib` for attachment hashing
- Optional `requests`, `python-whois`, and `yara-python` integrations
- `unittest` for regression tests

## Security Notes

Email samples and attachments should always be treated as untrusted. The tool extracts metadata and can save attachments to a chosen directory, but unknown files should be handled inside a sandbox or isolated analysis environment.

By default, the analyzer does not make network requests. External checks only run when optional integrations are configured.

For source code access, email us at [cyberinvasionarmy@gmail.com](mailto:cyberinvasionarmy@gmail.com).
