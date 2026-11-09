"""
Bande-son « ASMR » du gigot manga : croûte qui craque, lame qui touche la
planche, rafales de coupes, tranche qui se retourne, copeaux qui tombent.
Les instants des coupes reprennent la formule de main.js (ROUNDS).

    python son.py sortie.wav
"""

import sys
import wave

import numpy as np

SR = 48000
D = 21.5
N = int(SR * D)
rng = np.random.default_rng(5)
out = np.zeros(N)


def add(t0, sig, gain=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    j = min(N, i + len(sig))
    out[i:j] += gain * sig[: j - i]


def env(n, a, d):
    u = np.arange(n) / SR
    return np.minimum(1, u / max(a, 1e-4)) * np.exp(-u / d)


def bandnoise(n, lo, hi):
    x = rng.standard_normal(n)
    f = np.fft.rfft(x)
    fr = np.fft.rfftfreq(n, 1 / SR)
    f[(fr < lo) | (fr > hi)] = 0
    y = np.fft.irfft(f, n)
    return y / (np.abs(y).max() + 1e-9)


def crunch(strength=1.0):
    """Croûte qui craque + chair + lame qui tape la planche."""
    n = int(0.22 * SR)
    crackle = bandnoise(n, 2500, 9000) * env(n, 0.002, 0.03)
    # quelques micro-craquements
    for _ in range(6):
        k = rng.integers(0, n // 3)
        crackle[k : k + 120] += rng.standard_normal(min(120, n - k)) * 0.8
    flesh = bandnoise(n, 300, 1500) * env(n, 0.01, 0.06) * 0.6
    u = np.arange(n) / SR
    thud = np.sin(2 * np.pi * 140 * u * (1 + 0.6 * np.exp(-u * 40))) * env(n, 0.001, 0.05)
    board = np.zeros(n)
    k = int(0.07 * SR)
    board[k:] = (bandnoise(n - k, 800, 3000) * env(n - k, 0.0005, 0.012) + thud[: n - k]) * 0.9
    return (crackle * 0.7 + flesh + board) * strength


def tick(strength=1.0):
    n = int(0.05 * SR)
    return (bandnoise(n, 1500, 8000) * env(n, 0.0005, 0.008) + bandnoise(n, 200, 900) * env(n, 0.001, 0.015) * 0.5) * strength


def whoosh(dur=0.5, lo=300, hi=3000):
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    return bandnoise(n, lo, hi) * np.sin(np.pi * u) ** 2 * 0.5


def ding(f=1760, dur=1.2):
    n = int(dur * SR)
    u = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * u) + 0.4 * np.sin(2 * np.pi * f * 2.01 * u)) * env(n, 0.002, 0.35) * 0.3


def times(n, t0, t1, p):
    return [t0 + (t1 - t0) * ((k / (n - 1)) ** p) for k in range(n)]


# Ambiance de cuisine très légère (ronronnement + air).
u = np.arange(N) / SR
out += 0.006 * np.sin(2 * np.pi * 55 * u) + 0.01 * bandnoise(N, 100, 600)

# Manche 1.
for t in times(10, 0.8, 3.5, 1):
    add(t - 0.02, crunch(1.0))
add(3.65, whoosh(0.45, 600, 2500), 0.6)
add(4.3, whoosh(0.5, 1500, 6000), 0.5)
add(4.8, ding(1320), 0.8)
# Manche 2.
add(5.8, whoosh(0.5), 0.9)
for t in times(100, 6.4, 9.4, 0.85):
    add(t - 0.01, crunch(0.35))
for k in range(100):
    add(9.9 + k * 0.012, tick(0.25))
add(11.4, whoosh(0.5), 0.9)
# Manche 3.
for t in times(1000, 12.0, 16.0, 0.7):
    add(t, tick(0.32))
# Effondrement : pluie de copeaux.
n = int(1.6 * SR)
rain = np.zeros(n)
for _ in range(900):
    k = rng.integers(0, n - 3000)
    rain[k : k + 2400] += tick(0.12)[:2400] if len(tick()) >= 2400 else 0
add(16.2, rain)
add(18.0, ding(1760), 1.0)
add(18.35, ding(2349), 0.8)
add(19.3, ding(1046, 0.6), 0.6)

out = np.tanh(out * 1.3)
out /= np.abs(out).max() + 1e-9
out *= 0.9
fade = np.minimum(1, (D - u) / 0.4)
out *= fade
pcm = (np.stack([out, out], 1) * 32767).astype("<i2")
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
