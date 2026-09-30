/**
 * ============================================================================
 *  Bande-son de la pub Scroll-up : musique et bruitages synthétisés, sans voix
 * ============================================================================
 * Pop électro à 120 BPM, en do majeur, calée sur cues.js :
 *   - 0 → 3 s : un lo-fi étouffé « à travers le téléphone » (la m7, fa maj7),
 *     qui ralentit comme une bande et s'arrête net sur « STOP. » ;
 *     une demi-seconde de silence, puis une montée jusqu'au drop ;
 *   - 4 s : le groove (do, sol, la mineur, fa), qui monte par étages :
 *     marimba sur les choix, sifflet sur la création, cuivres sur la
 *     récompense, coupures sur les changements de thème ;
 *   - 29 s : l'accord final de do sur l'appui du bouton de la signature.
 * Chaque action à l'écran a son bruitage (balayage, pop, clic, crayon,
 * clap, pièces, confettis…). Aucun sample : tout est calculé ici.
 *
 *   node scrollup/audio.mjs [fichier.wav]
 */

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, expInterp, filterBus, limit, loudness, mtof, polyblep, reverb, writeWav } from '../dsp.mjs'
import { BEAT, DURATION, T, beat } from './cues.js'

const N = Math.ceil(DURATION * SR)

// ------------------------------------------------------------------ outils

let seed = 0x5c0112
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1

const newBus = () => [new Float32Array(N), new Float32Array(N)]

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
  intro: newBus(), // le lo-fi « à travers le téléphone »
  drums: newBus(),
  bass: newBus(), // compressé par la grosse caisse (sidechain)
  pads: newBus(), // idem
  music: newBus(), // marimba, accords piqués, cloches, cuivres
  lead: newBus(), // le sifflet
  sfx: newBus(),
  verb: newBus(), // envoi vers la réverbération
}
const kicks = [] // instants des grosses caisses (pour le sidechain)

// --------------------------------------------------------------- batterie

function kick(t0, gain = 1, { bus = B.drums, track = true, click = 0.25 } = {}) {
  if (track) kicks.push(t0)
  let ph = 0
  place([[bus, gain]], t0, 0.55, (i, t) => {
    const f = 54 + 115 * Math.exp(-t / 0.022) + 30 * Math.exp(-t / 0.09)
    ph += (TAU * f) / SR
    let v = Math.sin(ph) * Math.exp(-t / 0.2) * Math.min(1, t / 0.0015)
    if (i < 110) v += noise() * click * (1 - i / 110)
    return Math.tanh(v * 1.8) / Math.tanh(1.8)
  })
}

function clap(t0, gain = 0.5, pan = 0, bus = B.drums) {
  const bp = new Biquad('bandpass', 1350, 0.8)
  const hp = new Biquad('highpass', 700)
  place([[bus, gain], [B.verb, gain * 0.35]], t0, 0.5, (i, t) => {
    let env = 0
    for (const o of [0, 0.01, 0.021]) if (t >= o) env += Math.exp(-(t - o) / 0.0065)
    if (t > 0.03) env += 0.55 * Math.exp(-(t - 0.03) / 0.12)
    return hp.process(bp.process(noise())) * env * 1.8
  }, pan)
}

function snap(t0, gain = 0.25, pan = 0) {
  const bp = new Biquad('bandpass', 2600, 2.2)
  place([[B.drums, gain], [B.verb, gain * 0.3]], t0, 0.12, (i, t) => bp.process(noise()) * 3 * Math.exp(-t / 0.012) + Math.sin(TAU * 1900 * t) * 0.4 * Math.exp(-t / 0.01), pan)
}

function snare(t0, gain = 0.4, pitch = 1, bus = B.drums) {
  const bp = new Biquad('bandpass', 2000 * pitch, 0.7)
  let ph = 0
  place([[bus, gain], [B.verb, gain * 0.25]], t0, 0.25, (i, t) => {
    ph += (TAU * 185 * pitch * (1 + 0.5 * Math.exp(-t / 0.01))) / SR
    return bp.process(noise()) * 1.4 * Math.exp(-t / 0.075) + Math.sin(ph) * 0.6 * Math.exp(-t / 0.05)
  })
}

function hat(t0, gain = 0.12, open = false, pan = 0.25, bus = B.drums) {
  const hp = new Biquad('highpass', open ? 6500 : 8000, 0.8)
  const decay = open ? 0.16 : 0.032
  place([[bus, gain]], t0, open ? 0.6 : 0.15, (i, t) => hp.process(noise()) * Math.exp(-t / decay), pan)
}

function shaker(t0, gain = 0.05, pan = -0.35) {
  const hp = new Biquad('highpass', 5500, 0.7)
  place([[B.drums, gain]], t0, 0.12, (i, t) => hp.process(noise()) * Math.min(1, t / 0.018) * Math.exp(-t / 0.035), pan)
}

