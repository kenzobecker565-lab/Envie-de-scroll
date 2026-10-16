/**
 * ============================================================================
 *  AIDER À DÉMARRER : astuces, idées concrètes, défis en plus
 * ============================================================================
 *
 * Les 60 activités validées ne changent pas : on ajoute seulement autour.
 *
 * - « Si tu bloques » : 2 ou 3 pistes pour se lancer, par activité.
 * - « Une idée ? » : des suggestions concrètes quand l'activité demande de
 *   trouver soi-même (un album culte, un artiste inconnu, un style de dessin…),
 *   avec des liens pour écouter ou regarder.
 * - « Un défi en plus ? » (Dessin, Écriture) : une contrainte tirée au hasard,
 *   pour pimenter, jamais obligatoire.
 * - L'objectif d'écriture (« 100 mots », « 3 phrases »), affiché dans le carnet.
 *
 * ⚠️ Ces textes ne font pas partie du contenu validé : à relire librement.
 */

import { melody, type Melody } from './keyboard.ts'
import { getActivity } from './activities.ts'
import { getChallengeActivity } from './monthly.ts'
import { getPathStep } from './paths.ts'
import { FILMS, MUSIC_GENRES, sample, WORDS } from './prompts.ts'
import { frenchTypography } from './typography.ts'
import type { ExtraKind, PassionId } from './types.ts'

/* ------------------------------------------------------------------ listes */

const ANIMALS = [
  'un chat', 'un renard', 'un hibou', 'une baleine', 'un pingouin', 'une tortue', 'un lapin', 'un poisson-globe',
  'un ours', 'une grenouille', 'un flamant rose', 'un escargot', 'un paresseux', 'une méduse', 'un corbeau', 'un hérisson',
]

const MOTIFS = [
  'des spirales', 'des écailles', 'des étoiles', 'des vagues', 'des petits nuages', 'des triangles', 'des pois',
  'des feuilles', 'des briques', 'des zigzags', 'des yeux', 'des fleurs simples', 'des cubes', 'des cercles emboîtés',
]

const DRAWING_STYLES = [
  'Manga', 'Cartoon des années 30, aux bras en tuyau', 'Ligne claire, façon Tintin', 'Pixel art', 'Kawaii', 'Réaliste',
  'Cubisme', 'Pointillisme', 'Trait continu, sans lever le crayon', 'Silhouettes toutes noires', 'Livre pour enfants', 'Croquis de mode',
]

const COVERS = [
  'The Dark Side of the Moon — Pink Floyd', 'Abbey Road — The Beatles', 'Nevermind — Nirvana', 'Discovery — Daft Punk',
  'Histoire de Melody Nelson — Serge Gainsbourg', 'Blonde — Frank Ocean', 'Unknown Pleasures — Joy Division',
  'The Velvet Underground & Nico — The Velvet Underground', 'Moon Safari — Air', 'Homogenic — Björk', 'Kind of Blue — Miles Davis',
  'Le Petit Prince — Antoine de Saint-Exupéry',
]

const ILLUSTRATORS = [
  'Hokusai', 'Moebius', 'Quentin Blake', 'Sempé', 'Alfons Mucha', 'Mary Blair', 'Hergé', 'Beatrix Potter',
  'Kazuo Oga (les décors du Studio Ghibli)', 'Shaun Tan', 'Rébecca Dautremer', 'Tove Jansson',
]

const SCENES = [
  'une gare la nuit', 'un marché flottant', 'une cabane dans un arbre', 'une bibliothèque géante', 'une ville sous la pluie',
  'l’intérieur d’un vaisseau spatial', 'une plage au petit matin', 'une cuisine en désordre', 'un jardin secret',
  'le toit d’un immeuble', 'une fête foraine', 'une forêt de champignons géants',
]

const CHARACTERS = [
  'le Petit Prince', 'Totoro', 'Sherlock Holmes', 'Hermione Granger', 'Gandalf', 'Miles Morales', 'Elizabeth Bennet',
  'Monkey D. Luffy', 'Arsène Lupin', 'Mafalda', 'Astérix', 'Frodon Sacquet',
]

const DREAM_PLACES = [
  'Kyoto au printemps', 'les îles Lofoten', 'le désert d’Atacama', 'Marrakech', 'New York sous la neige', 'Valparaíso',
  'l’Islande', 'un village de Provence en juillet', 'Zanzibar', 'une station spatiale', 'Lisbonne au petit matin', 'la Patagonie',
]

const CALM_TRACKS = [
  'Clair de lune — Claude Debussy', 'Gymnopédie n° 1 — Erik Satie', 'Says — Nils Frahm', 'Holocene — Bon Iver',
  'Teardrop — Massive Attack', 'Nuvole bianche — Ludovico Einaudi', 'Hoppípolla — Sigur Rós', 'Avril 14th — Aphex Twin',
  'Spiegel im Spiegel — Arvo Pärt', 'In a Sentimental Mood — Duke Ellington & John Coltrane', 'One Summer’s Day — Joe Hisaishi',
  'Kiara — Bonobo', 'Blue in Green — Miles Davis', 'Águas de Março — Elis Regina & Tom Jobim', 'Comptine d’un autre été — Yann Tiersen',
]

const ARTISTS = [
  'Khruangbin', 'Altın Gün', 'Tinariwen', 'Mdou Moctar', 'Fatoumata Diawara', 'Kokoroko', 'Ezra Collective', 'Hiatus Kaiyote',
  'BADBADNOTGOOD', 'Ibeyi', 'Bombino', 'Nubya Garcia', 'Men I Trust', 'Snarky Puppy', 'Cimafunk', 'Mulatu Astatke',
  'Lianne La Havas', 'Yussef Dayes', 'Tom Misch', 'Mariya Takeuchi', 'Yin Yin', 'Ballaké Sissoko', 'Hania Rani',
  'L’Impératrice', 'Juniore', 'Lucie Antunes', 'Bab L’ Bluz', 'Amadou & Mariam',
]

const ALBUMS = [
  'Kind of Blue — Miles Davis (1959)', 'Getz/Gilberto — Stan Getz & João Gilberto (1964)', 'Pet Sounds — The Beach Boys (1966)',
  'Abbey Road — The Beatles (1969)', 'Histoire de Melody Nelson — Serge Gainsbourg (1971)', 'What’s Going On — Marvin Gaye (1971)',
  'Blue — Joni Mitchell (1971)', 'Tapestry — Carole King (1971)', 'The Dark Side of the Moon — Pink Floyd (1973)',
  'Head Hunters — Herbie Hancock (1973)', 'Songs in the Key of Life — Stevie Wonder (1976)', 'Rumours — Fleetwood Mac (1977)',
  'Thriller — Michael Jackson (1982)', 'Purple Rain — Prince (1984)', 'Graceland — Paul Simon (1986)', 'Nevermind — Nirvana (1991)',
  'Illmatic — Nas (1994)', 'OK Computer — Radiohead (1997)', 'Homogenic — Björk (1997)', 'L’École du micro d’argent — IAM (1997)',
  'Buena Vista Social Club (1997)', 'Moon Safari — Air (1998)', 'Mezzanine — Massive Attack (1998)',
  'The Miseducation of Lauryn Hill — Lauryn Hill (1998)', 'Fantaisie militaire — Alain Bashung (1998)', 'Ágætis byrjun — Sigur Rós (1999)',
  'Discovery — Daft Punk (2001)', 'Dimanche à Bamako — Amadou & Mariam (2004)', 'Back to Black — Amy Winehouse (2006)',
  'Random Access Memories — Daft Punk (2013)', 'To Pimp a Butterfly — Kendrick Lamar (2015)', 'Blonde — Frank Ocean (2016)',
]

