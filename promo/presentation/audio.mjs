/**
 * ============================================================================
 *  Bande-son de la présentation : voix off, musique, jazz noir, bruitages
 * ============================================================================
 * - La voix off (media/voix-off.mp3, générée avec vidIQ, voix « Sarah ») mène :
 *   la musique s'efface sous elle, puis revient entre les phrases.
 * - La musique (../viral/media/musique-vidiq.mp3, 120 BPM) : son break tombe
 *   sur « Et si on en reprenait un peu ? », sa reprise sur « Voici Scroll-up ».
 * - Sur « un petit air de jazz », elle s'arrête comme une bande qu'on freine,
 *   et le jazz noir de l'app prend le relais (../viral/media/jazz-noir-vidiq.mp3,
 *   le morceau de fond de l'app) ; elle revient d'un coup sur « Scroll-up ».
 * - Les bruitages sont synthétisés ici (les mêmes que la vidéo virale).
 *
 *   node presentation/audio.mjs [fichier.wav]
 */

import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { DURATION, MUSIC, T, VO_START } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const N = Math.ceil(DURATION * SR)

let seed = 0x5c0e
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

/* ------------------------------------------------------------ les fichiers */

/** Décode un fichier audio (ffmpeg) : canaux en Float32Array, à 48 kHz. */
function decode(file, channels) {
  const ffmpeg = process.env.FFMPEG || 'ffmpeg'
  const result = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', String(channels), '-ar', String(SR), '-'], { maxBuffer: 1 << 30 })
  if (result.status !== 0) throw new Error(`Lecture de ${file} impossible : ${result.error?.message ?? result.stderr}`)
  const data = new Float32Array(result.stdout.buffer, result.stdout.byteOffset, result.stdout.byteLength / 4)
  const n = data.length / channels
  return Array.from({ length: channels }, (_, c) => Float32Array.from({ length: n }, (_, j) => data[j * channels + c]))
}

/** Lit un canal à une position fractionnaire (en échantillons). */
function sampleAt(ch, pos) {
  const i = Math.floor(pos)
  if (i < 0 || i + 1 >= ch.length) return 0
  const f = pos - i
  return ch[i] * (1 - f) + ch[i + 1] * f
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

/** Petits frottements de stylo (« quelques mots »). */
function scribble(t0, len, gain = 0.06) {
  const bp = new Biquad('bandpass', 3200, 1.2)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const stroke = Math.max(0, Math.sin(TAU * 7.5 * t)) ** 0.6
    return bp.process(noise()) * stroke * Math.min(1, t / 0.02, (len - t) / 0.05) * 2
  }, 0.3)
}

/** Craquements de vinyle, sous le jazz. */
function crackle(t0, len, gain = 0.05) {
  const hp = new Biquad('highpass', 1800, 0.7)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const env = Math.min(1, t / 0.2, (len - t) / 0.15)
    const hiss = hp.process(noise()) * 0.05
    const pop = rand() < 0.0009 ? noise() * 3 : 0
    return (hiss + pop) * env
  })
}

