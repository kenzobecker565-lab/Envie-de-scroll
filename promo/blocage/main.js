/**
 * ============================================================================
 *  « Affaire Classée ? » — Le blocage (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : on est dans le téléphone de
 *  l'automobiliste, derrière son pare-brise, sur le périphérique bloqué. Des
 *  militants collés au bitume, une ambulance coincée dans le rétroviseur ; il
 *  hurle, sort de la voiture, fonce sur Lou… arrêt sur image : un
 *  électrocardiogramme traverse l'écran et devient plat. Le narrateur explique
 *  pendant le replay (vu du ciel, le bouchon qui grossit, le direct), puis dans
 *  l'ambulance (l'infarctus, quarante minutes de retard), et Lou est jugée.
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
grad('splitL', [[0, '#5a2a0a'], [1, '#120804']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#2a3040'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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

// Les personnages. Les avocats en costume ; Lou, la militante (gilet orange) ; Michel.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const LOU = { robe: '#ff7a1a', jabot: false, collar: '#2a2f3a', hair: 'bob', hairColor: '#8a3a16', skin: '#f2c4a0', iris: '#3a5a2a', female: true }
const MILITANTS = [
  { robe: '#ff8a2a', jabot: false, collar: '#2a2f3a', hair: 'messy', hairColor: '#2a1a10', skin: '#d9a07a', iris: '#2b1d12' },
  { robe: '#ff7a1a', jabot: false, collar: '#2a2f3a', hair: 'bun', hairColor: '#e0c080', skin: '#f6d0b0', iris: '#2a4a7a', female: true },
  { robe: '#ff8a2a', jabot: false, collar: '#2a2f3a', hair: 'short', hairColor: '#111111', skin: '#8a5a3a', iris: '#2b1d12' },
]
const MICHEL = { robe: '#5a6a7a', jabot: false, collar: '#e8eef6', hair: 'short', hairColor: '#c9c4bc', skin: '#e9b48f', iris: '#3b2a1a' }

// Une voiture vue de derrière (feux stop allumés).
function carRear(parent, x, y, s, color, seed = 1) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('ellipse', { cx: 0, cy: 150, rx: 240, ry: 26, fill: '#000', opacity: 0.4 }, g)
  svg('path', { d: 'M -200 40 L -170 -60 C -150 -110 150 -110 170 -60 L 200 40 L 200 140 L -200 140 Z', fill: color, stroke: '#0d0e12', 'stroke-width': 6, 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M -150 -40 L -128 -90 C -100 -104 100 -104 128 -90 L 150 -40 Z', fill: '#1a2230' }, g)
  svg('path', { d: 'M -120 -84 L -60 -96', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.25 }, g)
  for (const sd of [-1, 1]) {
    svg('rect', { x: sd < 0 ? -196 : 120, y: 10, width: 76, height: 34, rx: 10, fill: '#ff2a2a' }, g)
    svg('ellipse', { cx: sd * 158, cy: 27, rx: 90, ry: 50, fill: 'url(#glowRed)', opacity: 0.6 }, g)
  }
  svg('rect', { x: -60, y: 60, width: 120, height: 36, rx: 6, fill: '#f4f4f4', stroke: '#1d3fa0', 'stroke-width': 4 }, g)
  for (const sd of [-1, 1]) svg('rect', { x: sd * 130 - 30, y: 136, width: 60, height: 40, rx: 12, fill: '#111' }, g)
  return g
}
// Une ambulance de face (lettrage inversé, gyrophares bleus).
function ambuFront(parent, x, y, s) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('path', { d: 'M -220 -150 L 220 -150 L 230 160 L -230 160 Z', fill: '#f6f7f9', stroke: '#0d0e12', 'stroke-width': 6 }, g)
  svg('path', { d: 'M -190 -110 L 190 -110 L 200 10 L -200 10 Z', fill: '#1a2230' }, g)
  svg('rect', { x: -230, y: 60, width: 460, height: 34, fill: '#ff8a1a' }, g)
  for (let k = 0; k < 8; k++) svg('rect', { x: -230 + k * 58, y: 60, width: 29, height: 34, fill: '#1d4fd0' }, g)
  txt(g, 'AMBULANCE', { y: 48, 'font-size': 40, fill: '#1d4fd0', transform: 'scale(-1 1)' })
  for (const sd of [-1, 1]) svg('rect', { x: sd * 160 - 34, y: 104, width: 68, height: 34, rx: 10, fill: '#fff7d0' }, g)
  const lights = [-1, 1].map((sd) => {
    const l = svg('g', {}, g)
    svg('ellipse', { cx: sd * 110, cy: -170, rx: 200, ry: 140, fill: 'url(#glowBlue)' }, l)
    svg('rect', { x: sd * 110 - 50, y: -190, width: 100, height: 40, rx: 12, fill: '#6fa8ff' }, l)
    return l
  })
  return { g, lights }
}

// Les pics de l'électrocardiogramme (abscisses), atteints aux bips de cues.js.
const ECG_X = [200, 440, 660]

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#05050a')
  const R = L.actor
  // A · Derrière le pare-brise, téléphone à la main.
  const A = svg('g', {}, R)
  const Aext = svg('g', {}, A)
  svg('rect', { x: -400, y: -400, width: W + 800, height: 1100, fill: 'url(#skyAm)' }, Aext)
  svg('circle', { cx: 780, cy: 640, r: 260, fill: 'url(#sunG)' }, Aext)
  {
    const rs = rng(4)
    for (let x = -300; x < W + 300; ) {
      const w = 40 + rs() * 90
      const h = 50 + rs() * 230
      svg('rect', { x, y: 700 - h, width: w, height: h, fill: rs() > 0.5 ? '#56607a' : '#4a5268', opacity: 0.9 }, Aext)
      if (rs() > 0.4) for (let yy = 700 - h + 20; yy < 690; yy += 34) svg('rect', { x: x + 10, y: yy, width: w - 20, height: 8, fill: '#ffd59a', opacity: 0.25 }, Aext)
      x += w + 4
    }
  }
  svg('rect', { x: -400, y: 700, width: W + 800, height: 1500, fill: '#3b3f47' }, Aext)
  svg('path', { d: 'M 480 700 L 600 700 L 1760 1920 L -680 1920 Z', fill: 'url(#asph)' }, Aext)
  // Glissières et marquages, en perspective (point de fuite 540, 700).
  const persp = (u, y) => 540 + u * 1220 * ((y - 700) / 1220)
  for (const u of [-1.02, 1.02]) svg('path', { d: `M ${persp(u * 0.98, 700)} 690 L ${persp(u, 1920)} 1880`, stroke: '#9aa0aa', 'stroke-width': 18 }, Aext)
  for (const u of [-0.34, 0.34]) {
    for (let k = 0; k < 9; k++) {
      const z0 = 1 + k * 0.9
      const y0 = 700 + 1220 / z0
      const y1 = 700 + 1220 / (z0 + 0.45)
      const w0 = 22 / z0
      svg('path', { d: `M ${persp(u, y1) - w0 * 0.6} ${y1} L ${persp(u, y1) + w0 * 0.6} ${y1} L ${persp(u, y0) + w0} ${y0} L ${persp(u, y0) - w0} ${y0} Z`, fill: '#f2f2f2', opacity: 0.9 }, Aext)
    }
  }
  // Le portique vert.
  {
    const gp = svg('g', {}, Aext)
    for (const x of [400, 680]) svg('rect', { x: x - 6, y: 520, width: 12, height: 180, fill: '#7a808a' }, gp)
    svg('rect', { x: 360, y: 500, width: 360, height: 70, rx: 8, fill: '#1f7a3a', stroke: '#ffffff', 'stroke-width': 4 }, gp)
    txt(gp, 'PORTE DE BAGNOLET ↑', { x: 540, y: 548, 'font-size': 30, fill: '#ffffff' })
  }
  // Les voitures bloquées à côté de nous.
  carRear(Aext, -40, 1170, 0.95, '#3a5a8a', 1)
  carRear(Aext, 1120, 1170, 0.95, '#8a2a2a', 2)
  // Les militants, assis en travers de la route, les mains collées au bitume.
  const sit = [
    { o: MILITANTS[0], x: 250, s: 0.37 },
    { o: LOU, x: 445, s: 0.42, lou: true },
    { o: MILITANTS[1], x: 650, s: 0.38 },
    { o: MILITANTS[2], x: 840, s: 0.37 },
  ].map((m, k) => ({ ...m, p: makePerson(Aext, m.o), k }))
  for (const m of sit) for (const sd of [-1, 1]) svg('ellipse', { cx: m.x + sd * 108 * m.s * 2.1, cy: 1188, rx: 26, ry: 9, fill: '#e8f0ff', opacity: 0.55 }, Aext)
  const LOUa = sit[1]
  // La banderole posée devant eux.
  const ban = svg('g', {}, Aext)
  svg('path', { d: 'M 190 1196 L 890 1196 L 930 1300 L 150 1300 Z', fill: '#f6f2e8', stroke: '#1a1a1a', 'stroke-width': 5 }, ban)
  txt(ban, 'LA PLANÈTE BRÛLE', { x: 540, y: 1272, 'font-size': 70, fill: '#d42a2a', 'letter-spacing': 2 })
  // L'habitacle : montants, toit, tableau de bord, volant, rétroviseur.
  const Aint = svg('g', {}, A)
  svg('rect', { x: -200, y: -200, width: W + 400, height: H + 400, fill: 'url(#glare)' }, Aint)
  svg('path', { d: 'M -200 -200 L 1280 -200 L 1280 150 Q 540 96 -200 150 Z', fill: '#14161b' }, Aint)
  svg('path', { d: 'M -200 -200 L 150 130 L -30 1700 L -200 1700 Z', fill: '#191b20' }, Aint)
  svg('path', { d: 'M 1280 -200 L 930 130 L 1110 1700 L 1280 1700 Z', fill: '#191b20' }, Aint)
  svg('path', { d: 'M 150 130 L -30 1700', stroke: '#3a3e48', 'stroke-width': 6 }, Aint)
  svg('path', { d: 'M 930 130 L 1110 1700', stroke: '#3a3e48', 'stroke-width': 6 }, Aint)
  svg('path', { d: 'M -200 1590 Q 540 1490 1280 1590 L 1280 2200 L -200 2200 Z', fill: 'url(#dash)' }, Aint)
  svg('path', { d: 'M -200 1590 Q 540 1490 1280 1590', fill: 'none', stroke: '#4a4e58', 'stroke-width': 6 }, Aint)
  const wheel = svg('g', { transform: 'translate(330 1930)' }, Aint)
  svg('circle', { r: 330, fill: 'none', stroke: '#0c0d10', 'stroke-width': 74 }, wheel)
  svg('circle', { r: 330, fill: 'none', stroke: '#2a2d34', 'stroke-width': 6, opacity: 0.8 }, wheel)
  for (const a of [-160, -20]) svg('rect', { x: 0, y: -24, width: 300, height: 48, fill: '#0c0d10', transform: `rotate(${a})` }, wheel)
  svg('circle', { r: 130, fill: '#16181d', stroke: '#2a2d34', 'stroke-width': 6 }, wheel)
  const fist = svg('g', {}, Aint)
  svg('path', { d: 'M 0 0 L 160 260', stroke: '#2a3a5a', 'stroke-width': 110, 'stroke-linecap': 'round' }, fist)
  svg('circle', { r: 78, fill: '#e2b08a' }, fist)
  svg('path', { d: 'M -50 -30 Q 0 -60 50 -30', fill: 'none', stroke: '#b07a5a', 'stroke-width': 8 }, fist)
  const mirror = svg('g', { transform: 'translate(540 300)' }, Aint)
  svg('rect', { x: -14, y: -170, width: 28, height: 110, fill: '#0c0d10' }, mirror)
  svg('rect', { x: -200, y: -80, width: 400, height: 160, rx: 36, fill: '#0c0d10' }, mirror)
  const mc = svg('clipPath', { id: 'mirrorClip' }, defs)
  svg('rect', { x: -184, y: -66, width: 368, height: 132, rx: 26 }, mc)
  const mIn = svg('g', { 'clip-path': 'url(#mirrorClip)' }, mirror)
  svg('rect', { x: -200, y: -80, width: 400, height: 90, fill: '#b9a898' }, mIn)
  svg('rect', { x: -200, y: 0, width: 400, height: 90, fill: '#55585e' }, mIn)
  carRear(mIn, -170, 10, 0.22, '#6a6a6a')
  carRear(mIn, 170, 10, 0.22, '#2a4a2a')
  const ambuM = ambuFront(mIn, 0, 4, 0.3)
  svg('rect', { x: -184, y: -66, width: 368, height: 132, rx: 26, fill: 'url(#glare)' }, mirror)
  const mirrorGlow = svg('ellipse', { cx: 0, cy: 0, rx: 320, ry: 220, fill: 'url(#glowBlue)', opacity: 0 }, mirror)
  const blueWash = svg('rect', { x: -200, y: -200, width: W + 400, height: H + 400, fill: '#2f6bff', opacity: 0 }, A)
  // L'interface de la caméra du téléphone.
  const cam = svg('g', {}, A)
  svg('circle', { cx: 80, cy: 90, r: 16, fill: '#ff3b3b' }, cam)
  txt(cam, 'REC', { x: 140, y: 103, 'font-size': 36, fill: '#ffffff' })
  const timer = txt(cam, '', { x: 960, y: 103, 'font-size': 36, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  for (const [x, y, sx, sy] of [[60, 160, 1, 1], [1020, 160, -1, 1], [60, 1860, 1, -1], [1020, 1860, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 70} L ${x} ${y} L ${x + sx * 70} ${y}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.7 }, cam)
  const camRec = cam.firstChild

  // B · Arrêt sur image : le cœur de Michel.
  const Bov = svg('g', { display: 'none' }, L.hud)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#ecgBg)' }, Bov)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#grid)' }, Bov)
  const ECG = [[-20, 960], [120, 960]]
  for (const x of ECG_X) ECG.push([x - 40, 960], [x - 20, 940], [x, 975], [x + 18, 660], [x + 40, 1120], [x + 62, 930], [x + 80, 960])
  ECG.push([1100, 960])
  const ecgGlow = svg('path', { fill: 'none', stroke: '#2bff7a', 'stroke-width': 30, opacity: 0.25, 'stroke-linejoin': 'round' }, Bov)
  const ecg = svg('path', { fill: 'none', stroke: '#7dffad', 'stroke-width': 10, 'stroke-linejoin': 'round' }, Bov)
  const ecgHead = svg('circle', { r: 18, fill: '#e8fff0' }, Bov)
  const bpmG = svg('g', { transform: 'translate(820 420)' }, Bov)
  svg('path', { d: heartD, fill: '#2bff7a', transform: 'translate(-150 -36) scale(0.9)' }, bpmG)
  const bpm = txt(bpmG, '', { x: 40, y: 0, 'font-size': 150, fill: '#2bff7a', 'font-family': 'monospace', 'font-weight': 700 })
  const redPulse = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#ff1a2a', opacity: 0 }, Bov)

  // C · Le replay, vu du ciel : le bouchon qui grossit derrière les militants.
  const Cr = svg('g', { display: 'none' }, R)
  const Ccam = svg('g', {}, Cr)
  svg('rect', { x: -3000, y: -3000, width: 7000, height: 9000, fill: '#2f4434' }, Ccam)
  svg('rect', { x: 120, y: -3000, width: 840, height: 9000, fill: '#4a4d55' }, Ccam)
  for (const x of [120, 960]) svg('rect', { x: x - 14, y: -3000, width: 28, height: 9000, fill: '#a0a6b0' }, Ccam)
  for (const x of [330, 540, 750]) for (let y = -3000; y < 6000; y += 120) svg('rect', { x: x - 5, y, width: 10, height: 60, fill: '#f0f0f0', opacity: 0.85 }, Ccam)
  for (const x of [150, 930]) svg('rect', { x: x - 4, y: -3000, width: 8, height: 9000, fill: '#f0f0f0' }, Ccam)
  // Arbres le long du périphérique.
  {
    const rt = rng(12)
    for (let y = -2400; y < 5200; y += 140) for (const sd of [-1, 1]) svg('circle', { cx: 540 + sd * (560 + rt() * 300), cy: y + rt() * 80, r: 60 + rt() * 40, fill: rt() > 0.5 ? '#3d5c3e' : '#476b45' }, Ccam)
  }
  const LANES = [225, 435, 645, 855]
  const COLORS = ['#e5484d', '#3b82f6', '#f2f2f2', '#2a2f3a', '#ffd166', '#8a96a6', '#12a150', '#7a4aa0', '#c9c4bc']
  const cars = []
  {
    const rc = rng(31)
    for (let j = 0; j < 22; j++) {
      for (let i = 0; i < 4; i++) {
        const amb = j === 7 && i === 2
        const g = svg('g', {}, Ccam)
        const y = 900 + j * 240 + rc() * 30
        if (amb) {
          svg('rect', { x: -66, y: -110, width: 132, height: 220, rx: 18, fill: '#f6f7f9', stroke: '#0d0e12', 'stroke-width': 5 }, g)
          svg('rect', { x: -66, y: 40, width: 132, height: 22, fill: '#ff8a1a' }, g)
          svg('path', { d: 'M -12 -40 L 12 -40 L 12 -12 L 40 -12 L 40 12 L 12 12 L 12 40 L -12 40 L -12 12 L -40 12 L -40 -12 L -12 -12 Z', fill: '#1d4fd0' }, g)
          g.halo = svg('circle', { r: 150, fill: 'url(#glowBlue)', opacity: 0 }, g)
          g.lights = [-1, 1].map((sd) => svg('rect', { x: sd * 30 - 22, y: -104, width: 44, height: 20, rx: 6, fill: '#6fa8ff' }, g))
        } else {
          const c = COLORS[Math.floor(rc() * COLORS.length)]
          svg('rect', { x: -58, y: -100, width: 116, height: 200, rx: 30, fill: c, stroke: '#0d0e12', 'stroke-width': 5 }, g)
          svg('rect', { x: -44, y: -66, width: 88, height: 44, rx: 12, fill: '#1a2230' }, g)
          svg('rect', { x: -44, y: 34, width: 88, height: 34, rx: 10, fill: '#1a2230' }, g)
          for (const sd of [-1, 1]) svg('rect', { x: sd * 40 - 12, y: 92, width: 24, height: 10, rx: 3, fill: '#ff3b3b' }, g)
        }
        cars.push({ g, x: LANES[i] + (rc() - 0.5) * 20, y, rot: (rc() - 0.5) * 6, t0: K.REPLAY + 0.1 + j * 0.16 + i * 0.04 + rc() * 0.08, amb })
      }
    }
  }
  const ambuCar = cars.find((c) => c.amb)
  // Les militants vus du dessus.
  const sitTop = svg('g', {}, Ccam)
  svg('rect', { x: 170, y: 700, width: 740, height: 90, rx: 8, fill: '#f6f2e8', stroke: '#1a1a1a', 'stroke-width': 4 }, sitTop)
  txt(sitTop, 'LA PLANÈTE BRÛLE', { x: 540, y: 762, 'font-size': 52, fill: '#d42a2a' })
  const heads = [[260, '#2a1a10'], [440, '#8a3a16'], [640, '#e0c080'], [820, '#111111']].map(([x, hc]) => {
    const g = svg('g', { transform: `translate(${x} 640)` }, sitTop)
    svg('ellipse', { rx: 74, ry: 46, fill: '#ff7a1a', stroke: '#0d0e12', 'stroke-width': 5 }, g)
    svg('rect', { x: -74, y: -8, width: 148, height: 12, fill: '#e8ff3a' }, g)
    svg('circle', { cy: -6, r: 38, fill: hc, stroke: '#0d0e12', 'stroke-width': 5 }, g)
    for (const sd of [-1, 1]) svg('circle', { cx: sd * 90, cy: 40, r: 20, fill: '#e2b08a', stroke: '#0d0e12', 'stroke-width': 4 }, g)
    return g
  })
  const louRing = svg('circle', { cx: 440, cy: 640, r: 110, fill: 'none', stroke: '#ffd166', 'stroke-width': 12, 'stroke-dasharray': '30 18', opacity: 0 }, sitTop)
  // Gros plan : la main collée au bitume.
  const glue = svg('g', { display: 'none' }, L.hud)
  svg('circle', { r: 330, fill: '#4a4d55', stroke: '#ffffff', 'stroke-width': 12 }, glue)
  {
    const rg = rng(5)
    for (let k = 0; k < 60; k++) svg('circle', { cx: (rg() - 0.5) * 560, cy: (rg() - 0.5) * 560, r: 3 + rg() * 6, fill: rg() > 0.5 ? '#5e626b' : '#383b42' }, glue)
  }
  svg('path', { d: 'M -150 120 C -170 0 -150 -100 -120 -150 L -80 -240 C -70 -270 -30 -260 -40 -230 L -70 -140 L -30 -270 C -20 -300 20 -295 14 -262 L -16 -140 L 30 -280 C 40 -310 80 -300 72 -270 L 30 -130 L 80 -240 C 92 -266 128 -254 118 -226 L 70 -100 L 130 -150 C 160 -170 190 -140 168 -112 L 60 20 C 30 90 0 140 -40 160 Z', fill: '#e2b08a', stroke: '#8a5a3a', 'stroke-width': 8, 'stroke-linejoin': 'round' }, glue)
  const glueBlob = svg('path', { d: 'M -200 150 C -150 100 -60 120 0 150 C 60 180 160 150 200 190 C 120 230 -120 230 -200 150 Z', fill: '#ffffff', opacity: 0.6 }, glue)
  const tube = svg('g', { transform: 'translate(170 170) rotate(-30)' }, glue)
  svg('rect', { x: -40, y: -150, width: 80, height: 220, rx: 14, fill: '#ffd23a', stroke: '#1a1a1a', 'stroke-width': 6 }, tube)
  svg('path', { d: 'M -14 -150 L -6 -200 L 6 -200 L 14 -150 Z', fill: '#e5484d', stroke: '#1a1a1a', 'stroke-width': 5 }, tube)
  txt(tube, 'GLUE', { y: -30, 'font-size': 40, fill: '#1a1a1a', transform: 'rotate(90)' })
  // Le direct des militants.
  const live = svg('g', { display: 'none' }, L.hud)
  svg('rect', { x: -230, y: -400, width: 460, height: 800, rx: 56, fill: '#111', stroke: '#3a3a3a', 'stroke-width': 8 }, live)
  const lc = svg('clipPath', { id: 'liveClip' }, defs)
  svg('rect', { x: -210, y: -380, width: 420, height: 760, rx: 40 }, lc)
  const liveIn = svg('g', { 'clip-path': 'url(#liveClip)' }, live)
  svg('rect', { x: -210, y: -380, width: 420, height: 760, fill: '#3b3f47' }, liveIn)
  const louLive = makePerson(liveIn, LOU)
  svg('rect', { x: -210, y: 160, width: 420, height: 220, fill: '#4a4d55' }, liveIn)
  svg('rect', { x: -190, y: -350, width: 120, height: 50, rx: 12, fill: '#ff2d55' }, live)
  txt(live, 'LIVE', { x: -130, y: -312, 'font-size': 32, fill: '#ffffff' })
  svg('rect', { x: -60, y: -350, width: 200, height: 50, rx: 12, fill: '#000', opacity: 0.5 }, live)
  const liveViewers = txt(live, '', { x: 40, y: -312, 'font-size': 32, fill: '#ffffff' })
  const liveHearts = Array.from({ length: 10 }, (_, k) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff6b8a', '#ffd166'][k % 3], opacity: 0 }, live), ph: k / 10, dx: ((k * 37) % 9) - 4 }))
  const liveComments = ['ON LÂCHE RIEN 🔥', 'BRAVO LOU', 'BANDE DE CONNARDS', 'ET L’AMBULANCE ???', 'COURAGE'].map((s, k) => {
    const g = svg('g', { opacity: 0 }, live)
    const w = 30 + s.length * 19
    svg('rect', { x: -195, y: -32, width: w, height: 46, rx: 22, fill: '#000', opacity: 0.55 }, g)
    txt(g, s.replace(/🔥/gu, ''), { x: -195 + w / 2, y: 0, 'font-size': 28, fill: '#ffffff' })
    return { g, d: k * 0.28 }
  })

  // D · Dans l'ambulance : le moniteur cardiaque.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#ambuWall)' }, Dcam)
  for (let k = 0; k < 4; k++) {
    svg('rect', { x: -60 + k * 300, y: 120, width: 270, height: 200, rx: 14, fill: '#f6f8fb', stroke: '#9aa6b8', 'stroke-width': 5 }, Dcam)
    svg('rect', { x: 50 + k * 300, y: 290, width: 50, height: 10, rx: 4, fill: '#7a8698' }, Dcam)
  }
  const rearWin = svg('g', {}, Dcam)
  for (const x of [-40, 150]) svg('rect', { x, y: 760, width: 150, height: 300, rx: 16, fill: '#1a2230', stroke: '#7a8698', 'stroke-width': 8 }, rearWin)
  const strobe = svg('ellipse', { cx: 80, cy: 900, rx: 420, ry: 380, fill: 'url(#glowBlue)', opacity: 0 }, Dcam)
  svg('rect', { x: -400, y: 1500, width: W + 800, height: 800, fill: '#8a96a6' }, Dcam)
  svg('path', { d: 'M -400 1500 L 1480 1500', stroke: '#6a7486', 'stroke-width': 10 }, Dcam)
  // Le brancard et Michel.
  svg('rect', { x: 80, y: 1360, width: 900, height: 46, rx: 16, fill: '#c9d0da', stroke: '#5a6474', 'stroke-width': 6 }, Dcam)
  for (const x of [160, 900]) svg('rect', { x: x - 10, y: 1400, width: 20, height: 120, fill: '#5a6474' }, Dcam)
  svg('rect', { x: 100, y: 1300, width: 860, height: 70, rx: 30, fill: '#f2f5fa', stroke: '#9aa6b8', 'stroke-width': 5 }, Dcam)
  svg('ellipse', { cx: 230, cy: 1290, rx: 120, ry: 36, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 4 }, Dcam)
  const head = svg('g', { transform: 'translate(240 1200)' }, Dcam)
  svg('circle', { r: 92, fill: '#e9b48f', stroke: '#8a5a3a', 'stroke-width': 5 }, head)
  svg('path', { d: 'M -92 -10 C -100 -90 -20 -110 40 -100 C 90 -90 100 -40 96 -10 C 70 -60 -40 -70 -92 -10 Z', fill: '#c9c4bc' }, head)
  for (const x of [-30, 30]) svg('path', { d: `M ${x - 18} -10 Q ${x} 2 ${x + 18} -10`, fill: 'none', stroke: '#3b2a1a', 'stroke-width': 7, 'stroke-linecap': 'round' }, head)
  svg('path', { d: 'M -50 20 Q 0 0 50 20 L 40 66 Q 0 84 -40 66 Z', fill: '#bfe6d0', opacity: 0.8, stroke: '#7ab896', 'stroke-width': 4 }, head)
  svg('path', { d: 'M 50 40 Q 150 60 200 140', fill: 'none', stroke: '#7ab896', 'stroke-width': 10 }, head)
  const chest = svg('path', { d: 'M 330 1300 C 340 1180 460 1150 600 1170 C 760 1190 900 1220 940 1300 Z', fill: '#3b82c4', stroke: '#1d4f80', 'stroke-width': 6 }, Dcam)
  // Le moniteur.
  const mon = svg('g', { transform: 'translate(640 600)' }, Dcam)
  svg('rect', { x: -330, y: -230, width: 660, height: 460, rx: 30, fill: '#2a2f3a', stroke: '#141820', 'stroke-width': 10 }, mon)
  svg('rect', { x: -300, y: -200, width: 600, height: 400, rx: 14, fill: '#04120a' }, mon)
  svg('rect', { x: -300, y: -200, width: 600, height: 400, fill: 'url(#grid)' }, mon)
  const monTrace = svg('path', { fill: 'none', stroke: '#7dffad', 'stroke-width': 7, 'stroke-linejoin': 'round' }, mon)
  const monBpm = txt(mon, '', { x: 220, y: -120, 'font-size': 76, fill: '#2bff7a', 'font-family': 'monospace', 'font-weight': 700 })
  txt(mon, 'FC', { x: 220, y: -170, 'font-size': 30, fill: '#2bff7a' })
  const alarm = svg('circle', { cx: -250, cy: -160, r: 22, fill: '#ff2a2a', opacity: 0 }, mon)
  const dDark = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#05070f', opacity: 0 }, D)
  const dRed = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ff1a2a', opacity: 0 }, D)

  // E · Lou, photo d'identité judiciaire ; le marteau tombe.
  const Ev = svg('g', { display: 'none' }, R)
  const Ecam = svg('g', {}, Ev)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#mugBg)' }, Ecam)
  for (let k = 0; k < 9; k++) {
    const y = 380 + k * 110
    svg('path', { d: `M -100 ${y} L 1180 ${y}`, stroke: '#ffffff', 'stroke-width': k % 2 ? 3 : 6, opacity: 0.35 }, Ecam)
    txt(Ecam, `${190 - k * 10}`, { x: 70, y: y - 12, 'font-size': 34, fill: '#ffffff', opacity: 0.5 })
  }
  const louMug = makePerson(Ecam, LOU)
  const plate = svg('g', { transform: 'translate(540 1250)' }, Ecam)
  svg('rect', { x: -300, y: -90, width: 600, height: 180, rx: 12, fill: '#10121a', stroke: '#ffffff', 'stroke-width': 6 }, plate)
  txt(plate, 'LOU M. · 23 ANS', { y: -12, 'font-size': 60, fill: '#ffffff' })
  txt(plate, 'BLOCAGE · PÉRIPHÉRIQUE', { y: 54, 'font-size': 38, fill: '#ffd166' })
  const mugFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  // Rembobinage : bandes blanches.
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { ECG, A, Aext, Aint, sit, LOUa, wheel, fist, mirror, ambuM, mirrorGlow, blueWash, cam, camRec, timer, Bov, ecg, ecgGlow, ecgHead, bpm, redPulse, Cr, Ccam, cars, ambuCar, heads, louRing, glue, glueBlob, live, louLive, liveViewers, liveHearts, liveComments, D, Dcam, strobe, chest, monTrace, monBpm, alarm, dDark, dRed, Ev, Ecam, louMug, mugFlash, gavel, rwBands }
})

const COLORS2 = ['#e5484d', '#3b82f6', '#f2f2f2', '#2a2f3a', '#ffd166', '#8a96a6', '#12a150']

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
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: k % 2 ? '#ff7a1a' : '#fe2c55', opacity: 0.14, transform: `rotate(${k * 30})` }, rays)
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
  const miniCar = (g, x, y, c, s = 1) => {
    const m = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, g)
    svg('rect', { x: -40, y: -64, width: 80, height: 128, rx: 20, fill: c, stroke: '#0d0e12', 'stroke-width': 4 }, m)
    svg('rect', { x: -30, y: -40, width: 60, height: 28, rx: 8, fill: '#1a2230' }, m)
    return m
  }
  // 04 : le bouchon fabriqué, l'ambulance au milieu.
  const jam = prop((g) => {
    panel(g, 780, 420)
    svg('rect', { x: -360, y: -180, width: 720, height: 360, rx: 10, fill: '#4a4d55' }, g)
    for (const x of [-120, 120]) for (let y = -170; y < 180; y += 70) svg('rect', { x: x - 4, y, width: 8, height: 36, fill: '#f0f0f0', opacity: 0.8 }, g)
    const rc = rng(3)
    for (const x of [-240, 0, 240]) for (const y of [-110, 40, 170]) if (!(x === 0 && y === 40)) miniCar(g, x + (rc() - 0.5) * 30, y, COLORS2[Math.floor(rc() * COLORS2.length)], 0.8)
    const a = svg('g', { transform: 'translate(0 40)' }, g)
    svg('circle', { r: 110, fill: 'url(#glowBlue)' }, a)
    svg('rect', { x: -40, y: -66, width: 80, height: 132, rx: 12, fill: '#f6f7f9', stroke: '#0d0e12', 'stroke-width': 4 }, a)
    svg('path', { d: 'M -8 -26 L 8 -26 L 8 -8 L 26 -8 L 26 8 L 8 8 L 8 26 L -8 26 L -8 8 L -26 8 L -26 -8 L -8 -8 Z', fill: '#1d4fd0' }, a)
    svg('circle', { r: 120, fill: 'none', stroke: '#e5484d', 'stroke-width': 10, 'stroke-dasharray': '24 14' }, a)
  })
  // 05 : 8 h 00, comme tous les matins.
  const clock8 = prop((g) => {
    panel(g, 620, 320, '#ff7a1a')
    txt(g, '08:00', { y: 60, 'font-size': 190, fill: '#ff3b3b', 'font-family': 'monospace', 'font-weight': 700 })
    txt(g, 'TOUS LES MATINS', { y: 128, 'font-size': 38, fill: '#ffd166' })
  })
  // 07 : la canicule.
  const thermo = prop((g) => {
    panel(g, 620, 420, '#ff7a1a')
    svg('rect', { x: -190, y: -170, width: 70, height: 280, rx: 35, fill: '#f6f2e8', stroke: '#1a1a1a', 'stroke-width': 6 }, g)
    g.level = svg('rect', { x: -174, y: -150, width: 38, height: 260, rx: 19, fill: '#e5484d' }, g)
    svg('circle', { cx: -155, cy: 130, r: 62, fill: '#e5484d', stroke: '#1a1a1a', 'stroke-width': 6 }, g)
    g.deg = txt(g, '', { x: 100, y: 60, 'font-size': 170, fill: '#ff7a1a' })
  })
  // 10 : la voie laissée libre, fermée par la police.
  const lanes = prop((g) => {
    panel(g, 760, 460, '#12a150')
    svg('rect', { x: -330, y: -200, width: 660, height: 400, rx: 10, fill: '#4a4d55' }, g)
    for (const x of [-110, 110]) for (let y = -190; y < 200; y += 70) svg('rect', { x: x - 4, y, width: 8, height: 36, fill: '#f0f0f0', opacity: 0.8 }, g)
    for (const x of [-260, -160, -40]) {
      svg('ellipse', { cx: x, cy: 0, rx: 46, ry: 30, fill: '#ff7a1a', stroke: '#0d0e12', 'stroke-width': 4 }, g)
      svg('circle', { cx: x, cy: -4, r: 22, fill: '#2a1a10', stroke: '#0d0e12', 'stroke-width': 4 }, g)
    }
    g.arrow = svg('path', { d: 'M 220 170 L 220 -60 L 180 -60 L 240 -170 L 300 -60 L 260 -60 L 260 170 Z', fill: '#12e070', opacity: 0.95 }, g)
    g.police = svg('g', {}, g)
    svg('rect', { x: -44, y: -70, width: 88, height: 140, rx: 20, fill: '#f6f7f9', stroke: '#0d0e12', 'stroke-width': 4 }, g.police)
    svg('rect', { x: -44, y: -6, width: 88, height: 22, fill: '#1d3fa0' }, g.police)
    g.siren = [-1, 1].map((sd) => svg('rect', { x: sd * 18 - 14, y: -50, width: 28, height: 14, rx: 4, fill: sd < 0 ? '#3d7bff' : '#ff3b3b' }, g.police))
    g.cross = svg('path', { d: 'M 170 -120 L 310 20 M 310 -120 L 170 20', stroke: '#ff3b3b', 'stroke-width': 26, 'stroke-linecap': 'round' }, g)
  })
  // 13 : l'hôpital.
  const hosp = prop((g) => {
    panel(g, 420, 420, '#3b82f6')
    svg('rect', { x: -150, y: -150, width: 300, height: 300, rx: 40, fill: '#1d4fd0' }, g)
    txt(g, 'H', { y: 92, 'font-size': 260, fill: '#ffffff' })
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, jam, clock8, thermo, lanes, hosp }
})

// ------------------------------------------------- 3 · Le vote : Lou face au portrait de Michel
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const lou = makePerson(L.actor, LOU)
  const frame = svg('g', { transform: 'translate(810 1390)' }, L.actor)
  svg('rect', { x: -200, y: -260, width: 400, height: 500, rx: 10, fill: '#5a3a22', stroke: '#2a1a10', 'stroke-width': 10 }, frame)
  svg('rect', { x: -170, y: -230, width: 340, height: 440, fill: '#d8cdb8' }, frame)
  const fc = svg('clipPath', { id: 'frameClip' }, defs)
  svg('rect', { x: -170, y: -230, width: 340, height: 440 }, fc)
  const fin = svg('g', { 'clip-path': 'url(#frameClip)' }, frame)
  const michel = makePerson(fin, MICHEL)
  svg('path', { d: 'M 90 -260 L 200 -150 L 200 -100 L 40 -260 Z', fill: '#0a0a0a' }, frame)
  txt(frame, 'MICHEL · 64 ANS', { y: 300, 'font-size': 44, fill: '#ffffff' })
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { lou, michel }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ff7a1a' }, fxTop), d: (x + y) * 0.011 })
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
// Les coups de klaxon de l'automobiliste (le poing sur le volant).
const HONKS = [0.15, 0.55, 0.8, Wd('01', 'bougez') + 0.05, Wd('01', 'malades') + 0.1]

// Le hook.
fs(tag('PÉRIPHÉRIQUE · BLOQUÉ', 'pill red', { t0: 0.1, t1: K.MIRROR - 0.05, y: 520, rot: -2 }), 50)
tag('◀◀ 2 HEURES PLUS TÔT', 'pill', { t0: K.REPLAY, t1: Wd('02', 'lou') - 0.1, y: 300, rot: -2 })
fs(tag('LOU · 23 ANS · MILITANTE', 'pill yellow', { t0: Wd('02', 'lou') - 0.1, t1: Wd('02', 'se') - 0.1, y: 300, rot: 2 }), 48)
fs(tag('MAINS COLLÉES', 'stamp', { t0: Wd('02', 'collent') - 0.08, t1: Wd('02', 'deux') - 0.12, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 96)
counterTag(Wd('02', 'deux') - 0.1, Wd('02', 'diffuse') - 0.1, 120, 'DE BLOCAGE', { y: 1000, dur: 0.9, fmt: (v) => `${Math.floor(v / 60)} H ${pad(v % 60)}` })
fs(tag('EN DIRECT', 'stamp', { t0: Wd('02', 'diffuse') - 0.08, t1: E('02') + 0.3, y: 300, rot: -6, from: 2.8, dur: 0.18 }), 110)
fs(tag('MICHEL · 64 ANS', 'pill yellow', { t0: Wd('03', 'michel') - 0.1, t1: Wd('03', 'fait') - 0.05, y: 1000, rot: 2 }), 52)
fs(tag('INFARCTUS', 'slam red', { t0: K.CRISIS, t1: Wd('03', 'il') - 0.05, y: 1220, rot: -4, from: 2.6, dur: 0.15 }), 130)
counterTag(Wd('03', 'quarante') - 0.1, K.DEAD - 0.05, 40, 'MIN DE RETARD', { y: 280, dur: 0.6, fmt: (v) => `+${v}` })
fs(tag('JUGÉE.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('UN HOMME EST MORT.', 'slam white', { t0: Wd('04', 'homme') - 0.25, t1: Wd('04', 'dans') - 0.05, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 96)
fs(tag('« FABRIQUÉ »', 'slam yellow', { t0: Wd('04', 'fabrique') - 0.15, t1: E('04') + 0.15, y: 300, rot: -4, from: 2.6, dur: 0.15 }), 120)
tag('TOUS LES MATINS', 'pill', { t0: Wd('05', 'tous') - 0.1, t1: Wd('05', 'personne') - 0.15, y: 300, rot: -2 })
fs(tag('VOULU.', 'stamp', { t0: Wd('06', 'sien') - 0.15, t1: Wd('06', 'filme') - 0.12, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 120)
fs(tag('FILMÉ. DIFFUSÉ.', 'slam white', { t0: Wd('06', 'filme') - 0.1, t1: Wd('06', 'avec') - 0.12, y: 330, rot: -4, from: 2.6, dur: 0.15 }), 104)
fs(tag('#BLOQUONSTOUT', 'slam yellow', { t0: Wd('06', 'avec') - 0.1, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 110)
fs(tag('DES MILLIERS DE MORTS', 'pill red', { t0: Wd('07', 'milliers') - 0.15, t1: Wd('07', 'ces') - 0.12, y: 300, rot: -2 }), 54)
fs(tag('« PERSONNE NE LES JUGE. »', 'slam red', { t0: Wd('07', 'ces') - 0.1, t1: E('07') + 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 64)
tag('TOUJOURS LA MÊME RENGAINE', 'pill', { t0: S('08') - 0.05, t1: Wd('08', 'fin') - 0.28, y: 300, rot: -2 })
fs(tag('« LA FIN DU MONDE EXCUSE TOUT. »', 'slam yellow', { t0: Wd('08', 'fin') - 0.25, t1: E('08') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 54)
fs(tag('MILITANTE OU COUPABLE ?', 'big white', { t0: S('09') - 0.05, t1: E('09') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 80)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('09', 'like') - 0.1, t1: E('09') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
fs(tag('VOIE LIBRE ✓', 'pill green', { t0: Wd('10', 'voie') - 0.1, t1: Wd('10', 'police') - 0.12, y: 300, rot: -2 }), 58)
fs(tag('FERMÉE PAR LA POLICE', 'pill red', { t0: Wd('10', 'police') - 0.1, t1: E('10') + 0.15, y: 300, rot: 2 }), 54)
fs(tag('À L’ARRÊT', 'stamp', { t0: Wd('11', 'larret') - 0.1, t1: Wd('11', 'pendant') - 0.12, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 110)
counterTag(Wd('11', 'pendant') - 0.1, E('11') + 0.1, 40, 'MINUTES', { y: 330, dur: 0.5 })
tag('TOUS LES JOURS', 'pill', { t0: Wd('12', 'tous') - 0.1, t1: Wd('12', 'elle') - 0.1, y: 300, rot: -2 })
fs(tag('ELLE A ESSAYÉ.', 'slam yellow', { t0: Wd('12', 'essaye') - 0.15, t1: E('12') + 0.15, y: 430, rot: -4, from: 2.8, dur: 0.18 }), 120)
fs(tag('MICHEL', 'pill yellow', { t0: S('13') - 0.05, t1: Wd('13', 'il') - 0.12, y: 300, rot: -2 }), 54)
fs(tag('« ARRIVER À L’HÔPITAL. »', 'slam white', { t0: Wd('13', 'arriver') - 0.15, t1: E('13') + 0.3, y: 330, rot: -3, from: 2.4, dur: 0.2 }), 74)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('14') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('14', 'ecrisle') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('14', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', automobiliste: 'L’AUTOMOBILISTE, QUI FILME' }

// Gros sous-titres animés (pas sur l'appel au like : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['09-like'].includes(l.id))) {
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
  ...HONKS.map((h) => [h, 6]),
  [K.MIRROR, 8],
  [K.BACK, 8],
  [K.BURST, 30],
  [K.FLAT, 14],
  [K.REPLAY, 10],
  [Wd('02', 'collent') - 0.08, 12],
  [Wd('02', 'diffuse') - 0.08, 12],
  [K.CRISIS, 18],
  [K.DEAD, 12],
  [K.TODAY, 14],
  [K.GAVEL + 0.1, 24],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'homme') - 0.25, 10],
  [Wd('06', 'sien') - 0.15, 10],
  [Wd('11', 'larret') - 0.1, 10],
  [Wd('12', 'essaye') - 0.15, 10],
  [C.impact, 12],
  [Wd('14', 'jure') - 0.15, 8],
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

// Les militants assis : ils scandent, Lou fixe la caméra ; elle lève les yeux quand il fonce sur elle.
function sitPose(t, tt) {
  const lunge = clamp((tt - K.LUNGE) / 0.4)
  for (const m of HOOK.sit) {
    const chant = m.lou ? 0 : Math.max(0, Math.sin(tt * 7 + m.k * 1.3)) * 0.7
    m.p.update(t, {
      x: m.x + 4 * Math.sin(tt * 1.7 + m.k),
      y: 1040 - (m.lou ? 6 : 0),
      scale: m.s,
      mouth: chant,
      brows: m.lou ? (lunge > 0.3 ? 'surprised' : 'determined') : 'determined',
      look: m.lou ? [0.15, lunge > 0.3 ? -0.6 : -0.1] : [0.3 * Math.sin(m.k * 2), -0.1],
      armR: [0.62, 0.12],
      armL: [0.62, 0.12],
      headTilt: m.lou ? -0.1 + 0.15 * lunge : 0.05 * Math.sin(tt * 3 + m.k),
      seed: m.k * 1.3,
    })
  }
}
// Le tracé du moniteur : battements, fibrillation, puis plat.
function monitorPath(t) {
  const crisis = t >= K.CRISIS && t < K.DEAD
  const dead = t >= K.DEAD
  let d = ''
  for (let i = 0; i <= 120; i++) {
    const x = -300 + i * 5
    const tt = t - (120 - i) * 0.012
    let y = 40
    if (tt >= K.DEAD) y = 40
    else if (tt >= K.CRISIS) y = 40 + 70 * Math.sin(tt * 38) * Math.sin(tt * 11 + 1) + 30 * Math.sin(tt * 71)
    else {
      const ph = (tt * 1.6) % 1
      y = ph < 0.04 ? 40 - 220 * Math.sin((ph / 0.04) * Math.PI) : ph < 0.07 ? 40 + 80 * Math.sin(((ph - 0.04) / 0.03) * Math.PI) : 40 - 16 * Math.exp(-(((ph - 0.3) / 0.06) ** 2))
    }
    d += `${i ? 'L' : 'M'} ${x} ${y.toFixed(1)} `
  }
  return { d, crisis, dead }
}

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const phase = t < K.BURST ? 'A' : t < K.REWIND ? 'B' : t < K.AMBU ? 'C' : t < K.TODAY ? 'D' : 'E'
    show(HOOK.A, phase === 'A' || phase === 'B')
    show(HOOK.Bov, phase === 'B')
    show(HOOK.Cr, phase === 'C')
    show(HOOK.D, phase === 'D')
    show(HOOK.Ev, phase === 'E')
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A' || phase === 'B') {
      // Le téléphone de l'automobiliste : regard dans le rétro, retour sur Lou, puis il sort et fonce.
      const tt = Math.min(t, K.BURST)
      if (phase === 'B') HOOK.A.setAttribute('filter', 'url(#desat)')
      else HOOK.A.removeAttribute('filter')
      sitPose(t, tt)
      const mir = win(tt, K.MIRROR, K.BACK, 0.16)
      const onLou = ease.io2(clamp((tt - K.BACK) / 0.18))
      const lu = ease.in2(clamp((tt - K.LUNGE) / (K.BURST - K.LUNGE)))
      const run = lu > 0 ? 22 * Math.sin(tt * 17) * (0.3 + lu) : 0
      const hand = 6 * Math.sin(tt * 7) + 3 * Math.sin(tt * 19)
      let cx = lerp(540, 460, onLou)
      let cy = lerp(1080, 1050, onLou)
      let z = lerp(1.0 + 0.02 * tt, 1.22, onLou)
      cx = lerp(cx, 540, mir)
      cy = lerp(cy, 300, mir)
      z = lerp(z, 2.55, mir)
      cx = lerp(cx, 445, lu)
      cy = lerp(cy, 985, lu)
      z = lerp(z, 3.3, lu)
      const rot = 1.5 * Math.sin(tt * 2) + lu * 6 * Math.sin(tt * 9)
      HOOK.Aext.setAttribute('transform', SHOT(cx, cy, z, rot, hand + hx * 0.8, 4 * Math.sin(tt * 11) + hy * 0.8 + run))
      // L'habitacle part sur le côté quand il ouvre la portière.
      const out = ease.in3(clamp((tt - K.LUNGE) / 0.45))
      HOOK.Aint.setAttribute('transform', `${SHOT(cx, cy, z, rot, hand + hx, 4 * Math.sin(tt * 11) + hy)} translate(${540 - 1400 * out} 960) scale(${1 + 0.6 * out}) translate(-540 -960)`)
      HOOK.Aint.setAttribute('opacity', (1 - out).toFixed(2))
      const s = siren(tt)
      HOOK.ambuM.lights.forEach((l, i) => l.setAttribute('opacity', (i ? s : 1 - s) * 0.9 + 0.1))
      HOOK.mirrorGlow.setAttribute('opacity', (0.5 * s).toFixed(2))
      HOOK.blueWash.setAttribute('opacity', (0.07 * s * (1 - out) + 0.1 * mir * s).toFixed(3))
      // Le poing sur le klaxon.
      const hk = HONKS.map((h) => clamp(1 - Math.abs(tt - h) / 0.12)).reduce((a, b) => Math.max(a, b), 0)
      HOOK.fist.setAttribute('transform', `translate(${lerp(640, 360, hk)} ${lerp(2150, 1880, hk)}) rotate(${-30 + 20 * hk})`)
      HOOK.wheel.setAttribute('transform', `translate(330 ${1930 + 14 * hk}) rotate(${3 * Math.sin(tt * 3)})`)
      HOOK.timer.textContent = `08:${pad(47)}:${pad(12 + tt)}`
      HOOK.camRec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.25)
      show(HOOK.cam, phase === 'A')
      streaks.setAttribute('opacity', Math.max(clamp(1 - Math.abs(tt - K.MIRROR - 0.08) / 0.1), clamp(1 - Math.abs(tt - K.BACK - 0.09) / 0.1), lu * 0.8).toFixed(2))
    }
    if (phase === 'B') {
      // L'électrocardiogramme traverse l'écran, puis la ligne devient plate.
      const xs = [K.BURST, ...K.BEEPS, K.FLAT, K.REWIND]
      const xv = [-20, ...ECG_X.map((x) => x + 18), 800, 1100]
      let i = 0
      while (i < xs.length - 2 && t >= xs[i + 1]) i++
      const hxp = lerp(xv[i], xv[i + 1], clamp((t - xs[i]) / (xs[i + 1] - xs[i])))
      const pts = HOOK.ECG.filter(([x]) => x < hxp)
      const nxt = HOOK.ECG.find(([x]) => x >= hxp) ?? HOOK.ECG.at(-1)
      const lst = pts.at(-1) ?? HOOK.ECG[0]
      const hy2 = lerp(lst[1], nxt[1], clamp((hxp - lst[0]) / Math.max(1, nxt[0] - lst[0])))
      const dd = `${pts.map(([x, y], k) => `${k ? 'L' : 'M'} ${x} ${y}`).join(' ')} L ${hxp.toFixed(1)} ${hy2.toFixed(1)}`
      HOOK.ecg.setAttribute('d', dd)
      HOOK.ecgGlow.setAttribute('d', dd)
      HOOK.ecgHead.setAttribute('cx', hxp.toFixed(1))
      HOOK.ecgHead.setAttribute('cy', hy2.toFixed(1))
      const flat = t >= K.FLAT
      HOOK.bpm.textContent = flat ? '0' : String(Math.round(lerp(148, 40, clamp((t - K.BURST) / (K.FLAT - K.BURST)))))
      HOOK.bpm.setAttribute('fill', flat ? '#ff3b3b' : '#2bff7a')
      HOOK.redPulse.setAttribute('opacity', flat ? (0.28 * (0.5 + 0.5 * Math.cos((t - K.FLAT) * 14))).toFixed(2) : 0)
    }
    if (phase === 'C') {
      // Vu du ciel : rembobinage, puis le bouchon qui s'allonge derrière les militants.
      const rw = t < K.REPLAY
      const k = Math.max(0, t - K.REPLAY)
      const out = ease.io2(clamp((t - (Wd('02', 'deux') - 0.3)) / 1.2))
      const glueIn = win(t, Wd('02', 'collent') - 0.15, Wd('02', 'deux') - 0.2, 0.2)
      const z = lerp(1.55 + 0.03 * k, 0.5, out) * (1 + 0.6 * glueIn)
      const cy = lerp(780 + 30 * k, 1900, out)
      HOOK.Ccam.setAttribute('transform', SHOT(lerp(540, 440, glueIn), lerp(cy, 650, glueIn), z, lerp(-8, 0, clamp(k / 2)) + (rw ? 3 * Math.sin(t * 40) : 0), (rw ? 30 * Math.sin(t * 70) : 0) + hx, hy))
      HOOK.cars.forEach((c) => {
        const v = ease.out3(clamp((t - c.t0) / 0.35))
        c.g.setAttribute('display', v > 0 ? 'inline' : 'none')
        if (v > 0) c.g.setAttribute('transform', `translate(${c.x} ${c.y + 700 * (1 - v)}) rotate(${c.rot})`)
      })
      const a = HOOK.ambuCar.g
      const s = siren(t)
      a.lights.forEach((l, i) => l.setAttribute('opacity', (i ? s : 1 - s) * 0.9 + 0.1))
      a.halo.setAttribute('opacity', (0.4 + 0.5 * s).toFixed(2))
      HOOK.heads.forEach((h, i) => h.setAttribute('transform', `translate(${[260, 440, 640, 820][i]} ${640 + 3 * Math.sin(t * 6 + i)})`))
      HOOK.louRing.setAttribute('opacity', win(t, Wd('02', 'lou') - 0.15, Wd('02', 'se') - 0.1).toFixed(2))
      HOOK.louRing.setAttribute('transform', `rotate(${(t * 40) % 360} 440 640)`)
      // Gros plan sur la main collée ; le direct.
      const gv = popS(t, Wd('02', 'collent') - 0.15, Wd('02', 'deux') - 0.2, 0.3)
      show(HOOK.glue, gv > 0.01)
      if (gv > 0.01) place(HOOK.glue, 540, 880, gv * 0.95, -4)
      HOOK.glueBlob.setAttribute('opacity', (0.3 + 0.4 * prog(t, Wd('02', 'collent'), 0.5, ease.out3)).toFixed(2))
      const lv = popS(t, Wd('02', 'diffuse') - 0.15, E('02') + 0.2, 0.35)
      show(HOOK.live, lv > 0.01)
      if (lv > 0.01) {
        place(HOOK.live, 540, 900 + 6 * Math.sin(t * 2), lv * 0.95, 4)
        HOOK.louLive.update(t, { x: 0, y: 40, scale: 0.6, mouth: Math.max(0, Math.sin(t * 9)) * 0.8, brows: 'determined', look: [0, 0], armR: [0.9, 1.2], armL: [0.15, 0.4], point: true, seed: 1.1 })
        const lk = t - (Wd('02', 'diffuse') - 0.15)
        HOOK.liveViewers.textContent = `👁 ${fr(12000 * ease.out3(clamp(lk / 0.8)))}`
        HOOK.liveHearts.forEach((h) => {
          const v = (lk * 0.9 + h.ph) % 1
          h.el.setAttribute('opacity', (0.9 * (1 - v)).toFixed(2))
          h.el.setAttribute('transform', `translate(${160 + h.dx * 8 + 16 * Math.sin(v * 8 + h.ph * 6)} ${300 - 420 * v}) scale(${0.3 + 0.25 * v})`)
        })
        HOOK.liveComments.forEach((c, i) => {
          const v = (lk - c.d) / 1.1
          const on = v > 0 && v < 1
          c.g.setAttribute('opacity', on ? Math.min(1, (1 - v) * 3).toFixed(2) : 0)
          if (on) c.g.setAttribute('transform', `translate(0 ${300 - 260 * v - (i % 2) * 20})`)
        })
      }
      HOOK.rwBands.forEach((b, i) => {
        const r = rng(Math.floor(t * 30) + i)
        b.setAttribute('y', r() * H)
        b.setAttribute('height', 10 + r() * 40)
        b.setAttribute('opacity', rw ? 0.3 : 0)
      })
    } else {
      HOOK.rwBands.forEach((b) => b.setAttribute('opacity', 0))
      show(HOOK.live, false)
      show(HOOK.glue, false)
    }
    if (phase === 'D') {
      // L'ambulance : le moniteur s'affole, puis plus rien.
      const k = t - K.AMBU
      const { d, crisis, dead } = monitorPath(t)
      HOOK.monTrace.setAttribute('d', d)
      HOOK.monTrace.setAttribute('stroke', dead ? '#ff6b5e' : '#7dffad')
      HOOK.monBpm.textContent = dead ? '0' : crisis ? String(160 + Math.floor((t * 37) % 40)) : '96'
      HOOK.monBpm.setAttribute('fill', dead || crisis ? '#ff3b3b' : '#2bff7a')
      HOOK.alarm.setAttribute('opacity', crisis || dead ? (Math.floor(t * 6) % 2 ? 1 : 0.2) : 0)
      const s = siren(t)
      HOOK.strobe.setAttribute('opacity', dead ? 0 : (0.6 * s).toFixed(2))
      HOOK.dRed.setAttribute('opacity', crisis ? (0.12 * (Math.floor(t * 6) % 2)).toFixed(2) : 0)
      HOOK.dDark.setAttribute('opacity', dead ? (0.55 * ease.out3(clamp((t - K.DEAD) / 0.6))).toFixed(2) : 0)
      HOOK.chest.setAttribute('transform', `translate(0 ${dead ? 0 : -6 * Math.max(0, Math.sin(t * (crisis ? 9 : 3)))})`)
      const focus = ease.io2(clamp((t - K.CRISIS) / 0.4))
      const z = lerp(1.0 + 0.03 * k, 1.35, focus) + (dead ? 0.05 * (t - K.DEAD) : 0)
      HOOK.Dcam.setAttribute('transform', SHOT(lerp(560, 640, focus), lerp(1000, 760, focus), z, crisis ? 1.5 * Math.sin(t * 13) : 0, hx + (crisis ? 6 * Math.sin(t * 31) : 0), hy))
    }
    if (phase === 'E') {
      // La photo d'identité judiciaire (flash), puis le marteau.
      const k = t - K.TODAY
      HOOK.louMug.update(t, { x: 540, y: 1060, scale: 1.2, mouth: 0, brows: 'determined', look: [0, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 1.1, headTilt: 0.04 })
      HOOK.mugFlash.setAttribute('opacity', (0.95 * Math.exp(-k * 7)).toFixed(3))
      const g = prog(t, K.GAVEL - 0.12, 0.12, ease.in3)
      const after = t - K.GAVEL
      show(HOOK.gavel, t > K.GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(1000, 760, g)} ${lerp(200, 640, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
      HOOK.Ecam.setAttribute('transform', SHOT(540, 980, 1.0 + 0.04 * k, 0, hx, hy))
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '09'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '13'
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
    prop(TRIB.jam, Wd('04', 'bouchon') - 0.2, Wd('04', 'fabrique') - 0.2, 540, 640, 0.85)
    prop(TRIB.clock8, Wd('05', 'personne') - 0.15, E('05') + 0.1, 540, 640, 0.85)
    if (prop(TRIB.thermo, Wd('07', 'canicule') - 0.2, Wd('07', 'ces') - 0.15, 540, 660, 0.85) > 0) {
      const v = prog(t, Wd('07', 'canicule') - 0.1, 0.8, ease.out3)
      TRIB.thermo.level.setAttribute('y', (110 - 260 * v).toFixed(0))
      TRIB.thermo.level.setAttribute('height', (260 * v).toFixed(0))
      TRIB.thermo.deg.textContent = `${Math.round(lerp(20, 44, v))}°`
    }
    if (prop(TRIB.lanes, Wd('10', 'voie') - 0.2, E('10') + 0.1, 540, 680, 0.85) > 0) {
      const pv = ease.out3(clamp((t - (Wd('10', 'police') - 0.2)) / 0.45))
      TRIB.lanes.police.setAttribute('transform', `translate(240 ${lerp(320, 60, pv)})`)
      TRIB.lanes.police.setAttribute('opacity', pv > 0 ? 1 : 0)
      TRIB.lanes.siren.forEach((s, i) => s.setAttribute('opacity', (Math.floor(t * 6) + i) % 2 ? 1 : 0.3))
      TRIB.lanes.cross.setAttribute('opacity', prog(t, Wd('10', 'fermee') - 0.1, 0.15, ease.out3).toFixed(2))
      TRIB.lanes.arrow.setAttribute('opacity', (0.95 - 0.6 * pv).toFixed(2))
    }
    prop(TRIB.hosp, Wd('13', 'il') - 0.15, Wd('13', 'arriver') - 0.2, 540, 680, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.lou.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'determined', look: [0.3, 0], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    VOTE.michel.update(t, { x: 0, y: 60, scale: 0.55, brows: 'sad', look: [0, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 0.7, breathe: 0, blink: 0 })
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
    if (l.id.startsWith('09') || l.id.startsWith('10')) continue
    const q = t - (l.start - 0.12)
    if (q > -0.12 && q < 0.12) {
      const dir = l.who === 'procureur' ? -1 : 1
      whip = q < 0 ? dir * -1400 * ease.in3(clamp((q + 0.12) / 0.12)) : dir * 1400 * (1 - ease.out3(clamp(q / 0.12)))
    }
  }
  TRIB.g.setAttribute('transform', `translate(${whip.toFixed(1)} 0)`)
  if (cur !== HOOK || t >= K.BURST) streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

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
