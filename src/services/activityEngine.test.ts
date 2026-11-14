import { describe, expect, it } from 'vitest'
import type { Activity } from '../types'
import { suggestActivity } from './activityEngine'

/** Mini-bibliothèque maîtrisée pour tester chaque palier du moteur. */
const LIBRARY: Activity[] = [
  { id: 'a', passionId: 'dessin', mood: 'ennui', duration: 15, title: 'A', description: 'exact 1' },
  { id: 'b', passionId: 'dessin', mood: 'ennui', duration: 15, title: 'B', description: 'exact 2', level: 'intermediaire' },
  { id: 'c', passionId: 'dessin', mood: 'ennui', duration: 5, title: 'C', description: 'plus court' },
  { id: 'd', passionId: 'dessin', mood: 'fatigue', duration: 15, title: 'D', description: 'mood voisin (énergie basse)' },
  { id: 'e', passionId: 'dessin', mood: 'stress', duration: 5, title: 'E', description: 'autre énergie' },
  { id: 'f', passionId: 'dessin', mood: 'ennui', duration: 30, title: 'F', description: 'plus long' },
  { id: 'g', passionId: 'cinema', mood: 'ennui', duration: 15, title: 'G', description: 'autre passion' },
]

const first = () => 0

describe('suggestActivity', () => {
  it('propose en priorité la combinaison exacte passion + mood + durée', () => {
    const suggestion = suggestActivity({ passionId: 'dessin', mood: 'ennui', duration: 15 }, LIBRARY, first)
    expect(suggestion?.activity.id).toBe('a')
    expect(suggestion?.quality).toBe('exact')
  })

  it('ne sort jamais de la passion choisie', () => {
    for (let i = 0; i < 20; i++) {
      const suggestion = suggestActivity({ passionId: 'cinema', mood: 'stress', duration: 5 }, LIBRARY)
      expect(suggestion?.activity.passionId).toBe('cinema')
    }
  })

  it('« une autre idée » passe à la suivante, puis élargit à une durée plus courte', () => {
    const second = suggestActivity({ passionId: 'dessin', mood: 'ennui', duration: 15, shownIds: ['a'] }, LIBRARY, first)
    expect(second?.activity.id).toBe('b')

    const third = suggestActivity({ passionId: 'dessin', mood: 'ennui', duration: 15, shownIds: ['a', 'b'] }, LIBRARY, first)
    expect(third?.activity.id).toBe('c')
    expect(third?.quality).toBe('plus-court')
  })

  it('élargit ensuite à un mood de la même énergie, puis aux autres moods', () => {
    const neighbour = suggestActivity(
      { passionId: 'dessin', mood: 'ennui', duration: 15, shownIds: ['a', 'b', 'c'] },
      LIBRARY,
      first,
    )
    expect(neighbour?.activity.id).toBe('d')
    expect(neighbour?.quality).toBe('mood-voisin')

    const other = suggestActivity(
      { passionId: 'dessin', mood: 'ennui', duration: 15, shownIds: ['a', 'b', 'c', 'd'] },
      LIBRARY,
      first,
    )
    expect(other?.activity.id).toBe('e')
    expect(other?.quality).toBe('autre-mood')
  })

  it('ne propose pas plus long que le temps disponible tant qu’il existe plus court', () => {
    for (let i = 0; i < 30; i++) {
      const suggestion = suggestActivity({ passionId: 'dessin', mood: 'ennui', duration: 15 }, LIBRARY)
      expect(suggestion?.activity.duration).toBeLessThanOrEqual(15)
    }
  })

  it('recommence un tour quand tout a été vu, sans répéter la dernière idée', () => {
    const suggestion = suggestActivity(
      { passionId: 'dessin', mood: 'ennui', duration: 15, shownIds: ['b', 'c', 'd', 'e', 'a'] },
      LIBRARY,
      first,
    )
    expect(suggestion?.cycled).toBe(true)
    expect(suggestion?.activity.id).not.toBe('a')
  })

  it('écarte les activités intermédiaires en mode débutant', () => {
    const suggestion = suggestActivity(
      { passionId: 'dessin', mood: 'ennui', duration: 15, beginnerMode: true, shownIds: ['a'] },
      LIBRARY,
      first,
    )
    expect(suggestion?.activity.id).toBe('c')
  })

  it('évite les activités faites récemment quand c’est possible', () => {
    const suggestion = suggestActivity(
      { passionId: 'dessin', mood: 'ennui', duration: 15, recentIds: ['a'] },
      LIBRARY,
      first,
    )
    expect(suggestion?.activity.id).toBe('b')
  })

  it('accepte une activité plus longue seulement si rien ne rentre dans le temps', () => {
    const onlyLong: Activity[] = [
      { id: 'long', passionId: 'voyage', mood: 'calme', duration: 30, title: 'L', description: 'seule option' },
    ]
    const suggestion = suggestActivity({ passionId: 'voyage', mood: 'calme', duration: 5 }, onlyLong, first)
    expect(suggestion?.activity.id).toBe('long')
    expect(suggestion?.quality).toBe('plus-long')
  })

  it('fonctionne avec la vraie bibliothèque pour toutes les combinaisons', async () => {
    const { ALL_PASSION_IDS } = await import('../data/passions')
    const { MOOD_IDS } = await import('../data/moods')
    for (const passionId of ALL_PASSION_IDS) {
      for (const mood of MOOD_IDS) {
        for (const duration of [5, 15, 30] as const) {
          const suggestion = suggestActivity({ passionId, mood, duration, beginnerMode: true })
          expect(suggestion, `${passionId} × ${mood} × ${duration}`).not.toBeNull()
          expect(suggestion?.activity.duration).toBeLessThanOrEqual(duration)
          expect(suggestion?.activity.level).not.toBe('intermediaire')
          // La bibliothèque couvre toujours au moins le mood choisi.
          expect(['exact', 'plus-court']).toContain(suggestion?.quality)
        }
      }
    }
  })
})
