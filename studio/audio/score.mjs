/**
 * Bande son d'un épisode, générée automatiquement à partir de sa timeline :
 *  - bruitages automatiques : pas, décollages, atterrissages (repérés en analysant les
 *    mouvements), effets visuels (éclaboussures, étincelles…), transitions, pluie ;
 *  - bruitages explicites : { t, do: 'sfx', name, gain, pan } dans la timeline ;
 *  - ambiance du décor (oiseaux le jour, grillons la nuit) ;
 *  - musique : sections { t0, t1, style, bpm, key, minor } de l'épisode.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { SR, limit, mtof, reverb, writeWav } from '../../promo/dsp.mjs'
import { analyze, compile, evaluate } from '../engine/timeline.js'
import * as S from './synth.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const studio = path.resolve(here, '..')

class Mix {
  constructor(dur) {
    this.N = Math.ceil(dur * SR)
    const bus = () => [new Float32Array(this.N), new Float32Array(this.N)]
    this.music = bus()
    this.sfx = bus()
    this.amb = bus()
  }
  add(bus, sig, t, gain = 1, pan = 0) {
    const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4
    const gl = Math.SQRT2 * Math.cos(a) * gain
    const gr = Math.SQRT2 * Math.sin(a) * gain
    const s0 = Math.round(t * SR)
    for (let i = 0; i < sig.length; i++) {
      const j = s0 + i
      if (j < 0) continue
      if (j >= this.N) break
      bus[0][j] += sig[i] * gl
      bus[1][j] += sig[i] * gr
    }
  }
}

const panOf = (x) => Math.max(-0.8, Math.min(0.8, (x - 540) / 540))

// ------------------------------------------------------------------ musique

const CHORDS_MAJ = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]] // I V vi IV
const CHORDS_MIN = [[0, 3, 7], [5, 8, 12], [7, 10, 14], [3, 7, 10]] // i iv v III

function music(M, sec, endCut) {
  const bpm = sec.bpm ?? 110
  const beat = 60 / bpm
  const key = sec.key ?? 65
  const chords = sec.minor ? CHORDS_MIN : CHORDS_MAJ
  const bars = Math.floor((sec.t1 - sec.t0) / (beat * 4) + 0.999)
  S.reseed(Math.round(sec.t0 * 100) + 3)
  const end = Math.min(sec.t1, endCut)
  const put = (sig, t, g, pan = 0) => t < end && M.add(M.music, fade(sig, end - t), t, g, pan)
  for (let bar = 0; bar < bars; bar++) {
    const ch = chords[bar % 4]
    const t0 = sec.t0 + bar * 4 * beat
    const root = key - 24 + ch[0]
    switch (sec.style) {
      case 'uke': {
        put(S.bass(mtof(root), beat * 2), t0, 0.35)
        put(S.bass(mtof(root + 7), beat * 2), t0 + 2 * beat, 0.25)
        const strum = [0, 1, 1.5, 2.5, 3]
        for (const b of strum) for (const [k, n] of ch.entries()) put(S.pluck(mtof(key + n), 0.9, 0.995), t0 + b * beat + k * 0.012, b % 1 ? 0.12 : 0.17, 0.2)
        if (bar % 2 === 1) put(S.bell(mtof(key + 12 + ch[2]), 1.0, 0.4), t0 + 3.5 * beat, 0.08)
        break
      }
      case 'pizz': {
        put(S.bass(mtof(root), beat), t0, 0.35)
        put(S.bass(mtof(root), beat), t0 + 2 * beat, 0.3)
        for (let k = 0; k < 8; k++) {
          const n = key + ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + (k % 4 === 3 ? 12 : 0)
          put(S.pluck(mtof(n), 0.3, 0.985, 0.6), t0 + (k * beat) / 2, 0.16, k % 2 ? -0.3 : 0.3)
        }
        put(S.shaker(), t0 + beat, 0.1)
        put(S.shaker(), t0 + 3 * beat, 0.1)
        break
      }
      case 'party': {
        for (let b = 0; b < 4; b++) {
          put(S.kick(), t0 + b * beat, 0.32)
          put(S.shaker(), t0 + (b + 0.5) * beat, 0.12)
        }
        put(S.clap(), t0 + beat, 0.22)
        put(S.clap(), t0 + 3 * beat, 0.22)
        put(S.bass(mtof(root), beat), t0, 0.35)
        put(S.bass(mtof(root + 12), beat / 2), t0 + 1.5 * beat, 0.25)
        put(S.bass(mtof(root), beat), t0 + 2 * beat, 0.35)
        for (let k = 0; k < 8; k++) put(S.marimba(mtof(key + ch[k % 3] + (k >= 4 ? 12 : 0))), t0 + (k * beat) / 2, 0.12, k % 2 ? -0.35 : 0.35)
        const mel = [12, 14, 16, 19]
        put(S.bell(mtof(key + 12 + mel[(bar + 1) % 4] - (bar % 2 ? 0 : 3) + ch[0] % 2), 1.0, 0.4), t0 + 0.5 * beat, 0.07)
        put(S.bell(mtof(key + 12 + ch[2]), 1.0, 0.4), t0 + 2.5 * beat, 0.07)
        break
      }
      case 'lullaby': {
        put(S.pad(ch.map((n) => mtof(key - 12 + n)), beat * 4.2), t0, 0.12)
        const arp = [0, 1, 2, 1, 2, 1]
        for (let k = 0; k < 6; k++) put(S.bell(mtof(key + 12 + ch[arp[k]]), 1.4, 0.3), t0 + k * ((beat * 4) / 6), 0.07, 0.15)
        break
      }
    }
  }
}

/** Fondu de 15 ms si le son dépasse la fin de la section (coupe nette sans clic). */
function fade(sig, room) {
  const n = Math.round(room * SR)
  if (n >= sig.length) return sig
  const out = sig.slice(0, Math.max(0, n))
  const f = Math.min(out.length, Math.round(0.015 * SR))
  for (let i = 0; i < f; i++) out[out.length - 1 - i] *= i / f
  return out
}

