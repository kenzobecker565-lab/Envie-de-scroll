/**
 * ============================================================================
 *  Bande-son de la pub, entièrement synthétisée (aucun sample).
 * ============================================================================
 * House-pop à 128 BPM calée sur cues.js :
 *   - mesures 1-2 : musique étouffée « à travers le téléphone », en ré mineur,
 *     coupée net (effet « bande qui s'arrête ») quand le scroll se fige ;
 *     puis nappe, montée et roulement de caisse claire jusqu'à l'explosion ;
 *   - mesures 3-6 : le groove en fa majeur (fa, do, ré mineur, si bémol) ;
 *   - mesure 7 : le slogan, en demi-temps, qui remonte vers
 *   - mesure 8 : l'accord final et les carillons de la signature.
 * Chaque action à l'écran a son bruitage (balayage, clap, crayon, pop…).
 *
 *   node audio.mjs [fichier.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BEAT, DURATION, T, beat } from './cues.js'

const SR = 48000
const N = Math.ceil(DURATION * SR)
const TAU = Math.PI * 2

// ------------------------------------------------------------------ outils

let seed = 0x2f6b1d
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const mtof = (m) => 440 * 2 ** ((m - 69) / 12)
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const expInterp = (a, b, p) => a * (b / a) ** p

const newBus = () => [new Float32Array(N), new Float32Array(N)]

/** Filtre biquadratique (formules RBJ). */
class Biquad {
  constructor(type, freq, q = 0.707, gainDb = 0) {
    this.x1 = this.x2 = this.y1 = this.y2 = 0
    this.set(type, freq, q, gainDb)
  }
  set(type, freq, q = 0.707, gainDb = 0) {
    const w = (TAU * Math.min(freq, SR * 0.45)) / SR
    const cos = Math.cos(w)
    const alpha = Math.sin(w) / (2 * q)
    const A = 10 ** (gainDb / 40)
    let b0, b1, b2, a0, a1, a2
    switch (type) {
      case 'lowpass':
        b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'highpass':
        b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'bandpass':
        b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'peaking':
        b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A
        break
      case 'highshelf': {
        const s = 2 * Math.sqrt(A) * alpha
        b0 = A * (A + 1 + (A - 1) * cos + s); b1 = -2 * A * (A - 1 + (A + 1) * cos); b2 = A * (A + 1 + (A - 1) * cos - s)
        a0 = A + 1 - (A - 1) * cos + s; a1 = 2 * (A - 1 - (A + 1) * cos); a2 = A + 1 - (A - 1) * cos - s
        break
      }
      default:
        throw new Error(type)
    }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0
  }
  process(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y
    return y
  }
}

/** Dent de scie limitée en bande (polyBLEP) : moins de repliement qu'une scie naïve. */
function polyblep(t, dt) {
  if (t < dt) {
    t /= dt
    return t + t - t * t - 1
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt
    return t * t + t + t + 1
  }
  return 0
}

/**
 * Écrit un son dans un ou plusieurs bus. `render(i, t)` renvoie l'échantillon
 * (mono) ; `targets` = [[bus, gain], …] ; `pan` de -1 (gauche) à 1 (droite).
 */
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

// ------------------------------------------------------------------ bus

const B = {
  intro: newBus(), // musique « étouffée » des deux premières mesures
  drums: newBus(),
  bass: newBus(), // compressé par la grosse caisse (sidechain)
  pads: newBus(), // idem
  music: newBus(), // arpèges, accords piqués, cloches
  sfx: newBus(),
  voice: newBus(), // voix off (voir voiceOver())
  verb: newBus(), // envoi vers la réverbération
}
const kicks = [] // instants des grosses caisses du groove (pour le sidechain)

// --------------------------------------------------------------- instruments

function kick(t0, gain = 1, { bus = B.drums, track = true, click = 0.25 } = {}) {
  if (track) kicks.push(t0)
  let ph = 0
  place([[bus, gain]], t0, 0.6, (i, t) => {
    const f = 44 + 125 * Math.exp(-t / 0.026) + 28 * Math.exp(-t / 0.18)
    ph += (TAU * f) / SR
    let v = Math.sin(ph) * Math.exp(-t / 0.34) * Math.min(1, t / 0.0015)
    if (i < 110) v += noise() * click * (1 - i / 110)
    return Math.tanh(v * 1.7) / Math.tanh(1.7)
  })
}

function clap(t0, gain = 0.5, pan = 0) {
  const bp = new Biquad('bandpass', 1350, 0.8)
  const hp = new Biquad('highpass', 700)
  place([[B.drums, gain], [B.verb, gain * 0.35]], t0, 0.5, (i, t) => {
    let env = 0
    for (const o of [0, 0.01, 0.021]) if (t >= o) env += Math.exp(-(t - o) / 0.0065)
    if (t > 0.03) env += 0.55 * Math.exp(-(t - 0.03) / 0.12)
    return hp.process(bp.process(noise())) * env * 1.8
  }, pan)
}

