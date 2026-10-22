import {afterAll, describe, expect, it} from 'vitest'
import request from 'supertest'
import {loadConfig} from '../src/config.ts'
import {createApp} from '../src/http/app.ts'
import {createGuestSession, verifyGuestSession} from '../src/auth/guest.ts'
import {createTestDatabase, testClock} from './helpers.ts'
const db = createTestDatabase(), clock = testClock()
afterAll(db.cleanup)
const app = (guestAuth = true) => createApp({prisma: db.prisma, config: {guestAuth, devAuth: false, botToken: undefined, signingSecret: 'test-guest-secret', initDataMaxAge: 86400, appDistDir: undefined}, photos: {target: 'local', open: async () => null, save: async () => 'unused', remove: async () => {}}, now: clock.now})
describe('Presentation guest profiles', () => {
  it('leaves production closed unless the demo is explicitly enabled', () => {
    expect(loadConfig({NODE_ENV:'production'}).guestAuth).toBe(false)
    expect(loadConfig({NODE_ENV:'production', RAILWAY_GIT_BRANCH:'develop'}).guestAuth).toBe(true)
    expect(loadConfig({NODE_ENV:'production', RAILWAY_GIT_BRANCH:'develop', GUEST_AUTH:'false'}).guestAuth).toBe(false)
    expect(loadConfig({NODE_ENV:'production', GUEST_AUTH:'true', DEV_AUTH:'true'}).devAuth).toBe(false)
  })
  it('rejects forged, expired and wrongly signed identities', () => {
    const token = createGuestSession('secret', clock.now())
    expect(verifyGuestSession(token, 'secret', clock.now())).toBeLessThan(0)
    expect(verifyGuestSession(token, 'wrong', clock.now())).toBeUndefined()
    expect(verifyGuestSession(token.replace(/^-[^.]+/, '-1'), 'secret', clock.now())).toBeUndefined()
    expect(verifyGuestSession(token, 'secret', new Date(clock.now().getTime() + 31 * 86400000))).toBeUndefined()
  })
  it('keeps profiles separate and stable, without allowing a chosen user id', async () => {
    const a = request.agent(app()), b = request.agent(app())
    await a.get('/api/me').expect(401)
    const session = await a.post('/api/guest-session').expect(200)
    expect(session.headers['set-cookie']![0]).toMatch(/HttpOnly/)
    expect(session.headers['set-cookie']![0]).toMatch(/SameSite=Strict/)
    await b.post('/api/guest-session').expect(200)
    const first = (await a.get('/api/me').expect(200)).body.user
    const other = (await b.get('/api/me').expect(200)).body.user
    expect(first.id).not.toBe(other.id)
    expect(BigInt(first.id)).toBeLessThan(0n)
    await a.put('/api/me/passions').send({passions:['dessin']}).expect(200)
    await a.post('/api/guest-session').expect(200)
    expect((await a.get('/api/me')).body.user.passions).toEqual(['dessin'])
    expect((await b.get('/api/me')).body.user.passions).toEqual([])
    await a.get('/api/me').set('Authorization', 'dev 1').expect(401)
    await a.post('/api/shop/test-credit').expect(403)
  })
  it('can be disabled and refuses cross-origin creation', async () => {
    await request(app(false)).post('/api/guest-session').expect(403)
    await request(app()).post('/api/guest-session').set('Origin', 'https://unrelated.example').expect(403)
  })
})
