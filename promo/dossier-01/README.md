# Affaire Classée ? · Le Dossier n°1 : « Fermé de l'intérieur » (≈ 44 s)

▶️ **[Voir la vidéo](dossier-01.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

Un nouveau format : une **énigme** à résoudre en commentaire, dans le style « dossier tramé » (halftone-dossier, de la bibliothèque Lemo-Opuscar). C'est un dossier d'archives qu'on feuillette : papier crème, trame de points, gros titres à l'ombre décalée, tampons qui claquent, transitions en points.

**L'énigme (inventée)** : un homme est retrouvé mort dans son bureau fermé à clé de l'intérieur. Trois suspects ont chacun un alibi, et un seul ment.
**Solution** (jamais montrée dans la vidéo) : la secrétaire. Un 14 décembre à 19 h, il fait nuit noire : « il faisait encore jour » est impossible.

## Le déroulé

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| Accroche | « Un homme mort. Une porte fermée à clé. De l'intérieur. » | La chemise du dossier s'ouvre sur une silhouette à la craie (« UN HOMME MORT. »). Puis le plan du bureau : la clé tourne, cercle rouge « CÔTÉ INTÉRIEUR », tampon « IMPOSSIBLE ». |
| Le mystère | « Personne n'est entré. Personne n'est sorti. Et pourtant… quelqu'un l'a tué. » | Croix rouges sur la porte et la fenêtre. La page vire au rouge et le tampon « HOMICIDE » tombe. |
| Les suspects | « 14 décembre. Trois suspects. Trois alibis. Un seul ment. » | Le calendrier, les trois cartes de suspects, les étiquettes « ALIBI », puis « UN SEUL MENT. » |
| Les dépositions | Les trois alibis | Une fiche par suspect : portrait, pièce à conviction (ticket de cinéma, orage, horloge à 19 h 00), déposition tapée à la machine. |
| L'indice | « Un de ces trois alibis est impossible… sous tes yeux. » | Les trois pièces côte à côte, la loupe passe sur chacune, un œil s'ouvre. |
| La fin | « Alors… qui ment ? Écris-le en commentaire… » | « QUI MENT ? », les trois suspects, « ÉCRIS-LE EN COMMENTAIRE », « ABONNE-TOI ». |

## Les voix

**Version provisoire** : les voix viennent de Chatterbox (gratuit, voir [`../voix-libres`](../voix-libres/README.md)), en attendant les prises ElevenLabs du créateur.

Pour passer aux voix ElevenLabs :
1. ranger les fichiers dans `media/elevenlabs/<id>.mp3` (`01-accroche` … `08-fin`) ;
2. assembler un fichier `media/narrateur.wav`, comme `../affaire-05/elevenlabs.py` ;
3. relancer les commandes ci-dessous.

## Refaire la vidéo

```bash
cd promo
(cd dossier-01 && python voix.py)        # media/narrateur.wav → voice/ + timeline.json
node render.mjs --ad=dossier-01          # → build/dossier-01/dossier-01.mp4
node proces/marque.mjs --video=dossier-01
```
