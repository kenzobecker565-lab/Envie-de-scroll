/**
 * Petites fonctions de dates. Tout est calculé en heure LOCALE : une activité
 * faite à 23 h 30 compte bien pour ce jour-là (important pour le streak).
 */

/** Jour local au format AAAA-MM-JJ, ex. « 2026-09-28 ». */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Convertit « AAAA-MM-JJ » en date locale (à midi, pour éviter les pièges du changement d'heure). */
export function fromDateKey(key: string): Date {
  const [year = 1970, month = 1, day = 1] = key.split('-').map(Number)
  return new Date(year, month - 1, day, 12)
}

/** Ajoute (ou retire) des jours à une date, sans modifier l'originale. */
export function addDays(date: Date, days: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

/** Le jour qui précède `key`, au même format. */
export function previousDateKey(key: string): string {
  return toDateKey(addDays(fromDateKey(key), -1))
}

/** Le jour qui suit `key`, au même format. */
export function nextDateKey(key: string): string {
  return toDateKey(addDays(fromDateKey(key), 1))
}

/** Lundi de la semaine qui contient `date` (les semaines commencent le lundi en France). */
export function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const weekday = (copy.getDay() + 6) % 7 // lundi = 0 … dimanche = 6
  return addDays(copy, -weekday)
}

const weekdayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const weekdayYearFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

/** « Aujourd'hui », « Hier » ou « lundi 22 septembre ». */
export function formatDayLabel(key: string, now = new Date()): string {
  const today = toDateKey(now)
  if (key === today) return 'Aujourd’hui'
  if (key === previousDateKey(today)) return 'Hier'
  const date = fromDateKey(key)
  const label = date.getFullYear() === now.getFullYear() ? weekdayFormat.format(date) : weekdayYearFormat.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

/** Version courte et relative : « aujourd’hui », « hier », « il y a 3 jours », « 12 sept. ». */
export function formatRelativeDay(key: string, now = new Date()): string {
  const days = Math.round((fromDateKey(toDateKey(now)).getTime() - fromDateKey(key).getTime()) / 86_400_000)
  if (days <= 0) return 'aujourd’hui'
  if (days === 1) return 'hier'
  if (days < 7) return `il y a ${days} jours`
  return shortDateFormat.format(fromDateKey(key))
}

/** Heure au format « 14:05 ». */
export function formatTime(iso: string): string {
  return timeFormat.format(new Date(iso))
}

/** Date du jour pour l'en-tête : « lundi 28 septembre ». */
export function formatToday(now = new Date()): string {
  return weekdayFormat.format(now)
}

/** Durée lisible : « 45 min », « 1 h », « 2 h 05 ». */
export function formatMinutes(total: number): string {
  if (total < 60) return `${total} min`
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  return minutes === 0 ? `${hours} h` : `${hours} h ${String(minutes).padStart(2, '0')}`
}

/** Accord simple : pluralize(3, 'jour') → « 3 jours ». */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`
}