// ------------------------------------------------------------------ bruitages

const FX_SOUND = {
  splash: (e) => [S.splash(e.scale ?? 1), 0.55 * Math.min(1.4, e.scale ?? 1)],
  drops: () => [concat([S.drop(), 0.07, S.drop(), 0.11, S.drop()]), 0.25],
  sparkle: () => [S.sparkle(), 0.22],
  stars: () => [S.sparkle(), 0.15],
  hearts: () => [S.harpUp(6), 0.3],
  dust: () => [S.puff(), 0.35],
  confetti: () => [concat([S.pop(700), 0.05, S.pop(900), 0.06, S.pop(1100)]), 0.3],
  sweat: () => [S.drop(), 0.2],
  leaves: () => [S.swoosh(0.6, 2000, 7000), 0.08],
}
const NAMED = {
  tok: () => S.tok(), pop: () => S.pop(), boing: () => S.boing(), boingHigh: () => S.boing(470), swoosh: () => S.swoosh(),
  giggle: () => S.giggle(), giggleLow: () => S.giggle(4, 600), bloop: () => S.bloop(), ding: () => S.bell(1568, 1.6),
  sparkle: () => S.sparkle(), harp: () => S.harpUp(6), splash: () => S.splash(1), tick: () => S.tick(), drop: () => S.drop(),
}

function concat(parts) {
  const chunks = []
  let len = 0
  for (const p of parts) {
    if (typeof p === 'number') {
      const z = new Float32Array(Math.round(p * SR))
      chunks.push(z)
      len += z.length
    } else {
      chunks.push(p)
      len += p.length
    }
  }
  const out = new Float32Array(len)
  let o = 0
  for (const c of chunks) {
    out.set(c, o)
    o += c.length
  }
  return out
}

/** Pluie (générale ou sous un nuage) : bruit filtré dont l'intensité suit l'animation. */
function rainBus(M, C) {
  const rate = 50
  const k = new Float32Array(Math.ceil(C.duration * rate) + 2)
  for (let i = 0; i < k.length; i++) {
    const st = evaluate(C, i / rate)
    let v = st.env.rain ?? 0
    for (const a of st.actors) if (a.type === 'cloud') v = Math.max(v, (a.props.rain ?? 0) * 0.7)
    k[i] = v
  }
  if (!k.some((v) => v > 0.01)) return
  const lp = [0, 0]
  const hp = [0, 0]
  for (let j = 0; j < M.N; j++) {
    const f = (j / SR) * rate
    const i = Math.floor(f)
    const v = (k[i] ?? 0) + ((k[i + 1] ?? 0) - (k[i] ?? 0)) * (f - i)
    if (v < 0.005) continue
    for (let c = 0; c < 2; c++) {
      const n = S.rand() * 2 - 1
      lp[c] += 0.25 * (n - lp[c])
      hp[c] = lp[c] - hp[c] * 0.0
      let s = lp[c] * 0.35
      if (S.rand() < 0.004 * v) s += (S.rand() * 2 - 1) * 0.8 // gouttes plus franches
      M.amb[c][j] += s * v * 0.5
    }
  }
}

// ------------------------------------------------------------------ assemblage

