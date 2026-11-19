# Recherche de nuit : comment rendre les vidéos plus visuelles et plus belles

*Pour « Affaire Classée ? » — 4 prototypes du même passage de 5 s (affaire n°5, voix ElevenLabs).*

## 1. Pourquoi la démo v3 (personnages réalistes) a échoué

- **Effet « jeu vidéo bas de gamme »** : des corps réalistes de super-héros, sans aucune animation du visage. Plus un personnage a l'air réel, plus on remarque ce qui manque (bouche, sourcils, paupières) : c'est la « vallée de l'étrange ».
- **Vêtements bricolés** : je dois les fabriquer par-dessus des corps musclés, et ça se voit.
- **Petit écran** : sur un téléphone, tout ce qui compte se joue en un coup d'œil. Un visage réaliste vu de loin ne transmet aucune émotion, alors qu'un visage dessiné et exagéré la montre tout de suite.

**Leçon** : pour du contenu court et vertical, il vaut mieux un style **assumé, graphique et lisible** qu'un réalisme raté.

## 2. Ce qui marche dans les vidéos verticales qui accrochent

- **Une émotion lisible à chaque plan** : de gros visages, des expressions exagérées, un contraste fort.
- **Du mouvement toutes les 1 à 2 secondes** : nouveau plan, zoom, mot qui claque, effet.
- **Des sous-titres et des mots-clés énormes**, mis en valeur (beaucoup regardent sans le son).
- **Un style constant et reconnaissable** : c'est l'identité du compte.
- **De 30 s à 1 min** pour ce genre d'histoires.

## 3. Ce que je sais faire, concrètement

Je fabrique tout en code, image par image. Je n'ai pas de carte graphique.

| Technique | Vitesse de rendu (5 s de vidéo) | Pour une vidéo de 1 min |
| --- | --- | --- |
| 2D vectoriel (SVG) : prototypes A, B, C | ~1 min 40 s | ~20 min |
| 3D (Three.js) : prototype D | ~3 min 20 s | ~40 min |

En 2D je vais **environ 2 fois plus vite** qu'en 3D (et jusqu'à 4 fois plus vite qu'avec les personnages réalistes de la v3). Je peux donc faire plus d'essais et de corrections pour le même temps.

## 4. Les 4 prototypes

### A. Motion design 2D (`flat/`)
Le style des chaînes de vulgarisation animée : des aplats de couleur, des ombres douces, des fonds avec effet de profondeur.
- **Personnages** dessinés en code : sourcils qui bougent, clignements, bouche synchronisée sur la voix, larme.
- **Effets** : électrocardiogramme qui se dessine sur « hôpital », poing levé puis frappé sur la table avec un éclat, transitions en formes.
- ➕ propre, lisible, rapide, facile à décliner.
- ➖ un peu « éducatif », moins dramatique.

### B. BD animée façon webtoon (`bd/`)
Une planche de BD verticale dans laquelle la caméra descend de case en case.
- **Personnages** : **Open Peeps** de Pablo Stanley, illustrations dessinées à la main sous licence CC0 (gratuites, usage commercial permis). Leurs 33 expressions servent à changer de visage comme on tourne les cases ; la bouche s'ouvre et se ferme au rythme de la voix.
- **Habillage** : bulles qui se remplissent mot à mot, trame de points pop-art, lignes de vitesse, onomatopée « BAM ! ».
- ➕ très expressif et original, adapté au format vertical, avec une vraie identité.
- ➖ style plus léger, presque humoristique.

### C. Noir cinématique (`noir/`)
L'ambiance d'un film policier, avec les mêmes personnages dessinés.
- **Lumière** : des stores vénitiens qui zèbrent les visages, une silhouette en contre-jour rouge.
- **Ambiance** : fumée, pluie, un électrocardiogramme au néon, de grandes lettres à empattements qui apparaissent dans un flou.
- ➕ le plus dramatique, colle parfaitement au thème « procès et faits divers ».
- ➖ plus sombre, donc moins lisible en tout petit.

### D. 3D cartoon soigné (`cartoon/`)
La démo v2, améliorée.
- **Profondeur de champ** : le fond du tribunal est rendu flou, comme filmé par une caméra de cinéma, et les personnages ressortent.
- **Image** : couleurs plus riches.
- ➕ reste en 3D, la continuité avec les affaires précédentes.
- ➖ rendu environ 2 fois plus long, personnages encore assez simples.

## 5. Ma recommandation

1. **C (noir)** si tu veux du drame et une identité forte de « dossier criminel ».
2. **B (webtoon)** si tu veux de l'expressivité et de la viralité. Les visages réagissent fort, et le format BD verticale est natif sur téléphone.
3. **Un mélange B + C** est possible : les cases et les bulles de la BD, éclairées comme un film noir (stores, contre-jour rouge). C'est sans doute ce qui aurait le plus de caractère.

Les styles 2D se rendent **en ~20 min pour une affaire d'une minute**, contre ~40 min en 3D.

## 6. Ce qui pourrait encore monter le niveau

- **Décors peints par une IA** (avec le connecteur ElevenLabs, abonnement payant) : de vrais fonds illustrés pour la BD ou le noir, à la place de mes fonds en formes simples. C'est le plus gros gain visuel possible.
- **Bruitages et musique ElevenLabs** : des sons réalistes (foule, sirène, coup de marteau) à la place de mes sons synthétisés.
- **D'autres personnages dessinés libres de droits**, pour varier les têtes d'une affaire à l'autre.

## Sources
- [Open Peeps — Pablo Stanley (CC0)](https://openpeeps.com) · [paquet npm @opeepsfun/open-peeps](https://github.com/opeepsfun/open-peeps)
- [Kurzgesagt (style « flat » animé)](https://fr.vikidia.org/wiki/Kurzgesagt)
- [Idées de formats true crime pour TikTok (2026)](https://fluxnote.io/guides/true-crime-tiktok-video-ideas)
