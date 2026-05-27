---
title: "AES Encryption Explained"
description: "From plaintext to ciphertext — every single step of AES broken down with real examples, actual hex values, and working code."
date: "2026-05-27"
author: "imtrace"
tags:
  - "Blog"
  - "Cryptography"
  - "AES"
  - "Cybersecurity"
draft: false
---

<div class="blog-hero">
  <div class="blog-hero-tag">Blog | Cryptography | AES | Cybersecurity</div>
  <h1>AES Encryption <span>Explained</span></h1>
  <p class="blog-hero-sub">From plaintext to ciphertext — every single step of AES broken down with real examples, actual hex values, and working code. Zero assumptions. Zero shortcuts.</p>
  <div class="blog-hero-meta">
    <div>BY <span>imtrace</span></div>
    <div>PUBLISHED <span>May 2026</span></div>
    <div>READ TIME <span>~25 MIN</span></div>
  </div>
</div>

You've seen "AES-256" on every VPN ad, every password manager, every messaging app. It's the most widely used encryption algorithm on the planet. Banks, governments, military — they all trust it. But what actually happens inside AES when you encrypt something? How does it turn "Hello" into meaningless garbage — and back again?

This post tears it apart. Every step, from scratch, with a real worked example you can follow byte by byte.

```
Plaintext:  "Hello, AES World"   (exactly 16 bytes — one AES block)
Key:        "MySecretKey12345"   (16 bytes — AES-128)
```

By the end, you'll watch these 16 readable characters transform into unrecognizable ciphertext — and understand exactly why no computer on Earth can reverse it without the key.

---

🔐 01. What Is AES?

AES stands for **Advanced Encryption Standard**. It's a symmetric block cipher — "symmetric" meaning the same key encrypts and decrypts, and "block cipher" meaning it processes data in fixed-size chunks.

Here are the fundamentals:

- **Block size:** always 128 bits (16 bytes). Every piece of data is split into 16-byte blocks before encryption.
- **Key sizes:** 128, 192, or 256 bits. Bigger key = more rounds = harder to break.
- **Rounds:** AES-128 runs 10 rounds. AES-192 runs 12. AES-256 runs 14. Each round scrambles the data further.
- **Designers:** Joan Daemen and Vincent Rijmen created the algorithm (originally called "Rijndael"). NIST standardized it in 2001 after a five-year public competition.

AES achieves security through two properties:

|    Property   |                           What it means                               |      Which step does it       |
|---------------|-----------------------------------------------------------------------|-------------------------------|
| **Confusion** | The relationship between key and ciphertext is as complex as possible | SubBytes (S-Box substitution) |
| **Diffusion** | Changing one bit of plaintext changes ~50% of ciphertext bits         | ShiftRows + MixColumns        |

Neither property alone is enough. Confusion without diffusion means each byte is encrypted independently — trivially breakable. Diffusion without confusion means the relationship is linear — solvable with algebra. AES combines both, then repeats 10 times. That's what makes it unbreakable.

📦 02. The Block and State Matrix

AES works on exactly 16 bytes at a time. Those 16 bytes are arranged into a 4×4 grid called the **State Matrix**. This grid is the central data structure — every operation in AES reads from it and writes back to it.

The critical detail: bytes fill the grid **column by column**, not row by row. This is called column-major order.

Let's convert our plaintext:

```
"Hello, AES World"

Character:  H    e    l    l    o    ,    (sp) A    E    S    (sp) W    o    r    l    d
Hex:        48   65   6c   6c   6f   2c   20   41   45   53   20   57   6f   72   6c   64
Byte index: 0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15
```

Now fill the 4×4 grid column by column:

```
State Matrix:
             Col 0    Col 1    Col 2    Col 3
Row 0    [   48       2c       45       6f   ]      H    o    E    o
Row 1    [   65       20       53       72   ]      e    ,    S    r
Row 2    [   6c       41       20       6c   ]      l   (sp) (sp)  l
Row 3    [   6c       45       57       64   ]      l    A    W    d
```

