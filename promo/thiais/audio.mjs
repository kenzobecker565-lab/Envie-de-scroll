/**
 * ============================================================================
 *  Bande-son du « Vrai verdict : Thiais » (sons réels : BigSoundBank, voir ../sons/bigsoundbank) : musique, bruitages, voix.
 * ============================================================================
 *  - Musique : l'ambiance de thriller judiciaire de la série.
 *  - Bruitages calés sur cues.js : l'ouverture (flashs du radar), la caméra de
 *    bord (moteur, feux, flashs, freinage, premier cri), puis un son par plan de coupe du procès.
 *  - Voix : voice/<id>.wav (ElevenLabs), placées d'après timeline.json ; une
 *    légère réverbération de salle sur les avocats.
 *  Sonie : −14 LUFS.
 *
 *   node thiais/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, polyblep, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { makeCues } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'thiais')
const C = makeCues(JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8')))
const { S, E, W } = C
const K = C.hook
const DURATION = C.duration
const SEC = (id) => C.sections.find((s) => s.id === id)
const IMPACT = C.impact // « Lui, il les a appliquées. » : la musique se tait
const HOT = C.hot
const SONS = path.join(HERE, '..', 'sons', 'bigsoundbank')
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
const B = { music: newBus(), sfx: newBus(), verb: newBus(), voice: newBus(), room: newBus() }

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

/** Un son réel de BigSoundBank (../sons/bigsoundbank/<id>.wav). */
const CACHE = {}
function sample(id, t0, gain = 0.5, { from = 0, len = Infinity, lp = 0, pan = 0, fade = 0.02 } = {}) {
  if (!CACHE[id]) {
    const { sr, x } = readWav(path.join(SONS, `${id}.wav`))
    CACHE[id] = sr === SR ? x : resample(x, sr, SR)
  }
  const x = CACHE[id]
  const a = Math.round(from * SR)
  const n = Math.min(x.length - a, Math.round(len * SR), N - Math.round(t0 * SR))
  if (n <= 0) return
  const f = lp ? new Biquad('lowpass', lp, 0.7) : null
  const L = n / SR
  place([[B.sfx, gain]], t0, L, (i, t) => {
    const v = x[a + i] ?? 0
    return (f ? f.process(v) : v) * Math.min(1, t / fade) * Math.min(1, (L - t) / Math.max(fade, 0.05))
  }, pan)
}
const quiet = (tt) => HOT.some(([a, b]) => tt > a - 0.08 && tt < b) || (tt > IMPACT - 0.1 && tt < SEC('vote').t0)

function music() {
  const trib = SEC('tribunal').t0
  const vote = SEC('vote').t0
  // L'ouverture et la reconstitution : nappe sombre, pulsation qui accélère jusqu'à la chute.
  strings(0, K.COURT - 0.2, [37, 44, 49], 0.06, { attack: 0.05, cutoff: 800, release: 0.03 })
  drone(K.ARRIVE, K.DOWN - K.ARRIVE, 0.07)
  for (let t = 0.05, k = 0; t < K.DOWN - 0.1; k++) {
    pulse(t, 37 + 12 * (k % 2), k % 2 ? 0.06 : 0.09)
    t += t < K.ARRIVE ? BEAT : lerp(BEAT / 2, BEAT / 4, Math.min(1, (t - K.ARRIVE) / (K.DOWN - K.ARRIVE)))
  }
  strings(K.COURT, trib - K.COURT, [26, 38, 45], 0.06, { attack: 0.3, cutoff: 900 })
  // Le procès : la boucle de la série, qui se tait sur la pique et au verdict.
  for (let bar = 0, t = trib - 0.1; t < IMPACT - 0.1; bar++, t += BAR) {
    const ch = CH[bar % 4]
    const len = Math.min(BAR, IMPACT - 0.1 - t)
    strings(t, len, [ch[1], ch[2], ch[3]], 0.045, { cutoff: 1400 })
    for (let k = 0; k < 8; k++) {
      const tt = t + k * (BEAT / 2)
      if (tt >= IMPACT - 0.1) break
      if (quiet(tt)) continue
      pulse(tt, ch[0] + 12 * (k % 2), k % 2 ? 0.07 : 0.1)
    }
    for (const b of [0, 2]) if (t + b * BEAT < IMPACT - 0.1 && !quiet(t + b * BEAT)) drum(t + b * BEAT, 0.2)
    if (!quiet(t)) piano(t, ch[4] + 12, 0.05, 0.3)
  }
  strings(vote, DURATION - vote - 0.5, [26, 38, 45, 50], 0.08, { attack: 1.2, cutoff: 800 })
  for (let t = vote + 0.4; t < DURATION - 1; t += 1) clockTick(t, 0.06, Math.round(t) % 2 === 0)
  for (let t = vote + 0.5; t < DURATION - 1.5; t += 2) piano(t, 74, 0.05, 0.2)
}

