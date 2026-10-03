import { definePassionActivities } from './define'

/* ============================================================================
 *  MOTS : écriture (fiction), poésie, journal intime, critique / blogging
 * ========================================================================== */

export const ecriture = definePassionActivities('ecriture', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Cinq premières phrases', description: 'Écris la première phrase de 5 romans qui n’existent pas, chacun dans un genre différent.' },
    { duration: 5, level: 'debutant', title: 'L’objet témoin', description: 'Choisis un objet de ta pièce et raconte en 10 lignes, à la première personne, ce qu’il a vu cette semaine.' },
    { duration: 15, title: 'Dialogue de bus en panne', description: 'Écris la conversation entre deux inconnu·e·s coincé·e·s dans un bus en panne, sans aucune description : que des répliques.' },
    { duration: 15, title: 'Et si… ?', description: 'Écris une scène qui démarre par « Et si les chats pouvaient voter ? » (ou une autre question absurde) et va au bout de l’idée.' },
    { duration: 30, title: 'Nouvelle en trois temps', description: 'Écris une nouvelle d’une page en trois paragraphes : une situation normale, un événement qui dérape, une fin inattendue.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Histoires en six mots', description: 'Écris trois histoires complètes en six mots chacune, du genre « À vendre : chaussures de bébé, jamais portées ».' },
    { duration: 5, level: 'debutant', title: 'Le contenu des poches', description: 'Décris un personnage uniquement par la liste de ce qu’il y a dans ses poches.' },
    { duration: 15, title: 'Scène au lit', description: 'Écris la scène d’un personnage qui n’arrive pas à se lever, en décrivant uniquement ce qu’il entend.' },
    { duration: 15, title: 'Rêve recyclé', description: 'Note un rêve dont tu te souviens (même un morceau) et transforme-le en début d’histoire.' },
    { duration: 30, title: 'Lettre d’un personnage', description: 'Écris la lettre qu’un personnage envoie à quelqu’un qu’il n’a pas vu depuis dix ans.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Quelqu’un qui te comprend', description: 'Invente un personnage qui traverse la même journée que toi et écris la phrase qu’il se dit pour tenir.' },
    { duration: 5, level: 'debutant', title: 'Le lieu refuge', description: 'Décris en 10 lignes un lieu imaginaire où tu aimerais être là, maintenant : odeurs, bruits, lumière.' },
    { duration: 15, title: 'Petit conte réconfortant', description: 'Écris un court conte où un petit animal perdu retrouve son chemin grâce à quelqu’un d’inattendu.' },
    { duration: 15, title: 'L’autre version', description: 'Raconte un moment difficile de ta semaine comme une scène de roman, à la troisième personne, avec une fin plus douce.' },
    { duration: 30, title: 'Une journée dans cinq ans', description: 'Écris une scène où ton toi du futur raconte une journée ordinaire, simple et réussie.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Trois livres, trois mots', description: 'Ouvre trois livres au hasard, prends un mot dans chacun et écris une histoire de 10 lignes qui les contient tous.' },
    { duration: 5, level: 'debutant', title: 'Dix titres', description: 'Invente 10 titres d’histoires en 5 minutes, puis entoure celui que tu aimerais le plus lire.' },
    { duration: 15, title: 'Une situation de Polti', description: 'Choisis une des 36 situations dramatiques de Georges Polti (« la rivalité », « l’énigme »…) et écris une scène qui l’illustre.' },
    { duration: 15, level: 'intermediaire', title: 'Sans la lettre e', description: 'Écris 10 lignes sans jamais utiliser la lettre « e », comme Georges Perec dans « La Disparition ».' },
    { duration: 30, title: 'La scène qui manque', description: 'Choisis un personnage de série ou de manga et écris la scène qui manque entre deux épisodes.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Description au ralenti', description: 'Décris ta main posée sur la table en 10 lignes, comme si c’était la première main que tu voyais.' },
    { duration: 5, title: 'Instant suspendu', description: 'Écris une seule seconde de vie (une goutte qui tombe, un chat qui s’étire) en ralentissant chaque détail.' },
    { duration: 15, title: 'Paysage intérieur', description: 'Écris la marche d’un personnage dans un paysage qui reflète son humeur, sans jamais nommer l’émotion.' },
    { duration: 15, title: 'Copier pour comprendre', description: 'Recopie lentement à la main une page d’un·e auteur·rice que tu aimes, pour sentir le rythme de ses phrases.' },
    { duration: 30, title: 'La passante', description: 'Installe-toi près d’une fenêtre et écris une page sur une personne qui passe (ou que tu imagines) : son nom, sa journée, son secret.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Déverser puis tordre', description: 'Écris en vrac ce qui t’angoisse pendant 3 minutes, puis transforme la pire phrase en réplique de méchant de film.' },
    { duration: 5, level: 'debutant', title: 'Le personnage le plus calme du monde', description: 'Invente le personnage le plus zen qui soit et écris comment il réagirait si ton problème lui tombait dessus.' },
    { duration: 15, title: 'Le capitaine dans la tempête', description: 'Écris la scène d’un capitaine qui garde son navire à flot dans une tempête, une manœuvre à la fois.' },
    { duration: 15, title: 'Dialogue avec le stress', description: 'Écris un dialogue entre toi et ton stress en personnage : demande-lui ce qu’il veut, et négocie.' },
    { duration: 30, title: 'Le monde sans ce souci', description: 'Écris une histoire dans un monde où ce qui te stresse n’existe pas. Qu’est-ce qui pose problème à la place ?' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Sprint d’écriture', description: 'Pendant 5 minutes, écris sans t’arrêter une scène de poursuite. Interdit de relire ou de corriger.' },
    { duration: 5, level: 'debutant', title: 'Insultes de pirate', description: 'Invente 10 insultes fleuries et inoffensives dignes d’un pirate (« espèce de navet mal lavé ! »).' },
    { duration: 15, title: 'Scène de combat', description: 'Écris un combat entre deux personnages en phrases très courtes. Des verbes. Des coups. Du rythme.' },
    { duration: 15, title: 'La dispute absurde', description: 'Écris une dispute épique entre deux personnages pour la dernière frite, avec une escalade de plus en plus absurde.' },
    { duration: 30, title: 'Trente minutes chrono', description: 'Écris une histoire en temps réel : ton personnage a exactement 30 minutes pour désamorcer quelque chose.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'La tâche prend la parole', description: 'Transforme la tâche que tu évites en personnage et écris ce qu’elle pense de toi en ce moment. Puis va la voir.' },
    { duration: 5, title: 'L’explorateur qui retarde', description: 'Écris le journal de bord d’un explorateur qui repousse l’ascension d’une montagne pour « des raisons importantes ».' },
    { duration: 15, title: 'Le soir où ce fut fait', description: 'Écris au passé la scène de la soirée où ta tâche a été terminée : ce que tu as ressenti, ce que tu as fait ensuite.' },
    { duration: 15, level: 'debutant', title: 'Histoire complète, sans retour', description: 'Écris une histoire du début à la fin en 15 minutes, sans revenir en arrière. Finir compte plus que bien faire.' },
    { duration: 30, title: 'Défi 500 mots', description: 'Écris 500 mots d’une histoire en 30 minutes en comptant au fur et à mesure. Vise la quantité, pas la perfection.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Le point de vue de la cafetière', description: 'Raconte le petit-déjeuner de ce matin du point de vue de la cafetière, du bol ou du grille-pain.' },
    { duration: 5, title: 'Un mot rare', description: 'Cherche un mot rare dans le dictionnaire (« nitescence », « procellaire ») et écris 5 lignes qui l’utilisent.' },
    { duration: 15, title: 'La méthode du flocon', description: 'Résume une histoire en une phrase, puis en 5 phrases, puis décris ses 3 personnages principaux : c’est la méthode du flocon.' },
    { duration: 15, title: 'Un genre jamais lu', description: 'Cherche les codes d’un genre que tu n’as jamais lu (western, solarpunk, polar historique) et écris une scène qui les respecte.' },
    { duration: 30, title: 'D’après une histoire vraie', description: 'Lis une info insolite (fait divers étrange, découverte scientifique) et écris une page qui la raconte de l’intérieur.' },
  ],
})

