---
title: "Stego Royale"
description: "CTF writeup for Stego Royale: extracting a real flag from a multi-layer MP4 challenge involving spectrogram analysis, video-bit decoding, EOF ZIP carving, XOR, and zlib decompression."
date: "2026-05-24"
author: "Carnage_"
image: "/assets/images/writeups/hack-er-hat-2026-ctf-reverse-writeups/pasted-image-20260524090418.png"
tags:
  - "CTF"
  - "Steganography"
  - "Forensics"
  - "Audio"
  - "Writeup"
draft: false
---

## Overview

Stego Royale is a multi-layer steganography challenge built around an MP4 file with several hidden layers. A simple `strings` search reveals a convincing fake flag, but the challenge prompt and metadata suggest that the first visible path is bait. The correct solve path splits the MP4 into secondary audio and video streams, reads a spectrogram clue, decodes frame-bit data from the second video stream, carves an appended ZIP archive, and finally decodes the extracted payload using XOR followed by zlib decompression.

| Stage | Evidence / Action | Result |
|-------|-------------------|--------|
| 1 | Run basic file and strings triage | Fake flag found; not accepted |
| 2 | Extract second audio stream and render a spectrogram | `KEY=MIRRORDECK`, `STEP=37`, `XOR=3C` |
| 3 | Decode the second video stream using `STEP=37` | `TOKEN=GOLDENELIXIR` and password rule |
| 4 | Carve ZIP appended after the EOF marker | `eof_chest.zip` contains `crown.dat` |
| 5 | Unzip, XOR with `0x3c`, then zlib decompress | Real flag recovered |

---

## Tools Used

- `file` and `strings` for initial triage
- `ffprobe` for stream inspection
- `ffmpeg` for extracting the hidden audio stream and rendering a spectrogram
- Python 3 for video-bit decoding, ZIP carving, XOR, and zlib decompression
- `unzip` for listing and extracting the carved ZIP archive

---

## Step 1 — Initial Triage: Fake Flag Discovery

The first step was to inspect the MP4 and search for embedded flag-looking strings. This immediately revealed a fake flag.

```bash
strings -a Stego_Royale_challenge.mp4 | grep -o 'rcCTF{[^}]*}'
```

![Figure 1 - Basic triage finds the fake flag in the MP4 strings output.](/assets/images/writeups/stego-royale/img-000.png)

The discovered value was:

```
rcCTF{nice_try_this_training_deck_is_fake}
```

The wording `nice_try` and `training_deck_is_fake` matches the challenge hint that the first chest is bait. This confirms that deeper stream analysis is required.

---

## Step 2 — Audio Stream Analysis: Spectrogram Clue

The MP4 contains an additional audio stream. The second audio stream was extracted as a mono WAV and converted into a spectrogram image.

```bash
ffmpeg -y -v error -i Stego_Royale_challenge.mp4 \
    -map 0:a:1 -vn -ac 1 -ar 48000 second_sound.wav

ffmpeg -y -v error -i second_sound.wav \
    -lavfi "showspectrumpic=s=2200x1000:legend=1:fscale=lin:scale=lin:saturation=5" \
    audio_spectrogram.png
```

![Figure 2 - Commands used to extract the hidden audio stream and generate the spectrogram.](/assets/images/writeups/stego-royale/img-001.png)

![Figure 3 - The generated spectrogram clearly reveals the audio clue.](/assets/images/writeups/stego-royale/img-002.png)

The spectrogram provides three critical values:

```
KEY=MIRRORDECK
STEP=37
XOR=3C
```

---

## Step 3 — Video Stream Analysis: Frame-Bit Decoder

The value `STEP=37` from the spectrogram tells us to inspect every 37th frame in the second video stream. A Python decoder reads brightness blocks near the bottom-right region of those frames and reconstructs ASCII characters.

```bash
python3 decode_video_clue.py Stego_Royale_challenge.mp4
```

![Figure 4 - Decoding the second video stream reveals the token and password rule.](/assets/images/writeups/stego-royale/img-003.png)

The decoded video clue was:

```
TOKEN=GOLDENELIXIR;PASS=AUDIO-TOKEN;EOFZIP;R0YAL
```

