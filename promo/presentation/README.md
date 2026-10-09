# Vidéo de présentation Scroll-up (61 secondes, voix off)

▶️ **[Voir la vidéo](scroll-up-presentation.mp4)** (MP4, 1080 × 1920, 60 images/s, voix off, musique et bruitages)

Toute l'app en une minute, dans l'ordre où on la découvre, racontée par une voix off. Tout ce qu'on voit dans le téléphone est la vraie app, filmée.

Le slogan de fin : **« Transforme ton temps de scroll en créativité. »**

## Le texte de la voix off

> Deux mois par an. C'est le temps qu'on passe devant nos écrans, en moyenne. Et si on en reprenait un peu ?
> Voici Scroll-up, une app qui vit dans Telegram.
> Au départ, tu choisis tes passions : dessin, écriture, musique ou cinéma.
> Ensuite, quand ton pouce te démange, tu appuies sur un seul bouton.
> Ton humeur, ton temps, ta passion : trois petits taps.
> Et l'appli te propose une activité créative, de cinq à trente minutes.
> Tu dessines, tu écris, tu écoutes, tu regardes. Tu valides, avec une photo ou quelques mots.
> Chaque minute te rapporte une pièce d'or. Et chaque palier se fête.
> Ta galerie garde toutes tes créations. Pas de calendrier, pas de culpabilité.
> Choisis ton style parmi quatre thèmes, et laisse-toi porter par un petit air de jazz.
> Scroll-up. Transforme ton temps de scroll en créativité.
> C'est gratuit, sur Telegram.

## Le déroulé

| Temps | Ce qu'on voit | Ce qu'on entend |
| --- | --- | --- |
| 0 → 6,9 s | Le calendrier dont novembre et décembre sont avalés par un téléphone (« 2 MOIS par an »), puis le fil sans fin, la nuit, qui se fige sur « Et si on en reprenait un peu ? ». Source : 4 h par jour en moyenne, Baromètre du numérique 2025. | Deux notifications, un impact sur « 2 MOIS », un balayage par post ; le break de la musique tombe sur la question, avec une horloge. |
| 6,9 → 10,8 s | Éclair : le logo et « scroll-up ». Le téléphone revient sur la conversation avec le bot : /start, le message d'accueil, le bouton « Ouvrir Scroll-up ». | La musique repart pile sur « Voici ». |
| 10,8 → 16,4 s | L'app s'ouvre par-dessus la conversation : bienvenue, puis le choix des passions (un sticker par passion). | Un clic et une note par tap. |
| 16,4 → 23,6 s | Coup de fouet vers l'accueil. Le doigt tremble au-dessus du bouton (« quand ton pouce te démange »), puis appuie. Humeur, temps, passion : les trois sous-titres s'empilent. | |
| 23,6 → 29,9 s | L'activité proposée, puis « Une autre idée ». « de 5 à 30 minutes ». | |
| 29,9 → 33,5 s | Une activité par passion (dessin, écriture, musique, cinéma), une par verbe, le fond change de couleur. | Un fouet par activité. |
| 33,5 → 40,9 s | Valider : la photo du dessin, une carte « quelques mots » ; « Activité enregistrée », les pièces d'or qui jaillissent, le palier « 2 heures » et ses confettis. | Déclic photo, stylo, pièces, confettis, carillon. |
| 40,9 → 45,9 s | La galerie, puis le détail d'une création. « Pas de calendrier, pas de culpabilité. » | |
| 45,9 → 48,9 s | Les réglages : Pop Nuit, BD, Memphis, Pop, un par temps ; le fond suit le thème. | Un fouet et un déclic par thème. |
| 48,9 → 51,9 s | Le doigt remet la musique de l'app : tout passe en film noir (projecteur, ombre de store, grain, notes qui s'envolent). | La musique freine comme une bande, le jazz noir de l'app entre, avec des craquements de vinyle. |
| 51,9 → 61 s | Éclair : logo, « scroll-up », le slogan mot à mot sur la voix, puis `@scrollup_bot` et « Gratuit, dans Telegram. » | La musique revient d'un coup sur « Scroll-up », accord final et confettis. |

## Médias et crédits

- **Voix off** : générée avec [vidIQ](https://vidiq.com) (voix ElevenLabs « Sarah »), `media/voix-off.mp3`. C'est une voix anglophone qui lit du français : un léger accent reste. Pour la remplacer (ta voix, ou une voix française), garde le même texte et le même fichier `media/voix-off.mp3`, puis recale les instants de `cues.js` (voir plus bas).
- **Musique** : le morceau de la vidéo virale (`../viral/media/musique-vidiq.mp3`, généré avec vidIQ, libre de droits) et le jazz noir de l'app (`../viral/media/jazz-noir-vidiq.mp3`, idem).
- **Bruitages** : synthétisés dans `audio.mjs` (aucun sample).
- **Images de l'app** : filmées sur l'app elle-même, en local, avec des profils de démonstration (`../viral/capture-take.mjs` et `capture.mjs`).

## Refaire la vidéo

Prérequis : ceux des autres pubs (voir `../README.md`), et l'app lancée en local (`npm run dev` à la racine du dépôt) pour le tournage.

```bash
cd promo
node viral/capture-take.mjs           # 1. le parcours principal → build/viral/take/
node presentation/capture.mjs         # 2. l'arrivée, « Une autre idée », les réglages, la galerie, les 4 activités → build/presentation/
npm run presentation:render           # 3. bande-son + 3 660 images → build/presentation/scroll-up-presentation.mp4
```

| Commande | Rôle |
| --- | --- |
| `node presentation/capture.mjs [passage…]` | Filme l'app en temps réel (`onboarding`, `reroll`, `settings`, `gallery`) et photographie une activité par passion (`ecrans`). Sans argument, tout. |
| `npm run presentation:render` | Rendu complet (`-- --workers=N`) |
| `npm run presentation:audio` | Refait seulement la bande-son dans la vidéo déjà rendue |
| `npm run presentation:stills` | Quelques images clés dans `build/presentation/stills/` |

## Modifier la vidéo

- **Le rythme** : `cues.js`. Chaque instant est celui d'un mot de la voix off (`vo(t)` : le mot dit à `t` secondes dans le fichier de la voix). Les instants viennent d'une transcription horodatée mot à mot (faster-whisper, modèle « small »).
- **La musique** : `MUSIC` dans `cues.js` dit quel passage du morceau jouer avant et après le jazz ; `levelMusic()` dans `audio.mjs` remonte le début du morceau, très doux, près du niveau du reste.
- **Le montage de l'app** : `cuts` dans `main.js` associe chaque moment de la vidéo à un passage d'un tournage, par ses repères (`marks.json`) et ses taps.
- **Les sous-titres** : `buildCaptions()` dans `main.js`. Un morceau peut avoir son propre instant (celui du mot dans la voix) ; un morceau coloré devient un sticker.
- **Le son** : `score()` dans `audio.mjs` ; les niveaux de la voix, de la musique et du jazz sont dans `renderAudio()`.
