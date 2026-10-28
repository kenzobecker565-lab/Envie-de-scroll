"""Bande son de « Le cœur en papier » : musique et bruitages 100 % synthétisés.

Aucun sample externe : tout est généré ici, donc aucun droit à gérer.
Usage : python3 audio.py <sortie.wav>
"""
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR, DUR = 48000, 30.0
N = int(SR * DUR)
rng = np.random.default_rng(12)
L = np.zeros(N)
R = np.zeros(N)


def add(sig, t, gain=1.0, pan=0.0):
    """Ajoute un son mono à l'instant t (s), pan de -1 (gauche) à 1 (droite)."""
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2)
    R[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2)


def tt(d):
    return np.arange(int(d * SR)) / SR


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lowpass(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def env(d, a=0.003, decay=0.1):
    t = tt(d)
    return np.minimum(t / a, 1) * np.exp(-t / decay)


# --- Bruitages ----------------------------------------------------------------
def tick(high=True):
    t = tt(0.05)
    f = 3200 if high else 2500
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006)
    s += bandpass(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.003) * 0.4
    return s


def tick_question():
    t = tt(0.12)
    f = 2600 + 1400 * t / 0.12  # petit glissando montant : « tic ? »
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.03)


def flip():
    d = 0.16
    t = tt(d)
    n = bandpass(rng.standard_normal(len(t)), 1500, 7000)
    e = np.sin(np.pi * t / d) ** 2
    return n * e * 0.5


def wind(d):
    t = tt(d)
    n = lowpass(rng.standard_normal(len(t)), 900, 3)
    swell = np.sin(np.pi * t / d) ** 1.5 * (1 + 0.3 * np.sin(2 * np.pi * 0.9 * t))
    return n * swell


def rustle(d, density=40):
    t = tt(d)
    s = np.zeros(len(t))
    for _ in range(int(density * d)):
        i = rng.integers(0, len(t) - 2000)
        g = rng.uniform(0.3, 1)
        s[i:i + 2000] += rng.standard_normal(2000) * np.exp(-np.arange(2000) / 300) * g
    return bandpass(s, 1800, 9000) * np.sin(np.pi * t / d)


def plop():
    t = tt(0.25)
    f = 220 * np.exp(-t / 0.05) + 90
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.25, 0.002, 0.07)
    s += bandpass(rng.standard_normal(len(t)), 600, 3000) * np.exp(-t / 0.015) * 0.3
    return s


def boing():
    t = tt(0.45)
    f = 330 + 60 * np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.15) + 80 * t
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.45, 0.005, 0.14)


def bell(freq, d=1.6, bright=1.0):
    t = tt(d)
    s = np.zeros(len(t))
    for ratio, amp, dec in [(1, 1, 0.9), (2.76, 0.35 * bright, 0.35), (5.4, 0.18 * bright, 0.18), (8.93, 0.08 * bright, 0.1)]:
        s += amp * np.sin(2 * np.pi * freq * ratio * t) * np.exp(-t / (dec * d / 1.6))
    return s * np.minimum(t / 0.002, 1)


def scritch(d):
    t = tt(d)
    n = bandpass(rng.standard_normal(len(t)), 2500, 9000)
    grain = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * t))
    return n * grain * np.sin(np.pi * t / d) ** 0.5


def bip_off():
    t = tt(0.3)
    f = 880 - 500 * t / 0.3
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.3, 0.005, 0.12)


def tear():
    t = tt(0.22)
    s = np.zeros(len(t))
    for _ in range(25):
        i = rng.integers(0, len(t) - 600)
        s[i:i + 600] += rng.standard_normal(600) * np.exp(-np.arange(600) / 120)
    return bandpass(s, 1200, 7000) * np.sin(np.pi * t / 0.22)


# Ambiance de chambre très douce
add(lowpass(rng.standard_normal(N), 400) * 0.02, 0)

# Tic-tac de Minuton : régulier, ralentit en s'endormant, s'arrête sous la feuille
k = 0
t = 0.0
while t < 9.0:
    add(tick(k % 2 == 0), t, 0.16 if t < 6 else 0.12, pan=0.2)
    gap = 0.5 if t < 4 else 0.5 + 0.35 * min((t - 4) / 2, 1)
    t += gap
    k += 1
add(tick_question(), 9.6, 0.18, pan=0.1)
t = 10.2
while t < 28.0:  # reprend, discret sous la musique
    add(tick(k % 2 == 0), t, 0.10 if t < 14 else 0.06, pan=0.2)
    t += 0.5
    k += 1
