# Short Minuton n°1 : le chat farceur

Short YouTube vertical (1080×1920, 30 i/s, 20 s), sans paroles ni sous-titres. Minuton dessine un chat qui s'enfuit sur la feuille. Le chat se fatigue, Minuton lui dessine un panier, le chat s'endort, puis lui vole son crayon pour en faire son doudou.

Il est fait à partir du pack « Minuton, le chat farceur » préparé avec ChatGPT (dix illustrations, le décor vide et le chat détouré). Le pack n'est pas dans le dépôt.

## Ce qui change par rapport au prototype

- **Montage** : il suit le tempo de la musique (143,5 BPM, un temps = 0,418 s). Chaque plan dure un nombre entier de temps (4, 3, 6, 4, 6, 4, 6, 3, 3, 9), pour 20 s au lieu de 15,7 s, ce qui laisse le temps de comprendre l'histoire.
- **Le chat court vraiment** : il est animé sur le décor vide, avec une foulée qui rebondit, s'étire et se tasse, des traits de vitesse et de la poussière. Il fait un aller-retour, ralentit, transpire et s'arrête.
- **Le panier se dessine trait après trait**, sur une version de la feuille sans panier, avec des étincelles.
- **Effets dessinés à la main** qui « tremblent » à 10 i/s : éclats de surprise, étoile de l'idée, Z du sommeil, éclats pendant le vol du crayon, cœurs et rires à la fin.
- **Caméra** : coups de zoom, panoramiques et léger tremblement sur la surprise et sur le gros plan.
- **Son** : la musique complète, avec une baisse pendant le sommeil et un presque-silence pendant le vol. Les bruitages sont synthétisés et calés à l'image : pas, souffle, pop, cloche de l'idée, crayon qui gratte, pizzicati sur la pointe des pieds, boing. Mixage à -14 LUFS.
- **Fin** : une petite signature Scroll-up apparaît en haut pendant la dernière seconde.

## Refaire le rendu

```bash
D=dossier_de_travail   # contient zip/Pack_Minuton (le pack décompressé) et work/dl/mm.mp3 (la musique complète)
python3 prep.py $D                       # images 1080×1920, chat détouré, panier et feuille sans panier
python3 render.py $D $D/out/video_muette.mp4
ffmpeg -i work/dl/mm.mp3 -t 22 -ac 2 -ar 48000 -f f32le $D/work/mus48.raw
python3 audio.py $D/work/mus48.raw $D/out/mix.wav
ffmpeg -i $D/out/mix.wav -af "volume=5.6dB,alimiter=limit=0.83:attack=4:release=60:level=disabled" $D/out/mix_fort.wav
ffmpeg -i $D/out/video_muette.mp4 -i $D/out/mix_fort.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest $D/out/minuton-short-01.mp4
```

Il faut Pillow, numpy, scipy et opencv-python-headless (`prep.py` s'en sert pour le flou de la feuille). Le ffmpeg doit être complet (voir `docs/MEMOIRE-PROJET.md`).

`render.py <dossier> --frames 0.5,3.2` sort quelques images fixes pour vérifier un plan sans tout recalculer.

## Musique (crédit obligatoire)

« Monkeys Spinning Monkeys », Kevin MacLeod (incompetech.com), sous licence Creative Commons Attribution 4.0 : https://creativecommons.org/licenses/by/4.0/. Source : https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400011.