function snare(t0, gain = 0.4, pitch = 1) {
  const bp = new Biquad('bandpass', 2000 * pitch, 0.7)
  let ph = 0
  place([[B.drums, gain], [B.verb, gain * 0.25]], t0, 0.25, (i, t) => {
    ph += (TAU * 185 * pitch * (1 + 0.5 * Math.exp(-t / 0.01))) / SR
    return bp.process(noise()) * 1.4 * Math.exp(-t / 0.075) + Math.sin(ph) * 0.6 * Math.exp(-t / 0.05)
  })
}

function hat(t0, gain = 0.12, open = false, pan = 0.25) {
  const hp = new Biquad('highpass', open ? 6500 : 8000, 0.8)
  const decay = open ? 0.16 : 0.032
  place([[B.drums, gain]], t0, open ? 0.6 : 0.15, (i, t) => hp.process(noise()) * Math.exp(-t / decay), pan)
}

function crash(t0, gain = 0.3) {
  const hp = new Biquad('highpass', 3800, 0.7)
  const bp = new Biquad('bandpass', 7500, 0.9)
  place([[B.drums, gain], [B.verb, gain * 0.5]], t0, 1.6, (i, t) => {
    const n = hp.process(noise())
    return (0.7 * n + 0.8 * bp.process(n)) * Math.exp(-t / 0.55) * Math.min(1, t / 0.002)
  })
}

function boom(t0, gain = 0.6, f0 = 62, f1 = 36, decay = 0.9) {
  let ph = 0
  place([[B.sfx, gain]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
}

function bassNote(t0, dur, midi, gain = 0.38) {
  const f = mtof(midi)
  const lp = new Biquad('lowpass', 800, 1)
  let ph = 0
  place([[B.bass, gain]], t0, dur + 0.08, (i, t) => {
    ph = (ph + f / SR) % 1
    const saw = 2 * ph - 1 - polyblep(ph, f / SR)
    if (i % 16 === 0) lp.set('lowpass', 260 + 1100 * Math.exp(-t / 0.07), 1.2)
    const env = Math.min(1, t / 0.004) * (t < dur ? 1 : Math.exp(-(t - dur) / 0.02))
    return (0.75 * Math.sin(TAU * ph) + 0.5 * lp.process(saw)) * env
  })
}

/** Corde pincée « additive » : harmoniques qui s'éteignent d'autant plus vite qu'elles sont aiguës. */
function pluck(t0, midi, gain = 0.15, { pan = 0, bus = B.music, send = 0.22, decay = 0.35, bright = 1 } = {}) {
  const f = mtof(midi)
  const partials = []
  for (let k = 1; k <= 8; k++) {
    if (f * k > SR * 0.42) break
    partials.push([k, (1 / k ** 1.3) * (k === 1 ? 1 : bright), decay / (1 + 0.7 * (k - 1))])
  }
  const phase0 = rand() * TAU
  place([[bus, gain], [B.verb, gain * send]], t0, decay * 4, (i, t) => {
    let v = 0
    for (const [k, a, d] of partials) v += a * Math.sin(TAU * f * k * t + phase0 * k) * Math.exp(-t / d)
    return v * Math.min(1, t / 0.002) * 0.7
  }, pan)
}

/** Cloche / carillon en synthèse FM. */
function bell(t0, midi, gain = 0.12, { pan = 0, decay = 1.1, ratio = 3.5, index = 2.6, send = 0.45 } = {}) {
  const f = mtof(midi)
  place([[B.music, gain], [B.verb, gain * send]], t0, decay * 3.5, (i, t) => {
    const I = index * Math.exp(-t / 0.18)
    const v = Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t))
    return v * Math.exp(-t / decay) * Math.min(1, t / 0.0015) * 0.8
  }, pan)
}

/** Accord piqué : dents de scie désaccordées, filtre qui se referme vite. */
function stab(t0, midis, gain = 0.1, { len = 0.22, bus = B.music, cutoff = 4200 } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.09, -0.5], [0.09, 0.5]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.9)
      let ph = rand()
      place([[bus, gain / midis.length], [B.verb, (gain / midis.length) * 0.3]], t0, len + 0.3, (i, t) => {
        ph = (ph + f / SR) % 1
        if (i % 16 === 0) lp.set('lowpass', 600 + cutoff * Math.exp(-t / 0.06), 0.9)
        const env = Math.min(1, t / 0.003) * (t < len ? Math.exp(-t / 0.25) : Math.exp(-len / 0.25) * Math.exp(-(t - len) / 0.05))
        return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * env
      }, pan)
    }
  }
}

/** Nappe : dents de scie désaccordées et filtrées, attaque et relâchement lents. */
function pad(t0, dur, midis, gain = 0.1, { attack = 0.25, release = 0.5, cutoff = 1900, bus = B.pads } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.12, -0.8], [0.03, 0], [0.13, 0.8]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.6)
      let ph = rand()
      place([[bus, gain / midis.length], [B.verb, (gain / midis.length) * 0.35]], t0, dur + release * 4, (i, t) => {
        ph = (ph + f / SR) % 1
        const env = Math.min(1, t / attack) * (t < dur ? 1 : Math.exp(-(t - dur) / release))
        return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * env * 0.6
      }, pan)
    }
  }
}

