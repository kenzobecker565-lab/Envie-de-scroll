"""Recale des images d'animation générées une par une sur le décor de la première.

Chaque image complète est générée à partir de la précédente : le décor peut glisser
ou changer d'échelle de quelques pixels, ce qui fait « trembler » l'animation. On
aligne chaque image sur la référence (transformation affine trouvée par ECC) en ne
regardant que le décor (masque : zones où les personnages ne passent pas).

Usage : python3 stabilize.py <dossier_entrée> <dossier_sortie> <image_ref> <masque> img1 img2 ...
  <masque> : liste de rectangles x0,y0,x1,y1 séparés par « ; » (en pixels de l'image)
"""
import sys
from pathlib import Path

import cv2
import numpy as np

src, dst, ref_name, mask_spec = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4]
names = sys.argv[5:]
dst.mkdir(parents=True, exist_ok=True)


def load(name):
    for ext in (".png", ".jpg"):
        p = src / f"{name}{ext}"
        if p.exists():
            return cv2.imread(str(p), cv2.IMREAD_COLOR)
    raise FileNotFoundError(name)


ref = load(ref_name)
h, w = ref.shape[:2]
mask = np.zeros((h, w), np.uint8)
for rect in mask_spec.split(";"):
    x0, y0, x1, y1 = map(int, rect.split(","))
    mask[y0:y1, x0:x1] = 255


def gray(im):
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
    return cv2.GaussianBlur(g, (5, 5), 0)


g_ref = gray(ref)
crit = (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6)
for name in names:
    im = load(name)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        # d'abord à petite échelle (rapide, robuste), puis à pleine résolution
        small = 0.25
        ws = warp.copy()
        _, ws = cv2.findTransformECC(cv2.resize(g_ref, None, fx=small, fy=small), cv2.resize(gray(im), None, fx=small, fy=small),
                                     ws, cv2.MOTION_AFFINE, crit, cv2.resize(mask, None, fx=small, fy=small, interpolation=cv2.INTER_NEAREST), 5)
        ws[:, 2] /= small
        _, warp = cv2.findTransformECC(g_ref, gray(im), ws, cv2.MOTION_AFFINE, crit, mask, 5)
    except cv2.error as e:
        print(name, "recalage impossible, image gardée telle quelle :", str(e).splitlines()[-1])
    out = cv2.warpAffine(im, warp, (w, h), flags=cv2.INTER_CUBIC + cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    cv2.imwrite(str(dst / f"{name}.png"), out)
    sx = np.hypot(warp[0, 0], warp[1, 0])
    print(f"{name}: décalage ({warp[0, 2]:+.1f}, {warp[1, 2]:+.1f}) px, échelle {sx:.4f}")
