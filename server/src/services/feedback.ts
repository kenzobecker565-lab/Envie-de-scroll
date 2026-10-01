/**
 * ============================================================================
 *  AVIS, NOTES, SUIVI D'USAGE ET STATISTIQUES (pour la phase de test)
 * ============================================================================
 *
 * - Avis écrits : depuis l'app (formulaire) ou en écrivant au bot. Chaque
 *   avis est transmis aux admins dans Telegram.
 * - Notes : après « Activité enregistrée. », 3 j'ai adoré, 2 sympa, 1 pas pour moi.
 * - Événements : appui sur le gros bouton, humeur, temps, passion, style de
 *   musique… (sans texte).
 * - Statistiques : /stats dans le bot. Pour un admin, le tableau de bord du
 *   test (entonnoir, passions, notes, activités préférées) ; pour les autres,
 *   leurs propres chiffres.
 *
 * Admins : la variable ADMIN_IDS (identifiants Telegram séparés par des
 * virgules), ou la première personne qui envoie /admin au bot.
 */

import {
  collectionSize,
  getActivity,
  getChallengeActivity,
  getPathStep,
  isPathStepId,
  pathProgress,
  PASSION_IDS,
  getAmbiance,
  getMood,
  getPassion,
  isActivityRating,
  isChallengeId,
  isAmbianceId,
  lastMilestone,
  MAX_FEEDBACK_LENGTH,
  nextMilestone,
  passionLevel,
  RATING_LABELS,
  SCROLL_MOMENTS,
  type ActivityRating,
  type AppEventName,
  type MoodId,
  type PassionId,
} from '@scroll-up/shared'
import type { Completion, PrismaClient, User } from '../db.ts'
import { ApiError, badRequest } from '../http/errors.ts'
import { localMonth } from '../lib/time.ts'

/** Envoie un message aux admins (Telegram). Absent sans bot. */
export type Notify = (text: string) => Promise<void>

/* --------------------------------- Avis ---------------------------------- */

export async function saveFeedback(
  prisma: PrismaClient,
  user: User,
  { message, context, source = 'app' }: { message: unknown; context?: unknown; source?: 'app' | 'bot' },
  notify?: Notify,
): Promise<void> {
  if (typeof message !== 'string' || message.trim().length === 0) throw badRequest('Ton message est vide.')
  if (message.length > MAX_FEEDBACK_LENGTH) throw badRequest(`Ton message est trop long (${MAX_FEEDBACK_LENGTH} caractères au maximum).`)
  const cleanContext = typeof context === 'string' && context.trim() ? context.trim().slice(0, 200) : null
  const feedback = await prisma.feedback.create({ data: { userId: user.id, message: message.trim(), source, context: cleanContext } })
  if (notify) {
    const who = describeUser(user)
    const where = feedback.context ? ` (${feedback.context})` : ''
    await notify(`Nouvel avis de ${who}${where}, ${source === 'bot' ? 'écrit au bot' : 'depuis l’app'} :\n\n« ${feedback.message} »`).catch((error) =>
      console.error('[avis] Transmission aux admins impossible', error),
    )
  }
}

export function describeUser(user: Pick<User, 'firstName' | 'username' | 'id'>): string {
  const name = user.firstName || 'Quelqu’un'
  return user.username ? `${name} (@${user.username})` : `${name} (id ${user.id})`
}

/* --------------------------------- Notes --------------------------------- */

export async function rateCompletion(prisma: PrismaClient, user: User, completionId: string, rating: unknown): Promise<Completion> {
  if (!isActivityRating(rating)) throw badRequest('Note inconnue.')
  const completion = await prisma.completion.findUnique({ where: { id: completionId } })
  if (!completion || completion.userId !== user.id) throw new ApiError(404, 'not_found', 'Activité introuvable.')
  return prisma.completion.update({ where: { id: completion.id }, data: { rating } })
}

/* ------------------------------ Événements ------------------------------- */

/** Au plus tant d'événements par personne et par jour (garde-fou). */
const MAX_EVENTS_PER_DAY = 500

export async function recordEvent(
  prisma: PrismaClient,
  user: Pick<User, 'id'>,
  name: AppEventName | 'open',
  data?: Record<string, string | number | boolean>,
  now = new Date(),
): Promise<void> {
  const since = new Date(now.getTime() - 24 * 3600_000)
  const recent = await prisma.appEvent.count({ where: { userId: user.id, createdAt: { gte: since } } })
  if (recent >= MAX_EVENTS_PER_DAY) return
  const json = data && Object.keys(data).length ? JSON.stringify(data).slice(0, 500) : null
  await prisma.appEvent.create({ data: { userId: user.id, name, data: json, createdAt: now } })
}

