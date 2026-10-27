/**
 * Filme les passages de l'app qui complètent le tournage de la vidéo virale
 * (../viral/capture-take.mjs, à lancer avant) : l'arrivée d'un nouvel
 * utilisateur, « Une autre idée », les réglages (musique et thèmes), la
 * galerie et le détail d'une création.
 *
 * Même méthode : enregistrement d'écran de Chromium (CDP), rééchantillonné à
 * 30 images/s. Chaque passage a son dossier et ses repères (marks.json).
 *
 *   node presentation/capture.mjs [passage…] → build/presentation/<passage>/*.jpg
 *                                              et build/presentation/ecrans/*.jpg
 *
 * Les images fixes : une activité par passion (dessin, écriture, musique,
 * cinéma).
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '../build/presentation')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const FPS = 30
const sketch = path.resolve(here, '../build/viral/croquis.png')

// `node presentation/capture.mjs ecrans gallery` : seulement ces passages.
const only = process.argv.slice(2)
const wanted = (name) => only.length === 0 || only.includes(name)

const browser = await chromium.launch()

async function call(user, pathname, init = {}) {
  const headers = { Authorization: `dev ${user}`, 'X-Timezone': 'Europe/Paris', ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) }
  const response = await fetch(BASE + pathname, { ...init, headers })
  if (!response.ok) throw new Error(`${pathname} ${response.status} ${await response.text()}`)
  return response.status === 204 ? null : response.json()
}

/** Un profil avec quelques créations (textes et un dessin). */
async function seedProfile(user) {
  await call(user, '/api/me/passions', { method: 'PUT', body: JSON.stringify({ passions: ['dessin', 'ecriture', 'musique'] }) })
  const texts = ['Il pleuvait sur la ville comme on tourne les pages d’un livre qu’on connaît par cœur.', 'Le métro sentait le café et la pluie. Personne ne regardait son téléphone.']
  for (const [i, duration] of [30, 15].entries()) {
    const { proposal } = await call(user, '/api/proposals', { method: 'POST', body: JSON.stringify({ passion: 'ecriture', mood: 'souffler', duration }) })
    await call(user, '/api/completions', { method: 'POST', body: JSON.stringify({ proposalId: proposal.id, text: texts[i] }) })
  }
  const { proposal } = await call(user, '/api/proposals', { method: 'POST', body: JSON.stringify({ passion: 'dessin', mood: 'ennui', duration: 15 }) })
  const form = new FormData()
  form.set('proposalId', proposal.id)
  form.set('photo', new Blob([fs.readFileSync(sketch)], { type: 'image/png' }), 'croquis.png')
  await call(user, '/api/completions', { method: 'POST', body: form })
}

/** Filme un passage : `steps(page, api)` joue le parcours en temps réel. */
async function record(name, user, steps) {
  if (!wanted(name)) return
  const dir = path.join(out, name)
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: 'light' })
  const page = await context.newPage()
  page.on('pageerror', (error) => console.error(name, 'pageerror', error.message))
  await page.goto(`${BASE}/?dev_user=${user}`)
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(2200)

  const cdp = await context.newCDPSession(page)
  const shots = []
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    shots.push({ t: metadata.timestamp, data })
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 })
  await page.waitForTimeout(300)
  const t0 = Date.now() / 1000
  const marks = {}
  const taps = []
  const api = {
    mark: (label) => (marks[label] = Date.now() / 1000 - t0),
    wait: (ms) => page.waitForTimeout(ms),
    async tap(locator, hold = 110) {
      await locator.scrollIntoViewIfNeeded()
      const box = await locator.boundingBox()
      if (!box) throw new Error(`${name} : élément introuvable`)
      const x = box.x + box.width / 2
      const y = box.y + box.height * 0.6
      taps.push({ t: Date.now() / 1000 - t0, x: x * 2, y: y * 2 })
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.waitForTimeout(hold)
      await page.mouse.up()
    },
  }
  await steps(page, api)
  api.mark('end')
  await cdp.send('Page.stopScreencast')
  shots.sort((a, b) => a.t - b.t)
  let k = 0
  let frame = 0
  for (let time = 0; time <= marks.end; time += 1 / FPS, frame++) {
    while (k + 1 < shots.length && shots[k + 1].t - t0 <= time) k++
    fs.writeFileSync(path.join(dir, `${String(frame).padStart(4, '0')}.jpg`), Buffer.from(shots[k].data, 'base64'))
  }
  const toFrame = (t) => Math.round(t * FPS)
  const meta = {
    fps: FPS,
    frames: frame,
    marks: Object.fromEntries(Object.entries(marks).map(([label, t]) => [label, toFrame(t)])),
    taps: taps.map((tap) => ({ frame: toFrame(tap.t), x: Math.round(tap.x), y: Math.round(tap.y) })),
  }
  fs.writeFileSync(path.join(dir, 'marks.json'), JSON.stringify(meta, null, 2))
  console.log(`${name} : ${frame} images`, meta.marks)
  await context.close()
}

