# Studio Minuton — Cahier des charges des images à générer

Ce document s'adresse à ChatGPT, qui génère les images. Il décrit **toutes les images nécessaires pour animer Minuton dans un vrai studio**, avec le dessin et le style exacts de Minuton à chaque image.

---

## 0. Comment fonctionne le studio (à lire avant de générer)

Le studio anime Minuton comme une **marionnette en papier découpé**. Les pièces sont superposées et changées image par image :

```
corps vierge (6 angles)
 + calque YEUX (expression et regard)
 + calque BOUCHE (expression et syllabes)
 + calque JOUES
 + calque BRAS (chaque bras séparément, dans des dizaines de poses)
 + calque JAMBES (debout, marche, course, saut…)
```

Pour que les pièces s'emboîtent parfaitement, **chaque calque est dessiné directement sur le corps vierge fourni**. Tu ajoutes un seul élément, sans rien bouger d'autre. Le studio retrouve ensuite l'élément ajouté en comparant ton image au corps vierge. C'est pourquoi la règle n° 1 ci-dessous est essentielle.

### Règles absolues

1. **Pars toujours de l'image de base indiquée** (dossier `bases/`) et **ne déplace, ne redimensionne, ne recadre et ne redessine pas le corps**. La couronne, le bouton, l'anneau et le contour restent identiques au pixel près. Tu ajoutes uniquement l'élément demandé.
2. **Format de sortie :** PNG **1024 × 1024**, **vrai fond transparent** (canal alpha), même cadrage que la base.
3. **Un seul élément ajouté par image.** Si on demande les yeux, pas de bouche, pas de bras, pas de jambes.
4. **Style de Minuton, comme l'artset :**
   - illustration 2D chaleureuse, contours prune foncé épais, ombres douces, légers dégradés ;
   - grands yeux violet très foncé avec reflets blancs, joues pêche, petite bouche prune, pas de nez ;
   - bras et jambes courts, potelés, jaunes, petites mains arrondies, pieds jaunes ronds.
5. **Lumière en haut à droite**, partout.
6. **Ne jamais retourner une image en miroir** : le bouton et l'éclairage changeraient de côté. Chaque côté est demandé séparément.
7. **Aucun texte**, aucune ombre au sol, aucun décor sur les calques du personnage.
8. **Nom de fichier = code indiqué** (par exemple `Y_F_joie.png`). Livraison en ZIP de 30 Mo maximum par lot, sans réduire la qualité.

### Fichiers à joindre à chaque génération

- `bases/` : la base à modifier (`B1_face_vierge.png`, `B2_trois-quarts_gauche_vierge.png`, `B3_profil_gauche_vierge.png`, `B4_dos_vierge.png`, `B5_trois-quarts_droite_vierge.png`, `B6_profil_droit_vierge.png`).
- Références de style : `02_Expressions.png`, `03_Poses_actions_transparent.png`, `05_Reference_scene_originale.png`, `M01_reference_complete.png`.
- La **première image validée du même lot**, pour que tout le lot garde le même trait.

### Codes des angles (vues)

| Code | Base | Angle |
|---|---|---|
| **F** | `B1_face_vierge.png` | Face |
| **3G** | `B2_trois-quarts_gauche_vierge.png` | Trois-quarts, cadran tourné vers la gauche de l'image |
| **3D** | `B5_trois-quarts_droite_vierge.png` | Trois-quarts, cadran tourné vers la droite de l'image |
| **PG** | `B3_profil_gauche_vierge.png` | Profil, regarde vers la gauche de l'image |
| **PD** | `B6_profil_droit_vierge.png` | Profil, regarde vers la droite de l'image |
| **DOS** | `B4_dos_vierge.png` | De dos |

**Côtés :** « à gauche de l'image » et « à droite de l'image » désignent toujours ce qu'on **voit à l'écran**, jamais la gauche ou la droite du personnage.

---

## Lot 1 — Corps de face propre (1 image)

