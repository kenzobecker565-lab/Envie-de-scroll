# Short Minuton n°1 : « Le chat farceur ». Rendu 1080×1920, 30 i/s, monté sur le tempo de la musique.
# Usage : python3 render.py <dossier short1> <sortie.mp4|--frames t1,t2,...>
import sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont

S = sys.argv[1]
A = S + '/assets'
W, H, FPS = 1080, 1920, 30
BEAT = 0.41796
INK = (42, 30, 48)
GOLD = (255, 206, 70)
PINK = (255, 112, 150)
DROP = (143, 211, 255)
FFMPEG = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'

# Découpage en temps de la musique : (scène, nombre de temps).
PLAN = [('s1', 4), ('s2', 3), ('s3', 6), ('s4', 4), ('s5', 6), ('s6', 4), ('s7', 6), ('s8', 3), ('s9', 3), ('s10', 9)]
DEBUTS = {}
t = 0.0
for nom, n in PLAN:
    DEBUTS[nom] = (t, t + n * BEAT)
    t += n * BEAT
DUREE = t

def charge(n): return Image.open(f'{A}/{n}.png').convert('RGB')
IMG = {k: charge(k) for k in ['02', '04', '05', '06', '07', '08', '09', '10', 'fond']}
SANS_PANIER = charge('05_sans_panier')
MASQUE_PANIER = np.asarray(Image.open(f'{A}/05_masque_panier.png'), dtype=np.float32) / 255
CHAT = Image.open(f'{A}/chat.png').convert('RGBA')
CHAT_L = 420
CHAT = CHAT.resize((CHAT_L, round(CHAT.height * CHAT_L / CHAT.width)), Image.LANCZOS)
POLICE = ImageFont.truetype(f'{A}/outfit.ttf', 76)
POLICE.set_variation_by_axes([900])

# ——— outils ———
def clamp(v, a, b): return max(a, min(b, v))
def lerp(a, b, u): return a + (b - a) * u
def lisse(u): u = clamp(u, 0, 1); return u * u * (3 - 2 * u)
def sortie(u): u = clamp(u, 0, 1); return 1 - (1 - u) ** 3
def rebond(u):
    u = clamp(u, 0, 1); c = 1.70158
    return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2

def camera(img, z, cx, cy, rot=0.0):
    """Cadre l'image source (1080×1920) : zoom z autour de (cx, cy), petite rotation en degrés."""
    hw, hh = W / 2 / z, H / 2 / z
    cx = clamp(cx, hw, W - hw); cy = clamp(cy, hh, H - hh)
    a = math.radians(rot); ca, sa = math.cos(a), math.sin(a)
    # point source = centre + R * (sortie - centre_sortie) / z
    m = (ca / z, -sa / z, cx - (ca * W / 2 - sa * H / 2) / z,
         sa / z, ca / z, cy - (sa * W / 2 + ca * H / 2) / z)
    return img.transform((W, H), Image.AFFINE, m, resample=Image.BICUBIC)

def bruit(seed, n, amp):
    r = np.random.default_rng(seed)
    return r.uniform(-amp, amp, n)

def boil(t):
    """Graine qui change 10 fois par seconde : les traits « tremblent » comme dessinés à la main."""
    return int(t * 10)

def trait(d, pts, w, coul, seed, amp=2.5):
    j = bruit(seed, len(pts) * 2, amp)
    pts = [(x + j[2 * i], y + j[2 * i + 1]) for i, (x, y) in enumerate(pts)]
    d.line(pts, fill=coul, width=w, joint='curve')
    r = w / 2
    for x, y in (pts[0], pts[-1]):
        d.ellipse((x - r, y - r, x + r, y + r), fill=coul)

def etoile(d, x, y, r, coul, seed, a=1.0):
    pts = []
    for k in range(8):
        ang = math.pi / 4 * k - math.pi / 2
        rr = r if k % 2 == 0 else r * 0.38
        pts.append((x + rr * math.cos(ang), y + rr * math.sin(ang)))
    j = bruit(seed, 16, r * 0.05)
    pts = [(px + j[2 * i], py + j[2 * i + 1]) for i, (px, py) in enumerate(pts)]
    d.polygon(pts, fill=coul + (int(255 * a),), outline=INK + (int(255 * a),), width=max(3, int(r * 0.12)))

