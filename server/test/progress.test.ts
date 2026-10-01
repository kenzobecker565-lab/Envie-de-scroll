import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  pathsFor,
  type CompleteResponse,
  type MeResponse,
  type PassionDetailResponse,
  type ProjectDetailResponse,
  type ProposalResponse,
} from '@scroll-up/shared'
import type { PrismaClient } from '../src/db.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { globalStats, personalStats } from '../src/services/feedback.ts'
import { createTestDatabase, TEST_BOT_TOKEN, testClock } from './helpers.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let clock: ReturnType<typeof testClock>
let app: ReturnType<typeof createApp>

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')

beforeEach(() => {
  const database = createTestDatabase()
  prisma = database.prisma
  cleanup = database.cleanup
  clock = testClock()
  app = createApp({
    prisma,
    config: { botToken: TEST_BOT_TOKEN, devAuth: true, initDataMaxAge: 0, signingSecret: 'secret-de-test', appDistDir: undefined },
    photos: createPhotoService({ telegram: undefined, storageChatId: undefined, localDir: `${database.dir}/photos` }),
    now: clock.now,
  })
})

afterEach(async () => {
  await cleanup()
})

const as = (id = 42) => ({ Authorization: `dev ${id}`, 'X-Timezone': 'Europe/Paris' })

async function onboard(passions: string[]) {
  await request(app).put('/api/me/passions').set(as()).send({ passions }).expect(200)
}

async function propose(body: object, status = 201) {
  const response = await request(app).post('/api/proposals').set(as()).send(body).expect(status)
  return response.body as ProposalResponse & { error?: { code: string; message: string } }
}

/** Écrit un texte pour une proposition (Écriture : validation immédiate). */
async function write(proposalId: string, text: string, extra: object = {}) {
  const response = await request(app).post('/api/completions').set(as()).send({ proposalId, text, ...extra }).expect(201)
  return response.body as CompleteResponse
}