// ------------------------------------------------------------------ bruitages

/** Souffle filtré dont la fréquence glisse (balayages, montées, « whoosh »). */
function sweep(t0, len, { f0, f1, fmid = null, q = 1.4, shape = 'bell', gain = 0.3, pan = 0, bus = B.sfx, send = 0.2 }) {
  const bp = new Biquad('bandpass', f0, q)
  place([[bus, gain], [B.verb, gain * send]], t0, len, (i, t) => {
    const p = t / len
    if (i % 8 === 0) {
      const f = fmid ? (p < 0.5 ? expInterp(f0, fmid, p * 2) : expInterp(fmid, f1, p * 2 - 1)) : expInterp(f0, f1, p)
      bp.set('bandpass', f, q)
    }
    let env
    if (shape === 'bell') env = Math.sin(Math.PI * p) ** 1.6
    else if (shape === 'rise') env = p ** 2.2 * (p > 0.97 ? (1 - p) / 0.03 : 1)
    else env = Math.exp(-p * 5) * Math.min(1, t / 0.01) // 'fall'
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

/** Claquement de bois (clap de cinéma). */
function clack(t0, gain = 0.5) {
  const bp = new Biquad('bandpass', 2400, 1.8)
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, 0.15, (i, t) =>
    bp.process(noise()) * 2.5 * Math.exp(-t / 0.006) + Math.sin(TAU * 1150 * t) * Math.exp(-t / 0.02) * 0.8 + Math.sin(TAU * 640 * t) * Math.exp(-t / 0.035) * 0.6,
  )
}

/** Crayon qui gratte le papier. */
function scribble(t0, len, gain = 0.14, pan = 0) {
  const bp = new Biquad('bandpass', 3200, 1.1)
  const bp2 = new Biquad('bandpass', 1300, 1.4)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const p = t / len
    const stroke = 0.35 + 0.65 * Math.abs(Math.sin(TAU * 9 * t + 2 * Math.sin(TAU * 3.3 * t)))
    const env = Math.min(1, p / 0.08) * Math.min(1, (1 - p) / 0.12)
    const n = noise()
    return (bp.process(n) * 1.6 + bp2.process(n) * 0.8) * stroke * env
  }, pan)
}

/** « Boing » de dessin animé (saut). */
function boing(t0, gain = 0.16) {
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, 0.35, (i, t) => {
    const f = 170 + 460 * (1 - Math.exp(-t / 0.05)) + 40 * Math.sin(TAU * 17 * t) * Math.exp(-t / 0.15)
    ph += (TAU * f) / SR
    return Math.sin(ph) * Math.exp(-t / 0.12) * Math.min(1, t / 0.004)
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

function sizzle(t0, len, gain = 0.05) {
  const hp = new Biquad('highpass', 4500, 0.7)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const p = t / len
    const crackle = rand() < 0.0025 ? 6 : 1
    return hp.process(noise()) * crackle * Math.min(1, p / 0.15) * Math.min(1, (1 - p) / 0.2)
  }, 0.3)
}

/** Roulement de caisse claire : doubles croches, puis triples croches, en crescendo. */
function roll(from, to, gain0, gain1) {
  const mid = (from + to) / 2
  const times = []
  for (let t = from; t < mid - 1e-6; t += BEAT / 4) times.push(t)
  for (let t = mid; t < to - 0.01; t += BEAT / 8) times.push(t)
  for (const t of times) {
    const p = (t - from) / (to - from)
    snare(t, gain0 + (gain1 - gain0) * p ** 1.4, 1 + 0.3 * p)
  }
}

/** Effet « bande qui s'arrête » : la lecture ralentit jusqu'à l'arrêt. */
function tapeStop(bus, t0, len) {
  const s0 = Math.round(t0 * SR)
  const n = Math.round(len * SR)
  for (const ch of bus) {
    const src = ch.slice()
    let pos = s0
    for (let i = 0; i < n && s0 + i < N; i++) {
      const q = i / n
      const rate = (1 - q) ** 1.6
      pos += rate
      const k = Math.floor(pos)
      const frac = pos - k
      ch[s0 + i] = (src[k] * (1 - frac) + src[k + 1] * frac) * (1 - q * 0.3)
    }
    for (let j = s0 + n; j < N; j++) ch[j] = 0
  }
}

// ================================================================= partition

const b = beat
const F_MAJ = [65, 69, 72, 77, 81, 84, 89] // fa, la, do… pour les carillons

