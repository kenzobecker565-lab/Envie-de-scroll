"""Bande son du plan « La pile », pensée comme en dessin animé (« mickey-mousing ») :
la musique colle à chaque dessin. Les temps viennent de render_pile.py (SHEET).

Usage : python3 audio_pile.py <sortie.wav>
"""
import sys

import numpy as np

from render_pile import DUR, SHEET, starts
from sfx import SR, Track, tick, bandpass, bell, bird, boing, creak, hz, lowpass, marimba, pluck, plop, pop, rng, rustle, step, swoosh, tok, tt

T = Track(DUR)
add = T.add
at = {}
for i, (n, _) in enumerate(SHEET):
    at.setdefault(n, []).append(float(starts[i]))
t_ = lambda n, k=0: at[n][k]


def piou(f=3400, d=0.14):
    t = tt(d)
    fr = f * (1 - 0.35 * t / d) + 120 * np.sin(2 * np.pi * 40 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.sin(np.pi * t / d) ** 1.5


def stretch(d=0.5, f0=300, f1=700):
    """Effort (étirement) : son qui monte en tremblant."""
    t = tt(d)
    fr = f0 + (f1 - f0) * t / d + 25 * np.sin(2 * np.pi * 9 * t)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(t / 0.03, 1) * np.minimum((d - t) / 0.03, 1) * 0.5


def slide(d, f0, f1):
    """Sifflet à coulisse (chute)."""
    t = tt(d)
    fr = f0 * (f1 / f0) ** (t / d) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.minimum(t / 0.02, 1) * np.minimum((d - t) / 0.03, 1)


def thud(d=0.5):
    t = tt(d)
    return bandpass(rng.standard_normal(len(t)), 50, 450) * np.exp(-t / 0.08) + np.sin(2 * np.pi * (60 + 50 * np.exp(-t / 0.025)) * t) * np.exp(-t / 0.12)


def clank(f=900, d=0.25):
    """Objet creux qui tape le sol (pot, arrosoir, seau)."""
    t = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / dec) for r, a, dec in [(1, 1, 0.06), (2.3, 0.5, 0.03), (3.9, 0.3, 0.02)])
    return s + bandpass(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t / 0.01) * 0.4


def wahwah(notes, t0, each=0.32):
    """« Wah-wah » de trombone comique : dent de scie filtrée qui s'ouvre et se ferme."""
    for k, m in enumerate(notes):
        d = each * (2.2 if k == len(notes) - 1 else 1)
        t = tt(d)
        f = hz(m) * (1 + 0.012 * np.sin(2 * np.pi * (5 if k == len(notes) - 1 else 0) * t))
        ph = np.cumsum(f) / SR
        saw = 2 * (ph % 1) - 1
        cutoff = 300 + 1500 * np.sin(np.pi * np.minimum(t / (d * 0.7), 1)) ** 2
        y = np.zeros_like(saw)
        s = 0.0
        a = 1 - np.exp(-2 * np.pi * cutoff / SR)
        for i in range(len(saw)):
            s += a[i] * (saw[i] - s)
            y[i] = s
        add(y * np.minimum(t / 0.02, 1) * np.minimum((d - t) / 0.06, 1), t0 + k * each, 0.16)


add(lowpass(rng.standard_normal(T.n), 400) * 0.012, 0)  # air du jardin
add(bird(3100), 0.9, 0.022, 0.7)
add(bird(2800), 7.2, 0.02, -0.7)

# 1. le pot — pas, puis le pot posé (fa)
for s in at["A01"] + at["A02"] + at["A03"]:
    add(step(), s, 0.24)
add(pluck(hz(41), 0.5), t_("A01"), 0.12)
add(pluck(hz(48), 0.5), t_("A02"), 0.1)
add(pluck(hz(41), 0.5), t_("A03"), 0.1)
add(tok(), t_("P05_A"), 0.36)
add(pluck(hz(65), 0.8), t_("P05_A"), 0.14)
add(pop(700), t_("A05") + 0.05, 0.1)
add(tick(), t_("A05b"), 0.06)  # petit clignement

