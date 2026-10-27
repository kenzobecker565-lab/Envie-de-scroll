/**
 * Bande-son de la pub « Envol » : musique et bruitages synthétisés, sans sample.
 * Elle reprend la grille et le motif montant de la signature Scroll-up
 * (ambiances/signature.mjs : ré majeur, Dmaj9 – Bm7 – Gmaj9 – Aadd9), à 120 BPM :
 *   0 → 4 s   tic-tac, nappe sombre, le motif joué à l'envers (il descend) ;
 *             une note qui tombe par minute, un « gloup » quand elle disparaît ;
 *   4 s       arrêt de bande, le temps suspendu ; Minuton attrape la minute ;
 *   6 → 8 s   le motif remonte (une note par mot), montée, roulement ;
 *   8 → 18 s  le drop : un étage par mesure, le motif qui grimpe, des pièces ;
 *   18 → 25 s le sommet, les tenues, l'app (geste, minuteur, crayon) ;
 *   25 → 30 s la signature, l'accord final de ré.
 *   node envol/audio.mjs [sortie.wav]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, filterBus, limit, mtof, reverb, writeWav } from '../dsp.mjs'
import { BEAT, DURATION, FALLS, FALL_TIME, FLOORS, T } from './cues.js'

const N = Math.ceil(DURATION * SR)
let seed = 0xe7f01
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const bus = () => [new Float32Array(N), new Float32Array(N)]
const B = { music: bus(), drums: bus(), sfx: bus(), verb: bus() }

function place(targets, t0, len, render, pan = 0) {
  const s0 = Math.round(t0 * SR)
  const n = Math.round(len * SR)
  const a = ((pan + 1) * Math.PI) / 4
  const gl = Math.SQRT2 * Math.cos(a)
  const gr = Math.SQRT2 * Math.sin(a)
  for (let i = 0; i < n; i++) {
    const j = s0 + i
    if (j < 0 || j >= N) continue
    const v = render(i, i / SR)
    for (const [b, g] of targets) {
      b[0][j] += v * g * gl
      b[1][j] += v * g * gr
    }
  }
}

// ------------------------------------------------------------ instruments

/** Piano électrique doux (comme la signature). */
function keys(t0, midi, level, dur = 1.6, pan = 0, wet = 0.35) {
  const f = mtof(midi)
  place([[B.music, level], [B.verb, level * wet]], t0, dur + 0.3, (i, t) => {
    const env = Math.min(1, t / 0.006) * Math.exp(-t / 0.9) * Math.min(1, (dur + 0.3 - t) / 0.2)
    const ph = TAU * f * t
    return (Math.sin(ph + 0.9 * Math.sin(ph * 2) * Math.exp(-t * 6)) + 0.25 * Math.sin(2 * ph) * Math.exp(-t * 3)) * env
  }, pan)
}

/** Cloche claire (les minutes, les pièces). */
function bell(t0, midi, level, dur = 1.2, pan = 0) {
  const f = mtof(midi)
  place([[B.sfx, level], [B.verb, level * 0.5]], t0, dur, (i, t) => {
    const env = Math.min(1, t / 0.002) * Math.exp(-t / (dur * 0.35))
    return (Math.sin(TAU * f * t) + 0.45 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t * 8) + 0.25 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t * 14)) * env
  }, pan)
}

/** Nappe (accord tenu). */
function pad(t0, notes, dur, level, { attack = 0.4, release = 0.6, bright = 1 } = {}) {
  for (const [k, m] of notes.entries()) {
    const f = mtof(m)
    const pan = (k / Math.max(1, notes.length - 1) - 0.5) * 0.8
    place([[B.music, level], [B.verb, level * 0.6]], t0, dur + release, (i, t) => {
      const env = Math.min(1, t / attack) * Math.min(1, Math.max(0, (dur + release - t) / release))
      const ph = TAU * f * t
      return (Math.sin(ph) * 0.7 + Math.sin(ph * 1.003) * 0.25 + Math.sin(ph * 2.001) * 0.12 * bright) * env
    }, pan)
  }
}

function bassNote(t0, midi, level, dur = 0.22) {
  const f = mtof(midi)
  place([[B.music, level]], t0, dur, (i, t) => {
    const env = Math.min(1, t / 0.004) * Math.min(1, (dur - t) / 0.03)
    const ph = TAU * f * t
    return Math.tanh(1.6 * (Math.sin(ph) + 0.3 * Math.sin(2 * ph))) * env
  })
}