function score() {
  // ------------------------------------------------ mesures 1-2 : l'intro
  // Musique « derrière l'écran » : ré mineur, arpège en doubles croches.
  const dmArp = [62, 69, 65, 69, 74, 69, 65, 69]
  for (let k = 0; k < 16; k++) pluck(b(k / 4), dmArp[k % 8], 0.16, { bus: B.intro, send: 0, decay: 0.22, pan: k % 2 ? 0.2 : -0.2 })
  for (let k = 0; k < 4; k++) kick(b(k), 0.8, { bus: B.intro, track: false, click: 0.05 })
  for (let k = 0; k < 8; k++) bassNote(b(k / 2), BEAT / 2 - 0.03, k % 2 ? 50 : 38, 0.3)
  for (let k = 0; k < 16; k++) hat(b(k / 4), k % 2 ? 0.05 : 0.09, false, 0.2)
  // (la basse et les charlestons passent aussi par le bus « intro »)
  // Balayages du pouce sur le fil
  T.flicks.forEach((f, k) => sweep(f - 0.07, 0.2, { f0: 700, f1: 4200, shape: 'bell', gain: 0.1 + k * 0.02, q: 1.1, pan: 0.2 }))
  // Les mots qui claquent
  boom(T.hook, 0.25, 90, 45, 0.18)
  boom(T.encore, 0.5, 120, 40, 0.25)
  crash(T.encore, 0.12)
  sweep(T.encoreScroll - 0.02, T.stop - T.encoreScroll, { f0: 400, f1: 6000, shape: 'rise', gain: 0.16, q: 0.9 })
  // Arrêt net : la musique s'effondre, un « scratch » et un coup sourd.
  sweep(T.stop, 0.16, { f0: 3500, f1: 250, shape: 'fall', gain: 0.35, q: 2 })
  boom(T.stop, 0.55, 80, 32, 0.35)

  // Le bouton apparaît : petit pop et carillon lumineux, nappe pleine d'espoir.
  pop(T.button, 0.3, 700, 180)
  ;[77, 81, 84].forEach((m, i) => bell(T.button + 0.04 + i * 0.07, m, 0.07, { pan: (i - 1) * 0.4 }))
  pad(T.button + 0.05, T.drop - T.button - 0.15, [53, 57, 60, 64], 0.22, { attack: 0.6, release: 0.25, cutoff: 1600 })
  kick(b(5), 0.55, { track: false, click: 0 })
  kick(b(7), 0.6, { track: false, click: 0 })
  // Le doigt arrive et appuie.
  sweep(T.fingerIn, 0.28, { f0: 300, f1: 1800, shape: 'bell', gain: 0.07 })
  tick(T.press, 0.22, 1800)
  pop(T.press + 0.01, 0.3, 500, 150)
  ;[77, 81, 84, 89].forEach((m, i) => bell(T.transform + i * 0.055, m, 0.055, { pan: -0.3 + i * 0.2, decay: 0.8 }))
  // Le bouton se charge : montée, roulement, grondement.
  sweep(T.charge - 0.3, T.drop - T.charge + 0.3, { f0: 300, f1: 9000, shape: 'rise', gain: 0.5, q: 0.8 })
  {
    let ph = 0
    place([[B.sfx, 0.26]], T.charge, T.drop - T.charge, (i, t) => {
      const p = t / (T.drop - T.charge)
      ph += (TAU * expInterp(87, 349, p ** 1.5)) / SR
      return (2 * (ph / TAU % 1) - 1) * p ** 2 * 0.6
    })
  }
  roll(b(6.5), T.drop, 0.12, 0.55)

  // ------------------------------------------------ 3,75 s : l'explosion
  kick(T.drop, 1.1)
  boom(T.drop, 0.7, 70, 30, 1.1)
  crash(T.drop, 0.4)
  sweep(T.drop, 0.6, { f0: 5000, f1: 400, shape: 'fall', gain: 0.25, q: 0.7 })
  for (let k = 0; k < 9; k++) bell(T.drop + 0.03 + k * 0.045, F_MAJ[(k * 3) % F_MAJ.length] + 12 * (k % 2), 0.035, { pan: Math.sin(k * 2.1) * 0.8, decay: 0.5, index: 1.8 })

  // ------------------------------------------------ mesures 3-6 : le groove
  const CHORDS = [
    { root: 41, voicing: [57, 60, 65], arp: [65, 69, 72, 69, 77, 72, 69, 72] }, // fa
    { root: 36, voicing: [55, 60, 64], arp: [67, 72, 76, 72, 79, 76, 72, 76] }, // do
    { root: 38, voicing: [57, 62, 65], arp: [69, 74, 77, 74, 81, 77, 74, 77] }, // ré mineur
    { root: 34, voicing: [58, 62, 65], arp: [70, 74, 77, 74, 82, 77, 74, 77] }, // si bémol
  ]
  CHORDS.forEach((ch, bar) => {
    const t0 = b(8 + bar * 4)
    pad(t0, b(4) - 0.05, ch.voicing.map((m) => m - 12).concat(ch.voicing), 0.11, { attack: 0.08, release: 0.3, cutoff: 2200 })
    for (let k = 0; k < 8; k++) bassNote(t0 + k * (BEAT / 2), BEAT / 2 - 0.04, ch.root + (k % 2 ? 12 : 0), 0.34)
    for (let k = 0; k < 16; k++) pluck(t0 + k * (BEAT / 4), ch.arp[k % 8] + (k >= 8 && k % 4 === 0 ? 12 : 0), 0.085, { pan: k % 2 ? 0.35 : -0.35, decay: 0.28, bright: 0.8 })
    stab(t0 + b(1.5), ch.voicing.map((m) => m + 12), 0.12)
    stab(t0 + b(3.5), ch.voicing.map((m) => m + 12), 0.12)
  })
  for (let k = 8; k < 24; k++) {
    kick(b(k), 1)
    if (k % 2 === 1) clap(b(k), 0.5)
    hat(b(k + 0.5), 0.13, (k + 1) % 4 === 0, 0.25)
    hat(b(k + 0.25), 0.045, false, -0.3)
    hat(b(k + 0.75), 0.045, false, -0.3)
  }

  // Bruitages de chaque passion
  T.scenes.forEach((s, k) => {
    if (k > 0) sweep(s - 0.14, 0.34, { f0: 500, fmid: 3200, f1: 900, shape: 'bell', gain: 0.13, q: 1.2, pan: k % 2 ? 0.4 : -0.4 })
    pop(s + (k === 0 ? 0.1 : 0.02), 0.12, 1300, 500, -0.3) // étiquette d'humeur
    sweep(s + 0.1, 0.22, { f0: 2500, f1: 700, shape: 'bell', gain: 0.06, pan: 0.5 }) // carte qui glisse
    bell(s + (k === 0 ? 0.63 : 0.55), [84, 88, 86, 84, 88, 89][k], 0.07, { decay: 0.6, pan: 0.5 }) // validation
  })
  scribble(T.scenes[0] + 0.18, 0.5, 0.1) // le crayon dessine le chat
  clack(beat(10.75), 0.45) // clap de cinéma
  for (let i = 0; i < 5; i++) pop(beat(11) + i * 0.045, 0.06, 1400 + i * 180, 900 + i * 120, -0.4 + i * 0.2) // étoiles
  for (let i = 0; i < 39; i += 2) tick(T.scenes[2] + 0.1 + i * 0.016, 0.028 + rand() * 0.015, 3000 + rand() * 1500, 0.2) // stylo
  for (let k = 14; k < 16; k++) {
    clap(b(k + 0.5), 0.2, -0.4) // percussions corporelles
    clap(b(k + 0.75), 0.14, 0.4)
  }
  boing(beat(16) + 0.06, 0.13)
  boing(beat(17) + 0.06, 0.13)
  thud(beat(16) + BEAT * 0.62, 0.25)
  thud(beat(17) + BEAT * 0.62, 0.25)
  sizzle(T.scenes[5] + 0.05, 1.3, 0.035)
  sweep(T.scenes[5] + 0.24, 0.42, { f0: 800, fmid: 2600, f1: 600, shape: 'bell', gain: 0.09 }) // la galette saute
  thud(T.scenes[5] + 0.68, 0.18)

  // ------------------------------------------------ mesure 6 : la progression
  sweep(T.zoomOut - 0.05, 0.6, { f0: 4000, f1: 250, shape: 'bell', gain: 0.16, q: 0.8 })
  sweep(T.dashboard, 0.35, { f0: 900, f1: 3500, shape: 'bell', gain: 0.07, pan: 0.4 })
  T.stickers.forEach((s, i) => {
    pop(s, 0.2, 900, 260, i === 1 ? 0.5 : -0.5)
    bell(s + 0.02, [84, 88, 91][i], 0.06, { decay: 0.7, pan: i === 1 ? 0.5 : -0.5 })
  })
  for (let i = 0; i < 18; i++) tick(T.dashboard + 0.35 + i * 0.045, 0.022, 1400 + i * 70, (i % 2 ? 0.3 : -0.3))
  scribble(T.stickers[0] + 0.25, 0.3, 0.025)
  sweep(T.wipe - 0.1, T.slogan - T.wipe + 0.1, { f0: 200, f1: 5000, shape: 'rise', gain: 0.3, q: 0.8 })

  // ------------------------------------------------ mesure 7 : le slogan
  const Gm7 = [55, 58, 62, 65]
  kick(T.slogan, 1.1)
  boom(T.slogan, 0.55, 70, 34, 0.8)
  crash(T.slogan, 0.25)
  stab(T.slogan, Gm7.map((m) => m + 12), 0.2, { len: 0.35 })
  pad(T.slogan, b(2) - 0.05, [43, ...Gm7], 0.13, { attack: 0.05, release: 0.4 })
  bassNote(T.slogan, b(1.5), 31, 0.4)
  kick(b(25.5), 0.8)
  clap(b(25), 0.45)
  scribble(T.strike, 0.3, 0.2, 0)
  sweep(T.strike - 0.05, 0.4, { f0: 600, fmid: 3000, f1: 400, shape: 'bell', gain: 0.12 })
  // « Crée plus. » : lumière, carillons, et ça remonte.
  kick(T.create, 1)
  stab(T.create, [60, 64, 67, 72], 0.2, { len: 0.3 })
  pad(T.create, b(2) - 0.02, [48, 55, 60, 64, 67], 0.12, { attack: 0.1, release: 0.3 })
  bassNote(T.create, b(1) - 0.05, 36, 0.4)
  ;[84, 88, 91, 96].forEach((m, i) => bell(T.create + 0.28 + i * 0.07, m, 0.06, { pan: -0.4 + i * 0.27, decay: 0.8 }))
  roll(b(26.5), T.endcard, 0.12, 0.55)
  sweep(T.shrink - 0.3, T.endcard - T.shrink + 0.3, { f0: 600, f1: 8000, shape: 'rise', gain: 0.42, q: 0.9 })

  // ------------------------------------------------ mesure 8 : la signature
  kick(T.endcard, 1.15)
  boom(T.endcard, 0.7, 70, 30, 1.2)
  crash(T.endcard, 0.35)
  pad(T.endcard, DURATION - T.endcard, [41, 53, 57, 60, 64, 67], 0.22, { attack: 0.02, release: 0.6, cutoff: 2600 })
  stab(T.endcard, [65, 69, 72, 76], 0.2, { len: 0.4 })
  bassNote(T.endcard, 1.2, 29, 0.42)
  for (let k = 0; k < 8; k++) bell(T.endcard + 0.02 + k * 0.03, F_MAJ[k % F_MAJ.length] + 12, 0.04, { pan: Math.sin(k * 1.9) * 0.8, decay: 0.7, index: 1.5 })
  ;[65, 69, 72, 77, 81].forEach((m, i) => pluck(T.endcard + 0.1 + i * 0.07, m, 0.07, { pan: -0.4 + i * 0.2, decay: 0.45 }))
  scribble(T.logoStrike, 0.3, 0.12)
  ;[77, 81, 84].forEach((m, i) => bell(T.tagline + i * 0.09, m, 0.05, { decay: 1.2, pan: -0.3 + i * 0.3 }))
  pop(T.cta, 0.25, 800, 220)
  bell(T.cta + 0.02, 89, 0.08, { decay: 1.4 })
  kick(T.cta, 0.6)
  ;[0, 1].forEach((i) => bell(T.cta + 0.4 + i * 0.47, 84 + i * 5, 0.04, { decay: 0.9, pan: i ? 0.4 : -0.4 }))
}

