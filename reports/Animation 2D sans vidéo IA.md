# Faire jouer Minuton avec des calques ChatGPT

Un agent qui code peut produire des Shorts de Minuton proches de la qualité d'une série télé en papier découpé, sans aucun modèle vidéo. Pour cela, il faut changer la matière de la marionnette plutôt que l'outil. Les bras, jambes et visage dessinés en code doivent laisser la place à des **calques bitmap tirés des images ChatGPT**, changés image par image comme le font Harmony et Moho. Il faut aussi inscrire dans le moteur, comme comportements par défaut, les règles de jeu que les studios appliquent à la main : décalages entre les parties, ressorts, maintiens vivants, clignements asymétriques, saccades et asymétrie. Le moteur maison JavaScript/Canvas 2D reste le bon socle. Aucun framework vidéo (Remotion, Revideo, HyperFrames) ne fournit de rig. Les outils de rigging haut de gamme (Live2D, Rive, Moho, Harmony) passent par une interface graphique. Spine est le seul à combiner un format texte documenté et un rendu sans écran, mais il impose une licence d'éditeur de **69 à 379 $** pour utiliser ses runtimes. La lenteur se règle en une demi-journée : la capture PNG de Playwright coûte **915 ms par image** contre 161 ms pour le dessin. Avec une capture JPEG et trois pages, les **679 s** mesurées pour 35 s de vidéo tombent à **environ 110 s**, sans toucher au dessin. Le cahier des charges de 669 images déjà envoyé à ChatGPT suit la méthode qu'OpenAI recommande (une image ancre, puis des retouches « ne change que X »). Il est donc **cohérent sur le principe**, mais six points sont à ajuster avant les gros lots. Le principal : ne pas compter sur un corps « identique au pixel près », car OpenAI écrit lui-même que le masque n'est qu'indicatif. Il faut aussi suspendre les quelque 80 images de cycles et de séquences image par image jusqu'au test de la vue de face, que le cahier prévoit déjà. Plusieurs points restent non vérifiés, à commencer par le comportement réel de l'application ChatGPT (transparence, taille, dérive).

## Le moteur tient, mais la marionnette vectorielle trahit Minuton

Le socle actuel est meilleur que ne le laissent penser ses défauts. Le studio sait déjà beaucoup de choses. Sa timeline est déterministe et chaque action part de l'état laissé par la précédente. Son hasard est reproductible (mulberry32 à graine), et il dispose de treize courbes d'accélération, dont `back`, `elastic` et `bounce`, ainsi que d'un ressort amorti en forme analytique. Ses actions ont déjà une anticipation et un écrasement à l'atterrissage : avant un saut, le corps s'écrase de 16 % pendant 0,16 s. Il fournit enfin une bande son synthétisée, un éditeur web et six vues du corps tirées de l'artset ([studio/engine/core.js](../studio/engine/core.js) ; [studio/engine/actions.js](../studio/engine/actions.js) ; [studio/README.md](../studio/README.md)). Les trois problèmes signalés ont donc trois causes distinctes, et aucune n'impose de changer d'outil.

