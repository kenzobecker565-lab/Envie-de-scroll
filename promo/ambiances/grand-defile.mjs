/**
 * La musique signature de Scroll-up, « Le grand défilé » (ambiance par défaut), et les quatre
 * autres propositions écartées : un groove bossa nova (guitare nylon, contrebasse, balais, clave)
 * porté par un orchestre (cordes, cuivres, timbales, harpe, célesta). Chaque piste reprend le
 * motif Scroll-up : trois notes qui montent (tonique, tierce, quinte).
 *
 * 48 mesures qui bouclent sans couture : deux tours calculés, le second gardé.
 *
 *   node promo/ambiances/grand-defile.mjs                → app/public/music/le-grand-defile.mp3
 *   node promo/ambiances/grand-defile.mjs <envol|samba|aube|mission|defile> [sortie.mp3]
 *
 * ffmpeg requis (ou FFMPEG=<chemin>).
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Biquad, SR, TAU, limit, mtof, polyblep, reverb, writeWav } from '../dsp.mjs'

const FFMPEG = process.env.FFMPEG || 'ffmpeg'

// ------------------------------------------------------------- les cinq recettes

const TRACKS = {
  /** Bossa en fa, cordes épiques : le refrain Scroll-up joué aux cors, puis à tout l'orchestre. */
  envol: {
    title: 'Grand envol', bpm: 132, lilt: 0.05, groove: 'bossa',
    A: ['Fmaj7', 'Dm7', 'Gm7', 'C7'], B: ['Bbmaj7', 'Am7', 'Dm7', 'Gm7', 'Bbmaj7', 'Am7', 'Gm7', 'C7'],
    up: [[0, 77, 0.5], [0.75, 81, 0.5], [1.5, 84, 0.75], [2.5, 81, 0.4], [3, 84, 0.5], [4.5, 86, 0.5], [5.25, 84, 0.5], [6, 81, 1.25], [8, 77, 0.5], [8.75, 82, 0.5], [9.5, 86, 0.75], [10.5, 84, 0.4], [11, 82, 0.5], [12.5, 79, 0.4], [13, 81, 0.4], [13.5, 84, 0.4], [14, 88, 1.6]],
    home: [[0, 77, 0.5], [0.75, 81, 0.5], [1.5, 84, 0.75], [2.5, 81, 0.4], [3, 84, 0.5], [4.5, 86, 0.5], [5.25, 84, 0.5], [6, 81, 1.25], [8, 77, 0.5], [8.75, 82, 0.5], [9.5, 86, 0.75], [10.5, 89, 0.9], [12.5, 88, 0.4], [13, 84, 0.4], [14, 84, 1.8]],
    lead: 'flute', lead2: 'horns', spiccato: true, brass: true, timpani: true, harp: true, celesta: false, pizz: false,
  },
  /** Samba-bossa en ré, plus vive : pizzicati et glockenspiel, ponctuations de cuivres. */
  samba: {
    title: 'Samba des minutons', bpm: 150, lilt: 0.035, groove: 'samba',
    A: ['Dmaj7', 'Bm7', 'Em7', 'A7'], B: ['Gmaj7', 'F#m7', 'Bm7', 'E7', 'Gmaj7', 'F#m7', 'Em7', 'A7'],
    up: [[0, 74, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2.5, 83, 0.5], [3, 81, 0.5], [3.5, 78, 0.5], [4, 79, 1], [5, 78, 0.5], [5.5, 76, 0.5], [6, 74, 1.5], [8, 74, 0.5], [8.5, 78, 0.5], [9, 81, 1], [10.5, 83, 0.5], [11, 85, 0.5], [11.5, 86, 0.5], [12, 88, 1], [13, 86, 0.5], [13.5, 85, 0.5], [14, 86, 1.8]],
    home: [[0, 74, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2.5, 83, 0.5], [3, 81, 0.5], [3.5, 78, 0.5], [4, 79, 1], [5, 78, 0.5], [5.5, 76, 0.5], [6, 74, 1.5], [8, 76, 0.5], [8.5, 79, 0.5], [9, 83, 1], [10, 81, 0.5], [10.5, 79, 0.5], [11, 78, 0.5], [11.5, 76, 0.5], [12, 74, 2.5]],
    lead: 'pizz', lead2: 'glock', spiccato: false, brass: true, timpani: false, harp: false, celesta: true, pizz: true,
  },
  /** Bossa lente et lumineuse en sol : harpe, flûte, grandes cordes qui s'ouvrent. */
  aube: {
    title: 'Aube dorée', bpm: 112, lilt: 0.06, groove: 'bossa',
    A: ['Gmaj7', 'Em7', 'Am7', 'D7'], B: ['Cmaj7', 'Bm7', 'Em7', 'A7', 'Cmaj7', 'Bm7', 'Am7', 'D7'],
    up: [[0, 67, 1], [1, 71, 1], [2, 74, 1.5], [3.5, 79, 0.5], [4, 78, 1], [5, 76, 1], [6, 74, 2], [8, 72, 1], [9, 76, 1], [10, 79, 1.5], [11.5, 81, 0.5], [12, 79, 1], [13, 78, 1], [14, 76, 2]],
    home: [[0, 67, 1], [1, 71, 1], [2, 74, 1.5], [3.5, 79, 0.5], [4, 78, 1], [5, 76, 1], [6, 74, 2], [8, 72, 1], [9, 76, 1], [10, 79, 1.5], [11.5, 81, 0.5], [12, 78, 1], [13, 74, 1], [14, 79, 2]],
    lead: 'flute', lead2: 'strings', spiccato: false, brass: false, timpani: true, harp: true, celesta: true, pizz: false,
  },
  /** Bossa d'aventure en ré mineur, façon film d'espion : cuivres, timbales, cordes marcato. */
  mission: {
    title: 'Minuton en mission', bpm: 128, lilt: 0.045, groove: 'bossa',
    A: ['Dm6', 'Dm7', 'Gm7', 'A7'], B: ['Bbmaj7', 'Gm7', 'A7', 'Dm7', 'Bbmaj7', 'Gm7', 'E7', 'A7'],
    up: [[0, 74, 0.5], [0.75, 77, 0.5], [1.5, 81, 1], [3, 80, 0.5], [3.5, 81, 0.5], [4, 79, 1], [5, 77, 0.5], [5.5, 76, 0.5], [6, 77, 1.5], [8, 74, 0.5], [8.75, 77, 0.5], [9.5, 81, 0.75], [10.5, 84, 0.5], [11, 82, 0.5], [11.5, 81, 0.5], [12, 79, 1], [13, 76, 0.5], [13.5, 73, 0.5], [14, 74, 1.8]],
    home: [[0, 74, 0.5], [0.75, 77, 0.5], [1.5, 81, 1], [3, 80, 0.5], [3.5, 81, 0.5], [4, 79, 1], [5, 77, 0.5], [5.5, 76, 0.5], [6, 77, 1.5], [8, 82, 0.5], [8.75, 81, 0.5], [9.5, 79, 0.75], [10.5, 77, 0.5], [11, 76, 0.5], [11.5, 74, 0.5], [12, 73, 1], [13, 76, 1], [14, 74, 1.8]],
    lead: 'flute', lead2: 'horns', spiccato: true, brass: true, timpani: true, harp: false, celesta: false, pizz: true,
  },
  /** Bossa de fanfare en si bémol : thème aux cuivres, cordes pleines, cymbales qui montent. */
  defile: {
    title: 'Le grand défilé', bpm: 136, lilt: 0.04, groove: 'bossa',
    A: ['Bbmaj7', 'Gm7', 'Cm7', 'F7'], B: ['Ebmaj7', 'Dm7', 'Gm7', 'C7', 'Ebmaj7', 'Dm7', 'Cm7', 'F7'],
    up: [[0, 70, 0.5], [0.5, 74, 0.5], [1, 77, 1.5], [2.5, 77, 0.5], [3, 79, 0.5], [3.5, 77, 0.5], [4, 82, 2], [6, 81, 0.5], [6.5, 79, 0.5], [7, 77, 1], [8, 75, 0.5], [8.5, 79, 0.5], [9, 82, 1.5], [10.5, 82, 0.5], [11, 84, 0.5], [11.5, 82, 0.5], [12, 86, 2], [14, 84, 0.5], [14.5, 82, 0.5], [15, 81, 1]],
    home: [[0, 70, 0.5], [0.5, 74, 0.5], [1, 77, 1.5], [2.5, 77, 0.5], [3, 79, 0.5], [3.5, 77, 0.5], [4, 82, 2], [6, 81, 0.5], [6.5, 79, 0.5], [7, 77, 1], [8, 75, 0.5], [8.5, 79, 0.5], [9, 82, 1], [10, 84, 1], [11, 86, 1], [12, 82, 3.5]],
    lead: 'horns', lead2: 'tutti', spiccato: true, brass: true, timpani: true, harp: false, celesta: true, pizz: false,
  },
}

