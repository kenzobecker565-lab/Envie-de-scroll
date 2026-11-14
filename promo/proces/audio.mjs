/**
 * ============================================================================
 *  Bande-son du procès « le maire Robin des Bois » : musique, bruitages, voix.
 * ============================================================================
 *  - Musique originale synthétisée ici, ambiance thriller judiciaire : tic-tac
 *    et nappe tendue pour l'accroche, puis basse pulsée, cordes et percussions
 *    graves en ré mineur ; elle s'arrête sur « Les débats sont clos » et laisse
 *    place à un drone et à un tic-tac lent pour le vote.
 *  - Bruitages calés sur cues.js : compteur, clameur de la foule, tampon,
 *    factures, pièces, coups de marteau, flashs du montage…
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
const SEC = (id) => C.sections.find((s) => s.id === id)
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

function page(t0, gain = 0.07) {
  const bp = new Biquad('bandpass', 3000, 0.8)
  place([[B.sfx, gain]], t0, 0.1, (i, t) => bp.process(noise()) * 2 * Math.sin((Math.PI * t) / 0.1))
}

// ================================================================== musique
// Ré mineur, 96 BPM, ambiance thriller judiciaire : basse pulsée en croches,
// cordes (ré m – si♭ – sol m – la), percussions graves sur les temps forts.

const BPM = 96
const BEAT = 60 / BPM
const BAR = BEAT * 4
const CH = [
  [38, 50, 57, 62, 65],
  [34, 46, 53, 58, 62],
  [31, 43, 50, 55, 58],
  [33, 45, 52, 57, 61],
]

function piano(t0, midi, gain = 0.08, pan = 0) {
  const f = mtof(midi)
  const len = 2.4
  place([[B.music, gain], [B.verb, gain * 0.6]], t0, len, (i, t) => {
    const I = 1.4 * Math.exp(-t / 0.25)
    const env = Math.exp(-t / 0.9) * Math.min(1, t / 0.004) * Math.min(1, (len - t) / 0.2)
    return (Math.sin(TAU * f * t + I * Math.sin(TAU * f * t)) + 0.25 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.4)) * env * 0.6
  }, pan)
}

function strings(t0, dur, midis, gain = 0.06, { attack = 0.6, release = 0.8, cutoff = 1500 } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.08, -0.7], [0.06, 0.7]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.6)
      let ph = rand()
      place([[B.music, gain / midis.length], [B.verb, (gain / midis.length) * 0.5]], t0, dur + release * 4, (i, t) => {
        ph = (ph + f / SR) % 1
        const env = Math.min(1, t / attack) * (t < dur ? 1 : Math.exp(-(t - dur) / release)) * (1 + 0.05 * Math.sin(TAU * 5 * t))
        return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * env * 0.5
      }, pan)
    }
  }
}

/** Basse pulsée : une croche, dent de scie filtrée, attaque sèche. */
function pulse(t0, midi, gain = 0.1) {
  const f = mtof(midi)
  const lp = new Biquad('lowpass', 700, 1.2)
  let ph = 0
  const len = BEAT / 2
  place([[B.music, gain]], t0, len, (i, t) => {
    ph = (ph + f / SR) % 1
    if (i % 16 === 0) lp.set('lowpass', 250 + 900 * Math.exp(-t / 0.05), 1.2)
    return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * Math.exp(-t / 0.18) * Math.min(1, (len - t) / 0.01)
  })
}

/** Percussion grave (type taïko). */
function drum(t0, gain = 0.3) {
  let ph = 0
  const bp = new Biquad('bandpass', 180, 1)
  place([[B.music, gain], [B.verb, gain * 0.4]], t0, 0.8, (i, t) => {
    ph += (TAU * expInterp(95, 48, clamp(t / 0.15))) / SR
    return (Math.sin(ph) * 1.0 + bp.process(noise()) * 0.6 * Math.exp(-t / 0.03)) * Math.exp(-t / 0.22)
  })
}

function clockTick(t0, gain = 0.07, hi = true) {
  const bp = new Biquad('bandpass', hi ? 3200 : 2400, 4)
  place([[B.sfx, gain]], t0, 0.05, (i, t) => bp.process(noise()) * 4 * Math.exp(-t / 0.006))
}

function music() {
  const close = C.gavel[1]
  const vote = S('18') - 0.3
  const debate = S('08')
  // L'accroche : coup grave, tic-tac, nappe tendue.
  drum(0.05, 0.45)
  strings(0.1, S('04') - 0.4, [38, 45, 50], 0.05, { attack: 1.2, cutoff: 900 })
  for (let t = 0.6; t < S('04') - 0.3; t += 0.5) clockTick(t, 0.05, Math.round(t / 0.5) % 2 === 0)
  // Les faits, puis le procès : la pulsation démarre.
  for (let bar = 0, t = S('04') - 0.25; t < close - 0.2; bar++, t += BAR) {
    const ch = CH[bar % 4]
    const len = Math.min(BAR, close - t)
    strings(t, len, [ch[1], ch[2], ch[3]], 0.05, { cutoff: t > debate ? 1300 : 1700 })
    for (let k = 0; k < 8; k++) {
      const tt = t + k * (BEAT / 2)
      if (tt >= close - 0.2) break
      pulse(tt, ch[0] + 12 * (k % 2), k % 2 ? 0.07 : 0.1)
    }
    for (const b of t < debate ? [0, 1.5, 2, 3] : [0, 2]) if (t + b * BEAT < close - 0.2) drum(t + b * BEAT, t < debate ? 0.3 : 0.22)
    if (t > debate) piano(t, ch[4] + 12, 0.06, 0.3)
  }
  // Le vote : drone grave, tic-tac lent, une note de piano qui revient.
  strings(vote, DURATION - vote - 0.5, [26, 38, 45, 50], 0.08, { attack: 1.4, cutoff: 800 })
  for (let t = vote + 0.4; t < DURATION - 1; t += 1) clockTick(t, 0.06, Math.round(t) % 2 === 0)
  for (let t = vote + 0.5; t < DURATION - 1.5; t += 2) piano(t, 74, 0.05, 0.2)
}

