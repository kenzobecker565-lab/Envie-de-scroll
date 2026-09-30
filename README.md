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
app/        La Mini App (React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Motion)
prototype/  Le prototype web précédent (archive)
promo/      Les pubs en motion design
```

C'est un espace de travail npm (*workspaces*) : un seul `npm install` à la racine installe tout.

---

## Tester l'application

> Pas envie d'installer quoi que ce soit ? Passe directement à [Mettre l'app en ligne](#mettre-lapp-en-ligne-sans-rien-installer) : tout se fait dans le navigateur, et tu testes ensuite depuis Telegram.

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

## Mettre l'app en ligne (sans rien installer)

Le plus simple : [Railway](https://railway.com). Tout se fait dans le navigateur. Railway construit l'app depuis GitHub, la garde allumée (le bot doit tourner en continu) et lui donne une adresse HTTPS. Le dépôt contient déjà tout ce qu'il lui faut : le `Dockerfile` et `railway.json`.

**Prix** : l'essai offre 5 $ de crédit pendant 30 jours, largement assez pour tester. Ensuite, le plan Hobby coûte 5 $ par mois, crédit d'usage inclus ([tarifs](https://docs.railway.com/pricing/plans)).

### 1. Créer le bot

Dans Telegram, écris à [@BotFather](https://t.me/BotFather), envoie `/newbot`, appelle-le `Scroll-up` et choisis un identifiant qui finit par `bot`. Garde le **token** qu'il te donne (une ligne du type `123456789:AAH…`).

### 2. Créer le projet sur Railway

1. Va sur [railway.com](https://railway.com) et connecte-toi avec ton compte **GitHub**.
2. Ouvre [railway.com/verify](https://railway.com/verify) pour **vérifier ton compte**. Sans vérification, l'essai limite les connexions sortantes, et le bot risque de ne pas joindre Telegram.
3. **New Project**, puis **Deploy from GitHub repo**. Choisis `Envie-de-scroll`. S'il n'apparaît pas, clique sur **Configure GitHub App** et donne à Railway l'accès à ce dépôt.
4. Railway crée un service et lance tout de suite une première construction, depuis la branche principale du dépôt. **Elle peut échouer, c'est normal** : on change de branche juste après.

### 3. Régler le service

Clique sur le service (le rectangle au milieu de l'écran) pour ouvrir son panneau.

1. Onglet **Settings**, partie **Source** : choisis la branche `claude/charming-curie-pg6vs5` (tant que la V1 n'est pas fusionnée dans la branche principale).
2. Onglet **Variables**, bouton **New Variable**, ajoute :
   - `BOT_TOKEN` : le token de BotFather ;
   - `PORT` : `8080`.
3. Ajoute un **volume**, le disque qui garde la base de données entre deux mises à jour. Fais un clic droit sur le fond du projet (ou `Ctrl+K` / `⌘K`, puis tape « volume »), choisis **Volume**, sélectionne le service, puis indique le chemin de montage **`/data`**.
4. Onglet **Settings**, partie **Networking** : clique sur **Generate Domain** et indique le port `8080`. Tu obtiens une adresse du type `https://scroll-up-production.up.railway.app`.
5. **Applique tout** : Railway met les réglages en attente. Un bandeau en haut du projet indique le nombre de modifications : clique sur son bouton **Deploy**. Attention, le bouton « Redeploy » d'un ancien déploiement n'applique **pas** ces modifications.

La construction prend quelques minutes (onglet **Deployments**). Quand le déploiement est vert (**Active**) :

- ouvre `https://<ton-adresse>.up.railway.app/api/health` : la page doit afficher `{"ok":true}` ;
- dans les journaux (**View logs**), tu dois voir `[bot] Connecté : @ton_bot` puis `[bot] À l’écoute des messages`.

### En cas de souci

