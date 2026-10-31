"""Chargement des calques de l'épisode 2 : découpe des planches, échelles, pivots.

Chaque sprite est rendu sous la forme (image RGBA recadrée, pivot_x, pivot_y, échelle).
L'échelle ramène le disque de Minuton au même diamètre que sur M01 : on mesure le
rayon du plus grand cercle inscrit dans la silhouette (les bras et les jambes sont
plus fins que le disque, ils n'influencent pas la mesure).
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageFile
from scipy import ndimage

ImageFile.LOAD_TRUNCATED_IMAGES = True


class Sprite:
    def __init__(self, im, px, py, scale=1.0):
        self.im, self.px, self.py, self.scale = im, px, py, scale


def _solid_alpha(im):
    """Les PNG générés ont un alpha à 250-254 dans les zones pleines : on le rend opaque."""
    a = np.asarray(im.getchannel("A")).astype(np.float32)
    a = np.clip((a - 8) / (240 - 8), 0, 1) * 255
    im = im.copy()
    im.putalpha(Image.fromarray(a.astype(np.uint8)))
    return im


def disc_radius(im):
    mask = np.asarray(im.getchannel("A")) > 128
    mask = ndimage.binary_fill_holes(mask)
    return float(ndimage.distance_transform_edt(mask).max())


class Assets:
    def __init__(self, root):
        self.root = Path(root)
        self.index = json.loads((self.root / "Index_assets_et_decoupe.json").read_text())
        self.cache = {}
        m01 = self._raw("M01")
        self.ref_radius = disc_radius(m01.im)

    def _file(self, rel):
        return Image.open(self.root / rel).convert("RGBA")

    def _raw(self, code):
        """Sprite brut (sans normalisation d'échelle) d'une pose de Minuton."""
        extra = self.root / "Minuton" / "extra" / f"{code}.png"
        if extra.exists():
            im = _solid_alpha(self._file(extra.relative_to(self.root)))
            return Sprite(im, im.width / 2, im.height - 1)
        assets = self.index["assets"]
        if code in assets and "file" in assets[code] and code.startswith("M") and "_" not in code:
            im = _solid_alpha(self._file(assets[code]["file"]))
            x0, y0, x1, y1 = assets[code]["alpha_bbox_threshold_16"]
            px, py = assets[code]["pivot_bottom_center"]
            return Sprite(im.crop((x0, y0, x1, y1)), px - x0, py - y0)
        for sheet, info in self.index["sheets"].items():
            for c in info["cells"]:
                if c["code"] == code:
                    full = _solid_alpha(self._file(f"Minuton/{sheet}.png"))
                    rx0, ry0, _, _ = c["rect"]
                    x0, y0, x1, y1 = c["alpha_bbox_local"]
                    im = full.crop((rx0 + x0, ry0 + y0, rx0 + x1, ry0 + y1))
                    px, py = c["pivot_local"]
                    return Sprite(im, px - x0, py - y0)
        raise KeyError(code)

    def minuton(self, code):
        """Pose de Minuton, échelle relative à M01 (1.0 = même diamètre de disque)."""
        if code not in self.cache:
            s = self._raw(code)
            s.scale = self.ref_radius / disc_radius(s.im)
            self.cache[code] = s
        return self.cache[code]

    def plant(self, code):
        if code not in self.cache:
            a = self.index["assets"][code]
            self.cache[code] = Sprite(_solid_alpha(self._file(a["file"])),
                                      *a.get("lower_pot_anchor_estimate", a["pivot_bottom_center"]))
        return self.cache[code]

    def image(self, rel):
        if rel not in self.cache:
            self.cache[rel] = self._file(rel)
        return self.cache[rel]