function crash(t0, gain = 0.3, len = 1.6) {
  const hp = new Biquad('highpass', 3800, 0.7)
  const bp = new Biquad('bandpass', 7500, 0.9)
  place([[B.drums, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
    const n = hp.process(noise())
    return (0.7 * n + 0.8 * bp.process(n)) * Math.exp(-t / (len * 0.34)) * Math.min(1, t / 0.002)
  })
}

function boom(t0, gain = 0.6, f0 = 62, f1 = 36, decay = 0.9) {
  let ph = 0
  place([[B.sfx, gain]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
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

// --------------------------------------------------------------- instruments

function bassNote(t0, dur, midi, gain = 0.38, bus = B.bass) {
  const f = mtof(midi)
  const lp = new Biquad('lowpass', 800, 1)
  let ph = 0
  place([[bus, gain]], t0, dur + 0.08, (i, t) => {
    ph = (ph + f / SR) % 1
    const saw = 2 * ph - 1 - polyblep(ph, f / SR)
    // Attaque « slap » : le filtre s'ouvre grand puis se referme vite.
    if (i % 16 === 0) lp.set('lowpass', 240 + 2400 * Math.exp(-t / 0.035) + 500 * Math.exp(-t / 0.15), 1.4)
    const env = Math.min(1, t / 0.003) * (t < dur ? 1 - 0.25 * Math.min(1, t / 0.4) : 0.75 * Math.exp(-(t - dur) / 0.02))
    return (0.5 * Math.sin(TAU * ph) + 0.75 * lp.process(saw)) * env
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

/** Marimba : partiels à 1, 4 et 10 fois la fondamentale, et le choc de la mailloche. */
function marimba(t0, midi, gain = 0.12, pan = 0) {
  const f = mtof(midi)
  const bp = new Biquad('bandpass', f * 2, 1.5)
  place([[B.music, gain], [B.verb, gain * 0.25]], t0, 0.9, (i, t) => {
    const v =
      Math.sin(TAU * f * t) * Math.exp(-t / 0.38) +
      0.28 * Math.sin(TAU * f * 3.93 * t) * Math.exp(-t / 0.07) +
      0.08 * Math.sin(TAU * f * 9.2 * t) * Math.exp(-t / 0.02) +
      (i < 240 ? bp.process(noise()) * 0.5 * (1 - i / 240) : 0)
    return v * Math.min(1, t / 0.0015)
  }, pan)
}

/** Cloche / carillon en synthèse FM. */
function bell(t0, midi, gain = 0.12, { pan = 0, decay = 1.1, ratio = 3.5, index = 2.6, send = 0.45, bus = B.music } = {}) {
  const f = mtof(midi)
  place([[bus, gain], [B.verb, gain * send]], t0, decay * 3.5, (i, t) => {
    const I = index * Math.exp(-t / 0.18)
    const v = Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t))
    return v * Math.exp(-t / decay) * Math.min(1, t / 0.0015) * 0.8
  }, pan)
}

/** Piano électrique en FM (le lo-fi de l'intro). */
function epiano(t0, midi, gain = 0.1, { dur = 1.6, bus = B.intro, pan = 0 } = {}) {
  const f = mtof(midi)
  place([[bus, gain]], t0, dur + 0.5, (i, t) => {
    const I = 1.4 * Math.exp(-t / 0.35) + 0.2
    const tine = 0.12 * Math.sin(TAU * f * 14 * t) * Math.exp(-t / 0.05)
    const v = Math.sin(TAU * f * t + I * Math.sin(TAU * f * t)) + tine
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 1.4) * (t < dur ? 1 : Math.exp(-(t - dur) / 0.12))
    return v * env * 0.7
  }, pan)
}

/** Accord piqué (cuivres synthétiques) : dents de scie désaccordées, filtre qui se referme. */
function stab(t0, midis, gain = 0.1, { len = 0.22, bus = B.music, cutoff = 4200, attack = 0.003 } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.09, -0.5], [0.09, 0.5]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.9)
      let ph = rand()
      place([[bus, gain / midis.length], [B.verb, (gain / midis.length) * 0.3]], t0, len + 0.3, (i, t) => {
        // Les cuivres « montent » d'un quart de ton à l'attaque.
        const fi = f * (1 - 0.015 * Math.exp(-t / 0.03))
        ph = (ph + fi / SR) % 1
        if (i % 16 === 0) lp.set('lowpass', 600 + cutoff * Math.exp(-t / 0.08), 0.9)
        const env = Math.min(1, t / attack) * (t < len ? Math.exp(-t / 0.3) : Math.exp(-len / 0.3) * Math.exp(-(t - len) / 0.05))
        return lp.process(2 * ph - 1 - polyblep(ph, fi / SR)) * env
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

/** Corde de guitare (Karplus-Strong). */
function guitar(t0, midi, gain = 0.2, pan = 0) {
  const f = mtof(midi)
  const L = Math.max(2, Math.round(SR / f))
  const buf = new Float32Array(L)
  for (let k = 0; k < L; k++) buf[k] = noise()
  let idx = 0
  const lp = new Biquad('lowpass', 5000, 0.7)
  place([[B.music, gain], [B.verb, gain * 0.3]], t0, 1.6, () => {
    const a = buf[idx]
    const b = buf[(idx + 1) % L]
    buf[idx] = 0.4985 * (a + b)
    idx = (idx + 1) % L
    return lp.process(a) * 0.8
  }, pan)
}

/**
 * Le sifflet : une seule voix continue qui glisse d'une note à l'autre
 * (portamento), avec un vibrato qui s'installe et un peu de souffle.
 * `notes` = [[temps (s), midi, durée (s)], …], dans l'ordre.
 */
function whistle(notes, gain = 0.16) {
  if (!notes.length) return
  const start = notes[0][0] - 0.05
  const end = notes[notes.length - 1][0] + notes[notes.length - 1][2] + 0.2
  const breath = new Biquad('bandpass', 2000, 2)
  let ph = 0
  let freq = mtof(notes[0][1])
  let k = 0
  place([[B.lead, gain], [B.verb, gain * 0.35]], start, end - start, (i, tt) => {
    const t = start + tt
    while (k < notes.length - 1 && t >= notes[k + 1][0]) k++
    const [n0, m, d] = notes[k]
    const target = mtof(m)
    const since = t - n0
    // Glissé de 45 ms vers la note visée.
    freq += (target - freq) * (1 - Math.exp(-1 / (0.012 * SR)))
    const vib = since > 0.12 ? 0.012 * Math.min(1, (since - 0.12) / 0.15) * Math.sin(TAU * 5.6 * since) : 0
    const f = freq * (1 + vib)
    ph = (ph + f / SR) % 1
    // Enveloppe : attaque douce, léger creux entre deux notes liées, relâchement.
    const next = notes[k + 1]
    const legato = next && next[0] - (n0 + d) < 0.03
    const prev = notes[k - 1]
    const tied = prev && n0 - (prev[0] + prev[2]) < 0.03
    let env = tied ? 0.82 + 0.18 * Math.min(1, since / 0.04) : Math.min(1, since / 0.03)
    if (since > d) env *= legato ? 1 : Math.exp(-(since - d) / 0.04)
    if (legato && since > d - 0.03) env *= 0.82
    if (i % 32 === 0) breath.set('bandpass', f * 1.5, 2)
    const v = Math.sin(TAU * ph) + 0.06 * Math.sin(2 * TAU * ph) + 0.05 * breath.process(noise())
    return v * env * Math.min(1, (end - t) / 0.08)
  })
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

/** Balayage de doigt sur la vitre. */
const swipe = (t0, gain = 0.12, pan = 0.2, pitch = 1) => sweep(t0, 0.2, { f0: 600 * pitch, fmid: 3400 * pitch, f1: 1500 * pitch, shape: 'bell', gain, q: 1.2, pan, bus: B.intro })

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

/** Clic de bouton « qui s'enfonce » : clic en plastique et petit coup sourd (retour haptique). */
function thock(t0, gain = 0.4) {
  tick(t0, gain * 0.5, 1700)
  const bp = new Biquad('bandpass', 900, 1.8)
  let ph = 0
  place([[B.sfx, gain]], t0, 0.18, (i, t) => {
    ph += (TAU * expInterp(160, 62, clamp(t / 0.07))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.05) + bp.process(noise()) * 1.2 * Math.exp(-t / 0.012)
  })
}

/** Sticker qu'on colle : claque mate, avec un petit coup grave. */
function slapSfx(t0, gain = 0.35, pitch = 1, pan = 0) {
  const lp = new Biquad('lowpass', 2600 * pitch, 0.9)
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.12]], t0, 0.16, (i, t) => {
    ph += (TAU * expInterp(210 * pitch, 80 * pitch, clamp(t / 0.05))) / SR
    return lp.process(noise()) * 1.6 * Math.exp(-t / 0.018) + Math.sin(ph) * 0.8 * Math.exp(-t / 0.045)
  }, pan)
}

/** Claquement de bois (clap de cinéma). */
function clack(t0, gain = 0.5) {
  const bp = new Biquad('bandpass', 2400, 1.8)
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, 0.15, (i, t) =>
    bp.process(noise()) * 2.5 * Math.exp(-t / 0.006) + Math.sin(TAU * 1150 * t) * Math.exp(-t / 0.02) * 0.8 + Math.sin(TAU * 640 * t) * Math.exp(-t / 0.035) * 0.6,
  )
}

/** Crayon qui gratte le papier. */
function scribble(t0, len, gain = 0.14, pan = 0, rate = 9) {
  const bp = new Biquad('bandpass', 3200, 1.1)
  const bp2 = new Biquad('bandpass', 1300, 1.4)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const p = t / len
    const stroke = 0.35 + 0.65 * Math.abs(Math.sin(TAU * rate * t + 2 * Math.sin(TAU * 3.3 * t)))
    const env = Math.min(1, p / 0.05) * Math.min(1, (1 - p) / 0.08)
    const n = noise()
    return (bp.process(n) * 1.6 + bp2.process(n) * 0.8) * stroke * env
  }, pan)
}

