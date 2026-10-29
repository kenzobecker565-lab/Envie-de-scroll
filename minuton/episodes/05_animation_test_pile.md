# Épisode 5 animé — plan test : la pile (P5, 9 secondes)

**But :** passer de « diaporama » à **vraie animation**. Tes 7 images du plan P5 (`P05_A` à `P05_G`) deviennent les **images clés**. Tu génères les **images intermédiaires** entre elles : chaque petit changement de position est dessiné. Dans les moments d'action, on atteint **12 dessins par seconde**, comme une série d'animation TV. Dans les moments calmes, chaque dessin reste plus longtemps à l'écran.

**Pour ce plan :** 7 images clés existantes + **27 nouvelles images** = 34 dessins pour 9 s.

Si le résultat te plaît, je ferai la même liste pour les autres plans de l'épisode.

---

## La règle d'or : on ne redessine pas le décor

Toutes les images de ce plan doivent avoir **exactement le même décor, le même cadrage et la même lumière** que `P05_A`. Seuls Minuton, l'oisillon et les objets bougent. Si le décor tremble d'une image à l'autre, l'animation scintille.

> **Prompt modèle pour chaque nouvelle image :**
> Pars de l'image jointe **[IMAGE DE DÉPART]** et garde **strictement identiques** le décor (arbre, nid, barrière, herbe, ciel), le cadrage, la lumière, ainsi que le dessin de Minuton, de l'oisillon et des objets. Ne change **que** ce qui est décrit ici : **[CONSIGNE]**. Même style, même taille de personnages, même format 9:16 (941 × 1672). Aucun texte.
>
> Pour une **image intermédiaire**, joins aussi l'image d'arrivée et ajoute : « C'est une position intermédiaire entre l'image de départ et l'image d'arrivée jointes, à environ **[x] %** du mouvement. »

**Méthode conseillée :**
- Si ChatGPT peut garder le décor fixe en ne redessinant que les personnages sur une copie de `P05_A` (comme pour les calques de la vue de face), c'est parfait.
- Sinon, génère chaque image en partant de **la précédente** dans l'ordre de la liste : c'est ce qui donne la meilleure continuité.

**Livraison :**
- format 941 × 1672 ;
- PNG ou JPEG de qualité 95 ;
- noms exacts du tableau ;
- un seul ZIP.

---

## Feuille d'exposition

« Durée » = temps d'affichage du dessin à l'écran.
- **CLÉ** = image que tu as déjà.
- **NOUVELLE** = image à générer.

### 1. Il apporte le pot (15,0 – 16,3 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 1 | `A01` | NOUVELLE | 0,17 s | `P05_A` | Le pot n'est pas encore au pied de l'arbre. Minuton arrive **par la droite de l'image**, le pot orange retourné serré dans ses bras contre son ventre. Il est à mi-chemin entre le bord droit et l'arbre, pied gauche en avant (pas de marche). L'oisillon, assis à gauche, le regarde. |
| 2 | `A02` | NOUVELLE | 0,17 s | `A01` | Même scène : Minuton a avancé d'un petit pas vers l'arbre, les deux pieds sous lui (position de passage), le corps un peu plus haut. |
| 3 | `A03` | NOUVELLE | 0,17 s | `A02` | Minuton est presque au pied de l'arbre, pied droit en avant, il se penche pour poser le pot. |
| 4 | `P05_A` | CLÉ | 0,35 s | — | (le pot est posé) |
| 5 | `A05` | NOUVELLE | 0,45 s | `P05_A` | Minuton se redresse, les mains sur les hanches, fier de lui, petit sourire. L'oisillon penche la tête, curieux. |

