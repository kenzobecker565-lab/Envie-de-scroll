/**
 * Filme la vraie app, image par image, pour la vidéo virale.
 *
 * L'enregistrement d'écran de Chromium (CDP, Page.startScreencast) reçoit
 * chaque image affichée par l'app, en haute définition (780 × 1688), avec son
 * horodatage. Le parcours est joué en temps réel (vraies animations, vrai
 * serveur), puis les images sont rééchantillonnées à 30 images/s.
 *
 * Prérequis : l'app lancée en local (`npm run dev` à la racine du dépôt),
 * avec l'authentification de développement (par défaut sans BOT_TOKEN).
 *
 *   node viral/capture-take.mjs      → build/viral/take/*.jpg, marks.json, themes/*.jpg
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(here, '../build/viral')
const BASE = process.env.APP_URL ?? 'http://localhost:5173'
const FPS = 30
const USER = String(700000 + Math.floor(Math.random() * 99999))
const headers = { Authorization: `dev ${USER}`, 'X-Timezone': 'Europe/Paris' }

fs.rmSync(path.join(out, 'take'), { recursive: true, force: true })
fs.rmSync(path.join(out, 'themes'), { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'take'), { recursive: true })
fs.mkdirSync(path.join(out, 'themes'), { recursive: true })

const browser = await chromium.launch()

/* ------------------------------------------------ 1. Le dessin (une photo) */

const sketch = path.join(out, 'croquis.png')
{
  const page = await browser.newPage({ viewport: { width: 900, height: 1125 }, deviceScaleFactor: 1 })
  const mug = [
    'M150 150 L150 380 Q150 432 202 432 L358 432 Q410 432 410 380 L410 150',
    'M150 150 C150 116 410 116 410 150 C410 184 150 184 150 150 Z',
    'M410 205 C505 200 505 345 410 340',
    'M410 238 C458 238 458 306 410 304',
    'M150 418 Q108 424 88 446 Q280 500 472 446 Q452 424 410 418',
    'M252 268 C252 244 282 242 290 262 C298 242 328 244 328 268 C328 296 290 312 290 322 C290 312 252 296 252 268 Z',
    'M348 214 L398 176', 'M348 250 L398 212', 'M348 286 L398 248', 'M348 322 L398 284', 'M348 358 L398 320', 'M352 392 L398 356',
    'M230 104 C205 76 252 60 228 26', 'M282 96 C257 68 304 52 280 18', 'M334 104 C309 76 356 60 332 26',
  ]
  const lines = Array.from({ length: 30 }, (_, i) => `<line x1="0" x2="900" y1="${60 + i * 38}" y2="${60 + i * 38}" stroke="#bcd4ee" stroke-width="2"/>`).join('')
  await page.setContent(`<body style="margin:0"><svg width="900" height="1125" viewBox="0 0 900 1125">
    <rect width="900" height="1125" fill="#fbf8ef"/>${lines}<line x1="110" x2="110" y1="0" y2="1125" stroke="#f3b6b0" stroke-width="3"/>
    <g transform="translate(150 260) scale(1.25) rotate(-3 280 250)" fill="none" stroke="#2d2d33" stroke-linecap="round" stroke-linejoin="round">
      ${mug.map((d, i) => `<path d="${d}" stroke-width="${i > 5 ? 4 : 6}" opacity="${i > 5 ? 0.8 : 0.95}"/>`).join('')}
    </g>
    <text x="560" y="1020" font-family="cursive" font-size="44" fill="#2d2d33" opacity="0.8">ma tasse ♡</text>
  </svg></body>`)
  await page.screenshot({ path: sketch })
  await page.close()
}

/* ------------------------------------------------ 2. Un profil déjà bien rempli */

async function call(pathname, init = {}) {
  const response = await fetch(BASE + pathname, { ...init, headers: { ...headers, ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...init.headers } })
  if (!response.ok) throw new Error(`${pathname} ${response.status} ${await response.text()}`)
  return response.status === 204 ? null : response.json()
}

await call('/api/me/passions', { method: 'PUT', body: JSON.stringify({ passions: ['dessin', 'ecriture', 'musique'] }) })
const TEXTS = [
  'La lampe du bureau fait une petite flaque jaune sur la table. Dehors, quelqu’un rit.',
  'Il pleuvait sur la ville comme on tourne les pages d’un livre qu’on connaît par cœur.',
  'Mon voisin arrose ses plantes à trois heures du matin. Je crois qu’il leur parle.',
  'Le métro sentait le café et la pluie. Personne ne regardait son téléphone.',
  'Une tasse, un rayon de soleil, et soudain rien ne presse.',
]
for (const [i, duration] of [30, 30, 15, 15, 5].entries()) {
  const { proposal } = await call('/api/proposals', { method: 'POST', body: JSON.stringify({ passion: 'ecriture', mood: 'souffler', duration }) })
  await call('/api/completions', { method: 'POST', body: JSON.stringify({ proposalId: proposal.id, text: TEXTS[i] }) })
}
{
  const { proposal } = await call('/api/proposals', { method: 'POST', body: JSON.stringify({ passion: 'dessin', mood: 'ennui', duration: 15 }) })
  const form = new FormData()
  form.set('proposalId', proposal.id)
  form.set('photo', new Blob([fs.readFileSync(sketch)], { type: 'image/png' }), 'croquis.png')
  await call('/api/completions', { method: 'POST', body: form })
}
// 95 + 15 = 110 pièces : la démo en ajoute 15 (dessin, 15 min) et franchit le palier des 2 heures.
const me = await call('/api/me')
console.log(`Profil de démo : ${me.stats.totalCoins} pièces, ${me.stats.totalActivities} activités`)