def coeur(d, x, y, s, a, seed):
    pts = []
    for k in range(40):
        th = 2 * math.pi * k / 40
        px = 16 * math.sin(th) ** 3
        py = -(13 * math.cos(th) - 5 * math.cos(2 * th) - 2 * math.cos(3 * th) - math.cos(4 * th))
        pts.append((x + px * s / 32, y + py * s / 32))
    j = bruit(seed, 80, s * 0.025)
    pts = [(px + j[2 * i], py + j[2 * i + 1]) for i, (px, py) in enumerate(pts)]
    d.polygon(pts, fill=PINK + (int(255 * a),), outline=INK + (int(255 * a),), width=4)

def goutte(d, x, y, s, a, seed):
    pts = [(x, y - s)]
    for k in range(13):
        th = math.pi * k / 12
        pts.append((x + s * 0.55 * math.cos(th), y + s * 0.55 * math.sin(th)))
    j = bruit(seed, len(pts) * 2, 1.5)
    pts = [(px + j[2 * i], py + j[2 * i + 1]) for i, (px, py) in enumerate(pts)]
    d.polygon(pts, fill=DROP + (int(255 * a),), outline=INK + (int(255 * a),), width=4)

def eclat(d, x, y, r1, r2, angles, w, a, seed):
    for i, ang in enumerate(angles):
        ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
        trait(d, [(x + r1 * ca, y + r1 * sa), (x + r2 * ca, y + r2 * sa)], w, INK + (int(255 * a),), seed + i, 1.5)

def lettre_z(d, x, y, s, a, seed):
    c = (70, 52, 110, int(255 * a))
    trait(d, [(x - s / 2, y - s / 2), (x + s / 2, y - s / 2), (x - s / 2, y + s / 2), (x + s / 2, y + s / 2)], max(4, int(s / 7)), c, seed, s * 0.04)

