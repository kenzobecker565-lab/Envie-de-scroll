# Studio Minuton

Un mini studio d'animation pour fabriquer les épisodes de Minuton :

- **un moteur** qui dessine chaque image à partir d'un fichier d'épisode : personnages, décors, effets, caméra, transitions ;
- **Minuton en marionnette articulée** : corps tirés des images de l'artset (face, trois-quarts, profil, dos), bras, jambes, pieds et visage dessinés en vectoriel. Il marche, court, saute, salue, s'assoit, dort, tourne sur lui-même et prend toutes les expressions sans qu'on génère de nouvelle image ;
- **une bande son automatique** : les pas, sauts, éclaboussures et transitions ont leur bruitage tout seul, avec de la musique en quatre styles et l'ambiance du décor. Tout est synthétisé, sans aucun droit à gérer ;
- **un éditeur web** pour regarder l'épisode avec le son, avancer image par image et voir la timeline ;
- **l'export MP4** vertical 1080 × 1920 pour YouTube Shorts.

## Lancer

Prérequis : Node.js 20 ou plus récent, Chromium pour Playwright, et `ffmpeg`.

```bash
cd studio
npm install
npx playwright install chromium   # une seule fois
npm run dev                        # éditeur : http://localhost:5180/studio/editor/
```

| Commande | Rôle |
| --- | --- |
| `node render.mjs 03_la_flaque` | Vidéo finale → `build/03_la_flaque.mp4` |
| `node render.mjs 03_la_flaque --draft` | Brouillon rapide en 540 × 960 |
| `node render.mjs 03_la_flaque --sheet` | Planche contact (une image par seconde) |
| `node render.mjs 03_la_flaque --stills=2,7.5` | Images fixes aux instants choisis |
| `node render.mjs 03_la_flaque --audio` | Seulement la bande son |
| `node render.mjs 03_la_flaque --safe` | Dessine les zones cachées par l'interface Shorts |

Dans l'éditeur :
- <kbd>Espace</kbd> lance ou met en pause ;
- <kbd>←</kbd> et <kbd>→</kbd> avancent image par image, avec <kbd>Maj</kbd> par pas d'une seconde ;
- <kbd>L</kbd> fait boucler les trois secondes autour de la tête de lecture ;
- cliquer dans la timeline ou dans la liste des événements y emmène ;
- quand le fichier de l'épisode est enregistré, l'aperçu se recharge tout seul.

## Écrire un épisode

Un épisode est un fichier dans `episodes/`. Il se compose de quatre parties :
- la **distribution** (`cast`) : qui est sur scène et où ;
- la **timeline** (`track`) : qui fait quoi, et quand ;
- la **musique** (`music`) ;
- l'**ambiance** (`ambience`).

```js
export default {
  title: 'La flaque',
  duration: 35,                     // secondes
  decor: 'jardin',                  // décor de la bibliothèque (engine/library.js)
  env: { time: 'day' },             // day, sunset, night (ou un nombre de 0 à 2)
  camera: { x: 540, y: 1000, zoom: 1 },
  cast: {
    minuton: { type: 'minuton', x: 300, y: 1450, expr: 'joy' },
    nuage: { type: 'cloud', x: 600, y: 560, face: 1, mood: 0.5 },
  },
  music: [{ t0: 0, t1: 10, style: 'uke', bpm: 112, key: 65 }],
  ambience: [{ t0: 0, t1: 35, type: 'garden' }],
  track: [
    { t: 0, a: 'minuton', do: 'walk', to: 600 },
    { t: 2, a: 'minuton', do: 'expr', name: 'surprise' },
    { t: 2, do: 'camera', x: 600, y: 1200, zoom: 1.6, dur: 0.5 },
  ],
}
```

Chaque action part de l'état laissé par la précédente : on peut enchaîner sans tout repréciser. Les transitions sont douces automatiquement.

### Actions de Minuton

