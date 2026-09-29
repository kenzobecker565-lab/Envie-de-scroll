# La pub (28 secondes)

▶️ **[Voir la vidéo](plutot-que-scroller-pub.mp4)** (MP4, 1080 × 1920, 60 images/s, avec voix off, musique et bruitages)

Une vraie pub verticale pour Reels, TikTok et Shorts. Elle reprend les codes des pubs qui marchent aujourd'hui sur ces réseaux :

- **une accroche qui se déguise en contenu** : la pub commence comme une vidéo du fil (« Si tu vois cette vidéo… c'est que tu scrolles encore ») ;
- **des sous-titres mot à mot**, en gros, avec les mots clés en couleur, pour les gens qui regardent sans le son ;
- **des coupes calées sur les temps de la musique**, et la révélation de la marque sur le drop ;
- **la vraie app en démo**, avec les appuis du doigt, puis **de vraies vidéos** des passions (dessin, musique, cuisine, sport) ;
- **un appel à l'action** à la fin (« Essaie l'appli », « Lien en bio »), placé hors des zones couvertes par l'interface des réseaux.

## Le déroulé

| Temps | Ce qu'on voit | Ce qu'on entend |
| --- | --- | --- |
| 0 → 3,6 s | Un faux fil d'actualité qui défile de plus en plus vite. La notification « Temps d'écran » s'emballe. | « Si tu vois cette vidéo… c'est que tu scrolles encore. » Swipes, tintement, compteur. |
| 3,6 → 7,4 s | Tout se fige et devient gris. Le bouton de l'app « J'ai envie de scroller » apparaît et bat comme un cœur ; un doigt appuie. | La musique s'arrête comme une bande qui ralentit. « Et si cette envie devenait un truc que t'aimes vraiment ? » La musique revient, étouffée, et monte ; un temps de silence ; « Voici… » |
| 7,4 → 8,9 s | Le bouton explose, le logo apparaît et « scroller » est barré. | Le drop tombe sur « Plutôt Que Scroller ». |
| 8,9 → 15 s | La démo dans un téléphone, avec les vraies captures de l'app : bouton, humeur, passion, durée, activité. La carte de l'activité sort de l'écran. | « Un bouton, ton humeur… et l'appli te propose une activité créative, liée à ta passion. » Un clic à chaque appui. |
| 15 → 19,8 s | Quatre vraies vidéos, une par passion, avec une transition différente à chaque fois. Puis une grille 2 × 2 et un minuteur. | « Dessin, musique, cuisine, sport : cinq, quinze ou trente minutes. » |
| 19,8 → 23,1 s | L'écran « Envie transformée ! », puis la page de progression avec deux autocollants : 13 envies transformées, et la série qui grimpe jusqu'à 5 jours. | « Et chaque envie transformée fait grimper ta série ! » |
| 23,1 → 28 s | Une bande tomate balaie l'écran et dévoile la signature, puis le bouton « Essaie l'appli ». | « Plutôt Que Scroller. Ta prochaine envie, fais-en quelque chose. » Dernier coup de musique. |

## Médias et crédits

