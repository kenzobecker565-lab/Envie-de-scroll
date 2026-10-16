import { definePassionActivities } from './define'

/* ============================================================================
 *  CORPS & MOUVEMENT : danse, sport, théâtre, arts martiaux
 *  (Toutes les activités se font sans matériel ou avec des objets du quotidien.
 *  Écoute ton corps : on adapte, on ne force jamais sur une douleur.)
 * ========================================================================== */

export const sport = definePassionActivities('sport', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Défi des 100', description: 'Fais 100 mouvements au total, répartis comme tu veux entre squats, pompes (même sur les genoux) et jumping jacks.' },
    { duration: 5, level: 'debutant', title: 'Jongles de chaussettes', description: 'Roule une paire de chaussettes en boule et fais le plus de jongles possible avec les pieds et les genoux. Bats ton record.' },
    { duration: 15, title: 'Parcours de couloir', description: 'Construis un parcours dans ton couloir (coussins à enjamber, chaise à contourner, chaise contre le mur) et fais 5 tours chronométrés.' },
    { duration: 15, title: 'Le dé de l’effort', description: 'Associe chaque face d’un dé à un exercice et lance-le 15 fois : 10 répétitions de l’exercice tiré à chaque lancer.' },
    { duration: 30, title: 'Rue inconnue', description: 'Pars courir ou marcher vite 30 minutes dans des rues où tu n’es jamais allé·e, sans musique, pour tout observer.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Étirements du chat', description: 'Allongé·e, étire-toi comme un chat : bras au-dessus de la tête, genoux vers la poitrine, torsion douce de chaque côté.' },
    { duration: 5, level: 'debutant', title: 'Réveil des articulations', description: 'Fais des cercles lents avec chaque articulation, du cou aux chevilles, 5 fois dans chaque sens.' },
    { duration: 15, level: 'debutant', title: 'Marche tranquille', description: 'Sors marcher 15 minutes à un rythme tranquille en comptant les arbres (ou les chats) que tu croises.' },
    { duration: 15, title: 'Yoga doux', description: 'Enchaîne deux fois 5 postures simples (enfant, chat-vache, chien tête en bas, fente basse, pince assise), une minute chacune.' },
    { duration: 30, title: 'Balade de récupération', description: 'Marche 30 minutes sans objectif, en ralentissant quand tu en as envie. Note un truc beau vu en route.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Une chanson qui booste', description: 'Mets une chanson qui te donne de l’énergie et bouge comme tu veux pendant toute sa durée.' },
    { duration: 5, level: 'debutant', title: 'Lumière du jour', description: 'Sors 5 minutes à la lumière du jour et fais 3 séries de 20 montées de genoux sur place.' },
    { duration: 15, title: 'Petit record', description: 'Choisis un exercice (planche, pompes, squats) et bats ton record d’une seule répétition ou de 5 secondes. Note-le.' },
    { duration: 15, level: 'debutant', title: 'Marche en appel', description: 'Appelle un·e ami·e et marche dehors pendant toute la conversation, ou propose à quelqu’un de venir marcher avec toi.' },
    { duration: 30, title: 'Séance douce complète', description: 'Fais 30 minutes à ton rythme : 10 de marche, 10 de renforcement léger, 10 d’étirements.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Tirage au sort', description: 'Écris 6 exercices sur des papiers, tires-en 3 au hasard et fais une minute de chacun.' },
    { duration: 5, title: 'L’échauffement d’un·e pro', description: 'Regarde l’échauffement d’un·e athlète que tu admires et copie deux de ses exercices.' },
    { duration: 15, level: 'debutant', title: 'Un sport jamais essayé', description: 'Choisis un sport inconnu pour toi (escalade, boxe, parkour) et suis un tuto d’initiation de 15 minutes à la maison.' },
    { duration: 15, title: 'Circuit d’objets', description: 'Invente un circuit de 5 exercices avec des objets de la maison (bouteilles d’eau, sac à dos, chaise) et fais-le 3 fois.' },
    { duration: 30, title: 'Course à consigne', description: 'Fais une sortie de 30 minutes avec une règle : ne tourner qu’à droite, ou suivre toutes les rues qui montent.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Respiration carrée', description: 'Assis·e, dos droit : inspire 4 secondes, bloque 4, expire 4, bloque 4. Répète 10 fois.' },
    { duration: 5, level: 'debutant', title: 'Équilibre', description: 'Tiens sur une jambe 30 secondes les yeux ouverts, puis fermés, de chaque côté. Recommence 3 fois.' },
    { duration: 15, title: 'Grand étirement', description: 'Étire mollets, cuisses, fessiers, dos, épaules et cou, 30 secondes chacun, en respirant lentement.' },
    { duration: 15, title: 'Gainage respiré', description: 'Pendant 10 minutes, alterne 30 secondes de planche et 30 secondes de repos en te concentrant sur ta respiration.' },
    { duration: 30, level: 'debutant', title: 'Yoga au sol', description: 'Suis une séance vidéo de yoga doux pour débutants de 30 minutes, en privilégiant les postures au sol.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Secouer le stress', description: 'Secoue les mains, puis les bras, puis tout le corps pendant une minute, comme un chien qui sort de l’eau. Trois fois.' },
    { duration: 5, level: 'debutant', title: 'Pompes contre le mur', description: 'Fais 3 séries de 15 pompes contre un mur en expirant fort à chaque poussée.' },
    { duration: 15, title: 'Footing de délestage', description: 'Cours 15 minutes à une allure où tu peux encore parler, et laisse tes pensées défiler sans les retenir.' },
    { duration: 15, title: 'Circuit par le nez', description: 'Enchaîne squats, fentes, planche, montées de genoux et étirements, une minute chacun en respirant par le nez. Deux tours.' },
    { duration: 30, title: 'Marche rapide sans écran', description: 'Marche vite pendant 30 minutes en balançant bien les bras, téléphone dans la poche.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Tabata', description: 'Fais un Tabata : 8 fois 20 secondes à fond (jumping jacks, burpees ou montées de genoux) et 10 secondes de repos.' },
    { duration: 5, level: 'debutant', title: 'Shadow boxing', description: 'Boxe dans le vide pendant 3 rounds d’une minute : jab, direct, crochet, en bougeant les pieds.' },
    { duration: 15, title: 'Sprints', description: 'Dehors, après 3 minutes d’échauffement, fais 8 sprints de 15 secondes avec une minute de marche entre chaque.' },
    { duration: 15, title: 'HIIT maison', description: 'Burpees, squats sautés, grimpeur, pompes, fentes : 40 secondes d’effort, 20 de repos, 3 tours.' },
    { duration: 30, level: 'intermediaire', title: 'Fractionné', description: 'Après 5 minutes d’échauffement, cours en alternant 2 minutes rapides et 2 minutes lentes jusqu’à la fin de la demi-heure.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Lancer la machine', description: 'Fais 20 squats, bois un verre d’eau, puis assieds-toi devant ta tâche : le corps est lancé, la tête suit.' },
    { duration: 5, level: 'debutant', title: 'Défi escaliers', description: 'Monte et descends les escaliers de ton immeuble 3 fois, puis attaque ta tâche en arrivant.' },
    { duration: 15, title: 'Score à battre', description: 'Chrono 15 minutes : fais le plus de tours possible de 10 squats, 10 pompes, 10 abdos. Note ton score.' },
    { duration: 15, level: 'debutant', title: 'Marcher le premier pas', description: 'Marche 15 minutes en pensant uniquement à la toute première étape de ta tâche. Au retour, fais-la.' },
    { duration: 30, title: 'La séance repoussée', description: 'Fais enfin la séance que tu remets depuis des jours : 30 minutes, n’importe quel format, l’essentiel est d’y aller.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Un exercice inconnu', description: 'Apprends un exercice nouveau (grimpeur, planche latérale, squat bulgare) et fais-en 3 séries.' },
    { duration: 5, title: 'Ton cœur en chiffres', description: 'Prends ton pouls au repos, fais une minute de jumping jacks, reprends-le, puis mesure combien de temps il met à redescendre.' },
    { duration: 15, title: 'Sport d’ailleurs', description: 'Découvre en vidéo un sport peu connu (sepak takraw, kabaddi, hurling), puis essaie d’en reproduire un geste.' },
    { duration: 15, title: 'Technique de course', description: 'Regarde une vidéo sur la foulée (pose du pied, cadence) et cours 10 minutes en appliquant un seul conseil.' },
    { duration: 30, title: 'Ton programme de 4 semaines', description: 'Cherche un programme débutant (course, pompes ou gainage), écris-le sur 4 semaines et fais la première séance.' },
  ],
})

