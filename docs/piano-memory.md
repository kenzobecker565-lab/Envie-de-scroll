# Piano débutant et mémorisation

## Parcours intégré

Les séances classiques de piano passent par PianoPractice : découverte guidée, deuxième passage guidé, première note seule, rappel sans indication. Les séances de 15 et 30 minutes ajoutent un rappel par phrase. À 30 minutes, des raccords cumulatifs s’ajoutent. L’extrait complet est ensuite tenté deux fois sans guidage.

Une erreur ou le recours à l’aide empêche de compter la tentative comme un rappel réussi. Le clavier en grand écran respecte aussi le retrait des indications. La sauvegarde locale conserve la dernière étape atteinte ; une étape interrompue recommence. Les anciennes sauvegardes du clavier ne permettent pas de sauter le nouveau parcours.

Le bouton de fin attend le temps choisi et au moins une note jouée. Le titre conservé distingue « Séance de pratique » et « Notes rejouées sans aide ». Ce dernier état décrit le rappel des hauteurs pendant la séance, pas une évaluation du rythme ni une maîtrise durable.

Les leçons et anciens parcours gardent leur fonctionnement propre.

## Catalogue jouable du domaine public

Les activités sont définies dans `shared/src/pianoFree.ts`. Chaque extrait dispose de notes, de durées en pulsations, de conseils et d’une source. Le piano de l’application synthétise lui-même les sons. Les extraits sont des adaptations monodiques courtes, pas les œuvres complètes.

| Durée | Activité | Passage |
| --- | --- | --- |
| 5 min | French Cancan — Offenbach | Boucle du galop |
| 5 min | Korobeiniki — traditionnel | Premier motif de l’air traditionnel |
| 5 min | Dans l’antre du roi de la montagne — Grieg | Premier motif, transposé |
| 15 min | Habanera de Carmen — Bizet | Deux phrases descendantes |
| 15 min | Gymnopédie nº 1 — Satie | Première entrée mélodique, transposée |
| 15 min | Lettre à Élise — Beethoven | Motif et réponse |
| 30 min | French Cancan — Offenbach | Quatre phrases du thème |
| 30 min | Lettre à Élise — Beethoven | Quatre phrases du premier thème |
| 30 min | Canon de Pachelbel | Quatre phrases de la mélodie |

`activitiesFor('piano', duration)` propose trois activités. `getActivity` et `keyboardMelody` continuent à résoudre les quinze anciens identifiants pour les sessions ouvertes et les créations enregistrées. La collection piano recense neuf activités actuelles ; les XP et les créations historiques ne sont pas effacés. Les anciens titres pop préparés comme métadonnées ont été remplacés par le catalogue jouable.

## Sources des compositions

- Offenbach : https://imslp.org/wiki/Orph%C3%A9e_aux_enfers_(Offenbach,_Jacques) — éditions historiques signalées dans le domaine public.
- Korobeiniki : https://commons.wikimedia.org/wiki/File:Korobeiniki.svg — relevé de l’air traditionnel, fiche indiquant le domaine public. Notre extrait ne reprend ni la bande-son ni l’arrangement du jeu Tetris.
- Grieg : https://www.mutopiaproject.org/ftp/GriegE/O46/Dans_l_antre_du_roi_de_la_montagne/Dans_l_antre_du_roi_de_la_montagne-let.pdf — édition Mutopia placée dans le domaine public.
- Bizet : https://imslp.org/wiki/Carmen_(Bizet,_Georges) — Habanera, édition historique Choudens.
- Satie : https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=37 — saisie Evin Robertson, source Dover reproduisant l’œuvre ancienne, placée dans le domaine public.
- Beethoven : https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=931 — saisie Stelios Samelis, source Breitkopf & Härtel 1888, placée dans le domaine public.
- Pachelbel : https://imslp.org/wiki/Canon_and_Gigue_in_D_major,_P.37_(Pachelbel,_Johann) — composition ancienne, adaptation monodique du thème déjà présent dans Scroll-up.

## Validation

Les tests vérifient la résolution de chaque identifiant, les neuf propositions dans le moteur, le nombre de pulsations, les notes valides, la place de toutes les étapes sur le clavier et la compatibilité avec les anciens identifiants. L’évaluation du rythme joué et la rétention à plusieurs jours restent à construire. Un essai sur téléphone et une validation musicale à l’oreille restent nécessaires avant de qualifier les adaptations de version finale pédagogique. Les niveaux intermédiaire et avancé restent à construire.
