/**
 * ============================================================================
 *  Hooks prototypes « motion comic » (1080 × 1920) : le moteur commun.
 * ============================================================================
 *  Chaque hook (rodeo.js, prank.js, rer.js) décrit ses cases : un plan = une
 *  action, en gros plan, avec onomatopées, lignes de vitesse et ombres.
 *  Ce module construit la page, les sous-titres, le rembobinage final, et
 *  expose window.__promo.seek(t) pour render.mjs.
 */

import { clamp, ease, lerp, rng } from '../engine.js'
import { makePerson } from './personnage.js'

export const W = 1080
export const H = 1920
export const FPS = 30
const NS = 'http://www.w3.org/2000/svg'

export function svg(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.append(el)
  return el
}
const txt = (parent, s, attrs) => {
  const el = svg('text', { 'text-anchor': 'middle', 'font-family': 'Figtree Variable', 'font-weight': 900, ...attrs }, parent)
  el.textContent = s
  return el
}
const back = ease.back(1.8)
const popS = (t, t0, t1 = Infinity, dur = 0.4) => {
  const a = t < t0 ? 0 : back(clamp((t - t0) / dur))
  const b = t1 === Infinity ? 1 : 1 - ease.in3(clamp((t - t1) / 0.25))
  return Math.max(0, a * b)
}
const place = (el, x, y, s = 1, r = 0) => el.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${Math.max(0.001, s)})`)
const show = (el, on) => el.setAttribute('display', on ? 'inline' : 'none')

/** La main droite (côté +1) d'un personnage, en repère local, d'après les angles du bras. */
function handOf(sh, el, side = 1) {
  const a1 = Math.PI / 2 - side * sh
  const ex = side * 200 + Math.cos(a1) * 170
  const ey = 70 + Math.sin(a1) * 170
  const a2 = Math.PI / 2 - side * (sh + el)
  return [ex + Math.cos(a2) * 194, ey + Math.sin(a2) * 194, (a2 * 180) / Math.PI]
}
/** Les angles (épaule, coude) qui amènent la main au plus près d'un point (repère local). */
function reach(tx, ty, side = 1) {
  let best = [0, 0]
  let bd = Infinity
  for (let sh = -0.6; sh <= 3.2; sh += 0.05) {
    for (let el = -0.2; el <= 2.2; el += 0.05) {
      const [x, y] = handOf(sh, el, side)
      const d = (x - tx) ** 2 + (y - ty) ** 2
      if (d < bd) [bd, best] = [d, [sh, el]]
    }
  }
  return best
}

export async function start(hook) {
  const DATA = await (await fetch('data.json')).json()
  const stage = document.getElementById('stage')
  const ui = document.getElementById('ui')
  const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
  stage.insertBefore(root, ui)
  const defs = svg('defs', {}, root)
  const grad = (id, stops, attrs = {}) => {
    const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
    for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
  }
  grad('lensV', [[0.55, '#000', 0], [0.85, '#000', 0.5], [1, '#000', 0.9]], { cx: 0.5, cy: 0.5, r: 0.62 })
  grad('nightSky', [[0, '#05070f'], [0.6, '#101a33'], [1, '#2a2440']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('lampG', [[0, '#ffd28a', 0.85], [0.4, '#ffb050', 0.3], [1, '#ffb050', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
  grad('headl', [[0, '#ffffff', 1], [0.25, '#fff6d8', 0.75], [1, '#fff6d8', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
  grad('beamG', [[0, '#fff6d8', 0.7], [1, '#fff6d8', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('dashG', [[0, '#0f2a1e'], [1, '#04100a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('daySky', [[0, '#8fc4ef'], [1, '#e6f2f8']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('lawn', [[0, '#6aa24a'], [1, '#3a6a32']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('wagon', [[0, '#d6dde4'], [1, '#9aa6b4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  grad('asph', [[0, '#3a3c42'], [1, '#141518']], { x1: 0, y1: 0, x2: 0, y2: 1 })
  {
    const f = svg('filter', { id: 'sil', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs)
    svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 0 0.05  0 0 0 1 0' }, f)
    const p = svg('pattern', { id: 'dotsK', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
    svg('circle', { cx: 9, cy: 9, r: 3.4, fill: '#000000' }, p)
    const b = svg('filter', { id: 'blur6', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs)
    svg('feGaussianBlur', { stdDeviation: 6 }, b)
  }

  // -------------------------------------------------- outils « motion comic »
  function burst(parent, text, { fill = '#ffd166', ink = '#e5484d', size = 150, r = 300, points = 14 } = {}) {
    const g = svg('g', { opacity: 0 }, parent)
    let d = ''
    for (let k = 0; k < points * 2; k++) {
      const a = (k / (points * 2)) * Math.PI * 2
      const rr = k % 2 ? r * 0.62 : r * (0.92 + (0.16 * ((k * 7) % 3)) / 2)
      d += `${k ? 'L' : 'M'} ${(Math.cos(a) * rr * 1.3).toFixed(0)} ${(Math.sin(a) * rr).toFixed(0)} `
    }
    svg('path', { d: `${d}Z`, fill, stroke: '#10121a', 'stroke-width': 14, 'stroke-linejoin': 'round' }, g)
    txt(g, text, { y: size * 0.35, 'font-size': size, fill: ink, stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
    return g
  }
  function burstAt(el, t, t0, t1, x, y, rot = -8, s = 1) {
    const v = popS(t, t0, t1, 0.18)
    el.setAttribute('opacity', v > 0.01 ? 1 : 0)
    if (v > 0.01) el.setAttribute('transform', `translate(${x + 6 * Math.sin(t * 50)} ${y + 6 * Math.cos(t * 43)}) rotate(${rot + 3 * Math.sin(t * 30)}) scale(${(v * s).toFixed(3)})`)
  }
  function speedLines(parent, n = 46, color = '#ffffff') {
    const g = svg('g', { opacity: 1 }, parent)
    const r = rng(77)
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + r() * 0.1
      const w = 0.012 + r() * 0.02
      const r0 = 380 + r() * 260
      svg('path', { d: `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a - w) * 2000} ${Math.sin(a - w) * 2000} L ${Math.cos(a + w) * 2000} ${Math.sin(a + w) * 2000} Z`, fill: color }, g)
    }
    return g
  }
  /** Encadré de narration BD (jaune, texte noir). */
  function box(parent, text, x, y, w, size = 50) {
    const g = svg('g', {}, parent)
    svg('rect', { x, y, width: w, height: size * 1.9, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10 }, g)
    txt(g, text, { x: x + w / 2, y: y + size * 1.32, 'font-size': size, fill: '#10121a' })
    return g
  }
  const bg = (parent, fill) => svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill }, parent)
  /** La bouche d'un personnage : enveloppe de sa réplique. */
  const VOICE = Object.fromEntries(hook.VOICES.map((v) => [v.who, v]))
  function mouth(who, t) {
    const v = VOICE[who]
    if (!v) return 0
    const env = DATA[v.clip].env
    const i = (t - v.at) * 30
    if (i < 0 || i >= env.length - 1) return 0
    const a = env[Math.floor(i)]
    const b = env[Math.floor(i) + 1]
    return Math.min(1, (a + (b - a) * (i % 1)) * 1.1)
  }
  const kit = { svg, txt, defs, place, show, popS, clamp, ease, lerp, rng, makePerson, handOf, reach, burst, burstAt, speedLines, box, bg, mouth, W, H }

  // ---------------------------------------------------------------- les cases
  const N = svg('g', {}, root)
  let t0 = 0
  for (const s of hook.shots) {
    s.t0 = t0
    t0 = s.t1
    s.wrap = svg('g', { display: 'none' }, N)
    s.g = svg('g', {}, s.wrap)
    s.st = s.build(kit, s.g) ?? {}
  }
  // Le cadre de case : trame légère et bord noir épais.
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsK)', opacity: 0.1 }, root)
  svg('rect', { x: 14, y: 14, width: W - 28, height: H - 28, rx: 10, fill: 'none', stroke: '#10121a', 'stroke-width': 28 }, root)
  const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#ffffff', opacity: 0 }, root)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, root))
  const rwTxt = svg('g', { opacity: 0 }, root)
  svg('path', { d: 'M 0 -60 L -90 0 L 0 60 Z M 100 -60 L 10 0 L 100 60 Z', fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10, transform: 'translate(490 960)' }, rwTxt)

  // ------------------------------------------------------------ sous-titres
  const who = document.createElement('div')
  who.className = 'tag who'
  ui.append(who)
  const capsEl = document.createElement('div')
  capsEl.className = 'caps'
  ui.append(capsEl)
  const CHUNKS = []
  for (const v of hook.VOICES) {
    // Recolle les morceaux que Whisper sépare (« d » + « 'enlever », « Lâche » + « -le » + « ! »).
    const words = []
    for (const w of DATA[v.clip].words) {
      const prev = words.at(-1)
      if (prev && (/^['’-]/.test(w.w) || /^[!?:;…]+$/.test(w.w) || /^[a-z]$/i.test(prev.w))) prev.w += /^[!?:;]$/.test(w.w) ? ` ${w.w}` : w.w
      else words.push({ w: w.w, t: v.at + w.t })
    }
    const end = v.at + DATA[v.clip].dur
    const mine = []
    let cur = null
    words.forEach((w, i) => {
      if (!cur || cur.words.length >= 3 || /[,.:;?!…]$/.test(words[i - 1]?.w ?? '')) mine.push((cur = { words: [], who: v.who, label: v.label }))
      cur.words.push(w)
    })
    mine.forEach((c, i) => {
      c.t0 = c.words[0].t - 0.06
      c.t1 = i < mine.length - 1 ? mine[i + 1].words[0].t - 0.06 : end + 0.15
    })
    CHUNKS.push(...mine)
  }
  // Quand une autre voix coupe la parole, l'ancien sous-titre s'efface.
  CHUNKS.sort((x, y) => x.t0 - y.t0)
  CHUNKS.forEach((c, i) => {
    if (CHUNKS[i + 1]) c.t1 = Math.min(c.t1, CHUNKS[i + 1].t0)
  })
  for (const c of CHUNKS) {
    c.el = document.createElement('div')
    c.el.className = 'line'
    c.words.forEach((w, i) => {
      w.el = document.createElement('span')
      w.el.className = 'w'
      w.el.textContent = w.w
      w.next = c.words[i + 1]?.t ?? c.t1
      c.el.append(w.el)
    })
    capsEl.append(c.el)
  }
  function updateCaptions(t) {
    let label = null
    for (const c of CHUNKS) {
      const on = t >= c.t0 && t < c.t1
      c.el.style.display = on ? '' : 'none'
      if (!on) continue
      label = c
      const enter = ease.back(2)(clamp((t - c.t0) / 0.18))
      c.el.style.transform = `translateY(${((1 - enter) * 40).toFixed(1)}px) scale(${(0.85 + 0.15 * enter).toFixed(3)})`
      for (const w of c.words) {
        const s = t < w.t - 0.05 ? 0 : ease.back(3)(clamp((t - (w.t - 0.05)) / 0.16))
        w.el.style.opacity = s > 0 ? '1' : '0'
        w.el.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)}) rotate(${((1 - s) * -6).toFixed(1)}deg)`
        w.el.classList.toggle('on', t >= w.t - 0.05 && t < w.next - 0.05)
      }
    }
    who.style.visibility = label ? '' : 'hidden'
    if (label) {
      who.textContent = label.label
      who.className = `tag who ${label.who}`
      who.style.transform = 'translate(540px, 1330px) translate(-50%, -50%)'
    }
  }

  // ------------------------------------------------------------------ grain
  const grainC = document.createElement('canvas')
  grainC.width = 270
  grainC.height = 480
  grainC.className = 'grain'
  stage.append(grainC)
  const gctx = grainC.getContext('2d')
  const gimg = gctx.createImageData(270, 480)
  function updateGrain(t) {
    const r = rng(Math.floor(t * FPS) + 3)
    for (let i = 0; i < gimg.data.length; i += 4) {
      const v = r() * 255
      gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v
      gimg.data[i + 3] = 20
    }
    gctx.putImageData(gimg, 0, 0)
  }

  // ------------------------------------------------------------- l'instant t
  function shakeAt(t) {
    let x = 0
    let y = 0
    for (const [s0, a] of hook.SHAKES ?? []) {
      if (t < s0 || t > s0 + 0.6) continue
      const k = a * Math.exp(-(t - s0) * 8)
      x += k * Math.sin((t - s0) * 70)
      y += k * Math.sin((t - s0) * 53 + 1)
    }
    return [x, y]
  }
  function seek(t) {
    t = clamp(t, 0, hook.DUR - 1e-6)
    const cur = hook.shots.find((s) => t < s.t1) ?? hook.shots.at(-1)
    for (const s of hook.shots) show(s.wrap, s === cur)
    const k = t - cur.t0
    const cut = Math.exp(-k * 18)
    const [hx, hy] = shakeAt(t)
    const z = 1 + 0.08 * cut
    cur.wrap.setAttribute('transform', `translate(${540 + hx + 14 * cut * Math.sin(t * 90)} ${960 + hy}) scale(${z}) translate(-540 -960)`)
    cur.draw(kit, cur.st, t, k)
    const fl = Math.max(0, ...(hook.FLASHES ?? []).map((f) => (t >= f ? Math.exp(-(t - f) * 9) : 0)))
    flash.setAttribute('opacity', (0.85 * fl).toFixed(3))
    const rw = t >= hook.REWIND
    rwBands.forEach((b, i) => {
      const r = rng(Math.floor(t * 30) + i)
      b.setAttribute('y', r() * H)
      b.setAttribute('height', 10 + r() * 40)
      b.setAttribute('opacity', rw ? 0.3 : 0)
    })
    rwTxt.setAttribute('opacity', rw ? 1 : 0)
    N.setAttribute('filter', rw ? 'url(#blur6)' : '')
    if (!rw) N.removeAttribute('filter')
    updateCaptions(t)
    updateGrain(t)
  }
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
  window.__promo = { ready: Promise.resolve(), seek, duration: hook.DUR, fps: FPS }
}
