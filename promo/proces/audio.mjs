/**
 * ============================================================================
 *  Bande-son du procès : musique dramatique, bruitages, voix.
 * ============================================================================
 *  - Musique originale synthétisée ici : piano (notes FM qui s'éteignent) sur
 *    une nappe de cordes, en ré mineur (ré m – si♭ – fa – do), lente. Battement
 *    de cœur sourd pendant le débat ; la musique s'efface sur « Les débats sont
 *    clos » et revient, tendue, pour le vote.
 *  - Bruitages calés sur cues.js : moniteur cardiaque, téléphone, tampon
 *    « assassinat », coups de marteau, volets, pages du calendrier, bulles…
 *  - Voix : voice/<id>.wav (une réplique par fichier, voir voix.py), placées
 *    d'après timeline.json.
 *  La musique et les bruitages baissent quand une voix parle. Sonie : −14 LUFS.
 *
 *   node proces/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, polyblep, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { makeCues } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'proces')
const C = makeCues(JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8')))
const { S, E, W } = C
const DURATION = C.duration
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
const lerp = (a, b, p) => a + (b - a) * p
const newBus = () => [new Float32Array(N), new Float32Array(N)]
const B = { music: newBus(), sfx: newBus(), verb: newBus(), voice: newBus() }

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

function pop(t0, gain = 0.18, f0 = 900, f1 = 300, pan = 0) {
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, 0.12, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / 0.035))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.04) * Math.min(1, t / 0.001)
  }, pan)
}

function tick(t0, gain = 0.06, f = 2400, pan = 0) {
  const hp = new Biquad('highpass', 3000)
  place([[B.sfx, gain]], t0, 0.04, (i, t) => (hp.process(noise()) * 0.6 + Math.sin(TAU * f * t)) * Math.exp(-t / 0.008), pan)
}

function boom(t0, gain = 0.5, f0 = 70, f1 = 36, decay = 0.8) {
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
}

/** Coup de marteau : choc boisé (bruit filtré) + résonance du socle. */
function gavel(t0, gain = 0.6) {
  const bp = new Biquad('bandpass', 900, 1.6)
  const lp = new Biquad('lowpass', 2500, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.7]], t0, 0.6, (i, t) => {
    const n = noise()
    return (bp.process(n) * 2.2 * Math.exp(-t / 0.018) + lp.process(n) * 0.5 * Math.exp(-t / 0.006) + Math.sin(TAU * 190 * t) * 0.8 * Math.exp(-t / 0.06) + Math.sin(TAU * 410 * t) * 0.3 * Math.exp(-t / 0.04)) * Math.min(1, t / 0.0008)
  })
}

/** Battement de cœur (lub-dub) sourd. */
function heart(t0, gain = 0.25) {
  for (const [dt, g] of [[0, 1], [0.24, 0.7]]) {
    let ph = 0
    place([[B.music, gain * g]], t0 + dt, 0.3, (i, t) => {
      ph += (TAU * expInterp(68, 40, clamp(t / 0.12))) / SR
      return Math.sin(ph) * Math.exp(-t / 0.07) * Math.min(1, t / 0.006)
    })
  }
}

function beep(t0, gain = 0.06, f = 1000, len = 0.12) {
  place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, len, (i, t) => Math.sin(TAU * f * t) * Math.min(1, t / 0.005) * Math.min(1, (len - t) / 0.01), 0.4)
}

/** Sonnerie de téléphone (deux tons, en rafales). */
function ring(t0, len, gain = 0.06) {
  place([[B.sfx, gain], [B.verb, gain * 0.25]], t0, len, (i, t) => {
    const on = t % 1.2 < 0.8 ? 1 : 0
    const tr = Math.sign(Math.sin(TAU * 20 * t)) > 0 ? 1 : 0
    return on * (tr ? Math.sin(TAU * 440 * t) : Math.sin(TAU * 480 * t)) * 0.7 * Math.min(1, (len - t) / 0.05)
  }, -0.2)
}

function page(t0, gain = 0.07) {
  const bp = new Biquad('bandpass', 3000, 0.8)
  place([[B.sfx, gain]], t0, 0.1, (i, t) => bp.process(noise()) * 2 * Math.sin((Math.PI * t) / 0.1))
}

