import {
  activePassions,
  activitiesFor,
  canPlayChallenge,
  canPlayStep,
  drawExtra,
  getActivity,
  getChallengeActivity,
  getMood,
  getPassion,
  getPathStep,
  isActivityRating,
  isBaseActivity,
  isChallengeId,
  isMoodId,
  isPathStepId,
  passionLevel,
  pickActivity,
  parseSkills,
  pickIntro,
  pickLessonIntro,
  quietActivitiesFor,
  skillActivitiesFor,
  unlockTime,
  type Activity,
  type ActivityExtra,
  type ActivityRating,
  type CreateProposalRequest,
  type Duration,
  type PassionId,
  type ProposalDTO,
} from '@scroll-up/shared'
import type { PrismaClient, Proposal, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { localDate, localHour } from '../lib/time.ts'
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
    mood: isMoodId(proposal.mood) ? proposal.mood : null,
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
 * - Étape de parcours (`step`) : pas de tirage, l'étape elle-même, si elle est
 *   débloquée (étape précédente réussie, parcours ouvert ou ouvert d'emblée
 *   par le niveau déclaré).
 * - Passion avec niveau (Piano) : seules les activités adaptées au niveau.
 * - Sans humeur : tirage sans préférence d’énergie, avec une introduction neutre.
 */
export async function createProposal(
  prisma: PrismaClient,
  user: User,
  request: CreateProposalRequest,
  { random = Math.random, now = new Date() }: { random?: () => number; now?: Date } = {},
): Promise<Proposal> {
  const { passion, mood, duration } = request
  if (![...parsePassions(user), ...activePassions(parsePassions(user))].includes(passion)) throw badRequest('Cette passion ne fait pas partie de ton profil')

  let currentId: string | undefined
  let currentProposal: Proposal | undefined
  if (request.replacing) {
    const current = await prisma.proposal.findFirst({ where: { id: request.replacing, userId: user.id } })
    if (!current) throw new ApiError(404, 'not_found', 'Proposition introuvable')
    if (current.status === 'completed') throw new ApiError(409, 'already_completed', 'Cette activité est déjà enregistrée')
    currentId = current.activityId
    currentProposal = current
  }

  let activity: Activity
  if (request.step !== undefined && isChallengeId(request.step)) {
    // Le mot du jour : celui d'aujourd'hui, ou un mot passé du mois (on rattrape quand on veut).
    const challenge = getChallengeActivity(request.step)
    if (!challenge || challenge.passion !== passion || challenge.duration !== duration) throw badRequest('Mot du jour invalide.')
    if (request.replacing) throw badRequest('Le mot du jour ne se remplace pas.')
    if (!canPlayChallenge(challenge.id, localDate(now, user.timezone))) throw new ApiError(409, 'locked', 'Ce mot n’est pas encore là\u00A0: reviens le jour venu.')
    activity = challenge
  } else if (request.step !== undefined && isBaseActivity(request.step)) {
    const selected = getActivity(request.step)!
    if (selected.passion !== passion || selected.duration !== duration) throw badRequest('Activité de l’atelier invalide.')
    if (request.replacing) {
      if (passion !== 'sport' || currentProposal?.passion !== 'sport' || currentProposal.duration !== duration) {
        throw badRequest('Une activité choisie dans l’atelier ne se remplace pas.')
      }
      if (currentProposal.status !== 'open') throw new ApiError(409, 'invalid_request', 'Cette séance n’est plus en cours.')
      if (selected.id === currentId || selected.id.includes('-lesson-')) throw badRequest('Choisis une autre séance.')
    }
    activity = selected
  } else if (request.step !== undefined) {
    const step = getPathStep(request.step)
    if (!step || step.passion !== passion || step.duration !== duration) throw badRequest('Étape de parcours invalide.')
    if (request.replacing) throw badRequest('Une étape de parcours ne se remplace pas.')
    const done = await prisma.completion.findMany({ where: { userId: user.id, passion }, select: { activityId: true, coins: true } })
    const level = passionLevel(passion, done.reduce((sum, row) => sum + row.coins, 0)).level
    const steps = done.map((row) => row.activityId).filter(isPathStepId)
    if (!canPlayStep(step, steps, level, parseSkills(user.skills)[passion])) throw new ApiError(409, 'locked', 'Cette étape n’est pas encore débloquée\u00A0: réussis d’abord la précédente.')
    activity = step
  } else {
    // Dernières activités proposées pour cette passion et ce temps.
    const recent = await prisma.proposal.findMany({
      where: { userId: user.id, passion, duration },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { activityId: true },
    })
    // Les notes données (la plus récente par activité) font pencher le tirage, comme l'humeur.
    const rated = await prisma.completion.findMany({
      where: { userId: user.id, passion, duration },
      orderBy: { createdAt: 'asc' },
      select: { activityId: true, rating: true },
    })
    const ratings = Object.fromEntries(rated.filter((row) => isActivityRating(row.rating)).map((row) => [row.activityId, row.rating as ActivityRating]))
    // « Pas de son autour de toi » : seulement des activités qui se font sans écouter.
    const quietIds = request.quiet ? quietActivitiesFor(passion, duration).map((quiet) => quiet.id) : undefined
    // Passion avec niveau (Piano) : les activités adaptées au niveau déclaré. Le niveau resserre le tirage, sans jamais le vider.
    const skill = parseSkills(user.skills)[passion]
    const suited = skill ? skillActivitiesFor(passion, duration, skill).map((activity) => activity.id) : []
    const narrowed = quietIds ? quietIds.filter((id) => suited.includes(id)) : suited
    const unseen = passion === 'logique' || passion === 'francais' ? activitiesFor(passion, duration).filter(a => a.id !== currentId && !rated.some(row => row.activityId === a.id)).map(a => a.id) : []
    const allowedIds = unseen.length ? unseen : narrowed.length ? narrowed : quietIds
    if (allowedIds?.length === 0) {
      throw new ApiError(409, 'no_quiet', `Toutes les activités ${getPassion(passion).label} de ${duration}\u00A0min s’écoutent. Essaie un autre temps, ou une autre passion.`)
    }
    activity = pickActivity({ passion, duration, recentIds: recent.map((row) => row.activityId), currentId: currentId ?? recent[0]?.activityId, ratings, energy: mood ? getMood(mood).energy : undefined, allowedIds, random })
  }
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
        mood: mood ?? null,
        duration,
        intro: mood ? pickIntro(mood, random, localHour(now, user.timezone)) : isPathStepId(activity.id) ? pickLessonIntro(random) : 'Un moment pour ta passion. Voici ton activité :',
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
