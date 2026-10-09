import { definePassionActivities } from './define'

/* ============================================================================
 *  AUDIOVISUEL : cinéma, animation, montage vidéo
 * ========================================================================== */

export const cinema = definePassionActivities('cinema', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Pitch façon bande-annonce', description: 'Résume le dernier film que tu as vu en 3 phrases de bande-annonce : « Dans un monde où… ».' },
    { duration: 5, level: 'debutant', title: 'Le plan qui t’a marqué', description: 'Cherche en image un plan de film que tu trouves magnifique et note en trois mots pourquoi : cadrage, couleur, lumière.' },
    { duration: 15, title: 'Court-métrage d’école', description: 'Regarde un court-métrage de fin d’études de l’école des Gobelins (sur leur chaîne YouTube) et note la scène que tu retiens.' },
    { duration: 15, title: 'Remake en un plan', description: 'Choisis une réplique culte et rejoue-la dans ta chambre en te filmant avec ton téléphone, en un seul plan.' },
    { duration: 30, title: 'La Jetée', description: 'Regarde « La Jetée » de Chris Marker (28 min, presque entièrement en photos fixes) et note comment on peut raconter sans images qui bougent.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Musique de film, yeux fermés', description: 'Écoute un thème de Joe Hisaishi, Hans Zimmer ou Ennio Morricone les yeux fermés et imagine la scène qu’il accompagne.' },
    { duration: 5, level: 'debutant', title: 'Ton top 3', description: 'Note tes 3 films préférés de l’année avec, pour chacun, une phrase sur ce qu’il t’a laissé.' },
    { duration: 15, title: 'Court-métrage Pixar', description: 'Regarde « Piper », « Bao » ou « La Luna » et résume en une phrase l’émotion que le film t’a laissée.' },
    { duration: 15, title: 'Compter les plans', description: 'Revois ta scène préférée d’un film que tu connais par cœur et compte ses plans. Note le plus long.' },
    { duration: 30, title: 'Documentaire court', description: 'Regarde un court documentaire gratuit (arte.tv en propose beaucoup) et note une chose que tu ne savais pas.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Réplique de réconfort', description: 'Retrouve une réplique de film qui te fait du bien, écris-la sur un papier et colle-la près de ton lit.' },
    { duration: 5, level: 'debutant', title: 'Générique de fin', description: 'Écoute la musique du générique d’un film que tu aimes et note le souvenir qu’elle te rappelle.' },
    { duration: 15, title: 'Hair Love', description: 'Regarde « Hair Love » (7 min, Oscar du court-métrage d’animation 2020) ou un autre court qui fait du bien, et note ce qui t’a touché.' },
    { duration: 15, title: 'La liste des jours gris', description: 'Fais la liste de 5 films à revoir quand ça ne va pas, avec pour chacun la scène qui te remonte le moral.' },
    { duration: 30, title: 'Film d’enfance', description: 'Regarde les 30 premières minutes d’un film de ton enfance et note ce que tu remarques aujourd’hui et que tu n’avais pas vu à l’époque.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Un film, un mot', description: 'Résume un film en un seul mot, puis imagine son affiche à partir de ce mot : décris-la ou griffonne-la.' },
    { duration: 5, title: 'Pitch au hasard', description: 'Combine un genre (horreur, comédie musicale, western) avec un objet de ta pièce et écris le pitch du film en 2 phrases.' },
    { duration: 15, title: 'La palette d’un cinéaste', description: 'Regarde des captures d’un film de Wes Anderson ou de Wong Kar-wai et note les 5 couleurs dominantes : c’est sa palette.' },
    { duration: 15, title: 'Ouverture en plan-séquence', description: 'Filme ta pièce en un seul plan de 30 secondes, comme l’ouverture d’un film, en révélant les objets un par un.' },
    { duration: 30, title: 'Storyboard d’une scène culte', description: 'Redessine une scène que tu adores en 8 cases de storyboard, avec le type de plan (large, moyen, gros plan) sous chaque case.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Un plan contemplatif', description: 'Trouve un long plan tranquille d’un film de Miyazaki (un paysage, un train, un repas) et regarde-le sans rien faire d’autre.' },
    { duration: 5, title: 'Écouter une scène', description: 'Écoute 2 minutes d’une scène les yeux fermés et note tous les sons que tu entends, même les plus discrets.' },
    { duration: 15, title: 'Court-métrage sans dialogue', description: 'Regarde un court-métrage sans paroles et note en 2 lignes ce qu’il raconte sans un mot.' },
    { duration: 15, level: 'debutant', title: 'Journal de spectateur', description: 'Ouvre un carnet (ou une appli comme Letterboxd) et note tes 5 derniers films vus, chacun avec une note sur 5.' },
    { duration: 30, title: 'Première demi-heure Ghibli', description: 'Regarde la première demi-heure de « Mon voisin Totoro » ou de « Kiki la petite sorcière » et note les moments où il ne se passe « rien ».' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Respirer avec l’écran', description: 'Lance une vidéo de « slow TV » (vagues, feu de cheminée, train) et respire au rythme de l’image pendant 5 minutes.' },
    { duration: 5, title: 'Réécrire la fin', description: 'Imagine ce qui te stresse comme une scène de film : quel genre, quelle musique ? Réécris sa fin en 5 lignes.' },
    { duration: 15, level: 'debutant', title: 'Burlesque', description: 'Regarde un court-métrage de Buster Keaton ou de Charlie Chaplin et note le gag qui t’a fait rire.' },
    { duration: 15, title: 'Démonter le suspense', description: 'Regarde une scène à suspense et note comment le film fabrique la tension : musique, durée des plans, silences.' },
    { duration: 30, title: 'Documentaire nature', description: 'Regarde 30 minutes d’un documentaire animalier et note trois plans que tu trouves beaux.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Bruitage maison', description: 'Coupe le son d’une scène d’action d’une minute et fais tous les bruitages toi-même, à fond.' },
    { duration: 5, level: 'debutant', title: 'Casting à fond', description: 'Joue 3 répliques cultes de films d’action avec une intensité maximale, comme si tu passais un casting.' },
    { duration: 15, title: 'Course-poursuite d’appartement', description: 'Filme 10 plans de 2 secondes d’une « course-poursuite » chez toi (portes, escaliers, pieds) et monte-les à la suite.' },
    { duration: 15, title: 'Chorégraphie à la Jackie Chan', description: 'Regarde une scène de combat de Jackie Chan et reproduis 3 mouvements au ralenti, puis en vitesse réelle, dans un espace dégagé.' },
    { duration: 30, title: 'Film d’une minute en 30 minutes', description: 'Écris, tourne et monte un film d’une minute sur le thème « la dernière part de pizza », en 30 minutes chrono.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Le film de ta tâche', description: 'Imagine la tâche que tu repousses comme un film de braquage : quel est le premier geste du plan ? Fais-le.' },
    { duration: 5, level: 'debutant', title: 'Musique d’entraînement', description: 'Lance la musique d’une scène d’entraînement (Rocky, Mulan) et commence ta tâche avant la fin du morceau.' },
    { duration: 15, title: 'Critique en 100 mots', description: 'Écris une critique de 100 mots du dernier film que tu as vu : un point fort, un point faible, une note sur 5.' },
    { duration: 15, title: 'Plan de tournage', description: 'Découpe ta tâche en 5 « scènes » courtes comme sur un plan de tournage, puis tourne (fais) la première.' },
    { duration: 30, title: 'Un court à la place d’un épisode', description: 'Au lieu d’un épisode de série, regarde un court-métrage de 20 minutes et prends 10 minutes pour noter ce qui t’a marqué.' },
  ],
  curiosite: [
    { duration: 5, title: 'L’effet Koulechov', description: 'Filme ton visage neutre, puis 3 objets différents, et monte chaque objet après ton visage : ton expression semble changer.' },
    { duration: 5, level: 'debutant', title: 'Qui a fait l’image ?', description: 'Cherche qui a signé la photographie d’un film que tu aimes et note un autre film de cette personne à voir.' },
    { duration: 15, title: 'Court-métrage d’ailleurs', description: 'Regarde un court-métrage primé d’un pays que tu n’as jamais exploré, et note en 2 lignes ce que tu as ressenti.' },
    { duration: 15, title: 'La règle des 180°', description: 'Découvre la règle des 180° (ne pas franchir l’axe entre deux personnages) et repère-la dans une scène de dialogue.' },
    { duration: 30, title: 'Un·e cinéaste en trois extraits', description: 'Regarde trois extraits d’Agnès Varda, de Satyajit Ray ou de Bong Joon-ho et note ce qu’ils ont en commun.' },
  ],
})