// ================================================================== musique
// Ré mineur, lent : ré m – si♭ – fa – do. Piano en arpèges + nappe de cordes.

const BAR = 3.2
const CH = [
  [50, 57, 62, 65, 69],
  [46, 53, 58, 62, 65],
  [41, 48, 53, 57, 60],
  [48, 55, 60, 64, 67],
]

function piano(t0, midi, gain = 0.08, pan = 0) {
  const f = mtof(midi)
  const len = 3.0
  place([[B.music, gain], [B.verb, gain * 0.7]], t0, len, (i, t) => {
    const I = 1.4 * Math.exp(-t / 0.25)
    const env = Math.exp(-t / 1.1) * Math.min(1, t / 0.004) * Math.min(1, (len - t) / 0.2)
    return (Math.sin(TAU * f * t + I * Math.sin(TAU * f * t)) + 0.25 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.4)) * env * 0.6
  }, pan)
}

/** Nappe de cordes : dents de scie désaccordées, filtrées, attaque lente. */
function strings(t0, dur, midis, gain = 0.06, { attack = 0.8, release = 1.0, cutoff = 1400 } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.08, -0.7], [0.06, 0.7]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.6)
      let ph = rand()
      place([[B.music, gain / midis.length], [B.verb, (gain / midis.length) * 0.6]], t0, dur + release * 4, (i, t) => {
        ph = (ph + f / SR) % 1
        const env = Math.min(1, t / attack) * (t < dur ? 1 : Math.exp(-(t - dur) / release)) * (1 + 0.05 * Math.sin(TAU * 5 * t))
        return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * env * 0.5
      }, pan)
    }
  }
}

function music() {
  const close = C.gavel[1]
  const vote = S('15') - 0.3
  // 1. Le couple, la chambre, le tribunal : piano + cordes jusqu'aux débats clos.
  for (let bar = 0, t = 0.1; t < close - 0.3; bar++, t += BAR) {
    const ch = CH[bar % 4]
    const len = Math.min(BAR, close - t)
    strings(t, len, [ch[0] - 12, ch[1], ch[2]], 0.05, { cutoff: t > S('05') ? 1700 : 1100 })
    const order = [0, 2, 3, 4, 3, 2]
    order.forEach((k, j) => {
      const tt = t + j * (BAR / 6)
      if (tt < close - 0.3) piano(tt, ch[k] + 12, j === 0 ? 0.09 : 0.06, ((j % 3) - 1) * 0.4)
    })
  }
  // Battement de cœur pendant le débat, de plus en plus serré.
  for (let t = S('06') - 0.5; t < close - 0.4; ) {
    heart(t, 0.22)
    t += lerp(1.1, 0.75, clamp((t - S('06')) / (close - S('06'))))
  }
  // 2. Le vote : nappe grave et tendue, une note de piano qui revient, cœur lent.
  strings(vote, DURATION - vote - 0.5, [38, 45, 50, 53], 0.08, { attack: 1.6, cutoff: 900 })
  for (let t = vote + 0.4; t < DURATION - 1.5; t += 1.6) piano(t, 74, 0.05, 0.3)
  for (let t = vote + 0.8; t < DURATION - 1; t += 1.05) heart(t, 0.2)
}

// ============================================================ les bruitages

