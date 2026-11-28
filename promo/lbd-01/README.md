# Affaire Classée ? · Le tir (LBD), épisode 1/2 (≈ 91 s)

▶️ **[Voir la vidéo](lbd-01.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** Lors d'une manifestation, Théo, 22 ans, étudiant en photographie, lance un pavé sur une ligne de police. Un policier lui tire dessus au LBD (lanceur de balles de défense) à 6 mètres, et Théo perd son œil gauche. Le policier est jugé pour violences volontaires avec mutilation. Le verdict tombe dans l'épisode 2.

## Le déroulé

| Moment | Ce qu'on voit |
| --- | --- |
| 0 – 4 s | Très gros plan sur un œil, avec les gyrophares dans la pupille. Une balle arrive face caméra et, sur « Un tir », l'image se fissure comme un objectif brisé. La paupière tombe et la moitié gauche de l'image s'éteint : « UN TIR DE LBD », « ÉTUDIANT · 22 ANS », « ŒIL PERDU ». |
| 4 – 8 s | « ◀◀ 3 secondes plus tôt » : la rue sous les gaz, la ligne de CRS en contre-jour, la foule et les fumigènes. Théo lance un pavé, qu'on suit au ralenti. Le policier épaule son LBD, la mesure « 6 M » s'affiche, puis le tir. |
| 8 – 13 s | Le policier dans le box, les barreaux tombent : « JUGÉ », « VIOLENCES VOLONTAIRES », « AVEC MUTILATION ». |
| Le procès | Contre-champs, gestes, panoramiques filés. Un schéma animé par argument : le règlement (tête interdite), le casque fendu, le viseur qui remonte jusqu'à la tête, l'objectif de l'appareil photo qui s'éteint à moitié, la balance « appareil contre pavé de 10 kg », « PROUVÉ » et « 0 SOMMATION », le choix en une seconde, le collègue à l'hôpital, les deux victimes. |
| Au milieu | Le résultat du vote sur Inès (la pilleuse) : « COUPABLE · LA MAJORITÉ D'ENTRE VOUS », « MERCI D'AVOIR VOTÉ », puis « ABONNE-TOI ». |
| La fin | « LÉGITIME DÉFENSE ? » / « VIOLENCE POLICIÈRE ? », le vote, « ABONNE-TOI », « ÉCRIS TON VERDICT EN COMMENTAIRE ». |

## Les voix

ElevenLabs, enregistrées par le créateur du compte, une prise par réplique (`media/elevenlabs/<id>.mp3`) :
- narrateur : « Nicolas » ;
- procureur : « Paul K » ;
- défense : « Peter ».

Chaque réplique est traitée à partir de son propre fichier (`media/lignes/<id>.wav`). `voix.py` resserre le rythme de 20 %, sans changer la hauteur des voix, puis écrit `timeline.json`.

## Refaire la vidéo

```bash
cd promo
(cd lbd-01 && for f in media/elevenlabs/*.mp3; do ffmpeg -y -i $f -ac 1 -ar 44100 media/lignes/$(basename $f .mp3).wav; done && python voix.py)
python demo-v2/levres.py lbd-01
node render.mjs --ad=lbd-01
node proces/marque.mjs --video=lbd-01
```
