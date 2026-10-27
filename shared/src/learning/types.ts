import type { StudioTask } from '../studio.ts'
export const LEARNING_PASSIONS = ['dessin', 'ecriture', 'piano', 'logique', 'francais', 'sport'] as const
export type LearningPassion = (typeof LEARNING_PASSIONS)[number]
export type Lesson = {
  id: string
  revision: 1
  passion: LearningPassion
  number: number
  level: number
  title: string
  goal: string
  teaching: string[]
  example: string
  guided: string
  practice: string
  checklist: string[]
  tasks: StudioTask[]
  visual?: string
  notes?: string[]
  beats?: number[]
  exercise?: string
}
export type InkStroke = { color: string; width: number; points: { x: number; y: number }[] }
export type PlayedNote = { note: string; at: number; duration: number }
export type LearningWork = {
  revision: 1
  step: number
  answers: Record<string, unknown>
  checked: string[]
  hints: number
  first: string
  final: string
  notebook: string
  ink: InkStroke[]
  firstInk: InkStroke[]
  notes: PlayedNote[]
  firstNotes: PlayedNote[]
  selfChecks: boolean[]
  review: boolean
  completed: boolean
}
export type LearningRecord = {
  id: string
  lessonId: string
  passion: LearningPassion
  title: string
  completed: boolean
  mastered: boolean
  attempted?: boolean
  review: boolean
  updatedAt: string
  work?: LearningWork
}
export const emptyLearningWork = (): LearningWork => ({
  revision: 1,
  step: 0,
  answers: {},
  checked: [],
  hints: 0,
  first: '',
  final: '',
  notebook: '',
  ink: [],
  firstInk: [],
  notes: [],
  firstNotes: [],
  selfChecks: [],
  review: false,
  completed: false,
})
