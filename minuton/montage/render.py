"""Montage vidéo de « Le cœur en papier » (1080x1920, 30 i/s).

Usage : python3 render.py <dossier_images> <sortie.mp4> [audio.wav]
Le dossier d'images est celui du pack (Images/01_P01_Defilement.jpg, ...).
"""
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

W, H, FPS, DUR = 1080, 1920, 30, 30.0
SRC_W, SRC_H = 941, 1672

img_dir = Path(sys.argv[1])
out = sys.argv[2]
audio = sys.argv[3] if len(sys.argv) > 3 else None

# --- Plans : (fichier, début, fin, entrée, zoom_debut, zoom_fin, centre) --------
# entrée : nombre d'images de fondu depuis le plan précédent (0 = cut franc).
# Les plans d'un même groupe partagent un mouvement de caméra continu (clé "cam").
SHOTS = [
    ("01_P01_Defilement.jpg",                         0.0,  2.0, 0, "p1"),
    ("02_P02_A_Eveille_devant_la_tablette.jpg",       2.0,  4.0, 0, "p2"),
    ("03_P02_B_Paupieres_mi-closes.jpg",              4.0,  6.0, 6, "p2"),
    ("04_P03_A_Bord_de_la_feuille_souleve.jpg",       6.0,  6.7, 3, "p3"),
    ("05_P03_B_Feuille_au-dessus_de_la_table.jpg",    6.7,  7.4, 3, "p3"),
    ("06_P03_C_Feuille_a_mi-chemin_du_visage.jpg",    7.4,  8.2, 3, "p3"),
    ("07_P03_D_Feuille_pres_du_visage.jpg",           8.2,  9.0, 3, "p3"),
    ("08_P04_Feuille_sur_le_visage.jpg",              9.0, 11.0, 0, "p4"),
    ("09_P05_A_Feuille_a_moitie_retiree.jpg",        11.0, 12.0, 3, "p5"),
    ("10_P05_B_Feuille_devant_le_ventre.jpg",        12.0, 13.0, 3, "p5"),
    ("11_P06_A_Regard_vers_la_feuille.jpg",          13.0, 13.3, 0, "p6"),
    ("12_P06_B_Regard_vers_la_tablette.jpg",         13.3, 13.7, 0, "p6"),
    ("13_P06_C_Retour_du_regard_vers_la_feuille.jpg", 13.7, 14.0, 0, "p6"),
    ("14_P07_Lidee.jpg",                             14.0, 16.0, 0, "p7"),
    ("15_P08_A_Debut_du_trace.jpg",                  16.0, 17.0, 0, "p8"),
    ("16_P08_B_Demi-coeur.jpg",                      17.0, 18.0, 6, "p8"),
    ("17_P08_C_Contour_complet.jpg",                 18.0, 19.0, 6, "p8"),
    ("18_P08_D_Coeur_a_moitie_colorie.jpg",          19.0, 20.5, 6, "p8"),
    ("19_P08_E_Coeur_entierement_violet.jpg",        20.5, 22.0, 6, "p8"),
    ("20_P09_A_Feuille_pliee.jpg",                   22.0, 22.7, 0, "p9"),
    ("21_P09_B_Coeur_a_moitie_detache.jpg",          22.7, 23.5, 3, "p9"),
    ("22_P09_C_Dernier_morceau_de_papier.jpg",       23.5, 24.2, 3, "p9"),
    ("23_P09_D_Coeur_libre.jpg",                     24.2, 25.0, 3, "p9"),
    ("24_P10_Le_coeur_offert_au_spectateur.jpg",     25.0, 28.0, 0, "p10"),
    ("25_P11_Coeur_pose_sur_la_tablette_eteinte.jpg", 28.0, 30.0, 0, "p11"),
]

