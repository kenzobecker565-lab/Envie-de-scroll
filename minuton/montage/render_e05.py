"""Montage de l'épisode 5 « Le petit oiseau » (1080 × 1920, 30 i/s, 52 s).

Chaque image est une illustration complète (ChatGPT). Le montage ajoute :
caméra continue par plan, coupes vives dans l'action et fondus doux dans les
moments calmes, secousses aux chocs, et quelques effets dessinés (étincelles,
cœurs, scintillement).

Usage : python3 render_e05.py <dossier Scenes> <sortie.mp4> [audio.wav]
"""
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H, FPS, DUR = 1080, 1920, 30, 52.0
SW, SH = 941, 1672
src = Path(sys.argv[1])
out = sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else None

# (image, début, fin, fondu d'entrée en images (négatif : passage par une lumière dorée), plan)
SHOTS = [
    ("P01_A", 0.0, 1.0, 0, 1), ("P01_B", 1.0, 2.0, 2, 1), ("P01_C", 2.0, 3.0, 2, 1),
    ("P02_A", 3.0, 4.33, 0, 2), ("P02_B", 4.33, 5.67, 5, 2), ("P02_C", 5.67, 7.0, 5, 2),
    ("P03_A", 7.0, 8.5, 0, 3), ("P03_B", 8.5, 10.0, 0, 31),
    ("P04_A", 10.0, 11.25, 0, 4), ("P04_B", 11.25, 12.5, 3, 4), ("P04_C", 12.5, 13.75, 3, 4), ("P04_D", 13.75, 15.0, 3, 4),
    ("P05_A", 15.0, 16.29, 0, 5), ("P05_B", 16.29, 17.57, 3, 5), ("P05_C", 17.57, 18.86, 3, 5), ("P05_D", 18.86, 20.14, 3, 5),
    ("P05_E", 20.14, 21.43, 2, 5), ("P05_F", 21.43, 22.71, 0, 5), ("P05_G", 22.71, 24.0, 4, 5),
    ("P06_A", 24.0, 25.33, 0, 6), ("P06_B", 25.33, 26.67, 6, 6), ("P06_C", 26.67, 28.0, 4, 6),
    ("P07_A", 28.0, 29.6, 0, 7), ("P07_B", 29.6, 31.2, 3, 7), ("P07_C", 31.2, 32.8, 2, 7), ("P07_D", 32.8, 34.4, 3, 7), ("P07_E", 34.4, 36.0, 2, 7),
    ("P08_A", 36.0, 37.25, 0, 8), ("P08_B", 37.25, 38.5, 4, 8), ("P08_C", 38.5, 39.75, 0, 82), ("P08_D", 39.75, 41.0, 0, 83),
    ("P09_A", 41.0, 43.0, 0, 9), ("P09_B", 43.0, 45.0, 0, 92),
    ("P10_A", 45.0, 46.33, -18, 10), ("P10_B", 46.33, 47.67, 4, 10), ("P10_C", 47.67, 49.0, 5, 103),
    ("P11_A", 49.0, 52.0, 6, 11),
]

# Caméra par plan : (début, fin, zoom0, zoom1, (cx0, cy0), (cx1, cy1)) en pixels de l'image source
CAMS = {
    1: (0.0, 3.0, 1.0, 1.06, (470, 836), (420, 820)),
    2: (3.0, 7.0, 1.02, 1.12, (470, 1050), (470, 1000)),
    3: (7.0, 8.5, 1.35, 1.12, (470, 1250), (470, 560)),     # panoramique vers le haut : on découvre l'arbre
    31: (8.5, 10.0, 1.06, 1.0, (470, 900), (470, 836)),
    4: (10.0, 15.0, 1.0, 1.07, (470, 900), (470, 760)),
    5: (15.0, 24.0, 1.0, 1.06, (470, 880), (470, 900)),
    6: (24.0, 28.0, 1.06, 1.16, (470, 1100), (470, 1060)),
    7: (28.0, 36.0, 1.0, 1.05, (470, 900), (470, 860)),
    8: (36.0, 38.5, 1.0, 1.08, (470, 900), (470, 700)),
    82: (38.5, 39.75, 1.0, 1.08, (470, 760), (470, 700)),
    83: (39.75, 41.0, 1.04, 1.0, (470, 880), (470, 836)),
    9: (41.0, 43.0, 1.0, 1.1, (470, 760), (470, 720)),
    92: (43.0, 45.0, 1.0, 1.12, (470, 836), (470, 760)),
    10: (45.0, 47.67, 1.0, 1.05, (470, 836), (420, 860)),
    103: (47.67, 49.0, 1.02, 1.1, (470, 836), (470, 800)),
    11: (49.0, 52.0, 1.1, 1.0, (470, 900), (470, 836)),
}

# Secousses : (instant, amplitude en px, durée)
SHAKES = [(2.05, 7, 0.3), (13.8, 4, 0.25), (21.45, 16, 0.5), (31.25, 5, 0.25)]
# Petit rebond de zoom aux impacts : (instant, ampleur)
PULSES = [(2.05, 0.03), (21.45, 0.05), (31.25, 0.025)]


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


cache = {}


def img(name):
    if name not in cache:
        cache[name] = Image.open(src / f"{name}.jpg").convert("RGB")
    return cache[name]


def star(d, cx, cy, r, alpha, color=(255, 246, 200)):
    pts = []
    for i in range(8):
        a = i * math.pi / 4 - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.33
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=color + (int(255 * alpha),))