**La ressemblance** se joue sur le visage. L'identité de Minuton tient dans de grands yeux violet très foncé avec reflets blancs, des joues pêche et une petite bouche prune ([cahier des charges](../studio/kit-chatgpt/CAHIER_DES_CHARGES_CHATGPT.md)). Un redessin vectoriel n'en donne qu'une approximation. L'ancien [KIT_A_GENERER.md](../studio/KIT_A_GENERER.md) affirmait que « les bras, jambes, pieds, mains, yeux, bouches et sourcils » seraient « dessinés par le moteur ». Le nouveau cahier inverse cette décision, et c'est la bonne. Les rigs professionnels sont faits des dessins du personnage lui-même, échangés au besoin. Le lip-sync automatique de Harmony attend des dessins nommés A à G plus X ([Harmony 24](https://docs.toonboom.com/help/harmony-24/premium/cut-out-animation/animate-lip-sync.html)). Certaines séries télé comptent **« plus d'une centaine » de dessins de mains** ([Toon Boom, rig Punk](https://www.toonboom.com/?p=11879)).

**La raideur** ne vient pas d'un manque de courbes d'accélération. Elle vient d'un manque de **désynchronisation** et de **variation dessinée**. La lecture du code le montre. Les clignements sont symétriques : 0,16 s en sinus, toutes les 2,5 à 4,5 s ([timeline.js](../studio/engine/timeline.js)). Aucun mécanisme de retard ou de traîne entre parties n'a été trouvé. Toutes les parties sont évaluées au même instant `t`, et les membres vectoriels gardent une longueur constante. Les praticiens nomment précisément ces défauts. Des membres de longueur constante « ajoutent au côté raide » ([forum Toon Boom](https://forums.toonboom.com/t/cutout-animation/2300)). Bouger une partie isolément est raide, car un geste du bras demande « un léger changement de toute la pose » ([communauté Adobe](https://community.adobe.com/t5/animate-discussions/animation-looks-stiff/td-p/14573269)). Les poses en miroir, les « jumeaux », sont sans vie ([Wikipédia, douze principes](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)).

**La lenteur** se mesure. Le journal du dernier rendu indique **679 s pour 1 050 images**, soit 1,55 image/s (`studio/build/render.log`). Un banc d'essai mené le 28 octobre 2026 dans le même conteneur (4 vCPU, sans GPU) attribue l'essentiel de ce temps à la capture d'écran : 915 ms par image, contre 161 ms pour le dessin lui-même ([notes de mesure](../research_notes/Animation%202D%20sans%20vid%C3%A9o%20IA/frameworks_rendu_performance.md)).

## Douze principes deviennent six briques de code

### Ce que font les studios et que la marionnette ne fait pas

Pour une marionnette, cinq principes de Thomas et Johnston pèsent plus que les autres :

- le timing et l'espacement : ralentis en entrée et en sortie, maintiens et maintiens vivants ;
- les arcs ;
- le chevauchement et la traîne, ces parties qui « mettent quelques images à rattraper » le corps ;
- l'écrasement-étirement à volume constant ;
- l'anticipation ([Wikipédia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation)).

Le cours officiel de Toon Boom sur le papier découpé exige de connaître ces principes avant de commencer ([Toon Boom](https://toonboom.com/?p=23920)). Les studios les obtiennent par trois moyens.

**Harmony Premium** propose six types de déformeurs ([Harmony 25](https://docs.toonboom.com/help/harmony-25/premium/getting-started/deformation.html)) :

- le Bone plie un dessin unique au coude ;
- le Curve déforme sur toute la longueur, pour les membres « rubber hose » ;
- l'Envelope fait tourner une tête « sans changer de dessin » ;
- le Free Form étire les dessins texturés ;
- le Game Bone et le Shape-Aware complètent la série.

Ses Master Controllers stockent des expositions de dessins derrière un seul curseur ([Toon Boom](https://www.toonboom.com/?p=11879)). **Moho** fait glisser un « os de visage » sous un masque pour simuler la rotation de la tête, et range les vues dans des Switch layers ([forum Lost Marble](https://www.lostmarble.com/forum/viewtopic.php?p=217899), extraits de recherche non relus en entier). **Spine** combine maillages pondérés, IK et contraintes physiques pour les cheveux et les vêtements ([Spine physique](https://esotericsoftware.com/spine-physics-constraints)).

Ces outils tiennent la diffusion télé. *Back to Back* (52 épisodes) a été fait dans Moho, dont son directeur artistique dit qu'il permet d'animer « très vite sans sacrifier la qualité » ([blog Moho](https://moho.lostmarble.com/blogs/news/moho-allows-us-to-create-animation-very-quickly-without-sacrificing-quality-andrey-tkachev-art-director-of-back-to-back)). *A Door to Othertown* (13 × 7 min) aussi ([CUB Animation](https://moho.lostmarble.com/blogs/news/moho-featured-artist-cub-animation)), tandis que *Kick Buttowski* a été fait dans Toon Boom ([forum Toon Boom](https://forums.toonboom.com/t/kick-buttowski/2732)). Les praticiens ajoutent qu'il faut mêler au papier découpé un peu d'animation image par image ([forum Synfig](https://forums.synfig.org/t/is-cutout-animation-too-stiff/4303)). Ils animent aussi les poses de contact d'abord, et séparent l'avancée du cycle de marche ([Cartooning in Toon Boom](https://animationcraft.blogspot.com/2008/02/animating-cut-out-characters-part-2.html)).

### Les algorithmes à écrire, tous fonctions pures du temps

Une contrainte du projet commande tout le reste. Dans [render.mjs](../studio/render.mjs), quatre pages se partagent les images (`const i = next++`), si bien qu'aucune page ne voit deux images consécutives. Tout état simulé pas à pas, comme un ressort intégré d'image en image, donnerait donc un résultat faux. Chaque valeur doit rester une **fonction pure de `t`**. Le ressort de `core.js` respecte déjà cette règle. HyperFrames impose la même discipline : pas de `Date.now()`, pas de `Math.random()` sans graine ([HeyGen](https://www.heygen.com/research/html-to-video)). Spine prévoit un mode « Deterministic » qui recalcule la physique depuis l'image 0 ([Spine physique](https://esotericsoftware.com/spine-physics-constraints)).

La première brique est une **hiérarchie d'os avec skinning linéaire**. Dans les runtimes Spine, chaque sommet pondéré vaut la somme, sur ses os, de `(vx·a + vy·b + worldX)·poids` ([spine-runtimes 4.2](https://github.com/EsotericSoftware/spine-runtimes/blob/4.2/spine-ts/spine-core/src/attachments/Attachment.ts)). Les poids sont normalisés et élagués ([Spine, poids](https://esotericsoftware.com/spine-weights)). Il faut ajouter des sommets internes dans les zones de pliure ([Godot](https://docs.godotengine.org/en/stable/tutorials/animation/2d_skeletons.html)). Canvas 2D n'a cependant aucune primitive de triangle texturé, et le contournement par découpe et `drawImage` sur chaque triangle est lent et laisse des coutures (inférence). Pour Minuton, c'est sans gravité, car son corps est un disque rigide. Une **transformation affine ancrée aux pieds**, avec `sy = s` et `sx = 1/s` pour conserver la surface, suffit à l'écrasement-étirement. Le visage doit s'écraser moins que le corps. Le maillage ne sert qu'aux membres. On peut les découper en bandes transformées chacune le long d'une courbe de Bézier, à la manière du Curve d'Harmony (inférence). On peut aussi recourir à l'ARAP d'Igarashi (SIGGRAPH 2005), qui déforme un maillage triangulé à partir de poignées, sans squelette, en temps réel ([Igarashi](https://www-ui.is.s.u-tokyo.ac.jp/~takeo/research/rigid/)).

La deuxième brique est l'**IK à deux os**, par la loi des cosinus, pour planter les pieds et poser les mains sur les objets. Spine se limite à un ou deux os. Sans « softness », les os « bougent très vite juste avant » la portée maximale, et un mélange FK/IK partiel peut faire basculer la rotation ([Spine IK](https://esotericsoftware.com/spine-ik-constraints)). La formule exponentielle d'adoucissement proposée dans les notes n'est pas celle de Spine.

La troisième brique, ce sont les **ressorts**. Daniel Holden donne une forme exacte du ressort critique, indépendante de la cadence, et montre que l'intégration d'Euler devient instable avec un grand pas ou une forte raideur ([theorangeduck](https://theorangeduck.com/page/spring-roll-call)). Les paramètres de physique de Spine (inertie, force, amortissement, masse, vent, gravité) forment une bonne interface publique à copier ([Spine physique](https://esotericsoftware.com/spine-physics-constraints)).

La quatrième brique est le **chevauchement sans physique**, la moins chère et la plus rentable. Une partie enfant joue la courbe de son parent avec quelques images de retard :

```js
// traîne : l'enfant rejoue la pose du parent avec k images de retard (fonction pure de t)
const childPose = (t) => keyedPose(t - k / fps)   // k = 1–3 pour la main, 2–4 pour le visage
// ressort critique exact (Holden), utilisable en forme close entre deux événements
x = e * (j0 + j1 * dt) + goal   // e = exp(-y·dt), j0 = x0 - goal, j1 = v0 + j0·y
```

La cinquième brique est l'**espacement**. Il ne faut jamais interpoler linéairement, car un passage « droit de A à B » paraît « raide et mécanique » ([tutoriel Zedrin](https://www.theponyarchive.com/archive/youtube/UCKbbOCogtCId3zHCiUIm5Bg/TUTORIAL_7_Tips_for_Smoother_Animation-Zedrin-20171202-youtube-1920x1080-yVcZXW80GKA.en.vtt)). Chaque canal doit avoir son propre timing : la rotation mène, la translation suit, le visage arrive en dernier. Le **maintien vivant** dérive de 2 à 5 % pendant le maintien au lieu de figer la pose ([Wikipédia](https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation) ; valeurs : inférence). Les **smears** sont des images étirées le long de la trajectoire, ou des multiples, sur une ou deux images ([Wikipédia, smear](https://en.wikipedia.org/wiki/Smear_frame)). Ils sont à éviter dans le jeu subtil ([Prolific](https://prolificstudio.co/blog/smear-frames/)).

La sixième brique est l'**échantillonnage « en deux images »** du personnage, `frame − frame % 2`, soit 15 poses par seconde à 30 i/s, avec la caméra qui reste à chaque image. Cette pratique vient de connaissances générales (Richard Williams) que les notes n'ont pas revérifiées.

Les pièges qui font « bon marché » sont tous documentés :

- des motifs qui traversent un coude ou un genou et se brisent quand l'articulation plie ;
- des rigs surchargés, « lourds pour l'ordinateur » ([Toon Boom](https://www.toonboom.com/?p=11879)) ;
- des maillages qui se déforment d'autant plus qu'on s'éloigne de la pose dessinée ([Spine, poids](https://esotericsoftware.com/spine-weights)) ;
- une bouche par défaut qui n'est pas fermée ([Toon Boom](https://www.toonboom.com/?p=11879)).

### Bouches, yeux et nombre de dessins

Rhubarb Lip Sync, outil libre en ligne de commande, produit un minimum de six formes (A à F, nées chez Hanna-Barbera) et des formes optionnelles G, H et X. Son moteur « Phonetic », indépendant de la langue mais moins précis, convient au français ([Rhubarb](https://github.com/DanielSWolf/rhubarb-lip-sync)). Le cahier couvre déjà presque tout le jeu de Rhubarb :

| Forme Rhubarb | Bouche du cahier |
|---|---|
| A (lèvres fermées : m, b, p) | `vise_M` |
| B (dents serrées) | `vise_I` ou `dents` |
| C (ouverte) | `vise_E` |
| D (grande ouverture) | `vise_A` |
| E (arrondie) | `vise_O` |
| F (lèvres en avant) | `vise_U` |
| G (f, v) | `vise_F` |
| X (repos) | `sourire` |
| H (langue visible, L) | absente : seule forme manquante |

Les règles de calage sont les suivantes : caler les formes sur les images paires, exposer chaque forme au moins deux images, garder les fermetures même brèves, et anticiper d'une ou deux images. Cette dernière pratique est courante mais n'a pas été vérifiée. Minuton étant « quasi muet » par défaut, ce lip-sync servira surtout aux voix off courtes et au babil calé sur la partition.

Pour les yeux, une source secondaire donne un clignement toutes les **2 à 6 s**, une fermeture d'environ 80 ms, 50 à 100 ms fermé et une ouverture d'environ 150 ms ([Abratabia](https://abratabia.com/ai-talking-characters/facial-animation.php)). À 30 i/s, cela donne 2 à 3 images de fermeture, 2 images fermées et 4 à 5 images d'ouverture : un geste asymétrique d'environ 0,3 s, là où le moteur joue aujourd'hui 0,16 s symétriques. La durée d'une saccade croît avec son amplitude : 20 à 30 ms plus 2 à 2,7 ms par degré ([Lee, Badler et Badler](https://www.cis.upenn.edu/~badler/papers/EyesAlive.pdf)). Les pupilles doivent donc **sauter** en une ou deux images, puis rester fixes, et non glisser. Cela suppose des pupilles sur un calque séparé, ce que le cahier actuel ne permet pas.

Côté volumes, le rig Punk de Toon Boom repose sur **cinq poses de rotation**, et un rig de personnage demande « quelques jours à quelques semaines » ([Toon Boom](https://www.toonboom.com/?p=11879)). Des rigs amateurs annoncent 16 bouches et 34 mains ([Gumroad](https://pedrocabral.gumroad.com/l/sonic-free-rig)). Avec 23 bouches et 22 poses de bras par côté et par vue, le cahier dépasse ces rigs amateurs et rejoint l'ordre de grandeur de la production télé. Le volume n'est pas le problème. La cohérence des dessins entre eux l'est.

## Spine domine les outils pilotables, mais aucun ne remplace le moteur

Un agent sans interface graphique a deux exigences : écrire le contenu sous forme de texte ou de code, et le rendre sans écran sous Linux, sans GPU. Le tableau ci-dessous confronte les outils à ces deux critères.

| Outil | L'agent peut-il écrire le contenu ? | Rendu sans écran (Linux) | Plafond (maillage, IK) | Licence et coût | Verdict pour Minuton |
|---|---|---|---|---|---|
| Spine | Oui, JSON documenté ([format](https://esotericsoftware.com/spine-json-format)) | `spine-canvaskit` dans Node ([blog](https://esotericsoftware.com/blog/spine-canvaskit-runtime-released)) ; l'export vidéo de l'éditeur exige OpenGL et ne sort que de l'AVI ou du MOV ([CLI](https://esotericsoftware.com/spine-command-line-interface), [export](https://esotericsoftware.com/spine-export)) | Très haut en version Pro : maillages, poids, IK, physique | Essential 69 $, Pro 379 $ (paiement unique), Enterprise dès 500 k$ de CA ([achat](https://esotericsoftware.com/spine-purchase)) ; chaque utilisateur des runtimes doit avoir une licence ([licence](https://esotericsoftware.com/spine-runtimes-license)) | Meilleur plafond ; option de repli si le maillage devient indispensable |
| Blender (bpy) | Oui, Python | `blender -b`, EGL sans écran ([commit](https://developer.blender.org/rB3195a38)) | Moyen à haut : plans d'images et armature, Grease Pencil v3 | GPL, « ce que vous créez vous appartient » ([licence](https://www.blender.org/about/license/)) | Meilleur gratuit, mais réécriture complète |
| Synfig | Oui, XML `.sif` | CLI `synfig` ([wiki](https://wiki.synfig.org/Synfig_CLI_syntax)) | Moyen : Skeleton Deformation ([doc](https://synfig.readthedocs.io/en/latest/layers/skeleton_deformation.html)) | GPL ; dernière stable 1.4.5 de mai 2024 ([versions](https://www.synfig.org/category/releases/stable-releases/)) | Possible, mais documentation datée |
| Lottie | Oui, JSON (python-lottie, sous AGPL) | puppeteer-lottie, ThorVG, Skottie via @napi-rs/canvas ([PR](https://github.com/Brooooooklyn/canvas/pull/1177)) | Bas : pas de maillage sur un bitmap, Puppet Pin non exporté ([Adobe](https://community.adobe.com/t5/after-effects-discussions/can-t-export-animaton/m-p/12855125)) | Moteurs de rendu libres | Pantin rigide seulement |
| Live2D | Non : le `.moc3` ne sort que de l'éditeur ([manuel](https://docs.live2d.com/en/cubism-editor-manual/file-type-and-extension/)) | Harnais WebGL à construire | Très haut | Gratuit sous 10 M¥ de CA, plus une licence de publication ([SDK](https://www.live2d.com/en/sdk/license/)) | Inadapté |
| Rive | Non : `.riv` binaire, scripts Luau internes au fichier ([format](https://rive.app/docs/runtimes/advanced-topic/format), [scripts](https://rive.app/docs/scripting)) | Aucune recette sans écran documentée | Haut | De 0 à 120 $ par poste et par mois, runtimes MIT ([tarifs](https://rive.app/pricing)) | Inadapté |
| Moho | Partiellement (Lua dans l'application) | CLI limitée, Windows et macOS seulement ([Wikipédia](https://en.wikipedia.org/wiki/Moho_(software))) | Haut (Smart Bones) | 59,99 $ ou 399,99 $ ([boutique](https://moho.lostmarble.com/update)) | Inadapté (pas de Linux) |
| Toon Boom Harmony | Partiellement (`-batch -compile`) ([doc](https://docs.toonboom.com/help/harmony-24/premium/scripting/about-scripting.html)) | Mode batch | Très haut (Premium) | 30 à 139 $ par mois ([boutique](https://shop.toonboom.com/en/products/harmony)) | Inadapté (coût, rig en interface graphique) |
| OpenToonz | Partiellement (Toonz Script) | `tcomposer` ; fonctionnement sans écran non confirmé | Moyen (Plastic) | Libre ; version 1.8.0 de juin 2026 ([Forest Watch](https://forest.watch.impress.co.jp/docs/news/2118799.html)) | Faible |
| DragonBones | JSON, mais outillage à l'abandon | Runtimes seulement | Moyen | Runtimes MIT ; éditeur à l'abandon ([AlternativeTo](https://alternativeto.net/software/dragonbones/about)) | À éviter |

**Spine** est le seul outil qui allie un haut plafond et un format texte. Mais la licence suit l'utilisateur : quiconque se sert des runtimes officiels a besoin d'une licence d'éditeur. Les exports restent la propriété de l'utilisateur, et chacun peut écrire son propre code de lecture des données Spine s'il n'emprunte rien aux runtimes ([forum Esoteric](https://esotericsoftware.com/forum/d/17246)). Les maillages et l'IK seraient réservés à la version Professional. Cette information vient de forums et de revendeurs, pas du tableau officiel ([achat](https://esotericsoftware.com/spine-purchase)). Le moteur maison peut donc reprendre librement les mêmes formules, publiques, sans dépendre de Spine.

Les **frameworks de vidéo en code** apportent de l'outillage, pas des personnages :

- **Remotion** est le plus mûr (4.0.539, publié le 26 octobre 2026). Il est gratuit pour un particulier, une entreprise de trois salariés au plus ou une association ([LICENSE](https://raw.githubusercontent.com/remotion-dev/remotion/main/LICENSE.md)). Au-delà, il coûte 25 $ par mois et par poste, ou 0,01 $ par rendu avec un minimum de 100 $ par mois ([remotion.pro](https://www.remotion.pro/license)). Avec la version 5.0, les prestataires compteront dans l'effectif ([migration 5.0](https://remotion.dev/docs/5-0-migration)). Son rendu repose lui aussi sur des captures d'onglets Chromium, en JPEG par défaut ([renderMedia](https://www.remotion.dev/docs/renderer/render-media)). Sa documentation prévient que les effets dépendants du GPU, Canvas 2D compris, deviennent lents sur des machines cloud sans GPU ([performance](https://www.remotion.dev/docs/performance)).
- **Motion Canvas** (MIT) n'a rien publié depuis décembre 2024 et se rend depuis son éditeur ([doc](https://motioncanvas.io/docs/rendering)).
- **Revideo** (MIT, 0.11.0) en est la version bibliothèque, avec rendu sans écran et télémétrie PostHog à désactiver ([GitHub](https://github.com/redotvideo/revideo)).
- **HyperFrames** (Apache-2.0, HeyGen) transforme du HTML et des animations GSAP en MP4. Il passe par `HeadlessExperimental.beginFrame` et découpe les vidéos longues entre plusieurs processus Chrome ([HeyGen](https://www.heygen.com/research/html-to-video)). Le projet reste très jeune (0.x).
- **GSAP** est entièrement gratuit pour un usage commercial depuis le 30 avril 2025 ([Webflow](https://webflow.com/blog/gsap-becomes-free)).
- **Theatre.js** est à l'arrêt depuis mai 2024 ([Snyk](https://snyk.io/advisor/npm-package/theatre)).

**PixiJS** et **Three.js** sont maintenus, mais ils visent le GPU. Chromium retire d'ailleurs le repli automatique de WebGL vers SwiftShader : depuis M139, il faut l'activer avec `--enable-unsafe-swiftshader` ([blink-dev](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM)). Dans ce conteneur, forcer SwiftShader a fait passer le dessin de 135 à **895 ms** par image ([mesure locale](../research_notes/Animation%202D%20sans%20vid%C3%A9o%20IA/frameworks_rendu_performance.md)). Migrer vers l'un de ces outils ferait gagner une interface de prévisualisation, pas des personnages. Il vaut mieux leur emprunter des idées : la capture via beginFrame, le rendu par tronçons concaténés, les conventions de ressort.

## Des images ChatGPT à la marionnette : recaler, soustraire, combler

### Demander des retouches d'une ancre, jamais des dessins libres

La documentation d'OpenAI décrit presque mot pour mot la méthode du cahier :

- partir d'une référence de personnage réutilisable ;
- dire ce qui change et ce qui reste, « ne change que X », une seule modification par passe ;
- répéter à chaque itération la liste de ce qu'il faut préserver ([guide de prompts](https://developers.openai.com/api/docs/guides/image-prompting) ; [cookbook](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)).

La même documentation pose aussi trois limites qui commandent l'extraction. D'abord, le masquage est « entièrement fondé sur le prompt » : le modèle se sert du masque comme guide, mais « peut ne pas en suivre exactement la forme » ([guide image](https://developers.openai.com/api/docs/guides/image-generation)). Ensuite, des retouches répétées peuvent modifier des détails qu'on voulait garder. OpenAI conseille donc, si une zone doit rester identique au pixel près, de recoller la retouche approuvée sur l'original ([guide de prompts](https://developers.openai.com/api/docs/guides/image-prompting)). Enfin, OpenAI reconnaît des difficultés à garder un personnage récurrent cohérent d'une génération à l'autre et à placer précisément des éléments ([guide image](https://developers.openai.com/api/docs/guides/image-generation)). La transparence doit être demandée explicitement (`background="transparent"`, en PNG ou WebP), car un damier dessiné n'est pas de la transparence. Il faut vérifier le canal alpha décodé et redemander la transparence à chaque retouche ([guide de prompts](https://developers.openai.com/api/docs/guides/image-prompting)).

Côté API, la page consultée le 28 octobre 2026 met en avant `gpt-image-2.5-sunburst` et `gpt-image-2.5-flare`. Elle indique que `gpt-image-1` a été arrêté le 23 octobre 2026. Elle facture `gpt-image-2` en 1024² à 0,006 $ en qualité basse, 0,053 $ en moyenne et 0,211 $ en haute. Elle accepte des tailles libres jusqu'à 3 840 px de côté ([guide image](https://developers.openai.com/api/docs/guides/image-generation)). Ces informations viennent d'un résumé automatique de la page et sont à revérifier. À ces tarifs, les 669 images coûteraient **environ 35 $ en qualité moyenne et 141 $ en haute** (calcul). Ce chiffre ouvre une possibilité : l'agent pourrait piloter lui-même la génération et la boucle d'acceptation ou de rejet, au lieu de passer par l'application. Une recette communautaire, anecdotique, conseille enfin de générer les cycles par bandes de 4 à 8 images, et de ne jamais redimensionner une image d'un cycle séparément des autres ([animated-sprite-gen](https://claudskills.com/skills/animated-sprite-gen/SKILL.md)).

### Découper : la soustraction bat les décomposeurs pour une mascotte ronde

Deux familles d'outils existent :

- **Les décomposeurs complets** inventent les zones cachées. Qwen-Image-Layered (Apache-2.0, 20 milliards de paramètres, 640 px recommandé) découpe une image en calques RGBA ([Hugging Face](https://huggingface.co/Qwen/Qwen-Image-Layered)). Des articles concurrents de 2026 lui reprochent des artefacts de fond et des avant-plans incomplets ([RevealLayer](https://arxiv.org/pdf/2605.11818)). See-through découpe jusqu'à 23 parties d'un personnage d'anime. Il demande 12 à 16 Go de mémoire vidéo et environ 74 s par image sur une RTX 4090, avec des poids sous OpenRAIL++. Il n'est entraîné que sur des humains de style Live2D ([arXiv](https://arxiv.org/html/2602.03749v1) ; [GitHub](https://github.com/shitagaki-lab/see-through)). Les deux exigent un GPU, et aucun n'a été évalué sur une mascotte ronde non humaine.
- **Les segmenteurs** produisent des masques sans rien inventer. SAM 2 est sous Apache-2.0 ([licence](https://raw.githubusercontent.com/facebookresearch/sam2/main/LICENSE)). SAM 3 est guidé par du texte, avec une licence maison et des poids soumis à autorisation ([GitHub](https://github.com/facebookresearch/sam3)). BiRefNet est sous MIT ([licence](https://raw.githubusercontent.com/ZhengPeng7/BiRefNet/main/LICENSE)). rembg propose un modèle `isnet-anime`. Son modèle par défaut `bria-rmbg` est **non commercial** sans accord payant ([rembg](https://github.com/danielgatis/rembg)).

Pour Minuton, la **soustraction d'une base connue**, choisie par le cahier, est plus précise que ces deux familles : le fond de chaque calque, le cadran, est connu d'avance. Elle doit seulement être robuste aux écarts qu'OpenAI annonce. Le pipeline recommandé (inférence, non prototypé) commence par contrôler le canal alpha. Il recale ensuite l'image sur sa base par `findTransformECC` en modèle affine, calculé sur l'alpha ([LearnOpenCV](https://learnopencv.com/image-alignment-ecc-in-opencv-c-python/)), ou par corrélation de phase sous-pixel ([scikit-image](https://scikit-image.org/docs/stable/api/skimage.registration.html)). Puis il calcule l'écart de couleur avec la base, limité à une **zone d'intérêt propre à chaque famille** : l'ellipse du cadran pour les yeux, les bouches et les joues, un demi-plan latéral pour les bras, le dessous du disque pour les jambes. Il nettoie ensuite le résultat (hystérésis, composantes connexes, bouchage des trous) et adoucit l'alpha. Il remplit les pixels transparents par extension des couleurs (le « RGB padding » de [LayerDiffuse](https://github.com/lllyasviel/LayerDiffuse_DiffusersCLI)) pour éviter les liserés lors des rotations. Enfin, il produit une planche contact et un rejet automatique quand l'image diffère trop de la base hors de la zone. Deux cas demandent une attention particulière. Un bras jaune posé devant un corps jaune (`coeur`, `menton`, `tenir`) ne se distingue presque que par son contour : il faut boucher l'intérieur du contour fermé. Les sourcils, dessinés en même temps que les yeux, forment des composantes séparées et peuvent être isolés automatiquement. Une dérive de palette se corrige par `match_histograms` ([scikit-image](https://scikit-image.org/docs/stable/api/skimage.exposure.html)) et une dérive de trait par vectorisation VTracer ([VTracer](https://github.com/visioncortex/vtracer)).

```text
sortie ChatGPT ─► alpha ok ? ─► recalage ECC sur la base ─► ΔE(sortie, base) dans la zone de la famille
   ─► seuil + composantes + bouchage ─► alpha adouci + RGB padding ─► découpe + décalage + pivot
   ─► contrôle : écart hors zone < seuil ? accepté : à regénérer ─► layers.json + planche contact
```

### Combler, articuler et aligner

Les zones cachées posent un problème précis : un bras dessiné sur le corps n'a pas de racine sous le disque. Dès qu'il tourne autour de l'épaule, un trou apparaît. Les studios règlent ce cas avec des **raccords d'articulation** ([forum Toon Boom](https://forums.toonboom.com/t/cutout-animation/2300)). Ici, une petite ellipse jaune cernée de prune, dessinée en code sous le corps à chaque épaule, suffit (inférence). L'ordre d'affichage peut se déduire du calque : un bras qui recouvre largement le cadran passe devant le corps. Les corps vierges du cahier règlent l'autre problème, celui des zones cachées sous le visage, en les faisant dessiner d'emblée dans le même style. C'est la meilleure option selon les notes. Pour les trous plus grands, LaMa (Apache-2.0) est disponible en ligne de commande via IOPaint, archivé le 13 août 2025, avec une variante `anime-lama` ([IOPaint](https://github.com/Sanster/IOPaint)). OpenCV Telea ou NS suffit pour les fines bandes ([LearnOpenCV](https://learnopencv.com/image-inpainting-with-opencv-c-python/)).

L'**auto-rigging** n'apporte presque rien ici :

- Animated Drawings (MIT) est archivé depuis le 3 septembre 2025, figé sur Python 3.8 et pensé pour des silhouettes humaines ([GitHub](https://github.com/facebookresearch/AnimatedDrawings)).
- `puppet-warp`, une implémentation Python de l'ARAP, est sous GPL-3.0 ([libraries.io](https://libraries.io/pypi/puppet-warp)).
- Live2D et Character Animator n'existent que sous Windows et macOS ([Live2D](https://www.live2d.com/en/?p=9210) ; [Adobe](https://helpx.adobe.com/ae_en/adobe-character-animator/system-requirements.html)).

Le rig de Minuton est simple à écrire à la main dans `rig.json`, avec des pivots calculés automatiquement : le point où un membre touche le contour du disque. Le fichier contient déjà **l'ellipse du cadran de chaque vue**. Une affinité qui envoie l'ellipse de face sur l'ellipse cible permet donc de reposer les calques de visage sur un corps écrasé ou sur une pose spéciale du lot 7 au cadran vide. La même idée permet les petites rotations de tête en pseudo-3D sans changer de vue : le visage glisse dans le cadran et se resserre près du bord, comme avec l'Envelope d'Harmony ou l'os de visage de Moho.

Les décors demandent aussi un recalage. Le moteur fond les plaques jour, coucher et nuit l'une dans l'autre ([studio.js](../studio/engine/studio.js)). Si les versions « exactement la même image » de ChatGPT ont glissé de quelques pixels, le fondu dédouble l'image. Il faut donc recaler par ECC les versions coucher et nuit, ainsi que le premier plan, sur la version jour.

### Image par image : l'interpolation par flux ne sert qu'aux petits écarts

Les interpolateurs utilisables sans GPU dédié ni modèle vidéo sont les suivants :

- **RIFE** (MIT) : versions 4.25 et 4.26 ([Practical-RIFE](https://github.com/hzwer/Practical-RIFE)), et un binaire `rife-ncnn-vulkan` qui tourne sur processeur avec `-g -1` et inclut un modèle `rife-anime` ([rife-ncnn-vulkan](https://github.com/nihui/rife-ncnn-vulkan)) ;
- **FILM** (Apache-2.0), archivé en octobre 2025 ([GitHub](https://github.com/google-research/frame-interpolation)) ;
- **AnimeInterp** (MIT), qui exige un PyTorch ancien ([GitHub](https://github.com/lisiyao21/AnimeInterp)) ;
- **EISAI**, sous **AGPL-3.0** ([GitHub](https://github.com/ShuhongChen/eisai-anime-interpolator)).

Ces méthodes supposent un mouvement linéaire et l'absence de désocclusion. Sur le sous-ensemble anime de VFIBench, RIFE obtient un FID de 62,35, contre 40,63 pour ToonCrafter ([VFIBench](https://arxiv.org/html/2501.03699)). Les meilleurs scores appartiennent toutefois à des méthodes exclues ici. **ToonCrafter est un modèle de génération vidéo** : il est construit sur l'interpolateur image-vers-vidéo DynamiCrafter ([arXiv](https://arxiv.org/html/2405.17933)). **MoG** repose lui aussi sur un a priori vidéo génératif. RIFE est un réseau entraîné sur des vidéos, mais il n'est pas génératif. Une lecture stricte de la règle « aucun modèle vidéo » invite cependant à s'en passer, et le rig interpole déjà sans fantômes.

L'usage raisonnable est le suivant : une seule image intermédiaire, et seulement pour de petits écarts (balancement, clignement). L'alpha s'interpole à part, puisque RIFE travaille en RGB. Le reste des séquences se joue en deux images avec des maintiens. Pour les grands changements de pose, mieux vaut ajouter une image clé intermédiaire générée, utiliser un smear ou faire porter le mouvement par le rig. Le `minterpolate` de FFmpeg existe en solution sans dépendance ([FFmpeg](https://ffmpeg.org/ffmpeg-filters.html#minterpolate)). Sur des aplats, son mode `dup` est probablement plus sûr que sa compensation de mouvement (inférence non mesurée).

## De 679 à environ 110 secondes : la capture freinait le rendu

Le banc d'essai local a été mené le 28 octobre 2026, sur l'épisode `03_la_flaque`, dans un conteneur à 4 vCPU sans GPU (Playwright 1.56.1, ffmpeg 6.1.1) ([notes de mesure](../research_notes/Animation%202D%20sans%20vid%C3%A9o%20IA/frameworks_rendu_performance.md)). Il isole d'abord le coût de chaque méthode de capture :

| Méthode (une page) | ms par image | Taille moyenne |
|---|---|---|
| `seek` seul (dessin) | 160,9 | — |
| `page.screenshot` PNG (pipeline actuel) | **914,8** | 1 692 Kio |
| CDP `captureScreenshot` JPEG q90 `optimizeForSpeed` | 208,8 | 261 Kio |
| CDP PNG `optimizeForSpeed` (sans perte) | 286,8 | 2 219 Kio |
| `canvas.toDataURL('image/jpeg', 0.92)` dans le même `evaluate` | **179,4** | 288 Kio |

Il mesure ensuite la chaîne complète, sur 300 images envoyées à ffmpeg et encodées en x264 CRF 17 :

| Configuration | Images/s | Temps projeté pour 35 s |
|---|---|---|
| PNG Playwright (journal actuel) | 1,55 | 679 s |
| CDP PNG, 4 pages, preset medium | 6,4 | ≈ 164 s |
| CDP JPEG q92, 3 pages, preset medium | 9,8 | ≈ 107 s |
| CDP JPEG q92, 4 pages, preset slow | 8,9 | ≈ 118 s |
| CDP JPEG q92, 4 pages, preset veryfast | 13,1 | ≈ 80 s |

Le gain rapide se fait sur une vingtaine de lignes de [render.mjs](../studio/render.mjs) : remplacer `page.screenshot({type:'png'})` par `toDataURL('image/jpeg', 0.95)` renvoyé par l'`evaluate` du `seek`, ou par une session CDP en JPEG, et déclarer `-c:v mjpeg` à ffmpeg. Si des bandes ou des halos apparaissent sur les contours, le PNG rapide de CDP reste la solution sans perte. Trois pages valent quatre sur 4 vCPU, car x264 et le compositeur ont aussi besoin de processeur. Le preset `slow` ne coûte que 7 % de plus que `medium` dans la chaîne complète, ce qui justifie de le garder pour les versions finales.

Le goulet suivant est le dessin lui-même, à 135–160 ms par image. Le moteur applique à chaque image un `ctx.filter = blur(...)` sur toute la plaque de décor, plus un flou de 6 px sur les ombres ([studio.js](../studio/engine/studio.js)). Il suffirait de précalculer quelques niveaux de flou et de fondre entre deux, ou de mettre la plaque floutée en cache pour chaque plan (inférence, gain non mesuré). Remotion donne le même conseil pour les effets sans GPU ([Remotion](https://www.remotion.dev/docs/performance)).

Sortir du navigateur supprimerait la capture. Sur une scène synthétique plus légère que le vrai épisode, skia-canvas (MIT) atteint environ 11 images/s en un seul processus, en envoyant les pixels bruts à ffmpeg ([skia-canvas](https://github.com/samizdatco/skia-canvas)). Avec @napi-rs/canvas, en revanche, le flou n'a jamais terminé. Le portage du moteur n'est donc pas mesuré et coûterait la prévisualisation dans l'éditeur. Pour itérer plus vite, il vaut mieux rendre des tronçons en parallèle, les joindre par `concat` et mettre en cache les plans inchangés, sur le modèle de HyperFrames. `beginFrame` apporte surtout de la justesse, puisque chaque image est alors entièrement peinte ([CDP](https://chromium.googlesource.com/devtools/devtools-frontend.git/+/HEAD/node_modules/devtools-protocol/pdl/domains/HeadlessExperimental.pdl)).

Pour l'envoi à YouTube, Google recommande en SDR 1080p :

- du H.264 High, progressif, en CABAC, avec 2 images B consécutives ;
- un GOP fermé d'une demi-cadence, en 4:2:0 et BT.709 ;
- **8 Mb/s à 24–30 i/s** et 12 Mb/s à 48–60 i/s ;
- de l'AAC-LC à 48 kHz, **384 kb/s en stéréo** ;
- un MP4 avec l'atome `moov` en tête ([aide YouTube](https://support.google.com/youtube/answer/1722171?hl=en)).

Le HEVC est accepté, mais l'AV1 ne figure pas dans la liste des formats ([formats](https://support.google.com/youtube/troubleshooter/2888402?hl=en)). Depuis le 15 octobre 2024, une vidéo verticale de 3 minutes au plus compte comme un Short ([vidIQ](https://vidiq.com/blog/post/youtube-shorts-vertical-video)). Le pipeline actuel convertit déjà en BT.709 en plage limitée, normalise à −14 LUFS et active `+faststart`. Il ne sort cependant qu'**environ 3,4 Mb/s** et encode l'audio à 192 kb/s. La commande recommandée est donc la suivante :

```bash
ffmpeg -f image2pipe -c:v mjpeg -framerate 30 -i - -i audio.wav \
  -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset slow -crf 14 -tune animation -profile:v high -bf 2 -g 15 -keyint_min 15 -sc_threshold 0 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 384k -ar 48000 -movflags +faststart -shortest out.mp4
```

Il faut rester à 30 i/s. Le 60 i/s doublerait le temps de rendu pour un gain faible sur un dessin animé posé en deux images. Le flou de mouvement le moins cher est dessiné : smears ou traits de vitesse. Le `CameraMotionBlur` de Remotion moyenne 10 sous-images par défaut et multiplie d'autant le coût ([Remotion](https://www.remotion.dev/docs/motion-blur/camera-motion-blur)). Une accumulation par `tmix` coûterait environ quatre fois plus et n'a pas été mesurée.

## Une architecture bitmap et dix chantiers classés par rendement

L'architecture cible garde le moteur, la timeline, l'éditeur et la bande son. Elle remplace le dessin vectoriel de Minuton par un compositeur de calques et ajoute deux couches : une couche d'extraction en Python et une couche de jeu automatique en JavaScript.

```text
ChatGPT (ou API gpt-image) ──► kit/brut/<lot>/<code>.png
        │
tools/extract_layers.py  (OpenCV + scikit-image : alpha, recalage ECC, ΔE limité à une zone,
        │                 nettoyage, RGB padding, pivots, z, contrôle qualité et planche contact)
        ▼
library/minuton/layers/<vue>/<famille>/<code>.png  +  layers.json (décalages, pivots, ancres, z)
        │
engine/  timeline.js (existant) ─► intentions : expr, look, arms, walk, babble
         acting.js (nouveau)     ─► couches automatiques, fonctions pures de t et d'une graine :
                                    traîne 1–4 images, maintiens vivants, clignements 2–3/2/4–5 images,
                                    saccades en saut, respiration, asymétrie, anticipation et dépassement
         rig-bitmap.js (nouveau) ─► corps : affinité écrasement-étirement ancrée aux pieds
                                    visage : yeux, sourcils, bouche, joues posés sur l'ellipse du cadran,
                                             glissement pseudo-3D
                                    bras : échange de dessin, rotation au pivot, ressort, raccord d'épaule
                                    jambes et pieds : échange de dessin, pied planté, IK courte
         échantillonnage         ─► personnage en deux images en option, caméra à chaque image
         studio.js               ─► plaques floutées en cache
        │
render.mjs ─► JPEG via toDataURL ou CDP, 3 pages, tronçons + concat, cache par plan
           ─► x264 CRF 14, GOP 15, AAC 384k, BT.709
```

Ce découpage fait porter à la machine ce qu'un agent fait mal. Un modèle de langage choisit spontanément des durées rondes, des interpolations linéaires et des poses symétriques. Si le moteur applique d'office les traînes, les clignements et l'asymétrie, chaque épisode en bénéficie sans consigne supplémentaire.

Le tableau suivant classe les chantiers par rapport entre gain et effort. Les efforts sont des **estimations de l'auteur**.

| Rang | Chantier | Effort estimé | Gain attendu | Statut de la preuve |
|---|---|---|---|---|
| 1 | Capture JPEG, 3 pages, réglages x264 et AAC conformes à YouTube | 0,5 jour | Rendu environ 6 fois plus rapide, envoi conforme | Mesuré |
| 2 | `acting.js` sur la marionnette actuelle : traîne, maintiens vivants, clignements asymétriques, saccades, asymétrie | 1 à 2 jours | Nettement moins de raideur, sans attendre les images | Principes sourcés, réglages à valider à l'œil |
| 3 | `extract_layers.py` et sa planche de contrôle | 2 jours | Condition de tout le reste | Méthode inférée, non prototypée |
| 4 | Visage bitmap de face (lots 1 à 4, vue F) | 1 à 2 jours | Plus gros gain de ressemblance | Dépend de la cohérence des images ChatGPT |
| 5 | Bras bitmap de face : échanges, pivot, raccord d'épaule, ressort | 2 jours | Gestes fidèles au dessin | Idem |
| 6 | Jambes et pieds : pied planté, IK courte, échanges | 2 à 3 jours | Fin des pieds qui glissent | Idem |
| 7 | Flous en cache, tronçons parallèles, cache par plan | 1 jour | Itérations plus rapides | Non mesuré |
| 8 | Personnage en deux images et smears, comparés en A/B | 1 jour | Allure « faite main » | Pratique non revérifiée |
| 9 | Vues 3G, 3D et profils, glissement pseudo-3D | 2 à 3 jours | Demi-tours crédibles | Dépend des lots suivants |
| 10 | Lip-sync Rhubarb pour les voix off, babil calé sur la partition | 1 jour | Bouche synchronisée | Outil sourcé |

Trois options restent hors classement. Le portage vers skia-canvas ne se justifie que si le rendu reste un frein après les chantiers 1 et 7. Spine Pro (379 $) ne se justifie que si les membres doivent vraiment se plier. RIFE ne servirait qu'aux séquences du lot 7.

### Le cahier des charges : bon principe, six ajustements avant les gros lots

Le cahier est **cohérent avec la recommandation sur l'essentiel** :

- chaque calque est une retouche d'une base, ce qui correspond à la méthode d'OpenAI ;
- les corps vierges rendent les zones cachées natives ;
- chaque côté est demandé à part, sans miroir, ce qui préserve l'asymétrie du bouton ;
- la première image validée de chaque lot sert d'ancre de style ;
- l'ordre prévu, vue de face d'abord puis test animé, correspond exactement à l'étape de validation qu'il faut.

Inutile de le renvoyer en entier : un court additif suffit, avec six ajustements.

**Premier ajustement : lever l'ambiguïté de la base.** Le lot 1 crée `B1_propre`, mais la liste des fichiers à joindre cite toujours `B1_face_vierge.png`. L'extraction par différence exige de connaître la base réellement utilisée pour chaque image. Il faut donc imposer `B1_propre` à tous les calques de face une fois ce corps validé, et l'inscrire dans le fichier de livraison.

**Deuxième ajustement : ne pas dépendre du « pixel près ».** La règle peut rester dans les consignes, mais le studio doit la traiter comme une tolérance. L'extraction recale, limite le calcul à une zone et rejette les images au-delà d'un seuil, ce qui oblige à prévoir des régénérations.

**Troisième ajustement : vérifier la vraie transparence.** Un damier dessiné ou un fond opaque est à refuser. Pour un rattrapage, on peut détourer avec rembg `isnet-anime` ou BiRefNet, jamais avec `bria-rmbg`.

**Quatrième ajustement : ajouter quelques pièces de rig**, environ 20 à 30 images :

- par vue F, 3G et 3D, des yeux « blancs sans iris » et l'iris seul, pour des pupilles animées par le moteur, avec saccades et suivi du regard ; les 24 images `regard_*` deviennent alors facultatives ;
- par vue, chaque jambe seule et trois pieds (à plat, sur la pointe, sur le talon), car le lot 6 dessine toujours les deux jambes ensemble et empêche de les animer séparément ;
- un ou deux bras dessinés hors du corps, pour obtenir la racine cachée.

**Cinquième ajustement : geler les quelque 80 images de séquences** jusqu'au test de face. Elles comprennent la marche (32), la course (24), la marche vers la caméra (6), la chute (4), la roulade (6), la danse (6) et la marche de dos (4). Ce sont elles qui souffrent le plus de la dérive entre images. Si le test les garde, il faudra les générer par bandes de 4 à 8 images dans une même image, puis recaler chacune.

**Sixième ajustement : la résolution.** Le disque mesure environ 615 px de large sur la toile de 1024 px, soit un rayon d'environ 300 px. À l'écran, le moteur dessine un rayon de 180 px × échelle × zoom. Le 1024 suffit donc jusqu'à un produit échelle × zoom d'environ 1,7. Pour des gros plans plus serrés, des calques de visage de face en 2048 px seraient utiles, si l'application le permet (non vérifié).

Il faut enfin marquer `KIT_A_GENERER.md` comme remplacé, pour qu'aucun agent ne reparte de l'ancienne doctrine du « tout vectoriel ». Le test de face mérite des critères chiffrés :

- résidu après recalage inférieur à 1 ou 2 px ;
- taux de rejet acceptable ;
- validation à l'œil d'un clignement, d'une phrase babillée et d'un salut.

## Ce qui n'a pas été vérifié

Le point le plus important n'a pas été testé : le comportement réel de **l'application ChatGPT** sur ce cahier, c'est-à-dire la présence d'un vrai alpha, la taille de sortie, l'ampleur de la dérive du corps et les quotas de génération. Les documents d'OpenAI concernent l'API, et les noms de modèles 2.5 viennent d'un résumé automatique de page. L'extracteur par différence est une conception, pas un prototype. Son taux de rejet sur de vraies sorties est inconnu. Les gains des chantiers 2, 7 et 8 sont des inférences. Le portage vers skia-canvas n'a été mesuré que sur une scène synthétique, et le flou y a bloqué une des deux bibliothèques. Les efforts en jours sont des estimations.

Plusieurs faits sur les outils reposent sur des sources secondaires :

- le partage des fonctions entre Spine Essential et Professional, qui vient de forums et de revendeurs, et la licence exigée par sa CLI, restée sans réponse publique ;
- les tarifs de publication Live2D pour la vidéo et le prix de Cubism PRO ;
- la date du Cloud Renderer de Rive et celle de Remotion 5.0 ;
- la capacité d'OpenToonz et de Moho à rendre sans écran ;
- le chiffre de 78 × 7 min pour *Puffin Rock* (page non consultée) et les citations du forum Moho (extraits de recherche).

Côté technique d'animation, plusieurs valeurs sont fragiles. Les durées de clignement viennent d'un tutoriel. La pratique « personnage en deux images, caméra à chaque image » vient de connaissances générales. La formule d'IK adoucie et l'intégrateur de la physique de Spine ne sont pas ceux de Spine. Aucune évaluation indépendante de RIFE 4.25 ou 4.26 sur de grands mouvements de dessin animé n'a été trouvée, et les licences des poids `anime-lama` et SAM-HQ n'ont pas été vérifiées.

## Conclusion

Le problème n'est plus de choisir un logiciel, mais de garantir la **cohérence des dessins** et d'**encoder le jeu d'acteur**. Toute la chaîne recommandée est gratuite. Le seul achat qui puisse se justifier plus tard est Spine Pro, à 379 $, et l'essentiel du coût restant est le travail de génération. Ce travail lui-même peut s'automatiser : à 0,053 $ l'image via l'API, l'agent pourrait générer, recaler, contrôler et régénérer seul. La boucle « image ancre, retouche, contrôle » deviendrait alors un programme plutôt qu'une corvée manuelle.

Le vrai point de décision n'est pas l'envoi du cahier, déjà fait, mais **le test de la vue de face**. Les calques de face indiqueront si la dérive de ChatGPT tient sous un seuil mesurable. Si c'est le cas, les quelque 600 images suivantes, puis les séquences, ont un sens. Sinon, il faut reporter l'effort sur le rig (pupilles, jambes et pieds séparés, smears) et réduire le nombre de dessins. Dans les deux cas, les chantiers 1 et 2 peuvent commencer dès maintenant : ils ne dépendent d'aucune image.
