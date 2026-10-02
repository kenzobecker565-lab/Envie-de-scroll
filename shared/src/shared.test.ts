import { describe, expect, it } from 'vitest'
import {
  ACTIVITIES,
  keyboardMelody,
  keyboardWindow,
  melody,
  melodyParts,
  midiNumber,
  pickLessonIntro,
  ACTIVITY_PACE,
  activityWeight,
  canPlayChallenge,
  cheerFor,
  countFor,
  dailyWord,
  dayMoment,
  drawChallenge,
  FACTS,
  factFor,
  getChallengeActivity,
  GUIDES,
  guideFor,
  homeLine,
  isFixedActivityId,
  monthDaysUntil,
  quietActivitiesFor,
  seededRandom,
  canPlayStep,
  countWords,
  DIFFICULTIES,
  getActivity,
  getPathStep,
  isBaseActivity,
  PATHS,
  pathProgress,
  pathsFor,
  STEP_DURATIONS,
  collection,
  collectionSize,
  LEVEL_TITLES,
  levelCrossed,
  passionLevel,
  AMBIANCE_IDS,
  AMBIANCES,
  ambianceCredits,
  DEFAULT_AMBIANCE,
  isAmbianceChoice,
  resolveAmbiance,
  activitiesFor,
  DURATIONS,
  drawExtra,
  frenchTypography,
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
  asksSkill,
  keyboardKeys,
  missingSkills,
  noteFrequency,
  noteLabel,
  parseSkills,
  SKILL_LEVELS,
  skillActivitiesFor,
  suitsSkill,
  formatClock,
  isScrollMoment,
  reminderMinutes,
  SCROLL_MOMENTS,
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
  it('contient 5 activités par passion et par temps : 60 pour la V1, 75 avec le Piano', () => {
    expect(ACTIVITIES).toHaveLength(75)
    expect(ACTIVITIES.filter((activity) => activity.passion !== 'piano')).toHaveLength(60)
    for (const passion of PASSION_IDS) {
      for (const duration of DURATIONS) expect(activitiesFor(passion, duration)).toHaveLength(5)
    }
  })

  it('numérote les activités de 1 à 15 comme dans la liste validée', () => {
    expect(getActivity('dessin-5-1')?.text).toBe('Dessine un objet de ton bureau')
    expect(getActivity('dessin-15-7')?.extra).toBe('trois-mots')
    expect(getActivity('ecriture-30-11')?.extra).toBe('deux-traits')
    expect(getActivity('cinema-30-15')?.text).toBe('Découvre un nouveau film ou anime recommandé à partir de ceux que tu aimes déjà')
    expect(new Set(ACTIVITIES.map((activity) => activity.id)).size).toBe(75)
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
  it('valide la sélection de passions (au moins une, sans limite)', () => {
    expect(normalizePassions(['musique', 'dessin'])).toEqual(['dessin', 'musique'])
    expect(normalizePassions([])).toBeNull()
    expect(normalizePassions(['piano', 'dessin', 'ecriture', 'musique', 'cinema'])).toEqual(['dessin', 'ecriture', 'musique', 'cinema', 'piano'])
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

  it('relance juste avant le moment où l’on scrolle, sinon à l’heure par défaut', () => {
    for (const moment of SCROLL_MOMENTS) expect(isScrollMoment(moment)).toBe(true)
    expect(isScrollMoment('apero')).toBe(false)
    expect(reminderMinutes('nuit', 19)).toBe(21 * 60 + 45)
    expect(reminderMinutes(null, 19)).toBe(19 * 60)
    expect(formatClock(reminderMinutes('matin', 19))).toBe('7 h 30')
    expect(formatClock(reminderMinutes('midi', 19))).toBe('12 h')
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

describe('ambiances sonores', () => {
  it('a un style par identifiant, chacun avec son fichier', () => {
    expect(AMBIANCES.map((ambiance) => ambiance.id)).toEqual([...AMBIANCE_IDS])
    expect(AMBIANCE_IDS).toContain(DEFAULT_AMBIANCE)
    for (const ambiance of AMBIANCES) expect(ambiance.src).toMatch(/^\/music\/[a-z0-9-]+\.mp3$/)
  })

  it('joue le style choisi, ou un autre au hasard', () => {
    expect(resolveAmbiance('piano', 'jazz')).toBe('piano')
    for (const random of [0, 0.3, 0.6, 0.9999]) {
      const picked = resolveAmbiance('hasard', 'lofi', random)
      expect(picked).not.toBe('lofi')
      expect(AMBIANCE_IDS).toContain(picked)
    }
    expect(isAmbianceChoice('hasard')).toBe(true)
    expect(isAmbianceChoice('8bit')).toBe(true)
    expect(isAmbianceChoice('disco')).toBe(false)
  })

  it('crédite chaque morceau sous licence', () => {
    const credits = ambianceCredits()
    for (const ambiance of AMBIANCES) if (ambiance.credit) expect(credits).toContain(ambiance.credit.title)
    expect(credits).toContain('CC BY 4.0')
    expect(credits).toContain('incompetech.com')
  })
})

describe('progression par passion', () => {
  it('monte de niveau avec les minutons de la passion', () => {
    expect(passionLevel('dessin', 0)).toMatchObject({ level: 0, title: null, next: { level: 1, minutes: 5 }, progress: 0 })
    expect(passionLevel('dessin', 5)).toMatchObject({ level: 1, title: 'Gribouilleur·euse', next: { level: 2, minutes: 30 } })
    expect(passionLevel('ecriture', 75).level).toBe(2)
    expect(passionLevel('ecriture', 75).progress).toBeCloseTo((75 - 30) / (120 - 30))
    expect(passionLevel('cinema', 5000)).toMatchObject({ level: 5, title: 'Cinémathèque ambulante', next: null, progress: 1 })
  })

  it('repère le niveau franchi (le plus haut s’il y en a plusieurs)', () => {
    expect(levelCrossed('musique', 0, 15)?.level).toBe(1)
    expect(levelCrossed('musique', 15, 20)).toBeNull()
    expect(levelCrossed('musique', 25, 130)?.title).toBe('Mélomane')
  })

  it('a cinq titres par passion et une collection de 15 activités, 5 par temps', () => {
    for (const passion of PASSION_IDS) {
      expect(LEVEL_TITLES[passion]).toHaveLength(5)
      expect(collectionSize(passion)).toBe(15)
      expect(collection(passion).map((group) => group.activities.length)).toEqual([5, 5, 5])
    }
  })
})

describe('parcours', () => {
  it('a deux parcours par passion (trois pour le Piano), de six étapes de plus en plus longues', () => {
    expect(PATHS).toHaveLength(11)
    for (const passion of PASSION_IDS) {
      expect(pathsFor(passion).map((path) => path.tier)).toEqual(passion === 'piano' ? [1, 2, 3] : [1, 2])
      for (const path of pathsFor(passion)) {
        expect(path.steps.map((step) => step.duration)).toEqual([...STEP_DURATIONS])
        expect(path.steps.map((step) => step.difficulty)).toEqual([...DIFFICULTIES])
        for (const step of path.steps) {
          expect(step.passion).toBe(passion)
          expect(step.text.length).toBeGreaterThan(20)
          expect(step.text).not.toMatch(/'/)
        }
      }
    }
    const ids = PATHS.flatMap((path) => path.steps.map((step) => step.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('retrouve une étape comme une activité, hors de la collection', () => {
    const step = getPathStep('parcours-visages-3')
    expect(step).toMatchObject({ pathId: 'visages', index: 3, duration: 15, difficulty: 'Moyen' })
    expect(getActivity('parcours-visages-3')?.text).toBe(step?.text)
    expect(isBaseActivity('parcours-visages-3')).toBe(false)
    expect(isBaseActivity(ACTIVITIES[0]!.id)).toBe(true)
  })

  it('débloque les étapes une à une, et le parcours confirmé après le premier ou au niveau 3', () => {
    const start = pathProgress('dessin', [], 0)
    expect(start.map((entry) => [entry.path.id, entry.done, entry.unlocked, entry.next?.index])).toEqual([
      ['premiers-traits', 0, true, 1],
      ['visages', 0, false, 1],
    ])
    const step2 = getPathStep('parcours-premiers-traits-2')!
    expect(canPlayStep(step2, [], 1)).toBe(false)
    expect(canPlayStep(step2, ['parcours-premiers-traits-1'], 1)).toBe(true)
    // Les étapes comptent dans l'ordre : une étape isolée plus loin n'avance pas le parcours.
    expect(pathProgress('dessin', ['parcours-premiers-traits-3'], 1)[0]?.done).toBe(0)

    const all = pathsFor('dessin')[0]!.steps.map((step) => step.id)
    const finished = pathProgress('dessin', all, 2)
    expect(finished[0]).toMatchObject({ done: 6, finished: true, next: null })
    expect(finished[1]?.unlocked).toBe(true)
    expect(pathProgress('dessin', [], 3)[1]?.unlocked).toBe(true)
    expect(canPlayStep(getPathStep('parcours-visages-1')!, [], 2)).toBe(false)
    expect(canPlayStep(getPathStep('parcours-visages-1')!, [], 3)).toBe(true)
  })

  it('compte les mots', () => {
    expect(countWords('  Il pleuvait   sur la ville. ')).toBe(5)
    expect(countWords('')).toBe(0)
    expect(countWords(null)).toBe(0)
  })
})

describe('aides sous les activités', () => {
  it('donne 2 ou 3 pistes à chacune des activités, et des idées là où il faut trouver soi-même', () => {
    for (const activity of ACTIVITIES) {
      const guide = guideFor(activity.id)
      expect(guide, activity.id).toBeDefined()
      expect(guide!.tips.length).toBeGreaterThanOrEqual(2)
      expect(guide!.tips.length).toBeLessThanOrEqual(3)
      for (const tip of guide!.tips) expect(tip).not.toMatch(/'|"/)
      if (guide!.ideas) {
        expect(guide!.ideas.items.length).toBeGreaterThanOrEqual(guide!.ideas.show ?? 3)
        expect(new Set(guide!.ideas.items).size).toBe(guide!.ideas.items.length)
      }
    }
    // Les 75 activités, plus les 18 leçons du Piano, qui ont leurs propres pistes.
    expect(Object.keys(GUIDES)).toHaveLength(93)
    // Étapes de parcours et mots du jour : les pistes générales de leur passion.
    expect(guideFor('parcours-visages-2')?.tips.length).toBeGreaterThan(0)
    expect(guideFor('defi-dessin-2026-10-01')?.tips.length).toBeGreaterThan(0)
  })

  it('fixe un objectif au carnet d’écriture, et le compte', () => {
    expect(guideFor('ecriture-15-6')?.goal).toMatchObject({ count: 100, unit: 'mots', label: '100 mots' })
    expect(guideFor('ecriture-5-1')?.goal?.label).toBe('3 phrases')
    expect(countFor('mots', ' un deux  trois ')).toBe(3)
    expect(countFor('lignes', 'une\n\n deux \ntrois')).toBe(3)
    expect(countFor('phrases', 'Il pleut. Le chat dort ! Et moi')).toBe(3)
    expect(countFor('phrases', 'Il pleut. Le chat dort !')).toBe(2)
    expect(countFor('phrases', '')).toBe(0)
  })

  it('tire un défi en plus pour le dessin et l’écriture seulement', () => {
    const random = seeded(11)
    for (let i = 0; i < 40; i++) {
      const drawing = drawChallenge('dessin', random)!
      expect(drawing.text.length).toBeGreaterThan(5)
      if (drawing.palette) expect(drawing.palette.colors).toHaveLength(3)
      expect(drawChallenge('ecriture', random)?.text).toBeTruthy()
    }
    expect(drawChallenge('musique')).toBeNull()
  })

  it('a un hasard reproductible', () => {
    const first = seededRandom('abc')
    const second = seededRandom('abc')
    expect([first(), first(), first()]).toEqual([second(), second(), second()])
    expect(seededRandom('abd')()).not.toBe(seededRandom('abc')())
  })

  it('a des anecdotes et des félicitations pour chaque passion', () => {
    for (const passion of PASSION_IDS) {
      expect(FACTS[passion].length).toBeGreaterThanOrEqual(10)
      for (const fact of FACTS[passion]) expect(fact).not.toMatch(/'|"/)
      expect(factFor(passion, seeded(1))).toBeTruthy()
      expect(cheerFor(passion, { duration: 15 }, seeded(2))).not.toMatch(/\{[dn]\}/)
    }
    expect(cheerFor('ecriture', { duration: 15, words: 42 }, () => 0)).toContain('42 mots')
  })

  it('adapte l’introduction à l’heure, une fois sur deux, tard le soir et tôt le matin', () => {
    expect(INTROS.ennui).toContain(pickIntro('ennui', () => 0.9, 14).replace(/ /g, ' ').replace(/ /g, ' ').replace(/’/g, '’'))
    const night = pickIntro('ennui', () => 0.1, 23)
    expect(INTROS.ennui.map(frenchTypography)).not.toContain(night)
    expect(dayMoment(7)).toBe('matin')
    expect(dayMoment(23)).toBe('nuit')
    expect(homeLine('nuit', () => 0)).toMatch(/dormir/)
  })
})

describe('tirage pondéré', () => {
  it('penche vers « J’ai adoré » et loin de « Pas pour moi », sans rien interdire', () => {
    const random = seeded(21)
    const counts: Record<string, number> = {}
    const ratings = { 'dessin-5-1': 3, 'dessin-5-2': 1 } as const
    for (let i = 0; i < 4000; i++) {
      const id = pickActivity({ passion: 'dessin', duration: 5, ratings, random }).id
      counts[id] = (counts[id] ?? 0) + 1
    }
    expect(counts['dessin-5-1']!).toBeGreaterThan(counts['dessin-5-3']!)
    expect(counts['dessin-5-2']!).toBeLessThan(counts['dessin-5-3']! / 2)
    expect(counts['dessin-5-2']!).toBeGreaterThan(0)
  })

  it('fait pencher l’humeur vers des activités calmes ou vives', () => {
    expect(activityWeight(getActivity('musique-5-2')!, { energy: 'basse' })).toBeGreaterThan(1)
    expect(activityWeight(getActivity('musique-5-2')!, { energy: 'haute' })).toBeLessThan(1)
    expect(activityWeight(getActivity('musique-5-3')!, { energy: 'haute' })).toBe(1)
    for (const id of Object.keys(ACTIVITY_PACE)) expect(isBaseActivity(id), id).toBe(true)
  })

  it('trouve des activités sans son en Cinéma pour chaque temps, et seulement parmi elles', () => {
    for (const duration of DURATIONS) expect(quietActivitiesFor('cinema', duration).length).toBeGreaterThan(0)
    expect(quietActivitiesFor('musique', 5)).toEqual([])
    const allowedIds = quietActivitiesFor('cinema', 5).map((activity) => activity.id)
    const random = seeded(5)
    for (let i = 0; i < 30; i++) expect(allowedIds).toContain(pickActivity({ passion: 'cinema', duration: 5, allowedIds, random }).id)
  })
})

describe('le mot du jour', () => {
  it('a un mot par jour pour octobre, novembre et décembre, et un mot tiré les autres mois', () => {
    const days = (month: string, count: number) => Array.from({ length: count }, (_, index) => `2026-${month}-${String(index + 1).padStart(2, '0')}`)
    for (const [month, count] of [['10', 31], ['11', 30], ['12', 31]] as const) {
      const words = days(month, count).map((day) => dailyWord(day).word)
      expect(new Set(words).size, month).toBe(count)
    }
    expect(dailyWord('2026-10-01')).toMatchObject({ word: 'lanterne', theme: 'Octobre des frissons doux' })
    expect(dailyWord('2027-03-14').word).toBe(dailyWord('2027-03-14').word)
    expect(dailyWord('2027-03-14').theme).toMatch(/mars/)
  })

  it('se joue comme une activité de 15 min, à rattraper dans le mois, jamais à l’avance', () => {
    const challenge = getChallengeActivity('defi-ecriture-2026-10-03')
    expect(challenge).toMatchObject({ passion: 'ecriture', duration: 15, word: 'brume', day: '2026-10-03' })
    expect(getActivity('defi-ecriture-2026-10-03')?.text).toContain('brume')
    expect(getActivity('defi-musique-2026-10-03')).toBeUndefined()
    expect(getChallengeActivity('defi-dessin-2026-02-30')).toBeUndefined()
    expect(isFixedActivityId('defi-dessin-2026-10-01')).toBe(true)
    expect(isFixedActivityId('parcours-visages-1')).toBe(true)
    expect(isFixedActivityId('dessin-5-1')).toBe(false)
    expect(isBaseActivity('defi-dessin-2026-10-01')).toBe(false)
    expect(canPlayChallenge('defi-dessin-2026-10-07', '2026-10-07')).toBe(true)
    expect(canPlayChallenge('defi-dessin-2026-10-01', '2026-10-07')).toBe(true)
    expect(canPlayChallenge('defi-dessin-2026-10-08', '2026-10-07')).toBe(false)
    expect(canPlayChallenge('defi-dessin-2026-09-30', '2026-10-07')).toBe(false)
    expect(monthDaysUntil('2026-10-03')).toEqual(['2026-10-03', '2026-10-02', '2026-10-01'])
  })
})

describe('piano : niveau, contenu ciblé, mélodies', () => {
  it('chaque leçon de piano se valide au clavier : elle a sa mélodie, jouable sur le clavier de l’appli', () => {
    const lessons = pathsFor('piano').flatMap((path) => path.steps)
    expect(lessons).toHaveLength(18)
    for (const lesson of lessons) {
      const tune = keyboardMelody(lesson.id)
      expect(tune, lesson.id).toBeDefined()
      expect(tune!.notes.every((note) => midiNumber(note) >= midiNumber('C3') && midiNumber(note) <= midiNumber('C5')), lesson.id).toBe(true)
    }
    expect(keyboardMelody('parcours-premiers-traits-1')).toBeUndefined()
    expect(pickLessonIntro(() => 0)).toBe('Nouvelle leçon, pas à pas\u00A0:')
  })

  it('« J’ai envie de scroller » au piano : que des tutos de chansons, chaque partie tient à l’écran et sur le clavier', () => {
    const songs = ACTIVITIES.filter((activity) => activity.passion === 'piano')
    expect(songs).toHaveLength(15)
    for (const song of songs) {
      expect(song.text, song.id).toMatch(/^Apprends /)
      const tune = keyboardMelody(song.id)
      expect(tune, song.id).toBeDefined()
      // La chanson annoncée est bien celle qu'on joue : le premier mot marquant du titre est dans la consigne.
      const word = tune!.title.split(/[(,]/)[0]!.split(/[^\p{L}]+/u).find((part) => part.length >= 4)!
      expect(song.text, `${song.id} : la consigne n’annonce pas « ${tune!.title} »`).toContain(word)
      const parts = melodyParts(tune!)
      for (const part of parts) {
        expect(part.notes.length, `${song.id} : une partie trop longue pour la voir d’un coup`).toBeLessThanOrEqual(28)
        expect(keyboardWindow(part.notes), `${song.id} : une partie ne tient pas sur le clavier`).not.toBeNull()
      }
      expect(parts.flatMap((part) => part.notes)).toEqual(tune!.notes)
    }
    expect(keyboardMelody('musique-5-1')).toBeUndefined()
  })

  it('écrit les mélodies phrase par phrase, en parties, et choisit la portion de clavier', () => {
    const tune = melody('Essai', 'C4 D4 | E4 || F4 G4')
    expect(tune.phrases).toEqual([['C4', 'D4'], ['E4'], ['F4', 'G4']])
    expect(melodyParts(tune).map((part) => part.notes)).toEqual([['C4', 'D4', 'E4'], ['F4', 'G4']])
    // Sans parties fixées : des phrases regroupées, jamais coupées.
    const long = melody('Long', Array.from({ length: 5 }, () => 'C4 D4 E4 F4 G4 A4 B4 C5').join(' | '))
    expect(melodyParts(long).map((part) => part.notes.length)).toEqual([24, 16])
    // Une octave au moins, centrée sur les notes ; une touche noire emmène sa voisine.
    expect(keyboardWindow(['C4', 'E4'])).toEqual({ from: 'A3', to: 'A4' })
    expect(keyboardWindow(['G3', 'F#4'])).toEqual({ from: 'G3', to: 'G4' })
    expect(keyboardWindow(['C3', 'C5'])).toBeNull()
  })

  it('demande le niveau au piano seulement, et relit les niveaux enregistrés', () => {
    expect(asksSkill('piano')).toBe(true)
    expect(asksSkill('dessin')).toBe(false)
    expect(parseSkills('{"piano":"bases","dessin":"debutant","piano2":"x"}')).toEqual({ piano: 'bases' })
    expect(parseSkills('pas du json')).toEqual({})
    expect(missingSkills(['dessin', 'piano'], {})).toEqual(['piano'])
    expect(missingSkills(['dessin', 'piano'], { piano: 'debutant' })).toEqual([])
  })

  it('ne tire que des activités adaptées au niveau, et chaque niveau en garde au moins deux par temps', () => {
    for (const skill of SKILL_LEVELS) {
      for (const duration of DURATIONS) {
        const pool = skillActivitiesFor('piano', duration, skill)
        expect(pool.length, `${skill} ${duration}`).toBeGreaterThanOrEqual(2)
        const allowedIds = pool.map((activity) => activity.id)
        const random = seeded(7)
        for (let i = 0; i < 20; i++) expect(allowedIds).toContain(pickActivity({ passion: 'piano', duration, allowedIds, random }).id)
      }
    }
    expect(suitsSkill('piano-5-1', 'confirme')).toBe(false)
    expect(suitsSkill('piano-5-1', undefined)).toBe(true)
    expect(skillActivitiesFor('dessin', 5, 'debutant')).toHaveLength(5)
  })

  it('ouvre directement le palier du niveau déclaré, sans fermer les précédents', () => {
    const tiers = (skill?: 'debutant' | 'bases' | 'confirme') => pathProgress('piano', [], 0, skill).map((entry) => entry.unlocked)
    expect(tiers()).toEqual([true, false, false])
    expect(tiers('debutant')).toEqual([true, false, false])
    expect(tiers('bases')).toEqual([true, true, false])
    expect(tiers('confirme')).toEqual([true, true, true])
    // Sans niveau déclaré : un palier s'ouvre quand les précédents sont finis.
    const firstPath = pathsFor('piano')[0]!.steps.map((step) => step.id)
    expect(pathProgress('piano', firstPath, 0).map((entry) => entry.unlocked)).toEqual([true, true, false])
    const step = pathsFor('piano')[2]!.steps[0]!
    expect(canPlayStep(step, [], 0)).toBe(false)
    expect(canPlayStep(step, [], 0, 'confirme')).toBe(true)
  })

  it('nomme les notes à la française et joue juste', () => {
    expect(noteLabel('C4')).toBe('Do')
    expect(noteLabel('F#4')).toBe('Fa♯')
    expect(noteFrequency('A4')).toBe(440)
    expect(Math.round(noteFrequency('C4'))).toBe(262)
    const keys = keyboardKeys('C3', 'C5')
    expect(keys).toHaveLength(25)
    expect(keys.filter((key) => !key.black)).toHaveLength(15)
    expect(keys[1]).toEqual({ note: 'C#3', black: true })
  })

  it('a des mélodies jouables sur le clavier de l’appli', () => {
    const range = new Set(keyboardKeys('C3', 'C5').map((key) => key.note))
    let count = 0
    for (const [id, guide] of Object.entries(GUIDES)) {
      if (!guide.melody) continue
      count++
      expect(id.startsWith('piano-') || id.startsWith('parcours-'), id).toBe(true)
      for (const note of guide.melody.notes) expect(range.has(note), `${id} ${note}`).toBe(true)
    }
    expect(count).toBeGreaterThanOrEqual(10)
    expect(guideFor('parcours-premieres-touches-3')?.melody?.title).toBe('Au clair de la lune')
  })
})