def heart(d, cx, cy, s, fill):
    pts = []
    for i in range(40):
        a = i / 40 * 2 * math.pi
        x = 16 * math.sin(a) ** 3
        y = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((cx + x * s, cy + y * s))
    d.polygon(pts, fill=fill)


def sparkles(base, t, t0, cx, cy, n=8, spread=120, size=(14, 30), seed=1):
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(seed)
    for i in range(n):
        lt = (t - t0 - i * 0.06) / 0.9
        ang, dist, r = rng.uniform(0, 2 * math.pi), rng.uniform(30, spread), rng.uniform(*size)
        if 0 <= lt <= 1:
            f = 0.4 + 0.6 * ease(lt)
            star(d, cx + math.cos(ang) * dist * f, cy + math.sin(ang) * dist * f - 25 * lt, r * math.sin(math.pi * lt), math.sin(math.pi * lt))
    out = Image.alpha_composite(base.convert("RGBA"), lay.filter(ImageFilter.GaussianBlur(6)))
    return Image.alpha_composite(out, lay).convert("RGB")


def hearts(base, t, t0, cx, cy, n=6, seed=3):
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(seed)
    for i in range(n):
        lt = (t - t0 - i * 0.28) / 1.6
        x0 = cx + rng.uniform(-170, 170)
        s = rng.uniform(1.6, 2.6)
        if 0 <= lt <= 1:
            a = math.sin(math.pi * lt)
            x = x0 + 18 * math.sin(lt * 5 + i)
            y = cy - 300 * ease(lt)
            heart(d, x, y, s * 1.15, (255, 250, 245, int(210 * a)))
            heart(d, x, y, s, (255, 120, 150, int(235 * a)))
    return Image.alpha_composite(base.convert("RGBA"), lay).convert("RGB")


# Effets : (plan d'image, fonction(image, t))
EFFECTS = {
    "P06_C": lambda im, t: sparkles(im, t, 26.75, 400, 880, n=9, seed=4),
    "P09_A": lambda im, t: hearts(im, t, 41.3, 470, 640, n=6),
    "P10_B": lambda im, t: sparkles(im, t, 46.6, 300, 860, n=8, spread=90, seed=7),
    "P08_C": lambda im, t: sparkles(im, t, 38.6, 470, 700, n=8, spread=150, seed=9),
}


def camera(im, plan, t, extra_zoom=1.0, shake=(0, 0)):
    t0, t1, z0, z1, (ax, ay), (bx, by) = CAMS[plan]
    p = ease((t - t0) / (t1 - t0))
    z = (z0 + (z1 - z0) * p) * extra_zoom
    cx = ax + (bx - ax) * p + shake[0]
    cy = ay + (by - ay) * p + shake[1]
    cover = max(W / SW, H / SH)
    bw, bh = W / (cover * z), H / (cover * z)
    x0 = min(max(cx - bw / 2, 0), SW - bw)
    y0 = min(max(cy - bh / 2, 0), SH - bh)
    return im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + bw, y0 + bh))


def shot_frame(i, t):
    name, _, _, _, plan = SHOTS[i]
    im = img(name)
    if name in EFFECTS:
        im = EFFECTS[name](im, t)
    extra = 1.0
    for tp, amp in PULSES:
        if 0 <= t - tp < 0.3:
            extra += amp * math.sin(math.pi * (t - tp) / 0.3)
    sx = sy = 0.0
    for ts, amp, dur in SHAKES:
        if 0 <= t - ts < dur:
            k = amp * (1 - (t - ts) / dur) ** 2
            sx += math.sin((t - ts) * 95) * k
            sy += math.cos((t - ts) * 77) * k
    return camera(im, plan, t, extra, (sx, sy))


def frame_at(t):
    idx = next((i for i, s in enumerate(SHOTS) if s[1] <= t < s[2]), len(SHOTS) - 1)
    cur = shot_frame(idx, t)
    fade = SHOTS[idx][3]
    if fade < 0 and idx > 0:
        # passage du temps : l'image précédente s'éclaire en doré, puis la nouvelle en sort
        n = -fade
        k = (t - SHOTS[idx][1]) * FPS
        gold = Image.new("RGB", (W, H), (255, 214, 160))
        if k < n / 2:
            cur = Image.blend(shot_frame(idx - 1, t), gold, (k + 1) / (n / 2 + 1))
        elif k < n:
            cur = Image.blend(gold, cur, (k - n / 2 + 1) / (n / 2 + 1))
    elif fade and idx > 0:
        k = (t - SHOTS[idx][1]) * FPS
        if k < fade:
            cur = Image.blend(shot_frame(idx - 1, t), cur, (k + 1) / (fade + 1))
    # ouverture en fondu depuis le noir, très courte
    if t < 0.25:
        cur = Image.blend(Image.new("RGB", (W, H)), cur, t / 0.25)
    return cur


if __name__ == "__main__":
    only = [float(a.split("=")[1]) for a in sys.argv if a.startswith("--at=")]
    if only:
        for t in only:
            frame_at(t).save(f"{out}_{t:05.2f}.jpg", quality=90)
        sys.exit()
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-crf", "15", "-tune", "animation", "-profile:v", "high",
            "-bf", "2", "-g", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(DUR * FPS)
    for f in range(n):
        proc.stdin.write(frame_at(f / FPS).tobytes())
        if f % 150 == 0:
            print(f"image {f}/{n}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("ok", out)