const LIVE_SESSIONS = [
  'Les Tiny Desk Concerts (NPR)', 'Les sessions COLORS', 'Les Concerts à emporter (La Blogothèque)', 'Les live sessions de KEXP',
  'Arte Concert', 'Taratata', 'Les Mahogany Sessions', 'Le Live Lounge de BBC Radio 1',
]

const PLAYLIST_THEMES = [
  'Les tubes de 1985', 'Les tubes de 1999', 'Musique pour un jour de pluie', 'Route de nuit', 'Les débuts du hip-hop',
  'Les bandes originales de Joe Hisaishi', 'Les musiques de jeux vidéo', 'La French Touch', 'Le jazz des années 50',
  'L’afrobeat des années 70', 'La city pop japonaise', 'Bossa nova pour un dimanche matin', 'La chanson française des années 60',
]

const CULT_FILMS = [
  'Les Temps modernes (1936)', 'Les Sept Samouraïs (1954)', 'Psychose (1960)', 'Le Bon, la Brute et le Truand (1966)',
  '2001 : l’Odyssée de l’espace (1968)', 'Le Parrain (1972)', 'Les Dents de la mer (1975)', 'Star Wars (1977)', 'Alien (1979)',
  'Shining (1980)', 'E.T. l’extra-terrestre (1982)', 'Retour vers le futur (1985)', 'Akira (1988)', 'Mon voisin Totoro (1988)',
  'Jurassic Park (1993)', 'Pulp Fiction (1994)', 'La Cité de la peur (1994)', 'La Haine (1995)', 'Ghost in the Shell (1995)',
  'Princesse Mononoké (1997)', 'Le Dîner de cons (1998)', 'Matrix (1999)', 'Le Fabuleux Destin d’Amélie Poulain (2001)',
  'Le Voyage de Chihiro (2001)', 'Mulholland Drive (2001)',
]

const DIRECTORS = [
  'Studio Ghibli', 'Pixar', 'Cartoon Saloon', 'Aardman', 'Laika', 'Hayao Miyazaki', 'Satoshi Kon', 'Mamoru Hosoda',
  'Makoto Shinkai', 'Agnès Varda', 'Jacques Tati', 'Céline Sciamma', 'Bong Joon-ho', 'Wes Anderson', 'Wong Kar-wai',
  'Hirokazu Kore-eda', 'Denis Villeneuve', 'Greta Gerwig', 'Jordan Peele',
]

const AVOIDED_GENRES = [
  'Horreur', 'Comédie romantique', 'Documentaire animalier', 'Western', 'Comédie musicale', 'Film muet', 'Science-fiction',
  'Thriller coréen', 'Animation en stop-motion', 'Bollywood', 'Film noir', 'Faux documentaire', 'Film de sabre japonais', 'Film de monstres géants',
]

const ANALYSIS_CHANNELS = [
  'Every Frame a Painting', 'Lessons from the Screenplay', 'Nerdwriter1', 'Blow Up (Arte)', 'Le Fossoyeur de Films',
  'Thomas Flight', 'Pop Culture Detective',
]

/* ------------------------------------------------------------------ guides */

/**
 * Comment ouvrir une idée : l'écouter (YouTube, Spotify, Deezer), voir la
 * bande-annonce et où regarder le film, le regarder (court, épisode), chercher
 * une vidéo, ou voir des images.
 */
export type LinkKind = 'ecoute' | 'film' | 'regarder' | 'video' | 'image'

export interface IdeaList {
  /** « Des albums cultes », « Un style à essayer »… */
  label: string
  items: readonly string[]
  /** Liens proposés pour l'idée choisie. */
  links?: LinkKind
  /** Ajouté à la recherche (« dessin », « playlist »…) pour tomber juste. */
  suffix?: string
  /** Combien d'idées montrer à la fois (3 par défaut). */
  show?: number
}

/** Ce que compte le carnet d'écriture. */
export type GoalUnit = 'mots' | 'lignes' | 'phrases'

export interface WritingGoal {
  count: number
  unit: GoalUnit
  /** Ex. « 10 lignes, environ 100 mots ». */
  label: string
}

export interface ActivityGuide {
  /** « Si tu bloques » : 2 ou 3 pistes. */
  tips: readonly string[]
  ideas?: IdeaList
  goal?: WritingGoal
  /** Piano : l'air à jouer, note après note, sur le clavier de l'appli. */
  melody?: Melody
}

type RawGuide = { tips: string[]; ideas?: IdeaList; goal?: Omit<WritingGoal, 'label'> & { label?: string }; melody?: Melody }

