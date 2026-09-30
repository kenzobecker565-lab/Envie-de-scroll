import type { Energy, Mood, MoodId } from './types.ts'

/**
 * Les 8 moods, répartis en deux familles d'énergie.
 * Le mood ne filtre pas les activités : il n'adapte que le ton de
 * l'introduction affichée au-dessus de l'activité (voir intros.ts).
 */
export const MOODS: readonly Mood[] = [
  // Énergie basse / retrait
  { id: 'ennui', label: 'Je m’ennuie', energy: 'basse' },
  { id: 'souffler', label: 'J’ai besoin de souffler', energy: 'basse' },
  { id: 'pause-travail', label: 'J’ai une pause au travail', energy: 'basse' },
  { id: 'fatigue', label: 'Je suis fatigué·e mais pas envie de dormir', energy: 'basse' },
  // Énergie haute / tension
  { id: 'stress', label: 'Je suis stressé·e', energy: 'haute' },
  { id: 'frustration', label: 'Je suis frustré·e / énervé·e', energy: 'haute' },
  { id: 'procrastination', label: 'Je procrastine', energy: 'haute' },
  { id: 'trop-energie', label: 'J’ai trop d’énergie, je tiens pas en place', energy: 'haute' },
]

export const ENERGY_FAMILIES: readonly { energy: Energy; label: string }[] = [
  { energy: 'basse', label: 'Plutôt en retrait' },
  { energy: 'haute', label: 'Plutôt sous tension' },
]

const BY_ID = new Map(MOODS.map((mood) => [mood.id, mood]))

export function getMood(id: MoodId): Mood {
  const mood = BY_ID.get(id)
  if (!mood) throw new Error(`Mood inconnu : ${id}`)
  return mood
}

export function isMoodId(value: unknown): value is MoodId {
  return typeof value === 'string' && BY_ID.has(value as MoodId)
}
