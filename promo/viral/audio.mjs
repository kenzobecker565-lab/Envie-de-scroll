/**
 * ============================================================================
 *  Bande-son de la vidéo virale : la musique (vidIQ) et les bruitages
 * ============================================================================
 * La musique (media/musique-vidiq.mp3, morceau original libre de droits,
 * généré avec vidIQ) donne le tempo : 120 BPM, premier temps à 0,23 s.
 * Par-dessus, chaque action a son bruitage, synthétisé ici (aucun sample) :
 * notifications, impact sur « 2 MOIS », balayages du fil, tic-tac pendant le
 * break, clic à chaque tap, déclic de la photo, pièces, confettis, fouets
 * entre les thèmes, accord final. La musique baisse un peu sous les impacts.
 *
 *   node viral/audio.mjs [fichier.wav]
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, expInterp, filterBus, limit, loudness, mtof, reverb, writeWav } from '../dsp.mjs'
import { DURATION, T } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const N = Math.ceil(DURATION * SR)

let seed = 0x7a11
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const newBus = () => [new Float32Array(N), new Float32Array(N)]

function place(targets, t0, len, render, pan = 0) {
  const s0 = Math.round(t0 * SR)
  const n = Math.round(len * SR)
  const a = ((pan + 1) * Math.PI) / 4
  const gl = Math.SQRT2 * Math.cos(a)
  const gr = Math.SQRT2 * Math.sin(a)
  for (let i = 0; i < n; i++) {
    const j = s0 + i
    const v = render(i, i / SR)
    if (j < 0 || j >= N) continue
    for (const [bus, g] of targets) {
      bus[0][j] += v * g * gl
      bus[1][j] += v * g * gr
    }
  }
}

const B = { sfx: newBus(), verb: newBus() }
/** Moments où la musique s'efface un peu (impacts), avec leur profondeur. */
const ducks = []

/* ------------------------------------------------------------ la musique */

function loadMusic() {
  const ffmpeg = process.env.FFMPEG || 'ffmpeg'
  const file = path.join(HERE, 'media', 'musique-vidiq.mp3')
  const result = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 })
  if (result.status !== 0) throw new Error(`Lecture de la musique impossible : ${result.stderr}`)
  const data = new Float32Array(result.stdout.buffer, result.stdout.byteOffset, result.stdout.byteLength / 4)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  for (let j = 0; j < N && 2 * j + 1 < data.length; j++) {
    L[j] = data[2 * j]
    R[j] = data[2 * j + 1]
  }
  return [L, R]
}

/* ------------------------------------------------------------ bruitages */

function sweep(t0, len, { f0, f1, fmid = null, q = 1.4, shape = 'bell', gain = 0.3, pan = 0, send = 0.2 }) {
  const bp = new Biquad('bandpass', f0, q)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, len, (i, t) => {
    const p = t / len
    if (i % 8 === 0) {
      const f = fmid ? (p < 0.5 ? expInterp(f0, fmid, p * 2) : expInterp(fmid, f1, p * 2 - 1)) : expInterp(f0, f1, p)
      bp.set('bandpass', f, q)
    }
    let env
    if (shape === 'bell') env = Math.sin(Math.PI * p) ** 1.6
    else if (shape === 'rise') env = p ** 2.2 * (p > 0.97 ? (1 - p) / 0.03 : 1)
    else env = Math.exp(-p * 5) * Math.min(1, t / 0.01)
    return bp.process(noise()) * env * 2.2
  }, pan)
}

function pop(t0, gain = 0.25, f0 = 1100, f1 = 300, pan = 0) {
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.15]], t0, 0.12, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / 0.035))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.04) * Math.min(1, t / 0.001)
  }, pan)
}

function tick(t0, gain = 0.08, f = 2600, pan = 0) {
  const hp = new Biquad('highpass', 3000)
  place([[B.sfx, gain]], t0, 0.04, (i, t) => (hp.process(noise()) * 0.6 + Math.sin(TAU * f * t)) * Math.exp(-t / 0.008), pan)
}

function boom(t0, gain = 0.6, f0 = 62, f1 = 36, decay = 0.9) {
  let ph = 0
  place([[B.sfx, gain]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
}

function crash(t0, gain = 0.3, len = 1.6) {
  const hp = new Biquad('highpass', 3800, 0.7)
  const bp = new Biquad('bandpass', 7500, 0.9)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
    const n = hp.process(noise())
    return (0.7 * n + 0.8 * bp.process(n)) * Math.exp(-t / (len * 0.34)) * Math.min(1, t / 0.002)
  })
}

