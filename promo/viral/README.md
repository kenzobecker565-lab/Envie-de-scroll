# Vidéo virale Scroll-up (25 secondes)

▶️ **[Voir la vidéo](scroll-up-viral.mp4)** (MP4, 1080 × 1920, 60 images/s, musique et bruitages, sans voix off)

Une vidéo courte pensée pour TikTok, Reels et Shorts, construite avec les codes des formats qui circulent :

- **une accroche chiffrée dès la première image** : « On passe 2 MOIS par an devant nos écrans. » Source : 4 h par jour en moyenne, [Baromètre du numérique 2025](https://www.arcep.fr/uploads/tx_gspublication/barometre-du-numerique_edition_2025_INFOGRAPHIE_mars2025.pdf) (CREDOC pour l'Arcep, l'Arcom, le CGE et l'ANCT) ; 4 h × 365 = 1 460 h ≈ 61 jours ;
- **une situation que tout le monde reconnaît** : le fil qui défile, poussé par un doigt, sur la batterie ;
- **une pause**, calée sur le break de la musique : « Et si chaque envie de scroller… devenait 5 min de création ? » ;
- **la vraie app**, filmée, dans le même téléphone : un bouton, trois taps, une activité, un dessin, des pièces d'or, le palier « 2 heures », les quatre thèmes ;
- **des sous-titres énormes, mot à mot**, pour les gens qui regardent sans le son ;
- **une fin qui renvoie au début** (« 2 mois par an… Reprends-en un peu. ») et l'appel à l'action, `@scrollup_bot`, hors des zones couvertes par l'interface des réseaux.

## Le déroulé (calé sur la musique, 120 BPM)

| Temps | Ce qu'on voit | Ce qu'on entend |
| --- | --- | --- |
| 0 → 3,7 s | Un calendrier : novembre et décembre sont avalés par un téléphone. « On passe 2 MOIS par an devant nos écrans. » | Deux notifications, puis un gros impact sur « 2 MOIS ». La musique monte. |
| 3,7 → 7,7 s | La nuit, un téléphone, un fil sans fin poussé par un doigt, de plus en plus vite. « Scroll. Scroll. Encore un. Et si ton pouce faisait autre chose ? » | La batterie entre ; un balayage par post. |
| 7,7 → 9,7 s | Tout se fige et se décolore. « Et si chaque envie de scroller… devenait 5 min de création ? » | Le break de la musique, une horloge qui fait tic-tac, une montée. |
| 9,7 → 21,2 s | Éclair blanc : le logo, et la vraie app dans le téléphone. Le doigt appuie sur chaque temps : le gros bouton, l'humeur, le temps, la passion ; l'activité ; la photo du dessin ; « Activité enregistrée. », les pièces qui jaillissent, le palier. | Un clic à chaque tap, le déclic de la photo, les pièces, les confettis, un carillon. La basse entre sur l'activité. |
| 21,2 → 23,2 s | La galerie dans les quatre thèmes (Pop, Pop Nuit, BD, Memphis), un par temps, le fond change avec. | Un fouet et un déclic à chaque changement. |
| 23,2 → 25,8 s | « 2 mois par an… Reprends-en un peu. » L'icône, « scroll-up », « @scrollup_bot », « Gratuit, dans Telegram. » | L'accord final, puis la musique se retire. |

## Médias et crédits

- **Musique** : morceau original libre de droits, généré avec [vidIQ](https://vidiq.com) (`media/musique-vidiq.mp3`, 61 s ; la vidéo en utilise les 25 premières secondes).
- **Bruitages** : tous synthétisés dans `audio.mjs` (aucun sample).
- **Images de l'app** : filmées par `capture-take.mjs` sur l'app elle-même (profil de démonstration, en local).
- **Pas de voix off** : les voix disponibles (ElevenLabs, via vidIQ) sont des voix anglaises, qui gardent l'accent en français.

## Refaire la vidéo

Prérequis : ceux des autres pubs (voir `../README.md`), et l'app lancée en local (`npm run dev` à la racine du dépôt), pour le tournage.

```bash
cd promo
node viral/capture-take.mjs           # 1. filme l'app → build/viral/take/, marks.json, themes/
npm run viral:render                  # 2. bande-son + 1 548 images → build/viral/scroll-up-viral.mp4
```

| Commande | Rôle |
| --- | --- |
| `node viral/capture-take.mjs` | Crée un profil de démonstration (6 activités, 110 pièces), puis joue le parcours en temps réel pendant que Chromium enregistre l'écran (780 × 1688). Les images sont rééchantillonnées à 30 images/s ; `marks.json` donne l'image de chaque moment et la position de chaque tap. |
| `npm run viral:render` | Rendu complet (`-- --workers=N`) |
| `npm run viral:audio` | Refait seulement la bande-son dans la vidéo déjà rendue |
| `npm run viral:stills` | Quelques images clés dans `build/viral/stills/` |

## Modifier la vidéo

- **Le rythme** : `cues.js`. Les instants sont ceux de la musique ; les taps tombent sur ses temps (`beat(n)`).
- **Le montage de l'app** : `cuts` dans `main.js` associe chaque moment de la vidéo à un passage du tournage (par ses repères de `marks.json`).
- **Les sous-titres** : `buildCaptions()` dans `main.js`. Chaque sous-titre est une liste de morceaux ; un morceau coloré (`'accent'`, `'warm'`, `'sky'`, `'good'`, `'lilac'`) devient un sticker.
- **Le son** : `score()` dans `audio.mjs`. `ducks` règle les moments où la musique s'efface sous un impact.
