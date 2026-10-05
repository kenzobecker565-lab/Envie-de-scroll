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
