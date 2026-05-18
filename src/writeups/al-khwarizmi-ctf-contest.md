---
title: "Al Khwarizmi CTF Contest"
description: "Writeups from ShibirCTF 2025 covering reverse engineering challenges, steganography, and forensics."
date: "2025-12-16"
author: "joyboy__"
image: "/assets/images/writeups/al-khwarizmi-ctf-contest/shibir.jpeg"
tags:
  - "CTF"
  - "Reverse Engineering"
  - "Steganography"
  - "Forensics"
  - "Writeup"
draft: false
---

## Reverse Engineering

### Returing is Hard

Just patching the program to execute the print_flag function was enough.

![](/assets/images/writeups/al-khwarizmi-ctf-contest/2025-12-16_18-42.png)

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216184412.png)

### Slogran of July

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216193613.png)

### Wanna Hang Haxina

Using strings command:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216192217.png)

This string appeared twice. So:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216190314.png)

#### The file is a PNG image encrypted with ASCII Shift of +5

```python
try:
    with open("encrypted.file", "rb") as f:
        data = f.read()
    decrypted = bytes([(b - 5) % 256 for b in data])
    with open("flag.png", "wb") as f:
        f.write(decrypted)
    print("Success! Open flag.png to see the image.")
except Exception as e:
    print(e)
```

That gives an image with the flag:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216190723.png)

## Steganography

### Unlimited Crack

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216193242.png)

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216193317.png)

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216193352.png)

## Forensics

### Forensics - 1

It said something about digital signature. So I tried it. Took a few attempts:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216193933.png)

First thing I did was select all texts with `Control+A` then made all font color to *black*:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216194117.png)

That gave the first flag:

![](/assets/images/writeups/al-khwarizmi-ctf-contest/pasted-image-20251216194150.png)
