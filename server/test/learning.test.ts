import { beforeEach, afterEach, it, expect } from 'vitest'
import request from 'supertest'
import { emptyLearningWork, learningLesson } from '@scroll-up/shared'
import { createApp } from '../src/http/app.ts'
import { createPhotoService } from '../src/photos/photos.ts'
import { createTestDatabase, TEST_BOT_TOKEN } from './helpers.ts'
let db: ReturnType<typeof createTestDatabase>, app: ReturnType<typeof createApp>
const auth = { Authorization: 'dev 42' },
  other = { Authorization: 'dev 43' },
  id = 'a-learning-entry-0001',
  url = '/api/learning/' + id
beforeEach(() => {
  db = createTestDatabase()
  app = createApp({
    prisma: db.prisma,
    config: {
      botToken: TEST_BOT_TOKEN,
      devAuth: true,
      initDataMaxAge: 0,
      signingSecret: 'test',
      appDistDir: undefined,
    },
    photos: createPhotoService({ telegram: undefined, storageChatId: undefined, localDir: db.dir + '/photos' }),
  })
})
afterEach(async () => db.cleanup())
it('sauvegarde les versions complètes et isole les carnets des comptes et des activités scroll', async () => {
  const body = {
    lessonId: 'learn-v1-ecriture-1',
    work: { ...emptyLearningWork(), first: 'Premier jet', final: 'Un texte complet.\n'.repeat(400) },
  }
  await request(app).put(url).set(auth).send(body).expect(200)
  const read = await request(app).get(url).set(auth).expect(200)
  expect(read.body.work).toEqual(body.work)
  const list = await request(app).get('/api/learning').set(auth).expect(200)
  expect(list.body.items).toHaveLength(1)
  expect(list.body.items[0]).not.toHaveProperty('work')
  expect(list.body.items[0].attempted).toBe(true)
  await request(app).get(url).set(other).expect(404)
  await request(app).put(url).set(other).send(body).expect(404)
  expect((await request(app).get('/api/learning').set(other)).body.items).toEqual([])
  expect(await db.prisma.completion.count()).toBe(0)
  const me = await request(app).get('/api/me').set(auth)
  expect(me.body.stats.totalActivities).toBe(0)
  expect(me.body.stats.totalCoins).toBe(0)
  await db.prisma.user.delete({ where: { id: 42n } })
  expect(await db.prisma.learningEntry.count()).toBe(0)
})
it('fige un essai terminé, permet une répétition réseau identique et calcule le résultat côté serveur', async () => {
  const lesson = learningLesson('learn-v1-logique-7')!,
    work = {
      ...emptyLearningWork(),
      step: 3,
      completed: true,
      answers: Object.fromEntries(lesson.tasks.map((t) => [t.id, t.solution])),
      checked: lesson.tasks.map((t) => t.id),
    }
  const body = { lessonId: lesson.id, work }
  const saved = await request(app).put(url).set(auth).send(body).expect(200)
  expect(saved.body.mastered).toBe(true)
  await request(app).put(url).set(auth).send(body).expect(200)
  await request(app)
    .put(url)
    .set(auth)
    .send({ ...body, work: { ...work, notebook: 'modifié' } })
    .expect(409)
  const consulted = await request(app)
    .put('/api/learning/another-learning-0001')
    .set(auth)
    .send({ lessonId: lesson.id, work: { ...emptyLearningWork(), step: 3, completed: true }, mastered: true })
    .expect(200)
  expect(consulted.body.mastered).toBe(false)
  expect(consulted.body.attempted).toBe(false)
  const list = (await request(app).get('/api/learning').set(auth)).body.items
  expect(list.find((entry: {id:string}) => entry.id === 'another-learning-0001').attempted).toBe(false)
  expect(list.every((entry: object) => !('work' in entry))).toBe(true)
})
it('refuse un carnet malformé, une substitution de leçon et une requête sans authentification', async () => {
  await request(app).put(url).send({}).expect(401)
  await request(app)
    .put(url)
    .set(auth)
    .send({ lessonId: 'learn-v1-dessin-1', work: { ...emptyLearningWork(), ink: [{ points: [{ x: -1, y: 2 }] }] } })
    .expect(400)
  await request(app).put(url).set(auth).send({ lessonId: 'learn-v1-dessin-1', work: emptyLearningWork() }).expect(200)
  await request(app).put(url).set(auth).send({ lessonId: 'learn-v1-piano-1', work: emptyLearningWork() }).expect(400)
})
it('n’ouvre une création ciblée qu’à son propriétaire', async () => {
  await request(app)
    .put('/api/me/passions')
    .set(auth)
    .send({ passions: ['ecriture'] })
    .expect(200)
  const proposal = await request(app)
    .post('/api/proposals')
    .set(auth)
    .send({ passion: 'ecriture', duration: 5 })
    .expect(201)
  const done = await request(app)
    .post('/api/completions')
    .set(auth)
    .send({ proposalId: proposal.body.proposal.id, text: 'Texte intégral de mon activité.' })
    .expect(201)
  const endpoint = '/api/completions/' + done.body.completion.id
  const read = await request(app).get(endpoint).set(auth).expect(200)
  expect(read.body.completion.text).toBe('Texte intégral de mon activité.')
  await request(app).get(endpoint).set(other).expect(404)
})

it('retire et rétablit une révision sans modifier le travail ni fabriquer une réussite', async () => {
 const work = { ...emptyLearningWork(), first: 'Mon essai initial', final: 'Mon essai conservé', completed: true, review: true, step: 3 }
 const body = { lessonId: 'learn-v1-ecriture-1', work }
 const before = (await request(app).put(url).set(auth).send(body).expect(200)).body
 const stored = await db.prisma.learningEntry.findUniqueOrThrow({where:{id}})
 const endpoint = url + '/review'
 await request(app).patch(endpoint).send({review:false}).expect(401)
 await request(app).patch(endpoint).set(other).send({review:false}).expect(404)
 await request(app).patch(endpoint).set(auth).send({review:'false'}).expect(400)
 const acquired = (await request(app).patch(endpoint).set(auth).send({review:false,mastered:true,work:{final:'écrasé'}}).expect(200)).body
 expect(acquired.review).toBe(false)
 expect(acquired.work).toEqual(before.work)
 expect(acquired.mastered).toBe(before.mastered)
 expect((await request(app).get('/api/learning').set(auth)).body.items[0].review).toBe(false)
 // Une répétition de l'enregistrement original ne restaure pas l'ancien statut.
 expect((await request(app).put(url).set(auth).send(body).expect(200)).body.review).toBe(false)
 expect((await db.prisma.learningEntry.findUniqueOrThrow({where:{id}})).work).toBe(stored.work)
 await request(app).put(url).set(auth).send({...body,work:{...work,final:'Autre contenu'}}).expect(409)
 expect((await request(app).patch(endpoint).set(auth).send({review:true}).expect(200)).body.review).toBe(true)
})
it('réserve le changement de statut aux essais conservés', async () => {
 await request(app).put(url).set(auth).send({lessonId:'learn-v1-ecriture-1',work:emptyLearningWork()}).expect(200)
 await request(app).patch(url+'/review').set(auth).send({review:false}).expect(409)
 await request(app).patch('/api/learning/absent-learning-0001/review').set(auth).send({review:false}).expect(404)
})
