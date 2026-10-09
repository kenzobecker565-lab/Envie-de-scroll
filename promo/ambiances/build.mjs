/**
 * ============================================================================
 *  Les ambiances sonores de l'app (app/public/music/)
 * ============================================================================
 * - Huit morceaux de Kevin MacLeod (incompetech.com), sous licence Creative
 *   Commons Attribution 4.0 : téléchargés, raccourcis à 3 minutes environ
 *   (fondu de fin), mis au même volume (−16 LUFS) et encodés en MP3 96 kb/s.
 * - La pluie : synthétisée ici (bruit filtré, gouttes, gouttière), en boucle
 *   de 90 s sans couture.
 * - Le jazz noir (jazz-noir.mp3, généré avec vidIQ) est déjà dans l'app.
 *
 * La liste des ambiances (noms, crédits) est dans shared/src/ambiances.ts.
 *
 *   node ambiances/build.mjs            → app/public/music/*.mp3
 *   node ambiances/build.mjs pluie      → seulement la pluie
 */

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, reverb, writeWav } from '../dsp.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.resolve(here, '../../app/public/music')
const CACHE = path.resolve(here, '../build/ambiances')
const FFMPEG = process.env.FFMPEG || 'ffmpeg'
const LOUDNESS = -16
const MAX_SECONDS = 180

/** Les morceaux : fichier de l'app ← titre chez incompetech.com, et où couper. */
const TRACKS = [
  { id: 'lofi', title: 'Study And Relax', file: 'Study And Relax.mp3' },
  { id: 'piano', title: 'Gymnopedie No. 1', file: 'Gymnopedie No 1.mp3' },
  { id: 'bossa', title: 'Bossa Antigua', file: 'Bossa Antigua.mp3' },
  { id: 'acoustique', title: 'Almost Bliss', file: 'Almost Bliss.mp3' },
  { id: 'synthwave', title: 'Chill Wave', file: 'Chill Wave.mp3' },
  { id: '8bit', title: 'Airship Serenity', file: 'Airship Serenity.mp3' },
  // Après 2 min 50, le morceau s'éteint presque : on s'arrête avant.
  { id: 'ambient', title: 'Equatorial Complex', file: 'Equatorial Complex.mp3', end: 166 },
  { id: 'tropical', title: 'Moonlight Beach', file: 'Moonlight Beach.mp3' },
]

