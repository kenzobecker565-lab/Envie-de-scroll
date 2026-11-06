import { addDays, nextDateKey, previousDateKey, startOfWeek, toDateKey } from '../lib/dates'
import type { DayCell, HistoryEntry, PassionId, Stats } from '../types'

/**
 * ============================================================================
 *  STATISTIQUES
 * ============================================================================
 *
 * Fonctions « pures » : on leur donne l'historique, elles renvoient les
 * chiffres. Rien n'est stocké : tout est recalculé à chaque changement, ce
 * qui évite les compteurs désynchronisés.
 */

/**
 * Temps estimé récupéré pour une envie transformée, en minutes.
 *
 * Hypothèse retenue : chaque envie transformée « rend » la durée de
 * l'activité réalisée (5, 15 ou 30 min) — c'est du temps passé à créer
 * plutôt qu'à scroller. Pour une estimation plus ambitieuse (une session de
 * scroll dure souvent plus longtemps que prévu), c'est ici qu'il faut
 * modifier le calcul, par exemple : `return entry.duration * 1.5`.
 */
export function minutesReclaimedFor(entry: Pick<HistoryEntry, 'duration'>): number {
  return entry.duration
}

/**
 * Streak (série) : nombre de jours consécutifs avec au moins une envie
 * transformée. Un jour sans activité casse la série… sauf aujourd'hui : tant
 * que la journée n'est pas finie, la série d'hier reste « en jeu ».
 */
export function computeStreak(dateKeys: ReadonlySet<string>, now = new Date()): {
  current: number
  needsToday: boolean
} {
  const today = toDateKey(now)
  let cursor = dateKeys.has(today) ? today : previousDateKey(today)
  const needsToday = !dateKeys.has(today)

  let current = 0
  while (dateKeys.has(cursor)) {
    current += 1
    cursor = previousDateKey(cursor)
  }
  return { current, needsToday: needsToday && current > 0 }
}

/** Plus longue série jamais réalisée. */
export function computeBestStreak(dateKeys: ReadonlySet<string>): number {
  let best = 0
  for (const key of dateKeys) {
    // On ne compte qu'à partir du premier jour de chaque série.
    if (dateKeys.has(previousDateKey(key))) continue
    let length = 0
    let cursor = key
    while (dateKeys.has(cursor)) {
      length += 1
      cursor = nextDateKey(cursor)
    }
    best = Math.max(best, length)
  }
  return best
}

/** Cinq semaines de calendrier (lundi → dimanche), la dernière étant la semaine en cours. */
export function buildLastWeeks(countByDay: ReadonlyMap<string, number>, now = new Date()): DayCell[] {
  const today = toDateKey(now)
  const firstMonday = addDays(startOfWeek(now), -28)
  return Array.from({ length: 35 }, (_, index) => {
    const dateKey = toDateKey(addDays(firstMonday, index))
    return {
      dateKey,
      count: countByDay.get(dateKey) ?? 0,
      isToday: dateKey === today,
      isFuture: dateKey > today,
    }
  })
}

export function computeStats(entries: readonly HistoryEntry[], now = new Date()): Stats {
  const countByDay = new Map<string, number>()
  const countByPassion: Partial<Record<PassionId, number>> = {}
  let minutesReclaimed = 0
  let lastEntry: HistoryEntry | undefined

  for (const entry of entries) {
    countByDay.set(entry.dateKey, (countByDay.get(entry.dateKey) ?? 0) + 1)
    countByPassion[entry.passionId] = (countByPassion[entry.passionId] ?? 0) + 1
    minutesReclaimed += minutesReclaimedFor(entry)
    if (!lastEntry || entry.completedAt > lastEntry.completedAt) lastEntry = entry
  }

  const dateKeys = new Set(countByDay.keys())
  const streak = computeStreak(dateKeys, now)
  const mondayKey = toDateKey(startOfWeek(now))
  const todayKey = toDateKey(now)

  return {
    currentStreak: streak.current,
    bestStreak: Math.max(computeBestStreak(dateKeys), streak.current),
    streakNeedsToday: streak.needsToday,
    totalTransformed: entries.length,
    minutesReclaimed,
    lastEntry,
    countByPassion,
    thisWeek: entries.filter((entry) => entry.dateKey >= mondayKey && entry.dateKey <= todayKey).length,
    lastWeeks: buildLastWeeks(countByDay, now),
  }
}
