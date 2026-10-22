/**
 * ============================================================================
 *  SERVEUR LOCAL DE LA VERSION HORS LIGNE (APK de présentation)
 * ============================================================================
 *
 * Reprend les routes de server/src/http/app.ts, mais à l'intérieur de l'app :
 * les services du serveur (server/src/services) tournent tels quels sur une
 * base en mémoire sauvegardée dans le téléphone. Aucune connexion Internet,
 * aucun compte : une seule personne, celle qui tient le téléphone.
 *
 * L'app appelle `window.__SCROLLUP_LOCAL_API__(url, init)` au lieu de `fetch`
 * (voir app/src/api/client.ts) et reçoit une vraie `Response`.
 */

import {
  ATELIER_AMBIANCES,
  ATELIER_DECORS,
  ATELIER_FRAMES,
  DURATIONS,
  MAX_PHOTO_BYTES,
  asksSkill,
  drawingSuggestions,
  isAppEventName,
  isAppTheme,
  isDiscoveryGuide,
  isDrawingStyle,
  isMoodId,
  isPassionId,
  isReminderTime,
  isScrollMoment,
  isSkillLevel,
  learningAttempted,
  learningLesson,
  normalizePassions,
  parseAtelierAppearance,
  parseDiscoveryGuides,
  parseSkills,
  validateLearning,
  type ApiErrorBody,
  type Duration,
  type LearningWork,
  type MeResponse,
} from '@scroll-up/shared'
import { ApiError, badRequest } from '../../server/src/http/errors.ts'
import { completeProposal, listCompletions, toCompletionDTO } from '../../server/src/services/completions.ts'
import { cleanEventData, rateCompletion, recordEvent, saveFeedback } from '../../server/src/services/feedback.ts'
import { assignProject, createProject, deleteProject, listProjects, passionDetail, projectDetail, updateProject } from '../../server/src/services/projects.ts'
import { createProposal, findOpenProposal, listSavedProposals, toProposalDTO, updateSession } from '../../server/src/services/proposals.ts'
import { bonusMelody, buyItem, claimShopTestCredit, equipItem, getShop, redeemSkinCode } from '../../server/src/services/shop.ts'
import { deleteUserData, getStats, toUserDTO, upsertFromTelegram } from '../../server/src/services/users.ts'
import { MemoryPrisma } from './memoryPrisma.ts'
import { deletePhoto, loadPhotos, loadTables, requestPersistence, savePhoto, saveTables } from './storage.ts'

/** La personne qui tient le téléphone (identifiant négatif, comme les invités du serveur). */
const LOCAL_USER = { id: -1, first_name: '', allows_write_to_pm: false }
const SESSION_GAP_MS = 30 * 60_000
const PHOTO_TYPES = /^image\/(jpeg|png|webp)$/

/* eslint-disable @typescript-eslint/no-explicit-any */
type Any = any
type Body = Record<string, unknown>

interface Context {
  params: Record<string, string>
  query: URLSearchParams
  body: Body
  file?: Blob
  timezone?: string
}

interface Result {
  status?: number
  body?: unknown
}

type Handler = (context: Context) => Promise<Result | unknown>

