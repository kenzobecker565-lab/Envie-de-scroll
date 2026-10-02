/**
 * ============================================================================
 *  CHOIX D'UNE ACTIVITÉ
 * ============================================================================
 *
 * 1. On part des 5 activités de la passion × du temps choisis.
 * 2. On tire au hasard, en excluant si possible les dernières activités déjà
 *    proposées à l'utilisateur pour cette passion et ce temps (3 au plus).
 * 3. « Une autre idée » : l'activité affichée est toujours écartée, puis on
 *    retire au sort selon la même logique. Avec 5 activités et 3 exclusions,
 *    une activité ne revient jamais dans les 4 propositions qui se suivent.
 * 4. Passions avec niveau (Piano) : seulement les activités adaptées au
 *    niveau déclaré (voir ACTIVITY_SKILLS).
 * 5. Le tirage penche (sans jamais rien interdire) :
 *    - vers les activités notées « J'ai adoré », et loin de « Pas pour moi » ;
 *    - selon l'humeur : plutôt calme quand on est en retrait, plutôt vive
 *      quand on est sous tension.
 */

import { activitiesFor } from './activities.ts'
import type { ActivityRating } from './feedback.ts'
import type { Activity, Duration, Energy, PassionId, SkillLevel } from './types.ts'

/** Nombre de propositions récentes écartées du tirage (« les 2-3 dernières »). */
export const RECENT_EXCLUSION = 3

export interface PickOptions {
  passion: PassionId
  duration: Duration
  /**
   * Identifiants des activités proposées récemment pour cette passion et ce
   * temps, de la plus récente à la plus ancienne. Seules les
   * `RECENT_EXCLUSION` premières distinctes comptent.
   */
  recentIds?: readonly string[]
  /** Activité affichée au moment de « Une autre idée » : toujours écartée. */
  currentId?: string
  /** Les notes données par l'utilisateur, par activité (la plus récente). */
  ratings?: Readonly<Record<string, ActivityRating>>
  /** La famille d'énergie de l'humeur choisie. */
  energy?: Energy
  /** Ne tirer que parmi ces activités (« sans son »). */
  allowedIds?: readonly string[]
  random?: () => number
}

/** Le rythme d'une activité : calme (contemplative, posée) ou vive (rapide, ludique). Les autres sont neutres. */
export type Pace = 'calme' | 'vive'

export const ACTIVITY_PACE: Readonly<Record<string, Pace>> = {
  'dessin-5-5': 'calme', 'dessin-15-8': 'calme', 'dessin-30-15': 'calme',
  'dessin-5-3': 'vive', 'dessin-15-6': 'vive', 'dessin-15-7': 'vive', 'dessin-30-13': 'vive',
  'ecriture-5-1': 'calme', 'ecriture-15-7': 'calme', 'ecriture-15-8': 'calme', 'ecriture-30-13': 'calme',
  'ecriture-5-2': 'vive', 'ecriture-5-4': 'vive', 'ecriture-15-6': 'vive', 'ecriture-30-11': 'vive', 'ecriture-30-12': 'vive',
  'musique-5-2': 'calme', 'musique-30-12': 'calme', 'musique-30-15': 'calme',
  'musique-5-1': 'vive', 'musique-15-6': 'vive', 'musique-15-7': 'vive', 'musique-15-10': 'vive', 'musique-30-11': 'vive',
  'cinema-5-5': 'calme', 'cinema-15-10': 'calme', 'cinema-30-12': 'calme',
  'cinema-5-1': 'vive', 'cinema-5-4': 'vive', 'cinema-15-9': 'vive',
  'piano-5-3': 'calme', 'piano-15-8': 'calme', 'piano-15-9': 'calme', 'piano-30-13': 'calme', 'piano-30-15': 'calme',
  'piano-5-4': 'vive', 'piano-15-7': 'vive', 'piano-15-10': 'vive', 'piano-30-14': 'vive',
}

/**
 * Passions avec niveau (Piano) : les niveaux auxquels chaque activité
 * convient. Chaque niveau garde au moins deux activités par temps. Une
 * activité absente de la liste convient à tout le monde.
 */
