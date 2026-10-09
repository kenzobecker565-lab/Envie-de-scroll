# Pub Scroll-up (30 secondes, motion design)

▶️ **[Voir la vidéo](scroll-up-pub-30s.mp4)** (MP4, 1080 × 1920, 60 images/s, avec musique et bruitages, sans voix off)

Une pub verticale pour Reels, TikTok et Shorts, dans le style « Pop » de l'app : gros contours, ombres pleines, stickers penchés, couleurs franches. Tout est fait en code, l'image comme le son :

- l'animation est une page web (`index.html`, `main.js`, `style.css`), pilotée par le moteur déterministe des autres pubs (`../engine.js`) ;
- la musique et les bruitages sont synthétisés (`audio.mjs`), sans aucun sample : les droits sont donc libres ;
- `../render.mjs` photographie la page image par image et assemble le MP4 avec ffmpeg (sonie de −14 LUFS, le standard des réseaux sociaux).

Les couleurs, les polices, le logo, les pictogrammes, les textes et les écrans montrés sont ceux de l'app (`app/src/styles/index.css`, `lucide-react`).

## Le déroulé (15 mesures à 120 BPM)

Toutes les coupes et tous les impacts tombent sur les temps de la musique. Aucun texte n'est dit : tout le message passe par l'écran, pour les gens qui regardent sans le son.

| Temps | Ce qu'on voit | Ce qu'on entend |
| --- | --- | --- |
| 0 → 3 s | La nuit, un téléphone. « 23h47. Encore un scroll ? » Un doigt pousse le fil, post après post, puis s'affole ; le fil ralentit et se fige. | Un lo-fi étouffé « à travers le haut-parleur du téléphone », des balayages sur la vitre, des notifications. La musique ralentit comme une bande qui s'arrête. |
| 3 → 4 s | « STOP. » en sticker tomate. Il grandit et devient le gros bouton de l'app ; la couleur envahit l'écran. | Un scratch, un impact sec, un silence… puis une montée et un roulement. |
| 4 → 8 s | L'accueil de l'app : « Ton pouce te démange ? ». Les stickers des passions se collent. Un doigt appuie sur « J'ai envie de scroller » ; le bouton s'enfonce dans son ombre, puis envahit l'écran. | Le drop. Trois pops (do, mi, sol), le clic du bouton avec son retour haptique, une montée. |
| 8 → 10 s | Le tomate se referme en bouée : « On a reçu ton signal de détresse pré-scroll. » puis « On s'occupe de toi. » | Demi-temps, une petite sirène de jouet, une claque de sticker. |
| 10 → 14 s | Trois taps : l'humeur (« Je procrastine »), le temps (5 minutes), la passion (Dessin). | Le groove repart, avec un marimba. Un pop par choix, un clic et une clochette par tap, quatre stickers qui claquent. |
| 14 → 18 s | « Dessine un objet de ton bureau. » : le crayon dessine une tasse. L'écran recule sur les quatre passions (écriture, musique, cinéma). « Crée au lieu de scroller. » | Le sifflet (la mélodie) entre. Le crayon gratte, le stylo tapote, une guitare, un clap de cinéma. |
| 18 → 22 s | « Activité enregistrée. +5 minutes ajoutées à ton total. » Le tampon, cinq pièces qui tombent une à une dans le compteur (123 → 128), les confettis, « 1 minute = 1 pièce d'or ». | Les cuivres. Le tampon, une pièce et un déclic par minute, le canon à confettis, un carillon. |
| 22 → 26 s | La galerie, « Pas de calendrier. Pas de culpabilité. », puis « Ton style. » : Pop Nuit, BD, Memphis, un thème par temps fort. | Des coupures avant chaque changement de thème, un coup de fouet et un déclic d'appareil photo. |
| 26 → 30 s | L'icône de l'app, « scroll-up », « Transforme ton envie de scroller en 5 minutes de création. », le bouton « @scrollup_bot sur Telegram », sur lequel un doigt appuie. | Le refrain, un roulement, le clic, et l'accord final de do avec les confettis. |

## Refaire la vidéo

Prérequis : les dépendances de l'app installées à la racine du dépôt (`npm install`, pour les pictogrammes), celles de `promo/` (`npm install`, polices et Playwright), Chromium pour Playwright et [ffmpeg](https://ffmpeg.org) (dans le `PATH`, ou désigné par la variable `FFMPEG`).

```bash
cd promo
npm install
npm run scrollup:render           # → build/scrollup/scroll-up-pub-30s.mp4
```

| Commande | Rôle |
| --- | --- |
| `npm run scrollup:render` | Rendu complet : bande-son, 1 800 images, encodage H.264 + AAC (−14 LUFS). `-- --workers=N` règle le nombre d'onglets qui rendent en parallèle |
| `npm run scrollup:audio` | Refait seulement la bande-son et la remplace dans la vidéo déjà rendue : quelques secondes |
| `npm run scrollup:stills` | Quelques images clés en PNG dans `build/scrollup/stills/` |
| `npm run scrollup:sheet` | Planche contact (une image toutes les 0,5 s) dans `build/scrollup/planche.png` |
| `npm run scrollup:icons` | Régénère `icons.js` à partir de `lucide-react` (après avoir ajouté un pictogramme à la liste) |
| `node scrollup/audio.mjs` | Seulement la bande-son, dans `build/scrollup/audio.wav` |

Pour regarder l'animation dans le navigateur, avec une barre de lecture et le son, sers le dépôt depuis la racine avec n'importe quel serveur statique (par exemple `npx serve .`) et ouvre `/promo/scrollup/`. Le son de l'aperçu est `build/scrollup/audio.wav` : génère-le d'abord avec `node scrollup/audio.mjs`.

## Modifier la pub

- **Le rythme** : tous les instants clés sont dans `cues.js`, partagés par l'image et le son. Déplacer un repère décale les deux ensemble.
- **Les scènes** : `main.js`, une fonction par scène (`buildS1` à `buildS8`). Les textes sont écrits en clair dans chaque scène.
- **Les couleurs et les thèmes** : `style.css` reprend les jetons de l'app (Pop, Pop Nuit, BD, Memphis), agrandis ×2,7.
- **La musique** : la fonction `score()` de `audio.mjs`. La grille d'accords (do, sol, la mineur, fa) avance d'une mesure toutes les 2 s. Chaque section est une suite d'appels à `grooveBar()`, avec ses options : marimba, sifflet, shaker, cuivres, trous avant les changements de thème. La mélodie du sifflet est dans `HOOK`.
- **Remplacer la musique** par un morceau externe (par exemple généré avec Suno ou Udio), choisi à 120 BPM avec un drop à 4 s pour que les impacts restent calés :
  - dans `score()`, garde les bruitages et retire les appels `grooveBar()` ;
  - lis le fichier WAV avec `readWav` (dans `../dsp.mjs`) et ajoute-le au bus `music`.
