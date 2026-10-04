import { beforeEach, afterEach, it, expect } from 'vitest'
import request from 'supertest'
import { createTestDatabase } from './helpers.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import type { PrismaClient } from '../src/db.ts'

let prisma: PrismaClient
let cleanup: () => Promise<void>
let app: ReturnType<typeof createApp>
const as = (id = 1) => ({ Authorization: `dev ${id}` })
beforeEach(() => {
  const db = createTestDatabase(); prisma = db.prisma; cleanup = db.cleanup
  app = createApp({ prisma, config: { botToken: undefined, devAuth: true, initDataMaxAge: 0, signingSecret: 'test', appDistDir: undefined }, photos: createPhotoService({ telegram: undefined, storageChatId: undefined, localDir: `${db.dir}/photos` }) })
})
afterEach(async () => cleanup())
async function fund(coins: number, id = 1) {
  await prisma.user.create({ data: { id: BigInt(id), passions: '["piano"]' } })
  const proposal = await prisma.proposal.create({ data: { userId: BigInt(id), activityId: 'test', passion: 'piano', duration: coins, intro: 'Test', status: 'completed' } })
  await prisma.completion.create({ data: { userId: BigInt(id), proposalId: proposal.id, activityId: 'test', passion: 'piano', duration: coins, coins, activityText: 'Test', localDate: '2026-10-02' } })
}
it('débite le prix du serveur, conserve la progression, et ne redébite jamais un achat répété', async () => {
  await fund(150)
  const first = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-lanterne', price: 0 }).expect(200)
  expect(first.body).toMatchObject({ earned: 150, spent: 50, balance: 100, owned: ['piano-lanterne'] })
  const second = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-lanterne' }).expect(200)
  expect(second.body).toEqual(first.body)
  expect(await prisma.shopPurchase.count()).toBe(1)
  const me = await request(app).get('/api/me').set(as()).expect(200)
  expect(me.body.stats.totalCoins).toBe(150)
  expect(me.body.shop.balance).toBe(100)
  const song = await request(app).get('/api/shop/piano/piano-lanterne').set(as()).expect(200)
  expect(song.body.melody.notes.length).toBeGreaterThan(20)
})
it('refuse un manque de fonds, un faux article et Davy Jones sans dépenser', async () => {
  await fund(20)
  await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'theme-jardin' }).expect(409)
  await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'fake' }).expect(400)
  await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-davy-jones' }).expect(400)
  const wallet = await request(app).get('/api/shop').set(as()).expect(200)
  expect(wallet.body).toMatchObject({ balance: 20, spent: 0, owned: [] })
})
it('isole les achats, bloque l’équipement non possédé et conserve les choix après rechargement', async () => {
  await fund(100)
  await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId: 'mascot-casque' }).expect(403)
  await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'mascot-casque' }).expect(200)
  const equipped = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId: 'mascot-casque' }).expect(200)
  expect(equipped.body.equipped).toEqual({ mascot: 'mascot-casque' })
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop.equipped).toEqual({ mascot: 'mascot-casque' })
  const other = await request(app).get('/api/shop').set(as(2)).expect(200)
  expect(other.body.owned).toEqual([])
  await request(app).put('/api/shop/equipment').set(as(2)).send({ category: 'mascot', itemId: 'mascot-casque' }).expect(403)
  await request(app).put('/api/shop/equipment').set(as()).send({ category: 'theme', itemId: 'mascot-casque' }).expect(403)
  const cleared = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId: null }).expect(200)
  expect(cleared.body.equipped).toEqual({})
  expect(cleared.body.owned).toContain('mascot-casque')
})
it('ne laisse pas deux achats concurrents dépasser le solde', async () => {
  await fund(100)
  const results = await Promise.all([
    request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-lanterne' }),
    request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-constellation' }),
  ])
  expect(results.map((result) => result.status).sort()).toEqual([200, 409])
  const wallet = await request(app).get('/api/shop').set(as()).expect(200)
  expect(wallet.body.balance).toBeGreaterThanOrEqual(0)
  expect(wallet.body.owned).toHaveLength(1)
  expect(await prisma.shopPurchase.count()).toBe(1)
})
it('gère deux requêtes concurrentes pour le même objet sans double débit', async () => {
  await fund(100)
  const results = await Promise.all([1, 2].map(() => request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-lanterne' })))
  expect(results.map((result) => result.status)).toEqual([200, 200])
  const wallet = await request(app).get('/api/shop').set(as()).expect(200)
  expect(wallet.body.spent).toBe(50)
  expect(wallet.body.owned).toEqual(['piano-lanterne'])
})
it('bloque les notes d’un morceau non acheté et supprime les achats avec les données du compte', async () => {
  await fund(100)
  await request(app).get('/api/shop/piano/piano-lanterne').set(as()).expect(403)
  await request(app).get('/api/shop/piano/piano-davy-jones').set(as()).expect(400)
  await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-lanterne' }).expect(200)
  await request(app).delete('/api/me').set(as()).expect(204)
  expect(await prisma.shopPurchase.count()).toBe(0)
})
it('active un nouveau thème dès l’achat, le restaure et permet de changer sans repayer', async () => {
  await fund(300)
  const bought = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'theme-jardin' }).expect(200)
  expect(bought.body.equipped.theme).toBe('theme-jardin')
  expect(bought.body.spent).toBe(120)
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop.equipped.theme).toBe('theme-jardin')
  await request(app).put('/api/shop/equipment').set(as()).send({ category: 'theme', itemId: null }).expect(200)
  const repeated = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'theme-jardin' }).expect(200)
  expect(repeated.body.equipped.theme).toBeUndefined()
  expect(repeated.body.spent).toBe(120)
  const selected = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'theme', itemId: 'theme-jardin' }).expect(200)
  expect(selected.body.equipped.theme).toBe('theme-jardin')
  expect(selected.body.balance).toBe(180)
})

