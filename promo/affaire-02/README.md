# Affaire Classée ? · affaire n°2 : la mère justicière (≈ 47 s)

▶️ **[Voir la vidéo](affaire-02.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** Une mère dont la fille est harcelée depuis un an a porté plainte trois fois. Les trois plaintes ont été classées sans suite. Elle attend le harceleur devant chez lui et lui casse le nez. Elle risque cinq ans de prison : en France, les violences ayant entraîné plus de huit jours d'incapacité de travail, commises avec préméditation, sont punies de cinq ans de prison (articles 222-11 et 222-12 du Code pénal). Le titre de la série prend ici tout son sens : l'affaire de sa fille a été classée, la sienne ne l'est pas. On ne montre aucun geste violent.

## Le déroulé

| Temps | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| 0 → 3 s | « Sa fille a été harcelée pendant un an. » | Le téléphone de sa fille : un « Inconnu » envoie des insultes de plus en plus vite, le compteur monte jusqu'à 400. « 1 AN DE HARCÈLEMENT ». |
| 3 → 5 s | « Trois plaintes. Trois fois classées sans suite. » | Trois dossiers de plainte tombent sur le bureau ; trois tampons rouges « CLASSÉE SANS SUITE ». |
| 5 → 10 s | « Alors cette mère a attendu le harceleur devant chez lui… et lui a cassé le nez. » | La rue, la nuit : la maison, le lampadaire, la mère qui attend. Secousse, flash, « NEZ CASSÉ ». |
| 10 → 12 s | « Elle risque cinq ans de prison. » | L'accusée dans le box. « 5 ANS DE PRISON ». |
| 12 → 37 s | Le procès : procureur et avocate se répondent. | Coup de marteau. « LA LOI DU PLUS FORT », « 3 FOIS » (les dossiers tamponnés), « 6 MOIS SANS ALLER EN COURS », « 17 ANS » contre « 45 ANS », « SEULE, EN PLEINE NUIT », le téléphone et « 400 MESSAGES D'INSULTES », « IL SAVAIT », puis les deux phrases-chocs. La jauge « COUPABLE ↔ NON COUPABLE » bascule après chaque argument. |
| 37 s → fin | « Tu es le juré. Coupable… ou non coupable ? Et toi, à sa place, tu aurais fait quoi ? » | L'accusée dans le noir, « COUPABLE » / « NON COUPABLE », la signature @affaireclassee0. |

## Les voix

- **Narrateur** : voix ElevenLabs « George » (la même que l'affaire n°1), générée avec vidIQ (`media/narrateur.mp3`).
- **Procureur et avocate** : voix de synthèse gratuites [Piper](https://pypi.org/project/piper-tts/), choisies après un essai (clarté et expressivité) : « upmc » (locuteur Pierre) pour le procureur, « siwis » pour l'avocate. `piper.py` génère cinq prises par réplique et garde la mieux comprise (`media/procureur.wav`, `media/avocate.wav`). Dans le mix, elles reçoivent une légère réverbération de salle d'audience, qui adoucit le côté synthétique.
- `voix.py` (le même que l'affaire n°1) découpe chaque réplique et écrit `timeline.json`.

Pour repasser les avocats en voix ElevenLabs (Adam et Sarah, comme l'affaire n°1) quand les crédits vidIQ seront revenus : génère le texte de chaque personnage d'une traite (voir `script.json`), dépose les MP3 dans `media/`, change le champ `file` dans `script.json`, puis relance `npm run a2:voice` et `npm run a2:render`. Tout se recale tout seul.

## Refaire la vidéo

```bash
cd promo
npm run a2:voice           # redécoupe les voix → timeline.json
npm run a2:render          # → build/affaire-02/affaire-02.mp4 (environ 30 minutes)
npm run a2:marque-video    # → build/affaire-02/affaire-02-marque.mp4 (bandeau + signature)
```

Le moteur (personnages, tribunal, jauge, sous-titres, transitions) est celui de l'affaire n°1 (`../proces/main.js`). Les décors propres à cette affaire sont dans `main.js` : le téléphone (`makePhone`), les dossiers tamponnés (`makeFolder`) et la rue de nuit (`makeStreet`).