export const danse = definePassionActivities('danse', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Huit temps', description: 'Invente 8 temps de chorégraphie sur le refrain d’une chanson que tu aimes et répète-les jusqu’à les connaître par cœur.' },
    { duration: 15, title: 'Chorégraphie de clip', description: 'Apprends le début d’une chorégraphie de clip ou de tendance grâce à un tuto au ralenti.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Danse assise', description: 'Assis·e, danse uniquement avec les épaules, les bras et la tête sur un morceau doux.' },
    { duration: 15, title: 'Deux fois plus lent', description: 'Sur une musique très lente, déplace-toi dans la pièce en faisant chaque geste deux fois plus lentement que d’habitude.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Comme si personne ne regardait', description: 'Mets ta chanson préférée et danse comme si personne ne regardait (c’est le cas).' },
    { duration: 15, title: 'Triste, neutre, joyeux', description: 'Enchaîne trois morceaux (un triste, un neutre, un joyeux) et laisse ton corps passer de l’un à l’autre.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Danse des objets', description: 'Invente un mouvement inspiré de 3 objets (la lampe qui s’allume, la porte qui grince…) et enchaîne-les.' },
    { duration: 15, title: 'Style tiré au sort', description: 'Tire un style au hasard (hip-hop, contemporain, salsa, voguing), regarde 2 minutes de vidéo, puis improvise 5 minutes.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Ondulations', description: 'Fais des ondulations lentes de la tête aux pieds, comme une algue dans l’eau, sur une musique douce.' },
    { duration: 30, title: 'Improvisation au sol', description: 'Sur une musique instrumentale, improvise 20 minutes en explorant le sol, les niveaux et la lenteur, puis étire-toi.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Isolations', description: 'Bouge une seule partie du corps à la fois (tête, épaules, côtes, bassin) en rythme, tout le reste immobile.' },
    { duration: 15, title: 'Trembler puis ralentir', description: 'Fais trembler tout ton corps sur une musique rythmée pendant 5 minutes, puis danse librement en ralentissant peu à peu.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Freestyle à 100 %', description: 'Mets le morceau le plus énergique de ta playlist et danse à fond du début à la fin, sans t’arrêter.' },
    { duration: 15, title: 'Battle imaginaire', description: 'Fais 3 passages d’une minute contre un·e adversaire imaginaire, chacun terminé par un freeze.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'La danse de la victoire', description: 'Danse dès maintenant la danse que tu feras quand ta tâche sera finie. Tu sais ce qui t’attend.' },
    { duration: 15, title: 'Les 8 temps suivants', description: 'Reprends une chorégraphie commencée et apprends seulement les 8 temps suivants. Pas plus.' },
  ],
  curiosite: [
    { duration: 5, title: 'Danse du monde', description: 'Regarde une vidéo de haka, de bharatanatyam ou de coupé-décalé et essaie un de leurs pas.' },
    { duration: 30, level: 'intermediaire', title: 'Un pas technique', description: 'Apprends un pas technique (moonwalk, pas de bourrée, toprock) avec un tuto, en le décomposant au ralenti.' },
  ],
})

