import { countWords, DEFAULT_THEME, isAppTheme, isBaseActivity, isPassionId, isPathStepId, PASSION_IDS, type PassionId, type PassionStatsDTO, type StatsDTO, type UserDTO } from '@scroll-up/shared'
import type { PrismaClient, User } from '../db.ts'
import type { TelegramUser } from '../auth/initData.ts'
import { isValidTimeZone, localMonth } from '../lib/time.ts'

export function parsePassions(user: Pick<User, 'passions'>): PassionId[] {
  try {
    const value: unknown = JSON.parse(user.passions)
    return Array.isArray(value) ? value.filter(isPassionId) : []
  } catch {
    return []
  }
}

export function toUserDTO(user: User): UserDTO {
  const passions = parsePassions(user)
  const theme = isAppTheme(user.theme) ? user.theme : DEFAULT_THEME
  return { id: user.id.toString(), firstName: user.firstName, passions, onboarded: passions.length > 0, theme, remindersEnabled: user.remindersEnabled }
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

export async function getStats(prisma: PrismaClient, user: User, now = new Date()): Promise<StatsDTO> {
  const month = `${localMonth(now, user.timezone)}-`
  const rows = await prisma.completion.findMany({
    where: { userId: user.id },
    select: { passion: true, activityId: true, coins: true, text: true, photoRef: true, exploredTitle: true, localDate: true },
  })
  const thisMonth = rows.filter((row) => row.localDate.startsWith(month))
  return {
    totalCoins: rows.reduce((sum, row) => sum + row.coins, 0),
    totalActivities: rows.length,
    monthActivities: thisMonth.length,
    monthCoins: thisMonth.reduce((sum, row) => sum + row.coins, 0),
    byPassion: passionStats(rows),
  }
}

type StatsRow = { passion: string; activityId: string; coins: number; text: string | null; photoRef: string | null; exploredTitle: string | null }

/** Minutons, activités, collection, étapes de parcours et signature, par passion. */
function passionStats(rows: StatsRow[]): PassionStatsDTO[] {
  return PASSION_IDS.flatMap((passion) => {
    const mine = rows.filter((row) => row.passion === passion)
    if (!mine.length) return []
    const ids = [...new Set(mine.map((row) => row.activityId))].sort()
    return [
      {
        passion,
        minutes: mine.reduce((sum, row) => sum + row.coins, 0),
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
