# Pub Scroll-up « Envol » (30 secondes, motion design)

▶️ **[Voir la vidéo](scroll-up-envol.mp4)** (MP4, 1080 × 1920, 60 images/s, musique et bruitages, sans voix off)

Une pub verticale (Reels, TikTok, Shorts) construite sur un seul jeu de mots : **Scroll-up, c'est scroller vers le haut**. Elle ne reprend rien des autres pubs : pas de fil d'actu qui défile, pas de sticker « STOP », pas de style Pop. Elle utilise le design actuel de l'app (violet, Nunito), Minuton et les vraies illustrations (`app/public/art/`).

## Le déroulé (120 BPM, une mesure = 2 s)

| Temps | Ce qu'on voit | Ce qu'on entend |
| --- | --- | --- |
| 0 → 4 s | Dans le noir, des minutes jaunes tombent une à une dans un écran de téléphone vide. « Chaque jour, tes minutes tombent dans le vide. » | Un tic-tac, une nappe étouffée, le motif de la signature joué à l'envers (il descend). Une note par minute qui tombe, un « gloup » quand elle disparaît. |
| 4 → 6 s | Tout se fige. Minuton entre et en attrape une : « Sauf celle-là. » | Arrêt de bande, le temps suspendu, un pop et une cloche. |
| 6 → 8 s | « Et si tu scrollais… vers le haut ? » Un pouce trace le geste vers le haut. La gravité s'inverse, les minutes s'envolent, la couleur arrive. | Le motif remonte, une note par mot. Montée, roulement, souffle. |
| 8 → 18 s | Une seule montée de caméra : cinq étages, cinq passions (Dessin, Écriture, Cinéma, Musique, Piano), cinq minutes chacune. Le ciel passe de l'aube à la nuit, Minuton change de pose à chaque étage, le compteur grimpe de 5 minutons par étage. | Le drop. Un étage par mesure, le motif qui grimpe d'accord en accord, cinq pièces à chaque étage. |
| 18 → 21 s | Le sommet, sous l'aurore de l'accueil de l'app : « 25 minutes créées. = 25 minutons gagnés. » « Dépense-les. » Minuton artiste, Minuton pianiste, le thème Crépuscule, Lettre à Élise (les vrais prix de la boutique). | Demi-temps, une cascade de pièces, un pop par tenue. |
| 21 → 25 s | L'app : l'accueil et sa tirette « Swipe Up », le pouce glisse vers le haut, l'activité (« Dessine un objet de ton bureau. ») avec son minuteur et le dessin qui se trace, puis « Bravo ! » et « +5 minutons ». | Le groove allégé, le geste, le minuteur, le crayon. |
| 25 → 30 s | Minuton, « Scroll-up ↑ », « Scrolle vers le haut. », « Disponible sur Telegram », un bouquet de minutes qui montent. | Le motif complet, l'accord final de ré. |

La musique est une version rythmée de la signature de l'app (`../ambiances/signature.mjs` : ré majeur, Dmaj9 – Bm7 – Gmaj9 – Aadd9, motif montant). Tout est synthétisé : aucun sample, donc aucun droit à payer.

## Refaire la vidéo

```bash
cd promo
npm install
npm run envol:render      # → build/envol/scroll-up-envol.mp4
```

| Commande | Rôle |
| --- | --- |
| `npm run envol:render` | Rendu complet (bande-son, 1 800 images, H.264 + AAC à −14 LUFS). `-- --workers=N` règle le parallélisme |
| `npm run envol:audio` | Refait seulement la bande-son de la vidéo déjà rendue |
| `npm run envol:stills` | Images clés dans `build/envol/stills/` |
| `npm run envol:sheet` | Planche contact dans `build/envol/planche.png` |

ffmpeg doit être dans le `PATH` ou désigné par la variable `FFMPEG`.

## Modifier la pub

- **Le rythme** : `cues.js`, partagé par l'image et le son.
- **Les étages** : le tableau `FLOOR_DATA` de `main.js` (passion, texte, pose de Minuton).
- **La caméra** : `MOVES` et `alt(t)` dans `main.js` ; la couleur du ciel suit l'altitude (`SKY`).
- **La musique** : `score()` dans `audio.mjs`.
