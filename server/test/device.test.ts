import { expect, it, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createTestDatabase, testClock } from './helpers.ts'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { deviceUser } from '../src/auth/device.ts'
import type { PrismaClient } from '../src/db.ts'
let prisma:PrismaClient,cleanup:()=>Promise<void>,app:ReturnType<typeof createApp>
beforeEach(()=>{const db=createTestDatabase();prisma=db.prisma;cleanup=db.cleanup;app=createApp({prisma,config:{botToken:undefined,devAuth:false,initDataMaxAge:0,signingSecret:'device-test-secret',appDistDir:undefined,adminIds:['1']},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:`${db.dir}/photos`}),now:testClock().now})})
afterEach(()=>cleanup())
it('sépare les installations et ne permet pas de se connecter par identifiant public',async()=>{
  const auth={Authorization:`device ${'a'.repeat(64)}`}, other={Authorization:`device ${'b'.repeat(64)}`}
  await request(app).get('/api/me').expect(401)
  await request(app).get('/api/me').set({Authorization:'device 1'}).expect(401)
  await request(app).get('/api/me').set({Authorization:'dev 1'}).expect(401)
  const first=await request(app).get('/api/me').set(auth).expect(200)
  expect(Number(first.body.user.id)).toBeLessThan(0)
  expect(first.body.isAdmin).toBe(false)
  expect(first.body.user.remindersEnabled).toBe(false)
  await request(app).put('/api/me/passions').set(auth).send({passions:['dessin']}).expect(200)
  const again=await request(app).get('/api/me').set(auth).expect(200)
  expect(again.body.user.id).toBe(first.body.user.id)
  expect(again.body.user.passions).toEqual(['dessin'])
  const second=await request(app).get('/api/me').set(other).expect(200)
  expect(second.body.user.id).not.toBe(first.body.user.id)
  expect(second.body.user.passions).toEqual([])
  const settings=await request(app).put('/api/me/settings').set(auth).send({remindersEnabled:true}).expect(200)
  expect(settings.body.user.remindersEnabled).toBe(false)
  expect(deviceUser('a'.repeat(64),'changed-secret')?.id).not.toBe(Number(first.body.user.id))
})
