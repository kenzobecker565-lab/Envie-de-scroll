# Épisode 2 — Le tournesol

- **Format :** Short vertical 9:16, environ 48 s, sans paroles ni texte.
- **Public :** enfants (voir `../GUIDE.md`).
- **Thème :** une vraie petite histoire, sans lien avec l'app. Minuton est un chronomètre, et c'est son pouvoir qui fait l'histoire.
- **Émotion d'ouverture :** surprise (« tok ! » sur la tête).
- **Envie de Minuton :** voir pousser la graine tout de suite.
- **Obstacle :** une plante, ça prend du temps.
- **Chute :** il accélère le temps avec son propre bouton. Le tournesol devient géant et, comme Minuton est rond et jaune, il le prend pour le soleil et le suit partout.
- **Type de fin :** boucle. Au coucher du soleil, une graine tombe du tournesol vers la couronne de Minuton, comme au début.

## Histoire en une phrase

Une graine tombe sur la tête de Minuton. Il la plante, l'arrose, attend, attend encore… puis appuie sur son bouton de chronomètre pour accélérer le temps. Les jours défilent, et la pousse devient un tournesol géant qui le prend pour le soleil et tourne la tête pour le suivre partout. Le soir, Minuton s'endort sous sa fleur, et une nouvelle graine tombe.

---

## Comment on rend ça plus animé : des calques plutôt que des images complètes

Pour l'épisode 1, chaque image était une scène complète, donc le décor bougeait légèrement d'une image à l'autre. Pour avoir de vrais mouvements (marcher, courir, la fleur qui pousse, le soleil qui traverse le ciel), on sépare les éléments :

1. **Des décors vides** : le jardin sans Minuton et sans pot, en version jour, coucher et nuit.
2. **Minuton découpé** sur fond transparent, dans chaque pose, toujours à la même échelle.
3. **Le pot et la plante** découpés, à chaque étape de croissance.
4. **Quelques gros plans** en scène complète, pour les moments forts.

Au montage, je pose Minuton et la plante sur le décor et je les anime en code :
- déplacements, cycles de marche et de course ;
- rebonds et écrasements, clignements des yeux ;
- croissance de la plante, soleil, lune et étoiles qui traversent le ciel ;
- gouttes d'eau, pétales qui tombent, lucioles ;
- ombre au sol, teinte de nuit sur les personnages.

Le décor ne tremble plus et Minuton garde le même dessin d'un plan à l'autre.

**Astuce de génération :** tu peux générer plusieurs poses sur **une seule planche transparente**, par exemple les 4 étapes de la marche alignées. C'est même mieux pour la cohérence. Laisse un espace net entre les poses : je les découpe moi-même. Nomme chaque fichier avec son code (`M13`, `PL3`…).

---

## Liste des images à générer (≈ 45)

### Règles communes