it('réserve le crédit au compte admin, et crédite une seule fois sans modifier la progression', async () => {
  await fund(50)
  await fund(25, 2)
  await prisma.setting.create({ data: { key: 'admins', value: '["1"]' } })
  const admin = await request(app).get('/api/shop').set(as()).expect(200)
  expect(admin.body.canClaimTestCredit).toBe(true)
  const other = await request(app).get('/api/shop').set(as(2)).expect(200)
  expect(other.body.canClaimTestCredit).toBe(false)
  await request(app).post('/api/shop/test-credit').set(as(2)).send({ amount: 999999, userId: '1' }).expect(403)
  const responses = await Promise.all([1,2].map(() => request(app).post('/api/shop/test-credit').set(as()).send({ amount: 999999, userId: '2' })))
  for (const result of responses) expect(result.body).toMatchObject({ earned: 50, bonus: 10000, balance: 10050, canClaimTestCredit: false })
  const me = await request(app).get('/api/me').set(as()).expect(200)
  expect(me.body.stats.totalCoins).toBe(50)
  expect(me.body.stats.totalActivities).toBe(1)
  expect(await prisma.completion.count({ where: { userId: 1n } })).toBe(1)
  const bought = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'piano-elise' }).expect(200)
  expect(bought.body.balance).toBe(9890)
  await request(app).post('/api/shop/test-credit').set(as()).expect(200)
  expect((await request(app).get('/api/shop').set(as())).body.balance).toBe(9890)
  expect((await request(app).get('/api/shop').set(as(2))).body.balance).toBe(25)
})

it('respecte les admins configurés et refuse un faux rôle envoyé par le client', async () => {
  await fund(0)
  await prisma.setting.create({ data: { key: 'admins', value: '["1"]' } })
  const configured = createApp({ prisma, config: { botToken: undefined, devAuth: true, initDataMaxAge: 0, signingSecret: 'test', appDistDir: undefined, adminIds: ['2'] }, photos: createPhotoService({ telegram: undefined, storageChatId: undefined, localDir: '/tmp/test-photos' }) })
  await request(configured).post('/api/shop/test-credit').set(as()).send({ admin: true }).expect(403)
  expect((await request(configured).get('/api/shop').set(as())).body.canClaimTestCredit).toBe(false)
  const credited = await request(configured).post('/api/shop/test-credit').set(as(2)).expect(200)
  expect(credited.body.balance).toBe(10000)
})

