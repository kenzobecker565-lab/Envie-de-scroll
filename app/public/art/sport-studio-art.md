# Illustrations Sport — Studio en mouvement

Illustrations créées avec l’outil intégré de génération d’images, puis encodées en WebP sans modifier leurs dimensions. Elles suivent le style 2 validé pour Scroll-up. Les fichiers existants de Minuton restent inchangés.

## Fichiers intégrés

- `app/public/art/sport-studio-standing.webp` : grille 4 × 4, huit paires de positions debout, 1254 × 1254 pixels.
- `app/public/art/sport-studio-floor.webp` : grille 4 × 3, cinq paires au sol et une variante facile du bird dog, 1448 × 1086 pixels.

Les cellules sont affichées par le composant `SportFigure`. Les positions droites sont affichées en miroir. La marche utilise le départ debout puis le genou levé. Les démonstrations alternent deux positions ; elles ne constituent pas une capture vidéo ni une vérification automatique de la posture. Les consignes écrites, les variantes et les pauses restent disponibles.

## Prompts de création

Debout : atlas carré, exactement quatre colonnes et quatre lignes de cellules égales. Illustration éditoriale 2D d’adultes naturels, contours prune fins, haut crème, short ou legging violet, chaussures blanches, peau chaude, fond blanc. Pas de texte, d’interface, de Minuton, de rendu 3D ni de membres supplémentaires. Paires dans cet ordre : debout/squat ; fente debout/fente fléchie ; pompe au mur bras tendus/bras fléchis ; talons posés/relevés ; marche ; pas de côté ; élévation latérale près d’un mur ; préparation des épaules. Personnage et tenue identiques dans chaque paire, silhouette entière et marges suffisantes dans chaque cellule.

Au sol : conserver le même style. Atlas de quatre colonnes et trois lignes, cellules carrées égales. Paires : pompes sur les genoux bras tendus/fléchis ; gainage sur avant-bras et genoux ; pont fessier départ/bassin levé ; bird dog à quatre pattes/bras et jambe opposés tendus ; gainage latéral sur avant-bras et genoux fléchis ; variante facile du bird dog avec une main soulevée. Genoux réellement posés pour les versions adaptées, appuis lisibles, deux bras et deux jambes par adulte. Fond blanc, aucun texte ni cadre.

Correction debout : conserver l’atlas et les quatorze autres cellules. Dans la troisième ligne, deuxième colonne, varier les membres de la marche sans retourner le personnage. Dans la quatrième ligne, deuxième colonne, réduire l’élévation latérale à une petite amplitude, torse droit et main au mur. La représentation retenue de la marche associe finalement une position debout et le genou levé, pour conserver la même orientation.