async function me() {
  return (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
}

describe('parcours', () => {
  it('débloque les étapes une à une, sans « Une autre idée »', async () => {
    await onboard(['ecriture'])
    const [path] = pathsFor('ecriture')
    const [step1, step2] = path!.steps

    // L'étape 2 attend la 1.
    const locked = await propose({ passion: 'ecriture', mood: 'souffler', duration: step2!.duration, step: step2!.id }, 409)
    expect(locked.error?.code).toBe('locked')
    // Mauvaise durée, ou « Une autre idée » : refusés.
    await propose({ passion: 'ecriture', mood: 'souffler', duration: 30, step: step1!.id }, 400)

    const first = await propose({ passion: 'ecriture', mood: 'souffler', duration: step1!.duration, step: step1!.id })
    expect(first.proposal.activityId).toBe(step1!.id)
    expect(first.proposal.text).toBe(step1!.text)
    await propose({ passion: 'ecriture', mood: 'souffler', duration: step1!.duration, step: step1!.id, replacing: first.proposal.id }, 400)
    const done = await write(first.proposal.id, 'Je me souviens de la mer.')
    expect(done.completion.activityText).toBe(step1!.text)
    expect(done.stats.byPassion[0]).toMatchObject({ steps: [step1!.id], tried: [], minutes: 5 })

    // Puis l'étape 2 s'ouvre.
    const second = await propose({ passion: 'ecriture', mood: 'souffler', duration: step2!.duration, step: step2!.id })
    expect(second.proposal.activityId).toBe(step2!.id)
  })

  it('ouvre le parcours confirmé au niveau 3 de la passion', async () => {
    await onboard(['ecriture'])
    const confirmed = pathsFor('ecriture')[1]!.steps[0]!
    await propose({ passion: 'ecriture', mood: 'ennui', duration: confirmed.duration, step: confirmed.id }, 409)
    // 120 minutons d'écriture : niveau 3.
    for (let i = 0; i < 4; i++) {
      const { proposal } = await propose({ passion: 'ecriture', mood: 'ennui', duration: 30 })
      await write(proposal.id, `Texte ${i}`)
    }
    await propose({ passion: 'ecriture', mood: 'ennui', duration: confirmed.duration, step: confirmed.id })
  })
})

describe('projets', () => {
  it('range des créations dans un projet, avec un objectif, jusqu’à le terminer', async () => {
    await onboard(['ecriture', 'dessin'])
    await request(app).post('/api/projects').set(as()).send({ passion: 'cinema', name: 'Hors profil' }).expect(400)
    await request(app).post('/api/projects').set(as()).send({ passion: 'ecriture', name: '   ' }).expect(400)
    await request(app).post('/api/projects').set(as()).send({ passion: 'ecriture', name: 'Trop', goal: 0 }).expect(400)

    const created = (await request(app).post('/api/projects').set(as()).send({ passion: 'ecriture', name: '  Ma   nouvelle ', goal: 3 }).expect(201)).body as ProjectDetailResponse
    expect(created.project).toMatchObject({ name: 'Ma nouvelle', passion: 'ecriture', goal: 3, creations: 0, finishedAt: null })
    const projectId = created.project.id

    // Rangée dès la validation…
    const { proposal } = await propose({ passion: 'ecriture', mood: 'ennui', duration: 15 })
    const done = await write(proposal.id, 'Un deux trois quatre.', { projectId })
    expect(done.completion.projectId).toBe(projectId)
    // … ou après coup.
    const other = await propose({ passion: 'ecriture', mood: 'ennui', duration: 5 })
    const second = await write(other.proposal.id, 'Cinq six.')
    const assigned = await request(app).put(`/api/completions/${second.completion.id}/project`).set(as()).send({ projectId }).expect(200)
    expect(assigned.body.projects[0]).toMatchObject({ creations: 2, minutes: 20, words: 6 })

    // Pas dans un projet d'une autre passion.
    const drawing = (await request(app).post('/api/projects').set(as()).send({ passion: 'dessin', name: 'Croquis' }).expect(201)).body as ProjectDetailResponse
    await request(app).put(`/api/completions/${second.completion.id}/project`).set(as()).send({ projectId: drawing.project.id }).expect(400)

    const detail = (await request(app).get(`/api/projects/${projectId}`).set(as()).expect(200)).body as ProjectDetailResponse
    expect(detail.items.map((item) => item.text)).toEqual(['Un deux trois quatre.', 'Cinq six.'])
    expect((await me()).projects).toHaveLength(2)

    // Terminé : plus rien ne s'y range, jusqu'à ce qu'on le rouvre.
    const finished = (await request(app).patch(`/api/projects/${projectId}`).set(as()).send({ finished: true }).expect(200)).body as ProjectDetailResponse
    expect(finished.project.finishedAt).not.toBeNull()
    const third = await propose({ passion: 'ecriture', mood: 'ennui', duration: 5 })
    await request(app).post('/api/completions').set(as()).send({ proposalId: third.proposal.id, text: 'Encore.', projectId }).expect(409)

    // Supprimé : les créations restent dans la galerie.
    await request(app).delete(`/api/projects/${projectId}`).set(as()).expect(204)
    const left = await prisma.completion.findMany({ where: { userId: 42n } })
    expect(left).toHaveLength(2)
    expect(left.every((row) => row.projectId === null)).toBe(true)
  })

  it('ne montre ni ne modifie le projet d’un autre', async () => {
    await onboard(['ecriture'])
    const created = (await request(app).post('/api/projects').set(as()).send({ passion: 'ecriture', name: 'À moi' }).expect(201)).body as ProjectDetailResponse
    await request(app).get(`/api/projects/${created.project.id}`).set(as(7)).expect(404)
    await request(app).patch(`/api/projects/${created.project.id}`).set(as(7)).send({ finished: true }).expect(404)
    await request(app).delete(`/api/projects/${created.project.id}`).set(as(7)).expect(404)
  })
})

describe('signature d’une passion', () => {
  it('donne le premier et le dernier dessin, le texte le plus long et les titres explorés', async () => {
    await onboard(['dessin', 'ecriture', 'musique'])
    for (let i = 0; i < 3; i++) {
      const { proposal } = await propose({ passion: 'dessin', mood: 'ennui', duration: 5 })
      await request(app).post('/api/completions').set(as()).field('proposalId', proposal.id).attach('photo', PNG, { filename: 'd.png', contentType: 'image/png' }).expect(201)
      clock.advanceMinutes(1)
    }
    const drawing = (await request(app).get('/api/passions/dessin').set(as()).expect(200)).body as PassionDetailResponse
    expect(drawing.firstDrawing?.photoUrl).toBeTruthy()
    expect(drawing.lastDrawing?.id).not.toBe(drawing.firstDrawing?.id)

    for (const text of ['Court.', 'Un texte un peu plus long que le premier.']) {
      const { proposal } = await propose({ passion: 'ecriture', mood: 'ennui', duration: 5 })
      await write(proposal.id, text)
    }
    const writing = (await request(app).get('/api/passions/ecriture').set(as()).expect(200)).body as PassionDetailResponse
    expect(writing.longestText?.words).toBe(9)

    const { proposal } = await propose({ passion: 'musique', mood: 'ennui', duration: 5 })
    clock.advanceMinutes(5)
    await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id, exploredTitle: 'Kind of Blue' }).expect(201)
    const music = (await request(app).get('/api/passions/musique').set(as()).expect(200)).body as PassionDetailResponse
    expect(music.titles.map((row) => row.title)).toEqual(['Kind of Blue'])
    await request(app).get('/api/passions/peinture').set(as()).expect(400)

    const stats = (await me()).stats.byPassion
    expect(stats.find((row) => row.passion === 'dessin')).toMatchObject({ drawings: 3 })
    expect(stats.find((row) => row.passion === 'ecriture')).toMatchObject({ words: 10 })
    expect(stats.find((row) => row.passion === 'musique')).toMatchObject({ explored: 1 })
  })
})

describe('statistiques', () => {
  it('compte les étapes de parcours et les projets', async () => {
    await onboard(['ecriture'])
    const step = pathsFor('ecriture')[0]!.steps[0]!
    const { proposal } = await propose({ passion: 'ecriture', mood: 'ennui', duration: step.duration, step: step.id })
    await write(proposal.id, 'Je me souviens.')
    await request(app).post('/api/projects').set(as()).send({ passion: 'ecriture', name: 'Carnet' }).expect(201)

    const stats = await globalStats(prisma, clock.now())
    expect(stats).toContain('Parcours : 1 étape réussie, 0 parcours terminé')
    expect(stats).toContain('Projets : 1 créé, 0 terminé')
    const user = await prisma.user.findUniqueOrThrow({ where: { id: 42n } })
    const mine = await personalStats(prisma, user)
    expect(mine).toContain('Parcours « Premières pages » : étape 1/6')
    expect(mine).toContain('Tes projets : 1 en cours, 0 terminé')
  })
})
