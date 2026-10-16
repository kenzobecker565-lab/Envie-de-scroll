import {beforeEach,afterEach,it,expect} from 'vitest'
import request from 'supertest'
import {createApp} from '../src/http/app.ts'
import {createPhotoService} from '../src/photos/photos.ts'
import {createTestDatabase,testClock,TEST_BOT_TOKEN} from './helpers.ts'
let db:ReturnType<typeof createTestDatabase>,clock:ReturnType<typeof testClock>,app:ReturnType<typeof createApp>
const auth={Authorization:'dev 42'},other={Authorization:'dev 43'}
beforeEach(async()=>{db=createTestDatabase();clock=testClock();app=createApp({prisma:db.prisma,config:{botToken:TEST_BOT_TOKEN,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:db.dir+'/photos'}),now:clock.now});await request(app).put('/api/me/passions').set(auth).send({passions:['dessin','ecriture']})})
afterEach(async()=>db.cleanup())
const start=async(passion='ecriture')=>(await request(app).post('/api/proposals').set(auth).send({passion,duration:5,external:true}).expect(201)).body.proposal
const action=async(id:string,action:string)=>(await request(app).post(`/api/proposals/${id}/session`).set(auth).send({action}).expect(200)).body.proposal
it('keeps previous sessions resumable without counting time spent in a different session',async()=>{
 const first=await start();clock.advanceMinutes(2);const second=await start('dessin');clock.advanceMinutes(20)
 const list=await request(app).get('/api/proposals/saved').set(auth).expect(200);expect(list.body.items.map((p:{id:string})=>p.id)).toEqual([second.id,first.id])
 const resumed=await action(first.id,'resume');expect(resumed.id).toBe(first.id);expect(resumed.activeSeconds).toBe(120)
 clock.advanceMinutes(1);const done=await request(app).post('/api/completions').set(auth).send({proposalId:first.id,external:true,text:'Mon texte conservé.'}).expect(201)
 expect(done.body.coinsEarned).toBe(3);expect(done.body.stats.totalMinutes).toBe(3);expect(done.body.stats.byPassion[0].minutes).toBe(3)
 expect((await db.prisma.proposal.findUniqueOrThrow({where:{id:second.id}})).status).toBe('saved')
})
it('does not credit explicit pauses, including repeated pause requests and paused completion',async()=>{
 const p=await start();clock.advanceMinutes(2);await action(p.id,'pause');clock.advanceMinutes(15);expect((await action(p.id,'pause')).activeSeconds).toBe(120)
 const r=await request(app).post('/api/completions').set(auth).send({proposalId:p.id,external:true,text:'Une création.'}).expect(201);expect(r.body.coinsEarned).toBe(2);expect(r.body.stats.totalMinutes).toBe(2)
})
it('blocks empty instantaneous completions, while a real fast creation can still be saved',async()=>{
 const p=await start();await request(app).post('/api/completions').set(auth).send({proposalId:p.id,external:true}).expect(409)
 expect((await request(app).get('/api/me').set(auth)).body.stats.totalActivities).toBe(0)
 const r=await request(app).post('/api/completions').set(auth).send({proposalId:p.id,external:true,text:'Une phrase écrite.'}).expect(201);expect(r.body.coinsEarned).toBe(0);expect(r.body.completion.text).toBe('Une phrase écrite.')
})
it('preserves ownership and validates actions',async()=>{
 const p=await start();await request(app).post(`/api/proposals/${p.id}/session`).set(other).send({action:'resume'}).expect(404)
 expect((await request(app).get('/api/proposals/saved').set(other)).body.items).toEqual([])
 await request(app).post(`/api/proposals/${p.id}/session`).set(auth).send({action:'credit'}).expect(400)
})
it('keeps old unfinished sessions accessible beyond the home resume TTL',async()=>{
 const p=await start();clock.advanceMinutes(2);await action(p.id,'pause');clock.advanceMinutes(60*24*3)
 expect((await request(app).get('/api/proposals/saved').set(auth)).body.items.map((p:{id:string})=>p.id)).toContain(p.id)
 const r=await action(p.id,'resume');expect(r.activeSeconds).toBe(120)
})