it('permet d’acheter et de jouer chacun des six classiques, en conservant le verrou avant achat', async () => {
  await fund(2000)
  for (const id of ['piano-elise','piano-joie','piano-moonlight','piano-canon','piano-bach-prelude','piano-gymnopedie']) {
    await request(app).get(`/api/shop/piano/${id}`).set(as()).expect(403)
    await request(app).post('/api/shop/purchases').set(as()).send({ itemId: id }).expect(200)
    const played = await request(app).get(`/api/shop/piano/${id}`).set(as()).expect(200)
    expect(played.body.melody.notes.length).toBeGreaterThan(25)
    expect(played.body.melody.phrases.flat()).toEqual(played.body.melody.notes)
  }
})

it('achète et restaure les nouvelles palettes et couvertures', async () => {
  await fund(100)
  for (const [category, itemId] of [['palette', 'palette-ocean'], ['cover', 'cover-sakura']] as const) {
    await request(app).post('/api/shop/purchases').set(as()).send({ itemId }).expect(200)
    const equipped = await request(app).put('/api/shop/equipment').set(as()).send({ category, itemId }).expect(200)
    expect(equipped.body.equipped[category]).toBe(itemId)
  }
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop).toMatchObject({ balance: 10, spent: 90, equipped: { palette: 'palette-ocean', cover: 'cover-sakura' } })
})

it('achète les douze tenues sportives et restaure la dernière tenue équipée', async () => {
  await fund(2000)
  const sports = ['basket', 'judo', 'equitation', 'football', 'tennis', 'boxe', 'natation', 'cyclisme', 'rugby', 'baseball', 'ski', 'skate']
  for (const sport of sports) {
    const itemId = `mascot-${sport}`
    await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId }).expect(403)
    await request(app).post('/api/shop/purchases').set(as()).send({ itemId }).expect(200)
    const equipped = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId }).expect(200)
    expect(equipped.body.equipped.mascot).toBe(itemId)
  }
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop.owned).toHaveLength(12)
  expect(restored.body.shop.equipped.mascot).toBe('mascot-skate')
  expect(restored.body.stats.totalCoins).toBe(2000)
})

it('achète les nouvelles tenues féminines et restaure la dernière portée sans redébiter', async () => {
  await fund(500)
  for (const itemId of ['mascot-judoka-f', 'mascot-athena', 'mascot-poney']) {
    await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId }).expect(403)
    await request(app).post('/api/shop/purchases').set(as()).send({ itemId }).expect(200)
    const result = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId }).expect(200)
    expect(result.body.equipped.mascot).toBe(itemId)
  }
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop).toMatchObject({ spent: 300, balance: 200, equipped: { mascot: 'mascot-poney' } })
  expect(restored.body.shop.owned).toEqual(expect.arrayContaining(['mascot-judoka-f', 'mascot-athena', 'mascot-poney']))
  const repeated = await request(app).post('/api/shop/purchases').set(as()).send({ itemId: 'mascot-athena' }).expect(200)
  expect(repeated.body.spent).toBe(300)
  expect(repeated.body.equipped.mascot).toBe('mascot-poney')
  const other = await request(app).get('/api/shop').set(as(2)).expect(200)
  expect(other.body.owned).toEqual([])
})

it('achète et équipe les huit costumes Halloween aux prix du catalogue', async () => {
  await fund(1000)
  const costumes = ['vampire', 'sorcier', 'citrouille', 'fantome', 'vampiresse', 'sorciere', 'citrouille-f', 'fantome-f']
  for (const costume of costumes) {
    const itemId = `mascot-halloween-${costume}`
    await request(app).post('/api/shop/purchases').set(as()).send({ itemId }).expect(200)
    const result = await request(app).put('/api/shop/equipment').set(as()).send({ category: 'mascot', itemId }).expect(200)
    expect(result.body.equipped.mascot).toBe(itemId)
  }
  const restored = await request(app).get('/api/me').set(as()).expect(200)
  expect(restored.body.shop).toMatchObject({ spent: 680, balance: 320, equipped: { mascot: 'mascot-halloween-fantome-f' } })
  expect(restored.body.shop.owned).toHaveLength(8)
  expect(restored.body.stats.totalCoins).toBe(1000)
})
