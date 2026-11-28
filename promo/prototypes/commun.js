/**
 * ============================================================================
 *  Prototypes de style : socle commun
 * ============================================================================
 *  Chaque prototype rejoue le même passage de l'affaire n°5 (60,05 → 65,25 s :
 *  « Cette femme a fini à l'hôpital. » / « Parce que cet homme a choisi de la
 *  frapper. »), avec les voix ElevenLabs. Ce module fournit :
 *    - les instants des mots (timeline.json de l'affaire n°5) ;
 *    - l'ouverture de la bouche de chaque personnage (levres.json) ;
 *    - les sous-titres mot à mot (HTML) ;
 *    - le branchement sur render.mjs (window.__promo).
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'

export { clamp, ease, lerp, prog, rng }
export const W = 1080
export const H = 1920
export const FPS = 30
export const WINDOW = [60.05, 65.25]

const timeline = await (await fetch('../../affaire-05/timeline.json')).json()
const LIP = await (await fetch('../../demo-v2/levres.json')).json()
export const LINES = timeline.lines

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
export const line = (id) => LINES.find((l) => l.id.startsWith(id))
export const S = (id) => line(id).start
export const E = (id) => line(id).start + line(id).dur
export function Wd(id, word, n = 0) {
  const f = line(id).words.filter((w) => norm(w.w).startsWith(norm(word)))
  return f[n].t
}
/** Les instants qui rythment l'extrait. */
export const T = {
  cette: Wd('16', 'cette'),
  fini: Wd('16', 'fini'),
  hopital: Wd('16', 'lhopital'),
  parce: Wd('17', 'parce'),
  homme: Wd('17', 'homme'),
  choisi: Wd('17', 'choisi'),
  frapper: Wd('17', 'frapper'),
  sarah: Wd('17', 'sarah'),
}

/** Ouverture de la bouche (0 → 1) de `who` à l'instant t. */
export function mouthOf(who, t) {
  const l = LINES.find((x) => x.who === who && t >= x.start && t < x.start + x.dur + 0.1)
  if (!l) return 0
  const env = LIP[l.id] ?? []
  const i = (t - l.start) * 60
  const a = env[Math.floor(i)] ?? 0
  const b = env[Math.floor(i) + 1] ?? 0
  return a + (b - a) * (i % 1)
}
export const speaking = (who, t) => LINES.some((l) => l.who === who && t >= l.start && t < l.start + l.dur)

/** Sous-titres mot à mot, par groupes de 4 mots au plus. `style` : classe CSS du conteneur. */
export function makeCaptions(parent, { y = 1380, className = 'caps' } = {}) {
  const box = document.createElement('div')
  box.className = className
  box.style.top = `${y}px`
  parent.append(box)
  const chunks = []
  for (const l of LINES.filter((x) => x.start < WINDOW[1] + 1 && x.start + x.dur > WINDOW[0] - 1)) {
    let cur = null
    l.words.forEach((w, i) => {
      if (!cur || cur.words.length >= 4 || /[,.:;?!…»]$/.test(l.words[i - 1]?.w ?? '')) chunks.push((cur = { words: [] }))
      cur.words.push(w)
    })
    const own = chunks.filter((c) => !c.done)
    own.forEach((c, i) => {
      c.t0 = c.words[0].t - 0.05
      c.t1 = i < own.length - 1 ? own[i + 1].words[0].t - 0.05 : l.start + l.dur + 0.15
      c.done = true
    })
  }
  for (const c of chunks) {
    c.el = document.createElement('div')
    c.el.className = 'line'
    for (const w of c.words) {
      w.el = document.createElement('span')
      w.el.textContent = w.w
      c.el.append(w.el)
    }
    box.append(c.el)
  }
  return (t) => {
    for (const c of chunks) {
      const on = t >= c.t0 && t < c.t1
      c.el.style.display = on ? '' : 'none'
      if (!on) continue
      c.words.forEach((w, i) => {
        const next = c.words[i + 1]?.t ?? c.t1
        const s = t < w.t - 0.04 ? 0 : ease.back(2.2)(prog(t, w.t - 0.04, 0.16))
        w.el.style.opacity = s > 0 ? '1' : '0'
        w.el.style.transform = `scale(${(0.6 + 0.4 * s).toFixed(3)})`
        w.el.classList.toggle('on', t >= w.t - 0.04 && t < next - 0.04)
      })
    }
  }
}

/** Secousses amorties : [[t0, amplitude en px], ...]. */
export function shaker(impacts) {
  return (t) => {
    let x = 0,
      y = 0,
      r = 0
    for (const [t0, a] of impacts) {
      if (t < t0 || t > t0 + 0.7) continue
      const k = a * Math.exp(-(t - t0) * 8)
      x += k * Math.sin((t - t0) * 70)
      y += k * Math.sin((t - t0) * 53 + 1)
      r += k * 0.02 * Math.sin((t - t0) * 61 + 2)
    }
    return [x, y, r]
  }
}

/** Grain de pellicule reproductible, dessiné sur un petit canvas étiré. */
export function makeGrain(parent, { alpha = 20, blend = 'overlay' } = {}) {
  const c = document.createElement('canvas')
  c.width = 270
  c.height = 480
  Object.assign(c.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', mixBlendMode: blend, pointerEvents: 'none', imageRendering: 'pixelated' })
  parent.append(c)
  const g = c.getContext('2d')
  const img = g.createImageData(270, 480)
  return (t) => {
    const r = rng(Math.floor(t * FPS) + 11)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = alpha
    }
    g.putImageData(img, 0, 0)
  }
}

/** Branche le prototype sur render.mjs. `seek(t)` dessine l'image de l'instant t. */
export function register(seek, ready = Promise.resolve()) {
  const done = (async () => {
    await ready
    await document.fonts.ready
    seek(WINDOW[0])
  })()
  window.__promo = { ready: done, seek, duration: timeline.duration, fps: FPS }
  if (!new URLSearchParams(location.search).has('render')) {
    done.then(() => {
      let t0 = performance.now()
      const loop = () => {
        const t = WINDOW[0] + (((performance.now() - t0) / 1000) % (WINDOW[1] - WINDOW[0]))
        seek(t)
        requestAnimationFrame(loop)
      }
      loop()
    })
  }
}

/** Petit utilitaire SVG. */
export const NS = 'http://www.w3.org/2000/svg'
export function svg(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.append(el)
  return el
}
