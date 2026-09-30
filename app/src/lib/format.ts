/** Petites mises en forme en français. */

const numberFormat = new Intl.NumberFormat('fr-FR')
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const monthYear = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** « 1 activité », « 3 activités ». */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(count)} ${count > 1 ? pluralForm : singular}`
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** « Aujourd'hui », « Hier », « 12 septembre », « 3 mars 2025 ». */
export function formatDay(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (sameDay(date, now)) return 'Aujourd’hui'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(date, yesterday)) return 'Hier'
  return date.getFullYear() === now.getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date)
}

/** « Septembre 2026 » : en-tête de mois dans la galerie. */
export function formatMonth(iso: string): string {
  const label = monthYear.format(new Date(iso))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function monthKey(iso: string): string {
  const date = new Date(iso)
  return `${date.getFullYear()}-${date.getMonth()}`
}