// Petits instruments du vlog et sons du live (repris des prototypes de hooks).
function kick(t0, gain = 0.6) {
  let ph = 0
  place([[B.music, gain]], t0, 0.5, (i, t) => {
    ph += (TAU * expInterp(150, 45, clamp(t / 0.09))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.22) * Math.min(1, t / 0.002)
  })
}
function clap(t0, gain = 0.35) {
  const bp = new Biquad('bandpass', 1300, 0.9)
  place([[B.music, gain], [B.verb, gain * 0.4]], t0, 0.3, (i, t) => {
    const env = Math.exp(-((t % 0.011) / 0.004)) * (t < 0.03 ? 1 : 0) + Math.exp(-(t - 0.03) / 0.08) * (t >= 0.03 ? 1 : 0)
    return bp.process(noise()) * 2.2 * env
  })
}
function hat(t0, gain = 0.08) {
  const hp = new Biquad('highpass', 7000, 0.7)
  place([[B.music, gain]], t0, 0.05, (i, t) => hp.process(noise()) * Math.exp(-t / 0.012))
}
function drone(t0, len, gain = 0.05) {
  const lp = new Biquad('lowpass', 700, 0.7)
  place([[B.music, gain]], t0, len, (i, t) => lp.process(Math.sin(TAU * 55 * t) + 0.7 * Math.sin(TAU * 58.3 * t) + 0.4 * Math.sin(TAU * 110.5 * t) + 0.2 * noise()) * Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.3))
}
function notif(times) {
  for (const t of times) place([[B.sfx, 0.08], [B.verb, 0.03]], t, 0.25, (i, x) => (Math.sin(TAU * 1568 * x) + 0.5 * Math.sin(TAU * 2349 * x)) * Math.exp(-x / 0.07) * Math.min(1, x / 0.003))
}
function whoosh(t, gain = 0.25) {
  sample('1801', t - 0.07, gain, { len: 0.35, fade: 0.05 })
}
function steps(t0, len, gain = 0.18, every = 0.17) {
  for (let t = t0; t < t0 + len; t += every) boom(t, gain, 140, 60, 0.05)
}
function scratch(t0, gain = 0.25) {
  const bp = new Biquad('bandpass', 1200, 2)
  place([[B.sfx, gain]], t0, 0.35, (i, t) => {
    if (i % 16 === 0) bp.set('bandpass', 400 + 2400 * Math.abs(Math.sin(t * 38)), 2)
    return bp.process(noise()) * 2.5 * Math.min(1, t / 0.01) * Math.min(1, (0.35 - t) / 0.05)
  })
}
function tinnitus(t0, len, gain = 0.04) {
  place([[B.sfx, gain]], t0, len, (i, t) => Math.sin(TAU * 4200 * t) * Math.min(1, t / 0.05) * Math.min(1, (len - t) / 0.3))
}
function rewind(t0, len) {
  sweep(t0, len, { f0: 4000, f1: 300, gain: 0.3 })
  let ph = 0
  place([[B.sfx, 0.06]], t0, len, (i, t) => {
    ph += expInterp(300, 1400, t / len) / SR
    return Math.sign(Math.sin(TAU * ph)) * Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.05)
  })
}
function kaching(t0, gain = 0.15) {
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, 0.6, (i, t) => (Math.sin(TAU * 2637 * t) + 0.7 * Math.sin(TAU * 3520 * t) + 0.5 * Math.sin(TAU * 4186 * t)) * Math.exp(-t / 0.18) * (t > 0.05 ? 1 : Math.exp(-t / 0.01)))
}
function heart(t0, len, gain = 0.3, every = 0.75) {
  for (let t = t0; t < t0 + len; t += every) {
    boom(t, gain, 60, 38, 0.12)
    boom(t + 0.2, gain * 0.7, 55, 35, 0.12)
  }
}

