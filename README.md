# Plutôt Que Scroller — V1 test (Telegram Mini App)

Une app qui intercepte l'envie de scroller et propose à la place une activité créative courte, liée à une passion : dessin, écriture, musique, cinéma / animation. Elle garde une trace de tout ce qui a été fait (une galerie et un compteur de pièces d'or) plutôt que de compter des jours d'abstinence. Le ton reste chaleureux, jamais punitif.

Cette V1 de test est volontairement resserrée : 4 passions, 60 activités validées, 3 temps (5, 15 et 30 min). Pas de premium, pas de paiement, pas d'IA, pas d'API externe.

![Aperçu de la Mini App : accueil, mood, activité, confirmation et galerie](docs/apercu-v1.png)

> Le premier prototype web (747 activités, données dans le navigateur) est conservé dans [`prototype/`](prototype/). La pub du dossier [`promo/`](promo/) en est tirée.

---

## Organisation du dépôt

```
shared/     Types, contenus et règles partagés par l'app et le serveur
  src/activities.ts   ← les 60 activités (texte validé, recopié tel quel)
  src/prompts.ts      ← ce que l'appli « tire au hasard » (mots, films, genres…)
  src/intros.ts       ← introductions selon le mood
  src/reminders.ts    ← messages de relance du bot
  src/selection.ts    ← choix d'une activité
  src/rules.ts        ← pièces d'or, garde-fou temporel
server/     API REST (Express) + bot Telegram (Telegraf) + base SQLite (Prisma)
app/        La Mini App (React, Vite, TypeScript, Tailwind CSS, Motion)
prototype/  Le prototype web précédent (archive)
promo/      Les pubs en motion design
```

C'est un espace de travail npm (*workspaces*) : un seul `npm install` à la racine installe tout.

---

## Lancer le projet en local (sans Telegram)

