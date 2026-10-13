import { rhythmSong, rhythmTiles } from '@scroll-up/shared'
import type { PrismaClient, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { localDate } from '../lib/time.ts'

export async function startRhythm(prisma: PrismaClient, user: User, songId: unknown, now: Date) {
  const song = typeof songId === 'string' ? rhythmSong(songId) : undefined
  if (!song) throw badRequest('Morceau inconnu.')
  const proposal = await prisma.proposal.create({ data: { userId: user.id, passion: 'piano', activityId: `rhythm-${song.id}`, duration: 5, intro: 'Une pause en musique.', status: 'rhythm', createdAt: now } })
  return { sessionId: proposal.id }
}

export async function finishRhythm(prisma: PrismaClient, user: User, sessionId: unknown, hits: unknown, now: Date) {
  if (typeof sessionId !== 'string') throw badRequest('Séance inconnue.')
  const proposal = await prisma.proposal.findFirst({ where: { id: sessionId, userId: user.id } })
  const song = proposal?.activityId.startsWith('rhythm-') ? rhythmSong(proposal.activityId.slice(7)) : undefined
  if (!proposal || !song || !['rhythm','rhythm_completed'].includes(proposal.status)) throw new ApiError(404, 'not_found', 'Séance introuvable.')
  const tiles = rhythmTiles(song)
  if (!Number.isInteger(hits) || (hits as number) < 0 || (hits as number) > tiles.length) throw badRequest('Résultat invalide.')
  if (now.getTime() - proposal.createdAt.getTime() < song.durationMs) throw new ApiError(409, 'too_early', 'Le morceau n’est pas encore terminé.')
  const coins = Math.max(1, Math.round(song.durationMs / 60_000))
  try {
    await prisma.$transaction([
      prisma.completion.create({ data: { userId: user.id, proposalId: proposal.id, activityId: proposal.activityId, passion: 'piano', duration: song.durationMs / 60_000,
        activityText: `Jouer « ${song.title} » en rythme`, exploredTitle: `${song.title} · En rythme`, coins,
        text: `${hits} touches réussies sur ${tiles.length}. Une pause musicale de ${song.durationMs / 60_000} min.`, localDate: localDate(now, user.timezone), createdAt: now,
        extra: JSON.stringify({ rhythm: { songId: song.id, durationMs: song.durationMs, hits, total: tiles.length } }) } }),
      prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'rhythm_completed' } }),
    ])
  } catch (error) {
    if ((error as { code?: string }).code !== 'P2002') throw error
    // Retry or simultaneous submissions restore the same reward, never a second purchase.
  }
  const completion = await prisma.completion.findUniqueOrThrow({ where: { proposalId: proposal.id } })
  return { coins: completion.coins }
}