/** Tampon encreur. */
function stamp(t0, gain = 0.3) {
  boom(t0, gain, 120, 55, 0.12)
  const bp = new Biquad('bandpass', 1200, 0.9)
  place([[B.sfx, gain * 0.6]], t0, 0.08, (i, t) => bp.process(noise()) * 2 * Math.exp(-t / 0.015))
}

/** Vent de nuit (bruit filtré qui ondule). */
function wind(t0, len, gain = 0.05) {
  const bp = new Biquad('bandpass', 500, 0.6)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    if (i % 32 === 0) bp.set('bandpass', 350 + 250 * Math.sin(TAU * 0.3 * t), 0.6)
    return bp.process(noise()) * 1.6 * Math.min(1, t / 0.5) * Math.min(1, (len - t) / 0.4)
  })
}

/** Choc aigu (impact, verre). */
function crash(t0, gain = 0.2) {
  const hp = new Biquad('highpass', 3800, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, 1.2, (i, t) => hp.process(noise()) * Math.exp(-t / 0.35) * Math.min(1, t / 0.002))
}

function flashHit(t0) {
  sweep(t0 - 0.12, 0.3, { f0: 3000, f1: 800, gain: 0.12 })
  boom(t0, 0.25, 110, 50, 0.3)
}

// ============================================================ les bruitages

/** Rumeur de foule (bruit filtré qui gonfle et retombe). */
function crowd(t0, len, gain = 0.05) {
  const bp = new Biquad('bandpass', 700, 0.5)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
    if (i % 64 === 0) bp.set('bandpass', 600 + 250 * Math.sin(TAU * 0.7 * t) + 120 * Math.sin(TAU * 2.3 * t), 0.5)
    return bp.process(noise()) * 2 * (0.7 + 0.3 * Math.sin(TAU * 1.3 * t)) * Math.min(1, t / 0.3) * Math.min(1, (len - t) / 0.3)
  })
}

/** Tir de LBD : détonation sourde (« pok ») et claquement. */
function lbdShot(t0, gain = 0.6) {
  boom(t0, gain, 140, 45, 0.25)
  tick(t0, gain * 0.5, 1200)
  crash(t0 + 0.01, gain * 0.25)
}

/** Bourdonnement de caméra de surveillance / de groupe froid. */
function hum(t0, len, f = 50, gain = 0.04) {
  place([[B.sfx, gain]], t0, len, (i, t) => (Math.sin(TAU * f * t) + 0.5 * Math.sin(TAU * 2 * f * t) + 0.25 * Math.sin(TAU * 3 * f * t)) * Math.min(1, t / 0.1) * Math.min(1, (len - t) / 0.1))
}

