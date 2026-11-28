/**
 * ============================================================================
 *  Bande-son de « Pourquoi ça chauffe ? Le micro-ondes »
 * ============================================================================
 *  - Musique originale synthétisée ici : guitare pincée (Karplus-Strong) en
 *    arpèges, basse ronde, petite batterie douce. Elle se coupe net sur
 *    « tout s'arrête » et finit sur l'accord du « ding ».
 *  - Bruitages synthétisés, calés sur les mêmes repères que l'image (cues.js) :
 *    pops d'apparition, volets, flamme, bascules du champ, ronronnement du
 *    magnétron, plaques de métal, porte, interrupteurs, sonnerie…
 *  - Voix off : voice/narration.wav (lue d'une traite, voir narration.py) ou
 *    voice/<id>.wav (Piper, une réplique par fichier, voir voix.py), placées
 *    d'après timeline.json.
 *  La musique et les bruitages baissent quand la voix parle. Sonie : −14 LUFS.
 *
 *   node micro-ondes/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { makeCues } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'micro-ondes')
const TIMELINE = JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8'))
const C = makeCues(TIMELINE)
const { S, E, W } = C
const DURATION = C.duration
const N = Math.ceil(DURATION * SR)

// ------------------------------------------------------------------ outils

let seed = 0x0d1ce
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const newBus = () => [new Float32Array(N), new Float32Array(N)]
const B = { music: newBus(), sfx: newBus(), hum: newBus(), verb: newBus(), voice: newBus() }

/** Écrit un son : render(i, t) → échantillon mono ; targets = [[bus, gain], …]. */
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

// ---------------------------------------------------------------- bruitages

function sweep(t0, len, { f0, f1, q = 1.4, gain = 0.3, pan = 0, send = 0.2 }) {
  const bp = new Biquad('bandpass', f0, q)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, len, (i, t) => {
    const p = t / len
    if (i % 8 === 0) bp.set('bandpass', expInterp(f0, f1, p), q)
    return bp.process(noise()) * Math.sin(Math.PI * p) ** 1.6 * 2.2
  }, pan)
}

function pop(t0, gain = 0.22, f0 = 1100, f1 = 320, pan = 0) {
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

function click(t0, gain = 0.25) {
  const bp = new Biquad('bandpass', 1800, 2)
  place([[B.sfx, gain]], t0, 0.06, (i, t) => bp.process(noise()) * 3 * Math.exp(-t / 0.006))
  place([[B.sfx, gain * 0.6]], t0 + 0.035, 0.05, (i, t) => Math.sin(TAU * 900 * t) * Math.exp(-t / 0.01))
}

function bell(t0, midi, gain = 0.12, { pan = 0, decay = 1.1, ratio = 3.5, index = 2.6, send = 0.45 } = {}) {
  const f = mtof(midi)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, decay * 3.5, (i, t) => {
    const I = index * Math.exp(-t / 0.18)
    return Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t)) * Math.exp(-t / decay) * Math.min(1, t / 0.0015) * 0.8
  }, pan)
}

/** Plaque de métal : cloche inharmonique courte + choc. */
function clang(t0, gain = 0.2, pan = 0) {
  bell(t0, 74 + Math.round(rand() * 5), gain, { ratio: 1.414, index: 4, decay: 0.35, send: 0.5, pan })
  thud(t0, gain * 1.2)
}

function boom(t0, gain = 0.5, f0 = 70, f1 = 38, decay = 0.6) {
  let ph = 0
  place([[B.sfx, gain]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
}

function thud(t0, gain = 0.3) {
  let ph = 0
  const lp = new Biquad('lowpass', 500)
  place([[B.sfx, gain]], t0, 0.2, (i, t) => {
    ph += (TAU * expInterp(110, 48, clamp(t / 0.08))) / SR
    return (Math.sin(ph) + 0.3 * lp.process(noise())) * Math.exp(-t / 0.05)
  })
}

function crash(t0, gain = 0.25) {
  const hp = new Biquad('highpass', 3800, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, 1.8, (i, t) => hp.process(noise()) * Math.exp(-t / 0.6) * Math.min(1, t / 0.002))
}

/** Bruit filtré tenu (flamme, grésillement), avec fondus. */
function hiss(t0, len, { type = 'bandpass', f = 600, q = 0.8, gain = 0.06, crackle = 0, fade = 0.2 } = {}) {
  const flt = new Biquad(type, f, q)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const env = Math.min(1, t / fade) * Math.min(1, (len - t) / fade)
    let v = flt.process(noise())
    if (crackle && rand() < crackle) v += noise() * 4
    return v * env
  })
}

