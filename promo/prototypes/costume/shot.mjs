import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve('../../..')
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const type = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(p)] ?? 'application/octet-stream'
  fs.readFile(p, (e, d) => (e ? (res.writeHead(404), res.end()) : (res.writeHead(200, { 'content-type': type }), res.end(d))))
}).listen(0)
const port = server.address().port
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' })
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
pg.on('pageerror', (e) => console.log('ERR', e.message))
for (const mode of process.argv.slice(2)) {
  await pg.goto(`http://127.0.0.1:${port}/promo/prototypes/costume/index.html?mode=${mode}`)
  await pg.waitForFunction(() => window.done)
  await pg.evaluate(() => document.fonts.ready)
  await pg.screenshot({ path: `${mode}.png` })
  console.log(mode)
}
await b.close()
server.close()
