"""Voix de l'épisode 1 (« Une minute pour Piou ») en synthèse vocale.

Kokoro (voix ff_siwis) dit chaque réplique, puis rubberband donne son timbre au personnage :
hauteur montée, formants déplacés (voix de dessin animé). Kokoro varie un peu d'une génération
à l'autre : on fait plusieurs prises et on garde la plus intelligible (notée par Whisper).

Usage : python3 voix_e01.py <dossier_sortie> [nb_prises]
"""
import shutil
import subprocess
import sys
from pathlib import Path

from tts import say

# personnage : (vitesse Kokoro, demi-tons, formants)
CAST = {
    'M': (1.0, 4, 'shifted'),     # Minuton : voix de cartoon, vive, un peu aiguë
    'P': (0.95, 6, 'shifted'),    # Piou : petite voix d'oisillon (au-delà de +6, les mots se brouillent)
    'N': (0.9, 0, 'preserved'),   # Narrateur : voix naturelle, posée
}

# (code, texte, phonèmes imposés si besoin)
LINES = [
    ('M01', "Oh non ! L'anniversaire de Piou… c'est dans une minute !"),
    ('M02', "Une minute ? C'est largement assez !"),
    ('M03', "Un caillou ?"),
    ('M04', "Non."),
    ('M05', "Un gâteau !"),
    ('M06', "Beurk.", "bˈœʁk."),  # lu à l'anglaise sans phonèmes imposés
    ('M07', "Hé ! Rends-moi ça !"),
    ('N01', "Plus que dix secondes…"),
    ('M08', "Mais oui !"),
    ('P01', "Salut Minuton !"),  # « Coucou » sortait mal, quel que soit le réglage
    ('M09', "Joyeux anniversaire, Piou !"),
    ('P02', "C'est nous deux… C'est le plus beau cadeau du monde !"),
    ('M10', "Pile à l'heure !"),
]


def voice(code, text, out, ps=None):
    speed, semis, formant = CAST[code[0]]
    raw = Path(out).with_suffix('.raw.wav')
    say(text, str(raw), speed, ps=ps)
    af = 'highpass=f=80'
    if semis:
        af = f'rubberband=pitch={2 ** (semis / 12):.4f}:formant={formant}:pitchq=quality,' + af
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(raw), '-af', af, '-ar', '48000', str(out)], check=True)
    raw.unlink()
    return out


if __name__ == '__main__':
    from intelligibilite import score

    d = Path(sys.argv[1])
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    tmp = d / 'prises'
    tmp.mkdir(parents=True, exist_ok=True)
    for code, text, *ps in LINES:
        best = None
        for k in range(n):
            take = voice(code, text, tmp / f'{code}_{k}.wav', *ps)
            r, heard = score(str(take), text)
            if best is None or r > best[0]:
                best = (r, heard, take)
            if r >= 0.999:
                break
        shutil.copy(best[2], d / f'{code}.wav')
        print(f'{code} {best[0]:.2f} ({k + 1} prise(s)) | {best[1]}', flush=True)
    shutil.rmtree(tmp)
