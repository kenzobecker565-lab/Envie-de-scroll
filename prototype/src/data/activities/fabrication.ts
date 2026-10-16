import { definePassionActivities } from './define'

/* ============================================================================
 *  FABRICATION : bricolage / DIY, cuisine, couture, jardinage
 * ========================================================================== */

export const cuisine = definePassionActivities('cuisine', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Tartine d’artiste', description: 'Compose une tartine comme un tableau : une base (fromage frais, beurre de cacahuète), trois garnitures en motif. Photo, puis dégustation.' },
    { duration: 5, level: 'debutant', title: 'Dégustation à l’aveugle', description: 'Les yeux fermés, goûte 4 ingrédients du placard (épice, fruit sec, chocolat…) et décris chacun en 3 mots.' },
    { duration: 15, level: 'debutant', title: 'Mug cake', description: 'Dans une grande tasse : 4 c. à soupe de farine, 3 de sucre, 2 de cacao, 1 œuf, 3 de lait, 2 d’huile. 1 min 30 au micro-ondes, puis ta touche perso.' },
    { duration: 15, title: 'Défi du placard', description: 'Invente un plat avec seulement 4 ingrédients trouvés chez toi, sans rien acheter, et donne-lui un nom de restaurant chic.' },
    { duration: 30, title: 'Pain perdu en deux versions', description: 'Fais du pain perdu avec du pain rassis, un œuf et du lait, en une version sucrée et une version salée, puis compare.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Boisson chaude signature', description: 'Prépare une boisson chaude et personnalise-la (cannelle, zeste d’orange, miel, lait mousseux au fouet). Note ta recette.' },
    { duration: 5, level: 'debutant', title: 'Bol de fruits dressé', description: 'Coupe un ou deux fruits et dresse-les joliment dans un bol en jouant sur les formes : rondelles, dés, éventail.' },
    { duration: 15, level: 'debutant', title: 'Tartines gratinées', description: 'Fais gratiner deux tartines garnies (tomate-fromage, poire-miel) au four ou à la poêle, et note ta combinaison préférée.' },
    { duration: 15, title: 'Soupe express', description: 'Mixe des légumes déjà cuits ou en conserve avec un bouillon, une épice et un filet d’huile : une soupe maison en 15 minutes.' },
    { duration: 30, title: 'Cookies du canapé', description: 'Prépare une pâte à cookies simple (beurre mou, sucre, œuf, farine, pépites), forme 6 boules et laisse le four travailler pendant que tu te reposes.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Chocolat chaud réconfort', description: 'Fais fondre deux carrés de chocolat dans du lait chaud en fouettant, ajoute une pincée de cannelle et bois-le lentement.' },
    { duration: 5, level: 'debutant', title: 'Le goûter d’enfance', description: 'Prépare le goûter qui te rappelle ton enfance (tartine, compote, gâteau sec) et dresse-le comme dans un joli café.' },
    { duration: 15, title: 'Trois crêpes', description: 'Mélange farine, œuf, lait et une pincée de sel, puis fais 3 crêpes garnies de ce que tu aimes.' },
    { duration: 15, level: 'debutant', title: 'La recette de famille', description: 'Appelle quelqu’un de ta famille pour lui demander une recette qu’il ou elle réussit bien, et note-la avec toutes les astuces.' },
    { duration: 30, title: 'Gâteau au yaourt', description: '1 pot de yaourt, puis avec le pot : 2 de sucre, 3 de farine, ½ d’huile, 3 œufs et 1 sachet de levure. Enfourne 30 min à 180 °C : 10 minutes de préparation, le four fait le reste.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'L’ingrédient mystère', description: 'Prends un ingrédient du placard les yeux fermés et trouve 3 idées de recettes qui le mettent en valeur. Note celle à tester.' },
    { duration: 5, level: 'debutant', title: 'Vinaigrette signature', description: 'Mélange 3 cuillères d’huile pour 1 de vinaigre ou de citron, puis ajoute un ingrédient surprise : miel, moutarde, sauce soja…' },
    { duration: 15, title: 'Tour du monde express', description: 'Choisis un pays au hasard sur une carte et prépare une sauce ou un plat simple de sa cuisine avec ce que tu as.' },
    { duration: 15, title: 'Classique revisité', description: 'Transforme un plat très simple (pâtes au beurre, omelette) avec une épice, une herbe et un élément croquant.' },
    { duration: 30, title: 'Assiette arc-en-ciel', description: 'Prépare une assiette avec au moins 5 couleurs d’aliments et soigne le dressage comme dans un restaurant.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Découpe lente', description: 'Coupe une carotte ou un concombre en rondelles parfaitement régulières, lentement, en te concentrant sur le geste.' },
    { duration: 5, level: 'debutant', title: 'Thé attentif', description: 'Prépare un thé ou une infusion en observant chaque étape : l’eau qui chauffe, la couleur qui change, l’odeur qui monte.' },
    { duration: 15, title: 'Galettes à la poêle', description: 'Mélange farine, eau, sel et un filet d’huile, pétris 5 minutes, étale en petites galettes et cuis-les à la poêle.' },
    { duration: 15, level: 'debutant', title: 'Salade en rangées', description: 'Compose une salade en préparant chaque ingrédient avec soin et en les disposant par rangées de couleurs.' },
    { duration: 30, level: 'intermediaire', title: 'Risotto patient', description: 'Prépare un petit risotto en ajoutant le bouillon louche par louche et en remuant doucement : la patience est l’ingrédient principal.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Guacamole à la fourchette', description: 'Écrase un avocat à la fourchette avec du citron, du sel et un peu de tomate ou d’oignon.' },
    { duration: 5, level: 'debutant', title: 'Étagère à épices', description: 'Range une étagère de ta cuisine en regroupant les épices et en notant ce qui manque.' },
    { duration: 15, title: 'Pétrir une pâte à pizza', description: 'Prépare une pâte à pizza (farine, eau tiède, levure, sel, huile) et pétris-la 10 minutes. Elle lèvera pendant que tu fais autre chose.' },
    { duration: 15, title: 'Brunoise', description: 'Coupe des légumes en tout petits dés réguliers : le geste précis et répétitif vide la tête. Garde-les pour une omelette.' },
    { duration: 30, title: 'Muffins au gramme près', description: 'Prépare 6 muffins en suivant une recette à la lettre, en pesant tout : suivre des étapes claires, ça apaise.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Chantilly à la main', description: 'Monte de la crème liquide bien froide en chantilly au fouet, à fond, puis ajoute un peu de sucre à la fin.' },
    { duration: 5, title: 'Pop-corn maison', description: 'Fais éclater du maïs à pop-corn dans une casserole couverte avec un fond d’huile, en secouant fort. Sucré ou salé ?' },
    { duration: 15, title: 'Pesto écrasé', description: 'Écrase au mortier (ou dans un bol avec le fond d’un verre) basilic, ail, parmesan, pignons et huile d’olive.' },
    { duration: 15, title: 'Galettes de pommes de terre', description: 'Râpe deux pommes de terre, presse-les fort dans un torchon et fais-en des galettes croustillantes à la poêle.' },
    { duration: 30, level: 'debutant', title: 'Pizza express', description: 'Pâte sans attente (farine, yaourt, levure chimique, sel), étalée à la main, garnie avec ce que tu as, puis au four.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Snack de mission', description: 'Prépare un en-cas pour accompagner ta tâche (fruits coupés, noix, thé) et installe-le à côté de toi. Mission lancée.' },
    { duration: 5, level: 'debutant', title: 'Le repas-récompense', description: 'Écris la liste de courses d’un repas que tu cuisineras une fois ta tâche finie. Récompense programmée.' },
    { duration: 15, level: 'debutant', title: 'L’œuf-minuteur', description: 'Lance la cuisson d’un œuf dur (10 minutes) et avance sur ta tâche jusqu’à la sonnerie. Ensuite, pause dégustation.' },
    { duration: 15, title: 'Le déjeuner de demain', description: 'Prépare ton déjeuner de demain en 15 minutes : une chose de moins à penser, et ta tâche juste après.' },
    { duration: 30, title: 'Ça cuit tout seul', description: 'Lance une recette qui cuit seule (gratin, légumes rôtis) : 10 minutes de préparation, puis avance sur ta tâche pendant la cuisson.' },
  ],
  curiosite: [
    { duration: 5, title: 'Épice inconnue', description: 'Goûte une épice que tu n’as jamais utilisée (cumin, sumac, cardamome, paprika fumé) et cherche 2 plats où elle est typique.' },
    { duration: 5, level: 'debutant', title: 'La réaction de Maillard', description: 'Lis ce qu’est la réaction de Maillard, puis fais dorer une tranche de pain à la poêle et observe-la brunir.' },
    { duration: 15, level: 'intermediaire', title: 'Mayonnaise maison', description: 'Fouette un jaune d’œuf avec de la moutarde en versant l’huile en mince filet, et comprends pourquoi l’émulsion « prend ».' },
    { duration: 15, title: 'Street food d’ailleurs', description: 'Prépare une version simple d’une street food étrangère : quesadilla, pan con tomate, ou onigiri si tu as du riz déjà cuit.' },
    { duration: 30, level: 'intermediaire', title: 'Nouvelle technique', description: 'Teste une technique jamais essayée (œuf poché, légumes rôtis, caramel à sec) et note ce qui a marché et ce que tu changerais.' },
  ],
})

