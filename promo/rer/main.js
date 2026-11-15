/**
 * ============================================================================
 *  « Affaire Classée ? » — Le RER (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : le téléphone d'un passager dans
 *  un TER de nuit. Le contrôleur fait descendre Manon, 15 ans, en larmes ; les
 *  portes se ferment ; le train repart et elle rétrécit, seule sur le quai sous
 *  un lampadaire. Le narrateur explique pendant le replay (la gare déserte, le
 *  téléphone mort, le contrôleur), puis la départementale, les phares, le noir,
 *  l'hôpital. Le marteau tombe.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT as H, WIDTH as W, makeCues } from './cues.js'
import { makePerson } from './personnage.js'

const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W: Wd } = C
const K = C.hook
const SEC = Object.fromEntries(C.sections.map((s) => [s.id, s]))
const LIP = await (await fetch('levres.json')).json().catch(() => ({}))
function mouthOf(who, t) {
  const l = C.lines.find((x) => x.who === who && t >= x.start && t < x.start + x.dur + 0.1)
  if (!l) return 0
  const env = LIP[l.id] ?? []
  const i = (t - l.start) * 60
  const a = env[Math.floor(i)] ?? 0
  const b = env[Math.floor(i) + 1] ?? 0
  return a + (b - a) * (i % 1)
}
const speaking = (who, t) => C.lines.some((l) => l.who === who && t >= l.start && t < l.start + l.dur)

// ------------------------------------------------------------------ outils

const NS = 'http://www.w3.org/2000/svg'
function svg(tag, attrs = {}, parent = null) {
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
const win = (t, a, b, fade = 0.16) => ease.io2(clamp((t - a) / fade)) * (1 - ease.io2(clamp((t - b) / fade)))

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('glowRed', [[0, '#ff2a3d', 0.85], [1, '#ff2a3d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowBlue', [[0, '#3d7bff', 0.9], [1, '#3d7bff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('court', [[0, '#27305a'], [1, '#121733']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtRed', [[0, '#5a1f1a'], [1, '#1e0b08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtDark', [[0, '#141a33'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spot', [[0, '#bcd2ff', 0.38], [1, '#bcd2ff', 0]], { cx: 0.5, cy: 0.35, r: 0.55 })
grad('beam', [[0, '#ffe7b0', 0.45], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.6]], { cx: 0.5, cy: 0.45, r: 0.75 })
grad('pauseBg', [[0, '#0a2a14'], [1, '#10121a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitL', [[0, '#1f2d55'], [1, '#060a18']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#5a1a3a'], [1, '#18040e']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('skyAm', [[0, '#6f8aa6'], [0.55, '#d9a888'], [1, '#f4cfa2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('asph', [[0, '#6a6c72'], [1, '#2a2c31']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('dash', [[0, '#24262c'], [1, '#0d0e11']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sunG', [[0, '#fff3cf', 0.95], [0.4, '#ffd59a', 0.5], [1, '#ffb070', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glare', [[0, '#ffffff', 0], [0.5, '#ffffff', 0.09], [1, '#ffffff', 0]], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('ambuWall', [[0, '#e9eef4'], [1, '#b9c4d2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('mugBg', [[0, '#2c3140'], [1, '#12141c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('ecgBg', [[0, '#04120a', 0.82], [1, '#000000', 0.92]], { x1: 0, y1: 0, x2: 0, y2: 1 })
{
  const p = svg('pattern', { id: 'dots', width: 22, height: 22, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
  svg('circle', { cx: 11, cy: 11, r: 4, fill: '#ffffff' }, p)
  const g = svg('pattern', { id: 'grid', width: 60, height: 60, patternUnits: 'userSpaceOnUse' }, defs)
  svg('path', { d: 'M 60 0 L 0 0 0 60', fill: 'none', stroke: '#1fbf5a', 'stroke-width': 2, opacity: 0.25 }, g)
  const f = svg('filter', { id: 'desat', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs)
  svg('feColorMatrix', { type: 'saturate', values: '0.12' }, f)
}

const scenes = []
function scene(id, build) {
  const sec = SEC[id]
  const g = svg('g', {}, root)
  const L = { far: svg('g', {}, g), mid: svg('g', {}, g), actor: svg('g', {}, g), front: svg('g', {}, g), fx: svg('g', {}, g), hud: svg('g', {}, g) }
  const s = { ...sec, g, L, ...build(L, sec) }
  scenes.push(s)
  return s
}
const bg = (L, fill) => svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill }, L.far)
const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)
const heartD = 'M 0 30 C -36 6 -60 -14 -48 -38 C -38 -58 -12 -56 0 -36 C 12 -56 38 -58 48 -38 C 60 -14 36 6 0 30 Z'

// Des fissures qui partent d'un point.
function cracks(parent, cx, cy, scale, seed, color = '#2a2a2a') {
  const g = svg('g', { transform: `translate(${cx} ${cy}) scale(${scale})` }, parent)
  const rc = rng(seed)
  for (let k = 0; k < 13; k++) {
    let x = 0
    let y = 0
    let d = 'M 0 0'
    const a0 = (k / 13) * Math.PI * 2 + rc() * 0.4
    for (let s = 0; s < 6; s++) {
      const a = a0 + (rc() - 0.5) * 0.7
      x += Math.cos(a) * (40 + rc() * 90)
      y += Math.sin(a) * (40 + rc() * 90)
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`
    }
    svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 4 / scale + 3, 'stroke-linejoin': 'round', 'stroke-dasharray': 900, 'stroke-dashoffset': 900 }, g)
  }
  return g
}
grad('trainIn', [[0, '#2a3440'], [1, '#141a22']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('seatG', [[0, '#2f6fa0'], [1, '#1d4a70']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('neon', [[0, '#eaf6ff', 0.9], [1, '#eaf6ff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('nightF', [[0, '#05070f'], [0.6, '#0c1220'], [1, '#141a28']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lampG', [[0, '#ffd28a', 0.85], [0.4, '#ffb050', 0.3], [1, '#ffb050', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('headl', [[0, '#ffffff', 1], [0.3, '#fff6d8', 0.6], [1, '#fff6d8', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('hospWall', [[0, '#e8f3ef'], [1, '#bcd6cc']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('judgeBg', [[0, '#1a1e30'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })

// Les personnages. Les avocats en costume ; le contrôleur (casquette SNCF) ; Manon, 15 ans.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const AGENT = { robe: '#1f2d55', jabot: false, collar: '#ffffff', hair: 'short', hairColor: '#6a6a6a', skin: '#e2b08a', iris: '#2b1d12' }
const MANON = { robe: '#ff7aa8', jabot: false, collar: '#ffd0e0', hair: 'bob', hairColor: '#3a2414', skin: '#f6d0b0', iris: '#3a5a2a', female: true }
// La casquette du contrôleur.
function kepi(p) {
  const g = svg('g', {}, p.head)
  svg('path', { d: 'M -170 -220 C -170 -340 170 -340 170 -220 Z', fill: '#1f2d55' }, g)
  svg('rect', { x: -172, y: -238, width: 344, height: 30, fill: '#c8322a' }, g)
  svg('path', { d: 'M -180 -212 C -60 -240 60 -240 180 -212 L 196 -186 C 60 -214 -60 -214 -196 -186 Z', fill: '#10182e' }, g)
  svg('circle', { cy: -276, r: 20, fill: '#d9a930' }, g)
  return g
}
const agent = (parent) => {
  const p = makePerson(parent, AGENT)
  kepi(p)
  const badge = svg('rect', { x: 60, y: 60, width: 70, height: 46, rx: 8, fill: '#ffffff', stroke: '#c8322a', 'stroke-width': 5 }, p.root.firstChild)
  void badge
  return p
}
// Un téléphone dont la batterie est vide.
function phoneDead(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -90, y: -170, width: 180, height: 340, rx: 26, fill: '#111' }, g)
  svg('rect', { x: -78, y: -156, width: 156, height: 312, rx: 16, fill: '#1a1d24' }, g)
  svg('rect', { x: -40, y: -30, width: 70, height: 36, rx: 6, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 6 }, g)
  svg('rect', { x: 32, y: -20, width: 8, height: 16, fill: '#ff3b3b' }, g)
  svg('rect', { x: -34, y: -24, width: 6, height: 24, fill: '#ff3b3b' }, g)
  txt(g, '1 %', { y: 60, 'font-size': 40, fill: '#ff3b3b' })
  return g
}

// ------------------------------------------------- Outils « motion comic » (cases de BD, onomatopées, ombres)
{
  const f = svg('filter', { id: 'sil', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 0 0.05  0 0 0 1 0' }, f)
  const p = svg('pattern', { id: 'dotsK', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
  svg('circle', { cx: 9, cy: 9, r: 3.4, fill: '#000000' }, p)
}
// Une onomatopée dans une explosion de BD.
function burst(parent, text, { fill = '#ffd166', ink = '#e5484d', size = 150, r = 300, points = 14 } = {}) {
  const g = svg('g', { opacity: 0 }, parent)
  let d = ''
  for (let k = 0; k < points * 2; k++) {
    const a = (k / (points * 2)) * Math.PI * 2
    const rr = k % 2 ? r * 0.62 : r * (0.92 + 0.16 * ((k * 7) % 3) / 2)
    d += `${k ? 'L' : 'M'} ${(Math.cos(a) * rr * 1.3).toFixed(0)} ${(Math.sin(a) * rr).toFixed(0)} `
  }
  svg('path', { d: `${d}Z`, fill, stroke: '#10121a', 'stroke-width': 14, 'stroke-linejoin': 'round' }, g)
  txt(g, text, { y: size * 0.35, 'font-size': size, fill: ink, stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
  return g
}
// Animation d'une onomatopée : surgit, tremble, disparaît.
function burstAt(el, t, t0, t1, x, y, rot = -8, s = 1) {
  const v = popS(t, t0, t1, 0.18)
  el.setAttribute('opacity', v > 0.01 ? 1 : 0)
  if (v > 0.01) el.setAttribute('transform', `translate(${x + 6 * Math.sin(t * 50)} ${y + 6 * Math.cos(t * 43)}) rotate(${rot + 3 * Math.sin(t * 30)}) scale(${(v * s).toFixed(3)})`)
}
// Lignes de vitesse (rayons depuis le centre).
function speedLines(parent, n = 46, color = '#ffffff') {
  const g = svg('g', { opacity: 0 }, parent)
  const r = rng(77)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + r() * 0.1
    const w = 0.012 + r() * 0.02
    const r0 = 380 + r() * 260
    svg('path', { d: `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a - w) * 2000} ${Math.sin(a - w) * 2000} L ${Math.cos(a + w) * 2000} ${Math.sin(a + w) * 2000} Z`, fill: color }, g)
  }
  return g
}
// Le cadre de la case de BD (bord noir épais, trame aux angles).
function comicFrame(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsK)', opacity: 0.12 }, g)
  svg('rect', { x: 14, y: 14, width: W - 28, height: H - 28, rx: 10, fill: 'none', stroke: '#10121a', 'stroke-width': 28 }, g)
  return g
}
// La main droite d'un personnage (repère local), d'après les angles du bras.
function handOf(sh, el, side = 1) {
  const sx = side * 200
  const sy = 70
  const a1 = Math.PI / 2 - side * sh
  const ex = sx + Math.cos(a1) * 170
  const ey = sy + Math.sin(a1) * 170
  const a2 = Math.PI / 2 - side * (sh + el)
  return [ex + Math.cos(a2) * 194, ey + Math.sin(a2) * 194, (a2 * 180) / Math.PI]
}
// Les angles (épaule, coude) qui amènent la main au plus près d'un point (repère local).
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
// ------------------------------------------------- 1 · Le hook
grad('wagon', [[0, '#d6dde4'], [1, '#9aa6b4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lensV', [[0.55, '#000', 0], [0.85, '#000', 0.5], [1, '#000', 0.9]], { cx: 0.5, cy: 0.5, r: 0.62 })
const kit = {
  svg, txt, defs, place, show, popS, clamp, ease, lerp, rng, makePerson, handOf, reach, burst, burstAt, W, H,
  speedLines: (p, n, c) => {
    const g = speedLines(p, n, c)
    g.setAttribute('opacity', 1)
    return g
  },
  box: (parent, text, x, y, w, size = 50) => {
    const g = svg('g', {}, parent)
    svg('rect', { x, y, width: w, height: size * 1.9, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10 }, g)
    txt(g, text, { x: x + w / 2, y: y + size * 1.32, 'font-size': size, fill: '#10121a' })
    return g
  },
  bg: (parent, fill) => svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill }, parent),
  mouth: (who, t) => mouthOf(who, t),
  W3: (w) => Wd('03', w),
}
const SEC_HOOK_END = SEC.hook.t1
const LEA = { robe: '#7a5ac8', jabot: false, collar: '#e6dcff', hair: 'bob', hairColor: '#1d140e', skin: '#e8b892', iris: '#3a2a1a', female: true }
const HARC = { robe: '#5a5a52', jabot: false, collar: '#3a3a34', hair: 'slick', hairColor: '#2a1a10', skin: '#e2b08a', iris: '#2b1d12' }
const MOUSSA = { robe: '#1f2d55', jabot: false, collar: '#ffd166', hair: 'short', hairColor: '#10100e', beard: true, skin: '#6a4430', iris: '#1a120c' }

/** Le wagon, vu de très près : barres jaunes, vitres noires, lumières du tunnel qui strient. */
function wagon(k, g, { dim = 0.35 } = {}) {
  const { svg, bg } = k
  bg(g, 'url(#wagon)')
  const lights = []
  for (const x of [-40, 560]) {
    svg('rect', { x, y: 220, width: 520, height: 620, rx: 40, fill: '#07080c', stroke: '#6a7480', 'stroke-width': 16 }, g)
    for (let i = 0; i < 4; i++) lights.push({ el: svg('rect', { x, y: 290 + i * 140, width: 160, height: 12, rx: 6, fill: '#ffd28a', opacity: 0.8 }, g), x0: x })
  }
  for (const x of [150, 930]) svg('rect', { x, y: -100, width: 40, height: 2200, rx: 20, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 4 }, g)
  const shade = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#1a0a14', opacity: dim }, g)
  return { lights, shade }
}
const tunnel = (w, t) => w.lights.forEach((l, i) => l.el.setAttribute('x', l.x0 + ((t * 2400 + i * 170) % 680) - 140))
/** La foule qui écrase le cadre : épaules et têtes en ombre, au premier plan. */
function crowd(k, g) {
  const { svg } = k
  const c = svg('g', { filter: 'url(#sil)' }, g)
  for (const [x, y, r] of [[-60, 380, 260], [1140, 520, 300], [-40, 1700, 320], [1120, 1650, 300]]) {
    svg('circle', { cx: x, cy: y - r * 1.1, r: r * 0.55, fill: '#000' }, c)
    svg('ellipse', { cx: x, cy: y + r * 0.4, rx: r, ry: r * 0.8, fill: '#000' }, c)
  }
  return c
}
/** Bouge en permanence : secousses du train, cadre penché. */
const lurch = (g, t, rot = 0, amp = 1) => g.setAttribute('transform', `rotate(${rot + 1.5 * amp * Math.sin(t * 3.1)} 540 960) translate(${(10 * amp * Math.sin(t * 13) + 6 * Math.sin(t * 29)).toFixed(1)} ${(8 * amp * Math.sin(t * 11 + 1)).toFixed(1)})`)
/** Un voile sombre qui pulse avec le cœur de Léa. */
function pulse(k, g) {
  return k.svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#lensV)', opacity: 1 }, g)
}
const beat = (t) => Math.max(0, Math.sin(t * Math.PI * 2.6)) ** 8