export async function createLocalApi() {
  const prisma = new MemoryPrisma((await loadTables()) ?? {})
  const db = prisma as Any
  requestPersistence()

  /* ----------------------------------------------------------- photos */

  const photoBlobs = await loadPhotos()
  const photoUrls = new Map<string, string>()
  for (const [ref, blob] of photoBlobs) photoUrls.set(ref, URL.createObjectURL(blob))

  const photos = {
    target: 'local' as const,
    async save(photo: { buffer: Blob; mimetype: string }) {
      const ref = `local:${crypto.randomUUID()}`
      const blob = photo.buffer.type ? photo.buffer : new Blob([photo.buffer], { type: photo.mimetype })
      await savePhoto(ref, blob)
      photoUrls.set(ref, URL.createObjectURL(blob))
      return ref
    },
    async open() {
      return null
    },
    async remove(ref: string) {
      const url = photoUrls.get(ref)
      if (url) URL.revokeObjectURL(url)
      photoUrls.delete(ref)
      await deletePhoto(ref)
    },
  }
  const photoUrl = (completion: { photoRef: string | null }) => (completion.photoRef ? (photoUrls.get(completion.photoRef) ?? '') : '')
  const now = () => new Date()

  const currentUser = (context: Context) => upsertFromTelegram(db, LOCAL_USER, { timezone: context.timezone, now: now() })

  const learningDTO = (entry: { id: string; lessonId: string; passion: string; title: string; completed: boolean; mastered: boolean; review: boolean; updatedAt: Date; work: string }, includeWork = true) => {
    const { work: stored, ...metadata } = entry
    const work = JSON.parse(stored) as LearningWork
    return { ...metadata, updatedAt: entry.updatedAt.toISOString(), attempted: learningAttempted(work), ...(includeWork ? { work } : {}) }
  }
  const withoutOwner = (entry: Any) => {
    const { userId: _userId, createdAt: _createdAt, ...dto } = entry
    return dto
  }

  /* ----------------------------------------------------------- routes */

  const routes: { method: string; pattern: RegExp; keys: string[]; handler: Handler }[] = []
  const route = (method: string, path: string, handler: Handler) => {
    const keys: string[] = []
    const pattern = new RegExp(`^${path.replace(/:([a-zA-Z]+)/g, (_match, key: string) => { keys.push(key); return '([^/]+)' })}$`)
    routes.push({ method, pattern, keys, handler })
  }

  route('GET', '/health', async () => ({ ok: true }))

  // Apprendre : carnets de leçons.
  route('GET', '/learning', async (c) => {
    const user = await currentUser(c)
    const items = await db.learningEntry.findMany({ where: { userId: user.id }, orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }], select: { id: true, lessonId: true, passion: true, title: true, completed: true, mastered: true, review: true, updatedAt: true, work: true } })
    return { items: items.map((entry: Any) => learningDTO(entry, false)) }
  })
  route('GET', '/learning/:id', async (c) => {
    const user = await currentUser(c)
    const item = await db.learningEntry.findFirst({ where: { id: c.params.id, userId: user.id } })
    if (!item) throw new ApiError(404, 'not_found', 'Carnet introuvable.')
    return learningDTO(withoutOwner(item))
  })
  route('PATCH', '/learning/:id/review', async (c) => {
    const user = await currentUser(c)
    if (typeof c.body.review !== 'boolean') throw badRequest('Statut de révision invalide.')
    const entry = await db.learningEntry.findFirst({ where: { id: c.params.id, userId: user.id } })
    if (!entry) throw new ApiError(404, 'not_found', 'Carnet introuvable.')
    if (!entry.completed) throw new ApiError(409, 'invalid_request', 'Conserve ton essai avant de modifier son statut de révision.')
    const updated = await db.learningEntry.update({ where: { id: entry.id }, data: { review: c.body.review } })
    return learningDTO(withoutOwner(updated))
  })
  route('PUT', '/learning/:id', async (c) => {
    const user = await currentUser(c)
    const id = c.params.id!
    const lesson = learningLesson(String(c.body.lessonId))
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(id) || !lesson) throw badRequest('Leçon ou identifiant invalide.')
    let checked
    try { checked = validateLearning(lesson.id, c.body.work) } catch (error) { throw badRequest((error as Error).message) }
    const stored = JSON.stringify(checked.work)
    const existing = await db.learningEntry.findUnique({ where: { id } })
    if (existing && existing.userId !== user.id) throw new ApiError(404, 'not_found', 'Carnet introuvable.')
    if (existing && existing.lessonId !== lesson.id) throw badRequest('Ce carnet appartient à une autre leçon.')
    if (existing?.completed && existing.work !== stored) throw new ApiError(409, 'already_completed', 'Cet essai est déjà conservé. Commence un nouvel essai.')
    const data = { lessonId: lesson.id, passion: lesson.passion, title: lesson.title, work: stored, completed: checked.work.completed, mastered: checked.mastered, review: checked.work.review }
    let entry = existing
    if (!existing) {
      try { entry = await db.learningEntry.create({ data: { id, userId: user.id, ...data } }) } catch (error) {
        if ((error as { code?: string }).code === 'P2002') throw new ApiError(409, 'already_completed', 'Cet identifiant est déjà utilisé. Recharge ton carnet.')
        throw error
      }
    } else if (!existing.completed) {
      const updated = await db.learningEntry.updateMany({ where: { id, userId: user.id, lessonId: lesson.id, completed: false }, data })
      if (!updated.count) throw new ApiError(409, 'already_completed', 'Cet essai vient d’être conservé. Recharge ton carnet.')
      entry = await db.learningEntry.findUniqueOrThrow({ where: { id } })
    }
    if (!entry) throw new ApiError(404, 'not_found', 'Carnet introuvable.')
    return learningDTO(withoutOwner(entry))
  })

  // Profil.
  route('GET', '/me', async (c) => {
    const before = await db.user.findUnique({ where: { id: BigInt(LOCAL_USER.id) }, select: { lastSeenAt: true } })
    const user = await currentUser(c)
    if (!before || now().getTime() - before.lastSeenAt.getTime() > SESSION_GAP_MS) await recordEvent(db, user, 'open', undefined, now())
    const [stats, open, projects] = await Promise.all([getStats(db, user, now()), findOpenProposal(db, user, now()), listProjects(db, user, photoUrl as Any)])
    const body: MeResponse = {
      user: toUserDTO(user),
      stats,
      openProposal: open ? toProposalDTO(open) : null,
      serverTime: now().toISOString(),
      botUsername: null,
      projects,
      shop: await getShop(db, user.id, []),
    }
    return body
  })

  // Boutique.
  route('GET', '/shop', async (c) => getShop(db, (await currentUser(c)).id, []))
  route('POST', '/shop/test-credit', async (c) => claimShopTestCredit(db, (await currentUser(c)).id, []))
  route('POST', '/shop/codes', async (c) => redeemSkinCode(db, (await currentUser(c)).id, c.body.code, []))
  route('POST', '/shop/purchases', async (c) => buyItem(db, (await currentUser(c)).id, c.body.itemId, []))
  route('PUT', '/shop/equipment', async (c) => equipItem(db, (await currentUser(c)).id, c.body.category, c.body.itemId, []))
  route('GET', '/shop/piano/:id', async (c) => ({ melody: await bonusMelody(db, (await currentUser(c)).id, c.params.id!) }))

  route('PUT', '/me/passions', async (c) => {
    const passions = normalizePassions(c.body.passions)
    if (!passions) throw badRequest('Choisis au moins une passion.')
    const user = await currentUser(c)
    return { user: toUserDTO(await db.user.update({ where: { id: user.id }, data: { passions: JSON.stringify(passions) } })) }
  })
  route('PUT', '/me/theme', async (c) => {
    const theme = c.body.theme
    if (!isAppTheme(theme)) throw badRequest('Thème inconnu.')
    const user = await currentUser(c)
    return { user: toUserDTO(await db.user.update({ where: { id: user.id }, data: { theme } })) }
  })
  route('PUT', '/me/settings', async (c) => {
    const { remindersEnabled, scrollMoment, reminderTime, tutorialCompleted } = c.body
    if (remindersEnabled !== undefined && typeof remindersEnabled !== 'boolean') throw badRequest('Réglage inconnu.')
    if (scrollMoment !== undefined && !isScrollMoment(scrollMoment)) throw badRequest('Moment inconnu.')
    if (reminderTime !== undefined && !isReminderTime(reminderTime)) throw badRequest('Heure de rappel invalide.')
    if (tutorialCompleted !== undefined && tutorialCompleted !== true) throw badRequest('Tutoriel inconnu.')
    if (remindersEnabled === undefined && scrollMoment === undefined && reminderTime === undefined && tutorialCompleted === undefined) throw badRequest('Réglage inconnu.')
    const user = await currentUser(c)
    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        ...(remindersEnabled !== undefined ? { remindersEnabled, ...(remindersEnabled ? { unansweredReminders: 0 } : {}) } : {}),
        ...(scrollMoment !== undefined ? { scrollMoment, reminderTime: null } : {}),
        ...(reminderTime !== undefined ? { reminderTime } : {}),
        ...(tutorialCompleted === true ? { tutorialCompleted: true } : {}),
      },
    })
    return { user: toUserDTO(updated) }
  })
  route('PUT', '/me/skills', async (c) => {
    const { passion, level } = c.body
    if (!isPassionId(passion) || !asksSkill(passion)) throw badRequest('Cette passion ne demande pas de niveau.')
    if (!isSkillLevel(level)) throw badRequest('Niveau inconnu.')
    const user = await currentUser(c)
    const skills = { ...parseSkills(user.skills), [passion]: level }
    return { user: toUserDTO(await db.user.update({ where: { id: user.id }, data: { skills: JSON.stringify(skills) } })) }
  })
  route('DELETE', '/me', async () => {
    const refs = await deleteUserData(db, BigInt(LOCAL_USER.id))
    await Promise.all(refs.map((ref) => photos.remove(ref).catch(() => {})))
    return { status: 204 }
  })

  // Avis et suivi d'usage : gardés sur le téléphone.
  route('POST', '/feedback', async (c) => {
    await saveFeedback(db, await currentUser(c), { message: c.body.message, context: c.body.context, source: 'app' })
    return { status: 201, body: { ok: true } }
  })
  route('POST', '/events', async (c) => {
    const { name, data } = c.body
    if (!isAppEventName(name)) throw badRequest('Événement inconnu.')
    await recordEvent(db, await currentUser(c), name, cleanEventData(data), now())
    return { status: 204 }
  })

  // Atelier personnalisé.
  route('PUT', '/me/atelier', async (c) => {
    const user = await currentUser(c)
    const v = c.body as Any
    if (!v || !ATELIER_AMBIANCES.includes(v.ambiance) || !ATELIER_FRAMES.includes(v.frames) || !ATELIER_DECORS.includes(v.decor) || typeof v.mascot !== 'boolean') throw badRequest('Personnalisation de l’atelier invalide.')
    if (v.notebook !== undefined && (!v.notebook || typeof v.notebook.title !== 'string' || v.notebook.title.trim().length < 1 || v.notebook.title.length > 60 || !['violet', 'lavande', 'sauge'].includes(v.notebook.color) || !['avion', 'etoile', 'aucun'].includes(v.notebook.motif))) throw badRequest('Couverture du carnet invalide.')
    if (v.exposed !== undefined) {
      if (!Array.isArray(v.exposed) || v.exposed.length > 12 || v.exposed.some((id: unknown) => typeof id !== 'string' || id.length > 100)) throw badRequest('Sélection de créations invalide.')
      const ids = [...new Set(v.exposed)] as string[]
      const count = await db.completion.count({ where: { id: { in: ids }, userId: user.id } })
      if (count !== ids.length) throw badRequest('Une création sélectionnée est introuvable.')
    }
    const appearance = parseAtelierAppearance({ ...parseAtelierAppearance(user.atelierAppearance), ...v })
    return { user: toUserDTO(await db.user.update({ where: { id: user.id }, data: { atelierAppearance: JSON.stringify(appearance) } })) }
  })

  // Activités.
  route('POST', '/drawing/suggestions', async (c) => {
    const { duration, style, recent } = c.body as Any
    if (!DURATIONS.includes(duration) || !isDrawingStyle(style)) throw badRequest('Style ou durée invalide.')
    if (recent !== undefined && (!Array.isArray(recent) || recent.length > 135 || recent.some((id: unknown) => typeof id !== 'string' || id.length > 80))) throw badRequest('Historique invalide.')
    const user = await currentUser(c)
    const done = await db.completion.findMany({ where: { userId: user.id, passion: 'dessin' }, select: { activityId: true } })
    return { items: drawingSuggestions(duration, style, done.map((row: Any) => row.activityId), recent ?? [], Math.random) }
  })
  route('POST', '/proposals', async (c) => {
    const { passion, mood, duration, replacing, step, quiet, external } = c.body
    if (!isPassionId(passion) || (mood !== undefined && !isMoodId(mood)) || !DURATIONS.includes(duration as Duration)) throw badRequest('Passion, mood ou temps invalide.')
    if (replacing !== undefined && typeof replacing !== 'string') throw badRequest('Proposition à remplacer invalide.')
    if (step !== undefined && typeof step !== 'string') throw badRequest('Étape de parcours invalide.')
    const user = await currentUser(c)
    if (external !== undefined && typeof external !== 'boolean') throw badRequest('Mode de réalisation invalide.')
    if (quiet !== undefined && typeof quiet !== 'boolean') throw badRequest('Option « sans son » invalide.')
    const proposal = await createProposal(db, user, { passion, mood: isMoodId(mood) ? mood : undefined, duration: duration as Duration, replacing, step, quiet, external: external as boolean | undefined }, { random: Math.random, now: now() })
    return { status: 201, body: { proposal: toProposalDTO(proposal), serverTime: now().toISOString() } }
  })
  route('POST', '/me/guides/:id', async (c) => {
    const id = c.params.id!
    if (!isDiscoveryGuide(id)) throw badRequest('Guide inconnu.')
    const user = await currentUser(c)
    const latest = await db.user.findUniqueOrThrow({ where: { id: user.id } })
    const updated = await db.user.update({ where: { id: user.id }, data: { completedGuides: JSON.stringify([...new Set([...parseDiscoveryGuides(latest.completedGuides), id])]) } })
    return { user: toUserDTO(updated) }
  })
  route('GET', '/proposals/saved', async (c) => ({ items: (await listSavedProposals(db, await currentUser(c))).map(toProposalDTO), serverTime: now().toISOString() }))
  route('POST', '/proposals/:id/session', async (c) => {
    const action = c.body.action
    if (action !== 'pause' && action !== 'resume') throw badRequest('Action de séance invalide.')
    const proposal = await updateSession(db, await currentUser(c), c.params.id!, action, now())
    return { proposal: toProposalDTO(proposal), serverTime: now().toISOString() }
  })

  route('POST', '/completions', async (c) => {
    const fields = c.body
    if (typeof fields.proposalId !== 'string' || fields.proposalId.length === 0) throw badRequest('Proposition manquante.')
    if (fields.external !== undefined && fields.external !== true && fields.external !== false && fields.external !== 'true' && fields.external !== 'false') throw badRequest('Mode de réalisation invalide.')
    const user = await currentUser(c)
    const completion = await completeProposal(db, photos as Any, user, {
      proposalId: fields.proposalId,
      external: fields.external === true || fields.external === 'true',
      text: typeof fields.text === 'string' ? fields.text : undefined,
      exploredTitle: typeof fields.exploredTitle === 'string' ? fields.exploredTitle : undefined,
      sport: fields.sport,
      workshop: fields.workshop,
      played: fields.played === true || fields.played === 'true',
      photo: c.file ? ({ buffer: c.file, mimetype: c.file.type } as Any) : undefined,
      projectId: typeof fields.projectId === 'string' && fields.projectId ? fields.projectId : undefined,
    }, now())
    return { status: 201, body: { completion: toCompletionDTO(completion, photoUrl as Any), coinsEarned: completion.coins, stats: await getStats(db, user, now()) } }
  })
  route('GET', '/completions', async (c) => {
    const user = await currentUser(c)
    const limit = Math.min(50, Math.max(1, Number.parseInt(c.query.get('limit') ?? '20', 10) || 20))
    const cursor = c.query.get('cursor') || undefined
    const passionParam = c.query.get('passion')
    const passion = isPassionId(passionParam) ? passionParam : undefined
    const page = await listCompletions(db, user, { cursor, limit, passion })
    return { items: page.items.map((item: Any) => toCompletionDTO(item, photoUrl as Any)), nextCursor: page.nextCursor }
  })
  route('PATCH', '/completions/:id/creation', async (c) => {
    const user = await currentUser(c)
    const id = c.params.id!
    const item = await db.completion.findFirst({ where: { id, userId: user.id } })
    if (!item) throw new ApiError(404, 'not_found', 'Création introuvable.')
    const text = c.body.text
    if (text !== undefined && (typeof text !== 'string' || !text.trim() || text.length > 6000)) throw badRequest('Le texte doit contenir entre 1 et 6000 caractères.')
    if (!c.file && text === undefined) throw badRequest('Ajoute un texte ou une photo.')
    if (c.file && (item.passion !== 'dessin' || item.photoRef)) throw badRequest('Cette séance ne peut pas recevoir de nouvelle photo.')
    if (text !== undefined && item.text) throw badRequest('Cette séance contient déjà un texte. Il est conservé sans modification.')
    let photoRef: string | undefined
    try {
      if (c.file) photoRef = await photos.save({ buffer: c.file, mimetype: c.file.type })
      const updated = await db.completion.updateMany({ where: { id, userId: user.id, ...(c.file ? { photoRef: null } : {}), ...(text !== undefined ? { text: null } : {}) }, data: { ...(text !== undefined ? { text: (text as string).trim() } : {}), ...(photoRef ? { photoRef, photoPending: false } : {}) } })
      if (updated.count !== 1) throw badRequest('Un souvenir a déjà été ajouté. Réouvre cette séance.')
    } catch (error) {
      if (photoRef) await photos.remove(photoRef).catch(() => {})
      throw error
    }
    return { completion: toCompletionDTO(await db.completion.findUniqueOrThrow({ where: { id } }), photoUrl as Any) }
  })
  route('GET', '/completions/:id', async (c) => {
    const user = await currentUser(c)
    const item = await db.completion.findFirst({ where: { id: c.params.id, userId: user.id } })
    if (!item) throw new ApiError(404, 'not_found', 'Création introuvable.')
    return { completion: toCompletionDTO(item, photoUrl as Any) }
  })
  route('PUT', '/completions/:id/rating', async (c) => ({ completion: toCompletionDTO(await rateCompletion(db, await currentUser(c), c.params.id!, c.body.rating), photoUrl as Any) }))
  route('PUT', '/completions/:id/project', async (c) => {
    const user = await currentUser(c)
    const completion = await assignProject(db, user, c.params.id!, c.body.projectId ?? null)
    return { completion: toCompletionDTO(completion, photoUrl as Any), projects: await listProjects(db, user, photoUrl as Any) }
  })

  // Progression et projets.
  route('GET', '/passions/:passion', async (c) => {
    const passion = c.params.passion
    if (!isPassionId(passion)) throw badRequest('Passion inconnue.')
    return passionDetail(db, await currentUser(c), passion, photoUrl as Any)
  })
  route('GET', '/projects', async (c) => ({ projects: await listProjects(db, await currentUser(c), photoUrl as Any) }))
  route('POST', '/projects', async (c) => {
    const user = await currentUser(c)
    const project = await createProject(db, user, c.body, now())
    return { status: 201, body: await projectDetail(db, user, project.id, photoUrl as Any) }
  })
  route('GET', '/projects/:id', async (c) => projectDetail(db, await currentUser(c), c.params.id!, photoUrl as Any))
  route('PATCH', '/projects/:id', async (c) => {
    const user = await currentUser(c)
    const project = await updateProject(db, user, c.params.id!, c.body, now())
    return projectDetail(db, user, project.id, photoUrl as Any)
  })
  route('DELETE', '/projects/:id', async (c) => {
    await deleteProject(db, await currentUser(c), c.params.id!)
    return { status: 204 }
  })

  /* --------------------------------------------- exécution d'une requête */

  const json = (status: number, body: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body, (_key, value) => (typeof value === 'bigint' ? value.toString() : value)), {
      status,
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    })

  // Une requête à la fois : la base reste cohérente (comme les transactions du serveur).
  let queue: Promise<unknown> = Promise.resolve()

  async function handle(input: string, init: RequestInit = {}): Promise<Response> {
    const url = new URL(input, 'https://scroll-up.local')
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const method = (init.method ?? 'GET').toUpperCase()
    const headers = new Headers(init.headers)
    const context: Context = { params: {}, query: url.searchParams, body: {}, timezone: headers.get('X-Timezone') ?? undefined }

    if (init.body instanceof FormData) {
      for (const [key, value] of init.body.entries()) {
        if (typeof value === 'string') context.body[key] = value
        else if (key === 'photo') context.file = value
      }
      if (context.file && (!PHOTO_TYPES.test(context.file.type) || context.file.size > MAX_PHOTO_BYTES)) {
        return json(400, { error: { code: 'invalid_request', message: context.file.size > MAX_PHOTO_BYTES ? 'Photo trop lourde (10 Mo au maximum).' : 'Photo illisible.' } } satisfies ApiErrorBody)
      }
    } else if (typeof init.body === 'string' && init.body) {
      try { context.body = JSON.parse(init.body) as Body } catch { return json(400, { error: { code: 'invalid_request', message: 'Requête illisible.' } } satisfies ApiErrorBody) }
      if (!context.body || typeof context.body !== 'object') context.body = {}
    }

    for (const candidate of routes) {
      if (candidate.method !== method) continue
      const match = candidate.pattern.exec(path)
      if (!match) continue
      candidate.keys.forEach((key, index) => { context.params[key] = decodeURIComponent(match[index + 1]!) })
      try {
        const result = (await candidate.handler(context)) as Result & Record<string, unknown>
        const wrapped = result && typeof result === 'object' && ('status' in result) && Object.keys(result).every((key) => key === 'status' || key === 'body')
        return wrapped ? json(result.status ?? 200, result.body) : json(200, result)
      } catch (error) {
        if (error instanceof ApiError) return json(error.status, { error: { code: error.code, message: error.message } } satisfies ApiErrorBody)
        console.error('[hors ligne]', error)
        return json(500, { error: { code: 'internal', message: 'Oups, quelque chose s’est mal passé.' } } satisfies ApiErrorBody)
      } finally {
        if (prisma.dirty) {
          prisma.dirty = false
          await saveTables(prisma.tables).catch((error) => console.error('[hors ligne] Sauvegarde impossible', error))
        }
      }
    }
    return json(404, { error: { code: 'not_found', message: 'Route inconnue' } } satisfies ApiErrorBody)
  }

  return (input: string, init?: RequestInit): Promise<Response> => {
    const next = queue.then(() => handle(input, init))
    queue = next.catch(() => undefined)
    return next
  }
}
