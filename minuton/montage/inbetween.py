"""Images intermédiaires calculées entre deux dessins (flot optique), et traînées de vitesse.

Entre deux dessins proches (petit mouvement), on calcule le déplacement de chaque
pixel (flot optique DIS d'OpenCV) puis on fabrique les positions intermédiaires en
déformant les deux dessins vers le milieu. Pour les mouvements très rapides, on
fabrique plutôt une « traînée » (flou de mouvement le long du déplacement), comme
les smears des dessins animés.
"""
import cv2
import numpy as np

_dis = None


def _flow(a, b, scale=0.5):
    global _dis
    if _dis is None:
        _dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    ga = cv2.cvtColor(cv2.resize(a, None, fx=scale, fy=scale), cv2.COLOR_RGB2GRAY)
    gb = cv2.cvtColor(cv2.resize(b, None, fx=scale, fy=scale), cv2.COLOR_RGB2GRAY)
    f = _dis.calc(ga, gb, None)
    f = cv2.resize(f, (a.shape[1], a.shape[0])) / scale
    return f


def motion(a, b):
    """Ampleur du mouvement entre deux dessins (px) : médiane du flot dans les zones qui bougent."""
    f = _flow(a, b)
    mag = np.hypot(f[..., 0], f[..., 1])
    moving = mag > 2
    return float(np.percentile(mag[moving], 75)) if moving.mean() > 0.002 else 0.0, f


def _warp(img, flow, t):
    h, w = img.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx - flow[..., 0] * t, gy - flow[..., 1] * t, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def inbetween(a, b, t, fab=None, fba=None):
    """Position intermédiaire à la fraction t (0 = a, 1 = b)."""
    fab = _flow(a, b) if fab is None else fab
    fba = _flow(b, a) if fba is None else fba
    wa = _warp(a, fab, t)          # a avancé de t
    wb = _warp(b, fba, 1 - t)      # b reculé de 1 - t
    # là où les deux déformations ne s'accordent pas (occlusions), on privilégie l'image la plus proche
    err = np.abs(wa.astype(np.float32) - wb.astype(np.float32)).sum(2, keepdims=True)
    conf = np.exp(-err / 120)
    wt = (1 - t) * conf + (1 - conf) * (1.0 if t < 0.5 else 0.0)
    return (wa * wt + wb * (1 - wt)).clip(0, 255).astype(np.uint8)


def smear(a, b, steps=6, strength=0.8):
    """Traînée de vitesse : b avec un flou le long du mouvement qui vient de a."""
    fba = _flow(b, a)
    acc = np.zeros_like(b, dtype=np.float32)
    for i in range(steps):
        acc += _warp(b, fba, strength * i / steps).astype(np.float32)
    return (acc / steps).clip(0, 255).astype(np.uint8)