// ================================================================== mixage

/** Réverbération Freeverb (8 filtres en peigne + 4 passe-tout par canal). */
function reverb([inL, inR], { room = 0.83, damp = 0.28 } = {}) {
  const scale = SR / 44100
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((n) => Math.round(n * scale))
  const apT = [556, 441, 341, 225].map((n) => Math.round(n * scale))
  const run = (input, spread) => {
    const out = new Float32Array(N)
    const combs = combT.map((d) => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }))
    const aps = apT.map((d) => ({ buf: new Float32Array(d + spread), i: 0 }))
    for (let j = 0; j < N; j++) {
      const x = input[j] * 0.015
      let s = 0
      for (const c of combs) {
        const y = c.buf[c.i]
        c.store = y * (1 - damp) + c.store * damp
        c.buf[c.i] = x + c.store * room
        c.i = (c.i + 1) % c.buf.length
        s += y
      }
      for (const a of aps) {
        const bv = a.buf[a.i]
        a.buf[a.i] = s + bv * 0.5
        a.i = (a.i + 1) % a.buf.length
        s = bv - s
      }
      out[j] = s * 3
    }
    return out
  }
  return [run(inL, 0), run(inR, Math.round(23 * scale))]
}

function filterBus(bus, filters) {
  for (let c = 0; c < 2; c++) {
    const fs = filters.map((f) => new Biquad(...f))
    const ch = bus[c]
    for (let j = 0; j < N; j++) {
      let v = ch[j]
      for (const f of fs) v = f.process(v)
      ch[j] = v
    }
  }
}

