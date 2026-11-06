import { describe, expect, it } from 'vitest'
import { MOOD_IDS } from '../moods'
import { ALL_PASSION_IDS } from '../passions'
import type { PassionId } from '../../types'
import { ACTIVITIES, ACTIVITIES_BY_PASSION } from './index'

/**
 * Ces tests servent de garde-fou quand tu enrichis la bibliothèque :
 * lance `npm test` après tes modifications.
 */

/** Passions « principales » : au moins 4 activités par mood. */
const CORE_PASSIONS: PassionId[] = ['dessin', 'cinema', 'animation', 'ecriture', 'musique', 'sport', 'cuisine']

describe('bibliothèque d’activités', () => {
  it('a un identifiant unique par activité', () => {
    const ids = ACTIVITIES.map((activity) => activity.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('range chaque activité sous la bonne passion', () => {
    for (const [passionId, activities] of Object.entries(ACTIVITIES_BY_PASSION)) {
      for (const activity of activities) expect(activity.passionId).toBe(passionId)
    }
  })

  it('propose au moins 4 activités par mood pour les passions principales', () => {
    for (const passionId of CORE_PASSIONS) {
      for (const mood of MOOD_IDS) {
        const count = ACTIVITIES_BY_PASSION[passionId].filter((a) => a.mood === mood).length
        expect(count, `${passionId} × ${mood}`).toBeGreaterThanOrEqual(4)
      }
    }
  })

  it('couvre les 3 durées pour chaque passion principale et chaque mood', () => {
    for (const passionId of CORE_PASSIONS) {
      for (const mood of MOOD_IDS) {
        for (const duration of [5, 15, 30] as const) {
          const exists = ACTIVITIES_BY_PASSION[passionId].some(
            (a) => a.mood === mood && a.duration === duration,
          )
          expect(exists, `${passionId} × ${mood} × ${duration} min`).toBe(true)
        }
      }
    }
  })

  it('propose au moins 2 activités par mood pour toutes les autres passions', () => {
    for (const passionId of ALL_PASSION_IDS) {
      for (const mood of MOOD_IDS) {
        const count = ACTIVITIES_BY_PASSION[passionId].filter((a) => a.mood === mood).length
        expect(count, `${passionId} × ${mood}`).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('a toujours une activité de 5 minutes, et une accessible aux débutants, par passion et par mood', () => {
    for (const passionId of ALL_PASSION_IDS) {
      for (const mood of MOOD_IDS) {
        const pool = ACTIVITIES_BY_PASSION[passionId].filter((a) => a.mood === mood)
        expect(pool.some((a) => a.duration === 5), `${passionId} × ${mood} (5 min)`).toBe(true)
        expect(pool.some((a) => a.level !== 'intermediaire'), `${passionId} × ${mood} (débutant)`).toBe(true)
      }
    }
  })

  it('a des textes remplis, sans espaces parasites', () => {
    for (const activity of ACTIVITIES) {
      expect(activity.title.trim(), activity.id).toBe(activity.title)
      expect(activity.description.trim(), activity.id).toBe(activity.description)
      expect(activity.title.length, activity.id).toBeGreaterThan(2)
      expect(activity.description.length, activity.id).toBeGreaterThan(30)
    }
  })
})