t = 28.0
while t < 30.0:  # tic-tac joyeux final, calé sur le tempo
    add(tick(k % 2 == 0), t, 0.17, pan=0.2)
    t += 0.25
    k += 1

# Défilement des cartes
for ft in [0.15, 0.65, 1.15, 1.65]:
    add(flip(), ft, 0.5, pan=-0.4)
for ft in [2.3, 3.1, 4.0, 5.1]:
    add(flip(), ft, 0.18, pan=-0.3)

# Courant d'air et feuille qui s'envole
add(wind(3.6), 5.7, 0.22, pan=0.5)
add(rustle(3.0, 25), 6.0, 0.16, pan=0.1)
add(plop(), 9.0, 0.55)
add(rustle(1.0, 60), 11.0, 0.2)
add(boing(), 12.05, 0.2)

# L'idée
add(bell(1568, 2.0), 14.05, 0.15)
add(bell(2349, 1.6, 0.6), 14.12, 0.1)

# Dessin : traits du crayon, puis coloriage plus dense
for st in np.arange(16.15, 18.9, 0.33):
    add(scritch(0.22), st, 0.12, pan=-0.15)
for st in np.arange(19.05, 21.8, 0.2):
    add(scritch(0.16), st, 0.1, pan=-0.15)
add(bip_off(), 19.0, 0.12, pan=-0.5)
add(plop() * 0.5, 21.9, 0.25, pan=0.4)  # crayon reposé dans le pot

# Pliage et déchirure
add(rustle(0.4, 40), 22.0, 0.22)
for st in [22.75, 23.1, 23.55, 23.9]:
    add(tear(), st, 0.28)

# Le cœur offert : petit carillon
for i, f in enumerate([1047, 1319, 1568, 2093]):
    add(bell(f, 1.8, 0.5), 25.0 + i * 0.09, 0.1)

# --- Musique (120 BPM, fa majeur, démarre à l'idée, coupée net à 30 s) --------
BPM, START = 120, 14.0
beat = 60 / BPM
def hz(m):
    return 440 * 2 ** ((m - 69) / 12)


def marimba(freq, d=0.6):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.25)
    s += 0.25 * np.sin(2 * np.pi * freq * 4 * t) * np.exp(-t / 0.04)
    return s * np.minimum(t / 0.002, 1)


def bass(freq, d=0.9):
    t = tt(d)
    s = np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(4 * np.pi * freq * t)
    return s * np.minimum(t / 0.01, 1) * np.exp(-t / 0.5)


CHORDS = [  # (basse, triade) en notes MIDI
    (41, [65, 69, 72]),  # Fa
    (36, [64, 67, 72]),  # Do
    (38, [62, 65, 69]),  # Rém
    (34, [62, 65, 70]),  # Sib
    (41, [65, 69, 72]),
    (36, [64, 67, 72]),
    (34, [62, 65, 70]),
    (36, [64, 67, 72]),
]
ARP = [0, 1, 2, 1, 0, 2, 1, 2]
for bar, (b, tri) in enumerate(CHORDS):
    t0 = START + bar * 4 * beat
    add(bass(hz(b)), t0, 0.12)
    add(bass(hz(b + 7)), t0 + 2 * beat, 0.08)
    for j, a in enumerate(ARP):
        add(marimba(hz(tri[a])), t0 + j * beat / 2, 0.05 if bar < 2 else 0.065,
            pan=-0.3 if j % 2 else 0.3)

# Mélodie au glockenspiel à partir du dessin, sommet sur le cœur offert (25-28 s)
MELODY = [  # (temps en battements depuis START, note MIDI, durée)
    (8, 81, 1), (9, 79, 1), (10, 77, 2),
    (12, 76, 1), (13, 77, 1), (14, 79, 2),
    (16, 81, 1), (17, 84, 1), (18, 81, 2),
    (20, 79, 1), (21, 77, 1), (22, 79, 2),
    (24, 81, 0.5), (24.5, 84, 0.5), (25, 89, 2),  # 26,0 s : la note la plus haute
    (28, 88, 1), (29, 84, 1), (30, 86, 2),
]
for bt, m, d in MELODY:
    add(bell(hz(m), 1.2, 0.4), START + bt * beat, 0.055, pan=0.15)

# --- Mixage --------------------------------------------------------------------
mix = np.stack([L, R], 1)
mix *= 0.9 / np.max(np.abs(mix))
fade = int(0.004 * SR)  # micro-fondu de 4 ms pour éviter le clic de coupe
mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
pcm = (mix * 32767).astype(np.int16)
with wave.open(sys.argv[1], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", sys.argv[1])