export const animation = definePassionActivities('animation', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Folioscope de post-it', description: 'Dessine une balle qui rebondit sur 8 post-it (ou 8 coins de cahier) et fais-les défiler avec le pouce.' },
    { duration: 5, level: 'debutant', title: 'La gomme qui avance', description: 'Prends 12 photos d’une gomme que tu avances d’1 cm à chaque fois, puis fais défiler les photos très vite.' },
    { duration: 15, title: 'La grande évasion des stylos', description: 'Fais sortir tes stylos de leur trousse en stop-motion (une appli comme Stop Motion Studio aide), 2 photos par mouvement.' },
    { duration: 15, title: 'Un personnage, trois poses', description: 'Invente un personnage très simple (un haricot avec des bras) et dessine-le content, surpris puis fâché.' },
    { duration: 30, title: 'Créature en pâte à modeler', description: 'Anime en stop-motion une petite créature en pâte à modeler qui mange un objet : environ 60 photos pour 5 secondes.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Clin d’œil', description: 'Anime un œil qui cligne en 4 dessins seulement (ouvert, mi-clos, fermé, mi-clos) et fais défiler.' },
    { duration: 5, level: 'debutant', title: 'Image par image', description: 'Mets un dessin animé en pause sur YouTube, avance image par image avec les touches « , » et « . » et compte les dessins par seconde.' },
    { duration: 15, title: 'Films des Gobelins', description: 'Regarde un court-métrage de fin d’études de l’école des Gobelins et note la technique utilisée (2D, 3D, stop-motion).' },
    { duration: 15, title: 'Cycle de respiration', description: 'Anime un personnage assis qui respire lentement, en 6 dessins qui bouclent : les épaules montent, puis redescendent.' },
    { duration: 30, title: 'Boucle de pluie', description: 'Anime une fenêtre où des gouttes glissent, en 8 images qui bouclent, dans une appli comme FlipaClip ou sur papier.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Le nuage qui sourit', description: 'Anime en 5 dessins un nuage triste qui devient souriant : la bouche remonte, un petit soleil apparaît.' },
    { duration: 5, level: 'debutant', title: 'GIF câlin', description: 'Dessine deux formes rondes qui se rapprochent et se serrent en 6 images, comme un GIF de câlin à t’envoyer.' },
    { duration: 15, title: 'Un compagnon qui dit coucou', description: 'Crée un petit compagnon (boule de poils, pixel, nuage) et anime-le en train de te faire coucou en 8 images.' },
    { duration: 15, title: 'Paperman', description: 'Regarde « Paperman » (7 min, Oscar 2013) et note ce qui te plaît dans ce mélange de dessin 2D et d’images 3D.' },
    { duration: 30, title: 'La danse de l’objet doudou', description: 'Anime en stop-motion un objet qui te rassure (tasse, peluche) en train de faire une petite danse, en 40 photos environ.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Écrasement et étirement', description: 'Dessine en 3 étapes une balle qui s’écrase en touchant le sol puis s’étire en repartant : c’est le principe « squash and stretch ».' },
    { duration: 5, title: 'Métamorphose', description: 'Anime la transformation d’un objet en un autre (une tasse qui devient un chat) en 6 dessins intermédiaires.' },
    { duration: 15, title: 'Lettres qui se transforment', description: 'Anime en 8 images la première lettre de ton prénom qui se transforme en la dernière.' },
    { duration: 15, level: 'intermediaire', title: 'Décortiquer un GIF', description: 'Choisis un GIF animé que tu aimes et redessine sa boucle image par image pour comprendre comment il est construit.' },
    { duration: 30, title: 'Animatique de 5 secondes', description: 'Écris une idée d’animation de 5 secondes (qui, quoi, surprise finale) et dessine son animatique en 6 cases.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'La feuille qui tombe', description: 'Anime une feuille qui tombe en zigzag en 8 dessins, en ralentissant à chaque changement de direction.' },
    { duration: 5, level: 'debutant', title: 'Vague en boucle', description: 'Dessine une vague simple en 4 images qui bouclent dans le coin de ton cahier.' },
    { duration: 15, title: 'Flamme de bougie', description: 'Anime une flamme en 6 images qui bouclent : elle vacille, s’étire, se tasse.' },
    { duration: 15, title: 'Accélérer, ralentir', description: 'Anime une balle qui roule en mettant plus de dessins au début et à la fin du mouvement : c’est l’« ease in / ease out ».' },
    { duration: 30, title: 'Nuit étoilée', description: 'Crée une boucle de 12 images d’un ciel où les étoiles scintillent une à une, dans FlipaClip ou sur papier.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Balle anti-stress', description: 'Anime en 5 images une balle anti-stress qu’on écrase puis qui reprend sa forme. Exagère l’écrasement.' },
    { duration: 5, level: 'debutant', title: 'Le souci qui rétrécit', description: 'Dessine ton souci en grosse forme, puis fais-le rétrécir en 6 images jusqu’à un point qui disparaît.' },
    { duration: 15, title: 'Respire avec ton animation', description: 'Anime un cercle qui gonfle puis dégonfle en 8 images qui bouclent, puis respire au rythme de ton animation.' },
    { duration: 15, title: 'Rangement en stop-motion', description: 'Range ton bureau en prenant une photo à chaque objet déplacé : le rangement devient un petit film.' },
    { duration: 30, title: 'Trois petites boucles', description: 'Anime 3 boucles de 4 images chacune : une pluie, une balançoire, un poisson qui nage.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Explosion en 4 images', description: 'Anime une explosion cartoon en 4 dessins : l’étincelle, la boule, le nuage énorme, la fumée.' },
    { duration: 5, level: 'debutant', title: 'Le grand saut', description: 'Anime un bonhomme bâton qui prend son élan, saute et atterrit, en 6 images.' },
    { duration: 15, title: 'Poursuite de post-it', description: 'Anime en stop-motion deux post-it qui se poursuivent sur ton mur, en une trentaine de photos.' },
    { duration: 15, title: 'Coup de poing cartoon', description: 'Anime un coup de poing exagéré en 8 images : le bras recule (anticipation), l’action ultra rapide, puis l’impact.' },
    { duration: 30, title: 'Pixilation', description: 'Téléphone posé et retardateur, fais-toi « glisser » assis·e par terre en stop-motion : une photo tous les 10 cm.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Barre de chargement', description: 'Anime en 6 images une barre de progression qui se remplit, titrée avec ta tâche en attente. Puis fais-en les 5 premières minutes.' },
    { duration: 5, level: 'debutant', title: 'Se lever du canapé', description: 'Anime en 5 images un bonhomme affalé qui se lève de son canapé. Ensuite, imite-le.' },
    { duration: 15, title: 'La tâche en stop-motion', description: 'Anime ton cahier qui s’ouvre tout seul et ton stylo qui vient se poser dessus en 20 photos, puis prends le relais.' },
    { duration: 15, title: 'Danse de victoire', description: 'Anime un petit personnage qui fait une danse de victoire en 8 images. Tu la regarderas une fois ta tâche finie.' },
    { duration: 30, level: 'intermediaire', title: 'Une seconde de marche', description: 'Anime une seconde complète (12 dessins) d’un personnage qui marche. Une seconde de film, 30 minutes de travail : c’est le métier.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Le cheval de Muybridge', description: 'Regarde la série de photos du cheval au galop d’Eadweard Muybridge (1878) et fais-la défiler : c’est un ancêtre du cinéma.' },
    { duration: 5, level: 'debutant', title: 'Thaumatrope', description: 'Dessine un oiseau sur un disque de carton et une cage au dos, perce deux trous, ajoute une ficelle et fais-le tourner.' },
    { duration: 15, title: 'Norman McLaren', description: 'Regarde « Voisins » ou « Caprice en couleurs » de Norman McLaren et note la technique étonnante qu’il utilise.' },
    { duration: 15, title: 'Rotoscopie', description: 'Filme 2 secondes de ta main qui fait coucou, puis décalque 6 images de la vidéo : voilà une animation en rotoscopie.' },
    { duration: 30, title: 'Les 12 principes', description: 'Regarde une vidéo sur les 12 principes de l’animation, puis anime une balle qui en applique trois : écrasement, anticipation, amorti.' },
  ],
})

