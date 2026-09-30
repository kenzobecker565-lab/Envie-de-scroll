/**
 * ============================================================================
 *  RELANCES
 * ============================================================================
 *
 * Une fois par jour au plus, à l'heure choisie (REMINDER_HOUR, 19 h par
 * défaut, dans le fuseau de chacun), le bot envoie un petit message aux
 * personnes qui n'ont encore rien fait dans la journée. Les deux messages
 * alternent.
 *
 * Pour ne jamais devenir pesant : aucune relance les jours où une activité a
 * été faite, pause automatique après 5 relances restées sans réponse (le
 * compteur repart de zéro dès que l'app est ouverte), /stop pour arrêter.
 */

import { reminderMessage } from '@pqs/shared'
import type { Telegram } from 'telegraf'
import type { PrismaClient } from '../db.ts'
import { localDate, localHour } from '../lib/time.ts'
import { openAppKeyboard } from './bot.ts'

export const MAX_UNANSWERED_REMINDERS = 5
const CHECK_INTERVAL_MS = 5 * 60_000

export interface ReminderDeps {
  prisma: PrismaClient
  send: (chatId: string, text: string, extra: ReturnType<typeof openAppKeyboard>) => Promise<unknown>
  reminderHour: number
  webAppUrl: string | undefined
}

/** Envoie les relances dues à l'instant `now`. Renvoie le nombre de messages envoyés. */
export async function sendDueReminders({ prisma, send, reminderHour, webAppUrl }: ReminderDeps, now = new Date()): Promise<number> {
  const candidates = await prisma.user.findMany({
    where: { canMessage: true, remindersEnabled: true, unansweredReminders: { lt: MAX_UNANSWERED_REMINDERS } },
  })
  let sent = 0
  for (const user of candidates) {
    if (localHour(now, user.timezone) !== reminderHour) continue
    const today = localDate(now, user.timezone)
    if (user.lastReminderDate === today) continue
    const doneToday = await prisma.completion.count({ where: { userId: user.id, localDate: today } })
    if (doneToday > 0) continue

    try {
      await send(user.id.toString(), reminderMessage(user.reminderCount), openAppKeyboard(webAppUrl))
      await prisma.user.update({
        where: { id: user.id },
        data: { reminderCount: { increment: 1 }, unansweredReminders: { increment: 1 }, lastReminderDate: today },
      })
      sent++
    } catch (error) {
      // 403 : la personne a bloqué le bot. On arrête de lui écrire.
      if ((error as { response?: { error_code?: number } }).response?.error_code === 403) {
        await prisma.user.update({ where: { id: user.id }, data: { canMessage: false } })
      } else {
        console.error('[relances]', error)
      }
    }
  }
  return sent
}

export function startReminderLoop(prisma: PrismaClient, telegram: Telegram, options: { reminderHour: number; webAppUrl: string | undefined }) {
  const deps: ReminderDeps = {
    prisma,
    send: (chatId, text, extra) => telegram.sendMessage(chatId, text, extra),
    ...options,
  }
  const tick = () => {
    sendDueReminders(deps).catch((error) => console.error('[relances]', error))
  }
  const timer = setInterval(tick, CHECK_INTERVAL_MS)
  timer.unref()
  tick()
  return () => clearInterval(timer)
}