const RAW_GUIDES: Record<string, RawGuide> = {
  /* Dessin, 5 min */
  'dessin-5-1': {
    tips: [
      'Choisis l\'objet le plus simple à portée de main : une tasse, un stylo, une gomme.',
      'Commence par sa forme globale (un rectangle, un rond), les détails viendront après.',
      'Pas de gomme pendant 5 minutes : chaque trait raté fait partie du dessin.',
    ],
  },
  'dessin-5-2': {
    tips: [
      'Un rond pour la tête, un ovale pour le corps : le reste, ce sont des triangles et des traits.',
      'Exagère ce qui le rend reconnaissable : les oreilles du lapin, le bec du toucan.',
      'Deux points pour les yeux suffisent à lui donner vie.',
    ],
    ideas: { label: 'Un animal, si tu hésites', items: ANIMALS },
  },
  'dessin-5-3': {
    tips: [
      'Lance un minuteur d\'une minute par objet : quand ça sonne, on passe au suivant.',
      'Va à l\'essentiel : le contour, puis un seul détail qui le distingue.',
      'Aligne-les sur la page, comme une petite planche d\'inventaire.',
    ],
  },
  'dessin-5-4': {
    tips: [
      'Regarde ce que tu portes, ce que tu as mangé, ce qui traîne sur ta table.',
      'Ton mood peut devenir un petit personnage, une météo ou une couleur.',
      'Ajoute la date dans un coin : ça devient une page de journal dessiné.',
    ],
  },
  'dessin-5-5': {
    tips: [
      'Commence par un motif dans un coin et laisse-le se répéter en grandissant.',
      'Alterne deux motifs, puis glisses-en un troisième quand tu t\'ennuies.',
      'Remplis les derniers vides avec des points : c\'est ce qui donne du relief.',
    ],
    ideas: { label: 'Des motifs à répéter', items: MOTIFS },
  },
  /* Dessin, 15 min */
  'dessin-15-6': {
    tips: [
      'Choisis un sujet très simple (une tasse, une plante) : le style fera tout le travail.',
      'Regarde 2 ou 3 images de ce style avant de commencer, puis range-les.',
      'Garde ce qui fait le style : les grands yeux du manga, les bras en tuyau du cartoon…',
    ],
    ideas: { label: 'Un style à essayer', items: DRAWING_STYLES, links: 'image', suffix: 'dessin' },
  },
  'dessin-15-7': {
    tips: [
      'Un mot pour le personnage, un pour sa tenue ou son accessoire, un pour le décor.',
      'Fais 3 mini-croquis rapides avant de choisir le bon.',
      'Le mélange bizarre des 3 mots, c\'est justement ce qui rendra ton personnage unique.',
    ],
  },
  'dessin-15-8': {
    tips: [
      'Pose l\'objet près d\'une fenêtre ou d\'une lampe : la lumière d\'un seul côté.',
      'Plisse les yeux : les zones les plus sombres sautent aux yeux.',
      'Commence par l\'ombre portée au sol, puis assombris peu à peu, sans appuyer d\'un coup.',
    ],
  },
  'dessin-15-9': {
    tips: [
      'Garde 2 ou 3 éléments qui le rendent reconnaissable : coiffure, couleur, accessoire.',
      'Change tout le reste : les proportions, le trait, l\'expression.',
      'Mets-le dans une situation inattendue : en vacances, au supermarché…',
    ],
  },
  'dessin-15-10': {
    tips: [
      'Commence par la composition : où va l\'image, où vont le titre et le nom.',
      'Simplifie : les grandes formes et les couleurs comptent plus que les détails.',
      'Tu peux aussi inventer ta propre version de la pochette.',
    ],
    ideas: { label: 'Des pochettes célèbres', items: COVERS, links: 'image', suffix: 'pochette' },
  },
  /* Dessin, 30 min */
  'dessin-30-11': {
    tips: [
      'Choisis un trait du visage à exagérer : le nez, les sourcils, la coiffure.',
      'Les yeux se placent à mi-hauteur de la tête : c\'est l\'erreur la plus courante.',
      'Pas besoin que ce soit ressemblant : on doit reconnaître ta façon de voir.',
    ],
  },
  'dessin-30-12': {
    tips: [
      'Trace une grille légère sur le modèle et sur ta feuille pour placer les grandes masses.',
      'Change une chose à ta façon : les couleurs, le personnage, l\'époque.',
      'Note le nom de l\'artiste dans un coin : c\'est un hommage.',
    ],
    ideas: { label: 'Des artistes à admirer', items: ILLUSTRATORS, links: 'image', suffix: 'illustration' },
  },
  'dessin-30-13': {
    tips: [
      'Case 1 : la situation. Case 2 : le petit problème. Case 3 : la chute.',
      'Trace les cases en premier, et garde de la place pour les bulles.',
      'Des personnages-bâtons suffisent : c\'est l\'histoire qui compte.',
    ],
  },
  'dessin-30-14': {
    tips: [
      'Trace une ligne d\'horizon : tout le décor s\'organise autour.',
      'Trois plans : quelque chose devant, le personnage au milieu, le fond derrière.',
      'Le décor peut raconter une histoire : l\'heure, la météo, ce qui vient de se passer.',
    ],
    ideas: { label: 'Un lieu, si tu hésites', items: SCENES },
  },
  'dessin-30-15': {
    tips: [
      'Choisis une photo bien éclairée, avec des ombres nettes.',
      'Astuce de pro : retourne la photo et dessine-la à l\'envers. Tu verras des formes, plus un visage.',
      'Commence léger, puis renforce les zones sombres à la fin.',
    ],
  },

  /* Écriture, 5 min */
  'ecriture-5-1': {
    tips: [
      'Une phrase pour ce que tu vois, une pour ce que tu entends, une pour ce que tu ressens.',
      'Choisis un détail minuscule plutôt qu\'une vue d\'ensemble.',
      'Pas besoin de belles phrases : juste des phrases vraies.',
    ],
    goal: { count: 3, unit: 'phrases' },
  },
  'ecriture-5-2': {
    tips: [
      'Une fin drôle, une sérieuse, une minuscule, une bizarre, une vraie.',
      'Pense aux 5 sens : un bruit, une odeur, une couleur…',
      'Une fin par ligne, sans te relire avant la cinquième.',
    ],
    goal: { count: 5, unit: 'lignes', label: '5 fins de phrase, une par ligne' },
  },
  'ecriture-5-3': {
    tips: [
      'Mélange des mots d\'émotion, de couleur, de météo, d\'objet.',
      'Le premier mot qui vient est souvent le bon : ne réfléchis pas trop.',
      'Au 10e mot, relis : lequel te surprend le plus ?',
    ],
    goal: { count: 10, unit: 'mots' },
  },
  'ecriture-5-4': {
    tips: [
      'Pars d\'un mot qui sonne bien et construis le titre autour.',
      'Une bonne première phrase pose une question sans la dire.',
      'Puisque tu ne l\'écriras jamais, ose tout : le plus fou possible.',
    ],
  },
  'ecriture-5-5': {
    tips: [
      'Fais comme si tu ne connaissais ni son nom, ni son usage.',
      'Décris sa texture, son poids, son odeur, le bruit qu\'il fait.',
      'Devine à quoi il pourrait servir, en te trompant joyeusement.',
    ],
  },
  /* Écriture, 15 min */
  'ecriture-15-6': {
    tips: [
      'Un personnage, un désir, un obstacle : en 100 mots, c\'est tout ce qu\'il faut.',
      'Commence au milieu de l\'action, pas par la présentation.',
      'Tu peux garder le mot tiré pour la toute fin, comme une chute.',
    ],
    goal: { count: 100, unit: 'mots' },
  },
  'ecriture-15-7': {
    tips: [
      'Choisis un moment précis plutôt qu\'une période : une heure, un après-midi.',
      'Commence par un détail des sens : une odeur, une lumière, un bruit.',
      'Écris au présent, comme si tu y étais encore.',
    ],
    goal: { count: 100, unit: 'mots', label: '10 lignes, environ 100 mots' },
  },
  'ecriture-15-8': {
    tips: [
      'Commence par ce que tu ne lui as jamais dit.',
      'Pose-lui une question à laquelle l\'histoire n\'a pas répondu.',
      'Raconte-lui un peu de ta vie, comme à un vieil ami.',
    ],
    ideas: { label: 'Un personnage, si tu hésites', items: CHARACTERS },
  },
  'ecriture-15-9': {
    tips: [
      'Demande-toi qui raconte, et ce qu\'il ou elle veut.',
      'Ne cherche pas la suite logique : cherche la suite intéressante.',
      'Ta dernière phrase peut répondre au mystère… ou l\'épaissir.',
    ],
  },
  'ecriture-15-10': {
    tips: [
      'Choisis un personnage très différent de toi : un enfant, un chat, un voyageur du futur.',
      'Ce qui te paraît banal peut l\'étonner : décris le lieu avec ses yeux.',
      'Termine sur ce que le personnage décide de faire là.',
    ],
  },
  /* Écriture, 30 min */
  'ecriture-30-11': {
    tips: [
      'Donne-leur un désaccord tout simple : qui fait la vaisselle, qui garde le chat.',
      'Chaque réplique trahit le trait du personnage, sans jamais le nommer.',
      'Coupe les politesses : commence quand ça devient intéressant.',
    ],
  },
  'ecriture-30-12': {
    tips: [
      'Imagine le magazine ou l\'émission qui t\'interviewe : ça donne le ton.',
      'Prépare 5 questions avant d\'écrire les réponses.',
      'Mélange le sérieux et le drôle : ton plus grand succès, ta pire honte…',
    ],
  },
  'ecriture-30-13': {
    tips: [
      'Raconte dans l\'ordre où tu t\'en souviens, pas forcément dans l\'ordre des faits.',
      'Écris comme tu parlerais à un ami : le style viendra tout seul.',
      'Termine sur ce que ça a changé pour toi.',
    ],
  },
  'ecriture-30-14': {
    tips: [
      'Commence par l\'effet que l\'œuvre t\'a fait, avant d\'expliquer pourquoi.',
      'Choisis 2 ou 3 éléments précis : une scène, une chanson, un personnage.',
      'Pas besoin d\'être expert : ton avis est le sujet.',
    ],
  },
  'ecriture-30-15': {
    tips: [
      'Commence par l\'arrivée : ce qu\'on voit, sent et entend en premier.',
      'Ajoute un imprévu : une rencontre, une panne, un orage.',
      'Cherche un détail vrai du lieu (un plat, un bruit, une coutume) : il rendra la scène crédible.',
    ],
    ideas: { label: 'Un lieu, si tu hésites', items: DREAM_PLACES },
  },

  /* Musique, 5 min */
  'musique-5-1': {
    tips: [
      'Tape le nom du genre suivi de "playlist" et lance le premier titre.',
      'Écoute au moins une minute avant de juger.',
      'Tes 3 mots peuvent être des couleurs, des lieux ou des émotions.',
    ],
  },
  'musique-5-2': {
    tips: [
      'Mets un casque si tu peux, et baisse la luminosité.',
      'Suis un seul instrument du début à la fin, puis un autre à la réécoute.',
      'Pose ton téléphone écran contre la table.',
    ],
    ideas: { label: 'Des morceaux à écouter vraiment', items: CALM_TRACKS, links: 'ecoute' },
  },
  'musique-5-3': {
    tips: [
      'Sur Spotify ou Deezer, la page de l\'artiste montre ses titres les plus écoutés.',
      'Si tu aimes, note son nom : tu as déjà ta prochaine écoute.',
    ],
    ideas: { label: 'Des artistes à découvrir', items: ARTISTS, links: 'ecoute' },
  },
  'musique-5-4': {
    tips: [
      'Crée la playlist une fois pour toutes, par exemple "Coups de cœur Scroll-up".',
      'Pas d\'idée ? Lance la radio d\'un artiste que tu aimes et garde le premier titre qui t\'arrête.',
      'Dans un mois, réécoute-la : c\'est ton journal sonore.',
    ],
  },
  'musique-5-5': {
    tips: ['Écoute la première chanson en entier, sans sauter l\'intro.', 'Regarde la pochette pendant l\'écoute : elle fait partie de l\'album.'],
    ideas: { label: 'Des albums cultes', items: ALBUMS, links: 'ecoute' },
  },
  /* Musique, 15 min */
  'musique-15-6': {
    tips: [
      'Cherche le genre suivi de "classiques" pour tomber sur un titre emblématique.',
      'Lis deux lignes sur l\'origine du genre : l\'écoute change complètement.',
    ],
    ideas: { label: 'Un genre à découvrir', items: MUSIC_GENRES, links: 'ecoute' },
  },
  'musique-15-7': {
    tips: [
      'Commence par le titre qui colle le mieux à ton humeur, puis cherche ses voisins.',
      'Mélange un titre connu, un oublié et une découverte.',
      'Donne-lui un nom qui résume ton mood du moment.',
    ],
  },
  'musique-15-8': {
    tips: [
      'Cherche le titre suivi de "histoire" ou de "signification".',
      'Le site Genius annote les paroles ligne par ligne.',
      'Le podcast Song Exploder fait raconter aux artistes la fabrication d\'une de leurs chansons.',
    ],
  },
  'musique-15-9': {
    tips: ['Écoute les 3 ou 4 premiers titres de sa page, sans en sauter.', 'Choisis ton préféré, et dis pourquoi en un mot.'],
    ideas: { label: 'Des artistes à découvrir', items: ARTISTS, links: 'ecoute' },
  },
  'musique-15-10': {
    tips: [
      'Cherche le nom de l\'artiste suivi de "live" ou de "session".',
      'Les sessions filmées en petit comité montrent souvent une autre facette.',
    ],
    ideas: { label: 'Des sessions live à explorer', items: LIVE_SESSIONS, links: 'video' },
  },
  /* Musique, 30 min */
  'musique-30-11': {
    tips: [
      'Une longue interview en apprend plus que dix extraits.',
      'Écoute comment l\'artiste parle de ses débuts : c\'est souvent là que tout se joue.',
    ],
    ideas: { label: 'Des sessions live à explorer', items: LIVE_SESSIONS, links: 'video' },
  },
  'musique-30-12': {
    tips: [
      'Avec 30 minutes, choisis un album court, ou garde la fin pour plus tard.',
      'Écoute dans l\'ordre, sans lecture aléatoire : l\'ordre a été pensé.',
      'Note le titre qui t\'a le plus marqué.',
    ],
    ideas: { label: 'Des albums à écouter en entier', items: ALBUMS, links: 'ecoute' },
  },
  'musique-30-13': {
    tips: [
      'Va voir ses premiers albums, ses faces B et ses collaborations.',
      'Trie par date et écoute un titre par époque.',
      'Garde ta trouvaille dans ta playlist "coups de cœur".',
    ],
  },
  'musique-30-14': {
    tips: [
      'Sur la page d\'un artiste, regarde "Les fans aiment aussi" (Spotify) ou "Artistes similaires" (Deezer).',
      'Lance la radio d\'un artiste que tu aimes et laisse-toi porter.',
      'Garde le premier nom qui t\'arrête.',
    ],
  },
  'musique-30-15': {
    tips: ['Cherche une playlist toute faite plutôt que d\'en construire une.', 'Garde une note ouverte pour tes 3 titres à retenir.'],
    ideas: { label: 'Des thèmes de playlist', items: PLAYLIST_THEMES, links: 'ecoute', suffix: 'playlist' },
  },

  /* Cinéma, 5 min */
  'cinema-5-1': {
    tips: ['Regarde-la en grand, le son un peu fort.', 'Ensuite, une seule question : as-tu envie de voir la suite ?'],
  },
  'cinema-5-2': {
    tips: [
      'JustWatch te dit où le voir ; Wikipédia ou Allociné donnent le résumé.',
      'Note-le dans ta liste même si tu hésites : tu trieras plus tard.',
    ],
  },
  'cinema-5-3': {
    tips: ['Les 5 premières minutes disent souvent tout du ton du film.', 'Ne regarde pas la bande-annonce avant : découvre-le pour de vrai.'],
    ideas: { label: 'Des films cultes', items: CULT_FILMS, links: 'film' },
  },
  'cinema-5-4': {
    tips: [
      'Cherche le titre du film suivi de "scène culte", ou la réplique elle-même.',
      'Regarde-la deux fois : la deuxième, fais attention à la musique et au cadre.',
    ],
  },
  'cinema-5-5': {
    tips: ['Lis seulement le résumé, jamais la fin.', 'Choisis à l\'instinct, puis note-le pour plus tard.'],
    ideas: { label: 'Trois films, si tu veux', items: FILMS, links: 'film' },
  },
  /* Cinéma, 15 min */
  'cinema-15-6': {
    tips: [
      'Beaucoup de courts-métrages sont en ligne gratuitement, sur YouTube ou Arte.',
      'Regarde-le sans pause : un court se savoure d\'une traite.',
    ],
  },
  'cinema-15-7': {
    tips: [
      'La page Wikipédia du réalisateur ou du studio liste tous les films, dans l\'ordre.',
      'Choisis un film des débuts : c\'est souvent là que tout commence.',
    ],
    ideas: { label: 'Des réalisateurs et des studios', items: DIRECTORS, links: 'video', suffix: 'filmographie' },
  },
  'cinema-15-8': {
    tips: [
      'Cherche le titre du film suivi de "making of" ou de "coulisses".',
      'Les bonus des DVD sont souvent en ligne, sur la chaîne du studio.',
    ],
  },
  'cinema-15-9': {
    tips: [
      'Choisis un film très connu du genre : c\'est la meilleure porte d\'entrée.',
      'Regarde l\'extrait en te demandant ce que les fans y aiment.',
    ],
    ideas: { label: 'Un genre à oser', items: AVOIDED_GENRES, links: 'video', suffix: 'film extrait' },
  },
  'cinema-15-10': {
    tips: [
      'Letterboxd, SensCritique ou une simple note sur ton téléphone font l\'affaire.',
      'Mélange les époques, les pays et les genres.',
      'Pour chaque film, une ligne : pourquoi tu as envie de le voir.',
    ],
    ideas: { label: 'Des idées pour ta liste', items: [...new Set([...FILMS, ...CULT_FILMS])], show: 5, links: 'film' },
  },
  /* Cinéma, 30 min */
  'cinema-30-11': {
    tips: [
      'Regarde le top de la semaine sur ta plateforme, ou les sorties sur Allociné.',
      'JustWatch montre ce qui est populaire, toutes plateformes confondues.',
    ],
  },
  'cinema-30-12': {
    tips: [
      'Avec 30 minutes, choisis un long épisode, ou regarde le film en deux fois.',
      'Lumière éteinte, téléphone posé : comme au cinéma.',
    ],
    ideas: { label: 'Des films à voir', items: FILMS, links: 'film' },
  },
  'cinema-30-13': {
    tips: [
      'Fais une frise : les films, les séries, les jeux, les livres.',
      'Cherche ce qui relie les épisodes : un thème, un objet, une musique.',
    ],
  },
  'cinema-30-14': {
    tips: [
      'Les essais vidéo durent souvent 10 à 20 minutes : parfait pour une demi-heure.',
      'Après, revois la scène analysée : tu ne la verras plus pareil.',
    ],
    ideas: { label: 'Des chaînes d’analyse', items: ANALYSIS_CHANNELS, links: 'video' },
  },
  'cinema-30-15': {
    tips: [
      'Sur Letterboxd ou SensCritique, regarde les listes qui contiennent ton film préféré.',
      'Cherche "films comme" suivi de ton film : des listes toutes faites t\'attendent.',
    ],
  },
}

