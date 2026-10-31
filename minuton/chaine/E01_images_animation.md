# Épisode 1 « Une minute pour Piou » : toutes les images à générer

## Pourquoi seulement 19 images au départ ?

Les 19 images K01 à K19 sont les **images clés** : une ou deux par plan, comme un storyboard. C'est l'ordre de travail d'un studio : d'abord les poses clés, puis les intervalles et les poses vivantes. On avait procédé de la même façon pour « La pile » : 34 dessins, puis 17 compléments, soit 51 au total.

Commencer par les clés permet de vérifier que Minuton, Piou et le jardin restent fidèles avant de lancer le reste.

Maintenant que les voix existent, il faut aussi animer les **bouches**. Pour chaque pose où un personnage parle, je demande 1 ou 2 variantes de la même image où seule la bouche change. Au montage, je cale automatiquement la bonne bouche sur la voix, selon son volume : bouche fermée, mi-ouverte ou grande ouverte.

Voici donc **la liste complète : 82 images**, soit les 19 clés plus 63 dessins d'animation. Quand tout sera arrivé, je mesurerai les écarts entre les dessins (comme pour « La pile »). Je te demanderai peut-être quelques intervalles en plus, mais seulement là où ça saute.

| Type | Nombre | Rôle |
|---|---|---|
| Clés (K01 à K19) | 19 | Les poses qui racontent l'histoire |
| Intervalles et anticipations | 30 | Le mouvement entre les clés : l'élan avant un geste, la suite après |
| Bouches (synchro labiale) | 19 | Les personnages parlent vraiment |
| Poses vivantes et cycles | 11 | Respiration, clignement, gestes répétés (dessiner, taper la boue) |
| Inserts | 3 | Le dessin qui avance sur la feuille |
| **Total** | **82** | Pour environ 41 s |

---

## Comment les générer

- **Dans chaque plan, génère d'abord la ou les clés, puis les autres images dans l'ordre du tableau.**
- La colonne **Départ** indique l'image à joindre et à modifier. Joins aussi `M01_reference_complete.png`, et `R0_oisillon` quand Piou est à l'image.
- PNG 941 × 1672, sans aucun texte, sans retournement en miroir : le bouton de Minuton reste en haut à droite.
- **Nomme chaque fichier avec son code**, par exemple `K04_b1.png`, et envoie-les plan par plan, en PNG ou en petits ZIP (12 images au plus).

**Prompt A, pour une clé :**
> Image verticale 941 × 1672, dans le style exact des images jointes (R0_oisillon, R1_jardin, M01_reference_complete). **[DESCRIPTION]**. Minuton exactement comme sur M01 : disque jaune, grands yeux violets avec reflets blancs, joues pêche, bouche prune, couronne orange rayée, bouton en haut à droite, petits bras et jambes jaunes, contours prune épais. Aucun texte. Ne pas retourner l'image en miroir.

**Prompt B, pour un dessin d'animation :**
> Pars de l'image jointe **[DÉPART]**. Garde strictement identiques le décor, le cadrage, la lumière et le dessin des personnages. Change seulement ceci : **[CONSIGNE]**. Même style, 941 × 1672, aucun texte.

**Prompt C, pour une bouche :**
> Reprends exactement l'image jointe **[DÉPART]** sans rien changer : même décor, même cadrage, même pose, mêmes yeux. Change **uniquement la bouche de [Minuton / Piou]** : **[FORME]**. 941 × 1672, aucun texte.

