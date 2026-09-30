import { isPassionId, type PassionId, type StatsDTO, type UserDTO } from '@pqs/shared'
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
  return { id: user.id.toString(), firstName: user.firstName, passions, onboarded: passions.length > 0 }
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
  const month = localMonth(now, user.timezone)
  const [total, thisMonth] = await Promise.all([
    prisma.completion.aggregate({ where: { userId: user.id }, _sum: { coins: true }, _count: true }),
    prisma.completion.aggregate({ where: { userId: user.id, localDate: { startsWith: `${month}-` } }, _sum: { coins: true }, _count: true }),
  ])
  return {
    totalCoins: total._sum.coins ?? 0,
    totalActivities: total._count,
    monthActivities: thisMonth._count,
    monthCoins: thisMonth._sum.coins ?? 0,
  }
}