Column 0 = bytes 0–3 (`48 65 6c 6c`). Column 1 = bytes 4–7 (`2c 20 41 45`). And so on.

This state matrix is the battlefield. Every AES operation — SubBytes, ShiftRows, MixColumns, AddRoundKey — transforms this grid. After 10 rounds of transformation, the grid holds the ciphertext.

---

🔑 03. Key Schedule — Turning 1 Key Into 11

AES-128 has 10 rounds, plus an initial key addition. That's 11 points where a key is needed — but the user only provides one 16-byte key. The **Key Schedule** algorithmically derives 10 more round keys from the original.

The original key as four columns

```
Key: "MySecretKey12345"
Hex: 4d 79 53 65 | 63 72 65 74 | 4b 65 79 31 | 32 33 34 35

W[0] = [4d, 79, 53, 65]
W[1] = [63, 72, 65, 74]
W[2] = [4b, 65, 79, 31]
W[3] = [32, 33, 34, 35]
```

These four columns **are** Round Key 0 — the original key itself.

Generating Round Key 1 (W[4] through W[7])

Every 4th column (W[4], W[8], W[12]...) goes through a special transformation. The other columns are simple XORs.

**Step 1 — RotWord:** Take W[3], rotate it one byte left.

```
W[3] = [32, 33, 34, 35]  →  [33, 34, 35, 32]
```

The first byte moves to the end. That's it.