function kick(t0, level = 1) {
  place([[B.drums, level]], t0, 0.4, (i, t) => {
    const f = 48 + 110 * Math.exp(-t * 32)
    return Math.sin(TAU * (48 * t + (110 / 32) * (1 - Math.exp(-t * 32)))) * Math.exp(-t * 7) * (1 + 0 * f)
  })
}

function clap(t0, level = 0.5) {
  const bp = new Biquad('bandpass', 1500, 1.1)
  place([[B.drums, level], [B.verb, level * 0.4]], t0, 0.25, (i, t) => {
    const burst = t < 0.03 ? 0.6 + 0.4 * Math.sin(t * 900) : 1
    return bp.process(noise()) * 3 * Math.exp(-t * 22) * burst
  })
}

function hat(t0, level = 0.12, open = false, pan = 0.2) {
  const hp = new Biquad('highpass', 7500, 0.8)
  place([[B.drums, level]], t0, open ? 0.3 : 0.06, (i, t) => hp.process(noise()) * Math.exp(-t * (open ? 12 : 70)), pan)
}

function whoosh(t0, dur, level, { from = 400, to = 4000, pan = 0 } = {}) {
  const bp = new Biquad('bandpass', from, 1.4)
  place([[B.sfx, level], [B.verb, level * 0.3]], t0, dur, (i, t) => {
    const p = t / dur
    if (i % 32 === 0) bp.set('bandpass', from * (to / from) ** p, 1.4)
    return bp.process(noise()) * Math.sin(Math.PI * p) ** 1.5 * 2.2
  }, pan)
}

function tick(t0, level, f = 3200) {
  const bp = new Biquad('bandpass', f, 6)
  place([[B.sfx, level]], t0, 0.05, (i, t) => bp.process(noise()) * Math.exp(-t * 160) * 6)
}

function gulp(t0, level) {
  place([[B.sfx, level]], t0, 0.3, (i, t) => {
    const f = 260 * Math.exp(-t * 9) + 50
    return Math.sin(TAU * f * t) * Math.exp(-t * 10) * Math.min(1, t / 0.01)
  })
}

function pop(t0, level, from = 300, to = 1100) {
  place([[B.sfx, level]], t0, 0.16, (i, t) => {
    const f = from + (to - from) * Math.min(1, t / 0.08)
    return Math.sin(TAU * f * t) * Math.exp(-t * 26)
  })
}

function sweepTone(t0, dur, level, from, to) {
  let ph = 0
  place([[B.sfx, level]], t0, dur, (i, t) => {
    const p = t / dur
    ph += (TAU * (from * (to / from) ** p)) / SR
    return Math.sin(ph) * Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.05)
  })
}

function crash(t0, level = 0.25) {
  const hp = new Biquad('highpass', 4200, 0.7)
  place([[B.drums, level], [B.verb, level * 0.5]], t0, 2.2, (i, t) => hp.process(noise()) * Math.exp(-t * 1.6) * Math.min(1, t / 0.003))
}

function scratch(t0, dur, level) {
  const bp = new Biquad('bandpass', 2600, 2)
  place([[B.sfx, level]], t0, dur, (i, t) => bp.process(noise()) * (0.4 + 0.6 * Math.abs(Math.sin(t * 22))) * Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.05) * 1.6)
}

// ---------------------------------------------------------------- partition

const CH = {
  D: [50, 57, 61, 64, 66],
  Bm: [47, 54, 57, 61, 62],
  G: [43, 50, 54, 57, 59],
  A: [45, 52, 57, 59, 61],
}
const CLIMB = { D: [74, 78, 81, 86], Bm: [74, 78, 81, 83], G: [74, 79, 83, 86], A: [76, 81, 85, 88] }
const AT = [0, 0.75, 1.5, 2.5]