### 2. L'arrosoir (16,3 – 17,6 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 6 | `B01` | NOUVELLE | 0,25 s | `A05` | Minuton tient le petit arrosoir violet retourné à deux mains contre son ventre, à côté du pot. |
| 7 | `B02` | NOUVELLE | 0,25 s | `B01` | Il soulève l'arrosoir au-dessus du pot, sur la pointe des pieds, bras tendus vers le haut, la langue un peu tirée de concentration. |
| 8 | `P05_B` | CLÉ | 0,35 s | — | (l'arrosoir est posé sur le pot) |
| 9 | `B04` | NOUVELLE | 0,45 s | `P05_B` | Minuton se frotte les mains, content ; l'oisillon fait un petit saut d'enthousiasme. |

### 3. Le seau (17,6 – 18,9 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 10 | `C01` | NOUVELLE | 0,25 s | `B04` | Minuton tient le petit seau bleu retourné à deux mains contre son ventre, à côté de la pile pot + arrosoir. |
| 11 | `C02` | NOUVELLE | 0,25 s | `C01` | Sur la pointe des pieds, bras tendus au maximum, il pose le seau sur l'arrosoir ; ses joues sont rouges d'effort. |
| 12 | `P05_C` | CLÉ | 0,35 s | — | (le seau est posé, la pile est haute) |
| 13 | `C04` | NOUVELLE | 0,45 s | `P05_C` | Minuton lève les yeux vers le haut de la pile, puis vers le nid, satisfait. L'oisillon s'approche en sautillant. |

### 4. Il grimpe (18,9 – 20,1 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 14 | `D01` | NOUVELLE | 0,2 s | `C04` | Minuton prend l'oisillon et le pose sur sa couronne, puis agrippe le pot à deux mains, un pied posé sur le bord du pot. |
| 15 | `D02` | NOUVELLE | 0,2 s | `D01` | Il est monté sur le pot, accroché à l'arrosoir, l'oisillon toujours sur sa couronne. |
| 16 | `D03` | NOUVELLE | 0,2 s | `D02` | Il grimpe sur l'arrosoir, accroché au seau, un genou levé. |
| 17 | `D04` | NOUVELLE | 0,2 s | `D03` | Il se met debout sur le seau, bras écartés pour l'équilibre, un peu instable. |
| 18 | `P05_D` | CLÉ | 0,4 s | — | (en haut de la pile, bras tendus vers le nid, la pile commence à vaciller) |

### 5. Ça vacille ! (20,1 – 21,4 s) — 12 dessins par seconde

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 19 | `E01` | NOUVELLE | 0,12 s | `P05_D` | Toute la pile (pot, arrosoir, seau, avec Minuton et l'oisillon dessus) penche de **5° vers la gauche**. Minuton bat des bras, inquiet. |
| 20 | `E02` | NOUVELLE | 0,12 s | `E01` | La pile penche maintenant de **8° vers la droite**, Minuton bras dans l'autre sens, bouche en « o ». |
| 21 | `E03` | NOUVELLE | 0,12 s | `E02` | Penche de **12° vers la gauche**, Minuton sur un pied, l'oisillon s'agrippe à la couronne, plumes ébouriffées. |
| 22 | `E04` | NOUVELLE | 0,12 s | `E03` | Penche de **16° vers la droite**, Minuton bat des bras très vite (traits de mouvement autour des bras). |
| 23 | `P05_E` | CLÉ | 0,25 s | — | (la pile penche fortement) |
| 24 | `E06` | NOUVELLE | 0,15 s | `P05_E` | La pile se sépare : le seau, l'arrosoir et le pot commencent à glisser chacun de son côté. Minuton est suspendu en l'air au-dessus, bras et jambes écartés, yeux ronds ; l'oisillon décolle de sa couronne. |

### 6. Patatras ! (21,4 – 22,7 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 25 | `F01` | NOUVELLE | 0,12 s | `E06` | Tout tombe : Minuton en l'air à mi-hauteur, tombant en arrière, les objets en l'air à différentes hauteurs, l'oisillon au-dessus de lui. |
| 26 | `F02` | NOUVELLE | 0,12 s | `F01` | Impact : Minuton touche l'herbe sur le dos, tout **aplati** (écrasé comme un ballon), petit nuage d'herbe et de feuilles. Les objets touchent le sol autour de lui. |
| 27 | `P05_F` | CLÉ | 0,25 s | — | (sur le dos, l'oisillon rebondit sur son ventre) |
| 28 | `F04` | NOUVELLE | 0,15 s | `P05_F` | L'oisillon est en l'air au-dessus du ventre de Minuton (il vient de rebondir), les objets roulent un peu plus loin. |
| 29 | `F05` | NOUVELLE | 0,15 s | `F04` | L'oisillon retombe et se pose assis sur le ventre de Minuton ; les objets ralentissent. |
| 30 | `F06` | NOUVELLE | 0,5 s | `F05` | Tout est immobile : Minuton allongé sur le dos, sonné, l'oisillon assis sur son ventre, les objets arrêtés dans l'herbe. |

### 7. Étourdis (22,7 – 24,0 s)

| Ordre | Code | Type | Durée | Image de départ | Consigne |
|---|---|---|---|---|---|
| 31 | `G01` | NOUVELLE | 0,25 s | `F06` | Minuton se redresse en position assise, l'oisillon glisse de son ventre vers sa tête. |
| 32 | `P05_G` | CLÉ | 0,35 s | — | (assis, étourdi, étoiles autour de la tête, l'oisillon sur sa tête) |
| 33 | `G03` | NOUVELLE | 0,35 s | `P05_G` | Même image, mais les petites étoiles ont **tourné d'un quart de tour** autour de la tête ; Minuton penche un peu la tête de l'autre côté. |
| 34 | `G04` | NOUVELLE | 0,35 s | `G03` | Les étoiles ont encore tourné d'un quart de tour ; l'oisillon penche de l'autre côté sur la tête de Minuton. |

---

## Récapitulatif

| Section | Nouvelles images |
|---|---|
| 1. Le pot | 4 (`A01`, `A02`, `A03`, `A05`) |
| 2. L'arrosoir | 3 (`B01`, `B02`, `B04`) |
| 3. Le seau | 3 (`C01`, `C02`, `C04`) |
| 4. Il grimpe | 4 (`D01` à `D04`) |
| 5. Ça vacille | 5 (`E01` à `E04`, `E06`) |
| 6. Patatras | 5 (`F01`, `F02`, `F04`, `F05`, `F06`) |
| 7. Étourdis | 3 (`G01`, `G03`, `G04`) |
| **Total** | **27 nouvelles images** + 7 clés existantes |

Au montage, j'ajoute :
- un mouvement de caméra très léger ;
- une secousse à l'impact ;
- un écrasement rapide au moment où Minuton touche le sol ;
- un bruitage calé sur chaque dessin (chaque « tok », grincement, chute et rebond).

Si l'animation du plan test te plaît, je prépare la même feuille d'exposition pour les 10 autres plans.
