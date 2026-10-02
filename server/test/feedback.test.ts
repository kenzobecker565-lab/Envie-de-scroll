import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { CompleteResponse, CompletionResponse, MeResponse, ProposalResponse } from '@scroll-up/shared'
import type { PrismaClient } from '../src/db.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { claimAdmin, exportCsv, globalStats, isAdmin, personalStats, recentFeedback } from '../src/services/feedback.ts'
import { createTestDatabase, TEST_BOT_TOKEN, testClock } from './helpers.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let clock: ReturnType<typeof testClock>
let app: ReturnType<typeof createApp>
let notified: string[]

beforeEach(() => {
  const database = createTestDatabase()
  prisma = database.prisma
  cleanup = database.cleanup
  clock = testClock()
  notified = []
  app = createApp({
    prisma,
    config: { botToken: TEST_BOT_TOKEN, devAuth: true, initDataMaxAge: 0, signingSecret: 'secret-de-test', appDistDir: undefined },
    photos: createPhotoService({ telegram: undefined, storageChatId: undefined, localDir: `${database.dir}/photos` }),
    notify: async (text) => {
      notified.push(text)
    },
    botUsername: () => 'scrollup_bot',
    now: clock.now,
  })
})

afterEach(async () => {
  await cleanup()
})

const as = (id = 42) => ({ Authorization: `dev ${id}`, 'X-Timezone': 'Europe/Paris' })

/** Une activité d'écriture validée (5 min), pour noter, compter, exporter. */
async function writeSomething(id = 42) {
  await request(app).put('/api/me/passions').set(as(id)).send({ passions: ['ecriture'] }).expect(200)
  const proposed = await request(app).post('/api/proposals').set(as(id)).send({ passion: 'ecriture', mood: 'ennui', duration: 5 }).expect(201)
  const proposal = (proposed.body as ProposalResponse).proposal
  const done = await request(app).post('/api/completions').set(as(id)).send({ proposalId: proposal.id, text: 'Un petit texte.' }).expect(201)
  return (done.body as CompleteResponse).completion
}

describe('avis écrits', () => {
  it('garde l’avis et le transmet aux admins', async () => {
    await request(app).post('/api/feedback').set(as()).send({ message: '  J’adore le thème BD !  ', context: 'réglages' }).expect(201)
    const saved = await prisma.feedback.findMany()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ message: 'J’adore le thème BD !', context: 'réglages', source: 'app' })
    expect(notified).toHaveLength(1)
    expect(notified[0]).toContain('J’adore le thème BD !')
    expect(notified[0]).toContain('Camille')
  })

  it('refuse un avis vide ou trop long', async () => {
    await request(app).post('/api/feedback').set(as()).send({ message: '   ' }).expect(400)
    await request(app).post('/api/feedback').set(as()).send({ message: 'x'.repeat(2001) }).expect(400)
    expect(await prisma.feedback.count()).toBe(0)
  })
})

describe('notes des activités', () => {
  it('note sa propre activité, et la note revient dans la galerie', async () => {
    const completion = await writeSomething()
    expect(completion.rating).toBeNull()
    const rated = await request(app).put(`/api/completions/${completion.id}/rating`).set(as()).send({ rating: 3 }).expect(200)
    expect((rated.body as CompletionResponse).completion.rating).toBe(3)
    const gallery = await request(app).get('/api/completions').set(as()).expect(200)
    expect(gallery.body.items[0].rating).toBe(3)
  })

  it('refuse une note inconnue, ou l’activité de quelqu’un d’autre', async () => {
    const completion = await writeSomething()
    await request(app).put(`/api/completions/${completion.id}/rating`).set(as()).send({ rating: 5 }).expect(400)
    await request(app).put(`/api/completions/${completion.id}/rating`).set(as(7)).send({ rating: 1 }).expect(404)
  })
})

describe('suivi d’usage', () => {
  it('enregistre les événements connus, sans texte libre', async () => {
    await request(app).post('/api/events').set(as()).send({ name: 'cta' }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'mood', data: { mood: 'ennui', 'mauvaise clé': 1, n: 3 } }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'piratage' }).expect(400)
    const events = await prisma.appEvent.findMany({ orderBy: { createdAt: 'asc' } })
    expect(events.map((event) => event.name)).toEqual(['cta', 'mood'])
    expect(JSON.parse(events[1]!.data!)).toEqual({ mood: 'ennui', n: 3 })
  })

  it('compte une ouverture par séance (une demi-heure sans ouvrir l’app)', async () => {
    await request(app).get('/api/me').set(as()).expect(200)
    clock.advanceMinutes(10)
    await request(app).get('/api/me').set(as()).expect(200)
    clock.advanceMinutes(45)
    const me = await request(app).get('/api/me').set(as()).expect(200)
    expect(await prisma.appEvent.count({ where: { name: 'open' } })).toBe(2)
    expect((me.body as MeResponse).botUsername).toBe('scrollup_bot')
  })
})

