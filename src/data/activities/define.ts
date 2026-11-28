import type { Activity, Duration, Level, MoodId, PassionId } from '../../types'

/**
 * Une activité telle qu'on l'écrit dans les fichiers de la bibliothèque.
 * La passion et le mood sont déduits de l'endroit où l'activité est rangée,
 * et l'identifiant est généré automatiquement.
 */
export interface ActivityDraft {
  /** Durée en minutes : 5, 15 ou 30. */
  duration: Duration
  /** Titre court, affiché en gros sur la carte. */
  title: string
  /** Une ou deux phrases concrètes : quoi faire, exactement. */
  description: string
  /** Optionnel : `debutant` ou `intermediaire` (voir le type `Activity`). */
  level?: Level
}

/**
 * Toutes les activités d'une passion, rangées par mood.
 * Le type impose d'avoir une rubrique pour chacun des 9 moods :
 * TypeScript signale un mood oublié.
 */
export type PassionActivitySheet = Record<MoodId, ActivityDraft[]>

/** Transforme un titre en identifiant lisible : « Croquis express » → « croquis-express ». */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Convertit une fiche « passion → moods → activités » en liste d'activités
 * complètes. L'identifiant (`passion.mood.titre`) reste stable tant que le
 * titre ne change pas, même si on ajoute d'autres activités autour.
 */
export function definePassionActivities(
  passionId: PassionId,
  sheet: PassionActivitySheet,
): Activity[] {
  return (Object.entries(sheet) as [MoodId, ActivityDraft[]][]).flatMap(([mood, drafts]) =>
    drafts.map((draft) => ({
      id: `${passionId}.${mood}.${slugify(draft.title)}`,
      passionId,
      mood,
      ...draft,
    })),
  )
}
