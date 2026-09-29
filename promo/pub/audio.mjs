/**
 * ============================================================================
 *  Bande-son de la pub (≈ 28 s) : musique, voix off, bruitages.
 * ============================================================================
 *  - Musique : morceau original libre de droits généré avec vidIQ
 *    (build/pub/musique.wav, voir README), décalé pour que son drop tombe sur
 *    « Plutôt ». Quand le fil se fige, la musique s'arrête comme une bande qui
 *    ralentit ; elle revient étouffée et s'ouvre, puis se coupe d'un temps
 *    quand le doigt appuie sur le bouton, avant le drop.
 *  - Voix off : vidIQ / ElevenLabs (media/voix-off.mp3, décodée par prepare.mjs).
 *  - Bruitages : synthétisés ici et calés sur les instants de timeline.js
 *    (balayages, notification, clics, impacts, pops, carillons…).
 *  La musique et les bruitages baissent quand la voix parle. Sonie : −14 LUFS.
 *
 *   node pub/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, polyblep, readWav, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { BEAT, DROP, DURATION, MUSIC_OFFSET, SWIPES, T, VO_START } from './timeline.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'pub')
const N = Math.ceil(DURATION * SR)

// ------------------------------------------------------------------ outils

let seed = 0x51c0de
function rand() {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = seed
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const noise = () => rand() * 2 - 1
const newBus = () => [new Float32Array(N), new Float32Array(N)]

const B = {
  music: newBus(),
  pad: newBus(), // nappe sous la question, pendant que la musique est coupée
  sfx: newBus(),
  verb: newBus(), // envoi vers la réverbération
  voice: newBus(),
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

// ---------------------------------------------------------------- bruitages
// Les notes des carillons (fa, si bémol, do) vont avec la tonalité du morceau.

const F5 = 77
const BB5 = 82
const C6 = 84
const F6 = 89
const BB6 = 94
const SPARK = [F6, BB6, C6 + 12, F6 + 12, BB5, C6]

/** Souffle filtré dont la fréquence glisse (balayages, montées, « whoosh »). */
function sweep(t0, len, { f0, f1, fmid = null, q = 1.4, shape = 'bell', gain = 0.3, pan = 0, send = 0.2 }) {
  const bp = new Biquad('bandpass', f0, q)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, len, (i, t) => {
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

/** Cloche / carillon en synthèse FM. */
function bell(t0, midi, gain = 0.12, { pan = 0, decay = 1.1, ratio = 3.5, index = 2.6, send = 0.45 } = {}) {
  const f = mtof(midi)
  place([[B.sfx, gain], [B.verb, gain * send]], t0, decay * 3.5, (i, t) => {
    const I = index * Math.exp(-t / 0.18)
    const v = Math.sin(TAU * f * t + I * Math.sin(TAU * f * ratio * t))
    return v * Math.exp(-t / decay) * Math.min(1, t / 0.0015) * 0.8
  }, pan)
}

/** Impact grave : sinus dont la fréquence plonge. */
function boom(t0, gain = 0.6, f0 = 62, f1 = 36, decay = 0.9) {
  let ph = 0
  place([[B.sfx, gain]], t0, decay * 3, (i, t) => {
    ph += (TAU * expInterp(f0, f1, clamp(t / (decay * 1.2)))) / SR
    return Math.sin(ph) * Math.exp(-t / decay) * Math.min(1, t / 0.004)
  })
}

function crash(t0, gain = 0.3) {
  const hp = new Biquad('highpass', 3800, 0.7)
  const bp = new Biquad('bandpass', 7500, 0.9)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, 1.6, (i, t) => {
    const n = hp.process(noise())
    return (0.7 * n + 0.8 * bp.process(n)) * Math.exp(-t / 0.55) * Math.min(1, t / 0.002)
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

function snare(t0, gain = 0.4, pitch = 1) {
  const bp = new Biquad('bandpass', 2000 * pitch, 0.7)
  let ph = 0
  place([[B.sfx, gain], [B.verb, gain * 0.25]], t0, 0.25, (i, t) => {
    ph += (TAU * 185 * pitch * (1 + 0.5 * Math.exp(-t / 0.01))) / SR
    return bp.process(noise()) * 1.4 * Math.exp(-t / 0.075) + Math.sin(ph) * 0.6 * Math.exp(-t / 0.05)
  })
}

/** Roulement de caisse claire : croches, doubles, puis triples croches, en crescendo. */
function roll(from, to, gain0, gain1) {
  const times = []
  const third = (to - from) / 3
  for (const [a, step] of [[from, BEAT / 2], [from + third, BEAT / 4], [from + 2 * third, BEAT / 8]]) {
    for (let t = a; t < a + third - 0.01; t += step) times.push(t)
  }
  for (const t of times) {
    const p = (t - from) / (to - from)
    snare(t, gain0 + (gain1 - gain0) * p ** 1.4, 1 + 0.3 * p)
  }
}

/** Crayon qui gratte le papier (le trait qui barre « scroller »). */
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

/** Montée : dent de scie qui grimpe d'un fa à deux octaves au-dessus. */
function riser(t0, len, gain = 0.2) {
  let ph = 0
  const lp = new Biquad('lowpass', 1200, 0.8)
  place([[B.sfx, gain]], t0, len, (i, t) => {
    const p = t / len
    const f = expInterp(mtof(41), mtof(65), p ** 1.5)
    ph = (ph + f / SR) % 1
    if (i % 16 === 0) lp.set('lowpass', expInterp(400, 6000, p), 0.8)
    return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * p ** 2 * 0.7
  })
}

/** Nappe : dents de scie désaccordées et filtrées, attaque et relâchement lents. */
function pad(t0, dur, midis, gain = 0.1, { attack = 0.25, release = 0.5, cutoff = 1900 } = {}) {
  for (const m of midis) {
    for (const [det, pan] of [[-0.12, -0.8], [0.03, 0], [0.13, 0.8]]) {
      const f = mtof(m + det)
      const lp = new Biquad('lowpass', cutoff, 0.6)
      let ph = rand()
      place([[B.pad, gain / midis.length], [B.verb, (gain / midis.length) * 0.35]], t0, dur + release * 4, (i, t) => {
        ph = (ph + f / SR) % 1
        const env = Math.min(1, t / attack) * (t < dur ? 1 : Math.exp(-(t - dur) / release))
        return lp.process(2 * ph - 1 - polyblep(ph, f / SR)) * env * 0.6
      }, pan)
    }
  }
}

// ================================================================= partition

function score() {
  // ------------------------------------------------ 1 · l'accroche
  // Le pouce balaie le fil, de plus en plus vite.
  SWIPES.forEach((s, k) => sweep(s.t - 0.03, s.d + 0.14, { f0: 500, fmid: 3800, f1: 1400, gain: 0.1 + 0.025 * k, q: 1.1, pan: 0.15 }))
  // La notification « temps d'écran » glisse et tinte.
  sweep(T.notif - 0.02, 0.3, { f0: 2500, f1: 600, shape: 'fall', gain: 0.05, q: 1, pan: -0.2 })
  bell(T.notif + 0.1, BB6, 0.06, { decay: 0.35, ratio: 2, index: 1.2, send: 0.25, pan: -0.2 })
  bell(T.notif + 0.19, F6, 0.05, { decay: 0.55, ratio: 2, index: 1.2, send: 0.25, pan: -0.2 })
  // Le compteur s'emballe (un clic toutes les 4 minutes affichées ; tween ease.in2).
  for (let m = 196; m <= 287; m += 4) {
    const q = Math.sqrt((m - 192) / 95)
    tick(T.counter + q * (T.freeze - T.counter), 0.025 + 0.03 * q, 2200 + 1400 * q, -0.25)
  }
  // Arrêt net : « scratch », coup sourd, déclic (la musique s'arrête : voir musicTrack).
  sweep(T.freeze - 0.02, 0.2, { f0: 3800, f1: 220, shape: 'fall', gain: 0.3, q: 2 })
  boom(T.freeze, 0.5, 90, 34, 0.35)
  tick(T.freeze, 0.14, 1500)

  // ------------------------------------------------ 2 · le bouton
  pop(T.freeze + 0.05, 0.28, 700, 170)
  ;[F5, BB5, C6].forEach((m, i) => bell(T.freeze + 0.1 + i * 0.07, m + 12, 0.04, { pan: (i - 1) * 0.4, decay: 0.8 }))
  // Nappe (quinte de fa) et battements sous la question, jusqu'au retour de la musique.
  pad(T.freeze + 0.1, T.musicBack - T.freeze + 0.15, [41, 48, 53, 60], 0.2, { attack: 0.5, release: 0.2, cutoff: 1300 })
  for (let t0 = T.freeze + 0.3; t0 < T.musicBack - 0.2; t0 += 2 * BEAT) {
    thud(t0, 0.3)
    thud(t0 + 0.17, 0.17)
  }
  // La musique revient et monte (roulement) ; le doigt appuie : la musique se
  // coupe d'un coup, le bouton se charge pendant « Voici… », puis le drop.
  roll(T.musicBack, T.tapBtn, 0.12, 0.4)
  sweep(T.musicBack + 0.2, DROP - T.musicBack - 0.2, { f0: 300, f1: 9000, shape: 'rise', gain: 0.34, q: 0.8 })
  riser(T.musicBack + 0.5, DROP - T.musicBack - 0.5, 0.16)
  sweep(T.tapBtn - 0.5, 0.35, { f0: 300, f1: 1600, gain: 0.06 })
  tick(T.tapBtn, 0.2, 1800)
  pop(T.tapBtn + 0.01, 0.28, 500, 150)

  // ------------------------------------------------ 3 · le drop, le logo
  boom(DROP, 0.75, 70, 30, 1.1)
  crash(DROP, 0.32)
  sweep(DROP, 0.6, { f0: 5000, f1: 400, shape: 'fall', gain: 0.2, q: 0.7 })
  for (let k = 0; k < 9; k++) bell(DROP + 0.03 + k * 0.045, SPARK[k % SPARK.length], 0.028, { pan: Math.sin(k * 2.1) * 0.8, decay: 0.5, index: 1.8 })
  scribble(T.strike, 0.3, 0.16)
  sweep(T.strike - 0.05, 0.4, { f0: 600, fmid: 3000, f1: 400, gain: 0.08 })

  // ------------------------------------------------ 4 · la démo
  sweep(T.phoneIn - 0.3, 0.5, { f0: 250, fmid: 1800, f1: 500, gain: 0.16, q: 0.9 }) // le logo part, le téléphone monte
  thud(T.phoneIn + 0.15, 0.16)
  T.taps.forEach((t0, i) => {
    tick(t0, 0.15, 1700, 0.1 * (i - 1.5))
    pop(t0 + 0.005, 0.13, 900, 300, 0.1 * (i - 1.5))
  })
  T.screens.forEach((t0) => sweep(t0 - 0.02, 0.28, { f0: 1500, f1: 5000, gain: 0.05, q: 1.2, pan: 0.3 }))
  sweep(T.cardPop - 0.05, 0.35, { f0: 400, f1: 2500, gain: 0.1 }) // la carte sort du téléphone
  pop(T.cardPop + 0.08, 0.24, 800, 220)
  bell(T.cardPop + 0.1, F6, 0.05, { decay: 0.7 })
  pop(T.chip + 0.05, 0.2, 1200, 400, 0.4) // l'étiquette « Dessin »
  sweep(T.whip - 0.05, 0.4, { f0: 300, fmid: 2600, f1: 500, gain: 0.34, q: 0.9, pan: -0.3 }) // coup de fouet

  // ------------------------------------------------ 5 · les vraies vidéos
  thud(T.cuts[0], 0.3) // le fouet arrive
  sweep(T.cuts[1] - 0.16, 0.3, { f0: 400, f1: 6000, shape: 'rise', gain: 0.18, q: 0.8 }) // zoom
  sweep(T.cuts[2] - 0.14, 0.26, { f0: 700, fmid: 3500, f1: 900, gain: 0.16 }) // glissement
  boom(T.cuts[3], 0.45, 110, 40, 0.3) // coupe franche
  crash(T.cuts[3], 0.16)
  T.cuts.forEach((c, i) => {
    pop(c + 0.02, 0.2, 900 + 150 * i, 260, i % 2 ? 0.3 : -0.3) // le mot
    pop(c + 0.12, 0.09, 1400, 500, i % 2 ? -0.3 : 0.3) // la petite carte
  })
  sweep(T.grid - 0.05, 0.5, { f0: 3000, f1: 300, gain: 0.14, q: 0.8 }) // la vidéo recule dans la grille
  ;[0, 1, 2].forEach((k) => pop(T.grid + 0.17 + k * 0.06, 0.12, 1000 + k * 200, 350, [-0.5, 0.5, -0.5][k]))
  pop(T.grid + 0.05, 0.18, 700, 200) // le minuteur
  T.nums.forEach((t0, i) => {
    thud(t0, 0.3)
    bell(t0 + 0.01, [F5, BB5, F6][i], 0.065, { decay: 0.6 })
  })
  pop(T.minutes, 0.12, 1300, 600)
  sweep(T.progress - 0.32, 0.35, { f0: 800, f1: 4000, shape: 'rise', gain: 0.14 })

  // ------------------------------------------------ 6 · la progression
  boom(T.progress - 0.1, 0.35, 80, 40, 0.4)
  sweep(T.progress - 0.12, 0.5, { f0: 4000, f1: 500, shape: 'fall', gain: 0.12 })
  ;[F5, BB5, C6, F6, BB6].forEach((m, i) => bell(T.progress + 0.02 + i * 0.07, m, 0.055, { decay: 0.9, pan: -0.4 + i * 0.2 }))
  sweep(T.progScreen - 0.02, 0.3, { f0: 1500, f1: 5000, gain: 0.05, pan: 0.3 })
  sweep(T.progScreen + 0.35, 1.1, { f0: 800, fmid: 2000, f1: 700, gain: 0.035, q: 0.8 }) // la page défile
  pop(T.stTransformed + 0.02, 0.22, 900, 260, -0.4)
  bell(T.stTransformed + 0.04, C6, 0.05, { decay: 0.7, pan: -0.4 })
  pop(T.stStreak + 0.02, 0.22, 900, 260, 0.4)
  bell(T.stStreak + 0.04, F6, 0.05, { decay: 0.7, pan: 0.4 })
  // La série compte de 1 à 5 (tween ease.out2 de 0,55 s) : un clic par chiffre.
  for (const v of [1.5, 2.5, 3.5, 4.5]) {
    const q = 1 - Math.sqrt(1 - (v - 1) / 4)
    tick(T.stStreak + 0.1 + q * 0.55, 0.05, 2000 + v * 250, 0.4)
  }
  bell(T.streakBump, BB6, 0.065, { decay: 0.9, pan: 0.4 })
  sweep(T.streakBump - 0.05, 0.4, { f0: 600, f1: 3500, gain: 0.07, pan: 0.4 })

  // ------------------------------------------------ 7 · la signature
  sweep(T.end - 0.3, 0.36, { f0: 300, f1: 7000, shape: 'rise', gain: 0.3, q: 0.8 }) // bande qui balaie
  boom(T.end, 0.6, 70, 30, 0.9)
  crash(T.end, 0.22)
  pop(T.end + 0.1, 0.24, 700, 180) // l'icône
  ;[150, 930, 100, 980, 120, 960, 110, 970].forEach((x, i) => pop(T.end + 0.19 + i * 0.04, 0.07, 1300 + (i % 3) * 250, 500, ((x - 540) / 540) * 0.7))
  scribble(T.endStrike, 0.3, 0.13)
  pop(T.cta + 0.03, 0.24, 800, 220) // le bouton « Essaie l'appli »
  thud(T.cta + 0.02, 0.2)
  ;[F6, BB6, F6 + 12].forEach((m, i) => bell(T.cta + 0.05 + i * 0.08, m, 0.05, { decay: 0.9, pan: -0.3 + i * 0.3 }))
  // Dernier coup, juste après la voix : impact et carillon qui résonne jusqu'à la fin.
  boom(T.sting, 0.5, 80, 32, 0.8)
  crash(T.sting, 0.16)
  ;[F5, C6, F6, BB6, C6 + 12].forEach((m, i) => bell(T.sting + 0.01 + i * 0.035, m, 0.045, { decay: 1.3, pan: -0.5 + i * 0.25, index: 1.6 }))
}

// =================================================================== musique

/**
 * La musique calée sur la pub (temps musique = temps pub + MUSIC_OFFSET) :
 * arrêt de bande sur le gel du fil, silence, retour étouffé dont le filtre
 * s'ouvre, coupure sur l'appui du doigt, puis le drop.
 */
function musicTrack() {
  const { sr, channels } = readWav(path.join(BUILD, 'musique.wav'))
  if (sr !== SR) throw new Error(`musique.wav doit être à ${SR} Hz (voir prepare.mjs)`)
  const [mL, mR = mL] = channels
  const at = (ch, pos) => {
    const k = Math.floor(pos)
    const f = pos - k
    return k >= 0 && k + 1 < ch.length ? ch[k] * (1 - f) + ch[k + 1] * f : 0
  }
  const STOP = 0.42
  const lp = [new Biquad('lowpass', 300, 1.6), new Biquad('lowpass', 300, 1.6)]
  let pos = 0
  for (let j = 0; j < N; j++) {
    const t = j / SR
    let g = 1.5 // avant le drop, la musique est plus douce : on la remonte un peu
    if (t < T.freeze) pos = (t + MUSIC_OFFSET) * SR
    else if (t < T.freeze + STOP) {
      const q = (t - T.freeze) / STOP
      pos += (1 - q) ** 1.6 // la bande ralentit jusqu'à l'arrêt
      g *= (1 - q * 0.35) * Math.min(1, (1 - q) / 0.1)
    } else if (t < T.musicBack) g = 0
    else {
      pos = (t + MUSIC_OFFSET) * SR
      if (t >= DROP) g = 1
      else g *= 1.4 * Math.min(1, (t - T.musicBack) / 0.03) * clamp((T.tapBtn + 0.012 - t) / 0.012) // coupée par l'appui
    }
    if (t < 0.005) g *= t / 0.005
    let l = at(mL, pos) * g
    let r = at(mR, pos) * g
    if (t >= T.musicBack && t < T.tapBtn + 0.02) {
      if (j % 16 === 0) {
        const p = clamp((t - T.musicBack) / (T.tapBtn - T.musicBack))
        for (const f of lp) f.set('lowpass', expInterp(300, 18000, p ** 0.85), 1.6 - p * 0.9)
      }
      l = lp[0].process(l)
      r = lp[1].process(r)
    }
    B.music[0][j] = l
    B.music[1][j] = r
  }
}

// ================================================================= voix off

function voiceTrack() {
  const { sr, x } = readWav(path.join(BUILD, 'voix.wav'))
  if (sr !== SR) throw new Error(`voix.wav doit être à ${SR} Hz (voir prepare.mjs)`)
  const s0 = Math.round(VO_START * SR)
  for (let i = 0; i < x.length && s0 + i < N; i++) {
    B.voice[0][s0 + i] = x[i]
    B.voice[1][s0 + i] = x[i]
  }
  // Coupe-bas, un peu moins de « boue », un peu plus de présence ; compression douce.
  filterBus(B.voice, [['highpass', 90, 0.7], ['peaking', 280, 1, -2], ['peaking', 3500, 0.9, 2.5]])
  for (const ch of B.voice) compress(ch, { threshold: -20, ratio: 2.5, makeup: 4 })
}

// ================================================================== mixage

/** Multiplie un bus pour que sa sonie (sur [from, to[ secondes) vaille `lufs`. */
function setLoudness(bus, lufs, from = 0, to = DURATION) {
  const a = Math.round(from * SR)
  const z = Math.round(to * SR)
  const g = 10 ** ((lufs - loudness(bus[0].subarray(a, z), bus[1].subarray(a, z))) / 20)
  for (const ch of bus) for (let j = 0; j < N; j++) ch[j] *= g
}

/** Niveaux des éléments avant la normalisation finale (voix : référence). */
export const LEVELS = { voice: -16, music: -23, pad: -30 }

export function renderAudio() {
  seed = 0x51c0de
  for (const bus of Object.values(B)) for (const ch of bus) ch.fill(0)
  score()
  musicTrack()
  voiceTrack()

  setLoudness(B.voice, LEVELS.voice)
  setLoudness(B.music, LEVELS.music, DROP, DURATION - 3) // mesurée sur la partie pleine
  setLoudness(B.pad, LEVELS.pad)
  const talk = voiceEnvelope(B.voice[0])
  const verb = reverb(B.verb, { room: 0.8, damp: 0.3 })

  const L = new Float32Array(N)
  const R = new Float32Array(N)
  // [bus, gain, baisse sous la voix (0 à 1)]
  const mix = [
    [B.music, 1, 0.5],
    [B.pad, 1, 0.2],
    [B.sfx, 1, 0.35],
    [verb, 0.5, 0.4],
    [B.voice, 1, 0],
  ]
  for (const [bus, g, underVoice] of mix) {
    for (let j = 0; j < N; j++) {
      const d = g * (1 - underVoice * talk[j])
      L[j] += bus[0][j] * d
      R[j] += bus[1][j] * d
    }
  }
  // Fondu final (la musique finit déjà en douceur).
  const fadeStart = DURATION - 0.3
  for (let j = Math.round(fadeStart * SR); j < N; j++) {
    const g = Math.cos((Math.PI / 2) * Math.min(1, (j / SR - fadeStart) / 0.3)) ** 2
    L[j] *= g
    R[j] *= g
  }
  // Coupe-bas de sécurité, sonie visée −14 LUFS, crêtes (vraies) sous −1,8 dB.
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

/** Écrit la bande-son en WAV 16 bits stéréo. */
export function writeAudio(file) {
  const [L, R] = renderAudio()
  writeWav(file, L, R, rand)
}

// Utilisation directe : node pub/audio.mjs [sortie.wav]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2] ?? path.join(BUILD, 'audio.wav')
  if (!fs.existsSync(path.join(BUILD, 'musique.wav'))) throw new Error('Lance d’abord « node pub/prepare.mjs » (voir README).')
  const started = Date.now()
  writeAudio(out)
  console.log(`${out} (${((Date.now() - started) / 1000).toFixed(1)} s)`)
}