describe('réglages', () => {
  it('coupe et réactive les relances', async () => {
    const off = await request(app).put('/api/me/settings').set(as()).send({ remindersEnabled: false }).expect(200)
    expect(off.body.user.remindersEnabled).toBe(false)
    const on = await request(app).put('/api/me/settings').set(as()).send({ remindersEnabled: true }).expect(200)
    expect(on.body.user.remindersEnabled).toBe(true)
    await request(app).put('/api/me/settings').set(as()).send({ remindersEnabled: 'oui' }).expect(400)
  })

  it('enregistre le moment où l’on scrolle le plus', async () => {
    const first = await request(app).get('/api/me').set(as()).expect(200)
    expect((first.body as MeResponse).user.scrollMoment).toBeNull()
    const chosen = await request(app).put('/api/me/settings').set(as()).send({ scrollMoment: 'nuit', remindersEnabled: true }).expect(200)
    expect(chosen.body.user).toMatchObject({ scrollMoment: 'nuit', remindersEnabled: true })
    // Changer de moment ne touche pas à l'interrupteur des relances.
    const changed = await request(app).put('/api/me/settings').set(as()).send({ scrollMoment: 'midi' }).expect(200)
    expect(changed.body.user).toMatchObject({ scrollMoment: 'midi', remindersEnabled: true })
    await request(app).put('/api/me/settings').set(as()).send({ scrollMoment: 'apero' }).expect(400)
    await request(app).put('/api/me/settings').set(as()).send({}).expect(400)
  })
})

describe('admins et statistiques', () => {
  it('le premier /admin devient admin, les suivants non (sauf ADMIN_IDS)', async () => {
    await request(app).get('/api/me').set(as(1)).expect(200)
    expect(await claimAdmin(prisma, [], 1)).toBe('claimed')
    expect(await claimAdmin(prisma, [], 1)).toBe('already')
    expect(await claimAdmin(prisma, [], 2)).toBe('taken')
    expect(await isAdmin(prisma, [], 1)).toBe(true)
    expect(await isAdmin(prisma, [], 2)).toBe(false)
    // ADMIN_IDS prend le dessus sur /admin.
    expect(await isAdmin(prisma, ['2'], 2)).toBe(true)
    expect(await isAdmin(prisma, ['2'], 1)).toBe(false)
  })

  it('résume le test : parcours, passions, notes, avis', async () => {
    await request(app).post('/api/events').set(as()).send({ name: 'cta' }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'mood' }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'time' }).expect(204)
    const completion = await writeSomething()
    await request(app).put(`/api/completions/${completion.id}/rating`).set(as()).send({ rating: 3 }).expect(200)
    await request(app).post('/api/feedback').set(as()).send({ message: 'Super idée.' }).expect(201)
    // Musique : deux personnes ; seul le dernier choix de chacune compte.
    await request(app).post('/api/events').set(as()).send({ name: 'music', data: { ambiance: 'piano' } }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'music', data: { ambiance: 'lofi' } }).expect(204)
    await request(app).post('/api/events').set(as(7)).send({ name: 'music', data: { ambiance: 'lofi' } }).expect(204)
    await request(app).post('/api/events').set(as(7)).send({ name: 'music_off' }).expect(204)
    // Raccourci sur l'écran d'accueil : deux demandes, une icône confirmée.
    await request(app).post('/api/events').set(as()).send({ name: 'home_screen' }).expect(204)
    await request(app).post('/api/events').set(as(7)).send({ name: 'home_screen' }).expect(204)
    await request(app).post('/api/events').set(as(7)).send({ name: 'home_screen_added' }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'home_screen_silent' }).expect(204)
    await request(app).put('/api/me/settings').set(as()).send({ scrollMoment: 'nuit' }).expect(200)
    // La tirette tirée (plutôt que touchée), et les onglets.
    await request(app).post('/api/events').set(as()).send({ name: 'pull' }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'tab', data: { tab: 'progress' } }).expect(204)
    await request(app).post('/api/events').set(as(7)).send({ name: 'tab', data: { tab: 'progress' } }).expect(204)
    await request(app).post('/api/events').set(as()).send({ name: 'tab', data: { tab: 'gallery' } }).expect(204)

    const stats = await globalStats(prisma, clock.now())
    expect(stats).toContain('Moments de scroll : matin 0 · midi 0 · soir 0 · nuit 1 · pas dit 0 · relances coupées 0')
    expect(stats).toContain('→ dont tirette tirée vers le haut : 1 (100 %), le reste d’un toucher')
    expect(stats).toContain('Onglets ouverts : Progresser 2 · Galerie 1 · Créer 0')
    expect(stats).toContain('Testeurs : 2')
    expect(stats).toContain('« J’ai envie de scroller » : 1 appui')
    expect(stats).toContain('activités validées : 1 (100 %')
    expect(stats).toContain('Écriture 1')
    expect(stats).toContain('j’ai adoré 1')
    expect(stats).toContain('Avis écrits : 1')
    expect(stats).toContain('Les activités les mieux notées')
    expect(stats).toContain('Musique d’ambiance : styles choisis (dernier choix de chacun) Lo-fi 2 · coupée 1 fois')
    expect(stats).toContain('Écran d’accueil : 1 icône ajoutée (2 demandes, 1 bloquée par le téléphone)')

    const user = await prisma.user.findUniqueOrThrow({ where: { id: 42n } })
    const mine = await personalStats(prisma, user)
    expect(mine).toContain('1 création')
    expect(mine).toContain('soit 5 minutons')
    expect(mine).toContain('Première création')
    expect(mine).toContain('Écriture : niveau 1 (Griffonneur·euse), 1/15 activités découvertes')

    expect(await recentFeedback(prisma)).toContain('« Super idée. »')
    const files = await exportCsv(prisma)
    expect(files.completions.split('\n')).toHaveLength(2)
    expect(files.completions).toContain('J’ai adoré')
    expect(files.feedback).toContain('Super idée.')
  })

  it('reste lisible sans aucune donnée', async () => {
    const stats = await globalStats(prisma, clock.now())
    expect(stats).toContain('Testeurs : 0')
    expect(stats).toContain('Musique d’ambiance : aucun style choisi · coupée 0 fois')
    expect(await recentFeedback(prisma)).toContain('Pas encore d’avis')
  })
})
