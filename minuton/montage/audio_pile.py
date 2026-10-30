"""Bande son du plan test « La pile » (9 s), calée sur chaque dessin.

Usage : python3 audio_pile.py <sortie.wav>
"""
import sys

import numpy as np

from sfx import SR, Track, bandpass, bell, bird, boing, creak, fall_whistle, hz, lowpass, pluck, plop, pop, rng, rustle, step, swoosh, tok, tt

T = Track(9.0)
add = T.add


def piou(f=3400, d=0.14):
    t = tt(d)
    fr = f * (1 - 0.35 * t / d) + 120 * np.sin(2 * np.pi * 40 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / d) ** 1.5


def stretch(d=0.5, f0=300, f1=700):
    t = tt(d)
    fr = f0 + (f1 - f0) * t / d + 25 * np.sin(2 * np.pi * 9 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.03, 1) * 0.6


def thud(d=0.45):
    t = tt(d)
    return bandpass(rng.standard_normal(len(t)), 60, 500) * np.exp(-t / 0.07) + 0.8 * np.sin(2 * np.pi * (70 + 40 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.1)


add(lowpass(rng.standard_normal(T.n), 400) * 0.012, 0)  # air du jardin
add(bird(3100), 0.6, 0.025, 0.7)

# musique : pizzicati qui accélèrent jusqu'à la chute
notes = [65, 69, 72, 69, 62, 65, 69, 65]
t, k, gap = 0.0, 0, 0.3
while t < 6.45:
    add(pluck(hz(notes[k % 8]), 0.35, 0.985), t, 0.1, -0.25 if k % 2 else 0.25)
    t += gap
    gap = max(0.15, gap * 0.985)
    k += 1

# le pot
for s in (0.0, 0.17, 0.34):
    add(step(), s, 0.22)
add(tok(), 0.52, 0.35)
add(pop(700), 0.9, 0.12)
# l'arrosoir
add(stretch(0.35, 350, 600), 1.5, 0.08)
add(tok(), 1.82, 0.32, -0.1)
add(rustle(0.35, 70), 2.17, 0.08)
add(boing(560), 2.25, 0.06, -0.4)
# le seau
add(stretch(0.4, 380, 720), 2.8, 0.1)
add(tok(), 3.12, 0.3, -0.1)
add(piou(3600), 3.5, 0.1, -0.4)
# il grimpe
add(piou(3900, 0.1), 3.95, 0.1)
for s in (4.1, 4.3, 4.5):
    add(tok() * 0.7, s, 0.2)
    add(rustle(0.12, 80), s, 0.05)
# ça vacille
for i, s in enumerate((4.75, 5.1, 5.28, 5.45, 5.63, 5.81)):
    add(creak(0.25, 130 + (i % 2) * 40), s, 0.18 + i * 0.02, -0.3 if i % 2 else 0.3)
add(piou(4200, 0.1), 5.5, 0.1)
add(stretch(0.3, 900, 500), 5.85, 0.08)
# patatras
add(swoosh(0.4, 400, 3500), 6.18, 0.25)
add(fall_whistle(0.32, 1600, 500), 6.2, 0.18)
add(thud(), 6.52, 0.9)
for s, p in ((6.56, -0.6), (6.63, 0.6), (6.71, 0.2), (6.86, -0.4)):
    add(tok(), s, 0.25, p)
add(boing(330), 6.66, 0.22)
add(boing(420), 6.9, 0.14)
add(plop(), 7.05, 0.3)
add(rustle(0.4, 40), 7.2, 0.05)
# étourdis
for i in range(7):
    add(piou(4300 + (i % 2) * 400, 0.09), 7.7 + i * 0.18, 0.05, np.sin(i * 1.3))
for i, s in enumerate((7.95, 8.3, 8.65)):
    add(bell(hz(88 + i * 2), 0.8, 0.4), s, 0.05)
for i, m in enumerate([77, 76, 74, 73]):  # petite mélodie qui « tangue »
    add(bell(hz(m), 0.9, 0.3), 7.75 + i * 0.3, 0.06)

T.write(sys.argv[1])
print("ok", sys.argv[1])
