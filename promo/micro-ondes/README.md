# « Pourquoi ça chauffe ? Le micro-ondes » (3D, motion design)

▶️ **[Voir la vidéo](micro-ondes.mp4)** (MP4, 1080 × 1920, 30 images/s, environ 1 min 29 s, avec voix off, musique et bruitages)

Une vidéo verticale (Reels / TikTok / Shorts) qui explique le micro-ondes en le **construisant problème après problème** : « Mais… Alors tu… Ça s'appelle… ». Tout est fait en code, image et son :

- les décors sont en **3D** ([Three.js](https://threejs.org)) : objets modélisés à partir de formes simples (cubes arrondis, cylindres, tours), lumières, ombres douces, reflets ;
- le **motion design** est par-dessus : les objets apparaissent en rebondissant, la caméra glisse d'un plan à l'autre, des étiquettes surgissent, les chiffres défilent, des volets de couleur font les transitions et les sous-titres s'affichent mot à mot ;
- la **voix off** est lue d'une traite par la voix ElevenLabs « Liam » (générée avec [vidIQ](https://vidiq.com), comme la pub de 28 s), pour une intonation naturelle d'une phrase à l'autre. `narration.py` resserre le rythme (pauses raccourcies, tempo +5 %) et cale les sous-titres mot à mot avec Whisper ;
- la **musique** (guitare pincée, basse, petite batterie) et les **bruitages** sont synthétisés par `audio.mjs`, sans aucun sample ;
- `../render.mjs` photographie la page image par image (Chromium, WebGL en rendu logiciel) et assemble le MP4 avec ffmpeg.

## Le déroulé

| Scène | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| 1 · Le feu | « Si tu poses ton plat sur le feu… le milieu reste froid. » | Titre, gazinière, flammes. La casserole s'ouvre en coupe : le fond est rouge (brûlant), le centre bleu (froid), la chaleur avance lentement. |
| 2 · L'eau | « Une molécule d'eau, c'est un petit aimant électrique… » | Goutte, molécule H₂O avec ses pôles + et −, flèches du champ électrique qui basculent, la molécule qui suit. Puis 46 molécules qui s'agitent et chauffent, le compteur « 2 450 000 000 fois par seconde », l'onde. |
| 3 · Le magnétron | « Ça s'appelle un magnétron. En 1945… » | Le magnétron se monte pièce par pièce (aimants, ailettes, antenne) et émet. La barre chocolatée fond dans la poche. |
| 4 · La boîte | « Les ondes partent dans tous les sens… cage de Faraday. » | Anneaux d'ondes dans toutes les directions ; le mannequin les reçoit (« ≈ 60 % d'eau »). Cinq plaques de métal arrivent et forment la boîte ; l'onde rebondit sur les parois. |
| 5 · La vitre | « Tu mets une vitre, avec une grille percée de petits trous. » | Le cache s'efface, la vitre et sa grille apparaissent. Gros plan : l'onde de 12 cm rebondit sur la tôle percée, la lumière passe. |
| 6 · Le plateau | « Certains endroits chauffent fort, d'autres pas du tout. » | Vue de dessus : carte de chaleur avec des points chauds et froids (ondes stationnaires). Le plateau tourne et la chaleur s'égalise. |
| 7 · La porte | « Si quelqu'un ouvre la porte en pleine marche ? » | La porte s'ouvre, se referme, devient transparente pour montrer les interrupteurs, se rouvre : tout s'arrête (« STOP »). |
| 8 · La puissance | « À moitié de puissance… il s'allume, s'éteint, et se rallume. » | Le bouton tourne sur 50 %, le magnétron s'allume et s'éteint en rythme (« MARCHE » / « ARRÊT »). |
| 9 · Bravo | « Félicitations, tu as construit un micro-ondes. » | Le micro-ondes complet, confettis, le mannequin saute de joie, puis « DING ! ». |

## Refaire la vidéo

Prérequis : les dépendances de l'app installées à la racine (`npm install`, pour les polices), celles de `promo/` (`npm install`, avec Three.js et Playwright), Chromium pour Playwright, et [ffmpeg](https://ffmpeg.org).

```bash
cd promo
npm install
npx playwright install chromium   # une seule fois (ou CHROMIUM=/chemin/vers/chromium)
npm run mo:render                 # → build/micro-ondes/micro-ondes.mp4
```

| Commande | Rôle |
| --- | --- |
| `npm run mo:render` | Rendu complet : bande-son, environ 2 600 images, encodage H.264 + AAC (−14 LUFS). Comptez 20 à 40 minutes (WebGL en rendu logiciel). `-- --workers=N` règle le nombre d'onglets en parallèle |
| `npm run mo:audio` | Refait seulement la bande-son et la remplace dans la vidéo déjà rendue |
| `npm run mo:stills` | Quelques images clés en PNG dans `build/micro-ondes/stills/` |
| `npm run mo:sheet` | Planche contact (une image toutes les 2 s) |
| `npm run mo:voice` | Recalcule `voice/narration.wav` et `timeline.json` à partir de `media/voix-off.mp3` (voir plus bas) |

Pour regarder l'animation dans le navigateur (avec une barre de lecture), sers le dépôt depuis la racine (`npx serve .`) et ouvre `/promo/micro-ondes/`. Le son de l'aperçu est `build/micro-ondes/audio.wav` : génère-le d'abord avec `node micro-ondes/audio.mjs`.

## Modifier la vidéo

- **La voix off** : le texte des sous-titres, réplique par réplique, est dans `voix.json`. Pour changer de texte ou de voix, génère une nouvelle narration d'une traite (vidIQ / ElevenLabs, ou ta propre voix enregistrée), puis :
  ```bash
  pip install faster-whisper
  cd micro-ondes && python narration.py ma-voix-off.mp3
  ```
  Le script raccourcit les pauses de plus de 0,4 s, accélère de 5 % (`--max-pause`, `--tempo` pour régler), écrit `voice/narration.wav`, retrouve chaque mot de `voix.json` dans l'enregistrement et écrit `timeline.json` (départ de chaque réplique, instant de chaque mot). Sans connexion, `voix.py` synthétise les répliques une par une avec [Piper](https://pypi.org/project/piper-tts/) (voix moins naturelle).
- **Le rythme** : tout est calé sur les mots de la voix. `cues.js` donne les coupes entre les scènes et les repères partagés par l'image et le son (bascules du champ, cycle marche / arrêt, « ding ») ; dans `main.js`, chaque scène cherche ses instants avec `W('05', 'champ')` (le mot « champ » de la réplique 05). Si la voix change, tout suit.
- **Les scènes** : une fonction `section(…)` par décor dans `main.js`, avec ses objets 3D, ses étiquettes, sa caméra (`camAt`) et son animation (`update(t)`, fonction pure du temps).
- **Les modèles** : `makeMicrowave`, `makeMagnetron`, `makeWater`, `makeBuddy` (le mannequin en bois)…
- **Le son** : `audio.mjs` (musique dans `music()`, bruitages dans `score()`).

**Droits de la voix.** La narration a été générée avec vidIQ (voix ElevenLabs « Liam », `media/voix-off.mp3`), comme celle de la pub de 28 s : vérifie les conditions de ton abonnement avant une diffusion commerciale. Pour utiliser ta propre voix, enregistre le texte d'une traite et relance `python narration.py ton-fichier.mp3`, puis `npm run mo:render`.
