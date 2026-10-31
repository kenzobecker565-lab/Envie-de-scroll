"""Plan « La pile », version animateur : rythme retravaillé, caméra qui suit l'action,
enchaînements d'une image entre dessins proches, traînées de vitesse dans la chute.

Usage : python3 render_pile.py <dossier_dessins> <sortie.mp4> [audio.wav]
"""
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

W, H, FPS = 1080, 1920, 30
src = Path(sys.argv[1]) if len(sys.argv) > 1 else None  # dossier des dessins (donné au lancement)

# Feuille d'exposition retravaillée (dessin, durée en s). Principes :
# - poses clés tenues assez longtemps pour être lues ; intervalles rapides ;
# - un temps suspendu (« oh oh ») au sommet du déséquilibre, juste avant la chute ;
# - l'impact tenu un instant, puis un vrai silence avant l'étourdissement.
SHEET = [
    ("A01", 0.1), ("A01b", 0.09), ("A02", 0.1), ("A03", 0.15), ("P05_A", 0.25),                 # le pot
    ("A05", 0.3), ("A05b", 0.12), ("A05", 0.2),                                                    # fier (clignement)
    ("B01", 0.2), ("B02", 0.35), ("P05_B", 0.2), ("B03b", 0.1), ("B04", 0.42),                    # l'arrosoir
    ("C01", 0.2), ("C02", 0.4), ("P05_C", 0.2), ("C04", 0.5),                                     # le seau
    ("D01", 0.14), ("D01b", 0.1), ("D02", 0.12), ("D02b", 0.1), ("D03", 0.12), ("D03b", 0.1),     # il grimpe
    ("D04", 0.12), ("D04b", 0.1), ("P05_D", 0.3), ("P05_Db", 0.25),
    ("E01", 0.17), ("E02", 0.15), ("E03", 0.13), ("E04", 0.11), ("E04b", 0.08), ("P05_E", 0.27),   # ça vacille
    ("E06", 0.09),
    ("F00", 0.06), ("F01", 0.07), ("F02", 0.17), ("F02b", 0.08), ("P05_F", 0.1), ("F04", 0.15),   # patatras
    ("F05", 0.1), ("F06", 0.3), ("F06b", 0.15), ("F06", 0.2),
    ("G01", 0.2), ("G02", 0.15), ("P05_G", 0.35), ("G03", 0.35), ("G04", 0.3), ("G04b", 0.32),     # étourdis
]
starts = np.cumsum([0] + [d for _, d in SHEET])
DUR = float(starts[-1])
T = {f"{n}@{i}": float(starts[i]) for i, (n, _) in enumerate(SHEET)}

# Enchaînement d'une image (50 %) entre dessins proches : adoucit sans dédoubler
SOFT = {("A02", "A03"), ("B04", "C01"), ("C02", "P05_C"), ("P05_C", "C04"), ("C04", "D01"), ("P05_D", "P05_Db"),
        ("P05_Db", "E01"), ("F04", "F05"), ("F05", "F06"), ("F06", "G01"), ("G01", "G02"), ("P05_G", "G03"),
        ("G03", "G04"), ("G04", "G04b"), ("A05", "B01")}
# Traînées de vitesse (direction du mouvement en pixels) sur les dessins de chute
SMEAR = {"E06": (0, 18), "F00": (0, 24), "F01": (0, 30)}

# Caméra : (temps, centre x, centre y, zoom), interpolée en douceur. Elle monte avec
# la pile, se resserre pendant le déséquilibre, suit la chute, puis recule un peu.
first = lambda n: float(starts[[x for x, _ in SHEET].index(n)])
t_climb, t_wobble, t_fall, t_dizzy = first("D01"), first("E01"), first("F00"), first("G01")
CAM = [
    (0.0, 470, 900, 1.0), (t_climb, 470, 880, 1.04), (first("P05_D"), 470, 760, 1.1),
    (first("P05_E"), 470, 740, 1.14), (first("F02") + 0.05, 470, 900, 1.06), (t_dizzy, 470, 930, 1.08), (DUR, 470, 940, 1.13),
]
IMPACT = first("F02")


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def cam(t):
    for (t0, x0, y0, z0), (t1, x1, y1, z1) in zip(CAM, CAM[1:]):
        if t0 <= t <= t1:
            p = ease((t - t0) / (t1 - t0) if t1 > t0 else 1)
            return x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, z0 + (z1 - z0) * p
    return CAM[-1][1:]


cache = {}


def drawing(name):
    if name not in cache:
        cache[name] = Image.open(src / f"{name}.png").convert("RGB")
    return cache[name]


def smeared(name, prev):
    """Flou de mouvement seulement là où le dessin a changé (le personnage qui tombe)."""
    key = ("smear", name)
    if key not in cache:
        a = np.asarray(drawing(name)).astype(np.float32)
        p = np.asarray(drawing(prev)).astype(np.float32)
        moving = ndimage.binary_dilation(np.abs(a - p).sum(2) > 90, iterations=10)
        alpha = ndimage.gaussian_filter(moving.astype(np.float32), 6)[..., None]
        dx, dy = SMEAR[name]
        acc = np.zeros_like(a)
        n = 7
        for i in range(n):
            acc += ndimage.shift(a, (-dy * i / n, -dx * i / n, 0), order=1, mode="nearest")
        blur = acc / n
        out = a * (1 - alpha * 0.7) + blur * alpha * 0.7
        cache[key] = Image.fromarray(out.clip(0, 255).astype(np.uint8))
    return cache[key]


def drawing_at(t):
    i = int(np.searchsorted(starts, t, side="right") - 1)
    i = min(max(i, 0), len(SHEET) - 1)
    name = SHEET[i][0]
    im = smeared(name, SHEET[i - 1][0]) if name in SMEAR and i > 0 else drawing(name)
    # une image d'enchaînement au tout début du dessin, si le mouvement est petit
    if i > 0 and (SHEET[i - 1][0], name) in SOFT and t - starts[i] < 1 / FPS:
        im = Image.blend(drawing(SHEET[i - 1][0]), im, 0.5)
    return im


def frame_at(t):
    im = drawing_at(t)
    sw, sh = im.size
    cx, cy, z = cam(t)
    d = t - IMPACT
    if 0 <= d < 0.5:  # secousse et rebond à l'impact
        k = (1 - d / 0.5) ** 2
        cx += math.sin(d * 95) * 15 * k
        cy += math.cos(d * 77) * 15 * k
        z *= 1 + 0.045 * math.sin(math.pi * min(d / 0.16, 1)) * (1 - d / 0.5)
    cover = max(W / sw, H / sh)
    bw, bh = W / (cover * z), H / (cover * z)
    x0 = min(max(cx - bw / 2, 0), sw - bw)
    y0 = min(max(cy - bh / 2, 0), sh - bh)
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + bw, y0 + bh))


if __name__ == "__main__":
    out = sys.argv[2]
    audio = sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith("--") else None
    if "--times" in sys.argv:
        for i, (n, d) in enumerate(SHEET):
            print(f"{starts[i]:6.3f}  {n}")
        sys.exit()
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium", "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-tune", "animation",
            "-profile:v", "high", "-bf", "2", "-g", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(int(round(DUR * FPS))):
        proc.stdin.write(frame_at(f / FPS).tobytes())
    proc.stdin.close()
    proc.wait()
    print("ok", out, f"{DUR:.2f} s")
