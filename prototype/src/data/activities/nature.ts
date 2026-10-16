import { definePassionActivities } from './define'

/* ============================================================================
 *  NATURE & EXPLORATION : randonnée, observation de la nature,
 *  voyage / découverte de lieux
 * ========================================================================== */

export const randonnee = definePassionActivities('randonnee', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Repérage de sentier', description: 'Trouve un sentier près de chez toi sur Visorando ou l’appli IGN Rando et note sa distance, son dénivelé et son point de vue.' },
    { duration: 15, level: 'debutant', title: 'Chemins jamais pris', description: 'Sors marcher 15 minutes en prenant à chaque fois la rue ou le chemin que tu n’as jamais emprunté.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Sommet de rêve', description: 'Regarde des photos d’un sommet que tu aimerais gravir un jour et note ce qu’il faudrait pour y aller.' },
    { duration: 15, title: 'Marche lente au vert', description: 'Marche lentement 15 minutes dans un parc ou un espace vert, en respirant par le nez.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'La balade qui a fait du bien', description: 'Retrouve la photo d’une balade qui t’a fait du bien et écris 3 lignes sur ce jour-là.' },
    { duration: 15, title: 'Vers la lumière', description: 'Sors marcher 15 minutes en plein jour, en direction du point le plus haut ou le plus dégagé du coin.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Le toit de ta région', description: 'Trouve sur une carte le point culminant de ta région et note comment on peut y monter.' },
    { duration: 15, level: 'debutant', title: 'Pile ou face', description: 'Pars marcher et lance une pièce à chaque carrefour (pile à gauche, face à droite). Demi-tour au bout de 7 minutes.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Marche consciente', description: 'Marche 5 minutes très lentement en sentant chaque pas : le talon, la plante, les orteils.' },
    { duration: 30, title: 'Boucle silencieuse', description: 'Fais une boucle de 30 minutes dans un parc ou sur un chemin, sans musique, avec un arrêt d’une minute pour écouter.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Le sac idéal', description: 'Liste (ou prépare) le sac d’une rando à la journée : eau, en-cas, couche chaude, petite trousse de secours.' },
    { duration: 15, title: 'Marche rythmée', description: 'Marche 15 minutes d’un bon pas en calant ta respiration : 4 pas en inspirant, 4 pas en expirant.' },
  ],
  defouler: [
    { duration: 5, title: 'Montée express', description: 'Trouve la plus grosse côte ou le plus long escalier du coin et monte-le d’un bon pas.' },
    { duration: 15, level: 'debutant', title: 'Grandes enjambées', description: 'Marche 15 minutes à grandes enjambées en balançant fort les bras, comme en marche nordique.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Camp de base', description: 'Dessine ta tâche comme une montagne : camp de base, étapes, sommet. Fais maintenant la première étape.' },
    { duration: 15, title: 'Aller-retour de déblocage', description: 'Marche 7 minutes jusqu’à un point précis et reviens : à l’aller tu râles, au retour tu prépares ta première étape.' },
  ],
  curiosite: [
    { duration: 5, title: 'Lire les courbes de niveau', description: 'Apprends à lire une carte topographique : repère un sommet, un col et une vallée grâce aux courbes de niveau.' },
    { duration: 30, level: 'intermediaire', title: 'Préparer une vraie rando', description: 'Prépare une rando à la journée : itinéraire, horaires, météo, sac et plan B en cas de souci.' },
  ],
})

