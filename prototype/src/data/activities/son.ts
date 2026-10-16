import { definePassionActivities } from './define'

/* ============================================================================
 *  SON : musique (instrument), chant, composition, podcast / audio
 * ========================================================================== */

export const musique = definePassionActivities('musique', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Percussions de bureau', description: 'Joue le rythme d’une chanson connue avec un stylo, ta table et un verre, puis fais-la deviner à quelqu’un.' },
    { duration: 5, title: 'Une note, dix façons', description: 'Sur ton instrument, joue une seule note de 10 façons : forte, douce, courte, longue, vibrée, étouffée…' },
    { duration: 15, title: 'Générique à l’oreille', description: 'Retrouve à l’oreille, note par note, la mélodie d’un générique de série ou de jeu vidéo.' },
    { duration: 15, title: 'Changement de style', description: 'Joue une chanson connue dans le style opposé : une comptine en version rock, un tube en version berceuse.' },
    { duration: 30, title: 'Un riff célèbre', description: 'Choisis une intro ou un riff célèbre, trouve un tuto et apprends-le jusqu’à pouvoir le jouer d’une traite.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Sons qui s’éteignent', description: 'Joue 4 notes ou 4 accords que tu connais, très lentement, en laissant chaque son s’éteindre complètement.' },
    { duration: 5, level: 'debutant', title: 'Écoute d’un seul instrument', description: 'Écoute un morceau en suivant un seul instrument du début à la fin : la basse, la batterie ou le piano.' },
    { duration: 15, title: 'Improviser sur un bourdon', description: 'Lance une note tenue en fond (une vidéo de « drone » en ligne) et improvise très doucement par-dessus.' },
    { duration: 15, level: 'debutant', title: 'Le morceau doudou', description: 'Rejoue sans pression un morceau que tu connais par cœur, juste pour le plaisir, sans chercher la perfection.' },
    { duration: 30, title: 'Playlist d’écoute', description: 'Fais une playlist de 8 morceaux où ton instrument brille, et note pour chacun ce que tu aimes dans le jeu du musicien.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Joyeux, triste, joyeux', description: 'Sur ton instrument ou un piano en ligne, joue do-mi-sol (joyeux) puis do-mi♭-sol (triste). Alterne et écoute ce qui change en toi.' },
    { duration: 5, level: 'debutant', title: 'Le refrain qui fait du bien', description: 'Joue (ou tape le rythme en fredonnant) le refrain d’une chanson qui te remonte le moral.' },
    { duration: 15, title: 'Une berceuse pour toi', description: 'Invente une petite mélodie de 4 notes et rejoue-la en variant le tempo jusqu’à ce qu’elle t’apaise.' },
    { duration: 15, title: 'Jouer par-dessus', description: 'Lance une chanson qui te fait du bien et joue dessus, même juste une note sur chaque temps fort.' },
    { duration: 30, title: 'Huit mesures douces', description: 'Apprends les 8 premières mesures d’un morceau doux que tu aimes, avec une partition ou un tuto.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'La mélodie de ton prénom', description: 'Associe chaque lettre de ton prénom à une note (A = la, B = si, C = do… et on recommence après G) et joue la mélodie obtenue.' },
    { duration: 5, title: 'Trois notes seulement', description: 'Choisis 3 notes et improvise 5 minutes avec elles, en variant uniquement le rythme.' },
    { duration: 15, level: 'intermediaire', title: 'La grille des tubes', description: 'Joue la suite d’accords do, sol, la mineur, fa (I–V–vi–IV) et cherche combien de tubes tu peux chanter dessus.' },
    { duration: 15, title: 'Jouer une photo', description: 'Choisis une photo de ta galerie et improvise la musique qui irait avec : tempo, nuances, ambiance.' },
    { duration: 30, title: 'Reprise à ta sauce', description: 'Choisis une chanson et change une seule chose (tempo, rythmique ou tonalité). Enregistre les deux versions.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Gamme au ralenti', description: 'Joue une gamme très lentement, une respiration par note, en écoutant la fin de chaque son.' },
    { duration: 5, title: 'Le silence entre les notes', description: 'Joue 10 notes en laissant 3 secondes de silence entre chacune. Écoute le silence autant que le son.' },
    { duration: 15, level: 'debutant', title: 'Touches noires', description: 'Improvise doucement uniquement sur les touches noires d’un piano (ou la gamme pentatonique) : aucune fausse note possible.' },
    { duration: 15, level: 'intermediaire', title: 'Satie à l’oreille', description: 'Écoute la Gymnopédie n° 1 d’Erik Satie et essaie d’en retrouver les premières notes à l’oreille.' },
    { duration: 30, title: 'Sons longs', description: 'Joue des notes tenues le plus longtemps possible en travaillant la régularité du son, puis enregistre la dernière minute.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Métronome à 60', description: 'Mets un métronome à 60 et joue (ou tape) exactement sur chaque clic pendant 5 minutes. Il ne reste plus de place pour le reste.' },
    { duration: 5, level: 'debutant', title: 'Boucle hypnotique', description: 'Joue le même motif de 4 notes en boucle pendant 5 minutes, en changeant seulement le volume.' },
    { duration: 15, title: 'Gammes en rythmes', description: 'Métronome lent : joue une gamme en noires, puis en croches, puis en triolets. La concentration chasse le stress.' },
    { duration: 15, title: 'Jouer son stress', description: 'Joue ton stress (notes rapides, grinçantes), puis transforme-le peu à peu en quelque chose de plus lent et plus doux.' },
    { duration: 30, level: 'intermediaire', title: 'Le passage qui résiste', description: 'Joue 20 fois très lentement un passage difficile, en montant de 5 bpm toutes les 3 réussites.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'Body percussion', description: 'Invente un rythme avec tout ton corps (mains, cuisses, poitrine, pieds) et accélère jusqu’à ne plus pouvoir.' },
    { duration: 5, level: 'debutant', title: 'Le morceau le plus énergique', description: 'Joue le morceau le plus énergique que tu connais, à fond, debout si ton instrument le permet.' },
    { duration: 15, title: 'Jam sur backing track', description: 'Lance une backing track rock ou funk en ligne et improvise dessus pendant 15 minutes sans t’arrêter.' },
    { duration: 15, title: 'Montée en vitesse', description: 'Travaille un rythme rapide en doubles-croches au métronome, en augmentant le tempo à chaque réussite.' },
    { duration: 30, title: 'Concert pour salle imaginaire', description: 'Enchaîne 5 morceaux comme un vrai concert, avec les transitions, un rappel et un salut final.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Un morceau et j’y vais', description: 'Joue un seul morceau court comme rituel d’échauffement, puis ouvre la tâche que tu repousses dès la dernière note.' },
    { duration: 5, level: 'debutant', title: 'Le jingle de la tâche', description: 'Invente un jingle de 4 notes pour ta tâche en attente, comme une pub, et chante-le en t’y mettant.' },
    { duration: 15, title: 'Une mesure à la fois', description: 'Apprends un morceau mesure par mesure : la première, puis ajoute la suivante. C’est comme ça qu’on avance sur tout.' },
    { duration: 15, title: 'Une seule prise', description: 'Enregistre-toi en jouant un morceau en une seule prise, sans recommencer. Imparfait mais fini.' },
    { duration: 30, title: 'L’intro remise à plus tard', description: 'Prends le morceau que tu repousses depuis des semaines et apprends-en seulement l’intro.' },
  ],
  curiosite: [
    { duration: 5, level: 'debutant', title: 'Instrument inconnu', description: 'Écoute une vidéo d’un instrument que tu ne connais pas (kora, erhu, oud, handpan) et note ce qui t’étonne.' },
    { duration: 5, level: 'debutant', title: 'L’histoire de ton instrument', description: 'Lis d’où vient ton instrument (ou celui qui te fait rêver) et à quoi il ressemblait il y a 300 ans.' },
    { duration: 15, title: 'Une gamme d’ailleurs', description: 'Découvre une gamme venue d’ailleurs (gamme blues, gamme japonaise hirajoshi) et improvise dessus.' },
    { duration: 15, level: 'intermediaire', title: 'Relevé à l’oreille', description: 'Choisis un morceau court et relève sa mélodie à l’oreille en l’écrivant note par note.' },
    { duration: 30, title: 'Un style jamais joué', description: 'Choisis un style que tu ne joues jamais (bossa nova, reggae, baroque), écoutes-en 3 exemples et essaie son rythme typique.' },
  ],
})

