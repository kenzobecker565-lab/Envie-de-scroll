/**
 * ============================================================================
 *  API REST consommée par la Mini App
 * ============================================================================
 *
 *   GET  /api/health             état du serveur (sans authentification)
 *   GET  /api/me                 profil, statistiques, activité à reprendre
 *   PUT  /api/me/passions        choix des passions (au moins une, sans limite)
 *   PUT  /api/me/theme           choix du thème de l'app
 *   POST /api/proposals          tirer une activité (ou « Une autre idée »), ou jouer une étape de parcours
 *   POST /api/completions        valider une activité (JSON, ou multipart avec une photo)
 *   GET  /api/completions        la galerie, de la plus récente à la plus ancienne
 *   PUT  /api/completions/:id/rating  la note d'une activité (après coup)
 *   PUT  /api/completions/:id/project ranger une création dans un projet (ou l'en sortir)
 *   GET  /api/passions/:passion  la signature d'une passion (avant / après, titres explorés…)
 *   GET  /api/projects           les projets ; POST : en créer un
 *   GET  /api/projects/:id       un projet et ses créations ; PATCH : le modifier ou le terminer ; DELETE
 *   GET  /api/photos/:id         une photo de dessin (adresse signée)
 *   PUT  /api/me/settings        réglages (relances du bot, moment de scroll)
 *   PUT  /api/me/skills          niveau dans une passion qui le demande (Piano)
 *   DELETE /api/me               effacer toutes ses données (retour à l'inscription)
 *   POST /api/feedback           un avis écrit (transmis aux admins dans Telegram)
 *   POST /api/events             un événement d'usage (suivi du test, sans texte libre)
 *
 * Authentification : en-tête `Authorization: tma <initData>` (voir auth/).
 */