const fresh = () => String(800000 + Math.floor(Math.random() * 99999))

// 1 · L'arrivée : bienvenue, puis le choix des passions.
await record('onboarding', fresh(), async (page, { mark, wait, tap }) => {
  mark('welcome')
  await wait(1200)
  await tap(page.getByRole('button', { name: 'C’est parti', exact: true }))
  await page.getByRole('heading', { name: /vibrer/ }).waitFor()
  mark('passions')
  await wait(900)
  for (const passion of ['Dessin', 'Écriture', 'Musique']) {
    await tap(page.getByRole('button', { name: new RegExp(`^${passion}`) }))
    await wait(450)
  }
  mark('go')
  await tap(page.getByRole('button', { name: 'C’est parti', exact: true }))
  await page.getByRole('button', { name: 'J’ai envie de scroller' }).waitFor()
  mark('home')
  await wait(1600)
})

// 2 · « Une autre idée » : l'activité change.
{
  const user = fresh()
  await call(user, '/api/me/passions', { method: 'PUT', body: JSON.stringify({ passions: ['ecriture'] }) })
  await record('reroll', user, async (page, { mark, wait, tap }) => {
    await tap(page.getByRole('button', { name: 'J’ai envie de scroller' }))
    await page.getByRole('heading', { name: /Comment tu te sens/ }).waitFor()
    await tap(page.getByRole('radio', { name: /besoin de souffler/ }))
    await page.getByRole('heading', { name: /combien de temps/ }).waitFor()
    await tap(page.getByRole('radio', { name: /^5\s*min/ }))
    await page.getByRole('button', { name: 'Valider', exact: true }).waitFor()
    mark('activity')
    await wait(2000)
    mark('reroll')
    await tap(page.getByRole('button', { name: /Une autre idée/ }))
    await wait(2200)
  })
}

// 3 · Les réglages : la musique, puis les thèmes ; 4 · la galerie.
{
  const user = fresh()
  await seedProfile(user)
  await record('settings', user, async (page, { mark, wait, tap }) => {
    mark('home')
    await wait(800)
    mark('music')
    await tap(page.getByRole('button', { name: /musique d’ambiance/ }))
    await wait(700)
    await tap(page.getByRole('button', { name: /musique d’ambiance/ }))
    await wait(500)
    mark('open')
    await tap(page.getByRole('button', { name: /Réglages/ }))
    await wait(1300)
    mark('nuit')
    await tap(page.getByRole('radio', { name: /Pop Nuit/ }))
    await wait(1100)
    mark('bd')
    await tap(page.getByRole('radio', { name: /^BD/ }))
    await wait(1100)
    mark('memphis')
    await tap(page.getByRole('radio', { name: /Memphis/ }))
    await wait(1100)
    mark('pop')
    await tap(page.getByRole('radio', { name: /^Pop \(par défaut\)|^Pop$/ }))
    await wait(900)
  })
  await record('gallery', user, async (page, { mark, wait, tap }) => {
    mark('home')
    await wait(500)
    await tap(page.getByRole('button', { name: /Ma galerie/ }))
    await page.getByRole('heading', { name: 'Ta galerie' }).waitFor()
    mark('gallery')
    await wait(1500)
    mark('scroll')
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 70)
      await wait(60)
    }
    await wait(500)
    mark('detail')
    await tap(page.locator('button[aria-haspopup=dialog]').filter({ hasText: 'métro' }).first())
    await wait(1800)
  })
}

// 5 · Une activité par passion (images fixes).
if (wanted('ecrans')) {
  const dir = path.join(out, 'ecrans')
  fs.mkdirSync(dir, { recursive: true })
  const moods = { dessin: /m’ennuie/, ecriture: /besoin de souffler/, musique: /besoin de souffler/, cinema: /m’ennuie/ }
  for (const passion of ['dessin', 'ecriture', 'musique', 'cinema']) {
    const user = fresh()
    await call(user, '/api/me/passions', { method: 'PUT', body: JSON.stringify({ passions: [passion] }) })
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: 'light' })
    const page = await context.newPage()
    await page.goto(`${BASE}/?dev_user=${user}`)
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => document.fonts.ready)
    await page.getByRole('button', { name: 'J’ai envie de scroller' }).click()
    await page.getByRole('heading', { name: /Comment tu te sens/ }).waitFor()
    await page.getByRole('radio', { name: moods[passion] }).click()
    await page.getByRole('heading', { name: /combien de temps/ }).waitFor()
    await page.getByRole('radio', { name: passion === 'dessin' || passion === 'ecriture' ? /^15\s*min/ : /^30\s*min/ }).click()
    await page.getByRole('button', { name: 'Valider', exact: true }).waitFor()
    await page.waitForTimeout(1600)
    await page.screenshot({ path: path.join(dir, `${passion}.jpg`), quality: 92 })
    console.log('image fixe :', passion)
    await context.close()
  }
}

await browser.close()