function score() {
  // 1 · L'accroche : deux notifications ; « 2 MOIS » claque ; le calendrier plonge.
  ping(0.02, 0.1, -0.3)
  ping(0.3, 0.08, 0.4)
  slap(T.months, 0.35, 0.8)
  thud(T.months, 0.35, 150)
  boom(T.months, 0.35, 90, 38, 0.35)
  slap(T.months + 0.02, 0.18, 0.6, -0.4)
  slap(T.months + 0.14, 0.18, 0.55, 0.4)
  sweep(T.screens + 0.1, 0.4, { f0: 3000, f1: 300, shape: 'fall', gain: 0.14 })
  T.scrolls.forEach((s, k) => sweep(s - 0.08, 0.22, { f0: 600 + k * 30, fmid: 3400 + k * 80, f1: 1500, gain: 0.07 + k * 0.004, pan: 0.2 }))
  tick(T.average, 0.03, 2800)
  // Le break : tout se fige, une horloge fait tic-tac.
  sweep(T.pause - 0.02, 0.3, { f0: 3000, f1: 200, shape: 'fall', gain: 0.18, q: 1.5 })
  thud(T.pause, 0.22, 90)
  for (let k = 0; k < 4; k++) clockTick(T.pause + 0.25 + k * 0.5, 0.08, k % 2 === 0)
  sweep(T.reveal - 0.45, 0.47, { f0: 300, f1: 8000, shape: 'rise', gain: 0.25, q: 0.8 })

  // 2 · Voici Scroll-up ; la conversation avec le bot.
  crash(T.reveal, 0.22)
  boom(T.reveal, 0.35, 80, 40, 0.4)
  slap(T.reveal + 0.02, 0.3, 1)
  ducks.push([T.reveal, 0.35])
  slap(T.name, 0.3, 0.9)
  sweep(T.telegram - 0.32, 0.4, { f0: 400, fmid: 3000, f1: 900, gain: 0.12 })
  sweep(T.telegram + 0.03, 0.14, { f0: 1200, f1: 5000, shape: 'rise', gain: 0.07, q: 1.2 }) // message envoyé
  ping(T.telegram + 0.45, 0.07, -0.2) // réponse du bot
  pop(T.telegram + 0.8, 0.12, 1200, 450)
  thock(T.openApp, 0.32)
  sweep(T.openApp + 0.02, 0.38, { f0: 300, fmid: 2400, f1: 800, gain: 0.1 })

  // 3 · Les passions : un tap, une note qui monte.
  thock(T.start, 0.3)
  T.picks.forEach((t, i) => {
    thock(t, 0.3)
    bell(t + 0.04, [84, 88, 91][i], 0.045, { decay: 0.5, pan: -0.3 + i * 0.3 })
    pop(t + 0.05, 0.1, 1000 + i * 150, 400, i % 2 ? 0.5 : -0.5)
  })
  pop(T.cinema, 0.1, 1500, 500, 0.5)
  bell(T.cinema + 0.02, 96, 0.04, { decay: 0.5, pan: 0.3 })
  thock(T.go, 0.3)

  // 4 · « Ensuite » : un coup de fouet ; le pouce qui démange ; un seul bouton.
  sweep(T.then - 0.14, 0.2, { f0: 900, fmid: 5200, f1: 1200, gain: 0.16, q: 1.1 })
  for (let k = 0; k < 9; k++) tick(T.itch + 0.1 + k * 0.13 + rand() * 0.04, 0.025, 2200 + rand() * 900, rand() - 0.5)
  thock(T.tapCta, 0.42)
  pop(T.tapCta + 0.02, 0.16, 1400, 500)
  slap(T.oneButton, 0.2, 1.1)

  // 5 · Trois petits taps.
  ;[T.tapMood, T.tapTime, T.tapPassion].forEach((t, i) => {
    thock(t, 0.36)
    bell(t + 0.05, [84, 88, 91][i], 0.045, { decay: 0.5, pan: -0.3 + i * 0.3 })
  })
  pop(T.threeTaps, 0.16, 900, 300)

  // 6 · L'activité, et « Une autre idée ».
  sweep(T.activity - 0.05, 0.35, { f0: 400, fmid: 2600, f1: 700, gain: 0.1 })
  ;[79, 84, 88].forEach((m, i) => bell(T.creative + i * 0.07, m + 12, 0.03, { decay: 0.6, pan: -0.4 + i * 0.4 }))
  pop(T.minutes + 0.3, 0.12, 1000, 350)
  thock(T.reroll, 0.3)
  for (let k = 0; k < 3; k++) sweep(T.reroll + 0.08 + k * 0.07, 0.1, { f0: 1500, fmid: 4500, f1: 2000, gain: 0.06, pan: k % 2 ? 0.5 : -0.5 })

  // 7 · Tu dessines, tu écris, tu écoutes, tu regardes : un fouet par activité.
  T.verbs.forEach((t, i) => {
    sweep(t - 0.16, 0.2, { f0: 900, fmid: 5000, f1: 1200, gain: 0.14, q: 1.1, pan: i % 2 ? 0.4 : -0.4 })
    slap(t + 0.02, 0.2, 1 + i * 0.1)
  })
  sweep(T.backToTake - 0.05, 0.25, { f0: 900, fmid: 4000, f1: 1000, gain: 0.12, pan: -0.3 })
  thock(T.tapValidate, 0.36)
  shutter(T.photo + 0.02, 0.3)
  pop(T.words, 0.12, 900, 350, 0.4)
  scribble(T.words + 0.15, 0.7)
  thock(T.tapSave, 0.36)

  // 8 · Pièces d'or, palier.
  sweep(T.done - 0.1, 0.3, { f0: 3000, f1: 400, shape: 'fall', gain: 0.1 })
  for (let k = 0; k < 14; k++) coin(T.coins + k * 0.07 + rand() * 0.04, 0.04 + rand() * 0.025, 1900 + rand() * 1200, rand() * 2 - 1)
  confettiSfx(T.party, 0.22, -0.4)
  confettiSfx(T.party + 0.02, 0.22, 0.4)
  ;[72, 76, 79, 84, 88].forEach((m, i) => bell(T.party + i * 0.06, m + 12, 0.035, { decay: 0.8, pan: -0.5 + i * 0.25 }))

  // 9 · La galerie ; pas de calendrier, pas de culpabilité.
  thock(T.tapGallery, 0.32)
  sweep(T.tapGallery + 0.05, 0.3, { f0: 500, fmid: 2600, f1: 900, gain: 0.08 })
  slap(T.noCalendar, 0.22, 0.9, -0.4)
  thock(T.noCalendar + 0.45, 0.26)
  slap(T.noGuilt, 0.22, 1.1)

  // 10 · Les thèmes : un fouet et un déclic à chaque changement.
  thock(T.tapSettings, 0.3)
  sweep(T.tapSettings + 0.03, 0.35, { f0: 300, fmid: 2200, f1: 800, gain: 0.09 })
  T.themes.forEach((t, i) => {
    sweep(t - 0.16, 0.18, { f0: 900, fmid: 5000, f1: 1200, gain: 0.12, q: 1.1, pan: i % 2 ? 0.4 : -0.4 })
    shutter(t, 0.2)
  })
  // Le tap sur la musique : la bande freine, le jazz entre, avec ses craquements.
  thock(T.jazz, 0.36)
  crackle(T.jazz, T.end - T.jazz)

  // 11 · La fin : « Scroll-up » claque, la musique revient.
  sweep(T.end - 0.45, 0.47, { f0: 300, f1: 8000, shape: 'rise', gain: 0.25, q: 0.8 })
  crash(T.end, 0.3)
  boom(T.end, 0.45, 80, 40, 0.45)
  slap(T.end + 0.1, 0.35, 0.9)
  ducks.push([T.end, 0.4])
  T.slogan.forEach((t, i) => tick(t, 0.025, 2600 + i * 120))
  slap(T.creativity + 0.38, 0.35, 1)
  ;[72, 76, 79, 84].forEach((m, i) => bell(T.creativity + 0.4 + i * 0.05, m + 12, 0.04, { decay: 1, pan: -0.4 + i * 0.27 }))
  pop(T.free + 0.05, 0.18, 800, 250)
  boom(T.final, 0.5, 80, 38, 0.7)
  crash(T.final, 0.35, 1.5)
  ;[60, 64, 67, 72, 76, 79, 84].forEach((m, i) => bell(T.final + 0.02 + i * 0.03, m + 12, 0.04, { decay: 1.1, pan: Math.sin(i * 1.9) * 0.8, index: 1.6 }))
  confettiSfx(T.final, 0.26, -0.4)
  confettiSfx(T.final + 0.02, 0.26, 0.4)
  ducks.push([T.final, 0.3])
}

