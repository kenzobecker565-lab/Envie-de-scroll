/** Dates « locales » de l'utilisateur, à partir de son fuseau horaire IANA. */

export const DEFAULT_TIMEZONE = 'Europe/Paris'

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  } catch {
    return false
  }
}

function safeZone(timeZone: string): string {
  return isValidTimeZone(timeZone) ? timeZone : DEFAULT_TIMEZONE
}

/** « 2026-09-30 » dans le fuseau donné. */
export function localDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: safeZone(timeZone), year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

/** « 2026-09 » dans le fuseau donné. */
export function localMonth(date: Date, timeZone: string): string {
  return localDate(date, timeZone).slice(0, 7)
}

/** Minutes écoulées depuis minuit (0-1439) dans le fuseau donné. */
export function localMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: safeZone(timeZone), hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date)
  const value = (type: 'hour' | 'minute') => Number.parseInt(parts.find((part) => part.type === type)?.value ?? '0', 10)
  return value('hour') * 60 + value('minute')
}

/** Heure (0-23) dans le fuseau donné. */
export function localHour(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat('en-GB', { timeZone: safeZone(timeZone), hour: '2-digit', hourCycle: 'h23' }).format(date)
  return Number.parseInt(hour, 10)
}
