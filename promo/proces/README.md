# « Le procès : à toi de juger » (3D, motion design)

▶️ **[Voir la vidéo](proces.mp4)** (MP4, 1080 × 1920, 30 images/s, environ 1 min 35 s, avec voix, musique et bruitages)

Une vidéo verticale (Reels / TikTok / Shorts) qui met en scène un procès d'assises sur l'**aide à mourir**, puis laisse le public trancher en commentaire : coupable ou non coupable ? Le verdict n'est jamais donné.

L'affaire est **inventée** (Paul, 79 ans, a aidé Anne, sa femme atteinte de la maladie de Charcot, à mourir). Le cadre juridique est réel : en France, l'aide active à mourir est interdite, et la loi Claeys-Leonetti permet la sédation profonde et continue en fin de vie, décidée avec des médecins. Les arguments sont équilibrés exprès, pour que les avis se partagent. Aucun geste n'est montré ni décrit en détail.

## Le déroulé

| Temps | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| 0 → 9 s | Narrateur : « Paul et Anne étaient mariés depuis cinquante-deux ans… » | Titre « LE PROCÈS ». Paul et Anne, main dans la main, un cœur, le compteur « 52 ANS ». |
| 9 → 17 s | « Anne souffrait de la maladie de Charcot… Une nuit… » | Chambre d'hôpital, moniteur cardiaque. « BOUGER », « MANGER », « RESPIRER » se barrent. La nuit tombe, la lampe s'éteint, le moniteur s'arrête, le téléphone affiche « 17 ». |
| 17 → 21 s | « Aujourd'hui, il est jugé pour assassinat. » Juge : « L'audience est ouverte. » | La salle d'audience. Tampon « ASSASSINAT ». Coup de marteau. La jauge « COUPABLE ↔ NON COUPABLE » apparaît. |
| 21 → 80 s | Le débat : procureur et avocate de la défense, chacun leur tour. | La caméra passe d'un orateur à l'autre, sous un projecteur. Les preuves apparaissent en 3D : calendrier jusqu'au jour 21, onze bulles, berceau, téléphone « 17 », croix médicale. Les étiquettes « 3 SEMAINES », « 11 FOIS », « 79 ANS » et les citations en grand. La jauge bascule après chaque argument. |
| 80 → 82 s | Juge : « Les débats sont clos. » | Gros plan sur le marteau. |
| 82 s → fin | Narrateur : « Le jury, c'est toi. Coupable… ou non coupable ? » | Paul seul dans le box, dans le noir. « COUPABLE » / « NON COUPABLE », « Ton verdict en commentaire ». |

## Comment c'est fait

- **Les voix** : quatre voix ElevenLabs, générées avec [vidIQ](https://vidiq.com) : narrateur « George », juge « Bill », procureur « Adam », avocate « Sarah ». Chaque personnage est lu d'une traite (`media/<personnage>.mp3`), pour une intonation naturelle. `voix.py` resserre le rythme, retrouve chaque réplique avec Whisper et la découpe (`voice/<id>.wav`). Il enchaîne ensuite le dialogue et écrit `timeline.json` (départ de chaque réplique, instant de chaque mot).
- **L'image** : `main.js`, en 3D avec Three.js. La salle d'audience, la chambre et les mannequins en bois (robes rouges du juge et du procureur, robe noire et rabat blanc de l'avocate) sont faits à partir de formes simples. Le motion design (étiquettes, citations, jauge, volets, sous-titres mot à mot, nom de l'orateur) est en HTML par-dessus.
- **Le son** : `audio.mjs`. Musique originale synthétisée (piano et cordes en ré mineur, battement de cœur pendant le débat) et bruitages (moniteur, téléphone, marteau, tampon, pages…).
- **Les repères** : `cues.js` (coupes, coups de marteau, valeurs de la jauge), partagés par l'image et le son.

## Refaire la vidéo

```bash
cd promo
npm install
npm run pr:render        # → build/proces/proces.mp4 (environ 30 minutes)
```

| Commande | Rôle |
| --- | --- |
| `npm run pr:render` | Rendu complet (bande-son, images, encodage) |
| `npm run pr:audio` | Refait seulement la bande-son de la vidéo déjà rendue |
| `npm run pr:stills` | Quelques images clés dans `build/proces/stills/` |
| `npm run pr:voice` | Redécoupe les voix et recalcule `timeline.json` (`pip install faster-whisper`) |

## Modifier la vidéo

- **Le texte** : `script.json` (une entrée par réplique, avec son personnage et le silence `gap` avant elle). Regénère ensuite la voix du personnage concerné (tout son texte, d'une traite) dans `media/<personnage>.mp3`, puis lance `npm run pr:voice`.
- **La jauge** : les valeurs après chaque argument sont dans `cues.js` (`balance`, de −1 « coupable » à +1 « non coupable »).
- **Les plans** : le tableau `plan` de la section « tribunal » dans `main.js` (qui est filmé, à quel moment), et `SHOTS` (où se place la caméra).

**Droits des voix.** Elles ont été générées avec vidIQ (ElevenLabs), comme celles des autres pubs : vérifie les conditions de ton abonnement avant une diffusion commerciale.
