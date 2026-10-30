# Plan « La pile » — dessins complémentaires pour plus de fluidité

J'ai mesuré, entre chaque paire de dessins, de combien de pixels les personnages se déplacent. Au-delà d'environ 60 px, l'œil voit un saut au lieu d'un mouvement. Il manque alors un **intervalle**, c'est-à-dire un dessin entre les deux.

Sur une partie de ces paires, j'ai essayé de calculer les intervalles automatiquement : sur tes dessins, ça déforme les personnages (le pot fond, la pile se brouille). Les vrais animateurs dessinent ces intervalles à la main, et c'est ce que je te demande ici : **17 dessins**.

Même méthode que la première vague :
- partir du dessin indiqué, sans toucher au décor ;
- joindre aussi le dessin d'arrivée ;
- PNG 941 × 1672 ;
- **plusieurs petits ZIP, ou les PNG directement** : la vague 2 était arrivée coupée.

> **Prompt modèle :** Pars de l'image jointe **[DÉPART]**. Garde strictement identiques le décor, le cadrage, la lumière et le dessin des personnages et des objets. Dessine la position **intermédiaire** entre [DÉPART] et [ARRIVÉE] (jointe aussi), à **[x] %** du mouvement : **[CONSIGNE]**. Même style, 941 × 1672, aucun texte.

## 1. Les deux dessins perdus (à renvoyer)

| Code | Consigne |
|---|---|
| `E01` | Ceux de la première vague : la pile penche de 5° vers la gauche. |
| `E02` | Ceux de la première vague : la pile penche de 8° vers la droite. |

## 2. Intervalles (le mouvement saute trop)

| Code | Départ → arrivée | Écart mesuré | Consigne (à 50 % sauf indication) |
|---|---|---|---|
| `A01b` | `A01` → `A02` | 104 px | Minuton à mi-pas, les deux pieds presque sous lui, le pot dans les bras, le corps légèrement plus haut (position de passage). |
| `B03b` | `P05_B` → `B04` | 65 px | Minuton recule d'un demi-pas en lâchant l'arrosoir, mains qui remontent vers sa poitrine. |
| `D01b` | `D01` → `D02` | 82 px | Il pousse sur ses jambes pour monter sur le pot, un pied sur le bord, l'autre en l'air. |
| `D02b` | `D02` → `D03` | 87 px | Il hisse un genou sur l'arrosoir, accroché des deux mains. |
| `D03b` | `D03` → `D04` | 73 px | Il se relève sur le seau, encore accroupi, bras qui commencent à s'écarter. |
| `D04b` | `D04` → `P05_D` | 115 px | Debout sur le seau, il commence à lever les bras vers le nid, l'oisillon se dresse sur sa couronne. |
| `E04b` | `E04` → `P05_E` | 100 px | La pile penche à mi-chemin entre les deux (environ 25°), Minuton tend les bras de l'autre côté pour se rattraper. |
| `E05b` | `P05_E` → `E06` | 87 px | La pile commence tout juste à se séparer : le seau glisse, Minuton décolle à peine, les yeux qui s'agrandissent. |
| `F00` | `E06` → `F01` | 113 px | Tout le monde tombe, à mi-hauteur entre les deux dessins. |
| `F02b` | `F02` → `P05_F` | 69 px | Minuton commence à rebondir sur le dos (moins aplati), l'oisillon décolle de son ventre. |
| `G02` | `G01` → `P05_G` | 58 px | Minuton presque assis, l'oisillon qui glisse sur sa tête. |

## 3. Poses tenues « vivantes »

Un dessin qui reste plus d'une demi-seconde à l'écran paraît figé. Les animateurs ajoutent un second dessin presque identique, avec un tout petit changement (un clignement, une respiration), pour faire une « pose tenue vivante ».

| Code | Départ | Consigne |
|---|---|---|
| `A05b` | `A05` | Même image, Minuton cligne des yeux (yeux fermés en petit arc), toujours fier. |
| `P05_Db` | `P05_D` | Même image, Minuton s'étire encore un tout petit peu plus vers le nid, la pile a très légèrement penché. |
| `F06b` | `F06` | Même image, Minuton cligne lentement des yeux, sonné ; l'oisillon secoue la tête. |
| `G04b` | `G04` | Même image, les étoiles ont encore tourné d'un quart de tour ; Minuton penche la tête de l'autre côté. |

---

**Total : 17 dessins** (2 à renvoyer + 11 intervalles + 4 poses vivantes).

Avec eux, le plan passera de 34 à 51 dessins pour 9 s. Les moments d'action seront presque tous à 12 dessins par seconde, ou plus pour la chute.
