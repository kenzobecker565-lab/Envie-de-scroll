# Démo v2 : personnages et animation (extrait de 5 s)

▶️ **[Voir l'extrait](demo-v2.mp4)** : l'affaire n°5 de 60,05 s à 65,25 s (« Cette femme a fini à l'hôpital. » / « Parce que cet homme a choisi de la frapper. »), avec les voix ElevenLabs.

Ce qui change par rapport aux affaires n°1 à 5 :

- **Personnages** (`perso.js`) : visages expressifs (yeux avec iris et reflet, clignements, sourcils, bouche synchronisée sur la voix), mains avec index tendu, coiffures, rabat et revers des robes. Le rendu est en aplats (toon) avec un contour noir.
- **Synchronisation des lèvres** : `levres.py` calcule l'ouverture de la bouche 60 fois par seconde à partir de chaque réplique → `levres.json`.
- **Jeu** : le procureur désigne l'accusée, Sarah baisse les yeux et les ferme, l'avocat lève le poing puis frappe l'air. Les regards suivent l'orateur.
- **Mise en scène** : coups de zoom, caméra à l'épaule, secousses et flash sur les coups, mots qui claquent à l'écran.
- **Ambiance** : rais de lumière, poussière dans l'air, grain de pellicule, vignettage.

```bash
cd promo
python demo-v2/levres.py
node render.mjs --ad=demo-v2 --from=60.05 --to=65.25 --out=video.mp4
ffmpeg -i build/demo-v2/video.mp4 -ss 60.05 -t 5.2 -i build/affaire-05/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest build/demo-v2/demo-v2.mp4
```
