# Répertoire de piano du domaine public

Les six articles ci-dessous proposent des **extraits guidés et des adaptations monodiques Scroll-up**, et non la partition intégrale ni un enregistrement de concert. Les notes ont été transcrites et adaptées pour le clavier de l'application, indépendamment d'arrangements contemporains. Les aperçus audio sont synthétisés par `promo/ambiances/classics.mjs` à partir de ces notes : aucun enregistrement d'interprète ou fichier MIDI tiers n'est réutilisé.

| Article | Composition d'origine | Source historique consultable |
| --- | --- | --- |
| Lettre à Élise | Beethoven, WoO 59 (1810, publié en 1867) | https://imslp.org/wiki/F%C3%BCr_Elise%2C_WoO_59_(Beethoven%2C_Ludwig_van) |
| Ode à la joie | Beethoven, Symphonie nº 9, Op. 125 (1824) | https://imslp.org/wiki/Symphony_No.9%2C_Op.125_(Beethoven%2C_Ludwig_van) |
| Sonate au clair de lune | Beethoven, Op. 27 nº 2 (1801, publié en 1802) | https://imslp.org/wiki/Piano_Sonata_No.14%2C_Op.27_No.2_(Beethoven%2C_Ludwig_van) |
| Canon de Pachelbel | Pachelbel, Canon en ré majeur, P. 37 | https://imslp.org/wiki/Canon_and_Gigue_in_D_major%2C_P.37_(Pachelbel%2C_Johann) |
| Prélude en do majeur | Bach, BWV 846, Le Clavier bien tempéré (1722) | https://imslp.org/wiki/Prelude_and_Fugue_in_C_major%2C_BWV_846_(Bach%2C_Johann_Sebastian) |
| Gymnopédie nº 1 | Satie, première Gymnopédie (1888) | https://imslp.org/wiki/3_Gymnop%C3%A9dies_(Satie%2C_Erik) |

Les compositions et éditions anciennes identifiées comme « Public Domain » sont les références ; les éditions récentes, arrangements tiers et performances ont leurs propres droits et ne sont pas repris. Les données de jeu sont dans `shared/src/pianoClassics.ts` et restent délivrées par l'API de piano après achat.

## Crédit de test

Le bouton de la boutique accorde **10 000 Minutons supplémentaires** au compte administrateur authentifié. Le serveur contrôle le rôle via `ADMIN_IDS` ou les administrateurs déjà enregistrés par `/admin`, fixe le montant et marque le crédit comme reçu par une mise à jour conditionnelle unique. Une requête répétée ne le redonne pas. Il ne crée aucune activité ni aucun point de progression : seul le portefeuille de boutique est augmenté.
