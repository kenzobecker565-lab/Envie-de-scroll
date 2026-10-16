import { definePassionActivities } from './define'

/* ============================================================================
 *  ESPRIT & STRATÉGIE : jeux vidéo créatifs, programmation créative,
 *  jeux de société, échecs
 * ========================================================================== */

export const jeuxVideoCreatifs = definePassionActivities('jeux-video-creatifs', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Niveau sur papier', description: 'Dessine le plan d’un niveau de jeu de plateforme : le départ, 3 obstacles, un passage secret et l’arrivée.' },
    { duration: 15, title: 'Maison sur mesure', description: 'Dans Minecraft ou un autre jeu de construction, bâtis en 15 minutes la maison d’un pirate, d’une sorcière ou d’un robot.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Mode photo', description: 'Dans un jeu que tu aimes, utilise le mode photo (ou une capture) pour réaliser 3 images soignées : cadrage, lumière, angle.' },
    { duration: 15, title: 'Jardin zen virtuel', description: 'Construis un petit jardin calme dans ton jeu de construction : de l’eau, des arbres, un banc. Aucun objectif.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Coin cosy', description: 'Aménage dans un jeu un petit refuge (cabane, chambre) où ton personnage aime se retrouver.' },
    { duration: 15, title: 'Petit jeu narratif', description: 'Joue à un petit jeu narratif tout doux (par exemple un jeu Bitsy sur itch.io) et note le moment qui t’a touché.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Mélange de jeux', description: 'Invente un jeu en croisant deux jeux que tu connais (Tetris + Pokémon ?) et écris ses 3 règles principales.' },
    { duration: 15, level: 'debutant', title: 'Personnage jouable', description: 'Crée un personnage de jeu (nom, pouvoir, faiblesse) et dessine son sprite en 16 × 16 pixels.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Objet en pixel art', description: 'Dessine un objet de jeu (potion, clé, pièce d’or) en 16 × 16 pixels, sur papier quadrillé ou dans Piskel.' },
    { duration: 30, title: 'Mini-jeu Bitsy', description: 'Crée un mini-jeu avec Bitsy (gratuit, dans le navigateur) : une salle, un personnage, un dialogue.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Symétrie parfaite', description: 'Construis une structure parfaitement symétrique dans ton jeu de construction, bloc par bloc.' },
    { duration: 15, title: 'Machine qui tourne seule', description: 'Construis un mécanisme qui fonctionne tout seul : circuit de redstone, rangée de dominos, parcours de billes.' },
  ],
  defouler: [
    { duration: 5, title: 'Passage impossible', description: 'Dans un éditeur de niveaux (Mario Maker, Roblox Studio…), crée le passage le plus difficile possible en 5 minutes, puis teste-le.' },
    { duration: 15, level: 'debutant', title: 'Arène épique', description: 'Construis une arène pour un combat épique : gradins, pièges et entrée spectaculaire.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'La quête du soir', description: 'Transforme ta tâche en quête : un nom, 3 étapes, une récompense en XP. Lance l’étape 1.' },
    { duration: 15, title: 'Écran-titre', description: 'Dessine l’écran-titre du jeu dont tu es le héros ce soir, avec « Appuyer sur Start ». Puis appuie sur Start.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Jeux de game jam', description: 'Parcours des jeux créés pendant une game jam sur itch.io et note l’idée la plus originale.' },
    { duration: 30, level: 'intermediaire', title: 'Premier prototype', description: 'Dans Scratch ou GDevelop, crée un mini-jeu où un personnage se déplace et attrape un objet.' },
  ],
})

