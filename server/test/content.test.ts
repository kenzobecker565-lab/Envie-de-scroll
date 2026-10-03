import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { QUIET_ACTIVITY_IDS, type CompleteResponse, type MeResponse, type ProposalResponse } from '@scroll-up/shared'
import type { PrismaClient } from '../src/db.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { exportCsv, globalStats, personalStats } from '../src/services/feedback.ts'
import { createTestDatabase, TEST_BOT_TOKEN, testClock } from './helpers.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let clock: ReturnType<typeof testClock>
let app: ReturnType<typeof createApp>

beforeEach(() => {
  const database = createTestDatabase()
  prisma = database.prisma
  cleanup = database.cleanup
  // Le 7 octobre 2026, à midi à Paris.
  clock = testClock('2026-10-07T10:00:00Z')
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
  await request(app).get('/api/me').set(as()).expect(200)
  await request(app).put('/api/me/passions').set(as()).send({ passions }).expect(200)
}

async function propose(body: object, status = 201) {
  const response = await request(app).post('/api/proposals').set(as()).send(body).expect(status)
  return response.body as ProposalResponse & { error?: { code: string; message: string } }
}

describe('le mot du jour', () => {
  it('se joue le jour même ou en rattrapage dans le mois, jamais à l’avance', async () => {
    await onboard(['dessin', 'ecriture'])
    const today = await propose({ passion: 'ecriture', mood: 'ennui', duration: 15, step: 'defi-ecriture-2026-10-07' })
    expect(today.proposal.activityId).toBe('defi-ecriture-2026-10-07')
    expect(today.proposal.text).toContain('feuille morte')

    expect((await propose({ passion: 'dessin', mood: 'ennui', duration: 15, step: 'defi-dessin-2026-10-08' }, 409)).error?.code).toBe('locked')
    await propose({ passion: 'dessin', mood: 'ennui', duration: 15, step: 'defi-dessin-2026-09-30' }, 409)
    await propose({ passion: 'dessin', mood: 'ennui', duration: 5, step: 'defi-dessin-2026-10-01' }, 400)
    await propose({ passion: 'ecriture', mood: 'ennui', duration: 15, step: 'defi-dessin-2026-10-01' }, 400)
    const past = await propose({ passion: 'dessin', mood: 'ennui', duration: 15, step: 'defi-dessin-2026-10-01' })
    await propose({ passion: 'dessin', mood: 'ennui', duration: 15, step: 'defi-dessin-2026-10-01', replacing: past.proposal.id }, 400)

    // Écrit : le mot compte dans les statistiques du mois.
    const again = await propose({ passion: 'ecriture', mood: 'ennui', duration: 15, step: 'defi-ecriture-2026-10-07' })
    const done = (await request(app).post('/api/completions').set(as()).send({ proposalId: again.proposal.id, text: 'Une feuille morte danse.' }).expect(201)).body as CompleteResponse
    expect(done.stats.challenge).toEqual(['defi-ecriture-2026-10-07'])
    expect(done.stats.byPassion[0]).toMatchObject({ tried: [], steps: [] })
    const me = (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
    expect(me.stats.challenge).toEqual(['defi-ecriture-2026-10-07'])

    expect(await globalStats(prisma, clock.now())).toContain('Mot du jour : 1 mot (dessin 0, écriture 1), par 1 personne')
    const { completions } = await exportCsv(prisma)
    expect(completions).toContain('mot du jour du 2026-10-07 : feuille morte')

    // Le mois suivant, le compteur repart de zéro (les créations restent).
    clock.set('2026-11-02T10:00:00Z')
    const later = (await request(app).get('/api/me').set(as()).expect(200)).body as MeResponse
    expect(later.stats.challenge).toEqual([])
  })

  it('apparaît dans les chiffres personnels du mois', async () => {
    clock.set(new Date().toISOString())
    await onboard(['dessin'])
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(clock.now())
    const { proposal } = await propose({ passion: 'dessin', mood: 'ennui', duration: 15, step: `defi-dessin-${today}` })
    clock.advanceMinutes(15)
    await request(app).post('/api/completions').set(as()).send({ proposalId: proposal.id }).expect(201)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: 42n } })
    expect(await personalStats(prisma, user)).toContain('Mots du jour ce mois-ci : 1')
  })
})

describe('pas de son autour de toi', () => {
  it('ne propose que des activités sans écoute, ou explique qu’il n’y en a pas', async () => {
    await onboard(['cinema', 'musique'])
    for (let i = 0; i < 6; i++) {
      const { proposal } = await propose({ passion: 'cinema', mood: 'stress', duration: 5, quiet: true })
      expect(QUIET_ACTIVITY_IDS).toContain(proposal.activityId)
    }
    const none = await propose({ passion: 'musique', mood: 'stress', duration: 5, quiet: true }, 409)
    expect(none.error).toMatchObject({ code: 'no_quiet' })
    expect(none.error?.message).toContain('Musique')
    await propose({ passion: 'musique', mood: 'stress', duration: 5, quiet: 'oui' }, 400)
  })
})

describe('notes et tirage', () => {
  it('garde le tirage possible pour une activité notée « Pas pour moi »', async () => {
    await onboard(['cinema'])
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const { proposal } = await propose({ passion: 'cinema', mood: 'ennui', duration: 5 })
      seen.add(proposal.activityId)
    }
    expect(seen.size).toBe(5)
  })
})
