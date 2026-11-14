/**
 * ============================================================================
 *  « Affaire Classée ? » — La chambre froide (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : caméra de surveillance extérieure,
 *  des militants taguent « ASSASSIN » sur la vitrine d'une boucherie ; caméra
 *  intérieure, ils filment les carcasses dans la chambre froide ; le boucher
 *  sort de l'ombre, les pousse dedans, la porte claque. Cadenas, −18 °C, givre,
 *  coups contre la porte. Le narrateur explique pendant le replay : cinq
 *  attaques en un an, Marc qui les attendait dans le noir, quarante minutes de
 *  froid, l'hypothermie. Puis le marteau.
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
grad('splitL', [[0, '#4a1414'], [1, '#120404']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#1a3a50'], [1, '#04101a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
grad('cctvG', [[0, '#0d1a12'], [1, '#050a07']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('streetN', [[0, '#0a0d18'], [1, '#1a1c26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('shopIn', [[0, '#2a3030'], [1, '#121616']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('fogLight', [[0, '#e8f6ff', 0.95], [0.5, '#bfe4ff', 0.55], [1, '#bfe4ff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('steel', [[0, '#c9d2dc'], [0.5, '#e9eef3'], [1, '#9aa6b4']], { x1: 0, y1: 0, x2: 1, y2: 0 })
grad('frost', [[0.45, '#ffffff', 0], [0.8, '#dff3ff', 0.55], [1, '#ffffff', 0.95]], { cx: 0.5, cy: 0.5, r: 0.72 })
grad('coldRoom', [[0, '#cfe6f5'], [1, '#6f97b8']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('dayShop', [[0, '#9fc4e0'], [1, '#e8eef2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('blockWood', [[0, '#b07a4a'], [1, '#6a4428']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('judgeBg', [[0, '#1a1e30'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('blanket', [[0, '#ffe08a'], [0.5, '#d9a930'], [1, '#fff2b8']], { x1: 0, y1: 0, x2: 1, y2: 1 })
{
  const f = svg('filter', { id: 'cctv', x: '0', y: '0', width: '100%', height: '100%' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0.25 0.45 0.1 0 0  0.3 0.6 0.15 0 0.03  0.2 0.35 0.1 0 0  0 0 0 1 0' }, f)
}

// Les personnages. Les avocats en costume ; Marc, le boucher ; les militants (capuches) ; Inès, l'étudiante.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const MARC = { robe: '#f4f4f0', jabot: false, collar: '#c8322a', hair: 'short', hairColor: '#3a2a1a', beard: true, skin: '#e9b48f', iris: '#3b2a1a' }
const MILIT = [
  { robe: '#1c2420', jabot: false, collar: '#2a3a2a', hair: 'messy', hairColor: '#2a1a10', skin: '#f0c4a0', iris: '#2b1d12' },
  { robe: '#22262e', jabot: false, collar: '#1a1a1a', hair: 'bun', hairColor: '#c98a3a', skin: '#f6d0b0', iris: '#3a5a2a', female: true },
  { robe: '#1a1f2a', jabot: false, collar: '#2a2a2a', hair: 'short', hairColor: '#111111', skin: '#8a5a3a', iris: '#2b1d12' },
]
const INES = MILIT[1]
const person = (parent, o) => makePerson(parent, o)
// Une capuche (posée sur la tête d'un personnage).
function hood(p, color) {
  const g = svg('g', {}, p.head)
  svg('path', { d: 'M -190 -60 C -220 -330 220 -330 190 -60 L 150 -80 C 160 -260 -160 -260 -150 -80 Z', fill: color }, g)
  return g
}
// Une carcasse suspendue (silhouette).
function carcass(parent, x, y, s, c = '#b84a4a') {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('path', { d: 'M 0 -260 L 0 -200', stroke: '#9aa6b4', 'stroke-width': 8 }, g)
  svg('path', { d: 'M -10 -200 Q 0 -215 10 -200', fill: 'none', stroke: '#9aa6b4', 'stroke-width': 8 }, g)
  svg('path', { d: 'M -60 -190 C -110 -100 -100 60 -40 160 C -10 190 10 190 40 160 C 100 60 110 -100 60 -190 Z', fill: c, stroke: '#6a2020', 'stroke-width': 5 }, g)
  svg('path', { d: 'M -30 -150 C -50 -60 -40 40 -10 120', fill: 'none', stroke: '#f2e2d2', 'stroke-width': 14, opacity: 0.7 }, g)
  return g
}
const TAGS = ['ASSASSIN', 'VIANDE = MEURTRE', 'BOUCHER BOURREAU', 'HONTE', 'COMPLICE']

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#020403')
  const R = L.actor
  // A1 · Caméra extérieure : le tag sur la vitrine.
  const A1 = svg('g', { filter: 'url(#cctv)' }, R)
  const A1cam = svg('g', {}, A1)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#streetN)' }, A1cam)
  for (let y = 0; y < 900; y += 60) for (let x = (y / 60) % 2 ? -60 : 0; x < W + 100; x += 120) svg('rect', { x, y, width: 116, height: 56, fill: '#2a2226', stroke: '#1a1416', 'stroke-width': 4 }, A1cam)
  svg('rect', { x: 80, y: 260, width: 920, height: 150, rx: 10, fill: '#8f1f24', stroke: '#2a0a0a', 'stroke-width': 8 }, A1cam)
  txt(A1cam, 'BOUCHERIE', { x: 540, y: 365, 'font-size': 96, fill: '#ffffff', 'letter-spacing': 6 })
  txt(A1cam, 'MARC · ARTISAN DEPUIS 1995', { x: 540, y: 470, 'font-size': 34, fill: '#c9c4bc' })
  svg('rect', { x: 100, y: 520, width: 880, height: 640, fill: '#16201c', stroke: '#3a3a3a', 'stroke-width': 14 }, A1cam)
  svg('path', { d: 'M 140 560 L 420 560 L 160 1100 Z', fill: '#ffffff', opacity: 0.06 }, A1cam)
  svg('rect', { x: -400, y: 1160, width: W + 800, height: 900, fill: '#1a1c22' }, A1cam)
  for (let k = -4; k <= 4; k++) svg('path', { d: `M ${540 + k * 140} 1160 L ${540 + k * 420} 2100`, stroke: '#2a2c34', 'stroke-width': 6 }, A1cam)
  // Les lettres rouges, révélées au fil du jet.
  const tc = svg('clipPath', { id: 'tagClip' }, defs)
  const tagRect = svg('rect', { x: 120, y: 600, width: 0, height: 500 }, tc)
  const tagG = svg('g', { 'clip-path': 'url(#tagClip)' }, A1cam)
  const tagTxt = txt(tagG, 'ASSASSIN', { x: 540, y: 880, 'font-size': 190, fill: '#ff2a2a', transform: 'rotate(-6 540 860)', 'font-family': 'Fraunces Variable', 'font-style': 'italic' })
  for (let k = 0; k < 8; k++) svg('path', { d: `M ${200 + k * 95} ${900 + (k % 3) * 8} l ${3 - (k % 2) * 6} ${60 + (k % 4) * 30}`, stroke: '#ff2a2a', 'stroke-width': 10, 'stroke-linecap': 'round' }, tagG)
  void tagTxt
  const extMil = MILIT.map((o, k) => {
    const p = person(A1cam, o)
    hood(p, ['#1c2420', '#22262e', '#1a1f2a'][k])
    return p
  })
  const can = svg('g', {}, A1cam)
  svg('rect', { x: -18, y: -50, width: 36, height: 90, rx: 8, fill: '#c9d2dc', stroke: '#1a1a1a', 'stroke-width': 4 }, can)
  svg('rect', { x: -8, y: -64, width: 16, height: 16, fill: '#ff2a2a' }, can)
  const mist = Array.from({ length: 14 }, () => svg('circle', { r: 10, fill: '#ff5a5a', opacity: 0 }, A1cam))
  // A2 · Caméra intérieure : la chambre froide, le boucher, la poussée.
  const A2 = svg('g', { filter: 'url(#cctv)', display: 'none' }, R)
  const A2cam = svg('g', {}, A2)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#shopIn)' }, A2cam)
  for (let y = 120; y < 1000; y += 70) for (let x = -40; x < W + 60; x += 70) svg('rect', { x, y, width: 66, height: 66, fill: '#3a4242', stroke: '#2a3030', 'stroke-width': 3 }, A2cam)
  for (let k = 0; k < 14; k++) for (let j = 0; j < 8; j++) svg('rect', { x: -200 + k * 110 + (j % 2) * 55, y: 1000 + j * 120, width: 55, height: 120, fill: (k + j) % 2 ? '#2a2e2e' : '#3c4242' }, A2cam)
  // La porte de la chambre froide (ouverte : la lumière blanche, les carcasses).
  const doorway = svg('g', { transform: 'translate(560 560)' }, A2cam)
  svg('rect', { x: -230, y: -40, width: 460, height: 640, fill: '#e8f6ff' }, doorway)
  svg('ellipse', { cx: 0, cy: 260, rx: 420, ry: 520, fill: 'url(#fogLight)' }, doorway)
  for (const [x, s] of [[-120, 0.7], [20, 0.8], [150, 0.7]]) carcass(doorway, x, 220, s)
  const doorPanel = svg('path', { fill: 'url(#steel)', stroke: '#5a6470', 'stroke-width': 8 }, doorway)
  const doorHandle = svg('rect', { width: 26, height: 140, rx: 10, fill: '#5a6470' }, doorway)
  svg('rect', { x: -250, y: -60, width: 500, height: 680, fill: 'none', stroke: '#8a96a6', 'stroke-width': 20 }, doorway)
  const intMil = MILIT.map((o, k) => {
    const p = person(A2cam, o)
    hood(p, ['#1c2420', '#22262e', '#1a1f2a'][k])
    return p
  })
  const phonesG = MILIT.map(() => {
    const g = svg('g', {}, A2cam)
    svg('rect', { x: -22, y: -40, width: 44, height: 80, rx: 8, fill: '#111' }, g)
    svg('rect', { x: -16, y: -32, width: 32, height: 64, rx: 4, fill: '#cfe8ff' }, g)
    return g
  })
  // Le comptoir au premier plan.
  svg('rect', { x: -200, y: 1500, width: 520, height: 600, fill: '#d8dde2', stroke: '#8a96a6', 'stroke-width': 8 }, A2cam)
  svg('rect', { x: -200, y: 1460, width: 520, height: 70, fill: '#cfe8ff', opacity: 0.6 }, A2cam)
  const marc = person(A2cam, MARC)
  const marcShadow = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#000', opacity: 0 }, A2cam)
  // L'interface de la caméra de surveillance (commune).
  const cctvUi = svg('g', {}, R)
  const camLabel = txt(cctvUi, '', { x: 60, y: 120, 'font-size': 40, fill: '#e8ffe8', 'font-family': 'monospace', 'font-weight': 700 })
  camLabel.setAttribute('text-anchor', 'start')
  const camTime = txt(cctvUi, '', { x: 1020, y: 1860, 'font-size': 38, fill: '#e8ffe8', 'font-family': 'monospace', 'font-weight': 700 })
  camTime.setAttribute('text-anchor', 'end')
  const recDot = svg('circle', { cx: 1000, cy: 108, r: 16, fill: '#ff3b3b' }, cctvUi)
  for (let k = 0; k < 40; k++) svg('rect', { x: 0, y: k * 48, width: W, height: 3, fill: '#000', opacity: 0.25 }, cctvUi)
  // B · La porte fermée : le cadenas, le thermomètre, le givre, les coups.
  const Bd = svg('g', { display: 'none' }, R)
  const Bcam = svg('g', {}, Bd)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#steel)' }, Bcam)
  for (let k = 0; k < 9; k++) svg('rect', { x: -100, y: 120 + k * 200, width: W + 200, height: 10, fill: '#8a96a6', opacity: 0.5 }, Bcam)
  svg('rect', { x: 780, y: 700, width: 70, height: 520, rx: 26, fill: '#5a6470', stroke: '#2a3038', 'stroke-width': 8 }, Bcam)
  const lock = svg('g', { transform: 'translate(815 1300)' }, Bcam)
  const shackle = svg('path', { d: 'M -60 0 L -60 -90 A 60 60 0 0 1 60 -90 L 60 0', fill: 'none', stroke: '#c9d2dc', 'stroke-width': 26 }, lock)
  svg('rect', { x: -90, y: -10, width: 180, height: 170, rx: 26, fill: '#d9a930', stroke: '#6a4a10', 'stroke-width': 8 }, lock)
  svg('circle', { cx: 0, cy: 70, r: 18, fill: '#6a4a10' }, lock)
  const thermo = svg('g', { transform: 'translate(300 520)' }, Bcam)
  svg('rect', { x: -200, y: -110, width: 400, height: 220, rx: 24, fill: '#10141a', stroke: '#3a4250', 'stroke-width': 10 }, thermo)
  const thermoTxt = txt(thermo, '', { y: 50, 'font-size': 130, fill: '#6fd0ff', 'font-family': 'monospace', 'font-weight': 700 })
  txt(thermo, 'CHAMBRE FROIDE', { y: -64, 'font-size': 26, fill: '#9aa6b4' })
  const frostB = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#frost)', opacity: 0 }, Bd)
  const crystals = Array.from({ length: 26 }, (_, k) => {
    const g = svg('g', { opacity: 0 }, Bd)
    for (let a = 0; a < 6; a++) svg('path', { d: 'M 0 0 L 0 -40 M 0 -24 L -12 -34 M 0 -24 L 12 -34', stroke: '#ffffff', 'stroke-width': 5, transform: `rotate(${a * 60})` }, g)
    const side = k % 4
    const u = ((k * 37) % 26) / 26
    const x = side === 0 ? 40 : side === 1 ? 1040 : u * W
    const y = side === 2 ? 40 : side === 3 ? 1880 : u * H
    return { g, x, y, d: (k % 7) * 0.06 }
  })
  const knock = txt(Bd, 'BAM ! BAM !', { x: 540, y: 1000, 'font-size': 120, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 16, 'paint-order': 'stroke fill', opacity: 0 })
  // C1 · Les cinq attaques (la vitrine, en couleurs, de jour).
  const C1 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#dayShop)' }, C1)
  svg('rect', { x: 80, y: 260, width: 920, height: 150, rx: 10, fill: '#c8322a', stroke: '#6a1010', 'stroke-width': 8 }, C1)
  txt(C1, 'BOUCHERIE', { x: 540, y: 365, 'font-size': 96, fill: '#ffffff', 'letter-spacing': 6 })
  svg('rect', { x: 100, y: 470, width: 880, height: 720, fill: '#cfe6f2', stroke: '#5a6470', 'stroke-width': 14 }, C1)
  for (const [x, y] of [[260, 880], [520, 880], [780, 880]]) {
    svg('rect', { x: x - 100, y, width: 200, height: 80, rx: 10, fill: '#f6f2e8', stroke: '#9aa6b4', 'stroke-width': 4 }, C1)
    svg('ellipse', { cx: x, cy: y + 20, rx: 70, ry: 26, fill: '#c84a4a' }, C1)
  }
  const attackTags = TAGS.map((s, k) => {
    const g = svg('g', { display: 'none' }, C1)
    const pos = [[540, 640, -6], [380, 780, 5], [640, 1060, -4], [300, 1000, 8], [780, 760, -10]][k]
    txt(g, s, { x: pos[0], y: pos[1], 'font-size': [120, 70, 72, 110, 80][k], fill: '#ff2a2a', transform: `rotate(${pos[2]} ${pos[0]} ${pos[1]})`, 'font-family': 'Fraunces Variable', 'font-style': 'italic' })
    return g
  })
  const shopCracks = cracks(C1, 820, 600, 1.4, 4)
  // C2 · Marc dans sa boutique, puis dans le noir, qui attend.
  const C2 = svg('g', { display: 'none' }, R)
  const C2cam = svg('g', {}, C2)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#e8eef2' }, C2cam)
  for (let y = 100; y < 1300; y += 80) for (let x = -40; x < W + 60; x += 80) svg('rect', { x, y, width: 76, height: 76, fill: '#f6f8fa', stroke: '#c9d0da', 'stroke-width': 3 }, C2cam)
  svg('rect', { x: 80, y: 260, width: 400, height: 50, fill: '#8a96a6' }, C2cam)
  for (let k = 0; k < 5; k++) svg('path', { d: `M ${110 + k * 80} 310 l 0 60`, stroke: '#9aa6b4', 'stroke-width': 6 }, C2cam)
  const marc2 = person(C2cam, MARC)
  svg('rect', { x: -400, y: 1380, width: W + 800, height: 800, fill: '#d8dde2', stroke: '#8a96a6', 'stroke-width': 8 }, C2cam)
  svg('rect', { x: -400, y: 1350, width: W + 800, height: 60, fill: '#cfe8ff', opacity: 0.7 }, C2cam)
  const c2dark = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#05070c', opacity: 0 }, C2)
  const clock = svg('g', { transform: 'translate(860 420)', opacity: 0 }, C2)
  svg('rect', { x: -170, y: -80, width: 340, height: 160, rx: 20, fill: '#10141a', stroke: '#3a4250', 'stroke-width': 8 }, clock)
  const clockTxt = txt(clock, '03:12', { y: 40, 'font-size': 110, fill: '#ff3b3b', 'font-family': 'monospace', 'font-weight': 700 })
  const keyG = svg('g', { opacity: 0 }, C2)
  svg('circle', { cx: 0, cy: 0, r: 40, fill: 'none', stroke: '#d9a930', 'stroke-width': 14 }, keyG)
  svg('path', { d: 'M 40 0 L 160 0 M 120 0 L 120 30 M 150 0 L 150 24', stroke: '#d9a930', 'stroke-width': 14 }, keyG)
  // D · Dans la chambre froide : quarante minutes à moins 18.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#coldRoom)' }, Dcam)
  for (const [x, s] of [[120, 1.1], [400, 1.2], [700, 1.15], [960, 1.1]]) carcass(Dcam, x, 520, s, '#a84444')
  svg('rect', { x: -400, y: 1350, width: W + 800, height: 800, fill: '#9fbcd4' }, Dcam)
  const huddle = MILIT.map((o, k) => {
    const p = person(Dcam, o)
    hood(p, ['#1c2420', '#22262e', '#1a1f2a'][k])
    return p
  })
  const breath = Array.from({ length: 9 }, (_, k) => ({ el: svg('circle', { r: 30, fill: '#ffffff', opacity: 0 }, Dcam), k }))
  const dThermo = svg('g', { transform: 'translate(860 640)' }, D)
  svg('rect', { x: -170, y: -70, width: 340, height: 140, rx: 20, fill: '#10141a', stroke: '#3a4250', 'stroke-width': 8 }, dThermo)
  txt(dThermo, '-18°C', { y: 40, 'font-size': 100, fill: '#6fd0ff', 'font-family': 'monospace', 'font-weight': 700 })
  const dFrost = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#frost)', opacity: 0.5 }, D)
  const dBlue = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#3b82f6', opacity: 0 }, D)
  // E · Le jugement : Marc sous le projecteur, le marteau.
  const Ev = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, Ev)
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, Ev)
  const marcE = person(Ev, MARC)
  const block = svg('g', { transform: 'translate(540 1560)' }, Ev)
  svg('rect', { x: -380, y: -60, width: 760, height: 200, rx: 20, fill: 'url(#blockWood)', stroke: '#3a2414', 'stroke-width': 8 }, block)
  for (let k = 0; k < 6; k++) svg('path', { d: `M ${-340 + k * 130} -40 l 40 150`, stroke: '#5a3a20', 'stroke-width': 4, opacity: 0.6 }, block)
  const cleaver = svg('g', { transform: 'translate(220 -60) rotate(-20)' }, block)
  svg('rect', { x: -10, y: -170, width: 150, height: 120, rx: 8, fill: '#c9d2dc', stroke: '#5a6470', 'stroke-width': 6 }, cleaver)
  svg('rect', { x: 130, y: -140, width: 120, height: 34, rx: 12, fill: '#3a2414' }, cleaver)
  const eFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { A1, A1cam, tagRect, extMil, can, mist, A2, A2cam, doorPanel, doorHandle, intMil, phonesG, marc, marcShadow, cctvUi, camLabel, camTime, recDot, Bd, Bcam, shackle, thermoTxt, frostB, crystals, knock, C1, attackTags, shopCracks, C2, C2cam, marc2, c2dark, clock, clockTxt, keyG, D, Dcam, huddle, breath, dFrost, dBlue, Ev, marcE, eFlash, gavel, rwBands }
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
  // 04 : la peinture contre le cadenas.
  const paintLock = prop((g) => {
    panel(g, 760, 380)
    const pc = svg('g', { transform: 'translate(-180 0)' }, g)
    svg('rect', { x: -60, y: -90, width: 120, height: 180, rx: 14, fill: '#c9d2dc', stroke: '#1a1a1a', 'stroke-width': 6 }, pc)
    svg('rect', { x: -60, y: -30, width: 120, height: 60, fill: '#ff2a2a' }, pc)
    svg('rect', { x: -14, y: -120, width: 28, height: 32, fill: '#1a1a1a' }, pc)
    txt(g, '≠', { x: 0, y: 50, 'font-size': 160, fill: '#ffd166' })
    const lk = svg('g', { transform: 'translate(190 30)' }, g)
    svg('path', { d: 'M -50 0 L -50 -70 A 50 50 0 0 1 50 -70 L 50 0', fill: 'none', stroke: '#c9d2dc', 'stroke-width': 22 }, lk)
    svg('rect', { x: -76, y: -10, width: 152, height: 130, rx: 22, fill: '#d9a930', stroke: '#6a4a10', 'stroke-width': 7 }, lk)
  })
  // 05 : cinq vitrines brisées.
  const windows = prop((g) => {
    panel(g, 820, 360)
    for (let k = 0; k < 5; k++) {
      const x = -320 + k * 160
      svg('rect', { x: x - 60, y: -100, width: 120, height: 170, fill: '#cfe6f2', stroke: '#5a6470', 'stroke-width': 6 }, g)
      svg('path', { d: `M ${x - 10} -60 L ${x + 20} -20 L ${x - 20} 10 L ${x + 30} 50 M ${x + 20} -20 L ${x + 50} -40`, fill: 'none', stroke: '#10121a', 'stroke-width': 5 }, g)
      txt(g, ['ASSASSIN', 'MEURTRE', 'HONTE', 'BOURREAU', 'COMPLICE'][k], { x, y: 120, 'font-size': 24, fill: '#ff3b3b' })
    }
  })
  // 09 : les doigts gelés.
  const fingers = prop((g) => {
    panel(g, 520, 440, '#6fd0ff')
    svg('path', { d: 'M -120 160 C -140 40 -120 -40 -90 -80 L -60 -170 C -50 -200 -10 -190 -20 -160 L -40 -80 L 0 -200 C 10 -230 50 -225 44 -192 L 20 -80 L 60 -190 C 70 -220 110 -210 100 -180 L 70 -70 L 110 -140 C 130 -170 160 -150 146 -122 L 90 0 C 70 80 40 140 0 160 Z', fill: '#cfe2f0', stroke: '#4a6a8a', 'stroke-width': 8, 'stroke-linejoin': 'round' }, g)
    for (const [x, y] of [[-40, -150], [20, -170]]) svg('circle', { cx: x, cy: y, r: 30, fill: '#7a5ab8', opacity: 0.6 }, g)
    txt(g, '-18°C', { x: 150, y: 180, 'font-size': 60, fill: '#6fd0ff' })
  })
  // 10 : la boutique fermée.
  const closed = prop((g) => {
    panel(g, 600, 420)
    svg('rect', { x: -220, y: -170, width: 440, height: 300, fill: '#8a96a6', stroke: '#3a4250', 'stroke-width': 8 }, g)
    for (let y = -150; y < 120; y += 30) svg('path', { d: `M -220 ${y} L 220 ${y}`, stroke: '#5a6470', 'stroke-width': 6 }, g)
    const sg = svg('g', { transform: 'rotate(-6)' }, g)
    svg('rect', { x: -130, y: -40, width: 260, height: 90, rx: 10, fill: '#ffffff', stroke: '#c8322a', 'stroke-width': 8 }, sg)
    txt(sg, 'FERMÉ', { y: 30, 'font-size': 64, fill: '#c8322a' })
  })
  // 11 : le cadenas.
  const padlock = prop((g) => {
    svg('path', { d: 'M -90 0 L -90 -120 A 90 90 0 0 1 90 -120 L 90 0', fill: 'none', stroke: '#c9d2dc', 'stroke-width': 40 }, g)
    svg('rect', { x: -140, y: -20, width: 280, height: 240, rx: 36, fill: '#d9a930', stroke: '#6a4a10', 'stroke-width': 10 }, g)
    svg('circle', { cy: 90, r: 26, fill: '#6a4a10' }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, paintLock, windows, fingers, closed, padlock }
})

// ------------------------------------------------- 3 · Le vote : Marc face à Inès (couverture de survie)
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const marc = person(L.actor, MARC)
  const ines = person(L.actor, INES)
  svg('path', { d: 'M 600 1500 C 620 1360 1000 1360 1020 1500 L 1060 1760 L 560 1760 Z', fill: 'url(#blanket)', stroke: '#a67a10', 'stroke-width': 6 }, L.actor)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { marc, ines }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#6fd0ff' }, fxTop), d: (x + y) * 0.011 })
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
fs(tag('-18°C', 'slam white', { t0: K.LOCK + 0.15, t1: K.REWIND, y: 300, rot: -4, from: 2.6, dur: 0.15 }), 160)
counterTag(Wd('02', 'cinquieme') - 0.1, K.PORTRAIT - 0.08, 5, 'ATTAQUES EN 1 AN', { y: 250, dur: 0.6 })
fs(tag('MARC · 30 ANS DE MÉTIER', 'pill yellow', { t0: K.PORTRAIT, t1: K.WAIT - 0.08, y: 300, rot: -2 }), 52)
fs(tag('IL LES ATTENDAIT.', 'slam white', { t0: K.WAIT, t1: K.INSIDE - 0.05, y: 1200, rot: -3, from: 2.4, dur: 0.18 }), 96)
counterTag(K.COLD, K.HYPO - 0.08, 40, 'MINUTES', { y: 300, dur: 0.9 })
fs(tag('HYPOTHERMIE', 'stamp', { t0: Wd('03', 'hypothermie') - 0.15, t1: K.TODAY - 0.05, y: 360, rot: -6, from: 2.8, dur: 0.18 }), 110)
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('SÉQUESTRATION', 'stamp', { t0: Wd('04', 'sequestration') - 0.15, t1: E('04') + 0.2, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 100)
counterTag(S('05') - 0.05, Wd('05', 'des') - 0.1, 5, 'VITRINES BRISÉES', { y: 300, dur: 0.5 })
fs(tag('PLAINTES CLASSÉES SANS SUITE', 'pill red', { t0: Wd('05', 'une') - 0.15, t1: Wd('05', 'a', 1) - 0.1, y: 300, rot: -2 }), 46)
fs(tag('HARCÈLEMENT.', 'slam yellow', { t0: Wd('05', 'harcelement') - 0.2, t1: E('05') + 0.15, y: 400, rot: -4, from: 2.8, dur: 0.18 }), 120)
fs(tag('« DE LA PÉDAGOGIE ? »', 'slam white', { t0: Wd('06', 'de', 1) - 0.15, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 80)
fs(tag('« ASSASSIN »', 'pill', { t0: Wd('07', 'dassassin') - 0.2, t1: Wd('07', 'ils') - 0.12, y: 300, rot: -2 }), 60)
fs(tag('« ILS ONT VÉCU COMME EUX. »', 'slam white', { t0: Wd('07', 'ils') - 0.1, t1: E('07') + 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 66)
fs(tag('BOUCHER À BOUT<br>OU TORTIONNAIRE ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 80)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
tag('20 ANS', 'pill', { t0: Wd('09', '20') - 0.15, t1: Wd('09', 'pour') - 0.1, y: 300, rot: -2 })
fs(tag('POUR DES TAGS.', 'slam white', { t0: Wd('09', 'pour') - 0.12, t1: E('09') + 0.2, y: 380, rot: -3, from: 2.4, dur: 0.18 }), 100)
fs(tag('SA FEMME A PEUR', 'pill red', { t0: Wd('10', 'sa', 1) - 0.12, t1: E('10') + 0.15, y: 300, rot: 2 }), 54)
fs(tag('« UN BOURREAU AVEC UN CADENAS »', 'slam white', { t0: Wd('11', 'pas') - 0.1, t1: E('11') + 0.15, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 56)
counterTag(S('12') - 0.05, Wd('12', 'la') - 0.1, 5, 'PLAINTES', { y: 300, dur: 0.5 })
fs(tag('RIEN.', 'stamp', { t0: Wd('12', 'rien') - 0.12, t1: Wd('12', 'et') - 0.12, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 140)
fs(tag('« C’EST LUI QUE VOUS JUGEZ. »', 'slam white', { t0: Wd('12', 'et') - 0.1, t1: E('12') + 0.3, y: 330, rot: -3, from: 2.4, dur: 0.2 }), 62)
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
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', boucher: 'MARC, LE BOUCHER' }

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

const W5 = (k) => Wd('02', 'cinquieme') - 0.05 + k * 0.22
const IMPACTS = [
  [K.CAM2, 8],
  [K.PUSH, 10],
  [K.SLAM, 30],
  [K.LOCK, 14],
  [K.REPLAY, 10],
  ...TAGS.map((_, k) => [W5(k), 8]),
  [K.WAIT, 10],
  [K.INSIDE, 16],
  [K.COLD, 8],
  [Wd('03', 'hypothermie') - 0.15, 12],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'sequestration') - 0.15, 12],
  [Wd('05', 'harcelement') - 0.2, 10],
  [Wd('09', 'pour') - 0.12, 10],
  [Wd('12', 'rien') - 0.12, 10],
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

// Le panneau de la porte de la chambre froide : ouvert (k = 0) ou fermé (k = 1).
function doorShape(k) {
  const w = 460 * k
  return `M -230 -40 L ${-230 + w} ${-40 + 30 * (1 - k)} L ${-230 + w} ${600 - 30 * (1 - k)} L -230 600 Z`
}
const pad2 = (n) => String(Math.floor(n)).padStart(2, '0')

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const phase = t < K.CAM2 ? 'A1' : t < K.SLAM ? 'A2' : t < K.REWIND ? 'B' : t < K.PORTRAIT ? 'C1' : t < K.INSIDE ? 'C2' : t < K.COLD ? 'B2' : t < K.TODAY ? 'D' : 'E'
    show(HOOK.A1, phase === 'A1')
    show(HOOK.A2, phase === 'A2')
    show(HOOK.cctvUi, phase === 'A1' || phase === 'A2')
    show(HOOK.Bd, phase === 'B' || phase === 'B2')
    show(HOOK.C1, phase === 'C1')
    show(HOOK.C2, phase === 'C2')
    show(HOOK.D, phase === 'D')
    show(HOOK.Ev, phase === 'E')
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A1' || phase === 'A2') {
      HOOK.camLabel.textContent = phase === 'A1' ? 'CAM 01 · EXTÉRIEUR' : 'CAM 02 · BOUTIQUE'
      HOOK.camTime.textContent = `03:12:${pad2(41 + t)}`
      HOOK.recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2)
    }
    if (phase === 'A1') {
      // Ils taguent la vitrine.
      const p = clamp(t / K.CAM2)
      HOOK.tagRect.setAttribute('width', (880 * ease.io2(p)).toFixed(0))
      HOOK.extMil.forEach((m, k) => m.update(t, { x: [200, 560, 900][k], y: 1330, scale: 0.62, brows: 'angry', look: [k === 1 ? 0 : 0.3, -0.2], armR: k === 1 ? [2.3, 0.3] : [0.3, 0.6], armL: [0.2, 0.5], seed: k * 1.7 }))
      place(HOOK.can, 560 + 380 * Math.cos(t * 3) * 0.3 + 160, 1050 - 40 * Math.sin(t * 5), 1, -30)
      HOOK.mist.forEach((m, i) => {
        const v = ((t * 3 + i / 14) % 1)
        m.setAttribute('cx', (720 + 120 * v + 20 * Math.sin(i)).toFixed(0))
        m.setAttribute('cy', (1000 - 60 * v + 30 * Math.cos(i * 2)).toFixed(0))
        m.setAttribute('opacity', (0.5 * (1 - v)).toFixed(2))
        m.setAttribute('r', (6 + 26 * v).toFixed(0))
      })
      HOOK.A1cam.setAttribute('transform', SHOT(540, 980, 1.0 + 0.04 * t, 0, hx, hy))
    }
    if (phase === 'A2') {
      // Ils filment les carcasses ; Marc sort de l'ombre et les pousse ; la porte claque.
      const push = ease.in2(clamp((t - K.PUSH) / (K.SLAM - 0.25 - K.PUSH)))
      const close = ease.in3(clamp((t - (K.SLAM - 0.25)) / 0.25))
      HOOK.intMil.forEach((m, k) => {
        const x0 = [430, 580, 720][k]
        const inside = push
        m.update(t, { x: lerp(x0, 560 + (k - 1) * 60, inside), y: lerp(1080, 840, inside), scale: lerp(0.62, 0.35, inside), brows: t > K.MARC + 0.4 ? 'surprised' : 'determined', look: [t > K.MARC + 0.4 ? 0.5 : 0, -0.3], armR: [lerp(1.9, 2.6, push), 0.5], armL: [0.3, 0.5], lean: 0.1 * push, seed: k * 1.3 })
        m.root.setAttribute('opacity', (1 - close).toFixed(2))
        place(HOOK.phonesG[k], lerp(x0 + 90, 560 + (k - 1) * 60, inside), lerp(820, 700, inside), lerp(1, 0.5, inside) * (1 - close), 0)
      })
      const appear = ease.out3(clamp((t - K.MARC) / 0.5))
      HOOK.marc.update(t, { x: lerp(1200, 860, appear) - 120 * push, y: 1180, scale: 0.8, mouth: mouthOf('boucher', t), brows: 'angry', look: [-0.5, -0.1], armR: [lerp(0.4, 1.6, push), lerp(0.6, 0.2, push)], armL: [lerp(0.4, 1.5, push), 0.3], lean: -0.1 * push, seed: 0.8 })
      HOOK.marcShadow.setAttribute('opacity', 0)
      HOOK.doorPanel.setAttribute('d', doorShape(close))
      HOOK.doorHandle.setAttribute('x', (-230 + 460 * close - 50).toFixed(0))
      HOOK.doorHandle.setAttribute('y', 220)
      HOOK.doorHandle.setAttribute('opacity', close > 0.9 ? 1 : 0)
      const zin = ease.io2(clamp((t - K.PUSH) / 0.6))
      HOOK.A2cam.setAttribute('transform', SHOT(lerp(560, 600, zin), lerp(980, 900, zin), lerp(1.0, 1.25, zin) + 0.03 * (t - K.CAM2), 0, hx, hy))
    }
    if (phase === 'B' || phase === 'B2') {
      // La porte fermée : cadenas, thermomètre qui descend, givre, coups.
      const t0 = phase === 'B' ? K.SLAM : K.INSIDE
      const lockT = phase === 'B' ? K.LOCK : K.INSIDE + 0.3
      const k = t - t0
      const locked = ease.out3(clamp((t - lockT) / 0.12))
      HOOK.shackle.setAttribute('transform', `translate(0 ${lerp(-70, 0, locked).toFixed(1)})`)
      HOOK.thermoTxt.textContent = `${Math.round(lerp(-4, -18, clamp(k / 1.0)))}°C`
      HOOK.frostB.setAttribute('opacity', (0.9 * ease.out3(clamp(k / 1.2))).toFixed(2))
      HOOK.crystals.forEach((c) => {
        const v = ease.back(2)(clamp((k - 0.2 - c.d) / 0.3))
        c.g.setAttribute('opacity', v > 0 ? 0.9 : 0)
        c.g.setAttribute('transform', `translate(${c.x} ${c.y}) scale(${(v * 1.3).toFixed(2)}) rotate(${k * 20})`)
      })
      const kn = [0.7, 0.85, 1.25, 1.4].map((d) => Math.exp(-Math.max(0, k - d) * 12) * (k > d ? 1 : 0)).reduce((a, b) => a + b, 0)
      HOOK.knock.setAttribute('opacity', (phase === 'B' ? Math.min(1, kn * 1.5) : 0).toFixed(2))
      HOOK.Bcam.setAttribute('transform', SHOT(560, 960, 1.0 + 0.03 * k, 0, hx + 14 * kn * Math.sin(t * 90), hy))
      const rw = phase === 'B' && t > K.REWIND - 0.0
      void rw
    }
    if (phase === 'C1') {
      // Les cinq attaques s'empilent sur la vitrine.
      HOOK.attackTags.forEach((g, k) => show(g, t >= W5(k)))
      ;[...HOOK.shopCracks.querySelectorAll('path')].forEach((c, i) => c.setAttribute('stroke-dashoffset', 900 * (1 - prog(t, W5(3) + i * 0.01, 0.2, ease.out3))))
      HOOK.C1.setAttribute('transform', SHOT(540, 700, 1.0 + 0.03 * (t - K.REPLAY), 0, hx + (t < K.REPLAY ? 30 * Math.sin(t * 70) : 0), hy))
    }
    if (phase === 'C2') {
      // Marc dans sa boutique, puis dans le noir : il attend, la clé à la main.
      const dark = ease.io2(clamp((t - K.WAIT) / 0.4))
      HOOK.marc2.update(t, { x: 540, y: 1180, scale: 1.1, mouth: 0, brows: dark > 0.5 ? 'angry' : 'neutral', look: [dark > 0.5 ? -0.4 : 0, 0], armR: [lerp(0.2, 0.9, dark), lerp(0.4, 2.0, dark)], armL: [lerp(0.2, 0.9, dark), lerp(0.4, 2.0, dark)], seed: 0.8 })
      HOOK.c2dark.setAttribute('opacity', (0.6 * dark).toFixed(2))
      HOOK.clock.setAttribute('opacity', dark.toFixed(2))
      HOOK.clockTxt.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.6)
      HOOK.keyG.setAttribute('opacity', dark.toFixed(2))
      HOOK.keyG.setAttribute('transform', `translate(${380 + 6 * Math.sin(t * 3)} 1240) rotate(${-20 + 10 * Math.sin(t * 2)})`)
      HOOK.C2cam.setAttribute('transform', SHOT(540, lerp(980, 900, dark), 1.0 + 0.04 * (t - K.PORTRAIT) + 0.1 * dark, 0, hx, hy))
    }
    if (phase === 'D') {
      // Dans la chambre froide : ils grelottent ; l'étudiante s'effondre.
      const k = t - K.COLD
      const hypo = ease.out3(clamp((t - K.HYPO) / 0.8))
      HOOK.huddle.forEach((m, i) => {
        const shiver = 4 * Math.sin(t * 40 + i)
        m.update(t, { x: [330, 560, 790][i] + shiver, y: 1300 + (i === 1 ? 120 * hypo : 0), scale: 0.72, brows: 'sad', look: [0, 0.3], armR: [0.6, 2.2], armL: [0.6, 2.2], lean: i === 1 ? 0.35 * hypo : 0.04 * Math.sin(t * 2 + i), headNod: i === 1 ? 0.6 * hypo : 0.1, seed: i * 1.1, blink: i === 1 && hypo > 0.5 ? 1 : null })
      })
      HOOK.breath.forEach((b) => {
        const i = b.k % 3
        const v = (k * 0.8 + b.k / 9) % 1
        b.el.setAttribute('cx', ([330, 560, 790][i] + 30 + 60 * v).toFixed(0))
        b.el.setAttribute('cy', (1130 - 120 * v).toFixed(0))
        b.el.setAttribute('r', (20 + 50 * v).toFixed(0))
        b.el.setAttribute('opacity', (i === 1 && hypo > 0.6 ? 0 : 0.5 * (1 - v)).toFixed(2))
      })
      HOOK.dFrost.setAttribute('opacity', (0.5 + 0.45 * hypo).toFixed(2))
      HOOK.dBlue.setAttribute('opacity', (0.22 * hypo).toFixed(2))
      HOOK.Dcam.setAttribute('transform', SHOT(560, lerp(960, 1080, hypo), 1.0 + 0.03 * k + 0.2 * hypo, 0, hx, hy))
    }
    if (phase === 'E') {
      const k = t - K.TODAY
      HOOK.marcE.update(t, { x: 540, y: 1080, scale: 1.15, mouth: 0, brows: 'angry', look: [0, 0], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 0.8 })
      HOOK.eFlash.setAttribute('opacity', (0.7 * Math.exp(-k * 8)).toFixed(3))
      const g = prog(t, K.GAVEL - 0.12, 0.12, ease.in3)
      const after = t - K.GAVEL
      show(HOOK.gavel, t > K.GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(1000, 640, g)} ${lerp(800, 1420, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
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
    prop(TRIB.paintLock, Wd('04', 'peinture') - 0.2, Wd('04', 'sequestration') - 0.2, 540, 660, 0.85)
    prop(TRIB.windows, S('05') - 0.05, Wd('05', 'des') - 0.1, 540, 700, 0.85)
    prop(TRIB.fingers, Wd('09', 'deux') - 0.2, Wd('09', 'pour') - 0.15, 540, 700, 0.85)
    prop(TRIB.closed, Wd('10', 'sa', 1) - 0.15, E('10') + 0.15, 540, 700, 0.8)
    prop(TRIB.padlock, Wd('11', 'cadenas') - 0.3, E('11') + 0.15, 540, 760, 0.7)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.marc.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'angry', look: [0.3, 0], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 3.1 })
    VOTE.ines.update(t, { x: 810, y: 1450, scale: 0.85, brows: 'sad', look: [-0.3, 0.1], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 0.7 })
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
