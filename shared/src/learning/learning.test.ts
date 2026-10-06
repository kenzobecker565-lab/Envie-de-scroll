import { describe, it, expect } from 'vitest'
import {
  LEARNING_LESSONS,
  LEARNING_PASSIONS,
  emptyLearningWork,
  learningCorrect,
  validateLearning,
  learningLesson,
} from './index.ts'
describe('Parcours indépendants', () => {
  it('contient 12 leçons en trois niveaux dans chacune des six passions', () => {
    expect(LEARNING_LESSONS).toHaveLength(72)
    expect(new Set(LEARNING_LESSONS.map((l) => l.id)).size).toBe(72)
    for (const p of LEARNING_PASSIONS) {
      const rows = LEARNING_LESSONS.filter((l) => l.passion === p)
      expect(rows.map((l) => l.number)).toEqual(Array.from({ length: 12 }, (_, i) => i + 1))
      expect([0, 1, 2].map((n) => rows.filter((l) => l.level === n).length)).toEqual([4, 4, 4])
      for (const l of rows) {
        expect(l.teaching).toHaveLength(3)
        expect(l.practice).not.toBe(l.guided)
        expect(l.checklist).toHaveLength(3)
      }
    }
  })
  it('distingue consultation et résolution des deux exercices sans aide', () => {
    const lesson = learningLesson('learn-v1-logique-7')!,
      work = { ...emptyLearningWork(), step: 3, completed: true }
    expect(validateLearning(lesson.id, work).mastered).toBe(false)
    work.answers = Object.fromEntries(lesson.tasks.map((t) => [t.id, t.solution]))
    work.checked = lesson.tasks.map((t) => t.id)
    expect(validateLearning(lesson.id, work).mastered).toBe(true)
    expect(validateLearning(lesson.id, { ...work, hints: 1 }).mastered).toBe(false)
  })
  it('vérifie indépendamment l’unicité des codes et de l’ordre des exposés', () => {
    const codes = []
    for (let a = 1; a <= 8; a++)
      for (let b = 1; b <= 8; b++)
        for (let c = 1; c <= 8; c++)
          if (new Set([a, b, c]).size === 3 && a + b + c === 14 && a === 2 * c && b % 2 === 0 && b < c)
            codes.push(`${a}${b}${c}`)
    expect(codes).toEqual([learningLesson('learn-v1-logique-7')!.tasks[1]!.solution])
    function perm(s: string): string[] {
      return s.length ? [...s].flatMap((v, i) => perm(s.slice(0, i) + s.slice(i + 1)).map((p) => v + p)) : ['']
    }
    const orders = perm('ABCDE').filter((s) => {
      const [a, b, c, d, e] = [...'ABCDE'].map((v) => s.indexOf(v))
      return a! + 1 === c && d! < a! && e! > c! && b !== 0 && b !== 4 && c !== 3
    })
    expect(orders).toEqual(['DACBE'])
  })
  it('accepte les apostrophes et espaces typographiques mais pas une ponctuation manquante', () => {
    const task = learningLesson('learn-v1-francais-12')!.tasks[1]!
    expect(learningCorrect(task, 'Si j’avais le temps, je relirais les lettres que tu as envoyées.')).toBe(true)
    const punct = learningLesson('learn-v1-francais-11')!.tasks[1]!
    expect(learningCorrect(punct, 'Nora malgré le bruit termine son texte.')).toBe(false)
    expect(learningCorrect(punct, 'Nora, malgré le bruit, termine son texte.')).toBe(true)
  })
  it('rejette données illisibles, notes impossibles, coordonnées et textes hors limites', () => {
    for (const patch of [
      { notes: [{ note: 'X4', at: 0, duration: 10 }] },
      { ink: [{ color: '#ffffff', width: 4, points: [{ x: 2000, y: 0 }] }] },
      { first: 'x'.repeat(12001) },
      { selfChecks: [null] },
      { completed: true, step: 2 },
      { answers: { foreign: 'value' } },
    ])
      expect(() => validateLearning('learn-v1-dessin-1', { ...emptyLearningWork(), ...patch })).toThrow()
  })
  it('conserve les premières versions et les versions autonomes', () => {
    const work = {
      ...emptyLearningWork(),
      first: 'Premier jet',
      final: 'Réécriture',
      firstNotes: [{ note: 'C4', at: 0, duration: 300 }],
      notes: [{ note: 'D4', at: 50, duration: 400 }],
    }
    expect(validateLearning('learn-v1-ecriture-1', work).work).toEqual(work)
  })
})
