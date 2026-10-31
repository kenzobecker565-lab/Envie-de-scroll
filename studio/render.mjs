/**
 * Rendu d'un épisode du studio en MP4 (1080 × 1920, 30 i/s, H.264 + AAC).
 *
 *   node render.mjs 03_la_flaque                 → build/03_la_flaque.mp4
 *   node render.mjs 03_la_flaque --stills=1,5.5  → build/03_la_flaque/stills/*.png
 *   node render.mjs 03_la_flaque --sheet         → build/03_la_flaque/planche.png (une image par seconde)
 *   node render.mjs 03_la_flaque --audio         → refait seulement la bande son
 *   options : --workers=4  --draft (540 × 960)  --safe (zones Shorts dessinées)
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { renderEpisodeAudio } from './audio/score.mjs'
import { serve } from './server.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const args = Object.fromEntries(
  process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.slice(2).split('=')
    return [k, v]
  }),
)
const ep = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!ep) {
  console.log('Épisodes :', fs.readdirSync(path.join(here, 'episodes')).map((f) => f.replace(/\.js$/, '')).join(', '))
  process.exit(1)
}
const build = path.join(here, 'build')
const epBuild = path.join(build, ep)
fs.mkdirSync(epBuild, { recursive: true })
const W = args.draft ? 540 : 1080
const H = args.draft ? 960 : 1920

function run(cmd, cmdArgs, { input } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, { stdio: [input ? 'pipe' : 'ignore', 'pipe', 'pipe'] })
    let err = ''
    child.stderr.on('data', (d) => (err += d))
    child.stdout.on('data', () => {})
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve(err) : reject(new Error(`${cmd} a échoué (${code})\n${err.slice(-3000)}`))))
    if (input) input(child.stdin)
  })
}

async function openPages(count) {
  const server = await serve(0)
  const browser = await chromium.launch()
  const errors = []
  const shots = []
  let meta = {}
  for (let k = 0; k < count; k++) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: W / 1080 })
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    await page.goto(`http://127.0.0.1:${server.address().port}/studio/editor/player.html?ep=${ep}${args.safe ? '&safe' : ''}`)
    try {
      await page.waitForFunction(() => window.__studio, null, { timeout: 20000 })
      await page.evaluate(() => window.__studio.ready)
      meta = await page.evaluate(() => ({ duration: window.__studio.duration, fps: window.__studio.fps }))
    } catch (e) {
      errors.push(e.message)
    }
    shots.push(async (t) => {
      const url = await page.evaluate((x) => window.__studio.seek(x), t)
      return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64') // JPEG
    })
  }
  const close = async () => {
    await browser.close()
    server.close()
  }
  if (errors.length) {
    await close()
    throw new Error(`Erreurs dans la page :\n${errors.join('\n')}`)
  }
  return { shots, close, ...meta }
}

async function stills(times) {
  const dir = path.join(epBuild, 'stills')
  fs.mkdirSync(dir, { recursive: true })
  const { shots, close } = await openPages(1)
  for (const t of times) {
    const f = path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.jpg`)
    fs.writeFileSync(f, await shots[0](t))
    console.log(f)
  }
  await close()
}

async function sheet() {
  const dir = path.join(epBuild, 'sheet')
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
  const { shots, close, duration } = await openPages(1)
  const step = Number(args.step ?? 1)
  let i = 0
  for (let t = 0; t < duration; t += step) fs.writeFileSync(path.join(dir, `${String(i++).padStart(3, '0')}.jpg`), await shots[0](t + 0.01))
  await close()
  const cols = 8
  const out = path.join(epBuild, 'planche.png')
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(dir, '%03d.jpg'), '-vf', `scale=180:320,tile=${cols}x${Math.ceil(i / cols)}:padding=4:color=0x222222`, '-frames:v', '1', out])
  console.log(out)
}

async function audioArgs() {
  const wav = await renderEpisodeAudio(ep)
  const m = await run(FFMPEG, ['-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
  const s = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1))
  const ln = `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`
  return { wav, args: ['-af', `${ln},aresample=48000`, '-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] }
}

async function video() {
  const a = await audioArgs()
  const out = path.join(build, `${ep}${args.draft ? '_brouillon' : ''}.mp4`)
  const workers = Number(args.workers ?? 3)
  const { shots, close, duration, fps } = await openPages(workers)
  const frames = Math.round(duration * fps)
  const started = Date.now()
  await run(
    FFMPEG,
    ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', a.wav,
      '-vf', `scale=${W}:${H}:out_color_matrix=bt709:out_range=tv,format=yuv420p`,
      // réglages conseillés par YouTube : H.264 High, 2 images B, image clé toutes les 0,5 s
      '-c:v', 'libx264', '-preset', args.draft ? 'veryfast' : 'medium', '-crf', '15', '-tune', 'animation', '-profile:v', 'high', '-bf', '2', '-g', String(Math.round(fps / 2)),
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      ...a.args, '-movflags', '+faststart', '-shortest', out],
    {
      input: async (stdin) => {
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
              if (written % 30 === 0) process.stdout.write(`\rImage ${written}/${frames}`)
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
else if (args.audio) console.log(await renderEpisodeAudio(ep))
else await video()
