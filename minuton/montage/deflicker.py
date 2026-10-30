"""Anti-scintillement pour l'animation image par image générée par IA.

Chaque dessin redessine aussi le décor, avec de petites différences (feuilles, herbe) :
à 12 dessins par seconde, le fond « grouille ». On construit l'animation sur un
fond figé : d'un dessin au suivant, on ne remplace que les zones qui changent
vraiment (personnages, objets qui bougent) et on garde ailleurs l'image d'avant.

Usage : python3 deflicker.py <dossier_entrée> <dossier_sortie> img1 img2 ...  (dans l'ordre de l'animation)
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
names = sys.argv[3:]
dst.mkdir(parents=True, exist_ok=True)
THRESH = 70   # écart (somme RVB, après lissage) au-dessus duquel une zone est considérée comme « en mouvement »
GROW = 14     # marge autour des zones en mouvement (px)
FEATHER = 5   # fondu de la bordure (px)

canvas = None
for name in names:
    im = np.asarray(Image.open(src / f"{name}.png").convert("RGB")).astype(np.float32)
    if canvas is None:
        canvas = im.copy()
    else:
        diff = np.abs(ndimage.uniform_filter(im, (7, 7, 1)) - ndimage.uniform_filter(canvas, (7, 7, 1))).sum(2)
        moving = diff > THRESH
        moving = ndimage.binary_opening(moving, iterations=2)           # retire les petits points isolés (texture)
        moving = ndimage.binary_dilation(moving, iterations=GROW)
        moving = ndimage.binary_fill_holes(moving)
        alpha = ndimage.gaussian_filter(moving.astype(np.float32), FEATHER)[..., None]
        canvas = canvas * (1 - alpha) + im * alpha
        print(f"{name}: {moving.mean() * 100:.1f} % de l'image remplacé")
    Image.fromarray(canvas.clip(0, 255).astype(np.uint8)).save(dst / f"{name}.png")