export const theatre = definePassionActivities('theatre', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Une phrase, dix émotions', description: 'Dis « Il reste des pâtes ? » avec 10 émotions différentes : colère, peur, amour, ennui, suspicion…' },
    { duration: 15, title: 'Monologue d’objet', description: 'Écris puis joue le monologue d’une minute d’un objet de ta pièce qui se plaint de sa vie.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Lecture à plusieurs voix', description: 'Lis à voix haute un passage de n’importe quel livre en jouant tous les personnages.' },
    { duration: 15, title: 'Scène assise', description: 'Apprends et joue une scène courte où le personnage reste assis du début à la fin.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Démarche de héros', description: 'Marche une minute comme un personnage très sûr de lui (posture, regard, démarche) et remarque ce que ça change.' },
    { duration: 15, title: 'Tirade de soutien', description: 'Écris et joue une petite tirade d’encouragement, comme si tu la disais à ton meilleur ami.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Impro à trois ingrédients', description: 'Prends un lieu, un personnage et un problème au hasard (boulangerie, astronaute, clé perdue) et improvise 2 minutes.' },
    { duration: 15, title: 'Scène muette', description: 'Joue une scène d’une minute sans parole : un personnage découvre quelque chose d’inattendu dans un placard.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Échauffement d’acteur', description: 'Relâche la mâchoire, masse ton visage, puis articule lentement « Un chasseur sachant chasser sans son chien ».' },
    { duration: 30, title: 'Apprendre un monologue', description: 'Choisis un court monologue classique et apprends-en les 10 premières lignes, lentement, à voix haute.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Tragédie grecque', description: 'Joue ton stress en l’exagérant à l’extrême, comme dans une tragédie. En général, ça finit en fou rire.' },
    { duration: 15, title: 'Virelangues', description: 'Enchaîne 5 virelangues (« Les chaussettes de l’archiduchesse… ») de plus en plus vite, en articulant parfaitement.' },
  ],
  defouler: [
    { duration: 5, title: 'La tirade du nez', description: 'Déclame à pleine voix un extrait de la tirade du nez de « Cyrano de Bergerac », avec les gestes.' },
    { duration: 15, level: 'debutant', title: 'Personnages en rafale', description: 'Change de personnage toutes les 30 secondes (pirate, robot, grand-mère, présentateur télé) en improvisant un discours.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'La tâche appelle à l’aide', description: 'Joue une courte scène où ta tâche t’appelle à l’aide, puis réponds-lui… en t’y mettant.' },
    { duration: 15, title: 'Répétition générale', description: 'Joue la scène de toi en train de faire ta tâche, comme une répétition, puis enchaîne pour de vrai.' },
  ],
  curiosite: [
    { duration: 5, title: 'Commedia dell’arte', description: 'Découvre Arlequin, Pantalone et Colombina, puis essaie la démarche de l’un d’eux.' },
    { duration: 30, level: 'intermediaire', title: 'Rejouer une scène de film', description: 'Apprends une scène de film d’une minute, joue-la en te filmant, puis compare avec l’original.' },
  ],
})