Les formes de bouche : **fermée** (un trait ou un sourire), **mi-ouverte** (petite ouverture, l'intérieur prune un peu visible), **grande ouverte** (langue visible), **« ou »** (petite bouche ronde). Pour Piou : **bec fermé**, **bec mi-ouvert** ou **bec grand ouvert**.

---

## Plan 1 · Le choc (0 – 3,5 s)
Voix : *« Oh non ! L'anniversaire de Piou… c'est dans une minute ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K01** | — | A | Gros plan : Minuton, yeux écarquillés, bouche en « o », devant un petit calendrier accroché à la barrière du jardin. Une case est entourée en rouge, avec un petit dessin de gâteau et une plume bleue (aucun chiffre ni mot). |
| `K01_b1` | K01 | C | Bouche grande ouverte (il crie « Oh non ! »). |
| `K01_b2` | K01 | C | Bouche mi-ouverte, coins tombants, l'air inquiet. |
| `1a` | K01 | B | Avant le choc : Minuton calme, léger sourire, bouche fermée, les yeux tournés vers la case entourée. |
| `1b` | 1a | B | Il comprend : corps un peu tassé vers le bas, épaules remontées, yeux plissés. |
| `1c` | 1b | B | Le sursaut : Minuton étiré vers le haut, pieds décollés, yeux immenses, couronne soulevée, petits traits de surprise autour de la tête. |

## Plan 2 · Le bouton (3,5 – 6,5 s)
Voix : *« Une minute ? C'est largement assez ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K02** | — | A | Plan rapproché : Minuton, l'air décidé, appuie d'un doigt sur son bouton latéral, yeux plissés de concentration. |
| `2a` | K02 | B | Le doigt n'est plus sur le bouton : il se gratte la tête, un sourcil levé, sceptique, bouche en petit « ou » (« Une minute ? »). |
| `2a_b1` | 2a | C | Bouche mi-ouverte. |
| `2b` | 2a | B | Sourire très confiant, un poing sur la hanche, l'autre pouce levé, bouche grande ouverte (« C'est largement assez ! »). |
| `2b_b1` | 2b | C | Bouche fermée, grand sourire. |
| `2c` | K02 | B | Juste avant d'appuyer : bras tiré en arrière, index tendu vers le bouton, langue un peu tirée. |
| `2d` | K02 | B | Juste après : il retire le doigt, petit éclat lumineux autour du bouton, regard décidé, prêt à partir. |

## Plan 3 · Essai 1, le caillou (6,5 – 12 s)
Voix : *« Un caillou ? »* … *« Non. »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K03** | — | A | Plan moyen dans le jardin : Minuton soulève un gros caillou gris et rond à hauteur du ventre, l'air concentré. Une feuille blanche et un ruban rouge sont posés à côté. |
| **K04** | K03 | B | Même plan : il tient le caillou emballé dans la feuille avec un gros nœud rouge et le regarde, dubitatif, bouche fermée de travers. |
| **K05** | K04 | B | Même plan : il jette le paquet par-dessus son épaule, et le paquet vole en arrière. |
| `3a` | K03 | B | Avant : Minuton penché vers le caillou encore au sol, les deux mains posées dessus. |
| `3b` | K03 | B | Emballage express : un tourbillon de feuille et de ruban autour du caillou, mains floues, traits de vitesse. |
| `K04_b1` | K04 | C | Bouche mi-ouverte. |
| `K04_b2` | K04 | C | Bouche en « ou » (« caillou ? »). |
| `4a` | K04 | B | Il regarde le spectateur, sourcils plats, l'air blasé, bouche fermée en trait. |
| `4a_b1` | 4a | C | Bouche mi-ouverte (« Non. »). |
| `4b` | K04 | B | Juste avant le lancer : paquet levé au-dessus de la tête, corps penché en arrière. |
| `5a` | K05 | B | Après le lancer : bras qui retombent, le paquet tout petit en haut du cadre, Minuton déjà tourné vers la suite. |

## Plan 4 · Essai 2, le gâteau (12 – 17,5 s)
Voix : *« Un gâteau ! »* … *« Beurk. »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K06** | — | A | Plan moyen : Minuton accroupi, les mains pleines de boue, devant un petit gâteau de boue surmonté d'une fleur jaune. Il est fier, bouche fermée souriante. |
| **K07** | K06 | B | Même plan : le gâteau s'est effondré et a éclaboussé Minuton, couvert de taches de boue, l'air dépité, bouche fermée en grimace. |
| `6a` | K06 | B | Le gâteau n'est encore qu'un tas : Minuton tapote la boue, les deux mains levées. |
| `6b` | 6a | B | Même chose, mains en bas, qui tapent la boue, petites éclaboussures. |
| `K06_b1` | K06 | C | Bouche grande ouverte (« Un gâteau ! »). |
| `K06_b2` | K06 | C | Bouche mi-ouverte. |
| `6c` | K06 | B | Le gâteau commence à pencher et à s'affaisser. Minuton sourit encore et ne voit rien. |
| `6d` | 6c | B | Le gâteau s'écroule : une gerbe de boue part vers Minuton, dont les yeux s'agrandissent. |
| `K07_b1` | K07 | C | Langue tirée, grimace de dégoût (« Beurk. »). |
| `7a` | K07 | B | Pose vivante : une goutte de boue tombe du bout de sa couronne, il a les yeux mi-clos. |

