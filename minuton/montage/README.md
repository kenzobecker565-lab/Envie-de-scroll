# Montage des épisodes de Minuton

Tout le montage est fait en code, image et son, comme la pub de l'app (`promo/`).

- `render.py` assemble les images de l'épisode en vidéo 1080 × 1920, 30 images/s. Il anime aussi le défilement des cartes dans l'écran de la tablette (P1), fait de petits mouvements de caméra, des fondus courts entre les étapes d'un même geste, les étoiles de l'idée (P7) et les cœurs qui montent (P10). Le dernier plan revient au cadre du premier pour que le short boucle.
- `audio.py` génère la musique (120 BPM, marimba, basse et glockenspiel, de l'idée jusqu'à la fin) et tous les bruitages (tic-tac, défilement, vent, feuille, « plop », « ding », crayon, déchirure, carillon). Tout est synthétisé, sans aucun échantillon externe : il n'y a donc aucun droit à gérer.

## Refaire l'épisode 1

Prérequis : Python 3 avec `numpy`, `scipy` et `Pillow`, et `ffmpeg`.

```bash
cd minuton/montage
python3 audio.py /tmp/raw.wav
ffmpeg -y -i /tmp/raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 /tmp/audio.wav
python3 render.py ../episodes/01_images ../episodes/01_le_coeur_en_papier.mp4 /tmp/audio.wav
```

Le son est normalisé à −14 LUFS, le niveau visé par YouTube.