/* ================================================================== mixage */

/** La voix : nettoyée, un peu de présence, compressée ; posée à VO_START. */
function loadVoice() {
  const [x] = decode(path.join(HERE, 'media', 'voix-off.mp3'), 1)
  const hp = new Biquad('highpass', 85, 0.7)
  const mud = new Biquad('peaking', 260, 1, -2)
  const presence = new Biquad('peaking', 3400, 0.9, 2.5)
  const air = new Biquad('highshelf', 9000, 0.7, 1.5)
  for (let j = 0; j < x.length; j++) x[j] = air.process(presence.process(mud.process(hp.process(x[j]))))
  compress(x, { threshold: -24, ratio: 2.6, attack: 0.004, release: 0.12 })
  const v = new Float32Array(N)
  const s0 = Math.round(VO_START * SR)
  for (let j = 0; j < x.length && s0 + j < N; j++) v[s0 + j] = x[j]
  return v
}

/**
 * La musique, remontée selon MUSIC : avant le jazz, puis après. Au moment du
 * jazz, la bande freine (la vitesse tombe à zéro en 0,45 s).
 */
function loadMusic() {
  const [mL, mR] = decode(path.join(HERE, '..', 'viral', 'media', 'musique-vidiq.mp3'), 2)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  const STOP = 0.45
  let pos = (T.jazz + MUSIC.before) * SR
  for (let j = 0; j < N; j++) {
    const t = j / SR
    let p
    let g = 1
    if (t < T.jazz) p = (t + MUSIC.before) * SR
    else if (t < T.jazz + STOP) {
      const d = (t - T.jazz) / STOP
      pos += (1 - d) ** 1.4
      p = pos
      g = (1 - d) ** 0.7
    } else if (t < T.end) continue
    else p = (t + MUSIC.after) * SR
    L[j] = sampleAt(mL, p) * g
    R[j] = sampleAt(mR, p) * g
  }
  return [L, R]
}