export const programmationCreative = definePassionActivities('programmation-creative', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Art ASCII', description: 'Dessine un petit animal uniquement avec des caractères du clavier (/, \\, _, o, ^) dans un éditeur de texte.' },
    { duration: 15, title: '100 cercles au hasard', description: 'Dans l’éditeur en ligne de p5.js, écris une boucle qui dessine 100 cercles de tailles et de couleurs aléatoires.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Remix Scratch', description: 'Ouvre un projet Scratch populaire, clique sur « Voir à l’intérieur » et change une seule valeur pour voir ce qui se passe.' },
    { duration: 15, title: 'Dégradé en 400 lignes', description: 'Dans p5.js, trace 400 lignes verticales dont la couleur change doucement de gauche à droite.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Le lutin qui encourage', description: 'Dans Scratch, programme un personnage qui saute de joie et te dit une phrase d’encouragement quand tu cliques dessus.' },
    { duration: 15, title: 'Pluie de cœurs', description: 'Programme une petite animation où des cœurs ou des étoiles tombent doucement du haut de l’écran.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Une consigne de Genuary', description: 'Parcours les consignes de Genuary (un défi d’art génératif) et choisis-en une à tenter.' },
    { duration: 15, level: 'debutant', title: 'La tortue dessinatrice', description: 'Avec le stylo de Scratch ou le module turtle de Python, dessine une étoile, puis une spirale en changeant un seul nombre.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Cercle qui respire', description: 'Code un cercle qui grossit pendant 4 secondes et rétrécit pendant 4 secondes, et respire avec lui.' },
    { duration: 30, title: 'Motif « 10 PRINT »', description: 'Dans p5.js, remplis l’écran de diagonales tirées au hasard (/ ou \\) comme le célèbre « 10 PRINT », et fais-en un fond d’écran.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Compter jusqu’à 10', description: 'Écris un petit programme qui compte de 1 à 10 en affichant un message différent à chaque nombre.' },
    { duration: 15, level: 'intermediaire', title: 'Horloge en cercles', description: 'Programme une horloge où heures, minutes et secondes sont des arcs de cercle qui se remplissent.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Clavier musical', description: 'Dans Scratch, associe un son à 5 touches du clavier et improvise un morceau.' },
    { duration: 15, level: 'intermediaire', title: 'Feu d’artifice', description: 'Code des particules qui explosent là où tu cliques, avec des couleurs et des vitesses aléatoires.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Compte à rebours maison', description: 'Programme un compte à rebours qui affiche « Go ! » à la fin, puis lance-le et démarre ta tâche au signal.' },
    { duration: 15, title: 'Générateur d’excuses', description: 'Programme un générateur d’excuses absurdes pour procrastiner (mots tirés au hasard dans des listes), ris un coup, puis au travail.' },
  ],
  curiosite: [
    { duration: 5, title: 'Fouiller Shadertoy', description: 'Sur Shadertoy, ouvre le code d’un effet qui te plaît, change un nombre et observe ce qui se passe.' },
    { duration: 30, level: 'intermediaire', title: 'Snake maison', description: 'Suis un tuto pour coder un mini-Snake dans le navigateur (p5.js ou Scratch), puis ajoute une règle à toi.' },
  ],
})

export const jeuxDeSociete = definePassionActivities('jeux-de-societe', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Règle maison', description: 'Prends un jeu que tu connais (Uno, dames, petits chevaux) et invente une règle bonus qui change tout.' },
    { duration: 15, level: 'debutant', title: 'Réussite', description: 'Fais une partie de réussite (solitaire) avec un vrai jeu de cartes, sans écran.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Château de cartes', description: 'Construis calmement le château de cartes le plus haut possible.' },
    { duration: 15, title: 'Tangram', description: 'Découpe (ou sors) un tangram et reproduis trois figures : un chat, une maison, un bateau.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Invitation à jouer', description: 'Propose une partie courte à quelqu’un chez toi ou par message : un morpion, un Uno, un petit bac.' },
    { duration: 15, title: 'Jeu coopératif', description: 'Joue à un jeu où l’on gagne ensemble (Hanabi, The Mind) ou à un jeu de mots, même en visio.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Jeu à deux dés', description: 'Invente un jeu avec 2 dés et une feuille : un objectif, une règle de tour, une condition de victoire.' },
    { duration: 15, level: 'debutant', title: 'Jeu de l’oie de ta vie', description: 'Dessine un jeu de l’oie sur le thème de ta vie : 20 cases, des pièges et des bonus.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Casse-tête de logique', description: 'Résous une grille de sudoku, de kakuro ou de nonogramme, sur papier ou dans une appli sans pub.' },
    { duration: 30, title: 'Partie de go 9 × 9', description: 'Joue une partie de go sur un petit plateau 9 × 9 contre quelqu’un ou contre une appli.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Mélange à l’américaine', description: 'Apprends à mélanger un paquet de cartes « à l’américaine » : un geste répétitif qui occupe les mains.' },
    { duration: 15, title: 'Casse-tête solo', description: 'Enchaîne quelques niveaux d’un casse-tête (Rush Hour, solitaire chinois), sur plateau ou en ligne.' },
  ],
  defouler: [
    { duration: 5, title: 'Jeu de rapidité', description: 'Fais une partie de Dobble, de Jungle Speed ou de bataille corse, ou chronomètre-toi à trier un paquet par couleur.' },
    { duration: 15, level: 'debutant', title: 'Tournoi express', description: 'Organise un mini-tournoi en 3 manches d’un jeu rapide (Puissance 4, morpion géant sur papier) avec quelqu’un.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Tirer une carte', description: 'Découpe ta tâche en 5 mini-étapes écrites sur 5 papiers, tires-en une au hasard et fais-la.' },
    { duration: 15, title: 'Plateau de la tâche', description: 'Transforme ta tâche en plateau de jeu : chaque case est une mini-étape. Lance un dé et avance en les réalisant.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Jeu d’ailleurs', description: 'Découvre les règles d’un jeu traditionnel d’un autre pays (awalé, mahjong, pachisi) et note ce qui te plaît.' },
    { duration: 30, level: 'intermediaire', title: 'Prototype de jeu de cartes', description: 'Crée un prototype avec 20 cartes découpées dans du papier, puis joue une partie test.' },
  ],
})