export const ACTIVITY_SKILLS: Readonly<Record<string, readonly SkillLevel[]>> = {
  'piano-5-1': ['debutant'],
  'piano-5-2': ['debutant'],
  'piano-5-3': ['debutant', 'bases'],
  'piano-5-4': ['bases', 'confirme'],
  'piano-5-5': ['bases', 'confirme'],
  'piano-15-6': ['debutant', 'bases'],
  'piano-15-7': ['debutant'],
  'piano-15-8': ['bases', 'confirme'],
  'piano-15-9': ['bases', 'confirme'],
  'piano-15-10': ['confirme'],
  'piano-30-11': ['bases', 'confirme'],
  'piano-30-12': ['confirme'],
  'piano-30-13': ['debutant', 'bases'],
  'piano-30-14': ['confirme'],
  'piano-30-15': ['debutant', 'bases'],
}

/** L'activité convient-elle à ce niveau ? (Sans niveau déclaré, tout convient.) */
export function suitsSkill(activityId: string, skill: SkillLevel | undefined): boolean {
  const levels = ACTIVITY_SKILLS[activityId]
  return !skill || !levels || levels.includes(skill)
}

/** Les activités d'une passion et d'un temps adaptées au niveau déclaré. */
export function skillActivitiesFor(passion: PassionId, duration: Duration, skill: SkillLevel | undefined): Activity[] {
  return activitiesFor(passion, duration).filter((activity) => suitsSkill(activity.id, skill))
}

/**
 * Les activités Musique et Cinéma qui se font sans son (lire, chercher,
 * composer une liste) : pour « Pas de son autour de toi ? ».
 */
export const QUIET_ACTIVITY_IDS: readonly string[] = [
  'musique-15-7', 'musique-15-8',
  'cinema-5-2', 'cinema-5-5', 'cinema-15-7', 'cinema-15-10', 'cinema-30-13', 'cinema-30-15',
]

/** Les activités sans son d'une passion pour un temps donné (souvent aucune en Musique). */
export function quietActivitiesFor(passion: PassionId, duration: Duration): Activity[] {
  return activitiesFor(passion, duration).filter((activity) => QUIET_ACTIVITY_IDS.includes(activity.id))
}

/** Poids d'une note : « J'ai adoré » revient plus souvent, « Pas pour moi » rarement. */
const RATING_WEIGHT: Record<ActivityRating, number> = { 3: 1.6, 2: 1, 1: 0.25 }

/** Poids du rythme selon l'humeur. */
const PACE_WEIGHT: Record<Energy, Record<Pace, number>> = {
  basse: { calme: 1.5, vive: 0.7 },
  haute: { calme: 0.7, vive: 1.5 },
}

/** Le poids d'une activité dans le tirage (1 = neutre). */
export function activityWeight(activity: Activity, { ratings, energy }: Pick<PickOptions, 'ratings' | 'energy'> = {}): number {
  const rating = ratings?.[activity.id]
  const pace = ACTIVITY_PACE[activity.id]
  return (rating ? RATING_WEIGHT[rating] : 1) * (pace && energy ? PACE_WEIGHT[energy][pace] : 1)
}

export function pickActivity({ passion, duration, recentIds = [], currentId, ratings, energy, allowedIds, random = Math.random }: PickOptions): Activity {
  const pool = activitiesFor(passion, duration).filter((activity) => !allowedIds || allowedIds.includes(activity.id))
  if (pool.length === 0) throw new Error(`Aucune activité pour ${passion} × ${duration} min`)

  const recent = new Set([...new Set(recentIds)].slice(0, RECENT_EXCLUSION))
  const withoutCurrent = pool.filter((activity) => activity.id !== currentId)
  const fresh = withoutCurrent.filter((activity) => !recent.has(activity.id))

  // « Si possible » : on relâche les exclusions quand il ne reste plus rien.
  const candidates = fresh.length > 0 ? fresh : withoutCurrent.length > 0 ? withoutCurrent : pool
  // Tirage pondéré (à poids égaux, c'est un tirage uniforme).
  const weights = candidates.map((activity) => activityWeight(activity, { ratings, energy }))
  let target = random() * weights.reduce((sum, weight) => sum + weight, 0)
  for (const [index, weight] of weights.entries()) {
    target -= weight
    if (target < 0) return candidates[index] as Activity
  }
  return candidates[candidates.length - 1] as Activity
}
