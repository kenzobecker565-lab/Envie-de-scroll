# Affaire Classée ? · affaire n°5 : l'adresse (≈ 1 min 42)

▶️ **[Voir la vidéo](affaire-05.mp4)** (MP4, 1080 × 1920, 30 images/s, avec la marque @affaireclassee0)

**L'affaire est inventée** (scénario proposé par le créateur du compte). Sarah, enseignante, donne à un ami de quinze ans la nouvelle adresse de son ancienne locataire, qui ne lui a pas payé onze mois de loyer. Elle tenait cette adresse de la mère elle-même, pour l'école. Le soir même, l'ami agresse la femme. C'est Sarah qui doit s'expliquer.

On ne montre aucun geste violent : la rue de nuit, le tampon « AGRESSÉE » et des gyrophares.

**Nouveau dans cette affaire** : la vidéo ne donne pas le verdict. Elle finit par un bouton « ABONNE-TOI » et « LE VERDICT DANS LA PROCHAINE VIDÉO ».

## Le déroulé

| Moment | Ce qu'on entend | Ce qu'on voit |
| --- | --- | --- |
| L'accroche | « Sarah a donné une adresse à un ami. Le soir même, il y a agressé une femme. Aujourd'hui, c'est Sarah qui doit s'expliquer. » | Gros plan sur le post-it avec l'adresse, que Sarah tend à son ami. Puis la rue de nuit, le tampon « AGRESSÉE », les gyrophares. Enfin, Sarah dans le box. |
| Les faits | L'appartement, 11 mois sans loyer, la voiture, la locataire partie. | Le calendrier « LOYER : 11 MOIS IMPAYÉS » qui défile, l'ami endormi dans sa voiture, l'appartement vide (« PARTIE », « AUCUNE ADRESSE »). |
| Le procès | Procureur et avocate se répondent. | Les étiquettes et les preuves : le cahier de liaison, « PAS AUTORISÉE », « 15 ANS D'AMITIÉ », la petite voiture, le téléphone et la bulle du message, « JAMAIS VIOLENT », la maison, « À L'HÔPITAL ». Puis les trois phrases-chocs. La jauge « coupable ↔ non coupable » bascule après chaque argument. |
| Le vote | « Sarah a-t-elle fermé les yeux sur un danger évident, ou a-t-elle été trahie par son ami ? Tu es le juré. Quel est ton verdict ? Abonne-toi pour découvrir le verdict dans la prochaine vidéo. » | « UN DANGER ÉVIDENT ? » / « TRAHIE PAR SON AMI ? », puis « COUPABLE » / « NON COUPABLE », la signature, et le bouton « ABONNE-TOI ». |

## Les voix

Les trois voix sont gratuites, générées sur la machine avec Chatterbox : voir [`../voix-libres`](../voix-libres/README.md). Les longues tirades du scénario sont découpées en répliques courtes, ce qui fiabilise la voix et laisse un plan par argument.

La signature de la marque apparaît sur « Quel est ton verdict ? » (`signature` dans `cues.js`, lu par `proces/marque.mjs`).

## Refaire la vidéo

```bash
cd promo
cbenv/bin/python voix-libres/generer.py affaire-05 && python voix-libres/choisir.py affaire-05
npm run a5:voice           # découpe → timeline.json
npm run a5:render          # → build/affaire-05/affaire-05.mp4
npm run a5:marque-video    # → build/affaire-05/affaire-05-marque.mp4
```
