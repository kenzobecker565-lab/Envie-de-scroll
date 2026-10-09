import {
  activePassions,
  countWords,
  DEFAULT_THEME,
  isAppTheme,
  isBaseActivity,
  isChallengeId,
  isPassionId,
  isPathStepId,
  isScrollMoment,
  parseSkills,
  PASSION_IDS,
  type PassionId,
  type PassionStatsDTO,
  type StatsDTO,
  type UserDTO,
} from '@scroll-up/shared'
import type { PrismaClient, User } from '../db.ts'
import type { TelegramUser } from '../auth/initData.ts'
import { isValidTimeZone, localMonth } from '../lib/time.ts'
import { sessionMinutes } from './sessionMinutes.ts'

export function parsePassions(user: Pick<User, 'passions'>): PassionId[] {
  try {
    const value: unknown = JSON.parse(user.passions)
    return Array.isArray(value) ? value.filter(isPassionId) : []
  } catch {
    return []
  }
}

export function toUserDTO(user: User): UserDTO {
  const passions = activePassions(parsePassions(user))
  const theme = isAppTheme(user.theme) ? user.theme : DEFAULT_THEME
  return {
    id: user.id.toString(),
    firstName: user.firstName,
    passions,
    onboarded: passions.length > 0,
    tutorialCompleted: user.tutorialCompleted,
    theme,
    remindersEnabled: user.remindersEnabled,
    scrollMoment: isScrollMoment(user.scrollMoment) ? user.scrollMoment : null,
    reminderTime: user.reminderTime,
    skills: parseSkills(user.skills),
  }
}

/**
 * Crée ou met à jour l'utilisateur à chaque ouverture de la Mini App.
 * Ouvrir l'app « répond » aux relances : leur compteur repart de zéro.
 */
export async function upsertFromTelegram(
  prisma: PrismaClient,
  telegramUser: TelegramUser,
  { timezone, now = new Date() }: { timezone?: string; now?: Date } = {},
): Promise<User> {
  const id = BigInt(telegramUser.id)
  const zone = isValidTimeZone(timezone) ? timezone : undefined
  const profile = {
    firstName: telegramUser.first_name ?? '',
    username: telegramUser.username ?? null,
    languageCode: telegramUser.language_code ?? null,
  }
  return prisma.user.upsert({
    where: { id },
    create: { id, ...profile, ...(zone ? { timezone: zone } : {}), canMessage: telegramUser.allows_write_to_pm === true, lastSeenAt: now },
    update: {
      ...profile,
      ...(zone ? { timezone: zone } : {}),
      ...(telegramUser.allows_write_to_pm ? { canMessage: true } : {}),
      lastSeenAt: now,
      unansweredReminders: 0,
    },
  })
}

/**
 * « Effacer mes données » : l'utilisateur et tout ce qui le concerne
 * (propositions, créations, projets, avis, suivi d'usage) disparaissent ; la
 * prochaine ouverture repart de l'inscription. Le rôle d'admin, rangé dans
 * les réglages du serveur, est gardé. Renvoie les références des photos à
 * effacer.
 */
export async function deleteUserData(prisma: PrismaClient, userId: bigint): Promise<string[]> {
  const photos = await prisma.completion.findMany({ where: { userId, photoRef: { not: null } }, select: { photoRef: true } })
  // Les relations sont en cascade : supprimer l'utilisateur supprime le reste.
  await prisma.user.deleteMany({ where: { id: userId } })
  return photos.flatMap((row) => (row.photoRef ? [row.photoRef] : []))
}

export async function getStats(prisma: PrismaClient, user: User, now = new Date()): Promise<StatsDTO> {
  const month = `${localMonth(now, user.timezone)}-`
  const completions = await prisma.completion.findMany({
    where: { userId: user.id },
    select: { passion: true, activityId: true, coins: true, text: true, photoRef: true, exploredTitle: true, localDate: true, duration: true, createdAt: true, proposal: { select: { createdAt: true } } },
  })
  const rows = completions.map((row) => ({ ...row, minutes: sessionMinutes(row) }))
  const thisMonth = rows.filter((row) => row.localDate.startsWith(month))
  return {
    totalCoins: rows.reduce((sum, row) => sum + row.coins, 0),
    totalMinutes: rows.reduce((sum, row) => sum + row.minutes, 0),
    totalActivities: rows.length,
    monthActivities: thisMonth.length,
    monthCoins: thisMonth.reduce((sum, row) => sum + row.coins, 0),
    monthMinutes: thisMonth.reduce((sum, row) => sum + row.minutes, 0),
    byPassion: passionStats(rows),
    challenge: [...new Set(thisMonth.map((row) => row.activityId).filter(isChallengeId))].sort(),
  }
}

type StatsRow = { passion: string; activityId: string; coins: number; minutes: number; text: string | null; photoRef: string | null; exploredTitle: string | null }

/** Minutons, activités, collection, étapes de parcours et signature, par passion. */
function passionStats(rows: StatsRow[]): PassionStatsDTO[] {
  return PASSION_IDS.flatMap((passion) => {
    const mine = rows.filter((row) => row.passion === passion)
    if (!mine.length) return []
    const ids = [...new Set(mine.map((row) => row.activityId))].sort()
    return [
      {
        passion,
        minutes: mine.reduce((sum, row) => sum + row.minutes, 0),
        coins: mine.reduce((sum, row) => sum + row.coins, 0),
        activities: mine.length,
        tried: ids.filter(isBaseActivity),
        steps: ids.filter(isPathStepId),
        drawings: mine.filter((row) => row.photoRef).length,
        words: mine.reduce((sum, row) => sum + countWords(row.text), 0),
        explored: mine.filter((row) => row.exploredTitle).length,
      },
    ]
  })
}
