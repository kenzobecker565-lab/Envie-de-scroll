/**
 * Sons synthétisés du studio (aucun échantillon externe : aucun droit à gérer).
 * Chaque fonction renvoie un Float32Array mono à 48 kHz.
 */
import { Biquad, SR, TAU, mtof } from '../../promo/dsp.mjs'

let seed = 0x51ed
export function reseed(s) {
  seed = s >>> 0
}
export function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1

export const buf = (d) => new Float32Array(Math.max(1, Math.round(d * SR)))

function filt(x, type, f, q = 0.707) {
  const b = new Biquad(type, f, q)
  for (let i = 0; i < x.length; i++) x[i] = b.process(x[i])
  return x
}
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d)

function gen(d, fn) {
  const x = buf(d)
  for (let i = 0; i < x.length; i++) x[i] = fn(i / SR, i)
  return x
}

// ------------------------------------------------------------------ bruitages

export const tick = (high = true) => gen(0.05, (t) => Math.sin(TAU * (high ? 3200 : 2500) * t) * Math.exp(-t / 0.006) + noise() * Math.exp(-t / 0.003) * 0.3)

export const tok = () => gen(0.2, (t) => Math.sin(TAU * 950 * t) * Math.exp(-t / 0.03) + 0.5 * Math.sin(TAU * 2300 * t) * Math.exp(-t / 0.012) + noise() * Math.exp(-t / 0.004) * 0.4)

/** Pas : doux sur l'herbe ; « run » plus vif. */
export function step({ run = false, soft = false } = {}) {
  const d = 0.11
  const x = gen(d, (t) => noise() * Math.exp(-t / (run ? 0.012 : 0.018)) * (soft ? 0.5 : 1))
  filt(x, 'lowpass', run ? 1800 : 1100)
  const thump = gen(d, (t) => Math.sin(TAU * (run ? 150 : 120) * t * (1 - t * 2)) * Math.exp(-t / 0.025))
  for (let i = 0; i < x.length; i++) x[i] = x[i] * 0.9 + thump[i] * 0.7
  return x
}

/** Décollage : petit « fiou » qui monte. */
export const takeoff = () => {
  const x = gen(0.28, (t) => noise() * Math.sin((Math.PI * t) / 0.28) ** 2)
  return filt(filt(x, 'bandpass', 1400, 1.2), 'highpass', 400)
}

/** Atterrissage : bruit sourd + petit écrasement caoutchouteux. */
export const land = (h = 100) => {
  const k = Math.min(1.5, 0.6 + h / 250)
  return gen(0.3, (t) => (Math.sin(TAU * (90 + 60 * Math.exp(-t / 0.03)) * t) * Math.exp(-t / 0.06) + noise() * Math.exp(-t / 0.01) * 0.3) * k)
}

export const pop = (f = 600) => {
  let ph = 0
  return gen(0.12, (t) => {
    ph += (TAU * (f + f * 2.2 * Math.exp(-t / 0.02))) / SR
    return Math.sin(ph) * env(t, 0.001, 0.03)
  })
}

export const boing = (f = 330) => {
  let ph = 0
  return gen(0.5, (t) => {
    ph += (TAU * (f + 0.18 * f * Math.sin(TAU * 11 * t) * Math.exp(-t / 0.15) + 80 * t)) / SR
    return Math.sin(ph) * env(t, 0.005, 0.15)
  })
}

export const swoosh = (d = 0.35, lo = 600, hi = 3200) => {
  const x = gen(d, (t) => noise() * Math.sin((Math.PI * t) / d) ** 3)
  filt(x, 'highpass', lo)
  return filt(x, 'lowpass', hi)
}

/** Éclaboussure : jet d'eau + gouttes qui retombent. */
export function splash(size = 1) {
  const d = 0.9
  const x = gen(d, (t) => noise() * (Math.exp(-t / 0.08) + 0.25 * Math.exp(-t / 0.3)))
  filt(x, 'bandpass', 2200, 0.6)
  for (let k = 0; k < 10 * size; k++) {
    const at = Math.round((0.05 + rand() * 0.6) * SR)
    const f = 900 + rand() * 1500
    let ph = 0
    for (let i = 0; i < 0.06 * SR && at + i < x.length; i++) {
      const t = i / SR
      ph += (TAU * (f + 2000 * t)) / SR
      x[at + i] += Math.sin(ph) * env(t, 0.002, 0.012) * 0.35
    }
  }
  const low = gen(d, (t) => Math.sin(TAU * 110 * t) * Math.exp(-t / 0.05) * 0.8)
  for (let i = 0; i < x.length; i++) x[i] = (x[i] + low[i]) * Math.min(1.6, 0.7 + size * 0.4)
  return x
}

export const drop = () => {
  let ph = 0
  const f = 1100 + rand() * 900
  return gen(0.09, (t) => {
    ph += (TAU * (f + 1600 * (t / 0.09))) / SR
    return Math.sin(ph) * env(t, 0.002, 0.02)
  })
}

