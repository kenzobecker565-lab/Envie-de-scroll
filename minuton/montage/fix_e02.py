"""Répare les poses M24 à M27 (planche M21_M27 reçue tronquée).

- M26 et M27 : nouvelle image fournie (rire bras baissés, regard vers la gauche).
- M24 et M25 ont le bas des pieds coupé : render_e02.py les remplace (M01 et M26).
Usage : python3 fix_e02.py <Pack_complet> <nouvelle_image>
Écrit Minuton/extra/M24.png ... M27.png dans le pack.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFile
from scipy import ndimage

ImageFile.LOAD_TRUNCATED_IMAGES = True
root, new = Path(sys.argv[1]), sys.argv[2]
out = root / "Minuton" / "extra"
out.mkdir(exist_ok=True)


def disc(im):
    m = ndimage.binary_fill_holes(np.asarray(im.getchannel("A")) > 128)
    dt = ndimage.distance_transform_edt(m)
    y, x = np.unravel_index(np.argmax(dt), dt.shape)
    return x, y, dt.max()


def trim(im):
    return im.crop(im.getchannel("A").point(lambda v: 255 if v > 16 else 0).getbbox())


# Nouvelle image : deux poses côte à côte
im = Image.open(new).convert("RGBA")
a = np.asarray(im)[..., 3] > 16
lab, n = ndimage.label(ndimage.binary_dilation(a, iterations=5))
objs = sorted([s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) > 200], key=lambda s: s[1].start)
laugh = trim(im.crop((objs[0][1].start, objs[0][0].start, objs[0][1].stop, objs[0][0].stop)))
look = trim(im.crop((objs[1][1].start, objs[1][0].start, objs[1][1].stop, objs[1][0].stop)))
laugh.save(out / "M26.png")
look.save(out / "M27.png")

print("ok", out)
