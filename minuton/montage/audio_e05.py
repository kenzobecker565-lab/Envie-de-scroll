"""Bande son de l'épisode 5 « Le petit oiseau » (52 s), entièrement synthétisée.

Usage : python3 audio_e05.py <sortie.wav>
"""
import sys

import numpy as np

from sfx import (SR, Track, bandpass, bass, bell, bird, boing, creak, fall_whistle, hz, lowpass, marimba, pad, pluck,
                 plop, pop, riser, rng, rustle, step, swoosh, tok, tt, wind)

T = Track(52.0)
add = T.add


def piou(f=3400, d=0.14):
    """Pépiement d'oisillon : petite glissade aiguë vers le bas."""
    t = tt(d)
    fr = f * (1 - 0.35 * t / d) + 120 * np.sin(2 * np.pi * 40 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / d) ** 1.5


def flutter(d, rate=22):
    """Battements d'ailes : souffles rapides."""
    t = tt(d)
    n = bandpass(rng.standard_normal(len(t)), 600, 4000)
    return n * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t)) ** 3 * np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.08, 1)


def stretch(d=1.0):
    """Étirement comique : son qui monte en tremblant."""
    t = tt(d)
    fr = 300 + 500 * t / d + 25 * np.sin(2 * np.pi * 9 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(t / 0.05, 1) * np.minimum((d - t) / 0.05, 1) * 0.6


def melody(notes, t0, beat, inst="bell", gain=0.08, pan=0.1):
    for bt, m, dur in notes:
        if inst == "bell":
            s = bell(hz(m), 1.2 * dur, 0.4)
        elif inst == "marimba":
            s = marimba(hz(m))
        else:
            s = pluck(hz(m), 0.8)
        add(s, t0 + bt * beat, gain, pan)


# --- Ambiance de jardin (oiseaux au loin, vent léger)
add(lowpass(rng.standard_normal(T.n), 400) * 0.012, 0)
for t in [0.4, 4.8, 9.3, 14.2, 19.8, 25.5, 29.9, 35.2, 40.4]:
    add(bird(2900 + rng.uniform(0, 800)), t, 0.03, pan=rng.uniform(-0.8, 0.8))

# --- P1 : il dessine, l'oisillon tombe (0 – 3)
CH = [(41, [65, 69, 72]), (36, [64, 67, 72])]
for k in range(4):
    b, tri = CH[k % 2]
    t0 = 0.15 + k * 0.5
    add(pluck(hz(tri[k % 3] + 12), 0.8), t0, 0.08, 0.2)
add(bass(hz(41)), 0.15, 0.12)
for t in np.arange(0.3, 1.9, 0.27):
    add(rustle(0.18, 60), t, 0.05, pan=-0.2)  # crayon
add(fall_whistle(1.9, 2400, 900), 0.1, 0.08, pan=-0.5)
add(flutter(1.8, 26), 0.1, 0.05, pan=-0.5)
add(plop(), 2.02, 0.4)
add(rustle(0.6, 50), 2.05, 0.12)
add(piou(3600), 2.25, 0.12, pan=-0.3)

# --- P2 : sonné, il secoue la tête, il appelle (3 – 7)
for i, f in enumerate([2093, 2349, 2637]):
    add(bell(f, 0.7, 0.3), 3.1 + i * 0.25, 0.05)  # petites étoiles
add(rustle(0.4, 80), 4.4, 0.1)
add(boing(520), 4.45, 0.06)
for i, t in enumerate([5.8, 6.05, 6.45]):
    add(piou(3800 - i * 200), t, 0.16, pan=-0.1)
add(pad([hz(62), hz(65), hz(69)], 4.0), 3.0, 0.05)

# --- P3 : si haut ! (7 – 10)
add(wind(3.0), 7.0, 0.08)
add(riser(1.4) * 0.5, 7.0, 0.08)
for i, m in enumerate([77, 81, 84, 89]):
    add(bell(hz(m), 1.2, 0.3), 7.0 + i * 0.3, 0.06, 0.2)
add(piou(3300), 9.2, 0.1)

# --- P4 : sur la pointe des pieds (10 – 15)
PIZZ = [65, 69, 72, 69, 65, 72, 69, 72]
for i in range(16):
    add(pluck(hz(PIZZ[i % 8]), 0.35, 0.985), 10.0 + i * 0.3, 0.11, -0.25 if i % 2 else 0.25)
add(stretch(1.1), 11.4, 0.1)
add(stretch(1.0), 12.6, 0.12)
add(plop(), 13.8, 0.3)
add(pluck(hz(60), 0.6), 14.0, 0.1)
add(pluck(hz(55), 0.9), 14.3, 0.1)  # « oh non » descendant

# --- P5 : la pile (15 – 24)
for i in range(29):
    add(pluck(hz([62, 65, 69, 65][i % 4] + (12 if i % 8 == 7 else 0)), 0.3, 0.985), 15.0 + i * 0.25, 0.11, -0.3 if i % 2 else 0.3)
for t in [15.2, 16.5, 17.8]:
    add(tok(), t, 0.3)
    add(step(), t - 0.3, 0.15)
add(creak(1.3, 150), 18.9, 0.16)
add(creak(1.2, 120), 20.2, 0.2)
add(swoosh(0.5, 300, 2500), 21.0, 0.15)
add(bandpass(rng.standard_normal(int(0.4 * SR)), 80, 600) * np.exp(-tt(0.4) / 0.08), 21.45, 0.6)  # chute dans l'herbe
add(tok(), 21.55, 0.25, -0.5)
add(tok(), 21.7, 0.2, 0.5)
add(tok(), 21.9, 0.18, 0.2)
add(boing(300), 21.6, 0.2)
for i in range(6):  # petits oiseaux qui tournent (étourdi)
    add(piou(4200 + (i % 2) * 300, 0.1), 22.75 + i * 0.2, 0.05, pan=np.sin(i))

# --- P6 : le chagrin puis l'idée (24 – 28)
SAD = [(0, 74, 1), (1, 72, 1), (2, 69, 2), (4, 70, 1), (5, 69, 1), (6, 65, 2)]
melody(SAD, 24.0, 0.33, "bell", 0.08)
add(pad([hz(50), hz(57), hz(62)], 2.8), 24.0, 0.07)
add(piou(2600, 0.25), 24.3, 0.08)
add(bell(1568, 1.8), 26.7, 0.14)
add(bell(2349, 1.4, 0.6), 26.78, 0.07)

# --- P7 : la leçon de vol (28 – 36)
beat = 60 / 128
for i in range(16):
    t0 = 28.0 + i * beat * 2
    if t0 >= 36:
        break
    add(bass(hz(41 if (i // 2) % 2 == 0 else 36)), t0, 0.1)
    for j, m in enumerate([65, 69, 72, 69]):
        add(marimba(hz(m + 12)), t0 + j * beat / 2, 0.05, -0.3 if j % 2 else 0.3)
add(flutter(1.4, 9), 28.1, 0.12)          # Minuton bat des bras
add(flutter(1.2, 28), 29.7, 0.1, pan=-0.3)  # l'oisillon bat des ailes
add(piou(3600), 29.9, 0.12, pan=-0.3)
add(plop(), 31.25, 0.3, pan=-0.3)
for i, m in enumerate([84, 81, 79, 77, 76, 74]):  # rire au xylophone
    add(marimba(hz(m)), 31.35 + i * 0.08, 0.08)
for t in np.arange(32.85, 34.4, 0.19):
    add(step(), t, 0.18)
add(piou(3900), 33.3, 0.12)
add(swoosh(0.6, 800, 5000), 34.5, 0.22)
add(pop(800), 34.55, 0.15)

# --- P8 : il vole ! (36 – 41)
add(flutter(2.6, 24), 36.0, 0.14, pan=-0.2)
add(riser(2.4), 36.0, 0.12)
add(piou(3500), 37.4, 0.12)
add(rustle(0.4, 60), 38.55, 0.1)
add(piou(4200, 0.2), 38.65, 0.2)
for i, m in enumerate([77, 81, 84, 89]):
    add(bell(hz(m), 1.0, 0.4), 38.6 + i * 0.07, 0.08)
for i in range(3):
    add(boing(440 + i * 60), 39.8 + i * 0.38, 0.08)
JOY = [(0, 81, 1), (1, 84, 1), (2, 89, 2)]
melody(JOY, 39.8, 0.2, "marimba", 0.09)

# --- P9 : maman ! (41 – 45)
add(flutter(0.6, 18), 40.95, 0.08)
for i in range(4):
    add(piou(3000, 0.18), 41.3 + i * 0.45, 0.08, -0.2)
    add(piou(3900, 0.12), 41.5 + i * 0.45, 0.08, 0.2)
TENDER = [(0, 72, 2), (2, 76, 2), (4, 77, 2), (6, 81, 4)]
melody(TENDER, 41.0, 0.45, "bell", 0.07)
add(pad([hz(53), hz(57), hz(60), hz(65)], 4.2), 41.0, 0.09)

# --- P10 : la plume (45 – 49)
add(swoosh(0.7, 300, 3000), 44.8, 0.12)  # passage doré
add(flutter(1.3, 20), 45.0, 0.1, 0.3)
for i, m in enumerate([84, 88, 91, 96]):
    add(bell(hz(m), 1.5, 0.4), 46.6 + i * 0.07, 0.07)
SUN = [(0, 41), (4, 36), (8, 38)]
for bt, b in SUN:
    add(bass(hz(b), 1.4), 45.0 + bt * 0.33, 0.1)
for i in range(12):
    add(pluck(hz([65, 69, 72, 77][i % 4]), 1.0, 0.996), 45.0 + i * 0.33, 0.09, 0.2)

# --- P11 : à mon tour ! (49 – 52)
add(flutter(1.0, 9), 49.2, 0.1)
add(boing(500), 49.9, 0.1)
for i, m in enumerate([84, 81, 79, 84]):
    add(marimba(hz(m)), 50.1 + i * 0.09, 0.07)
add(piou(3600), 50.6, 0.08, -0.4)
add(piou(3000), 50.8, 0.08, -0.4)
add(pad([hz(53), hz(57), hz(60), hz(65)], 1.4), 50.4, 0.12)
for f in [hz(77), hz(81), hz(84)]:
    add(bell(f, 1.6, 0.5), 50.45, 0.06)

T.write(sys.argv[1])
print("ok", sys.argv[1])