function score() {
  C.sections.slice(1).forEach((s, i) => sweep(s.t0 - 0.24, 0.5, { f0: 300, f1: 3500, gain: 0.18, pan: i % 2 ? 0.4 : -0.4 }))
  // 1. Titre, compteur, cœur.
  boom(0.1, 0.35, 60, 34, 1.0)
  pop(0.3, 0.12)
  pop(0.45, 0.12, 1100, 400)
  const t52 = W('01', 'cinquante') - 0.05
  for (let i = 0; i < 14; i++) tick(t52 + 1.1 * (1 - (1 - i / 14) ** 2), 0.04, 2200 + i * 50)
  // 2. La chambre : moniteur cardiaque, pilules barrées, la nuit, le téléphone.
  const tDose = W('03', 'dose')
  for (let t = S('02') + 0.2; t < tDose + 1.2; t += 0.95) beep(t, 0.035)
  beep(tDose + 1.3, 0.04, 1000, 2.2)
  ;['bouger', 'manger', 'respirer'].forEach((w) => {
    pop(W('02', w), 0.12)
    sweep(W('02', w) + 0.35, 0.25, { f0: 2000, f1: 600, gain: 0.08 })
  })
  sweep(S('03') - 0.1, 1.2, { f0: 1200, f1: 200, gain: 0.08, q: 0.8 })
  ring(W('03', 'appele') - 0.1, 2.2, 0.05)
  // 3. Le tribunal.
  boom(W('04', 'assassinat'), 0.55, 80, 32, 0.9)
  for (const g of C.gavel) {
    gavel(g)
    gavel(g + 0.32, 0.45)
  }
  for (let i = 0; i < 20; i++) page(W('06', 'semaines') + 1.4 * ((i / 20) ** 0.6), 0.05)
  pop(W('06', 'trois', 1) - 0.1, 0.12)
  pop(W('06', 'decision') - 0.1, 0.12, 700, 220)
  for (let i = 0; i < 11; i++) pop(W('07', 'onze') - 0.1 + i * 0.09, 0.07, 1300 + i * 40, 500, ((i % 3) - 1) * 0.5)
  pop(W('08', 'petit') - 0.3, 0.12, 1500, 700)
  pop(W('08', 'qui') - 0.05, 0.1, 600, 250)
  ring(W('09', 'appele') - 0.25, 1.2, 0.035)
  pop(W('09', 'je') - 0.05, 0.12)
  pop(W('10', 'sedation') - 0.2, 0.12)
  pop(W('10', 'choisi') - 0.1, 0.12, 700, 220)
  pop(W('11', '79') - 0.1, 0.12)
  boom(S('12') + 0.05, 0.25, 90, 50, 0.4)
  boom(S('13') + 0.05, 0.25, 90, 50, 0.4)
  // 4. Le vote.
  boom(W('15', 'jury') - 0.1, 0.4, 60, 30, 1.2)
  boom(W('15', 'coupable') - 0.1, 0.3, 90, 45, 0.5)
  boom(W('15', 'non') - 0.1, 0.3, 90, 45, 0.5)
  pop(W('15', 'donne') - 0.1, 0.12)
}

// ===================================================================== voix

function voiceTrack() {
  for (const line of C.lines) {
    const { sr, x } = readWav(path.join(HERE, 'voice', `${line.id}.wav`))
    const y = sr === SR ? x : resample(x, sr, SR)
    const s0 = Math.round(line.start * SR)
    for (let i = 0; i < y.length && s0 + i < N; i++) {
      B.voice[0][s0 + i] += y[i]
      B.voice[1][s0 + i] += y[i]
    }
  }
  filterBus(B.voice, [['highpass', 80, 0.7], ['peaking', 250, 1, -2], ['peaking', 3200, 0.9, 2]])
  for (const ch of B.voice) compress(ch, { threshold: -20, ratio: 2.6, makeup: 3 })
}

// ================================================================== mixage

function setLoudness(bus, lufs, from = 0, to = DURATION) {
  const a = Math.round(from * SR)
  const z = Math.round(to * SR)
  const g = 10 ** ((lufs - loudness(bus[0].subarray(a, z), bus[1].subarray(a, z))) / 20)
  for (const ch of bus) for (let j = 0; j < N; j++) ch[j] *= g
}

export function renderAudio() {
  seed = 0x7a11
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  music()
  score()
  voiceTrack()
  setLoudness(B.voice, -16)
  setLoudness(B.music, -27, 1, C.gavel[1])
  const talk = voiceEnvelope(B.voice[0])
  const verb = reverb(B.verb, { room: 0.86, damp: 0.4 })
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  const mix = [
    [B.music, 1, 0.4],
    [B.sfx, 1, 0.25],
    [verb, 0.5, 0.35],
    [B.voice, 1, 0],
  ]
  for (const [bus, g, underVoice] of mix) {
    for (let j = 0; j < N; j++) {
      const d = g * (1 - underVoice * talk[j])
      L[j] += bus[0][j] * d
      R[j] += bus[1][j] * d
    }
  }
  const fadeStart = DURATION - 1.2
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const g = Math.cos((Math.PI / 2) * Math.min(1, (j / SR - fadeStart) / 1.2)) ** 2
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
