import fs from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { AMBIANCES, type CompleteResponse, type CompletionsPage, type MeResponse, type ProposalResponse } from '@scroll-up/shared'
import type { PrismaClient } from '../src/db.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { attachBotPhoto } from '../src/services/completions.ts'
import { createTestDatabase, makeInitData, TEST_BOT_TOKEN, testClock } from './helpers.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let clock: ReturnType<typeof testClock>
let app: ReturnType<typeof createApp>

/** Petite image PNG (1 × 1 pixel). */
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

async function onboard(passions: string[], id = 42) {
  await request(app).put('/api/me/passions').set(as(id)).send({ passions }).expect(200)
}

async function propose(body: object, id = 42) {
  const response = await request(app).post('/api/proposals').set(as(id)).send(body).expect(201)
  return (response.body as ProposalResponse).proposal
}

describe('thème', () => {
  it('garde le thème choisi, et refuse un thème inconnu', async () => {
    const saved = await request(app).put('/api/me/theme').set(as()).send({ theme: 'memphis' }).expect(200)
    expect(saved.body.user.theme).toBe('memphis')
    const me = await request(app).get('/api/me').set(as()).expect(200)
    expect((me.body as MeResponse).user.theme).toBe('memphis')
    const refused = await request(app).put('/api/me/theme').set(as()).send({ theme: 'fluo' }).expect(400)
    expect(refused.body.error.message).toBe('Thème inconnu.')
    await request(app).put('/api/me/theme').set(as()).send({}).expect(400)
  })
})

describe('authentification', () => {
  it('refuse une requête sans initData', async () => {
    const response = await request(app).get('/api/me').expect(401)
    expect(response.body.error.code).toBe('unauthorized')
  })

  it('accepte des initData Telegram valides et crée l’utilisateur', async () => {
    const initData = makeInitData({ id: 5150, first_name: 'Sam', allows_write_to_pm: true })
    const response = await request(app).get('/api/me').set('Authorization', `tma ${initData}`).expect(200)
    const body = response.body as MeResponse
    expect(body.user).toEqual({ id: '5150', firstName: 'Sam', passions: [], onboarded: false, theme: 'pop', remindersEnabled: true })
    const user = await prisma.user.findUnique({ where: { id: 5150n } })
    expect(user?.canMessage).toBe(true)
  })

  it('refuse des initData falsifiées', async () => {
    const initData = makeInitData({ id: 5150, first_name: 'Sam' }, { token: '1:AUTRE' })
    await request(app).get('/api/me').set('Authorization', `tma ${initData}`).expect(401)
  })
})

describe('profil', () => {
  it('enregistre 1 à 3 passions', async () => {
    const response = await request(app).put('/api/me/passions').set(as()).send({ passions: ['cinema', 'dessin'] }).expect(200)
    expect(response.body.user).toMatchObject({ passions: ['dessin', 'cinema'], onboarded: true })
    await request(app).put('/api/me/passions').set(as()).send({ passions: [] }).expect(400)
    await request(app).put('/api/me/passions').set(as()).send({ passions: ['dessin', 'ecriture', 'musique', 'cinema'] }).expect(400)
  })
})