/* ----------------------------------------------------------------- Piano */

// Les leçons des parcours reprennent des bouts de ces airs.
const AU_CLAIR_DE_LA_LUNE = melody('Au clair de la lune', 'C4 C4 C4 D4 E4 D4 | C4 E4 D4 D4 C4')
const ODE_A_LA_JOIE = melody('Ode à la joie', 'E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 E4 D4 D4')
const CINQ_DOIGTS = melody('Do Ré Mi Fa Sol, aller-retour', 'C4 D4 E4 F4 G4 | F4 E4 D4 C4')
const GAMME_DE_DO = melody('La gamme de Do', 'C4 D4 E4 F4 G4 A4 B4 C5 | B4 A4 G4 F4 E4 D4 C4')

/** Des morceaux qui font envie, à travailler avec un tutoriel vidéo. */
const PIECES_TO_READ = [
  'Menuet en sol (Petzold)', 'Prélude en do majeur (Bach)', 'Gymnopédie n° 1 (Satie)', 'Comptine d\'un autre été (Yann Tiersen)',
  'River Flows in You (Yiruma)', 'Clair de lune (Debussy, le début)', 'Nuvole Bianche (Einaudi)', 'Arabesque n° 1 (Debussy)',
]

/**
 * Les chansons que tout le monde a envie de jouer, et qu'on ne peut pas
 * recopier note à note ici (elles ne sont pas libres de droits) : on les
 * apprend avec un tuto vidéo.
 */