/** Données d'événement valides : quelques clés courtes, valeurs simples. */
export function cleanEventData(value: unknown): Record<string, string | number | boolean> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out: Record<string, string | number | boolean> = {}
  for (const [key, item] of Object.entries(value).slice(0, 8)) {
    if (!/^[a-zA-Z]{1,24}$/.test(key)) continue
    if (typeof item === 'string') out[key] = item.slice(0, 60)
    else if (typeof item === 'number' && Number.isFinite(item)) out[key] = item
    else if (typeof item === 'boolean') out[key] = item
  }
  return out
}

/* -------------------------------- Admins --------------------------------- */

const ADMIN_KEY = 'admins'

export async function adminIds(prisma: PrismaClient, fromEnv: readonly string[]): Promise<string[]> {
  if (fromEnv.length) return [...fromEnv]
  const setting = await prisma.setting.findUnique({ where: { key: ADMIN_KEY } })
  try {
    const value: unknown = setting ? JSON.parse(setting.value) : []
    return Array.isArray(value) ? value.map(String) : []
  } catch {
    return []
  }
}

export async function isAdmin(prisma: PrismaClient, fromEnv: readonly string[], userId: bigint | number | string): Promise<boolean> {
  return (await adminIds(prisma, fromEnv)).includes(String(userId))
}

/**
 * /admin : sans ADMIN_IDS, la première personne qui le demande devient admin.
 * Renvoie `claimed` (vient de le devenir), `already` (l'était déjà) ou `taken`.
 */
export async function claimAdmin(prisma: PrismaClient, fromEnv: readonly string[], userId: bigint | number): Promise<'claimed' | 'already' | 'taken'> {
  const current = await adminIds(prisma, fromEnv)
  if (current.includes(String(userId))) return 'already'
  if (current.length) return 'taken'
  await prisma.setting.upsert({
    where: { key: ADMIN_KEY },
    create: { key: ADMIN_KEY, value: JSON.stringify([String(userId)]) },
    update: { value: JSON.stringify([String(userId)]) },
  })
  return 'claimed'
}

/* ------------------------------ Statistiques ----------------------------- */

const percent = (part: number, total: number) => (total > 0 ? `${Math.round((100 * part) / total)} %` : '—')
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n > 1 ? many : one}`

function hoursLabel(coins: number): string {
  if (coins < 60) return `${coins} min`
  const h = Math.floor(coins / 60)
  const m = coins % 60
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`
}