- **Voix off** : générée avec [vidIQ](https://vidiq.com) (voix ElevenLabs « Liam »), fichier `media/voix-off.mp3`.
- **Musique** : morceau original libre de droits, généré avec vidIQ, fichier `media/musique.mp3`. Son drop est calé sur « Plutôt » (voir `timeline.js`).
- **Bruitages** : tous synthétisés dans `audio.mjs` (aucun sample).
- **Vidéos** : clips [Pexels](https://www.pexels.com/fr-fr/license/), libres d'utilisation. L'attribution n'est pas obligatoire, mais elle est appréciée :

| Clip | Vidéo | Auteur |
| --- | --- | --- |
| `hook-fille` | [Side view of a girl scrolling on her phone](https://www.pexels.com/video/side-view-of-a-girl-scrolling-on-her-phone-9785298/) | Ron Lach |
| `hook-lit` | [A woman lying in bed using her phone](https://www.pexels.com/video/a-woman-lying-in-bed-using-her-phone-9787494/) | Marcus Aurelius |
| `dessin` | [A person sketching designs](https://www.pexels.com/video/a-person-sketching-designs-7140117/) | Michael Burrows |
| `musique` | [Guy playing acoustic guitar](https://www.pexels.com/video/guy-playing-acoustic-guitar-5058653/) | Tima Miroshnichenko |
| `cuisine` | [Flipping a pancake from the pan using fork](https://www.pexels.com/video/flipping-a-pancake-from-the-pan-using-fork-3704774/) | cottonbro studio |
| `sport` | [A man running in the park](https://www.pexels.com/video/a-man-running-in-the-park-7877146/) | MART PRODUCTION |

Les mêmes informations sont dans `credits.json`. Les clips ne sont pas versionnés : ils sont trop lourds pour le dépôt.

## Refaire la vidéo

Prérequis : les dépendances de l'app installées à la racine (`npm install`, pour les polices et pour lancer l'app), les dépendances de `promo/` (`npm install`, `npx playwright install chromium`) et [ffmpeg](https://ffmpeg.org) (dans le `PATH`, ou désigné par la variable `FFMPEG`).

1. **Les captures de l'app.** À la racine du dépôt, lance l'app (`npm run dev`). Puis, dans `promo/`, lance `npm run pub:capture`. Le script parcourt l'app comme une vraie personne, écran par écran, en haute définition. Il crée `build/pub/app/*.png` et `zones.json`, qui donne la position des éléments touchés.
2. **Les clips.** Télécharge les six vidéos Pexels ci-dessus en HD. Range-les dans `build/pub/broll/` en les nommant d'après la première colonne du tableau (`hook-fille.mp4`, `dessin.mp4`…).
3. **Les médias.** `npm run pub:prepare` découpe les passages utiles des clips (`clips.js`) en images 1080 × 1920. Il décode aussi la voix et la musique.
4. **Le rendu.** `npm run pub:render` produit `build/pub/plutot-que-scroller-pub.mp4` : bande-son, 1 680 images, puis encodage H.264 + AAC avec une sonie de −14 LUFS.

| Commande | Rôle |
| --- | --- |
| `npm run pub:render` | Rendu complet (`-- --workers=N` : nombre d'onglets qui rendent en parallèle, 3 par défaut) |
| `npm run pub:audio` | Refait seulement la bande-son et la remplace dans la vidéo déjà rendue |
| `npm run pub:stills` | Quelques images clés en PNG dans `build/pub/stills/` |
| `npm run pub:sheet` | Planche contact (une image toutes les 0,5 s) dans `build/pub/planche.png` |
| `node pub/audio.mjs` | Seulement la bande-son, dans `build/pub/audio.wav` |

Pour regarder l'animation dans le navigateur, avec une barre de lecture et le son, sers le dépôt depuis la racine avec n'importe quel serveur statique (par exemple `npx serve .`). Ouvre ensuite `/promo/pub/`. Le son de l'aperçu est `build/pub/audio.wav` : génère-le d'abord avec `node pub/audio.mjs`.

## Modifier la pub

- **Le rythme** : `timeline.js` réunit tous les instants clés, partagés par l'image et le son.
  - Les coupes tombent sur les temps de la musique (`beatAt(n)`, n = 0 pour le drop).
  - Les apparitions de texte suivent les mots de la voix (`vo(t)`).
  - Les sous-titres (`CAPTIONS`) donnent l'instant de chaque mot dans la voix.
- **Les scènes** : `main.js`, une fonction par scène (`buildS1` à `buildS7`), avec le même moteur que la pub de 15 s (`../engine.js`).
- **Le son** : `audio.mjs`.
  - La fonction `score()` place les bruitages, dans l'ordre du déroulé.
  - `musicTrack()` cale la musique, avec l'arrêt de bande, le retour étouffé et la coupure avant le drop.
  - `LEVELS` règle les niveaux de la voix, de la musique et de la nappe.
- **Changer de voix ou de musique** : remplace `media/voix-off.mp3` ou `media/musique.mp3`, puis relance `npm run pub:prepare`. Mets ensuite à jour `timeline.js` :
  - pour une nouvelle voix, `CAPTIONS` et les instants `vo(…)` ;
  - pour une nouvelle musique, son tempo (`TEMPO`) et la position de son drop (`MUSIC_DROP`).