/** Sonie intégrée (LUFS, pondération K, avec portes absolue et relative). */
function loudness(L, R) {
  const k = [new Biquad('highshelf', 1681, 0.7072, 4), new Biquad('highpass', 38, 0.5)]
  const k2 = [new Biquad('highshelf', 1681, 0.7072, 4), new Biquad('highpass', 38, 0.5)]
  const sq = new Float64Array(N)
  for (let j = 0; j < N; j++) {
    const l = k[1].process(k[0].process(L[j]))
    const r = k2[1].process(k2[0].process(R[j]))
    sq[j] = l * l + r * r
  }
  const block = Math.round(0.4 * SR)
  const hop = Math.round(0.1 * SR)
  const blocks = []
  for (let s = 0; s + block <= N; s += hop) {
    let sum = 0
    for (let j = s; j < s + block; j++) sum += sq[j]
    blocks.push(sum / block)
  }
  const lufs = (ms) => -0.691 + 10 * Math.log10(ms)
  const abs = blocks.filter((m) => lufs(m) > -70)
  const mean = (arr) => arr.reduce((a, v) => a + v, 0) / arr.length
  const rel = lufs(mean(abs)) - 10
  return lufs(mean(abs.filter((m) => lufs(m) > rel)))
}

/** Limiteur avec anticipation (5 ms) : aucun échantillon ne dépasse le plafond. */
function limit(L, R, ceiling) {
  const look = Math.round(0.005 * SR)
  const rel = Math.exp(-1 / (0.09 * SR))
  const need = new Float32Array(N)
  for (let j = 0; j < N; j++) {
    const peak = Math.max(Math.abs(L[j]), Math.abs(R[j]))
    need[j] = peak > ceiling ? ceiling / peak : 1
  }
  const gain = new Float32Array(N)
  let g = 1
  for (let j = 0; j < N; j++) {
    // Gain nécessaire dans la fenêtre à venir, atteint progressivement.
    let target = 1
    for (let k = 0; k <= look && j + k < N; k++) {
      const n = need[j + k]
      if (n < 1) target = Math.min(target, 1 - (1 - n) * (1 - k / (look + 1)))
    }
    g = target < g ? target : g * rel + target * (1 - rel)
    gain[j] = g
  }
  for (let j = 0; j < N; j++) {
    L[j] *= gain[j]
    R[j] *= gain[j]
  }
}

