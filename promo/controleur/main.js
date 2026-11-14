/**
 * ============================================================================
 *  « Affaire Classée ? » — Le contrôleur (1080 × 1920)
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
const HOOK = scene('hook', (L) => {
  bg(L, '#020306')
  const R = L.actor
  // A · Dans le TER de nuit, filmé par un passager.
  const A = svg('g', {}, R)
  const Acam = svg('g', {}, A)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#trainIn)' }, Acam)
  // Les fenêtres (la nuit qui défile, puis le quai).
  const winC = svg('clipPath', { id: 'winClip' }, defs)
  for (const x of [-60, 300, 660]) svg('rect', { x, y: 300, width: 300, height: 360, rx: 30 }, winC)
  const outside = svg('g', { 'clip-path': 'url(#winClip)' }, Acam)
  svg('rect', { x: -400, y: 200, width: W + 800, height: 600, fill: '#05070f' }, outside)
  const lights = Array.from({ length: 10 }, (_, k) => svg('rect', { y: 380 + (k % 3) * 70, width: 160, height: 8, rx: 4, fill: '#ffd28a', opacity: 0.6 }, outside))
  const platform = svg('g', {}, outside)
  svg('rect', { x: -400, y: 560, width: 2000, height: 200, fill: '#3a3e48' }, platform)
  svg('rect', { x: -400, y: 556, width: 2000, height: 12, fill: '#ffd166' }, platform)
  svg('ellipse', { cx: 600, cy: 420, rx: 260, ry: 220, fill: 'url(#lampG)' }, platform)
  svg('rect', { x: 594, y: 330, width: 12, height: 240, fill: '#5a5f70' }, platform)
  for (const x of [-60, 300, 660]) {
    svg('rect', { x, y: 300, width: 300, height: 360, rx: 30, fill: 'none', stroke: '#5a6470', 'stroke-width': 14 }, Acam)
    svg('rect', { x: x + 10, y: 310, width: 120, height: 340, fill: '#ffffff', opacity: 0.05 }, Acam)
  }
  // Les néons.
  const neons = [180, 900].map((x) => svg('rect', { x: x - 260, y: 120, width: 520, height: 26, rx: 13, fill: '#eaf6ff' }, Acam))
  const neonGlow = svg('rect', { x: -200, y: 100, width: W + 400, height: 400, fill: 'url(#neon)', opacity: 0.25 }, Acam)
  // La porte coulissante à droite.
  const doorG = svg('g', {}, Acam)
  svg('rect', { x: 960, y: 260, width: 300, height: 1200, fill: '#1a1e26' }, doorG)
  const doorL = svg('rect', { x: 960, y: 260, width: 150, height: 1200, fill: '#8a96a6', stroke: '#3a4250', 'stroke-width': 8 }, doorG)
  const doorR = svg('rect', { x: 1110, y: 260, width: 150, height: 1200, fill: '#8a96a6', stroke: '#3a4250', 'stroke-width': 8 }, doorG)
  const doorLight = svg('circle', { cx: 1110, cy: 220, r: 20, fill: '#ff3b3b', opacity: 0 }, doorG)
  // Les sièges.
  for (const [x, y, s] of [[180, 1250, 1], [760, 1250, 1]]) {
    const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, Acam)
    svg('rect', { x: -200, y: -300, width: 400, height: 420, rx: 60, fill: 'url(#seatG)', stroke: '#10304a', 'stroke-width': 8 }, g)
    svg('rect', { x: -170, y: -280, width: 340, height: 70, rx: 30, fill: '#ffffff', opacity: 0.25 }, g)
  }
  const manon = makePerson(Acam, MANON)
  const ctrl = agent(Acam)
  // Le dossier du siège devant le passager qui filme.
  svg('path', { d: 'M -200 1560 C 100 1500 500 1520 700 1580 L 760 2200 L -200 2200 Z', fill: '#1d4a70', stroke: '#10304a', 'stroke-width': 10 }, A)
  const recUi = svg('g', {}, A)
  svg('circle', { cx: 74, cy: 110, r: 16, fill: '#ff3b3b' }, recUi)
  const recTxt = txt(recUi, '', { x: 104, y: 122, 'font-size': 36, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  recTxt.setAttribute('text-anchor', 'start')
  // B · Le train repart : Manon seule sur le quai, sous un lampadaire.
  const Bq = svg('g', { display: 'none' }, R)
  const Bcam = svg('g', {}, Bq)
  svg('rect', { x: -2000, y: -400, width: 6000, height: H + 800, fill: 'url(#nightF)' }, Bcam)
  for (let k = 0; k < 40; k++) svg('circle', { cx: (k * 197) % 2400 - 400, cy: 100 + ((k * 89) % 500), r: 3, fill: '#ffffff', opacity: 0.5 }, Bcam)
  const quai = svg('g', {}, Bcam)
  svg('rect', { x: -2000, y: 1200, width: 6000, height: 300, fill: '#3a3e48' }, quai)
  svg('rect', { x: -2000, y: 1196, width: 6000, height: 14, fill: '#ffd166' }, quai)
  svg('ellipse', { cx: 540, cy: 700, rx: 520, ry: 520, fill: 'url(#lampG)' }, quai)
  svg('rect', { x: 530, y: 520, width: 20, height: 690, fill: '#5a5f70' }, quai)
  svg('rect', { x: 470, y: 500, width: 140, height: 30, rx: 10, fill: '#5a5f70' }, quai)
  const sign = svg('g', { transform: 'translate(1100 760)' }, quai)
  svg('rect', { x: -220, y: -50, width: 440, height: 100, rx: 10, fill: '#1d3fa0', stroke: '#ffffff', 'stroke-width': 6 }, sign)
  txt(sign, 'LES ESSARTS', { y: 22, 'font-size': 56, fill: '#ffffff' })
  const manonQ = makePerson(quai, MANON)
  svg('rect', { x: -2000, y: 1500, width: 6000, height: 600, fill: '#0a0c12' }, Bcam)
  const trainEdge = svg('g', {}, Bq)
  svg('rect', { x: -400, y: -400, width: 260, height: H + 800, fill: '#141a22' }, trainEdge)
  svg('rect', { x: 1220, y: -400, width: 260, height: H + 800, fill: '#141a22' }, trainEdge)
  svg('rect', { x: -400, y: -400, width: W + 800, height: 560, fill: '#141a22' }, trainEdge)
  svg('rect', { x: -400, y: 1700, width: W + 800, height: 800, fill: '#141a22' }, trainEdge)
  svg('rect', { x: 140, y: 160, width: 800, height: 1540, rx: 60, fill: 'none', stroke: '#5a6470', 'stroke-width': 20 }, trainEdge)
  // C1 · La gare déserte, vue de haut, au milieu des champs.
  const C1 = svg('g', { display: 'none' }, R)
  const C1cam = svg('g', {}, C1)
  svg('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: '#070b10' }, C1cam)
  for (let k = 0; k < 22; k++) svg('path', { d: `M -800 ${k * 120} L 2000 ${k * 120 + 300}`, stroke: '#101a14', 'stroke-width': 40 }, C1cam)
  svg('path', { d: 'M -800 900 L 2000 980', stroke: '#2a2e36', 'stroke-width': 90 }, C1cam)
  for (let x = -800; x < 2000; x += 40) svg('rect', { x, y: 890 + (x + 800) * 0.028, width: 16, height: 70, fill: '#4a3a2a' }, C1cam)
  svg('rect', { x: 400, y: 820, width: 260, height: 60, fill: '#3a3e48' }, C1cam)
  svg('circle', { cx: 530, cy: 800, r: 220, fill: 'url(#lampG)' }, C1cam)
  const trainLights = svg('g', {}, C1cam)
  for (let k = 0; k < 6; k++) svg('rect', { x: k * 90, y: 0, width: 70, height: 26, rx: 6, fill: '#ffd28a' }, trainLights)
  const tinyGirl = svg('circle', { cx: 530, cy: 840, r: 12, fill: '#ff7aa8' }, C1cam)
  void tinyGirl
  // C2 · Manon (le téléphone mort) ; C3 · le contrôleur.
  const C2 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#nightF)' }, C2)
  svg('ellipse', { cx: 540, cy: 760, rx: 520, ry: 620, fill: 'url(#lampG)', opacity: 0.6 }, C2)
  const manon2 = makePerson(C2, MANON)
  const ph = phoneDead(C2)
  const C3 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#trainIn)' }, C3)
  for (const x of [180, 900]) svg('rect', { x: x - 260, y: 120, width: 520, height: 26, rx: 13, fill: '#eaf6ff' }, C3)
  const ctrl3 = agent(C3)
  // D1 · La départementale, de nuit ; les phares derrière elle.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#03050a' }, Dcam)
  svg('path', { d: 'M 470 760 L 610 760 L 1500 1920 L -420 1920 Z', fill: '#1a1c22' }, Dcam)
  for (let k = 0; k < 8; k++) {
    const y0 = 760 + 1160 / (1 + k * 0.9)
    svg('rect', { x: 540 - 6 * (1 + (y0 - 760) / 120), y: y0, width: 12 * (1 + (y0 - 760) / 120), height: 10 + (y0 - 760) / 14, fill: '#f2f2f2', opacity: 0.5 }, Dcam)
  }
  const walker = makePerson(Dcam, MANON)
  const lights2 = svg('ellipse', { cx: 540, cy: 1900, rx: 900, ry: 700, fill: 'url(#headl)', opacity: 0 }, D)
  const dWhite = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, D)
  const dBlack = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#000000', opacity: 0 }, D)
  // D2 · L'hôpital : la jambe dans le plâtre.
  const D2 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#hospWall)' }, D2)
  svg('rect', { x: -400, y: 1500, width: W + 800, height: 700, fill: '#9fb8ae' }, D2)
  svg('rect', { x: 60, y: 1300, width: 960, height: 70, rx: 30, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 5 }, D2)
  const manonH = makePerson(D2, MANON)
  svg('path', { d: 'M 120 1330 C 300 1250 700 1250 1000 1320 L 1000 1400 L 120 1400 Z', fill: '#9fd0ff', stroke: '#4a7aa0', 'stroke-width': 6 }, D2)
  const cast = svg('g', { transform: 'translate(800 1200) rotate(-10)' }, D2)
  svg('rect', { x: -60, y: -40, width: 300, height: 110, rx: 50, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 6 }, cast)
  for (let k = 0; k < 4; k++) txt(cast, ['❤', 'Léo', '☆', 'Zoé'][k], { x: -10 + k * 70, y: 30, 'font-size': 30, fill: ['#e5484d', '#3b82f6', '#ffd166', '#12a150'][k] })
  svg('path', { d: 'M 230 -60 L 260 -300', stroke: '#9aa6b8', 'stroke-width': 10 }, cast)
  // E · Le contrôleur sous le projecteur ; le marteau.
  const Ev = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, Ev)
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, Ev)
  const ctrlE = agent(Ev)
  const eFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  // ===== Le hook en « motion comic » : des cases, de gros plans, des onomatopées.
  const N = svg('g', { display: 'none' }, R)
  const box = (parent, text, x, y, w) => {
    const g = svg('g', {}, parent)
    svg('rect', { x, y, width: w, height: 96, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10 }, g)
    txt(g, text, { x: x + w / 2, y: y + 66, 'font-size': 50, fill: '#10121a' })
    return g
  }
  const nightWin = (parent, x, y, w, h, id) => {
    const c = svg('clipPath', { id }, defs)
    svg('rect', { x, y, width: w, height: h, rx: 36 }, c)
    const g = svg('g', { 'clip-path': `url(#${id})` }, parent)
    svg('rect', { x: x - 10, y: y - 10, width: w + 20, height: h + 20, fill: '#05070f' }, g)
    const streaks = Array.from({ length: 12 }, (_, k) => svg('rect', { y: y + 40 + ((k * 97) % (h - 80)), width: 220 + (k % 3) * 120, height: 10 + (k % 2) * 8, rx: 6, fill: k % 3 ? '#ffd28a' : '#9fd0ff', opacity: 0.8 }, g))
    svg('rect', { x, y, width: w, height: h, rx: 36, fill: 'none', stroke: '#5a6470', 'stroke-width': 18 }, parent)
    svg('path', { d: `M ${x + 40} ${y + h - 40} L ${x + 160} ${y + 40}`, stroke: '#ffffff', 'stroke-width': 22, opacity: 0.08 }, parent)
    return streaks
  }
  // S1 · Manon, en larmes, dans le dernier train ; son téléphone à 1 %.
  const S1 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#trainIn)' }, S1)
  const streaks1 = nightWin(S1, 120, 260, 840, 640, 'nw1')
  svg('rect', { x: -400, y: 1180, width: W + 800, height: 1200, fill: '#1d4a70' }, S1)
  const manon1 = makePerson(S1, MANON)
  const phone1 = phoneDead(S1)
  const box1 = box(S1, '23 H 10 · DERNIER TRAIN', 70, 120, 700)
  // S2 · Le contrôleur crie et pointe du doigt ; tampon « SANS BILLET ».
  const S2 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#7a1a1a' }, S2)
  const sl2 = speedLines(S2, 50, '#a0302a')
  const ctrl2 = agent(S2)
  const stamp2 = svg('g', { opacity: 0 }, S2)
  svg('rect', { x: -300, y: -70, width: 600, height: 140, rx: 14, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 14 }, stamp2)
  txt(stamp2, 'SANS BILLET', { y: 34, 'font-size': 92, fill: '#ff3b3b' })
  // S3 · Freinage, les portes s'ouvrent sur la nuit ; son bras montre la sortie.
  const S3 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#trainIn)' }, S3)
  const out3 = svg('g', {}, S3)
  svg('rect', { x: 140, y: 200, width: 800, height: 1500, fill: 'url(#nightF)' }, out3)
  for (let k = 0; k < 30; k++) svg('circle', { cx: 160 + ((k * 197) % 760), cy: 240 + ((k * 89) % 400), r: 3, fill: '#ffffff', opacity: 0.6 }, out3)
  svg('ellipse', { cx: 600, cy: 760, rx: 360, ry: 360, fill: 'url(#lampG)' }, out3)
  svg('rect', { x: 592, y: 600, width: 16, height: 700, fill: '#5a5f70' }, out3)
  svg('rect', { x: 140, y: 1290, width: 800, height: 420, fill: '#3a3e48' }, out3)
  svg('rect', { x: 140, y: 1286, width: 800, height: 14, fill: '#ffd166' }, out3)
  const sign3 = svg('g', { transform: 'translate(340 960)' }, out3)
  svg('rect', { x: -170, y: -40, width: 340, height: 80, rx: 8, fill: '#1d3fa0', stroke: '#ffffff', 'stroke-width': 5 }, sign3)
  txt(sign3, 'LES ESSARTS', { y: 18, 'font-size': 44, fill: '#ffffff' })
  const door3L = svg('g', {}, S3)
  const door3R = svg('g', {}, S3)
  for (const [g, x] of [[door3L, 140], [door3R, 540]]) {
    svg('rect', { x, y: 200, width: 400, height: 1500, fill: '#9aa6b4', stroke: '#3a4250', 'stroke-width': 10 }, g)
    svg('rect', { x: x + 70, y: 320, width: 260, height: 520, rx: 30, fill: '#0a0e18', stroke: '#3a4250', 'stroke-width': 8 }, g)
    svg('rect', { x: x + 40, y: 1000, width: 320, height: 40, rx: 10, fill: '#c8322a' }, g)
  }
  svg('rect', { x: 120, y: 180, width: 840, height: 1540, fill: 'none', stroke: '#2a3240', 'stroke-width': 40 }, S3)
  const doorLed3 = svg('circle', { cx: 540, cy: 150, r: 26, fill: '#3bd16f' }, S3)
  const arm3 = svg('g', {}, S3)
  svg('path', { d: 'M -300 2100 L 300 1250', stroke: '#1f2d55', 'stroke-width': 190, 'stroke-linecap': 'round' }, arm3)
  svg('circle', { cx: 300, cy: 1250, r: 66, fill: '#ffffff' }, arm3)
  const hand3 = svg('g', { transform: 'translate(360 1170) rotate(35)' }, arm3)
  svg('circle', { r: 70, fill: '#e2b08a' }, hand3)
  svg('rect', { x: -20, y: -170, width: 40, height: 120, rx: 20, fill: '#e2b08a' }, hand3)
  const krr = burst(S3, 'KRRRIII', { fill: '#ffffff', ink: '#10121a', size: 110, r: 230 })
  const psch = burst(S3, 'PSCHHH', { fill: '#9fd0ff', ink: '#10121a', size: 120, r: 240 })
  // S4 · Manon sur le quai ; les portes se referment devant elle : CLAC !
  const S4 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#trainIn)' }, S4)
  const out4 = svg('g', {}, S4)
  svg('rect', { x: 140, y: 200, width: 800, height: 1500, fill: 'url(#nightF)' }, out4)
  svg('ellipse', { cx: 540, cy: 620, rx: 420, ry: 420, fill: 'url(#lampG)' }, out4)
  svg('rect', { x: 140, y: 1290, width: 800, height: 420, fill: '#3a3e48' }, out4)
  const manon4 = makePerson(out4, MANON)
  const door4L = svg('g', {}, S4)
  const door4R = svg('g', {}, S4)
  for (const [g, x] of [[door4L, 140], [door4R, 540]]) {
    svg('rect', { x, y: 200, width: 400, height: 1500, fill: '#9aa6b4', stroke: '#3a4250', 'stroke-width': 10 }, g)
    svg('rect', { x: x + 70, y: 320, width: 260, height: 520, rx: 30, fill: '#0a0e18', opacity: 0.55, stroke: '#3a4250', 'stroke-width': 8 }, g)
    svg('rect', { x: x + 40, y: 1000, width: 320, height: 40, rx: 10, fill: '#c8322a' }, g)
  }
  svg('rect', { x: 120, y: 180, width: 840, height: 1540, fill: 'none', stroke: '#2a3240', 'stroke-width': 40 }, S4)
  const doorLed4 = svg('circle', { cx: 540, cy: 150, r: 26, fill: '#ff3b3b' }, S4)
  const clac = burst(S4, 'CLAC !', { fill: '#ffd166', ink: '#e5484d', size: 170, r: 280, points: 16 })
  // S5 · Derrière la vitre, son visage ; le train démarre et l'emporte hors champ.
  const S5 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#9aa6b4' }, S5)
  const win5c = svg('clipPath', { id: 'win5' }, defs)
  svg('rect', { x: 110, y: 260, width: 860, height: 1060, rx: 50 }, win5c)
  const in5 = svg('g', { 'clip-path': 'url(#win5)' }, S5)
  const pane5 = svg('g', {}, in5)
  svg('rect', { x: -2000, y: 200, width: 5000, height: 1200, fill: 'url(#nightF)' }, pane5)
  svg('ellipse', { cx: 700, cy: 520, rx: 380, ry: 380, fill: 'url(#lampG)' }, pane5)
  const manon5 = makePerson(pane5, MANON)
  const palm5 = svg('g', {}, pane5)
  svg('ellipse', { rx: 80, ry: 96, fill: '#f6d0b0', stroke: '#c89878', 'stroke-width': 6 }, palm5)
  for (let k = 0; k < 4; k++) svg('rect', { x: -66 + k * 36, y: -190, width: 30, height: 110, rx: 15, fill: '#f6d0b0', stroke: '#c89878', 'stroke-width': 5 }, palm5)
  svg('path', { d: 'M 180 1300 L 520 300 M 300 1300 L 640 300', stroke: '#ffffff', 'stroke-width': 30, opacity: 0.1 }, in5)
  svg('rect', { x: 110, y: 260, width: 860, height: 1060, rx: 50, fill: 'none', stroke: '#3a4250', 'stroke-width': 26 }, S5)
  const sl5 = svg('g', { opacity: 0 }, S5)
  for (let k = 0; k < 14; k++) svg('rect', { x: -400 + ((k * 211) % 1600), y: 180 + ((k * 137) % 1300), width: 500, height: 8, fill: '#ffffff', opacity: 0.5 }, sl5)
  const bang = burst(S5, 'BAM ! BAM !', { fill: '#ffffff', ink: '#e5484d', size: 100, r: 250 })
  // S6 · Plan large, en ombres : le train s'en va ; Manon, seule sous le lampadaire.
  const S6 = svg('g', {}, N)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#nightF)' }, S6)
  for (let k = 0; k < 70; k++) svg('circle', { cx: (k * 197) % W, cy: 60 + ((k * 89) % 900), r: 2 + (k % 3), fill: '#ffffff', opacity: 0.4 + 0.2 * (k % 3) }, S6)
  svg('circle', { cx: 820, cy: 300, r: 70, fill: '#f4ecd0' }, S6)
  svg('ellipse', { cx: 390, cy: 900, rx: 340, ry: 380, fill: 'url(#lampG)' }, S6)
  const train6 = svg('g', {}, S6)
  svg('rect', { x: 0, y: 960, width: 2600, height: 260, rx: 30, fill: '#0a0c12' }, train6)
  for (let k = 0; k < 14; k++) svg('rect', { x: 40 + k * 180, y: 1000, width: 130, height: 90, rx: 12, fill: '#ffe7a0' }, train6)
  svg('rect', { x: 2560, y: 1020, width: 40, height: 40, rx: 10, fill: '#ff3b3b' }, train6)
  const sil6 = svg('g', { filter: 'url(#sil)' }, S6)
  svg('rect', { x: -400, y: 1240, width: W + 800, height: 900, fill: '#000' }, sil6)
  svg('rect', { x: 384, y: 700, width: 14, height: 550, fill: '#000' }, sil6)
  svg('rect', { x: 340, y: 686, width: 104, height: 22, rx: 8, fill: '#000' }, sil6)
  const legs6 = svg('g', {}, sil6)
  for (const x of [-34, 34]) svg('rect', { x: x - 24, y: 0, width: 48, height: 190, rx: 16, fill: '#000' }, legs6)
  const manon6 = makePerson(sil6, MANON)
  const box6 = box(S6, '23 H 12 · PLUS AUCUN TRAIN', 60, 150, 760)
  const frameN = comicFrame(N)
  void frameN
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { legs6, N, S1, S2, S3, S4, S5, S6, streaks1, manon1, phone1, ctrl2, sl2, stamp2, door3L, door3R, doorLed3, arm3, krr, psch, manon4, door4L, door4R, doorLed4, clac, pane5, manon5, palm5, sl5, bang, train6, manon6, A, Acam, lights, platform, neons, neonGlow, doorL, doorR, doorLight, manon, ctrl, recTxt, Bq, Bcam, quai, manonQ, C1, C1cam, trainLights, C2, manon2, ph, C3, ctrl3, D, Dcam, walker, lights2, dWhite, dBlack, D2, manonH, Ev, ctrlE, eFlash, gavel, rwBands }
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
    txt(g.beam, 'CRACHAT', { x: -260, y: 160, 'font-size': 26, fill: '#ffffff' })
    const leg = svg('g', { transform: 'translate(260 70) rotate(-8)' }, g.beam)
    svg('rect', { x: -70, y: -20, width: 140, height: 50, rx: 24, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 4 }, leg)
    txt(g.beam, 'JAMBE CASSÉE', { x: 260, y: 160, 'font-size': 26, fill: '#ffffff' })
    svg('rect', { x: -8, y: 0, width: 16, height: 180, fill: '#d9a930' }, g)
    svg('path', { d: 'M -60 190 L 60 190 L 40 170 L -40 170 Z', fill: '#d9a930' }, g)
  })
  // 09 : les options qu'il avait.
  const options = prop((g) => {
    panel(g, 780, 520)
    g.items = ['VERBALISER', 'PRÉVENIR LES GENDARMES', 'APPELER SES PARENTS', 'OUVRIR LA PORTE'].map((s, k) => {
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
  const ag = agent(L.actor)
  const manon = makePerson(L.actor, MANON)
  svg('path', { d: 'M 1000 1300 L 960 1760 M 980 1300 L 1030 1300', stroke: '#9aa6b8', 'stroke-width': 18, 'stroke-linecap': 'round' }, L.actor)
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
// Le hook.
fs(tag('23 H 10', 'slam white', { t0: K.REPLAY, t1: K.MANON - 0.08, y: 330, rot: -4, from: 2.4, dur: 0.18 }), 150)
fs(tag('GARE DÉSERTE', 'pill', { t0: Wd('02', 'gare') - 0.12, t1: K.MANON - 0.08, y: 520, rot: 2 }), 56)
fs(tag('MANON · 15 ANS', 'pill yellow', { t0: K.MANON, t1: K.AGENT - 0.08, y: 260, rot: -2 }), 60)
fs(tag('SANS BILLET', 'pill red', { t0: Wd('02', 'billet') - 0.15, t1: K.AGENT - 0.08, y: 1130, rot: -3 }), 54)
fs(tag('SANS BATTERIE', 'pill red', { t0: Wd('02', 'batterie') - 0.15, t1: K.AGENT - 0.08, y: 1240, rot: 3 }), 54)
fs(tag('LE CONTRÔLEUR', 'pill', { t0: K.AGENT, t1: K.ROAD - 0.05, y: 300, rot: -2 }), 60)
counterTag(K.HOSP, K.TODAY - 0.05, 3, 'MOIS D’HÔPITAL', { y: 300, dur: 0.6 })
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('SEULE. LA NUIT.', 'slam white', { t0: Wd('04', 'seule') - 0.15, t1: Wd('04', 'il') - 0.1, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 100)
counterTag(Wd('05', 'troisieme') - 0.15, Wd('05', 'et') - 0.1, 3, 'FRAUDES CE MOIS-CI', { y: 300, dur: 0.4 })
fs(tag('ELLE LUI A CRACHÉ AU VISAGE', 'pill red', { t0: Wd('05', 'elle') - 0.15, t1: Wd('05', 'le', 0) - 0.1, y: 300, rot: -2 }), 44)
fs(tag('LE RÈGLEMENT.', 'slam yellow', { t0: Wd('05', 'reglement') - 0.2, t1: E('05') + 0.15, y: 400, rot: -4, from: 2.8, dur: 0.18 }), 110)
fs(tag('« VOTRE BARÈME, MAÎTRE ? »', 'slam white', { t0: Wd('06', 'cest') - 0.1, t1: E('06') + 0.15, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 66)
counterTag(Wd('07', '20') - 0.15, Wd('07', 'insulte') - 0.1, 20, 'ANS DE MÉTIER', { y: 300, dur: 0.5 })
fs(tag('INSULTÉ TOUS LES SOIRS', 'pill', { t0: Wd('07', 'insulte') - 0.12, t1: Wd('07', 'et') - 0.1, y: 300, rot: -2 }), 50)
fs(tag('FRAPPÉ 2 FOIS', 'pill red', { t0: Wd('07', 'frappe') - 0.12, t1: Wd('07', 'et') - 0.1, y: 420, rot: 2 }), 50)
fs(tag('IL A FAIT SON TRAVAIL<br>OU IL L’A ABANDONNÉE ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 70)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
fs(tag('« OÙ ÉTAIENT LES PARENTS ? »', 'slam white', { t0: Wd('10', 'ou') - 0.1, t1: E('10') + 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 64)
fs(tag('« LA NUIT ÉTAIT TROP NOIRE ? »', 'slam white', { t0: Wd('11', 'et') - 0.1, t1: E('11') + 0.15, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 62)
fs(tag('« LES RÈGLES, C’EST POUR LES AUTRES »', 'pill', { t0: Wd('12', 'regles') - 0.2, t1: Wd('12', 'lui') - 0.12, y: 300, rot: -2 }), 40)
fs(tag('LUI, IL LES A APPLIQUÉES.', 'slam yellow', { t0: Wd('12', 'lui') - 0.12, t1: E('12') + 0.3, y: 420, rot: -4, from: 2.6, dur: 0.18 }), 76)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('13') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('13', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('13', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecrisle') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', controleur: 'LE CONTRÔLEUR' }

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
  [K.STOP, 8],
  [K.OUT, 10],
  [K.CLOSE, 24],
  [K.REPLAY, 10],
  [K.MANON, 8],
  [K.AGENT, 10],
  [K.HIT, 30],
  [K.HOSP, 8],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'seule') - 0.15, 10],
  [Wd('05', 'reglement') - 0.2, 10],
  [Wd('12', 'lui') - 0.12, 12],
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
    const phase = t < K.REWIND ? 'A' : t < K.MANON ? 'C1' : t < K.AGENT ? 'C2' : t < K.ROAD ? 'C3' : t < K.HOSP ? 'D' : t < K.TODAY ? 'D2' : 'E'
    show(HOOK.A, false)
    show(HOOK.Bq, false)
    for (const [k, el] of [['A', HOOK.N], ['C1', HOOK.C1], ['C2', HOOK.C2], ['C3', HOOK.C3], ['D', HOOK.D], ['D2', HOOK.D2], ['E', HOOK.Ev]]) show(el, phase === k)
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A') {
      // Le hook en cases : chaque plan, une seule action, en gros plan.
      const shots = [['S1', 1.35], ['S2', K.STOP - 0.05], ['S3', K.OUT - 0.07], ['S4', K.CLOSE + 0.2], ['S5', K.DEPART + 0.4], ['S6', K.REWIND]]
      let si = shots.findIndex(([, t1]) => t < t1)
      if (si < 0) si = shots.length - 1
      const t0 = si ? shots[si - 1][1] : 0
      const k = t - t0
      for (const [id] of shots) show(HOOK[id], id === shots[si][0])
      const cut = Math.exp(-k * 18)
      const punch = 1 + 0.08 * cut
      const set = (el, cx, cy, z, rot = 0) => el.setAttribute('transform', SHOT(cx, cy, z * punch, rot, hx + 14 * cut * Math.sin(t * 90), hy))
      const id = shots[si][0]
      const stop = ease.out3(clamp((t - K.STOP) / 0.5))
      if (id === 'S1') {
        HOOK.streaks1.forEach((s, j) => {
          s.setAttribute('x', (1100 - ((t * 2600 + j * 330) % 1900)).toFixed(0))
        })
        const [a, b] = reach(150 / 1.15, (1330 - 1250) / 1.15, 1)
        HOOK.manon1.update(t, { x: 520, y: 1250, scale: 1.15, mouth: 0.1, brows: 'sad', look: [0.5, 0.4], armR: [a, b], armL: [0.3, 0.5], tearT: 0.3 + t * 0.8, headTilt: 0.12, seed: 2 })
        place(HOOK.phone1, 520 + 150, 1330 - 80, 0.85, -8 + 2 * Math.sin(t * 3))
        set(HOOK.S1, 540, 980, 1.0 + 0.06 * k, 0)
      }
      if (id === 'S2') {
        HOOK.ctrl2.update(t, { x: 560, y: 1240, scale: 1.2, mouth: mouthOf('controleur', t), brows: 'angry', look: [-0.6, 0.2], armR: [1.55 + 0.05 * Math.sin(t * 12), -0.05], armL: [0.3, 0.6], point: true, lean: -0.04, seed: 1 })
        HOOK.sl2.setAttribute('opacity', 1)
        HOOK.sl2.setAttribute('transform', `translate(540 900) rotate(${t * 20})`)
        const sp = popS(t, 1.7, Infinity, 0.18)
        HOOK.stamp2.setAttribute('opacity', sp > 0.01 ? 0.92 : 0)
        HOOK.stamp2.setAttribute('transform', `translate(540 330) rotate(-12) scale(${(sp * (1 + 1.2 * Math.exp(-(t - 1.7) * 14))).toFixed(3)})`)
        set(HOOK.S2, 540, 960, 1.0 + 0.05 * k)
      }
      if (id === 'S3') {
        const open = ease.out3(clamp((t - (K.STOP + 0.2)) / 0.3))
        HOOK.door3L.setAttribute('transform', `translate(${(-420 * open).toFixed(0)} 0)`)
        HOOK.door3R.setAttribute('transform', `translate(${(420 * open).toFixed(0)} 0)`)
        HOOK.doorLed3.setAttribute('fill', open > 0.1 ? '#3bd16f' : '#ffd166')
        const pt = ease.out3(clamp((t - (K.STOP + 0.28)) / 0.2))
        HOOK.arm3.setAttribute('transform', `translate(${lerp(-500, 0, pt)} ${lerp(400, 0, pt) + 10 * Math.sin(t * 20)})`)
        burstAt(HOOK.krr, t, t0 + 0.02, K.STOP + 0.25, 540, 420, -6, 0.9)
        burstAt(HOOK.psch, t, K.STOP + 0.25, K.OUT, 560, 400, 8, 0.85)
        set(HOOK.S3, 540, 960, 1.0 + 0.03 * k, 0)
      }
      if (id === 'S4') {
        const close = ease.in3(clamp((t - (K.CLOSE - 0.2)) / 0.2))
        HOOK.door4L.setAttribute('transform', `translate(${(-420 * (1 - close)).toFixed(0)} 0)`)
        HOOK.door4R.setAttribute('transform', `translate(${(420 * (1 - close)).toFixed(0)} 0)`)
        const back = ease.out2(clamp(k / 0.35))
        HOOK.manon4.update(t, { x: 540, y: lerp(1120, 1060, back), scale: lerp(1.0, 0.85, back), mouth: t > K.CLOSE - 0.35 ? 0.6 : 0.1, brows: 'sad', look: [0, 0.1], armR: [0.4, 0.7], armL: [0.4, 0.7], tearT: 1, seed: 2 })
        HOOK.doorLed4.setAttribute('opacity', Math.floor(t * 8) % 2 ? 1 : 0.25)
        burstAt(HOOK.clac, t, K.CLOSE, K.CLOSE + 0.2, 540, 960, -8, 1)
        set(HOOK.S4, 540, 960, 1.0 + 0.04 * k, 0)
      }
      if (id === 'S5') {
        const dep = ease.in2(clamp((t - K.DEPART) / 0.4))
        HOOK.pane5.setAttribute('transform', `translate(${(-1300 * dep).toFixed(0)} 0)`)
        const bangK = Math.abs(Math.sin((t - t0) * 22))
        HOOK.manon5.update(t, { x: 560, y: 1150, scale: 1.05, mouth: 0.8, brows: 'surprised', look: [0, 0], armR: [0.4, 0.7], armL: [0.4, 0.7], tearT: 1, seed: 2 })
        place(HOOK.palm5, 330, 760 + 14 * bangK * (1 - dep), 1.3, -10)
        HOOK.sl5.setAttribute('opacity', dep > 0.2 ? 1 : 0)
        HOOK.sl5.setAttribute('transform', `translate(${(-(t * 3000) % 600).toFixed(0)} 0)`)
        burstAt(HOOK.bang, t, t0 + 0.02, K.DEPART + 0.05, 600, 300, 6, 0.95)
        set(HOOK.S5, 540, 960, 1.0, 0)
      }
      if (id === 'S6') {
        const go = ease.in2(clamp(k / 0.65))
        HOOK.train6.setAttribute('transform', `translate(${(-600 - 2200 * go).toFixed(0)} 0)`)
        place(HOOK.legs6, 640, 1075, 1, 0)
        HOOK.manon6.update(t, { x: 640, y: 980, scale: 0.3, brows: 'sad', armR: [0.2, 0.3], armL: [0.2, 0.3], seed: 2 })
        set(HOOK.S6, 540, 960, 1.0 + 0.04 * k, 0)
      }
      void stop
    }
    if (phase === 'C1') {
      const k = t - K.REWIND
      HOOK.trainLights.setAttribute('transform', `translate(${(700 + k * 500).toFixed(0)} ${(915 + (k * 500 + 700) * 0.028).toFixed(0)})`)
      HOOK.C1cam.setAttribute('transform', SHOT(540, 860, lerp(2.2, 1.1, ease.out3(clamp(k / 1.5))), -6, hx + (t < K.REPLAY ? 30 * Math.sin(t * 70) : 0), hy))
    }
    if (phase === 'C2') {
      const k = t - K.MANON
      const dead = t > Wd('02', 'batterie') - 0.1
      HOOK.manon2.update(t, { x: 480, y: 1180, scale: 1.05, brows: 'sad', look: [0.3, 0.2], armR: [0.9, 2.0], armL: [0.3, 0.5], seed: 2 })
      place(HOOK.ph, 820, 880 + 6 * Math.sin(t * 2), 1.2, 8)
      HOOK.ph.setAttribute('opacity', dead && Math.floor(t * 6) % 2 ? 0.4 : 1)
      void k
    }
    if (phase === 'C3') {
      HOOK.ctrl3.update(t, { x: 540, y: 1180, scale: 1.1, mouth: 0, brows: 'angry', look: [0.3, 0], armR: [1.5, 0.1], armL: [0.3, 0.6], point: true, seed: 1 })
    }
    if (phase === 'D') {
      // La départementale : elle marche ; les phares arrivent derrière ; flash ; noir.
      const k = t - K.ROAD
      const car = ease.in3(clamp((t - K.CAR) / (K.HIT - K.CAR)))
      HOOK.walker.update(t, { x: 380 + 10 * Math.sin(t * 3), y: 1260 - 20 * k, scale: 0.55 - 0.03 * k, brows: 'sad', look: [0, 0], armR: [0.6, 2.1], armL: [0.6, 2.1], seed: 2 })
      HOOK.lights2.setAttribute('opacity', (car * 1.2).toFixed(2))
      HOOK.lights2.setAttribute('rx', (300 + 900 * car).toFixed(0))
      const after = t - K.HIT
      HOOK.dWhite.setAttribute('opacity', after > 0 ? Math.max(0, 1 - after * 6).toFixed(2) : 0)
      HOOK.dBlack.setAttribute('opacity', after > 0.12 ? 1 : 0)
      HOOK.Dcam.setAttribute('transform', SHOT(540, 1000, 1.0 + 0.03 * k, 0, hx, hy))
    }
    if (phase === 'D2') {
      HOOK.manonH.update(t, { x: 300, y: 1200, scale: 0.75, brows: 'sad', look: [0.3, -0.1], armR: [0.3, 0.6], armL: [0.3, 0.6], seed: 2 })
    }
    if (phase === 'E') {
      const k = t - K.TODAY
      HOOK.ctrlE.update(t, { x: 540, y: 1080, scale: 1.15, mouth: 0, brows: 'angry', look: [0, 0], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 1 })
      HOOK.eFlash.setAttribute('opacity', (0.7 * Math.exp(-k * 8)).toFixed(3))
      const g = prog(t, K.GAVEL - 0.12, 0.12, ease.in3)
      const after = t - K.GAVEL
      show(HOOK.gavel, t > K.GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(1000, 720, g)} ${lerp(200, 640, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
    }
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
    prop(TRIB.alone, Wd('04', 'enfant') - 0.2, Wd('04', 'seule') - 0.2, 540, 660, 0.85)
    if (prop(TRIB.scale, S('06') - 0.05, Wd('06', 'cest') - 0.12, 540, 680, 0.85) > 0) TRIB.scale.beam.setAttribute('transform', `rotate(${(14 * ease.out3(clamp((t - S('06')) / 0.8))).toFixed(1)})`)
    if (prop(TRIB.options, S('09') - 0.05, E('09') + 0.15, 540, 700, 0.85) > 0) TRIB.options.items.forEach((it, k) => it.setAttribute('opacity', t > [Wd('09', 'verbaliser'), Wd('09', 'gendarmes'), Wd('09', 'parents'), Wd('09', 'douvrir')][k] - 0.2 ? 1 : 0))
    prop(TRIB.moon, Wd('11', 'nuit') - 0.2, E('11') + 0.15, 540, 720, 0.7)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.ag.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'angry', look: [0.3, 0], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 3.1 })
    VOTE.manon.update(t, { x: 800, y: 1460, scale: 0.85, brows: 'sad', look: [-0.3, 0.1], armR: [0.4, 0.3], armL: [0.1, 0.5], seed: 0.7 })
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
