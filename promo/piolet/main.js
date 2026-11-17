/**
 * ============================================================================
 *  « Affaire Classée ? » — Le vrai verdict : le piolet (1080 × 1920)
 * ============================================================================
 *  Affaire réelle (d'après France 3, le JDD, Police & Réalités) : Gaël, réveillé
 *  la nuit par deux cambrioleurs, frappe l'un d'eux de douze coups de piolet ;
 *  10 ans, légitime défense écartée ; les cambrioleurs, 10 mois avec sursis.
 *  Ouverture par le verdict, reconstitution en caméra infrarouge (un seul
 *  plan), plaidoiries reconstituées, vrai verdict, vote par chiffre.
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
const GAEL = { robe: '#4a3a2a', jabot: false, collar: '#2a2018', hair: 'short', hairColor: '#6a6a66', beard: true, skin: '#e2b08a', iris: '#2a3a4a' }
const T = K
const figAt = (el, x, y, sc, rot = 0) => el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc})`)

const SHOTS = [
    {
      // V · L'ouverture par le verdict : le marteau, « 10 ANS », il baisse la tête ; « 10 mois avec sursis ».
      t1: K.LIVE0,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, 'url(#judgeBg)')
        const world = svg('g', {}, g)
        svg('ellipse', { cx: 540, cy: 700, rx: 620, ry: 760, fill: 'url(#spot)' }, world)
        svg('rect', { x: -400, y: 300, width: 1900, height: 40, fill: '#2a2030' }, world)
        for (let i = 0; i < 5; i++) svg('rect', { x: 40 + i * 220, y: 340, width: 24, height: 700, fill: '#1c1824' }, world)
        for (const x of [230, 850]) {
          const p = fig(world, { x, y: 1300, s: 1.15, fill: '#1a2238', head: '#c89a7a', armR: 8, armL: 8 })
          svg('rect', { x: -48, y: -392, width: 96, height: 30, rx: 8, fill: '#10162a' }, p)
        }
        const who = k.makePerson(world, GAEL)
        svg('rect', { x: 140, y: 1250, width: 800, height: 700, rx: 16, fill: 'url(#desk)' }, world)
        svg('rect', { x: 140, y: 1236, width: 800, height: 30, rx: 10, fill: '#b07a52' }, world)
        const big = txt(g, '10 ANS', { x: 540, y: 640, 'font-size': 250, fill: '#ff3a4a', stroke: '#10121a', 'stroke-width': 20, 'paint-order': 'stroke fill' })
        const sub = txt(g, 'DE RÉCLUSION CRIMINELLE', { x: 540, y: 740, 'font-size': 48, fill: '#ffffff', 'letter-spacing': 3 })
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        return { world, who, big, sub, gavel, fl }
      },
      draw(k, s, t, l) {
        const G = 0.14
        const gv = k.ease.in3(k.clamp(t / G))
        const after = t - G
        const out = k.ease.in2(k.clamp((t - 0.6) / 0.4))
        s.gavel.setAttribute('transform', `translate(${k.lerp(980, 860, gv) + 500 * out} ${k.lerp(820, 1060, gv) - 300 * out}) rotate(${k.lerp(-60, -8, gv) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
        s.fl.setAttribute('opacity', (t > G ? 0.6 * Math.exp(-(t - G) * 10) : 0).toFixed(3))
        const v = k.ease.back(2.2)(k.clamp((t - G) / 0.25))
        s.big.setAttribute('opacity', t > G ? 1 : 0)
        s.big.setAttribute('transform', `translate(540 560) scale(${Math.max(0.001, 1 + 0.6 * (1 - v)).toFixed(3)}) translate(-540 -560)`)
        s.sub.setAttribute('opacity', t > G + 0.3 ? 1 : 0)
        const d = k.ease.io2(k.clamp((t - 0.5) / 1.2))
        s.who.update(t, { x: 540, y: 1150, scale: 1.25, mouth: 0, brows: d > 0.5 ? 'angry' : 'sad', look: [0, 0.2 + 0.5 * d], headNod: 0.7 * d, armR: [0.15, 0.3], armL: [0.15, 0.3], seed: 3.1 })
        const z = 1 + 0.06 * l + 0.04 * Math.exp(-Math.max(0, t - G) * 8)
        s.world.setAttribute('transform', `translate(540 1100) scale(${z.toFixed(4)}) translate(-540 -1100)`)
      },
    },
    {
      // S · La reconstitution, en un seul plan de caméra infrarouge : la maison isolée, deux heures du matin.
      t1: K.COURT,
      build(k, g) {
        const { svg, txt } = k
        const world = svg('g', {}, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#061a0e' }, world)
        for (const [x, r] of [[-60, 220], [200, 260], [980, 240], [1200, 260]]) svg('circle', { cx: x, cy: 720, r, fill: '#0a2a16' }, world)
        svg('rect', { x: -400, y: 900, width: 1900, height: 1300, fill: '#0e3a1e' }, world)
        // La maison, la camionnette, le chemin, les ronces.
        svg('rect', { x: 560, y: 560, width: 420, height: 380, fill: '#14482a' }, world)
        svg('path', { d: 'M 530 570 L 770 400 L 1010 570 Z', fill: '#103e22' }, world)
        const win = svg('rect', { x: 620, y: 640, width: 110, height: 120, fill: '#1c5a34' }, world)
        const door = svg('rect', { x: 820, y: 760, width: 90, height: 180, fill: '#0a2a16' }, world)
        svg('rect', { x: 160, y: 820, width: 300, height: 140, rx: 14, fill: '#1a5030' }, world)
        for (const x of [210, 410]) svg('circle', { cx: x, cy: 960, r: 30, fill: '#08200f' }, world)
        svg('path', { d: 'M 860 940 Q 600 1200 300 1500 L 120 1500 Q 420 1200 800 940 Z', fill: '#1a5a34', opacity: 0.8 }, world)
        for (let i = 0; i < 14; i++) svg('path', { d: `M ${880 + (i % 7) * 40} ${1180 + Math.floor(i / 7) * 60} q 20 -60 40 0 q 20 -50 40 0`, stroke: '#2a7a46', 'stroke-width': 8, fill: 'none' }, world)
        const b1 = fig(world, { fill: '#9fe8b0', head: '#9fe8b0', armR: 30 })
        const b2 = fig(world, { fill: '#9fe8b0', head: '#9fe8b0', armR: 20 })
        const ga = fig(world, { fill: '#d8ffe0', head: '#d8ffe0', armR: 150, armL: 30 })
        const axe = svg('g', {}, world)
        svg('rect', { x: -6, y: -150, width: 12, height: 150, fill: '#d8ffe0' }, axe)
        svg('path', { d: 'M -50 -150 L 50 -150 L 40 -136 L -40 -136 Z', fill: '#ffffff' }, axe)
        // Le grain infrarouge, l'interface de la caméra.
        const scan = svg('pattern', { id: 'scanP', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, k.defs)
        svg('rect', { width: 8, height: 3, fill: '#000', opacity: 0.35 }, scan)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#scanP)' }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        const black = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#000', opacity: 0 }, g)
        const glitch = svg('g', { opacity: 0 }, g)
        for (let i = 0; i < 6; i++) svg('rect', { x: -100, y: 200 + i * 260, width: 1300, height: 24 + (i % 3) * 18, fill: '#bfffcf', opacity: 0.35 }, glitch)
        const hud = svg('g', {}, g)
        for (const [x, y, sx, sy] of [[50, 190, 1, 1], [1030, 190, -1, 1], [50, 1870, 1, -1], [1030, 1870, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 60} L ${x} ${y} L ${x + sx * 60} ${y}`, stroke: '#bfffcf', 'stroke-width': 7, fill: 'none', opacity: 0.8 }, hud)
        const rec = svg('circle', { cx: 90, cy: 1820, r: 13, fill: '#ff2a3d' }, hud)
        txt(hud, 'CAM IR · RECONSTITUTION', { x: 115, y: 1832, 'font-size': 30, fill: '#bfffcf', 'text-anchor': 'start' })
        const clock = txt(hud, '', { x: 1010, y: 1832, 'font-size': 30, fill: '#bfffcf', 'text-anchor': 'end' })
        const count = txt(g, '', { x: 540, y: 860, 'font-size': 220, fill: '#ff3a4a', stroke: '#10121a', 'stroke-width': 16, 'paint-order': 'stroke fill' })
        return { world, win, door, b1, b2, ga, axe, black, glitch, rec, clock, count }
      },
      draw(k, s, t, l) {
        // Les deux hommes dans la cour dès la première image.
        const w = k.ease.out2(k.clamp(l / 2.0))
        const fl = k.ease.io2(k.clamp((t - T.FLEE) / 0.8))
        figAt(s.b1, k.lerp(380, 520, w) + k.lerp(0, 420, fl), k.lerp(1060, 1080, w) + 120 * fl, 0.42)
        figAt(s.b2, k.lerp(300, 420, w) - k.lerp(0, 120, k.ease.io2(k.clamp((t - T.WAIT) / 0.8))), k.lerp(1080, 1100, w) + k.lerp(0, 160, k.ease.io2(k.clamp((t - T.WAIT) / 0.8))), 0.44)
        s.win.setAttribute('fill', t > T.GAEL ? '#8affb0' : '#1c5a34')
        s.door.setAttribute('fill', t > T.AXE - 0.3 ? '#8affb0' : '#0a2a16')
        const go = k.ease.io2(k.clamp((t - T.AXE) / 1.1))
        const out = t > T.AXE - 0.3
        s.ga.setAttribute('opacity', out ? 1 : 0)
        s.axe.setAttribute('opacity', out ? 1 : 0)
        const gx = k.lerp(860, 400, go)
        const gy = k.lerp(950, 1240, go)
        figAt(s.ga, gx, gy, 0.5)
        s.axe.setAttribute('transform', `translate(${(gx + 0.5 * 120).toFixed(1)} ${(gy - 0.5 * 330).toFixed(1)}) rotate(${t > T.HIT ? (40 * Math.sin(t * 22)).toFixed(1) : 20})`)
        // Les douze coups : l'image coupe, le compteur.
        const hitting = t > T.HIT && t < T.HIT + 1.3
        const n = t > T.HIT ? Math.min(12, 1 + Math.floor((t - T.HIT) / 0.1)) : 0
        s.black.setAttribute('opacity', hitting ? (Math.floor((t - T.HIT) * 10) % 2 ? 0.85 : 0.4) : t > T.HIT ? 0.55 : 0)
        s.glitch.setAttribute('opacity', hitting ? 0.8 : 0)
        s.glitch.setAttribute('transform', `translate(0 ${((t * 900) % 300).toFixed(0)})`)
        s.count.textContent = n ? String(n) : ''
        s.count.setAttribute('transform', `translate(540 800) scale(${(1 + 0.3 * Math.exp(-(((t - T.HIT) % 0.1) * 30))).toFixed(3)}) translate(-540 -800)`)
        const z = 1.25 + 0.015 * l
        s.world.setAttribute('transform', `translate(540 1000) scale(${z.toFixed(4)}) translate(-560 -1000)`)
        s.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2)
        s.clock.textContent = `07/11/2021 · 02:0${Math.floor(l / 6)}:${String(Math.floor((l * 1.0) % 60)).padStart(2, '0')}`
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
        txt(plaque, 'COUR D’ASSISES · HAUTE-VIENNE', { y: 14, 'font-size': 38, fill: '#10121a' })
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
const CUT_DEFS = {
  // « La loi protège celui qui repousse un intrus, la nuit, chez lui » : l'article 122-6.
  LAW: {
    build(g) {
      FULL(g, 'url(#studio)')
      svg('ellipse', { cx: 540, cy: 800, rx: 560, ry: 700, fill: 'url(#spot)' }, g)
      const card = svg('g', { transform: 'translate(540 800)' }, g)
      svg('rect', { x: -450, y: -360, width: 900, height: 640, rx: 20, fill: '#f6f0e2', stroke: '#9a1020', 'stroke-width': 14 }, card)
      txt(card, 'CODE PÉNAL', { y: -280, 'font-size': 40, fill: '#9a1020', 'letter-spacing': 6 })
      txt(card, 'Article 122-6', { y: -210, 'font-size': 56, fill: '#10121a' })
      const lines = ['Est présumé en légitime défense', 'celui qui repousse, DE NUIT,', 'l’entrée dans un lieu habité.']
      const hl = lines.map((s2, i) => {
        const h = svg('rect', { x: -400, y: -130 + i * 90, width: 800, height: 70, rx: 10, fill: '#ffd166', opacity: 0 }, card)
        txt(card, s2, { y: -80 + i * 90, 'font-size': 44, fill: '#10121a', 'font-weight': 700 })
        return h
      })
      const moon = svg('g', { transform: 'translate(330 200)' }, card)
      svg('circle', { r: 50, fill: '#f2f2d8' }, moon)
      svg('circle', { cx: 24, cy: -16, r: 46, fill: '#f6f0e2' }, moon)
      return { hl }
    },
    draw(s, t, l) {
      s.hl.forEach((h, i) => h.setAttribute('opacity', (0.8 * clamp((l - 0.2 - i * 0.5) / 0.25)).toFixed(2)))
    },
  },
  // « …les voleurs fuyaient déjà. C'est lui qui leur a couru après. » : vu du ciel.
  FLEE: {
    build(g) {
      FULL(g, '#2e5a2a')
      const r = rng(171)
      for (let i = 0; i < 80; i++) svg('ellipse', { cx: (r() * 1300 - 100).toFixed(0), cy: (r() * 2100 - 100).toFixed(0), rx: 10 + r() * 30, ry: 5 + r() * 12, fill: r() < 0.5 ? '#264e24' : '#3a6a34' }, g)
      svg('rect', { x: 600, y: 300, width: 360, height: 300, fill: '#6a5a4a', stroke: '#10121a', 'stroke-width': 8 }, g)
      txt(g, 'LA MAISON', { x: 780, y: 460, 'font-size': 40, fill: '#ffffff' })
      svg('path', { d: 'M 780 600 Q 600 900 300 1300', stroke: '#c8b48a', 'stroke-width': 90, fill: 'none', 'stroke-linecap': 'round' }, g)
      for (let i = 0; i < 18; i++) svg('circle', { cx: 860 + (i % 6) * 40, cy: 1000 + Math.floor(i / 6) * 50, r: 26, fill: '#1e3e1a' }, g)
      txt(g, 'RONCES', { x: 960, y: 1210, 'font-size': 32, fill: '#cfe8c8' })
      const dot = (c) => svg('circle', { r: 30, fill: c, stroke: '#ffffff', 'stroke-width': 6 }, g)
      const v1 = dot('#9fc0ff')
      const v2 = dot('#9fc0ff')
      const ga = dot('#ff3a4a')
      const trail = svg('path', { d: '', stroke: '#ff3a4a', 'stroke-width': 10, 'stroke-dasharray': '24 16', fill: 'none' }, g)
      const lab = label(g, 'C’EST LUI QUI A COURU APRÈS', { size: 50, fill: '#ff3a4a', ink: '#ffffff' })
      txt(g, 'LES VOLEURS', { x: 220, y: 1320, 'font-size': 34, fill: '#cfe0ff' })
      return { v1, v2, ga, trail, lab }
    },
    draw(s, t, l) {
      const p = ease.io2(clamp(l / 1.6))
      place(s.v1, lerp(620, 960, p), lerp(700, 1060, p), 1)
      place(s.v2, lerp(600, 360, p), lerp(760, 1230, p), 1)
      const q = ease.io2(clamp((l - 1.4) / 2.2))
      const gx = lerp(780, 380, q)
      const gy = lerp(620, 1200, q)
      place(s.ga, gx, gy, 1)
      s.trail.setAttribute('d', `M 780 620 L ${gx.toFixed(0)} ${gy.toFixed(0)}`)
      place(s.lab, 540, 300, ease.back(2)(clamp((t - (Wd('04', 'cest') - 0.15)) / 0.3)) + 0.001, -2)
    },
  },
  // « …un deuxième homme quelque part dans le noir » : la lampe torche, où est l'autre ?
  DARK: {
    build(g) {
      FULL(g, '#020204')
      const scene = svg('g', {}, g)
      fig(scene, { x: 300, y: 1250, s: 0.9, fill: '#3a4048' })
      const q = txt(scene, '?', { x: 800, y: 1000, 'font-size': 260, fill: '#ff3a4a', opacity: 0.8 })
      const cp = svg('clipPath', { id: 'torch' }, defs)
      const beam = svg('circle', { r: 260 }, cp)
      scene.setAttribute('clip-path', 'url(#torch)')
      const glow = svg('circle', { r: 280, fill: 'url(#lampG)', opacity: 0.35 }, g)
      const lab = label(g, 'OÙ EST LE DEUXIÈME ?', { size: 52, fill: '#ffffff', ink: '#10121a' })
      return { beam, glow, lab, q }
    },
    draw(s, t, l) {
      const x = 540 + 340 * Math.sin(l * 1.3)
      const y = 1050 + 160 * Math.sin(l * 2.1)
      s.beam.setAttribute('cx', x.toFixed(0))
      s.beam.setAttribute('cy', y.toFixed(0))
      s.glow.setAttribute('cx', x.toFixed(0))
      s.glow.setAttribute('cy', y.toFixed(0))
      place(s.lab, 540, 330, ease.back(2)(clamp((l - 0.6) / 0.3)) + 0.001, -2)
    },
  },
  // « Douze coups, à la tête » : le compteur.
  COUNT: {
    build(g) {
      FULL(g, '#0a0a0e')
      const red = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigRed)', opacity: 0.6 }, g)
      const n = txt(g, '', { x: 540, y: 900, 'font-size': 420, fill: '#ff3a4a', stroke: '#10121a', 'stroke-width': 20, 'paint-order': 'stroke fill' })
      txt(g, 'COUPS', { x: 540, y: 1020, 'font-size': 80, fill: '#ffffff', 'letter-spacing': 10 })
      const ticks = Array.from({ length: 12 }, (_, i) => svg('rect', { x: 120 + i * 72, y: 1120, width: 50, height: 90, rx: 10, fill: '#2a2c34' }, g))
      return { red, n, ticks }
    },
    draw(s, t, l) {
      const k2 = Math.min(12, Math.floor(clamp((l - 0.15) / 1.3) * 12) + (l > 0.15 ? 1 : 0))
      s.n.textContent = k2 ? String(k2) : ''
      s.ticks.forEach((r, i) => r.setAttribute('fill', i < k2 ? '#ff3a4a' : '#2a2c34'))
      s.red.setAttribute('opacity', (0.5 + 0.5 * Math.max(0, Math.sin(t * 8.5)) ** 6).toFixed(2))
    },
  },
  // « Ils repartent avec dix mois de sursis. Lui prend dix ans. » : la balance.
  SCALE: {
    build(g) {
      FULL(g, 'url(#studio)')
      svg('ellipse', { cx: 540, cy: 760, rx: 520, ry: 760, fill: 'url(#spot)' }, g)
      svg('rect', { x: 524, y: 770, width: 32, height: 480, fill: 'url(#gold)' }, g)
      svg('ellipse', { cx: 540, cy: 1260, rx: 200, ry: 40, fill: 'url(#gold)' }, g)
      const beam = svg('g', {}, g)
      svg('rect', { x: -380, y: -14, width: 760, height: 28, rx: 14, fill: 'url(#gold)', filter: 'url(#glow)' }, beam)
      const pan = (title, sub, col) => {
        const p = svg('g', {}, g)
        svg('path', { d: 'M 0 0 L -130 230 M 0 0 L 130 230', stroke: '#e8b23a', 'stroke-width': 6 }, p)
        svg('path', { d: 'M -170 230 Q 0 320 170 230 Z', fill: 'url(#gold)' }, p)
        txt(p, title, { y: 200, 'font-size': 64, fill: col, stroke: '#10121a', 'stroke-width': 8, 'paint-order': 'stroke fill' })
        txt(p, sub, { y: 360, 'font-size': 26, fill: '#ffffff' })
        return p
      }
      const left = pan('10 MOIS', 'AVEC SURSIS · LES VOLEURS', '#9fc0ff')
      const right = pan('10 ANS', 'DE PRISON · LUI', '#ff3a4a')
      return { beam, left, right }
    },
    draw(s, t, l) {
      const a = 16 * ease.back(2.2)(clamp((l - 0.3) / 0.6))
      const r = (a * Math.PI) / 180
      s.beam.setAttribute('transform', `translate(540 770) rotate(${a.toFixed(2)})`)
      place(s.left, 540 - 270 * Math.cos(r), 770 - 270 * Math.sin(r), 1, 0)
      place(s.right, 540 + 270 * Math.cos(r), 770 + 270 * Math.sin(r), 1, 0)
    },
  },
  // Le verdict : 10 ans ; requalifié ; la récidive ; les voleurs, 10 mois avec sursis.
  VERDICT: {
    build(g) {
      FULL(g, 'url(#judgeBg)')
      svg('ellipse', { cx: 540, cy: 700, rx: 600, ry: 700, fill: 'url(#spot)' }, g)
      const top = svg('g', {}, g)
      const n = txt(top, '10 ANS', { x: 540, y: 640, 'font-size': 250, fill: '#ff3a4a', stroke: '#10121a', 'stroke-width': 18, 'paint-order': 'stroke fill' })
      const sub = txt(top, 'DE RÉCLUSION CRIMINELLE', { x: 540, y: 740, 'font-size': 50, fill: '#ffffff', 'letter-spacing': 3 })
      const nm = txt(top, 'PAS DE TENTATIVE DE MEURTRE : « VIOLENCES AYANT ENTRAÎNÉ UNE INFIRMITÉ »', { x: 540, y: 820, 'font-size': 24, fill: '#c8d0e0', opacity: 0 })
      const rec = svg('g', { opacity: 0 }, g)
      const lb = label(rec, 'DÉJÀ CONDAMNÉ POUR VIOLENCES EN 2020', { size: 40, fill: '#ffd166', ink: '#10121a' })
      lb.setAttribute('transform', 'translate(540 1000) rotate(-2)')
      return { top, n, sub, nm, rec }
    },
    draw(s, t, l) {
      const tN = Wd('09', 'dix') - 0.1
      const v = ease.back(2.2)(clamp((t - tN) / 0.3))
      s.n.setAttribute('opacity', t > tN ? 1 : 0)
      s.n.setAttribute('transform', `translate(540 560) scale(${Math.max(0.001, t > tN ? 1 + 0.5 * (1 - v) : 0.001).toFixed(3)}) translate(-540 -560)`)
      s.sub.setAttribute('opacity', t > tN + 0.4 ? 1 : 0)
      s.nm.setAttribute('opacity', t > Wd('09', 'pas') - 0.1 ? 1 : 0)
      const tR = Wd('09', 'il') - 0.1
      s.rec.setAttribute('opacity', ease.io2(clamp((t - tR) / 0.3)).toFixed(2))
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
  const pablo = makePerson(L.actor, GAEL)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  txt(L.front, 'GAËL · 10 ANS', { x: 540, y: 1820, 'font-size': 60, fill: '#ffffff', 'letter-spacing': 4 })
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
// L'ouverture : le verdict, l'écart, la source.
fs(tag('AFFAIRE RÉELLE', 'pill red', { t0: 0, t1: SEC.hook.t1 - 0.1, y: 230, rot: -2 }), 50)
fs(tag('LES CAMBRIOLEURS : 10 MOIS AVEC SURSIS', 'pill yellow', { t0: K.MOIS, t1: K.LIVE0 - 0.1, y: 850, rot: 2 }), 44)
fs(tag('D’APRÈS FRANCE 3 ET LE JDD', 'pill', { t0: 0, t1: SEC.hook.t1 - 0.1, y: 1700 }), 34)
fs(tag('5 ANS PLUS TÔT', 'slam white', { t0: K.LIVE0, t1: K.LIVE0 + 1.3, y: 520, rot: -3, from: 2.4, dur: 0.18 }), 100)
fs(tag('HAUTE-VIENNE · 2 H DU MATIN', 'pill yellow', { t0: K.SCENE, t1: K.HIT - 0.1, y: 345, rot: 2 }), 48)
fs(tag('GAËL · CHEZ LUI', 'pill', { t0: K.GAEL, t1: K.TWO - 0.06, y: 460, rot: -2 }), 50)
fs(tag('UN PIOLET', 'slam white', { t0: K.AXE + 0.4, t1: K.HIT - 0.1, y: 470, rot: -3, from: 2.4, dur: 0.18 }), 100)
fs(tag('INFIRMITÉ À VIE', 'pill red', { t0: Wd('03', 'infirmite') - 0.12, t1: SEC.hook.t1 - 0.1, y: 1560, rot: -2 }), 54)
fs(tag('JUIN 2026', 'pill yellow', { t0: K.COURT, t1: SEC.hook.t1 - 0.1, y: 345, rot: 2 }), 50)
fs(tag('LÉGITIME DÉFENSE ÉCARTÉE', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.2, y: 1050, rot: -6, from: 2.6, dur: 0.18 }), 68)
// Le procès.
fs(tag('PLAIDOIRIES RECONSTITUÉES D’APRÈS L’AUDIENCE', 'pill', { t0: S('04') - 0.05, t1: C.cuts.LAW[0] - 0.05, y: 300 }), 32)
fs(tag('« CE N’EST PLUS DE LA PEUR. »', 'slam yellow', { t0: C.hot[0][0], t1: E('06') + 0.15, y: 340, rot: -4, from: 2.8, dur: 0.15 }), 56)
fs(tag('« DES VOLEURS CHEZ LUI »', 'slam white', { t0: S('07') - 0.05, t1: C.cuts.SCALE[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 76)
fs(tag('LÉGITIME DÉFENSE<br>OU VENGEANCE ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 84)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
fs(tag('LE VRAI VERDICT', 'pill red', { t0: S('09') - 0.05, t1: SEC.tribunal.t1, y: 200, rot: -2 }), 46)
// Le vote : un chiffre en commentaire.
fs(tag('ET TOI, TU LUI AURAIS<br>DONNÉ COMBIEN ?', 'big white', { t0: S('13') - 0.05, y: 300, from: 1.4, dur: 0.4 }), 80)
fs(tag('0 · 2 · 5 · 10 ANS ?', 'vote red', { t0: Wd('13', 'combien') - 0.1, y: 560, rot: -2 }), 74)
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
  [0.14, 26],
  [K.MOIS, 10],
  [K.LIVE0, 10],
  [K.AXE, 10],
  [K.HIT, 18],
  [K.COURT, 8],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [C.cuts.COUNT[0] + 0.15, 12],
  [C.cuts.SCALE[0] + 0.4, 12],
  [Wd('09', 'dix') - 0.1, 22],
  [Wd('09', 'il') - 0.1, 10],
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