const id = process.argv[2] ?? 'defile'
const T = TRACKS[id]
if (!T) throw new Error(`Piste inconnue : ${id} (${Object.keys(TRACKS).join(', ')})`)

const BPM = T.bpm
const BEAT = 60 / BPM
const E8 = BEAT / 2
const BAR = 4 * BEAT
const BARS = 48
const CYCLE = BARS * BAR
const N = Math.ceil(2 * CYCLE * SR) + SR
const LILT = T.lilt * E8
const e8 = (t, i) => t + i * E8 + (i % 2 ? LILT : 0)

let seed = 0x5c0011 ^ id.length * 7919
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const bus = () => [new Float32Array(N), new Float32Array(N)]
const B = { guitar: bus(), bass: bus(), drums: bus(), lead: bus(), orch: bus(), verb: bus() }

function place(targets, t0, len, render, pan = 0) {
  const s0 = Math.round(t0 * SR)
  const n = Math.round(len * SR)
  const a = ((pan + 1) * Math.PI) / 4
  const gl = Math.SQRT2 * Math.cos(a)
  const gr = Math.SQRT2 * Math.sin(a)
  for (let i = 0; i < n; i++) {
    const j = s0 + i
    if (j < 0 || j >= N) continue
    const v = render(i / SR)
    for (const [b, g] of targets) {
      b[0][j] += v * g * gl
      b[1][j] += v * g * gr
    }
  }
}