function thud(t0, gain = 0.3, f0 = 110) {
  let ph = 0
  const lp = new Biquad('lowpass', 500)
  place([[B.sfx, gain]], t0, 0.2, (i, t) => {
    ph += (TAU * expInterp(f0, 48, clamp(t / 0.08))) / SR
    return (Math.sin(ph) + 0.3 * lp.process(noise())) * Math.exp(-t / 0.05)
  })
}

/** Clic de bouton « qui s'enfonce » (et petit coup sourd, comme un retour haptique). */
function thock(t0, gain = 0.4) {
  tick(t0, gain * 0.5, 1700)
  const bp = new Biquad('bandpass', 900, 1.8)
  let ph = 0
  place([[B.sfx, gain]], t0, 0.18, (i, t) => {
    ph += (TAU * expInterp(160, 62, clamp(t / 0.07))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.05) + bp.process(noise()) * 1.2 * Math.exp(-t / 0.012)
  })
}

function slap(t0, gain = 0.35, pitch = 1, pan = 0) {
  const lp = new Biquad('lowpass', 2600 * pitch, 0.9)
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.12]], t0, 0.16, (i, t) => {
    ph += (TAU * expInterp(210 * pitch, 80 * pitch, clamp(t / 0.05))) / SR
    return lp.process(noise()) * 1.6 * Math.exp(-t / 0.018) + Math.sin(ph) * 0.8 * Math.exp(-t / 0.045)
  }, pan)
}

function bell(t0, midi, gain = 0.12, { pan = 0, decay = 1.1, ratio = 3.5, index = 2.6, send = 0.45 } = {}) {
  const f = mtof(midi)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, decay * 3.5, (i, t) => {
    const I = index * Math.exp(-t / 0.18)
    return Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t)) * Math.exp(-t / decay) * Math.min(1, t / 0.0015) * 0.8
  }, pan)
}

/** Notification de téléphone : deux notes douces. */
function ping(t0, gain = 0.1, pan = 0) {
  bell(t0, 88, gain, { decay: 0.25, ratio: 2, index: 0.8, send: 0.1, pan })
  bell(t0 + 0.09, 93, gain * 0.9, { decay: 0.35, ratio: 2, index: 0.8, send: 0.1, pan })
}

function coin(t0, gain = 0.12, f0 = 2300, pan = 0) {
  const P = [[1, 1, 0.22], [2.41, 0.6, 0.12], [3.93, 0.4, 0.08], [5.34, 0.25, 0.05]]
  for (const [dt, g] of [[0, 1], [0.035, 0.55]]) {
    place([[B.sfx, gain * g], [B.verb, gain * g * 0.3]], t0 + dt, 0.7, (i, t) => {
      let v = 0
      for (const [r, a, d] of P) v += a * Math.sin(TAU * f0 * r * t) * Math.exp(-t / d)
      return v * Math.min(1, t / 0.0008) * 0.5
    }, pan)
  }
}

function confettiSfx(t0, gain = 0.3, pan = 0) {
  const bp = new Biquad('bandpass', 1400, 0.9)
  place([[B.sfx, gain], [B.verb, gain * 0.25]], t0, 0.08, (i, t) => bp.process(noise()) * 3 * Math.exp(-t / 0.012), pan)
  const hp = new Biquad('bandpass', 4500, 0.8)
  place([[B.sfx, gain * 0.35]], t0 + 0.02, 1.1, (i, t) => {
    const flutter = 0.5 + 0.5 * Math.sin(TAU * (28 + 9 * Math.sin(TAU * 1.3 * t)) * t)
    return hp.process(noise()) * flutter * Math.exp(-t / 0.35) * Math.min(1, t / 0.03)
  }, pan)
}

function shutter(t0, gain = 0.25) {
  for (const [dt, g] of [[0, 1], [0.045, 0.7]]) {
    const hp = new Biquad('highpass', 2500)
    place([[B.sfx, gain * g]], t0 + dt, 0.05, (i, t) => (hp.process(noise()) * 1.4 + Math.sin(TAU * 1250 * t) * 0.5) * Math.exp(-t / 0.007))
  }
}

/** Tic-tac d'horloge (pendant le break). */
function clockTick(t0, gain = 0.12, high = true) {
  const bp = new Biquad('bandpass', high ? 3200 : 2400, 4)
  place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, 0.06, (i, t) => bp.process(noise()) * 3 * Math.exp(-t / 0.006) + Math.sin(TAU * (high ? 1900 : 1500) * t) * 0.4 * Math.exp(-t / 0.01))
}