export const poesie = definePassionActivities('poesie', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Haïkus de la pièce', description: 'Écris 3 haïkus (5, 7 puis 5 syllabes) sur trois objets qui t’entourent.' },
    { duration: 15, title: 'Acrostiche détourné', description: 'Écris un poème dont chaque vers commence par une lettre de ton prénom, mais qui parle d’autre chose que de toi.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Poèmes de trois mots', description: 'Écris 5 micro-poèmes de trois mots sur ce que tu ressens, puis choisis ton préféré.' },
    { duration: 15, level: 'debutant', title: 'Poème caviardé', description: 'Prends une page de magazine ou de vieux document et noircis tout sauf quelques mots qui, lus à la suite, forment un poème.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Lettre à la pluie', description: 'Écris un petit poème qui s’adresse à ta tristesse comme à une météo : « Toi, la pluie… ».' },
    { duration: 30, title: 'Poème-refuge', description: 'Écris un poème de 12 vers sur un lieu où tu te sens en sécurité, en passant par les cinq sens.' },
  ],
  'manque-inspiration': [
    { duration: 5, title: 'Rimes imposées', description: 'Prends 4 mots qui riment (chaussette, planète, trompette, miette) et écris un quatrain qui les utilise tous.' },
    { duration: 15, title: 'Calligramme', description: 'Écris un court poème dont les mots dessinent la forme de son sujet (la pluie, une clé), comme Apollinaire.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Inventaire des sons', description: 'Écris un poème-liste de tout ce que tu entends en ce moment, un son par vers.' },
    { duration: 15, title: 'Haïkus de fenêtre', description: 'Regarde par la fenêtre pendant 5 minutes, puis écris 3 haïkus sur ce qui a bougé.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Poème qui respire', description: 'Écris 6 vers : les impairs longs comme une inspiration, les pairs courts comme une expiration. Lis-le lentement.' },
    { duration: 15, title: '« Même si… »', description: 'Écris un poème où chaque vers commence par « Même si… », et termine par un vers qui commence par « Alors… ».' },
  ],
  defouler: [
    { duration: 5, title: 'Slam express', description: 'Écris 8 vers de slam sur ce qui t’agace, puis déclame-les debout, fort, en marquant le rythme.' },
    { duration: 15, level: 'debutant', title: 'Poème bruyant', description: 'Écris un poème fait surtout de sons (vroum, clac, splatch) qui raconte une journée agitée, et lis-le à voix haute.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Ode à la tâche', description: 'Écris une ode ridiculement grandiose de 4 vers à la tâche que tu repousses. Puis rends-lui visite.' },
    { duration: 15, title: 'La liste devient poème', description: 'Transforme ta liste de choses à faire en poème : chaque tâche devient un vers imagé.' },
  ],
  curiosite: [
    { duration: 5, title: 'Un·e poète à découvrir', description: 'Lis trois poèmes courts d’Andrée Chedid, de Langston Hughes ou de Wisława Szymborska et recopie le vers que tu préfères.' },
    { duration: 30, level: 'intermediaire', title: 'Le sonnet', description: 'Découvre la forme du sonnet (deux quatrains, deux tercets) et écris-en un sur un objet banal.' },
  ],
})