/** Glissando (goutte « bloop », montée du compteur, fonte du chocolat). */
function glide(t0, len, f0, f1, gain = 0.15, { vib = 0, shape = 'sine' } = {}) {
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, len, (i, t) => {
    const p = t / len
    ph += (TAU * expInterp(f0, f1, p) * (1 + vib * Math.sin(TAU * 7 * t))) / SR
    const env = Math.min(1, t / 0.01) * (1 - p) ** 1.5
    return (shape === 'tri' ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph)) * env
  })
}

/** Ronronnement du magnétron : 100 Hz (réseau à 50 Hz) et harmoniques, adouci. */
function hum(t0, t1, gain = 0.06) {
  if (t1 <= t0) return
  const lp = new Biquad('lowpass', 900, 0.7)
  const len = t1 - t0
  place([[B.hum, gain]], t0, len, (i, t) => {
    const env = Math.min(1, t / 0.04) * Math.min(1, (len - t) / 0.06)
    const s = Math.sin(TAU * 100 * t) + 0.5 * Math.sign(Math.sin(TAU * 100 * t)) * 0.4 + 0.25 * Math.sin(TAU * 200 * t) + 0.15 * Math.sin(TAU * 50 * t)
    return lp.process(s) * env * (0.9 + 0.1 * Math.sin(TAU * 3 * t))
  })
}

// ================================================================== musique
// Do majeur, 104 BPM : Do – Sol – La m – Fa, en arpèges de guitare pincée.

const BPM = 104
const BEAT = 60 / BPM
const BAR = BEAT * 4
const CHORDS = [
  [48, 55, 60, 64, 67],
  [43, 50, 55, 59, 62],
  [45, 52, 57, 60, 64],
  [41, 48, 53, 57, 60],
]
const STOP = W('17', 'sarrete') - 0.05

function pluck(t0, midi, gain = 0.1, pan = 0, decay = 0.996) {
  const f = mtof(midi)
  const L = Math.max(2, Math.round(SR / f))
  const buf = new Float32Array(L)
  let prev = 0
  for (let k = 0; k < L; k++) {
    prev = prev * 0.5 + noise() * 0.5
    buf[k] = prev
  }
  let idx = 0
  const lp = new Biquad('lowpass', 3200, 0.7)
  place([[B.music, gain], [B.verb, gain * 0.25]], t0, 2.2, (i, t) => {
    const a = buf[idx]
    const b = buf[(idx + 1) % L]
    buf[idx] = (a + b) * 0.5 * decay
    idx = (idx + 1) % L
    return lp.process(a) * Math.min(1, (2.2 - t) / 0.2)
  }, pan)
}

function bass(t0, midi, len, gain = 0.16) {
  const f = mtof(midi)
  const lp = new Biquad('lowpass', 400, 0.8)
  place([[B.music, gain]], t0, len, (i, t) => {
    const env = Math.min(1, t / 0.01) * Math.exp(-t / 0.9) * Math.min(1, (len - t) / 0.05)
    return lp.process(Math.sin(TAU * f * t) + 0.35 * Math.sin(TAU * 2 * f * t) + 0.2 * ((t * f) % 1 - 0.5)) * env
  })
}

function kick(t0, gain = 0.22) {
  let ph = 0
  place([[B.music, gain]], t0, 0.35, (i, t) => {
    ph += (TAU * expInterp(120, 45, clamp(t / 0.07))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.12)
  })
}