export const montageVideo = definePassionActivities('montage-video', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Cinq plans en rythme', description: 'Filme 5 plans de 2 secondes dans ta pièce et monte-les sur un morceau, en coupant sur les temps forts.' },
    { duration: 15, title: 'Bande-annonce d’un grille-pain', description: 'Monte la bande-annonce épique d’un objet banal : plans serrés, textes à l’écran, musique dramatique.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Chasse aux temps morts', description: 'Prends une vidéo de ta galerie et coupe tous les passages inutiles pour réduire sa durée de moitié.' },
    { duration: 15, title: 'Souvenir de 30 secondes', description: 'Sélectionne 10 extraits de vidéos de ton téléphone et monte un souvenir de 30 secondes sur une musique calme.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Trois bons moments', description: 'Monte en 15 secondes trois extraits de vidéos où tu as ri ou passé un bon moment.' },
    { duration: 15, title: 'Lettre vidéo', description: 'Monte une vidéo d’une minute pour un·e ami·e avec des extraits et un petit texte à l’écran. Envoie-la, ou garde-la pour toi.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Voler une transition', description: 'Choisis une transition vue dans un clip (zoom, main qui balaie l’écran) et recrée-la avec deux plans filmés chez toi.' },
    { duration: 15, title: 'Deux ambiances, mêmes images', description: 'Monte le même extrait deux fois : version comédie, puis version film d’horreur, juste avec la musique et le rythme.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Plan fixe et fondus', description: 'Filme 30 secondes d’un plan fixe (fenêtre, bougie, rue) et ajoute simplement un fondu au début et à la fin.' },
    { duration: 30, title: 'Vlog contemplatif', description: 'Monte une minute de ta journée uniquement en plans fixes, avec le son ambiant et sans musique.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Grand ménage de la galerie', description: 'Supprime 20 vidéos inutiles de ta galerie et range les meilleures dans un album « à monter ».' },
    { duration: 15, title: 'Couper sur le temps', description: 'Monte des plans sur un morceau lent en coupant exactement sur chaque temps : l’attention que ça demande fait tout oublier.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Jump cuts', description: 'Filme-toi en train de sauter à 8 endroits de ton logement et enchaîne les sauts en jump cut.' },
    { duration: 15, title: 'Un plan par temps', description: 'Monte 20 plans très courts sur une musique rapide, en changeant de plan à chaque temps.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Timelapse de départ', description: 'Lance un timelapse de ton bureau et commence la tâche que tu repousses : tu monteras la vidéo après.' },
    { duration: 15, title: 'Tuto de 30 secondes', description: 'Monte un mini-tuto de 30 secondes sur un truc que tu sais faire (faire un nœud, préparer un thé) avec du texte à l’écran.' },
  ],
  curiosite: [
    { duration: 5, title: 'Le raccord mouvement', description: 'Filme-toi ouvrant une porte sous deux angles et coupe d’un plan à l’autre pendant le geste : le raccord devient invisible.' },
    { duration: 30, level: 'intermediaire', title: 'Trois étalonnages', description: 'Dans CapCut ou DaVinci Resolve, étalonne le même plan en trois ambiances : chaude, froide, film des années 70.' },
  ],
})