export const journalIntime = definePassionActivities('journal-intime', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Trois questions', description: 'Réponds par écrit : qu’est-ce qui m’a surpris aujourd’hui ? Qu’est-ce que j’ai appris ? Qu’est-ce que je veux demain ?' },
    { duration: 15, title: 'Mes premières fois', description: 'Liste 20 « premières fois » dont tu te souviens (premier concert, premier vélo…) avec un détail pour chacune.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Une ligne, une victoire', description: 'Écris une seule phrase qui résume ta journée, et une seule chose qui a été bien.' },
    { duration: 15, title: 'Écriture en vrac', description: 'Écris sans t’arrêter tout ce qui te passe par la tête pendant 10 minutes, sans relire. Puis souligne une phrase.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Trois bonnes choses', description: 'Note trois petites choses qui se sont bien passées aujourd’hui, même minuscules, et pourquoi.' },
    { duration: 15, title: 'Lettre à ton meilleur ami (toi)', description: 'Écris-toi la lettre que tu écrirais à ton meilleur ami s’il traversait la même chose que toi.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'La question du jour', description: 'Réponds à : « Quel objet sauverais-tu d’un incendie ? » ou « Quelle chanson résume ton année ? ».' },
    { duration: 15, title: 'La carte de ta semaine', description: 'Dessine et écris ta semaine comme une carte : les lieux, les gens, les moments forts.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Scan du corps', description: 'Décris par écrit chaque partie de ton corps, des pieds à la tête, et ce que tu y sens en ce moment.' },
    { duration: 30, title: 'Trois pages', description: 'Remplis trois pages à la main sans t’arrêter, comme les « pages du matin » de Julia Cameron (même le soir).' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Vider la tête', description: 'Liste tout ce qui te préoccupe, puis mets une étoile à ce qui dépend de toi et barre ce qui n’en dépend pas.' },
    { duration: 15, title: 'Pire, meilleur, probable', description: 'Pour ce qui t’inquiète, écris le pire scénario, le meilleur, puis le plus probable.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Page de colère', description: 'Écris ce qui t’énerve en lettres énormes, en appuyant fort, sur une page que tu pourras déchirer ensuite.' },
    { duration: 15, title: 'La liste des ras-le-bol', description: 'Liste tout ce qui t’agace en ce moment, puis écris à côté de chaque ligne une petite action ou une blague.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Pourquoi je fuis', description: 'Écris en 5 lignes ce qui te fait fuir la tâche (peur, flou, ennui ?), puis la plus petite étape possible pour commencer.' },
    { duration: 15, title: 'Avant / après', description: 'Écris ce que tu ressens avant de commencer, fais 10 minutes de la tâche, puis écris ce que tu ressens après.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Il y a un an', description: 'Écris ce que tu faisais, pensais et écoutais il y a un an, puis ce qui a changé depuis.' },
    { duration: 15, title: 'Mes cinq valeurs', description: 'Choisis 5 mots qui comptent pour toi (liberté, famille, humour…) et écris un souvenir récent pour chacun.' },
  ],
})

