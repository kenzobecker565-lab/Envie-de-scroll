# Épisode 5 — Le petit oiseau

- **Format :** Short vertical 9:16, environ 52 s, sans paroles ni texte.
- **Public :** enfants (voir `../GUIDE.md`).
- **Méthode :** comme les épisodes 1 et 2, chaque image est une illustration complète générée par ChatGPT. Cette fois, il y a **plus d'images par plan** : chaque geste est découpé en 3 à 7 étapes, pour un résultat plus animé. Au montage, j'ajoute :
  - les mouvements de caméra ;
  - les fondus courts entre étapes ;
  - les effets (plumes, étoiles, cœurs, feuilles) ;
  - toute la bande son (pépiements, bruitages, musique).

## L'histoire

Minuton dessine tranquillement dans le jardin quand un **oisillon tombe du nid** et atterrit devant lui. Le petit oiseau est perdu : son nid est tout en haut du grand arbre.

Minuton essaie de l'y ramener :
1. **sur la pointe des pieds :** beaucoup trop petit ;
2. **en empilant un pot, un arrosoir et un seau :** la pile s'écroule.

L'oisillon est triste. Alors Minuton a une idée : il va **lui apprendre à voler**. Il bat de ses petits bras, l'oisillon imite et tombe, réessaie… Finalement Minuton court en le tenant au-dessus de sa tête comme un avion et le lance doucement vers le ciel. **L'oisillon vole !** Il rejoint son nid, où sa maman arrive et le serre sous son aile.

Pour dire merci, la maman oiseau descend déposer **une plume bleue sur la couronne de Minuton**. Au coucher du soleil, Minuton, fier, bat des bras à son tour… et fait un tout petit saut.

**Ce qui fait l'histoire :**
- **Une envie claire :** ramener l'oisillon chez lui.
- **Deux échecs drôles et doux.**
- **Une idée qui change tout :** au lieu de porter l'oisillon, l'aider à voler par lui-même.
- **Une émotion :** les retrouvailles avec la maman.
- **Une récompense, et une fin qui sourit :** la plume.

---

## Les personnages et le décor de référence (à générer en premier)

Ces quatre images servent de référence à **toutes** les autres. Joins-les à chaque génération, avec `05_Reference_scene_originale.png` et `M01_reference_complete.png`.

| Code | Prompt |
|---|---|
| **R0_oisillon** | Fiche personnage en illustration 2D dans le style de Minuton (contours prune foncé, couleurs chaleureuses, ombres douces) : **Piou**, un oisillon tout rond et duveteux, de la taille d'une balle de ping-pong à côté de Minuton (environ un quart de la hauteur du disque de Minuton). Plumes bleu ciel, ventre crème, petites ailes courtes, petit bec orange, deux pattes orange fines, grands yeux noirs brillants avec un reflet blanc, joues roses, trois petites plumes en épi sur la tête. Trois vues sur fond blanc : face, profil, de dos. Aucun texte. |
| **R0_maman** | Même style et mêmes couleurs que l'oisillon jointe : **la maman de Piou**, un oiseau rond plus grand (environ la moitié de la hauteur du disque de Minuton), plumes bleu ciel, ventre crème, longue plume bleue sur la tête, regard doux. Trois vues : face, profil, en vol ailes ouvertes. Fond blanc, aucun texte. |
| **R1_jardin** | Décor vertical 9:16 dans le style des références jointes : le jardin de Minuton (barrière en bois, buissons, pelouse, comme `D1.png`) avec, **sur la gauche, un grand arbre** au tronc brun et au feuillage vert rond. Tout en haut de l'arbre, sur une branche qui avance vers le centre, **un petit nid** de brindilles. Pelouse dégagée au premier plan. Après-midi ensoleillé, lumière en haut à droite. Aucun personnage, aucun texte. |
| **R2_nid** | Gros plan vertical 9:16 sur la branche de l'arbre de `R1_jardin` avec le nid vide, feuillage autour, ciel bleu derrière. Même style. Aucun personnage, aucun texte. |

---

## Règles pour toutes les images de l'épisode

> **Base à mettre en tête de chaque prompt :**
> Illustration 2D verticale 9:16 dans le style exact des références jointes. Minuton conforme à `M01_reference_complete.png` : chronomètre jaune rond et compact, visage intégré au disque, grands yeux violets à reflets blancs, joues pêche, couronne orange striée, petit bouton latéral en haut à droite, contours prune foncé, bras et jambes très courts. Piou l'oisillon conforme à `R0_oisillon`, la maman conforme à `R0_maman`. Décor : le jardin de `R1_jardin` (même arbre, même nid, même barrière). Lumière douce et chaude, couleurs chaleureuses, lisible pour les enfants, aucun texte, aucune bulle. **[PLAN]**