function thud(t0, gain = 0.3, f0 = 110) {
  let ph = 0
  const lp = new Biquad('lowpass', 500)
  place([[B.sfx, gain]], t0, 0.2, (i, t) => {
    ph += (TAU * expInterp(f0, 48, clamp(t / 0.08))) / SR
    return (Math.sin(ph) + 0.3 * lp.process(noise())) * Math.exp(-t / 0.05)
  })
}

/** Coup de tampon : lourd, mat, avec le claquement du caoutchouc. */
function stampSfx(t0, gain = 0.6) {
  thud(t0, gain, 140)
  boom(t0, gain * 0.5, 90, 40, 0.18)
  const bp = new Biquad('bandpass', 1500, 1.2)
  place([[B.sfx, gain * 0.6], [B.verb, gain * 0.1]], t0, 0.1, (i, t) => bp.process(noise()) * 2 * Math.exp(-t / 0.01))
}

/** Petite sirène de jouet, deux tons (pas une alarme : un clin d'œil). */
function siren(t0, len, gain = 0.1) {
  const bp = new Biquad('bandpass', 1100, 1.2)
  let ph = 0
  let f = 880
  place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, len, (i, t) => {
    const target = Math.floor(t / 0.2) % 2 === 0 ? 988 : 740
    f += (target - f) * 0.004
    const fv = f * (1 + 0.01 * Math.sin(TAU * 7 * t))
    ph = (ph + fv / SR) % 1
    const sq = ph < 0.5 ? 1 : -1
    const env = Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.1)
    return (0.6 * bp.process(sq) + 0.5 * Math.sin(TAU * ph)) * env
  }, 0.15)
}