/** Clameur de foule : bruit filtré modulé (voix mêlées, cris). */
function crowd(t0, len, gain = 0.08) {
  const bp = new Biquad('bandpass', 700, 0.7)
  const bp2 = new Biquad('bandpass', 1600, 1.2)
  place([[B.sfx, gain], [B.verb, gain * 0.4]], t0, len, (i, t) => {
    const env = Math.min(1, t / 0.3) * Math.min(1, (len - t) / 0.4)
    const mod = 0.6 + 0.4 * Math.sin(TAU * 2.1 * t) * Math.sin(TAU * 0.7 * t + 1)
    const n = noise()
    return (bp.process(n) * 2 + bp2.process(n) * mod * 1.4) * env
  })
}

function coin(t0, gain = 0.05) {
  const f = 2800 + rand() * 1500
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, 0.4, (i, t) => (Math.sin(TAU * f * t) + 0.6 * Math.sin(TAU * f * 1.48 * t)) * Math.exp(-t / 0.09), rand() * 0.8 - 0.4)
}

function flashHit(t0) {
  sweep(t0 - 0.12, 0.3, { f0: 3000, f1: 800, gain: 0.12 })
  boom(t0, 0.25, 110, 50, 0.3)
}

// ============================================================ les bruitages

function score() {
  for (const s of C.sections.slice(1)) {
    if (s.cut === 'wipe') sweep(s.t0 - 0.24, 0.5, { f0: 300, f1: 3500, gain: 0.18 })
    else flashHit(s.t0)
  }
  // 1. L'accroche.
  const t3 = W('01', 'trois') - 0.05
  for (let i = 0; i < 18; i++) tick(t3 + 0.9 * (1 - (1 - i / 18) ** 2), 0.05, 2200 + i * 60)
  pop(W('01', 'public') - 0.05, 0.12, 700, 220)
  crowd(SEC('foule').t0, SEC('foule').t1 - SEC('foule').t0 + 0.2, 0.09)
  pop(W('03', 'toi') - 0.1, 0.12)
  // 2. Les faits.
  pop(SEC('mairie').t0 + 0.1, 0.12)
  boom(W('05', 'fermer') - 0.05, 0.5, 80, 34, 0.7)
  sweep(W('05', 'soixante') - 0.3, 1.2, { f0: 500, f1: 2500, gain: 0.08, q: 0.8 })
  for (let i = 0; i < 14; i++) page(W('06', 'fausses') - 0.4 + i * 0.09, 0.06)
  for (let i = 0; i < 6; i++) coin(SEC('factures').t0 + 0.3 + i * 0.4, 0.04)
  boom(W('07', 'dix') - 0.1, 0.45, 70, 32, 0.8)
  // 3. Le procès.
  for (const g of C.gavel) {
    gavel(g)
    gavel(g + 0.32, 0.45)
  }
  for (let i = 0; i < 12; i++) page(W('09', 'quarante') - 0.15 + i * 0.07, 0.05)
  boom(W('09', 'roi') - 0.05, 0.3, 90, 45, 0.5)
  for (let i = 0; i < 16; i++) tick(W('10', 'trois') - 0.1 + 0.8 * (1 - (1 - i / 16) ** 2), 0.04, 2000 + i * 70)
  pop(W('10', 'trois', 1) - 0.05, 0.14, 600, 220)
  pop(W('11', 'trois', 1) - 0.1, 0.14, 700, 250)
  pop(W('11', 'campagne') - 0.2, 0.12)
  for (let i = 0; i < 24; i++) coin(W('12', 'salaire') - 0.1 + i * 0.05, 0.035)
  boom(W('12', 'calcul') - 0.05, 0.25, 90, 50, 0.4)
  crowd(SEC('dehors').t0, SEC('dehors').t1 - SEC('dehors').t0 + 0.2, 0.1)
  boom(S('15') + 0.05, 0.25, 90, 50, 0.4)
  boom(S('16') + 0.05, 0.25, 90, 50, 0.4)
  // 4. Le vote.
  boom(W('18', 'jure') - 0.15, 0.4, 60, 30, 1.2)
  boom(W('18', 'coupable') - 0.1, 0.3, 90, 45, 0.5)
  boom(W('18', 'non') - 0.1, 0.3, 90, 45, 0.5)
  pop(W('18', 'et') - 0.1, 0.12)
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
  setLoudness(B.music, -26, 1, C.gavel[1])
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
