# MINUTON — ARTSET DE RÉFÉRENCE

Créé pour les histoires illustrées de Scroll-up. Ce dossier sert à écrire des scènes cohérentes et à préparer leurs prompts d'images.

## Comment utiliser ce dossier

Transmets les quatre planches PNG à Claude avec ce guide. Pour une nouvelle scène, joins aussi la référence de Minuton la plus proche du cadrage recherché. Les planches sont des références visuelles, pas un personnage articulé prêt à animer.

Fichiers :
- 01_Modele_vues.png : six vues du personnage, grille 3 colonnes × 2 lignes.
- 02_Expressions.png : douze expressions, grille 4 colonnes × 3 lignes.
- 03_Poses_actions_transparent.png : neuf poses, grille 3 colonnes × 3 lignes, canal alpha.
- 04_Minuton_base_transparent.png : personnage isolé en pose neutre, canal alpha.
- 05_Reference_scene_originale.png : référence du visage et du rendu de nos scènes précédentes.
- Palette.json : repères de couleur indicatifs ; les images restent la référence.

## Identité à préserver

Minuton est un petit chronomètre vivant. Le disque rond EST son corps et son visage : pas de tête séparée, pas de torse humain. Sa silhouette est compacte, avec de très courtes jambes, de petits pieds jaunes arrondis et des bras jaunes courts. Le visage comporte de grands yeux violets brillants, des reflets blancs, des joues pêche et une petite bouche prune expressive. Il n'a pas de nez.

La couronne supérieure est orange et striée. Le bouton latéral apparaît en haut à droite sur la vue de face. Conserver son implantation sur le boîtier lorsque le personnage tourne ; ne pas inverser arbitrairement les accessoires. Le dos est celui d'un boîtier doré, sans deuxième visage. Les vues de profil et de dos de cette planche étendent la référence frontale existante pour ce dossier.

Le style est une illustration 2D chaleureuse : contours prune foncé assez épais, formes simples, ombres douces et légers dégradés. Garder le visage de la référence originale ; ne pas le transformer en rendu 3D, en humain ou en mascotte longiligne. Les mains restent simples et arrondies. Le nombre de petits doigts peut varier sur les dessins générés : les harmoniser lors d'un travail d'animation détaillé.

## Expressions — ordre ligne par ligne

1. Neutre ; joie ; rire ; surprise.
2. Curiosité ; idée ; concentration ; déception.
3. Inquiétude ; soulagement ; sommeil ; malice.

Les portraits sont volontairement recadrés sous le visage. Ils servent de référence faciale, pas de personnages complets à poser directement dans une scène. La concentration doit rester lisible sans rendre Minuton agressif.

## Poses — ordre ligne par ligne

1. Saluer ; réfléchir ; avoir une idée.
2. Courir ; réagir avec surprise ; célébrer.
3. Dessiner ; offrir un cœur en papier violet ; dormir.

Les poses sont regroupées sur une seule planche transparente. Elles ne sont pas des images successives d'un même mouvement et ne sont pas fournies en calques articulés. Pour une course fluide, demander plusieurs étapes cohérentes à partir de la pose de course : contact, appui, passage, suspension. Ne pas faire défiler les neuf cases comme une animation.

## Règles pour les histoires destinées aux enfants

Histoires courtes, douces et lisibles sans paroles. Faire porter la compréhension par le regard, les gestes, l'action et les réactions. Minuton est curieux, créatif, bienveillant et parfois surpris. Son humour repose sur de petites maladresses ou des objets malicieux. Les émotions négatives restent légères et sont résolues avec douceur.

Un plan doit porter une action principale claire. Garder l'objet important assez grand à l'écran. Respecter les raccords : main qui tient le crayon, position des objets, direction du mouvement et emplacement du personnage. Prévoir les poses intermédiaires nécessaires au lieu de demander uniquement un début et une fin très éloignés.

Pas de dialogue ni de narration par défaut. Bruitages doux et synchronisés ; pas de cri, de flash ou de sursaut agressif. Éviter les textes indispensables à la compréhension.

## Consigne prête à transmettre à Claude

Utilise les images de ce dossier comme référence visuelle de Minuton. Écris une histoire courte pour enfants, compréhensible sans paroles. Découpe-la en plans avec une seule action principale par plan. Pour chaque plan, fournis la durée indicative, le décor, le cadrage, la position de Minuton, son expression, les objets et les mains qui les tiennent, l'action de départ et d'arrivée, les bruitages, et les raccords avec le plan suivant. Ajoute les poses intermédiaires à générer si un mouvement le demande. Ne redessine pas son identité : garde le corps rond de chronomètre, les grands yeux violets, la couronne orange et les proportions compactes du dossier. Le texte de tes scènes sera ensuite utilisé ici pour générer les images.

## Base de prompt d'image

Illustration 2D de Minuton conforme aux références jointes : chronomètre jaune rond et compact, visage intégré au disque, grands yeux violets à reflets blancs, joues pêche, couronne orange striée, petit bouton latéral, contours prune foncé. Bras et jambes très courts. Même visage et proportions que la référence. [DÉCOR]. [CADRAGE]. [ACTION PRINCIPALE]. [EXPRESSION]. [POSITION DES MAINS ET OBJETS]. Lumière douce, couleurs chaleureuses, lisible pour les enfants, aucun texte ni bulle. Préserver les raccords avec [PLAN PRÉCÉDENT].

## Fabrication des références

Images créées avec l'outil intégré de génération d'images à partir de la scène originale de Minuton. Prompts de production :
1. Planche de modèle : six vues complètes de même taille sur fond ivoire, face, trois-quarts gauche, profil gauche, dos, trois-quarts droit, profil droit ; corps disque compact, jambes courtes, identité originale.
2. Expressions : douze portraits de même taille en grille 4 × 3 sur ivoire, expressions listées ci-dessus, même visage original.
3. Actions : neuf poses complètes séparées en grille 3 × 3, vrai fond transparent, actions listées ci-dessus, aucun texte.
4. Base : une seule pose frontale neutre, silhouette entière sur fond transparent, anatomie de la vue de face et visage original.

Les planches générées présentent de petites variations de dessin. Pour une production image par image, utiliser la pose neutre et la référence originale comme priorité, puis harmoniser les détails entre les images.