export const bricolage = definePassionActivities('bricolage', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Origami', description: 'Avec une feuille carrée, plie une grue ou une petite boîte en suivant un tuto.' },
    { duration: 15, title: 'Seconde vie', description: 'Transforme un objet promis à la poubelle (boîte de conserve, pot de yaourt, carton) en pot à crayons décoré.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Marque-page', description: 'Fabrique un marque-page avec un reste de carton et un bout de ruban ou de ficelle, puis décore-le.' },
    { duration: 15, title: 'La petite réparation', description: 'Recolle, recouds ou revisse un petit objet cassé qui traîne depuis longtemps.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Carte en collage', description: 'Fabrique une petite carte pliée pour quelqu’un que tu aimes, avec un collage de papiers découpés.' },
    { duration: 15, title: 'Bocal à bons souvenirs', description: 'Décore un bocal et glisse dedans 10 petits papiers de bons souvenirs à relire les jours gris.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Défi des trombones', description: 'Avec 5 trombones et un élastique, fabrique l’objet le plus utile possible : support de téléphone, clip, crochet…' },
    { duration: 15, level: 'debutant', title: 'Un carton, un objet', description: 'Avec un seul carton, des ciseaux et du scotch, fabrique un rangement ou un support pour ton bureau.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Étoiles en papier', description: 'Plie 10 petites étoiles porte-bonheur avec des bandes de papier, en te concentrant sur chaque pli.' },
    { duration: 30, title: 'Bracelet en macramé', description: 'Avec de la ficelle, fais un bracelet ou un porte-clés en nœuds plats de macramé en suivant un tuto.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Chaque chose à sa place', description: 'Trie une boîte de vis, de crayons ou de câbles : remettre de l’ordre dans une boîte en remet un peu dans la tête.' },
    { duration: 15, title: 'Poncer jusqu’au doux', description: 'Ponce un petit objet en bois (cuillère, planchette) jusqu’à ce qu’il soit parfaitement doux au toucher.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Papier mâché', description: 'Déchire une montagne de bandes de papier journal et prépare une colle farine-eau : la base d’un futur objet.' },
    { duration: 15, title: 'Démontage', description: 'Démonte un vieil appareil hors d’usage, débranché et sans batterie (souris, réveil, jouet), et trie ses pièces.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Panneau « en mission »', description: 'Fabrique un panneau « En mission » avec un carton et un feutre, accroche-le à ta porte, puis va faire ta tâche.' },
    { duration: 15, title: 'Organiseur de bureau', description: 'Fabrique un petit organiseur en carton, ranges-y tes affaires, et tu es prêt·e à t’y mettre.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Deux nœuds utiles', description: 'Apprends le nœud de chaise et le nœud plat avec un lacet ou une ficelle.' },
    { duration: 30, title: 'Premier circuit', description: 'Avec une pile bouton, une LED et du papier aluminium, fabrique une petite carte qui s’allume et comprends pourquoi.' },
  ],
})