def calque(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

def pose(base, lay):
    b = base.convert('RGBA'); b.alpha_composite(lay); return b.convert('RGB')

# ——— le chat qui court ———
def colle_chat(img, x, y, phase, vers_gauche, intensite=1.0, couche=None):
    """Chat centré en (x, y). phase : avancée de la foulée. intensite : ampleur du galop (0 = à l'arrêt)."""
    s = math.sin(2 * math.pi * phase)
    sx = 1 + 0.07 * s * intensite
    sy = 1 - 0.07 * s * intensite
    rot = 6 * math.sin(2 * math.pi * phase + 0.6) * intensite
    saut = abs(math.sin(math.pi * phase)) * 26 * intensite
    c = CHAT.resize((round(CHAT.width * sx), round(CHAT.height * sy)), Image.BICUBIC)
    if vers_gauche: c = c.transpose(Image.FLIP_LEFT_RIGHT); rot = -rot
    c = c.rotate(rot, resample=Image.BICUBIC, expand=True)
    base = img.convert('RGBA')
    base.alpha_composite(c, (round(x - c.width / 2), round(y - c.height / 2 - saut)))
    return base.convert('RGB')

def trajet_y(x):  # la feuille est légèrement inclinée
    return 1335 + (x - 540) * 0.05

# ——— les scènes ———
def s1(t, d):
    """Accroche : le chat traverse la feuille à toute vitesse, la caméra recule et découvre Minuton."""
    u = t / d
    x = lerp(390, 1330, u ** 1.15)
    y = trajet_y(x)
    lay = calque(); dr = ImageDraw.Draw(lay)
    sd = boil(t)
    for k, dy in enumerate((-40, 0, 40)):
        x0 = x - 230 - k * 25
        trait(dr, [(x0 - 120, y + dy), (x0, y + dy)], 7, INK + (200,), sd * 7 + k)
    for k in range(3):  # petits nuages de poussière derrière
        ph = (t * 6 + k / 3) % 1
        px = x - 160 - ph * 140; py = y + 70 - ph * 20
        r = 10 + ph * 14
        dr.arc((px - r, py - r, px + r, py + r), 20, 330, fill=INK + (int(220 * (1 - ph)),), width=5)
    img = pose(IMG['fond'], lay)
    img = colle_chat(img, x, y, t / 0.2, False)
    z = lerp(1.7, 1.04, lisse(u))
    cx = lerp(x, 540, lisse(u)); cy = lerp(1330, 1000, lisse(u))
    return camera(img, z, cx, cy)

def s2(t, d):
    """Minuton surpris : coup de zoom et petit tremblement."""
    lay = calque(); dr = ImageDraw.Draw(lay)
    a = clamp(t / 0.1, 0, 1)
    sc = rebond(t / 0.25)
    eclat(dr, 520, 760, 330 * sc, 400 * sc, [-150, -125, -100, -55, -30], 8, a, boil(t) * 5)
    img = pose(IMG['02'], lay)
    z = lerp(1.32, 1.12, sortie(t / 0.3))
    sh = 7 * math.exp(-t * 14) * math.sin(t * 90)
    return camera(img, z, 540 + sh, 1050, rot=sh * 0.15)

def s3(t, d):
    """Le chat fait des tours sur la feuille, ralentit, s'arrête essoufflé."""
    # aller de droite à gauche, demi-tour, retour au centre en ralentissant
    if t < 1.05:
        u = t / 1.05; x = lerp(1150, 300, lisse(u) * 0.85 + u * 0.15); gauche = True; inten = 1.0; per = 0.19
    elif t < 1.25:
        x = 300; gauche = (t < 1.15); inten = 0.5; per = 0.22
    else:
        u = clamp((t - 1.25) / 0.9, 0, 1); x = lerp(300, 640, sortie(u)); gauche = False
        inten = lerp(1.0, 0.0, u ** 2); per = lerp(0.2, 0.42, u)
    arret = t > 2.15
    y = trajet_y(x) + 10
    phase = t / per
    lay = calque(); dr = ImageDraw.Draw(lay)
    sd = boil(t)
    if inten > 0.6 and not arret:
        sens = 1 if gauche else -1
        for k, dy in enumerate((-35, 5, 45)):
            x0 = x + sens * (220 + k * 20)
            trait(dr, [(x0, y + dy), (x0 + sens * 110, y + dy)], 7, INK + (190,), sd * 3 + k)
    if t > 1.75:  # gouttes de fatigue
        a = clamp((t - 1.75) / 0.15, 0, 1)
        for k, (ox, oy) in enumerate(((160, -130), (205, -75))):
            dy = ((t * 1.6 + k * 0.4) % 1) * 30
            goutte(dr, x + ox, y + oy + dy, 30, a * (1 - ((t * 1.6 + k * 0.4) % 1) * 0.6), sd + k)
    img = pose(IMG['fond'], lay)
    if arret:
        souffle = 0.5 + 0.5 * math.sin((t - 2.15) * 2 * math.pi * 2.2)
        img = colle_chat(img, x, y + 4 * souffle, 0.25, False, 0.18)
    else:
        img = colle_chat(img, x, y, phase, gauche, inten)
    cx = lerp(540, clamp(x, 360, 720), 0.45)
    return camera(img, 1.16, cx, 1240)

def s4(t, d):
    """Le chat bâille… et Minuton a une idée."""
    u = lisse((t - 0.55) / 0.75)
    z = lerp(1.24, 1.1, u); cx = lerp(570, 640, u); cy = lerp(1340, 960, u)
    lay = calque(); dr = ImageDraw.Draw(lay)
    if t > 0.95:
        k = (t - 0.95) / 0.25
        r = 64 * rebond(k)
        etoile(dr, 868, 830, r, GOLD, boil(t))
        eclat(dr, 868, 830, 82 * min(k, 1), 122 * min(k, 1), [-160, -120, -60, -20, 20], 6, clamp(k, 0, 1), boil(t) * 3)
    return camera(pose(IMG['04'], lay), z, cx, cy)

# ordre de tracé du panier : de haut en bas, un peu de gauche à droite, avec un léger désordre
_yy, _xx = np.mgrid[0:H, 0:W]
_ORDRE = ((_yy - 1295) / 330) * 0.78 + ((_xx - 575) / 440) * 0.22
_ORDRE += np.sin(_xx / 23.0) * 0.012 + np.cos(_yy / 17.0) * 0.012
BOITE = (570, 1290, 1010, 1625)
_ORD_B = _ORDRE[BOITE[1]:BOITE[3], BOITE[0]:BOITE[2]]
_MSK_B = MASQUE_PANIER[BOITE[1]:BOITE[3], BOITE[0]:BOITE[2]]
_P05 = np.asarray(IMG['05'], dtype=np.float32)[BOITE[1]:BOITE[3], BOITE[0]:BOITE[2]]
_PSP = np.asarray(SANS_PANIER, dtype=np.float32)[BOITE[1]:BOITE[3], BOITE[0]:BOITE[2]]

def panier_partiel(p):
    al = np.clip((p * 1.08 - _ORD_B) / 0.035, 0, 1) * _MSK_B
    blend = _PSP * (1 - al[..., None]) + _P05 * al[..., None]
    img = SANS_PANIER.copy()
    img.paste(Image.fromarray(np.clip(blend, 0, 255).astype(np.uint8)), BOITE[:2])
    return img

def s5(t, d):
    """Minuton dessine un panier : il apparaît trait après trait."""
    p = lisse((t - 0.12) / 1.75) if t < 1.9 else 1.0
    img = panier_partiel(p) if p < 1 else IMG['05']
    lay = calque(); dr = ImageDraw.Draw(lay)
    if 0 < p < 1:  # étincelles sur le front du tracé
        yf = 1295 + (p * 1.08) / 0.78 * 330
        for k in range(3):
            xs = 640 + ((boil(t) * 37 + k * 131) % 330)
            etoile(dr, xs, clamp(yf - 10 + k * 8, 1310, 1600), 15 + 6 * ((boil(t) + k) % 2), GOLD, boil(t) * 4 + k)
    if t > 1.9:  # petit « ta-da »
        k = (t - 1.9) / 0.3
        a = clamp(1.5 - k, 0, 1)
        for i, (ex, ey) in enumerate(((610, 1335), (985, 1360), (800, 1630))):
            etoile(dr, ex, ey, 26 * rebond(min(k * 1.5, 1)), GOLD, boil(t) + i * 9, a)
    img = pose(img, lay)
    return camera(img, lerp(1.14, 1.2, t / d), lerp(700, 740, t / d), 1250)

def s6(t, d):
    u = lisse(t / d)
    return camera(IMG['06'], lerp(1.12, 1.24, u), lerp(660, 720, u), lerp(1260, 1320, u))

def s7(t, d):
    """Le chat dort : moment calme, des Z s'envolent."""
    lay = calque(); dr = ImageDraw.Draw(lay)
    for i in range(5):
        t0 = 0.15 + i * 0.5
        k = (t - t0) / 1.5
        if 0 <= k <= 1:
            a = clamp(k / 0.15, 0, 1) * clamp((1 - k) / 0.25, 0, 1)
            x = 740 + k * 130 + 16 * math.sin(k * 6 + i)
            y = 1250 - k * 260
            lettre_z(dr, x, y, 44 + 40 * k, a, boil(t) + i * 11)
    img = pose(IMG['07'], lay)
    u = t / d
    souffle = 0.004 * math.sin(t * 2 * math.pi * 0.6)
    return camera(img, lerp(1.14, 1.28, lisse(u)) + souffle, lerp(640, 690, u), lerp(1200, 1300, u))

def s8(t, d):
    """Une patte s'approche du crayon… sur la pointe des pieds."""
    lay = calque(); dr = ImageDraw.Draw(lay)
    for i in range(3):
        t0 = i * BEAT
        k = (t - t0) / 0.3
        if 0 <= k <= 1:
            a = 1 - k
            eclat(dr, 395, 1415, 48 + 10 * k, 72 + 10 * k, [-150, -115, -80], 5, a, boil(t) + i)
    img = pose(IMG['08'], lay)
    u = lisse(t / d)
    return camera(img, lerp(1.16, 1.36, u), lerp(520, 420, u), lerp(1260, 1420, u))

def s9(t, d):
    """Gros plan : la patte attrape le crayon. Accent comique."""
    k = clamp(t / 0.14, 0, 1)
    z = lerp(1.0, 1.12, sortie(k)) + 0.03 * t
    lay = calque(); dr = ImageDraw.Draw(lay)
    if t > 0.12:
        a = clamp((t - 0.12) / 0.08, 0, 1)
        etoile(dr, 330, 1395, 30 * rebond(clamp((t - 0.12) / 0.2, 0, 1)), (255, 255, 255), boil(t), a)
        eclat(dr, 560, 1240, 70, 110, [-170, -140, -110], 6, a, boil(t) * 2)
    img = pose(IMG['09'], lay)
    sh = 5 * math.exp(-max(t - 0.1, 0) * 16) * math.sin(t * 80) if t > 0.1 else 0
    return camera(img, z, 560 + sh, 1180)

def s10(t, d):
    """Minuton rit, le chat serre le crayon comme un doudou."""
    lay = calque(); dr = ImageDraw.Draw(lay)
    for i in range(6):
        t0 = 0.35 + i * 0.42
        k = (t - t0) / 1.6
        if 0 <= k <= 1:
            a = clamp((1 - k) / 0.3, 0, 1)
            x = 560 + (i % 2 * 2 - 1) * (40 + 60 * k) + 20 * math.sin(k * 7 + i)
            y = 1225 - k * 330
            s = (58 + (i % 3) * 12) * rebond(clamp(k * 5, 0, 1))
            coeur(dr, x, y, s, a, boil(t) + i * 5)
    if t > 0.25:  # Minuton pouffe
        a = clamp((t - 0.25) / 0.15, 0, 1)
        eclat(dr, 210, 760, 20, 55, [175, 200, 225], 6, a, boil(t) * 3)
        eclat(dr, 875, 760, 20, 55, [-45, -20, 5], 6, a, boil(t) * 3 + 7)
    img = pose(IMG['10'], lay)
    u = sortie(t / 1.6)
    img = camera(img, lerp(1.22, 1.05, u), lerp(560, 540, u), lerp(1180, 1040, u))
    if t > d - 1.35:  # signature discrète en haut
        a = sortie((t - (d - 1.35)) / 0.35)
        img = signature(img, a)
    return img

def signature(img, a):
    lay = calque(); dr = ImageDraw.Draw(lay)
    txt = 'Scroll-up'
    tw = dr.textlength(txt, font=POLICE)
    lw = 84 + 14 + tw; x0 = (W - lw) / 2; y0 = 210 - 14 * (1 - a)
    dr.rounded_rectangle((x0 - 34, y0 - 24, x0 + lw + 34, y0 + 104), 52, fill=(255, 249, 237, int(240 * a)))
    # étincelle du logo
    cx, cy = x0 + 38, y0 + 42
    pts = []
    for k in range(8):
        ang = math.pi / 4 * k - math.pi / 2; rr = 40 if k % 2 == 0 else 12
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    dr.polygon(pts, fill=(170, 106, 251, int(255 * a)))
    dr.text((x0 + 98, y0 - 6), txt, font=POLICE, fill=(36, 16, 74, int(255 * a)))
    return pose(img, lay)

SCENES = {'s1': s1, 's2': s2, 's3': s3, 's4': s4, 's5': s5, 's6': s6, 's7': s7, 's8': s8, 's9': s9, 's10': s10}

def image_a(tg):
    for nom, _ in PLAN:
        a, b = DEBUTS[nom]
        if a <= tg < b or nom == 's10':
            return SCENES[nom](tg - a, b - a)

if __name__ == '__main__':
    cible = sys.argv[2]
    if cible == '--frames':
        for v in sys.argv[3].split(','):
            image_a(float(v)).save(f'{S}/work/f_{float(v):05.2f}.png')
        sys.exit()
    n = int(round(DUREE * FPS))
    print('durée', round(DUREE, 3), 's', n, 'images', file=sys.stderr)
    p = subprocess.Popen([FFMPEG, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', cible], stdin=subprocess.PIPE)
    for i in range(n):
        p.stdin.write(image_a(i / FPS).tobytes())
        if i % 60 == 0: print(i, file=sys.stderr)
    p.stdin.close(); p.wait()