/** Pièce qui tinte : partiels inharmoniques, deux petits chocs. */
function coin(t0, gain = 0.12, f0 = 2300, pan = 0) {
  const P = [
    [1, 1, 0.22],
    [2.41, 0.6, 0.12],
    [3.93, 0.4, 0.08],
    [5.34, 0.25, 0.05],
  ]
  for (const [dt, g] of [[0, 1], [0.035, 0.55]]) {
    place([[B.sfx, gain * g], [B.verb, gain * g * 0.3]], t0 + dt, 0.7, (i, t) => {
      let v = 0
      for (const [r, a, d] of P) v += a * Math.sin(TAU * f0 * r * t) * Math.exp(-t / d)
      return v * Math.min(1, t / 0.0008) * 0.5
    }, pan)
  }
}

/** Confettis : le « pop » du canon, puis le papier qui voltige. */
function confettiSfx(t0, gain = 0.3, pan = 0) {
  const bp = new Biquad('bandpass', 1400, 0.9)
  place([[B.sfx, gain], [B.verb, gain * 0.25]], t0, 0.08, (i, t) => bp.process(noise()) * 3 * Math.exp(-t / 0.012), pan)
  const hp = new Biquad('bandpass', 4500, 0.8)
  place([[B.sfx, gain * 0.35]], t0 + 0.02, 1.1, (i, t) => {
    const flutter = 0.5 + 0.5 * Math.sin(TAU * (28 + 9 * Math.sin(TAU * 1.3 * t)) * t)
    return hp.process(noise()) * flutter * Math.exp(-t / 0.35) * Math.min(1, t / 0.03)
  }, pan)
}

/** Obturateur d'appareil photo : deux clics mécaniques. */
function shutter(t0, gain = 0.25) {
  for (const [dt, g] of [[0, 1], [0.045, 0.7]]) {
    const hp = new Biquad('highpass', 2500)
    place([[B.sfx, gain * g]], t0 + dt, 0.05, (i, t) => (hp.process(noise()) * 1.4 + Math.sin(TAU * 1250 * t) * 0.5) * Math.exp(-t / 0.007))
  }
}

/** « Scratch » de vinyle : deux allers-retours de la main sur le disque. */
function scratch(t0, gain = 0.25) {
  const bp = new Biquad('bandpass', 800, 3)
  let ph = 0
  place([[B.sfx, gain]], t0, 0.24, (i, t) => {
    const g = t < 0.12 ? Math.sin((Math.PI * t) / 0.12) : Math.sin((Math.PI * (t - 0.12)) / 0.12)
    const rate = t < 0.12 ? 1 + 1.5 * Math.sin((Math.PI * t) / 0.12) : 1 - 0.6 * Math.sin((Math.PI * (t - 0.12)) / 0.12)
    if (i % 8 === 0) bp.set('bandpass', 500 + 2200 * rate * g, 3)
    ph += (TAU * 180 * rate) / SR
    return (bp.process(noise()) * 1.8 + 0.3 * Math.sin(ph) * Math.sin(ph * 2.01)) * g
  })
}