export const couture = definePassionActivities('couture', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Bouton recousu', description: 'Recouds un bouton qui manque ou qui pendouille, en enroulant le fil sous le bouton pour qu’il tienne.' },
    { duration: 15, title: 'Initiale brodée', description: 'Trace ton initiale au crayon sur un tissu (ou un vieux t-shirt) et brode-la au point arrière.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Point avant tranquille', description: 'Sur une chute de tissu, fais une ligne de point avant la plus régulière possible, lentement.' },
    { duration: 15, title: 'Trésors de chutes', description: 'Trie tes chutes de tissu par couleur ou matière et imagine un projet pour les trois plus belles.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Petit cœur brodé', description: 'Brode un petit cœur ou une étoile au coin d’un mouchoir ou d’un t-shirt.' },
    { duration: 15, title: 'Doudou chaussette', description: 'Transforme une chaussette orpheline en petite peluche : rembourre-la, ferme-la et couds-lui deux yeux.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Catalogue de points', description: 'Regarde 5 points de broderie (tige, chaînette, nœud français…) et choisis le prochain à apprendre.' },
    { duration: 15, level: 'debutant', title: 'Patch maison', description: 'Découpe un tissu en forme simple (nuage, éclair) et couds-le sur un vêtement ou un sac.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Petites croix', description: 'Fais 20 petites croix régulières sur une toile ou un tissu à trame visible, lentement.' },
    { duration: 30, title: 'Paysage brodé', description: 'Brode un petit paysage (collines, soleil, nuages) au point de tige, en prenant ton temps.' },
  ],
  stress: [
    { duration: 5, title: 'Ourlet invisible', description: 'Refais un ourlet décousu au point invisible, point après point, en comptant tes points.' },
    { duration: 15, level: 'debutant', title: 'Tawashi', description: 'Tresse des bandes de vieux t-shirt sur un petit cadre (carton ou clous) pour fabriquer une éponge tawashi.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Fil de t-shirt', description: 'Découpe un vieux t-shirt en longues bandes, puis tire fort dessus : elles s’enroulent en fil à tricoter.' },
    { duration: 15, title: 'Tote bag sans couture', description: 'Coupe les manches et l’encolure d’un vieux t-shirt, puis noue des franges en bas : voilà un sac.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Réparation express', description: 'Répare en 5 minutes le vêtement qui attend au fond du placard (bouton, petit trou), puis enchaîne avec ta tâche.' },
    { duration: 15, title: 'Étui de mission', description: 'Couds un étui simple (un rectangle plié, deux coutures) pour ranger ce dont tu as besoin pour ta tâche.' },
  ],
  curiosite: [
    { duration: 5, title: 'Sashiko et boro', description: 'Découvre le sashiko et le boro, techniques japonaises de réparation visible, et repère un vêtement à réparer ainsi.' },
    { duration: 30, level: 'intermediaire', title: 'Premier patron', description: 'Dessine le patron d’un chouchou ou d’une pochette, coupe le tissu et assemble-le à la main ou à la machine.' },
  ],
})