| Ce que tu vois | Ce qu'il faut faire |
| --- | --- |
| La construction échoue (croix rouge) sur la branche `claude/charming-curie-pg6vs5` | Copie les dernières lignes du journal de construction et envoie-les pour qu'on regarde. |
| L'adresse affiche « Application failed to respond » | Le port ne correspond pas : vérifie la variable `PORT` = `8080` et le port du domaine (Settings → Networking) = `8080`. |
| Journaux : `Telegram refuse BOT_TOKEN (401)` | Le token est mal copié : corrige la variable `BOT_TOKEN`, puis **Deploy** dans le bandeau. |
| Journaux : `Telegram injoignable` | Compte non vérifié : passe par [railway.com/verify](https://railway.com/verify), puis relance le déploiement. |
| Journaux : `WEBAPP_URL absente`, ou le bot répond sans bouton « Ouvrir Scroll-up » | Ajoute la variable `WEBAPP_URL` avec ton adresse complète (`https://…up.railway.app`), puis **Deploy**. |
| Journaux : `409: Conflict` | Le même token est utilisé ailleurs en même temps (par exemple l'app lancée sur ton ordinateur) : arrête l'autre. |
| Dans un navigateur, l'adresse affiche « Ouvre l'app depuis Telegram » | C'est normal : l'app ne fonctionne que dans Telegram. |

### 4. Tester

Sur ton téléphone, ouvre la conversation avec ton bot et envoie `/start`. Touche **« Ouvrir Scroll-up »** : c'est parti. Le bouton **Ouvrir**, à gauche du champ de saisie, lance aussi l'app.

Pour faire tester d'autres personnes, envoie-leur simplement le lien de ton bot (`t.me/ton_bot`). Dans BotFather, `/newapp` crée aussi un lien direct vers l'app (`t.me/ton_bot/app`).

### À savoir

- **Mises à jour** : chaque nouveau commit sur la branche redéploie l'app tout seul. Pendant quelques secondes, l'app est indisponible : Railway arrête l'ancienne version avant de lancer la nouvelle, pour protéger la base de données.
- **Photos** : sans réglage, elles sont gardées sur le volume. Pour les ranger dans Telegram comme prévu, crée un groupe privé, ajoutes-y le bot, puis ajoute la variable `STORAGE_CHAT_ID` avec l'identifiant du groupe (voir plus haut).
- **Adresse** : l'app utilise automatiquement le domaine Railway. Avec un nom de domaine à toi, ajoute la variable `WEBAPP_URL` (ex. `https://app.scroll-up.fr`).
- **Autres hébergeurs** : le `Dockerfile` marche partout (Fly.io, Render, un VPS…). Il faut un disque persistant monté sur `/data`, la variable `BOT_TOKEN`, et `WEBAPP_URL` avec l'adresse publique. Sans Docker : `npm ci`, `npm run build`, puis `npm start` avec `NODE_ENV=production` et `DATABASE_URL=file:/chemin/vers/scroll-up.db`.
- **Webhook** : par défaut, le bot va chercher ses messages chez Telegram (*long polling*), rien à configurer. `BOT_MODE=webhook` le fait passer en webhook, sur `https://<ton-domaine>/telegram/webhook`.

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
10. **Galerie** : le total de pièces d'or en grand, puis une carte par activité (photo, citation, ou titre exploré), groupées par mois. Jamais de calendrier. Chaque création se partage à un ami.
11. **Paliers** : 5 min, 30 min, 1 h, 2 h, 5 h, 10 h, 20 h de création. Le palier franchi est célébré à la confirmation ; la galerie montre la jauge du prochain (« plus que 25 min »). Du temps gagné, jamais du temps manqué.
12. **Réglages** (bouton à côté des pièces, sur l'accueil) : le style en grille, les passions, la musique d'ambiance, les relances du bot, « Ajouter à l'écran d'accueil » (Telegram 8 et plus), inviter un ami, donner son avis.
13. **Musique d'ambiance** : un jazz noir tout doux (`app/public/music/jazz-noir.mp3`, morceau original libre de droits généré avec vidIQ, bouclé sans coupure). Elle démarre au premier toucher, se coupe d'un geste (bouton note de musique de l'accueil, ou réglages ; le choix est gardé sur le téléphone), se retire quand l'app passe en arrière-plan, et pendant les activités Musique et Cinéma. Le volume passe par Web Audio, pour être réglable aussi sur iPhone (`src/lib/ambient.ts`).

## Pendant le test : avis, notes et chiffres

- **Avis écrits** : « Un avis, une idée ? » sur l'accueil, « Donner mon avis » dans les réglages, ou « Un mot à ajouter ? » après une activité. Un testeur peut aussi simplement écrire au bot. Chaque avis arrive **en direct dans Telegram, chez les admins**.
- **Note de chaque activité**, juste après « Activité enregistrée. » : j'ai adoré, sympa, pas pour moi. De quoi trier les 60 activités.
- **Suivi d'usage** (sans aucun texte libre) : ouvertures, appuis sur le gros bouton, humeur, temps et passion choisis, partages, invitations. On voit où le parcours se perd.
- **Devenir admin** : envoie `/admin` au bot **avant de partager le lien** : la première personne qui le fait devient admin. On peut aussi fixer la variable `ADMIN_IDS` (identifiants Telegram séparés par des virgules), qui prend alors le dessus.
- **Commandes d'admin** : `/stats` (le test en chiffres : testeurs, entonnoir du parcours, passions, durées, humeurs, notes, activités les mieux et les moins bien notées), `/avis` (les derniers avis), `/export` (deux fichiers CSV à ouvrir dans Excel : activités validées et avis). Pour un testeur, `/stats` donne ses propres chiffres.

## Les règles

- **Choix de l'activité** (`shared/src/selection.ts`) : tirage parmi les 5 activités de la passion × du temps, en écartant les 3 dernières proposées pour cette combinaison. « Une autre idée » écarte toujours l'activité affichée : en enchaînant, une activité ne revient jamais dans 4 propositions d'affilée. Le mood ne change que le ton de l'introduction.
- **Pièces d'or** : 1 minute d'activité = 1 pièce. Cumulatif, rien à dépenser.
- **Garde-fou temporel** (`shared/src/rules.ts`) : pour Musique et Cinéma, « Valider » reste grisé jusqu'à la fin de la durée choisie. Le bouton se remplit doucement, sans compte à rebours. Pour Dessin et Écriture, on valide tout de suite avec une photo ou un texte, ou « sans » une fois la durée écoulée. Le serveur applique les mêmes règles : l'horloge du téléphone ne suffit pas à tricher.
- **Reprise** : une activité proposée reste « à reprendre » 12 h. Pratique quand on quitte Telegram pour écouter un album : en revenant, le minuteur a continué.
- **Photos** : envoyées depuis l'app, réduites à 1600 px, puis relayées par le bot vers le chat privé de stockage. Seul le `file_id` Telegram est gardé en base, et le serveur relaie l'image à l'affichage (le token ne quitte jamais le serveur). Une photo envoyée **directement au bot** rejoint le dernier dessin enregistré sans photo.
- **Relances** (`server/src/bot/reminders.ts`) : au plus une par jour, à 19 h dans le fuseau de chacun (`REMINDER_HOUR`), jamais un jour où une activité a été faite. Les deux messages alternent. Après 5 relances sans ouverture de l'app, elles se mettent en pause. `/stop` les coupe, `/relances` les réactive, tout comme l'interrupteur des réglages de l'app.
- **Authentification** : les `initData` transmises par Telegram sont vérifiées avec le token du bot (signature HMAC, validité 24 h). Aucun compte à créer.

---

## Modifier les contenus

- **Les 60 activités** : `shared/src/activities.ts`, rangées par passion puis par temps. Le texte est stocké tel qu'il a été validé ; l'affichage ajoute seulement la typographie française (apostrophes courbes, guillemets « », espaces insécables). Les tests vérifient qu'il y a bien 5 activités par passion et par temps.
- **Ce que l'appli tire au hasard** : `shared/src/prompts.ts`. Huit activités demandent que l'appli propose quelque chose (« 3 mots que l'appli tire au hasard », « un film que l'appli te propose »…). Sans API externe, ces tirages se font dans des listes écrites à la main : mots, premières phrases, traits de caractère, genres musicaux, films, séries animées, courts-métrages. **Ces listes ne faisaient pas partie du contenu validé** : relis-les et enrichis-les librement (une ligne = un élément).
- **Introductions selon le mood** : `shared/src/intros.ts` (deux par mood).
- **Messages du bot** : `shared/src/reminders.ts` (relances) et `server/src/bot/bot.ts` (accueil, photos, avis, commandes d'admin).
- **Paliers de création** : `shared/src/feedback.ts` (`MILESTONES` : minutes à atteindre, titre, phrase de célébration).

Lance `npm test` après une modification.

---

## API

| Méthode | Route | Rôle |
| --- | --- | --- |
| `GET` | `/api/me` | Profil, statistiques, activité à reprendre (crée l'utilisateur à la première ouverture) |
| `PUT` | `/api/me/passions` | Choix des passions (1 à 3) |
| `PUT` | `/api/me/theme` | Choix du thème de l'app (`pop`, `nuit`, `bd`, `memphis`) |
| `POST` | `/api/proposals` | Tirer une activité ; avec `replacing` : « Une autre idée » |
| `POST` | `/api/completions` | Valider une activité (JSON, ou multipart avec une photo) |
| `GET` | `/api/completions` | La galerie, page par page |
| `PUT` | `/api/completions/:id/rating` | Noter une activité validée (3 j'ai adoré, 2 sympa, 1 pas pour moi) |
| `GET` | `/api/photos/:id` | Une photo (adresse signée, valable quelques heures) |
| `PUT` | `/api/me/settings` | Réglages (relances du bot) |
| `POST` | `/api/feedback` | Un avis écrit, transmis aux admins dans Telegram |
| `POST` | `/api/events` | Un événement d'usage (liste fermée, sans texte libre) |

Chaque requête porte `Authorization: tma <initData>`. Les types des requêtes et réponses sont dans `shared/src/api.ts`.

---

## Design

- **Direction « Pop »** : stickers, gros contours, ombres pleines décalées et couleurs franches (tomate, ciel, menthe, soleil, lilas) sur un fond beurre ; en sombre, fond presque noir et contours crème. Chaque passion a sa couleur : Dessin ciel, Écriture lilas, Musique menthe, Cinéma soleil.
- **Thèmes au choix** : le bouton palette de l'accueil (ou « Thème » dans la galerie) ouvre le choix du style, avec un aperçu de chacun. **Pop** reste le thème par défaut et suit le mode clair ou sombre de Telegram ; **Pop Nuit** (fond noir, contours crème, ombres violettes, titres en Rubik italique) est toujours sombre ; **BD** (cases, trame de points, lettrage Bangers, gros bouton en bulle) et **Memphis** (formes géométriques, Syne, ombre rayée) sont toujours clairs. Le choix s'applique tout de suite, est gardé sur le téléphone (pas de flash au démarrage) et dans le profil (`theme`, côté serveur) pour suivre l'utilisateur d'un appareil à l'autre. Chaque thème redéfinit la palette, les polices, les rayons et le motif du fond dans `index.css` (`[data-theme="…"]`) ; `src/lib/appTheme.ts` pose le thème sur `<html>` et `src/components/ThemePicker.tsx` affiche le choix.
- **Palette et typographies** : `app/src/styles/index.css`. Chaque couleur y a sa valeur claire et sa valeur sombre. Les couleurs par défaut de Tailwind sont désactivées : impossible d'utiliser une couleur hors palette par erreur. Idem pour les tailles de texte (Bricolage Grotesque 800 de 20 à 46 px pour les titres et les chiffres, Rethink Sans 11-16 px pour l'interface), les rayons (10, 18, 24 px, pilule) et les ombres pleines (3, 4 et 6 px de décalage). Le texte posé sur une couleur est toujours sombre (`on-color`), dans les deux thèmes.
- **Composants** : [shadcn/ui](https://ui.shadcn.com) (`app/src/components/ui/` : boutons, cartes, fenêtre modale, choix, pastilles, messages, champs de saisie, squelettes de chargement), sur la base de Radix UI. Leurs couleurs sont branchées sur la palette (`primary` = tomate, `card` = surface, `muted`, `border` = contour, `ring`… dans `index.css`), leurs tailles et marges sur les tokens (espacements 4 / 8 / 16 / 24 / 32 px). Pour en ajouter un : `npx shadcn@latest add <nom>` dans `app/`, puis l'adapter de la même façon. Seule différence avec shadcn : `accent` y est la couleur de marque, pas un fond de survol.
- **Thème** : suit `Telegram.WebApp.colorScheme` (et l'événement `themeChanged`), ou le réglage du système hors de Telegram. L'en-tête et le fond de Telegram prennent la couleur *canvas* de l'app.
- **SDK Telegram** (`app/src/telegram/`) : bouton retour natif, bouton principal natif (onboarding, envoi de la photo ou du texte : il reste au-dessus du clavier), vibrations (sélection, validation, erreur), glissement vertical désactivé pour ne pas fermer l'app en faisant défiler la galerie. Hors de Telegram, l'app affiche ses propres boutons.
- **Décor vivant** (`app/src/components/decor/`) : sur les bords de chaque écran, de petits stickers cernés d'encre (pastilles, étoiles, gribouillis) qui montent lentement, et un grain d'impression léger. Leurs couleurs suivent le parcours : calmes ou chaudes selon le mood, menthe à la validation. Chaque passion a sa scène animée : un crayon qui dessine, une plume qui écrit, un égaliseur qui danse, une pellicule qui défile. Sur l'accueil, les stickers des passions flottent autour du gros bouton.
- **Animations** (Motion, ex-Framer Motion) : transitions entre écrans, chaque bouton et chaque carte qui s'enfonce dans son ombre au toucher, choix qui se colorent et se penchent, fenêtre de détail de la galerie qui monte du bas (on la ferme en la glissant vers le bas, ou avec le bouton retour de Telegram), étapes du parcours qui se remplissent, texte des activités qui apparaît mot à mot, cadrans de durée, compteur « à rouleaux », célébration à la validation (rayons, pièce qui tournoie, pièces qui tombent dans le compteur, confettis). Les boucles n'animent que la position et l'opacité, pour rester fluides sur les petits téléphones. Si le système demande de réduire les animations, tout s'arrête et chaque décor reste sur une image fixe.
- **Icônes** : [Lucide](https://lucide.dev), trait épais, en `ink-soft` au repos et sombres sur la couleur une fois sélectionnées.
- **Illustrations** : [unDraw](https://undraw.co) (licence libre), recolorées avec les variables du thème par `app/scripts/recolor-undraw.mjs` et collées sur une carte comme un sticker : bienvenue, choix des passions, galerie vide, erreur de connexion, ouverture hors de Telegram.
- **Accessibilité** : `ink-faint` sert aux textes désactivés et aux indications de saisie ; les textes informatifs utilisent `ink-soft` ou `ink`. La tomate sert de fond, jamais de couleur de texte sur le fond clair (contraste trop faible) : pour un lien, on prend `accent-strong`.

## Hors périmètre de cette V1

Créneaux de 1 h et plus, personnalisation premium, paiement, boutique de badges, TMDB / Jikan, fonctions sociales, autres langues que le français.
