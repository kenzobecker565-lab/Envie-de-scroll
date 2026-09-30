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

/** Message affiché juste après « J'ai envie de scroller ». */
export const SIGNAL_MESSAGE = {
  first: 'On a reçu ton signal de détresse pré-scroll.',
  second: 'On s’occupe de toi.',
} as const