| Clue | Meaning |
|------|---------|
| `KEY=MIRRORDECK` | First half of the ZIP password |
| `TOKEN=GOLDENELIXIR` | Second half of the ZIP password |
| `PASS=AUDIO-TOKEN` | Join the audio key and video token with a hyphen |
| `XOR=3C` | XOR byte used after extracting `crown.dat` |

**Recovered ZIP password:** `MIRRORDECK-GOLDENELIXIR`

---

## Step 4 — EOF ZIP Carving

The video clue includes `EOFZIP`, indicating that the payload is appended after the MP4 data. The ZIP was carved by locating the marker `CRCHESTv1:EOFZIP` and then writing the bytes starting at the ZIP local header `PK\x03\x04`.

```python
from pathlib import Path

mp4 = Path('Stego_Royale_challenge.mp4')
data = mp4.read_bytes()

marker = b'CRCHESTv1:EOFZIP'
marker_offset = data.index(marker)
zip_offset = data.index(b'PK\x03\x04', marker_offset)

Path('eof_chest.zip').write_bytes(data[zip_offset:])

print('marker offset:', marker_offset)
print('zip offset:', zip_offset)
print('wrote eof_chest.zip')
```

```bash
unzip -l eof_chest.zip
```

![Figure 5 - The carved EOF ZIP archive contains crown.dat.](/assets/images/writeups/stego-royale/img-004.png)

---

## Step 5 — ZIP Extraction

Using the combined password from the audio and video clues, the carved archive successfully extracts `crown.dat`.

```bash
unzip -o -P 'MIRRORDECK-GOLDENELIXIR' eof_chest.zip
ls -lh crown.dat
```

![Figure 6 - crown.dat is extracted from the password-protected ZIP archive.](/assets/images/writeups/stego-royale/img-005.png)

---

## Step 6 — Final Payload Decode

The extracted file begins with the magic bytes `RCRL`. The remaining bytes are XORed with `0x3c` and then decompressed with zlib to reveal the plaintext payload.

```python
from pathlib import Path
import zlib

blob = Path('crown.dat').read_bytes()

if blob[:4] != b'RCRL':
    raise SystemExit('bad crown.dat or wrong ZIP password')

xored = blob[4:]
decoded = bytes(b ^ 0x3c for b in xored)
plain = zlib.decompress(decoded).decode()

print(plain)

flag = plain.split('|', 1)[1]
crc = zlib.crc32(flag.encode()) & 0xffffffff

print()
print('FLAG:', flag)
print('CRC32:', f'{crc:08x}')
```

![Figure 7 - Final decoding reveals the real flag and CRC32 value.](/assets/images/writeups/stego-royale/img-006.png)

---

## Flag

```
rcCTF{Y0U_N33D_T0_UPGR4D3_Y0UR_TR00PS:)}
```

**CRC32:** `ed2bfcac`

---

## Compact Command Summary

```bash
# Stage 1: Find the fake flag
strings -a Stego_Royale_challenge.mp4 | grep -o 'rcCTF{[^}]*}'

# Stage 2: Extract and spectrogram the hidden audio stream
ffmpeg -y -v error -i Stego_Royale_challenge.mp4 \
    -map 0:a:1 -vn -ac 1 -ar 48000 second_sound.wav
ffmpeg -y -v error -i second_sound.wav \
    -lavfi "showspectrumpic=s=2200x1000:legend=1:fscale=lin:scale=lin:saturation=5" \
    audio_spectrogram.png

# Stage 3: Decode the video stream
python3 decode_video_clue.py Stego_Royale_challenge.mp4

# Stage 4: Carve the EOF ZIP
python3 - <<'PY'
from pathlib import Path
data = Path('Stego_Royale_challenge.mp4').read_bytes()
marker = b'CRCHESTv1:EOFZIP'
zip_offset = data.index(b'PK\x03\x04', data.index(marker))
Path('eof_chest.zip').write_bytes(data[zip_offset:])
PY

# Stage 5: Extract with password
unzip -o -P 'MIRRORDECK-GOLDENELIXIR' eof_chest.zip

# Stage 6: XOR + zlib decode
python3 - <<'PY'
from pathlib import Path
import zlib
blob = Path('crown.dat').read_bytes()
plain = zlib.decompress(bytes(b ^ 0x3c for b in blob[4:])).decode()
flag = plain.split('|', 1)[1]
print(flag)
PY
```
