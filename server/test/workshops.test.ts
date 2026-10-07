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
 const me=await request(app).get('/api/me').set(auth).expect(200);expect(me.body.user.passions).toEqual(['sport','logique'])
 expect(JSON.parse((await db.prisma.user.findUniqueOrThrow({where:{id:42n}})).passions)).toEqual(['musique','cinema'])
 await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5}).expect(201)
})
it('valide une énigme sans solution trouvée, conserve les réponses et calcule le résultat sans faire confiance au client',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const proposed=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:15,step:'logique-15-6'}).expect(201)
 const cases=workshopConfig('logique-15-6')!.cases,p=cases[0]!
 const wrong={rooms:[0,0,-1,-1],times:[0,0,-1,-1]}
 const workshop={version:1,passion:'logique',answers:{[p.id]:wrong},logicResults:cases.map(p=>({id:p.id,correct:true})),summary:'Tout résolu'}
 const done=await request(app).post('/api/completions').set(auth).send({proposalId:proposed.body.proposal.id,workshop}).expect(201)
 expect(done.body.coinsEarned).toBe(0);expect(done.body.completion.workshop.summary).toBe('2 dossiers étudiés · 0/2 résolu')
 expect(done.body.completion.workshop.logicResults).toEqual(cases.map(p=>({id:p.id,correct:false})))
 expect(done.body.completion.workshop.answers[p.id]).toEqual(wrong)
 expect(done.body.completion.workshop.answers[cases[1]!.id]).toBeNull()
 const gallery=await request(app).get('/api/completions?passion=logique').set(auth).expect(200);expect(gallery.body.items[0].workshop).toEqual(done.body.completion.workshop)
 await request(app).post('/api/completions').set(auth).send({proposalId:proposed.body.proposal.id,workshop}).expect(409)
})
it('accepte un dossier non répondu et refuse une répartition illisible',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const proposed=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5,step:'logique-5-1'}).expect(201)
 const p=workshopConfig('logique-5-1')!.cases[0]!
 await request(app).post('/api/completions').set(auth).send({proposalId:proposed.body.proposal.id,workshop:{version:1,passion:'logique',answers:{[p.id]:{rooms:[99],times:[]}}}}).expect(400)
 const done=await request(app).post('/api/completions').set(auth).send({proposalId:proposed.body.proposal.id,workshop:{version:1,passion:'logique',answers:{}}}).expect(201)
 expect(done.body.completion.workshop.logicResults).toEqual([{id:p.id,correct:false}]);expect(done.body.coinsEarned).toBe(0)
})
it('archive les nouveaux scénarios non résolus sans croire une correction fournie par le client',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const p=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:30,step:'logique-30-11'}).expect(201)
 const body={proposalId:p.body.proposal.id,workshop:{version:2,contentRevision:3,passion:'logique',notebook:'Hypothèse vérifiée : recaler la caméra avant d’accuser.',answers:{},summary:'tout juste',studio:{steps:[{correct:true}]}}}
 const done=await request(app).post('/api/completions').set(auth).send(body).expect(201)
 expect(done.body.completion.workshop.studio.notebook).toBe('Hypothèse vérifiée : recaler la caméra avant d’accuser.');expect(done.body.coinsEarned).toBe(0);expect(done.body.completion.workshop.studio.steps).toHaveLength(6);expect(done.body.completion.workshop.studio.steps.every((s:{correct:boolean})=>!s.correct)).toBe(true)
 const gallery=await request(app).get('/api/completions?passion=logique').set(auth).expect(200);expect(gallery.body.items[0].workshop).toEqual(done.body.completion.workshop)
 await request(app).post('/api/completions').set(auth).send(body).expect(409)
})
it('refuse un nouveau français incomplet et conserve une réécriture sans l’évaluer comme un QCM',async()=>{
 const {studioConfig}=await import('@scroll-up/shared')
 await request(app).put('/api/me/passions').set(auth).send({passions:['francais']}).expect(200)
 const p=await request(app).post('/api/proposals').set(auth).send({passion:'francais',duration:30,step:'francais-30-15'}).expect(201)
 await request(app).post('/api/completions').set(auth).send({proposalId:p.body.proposal.id,workshop:{version:2,passion:'francais',answers:{}}}).expect(400)
 const c=studioConfig('francais-30-15')!,text='Une proposition personnelle complète.\nLa deuxième ligne reste également dans le texte.'
 const answers=Object.fromEntries(c.tasks.map(t=>[t.id,t.kind==='rewrite'?text:t.kind==='repair'?t.repairs!.map(r=>r.right):t.solution]))
 const done=await request(app).post('/api/completions').set(auth).send({proposalId:p.body.proposal.id,workshop:{version:2,passion:'francais',answers}}).expect(201)
 expect(done.body.completion.workshop.studio.steps.find((s:{task:{kind:string}})=>s.task.kind==='rewrite')).toMatchObject({response:text,correct:null})
})
it('le tirage surprise préfère le dossier jamais terminé puis reste disponible après le tour du catalogue',async()=>{
 await request(app).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const {studioConfig}=await import('@scroll-up/shared')
 for(let i=1;i<=4;i++){const p=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5,step:`logique-5-${i}`}).expect(201);await request(app).post('/api/completions').set(auth).send({proposalId:p.body.proposal.id,workshop:{version:2,contentRevision:studioConfig(`logique-5-${i}`)!.revision,passion:'logique',notebook:'Hypothèse vérifiée : recaler la caméra avant d’accuser.',answers:{}}}).expect(201)}
 const last=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5}).expect(201);expect(last.body.proposal.activityId).toBe('logique-5-5')
 await request(app).post('/api/completions').set(auth).send({proposalId:last.body.proposal.id,workshop:{version:2,contentRevision:3,passion:'logique',notebook:'Hypothèse vérifiée : recaler la caméra avant d’accuser.',answers:{}}}).expect(201)
 const replay=await request(app).post('/api/proposals').set(auth).send({passion:'logique',duration:5}).expect(201);expect(replay.body.proposal.activityId).not.toBe('logique-5-5')
})
it('compte les minutes passées tant qu’une énigme n’est pas résolue sans voir la solution',async()=>{
 const {studioConfig}=await import('@scroll-up/shared')
 let clock=new Date('2026-10-06T18:00:00Z')
 const timed=createApp({prisma:db.prisma,config:{botToken:TEST_BOT_TOKEN,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:db.dir+'/photos'}),now:()=>clock})
 await request(timed).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const c=studioConfig('logique-30-11')!,solved=Object.fromEntries(c.tasks.map(t=>[t.id,t.solution]))
 const play=async(minutes:number,workshop:Record<string,unknown>)=>{
  const id=(await request(timed).post('/api/proposals').set(auth).send({passion:'logique',duration:30,step:'logique-30-11'}).expect(201)).body.proposal.id
  clock=new Date(clock.getTime()+minutes*60_000)
  return (await request(timed).post('/api/completions').set(auth).send({proposalId:id,workshop:{version:2,contentRevision:c.revision,passion:'logique',...workshop}}).expect(201)).body.coinsEarned
 }
 expect(await play(0.05,{answers:{}})).toBe(0)
 expect(await play(7.5,{answers:{}})).toBe(7)
 expect(await play(45,{answers:{}})).toBe(30)
 expect(await play(2,{answers:solved})).toBe(30)
 expect(await play(2,{answers:solved,sawSolution:true})).toBe(2)
 const me=await request(timed).get('/api/me').set(auth).expect(200);expect(me.body.stats.totalCoins).toBe(0+7+30+30+2)
})

