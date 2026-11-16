/**
 * ============================================================================
 *  « Affaire Classée ? » — Le prank (1080 × 1920)
 * ============================================================================
 *  Le hook est un seul plan, filmé par le téléphone du youtubeur : le selfie,
 *  la cagoule, la caméra retournée, l'enfant attrapé, le passant qui charge,
 *  le poing, la chute du téléphone. Le narrateur rembobine (la chaîne, le
 *  live, Timéo, Rachid, le coup au ralenti, le coma, le marteau). Au procès,
 *  chaque argument devient un plan de coupe plein écran (chronomètre, pellicule,
 *  camionnette, balance, cagoule, contre-jour…).
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
const YT = { robe: '#fe2c55', jabot: false, collar: '#ffffff', hair: 'cap', cap: '#10121a', skin: '#f0c8a0', iris: '#3a5a7a' }
const KID = { robe: '#ffd166', jabot: false, collar: '#3b82f6', hair: 'messy', hairColor: '#7a4a2a', skin: '#f6d0b0', iris: '#3a5a7a' }
const PASSANT = { robe: '#2a3a5a', jabot: false, collar: '#1a2440', hair: 'short', hairColor: '#1a120c', beard: true, skin: '#a8714e', iris: '#1a120c' }
/** La cagoule noire (fente pour les yeux, trou pour la bouche). */
const BALA = 'M 0 -334 C 132 -334 166 -232 161 -130 C 157 -28 106 34 0 36 C -106 34 -157 -28 -161 -130 C -166 -232 -132 -334 0 -334 Z M -114 -190 L 114 -190 Q 122 -142 114 -94 L -114 -94 Q -122 -142 -114 -190 Z M -48 -24 A 48 30 0 1 0 48 -24 A 48 30 0 1 0 -48 -24 Z'


/** Le parc : ciel, arbres, pelouse, allée. */
function park(k, g) {
  const { svg } = k
  svg('rect', { x: -900, y: -900, width: 2900, height: 2000, fill: 'url(#daySky)' }, g)
  for (const [x, y, r] of [[-300, 760, 260], [80, 700, 240], [420, 740, 260], [820, 700, 250], [1200, 760, 270], [1560, 720, 240]]) {
    svg('rect', { x: x - 22, y, width: 44, height: 380, fill: '#6a4a30' }, g)
    svg('circle', { cx: x, cy: y - 40, r, fill: '#4a8a3a' }, g)
    svg('circle', { cx: x - r * 0.3, cy: y - 90, r: r * 0.6, fill: '#5aa04a' }, g)
  }
  svg('rect', { x: -900, y: 1080, width: 2900, height: 1400, fill: 'url(#lawn)' }, g)
  svg('path', { d: 'M 380 1080 L 700 1080 L 1300 2500 L -200 2500 Z', fill: '#d8c8a4' }, g)
}

// Les temps forts du live (cues.js).
const T = K