export const jardinage = definePassionActivities('jardinage', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Ça repousse', description: 'Mets le pied d’un oignon vert, d’un poireau ou d’une laitue dans un verre d’eau au soleil : il repoussera en quelques jours.' },
    { duration: 15, level: 'debutant', title: 'Cresson sur coton', description: 'Sème des graines de cresson sur du coton humide dans une coupelle : elles germent en 2 ou 3 jours.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Arrosage attentif', description: 'Arrose tes plantes une par une en regardant l’état de leurs feuilles et de leur terre.' },
    { duration: 15, title: 'Feuilles propres', description: 'Nettoie doucement les feuilles de tes plantes avec un chiffon humide, une par une.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Album de croissance', description: 'Installe-toi près d’une plante, repère ses nouvelles pousses et prends-la en photo pour suivre sa croissance.' },
    { duration: 15, title: 'Bouture', description: 'Coupe une tige de pothos (ou d’une autre plante facile) juste sous un nœud et mets-la dans l’eau : une nouvelle plante commence.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Pot improbable', description: 'Trouve un contenant inattendu (tasse ébréchée, boîte de conserve) pour ta prochaine plante et perce-le si besoin.' },
    { duration: 15, level: 'debutant', title: 'Jardin miniature', description: 'Compose un mini-jardin dans un bocal ou une assiette creuse avec terre, mousse, cailloux et une petite plante.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Les mains dans la terre', description: 'Aère doucement la terre d’un pot avec une fourchette, en sentant sa texture et son odeur.' },
    { duration: 30, title: 'Rempotage', description: 'Rempote une plante trop à l’étroit dans un pot plus grand, avec du terreau neuf, sans te presser.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Désherbage', description: 'Arrache une à une les mauvaises herbes d’un pot, d’un balcon ou d’un bout de jardin, racines comprises.' },
    { duration: 15, title: 'Semis en godets', description: 'Sème du basilic ou des radis dans des pots de yaourt percés, et fabrique une étiquette pour chacun.' },
  ],
  defouler: [
    { duration: 5, title: 'Retourner la terre', description: 'Retourne et émiette la terre d’un grand pot ou d’un carré de jardin, à la main ou à la pelle.' },
    { duration: 15, level: 'debutant', title: 'Grand ménage du balcon', description: 'Vide les pots inutilisés, balaie, et regroupe tes plantes selon leur besoin de lumière.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Une graine et au travail', description: 'Pose quelques lentilles sur du coton humide : elles germeront pendant que tu avances sur ta tâche.' },
    { duration: 15, title: 'Étiquettes de plantes', description: 'Fabrique des étiquettes (nom, besoins en eau) avec des bâtonnets et un feutre, puis attaque ta tâche.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Identifier une plante', description: 'Photographie une plante avec l’appli Pl@ntNet et note 3 infos sur elle : origine, besoins, particularité.' },
    { duration: 30, title: 'Premier compost', description: 'Découvre ce qui va (ou pas) dans un compost et prépare un seau ou un bocal pour trier tes épluchures cette semaine.' },
  ],
})
