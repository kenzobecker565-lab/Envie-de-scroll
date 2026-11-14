# Affaire Classée ? · affaire n°5, version 2 : l'adresse (≈ 1 min 29)

▶️ **[Voir la vidéo](affaire-05-v2.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

C'est la même affaire que la [version 1](../affaire-05/README.md), avec les **mêmes enregistrements ElevenLabs**. L'image est refaite dans le style de l'affaire n°6 (le faux chirurgien) : motion design 2D en SVG, gros sous-titres animés et pas de jauge.

## Ce qui change

**L'accroche est refaite pour frapper dès la première image :**

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| 0 – 2,8 s | « Sarah a donné une adresse à un ami. » | Gros plan sur un post-it marqué « PIÈCE À CONVICTION N°1 ». L'adresse s'écrit au feutre et se fait entourer en rouge. Une main arrache le post-it, avec un coup de fouet de la caméra. |
| 2,8 – 5,2 s | « Le soir même, il y a agressé une femme. » | Une carte de nuit : la voiture suit l'itinéraire GPS jusqu'à la maison (« 21:47 »). À « agressé », l'épingle devient rouge, l'écran se fissure, les gyrophares s'allument et le tampon « AGRESSÉE » tombe. |
| 5,2 – 7,9 s | « Aujourd'hui, c'est Sarah qui doit s'expliquer. » | Le box est dans le noir. Le projecteur s'allume sur Sarah ; le post-it est sous scellé (« PIÈCE N°1 ») et le tampon « ACCUSÉE » tombe. |

**La suite :**
- **Les faits** : l'immeuble, puis le calendrier qui défile jusqu'à « 11 MOIS SANS LOYER ». Ensuite l'ami qui dort dans sa voiture sous une pluie de lettres de relance, et enfin l'appartement vide (« PARTIE », « AUCUNE ADRESSE »).
- **Le procès** : un accessoire par argument. On voit l'école, le cahier de liaison, la tirelire qui se brise et le compteur « 15 ANS D'AMITIÉ ». Le message de l'ami s'écrit dans une bulle de téléphone. Suivent la maison de la mère et de l'enfant, puis l'hôpital sur fond rouge tramé. La balance oppose l'amitié à la confiance d'une mère.
- **Le vote** : comme dans la version 1, avec le bouton « ABONNE-TOI » et « LE VERDICT DANS LA PROCHAINE VIDÉO ».
- **Le rythme** : les voix sont un peu plus rapides (+12 % au lieu de +6 %, sans changer leur hauteur) et les silences sont plus courts. La vidéo passe de 1 min 35 à 1 min 29.

## Refaire la vidéo

```bash
cd promo
(cd affaire-05-v2 && python voix.py)        # media/<personnage>.wav → voice/ + timeline.json
python demo-v2/levres.py affaire-05-v2      # → levres.json (bouches)
node render.mjs --ad=affaire-05-v2          # → build/affaire-05-v2/affaire-05-v2.mp4
node proces/marque.mjs --video=affaire-05-v2
```
