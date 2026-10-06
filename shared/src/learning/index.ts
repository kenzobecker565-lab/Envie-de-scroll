import { DRAW_LESSONS, WRITE_LESSONS, PIANO_LESSONS } from './creative.ts'
import { FRENCH_LEARNING, LOGIC_LEARNING } from './reasoning.ts'
import { SPORT_LEARNING } from './sport.ts'
import { studioCorrect } from '../studio.ts'
import type { LearningWork } from './types.ts'
export * from './types.ts'
export const LEARNING_LESSONS = [
  ...DRAW_LESSONS,
  ...WRITE_LESSONS,
  ...PIANO_LESSONS,
  ...LOGIC_LEARNING,
  ...FRENCH_LEARNING,
  ...SPORT_LEARNING,
]
export const learningLesson = (id: string) => LEARNING_LESSONS.find((l) => l.id === id)
export const LEARNING_LEVELS = ['Les bases', 'Approfondir', 'Gagner en autonomie'] as const
export function learningCorrect(task: import('../studio.ts').StudioTask, answer: unknown) {
  if (typeof answer === 'string' && typeof task.solution === 'string') {
    const normalize = (s: string) =>
      s
        .normalize('NFC')
        .replace(/[’‘]/g, "'")
        .trim()
        .toLocaleLowerCase('fr')
        .replace(/\s*([,:])\s*/g, '$1')
        .replace(/[.!?]+$/, '')
        .replace(/\s+/g, ' ')
    return [task.solution, ...(task.alternatives ?? [])].some((s) => normalize(s) === normalize(answer))
  }
  return studioCorrect(task, answer) === true
}
export function validateLearning(id: string, value: unknown): { work: LearningWork; mastered: boolean } {
  const lesson = learningLesson(id)
  if (!lesson) throw Error('Leçon introuvable.')
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Carnet illisible.')
  const v = value as LearningWork
  if (
    v.revision !== 1 ||
    !Number.isInteger(v.step) ||
    v.step < 0 ||
    v.step > 3 ||
    typeof v.completed !== 'boolean' ||
    typeof v.review !== 'boolean' ||
    !Number.isInteger(v.hints) ||
    v.hints < 0 ||
    v.hints > 100
  )
    throw Error('Progression illisible.')
  for (const field of ['first', 'final', 'notebook'] as const)
    if (typeof v[field] !== 'string' || v[field].length > 12000) throw Error('Texte trop long ou illisible.')
  if (
    !v.answers ||
    typeof v.answers !== 'object' ||
    Array.isArray(v.answers) ||
    Object.keys(v.answers).some((k) => !lesson.tasks.some((t) => t.id === k)) ||
    Object.values(v.answers).some((a) => typeof a !== 'string' || a.length > 1000)
  )
    throw Error('Réponses illisibles.')
  if (
    !Array.isArray(v.checked) ||
    v.checked.some((k) => !lesson.tasks.some((t) => t.id === k)) ||
    !Array.isArray(v.selfChecks) ||
    v.selfChecks.length > 8 ||
    v.selfChecks.some((a) => typeof a !== 'boolean')
  )
    throw Error('Bilan illisible.')
  for (const field of ['ink', 'firstInk'] as const) {
    if (!Array.isArray(v[field]) || v[field].length > 400) throw Error('Dessin trop volumineux.')
    let count = 0
    for (const s of v[field]) {
      if (
        !s ||
        !/^#[0-9a-f]{6}$/i.test(s.color) ||
        !Number.isFinite(s.width) ||
        s.width < 1 ||
        s.width > 80 ||
        !Array.isArray(s.points)
      )
        throw Error('Trait illisible.')
      count += s.points.length
      if (
        count > 12000 ||
        s.points.some(
          (p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.y < 0 || p.x > 1200 || p.y > 1200,
        )
      )
        throw Error('Dessin trop volumineux ou illisible.')
    }
  }
  for (const field of ['notes', 'firstNotes'] as const) {
    if (
      !Array.isArray(v[field]) ||
      v[field].length > 1200 ||
      v[field].some(
        (n) =>
          !n ||
          !/^[A-G]#?[2-6]$/.test(n.note) ||
          !Number.isFinite(n.at) ||
          n.at < 0 ||
          n.at > 3600000 ||
          !Number.isFinite(n.duration) ||
          n.duration < 0 ||
          n.duration > 60000,
      )
    )
      throw Error('Enregistrement illisible.')
  }
  if (v.completed && v.step !== 3) throw Error('Consulte le bilan avant d’enregistrer la leçon.')
  return {
    work: {
      revision: 1,
      step: v.step,
      answers: v.answers,
      checked: [...new Set(v.checked)],
      hints: v.hints,
      first: v.first,
      final: v.final,
      notebook: v.notebook,
      ink: v.ink,
      firstInk: v.firstInk,
      notes: v.notes,
      firstNotes: v.firstNotes,
      selfChecks: v.selfChecks,
      review: v.review,
      completed: v.completed,
    },
    mastered:
      v.completed &&
      lesson.tasks.length > 0 &&
      v.hints === 0 &&
      lesson.tasks.every((t) => v.checked.includes(t.id) && learningCorrect(t, v.answers[t.id])),
  }
}
