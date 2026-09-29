/**
 * Captures de la vraie app pour la pub : un parcours complet, écran par écran,
 * en haute définition (390 × 844 points, ×3), avec la position des éléments
 * touchés (pour y animer les appuis du doigt).
 *
 * Prérequis : l'app lancée (`npm run dev` à la racine du dépôt).
 *   node pub/capture-app.mjs [http://localhost:5173/]
 * → build/pub/app/*.png et build/pub/app/zones.json
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, '..', 'build', 'pub', 'app')
const url = process.argv[2] ?? 'http://localhost:5173/'
const SCALE = 3

fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SCALE, locale: 'fr-FR', colorScheme: 'light' })
const page = await context.newPage()
const zones = {}

const settle = (ms = 700) => page.waitForTimeout(ms)
async function shot(name, { full = false } = {}) {
  await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: full })
  console.log(name)
}
/** Mémorise le rectangle d'un élément (en pixels de l'image, donc ×3). */
async function zone(name, locator) {
  const box = await locator.boundingBox()
  zones[name] = { x: box.x * SCALE, y: box.y * SCALE, w: box.width * SCALE, h: box.height * SCALE }
}

// Onboarding : un profil avec les passions montrées dans la pub.
await page.goto(url)
await page.getByRole('button', { name: 'C’est parti' }).click()
await page.getByPlaceholder('Ton prénom').fill('Léa')
await page.getByRole('button', { name: 'Continuer' }).click()
await page.getByRole('heading', { name: /Qu’est-ce qui te passionne/ }).waitFor()
for (const passion of [/^.*Dessin$/, /Musique/, /^.*Cuisine$/, /^.*Sport$/]) await page.getByRole('button', { name: passion }).first().click()
await page.getByRole('button', { name: /Continuer avec 4 passions/ }).click()
await page.getByRole('heading', { name: /Tout est prêt/ }).waitFor()
await page.getByRole('button', { name: 'C’est parti !' }).click()

// Accueil
const bigButton = page.getByRole('button', { name: /J’ai envie\s*de scroller/ })
await bigButton.waitFor()
await settle(900)
await zone('bouton', bigButton)
await shot('01-accueil')

// Humeur
await bigButton.click()
await page.getByRole('heading', { name: 'Qu’est-ce qui se passe, là ?' }).waitFor()
await settle()
await zone('ennui', page.getByRole('button', { name: /Ennui/ }))
await shot('02-humeur')
await page.getByRole('button', { name: /Ennui/ }).click()

// Passion
await page.getByRole('heading', { name: 'Quelle passion te tente maintenant ?' }).waitFor()
await settle()
await zone('dessin', page.getByRole('button', { name: /Dessin/ }))
await shot('03-passion')
await page.getByRole('button', { name: /Dessin/ }).click()

// Durée
await page.getByRole('heading', { name: 'Tu as combien de temps ?' }).waitFor()
await settle()
await zone('cinqMinutes', page.getByRole('button', { name: /^5 minutes/ }))
await shot('04-duree')
await page.getByRole('button', { name: /^5 minutes/ }).click()

// Activité proposée
await page.getByRole('heading', { name: 'Ton idée du moment' }).waitFor()
await settle(900)
await zone('carte', page.locator('article').first())
await zone('cestFait', page.getByRole('button', { name: 'C’est fait, je l’enregistre' }))
console.log('   activité :', await page.locator('article h2').innerText())
await shot('05-activite')

// Envie transformée
await page.getByRole('button', { name: 'C’est fait, je l’enregistre' }).click()
await page.getByRole('heading', { name: 'Envie transformée !' }).waitFor()
await settle(1200)
await shot('06-bravo')
await page.getByRole('button', { name: 'Terminer' }).click()
await bigButton.waitFor()
await settle(900)
await shot('07-accueil-apres')

// Progression (écran visible, puis page entière pour la faire défiler dans la pub)
await page.getByRole('link', { name: 'Progrès' }).click()
await page.getByRole('heading', { name: 'Ta progression' }).waitFor()
await settle(900)
await shot('08-progres')
await shot('08-progres-complet', { full: true })

fs.writeFileSync(path.join(out, 'zones.json'), JSON.stringify(zones, null, 2))
console.log('zones :', Object.keys(zones).join(', '))
await browser.close()