/* ------------------------------------------------ 3. Le tournage */

// Enregistrement d'écran de Chromium (CDP) : chaque image affichée par l'app
// arrive avec son horodatage ; on les rééchantillonne ensuite à 30 images/s.
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: 'light' })
const page = await context.newPage()
page.on('pageerror', (error) => console.error('pageerror', error.message))

await page.goto(`${BASE}/?dev_user=${USER}`)
await page.getByRole('button', { name: 'J’ai envie de scroller' }).waitFor()
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(2500)

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
const mark = (name) => (marks[name] = Date.now() / 1000 - t0)
const film = (ms) => page.waitForTimeout(ms)
async function tap(locator, { hold = 110 } = {}) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()
  if (!box) throw new Error('Élément introuvable pour le tap')
  const x = box.x + box.width / 2
  const y = box.y + box.height * 0.62
  // Position du doigt, en pixels de l'image filmée (×2).
  taps.push({ t: Date.now() / 1000 - t0, x: x * 2, y: y * 2 })
  await page.mouse.move(x, y)
  await page.mouse.down()
  await film(hold)
  await page.mouse.up()
}

mark('home')
await film(1000)
mark('press')
await tap(page.getByRole('button', { name: 'J’ai envie de scroller' }), { hold: 180 })
mark('signal')
await page.getByRole('heading', { name: /Comment tu te sens/ }).waitFor()
mark('mood')
await film(700)
mark('moodTap')
await tap(page.getByRole('radio', { name: /procrastine/ }))
await page.getByRole('heading', { name: /combien de temps/ }).waitFor()
mark('time')
await film(600)
mark('timeTap')
await tap(page.getByRole('radio', { name: /15\s*min/ }))
await page.getByRole('heading', { name: /envie de/ }).waitFor()
mark('passion')
await film(600)
mark('passionTap')
await tap(page.getByRole('radio', { name: /^Dessin/ }))
await page.getByRole('button', { name: 'Valider', exact: true }).waitFor()
mark('activity')
await film(2600)
mark('validate')
await tap(page.getByRole('button', { name: 'Valider', exact: true }))
await page.getByRole('heading', { name: /Montre-nous/ }).waitFor()
mark('proof')
await film(500)
await page.locator('input[type=file]').setInputFiles(sketch)
await page.getByRole('img', { name: /Aperçu/ }).waitFor()
mark('photo')
await film(900)
mark('save')
await tap(page.getByRole('button', { name: 'Enregistrer mon dessin' }))
await page.getByRole('heading', { name: 'Activité enregistrée.' }).waitFor()
mark('done')
await film(3400)
mark('rate')
await tap(page.getByRole('radio', { name: /J’ai adoré/ }))
await film(900)
mark('toGallery')
await tap(page.getByRole('button', { name: /Voir ma galerie/ }))
await page.getByRole('heading', { name: 'Ta galerie' }).waitFor()
mark('gallery')
await film(1600)
mark('scroll')
for (let i = 0; i < 14; i++) {
  await page.mouse.wheel(0, 55)
  await film(60)
}
await film(700)
mark('end')
await cdp.send('Page.stopScreencast')

// Rééchantillonnage : pour chaque image à 30 images/s, la dernière image affichée.
shots.sort((a, b) => a.t - b.t)
const duration = marks.end
let k = 0
let frame = 0
for (let time = 0; time <= duration; time += 1 / FPS, frame++) {
  while (k + 1 < shots.length && shots[k + 1].t - t0 <= time) k++
  fs.writeFileSync(path.join(out, 'take', `${String(frame).padStart(4, '0')}.jpg`), Buffer.from(shots[k].data, 'base64'))
}
const frameMarks = Object.fromEntries(Object.entries(marks).map(([name, t]) => [name, Math.round(t * FPS)]))
const frameTaps = taps.map((tap) => ({ frame: Math.round(tap.t * FPS), x: Math.round(tap.x), y: Math.round(tap.y) }))
fs.writeFileSync(path.join(out, 'marks.json'), JSON.stringify({ fps: FPS, frames: frame, width: 780, height: 1688, marks: frameMarks, taps: frameTaps }, null, 2))
console.log(`Tournage : ${frame} images (${shots.length} images d’écran reçues)`, frameMarks)
await context.close()

/* ------------------------------------------------ 4. La galerie dans chaque thème */

for (const theme of ['pop', 'nuit', 'bd', 'memphis']) {
  await call('/api/me/theme', { method: 'PUT', body: JSON.stringify({ theme }) })
  const themed = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: 'light' })
  const p = await themed.newPage()
  await p.goto(`${BASE}/?dev_user=${USER}`)
  await p.getByRole('button', { name: 'J’ai envie de scroller' }).waitFor()
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(2200)
  await p.screenshot({ path: path.join(out, 'themes', `home-${theme}.jpg`), type: 'jpeg', quality: 90 })
  await p.getByRole('button', { name: /Ma galerie/ }).click()
  await p.getByRole('heading', { name: 'Ta galerie' }).waitFor()
  await p.waitForTimeout(2200)
  await p.screenshot({ path: path.join(out, 'themes', `gallery-${theme}.jpg`), type: 'jpeg', quality: 90 })
  await themed.close()
}
await call('/api/me/theme', { method: 'PUT', body: JSON.stringify({ theme: 'pop' }) })
console.log('Thèmes : 8 images')
await browser.close()