function run(args, { capture = false } = {}) {
  const result = spawnSync(FFMPEG, args, { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (result.status !== 0) throw new Error(`ffmpeg a échoué : ${result.error?.message ?? result.stderr.slice(-2000)}`)
  return capture ? result.stderr : ''
}

function duration(file) {
  const info = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr
  const [, h, m, s] = info.match(/Duration: (\d+):(\d+):([\d.]+)/)
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

/** Encode en MP3 96 kb/s, au volume commun (deux passes de loudnorm). */
function encode(input, filters, output) {
  const chain = filters.length ? `${filters.join(',')},` : ''
  const measure = run(['-hide_banner', '-i', input, '-af', `${chain}loudnorm=I=${LOUDNESS}:TP=-1.5:LRA=11:print_format=json`, '-f', 'null', '-'], { capture: true })
  const s = JSON.parse(measure.slice(measure.lastIndexOf('{'), measure.lastIndexOf('}') + 1))
  const loudnorm = `loudnorm=I=${LOUDNESS}:TP=-1.5:LRA=11:measured_I=${s.input_i}:measured_TP=${s.input_tp}:measured_LRA=${s.input_lra}:measured_thresh=${s.input_thresh}:offset=${s.target_offset}:linear=true`
  run(['-hide_banner', '-loglevel', 'error', '-y', '-i', input, '-vn', '-af', `${chain}${loudnorm},aresample=44100`, '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '96k', output])
  const kb = Math.round(fs.statSync(output).size / 1024)
  console.log(`${path.basename(output)} : ${kb} Ko (${s.input_i} → ${LOUDNESS} LUFS)`)
}

/* ------------------------------------------------------------ les morceaux */

async function buildTrack(track) {
  fs.mkdirSync(CACHE, { recursive: true })
  const source = path.join(CACHE, track.file)
  if (!fs.existsSync(source)) {
    const url = `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(track.file)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`${track.title} : ${response.status} (${url})`)
    fs.writeFileSync(source, Buffer.from(await response.arrayBuffer()))
  }
  const total = duration(source)
  // Un morceau à peine plus long que 3 min garde sa propre fin.
  const end = track.end ?? (total > MAX_SECONDS + 15 ? MAX_SECONDS : total)
  // Coupé avant sa fin : fondu de 5 s.
  const filters = end < total - 0.5 ? [`atrim=0:${end}`, `afade=t=out:st=${end - 5}:d=5`] : []
  encode(source, filters, path.join(OUT, `${track.id}.mp3`))
}

/* ------------------------------------------------------------- la pluie */

let seed = 0x9a1e
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1

/**
 * La pluie : un fond de bruit filtré qui respire (rafales), un grondement très
 * bas, des centaines de gouttes (petit claquement + bulle qui monte), et une
 * gouttière qui goutte à côté. Rendue sur 96 s, puis bouclée : les 6 dernières
 * secondes se fondent dans les 6 premières.
 */
function rain() {
  const LOOP = 90
  const FADE = 6
  const N = Math.round((LOOP + FADE) * SR)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  const wetL = new Float32Array(N)
  const wetR = new Float32Array(N)

  // Le fond : un bruit par oreille, aigu atténué, qui monte et descend doucement.
  const bed = [0, 1].map(() => [new Biquad('highpass', 380, 0.7), new Biquad('lowpass', 6500, 0.6), new Biquad('peaking', 2400, 0.8, 3)])
  const rumble = [new Biquad('highpass', 45, 0.7), new Biquad('lowpass', 160, 0.7), new Biquad('lowpass', 160, 0.7)]
  const phase = rand() * TAU
  for (let j = 0; j < N; j++) {
    const t = j / SR
    const gust = 0.78 + 0.14 * Math.sin(TAU * 0.047 * t + phase) + 0.08 * Math.sin(TAU * 0.13 * t + 2 * phase)
    const [fl, fr] = bed
    const l = fl.reduce((v, f) => f.process(v), noise())
    const r = fr.reduce((v, f) => f.process(v), noise())
    const low = rumble.reduce((v, f) => f.process(v), noise())
    L[j] = (l * 0.22 + low * 0.1) * gust
    R[j] = (r * 0.22 + low * 0.1) * gust
  }

  /** Une goutte : claquement filtré, puis bulle dont la note monte. */
  const drop = (t0, gain, pan, f0, decay) => {
    const s0 = Math.round(t0 * SR)
    const n = Math.round(decay * 6 * SR)
    const click = new Biquad('bandpass', Math.min(9000, f0 * 2.2), 1.2)
    const gl = Math.cos(((pan + 1) * Math.PI) / 4)
    const gr = Math.sin(((pan + 1) * Math.PI) / 4)
    let ph = 0
    for (let i = 0; i < n && s0 + i < N; i++) {
      const t = i / SR
      ph += (TAU * f0 * (1 + 0.9 * Math.min(1, t / (decay * 3)))) / SR
      const v = click.process(noise()) * Math.exp(-t / 0.0012) * 1.4 + Math.sin(ph) * Math.exp(-t / decay) * 0.35
      L[s0 + i] += v * gain * gl
      R[s0 + i] += v * gain * gr
      wetL[s0 + i] += v * gain * gl * 0.5
      wetR[s0 + i] += v * gain * gr * 0.5
    }
  }
  // Des gouttes partout (légères), et de temps en temps une plus proche.
  for (let t = rand() * 0.02; t < LOOP + FADE; t += -Math.log(1 - rand()) / 55) {
    drop(t, 0.03 + 0.07 * rand() ** 2, rand() * 2 - 1, 900 + rand() * 3200, 0.004 + rand() * 0.01)
  }
  for (let t = rand(); t < LOOP + FADE; t += -Math.log(1 - rand()) / 3) {
    drop(t, 0.12 + 0.13 * rand(), rand() * 1.6 - 0.8, 700 + rand() * 1600, 0.01 + rand() * 0.012)
  }
  // La gouttière : une goutte presque régulière, à droite ; une autre, plus loin, à gauche.
  for (let t = 0.4; t < LOOP + FADE; t += 1.35 + (rand() - 0.5) * 0.25) drop(t, 0.14, 0.65, 620 + rand() * 60, 0.03)
  for (let t = 1.1; t < LOOP + FADE; t += 2.2 + (rand() - 0.5) * 0.5) drop(t, 0.07, -0.7, 820 + rand() * 80, 0.025)

  const [vl, vr] = reverb([wetL, wetR], { room: 0.7, damp: 0.5 })
  for (let j = 0; j < N; j++) {
    L[j] += vl[j] * 0.35
    R[j] += vr[j] * 0.35
  }

  // La boucle : la fin se fond dans le début (à puissance constante).
  const n = Math.round(LOOP * SR)
  const f = Math.round(FADE * SR)
  const outL = L.slice(0, n)
  const outR = R.slice(0, n)
  for (let i = 0; i < f; i++) {
    const p = i / f
    const a = Math.sqrt(p)
    const b = Math.sqrt(1 - p)
    outL[i] = L[i] * a + L[n + i] * b
    outR[i] = R[i] * a + R[n + i] * b
  }
  const wav = path.join(CACHE, 'pluie.wav')
  fs.mkdirSync(CACHE, { recursive: true })
  writeWav(wav, outL, outR, rand)
  encode(wav, [], path.join(OUT, 'pluie.mp3'))
}

/* ---------------------------------------------------------------- départ */

const only = process.argv.slice(2)
const wanted = (id) => only.length === 0 || only.includes(id)
fs.mkdirSync(OUT, { recursive: true })
for (const track of TRACKS) if (wanted(track.id)) await buildTrack(track)
if (wanted('pluie')) rain()