/** Le jazz noir de l'app, de T.jazz à T.end (fondu d'entrée, coupe nette sur « Scroll-up »). */
function loadJazz() {
  const [jL, jR] = decode(path.join(HERE, '..', 'viral', 'media', 'jazz-noir-vidiq.mp3'), 2)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  const s0 = Math.round((T.jazz + 0.05) * SR)
  const s1 = Math.round((T.end + 0.08) * SR)
  for (let j = s0; j < s1 && j < N; j++) {
    const t = (j - s0) / SR
    const g = Math.min(1, t / 0.3, (s1 - j) / SR / 0.08)
    L[j] = jL[j - s0] * g
    R[j] = jR[j - s0] * g
  }
  // Moins de grave : la contrebasse du morceau couvrirait la voix.
  filterBus([L, R], [['highpass', 55, 0.7], ['peaking', 110, 0.8, -4]])
  return [L, R]
}

/**
 * Nivelle la musique : le début du morceau (sa montée, puis sa reprise) est
 * bien plus doux que le plein. Gain lissé sur ~1,5 s, qui ramène chaque passage
 * près du niveau du plein (au plus +15 dB), et figé pendant le jazz.
 */
function levelMusic([L, R]) {
  const block = Math.round(0.4 * SR)
  const count = Math.ceil(N / block)
  const db = new Float32Array(count)
  for (let b = 0; b < count; b++) {
    let sum = 0
    const end = Math.min(N, (b + 1) * block)
    for (let j = b * block; j < end; j++) sum += (L[j] * L[j] + R[j] * R[j]) / 2
    db[b] = 10 * Math.log10(sum / Math.max(1, end - b * block) + 1e-12)
  }
  const ref = (() => {
    const a = Math.round(30 / 0.4)
    const z = Math.round(45 / 0.4)
    let sum = 0
    for (let b = a; b < z; b++) sum += db[b]
    return sum / (z - a)
  })()
  const gainDb = new Float32Array(count)
  const frozen = Math.floor(T.jazz / 0.4)
  for (let b = 0; b < count; b++) {
    let sum = 0
    let weight = 0
    for (let k = -2; k <= 2; k++) {
      const c = b + k
      if (c < 0 || c >= count || (c >= frozen && c * 0.4 < T.end)) continue
      const w = 3 - Math.abs(k)
      sum += db[c] * w
      weight += w
    }
    gainDb[b] = weight ? clamp(ref - 2 - sum / weight, 0, 15) : 0
  }
  for (let b = frozen; b * 0.4 < T.end + 0.4 && b < count; b++) gainDb[b] = gainDb[frozen - 1]
  for (let j = 0; j < N; j++) {
    const pos = j / block - 0.5
    const b = Math.max(0, Math.min(count - 2, Math.floor(pos)))
    const f = clamp(pos - b)
    const g = 10 ** ((gainDb[b] * (1 - f) + gainDb[b + 1] * f) / 20)
    L[j] *= g
    R[j] *= g
  }
}

