/**
 * ============================================================================
 *  « Affaire Classée ? » — La voiture du voisin (1080 × 1920)
 * ============================================================================
 *  L'ouverture « fait divers » : la photo du radar de feu rouge, l'affaire en
 *  une phrase. Puis la caméra de bord de la voiture volée, en un seul plan :
 *  six feux rouges, six flashs, Sarah dans le rétroviseur, la maternité. Le
 *  narrateur rembobine ; au procès, chaque argument devient un plan de coupe.
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
// ------------------------------------------------- Outils « cinéma » : flous, lueurs, contre-jour, bokeh, rayons
grad('daySky', [[0, '#8fc4ef'], [1, '#e6f2f8']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lawn', [[0, '#6aa24a'], [1, '#3a6a32']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('goldSky', [[0, '#2a1438'], [0.38, '#a8384a'], [0.68, '#f08a3a'], [1, '#ffd38a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sunCore', [[0, '#fffbe8', 1], [0.16, '#fff0b8', 0.95], [0.42, '#ffc060', 0.42], [1, '#ff8030', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('xrayBg', [[0, '#0a2848'], [1, '#01040a']], { cx: 0.5, cy: 0.42, r: 0.8 })
grad('studio', [[0, '#363a46'], [0.6, '#111319'], [1, '#050608']], { cx: 0.5, cy: 0.32, r: 0.8 })
grad('softbox', [[0, '#ffffff', 0.55], [1, '#ffffff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('redRoom', [[0, '#7a0c18'], [1, '#14020a']], { cx: 0.5, cy: 0.4, r: 0.8 })
grad('blueNight', [[0, '#0c1a3a'], [1, '#02040a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('scrGlow', [[0, '#bfe0ff', 0.6], [1, '#bfe0ff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('vigCut', [[0.45, '#000', 0], [1, '#000', 0.8]], { cx: 0.5, cy: 0.45, r: 0.75 })
grad('vigRed', [[0.3, '#2a0004', 0], [1, '#2a0004', 0.95]], { cx: 0.5, cy: 0.45, r: 0.72 })
grad('warmRoom', [[0, '#6a3e24'], [1, '#160c08']], { cx: 0.5, cy: 0.35, r: 0.85 })
grad('ambR', [[0, '#ff2a3d', 0.8], [1, '#ff2a3d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('ambB', [[0, '#2a6dff', 0.85], [1, '#2a6dff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('gold', [[0, '#fff3b8'], [0.5, '#e8b23a'], [1, '#93620c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('banner', [[0, '#fe2c55'], [1, '#6a1a9a']], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('flare', [[0, '#fff6d8', 0.22], [1, '#fff6d8', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
{
  for (const [id, sd] of [['blur6', 6], ['blur14', 14], ['blur30', 30]]) {
    const f = svg('filter', { id, x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs)
    svg('feGaussianBlur', { stdDeviation: sd }, f)
  }
  const f = svg('filter', { id: 'glow', x: '-40%', y: '-40%', width: '180%', height: '180%' }, defs)
  svg('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: 12, result: 'b' }, f)
  const m = svg('feMerge', {}, f)
  for (const i of ['b', 'b', 'SourceGraphic']) svg('feMergeNode', { in: i }, m)
  // Le liseré doré autour des personnages à contre-jour.
  const r = svg('filter', { id: 'rimGold', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 1  0 0 0 0 0.8  0 0 0 0 0.45  0 0 0 1.4 0' }, r)
  svg('feGaussianBlur', { stdDeviation: 10 }, r)
  // Le contre-jour : les couleurs assombries et réchauffées.
  const bl = svg('filter', { id: 'backlit' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0.5 0 0 0 0.06  0 0.4 0 0 0.03  0 0 0.36 0 0.05  0 0 0 1 0' }, bl)
  // L'aberration chromatique : des copies teintées rouge et cyan.
  const tr = svg('filter', { id: 'tintR' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 1  0 0 0 0 0.1  0 0 0 0 0.15  0 0 0 1 0' }, tr)
  const tc = svg('filter', { id: 'tintC' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.1  0 0 0 0 0.9  0 0 0 0 1  0 0 0 1 0' }, tc)
  const gp = svg('pattern', { id: 'gridC', width: 54, height: 54, patternUnits: 'userSpaceOnUse' }, defs)
  svg('path', { d: 'M 54 0 L 0 0 0 54', fill: 'none', stroke: '#8fe8ff', 'stroke-width': 2, opacity: 0.18 }, gp)
}
// Des taches de lumière floues qui dérivent (bokeh, poussières dans le soleil).
function bokeh(parent, n, colors, seed, { x0 = -100, x1 = W + 100, y0 = -100, y1 = H + 100, r0 = 18, r1 = 80, op = 0.35, blur = 'blur14', vy = 25 } = {}) {
  const g = svg('g', { filter: `url(#${blur})` }, parent)
  const r = rng(seed)
  const items = Array.from({ length: n }, () => ({ el: svg('circle', { r: (r0 + r() * (r1 - r0)).toFixed(0), fill: colors[Math.floor(r() * colors.length)], opacity: (op * (0.35 + 0.65 * r())).toFixed(2) }, g), x: x0 + r() * (x1 - x0), y: y0 + r() * (y1 - y0), ph: r() * 6, sp: 0.4 + r() }))
  g.draw = (t) => {
    const h = y1 - y0
    for (const it of items) {
      const y = y0 + ((((it.y - y0 - t * vy * it.sp) % h) + h) % h)
      it.el.setAttribute('transform', `translate(${(it.x + 24 * Math.sin(t * 0.6 * it.sp + it.ph)).toFixed(1)} ${y.toFixed(1)})`)
    }
  }
  g.draw(0)
  return g
}
// Des rayons de lumière depuis l'origine du groupe.
function rays(parent, n, color, op = 0.12, len = 2400, w = 0.06) {
  const g = svg('g', {}, parent)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    svg('path', { d: `M 0 0 L ${(Math.cos(a - w) * len).toFixed(0)} ${(Math.sin(a - w) * len).toFixed(0)} L ${(Math.cos(a + w) * len).toFixed(0)} ${(Math.sin(a + w) * len).toFixed(0)} Z`, fill: color, opacity: op }, g)
  }
  return g
}
// Une silhouette simple (pieds en 0) : bras en degrés depuis le bas (90 = à l'horizontale, 180 = levé).
function fig(parent, { x = 0, y = 0, s = 1, fill = '#10121a', armR = 10, armL = 10, phone = false, head = null, rot = 0 } = {}) {
  const g = svg('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})` }, parent)
  let end = null
  for (const [side, a] of [[1, armR], [-1, armL]]) {
    const r = (a * Math.PI) / 180
    const ex = side * 50 + side * Math.sin(r) * 150
    const ey = -268 + Math.cos(r) * 150
    if (side === 1) end = [ex, ey]
    svg('path', { d: `M ${side * 50} -268 L ${ex.toFixed(0)} ${ey.toFixed(0)}`, stroke: fill, 'stroke-width': 30, 'stroke-linecap': 'round' }, g)
  }
  svg('path', { d: 'M -58 -282 Q 0 -300 58 -282 L 66 -140 L 40 -140 L 36 0 L 8 0 L 0 -118 L -8 0 L -36 0 L -40 -140 L -66 -140 Z', fill }, g)
  svg('circle', { cx: 0, cy: -336, r: 40, fill: head ?? fill }, g)
  if (phone) {
    svg('circle', { cx: end[0], cy: end[1] - 30, r: 90, fill: 'url(#scrGlow)' }, g)
    g.screen = svg('rect', { x: end[0] - 20, y: end[1] - 64, width: 40, height: 66, rx: 8, fill: '#d8ecff' }, g)
  }
  return g
}
// Un poing levé (silhouette), le bras jusqu'en bas de l'écran.
function fistShape(parent, fill = '#0a0a0c') {
  const g = svg('g', {}, parent)
  svg('rect', { x: -46, y: 30, width: 92, height: 1500, fill }, g)
  svg('rect', { x: -82, y: -72, width: 164, height: 142, rx: 48, fill }, g)
  svg('rect', { x: -100, y: -8, width: 60, height: 74, rx: 28, fill }, g)
  return g
}
// Une étiquette arrondie dessinée dans la scène.
function label(parent, text, { size = 40, fill = '#ffffff', ink = '#10121a', pad = 26 } = {}) {
  const g = svg('g', {}, parent)
  const w = text.length * size * 0.62 + pad * 2
  svg('rect', { x: -w / 2, y: -size * 0.9, width: w, height: size * 1.7, rx: size * 0.5, fill }, g)
  txt(g, text, { y: size * 0.36, 'font-size': size, fill: ink })
  return g
}
const KEV = { ...{ robe: '#fe2c55', jabot: false, collar: '#ffffff', skin: '#f0c8a0', iris: '#3a5a7a' }, hair: 'short', hairColor: '#2a1a10' }
// Le bandage autour de la tête (Kevin à l'hôpital, puis au vote).
function bandage(p) {
  const g = svg('g', {}, p.head)
  svg('path', { d: 'M -172 -262 Q 0 -318 172 -262 L 174 -196 Q 0 -250 -174 -196 Z', fill: '#ffffff', stroke: '#c9d4de', 'stroke-width': 6 }, g)
  svg('path', { d: 'M -120 -270 L -60 -210 M 40 -290 L 110 -224', stroke: '#dde5ec', 'stroke-width': 8 }, g)
  return g
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
// Les personnages.
const MEHDI = { robe: '#2f8f6a', jabot: false, collar: '#1d5a42', hair: 'short', hairColor: '#1a120c', beard: true, skin: '#b07a52', iris: '#1a120c' }
const SARAH = { robe: '#c86a8a', jabot: false, collar: '#f0c0d0', hair: 'bob', hairColor: '#2a1a10', skin: '#c89070', iris: '#2a1a10', female: true }
const BERNARD = { robe: '#7a7468', jabot: false, collar: '#d8d2c4', hair: 'short', hairColor: '#d0d0d0', skin: '#e8b896', iris: '#3a5a7a' }
const T = K
// La route vue de la caméra de bord : distance parcourue (le conducteur freine devant la maternité).
const ROAD_V = 1.25
function roadPos(t) {
  const a0 = K.ARRIVE - 0.8
  const u = Math.max(0, t - K.LIVE0)
  if (t < a0) return u * ROAD_V
  const b = (a0 - K.LIVE0) * ROAD_V
  const x = Math.min(0.8, t - a0)
  return b + ROAD_V * (x - (x * x) / 1.6)
}
// Profondeur → écran (point de fuite en 540, 820).
const VP = [540, 820]
const persp = (q) => q * q * q

// Le hook : l'ouverture « fait divers », puis la caméra de bord, puis le replay.
const SHOTS = [
    {
      // I · L'ouverture : la photo du radar de feu rouge, en noir et blanc. L'affaire en une image.
      t1: K.LIVE0,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#050506')
        const photo = svg('g', { filter: 'url(#desat)' }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#0c0e14' }, photo)
        for (let i = 0; i < 6; i++) svg('rect', { x: -60 + i * 200, y: 300 + (i % 3) * 60, width: 190, height: 700, fill: '#151a24' }, photo)
        svg('path', { d: `M 540 820 L 1500 1500 L -420 1500 Z`, fill: '#1c1e24' }, photo)
        for (let i = 0; i < 6; i++) svg('rect', { x: 528, y: 900 + i * 110, width: 24, height: 60 + i * 10, fill: '#e8e8e8', opacity: 0.8, transform: `translate(540 820) scale(${1 + i * 0.25}) translate(-540 -820)` }, photo)
        // Le feu rouge, au premier plan.
        const fire = svg('g', { transform: 'translate(840 470)' }, g)
        svg('rect', { x: -12, y: 120, width: 24, height: 900, fill: '#2a2c32' }, fire)
        svg('rect', { x: -70, y: -180, width: 140, height: 330, rx: 26, fill: '#14161a' }, fire)
        svg('circle', { cy: -100, r: 48, fill: '#ff2a3d', filter: 'url(#glow)' }, fire)
        svg('circle', { cy: 0, r: 44, fill: '#2a2a2a' }, fire)
        svg('circle', { cy: 96, r: 44, fill: '#2a2a2a' }, fire)
        // La voiture, de dos, qui franchit la ligne.
        const car = svg('g', { transform: 'translate(500 1130)' }, g)
        svg('ellipse', { cy: 150, rx: 300, ry: 30, fill: '#000', opacity: 0.6 }, car)
        svg('path', { d: 'M -270 120 L -250 -10 Q -230 -60 -180 -70 L -140 -150 Q -120 -190 -70 -190 L 70 -190 Q 120 -190 140 -150 L 180 -70 Q 230 -60 250 -10 L 270 120 Z', fill: '#c8ccd2' }, car)
        svg('path', { d: 'M -120 -150 L 120 -150 L 150 -80 L -150 -80 Z', fill: '#2a3040' }, car)
        for (const s2 of [-1, 1]) svg('rect', { x: s2 * 200 - 40, y: -30, width: 80, height: 34, rx: 8, fill: '#ff2a3d', filter: 'url(#glow)' }, car)
        svg('rect', { x: -70, y: 30, width: 140, height: 40, rx: 4, fill: '#ffffff' }, car)
        txt(car, 'AB-371-KC', { y: 62, 'font-size': 30, fill: '#10121a' })
        const ring = svg('ellipse', { cx: 500, cy: 1060, rx: 340, ry: 190, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 10, 'stroke-dasharray': '30 16', opacity: 0, filter: 'url(#glow)' }, g)
        const scan = svg('pattern', { id: 'scanV', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, k.defs)
        svg('rect', { width: 8, height: 3, fill: '#000', opacity: 0.28 }, scan)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#scanV)' }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        // Le bandeau du radar.
        const band = svg('g', {}, g)
        svg('rect', { x: 0, y: 1690, width: 1080, height: 120, fill: '#000', opacity: 0.75 }, band)
        txt(band, 'RADAR FEU ROUGE · 03:14', { x: 40, y: 1745, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'start' })
        const nb = txt(band, '', { x: 40, y: 1790, 'font-size': 34, fill: '#ff6a78', 'text-anchor': 'start' })
        txt(band, '87 km/h', { x: 1040, y: 1770, 'font-size': 44, fill: '#ffffff', 'text-anchor': 'end' })
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        return { car, ring, nb, fl, photo }
      },
      draw(k, s, t, l) {
        // Six flashs à partir de « grillé six feux rouges » (une photo par feu).
        const f0 = K.INTRO_FEUX
        const n = t < f0 ? 1 : Math.min(6, 1 + Math.floor((t - f0) / 0.22))
        const since = t < f0 ? t : (t - f0) % 0.22
        s.fl.setAttribute('opacity', (t < f0 ? 0 : 0.7 * Math.exp(-since * 16)).toFixed(3))
        s.nb.textContent = `INFRACTION ${n} / 6`
        const z = 1.0 + 0.04 * l
        s.car.setAttribute('transform', `translate(${500 + (n - 1) * 6} ${1130 - (n - 1) * 4}) scale(${z.toFixed(3)})`)
        const v = k.ease.out3(k.clamp((t - K.INTRO_VOL) / 0.25))
        s.ring.setAttribute('opacity', v.toFixed(2))
        s.ring.setAttribute('stroke-dashoffset', (-t * 60).toFixed(0))
      },
    },
    {
      // Le hook : la caméra de bord de la voiture volée, en un seul plan. Six feux rouges, la maternité.
      t1: K.REWIND,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#04050a')
        svg('rect', { x: -400, y: -400, width: 1900, height: 1220, fill: 'url(#blueNight)' }, g)
        // La ville au loin (fenêtres allumées).
        const r = rng(7)
        const city = svg('g', {}, g)
        for (let i = 0; i < 12; i++) {
          const x = -100 + i * 110
          const h = 120 + r() * 260
          svg('rect', { x, y: 820 - h, width: 104, height: h, fill: '#0a1020' }, city)
          for (let wy = 840 - h; wy < 800; wy += 34) for (let wx = x + 12; wx < x + 96; wx += 28) if (r() < 0.3) svg('rect', { x: wx, y: wy, width: 14, height: 18, fill: '#ffcf80', opacity: 0.6 }, city)
        }
        svg('path', { d: 'M 540 820 L 1700 1700 L -620 1700 Z', fill: '#16181e' }, g)
        const world = svg('g', {}, g)
        // Les tirets de la route, les lampadaires, les feux : recalculés à chaque image.
        const dashes = Array.from({ length: 8 }, () => svg('path', { d: '', fill: '#e8e8e8', opacity: 0.85 }, world))
        const lamps = Array.from({ length: 10 }, () => {
          const e = svg('g', {}, world)
          const pole = svg('path', { d: '', stroke: '#2a2e38', 'stroke-width': 1, fill: 'none' }, e)
          const glow = svg('circle', { r: 1, fill: 'url(#lampG)' }, e)
          return { e, pole, glow }
        })
        const lights = T.FLASHES.map(() => {
          const e = svg('g', { opacity: 0 }, world)
          svg('rect', { x: -12, y: 0, width: 24, height: 900, fill: '#2a2c32' }, e)
          svg('rect', { x: -70, y: -330, width: 140, height: 330, rx: 26, fill: '#14161a' }, e)
          svg('circle', { cy: -250, r: 48, fill: '#ff2a3d', filter: 'url(#glow)' }, e)
          svg('circle', { cy: -150, r: 44, fill: '#2a2a2a' }, e)
          svg('circle', { cy: -54, r: 44, fill: '#2a2a2a' }, e)
          return e
        })
        // La maternité.
        const mat = svg('g', { opacity: 0 }, world)
        svg('rect', { x: -260, y: -120, width: 520, height: 170, rx: 16, fill: '#1f5fd0' }, mat)
        svg('rect', { x: -230, y: -95, width: 90, height: 90, rx: 10, fill: '#ffffff' }, mat)
        svg('path', { d: 'M -200 -50 L -170 -50 M -185 -80 L -185 -20', stroke: '#e5484d', 'stroke-width': 18 }, mat)
        txt(mat, 'MATERNITÉ', { x: 50, y: -40, 'font-size': 54, fill: '#ffffff' })
        txt(mat, 'URGENCES', { x: 50, y: 20, 'font-size': 38, fill: '#cfe0ff' })
        svg('rect', { x: -8, y: 50, width: 16, height: 600, fill: '#2a2c32' }, mat)
        // Le rétroviseur : Sarah, à l'arrière.
        const mir = svg('g', {}, g)
        svg('rect', { x: 220, y: 130, width: 640, height: 260, rx: 50, fill: '#0a0a0c' }, mir)
        const cp = svg('clipPath', { id: 'mirClip' }, k.defs)
        svg('rect', { x: 238, y: 148, width: 604, height: 224, rx: 38 }, cp)
        const mv = svg('g', { 'clip-path': 'url(#mirClip)' }, mir)
        svg('rect', { x: 230, y: 140, width: 620, height: 240, fill: '#2a2230' }, mv)
        svg('ellipse', { cx: 700, cy: 200, rx: 200, ry: 120, fill: 'url(#lampG)', opacity: 0.35 }, mv)
        const sarah = k.makePerson(mv, SARAH)
        svg('rect', { x: 238, y: 148, width: 604, height: 70, fill: '#ffffff', opacity: 0.06 }, mir)
        svg('rect', { x: 530, y: 40, width: 20, height: 100, fill: '#0a0a0c' }, mir)
        // Le tableau de bord, le volant, les mains de Mehdi.
        const dash = svg('g', {}, g)
        svg('path', { d: 'M -100 1480 Q 540 1400 1180 1480 L 1180 2100 L -100 2100 Z', fill: '#0c0d10' }, dash)
        const wheel = svg('g', {}, dash)
        svg('circle', { cx: 0, cy: 0, r: 360, fill: 'none', stroke: '#1a1b20', 'stroke-width': 60 }, wheel)
        svg('rect', { x: -360, y: -20, width: 720, height: 50, fill: '#1a1b20' }, wheel)
        svg('circle', { r: 90, fill: '#16171c' }, wheel)
        for (const sx of [-1, 1]) svg('ellipse', { cx: sx * 330, cy: -60, rx: 70, ry: 90, fill: '#b07a52', stroke: '#6a4430', 'stroke-width': 6 }, wheel)
        const speed = txt(dash, '', { x: 900, y: 1640, 'font-size': 80, fill: '#9fe0ff', filter: 'url(#glow)' })
        txt(dash, 'km/h', { x: 900, y: 1690, 'font-size': 30, fill: '#9fe0ff' })
        // L'interface de la caméra de bord.
        const hud = svg('g', {}, g)
        const rec = svg('circle', { cx: 70, cy: 1850, r: 14, fill: '#ff2a3d' }, hud)
        txt(hud, 'CAM AVANT', { x: 96, y: 1862, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'start' })
        const clock = txt(hud, '', { x: 1010, y: 1862, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'end' })
        const count = svg('g', { transform: 'translate(160 520)' }, g)
        svg('rect', { x: -120, y: -56, width: 240, height: 112, rx: 24, fill: '#000', opacity: 0.7, stroke: '#ff2a3d', 'stroke-width': 6 }, count)
        svg('circle', { cx: -68, r: 26, fill: '#ff2a3d', filter: 'url(#glow)' }, count)
        const cnum = txt(count, '0', { x: 30, y: 30, 'font-size': 84, fill: '#ffffff' })
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)', opacity: 0.7 }, g)
        return { world, dashes, lamps, lights, mat, sarah, wheel, speed, rec, clock, count, cnum, fl }
      },
      draw(k, s, t, l) {
        const P = roadPos(t)
        const P2 = (X, Y, q) => {
          const p = persp(q)
          return [VP[0] + X * p, VP[1] + Y * p, p]
        }
        // Tirets : profondeur q qui avance avec la route.
        s.dashes.forEach((d, i) => {
          const q0 = (((i / 8 + P * 0.9) % 1) + 1) % 1
          const q1 = q0 + 0.05
          const [x0, y0, p0] = P2(0, 700, q0)
          const [x1, y1, p1] = P2(0, 700, Math.min(1.4, q1))
          d.setAttribute('d', `M ${x0 - 14 * p0} ${y0} L ${x0 + 14 * p0} ${y0} L ${x1 + 14 * p1} ${y1} L ${x1 - 14 * p1} ${y1} Z`)
        })
        s.lamps.forEach((m, i) => {
          const side = i % 2 ? 1 : -1
          const q = (((Math.floor(i / 2) / 5 + P * 0.5) % 1) + 1) % 1
          const [xg, yg, p] = P2(side * 1100, 700, q)
          const [xt, yt] = P2(side * 1000, -900, q)
          m.pole.setAttribute('d', `M ${xg.toFixed(1)} ${yg.toFixed(1)} L ${xt.toFixed(1)} ${yt.toFixed(1)}`)
          m.pole.setAttribute('stroke-width', (4 + 40 * p).toFixed(1))
          m.glow.setAttribute('cx', xt.toFixed(1))
          m.glow.setAttribute('cy', yt.toFixed(1))
          m.glow.setAttribute('r', (20 + 260 * p).toFixed(1))
        })
        // Les feux rouges : chacun arrive vers la caméra et passe au-dessus au moment du flash.
        s.lights.forEach((e, i) => {
          const tf = T.FLASHES[i]
          const q = 0.25 + 0.6 * k.clamp(1 - (tf - t) / 1.0) + (t > tf ? (t - tf) * 2.5 : 0)
          const on = t > tf - 1.0 && t < tf + 0.3
          e.setAttribute('opacity', on ? 1 : 0)
          if (on) {
            const [x, y, p] = P2(i % 2 ? 620 : -620, 700, q)
            e.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.1 + 1.5 * p).toFixed(3)})`)
          }
        })
        const am = t > K.ARRIVE - 1.6
        s.mat.setAttribute('opacity', am ? 1 : 0)
        if (am) {
          const q = 0.2 + 0.6 * k.ease.out2(k.clamp((t - (K.ARRIVE - 1.6)) / 1.6))
          const [x, y, p] = P2(-700, 300, q)
          s.mat.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(0.3 + 2.0 * p).toFixed(3)})`)
        }
        // Le flash du radar à chaque feu, le compteur.
        let f = 0
        let n = 0
        for (const tf of T.FLASHES) if (t >= tf) {
          n++
          f = Math.max(f, 0.6 * Math.exp(-(t - tf) * 16))
        }
        s.fl.setAttribute('opacity', f.toFixed(3))
        s.cnum.textContent = String(n)
        const last = T.FLASHES.filter((x) => t >= x).at(-1) ?? -9
        k.place(s.count, 160, 520, 1 + 0.35 * Math.exp(-(t - last) * 10), -3)
        // Le volant (les mains qui tremblent), la caméra qui vibre, le coup de frein.
        const brake = Math.sin(Math.PI * k.clamp((t - (K.ARRIVE - 0.8)) / 0.9))
        const jx = 5 * Math.sin(t * 23) + 3 * Math.sin(t * 41)
        const jy = 4 * Math.sin(t * 19 + 1) + 40 * brake
        s.world.setAttribute('transform', `translate(${jx.toFixed(1)} ${jy.toFixed(1)})`)
        s.wheel.setAttribute('transform', `translate(540 1900) rotate(${(6 * Math.sin(t * 2.3) + 3 * Math.sin(t * 7)).toFixed(1)})`)
        const v = t < K.ARRIVE - 0.8 ? 84 + 6 * Math.sin(t * 1.7) : Math.max(0, 84 * (1 - (t - (K.ARRIVE - 0.8)) / 0.8))
        s.speed.textContent = String(Math.round(v))
        s.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.25)
        s.clock.textContent = `03:12:${String(14 + Math.floor(t)).padStart(2, '0')}`
        // Sarah dans le rétroviseur.
        const sp = k.mouth('sarah', t)
        s.sarah.update(t, { x: 540, y: 360, scale: 0.5, mouth: Math.max(sp, 0.25 + 0.2 * Math.sin(t * 5)), brows: 'sad', look: [0, -0.2], armR: [0.3, 0.6], armL: [0.3, 0.6], headTilt: 0.15 * Math.sin(t * 3), blink: t > K.ARRIVE ? 0.3 : null, seed: 5 })
      },
    },
    {
      // R1 · Mehdi, 29 ans, livreur : son sac isotherme, son scooter, la rue de nuit.
      t1: K.BERNARD,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, 'url(#blueNight)')
        const bk = bokeh(g, 16, ['#ffcf80', '#ff9a50', '#9fd0ff'], 101, { op: 0.35, r0: 20, r1: 70, blur: 'blur14', vy: 6 })
        svg('rect', { x: -400, y: 1250, width: 1900, height: 900, fill: '#14161c' }, g)
        const bag = svg('g', {}, g)
        svg('rect', { x: -170, y: -180, width: 340, height: 340, rx: 26, fill: '#12a37a', stroke: '#0a5a42', 'stroke-width': 10 }, bag)
        txt(bag, 'LIVRAISON', { y: 10, 'font-size': 44, fill: '#ffffff' })
        const m = k.makePerson(g, MEHDI)
        return { bk, bag, m }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        k.place(s.bag, 760, 900, 0.9, 6)
        s.m.update(t, { x: 470, y: 1230, scale: 1.2 + 0.04 * l, mouth: 0.1, brows: 'neutral', look: [0.2, 0], armR: [0.4, 0.5], armL: [0.3, 0.6], headTilt: 0.05 * Math.sin(t * 1.5), seed: 6 })
      },
    },
    {
      // R2 · Bernard, 71 ans, à sa fenêtre, la lueur bleue de la télé.
      t1: K.KEYS,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#0a0e18')
        svg('rect', { x: 60, y: 220, width: 960, height: 1500, fill: '#2a2620' }, g)
        svg('rect', { x: 160, y: 360, width: 760, height: 900, rx: 8, fill: '#0c1424' }, g)
        const tv = svg('ellipse', { cx: 540, cy: 900, rx: 520, ry: 520, fill: 'url(#glowBlue)' }, g)
        const b = k.makePerson(g, BERNARD)
        svg('path', { d: 'M 540 360 L 540 1260 M 160 800 L 920 800', stroke: '#2a2620', 'stroke-width': 26 }, g)
        svg('rect', { x: 120, y: 1240, width: 840, height: 50, fill: '#3a342c' }, g)
        return { tv, b }
      },
      draw(k, s, t, l) {
        s.tv.setAttribute('opacity', (0.6 + 0.3 * Math.sin(t * 13) * Math.sin(t * 7.1)).toFixed(2))
        s.b.update(t, { x: 540, y: 1130, scale: 0.95 + 0.03 * l, mouth: 0, brows: 'neutral', look: [0.1, 0.1], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 7 })
      },
    },
    {
      // R3 · Les clés sur le pare-soleil, comme toujours.
      t1: K.INAYA,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#101218')
        svg('path', { d: 'M -100 -100 L 1180 -100 L 1180 380 Q 540 300 -100 380 Z', fill: '#1c1e24' }, g)
        svg('path', { d: 'M 120 420 Q 540 360 960 420 L 1000 1500 L 80 1500 Z', fill: '#0c1424' }, g)
        bokeh(g, 10, ['#ffcf80', '#ff9a50'], 103, { op: 0.4, r0: 20, r1: 60, x0: 150, x1: 930, y0: 500, y1: 1300, vy: 0 })
        const visor = svg('g', {}, g)
        svg('rect', { x: -260, y: 0, width: 520, height: 200, rx: 30, fill: '#3a3c44', stroke: '#24262c', 'stroke-width': 8 }, visor)
        svg('rect', { x: -60, y: 60, width: 120, height: 60, rx: 8, fill: '#2a2c32' }, visor)
        const keys = svg('g', {}, g)
        svg('circle', { r: 34, fill: 'none', stroke: '#e8ecf2', 'stroke-width': 10, filter: 'url(#glow)' }, keys)
        svg('rect', { x: -22, y: 30, width: 44, height: 70, rx: 12, fill: '#14161c' }, keys)
        svg('rect', { x: -10, y: 96, width: 22, height: 140, rx: 4, fill: '#d8dce2' }, keys)
        for (const y of [170, 196, 222]) svg('rect', { x: 10, y, width: 16, height: 14, fill: '#d8dce2' }, keys)
        txt(keys, 'B.', { y: 78, 'font-size': 28, fill: '#c8ccd2' })
        return { visor, keys }
      },
      draw(k, s, t, l) {
        k.place(s.visor, 540, 380, 1.4, 0)
        const sw = 14 * Math.exp(-l * 1.5) * Math.sin(l * 6)
        s.keys.setAttribute('transform', `translate(600 560) scale(3.2) rotate(${sw.toFixed(1)})`)
      },
    },
    {
      // R4 · Inaya, née sur le parking de la maternité, à l'aube.
      t1: K.FINES,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#goldSky)')
        svg('ellipse', { cx: 560, cy: 900, rx: 640, ry: 640, fill: 'url(#sunCore)' }, g)
        const ry = rays(g, 28, '#fff0c0', 0.06)
        svg('rect', { x: 620, y: 700, width: 520, height: 500, fill: '#3a2440' }, g)
        svg('rect', { x: 700, y: 760, width: 300, height: 90, rx: 10, fill: '#1f5fd0', opacity: 0.8 }, g)
        svg('use', { href: '#birthPair', filter: 'url(#rimGold)' }, g)
        const pair = svg('g', { id: 'birthPair', filter: 'url(#backlit)' }, g)
        const m = k.makePerson(pair, MEHDI)
        const baby = svg('g', {}, pair)
        svg('ellipse', { rx: 120, ry: 80, fill: '#fff4e8' }, baby)
        svg('circle', { cx: -60, cy: -10, r: 46, fill: '#c89070' }, baby)
        svg('path', { d: 'M -78 -8 Q -70 -2 -62 -8 M -52 -8 Q -44 -2 -36 -8', stroke: '#3a2a1a', 'stroke-width': 4, fill: 'none' }, baby)
        svg('path', { d: 'M -200 1300 Q 540 1240 1300 1310 L 1300 2100 L -200 2100 Z', fill: '#1a0c16' }, g)
        const dust = bokeh(g, 30, ['#fff0c0'], 104, { op: 0.8, r0: 3, r1: 8, blur: 'blur6', vy: 16, y0: 300, y1: 1300 })
        return { ry, m, baby, dust }
      },
      draw(k, s, t, l) {
        s.ry.setAttribute('transform', `translate(560 900) rotate(${(t * 4).toFixed(1)})`)
        s.dust.draw(t)
        s.m.update(t, { x: 480, y: 1130, scale: 1.1 + 0.03 * l, mouth: 0.15, brows: 'sad', look: [0.3, 0.5], armR: [1.0, 1.5], armL: [1.0, 1.5], headTilt: 0.2, seed: 6 })
        s.baby.setAttribute('transform', `translate(500 ${(1260 + 4 * Math.sin(t * 2)).toFixed(1)}) rotate(-8)`)
      },
    },
    {
      // R5 · Trois semaines plus tard : six amendes dans la boîte aux lettres de Bernard.
      t1: K.POINTS,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#d8d2c4')
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)', opacity: 0.6 }, g)
        const box = svg('g', { transform: 'translate(540 980)' }, g)
        svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 30, fill: '#2a5a8a' }, box)
        svg('rect', { x: -220, y: -200, width: 440, height: 40, rx: 20, fill: '#10121a' }, box)
        svg('rect', { x: -160, y: -40, width: 320, height: 70, rx: 8, fill: '#ffffff' }, box)
        txt(box, 'B. MARCHAND', { y: 12, 'font-size': 40, fill: '#10121a' })
        const letters = Array.from({ length: 6 }, (_, i) => {
          const e = svg('g', { opacity: 0 }, g)
          svg('rect', { x: -170, y: -100, width: 340, height: 200, rx: 10, fill: '#ffffff', stroke: '#c8c2b2', 'stroke-width': 4 }, e)
          svg('rect', { x: -170, y: -100, width: 340, height: 40, fill: '#1f3a8a' }, e)
          txt(e, 'AVIS DE CONTRAVENTION', { y: -70, 'font-size': 22, fill: '#ffffff' })
          txt(e, 'FEU ROUGE · 135 €', { y: 20, 'font-size': 34, fill: '#c8102e' })
          return e
        })
        const total = txt(g, '', { x: 540, y: 440, 'font-size': 150, fill: '#c8102e', stroke: '#10121a', 'stroke-width': 14, 'paint-order': 'stroke fill' })
        return { letters, total }
      },
      draw(k, s, t, l) {
        let n = 0
        s.letters.forEach((e, i) => {
          const a = 0.15 + i * 0.22
          const u = k.clamp((l - a) / 0.3)
          e.setAttribute('opacity', l > a ? 1 : 0)
          if (l > a) {
            n++
            k.place(e, 540 + (i % 2 ? 30 : -30), k.lerp(-200, 760 + i * 8, k.ease.out3(u)), 1, (i % 2 ? 1 : -1) * (6 + 4 * (1 - u)))
          }
        })
        s.total.textContent = `${n * 135} €`
      },
    },
    {
      // R6 · Son permis : zéro point.
      t1: K.TODAY,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#1a0a10')
        const ry = rays(g, 18, '#ff2a3d', 0.08)
        const card = svg('g', {}, g)
        svg('rect', { x: -380, y: -240, width: 760, height: 480, rx: 34, fill: '#f2b8c8', stroke: '#10121a', 'stroke-width': 10 }, card)
        svg('rect', { x: -340, y: -190, width: 220, height: 280, rx: 14, fill: '#d8d2c4' }, card)
        txt(card, 'PERMIS DE CONDUIRE', { x: 120, y: -140, 'font-size': 40, fill: '#10121a' })
        txt(card, 'MARCHAND Bernard', { x: 120, y: -70, 'font-size': 34, fill: '#10121a' })
        const pts = txt(card, '', { x: 120, y: 120, 'font-size': 170, fill: '#c8102e' })
        txt(card, 'POINTS', { x: 120, y: 190, 'font-size': 40, fill: '#10121a' })
        return { ry, card, pts }
      },
      draw(k, s, t, l) {
        s.ry.setAttribute('transform', `translate(540 860) rotate(${(t * 10).toFixed(1)})`)
        const v = Math.max(0, 12 - Math.floor(l / 0.08))
        s.pts.textContent = String(v)
        k.place(s.card, 540, 860, 1 + (v === 0 ? 0.08 * Math.exp(-(l - 0.96) * 8) : 0), -4)
      },
    },
    {
      // E · Mehdi sous le projecteur ; le marteau.
      t1: SEC_HOOK_END,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#judgeBg)')
        svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, g)
        const bk = bokeh(g, 10, ['#bcd2ff'], 51, { op: 0.15, r0: 6, r1: 16, blur: 'blur6', vy: 14, x0: 200, x1: 880 })
        const r = k.makePerson(g, MEHDI)
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        return { bk, r, gavel }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        s.r.update(t, { x: 540, y: 1080, scale: 1.15 + 0.03 * l, brows: 'sad', look: [0, 0.2], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 6 })
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
  const bkP = bokeh(procBg, 14, ['#9fb8ff', '#ffe7b0'], 91, { op: 0.16, r0: 30, r1: 100, blur: 'blur30', vy: 8 })
  const bkA = bokeh(avoBg, 14, ['#ffb36b', '#ffe7b0'], 92, { op: 0.16, r0: 30, r1: 100, blur: 'blur30', vy: 8 })
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
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, bkP, bkA }
})

// ------------------------------------------------- 2 bis · Les plans de coupe du procès
// Chaque argument devient une image plein écran, qui entre et sort par un volet en biais (toujours vers
// la gauche : deux plans qui se suivent se poussent). Lumière, profondeur de champ, étalonnage par plan.
const FULL = (g, fill) => svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill }, g)
const heartP = (g, x, y, s, fill = '#ff2a3d') => svg('path', { d: heartD, fill, transform: `translate(${x} ${y}) scale(${s})` }, g)
const CUT_DEFS = {
  // « Sa télé était allumée, on la voyait depuis la rue » : la maison de Bernard, la nuit.
  TV: {
    build(g) {
      FULL(g, 'url(#blueNight)')
      const bk = bokeh(g, 10, ['#ffcf80', '#9fd0ff'], 111, { op: 0.3, r0: 20, r1: 60, vy: 0, y0: 200, y1: 900 })
      svg('rect', { x: 120, y: 520, width: 840, height: 900, fill: '#1c2030' }, g)
      svg('path', { d: 'M 80 540 L 540 260 L 1000 540 Z', fill: '#141824' }, g)
      const win = svg('rect', { x: 340, y: 700, width: 400, height: 320, rx: 8, fill: '#3d7bff' }, g)
      const glow = svg('ellipse', { cx: 540, cy: 860, rx: 420, ry: 360, fill: 'url(#glowBlue)' }, g)
      fig(g, { x: 560, y: 1020, s: 0.62, fill: '#0a0e18' })
      svg('path', { d: 'M 540 700 L 540 1020 M 340 860 L 740 860', stroke: '#1c2030', 'stroke-width': 16 }, g)
      svg('rect', { x: 460, y: 1120, width: 160, height: 300, fill: '#2a2620' }, g)
      svg('rect', { x: -400, y: 1420, width: 1900, height: 900, fill: '#0c0e14' }, g)
      const clock = txt(g, '03:12', { x: 540, y: 400, 'font-size': 110, fill: '#9fd0ff', filter: 'url(#glow)' })
      FULL(g, 'url(#vigCut)')
      return { bk, win, glow, clock }
    },
    draw(s, t) {
      const f = 0.65 + 0.35 * Math.sin(t * 11) * Math.sin(t * 6.3)
      s.win.setAttribute('fill', f > 0.8 ? '#6a9bff' : '#3d7bff')
      s.glow.setAttribute('opacity', f.toFixed(2))
    },
  },
  // « Il suffisait de traverser et de frapper » : vu du ciel, les deux maisons, 20 mètres.
  STREET: {
    build(g) {
      FULL(g, '#3a3c42')
      svg('rect', { x: -400, y: 820, width: 1900, height: 300, fill: '#24262c' }, g)
      for (let i = 0; i < 8; i++) svg('rect', { x: -60 + i * 160, y: 960, width: 90, height: 16, fill: '#d8d8d8' }, g)
      const house = (x, y, c, name) => {
        const h = svg('g', { transform: `translate(${x} ${y})` }, g)
        svg('rect', { x: -170, y: -150, width: 340, height: 300, fill: c, stroke: '#10121a', 'stroke-width': 8 }, h)
        svg('path', { d: 'M -170 -150 L 170 150 M 170 -150 L -170 150', stroke: '#10121a', 'stroke-width': 4, opacity: 0.3 }, h)
        const l = label(h, name, { size: 40, fill: '#ffffff', ink: '#10121a' })
        l.setAttribute('transform', 'translate(0 0)')
        return h
      }
      house(300, 560, '#8a6a5a', 'MEHDI')
      house(780, 1380, '#6a7a8a', 'BERNARD')
      const path = svg('path', { d: 'M 300 720 C 320 900 760 960 780 1220', fill: 'none', stroke: '#ffd166', 'stroke-width': 14, 'stroke-dasharray': '30 20', 'stroke-linecap': 'round', filter: 'url(#glow)' }, g)
      const len = 820
      const tag = label(g, '20 MÈTRES · 15 SECONDES', { size: 46, fill: '#ffd166', ink: '#10121a' })
      FULL(g, 'url(#vigCut)')
      return { path, len, tag }
    },
    draw(s, t, l) {
      const p = ease.io2(clamp(l / 1.2))
      s.path.setAttribute('stroke-dasharray', `30 20`)
      s.path.setAttribute('opacity', p.toFixed(2))
      place(s.tag, 540, 300, ease.back(2)(clamp((l - 0.4) / 0.3)), -2)
    },
  },
  // « Frapper, expliquer, attendre… » : les minutes qui s'additionnent.
  WAIT: {
    build(g) {
      FULL(g, 'url(#studio)')
      const ring = svg('g', { transform: 'translate(540 620)' }, g)
      svg('circle', { r: 300, fill: '#000', opacity: 0.4 }, ring)
      svg('circle', { r: 250, fill: 'none', stroke: '#2a2c34', 'stroke-width': 40 }, ring)
      const C2 = 2 * Math.PI * 250
      const arc = svg('circle', { r: 250, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 40, 'stroke-dasharray': `0 ${C2}`, transform: 'rotate(-90)', filter: 'url(#glow)' }, ring)
      const num = txt(ring, '', { y: 50, 'font-size': 150, fill: '#ffffff' })
      txt(ring, 'MINUTES', { y: 120, 'font-size': 40, fill: '#ff9aa4', 'letter-spacing': 6 })
      const steps = ['FRAPPER', 'EXPLIQUER', 'ATTENDRE…'].map((w, i) => {
        const e = label(g, `${w}  +${[1, 2, 3][i]} MIN`, { size: 46, fill: i === 2 ? '#ff2a3d' : '#ffffff', ink: i === 2 ? '#ffffff' : '#10121a' })
        e.setAttribute('opacity', 0)
        return e
      })
      return { arc, num, steps, C2 }
    },
    draw(s, t, l) {
      const ts = [0.0, 0.55, 1.1]
      let m = 0
      s.steps.forEach((e, i) => {
        const v = ease.back(2)(clamp((l - ts[i]) / 0.25))
        e.setAttribute('opacity', l > ts[i] ? 1 : 0)
        place(e, 540, 1010 + i * 100, Math.max(0.001, v), i === 2 ? -2 : 0)
        if (l > ts[i]) m += [1, 2, 3][i] * clamp((l - ts[i]) / 0.4)
      })
      s.arc.setAttribute('stroke-dasharray', `${((s.C2 * m) / 10).toFixed(1)} ${s.C2}`)
      s.num.textContent = `+${Math.round(m)}`
    },
  },
  // « …le cordon était enroulé autour du cou d'Inaya » : le monitoring qui s'emballe.
  CORD: {
    build(g) {
      FULL(g, '#04100a')
      FULL(g, 'url(#gridC)')
      const scr = svg('g', {}, g)
      svg('rect', { x: 80, y: 360, width: 920, height: 560, rx: 30, fill: '#030806', stroke: '#2a3a34', 'stroke-width': 10 }, scr)
      txt(scr, 'RYTHME CARDIAQUE DU BÉBÉ', { x: 120, y: 420, 'font-size': 32, fill: '#33ff88', 'text-anchor': 'start' })
      const curve = svg('path', { d: '', fill: 'none', stroke: '#33ff88', 'stroke-width': 7, filter: 'url(#glow)' }, scr)
      const bpm = txt(scr, '', { x: 960, y: 420, 'font-size': 60, fill: '#33ff88', 'text-anchor': 'end' })
      const alarm = svg('rect', { x: 80, y: 360, width: 920, height: 560, rx: 30, fill: '#ff2a3d', opacity: 0 }, scr)
      const lab = label(g, 'CIRCULAIRE DU CORDON', { size: 50, fill: '#ff2a3d', ink: '#ffffff' })
      FULL(g, 'url(#vigCut)')
      return { curve, bpm, alarm, lab }
    },
    draw(s, t, l) {
      const drop = clamp((l - 1.2) / 1.5)
      let d = ''
      for (let x = 0; x <= 860; x += 6) {
        const tt = x / 860
        const local = clamp((tt * 5 - (5 - l * 1.2)) / 1)
        const base = 160 - 70 * drop * (tt > 0.6 ? 1 : 0)
        const y = 860 - (base - 60) * 3.2 + 12 * Math.sin(x * 0.15 + t * 8)
        d += `${x ? 'L' : 'M'} ${110 + x} ${y.toFixed(0)} `
        void local
      }
      s.curve.setAttribute('d', d)
      const v = Math.round(160 - 72 * drop + 3 * Math.sin(t * 5))
      s.bpm.textContent = String(v)
      s.curve.setAttribute('stroke', drop > 0.4 ? '#ff4a5a' : '#33ff88')
      s.bpm.setAttribute('fill', drop > 0.4 ? '#ff4a5a' : '#33ff88')
      s.alarm.setAttribute('opacity', drop > 0.4 && Math.floor(t * 4) % 2 ? 0.18 : 0)
      place(s.lab, 540, 1080, ease.back(2)(clamp((t - (Wd('05', 'cordon') - 0.15)) / 0.25)) + 0.001, -2)
    },
  },
  // « C'est l'heure des camions de livraison » : le carrefour, les phares qui surgissent.
  TRUCK: {
    build(g) {
      FULL(g, 'url(#blueNight)')
      svg('path', { d: 'M 540 760 L 1700 1700 L -620 1700 Z', fill: '#16181e' }, g)
      svg('rect', { x: -400, y: 1000, width: 1900, height: 200, fill: '#1c1e24' }, g)
      for (let i = 0; i < 9; i++) svg('rect', { x: -40 + i * 130, y: 1220, width: 70, height: 18, fill: '#d8d8d8', opacity: 0.8 }, g)
      const fire = svg('g', { transform: 'translate(860 560)' }, g)
      svg('rect', { x: -12, y: 120, width: 24, height: 700, fill: '#2a2c32' }, fire)
      svg('rect', { x: -60, y: -160, width: 120, height: 290, rx: 22, fill: '#14161a' }, fire)
      svg('circle', { cy: -90, r: 42, fill: '#ff2a3d', filter: 'url(#glow)' }, fire)
      const truck = svg('g', {}, g)
      svg('rect', { x: -420, y: -360, width: 840, height: 520, rx: 20, fill: '#e8ecf0' }, truck)
      svg('rect', { x: 420, y: -200, width: 260, height: 360, rx: 26, fill: '#c8322a' }, truck)
      svg('rect', { x: 470, y: -160, width: 170, height: 120, rx: 10, fill: '#1a2230' }, truck)
      txt(truck, 'LIVRAISONS EXPRESS', { y: -80, 'font-size': 56, fill: '#1f3a8a' })
      for (const x of [-260, 260, 560]) svg('circle', { cx: x, cy: 170, r: 70, fill: '#0c0d10' }, truck)
      const hl = svg('ellipse', { cx: 700, cy: 80, rx: 260, ry: 160, fill: 'url(#headl)' }, truck)
      const glare = svg('ellipse', { cx: 1000, cy: 1100, rx: 900, ry: 700, fill: 'url(#headl)', opacity: 0 }, g)
      FULL(g, 'url(#vigCut)')
      return { truck, glare, hl }
    },
    draw(s, t, l) {
      const p = ease.io2(clamp(l / 1.5))
      s.truck.setAttribute('transform', `translate(${lerp(1900, 380, p).toFixed(0)} 1000) scale(0.95)`)
      s.glare.setAttribute('opacity', (0.8 * Math.exp(-Math.abs(l - 0.5) * 3)).toFixed(2))
    },
  },
  // « …il jouait trois vies pour en sauver une » : la balance des cœurs.
  LIVES: {
    build(g) {
      FULL(g, 'url(#redRoom)')
      const ry = rays(g, 16, '#ff5060', 0.12)
      const beam = svg('g', {}, g)
      svg('rect', { x: -380, y: -14, width: 760, height: 28, rx: 14, fill: 'url(#gold)', filter: 'url(#glow)' }, beam)
      svg('rect', { x: 524, y: 780, width: 32, height: 480, fill: 'url(#gold)' }, g)
      const pan = (title, n, col) => {
        const p = svg('g', {}, g)
        svg('path', { d: 'M 0 0 L -130 230 M 0 0 L 130 230', stroke: '#e8b23a', 'stroke-width': 6 }, p)
        svg('path', { d: 'M -170 230 Q 0 320 170 230 Z', fill: 'url(#gold)' }, p)
        for (let i = 0; i < n; i++) heartP(p, (i - (n - 1) / 2) * 90, 200, 1.0, col)
        txt(p, title, { y: 390, 'font-size': 38, fill: '#ffffff' })
        return p
      }
      const left = pan('3 VIES EN JEU', 3, '#ff2a3d')
      const right = pan('1 VIE À SAUVER', 1, '#ffd166')
      return { ry, beam, left, right }
    },
    draw(s, t, l) {
      s.ry.setAttribute('transform', `translate(540 700) rotate(${(t * 10).toFixed(1)})`)
      const a = -12 * ease.back(2)(clamp(l / 0.6)) + 2 * Math.sin(t * 3)
      const r = (a * Math.PI) / 180
      s.beam.setAttribute('transform', `translate(540 780) rotate(${a.toFixed(2)})`)
      place(s.left, 540 - 300 * Math.cos(r), 780 - 300 * Math.sin(r), 1, 0)
      place(s.right, 540 + 300 * Math.cos(r), 780 + 300 * Math.sin(r), 1, 0)
    },
  },
  // « C'est écrit dans le Code pénal, article 122-7 » : le livre rouge, l'article surligné.
  CODE: {
    build(g) {
      FULL(g, 'url(#studio)')
      svg('ellipse', { cx: 540, cy: 800, rx: 560, ry: 700, fill: 'url(#spot)' }, g)
      const book = svg('g', { transform: 'translate(540 860)' }, g)
      svg('rect', { x: -470, y: -560, width: 940, height: 1000, rx: 20, fill: '#9a1020' }, book)
      svg('rect', { x: -440, y: -530, width: 880, height: 940, rx: 10, fill: '#f6f0e2' }, book)
      svg('path', { d: 'M 0 -530 L 0 410', stroke: '#d8ceb8', 'stroke-width': 6 }, book)
      txt(book, 'CODE PÉNAL', { y: -460, 'font-size': 44, fill: '#9a1020', 'letter-spacing': 6 })
      txt(book, 'Article 122-7', { y: -380, 'font-size': 64, fill: '#10121a' })
      const L = [
        'N’est pas pénalement responsable',
        'la personne qui, face à un danger',
        'actuel ou imminent qui menace',
        'elle-même, autrui ou un bien,',
        'accomplit un acte nécessaire',
        'à la sauvegarde de la personne,',
        'sauf s’il y a disproportion',
        'entre les moyens employés',
        'et la gravité de la menace.',
      ]
      const lines = L.map((s2, i) => {
        const hl = svg('rect', { x: -420, y: -320 + i * 72, width: 840, height: 56, rx: 8, fill: i >= 6 ? '#ff6a78' : '#ffd166', opacity: 0 }, book)
        txt(book, s2, { y: -280 + i * 72, 'font-size': 40, fill: '#10121a', 'font-weight': 700 })
        return hl
      })
      FULL(g, 'url(#vigCut)')
      return { lines }
    },
    draw(s, t, l) {
      s.lines.forEach((h, i) => {
        const a = i < 6 ? 0.2 + i * 0.45 : 4.4 + (i - 6) * 0.35
        h.setAttribute('opacity', (0.75 * clamp((l - a) / 0.25)).toFixed(2))
      })
    },
  },
  // « …il a rapporté la voiture, le plein fait, avec des chocolats ».
  CHOCO: {
    build(g) {
      FULL(g, '#cfe0ee')
      svg('rect', { x: -400, y: 1180, width: 1900, height: 900, fill: '#8a8c92' }, g)
      svg('rect', { x: 0, y: 380, width: 1080, height: 800, fill: '#e8dcc8' }, g)
      svg('rect', { x: 680, y: 640, width: 220, height: 540, fill: '#6a4a30' }, g)
      const car = svg('g', { transform: 'translate(500 1260)' }, g)
      svg('path', { d: 'M -420 0 L -400 -170 Q -380 -220 -320 -230 L -200 -360 Q -170 -390 -120 -390 L 160 -390 Q 220 -390 250 -350 L 360 -230 Q 420 -220 430 -170 L 440 0 Z', fill: '#c8ccd2', stroke: '#8a909a', 'stroke-width': 6 }, car)
      svg('path', { d: 'M -180 -340 L 230 -340 L 320 -235 L -280 -235 Z', fill: '#2a3040' }, car)
      for (const x of [-260, 270]) svg('circle', { cx: x, cy: 0, r: 80, fill: '#14161c' }, car)
      const box = svg('g', { transform: 'translate(120 -255)' }, car)
      svg('rect', { x: -110, y: -50, width: 220, height: 60, rx: 8, fill: '#7a3a1a' }, box)
      svg('path', { d: 'M -110 -20 L 110 -20 M 0 -50 L 0 10', stroke: '#ffd166', 'stroke-width': 10 }, box)
      const fuel = svg('g', { transform: 'translate(820 420)' }, g)
      svg('circle', { r: 150, fill: '#10121a', stroke: '#3a3c44', 'stroke-width': 10 }, fuel)
      txt(fuel, 'E', { x: -100, y: 60, 'font-size': 40, fill: '#ff6a78' })
      txt(fuel, 'F', { x: 100, y: 60, 'font-size': 40, fill: '#33ff88' })
      const needle = svg('path', { d: 'M 0 0 L 0 -120', stroke: '#ffd166', 'stroke-width': 10, 'stroke-linecap': 'round' }, fuel)
      return { needle }
    },
    draw(s, t, l) {
      const a = lerp(-70, 70, ease.out3(clamp(l / 1.2)))
      s.needle.setAttribute('transform', `rotate(${a.toFixed(1)})`)
    },
  },
  // « Les six amendes… dans la boîte aux lettres de Bernard ».
  MAIL: {
    build(g) {
      FULL(g, '#d8d2c4')
      FULL(g, 'url(#vigCut)')
      const box = svg('g', { transform: 'translate(540 1040)' }, g)
      svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 30, fill: '#2a5a8a' }, box)
      svg('rect', { x: -220, y: -200, width: 440, height: 40, rx: 20, fill: '#10121a' }, box)
      txt(box, 'B. MARCHAND', { y: 12, 'font-size': 40, fill: '#ffffff' })
      const letters = Array.from({ length: 6 }, (_, i) => {
        const e = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -170, y: -100, width: 340, height: 200, rx: 10, fill: '#ffffff', stroke: '#c8c2b2', 'stroke-width': 4 }, e)
        svg('rect', { x: -170, y: -100, width: 340, height: 40, fill: '#1f3a8a' }, e)
        txt(e, 'AVIS DE CONTRAVENTION', { y: -70, 'font-size': 22, fill: '#ffffff' })
        txt(e, `${i + 1} / 6 · 135 €`, { y: 20, 'font-size': 36, fill: '#c8102e' })
        return e
      })
      const total = txt(g, '', { x: 540, y: 420, 'font-size': 150, fill: '#c8102e', stroke: '#10121a', 'stroke-width': 14, 'paint-order': 'stroke fill' })
      return { letters, total }
    },
    draw(s, t, l) {
      let n = 0
      s.letters.forEach((e, i) => {
        const a = 0.1 + i * 0.35
        const u = clamp((l - a) / 0.3)
        e.setAttribute('opacity', l > a ? 1 : 0)
        if (l > a) {
          n++
          place(e, 540 + (i % 2 ? 26 : -26), lerp(-200, 640 + i * 10, ease.out3(u)), 1, (i % 2 ? 1 : -1) * 6)
        }
      })
      s.total.textContent = `${n * 135} €`
    },
  },
  // « Bernard va chez son cardiologue en bus, avec deux changements ».
  BUS: {
    build(g) {
      FULL(g, '#8a96a4')
      const rain = svg('g', { opacity: 0.5 }, g)
      const r = rng(121)
      for (let i = 0; i < 90; i++) svg('path', { d: `M ${(r() * 1200 - 60).toFixed(0)} ${(r() * 2000).toFixed(0)} l -14 50`, stroke: '#e8f0f8', 'stroke-width': 3 }, rain)
      svg('rect', { x: -400, y: 1250, width: 1900, height: 900, fill: '#5a6068' }, g)
      const shelter = svg('g', {}, g)
      svg('rect', { x: 140, y: 560, width: 800, height: 30, fill: '#3a4048' }, shelter)
      svg('rect', { x: 160, y: 590, width: 760, height: 660, fill: '#cfe0ee', opacity: 0.25 }, shelter)
      svg('rect', { x: 860, y: 500, width: 130, height: 130, rx: 20, fill: '#1f5fd0' }, shelter)
      txt(shelter, 'BUS', { x: 925, y: 580, 'font-size': 44, fill: '#ffffff' })
      const b = makePerson(g, BERNARD)
      svg('rect', { x: 260, y: 1180, width: 560, height: 40, fill: '#3a4048' }, g)
      const map = svg('g', { transform: 'translate(540 330)' }, g)
      svg('rect', { x: -440, y: -110, width: 880, height: 220, rx: 24, fill: '#ffffff' }, map)
      svg('path', { d: 'M -360 0 L -120 0 M -120 0 L 120 0 M 120 0 L 360 0', stroke: '#1f5fd0', 'stroke-width': 14 }, map)
      for (const [x, c] of [[-360, '#10121a'], [-120, '#ff2a3d'], [120, '#ff2a3d'], [360, '#12a150']]) svg('circle', { cx: x, cy: 0, r: 26, fill: c, stroke: '#ffffff', 'stroke-width': 6 }, map)
      txt(map, 'DOMICILE', { x: -360, y: -48, 'font-size': 26, fill: '#10121a' })
      txt(map, 'CHANGEMENT', { x: -120, y: 66, 'font-size': 24, fill: '#ff2a3d' })
      txt(map, 'CHANGEMENT', { x: 120, y: 66, 'font-size': 24, fill: '#ff2a3d' })
      txt(map, 'CARDIOLOGUE', { x: 360, y: -48, 'font-size': 26, fill: '#12a150' })
      txt(map, '1 H 10', { x: 0, y: -48, 'font-size': 34, fill: '#10121a' })
      FULL(g, 'url(#vigCut)')
      return { rain, b }
    },
    draw(s, t, l) {
      s.rain.setAttribute('transform', `translate(${((-t * 140) % 50).toFixed(0)} ${((t * 900) % 50).toFixed(0)})`)
      s.b.update(t, { x: 540, y: 1100, scale: 0.85, mouth: 0, brows: 'sad', look: [-0.2, 0.3], armR: [0.15, 0.3], armL: [0.15, 0.3], headTilt: -0.08, seed: 7 })
    },
  },
  // « Il gagne 1 300 euros par mois, il a demandé un échéancier ».
  PAY: {
    build(g) {
      FULL(g, '#e8e2d4')
      const slip = svg('g', { transform: 'translate(540 520) rotate(-3)' }, g)
      svg('rect', { x: -400, y: -230, width: 800, height: 460, rx: 14, fill: '#ffffff', stroke: '#c8c2b2', 'stroke-width': 4 }, slip)
      txt(slip, 'BULLETIN DE SALAIRE', { y: -160, 'font-size': 40, fill: '#10121a', 'letter-spacing': 3 })
      for (let i = 0; i < 4; i++) svg('rect', { x: -330, y: -110 + i * 50, width: 480 - i * 60, height: 18, rx: 9, fill: '#e2ddd0' }, slip)
      txt(slip, 'NET À PAYER', { x: -200, y: 160, 'font-size': 38, fill: '#10121a' })
      txt(slip, '1 300 €', { x: 220, y: 170, 'font-size': 84, fill: '#12a150' })
      const cal = svg('g', { transform: 'translate(540 1080)' }, g)
      txt(cal, 'ÉCHÉANCIER PROPOSÉ', { y: -170, 'font-size': 44, fill: '#10121a' })
      const bars = Array.from({ length: 6 }, (_, i) => {
        const b = svg('g', { transform: `translate(${-375 + i * 150} 0)` }, cal)
        svg('rect', { x: -60, y: -110, width: 120, height: 200, rx: 14, fill: '#1f3a8a' }, b)
        txt(b, ['JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN'][i], { y: -60, 'font-size': 30, fill: '#ffffff' })
        txt(b, '135 €', { y: 30, 'font-size': 32, fill: '#ffd166' })
        b.setAttribute('opacity', 0)
        return b
      })
      return { bars }
    },
    draw(s, t, l) {
      s.bars.forEach((b, i) => {
        const v = ease.back(2)(clamp((l - 0.6 - i * 0.18) / 0.25))
        b.setAttribute('opacity', v > 0.01 ? 1 : 0)
        b.setAttribute('transform', `translate(${-375 + i * 150} 0) scale(${Math.max(0.001, v).toFixed(3)})`)
      })
    },
  },
  // « …chaque voiture garée devient un taxi ».
  TAXI: {
    build(g) {
      FULL(g, 'url(#blueNight)')
      svg('rect', { x: -400, y: 1100, width: 1900, height: 900, fill: '#1c1e24' }, g)
      for (let i = 0; i < 6; i++) {
        const x = -60 + i * 180
        svg('rect', { x, y: 500, width: 170, height: 600, fill: '#141824' }, g)
      }
      const cars = Array.from({ length: 5 }, (_, i) => {
        const c = svg('g', { transform: `translate(${120 + i * 210} ${1060 + (i % 2) * 140}) scale(0.62)` }, g)
        svg('path', { d: 'M -170 0 L -160 -70 Q -150 -95 -120 -100 L -80 -150 Q -66 -165 -40 -165 L 60 -165 Q 90 -165 104 -150 L 150 -100 Q 175 -95 180 -70 L 185 0 Z', fill: ['#c8ccd2', '#c8322a', '#2a5a8a', '#e8e8e8', '#3a3c44'][i] }, c)
        for (const x of [-100, 110]) svg('circle', { cx: x, cy: 0, r: 38, fill: '#0c0d10' }, c)
        const sign = svg('g', { transform: 'translate(0 -185)', opacity: 0 }, c)
        svg('rect', { x: -70, y: -30, width: 140, height: 50, rx: 10, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5, filter: 'url(#glow)' }, sign)
        txt(sign, 'TAXI', { y: 10, 'font-size': 34, fill: '#10121a' })
        return sign
      })
      FULL(g, 'url(#vigCut)')
      return { cars }
    },
    draw(s, t, l) {
      s.cars.forEach((sg, i) => {
        const v = ease.back(2.4)(clamp((l - 1.6 - i * 0.22) / 0.25))
        sg.setAttribute('opacity', v > 0.01 ? 1 : 0)
        sg.setAttribute('transform', `translate(0 -185) scale(${Math.max(0.001, v).toFixed(3)})`)
      })
    },
  },
  // « Il ne s'excusera pas d'avoir fait naître sa fille » : Mehdi et Inaya, à contre-jour.
  BABY: {
    build(g) {
      FULL(g, 'url(#goldSky)')
      const sun = svg('g', { transform: 'translate(600 760)' }, g)
      svg('ellipse', { rx: 700, ry: 700, fill: 'url(#sunCore)' }, sun)
      const ry = rays(sun, 30, '#fff0c0', 0.06)
      svg('use', { href: '#babyPair', filter: 'url(#rimGold)' }, g)
      const pair = svg('g', { id: 'babyPair', filter: 'url(#backlit)' }, g)
      const m = makePerson(pair, MEHDI)
      const baby = svg('g', {}, pair)
      svg('ellipse', { rx: 130, ry: 86, fill: '#fff4e8' }, baby)
      svg('circle', { cx: -66, cy: -10, r: 50, fill: '#c89070' }, baby)
      svg('path', { d: 'M -86 -8 Q -78 -2 -70 -8 M -58 -8 Q -50 -2 -42 -8', stroke: '#3a2a1a', 'stroke-width': 4, fill: 'none' }, baby)
      svg('path', { d: 'M -200 1360 Q 540 1290 1300 1350 L 1300 2100 L -200 2100 Z', fill: '#1a0c16' }, g)
      const dust = bokeh(g, 36, ['#fff0c0', '#ffd38a'], 131, { op: 0.8, r0: 3, r1: 9, blur: 'blur6', vy: 16, y0: 300, y1: 1400 })
      FULL(g, 'url(#vigCut)').setAttribute('opacity', 0.5)
      return { ry, m, baby, dust }
    },
    draw(s, t, l) {
      s.ry.setAttribute('transform', `rotate(${(t * 4).toFixed(1)})`)
      s.dust.draw(t)
      s.m.update(t, { x: 500, y: 1080, scale: 1.15, mouth: 0.1, brows: 'sad', look: [0.3, 0.5], armR: [1.0, 1.5], armL: [1.0, 1.5], headTilt: 0.2, seed: 6 })
      s.baby.setAttribute('transform', `translate(520 ${(1230 + 4 * Math.sin(t * 2)).toFixed(1)}) rotate(-8) scale(1.1)`)
    },
  },
}
const CUTS = Object.entries(C.cuts).filter(([id]) => CUT_DEFS[id]).map(([id, span], i) => {
  const D = CUT_DEFS[id]
  const wrap = svg('g', { display: 'none' }, TRIB.L.hud)
  const cp = svg('clipPath', { id: `cut${i}` }, defs)
  const clip = svg('path', { d: '' }, cp)
  const body = svg('g', { 'clip-path': `url(#cut${i})` }, wrap)
  const inner = svg('g', {}, body)
  const edge = svg('path', { d: '', fill: '#ffd166', opacity: 0 }, wrap)
  return { id, span, wrap, clip, inner, edge, draw: D.draw, st: D.build(inner) ?? {} }
})
// Le plan de coupe à l'instant t (le volet en biais, la lente poussée de caméra).
function drawCuts(t) {
  let covered = false
  for (const c of CUTS) {
    const [a, b] = c.span
    const on = t >= a - 0.1 && t < b + 0.12
    show(c.wrap, on)
    if (!on) continue
    const ein = ease.io2(clamp((t - (a - 0.1)) / 0.22))
    const eout = ease.io2(clamp((t - (b - 0.1)) / 0.22))
    const e = lerp(1500, -10, ein)
    const f = t < b - 0.1 ? 3200 : lerp(1500, -10, eout)
    c.clip.setAttribute('d', `M ${e.toFixed(1)} -10 L ${f.toFixed(1)} -10 L ${(f - 420).toFixed(1)} 1930 L ${(e - 420).toFixed(1)} 1930 Z`)
    const x = ein < 1 ? e : f
    c.edge.setAttribute('d', `M ${(x - 6).toFixed(1)} -10 L ${(x + 26).toFixed(1)} -10 L ${(x - 394).toFixed(1)} 1930 L ${(x - 426).toFixed(1)} 1930 Z`)
    c.edge.setAttribute('opacity', (ein > 0 && ein < 1) || (eout > 0 && eout < 1) ? 1 : 0)
    if (ein >= 1 && eout <= 0) covered = true
    const l = t - a
    const [sx, sy] = shakeAt(t, 0)
    c.inner.setAttribute('transform', `translate(${(540 + sx).toFixed(1)} ${(960 + sy).toFixed(1)}) scale(${(1.03 + (0.04 * l) / (b - a)).toFixed(4)}) translate(-540 -960)`)
    c.draw(c.st, t, l)
  }
  return covered
}

// ------------------------------------------------- 3 · Le vote : Rachid face à Kevin (le bandage)
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const bk = bokeh(L.far, 16, ['#9fb8ff', '#ff9ab0', '#ffe7b0'], 93, { op: 0.18, r0: 30, r1: 100, blur: 'blur30', vy: 10 })
  const mehdi = makePerson(L.actor, MEHDI)
  const bernard = makePerson(L.actor, BERNARD)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  txt(L.front, 'MEHDI', { x: 270, y: 1820, 'font-size': 64, fill: '#ffffff', 'letter-spacing': 4 })
  txt(L.front, 'BERNARD', { x: 810, y: 1820, 'font-size': 64, fill: '#ffffff', 'letter-spacing': 4 })
  return { bk, mehdi, bernard }
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
// L'ouverture : l'affaire en une image.
fs(tag('SA FEMME ACCOUCHAIT', 'pill yellow', { t0: 0, t1: K.LIVE0 - 0.1, y: 300, rot: -2 }), 60)
fs(tag('IL A VOLÉ LA VOITURE DU VOISIN', 'pill red', { t0: K.INTRO_VOL, t1: K.LIVE0 - 0.1, y: 420, rot: 2 }), 54)
fs(tag('6 FEUX ROUGES', 'slam white', { t0: K.INTRO_FEUX, t1: K.LIVE0 - 0.1, y: 590, rot: -3, from: 2.4, dur: 0.18 }), 120)
fs(tag('HÉROS OU COUPABLE ?', 'slam yellow', { t0: Wd('00', 'rouges') + 0.15, t1: K.LIVE0 - 0.1, y: 760, rot: 3, from: 2.6, dur: 0.18 }), 84)
fs(tag('LA NUIT DU 14 MARS · 3 H 12', 'pill', { t0: K.LIVE0 + 0.05, t1: K.LIVE0 + 1.8, y: 620, rot: -2 }), 46)
// Le replay.
fs(tag('MEHDI · 29 ANS · LIVREUR', 'pill yellow', { t0: K.REPLAY, t1: K.BERNARD - 0.06, y: 300, rot: -2 }), 56)
fs(tag('BERNARD · 71 ANS · LE VOISIN', 'pill', { t0: K.BERNARD, t1: K.KEYS - 0.06, y: 300, rot: 2 }), 54)
fs(tag('LES CLÉS SUR LE PARE-SOLEIL', 'pill yellow', { t0: K.KEYS, t1: K.INAYA - 0.06, y: 1660, rot: -2 }), 54)
fs(tag('INAYA · NÉE SUR LE PARKING', 'pill', { t0: K.INAYA, t1: K.FINES - 0.06, y: 300, rot: 2 }), 54)
fs(tag('3 SEMAINES PLUS TARD', 'pill', { t0: K.FINES, t1: K.POINTS - 0.06, y: 1660, rot: -2 }), 50)
fs(tag('PERMIS : 0 POINT', 'slam yellow', { t0: Wd('03', 'zero') - 0.1, t1: K.TODAY - 0.06, y: 1660, rot: -3, from: 2.6, dur: 0.18 }), 96)
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.25, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('VOL · MISE EN DANGER D’AUTRUI', 'pill red', { t0: S('04') + 0.05, t1: C.hot[0][0] - 0.05, y: 300, rot: -2 }), 52)
fs(tag('« IL A CHOISI. »', 'slam yellow', { t0: Wd('04', 'choisi') - 0.15, t1: C.hot[0][1], y: 340, rot: -4, from: 2.8, dur: 0.15 }), 120)
fs(tag('LA TÉLÉ ÉTAIT ALLUMÉE', 'pill yellow', { t0: Wd('04', 'tele') - 0.12, t1: C.cuts.TV[1] - 0.05, y: 1660, rot: -2 }), 56)
fs(tag('« FRAPPER, EXPLIQUER… »', 'slam white', { t0: S('05') + 0.3, t1: C.cuts.WAIT[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 76)
fs(tag('6 FEUX ROUGES À 3 H', 'slam white', { t0: S('06') - 0.05, t1: C.cuts.TRUCK[0] - 0.05, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 92)
fs(tag('MISE EN DANGER D’AUTRUI', 'slam yellow', { t0: Wd('06', 'mise') - 0.15, t1: E('06') + 0.15, y: 340, rot: -4, from: 2.8, dur: 0.15 }), 80)
fs(tag('L’ÉTAT DE NÉCESSITÉ', 'slam yellow', { t0: Wd('07', 'letat') - 0.15, t1: C.cuts.CODE[0] - 0.05, y: 340, rot: 3, from: 2.8, dur: 0.15 }), 96)
fs(tag('UN PÈRE QUI SAUVE SA FILLE<br>OU UN VOLEUR ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 74)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
fs(tag('LE LENDEMAIN', 'pill', { t0: S('09') - 0.05, t1: C.cuts.CHOCO[1] - 0.05, y: 300, rot: -2 }), 54)
fs(tag('2 CHANGEMENTS · 1 H 10', 'pill red', { t0: Wd('09', 'deux') - 0.12, t1: C.cuts.BUS[1] - 0.05, y: 1660, rot: 2 }), 52)
fs(tag('« IL A PROPOSÉ DE TOUT PAYER »', 'slam white', { t0: S('10') - 0.05, t1: C.cuts.PAY[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 64)
fs(tag('BERNARD A PORTÉ PLAINTE.', 'slam yellow', { t0: Wd('10', 'bernard') - 0.1, t1: E('10') + 0.15, y: 340, rot: -3, from: 2.6, dur: 0.18 }), 76)
fs(tag('« UNE URGENCE N’EFFACE PAS TOUT »', 'slam white', { t0: S('11') - 0.05, t1: C.cuts.TAXI[0] - 0.05, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 58)
fs(tag('« LE TEMPS DE DEMANDER. »', 'pill yellow', { t0: Wd('12', 'temps') - 0.12, t1: SEC.tribunal.t1, y: 300, rot: -2 }), 54)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('13') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('13', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('13', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecris') - 0.1, y: 780 }), 44)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
const arrow2 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('13', 'prochain') - 0.1, y: 1285 }), 42)
for (const a of [arrow1, arrow2]) a.update = (t) => (a.x = 540 + 14 * Math.max(0, Math.sin((t - a.t0) * 7)))
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', mehdi: 'MEHDI, AU VOLANT', sarah: 'SARAH, À L’ARRIÈRE' }

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
  [K.INTRO_VOL, 10],
  [K.LIVE0, 10],
  ...K.FLASHES.map((t) => [t, 12]),
  [K.ARRIVE - 0.4, 16],
  [K.REPLAY, 10],
  [K.BERNARD, 8],
  [K.INAYA, 8],
  [K.FINES, 8],
  [K.POINTS + 0.96, 14],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [C.cuts.TRUCK[0] + 0.45, 14],
  [C.cuts.LIVES[0], 10],
  [C.cuts.CODE[0] + 4.4, 8],
  [C.cuts.TAXI[0] + 1.6, 8],
  [Wd('06', 'mise') - 0.15, 12],
  [Wd('07', 'letat') - 0.15, 10],
  [Wd('10', 'bernard') - 0.1, 10],
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
    const rw = (t >= K.REWIND && t < K.REPLAY) || (t >= K.LIVE0 - 0.35 && t < K.LIVE0 + 0.05)
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
    const grave = id === '11' || id === '12'
    const covered = drawCuts(t)
    TRIB.bkP.draw(t)
    TRIB.bkA.draw(t)
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
    if (!pause && !covered)
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
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.bk.draw(t)
    VOTE.mehdi.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'sad', look: [0.3, 0], armR: [0.4, 0.3], armL: [0.4, 0.3], seed: 3.1 })
    VOTE.bernard.update(t, { x: 800, y: 1460, scale: 0.88, brows: 'angry', look: [-0.3, 0.1], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 0.7 })
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
