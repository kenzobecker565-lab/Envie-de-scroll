# Affaire Classée ? · affaire n°7 : la fausse avocate (≈ 55 s)

▶️ **[Voir la vidéo](affaire-07.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** Elle a gagné 47 procès sans jamais avoir été avocate. Aujourd'hui, elle est jugée dans la salle même où elle plaidait, face au procureur qu'elle a déjà battu. Le style est celui du faux chirurgien (style A, motion design 2D en SVG), sans jauge.

## Le hook (0 à 11 s), pensé pour accrocher même sans le son

1. **47 victoires** : dès la première image, elle plaide, index levé, sous un projecteur doré. Le compteur s'emballe de 0 à 47 pendant que les tampons verts « GAGNÉ » recouvrent le fond, de plus en plus vite. Puis « 0 DÉFAITE », les citations des juges et un zoom sur son visage.
2. **Le twist** : coupure au noir. On tape son nom dans l'annuaire de l'Ordre des avocats : « 0 RÉSULTAT », puis le tampon « FAUSSE ».
3. **La même salle** : on revoit le plan du début. Un volet la fait passer de la robe d'avocate à la tenue d'accusée, la lumière vire au bleu, les barreaux du box tombent, puis le tampon « ACCUSÉE ».

## Le procès

Un accessoire par argument :
- les billets et le compteur « 300 000 € » ;
- « 47 PERSONNES LIBRES » ;
- les 47 dossiers « ACQUITTÉ » qui virent au rouge ;
- le diplôme, « un bout de papier » ;
- le château de cartes qui s'effondre ;
- le tableau des scores « ELLE 1 – 0 LUI ».

Les répliques qui se répondent s'enchaînent à 0,1 s d'écart, séparées par une coupure très brève. Les deux phrases-chocs ont un fond tramé, et la musique se tait après « Il m'interdit de mentir ».

## Les voix

Les voix viennent d'ElevenLabs et ont été générées par le créateur du compte (`media/elevenlabs/<id>.mp3`) :
- narrateur : « Bass » ;
- procureur : « Hugo » ;
- défense : « Peter ».

`elevenlabs.py` assemble les prises et `voix.py` les découpe (tempo +10 %, pauses de 0,22 s au plus) pour écrire `timeline.json`.

## Refaire la vidéo

```bash
cd promo
(cd affaire-07 && python elevenlabs.py && python voix.py)
python demo-v2/levres.py affaire-07
node render.mjs --ad=affaire-07
node proces/marque.mjs --video=affaire-07
```
