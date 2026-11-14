import { isLifeInterestId } from '../data/lifeInterests'
import { isMoodId } from '../data/moods'
import { isPassionId } from '../data/passions'
import { toDateKey } from '../lib/dates'
import type { Duration, FilmLog, HistoryEntry, UserProfile } from '../types'

/**
 * ============================================================================
 *  VALIDATION DES DONNÉES RELUES DEPUIS LA BASE
 * ============================================================================
 *
 * La base locale vit longtemps : elle peut contenir des données écrites par
 * une ancienne version de l'app, ou modifiées à la main (outils du
 * navigateur). Plutôt que de faire confiance aveuglément à ce qui est relu,
 * on vérifie chaque enregistrement :
 * - un champ secondaire invalide est corrigé ou retiré (ex. une note qui
 *   n'est pas du texte) ;
 * - une entrée inutilisable (passion ou mood inconnus, date illisible) est
 *   ignorée.
 * Résultat : une donnée abîmée ne fait jamais planter l'affichage.
 */

const DURATIONS: readonly Duration[] = [5, 15, 30]
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function sanitizeFilm(value: unknown): FilmLog | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const { title, rating } = value as Record<string, unknown>
  if (typeof title !== 'string' || title.trim() === '') return undefined
  const validRating = typeof rating === 'number' && Number.isInteger(rating) && rating >= 0 && rating <= 5
  return { title, rating: (validRating ? rating : 0) as FilmLog['rating'] }
}

/** Une entrée d'historique propre, ou `null` si elle est inutilisable. */
export function sanitizeEntry(raw: unknown): HistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) return null
  const entry = raw as Record<string, unknown>

  const passionId = text(entry.passionId)
  const mood = text(entry.mood)
  const completedAt = text(entry.completedAt)
  if (!passionId || !isPassionId(passionId) || !mood || !isMoodId(mood) || !completedAt) return null
  const date = new Date(completedAt)
  if (Number.isNaN(date.getTime())) return null

  const dateKey = text(entry.dateKey)
  return {
    id: typeof entry.id === 'number' ? entry.id : undefined,
    activityId: text(entry.activityId) ?? '',
    passionId,
    mood,
    duration: DURATIONS.includes(entry.duration as Duration) ? (entry.duration as Duration) : 5,
    title: text(entry.title) || 'Activité',
    description: text(entry.description) ?? '',
    completedAt,
    dateKey: dateKey && DATE_KEY.test(dateKey) ? dateKey : toDateKey(date),
    note: text(entry.note),
    photoId: typeof entry.photoId === 'number' ? entry.photoId : undefined,
    film: sanitizeFilm(entry.film),
    isDemo: entry.isDemo === true ? true : undefined,
  }
}

/** Le profil propre, ou `null` s'il n'existe pas (ou est illisible). */
export function sanitizeProfile(raw: unknown): UserProfile | null {
  if (typeof raw !== 'object' || raw === null) return null
  const profile = raw as Record<string, unknown>
  const strings = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  const now = new Date().toISOString()

  return {
    id: 'me',
    firstName: text(profile.firstName) ?? '',
    passionIds: [...new Set(strings(profile.passionIds))].filter(isPassionId),
    beginnerMode: profile.beginnerMode === true,
    lifeInterestIds: [...new Set(strings(profile.lifeInterestIds))].filter(isLifeInterestId),
    createdAt: text(profile.createdAt) ?? now,
    updatedAt: text(profile.updatedAt) ?? now,
  }
}
