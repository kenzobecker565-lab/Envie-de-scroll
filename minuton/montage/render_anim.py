"""Montage d'un plan animé image par image (dessins ChatGPT recalés et anti-scintillement).

Chaque dessin s'affiche pendant sa durée d'exposition (feuille CSV), comme en dessin
animé : pas de fondu entre les dessins. On ajoute une caméra lente, des secousses et
un rebond de zoom aux impacts.

Usage : python3 render_anim.py <dossier_dessins> <exposition.csv> <sortie.mp4> [audio.wav]
         [--impact=t,amp] ... [--zoom=z0,z1] [--center=x,y] [--swap=ABSENT:REMPLACANT] ...
"""
import csv
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image

W, H, FPS = 1080, 1920, 30
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opts = [a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--")]
src, sheet, out = Path(args[0]), Path(args[1]), args[2]
audio = args[3] if len(args) > 3 else None
impacts = [tuple(map(float, v.split(","))) for k, v in opts if k == "impact"]
zoom = tuple(map(float, dict(opts).get("zoom", "1.0,1.04").split(",")))
center = tuple(map(float, dict(opts).get("center", "470,900").split(",")))
swaps = dict(v.split(":") for k, v in opts if k == "swap")

rows = list(csv.DictReader(open(sheet, encoding="utf-8-sig"), delimiter=";"))
frames = []
for r in rows:
    name = Path(r["fichier"]).stem
    frames.append((float(r["debut_plan_s"]), float(r["fin_plan_s"]), swaps.get(name, name)))
DUR = frames[-1][1]

cache = {}


def img(name):
    if name not in cache:
        cache[name] = Image.open(src / f"{name}.png").convert("RGB")
    return cache[name]


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def frame_at(t):
    name = next((f[2] for f in frames if f[0] <= t < f[1]), frames[-1][2])
    im = img(name)
    sw, sh = im.size
    z = zoom[0] + (zoom[1] - zoom[0]) * ease(t / DUR)
    cx, cy = center
    for ti, amp in impacts:
        d = t - ti
        if 0 <= d < 0.45:
            k = (1 - d / 0.45) ** 2
            cx += math.sin(d * 95) * amp * k
            cy += math.cos(d * 77) * amp * k
            z *= 1 + 0.035 * math.sin(math.pi * min(d / 0.18, 1)) * (amp / 14)
    cover = max(W / sw, H / sh)
    bw, bh = W / (cover * z), H / (cover * z)
    x0 = min(max(cx - bw / 2, 0), sw - bw)
    y0 = min(max(cy - bh / 2, 0), sh - bh)
    return im.resize((W, H), Image.LANCZOS, box=(x0, y0, x0 + bw, y0 + bh))


cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
if audio:
    cmd += ["-i", audio, "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-shortest"]
cmd += ["-c:v", "libx264", "-preset", "medium", "-b:v", "8M", "-maxrate", "10M", "-bufsize", "16M", "-tune", "animation",
        "-profile:v", "high", "-bf", "2", "-g", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
last = None
for f in range(int(round(DUR * FPS))):
    proc.stdin.write(frame_at(f / FPS).tobytes())
proc.stdin.close()
proc.wait()
print("ok", out, f"{DUR:.2f} s")