function shaker(t0, gain = 0.05, pan = 0.3) {
  const hp = new Biquad('highpass', 6000, 0.7)
  place([[B.music, gain]], t0, 0.08, (i, t) => hp.process(noise()) * Math.exp(-t / 0.022) * Math.min(1, t / 0.004), pan)
}

function snap(t0, gain = 0.1) {
  const bp = new Biquad('bandpass', 2200, 1.2)
  place([[B.music, gain], [B.verb, gain * 0.4]], t0, 0.15, (i, t) => bp.process(noise()) * 2.5 * Math.exp(-t / 0.03))
}

function music() {
  const start = 0.05
  const end = C.ding
  for (let bar = 0; start + bar * BAR < end; bar++) {
    const t0 = start + bar * BAR
    const chord = CHORDS[bar % 4]
    const order = [0, 2, 3, 4, 3, 2, 1, 2]
    for (let k = 0; k < 8; k++) {
      const t = t0 + k * (BEAT / 2)
      if (t >= end || (t > STOP - 0.02 && t < STOP + 1.0)) continue
      pluck(t, chord[order[k]] + 12, 0.09 * (k % 2 ? 0.75 : 1), k % 2 ? 0.35 : -0.35)
      shaker(t + BEAT / 4, 0.035 * (k % 2 ? 1 : 0.6))
    }
    for (const [beat, len] of [[0, 1.5], [1.5, 0.5], [2, 2]]) {
      const t = t0 + beat * BEAT
      if (t < end && !(t > STOP - 0.02 && t < STOP + 1.0)) bass(t, chord[0] - 12 + (chord[0] < 45 ? 12 : 0), len * BEAT)
    }
    for (const beat of [0, 2]) {
      const t = t0 + beat * BEAT
      if (t < end && t > 2.5 && !(t > STOP - 0.02 && t < STOP + 1.0)) kick(t)
    }
    for (const beat of [1, 3]) {
      const t = t0 + beat * BEAT
      if (t < end && t > 2.5 && !(t > STOP - 0.02 && t < STOP + 1.0)) snap(t)
    }
  }
  // Accord final, sur le « ding ».
  for (const [k, m] of [48, 55, 60, 64, 67, 72].entries()) pluck(C.ding + k * 0.03, m + 12, 0.1, (k / 5) * 1.2 - 0.6, 0.9985)
  bass(C.ding, 36, 2.5, 0.18)
}

// ============================================================ les bruitages

