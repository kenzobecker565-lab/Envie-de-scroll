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

## Refaire l'épisode 2 (« Le tournesol »)

L'épisode 2 est monté par calques : décors vides, Minuton découpé, pot et plante découpés, gros plans. `render_e02.py` les anime : marche, croissance de la plante, jour et nuit, soleil et lune, fleur qui suit Minuton, gouttes, pétales et lucioles. `audio_e02.py` génère la bande son à partir des sons de `sfx.py`.

La planche `M21_M27.png` est arrivée tronquée. `fix_e02.py` découpe les poses M26 et M27 dans l'image de remplacement fournie. M24 et M25, dont les pieds sont coupés, sont remplacées par M01 et M26.

```bash
cd minuton/montage
python3 fix_e02.py ../episodes/02_images ../episodes/02_images/Minuton/extra/nouvelles_poses_M26_M27.webp
python3 audio_e02.py /tmp/raw2.wav
ffmpeg -y -i /tmp/raw2.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 /tmp/audio2.wav
python3 render_e02.py ../episodes/02_images ../episodes/02_le_tournesol.mp4 /tmp/audio2.wav
```
