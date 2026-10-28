"""Prépare la marionnette de Minuton à partir d'une pose de face (M01).

On garde de l'image d'origine le corps : disque, anneau, couronne et bouton, avec le
visage effacé. Les bras, les jambes, les pieds et le visage sont dessinés en vectoriel
par le moteur : ils peuvent donc se plier, marcher et prendre toutes les expressions.

Usage : python3 build_rig.py <M01.png> <dossier_sortie>
Écrit body.png et rig.json (mesures en unités de R, le rayon du disque).
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

a = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32)
alpha = np.clip((a[..., 3] - 8) / (240 - 8), 0, 1)
a[..., 3] = alpha * 255
solid = ndimage.binary_fill_holes(alpha > 0.5)
H, W = solid.shape
yy, xx = np.mgrid[0:H, 0:W]

dt = ndimage.distance_transform_edt(solid)
cy, cx = np.unravel_index(np.argmax(dt), dt.shape)
R0 = float(dt.max())
dist = np.hypot(xx - cx, yy - cy)

# Rayon extérieur réel du contour : on le mesure dans les directions sans membre
# (haut-gauche, gauche un peu au-dessus du centre, etc.).
radii = []
for deg in (200, 215, 235, 305, 325, 340):
    ang = np.radians(deg)
    r = R0
    while True:
        x, y = int(cx + np.cos(ang) * r), int(cy + np.sin(ang) * r)
        if not (0 <= x < W and 0 <= y < H) or alpha[y, x] < 0.5:
            break
        r += 1
    radii.append(r)
R = float(np.median(radii))

# Corps = disque (bord adouci) + tout ce qui est au-dessus (couronne, bouton)
disc = np.clip(R + 0.5 - dist, 0, 1)
top = (yy < cy - R * 0.55) & (dist < R * 1.6)
keep = np.maximum(disc, top.astype(np.float32))
body = a.copy()
body[..., 3] = body[..., 3] * keep

# Effacement du visage : dégradé lisse ajusté sur le jaune du cadran
inner = dist < R * 0.86
rgb = body[..., :3]
r_, g_, b_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
yellow = inner & (r_ > 200) & (g_ > 160) & (b_ < 140) & (r_ - b_ > 120)
X, Y = (xx - cx) / R, (yy - cy) / R
feats = [np.ones_like(X), X, Y, X * X, Y * Y, X * Y]
A = np.stack([f[yellow] for f in feats], 1)
fill = np.zeros_like(rgb)
for ch in range(3):
    coef, *_ = np.linalg.lstsq(A, rgb[..., ch][yellow], rcond=None)
    fill[..., ch] = sum(c * f for c, f in zip(coef, feats))
edge = np.clip((R * 0.86 - dist) / 8, 0, 1)[..., None]
body[..., :3] = np.where(inner[..., None], fill * edge + rgb * (1 - edge), rgb)

# Contour du disque redessiné partout (là où les bras et les jambes le cachaient)
ang = np.radians(215)
r = R
while r > R * 0.8 and a[int(cy + np.sin(ang) * r), int(cx + np.cos(ang) * r), 0] < 120:
    r -= 1
ow = max(R - r, R * 0.03)
ring = np.clip(np.minimum(dist - (R - ow) + 0.5, R + 0.5 - dist), 0, 1)
ring[yy < cy - R * 0.55] = 0
ol = np.median(a[solid & (a[..., 0] < 90) & (a[..., 1] < 60) & (a[..., 3] > 200)][:, :3], axis=0)
body[..., :3] = body[..., :3] * (1 - ring[..., None]) + ol * ring[..., None]

ys, xs = np.nonzero(body[..., 3] > 2)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
Image.fromarray(body.clip(0, 255).astype(np.uint8), "RGBA").crop((x0, y0, x1, y1)).save(out / "body.png")

# Couleurs mesurées (pour dessiner les membres et le visage dans la même palette)
def med(mask):
    return [int(v) for v in np.median(a[mask][:, :3], axis=0)]


outline = solid & (a[..., 0] < 90) & (a[..., 1] < 60) & (a[..., 3] > 200)
limbs = solid & (dist > R + 4) & (yy > cy)
limb_yellow = limbs & (a[..., 0] > 220) & (a[..., 1] > 170) & (a[..., 2] < 120)
limb_shade = limbs & (a[..., 0] > 200) & (a[..., 1] > 110) & (a[..., 1] < 170) & (a[..., 2] < 80)
ground = float(np.nonzero(solid.any(1))[0].max())

rig = {
    "source": src.name,
    "R": round(R, 1),
    "body": {"file": "body.png", "pos": [round((x0 - cx) / R, 4), round((y0 - cy) / R, 4)],
             "scale": round(1 / R, 6)},
    # Distance du centre du disque au sol (bas des pieds), en R
    "centerHeight": round((ground - cy) / R, 4),
    "outlineWidth": round(ow / R, 4),
    "colors": {
        "outline": "#%02x%02x%02x" % tuple(med(outline)),
        "limb": "#%02x%02x%02x" % tuple(med(limb_yellow)),
        "limbShade": "#%02x%02x%02x" % tuple(med(limb_shade)) if limb_shade.any() else "#f0a91c",
        "face": "#%02x%02x%02x" % tuple(med(yellow)),
    },
}
(out / "rig.json").write_text(json.dumps(rig, indent=2))
print(json.dumps(rig, indent=2))
