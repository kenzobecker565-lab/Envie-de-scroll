"""Ajoute à la marionnette les corps tournés (B2 à B6) générés sans visage ni membres.

Pour chaque vue, on mesure :
  - la place du corps par rapport au corps de face (même hauteur totale, même bas) ;
  - l'ellipse du cadran (anneau orange) : le moteur y projette le visage vectoriel ;
  - la demi-largeur du boîtier à mi-hauteur : le moteur y accroche les bras.

Usage : python3 build_views.py <dossier Corps (B2.png…)> <dossier marionnette>
Met à jour rig.json (clé "views") et copie les PNG dans le dossier de la marionnette.
"""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src, out = Path(sys.argv[1]), Path(sys.argv[2])
rig = json.loads((out / "rig.json").read_text())

VIEWS = {"q3l": "B2", "profL": "B3", "back": "B4", "q3r": "B5", "profR": "B6"}


def measure(path):
    a = np.asarray(Image.open(path).convert("RGBA")).astype(np.float32)
    alpha = a[..., 3] > 128
    ys, xs = np.nonzero(alpha)
    top, bottom = ys.min(), ys.max()
    # anneau orange du cadran : orange saturé, sous la couronne
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    ring = alpha & (r > 220) & (g > 70) & (g < 160) & (b < 70)
    # on ignore la couronne et le bouton (haut de l'image) en ne gardant que la plus grande composante
    lab, n = ndimage.label(ndimage.binary_dilation(ring, iterations=2))
    if n:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        ring = lab == (np.argmax(sizes) + 1)
    ry, rx = np.nonzero(ring)
    # largeur du boîtier dans la moitié basse (sans le bouton)
    mid = int(bottom - (bottom - top) * 0.3)
    row = np.nonzero(alpha[mid])[0]
    return {
        "w": a.shape[1], "h": a.shape[0], "top": int(top), "bottom": int(bottom),
        "ring": [float(rx.min()), float(ry.min()), float(rx.max()), float(ry.max())] if len(rx) else None,
        "body": [float(row.min()), float(row.max())],
    }


# Référence : le corps de face, en unités de R depuis le centre du disque
front = rig["body"]
fimg = Image.open(out / front["file"])
f_top = front["pos"][1]
f_h = fimg.height * front["scale"]
f_bottom = f_top + f_h
fm = measure(out / front["file"])
k = front["scale"]
fx0 = front["pos"][0]


def to_units(m, scale, x0, y0):
    ring = m["ring"]
    face = None
    if ring:
        face = {
            "cx": round(x0 + (ring[0] + ring[2]) / 2 * scale, 4),
            "cy": round(y0 + (ring[1] + ring[3]) / 2 * scale, 4),
            "hw": round((ring[2] - ring[0]) / 2 * scale, 4),
            "hh": round((ring[3] - ring[1]) / 2 * scale, 4),
        }
    return face, [round(x0 + m["body"][0] * scale, 4), round(x0 + m["body"][1] * scale, 4)]


face, bx = to_units(fm, k, fx0, f_top)
rig["views"] = {"front": {"file": front["file"], "pos": front["pos"], "scale": k, "face": face, "bodyX": bx}}

for key, code in VIEWS.items():
    p = src / f"{code}.png"
    if not p.exists():
        continue
    m = measure(p)
    vis = m["bottom"] - m["top"]
    scale = f_h / vis                                 # même hauteur visible que le corps de face
    y0 = f_bottom - m["bottom"] * scale               # même bas
    # centre horizontal : milieu du boîtier dans sa moitié basse, aligné sur le centre du disque de face
    x0 = -((m["body"][0] + m["body"][1]) / 2) * scale
    face, bx = to_units(m, scale, x0, y0)
    name = f"body_{key}.png"
    shutil.copy(p, out / name)
    rig["views"][key] = {"file": name, "pos": [round(x0, 4), round(y0, 4)], "scale": round(scale, 7), "face": face, "bodyX": bx}

# Les ellipses de cadran mesurées automatiquement captent parfois le bord du boîtier :
# on garde les valeurs vérifiées à l'œil quand elles existent (voir FACES).
FACES = {
    "front": {"cx": 0, "cy": 0, "hw": 0.88, "hh": 0.88},
    "q3l": {"cx": -0.19, "cy": -0.02, "hw": 0.68, "hh": 0.87},
    "q3r": {"cx": 0.18, "cy": -0.01, "hw": 0.69, "hh": 0.87},
    "profL": {"cx": -0.22, "cy": 0.0, "hw": 0.17, "hh": 0.82},
    "profR": {"cx": 0.19, "cy": 0.0, "hw": 0.16, "hh": 0.82},
    "back": None,
}
for key, f in FACES.items():
    if key in rig["views"]:
        rig["views"][key]["face"] = f
rig["views"]["front"]["bodyX"] = [-0.98, 0.98]
(out / "rig.json").write_text(json.dumps(rig, indent=2))
print(json.dumps(rig["views"], indent=2))
