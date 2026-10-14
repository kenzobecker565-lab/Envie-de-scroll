# Atelier vivant — dessin V2

Développement uniquement, sans modification de `v1-test`.

- 135 briefs : 15 par durée (5/15/30 min) et par style (réaliste/manga/cartoon).
- Trois propositions variées ; les inédites passent avant les activités terminées. Rafraîchir renouvelle les propositions. Le catalogue des quinze reste accessible.
- Papier ou feuille de dessin existante dans l'app. Le chrono est facultatif, peut être mis en pause et ne bloque jamais la fin.
- Photo, titre et note facultatifs. Les notes et titres sont conservés avec ou sans photo. Les dessins s'ouvrent en entier dans le carnet privé.
- Les récompenses des nouveaux défis dessin sont plafonnées aux minutes écoulées côté serveur et à la durée choisie. Le niveau représente la pratique, pas la qualité.
- Objectifs locaux 6/12/30/60 dessins ; quatre couvertures débloquées à 0/6/15/30 réalisations. Style, objectif et couverture sont des préférences par compte sur cet appareil.
- Les anciennes activités, photos, textes et parcours restent lisibles.

Les durées sont des estimations à valider avec les testeurs, matériel prêt. Les illustrations sont des inspirations libres : les détails ne sont pas des objectifs de finition. Les silhouettes et portraits plus avancés sont signalés « Quelques bases utiles ».

## Images

Trois atlases originaux créés avec ImageGen, format 5 colonnes × 9 lignes : quinze sujets par durée, row-major. Consignes issues du catalogue validé. Papier crème, graphite ; contour simplifié pour cinq minutes, quelques détails pour quinze, petite composition pour trente. Export WebP pour réduire le poids à environ 900 Ko pour les trois styles au total. Ce sont des inspirations, jamais de fausses créations attribuées à l'utilisateur.

## Vérification

Tests partagés : unicité, 15 briefs par groupe, durée des phases, renouvellement, préférence aux inédites. Tests API : filtres, choix explicitement validé, preuve facultative, titre/note avec une photo, confidentialité, crédits plafonnés et protection contre les doubles validations. Workflow mobile : parcours réel dans Chromium, largeurs 320/390/430, chrono en pause, sauvegarde avec et sans photo, canvas et lecture du carnet.