/* ================================================================ partition */

function score() {
  // 1 · L'accroche : ça vibre et ça tinte déjà ; « 2 MOIS » claque.
  ping(0.0, 0.12, -0.3)
  sweep(0.02, 0.2, { f0: 700, fmid: 3500, f1: 1400, gain: 0.1, pan: 0.2 })
  ping(0.3, 0.09, 0.4)
  pop(T.hook, 0.18, 900, 300)
  boom(T.stat, 0.6, 90, 38, 0.35)
  thud(T.stat, 0.45, 150)
  slap(T.stat, 0.5, 0.8)
  crash(T.stat, 0.22, 1.2)
  ducks.push([T.stat, 0.5])
  slap(T.stat + 0.02, 0.25, 0.6, -0.4) // novembre englouti
  slap(T.stat + 0.14, 0.25, 0.55, 0.4) // décembre
  pop(T.perYear, 0.2, 1000, 350)
  pop(T.screens, 0.16, 1200, 400)
  tick(T.source, 0.05, 2800)
  for (let k = 0; k < 6; k++) tick(0.6 + k * 0.45, 0.03, 3200 + k * 100, k % 2 ? 0.4 : -0.4) // le calendrier qui s'effeuille

  // 2 · Le fil : un balayage par post, un pop par « Scroll. »
  const swipes = [3.73, 4.23, 4.73, 5.23, 5.73, 5.98, 6.23, 6.48, 6.73, 6.98, 7.23, 7.36, 7.48, 7.6]
  swipes.forEach((s, k) => sweep(s - 0.08, 0.22, { f0: 600 + k * 30, fmid: 3400 + k * 80, f1: 1500, gain: 0.12 + k * 0.006, pan: 0.2 }))
  T.scrolls.forEach((t, i) => pop(t + 0.01, 0.16, 900 + i * 120, 300))
  ;[4.6, 6.1].forEach((t, i) => ping(t, 0.05, i ? 0.5 : -0.5)) // des notifications, au loin
  pop(T.encore, 0.14, 1000, 400)
  pop(T.encore2, 0.14, 1100, 400)
  pop(T.question, 0.16, 800, 300)
  pop(T.question2, 0.2, 1300, 500)

  // 3 · Le break : tout se fige, une horloge fait tic-tac.
  sweep(T.pause - 0.02, 0.3, { f0: 3000, f1: 200, shape: 'fall', gain: 0.25, q: 1.5 })
  thud(T.pause, 0.3, 90)
  for (let k = 0; k < 4; k++) clockTick(T.pause + 0.25 + k * 0.5, 0.14, k % 2 === 0)
  pop(T.pauseText, 0.12, 700, 250)
  pop(T.pauseText2, 0.16, 900, 300)
  sweep(T.reveal - 0.45, 0.47, { f0: 300, f1: 8000, shape: 'rise', gain: 0.35, q: 0.8 })

  // 4 · La vraie app.
  crash(T.reveal, 0.3)
  boom(T.reveal, 0.45, 80, 40, 0.4)
  slap(T.reveal + 0.02, 0.45, 1)
  ducks.push([T.reveal, 0.45])
  ;[T.tapCta, T.tapMood, T.tapTime, T.tapPassion, T.tapValidate, T.tapSave, T.tapRate, T.tapGallery].forEach((t) => thock(t, 0.5))
  pop(T.tapCta + 0.02, 0.2, 1400, 500)
  bell(T.tapMood + 0.05, 84, 0.05, { decay: 0.5, pan: -0.3 })
  bell(T.tapTime + 0.05, 88, 0.05, { decay: 0.5 })
  bell(T.tapPassion + 0.05, 91, 0.05, { decay: 0.5, pan: 0.3 })
  sweep(T.activity - 0.05, 0.35, { f0: 400, fmid: 2600, f1: 700, gain: 0.12 })
  ;[79, 84, 88].forEach((m, i) => bell(T.idea + i * 0.07, m + 12, 0.035, { decay: 0.6, pan: -0.4 + i * 0.4 }))
  shutter(T.photo + 0.05, 0.35) // la photo du dessin
  sweep(T.done - 0.1, 0.3, { f0: 3000, f1: 400, shape: 'fall', gain: 0.14 })
  confettiSfx(T.done + 0.35, 0.3, -0.4)
  confettiSfx(T.done + 0.37, 0.3, 0.4)
  for (let k = 0; k < 14; k++) coin(T.coins + k * 0.07 + rand() * 0.04, 0.05 + rand() * 0.03, 1900 + rand() * 1200, rand() * 2 - 1)
  ducks.push([T.coins, 0.3])
  ;[72, 76, 79, 84, 88].forEach((m, i) => bell(T.milestone + i * 0.06, m + 12, 0.04, { decay: 0.8, pan: -0.5 + i * 0.25 }))
  pop(T.rule, 0.14, 1000, 350)
  slap(T.noGuilt, 0.3, 1.1)
  pop(T.tapGallery + 0.2, 0.14, 1200, 400)

  // 5 · Les thèmes : un fouet et un déclic à chaque changement.
  T.themes.forEach((t, i) => {
    sweep(t - 0.18, 0.2, { f0: 900, fmid: 5000, f1: 1200, gain: 0.2, q: 1.1, pan: i % 2 ? 0.4 : -0.4 })
    if (i > 0) shutter(t, 0.28)
    slap(t + 0.02, 0.25, 1 + i * 0.1)
  })

  // 6 · La fin.
  sweep(T.end - 0.05, 0.45, { f0: 4000, f1: 250, shape: 'bell', gain: 0.22, q: 0.9 })
  pop(T.end + 0.3, 0.3, 500, 150)
  ;[72, 76, 79, 84].forEach((m, i) => bell(T.end + 0.35 + i * 0.05, m + 12, 0.05, { decay: 1, pan: -0.4 + i * 0.27 }))
  pop(T.endLine, 0.18, 900, 300)
  slap(T.end + 0.55, 0.45, 0.9)
  pop(T.cta + 0.05, 0.22, 800, 250)
  boom(T.final, 0.55, 80, 38, 0.7)
  crash(T.final, 0.4, 1.5)
  ;[60, 64, 67, 72, 76, 79, 84].forEach((m, i) => bell(T.final + 0.02 + i * 0.03, m + 12, 0.045, { decay: 1.1, pan: Math.sin(i * 1.9) * 0.8, index: 1.6 }))
  confettiSfx(T.final, 0.3, -0.4)
  confettiSfx(T.final + 0.02, 0.3, 0.4)
  ducks.push([T.final, 0.35])
}