export const echecs = definePassionActivities('echecs', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Trois problèmes', description: 'Résous 3 problèmes d’échecs sur Lichess, gratuitement et sans créer de compte.' },
    { duration: 15, title: 'Variante folle', description: 'Joue une partie de variante (Chess960, Roi de la colline) contre l’ordinateur sur Lichess.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Mats en un coup', description: 'Résous 5 problèmes de mat en un coup : parfait pour un cerveau fatigué.' },
    { duration: 15, title: 'L’Immortelle', description: 'Rejoue coup par coup « l’Immortelle » d’Anderssen (1851) sur un échiquier ou une appli.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Victoire facile', description: 'Joue une partie contre l’ordinateur au niveau le plus bas et savoure ta victoire.' },
    { duration: 15, title: 'Le plus beau coup', description: 'Regarde une vidéo sur les plus beaux coups de l’histoire des échecs et rejoue ton préféré.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Ouverture inconnue', description: 'Choisis une ouverture que tu ne joues jamais (scandinave, système de Londres) et apprends ses 4 premiers coups.' },
    { duration: 15, level: 'debutant', title: 'Problème inventé', description: 'Crée ton propre problème : place 4 ou 5 pièces sur l’échiquier pour obtenir un mat en un coup.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Balade du cavalier', description: 'Fais passer un cavalier par les quatre coins de l’échiquier, lentement, en visualisant chaque saut.' },
    { duration: 30, title: 'Partie lente', description: 'Joue une partie en cadence lente contre l’ordinateur en prenant le temps de réfléchir à chaque coup.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Échec, prise, menace', description: 'Résous 3 problèmes en vérifiant à chaque fois tous les échecs, prises et menaces avant de jouer.' },
    { duration: 15, title: 'Mat roi et tour', description: 'Entraîne-toi à mater avec roi et tour contre roi seul, jusqu’à y arriver sans hésiter.' },
  ],
  defouler: [
    { duration: 5, title: 'Bullet', description: 'Joue 3 parties d’une minute : c’est rapide, un peu fou, et ça défoule.' },
    { duration: 15, level: 'debutant', title: 'Puzzle Storm', description: 'Lance un Puzzle Storm sur Lichess (un maximum de problèmes en 3 minutes) et essaie de battre ton score.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Échauffement du cerveau', description: 'Résous un seul problème d’échecs comme échauffement, puis ouvre ta tâche.' },
    { duration: 15, title: 'Analyse de partie', description: 'Analyse ta dernière partie avec le moteur, trouve ton erreur principale et note la leçon.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Aux origines', description: 'Découvre le chaturanga, l’ancêtre indien des échecs, et comment la dame est devenue la pièce la plus puissante.' },
    { duration: 30, level: 'intermediaire', title: 'Une ouverture en profondeur', description: 'Étudie une ouverture (italienne, sicilienne) sur 8 coups avec une vidéo, puis teste-la en 2 parties.' },
  ],
})
