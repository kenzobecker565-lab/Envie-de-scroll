/**
 * Bande-son de « Sauf moi » (projet séparé) : musique légère et décalée,
 * bruitages calés sur cues.js, voix (voice/<id>.wav). Sonie : −14 LUFS.
 *
 *   node frere/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, polyblep, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { makeCues } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'frere')
const C = makeCues(JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8')))
const { S, E, W } = C
const DURATION = C.duration
const SHOT = Object.fromEntries(C.shots.map((s) => [s.id, s]))
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
// Do majeur, 104 BPM : pizzicati, basse ronde, petit charleston. La panne coupe
// tout ; la lampe torche rallume une nappe qui grandit jusqu'à la fin.

const BPM = 104
const BEAT = 60 / BPM
const BAR = BEAT * 4
const PROG = [
  [48, 60, 64, 67, 72],
  [43, 59, 62, 67, 71],
  [45, 57, 60, 64, 69],
  [41, 57, 60, 65, 69],
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


/** Pizzicato : note courte et ronde. */
function pluck(t0, midi, gain = 0.07, pan = 0) {
  const f = mtof(midi)
  place([[B.music, gain], [B.verb, gain * 0.35]], t0, 0.5, (i, t) => (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.05)) * Math.exp(-t / 0.13) * Math.min(1, t / 0.003), pan)
}
function bass(t0, midi, len, gain = 0.12) {
  const f = mtof(midi)
  place([[B.music, gain]], t0, len, (i, t) => (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)) * Math.exp(-t / 0.35) * Math.min(1, t / 0.006) * Math.min(1, (len - t) / 0.02))
}
function hat(t0, gain = 0.03) {
  const hp = new Biquad('highpass', 7000, 0.7)
  place([[B.music, gain]], t0, 0.05, (i, t) => hp.process(noise()) * Math.exp(-t / 0.012))
}
function kick(t0, gain = 0.25) {
  let ph = 0
  place([[B.music, gain]], t0, 0.35, (i, t) => {
    ph += (TAU * expInterp(140, 45, clamp(t / 0.08))) / SR
    return Math.sin(ph) * Math.exp(-t / 0.12)
  })
}
function groove(from, to, { drums = false, gain = 1 } = {}) {
  for (let bar = 0, t = from; t < to - 0.1; bar++, t += BAR) {
    const ch = PROG[bar % 4]
    bass(t, ch[0], Math.min(BEAT * 1.5, to - t), 0.12 * gain)
    if (t + BEAT * 2 < to) bass(t + BEAT * 2, ch[0] + 7, BEAT * 1.5, 0.09 * gain)
    const pat = [1, 2, 3, 4, 2, 3, 1, 3]
    for (let k = 0; k < 8; k++) {
      const tt = t + k * (BEAT / 2)
      if (tt >= to - 0.05) break
      pluck(tt, ch[pat[k]] + (k === 7 ? 12 : 0), (k % 2 ? 0.05 : 0.07) * gain, k % 2 ? 0.35 : -0.35)
      if (k % 2) hat(tt, 0.025 * gain)
      if (drums && k % 4 === 0) kick(tt, 0.22 * gain)
    }
  }
}

