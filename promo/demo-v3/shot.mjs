import { chromium } from 'playwright'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const root = '/home/user/Envie-de-scroll/promo'
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.css': 'text/css', '.woff2': 'font/woff2' }
const srv = http.createServer((q, s) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return } s.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d) }) }).listen(0)
const port = srv.address().port
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } })
p.on('console', (m) => console.log('console:', m.text())); p.on('pageerror', (e) => console.log('ERR', e.stack))
await p.goto(`http://localhost:${port}/${process.argv[2]}`)
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 })
for (const [i, arg] of process.argv.slice(4).entries()) {
  const [t, mode] = arg.split(':')
  console.log(await p.evaluate(([t, m]) => window.__shot(+t, m), [t, mode]))
  await p.screenshot({ path: `${process.argv[3]}-${i}.png` })
}
await b.close(); srv.close()
