import { chromium } from '/home/user/Envie-de-scroll/promo/node_modules/playwright/index.mjs'
import { mkdirSync } from 'node:fs'
const [D, mode] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()))
await p.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: "@font-face{font-family:'Nunito';font-weight:200 1000;src:url(file:///home/user/Envie-de-scroll/node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2) format('woff2')}" }))
await p.goto('file://' + D + '/story.html#render'); await p.waitForFunction(() => typeof window.seek === 'function'); await p.waitForTimeout(300)
const story = p.locator('#story')
if (mode === 'keys') {
  for (const t of [300, 900, 1250, 1900, 3000, 3700, 4300, 4700, 5100, 5800, 6600, 7300, 7900, 8600, 10000]) { await p.evaluate(t => seek(t), t); await story.screenshot({ path: `${D}/k${t}.jpg`, quality: 80 }) }
} else {
  mkdirSync(D + '/frames', { recursive: true })
  for (let i = 0; i < 300; i++) { await p.evaluate(t => seek(t), i * 1000 / 30); await story.screenshot({ path: `${D}/frames/f${String(i).padStart(4, '0')}.jpg`, quality: 94 }) }
}
console.log(errs)
await b.close()