- **Un plan = un cadrage.** Garde le même cadrage et le même décor pour toutes les images d'un plan : seuls les personnages bougent. Joins l'image précédente du plan pour assurer le raccord.
- **Nom de fichier = code** (`P05_C.png`, par exemple), format 9:16 (941 × 1672 ou 1080 × 1920).
- **Pas de flou de mouvement**, pas de texte, pas de cadre.
- Livraison en ZIP de 30 Mo maximum (plusieurs ZIP si besoin).

---

## Découpage et images (52 s, 37 images + 4 références)

### P1 — Plouf ! (0 – 3 s) · HOOK
**Cadrage :** plan moyen. Minuton assis dans l'herbe à droite, l'arbre à gauche.

| Code | Image |
|---|---|
| **P01_A** | Minuton assis dans l'herbe, une feuille et un crayon violet devant lui, il dessine, concentré. En haut à gauche, un tout petit oisillon bleu tombe de l'arbre en battant des ailes maladroitement. |
| **P01_B** | Même image. L'oisillon est à mi-hauteur, ailes ouvertes, affolé. Minuton dessine toujours. |
| **P01_C** | Même image. L'oisillon vient d'atterrir dans l'herbe juste devant Minuton, avec quelques petites plumes bleues qui volent autour de lui. Minuton relève la tête, surpris, le crayon en l'air. |

*Sons : petit sifflement de chute, « pouf » duveteux, plumes. Musique douce qui s'arrête net à l'atterrissage.*

### P2 — L'oisillon (3 – 7 s)
**Cadrage :** gros plan au ras de l'herbe sur l'oisillon. On voit les pieds de Minuton en arrière-plan.

| Code | Image |
|---|---|
| **P02_A** | L'oisillon assis dans l'herbe, sonné, de petites étoiles autour de la tête. |
| **P02_B** | Il secoue la tête, les plumes de son épi ébouriffées. |
| **P02_C** | Il lève les yeux vers le haut, inquiet, le bec ouvert pour pépier. |

*Sons : petits « piou » aigus, une note de flûte inquiète.*

### P3 — Si haut ! (7 – 10 s)
| Code | Image |
|---|---|
| **P03_A** | Contre-plongée : le grand arbre vu d'en bas, le nid minuscule tout en haut, ciel bleu. |
| **P03_B** | Plan moyen : Minuton (debout) et l'oisillon (dans l'herbe à ses pieds) regardent tous les deux vers le haut de l'arbre, de dos et de trois-quarts. |

*Sons : vent léger dans les feuilles.*

### P4 — Première idée : sur la pointe des pieds (10 – 15 s)
**Cadrage :** plan moyen au pied de l'arbre, le nid visible en haut de l'image.

| Code | Image |
|---|---|
| **P04_A** | Minuton s'accroupit et prend délicatement l'oisillon dans ses deux mains, regard doux. |
| **P04_B** | Minuton sur la pointe des pieds, bras tendus vers le haut avec l'oisillon dans les mains : le nid est beaucoup trop haut. |
| **P04_C** | Il s'étire encore plus, tout tremblant, joues très rouges d'effort, l'oisillon tend le cou. |
| **P04_D** | Il retombe sur ses talons, déçu, l'oisillon dans les mains contre son ventre. |

*Sons : petit grincement d'étirement comique, « pouf » de retombée.*

### P5 — Deuxième idée : la pile (15 – 24 s)
**Cadrage :** plan large au pied de l'arbre (même cadrage pour les 7 images).

| Code | Image |
|---|---|
| **P05_A** | Minuton apporte un pot de fleurs orange retourné et le pose au pied de l'arbre. L'oisillon le regarde, assis dans l'herbe. |
| **P05_B** | Sur le pot, il pose un petit arrosoir violet retourné. |
| **P05_C** | Au-dessus, un petit seau bleu retourné. La pile est haute et bancale. |
| **P05_D** | Minuton est monté tout en haut de la pile, l'oisillon perché sur sa couronne, bras tendus vers le nid presque atteint. La pile commence à vaciller. |
| **P05_E** | La pile penche fortement, Minuton bat des bras pour garder l'équilibre, l'oisillon s'accroche à la couronne. |
| **P05_F** | La pile s'écroule dans l'herbe, Minuton tombe sur le dos tout en douceur dans l'herbe, l'oisillon rebondit sur son ventre. Les objets roulent autour (rien de dangereux, ambiance comique douce). |
| **P05_G** | Minuton assis dans l'herbe, étourdi, de petites étoiles autour de la tête. L'oisillon assis sur sa tête, étourdi aussi. |

