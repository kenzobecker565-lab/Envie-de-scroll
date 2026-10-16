# Mémoire du projet Scroll-up

Fichier de passation entre sessions de travail avec Claude. Il résume tout ce qu'il faut savoir pour reprendre sans relire l'historique. Mis à jour le 16 octobre 2026.

**À une nouvelle session : lis ce fichier en entier avant de toucher à quoi que ce soit.** Pour le détail du code, le graphe `graphify-out/` (skill `/graphify`) évite de relire tout le dépôt.

---

## 1. Qui, et comment travailler avec lui

- **Kenzo Becker**, 19 ans, en 2e année de BUT GACO. Il fonde plusieurs projets à côté, dont Scroll-up, dont il est **le seul fondateur**. E-mail : kenzobecker565@gmail.com. Il teste sur un téléphone **Android**.
- **Langue** : tout en français, en le tutoyant. Ses messages ont beaucoup de fautes de frappe, il faut comprendre l'intention.
- **Il travaille aussi avec ChatGPT/Codex**, qui développe beaucoup de l'app (branches `codex/*`, fusionnées dans `develop` et `v1-test`). Claude sert souvent à relire, donner un avis honnête, faire des documents, des vidéos, le site, des recherches.

**Leçons apprises (à respecter) :**
- Il a dit « tu es assez mauvais en design ». Pour tout visuel, **faire un rendu (Playwright), le regarder et le corriger avant de livrer**. Partir des vraies images de l'app plutôt que d'inventer. Claude ne génère pas d'images : ChatGPT le fait.
- Pour les gros changements de design, il préfère **voir des propositions avant qu'on les applique à l'app** (« propose-moi plutôt des templates »). Parfois il donne « carte blanche » : alors on fait.
- **Ne jamais mélanger le dossier de cours et le vrai projet.** Voir la section 9. Le 15/10, il a recadré : « ce n'est pas pour le marketing, c'est pour le vrai projet, Lukas n'est donc pas mon co-fondateur ».
- **Montrer seulement ce qui existe vraiment** dans la version testée (V1). Vérifier dans le code de `origin/v1-test` avant d'affirmer quoi que ce soit sur l'app.
- **Branches** : ne pousser que sur la branche de travail désignée. Ne fusionner dans `v1-test` ou `develop` qu'avec son accord explicite (il l'a donné une fois, pour la musique : PR #59 et #60).
- **Commits et PR** : pas de nom de modèle, et les lignes d'attribution demandées par le système.
- Il aime les **avis francs** (« dis-moi honnêtement ») et les recherches approfondies.

---

## 2. Le produit

**Scroll-up** s'appelait d'abord « Plutôt Que Scroller ». C'est une app qui intercepte l'envie de scroller et propose à la place une activité créative courte, liée à une passion.

- **Ton** : chaleureux, jamais punitif ni culpabilisant. On ne bloque rien, on propose mieux.
- **Promesse** : « Ton envie de scroller peut créer quelque chose. » L'app garde une trace de ce qui est créé.
- **But final : l'App Store (puis Google Play).** Telegram (Mini App) sert seulement à développer et tester. Kenzo a dit : « n'oublie pas que l'application a pour but de finir sur l'App Store ».

**Éléments clés**
- **Minuton** : la mascotte, un chronomètre jaune avec bras et jambes. Il a des poses (welcome, cheer, idea, think, wait, draw, write, piano) et des tenues.
- **Minutons** : la monnaie. 1 minute d'activité terminée = 1 minuton. Pour les énigmes et le français, seul le temps réellement passé compte si l'énigme n'est pas résolue (correctif demandé le 06/10).
- **Durées** : 5, 15 ou 30 minutes.
- **Passions actives (V1 et develop)** : Dessin, Piano, Écriture, Sport, Logique et énigmes, Français. Les anciennes (Musique, Cinéma/Animation, Rythme) sont retirées et remappées : musique et rythme vers sport, cinéma vers logique.
- **Contenu (V1)** :
  - 154 activités : dessin 15, piano 15, écriture 15, sport 21, logique 20, français 20.
  - « Apprendre » : 72 leçons, soit 12 par passion. Les essais sont gardés dans des « carnets d'apprentissage ».
