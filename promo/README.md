# Pub de 15 secondes (motion design)

Une pub verticale (1080 × 1920, 60 images/s, format Reels / TikTok / Shorts) pour présenter Plutôt Que Scroller. Tout est fait en code, image et son :

- l'animation est une page web (`index.html`, `main.js`, `style.css`) pilotée par un petit moteur déterministe (`engine.js`) ;
- la musique et les bruitages sont synthétisés (`audio.mjs`), sans aucun sample ;
- `render.mjs` photographie la page image par image et assemble le MP4 avec ffmpeg.

Les couleurs, les polices, le logo et les activités montrées sont ceux de l'app.

## Le déroulé (8 mesures à 128 BPM)

| Temps | Mesures | Ce qu'on voit |
| --- | --- | --- |
| 0 → 1,9 s | 1 | Un fil d'actualité qui défile de plus en plus vite. « Tu scrolles. Encore. » Le compteur de temps d'écran s'emballe. |
| 1,9 → 3,75 s | 2 | Arrêt net, tout se fige. « Cette envie-là ? » Le bouton de l'app, « J'ai envie de scroller », apparaît ; un doigt appuie. « Transforme-la. » |
| 3,75 → 9,4 s | 3 à 5 | Le bouton explose en couleurs. Six humeurs, six passions, six vraies activités de la bibliothèque : Dessine (un chat tracé au crayon), Filme (clap, pellicule, étoiles), Écris (un carnet de titres), Joue (égaliseur calé sur la musique), Bouge (un personnage qui secoue son stress), Cuisine (une galette qui se retourne). |
| 9,4 → 11,25 s | 6 | On recule : tout ça se passait dans l'app, qui montre la progression. « Chaque envie compte. » |
| 11,25 → 13,1 s | 7 | « Scrolle moins. » Le crayon barre « Scrolle ». « Crée plus. » |
| 13,1 → 15 s | 8 | L'écran entier se replie en icône d'app. Logo, promesse, bouton. |

## Refaire la vidéo

Prérequis : les dépendances de l'app installées à la racine (`npm install`, pour les polices), Chromium pour Playwright et [ffmpeg](https://ffmpeg.org) (dans le `PATH`, ou désigné par la variable `FFMPEG`).

```bash
cd promo
npm install
npx playwright install chromium   # une seule fois
npm run render                    # → build/plutot-que-scroller-15s.mp4
```

| Commande | Rôle |
| --- | --- |
| `npm run render` | Rendu complet : bande-son, 900 images, encodage H.264 + AAC (sonie −14 LUFS) |
| `npm run stills` | Quelques images clés en PNG dans `build/stills/` |
| `npm run sheet` | Planche contact (une image toutes les 0,25 s) dans `build/planche.png` |
| `node audio.mjs` | Seulement la bande-son, dans `build/audio.wav` |

Pour regarder l'animation dans le navigateur (avec une barre de lecture), sers le dépôt avec n'importe quel serveur statique depuis la racine (par exemple `npx serve .`) et ouvre `/promo/`. Le son de l'aperçu est `build/audio.wav` : génère-le d'abord avec `node audio.mjs`.

## Modifier la pub

- **Le rythme** : tous les instants clés sont dans `cues.js`, partagés par l'image et le son. Déplacer un repère décale les deux ensemble.
- **Les textes et les passions** : le tableau `SCENES` en haut de `main.js` (verbe, humeur, couleur, activité). Chaque scène a son illustration animée (`illusDessine`, `illusFilme`…).
- **La musique** : la fonction `score()` de `audio.mjs` (accords, rythmes, bruitages, dans l'ordre du déroulé).
- **Le moteur** : `tw(élément, début, durée, { propriété: [départ, arrivée] }, courbe)` anime une propriété ; `onFrame((t) => …)` ajoute une animation calculée à chaque image. Tout est une fonction du temps : on peut afficher n'importe quelle image dans n'importe quel ordre.