*Sons : « tok » de chaque objet empilé, grincements, la pile qui vacille, chute douce dans l'herbe, « boïng » du rebond, petits oiseaux qui tournent.*

### P6 — Le chagrin, puis l'idée (24 – 28 s)
**Cadrage :** plan rapproché sur les deux personnages assis dans l'herbe.

| Code | Image |
|---|---|
| **P06_A** | L'oisillon pleure doucement, une petite larme, tête basse. Minuton le regarde, peiné. |
| **P06_B** | Minuton pose doucement sa main sur la tête de l'oisillon pour le consoler. |
| **P06_C** | Minuton a une idée : ses yeux brillent, un doigt levé, l'oisillon relève la tête, curieux. |

*Sons : musique triste au glockenspiel, puis « ding » de l'idée.*

### P7 — La leçon de vol (28 – 36 s)
**Cadrage :** plan moyen sur la pelouse dégagée, l'arbre à gauche.

| Code | Image |
|---|---|
| **P07_A** | Minuton fait la démonstration : il bat très fort de ses petits bras, les deux pieds décollés du sol, yeux fermés de concentration. L'oisillon le regarde, impressionné. |
| **P07_B** | L'oisillon imite : il bat des ailes de toutes ses forces et décolle d'un tout petit peu. Minuton l'encourage, poings serrés. |
| **P07_C** | L'oisillon retombe dans l'herbe sur les fesses. Minuton rit gentiment, une main devant la bouche ; l'oisillon rit aussi. |
| **P07_D** | Minuton court sur la pelouse en tenant l'oisillon à bout de bras au-dessus de sa tête, comme un avion. L'oisillon a les ailes grandes ouvertes, ravi. |
| **P07_E** | Au sommet d'un saut, Minuton lance doucement l'oisillon vers le ciel. |

*Sons : bruits de battements de bras, petits sauts, rire au xylophone, course, « fiou » du lancer. La musique repart, joyeuse.*

### P8 — Il vole ! (36 – 41 s)
| Code | Image |
|---|---|
| **P08_A** | Plan large : l'oisillon en l'air bat des ailes maladroitement, Minuton en bas, mains jointes, retient son souffle. |
| **P08_B** | L'oisillon prend de la hauteur vers le nid, de plus en plus assuré. |
| **P08_C** | Plan rapproché du nid (cadrage `R2_nid`) : l'oisillon atterrit dans le nid, ailes levées en victoire. |
| **P08_D** | Plan large : Minuton en bas sautille de joie, bras levés. |

*Sons : battements d'ailes, petit « piou » de victoire, montée musicale, cris de joie au xylophone.*

### P9 — Maman ! (41 – 45 s)
| Code | Image |
|---|---|
| **P09_A** | Cadrage `R2_nid` : la maman oiseau est arrivée dans le nid et serre tendrement son petit sous son aile, yeux fermés de bonheur. |
| **P09_B** | Gros plan sur Minuton, ému, mains jointes contre sa joue, une petite larme de joie. |

*Sons : chant d'oiseau doux à deux voix, musique tendre.*

### P10 — La plume (45 – 49 s)
**Cadrage :** plan moyen, lumière de fin d'après-midi dorée.

| Code | Image |
|---|---|
| **P10_A** | La maman oiseau descend en vol vers Minuton, une longue plume bleue dans le bec. |
| **P10_B** | Elle dépose délicatement la plume sur la couronne de Minuton. Minuton ferme les yeux, ravi. |
| **P10_C** | Minuton seul, fier, la plume bleue plantée dans sa couronne, au coucher du soleil (ciel orange et rose). Il la regarde en levant les yeux, souriant. |

*Sons : battements d'ailes, petit carillon quand la plume se pose.*

### P11 — À mon tour ! (49 – 52 s) · FIN
| Code | Image |
|---|---|
| **P11_A** | Coucher du soleil : Minuton, la plume sur la couronne, bat des bras en riant et fait un tout petit saut. En haut de l'arbre, l'oisillon et sa maman le regardent depuis le nid. |

*Sons : petit saut, rire, dernier accord, coupé net.*

---

## Récapitulatif

| Plan | Images |
|---|---|
| Références (R0_oisillon, R0_maman, R1_jardin, R2_nid) | 4 |
| P1 à P11 | 37 |
| **Total** | **41** |

**Ordre conseillé :**
1. Les 4 références d'abord : envoie-les-moi pour qu'on valide l'oisillon et le décor avant de lancer le reste.
2. Ensuite, plan par plan, en joignant chaque fois l'image précédente du même plan.