## Plan 5 · Essai 3, la fleur (17,5 – 22 s)
Voix : *« Hé ! Rends-moi ça ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K08** | — | A | Plan moyen près d'un massif de fleurs : Minuton tient une magnifique fleur rose qu'il vient de cueillir, émerveillé. |
| **K09** | K08 | B | Même plan : un joli papillon orange et violet s'est posé sur la fleur. Minuton le regarde, surpris. |
| **K10** | K09 | B | Même plan : le papillon s'envole en emportant la fleur. Minuton tend les bras vers lui, bouche grande ouverte (« Hé ! »). |
| `8a` | K08 | B | Avant : Minuton tire sur la tige de la fleur encore plantée, la fleur se courbe, il force. |
| `8b` | K08 | B | Pose vivante : il sent la fleur, yeux fermés, petites étincelles. |
| `9a` | K08 | B | Le papillon arrive en haut de l'image, ailes ouvertes. Minuton ne l'a pas vu. |
| `9b` | K09 | B | Le papillon attrape la tige avec ses pattes, ailes levées, et la fleur glisse des mains de Minuton. |
| `K10_b1` | K10 | C | Bouche mi-ouverte. |
| `K10_b2` | K10 | C | Bouche fermée, sourcils froncés. |
| `10a` | K10 | B | Minuton saute pour la rattraper, corps étiré, pieds décollés. Le papillon est plus haut, presque hors du cadre. |
| `10b` | 10a | B | Il retombe, accroupi, bras ballants. Le papillon n'est plus qu'un point dans le ciel. |

## Plan 6 · Le creux (22 – 26 s)
Voix : narrateur *« Plus que dix secondes… »*, puis Minuton *« Mais oui ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K11** | — | A | Plan moyen : Minuton assis dans l'herbe, découragé, tête basse, bras ballants. **Son crayon violet et une feuille blanche sont déjà dans l'herbe à côté de lui.** |
| **K12** | K11 | B | Même plan : il relève la tête, les yeux brillants, bouche fermée souriante, le regard sur le crayon et la feuille. |
| `11a` | K11 | B | Pose vivante : il soupire, épaules encore plus basses, yeux fermés. |
| `11b` | K11 | B | Seuls ses yeux se tournent vers le crayon, la tête ne bouge pas. |
| `K12_b1` | K12 | C | Grand sourire, bouche grande ouverte (« Mais oui ! »). |
| `12a` | K12 | B | Il se ramasse pour bondir, mains au sol, corps tassé. |
| `12b` | 12a | B | Il bondit sur ses pieds en attrapant le crayon, corps étiré, une petite étoile au-dessus de la tête. |

## Plan 7 · La course finale (26 – 30 s)
Pas de voix : le crayon gratte, la musique accélère.

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K13** | — | A | Plan rapproché : Minuton dessine à toute vitesse sur la feuille posée dans l'herbe, langue tirée, traits de mouvement autour du crayon. |
| `13a` | K13 | B | Même pose, le crayon en haut à gauche de la feuille, langue tirée de l'autre côté. |
| `13b` | K13 | B | Même pose, le crayon en bas à droite, corps penché davantage. |
| `13c` | K13 | B | Même pose, le crayon au milieu, une petite goutte de sueur sur le côté. |
| `13p3` | K15 | B | **Insert** : gros plan de la feuille vue du dessus, posée dans l'herbe. Elle montre le dessin terminé, **exactement celui de K15** : Minuton et Piou au crayon violet sous un arbre, avec un cœur, style dessin d'enfant. |
| `13p2` | 13p3 | B | La même feuille, dessin à moitié fait : on reconnaît Minuton et Piou, mais l'arbre et le cœur ne sont pas encore dessinés. |
| `13p1` | 13p2 | B | La même feuille, avec seulement les premiers traits : le contour rond de Minuton. |
| `13d` | K13 | B | Il brandit le dessin fini devant lui (on voit le dos de la feuille), fier, et s'essuie le front de l'autre main. |