/** Le tableau de bord du test, pour les admins (texte prêt à envoyer dans Telegram). */
export async function globalStats(prisma: PrismaClient, now = new Date()): Promise<string> {
  const dayAgo = new Date(now.getTime() - 24 * 3600_000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600_000)
  const [
    users,
    onboarded,
    activeDay,
    activeWeek,
    newDay,
    ctaTotal,
    ctaDay,
    moodEvents,
    timeEvents,
    proposals,
    replaced,
    completions,
    completionsDay,
    coins,
    byPassion,
    byDuration,
    byMood,
    ratings,
    feedbackCount,
    shares,
    invites,
    doers,
    musicOff,
    musicChoices,
    stepRows,
    projects,
    projectsDone,
    challengeRows,
    homeScreenAsks,
    homeScreenAdded,
    homeScreenSilent,
    moments,
    remindersOff,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { NOT: { passions: '[]' } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.appEvent.count({ where: { name: 'cta' } }),
    prisma.appEvent.count({ where: { name: 'cta', createdAt: { gte: dayAgo } } }),
    prisma.appEvent.count({ where: { name: 'mood' } }),
    prisma.appEvent.count({ where: { name: 'time' } }),
    prisma.proposal.count(),
    prisma.proposal.count({ where: { status: 'replaced' } }),
    prisma.completion.count(),
    prisma.completion.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.completion.aggregate({ _sum: { coins: true } }),
    prisma.completion.groupBy({ by: ['passion'], _count: true }),
    prisma.completion.groupBy({ by: ['duration'], _count: true }),
    prisma.proposal.groupBy({ by: ['mood'], _count: true, orderBy: { _count: { mood: 'desc' } }, take: 3 }),
    prisma.completion.groupBy({ by: ['rating'], _count: true, where: { rating: { not: null } } }),
    prisma.feedback.count(),
    prisma.appEvent.count({ where: { name: 'share' } }),
    prisma.appEvent.count({ where: { name: 'invite' } }),
    prisma.completion.groupBy({ by: ['userId'], _count: true }),
    prisma.appEvent.count({ where: { name: 'music_off' } }),
    prisma.appEvent.findMany({ where: { name: 'music' }, orderBy: { createdAt: 'asc' }, select: { userId: true, data: true } }),
    prisma.completion.findMany({ where: { activityId: { startsWith: 'parcours-' } }, select: { userId: true, activityId: true } }),
    prisma.project.count(),
    prisma.project.count({ where: { finishedAt: { not: null } } }),
    prisma.completion.findMany({ where: { activityId: { startsWith: 'defi-' } }, select: { userId: true, activityId: true } }),
    prisma.appEvent.count({ where: { name: 'home_screen' } }),
    prisma.appEvent.count({ where: { name: 'home_screen_added' } }),
    prisma.appEvent.count({ where: { name: 'home_screen_silent' } }),
    prisma.user.groupBy({ by: ['scrollMoment'], _count: true, where: { NOT: { passions: '[]' } } }),
    prisma.user.count({ where: { remindersEnabled: false, NOT: { passions: '[]' } } }),
  ])

  const ratingCount = (value: ActivityRating) => ratings.find((row) => row.rating === value)?._count ?? 0
  const returning = doers.filter((row) => row._count >= 2).length
  const momentCount = (moment: string | null) => moments.find((row) => row.scrollMoment === moment)?._count ?? 0
  const lines = [
    'Scroll-up · le test en chiffres',
    '',
    `Testeurs : ${users} (${newDay} nouveaux en 24 h)`,
    `Actifs : ${activeDay} en 24 h, ${activeWeek} sur 7 jours`,
    `Passions choisies : ${onboarded} sur ${users} (${percent(onboarded, users)})`,
    `Moments de scroll : ${SCROLL_MOMENTS.map((moment) => `${moment} ${momentCount(moment)}`).join(' · ')} · pas dit ${momentCount(null)} · relances coupées ${remindersOff}`,
    '',
    'Le parcours',
    `« J’ai envie de scroller » : ${plural(ctaTotal, 'appui')} (${ctaDay} en 24 h)`,
    `→ humeur choisie : ${moodEvents} (${percent(moodEvents, ctaTotal)})`,
    `→ temps choisi : ${timeEvents} (${percent(timeEvents, ctaTotal)})`,
    `→ activités proposées : ${proposals - replaced}, plus ${plural(replaced, 'fois', 'fois')} « Une autre idée »`,
    `→ activités validées : ${completions} (${percent(completions, ctaTotal)} des appuis), dont ${completionsDay} en 24 h`,
    `Temps de création cumulé : ${hoursLabel(coins._sum.coins ?? 0)}`,
    `Testeurs revenus au moins 2 fois : ${returning} sur ${doers.length} qui ont validé une activité`,
    '',
    `Par passion : ${byPassion.map((row) => `${getPassion(row.passion as PassionId).label} ${row._count}`).join(' · ') || '—'}`,
    `Par durée : ${[...byDuration].sort((a, b) => a.duration - b.duration).map((row) => `${row.duration} min ${row._count}`).join(' · ') || '—'}`,
    `Humeurs les plus fréquentes : ${byMood.map((row) => `${getMood(row.mood as MoodId).label.replace(/^Je suis |^J’ai |^Je /, '')} (${row._count})`).join(', ') || '—'}`,
    '',
    `Notes des activités : ${RATING_LABELS[3].toLowerCase()} ${ratingCount(3)} · ${RATING_LABELS[2].toLowerCase()} ${ratingCount(2)} · ${RATING_LABELS[1].toLowerCase()} ${ratingCount(1)}`,
    `Avis écrits : ${feedbackCount} (/avis pour les lire)`,
    `Partages : ${shares} · invitations : ${invites}`,
    `Écran d’accueil : ${plural(homeScreenAdded, 'icône ajoutée', 'icônes ajoutées')} (${plural(homeScreenAsks, 'demande')}, ${homeScreenSilent} bloquée${homeScreenSilent > 1 ? 's' : ''} par le téléphone)`,
    `Musique d’ambiance : ${musicLine(musicChoices)} · coupée ${plural(musicOff, 'fois', 'fois')}`,
    `Parcours : ${plural(stepRows.length, 'étape réussie', 'étapes réussies')}, ${plural(finishedPaths(stepRows), 'parcours terminé', 'parcours terminés')}`,
    `Projets : ${plural(projects, 'créé', 'créés')}, ${plural(projectsDone, 'terminé', 'terminés')}`,
    `Mot du jour : ${plural(challengeRows.length, 'mot', 'mots')} (dessin ${challengeRows.filter((row) => row.activityId.startsWith('defi-dessin')).length}, écriture ${challengeRows.filter((row) => row.activityId.startsWith('defi-ecriture')).length}), par ${plural(new Set(challengeRows.map((row) => row.userId)).size, 'personne')}`,
  ]

  const top = await activityRanking(prisma)
  if (top.best.length) {
    lines.push('', 'Les activités les mieux notées')
    for (const row of top.best) lines.push(`${row.score.toFixed(1)}/3 (${row.count}) · ${row.text}`)
  }
  if (top.worst.length) {
    lines.push('', 'Les moins bien notées')
    for (const row of top.worst) lines.push(`${row.score.toFixed(1)}/3 (${row.count}) · ${row.text}`)
  }
  return lines.join('\n')
}