export const chant = definePassionActivities('chant', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Sirènes', description: 'Fais 10 sirènes vocales sur « ou », du plus grave au plus aigu et retour, comme une ambulance.' },
    { duration: 15, title: 'Refrain en langue inconnue', description: 'Apprends le refrain d’une chanson dans une langue que tu ne parles pas, en t’aidant des paroles phonétiques.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Fredonner', description: 'Fredonne bouche fermée une mélodie douce en sentant la vibration dans ton nez et tes joues.' },
    { duration: 15, title: 'À mi-voix', description: 'Chante une chanson calme à mi-voix, en te concentrant uniquement sur la justesse de chaque note.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Le refrain qui relève', description: 'Chante le refrain d’une chanson qui te redonne de l’énergie en exagérant le sourire : ça s’entend dans la voix.' },
    { duration: 15, title: 'Chanson de réconfort', description: 'Apprends toutes les paroles d’une chanson qui te fait du bien, puis chante-la d’une traite.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Recette chantée', description: 'Chante le mode d’emploi d’un objet ou une recette sur l’air d’une chanson connue.' },
    { duration: 15, level: 'intermediaire', title: 'Première seconde voix', description: 'Chante par-dessus une chanson en cherchant une autre note qui sonne bien avec la mélodie : ta première harmonie.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Respiration de chanteur', description: 'Inspire en gonflant le ventre sur 4 temps, expire sur « sss » pendant 8, puis 12, puis 16 temps.' },
    { duration: 15, title: 'Notes tenues', description: 'Tiens des notes longues et stables sur « a », « o » et « ou », en écoutant ta voix devenir plus régulière.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Bulles de lèvres', description: 'Fais vibrer tes lèvres comme un petit moteur en montant et descendant : ça détend la mâchoire et la gorge.' },
    { duration: 15, title: 'Canon avec toi-même', description: 'Enregistre-toi en chantant « Frère Jacques » en boucle, puis chante le canon par-dessus ta propre voix.' },
  ],
  defouler: [
    { duration: 5, level: 'debutant', title: 'À pleine voix', description: 'Mets ton morceau préféré et chante-le à pleine voix, debout, sans te retenir.' },
    { duration: 15, title: 'Concert en playback', description: 'Choisis 3 chansons énergiques et interprète-les comme sur scène, avec gestes et micro imaginaire.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Opéra de la tâche', description: 'Chante ce que tu dois faire façon opéra, très dramatique. Puis fais-le.' },
    { duration: 15, title: 'Échauffement complet', description: 'Fais un vrai échauffement vocal de 10 minutes (respiration, sirènes, vocalises), puis chante un morceau entier.' },
  ],
  curiosite: [
    { duration: 5, title: 'Chant diphonique', description: 'Écoute du chant diphonique mongol (khöömii) et essaie de faire sortir une deuxième note en changeant la forme de ta bouche.' },
    { duration: 30, level: 'intermediaire', title: 'Ta tessiture', description: 'Trouve ta note la plus grave et la plus aiguë avec une appli d’accordeur, puis cherche 3 chansons qui tiennent dans cet écart.' },
  ],
})

