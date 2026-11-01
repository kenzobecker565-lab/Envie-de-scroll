/**
 * La marque « Affaire Classée ? » (@affaireclassee0).
 *
 *   node proces/marque.mjs                       → proces/marque/ : photo de profil + calques PNG
 *   node proces/marque.mjs --video               → affaire n°1 : build/proces/proces.mp4
 *                                                  → build/proces/proces-marque.mp4
 *   node proces/marque.mjs --video=affaire-02    → n'importe quelle affaire : build/<dossier>/<dossier>.mp4
 *                                                  → build/<dossier>/<dossier>-marque.mp4
 *
 * Les images viennent de marque.html (photographiées par Chromium, fond
 * transparent pour les calques). L'incrustation se fait avec ffmpeg, sans
 * refaire le rendu 3D : le bandeau reste en haut pendant toute la vidéo, la
 * signature (tampon en grand + pseudo) apparaît sur l'écran de vote.
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', '..')
const out = path.join(here, 'marque')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end()
    const type = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2' }[path.extname(file)] ?? 'application/octet-stream'
    res.writeHead(200, { 'content-type': type })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

async function images() {
  fs.mkdirSync(out, { recursive: true })
  const server = await serve()
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined })
  for (const [v, w, h, transparent] of [['profil', 1080, 1080, false], ['bandeau', 1080, 1920, true], ['fin', 1080, 1920, true]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } })
    await page.goto(`http://127.0.0.1:${server.address().port}/promo/proces/marque.html?v=${v}`)
    await page.evaluate(() => document.fonts.ready)
    const file = path.join(out, v === 'profil' ? 'photo-de-profil.png' : `calque-${v}.png`)
    await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } })
    console.log(file)
  }
  await browser.close()
  server.close()
}

/** Incruste les calques dans la vidéo d'une affaire (dossier promo/<dir>, avec cues.js et timeline.json). */
async function video(dir) {
  const ep = path.join(here, '..', dir)
  const { makeCues } = await import(path.join(ep, 'cues.js'))
  const C = makeCues(JSON.parse(fs.readFileSync(path.join(ep, 'timeline.json'), 'utf8')))
  const vote = C.sections.find((s) => s.id === 'vote').t0 + 0.6
  const src = path.join(here, '..', 'build', dir, `${dir}.mp4`)
  const dst = path.join(here, '..', 'build', dir, `${dir}-marque.mp4`)
  // Le bandeau s'efface pendant la signature de fin (le tampon passe en grand).
  const filter =
    `[1:v]format=rgba,fade=t=out:st=${vote.toFixed(2)}:d=0.3:alpha=1[b];` +
    `[2:v]format=rgba,fade=t=in:st=${vote.toFixed(2)}:d=0.4:alpha=1[f];` +
    `[0:v][b]overlay=0:0[v1];[v1][f]overlay=0:0,format=yuv420p[v]`
  const args = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', src,
    '-loop', '1', '-i', path.join(out, 'calque-bandeau.png'),
    '-loop', '1', '-i', path.join(out, 'calque-fin.png'),
    '-filter_complex', filter,
    '-map', '[v]', '-map', '0:a', '-c:a', 'copy',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-tune', 'animation',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
    '-movflags', '+faststart', '-shortest', dst,
  ]
  const r = spawnSync(FFMPEG, args, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('ffmpeg a échoué')
  console.log(dst)
}

const arg = process.argv.find((a) => a.startsWith('--video'))
if (arg) await video(arg.includes('=') ? arg.split('=')[1] : 'proces')
else await images()
