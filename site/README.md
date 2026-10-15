# Site de Scroll-up

Le site de présentation : une page d'accueil qui invite à rejoindre le test sur Telegram, une liste d'attente pour la sortie sur les stores, et les pages Confidentialité et Mentions légales. Il reprend la charte de la refonte de l'app (violet, crème, police Outfit, Minuton).

Fichiers statiques, sans outil de construction : on peut l'héberger n'importe où (GitHub Pages, Netlify, Cloudflare Pages, ou le serveur de l'app).

## Avant la mise en ligne

1. **Lien du bot** : dans `main.js`, remplace `https://t.me/TON_BOT` par le lien du bot de test (par exemple `https://t.me/scrollup_app_bot`). Tous les boutons « Essayer » le reprennent.
2. **Liste d'attente** (facultatif) : crée un formulaire chez un service comme Formspree, Tally ou Brevo, puis colle son adresse dans `waitlistEndpoint`, toujours dans `main.js`. Tant que c'est vide, le site affiche « La liste d'attente ouvre très bientôt ».
3. **Pages légales** : complète les passages surlignés en jaune dans `confidentialite.html` et `mentions-legales.html` (contact, statut, hébergeur, date). Ces pages seront aussi demandées par l'App Store et Google Play.
4. **Chiffres** : la section « Le problème » cite Médiamétrie (août 2026) et le Pew Research Center (2025). Vérifie-les avant publication.

## Voir le site en local

```bash
npx serve site
```

## Images

Les illustrations viennent de la refonte de l'app (`app/public/art`, branche `develop`) et les captures d'écran de la version de développement. Elles sont en WebP, réduites à la taille d'affichage : moins de 400 Ko au total avec la police.
