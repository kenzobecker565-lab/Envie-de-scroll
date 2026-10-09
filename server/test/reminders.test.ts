import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PrismaClient } from '../src/db.ts'
import { MAX_UNANSWERED_REMINDERS, sendDueReminders } from '../src/bot/reminders.ts'
import { createTestDatabase } from './helpers.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let sent: { chatId: string; text: string }[]

const deps = () => ({
  prisma,
  reminderHour: 19,
  webAppUrl: 'https://exemple.fr/app',
  send: async (chatId: string, text: string) => {
    sent.push({ chatId, text })
  },
})

beforeEach(async () => {
  const database = createTestDatabase()
  prisma = database.prisma
  cleanup = database.cleanup
  sent = []
  await prisma.user.create({ data: { id: 1n, firstName: 'Léa', canMessage: true, timezone: 'Europe/Paris' } })
})

afterEach(async () => {
  await cleanup()
})

describe('relances', () => {
  it('écrit à 19 h (heure locale), une fois par jour, en alternant les messages', async () => {
    // 18 h 55 à Paris : trop tôt.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T16:55:00Z'))).toBe(0)
    // 19 h 05 à Paris.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:05:00Z'))).toBe(1)
    // 19 h 10 : déjà fait aujourd'hui.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:10:00Z'))).toBe(0)
    // Le lendemain : l'autre message.
    expect(await sendDueReminders(deps(), new Date('2026-10-01T17:05:00Z'))).toBe(1)
    expect(sent.map((message) => message.text)).toEqual([
      'Un scroll de plus et TikTok va commencer à me demander une commission.',
      'On me signale une activité suspecte sur ton téléphone. Ça sent le scroll à plein nez.',
    ])
  })

  it('écrit juste avant le moment où la personne scrolle le plus', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { scrollMoment: 'nuit' } })
    // 19 h 05 à Paris : plus l'heure par défaut pour elle.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:05:00Z'))).toBe(0)
    // 21 h 40 : pas encore.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T19:40:00Z'))).toBe(0)
    // 21 h 50 : juste avant d'aller scroller au lit.
    expect(await sendDueReminders(deps(), new Date('2026-09-30T19:50:00Z'))).toBe(1)

    // Le matin : 7 h 30 à Paris, mais pas après 8 h 30 (serveur arrêté entre-temps, par exemple).
    await prisma.user.update({ where: { id: 1n }, data: { scrollMoment: 'matin' } })
    expect(await sendDueReminders(deps(), new Date('2026-10-01T05:20:00Z'))).toBe(0)
    expect(await sendDueReminders(deps(), new Date('2026-10-01T06:35:00Z'))).toBe(0)
    expect(await sendDueReminders(deps(), new Date('2026-10-02T05:35:00Z'))).toBe(1)
  })

  it('n’écrit pas quand une activité a déjà été faite dans la journée', async () => {
    const proposal = await prisma.proposal.create({ data: { userId: 1n, activityId: 'dessin-5-1', passion: 'dessin', mood: 'ennui', duration: 5, intro: '' } })
    await prisma.completion.create({
      data: { userId: 1n, proposalId: proposal.id, activityId: 'dessin-5-1', passion: 'dessin', mood: 'ennui', duration: 5, activityText: '', coins: 5, localDate: '2026-09-30' },
    })
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:05:00Z'))).toBe(0)
  })

  it('respecte /stop et se met en pause après plusieurs relances sans réponse', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { remindersEnabled: false } })
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:05:00Z'))).toBe(0)
    await prisma.user.update({ where: { id: 1n }, data: { remindersEnabled: true, unansweredReminders: MAX_UNANSWERED_REMINDERS } })
    expect(await sendDueReminders(deps(), new Date('2026-09-30T17:05:00Z'))).toBe(0)
  })

  it('arrête d’écrire à quelqu’un qui a bloqué le bot', async () => {
    const blocked = {
      ...deps(),
      send: async () => {
        throw Object.assign(new Error('Forbidden'), { response: { error_code: 403 } })
      },
    }
    expect(await sendDueReminders(blocked, new Date('2026-09-30T17:05:00Z'))).toBe(0)
    expect((await prisma.user.findUnique({ where: { id: 1n } }))?.canMessage).toBe(false)
  })
})

 describe('heure précise', () => {
  it('respecte l’heure locale choisie plutôt que l’ancien créneau et ne renvoie pas deux fois', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { scrollMoment: 'matin', reminderTime: 1110 } })
    expect(await sendDueReminders(deps(), new Date('2026-10-07T16:29:00Z'))).toBe(0)
    expect(await sendDueReminders(deps(), new Date('2026-10-07T16:30:00Z'))).toBe(1)
    expect(await sendDueReminders(deps(), new Date('2026-10-07T16:31:00Z'))).toBe(0)
  })
  it('rattrape 23 h 59 à minuit sans le répéter', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { reminderTime: 1439 } })
    expect(await sendDueReminders(deps(), new Date('2026-10-07T21:58:00Z'))).toBe(0)
    expect(await sendDueReminders(deps(), new Date('2026-10-07T22:00:00Z'))).toBe(1)
    expect(await sendDueReminders(deps(), new Date('2026-10-07T22:01:00Z'))).toBe(0)
  })
  it('ne double pas un rappel déjà envoyé à 23 h 59 lorsque minuit passe', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { reminderTime: 1439 } })
    expect(await sendDueReminders(deps(), new Date('2026-10-07T21:59:00Z'))).toBe(1)
    expect(await sendDueReminders(deps(), new Date('2026-10-07T22:00:00Z'))).toBe(0)
  })
  it('respecte une activité faite avant minuit lorsque le rappel traverse minuit', async () => {
    await prisma.user.update({ where: { id: 1n }, data: { reminderTime: 1439 } })
    const proposal = await prisma.proposal.create({ data: { userId: 1n, activityId: 'dessin-5-1', passion: 'dessin', mood: 'ennui', duration: 5, intro: '' } })
    await prisma.completion.create({ data: { userId: 1n, proposalId: proposal.id, activityId: 'dessin-5-1', passion: 'dessin', mood: 'ennui', duration: 5, activityText: '', coins: 5, localDate: '2026-10-07' } })
    expect(await sendDueReminders(deps(), new Date('2026-10-07T22:00:00Z'))).toBe(0)
  })
})