export const artsMartiaux = definePassionActivities('arts-martiaux', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Garde et déplacements', description: 'Mets-toi en garde et déplace-toi (avant, arrière, côtés) sans jamais croiser les pieds pendant 5 minutes.' },
    { duration: 15, title: 'Trois enchaînements', description: 'Invente 3 enchaînements de 4 techniques et répète chacun 10 fois dans le vide, lentement puis vite.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Au ralenti', description: 'Répète tes mouvements de base (ou un simple jab-direct) très lentement, comme au tai-chi, en respirant.' },
    { duration: 15, title: 'Souplesse des hanches', description: 'Papillon, écart facial doux, fente basse : une minute chacun, en respirant dans l’étirement, trois tours.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Posture du cavalier', description: 'Tiens la posture du cavalier (jambes écartées, genoux fléchis) 3 fois 30 secondes en respirant profondément.' },
    { duration: 15, level: 'debutant', title: 'Initiation au tai-chi', description: 'Suis une vidéo d’initiation au tai-chi de 15 minutes pour débutants.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Emprunt à un autre art', description: 'Regarde une technique de capoeira, de judo ou de taekwondo et essaie-la dans le vide.' },
    { duration: 15, title: 'Combat de film au ralenti', description: 'Choisis un combat de film et reproduis 5 mouvements au ralenti, en contrôle total.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Respiration du ventre', description: 'Assis·e en tailleur ou à genoux, respire par le ventre pendant 5 minutes, dos droit, regard posé.' },
    { duration: 30, level: 'intermediaire', title: 'Forme complète', description: 'Travaille un kata ou une forme en entier, 5 fois, en cherchant la précision plutôt que la vitesse.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Coussin cible', description: 'Tiens un coussin contre le mur et frappe-le en directs contrôlés, 3 rounds de 30 secondes, en soufflant.' },
    { duration: 15, title: '100 répétitions', description: 'Répète 100 fois une technique simple (coup de pied de face, jab) en comptant à voix haute par dizaines.' },
  ],
  defouler: [
    { duration: 5, title: 'Rounds de shadow', description: 'Fais 3 rounds d’une minute de shadow à fond, avec 30 secondes de repos entre chaque.' },
    { duration: 15, level: 'debutant', title: 'Circuit du combattant', description: 'Corde à sauter (même imaginaire), shadow, squats et gainage : une minute chacun, trois tours.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Saluer la tâche', description: 'Salue comme au début d’un entraînement, fais 20 coups de poing dans le vide, puis salue ta tâche et commence-la.' },
    { duration: 15, title: 'Décomposer une technique', description: 'Choisis une technique que tu maîtrises mal, découpe-la en 4 étapes et travaille chacune 2 minutes.' },
  ],
  curiosite: [
    { duration: 5, title: 'Aux origines', description: 'Lis l’histoire d’un art martial (le judo de Jigoro Kano, la capoeira au Brésil) et note un fait marquant.' },
    { duration: 30, level: 'intermediaire', title: 'Huit mouvements d’une forme', description: 'Apprends en vidéo les 8 premiers mouvements d’une forme de tai-chi ou d’un kata, jusqu’à les faire sans regarder.' },
  ],
})
