/**
 * Avis des testeurs, suivi d'usage et paliers de création.
 *
 * - La note d'une activité (après « Activité enregistrée. ») aide à trier
 *   les 60 activités : celles qui plaisent, celles qui tombent à plat.
 * - Les événements d'usage mesurent où le parcours se perd (appui sur le gros
 *   bouton, humeur, temps, passion…). Ils ne contiennent aucun texte libre.
 * - Les paliers célèbrent le temps de création cumulé, sans jamais compter
 *   de jours ni faire de reproche.
 */

/** Note d'une activité : 3 = j'ai adoré, 2 = sympa, 1 = pas pour moi. */
export const ACTIVITY_RATINGS = [3, 2, 1] as const
export type ActivityRating = (typeof ACTIVITY_RATINGS)[number]

export const RATING_LABELS: Record<ActivityRating, string> = {
  3: 'J’ai adoré',
  2: 'Sympa',
  1: 'Pas pour moi',
}

export function isActivityRating(value: unknown): value is ActivityRating {
  return ACTIVITY_RATINGS.includes(value as ActivityRating)
}

/** Longueur maximale d'un avis écrit. */
export const MAX_FEEDBACK_LENGTH = 2000

/** Événements d'usage envoyés par la Mini App (les autres étapes sont connues du serveur). */
export const APP_EVENTS = [
  'cta', // appui sur « J'ai envie de scroller »
  'mood', // humeur choisie
  'time', // temps choisi
  'passion', // passion choisie
  'abandon', // retour à l'accueil sans valider l'activité
  'share', // partage d'une création
  'invite', // invitation envoyée à un ami
  'feedback_open', // ouverture du formulaire d'avis
  'settings_open', // ouverture des réglages
  'music', // style de musique d'ambiance choisi (data.ambiance)
  'music_off', // musique d'ambiance coupée
  'progress_open', // ouverture du détail d'une passion (progression)
  'path_open', // ouverture d'un parcours
  'project_create', // projet créé
  'project_finish', // projet terminé
  'tips_open', // « Si tu bloques » ouvert
  'idea_link', // lien d'écoute ou de visionnage ouvert (data.link)
  'challenge', // « Un défi en plus » tiré
  'challenge_open', // ouverture du mot du jour
  'home_screen', // demande d'ajout de Scroll-up à l'écran d'accueil
  'home_screen_added', // icône ajoutée (confirmé par Telegram)
  'home_screen_silent', // demande partie, mais le téléphone n'a rien affiché (autorisation manquante)
  'tab', // onglet ouvert depuis la barre du bas (data.tab : home, progress, gallery)
  'pull', // la tirette de l'accueil tirée vers le haut (plutôt que touchée)
  'skill', // niveau déclaré dans une passion (data.passion, data.level)
  'melody_done', // mélodie guidée jouée jusqu'au bout sur le clavier de l'appli (data.melody)
  'melody_part', // une partie d'apprentissage réussie (data.melody, data.part)
  'piano_stage', // piano ouvert en grand écran (paysage)
  'lesson', // leçon de parcours lancée (mode progression : ni signal ni humeur ; data.step, data.from : parcours ou enchaînement)
] as const
export type AppEventName = (typeof APP_EVENTS)[number]

export function isAppEventName(value: unknown): value is AppEventName {
  return APP_EVENTS.includes(value as AppEventName)
}

/* ------------------------------ Les paliers ------------------------------ */

export interface Milestone {
  /** Minutons (minutes de création) à atteindre. */
  coins: number
  /** Titre court, en sticker. */
  title: string
  /** Une phrase de célébration. */
  message: string
}

export const MILESTONES: readonly Milestone[] = [
  { coins: 5, title: 'Première création', message: 'Ta première envie transformée. Le plus dur, c’est de commencer\u00A0: c’est fait.' },
  { coins: 30, title: '30 minutes', message: 'Une demi-heure rendue à ta créativité plutôt qu’au fil.' },
  { coins: 60, title: '1 heure', message: 'Une heure entière passée à créer. Ton pouce peut être fier.' },
  { coins: 120, title: '2 heures', message: 'Deux heures de création\u00A0: de quoi remplir un carnet.' },
  { coins: 300, title: '5 heures', message: 'Cinq heures. Ta galerie commence à ressembler à une expo.' },
  { coins: 600, title: '10 heures', message: 'Dix heures de création. On te tire notre chapeau.' },
  { coins: 1200, title: '20 heures', message: 'Vingt heures\u00A0: on dit qu’il en faut autant pour apprendre les bases de presque tout.' },
]

/** Le palier franchi en passant de `before` à `after` minutons (le plus haut), ou null. */
export function milestoneCrossed(before: number, after: number): Milestone | null {
  let crossed: Milestone | null = null
  for (const milestone of MILESTONES) if (before < milestone.coins && after >= milestone.coins) crossed = milestone
  return crossed
}

/** Le prochain palier à atteindre, ou null s'ils sont tous franchis. */
export function nextMilestone(total: number): Milestone | null {
  return MILESTONES.find((milestone) => milestone.coins > total) ?? null
}

/** Le dernier palier atteint, ou null. */
export function lastMilestone(total: number): Milestone | null {
  let reached: Milestone | null = null
  for (const milestone of MILESTONES) if (milestone.coins <= total) reached = milestone
  return reached
}
