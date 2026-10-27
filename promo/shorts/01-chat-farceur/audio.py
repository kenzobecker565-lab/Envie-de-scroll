# Son du short : la musique complète (Kevin MacLeod, CC-BY 4.0) avec ses variations de volume,
# et des bruitages doux synthétisés, calés sur les évènements de l'image.
# Usage : python3 audio.py <musique.mp3 décodée en f32 48 kHz stéréo (.raw)> <sortie.wav>
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
BEAT = 0.41796
DUREE = 48 * BEAT  # 20,06 s
N = int(DUREE * SR) + SR // 2
rng = np.random.default_rng(7)
SC = {}
t = 0.0
for nom, n in [('s1', 4), ('s2', 3), ('s3', 6), ('s4', 4), ('s5', 6), ('s6', 4), ('s7', 6), ('s8', 3), ('s9', 3), ('s10', 9)]:
    SC[nom] = t; t += n * BEAT

sfx = np.zeros((N, 2), np.float32)

def place(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N: return
    sig = sig[: N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    sfx[i:i + len(sig), 0] += sig * gain * l * 1.414
    sfx[i:i + len(sig), 1] += sig * gain * r * 1.414

def env(n, a=0.005, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def bande(x, lo, hi, ordre=2):
    return sosfilt(butter(ordre, [lo, hi], btype='band', fs=SR, output='sos'), x)

def pas():  # petit pas feutré sur le papier
    n = int(0.06 * SR); t = np.arange(n) / SR
    f = 230 * np.exp(-t * 18)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.018)
    s += bande(rng.normal(0, 1, n), 1500, 5000) * env(n, 0.001, 0.008) * 0.25
    return s

def souffle(dur, lo0, lo1):  # « fffiou » du chat qui passe
    n = int(dur * SR); x = rng.normal(0, 1, n)
    out = np.zeros(n); bloc = 1024
    for k in range(0, n, bloc):
        u = k / n; c = lo0 + (lo1 - lo0) * u
        out[k:k + bloc] = bande(x[k:k + bloc], c, c * 2.2)
    return out * np.sin(np.pi * np.arange(n) / n) ** 2

def cloche(f, dur=1.2, dec=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.15 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 10))
    return s * env(n, 0.003, dec)

def pince(f, dur=0.6):  # pizzicato (Karplus-Strong)
    n = int(dur * SR); p = int(SR / f)
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.994
    return out * env(n, 0.001, 0.25)

def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    f = 520 + 900 * t / 0.12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.045)

def boop(f0=360, f1=250, dur=0.16):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.06)

def boing():
    n = int(0.55 * SR); t = np.arange(n) / SR
    f = 170 + 60 * np.exp(-t * 5) * np.sin(2 * np.pi * 14 * t) + 90 * np.exp(-t * 9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.2)

def griffonne(dur):  # crayon qui gratte : traits courts et irréguliers
    n = int(dur * SR); x = bande(rng.normal(0, 1, n), 2200, 7000)
    a = np.zeros(n); i = 0
    while i < n:
        L = int(rng.uniform(0.06, 0.16) * SR); g = int(rng.uniform(0.01, 0.05) * SR)
        seg = np.sin(np.pi * np.arange(min(L, n - i)) / L) ** 0.7 * rng.uniform(0.6, 1.0)
        a[i:i + len(seg)] = seg; i += L + g
    return x * a

def scintille(base=2093.0):
    s = np.zeros(int(0.8 * SR))
    for k, m in enumerate((1, 1.26, 1.5, 2)):
        c = cloche(base * m, 0.6, 0.12); i = int(k * 0.055 * SR)
        s[i:i + len(c)] += c[: len(s) - i] * (0.8 - 0.12 * k)
    return s

def respire(dur=0.6):
    n = int(dur * SR)
    return bande(rng.normal(0, 1, n), 300, 1200) * np.sin(np.pi * np.arange(n) / n) ** 2