- **Niveaux** : 5 par passion, atteints à 5, 30, 120, 300 et 600 minutons. Les titres sont dans `shared/src/progress.ts`. Exemple en dessin : Gribouilleur·euse → Croqueur·euse → Dessinateur·rice → Illustrateur·rice → Virtuose du trait.
- **Boutique** : tenues de Minuton, ambiances, morceaux de piano, thèmes, palettes, avec des collections (sports, arts, Halloween…).
  - Tenues **en vente dans la V1** : Artiste 40, Pianiste 70, Footballeur 65, Basket 70, Judoka 70, Cavalier 80.
  - Tenues privées par code (Rabbi Jacob, Poney, Maradona, Ranma). Côté develop seulement, le code `TESTEURSV1` donne « Minuton Explorateur ».
- **Musique d'ambiance** : la signature par défaut est « Le grand défilé » (bossa et orchestre, `app/public/music/le-grand-defile.mp3`, générée par `promo/ambiances/grand-defile.mjs`). Il y a aussi lo-fi, jazz noir, bossa, acoustique, 8-bit et ambient, avec un bouton pour couper le son.
- **Autres fonctions** : rappel une fois par jour au maximum, à l'heure choisie, ou « Pas de notification ». Relances par le bot (/stop pour les couper, /relances pour les réactiver).
  - « Donner mon avis » en fin d'activité, ou en écrivant au bot.
  - « Effacer mes données » dans les réglages.
  - « Le mot du jour ».
  - Tutoriel guidé de 13 étapes qui emmène sur chaque page.
  - Dessin au doigt (couleurs Encre, Tomate, Ciel, Menthe, Soleil, Lilas) ou photo d'un dessin papier.
  - Piano jouable à l'écran, en grand en mode paysage.
  - Coup de pouce : « Une piste pour commencer », « Un défi en plus », « Pas de papier ? ».
  - Partage à un ami.

