"""Bruitages et instruments synthétisés (aucun échantillon externe, aucun droit à gérer)."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
rng = np.random.default_rng(12)


class Track:
    def __init__(self, dur):
        self.n = int(SR * dur)
        self.L = np.zeros(self.n)
        self.R = np.zeros(self.n)

    def add(self, sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= self.n or i < 0:
            return
        sig = sig[: self.n - i] * gain
        self.L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
        self.R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)

    def silence(self, t0, t1, fade=0.01):
        """Coupe tout entre t0 et t1 (pour les arrêts nets)."""
        i0, i1, f = int(t0 * SR), int(t1 * SR), int(fade * SR)
        for ch in (self.L, self.R):
            ch[i0:i0 + f] *= np.linspace(1, 0, f)
            ch[i0 + f:i1] = 0

    def write(self, path, peak=0.9):
        import wave
        mix = np.stack([self.L, self.R], 1)
        mix *= peak / np.max(np.abs(mix))
        f = int(0.004 * SR)
        mix[-f:] *= np.linspace(1, 0, f)[:, None]
        with wave.open(path, "wb") as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes((mix * 32767).astype(np.int16).tobytes())


def tt(d):
    return np.arange(int(d * SR)) / SR


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def env(d, a=0.003, decay=0.1):
    t = tt(d)
    return np.minimum(t / a, 1) * np.exp(-t / decay)


def sweep(f0, f1, d):
    t = tt(d)
    f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


# --- Bruitages -------------------------------------------------------------------
def tick(high=True):
    t = tt(0.05)
    s = np.sin(2 * np.pi * (3200 if high else 2500) * t) * np.exp(-t / 0.006)
    s += bandpass(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.003) * 0.4
    return s


def tok():
    """Choc boisé (graine sur la couronne)."""
    t = tt(0.18)
    s = np.sin(2 * np.pi * 950 * t) * np.exp(-t / 0.03) + 0.5 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.012)
    s += bandpass(rng.standard_normal(len(t)), 1500, 5000) * np.exp(-t / 0.004) * 0.5
    return s


def fall_whistle(d, f0=1800, f1=700):
    return sweep(f0, f1, d) * np.sin(np.pi * tt(d) / d) ** 2 * 0.6


def flip():
    d = 0.16
    t = tt(d)
    return bandpass(rng.standard_normal(len(t)), 1500, 7000) * np.sin(np.pi * t / d) ** 2 * 0.5


def swoosh(d=0.35, lo=500, hi=3000):
    t = tt(d)
    return bandpass(rng.standard_normal(len(t)), lo, hi) * np.sin(np.pi * t / d) ** 3


def rustle(d, density=40):
    t = tt(d)
    s = np.zeros(len(t))
    for _ in range(int(density * d)):
        i = rng.integers(0, max(1, len(t) - 2000))
        s[i:i + 2000] += rng.standard_normal(2000)[: len(s) - i] * np.exp(-np.arange(2000) / 300)[: len(s) - i] * rng.uniform(0.3, 1)
    return bandpass(s, 1800, 9000) * np.sin(np.pi * t / d)


def plop():
    t = tt(0.25)
    f = 220 * np.exp(-t / 0.05) + 90
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.25, 0.002, 0.07)
    s += bandpass(rng.standard_normal(len(t)), 600, 3000) * np.exp(-t / 0.015) * 0.3
    return s


def pop(f=600):
    t = tt(0.12)
    return np.sin(2 * np.pi * np.cumsum(f * 2.2 * np.exp(-t / 0.02) + f) / SR) * env(0.12, 0.001, 0.03)


def boing(f=330):
    t = tt(0.45)
    fr = f + 0.18 * f * np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.15) + 80 * t
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * env(0.45, 0.005, 0.14)


def step():
    t = tt(0.08)
    return lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.015) + 0.5 * np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02)


def soil_puff():
    t = tt(0.3)
    return lowpass(rng.standard_normal(len(t)), 1200) * env(0.3, 0.005, 0.07)


def drop():
    t = tt(0.09)
    return np.sin(2 * np.pi * np.cumsum(1200 + 1500 * t / 0.09) / SR) * env(0.09, 0.002, 0.02)


def click():
    t = tt(0.06)
    s = bandpass(rng.standard_normal(len(t)), 2500, 9000) * np.exp(-t / 0.004)
    s += np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.01) * 0.8
    t2 = tt(0.05)
    s2 = np.sin(2 * np.pi * 1400 * t2) * np.exp(-t2 / 0.008) * 0.6
    return np.concatenate([s, s2])


def creak(d=0.9, f=140):
    t = tt(d)
    fr = f + 25 * np.sin(2 * np.pi * 3 * t) + 40 * t
    pulses = (np.sin(2 * np.pi * np.cumsum(fr) / SR) > 0.95).astype(float)
    return bandpass(pulses, 300, 3000) * np.sin(np.pi * t / d) * 0.8


def bird(f=3200):
    t = tt(0.16)
    fr = f + 900 * np.sin(2 * np.pi * 18 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / 0.16) ** 2


def cricket(d):
    t = tt(d)
    gate = (np.sin(2 * np.pi * 28 * t) > 0.3) * (np.sin(2 * np.pi * 1.6 * t) > -0.2)
    return np.sin(2 * np.pi * 4600 * t) * gate * 0.4


def wind(d):
    t = tt(d)
    return lowpass(rng.standard_normal(len(t)), 900, 3) * np.sin(np.pi * t / d) ** 1.5


def riser(d):
    t = tt(d)
    s = sweep(200, 1400, d) * 0.3 + bandpass(rng.standard_normal(len(t)), 800, 6000) * 0.4
    return s * (t / d) ** 2


# --- Instruments -------------------------------------------------------------------
def bell(freq, d=1.6, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for ratio, amp, dec in [(1, 1, 0.9), (2.76, 0.35 * bright, 0.35), (5.4, 0.18 * bright, 0.18), (8.93, 0.08 * bright, 0.1)]:
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t / (dec * d / 1.6))
    return s * np.minimum(t / 0.002, 1)


def marimba(freq, d=0.6):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.25) + 0.25 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.04)
    return s * np.minimum(t / 0.002, 1)


def pluck(freq, d=0.7, damp=0.996):
    """Corde pincée (Karplus-Strong) : ukulélé ou pizzicato."""
    n = int(d * SR)
    p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = damp * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return lowpass(out, 5000) * np.minimum(tt(d) / 0.002, 1)


def bass(freq, d=0.9):
    t = tt(d)
    return (np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)) * np.minimum(t / 0.01, 1) * np.exp(-t / 0.5)


def pad(freqs, d):
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.001 * t) for f in freqs)
    return lowpass(s, 2500) * np.minimum(t / 0.4, 1) * np.minimum((d - t) / 0.5, 1) / len(freqs)


def cello(freq, d):
    t = tt(d)
    saw = 2 * ((freq * t + 0.1 * np.sin(2 * np.pi * 5 * t) / 5) % 1) - 1
    return lowpass(saw, 900) * np.minimum(t / 0.3, 1) * np.minimum((d - t) / 0.5, 1)