Le corps de face actuel a été extrait de M01 et garde quelques défauts en bas du disque.

| Code | Consigne |
|---|---|
| **B1_propre** | À partir de `B1_face_vierge.png` : redessine le même corps de face, au même endroit et à la même taille, avec un contour du disque parfaitement propre et régulier tout autour, en particulier en bas. Cadran vide (anneau orange seulement), sans visage ni graduations, sans bras ni jambes. |

---

## Lot 2 — Calque YEUX + SOURCILS (117 images)

> **Prompt modèle :** Pars de l'image jointe `[BASE]` sans rien changer au corps. Ajoute **uniquement les deux yeux et les deux sourcils** de Minuton sur le cadran, dans l'expression « **[ÉTAT]** », exactement dans le style des yeux de `02_Expressions.png` : yeux ovales verticaux, blanc de l'œil, grand iris violet très foncé, reflets blancs, contour prune, sourcils fins en arc. Les yeux sont placés comme dans la référence de cet angle (en vue de trois-quarts, l'œil le plus éloigné est plus petit et plus étroit). Pas de bouche, pas de joues, pas de bras, pas de jambes. PNG 1024 × 1024 transparent, même cadrage.

### Pour les vues F, 3G et 3D (31 états × 3 vues = 93 images)

Code : `Y_<vue>_<état>.png`, par exemple `Y_3G_surprise.png`.

