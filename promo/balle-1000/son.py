"""
Bande-son « ASMR » de la balle : chute et rebonds, traits de coupe, pluie de cubes.
planche, rafales de coupes, tranche qui se retourne, copeaux qui tombent.
Les instants des coupes reprennent la formule de main.js (ROUNDS).

    python son.py sortie.wav
"""

import sys
import wave

import numpy as np

SR = 48000
D = 24.0
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


def bounce(strength=1.0):
    """La balle de tennis qui touche la table : « pok » feutré."""
    n = int(0.25 * SR)
    u = np.arange(n) / SR
    return (np.sin(2 * np.pi * 180 * u * (1 + 0.5 * np.exp(-u * 60))) * env(n, 0.001, 0.05) + bandnoise(n, 500, 2500) * env(n, 0.0005, 0.01) * 0.5) * strength


def zip_(dur=0.12):
    """Un trait de coupe (laser) : petit zip aigu."""
    n = int(dur * SR)
    u = np.arange(n) / SR
    f = 2500 + 3000 * u / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, dur * 0.6) * 0.25 + bandnoise(n, 4000, 9000) * env(n, 0.001, 0.03) * 0.2


u = np.arange(N) / SR
out += 0.006 * np.sin(2 * np.pi * 55 * u) + 0.008 * bandnoise(N, 100, 600)

ROUNDS = [(2, 0.0, (1.0, 1.35), 1.6, 0.6, 4.0, 1), (8, 4.5, (5.4, 6.2), 6.45, 1.0, 9.0, 4), (100, 9.5, (10.3, 11.5), 11.75, 1.8, 14.6, 20), (1000, 15.1, (15.9, 17.6), 17.85, 2.4, None, 63)]
for n, drop, (c0, c1), fall, fdur, leave, lines in ROUNDS:
    # Chute et rebonds.
    add(drop + 0.35, bounce(1.0))
    for k, s in enumerate([0.45, 0.2, 0.08]):
        add(drop + 0.35 + 0.35 * (k + 1) * 0.9 ** k, bounce(s))
    # Traits de coupe.
    for k in range(lines):
        add(c0 + (c1 - c0) * k / max(1, lines), zip_(0.12 if lines < 10 else 0.05), 1.0 if lines < 10 else 0.5)
    # Les morceaux qui tombent et s'empilent.
    if n <= 8:
        for k in range(n):
            add(fall + fdur * k / n + 0.3, bounce(0.5 + 0.1 * (k % 2)))
    else:
        for k in range(n):
            add(fall + fdur * (k / n) + 0.15 + rng.random() * 0.1, tick(0.5 if n == 100 else 0.25))
    if leave:
        add(leave, whoosh(0.5), 0.8)
add(20.8, ding(1320), 0.8)
add(21.3, ding(1760, 0.6), 0.6)
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
