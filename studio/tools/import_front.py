"""Importe une livraison ChatGPT de la vue de face (lots 1 à 6) dans la marionnette.

Chaque calque arrive sur un canevas 1024 × 1024 aligné sur le corps vierge B1_propre.
On le recadre sur sa boîte utile (en gardant sa position), on retire les petites
traces parasites des bras, et on écrit library/minuton/front/layers.json.

Usage : python3 import_front.py <dossier de livraison réuni> <M01.png> <dossier de sortie>
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src, m01_path, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
index = json.loads((src / "Index_livraison.json").read_text())
CENTER, R = (512, 560), 300  # centre et rayon du disque sur le canevas des bases


def save_layer(im, name, keep_largest=False):
    a = np.asarray(im).copy()
    alpha = a[..., 3] > 12
    if keep_largest and alpha.any():
        # bras : une seule pièce ; on garde la plus grande et ce qui la touche presque
        lab, n = ndimage.label(alpha)
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        main = lab == (np.argmax(sizes) + 1)
        near = ndimage.binary_dilation(main, iterations=6)
        keep = np.isin(lab, np.unique(lab[near & alpha]))
        a[..., 3] = np.where(ndimage.binary_dilation(keep, iterations=1), a[..., 3], 0)
        alpha = a[..., 3] > 12
    ys, xs = np.nonzero(a[..., 3] > 0)
    x0, y0, x1, y1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
    Image.fromarray(a, "RGBA").crop((x0, y0, x1, y1)).save(out / f"{name}.png", optimize=True)
    return {"file": f"{name}.png", "x": x0, "y": y0}


layers = {"canvas": 1024, "center": list(CENTER), "R": R, "eyes": {}, "mouths": {}, "cheeks": {}, "arms": {"G": {}, "D": {}}, "legs": {}, "joints": {}}

body = Image.open(src / "Lot_1" / "B1_propre.png").convert("RGBA")
layers["body"] = save_layer(body, "body")

for asset in index["assets"]:
    code = asset["code"]
    im = Image.open(src / asset["overlay_file"]).convert("RGBA")
    if code.startswith("Y_F_"):
        layers["eyes"][code[4:]] = save_layer(im, code)
    elif code.startswith("B_F_"):
        layers["mouths"][code[4:]] = save_layer(im, code)
    elif code.startswith("J_F_"):
        layers["cheeks"][code[4:]] = save_layer(im, code)
    elif code.startswith("BR_F_"):
        side, pose = code[5], code[7:]
        layers["arms"][side][pose] = save_layer(im, code, keep_largest=True)
        layers["joints"][side] = asset.get("joint")
    elif code.startswith("JB_F_"):
        layers["legs"][code[5:]] = save_layer(im, code)

# Sol : bas des pieds de la pose debout ; hanches : haut des deux jambes
legs = np.asarray(Image.open(src / "Lot_6_vue_F" / "calques_seuls" / "JB_F_debout.png").convert("RGBA"))[..., 3] > 12
ys, xs = np.nonzero(legs)
layers["ground"] = int(ys.max())

# Graduations du cadran, reprises sur M01 (aligné sur les bases : même transformation)
m = Image.open(m01_path).convert("RGBA")
k = R / 417.7
m = m.resize((round(m.width * k), round(m.height * k)), Image.LANCZOS)
c = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
c.alpha_composite(m, (round(CENTER[0] - 606 * k), round(CENTER[1] - 645 * k)))
a = np.asarray(c).astype(np.int32)
dark = (a[..., 0] < 110) & (a[..., 1] < 80) & (a[..., 3] > 100)
win = np.zeros_like(dark)
for (cx, cy, wx, wy) in [(CENTER[0], CENTER[1] - 0.75 * R, 22, 32), (CENTER[0] - 0.83 * R, CENTER[1] + 0.02 * R, 30, 18), (CENTER[0] + 0.83 * R, CENTER[1] + 0.02 * R, 30, 18)]:
    win[int(cy - wy):int(cy + wy), int(cx - wx):int(cx + wx)] = True
marks = ndimage.binary_dilation(dark & win, iterations=1)
mk = np.zeros((1024, 1024, 4), np.uint8)
mk[..., :3] = a[..., :3].clip(0, 255)
mk[..., 3] = np.where(marks, a[..., 3], 0)
layers["marks"] = save_layer(Image.fromarray(mk, "RGBA"), "marks")

(out / "layers.json").write_text(json.dumps(layers, indent=1, ensure_ascii=False))
print({k: (len(v) if isinstance(v, dict) else v) for k, v in layers.items()})