describe('parcours complet', () => {
  it('propose une activité de la passion et du temps choisis, avec une intro selon le mood', async () => {
    await onboard(['dessin'])
    const proposal = await propose({ passion: 'dessin', mood: 'fatigue', duration: 15 })
    expect(proposal.activityId).toMatch(/^dessin-15-/)
    expect(proposal.text.length).toBeGreaterThan(10)
    expect(proposal.intro).toMatch(/:$/)
    expect(proposal.unlockAt).toBe('2026-09-30T08:15:00.000Z')
  })

  it('refuse une passion hors du profil', async () => {
    await onboard(['dessin'])
    await request(app).post('/api/proposals').set(as()).send({ passion: 'musique', mood: 'ennui', duration: 5 }).expect(400)
  })

  it('« Une autre idée » propose toujours une activité différente', async () => {
    await onboard(['ecriture'])
    let current = await propose({ passion: 'ecriture', mood: 'stress', duration: 5 })
    const seen = [current.activityId]
    for (let i = 0; i < 8; i++) {
      clock.advanceMinutes(0.1)
      const next = await propose({ passion: 'ecriture', mood: 'stress', duration: 5, replacing: current.id })
      expect(next.activityId).not.toBe(current.activityId)
      seen.push(next.activityId)
      current = next
    }
    // Les 3 dernières propositions sont écartées : pas de répétition sur 4 idées d'affilée.
    for (let i = 0; i + 3 < seen.length; i++) expect(new Set(seen.slice(i, i + 4)).size).toBe(4)
  })

  it('Musique : « Valider » est refusé avant la fin de la durée, accepté après', async () => {
    await onboard(['musique'])
    const proposal = await propose({ passion: 'musique', mood: 'ennui', duration: 15 })

    clock.advanceMinutes(10)
    const early = await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id }).expect(409)
    expect(early.body.error.code).toBe('too_early')

    clock.advanceMinutes(5)
    const done = await request(app)
      .post('/api/completions')
      .set(as())
      .send({ proposalId: proposal.id, exploredTitle: '  Blonde — Frank Ocean ' })
      .expect(201)
    const body = done.body as CompleteResponse
    expect(body.coinsEarned).toBe(15)
    expect(body.completion.exploredTitle).toBe('Blonde — Frank Ocean')
    expect(body.stats).toEqual({
      totalCoins: 15,
      totalActivities: 1,
      monthActivities: 1,
      monthCoins: 15,
      byPassion: [{ passion: 'musique', minutes: 15, activities: 1, tried: [proposal.activityId], steps: [], drawings: 0, words: 0, explored: 1 }],
    })

    // Pas deux fois.
    const again = await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id }).expect(409)
    expect(again.body.error.code).toBe('already_completed')
  })

  it('Écriture : valide tout de suite avec le texte, sinon après la durée', async () => {
    await onboard(['ecriture'])
    const first = await propose({ passion: 'ecriture', mood: 'procrastination', duration: 5 })
    const withText = await request(app).post('/api/completions').set(as()).send({ proposalId: first.id, text: 'Trois phrases.' }).expect(201)
    expect(withText.body.completion.text).toBe('Trois phrases.')

    const second = await propose({ passion: 'ecriture', mood: 'procrastination', duration: 5 })
    const without = await request(app).post('/api/completions').set(as()).send({ proposalId: second.id, text: '   ' }).expect(409)
    expect(without.body.error.code).toBe('proof_required')
    clock.advanceMinutes(5)
    await request(app).post('/api/completions').set(as()).send({ proposalId: second.id }).expect(201)
  })

  it('Dessin : enregistre la photo et la sert par une adresse signée', async () => {
    await onboard(['dessin'])
    const proposal = await propose({ passion: 'dessin', mood: 'souffler', duration: 5 })
    const done = await request(app)
      .post('/api/completions')
      .set(as())
      .field('proposalId', proposal.id)
      .attach('photo', PNG, { filename: 'dessin.png', contentType: 'image/png' })
      .expect(201)
    const completion = (done.body as CompleteResponse).completion
    expect(completion.photoPending).toBe(false)
    expect(completion.photoUrl).toMatch(/^\/api\/photos\/.+\?e=\d+&s=/)

    const photo = await request(app).get(completion.photoUrl!).expect(200)
    expect(photo.headers['content-type']).toBe('image/png')
    expect(Buffer.compare(photo.body as Buffer, PNG)).toBe(0)

    // Signature modifiée : refusé.
    await request(app).get(completion.photoUrl!.replace(/s=.+$/, 's=faux')).expect(403)
  })

  it('Dessin sans photo : une photo envoyée ensuite au bot rejoint la galerie', async () => {
    await onboard(['dessin'])
    const proposal = await propose({ passion: 'dessin', mood: 'souffler', duration: 5 })
    clock.advanceMinutes(5)
    const done = await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id }).expect(201)
    expect(done.body.completion.photoPending).toBe(true)

    const attached = await attachBotPhoto(prisma, 42n, 'tg:FILE_ID', clock.now())
    expect(attached?.id).toBe(done.body.completion.id)
    expect(attached?.photoPending).toBe(false)
    expect(await attachBotPhoto(prisma, 42n, 'tg:AUTRE', clock.now())).toBeNull()
  })

  it('reprend l’activité en cours à la réouverture, et l’abandonne au parcours suivant', async () => {
    await onboard(['cinema'])
    const proposal = await propose({ passion: 'cinema', mood: 'stress', duration: 30 })
    const me = (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
    expect(me.openProposal?.id).toBe(proposal.id)

    const next = await propose({ passion: 'cinema', mood: 'ennui', duration: 5 })
    const after = (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
    expect(after.openProposal?.id).toBe(next.id)
    clock.advanceMinutes(30)
    await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id }).expect(409)
  })
})

