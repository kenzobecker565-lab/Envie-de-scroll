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

## Refaire l'épisode 5 (« Le petit oiseau »)

Les 37 images de l'épisode sont des illustrations complètes générées par ChatGPT. `render_e05.py` enchaîne les images. Il ajoute :
- une caméra continue par plan ;
- des coupes vives dans l'action et des fondus doux dans les moments calmes ;
- un passage doré pour le coucher de soleil ;
- des secousses aux chocs ;
- quelques effets (étincelles, cœurs).

`audio_e05.py` génère la bande son.

```bash
cd minuton/montage
python3 audio_e05.py /tmp/raw5.wav
ffmpeg -y -i /tmp/raw5.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 /tmp/audio5.wav
python3 render_e05.py ../episodes/05_images /tmp/e05.mp4 /tmp/audio5.wav
```

## Animation image par image (épisode 5, plan test « La pile »)

1. `stabilize.py` recale chaque dessin sur le décor du premier (recalage affine ECC limité au décor).
2. `deflicker.py` fige le fond : d'un dessin au suivant, seules les zones qui bougent vraiment sont remplacées, ce qui supprime le grouillement du décor redessiné.
3. `render_anim.py` affiche chaque dessin pendant sa durée d'exposition (feuille CSV), avec caméra lente, secousse et rebond aux impacts.
4. `audio_pile.py` génère la bande son, calée sur chaque dessin.

```bash
cd minuton/montage
N="A01 A02 A03 P05_A A05 B01 B02 P05_B B04 C01 C02 P05_C C04 D01 D02 D03 D04 P05_D E03 E04 P05_E E06 F01 F02 P05_F F04 F05 F06 G01 P05_G G03 G04"
python3 stabilize.py ../episodes/05_anim/pile /tmp/stab P05_A "0,0,941,300;0,300,250,1100;760,300,941,1000" $N
python3 deflicker.py /tmp/stab /tmp/clean $N
python3 audio_pile.py /tmp/raw.wav && ffmpeg -y -i /tmp/raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 /tmp/audio.wav
python3 render_anim.py /tmp/clean ../episodes/05_anim/pile/Exposition_9_secondes.csv /tmp/pile.mp4 /tmp/audio.wav --impact=6.52,14 --zoom=1.0,1.05 --center=470,880 --swap=E01:E03 --swap=E02:E04
```
