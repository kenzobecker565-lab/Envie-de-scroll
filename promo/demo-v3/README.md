# Démo v3 : vrais personnages 3D (extrait de 5 s)

▶️ **[Voir l'extrait](demo-v3.mp4)** : le même passage que la démo v2 (affaire n°5, de 60,05 s à 65,25 s), avec des personnages 3D professionnels.

## Les personnages et les animations (libres de droits)

Tous les modèles sont de **[Quaternius](https://quaternius.com)**, sous licence **CC0** (domaine public : usage commercial permis, sans obligation de crédit) :

- « [Universal Base Characters](https://quaternius.itch.io/universal-base-characters) » : corps d'homme et de femme, peau claire ou mate, coiffures (raie sur le côté, chignons, cheveux ras, barbe) et sourcils ;
- « [Universal Animation Library](https://quaternius.itch.io/universal-animation-library) » : 43 animations captées sur un squelette Unreal (parler debout, assis, repos, coups, réactions…).

Les fichiers sont dans `assets/`. Les textures ont été réduites à 1 024 px pour alléger le dépôt.

## Comment c'est assemblé (`acteurs.js`)

- **Coiffures et sourcils** : rattachés au squelette du personnage par nom d'os, ils suivent la tête.
- **Animations** : on garde les rotations des os (et la hauteur du bassin), si bien que les proportions du personnage sont conservées. Chaque animation est figée à l'instant voulu, ce qui rend le rendu déterministe. Les gestes d'un bras (désigner, frapper) se superposent au reste du corps.
- **Vêtements** :
  - le pull et le pantalon sont des copies du corps, légèrement gonflées et découpées par zone : ils épousent chaque mouvement ;
  - la robe d'avocat combine des manches ajustées, un buste rigide qui masque la musculature des modèles « super-héros », une jupe évasée et un rabat blanc.
- **Bouche** : les modèles n'ont pas d'os de mâchoire. Une petite ouverture sombre, accrochée à la tête, s'ouvre au rythme de la voix (`../demo-v2/levres.json`).

```bash
cd promo
node render.mjs --ad=demo-v3 --from=60.05 --to=65.25 --out=video.mp4
ffmpeg -i build/demo-v3/video.mp4 -ss 60.05 -t 5.2 -i build/affaire-05/audio.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest build/demo-v3/demo-v3.mp4
node demo-v3/shot.mjs demo-v3/test.html /tmp/essai 1:wide 1:face   # banc d'essai des personnages
```