describe('galerie', () => {
  it('liste les activités de la plus récente à la plus ancienne, page par page, et compte le mois', async () => {
    await onboard(['musique'])
    for (let i = 0; i < 3; i++) {
      const proposal = await propose({ passion: 'musique', mood: 'ennui', duration: 5 })
      clock.advanceMinutes(6)
      await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id, exploredTitle: `Titre ${i}` }).expect(201)
    }
    const first = (await request(app).get('/api/completions?limit=2').set(as()).expect(200)).body as CompletionsPage
    expect(first.items.map((item) => item.exploredTitle)).toEqual(['Titre 2', 'Titre 1'])
    expect(first.nextCursor).not.toBeNull()
    const second = (await request(app).get(`/api/completions?limit=2&cursor=${first.nextCursor}`).set(as()).expect(200)).body as CompletionsPage
    expect(second.items.map((item) => item.exploredTitle)).toEqual(['Titre 0'])
    expect(second.nextCursor).toBeNull()

    // Le mois suivant (heure de Paris), le compteur du mois repart de zéro, pas le total.
    clock.set('2026-10-01T00:30:00+02:00')
    const me = (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
    expect(me.stats).toMatchObject({ totalCoins: 15, totalActivities: 3, monthActivities: 0, monthCoins: 0 })
    // La progression de la passion : 15 minutons, 3 activités différentes dans la collection.
    expect(me.stats.byPassion).toHaveLength(1)
    expect(me.stats.byPassion[0]).toMatchObject({ passion: 'musique', minutes: 15, activities: 3 })
    expect(new Set(me.stats.byPassion[0]?.tried).size).toBe(3)
  })

  it('ne montre jamais la galerie d’un autre utilisateur', async () => {
    await onboard(['musique'], 1)
    const proposal = await propose({ passion: 'musique', mood: 'ennui', duration: 5 }, 1)
    clock.advanceMinutes(5)
    await request(app).post('/api/completions').set(as(1)).send({ proposalId: proposal.id }).expect(201)
    const other = (await request(app).get('/api/completions').set(as(2)).expect(200)).body as CompletionsPage
    expect(other.items).toEqual([])
    await onboard(['musique'], 2)
    await request(app).post('/api/proposals').set(as(2)).send({ passion: 'musique', mood: 'ennui', duration: 5, replacing: proposal.id }).expect(404)
  })
})

describe('fichiers servis avec l’app', () => {
  it('a le morceau de chaque ambiance sonore', () => {
    for (const ambiance of AMBIANCES) {
      const file = path.resolve(import.meta.dirname, '../../app/public', ambiance.src.slice(1))
      expect(fs.existsSync(file), ambiance.src).toBe(true)
    }
  })
})
