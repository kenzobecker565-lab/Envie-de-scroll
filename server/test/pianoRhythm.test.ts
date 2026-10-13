import { beforeEach, afterEach, it, expect } from 'vitest'
import request from 'supertest'
import { createTestDatabase, testClock } from './helpers.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import type { PrismaClient } from '../src/db.ts'

let prisma: PrismaClient, cleanup: () => Promise<void>, app: ReturnType<typeof createApp>, clock: ReturnType<typeof testClock>
const as = (id=1) => ({Authorization:`dev ${id}`})
beforeEach(()=>{const db=createTestDatabase();prisma=db.prisma;cleanup=db.cleanup;clock=testClock();app=createApp({prisma,config:{botToken:undefined,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:`${db.dir}/photos`}),now:clock.now})})
afterEach(()=>cleanup())
it('protège les séances, impose la durée et ne récompense qu’une fois',async()=>{
  await request(app).post('/api/piano-rhythm/start').send({songId:'lumiere'}).expect(401)
  await request(app).post('/api/piano-rhythm/start').set(as()).send({songId:'unknown'}).expect(400)
  const started=await request(app).post('/api/piano-rhythm/start').set(as()).send({songId:'lumiere'}).expect(201)
  const sessionId=started.body.sessionId
  expect((await request(app).get('/api/me').set(as())).body.openProposal).toBeNull()
  await request(app).post('/api/piano-rhythm/finish').set(as(2)).send({sessionId,hits:3}).expect(404)
  await request(app).post('/api/piano-rhythm/finish').set(as()).send({sessionId,hits:3}).expect(409)
  clock.advanceMinutes(1)
  await request(app).post('/api/piano-rhythm/finish').set(as()).send({sessionId,hits:100000,coins:999}).expect(400)
  const first=await request(app).post('/api/piano-rhythm/finish').set(as()).send({sessionId,hits:3,coins:999}).expect(200)
  expect(first.body).toMatchObject({coins:1,stats:{totalCoins:1,totalActivities:1,totalMinutes:1}})
  const repeated=await request(app).post('/api/piano-rhythm/finish').set(as()).send({sessionId,hits:4}).expect(200)
  expect(repeated.body.stats.totalCoins).toBe(1)
  expect(await prisma.completion.count()).toBe(1)
  expect((await request(app).get('/api/completions').set(as())).body.items[0].exploredTitle).toBe('Lumière douce · En rythme')
})
it('termine même sans réussite et plafonne les minutes à la musique après une pause',async()=>{
  const started=await request(app).post('/api/piano-rhythm/start').set(as()).send({songId:'etoiles'}).expect(201)
  clock.advanceMinutes(20)
  const done=await request(app).post('/api/piano-rhythm/finish').set(as()).send({sessionId:started.body.sessionId,hits:0}).expect(200)
  expect(done.body).toMatchObject({coins:2,stats:{totalMinutes:2,totalCoins:2}})
})