| Action | Paramètres | Effet |
| --- | --- | --- |
| `walk` | `to`, `y`, `speed` ou `dur`, `style` (`walk`, `run`, `tiptoe`, `sneak`, `skip`) | Marche ou court ; il se tourne tout seul dans le bon sens, balance les bras, et les pas sont bruités |
| `jump` | `to`, `height` (en rayons de cadran), `dur` | Saut avec anticipation, étirement, atterrissage écrasé |
| `hop` | `n`, `height`, `each` | Petits sauts sur place |
| `turn` | `to` de −1 (profil gauche) à 1 (profil droit) | Se tourner : face, trois-quarts, profil |
| `spin` | `turns`, `dur` | Tour sur lui-même (passe de dos) |
| `move` | `x`, `y`, `lift`, `rot`, `scale`, `alpha`, `dur`, `ease` | Déplacement libre (flotter, être emporté) |
| `sit`, `stand`, `lie` | `dur` | S'asseoir, se relever, s'allonger |
| `shiver` | `dur`, `amount` | Trembler |
| `squash` | `amount` (positif : s'écrase) | Rebond élastique ponctuel |
| `arms` | `pose` (`down`, `up`, `out`, `cheer`, `hips`, `think`, `shrug`, `hold`, `cover`, `reachUp`, `open`) ou angles `aL`, `bL`, `aR`, `bR` | Pose de bras |
| `wave`, `cheer`, `flap`, `point` | `side`, `n`, `dur`, `angle` | Saluer, bras en l'air de joie, battre des bras, montrer du doigt |
| `auto` | | Bras de nouveau automatiques (balancement de marche) |
| `expr` | `name` (`neutral`, `joy`, `laugh`, `happyClosed`, `surprise`, `curious`, `idea`, `focus`, `disappointed`, `worried`, `relief`, `sleep`, `mischief`, `sad`, `grumpy`, `determined`) | Expression, avec fondu. Les clignements sont automatiques |
| `look` | `x`, `y` de −1 à 1 | Direction du regard |
| `lookAt` | `target` (un personnage, ou `{ x, y }`) | Suivre du regard, même quand la cible bouge |
| `babble` | `dur` | Bouche qui bouge (babil, chanson) |

### Autres personnages et objets

Leurs propriétés s'animent avec `set` : `{ t, a: 'nuage', do: 'set', x: 600, rain: 1, dur: 0.8 }`.

| Type | Propriétés |
| --- | --- |
| `cloud` | `x`, `y`, `scale`, `face` (0 ou 1), `mood` (−1 triste … 1 joyeux), `mouthOpen`, `eyesClosed`, `dark` (orage), `rain` (pluie sous le nuage), `lookX` |
| `puddle` | `x`, `y`, `size` (0 … 1), `w`, `ripple` |
| `rainbow` | `x`, `y`, `r`, `width`, `reveal` (0 … 1) |
| `image` | `img` (nom dans la bibliothèque), `x`, `y`, `scale`, `rot`, `alpha`, `flip` |

Tous ont aussi `z` (ordre d'affichage), `alpha`, et `attach` : `{ attach: 'minuton', attachW: 1, ax, ay }` accroche l'objet sur la tête de Minuton, et `attachW` fait le trajet en douceur.

### Scène

| Action | Paramètres |
| --- | --- |
| `camera` | `x`, `y`, `zoom`, `rot`, `dur`, `ease` (`dur: 0` = coupe franche). Suivi d'un personnage : `follow: 'minuton', fw: 0 … 1`. Le décor se floute tout seul en gros plan |
| `shake` | `amp`, `dur`, `freq` |
| `env` | `time`, `rain`, `snow`, `wind`, `sun`, `clouds`, `stars`, `vignette`, `blur`, `dur` (le soleil, la lune et les étoiles bougent avec l'heure) |
| `fx` | `type` (`splash`, `dust`, `sparkle`, `hearts`, `confetti`, `drops`, `notes`, `zzz`, `stars`, `leaves`, `sweat`), `x`, `y`, `n`, `scale` |
| `transition` | `type` (`fadeIn`, `fadeOut`, `dip`, `iris`, `irisIn`, `irisOut`, `wipe`), `dur`, `color`, `x`, `y` |
| `decor` | `id` : changer de décor (à combiner avec une coupe ou une transition) |
| `sfx` | `name` (`tok`, `pop`, `boing`, `boingHigh`, `swoosh`, `giggle`, `giggleLow`, `bloop`, `ding`, `sparkle`, `harp`, `splash`, `tick`, `drop`), `gain`, `pan` |

Musique : `{ t0, t1, style, bpm, key, minor }`, avec les styles `uke` (ukulélé), `pizz` (poursuite espiègle), `party` (fête) et `lullaby` (berceuse). `key` est la note de base en MIDI, par exemple 65 pour fa.

## Bibliothèque

`engine/library.js` liste les décors (trois éclairages, ligne du sol, position du soleil et de la lune) et les images réutilisables (pot, tournesol, graine…). Pour ajouter un décor généré avec ChatGPT, il suffit d'ajouter une entrée. La liste de ce qui reste à générer est dans [`KIT_A_GENERER.md`](KIT_A_GENERER.md).

## La marionnette

`library/minuton/` contient les corps (`body.png` de face, `body_q3l.png`, `body_profL.png`, `body_back.png`, `body_q3r.png`, `body_profR.png`) et `rig.json` (mesures, couleurs, ellipse du cadran de chaque vue). Pour la refaire :

```bash
python3 tools/build_rig.py ../minuton/episodes/02_images/Minuton/M01.png library/minuton
python3 tools/build_views.py <dossier des corps B2…B6> library/minuton
```

## Fichiers

| Dossier | Contenu |
| --- | --- |
| `engine/` | Le moteur : timeline (`timeline.js`), actions (`actions.js`), marionnette (`draw-minuton.js`), objets (`draw-props.js`), effets (`fx.js`), rendu (`studio.js`), bibliothèque (`library.js`) |
| `audio/` | Synthèse des sons (`synth.mjs`) et partition automatique (`score.mjs`) |
| `editor/` | L'éditeur (`index.html`) et la page de rendu (`player.html`) |
| `episodes/` | Les épisodes |
| `library/` | La marionnette et les références de l'artset |
| `tools/` | Préparation de la marionnette, captures de test |
