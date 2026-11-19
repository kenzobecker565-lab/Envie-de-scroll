/**
 * ============================================================================
 *  Bande-son de l'affaire n°5 (version 2) (l'adresse) : musique, bruitages, voix.
 * ============================================================================
 *  - Musique : la même ambiance de thriller judiciaire que les autres affaires
 *    (identité de la série).
 *  - Bruitages calés sur cues.js : papier, rue de nuit et sirène lointaine,
 *    mois qui défilent, tampons, marteau, booms des phrases-chocs, abonnement.
 *  - Voix : voice/<id>.wav (Chatterbox, voir ../voix-libres), placées d'après
 *    timeline.json ; une légère réverbération de salle sur les avocats.
 *  Sonie : −14 LUFS.
 *
 *   node affaire-05-v2/audio.mjs [sortie.wav]
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Biquad, SR, TAU, clamp, compress, expInterp, filterBus, limit, loudness, mtof, polyblep, readWav, resample, reverb, voiceEnvelope, writeWav } from '../dsp.mjs'
import { makeCues } from './cues.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BUILD = path.join(HERE, '..', 'build', 'affaire-05-v2')
const C = makeCues(JSON.parse(fs.readFileSync(path.join(HERE, 'timeline.json'), 'utf8')))
const { S, E, W } = C
const DURATION = C.duration
const SEC = (id) => C.sections.find((s) => s.id === id)
// Le coup (la musique se tait un temps).
const IMPACT = -10
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

function music() {
  const debat = SEC('tribunal').t0
  const vote = SEC('vote').t0
  const facts = C.sections[1].t0
  // L'accroche : coup grave, nappe tendue, tic-tac.
  drum(0.05, 0.45)
  strings(0.1, facts + 0.3, [38, 45, 50], 0.05, { attack: 0.8, cutoff: 900 })
  for (let t = 0.6; t < facts; t += 0.5) clockTick(t, 0.05, Math.round(t / 0.5) % 2 === 0)
  // Les faits, puis le procès : basse pulsée, cordes, percussions.
  for (let bar = 0, t = facts - 0.1; t < vote - 0.3; bar++, t += BAR) {
    const ch = CH[bar % 4]
    const len = Math.min(BAR, vote - 0.3 - t)
    strings(t, len, [ch[1], ch[2], ch[3]], 0.05, { cutoff: t > debat ? 1300 : 1700 })
    for (let k = 0; k < 8; k++) {
      const tt = t + k * (BEAT / 2)
      if (tt >= vote - 0.3) break
      // Silence d'un temps au moment du coup.
      if (tt > IMPACT - 0.1 && tt < IMPACT + 0.5) continue
      pulse(tt, ch[0] + 12 * (k % 2), k % 2 ? 0.07 : 0.1)
    }
    for (const b of t < debat ? [0, 1.5, 2, 3] : [0, 2]) if (t + b * BEAT < vote - 0.3) drum(t + b * BEAT, t < debat ? 0.3 : 0.22)
    if (t > debat) piano(t, ch[4] + 12, 0.06, 0.3)
  }
  // Le vote : drone grave, tic-tac lent, une note de piano qui revient.
  strings(vote, DURATION - vote - 0.5, [26, 38, 45, 50], 0.08, { attack: 1.2, cutoff: 800 })
  for (let t = vote + 0.4; t < DURATION - 1; t += 1) clockTick(t, 0.06, Math.round(t) % 2 === 0)
  for (let t = vote + 0.5; t < DURATION - 1.5; t += 2) piano(t, 74, 0.05, 0.2)
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

function score() {
  for (const sec of C.sections.slice(1)) {
    if (sec.cut === 'wipe') sweep(sec.t0 - 0.24, 0.5, { f0: 300, f1: 3500, gain: 0.18 })
    else flashHit(sec.t0)
  }
  for (const g of C.gavel) {
    gavel(g)
    gavel(g + 0.32, 0.45)
  }
  // L'accroche : le papier, la rue la nuit (sirène lointaine), le box.
  pop(W('01', 'adresse') - 0.15, 0.12)
  pop(W('01', 'ami') - 0.1, 0.1, 700, 250)
  // Nouvelle accroche : le feutre qui gratte, l'arraché, le GPS, l'impact.
  for (let k = 0; k < 22; k++) pop(0.02 + k * 0.05, 0.03, 2600 + (k % 3) * 300, 1800)
  sweep(W('01', 'ami') - 0.15, 0.4, { f0: 600, f1: 4000, gain: 0.2 })
  for (let k = 0; k < 3; k++) pop(SEC('soir').t0 + 0.2 + k * 0.4, 0.08, 1760, 1700)
  crash(W('02', 'agresse') - 0.05, 0.22)
  boom(W('03', 'sarah') - 0.1, 0.35, 80, 40, 0.5)
  const soir = SEC('soir')
  wind(soir.t0, soir.t1 - soir.t0 + 0.3, 0.05)
  stamp(W('02', 'agresse') - 0.1, 0.35)
  boom(W('02', 'agresse') - 0.1, 0.45, 70, 32, 0.8)
  siren(W('02', 'agresse'), soir.t1 - W('02', 'agresse') + 0.2, 0.025)
  pop(W('03', 'sarah') - 0.1, 0.14, 700, 220)
  // Les faits : les mois qui défilent, la voiture, l'appartement vide.
  const t0 = W('04', 'pendant') - 0.1
  const t1 = W('04', 'loyer')
  for (let k = 0; k < 11; k++) pop(t0 + (k / 11) * Math.max(0.3, t1 - t0), 0.05, 1100 + k * 40, 500)
  const nuit = SEC('voiture')
  wind(nuit.t0, nuit.t1 - nuit.t0 + 0.2, 0.04)
  pop(W('05', 'etrangle') - 0.15, 0.12)
  stamp(W('06', 'partie') - 0.1, 0.32)
  pop(W('06', 'dadresse') - 0.15, 0.12)
  // Le procès.
  pop(W('07', 'lenseignante') - 0.1, 0.12)
  stamp(W('09', 'autorisee') - 0.1, 0.3)
  pop(W('10', '15') - 0.1, 0.14, 700, 250)
  for (let k = 0; k < 3; k++) pop(S('13') - 0.05 + k * 0.09, 0.07, 1500, 1100)
  pop(W('13', 'colere') - 0.2, 0.12, 700, 220)
  pop(W('14', 'jamais') - 0.1, 0.12)
  pop(W('15', 'mere') - 0.15, 0.12, 700, 220)
  stamp(W('16', 'lhopital') - 0.1, 0.35)
  boom(W('16', 'lhopital') - 0.1, 0.4, 70, 34, 0.7)
  pop(W('17', 'choisi') - 0.1, 0.12)
  boom(S('18') + 0.05, 0.22, 90, 50, 0.4)
  boom(S('19') + 0.05, 0.25, 90, 50, 0.4)
  boom(S('20') + 0.05, 0.3, 90, 45, 0.5)
  // Le vote, puis l'abonnement.
  boom(W('21', 'danger') - 0.15, 0.25, 90, 45, 0.5)
  boom(W('21', 'trahie') - 0.15, 0.25, 90, 45, 0.5)
  boom(W('22', 'jure') - 0.15, 0.4, 60, 30, 1.2)
  boom(W('22', 'verdict') - 0.1, 0.3, 90, 45, 0.5)
  pop(S('23') - 0.05, 0.16, 1200, 600)
  pop(S('23') + 0.1, 0.12, 1600, 900)
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

// ===================================================================== voix

function voiceTrack() {
  for (const line of C.lines) {
    const { sr, x } = readWav(path.join(HERE, 'voice', `${line.id}.wav`))
    const y = sr === SR ? x : resample(x, sr, SR)
    const s0 = Math.round(line.start * SR)
    // Les avocats (voix Piper) sonnent « dans la salle » : un peu de réverbération.
    const room = line.who === 'narrateur' ? 0 : 0.22
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
