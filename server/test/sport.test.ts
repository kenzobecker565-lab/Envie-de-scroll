import {beforeEach,afterEach,it,expect} from 'vitest'
import request from 'supertest'
import {createApp} from '../src/http/app.ts'
import {createPhotoService} from '../src/photos/photos.ts'
import {createTestDatabase,TEST_BOT_TOKEN,testClock} from './helpers.ts'
let db:ReturnType<typeof createTestDatabase>,app:ReturnType<typeof createApp>,clock:ReturnType<typeof testClock>
const auth={Authorization:'dev 42'}
beforeEach(()=>{db=createTestDatabase();clock=testClock();app=createApp({prisma:db.prisma,now:clock.now,config:{botToken:TEST_BOT_TOKEN,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:db.dir+'/photos'})})})
afterEach(async()=>db.cleanup())
it('refuse un crédit anticipé, enregistre Sport et ne crédite jamais deux fois',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['sport']}).expect(200)
 const proposed=await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:'sport-5-1'}).expect(201)
 const body={proposalId:proposed.body.proposal.id,sport:{version:1,activeSeconds:300,summary:'10000 minutons'}}
 await request(app).post('/api/completions').set(auth).send({...body,sport:{version:1,activeSeconds:299}}).expect(400)
 await request(app).post('/api/completions').set(auth).send(body).expect(409)
 clock.advanceMinutes(5)
 const done=await request(app).post('/api/completions').set(auth).send(body).expect(201)
 expect(done.body.coinsEarned).toBe(5);expect(done.body.completion.sport.summary).toBe('Réveil musculaire · 5 min');expect(done.body.completion.workshop).toBeNull()
 const gallery=await request(app).get('/api/completions?passion=sport').set(auth).expect(200);expect(gallery.body.items[0].sport).toEqual(done.body.completion.sport)
 await request(app).post('/api/completions').set(auth).send(body).expect(409)
})
it('garde les anciens identifiants et rend les six leçons accessibles',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['rythme']}).expect(200)
 const me=await request(app).get('/api/me').set(auth).expect(200);expect(me.body.user.passions).toEqual(['sport']);expect(JSON.parse((await db.prisma.user.findUniqueOrThrow({where:{id:42n}})).passions)).toEqual(['rythme'])
 for(let i=1;i<=6;i++){const p=await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:`sport-lesson-${i}`}).expect(201);clock.advanceMinutes(5);const done=await request(app).post('/api/completions').set(auth).send({proposalId:p.body.proposal.id,sport:{version:1,activeSeconds:300,easy:true}}).expect(201);expect(done.body.completion.sport.lesson).toBe(i-1)}
})
it('change une séance sans créditer la précédente et remet la durée complète',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['sport','dessin']}).expect(200)
 const first=await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:'sport-5-1'}).expect(201)
 clock.advanceMinutes(2)
 const replacing=first.body.proposal.id
 await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:15,step:'sport-15-6',replacing}).expect(400)
 await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:'sport-5-1',replacing}).expect(400)
 expect((await request(app).get('/api/me').set(auth)).body.openProposal.id).toBe(replacing)
 const next=await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:'sport-5-2',replacing}).expect(201)
 expect(next.body.proposal.id).not.toBe(replacing)
 expect(next.body.proposal.activityId).toBe('sport-5-2')
 expect(new Date(next.body.proposal.unlockAt).getTime()-new Date(next.body.proposal.createdAt).getTime()).toBe(300000)
 expect((await db.prisma.proposal.findUniqueOrThrow({where:{id:replacing}})).status).toBe('replaced')
 expect((await request(app).get('/api/me').set(auth)).body.stats.totalCoins).toBe(0)
 await request(app).post('/api/completions').set(auth).send({proposalId:replacing,sport:{version:1,activeSeconds:300}}).expect(409)
 await request(app).post('/api/completions').set(auth).send({proposalId:next.body.proposal.id,sport:{version:1,activeSeconds:300}}).expect(409)
 await request(app).post('/api/proposals').set(auth).send({passion:'sport',duration:5,step:'sport-5-3',replacing}).expect(409)
 clock.advanceMinutes(5)
 await request(app).post('/api/completions').set(auth).send({proposalId:next.body.proposal.id,sport:{version:1,activeSeconds:300}}).expect(201)
 expect((await request(app).get('/api/completions').set(auth)).body.items).toHaveLength(1)
})