export async function buildAudio(ep) {
  const C = compile(ep)
  const M = new Mix(ep.duration)
  // musique
  for (const sec of ep.music ?? []) music(M, sec, ep.duration)
  // pas, sauts
  for (const c of analyze(C)) {
    const pan = panOf(c.x)
    if (c.kind === 'step') M.add(M.sfx, S.step(c), c.t, c.run ? 0.32 : c.soft ? 0.15 : 0.24, pan)
    if (c.kind === 'takeoff') M.add(M.sfx, S.takeoff(), c.t - 0.05, 0.18, pan)
    if (c.kind === 'land') M.add(M.sfx, S.land(c.h ?? 100), c.t, 0.4, pan)
  }
  // effets visuels, transitions, bruitages explicites
  for (const e of ep.track ?? []) {
    if (e.do === 'fx' && FX_SOUND[e.type]) {
      const [sig, g] = FX_SOUND[e.type](e)
      M.add(M.sfx, sig, e.t, g * (e.gain ?? 1), panOf(e.x ?? 540))
    }
    if (e.do === 'transition' && (e.type === 'irisOut' || e.type === 'iris')) M.add(M.sfx, S.bloop(), e.t + (e.dur ?? 0.6) * 0.6, 0.2)
    if (e.do === 'transition' && e.type === 'wipe') M.add(M.sfx, S.swoosh(0.5), e.t, 0.25)
    if (e.do === 'sfx') {
      const make = NAMED[e.name]
      if (!make) throw new Error(`Bruitage inconnu : ${e.name} (connus : ${Object.keys(NAMED).join(', ')})`)
      M.add(M.sfx, make(), e.t, e.gain ?? 0.4, e.pan ?? 0)
    }
    if (e.do === 'shake') M.add(M.sfx, S.land(80), e.t, 0.15 * ((e.amp ?? 14) / 14))
  }
  // ambiance
  for (const amb of ep.ambience ?? []) {
    S.reseed(77)
    if (amb.type === 'garden') {
      for (let t = amb.t0 + 0.3; t < amb.t1; t += 1.2 + S.rand() * 2.4) {
        const st = evaluate(C, t)
        const day = Math.max(0, 1 - (st.env.time ?? 0))
        if (day > 0.2 && (st.env.rain ?? 0) < 0.5) {
          const f = 2800 + S.rand() * 1100
          M.add(M.amb, S.bird(f), t, 0.05 * day, S.rand() * 1.6 - 0.8)
          M.add(M.amb, S.bird(f * 1.05), t + 0.18, 0.04 * day, S.rand() * 1.6 - 0.8)
        }
        if ((st.env.time ?? 0) > 1.3) M.add(M.amb, S.cricket(1.5), t, 0.03, S.rand() - 0.5)
      }
    }
  }
  rainBus(M, C)

  // mixage : réverbération sur la musique et un peu sur les bruitages
  const [rl, rr] = reverb(M.music, { room: 0.8, damp: 0.35 })
  const [sl, sr] = reverb(M.sfx, { room: 0.6, damp: 0.5 })
  const L = new Float32Array(M.N)
  const R = new Float32Array(M.N)
  for (let j = 0; j < M.N; j++) {
    L[j] = M.music[0][j] * 0.8 + rl[j] * 0.22 + M.sfx[0][j] + sl[j] * 0.08 + M.amb[0][j]
    R[j] = M.music[1][j] * 0.8 + rr[j] * 0.22 + M.sfx[1][j] + sr[j] * 0.08 + M.amb[1][j]
  }
  let peak = 0
  for (let j = 0; j < M.N; j++) peak = Math.max(peak, Math.abs(L[j]), Math.abs(R[j]))
  const g = 0.7 / (peak || 1)
  for (let j = 0; j < M.N; j++) {
    L[j] *= g
    R[j] *= g
  }
  limit(L, R, 0.89)
  return { L, R }
}

/** Écrit la bande son de l'épisode dans build/<id>/audio.wav (avec cache si demandé). */
export async function renderEpisodeAudio(id, { cache = false } = {}) {
  const file = path.join(studio, 'episodes', `${id}.js`)
  const out = path.join(studio, 'build', id, 'audio.wav')
  const deps = [file, path.join(here, 'score.mjs'), path.join(here, 'synth.mjs')]
  if (cache && fs.existsSync(out) && deps.every((d) => fs.statSync(d).mtimeMs < fs.statSync(out).mtimeMs)) return out
  const ep = (await import(pathToFileURL(file).href + `?v=${fs.statSync(file).mtimeMs}`)).default
  const { L, R } = await buildAudio(ep)
  S.reseed(99)
  writeWav(out, L, R, S.rand)
  return out
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log(await renderEpisodeAudio(process.argv[2]))
}