function score() {
  const cuts = [...C.sections.slice(1).map((s) => s.t0), C.macro]
  cuts.forEach((c, i) => sweep(c - 0.24, 0.5, { f0: 400, f1: 4500, gain: 0.22, pan: i % 2 ? 0.4 : -0.4 }))

  // 1 · le feu
  pop(0.12, 0.2, 900, 300)
  pop(0.4, 0.2)
  pop(0.7, 0.18, 1300, 400, 0.5)
  const tFire = W('01', 'feu')
  sweep(tFire - 0.05, 0.4, { f0: 200, f1: 900, q: 0.8, gain: 0.3 })
  hiss(tFire, C.sections[1].t0 - tFire, { f: 500, q: 0.6, gain: 0.05 })
  hiss(W('02', 'brule') - 0.1, 2.0, { type: 'highpass', f: 4000, q: 0.7, gain: 0.05, crackle: 0.002 })
  sweep(W('02', 'dessous') - 0.35, 0.6, { f0: 2000, f1: 500, gain: 0.15 })
  pop(W('02', 'brule'), 0.2, 1200, 500)
  pop(W('02', 'froid'), 0.2, 900, 300)
  pop(W('02', 'lentement'), 0.16, 700, 260)
  for (let i = 0; i < 5; i++) tick(W('02', 'chaleur') + i * 0.08, 0.05, 1800 + i * 200)

  // 2 · l'eau
  glide(S('03') + 0.3, 0.25, 300, 1100, 0.18)
  pop(W('03', 'leau'), 0.2)
  pop(S('04') + 0.05, 0.22, 800, 260)
  pop(W('04', 'plus') - 0.05, 0.16, 1500, 700, 0.4)
  pop(W('04', 'moins') - 0.05, 0.16, 1100, 500, -0.4)
  sweep(W('05', 'champ') - 0.1, 0.4, { f0: 600, f1: 3000, gain: 0.15 })
  sweep(W('05', 'retourne'), 0.35, { f0: 1500, f1: 400, gain: 0.12 })
  C.flips.forEach((f, i) => tick(f, 0.07, 2000 + (i % 2) * 600, i % 2 ? 0.3 : -0.3))
  for (let i = 0; i < 14; i++) pop(C.swarm + i * 0.04, 0.07, 1400 + rand() * 600, 500, rand() * 1.6 - 0.8)
  const tCount = W('06', 'milliards') - 0.1
  for (let i = 0; i < 18; i++) tick(tCount + 1.0 * (1 - (1 - i / 18) ** 2), 0.05, 2400 + i * 60)
  hiss(W('06', 'frottent') - 0.1, E('06') - W('06', 'frottent') + 0.8, { type: 'highpass', f: 3500, gain: 0.04, crackle: 0.004 })
  glide(W('06', 'chauffent') - 0.1, 0.9, 200, 700, 0.08, { shape: 'tri' })
  glide(S('07') - 0.1, 1.1, 180, 420, 0.12, { vib: 0.08, shape: 'tri' })
  pop(W('07', 'micro'), 0.22, 1000, 400)

  // 3 · le magnétron
  const tBuild = S('08') + 0.15
  for (let i = 0; i < 11; i++) pop(tBuild + i * 0.13, 0.12, 900 + i * 60, 300, ((i % 3) - 1) * 0.4)
  pop(W('08', 'magnetron'), 0.22)
  hum(W('08', 'magnetron') - 0.2, C.sections[3].t0, 0.05)
  boom(W('09', '1945') - 0.05, 0.4)
  pop(W('09', 'ingenieur') - 0.1, 0.2, 800, 260, 0.4)
  glide(W('09', 'ingenieur') + 0.2, 0.6, 600, 1500, 0.07, { vib: 0.1 })
  glide(W('09', 'fondre'), 1.6, 420, 90, 0.14, { vib: 0.03, shape: 'tri' })

  // 4 · les ondes partout, la boîte
  const s4 = C.sections[3]
  hum(s4.t0 + 0.1, s4.t1, 0.04)
  for (let t = s4.t0 + 0.2; t < W('11', 'boite'); t += 0.5) glide(t, 0.35, 900, 500, 0.03)
  pop(W('10', 'toi') - 0.15, 0.2, 800, 260, 0.5)
  glide(W('10', 'plein') - 0.3, 0.35, 700, 240, 0.12, { vib: 0.2 })
  pop(W('10', 'plein'), 0.15, 1300, 600, 0.5)
  for (let i = 0; i < 5; i++) clang(W('11', 'boite') - 0.45 + i * 0.12 + 0.42, 0.13, ((i % 3) - 1) * 0.5)
  sweep(W('11', 'renvoie') - 0.1, 2.2, { f0: 800, f1: 5000, q: 3, gain: 0.08 })
  pop(W('12', 'cage'), 0.22)

  // 5 · la vitre, la grille, le gros plan
  pop(C.sections[4].t0 + 0.05, 0.2, 800, 260)
  pop(W('13', 'plat'), 0.16, 1500, 700)
  bell(W('13', 'vitre'), 96, 0.08, { decay: 0.6, ratio: 2.76 })
  hum(W('13', 'vitre') + 0.2, C.macro, 0.035)
  sweep(W('13', 'grille'), 0.8, { f0: 3000, f1: 8000, q: 2, gain: 0.07 })
  glide(S('14') + 0.1, 1.2, 140, 260, 0.1, { vib: 0.12, shape: 'tri' })
  boom(W('14', '12'), 0.3, 90, 50, 0.4)
  pop(W('14', '12'), 0.2)
  thud(W('14', 'trop'), 0.35)
  pop(W('14', 'grosse') - 0.05, 0.18, 600, 200)
  glide(W('14', 'trop') + 0.2, 1.4, 260, 140, 0.08, { vib: 0.12, shape: 'tri' })
  for (let i = 0; i < 6; i++) bell(W('14', 'lumiere') - 0.1 + i * 0.11, [84, 88, 91, 96, 91, 100][i], 0.05, { decay: 0.5, pan: (i % 2 ? 0.5 : -0.5) })
  pop(W('14', 'passe', 1) - 0.1, 0.18)

  // 6 · points chauds, plateau tournant
  const s6 = C.sections[5]
  hum(s6.t0 + 0.1, s6.t1, 0.035)
  sweep(S('15'), 1.6, { f0: 900, f1: 4000, q: 3, gain: 0.07 })
  hiss(W('15', 'superposent') - 0.1, 2.5, { type: 'highpass', f: 4000, gain: 0.03, crackle: 0.003 })
  pop(W('15', 'fort') - 0.05, 0.2, 1200, 500, -0.3)
  pop(W('15', 'pas') - 0.05, 0.2, 900, 300, 0.3)
  click(W('16', 'tourner') - 0.1, 0.18)
  hiss(W('16', 'tourner') - 0.05, s6.t1 - W('16', 'tourner'), { type: 'lowpass', f: 220, gain: 0.05 })
  pop(W('16', 'plateau') - 0.05, 0.22)

  // 7 · la porte
  const s7 = C.sections[6]
  hum(s7.t0 + 0.1, STOP, 0.045)
  click(W('17', 'ouvre'), 0.3)
  sweep(W('17', 'ouvre') + 0.02, 0.5, { f0: 500, f1: 1400, q: 4, gain: 0.08 })
  pop(W('17', 'marche') - 0.1, 0.18, 700, 220)
  thud(W('17', 'alors') + 0.2, 0.4)
  click(W('17', 'alors') + 0.2, 0.2)
  click(W('17', 'interrupteurs') - 0.1, 0.25)
  click(W('17', 'interrupteurs') + 0.02, 0.25)
  pop(W('17', 'interrupteurs') - 0.1, 0.18)
  click(W('17', 'souvre'), 0.35)
  boom(STOP, 0.55, 80, 35, 0.7)
  thud(STOP, 0.4)
  for (let i = 0; i < 2; i++) place([[B.sfx, 0.06]], STOP + 0.2 + i * 0.18, 0.12, (j, t) => Math.sign(Math.sin(TAU * 1000 * t)) * 0.5 * Math.min(1, (0.12 - t) / 0.01))

  // 8 · demi-puissance
  const s8 = C.sections[7]
  pop(s8.t0 + 0.05, 0.18, 800, 260)
  pop(s8.t0 + 0.2, 0.15)
  const tHalf = W('18', 'moitie') - 0.1
  for (let i = 0; i < 10; i++) tick(tHalf + i * 0.06, 0.06, 3000)
  pop(tHalf + 0.25, 0.2)
  let was = false
  let from = 0
  for (let t = s8.t0; t <= s8.t1 + 0.001; t += 1 / 200) {
    const on = C.powerOn(t) && t < s8.t1
    if (on !== was) {
      click(t, 0.22)
      if (on) from = t
      else hum(from, t, 0.07)
      was = on
    }
  }
  pop(C.pw.full, 0.18, 700, 220)

  // 9 · félicitations
  const s9 = C.sections[8]
  pop(s9.t0 + 0.05, 0.2, 800, 260)
  pop(s9.t0 + 0.25, 0.18, 1100, 400, 0.5)
  hum(s9.t0 + 0.1, C.ding, 0.04)
  const tBravo = W('19', 'felicitations') - 0.1
  crash(tBravo, 0.16)
  for (let i = 0; i < 16; i++) pop(tBravo + i * 0.05, 0.06, 1500 + rand() * 900, 600, rand() * 1.6 - 0.8)
  ;[72, 76, 79, 84].forEach((m, i) => bell(tBravo + i * 0.09, m + 12, 0.06, { decay: 0.7, pan: (i - 1.5) * 0.4 }))
  pop(W('19', 'construit') - 0.1, 0.16)
  bell(C.ding, 96, 0.22, { decay: 1.6, ratio: 3.01, index: 1.4, send: 0.5 })
  bell(C.ding + 0.005, 100, 0.12, { decay: 1.4, ratio: 3.01, index: 1.2, send: 0.5 })
}

