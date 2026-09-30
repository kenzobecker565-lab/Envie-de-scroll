/**
 * ============================================================================
 *  CE QUE L'APPLI « TIRE AU HASARD »
 * ============================================================================
 *
 * Huit activités demandent que l'appli propose quelque chose : des mots, une
 * première phrase, des traits de caractère, un genre musical, un film… Sans API
 * externe ni IA dans cette V1, ces tirages se font dans les listes ci-dessous,
 * écrites à la main. On peut les enrichir librement (une ligne = un élément).
 */

import type { ActivityExtra, ExtraKind } from './types.ts'

/** Mots concrets et évocateurs (dessin : 3 mots ; écriture : 1 mot). */
export const WORDS = [
  'lanterne', 'renard', 'parapluie', 'horloge', 'montagne', 'sous-marin', 'cactus', 'fantôme',
  'jardinier', 'météorite', 'cerf-volant', 'boulangerie', 'pirate', 'robot', 'bibliothèque', 'tempête',
  'violon', 'escargot', 'phare', 'dragon', 'valise', 'miroir', 'citrouille', 'astronaute',
  'forêt', 'clé', 'marionnette', 'boussole', 'grenier', 'baleine', 'trompette', 'volcan',
  'chapeau', 'sirène', 'tramway', 'épouvantail', 'lune', 'bicyclette', 'cerise', 'labyrinthe',
  'hibou', 'sablier', 'fanfare', 'iceberg', 'magicien', 'grenouille', 'carrousel', 'pingouin',
  'château', 'bougie', 'tortue', 'nuage', 'cordonnier', 'comète', 'perroquet', 'loupe',
  'jungle', 'chaussette', 'orage', 'accordéon',
] as const

/** Premières phrases d'histoires à continuer (écriture, 15 min). */
export const FIRST_SENTENCES = [
  'La porte du grenier était ouverte, alors qu’elle était fermée à clé depuis trente ans.',
  'Le jour où les chats se sont mis à parler, personne n’a vraiment été surpris.',
  'Il restait exactement quatre minutes avant le départ du dernier train, et Léon n’avait toujours pas retrouvé sa valise.',
  'Sur la plage, au petit matin, quelqu’un avait écrit mon prénom dans le sable.',
  'Ma grand-mère m’a tendu une vieille clé en murmurant : « Surtout, n’ouvre pas avant jeudi. »',
  'Depuis trois jours, il pleuvait uniquement sur notre rue.',
  'La lettre était arrivée avec quarante ans de retard.',
  'Personne ne savait qui jouait du piano, chaque nuit, dans l’appartement vide du cinquième.',
  'Le robot avait une seule question, et il la posait à tout le monde : « Est-ce que tu as bien dormi ? »',
  'Quand j’ai rouvert les yeux, la ville entière avait changé de couleur.',
  'On m’avait prévenu : il ne fallait jamais répondre au téléphone de la cabine abandonnée.',
  'Le marché de nuit n’ouvrait qu’une fois par an, et cette année, j’avais une invitation.',
] as const

/** Traits de caractère (écriture, 30 min : un pour chaque personnage). */
export const CHARACTER_TRAITS = [
  'timide', 'bavard·e', 'menteur·se', 'optimiste', 'rancunier·e', 'curieux·se',
  'maladroit·e', 'arrogant·e', 'généreux·se', 'anxieux·se', 'têtu·e', 'rêveur·se',
  'jaloux·se', 'loyal·e', 'impatient·e', 'sarcastique', 'naïf·ve', 'perfectionniste',
  'distrait·e', 'courageux·se', 'superstitieux·se', 'radin·e', 'enthousiaste', 'mystérieux·se',
] as const

/** Genres musicaux à découvrir (musique, 5 min). */
export const MUSIC_GENRES = [
  'Bossa nova', 'Afrobeat', 'Jazz manouche', 'City pop japonaise', 'Fado', 'Shoegaze',
  'Highlife', 'Cumbia', 'Musique carnatique', 'Dub', 'Zouk', 'Krautrock',
  'Gnawa', 'Bluegrass', 'Synthwave', 'Rebetiko', 'Éthio-jazz', 'Trip-hop',
  'Musique baroque', 'Mbalax', 'Raï', 'Math rock', 'Tango nuevo', 'Gospel',
  'Maloya', 'Qawwali',
] as const