export const composition = definePassionActivities('composition', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Mélodie de 4 notes', description: 'Invente une mélodie de 4 notes et répète-la en changeant le rythme jusqu’à ce qu’elle te reste en tête.' },
    { duration: 15, title: 'Beat de cuisine', description: 'Enregistre 4 sons de ta cuisine (casserole, verre, tiroir) et fais-en une boucle rythmique dans BandLab ou GarageBand.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Song Maker', description: 'Ouvre le Song Maker de Chrome Music Lab et remplis la grille d’une petite mélodie en cliquant, puis ajuste à l’oreille.' },
    { duration: 15, title: 'Boucle d’ambiance', description: 'Compose une boucle de 4 mesures très lente et douce, avec seulement 2 sons.' },
  ],
  'coup-de-mou': [
    { duration: 5, title: 'Le soupir qui se relève', description: 'Compose 8 notes qui descendent doucement puis remontent à la fin, comme un soupir qui se relève.' },
    { duration: 15, level: 'debutant', title: 'Le thème de quelqu’un', description: 'Compose un petit thème musical pour une personne que tu aimes, qui lui ressemble.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Mélodie de chiffres', description: 'Transforme ta date de naissance en notes (1 = do, 2 = ré, 3 = mi…) et joue la mélodie obtenue.' },
    { duration: 15, title: 'Trois accords', description: 'Compose un couplet avec 3 accords seulement, puis un refrain qui n’en garde que deux.' },
  ],
  calme: [
    { duration: 5, title: 'Nappe sonore', description: 'Crée un son tenu (une nappe) dans ton appli et laisse-le jouer en ajoutant une note toutes les 30 secondes.' },
    { duration: 30, title: 'Lo-fi de pluie', description: 'Compose une minute de lo-fi : un beat lent, 4 accords doux et un bruit de pluie en fond.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Le rythme d’un cœur calme', description: 'Compose un rythme à 60 bpm avec juste une grosse caisse et un clap, et laisse-le tourner.' },
    { duration: 15, title: 'De la dissonance à l’accord', description: 'Pars d’un accord qui grince et trouve, note par note, comment le faire glisser vers un accord qui sonne bien.' },
  ],
  defouler: [
    { duration: 5, title: 'Montée et drop', description: 'Construis une montée de 8 mesures qui accélère, puis un « drop » avec la basse la plus grosse possible.' },
    { duration: 15, level: 'debutant', title: 'Beat à 140', description: 'Compose un beat à 140 bpm avec grosse caisse, caisse claire et charleston, et monte le volume.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Jingle « c’est parti »', description: 'Compose un jingle de 5 secondes qui annonce « c’est parti » et joue-le juste avant de commencer ta tâche.' },
    { duration: 15, title: 'Le projet abandonné', description: 'Rouvre un projet musical abandonné et ajoute-lui une seule piste. Juste une.' },
  ],
  curiosite: [
    { duration: 5, title: 'Le canon', description: 'Crée un canon : copie ta mélodie sur une deuxième piste et décale-la d’une mesure. Écoute comme elle se répond.' },
    { duration: 30, level: 'intermediaire', title: 'Trois modes', description: 'Compose la même mélodie en mode majeur, mineur puis dorien, et note l’émotion de chaque version.' },
  ],
})