const SONGS_IN_VIDEO = [
  'La Vie en rose', 'Hallelujah', 'Let It Be', 'Imagine', 'Someone Like You', 'All of Me', 'Perfect', 'Shallow',
  'Comptine d\'un autre été', 'River Flows in You', 'Interstellar', 'Pirates des Caraïbes', 'La La Land (Mia & Sebastian)',
  'Harry Potter (Hedwige)', 'Game of Thrones', 'Le Fabuleux Destin d\'Amélie Poulain', 'Je te promets', 'L\'Hymne à l\'amour',
]
const SONGS_IDEAS: IdeaList = { label: 'D\'autres chansons, en tuto vidéo', items: SONGS_IN_VIDEO, links: 'video', suffix: 'piano tutoriel facile' }

// ⚠️ Comme les activités Piano, ces textes sont nouveaux : à relire. Les
// mélodies sont des airs du domaine public, transposés pour tenir sur le
// clavier de l'appli (deux octaves autour du do central). « | » sépare les
// phrases (une ligne à l'écran), « || » les parties d'apprentissage.
const RAW_PIANO_GUIDES: Record<string, RawGuide> = {
  /* Piano, 5 min : des chansons courtes, à une main */
  'piano-5-1': {
    tips: [
      'Pouce droit sur le Do du milieu (le point sur le clavier), un doigt par touche jusqu\'au Sol.',
      'La deuxième partie descend sous le Do : la main glisse un peu vers la gauche.',
      'Chante les paroles dans ta tête en jouant : le rythme vient tout seul.',
    ],
    melody: melody('Au clair de la lune', 'C4 C4 C4 D4 E4 D4 | C4 E4 D4 D4 C4 | C4 C4 C4 D4 E4 D4 | C4 E4 D4 D4 C4 || D4 D4 D4 D4 A3 A3 | D4 C4 B3 A3 G3 | C4 C4 C4 D4 E4 D4 | C4 E4 D4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-5-2': {
    tips: [
      'Chaque phrase se joue deux fois : apprends-en une, tu en sais deux.',
      'Le « Sol » grave de la fin (« Ding, dang, dong ») est sous le Do du milieu.',
      'Rejoue-la en canon dans ta tête : c\'est le principe de la chanson.',
    ],
    melody: melody('Frère Jacques', 'C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4 | E4 F4 G4 || G4 A4 G4 F4 E4 C4 | G4 A4 G4 F4 E4 C4 | C4 G3 C4 | C4 G3 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-5-3': {
    tips: [
      'Chaque note se joue deux fois, sauf la dernière de la phrase.',
      'La phrase du milieu descend marche par marche, deux fois de suite.',
      'La fin reprend le début : tu la connais déjà.',
    ],
    melody: melody('Ah ! vous dirai-je, maman', 'C4 C4 G4 G4 A4 A4 G4 | F4 F4 E4 E4 D4 D4 C4 || G4 G4 F4 F4 E4 E4 D4 | G4 G4 F4 F4 E4 E4 D4 || C4 C4 G4 G4 A4 A4 G4 | F4 F4 E4 E4 D4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-5-4': {
    tips: [
      '« Vive le vent, vive le vent » : trois Mi, puis encore trois Mi.',
      'Le Sol, le Do, le Ré : la main bouge un peu, garde le pouce près du Do.',
      'La deuxième partie ne change qu\'à la toute fin : Sol Sol Fa Ré Do.',
    ],
    melody: melody('Vive le vent, le refrain', 'E4 E4 E4 | E4 E4 E4 | E4 G4 C4 D4 E4 | F4 F4 F4 F4 | F4 E4 E4 E4 E4 | E4 D4 D4 E4 | D4 G4 || E4 E4 E4 | E4 E4 E4 | E4 G4 C4 D4 E4 | F4 F4 F4 F4 | F4 E4 E4 E4 E4 | G4 G4 F4 D4 | C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-5-5': {
    tips: [
      'Ça commence sous le Do du milieu, sur le Sol grave.',
      'Le grand saut de « cher… » monte d\'une octave : du Sol grave au Sol aigu.',
      'Joue-la lentement : tout le monde chantera par-dessus.',
    ],
    melody: melody('Joyeux anniversaire', 'G3 G3 A3 G3 C4 B3 | G3 G3 A3 G3 D4 C4 | G3 G3 G4 E4 C4 B3 A3 | F4 F4 E4 C4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  /* Piano, 15 min : des airs plus longs, en plusieurs parties */
  'piano-15-6': {
    tips: [
      'Pouce sur le Do, mais l\'air commence sur Mi, avec le 3e doigt.',
      'Les parties 1, 2 et 4 se ressemblent : seule la fin change (Ré Ré, puis Do Do).',
      'La partie 3 est le pont : elle descend jusqu\'au Sol grave avant de repartir.',
    ],
    melody: melody('Ode à la joie', 'E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 E4 D4 D4 || E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 D4 C4 C4 || D4 D4 E4 C4 D4 E4 F4 E4 C4 | D4 E4 F4 E4 D4 C4 D4 G3 || E4 E4 F4 G4 G4 F4 E4 D4 | C4 C4 D4 E4 D4 C4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-15-7': {
    tips: [
      'Do Mi Fa Sol : la même montée revient trois fois.',
      'Tiens le Sol un peu plus longtemps à chaque fois, comme une fanfare.',
      'La deuxième partie redescend vers le Do : c\'est la fin de la parade.',
    ],
    melody: melody('When the Saints Go Marching In', 'C4 E4 F4 G4 | C4 E4 F4 G4 | C4 E4 F4 G4 E4 C4 E4 D4 || E4 E4 D4 C4 C4 E4 G4 G4 F4 | E4 F4 G4 E4 C4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-15-8': {
    tips: [
      'Tout doux : le doigt se pose plus qu\'il ne frappe.',
      'Le saut vers le Do aigu revient souvent : repère-le du regard avant de jouer.',
      'Joue-la deux fois plus lentement que tu ne le penses.',
    ],
    melody: melody('Berceuse de Brahms', 'E4 E4 G4 E4 E4 G4 | E4 G4 C5 B4 A4 A4 G4 | D4 E4 F4 D4 D4 E4 F4 | D4 F4 B4 A4 G4 B4 C5 || C4 C4 C5 A4 F4 G4 | E4 C4 F4 G4 A4 G4 | C4 C4 C5 A4 F4 G4 | E4 C4 F4 E4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-15-9': {
    tips: [
      'Cinq notes seulement : Do, Ré, Mi, Sol, La. Aucune ne sonne faux.',
      'Sol Mi Ré Do Ré Mi : le soleil se lève, la phrase monte et redescend.',
      'Laisse chaque note sonner, comme une flûte au petit matin.',
    ],
    melody: melody('Au matin (Grieg)', 'G4 E4 D4 C4 D4 E4 | G4 E4 D4 C4 D4 E4 D4 E4 | G4 E4 G4 A4 E4 A4 G4 E4 D4 C4'),
    ideas: SONGS_IDEAS,
  },
  'piano-15-10': {
    tips: [
      'Do Sol Do, Sol Do Sol : des sauts nets, sans traîner.',
      'La deuxième phrase fait le même dessin, un cran plus bas, sur Fa et Ré.',
      'Termine sur le Sol grave, bien posé.',
    ],
    melody: melody('Une petite musique de nuit (Mozart)', 'C4 G3 C4 G3 C4 G3 C4 E4 G4 | F4 D4 F4 D4 F4 D4 B3 D4 G3'),
    ideas: SONGS_IDEAS,
  },
  /* Piano, 30 min : des morceaux classiques, partie par partie */
  'piano-30-11': {
    tips: [
      'Mi Ré♯ Mi Ré♯ Mi : la touche noire juste à gauche du Mi, en balancier.',
      'Après le La, la main remonte en arpège : Do Mi La, puis Si.',
      'Apprends la partie 1 jusqu\'à la jouer sans regarder, puis la 2 : elles se ressemblent.',
    ],
    melody: melody('Lettre à Élise (Beethoven)', 'E4 D#4 E4 D#4 E4 B3 D4 C4 A3 | C3 E3 A3 B3 | E3 G#3 B3 C4 || E3 E4 D#4 E4 D#4 E4 B3 D4 C4 A3 | C3 E3 A3 B3 | E3 C4 B3 A3'),
    ideas: SONGS_IDEAS,
  },
  'piano-30-12': {
    tips: [
      'Trois temps par mesure : un, deux, trois, comme une danse.',
      'Le Fa est dièse : la touche noire juste à droite du Fa.',
      'Partie 1, la montée ; partie 2, la descente ; partie 3, la fin qui se pose sur le Sol.',
    ],
    melody: melody('Menuet en sol (Petzold)', 'D4 G3 A3 B3 C4 D4 G3 G3 | E4 C4 D4 E4 F#4 G4 G3 G3 || C4 D4 C4 B3 A3 B3 C4 B3 A3 G3 | F#3 G3 A3 B3 G3 A3 || C4 D4 C4 B3 A3 B3 C4 B3 A3 G3 | A3 B3 A3 G3 F#3 G3'),
    ideas: SONGS_IDEAS,
  },
  'piano-30-13': {
    tips: [
      'Le thème descend marche par marche : Mi Ré Do Si La Sol, puis remonte.',
      'Chaque note est longue : laisse-la sonner jusqu\'à la suivante.',
      'La deuxième phrase fait le même chemin, un cran plus bas.',
    ],
    melody: melody('Canon de Pachelbel (le thème)', 'E4 D4 C4 B3 A3 G3 A3 B3 | C4 B3 A3 G3 F3 E3 F3 D3'),
    ideas: SONGS_IDEAS,
  },
  'piano-30-14': {
    tips: [
      'Si La Sol♯ La Do : un petit tour autour du La, très léger.',
      'Le même dessin remonte : Ré Do Si Do Mi.',
      'Joue-la lentement et régulière : la vitesse vient toute seule.',
    ],
    melody: melody('Marche turque (Mozart)', 'B3 A3 G#3 A3 C4 | D4 C4 B3 C4 E4 || F4 E4 D#4 E4 B4 A4 G#4 A4 | B4 A4 G#4 A4 C5'),
    ideas: SONGS_IDEAS,
  },
  'piano-30-15': {
    tips: [
      'Trois temps par mesure, avec un balancement : long, court, long, court.',
      'Le Sol♯ est la touche noire juste à droite du Sol.',
      'Le refrain (parties 3 et 4) monte plus haut : prends ton temps.',
    ],
    melody: melody('Greensleeves', 'A3 C4 D4 E4 F4 E4 D4 B3 | G3 A3 B3 C4 A3 A3 G#3 A3 B3 G#3 E3 || A3 C4 D4 E4 F4 E4 D4 B3 | G3 A3 B3 C4 B3 A3 G#3 F#3 G#3 A3 A3 || G4 G4 F#4 E4 D4 B3 | G3 A3 B3 C4 A3 A3 G#3 A3 B3 G#3 E3 || G4 G4 F#4 E4 D4 B3 | G3 A3 B3 C4 B3 A3 G#3 F#3 G#3 A3 A3'),
    ideas: SONGS_IDEAS,
  },

  /* Piano, les parcours : des pistes propres à chaque leçon */
  'parcours-premieres-touches-1': {
    tips: ['Les 2 touches noires, puis les 3, puis les 2… le motif se répète tout le long du clavier.', 'Le Do est juste à gauche des 2 noires.'],
    melody: melody('Les trois Do du clavier', 'C3 C4 C5'),
  },
  'parcours-premieres-touches-2': {
    tips: ['Doigts arrondis, comme posés sur une balle.', 'Chaque note aussi forte que la précédente : écoute-toi.'],
    melody: CINQ_DOIGTS,
  },
  'parcours-premieres-touches-3': {
    tips: ['Ne bouge pas la main : chaque doigt a sa touche.', 'Joue la première moitié jusqu\'à la savoir, puis la seconde.'],
    melody: AU_CLAIR_DE_LA_LUNE,
  },
  'parcours-premieres-touches-4': {
    tips: ['Compte à voix haute, même si ça paraît bizarre.', 'Mieux vaut un tempo lent tenu jusqu\'au bout qu\'un tempo rapide qui s\'effondre.'],
    melody: AU_CLAIR_DE_LA_LUNE,
  },
  'parcours-premieres-touches-5': {
    tips: ['À la main gauche, l\'auriculaire (5) est sur le Do et le pouce sur le Sol.', 'La main gauche est plus lente au début : c\'est normal, sois patient·e.'],
    melody: melody('Main gauche : Do Ré Mi Fa Sol', 'C3 D3 E3 F3 G3 | F3 E3 D3 C3'),
  },
  'parcours-premieres-touches-6': {
    tips: ['Apprends la première ligne, puis la deuxième, puis enchaîne.', 'Le 3e doigt commence, sur le Mi.'],
    melody: ODE_A_LA_JOIE,
  },
  'parcours-premiers-morceaux-1': {
    tips: ['Deux fois la même phrase, puis deux fois la suivante : repère les répétitions.', 'Le Sol est un peu loin : prépare le 5e doigt à l\'avance.'],
    melody: melody('Frère Jacques', 'C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4 | E4 F4 G4'),
  },
  'parcours-premiers-morceaux-2': {
    tips: ['Le pouce glisse sous la main, sans que le poignet ne bouge.', 'En redescendant, c\'est le 3e doigt qui passe par-dessus le pouce.'],
    melody: GAMME_DE_DO,
  },
  'parcours-premiers-morceaux-3': {
    tips: ['Doigts 5, 3 et 1 de la main gauche pour chaque accord.', 'D\'abord note par note, puis les trois ensemble.'],
    melody: melody('Do, Fa et Sol, note après note', 'C3 E3 G3 | F3 A3 C4 | G3 B3 D4'),
  },
  'parcours-premiers-morceaux-4': {
    tips: ['La main gauche ne bouge presque pas : laisse-la tenir pendant que la droite joue.', 'Commence très lentement, une note de main droite à la fois.'],
    melody: melody('Basse et mélodie : Au clair de la lune', 'C3 C4 C4 C4 D4 E4 D4 | G3 C4 E4 D4 D4 C4'),
  },
  'parcours-premiers-morceaux-5': {
    tips: ['Main gauche : un accord sur le premier temps de chaque mesure, c\'est tout.', 'Joue d\'abord les mains séparées, puis ensemble à mi-vitesse.'],
    melody: ODE_A_LA_JOIE,
  },
  'parcours-premiers-morceaux-6': {
    tips: ['Une fausse note ? Continue jusqu\'au bout.', 'Écoute-toi une fois sans juger, juste pour entendre ton chemin.'],
    melody: melody('Ode à la joie, basse et mélodie', 'C3 E4 E4 F4 G4 | G3 G4 F4 E4 D4 | C3 C4 C4 D4 E4 | G3 E4 D4 D4'),
  },
  'parcours-jouer-pour-de-vrai-1': {
    tips: ['Lignes : « Mi Sol Si Ré Fa » ; interlignes : « Fa La Do Mi ».', 'Le Do central est sur une petite ligne en dessous de la portée.'],
    melody: melody('Lignes Mi Sol Si, interlignes Fa La Do', 'E4 G4 B4 | F4 A4 C5'),
  },
  'parcours-jouer-pour-de-vrai-2': {
    tips: ['Le Fa est dièse : c\'est la touche noire juste à droite du Fa.', 'Même doigté que la gamme de Do, en partant de Sol.'],
    melody: melody('La gamme de Sol', 'G3 A3 B3 C4 D4 E4 F#4 G4'),
  },
  'parcours-jouer-pour-de-vrai-3': {
    tips: ['Do-Mi-Sol, Sol-Si-Ré, La-Do-Mi, Fa-La-Do : quatre accords, trois notes chacun.', 'Laisse sonner : la pédale de droite aide, si tu en as une.'],
    melody: melody('Do, Sol, La mineur, Fa en arpèges', 'C3 E3 G3 | G3 B3 D4 | A3 C4 E4 | F3 A3 C4'),
  },
  'parcours-jouer-pour-de-vrai-4': {
    tips: ['« Joyeux anniversaire » commence par deux notes pareilles, puis monte.', 'Chante, cherche, rejoue : c\'est comme ça que tout le monde fait.'],
    melody: melody('Joyeux anniversaire, en partant de Sol', 'G3 G3 A3 G3 C4 B3 | G3 G3 A3 G3 D4 C4'),
  },
  'parcours-jouer-pour-de-vrai-5': {
    tips: ['Piano : les doigts près des touches. Forte : le poids du bras.', 'Legato : une note ne s\'arrête que quand la suivante commence.'],
    melody: { ...ODE_A_LA_JOIE, title: 'Ode à la joie, une fois doux, une fois fort' },
  },
  'parcours-jouer-pour-de-vrai-6': {
    tips: ['Choisis un morceau un peu en dessous de ce que tu crois pouvoir jouer.', 'Quatre mesures par séance, c\'est déjà beaucoup.'],
    melody: melody('Pour commencer : Lettre à Élise', 'E4 D#4 E4 D#4 E4 | B3 D4 C4 A3'),
    ideas: { label: 'Des morceaux qui font envie', items: PIECES_TO_READ, links: 'video', suffix: 'piano tutoriel' },
  },
}

/** Pour les étapes de parcours : des pistes générales, par passion. */
const RAW_PASSION_TIPS: Record<PassionId, string[]> = {
 sport: ['Prends ton temps et garde une amplitude confortable.'],
 rythme: ['Pose la grosse caisse sur les temps, puis varie.'], logique: ['Chaque personne occupe une seule place. Croise les indices avant de conclure.'], francais: ['Identifie le sujet et le temps avant de choisir la forme.'],
  dessin: [
    'Commence léger, renforce à la fin.',
    'Regarde ton sujet plus longtemps que ta feuille.',
    'Un dessin raté t\'apprend autant qu\'un réussi.',
  ],
  ecriture: [
    'Écris d\'abord, corrige après.',
    'Relis ta dernière phrase à voix basse : elle te soufflera la suivante.',
    'Si tu bloques, change de point de vue.',
  ],
  musique: [
    'Un casque change tout.',
    'Écoute une fois pour le plaisir, une fois pour les détails.',
    'Note un mot pendant l\'écoute, pas après.',
  ],
  cinema: [
    'Grand écran, téléphone loin.',
    'Revois un passage en coupant le son : l\'image raconte tout.',
    'Note la scène qui t\'a le plus marqué.',
  ],
  piano: [
    'Lentement et juste vaut mieux que vite et faux.',
    'Main arrondie, poignet souple, épaules basses.',
    'Pas de piano sous la main ? Le clavier de l\'appli, sous la leçon, est là pour ça.',
  ],
}

const UNIT_LABELS: Record<GoalUnit, [string, string]> = {
  mots: ['mot', 'mots'],
  lignes: ['ligne', 'lignes'],
  phrases: ['phrase', 'phrases'],
}

function buildGuide(raw: RawGuide): ActivityGuide {
  return {
    tips: raw.tips.map(frenchTypography),
    ...(raw.ideas ? { ideas: { ...raw.ideas, label: frenchTypography(raw.ideas.label), items: raw.ideas.items.map(frenchTypography) } } : {}),
    ...(raw.goal ? { goal: { ...raw.goal, label: frenchTypography(raw.goal.label ?? `${raw.goal.count} ${UNIT_LABELS[raw.goal.unit][raw.goal.count > 1 ? 1 : 0]}`) } } : {}),
    ...(raw.melody ? { melody: { ...raw.melody, title: frenchTypography(raw.melody.title) } } : {}),
  }
}

export const GUIDES: Readonly<Record<string, ActivityGuide>> = Object.fromEntries(
  Object.entries({ ...RAW_GUIDES, ...RAW_PIANO_GUIDES }).map(([id, raw]) => [id, buildGuide(raw)]),
)

const PASSION_GUIDES: Record<PassionId, ActivityGuide> = {
 sport: buildGuide({tips: RAW_PASSION_TIPS.sport}), rythme: buildGuide({tips: RAW_PASSION_TIPS.rythme}), logique: buildGuide({tips: RAW_PASSION_TIPS.logique}), francais: buildGuide({tips: RAW_PASSION_TIPS.francais}),
  dessin: buildGuide({ tips: RAW_PASSION_TIPS.dessin }),
  ecriture: buildGuide({ tips: RAW_PASSION_TIPS.ecriture }),
  musique: buildGuide({ tips: RAW_PASSION_TIPS.musique }),
  cinema: buildGuide({ tips: RAW_PASSION_TIPS.cinema }),
  piano: buildGuide({ tips: RAW_PASSION_TIPS.piano }),
}

/**
 * Piano : la mélodie qui se joue sur le clavier de l'appli, pour un tuto de
 * chanson comme pour une leçon de parcours. Toutes en ont une : dès qu'elle
 * est jouée jusqu'au bout, l'activité est réussie, sans attendre une durée.
 */
export function keyboardMelody(activityId: string): Melody | undefined {
  const activity = getPathStep(activityId) ?? getActivity(activityId)
  return activity?.passion === 'piano' ? GUIDES[activityId]?.melody : undefined
}

/** Le guide d'une activité ; pour une étape de parcours ou un mot du jour, les pistes générales de sa passion. */
export function guideFor(activityId: string): ActivityGuide | undefined {
  const guide = GUIDES[activityId]
  if (guide) return guide
  const fixed = getPathStep(activityId) ?? getChallengeActivity(activityId)
  return fixed ? PASSION_GUIDES[fixed.passion] : undefined
}

/** Les liens à proposer pour ce que l'appli a tiré (genre musical, film…). */
export const EXTRA_LINKS: Partial<Record<ExtraKind, LinkKind>> = {
  'genre-musical': 'ecoute',
  film: 'film',
  'film-ou-anime': 'film',
  'court-ou-episode': 'regarder',
}

/* ------------------------------------------------------------ défis en plus */

export interface Palette {
  name: string
  /** Trois couleurs, en hexadécimal. */
  colors: readonly [string, string, string]
}

export const PALETTES: readonly Palette[] = [
  { name: 'Coucher de soleil', colors: ['#FF6B35', '#F7C59F', '#2E294E'] },
  { name: 'Forêt', colors: ['#2D6A4F', '#95D5B2', '#7F5539'] },
  { name: 'Océan', colors: ['#03045E', '#00B4D8', '#CAF0F8'] },
  { name: 'Bonbon', colors: ['#FF8FAB', '#FFC8DD', '#A2D2FF'] },
  { name: 'Rétro', colors: ['#E63946', '#F1FAEE', '#457B9D'] },
  { name: 'Automne', colors: ['#BC6C25', '#DDA15E', '#606C38'] },
  { name: 'Néon', colors: ['#F72585', '#7209B7', '#4CC9F0'] },
  { name: 'Désert', colors: ['#E9C46A', '#F4A261', '#264653'] },
]

export interface Challenge {
  text: string
  /** Pour « en 3 couleurs » : la palette tirée. */
  palette?: Palette
}

const DRAWING_CHALLENGES = [
  'Sans lever le crayon.',
  'Avec ta main non dominante.',
  'Uniquement avec des formes géométriques.',
  'Sans gomme : on assume chaque trait.',
  'Que des lignes droites.',
  'En moins de 20 traits.',
  'En regardant ton sujet, pas ta feuille (le dessin "à l\'aveugle").',
  'Que du noir : ombres et silhouettes.',
  'En partant d\'une tache ou d\'un gribouillis.',
  'En ajoutant un détail complètement absurde.',
] as const

const WRITING_CHALLENGES = [
  'Au présent, et en tutoyant ton lecteur.',
  'Sans aucun adjectif.',
  'Avec au moins trois répliques de dialogue.',
  'Avec une chute inattendue à la toute fin.',
  'En phrases de 8 mots maximum.',
  'Du point de vue d\'un objet.',
  'Avec une odeur, un son et une couleur.',
  'En commençant par la fin.',
  'Sans jamais utiliser le mot "je".',
] as const

export const PALETTE_CHALLENGE = 'En 3 couleurs seulement :'

/** Un défi en plus pour le dessin ou l'écriture (rien pour Musique et Cinéma). */
export function drawChallenge(passion: PassionId, random: () => number = Math.random): Challenge | null {
  if (passion === 'dessin') {
    // Une fois sur trois : une palette de trois couleurs.
    if (random() < 1 / 3) return { text: PALETTE_CHALLENGE, palette: sample(PALETTES, 1, random)[0]! }
    return { text: frenchTypography(sample(DRAWING_CHALLENGES, 1, random)[0]!) }
  }
  if (passion === 'ecriture') {
    if (random() < 1 / 4) return { text: frenchTypography(`En glissant le mot "${sample(WORDS, 1, random)[0]!}" quelque part.`) }
    return { text: frenchTypography(sample(WRITING_CHALLENGES, 1, random)[0]!) }
  }
  return null
}

/* ------------------------------------------------------------------ outils */

/** Un hasard reproductible : la même graine donne toujours la même suite (mêmes idées pour une proposition). */
export function seededRandom(seed: string): () => number {
  let state = 2166136261
  for (let index = 0; index < seed.length; index++) state = Math.imul(state ^ seed.charCodeAt(index), 16777619)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Ce que compte le carnet d'écriture pour un objectif. */
export function countFor(unit: GoalUnit, text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  if (unit === 'mots') return trimmed.split(/\s+/).length
  if (unit === 'lignes') return trimmed.split('\n').filter((line) => line.trim()).length
  // Phrases : chaque ponctuation finale, plus la phrase en cours d'écriture.
  const ended = trimmed.match(/[.!?…]+(?=\s|$)/g)?.length ?? 0
  return /[.!?…]$/.test(trimmed) ? ended : ended + 1
}

/** « 3 phrases », « 1 mot ». */
export function unitLabel(unit: GoalUnit, count: number): string {
  return UNIT_LABELS[unit][count > 1 ? 1 : 0]
}
