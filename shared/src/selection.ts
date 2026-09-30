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
 *
 * Le mood n'intervient pas ici (il ne sert qu'au ton de l'introduction).
 */

import { activitiesFor } from './activities.ts'
import type { Activity, Duration, PassionId } from './types.ts'

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
  random?: () => number
}

export function pickActivity({ passion, duration, recentIds = [], currentId, random = Math.random }: PickOptions): Activity {
  const pool = activitiesFor(passion, duration)
  if (pool.length === 0) throw new Error(`Aucune activité pour ${passion} × ${duration} min`)

  const recent = new Set([...new Set(recentIds)].slice(0, RECENT_EXCLUSION))
  const withoutCurrent = pool.filter((activity) => activity.id !== currentId)
  const fresh = withoutCurrent.filter((activity) => !recent.has(activity.id))

  // « Si possible » : on relâche les exclusions quand il ne reste plus rien.
  const candidates = fresh.length > 0 ? fresh : withoutCurrent.length > 0 ? withoutCurrent : pool
  const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
  return candidates[index] as Activity
}