/** Craquements de vinyle (pour le lo-fi). */
function crackle(t0, len, gain = 0.06) {
  const lp = new Biquad('lowpass', 3500)
  const hp = new Biquad('highpass', 800)
  place([[B.intro, gain]], t0, len, () => {
    const pulse = rand() < 0.0009 ? noise() * 6 : 0
    return hp.process(lp.process(noise() * 0.08 + pulse))
  }, 0.1)
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
const C = { root: 36, chord: [60, 64, 67], tones: [72, 76, 79, 84] }
const G = { root: 43, chord: [59, 62, 67], tones: [67, 71, 74, 79] }
const Am = { root: 45, chord: [60, 64, 69], tones: [69, 72, 76, 81] }
const F = { root: 41, chord: [60, 65, 69], tones: [65, 69, 72, 77] }

// La grille, une mesure (2 s) par accord à partir du drop : do, sol, la m, fa (× 3),
// puis sol et l'accord final de do (voir score()).

/** Phrases du sifflet (temps dans la mesure, midi, durée en temps). */
const HOOK = new Map([
  [C, [[0, 79, 0.5], [0.5, 76, 0.5], [1, 79, 0.5], [1.5, 81, 0.5], [2, 79, 1], [3, 76, 0.5], [3.5, 74, 0.5]]],
  [G, [[0, 74, 0.5], [0.5, 71, 0.5], [1, 74, 0.5], [1.5, 76, 0.5], [2, 74, 1.5], [3.5, 71, 0.5]]],
  [Am, [[0, 72, 0.5], [0.5, 76, 0.5], [1, 79, 0.5], [1.5, 84, 1], [2.5, 83, 0.5], [3, 79, 1]]],
  [F, [[0, 81, 0.5], [0.5, 79, 0.5], [1, 77, 0.5], [1.5, 76, 0.5], [2, 74, 0.5], [2.5, 72, 1.5]]],
])

/** Une mesure de groove. `level` : 0 = sobre, 1 = plein, 2 = avec cuivres. */
function grooveBar(t0, ch, { level = 1, drums = true, marim = false, lead = false, shake = false, brass = false, gapBefore = [] } = {}) {
  const at = (n) => t0 + b(n)
  const cut = (n) => gapBefore.some((g) => at(n) >= g - b(0.5) && at(n) < g) // trou avant un changement de thème
  if (drums) {
    for (const n of [0, 1.5, 2]) if (!cut(n)) kick(at(n), n === 1.5 ? 0.75 : 1)
    for (const n of [1, 3]) if (!cut(n)) clap(at(n), 0.45)
    for (let n = 0.5; n < 4; n += 1) if (!cut(n)) hat(at(n), 0.12, n === 3.5 && level > 0, 0.25)
    for (let n = 0.25; n < 4; n += 0.5) if (!cut(n)) hat(at(n), 0.04, false, -0.3)
    if (level > 0) for (const n of [1.75, 3.75]) if (!cut(n)) snap(at(n), 0.12, 0.4)
  }
  if (shake) for (let n = 0; n < 4; n += 0.25) if (!cut(n)) shaker(at(n), n % 0.5 === 0 ? 0.035 : 0.055)
  // Basse rebondissante (croches, sauts d'octave).
  const BASS = [[0, 0], [0.5, 0], [1, 12], [1.5, 0], [2, 7], [2.5, 0], [3, 12], [3.5, 7]]
  for (const [n, off] of BASS) if (!cut(n)) bassNote(at(n), BEAT / 2 - 0.05, ch.root + off, n === 0 ? 0.4 : 0.32)
  // Accords piqués sur les contretemps.
  for (let n = 0.5; n < 4; n += 1) {
    if (cut(n)) continue
    ch.chord.forEach((m, i) => pluck(at(n), m + 12, 0.05, { pan: (i - 1) * 0.3, decay: 0.16 }))
  }
  pad(t0, b(4) - 0.05, ch.chord, level > 0 ? 0.08 : 0.06, { attack: 0.08, release: 0.3, cutoff: 1800 })
  if (marim) {
    const ARP = [0, 1, 2, 1, 3, 2, 1, 2]
    for (let k = 0; k < 16; k++) if (!cut(k / 4)) marimba(at(k / 4), ch.tones[ARP[k % 8]], k % 4 === 0 ? 0.11 : 0.075, k % 2 ? 0.35 : -0.35)
  }
  if (brass) for (const n of [0.5, 1.5, 3]) if (!cut(n)) stab(at(n), ch.chord.map((m) => m + 12), 0.1, { len: 0.16 })
  if (lead) whistle(HOOK.get(ch).map(([n, m, d]) => [at(n), m, b(d)]))
}

function score() {
  // ------------------------------------------------ 0 → 3 s : le lo-fi étouffé
  const LOFI = [
    { t: 0, notes: [57, 60, 64, 67], root: 45 }, // la m7
    { t: 2, notes: [57, 60, 64, 65], root: 41 }, // fa maj7
  ]
  for (const ch of LOFI) {
    ch.notes.forEach((m, i) => epiano(ch.t + i * 0.018, m, 0.09, { dur: 1.9, pan: (i - 1.5) * 0.2 }))
    epiano(ch.t + b(2.5), ch.notes[3] + 12, 0.05, { dur: 0.4 })
    bassNote(ch.t, 1.6, ch.root + 12, 0.3, B.intro)
  }
  for (let k = 0; k < 6; k++) {
    kick(b(k), k % 2 ? 0.45 : 0.7, { bus: B.intro, track: false, click: 0.03 })
    if (k % 2) snare(b(k), 0.18, 0.8, B.intro)
    hat(b(k + 0.5), 0.07, false, 0.2, B.intro)
    hat(b(k + 0.83), 0.035, false, -0.2, B.intro)
  }
  crackle(0, 3)

  // Le doigt pousse le fil ; des notifications tintent, étouffées.
  T.swipes.forEach((s, k) => swipe(s - 0.04, 0.12 + k * 0.02, 0.25, 1 + k * 0.05))
  for (let t = T.frenzy; t < T.slow; t += 1 / 7) swipe(t, 0.1, t % 0.3 > 0.15 ? 0.3 : -0.1, 1.2)
  // Pendant le ralenti, les balayages s'espacent et descendent.
  for (let k = 0, t = T.slow; t < T.stop - 0.05; k++, t += 0.14 * 1.45 ** k) swipe(t, 0.09, 0.2, 1.1 - k * 0.12)
  ;[0.6, 1.55, 2.25].forEach((t, i) => bell(t, [88, 91, 86][i], 0.035, { bus: B.intro, decay: 0.4, send: 0 }))
  pop(T.hook + 0.02, 0.12, 700, 200)
  thud(T.hook + 0.02, 0.18)

  // ------------------------------------------------ 3 s : STOP.
  scratch(T.stop - 0.2, 0.28)
  boom(T.stop, 0.6, 100, 40, 0.3)
  thud(T.stop, 0.5, 160)
  clack(T.stop, 0.5)
  crash(T.stop, 0.12, 0.6)
  // Une demi-seconde de silence… puis la montée.
  sweep(T.morph, T.drop - T.morph, { f0: 300, f1: 9000, shape: 'rise', gain: 0.5, q: 0.8 })
  {
    let ph = 0
    place([[B.sfx, 0.2]], T.morph, T.drop - T.morph, (i, t) => {
      const p = t / (T.drop - T.morph)
      const f = expInterp(98, 392, p ** 1.4)
      ph = (ph + f / SR) % 1
      return (2 * ph - 1 - polyblep(ph, f / SR)) * p ** 2 * 0.6
    })
  }
  roll(T.morph, T.drop, 0.1, 0.5)

  // ------------------------------------------------ 4 s : le drop et le bouton
  kick(T.drop, 1.15)
  boom(T.drop, 0.45, 80, 40, 0.7)
  crash(T.drop, 0.4)
  sweep(T.drop, 0.6, { f0: 5000, f1: 400, shape: 'fall', gain: 0.22, q: 0.7 })
  slapSfx(T.drop, 0.3, 0.8)
  grooveBar(b(8), C, { level: 0 })
  grooveBar(b(12), G, { level: 0 })
  ;[0.12, 0.2, 0.28].forEach((d, i) => tick(T.drop + d, 0.06, 2200 + i * 400, (i - 1) * 0.5))
  // Les trois stickers, en montant : do, mi, sol.
  T.stickers.forEach((t, i) => {
    pop(t, 0.28, 900 + i * 250, 300 + i * 80, [0.5, -0.3, 0.6][i])
    bell(t + 0.01, [84, 88, 91][i], 0.05, { decay: 0.5, pan: [0.5, -0.3, 0.6][i] })
  })
  // Les mots du titre.
  for (let k = 0; k < 4; k++) tick(T.headline + k * 0.07, 0.035, 3000 + k * 200, 0.2)
  sweep(T.fingerIn, 0.35, { f0: 400, f1: 2200, shape: 'bell', gain: 0.1, pan: 0.5 })
  thock(T.press, 0.55)
  tick(T.release, 0.08, 2000)
  // Le bouton envahit l'écran.
  sweep(T.zoom - 0.1, T.signal - T.zoom + 0.1, { f0: 250, f1: 7000, shape: 'rise', gain: 0.35, q: 0.9 })

  // ------------------------------------------------ 8 s : le signal (demi-temps)
  sweep(T.signal, 0.3, { f0: 6000, f1: 500, shape: 'fall', gain: 0.25, q: 0.8 }) // l'iris se referme
  kick(T.signal, 1)
  crash(T.signal, 0.2)
  pop(T.signal + 0.28, 0.25, 700, 200)
  siren(T.signal + 0.3, 0.85, 0.09)
  pad(T.signal, b(4) - 0.05, Am.chord, 0.1, { attack: 0.2, release: 0.3 })
  bassNote(T.signal, b(2) - 0.05, Am.root, 0.38)
  bassNote(T.signal + b(2), b(2) - 0.05, Am.root, 0.34)
  kick(T.signal + b(2.5), 0.7)
  clap(T.signal + b(1), 0.25)
  clap(T.signal + b(3), 0.35)
  for (let n = 0; n < 4; n += 0.5) hat(T.signal + b(n), 0.06)
  for (let k = 0; k < 6; k++) bell(T.signal + 0.4 + k * 0.1, [88, 91, 93, 96, 93, 100][k], 0.018, { decay: 0.3, pan: Math.sin(k * 2) * 0.7 })
  // « On s'occupe de toi. »
  slapSfx(T.signal2, 0.45)
  ;[72, 76, 79].forEach((m, i) => bell(T.signal2 + 0.02 + i * 0.04, m + 12, 0.05, { decay: 0.8, pan: (i - 1) * 0.4 }))
  // L'écran part vers la gauche.
  sweep(T.signalOut - 0.05, 0.35, { f0: 700, fmid: 4000, f1: 900, shape: 'bell', gain: 0.18, pan: -0.4 })

  // ------------------------------------------------ 10 s : les choix (marimba)
  grooveBar(b(20), F, { marim: true })
  grooveBar(b(24), C, { marim: true })
  // Les quatre humeurs arrivent (pops en montant), un tap, une validation.
  ;[0, 1, 2, 3].forEach((i) => pop(T.mood + 0.05 + i * 0.11, 0.2, 800 + i * 200, 280 + i * 60, i % 2 ? 0.3 : -0.3))
  thock(T.moodTap, 0.4)
  bell(T.moodTap + 0.1, 96, 0.06, { decay: 0.6, pan: 0.4 })
  pop(T.moodTap + 0.1, 0.18, 1400, 600, 0.4)
  sweep(T.time - 0.25, 0.3, { f0: 600, fmid: 3500, f1: 800, shape: 'bell', gain: 0.14, pan: -0.3 })
  ;[0, 1, 2].forEach((i) => pop(T.time - 0.05 + i * 0.1, 0.18, 700 + i * 250, 250, (i - 1) * 0.4))
  for (let k = 0; k < 10; k++) tick(T.time + 0.15 + k * 0.05, 0.03, 2800 + k * 90, 0.3) // les cadrans se remplissent
  thock(T.timeTap, 0.4)
  bell(T.timeTap + 0.1, 100, 0.06, { decay: 0.6, pan: -0.4 })
  sweep(T.passion - 0.25, 0.3, { f0: 600, fmid: 3500, f1: 800, shape: 'bell', gain: 0.14, pan: 0.3 })
  // Les quatre passions se collent.
  ;[0, 1, 2, 3].forEach((i) => slapSfx(T.passion + i * 0.125, 0.32, 0.9 + i * 0.12, [-0.4, 0.4, -0.4, 0.4][i]))
  thock(T.passionTap, 0.45)
  // Le ciel s'ouvre.
  sweep(T.passionZoom - 0.05, 0.55, { f0: 300, fmid: 3000, f1: 6000, shape: 'rise', gain: 0.3, q: 0.8 })
  pop(T.passionZoom, 0.25, 400, 120)

  // ------------------------------------------------ 14 s : créer (le sifflet)
  grooveBar(b(28), G, { lead: true, shake: true, marim: false })
  grooveBar(b(32), Am, { lead: true, shake: true })
  sweep(T.activity - 0.15, 0.4, { f0: 300, fmid: 2200, f1: 600, shape: 'bell', gain: 0.12 })
  pop(T.activity + 0.15, 0.16, 1200, 400, -0.3)
  pop(T.activity + 0.25, 0.16, 1500, 500, 0.3)
  // Le crayon dessine : un grattement par trait.
  scribble(T.draw, T.drawEnd - T.draw, 0.16, -0.1, 7)
  // La grille : écriture, musique, cinéma.
  sweep(T.grid - 0.05, 0.35, { f0: 4000, f1: 400, shape: 'bell', gain: 0.16, q: 0.9 })
  const [tW, tM, tC] = T.quads
  sweep(tW, 0.3, { f0: 800, fmid: 3000, f1: 700, shape: 'bell', gain: 0.1, pan: 0.5 })
  for (let k = 0; k < 16; k++) tick(tW + 0.3 + k * 0.075, 0.03 + rand() * 0.015, 2000 + rand() * 1500, 0.5) // le stylo
  sweep(tM, 0.3, { f0: 800, fmid: 3000, f1: 700, shape: 'bell', gain: 0.1, pan: -0.5 })
  ;[67, 71, 74, 79].forEach((m, i) => guitar(tM + 0.05 + i * 0.03, m, 0.22, -0.4 + i * 0.1)) // accord de guitare (sol)
  sweep(tC, 0.3, { f0: 800, fmid: 3000, f1: 700, shape: 'bell', gain: 0.1, pan: 0.5 })
  clack(tC + 0.25, 0.45)
  clack(tC + 0.75, 0.45)
  // « Crée au lieu de scroller. »
  slapSfx(T.instead, 0.5)
  ;[76, 79, 84, 88].forEach((m, i) => bell(T.instead + 0.03 + i * 0.05, m, 0.045, { decay: 0.9, pan: -0.4 + i * 0.27 }))
  sweep(T.reward - 0.2, 0.3, { f0: 500, fmid: 3500, f1: 1200, shape: 'bell', gain: 0.18 })

  // ------------------------------------------------ 18 s : la récompense (cuivres)
  grooveBar(b(36), F, { lead: true, shake: true, brass: true, level: 2 })
  grooveBar(b(40), C, { lead: true, shake: true, brass: true, level: 2 })
  crash(T.reward, 0.25)
  sweep(T.reward, 0.3, { f0: 3000, f1: 300, shape: 'fall', gain: 0.15 })
  thud(T.reward + 0.25, 0.2)
  stampSfx(T.stamp, 0.7)
  for (let k = 0; k < 3; k++) tick(T.saved + k * 0.08, 0.035, 2800, 0)
  pop(T.plus, 0.25, 1000, 350)
  bell(T.plus + 0.02, 91, 0.05, { decay: 0.7 })
  // Cinq pièces tombent, une par minute : sifflement qui descend, tintement, déclic du compteur.
  const COIN_NOTES = [84, 86, 88, 89, 91]
  T.coins.forEach((t, i) => {
    let ph = 0
    place([[B.sfx, 0.035]], t - 0.3, 0.3, (k, tt) => {
      ph += (TAU * expInterp(2600, 1300, tt / 0.3)) / SR
      return Math.sin(ph) * Math.sin((Math.PI * tt) / 0.3)
    }, -0.4)
    coin(t, 0.13, 2100 + i * 120, -0.4)
    tick(t + 0.02, 0.05, 1800, -0.2)
    bell(t + 0.01, COIN_NOTES[i], 0.035, { decay: 0.4, pan: -0.2 })
  })
  // La fête.
  confettiSfx(T.burst, 0.35, -0.5)
  confettiSfx(T.burst + 0.02, 0.35, 0.5)
  crash(T.burst, 0.3)
  ;[72, 76, 79, 84, 88, 91].forEach((m, i) => bell(T.burst + 0.05 + i * 0.06, m + 12, 0.04, { decay: 0.8, pan: -0.6 + i * 0.24 }))
  for (let k = 0; k < 16; k++) coin(T.burst + 0.3 + rand() * 1.3, 0.03 + rand() * 0.03, 1900 + rand() * 1400, rand() * 2 - 1)
  slapSfx(T.rule, 0.4)
  sweep(T.gallery - 0.3, 0.35, { f0: 500, fmid: 3500, f1: 1200, shape: 'bell', gain: 0.18 })

  // ------------------------------------------------ 22 s : la galerie et les thèmes
  grooveBar(b(44), G, { marim: true, gapBefore: [T.themes[0]] })
  grooveBar(b(48), Am, { marim: true, gapBefore: [T.themes[1], T.themes[2]] })
  for (let k = 0; k < 4; k++) sweep(T.gallery - 0.1 + k * 0.08, 0.16, { f0: 1200, fmid: 3500, f1: 1500, shape: 'bell', gain: 0.06, pan: -0.6 + k * 0.4 }) // les cartes
  pop(T.gallery + 0.05, 0.18, 700, 250)
  pop(T.gallery + 0.3, 0.14, 1300, 500, 0.4)
  T.themes.forEach((t, i) => {
    sweep(t - 0.22, 0.24, { f0: 900, fmid: 5000, f1: 1200, shape: 'bell', gain: 0.22, q: 1.1, pan: i % 2 ? 0.4 : -0.4 })
    shutter(t, 0.3)
    stab(t, (i === 0 ? G : Am).chord.map((m) => m + 12), 0.16, { len: 0.25 })
    crash(t, 0.14, 0.8)
    slapSfx(t + 0.02, 0.3, 1.1)
  })
  // Tout se replie dans l'icône.
  sweep(T.galleryOut - 0.05, 0.3, { f0: 5000, f1: 300, shape: 'bell', gain: 0.2, q: 0.9 })

  // ------------------------------------------------ 26 s : la signature
  grooveBar(b(52), F, { lead: true, shake: true, brass: true, level: 2 })
  kick(T.end, 1.1)
  boom(T.end, 0.4, 85, 42, 0.4)
  crash(T.end, 0.3)
  pop(T.end, 0.3, 500, 150)
  ;[72, 76, 79, 84].forEach((m, i) => bell(T.end + 0.05 + i * 0.05, m + 12, 0.05, { decay: 1, pan: -0.4 + i * 0.27 }))
  slapSfx(T.wordmark, 0.5, 0.9)
  for (let k = 0; k < 10; k++) tick(T.tagline + k * 0.055, 0.03, 2600 + k * 120, 0.1)
  scribble(T.tagline + 0.55, 0.3, 0.12, 0, 14) // le surligneur
  sweep(T.cta - 0.05, 0.35, { f0: 400, fmid: 2500, f1: 900, shape: 'bell', gain: 0.12 })
  pop(T.cta + 0.1, 0.2, 800, 250)
  // Mesure de sol : on retient son souffle (roulement), l'appui, puis l'accord final.
  const g0 = 28
  bassNote(g0, b(2) - 0.05, G.root, 0.38)
  pad(g0, b(2), G.chord, 0.1, { attack: 0.05, release: 0.2 })
  kick(g0, 1)
  clap(g0 + b(1), 0.4)
  whistle([[g0, 74, b(0.5)], [g0 + b(0.5), 76, b(0.5)], [g0 + b(1), 77, b(0.75)]], 0.14)
  roll(g0 + b(1), T.final, 0.08, 0.45)
  sweep(g0, T.final - g0, { f0: 400, f1: 8000, shape: 'rise', gain: 0.3, q: 0.8 })
  sweep(T.fingerIn2, 0.35, { f0: 400, f1: 2200, shape: 'bell', gain: 0.1, pan: 0.5 })
  thock(T.ctaPress, 0.55)
  confettiSfx(T.ctaPress + 0.25, 0.3, 0.2)
  // L'accord final.
  kick(T.final, 1.2)
  boom(T.final, 0.5, 80, 40, 0.8)
  crash(T.final, 0.45, 2)
  stab(T.final, [60, 64, 67, 72, 76], 0.28, { len: 0.6, cutoff: 5000 })
  pad(T.final, DURATION - T.final, [48, 55, 60, 64, 67, 72], 0.2, { attack: 0.02, release: 0.5, cutoff: 2600 })
  bassNote(T.final, 0.9, C.root, 0.45)
  ;[72, 76, 79, 84, 88, 91, 96].forEach((m, i) => bell(T.final + 0.02 + i * 0.035, m + 12, 0.04, { decay: 0.9, pan: Math.sin(i * 1.9) * 0.8, index: 1.6 }))
  confettiSfx(T.final, 0.3, -0.4)
  confettiSfx(T.final + 0.02, 0.3, 0.4)
}

// ================================================================== mixage

export function renderAudio() {
  seed = 0x5c0112
  kicks.length = 0
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  score()

  // Intro « à travers le haut-parleur d'un téléphone », puis arrêt de bande.
  filterBus(B.intro, [['highpass', 260, 0.7], ['lowpass', 1700, 0.9]])
  tapeStop(B.intro, T.slow, T.stop - T.slow)

  // Sidechain : basse, nappes et accords s'effacent à chaque grosse caisse.
  const duck = new Float32Array(N).fill(1)
  for (const k of kicks) {
    const s0 = Math.round(k * SR)
    for (let i = 0; i < 0.4 * SR && s0 + i < N; i++) {
      const t = i / SR
      const d = 1 - 0.7 * Math.min(1, t / 0.004) * Math.exp(-t / 0.1)
      duck[s0 + i] = Math.min(duck[s0 + i], d)
    }
  }
  const verb = reverb(B.verb)
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  // [bus, gain, pompé par la grosse caisse]
  const mix = [
    [B.intro, 1.7, false],
    [B.drums, 0.8, false],
    [B.bass, 0.7, true],
    [B.pads, 0.85, true],
    [B.music, 1.25, true],
    [B.lead, 1.3, false],
    [B.sfx, 1.1, false],
    [verb, 0.5, true],
  ]
  for (const [bus, g, ducked] of mix) {
    for (let j = 0; j < N; j++) {
      const d = ducked ? duck[j] : 1
      L[j] += bus[0][j] * g * d
      R[j] += bus[1][j] * g * d
    }
  }
  // Fondu final.
  const fadeStart = DURATION - 0.35
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const p = (j / SR - fadeStart) / 0.35
    const g = Math.cos((Math.PI / 2) * Math.min(1, p)) ** 2
    L[j] *= g
    R[j] *= g
  }
  // Coupe-bas de sécurité, sonie visée −14 LUFS, plafond −1,5 dB.
  // Égalisation finale : moins d'infra-grave (inaudible sur un téléphone), un peu de présence.
  filterBus([L, R], [['highpass', 32, 0.7], ['peaking', 55, 0.8, -3], ['peaking', 2800, 0.9, 2]])
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

/** Écrit la bande-son en WAV 16 bits stéréo. */
export function writeAudio(file) {
  const [L, R] = renderAudio()
  writeWav(file, L, R, rand)
}

// Utilisation directe : node scrollup/audio.mjs [sortie.wav]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'build', 'scrollup', 'audio.wav')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
