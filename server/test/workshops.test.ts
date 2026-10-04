import { beforeEach, afterEach, expect, it } from 'vitest'
import request from 'supertest'
import { referencePattern, workshopConfig } from '@scroll-up/shared'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { createTestDatabase, TEST_BOT_TOKEN } from './helpers.ts'
let db:ReturnType<typeof createTestDatabase>,app:ReturnType<typeof createApp>
const auth={Authorization:'dev 42'}
beforeEach(()=>{db=createTestDatabase();app=createApp({prisma:db.prisma,config:{botToken:TEST_BOT_TOKEN,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:db.dir+'/photos'})})})
afterEach(async()=>db.cleanup())
it('enregistre et restitue le beat, refuse les données invalides et un double crédit',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['rythme']}).expect(200)
 const proposed=await request(app).post('/api/proposals').set(auth).send({passion:'rythme',duration:5,step:'rythme-5-5'}).expect(201)
 const id=proposed.body.proposal.id
 await request(app).post('/api/completions').set(auth).send({proposalId:id,played:true}).expect(400)
 const workshop={version:1,passion:'rythme',beat:{name:'Premier beat',tempo:90,palette:'hip-hop',patterns:[referencePattern()]}}
 const done=await request(app).post('/api/completions').set(auth).send({proposalId:id,workshop}).expect(201)
 expect(done.body.coinsEarned).toBe(5);expect(done.body.completion.workshop.beat).toEqual(workshop.beat)
 await request(app).post('/api/completions').set(auth).send({proposalId:id,workshop}).expect(409)
 const gallery=await request(app).get('/api/completions').set(auth).expect(200);expect(gallery.body.items[0].workshop.beat).toEqual(workshop.beat)
 const other=await request(app).get('/api/completions').set({Authorization:'dev 43'}).expect(200);expect(other.body.items).toEqual([])
})
it('corrige les exercices côté serveur et garde les règles à revoir',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['francais']}).expect(200)
 const proposed=await request(app).post('/api/proposals').set(auth).send({passion:'francais',duration:5,step:'francais-5-1'}).expect(201)
 const questions=workshopConfig('francais-5-1')!.questions,answers=Object.fromEntries(questions.map(q=>[q.id,1-q.answer]))
 const done=await request(app).post('/api/completions').set(auth).send({proposalId:proposed.body.proposal.id,workshop:{version:1,passion:'francais',answers,summary:'100/100'}}).expect(201)
 expect(done.body.completion.workshop.summary).toBe(`0/${questions.length} réponses justes`);expect(done.body.completion.workshop.reviewRules.length).toBeGreaterThan(0)
})
it('les préférences héritées ouvrent les nouveaux ateliers et gardent les anciens identifiants',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['musique','cinema']}).expect(200)
 const me=await request(app).get('/api/me').set(auth).expect(200);expect(me.body.user.passions).toEqual(['rythme','logique'])
 expect(JSON.parse((await db.prisma.user.findUniqueOrThrow({where:{id:42n}})).passions)).toEqual(['musique','cinema'])
 await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5}).expect(201)
})