/** Sonie (LUFS) d'un extrait [t0, t1] de deux canaux. */
function loudnessOf([L, R], t0, t1) {
  const a = Math.round(t0 * SR)
  const b = Math.round(t1 * SR)
  return loudness(L.subarray(a, b), R.subarray(a, b))
}

export function renderAudio() {
  seed = 0x5c0e
  ducks.length = 0
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  score()
  const voice = loadVoice()
  const music = loadMusic()
  levelMusic(music)
  const jazz = loadJazz()

  // Les niveaux, relatifs à la voix : la musique 5 dB sous elle entre les
  // phrases (et 8 dB de moins quand elle parle) ; le jazz aussi fort qu’elle
  // quand elle se tait.
  const vLufs = loudness(voice, voice)
  const mGain = 10 ** ((vLufs - 5 - loudnessOf(music, 30, 45)) / 20)
  const jGain = 10 ** ((vLufs - loudnessOf(jazz, T.jazz + 0.4, T.end - 0.1)) / 20)
  const env = voiceEnvelope(voice)

  // La musique s'efface aussi un peu sous les gros impacts, puis revient.
  const duck = new Float32Array(N).fill(1)
  for (const [t0, depth] of ducks) {
    const s0 = Math.round(t0 * SR)
    for (let i = 0; i < 0.6 * SR && s0 + i < N; i++) {
      const t = i / SR
      duck[s0 + i] = Math.min(duck[s0 + i], 1 - depth * Math.min(1, t / 0.01) * Math.exp(-t / 0.18))
    }
  }

  const vb = [new Float32Array(N), new Float32Array(N)]
  for (let j = 0; j < N; j++) {
    vb[0][j] = B.verb[0][j] + voice[j] * 0.05
    vb[1][j] = B.verb[1][j] + voice[j] * 0.05
  }
  const verb = reverb(vb)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  for (let j = 0; j < N; j++) {
    const under = 1 - 0.62 * env[j]
    const m = mGain * under * duck[j]
    const jz = jGain * (1 - 0.5 * env[j])
    L[j] = voice[j] + music[0][j] * m + jazz[0][j] * jz + B.sfx[0][j] * 0.8 + verb[0][j] * 0.4
    R[j] = voice[j] + music[1][j] * m + jazz[1][j] * jz + B.sfx[1][j] * 0.8 + verb[1][j] * 0.4
  }
  // Fin : fondu.
  const fadeStart = DURATION - 0.6
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const g = Math.cos((Math.PI / 2) * Math.min(1, (j / SR - fadeStart) / 0.6)) ** 2
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
  const out = process.argv[2] ?? path.join(HERE, '..', 'build', 'presentation', 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
