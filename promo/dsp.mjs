/**
 * Outils de traitement du son partagés par les bandes-son des pubs (audio.mjs,
 * pub/audio.mjs) : filtres, réverbération, compression, sonie, limiteur,
 * lecture et écriture de WAV. Tout est en Float32Array, à 48 kHz.
 */

import fs from 'node:fs'
import path from 'node:path'

export const SR = 48000
export const TAU = Math.PI * 2

export const mtof = (m) => 440 * 2 ** ((m - 69) / 12)
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const expInterp = (a, b, p) => a * (b / a) ** p

// ------------------------------------------------------------------ filtres

/** Filtre biquadratique (formules RBJ). */
export class Biquad {
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
export function polyblep(t, dt) {
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

// ------------------------------------------------------------ mixage, sonie

/** Réverbération Freeverb (8 filtres en peigne + 4 passe-tout par canal). */
export function reverb([inL, inR], { room = 0.83, damp = 0.28 } = {}) {
  const N = inL.length
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

export function filterBus(bus, filters) {
  for (let c = 0; c < 2; c++) {
    const fs = filters.map((f) => new Biquad(...f))
    const ch = bus[c]
    for (let j = 0; j < ch.length; j++) {
      let v = ch[j]
      for (const f of fs) v = f.process(v)
      ch[j] = v
    }
  }
}

/** Sonie intégrée (LUFS, pondération K, avec portes absolue et relative). */
export function loudness(L, R) {
  const N = L.length
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

/** Noyaux d'interpolation (sinc fenêtré, 16 points) pour suréchantillonner ×4. */
const TP_KERNELS = [0.25, 0.5, 0.75].map((f) => {
  const h = []
  for (let k = -7; k <= 8; k++) {
    const x = k - f
    h.push((Math.sin(Math.PI * x) / (Math.PI * x)) * (0.5 + 0.5 * Math.cos((Math.PI * x) / 8.5)))
  }
  return h
})

/** Crête « vraie » entre les échantillons j et j + 1 (suréchantillonnage ×4). */
function truePeakAt(x, j) {
  let peak = Math.abs(x[j])
  for (const h of TP_KERNELS) {
    let v = 0
    for (let k = 0; k < 16; k++) {
      const i = j - 7 + k
      if (i >= 0 && i < x.length) v += x[i] * h[k]
    }
    peak = Math.max(peak, Math.abs(v))
  }
  return peak
}

/**
 * Limiteur avec anticipation (5 ms) : aucun échantillon ne dépasse le plafond
 * (ni, avec `truePeak`, aucune crête entre deux échantillons).
 */
export function limit(L, R, ceiling, { truePeak = false } = {}) {
  const N = L.length
  const look = Math.round(0.005 * SR)
  const rel = Math.exp(-1 / (0.09 * SR))
  const need = new Float32Array(N)
  for (let j = 0; j < N; j++) {
    const peak = truePeak ? Math.max(truePeakAt(L, j), truePeakAt(R, j)) : Math.max(Math.abs(L[j]), Math.abs(R[j]))
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

// ------------------------------------------------------------------ voix

/** Lit un WAV PCM 16 bits : { sr, x (premier canal), channels (tous les canaux) }. */
export function readWav(file) {
  const b = fs.readFileSync(file)
  const count = b.readUInt16LE(22)
  const sr = b.readUInt32LE(24)
  let off = 12
  while (b.toString('ascii', off, off + 4) !== 'data') off += 8 + b.readUInt32LE(off + 4)
  const n = Math.floor(Math.min(b.readUInt32LE(off + 4), b.length - off - 8) / (2 * count))
  const channels = Array.from({ length: count }, () => new Float32Array(n))
  for (let i = 0; i < n; i++) for (let c = 0; c < count; c++) channels[c][i] = b.readInt16LE(off + 8 + (i * count + c) * 2) / 32768
  return { sr, x: channels[0], channels }
}

/** Ne garde que la parole : silences de début et de fin retirés (petites marges, fondus). */
export function trimSilence(x, sr) {
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
export function resample(x, from, to) {
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

/** Compresseur simple (détection de crête), pour une voix régulière et présente. */
export function compress(ch, { threshold = -22, ratio = 3.2, attack = 0.003, release = 0.09, makeup = 0 } = {}) {
  const N = ch.length
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
export function voiceEnvelope(ch) {
  const N = ch.length
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

// ------------------------------------------------------------------ fichiers

/** Écrit un WAV 16 bits stéréo, avec un léger tramage (`rand` : générateur 0-1). */
export function writeWav(file, L, R, rand) {
  const n = L.length
  const data = Buffer.alloc(n * 4)
  for (let j = 0; j < n; j++) {
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
