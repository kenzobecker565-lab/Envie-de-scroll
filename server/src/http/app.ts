/**
 * ============================================================================
 *  API REST consommée par la Mini App
 * ============================================================================
 *
 *   GET  /api/health             état du serveur (sans authentification)
 *   GET  /api/me                 profil, statistiques, activité à reprendre
 *   PUT  /api/me/passions        choix des passions (1 à 3)
 *   PUT  /api/me/theme           choix du thème de l'app
 *   POST /api/proposals          tirer une activité (ou « Une autre idée »)
 *   POST /api/completions        valider une activité (JSON, ou multipart avec une photo)
 *   GET  /api/completions        la galerie, de la plus récente à la plus ancienne
 *   GET  /api/photos/:id         une photo de dessin (adresse signée)
 *
 * Authentification : en-tête `Authorization: tma <initData>` (voir auth/).
 */

import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import express, { type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from 'express'
import multer from 'multer'
import {
  DURATIONS,
  isAppTheme,
  isMoodId,
  isPassionId,
  MAX_PHOTO_BYTES,
  normalizePassions,
  type ApiErrorBody,
  type CompleteResponse,
  type CompletionsPage,
  type Duration,
  type MeResponse,
  type ProposalResponse,
  type UserResponse,
} from '@scroll-up/shared'
import type { Config } from '../config.ts'
import type { PrismaClient, User } from '../db.ts'
import { type TelegramUser, InitDataError, validateInitData } from '../auth/initData.ts'
import { signedPhotoUrl, verifyPhotoSignature, type PhotoService } from '../photos/photos.ts'
import { completeProposal, listCompletions, toCompletionDTO } from '../services/completions.ts'
import { createProposal, findOpenProposal, toProposalDTO } from '../services/proposals.ts'
import { getStats, toUserDTO, upsertFromTelegram } from '../services/users.ts'
import { ApiError, badRequest } from './errors.ts'

export interface AppDeps {
  prisma: PrismaClient
  config: Pick<Config, 'botToken' | 'devAuth' | 'initDataMaxAge' | 'signingSecret' | 'appDistDir'>
  photos: PhotoService
  /** Middleware du webhook Telegram, monté avant l'API (mode webhook). */
  webhook?: { path: string; handler: RequestHandler }
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

export function createApp({ prisma, config, photos, webhook, now = () => new Date(), random = Math.random }: AppDeps) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', true)

  if (webhook) app.post(webhook.path, webhook.handler)

  const api = express.Router()
  api.use(express.json({ limit: '256kb' }))

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

  /* -------------------------------- Profil -------------------------------- */

  api.get(
    '/me',
    asyncRoute(async (req, res) => {
      const user = await currentUser(req, res)
      const [stats, open] = await Promise.all([getStats(prisma, user, now()), findOpenProposal(prisma, user, now())])
      const body: MeResponse = {
        user: toUserDTO(user),
        stats,
        openProposal: open ? toProposalDTO(open) : null,
        serverTime: now().toISOString(),
      }
      res.json(body)
    }),
  )

  api.put(
    '/me/passions',
    asyncRoute(async (req, res) => {
      const passions = normalizePassions((req.body as { passions?: unknown } | undefined)?.passions)
      if (!passions) throw badRequest('Choisis entre 1 et 3 passions.')
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

  /* ------------------------------ Activités ------------------------------- */

  api.post(
    '/proposals',
    asyncRoute(async (req, res) => {
      const { passion, mood, duration, replacing } = (req.body ?? {}) as Record<string, unknown>
      if (!isPassionId(passion) || !isMoodId(mood) || !DURATIONS.includes(duration as Duration)) {
        throw badRequest('Passion, mood ou temps invalide.')
      }
      if (replacing !== undefined && typeof replacing !== 'string') throw badRequest('Proposition à remplacer invalide.')
      const user = await currentUser(req, res)
      const proposal = await createProposal(prisma, user, { passion, mood, duration: duration as Duration, replacing }, { random, now: now() })
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
          photo: req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined,
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
      const page = await listCompletions(prisma, user, { cursor, limit })
      const body: CompletionsPage = { items: page.items.map((item) => toCompletionDTO(item, photoUrl)), nextCursor: page.nextCursor }
      res.json(body)
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
