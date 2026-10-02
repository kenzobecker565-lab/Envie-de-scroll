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