| État | Description |
|---|---|
| `neutre` | Yeux ouverts, regard droit devant, sourcils au repos |
| `joie` | Yeux grands ouverts et brillants, sourcils levés |
| `rire` | Yeux fermés en arcs « ^ ^ » |
| `surprise` | Yeux très ouverts, pupilles un peu plus petites, sourcils très hauts |
| `curiosite` | Un sourcil levé (celui de droite de l'image), l'autre normal |
| `idee` | Yeux grands et pétillants (reflet en petite étoile), sourcils hauts |
| `concentration` | Paupières légèrement baissées, sourcils froncés vers le centre (sans air méchant) |
| `deception` | Paupières mi-tombantes, sourcils en pente vers l'extérieur |
| `inquietude` | Sourcils relevés au centre, yeux ouverts un peu humides |
| `soulagement` | Yeux doucement plissés, sourcils détendus |
| `sommeil` | Yeux fermés, courbes vers le bas, paisibles |
| `malice` | Paupières à moitié fermées, regard en coin, un sourcil levé |
| `tristesse` | Sourcils en pente, yeux brillants avec une petite larme au bord |
| `boudeur` | Sourcils froncés, paupières basses, regard de côté |
| `determine` | Sourcils droits et décidés, regard fixe |
| `emerveille` | Reflets en étoiles dans les iris, sourcils hauts |
| `peur` | Yeux ronds, pupilles toutes petites, sourcils relevés |
| `gene` | Regard vers le bas sur le côté, sourcils relevés au centre |
| `clin_gauche` | Œil à gauche de l'image fermé en arc, l'autre ouvert |
| `clin_droit` | Œil à droite de l'image fermé en arc, l'autre ouvert |
| `etourdi` | Spirales à la place des iris |
| `regard_gauche` | Neutre, pupilles tout à gauche |
| `regard_droite` | Neutre, pupilles tout à droite |
| `regard_haut` | Neutre, pupilles en haut |
| `regard_bas` | Neutre, pupilles en bas |
| `regard_haut_gauche` | Neutre, pupilles en haut à gauche |
| `regard_haut_droite` | Neutre, pupilles en haut à droite |
| `regard_bas_gauche` | Neutre, pupilles en bas à gauche |
| `regard_bas_droite` | Neutre, pupilles en bas à droite |
| `mi_clos` | Paupières à moitié fermées (pour les clignements) |
| `ferme` | Yeux fermés en trait droit (pour les clignements) |

### Pour les vues PG et PD (12 états × 2 vues = 24 images)

En profil, on ne voit qu'**un seul œil**, du côté du regard, sur la tranche du cadran.

États : `neutre`, `joie`, `rire`, `surprise`, `tristesse`, `boudeur`, `sommeil`, `malice`, `regard_haut`, `regard_bas`, `mi_clos`, `ferme`.

---

## Lot 3 — Calque BOUCHE (85 images)

> **Prompt modèle :** Pars de l'image jointe `[BASE]` sans rien changer au corps. Ajoute **uniquement la bouche** de Minuton sur le cadran, forme « **[ÉTAT]** », dans le style de `02_Expressions.png` : petite bouche prune, intérieur prune foncé, langue rose quand elle est ouverte. Même position que sur les références de cet angle (sous les yeux, au centre du cadran). Pas d'yeux, pas de joues, pas de bras, pas de jambes. PNG 1024 × 1024 transparent.

### Pour les vues F, 3G et 3D (23 formes × 3 vues = 69 images)

Code : `B_<vue>_<forme>.png`.

| Forme | Description |
|---|---|
| `sourire` | Petit sourire fermé (neutre) |
| `grand_sourire` | Large sourire fermé |
| `joie` | Sourire ouvert en « D », langue visible |
| `rire` | Grande bouche ouverte de rire |
| `petit_o` | Petit « o » de surprise |
| `grand_o` | Grand « O » |
| `plate` | Trait droit |
| `triste` | Petite courbe vers le bas |
| `tres_triste` | Grande courbe vers le bas, lèvre tremblante |
| `ondulee` | Bouche en vague (inquiet) |
| `moue` | Moue boudeuse |
| `coin` | Sourire en coin (malice) |
| `langue` | Langue tirée |
| `baille` | Bâillement |
| `dort` | Petite bouche entrouverte de dormeur |
| `dents` | Sourire crispé qui montre les dents (« oups ») |
| `vise_A` | Syllabe « a » (bouche ouverte moyenne) |
| `vise_E` | Syllabe « é » (étirée, entrouverte) |
| `vise_I` | Syllabe « i » (étirée, presque fermée) |
| `vise_O` | Syllabe « o » (ronde) |
| `vise_U` | Syllabe « ou » (petite, ronde, en avant) |
| `vise_M` | Syllabes « m, b, p » (lèvres serrées) |
| `vise_F` | Syllabes « f, v » (lèvre du bas rentrée) |

Les syllabes (« visèmes ») servent à faire chanter ou babiller Minuton, en rythme avec la musique.

### Pour les vues PG et PD (8 formes × 2 vues = 16 images)

Formes : `sourire`, `joie`, `rire`, `petit_o`, `triste`, `moue`, `vise_A`, `vise_M`.

---

## Lot 4 — Calque JOUES (10 images)

> Pars de `[BASE]` et ajoute **uniquement les joues** pêche de Minuton, à leur place habituelle, avec le même dégradé doux que dans l'artset.

Codes : `J_<vue>_normales.png` et `J_<vue>_rouges.png` (très rouges, pour la gêne), pour les vues F, 3G, 3D, PG et PD.

---

## Lot 5 — Calque BRAS (154 images)

> **Prompt modèle :** Pars de l'image jointe `[BASE]` sans rien changer au corps. Ajoute **un seul bras**, celui situé **[à gauche / à droite] de l'image**, dans la pose « **[POSE]** ». C'est le bras court, potelé et jaune de Minuton, avec une petite main arrondie à quatre doigts, contour prune, attaché au bord du disque comme sur `M01_reference_complete.png`. Pas d'autre bras, pas de jambes, pas de visage. PNG 1024 × 1024 transparent, même cadrage.

### Vues F, 3G et 3D (2 côtés × 22 poses × 3 vues = 132 images)

Code : `BR_<vue>_<G ou D>_<pose>.png`. `G` = bras à gauche de l'image, `D` = bras à droite de l'image.

| Pose | Description |
|---|---|
| `repos` | Pend détendu le long du corps (comme M01) |
| `ecarte` | Légèrement écarté du corps |
| `horizontal` | Tendu à l'horizontale vers l'extérieur |
| `leve45` | Levé à 45° vers le haut et l'extérieur |
| `leve` | Levé tout droit au-dessus de la tête |
| `hanche` | Poing sur la hanche, coude vers l'extérieur |
| `menton` | Main sous le menton (réflexion) |
| `bouche` | Main devant la bouche (oups, rire caché) |
| `coeur` | Main posée sur le cœur, au centre du disque |
| `coucou` | Avant-bras levé, main ouverte qui salue |
| `coucou2` | Même salut, main inclinée de l'autre côté (2e image du mouvement) |
| `pointe_avant` | Bras tendu, index qui pointe vers le spectateur |
| `pointe_cote` | Bras tendu, index qui pointe sur le côté |
| `pointe_haut` | Index qui pointe vers le ciel |
| `pouce` | Pouce levé |
| `victoire` | Poing fermé levé, bras plié (« yes ! ») |
| `stop` | Paume ouverte face au spectateur |
| `tenir` | Bras plié devant le corps, main en « C » prête à tenir un objet |
| `marche_avant` | Balancé vers l'avant (cycle de marche) |
| `marche_arriere` | Balancé vers l'arrière (cycle de marche) |
| `course_avant` | Plié, balancé fort vers l'avant (cycle de course) |
| `course_arriere` | Plié, balancé fort vers l'arrière (cycle de course) |

### Vues PG et PD (11 poses × 2 vues = 22 images)

En profil, seul **le bras du côté du spectateur** est visible. Code : `BR_<vue>_<pose>.png`.

Poses : `repos`, `avant`, `arriere`, `leve`, `horizontal`, `tenir`, `pointe`, `coucou`, `course_avant`, `course_arriere`, `menton`.

---

## Lot 6 — Calque JAMBES (les deux jambes ensemble, 92 images)

> **Prompt modèle :** Pars de l'image jointe `[BASE]` sans rien changer au corps. Ajoute **uniquement les deux jambes et les pieds** de Minuton, dans la position « **[POSE]** » : jambes très courtes, pieds jaunes ronds, contour prune, attachées sous le disque comme sur `M01_reference_complete.png`. Le corps ne bouge pas. Si la pose demande que le corps monte ou descende, je le gère moi-même : dessine seulement les jambes à leur place sous le corps. Pas de bras, pas de visage. PNG 1024 × 1024 transparent.

### Vue F (16 images)

Code : `JB_F_<pose>.png`.

| Pose | Description |
|---|---|
| `debout` | Pieds légèrement écartés (comme M01) |
| `joints` | Pieds serrés |
| `pointe` | Sur la pointe des pieds |
| `leve_G` | Jambe à gauche de l'image levée, genou plié |
| `leve_D` | Jambe à droite de l'image levée, genou plié |
| `saut_replie` | Les deux jambes repliées en l'air |
| `saut_ecarte` | Jambes écartées en étoile, en l'air |
| `reception` | Jambes fléchies et écartées (atterrissage) |
| `assis` | Assis par terre, jambes tendues devant, semelles visibles |
| `assis_tailleur` | Assis en tailleur |
| `vers_cam_1` à `vers_cam_6` | Marche vers le spectateur : 6 phases d'un cycle complet (pied à gauche de l'image en avant, passage, pied à droite de l'image en avant, passage…) |

### Vues 3G, 3D, PG et PD (19 poses × 4 vues = 76 images)

Code : `JB_<vue>_<pose>.png`.

| Pose | Description |
|---|---|
| `debout` | Debout, pieds tournés dans le sens du regard |
| `marche_1` à `marche_8` | Cycle de marche complet en 8 phases : contact, appui, passage, suspension, puis la même chose avec l'autre pied |
| `course_1` à `course_6` | Cycle de course en 6 phases, grandes enjambées, un temps où les deux pieds sont en l'air |
| `saut_impulsion` | Jambes fléchies prêtes à sauter |
| `saut_air` | Jambes repliées en l'air |
| `reception` | Atterrissage, jambes fléchies |
| `pointe` | Marche sur la pointe des pieds (discret) |

---

## Lot 7 — Poses complètes spéciales (33 images)

Ces poses font pencher, coucher ou plier tout le corps : elles ne peuvent pas se faire avec les calques. Elles se dessinent en **personnage entier**, sur un nouveau canevas 1024 × 1024 transparent, **cadran vide (sans visage)** : le studio ajoute ensuite les yeux et la bouche.

> **Prompt modèle :** Minuton entier dans la pose « **[POSE]** », conforme à `M01_reference_complete.png` et `03_Poses_actions_transparent.png` : même taille de disque que sur `B1_face_vierge.png` (le disque fait environ 60 % de la largeur du canevas), même style. **Cadran vide** : anneau orange seulement, sans yeux, sans bouche, sans joues, sans graduations. Vrai fond transparent, sans ombre au sol, aucun texte.

Code : `P_<pose>.png`.

| Pose | Description |
|---|---|
| `assis_face` | Assis par terre de face, jambes devant, mains posées au sol |
| `assis_3D` | Assis par terre, trois-quarts droite |
| `assis_3G` | Assis par terre, trois-quarts gauche |
| `adosse` | Assis, adossé (dos incliné en arrière), jambes devant |
| `allonge_dos` | Allongé sur le dos, cadran vers le ciel incliné vers le spectateur |
| `allonge_cote_D` | Couché sur le côté, tête vers la droite de l'image (sieste) |
| `allonge_cote_G` | Couché sur le côté, tête vers la gauche de l'image |
| `ventre` | À plat ventre, menton dans les mains, jambes relevées derrière |
| `accroupi` | Accroupi, ramassé sur lui-même |
| `penche_avant` | Penché en avant pour regarder par terre |
| `penche_arriere` | Penché en arrière pour regarder très haut |
| `etirement` | Bras tendus en l'air, sur la pointe des pieds, corps étiré |
| `chute_1` à `chute_4` | Glisse et tombe en arrière : déséquilibre, en l'air, impact, assis sonné |
| `roulade_1` à `roulade_6` | Roulade avant complète en 6 étapes |
| `danse_1` à `danse_6` | Petite danse joyeuse en 6 poses enchaînables |
| `cache` | Accroupi derrière ses mains, qui ne laisse dépasser que le haut du cadran |
| `porte_lourd` | Soulève un gros objet au-dessus de sa tête (objet non dessiné, mains prêtes) |
| `pousse` | Pousse quelque chose de lourd vers la droite de l'image |
| `tire` | Tire une corde vers la gauche de l'image |
| `calin` | Bras refermés comme pour serrer quelqu'un ou quelque chose |

---

## Lot 8 — Vues DOS complètes (6 images)

De dos, pas de visage. Base `B4_dos_vierge.png`, ajoute bras et jambes ensemble.

Codes : `DOS_debout.png`, `DOS_marche_1.png` à `DOS_marche_4.png` (il s'éloigne), `DOS_bras_leves.png`.

---

## Lot 9 — Nuage, le copain de Minuton (33 images)

Le petit nuage de l'épisode 3 : un nuage blanc tout rond et moelleux, contour prune, joues roses, petits yeux ovales prune avec reflet, petite bouche. Même style que Minuton. Fond transparent, 1024 × 1024, nuage centré, sur le même cadrage d'une image à l'autre.

1. **`N_base`** : le nuage, visage vide. C'est la base de tous les calques suivants.
2. **Calques visage** dessinés sur `N_base` sans la modifier (même méthode que Minuton) :
   - yeux : `N_Y_neutre`, `joie`, `rire`, `surprise`, `triste`, `fache`, `malice`, `sommeil`, `regard_gauche`, `regard_droite`, `regard_bas`, `ferme` ;
   - bouches : `N_B_sourire`, `joie`, `rire`, `petit_o`, `triste`, `moue`, `souffle` (joues gonflées qui soufflent).
3. **Variantes du corps :** `N_gris` (nuage d'orage gris, sans visage), `N_tout_petit` (version minuscule, même dessin), `N_etire_1` et `N_etire_2` (le nuage s'étire, pour l'animation), `N_ecrase` (écrasé comme un coussin).
4. **Pluie :** `N_pluie_1` à `N_pluie_4`, la pluie seule sous le nuage, 4 images pour l'animer en boucle (gouttes bleues stylisées, contour prune).
5. **Autres éléments :** `N_eclair` (petit éclair mignon), `N_arc` (petit arc-en-ciel qui sort du nuage).
6. **Vues :** `N_profil_G`, `N_profil_D`.

Les noms des calques visage sont à compléter comme pour Minuton : `N_Y_joie.png`, `N_B_rire.png`, etc.

---

## Lot 10 — Décors (10 lieux × 4 images + le premier plan du jardin = 41 images)

> **Prompt modèle :** Décor vide en illustration 2D pour dessin animé, format **vertical 9:16** (1080 × 1920 ou 941 × 1672), vue à hauteur d'enfant, style de `05_Reference_scene_originale.png`. **Aucun personnage**, aucun texte. **Sol dégagé** sur le tiers inférieur, rien au centre du sol. Lumière venant d'en haut à droite. Pour les extérieurs, ciel sans soleil ni lune ni étoiles marquées.

Pour chaque lieu :
1. `D_<lieu>_jour` ;
2. `D_<lieu>_coucher` : exactement la même image au coucher du soleil ;
3. `D_<lieu>_nuit` : exactement la même image la nuit ;
4. `D_<lieu>_premierplan` : à partir de la version jour, garde seulement les éléments du tout premier plan (touffes d'herbe, feuillage, bord de table…) sur fond transparent, tout le reste effacé. Le studio s'en sert pour faire passer Minuton derrière, avec de la profondeur.

| Lieu | Description |
|---|---|
| `chambre` | La chambre de Minuton : lit, étagère, fenêtre, table basse, tapis |
| `bureau` | Coin bureau : table, chaise, pot à crayons, lampe, tableau en liège |
| `cuisine` | Plan de travail bas, fenêtre, étagères avec pots, carrelage |
| `salon` | Canapé, plante, télé éteinte, tapis rond |
| `parc` | Allée, banc, arbres, ciel ouvert |
| `foret` | Grands arbres, champignons, clairière |
| `plage` | Sable, mer à l'horizon, ciel ouvert |
| `rue` | Petite rue de village, façades colorées, trottoir large |
| `ecole` | Salle de classe : tableau, pupitres bas |
| `musique` | Petite salle de musique : instruments posés le long des murs |

Le jardin existe déjà (jour, coucher, nuit). Il ne lui manque que `D_jardin_premierplan`.

---

## Lot 11 — Accessoires (67 images)

> **Prompt modèle :** Objet seul en illustration 2D dans le style de Minuton (contours prune foncé, couleurs chaleureuses, ombres douces), **vrai fond transparent**, centré, **taille adaptée à une main de Minuton** (ni trop grand ni trop petit par rapport à `M01_reference_complete.png`), sans ombre portée, aucun texte.

Code : `A_<objet>.png`.

- **Dessin :** `crayon_violet`, `crayon_orange`, `crayon_bleu`, `pot_crayons`, `feuille_blanche`, `feuille_dessin_coeur`, `carnet`, `pinceau`, `palette`, `chevalet`, `gomme`.
- **Écriture et lecture :** `livre_ferme`, `livre_ouvert`, `stylo`, `lettre`, `enveloppe`.
- **Musique :** `ukulele`, `tambourin`, `xylophone`, `maracas`, `micro`, `note_musique` (grosse note dessinée).
- **Cuisine :** `casserole`, `poele`, `crepe`, `fouet`, `bol`, `cuillere_bois`, `tablier`, `toque`, `cookie`, `gateau`.
- **Sport :** `ballon`, `corde_a_sauter`, `frisbee`, `velo_petit`, `haltere_mignon`, `tapis_yoga`.
- **Jardin :** `arrosoir`, `pot_vide`, `pelle`, `graine`, `fleur`, `papillon_1` et `papillon_2` (deux battements d'ailes).
- **Maison :** `tablette_allumee`, `tablette_eteinte`, `telephone_allume`, `telephone_eteint`, `lampe_allumee`, `lampe_eteinte`, `coussin`, `couverture`, `reveil`, `tasse`, `chaise`, `table_basse`.
- **Fête et jeu :** `ballon_baudruche`, `cadeau`, `confettis` (un tas), `cerf_volant`, `parapluie_ouvert`, `parapluie_ferme`, `etoile_doree`, `coeur_papier`, `avion_papier`, `bulle_savon`.

---

## Lot 12 — Effets dessinés (30 images)

Ces effets sont dans le style de Minuton : contour prune, couleurs douces. Fond transparent, centrés, 1024 × 1024. Code : `FX_<effet>.png`.

- **Éclaboussure :** `eclabousse_1` à `eclabousse_4`, une éclaboussure d'eau qui jaillit puis retombe.
- **Poussière :** `poussiere_1` à `poussiere_3`, petit nuage de poussière qui s'étend.
- **Symboles :**
  - `etoile_scintille` et `coeur` ;
  - `note_1` et `note_2` ;
  - `zzz` (trois « z » dessinés : ce sont des formes, pas du texte) ;
  - `goutte_sueur` et `larme` ;
  - `ampoule_idee` (petite ampoule allumée) ;
  - `exclamation` et `interrogation` (gros symboles dessinés, sans texte autour) ;
  - `spirale_etourdi` et `vapeur` (petite fumée de colère mignonne).
- **Mouvement :** `lignes_vitesse` (traits de mouvement), `impact` (étoile d'impact cartoon).
- **Arc-en-ciel :** `arc_en_ciel`.
- **Météo :** `goutte_pluie` et `flocon`.
- **Ciel :** `soleil` (soleil mignon avec rayons, sans visage), `lune` (croissant doux), `etoile_ciel`, `nuage_fond_1` à `nuage_fond_3` (nuages de fond sans visage).

---

## Récapitulatif

| Lot | Contenu | Images | Priorité |
|---|---|---|---|
| 1 | Corps de face propre | 1 | ⭐⭐⭐ |
| 2 | Yeux et sourcils | 117 | ⭐⭐⭐ |
| 3 | Bouches | 85 | ⭐⭐⭐ |
| 4 | Joues | 10 | ⭐⭐⭐ |
| 5 | Bras | 154 | ⭐⭐⭐ |
| 6 | Jambes | 92 | ⭐⭐⭐ |
| 7 | Poses spéciales | 33 | ⭐⭐ |
| 8 | Dos | 6 | ⭐⭐ |
| 9 | Nuage | 33 | ⭐⭐ |
| 10 | Décors | 41 | ⭐⭐ |
| 11 | Accessoires | 67 | ⭐ |
| 12 | Effets | 30 | ⭐ |
| **Total** | | **669** | |

**Ordre conseillé :**
1. Lot 1, puis les **vues F** des lots 2 à 6 : c'est le Minuton de face au complet.
2. Envoie-les-moi : je les intègre et je te montre un test animé.
3. Si tout s'emboîte bien, les vues 3G et 3D, puis les profils.
4. Ensuite les lots 7 à 12, au fil des épisodes.

**Livraison :** un ZIP par lot, ou par vue pour les gros lots (par exemple « Lot 2 — vue F »), avec un petit fichier qui liste les codes livrés. Les codes doivent être exactement ceux de ce document.
