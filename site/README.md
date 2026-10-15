# Site de Scroll-up

Le site de présentation : une page d'accueil qui invite à rejoindre le test sur Telegram, une liste d'attente pour la sortie sur les stores, et les pages Confidentialité et Mentions légales. Il reprend la charte de la refonte de l'app (violet, crème, police Outfit, Minuton).

Fichiers statiques, sans outil de construction : on peut l'héberger n'importe où (GitHub Pages, Netlify, Cloudflare Pages, ou le serveur de l'app).

## Avant la mise en ligne

1. **Lien du bot** : dans `main.js`, remplace `https://t.me/TON_BOT` par le lien du bot de test (par exemple `https://t.me/scrollup_app_bot`). Tous les boutons « Essayer » le reprennent.
2. **Liste d'attente** (facultatif) : crée un formulaire chez un service comme Formspree, Tally ou Brevo, puis colle son adresse dans `waitlistEndpoint`, toujours dans `main.js`. Tant que c'est vide, le site affiche « La liste d'attente ouvre très bientôt ».
3. **Pages légales** : complète les passages surlignés en jaune dans `confidentialite.html` et `mentions-legales.html` (contact, statut, hébergeur, date). Ces pages seront aussi demandées par l'App Store et Google Play.
4. **Chiffres** : la section « Le problème » cite Médiamétrie (août 2026) et le Pew Research Center (2025). Vérifie-les avant publication.

## Ce que contient la page

- **Accueil** : le titre « J’ai envie de ~~scroller~~ créer ! » écrit à la main, le téléphone et ses autocollants (minutons, niveau, chrono).
- **Bande d’activités** qui défile : de vraies activités de l’app.
- **Le calcul** : un curseur « tu scrolles combien de temps par jour ? », puis ce que donneraient 5, 15 ou 30 minutes rendues (créations, heures, niveau 5, minutons).
- **La démo** : on choisit son temps et ses passions, le site tire trois vraies activités de l’app (`idees.js`).
- **Comment ça marche** : sur ordinateur, le téléphone change d’écran au fil des étapes.
- **Scroll contre Scroll-up**, **les passions** (cartes à retourner, avec les 5 niveaux), **ce que tu y gagnes** (minutons, tenues de Minuton et leurs prix, niveaux, musique signature à écouter, rappel).
- **Notre histoire** avec la story de 10 secondes, **rejoindre le test** (avec un QR code pour passer de l’ordinateur au téléphone), **questions**.

Les animations s’arrêtent si le téléphone ou l’ordinateur demande moins de mouvements.

## Mettre à jour les idées de la démo

`idees.js` reprend les activités de `shared/src/activities.ts` (branche `develop`). Si elles changent, il suffit de régénérer ce fichier avec les cinq premières activités de chaque passion et de chaque durée.

## Voir le site en local

```bash
npx serve site
```

## Images

Les illustrations viennent de la refonte de l'app (`app/public/art`, branche `develop`) et les captures d'écran de la version de développement. Elles sont en WebP, réduites à la taille d’affichage. La story (`assets/media`) existe en WebM et en MP4 ; la musique n’est chargée que si l’on appuie sur lecture. Le QR code est généré dans le navigateur par `vendor/qrcode.js` (licence MIT).