function music() {
  const sad0 = SHOT.seul.t0
  const conc = SHOT.concert.t0
  const panne = W('16', 'panne')
  const light = W('18', 'allume')
  // Le quotidien et l'entraînement : la petite musique sautillante.
  groove(0.05, SHOT.office.t0)
  groove(SHOT.office.t0, sad0, { gain: 0.85 })
  // Le refus : un piano seul, en la mineur.
  for (const [k, m] of [69, 67, 64, 60].entries()) piano(sad0 - 0.2 + k * 0.7, m, 0.07, 0.1)
  strings(sad0 - 0.2, conc - sad0, [57, 60, 64], 0.05, { cutoff: 1100 })
  // Le concert : tout le monde, boum boum.
  groove(conc, panne, { drums: true, gain: 1.15 })
  strings(conc, panne - conc, [60, 64, 67, 72], 0.05, { cutoff: 2200 })
  // Après la lampe : une nappe qui grandit, puis le thème revient en grand.
  const badge = SHOT.badge.t0
  strings(light + 0.3, badge - light, [48, 55, 60, 64], 0.06, { attack: 2.5, cutoff: 1400 })
  for (let t = light + 1.2, k = 0; t < badge - 0.3; t += BEAT * 2, k++) piano(t, [72, 76, 79, 76][k % 4], 0.05, 0.2)
  groove(badge, DURATION - 0.8, { drums: true, gain: 1.05 })
  strings(SHOT.fin.t0, DURATION - SHOT.fin.t0, [60, 64, 67, 72, 76], 0.07, { attack: 1.2, cutoff: 2600 })
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

/** Rumeur de foule (bruit filtré qui gonfle et retombe). */
function crowd(t0, len, gain = 0.05) {
  const bp = new Biquad('bandpass', 700, 0.5)
  place([[B.sfx, gain], [B.verb, gain * 0.5]], t0, len, (i, t) => {
    if (i % 64 === 0) bp.set('bandpass', 600 + 250 * Math.sin(TAU * 0.7 * t) + 120 * Math.sin(TAU * 2.3 * t), 0.5)
    return bp.process(noise()) * 2 * (0.7 + 0.3 * Math.sin(TAU * 1.3 * t)) * Math.min(1, t / 0.3) * Math.min(1, (len - t) / 0.3)
  })
}

/** Sirène lointaine (deux tons, filtrée). */
function siren(t0, len, gain = 0.03) {
  let ph = 0
  const lp = new Biquad('lowpass', 1400, 0.7)
  place([[B.sfx, gain], [B.verb, gain * 0.8]], t0, len, (i, t) => {
    ph += (TAU * (Math.floor(t / 0.45) % 2 ? 640 : 880)) / SR
    return lp.process(Math.sign(Math.sin(ph)) * 0.6) * Math.min(1, t / 0.3) * Math.min(1, (len - t) / 0.3)
  }, 0.4)
}

// ============================================================ les bruitages

function score() {
  // Un « fwip » léger à chaque changement de plan.
  for (const s of C.shots.slice(1)) sweep(s.t0 - 0.12, 0.24, { f0: 900, f1: 3200, gain: 0.05 })
  // La rue animée au début.
  crowd(0, SHOT.chambre.t0, 0.022)
  // Les pops des compteurs et des étiquettes.
  for (const [id, w, n = 0] of [['02', 'deux'], ['03', 'live'], ['03', 'quarante'], ['05', 'officiel'], ['06', 'rue'], ['06', 'ruelle'], ['06', 'raccourci'], ['07', 'trois'], ['07', 'mille'], ['07', 'prenom'], ['08', 'wifi'], ['09', 'gauche'], ['09', 'droite'], ['09', 'fontaine'], ['09', 'boulangerie'], ['10', 'pied'], ['11', 'pile'], ['11', 'sans'], ['15', 'trois'], ['15', 'trois', 1], ['18', 'suivezmoi'], ['19', 'gauche'], ['19', 'droite'], ['19', 'fontaine'], ['19', 'boulangerie'], ['19', 'trois'], ['19', 'vingt'], ['19', 'personne'], ['21', 'officiel']])
    pop(W(id, w, n) - 0.1, 0.12, 1200, 500)
  // Des tic-tac sur le réveil de 6 h.
  for (let k = 0; k < 6; k++) clockTick(SHOT.aube.t0 + 0.1 + k * 0.25, 0.06, k % 2 === 0)
  // Les pigeons qui ronflent (doux).
  for (let k = 0; k < 3; k++) pop(W('08', 'pigeon') + k * 0.25, 0.05, 300, 200)
  // BONK.
  const tc = W('09', 'cogne')
  boom(tc - 0.03, 0.5, 180, 70, 0.25)
  tick(tc - 0.03, 0.2, 1800)
  for (let k = 0; k < 4; k++) pop(tc + 0.15 + k * 0.12, 0.06, 2400, 1800)
  // REC du voisin.
  tick(SHOT.voisin.t0 + 0.05, 0.12, 1500)
  // REFUSÉ.
  stamp(W('13', 'poste') - 0.05, 0.35)
  // La pluie.
  wind(SHOT.seul.t0, SHOT.seul.t1 - SHOT.seul.t0 + 0.3, 0.05)
  const hp = new Biquad('highpass', 2500, 0.6)
  place([[B.sfx, 0.035]], SHOT.seul.t0, SHOT.seul.t1 - SHOT.seul.t0 + 0.3, (i, t) => hp.process(noise()) * Math.min(1, t / 0.3) * Math.min(1, (SHOT.seul.t1 - SHOT.seul.t0 + 0.3 - t) / 0.3))
  // Le concert : la foule qui crie.
  crowd(SHOT.concert.t0, W('16', 'panne') - SHOT.concert.t0, 0.06)
  // PANNE : chute de tension, puis le silence et un murmure inquiet.
  const tp = W('16', 'panne')
  let ph = 0
  place([[B.sfx, 0.3], [B.verb, 0.15]], tp - 0.05, 1.2, (i, t) => {
    ph += (TAU * expInterp(220, 30, clamp(t / 1.0))) / SR
    return (Math.sin(ph) + 0.4 * Math.sign(Math.sin(ph * 2))) * Math.exp(-t / 0.5) * 0.6
  })
  boom(tp - 0.05, 0.45, 60, 30, 1.0)
  crowd(tp + 0.8, SHOT.torche.t1 - tp, 0.028)
  // Le clic de la lampe torche.
  tick(W('18', 'allume') - 0.08, 0.3, 2000)
  boom(W('18', 'allume') - 0.08, 0.15, 300, 120, 0.06)
  // Les pas de la foule qui suit.
  for (let t = SHOT.file.t0; t < SHOT.file.t1; t += 0.29) tick(t, 0.03, 600)
  // Le badge.
  stamp(W('21', 'badge') - 0.1, 0.2)
  pop(W('21', 'badge') - 0.05, 0.15, 2000, 1400)
  // Les feux d'artifice.
  const f0 = SHOT.fin.t0 + 0.3
  for (let f = 0; f < 6; f++) for (let rep = 0; rep < 3; rep++) {
    const t = f0 + f * 0.9 + rep * 3.2
    if (t > DURATION - 0.8) continue
    boom(t, 0.28, 90, 40, 0.5)
    for (let k = 0; k < 6; k++) tick(t + 0.2 + k * 0.07 + (k % 2) * 0.03, 0.04, 3000 + k * 200)
  }
  crowd(SHOT.fin.t0, DURATION - SHOT.fin.t0, 0.03)
}

// ===================================================================== voix

function voiceTrack() {
  for (const line of C.lines) {
    const { sr, x } = readWav(path.join(HERE, 'voice', `${line.id}.wav`))
    const y = sr === SR ? x : resample(x, sr, SR)
    const s0 = Math.round(line.start * SR)
    // Les avocats (voix Piper) sonnent « dans la salle » : un peu de réverbération.
    const room = 0
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
  setLoudness(B.music, -25, 1, DURATION - 1)
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
