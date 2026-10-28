/**
 * Capture d'une page du studio (tests visuels).
 *   node tools/shot.mjs <chemin depuis la racine du dépôt> <sortie.png> [largeur] [hauteur]
 */
import { chromium } from 'playwright'
import { serve } from '../server.mjs'

const [page, out, w = '1600', h = '1000'] = process.argv.slice(2)
const server = await serve(0)
const browser = await chromium.launch()
const p = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } })
const errors = []
p.on('pageerror', (e) => errors.push(e.message))
p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await p.goto(`http://127.0.0.1:${server.address().port}/${page}`)
try {
  await p.waitForFunction(() => window.done, null, { timeout: 20000 })
} catch (e) {
  errors.push(String(e))
}
await p.screenshot({ path: out })
await browser.close()
server.close()
if (errors.length) console.error(errors.join('\n'))
