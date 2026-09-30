import {
  drawExtra,
  getActivity,
  pickActivity,
  pickIntro,
  unlockTime,
  type ActivityExtra,
  type CreateProposalRequest,
  type Duration,
  type MoodId,
  type PassionId,
  type ProposalDTO,
} from '@pqs/shared'
import type { PrismaClient, Proposal, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { parsePassions } from './users.ts'

/** Une activité proposée reste « à reprendre » pendant 12 h. */
const OPEN_PROPOSAL_TTL_MS = 12 * 3600_000

export function parseExtra(value: string | null): ActivityExtra | null {
  if (!value) return null
  try {
    return JSON.parse(value) as ActivityExtra
  } catch {
    return null
  }
}

export function toProposalDTO(proposal: Proposal): ProposalDTO {
  const activity = getActivity(proposal.activityId)
  const duration = proposal.duration as Duration
  return {
    id: proposal.id,
    activityId: proposal.activityId,
    passion: proposal.passion as PassionId,
    mood: proposal.mood as MoodId,
    duration,
    text: activity?.text ?? '',
    intro: proposal.intro,
    extra: parseExtra(proposal.extra),
    createdAt: proposal.createdAt.toISOString(),
    unlockAt: unlockTime(proposal.createdAt, duration).toISOString(),
  }
}

/**
 * Tire une activité pour la passion, le mood et le temps choisis.
 * - Nouveau parcours : les propositions encore ouvertes sont abandonnées.
 * - « Une autre idée » (`replacing`) : la proposition affichée est remplacée,
 *   et son activité écartée du tirage.
 */
export async function createProposal(
  prisma: PrismaClient,
  user: User,
  request: CreateProposalRequest,
  { random = Math.random, now = new Date() }: { random?: () => number; now?: Date } = {},
): Promise<Proposal> {
  const { passion, mood, duration } = request
  if (!parsePassions(user).includes(passion)) throw badRequest('Cette passion ne fait pas partie de ton profil')

  let currentId: string | undefined
  if (request.replacing) {
    const current = await prisma.proposal.findFirst({ where: { id: request.replacing, userId: user.id } })
    if (!current) throw new ApiError(404, 'not_found', 'Proposition introuvable')
    if (current.status === 'completed') throw new ApiError(409, 'already_completed', 'Cette activité est déjà enregistrée')
    currentId = current.activityId
  }

  // Dernières activités proposées pour cette passion et ce temps.
  const recent = await prisma.proposal.findMany({
    where: { userId: user.id, passion, duration },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { activityId: true },
  })

  const activity = pickActivity({ passion, duration, recentIds: recent.map((row) => row.activityId), currentId, random })
  const extra = activity.extra ? drawExtra(activity.extra, random) : null

  const [, proposal] = await prisma.$transaction([
    prisma.proposal.updateMany({
      where: { userId: user.id, status: 'open' },
      data: { status: request.replacing ? 'replaced' : 'abandoned' },
    }),
    prisma.proposal.create({
      data: {
        userId: user.id,
        activityId: activity.id,
        passion,
        mood,
        duration,
        intro: pickIntro(mood, random),
        extra: extra ? JSON.stringify(extra) : null,
        createdAt: now,
      },
    }),
  ])
  return proposal
}

/** La dernière activité proposée et pas encore validée (moins de 12 h). */
export async function findOpenProposal(prisma: PrismaClient, user: User, now = new Date()): Promise<Proposal | null> {
  return prisma.proposal.findFirst({
    where: { userId: user.id, status: 'open', createdAt: { gte: new Date(now.getTime() - OPEN_PROPOSAL_TTL_MS) } },
    orderBy: { createdAt: 'desc' },
  })
}
