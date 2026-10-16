import { definePassionActivities } from './define'

/* ============================================================================
 *  ARTS VISUELS : dessin, peinture, photographie, illustration numérique,
 *  mode / stylisme
 * ========================================================================== */

export const dessin = definePassionActivities('dessin', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Croquis express', description: 'Choisis un objet à côté de toi et dessine-le en une minute, sans lever le crayon. Enchaîne avec quatre autres objets.' },
    { duration: 5, level: 'debutant', title: 'Contour à l’aveugle', description: 'Dessine ta main sans regarder la feuille, en suivant lentement ses contours des yeux. Le résultat sera bizarre : c’est le but.' },
    { duration: 15, title: 'Objet devenu personnage', description: 'Prends un objet banal (agrafeuse, chaussette, tasse) et transforme-le en personnage : yeux, bras, accessoires, et son nom écrit dessous.' },
    { duration: 15, title: 'Ta chambre vue par une fourmi', description: 'Dessine un coin de ta pièce comme si tu mesurais 2 mm : pieds de chaise géants, miettes énormes, plafond à perte de vue.' },
    { duration: 30, title: 'BD de ta journée en 6 cases', description: 'Raconte en 6 cases ce qui s’est passé depuis ton réveil, en exagérant chaque moment comme dans un film d’action.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Motif répété', description: 'Remplis un carré de 8 cm avec un seul motif répété (cercles, vagues, écailles), sans chercher à faire joli.' },
    { duration: 5, level: 'debutant', title: 'Le dessin allongé', description: 'Allongé·e, dessine ce que tu vois au plafond ou par la fenêtre en 10 traits maximum.' },
    { duration: 15, title: 'Ta tasse en trois gris', description: 'Dessine ta tasse ou ton verre avec seulement trois valeurs : le blanc du papier, un gris moyen, un noir. Aucun détail.' },
    { duration: 15, title: 'Montagnes de couette', description: 'Dessine les plis de ta couette ou d’un coussin comme si c’étaient des montagnes, avec l’ombre de chaque pli.' },
    { duration: 30, title: 'Inventaire de la journée', description: 'Remplis une double page avec 6 mini-vignettes des objets que tu as touchés aujourd’hui, chacune légendée d’un mot.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Météo intérieure', description: 'Dessine ton humeur sous forme de ciel (nuages, pluie, éclaircie) dans un petit cadre, puis ajoute un rayon de soleil quelque part.' },
    { duration: 5, level: 'debutant', title: 'Objet doudou', description: 'Dessine un objet qui te réconforte (plaid, tasse, peluche, casque audio) et colle-lui une petite étiquette « merci ».' },
    { duration: 15, title: 'La plante des jours gris', description: 'Invente une plante qui pousse quand on est triste : dessine ses feuilles, ses fleurs, et note ce qu’elle mange.' },
    { duration: 15, title: 'Carte postale d’un bon souvenir', description: 'Dessine un moment où tu étais bien (une plage, un repas, un fou rire) comme une carte postale, avec un mot au dos.' },
    { duration: 30, title: 'Autoportrait en animal', description: 'Dessine-toi en animal qui te ressemble aujourd’hui, blotti dans son abri idéal (terrier, nid, cabane). Soigne surtout l’abri.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Trois formes à l’aveugle', description: 'Trace trois formes les yeux fermés, puis ouvre-les et transforme ces formes en une créature.' },
    { duration: 5, title: 'Le mot mystère', description: 'Ouvre un livre au hasard, pointe un mot sans regarder et dessine-le de la façon la plus littérale possible.' },
    { duration: 15, title: 'Copie de maître', description: 'Trouve un dessin de Mœbius, d’Hokusai ou de Quentin Blake et recopie-le en 15 minutes, juste pour sentir ses traits.' },
    { duration: 15, title: 'Fusion d’objets', description: 'Fusionne deux objets de ta pièce en un seul (une lampe-escargot, un réveil-cactus) et dessine son mode d’emploi.' },
    { duration: 30, level: 'intermediaire', title: '20 variations', description: 'Divise une page en 20 cases et dessine 20 versions d’un même objet : fondu, géant, en ruine, amoureux, robotique…' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Lignes de respiration', description: 'Trace une ligne horizontale à chaque expiration, lentement, en remplissant la page de haut en bas. Laisse les lignes trembler.' },
    { duration: 5, title: 'Nervures', description: 'Prends une feuille d’arbre (ou une photo) et dessine uniquement ses nervures, du centre vers les bords.' },
    { duration: 15, title: 'Zentangle', description: 'Découpe un carré en 4 zones par une ligne courbe et remplis chaque zone d’un motif différent, trait après trait.' },
    { duration: 15, title: 'Nature morte au ralenti', description: 'Pose trois objets sur ta table et dessine-les très lentement, en regardant plus les objets que ta feuille.' },
    { duration: 30, title: 'Vue de ta fenêtre', description: 'Dessine ce que tu vois par la fenêtre en commençant par les plus grandes formes, puis ajoute des détails jusqu’à la fin du temps.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Le monstre du stress', description: 'Dessine ce qui te stresse sous forme de petit monstre, puis donne-lui un chapeau ridicule et des chaussettes dépareillées.' },
    { duration: 5, level: 'debutant', title: 'Hachures à fond', description: 'Remplis un carré de hachures serrées dans un sens, puis dans l’autre, en appuyant fort. Concentre-toi sur le bruit du crayon.' },
    { duration: 15, title: 'La carte de ta tête', description: 'Dessine ta tête vue de dessus comme une carte : chaque souci est un quartier, à la taille de la place qu’il prend. Ajoute un grand parc.' },
    { duration: 15, title: 'Mandala express', description: 'Trace un cercle et un point au centre, puis ajoute des couronnes de motifs symétriques vers l’extérieur, une à la fois.' },
    { duration: 30, title: 'Refuge imaginaire', description: 'Dessine le plan puis la vue d’une cabane où rien ne peut t’atteindre : ce qu’il y a dedans, le chemin pour y aller, la vue.' },
  ],
  defouler: [
    { duration: 5, title: 'Poses de 30 secondes', description: 'Ouvre un site de poses comme Line of Action et enchaîne 10 croquis de 30 secondes, en traçant d’abord la ligne du mouvement.' },
    { duration: 5, level: 'debutant', title: 'Visage géant debout', description: 'Scotche une grande feuille au mur et dessine debout un visage géant au gros marqueur, avec des gestes de tout le bras.' },
    { duration: 15, title: 'Explosion façon manga', description: 'Dessine une explosion avec lignes de vitesse, onomatopées énormes (BOOM, KRAKOOM) et débris qui volent dans tous les sens.' },
    { duration: 15, title: 'Combat de créatures', description: 'Invente deux créatures et dessine leur combat en 3 cases : l’attaque, le choc, le vainqueur.' },
    { duration: 30, level: 'intermediaire', title: 'Personnages en action', description: 'À partir de photos de sport, enchaîne 20 croquis d’une minute (saut, frappe, chute), puis deux poses plus poussées de 5 minutes.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'La montagne et le premier pas', description: 'Dessine la tâche que tu évites en montagne, puis un minuscule bonhomme qui fait le premier pas. Ensuite, fais ce premier pas pour de vrai.' },
    { duration: 5, title: 'Couverture du projet', description: 'Dessine en 5 minutes l’illustration de couverture du devoir ou du projet que tu repousses, puis ouvre-le.' },
    { duration: 15, title: 'BD du procrastinateur', description: 'Raconte ta soirée en 4 cases version héroïque : l’ennemi (la tâche), la fuite, le déclic, la victoire.' },
    { duration: 15, title: 'Carte au trésor', description: 'Dessine la carte d’une île où la tâche que tu fuis est le trésor : pièges, raccourcis, et le chemin le plus court en pointillés.' },
    { duration: 30, title: 'Cinq contre-la-montre', description: 'Lance un minuteur et dessine 5 objets en 5 minutes chacun, sans jamais gommer. Le crayon avance, toi aussi.' },
  ],
  curiosite: [
    { duration: 5, title: 'Pointillisme', description: 'Dessine une pomme uniquement avec des points, en les serrant dans les zones sombres et en les espaçant dans la lumière.' },
    { duration: 5, level: 'debutant', title: 'L’autre main', description: 'Dessine le même objet deux fois : une fois avec ta main habituelle, une fois avec l’autre. Compare ce que chaque main « voit ».' },
    { duration: 15, title: 'Un·e artiste à découvrir', description: 'Regarde le travail de Kim Jung Gi ou de Joanna Concejo, note trois choses qu’il ou elle fait que tu n’as jamais essayées, puis essaie la première.' },
    { duration: 15, title: 'Perspective à un point', description: 'Trace une ligne d’horizon et un point de fuite, puis dessine une rue de 5 immeubles qui s’enfonce vers ce point.' },
    { duration: 30, level: 'intermediaire', title: 'Vue éclatée', description: 'Dessine un stylo ou une lampe « démonté » en vue éclatée, chaque pièce légendée, comme dans un manuel technique.' },
  ],
})

