/** Messages de relance envoyés par le bot, en alternance. */
export const REMINDER_MESSAGES = [
  'Un scroll de plus et TikTok va commencer à me demander une commission.',
  'On me signale une activité suspecte sur ton téléphone. Ça sent le scroll à plein nez.',
] as const

/** Le n-ième message envoyé à un utilisateur (0, 1, 2…) : on alterne. */
export function reminderMessage(sentCount: number): string {
  const index = ((sentCount % REMINDER_MESSAGES.length) + REMINDER_MESSAGES.length) % REMINDER_MESSAGES.length
  return REMINDER_MESSAGES[index] as string
}

/**
 * Le moment où l'on scrolle le plus, choisi à l'inscription (et dans les
 * réglages). Le bot relance juste avant : c'est là que l'envie arrive.
 */
export const SCROLL_MOMENTS = ['matin', 'midi', 'soir', 'nuit'] as const

export type ScrollMoment = (typeof SCROLL_MOMENTS)[number]

export interface ScrollMomentInfo {
  id: ScrollMoment
  label: string
  /** En un mot, pour les pastilles des réglages. */
  short: string
  /** Quand, concrètement (« Au lit, avant de dormir »). */
  hint: string
  /** Heure locale de la relance, en minutes depuis minuit. */
  remindAt: number
}

export const SCROLL_MOMENT_INFO: Record<ScrollMoment, ScrollMomentInfo> = {
  matin: { id: 'matin', label: 'Le matin', short: 'Matin', hint: 'Au réveil, dans les transports', remindAt: 7 * 60 + 30 },
  midi: { id: 'midi', label: 'Le midi', short: 'Midi', hint: 'Pendant la pause déj', remindAt: 12 * 60 },
  soir: { id: 'soir', label: 'Le soir', short: 'Soir', hint: 'Après les cours ou le boulot', remindAt: 18 * 60 + 30 },
  nuit: { id: 'nuit', label: 'La nuit', short: 'Nuit', hint: 'Au lit, avant de dormir', remindAt: 21 * 60 + 45 },
}

export function isScrollMoment(value: unknown): value is ScrollMoment {
  return typeof value === 'string' && (SCROLL_MOMENTS as readonly string[]).includes(value)
}

/** L'heure de la relance (minutes depuis minuit) : juste avant le moment choisi, sinon l'heure par défaut. */
export function isReminderTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 1440
}

export function reminderMinutes(moment: ScrollMoment | null, defaultHour: number, chosen?: number | null): number {
  if (isReminderTime(chosen)) return chosen
  return moment ? SCROLL_MOMENT_INFO[moment].remindAt : defaultHour * 60
}

/** « 7 h 30 », « 12 h » (espaces insécables). */
export function formatClock(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24
  const rest = minutes % 60
  return rest ? `${hours} h ${String(rest).padStart(2, '0')}` : `${hours} h`
}

/** Message affiché juste après « J'ai envie de scroller ». */
export const SIGNAL_MESSAGE = {
  first: 'On a reçu ton signal de détresse pré-scroll.',
  second: 'On s’occupe de toi.',
} as const