/* ================================================================== mixage */

export function renderAudio() {
  seed = 0x7a11
  ducks.length = 0
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  score()
  const [mL, mR] = loadMusic()

  // La musique s'efface un peu sous les gros impacts, puis revient.
  const gain = new Float32Array(N).fill(1)
  for (const [t0, depth] of ducks) {
    const s0 = Math.round(t0 * SR)
    for (let i = 0; i < 0.6 * SR && s0 + i < N; i++) {
      const t = i / SR
      gain[s0 + i] = Math.min(gain[s0 + i], 1 - depth * Math.min(1, t / 0.01) * Math.exp(-t / 0.18))
    }
  }
  // Fin : la musique se retire après l'accord final.
  const fade0 = T.final + 0.05
  for (let j = Math.round(fade0 * SR); j < N; j++) gain[j] *= Math.max(0, 1 - (j / SR - fade0) / 0.45) ** 1.5

  const verb = reverb(B.verb)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  for (let j = 0; j < N; j++) {
    L[j] = mL[j] * 0.9 * gain[j] + B.sfx[0][j] * 1.1 + verb[0][j] * 0.45
    R[j] = mR[j] * 0.9 * gain[j] + B.sfx[1][j] * 1.1 + verb[1][j] * 0.45
  }
  const fadeStart = DURATION - 0.3
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const g = Math.cos((Math.PI / 2) * Math.min(1, (j / SR - fadeStart) / 0.3)) ** 2
    L[j] *= g
    R[j] *= g
  }
  filterBus([L, R], [['highpass', 30, 0.7]])
  const ceiling = 10 ** (-1.5 / 20)
  for (let pass = 0; pass < 3; pass++) {
    const g = 10 ** ((-14 - loudness(L, R)) / 20)
    for (let j = 0; j < N; j++) {
      L[j] *= g
      R[j] *= g
    }
    limit(L, R, ceiling)
  }
  return [L, R]
}

export function writeAudio(file) {
  const [L, R] = renderAudio()
  writeWav(file, L, R, rand)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(HERE, '..', 'build', 'viral', 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