// ===================================================================== voix

/** Pose un fichier de voix (mono) à l'instant `at`. */
function placeVoice(file, at) {
  const { sr, x } = readWav(path.join(HERE, file))
  const y = sr === SR ? x : resample(x, sr, SR)
  const s0 = Math.round(at * SR)
  for (let i = 0; i < y.length; i++) {
    const j = s0 + i
    if (j < 0 || j >= N) continue
    B.voice[0][j] += y[i]
    B.voice[1][j] += y[i]
  }
}

function voiceTrack() {
  // Narration d'un seul tenant (narration.py), ou une réplique par fichier (voix.py).
  if (TIMELINE.narration) placeVoice(TIMELINE.narration.file, TIMELINE.narration.offset)
  else for (const line of C.lines) placeVoice(`voice/${line.id}.wav`, line.start)
  filterBus(B.voice, [['highpass', 90, 0.7], ['peaking', 250, 1, -2.5], ['peaking', 3200, 0.9, 3], ['highshelf', 9000, 0.7, 1.5]])
  for (const ch of B.voice) compress(ch, { threshold: -20, ratio: 2.8, makeup: 4 })
}

// ================================================================== mixage

function setLoudness(bus, lufs, from = 0, to = DURATION) {
  const a = Math.round(from * SR)
  const z = Math.round(to * SR)
  const g = 10 ** ((lufs - loudness(bus[0].subarray(a, z), bus[1].subarray(a, z))) / 20)
  for (const ch of bus) for (let j = 0; j < N; j++) ch[j] *= g
}

