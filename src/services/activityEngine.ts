import { ACTIVITIES } from '../data/activities'
import { getMood } from '../data/moods'
import type { Activity, Duration, MoodId, PassionId } from '../types'

/**
 * ============================================================================
 *  MOTEUR DE SÉLECTION D'ACTIVITÉ
 * ============================================================================
 *
 * Rôle : à partir de la combinaison choisie par l'utilisateur
 * (passion + mood + temps disponible), piocher UNE activité dans la
 * bibliothèque.
 *
 * Principe : on cherche d'abord la correspondance exacte. S'il n'y en a pas
 * (ou si l'utilisateur les a déjà toutes vues avec « une autre idée »), on
 * élargit progressivement la recherche, par « paliers », en restant TOUJOURS
 * dans la passion choisie :
 *
 *   1. exact        même mood, même durée
 *   2. plus-court   même mood, durée plus courte (ça rentre dans le temps dispo)
 *   3. mood-voisin  mood de la même famille d'énergie, même durée ou plus courte
 *   4. autre-mood   n'importe quel mood, durée qui rentre dans le temps dispo
 *   5. plus-long    même mood mais plus long que prévu  ┐ seulement si la
 *   6. autre        n'importe quelle activité           ┘ passion n'a rien d'assez court
 *
 * Dans un palier, on tire au sort — en évitant, si possible, les activités
 * réalisées récemment, pour garder de la variété d'un jour à l'autre.
 *
 * Mode débutant : les activités marquées `intermediaire` sont écartées (la
 * bibliothèque garantit qu'il reste au moins une option par passion et mood).
 *
 * Quand tous les paliers ont été épuisés par « une autre idée », on
 * recommence un tour complet (`cycled: true`) sans reproposer tout de suite
 * l'activité affichée à l'écran.
 *
 * Ce fichier ne dépend ni de React ni de la base de données : on peut le
 * tester seul (voir activityEngine.test.ts) et le réutiliser tel quel côté
 * serveur ou dans un bot Telegram.
 */

export type MatchQuality = 'exact' | 'plus-court' | 'mood-voisin' | 'autre-mood' | 'plus-long' | 'autre'

export interface SuggestionRequest {
  passionId: PassionId
  mood: MoodId
  /** Temps disponible choisi par l'utilisateur. */
  duration: Duration
  /** Écarte les activités de niveau intermédiaire. */
  beginnerMode?: boolean
  /** Activités déjà proposées pendant ce parcours (bouton « une autre idée »). */
  shownIds?: readonly string[]
  /** Activités réalisées récemment (historique), à éviter si possible. */
  recentIds?: readonly string[]
}

export interface Suggestion {
  activity: Activity
  quality: MatchQuality
  /** Vrai si toutes les idées avaient déjà été vues et qu'on recommence un tour. */
  cycled: boolean
}

interface Tier {
  quality: MatchQuality
  matches: (activity: Activity) => boolean
}

/** Construit la liste ordonnée des paliers pour une demande donnée. */
function buildTiers(mood: MoodId, duration: Duration): Tier[] {
  const energy = getMood(mood).energy
  const isNeighbourMood = (candidate: MoodId) => candidate !== mood && getMood(candidate).energy === energy

  return [
    { quality: 'exact', matches: (a) => a.mood === mood && a.duration === duration },
    { quality: 'plus-court', matches: (a) => a.mood === mood && a.duration < duration },
    { quality: 'mood-voisin', matches: (a) => isNeighbourMood(a.mood) && a.duration <= duration },
    { quality: 'autre-mood', matches: (a) => a.mood !== mood && !isNeighbourMood(a.mood) && a.duration <= duration },
    { quality: 'plus-long', matches: (a) => a.mood === mood && a.duration > duration },
    { quality: 'autre', matches: () => true },
  ]
}

/**
 * Dans un palier « plus court », on préfère la durée la plus proche du temps
 * disponible : avec 30 min devant soi, une activité de 15 min vaut mieux
 * qu'une de 5.
 */
function keepClosestDurations(pool: Activity[]): Activity[] {
  const longest = Math.max(...pool.map((activity) => activity.duration))
  return pool.filter((activity) => activity.duration === longest)
}

function pickOne<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length))
  return items[index] as T
}

/**
 * Propose une activité. Renvoie `null` uniquement si la passion n'a aucune
 * activité dans la bibliothèque.
 *
 * @param library  la bibliothèque à utiliser (par défaut : toutes les activités)
 * @param random   générateur aléatoire (remplaçable dans les tests)
 */
export function suggestActivity(
  request: SuggestionRequest,
  library: readonly Activity[] = ACTIVITIES,
  random: () => number = Math.random,
): Suggestion | null {
  let candidates = library.filter((activity) => activity.passionId === request.passionId)
  if (request.beginnerMode) {
    const accessible = candidates.filter((activity) => activity.level !== 'intermediaire')
    if (accessible.length > 0) candidates = accessible
  }
  if (candidates.length === 0) return null

  const shown = new Set(request.shownIds ?? [])
  const recent = new Set(request.recentIds ?? [])
  const allTiers = buildTiers(request.mood, request.duration)

  // Les 4 premiers paliers proposent des activités qui tiennent dans le temps
  // disponible. Les paliers « plus-long » et « autre » ne servent que si la
  // passion n'a vraiment rien d'assez court.
  const fittingTiers = allTiers.slice(0, 4)
  const hasFitting = candidates.some((activity) => fittingTiers.some((tier) => tier.matches(activity)))
  const tiers = hasFitting ? fittingTiers : allTiers

  const findIn = (excluded: ReadonlySet<string>): Suggestion | null => {
    for (const tier of tiers) {
      let pool = candidates.filter((activity) => tier.matches(activity) && !excluded.has(activity.id))
      if (pool.length === 0) continue

      if (tier.quality === 'plus-court' || tier.quality === 'mood-voisin' || tier.quality === 'autre-mood') {
        pool = keepClosestDurations(pool)
      }
      // Variété : on évite ce qui a été fait récemment… s'il reste autre chose.
      const fresh = pool.filter((activity) => !recent.has(activity.id))
      return { activity: pickOne(fresh.length > 0 ? fresh : pool, random), quality: tier.quality, cycled: false }
    }
    return null
  }

  // Premier essai : tout sauf ce qui a déjà été montré pendant ce parcours.
  const suggestion = findIn(shown)
  if (suggestion) return suggestion

  // Tout a été vu : on recommence un tour, sans reproposer la dernière idée affichée.
  const lastShown = request.shownIds?.at(-1)
  const restart = findIn(new Set(lastShown ? [lastShown] : [])) ?? findIn(new Set())
  return restart ? { ...restart, cycled: true } : null
}

/** Message affiché sous la carte quand la correspondance n'est pas exacte. */
export function describeMatch(suggestion: Suggestion): string | null {
  if (suggestion.cycled) return 'Tu as vu toutes les idées pour ce choix : on repart pour un tour.'
  switch (suggestion.quality) {
    case 'exact':
      return null
    case 'plus-court':
      return 'Une idée un peu plus courte que ton temps dispo : tu auras de la marge.'
    case 'mood-voisin':
      return 'On élargit à une humeur proche de la tienne.'
    case 'autre-mood':
      return 'On sort un peu de ton humeur du moment pour te proposer autre chose.'
    case 'plus-long':
      return 'Celle-ci prend un peu plus de temps : commence-la, tu pourras la finir plus tard.'
    case 'autre':
      return 'Une idée libre, pour changer.'
  }
}