- Joindre à chaque génération : `04_Minuton_base_transparent.png`, `05_Reference_scene_originale.png`, `03_Poses_actions_transparent.png`, et la première image validée de la même catégorie (le décor D1, le premier Minuton découpé ou le premier pot).
- Style : celui du guide. Illustration 2D chaleureuse, contours prune foncé, ombres douces.
- **Lumière de jour :** soleil en haut à droite, sur tous les éléments.
- **Images découpées :** vrai fond transparent, personnage ou objet entier, **sans ombre portée au sol** (je l'ajoute), aucun texte.

> **Base Minuton (à mettre en tête de chaque prompt de découpe) :**
> Illustration 2D de Minuton conforme aux références jointes : chronomètre jaune rond et compact, visage intégré au disque, grands yeux violets à reflets blancs, joues pêche, couronne orange striée, petit bouton latéral, contours prune foncé. Bras et jambes très courts. Même visage et proportions que la référence. Personnage entier sur vrai fond transparent, centré, même échelle que la référence de base, lumière douce venant d'en haut à droite, sans ombre portée au sol, aucun texte.

### Décors (format 9:16, sans personnage)

| Code | Prompt (après le style du guide) |
|---|---|
| **D1** | Coin de jardin en illustration 2D, format vertical 9:16, vue de face à hauteur d'enfant. Pelouse verte douce sur le tiers inférieur ; au centre du sol, un **emplacement vide** de terre tassée (là où on posera un pot). Barrière en bois clair au milieu, quelques fleurs basses et un buisson rond à gauche, une haie à droite. Grand ciel bleu clair sur la moitié haute avec deux petits nuages, **sans soleil ni lune visibles**. Lumière de jour venant d'en haut à droite. Aucun personnage, aucun pot, aucun texte. |
| **D2** | Exactement la même image que D1, même cadrage et mêmes éléments, mais au **coucher du soleil** : ciel orange, rose et violet, lumière dorée rasante venant de la droite, ombres plus longues. Sans soleil visible. |
| **D3** | Exactement la même image que D1, mais **la nuit** : ciel bleu nuit profond, quelques étoiles discrètes, lumière lunaire bleutée et douce, jardin lisible. Sans lune visible. |

### Minuton découpé (fond transparent)

| Code | Pose et expression | Utilisée dans |
|---|---|---|
| **M01** | Debout de face, bras le long du corps, expression neutre. | S1 |
| **M02** | Debout de face, yeux plissés fermés, petite grimace douce : il vient de recevoir quelque chose sur la couronne. Bras légèrement levés. | S1 |
| **M03** | Debout, trois-quarts droite, penché en avant, regarde le sol devant lui, expression de curiosité. | S1 |
| **M04** | Debout, trois-quarts droite, tient une petite graine de tournesol à deux mains devant lui, curiosité. | S3 |
| **M05** | Accroupi, profil droit, la main droite tend une graine vers le sol devant lui. | S3 |
| **M06** | Accroupi, profil droit, la main droite enfoncée dans la terre, concentration. | S3 |
| **M07** | Debout, profil droit, tient à deux mains un petit arrosoir violet incliné vers l'avant (vers la droite), joie. Arrosoir sans eau dessinée (je l'anime). | S4 |
| **M08** | Assis par terre, profil droit, bras posés sur les genoux, regarde devant lui, expression neutre. | S5 |
| **M09** | Assis, profil droit, très penché en avant, visage presque au ras du sol, yeux grands ouverts, concentration. | S5 |
| **M10** | Assis de face, menton posé dans les deux mains, regarde le spectateur, déception légère. | S5 |
| **M11** | Assis de face, mêmes position et taille que M10, **yeux fermés** (pour les clignements). | S5 |
| **M12** | Assis de face, les yeux levés vers son propre bouton latéral en haut à droite, expression d'idée. | S6 |
| **M13 à M16** | **Marche vers la droite** (profil droit) : contact, appui, passage, suspension. Expression joyeuse. Une seule planche de 4 poses alignées. | S3, S12, S13 |
| **M17 à M20** | **Marche vers la gauche** (profil gauche) : contact, appui, passage, suspension. Même planche. Le bouton reste du même côté du boîtier que sur la vue de profil gauche du modèle. | S11, S13 |
| **M21** | Assis de face, penché en arrière, regarde très haut, surprise. | S7 |
| **M22** | Debout de face, regarde très haut, inquiétude douce, mains jointes devant lui. | S10 |
| **M23** | Debout de face, regarde en haut à gauche, joie surprise, bras légèrement écartés. | S11 |
| **M24** | Debout de face, regarde en haut à droite, joie surprise (pendant de M23). | S12 |
| **M25** | Debout de face, rire, yeux plissés de joie, bras levés. | S13 |
| **M26** | Debout de face, rire, yeux plissés de joie, bras baissés (pour alterner avec M25). | S13 |
| **M27** | Debout, trois-quarts gauche, regarde vers la gauche au loin (vers le coucher de soleil), soulagement, sourire doux. | S14 |

### Pot et tournesol découpés (fond transparent)

Toutes ces images ont **le même pot, au même endroit et à la même taille** : pot en terre cuite orange, centré en bas de l'image. Format portrait 2:3 (1024 × 1536). Seule la plante change.

