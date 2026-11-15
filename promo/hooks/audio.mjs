/**
 * Bande-son des hooks prototypes : voix (media/<clip>.wav, ElevenLabs),
 * bruitages (BigSoundBank + synthèse), nappe de tension. Sonie −14 LUFS.
 *
 *   node hooks/audio.mjs rodeo build/hooks/rodeo.wav
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'

import prank from './prank.js'
import rer from './rer.js'
import rodeo from './rodeo.js'

const HOOKS = { rodeo, prank, rer }
const HERE = path.dirname(fileURLToPath(import.meta.url))
const SONS = path.join(HERE, '..', 'sons', 'bigsoundbank')

export function writeHookAudio(name, file) {
  const hook = HOOKS[name]
  const DURATION = hook.DUR
  const N = Math.ceil(DURATION * SR)
  let seed = 0x51ce
  const rand = () => {
    seed = (seed + 0x6d2b79f5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const noise = () => rand() * 2 - 1
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
  const CACHE = {}
  const A = {
    sample(id, t0, gain = 0.5, { from = 0, len = Infinity, lp = 0, pan = 0, fade = 0.02 } = {}) {
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
    },
    boom(t0, gain = 0.5, f0 = 70, f1 = 36, decay = 0.8) {
      let ph = 0
      place([[B.sfx, gain], [B.verb, gain * 0.3]], t0, decay * 3, (i, t) => {
        ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
        return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
      })
    },
    sweep(t0, len, { f0, f1, q = 1.4, gain = 0.3, pan = 0, send = 0.2 }) {
      const bp = new Biquad('bandpass', f0, q)
      place([[B.sfx, gain], [B.verb, gain * send]], t0, len, (i, t) => {
        const p = t / len
        if (i % 8 === 0) bp.set('bandpass', expInterp(f0, f1, p), q)
        return bp.process(noise()) * Math.sin(Math.PI * p) ** 1.6 * 2.2
      }, pan)
    },
    crash(t0, gain = 0.2) {
      const hp = new Biquad('highpass', 3800, 0.7)
      place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, 1.2, (i, t) => hp.process(noise()) * Math.exp(-t / 0.35) * Math.min(1, t / 0.002))
    },
    whoosh(times) {
      for (const t of times) A.sample('1801', t - 0.07, 0.25, { len: 0.35, fade: 0.05 })
    },
    /** Moteur deux-temps (moto de cross) : dent de scie modulée, qui monte dans les tours. */
    moto(t0, len, gain = 0.5, far = false) {
      let ph = 0
      const lp = new Biquad('lowpass', far ? 900 : 2600, 0.8)
      place([[B.sfx, gain], [B.verb, gain * 0.25]], t0, len, (i, t) => {
        const p = t / len
        const f = 70 + 110 * Math.sin(Math.PI * Math.min(1, p * 1.3)) + 25 * Math.sin(TAU * 7 * t)
        ph += f / SR
        const saw = 2 * (ph % 1) - 1
        const v = lp.process(saw * 0.8 + noise() * 0.25 * (0.5 + 0.5 * Math.sin(TAU * f * t)))
        return v * Math.min(1, t / 0.08) * Math.min(1, (len - t) / 0.15)
      }, far ? 0.4 : 0)
    },
    /** Battements de cœur sourds. */
    heart(t0, len, gain = 0.3, every = 0.75) {
      for (let t = t0; t < t0 + len; t += every) {
        A.boom(t, gain, 60, 38, 0.12)
        A.boom(t + 0.2, gain * 0.7, 55, 35, 0.12)
      }
    },
    /** Nappe grave de tension (deux notes dissonantes qui battent). */
    drone(t0, len, gain = 0.05) {
      const lp = new Biquad('lowpass', 700, 0.7)
      place([[B.music, gain]], t0, len, (i, t) => lp.process(Math.sin(TAU * 55 * t) + 0.7 * Math.sin(TAU * 58.3 * t) + 0.4 * Math.sin(TAU * 110.5 * t) + 0.2 * noise()) * Math.min(1, t / 0.6) * Math.min(1, (len - t) / 0.3))
    },
    /** Montée de tension : un sifflement qui monte et grossit. */
    riser(t0, len, gain = 0.05) {
      let ph = 0
      place([[B.music, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
        ph += expInterp(220, 880, t / len) / SR
        return (Math.sin(TAU * ph) + 0.5 * Math.sin(TAU * ph * 1.5)) * (t / len) ** 1.5
      })
    },
    /** Sifflement d'oreilles après le choc. */
    tinnitus(t0, len, gain = 0.04) {
      place([[B.sfx, gain]], t0, len, (i, t) => Math.sin(TAU * 4200 * t) * Math.min(1, t / 0.05) * Math.min(1, (len - t) / 0.3))
    },
    /** Notifications du live (petits « ding »). */
    notif(times) {
      for (const t of times) {
        place([[B.sfx, 0.08], [B.verb, 0.03]], t, 0.25, (i, x) => (Math.sin(TAU * 1568 * x) + 0.5 * Math.sin(TAU * 2349 * x)) * Math.exp(-x / 0.07) * Math.min(1, x / 0.003))
      }
    },
    /** Cri (voix synthétique : formants qui glissent). */
    scream(t0, len, gain = 0.4) {
      const f1 = new Biquad('bandpass', 900, 4)
      const f2 = new Biquad('bandpass', 2600, 6)
      let ph = 0
      place([[B.sfx, gain], [B.verb, gain * 0.4]], t0, len, (i, t) => {
        const p = t / len
        ph += (520 + 120 * Math.sin(Math.PI * p) + 18 * Math.sin(TAU * 6 * t)) / SR
        const src = (2 * (ph % 1) - 1) * 0.7 + noise() * 0.3
        return (f1.process(src) * 2.5 + f2.process(src) * 1.5) * Math.min(1, t / 0.03) * Math.min(1, (len - t) / 0.2)
      })
    },
    /** Pas de course. */
    steps(t0, len, gain = 0.18) {
      for (let t = t0; t < t0 + len; t += 0.17) A.boom(t, gain, 140, 60, 0.05)
    },
    /** Portes pneumatiques. */
    psch(t0, gain = 0.35) {
      const hp = new Biquad('highpass', 1500, 0.7)
      place([[B.sfx, gain], [B.verb, gain * 0.2]], t0, 0.45, (i, t) => hp.process(noise()) * Math.exp(-t / 0.18) * Math.min(1, t / 0.01))
    },
    /** Rembobinage : bande qui accélère à l'envers. */
    rewind(t0, len) {
      A.sweep(t0, len, { f0: 4000, f1: 300, gain: 0.3 })
      let ph = 0
      place([[B.sfx, 0.06]], t0, len, (i, t) => {
        ph += expInterp(300, 1400, t / len) / SR
        return Math.sign(Math.sin(TAU * ph)) * Math.min(1, t / 0.02) * Math.min(1, (len - t) / 0.05)
      })
    },
  }

  hook.sound(A)
  // Les voix.
  for (const v of hook.VOICES) {
    const { sr, x } = readWav(path.join(HERE, 'media', `${v.clip}.wav`))
    const y = sr === SR ? x : resample(x, sr, SR)
    const s0 = Math.round(v.at * SR)
    for (let i = 0; i < y.length && s0 + i < N; i++) {
      B.voice[0][s0 + i] += y[i]
      B.voice[1][s0 + i] += y[i]
    }
  }
  filterBus(B.voice, [['highpass', 80, 0.7], ['peaking', 250, 1, -2], ['peaking', 3200, 0.9, 2.5]])
  for (const ch of B.voice) compress(ch, { threshold: -20, ratio: 2.6, makeup: 3 })

  const lufs = (bus, target) => {
    const g = 10 ** ((target - loudness(bus[0], bus[1])) / 20)
    for (const ch of bus) for (let j = 0; j < N; j++) ch[j] *= g
  }
  lufs(B.voice, -15)
  const talk = voiceEnvelope(B.voice[0])
  const verb = reverb(B.verb, { room: 0.8, damp: 0.4 })
  const L = new Float32Array(N)
  const R = new Float32Array(N)
  for (const [bus, g, duck] of [[B.music, 1, 0.3], [B.sfx, 1.1, 0.35], [verb, 0.5, 0.35], [B.voice, 1, 0]]) {
    for (let j = 0; j < N; j++) {
      const d = g * (1 - duck * talk[j])
      L[j] += bus[0][j] * d
      R[j] += bus[1][j] * d
    }
  }
  filterBus([L, R], [['highpass', 28, 0.7]])
  for (let pass = 0; pass < 3; pass++) {
    const gain = 10 ** ((-14 - loudness(L, R)) / 20)
    for (let j = 0; j < N; j++) {
      L[j] *= gain
      R[j] *= gain
    }
    limit(L, R, 10 ** (-1.5 / 20), { truePeak: true })
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  writeWav(file, L, R, rand)
}

// Pour render.mjs (bande-son complète) : le hook est donné par HOOK.
export function writeAudio(file) {
  writeHookAudio(process.env.HOOK, file)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  writeHookAudio(process.argv[2], process.argv[3])
  console.log(process.argv[3])
}