/** Portes pneumatiques. */
function psch(t0, gain = 0.35) {
  const hp = new Biquad('highpass', 1500, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, 0.45, (i, t) => hp.process(noise()) * Math.exp(-t / 0.18) * Math.min(1, t / 0.01))
}
/** Cri sur le quai (formants qui glissent). */
function scream(t0, len, gain = 0.4) {
  const f1 = new Biquad('bandpass', 900, 4)
  const f2 = new Biquad('bandpass', 2600, 6)
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.4]], t0, len, (i, t) => {
    const p = t / len
    ph += (520 + 120 * Math.sin(Math.PI * p) + 18 * Math.sin(TAU * 6 * t)) / SR
    const src = (2 * (ph % 1) - 1) * 0.7 + noise() * 0.3
    return (f1.process(src) * 2.5 + f2.process(src) * 1.5) * Math.min(1, t / 0.03) * Math.min(1, (len - t) / 0.2)
  })
}
/** Montée de tension : un sifflement qui monte et grossit. */
function riser(t0, len, gain = 0.05) {
  let ph = 0
  place([[B.music, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
    ph += expInterp(220, 880, t / len) / SR
    return (Math.sin(TAU * ph) + 0.5 * Math.sin(TAU * ph * 1.5)) * (t / len) ** 1.5
  })
}

/** Lame de couteau (sifflement métallique). */
function blade(t0, gain = 0.15) {
  sweep(t0, 0.25, { f0: 5000, f1: 9000, q: 6, gain })
  place([[B.sfx, gain * 0.5], [B.verb, gain * 0.3]], t0, 0.5, (i, t) => Math.sin(TAU * 3800 * t) * Math.exp(-t / 0.15))
}
/** Les sons des plans de coupe du procès. */
function cutSounds() {
  const X = C.cuts
  for (let i = 0; i < 3; i++) pop(X.LAW[0] + [0.1, 0.6, W('04', 'proportionnee') - 0.15 - X.LAW[0]][i], 0.14, i === 2 ? 600 : 1200, i === 2 ? 300 : 700)
  hum(X.BODY[0], X.BODY[1] - X.BODY[0], 60, 0.03)
  for (let i = 0; i < 5; i++) beep(W('04', 'cinq') - 0.1 + i * 0.12, 0.06, 1400, 0.06)
  for (let i = 0; i < 2; i++) beep(W('04', 'deux') - 0.1 + i * 0.15, 0.07, 1000, 0.08)
  heart(X.DARK[0], X.DARK[1] - X.DARK[0], 0.4, 0.74)
  for (const d of [0.17, 0.67, 0.84, 1.5, 2.17, 2.34, 3.0]) crash(X.DARK[0] + d, 0.05)
  blade(X.KNIFE[0] + 0.5, 0.14)
  boom(X.KNIFE[0] + 1.25, 0.3, 90, 40, 0.3)
  boom(X.TWO[0], 0.4, 80, 36, 0.4)
  for (let k = 0; k < 3; k++) clockTick(X.CLOCK[0] + 0.4 + k * 0.73, 0.12, k % 2 === 0)
  boom(X.CLOCK[0] + 2.6, 0.4, 70, 30, 0.5)
}

function score() {
  for (const sec of C.sections.slice(1)) sweep(sec.t0 - 0.24, 0.5, { f0: 300, f1: 3500, gain: 0.18 })
  const trib = SEC('tribunal').t0
  // L'ouverture : le choc, la caméra qui bourdonne.
  boom(0.05, 0.6, 70, 30, 0.9)
  hum(0, K.COURT, 50, 0.025)
  sample('1588', 0.1, 1.0)
  boom(0.14, 0.75, 60, 26, 1.2)
  stamp(0.16, 0.3)
  boom(W('00', 'cest') - 0.12, 0.3, 90, 34, 0.5)
  rewind(K.LIVE0 - 0.4, 0.4)
  // La reconstitution : la ville la nuit, les pas, la lame, la bagarre, la chute, les sirènes.
  wind(K.SCENE, K.COURT - K.SCENE, 0.04)
  steps(K.ARRIVE, K.KEYS - K.ARRIVE, 0.12, 0.3)
  blade(K.KNIFE, 0.12)
  boom(K.HURT, 0.5, 120, 45, 0.3)
  scream(K.HURT + 0.05, 0.4, 0.2)
  blade(K.GRAB, 0.1)
  for (let t = K.FIGHT; t < K.DOWN; t += 0.23) boom(t, 0.35, 110, 45, 0.12)
  boom(K.DOWN + 0.3, 0.8, 70, 26, 0.9)
  tinnitus(K.DOWN + 0.3, 1.2, 0.03)
  sample('1463', K.SIREN, 0.16, { len: K.COURT - K.SIREN + 0.3, lp: 2000 })
  // La cour d'assises ; le marteau.
  boom(K.COURT, 0.35, 120, 50, 0.4)
  sweep(K.GAVEL - 0.25, 0.2, { f0: 600, f1: 2400, gain: 0.12 })
  sample('1588', K.GAVEL + 0.08, 1.0)
  boom(K.GAVEL + 0.1, 0.65, 60, 28, 1.2)
  stamp(K.GAVEL + 0.12, 0.35)
  // Le procès.
  for (const l of C.lines.filter((x) => x.start > trib && x.start < SEC('vote').t0 && !x.id.startsWith('08') && !x.id.startsWith('09')).slice(1)) sweep(l.start - 0.2, 0.26, { f0: 500, f1: 3000, gain: 0.12 })
  for (const [a] of Object.values(C.cuts)) sweep(a - 0.12, 0.24, { f0: 900, f1: 5000, gain: 0.1, pan: -0.3 })
  cutSounds()
  for (const [a] of HOT) {
    sweep(a - 0.08, 0.12, { f0: 2400, f1: 200, gain: 0.18 })
    boom(a, 0.4, 100, 40, 0.4)
  }
  pop(W('08', 'abonnetoi') - 0.1, 0.2, 1200, 600)
  pop(W('08', 'abonnetoi') + 0.05, 0.14, 1600, 900)
  // Le verdict : le marteau, « douze ans », la comparaison.
  boom(IMPACT, 0.45, 55, 28, 1.4)
  sample('1588', W('09', 'douze') - 0.12, 0.9)
  boom(W('09', 'douze') - 0.1, 0.7, 60, 26, 1.2)
  boom(W('09', 'et') - 0.1, 0.3, 90, 40, 0.4)
  boom(W('09', 'cinq') - 0.1, 0.4, 80, 36, 0.5)
  // Le vote.
  boom(W('13', 'toi') - 0.15, 0.4, 60, 30, 1.2)
  pop(W('13', 'combien') - 0.1, 0.18, 1200, 600)
  pop(W('13', 'ecris') - 0.1, 0.12, 900, 400)
  pop(W('13', 'abonnetoi') - 0.1, 0.18, 1200, 600)
  pop(W('13', 'abonnetoi') + 0.05, 0.14, 1600, 900)
}

/** Bip (portes, téléphone, hôpital). */
function beep(t0, gain = 0.1, f = 1000, len = 0.09) {
  place([[B.sfx, gain]], t0, len, (i, t) => Math.sin(TAU * f * t) * Math.min(1, t / 0.003) * Math.min(1, (len - t) / 0.01))
}

function siren(t0, len, gain = 0.03) {
  let ph = 0
  const lp = new Biquad('lowpass', 1400, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.8]], t0, len, (i, t) => {
    ph += (TAU * (Math.floor(t / 0.45) % 2 ? 640 : 880)) / SR
    return lp.process(Math.sign(Math.sin(ph)) * 0.6) * Math.min(1, t / 0.3) * Math.min(1, (len - t) / 0.3)
  }, 0.4)
}