import {learningLesson,validateLearning} from '@scroll-up/shared'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import express, { type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import multer from 'multer'
import {
  DURATIONS,
  isAppEventName,
  isAppTheme,
  isMoodId,
  isPassionId,
  isScrollMoment,
  isSkillLevel,
  asksSkill,
  parseSkills,
  MAX_PHOTO_BYTES,
  normalizePassions,
  type ApiErrorBody,
  type AssignProjectResponse,
  type CompleteResponse,
  type CompletionResponse,
  type CompletionsPage,
  type Duration,
  type MeResponse,
  type PassionDetailResponse,
  type ProjectDetailResponse,
  type ProjectsResponse,
  type ProposalResponse,
  type UserResponse,
} from '@scroll-up/shared'
import type { Config } from '../config.ts'
import type { PrismaClient, User } from '../db.ts'
import { type TelegramUser, InitDataError, validateInitData } from '../auth/initData.ts'
import { signedPhotoUrl, verifyPhotoSignature, type PhotoService } from '../photos/photos.ts'
import { completeProposal, listCompletions, toCompletionDTO } from '../services/completions.ts'
import { createProposal, findOpenProposal, toProposalDTO } from '../services/proposals.ts'
import { cleanEventData, rateCompletion, recordEvent, saveFeedback, type Notify } from '../services/feedback.ts'
import { assignProject, createProject, deleteProject, listProjects, passionDetail, projectDetail, updateProject } from '../services/projects.ts'
import { deleteUserData, getStats, toUserDTO, upsertFromTelegram } from '../services/users.ts'
import { getShop, buyItem, equipItem, bonusMelody, claimShopTestCredit } from '../services/shop.ts'
import { ApiError, badRequest } from './errors.ts'

export interface AppDeps {
  prisma: PrismaClient
  config: Pick<Config, 'botToken' | 'devAuth' | 'initDataMaxAge' | 'signingSecret' | 'appDistDir'> & Partial<Pick<Config, 'adminIds'>>
  photos: PhotoService
  /** Middleware du webhook Telegram, monté avant l'API (mode webhook). */
  webhook?: { path: string; handler: RequestHandler }
  /** Transmet un message aux admins dans Telegram (avis écrits). */
  notify?: Notify
  /** Identifiant du bot, une fois connu (liens d'invitation). */
  botUsername?: () => string | undefined
  /** Horloge et hasard injectables (tests). */
  now?: () => Date
  random?: () => number
}

interface AuthLocals {
  telegramUser: TelegramUser
}

/** Utilisateur Telegram authentifié par le middleware. */
function telegramUserOf(res: Response): TelegramUser {
  return (res.locals as AuthLocals).telegramUser
}

const asyncRoute =
  (handler: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next) => {
    handler(req, res).catch(next)
  }

/** Une nouvelle « séance » commence après une demi-heure sans ouvrir l'app. */
const SESSION_GAP_MS = 30 * 60_000

export function createApp({ prisma, config, photos, webhook, notify, botUsername, now = () => new Date(), random = Math.random }: AppDeps) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  if (webhook) app.post(webhook.path, webhook.handler)

  const api = express.Router()
  api.use(express.json({ limit: '1mb' }))

  api.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  /* --------------------------- Photos (signées) --------------------------- */

  api.get(
    '/photos/:id',
    asyncRoute(async (req, res) => {
      const id = String(req.params.id)
      if (!verifyPhotoSignature(id, String(req.query.e ?? ''), String(req.query.s ?? ''), config.signingSecret, now())) {
        throw new ApiError(403, 'unauthorized', 'Adresse de photo expirée')
      }
      const completion = await prisma.completion.findUnique({ where: { id }, select: { photoRef: true } })
      const photo = completion?.photoRef ? await photos.open(completion.photoRef) : null
      if (!photo) throw new ApiError(404, 'not_found', 'Photo introuvable')
      res.setHeader('Content-Type', photo.contentType)
      res.setHeader('Cache-Control', 'private, max-age=21600, immutable')
      await pipeline(photo.body, res)
    }),
  )

  /* --------------------------- Authentification --------------------------- */

  api.use((req: Request, res: Response, next: NextFunction) => {
    const header = req.get('authorization') ?? ''
    const [scheme, ...rest] = header.split(' ')
    const value = rest.join(' ').trim()
    try {
      if (scheme === 'tma' && value && config.botToken) {
        const { user } = validateInitData(value, config.botToken, { maxAgeSeconds: config.initDataMaxAge, now: now() })
        ;(res.locals as AuthLocals).telegramUser = user
        return next()
      }
      if (scheme === 'dev' && config.devAuth && /^\d{1,15}$/.test(value)) {
        ;(res.locals as AuthLocals).telegramUser = { id: Number(value), first_name: req.get('x-dev-first-name') ?? 'Camille' }
        return next()
      }
    } catch (error) {
      if (!(error instanceof InitDataError)) return next(error)
    }
    next(new ApiError(401, 'unauthorized', 'Ouvre l’app depuis Telegram pour continuer.'))
  })

  /** Charge (ou crée) l'utilisateur de la requête. */
  async function currentUser(req: Request, res: Response): Promise<User> {
    const timezone = req.get('x-timezone') ?? undefined
    return upsertFromTelegram(prisma, telegramUserOf(res), { timezone, now: now() })
  }

  const photoUrl = (completion: { id: string }) => signedPhotoUrl(completion.id, config.signingSecret, now())
  const learningDTO=(entry:{id:string;lessonId:string;passion:string;title:string;completed:boolean;mastered:boolean;review:boolean;updatedAt:Date;work?:string})=>({...entry,updatedAt:entry.updatedAt.toISOString(),...(entry.work?{work:JSON.parse(entry.work)}:{})})
  api.get('/learning',asyncRoute(async(req,res)=>{const user=await currentUser(req,res);const items=await prisma.learningEntry.findMany({where:{userId:user.id},orderBy:[{updatedAt:'desc'},{id:'desc'}],select:{id:true,lessonId:true,passion:true,title:true,completed:true,mastered:true,review:true,updatedAt:true}});res.json({items:items.map(learningDTO)})}))
  api.get('/learning/:id',asyncRoute(async(req,res)=>{const user=await currentUser(req,res);const item=await prisma.learningEntry.findFirst({where:{id:String(req.params.id),userId:user.id}});if(!item)throw new ApiError(404,'not_found','Carnet introuvable.');const {userId,createdAt,...entry}=item;res.json(learningDTO(entry))}))
  api.put('/learning/:id',asyncRoute(async(req,res)=>{
    const user=await currentUser(req,res),id=String(req.params.id),lesson=learningLesson(String(req.body?.lessonId));
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(id)||!lesson)throw badRequest('Leçon ou identifiant invalide.');
    let checked;try{checked=validateLearning(lesson.id,req.body.work)}catch(e){throw badRequest((e as Error).message)}
    const stored=JSON.stringify(checked.work),existing=await prisma.learningEntry.findUnique({where:{id}});
    if(existing&&existing.userId!==user.id)throw new ApiError(404,'not_found','Carnet introuvable.');
    if(existing&&existing.lessonId!==lesson.id)throw badRequest('Ce carnet appartient à une autre leçon.');
    if(existing?.completed&&existing.work!==stored)throw new ApiError(409,'already_completed','Cet essai est déjà conservé. Commence un nouvel essai.');
    const data={lessonId:lesson.id,passion:lesson.passion,title:lesson.title,work:stored,completed:checked.work.completed,mastered:checked.mastered,review:checked.work.review};
    let entry=existing;
    if(!existing){try{entry=await prisma.learningEntry.create({data:{id,userId:user.id,...data}})}catch(e){if((e as {code?:string}).code==='P2002')throw new ApiError(409,'already_completed','Cet identifiant est déjà utilisé. Recharge ton carnet.');throw e}}
    else if(!existing.completed){const updated=await prisma.learningEntry.updateMany({where:{id,userId:user.id,lessonId:lesson.id,completed:false},data});if(!updated.count)throw new ApiError(409,'already_completed','Cet essai vient d’être conservé. Recharge ton carnet.');entry=await prisma.learningEntry.findUniqueOrThrow({where:{id}})}
    if(!entry)throw new ApiError(404,'not_found','Carnet introuvable.');
    const {userId,createdAt,...dto}=entry;res.json(learningDTO(dto));
  }))


  /* -------------------------------- Profil -------------------------------- */

  api.get(
    '/me',
    asyncRoute(async (req, res) => {
      const before = await prisma.user.findUnique({ where: { id: BigInt(telegramUserOf(res).id) }, select: { lastSeenAt: true } })
      const user = await currentUser(req, res)
      if (!before || now().getTime() - before.lastSeenAt.getTime() > SESSION_GAP_MS) await recordEvent(prisma, user, 'open', undefined, now())
      const [stats, open, projects] = await Promise.all([getStats(prisma, user, now()), findOpenProposal(prisma, user, now()), listProjects(prisma, user, photoUrl)])
      const body: MeResponse = {
        user: toUserDTO(user),
        stats,
        openProposal: open ? toProposalDTO(open) : null,
        serverTime: now().toISOString(),
        botUsername: botUsername?.() ?? null,
        projects,
        shop: await getShop(prisma, user.id, config.adminIds),
      }
      res.json(body)
    }),
  )

  api.get('/shop', asyncRoute(async (req, res) => {
    const user = await currentUser(req, res)
    res.json(await getShop(prisma, user.id, config.adminIds))
  }))
  api.post('/shop/test-credit', asyncRoute(async (req, res) => {
    const user = await currentUser(req, res)
    res.json(await claimShopTestCredit(prisma, user.id, config.adminIds))
  }))
  api.post('/shop/purchases', asyncRoute(async (req, res) => {
    const user = await currentUser(req, res)
    res.json(await buyItem(prisma, user.id, req.body?.itemId, config.adminIds))
  }))
  api.put('/shop/equipment', asyncRoute(async (req, res) => {
    const user = await currentUser(req, res)
    res.json(await equipItem(prisma, user.id, req.body?.category, req.body?.itemId, config.adminIds))
  }))
  api.get('/shop/piano/:id', asyncRoute(async (req, res) => {
    const user = await currentUser(req, res)
    res.json({ melody: await bonusMelody(prisma, user.id, String(req.params.id)) })
  }))

  api.put(
    '/me/passions',
    asyncRoute(async (req, res) => {
      const passions = normalizePassions((req.body as { passions?: unknown } | undefined)?.passions)
      if (!passions) throw badRequest('Choisis au moins une passion.')
      const user = await currentUser(req, res)
      const updated = await prisma.user.update({ where: { id: user.id }, data: { passions: JSON.stringify(passions) } })
      const body: UserResponse = { user: toUserDTO(updated) }
      res.json(body)
    }),
  )

  api.put(
    '/me/theme',
    asyncRoute(async (req, res) => {
      const theme = (req.body as { theme?: unknown } | undefined)?.theme
      if (!isAppTheme(theme)) throw badRequest('Thème inconnu.')
      const user = await currentUser(req, res)
      const updated = await prisma.user.update({ where: { id: user.id }, data: { theme } })
      const body: UserResponse = { user: toUserDTO(updated) }
      res.json(body)
    }),
  )

  api.put(
    '/me/settings',
    asyncRoute(async (req, res) => {
      const { remindersEnabled, scrollMoment, tutorialCompleted } = (req.body ?? {}) as Record<string, unknown>
      if (remindersEnabled !== undefined && typeof remindersEnabled !== 'boolean') throw badRequest('Réglage inconnu.')
      if (scrollMoment !== undefined && !isScrollMoment(scrollMoment)) throw badRequest('Moment inconnu.')
      if (tutorialCompleted !== undefined && tutorialCompleted !== true) throw badRequest('Tutoriel inconnu.')
      if (remindersEnabled === undefined && scrollMoment === undefined && tutorialCompleted === undefined) throw badRequest('Réglage inconnu.')
      const user = await currentUser(req, res)
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(remindersEnabled !== undefined ? { remindersEnabled, ...(remindersEnabled ? { unansweredReminders: 0 } : {}) } : {}),
          ...(scrollMoment !== undefined ? { scrollMoment } : {}),
          ...(tutorialCompleted === true ? { tutorialCompleted: true } : {}),
        },
      })
      const body: UserResponse = { user: toUserDTO(updated) }
      res.json(body)
    }),
  )

  // Page « Ton niveau » : le niveau dans une passion qui le demande (Piano).
  api.put(
    '/me/skills',
    asyncRoute(async (req, res) => {
      const { passion, level } = (req.body ?? {}) as Record<string, unknown>
      if (!isPassionId(passion) || !asksSkill(passion)) throw badRequest('Cette passion ne demande pas de niveau.')
      if (!isSkillLevel(level)) throw badRequest('Niveau inconnu.')
      const user = await currentUser(req, res)
      const skills = { ...parseSkills(user.skills), [passion]: level }
      const updated = await prisma.user.update({ where: { id: user.id }, data: { skills: JSON.stringify(skills) } })
      const body: UserResponse = { user: toUserDTO(updated) }
      res.json(body)
    }),
  )

  // « Effacer mes données » (réglages) : tout part, la prochaine ouverture repart de l'inscription.
  api.delete(
    '/me',
    asyncRoute(async (_req, res) => {
      const refs = await deleteUserData(prisma, BigInt(telegramUserOf(res).id))
      await Promise.all(refs.map((ref) => photos.remove(ref).catch((error) => console.error('[photos]', error))))
      res.status(204).end()
    }),
  )

  /* --------------------------- Avis et suivi du test ---------------------------- */

  api.post(
    '/feedback',
    asyncRoute(async (req, res) => {
      const { message, context } = (req.body ?? {}) as Record<string, unknown>
      const user = await currentUser(req, res)
      await saveFeedback(prisma, user, { message, context, source: 'app' }, notify)
      res.status(201).json({ ok: true })
    }),
  )

  api.post(
    '/events',
    asyncRoute(async (req, res) => {
      const { name, data } = (req.body ?? {}) as Record<string, unknown>
      if (!isAppEventName(name)) throw badRequest('Événement inconnu.')
      const user = await currentUser(req, res)
      await recordEvent(prisma, user, name, cleanEventData(data), now())
      res.status(204).end()
    }),
  )

  /* ------------------------------ Activités ------------------------------- */

  api.post(
    '/proposals',
    asyncRoute(async (req, res) => {
      const { passion, mood, duration, replacing, step, quiet } = (req.body ?? {}) as Record<string, unknown>
      // L’humeur est facultative, y compris pour le parcours envie de scroller.
      if (!isPassionId(passion) || (mood !== undefined && !isMoodId(mood)) || !DURATIONS.includes(duration as Duration)) {
        throw badRequest('Passion, mood ou temps invalide.')
      }
      if (replacing !== undefined && typeof replacing !== 'string') throw badRequest('Proposition à remplacer invalide.')
      if (step !== undefined && typeof step !== 'string') throw badRequest('Étape de parcours invalide.')
      const user = await currentUser(req, res)
      if (quiet !== undefined && typeof quiet !== 'boolean') throw badRequest('Option « sans son » invalide.')
      const proposal = await createProposal(prisma, user, { passion, mood: isMoodId(mood) ? mood : undefined, duration: duration as Duration, replacing, step, quiet }, { random, now: now() })
      const body: ProposalResponse = { proposal: toProposalDTO(proposal), serverTime: now().toISOString() }
      res.status(201).json(body)
    }),
  )

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
    fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
  })

  api.post(
    '/completions',
    (req, res, next) => {
      upload.single('photo')(req, res, (error: unknown) => {
        if (error instanceof multer.MulterError) {
          next(badRequest(error.code === 'LIMIT_FILE_SIZE' ? 'Photo trop lourde (10 Mo au maximum).' : 'Photo illisible.'))
        } else next(error)
      })
    },
    asyncRoute(async (req, res) => {
      const fields = (req.body ?? {}) as Record<string, unknown>
      if (typeof fields.proposalId !== 'string' || fields.proposalId.length === 0) throw badRequest('Proposition manquante.')
      const user = await currentUser(req, res)
      const completion = await completeProposal(
        prisma,
        photos,
        user,
        {
          proposalId: fields.proposalId,
          text: typeof fields.text === 'string' ? fields.text : undefined,
          exploredTitle: typeof fields.exploredTitle === 'string' ? fields.exploredTitle : undefined,
          sport: fields.sport,
          workshop: fields.workshop,
          played: fields.played === true || fields.played === 'true',
          photo: req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined,
          projectId: typeof fields.projectId === 'string' && fields.projectId ? fields.projectId : undefined,
        },
        now(),
      )
      const body: CompleteResponse = {
        completion: toCompletionDTO(completion, photoUrl),
        coinsEarned: completion.coins,
        stats: await getStats(prisma, user, now()),
      }
      res.status(201).json(body)
    }),
  )

  api.get(
    '/completions',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit ?? '20'), 10) || 20))
      const cursor = typeof req.query.cursor === 'string' && req.query.cursor ? req.query.cursor : undefined
      const passion = isPassionId(req.query.passion) ? req.query.passion : undefined
      const page = await listCompletions(prisma, user, { cursor, limit, passion })
      const body: CompletionsPage = { items: page.items.map((item) => toCompletionDTO(item, photoUrl)), nextCursor: page.nextCursor }
      res.json(body)
    }),
  )

  api.get('/completions/:id',asyncRoute(async(req,res)=>{const user=await currentUser(req,res);const item=await prisma.completion.findFirst({where:{id:String(req.params.id),userId:user.id}});if(!item)throw new ApiError(404,'not_found','Création introuvable.');res.json({completion:toCompletionDTO(item,photoUrl)})}))

  api.put(
    '/completions/:id/rating',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const completion = await rateCompletion(prisma, user, String(req.params.id), (req.body as { rating?: unknown } | undefined)?.rating)
      const body: CompletionResponse = { completion: toCompletionDTO(completion, photoUrl) }
      res.json(body)
    }),
  )

  api.put(
    '/completions/:id/project',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const completion = await assignProject(prisma, user, String(req.params.id), (req.body as { projectId?: unknown } | undefined)?.projectId ?? null)
      const body: AssignProjectResponse = { completion: toCompletionDTO(completion, photoUrl), projects: await listProjects(prisma, user, photoUrl) }
      res.json(body)
    }),
  )

  /* ------------------------- Progression et projets ------------------------- */

  api.get(
    '/passions/:passion',
    asyncRoute(async (req, res) => {
      const passion = req.params.passion
      if (!isPassionId(passion)) throw badRequest('Passion inconnue.')
      const user = await currentUser(req, res)
      const body: PassionDetailResponse = await passionDetail(prisma, user, passion, photoUrl)
      res.json(body)
    }),
  )

  api.get(
    '/projects',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const body: ProjectsResponse = { projects: await listProjects(prisma, user, photoUrl) }
      res.json(body)
    }),
  )

  api.post(
    '/projects',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const project = await createProject(prisma, user, (req.body ?? {}) as Record<string, unknown>, now())
      const body: ProjectDetailResponse = await projectDetail(prisma, user, project.id, photoUrl)
      res.status(201).json(body)
    }),
  )

  api.get(
    '/projects/:id',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const body: ProjectDetailResponse = await projectDetail(prisma, user, String(req.params.id), photoUrl)
      res.json(body)
    }),
  )

  api.patch(
    '/projects/:id',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const project = await updateProject(prisma, user, String(req.params.id), (req.body ?? {}) as Record<string, unknown>, now())
      const body: ProjectDetailResponse = await projectDetail(prisma, user, project.id, photoUrl)
      res.json(body)
    }),
  )

  api.delete(
    '/projects/:id',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      await deleteProject(prisma, user, String(req.params.id))
      res.status(204).end()
    }),
  )

  api.use((_req, _res, next) => next(new ApiError(404, 'not_found', 'Route inconnue')))

  const errors: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ApiError) {
      const body: ApiErrorBody = { error: { code: error.code, message: error.message } }
      res.status(error.status).json(body)
      return
    }
    if ((error as { type?: string }).type === 'entity.parse.failed' || (error as { type?: string }).type === 'entity.too.large') {
      res.status(400).json({ error: { code: 'invalid_request', message: 'Requête illisible.' } } satisfies ApiErrorBody)
      return
    }
    console.error('[api]', error)
    if (res.headersSent) {
      res.end()
      return
    }
    res.status(500).json({ error: { code: 'internal', message: 'Oups, quelque chose s’est mal passé de notre côté.' } } satisfies ApiErrorBody)
  }
  api.use(errors)

  app.use('/api', api)

  /* -------------------- La Mini App (build de production) ------------------- */

  if (config.appDistDir) {
    const dist = config.appDistDir
    // Les fichiers de /assets ont une empreinte dans leur nom : cache long.
    app.use('/assets', express.static(path.join(dist, 'assets'), { maxAge: '1y', immutable: true }))
    app.use(express.static(dist, { index: false }))
    app.get(/.*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache')
      res.sendFile(path.join(dist, 'index.html'))
    })
  }

  return app
}
