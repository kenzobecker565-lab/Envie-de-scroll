# Affaire Classée ? · La promesse (≈ 77 s)

▶️ **[Voir la vidéo](promesse.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée.** À 3 h du matin, une femme débranche la machine qui maintient en vie son mari, dans le coma depuis trois ans. Il lui avait fait promettre de ne jamais le laisser comme ça. Leur propre fille l'accuse de meurtre.

## Le déroulé

| Moment | Ce qu'on voit |
| --- | --- |
| 0 – 4 s | La chambre d'hôpital sous la pluie, un grand électrocardiogramme vert qui traverse l'écran. Sa main avance vers l'interrupteur : le tracé devient plat, l'écran vire au rouge. Gros plan sur son visage, une larme. |
| 4 – 8 s | Trois ans en accéléré : le jour et la nuit défilent à la fenêtre, la fleur éclot et fane, le compteur monte à 1 095 jours. Puis la lettre s'écrit : « laisse-moi partir ». |
| 8 – 11 s | La photo de famille se déchire entre la mère et la fille, qui la pointe du doigt : « ACCUSÉE DE MEURTRE ». |
| Le procès | Contre-champs, gestes, panoramiques filés, un schéma animé par argument : le moniteur à plat, la lettre, la main serrée, « 1 095 visites contre 11 », le traitement n°4, les trois flacons barrés, le code pénal. |
| Au milieu | Un carton rapide « AVANT LA SUITE… ABONNE-TOI ». |
| La fin | « Un geste d'amour ? » / « Un meurtre ? », le vote, puis « ABONNE-TOI » et « ÉCRIS TON VERDICT EN COMMENTAIRE ». |

## Les voix

- **Narrateur** : ElevenLabs (« Bellami », modèle Eleven v4), généré par Claude via le connecteur : `media/elevenlabs/narrateur.mp3`.
- **Procureur et avocate** : Chatterbox (gratuit, voir [`../voix-libres`](../voix-libres/README.md)), car ElevenLabs refusait de lancer d'autres générations ce jour-là. Trois prises par réplique ; `choisir.py` garde la meilleure et l'enregistre dans `media/lignes/<id>.wav`.

`voix.py` resserre le rythme (narrateur +10 %, procureur et avocate +15 %) et écrit `timeline.json`.

Pour passer à des voix ElevenLabs : remplacer les fichiers de `media/lignes/` par les nouvelles prises (mêmes noms), puis relancer les commandes ci-dessous à partir de `voix.py`.

## Refaire la vidéo

```bash
cd promo
(cd promesse && python choisir.py && python voix.py)
python demo-v2/levres.py promesse
node render.mjs --ad=promesse
node proces/marque.mjs --video=promesse
```