// ===================================================================== voix

function voiceTrack() {
  for (const line of C.lines) {
    const { sr, x } = readWav(path.join(HERE, 'voice', `${line.id}.wav`))
    const y = sr === SR ? x : resample(x, sr, SR)
    const s0 = Math.round(line.start * SR)
    // Les avocats sonnent « dans la salle » : un peu de réverbération.
    const room = ['narrateur'].includes(line.who) ? 0 : 0.22
    for (let i = 0; i < y.length && s0 + i < N; i++) {
      B.voice[0][s0 + i] += y[i]
      B.voice[1][s0 + i] += y[i]
      B.room[0][s0 + i] += y[i] * room
      B.room[1][s0 + i] += y[i] * room
    }
  }
  filterBus(B.voice, [['highpass', 80, 0.7], ['peaking', 250, 1, -2], ['peaking', 3200, 0.9, 2], ['highshelf', 8000, 0.7, -2]])
  for (const ch of B.voice) compress(ch, { threshold: -20, ratio: 2.6, makeup: 3 })
  filterBus(B.room, [['highpass', 200, 0.7], ['lowpass', 5000, 0.7]])
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
  setLoudness(B.music, -26, 1, SEC('vote').t0)
  const talk = voiceEnvelope(B.voice[0])
  const verb = reverb(B.verb, { room: 0.86, damp: 0.4 })
  const room = reverb(B.room, { room: 0.7, damp: 0.5 })
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  const mix = [
    [B.music, 1, 0.4],
    [B.sfx, 1, 0.25],
    [verb, 0.5, 0.35],
    [B.voice, 1, 0],
    [room, 0.6, 0],
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