# Mouvements de caméra par groupe : (t0, t1, zoom0, zoom1, centre_x, centre_y)
# Le centre est en pixels de l'image source (941x1672).
CAMS = {
    "p1":  (0.0,  2.0,  1.00, 1.06, 400, 900),
    "p2":  (2.0,  6.0,  1.00, 1.06, 470, 760),
    "p3":  (6.0,  9.0,  1.06, 1.09, 470, 760),
    "p4":  (9.0, 11.0,  1.00, 1.04, 470, 800),
    "p5":  (11.0, 13.0, 1.02, 1.06, 470, 850),
    "p6":  (13.0, 14.0, 1.06, 1.06, 470, 850),
    "p7":  (14.0, 16.0, 1.00, 1.07, 430, 760),
    "p8":  (16.0, 22.0, 1.00, 1.06, 470, 1000),
    "p9":  (22.0, 25.0, 1.02, 1.06, 470, 950),
    "p10": (25.0, 28.0, 1.00, 1.09, 470, 880),
    "p11": (28.0, 30.0, 1.04, 1.00, 400, 900),  # finit au cadre de départ de P1 : boucle
}


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def load(name):
    im = Image.open(img_dir / name).convert("RGB")
    if im.size != (SRC_W, SRC_H):
        im = im.resize((SRC_W, SRC_H), Image.LANCZOS)
    return im


# --- Homographies -----------------------------------------------------------
def homography(src, dst):
    """Coefficients PIL (sortie -> entrée) pour envoyer les points dst sur src."""
    A, b = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); b.append(v)
    return np.linalg.solve(np.array(A, float), np.array(b, float)).tolist()


# --- P1 : défilement des cartes dans l'écran de la tablette ------------------
P1 = load("01_P01_Defilement.jpg")
p1a = np.asarray(P1).astype(int)
lab, _ = ndimage.label(p1a.mean(2) > 200)
SCREEN = ndimage.binary_fill_holes(lab == lab[1100, 250])
SCREEN = ndimage.binary_opening(SCREEN, iterations=3)
ys, xs = np.nonzero(SCREEN)
def _ext(f):
    i = np.argmax(f(xs, ys)); return (float(xs[i]), float(ys[i]))
QUAD = [_ext(lambda x, y: -x - y), _ext(lambda x, y: x - y),
        _ext(lambda x, y: x + y), _ext(lambda x, y: -x + y)]  # hg, hd, bd, bg
SCREEN_MASK = Image.fromarray((SCREEN * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))

TW, TH = 300, 560  # texture de l'écran redressée
RECT = [(0, 0), (TW, 0), (TW, TH), (0, TH)]
page = P1.transform((TW, TH), Image.PERSPECTIVE, homography(QUAD, RECT), Image.BICUBIC)


def hue_shift(im, deg):
    hsv = np.asarray(im.convert("HSV")).copy()
    hsv[..., 0] = (hsv[..., 0].astype(int) + int(deg / 360 * 255)) % 256
    return Image.fromarray(hsv, "HSV").convert("RGB")


pages = [page, hue_shift(page, 70).transpose(Image.FLIP_LEFT_RIGHT), hue_shift(page, 150),
         hue_shift(page, 220).transpose(Image.FLIP_LEFT_RIGHT), page]
STRIP = Image.new("RGB", (TW, TH * len(pages)))
for i, p in enumerate(pages):
    STRIP.paste(p, (0, i * TH))
FLIPS = [0.15, 0.65, 1.15, 1.65]  # synchronisés avec les « flip » sonores


def p1_screen(t):
    off = 0.0
    for k, ft in enumerate(FLIPS):
        off += ease((t - ft) / 0.28) * TH * 0.5
    win = STRIP.crop((0, int(off), TW, int(off) + TH))
    warped = win.transform((SRC_W, SRC_H), Image.PERSPECTIVE, homography(RECT, QUAD), Image.BICUBIC)
    base = P1.copy()
    base.paste(warped, (0, 0), SCREEN_MASK)
    return base


# --- Effets dessinés --------------------------------------------------------
def star(draw, cx, cy, r, alpha, color=(255, 246, 200)):
    pts = []
    for i in range(8):
        a = i * math.pi / 4 - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.32
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    draw.polygon(pts, fill=color + (int(255 * alpha),))


