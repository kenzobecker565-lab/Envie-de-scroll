import { isMoodId } from '../data/moods'
import { isPassionId } from '../data/passions'
import { db } from '../db/database'
import { toDateKey } from '../lib/dates'
import { prepareImage } from '../lib/image'
import type { Activity, FilmLog, HistoryEntry, MoodId, PhotoRecord } from '../types'

/**
 * Historique des envies transformées : enregistrement, lecture, détails
 * (note, film, photo) et suppression.
 */

/**
 * Tout l'historique, du plus récent au plus ancien.
 * Les entrées dont la passion ou le mood n'existe plus dans le catalogue
 * (identifiant renommé ou supprimé dans le code) sont ignorées plutôt que de
 * faire planter l'affichage.
 */
export async function listHistory(): Promise<HistoryEntry[]> {
  const entries = await db.history.orderBy('completedAt').reverse().toArray()
  return entries.filter((entry) => isPassionId(entry.passionId) && isMoodId(entry.mood))
}

export async function getEntry(id: number): Promise<HistoryEntry | undefined> {
  return db.history.get(id)
}

export async function getPhoto(id: number): Promise<PhotoRecord | undefined> {
  return db.photos.get(id)
}

/**
 * « C'est fait, je l'enregistre » : ajoute l'activité à l'historique.
 * Les statistiques se recalculent automatiquement à partir de l'historique.
 *
 * @param mood  l'humeur choisie par l'utilisateur (pas forcément celle de
 *              l'activité, si le moteur a dû élargir la recherche)
 * @returns l'identifiant de la nouvelle entrée
 */
export async function recordActivity(activity: Activity, mood: MoodId, now = new Date()): Promise<number> {
  const entry: HistoryEntry = {
    activityId: activity.id,
    passionId: activity.passionId,
    mood,
    duration: activity.duration,
    title: activity.title,
    description: activity.description,
    completedAt: now.toISOString(),
    dateKey: toDateKey(now),
  }
  // La clé auto-incrémentée est toujours attribuée par la base à l'ajout.
  return (await db.history.add(entry)) as number
}

export interface EntryDetails {
  /** Texte libre ; une chaîne vide efface la note. */
  note?: string
  /** `null` retire le film. */
  film?: FilmLog | null
}

/** Ajoute ou modifie la note et/ou le film d'une entrée. */
export async function updateEntryDetails(id: number, details: EntryDetails): Promise<void> {
  const patch: Partial<HistoryEntry> = {}
  if (details.note !== undefined) patch.note = details.note.trim() || undefined
  if (details.film !== undefined) {
    const title = details.film?.title.trim()
    patch.film = details.film && title ? { title, rating: details.film.rating } : undefined
  }
  // Pour Dexie, une valeur `undefined` supprime le champ.
  await db.history.update(id, patch)
}

/**
 * Associe une photo (galerie) à une entrée. Une éventuelle photo précédente
 * est remplacée. L'image est réduite AVANT la transaction : une transaction
 * IndexedDB se ferme toute seule si on attend autre chose que la base.
 */
export async function attachPhoto(entryId: number, file: Blob): Promise<void> {
  const blob = await prepareImage(file)
  await db.transaction('rw', db.history, db.photos, async () => {
    const entry = await db.history.get(entryId)
    if (!entry) throw new Error('Cette activité n’existe plus.')
    const photoId = await db.photos.add({ blob, createdAt: new Date().toISOString() })
    await db.history.update(entryId, { photoId })
    if (entry.photoId !== undefined) await db.photos.delete(entry.photoId)
  })
}

/** Retire la photo d'une entrée (l'entrée reste dans l'historique). */
export async function removePhoto(entryId: number): Promise<void> {
  await db.transaction('rw', db.history, db.photos, async () => {
    const entry = await db.history.get(entryId)
    if (entry?.photoId === undefined) return
    await db.photos.delete(entry.photoId)
    await db.history.update(entryId, { photoId: undefined })
  })
}

/** Supprime une entrée de l'historique (et sa photo). */
export async function deleteEntry(entryId: number): Promise<void> {
  await db.transaction('rw', db.history, db.photos, async () => {
    const entry = await db.history.get(entryId)
    if (!entry) return
    if (entry.photoId !== undefined) await db.photos.delete(entry.photoId)
    await db.history.delete(entryId)
  })
}
