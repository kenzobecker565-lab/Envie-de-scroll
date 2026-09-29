/**
 * Rendu de la pub, image par image, puis encodage MP4 (H.264 + AAC).
 *
 *   node render.mjs                     → build/plutot-que-scroller-15s.mp4
 *   node render.mjs --stills=0.5,4.2    → build/stills/*.png (vérifications)
 *   node render.mjs --sheet             → build/planche.png (planche contact)
 *   node render.mjs --audio             → refait seulement la bande-son de la vidéo
 *
 * Il faut Chromium via Playwright (`npx playwright install chromium`) et
 * ffmpeg (dans le PATH, ou désigné par la variable d'environnement FFMPEG).
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DURATION, FPS, HEIGHT, WIDTH } from './cues.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const build = path.join(here, 'build')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = 'true'] = arg.replace(/^--/, '').split('=')
    return [key, value]
  }),
)

// ------------------------------------------------ petit serveur de fichiers

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.wav': 'audio/wav',
}

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const file = path.join(root, url)
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end()
      return
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)))
}

// --------------------------------------------------------------- utilitaires

function run(cmd, cmdArgs, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (d) => (stderr += d))
    child.stdout.on('data', () => {})
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(stderr) : reject(new Error(`${cmd} a échoué (${code})\n${stderr.slice(-3000)}`))))
    if (input) input(child.stdin)
  })
}

/**
 * Ouvre `count` onglets sur la pub. Chaque image ne dépend que de son instant :
 * plusieurs onglets peuvent donc rendre des images différentes en parallèle.
 */
async function openPages(count = 1) {
  const server = await serve()
  const browser = await chromium.launch()
  const errors = []
  const close = async () => {
    await browser.close()
    server.close()
  }
  const shots = []
  for (let k = 0; k < count; k++) {
    const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 })
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto(`http://127.0.0.1:${server.address().port}/promo/index.html?render`)
    try {
      await page.waitForFunction(() => window.__promo, null, { timeout: 15000 })
      await page.evaluate(() => window.__promo.ready)
    } catch (error) {
      errors.push(error.message)
    }
    shots.push(async (t) => {
      await page.evaluate((time) => window.__promo.seek(time), t)
      return page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } })
    })
  }
  if (errors.length) {
    await close()
    throw new Error(`Erreurs dans la page :\n${errors.join('\n')}`)
  }
  return { shots, shot: shots[0], close }
}

// -------------------------------------------------------------------- modes

async function stills(times) {
  const dir = path.join(build, 'stills')
  fs.mkdirSync(dir, { recursive: true })
  const { shot, close } = await openPages()
  for (const t of times) {
    const file = path.join(dir, `t${t.toFixed(3).padStart(6, '0')}.png`)
    fs.writeFileSync(file, await shot(t))
    console.log(file)
  }
  await close()
}

async function sheet() {
  const dir = path.join(build, 'sheet')
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const { shot, close } = await openPages()
  const step = Number(args.step ?? 0.25)
  let i = 0
  for (let t = 0; t < DURATION; t += step) fs.writeFileSync(path.join(dir, `${String(i++).padStart(3, '0')}.png`), await shot(t))
  await close()
  const cols = 10
  const rows = Math.ceil(i / cols)
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(dir, '%03d.png'), '-vf', `scale=216:384,tile=${cols}x${rows}:padding=6:color=0x222222`, '-frames:v', '1', path.join(build, 'planche.png')])
  console.log(path.join(build, 'planche.png'))
}

/** Bande-son (musique, bruitages, voix off) + filtre de sonie visant −14 LUFS. */
async function makeAudio() {
  fs.mkdirSync(build, { recursive: true })
  const wav = path.join(build, 'audio.wav')
  const { writeAudio } = await import('./audio.mjs')
  writeAudio(wav)
  console.log(`Bande-son : ${wav}`)
  // Mesure de la sonie, pour viser −14 LUFS (standard des réseaux sociaux).
  const measure = await run(FFMPEG, ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
  const stats = JSON.parse(measure.slice(measure.lastIndexOf('{'), measure.lastIndexOf('}') + 1))
  const loudnorm = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`
  return { wav, audioArgs: ['-af', `${loudnorm},aresample=48000`, '-c:a', 'aac', '-b:a', '192k'] }
}

/** Remplace seulement la piste son d'une vidéo déjà rendue (sans refaire les images). */
async function remux() {
  const video = path.join(build, args.out ?? 'plutot-que-scroller-15s.mp4')
  if (!fs.existsSync(video)) throw new Error(`Aucune vidéo à ${video} : lance d'abord « npm run render ».`)
  const { wav, audioArgs } = await makeAudio()
  const tmp = `${video}.tmp.mp4`
  await run(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', ...audioArgs, '-movflags', '+faststart', '-shortest', tmp])
  fs.renameSync(tmp, video)
  console.log(`Nouvelle bande-son → ${video}`)
}

async function video() {
  const fps = Number(args.fps ?? FPS)
  const { wav, audioArgs } = await makeAudio()
  const out = path.join(build, args.out ?? 'plutot-que-scroller-15s.mp4')
  const workers = Number(args.workers ?? 3)
  const { shots, close } = await openPages(workers)
  const frames = Math.round(DURATION * fps)
  const started = Date.now()
  await run(
    FFMPEG,
    [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-i', wav,
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-tune', 'animation',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      ...audioArgs,
      '-movflags', '+faststart', '-shortest', out,
    ],
    {
      input: async (stdin) => {
        // Les onglets rendent en parallèle ; les images partent vers ffmpeg dans l'ordre.
        const ready = new Map()
        let next = 0
        let written = 0
        let writing = Promise.resolve()
        const pump = () =>
          (writing = writing.then(async () => {
            while (ready.has(written)) {
              const png = ready.get(written)
              ready.delete(written)
              if (!stdin.write(png)) await new Promise((r) => stdin.once('drain', r))
              written++
              if (written % 60 === 0) process.stdout.write(`\rImage ${written}/${frames}`)
            }
          }))
        const worker = async (shot) => {
          for (;;) {
            const i = next++
            if (i >= frames) return
            while (i - written > workers * 4) await new Promise((r) => setTimeout(r, 10))
            ready.set(i, await shot(i / fps))
            pump()
          }
        }
        await Promise.all(shots.map(worker))
        await pump()
        stdin.end()
      },
    },
  )
  await close()
  console.log(`\rTerminé en ${((Date.now() - started) / 1000).toFixed(0)} s → ${out}`)
}

if (args.stills) await stills(args.stills.split(',').map(Number))
else if (args.sheet) await sheet()
else if (args.audio) await remux()
else await video()