// ================================================================= voix off

const HERE = path.dirname(fileURLToPath(import.meta.url))

/** Lit un WAV PCM 16 bits (premier canal) : { sr, x }. */
function readWav(file) {
  const b = fs.readFileSync(file)
  const channels = b.readUInt16LE(22)
  const sr = b.readUInt32LE(24)
  let off = 12
  while (b.toString('ascii', off, off + 4) !== 'data') off += 8 + b.readUInt32LE(off + 4)
  const n = b.readUInt32LE(off + 4) / (2 * channels)
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) x[i] = b.readInt16LE(off + 8 + i * 2 * channels) / 32768
  return { sr, x }
}

/** Ne garde que la parole : silences de début et de fin retirés (petites marges, fondus). */
function trimSilence(x, sr) {
  const peak = x.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
  const th = peak * 10 ** (-40 / 20)
  let a = 0
  while (a < x.length && Math.abs(x[a]) < th) a++
  let z = x.length - 1
  while (z > a && Math.abs(x[z]) < th) z--
  const pre = Math.round(0.012 * sr)
  const post = Math.round(0.08 * sr)
  const out = x.slice(Math.max(0, a - pre), Math.min(x.length, z + post))
  const fade = Math.round(0.006 * sr)
  for (let i = 0; i < fade && i < out.length; i++) {
    out[i] *= i / fade
    out[out.length - 1 - i] *= i / fade
  }
  return { x: out, onset: Math.min(pre, a) / sr }
}

/** Rééchantillonnage par interpolation cubique (Catmull-Rom). */
function resample(x, from, to) {
  const n = Math.floor((x.length * to) / from)
  const y = new Float32Array(n)
  const at = (i) => x[Math.min(x.length - 1, Math.max(0, i))]
  for (let j = 0; j < n; j++) {
    const pos = (j * from) / to
    const i = Math.floor(pos)
    const f = pos - i
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    y[j] = p1 + 0.5 * f * (p2 - p0 + f * (2 * p0 - 5 * p1 + 4 * p2 - p3 + f * (3 * (p1 - p2) + p3 - p0)))
  }
  return y
}

/**
 * Place chaque réplique de voiceover.json (fichiers voice/<id>.wav, voir
 * voiceover.py) au temps musical prévu : le début de la parole tombe pile
 * sur le repère.
 */
function voiceOver() {
  const script = JSON.parse(fs.readFileSync(path.join(HERE, 'voiceover.json'), 'utf8'))
  for (const line of script.lines) {
    const file = path.join(HERE, 'voice', `${line.id}.wav`)
    if (!fs.existsSync(file)) continue
    const { sr, x } = readWav(file)
    const { x: speech, onset } = trimSilence(x, sr)
    const y = resample(speech, sr, SR)
    const s0 = Math.round((beat(line.beat) - onset) * SR)
    for (let i = 0; i < y.length; i++) {
      const j = s0 + i
      if (j < 0 || j >= N) continue
      B.voice[0][j] += y[i]
      B.voice[1][j] += y[i]
    }
  }
}

/** Compresseur simple (détection de crête), pour une voix régulière et présente. */
function compress(ch, { threshold = -22, ratio = 3.2, attack = 0.003, release = 0.09, makeup = 0 } = {}) {
  const aA = Math.exp(-1 / (attack * SR))
  const aR = Math.exp(-1 / (release * SR))
  let env = 0
  for (let j = 0; j < N; j++) {
    const level = Math.abs(ch[j])
    env = level > env ? aA * env + (1 - aA) * level : aR * env + (1 - aR) * level
    const over = 20 * Math.log10(env + 1e-9) - threshold
    ch[j] *= 10 ** (((over > 0 ? -over * (1 - 1 / ratio) : 0) + makeup) / 20)
  }
}