> **Base plante :** Illustration 2D dans le style des références jointes, contours prune foncé, couleurs chaleureuses. Petit pot rond en terre cuite orange rempli de terre brune, centré en bas de l'image, toujours à la même taille et au même endroit. Vrai fond transparent, sans ombre portée, aucun texte, aucun visage sur la plante.

| Code | La plante |
|---|---|
| **PL0** | Pot de terre vide. |
| **PL1** | Une minuscule pousse avec deux feuilles rondes. |
| **PL2** | Une tige courte avec quatre feuilles. |
| **PL3** | Une tige haute jusqu'au milieu de l'image avec un bouton vert fermé. |
| **PL4** | Une grande tige jusqu'en haut avec une fleur à moitié ouverte, pétales jaunes. |
| **PL5** | Tournesol géant épanoui, très haut (la fleur touche le haut de l'image), large cœur brun, pétales jaune d'or, de face. |
| **PL6** | Même tournesol géant que PL5, la tête **tournée vers la gauche**. |
| **PL7** | Même tournesol géant que PL5, la tête **tournée vers la droite**. |
| **PL8** | Même tournesol géant, la tige courbée, la tête **penchée vers le bas, en avant** (comme pour regarder quelqu'un au pied du pot). |

### Petits éléments découpés (fond transparent)

| Code | Élément |
|---|---|
| **E1** | Une graine de tournesol rayée noir et blanc, en gros, vue de côté. |
| **E2** | Un pétale de tournesol jaune isolé. |

### Gros plans en scène complète (format 9:16)

Joindre D1 comme référence du décor.

| Code | Prompt (après la base du guide) |
|---|---|
| **G1a** | Gros plan, décor de jardin D1 flou en arrière-plan, jour. Les deux mains jaunes arrondies de Minuton tiennent une graine de tournesol rayée au centre de l'image ; on voit le bas de son visage en haut du cadre, grands yeux violets fixés sur la graine, curiosité émerveillée. |
| **G1b** | Exactement la même image que G1a, mais Minuton a **les yeux fermés** (clignement). |
| **G2a** | Très gros plan sur le côté droit du boîtier de Minuton : son petit bouton latéral et sa petite main jaune arrondie qui s'en approche. Jardin flou derrière, jour. |
| **G2b** | Exactement la même image que G2a, mais le doigt **appuie** sur le bouton, enfoncé. |
| **G3** | Contre-plongée spectaculaire : un tournesol géant vu d'en bas, sa grande fleur en haut de l'image contre le ciel bleu ; tout en bas, Minuton minuscule à côté du pot, la tête levée, inquiétude douce. |
| **G4** | Plan large au coucher du soleil, décor D2 : Minuton endormi, assis contre le pot du tournesol géant, pose « dormir » de la planche. La tête du tournesol est penchée au-dessus de lui comme une lampe. Lumière dorée, ambiance très douce. |

---

## Découpage

Les codes renvoient à la liste ci-dessus. **Ce que je fais au montage** est indiqué pour chaque plan : c'est de l'animation en code, rien à générer en plus.

### S1 — Tok ! (0 – 2,5 s) · HOOK
- **Décor :** D1 jour, plan large. Pot PL0 posé au centre du sol.
- **Minuton :** à gauche du pot (M01).
- **Action :** une graine (E1) tombe du haut de l'image en tournoyant et rebondit sur sa couronne à 0,8 s. Il passe en M02 avec un petit écrasement. La graine rebondit deux fois et roule à ses pieds. Il se penche pour la regarder (M03).
- **Montage :** chute et rotation de la graine, écrasement et étirement de Minuton, rebonds.
- **Bruitages :** sifflement léger de chute, « tok ! » boisé, deux petits « tic tic » de rebond.

### S2 — Une graine ! (2,5 – 5 s)
- **Gros plan :** G1a, avec un clignement G1b à 3,8 s.
- **Montage :** lent rapprochement de la caméra.
- **Bruitages :** petit « ooh » musical (deux notes de glockenspiel). Pas de voix.

### S3 — Il la plante (5 – 9 s)
- **Décor :** D1, plan large.
- **Action :** Minuton tient la graine (M04), puis marche jusqu'au pot (cycle M13 à M16, environ 2 pas par seconde). Il s'accroupit, tend la graine (M05) et l'enfonce dans la terre (M06).
- **Montage :** déplacement, cycle de marche avec léger rebond vertical, petite pluie de terre à l'enfoncement.
- **Bruitages :** petits pas doux, « pouf » de terre.

### S4 — L'arrosage (9 – 11,5 s)
- **Minuton :** M07, debout à gauche du pot, arrosoir incliné vers le pot.
- **Montage :** gouttes d'eau animées de l'arrosoir jusqu'au pot, et un petit balancement de l'arrosoir.
- **Bruitages :** gouttes en rythme, « glou » doux.

### S5 — Attendre… (11,5 – 16 s)
- **(a) 11,5 – 13 s :** Minuton assis face au pot (M08). Le soleil ne bouge pas, un nuage passe lentement.
- **(b) 13 – 14,5 s :** il se penche, le nez au ras de la terre (M09). Rien ne pousse.
- **(c) 14,5 – 16 s :** il se tourne vers le spectateur, menton dans les mains (M10), et cligne lentement des yeux (M11).
- **Montage :** passages en coupe nette, nuage animé, zoom de plus en plus serré pour souligner l'attente.
- **Bruitages :** tic-tac de plus en plus présent, un oiseau au loin, un grillon. Pas de musique.

### S6 — Le bouton (16 – 18 s)
- **(a) 16 – 17 s :** M12. Ses yeux montent vers son bouton, et des étoiles d'idée scintillent autour.
- **(b) 17 – 18 s :** gros plan G2a, puis G2b à 17,6 s.
- **Bruitages :** « ding » de l'idée, puis « CLIC » net et satisfaisant.

### S7 — Le temps file (18 – 25 s)
- **Décor :** D1, D2, D3 et retour à D1 en boucle, de plus en plus vite (environ 3 journées en 7 s).
- **Plante :** elle pousse en continu, de PL0 à PL5. Chaque étape grandit d'un coup avec un petit rebond, entre deux fondus très courts.
- **Minuton :** assis à gauche du pot (M21), il penche la tête en arrière à mesure que la fleur monte.
- **Montage :**
  - le soleil et la lune, dessinés en code, traversent le ciel en arc ;
  - les étoiles scintillent la nuit et les nuages filent ;
  - l'ombre de Minuton tourne autour de lui ;
  - la teinte de nuit est appliquée sur Minuton et la plante.
- **Bruitages :** tic-tac en accéléré qui devient un bourdonnement, montée musicale (glissando), petits « pop » à chaque étape de croissance.

### S8 — Stop ! (25 – 26,5 s)
- **Gros plan :** G2b (le doigt sur le bouton), avec une petite secousse de caméra très douce.
- **Bruitages :** « CLIC », puis **tout s'arrête net**. Une seconde de silence, juste le vent.

### S9 — Géant (26,5 – 30 s)
- **Plan :** G3 en contre-plongée.
- **Montage :** la caméra part du bas (Minuton minuscule) et monte lentement jusqu'à la fleur. Des pétales (E2) tombent en tournoyant.
- **Bruitages :** grincement doux de tige, une note grave de violoncelle.

### S10 — Il se penche (30 – 32 s)
- **Décor :** D1, plan large.
- **Minuton :** à gauche du pot (M22), regarde en haut, inquiet.
- **Plante :** PL5, qui passe lentement à PL8 (la tête descend vers lui).
- **Montage :** fondu lent entre PL5 et PL8, avec un léger balancement de la tige.
- **Bruitages :** grincement, tic-tac qui s'accélère un peu (le cœur de Minuton bat).

### S11 — Il te suit ! (32 – 34 s)
- **Action :** Minuton fait trois petits pas vers la gauche (M17 à M20), puis s'arrête (M23). La fleur pivote vers la gauche (PL6), avec un rebond.
- **Bruitages :** « swoosh » de tige, petit « boïng » joueur. La musique repart, pizzicati espiègles.

### S12 — … et encore ! (34 – 36 s)
- **Action :** trois pas vers la droite (M13 à M16), arrêt (M24). La fleur pivote vers la droite (PL7).
- **Bruitages :** « swoosh », deuxième « boïng », une note plus haute.

### S13 — La course (36 – 40 s)
- **Action :** Minuton court de gauche à droite et de droite à gauche, de plus en plus vite (mêmes cycles, environ 4 pas par seconde). La fleur alterne PL6 et PL7 pour le suivre et se balance avec un petit retard, comme un ressort. À la fin, Minuton s'arrête au centre et rit (M25 et M26 en alternance).
- **Bruitages :** pas rapides, petits « swoosh » en rythme, la musique accélère, rire figuré par des notes de xylophone.

### S14 — Le vrai soleil (40 – 42 s)
- **Décor :** fondu de D1 vers D2 (coucher). Le soleil dessiné descend derrière la haie à gauche.
- **Minuton :** M27, il regarde le coucher de soleil, soulagé.
- **Plante :** PL6, la fleur se tourne vers le vrai soleil. Elle a compris.
- **Bruitages :** la musique ralentit, accord doux et chaud.

### S15 — Bonne nuit (42 – 46,5 s)
- **Plan :** G4.
- **Montage :** lent rapprochement, lucioles qui s'allument une à une autour de lui, léger mouvement de respiration sur Minuton.
- **Bruitages :** grillons, tic-tac très lent et doux, berceuse au glockenspiel.

### S16 — Tok ? (46,5 – 48 s) · BOUCLE
- **Plan :** G4 (même cadrage).
- **Action :** une graine (E1) se détache de la fleur et tombe doucement vers la couronne de Minuton endormi. **Coupe juste avant l'impact.** Le short reprend sur S1, où la graine tombe et fait « tok ! ».
- **Bruitages :** petit sifflement de chute, coupé net.

---

## Récapitulatif à générer

| Catégorie | Codes | Nombre |
|---|---|---|
| Décors | D1, D2, D3 | 3 |
| Minuton découpé | M01 à M27 (deux planches de marche de 4 poses) | 27 |
| Pot et plante | PL0 à PL8 | 9 |
| Éléments | E1, E2 | 2 |
| Gros plans | G1a, G1b, G2a, G2b, G3, G4 | 6 |
| **Total** | | **47** |

**Ordre conseillé :** commence par D1, M01 et PL0. Envoie-les-moi d'abord : je fais un essai d'incrustation pour vérifier que les échelles et la lumière collent avant que tu génères tout le reste.

---

## Résultat du test d'incrustation (D1, M01, PL0)

Le test est validé (`02_test_incrustation.jpg`). Les pieds de Minuton et la base du pot reposent sur le même sol, la lumière et le style collent, et le ciel laisse toute la place au tournesol. Position retenue en 1080 × 1920 : Minuton les pieds vers (270, 1450) pour 480 px de haut, le pot sur la tache de terre vers (620, 1420) pour 230 px de haut. J'ajoute moi-même les ombres de contact.

### Consignes pour la suite de la génération

1. **Minuton (M02 à M27) :** même canevas, même échelle et même marge de 8 % que M01, personnage entier. Pour les planches de marche, garder la même taille de personnage que M01 sur chaque pose. Je recale chaque pose par sa boîte de contenu et le bas des pieds.
2. **Plante PL1 à PL3 :** même canevas 1024 × 1536 que PL0, pot exactement au même endroit et à la même taille.
3. **Plante PL4 à PL8, nouveau canevas.** Avec le pot à la taille de PL0, le tournesol ne pourrait pas monter plus haut que la barrière. Ces cinq images utilisent donc un canevas 1024 × 1536 avec un **pot plus petit** : le même pot, environ 2 fois plus petit (environ 15 % de la hauteur de l'image), centré en bas. La fleur peut alors monter jusqu'en haut du canevas. Garder ce petit pot identique d'une image à l'autre : je remets tout à l'échelle en me calant sur le pot.
4. **D2 et D3 :** générés en modifiant D1, même cadrage exactement (barrière, buissons, tache de terre au même endroit).
