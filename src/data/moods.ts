import type { EnergyLevel, Mood, MoodId } from '../types'

/**
 * Les moods proposés à l'étape A du parcours, en deux familles :
 * énergie basse (retrait) et énergie haute (tension).
 * L'ordre du tableau est l'ordre d'affichage.
 */
export const MOODS: Mood[] = [
  // Énergie basse / retrait
  { id: 'ennui', label: 'Ennui', shortLabel: 'Ennui', emoji: '🥱', energy: 'basse', hint: 'Rien ne me tente' },
  { id: 'fatigue', label: 'Fatigue', shortLabel: 'Fatigue', emoji: '😴', energy: 'basse', hint: 'Batterie à plat' },
  { id: 'coup-de-mou', label: 'Coup de mou / tristesse', shortLabel: 'Coup de mou', emoji: '🌧️', energy: 'basse', hint: 'Un peu lourd aujourd’hui' },
  { id: 'manque-inspiration', label: 'Manque d’inspiration', shortLabel: 'Manque d’inspi', emoji: '🫥', energy: 'basse', hint: 'Page blanche' },
  { id: 'calme', label: 'Envie de calme', shortLabel: 'Calme', emoji: '🍃', energy: 'basse', hint: 'Besoin de souffler' },

  // Énergie haute / tension
  { id: 'stress', label: 'Stress / anxiété', shortLabel: 'Stress', emoji: '😬', energy: 'haute', hint: 'Ça tourne dans ma tête' },
  { id: 'defouler', label: 'Envie de me défouler', shortLabel: 'Défoulement', emoji: '💥', energy: 'haute', hint: 'Trop d’énergie' },
  { id: 'procrastination', label: 'Procrastination', shortLabel: 'Procrastination', emoji: '🙈', energy: 'haute', hint: 'Je fuis un truc précis' },
  { id: 'curiosite', label: 'Curiosité / envie de découvrir', shortLabel: 'Curiosité', emoji: '👀', energy: 'haute', hint: 'J’ai envie d’apprendre un truc' },
]

export const MOOD_IDS = MOODS.map((mood) => mood.id)

export const ENERGY_LABELS: Record<EnergyLevel, { title: string; subtitle: string }> = {
  basse: { title: 'Énergie basse', subtitle: 'plutôt en retrait' },
  haute: { title: 'Énergie haute', subtitle: 'plutôt sous tension' },
}

const MOODS_BY_ID = Object.fromEntries(MOODS.map((mood) => [mood.id, mood])) as Record<MoodId, Mood>

export function getMood(id: MoodId): Mood {
  return MOODS_BY_ID[id]
}

/** Garde de type : vérifie qu'une chaîne (ex. lue en base) est un mood connu. */
export function isMoodId(value: string): value is MoodId {
  return value in MOODS_BY_ID
}

export function moodsByEnergy(energy: EnergyLevel): Mood[] {
  return MOODS.filter((mood) => mood.energy === energy)
}
