# Scroll-up — V1 test (Telegram Mini App)

*Anciennement « Plutôt Que Scroller ».*

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

## Tester l'application

Prérequis : [Node.js](https://nodejs.org) **22.13 ou plus récent** (la version LTS actuelle convient) et [Git](https://git-scm.com).

### 1. Récupérer le code

```bash
git clone https://github.com/kenzobecker565-lab/Envie-de-scroll.git
cd Envie-de-scroll
git checkout claude/charming-curie-pg6vs5   # tant que la V1 n'est pas fusionnée
npm install
```

### 2. Dans le navigateur (le plus rapide, sans Telegram)

```bash
npm run dev
```

Ouvre http://localhost:5173. Le serveur (port 3000) et l'app (port 5173) démarrent ensemble, et la base de données se crée toute seule dans `server/data/`.

Sans token de bot, le serveur accepte une **identité de test** : l'app marche dans un navigateur normal, comme si elle était ouverte depuis Telegram.

- **Voir l'app au format téléphone** : dans Chrome, touche F12, puis l'icône « téléphone » (mode appareil).
- **Sur ton téléphone** (même Wi-Fi que l'ordinateur) : ouvre l'adresse « Network » affichée dans le terminal (du type `http://192.168.1.12:5173`).
- **Jouer un autre utilisateur** : ajoute `?dev_user=2` à l'adresse (ou 3, 4…). Chaque numéro a son propre profil et sa propre galerie.
- **Tout remettre à zéro** : arrête le serveur (Ctrl+C), supprime le dossier `server/data/`, relance `npm run dev`.
- **Musique et Cinéma** : « Valider » attend vraiment la fin de la durée choisie. Pour tester vite, choisis 5 min.

Hors de Telegram, l'app affiche ses propres boutons (« Retour », boutons du bas) à la place des boutons natifs. Les vibrations ne se déclenchent que dans Telegram.

### 3. Dans Telegram (le vrai test)

1. **Crée le bot** : dans Telegram, écris à [@BotFather](https://t.me/BotFather), envoie `/newbot`, donne-lui le nom `Scroll-up` et un identifiant qui finit par `bot` (par exemple `scrollup_app_bot`). Garde le **token** qu'il te donne.
2. **Donne une adresse HTTPS à ton ordinateur.** Telegram n'ouvre les Mini Apps qu'en HTTPS. Le plus simple : [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/), gratuit et sans compte. Dans un **deuxième terminal** :

   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```

   Il affiche une adresse du type `https://quelque-chose.trycloudflare.com`. Laisse ce terminal ouvert.
3. **Configure le serveur** : copie `server/.env.example` en `server/.env`, puis remplis :

   ```bash
   BOT_TOKEN=le-token-de-botfather
   WEBAPP_URL=https://quelque-chose.trycloudflare.com
   ```

   Toutes les variables sont commentées dans le fichier. Avec un token, l'identité de test du navigateur est coupée : ajoute `DEV_AUTH=true` pour continuer à tester aussi dans le navigateur.
4. **Relance** `npm run dev` (Ctrl+C puis `npm run dev`).
5. **Sur ton téléphone**, ouvre la conversation avec ton bot et envoie `/start` : il répond avec le bouton « Ouvrir Scroll-up ». Le bouton « Ouvrir », à gauche du champ de saisie, lance aussi l'app.

À savoir :

- L'adresse `trycloudflare.com` change à chaque lancement de cloudflared. Mets alors à jour `WEBAPP_URL` et relance `npm run dev`.
- **Photos** : sans réglage, les photos envoyées depuis l'app sont gardées sur ton ordinateur (`server/data/photos/`). Pour les ranger dans Telegram comme prévu, crée un groupe privé, ajoutes-y le bot, puis mets son identifiant dans `STORAGE_CHAT_ID` (il commence par `-100…` ; pour le trouver, envoie un message dans le groupe puis ouvre `https://api.telegram.org/bot<TOKEN>/getUpdates`).
- **Relances** : elles partent vers 19 h (heure de chacun) si rien n'a été fait dans la journée. Pour en recevoir une tout de suite, mets `REMINDER_HOUR` à l'heure en cours et relance le serveur.
- Facultatif : dans BotFather, `/newapp` crée un lien direct vers l'app (`t.me/<bot>/<app>`), pratique à partager avec des testeurs.

### Commandes

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

## Mise en production

Il faut un hébergeur Node.js avec un **disque persistant** (la base SQLite est un fichier) : un petit VPS, Railway ou Fly.io avec un volume, par exemple.

```bash
npm ci
npm run build          # construit app/dist
npm start              # migrations + serveur (API, bot, Mini App) sur $PORT
```

Variables à définir : `NODE_ENV=production`, `BOT_TOKEN`, `WEBAPP_URL` (l'adresse publique du serveur), `STORAGE_CHAT_ID`, et `DATABASE_URL` pointant vers le volume (ex. `file:/data/scroll-up.db`). Par défaut, le bot reçoit les messages en *long polling* (rien à configurer) ; `BOT_MODE=webhook` passe en webhook, sur `https://<ton-domaine>/telegram/webhook`.

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