# 2. l'arrosoir — effort, posé (la)
add(stretch(0.36, 330, 620), t_("B02"), 0.12)
add(tok(), t_("P05_B"), 0.34, -0.1)
add(pluck(hz(69), 0.8), t_("P05_B"), 0.14)
add(rustle(0.3, 80), t_("B04"), 0.07)
add(boing(560), t_("B04") + 0.08, 0.06, -0.4)
add(piou(3600, 0.1), t_("B04") + 0.18, 0.08, -0.4)

# 3. le seau — gros effort, posé (do)
add(stretch(0.4, 380, 760), t_("C02"), 0.14)
add(tok(), t_("P05_C"), 0.34, -0.1)
add(pluck(hz(72), 0.8), t_("P05_C"), 0.15)
add(piou(3700), t_("C04") + 0.1, 0.1, -0.4)

# 4. il grimpe — une note plus haute à chaque étage
for n, m in zip(["D01", "D01b", "D02", "D02b", "D03", "D03b", "D04", "D04b", "P05_D"], [65, 67, 69, 70, 72, 74, 76, 77, 81]):
    add(marimba(hz(m)), t_(n), 0.12)
    add(rustle(0.1, 90), t_(n), 0.05)
    if n != "P05_D":
        add(tok() * 0.5, t_(n) + 0.03, 0.12)
add(bell(hz(93), 1.0, 0.4), t_("P05_D") + 0.05, 0.06)  # petit éclat de fierté

# 5. ça vacille — grincements de plus en plus aigus, trémolo qui accélère
wob = [t_("E01"), t_("E02"), t_("E03"), t_("E04"), t_("E04b")]
for i, s in enumerate(wob):
    add(creak(0.2, 120 + i * 30), s, 0.2 + i * 0.03, -0.35 if i % 2 else 0.35)
t, gap, k = t_("P05_D") + 0.25, 0.09, 0
while t < t_("P05_E"):
    add(pluck(hz([69, 72][k % 2] + 2 * (t - t_("P05_D"))), 0.12, 0.98), t, 0.05 + 0.04 * (t - t_("P05_D")), 0.2)
    t += gap
    gap = max(0.04, gap * 0.9)
    k += 1
add(piou(4200, 0.1), wob[2], 0.09)
# le sommet du déséquilibre : tout s'arrête, « oh oh »
add(bell(hz(76), 0.5, 0.3), t_("P05_E") + 0.03, 0.08)
add(bell(hz(72), 0.6, 0.3), t_("P05_E") + 0.15, 0.08)

# 6. patatras — sifflet qui descend, impact, rebonds de plus en plus courts, silence
add(swoosh(0.3, 400, 3500), t_("E06"), 0.22)
add(slide(0.24, 1500, 500), t_("E06") + 0.02, 0.12)
impact = t_("F02")
add(thud(), impact, 0.95)
for s, f, g, p in [(0.02, 700, 0.3, -0.6), (0.09, 1100, 0.26, 0.6), (0.15, 900, 0.24, 0.2),
                   (0.29, 700, 0.14, -0.6), (0.36, 1100, 0.12, 0.6), (0.4, 900, 0.1, 0.2),
                   (0.47, 700, 0.06, -0.6), (0.51, 1100, 0.05, 0.6)]:
    add(clank(f), impact + s, g, p)
add(boing(330), t_("P05_F"), 0.22)
add(slide(0.16, 500, 1100), t_("F04"), 0.08)  # l'oisillon remonte
add(plop(), t_("F05"), 0.3)
add(rustle(0.5, 30), t_("F06"), 0.04)
add(tick(False), t_("F06b"), 0.05)  # clignement sonné

# 7. étourdis — il se redresse, « wah-wah », étoiles qui tintent à chaque dessin
add(rustle(0.3, 70), t_("G01"), 0.07)
wahwah([70, 69, 68, 67], t_("P05_G"), 0.3)
for n, m in zip(["P05_G", "G03", "G04"], [88, 91, 93]):
    add(bell(hz(m), 0.7, 0.5), t_(n), 0.05)
for i in range(6):
    add(piou(4300 + (i % 2) * 400, 0.08), t_("P05_G") + 0.1 + i * 0.19, 0.04, np.sin(i * 1.4))

T.write(sys.argv[1])
print("ok", sys.argv[1])