// ------------------------------------------------------------- accords

const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }
const QUALITY = { '': [0, 4, 7, 14], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m: [0, 3, 7, 14], '7': [0, 4, 7, 10], m6: [0, 3, 7, 9], '6': [0, 4, 7, 9] }
const above = (pc, floor) => floor + (((pc - floor) % 12) + 12) % 12
function chord(symbol) {
  const [, name, q] = symbol.match(/^([A-G][b#]?)(.*)$/)
  const root = PC[name]
  const iv = QUALITY[q]
  if (!iv) throw new Error(`Accord inconnu : ${symbol}`)
  const tones = iv.map((i) => (root + i) % 12)
  return {
    root: above(root, 33),
    guitar: [...new Set([tones[1], tones[2], tones[3], (root + 2) % 12])].slice(0, 4).map((p) => above(p, 52)).sort((a, b) => a - b),
    pad: tones.map((p) => above(p, 55)).sort((a, b) => a - b),
    up: tones.slice(0, 3).map((p) => above(p, 72)).sort((a, b) => a - b),
  }
}

// ------------------------------------------------------------- instruments (cordes pincées)

/** Corde pincée (Karplus-Strong accordé par passe-tout). */
function string(targets, t0, midi, dur, { bright = 0.45, t60 = 1.6, pan = 0, release = 0.06, damp = 1 } = {}) {
  const f = mtof(midi)
  const P = SR / f - 0.5 - (1 - damp) / damp
  const L = Math.max(2, Math.floor(P))
  const frac = P - L
  const a = (1 - frac) / (1 + frac)
  const g = 10 ** (-3 / (t60 * f))
  const buf = new Float32Array(L)
  let lp = 0, mean = 0
  for (let i = 0; i < L; i++) { lp += (noise() - lp) * bright; buf[i] = lp; mean += lp }
  mean /= L
  for (let i = 0; i < L; i++) buf[i] -= mean
  let idx = 0, prev = 0, x1 = 0, y1 = 0, soft = 0
  const len = dur + release
  place(targets, t0, len, (t) => {
    const out = buf[idx]
    const avg = 0.5 * (out + prev)
    prev = out
    soft += (avg - soft) * damp
    const y = a * soft + x1 - a * y1
    x1 = soft; y1 = y
    buf[idx] = y * g
    idx = (idx + 1) % L
    return out * Math.min(1, Math.max(0, (len - t) / release))
  }, pan)
}

function guitarChord(t0, notes, dur, lvl = 1, down = true) {
  const order = down ? notes : [...notes].reverse()
  order.forEach((m, n) => string([[B.guitar, 0.55 * lvl * (n === 0 ? 0.85 : 1)], [B.verb, 0.06 * lvl]], t0 + n * 0.006, m, dur, { bright: 0.22, t60: 1.5, pan: 0.2 + n * 0.05, damp: 0.55 }))
}
function thumb(t0, midi, dur, lvl = 1) { string([[B.guitar, 0.38 * lvl]], t0, midi, dur, { bright: 0.18, t60: 1.7, pan: 0.1, damp: 0.5 }) }
function upright(t0, midi, dur, lvl = 1) {
  string([[B.bass, 0.46 * lvl]], t0, midi, dur, { bright: 0.15, t60: 2.4, pan: -0.05, release: 0.05, damp: 0.45 })
  const f = mtof(midi)
  place([[B.bass, 0.17 * lvl]], t0, dur + 0.05, (t) => Math.sin(TAU * f * t) * Math.min(1, t / 0.008) * Math.exp(-t * 2.2) * Math.min(1, (dur + 0.05 - t) / 0.05))
}
function harp(t0, midi, lvl = 1, pan = -0.35) { string([[B.orch, 0.3 * lvl], [B.verb, 0.12 * lvl]], t0, midi, 2.2, { bright: 0.5, t60: 2.6, pan, release: 0.3, damp: 0.85 }) }
function pizz(t0, midi, lvl = 1, pan = -0.2) { string([[B.lead, 0.42 * lvl], [B.verb, 0.1 * lvl]], t0, midi, 0.35, { bright: 0.55, t60: 0.35, pan, release: 0.08, damp: 0.75 }) }

// ------------------------------------------------------------- instruments (orchestre)

/** Pupitre de cordes : trois dents de scie désaccordées, filtrées, vibrato qui arrive. */
function strings(t0, midi, dur, lvl = 1, { attack = 0.3, release = 0.5, cutoff = 2400, pan = 0, verb = 0.12, target = B.orch } = {}) {
  const f = mtof(midi)
  const det = [2 ** (-8 / 1200), 1, 2 ** (7 / 1200)]
  const ph = det.map(() => rand())
  const lp1 = new Biquad('lowpass', cutoff, 0.55)
  const lp2 = new Biquad('lowpass', cutoff * 1.3, 0.55)
  const len = dur + release
  place([[target, 0.06 * lvl], [B.verb, verb * 0.06 * lvl]], t0, len, (t) => {
    const vib = 1 + 0.004 * Math.sin(TAU * 5.3 * t) * Math.min(1, Math.max(0, (t - 0.25) / 0.4))
    let s = 0
    for (let k = 0; k < 3; k++) {
      const dt = (f * det[k] * vib) / SR
      ph[k] = (ph[k] + dt) % 1
      s += 2 * ph[k] - 1 - polyblep(ph[k], dt)
    }
    const env = Math.min(1, t / attack) * Math.min(1, Math.max(0, (len - t) / release))
    return lp2.process(lp1.process(s)) * env
  }, pan)
}
/** Cordes détachées (spiccato) : attaque nette, note courte. */
function spiccato(t0, midi, lvl = 1, pan = 0.3) { strings(t0, midi, E8 * 0.55, 0.9 * lvl, { attack: 0.008, release: 0.07, cutoff: 3600, pan, verb: 0.2 }) }

/** Cuivres : dents de scie avec un filtre qui s'ouvre à l'attaque (cors, trompettes en sourdine). */
function brass(t0, midi, dur, lvl = 1, { pan = -0.15, open = 2600, target = B.orch } = {}) {
  const f = mtof(midi)
  const det = [2 ** (-6 / 1200), 2 ** (5 / 1200)]
  const ph = det.map(() => rand())
  let y1 = 0, y2 = 0
  const len = dur + 0.18
  place([[target, 0.075 * lvl], [B.verb, 0.04 * lvl]], t0, len, (t) => {
    let s = 0
    for (let k = 0; k < 2; k++) {
      const dt = (f * det[k]) / SR
      ph[k] = (ph[k] + dt) % 1
      s += 2 * ph[k] - 1 - polyblep(ph[k], dt)
    }
    const swell = Math.min(1, t / 0.05)
    const fc = 380 + open * (0.55 + 0.45 * Math.exp(-t * 6)) * swell
    const a = 1 - Math.exp((-TAU * fc) / SR)
    y1 += (s - y1) * a
    y2 += (y1 - y2) * a
    const env = Math.min(1, t / 0.035) * Math.min(1, Math.max(0, (len - t) / 0.18)) * (0.85 + 0.15 * Math.exp(-t * 4))
    return y2 * env
  }, pan)
}
function flute(t0, midi, dur, lvl = 1, pan = 0.12) {
  const f = mtof(midi)
  const bp = new Biquad('bandpass', f, 6)
  const chiff = new Biquad('bandpass', f * 2, 3)
  let ph = 0
  place([[B.lead, 0.045 * lvl], [B.verb, 0.03 * lvl]], t0, dur + 0.15, (t) => {
    const vib = 1 + 0.005 * Math.sin(TAU * 5.2 * t) * Math.min(1, Math.max(0, (t - 0.18) / 0.25))
    ph += (TAU * f * vib) / SR
    const env = Math.min(1, t / 0.045) * Math.min(1, Math.max(0, (dur + 0.15 - t) / 0.15))
    const tone = Math.sin(ph) + 0.1 * Math.sin(2 * ph) + 0.03 * Math.sin(3 * ph)
    const breath = bp.process(noise()) * 0.22 + chiff.process(noise()) * Math.exp(-t * 40) * 0.4
    return (tone + breath) * env
  }, pan)
}
function bell(t0, midi, lvl = 1, pan = 0.35, ratio = [1, 2.76, 5.4]) {
  const f = mtof(midi)
  place([[B.lead, 0.03 * lvl], [B.verb, 0.04 * lvl]], t0, 1.6, (t) => {
    const env = Math.min(1, t / 0.002)
    return (Math.sin(TAU * f * ratio[0] * t) * Math.exp(-t * 2.5) + 0.4 * Math.sin(TAU * f * ratio[1] * t) * Math.exp(-t * 6) + 0.18 * Math.sin(TAU * f * ratio[2] * t) * Math.exp(-t * 12)) * env
  }, pan)
}
const glock = (t0, midi, lvl, pan) => bell(t0, midi, lvl, pan, [1, 2.76, 5.4])
const celesta = (t0, midi, lvl, pan) => bell(t0, midi, 0.8 * lvl, pan, [1, 2, 3.01])

// ------------------------------------------------------------- percussions

function kick(t0, lvl = 1) {
  let ph = 0
  place([[B.drums, 0.27 * lvl]], t0, 0.28, (t) => { ph += (TAU * (52 + 40 * Math.exp(-t * 30))) / SR; return Math.sin(ph) * Math.exp(-t * 11) })
}
function surdo(t0, lvl = 1, open = true) {
  let ph = 0
  place([[B.drums, 0.3 * lvl], [B.verb, 0.03 * lvl]], t0, 0.6, (t) => { ph += (TAU * (62 + 18 * Math.exp(-t * 18))) / SR; return Math.sin(ph) * Math.exp(-t * (open ? 5 : 16)) })
}
function timpani(t0, midi, lvl = 1) {
  const f = mtof(midi)
  const lp = new Biquad('lowpass', 500, 0.7)
  place([[B.orch, 0.32 * lvl], [B.verb, 0.12 * lvl]], t0, 2, (t) => {
    const fr = f * (1 + 0.04 * Math.exp(-t * 20))
    return (Math.sin(TAU * fr * t) + 0.5 * Math.sin(TAU * fr * 1.5 * t) * Math.exp(-t * 3) + lp.process(noise()) * Math.exp(-t * 30) * 0.8) * Math.exp(-t * 2.4) * Math.min(1, t / 0.004)
  }, -0.1)
}
function timpaniRoll(t0, midi, len, lvl = 1) { for (let t = 0; t < len; t += 0.06) timpani(t0 + t, midi, lvl * (0.25 + 0.5 * (t / len))) }
function crash(t0, lvl = 1) {
  const hp = new Biquad('highpass', 4500, 0.7)
  place([[B.drums, 0.05 * lvl], [B.verb, 0.05 * lvl]], t0, 2.4, (t) => hp.process(noise()) * Math.exp(-t * 1.6) * Math.min(1, t / 0.003), 0.35)
}
/** Cymbale qui monte (frottée) jusqu'au début de la section suivante. */
function swell(tEnd, len, lvl = 1) {
  const hp = new Biquad('highpass', 5000, 0.7)
  place([[B.drums, 0.035 * lvl], [B.verb, 0.03 * lvl]], tEnd - len, len, (t) => hp.process(noise()) * (t / len) ** 2.4, -0.3)
}
function rim(t0, lvl = 1) {
  const bp = new Biquad('bandpass', 1750, 3.5)
  place([[B.drums, 0.07 * lvl], [B.verb, 0.02 * lvl]], t0, 0.08, (t) => bp.process(noise()) * Math.exp(-t * 240) * 3 + Math.sin(TAU * 420 * t) * Math.exp(-t * 90) * 0.5, -0.25)
}
function brush(t0, lvl = 1, slap = false) {
  const lp = new Biquad('lowpass', slap ? 7000 : 5200, 0.7)
  const hp = new Biquad('highpass', 1800, 0.7)
  const len = slap ? 0.2 : 0.14
  place([[B.drums, 0.03 * lvl]], t0, len, (t) => hp.process(lp.process(noise())) * (slap ? Math.exp(-t * 22) : Math.min(1, t / 0.03) * Math.exp(-t * 20)) * 2.2, 0.3)
}
function chick(t0, lvl = 1) {
  const hp = new Biquad('highpass', 6500, 0.8)
  place([[B.drums, 0.018 * lvl]], t0, 0.05, (t) => hp.process(noise()) * Math.exp(-t * 90), 0.4)
}
function shaker(t0, lvl = 1) {
  const bp = new Biquad('bandpass', 5200, 1.3)
  place([[B.drums, 0.012 * lvl]], t0, 0.09, (t) => bp.process(noise()) * Math.min(1, t / 0.015) * Math.exp(-t * 35) * 2.4, -0.4)
}
function tamborim(t0, lvl = 1) {
  const bp = new Biquad('bandpass', 2600, 6)
  place([[B.drums, 0.05 * lvl]], t0, 0.07, (t) => bp.process(noise()) * Math.exp(-t * 120) * 2 + Math.sin(TAU * 1100 * t) * Math.exp(-t * 70) * 0.4, 0.45)
}

// ------------------------------------------------------------- forme : 48 mesures

const A = T.A.map(chord)
const Bc = T.B.map(chord)
const PLAN = [
  ...A.map((c) => ['intro', c]),
  ...[0, 1, 2, 3].flatMap(() => A.map((c) => ['A', c])),
  ...Bc.map((c) => ['B', c]),
  ...[0, 1, 2, 3].flatMap(() => A.map((c) => ['A2', c])),
  ...A.map((c) => ['turn', c]),
]
if (PLAN.length !== BARS) throw new Error(`Plan : ${PLAN.length} mesures`)
const CLAVE = [0, 3, 6, 10, 13]

/** Une voix de mélodie, choisie par la recette. */
function voice(kind, at, m, d, lvl = 1) {
  if (kind === 'flute') flute(at, m < 74 ? m : m - 12 + 12 * (m < 79), d, lvl)
  else if (kind === 'horns') { brass(at, m - 12, d, 1.1 * lvl, { pan: -0.12, target: B.lead }); brass(at, m - 24, d, 0.6 * lvl, { pan: 0.12, open: 1800, target: B.lead }) }
  else if (kind === 'pizz') { pizz(at, m, lvl); pizz(at, m - 12, 0.6 * lvl, 0.2) }
  else if (kind === 'glock') glock(at, m + 12, lvl, 0.35)
  else if (kind === 'strings') { strings(at, m, d, 1.6 * lvl, { attack: 0.08, release: 0.35, cutoff: 3200, target: B.lead }); strings(at, m - 12, d, 1.2 * lvl, { attack: 0.08, release: 0.35, cutoff: 2600, pan: -0.3, target: B.lead }) }
  else if (kind === 'tutti') { voice('horns', at, m, d, lvl); voice('strings', at, m + 12, d, 0.75 * lvl) }
}

function bar(t, sec, c, next, k, absBar) {
  const inPhrase = k % 4
  const phrase = Math.floor(k / 4)
  const groove = sec !== 'intro' || k >= 2
  const full = sec === 'A2'
  const quiet = sec === 'intro' || sec === 'turn'

  // ---------- guitare et contrebasse
  if (T.groove === 'samba') {
    // samba-bossa : accords en double croches syncopées
    const S16 = BEAT / 4
    const hits = [0, 3, 6, 8, 11, 14]
    hits.forEach((s, n) => guitarChord(t + s * S16, (s === 14 ? next : c).guitar, S16 * 1.6, s % 8 === 0 ? 0.9 : 0.7, n % 2 === 0))
    if (groove) { upright(t, c.root, BEAT * 0.9, 1); upright(t + BEAT * 1.5, c.root + 7, BEAT * 0.4, 0.7); upright(t + 2 * BEAT, c.root + 7 - 12 * (c.root + 7 > 45), BEAT * 0.9, 0.95); upright(t + BEAT * 3.5, next.root, BEAT * 0.4, 0.7) }
  } else {
    thumb(t, c.root + 12, BEAT * 1.6, 0.9)
    thumb(t + 2 * BEAT, c.root + 7, BEAT * 1.6, 0.8)
    const hits = full ? [[2, c], [3, c], [5, c], [6, c], [7, next]] : [[2, c], [3, c], [5, c], [7, next]]
    hits.forEach(([i, ch], n) => {
      const nextHit = hits[n + 1] ? hits[n + 1][0] : 8
      guitarChord(e8(t, i), ch.guitar, Math.max(0.12, (nextHit - i) * E8 - 0.02), i === 7 ? 1 : i === 2 ? 0.95 : 0.8, n % 2 === 0)
    })
    if (groove && sec !== 'turn') {
      upright(t, c.root, E8 * 2.8, 1)
      upright(e8(t, 3), c.root, E8 * 0.9, 0.7)
      upright(t + 2 * BEAT, c.root - 5 + 12 * (c.root - 5 < 31), E8 * 2.8, 0.95)
      upright(e8(t, 7), full ? next.root - 1 : c.root - 5 + 12 * (c.root - 5 < 31), E8 * 0.9, 0.7)
    } else upright(t, c.root, BAR * 0.9, 0.75)
  }

  // ---------- percussions
  const cell = absBar % 2
  for (const i of CLAVE) if (Math.floor(i / 8) === cell) rim(e8(t, i % 8), quiet ? 0.6 : 1)
  for (let s = 0; s < 16; s++) {
    const at = t + s * (BEAT / 4) + (s % 2 ? LILT / 2 : 0)
    if (T.groove === 'samba') { if (groove) shaker(at, s % 4 === 0 ? 1.1 : 0.7); if (groove && [0, 3, 6, 10, 12].includes(s)) tamborim(at, s === 0 ? 1 : 0.7) }
    else { brush(at, s % 4 === 0 ? 1 : 0.6, (s === 4 || s === 12) && !quiet); if (groove && s % 2 === 0) shaker(at, s % 4 === 0 ? 1 : 0.6) }
  }
  if (groove && !quiet) {
    if (T.groove === 'samba') { surdo(t, 0.6, false); surdo(t + 2 * BEAT, 1); kick(t, 0.6) }
    else { kick(t, 1); kick(e8(t, 3), 0.5); kick(t + 2 * BEAT, 0.9); kick(e8(t, 7), 0.5) }
  }
  if (groove) { chick(t + BEAT, 1); chick(t + 3 * BEAT, 1) }

  // ---------- orchestre
  const padLvl = sec === 'intro' ? 0.4 + 0.18 * k : sec === 'A' ? 0.55 : sec === 'B' ? 0.95 : sec === 'A2' ? 0.85 : 0.7
  c.pad.forEach((m, n) => strings(t, m, BAR * 0.98, padLvl, { attack: sec === 'intro' ? 0.9 : 0.35, release: 0.45, pan: -0.45 + n * 0.3, cutoff: sec === 'B' || full ? 2800 : 2000 }))
  if (sec === 'B' || full) strings(t, c.root + 12, BAR * 0.98, padLvl * 0.9, { attack: 0.3, release: 0.4, cutoff: 1400, pan: -0.2 })
  if (T.spiccato && (full || (sec === 'A' && phrase >= 2) || sec === 'B')) for (let i = 0; i < 8; i++) spiccato(e8(t, i), [c.pad[0], c.pad[2], c.pad[1] + 12, c.pad[2]][i % 4], i % 2 ? 0.7 : 1)
  if (T.pizz && sec === 'B') for (let i = 0; i < 4; i++) pizz(t + i * BEAT, c.up[i % 3] - 12, 0.6, 0.35)
  if (T.harp && (sec === 'intro' || sec === 'turn' || (sec === 'A' && inPhrase === 3))) [...c.pad, c.pad[0] + 12, c.pad[1] + 12].forEach((m, n) => harp(t + n * E8 * (sec === 'A' ? 0.5 : 1), m + 12, 0.8))
  if (T.celesta && (sec === 'intro' || sec === 'B') && inPhrase % 2 === 1) c.up.forEach((m, n) => celesta(t + (2 + n * 0.5) * BEAT, m + 12, 0.9))
  if (T.brass && (full || sec === 'B')) {
    // ponctuations : le « et » de 4 annonce l'accord suivant (comme la guitare)
    next.pad.slice(1).forEach((m, n) => brass(e8(t, 7), m, E8 * 0.9, full ? 0.7 : 0.45, { pan: -0.3 + n * 0.3, open: 3000 }))
    if (inPhrase === 0) c.pad.slice(1).forEach((m, n) => brass(t, m - 12, BEAT * 1.6, 0.5, { pan: 0.25 - n * 0.25, open: 1600 }))
  }
  if (T.timpani) {
    if ((full || sec === 'B') && inPhrase === 0) timpani(t, c.root, 1)
    if (full && inPhrase === 3) { timpani(e8(t, 6), next.root, 0.6); timpani(e8(t, 7), next.root, 0.8) }
    if (sec === 'intro' && k === 3) timpaniRoll(t + 2 * BEAT, next.root, 2 * BEAT, 0.9)
  }
  if ((sec === 'intro' && k === 3) || (sec === 'B' && k === 7)) swell(t + BAR, 2 * BEAT, 1.2)
  if ((sec === 'A' && k === 0) || (sec === 'A2' && k === 0) || (sec === 'A2' && k === 8)) crash(t, 1)

  // ---------- mélodie
  const hook = (h, kind, lvl) => { for (const [bt, m, d] of h) if (Math.floor(bt / 4) === inPhrase) voice(kind, t + (bt % 4) * BEAT + (Math.round(bt * 2) % 2 ? LILT : 0), m, d * BEAT, lvl) }
  if (sec === 'A') hook(phrase % 2 === 0 ? T.up : T.home, T.lead, phrase >= 2 ? 1 : 0.9)
  if (sec === 'A2') { hook(phrase % 2 === 0 ? T.up : T.home, T.lead2, 1); if (T.lead2 !== 'tutti') hook(phrase % 2 === 0 ? T.up : T.home, T.lead, 0.55) }
  if (sec === 'B') {
    // contre-chant aux cordes : la quinte, la tierce, la fondamentale de chaque accord
    const [a, b2, c2] = c.up
    voice('strings', t, c2, BEAT * 1.4, 0.8)
    voice('strings', t + BEAT * 1.5, b2, BEAT * 1, 0.75)
    voice('strings', t + BEAT * 2.5, k % 2 ? a : c2 + 2 - 12 * (c2 + 2 > 86), BEAT * 1.4, 0.8)
  }
  if (sec === 'turn' && k === 3) c.up.forEach((m, n) => (T.celesta ? celesta : glock)(t + (2 + n * 0.5) * BEAT, m + 12, 0.8, 0.3))
}

for (let cycle = 0; cycle < 2; cycle++) PLAN.forEach(([sec, c], i) => {
  const first = PLAN.findIndex(([s]) => s === sec)
  bar(cycle * CYCLE + i * BAR, sec, c, PLAN[(i + 1) % BARS][1], i - first, i)
})

// ------------------------------------------------------------- mixage : chaud mais aéré

const mk = (spec) => [spec.map((a) => new Biquad(...a)), spec.map((a) => new Biquad(...a))]
const gtrEq = mk([['peaking', 210, 0.8, 5], ['peaking', 900, 1.0, -4], ['lowpass', 2600, 0.6]])
const bassEq = mk([['lowpass', 900, 0.7]])
const orchEq = mk([['highpass', 90, 0.7], ['peaking', 350, 0.8, -2], ['highshelf', 6000, 0.7, -3]])
const wet = reverb(B.verb, { room: 0.8, damp: 0.45 })
const master = mk([['highpass', 30, 0.7], ['peaking', 1100, 0.9, -1.5], ['highshelf', 3500, 0.7, -2]])
const L = new Float32Array(N)
const R = new Float32Array(N)
const run = (x, fs) => { for (const f of fs) x = f.process(x); return x }
for (let j = 0; j < N; j++) {
  for (let ch = 0; ch < 2; ch++) {
    const v = run(B.guitar[ch][j], gtrEq[ch]) + run(B.bass[ch][j], bassEq[ch]) + B.drums[ch][j] + B.lead[ch][j] + run(B.orch[ch][j], orchEq[ch]) + wet[ch][j] * 0.55
    ;(ch ? R : L)[j] = run(v, master[ch])
  }
}
limit(L, R, 0.9)

const s0 = Math.round(CYCLE * SR)
const len = Math.round(CYCLE * SR)
const out = process.argv[3] ?? (id === 'defile' ? new URL('../../app/public/music/le-grand-defile.mp3', import.meta.url).pathname : `signature-${id}.mp3`)
const temp = mkdtempSync(join(tmpdir(), 'signature-'))
try {
  const wav = join(temp, 'piste.wav')
  writeWav(wav, L.slice(s0, s0 + len), R.slice(s0, s0 + len), rand)
  // Au volume commun des ambiances (deux passes de loudnorm, comme build.mjs).
  const ff = (args) => {
    const r = spawnSync(FFMPEG, args, { encoding: 'utf8', maxBuffer: 1 << 26 })
    if (r.status !== 0) throw new Error(`ffmpeg a échoué : ${r.error?.message ?? r.stderr.slice(-2000)}`)
    return r.stderr
  }
  const target = 'I=-16:TP=-1.5:LRA=11'
  const report = ff(['-hide_banner', '-i', wav, '-af', `loudnorm=${target}:print_format=json`, '-f', 'null', '-'])
  const m = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1))
  const loudnorm = `loudnorm=${target}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`
  ff(['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, '-af', `${loudnorm},aresample=44100`, '-map_metadata', '-1', '-metadata', `title=${T.title} — Scroll-up`, '-c:a', 'libmp3lame', '-b:a', '96k', out])
  console.log(`${out} · ${T.title} · ${T.bpm} BPM · ${(len / SR).toFixed(1)} s`)
} finally {
  rmSync(temp, { recursive: true, force: true })
}
