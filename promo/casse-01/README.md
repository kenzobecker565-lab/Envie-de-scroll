# « Le casse » n°1 : il n'a jamais forcé une seule porte (≈ 50 s)

▶️ **[Voir la vidéo](casse-01.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**Nouveau format** : on ne fait pas de procès, on raconte comment un voleur a réussi son coup. **L'histoire est inventée.** Le voleur ne force rien : tout repose sur le culot et le déguisement, comme dans un film de casse. La vidéo ne montre aucune méthode réelle d'effraction.

**Style « La Reconstitution »** : la rue est une maquette miniature vue de dessus, posée sur un socle en bois, avec un effet tilt-shift (flou en haut et en bas de l'image). La bijouterie est en coupe, sans toit, pour qu'on voie l'intérieur. Des repères d'enquêteur sont posés sur le décor : horloges, trajectoires en pointillés, étiquettes qui suivent les figurines, calendrier des vendredis.

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| Accroche | « Il a volé 4 millions d'euros de diamants… sans jamais forcer une seule porte. Voici comment. » | La mallette ouverte pleine de diamants, le compteur qui monte jusqu'à 4 000 000 €, le tampon « 0 PORTE FORCÉE ». |
| L'expert | « Trois mois avant… le gérant lui fait visiter… tout. » | La figurine en costume, avec son badge, parcourt la bijouterie : vitrines, comptoir, réserve, coffre. |
| Le détail | « Chaque vendredi soir… dans une simple mallette. » | Le calendrier avec les vendredis entourés, puis le trajet de la mallette de la bijouterie à la banque. |
| Le coursier | « 17 h 55… le gérant lui tend la mallette. Lui-même. » | L'horloge 17:55. Le faux coursier entre, le bon de livraison est tamponné « PARFAIT », et la mallette passe de main en main. |
| Le retournement | « À 18 h 10… le vrai coursier arrive. » | L'horloge saute à 18:10, la musique se coupe, un « ? » géant apparaît. |
| La fuite | « Il a pris le métro, 4 millions sur les genoux. » | Le faux coursier traverse et disparaît dans la bouche de métro. |
| Fin | « On ne l'a jamais retrouvé. Et toi… tu lui aurais donné la mallette ? » | La maquette entière, de nuit. |

**Voix** : ElevenLabs, voix « Bass », enregistrée par le créateur du compte (`media/elevenlabs/`). `elevenlabs.py` puis `voix.py` produisent `timeline.json`.

```bash
cd promo
python casse-01/elevenlabs.py && (cd casse-01 && python voix.py)
node render.mjs --ad=casse-01
node proces/marque.mjs --video=casse-01
```
