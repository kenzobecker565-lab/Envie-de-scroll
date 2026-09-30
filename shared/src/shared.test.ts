import { describe, expect, it } from 'vitest'
import {
  ACTIVITIES,
  activitiesFor,
  DURATIONS,
  drawExtra,
  frenchTypography,
  getActivity,
  isActivityRating,
  isAppEventName,
  lastMilestone,
  milestoneCrossed,
  nextMilestone,
  INTROS,
  MOODS,
  normalizePassions,
  PASSION_IDS,
  pickActivity,
  pickIntro,
  RAW_ACTIVITIES,
  RECENT_EXCLUSION,
  reminderMessage,
  sample,
  suggestedTitle,
  unlockTime,
  type ExtraKind,
} from './index.ts'

/** Générateur pseudo-aléatoire déterministe, pour des tests reproductibles. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('bibliothèque des 60 activités', () => {
  it('contient 5 activités par passion et par temps, soit 60', () => {
    expect(ACTIVITIES).toHaveLength(60)
    for (const passion of PASSION_IDS) {
      for (const duration of DURATIONS) expect(activitiesFor(passion, duration)).toHaveLength(5)
    }
  })

  it('numérote les activités de 1 à 15 comme dans la liste validée', () => {
    expect(getActivity('dessin-5-1')?.text).toBe('Dessine un objet de ton bureau')
    expect(getActivity('dessin-15-7')?.extra).toBe('trois-mots')
    expect(getActivity('ecriture-30-11')?.extra).toBe('deux-traits')
    expect(getActivity('cinema-30-15')?.text).toBe('Découvre un nouveau film ou anime recommandé à partir de ceux que tu aimes déjà')
    expect(new Set(ACTIVITIES.map((activity) => activity.id)).size).toBe(60)
  })

  it('garde le texte d’origine, seule la typographie change', () => {
    for (const activity of ACTIVITIES) {
      const raw = RAW_ACTIVITIES[activity.passion][activity.duration][(activity.number - 1) % 5]
      const text = typeof raw === 'string' ? raw : raw?.[0]
      expect(activity.text).toBe(frenchTypography(text ?? ''))
    }
    expect(getActivity('ecriture-5-2')?.text).toBe('Termine cette phrase de 5 façons différentes : « Aujourd’hui, j’ai remarqué que… »')
  })

  it('signale les 8 activités où l’appli tire quelque chose au hasard', () => {
    const withExtra = ACTIVITIES.filter((activity) => activity.extra).map((activity) => activity.id)
    expect(withExtra).toEqual([
      'dessin-15-7',
      'ecriture-15-6',
      'ecriture-15-9',
      'ecriture-30-11',
      'musique-5-1',
      'cinema-5-1',
      'cinema-5-2',
      'cinema-15-6',
    ])
  })
})

describe('choix d’une activité', () => {
  it('ne pioche que dans la passion et le temps choisis', () => {
    const random = seeded(1)
    for (let i = 0; i < 50; i++) {
      const activity = pickActivity({ passion: 'musique', duration: 15, random })
      expect(activity.passion).toBe('musique')
      expect(activity.duration).toBe(15)
    }
  })

  it('écarte les 3 dernières propositions', () => {
    const random = seeded(2)
    const recentIds = ['dessin-5-1', 'dessin-5-2', 'dessin-5-3']
    for (let i = 0; i < 50; i++) {
      const activity = pickActivity({ passion: 'dessin', duration: 5, recentIds, random })
      expect(recentIds).not.toContain(activity.id)
    }
  })

  it('ne compte que les 3 plus récentes (distinctes)', () => {
    const random = seeded(3)
    const recentIds = ['dessin-5-1', 'dessin-5-1', 'dessin-5-2', 'dessin-5-3', 'dessin-5-4']
    const seen = new Set<string>()
    for (let i = 0; i < 80; i++) seen.add(pickActivity({ passion: 'dessin', duration: 5, recentIds, random }).id)
    expect([...seen].sort()).toEqual(['dessin-5-4', 'dessin-5-5'])
  })

  it('« Une autre idée » ne repropose jamais l’activité affichée', () => {
    const random = seeded(4)
    for (let i = 0; i < 50; i++) {
      const activity = pickActivity({ passion: 'ecriture', duration: 30, currentId: 'ecriture-30-12', recentIds: [], random })
      expect(activity.id).not.toBe('ecriture-30-12')
    }
  })

  it('en enchaînant « Une autre idée », aucune activité ne revient sur 4 propositions d’affilée', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const random = seeded(seed)
      const proposed: string[] = []
      let current = pickActivity({ passion: 'cinema', duration: 15, random })
      proposed.unshift(current.id)
      for (let i = 0; i < 30; i++) {
        current = pickActivity({ passion: 'cinema', duration: 15, currentId: current.id, recentIds: proposed, random })
        proposed.unshift(current.id)
      }
      for (let i = 0; i + RECENT_EXCLUSION < proposed.length; i++) {
        expect(new Set(proposed.slice(i, i + RECENT_EXCLUSION + 1)).size).toBe(RECENT_EXCLUSION + 1)
      }
    }
  })

  it('relâche les exclusions quand il ne reste rien', () => {
    const all = activitiesFor('dessin', 30).map((activity) => activity.id)
    const activity = pickActivity({ passion: 'dessin', duration: 30, recentIds: all, currentId: 'dessin-30-11', random: seeded(6) })
    expect(activity.id).not.toBe('dessin-30-11')
  })
})

describe('tirages de l’appli', () => {
  it('tire des éléments distincts', () => {
    const random = seeded(7)
    for (let i = 0; i < 30; i++) {
      const words = sample(['a', 'b', 'c', 'd'], 3, random)
      expect(new Set(words).size).toBe(3)
    }
  })

  it('produit un tirage pour chaque type', () => {
    const kinds: ExtraKind[] = ['trois-mots', 'un-mot', 'premiere-phrase', 'deux-traits', 'genre-musical', 'film', 'film-ou-anime', 'court-ou-episode']
    for (const kind of kinds) {
      const extra = drawExtra(kind, seeded(8))
      expect(extra.kind).toBe(kind)
      expect(extra.label.length).toBeGreaterThan(0)
      expect(extra.items.length).toBeGreaterThan(0)
    }
    expect(drawExtra('trois-mots', seeded(9)).items).toHaveLength(3)
    expect(drawExtra('deux-traits', seeded(9)).items).toHaveLength(2)
  })

  it('suggère le titre proposé pour les activités cinéma et musique', () => {
    expect(suggestedTitle(drawExtra('film', seeded(10)))).toMatch(/\(\d{4}\)$/)
    expect(suggestedTitle(drawExtra('trois-mots', seeded(10)))).toBeUndefined()
    expect(suggestedTitle(null)).toBeUndefined()
  })
})

describe('moods et introductions', () => {
  it('répartit les 8 moods en deux familles de 4', () => {
    expect(MOODS.filter((mood) => mood.energy === 'basse')).toHaveLength(4)
    expect(MOODS.filter((mood) => mood.energy === 'haute')).toHaveLength(4)
  })

  it('a au moins une introduction par mood', () => {
    for (const mood of MOODS) {
      expect(INTROS[mood.id].length).toBeGreaterThan(0)
      expect(pickIntro(mood.id, seeded(11))).toMatch(/ :$/)
    }
  })
})

describe('règles', () => {
  it('valide la sélection de passions (1 à 3)', () => {
    expect(normalizePassions(['musique', 'dessin'])).toEqual(['dessin', 'musique'])
    expect(normalizePassions([])).toBeNull()
    expect(normalizePassions(['dessin', 'ecriture', 'musique', 'cinema'])).toBeNull()
    expect(normalizePassions(['dessin', 'dessin'])).toBeNull()
    expect(normalizePassions(['peinture'])).toBeNull()
    expect(normalizePassions('dessin')).toBeNull()
  })

  it('débloque la validation une fois la durée écoulée', () => {
    const start = new Date('2026-09-30T10:00:00Z')
    expect(unlockTime(start, 15).toISOString()).toBe('2026-09-30T10:15:00.000Z')
  })

  it('alterne les deux messages de relance', () => {
    expect(reminderMessage(0)).toBe('Un scroll de plus et TikTok va commencer à me demander une commission.')
    expect(reminderMessage(1)).toBe('On me signale une activité suspecte sur ton téléphone. Ça sent le scroll à plein nez.')
    expect(reminderMessage(2)).toBe(reminderMessage(0))
  })
})

describe('paliers de création', () => {
  it('repère le palier franchi (le plus haut s’il y en a plusieurs)', () => {
    expect(milestoneCrossed(0, 5)?.title).toBe('Première création')
    expect(milestoneCrossed(5, 20)).toBeNull()
    expect(milestoneCrossed(25, 65)?.coins).toBe(60)
    expect(milestoneCrossed(60, 60)).toBeNull()
  })

  it('donne le prochain palier et le dernier atteint', () => {
    expect(nextMilestone(0)?.coins).toBe(5)
    expect(nextMilestone(59)?.coins).toBe(60)
    expect(nextMilestone(5000)).toBeNull()
    expect(lastMilestone(3)).toBeNull()
    expect(lastMilestone(130)?.coins).toBe(120)
  })

  it('reconnaît les notes et les événements', () => {
    expect(isActivityRating(3)).toBe(true)
    expect(isActivityRating(0)).toBe(false)
    expect(isAppEventName('cta')).toBe(true)
    expect(isAppEventName('open')).toBe(false)
  })
})
