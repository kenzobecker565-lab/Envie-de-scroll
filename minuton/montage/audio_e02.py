"""Bande son de l'épisode 2 « Le tournesol » (48 s), entièrement synthétisée.

Usage : python3 audio_e02.py <sortie.wav>
"""
import sys

import numpy as np

from sfx import (Track, bass, bell, bird, boing, cello, click, creak, cricket, drop, fall_whistle, hz,
                 lowpass, marimba, pad, pluck, pop, riser, rng, rustle, soil_puff, step, swoosh, tick, tok, wind)

T = Track(48.0)
add = T.add

# Ambiance de jardin : souffle léger et oiseaux le jour
add(lowpass(rng.standard_normal(T.n), 500) * 0.015, 0)
for t in [0.3, 1.9, 4.1, 6.4, 9.6, 12.2, 14.8, 30.4, 33.8, 37.1]:
    add(bird(rng.uniform(2800, 3800)), t, 0.05, pan=rng.uniform(-0.8, 0.8))
    add(bird(rng.uniform(2800, 3800)), t + 0.2, 0.04, pan=rng.uniform(-0.8, 0.8))

# S1 — Tok !
add(fall_whistle(0.8), 0.0, 0.15)
add(tok(), 0.8, 0.5, pan=-0.3)
add(tick(), 1.4, 0.15, pan=-0.1)
add(tick(False), 1.65, 0.1)
add(rustle(0.5, 30), 1.75, 0.06)

# Petite musique de départ (ukulélé), jusqu'à l'attente
UKE = [(0, 65), (0.5, 69), (1.0, 72), (1.5, 69), (2.0, 64), (2.5, 67), (3.0, 72), (3.5, 67)]
for rep in range(6):
    base = 1.0 + rep * 2.0
    for dt, m in UKE[(rep % 2) * 4:(rep % 2) * 4 + 4]:
        add(pluck(hz(m)), base + dt, 0.07, pan=0.2)
    add(bass(hz(41 if rep % 2 == 0 else 36)), base, 0.08)

# S2 — « ooh » au glockenspiel
add(bell(hz(84), 1.2, 0.5), 2.6, 0.08)
add(bell(hz(88), 1.4, 0.5), 2.85, 0.08)

# S3 — Il marche et plante
for i in range(int((7.1 - 5.7) * 8)):
    if i % 4 == 0:
        add(step(), 5.7 + i / 8, 0.25, pan=-0.1 + i * 0.02)
add(soil_puff(), 7.95, 0.3)
add(rustle(0.4, 40), 8.0, 0.08)

# S4 — Arrosage
for k in range(20):
    add(drop(), 9.2 + k * 0.1 + rng.uniform(0, 0.04), 0.05, pan=0.3)
add(lowpass(rng.standard_normal(int(2.0 * 48000)), 2500) * 0.25, 9.2, 0.08, pan=0.3)

# S5 — L'attente : plus de musique, tic-tac de plus en plus présent
t, k = 11.5, 0
while t < 16:
    add(tick(k % 2 == 0), t, 0.06 + 0.1 * (t - 11.5) / 4.5, pan=-0.2)
    t += 0.5
    k += 1
add(cricket(1.2), 13.0, 0.04, pan=0.6)

# S6 — L'idée, puis CLIC
add(bell(1568, 1.8), 16.1, 0.07)
add(bell(2349, 1.4, 0.6), 16.18, 0.06)
add(click(), 17.6, 0.45)

# S7 — Le temps file
t, gap = 17.75, 0.25
while t < 25:
    add(tick(int(t * 100) % 2 == 0), t, 0.1, pan=-0.2)
    t += gap
    gap = max(0.035, gap * 0.93)
add(riser(7.0), 18.0, 0.18)
for i, ts in enumerate([18.8, 19.8, 21.0, 22.3, 23.6]):
    add(pop(500 + i * 120), ts, 0.3, pan=0.2)
for k in range(28):  # arpège rapide qui monte avec la plante
    add(marimba(hz(65 + [0, 4, 7, 12][k % 4] + 12 * (k // 14))), 18.0 + k * 0.25, 0.06, pan=0.3 if k % 2 else -0.3)

# S8 — Stop !
add(click(), 25.0, 0.5)
T.silence(25.06, 25.5)
add(wind(1.2), 25.3, 0.06)

# S9 — Géant
add(cello(hz(36), 3.2), 26.6, 0.07)
add(creak(1.2), 27.0, 0.12)
for i in range(4):
    add(swoosh(0.5, 2000, 6000), 26.8 + i * 0.7, 0.03)

# S10 — Il se penche
add(creak(1.4, 120), 30.3, 0.15)
t, gap = 30.0, 0.45
while t < 32.0:
    add(tick(), t, 0.1)
    t += gap
    gap = max(0.2, gap * 0.85)

# S11 à S13 — Il te suit !
for ts in [32.2, 34.75, 36.4, 37.2, 38.0]:
    add(swoosh(0.35), ts, 0.12, pan=-0.4)
add(boing(330), 33.25, 0.15)
add(boing(440), 35.45, 0.15)
WALKS = [(32.0, 33.2, 8), (34.0, 35.4, 12), (36.0, 36.8, 16), (36.8, 37.6, 16), (37.6, 38.5, 16)]
for t0, t1, fps in WALKS:
    n = int((t1 - t0) * fps)
    for i in range(n):
        if (int(t0 * fps) + i) % 4 == 0:
            add(step(), t0 + i / fps, 0.2)
# musique espiègle : pizzicati à 120 BPM, plus serrée pendant la course
PIZZ = [65, 72, 69, 72, 64, 72, 67, 72]
for i in range(32):
    tb = 32.0 + i * 0.25
    if tb >= 40:
        break
    add(pluck(hz(PIZZ[i % 8]), 0.4, 0.99), tb, 0.08 if tb < 36 else 0.1, pan=-0.25 if i % 2 else 0.25)
    if i % 4 == 0:
        add(bass(hz(41 if (i // 8) % 2 == 0 else 36)), tb, 0.1)
for i, m in enumerate([84, 81, 79, 77, 76, 74, 72]):  # rire au xylophone
    add(marimba(hz(m)), 38.6 + i * 0.09, 0.09)
    add(marimba(hz(m)), 39.3 + i * 0.09, 0.07)

# S14 — Le vrai soleil : accord chaud
add(pad([hz(53), hz(57), hz(60), hz(65)], 2.4), 40.0, 0.18)

# S15 et S16 — Bonne nuit
add(cricket(6.0), 42.0, 0.03, pan=0.5)
add(cricket(5.0), 43.0, 0.025, pan=-0.6)
t = 42.0
while t < 48:
    add(tick(), t, 0.04)
    t += 1.0
LULLABY = [(0, 77), (0.5, 76), (1.0, 74), (1.5, 72), (2.0, 74), (3.0, 72), (3.5, 69), (4.0, 72)]
for dt, m in LULLABY:
    add(bell(hz(m + 12), 1.6, 0.3), 42.4 + dt, 0.06)
add(pad([hz(53), hz(57), hz(60)], 4.5), 42.0, 0.08)
add(fall_whistle(1.5, 1500, 800), 46.5, 0.1)

T.write(sys.argv[1])
print("ok", sys.argv[1])
