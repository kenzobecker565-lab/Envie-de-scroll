# « Le procès : à toi de juger » — le maire Robin des Bois (3D, motion design)

▶️ **[Voir la vidéo](proces.mp4)** (MP4, 1080 × 1920, 30 images/s, 2 min, avec voix, musique et bruitages)

Une vidéo verticale (Reels / TikTok / Shorts) qui met en scène un procès, puis laisse le public trancher en commentaire : coupable ou non coupable ? Le verdict n'est jamais donné.

**L'affaire est inventée.** Marc Delmas, maire depuis dix-huit ans, a détourné trois millions d'euros d'argent public, avec de fausses factures, pour garder ouverte la maternité de sa ville. Le cadre juridique est réel : en France, le détournement de fonds publics par un élu est puni de dix ans de prison (article 432-15 du Code pénal). Le dilemme est construit pour diviser : voler pour une bonne cause, est-ce que ça reste voler ? Chaque argument retourne le précédent, pour que le spectateur change d'avis en cours de route.

## Le déroulé

| Temps | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| 0 → 9 s | **L'accroche.** « Cet homme a volé trois millions d'euros d'argent public. Et toute sa ville est dans la rue pour le défendre. Dans deux minutes, c'est toi qui décides s'il va en prison. » | L'accusé dans le noir, le compteur qui monte jusqu'à « 3 000 000 € ». Coupe sur la foule devant la mairie (« LIBÉREZ DELMAS »). « C'EST TOI QUI DÉCIDES », un compte à rebours. |
| 9 → 27 s | **Les faits, en montage rapide** (coupes en flash). | La mairie et le maire en écharpe tricolore (« 18 ANS DE MANDAT »). La maternité et le tampon « FERMETURE ». La route de 70 km. Les billets qui passent de la mairie à la maternité, les fausses factures qui s'empilent. « 10 ANS DE PRISON ». |
| 27 → 103 s | **Le procès.** Le juge ouvre l'audience. Procureur et avocate se répondent. | La caméra passe d'un orateur à l'autre, sous un projecteur, avec des réactions de l'accusé. Les preuves arrivent en 3D : pile de factures (« 47 »), couronne (« C'EST UN ROI »), berceau (« 312 BÉBÉS », « 3 VIES »), affiche de campagne (« 300 000 € »), pièces (« 380 000 € DE SA POCHE », « BILAN POUR LUI : −80 000 € »). « Regardez dehors » : retour sur la foule. Phrases-chocs en grand. La jauge « COUPABLE ↔ NON COUPABLE » bascule après chaque argument. |
| 103 s → fin | « Les débats sont clos. » Puis : « Tu es le juré. Coupable… ou non coupable ? Et toi, à sa place, tu aurais laissé fermer la maternité ? » | Coup de marteau. L'accusé seul dans le box. « COUPABLE » / « NON COUPABLE ». |

## Comment c'est fait

- **Les voix** : quatre voix ElevenLabs, générées avec [vidIQ](https://vidiq.com) : narrateur « George », juge « Bill », procureur « Adam », avocate « Sarah ». Chaque personnage est lu d'une traite (`media/<personnage>.mp3`), pour une intonation naturelle. `voix.py` resserre le rythme, retrouve chaque réplique avec Whisper et la découpe (`voice/<id>.wav`). Il enchaîne ensuite le dialogue et écrit `timeline.json` (départ de chaque réplique, instant de chaque mot).
- **L'image** : `main.js`, en 3D avec Three.js. La salle d'audience, la mairie, la maternité, la foule et les mannequins en bois (robes du juge, du procureur et de l'avocate, costume et écharpe du maire) sont faits à partir de formes simples. La salle d'audience et la foule sont des « décors partagés », construits une fois et réutilisés par plusieurs scènes. Le motion design (compteurs, étiquettes, phrases-chocs, jauge, nom de l'orateur, sous-titres mot à mot, volets et flashs) est en HTML par-dessus.
- **Le son** : `audio.mjs`. Musique originale synthétisée (ambiance thriller judiciaire : basse pulsée, cordes et percussions graves en ré mineur, tic-tac pour l'accroche et le vote) et bruitages (clameur de la foule, tampon, factures, pièces, marteau…).
- **Les repères** : `cues.js` (scènes et transitions, coups de marteau, valeurs de la jauge), partagés par l'image et le son.

## Refaire la vidéo

```bash
cd promo
npm install
npm run pr:render        # → build/proces/proces.mp4 (environ une heure)
```

| Commande | Rôle |
| --- | --- |
| `npm run pr:render` | Rendu complet (bande-son, images, encodage). `-- --workers=N` règle le nombre d'onglets en parallèle |
| `npm run pr:audio` | Refait seulement la bande-son de la vidéo déjà rendue |
| `npm run pr:stills` | Quelques images clés dans `build/proces/stills/` |
| `npm run pr:voice` | Redécoupe les voix et recalcule `timeline.json` (`pip install faster-whisper`) |

## La marque « Affaire Classée ? » (@affaireclassee0)

`marque.html` dessine la photo de profil et les deux calques de la vidéo. `marque.mjs` les photographie dans `marque/` et les incruste dans la vidéo avec ffmpeg, sans refaire le rendu 3D :
- **le bandeau** : le petit tampon « AFFAIRE CLASSÉE ? » en haut, pendant toute la vidéo ;
- **la signature** : le tampon en grand et le pseudo, sur l'écran de vote.

| Commande | Rôle |
| --- | --- |
| `npm run pr:marque` | Photo de profil (`marque/photo-de-profil.png`) et calques PNG |
| `npm run pr:marque-video` | Incruste les calques : `build/proces/proces.mp4` → `build/proces/proces-marque.mp4` |

## Modifier la vidéo

- **Le texte** : `script.json` (une entrée par réplique, avec son personnage et le silence `gap` avant elle). Regénère ensuite la voix du personnage concerné (tout son texte, d'une traite) dans `media/<personnage>.mp3`, puis lance `npm run pr:voice`.
- **Le rythme du montage** : les scènes et leurs transitions (`wipe` ou `flash`) sont dans `cues.js`.
- **La jauge** : les valeurs après chaque argument sont dans `cues.js` (`balance`, de −1 « coupable » à +1 « non coupable »).
- **Les plans du procès** : le tableau `plan` des sections « tribunal » et « tribunal2 » dans `main.js` (qui est filmé, à quel moment), et `SHOTS` (où se place la caméra).

**Droits des voix.** Elles ont été générées avec vidIQ (ElevenLabs), comme celles des autres pubs : vérifie les conditions de ton abonnement avant une diffusion commerciale.