# ——— calage sur l'image ———
# s1 : le chat traverse (foulée 0,2 s), passage de gauche à droite
place(souffle(1.5, 500, 1400), SC['s1'] + 0.05, 0.10, 0.0)
for k in range(8): place(pas(), SC['s1'] + k * 0.2, 0.2, -0.6 + k * 0.17)
# s2 : surprise
place(pop(), SC['s2'] + 0.02, 0.32)
place(pince(784), SC['s2'] + 0.05, 0.16); place(pince(1047), SC['s2'] + 0.16, 0.14)
# s3 : aller à toute vitesse, demi-tour, retour qui ralentit, arrêt
place(souffle(1.0, 600, 1500), SC['s3'], 0.09, 0.0)
tt = 0.0
while tt < 2.15:
    per = 0.19 if tt < 1.05 else (0.22 if tt < 1.25 else 0.2 + 0.22 * min(1, (tt - 1.25) / 0.9))
    place(pas(), SC['s3'] + tt, 0.18 * (1 - 0.5 * max(0, tt - 1.5)), 0.4 - 0.3 * (tt < 1.05))
    tt += per
place(respire(0.5), SC['s3'] + 2.2, 0.05)
# s4 : bâillement doux puis idée
place(boop(300, 210, 0.45), SC['s4'] + 0.1, 0.10)
place(cloche(1568, 1.4, 0.4), SC['s4'] + 0.95, 0.13); place(scintille(2637), SC['s4'] + 1.0, 0.09)
# s5 : le crayon dessine le panier, puis « ta-da »
place(griffonne(1.75), SC['s5'] + 0.12, 0.12, 0.15)
place(scintille(2093), SC['s5'] + 1.9, 0.12)
# s6 : le chat saute dans le panier
place(boop(380, 260), SC['s6'] + 0.45, 0.22); place(boop(300, 230, 0.2), SC['s6'] + 0.75, 0.14)
# s7 : il s'endort, un léger souffle par Z
for i in range(5): place(respire(0.7), SC['s7'] + 0.15 + i * 0.5, 0.035)
place(cloche(784, 1.6, 0.6), SC['s7'] + 0.05, 0.07)
# s8 : sur la pointe des pieds (pizzicati qui montent, sur les temps)
for i, f in enumerate((659, 784, 988)): place(pince(f, 0.5), SC['s8'] + i * BEAT, 0.24)
# s9 : la patte attrape le crayon
place(pince(1319, 0.4), SC['s9'], 0.2); place(boing(), SC['s9'] + 0.1, 0.2)
place(cloche(3136, 0.5, 0.1), SC['s9'] + 0.13, 0.08)
# s10 : rires et cœurs
notes = (1047, 1175, 1319, 1568, 1760, 2093)
for i in range(6): place(cloche(notes[i], 0.9, 0.22), SC['s10'] + 0.35 + i * 0.42, 0.10, (-1) ** i * 0.3)

# ——— musique, avec ses variations de volume ———
mus = np.fromfile(sys.argv[1], np.float32).reshape(-1, 2)
off = int(0.018 * SR)
mus = mus[off:off + N]
if len(mus) < N: mus = np.vstack([mus, np.zeros((N - len(mus), 2), np.float32)])
tm = np.arange(N) / SR
pts = [(0, 0.82), (SC['s7'], 0.82), (SC['s7'] + 0.6, 0.30), (SC['s8'], 0.30), (SC['s8'] + 0.25, 0.07),
       (SC['s10'] - 0.02, 0.07), (SC['s10'] + 0.03, 0.82), (DUREE - 1.1, 0.82), (DUREE, 0.0), (DUREE + 1, 0.0)]
g = np.interp(tm, [p[0] for p in pts], [p[1] for p in pts])
mix = mus * g[:, None] + sfx
mix = mix[: int(DUREE * SR)]
mix = np.clip(mix, -1, 1)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', round(DUREE, 3), 'crête', float(np.abs(mix).max()))