def sparkles(base, t, t0, cx, cy):
    """Petites étoiles qui éclosent autour du doigt levé (P7)."""
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(7)
    for i in range(9):
        delay = i * 0.07
        lt = (t - t0 - delay) / 0.9
        if not 0 <= lt <= 1:
            continue
        ang = rng.uniform(0, 2 * math.pi)
        dist = rng.uniform(40, 120)
        x = cx + math.cos(ang) * dist * (0.4 + 0.6 * ease(lt))
        y = cy + math.sin(ang) * dist * (0.4 + 0.6 * ease(lt)) - 30 * lt
        r = rng.uniform(16, 32) * math.sin(math.pi * lt)
        star(d, x, y, r, math.sin(math.pi * lt) * 0.95)
    glow = lay.filter(ImageFilter.GaussianBlur(6))
    base = Image.alpha_composite(base.convert("RGBA"), glow)
    return Image.alpha_composite(base, lay).convert("RGB")


def heart_shape(d, cx, cy, s, fill):
    pts = []
    for i in range(48):
        a = i / 48 * 2 * math.pi
        x = 16 * math.sin(a) ** 3
        y = -(13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a))
        pts.append((cx + x * s, cy + y * s))
    d.polygon(pts, fill=fill)


def floating_hearts(base, t, t0):
    """Petits cœurs violets qui montent doucement autour du cœur offert (P10)."""
    lay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(3)
    for i in range(7):
        start = t0 + 0.25 + i * 0.32
        lt = (t - start) / 1.8
        # de part et d'autre de Minuton, jamais sur son visage
        x0 = rng.uniform(110, 230) if i % 2 == 0 else rng.uniform(710, 830)
        s = rng.uniform(2.4, 3.4)
        if not 0 <= lt <= 1:
            continue
        x = x0 + 22 * math.sin(lt * 5 + i)
        y = 1080 - 480 * ease(lt)
        a = math.sin(math.pi * lt)
        heart_shape(d, x, y, s * 1.15, (255, 250, 240, int(200 * a)))
        heart_shape(d, x, y, s, (176, 128, 222, int(235 * a)))
    return Image.alpha_composite(base.convert("RGBA"), lay).convert("RGB")


# --- Caméra -----------------------------------------------------------------
def camera(im, cam, t, extra_zoom=1.0):
    t0, t1, z0, z1, cx, cy = cam
    z = (z0 + (z1 - z0) * ease((t - t0) / (t1 - t0))) * extra_zoom
    cover = max(W / SRC_W, H / SRC_H)
    bw, bh = W / (cover * z), H / (cover * z)
    x0 = min(max(cx - bw / 2, 0), SRC_W - bw)
    y0 = min(max(cy - bh / 2, 0), SRC_H - bh)
    return im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + bw, y0 + bh))


cache = {}


def shot_frame(i, t):
    name, st, en, _, cam = SHOTS[i]
    if i == 0:
        src = p1_screen(t)
    else:
        if name not in cache:
            cache[name] = load(name)
        src = cache[name]
    if cam == "p7":
        src = sparkles(src, t, 14.05, 300, 610)
    if cam == "p10":
        src = floating_hearts(src, t, 25.0)
    extra = 1.0
    if cam == "p4":  # petit rebond doux au « plop »
        lt = t - 9.0
        if 0 <= lt < 0.35:
            extra = 1.0 + 0.035 * math.sin(math.pi * lt / 0.35)
    return camera(src, CAMS[cam], t, extra)


def frame_at(t):
    idx = next(i for i, s in enumerate(SHOTS) if s[1] <= t < s[2]) if t < DUR else len(SHOTS) - 1
    cur = shot_frame(idx, t)
    fade = SHOTS[idx][3]
    if fade and idx > 0:
        k = (t - SHOTS[idx][1]) * FPS
        if k < fade:
            prev = shot_frame(idx - 1, t)
            cur = Image.blend(prev, cur, (k + 1) / (fade + 1))
    return cur


cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
       "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
if audio:
    cmd += ["-i", audio, "-c:a", "aac", "-b:a", "192k", "-shortest"]
cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", out]
proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
n = int(DUR * FPS)
for f in range(n):
    proc.stdin.write(frame_at(f / FPS).tobytes())
    if f % 90 == 0:
        print(f"image {f}/{n}", flush=True)
proc.stdin.close()
proc.wait()
print("ok", out)
