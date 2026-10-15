# Site de Scroll-up

Le site de présentation de l’app. Son rôle : faire rejoindre le test sur Telegram. En second : la liste d’attente pour l’App Store et Google Play. Il contient aussi les pages Confidentialité et Mentions légales, qui seront demandées par les stores.

Fichiers statiques, sans outil de construction : on peut l’héberger n’importe où (Netlify, Cloudflare Pages, GitHub Pages ou le serveur de l’app).

## Avant la mise en ligne

Tous les réglages sont en haut de `main.js`, dans `CONFIG` :

1. **`botUrl`** (indispensable) : le lien du bot de test, par exemple `https://t.me/scrollup_app_bot`. Tous les boutons « Essayer » et le QR code le reprennent.
   - Si la Mini App a un lien direct (créé dans BotFather avec `/newapp`, de la forme `https://t.me/ton_bot/app`), mets-le à la place. L’app s’ouvre alors en un seul geste, sans passer par « Démarrer ». Pense dans ce cas à adapter les trois étapes de la section « Rejoins le test ».
2. **`waitlistEndpoint`** (facultatif) : l’adresse d’un formulaire Formspree, Tally ou Brevo. Tant que c’est vide, le site affiche « La liste d’attente ouvre très bientôt ».
3. **`apkUrl`** (facultatif) : le lien de l’app Android de test. S’il est rempli, un bloc « Télécharger l’app Android de test » apparaît pour ceux qui n’ont pas Telegram.
4. **`contactEmail`** (conseillé) : l’adresse affichée en pied de page. L’App Store demandera une adresse d’assistance.
5. **`plausibleDomain`** (facultatif) : active la mesure d’audience Plausible, sans cookie, et compte les clics sur « Essayer » par emplacement (accueil, démo, calcul, barre du bas…). Si tu l’actives, mets à jour le paragraphe « Ce site » de `confidentialite.html`.

Ensuite :

- **Pages légales** : complète les passages surlignés en jaune dans `confidentialite.html` et `mentions-legales.html` (contact, statut, hébergeur, date).
- **Image de partage** : quand le nom de domaine est connu, remplace `og-image.jpg` par l’adresse complète dans `index.html` (par exemple `https://scroll-up.fr/og-image.jpg`). Certaines applis n’affichent l’aperçu qu’avec une adresse complète.
- **Chiffre** : la section « Fais le calcul » cite Médiamétrie (août 2026). Vérifie-le avant publication.

## Ce que contient la page

Tout ce qui est montré correspond à la V1 des testeurs (branche `v1-test`) : captures, activités, leçons, tenues et prix de la boutique.

1. **Accueil** : la promesse, le bouton « Essayer gratuitement », trois réassurances (sans inscription, sans pub, rien n’est bloqué) et l’écran d’accueil de l’app.
2. **Bande d’activités** : de vraies activités de l’app qui défilent.
3. **Démo** : le même tirage que l’app (temps, passion ou « Surprends-moi », une idée, « Une autre idée ») avec ses vraies activités (`idees.js`).
4. **Comment ça marche** : quatre étapes avec les vrais écrans. Sur ordinateur, le téléphone suit la lecture.
5. **Passions** : cartes à retourner, avec une activité et les cinq niveaux.
6. **Apprendre** : les 72 leçons.
7. **Ce que tu y gagnes** : minutons, tenues de Minuton, niveaux, atelier.
8. **Fais le calcul** : le temps de scroll sur un an, et ce que rendraient 5, 15 ou 30 minutes par jour.
9. **Rejoins le test** : « J’ai Telegram » ou « Je n’ai pas Telegram » (liens d’installation), QR code sur ordinateur, liste d’attente.
10. **Questions**.

Sur téléphone, une barre « Essayer » reste en bas de l’écran entre l’accueil et la section « Rejoins le test ». Les animations s’arrêtent si l’appareil demande moins de mouvements.

## Mettre à jour le contenu

- **Captures** (`assets/v1-*.webp`) : prises sur la V1 en local, en 390 px de large. À refaire si l’app change beaucoup.
- **Idées de la démo** (`idees.js`) : les cinq premières activités de chaque passion et de chaque durée de `shared/src/activities.ts`.
- **Chiffres** (154 activités, 72 leçons) : à ajuster si le contenu de l’app évolue.

## Voir le site en local

```bash
npx serve site
```

Le QR code est généré dans le navigateur par `vendor/qrcode.js` (licence MIT). Le site pèse environ 1 Mo, polices comprises.