export const podcast = definePassionActivities('podcast', {
  ennui: [
    { duration: 5, level: 'debutant', title: 'Micro-trottoir maison', description: 'Enregistre la réponse de 3 personnes (ou toi en 3 voix) à la question « Quel est ton petit plaisir préféré ? ».' },
    { duration: 15, title: 'Histoire bruitée', description: 'Raconte une histoire de 2 minutes en l’enregistrant avec des bruitages faits avec les objets de ta pièce.' },
  ],
  fatigue: [
    { duration: 5, level: 'debutant', title: 'Paysage sonore', description: 'Enregistre une minute du son de ta pièce ou de ta rue, sans parler, et réécoute-la au casque.' },
    { duration: 15, title: 'Livre audio', description: 'Enregistre-toi en lisant une page d’un livre que tu aimes, comme un vrai livre audio.' },
  ],
  'coup-de-mou': [
    { duration: 5, level: 'debutant', title: 'Message au futur toi', description: 'Enregistre un mémo vocal d’une minute pour toi dans un mois, avec ce que tu voudrais te rappeler.' },
    { duration: 15, title: 'Chronique douce', description: 'Enregistre une chronique de 3 minutes sur une chose qui t’a fait sourire cette semaine.' },
  ],
  'manque-inspiration': [
    { duration: 5, level: 'debutant', title: 'Dix idées d’épisodes', description: 'Liste 10 idées d’épisodes de podcast sur tes sujets préférés et entoure la meilleure.' },
    { duration: 15, title: 'Interview imaginaire', description: 'Enregistre l’interview d’un personnage historique ou fictif en faisant les questions et les réponses.' },
  ],
  calme: [
    { duration: 5, level: 'debutant', title: 'Sons doux', description: 'Enregistre 2 minutes de sons doux : pages qu’on tourne, pinceau sur la table, eau versée dans un verre.' },
    { duration: 30, title: 'Balade sonore', description: 'Enregistre les sons d’une balade de 20 minutes, puis garde les meilleurs moments en un montage de 2 minutes.' },
  ],
  stress: [
    { duration: 5, level: 'debutant', title: 'Respiration guidée', description: 'Enregistre-toi en guidant calmement une respiration de 2 minutes, puis écoute-la.' },
    { duration: 15, title: 'Débrief vocal', description: 'Parle 5 minutes de ce qui te stresse dans un mémo vocal, puis réécoute-toi comme si un ami parlait.' },
  ],
  defouler: [
    { duration: 5, title: 'Commentateur sportif', description: 'Commente à fond, en direct, une action banale (quelqu’un qui fait la vaisselle, ton chat) comme une finale.' },
    { duration: 15, level: 'debutant', title: 'Émission de radio express', description: 'Enregistre 5 minutes de radio avec un jingle, une annonce, une rubrique et une fausse publicité.' },
  ],
  procrastination: [
    { duration: 5, level: 'debutant', title: 'Annonce de l’événement', description: 'Enregistre une annonce radio grandiose : « Ce soir, en direct, [ton prénom] attaque son dossier ! ». Puis fais-le.' },
    { duration: 15, title: 'Épisode pilote', description: 'Enregistre les 3 premières minutes de ton podcast imaginaire, même imparfaites.' },
  ],
  curiosite: [
    { duration: 5, title: 'Technique de narration', description: 'Écoute 5 minutes d’un podcast narratif (fiction audio ou documentaire) et note une technique de narration à voler.' },
    { duration: 30, level: 'intermediaire', title: 'Montage dans Audacity', description: 'Dans Audacity (gratuit), monte une interview en coupant les hésitations et en ajoutant une musique d’intro.' },
  ],
})