Prérequis : [Node.js](https://nodejs.org) **22.13 ou plus récent**, avec npm.

```bash
npm install
npm run dev
```

Ouvre ensuite http://localhost:5173. Le serveur (port 3000) et l'app (port 5173) démarrent ensemble ; la base SQLite est créée toute seule dans `server/data/`.

Sans token de bot, le serveur accepte une **identité de développement** : l'app fonctionne dans un navigateur normal, comme si tu l'avais ouverte depuis Telegram. Ajoute `?dev_user=2` à l'adresse pour jouer un autre utilisateur. Les photos de dessins sont alors écrites sur le disque (`server/data/photos/`).

| Commande (à la racine) | Rôle |
| --- | --- |
| `npm run dev` | Serveur + Mini App, avec rechargement automatique |
| `npm test` | Tests automatiques (activités, règles, API, bot, relances) |
| `npm run typecheck` | Vérifie les types TypeScript |
| `npm run build` | Construit la Mini App dans `app/dist/` |
| `npm start` | Production : applique les migrations, lance le serveur, qui sert aussi la Mini App |
| `npm run db:migrate` | Après une modification de `server/prisma/schema.prisma` : crée la migration |
| `npm run db:studio` | Ouvre Prisma Studio pour explorer la base |

Sur GitHub, typage, tests et build se lancent à chaque pull request (`.github/workflows/ci.yml`).

---

## La tester dans Telegram

1. **Crée le bot** : dans Telegram, écris à [@BotFather](https://t.me/BotFather), `/newbot`, et garde le token.
2. **Donne une adresse HTTPS à l'app.** Telegram n'ouvre les Mini Apps qu'en HTTPS.
   - *En développement* : un tunnel vers ton ordinateur, par exemple `cloudflared tunnel --url http://localhost:5173` ou `ngrok http 5173`. Vite relaie `/api` vers le serveur, une seule adresse suffit.
   - *En production* : l'adresse de ton serveur (voir plus bas).
3. **Configure le serveur** : copie `server/.env.example` en `server/.env` et remplis au moins `BOT_TOKEN` et `WEBAPP_URL` (l'adresse HTTPS de l'étape 2). Toutes les variables y sont commentées. Avec un token, l'identité de développement est coupée : ajoute `DEV_AUTH=true` si tu veux continuer à tester aussi dans un navigateur.
4. **Chat de stockage des photos** : crée un groupe (ou un canal) privé, ajoutes-y le bot, puis mets son identifiant dans `STORAGE_CHAT_ID` (il commence par `-100…` ; pour le trouver, envoie un message dans le groupe puis ouvre `https://api.telegram.org/bot<TOKEN>/getUpdates`).
5. Relance `npm run dev`, puis envoie `/start` au bot : il répond avec un bouton qui ouvre la Mini App. Au démarrage, le serveur déclare aussi les commandes du bot et le bouton de menu « Ouvrir ».

Facultatif : dans BotFather, `/newapp` crée un lien direct vers la Mini App (`t.me/<bot>/<app>`).

### Mise en production

Il faut un hébergeur Node.js avec un **disque persistant** (la base SQLite est un fichier) : un petit VPS, Railway ou Fly.io avec un volume, par exemple.

```bash
npm ci
npm run build          # construit app/dist
npm start              # migrations + serveur (API, bot, Mini App) sur $PORT
```

Variables à définir : `NODE_ENV=production`, `BOT_TOKEN`, `WEBAPP_URL` (l'adresse publique du serveur), `STORAGE_CHAT_ID`, et `DATABASE_URL` pointant vers le volume (ex. `file:/data/pqs.db`). Par défaut, le bot reçoit les messages en *long polling* (rien à configurer) ; `BOT_MODE=webhook` passe en webhook, sur `https://<ton-domaine>/telegram/webhook`.

> Pour passer plus tard à Postgres (Neon, Supabase…), il suffit de changer le `provider` dans `server/prisma/schema.prisma`, l'adaptateur dans `server/src/db.ts`, et de régénérer les migrations.

---

## Le parcours

1. **Onboarding** : une bienvenue courte (illustration unDraw), puis le choix de 1 à 3 passions sur des cartes illustrées.
2. **Accueil** : le gros bouton « J'ai envie de scroller ». En dessous, un aperçu discret du mois (activités, pièces d'or), et « Tu étais en train de… » si une activité attend d'être validée.
3. **Déclenchement** : « On a reçu ton signal de détresse pré-scroll. On s'occupe de toi. », puis enchaînement automatique (un toucher pour aller plus vite).
4. **Mood** : 8 moods en deux familles, un tap.
5. **Temps** : 5, 15 ou 30 min.
6. **Passion du moment** : seulement si le profil en compte plusieurs.
7. **Activité** : en grand, avec « Une autre idée » (discret) et « Valider ».
8. **Après « Valider »** : une photo du dessin, le texte écrit, ou, pour Musique et Cinéma, le titre exploré (facultatif).
9. **Confirmation** : « Activité enregistrée. +X minutes ajoutées à ton total. », avec le compteur qui roule, des confettis discrets et une vibration.
10. **Galerie** : le total de pièces d'or en grand, puis une carte par activité (photo, citation, ou titre exploré), groupées par mois. Jamais de calendrier.

## Les règles

- **Choix de l'activité** (`shared/src/selection.ts`) : tirage parmi les 5 activités de la passion × du temps, en écartant les 3 dernières proposées pour cette combinaison. « Une autre idée » écarte toujours l'activité affichée : en enchaînant, une activité ne revient jamais dans 4 propositions d'affilée. Le mood ne change que le ton de l'introduction.
- **Pièces d'or** : 1 minute d'activité = 1 pièce. Cumulatif, rien à dépenser.
- **Garde-fou temporel** (`shared/src/rules.ts`) : pour Musique et Cinéma, « Valider » reste grisé jusqu'à la fin de la durée choisie. Le bouton se remplit doucement, sans compte à rebours. Pour Dessin et Écriture, on valide tout de suite avec une photo ou un texte, ou « sans » une fois la durée écoulée. Le serveur applique les mêmes règles : l'horloge du téléphone ne suffit pas à tricher.
- **Reprise** : une activité proposée reste « à reprendre » 12 h. Pratique quand on quitte Telegram pour écouter un album : en revenant, le minuteur a continué.
- **Photos** : envoyées depuis l'app, réduites à 1600 px, puis relayées par le bot vers le chat privé de stockage. Seul le `file_id` Telegram est gardé en base, et le serveur relaie l'image à l'affichage (le token ne quitte jamais le serveur). Une photo envoyée **directement au bot** rejoint le dernier dessin enregistré sans photo.
- **Relances** (`server/src/bot/reminders.ts`) : au plus une par jour, à 19 h dans le fuseau de chacun (`REMINDER_HOUR`), jamais un jour où une activité a été faite. Les deux messages alternent. Après 5 relances sans ouverture de l'app, elles se mettent en pause. `/stop` les coupe, `/relances` les réactive.
- **Authentification** : les `initData` transmises par Telegram sont vérifiées avec le token du bot (signature HMAC, validité 24 h). Aucun compte à créer.

---

## Modifier les contenus

- **Les 60 activités** : `shared/src/activities.ts`, rangées par passion puis par temps. Le texte est stocké tel qu'il a été validé ; l'affichage ajoute seulement la typographie française (apostrophes courbes, guillemets « », espaces insécables). Les tests vérifient qu'il y a bien 5 activités par passion et par temps.
- **Ce que l'appli tire au hasard** : `shared/src/prompts.ts`. Huit activités demandent que l'appli propose quelque chose (« 3 mots que l'appli tire au hasard », « un film que l'appli te propose »…). Sans API externe, ces tirages se font dans des listes écrites à la main : mots, premières phrases, traits de caractère, genres musicaux, films, séries animées, courts-métrages. **Ces listes ne faisaient pas partie du contenu validé** : relis-les et enrichis-les librement (une ligne = un élément).
- **Introductions selon le mood** : `shared/src/intros.ts` (deux par mood).
- **Messages du bot** : `shared/src/reminders.ts` (relances) et `server/src/bot/bot.ts` (accueil, photos).

Lance `npm test` après une modification.

---

## API

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/me` | Profil, statistiques, activité à reprendre (crée l'utilisateur à la première ouverture) |
| `PUT` | `/api/me/passions` | Choix des passions (1 à 3) |
| `POST` | `/api/proposals` | Tirer une activité ; avec `replacing` : « Une autre idée » |
| `POST` | `/api/completions` | Valider une activité (JSON, ou multipart avec une photo) |
| `GET` | `/api/completions` | La galerie, page par page |
| `GET` | `/api/photos/:id` | Une photo (adresse signée, valable quelques heures) |

Chaque requête porte `Authorization: tma <initData>`. Les types des requêtes et réponses sont dans `shared/src/api.ts`.

---

## Design

- **Palette et typographies** : `app/src/styles/index.css`. Chaque couleur y a sa valeur claire et sa valeur sombre. Les couleurs par défaut de Tailwind sont désactivées : impossible d'utiliser une couleur hors palette par erreur. Idem pour les tailles de texte (Fraunces 22-34 px, Manrope 11-15 px, Space Mono 10,5-21 px) et les rayons (8, 14, 20 px, pilule).
- **Thème** : suit `Telegram.WebApp.colorScheme` (et l'événement `themeChanged`), ou le réglage du système hors de Telegram. L'en-tête et le fond de Telegram prennent la couleur *canvas* de l'app.
- **SDK Telegram** (`app/src/telegram/`) : bouton retour natif, bouton principal natif (onboarding, envoi de la photo ou du texte : il reste au-dessus du clavier), vibrations (sélection, validation, erreur), glissement vertical désactivé pour ne pas fermer l'app en faisant défiler la galerie. Hors de Telegram, l'app affiche ses propres boutons.
- **Animations** : transitions entre écrans, retour visuel au toucher, compteur « à rouleaux », confettis. Tout est coupé ou adouci si le système demande de réduire les animations.
- **Illustrations** : [unDraw](https://undraw.co) (licence libre), recolorées avec les variables du thème par `app/scripts/recolor-undraw.mjs`.
- **Accessibilité** : `ink-faint` sert aux textes désactivés et aux indications de saisie ; les textes informatifs utilisent `ink-soft` ou `ink`, pour un contraste suffisant.

## Hors périmètre de cette V1

Créneaux de 1 h et plus, personnalisation premium, paiement, boutique de badges, TMDB / Jikan, fonctions sociales, autres langues que le français.
