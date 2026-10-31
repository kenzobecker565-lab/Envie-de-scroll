"""Vidéo d'écoute des voix : chaque réplique s'affiche (personnage + texte) pendant qu'elle est jouée.

Usage : python3 reel_voix.py <dossier_voix> <fond.jpg> <sortie.mp4>
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H, FPS, SR, GAP = 1080, 1920, 30, 48000, 0.7
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
WHO = {'M': ('Minuton', (255, 206, 46)), 'P': ('Piou', (120, 200, 255)), 'N': ('Narrateur', (235, 235, 235))}
PLUM = (58, 20, 64)

from voix_e01 import LINES

voices, bg, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
base = Image.open(bg).convert('RGB')
s = max(W / base.width, H / base.height)
base = base.resize((round(base.width * s), round(base.height * s)), Image.LANCZOS).crop((0, 0, W, H))
base = ImageEnhance.Brightness(base.filter(ImageFilter.GaussianBlur(6))).enhance(0.55)


def wrap(draw, text, font, width):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=font) > width and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    return lines + [cur]


def card(code, text):
    im = base.copy()
    d = ImageDraw.Draw(im)
    name, col = WHO[code[0]]
    f_name, f_txt, f_code = ImageFont.truetype(BOLD, 64), ImageFont.truetype(BOLD, 84), ImageFont.truetype(BOLD, 40)
    d.text((W / 2, 640), name, font=f_name, fill=col, anchor='mm', stroke_width=6, stroke_fill=PLUM)
    y = 800
    for line in wrap(d, text, f_txt, W - 160):
        d.text((W / 2, y), line, font=f_txt, fill='white', anchor='mm', stroke_width=8, stroke_fill=PLUM)
        y += 110
    d.text((W / 2, 1750), f'Les histoires de Minuton · E01 · {code}', font=f_code, fill=(255, 255, 255, 160), anchor='mm')
    return im


audio, frames = [], []
for code, text, *_ in LINES:
    a, sr = sf.read(voices / f'{code}.wav', dtype='float32')
    assert sr == SR
    a = np.concatenate([np.zeros(int(0.25 * SR), np.float32), a, np.zeros(int(GAP * SR), np.float32)])
    audio.append(a)
    frames.append((card(code, text), len(a) / SR))
wav = Path(out).with_suffix('.wav')
sf.write(wav, np.concatenate(audio), SR)
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
       '-i', str(wav), '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
       '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-shortest', out]
p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
t = 0.0
total = 0
for im, dur in frames:
    t += dur
    n = round(t * FPS) - total
    raw = im.tobytes()
    for _ in range(n):
        p.stdin.write(raw)
    total += n
p.stdin.close()
p.wait()
wav.unlink()
print('ok', out, f'{t:.1f} s')
