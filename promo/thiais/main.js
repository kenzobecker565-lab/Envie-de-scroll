/**
 * ============================================================================
 *  « Affaire Classée ? » — Le vrai verdict : Thiais (1080 × 1920)
 * ============================================================================
 *  Affaire réelle (d'après Le Parisien) : Pablo, 20 ans, attaqué au couteau
 *  pour sa voiture, tue l'un des agresseurs ; 12 ans, légitime défense
 *  écartée. L'ouverture pose l'affaire en une phrase, la reconstitution est
 *  une caméra de surveillance en un seul plan ; les plaidoiries sont
 *  reconstituées d'après les motifs ; le vrai verdict ; le vote par chiffre.
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
// Le personnage (silhouette générique : on ne représente pas la vraie personne).
const PABLO = { robe: '#3a4a6a', jabot: false, collar: '#2a3450', hair: 'short', hairColor: '#1a120c', skin: '#d9a07a', iris: '#1a120c' }
const T = K
// Le parking de nuit vu par une caméra de surveillance (partagé par l'ouverture et la reconstitution).
function cctvParking(k, g, id) {
  const { svg, txt } = k
  const world = svg('g', {}, g)
  const far = svg('g', { filter: 'url(#desat)' }, world)
  svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#14161c' }, far)
  for (let i = 0; i < 7; i++) svg('rect', { x: -80 + i * 170, y: 300 + (i % 3) * 50, width: 160, height: 520, fill: '#1c2028' }, far)
  svg('rect', { x: -400, y: 820, width: 1900, height: 1400, fill: '#2a2c32' }, far)
  for (let i = 0; i < 7; i++) svg('path', { d: `M ${-60 + i * 200} 900 L ${-160 + i * 230} 1500`, stroke: '#d8d8d8', 'stroke-width': 8, opacity: 0.5 }, far)
  for (const x of [120, 900]) {
    svg('rect', { x: x - 8, y: 380, width: 16, height: 480, fill: '#3a3c44' }, far)
    svg('ellipse', { cx: x, cy: 640, rx: 360, ry: 420, fill: 'url(#lampG)', opacity: 0.55 }, far)
  }
  // La voiture blanche, de profil, Pablo et sa compagne à l'intérieur.
  const car = svg('g', { transform: 'translate(560 1180)' }, far)
  svg('ellipse', { cy: 10, rx: 360, ry: 26, fill: '#000', opacity: 0.6 }, car)
  svg('path', { d: 'M -340 0 L -330 -110 Q -320 -140 -280 -150 L -190 -250 Q -165 -275 -120 -275 L 120 -275 Q 165 -275 190 -245 L 270 -150 Q 330 -140 345 -100 L 350 0 Z', fill: '#e8ecf0' }, car)
  svg('path', { d: 'M -170 -235 L 170 -235 L 245 -155 L -255 -155 Z', fill: '#20242c' }, car)
  for (const x of [-210, 220]) svg('circle', { cx: x, cy: 0, r: 64, fill: '#0c0d10' }, car)
  const heads = svg('g', {}, car)
  for (const x of [-90, 90]) svg('circle', { cx: x, cy: -190, r: 34, fill: '#3a3024' }, heads)
  // Les agresseurs, Pablo dehors, la compagne.
  const a1 = fig(world, { fill: '#08090c', head: '#08090c', armR: 70 })
  const a2 = fig(world, { fill: '#08090c', head: '#08090c', armR: 20 })
  const pab = fig(world, { fill: '#3a4a6a', head: '#3a3024', armR: 40, armL: 30 })
  const knife = svg('g', {}, world)
  svg('path', { d: 'M 0 0 L 60 -8 L 0 -18 Z', fill: '#ffffff', filter: 'url(#glow)' }, knife)
  svg('rect', { x: -26, y: -16, width: 28, height: 14, rx: 4, fill: '#3a2a1a' }, knife)
  const blue = svg('g', { opacity: 0, style: 'mix-blend-mode:screen' }, g)
  const bA = svg('ellipse', { cx: 1000, cy: 900, rx: 900, ry: 1100, fill: 'url(#ambB)' }, blue)
  const scan = svg('pattern', { id: `scan${id}`, width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, k.defs)
  svg('rect', { width: 8, height: 3, fill: '#000', opacity: 0.3 }, scan)
  svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: `url(#scan${id})` }, g)
  svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
  const glitch = svg('g', { opacity: 0 }, g)
  for (let i = 0; i < 6; i++) svg('rect', { x: -100, y: 200 + i * 260, width: 1300, height: 24 + (i % 3) * 18, fill: '#ffffff', opacity: 0.35 }, glitch)
  const hud = svg('g', {}, g)
  for (const [x, y, sx, sy] of [[50, 190, 1, 1], [1030, 190, -1, 1], [50, 1870, 1, -1], [1030, 1870, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 60} L ${x} ${y} L ${x + sx * 60} ${y}`, stroke: '#ffffff', 'stroke-width': 7, fill: 'none', opacity: 0.8 }, hud)
  const rec = svg('circle', { cx: 90, cy: 1820, r: 13, fill: '#ff2a3d' }, hud)
  txt(hud, 'CAM 02 · PARKING · RECONSTITUTION', { x: 115, y: 1832, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', opacity: 0.85 })
  const clock = txt(hud, '', { x: 1010, y: 1832, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'end', opacity: 0.85 })
  return { world, car, heads, a1, a2, pab, knife, blue, bA, glitch, rec, clock }
}
function hud(s, t) {
  s.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2)
  s.clock.textContent = `01/10/2020 · 21:4${Math.min(9, 2 + Math.floor(t / 8))}:${String(Math.floor((t * 1.0) % 60)).padStart(2, '0')}`
}
const figAt = (el, x, y, sc, rot = 0) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc})`)

const SHOTS = [
    {
      // I · L'ouverture : l'image de la caméra, figée au moment de la menace. L'affaire en une phrase.
      t1: K.LIVE0,
      build(k, g) {
        const s = cctvParking(k, g, 'I')
        s.ring = svg('ellipse', { cx: 560, cy: 1080, rx: 470, ry: 230, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 10, 'stroke-dasharray': '30 16', filter: 'url(#glow)' }, s.world)
        return s
      },
      draw(k, s, t, l) {
        figAt(s.a1, 300, 1190, 0.55)
        figAt(s.a2, 180, 1200, 0.55)
        s.pab.setAttribute('opacity', 0)
        s.knife.setAttribute('transform', `translate(${385} ${1035}) rotate(-20)`)
        s.world.setAttribute('transform', `translate(540 1000) scale(${(1.35 + 0.05 * l).toFixed(4)}) translate(-480 -1080)`)
        s.ring.setAttribute('stroke-dashoffset', (-t * 60).toFixed(0))
        hud(s, t)
      },
    },
    {
      // S · La reconstitution, en un seul plan de caméra de surveillance.
      t1: K.COURT,
      build(k, g) {
        return cctvParking(k, g, 'S')
      },
      draw(k, s, t, l) {
        // Les deux agresseurs entrent par la gauche, jusqu'à la portière.
        const w = k.ease.io2(k.clamp((t - T.ARRIVE) / (T.KEYS - T.ARRIVE)))
        const out = t > T.HURT
        const fight = t > T.FIGHT && t < T.DOWN
        const jit = fight ? 14 * Math.sin(t * 37) : 0
        if (!out) {
          figAt(s.a1, k.lerp(-200, 330, w), 1190, 0.55)
          figAt(s.a2, k.lerp(-320, 220, w), 1200, 0.55)
          s.pab.setAttribute('opacity', 0)
        } else {
          s.pab.setAttribute('opacity', 1)
          const down = k.ease.out3(k.clamp((t - T.DOWN) / 0.5))
          figAt(s.a1, 360 + jit, 1190 + 40 * down, 0.55, -88 * down)
          figAt(s.a2, 640 - jit, 1210, 0.55)
          figAt(s.pab, 470 - jit * 0.8, 1200, 0.58)
        }
        // Le couteau : chez l'agresseur, puis arraché par Pablo.
        const kn = t < T.KNIFE ? 0 : 1
        s.knife.setAttribute('opacity', kn)
        if (t < T.GRAB) s.knife.setAttribute('transform', `translate(${(k.lerp(-200, 330, w) + 90).toFixed(1)} 1035) rotate(-20)`)
        else {
          const g = k.ease.io2(k.clamp((t - T.GRAB) / 0.35))
          s.knife.setAttribute('transform', `translate(${k.lerp(450, 520, g).toFixed(1)} ${k.lerp(1035, 1060, g).toFixed(1)}) rotate(${k.lerp(-20, 160, g).toFixed(1)})`)
        }
        // La caméra : lente poussée vers la voiture ; la bagarre brouille l'image ; les gyrophares.
        const z = 1.5 + 0.015 * l
        s.heads.setAttribute('opacity', out ? 0.3 : 1)
        s.world.setAttribute('transform', `translate(${540 + jit * 0.3} 960) scale(${z.toFixed(4)}) translate(-470 -1080)`)
        s.glitch.setAttribute('opacity', fight || (t > T.HURT && t < T.HURT + 0.25) ? (0.6 + 0.4 * Math.sin(t * 60)).toFixed(2) : 0)
        s.glitch.setAttribute('transform', `translate(0 ${((t * 900) % 300).toFixed(0)})`)
        const sv = k.ease.io2(k.clamp((t - T.SIREN) / 0.4))
        s.blue.setAttribute('opacity', (sv * (Math.floor(t * 5) % 2 ? 1 : 0.25)).toFixed(2))
        hud(s, t)
      },
    },
    {
      // A · La cour d'assises ; le marteau.
      t1: SEC_HOOK_END,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, 'url(#judgeBg)')
        svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 760, fill: 'url(#spot)' }, g)
        const bk = bokeh(g, 10, ['#bcd2ff'], 141, { op: 0.15, r0: 6, r1: 16, blur: 'blur6', vy: 14 })
        svg('path', { d: 'M 100 560 L 540 300 L 980 560 Z', fill: '#2a3050' }, g)
        for (let i = 0; i < 6; i++) svg('rect', { x: 150 + i * 150, y: 600, width: 70, height: 620, fill: '#3a4268' }, g)
        svg('rect', { x: 100, y: 1220, width: 880, height: 60, fill: '#2a3050' }, g)
        const plaque = svg('g', { transform: 'translate(540 470)' }, g)
        svg('rect', { x: -330, y: -50, width: 660, height: 100, rx: 10, fill: '#d9a441' }, plaque)
        txt(plaque, 'COUR D’ASSISES · VAL-DE-MARNE', { y: 14, 'font-size': 38, fill: '#10121a' })
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        return { bk, gavel }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        const g = k.ease.in3(k.clamp((t - (K.GAVEL - 0.35)) / 0.35))
        const after = t - K.GAVEL
        k.show(s.gavel, t > K.GAVEL - 0.4)
        s.gavel.setAttribute('transform', `translate(${k.lerp(1000, 720, g)} ${k.lerp(300, 900, g)}) rotate(${k.lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
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
const KNIFE_D = (g, s = 1) => {
  const e = svg('g', {}, g)
  svg('path', { d: `M 0 0 L ${120 * s} ${-16 * s} L 0 ${-36 * s} Z`, fill: '#e8ecf2', filter: 'url(#glow)' }, e)
  svg('rect', { x: -60 * s, y: -32 * s, width: 64 * s, height: 28 * s, rx: 6, fill: '#3a2a1a' }, e)
  return e
}
const CUT_DEFS = {
  // « …nécessaire et proportionnée » : l'article 122-5, coché ligne par ligne.
  LAW: {
    build(g) {
      FULL(g, 'url(#studio)')
      svg('ellipse', { cx: 540, cy: 800, rx: 560, ry: 700, fill: 'url(#spot)' }, g)
      const card = svg('g', { transform: 'translate(540 820)' }, g)
      svg('rect', { x: -450, y: -380, width: 900, height: 700, rx: 20, fill: '#f6f0e2', stroke: '#9a1020', 'stroke-width': 14 }, card)
      txt(card, 'CODE PÉNAL', { y: -300, 'font-size': 40, fill: '#9a1020', 'letter-spacing': 6 })
      txt(card, 'Article 122-5 · Légitime défense', { y: -230, 'font-size': 50, fill: '#10121a' })
      const rows = ['Une agression réelle et injuste', 'Une riposte nécessaire', 'Une riposte proportionnée'].map((s2, i) => {
        const r = svg('g', { transform: `translate(-380 ${-110 + i * 140})`, opacity: 0 }, card)
        svg('rect', { x: 0, y: -50, width: 760, height: 100, rx: 14, fill: i === 2 ? '#ffe0e4' : '#e8f6ec' }, r)
        const mk = txt(r, i === 2 ? '?' : '✓', { x: 60, y: 22, 'font-size': 70, fill: i === 2 ? '#c8102e' : '#12a150' })
        txt(r, s2, { x: 120, y: 16, 'font-size': 42, fill: '#10121a', 'text-anchor': 'start' })
        return r
      })
      return { rows }
    },
    draw(s, t, l) {
      const at = [0.1, 0.6, Wd('04', 'proportionnee') - 0.15 - C.cuts.LAW[0]]
      s.rows.forEach((r, i) => r.setAttribute('opacity', clamp((l - at[i]) / 0.2).toFixed(2)))
    },
  },
  // « …cinq plaies au thorax, deux à la tête » : le schéma du médecin légiste.
  BODY: {
    build(g) {
      FULL(g, 'url(#xrayBg)')
      FULL(g, 'url(#gridC)')
      const b = svg('g', { transform: 'translate(540 820)', filter: 'url(#glow)' }, g)
      const st = { fill: '#8fe8ff', 'fill-opacity': 0.06, stroke: '#8fe8ff', 'stroke-width': 7 }
      svg('ellipse', { cx: 0, cy: -380, rx: 110, ry: 130, ...st }, b)
      svg('path', { d: 'M -60 -250 L -60 -210 L -250 -170 Q -290 -150 -290 -100 L -320 300 L -250 310 L -200 -40 L -180 400 L 180 400 L 200 -40 L 250 310 L 320 300 L 290 -100 Q 290 -150 250 -170 L 60 -210 L 60 -250 Z', ...st }, b)
      const dots = [[-80, -60], [40, -100], [90, 10], [-30, 60], [70, 140], [-40, -400], [50, -350]].map(([x, y]) => svg('circle', { cx: x, cy: y, r: 22, fill: '#ff3a4a', opacity: 0 }, b))
      const cT = txt(g, '', { x: 900, y: 860, 'font-size': 50, fill: '#ff8a96', 'text-anchor': 'end' })
      const cH = txt(g, '', { x: 900, y: 460, 'font-size': 50, fill: '#ff8a96', 'text-anchor': 'end' })
      txt(g, 'RAPPORT D’AUTOPSIE', { x: 540, y: 300, 'font-size': 56, fill: '#8fe8ff', 'letter-spacing': 6 })
      return { dots, cT, cH }
    },
    draw(s, t) {
      const t5 = Wd('04', 'cinq') - 0.1
      const t2 = Wd('04', 'deux') - 0.1
      let nT = 0
      let nH = 0
      s.dots.forEach((d, i) => {
        const a = i < 5 ? t5 + i * 0.12 : t2 + (i - 5) * 0.15
        const on = t >= a
        if (on) i < 5 ? nT++ : nH++
        d.setAttribute('opacity', on ? 1 : 0)
        d.setAttribute('r', on ? (22 + 14 * Math.exp(-(t - a) * 10)).toFixed(1) : 22)
      })
      s.cT.textContent = nT ? `THORAX : ${nT}` : ''
      s.cH.textContent = nH ? `TÊTE : ${nH}` : ''
    },
  },
  // « Dans le noir, personne ne compte ses coups » : le noir, des éclairs, des silhouettes.
  DARK: {
    build(g) {
      FULL(g, '#020204')
      const figs = svg('g', {}, g)
      const r = rng(151)
      for (let i = 0; i < 4; i++) fig(figs, { x: 260 + i * 180 + r() * 40, y: 1250, s: 0.9, fill: '#1a1c24', armR: 40 + r() * 120, armL: 30 + r() * 120, rot: (r() - 0.5) * 30 })
      const flash = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#c8d8ff', opacity: 0 }, g)
      const red = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigRed)', opacity: 0 }, g)
      return { figs, flash, red }
    },
    draw(s, t, l) {
      const k2 = Math.floor(l * 6)
      const on = [1, 4, 5, 9, 13, 14, 18].includes(k2)
      s.flash.setAttribute('opacity', on ? 0.3 : 0.06)
      s.figs.setAttribute('opacity', on ? 1 : 0.4)
      s.figs.setAttribute('transform', `translate(${on ? (rng(k2)() - 0.5) * 60 : 0} 0)`)
      s.red.setAttribute('opacity', (0.5 + 0.5 * Math.max(0, Math.sin(t * 8.5)) ** 6).toFixed(2))
    },
  },
  // « Son agresseur n'avait plus d'arme » : le couteau change de mains.
  KNIFE: {
    build(g) {
      FULL(g, 'url(#studio)')
      const L = svg('g', {}, g)
      fig(L, { x: 300, y: 1250, s: 1.2, fill: '#5a1018', head: '#3a0a10', armR: 80 })
      fig(L, { x: 780, y: 1250, s: 1.2, fill: '#2a3a5a', head: '#1a2440', armL: 80 })
      const kn = KNIFE_D(g, 1.4)
      txt(g, 'L’AGRESSEUR', { x: 300, y: 790, 'font-size': 40, fill: '#ff8a96' })
      txt(g, 'PABLO', { x: 780, y: 790, 'font-size': 40, fill: '#9fc0ff' })
      const lab = label(g, 'L’ARME CHANGE DE MAINS', { size: 54, fill: '#ffd166', ink: '#10121a' })
      return { kn, lab }
    },
    draw(s, t, l) {
      const p = ease.io2(clamp((l - 0.4) / 0.9))
      const x = lerp(470, 600, p)
      const y = lerp(870, 870, p) - 140 * Math.sin(Math.PI * p)
      s.kn.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${lerp(0, 180, p).toFixed(1)})`)
      place(s.lab, 540, 380, ease.back(2)(clamp((l - 1.2) / 0.3)) + 0.001, -2)
    },
  },
  // « Ils étaient deux. Le second s'en prenait à sa compagne. » : deux contre un.
  TWO: {
    build(g) {
      FULL(g, 'url(#redRoom)')
      fig(g, { x: 200, y: 1250, s: 1.0, fill: '#14060a', head: '#14060a', armR: 70 })
      fig(g, { x: 760, y: 1250, s: 1.0, fill: '#14060a', head: '#14060a', armL: 90 })
      fig(g, { x: 420, y: 1250, s: 1.0, fill: '#2a3a5a', head: '#1a2440' })
      fig(g, { x: 920, y: 1260, s: 0.85, fill: '#c86a8a', head: '#3a2014', armR: 160, armL: 150 })
      svg('path', { d: 'M 800 840 Q 860 780 900 820', fill: 'none', stroke: '#ffd166', 'stroke-width': 10, 'marker-end': '' }, g)
      txt(g, 'SA COMPAGNE', { x: 920, y: 1340, 'font-size': 34, fill: '#ffd0e0' })
      const big = txt(g, '2 CONTRE 1', { x: 540, y: 470, 'font-size': 150, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 14, 'paint-order': 'stroke fill' })
      return { big }
    },
    draw(s, t, l) {
      s.big.setAttribute('transform', `translate(540 450) scale(${(1 + 0.3 * Math.exp(-l * 8)).toFixed(3)}) translate(-540 -450)`)
    },
  },
  // « …faire le tri en trois secondes » : le compte à rebours.
  CLOCK: {
    build(g) {
      FULL(g, '#0a0a0e')
      const ring = svg('g', { transform: 'translate(540 760)' }, g)
      svg('circle', { r: 300, fill: 'none', stroke: '#2a2c34', 'stroke-width': 40 }, ring)
      const C2 = 2 * Math.PI * 300
      const arc = svg('circle', { r: 300, fill: 'none', stroke: '#ffd166', 'stroke-width': 40, 'stroke-dasharray': `${C2} ${C2}`, transform: 'rotate(-90)', filter: 'url(#glow)' }, ring)
      const num = txt(ring, '3', { y: 90, 'font-size': 280, fill: '#ffffff' })
      txt(ring, 'SECONDES', { y: 170, 'font-size': 44, fill: '#ffd166', 'letter-spacing': 8 })
      return { arc, num, C2 }
    },
    draw(s, t, l) {
      const v = Math.max(0, 3 - clamp((l - 0.4) / 2.2) * 3)
      s.num.textContent = String(Math.ceil(v))
      s.arc.setAttribute('stroke-dasharray', `${((s.C2 * v) / 3).toFixed(1)} ${s.C2}`)
      s.arc.setAttribute('stroke', v < 1 ? '#ff2a3d' : '#ffd166')
    },
  },
  // Le verdict : 12 ans ; l'agresseur survivant, 5 ans dont 3 avec sursis.
  VERDICT: {
    build(g) {
      FULL(g, 'url(#judgeBg)')
      svg('ellipse', { cx: 540, cy: 700, rx: 600, ry: 700, fill: 'url(#spot)' }, g)
      const top = svg('g', {}, g)
      const n = txt(top, '12 ANS', { x: 540, y: 640, 'font-size': 250, fill: '#ff3a4a', stroke: '#10121a', 'stroke-width': 18, 'paint-order': 'stroke fill' })
      const sub = txt(top, 'DE RÉCLUSION CRIMINELLE', { x: 540, y: 740, 'font-size': 50, fill: '#ffffff', 'letter-spacing': 3 })
      const nm = txt(top, 'PAS POUR MEURTRE : « VIOLENCES SANS INTENTION DE DONNER LA MORT »', { x: 540, y: 820, 'font-size': 26, fill: '#c8d0e0', opacity: 0 })
      const cmp = svg('g', { opacity: 0 }, g)
      const bar = (y, who, years, ferme, col, txt2) => {
        const e = svg('g', { transform: `translate(90 ${y})` }, cmp)
        txt(e, who, { x: 0, y: -20, 'font-size': 40, fill: '#ffffff', 'text-anchor': 'start' })
        const b = svg('rect', { x: 0, y: 0, width: 0, height: 80, rx: 12, fill: col }, e)
        const b2 = svg('rect', { x: 0, y: 0, width: 0, height: 80, rx: 12, fill: col, opacity: 0.35 }, e)
        txt(e, txt2, { x: 0, y: 130, 'font-size': 36, fill: '#e8ecf2', 'text-anchor': 'start' })
        return { b, b2, years, ferme }
      }
      const bars = [bar(880, 'PABLO, LA CIBLE DU VOL', 12, 12, '#ff3a4a', '12 ans de réclusion'), bar(1130, 'L’AGRESSEUR QUI A SURVÉCU', 5, 2, '#9fc0ff', '5 ans, dont 3 avec sursis')]
      return { top, n, sub, nm, cmp, bars }
    },
    draw(s, t, l) {
      const tN = Wd('09', 'douze') - 0.1
      const v = ease.back(2.2)(clamp((t - tN) / 0.3))
      s.n.setAttribute('opacity', t > tN ? 1 : 0)
      s.n.setAttribute('transform', `translate(540 560) scale(${Math.max(0.001, t > tN ? 1 + 0.5 * (1 - v) : 0.001).toFixed(3)}) translate(-540 -560)`)
      s.sub.setAttribute('opacity', t > tN + 0.4 ? 1 : 0)
      s.nm.setAttribute('opacity', t > Wd('09', 'pas') - 0.1 ? 1 : 0)
      const tC = Wd('09', 'et') - 0.1
      const c = ease.io2(clamp((t - tC) / 0.4))
      s.top.setAttribute('transform', `translate(0 ${(-110 * c).toFixed(1)}) scale(1)`)
      s.cmp.setAttribute('opacity', c.toFixed(2))
      s.bars.forEach((b, i) => {
        const g2 = ease.out3(clamp((t - tC - 0.3 - i * 0.9) / 0.6))
        b.b.setAttribute('width', (900 * (b.ferme / 12) * g2).toFixed(0))
        b.b2.setAttribute('width', (900 * (b.years / 12) * g2).toFixed(0))
      })
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
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#judgeBg)' }, L.far)
  svg('ellipse', { cx: 540, cy: 1100, rx: 600, ry: 800, fill: 'url(#spot)' }, L.far)
  const bk = bokeh(L.far, 16, ['#9fb8ff', '#ffe7b0'], 161, { op: 0.18, r0: 30, r1: 100, blur: 'blur30', vy: 10 })
  const pablo = makePerson(L.actor, PABLO)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  txt(L.front, 'PABLO · 12 ANS', { x: 540, y: 1820, 'font-size': 60, fill: '#ffffff', 'letter-spacing': 4 })
  return { bk, pablo }
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
// L'ouverture : l'affaire en une phrase, la source.
fs(tag('AFFAIRE RÉELLE', 'pill red', { t0: 0, t1: SEC.hook.t1 - 0.1, y: 230, rot: -2 }), 50)
fs(tag('ON A VOULU LUI VOLER SA VOITURE', 'pill yellow', { t0: 0, t1: K.LIVE0 - 0.1, y: 345, rot: 2 }), 50)
fs(tag('C’EST LUI QUI A PRIS 12 ANS', 'slam white', { t0: Wd('00', 'cest') - 0.12, t1: K.LIVE0 - 0.1, y: 520, rot: -3, from: 2.4, dur: 0.18 }), 74)
fs(tag('D’APRÈS LE PARISIEN', 'pill', { t0: 0, t1: SEC.hook.t1 - 0.1, y: 1700 }), 34)
fs(tag('THIAIS · 1ER OCTOBRE 2020', 'pill yellow', { t0: K.SCENE, t1: K.HURT - 0.1, y: 345, rot: 2 }), 48)
fs(tag('PABLO · 20 ANS', 'pill', { t0: K.PABLO, t1: K.ARRIVE - 0.06, y: 460, rot: -2 }), 50)
fs(tag('UN COUTEAU', 'slam white', { t0: K.KNIFE, t1: K.HURT - 0.1, y: 470, rot: -3, from: 2.4, dur: 0.18 }), 90)
fs(tag('L’UN NE SE RELÈVE PAS', 'slam yellow', { t0: K.DOWN, t1: K.COURT - 0.1, y: 400, rot: -3, from: 2.6, dur: 0.18 }), 70)
fs(tag('FÉVRIER 2026', 'pill yellow', { t0: K.COURT, t1: SEC.hook.t1 - 0.1, y: 345, rot: 2 }), 50)
fs(tag('LÉGITIME DÉFENSE ÉCARTÉE', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.2, y: 1050, rot: -6, from: 2.6, dur: 0.18 }), 68)
// Le procès.
fs(tag('PLAIDOIRIES RECONSTITUÉES D’APRÈS LES MOTIFS DU JUGEMENT', 'pill', { t0: S('04') - 0.05, t1: C.cuts.LAW[0] - 0.05, y: 300 }), 30)
fs(tag('« C’EST S’ACHARNER. »', 'slam yellow', { t0: Wd('04', 'sacharner') - 0.15, t1: E('04') + 0.15, y: 340, rot: -4, from: 2.8, dur: 0.15 }), 78)
fs(tag('SA COMPAGNE ATTAQUÉE À CÔTÉ', 'pill red', { t0: Wd('05', 'sa') - 0.1, t1: C.cuts.DARK[0] - 0.05, y: 300, rot: -2 }), 52)
fs(tag('LA MENACE A CHANGÉ DE CAMP', 'slam yellow', { t0: Wd('06', 'menace') - 0.2, t1: E('06') + 0.15, y: 340, rot: 3, from: 2.6, dur: 0.18 }), 56)
fs(tag('LÉGITIME DÉFENSE<br>OU ACHARNEMENT ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 84)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
fs(tag('LE VRAI VERDICT', 'pill red', { t0: S('09') - 0.05, t1: SEC.tribunal.t1, y: 200, rot: -2 }), 46)
// Le vote : un chiffre en commentaire.
fs(tag('ET TOI, TU LUI AURAIS<br>DONNÉ COMBIEN ?', 'big white', { t0: S('13') - 0.05, y: 300, from: 1.4, dur: 0.4 }), 80)
fs(tag('0 · 5 · 12 · 15 ANS ?', 'vote red', { t0: Wd('13', 'combien') - 0.1, y: 560, rot: -2 }), 74)
fs(tag('ÉCRIS UN CHIFFRE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecris') - 0.1, y: 740 }), 46)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
const arrow2 = fs(tag('UNE AFFAIRE RÉELLE CHAQUE JOUR<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('13', 'demain') - 0.1, y: 1285 }), 42)
for (const a of [arrow1, arrow2]) a.update = (t) => (a.x = 540 + 14 * Math.max(0, Math.sin((t - a.t0) * 7)))
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'L’ACCUSATION', avocate: 'LA DÉFENSE' }

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
  [Wd('00', 'cest') - 0.12, 12],
  [K.LIVE0, 10],
  [K.KNIFE, 10],
  [K.HURT, 12],
  [K.FIGHT, 14],
  [K.DOWN, 18],
  [K.COURT, 8],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [C.cuts.TWO[0], 10],
  [Wd('09', 'douze') - 0.1, 22],
  [Wd('09', 'et') - 0.1, 10],
  [Wd('13', 'toi') - 0.15, 8],
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
    VOTE.pablo.update(t, { x: 540, y: 1480, scale: 0.95, brows: 'sad', look: [0, 0.2], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 3.1 })
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