export const observationNature = definePassionActivities('observation-nature', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Chasse aux textures', description: 'Trouve 5 textures naturelles (écorce, mousse, pierre, feuille, plume) et décris chacune en un mot.' },
    { duration: 15, level: 'debutant', title: 'Bingo nature', description: 'Dessine un bingo de 9 cases (un oiseau, une fourmi, une fleur jaune…) et remplis-le pendant une petite sortie.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Regarder les nuages', description: 'Observe les nuages par la fenêtre pendant 5 minutes, trouve 3 formes, puis cherche leur vrai nom (cumulus, cirrus…).' },
    { duration: 15, title: 'Chants d’oiseaux', description: 'Ouvre la fenêtre ou sors, et identifie les chants autour de toi avec l’appli Merlin Bird ID.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Une chose vivante', description: 'Trouve une plante ou un petit animal près de toi et observe-le 5 minutes sans rien faire d’autre.' },
    { duration: 15, title: 'Petits trésors', description: 'Ramasse 3 trésors naturels (feuille, caillou, graine) lors d’une courte sortie et dispose-les sur ton bureau.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Une lettre, une espèce', description: 'Choisis une lettre au hasard, trouve un animal ou une plante de ta région qui commence par elle et lis 3 infos à son sujet.' },
    { duration: 15, level: 'debutant', title: 'Carnet de terrain', description: 'Commence un carnet de terrain : date, météo, lieu, et une première observation dessinée ou écrite.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Le carré de sol', description: 'Observe un carré de sol de 30 cm pendant 5 minutes et note tout ce qui bouge ou pousse.' },
    { duration: 30, title: 'À l’affût', description: 'Installe-toi dans un parc ou près d’une fenêtre, immobile pendant 20 minutes, et note chaque animal qui passe.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: '5 - 4 - 3', description: 'Près d’une plante ou d’un arbre, nomme 5 choses que tu vois, 4 que tu entends, 3 que tu peux toucher.' },
    { duration: 15, title: 'Les arbres de ta rue', description: 'Pendant une courte marche, identifie 3 arbres de ta rue avec une appli comme Pl@ntNet.' },
  ],
  defouler: [
    { duration: 5, title: 'Course aux feuilles', description: 'Sors et ramasse en 5 minutes des feuilles de 5 formes différentes, en courant d’un arbre à l’autre.' },
    { duration: 15, level: 'debutant', title: 'Parcours de parc', description: 'Dans un parc, fais un parcours en sautant les racines, en longeant les bordures et en escaladant les petits rochers, sans prendre de risque.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Pause fenêtre', description: 'Observe par la fenêtre pendant 5 minutes en notant 3 choses vivantes, puis retourne à ta tâche l’esprit rafraîchi.' },
    { duration: 15, title: 'Science participative', description: 'Poste une observation sur iNaturalist ou participe à un protocole de Vigie-Nature : tu aides de vrais chercheurs.' },
  ],
  curiosite: [
    { duration: 5, title: 'Traces et indices', description: 'Apprends à reconnaître 3 indices de présence animale (empreintes, plumes, restes de repas) en images.' },
    { duration: 30, level: 'intermediaire', title: 'Dix espèces', description: 'Pendant 30 minutes dehors, identifie 10 espèces différentes (plantes, oiseaux, insectes) avec iNaturalist.' },
  ],
})

export const voyage = definePassionActivities('voyage', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Street View au hasard', description: 'Atterris quelque part au hasard sur Google Street View et devine le pays grâce aux panneaux, aux plaques et aux voitures.' },
    { duration: 15, title: 'Radios du monde', description: 'Sur Radio Garden, écoute des radios de 3 pays différents et note ce que tu entends.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Carte postale de rêve', description: 'Choisis un lieu où tu aimerais être en ce moment et écris la carte postale que tu enverrais de là-bas.' },
    { duration: 15, title: 'Musée depuis le canapé', description: 'Fais une visite virtuelle à 360° d’un musée ou d’une ville et note un détail qui t’a plu.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Là où j’étais bien', description: 'Retrouve la photo d’un endroit que tu as aimé et note ce que tu y as ressenti.' },
    { duration: 15, title: 'Dix lieux', description: 'Écris la liste des 10 lieux que tu veux voir un jour, avec pour chacun la première chose que tu y ferais.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Le globe au hasard', description: 'Fais tourner un globe virtuel, arrête-toi au hasard et trouve 3 infos sur ce lieu : langue, plat, paysage.' },
    { duration: 15, level: 'debutant', title: 'Carnet de voyage imaginaire', description: 'Écris une page de carnet de voyage d’un lieu où tu n’es jamais allé·e, en t’appuyant sur des photos.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Fenêtre sur le monde', description: 'Regarde pendant 5 minutes une webcam en direct d’un lieu lointain : un port, une montagne, une plage.' },
    { duration: 30, title: 'Itinéraire rêvé', description: 'Prépare un itinéraire de 3 jours dans une ville qui te fait rêver : lieux, trajets, repas et budget.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Le lieu refuge', description: 'Ferme les yeux, visualise un vrai lieu où tu t’es senti·e bien et décris à voix basse ce que tu vois, entends et sens.' },
    { duration: 15, title: 'Carte de mémoire', description: 'Dessine de mémoire la carte de ton quartier avec tes lieux préférés, puis compare avec une vraie carte.' },
  ],
  defouler: [
    { duration: 5, title: 'Quiz chronométré', description: 'Fais un quiz de capitales ou de drapeaux chronométré et bats ton score.' },
    { duration: 15, level: 'debutant', title: 'Exploration express', description: 'Sors et va d’un bon pas jusqu’à un endroit tout proche où tu n’es jamais allé·e, puis reviens.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Destination-récompense', description: 'Choisis un lieu près de chez toi (un parc, un point de vue, un café) où tu iras une fois ta tâche finie.' },
    { duration: 15, title: 'Guide de ton quartier', description: 'Écris un mini-guide de ton quartier pour un touriste : 3 lieux, 1 bon plan, 1 secret. Puis retourne à ta tâche.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Trois mots d’ailleurs', description: 'Apprends à dire bonjour, merci et au revoir dans une langue que tu ne connais pas du tout.' },
    { duration: 30, title: 'L’histoire de ta rue', description: 'Cherche d’où vient le nom de ta rue ou de ta ville et l’histoire d’un bâtiment ancien proche, puis va le voir.' },
  ],
})
