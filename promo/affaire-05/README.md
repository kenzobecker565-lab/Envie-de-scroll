# Affaire Classée ? · affaire n°5 : l'adresse (≈ 1 min 35)

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

Les voix viennent d'**ElevenLabs** (modèle Eleven v4). Le créateur du compte les a générées sur le site, une prise par réplique, et elles sont rangées dans `media/elevenlabs/<id>.mp3` :

- narrateur : « François Louis » ;
- procureur : « Yann » ;
- défense : « Bass », une voix d'homme. Dans cette affaire, la défense est donc un avocat : l'étiquette dit « L'AVOCAT DE LA DÉFENSE ». Le rôle garde son nom `avocate` dans `script.json`.

`elevenlabs.py` assemble les prises en un fichier par personnage (`media/<personnage>.wav`). `voix.py` découpe ensuite chaque réplique et écrit `timeline.json`, avec un tempo de +6 % seulement. La première version de l'affaire utilisait les voix gratuites de Chatterbox (voir [`../voix-libres`](../voix-libres/README.md)) ; elle reste dans l'historique git.

La signature de la marque apparaît sur « Quel est ton verdict ? » (`signature` dans `cues.js`, lu par `proces/marque.mjs`). L'appel à s'abonner n'a pas de sous-titres, puisque le bouton le dit déjà.

## Refaire la vidéo

```bash
cd promo
python affaire-05/elevenlabs.py   # prises ElevenLabs → un fichier par personnage
npm run a5:voice           # découpe → timeline.json
npm run a5:render          # → build/affaire-05/affaire-05.mp4
npm run a5:marque-video    # → build/affaire-05/affaire-05-marque.mp4
```