**Step 2 — SubWord:** Run each byte through the S-Box (the same substitution table used in encryption — we'll cover it in the next section).

```
S-Box[0x33] = 0xc3
S-Box[0x34] = 0x18
S-Box[0x35] = 0x96
S-Box[0x32] = 0x23

Result: [c3, 18, 96, 23]
```

**Step 3 — XOR with Rcon:** XOR the first byte with a round constant. Round 1's constant is `0x01`. The other three bytes XOR with `0x00` (unchanged).

```
[c3, 18, 96, 23]  XOR  [01, 00, 00, 00]  =  [c2, 18, 96, 23]
```

The round constants are powers of 2 in GF(2⁸): `01, 02, 04, 08, 10, 20, 40, 80, 1b, 36`. They prevent symmetry between rounds.

**Step 4 — XOR with W[0]:**

```
[c2, 18, 96, 23]  XOR  W[0] = [4d, 79, 53, 65]
=  [8f, 61, c5, 46]

W[4] = [8f, 61, c5, 46]
```

**Steps 5–7 — Simple XOR for W[5], W[6], W[7]:**

```
W[5] = W[4] XOR W[1] = [8f,61,c5,46] XOR [63,72,65,74] = [ec, 13, a0, 32]
W[6] = W[5] XOR W[2] = [ec,13,a0,32] XOR [4b,65,79,31] = [a7, 76, d9, 03]
W[7] = W[6] XOR W[3] = [a7,76,d9,03] XOR [32,33,34,35] = [95, 45, ed, 36]
```

**Round Key 1** = W[4] + W[5] + W[6] + W[7]:

```
8f  ec  a7  95
61  13  76  45
c5  a0  d9  ed
46  32  03  36
```

This process repeats through W[43], producing all 10 additional round keys. The RotWord + SubWord + Rcon steps make the relationship between round keys non-linear — knowing one round key doesn't easily reveal others.

---

 📦 04. SubBytes — The S-Box

SubBytes is the confusion layer. Every byte in the state matrix is independently replaced using a fixed 256-entry lookup table called the **S-Box**.


Take a byte, split it into two hex digits. The first digit is the row, the second is the column.

```
Byte = 0x53
Row  = 5, Column = 3
S-Box[5][3] = 0xed

So: 0x53 → 0xed
```

A few more examples from our actual state (after Round 0's AddRoundKey):

```
0x05 → 0x6b    (row 0, col 5)
0x1c → 0x9c    (row 1, col c)
0x3f → 0x75    (row 3, col f)
0x09 → 0x01    (row 0, col 9)
0x52 → 0x00    (row 5, col 2)  — yes, a byte can become 0x00!
```

 Why this specific table?

The S-Box isn't random. Each entry is computed in two steps:

1. **Multiplicative inverse in GF(2⁸):** Find the value that, when multiplied by the input in the Galois Field, produces 1. Zero maps to zero (special case).
2. **Affine transformation:** Multiply the inverse by a fixed binary matrix and XOR with a constant (`0x63`).

This two-step construction guarantees:
- No byte maps to itself (no fixed points)
- No byte maps to its bitwise complement
- Maximum non-linearity — the S-Box resists both linear and differential cryptanalysis

The S-Box is the reason AES is non-linear. Without it, the entire cipher would be a system of linear equations — solvable with basic algebra regardless of key length.

---
 🔄 05. ShiftRows and MixColumns

These two operations work together to achieve **diffusion** — spreading the influence of each input byte across the entire state.

### ShiftRows

Each row of the state matrix is shifted (rotated) to the left by a different offset:

```
Row 0: no shift         [a  b  c  d]  →  [a  b  c  d]
Row 1: shift left by 1  [e  f  g  h]  →  [f  g  h  e]
Row 2: shift left by 2  [i  j  k  l]  →  [k  l  i  j]
Row 3: shift left by 3  [m  n  o  p]  →  [p  m  n  o]
```

Applied to our state after SubBytes:

```
Before ShiftRows:          After ShiftRows:
6b  84  ab  4a             6b  84  ab  4a    ← row 0 unchanged
9c  00  05  83      →      00  05  83  9c    ← row 1 shifted 1
75  36  cb  6a             cb  6a  75  36    ← row 2 shifted 2
01  c7  33  d1             d1  01  c7  33    ← row 3 shifted 3
```

**Why this matters:** Before ShiftRows, each column contains bytes from the same original column. After ShiftRows, each column contains bytes from four different original columns. This sets up MixColumns to create full diffusion.

Without ShiftRows, AES would effectively be four independent 4-byte ciphers running in parallel — far weaker than one 16-byte cipher.

 MixColumns

Each column is treated as a polynomial over GF(2⁸) and multiplied by a fixed matrix:

```
[2  3  1  1]   [a0]   [b0]
[1  2  3  1] × [a1] = [b1]
[1  1  2  3]   [a2]   [b2]
[3  1  1  2]   [a3]   [b3]
```

All arithmetic is in GF(2⁸) — addition is XOR, multiplication follows special rules (next section).

For column 0 after ShiftRows `[6b, 00, cb, d1]`:

```
b0 = (2 × 6b) ⊕ (3 × 00) ⊕ (1 × cb) ⊕ (1 × d1)
   = d6 ⊕ 00 ⊕ cb ⊕ d1
   = 0x24

b1 = (1 × 6b) ⊕ (2 × 00) ⊕ (3 × cb) ⊕ (1 × d1)
   = 6b ⊕ 00 ⊕ 5c ⊕ d1
   = 0x4c
```

The matrix is **MDS (Maximum Distance Separable)** — it guarantees that changing any `t` input bytes changes at least `5 - t` output bytes. This is the mathematically optimal diffusion.

**MixColumns is skipped in the final round** (Round 10). This maintains a symmetry between encryption and decryption that simplifies implementation.

---

 🧮 06. GF(2⁸) — The Math That Makes It Work

MixColumns requires multiplying bytes together. But normal multiplication doesn't work — `200 × 200 = 40,000`, which doesn't fit in a byte. AES uses a special number system: **Galois Field GF(2⁸)**, a finite field with exactly 256 elements (0x00 through 0xFF).

 Addition: XOR

In GF(2⁸), addition is bitwise XOR. No carries, no overflow.

```
0x57 ⊕ 0x83:
  0101 0111
⊕ 1000 0011
= 1101 0100 = 0xd4
```

Subtraction is also XOR (every element is its own additive inverse).

 Multiplication: Polynomial multiplication modulo an irreducible polynomial

Each byte represents a polynomial. The bits are coefficients:

```
0x57 = 01010111 → x⁶ + x⁴ + x² + x + 1
0x83 = 10000011 → x⁷ + x + 1
```

Multiply them like normal polynomials (using XOR for addition of coefficients), then take the remainder when divided by AES's irreducible polynomial:

```
m(x) = x⁸ + x⁴ + x³ + x + 1  =  0x11b
```

"Irreducible" means it can't be factored — like a prime number, but for polynomials. This specific polynomial was chosen by the AES designers.

 In code: the "double and add" method

```c
uint8_t gf_mult(uint8_t a, uint8_t b) {
    uint8_t result = 0;
    for (int i = 0; i < 8; i++) {
        if (b & 1)              // if lowest bit of b is set
            result ^= a;        // add a to result (XOR = addition in GF)
        uint8_t overflow = a & 0x80;  // check if a's high bit is set
        a <<= 1;                // double a (multiply by x)
        if (overflow)           
            a ^= 0x1b;          // reduce modulo the irreducible poly
        b >>= 1;                // move to next bit of b
    }
    return result;
}
```

The key insight: `0x1b` is the lower 8 bits of `0x11b`. When `a` overflows past 8 bits (the high bit was set before shifting), XORing with `0x1b` performs the polynomial reduction — keeping the result within the 256-element field.

### The only multiplications MixColumns needs

MixColumns only multiplies by 1, 2, and 3:

```
gf_mult(1, x) = x                          (identity)
gf_mult(2, x) = x << 1, XOR 0x1b if overflow   (called "xtime")
gf_mult(3, x) = gf_mult(2, x) XOR x       (double then add)
```

Example:

```
gf_mult(2, 0x6b):
  0x6b = 0110 1011
  Shift left: 1101 0110 = 0xd6
  High bit was 0 → no XOR needed
  Result: 0xd6

gf_mult(3, 0x6b):
  0xd6 XOR 0x6b = 0xbd
```

---

 📏 07. Padding — When Data Isn't 16 Bytes

AES processes exactly 16 bytes per block. Real data is rarely an exact multiple of 16. **Padding** fills the gap.

The standard is **PKCS#7**: count how many bytes are missing, then fill with that number.

```
Data: "Hello"  (5 bytes)
Missing: 16 - 5 = 11 bytes
Padded: "Hello" + 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b 0x0b
                  (eleven bytes, each with value 11)

Data: "Hello World!!!!" (15 bytes)
Missing: 1 byte
Padded: "Hello World!!!!" + 0x01

Data: "Exactly16Bytes!!" (16 bytes)
Missing: 0... but you still add a full block of padding!
Padded: "Exactly16Bytes!!" + 0x10 × 16
```

That last case is critical. If data happens to be exactly 16 bytes, PKCS#7 **still adds 16 bytes of padding**. Why? Because during decryption, the algorithm reads the last byte to determine how much padding to remove. If there were no padding, the last byte of the real data would be misinterpreted as a padding indicator — corrupting the message.

 Validating padding on decryption

After decrypting, the receiver checks:

```
Last byte = 0x03? → Check that the last 3 bytes are all 0x03 → valid ✓
Last byte = 0x05? → Check last 5 bytes are all 0x05 → valid ✓
Last byte = 0x03 but second-to-last = 0x07? → invalid ✗ (inconsistent)
Last byte = 0x00? → invalid ✗ (zero padding doesn't exist in PKCS#7)
```

This validation step is the basis of the padding oracle attack — one of the most devastating attacks against AES-CBC. But that's a story for another post.

---

 🔁 Putting It All Together — Full Encryption Walkthrough

Now let's run the complete AES-128 encryption on our example.

### Round 0: AddRoundKey (just XOR with the original key)

```
State:              Key:                Result:
48  2c  45  6f      4d  63  4b  32      05  4f  0e  5d
65  20  53  72  ⊕   79  72  65  33  =   1c  52  36  41
6c  41  20  6c      53  65  79  34      3f  24  59  58
6c  45  57  64      65  74  31  35      09  31  66  51
```

### Rounds 1–9: SubBytes → ShiftRows → MixColumns → AddRoundKey

Each round applies all four operations using that round's key from the schedule. Let's trace Round 1:

**SubBytes** — every byte through the S-Box:

```
05→6b  4f→84  0e→ab  5d→4a
1c→9c  52→00  36→05  41→83
3f→75  24→36  59→cb  58→6a
09→01  31→c7  66→33  51→d1
```

**ShiftRows** — rotate rows:

```
6b  84  ab  4a  →  6b  84  ab  4a   (row 0: no shift)
9c  00  05  83  →  00  05  83  9c   (row 1: shift 1)
75  36  cb  6a  →  cb  6a  75  36   (row 2: shift 2)
01  c7  33  d1  →  d1  01  c7  33   (row 3: shift 3)
```

**MixColumns** — matrix multiply each column in GF(2⁸).

**AddRoundKey** — XOR with Round Key 1.

Rounds 2 through 9 repeat identically with their respective round keys.

### Round 10 (Final): SubBytes → ShiftRows → AddRoundKey

No MixColumns in the last round. This maintains a structural symmetry that makes the decryption algorithm mirror the encryption algorithm with inverse operations.

### The result

After 10 rounds, the state matrix contains the ciphertext — 16 bytes that bear absolutely no statistical relationship to the original plaintext.

```
Plaintext:   "Hello, AES World"  →  48 65 6c 6c 6f 2c 20 41 45 53 20 57 6f 72 6c 64
Ciphertext:  (after 10 rounds)   →  completely unrecognizable hex bytes
```

Change one bit of the plaintext — say, "Hello" to "Hellp" — and on average 64 of the 128 ciphertext bits flip. This is the **avalanche effect**, and it's what makes AES secure.

---

 🛡️ 08. Why No Computer Can Break AES

Let's be precise about what "can't break AES" means.

### Brute force against AES-128

AES-128 has a 128-bit key. That's 2¹²⁸ possible keys — approximately 3.4 × 10³⁸.

```
2¹²⁸ = 340,282,366,920,938,463,463,374,607,431,768,211,456

That's 340 undecillion keys.
```

Now consider the fastest supercomputer on Earth — Frontier, performing roughly 10¹⁸ operations per second (1 exaflop). Assume each operation checks one key:

```
Time = 2¹²⁸ / 10¹⁸ seconds
     = 3.4 × 10³⁸ / 10¹⁸
     = 3.4 × 10²⁰ seconds
     = ~10.8 trillion years

The universe is 13.8 billion years old.
AES-128 brute force takes ~780× the age of the universe.
```

And that's with a machine that doesn't exist — real key-checking is far slower than one operation per key.

### No mathematical shortcut exists

Brute force isn't the only way to attack a cipher. Mathematicians have tried for over 20 years to find algebraic, statistical, or structural weaknesses in AES. The best known attack against full AES-128 is a **biclique attack** that reduces the search space from 2¹²⁸ to 2¹²⁶·¹. That sounds impressive until you realize:

```
2¹²⁶·¹ is still approximately 8.5 × 10³⁷ operations.
It saves a factor of ~4 compared to brute force.
Still completely infeasible.
```

The design of AES — non-linear S-Box, optimal diffusion via MDS matrix, carefully chosen round constants — closes every known class of attack:

| Attack Type | What it tries | Why it fails against AES |
|---|---|---|
| Linear Cryptanalysis | Find linear approximations between plaintext, ciphertext, and key bits | S-Box non-linearity makes correlations negligibly small after 4+ rounds |
| Differential Cryptanalysis | Track how input differences propagate through the cipher | MDS matrix in MixColumns ensures maximum diffusion; differences spread too fast |
| Algebraic Attacks | Express AES as a system of equations and solve | System has ~8,000 equations in ~1,600 variables with degree-high non-linearity; unsolvable in practice |
| Related-Key Attacks | Exploit relationships between different keys | Key schedule's RotWord + SubWord + Rcon prevents predictable key relationships |
| Side-Channel Attacks | Measure timing, power consumption, EM radiation | Not a flaw in AES math — a flaw in implementation. Mitigated with constant-time code |

AES has survived over two decades of analysis by the world's best cryptographers. No practical attack has ever been found against AES used correctly.

---

## 🏔️ 09. AES-256 — Why Even Quantum Computers Can't Touch It

AES-256 uses a 256-bit key: 2²⁵⁶ possible keys.

```
2²⁵⁶ ≈ 1.16 × 10⁷⁷

For reference, the estimated number of atoms in the observable universe
is approximately 10⁸⁰. The number of AES-256 keys is in the same ballpark.
```

### The quantum threat: Grover's algorithm

Quantum computers can run **Grover's algorithm**, which searches an unsorted database of N items in √N steps instead of N. Applied to AES-256:

```
Classical brute force: 2²⁵⁶ operations
Grover's algorithm:    2²⁵⁶/² = 2¹²⁸ operations
```

Grover's algorithm effectively halves the key length. AES-256 under quantum attack has the security of AES-128 under classical attack — which we already showed requires 780× the age of the universe on the fastest supercomputer.

```
AES-128 post-quantum security: 2⁶⁴   → potentially vulnerable in the far future
AES-256 post-quantum security: 2¹²⁸  → still completely infeasible
```

This is exactly why AES-256 is classified as **quantum-resistant**. NIST's post-quantum cryptography guidelines recommend AES-256 for symmetric encryption — no replacement needed.

### Could a bigger quantum computer help?

Grover's is proven optimal — no quantum algorithm can search faster than √N. Building a bigger quantum computer doesn't change the exponent. Even with a trillion-qubit machine running Grover's at impossible speeds:

```
2¹²⁸ / (10¹⁸ quantum operations/sec)
= 3.4 × 10²⁰ seconds
= ~10.8 trillion years

Same wall. Different computer. Same answer: not happening.
```

### What about Shor's algorithm?

Shor's algorithm devastates **RSA** and **elliptic curve cryptography** by efficiently factoring integers and computing discrete logarithms. But Shor's doesn't apply to AES. AES is a symmetric cipher — there's no mathematical trapdoor like factoring to exploit. Shor's algorithm is irrelevant here.

### The bottom line

```
AES-128: Safe against every classical computer for the foreseeable future.
AES-256: Safe against every classical AND quantum computer for the foreseeable future.
```

Governments classify data with AES-256 at the TOP SECRET level. When the NSA says it's good enough for national secrets, it's good enough.

---

## The Complete Flow

```
"Hello, AES World"
        ↓
   State Matrix (4×4, column-major)
        ↓
   AddRoundKey ← Round 0 Key (original key)
        ↓
   ┌─────────────────────────────────────┐
   │  SubBytes    (confusion)            │
   │  ShiftRows   (begin diffusion)      │  × 9 rounds
   │  MixColumns  (complete diffusion)   │
   │  AddRoundKey (inject round key)     │
   └─────────────────────────────────────┘
        ↓
   SubBytes → ShiftRows → AddRoundKey     (Round 10, no MixColumns)
        ↓
   Ciphertext (16 bytes of apparent randomness)
```

AES isn't magic. It's the disciplined application of substitution, permutation, and modular arithmetic — repeated enough times that the result is indistinguishable from random noise. The math is public. The algorithm is public. The only secret is the key. And that's exactly how good cryptography works.