/** Films (cinéma, 5 min : bande-annonce). */
export const FILMS = [
  'Le Voyage de Chihiro (2001)', 'Parasite (2019)', 'Whiplash (2014)', 'Portrait de la jeune fille en feu (2019)',
  'Everything Everywhere All at Once (2022)', 'Intouchables (2011)', 'La Haine (1995)',
  'Le Fabuleux Destin d’Amélie Poulain (2001)', 'In the Mood for Love (2000)', 'Spider-Man : New Generation (2018)',
  'Coco (2017)', 'Le Château ambulant (2004)', 'Your Name (2016)', 'Persepolis (2007)',
  'Les Triplettes de Belleville (2003)', 'Mad Max : Fury Road (2015)', 'Interstellar (2014)',
  'Le Roi et l’Oiseau (1980)', 'The Grand Budapest Hotel (2014)', 'Get Out (2017)', 'Les Enfants loups, Ame et Yuki (2012)',
  'Perfect Blue (1997)', 'Akira (1988)', 'Le Tombeau des lucioles (1988)', 'La La Land (2016)',
  'Les Demoiselles de Rochefort (1967)', 'Moonlight (2016)', 'Là-haut (2009)', 'WALL-E (2008)',
  'Ma vie de Courgette (2016)', 'J’ai perdu mon corps (2019)', 'Le Garçon et le Héron (2023)',
  'Past Lives (2023)', 'Anatomie d’une chute (2023)', 'Flow (2024)',
] as const

/** Séries animées (cinéma, 5 min : « un film ou anime au hasard »). */
export const ANIME_SERIES = [
  'Cowboy Bebop (série, 1998)', 'Frieren (série, 2023)', 'Mob Psycho 100 (série, 2016)',
  'Violet Evergarden (série, 2018)', 'Fullmetal Alchemist : Brotherhood (série, 2009)',
  'Neon Genesis Evangelion (série, 1995)', 'Ping Pong the Animation (série, 2014)', 'Odd Taxi (série, 2021)',
  'Vinland Saga (série, 2019)', 'Samurai Champloo (série, 2004)', 'Haikyu!! (série, 2014)', 'Mononoke (série, 2007)',
] as const

/** Courts-métrages et premiers épisodes d'anime (cinéma, 15 min). */
export const SHORTS_AND_EPISODES = [
  'Paperman (court-métrage, 2012)', 'La Petite Casserole d’Anatole (court-métrage, 2014)', 'Piper (court-métrage, 2016)',
  'Hair Love (court-métrage, 2019)', 'Bao (court-métrage, 2018)', 'Le Moine et le Poisson (court-métrage, 1994)',
  'Father and Daughter (court-métrage, 2000)', 'Logorama (court-métrage, 2009)', 'Kitbull (court-métrage, 2019)',
  'The Present (court-métrage, 2014)', 'Alike (court-métrage, 2015)',
  'Le premier épisode de Cowboy Bebop', 'Le premier épisode de Frieren', 'Le premier épisode de Mob Psycho 100',
  'Le premier épisode de Violet Evergarden', 'Le premier épisode d’Odd Taxi', 'Le premier épisode de Samurai Champloo',
] as const

type Random = () => number

/** Tire `count` éléments distincts d'une liste. */
export function sample<T>(list: readonly T[], count: number, random: Random = Math.random): T[] {
  const pool = [...list]
  const picked: T[] = []
  while (picked.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length)
    picked.push(pool.splice(index, 1)[0] as T)
  }
  return picked
}

const EXTRA_DRAWS: Record<ExtraKind, (random: Random) => Omit<ActivityExtra, 'kind'>> = {
  'trois-mots': (random) => ({ label: 'Tes 3 mots', items: sample(WORDS, 3, random) }),
  'un-mot': (random) => ({ label: 'Ton mot', items: sample(WORDS, 1, random) }),
  'premiere-phrase': (random) => ({ label: 'Ta première phrase', items: sample(FIRST_SENTENCES, 1, random) }),
  'deux-traits': (random) => {
    const [first, second] = sample(CHARACTER_TRAITS, 2, random)
    return { label: 'Tes deux personnages', items: [`Le premier est ${first}`, `Le second est ${second}`] }
  },
  'genre-musical': (random) => ({ label: 'Le genre proposé', items: sample(MUSIC_GENRES, 1, random) }),
  film: (random) => ({ label: 'Le film proposé', items: sample(FILMS, 1, random) }),
  'film-ou-anime': (random) => ({ label: 'La proposition', items: sample([...FILMS, ...ANIME_SERIES], 1, random) }),
  'court-ou-episode': (random) => ({ label: 'À regarder', items: sample(SHORTS_AND_EPISODES, 1, random) }),
}

/** Fait le tirage demandé par une activité. */
export function drawExtra(kind: ExtraKind, random: Random = Math.random): ActivityExtra {
  return { kind, ...EXTRA_DRAWS[kind](random) }
}

/**
 * Pour les activités où l'appli propose un titre (film, anime, court), ce
 * titre sert de suggestion pour « ce que tu as exploré » à la validation.
 */
export function suggestedTitle(extra: ActivityExtra | null | undefined): string | undefined {
  if (!extra) return undefined
  if (extra.kind === 'film' || extra.kind === 'film-ou-anime' || extra.kind === 'court-ou-episode' || extra.kind === 'genre-musical') {
    return extra.items[0]
  }
  return undefined
}