// Les cases du hook (le moment « filmé »), puis le replay raconté par le narrateur.
const SHOTS = [
    {
      // S1 · Son visage, beaucoup trop près, dès la première image : « Allez… »
      t1: K.F1,
      build(k, g) {
        const w = wagon(k, g)
        const h = k.makePerson(g, HARC)
        const c = crowd(k, g)
        const v = pulse(k, g)
        k.box(g, 'RER B · 18 H 40', 60, 120, 520)
        return { w, h, c, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        lurch(s.h.root.parentNode, t, -4, 1)
        s.h.update(t, { x: 560, y: 1160, scale: 1.75 + 0.15 * l, mouth: k.mouth('harceleur', t), brows: [4, -0.1], look: [-0.2, 0.2], armR: [0.4, 0.6], armL: [0.4, 0.6], headTilt: -0.3, seed: 6 })
        s.v.setAttribute('opacity', (0.8 + 0.2 * beat(t)).toFixed(2))
      },
    },
    {
      // S2 · Les yeux de Léa : elle regarde ailleurs, le souffle court.
      t1: K.F2,
      build(k, g) {
        const { svg } = k
        const w = wagon(k, g, { dim: 0.55 })
        const lea = k.makePerson(g, LEA)
        const drop = svg('path', { d: 'M 0 0 C 10 14 12 24 0 28 C -12 24 -10 14 0 0 Z', fill: '#cfeaff' }, g)
        const v = pulse(k, g)
        return { w, lea, drop, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        s.lea.update(t, { x: 540, y: 1700, scale: 3.2, mouth: 0, brows: 'sad', look: [0.9, 0.5], armR: [0.3, 0.5], armL: [0.3, 0.5], headTilt: 0.1, seed: 5, breathe: 3 })
        k.place(s.drop, 760, 980 + 60 * l, 1.6, 0)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
        lurch(s.lea.root.parentNode, t, 3, 0.6)
      },
    },
    {
      // S3 · Encore plus près, le cadre penché : « fais pas ta timide. »
      t1: K.F3,
      build(k, g) {
        const w = wagon(k, g, { dim: 0.5 })
        const h = k.makePerson(g, HARC)
        const c = crowd(k, g)
        const v = pulse(k, g)
        return { w, h, c, v }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        s.h.update(t, { x: 600, y: 1240, scale: 2.1 + 0.25 * l, mouth: k.mouth('harceleur', t), brows: [4, -0.1], look: [-0.4, 0.3], armR: [0.4, 0.6], armL: [0.4, 0.6], headTilt: 0.35, seed: 6 })
        lurch(s.h.root.parentNode, t, 7, 1.2)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
      },
    },
    {
      // S4 · Sur la barre, sa main glisse sur celle de Léa : « souris un peu… »
      t1: K.F4,
      build(k, g) {
        const { svg, bg, box } = k
        bg(g, '#b9c2cc')
        svg('rect', { x: 470, y: -100, width: 140, height: 2200, rx: 70, fill: '#f2c230', stroke: '#a67a10', 'stroke-width': 10 }, g)
        const her = svg('g', {}, g)
        svg('path', { d: 'M 1300 1250 L 640 1180', stroke: '#7a5ac8', 'stroke-width': 170, 'stroke-linecap': 'round' }, her)
        svg('ellipse', { cx: 560, cy: 1160, rx: 110, ry: 90, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 6 }, her)
        for (let i = 0; i < 4; i++) svg('rect', { x: 460, y: 1090 + i * 40, width: 70, height: 34, rx: 17, fill: '#e8b892', stroke: '#b88862', 'stroke-width': 5 }, her)
        const his = svg('g', {}, g)
        svg('path', { d: 'M -300 300 L 440 820', stroke: '#5a5a52', 'stroke-width': 180, 'stroke-linecap': 'round' }, his)
        svg('ellipse', { cx: 520, cy: 880, rx: 120, ry: 100, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 6 }, his)
        for (let i = 0; i < 4; i++) svg('rect', { x: 600, y: 810 + i * 42, width: 80, height: 36, rx: 18, fill: '#e2b08a', stroke: '#b2805a', 'stroke-width': 5 }, his)
        const v = pulse(k, g)
        const st = box(g, '4e STATION. PERSONNE NE BOUGE.', 70, 240, 940, 50)
        return { his, v, st }
      },
      draw(k, s, t, l) {
        const p = k.ease.io2(k.clamp(l / 0.75))
        s.his.setAttribute('transform', `translate(${-30 * p} ${230 * p})`)
        s.v.setAttribute('opacity', (0.85 + 0.15 * beat(t)).toFixed(2))
        lurch(s.his.parentNode, t, -3, 0.8)
      },
    },
    {
      // S5 · « ma belle. » Les visages se referment autour d'elle ; une larme.
      t1: K.MOUSSA,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#1a1020')
        const lea = k.makePerson(g, LEA)
        const ring = svg('g', { filter: 'url(#sil)' }, g)
        const heads = [[-120, 500], [1200, 520], [-160, 1300], [1240, 1260], [540, 2050]].map(([x, y]) => {
          const hh = svg('g', {}, ring)
          svg('circle', { cy: -260, r: 190, fill: '#000' }, hh)
          svg('ellipse', { cy: 160, rx: 360, ry: 300, fill: '#000' }, hh)
          return { hh, x, y }
        })
        const v = pulse(k, g)
        return { lea, heads, v }
      },
      draw(k, s, t, l) {
        const close = k.ease.in2(k.clamp(l / 0.55))
        s.lea.update(t, { x: 540, y: 1250, scale: 1.4, mouth: 0, brows: 'sad', look: [0, 0.6], blink: 1, armR: [0.3, 0.5], armL: [0.3, 0.5], tearT: 0.6 + l * 1.5, seed: 5 })
        for (const h of s.heads) k.place(h.hh, k.lerp(h.x, (h.x + 540) / 2, close * 0.45), k.lerp(h.y, (h.y + 960) / 2, close * 0.45), 1, 0)
        s.v.setAttribute('opacity', 1)
      },
    },
    {
      // S6 · Une grosse main s'abat sur son épaule : « Toi. Tu descends. »
      t1: K.PUSH,
      build(k, g) {
        const { svg, burst } = k
        const w = wagon(k, g, { dim: 0.2 })
        const m = k.makePerson(g, MOUSSA)
        const h = k.makePerson(g, HARC)
        const hand = svg('g', {}, g)
        svg('path', { d: 'M 760 1200 L 600 1370', stroke: '#1f2d55', 'stroke-width': 120, 'stroke-linecap': 'round' }, hand)
        svg('ellipse', { cx: 585, cy: 1395, rx: 100, ry: 80, fill: '#6a4430', stroke: '#3a2418', 'stroke-width': 8 }, hand)
        const clap = burst(g, 'CLAP !', { fill: '#ffffff', ink: '#10121a', size: 110, r: 200 })
        return { w, m, h, hand, clap }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t * 0.3)
        const slam = k.ease.out3(k.clamp(l / 0.12))
        s.m.update(t, { x: 620, y: 1060, scale: 1.25, mouth: k.mouth('moussa', t), brows: 'determined', look: [-0.3, 0.2], armR: [0.3, 0.5], armL: [0.3, 0.5], seed: 7 })
        s.h.update(t, { x: 330, y: 1300, scale: 1.25, mouth: l > 0.15 ? 0.5 : 0, brows: l > 0.15 ? 'surprised' : [4, -0.1], look: [0.7, -0.3], armR: [0.3, 0.5], armL: [0.3, 0.5], headTilt: 0.25, seed: 6 })
        s.hand.setAttribute('transform', `translate(0 ${k.lerp(-220, 0, slam)})`)
        k.burstAt(s.clap, t, K.MOUSSA + 0.03, K.MOUSSA + 0.4, 640, 520, -8, 0.9)
        lurch(s.m.root.parentNode, t, 0, 0.5)
      },
    },
    {
      // S7 · Les portes s'ouvrent, il le pousse dehors : VLAN !
      t1: K.FALL,
      build(k, g) {
        const { svg, bg, burst, speedLines } = k
        bg(g, '#0a0c12')
        svg('rect', { x: 140, y: 200, width: 800, height: 1500, fill: '#3a3e48' }, g)
        svg('rect', { x: 140, y: 1300, width: 800, height: 400, fill: '#6a6c72' }, g)
        svg('rect', { x: 140, y: 1296, width: 800, height: 18, fill: '#ffffff' }, g)
        const lines = speedLines(g, 40, '#ffffff')
        const h = k.makePerson(g, HARC)
        const doors = [svg('rect', { x: 140, y: 200, width: 400, height: 1500, fill: '#c9d2dc', stroke: '#6a7480', 'stroke-width': 10 }, g), svg('rect', { x: 540, y: 200, width: 400, height: 1500, fill: '#c9d2dc', stroke: '#6a7480', 'stroke-width': 10 }, g)]
        svg('rect', { x: 120, y: 180, width: 840, height: 1540, fill: 'none', stroke: '#2a3240', 'stroke-width': 40 }, g)
        const hands = svg('g', {}, g)
        for (const x of [-170, 170]) {
          svg('path', { d: `M ${x * 1.6} 900 L ${x} 250`, stroke: '#1f2d55', 'stroke-width': 170, 'stroke-linecap': 'round' }, hands)
          svg('circle', { cx: x, cy: 230, r: 80, fill: '#6a4430' }, hands)
        }
        const vlan = burst(g, 'VLAN !', { fill: '#ffd166', ink: '#e5484d', size: 170, r: 280 })
        return { doors, h, hands, vlan, lines }
      },
      draw(k, s, t, l) {
        const open = k.ease.out3(k.clamp(l / 0.08))
        s.doors[0].setAttribute('transform', `translate(${-420 * open} 0)`)
        s.doors[1].setAttribute('transform', `translate(${420 * open} 0)`)
        const push = k.ease.in2(k.clamp((l - 0.05) / 0.25))
        s.h.update(t, { x: 540, y: k.lerp(1150, 1400, push), scale: k.lerp(1.2, 0.7, push), mouth: 0.8, brows: 'surprised', look: [0, -0.4], armR: [2.2, 0.4], armL: [2.2, 0.4], lean: -0.3 * push, seed: 6 })
        s.hands.setAttribute('transform', `translate(540 ${k.lerp(1700, 1200, k.ease.out3(k.clamp(l / 0.12)))})`)
        s.lines.setAttribute('transform', 'translate(540 1100)')
        k.burstAt(s.vlan, t, K.PUSH + 0.03, K.FALL, 540, 420, -8, 1)
      },
    },
    {
      // S8 · Sur le quai : le téléphone qui glisse ; des cris.
      t1: K.REWIND,
      build(k, g) {
        const { svg, bg, burst } = k
        bg(g, '#6a6c72')
        for (let y = 0; y < 2000; y += 120) svg('path', { d: `M -100 ${y} L 1200 ${y + 200}`, stroke: '#5a5c62', 'stroke-width': 6 }, g)
        svg('rect', { x: -100, y: 1500, width: 1300, height: 40, fill: '#ffffff' }, g)
        svg('rect', { x: -100, y: 1540, width: 1300, height: 600, fill: '#141518' }, g)
        const phone = svg('g', {}, g)
        svg('rect', { x: -70, y: -130, width: 140, height: 260, rx: 22, fill: '#10121a' }, phone)
        svg('rect', { x: -58, y: -116, width: 116, height: 232, rx: 14, fill: '#7a5ac8' }, phone)
        const scream = burst(g, 'AAAH !', { fill: '#ffffff', ink: '#e5484d', size: 120, r: 220 })
        return { phone, scream }
      },
      draw(k, s, t, l) {
        const p = k.ease.out3(k.clamp(l / 0.5))
        k.place(s.phone, k.lerp(300, 820, p), k.lerp(900, 1250, p), 1.4, p * 260)
        k.burstAt(s.scream, t, K.FALL + 0.1, K.REWIND, 640, 420, 8, 1)
      },
    },
    {
      // C1 · Le replay : le wagon, de profil. Léa et lui, collés ; autour, des ombres qui regardent ailleurs.
      t1: K.FORTY,
      build(k, g) {
        const w = wagon(k, g, { dim: 0.25 })
        const others = [[120, 1180], [300, 1230], [860, 1200], [1010, 1250], [-40, 1260]].map(([x, y], i) => {
          const p = k.makePerson(g, [HARC, LEA, MOUSSA, HARC, LEA][i])
          p.root.setAttribute('filter', 'url(#sil)')
          p.root.setAttribute('opacity', 0.55)
          return { p, x, y }
        })
        const lea = k.makePerson(g, LEA)
        const h = k.makePerson(g, HARC)
        const ring = k.svg('ellipse', { cx: 560, cy: 900, rx: 330, ry: 380, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 12, 'stroke-dasharray': '40 24', opacity: 0 }, g)
        return { w, others, lea, h, ring }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t)
        for (const o of s.others) o.p.update(t, { x: o.x, y: o.y, scale: 0.62, look: [0.4, 0.5], seed: o.x / 100 })
        const lean = k.ease.io2(k.clamp(l / 2.5))
        s.lea.update(t, { x: 470, y: 1180, scale: 0.72, brows: 'sad', look: [-0.6, 0.5], armR: [0.3, 1.6], armL: [0.3, 1.6], headTilt: -0.15, seed: 5 })
        s.h.update(t, { x: k.lerp(700, 640, lean), y: 1160, scale: 0.75, mouth: 0.2, brows: [4, -0.1], look: [-0.8, 0.3], armR: [0.3, 0.6], armL: [1.4, 0.4], headTilt: -0.3, seed: 6 })
        s.ring.setAttribute('opacity', t > K.LEA ? 0.9 : 0)
        s.ring.setAttribute('transform', `rotate(${t * 20} 560 900)`)
        s.w.shade.parentNode.setAttribute('transform', `translate(540 960) scale(${1 + 0.06 * l}) translate(-540 -960)`)
      },
    },
    {
      // C2 · Quarante passagers, les yeux sur leur téléphone. Personne ne bouge.
      t1: K.SAUF,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#2a2f3a')
        const heads = []
        for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) {
          const hh = svg('g', { transform: `translate(${90 + c * 128 + (r % 2) * 40} ${520 + r * 160})` }, g)
          svg('ellipse', { cy: 70, rx: 54, ry: 40, fill: '#4a5262' }, hh)
          svg('circle', { r: 34, fill: '#5a6272' }, hh)
          svg('rect', { x: -16, y: 38, width: 32, height: 22, rx: 4, fill: '#9fd0ff' }, hh)
          heads.push(hh)
        }
        return { heads }
      },
      draw(k, s, t, l) {
        s.heads.forEach((hh, i) => hh.setAttribute('opacity', t > K.FORTY + i * 0.02 ? 1 : 0))
      },
    },
    {
      // C3 · Sauf Moussa : il se lève, seul dans la lumière.
      t1: K.PUSHR,
      build(k, g) {
        const { svg } = k
        const w = wagon(k, g, { dim: 0.6 })
        svg('path', { d: 'M 380 -100 L 700 -100 L 1000 2000 L 80 2000 Z', fill: '#fff6d8', opacity: 0.18 }, g)
        const m = k.makePerson(g, MOUSSA)
        return { w, m }
      },
      draw(k, s, t, l) {
        tunnel(s.w, t * 0.3)
        const up = k.ease.out3(k.clamp(l / 0.5))
        s.m.update(t, { x: 540, y: k.lerp(1500, 1160, up), scale: 1.15, brows: 'determined', look: [-0.3, 0], armR: [0.3, 0.5], armL: [0.3, 0.5], seed: 7 })
      },
    },
    {
      // D1 · Le ralenti, en ombres : la poussée, il bascule hors du wagon.
      t1: K.SKULL,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#d9dee6')
        svg('rect', { x: -400, y: 1240, width: 1900, height: 900, fill: '#8a8e96' }, g)
        svg('rect', { x: 560, y: 1236, width: 900, height: 14, fill: '#ffffff' }, g)
        svg('rect', { x: -400, y: 200, width: 640, height: 1050, fill: '#b9c2cc' }, g)
        svg('rect', { x: 240, y: 200, width: 40, height: 1050, fill: '#6a7480' }, g)
        const lines = k.speedLines(g, 30, '#b0b6c0')
        const m = k.makePerson(g, MOUSSA)
        const h = k.makePerson(g, HARC)
        for (const p of [m, h]) p.root.setAttribute('filter', 'url(#sil)')
        return { lines, m, h }
      },
      draw(k, s, t, l) {
        const p = k.ease.out2(k.clamp(l / 1.3))
        s.lines.setAttribute('transform', 'translate(560 900)')
        s.lines.setAttribute('opacity', 0.6)
        s.m.update(t, { x: k.lerp(200, 320, p), y: 1000, scale: 0.75, armR: [1.5, 0], armL: [1.5, 0], lean: 0.15, seed: 7 })
        s.h.update(t, { x: k.lerp(560, 860, p), y: k.lerp(1000, 1160, p * p), scale: 0.75, armR: [2.4, 0.3], armL: [2.4, 0.3], lean: k.lerp(-0.2, -1.2, p), seed: 6 })
      },
    },
    {
      // D2 · La radio : le crâne, la fissure.
      t1: K.TODAY,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#04101e')
        for (let x = 0; x < 1080; x += 60) svg('path', { d: `M ${x} 0 L ${x} 1920`, stroke: '#0c2440', 'stroke-width': 2 }, g)
        const sk = svg('g', { transform: 'translate(540 860)' }, g)
        svg('path', { d: 'M 0 -330 C 210 -330 300 -170 290 -10 C 284 100 240 170 190 200 L 180 300 L 70 320 L 0 300 L -70 320 L -180 300 L -190 200 C -240 170 -284 100 -290 -10 C -300 -170 -210 -330 0 -330 Z', fill: '#cfe6ff', opacity: 0.18, stroke: '#cfe6ff', 'stroke-width': 10 }, sk)
        for (const sd of [-1, 1]) svg('ellipse', { cx: sd * 110, cy: 20, rx: 70, ry: 60, fill: '#04101e', stroke: '#cfe6ff', 'stroke-width': 8 }, sk)
        svg('path', { d: 'M 0 90 L -30 150 L 30 150 Z', fill: '#04101e', stroke: '#cfe6ff', 'stroke-width': 6 }, sk)
        const crack = svg('path', { d: 'M 120 -300 L 90 -230 L 140 -170 L 80 -100 L 120 -40', fill: 'none', stroke: '#ff3b3b', 'stroke-width': 14, 'stroke-linejoin': 'round', 'stroke-dasharray': 600, 'stroke-dashoffset': 600 }, sk)
        return { crack }
      },
      draw(k, s, t, l) {
        const c = k.ease.out3(k.clamp((t - (k.W3('fracture') - 0.1)) / 0.35))
        s.crack.setAttribute('stroke-dashoffset', (600 * (1 - c)).toFixed(0))
      },
    },
    {
      // E · Moussa, sous le projecteur ; le marteau.
      t1: SEC_HOOK_END,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#judgeBg)')
        svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, g)
        const m = k.makePerson(g, MOUSSA)
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        return { m, fl, gavel }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1080, scale: 1.15, brows: 'determined', look: [0, 0], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 7 })
        s.fl.setAttribute('opacity', (0.7 * Math.exp(-l * 8)).toFixed(3))
        const g = k.ease.in3(k.clamp((t - (K.GAVEL - 0.35)) / 0.35))
        const after = t - K.GAVEL
        k.show(s.gavel, t > K.GAVEL - 0.4)
        s.gavel.setAttribute('transform', `translate(${k.lerp(1000, 720, g)} ${k.lerp(200, 640, g)}) rotate(${k.lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
      },
    },
]

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#020306')
  let t0 = 0
  for (const s of SHOTS) {
    s.t0 = t0
    t0 = s.t1
    s.wrap = svg('g', { display: 'none' }, L.actor)
    s.g = svg('g', {}, s.wrap)
    s.st = s.build(kit, s.g) ?? {}
  }
  comicFrame(L.hud)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { rwBands }
})

// ------------------------------------------------- 2 · Le procès
const TRIB = scene('tribunal', (L) => {
  const procBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#court)' }, procBg)
  svg('path', { d: 'M 640 220 L 640 760 L 960 760 L 960 220 A 160 160 0 0 0 640 220 Z', fill: '#3b4a86' }, procBg)
  svg('path', { d: 'M 800 120 L 800 760 M 640 450 L 960 450', stroke: '#27305a', 'stroke-width': 18 }, procBg)
  svg('path', { d: 'M 640 260 L 960 260 L 700 1900 L -200 1900 Z', fill: 'url(#beam)', opacity: 0.5 }, procBg)
  const avoBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#courtRed)' }, avoBg)
  const r = rng(9)
  for (let i = 0; i < 16; i++) svg('circle', { cx: r() * W, cy: 200 + r() * 1100, r: 30 + r() * 90, fill: '#ffb36b', opacity: 0.06 + r() * 0.08 }, avoBg)
  const hotBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#d42a2a' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.14 }, hotBg)
  const graveBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#courtDark)' }, graveBg)
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, graveBg)
  const pauseBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#pauseBg)' }, pauseBg)
  const rays = svg('g', { transform: 'translate(540 1000)' }, pauseBg)
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: k % 2 ? '#3b82f6' : '#fe2c55', opacity: 0.14, transform: `rotate(${k * 30})` }, rays)
  const crowd = Array.from({ length: 9 }, (_, i) => {
    const g = svg('g', {}, L.mid)
    svg('circle', { cx: 0, cy: -60, r: 46, fill: '#0c0f1c', opacity: 0.85 }, g)
    svg('rect', { x: -70, y: -20, width: 140, height: 200, rx: 60, fill: '#0c0f1c', opacity: 0.85 }, g)
    return { g, x: -40 + i * 140, ph: r() * 6 }
  })
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  const deskG = svg('g', {}, L.front)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 500, fill: 'url(#desk)' }, deskG)
  svg('rect', { x: -300, y: 1780, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, deskG)
  const P = svg('g', {}, L.hud)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // 04 : la nuit, une enfant seule.
  const alone = prop((g) => {
    panel(g, 620, 420, '#9fd0ff')
    svg('rect', { x: -300, y: -200, width: 600, height: 400, rx: 20, fill: '#05070f' }, g)
    svg('circle', { cx: 200, cy: -110, r: 50, fill: '#f2f2d8' }, g)
    svg('circle', { cx: 222, cy: -126, r: 46, fill: '#05070f' }, g)
    svg('ellipse', { cx: -40, cy: 60, rx: 180, ry: 150, fill: 'url(#lampG)' }, g)
    svg('rect', { x: -46, y: -60, width: 10, height: 200, fill: '#5a5f70' }, g)
    svg('circle', { cx: 30, cy: 70, r: 16, fill: '#ff7aa8' }, g)
    svg('path', { d: 'M 18 86 L 42 86 L 48 140 L 12 140 Z', fill: '#ff7aa8' }, g)
  })
  // 06 : la balance, un crachat contre une jambe cassée.
  const scale = prop((g) => {
    panel(g, 760, 420)
    g.beam = svg('g', {}, g)
    svg('rect', { x: -280, y: -10, width: 560, height: 20, rx: 10, fill: '#d9a930' }, g.beam)
    for (const sd of [-1, 1]) {
      svg('path', { d: `M ${sd * 260} 0 L ${sd * 260 - 90} 110 M ${sd * 260} 0 L ${sd * 260 + 90} 110`, stroke: '#d9a930', 'stroke-width': 6 }, g.beam)
      svg('path', { d: `M ${sd * 260 - 110} 110 Q ${sd * 260} 170 ${sd * 260 + 110} 110 Z`, fill: '#d9a930' }, g.beam)
    }
    svg('path', { d: 'M -260 50 C -240 80 -230 95 -230 110 A 30 30 0 0 1 -290 110 C -290 95 -280 80 -260 50 Z', fill: '#cfe8ff', stroke: '#4a7aa0', 'stroke-width': 4 }, g.beam)
    txt(g.beam, 'UNE MAIN', { x: -260, y: 160, 'font-size': 26, fill: '#ffffff' })
    const leg = svg('g', { transform: 'translate(260 70) rotate(-8)' }, g.beam)
    svg('rect', { x: -70, y: -20, width: 140, height: 50, rx: 24, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 4 }, leg)
    txt(g.beam, 'UN CRÂNE', { x: 260, y: 160, 'font-size': 26, fill: '#ffffff' })
    svg('rect', { x: -8, y: 0, width: 16, height: 180, fill: '#d9a930' }, g)
    svg('path', { d: 'M -60 190 L 60 190 L 40 170 L -40 170 Z', fill: '#d9a930' }, g)
  })
  // 09 : les options qu'il avait.
  const options = prop((g) => {
    panel(g, 780, 520)
    g.items = ['S’INTERPOSER', 'PARLER', 'APPELER UN AGENT', 'LE POUSSER DEHORS'].map((s, k) => {
      const it = svg('g', { transform: `translate(-330 ${-170 + k * 110})` }, g)
      const bad = k === 3
      svg('rect', { x: 0, y: -40, width: 660, height: 80, rx: 16, fill: bad ? '#e5484d' : '#1f2a3a' }, it)
      txt(it, bad ? '✕' : '✓', { x: 46, y: 18, 'font-size': 52, fill: bad ? '#ffffff' : '#12e070' })
      const l = txt(it, s, { x: 100, y: 16, 'font-size': 40, fill: '#ffffff' })
      l.setAttribute('text-anchor', 'start')
      return it
    })
  })
  // 11 : la nuit « trop noire ».
  const moon = prop((g) => {
    svg('circle', { r: 170, fill: '#f2f2d8' }, g)
    svg('circle', { cx: 60, cy: -40, r: 160, fill: '#10121a' }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, alone, scale, options, moon }
})

// ------------------------------------------------- 3 · Le vote : le contrôleur face à Manon (béquille)
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const ag = makePerson(L.actor, MOUSSA)
  const manon = makePerson(L.actor, HARC)
  svg('path', { d: 'M -150 -250 C -60 -280 60 -280 150 -250 L 150 -190 C 60 -220 -60 -220 -150 -190 Z', fill: '#ffffff', stroke: '#c9d0da', 'stroke-width': 6 }, manon.head)
  svg('circle', { cx: 90, cy: -235, r: 14, fill: '#e5484d', opacity: 0.6 }, manon.head)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { ag, manon }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ffd166' }, fxTop), d: (x + y) * 0.011 })
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)' }, root)
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)

const ui = document.getElementById('ui')
const tags = []
function tag(html, cls, { t0, t1 = Infinity, x = 540, y = 400, rot = 0, from = 1.8, dur = 0.3 }) {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  ui.append(el)
  const T = { el, t0, t1, x, y, rot, from, dur }
  tags.push(T)
  return T
}
function updateTags(t) {
  for (const T of tags) {
    const s = T.t0 <= 0 && t < 0.3 ? 1 : popS(t, T.t0, T.t1, T.dur)
    T.el.style.visibility = s > 0.01 ? '' : 'hidden'
    if (s <= 0.01) continue
    if (T.update) T.update(t)
    const a = T.t0 <= 0 ? 1 : clamp((t - T.t0) / T.dur)
    const k = lerp(T.from, 1, ease.out3(a)) * Math.min(1, s) * (T.kick ? T.kick(t) : 1)
    T.el.style.opacity = Math.min(1, s * 1.5)
    T.el.style.transform = `translate(${T.x}px, ${T.y}px) translate(-50%, -50%) rotate(${T.rot}deg) scale(${k.toFixed(3)})`
  }
}
const fs = (T, px) => ((T.el.style.fontSize = `${px}px`), T)
function counterTag(t0, t1, to, unit, { y = 420, x = 540, fmt = (v) => String(v), dur = 0.7 } = {}) {
  const T = tag(`<span class="num">0</span><span class="unit">${unit}</span>`, 'counter', { t0, t1, y, x, from: 1.3 })
  T.update = (t) => (T.el.querySelector('.num').textContent = fmt(Math.round(to * ease.out3(clamp((t - t0) / dur)))))
  return T
}

// ------------------------------------------------------------------ les instants
const HOT = C.hot
const hotAt = (t) => HOT.find(([a, b]) => t >= a && t < b)
const LIKE = '<svg viewBox="0 0 24 24" width="84" height="84" style="vertical-align:middle;margin-right:20px"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#fe2c55"/></svg>LIKE'
const fr = (v) => Math.round(v).toLocaleString('fr-FR')
const pad = (n) => String(Math.floor(n)).padStart(2, '0')
// Le hook (replay).
fs(tag('LÉA · 19 ANS', 'pill yellow', { t0: K.LEA, t1: K.FORTY - 0.06, y: 300, rot: -2 }), 60)
counterTag(Wd('02', 'quatre') - 0.12, K.LEA - 0.06, 4, 'STATIONS', { y: 320, dur: 0.5 })
counterTag(K.FORTY, Wd('02', 'personne') - 0.4, 40, 'PASSAGERS', { y: 300, dur: 0.6 })
fs(tag('PERSONNE NE BOUGE.', 'slam white', { t0: Wd('02', 'personne') - 0.08, t1: K.SAUF - 0.06, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 92)
fs(tag('SAUF MOUSSA.', 'slam yellow', { t0: K.SAUF, t1: K.PUSHR - 0.05, y: 330, rot: -4, from: 2.6, dur: 0.18 }), 120)
fs(tag('FRACTURE DU CRÂNE', 'pill red', { t0: Wd('03', 'fracture') - 0.1, t1: K.TODAY - 0.06, y: 1560, rot: -2 }), 64)
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.25, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('« UNE MAIN SUR UNE MAIN. »', 'slam white', { t0: S('04') + 0.3, t1: Wd('04', 'et') - 0.1, y: 300, rot: -3, from: 2.4, dur: 0.18 }), 72)
counterTag(Wd('05', 'quatre') - 0.15, Wd('05', 'demandez') - 0.1, 4, 'STATIONS DE MAINS', { y: 300, dur: 0.4 })
fs(tag('DEMANDEZ À LÉA.', 'slam yellow', { t0: Wd('05', 'demandez') - 0.1, t1: E('05') + 0.15, y: 420, rot: -4, from: 2.8, dur: 0.18 }), 110)
fs(tag('« VOUS PRENEZ SOUVENT<br>LES TRANSPORTS ? »', 'slam white', { t0: Wd('07', 'vous') - 0.1, t1: E('07') - 0.2, y: 330, rot: -4, from: 2.8, dur: 0.15 }), 64)
fs(tag('IL L’A PROTÉGÉE<br>OU IL EST ALLÉ TROP LOIN ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 70)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
fs(tag('IL L’A JETÉ.', 'slam white', { t0: Wd('09', 'il', 1) - 0.1, t1: E('09') + 0.1, y: 330, rot: -4, from: 2.8, dur: 0.15 }), 120)
counterTag(Wd('10', 'trois') - 0.15, E('10') + 0.15, 3, 'PLAINTES POUR HARCÈLEMENT', { y: 300, dur: 0.4 })
fs(tag('« SON CASIER NE FAIT PAS<br>DE MOUSSA UN JUGE. »', 'slam white', { t0: S('11') - 0.05, t1: E('11') + 0.15, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 60)
counterTag(S('12') - 0.05, Wd('12', 'un') - 0.1, 40, 'PASSAGERS', { y: 300, dur: 0.5 })
fs(tag('UN SEUL HOMME.', 'slam yellow', { t0: Wd('12', 'un') - 0.1, t1: E('12') + 0.3, y: 420, rot: -4, from: 2.6, dur: 0.18 }), 100)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('13') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('13', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('13', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecris') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
const arrow2 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('13', 'prochain') - 0.1, y: 1285 }), 42)
for (const a of [arrow1, arrow2]) a.update = (t) => (a.x = 540 + 14 * Math.max(0, Math.sin((t - a.t0) * 7)))
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', harceleur: 'UN PASSAGER', moussa: 'MOUSSA' }

// Gros sous-titres animés (pas sur l'appel au like : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['08-like'].includes(l.id))) {
  const mine = []
  let cur = null
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 3 || /[,.:;?!…»]$/.test(line.words[i - 1]?.w ?? '')) mine.push((cur = { words: [], who: line.who }))
    cur.words.push({ ...w })
  })
  mine.forEach((c, i) => {
    c.t0 = c.words[0].t - 0.06
    c.t1 = i < mine.length - 1 ? mine[i + 1].words[0].t - 0.06 : line.start + line.dur + 0.2
  })
  CHUNKS.push(...mine)
}
CHUNKS.sort((x, y) => x.t0 - y.t0)
CHUNKS.forEach((c, i) => {
  if (CHUNKS[i + 1]) c.t1 = Math.min(c.t1, CHUNKS[i + 1].t0)
})
for (const c of CHUNKS) {
  c.el = document.createElement('div')
  c.el.className = `line ${c.who}`
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
  for (const c of CHUNKS) {
    const on = t >= c.t0 && t < c.t1
    c.el.style.display = on ? '' : 'none'
    if (!on) continue
    const enter = ease.back(2)(clamp((t - c.t0) / 0.18))
    c.el.style.transform = `translateY(${((1 - enter) * 40).toFixed(1)}px) scale(${(0.85 + 0.15 * enter).toFixed(3)})`
    for (const w of c.words) {
      const s = t < w.t - 0.05 ? 0 : ease.back(3)(clamp((t - (w.t - 0.05)) / 0.16))
      w.el.style.opacity = s > 0 ? '1' : '0'
      w.el.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)}) rotate(${((1 - s) * -6).toFixed(1)}deg)`
      w.el.classList.toggle('on', t >= w.t - 0.05 && t < w.next - 0.05)
    }
  }
}