export const peinture = definePassionActivities('peinture', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Taches transformées', description: 'Fais trois taches d’eau colorée (aquarelle, encre ou café) au hasard, laisse sécher, puis transforme-les en animaux au stylo.' },
    { duration: 15, title: 'Deux couleurs, pas une de plus', description: 'Peins un fruit avec seulement 2 couleurs et du blanc. Interdit d’ajouter une troisième couleur, même pour l’ombre.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Dégradé tranquille', description: 'Peins une bande de papier avec une seule couleur, du plus foncé au plus clair, en ajoutant un peu d’eau à chaque passage.' },
    { duration: 15, title: 'Ciel mouillé', description: 'Mouille ta feuille, dépose trois couleurs de ciel (orange, rose, violet) et laisse-les se mélanger sans y retoucher.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'La couleur du moment', description: 'Mélange la couleur de ton humeur, peins-en un rond, puis entoure-le d’une couleur qui te ferait du bien.' },
    { duration: 30, title: 'Un bouquet pour toi', description: 'Peins un bouquet imaginaire de fleurs simples (ronds, gouttes, tiges) pour te l’offrir, et signe-le.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Palette au hasard', description: 'Choisis 3 couleurs les yeux fermés, peins une bande de chacune et donne à cette palette un nom de parfum.' },
    { duration: 15, title: 'Un détail de chef-d’œuvre', description: 'Choisis un tableau de Monet, Van Gogh ou Hopper en ligne et peins seulement un carré de 5 cm de l’un de ses détails.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Vagues horizontales', description: 'Peins lentement des bandes horizontales d’eau colorée, comme des vagues calmes, du haut vers le bas de la feuille.' },
    { duration: 30, title: 'Paysage en trois plans', description: 'Peins un paysage en trois plans seulement : ciel clair, colline moyenne, premier plan foncé. Laisse sécher entre chaque plan.' },
  ],
  stress: [
    { duration: 5, title: 'Éclaboussures', description: 'Protège la table, charge ton pinceau et tapote-le au-dessus de la feuille pour faire des éclaboussures, couleur après couleur.' },
    { duration: 15, level: 'debutant', title: 'Cercles de respiration', description: 'Peins des cercles les uns dans les autres en respirant lentement à chaque tour, jusqu’à remplir la feuille.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Peinture aux doigts', description: 'Peins avec les doigts une composition abstraite à grands gestes : une couleur par main, puis mélange-les au centre.' },
    { duration: 15, title: 'Dripping à la Pollock', description: 'Sur un grand papier posé au sol (protégé), fais couler et projeter la peinture comme Jackson Pollock, sur une musique rapide.' },
  ],
  procrastination: [
    { duration: 5, title: 'Recouvrir la tâche', description: 'Peins la tâche que tu fuis sous forme de tache sombre, puis recouvre-la d’une couleur douce jusqu’à ce qu’elle disparaisse. Ensuite, ouvre-la.' },
    { duration: 15, title: 'La carte-récompense', description: 'Peins une petite carte du moment où ta tâche sera finie (le canapé, le snack, la soirée) et pose-la devant toi.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'L’effet du sel', description: 'Saupoudre du sel fin sur une zone d’aquarelle encore mouillée et observe les petites étoiles qui se forment en séchant.' },
    { duration: 30, level: 'intermediaire', title: 'La technique du glacis', description: 'Peins un objet simple en superposant 4 couches très diluées et transparentes, en laissant bien sécher entre chaque couche.' },
  ],
})

