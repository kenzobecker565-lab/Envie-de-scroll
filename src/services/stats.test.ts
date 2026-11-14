import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '../types'
import { computeBestStreak, computeStats, computeStreak } from './stats'

// Lundi 28 septembre 2026, 18 h (heure locale).
const NOW = new Date(2026, 8, 28, 18)

function entry(dateKey: string, duration: 5 | 15 | 30 = 15, passionId: HistoryEntry['passionId'] = 'dessin'): HistoryEntry {
  return {
    activityId: 'x',
    passionId,
    mood: 'ennui',
    duration,
    title: 't',
    description: 'd',
    completedAt: `${dateKey}T10:00:00.000Z`,
    dateKey,
  }
}

describe('streak', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    const keys = new Set(['2026-09-26', '2026-09-27', '2026-09-28'])
    expect(computeStreak(keys, NOW)).toEqual({ current: 3, needsToday: false })
  })

  it('garde la série d’hier en jeu tant que la journée n’est pas finie', () => {
    const keys = new Set(['2026-09-25', '2026-09-26', '2026-09-27'])
    expect(computeStreak(keys, NOW)).toEqual({ current: 3, needsToday: true })
  })

  it('retombe à zéro après un jour manqué', () => {
    const keys = new Set(['2026-09-24', '2026-09-25', '2026-09-26'])
    expect(computeStreak(keys, NOW)).toEqual({ current: 0, needsToday: false })
  })

  it('traverse correctement les changements de mois', () => {
    const keys = new Set(['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02'])
    expect(computeBestStreak(keys)).toBe(4)
  })

  it('trouve la meilleure série de l’historique', () => {
    const keys = new Set(['2026-09-01', '2026-09-02', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-28'])
    expect(computeBestStreak(keys)).toBe(3)
  })
})

describe('computeStats', () => {
  it('additionne envies transformées, minutes et compte par passion', () => {
    const stats = computeStats(
      [entry('2026-09-28', 5), entry('2026-09-28', 30, 'cinema'), entry('2026-09-20', 15)],
      NOW,
    )
    expect(stats.totalTransformed).toBe(3)
    expect(stats.minutesReclaimed).toBe(50)
    expect(stats.countByPassion).toEqual({ dessin: 2, cinema: 1 })
    expect(stats.currentStreak).toBe(1)
  })

  it('compte la semaine en cours à partir du lundi', () => {
    // Le 27 est un dimanche (semaine précédente), le 28 un lundi.
    const stats = computeStats([entry('2026-09-21'), entry('2026-09-27'), entry('2026-09-28')], NOW)
    expect(stats.thisWeek).toBe(1)
  })

  it('construit 5 semaines de calendrier, du lundi au dimanche', () => {
    const stats = computeStats([entry('2026-09-28'), entry('2026-09-28')], NOW)
    expect(stats.lastWeeks).toHaveLength(35)
    expect(stats.lastWeeks[0]?.dateKey).toBe('2026-08-31') // lundi, 4 semaines plus tôt
    expect(stats.lastWeeks.at(-1)?.dateKey).toBe('2026-10-04') // dimanche de la semaine en cours

    const today = stats.lastWeeks.find((day) => day.isToday)
    expect(today).toMatchObject({ dateKey: '2026-09-28', count: 2, isFuture: false })
    expect(stats.lastWeeks.filter((day) => day.isFuture)).toHaveLength(6)
  })

  it('renvoie la dernière entrée et des zéros quand l’historique est vide', () => {
    const empty = computeStats([], NOW)
    expect(empty.totalTransformed).toBe(0)
    expect(empty.currentStreak).toBe(0)
    expect(empty.lastEntry).toBeUndefined()
  })
})