function groove(t0, chord, { drums = true, half = false, motif = true, octave = 0, level = 1 } = {}) {
  const c = CH[chord]
  pad(t0, c.slice(1).map((m) => m + 12), 2.0, 0.016 * level, { attack: 0.05, release: 0.3 })
  for (let e = 0; e < 8; e++) bassNote(t0 + e * BEAT * 0.5, c[0] - 12 + (e % 2 ? 12 : 0), 0.11 * level, 0.2)
  if (motif) AT.forEach((b, i) => keys(t0 + b * BEAT, CLIMB[chord][i] + octave, 0.11 * level, 1.2, i % 2 ? 0.25 : -0.25))
  if (!drums) return
  for (let b = 0; b < 4; b++) {
    if (!half || b % 2 === 0) kick(t0 + b * BEAT, 0.95)
    if (half ? b === 2 : b % 2 === 1) clap(t0 + b * BEAT, 0.42)
    hat(t0 + b * BEAT + BEAT / 2, 0.1, b % 2 === 1)
    hat(t0 + b * BEAT, 0.06, false, -0.2)
  }
}

function score() {
  // 1 · la chute : tic-tac, nappe sombre, motif qui descend
  for (let b = 0; b < 8; b++) tick(b * BEAT, 0.5, b % 2 ? 2400 : 3300)
  pad(0, [47 - 12, 54, 57, 62], 2.0, 0.022, { attack: 0.8, release: 0.4, bright: 0.3 })
  pad(2, [43 - 12, 50, 54, 59], 2.0, 0.022, { attack: 0.3, release: 0.08, bright: 0.3 })
  ;[[0.0, 86], [0.75, 81], [1.5, 78], [2.5, 74], [4.0, 83], [4.75, 78], [5.5, 74], [6.5, 71]].forEach(([b, m]) => {
    if (b * BEAT < T.freeze) keys(b * BEAT, m - 12, 0.09, 1.1, 0, 0.5)
  })
  FALLS.forEach((f, i) => {
    bell(f, 93 - (i % 5) * 2, 0.05, 0.5, (i % 3) - 1)
    const hit = f + FALL_TIME * Math.sqrt(1630 / 1830)
    if (hit < T.freeze) gulp(hit, 0.35)
  })
  // l'arrêt de bande, le temps suspendu
  sweepTone(T.freeze, 0.4, 0.25, 260, 35)
  place([[B.music, 0.012], [B.verb, 0.02]], T.freeze + 0.1, 2.0, (i, t) => [86, 90, 93].reduce((s, m) => s + Math.sin(TAU * mtof(m) * t), 0) * (0.6 + 0.4 * Math.sin(t * 9)) * Math.min(1, t / 0.4) * Math.min(1, (2.0 - t) / 0.5))
  whoosh(T.minuton - 0.1, 0.35, 0.4, { from: 500, to: 2500, pan: 0.4 })
  pop(T.catch, 0.5, 240, 900)
  bell(T.catch, 86, 0.16, 1.6)
  bell(T.catch + 0.01, 93, 0.09, 1.6)

  // 2 · le motif remonte, la montée
  pad(6, CH.A.slice(1), 2.0, 0.02, { attack: 1.2, release: 0.05 })
  ;[74, 78, 81, 86].forEach((m, i) => keys(6 + i * 0.25, m, 0.13, 1.0, i % 2 ? 0.3 : -0.3))
  whoosh(T.up - 0.05, 0.45, 0.45, { from: 300, to: 5000 })
  for (let k = 0; k < 16; k++) {
    const t = T.up + (1 - (1 - k / 16) ** 1.6) * 0.98
    clap(t, 0.08 + 0.2 * (k / 16))
  }
  sweepTone(T.up, 1.0, 0.06, 180, 1400)
  whoosh(T.reverse, 0.55, 0.6, { from: 250, to: 7000 })
  place([[B.sfx, 0.25]], T.reverse, 0.5, (i, t) => noise() * (t / 0.5) ** 3)

  // 3 · le drop : un étage par mesure
  crash(T.drop, 0.3)
  const prog = ['D', 'Bm', 'G', 'A', 'D']
  FLOORS.forEach((F, k) => {
    groove(F, prog[k], { octave: k >= 3 ? 12 : 0 })
    whoosh(F + 1.72, 0.5, 0.35, { from: 350, to: 4500 })
    for (let i = 0; i < 5; i++) bell(F + 1.2 + i * 0.06, 81 + [0, 4, 7, 12, 16][i] - 12, 0.07, 0.4, (i - 2) * 0.3)
    bell(F + 1.25, 93, 0.08, 1.0)
  })

  // 4 · le sommet : demi-temps, les pièces, les tenues
  crash(T.summit, 0.32)
  groove(18, 'D', { half: true, motif: false })
  groove(20, 'G', { half: true, motif: false, level: 0.8 })
  pad(18, [62, 69, 73, 76, 78], 3.0, 0.02, { attack: 0.05, release: 1.0 })
  for (let i = 0; i < 12; i++) bell(T.rule + i * 0.04, 86 + [0, 2, 4, 7, 9, 12][i % 6], 0.045, 0.35, (i % 5) / 2 - 1)
  T.outfits.forEach((t, i) => {
    pop(t, 0.4, i < 2 ? 350 : 500, i < 2 ? 1200 : 1500)
    bell(t + 0.08, [90, 93, 95, 98][i], 0.06, 0.7)
  })

  // 5 · l'app
  whoosh(T.phone, 0.5, 0.35, { from: 200, to: 2500 })
  groove(21, 'Bm', { motif: false, level: 0.8 })
  groove(23, 'A', { motif: false, level: 0.8 })
  keys(21.25, 74, 0.1, 1.2)
  keys(21.5, 78, 0.1, 1.2)
  keys(21.75, 81, 0.1, 1.2)
  tick(T.swipe - 0.05, 0.5, 2000)
  whoosh(T.swipe, 0.4, 0.45, { from: 400, to: 6000 })
  for (let k = 0; k < 20; k++) tick(22.6 + k * 0.065, 0.18, 4200)
  scratch(22.75, 1.05, 0.12)
  whoosh(T.screen3 - 0.05, 0.35, 0.3, { from: 1500, to: 500, pan: -0.3 })
  bell(T.screen3 + 0.25, 86, 0.12, 1.2)
  bell(T.screen3 + 0.3, 90, 0.08, 1.2)
  whoosh(24.75, 0.4, 0.35, { from: 300, to: 5000 })

  // 6 · la signature
  pad(25, CH.G.slice(1).map((m) => m + 12), 1.0, 0.02, { attack: 0.3, release: 0.1 })
  pop(T.endMinuton, 0.4, 300, 1000)
  groove(26, 'D', { level: 1 })
  groove(28, 'A', { level: 1, motif: false })
  ;[74, 78, 81, 86, 90].forEach((m, i) => keys(28 + i * 0.12, m, 0.08, 1.0, 0))
  tick(28.5, 0.6, 1800)
  // l'accord final
  crash(T.final, 0.35)
  kick(T.final, 1.1)
  pad(T.final, [38, 50, 57, 62, 66, 69, 74, 78], 0.4, 0.024, { attack: 0.01, release: 0.65 })
  ;[62, 66, 69, 74, 78, 81].forEach((m, i) => keys(T.final + i * 0.03, m, 0.09, 0.9, (i - 2.5) * 0.2, 0.6))
  for (let i = 0; i < 16; i++) bell(T.final + 0.1 + rand() * 0.6, 86 + [0, 4, 7, 12][i % 4], 0.03, 0.5, rand() * 2 - 1)
}