export const photographie = definePassionActivities('photographie', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Alphabet caché', description: 'Trouve autour de toi des formes qui ressemblent aux lettres de ton prénom et photographie-les une par une.' },
    { duration: 15, title: 'Micro-monde', description: 'Photographie 10 objets de si près qu’on ne les reconnaît plus, puis fais-les deviner à quelqu’un.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Chasse à la lumière', description: 'Sans te lever, photographie la lumière la plus intéressante autour de toi : un reflet, une ombre, un rayon sur le mur.' },
    { duration: 15, title: 'Grille monochrome', description: 'Photographie 8 objets de la même couleur autour de toi et assemble-les en grille avec une appli de collage.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Trois petits bonheurs', description: 'Photographie trois choses qui te font un peu de bien (un mug, une plante, un rayon de soleil) en soignant le cadrage.' },
    { duration: 15, title: 'Autoportrait sans visage', description: 'Fais un autoportrait qui te ressemble sans montrer ton visage : tes mains, tes chaussures, ton ombre, ton coin préféré.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Règle des tiers', description: 'Active la grille de ton appareil photo et fais 5 photos où le sujet est posé pile sur une intersection des lignes.' },
    { duration: 15, title: 'Un objet, dix angles', description: 'Photographie une seule chose (une clé, une orange) sous 10 angles : dessus, dessous, en contre-jour, dans un reflet…' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'La photo lente', description: 'Choisis un cadre, tiens-le une minute entière sans bouger avant d’appuyer. Recommence trois fois.' },
    { duration: 30, title: 'Balade à 6 photos', description: 'Sors marcher 30 minutes sans musique et ne prends qu’une photo toutes les 5 minutes, en choisissant bien chacune.' },
  ],
  stress: [
    { duration: 5, title: 'Symétries', description: 'Trouve 5 compositions parfaitement symétriques autour de toi (porte, fenêtre, assiette) et photographie-les bien centrées.' },
    { duration: 15, level: 'debutant', title: 'Théâtre d’ombres', description: 'Éteins tout sauf une lampe et photographie les ombres de tes objets sur le mur en les déplaçant.' },
  ],
  defouler: [
    { duration: 5, title: 'Traînées de lumière', description: 'Dans le noir, en mode nuit ou pose longue, photographie une lampe de poche que tu agites pour écrire un mot en lumière.' },
    { duration: 15, level: 'debutant', title: 'Saut figé', description: 'Avec le retardateur ou le mode rafale, photographie-toi en plein saut dans 5 poses différentes.' },
  ],
  procrastination: [
    { duration: 5, title: 'Scène de crime', description: 'Photographie les affaires de la tâche en attente comme une scène de crime : cadrage dramatique, lumière de côté. Puis attaque-la.' },
    { duration: 15, level: 'debutant', title: 'Avant / après', description: 'Photographie ton coin de travail en désordre, range-le en 10 minutes, puis refais la même photo depuis le même angle.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Macro avec une goutte d’eau', description: 'Dépose une petite goutte d’eau sur l’objectif de ton téléphone : elle fait loupe. Photographie une feuille ou un tissu de très près.' },
    { duration: 30, level: 'intermediaire', title: 'Le mode manuel', description: 'En mode Pro, photographie la même scène en changeant seulement l’ISO, puis seulement la vitesse, et note ce que chaque réglage change.' },
  ],
})