export const critiqueBlogging = definePassionActivities('critique-blogging', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Critique en 280 caractères', description: 'Écris la critique du dernier truc que tu as vu, lu ou écouté en 280 caractères, avec une note.' },
    { duration: 15, title: 'Top 5 argumenté', description: 'Écris ton top 5 des meilleurs snacks, albums ou jeux de ta vie, avec une phrase percutante pour chacun.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Trois adjectifs précis', description: 'Note le dernier livre, film ou album que tu as aimé et trouve trois adjectifs précis pour le décrire (pas « cool »).' },
    { duration: 15, title: 'Réécrire une intro', description: 'Relis un de tes anciens textes ou posts et réécris son premier paragraphe en mieux.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Coup de cœur', description: 'Écris un court billet pour recommander une chose qui t’a fait du bien cette semaine : un morceau, un plat, une vidéo.' },
    { duration: 15, title: 'Lettre à une œuvre', description: 'Écris une lettre à un livre, un film ou un album qui t’a aidé un jour, en expliquant pourquoi.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Dix idées de billets', description: 'Liste 10 idées d’articles, même bizarres (« Classement des stylos de ma trousse »).' },
    { duration: 15, title: 'Critique gastronomique d’une fourchette', description: 'Écris la critique sérieuse et détaillée d’un objet banal (ton oreiller, une fourchette) comme pour un grand restaurant.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Citation commentée', description: 'Recopie une phrase d’un livre que tu aimes et écris 5 lignes sur pourquoi elle te parle.' },
    { duration: 30, title: 'Donner envie d’un lieu', description: 'Écris un billet de 400 mots sur un lieu que tu aimes, pour donner envie à quelqu’un d’y aller.' },
  ],
  stress: [
    { duration: 5, title: 'Pour / contre', description: 'Écris un « pour / contre » sur une œuvre qui divise (un film très critiqué, un album) : un exercice de nuance.' },
    { duration: 15, level: 'debutant', title: 'Guide anti-stress', description: 'Écris un mini-article « 5 choses qui m’aident quand je stresse », comme sur un blog.' },
  ],
  defouler: [
    { duration: 5, title: 'Critique assassine (mais drôle)', description: 'Écris une critique ultra sévère et très drôle d’un film que tu as détesté, sans insulter personne.' },
    { duration: 15, level: 'debutant', title: 'Le match', description: 'Fais s’affronter deux films ou deux albums dans un billet écrit comme un commentaire sportif.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Juste le plan', description: 'Écris seulement le titre et les 3 intertitres d’un article sur un sujet qui te passionne. Le reste viendra.' },
    { duration: 15, title: 'Critique de ta soirée', description: 'Écris la critique de ta soirée de procrastination comme celle d’un film (scénario, rythme, note), puis réécris la fin.' },
  ],
  curiosite: [
    { duration: 5, title: 'Voler une tournure', description: 'Lis une critique d’un média que tu ne lis jamais et note une tournure de phrase à réutiliser.' },
    { duration: 30, level: 'intermediaire', title: 'Enquête express', description: 'Choisis une question (« Pourquoi les films sont-ils si longs ? ») et écris un billet de 300 mots appuyé sur au moins 2 sources.' },
  ],
})