// ------------------------------------------------------------------ l'instant t

const IMPACTS = [
  [K.MOUSSA, 22],
  [K.PUSH, 26],
  [K.FALL, 18],
  [K.REPLAY, 10],
  [K.FORTY, 8],
  [K.SAUF, 12],
  [K.PUSHR, 12],
  [K.SKULL, 10],
  [Wd('03', 'fracture') - 0.1, 14],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('05', 'demandez') - 0.1, 10],
  [Wd('09', 'il', 1) - 0.1, 12],
  [Wd('12', 'un') - 0.1, 12],
  [C.impact, 10],
  [Wd('13', 'jure') - 0.15, 8],
]
function shakeAt(t, base = 2) {
  let x = 0
  let y = 0
  for (const [t0, a] of IMPACTS) {
    if (t < t0 || t > t0 + 0.6) continue
    const k = a * Math.exp(-(t - t0) * 8)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 53 + 1)
  }
  return [x + base * Math.sin(t * 1.3), y + base * Math.sin(t * 1.1 + 1)]
}
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02, hand = 2, rot = 0, from = s.t0, flat = false } = {}) {
  const [sx, sy] = shakeAt(t, hand)
  const z = zoom * (1 + push * Math.max(0, t - from))
  const par = (k0) => {
    const k = flat ? 1 : k0
    return `translate(${540 + sx * k} ${960 + sy * k}) rotate(${rot * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  }
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.12) ?? TLINES[0]
const BEATS = C.lines.filter((l) => l.who !== 'narrateur').flatMap((l) => l.words.filter((w) => /[.?!…»]$/.test(w.w)).map((w) => ({ t: w.t, who: l.who })))
const SHOT = (cx, cy, z, rot = 0, dx = 0, dy = 0) => `translate(${540 + dx} ${960 + dy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`
const siren = (t) => (Math.floor(t * 4) % 2 ? 1 : 0) * (0.6 + 0.4 * Math.sin(t * 50) ** 2)

const pad2 = (n) => String(Math.floor(n)).padStart(2, '0')

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    // Une case = une action : coupe sèche, petit coup de zoom à l'entrée.
    const sh = SHOTS.find((x) => t < x.t1) ?? SHOTS.at(-1)
    for (const x of SHOTS) show(x.wrap, x === sh)
    const k = t - sh.t0
    const cutK = Math.exp(-k * 18)
    const [hx, hy] = shakeAt(t, 0)
    sh.wrap.setAttribute('transform', `translate(${540 + hx + 14 * cutK * Math.sin(t * 90)} ${960 + hy}) scale(${1 + 0.08 * cutK}) translate(-540 -960)`)
    sh.draw(kit, sh.st, t, k)
    const rw = t >= K.REWIND && t < K.REPLAY
    HOOK.rwBands.forEach((b, i) => {
      const r = rng(Math.floor(t * 30) + i)
      b.setAttribute('y', r() * H)
      b.setAttribute('height', 10 + r() * 40)
      b.setAttribute('opacity', rw ? 0.3 : 0)
    })
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '12'
    show(TRIB.procBg, isProc && !hot && !pause && !grave)
    show(TRIB.avoBg, !isProc && !hot && !pause && !grave)
    show(TRIB.hotBg, hot && !pause)
    show(TRIB.graveBg, grave && !hot)
    show(TRIB.pauseBg, pause)
    show(TRIB.proc.root, isProc && !pause)
    show(TRIB.avo.root, !isProc && !pause)
    show(TRIB.deskG, !pause)
    for (const c of TRIB.crowd) show(c.g, !pause && !grave)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const hs = hotAt(t)
    const hk = hs ? prog(t, hs[0], 0.12, ease.out3) * (1 - prog(t, hs[1] - 0.2, 0.2, ease.io2)) : 0
    if (pause) {
      cam(TRIB, t, { zoom: 1, push: 0.02, from: l.start, hand: 0, flat: true })
      TRIB.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 30) % 360})`)
    } else cam(TRIB, t, { zoom: (grave ? 1.08 : 1.0) + 0.25 * hk + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 820, hk), push: grave ? 0.035 : 0.025, from: l.start - 0.12, rot: side * 0.6 + hk * side * -3 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    if (!pause)
      P.update(t, {
        x: 540 + side * 60,
        y: 1170,
        scale: 1.4,
        lean: side * -0.03 + bk * side * -0.03 + hk * side * -0.06,
        mouth: m,
        brows: hk > 0.2 || grave || isProc ? 'angry' : 'determined',
        look: [side * -0.4, 0],
        armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5 + hk * 1.2, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
        armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
        point: bk > 0.3 || hk > 0.3,
        seed: isProc ? 0.5 : 1.7,
        headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
        headNod: 0.08 * bk,
      })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph))})`))
    const prop = (el, t0, t1, x = 540, y = 640, s = 0.8) => {
      const v = popS(t, t0, t1, 0.35)
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, 0)
      return v
    }
    if (prop(TRIB.scale, Wd('04', 'et') - 0.1, E('04') + 0.15, 540, 680, 0.85) > 0) TRIB.scale.beam.setAttribute('transform', `rotate(${(14 * ease.out3(clamp((t - Wd('04', 'et')) / 0.8))).toFixed(1)})`)
    if (prop(TRIB.options, S('06') - 0.05, E('06') + 0.15, 540, 700, 0.85) > 0) TRIB.options.items.forEach((it, k) => it.setAttribute('opacity', t > [Wd('06', 'sinterposer'), Wd('06', 'parler'), Wd('06', 'dappeler'), E('06') - 0.25][k] - 0.2 ? 1 : 0))
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.ag.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'determined', look: [0.3, 0], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 3.1 })
    VOTE.manon.update(t, { x: 800, y: 1460, scale: 0.88, brows: 'sad', look: [-0.3, 0.1], armR: [0.4, 0.3], armL: [0.1, 0.5], seed: 0.7 })
  }

  // Transitions : flash, pastilles, panoramique filé.
  let f = 0
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.95 : 0.3) * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  let whip = 0
  for (const l of TLINES.slice(1)) {
    if (l.id.startsWith('08') || l.id.startsWith('09')) continue
    const q = t - (l.start - 0.12)
    if (q > -0.12 && q < 0.12) {
      const dir = l.who === 'procureur' ? -1 : 1
      whip = q < 0 ? dir * -1400 * ease.in3(clamp((q + 0.12) / 0.12)) : dir * 1400 * (1 - ease.out3(clamp(q / 0.12)))
    }
  }
  TRIB.g.setAttribute('transform', `translate(${whip.toFixed(1)} 0)`)
  streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && WHO[l.who])
  who.textContent = w ? WHO[w.who] : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === HOOK ? 22 : 14)
}

// Grain (plus fort sur la vidéo du téléphone).
const grainC = document.createElement('canvas')
grainC.width = 270
grainC.height = 480
grainC.className = 'grain'
stage.append(grainC)
const gctx = grainC.getContext('2d')
const gimg = gctx.createImageData(270, 480)
function updateGrain(t, a) {
  const r = rng(Math.floor(t * FPS) + 3)
  for (let i = 0; i < gimg.data.length; i += 4) {
    const v = r() * 255
    gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v
    gimg.data[i + 3] = a
  }
  gctx.putImageData(gimg, 0, 0)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