async function activityRanking(prisma: PrismaClient) {
  const rows = await prisma.completion.groupBy({ by: ['activityId'], _avg: { rating: true }, _count: { rating: true }, where: { rating: { not: null } } })
  const scored = rows
    .map((row) => ({ id: row.activityId, score: row._avg.rating ?? 0, count: row._count.rating, text: shorten(getActivity(row.activityId)?.text ?? row.activityId, 70) }))
    .sort((a, b) => b.score - a.score || b.count - a.count)
  const best = scored.slice(0, 3)
  const worst = scored.length > 3 ? scored.slice(-3).reverse().filter((row) => row.score < 2.5) : []
  return { best, worst }
}

/** Parcours terminés, toutes personnes confondues. */
function finishedPaths(rows: { userId: bigint; activityId: string }[]): number {
  const byUser = new Map<bigint, string[]>()
  for (const row of rows) byUser.set(row.userId, [...(byUser.get(row.userId) ?? []), row.activityId])
  let count = 0
  for (const steps of byUser.values()) {
    for (const passion of PASSION_IDS) count += pathProgress(passion, steps, 0).filter((entry) => entry.finished).length
  }
  return count
}

/** Les styles de musique choisis dans les réglages (le dernier choix de chacun). */
function musicLine(events: { userId: bigint; data: string | null }[]): string {
  const latest = new Map<bigint, string>()
  for (const event of events) {
    try {
      const { ambiance } = JSON.parse(event.data ?? '{}') as { ambiance?: unknown }
      if (ambiance === 'hasard' || isAmbianceId(ambiance)) latest.set(event.userId, ambiance)
    } catch {
      // Donnée illisible : ignorée.
    }
  }
  const counts = new Map<string, number>()
  for (const choice of latest.values()) counts.set(choice, (counts.get(choice) ?? 0) + 1)
  const label = (choice: string) => (isAmbianceId(choice) ? getAmbiance(choice).label : 'Au hasard')
  const styles = [...counts].sort((a, b) => b[1] - a[1]).map(([choice, count]) => `${label(choice)} ${count}`)
  return styles.length ? `styles choisis (dernier choix de chacun) ${styles.join(' · ')}` : 'aucun style choisi'
}

function shorten(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text
}

