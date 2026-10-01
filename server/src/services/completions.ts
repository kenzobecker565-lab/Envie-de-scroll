import {
  coinsFor,
  getActivity,
  getPassion,
  isActivityRating,
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  UNLOCK_TOLERANCE_MS,
  unlockTime,
  type CompletionDTO,
  type Duration,
  type MoodId,
  type PassionId,
} from '@scroll-up/shared'
import type { Completion, PrismaClient, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { localDate } from '../lib/time.ts'
import type { IncomingPhoto, PhotoService } from '../photos/photos.ts'
import { parseExtra } from './proposals.ts'

export interface CompleteInput {
  proposalId: string
  text?: string
  exploredTitle?: string
  photo?: IncomingPhoto
}

function clean(value: string | undefined, max: number): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.length > max) throw badRequest(`Texte trop long (${max} caractères au maximum)`)
  return trimmed
}

/**
 * Valide une activité proposée et crédite les minutons (1 minute = 1 minuton).
 *
 * - Dessin : avec une photo, ou sans photo une fois la durée écoulée.
 * - Écriture : avec le texte produit, ou sans texte une fois la durée écoulée.
 * - Musique, Cinéma : une fois la durée écoulée (garde-fou temporel léger),
 *   avec, si on veut, le titre exploré.
 */
export async function completeProposal(
  prisma: PrismaClient,
  photos: PhotoService,
  user: User,
  input: CompleteInput,
  now = new Date(),
): Promise<Completion> {
  const proposal = await prisma.proposal.findFirst({ where: { id: input.proposalId, userId: user.id } })
  if (!proposal) throw new ApiError(404, 'not_found', 'Proposition introuvable')
  if (proposal.status === 'completed') throw new ApiError(409, 'already_completed', 'Cette activité est déjà enregistrée')
  if (proposal.status !== 'open') throw new ApiError(409, 'invalid_request', 'Cette activité n’est plus en cours\u00A0: relance « J’ai envie de scroller ».')

  const passion = getPassion(proposal.passion as PassionId)
  const duration = proposal.duration as Duration
  const text = passion.proof === 'texte' ? clean(input.text, MAX_TEXT_LENGTH) : null
  const exploredTitle = passion.proof === 'titre' ? clean(input.exploredTitle, MAX_TITLE_LENGTH) : null
  const photo = passion.proof === 'photo' ? input.photo : undefined

  const hasProof = Boolean(text || photo)
  const unlocked = now.getTime() >= unlockTime(proposal.createdAt, duration).getTime() - UNLOCK_TOLERANCE_MS
  if (!hasProof && !unlocked) {
    throw passion.timeGuard
      ? new ApiError(409, 'too_early', `Encore un peu de patience\u00A0: l’activité dure ${duration} minutes.`)
      : new ApiError(409, 'proof_required', passion.proof === 'photo' ? 'Ajoute la photo de ton dessin.' : 'Ajoute le texte que tu as écrit.')
  }

  let photoRef: string | null = null
  if (photo) {
    try {
      photoRef = await photos.save(photo, `Dessin · utilisateur ${user.id} · ${proposal.activityId}`)
    } catch (error) {
      console.error('[photos] Échec de l’enregistrement', error)
      throw new ApiError(502, 'photo_failed', 'La photo n’a pas pu être enregistrée. Réessaie dans un instant.')
    }
  }

  try {
    const [completion] = await prisma.$transaction([
      prisma.completion.create({
        data: {
          userId: user.id,
          proposalId: proposal.id,
          activityId: proposal.activityId,
          passion: proposal.passion,
          mood: proposal.mood,
          duration,
          activityText: getActivity(proposal.activityId)?.text ?? '',
          extra: proposal.extra,
          coins: coinsFor(duration),
          text,
          exploredTitle,
          photoRef,
          photoPending: passion.proof === 'photo' && !photoRef,
          localDate: localDate(now, user.timezone),
          createdAt: now,
        },
      }),
      prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'completed' } }),
    ])
    return completion
  } catch (error) {
    // Double appui sur « Enregistrer » : la contrainte d'unicité protège.
    if ((error as { code?: string }).code === 'P2002') throw new ApiError(409, 'already_completed', 'Cette activité est déjà enregistrée')
    throw error
  }
}

export async function listCompletions(
  prisma: PrismaClient,
  user: User,
  { cursor, limit }: { cursor?: string; limit: number },
): Promise<{ items: Completion[]; nextCursor: string | null }> {
  const rows = await prisma.completion.findMany({
    where: { userId: user.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
  const items = rows.slice(0, limit)
  return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null }
}

export function toCompletionDTO(completion: Completion, photoUrl: (completion: Completion) => string): CompletionDTO {
  return {
    id: completion.id,
    activityId: completion.activityId,
    passion: completion.passion as PassionId,
    mood: completion.mood as MoodId,
    duration: completion.duration as Duration,
    activityText: completion.activityText,
    extra: parseExtra(completion.extra),
    coins: completion.coins,
    text: completion.text,
    exploredTitle: completion.exploredTitle,
    photoUrl: completion.photoRef ? photoUrl(completion) : null,
    photoPending: completion.photoPending,
    rating: isActivityRating(completion.rating) ? completion.rating : null,
    createdAt: completion.createdAt.toISOString(),
  }
}

/** Délai pendant lequel une photo envoyée au bot peut rejoindre un dessin. */
const BOT_PHOTO_WINDOW_MS = 7 * 24 * 3600_000

/**
 * Une photo envoyée directement au bot rejoint le dernier dessin enregistré
 * sans photo (sur les 7 derniers jours). Renvoie ce dessin, ou `null`.
 */
export async function attachBotPhoto(prisma: PrismaClient, userId: bigint, photoRef: string, now = new Date()): Promise<Completion | null> {
  const pending = await prisma.completion.findFirst({
    where: { userId, passion: 'dessin', photoPending: true, createdAt: { gte: new Date(now.getTime() - BOT_PHOTO_WINDOW_MS) } },
    orderBy: { createdAt: 'desc' },
  })
  if (!pending) return null
  return prisma.completion.update({ where: { id: pending.id }, data: { photoRef, photoPending: false } })
}