**Parcours dans la V1 des testeurs** (vérifié le 15/10 en lançant `v1-test` en local)
1. **Onboarding** : 1/3 bienvenue (« J'ai envie de scroll », « Apprendre », « Chez Minuton ») ; 2/3 choix des passions (autant qu'on veut) et, si piano, « Ton niveau au piano ? » ; 3/3 « Ton moment pour créer » (heure du rappel).
2. **Accueil** : « Bonsoir Camille. » (Camille est le nom de l'utilisateur de test), Minuton sur fond d'aurore boréale, le gros bouton « J'ai envie de scroll », « Le mot du jour », « À découvrir », « Chez Minuton ». Barre du bas : Accueil, Passions, Apprendre, Boutique, Profil.
3. **« J'ai envie de scroll »** : combien de temps, quelle passion (ou « Surprends-moi »), puis « Propose-moi une activité ».
4. **« Une idée pour toi »** : **une seule idée** à la fois, avec le coup de pouce, « Commencer » et « Une autre idée ». Sur `develop`, Codex est passé à **trois idées** (commit 7bcf54d).
5. **Activité** : la consigne reste en haut.
6. **Fin** : « Bien joué ! », « +15 minutons », « Ce dessin n'existait pas il y a 15 minutes », puis « Voir chez Minuton ».
7. **Chez Minuton** : l'atelier, « Le mur des dessins », une création à mettre à l'honneur.

**Bot Telegram V1** : « Démarrer » envoie le message de bienvenue avec le bouton « Ouvrir Scroll-up ». Un bouton de menu « Ouvrir » existe aussi.
- Petite incohérence à signaler à Kenzo : le message parle encore de « musique, cinéma » et dit « J'ai envie de scroller » alors que le bouton s'appelle « J'ai envie de scroll » (`server/src/bot/bot.ts`).

---

## 3. Le dépôt et la technique

Dépôt : `kenzobecker565-lab/Envie-de-scroll`. C'est un monorepo npm (workspaces) : un seul `npm install` à la racine.

```
shared/   types, contenus et règles (activities.ts, passions.ts, progress.ts, shop.ts, rules.ts, ambiances.ts…)
server/   Express + Telegraf (bot) + Prisma/SQLite ; DEV_AUTH=true pour tester hors Telegram
app/      Mini App : React, Vite, TypeScript, Tailwind, shadcn/ui, Motion ; polices @fontsource
promo/    vidéos et musiques générées (Playwright + ffmpeg, dsp.mjs, ambiances/)
site/     le site de présentation (statique), voir section 6
android/  (sur v1-test) APK Android V1 sans Telegram (PR #69, workflow android-v1.yml)
prototype/ ancien prototype web ; graphify-out/ graphe du dépôt
```

- **Commandes** : `npm run dev` (serveur 3000 + app 5173), `npm test`, `npm run typecheck`, `npm run build`, `npm start`.
- **Déploiement** : Railway, avec le Dockerfile et `railway.json` (healthcheck `/api/health`, volume `/data`). Variables : `BOT_TOKEN`, `PORT=8080`, `WEBAPP_URL`, `STORAGE_CHAT_ID`, `BOT_MODE`. Chaque commit sur la branche suivie redéploie.

**Lancer une branche en local** (recette qui marche dans le conteneur cloud)
- `git worktree add --detach <dossier> origin/v1-test`. Dans le worktree, remplacer `node_modules` par un vrai dossier de liens vers ceux du dépôt principal, mais **copier** `@fontsource` et `@fontsource-variable` : sinon Vite refuse les polices (403, `fs.allow`).
- Dans `<dossier>/server` : `npx prisma generate`. Le client généré du dépôt principal ne correspond pas forcément, et on obtient l'erreur P2022 ColumnNotFound.
- Serveur : `DATABASE_URL=file:<db> BOT_MODE=off PORT=3000 DEV_AUTH=true npm start` (en arrière-plan).
- App : `npx vite --port 3999 --strictPort --force` (en arrière-plan), puis ouvrir `http://localhost:3999/?dev_user=<numéro>` (chaque numéro est un nouvel utilisateur).
- **Piège** : `pkill -f "...vite --port 3999..."` dans une commande qui contient aussi ce texte tue son propre shell (code 144). Arrêter avec `ps -eo pid,args | awk '/[v]ite --port 3999/ {print $1}' | xargs -r kill` dans une commande à part.
- **Captures** : Playwright de `promo/node_modules/playwright/index.mjs`, avec `executablePath: '/opt/pw-browsers/chromium'`, 390×844, deviceScaleFactor 2. Le Chromium headless n'a pas de H.264 : prévoir une vidéo WebM en plus du MP4.
- **ffmpeg complet** : `/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2`. Celui de Playwright n'a ni décodeur WAV ni drawtext.
- **Sites externes** : Chromium ne fait pas confiance au proxy TLS du conteneur. Ne pas contourner la vérification TLS : utiliser WebFetch pour lire les pages.

---

## 4. Branches, bots et PR

- **Branche par défaut du dépôt** : `claude/kind-keller-t193rd` (et non `main`). Une nouvelle session clone celle-là : **il faut se placer sur `claude/charming-curie-pg6vs5`** pour retrouver ce fichier et le site.
- **`claude/charming-curie-pg6vs5`** : la branche de travail de Claude (site, musique, scripts promo, ce fichier).
  - Elle est en retard sur `develop` et `v1-test` pour l'app elle-même.
  - PR ouvertes : #2 (→ `claude/kind-keller-t193rd`, « V1 test en Telegram Mini App ») et #12 (→ `main`, logo).
- **`v1-test`** : la **V1 des testeurs**, servie par le bot de test. Dernier commit connu : cf882eb (13/10, APK Android).
- **`develop`** : la **version de développement**, avec la refonte ChatGPT, servie par le bot de dev.
- **`codex/*`** : les branches de travail de Codex/ChatGPT.
- **Bots** : le premier bot était **@scrollup_bot**, déployé sur `envie-de-scroll-production.up.railway.app` (30/09). Depuis le 09/10, il y a **deux bots distincts**, V1 testeurs et développement. Leurs noms exacts sont **à demander à Kenzo** : des noms comme @scroll_up_test_bot / @scroll_up_dev_bot n'étaient que des suggestions.
- **PR fusionnées par Claude** : #59 (`v1-test`) et #60 (`develop`), la musique par défaut « Le grand défilé ».

---

## 5. La refonte de `develop` (ChatGPT) et l'avis donné

- **Identité visuelle** :
  - police **Outfit** (850-900, logo en italique 900) ;
  - violet en dégradé #5624E4 → #6234E7 → #7134E9, lueur #9150FF, accent #6138D7 ;
  - encre #241333 / #24104A, papier #FFFAF4, crème #FFF9ED, lilas #EEE2FF / #E6D8FF ;
  - logo étincelle #AA6AFB / #CB9EFF.
- **Accueil « Le décollage »** : un avion en papier.
- **Autres nouveautés** :
  - flux à trois idées, XP de pratique ;
  - galerie personnelle avec carnets illustrés et exposition ;
  - « briefs » pratiques pour 90 activités.
- **Avis franc donné le 15/10** (« ce n'est que le commencement ») :
  - 6 onglets qui passent à la ligne ;
  - listes de passions en double ;
  - trop de compteurs (XP, minutons, niveaux, %) ;
  - mascotte dans chaque en-tête ;
  - curseur pour seulement 3 valeurs ;
  - ancien onboarding conservé ;
  - **risque juridique** des tenues à l'image de vraies personnes (Bruno Mars, Maradona).
- **Proposé, sans réponse** : navigation à 4 onglets, moins de compteurs, instructions à passer à ChatGPT.
- La proposition de refonte de Claude (canvas : https://claude.ai/artifact/KVEUuvch1fPMq59acCSNC5) a été jugée faible.

---

## 6. Le site web (`site/`) : dernier travail en cours

**Rôle** : faire rejoindre le test sur Telegram, puis proposer la liste d'attente App Store / Google Play. Il porte aussi les pages Confidentialité et Mentions légales, qui serviront aux stores.

- **Aperçu privé** : https://claude.ai/artifact/BoBLVGNBU7LvxQnXd5wVy7 (version 3).
  - L'aperçu est une copie dans le scratchpad, sans `<!doctype>`, `<html>` ni `<head>`, avec le titre « Site Scroll-up ». On la republie avec `files`.
- **Style** : celui de la refonte ChatGPT (Outfit, violet, crème). Le « créer ! » de la rature est en **Caveat**.
- **Fichiers statiques** : `index.html`, `styles.css`, `main.js`, `idees.js`, `vendor/qrcode.js` (MIT), `confidentialite.html`, `mentions-legales.html`, `favicon.svg`, `apple-touch-icon.png`, `og-image.jpg` (1200×630), `assets/`. Environ 1 Mo.
- **Images** :
  - `assets/v1-*.webp` sont des **captures réelles de la V1** : accueil, choix, dessin d'une fleur, fin, atelier, boutique, apprendre.
  - `passion-*.webp` sont les illustrations de la V1 (`passions-approved.webp` découpé).
  - `tenue-*.webp` sont les 6 tenues en vente dans la V1.

**Structure de la page**
1. Accueil : « J'ai envie de ~~scroller~~ créer ! », bouton « Essayer gratuitement ».
   - Réassurances : sans inscription, sans pub, rien n'est bloqué.
   - Visuel : le téléphone, l'autocollant « +15 minutons » et la citation « Ce dessin n'existait pas il y a 15 minutes ».
   - Chiffres : 154 / 72 / 6 / 5·15·30.
2. Bande d'activités qui défile.
3. Démo identique à l'app : temps, passion ou « Surprends-moi », une idée, « Une autre idée », avec les vraies activités (`idees.js`).
4. « Comment ça marche », en 4 étapes. Sur ordinateur, le téléphone change d'écran pendant la lecture.
5. Passions : cartes à retourner (une activité et les 5 niveaux).
6. Apprendre : les 72 leçons.
7. « Ce que tu y gagnes » : minutons, tenues, niveaux, atelier.
8. « Fais le calcul » : un curseur de temps de scroll (2 h 39 par défaut, Médiamétrie août 2026), soit 40 jours par an, et ce que rendraient 5, 15 ou 30 minutes par jour. Suivi d'un bouton.
9. « Rejoins le test en 30 secondes » : onglets « J'ai Telegram » (3 étapes vérifiées dans le code du bot) et « Je n'ai pas Telegram » (liens officiels d'installation). Il y a aussi un bloc APK caché, un QR code sur ordinateur et la liste d'attente.
10. FAQ de 10 questions, seulement des faits vrais de la V1, âge à partir de 15 ans. Puis le pied de page « Créé par Kenzo Becker » et « Scroll up ! » pour remonter en haut.
11. Sur téléphone, une barre « Essayer » reste en bas entre l'accueil et la section Rejoindre.

**`CONFIG` en haut de `main.js`**
- `botUrl` est **indispensable** et vaut encore `https://t.me/TON_BOT`. Si possible, mettre un lien direct de Mini App (`t.me/bot/app`).
- `waitlistEndpoint` : Formspree, Tally ou Brevo.
- `apkUrl` : vide, donc le bloc APK reste caché.
- `contactEmail`.
- `plausibleDomain` : mesure d'audience sans cookie, facultative.

**Reste à faire (côté Kenzo)**
- Fournir le lien du bot V1, l'e-mail de contact et choisir l'hébergeur (Netlify ou Cloudflare Pages conseillés).
- Décider pour l'APK.
- Remplir les passages jaunes des pages légales : date, contact, statut et SIRET, adresse, hébergeur, durée de conservation, service de formulaire.
- Mettre une adresse absolue pour `og:image` une fois le domaine connu.

**Historique des versions du site** : V1 simple → V2 « riche », jugée trop « marketing » car elle reprenait des éléments du dossier → V3 actuelle (15/10).

---

## 7. Recherches déjà faites (à réutiliser)

- **Usage des réseaux** :
  - Médiamétrie, août 2026 : 83 % des 15-24 ans vont chaque jour sur un réseau social, 2 h 39 par jour.
  - Pew 2025 : 45 % des ados américains disent y passer trop de temps (27 % en 2023).
- **Design et UX** :
  - NN/g : les tutoriels d'onboarding aident peu.
  - Mouvement Material : environ 300 ms.
  - Core Web Vitals : LCP ≤ 2,5 s, INP ≤ 200 ms.
  - WCAG 2.2 : cibles tactiles de 24 px (44 px en AAA).
- **Juridique** :
  - En France, un mineur peut consentir seul dès 15 ans (RGPD).
  - La loi sur les réseaux sociaux avant 15 ans a été censurée le 14/08/2026.
- **Stores** :
  - Les achats numériques dans une Mini App Telegram passent obligatoirement par les Telegram Stars.
  - Play Store : test fermé de 12 testeurs pendant 14 jours, API cible 36. Kenzo a dit « par Google mais ne fais rien pour le moment ».
- **Sites de référence** : one sec (promesse chiffrée, science, preuves, FAQ), Opal (« gemmes » à collectionner, chiffres de temps gagné), Headspace (choix d'objectif). Les démos interactives et les preuves précises convertissent mieux. Tendance 2026 : rejet du look « fait par IA », place au tactile et au fait main.
- **Monétisation du vrai projet** : **pas décidée**. On en a parlé (version finale avec plus de contenu et de fonctions). La formule « Scroll-up Plus » vient du **dossier de cours**, elle n'est pas validée pour le vrai produit.

---

## 8. Livrables produits (et où ils sont)

**Artifacts claude.ai** (privés, liste complète avec `Artifact action:list`)
- Site Scroll-up : https://claude.ai/artifact/BoBLVGNBU7LvxQnXd5wVy7
- Scroll-up : refonte (canvas) : https://claude.ai/artifact/KVEUuvch1fPMq59acCSNC5
- Scroll-up : dossier de marketing stratégique (cours) : https://claude.ai/artifact/V59vqznwMs7euPW8K6wwq9
- Apparitions Scroll-up (animations du nom et de Minuton) : https://claude.ai/artifact/AkAHB4Jch3h4EdjBcyHfqT
- L'atelier de Minuton, cahier des charges V1 : https://claude.ai/artifact/MtBmLXSW5oJhSfU3yuoAiX
- Scroll-up : 4 restructurations : https://claude.ai/artifact/TGLXd1QbuJi4zYZvBvtDwu
- Scroll-up : le projet en entier : https://claude.ai/artifact/J8nbwhYzfL5j7V6EUtDttG
- Scroll-up prêt pour le test : https://claude.ai/artifact/RWVzfKiNTtXdxKXnrnruXR
- 3 directions artistiques : https://claude.ai/artifact/Jb77FiiZfPC1BN4kWezFkB
- Logo ScrollUp : https://claude.ai/artifact/VDzLMNh2A126szpHv8MVga
- Maîtriser LinkedIn depuis zéro : https://claude.ai/artifact/M9o5c16Xn2URBKgewR44DE

**Dans le dépôt** : `site/`, `promo/` (pubs et générateurs de musique), `docs/`.

**Story Instagram de 10 s « Top chrono »** : sauvegardée dans `promo/story-10s/` (MP4, template, script de rendu).

**Documents Word** envoyés à Kenzo le 16/10. Ils ne sont pas dans le dépôt : « le projet en entier » (01/10), « avant / après » (03/10) et le dossier marketing de cours (14/10).

---

## 9. À NE PAS MÉLANGER : le dossier de cours (GACO, marketing)

Travail de groupe sur une **entreprise fictive**, Scroll-up présentée comme une idée pas encore publiée, avec son binôme **Lukas Guerrero**. Dans ce dossier seulement :
- Lukas est « co-fondateur » ;
- l'histoire est « on s'en est rendu compte pendant les vacances » ;
- présentation le 1er septembre ;
- cible 15-35 ans ;
- zone : France et pays francophones ;
- communication : Minuton mis en avant comme Duolingo ;
- prix : entrée gratuite et abonnement « Scroll-up Plus ».

Consignes : ne pas parler de la phase de test, et rester court quand on cite des enquêtes.

**Rien de tout cela ne doit apparaître dans le vrai projet** (site, app, stores).

Autres travaux de cours ou perso dans les artifacts, sans lien avec Scroll-up : Lacoste, Bottles, étude de marché vélo, Vinted, TRANS, fiches marketing durable, offre de sites web pour commerces locaux.

---

## 10. Chronologie résumée des demandes

- **30/09** :
  - cadrage V1 Telegram Mini App ;
  - nom « Scroll-up » ;
  - déploiement Railway (@scrollup_bot) ;
  - app « vivante » (décors, animations), shadcn/ui ;
  - directions artistiques : choix de **C (Pop)**, puis thèmes Pop, Pop Nuit, BD, Memphis ;
  - pub en motion design, vidéo virale ;
  - musique jazz noir et bouton pour couper le son.
- **01/10** :
  - plusieurs ambiances musicales ;
  - progression par passion ;
  - monnaie renommée « minutons » ;
  - parcours progressifs ;
  - améliorations de contenu (carte blanche) ;
  - document Word « le projet en entier » ;
  - graphify installé pour économiser des tokens ;
  - raccourci écran d'accueil ;
  - restructuration de l'app (choix A, bouton 1C) ;
  - éviter le côté trop enfantin.
- **02/10** :
  - bouton « Effacer mes données » ;
  - nouvelles passions avec niveau, dont le **piano** (mode leçons sans humeur ni chrono, validation au clavier, mode paysage) ;
  - logo choisi.
- **03/10** : grosse refonte faite avec ChatGPT ; avis de Claude et Word avant / après.
- **04/10** :
  - idée « L'atelier de Minuton » (cahier des charges pour GPT) ;
  - question : comment partager le test et continuer à développer sans toucher la version des testeurs, d'où les branches `v1-test` et `develop` ;
  - pub, premier site.
- **05/10** : musique par défaut plus rythmée, style bossa ; posts et formation LinkedIn.
- **06/10** :
  - profil LinkedIn ;
  - reprise après ChatGPT (refonte « Apprendre ») ;
  - tour complet de l'app avant la V1 ;
  - correctifs : minutons gagnés sans rien faire dans les énigmes, noms de passions lisibles, tutoriel complet qui emmène sur chaque page.
- **07/10** : questions Play Store, testeurs, APK. Pas d'action demandée.
- **09/10** :
  - deux bots en place (V1 et dev) ;
  - 5 pistes de musique signature ; choix de **« Le grand défilé »**, fusionné dans V1 et dev ;
  - apparitions du nom ; story de 10 s « Dispo en test sur Telegram » ;
  - recherche pour la version finale (objectif App Store) ; réflexion sur la monétisation.
- **13-14/10** : dossier marketing de cours (Docs puis Word) ; recherche design et refonte (jugée faible).
- **15/10** : avis sur la refonte ChatGPT de `develop` ; site web en trois versions (V3 actuelle, fidèle à la V1).
- **16/10** : création de ce fichier.

---

## 11. Pistes ouvertes et prochaines étapes possibles

1. **Site** : brancher le vrai lien du bot, puis héberger et remplir les pages légales (voir section 6).
2. **App** : corriger le message de bienvenue du bot ; suivre la refonte `develop` (4 onglets, moins de compteurs, retirer les tenues à l'image de vraies personnes).
3. **Version finale** : choix technique pour l'App Store (Capacitor ou React Native, plutôt qu'une Mini App) ; monétisation à décider ; Play Store « par Google » mis en attente par Kenzo.