/** Les chiffres d'une personne (/stats pour tout le monde). */
export async function personalStats(prisma: PrismaClient, user: User): Promise<string> {
  const [total, byPassion, tried, projects] = await Promise.all([
    prisma.completion.aggregate({ where: { userId: user.id }, _sum: { coins: true }, _count: true }),
    prisma.completion.groupBy({ by: ['passion'], where: { userId: user.id }, _count: true, _sum: { coins: true }, orderBy: { _count: { passion: 'desc' } } }),
    prisma.completion.groupBy({ by: ['passion', 'activityId'], where: { userId: user.id } }),
    prisma.project.findMany({ where: { userId: user.id }, select: { finishedAt: true } }),
  ])
  const coins = total._sum.coins ?? 0
  if (total._count === 0) {
    return 'Ta galerie est encore vide. La prochaine fois que ton pouce te démange, ouvre l’app et appuie sur « J’ai envie de scroller »\u00A0: on s’occupe du reste.'
  }
  const reached = lastMilestone(coins)
  const next = nextMilestone(coins)
  const lines = [
    `Ta galerie compte ${plural(total._count, 'création')} : ${hoursLabel(coins)} de création, soit ${plural(coins, 'minuton')}.`,
    `Ta passion la plus jouée : ${getPassion(byPassion[0]!.passion as PassionId).label.toLowerCase()}.`,
  ]
  if (reached) lines.push(`Dernier palier atteint : ${reached.title}.`)
  if (next) lines.push(`Prochain palier : ${next.title}, plus que ${plural(next.coins - coins, 'minute')}.`)
  lines.push('', 'Tes passions')
  for (const row of byPassion) {
    const passion = row.passion as PassionId
    const level = passionLevel(passion, row._sum.coins ?? 0)
    const ids = tried.filter((entry) => entry.passion === passion).map((entry) => entry.activityId)
    const collected = ids.filter((id) => !isPathStepId(id)).length
    lines.push(`${getPassion(passion).label} : niveau ${level.level}${level.title ? ` (${level.title})` : ''}, ${collected}/${collectionSize(passion)} activités découvertes`)
    for (const entry of pathProgress(passion, ids.filter(isPathStepId), level.level)) {
      if (entry.finished) lines.push(`  Parcours « ${entry.path.title} » terminé : badge ${entry.path.badge}`)
      else if (entry.done > 0) lines.push(`  Parcours « ${entry.path.title} » : étape ${entry.done}/${entry.path.steps.length}`)
    }
  }
  const challenges = tried.filter((entry) => isChallengeId(entry.activityId) && entry.activityId.slice(-10, -3) === localMonth(new Date(), user.timezone)).length
  if (challenges) lines.push('', `Mots du jour ce mois-ci : ${challenges}`)
  if (projects.length) {
    const done = projects.filter((project) => project.finishedAt).length
    lines.push('', `Tes projets : ${plural(projects.length - done, 'en cours', 'en cours')}, ${plural(done, 'terminé', 'terminés')}`)
  }
  return lines.join('\n')
}

/** Les derniers avis écrits (pour /avis). */
export async function recentFeedback(prisma: PrismaClient, limit = 10): Promise<string> {
  const items = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' }, take: limit, include: { user: true } })
  if (!items.length) return 'Pas encore d’avis écrit. Ils arriveront ici (et en direct dans cette conversation).'
  const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  return [
    `Les ${plural(items.length, 'dernier avis', 'derniers avis')} :`,
    ...items.map((item) => `\n${date.format(item.createdAt)} · ${describeUser(item.user)}${item.context ? ` · ${item.context}` : ''}\n« ${item.message} »`),
  ].join('\n')
}

/* ---------------------------------- Export ---------------------------------- */

/** « Visages, étape 3 (Moyen) » pour une étape de parcours, le mot pour un mot du jour, sinon rien. */
function stepLabel(activityId: string): string {
  const step = getPathStep(activityId)
  if (step) return `${step.pathId}, étape ${step.index} (${step.difficulty})`
  const challenge = getChallengeActivity(activityId)
  return challenge ? `mot du jour du ${challenge.day} : ${challenge.word}` : ''
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
const csv = (rows: unknown[][]) => rows.map((row) => row.map(csvCell).join(';')).join('\n')

/** Deux fichiers CSV (séparateur « ; », pour Excel en français) : activités validées et avis. */
export async function exportCsv(prisma: PrismaClient): Promise<{ completions: string; feedback: string }> {
  const [completions, feedback] = await Promise.all([
    prisma.completion.findMany({ orderBy: { createdAt: 'asc' }, include: { user: true, project: true } }),
    prisma.feedback.findMany({ orderBy: { createdAt: 'asc' }, include: { user: true } }),
  ])
  return {
    completions: csv([
      ['date', 'testeur', 'passion', 'humeur', 'duree_min', 'activite', 'parcours', 'projet', 'note', 'texte', 'titre_explore', 'photo'],
      ...completions.map((c) => [
        c.createdAt.toISOString(),
        describeUser(c.user),
        c.passion,
        c.mood,
        c.duration,
        c.activityText,
        stepLabel(c.activityId),
        c.project?.name ?? '',
        isActivityRating(c.rating) ? RATING_LABELS[c.rating] : '',
        c.text ?? '',
        c.exploredTitle ?? '',
        c.photoRef ? 'oui' : 'non',
      ]),
    ]),
    feedback: csv([['date', 'testeur', 'source', 'contexte', 'message'], ...feedback.map((f) => [f.createdAt.toISOString(), describeUser(f.user), f.source, f.context ?? '', f.message])]),
  }
}