export const LEVELS = { voice: -16, music: -27 }

export function renderAudio() {
  seed = 0x0d1ce
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  music()
  score()
  voiceTrack()
  setLoudness(B.voice, LEVELS.voice)
  setLoudness(B.music, LEVELS.music, 3, C.ding)
  const talk = voiceEnvelope(B.voice[0])
  const verb = reverb(B.verb, { room: 0.78, damp: 0.35 })

  const L = new Float32Array(N)
  const R = new Float32Array(N)
  // [bus, gain, baisse sous la voix (0 à 1)]
  const mix = [
    [B.music, 1, 0.45],
    [B.hum, 1, 0.3],
    [B.sfx, 1, 0.3],
    [verb, 0.45, 0.4],
    [B.voice, 1, 0],
  ]
  for (const [bus, g, underVoice] of mix) {
    for (let j = 0; j < N; j++) {
      const d = g * (1 - underVoice * talk[j])
      L[j] += bus[0][j] * d
      R[j] += bus[1][j] * d
    }
  }
  const fadeStart = DURATION - 0.4
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const g = Math.cos((Math.PI / 2) * Math.min(1, (j / SR - fadeStart) / 0.4)) ** 2
    L[j] *= g
    R[j] *= g
  }
  filterBus([L, R], [['highpass', 28, 0.7]])
  const ceiling = 10 ** (-1.8 / 20)
  for (let pass = 0; pass < 3; pass++) {
    const gain = 10 ** ((-14 - loudness(L, R)) / 20)
    for (let j = 0; j < N; j++) {
      L[j] *= gain
      R[j] *= gain
    }
    limit(L, R, ceiling, { truePeak: true })
  }
  return [L, R]
}

export function writeAudio(file) {
  const [L, R] = renderAudio()
  writeWav(file, L, R, rand)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(BUILD, 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