export const illustrationNumerique = definePassionActivities('illustration-numerique', {
  ennui: [
    { duration: 5, title: 'La brosse jamais testée', description: 'Dans ton appli (Krita, Ibis Paint, Procreate…), choisis une brosse jamais utilisée et fais 5 essais : fin, épais, texturé, gomme, mélange.' },
    { duration: 15, title: 'Silhouettes de créatures', description: 'Dessine 6 silhouettes noires de créatures en remplissant des formes, choisis la plus lisible et ajoute-lui 2 détails.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Aplats sous un vieux croquis', description: 'Importe la photo d’un ancien croquis et pose juste des aplats de couleur sur un calque en dessous.' },
    { duration: 15, title: 'Palette volée', description: 'Importe une photo que tu aimes, prélève 5 couleurs à la pipette et peins une forme simple uniquement avec elles.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Sticker réconfort', description: 'Dessine un petit sticker mignon (nuage, tasse, chat) avec un contour blanc épais, comme ceux qu’on envoie en message.' },
    { duration: 15, title: 'Fond d’écran « tu gères »', description: 'Illustre un petit personnage avec un lettrage « tu gères » et mets le résultat en fond d’écran.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Base photo', description: 'Importe une photo prise aujourd’hui, baisse son opacité, repasse les contours principaux sur un calque, puis supprime la photo.' },
    { duration: 15, title: 'Science-fiction en 3 couleurs', description: 'Choisis 3 couleurs au hasard dans la roue chromatique et illustre un paysage de science-fiction avec elles seules.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Papier peint', description: 'Dessine un petit motif (feuille, étoile) et duplique-le pour remplir la toile, en décalant chaque ligne.' },
    { duration: 30, title: 'Coucher de soleil en 3 calques', description: 'Peins un coucher de soleil en 3 calques (ciel, montagnes, premier plan) avec une brosse douce, en prenant le temps des dégradés.' },
  ],
  stress: [
    { duration: 5, title: 'Du chaos à la ligne', description: 'Gribouille sur un calque tout ce qui te passe par la tête, puis sur un nouveau calque repasse seulement les lignes à garder.' },
    { duration: 15, level: 'debutant', title: 'Pixel art zen', description: 'Sur une grille de 16 × 16 pixels, dessine un objet de ta pièce, case par case.' },
  ],
  defouler: [
    { duration: 5, title: 'Speedpaint à la grosse brosse', description: 'Chrono 5 minutes : peins un personnage en action avec la plus grosse brosse possible, sans jamais zoomer.' },
    { duration: 15, level: 'debutant', title: 'Onomatopées de BD', description: 'Dessine 5 onomatopées (BAM, SPLASH, ZIOUM) avec des lettres déformées, des contours épais et des effets de choc.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'L’icône de la tâche', description: 'Dessine l’icône d’application de la tâche que tu évites, comme si c’était une appli sympa. Puis ouvre la vraie tâche.' },
    { duration: 15, title: 'Mème maison', description: 'Illustre en 2 cases un mème sur ta procrastination avec un personnage simple. Ris un coup, puis lance-toi.' },
  ],
  curiosite: [
    { duration: 5, title: 'Modes de fusion', description: 'Ajoute un calque au-dessus d’un dessin et teste les modes de fusion (produit, superposition, lumière douce) avec une même couleur.' },
    { duration: 30, level: 'intermediaire', title: 'Éclairage en 3 étapes', description: 'Peins une sphère avec ombre propre, ombre portée et reflet coloré, puis applique la même logique à un personnage simple.' },
  ],
})

export const modeStylisme = definePassionActivities('mode-stylisme', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Trio improbable', description: 'Compose une tenue avec 3 vêtements que tu ne portes jamais ensemble et prends-la en photo à plat sur ton lit.' },
    { duration: 15, title: 'Uniforme version défilé', description: 'Redessine l’uniforme d’un métier (pompier, pilote, boulanger) comme s’il défilait à la Fashion Week.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Flat lay', description: 'Pose une tenue à plat avec ses accessoires et ses chaussures, et photographie-la bien de haut.' },
    { duration: 15, title: 'Accords de couleurs', description: 'Trie quelques hauts par couleur et note les 3 associations de couleurs qui te plaisent le plus.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'La tenue doudou', description: 'Assemble la tenue la plus confortable et la plus « toi » possible, enfile-la et note ce qui te plaît dedans.' },
    { duration: 15, title: 'Moodboard réconfort', description: 'Rassemble 9 images de tenues, matières et couleurs qui te font du bien en une planche dans ton téléphone.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Habiller un personnage', description: 'Choisis un personnage de film ou de série et compose, avec tes vêtements, la tenue qu’il porterait aujourd’hui.' },
    { duration: 15, level: 'intermediaire', title: 'Figurine de mode', description: 'Dessine une figurine de mode d’environ 9 têtes de haut, puis habille-la de 3 tenues différentes sur papier calque.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Étagère retrouvée', description: 'Plie soigneusement une étagère de vêtements et repère une pièce oubliée que tu vas remettre cette semaine.' },
    { duration: 30, title: 'Carnet de street style', description: 'Parcours des photos de street style d’une ville (Tokyo, Lagos, Séoul) et note 5 détails de style à essayer.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Tri express', description: 'Choisis 5 vêtements que tu ne portes plus et mets-les dans un sac à donner.' },
    { duration: 15, title: 'Un détail qui change tout', description: 'Customise un vêtement avec un seul détail : nouveaux lacets, un pin’s, un revers de manche, un nœud.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Défilé de couloir', description: 'Mets une musique rythmée et défile dans ton couloir avec 3 tenues enchaînées en 5 minutes.' },
    { duration: 15, title: 'L’anti-style', description: 'Crée la tenue la plus opposée à ton style habituel et prends-la en photo dans une pose exagérée.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Tenue de mission', description: 'Choisis la tenue dans laquelle tu vas attaquer la tâche que tu repousses, comme un costume de super-héros. Enfile-la.' },
    { duration: 15, title: 'Tenues des 3 prochains jours', description: 'Prépare et photographie tes tenues pour les 3 prochains jours : trois décisions de moins à prendre.' },
  ],
  curiosite: [
    { duration: 5, title: 'Un·e créateur·rice à découvrir', description: 'Regarde le travail d’Iris van Herpen, de Thebe Magugu ou d’Issey Miyake et note la pièce qui te surprend le plus.' },
    { duration: 30, title: 'L’histoire d’un vêtement', description: 'Choisis une pièce que tu portes (jean, sweat, baskets) et cherche son histoire : origine, date d’apparition, qui l’a rendue célèbre.' },
  ],
})