export const puff = () => filt(gen(0.35, (t) => noise() * env(t, 0.01, 0.08)), 'lowpass', 1200)

export function bell(freq, d = 1.6, bright = 1) {
  const parts = [[1, 1, 0.9], [2.76, 0.35 * bright, 0.35], [5.4, 0.18 * bright, 0.18], [8.93, 0.08 * bright, 0.1]]
  return gen(d, (t) => parts.reduce((s, [r, a, dec]) => s + a * Math.sin(TAU * freq * r * t) * Math.exp(-t / ((dec * d) / 1.6)), 0) * Math.min(1, t / 0.002))
}

export function sparkle() {
  const x = buf(1.2)
  ;[88, 91, 95, 100].forEach((m, i) => {
    const b = bell(mtof(m), 0.9, 0.4)
    const at = Math.round(i * 0.06 * SR)
    for (let j = 0; j < b.length && at + j < x.length; j++) x[at + j] += b[j] * 0.5
  })
  return x
}

export function harpUp(n = 6) {
  const x = buf(1.8)
  const scale = [72, 74, 76, 79, 81, 84, 86, 88]
  for (let i = 0; i < n; i++) {
    const p = pluck(mtof(scale[i % scale.length]), 1.2, 0.997)
    const at = Math.round(i * 0.07 * SR)
    for (let j = 0; j < p.length && at + j < x.length; j++) x[at + j] += p[j] * 0.5
  }
  return x
}

/** Rire de nuage : « hi-hi-hi » flûté, plus aigu à chaque fois. */
export function giggle(n = 4, f0 = 900) {
  const x = buf(n * 0.13 + 0.2)
  for (let k = 0; k < n; k++) {
    const at = Math.round(k * 0.13 * SR)
    let ph = 0
    const f = f0 * (1 + k * 0.04)
    for (let i = 0; i < 0.1 * SR; i++) {
      const t = i / SR
      ph += (TAU * f * (1 + 0.06 * Math.sin(TAU * 30 * t))) / SR
      const v = (Math.sin(ph) + 0.3 * Math.sin(2 * ph)) * Math.sin((Math.PI * t) / 0.1) ** 2
      x[at + i] += v * 0.6
    }
  }
  return x
}

export const bird = (f = 3200) => {
  let ph = 0
  return gen(0.16, (t) => {
    ph += (TAU * (f + 900 * Math.sin(TAU * 18 * t))) / SR
    return Math.sin(ph) * Math.sin((Math.PI * t) / 0.16) ** 2
  })
}

export const cricket = (d) => gen(d, (t) => Math.sin(TAU * 4600 * t) * (Math.sin(TAU * 28 * t) > 0.3 ? 1 : 0) * (Math.sin(TAU * 1.6 * t) > -0.2 ? 1 : 0) * 0.4)

export const bloop = () => {
  let ph = 0
  return gen(0.6, (t) => {
    ph += (TAU * (600 * Math.exp(-t / 0.25) + 120)) / SR
    return Math.sin(ph) * env(t, 0.005, 0.2)
  })
}

// ------------------------------------------------------------------ instruments

/** Corde pincée (Karplus-Strong) : ukulélé, pizzicato. */
export function pluck(freq, d = 0.7, damp = 0.996, bright = 0.5) {
  const n = Math.round(d * SR)
  const p = Math.max(2, Math.round(SR / freq))
  const b = new Float32Array(p)
  for (let i = 0; i < p; i++) b[i] = noise()
  const out = new Float32Array(n)
  let last = 0
  for (let i = 0; i < n; i++) {
    const j = i % p
    const v = b[j]
    out[i] = v
    b[j] = damp * (bright * v + (1 - bright) * b[(j + 1) % p])
    last = v
  }
  void last
  return filt(out, 'lowpass', 6000)
}

export const marimba = (f, d = 0.6) => gen(d, (t) => (Math.sin(TAU * f * t) * Math.exp(-t / 0.28) + 0.25 * Math.sin(TAU * f * 4 * t) * Math.exp(-t / 0.04)) * Math.min(1, t / 0.002))

export const bass = (f, d = 0.5) => gen(d, (t) => (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)) * Math.min(1, t / 0.01) * Math.exp(-t / 0.35))

export const pad = (freqs, d) =>
  filt(gen(d, (t) => freqs.reduce((s, f) => s + Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2.003 * t), 0) / freqs.length * Math.min(1, t / 0.4) * Math.min(1, (d - t) / 0.5)), 'lowpass', 2500)

export const clap = () => filt(gen(0.18, (t) => noise() * (Math.exp(-t / 0.01) + 0.6 * Math.exp(-Math.max(0, t - 0.012) / 0.03) * (t > 0.012 ? 1 : 0))), 'bandpass', 1500, 0.8)

export const shaker = () => filt(gen(0.07, (t) => noise() * env(t, 0.01, 0.02)), 'highpass', 5000)

export const kick = () => {
  let ph = 0
  return gen(0.3, (t) => {
    ph += (TAU * (50 + 120 * Math.exp(-t / 0.03))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.12)
  })
}