it('sépare les durées historiques des récompenses et remet seulement les compteurs mensuels à zéro', async () => {
 const {studioConfig}=await import('@scroll-up/shared')
 let clock=new Date('2026-10-06T18:00:00Z')
 const timed=createApp({prisma:db.prisma,config:{botToken:TEST_BOT_TOKEN,devAuth:true,initDataMaxAge:0,signingSecret:'test',appDistDir:undefined},photos:createPhotoService({telegram:undefined,storageChatId:undefined,localDir:db.dir+'/photos'}),now:()=>clock})
 await request(timed).put('/api/me/passions').set(auth).send({passions:['logique']}).expect(200)
 const c=studioConfig('logique-30-11')!
 const proposal=(await request(timed).post('/api/proposals').set(auth).send({passion:'logique',duration:30,step:'logique-30-11'}).expect(201)).body.proposal
 clock=new Date(clock.getTime()+2*60_000)
 const done=await request(timed).post('/api/completions').set(auth).send({proposalId:proposal.id,workshop:{version:2,contentRevision:c.revision,passion:'logique',answers:Object.fromEntries(c.tasks.map(t=>[t.id,t.solution]))}}).expect(201)
 expect(done.body.stats).toMatchObject({totalCoins:30,monthCoins:30,totalMinutes:2,monthMinutes:2,totalActivities:1})
 expect(done.body.stats.byPassion[0]).toMatchObject({coins:30,minutes:2,activities:1})
 // Recalcul de l'historique à la lecture, sans modifier les récompenses stockées.
 clock=new Date('2026-11-01T10:00:00Z')
 const me=await request(timed).get('/api/me').set(auth).expect(200)
 expect(me.body.stats).toMatchObject({totalCoins:30,monthCoins:0,totalMinutes:2,monthMinutes:0,totalActivities:1,monthActivities:0})
 expect(await db.prisma.completion.findUnique({where:{id:done.body.completion.id}})).toMatchObject({coins:30})
})
