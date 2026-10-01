/**
 * « Le savais-tu ? » : une anecdote ou une astuce, à la fin d'une activité,
 * liée à la passion. De quoi repartir avec quelque chose en plus.
 *
 * ⚠️ Ces textes ne font pas partie du contenu validé : à relire librement.
 */

import { frenchTypography } from './typography.ts'
import type { PassionId } from './types.ts'

const RAW_FACTS: Record<PassionId, string[]> = {
  dessin: [
    'Les dessins de la grotte Chauvet, en Ardèche, ont environ 36 000 ans. Dessiner, c\'est l\'une des plus vieilles choses que l\'humanité sache faire.',
    'Avant l\'invention de la gomme, on effaçait le crayon avec de la mie de pain.',
    'Un crayon à papier ne contient pas de plomb : sa mine est un mélange de graphite et d\'argile, mis au point par le Français Nicolas-Jacques Conté en 1795.',
    'Léonard de Vinci écrivait souvent ses notes à l\'envers, de droite à gauche : il fallait un miroir pour les lire.',
    'Hokusai avait environ 70 ans quand il a publié La Grande Vague de Kanagawa. Il écrivait que rien de ce qu\'il avait dessiné avant ses 70 ans ne valait vraiment la peine.',
    'Albrecht Dürer a gravé son célèbre rhinocéros en 1515 sans jamais en avoir vu un : il s\'est fié à une lettre et à un croquis.',
    'Beaucoup d\'auteurs de BD esquissent au crayon bleu clair : il disparaît au scan, et seul l\'encrage reste.',
    'Charles Schulz a dessiné Peanuts pendant près de 50 ans, presque 18 000 strips, sans jamais d\'assistant.',
    'Le "dessin à l\'aveugle" (dessiner un objet sans regarder sa feuille) est un exercice classique pour apprendre à mieux observer.',
    'Van Gogh a laissé plus d\'un millier de dessins et de croquis, en à peine dix ans de pratique.',
    'Inktober, le défi d\'un dessin à l\'encre par jour en octobre, a été lancé en 2009 par l\'illustrateur Jake Parker.',
    'On prête à Picasso cette phrase : "Il m\'a fallu toute une vie pour apprendre à dessiner comme un enfant."',
  ],
  ecriture: [
    'Georges Perec a écrit La Disparition (1969), un roman entier sans une seule fois la lettre e.',
    'Dans Exercices de style (1947), Raymond Queneau raconte la même anecdote de bus de 99 façons différentes.',
    'J. K. Rowling a eu l\'idée de Harry Potter dans un train en retard, entre Manchester et Londres, en 1990.',
    'Mary Shelley a commencé Frankenstein à 18 ans, pour un concours d\'histoires de fantômes entre amis, un été de pluie en Suisse.',
    'Stephen King s\'impose environ 2 000 mots par jour. Il le raconte dans Écriture : mémoires d\'un métier.',
    'Les "pages du matin" de Julia Cameron : trois pages écrites à la main chaque matin, sans se relire, pour vider sa tête.',
    'Un haïku tient en trois vers de 5, 7 et 5 syllabes. Une contrainte minuscule, des siècles de chefs-d\'œuvre.',
    'À la recherche du temps perdu, de Proust, compte plus d\'un million de mots.',
    'Kafka avait demandé à son ami Max Brod de brûler ses manuscrits. Brod a refusé : c\'est grâce à lui qu\'on peut lire Le Procès.',
    'L\'Oulipo (Ouvroir de littérature potentielle) est né en 1960 : des écrivains et des mathématiciens qui inventent des contraintes pour écrire.',
    'Agatha Christie est l\'autrice de romans la plus vendue de tous les temps, selon le Guinness des records.',
    'Plusieurs études suggèrent qu\'on retient mieux ce qu\'on écrit à la main que ce qu\'on tape au clavier.',
  ],
  musique: [
    'Écouter une musique qu\'on aime libère de la dopamine, la même molécule que celle du plaisir de manger : une étude de l\'université McGill l\'a montré en 2011.',
    'Beethoven a composé sa Neuvième Symphonie alors qu\'il était presque entièrement sourd.',
    'Paul McCartney a rêvé la mélodie de Yesterday. Avant de trouver les paroles, la chanson s\'appelait Scrambled Eggs (œufs brouillés).',
    'Kind of Blue, de Miles Davis (1959), est l\'album de jazz le plus vendu de l\'histoire.',
    '4′33″ de John Cage (1952) : 4 minutes 33 de silence. La musique, ce sont les bruits de la salle.',
    'Le Boléro de Ravel répète le même thème pendant un quart d\'heure, en montant doucement en puissance.',
    'La bossa nova est née à Rio à la fin des années 1950, avec João Gilberto et Tom Jobim.',
    'Un "ver d\'oreille", c\'est une chanson qui tourne en boucle dans la tête. Une étude de 2015 suggère que mâcher un chewing-gum aide à s\'en débarrasser.',
    'Les Tiny Desk Concerts existent depuis 2008 : les artistes jouent vraiment derrière un bureau, dans les locaux de la radio NPR.',
    'L\'oreille absolue (reconnaître une note sans référence) est rare : on l\'estime à environ une personne sur 10 000.',
    'L\'afrobeat est né au Nigeria à la fin des années 1960, quand Fela Kuti a mélangé le highlife, le jazz et le funk.',
    'Écouter un album en entier, dans l\'ordre, c\'est entendre l\'histoire que l\'artiste a voulu raconter.',
  ],
  cinema: [
    'La première projection publique payante d\'un film a eu lieu à Paris, le 28 décembre 1895, au Salon indien du Grand Café : les frères Lumière.',
    'Georges Méliès était magicien avant d\'être cinéaste. Il racontait qu\'un jour, sa caméra s\'était bloquée en filmant un omnibus : à la projection, l\'omnibus s\'était changé en corbillard. Le trucage était né.',
    'Toy Story (1995) est le premier long métrage entièrement en images de synthèse.',
    'Le bourdonnement des sabres laser de Star Wars mélange le ronronnement d\'un vieux projecteur et le grésillement d\'une télévision.',
    'Le "cri Wilhelm", enregistré en 1951, a été réutilisé dans des centaines de films. Tends l\'oreille !',
    'Alfred Hitchcock apparaît dans la plupart de ses films, le temps d\'une silhouette.',
    'Le bruitage, en anglais "foley", doit son nom à Jack Foley, qui a inventé le métier à Hollywood.',
    'Parasite est le premier film en langue non anglaise à remporter l\'Oscar du meilleur film, en 2020.',
    'Le Voyage de Chihiro a remporté l\'Oscar du meilleur film d\'animation en 2003.',
    'Le nom Ghibli vient d\'un vent chaud du Sahara. Hayao Miyazaki, passionné d\'aviation, l\'a emprunté à un avion italien.',
    'Le cinéma tourne à 24 images par seconde depuis l\'arrivée du parlant, à la fin des années 1920.',
    'Marjane Satrapi a adapté elle-même sa BD Persepolis au cinéma, avec Vincent Paronnaud. Le film a reçu le prix du jury à Cannes en 2007.',
  ],
}

export const FACTS: Readonly<Record<PassionId, readonly string[]>> = {
  dessin: RAW_FACTS.dessin.map(frenchTypography),
  ecriture: RAW_FACTS.ecriture.map(frenchTypography),
  musique: RAW_FACTS.musique.map(frenchTypography),
  cinema: RAW_FACTS.cinema.map(frenchTypography),
}

/** Une anecdote de la passion, toujours la même pour une même graine. */
export function factFor(passion: PassionId, random: () => number = Math.random): string {
  const list = FACTS[passion]
  return list[Math.floor(random() * list.length)] ?? list[0] ?? ''
}