/** Enveloppe 0 → 1 de présence de la voix (avec anticipation), pour baisser la musique. */
function voiceEnvelope(ch) {
  const aA = Math.exp(-1 / (0.012 * SR))
  const aR = Math.exp(-1 / (0.28 * SR))
  const look = Math.round(0.04 * SR)
  const env = new Float32Array(N)
  let e = 0
  for (let j = N - 1; j >= 0; j--) env[j] = Math.abs(ch[j]) // copie
  const out = new Float32Array(N)
  for (let j = 0; j < N; j++) {
    const level = Math.min(1, (j + look < N ? env[j + look] : 0) / 0.08)
    e = level > e ? aA * e + (1 - aA) * level : aR * e + (1 - aR) * level
    out[j] = e
  }
  return out
}

export function renderAudio() {
  seed = 0x2f6b1d
  kicks.length = 0
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  score()
  voiceOver()

  // Intro « à travers le haut-parleur d'un téléphone », puis arrêt de bande.
  filterBus(B.intro, [['highpass', 220, 0.7], ['lowpass', 1500, 0.9]])
  tapeStop(B.intro, T.stop, 0.34)

  // Voix : coupe-bas, présence, filtre anti-images du rééchantillonnage, compression.
  filterBus(B.voice, [['highpass', 95, 0.7], ['peaking', 250, 1, -2], ['peaking', 3200, 0.9, 3.5], ['lowpass', 10500, 0.7]])
  for (const ch of B.voice) compress(ch, { makeup: 6 })
  const voicePeak = B.voice[0].reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1
  for (const ch of B.voice) for (let j = 0; j < N; j++) ch[j] *= 0.7 / voicePeak
  for (let j = 0; j < N; j++) {
    B.verb[0][j] += B.voice[0][j] * 0.05
    B.verb[1][j] += B.voice[1][j] * 0.05
  }
  const talk = voiceEnvelope(B.voice[0])

  // Sidechain : basse et nappes s'effacent à chaque grosse caisse.
  const duck = new Float32Array(N).fill(1)
  for (const k of kicks) {
    const s0 = Math.round(k * SR)
    for (let i = 0; i < 0.42 * SR && s0 + i < N; i++) {
      const t = i / SR
      const d = 1 - 0.75 * Math.min(1, t / 0.004) * Math.exp(-t / 0.11)
      duck[s0 + i] = Math.min(duck[s0 + i], d)
    }
  }
  const verb = reverb(B.verb)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  // [bus, gain, pompé par la grosse caisse, baisse sous la voix (0 à 1)]
  const mix = [
    [B.intro, 2.0, false, 0.65],
    [B.drums, 0.85, false, 0.4],
    [B.bass, 0.8, true, 0.45],
    [B.pads, 0.7, true, 0.6],
    [B.music, 0.9, false, 0.6],
    [B.sfx, 1.0, false, 0.75],
    [verb, 0.55, true, 0.5],
    [B.voice, 1.2, false, 0],
  ]
  for (const [bus, g, ducked, underVoice] of mix) {
    for (let j = 0; j < N; j++) {
      const d = (ducked ? duck[j] : 1) * (1 - underVoice * talk[j])
      L[j] += bus[0][j] * g * d
      R[j] += bus[1][j] * g * d
    }
  }
  // Fondu final.
  const fadeStart = DURATION - 0.45
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const p = (j / SR - fadeStart) / 0.45
    const g = Math.cos((Math.PI / 2) * Math.min(1, p)) ** 2
    L[j] *= g
    R[j] *= g
  }
  // Coupe-bas de sécurité, sonie visée −14 LUFS, plafond −1,5 dB.
  filterBus([L, R], [['highpass', 28, 0.7]])
  const ceiling = 10 ** (-1.5 / 20)
  for (let pass = 0; pass < 3; pass++) {
    const gain = 10 ** ((-14 - loudness(L, R)) / 20)
    for (let j = 0; j < N; j++) {
      L[j] *= gain
      R[j] *= gain
    }
    limit(L, R, ceiling)
  }
  return [L, R]
}

/** Écrit un WAV 16 bits stéréo (avec un léger tramage). */
export function writeAudio(file) {
  const [L, R] = renderAudio()
  const data = Buffer.alloc(N * 4)
  for (let j = 0; j < N; j++) {
    const dither = (rand() - rand()) / 32768
    data.writeInt16LE(Math.round(clamp(L[j] + dither, -1, 1) * 32767), j * 4)
    data.writeInt16LE(Math.round(clamp(R[j] + dither, -1, 1) * 32767), j * 4 + 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(2, 22) // stéréo
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * 4, 28)
  header.writeUInt16LE(4, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.concat([header, data]))
}

// Utilisation directe : node audio.mjs [sortie.wav]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), 'build', 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
