# Studio Minuton — images à générer avec ChatGPT

Le studio dessine lui-même les bras, les jambes, les pieds et le visage de Minuton, en vectoriel : il peut ainsi marcher, sauter, saluer, cligner des yeux et prendre toutes les expressions sans nouvelle image. Ce qu'il te faut générer, ce sont les **éléments fixes** : le corps vu sous différents angles, les décors et les accessoires. Ils se réutilisent ensuite dans tous les épisodes.

**Règles communes :**
- Joindre les références de l'artset (`04_Minuton_base_transparent.png`, `05_Reference_scene_originale.png`, `01_Modele_vues.png`) et M01.
- Style du guide : illustration 2D chaleureuse, contours prune foncé, ombres douces, aucun texte.
- **Une image par fichier**, nommée avec son code (`B2.png`, `D-cuisine-jour.png`…).
- Les PNG transparents doivent avoir un vrai canal alpha. Pas de ZIP au-dessus de 30 Mo : envoie plutôt plusieurs ZIP, ou les PNG directement.

---

## Priorité 1 — Les références de l'artset (déjà existantes)

Envoie-moi tels quels les fichiers du dossier « Artset » : `01_Modele_vues.png`, `02_Expressions.png`, `03_Poses_actions_transparent.png`, `04_Minuton_base_transparent.png`, `05_Reference_scene_originale.png`, `Palette.json`.

Je m'en sers pour caler le visage vectoriel (yeux, bouches, sourcils, joues) sur les vraies expressions de Minuton.

## Priorité 2 — Le corps de Minuton sous 5 angles (sans bras, sans jambes, sans visage)

Le corps de face existe déjà (je l'ai tiré de M01). Avec les autres angles, Minuton peut se tourner pour de vrai : marcher de profil, faire demi-tour, se retourner.

> **Base :** Illustration 2D du corps de Minuton conforme aux références jointes : boîtier de chronomètre jaune doré rond, anneau orange, couronne orange striée, petit bouton latéral, contours prune foncé épais, ombres douces. **Sans bras, sans jambes, sans pieds. Cadran vide : pas d'yeux, pas de bouche, pas de joues, pas de sourcils, pas de graduations.** Corps seul, entier, centré, vrai fond transparent, même échelle et même lumière (en haut à droite) que M01, aucun texte.

| Code | Angle |
|---|---|
| **B2** | Trois-quarts gauche : le cadran regarde vers la gauche de l'image, on voit l'épaisseur du boîtier à droite. |
| **B3** | Profil gauche : le boîtier vu par la tranche, cadran vers la gauche (disque très étroit). |
| **B4** | Dos : le dos doré du boîtier, sans cadran ni visage. |
| **B5** | Trois-quarts droite : le cadran regarde vers la droite de l'image. |
| **B6** | Profil droit : le boîtier vu par la tranche, cadran vers la droite. |

Le bouton latéral garde sa place sur le boîtier quand Minuton tourne (comme sur `01_Modele_vues.png`).

## Priorité 3 — Les décors vides (format 9:16, sans personnage)

Chaque décor est demandé en **trois éclairages** : jour, coucher de soleil, nuit. Commence par la version jour, puis demande les deux autres en modifiant cette image (« exactement la même image, mais au coucher du soleil / la nuit »).

> **Base décor :** Décor vide en illustration 2D pour un dessin animé, format vertical 9:16, vue de face à hauteur d'enfant, style des références jointes. **Aucun personnage**, aucun texte. Un **sol dégagé** sur le tiers inférieur (Minuton y marche de gauche à droite). Pas d'objet au centre du sol. Lumière venant d'en haut à droite. Pour les extérieurs : ciel sans soleil ni lune (je les anime).

| Code | Lieu |
|---|---|
| **D-chambre** | La chambre de Minuton : lit, étagère, fenêtre, petite table basse et tapis, ambiance douce (proche de l'épisode 1). |
| **D-cuisine** | Cuisine chaleureuse : plan de travail bas, fenêtre, étagères avec pots. |
| **D-parc** | Parc : allée, banc à droite, arbres, ciel ouvert sur la moitié haute. |
| **D-foret** | Lisière de forêt : grands arbres, champignons, clairière au sol. |
| **D-plage** | Plage : sable au sol, mer à l'horizon, ciel ouvert. |
| **D-rue** | Petite rue de village : façades colorées, trottoir large au sol. |

Le jardin des épisodes 2 et 3 existe déjà (D1, D2, D3).

## Priorité 4 — Accessoires (fond transparent, objet seul et entier)

> **Base accessoire :** Objet seul en illustration 2D dans le style des références jointes, contours prune foncé, couleurs chaleureuses, vrai fond transparent, centré, sans ombre portée, aucun texte.

| Code | Objet |
|---|---|
| **A-crayon** | Crayon violet, à l'horizontale. |
| **A-feuille** | Feuille de papier blanche, à plat, légèrement de biais. |
| **A-livre** | Livre fermé violet. |
| **A-ballon** | Ballon rond à motifs, jaune et violet. |
| **A-parapluie** | Parapluie violet ouvert, manche vers le bas. |
| **A-guitare** | Petit ukulélé en bois. |
| **A-casserole** | Petite casserole orange. |
| **A-cerf-volant** | Cerf-volant violet et orange, sans ficelle. |
| **A-coussin** | Gros coussin rond vert sauge. |
| **A-lampe** | Lampe de chevet allumée. |

Pas besoin de tout générer d'un coup. **Les priorités 1 et 2 suffisent pour que la marionnette soit au top.** Les décors et accessoires peuvent arriver au fil des épisodes.

---

## Ce que je n'ai PAS besoin que tu génères

- Les bras, jambes, pieds, mains, yeux, bouches et sourcils : dessinés par le moteur.
- Les poses : le moteur les crée (marcher, courir, sauter, saluer, s'asseoir, dormir…).
- Le soleil, la lune, les étoiles, les nuages, la pluie, la neige, les flaques, l'arc-en-ciel, les particules : dessinés par le moteur.
- La musique et les bruitages : générés par le studio.