// Le live (un seul plan), puis le replay raconté par le narrateur.
const SHOTS = [
    {
      // I · L'ouverture « fait divers » : la caméra du parc, juste après le coup. L'affaire en une image.
      t1: K.LIVE0,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#0a0a0c')
        const world = svg('g', {}, g)
        const far = svg('g', { filter: 'url(#desat)' }, world)
        park(k, far)
        for (const [x, y, sc, ph] of [[330, 1085, 0.34, true], [410, 1070, 0.3, false], [640, 1065, 0.3, true], [700, 1080, 0.36, true], [930, 1095, 0.42, true], [300, 1230, 0.5, true]]) fig(far, { x, y, s: sc, fill: '#3a4048', head: '#454c55', armR: ph ? 150 : 8, phone: ph })
        const who = svg('g', {}, world)
        fig(who, { x: 560, y: 1185, s: 0.62, fill: '#a83a50', head: '#14161c', armR: 40, armL: 150, rot: -86 })
        const ph = svg('g', { transform: 'translate(310 1250) rotate(-70) scale(0.8)' }, who)
        svg('rect', { x: -26, y: -44, width: 52, height: 88, rx: 8, fill: '#10121a' }, ph)
        svg('path', { d: 'M -10 -30 L 6 0 L -8 24 M 6 0 L 18 -10', stroke: '#ffffff', 'stroke-width': 3, fill: 'none' }, ph)
        fig(who, { x: 780, y: 1200, s: 0.74, fill: '#2a3a5a', head: '#1a120c', armR: 120, armL: 70 })
        fig(who, { x: 860, y: 1205, s: 0.44, fill: '#c89a2a', head: '#7a4a2a', armL: 150, armR: 30 })
        const ring = svg('ellipse', { cx: 455, cy: 1172, rx: 175, ry: 62, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 7, 'stroke-dasharray': '26 14', opacity: 0, filter: 'url(#glow)' }, world)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#0f2028', opacity: 0.62, style: 'mix-blend-mode:multiply' }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        const scan = svg('pattern', { id: 'scanI', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, k.defs)
        svg('rect', { width: 8, height: 3, fill: '#000', opacity: 0.25 }, scan)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#scanI)' }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        const hud = svg('g', {}, g)
        for (const [x, y, sx, sy] of [[50, 190, 1, 1], [1030, 190, -1, 1], [50, 1870, 1, -1], [1030, 1870, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 60} L ${x} ${y} L ${x + sx * 60} ${y}`, stroke: '#ffffff', 'stroke-width': 7, fill: 'none', opacity: 0.8 }, hud)
        const rec = svg('circle', { cx: 100, cy: 1820, r: 13, fill: '#ff2a3d' }, hud)
        txt(hud, 'CAM 03 · PARC', { x: 125, y: 1832, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'start', opacity: 0.85 })
        const clock = txt(hud, '', { x: 1000, y: 1832, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'end', opacity: 0.85 })
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        return { world, ring, rec, clock, fl }
      },
      draw(k, s, t, l) {
        const p = k.ease.io2(k.clamp((t - K.INTRO_YT) / 0.5))
        const z = 1.55 + 0.04 * l + 0.18 * p
        const cx = k.lerp(610, 570, p)
        s.world.setAttribute('transform', `translate(540 960) scale(${z.toFixed(4)}) translate(${-cx} -1140)`)
        const v = k.ease.out3(k.clamp((t - K.INTRO_YT) / 0.25))
        s.ring.setAttribute('opacity', v.toFixed(2))
        s.ring.setAttribute('stroke-dashoffset', (-t * 60).toFixed(0))
        s.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2)
        s.clock.textContent = `14:32:${String(7 + Math.floor(t)).padStart(2, '0')}`
        s.fl.setAttribute('opacity', 0)
      },
    },
    {
      // Le live : du selfie à la chute du téléphone.
      t1: K.REWIND,
      build(k, g) {
        const { svg, txt, bg, burst } = k
        bg(g, '#0a0a0c')
        // ---- La caméra selfie : lui, en gros plan, le parc derrière.
        const selfie = svg('g', {}, g)
        const sBack = svg('g', { filter: 'url(#blur6)' }, selfie)
        park(k, sBack)
        const yt = k.makePerson(selfie, YT)
        const bala = svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, yt.head)
        // ---- La caméra arrière : le parc, le banc, l'enfant ; son bras ; le passant.
        const rear = svg('g', {}, g)
        const world = svg('g', {}, rear)
        park(k, world)
        svg('rect', { x: 360, y: 1180, width: 360, height: 30, rx: 10, fill: '#8a5a30' }, world)
        svg('rect', { x: 360, y: 1120, width: 360, height: 24, rx: 10, fill: '#8a5a30' }, world)
        const kid = k.makePerson(world, KID)
        for (const x of [380, 690]) svg('rect', { x, y: 1210, width: 18, height: 90, fill: '#3a3a3a' }, world)
        const pas = k.makePerson(world, PASSANT)
        const arm = svg('g', {}, rear)
        svg('path', { d: 'M -200 2100 C 100 1700 300 1450 420 1300', fill: 'none', stroke: '#10121a', 'stroke-width': 170, 'stroke-linecap': 'round' }, arm)
        svg('circle', { cx: 430, cy: 1290, r: 72, fill: '#f0c8a0' }, arm)
        const fist = svg('g', { opacity: 0 }, rear)
        svg('path', { d: 'M 900 2100 L 620 1200', stroke: '#2a3a5a', 'stroke-width': 280, 'stroke-linecap': 'round' }, fist)
        svg('rect', { x: 420, y: 860, width: 380, height: 330, rx: 100, fill: '#a8714e', stroke: '#10121a', 'stroke-width': 14 }, fist)
        for (let i = 0; i < 4; i++) svg('path', { d: `M ${460 + i * 85} 880 L ${460 + i * 85} 980`, stroke: '#6a4430', 'stroke-width': 12, 'stroke-linecap': 'round' }, fist)
        const help = burst(rear, 'AU SECOURS !', { fill: '#ffd166', ink: '#e5484d', size: 100, r: 250 })
        const paf = burst(g, 'PAF !', { fill: '#ffffff', ink: '#e5484d', size: 230, r: 330, points: 18 })
        // ---- Par terre : le ciel, l'herbe, l'écran fissuré ; le passant penché ; l'enfant qui s'enfuit.
        const ground = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#daySky)' }, ground)
        for (const [x, r] of [[120, 300], [900, 340]]) svg('circle', { cx: x, cy: 260, r, fill: '#4a8a3a' }, ground)
        const over = k.makePerson(ground, PASSANT)
        over.root.setAttribute('filter', 'url(#sil)')
        svg('path', { d: 'M -400 1500 Q 540 1380 1500 1500 L 1500 2300 L -400 2300 Z', fill: '#3a6a32' }, ground)
        for (let i = 0; i < 50; i++) svg('path', { d: `M ${(i * 97) % 1080} ${1500 + ((i * 53) % 400)} l 10 -60 l 10 60`, fill: '#4a8a3a' }, ground)
        const limp = svg('g', {}, ground)
        svg('path', { d: 'M 1200 1900 L 820 1700', stroke: '#10121a', 'stroke-width': 150, 'stroke-linecap': 'round' }, limp)
        svg('circle', { cx: 800, cy: 1690, r: 66, fill: '#f0c8a0' }, limp)
        const run = svg('g', {}, ground)
        svg('circle', { r: 40, fill: '#7a4a2a' }, run)
        svg('ellipse', { cy: 80, rx: 45, ry: 60, fill: '#ffd166' }, run)
        const crack = svg('g', { opacity: 0 }, g)
        for (const d of ['M 620 700 L 480 420 L 520 120', 'M 620 700 L 900 520 L 1100 560', 'M 620 700 L 700 1100 L 640 1500', 'M 620 700 L 300 860 L -20 820', 'M 480 420 L 300 330']) svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 8, opacity: 0.9 }, crack)
        svg('circle', { cx: 620, cy: 700, r: 30, fill: 'none', stroke: '#ffffff', 'stroke-width': 6 }, crack)
        // ---- L'interface du live (fixe).
        const ui = svg('g', {}, g)
        svg('circle', { cx: 105, cy: 120, r: 38, fill: '#fe2c55', stroke: '#ffffff', 'stroke-width': 6 }, ui)
        txt(ui, '@kevin.experiences', { x: 165, y: 112, 'font-size': 38, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 6, 'paint-order': 'stroke fill' })
        txt(ui, '2,1 M abonnés', { x: 165, y: 152, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 5, 'paint-order': 'stroke fill' })
        svg('rect', { x: 760, y: 88, width: 120, height: 56, rx: 12, fill: '#fe2c55' }, ui)
        txt(ui, 'LIVE', { x: 820, y: 128, 'font-size': 36, fill: '#ffffff' })
        svg('rect', { x: 890, y: 88, width: 150, height: 56, rx: 12, fill: '#000', opacity: 0.5 }, ui)
        const views = txt(ui, '', { x: 965, y: 128, 'font-size': 34, fill: '#ffffff' })
        const title = svg('g', {}, ui)
        svg('rect', { x: -320, y: -42, width: 640, height: 84, rx: 20, fill: '#000', opacity: 0.55 }, title)
        txt(title, 'EXPÉRIENCE SOCIALE', { y: 16, 'font-size': 44, fill: '#ffffff' })
        const msgs = [
          ['@nono', 'trop hâte mdr', '#ffffff'],
          ['@lea.b', 'vas-y fais-le', '#ffffff'],
          ['@sam', 'c’est un vrai gosse ???', '#ffd166'],
          ['@jojo', 'c’est pas drôle là', '#ffd166'],
          ['@inès', 'il pleure le petit…', '#ff6b6b'],
          ['@kz', 'MDRRR LE PASSANT', '#ffffff'],
          ['@yanis', 'il bouge plus ?', '#ff6b6b'],
          ['@paul', 'APPELEZ LES SECOURS', '#ff6b6b'],
          ['@lea.b', 'c’était un prank !!!', '#ffd166'],
        ].map(([w, m2, c]) => {
          const b = svg('g', { opacity: 0 }, ui)
          svg('rect', { x: 0, y: -40, width: 40 + 21 * (w.length + m2.length), height: 74, rx: 37, fill: c === '#ff6b6b' ? '#7a1018' : '#000', opacity: c === '#ffffff' ? 0.55 : 0.85 }, b)
          const tt = txt(b, '', { x: 24, y: 12, 'font-size': 36, 'text-anchor': 'start' })
          svg('tspan', { fill: '#9fd0ff', 'font-weight': 900 }, tt).textContent = `${w} `
          svg('tspan', { fill: c }, tt).textContent = m2
          return b
        })
        return { selfie, yt, bala, rear, world, kid, pas, arm, fist, help, paf, ground, over, limp, run, crack, ui, views, title, msgs }
      },
      draw(k, s, t) {
        const flipK = k.clamp((t - (T.FLIP - 0.12)) / 0.24)
        const isRear = t >= T.FLIP
        const onGround = t >= T.GROUND
        k.show(s.selfie, !isRear)
        k.show(s.rear, isRear && t < T.GROUND)
        s.ground.setAttribute('opacity', onGround ? 1 : 0)
        // Le retournement de caméra : l'image s'écrase puis revient.
        const squash = Math.abs(Math.cos(Math.PI * flipK))
        const hand = (amp) => `translate(${(amp * (8 * Math.sin(t * 7.3) + 4 * Math.sin(t * 17))).toFixed(1)} ${(amp * 6 * Math.sin(t * 6.1 + 1)).toFixed(1)})`
        // ---- Selfie.
        if (!isRear) {
          s.selfie.setAttribute('transform', `translate(540 960) scale(${squash.toFixed(3)} 1) translate(-540 -960) ${hand(1)}`)
          s.yt.update(t, { x: 540, y: 1270, scale: 1.5, mouth: k.mouth('youtubeur', t), brows: t > T.MASK ? 'angry' : 'neutral', look: [0, 0.1], armR: [2.3, 0.9], armL: t > T.MASK - 0.4 && t < T.MASK + 0.3 ? [2.7, 1.6] : [0.3, 0.5], headTilt: 0.08 * Math.sin(t * 2), seed: 2 })
          const m = k.ease.out3(k.clamp((t - T.MASK) / 0.3))
          s.bala.setAttribute('transform', `translate(0 ${(-420 * (1 - m)).toFixed(0)})`)
          s.bala.setAttribute('opacity', m > 0.01 ? 1 : 0)
        }
        // ---- Caméra arrière : il marche vers le banc, attrape l'enfant ; le passant charge ; le poing.
        if (isRear && !onGround) {
          const walk = k.ease.io2(k.clamp((t - T.FLIP) / (T.GRAB - T.FLIP)))
          const z = k.lerp(1.0, 1.9, walk)
          const bob = (1 - walk) * 18 * Math.abs(Math.sin(t * 9))
          const spin = t > T.FALL ? k.ease.in2(k.clamp((t - T.FALL) / (T.GROUND - T.FALL))) : 0
          const shake = t > T.GRAB && t < T.PUNCH ? 14 * Math.sin(t * 40) : 0
          s.rear.setAttribute('transform', `translate(540 960) scale(${(squash * (1 + 0.5 * spin)).toFixed(3)} ${(1 + 0.5 * spin).toFixed(3)}) rotate(${(spin * 220).toFixed(1)}) translate(-540 -960) ${hand(1.4)}`)
          s.world.setAttribute('transform', `translate(540 ${960 + bob}) scale(${z}) translate(-540 -1000) translate(${shake} 0)`)
          const grabbed = t > T.GRAB
          s.kid.update(t, { x: 540 + (grabbed ? 10 * Math.sin(t * 40) : 0), y: 1030, scale: 0.42, mouth: grabbed ? 1 : 0.2, brows: grabbed ? 'surprised' : 'neutral', look: grabbed ? [-0.4, 0.3] : [0, 0.4], armR: grabbed ? [2.6 + 0.3 * Math.sin(t * 30), 0.6] : [0.5, 1.4], armL: grabbed ? [1.4, 0.2] : [0.5, 1.4], tearT: grabbed ? t - T.GRAB : -1, seed: 3 })
          const a = k.ease.out3(k.clamp((t - (T.GRAB - 0.3)) / 0.3))
          s.arm.setAttribute('transform', `translate(${k.lerp(-500, 0, a)} ${k.lerp(600, 0, a) + (grabbed ? 12 * Math.sin(t * 40) : 0)})`)
          k.burstAt(s.help, t, T.GRAB + 0.05, T.PUNCH - 0.2, 760, 600, 8, 0.72)
          const p = k.ease.in2(k.clamp((t - T.PASS) / (T.PUNCH - T.PASS)))
          s.pas.root.setAttribute('opacity', t > T.PASS ? 1 : 0)
          s.pas.update(t, { x: k.lerp(1300, 700, p), y: k.lerp(1040, 1120, p), scale: k.lerp(0.45, 1.1, p), mouth: k.mouth('passant', t), brows: 'angry', look: [-0.4, 0], armR: [1.2 + 0.5 * Math.sin(t * 16), 1.1], armL: [1.2 - 0.5 * Math.sin(t * 16), 1.1], lean: -0.1, seed: 4 })
          const f = k.ease.in3(k.clamp((t - (T.PUNCH - 0.15)) / 0.15))
          s.fist.setAttribute('opacity', t > T.PUNCH - 0.15 && t < T.FALL + 0.1 ? 1 : 0)
          s.fist.setAttribute('transform', `translate(540 960) scale(${k.lerp(0.5, 2.2, f)}) translate(-540 -960)`)
        }
        k.burstAt(s.paf, t, T.PUNCH, T.GROUND - 0.1, 540, 900, -10, 1.1)
        // ---- Par terre : face au ciel, l'écran fissuré ; le live continue.
        if (onGround) {
          const l = t - T.GROUND
          s.over.update(t, { x: 560, y: 1150, scale: 1.3, look: [0, 0.6], armR: [0.3, 0.6], armL: [0.3, 0.6], seed: 4 })
          s.over.root.setAttribute('opacity', l < 1.0 ? 1 : Math.max(0, 1 - (l - 1.0) * 2).toFixed(2))
          k.place(s.run, k.lerp(700, 1200, k.clamp(l / 1.2)), 1450 - 20 * Math.abs(Math.sin(t * 14)), 0.8, 0)
          s.ground.setAttribute('transform', `rotate(-14 540 960) ${hand(0.3)}`)
        }
        s.crack.setAttribute('opacity', onGround ? 1 : 0)
        // ---- Interface : spectateurs qui s'envolent, commentaires en haut.
        const v = 12.4 + t * 0.4 + (t > T.GRAB ? (t - T.GRAB) * 3 : 0) + (t > T.PUNCH ? (t - T.PUNCH) * 14 : 0)
        s.views.textContent = `${v.toFixed(1).replace('.', ',')} k`
        k.place(s.title, 540, 250, t < T.FLIP ? 1 : 0, 0)
        const times = [T.LIVE0 + 0.5, T.LIVE0 + 1.4, T.FLIP + 0.4, T.GRAB - 0.25, T.GRAB + 0.35, T.PUNCH + 0.25, T.GROUND + 0.2, T.GROUND + 0.55, T.GROUND + 0.9]
        const shown = times.filter((a2) => t >= a2).length
        s.msgs.forEach((b, i) => {
          const a2 = times[i]
          const row = shown - 1 - i
          b.setAttribute('opacity', t >= a2 && row < 4 ? (1 - row * 0.12).toFixed(2) : 0)
          if (t >= a2) k.place(b, 30, 640 - row * 82 + 30 * Math.exp(-(t - a2) * 18), 0.98 + 0.15 * Math.exp(-(t - a2) * 10), 0)
        })
      },
    },
    {
      // R1 · La chaîne de Kevin : 2 millions d'abonnés, des miniatures « prank » à la chaîne.
      t1: K.FAUX,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#0e0e12')
        const page = svg('g', {}, g)
        svg('rect', { x: -100, y: -300, width: 1280, height: 700, fill: 'url(#banner)' }, page)
        for (let i = 0; i < 3; i++) txt(page, 'PRANK · PRANK · PRANK', { x: 540 + (i % 2) * 120, y: 70 + i * 150, 'font-size': 150, fill: '#ffffff', opacity: 0.12 })
        const cp = svg('clipPath', { id: 'avaClip' }, k.defs)
        svg('circle', { cx: 540, cy: 520, r: 150 }, cp)
        svg('circle', { cx: 540, cy: 520, r: 170, fill: '#0e0e12' }, page)
        svg('circle', { cx: 540, cy: 520, r: 160, fill: 'none', stroke: '#fe2c55', 'stroke-width': 10 }, page)
        const av = svg('g', { 'clip-path': 'url(#avaClip)' }, page)
        svg('rect', { x: 380, y: 360, width: 320, height: 320, fill: '#ffd166' }, av)
        const kev = k.makePerson(av, YT)
        txt(page, '@kevin.experiences', { x: 540, y: 760, 'font-size': 56, fill: '#ffffff' })
        const subs = txt(page, '', { x: 540, y: 905, 'font-size': 140, fill: '#ffffff' })
        txt(page, 'ABONNÉS', { x: 540, y: 975, 'font-size': 44, fill: '#9aa0aa', 'letter-spacing': 8 })
        const T2 = ['FAUX ENLÈVEMENT ?!', 'IL A PLEURÉ…', 'J’AI VOLÉ SA MAMIE', 'LA POLICE ARRIVE', 'FAUSSE BOMBE !', 'PRANK EXTRÊME']
        const cols = ['#ff3b5c', '#ffb020', '#3b82f6', '#12a150', '#8a2be2', '#ff6a00']
        T2.forEach((s, i) => {
          const th = svg('g', { transform: `translate(${40 + (i % 2) * 510} ${1050 + Math.floor(i / 2) * 300})` }, page)
          svg('rect', { width: 490, height: 276, rx: 22, fill: cols[i] }, th)
          svg('circle', { cx: 380, cy: 110, r: 150, fill: '#ffffff', opacity: 0.18 }, th)
          fig(th, { x: 130, y: 250, s: 0.55, fill: '#10121a', armR: 150, armL: 160 })
          txt(th, s, { x: 300, y: 236, 'font-size': 38, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 9, 'paint-order': 'stroke fill' })
          txt(th, `${(1.2 + i * 0.7).toFixed(1).replace('.', ',')} M vues`, { x: 470, y: 50, 'font-size': 28, fill: '#ffffff', 'text-anchor': 'end' })
        })
        return { page, kev, subs }
      },
      draw(k, s, t, l) {
        s.kev.update(t, { x: 540, y: 650, scale: 0.55, mouth: 0.3 + 0.2 * Math.abs(Math.sin(t * 6)), brows: 'neutral', look: [0, 0], armR: [0.3, 0.5], armL: [0.3, 0.5], seed: 2 })
        const v = 2100000 * k.ease.out3(k.clamp((t - (Wd('02', '2') - 0.25)) / 0.8))
        s.subs.textContent = Math.round(v).toLocaleString('fr-FR')
        s.page.setAttribute('transform', `translate(0 ${(-Math.max(0, l - 0.5) * 70).toFixed(1)})`)
      },
    },
    {
      // R2 · Le live : la cagoule, le badge « EN DIRECT ».
      t1: K.TIMEO,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#0a0a0c')
        const back = svg('g', { filter: 'url(#blur14)' }, g)
        park(k, back)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#05060a', opacity: 0.5 }, g)
        const p = k.makePerson(g, YT)
        svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, p.head)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
        const badge = svg('g', {}, g)
        svg('rect', { x: -230, y: -66, width: 460, height: 132, rx: 30, fill: '#fe2c55', filter: 'url(#glow)' }, badge)
        const dot = svg('circle', { cx: -160, cy: 0, r: 22, fill: '#ffffff' }, badge)
        txt(badge, 'EN DIRECT', { x: 30, y: 26, 'font-size': 72, fill: '#ffffff' })
        const views = txt(g, '', { x: 540, y: 460, 'font-size': 44, fill: '#ffffff' })
        const hearts = Array.from({ length: 12 }, (_, i) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff9ab0', '#ffd166'][i % 3], opacity: 0 }, g), d: i * 0.11, x: 900 + (i % 3) * 40 }))
        return { p, badge, dot, views, hearts }
      },
      draw(k, s, t, l) {
        s.p.update(t, { x: 540, y: 1360, scale: 1.55 + 0.08 * l, brows: 'angry', look: [0, 0.1], armR: [2.3, 0.9], armL: [0.3, 0.5], headTilt: 0.06 * Math.sin(t * 2), seed: 2 })
        k.place(s.badge, 540, 330, 1 + 0.04 * Math.max(0, Math.sin(t * 8)) ** 4, -2)
        s.dot.setAttribute('opacity', Math.floor(t * 3) % 2 ? 0.3 : 1)
        s.views.textContent = `${(48.2 + l * 9).toFixed(1).replace('.', ',')} k spectateurs`
        for (const h of s.hearts) {
          const u = ((l + h.d) % 1.2) / 1.2
          h.el.setAttribute('opacity', (Math.sin(Math.PI * u) * 0.9).toFixed(2))
          k.place(h.el, h.x + 20 * Math.sin(u * 8 + h.d * 9), 1300 - u * 600, 0.8, 0)
        }
      },
    },
    {
      // R3 · Timéo, 8 ans, et son billet de 50 €.
      t1: K.RACHID,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#ffdca6')
        svg('ellipse', { cx: 540, cy: 760, rx: 760, ry: 760, fill: 'url(#sunG)' }, g)
        const bk = bokeh(g, 18, ['#ffffff', '#ffd166', '#ff9ab0'], 31, { op: 0.45, r0: 20, r1: 70, vy: 30 })
        const kid = k.makePerson(g, KID)
        const bill = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -190, y: -100, width: 380, height: 200, rx: 16, fill: '#f2a64a', stroke: '#a8641a', 'stroke-width': 8 }, bill)
        svg('rect', { x: -160, y: -72, width: 320, height: 144, rx: 10, fill: 'none', stroke: '#c8802a', 'stroke-width': 4 }, bill)
        svg('circle', { cx: 100, cy: 0, r: 52, fill: '#ffd08a' }, bill)
        txt(bill, '50', { x: -40, y: 40, 'font-size': 120, fill: '#7a3a0a' })
        txt(bill, '€', { x: 100, y: 22, 'font-size': 64, fill: '#a8641a' })
        const glint = svg('rect', { x: -60, y: -110, width: 40, height: 220, fill: '#ffffff', opacity: 0.5, transform: 'skewX(-20)' }, bill)
        return { bk, kid, bill, glint }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        s.kid.update(t, { x: 540, y: 1320, scale: 1.25 + 0.04 * l, mouth: 0.25, brows: 'neutral', look: [0.1, -0.5], armR: [0.4, 0.6], armL: [0.4, 0.6], headTilt: 0.06 * Math.sin(t * 2), seed: 3 })
        const b0 = Wd('02', '50') - 0.25
        const v = k.popS(t, b0, Infinity, 0.35)
        s.bill.setAttribute('opacity', v > 0.01 ? 1 : 0)
        k.place(s.bill, 540 + 16 * Math.sin(t * 2.3), 560 + 14 * Math.sin(t * 3.1), v, 6 * Math.sin(t * 1.7))
        s.glint.setAttribute('x', (-260 + ((t - b0) * 500) % 700).toFixed(0))
      },
    },
    {
      // R4 · Rachid, père de deux enfants, dans la lumière chaude du salon.
      t1: K.COUP,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#warmRoom)')
        svg('rect', { x: 660, y: 260, width: 320, height: 520, rx: 10, fill: '#ffe0a8', opacity: 0.3 }, g)
        svg('path', { d: 'M 820 260 L 820 780 M 660 520 L 980 520', stroke: '#3a2414', 'stroke-width': 16 }, g)
        svg('path', { d: 'M 660 260 L 980 260 L 520 1900 L -200 1900 Z', fill: 'url(#beam)', opacity: 0.45 }, g)
        svg('ellipse', { cx: 180, cy: 640, rx: 300, ry: 300, fill: 'url(#lampG)', opacity: 0.7 }, g)
        const bk = bokeh(g, 14, ['#ffd28a', '#ffb050'], 41, { op: 0.3, r0: 24, r1: 90, blur: 'blur30', vy: 8 })
        svg('rect', { x: 40, y: 1140, width: 1000, height: 300, rx: 70, fill: '#5a2e20' }, g)
        const r = k.makePerson(g, PASSANT)
        const girl = k.makePerson(g, { robe: '#ff7aa8', jabot: false, collar: '#ffd0e0', hair: 'bob', hairColor: '#1a120c', skin: '#b07a52', iris: '#1a120c', female: true })
        const boy = k.makePerson(g, { robe: '#3b82f6', jabot: false, collar: '#1f2d55', hair: 'short', hairColor: '#1a120c', skin: '#a8714e', iris: '#1a120c' })
        return { bk, r, girl, boy }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        s.r.update(t, { x: 540, y: 1150, scale: 1.05 + 0.03 * l, mouth: 0.12, brows: 'neutral', look: [0, 0.25], armR: [0.95, 0.9], armL: [0.95, 0.9], headTilt: 0.05 * Math.sin(t * 1.5), seed: 4 })
        s.girl.update(t, { x: 270, y: 1360, scale: 0.6, mouth: 0.2, look: [0.5, -0.3], armR: [0.3, 0.6], armL: [0.3, 0.6], seed: 1 })
        s.boy.update(t, { x: 810, y: 1370, scale: 0.58, mouth: 0.2, look: [-0.5, -0.3], armR: [0.3, 0.6], armL: [0.3, 0.6], seed: 5 })
      },
    },
    {
      // R5 · Un seul coup : au ralenti, deux silhouettes devant le ciel orange.
      t1: K.COMA,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#goldSky)')
        svg('ellipse', { cx: 600, cy: 1020, rx: 620, ry: 620, fill: 'url(#sunCore)' }, g)
        const ry = rays(g, 28, '#fff0c0', 0.07)
        svg('use', { href: '#punchPair', filter: 'url(#rimGold)' }, g)
        const pair = svg('g', { id: 'punchPair' }, g)
        const r = k.makePerson(pair, PASSANT)
        const kv = k.makePerson(pair, YT)
        svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, kv.head)
        pair.setAttribute('filter', 'url(#sil)')
        svg('path', { d: 'M -200 1330 Q 540 1260 1300 1340 L 1300 2100 L -200 2100 Z', fill: '#140810' }, g)
        const rings = Array.from({ length: 3 }, () => svg('circle', { r: 10, fill: 'none', stroke: '#ffffff', 'stroke-width': 10, opacity: 0 }, g))
        return { ry, r, kv, rings }
      },
      draw(k, s, t, l) {
        s.ry.setAttribute('transform', `translate(600 1020) rotate(${(t * 6).toFixed(1)})`)
        const p = k.ease.out3(k.clamp(l / 0.35))
        s.r.update(t, { x: k.lerp(200, 250, p), y: 1150, scale: 0.85, brows: 'angry', armR: [2.1, k.lerp(0.9, 0, p)], armL: [0.6, 1.2], lean: 0.05, seed: 4 })
        const h = k.ease.out3(k.clamp((l - 0.3) / 0.6))
        s.kv.update(t, { x: 820 + 40 * h, y: 1150, scale: 0.85, armR: [0.4 + h, 0.5], armL: [0.4 + 0.6 * h, 0.5], lean: 0.32 * h, headTilt: 0.5 * h, seed: 2 })
        s.rings.forEach((c, i) => {
          const u = (l - 0.32 - i * 0.12) / 0.6
          c.setAttribute('opacity', u > 0 && u < 1 ? (0.8 * (1 - u)).toFixed(2) : 0)
          c.setAttribute('cx', 700)
          c.setAttribute('cy', 1050)
          c.setAttribute('r', (20 + 340 * k.ease.out3(k.clamp(u))).toFixed(0))
        })
      },
    },
    {
      // R6 · Trois semaines de coma : l'hôpital, le moniteur.
      t1: K.TODAY,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, 'url(#hospWall)')
        for (let i = 0; i < 9; i++) svg('rect', { x: 60, y: 200 + i * 44, width: 420, height: 24, fill: '#ffffff', opacity: 0.5 }, g)
        svg('ellipse', { cx: 540, cy: 1000, rx: 340, ry: 130, fill: '#ffffff' }, g)
        const kv = k.makePerson(g, KEV)
        bandage(kv)
        svg('path', { d: 'M -200 1180 Q 540 1110 1300 1180 L 1300 2100 L -200 2100 Z', fill: '#dfe8f0' }, g)
        svg('path', { d: 'M 120 1260 Q 540 1210 980 1270', fill: 'none', stroke: '#c4d0dc', 'stroke-width': 10 }, g)
        const mon = svg('g', { transform: 'translate(560 230)' }, g)
        svg('rect', { width: 460, height: 290, rx: 24, fill: '#07120e', stroke: '#3a4a44', 'stroke-width': 10 }, mon)
        const ecg = svg('path', { d: '', fill: 'none', stroke: '#33ff88', 'stroke-width': 7, filter: 'url(#glow)' }, mon)
        txt(mon, '48', { x: 400, y: 80, 'font-size': 60, fill: '#33ff88' })
        txt(mon, 'BPM', { x: 400, y: 116, 'font-size': 24, fill: '#33ff88' })
        return { kv, ecg }
      },
      draw(k, s, t, l) {
        s.kv.update(t, { x: 540, y: 1150, scale: 0.95, mouth: 0, brows: 'sad', blink: 1, look: [0, 0], armR: [0.1, 0.2], armL: [0.1, 0.2], headTilt: 0.12, breathe: 0.4, seed: 2 })
        let d = ''
        for (let x = 20; x <= 340; x += 5) {
          const ph = ((x / 320 - t * 0.9) % 1 + 1) % 1
          const y = 170 + (ph > 0.46 && ph < 0.5 ? -90 * Math.sin(((ph - 0.46) / 0.04) * Math.PI) : ph > 0.5 && ph < 0.53 ? 40 * Math.sin(((ph - 0.5) / 0.03) * Math.PI) : 0)
          d += `${x === 20 ? 'M' : 'L'} ${x} ${y.toFixed(0)} `
        }
        s.ecg.setAttribute('d', d)
      },
    },
    {
      // E · Rachid sous le projecteur ; le marteau.
      t1: SEC_HOOK_END,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#judgeBg)')
        svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, g)
        const bk = bokeh(g, 10, ['#bcd2ff'], 51, { op: 0.15, r0: 6, r1: 16, blur: 'blur6', vy: 14, x0: 200, x1: 880 })
        const r = k.makePerson(g, PASSANT)
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        return { bk, r, fl, gavel }
      },
      draw(k, s, t, l) {
        s.bk.draw(t)
        s.r.update(t, { x: 540, y: 1080, scale: 1.15 + 0.03 * l, brows: 'sad', look: [0, 0.2], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 4 })
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
const HUG_ARM = reach(300, 90)
const CUT_DEFS = {
  // « C'est le temps entre son cri et son poing » : le chronomètre rouge.
  CHRONO: {
    build(g) {
      const back = svg('g', { filter: 'url(#blur14)' }, g)
      park(kit, back)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#2a0008', opacity: 0.82 }, g)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigRed)' }, g)
      const ring = svg('g', {}, g)
      svg('circle', { r: 372, fill: '#000', opacity: 0.4 }, ring)
      for (let k = 0; k < 60; k++) {
        const a = (k / 60) * Math.PI * 2
        const r1 = k % 5 ? 320 : 302
        svg('path', { d: `M ${(Math.cos(a) * r1).toFixed(1)} ${(Math.sin(a) * r1).toFixed(1)} L ${(Math.cos(a) * 340).toFixed(1)} ${(Math.sin(a) * 340).toFixed(1)}`, stroke: '#ffffff', 'stroke-width': k % 5 ? 4 : 9, opacity: 0.55 }, ring)
      }
      svg('circle', { r: 268, fill: 'none', stroke: '#3a0a12', 'stroke-width': 38 }, ring)
      const C2 = 2 * Math.PI * 268
      const arc = svg('circle', { r: 268, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 38, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${C2}`, transform: 'rotate(-90)', filter: 'url(#glow)' }, ring)
      const hand = svg('path', { d: 'M 0 36 L 0 -250', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round' }, ring)
      svg('circle', { r: 18, fill: '#ffffff' }, ring)
      const num = txt(ring, '0,00', { y: 140, 'font-size': 150, fill: '#ffffff' })
      txt(ring, 'SECONDE', { y: 205, 'font-size': 40, fill: '#ff9aa4', 'letter-spacing': 6 })
      const cri = label(g, 'SON CRI', { size: 44, fill: '#ffffff', ink: '#c8102e' })
      const poing = label(g, 'SON POING', { size: 52, fill: '#ff2a3d', ink: '#ffffff' })
      return { ring, arc, hand, num, cri, poing, C2 }
    },
    draw(s, t, l) {
      const v = clamp((l - 0.1) / 1.35) * 1.8
      s.arc.setAttribute('stroke-dasharray', `${((s.C2 * v) / 2).toFixed(1)} ${s.C2}`)
      s.hand.setAttribute('transform', `rotate(${((v / 2) * 360).toFixed(1)})`)
      s.num.textContent = v.toFixed(2).replace('.', ',')
      const beat = 1 + 0.035 * Math.max(0, Math.sin(t * 9)) ** 8
      place(s.ring, 540, 820, beat, 0)
      place(s.cri, 540, 380, popS(t, t - l + 0.05, Infinity, 0.25), -3)
      const end = l > 1.45
      s.poing.setAttribute('opacity', end ? 1 : 0)
      place(s.poing, 300, 480, end ? 1 + 0.5 * Math.exp(-(l - 1.45) * 12) : 0.001, -8)
    },
  },
  // « J'ai regardé ce live image par image » : la pellicule qui avance d'une image à la fois.
  FILM: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#0c0b0a' }, g)
      const bk = bokeh(g, 16, ['#ffb060', '#ff7040', '#ffd8a0'], 5, { op: 0.28, r0: 30, r1: 110, blur: 'blur30', vy: 10 })
      const strip = svg('g', {}, g)
      const N = 8
      const FW = 440
      svg('rect', { x: -60, y: 560, width: N * FW + 120, height: 520, fill: '#171513' }, strip)
      for (let i = 0; i < N * 6 + 2; i++) for (const y of [588, 1032]) svg('rect', { x: -40 + i * 74, y, width: 40, height: 30, rx: 6, fill: '#e8dcc8', opacity: 0.85 }, strip)
      const M = '#0a0b0e'
      const Y = '#ffd166'
      const P = '#2a3a5a'
      for (let i = 0; i < N; i++) {
        const fx = i * FW + 20
        const cp = svg('clipPath', { id: `film${i}` }, defs)
        svg('rect', { x: fx, y: 640, width: FW - 40, height: 370, rx: 8 }, cp)
        const f = svg('g', { 'clip-path': `url(#film${i})` }, strip)
        svg('rect', { x: fx, y: 640, width: FW - 40, height: 250, fill: 'url(#daySky)' }, f)
        svg('rect', { x: fx, y: 880, width: FW - 40, height: 140, fill: 'url(#lawn)' }, f)
        for (const tx of [50, 330]) svg('circle', { cx: fx + tx, cy: 780, r: 90, fill: '#4a8a3a' }, f)
        const c = fx + 200
        const gy = 990
        if (i < 6) fig(f, { x: c - 50 + (i === 5 ? 20 : 0), y: gy, s: 0.5, fill: M, armR: 80, rot: i === 5 ? 28 : 0 })
        if (i === 6) fig(f, { x: c - 120, y: gy - 10, s: 0.5, fill: M, rot: 90 })
        if (i < 7) fig(f, { x: c + 40 + (i > 5 ? 60 : 0), y: gy, s: 0.3, fill: Y, armR: i < 5 ? 160 : 20, armL: i < 5 ? 150 : 20 })
        if (i >= 2 && i <= 6) {
          const px = [0, 0, 190, 150, 100, 60, 0][i]
          fig(f, { x: c + px, y: gy, s: [0, 0, 0.32, 0.42, 0.5, 0.5, 0.5][i], fill: P, armR: i === 4 ? 170 : i === 5 ? 95 : 15, armL: i === 3 ? 140 : 20 })
        }
        if (i === 5) {
          let d = ''
          for (let q = 0; q < 16; q++) d += `${q ? 'L' : 'M'} ${(c + 10 + Math.cos((q / 16) * Math.PI * 2) * (q % 2 ? 22 : 50)).toFixed(0)} ${(gy - 175 + Math.sin((q / 16) * Math.PI * 2) * (q % 2 ? 22 : 50)).toFixed(0)} `
          svg('path', { d: `${d}Z`, fill: '#ffffff' }, f)
        }
        if (i === 7) {
          fig(f, { x: c - 30, y: gy + 40, s: 0.42, fill: P, armR: 60 })
          fig(f, { x: c + 40, y: gy, s: 0.3, fill: Y })
        }
        txt(strip, String(12 + i * 6).padStart(4, '0'), { x: fx + FW - 60, y: 630, 'font-size': 20, fill: '#e8dcc8', opacity: 0.6 })
      }
      const bracket = svg('g', {}, g)
      svg('rect', { x: 330, y: 628, width: 420, height: 394, rx: 14, fill: 'none', stroke: '#ffd166', 'stroke-width': 10, filter: 'url(#glow)' }, bracket)
      const count = txt(g, '', { x: 540, y: 1150, 'font-size': 52, fill: '#ffd166', 'letter-spacing': 4 })
      const flick = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#fff6e0', opacity: 0 }, g)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      return { bk, strip, count, flick, FW }
    },
    draw(s, t, l) {
      s.bk.draw(t)
      const q = l / 0.56
      const idx = Math.min(7, Math.floor(q) + ease.out3(clamp((q % 1) / 0.3)))
      s.strip.setAttribute('transform', `translate(540 825) rotate(-3) translate(${(-(idx * s.FW + s.FW / 2)).toFixed(1)} -825)`)
      s.count.textContent = `IMAGE ${String(12 + Math.round(idx) * 6).padStart(4, '0')} / 0054`
      s.flick.setAttribute('opacity', (0.05 * Math.exp(-((q % 1) * 6)) + 0.02 * rng(Math.floor(t * 30))()).toFixed(3))
    },
  },
  // « …pour qu'un enfant disparaisse dans une voiture » : la portière coulissante qui claque.
  VAN: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#blueNight)' }, g)
      const r = rng(13)
      for (let i = 0; i < 6; i++) {
        const x = -60 + i * 200
        const h = 500 + r() * 300
        svg('rect', { x, y: 1240 - h, width: 190, height: h, fill: '#0a1224' }, g)
        for (let wy = 1240 - h + 40; wy < 1180; wy += 80) for (let wx = x + 24; wx < x + 170; wx += 56) if (r() < 0.45) svg('rect', { x: wx, y: wy, width: 30, height: 44, fill: '#ffcf80', opacity: (0.3 + 0.5 * r()).toFixed(2) }, g)
      }
      const bk = bokeh(g, 12, ['#ffcf80', '#ff9a50', '#9fd0ff'], 8, { y0: 300, y1: 1100, op: 0.4, r0: 16, r1: 50, vy: 0 })
      svg('ellipse', { cx: 900, cy: 620, rx: 380, ry: 460, fill: 'url(#lampG)', opacity: 0.55 }, g)
      svg('rect', { x: 960, y: 520, width: 16, height: 740, fill: '#1a2030' }, g)
      svg('rect', { x: -400, y: 1240, width: 1900, height: 1100, fill: 'url(#asph)' }, g)
      svg('rect', { x: -400, y: 1232, width: 1900, height: 18, fill: '#6a6e78' }, g)
      const shoe = svg('g', { opacity: 0, transform: 'translate(600 1330) rotate(-12)' }, g)
      svg('path', { d: 'M -50 0 Q -50 -34 -10 -34 L 20 -34 Q 50 -10 60 0 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, shoe)
      svg('rect', { x: -54, y: -2, width: 118, height: 12, rx: 6, fill: '#ffffff' }, shoe)
      const van = svg('g', {}, g)
      svg('ellipse', { cx: 540, cy: 1250, rx: 520, ry: 30, fill: '#000', opacity: 0.5 }, van)
      svg('path', { d: 'M 70 1200 L 70 760 Q 70 716 114 716 L 760 716 Q 860 716 900 796 L 990 960 Q 1010 1000 1010 1040 L 1010 1200 Z', fill: '#e8ecf0', stroke: '#9aa4b0', 'stroke-width': 6 }, van)
      svg('path', { d: 'M 770 752 L 866 752 L 952 950 L 770 950 Z', fill: '#121a28' }, van)
      svg('rect', { x: 110, y: 760, width: 210, height: 150, rx: 12, fill: '#121a28' }, van)
      svg('rect', { x: 360, y: 752, width: 300, height: 448, fill: '#020306' }, van)
      const kid = fig(van, { x: 0, y: 0, s: 0.5, fill: '#ffd166', head: '#7a4a2a', armL: 120, armR: 150 })
      const door = svg('g', {}, van)
      svg('rect', { x: 360, y: 752, width: 300, height: 448, fill: '#dfe4ea', stroke: '#9aa4b0', 'stroke-width': 6 }, door)
      svg('rect', { x: 380, y: 770, width: 260, height: 140, rx: 10, fill: '#121a28' }, door)
      svg('rect', { x: 400, y: 960, width: 70, height: 18, rx: 8, fill: '#7a828c' }, door)
      svg('rect', { x: 70, y: 1010, width: 940, height: 22, fill: '#c8322a' }, van)
      for (const x of [240, 840]) {
        svg('circle', { cx: x, cy: 1200, r: 84, fill: '#0c0d10' }, van)
        svg('circle', { cx: x, cy: 1200, r: 38, fill: '#8a8e96' }, van)
      }
      svg('ellipse', { cx: 1020, cy: 1090, rx: 160, ry: 90, fill: 'url(#headl)' }, van)
      const streaks = svg('g', { opacity: 0 }, g)
      for (let i = 0; i < 12; i++) svg('rect', { x: -200, y: 760 + i * 44, width: 1500, height: 4 + (i % 3) * 3, fill: '#ffffff', opacity: 0.3 }, streaks)
      const chrono = svg('g', { transform: 'translate(540 330)' }, g)
      svg('rect', { x: -190, y: -62, width: 380, height: 124, rx: 62, fill: '#000', opacity: 0.75, stroke: '#ff2a3d', 'stroke-width': 6 }, chrono)
      const num = txt(chrono, '', { y: 30, 'font-size': 84, fill: '#ffffff' })
      const clac = burst(g, 'CLAC !', { fill: '#ffffff', ink: '#10121a', size: 110, r: 230 })
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      return { bk, van, kid, door, shoe, streaks, num, clac }
    },
    draw(s, t, l) {
      const close = ease.in3(clamp((l - 1.45) / 0.35))
      s.door.setAttribute('transform', `translate(${lerp(-300, 0, close).toFixed(1)} 0)`)
      const p = clamp(l / 1.1)
      s.kid.setAttribute('transform', `translate(${lerp(590, 480, ease.in2(p)).toFixed(1)} 1205) scale(${(0.5 * (1 - 0.25 * p)).toFixed(3)})`)
      s.kid.setAttribute('opacity', (1 - ease.in2(clamp((l - 0.6) / 0.6))).toFixed(2))
      s.shoe.setAttribute('opacity', l > 1.0 ? 1 : 0)
      const v = Math.min(1.8, l)
      s.num.textContent = `${v.toFixed(1).replace('.', ',')} s`
      s.num.setAttribute('fill', v >= 1.8 ? '#ff2a3d' : '#ffffff')
      burstAt(s.clac, l, 1.8, 2.25, 520, 640, -8, 0.8)
      const d = ease.in2(clamp((l - 2.25) / 0.8))
      s.van.setAttribute('transform', `translate(${(d * 1500).toFixed(0)} 0)`)
      s.streaks.setAttribute('opacity', (Math.min(1, d * 3) * (1 - d * 0.5)).toFixed(2))
    },
  },
  // « …proportionnée » : la balance dorée penche du côté de la riposte.
  SCALE: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#studio)' }, g)
      svg('ellipse', { cx: 540, cy: 760, rx: 520, ry: 760, fill: 'url(#spot)' }, g)
      const bk = bokeh(g, 10, ['#ffe08a'], 61, { op: 0.25, r0: 10, r1: 40, vy: 12 })
      txt(g, 'PROPORTIONNÉE ?', { x: 540, y: 380, 'font-size': 100, fill: 'url(#gold)', stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
      svg('rect', { x: 524, y: 770, width: 32, height: 480, fill: 'url(#gold)' }, g)
      svg('ellipse', { cx: 540, cy: 1260, rx: 200, ry: 40, fill: 'url(#gold)' }, g)
      const beam = svg('g', {}, g)
      svg('rect', { x: -380, y: -14, width: 760, height: 28, rx: 14, fill: 'url(#gold)', filter: 'url(#glow)' }, beam)
      svg('circle', { r: 34, fill: 'url(#gold)' }, beam)
      const pan = (title, content) => {
        const p = svg('g', {}, g)
        svg('path', { d: 'M 0 0 L -130 230 M 0 0 L 130 230', stroke: '#e8b23a', 'stroke-width': 6 }, p)
        svg('path', { d: 'M -160 230 Q 0 320 160 230 Z', fill: 'url(#gold)' }, p)
        content(p)
        txt(p, title, { y: 380, 'font-size': 40, fill: '#ffffff', 'letter-spacing': 3 })
        return p
      }
      const left = pan('LA MENACE', (p) => svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c', stroke: '#5a5e68', 'stroke-width': 8, transform: 'translate(0 236) scale(0.34)' }, p))
      const right = pan('LA RIPOSTE', (p) => {
        const f = fistShape(p, '#a8714e')
        f.firstChild.remove()
        f.setAttribute('transform', 'translate(0 160) scale(0.9)')
      })
      return { bk, beam, left, right }
    },
    draw(s, t, l) {
      s.bk.draw(t)
      const a = 16 * ease.back(2.2)(clamp(l / 0.6))
      const r = (a * Math.PI) / 180
      s.beam.setAttribute('transform', `translate(540 770) rotate(${a.toFixed(2)})`)
      place(s.left, 540 - 360 * Math.cos(r), 770 - 360 * Math.sin(r), 1, 0)
      place(s.right, 540 + 360 * Math.cos(r), 770 + 360 * Math.sin(r), 1, 0)
    },
  },
  // « Il avait une cagoule à neuf euros » : la cagoule en plan produit, son étiquette de prix.
  BAG: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#studio)' }, g)
      svg('rect', { x: 140, y: -40, width: 800, height: 380, rx: 40, fill: 'url(#softbox)', opacity: 0.7 }, g)
      svg('ellipse', { cx: 540, cy: 860, rx: 460, ry: 640, fill: 'url(#spot)' }, g)
      svg('rect', { x: -400, y: 1190, width: 1900, height: 900, fill: '#08090c' }, g)
      svg('ellipse', { cx: 540, cy: 1196, rx: 420, ry: 36, fill: '#ffffff', opacity: 0.07 }, g)
      const none = svg('g', {}, g)
      svg('circle', { r: 250, fill: 'none', stroke: '#ff2a3d', 'stroke-width': 28, filter: 'url(#glow)' }, none)
      svg('path', { d: 'M -150 -40 L 130 -40 L 130 6 L -30 6 L -54 96 L -118 96 L -96 6 L -150 6 Z', fill: '#e8ecf0', transform: 'scale(1.25)' }, none)
      svg('path', { d: 'M -176 176 L 176 -176', stroke: '#ff2a3d', 'stroke-width': 28, 'stroke-linecap': 'round' }, none)
      txt(none, 'AUCUNE ARME', { y: 360, 'font-size': 76, fill: '#ffffff' })
      const prod = svg('g', {}, g)
      const inner = svg('g', { id: 'bagProd' }, prod)
      svg('rect', { x: 510, y: 1030, width: 60, height: 160, fill: '#5a5e68' }, inner)
      svg('ellipse', { cx: 540, cy: 1190, rx: 150, ry: 18, fill: '#3a3e48' }, inner)
      svg('ellipse', { cx: 540, cy: 870, rx: 150, ry: 180, fill: '#8a8e98' }, inner)
      svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c', stroke: '#2a2d36', 'stroke-width': 6, transform: 'translate(540 1010) scale(0.95)' }, inner)
      svg('path', { d: 'M 430 760 Q 470 700 540 690', fill: 'none', stroke: '#ffffff', 'stroke-width': 10, opacity: 0.18, 'stroke-linecap': 'round' }, inner)
      svg('use', { href: '#bagProd', transform: 'translate(0 2392) scale(1 -1)', opacity: 0.12 }, prod)
      const tag2 = svg('g', {}, g)
      svg('path', { d: 'M 0 0 L 0 120', stroke: '#e8dcc8', 'stroke-width': 4 }, tag2)
      const tb = svg('g', { transform: 'translate(0 120)' }, tag2)
      svg('path', { d: 'M -80 0 L 80 0 L 80 150 L -80 150 L -80 0 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 6 }, tb)
      svg('circle', { cy: 22, r: 10, fill: '#10121a' }, tb)
      txt(tb, '9 €', { y: 118, 'font-size': 76, fill: '#10121a' })
      return { none, prod, tag2 }
    },
    draw(s, t, l) {
      const tc = Wd('06', 'cagoule') - 0.3
      const vn = popS(t, t - l, tc, 0.3)
      show(s.none, vn > 0.01)
      place(s.none, 540, 800, Math.max(0.001, vn), 0)
      const d = ease.out3(clamp((t - tc) / 0.4))
      show(s.prod, t > tc)
      s.prod.setAttribute('transform', `translate(540 ${(-900 * (1 - d)).toFixed(0)}) scale(${(0.92 + 0.08 * Math.cos((t - tc) * 1.4)).toFixed(3)} 1) translate(-540 0)`)
      const tp = Wd('06', 'neuf') - 0.25
      show(s.tag2, t > tp)
      const sw = t - tp
      s.tag2.setAttribute('transform', `translate(700 640) rotate(${(28 * Math.exp(-sw * 3) * Math.sin(sw * 9) - 8).toFixed(1)}) scale(${Math.min(1, ease.back(2)(clamp(sw / 0.25))).toFixed(3)})`)
    },
  },
  // « Il voit un homme masqué » : la vue de Rachid, rouge, le cœur qui cogne, l'image qui double.
  MASKED: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#redRoom)' }, g)
      const ry = rays(g, 18, '#ff2a3d', 0.08)
      const gR = svg('use', { href: '#maskFig', filter: 'url(#tintR)', opacity: 0.55, style: 'mix-blend-mode:screen' }, g)
      const gC = svg('use', { href: '#maskFig', filter: 'url(#tintC)', opacity: 0.45, style: 'mix-blend-mode:screen' }, g)
      const fg = svg('g', { id: 'maskFig' }, g)
      const p = makePerson(fg, YT)
      svg('path', { d: BALA, 'fill-rule': 'evenodd', fill: '#14161c' }, p.head)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigRed)' }, g)
      return { ry, gR, gC, p }
    },
    draw(s, t, l) {
      s.ry.setAttribute('transform', `translate(540 760) rotate(${(t * 12).toFixed(1)})`)
      const beat = Math.max(0, Math.sin(t * 8.5)) ** 6
      s.p.update(t, { x: 540, y: 1480, scale: 2.0 + 0.18 * l + 0.05 * beat, brows: 'angry', look: [0, 0.35], armR: [0.9, 0.6], armL: [0.9, 0.6], headTilt: -0.05, seed: 2 })
      const o = 8 + 20 * beat
      s.gR.setAttribute('transform', `translate(${-o} 0)`)
      s.gC.setAttribute('transform', `translate(${o} 0)`)
    },
  },
  // « …un gamin qui hurle » : Timéo, en très gros plan.
  KIDCRY: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ff8a1a' }, g)
      const sl = speedLines(g, 54, '#ffd166')
      sl.setAttribute('opacity', 1)
      const kid = makePerson(g, KID)
      const help = burst(g, 'AU SECOURS !', { fill: '#ffffff', ink: '#e5484d', size: 104, r: 260 })
      return { sl, kid, help }
    },
    draw(s, t, l) {
      s.sl.setAttribute('transform', `translate(540 800) rotate(${(t * 40).toFixed(1)})`)
      s.kid.update(t, { x: 540 + 10 * Math.sin(t * 40), y: 1480, scale: 1.9, mouth: 0.9 + 0.1 * Math.sin(t * 30), brows: 'surprised', look: [0, -0.2], armR: [2.6, 0.4], armL: [2.6, 0.4], tearT: l + 1, seed: 3 })
      burstAt(s.help, l, 0.04, 9, 540, 420, -6, 0.9)
    },
  },
  // « …et personne d'autre ne bouge dans ce parc » : le parc figé, gris, les téléphones levés.
  FROZEN: {
    build(g) {
      const world = svg('g', {}, g)
      const far = svg('g', { filter: 'url(#desat)' }, world)
      park(kit, far)
      svg('rect', { x: 360, y: 1180, width: 360, height: 30, rx: 10, fill: '#8a5a30' }, far)
      fig(far, { x: 500, y: 1150, s: 0.42, fill: '#0a0b0e', armR: 80 })
      fig(far, { x: 565, y: 1150, s: 0.26, fill: '#d0a020', armL: 160, armR: 160 })
      const crowd = svg('g', {}, world)
      const P = [[880, 1230, 0.5, false], [430, 1270, 0.62, true], [650, 1260, 0.6, false], [300, 1340, 0.78, false], [770, 1350, 0.82, true], [120, 1520, 1.08, true], [960, 1540, 1.12, true]]
      const screens = P.map(([x, y, sc, ph]) => fig(crowd, { x, y, s: sc, fill: '#3a4048', head: '#454c55', armR: ph ? 150 : 8, phone: ph }).screen).filter(Boolean)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#20344a', opacity: 0.35, style: 'mix-blend-mode:multiply' }, g)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      const pause = svg('g', { transform: 'translate(950 250)' }, g)
      for (const x of [-30, 14]) svg('rect', { x, y: -40, width: 22, height: 80, rx: 6, fill: '#ffffff', opacity: 0.85 }, pause)
      const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
      return { world, screens, fl }
    },
    draw(s, t, l) {
      s.world.setAttribute('transform', `translate(540 1150) scale(${(1 + 0.05 * l).toFixed(4)}) translate(-540 -1150)`)
      s.screens.forEach((sc, i) => sc.setAttribute('opacity', (0.85 + 0.15 * Math.sin(t * 20 + i * 2)).toFixed(2)))
      s.fl.setAttribute('opacity', (0.5 * Math.exp(-l * 10)).toFixed(3))
    },
  },
  // « …c'est sa tête sur le trottoir » : la radio, le crâne, l'impact.
  XRAY: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#xrayBg)' }, g)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#gridC)' }, g)
      const curb = svg('g', { opacity: 0.85 }, g)
      svg('path', { d: 'M 40 880 L 300 880 L 300 1300 L 40 1300 Z', fill: '#1a2a3a', stroke: '#8fe8ff', 'stroke-width': 4 }, curb)
      svg('path', { d: 'M 40 880 L 300 880 L 350 840 L 90 840 Z', fill: '#2a4058', stroke: '#8fe8ff', 'stroke-width': 4 }, curb)
      svg('path', { d: 'M 300 880 L 350 840 L 350 1260 L 300 1300 Z', fill: '#12202e', stroke: '#8fe8ff', 'stroke-width': 4 }, curb)
      txt(curb, 'TROTTOIR', { x: 170, y: 1120, 'font-size': 34, fill: '#8fe8ff', 'letter-spacing': 3 })
      const sk = svg('g', { filter: 'url(#glow)' }, g)
      const st = { fill: '#8fe8ff', 'fill-opacity': 0.08, stroke: '#8fe8ff', 'stroke-width': 7 }
      svg('path', { d: 'M 320 820 C 300 600 440 470 620 480 C 780 490 880 600 870 740 C 866 800 850 830 840 860 L 880 930 C 890 950 870 960 850 960 L 840 1000 C 840 1040 810 1050 780 1050 L 720 1050 L 710 1110 L 580 1110 C 540 1110 520 1080 510 1040 C 440 1010 350 960 320 820 Z', ...st }, sk)
      svg('ellipse', { cx: 760, cy: 760, rx: 52, ry: 46, ...st }, sk)
      svg('path', { d: 'M 850 870 L 816 832 L 808 910 Z', ...st }, sk)
      svg('path', { d: 'M 730 1050 L 730 1010 M 760 1050 L 760 1010 M 790 1045 L 790 1008', stroke: '#8fe8ff', 'stroke-width': 5 }, sk)
      for (let i = 0; i < 4; i++) svg('rect', { x: 560, y: 1130 + i * 70, width: 110, height: 50, rx: 14, ...st }, sk)
      svg('ellipse', { cx: 320, cy: 820, rx: 170, ry: 170, fill: 'url(#glowRed)' }, g)
      const cr = cracks(g, 330, 810, 0.6, 4, '#ff6a78')
      const scan = svg('g', {}, g)
      svg('rect', { x: -100, y: -60, width: 1300, height: 120, fill: 'url(#softbox)', opacity: 0.12 }, scan)
      svg('rect', { x: -100, y: -5, width: 1300, height: 10, fill: '#8fe8ff', opacity: 0.8, filter: 'url(#glow)' }, scan)
      txt(g, 'TRAUMATISME CRÂNIEN', { x: 540, y: 330, 'font-size': 70, fill: '#8fe8ff', filter: 'url(#glow)' })
      txt(g, 'CHOC CONTRE LE TROTTOIR', { x: 540, y: 410, 'font-size': 40, fill: '#ff7a88', 'letter-spacing': 4 })
      return { cr, scan, sk }
    },
    draw(s, t, l) {
      const c = ease.out3(clamp((l - 0.5) / 0.7))
      for (const p of s.cr.children) p.setAttribute('stroke-dashoffset', (900 * (1 - c)).toFixed(0))
      s.scan.setAttribute('transform', `translate(0 ${(450 + ((l * 520) % 800)).toFixed(0)})`)
      s.sk.setAttribute('opacity', (0.85 + 0.15 * Math.sin(t * 13)).toFixed(2))
    },
  },
  // « …Rachid lui tournait le dos » : vu du ciel, Kevin au sol, Rachid qui marche vers l'enfant.
  BACK: {
    build(g) {
      const world = svg('g', {}, g)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#3f7a34' }, world)
      const r = rng(21)
      for (let i = 0; i < 160; i++) svg('ellipse', { cx: (r() * 1400 - 160).toFixed(0), cy: (r() * 2200 - 140).toFixed(0), rx: 8 + r() * 30, ry: 4 + r() * 12, fill: r() < 0.5 ? '#356a2c' : '#4a8a3c', opacity: 0.8 }, world)
      svg('path', { d: 'M -300 1560 L 1400 220 L 1400 560 L -300 1900 Z', fill: '#cdb894' }, world)
      svg('path', { d: 'M -300 1560 L 1400 220 M 1400 560 L -300 1900', stroke: '#a89470', 'stroke-width': 10 }, world)
      for (const [x, y, rr] of [[120, 300, 170], [980, 1500, 190], [-40, 1100, 150]]) {
        svg('circle', { cx: x + 30, cy: y + 30, r: rr, fill: '#000', opacity: 0.25 }, world)
        svg('circle', { cx: x, cy: y, r: rr, fill: '#2f6a2a' }, world)
        svg('circle', { cx: x - rr * 0.3, cy: y - rr * 0.3, r: rr * 0.5, fill: '#3f8a36' }, world)
      }
      const top = (x, y, rot, body, headC, sc = 1) => {
        const p = svg('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${sc})` }, world)
        svg('ellipse', { cx: 8, cy: 10, rx: 82, ry: 50, fill: '#000', opacity: 0.25 }, p)
        p.armL = svg('rect', { x: -96, y: -14, width: 30, height: 90, rx: 14, fill: body }, p)
        p.armR = svg('rect', { x: 66, y: -14, width: 30, height: 90, rx: 14, fill: body }, p)
        svg('ellipse', { rx: 78, ry: 44, fill: body }, p)
        svg('circle', { r: 36, fill: headC }, p)
        return p
      }
      const kev = svg('g', { transform: 'translate(300 1130) rotate(-30)' }, world)
      for (const [x1, y1, x2, y2] of [[-30, 60, -50, 200], [30, 60, 50, 200], [-60, -40, -150, -20], [60, -40, 150, 10]]) svg('path', { d: `M ${x1} ${y1} L ${x2} ${y2}`, stroke: x1 < 0 && y1 > 0 ? '#2a2d36' : x1 > 0 && y1 > 0 ? '#2a2d36' : '#fe2c55', 'stroke-width': 34, 'stroke-linecap': 'round' }, kev)
      svg('ellipse', { rx: 70, ry: 100, fill: '#fe2c55' }, kev)
      svg('circle', { cy: -130, r: 44, fill: '#14161c' }, kev)
      const kid = top(800, 600, 200, '#ffd166', '#7a4a2a', 0.6)
      const steps = Array.from({ length: 12 }, (_, i) => svg('ellipse', { rx: 12, ry: 20, fill: '#2a2014', opacity: 0, transform: `translate(${lerp(380, 720, i / 12) + (i % 2 ? 14 : -14)} ${lerp(1040, 720, i / 12)}) rotate(48)` }, world))
      const rach = top(0, 0, 0, '#2a3a5a', '#1a120c')
      const lk = label(world, 'KEVIN', { size: 40, fill: '#fe2c55', ink: '#ffffff' })
      place(lk, 300, 960, 1, 0)
      const lr = label(world, 'RACHID', { size: 40, fill: '#ffffff', ink: '#2a3a5a' })
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      const hud = svg('g', { stroke: '#ffffff', 'stroke-width': 8, fill: 'none', opacity: 0.8 }, g)
      for (const [x, y, sx, sy] of [[60, 200, 1, 1], [1020, 200, -1, 1], [60, 1860, 1, -1], [1020, 1860, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 70} L ${x} ${y} L ${x + sx * 70} ${y}` }, hud)
      return { world, rach, steps, lr }
    },
    draw(s, t, l) {
      const p = ease.io2(clamp(l / 2.4))
      const x = lerp(400, 720, p)
      const y = lerp(1020, 720, p)
      s.rach.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(48)`)
      const sw = 24 * Math.sin(t * 9)
      s.rach.armL.setAttribute('transform', `translate(0 ${sw.toFixed(1)})`)
      s.rach.armR.setAttribute('transform', `translate(0 ${(-sw).toFixed(1)})`)
      s.steps.forEach((st, i) => st.setAttribute('opacity', i / 12 < p - 0.06 ? 0.55 : 0))
      place(s.lr, x, y - 120, 1, 0)
      s.world.setAttribute('transform', `translate(540 960) rotate(${(-2 + 2.5 * l).toFixed(2)}) scale(${(1.04 + 0.02 * l).toFixed(3)}) translate(-540 -960)`)
    },
  },
  // « …parce qu'il consolait Timéo » : à contre-jour, le soleil bas ; puis les gyrophares.
  HUG: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#goldSky)' }, g)
      const sun = svg('g', {}, g)
      svg('ellipse', { cx: 0, cy: 0, rx: 700, ry: 700, fill: 'url(#sunCore)' }, sun)
      const ry = rays(sun, 30, '#fff0c0', 0.06)
      for (const [x, r0] of [[-60, 160], [180, 220], [430, 180], [700, 240], [960, 190], [1160, 220]]) svg('circle', { cx: x, cy: 1290, r: r0, fill: '#3a1a30', opacity: 0.85 }, g)
      const big = bokeh(g, 10, ['#ffd38a', '#ff9a50'], 71, { op: 0.3, r0: 50, r1: 130, blur: 'blur30', vy: 6 })
      svg('use', { href: '#hugPair', filter: 'url(#rimGold)' }, g)
      const pair = svg('g', { id: 'hugPair', filter: 'url(#backlit)' }, g)
      const r = makePerson(pair, PASSANT)
      const kid = makePerson(pair, KID)
      svg('path', { d: 'M -200 1330 Q 540 1250 1300 1320 L 1300 2100 L -200 2100 Z', fill: '#1a0c16' }, g)
      const rr = rng(3)
      for (let i = 0; i < 60; i++) {
        const x = -40 + i * 20
        svg('path', { d: `M ${x} ${1300 + 10 * Math.sin(i)} l ${(6 + rr() * 8).toFixed(0)} ${(-30 - rr() * 40).toFixed(0)} l ${(6 + rr() * 6).toFixed(0)} ${(32 + rr() * 30).toFixed(0)}`, fill: '#1a0c16' }, g)
      }
      const dust = bokeh(g, 40, ['#fff0c0', '#ffd38a'], 72, { op: 0.8, r0: 3, r1: 9, blur: 'blur6', vy: 18, y0: 300, y1: 1400 })
      const flares = [0.35, 0.6, 0.85, 1.15].map((k2, i) => ({ el: svg('circle', { r: [60, 110, 40, 160][i], fill: 'url(#flare)' }, g), k: k2 }))
      const amb = svg('g', { opacity: 0, style: 'mix-blend-mode:screen' }, g)
      const aR = svg('ellipse', { cx: 1000, cy: 900, rx: 1000, ry: 1200, fill: 'url(#ambR)' }, amb)
      const aB = svg('ellipse', { cx: 1000, cy: 900, rx: 1000, ry: 1200, fill: 'url(#ambB)' }, amb)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)', opacity: 0.55 }, g)
      return { sun, ry, big, r, kid, dust, flares, amb, aR, aB }
    },
    draw(s, t, l) {
      const sx = 600 - 20 * l
      const sy = 700 + 12 * l
      s.sun.setAttribute('transform', `translate(${sx.toFixed(1)} ${sy.toFixed(1)})`)
      s.ry.setAttribute('transform', `rotate(${(t * 4).toFixed(1)})`)
      s.big.draw(t)
      s.dust.draw(t)
      s.r.update(t, { x: 430, y: 1020, scale: 1.05, mouth: 0.1, brows: 'sad', look: [0.5, 0.4], armR: HUG_ARM, armL: [0.5, 0.7], headTilt: 0.3, lean: 0.06, seed: 4 })
      s.kid.update(t, { x: 690, y: 1110, scale: 0.64, mouth: 0.35 + 0.15 * Math.sin(t * 9), brows: 'sad', look: [-0.5, 0.3], armR: [0.6, 0.8], armL: [1.4, 1.3], tearT: 1 + l, headTilt: -0.2, seed: 3 })
      for (const f of s.flares) place(f.el, sx + (900 - sx) * f.k, sy + (1650 - sy) * f.k, 1, 0)
      const a0 = Wd('10', 'secours') - 0.35
      const av = ease.io2(clamp((t - a0) / 0.5))
      s.amb.setAttribute('opacity', av.toFixed(2))
      const ph = Math.floor((t - a0) * 5) % 2
      s.aR.setAttribute('opacity', ph ? 1 : 0.15)
      s.aB.setAttribute('opacity', ph ? 0.15 : 1)
    },
  },
  // « …dans le doute, frappez d'abord » : des poings qui se lèvent, partout.
  FISTS: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#a00c1c' }, g)
      svg('ellipse', { cx: 540, cy: 700, rx: 900, ry: 900, fill: 'url(#glowRed)' }, g)
      const ry = rays(g, 16, '#ff5060', 0.18)
      const P = [[540, 760, 0, 1.25], [250, 900, 0.18, 1.05], [830, 880, 0.3, 1.1], [90, 1050, 0.45, 0.95], [990, 1030, 0.55, 0.95], [400, 1080, 0.7, 0.85], [690, 1100, 0.8, 0.9], [170, 1250, 0.95, 0.8], [900, 1240, 1.05, 0.8], [540, 1300, 1.15, 0.75]]
      const fists = P.map(([x, y, d, sc]) => ({ el: fistShape(g, '#0a0a0c'), x, y, d, sc }))
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      return { ry, fists }
    },
    draw(s, t, l) {
      s.ry.setAttribute('transform', `translate(540 600) rotate(${(t * 20).toFixed(1)})`)
      for (const f of s.fists) {
        const u = ease.back(1.6)(clamp((l - f.d) / 0.25))
        f.el.setAttribute('transform', `translate(${f.x} ${lerp(2200, f.y, u).toFixed(1)}) rotate(${(4 * Math.sin(t * 6 + f.x)).toFixed(1)}) scale(${f.sc})`)
      }
    },
  },
  // « …dans le doute… filmez » : une mer de téléphones qui filment, dans le bleu froid.
  PHONES: {
    build(g) {
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#blueNight)' }, g)
      const bk = bokeh(g, 20, ['#9fd0ff', '#3d7bff', '#ffffff'], 81, { op: 0.3, r0: 20, r1: 80, blur: 'blur30', vy: 6 })
      const r = rng(17)
      const P = Array.from({ length: 16 }, (_, i) => [60 + ((i * 263) % 960), 380 + ((i * 397) % 900), (i * 0.11) % 1.5, 0.6 + r() * 0.5])
      const phones = P.map(([x, y, d, sc]) => {
        const p = svg('g', {}, g)
        svg('ellipse', { cx: 0, cy: 0, rx: 170, ry: 200, fill: 'url(#scrGlow)' }, p)
        svg('rect', { x: -26, y: 60, width: 52, height: 1400, fill: '#05070c' }, p)
        svg('rect', { x: -52, y: -90, width: 104, height: 180, rx: 16, fill: '#05070c', stroke: '#2a3448', 'stroke-width': 4 }, p)
        svg('rect', { x: -44, y: -80, width: 88, height: 160, rx: 10, fill: '#cfe6ff' }, p)
        const dot = svg('circle', { cx: -26, cy: -60, r: 8, fill: '#ff2a3d' }, p)
        return { p, x, y, d, sc, dot }
      })
      for (let i = 0; i < 9; i++) {
        svg('circle', { cx: -40 + i * 145, cy: 1640 + (i % 2) * 40, r: 70, fill: '#03050a' }, g)
        svg('rect', { x: -120 + i * 145, y: 1700 + (i % 2) * 40, width: 160, height: 400, rx: 70, fill: '#03050a' }, g)
      }
      const hero = svg('g', {}, g)
      svg('ellipse', { cx: 0, cy: 0, rx: 520, ry: 620, fill: 'url(#scrGlow)', opacity: 0.7 }, hero)
      svg('rect', { x: -230, y: -360, width: 460, height: 720, rx: 54, fill: '#05070c', stroke: '#4a5468', 'stroke-width': 6 }, hero)
      const cp = svg('clipPath', { id: 'heroScr' }, defs)
      svg('rect', { x: -206, y: -336, width: 412, height: 672, rx: 34 }, cp)
      const scr = svg('g', { 'clip-path': 'url(#heroScr)' }, hero)
      svg('rect', { x: -220, y: -350, width: 440, height: 700, fill: 'url(#goldSky)' }, scr)
      svg('circle', { cx: 0, cy: 60, r: 200, fill: 'url(#sunCore)' }, scr)
      fig(scr, { x: -40, y: 240, s: 0.55, fill: '#1a0c16', armR: 80 })
      fig(scr, { x: 60, y: 250, s: 0.36, fill: '#1a0c16' })
      svg('rect', { x: -220, y: 240, width: 440, height: 120, fill: '#1a0c16' }, scr)
      const rec = svg('circle', { cx: -160, cy: -290, r: 14, fill: '#ff2a3d' }, hero)
      const time = txt(hero, '', { x: -136, y: -278, 'font-size': 34, fill: '#ffffff', 'text-anchor': 'start' })
      const hand = svg('g', {}, hero)
      svg('rect', { x: -60, y: 300, width: 120, height: 900, fill: '#c89070' }, hand)
      svg('ellipse', { cx: -200, cy: 220, rx: 60, ry: 120, fill: '#d8a080' }, hand)
      svg('ellipse', { cx: 210, cy: 180, rx: 50, ry: 100, fill: '#d8a080' }, hand)
      svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: 'url(#vigCut)' }, g)
      return { bk, phones, hero, rec, time }
    },
    draw(s, t, l) {
      s.bk.draw(t)
      for (const p of s.phones) {
        const u = ease.back(1.6)(clamp((l - 0.2 - p.d) / 0.25))
        show(p.p, u > 0.01)
        p.p.setAttribute('transform', `translate(${p.x} ${(lerp(2100, p.y, u) + 10 * Math.sin(t * 2 + p.x)).toFixed(1)}) scale(${p.sc})`)
        p.dot.setAttribute('opacity', Math.floor(t * 2 + p.x) % 2 ? 1 : 0.2)
      }
      const h = ease.out3(clamp(l / 0.4))
      s.hero.setAttribute('transform', `translate(540 ${lerp(2000, 830, h).toFixed(1)}) rotate(${(-3 + 2 * Math.sin(t * 1.5)).toFixed(2)})`)
      s.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.25)
      s.time.textContent = `REC 00:${String(12 + Math.floor(l)).padStart(2, '0')}`
    },
  },
}
const CUTS = Object.entries(C.cuts).map(([id, span], i) => {
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
  const rachid = makePerson(L.actor, PASSANT)
  const kev = makePerson(L.actor, KEV)
  bandage(kev)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  txt(L.front, 'RACHID', { x: 270, y: 1820, 'font-size': 64, fill: '#ffffff', 'letter-spacing': 4 })
  txt(L.front, 'KEVIN', { x: 810, y: 1820, 'font-size': 64, fill: '#ffffff', 'letter-spacing': 4 })
  return { bk, rachid, kev }
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
fs(tag('IL A CRU SAUVER UN ENFANT', 'pill yellow', { t0: 0, t1: K.LIVE0 - 0.1, y: 300, rot: -2 }), 60)
fs(tag('UN YOUTUBEUR DANS LE COMA', 'pill red', { t0: K.INTRO_YT, t1: K.LIVE0 - 0.1, y: 420, rot: 2 }), 60)
fs(tag('HÉROS OU COUPABLE ?', 'slam white', { t0: Wd('00', 'coma') + 0.1, t1: K.LIVE0 - 0.1, y: 590, rot: -3, from: 2.4, dur: 0.18 }), 92)
fs(tag('LE LIVE · 2 MINUTES AVANT', 'pill', { t0: K.LIVE0 + 0.05, t1: K.LIVE0 + 1.6, y: 420, rot: -2 }), 46)
// Le hook (replay).
fs(tag('FAUX ENLÈVEMENT', 'slam white', { t0: K.FAUX, t1: K.TIMEO - 0.06, y: 580, rot: -3, from: 2.4, dur: 0.18 }), 76)
fs(tag('TIMÉO · 8 ANS', 'pill yellow', { t0: K.TIMEO, t1: K.RACHID - 0.06, y: 300, rot: -2 }), 60)
fs(tag('PAYÉ POUR JOUER LE RÔLE', 'pill', { t0: Wd('02', 'paye') - 0.12, t1: K.RACHID - 0.06, y: 1660, rot: 2 }), 50)
fs(tag('RACHID · PÈRE DE 2 ENFANTS', 'pill', { t0: K.RACHID, t1: K.COUP - 0.06, y: 300, rot: 2 }), 52)
fs(tag('PAS AU COURANT', 'pill red', { t0: Wd('03', 'pas') - 0.12, t1: K.COUP - 0.06, y: 1660, rot: -2 }), 56)
fs(tag('UN SEUL COUP.', 'slam white', { t0: K.COUP, t1: K.COMA - 0.06, y: 400, rot: -3, from: 2.4, dur: 0.18 }), 110)
fs(tag('3 SEMAINES DE COMA', 'slam yellow', { t0: K.COMA, t1: K.TODAY - 0.06, y: 1660, rot: -3, from: 2.6, dur: 0.18 }), 88)
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.25, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès (les plans de coupe portent l'essentiel ; les étiquettes restent en haut).
fs(tag('1,8 SECONDE', 'slam white', { t0: S('04') + 0.1, t1: C.cuts.CHRONO[0] - 0.05, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 120)
fs(tag('PAS UNE QUESTION.', 'pill red', { t0: Wd('04', 'question') - 0.15, t1: C.cuts.FILM[1] - 0.1, y: 300, rot: -2 }), 56)
fs(tag('PAS UN GESTE.', 'pill red', { t0: Wd('04', 'geste') - 0.15, t1: C.cuts.FILM[1] - 0.1, y: 410, rot: 2 }), 56)
fs(tag('« POUR FAIRE MAL. »', 'slam yellow', { t0: Wd('04', 'pour', 1) - 0.12, t1: E('04') + 0.15, y: 340, rot: -4, from: 2.8, dur: 0.15 }), 86)
fs(tag('« 1,8 SECONDE… »', 'slam white', { t0: S('05') - 0.05, t1: C.cuts.VAN[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 100)
fs(tag('HEUREUSEMENT.', 'slam yellow', { t0: Wd('05', 'heureusement') - 0.1, t1: E('05') + 0.15, y: 360, rot: -4, from: 2.8, dur: 0.15 }), 130)
fs(tag('LÉGITIME DÉFENSE D’AUTRUI', 'pill yellow', { t0: Wd('06', 'legitime') - 0.12, t1: C.cuts.SCALE[0] - 0.05, y: 300, rot: -2 }), 50)
fs(tag('« COMMENT POUVAIT-IL SAVOIR ? »', 'slam white', { t0: S('07') - 0.05, t1: C.cuts.MASKED[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 64)
fs(tag('RÉFLEXE DE PÈRE<br>OU COUP DE TROP ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 84)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
fs(tag('LE MÉDECIN EST FORMEL', 'pill', { t0: S('09') - 0.05, t1: C.cuts.XRAY[0] - 0.05, y: 300, rot: -2 }), 56)
fs(tag('« IL LUI TOURNAIT LE DOS… »', 'slam white', { t0: S('10') - 0.05, t1: C.cuts.HUG[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 68)
fs(tag('« LA VICTIME, C’ÉTAIT L’ENFANT. »', 'pill yellow', { t0: Wd('10', 'pour') - 0.1, t1: Wd('10', 'il', 1) - 0.1, y: 300, rot: -2 }), 50)
fs(tag('SI VOUS L’ACQUITTEZ…', 'slam white', { t0: S('11') - 0.05, t1: C.cuts.FISTS[0] - 0.05, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 76)
fs(tag('« FRAPPEZ D’ABORD. »', 'slam yellow', { t0: Wd('11', 'frappez') - 0.12, t1: E('11') + 0.1, y: 360, rot: -4, from: 2.8, dur: 0.15 }), 80)
fs(tag('SI VOUS LE CONDAMNEZ…', 'slam white', { t0: S('12') - 0.05, t1: C.cuts.PHONES[0] - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 70)
fs(tag('« FILMEZ. »', 'slam white', { t0: Wd('12', 'filmez') - 0.12, t1: SEC.tribunal.t1, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 140)
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
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', youtubeur: 'KEVIN · EN DIRECT', passant: 'RACHID' }

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
  [K.INTRO_YT, 12],
  [K.LIVE0, 10],
  [K.GRAB, 10],
  [K.PUNCH, 26],
  [K.GROUND, 14],
  [K.REPLAY, 10],
  [K.FAUX, 8],
  [K.TIMEO, 8],
  [K.RACHID, 8],
  [K.COUP + 0.3, 22],
  [K.COMA, 12],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [C.cuts.CHRONO[0] + 1.45, 12],
  [C.cuts.VAN[0] + 1.8, 16],
  [C.cuts.BAG[0] + (Wd('06', 'cagoule') - 0.3 - C.cuts.BAG[0]) + 0.4, 10],
  [C.cuts.MASKED[0], 10],
  [C.cuts.KIDCRY[0], 12],
  [C.cuts.FROZEN[0], 8],
  [C.cuts.FISTS[0], 12],
  [Wd('11', 'frappez') - 0.12, 12],
  [Wd('05', 'heureusement') - 0.1, 10],
  [C.impact, 10],
  [Wd('12', 'filmez') - 0.12, 14],
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
    VOTE.rachid.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'sad', look: [0.3, 0], armR: [0.4, 0.3], armL: [0.4, 0.3], seed: 3.1 })
    VOTE.kev.update(t, { x: 800, y: 1460, scale: 0.88, brows: 'angry', look: [-0.3, 0.1], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 0.7 })
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