function renderAudio() {
  score()
  filterBus(B.drums, [['highpass', 30, 0.7]])
  filterBus(B.music, [['highpass', 40, 0.7], ['lowpass', 9000, 0.7]])
  // la chute : musique étouffée, comme sous l'eau, jusqu'au renversement
  const lp = [new Biquad('lowpass', 900, 0.8), new Biquad('lowpass', 900, 0.8)]
  for (let c = 0; c < 2; c++) {
    const ch = B.music[c]
    for (let j = 0; j < Math.round(T.reverse * SR); j++) ch[j] = lp[c].process(ch[j])
  }
  const wet = reverb(B.verb, { room: 0.8, damp: 0.35 })
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  // pompe : la musique s'efface sous chaque kick du groove
  const duck = (j) => {
    const t = j / SR
    if (t < T.drop || t > 29) return 1
    const ph = (t % BEAT) / BEAT
    return 0.55 + 0.45 * Math.min(1, ph / 0.35)
  }
  for (let j = 0; j < N; j++) {
    const d = duck(j)
    const fade = Math.min(1, (N - j) / (SR * 0.6))
    L[j] = (B.music[0][j] * d + B.drums[0][j] + B.sfx[0][j] + wet[0][j] * 0.9) * fade
    R[j] = (B.music[1][j] * d + B.drums[1][j] + B.sfx[1][j] + wet[1][j] * 0.9) * fade
  }
  limit(L, R, 0.89)
  return [L, R]
}

export function writeAudio(file) {
  const [L, R] = renderAudio()
  writeWav(file, L, R, rand)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'envol', 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