`13a`, `13b`, `13c` et `K13` forment un **cycle** : je les enchaîne en boucle à 12 images par seconde, ce qui donne l'impression qu'il griffonne frénétiquement.

## Plan 8 · Piou arrive (30 – 34,5 s)
Voix : Piou *« Salut Minuton ! »*, puis Minuton *« Joyeux anniversaire, Piou ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K14** | — | A | Plan moyen : Minuton debout, le dessin caché dans son dos, sourire innocent. Piou arrive en voletant par la gauche. |
| **K15** | K14 | B | Même plan : Minuton tend le dessin à Piou, posé devant lui. Le dessin est visible : un Minuton et un Piou dessinés au crayon violet sous un arbre, avec un cœur, style dessin d'enfant. Bouche de Minuton grande ouverte et souriante. |
| `14a` | K14 | B | Minuton tient encore le dessin devant lui et tourne la tête vers la gauche, où Piou apparaît, tout petit dans le ciel, ailes levées. |
| `14b` | 14a | B | Minuton cache vite le dessin dans son dos (traits de vitesse). Piou est plus proche, ailes baissées. |
| `14c` | K14 | B | Piou s'est posé devant Minuton, ailes repliées, bec fermé, souriant. |
| `14c_b1` | 14c | C | Bec de Piou grand ouvert (« Salut Minuton ! »). |
| `15a` | 14c | B | Juste avant de montrer le dessin : Minuton se penche en arrière, tout content, les yeux plissés de joie. |
| `K15_b1` | K15 | C | Bouche de Minuton mi-ouverte. |
| `K15_b2` | K15 | C | Bouche de Minuton fermée, grand sourire. |

## Plan 9 · L'émotion (34,5 – 38,5 s)
Voix : Piou *« C'est nous deux… C'est le plus beau cadeau du monde ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K16** | — | A | Gros plan sur Piou qui tient le dessin dans ses ailes, les yeux brillants, une petite larme de joie, bec fermé. |
| **K17** | — | A | Plan rapproché : câlin entre Minuton et Piou. Minuton ferme les yeux, heureux. Piou est blotti contre son disque. |
| `K16_b1` | K16 | C | Bec mi-ouvert. |
| `K16_b2` | K16 | C | Bec grand ouvert. |
| `16a` | K16 | B | Pose vivante : la larme a coulé plus bas, Piou serre le dessin contre lui. |
| `17a` | K17 | B | Juste avant le câlin : Piou s'élance en vol, ailes grandes ouvertes, et Minuton ouvre les bras. |
| `17b` | K17 | B | Pose vivante : ils se serrent un peu plus fort, sourire plus large, petits cœurs autour. |

## Plan 10 · Pile à l'heure (38,5 – 41 s)
Voix : *« Pile à l'heure ! »*

| Code | Départ | Prompt | Consigne |
|---|---|---|---|
| **K18** | — | A | Plan rapproché : Minuton face au spectateur, fait un clin d'œil, bouche grande ouverte et souriante, Piou perché sur sa couronne, ailes levées. |
| **K19** | — | A | Plan large de fin : Minuton et Piou saluent devant le grand arbre, avec un espace dégagé dans le ciel pour le titre. |
| `18a` | K18 | B | **DING**, la minute est écoulée : Minuton vibre (petits traits de vibration autour du disque), les deux yeux ouverts, surpris. Piou sursaute sur la couronne. |
| `18b` | K18 | B | Les deux yeux ouverts, sourire, il regarde le spectateur. Piou ailes baissées. |
| `K18_b1` | K18 | C | Bouche fermée en sourire, clin d'œil conservé. |
| `19a` | K19 | B | Pose vivante : les bras qui saluent sont dans l'autre position, et les ailes de Piou aussi. |

---

## Ce que je fais ensuite au montage

- **Stabilisation et anti-scintillement** : le décor reste parfaitement fixe d'un dessin à l'autre, comme pour « La pile ».
- **Feuille d'exposition** : chaque dessin reçoit sa durée. Poses tenues pour les répliques, 8 à 12 dessins par seconde dans l'action.
- **Synchro labiale** : la bouche suit le volume de la voix (fermée, mi-ouverte ou grande ouverte).
- Caméra, compte à rebours, sous-titres, musique, bruitages et voix, mixés à −14 LUFS.
