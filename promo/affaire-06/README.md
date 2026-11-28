# Affaire Classée ? · affaire n°6 : le faux chirurgien (≈ 45 s)

▶️ **[Voir la vidéo](affaire-06.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** Pendant 22 ans, un homme a opéré plus de 3 000 patients sans en perdre un seul. Il n'a jamais été médecin. Il est jugé : il risque jusqu'à 5 ans de prison, la peine prévue pour l'escroquerie (article 313-1 du Code pénal).

**Style A, motion design 2D** (voir `../prototypes/RAPPORT.md`). Il n'y a pas de jauge « coupable / non coupable », pour ne pas influencer le vote. Les sous-titres sont gros et animés : chaque mot rebondit à son arrivée, et le mot prononcé passe dans un bloc de couleur.

## Le déroulé

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| L'accroche | « 3 000 opérations. 22 ans de carrière. Pas un seul patient perdu. » | Le bloc opératoire : le chirurgien (calot, masque baissé, gants), le moniteur cardiaque, le compteur qui défile jusqu'à 3 000, le tampon « 0 PATIENT PERDU ». |
| La chute | « Un détail : il n'a jamais été médecin. » | La musique se tait. Son diplôme encadré se déchire, avec le tampon « FAUX ». |
| Le box | « Ce matin, il risque 5 ans de prison. » | L'accusé dans le box, « 5 ANS DE PRISON ». |
| Le procès | Procureur et avocate se répondent. | Chaque réplique a son plan, ses accessoires et ses mots-clés : les lits des « 3 000 patients endormis », la riposte de l'avocate en grand, le dé de la chance, l'électrocardiogramme des « cas désespérés », « PAS LES DIPLÔMÉS. LUI. », la blouse, et la balance entre « un bout de papier » et « leur vie ». |
| Le vote | « Tu es le juré. Coupable… ou non coupable ? Et toi, tu l'aurais laissé t'opérer ? » | L'accusé seul dans le noir, « COUPABLE » / « NON COUPABLE ». |

## Fabrication

- **`main.js`** : toute l'animation en SVG. Les personnages viennent de `personnage.js`, le kit 2D du prototype A, auquel j'ai ajouté la tenue de bloc.
- **Voix** : gratuites, générées avec Chatterbox (`../voix-libres`). `voix.py` les découpe réplique par réplique et écrit `timeline.json`. `../demo-v2/levres.py affaire-06` calcule ensuite `levres.json`, qui fait bouger les bouches.
- **Son** : `audio.mjs` (musique et bruitages : bips du moniteur, diplôme qui se déchire, tampons, marteau).

```bash
cd promo
cbenv/bin/python voix-libres/generer.py affaire-06 && python voix-libres/choisir.py affaire-06
npm run a6:voice          # timeline.json + levres.json
npm run a6:render         # → build/affaire-06/affaire-06.mp4
npm run a6:marque-video   # → build/affaire-06/affaire-06-marque.mp4
```
