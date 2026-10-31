"""Montage de l'épisode 2 « Le tournesol » (1080x1920, 30 i/s, 48 s).

Usage : python3 render_e02.py <dossier Pack_complet> <sortie.mp4> [audio.wav] [--draft]
--draft : rendu rapide en 540x960 pour vérifier le rythme.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

from assets_e02 import Assets

args = [a for a in sys.argv[1:] if not a.startswith("--")]
DRAFT = "--draft" in sys.argv
ROOT, OUT = args[0], args[1]
AUDIO = args[2] if len(args) > 2 else None
W, H, FPS, DUR = 1080, 1920, 30, 48.0
A = Assets(ROOT)

# --- Mise en place de la scène large ------------------------------------------
GROUND = 1290                     # ligne des pieds de Minuton (derrière le pot)
POT_X, POT_Y, POT_H = 700, 1420, 300
POT_K = POT_H / (1472 - 1020)     # échelle des images de plante (canevas 1024x1536)
SOIL = (512, 1050)                # point d'où sort la tige, dans le canevas des plantes
MIN_H = 480                       # hauteur de M01 à l'écran
M_K = MIN_H / A._raw("M01").im.height
PLANT_G = {"PL1": 1.0, "PL2": 1.0, "PL3": 1.0, "PL4": 1.15,
           "PL5": 1.36, "PL6": 1.36, "PL7": 1.36, "PL8": 1.36}


def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)


def lerp(a, b, x):
    return a + (b - a) * x


def cover(im):
    return im.convert("RGB").resize((W, H), Image.LANCZOS)


PLATES = {k: cover(A.image(f"Decors/{k}.png")) for k in ("D1", "D2", "D3")}
PLATES_NP = {k: np.asarray(v).astype(np.float32) for k, v in PLATES.items()}

# Masque du ciel (pour cacher soleil et lune derrière la barrière et les arbres)
_d1 = PLATES_NP["D1"]
_sky = ((_d1[..., 2] > _d1[..., 0] + 25) | (_d1.min(2) > 225))
_sky[1000:] = False
_lab, _ = ndimage.label(_sky)
SKY = np.isin(_lab, np.unique(_lab[0])[np.unique(_lab[0]) > 0])
SKY_MASK = Image.fromarray((SKY * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))


def plate_mix(w1, w2, w3):
    s = w1 + w2 + w3
    arr = (PLATES_NP["D1"] * w1 + PLATES_NP["D2"] * w2 + PLATES_NP["D3"] * w3) / s
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8)).convert("RGBA")


def tint_of(w1, w2, w3):
    s = w1 + w2 + w3
    day, dusk, night = (1, 1, 1), (1.0, 0.86, 0.72), (0.55, 0.62, 0.9)
    return tuple((day[i] * w1 + dusk[i] * w2 + night[i] * w3) / s for i in range(3))


def tinted(im, tint):
    if tint == (1, 1, 1):
        return im
    a = np.asarray(im).astype(np.float32)
    a[..., :3] *= np.array(tint, np.float32)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), "RGBA")


# --- Calques de la plante -------------------------------------------------------
POT = A.plant("PL0").im
_pot_mask = np.asarray(POT.getchannel("A")) > 20


def plant_layer(code):
    """Plante seule : on retire le pot et tout ce qui est sous la terre."""
    im = A.plant(code).im
    a = np.asarray(im).astype(np.float32)
    green = (a[..., 1] > a[..., 0] + 10) & (a[..., 1] > a[..., 2] + 10)
    keep = ~_pot_mask | green
    keep[SOIL[1] + 12:] = False
    alpha = a[..., 3] * ndimage.gaussian_filter(keep.astype(np.float32), 1.0)
    a[..., 3] = alpha
    return Image.fromarray(a.astype(np.uint8), "RGBA")


PLANTS = {f"PL{k}": plant_layer(f"PL{k}") for k in range(1, 9)}
_cache_sc = {}


def scaled(im, k, key):
    ck = (key, round(k, 3))
    if ck not in _cache_sc:
        _cache_sc[ck] = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        if len(_cache_sc) > 400:
            _cache_sc.pop(next(iter(_cache_sc)))
    return _cache_sc[ck]


SOIL_SCREEN = (POT_X + (SOIL[0] - 512) * POT_K, POT_Y - (1472 - SOIL[1]) * POT_K)


def draw_pot(frame, tint):
    im = scaled(POT, POT_K, "pot")
    frame.alpha_composite(tinted(im, tint), (round(POT_X - 512 * POT_K), round(POT_Y - 1472 * POT_K)))


def draw_plant(frame, code, g, tint, angle=0.0, alpha=1.0):
    if code is None or g <= 0:
        return
    k = POT_K * g
    im = scaled(PLANTS[code], round(k, 2), code)
    k = im.width / PLANTS[code].width
    sx, sy = SOIL[0] * k, SOIL[1] * k
    if angle:
        big = Image.new("RGBA", (im.width * 2, im.height * 2), (0, 0, 0, 0))
        big.alpha_composite(im, (round(im.width - sx), round(im.height - sy)))
        im = big.rotate(angle, Image.BICUBIC, center=(im.width, im.height))
        sx, sy = im.width / 2, im.height / 2
    im = tinted(im, tint)
    if alpha < 1:
        im = im.copy()
        im.putalpha(im.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(im, (round(SOIL_SCREEN[0] - sx), round(SOIL_SCREEN[1] - sy)))


# --- Minuton --------------------------------------------------------------------
def draw_minuton(frame, code, x, y=GROUND, tint=(1, 1, 1), sx=1.0, sy=1.0, scale=1.0):
    s = A.minuton(code)
    k = M_K * s.scale * scale
    im = scaled(s.im, round(k * sx, 3), code + "x")
    if sy != sx:
        im = im.resize((im.width, max(1, round(s.im.height * k * sy))), Image.LANCZOS)
    px = s.px * im.width / s.im.width
    py = s.py * im.height / s.im.height
    frame.alpha_composite(tinted(im, tint), (round(x - px), round(y - py)))
    return im.width, im.height


def shadow(frame, x, y, w, alpha):
    if alpha <= 0.01:
        return
    lay = Image.new("RGBA", (int(w * 1.6), int(w * 0.5)), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    d.ellipse((w * 0.3, w * 0.25 - w * 0.07, w * 1.3, w * 0.25 + w * 0.07), fill=(50, 40, 60, int(120 * alpha)))
    lay = lay.filter(ImageFilter.GaussianBlur(8))
    frame.alpha_composite(lay, (int(x - w * 0.8 + 14), int(y - w * 0.25)))


def walk_pose(codes, t, fps):
    return codes[int(t * fps) % len(codes)]


WALK_R = ["M13", "M14", "M15", "M16"]
WALK_L = ["M17", "M18", "M19", "M20"]

# Poses manquantes (planche M21_M27 tronquée) : remplacement provisoire
FALLBACK = {"M24": "M01", "M25": "M26", "M26": "M23", "M27": "M22"}


def _broken(code):
    try:
        s = A.minuton(code)
    except Exception:
        return True
    a = np.asarray(s.im.getchannel("A"))
    return a[-3:].max() < 10 or a.mean() < 5


# M24 et M25 ont les pieds coupés dans la planche reçue : toujours remplacés sauf version corrigée
for _c in list(FALLBACK):
    if _c in ("M24", "M25") and not (A.root / "Minuton" / "extra" / f"{_c}.png").exists():
        continue
    if not _broken(_c):
        FALLBACK.pop(_c)
if FALLBACK:
    print("Poses de remplacement provisoires :", FALLBACK)


def M(code):
    return FALLBACK.get(code, code)


# --- Éléments dessinés ------------------------------------------------------------
SEED = A.image("Elements/E1.png")
PETAL = A.image("Elements/E2.png")


def draw_elem(frame, im, x, y, length, angle, key, alpha=1.0):
    k = length / max(im.width, im.height)
    e = scaled(im, round(k, 3), key).rotate(angle, Image.BICUBIC, expand=True)
    if alpha < 1:
        e = e.copy(); e.putalpha(e.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(e, (round(x - e.width / 2), round(y - e.height / 2)))


def glow_disc(size, color, r, glow):
    lay = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    c = size / 2
    d.ellipse((c - r - glow, c - r - glow, c + r + glow, c + r + glow), fill=color + (90,))
    lay = lay.filter(ImageFilter.GaussianBlur(glow / 2))
    d = ImageDraw.Draw(lay)
    d.ellipse((c - r, c - r, c + r, c + r), fill=color + (255,))
    return lay


SUN = glow_disc(360, (255, 214, 90), 70, 60)
_moon = glow_disc(260, (240, 240, 255), 48, 40)
_md = ImageDraw.Draw(_moon)
_md.ellipse((130 - 48 + 26, 130 - 48 - 10, 130 + 48 + 26, 130 + 48 - 10), fill=(0, 0, 0, 0))
MOON = _moon


def sky_object(frame, obj, x, y):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lay.alpha_composite(obj, (round(x - obj.width / 2), round(y - obj.height / 2)))
    lay.putalpha(Image.fromarray((np.asarray(lay.getchannel("A")).astype(np.float32)
                                  * np.asarray(SKY_MASK) / 255).astype(np.uint8)))
    frame.alpha_composite(lay)


def star(d, cx, cy, r, alpha, color=(255, 246, 200)):
    pts = []
    for i in range(8):
        a = i * math.pi / 4 - math.pi / 2
        rr = r if i % 2 == 0 else r * 0.32
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    d.polygon(pts, fill=color + (int(255 * alpha),))


def sparkles(frame, t, t0, cx, cy, n=8, spread=110):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(5)
    for i in range(n):
        lt = (t - t0 - i * 0.06) / 0.8
        ang, dist, rr = rng.uniform(0, 2 * math.pi), rng.uniform(40, spread), rng.uniform(14, 28)
        if 0 <= lt <= 1:
            f = 0.4 + 0.6 * ease(lt)
            star(d, cx + math.cos(ang) * dist * f, cy + math.sin(ang) * dist * f - 20 * lt,
                 rr * math.sin(math.pi * lt), math.sin(math.pi * lt))
    frame.alpha_composite(lay.filter(ImageFilter.GaussianBlur(5)))
    frame.alpha_composite(lay)


def fireflies(frame, t, t0):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rng = np.random.default_rng(9)
    for i in range(12):
        on = t0 + 0.3 * i
        x0, y0 = rng.uniform(80, 1000), rng.uniform(700, 1500)
        ph = rng.uniform(0, 6)
        if t < on:
            continue
        a = min((t - on) / 0.6, 1) * (0.6 + 0.4 * math.sin(t * 3 + ph))
        x = x0 + 30 * math.sin(t * 0.7 + ph)
        y = y0 + 20 * math.sin(t * 0.9 + ph * 2)
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(255, 240, 140, int(90 * a)))
        d.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 252, 200, int(255 * a)))
    frame.alpha_composite(lay.filter(ImageFilter.GaussianBlur(3)))
    frame.alpha_composite(lay)


def particles(frame, t, t0, x, y, color, n=10, dur=0.5, up=90, spread=70, size=7, seed=1):
    lt = (t - t0) / dur
    if not 0 <= lt <= 1:
        return
    d = ImageDraw.Draw(frame)
    rng = np.random.default_rng(seed)
    for _ in range(n):
        vx, vy = rng.uniform(-spread, spread), rng.uniform(up * 0.5, up)
        px = x + vx * lt
        py = y - vy * lt + 260 * lt * lt
        r = size * (1 - lt * 0.5)
        d.ellipse((px - r, py - r, px + r, py + r), fill=color + (int(255 * (1 - lt)),))


# Bec de l'arrosoir de M07 (pixels violets les plus à droite), en coordonnées du sprite
_m07 = np.asarray(A.minuton("M07").im).astype(int)
_purple = (_m07[..., 2] > _m07[..., 1] + 60) & (_m07[..., 0] > _m07[..., 1] + 20) & (_m07[..., 3] > 128)
_ys, _xs = np.nonzero(_purple)
_i = np.argmax(_xs)
SPOUT = (_xs[_i], _ys[_i])


# --- Caméra ------------------------------------------------------------------------
def camera(frame, z, cx, cy, shake=0.0, t=0.0):
    if z == 1 and not shake:
        return frame.convert("RGB")
    bw, bh = W / z, H / z
    cx += shake * math.sin(t * 71) * 12
    cy += shake * math.cos(t * 53) * 12
    x0 = min(max(cx - bw / 2, 0), W - bw)
    y0 = min(max(cy - bh / 2, 0), H - bh)
    return frame.convert("RGB").resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + bw, y0 + bh))


CLOSE = {k: cover(A.image(f"Gros_plans/{k}.png")).convert("RGBA") for k in ("G1a", "G1b", "G2a", "G2b", "G3", "G4")}


# --- Scène large générique -----------------------------------------------------------
def wide(t, weights=(1, 0, 0), plant=None, g=0.0, angle=0.0, plant2=None, mix=0.0,
         actors=(), sun=None, moon=None, before_plant=None):
    w1, w2, w3 = weights
    frame = plate_mix(w1, w2, w3) if (w2 or w3) else PLATES["D1"].convert("RGBA")
    tint = tint_of(w1, w2, w3)
    if sun:
        sky_object(frame, SUN, *sun)
    if moon:
        sky_object(frame, MOON, *moon)
    sh = w1 + 0.5 * w2
    shadow(frame, POT_X, POT_Y, POT_H * 1.25, sh)
    for a in actors:
        shadow(frame, a[1], a[2] if len(a) > 2 else GROUND, 230 * (a[3] if len(a) > 3 else 1), sh)
    # La plante passe derrière Minuton (lisibilité) ; seul le pied de la tige est redessiné
    # par-dessus le pot pour sortir de la terre.
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if plant2 and mix > 0:
        draw_plant(lay, plant, g, tint, angle, 1 - mix)
        draw_plant(lay, plant2, g, tint, angle, mix)
    else:
        draw_plant(lay, plant, g, tint, angle)
    frame.alpha_composite(lay)
    for a in actors:
        code, x = a[0], a[1]
        y = a[2] if len(a) > 2 else GROUND
        sxy = a[3] if len(a) > 3 else 1.0
        sy = a[4] if len(a) > 4 else sxy
        draw_minuton(frame, M(code), x, y, tint, sxy, sy)
    draw_pot(frame, tint)
    if before_plant:
        before_plant(frame)
    sy0 = int(SOIL_SCREEN[1] - 70)
    bx0 = int(SOIL_SCREEN[0] - 45)
    band = lay.crop((bx0, sy0, bx0 + 90, int(SOIL_SCREEN[1] + 20)))
    frame.alpha_composite(band, (bx0, sy0))
    return frame


# --- Les plans ----------------------------------------------------------------------
def s1(t):  # Tok !
    act = []
    seed_draw = None
    if t < 0.8:
        y = lerp(-80, 822, (t / 0.8) ** 2)
        seed_draw = (280, y, t * 600)
        act = [("M01", 280)]
    elif t < 1.3:
        lt = (t - 0.8) / 0.5
        sq = math.exp(-lt * 5) * math.cos(lt * 14)
        act = [("M02", 280, GROUND, 1 + 0.08 * sq, 1 - 0.12 * sq)]
    else:
        act = [("M03", 280)]
    if 0.8 <= t < 2.5:
        lt = t - 0.8
        if lt < 0.6:
            x = lerp(280, 400, lt / 0.6)
            y = lerp(822, GROUND - 10, lt / 0.6) - 180 * math.sin(math.pi * lt / 0.6)
        elif lt < 0.85:
            u = (lt - 0.6) / 0.25
            x, y = lerp(400, 430, u), GROUND - 10 - 40 * math.sin(math.pi * u)
        else:
            u = min((lt - 0.85) / 0.5, 1)
            x, y = lerp(430, 445, ease(u)), GROUND - 10
        seed_draw = (x, y, 160 + lt * 500 * max(0, 1 - lt / 1.4))
    f = wide(t, actors=act)
    if seed_draw:
        draw_elem(f, SEED, seed_draw[0], seed_draw[1], 56, seed_draw[2], "seed")
    return camera(f, lerp(1.0, 1.03, t / 2.5), 480, 1050)


def s2(t):
    im = CLOSE["G1b"] if 3.8 <= t < 3.95 else CLOSE["G1a"]
    return camera(im, lerp(1.0, 1.08, ease((t - 2.5) / 2.5)), 540, 1150)


def s3(t):
    if t < 5.7:
        act = [("M04", 280)]
    elif t < 7.1:
        u = (t - 5.7) / 1.4
        act = [(walk_pose(WALK_R, t, 8), lerp(280, 580, u))]
    elif t < 7.9:
        act = [("M05", 580)]
    else:
        act = [("M06", 580)]
    f = wide(t, actors=act)
    particles(f, t, 7.95, POT_X - 10, SOIL_SCREEN[1], (120, 80, 50), n=12, dur=0.5, up=160, spread=90)
    return camera(f, lerp(1.0, 1.08, ease((t - 5) / 4)), 560, 1100)


def s4(t):
    def drops(f):
        s = A.minuton("M07")
        k = M_K * s.scale
        sx0 = 550 - s.px * k + SPOUT[0] * k
        sy0 = GROUND - s.py * k + SPOUT[1] * k
        d = ImageDraw.Draw(f)
        rng = np.random.default_rng(int(t * 30))
        for i in range(14):
            ph = ((t - 9.2) * 2.2 + i / 14) % 1
            if t < 9.2 + i / 30 or t > 11.2:
                continue
            x = sx0 + 30 * ph + rng.uniform(-6, 6)
            y = sy0 + (SOIL_SCREEN[1] - sy0 + 10) * ph
            d.ellipse((x - 5, y - 8, x + 5, y + 8), fill=(120, 190, 255, 220))
    f = wide(t, actors=[("M07", 550)], before_plant=drops)
    return camera(f, 1.08, 600, 1100)


def s5(t):
    if t < 13:
        f = wide(t, actors=[("M08", 420)])
        return camera(f, lerp(1.0, 1.05, ease((t - 11.5) / 1.5)), 520, 1050)
    if t < 14.5:
        f = wide(t, actors=[("M09", 470)])
        return camera(f, 1.18, 600, 1180)
    code = "M11" if 15.25 <= t < 15.5 else "M10"
    f = wide(t, actors=[(code, 380)])
    return camera(f, lerp(1.22, 1.3, ease((t - 14.5) / 1.5)), 420, 1050)


def s6(t):
    if t < 17:
        f = wide(t, actors=[("M12", 380)])
        s = A.minuton("M12")
        k = M_K * s.scale
        sparkles(f, t, 16.15, 380 + s.im.width * k * 0.42, GROUND - s.im.height * k * 0.83)
        return camera(f, 1.3, 420, 1050)
    im = CLOSE["G2b"] if t >= 17.6 else CLOSE["G2a"]
    sh = math.exp(-(t - 17.6) * 10) if t >= 17.6 else 0
    return camera(im, 1.04, 540, 960, sh, t)


STAGES = [(18.0, None, 0.0), (18.8, "PL1", 1.0), (19.8, "PL2", 1.0), (21.0, "PL3", 1.0),
          (22.3, "PL4", 1.15), (23.6, "PL5", 1.36)]


def plant_growth(t):
    cur = STAGES[0]
    prev = None
    for st in STAGES:
        if t >= st[0]:
            prev, cur = cur, st
    if cur[1] is None:
        return None, 0, None, 0
    lt = t - cur[0]
    g_prev = prev[2] if prev and prev[1] else 0.0
    pop = cur[2] + (cur[2] * 0.12) * math.exp(-lt * 6) * math.sin(lt * 18)  # petit rebond
    g = lerp(max(g_prev, cur[2] * 0.6), pop, ease(lt / 0.25))
    mix = min(lt / 0.12, 1)
    return cur[1], g, prev[1] if prev else None, mix


def day_weights(p):
    el = math.sin(2 * math.pi * p)
    w1 = min(max(el * 3, 0), 1)
    w3 = min(max(-el * 3, 0), 1)
    w2 = max(0.0, 1 - abs(el) * 3)
    return (w1 + 1e-3, w2, w3), el


def s7(t):
    u = (t - 18) / 7
    p = 0.25 + 3 * (u ** 1.35)  # trois journées, de plus en plus vite
    weights, el = day_weights(p % 1)
    q = p % 1
    sun = moon = None
    if q < 0.5:
        sun = (lerp(980, 100, q / 0.5), 820 - 650 * math.sin(math.pi * q / 0.5))
    else:
        moon = (lerp(980, 100, (q - 0.5) / 0.5), 820 - 600 * math.sin(math.pi * (q - 0.5) / 0.5))
    code, g, prev, mix = plant_growth(t)
    lean = min(max((t - 18.5) / 6, 0), 1)
    f = wide(t, weights, plant=prev if (prev and mix < 1) else code, plant2=code if (prev and mix < 1) else None,
             mix=mix, g=g, actors=[("M21", 300, GROUND, 1.0, 1.0 - 0.04 * lean)], sun=sun, moon=moon)
    return camera(f, lerp(1.06, 1.0, ease(u)), 540, lerp(1150, 960, ease(u)))


def s8(t):
    sh = math.exp(-(t - 25.0) * 8)
    return camera(CLOSE["G2b"], 1.04, 540, 960, sh, t)


def s9(t):
    u = ease((t - 26.5) / 3.5)
    f = CLOSE["G3"].copy()
    for i in range(4):
        lt = (t - 26.7 - i * 0.7) / 2.6
        if 0 <= lt <= 1:
            x = 380 + i * 140 + 80 * math.sin(lt * 6 + i)
            y = lerp(380, 1500, lt)
            draw_elem(f, PETAL, x, y, 80, 40 * math.sin(lt * 8 + i) + i * 50, "petal", min(1, (1 - lt) * 4))
    return camera(f, lerp(1.3, 1.08, u), 540, lerp(1500, 520, u))


def flower_spring(t, switches):
    """Angle de balancement amorti après chaque changement de direction."""
    ang = 0.0
    for ts, direction in switches:
        if t >= ts:
            lt = t - ts
            ang += -direction * 6 * math.exp(-lt * 3.5) * math.sin(lt * 11)
    # inclinaison de fond vers le côté où se trouve Minuton (angle PIL positif = vers la gauche)
    lean, prev = 0.0, 0.0
    for ts, direction in switches:
        if t >= ts:
            lean = lerp(prev, -direction * 4, ease((t - ts) / 0.3))
            prev = -direction * 4
    return ang + lean


def s10(t):
    mix = ease((t - 30.3) / 1.2)
    sway = 1.5 * math.sin((t - 30) * 2.2)
    f = wide(t, plant="PL5", plant2="PL8", mix=mix, g=1.36, angle=sway, actors=[("M22", 280)])
    return camera(f, 1.0, 540, 960)


def x_path(t):
    """Position de Minuton de S11 à S13 et pose correspondante."""
    segs = [  # (t0, t1, x0, x1, cycle, i/s des poses)
        (32.0, 33.2, 280, 220, WALK_L, 8),
        (34.0, 35.4, 220, 940, WALK_R, 12),
        (36.0, 36.8, 940, 200, WALK_L, 16),
        (36.8, 37.6, 200, 940, WALK_R, 16),
        (37.6, 38.5, 940, 280, WALK_L, 16),
    ]
    for t0, t1, x0, x1, cyc, fps in segs:
        if t0 <= t < t1:
            return lerp(x0, x1, (t - t0) / (t1 - t0)), walk_pose(cyc, t, fps)
    if t < 32.0:
        return 280, "M22"
    if t < 34.0:
        return 220, "M24"
    if t < 36.0:
        return 940, "M23"
    if t < 40.0:
        return 280, ("M25" if int(t * 6) % 2 == 0 else "M26")
    return 280, "M27"


SWITCHES = [(32.2, -1), (34.75, 1), (36.4, -1), (37.2, 1), (38.0, -1)]


def _unused_flower_dir(t):
    d = "PL8"
    for ts, direction in SWITCHES:
        if t >= ts:
            d = "PL6" if direction < 0 else "PL7"
    return d


def s11_13(t):
    x, code = x_path(t)
    # fondu de 3 images entre l'ancienne et la nouvelle direction
    olds = ["PL8"] + ["PL6" if dd < 0 else "PL7" for _, dd in SWITCHES]
    idx = sum(1 for ts, _ in SWITCHES if t >= ts)
    last = SWITCHES[idx - 1][0] if idx else 0
    mix = min((t - last) * 10, 1) if idx else 1
    ang = flower_spring(t, SWITCHES)
    actor = (code, x)
    if t >= 38.5:  # rire : petits sauts
        hop = abs(math.sin((t - 38.5) * math.pi * 3))
        actor = (code, x, GROUND - 22 * hop, 1 + 0.03 * (1 - hop), 1 - 0.05 * (1 - hop))
    f = wide(t, plant=olds[idx - 1] if idx else "PL8", plant2=olds[idx], mix=mix, g=1.36, angle=ang,
             actors=[actor])
    return camera(f, 1.0, 540, 960)


def s14(t):
    u = ease((t - 40) / 1.2)
    weights = (1 - u + 1e-3, u, 0)
    sun = (lerp(240, 180, (t - 40) / 2), lerp(520, 800, (t - 40) / 2))
    f = wide(t, weights, plant="PL6", g=1.36,
             angle=flower_spring(t, SWITCHES) + 3 * ease((t - 40.3) / 1.2), actors=[("M27", 280)], sun=sun)
    return camera(f, lerp(1.0, 1.04, ease((t - 40) / 2)), 480, 1000)


def s15_16(t):
    f = CLOSE["G4"].copy()
    fireflies(f, t, 42.3)
    if t >= 46.5:
        lt = (t - 46.5) / 1.5
        x = lerp(370, 520, lt)
        y = lerp(700, 1105, lt ** 2)
        draw_elem(f, SEED, x, y, 46, 30 + lt * 400, "seed")
    breath = 1 + 0.004 * math.sin(t * 2.4)
    return camera(f, lerp(1.0, 1.08, ease((t - 42) / 6)) * breath, 520, 960)


TIMELINE = [(0, 2.5, s1), (2.5, 5, s2), (5, 9, s3), (9, 11.5, s4), (11.5, 16, s5), (16, 18, s6),
            (18, 25, s7), (25, 26.5, s8), (26.5, 30, s9), (30, 32, s10), (32, 40, s11_13),
            (40, 42, s14), (42, 48, s15_16)]


def frame_at(t):
    for t0, t1, fn in TIMELINE:
        if t0 <= t < t1:
            return fn(t)
    return TIMELINE[-1][2](t)


if __name__ == "__main__":
    ow, oh = (540, 960) if DRAFT else (W, H)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{ow}x{oh}", "-r", str(FPS), "-i", "-"]
    if AUDIO:
        cmd += ["-i", AUDIO, "-c:a", "aac", "-b:a", "192k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", "medium" if DRAFT else "slow", "-crf", "17",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", OUT]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(DUR * FPS)
    only = [float(a.split("=")[1]) for a in sys.argv if a.startswith("--at=")]
    for fi in range(n):
        im = frame_at(fi / FPS)
        if ow != W:
            im = im.resize((ow, oh), Image.BILINEAR)
        proc.stdin.write(im.tobytes())
        if fi % 150 == 0:
            print(f"image {fi}/{n}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("ok", OUT)
