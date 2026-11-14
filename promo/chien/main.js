/**
 * ============================================================================
 *  « Affaire Classée ? » — Le chien (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : la caméra de la sonnette. Un
 *  enfant à vélo, un american staff qui passe sous la clôture et lui saute
 *  dessus, le père qui surgit avec une pelle : un coup, le chien lâche et
 *  s'enfuit, le père le poursuit hors champ ; l'allée vide, et les coups qui
 *  continuent (×2… ×11). Le narrateur explique pendant le replay : Rocky,
 *  Nathan mordu au bras, le père et la pelle, la fuite, onze coups derrière un
 *  muret (rien de montré), le collier par terre. Le marteau tombe.
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
grad('splitL', [[0, '#2a4a32'], [1, '#08140c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#4a3020'], [1, '#140a04']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
grad('lawn', [[0, '#5a8a4a'], [1, '#3a6a32']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('daySky', [[0, '#9fc8e8'], [1, '#e6f0f4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lensV', [[0.55, '#000', 0], [0.85, '#000', 0.55], [1, '#000', 0.95]], { cx: 0.5, cy: 0.5, r: 0.62 })
grad('warmBg', [[0, '#5a3a20'], [1, '#1a0e06']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('kidBg', [[0, '#2a4a7a'], [1, '#0a1428']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('judgeBg', [[0, '#1a1e30'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
{
  const f = svg('filter', { id: 'desat2', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs)
  svg('feColorMatrix', { type: 'saturate', values: '0.15' }, f)
}

// Les personnages. Les avocats en costume ; le père ; Nathan, 6 ans ; Rocky, l'american staff.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const PERE = { robe: '#3a6a4a', jabot: false, collar: '#2a4a32', hair: 'short', hairColor: '#4a3020', beard: true, skin: '#e2b08a', iris: '#3b2a1a' }
const NATHAN = { robe: '#3b82f6', jabot: false, collar: '#ffd166', hair: 'messy', hairColor: '#d9b060', skin: '#f6d0b0', iris: '#3a5a7a' }
// Un personnage en pied, vu de loin (course, pelle levée).
function runner(parent, { shirt = '#3a6a4a', pants = '#2a3a5a', skin = '#e2b08a', hair = '#4a3020', small = false, shovel = false } = {}) {
  const g = svg('g', {}, parent)
  const s = small ? 0.62 : 1
  const legB = svg('path', { fill: 'none', stroke: pants, 'stroke-width': 26 * s, 'stroke-linecap': 'round' }, g)
  const armB = svg('path', { fill: 'none', stroke: shirt, 'stroke-width': 22 * s, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -34 * s, y: -230 * s, width: 68 * s, height: 130 * s, rx: 28 * s, fill: shirt }, g)
  svg('circle', { cx: 0, cy: -262 * s, r: 32 * s, fill: skin }, g)
  svg('path', { d: `M ${-32 * s} ${-268 * s} C ${-34 * s} ${-300 * s} ${32 * s} ${-304 * s} ${32 * s} ${-270 * s} C ${16 * s} ${-284 * s} ${-16 * s} ${-284 * s} ${-32 * s} ${-268 * s} Z`, fill: hair }, g)
  const legF = svg('path', { fill: 'none', stroke: pants, 'stroke-width': 28 * s, 'stroke-linecap': 'round' }, g)
  const tool = svg('g', {}, g)
  if (shovel) {
    svg('path', { d: 'M 0 0 L 0 -260', stroke: '#8a5a30', 'stroke-width': 14, 'stroke-linecap': 'round' }, tool)
    svg('path', { d: 'M -34 -250 L 34 -250 L 26 -330 Q 0 -350 -26 -330 Z', fill: '#9aa6b4', stroke: '#3a4250', 'stroke-width': 5 }, tool)
  }
  const armF = svg('path', { fill: 'none', stroke: shirt, 'stroke-width': 24 * s, 'stroke-linecap': 'round' }, g)
  function update(x, y, sc, ph, { run = 1, raise = 0, dir = 1, fallen = 0 } = {}) {
    g.setAttribute('transform', `translate(${x} ${y - Math.abs(Math.sin(ph)) * 10 * run}) scale(${sc * dir} ${sc}) rotate(${-80 * fallen})`)
    const leg = (p) => `M 0 ${-100 * s} L ${Math.sin(p) * 50 * run * s} ${-50 * s} L ${Math.sin(p - 0.5) * 60 * run * s} 0`
    legF.setAttribute('d', leg(ph))
    legB.setAttribute('d', leg(ph + Math.PI))
    const sh = [0, -200 * s]
    if (shovel) {
      const a = lerp(0.6, -2.4, raise)
      const hx = sh[0] + Math.cos(a) * 120
      const hy = sh[1] + Math.sin(a) * 120
      armF.setAttribute('d', `M ${sh[0]} ${sh[1]} L ${hx} ${hy}`)
      armB.setAttribute('d', `M ${sh[0] - 6} ${sh[1]} L ${hx - 10} ${hy + 10}`)
      tool.setAttribute('transform', `translate(${hx} ${hy}) rotate(${(a * 180) / Math.PI + 90 + 20})`)
    } else {
      armF.setAttribute('d', `M 0 ${sh[1]} L ${Math.sin(ph + Math.PI) * 40 * run * s} ${-140 * s} L ${Math.sin(ph + Math.PI) * 60 * run * s} ${-90 * s}`)
      armB.setAttribute('d', `M -6 ${sh[1]} L ${Math.sin(ph) * 40 * run * s} ${-140 * s} L ${Math.sin(ph) * 60 * run * s} ${-90 * s}`)
    }
  }
  return { g, update }
}
// Rocky, de profil (course, queue entre les pattes, collier).
function dog(parent) {
  const g = svg('g', {}, parent)
  const legs = Array.from({ length: 4 }, (_, k) => svg('path', { fill: 'none', stroke: k < 2 ? '#6a4a34' : '#8a6a50', 'stroke-width': 18, 'stroke-linecap': 'round' }, g))
  const tail = svg('path', { fill: 'none', stroke: '#8a6a50', 'stroke-width': 12, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -110 -120 C -120 -170 80 -180 110 -140 C 130 -110 120 -70 90 -60 L -100 -60 C -120 -70 -116 -100 -110 -120 Z', fill: '#8a6a50', stroke: '#4a3020', 'stroke-width': 5 }, g)
  svg('path', { d: 'M -80 -150 C -20 -168 60 -168 100 -146', fill: 'none', stroke: '#b08a6a', 'stroke-width': 10, opacity: 0.7 }, g)
  const head = svg('g', { transform: 'translate(120 -150)' }, g)
  svg('path', { d: 'M -20 -40 C 20 -60 80 -50 96 -20 C 104 0 96 26 70 30 L 0 34 C -26 30 -34 -20 -20 -40 Z', fill: '#8a6a50', stroke: '#4a3020', 'stroke-width': 5 }, head)
  svg('path', { d: 'M -4 -40 L -16 -76 L 20 -50 Z', fill: '#6a4a34' }, head)
  svg('circle', { cx: 42, cy: -14, r: 8, fill: '#10121a' }, head)
  svg('circle', { cx: 96, cy: -6, r: 10, fill: '#10121a' }, head)
  const jaw = svg('path', { d: 'M 10 30 L 90 20', stroke: '#4a3020', 'stroke-width': 6 }, head)
  svg('rect', { x: -26, y: -10, width: 20, height: 44, rx: 6, fill: '#e5484d' }, head)
  svg('circle', { cx: -16, cy: 40, r: 9, fill: '#ffd166' }, head)
  function update(x, y, sc, ph, { run = 1, flee = 0, dir = 1, jump = 0 } = {}) {
    g.setAttribute('transform', `translate(${x} ${y - Math.abs(Math.sin(ph * 2)) * 12 * run - 120 * jump}) scale(${sc * dir} ${sc}) rotate(${-14 * jump})`)
    const leg = (hx, p) => `M ${hx} -70 L ${hx + Math.sin(p) * 34 * run} -30 L ${hx + Math.sin(p - 0.6) * 40 * run} 0`
    legs[0].setAttribute('d', leg(-80, ph + Math.PI))
    legs[1].setAttribute('d', leg(70, ph))
    legs[2].setAttribute('d', leg(-60, ph))
    legs[3].setAttribute('d', leg(90, ph + Math.PI))
    tail.setAttribute('d', flee > 0.5 ? 'M -110 -110 Q -130 -60 -90 -30' : `M -110 -120 Q -150 -170 ${-140 + 10 * Math.sin(ph * 3)} -200`)
    jaw.setAttribute('transform', `rotate(${run > 0.5 && flee < 0.5 ? 10 * Math.abs(Math.sin(ph * 3)) : 0} 10 30)`)
  }
  return { g, update }
}

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#020306')
  const R = L.actor
  // A · La caméra de la sonnette : le jardin, le trottoir, la clôture du voisin.
  const A = svg('g', {}, R)
  const Acam = svg('g', {}, A)
  svg('rect', { x: -400, y: -400, width: W + 800, height: 1100, fill: 'url(#daySky)' }, Acam)
  for (const [x, w, h, c] of [[-100, 420, 380, '#d8c4a0'], [400, 360, 300, '#c9b08a'], [800, 420, 360, '#e0ccaa']]) {
    svg('rect', { x, y: 680 - h, width: w, height: h, fill: c, stroke: '#8a7458', 'stroke-width': 5 }, Acam)
    svg('path', { d: `M ${x - 20} ${680 - h} L ${x + w / 2} ${600 - h} L ${x + w + 20} ${680 - h} Z`, fill: '#a0522d' }, Acam)
    for (let k = 0; k < 2; k++) svg('rect', { x: x + 50 + k * (w - 180), y: 720 - h, width: 80, height: 90, fill: '#9fc8e8', stroke: '#ffffff', 'stroke-width': 6 }, Acam)
  }
  svg('rect', { x: -400, y: 680, width: W + 800, height: 1500, fill: 'url(#lawn)' }, Acam)
  svg('rect', { x: -400, y: 860, width: W + 800, height: 230, fill: '#b9b4aa' }, Acam)
  svg('rect', { x: -400, y: 1086, width: W + 800, height: 14, fill: '#8a857c' }, Acam)
  // La clôture du voisin (avec le trou sous le grillage).
  for (let x = 560; x < 1400; x += 60) svg('rect', { x, y: 640, width: 14, height: 220, fill: '#6a7480' }, Acam)
  for (let y = 660; y < 860; y += 40) svg('path', { d: `M 560 ${y} L 1400 ${y}`, stroke: '#9aa6b4', 'stroke-width': 4 }, Acam)
  svg('ellipse', { cx: 900, cy: 860, rx: 70, ry: 24, fill: '#3a2a1a' }, Acam)
  // Le portail et l'allée au premier plan.
  svg('path', { d: 'M 360 2100 L 460 1100 L 620 1100 L 720 2100 Z', fill: '#c9c0b0' }, Acam)
  const bike = svg('g', {}, Acam)
  for (const x of [-70, 70]) svg('circle', { cx: x, cy: 0, r: 46, fill: 'none', stroke: '#10121a', 'stroke-width': 10 }, bike)
  svg('path', { d: 'M -70 0 L -10 -60 L 70 0 M -10 -60 L 50 -60 L 70 0 M 50 -60 L 56 -90', fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-linejoin': 'round' }, bike)
  const kid = runner(Acam, { shirt: '#3b82f6', pants: '#2a3a5a', skin: '#f6d0b0', hair: '#d9b060', small: true })
  const rocky = dog(Acam)
  const dad = runner(Acam, { shirt: '#3a6a4a', pants: '#2a2f3a', skin: '#e2b08a', hair: '#4a3020', shovel: true })
  const clang = svg('g', { opacity: 0 }, Acam)
  for (let k = 0; k < 10; k++) svg('path', { d: 'M 0 0 L -14 -120 L 14 -120 Z', fill: '#ffffff', transform: `rotate(${k * 36})` }, clang)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#lensV)' }, A)
  const ui = svg('g', {}, A)
  svg('rect', { x: 40, y: 70, width: 400, height: 70, rx: 16, fill: '#000', opacity: 0.55 }, ui)
  const uiT = txt(ui, '● SONNETTE · ENTRÉE', { x: 60, y: 118, 'font-size': 32, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  uiT.setAttribute('text-anchor', 'start')
  const clock = txt(ui, '', { x: 1020, y: 1860, 'font-size': 36, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  clock.setAttribute('text-anchor', 'end')
  const motion = svg('g', { opacity: 0 }, ui)
  svg('rect', { x: 290, y: 170, width: 500, height: 70, rx: 16, fill: '#e5484d' }, motion)
  txt(motion, 'MOUVEMENT DÉTECTÉ', { x: 540, y: 218, 'font-size': 36, fill: '#ffffff' })
  const hitRed = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ff1a2a', opacity: 0 }, A)
  // C1 · Rocky ; C2 · Nathan ; C3 · le père et la pelle.
  const C1 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#warmBg)' }, C1)
  svg('ellipse', { cx: 540, cy: 1100, rx: 500, ry: 500, fill: 'url(#spot)' }, C1)
  const rockyBig = dog(C1)
  const C2 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#kidBg)' }, C2)
  const nathan = makePerson(C2, NATHAN)
  const bandage = svg('g', {}, C2)
  svg('rect', { x: -50, y: -40, width: 100, height: 80, rx: 20, fill: '#ffffff', stroke: '#c9d0da', 'stroke-width': 5 }, bandage)
  svg('path', { d: 'M -40 -10 L 40 -10 M -40 12 L 40 12', stroke: '#e5484d', 'stroke-width': 5, opacity: 0.6 }, bandage)
  const C3 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#warmBg)' }, C3)
  const pere = makePerson(C3, PERE)
  const bigShovel = svg('g', {}, C3)
  svg('path', { d: 'M 0 400 L 0 -300', stroke: '#8a5a30', 'stroke-width': 26, 'stroke-linecap': 'round' }, bigShovel)
  svg('path', { d: 'M -70 -280 L 70 -280 L 54 -460 Q 0 -500 -54 -460 Z', fill: '#9aa6b4', stroke: '#3a4250', 'stroke-width': 8 }, bigShovel)
  // D1 · La fuite ; derrière le muret, onze coups.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -3000, y: -400, width: 8000, height: 1200, fill: 'url(#daySky)' }, Dcam)
  for (let k = 0; k < 14; k++) svg('rect', { x: -2400 + k * 420, y: 420, width: 360, height: 380, fill: ['#d8c4a0', '#c9b08a', '#e0ccaa'][k % 3], stroke: '#8a7458', 'stroke-width': 5 }, Dcam)
  svg('rect', { x: -3000, y: 800, width: 8000, height: 1400, fill: '#b9b4aa' }, Dcam)
  const rockyRun = dog(Dcam)
  const dadRun = runner(Dcam, { shirt: '#3a6a4a', pants: '#2a2f3a', skin: '#e2b08a', hair: '#4a3020', shovel: true })
  const wall = svg('g', { opacity: 0 }, D)
  svg('rect', { x: -400, y: 1160, width: W + 800, height: 900, fill: '#a07a5a', stroke: '#6a4a34', 'stroke-width': 8 }, wall)
  for (let y = 1160; y < 2000; y += 70) for (let x = (y / 70) % 2 ? -440 : -400; x < W + 400; x += 160) svg('rect', { x, y, width: 156, height: 66, fill: '#b08a6a', stroke: '#6a4a34', 'stroke-width': 4 }, wall)
  const dRed = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ff1a2a', opacity: 0 }, D)
  // D2 · Le collier, par terre.
  const D2 = svg('g', { display: 'none', filter: 'url(#desat2)' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#7a766e' }, D2)
  for (let k = 0; k < 80; k++) svg('circle', { cx: (k * 137) % W, cy: (k * 223) % H, r: 4 + (k % 4) * 3, fill: k % 2 ? '#6a665e' : '#8a867e' }, D2)
  const collar = svg('g', { transform: 'translate(540 960)' }, D2)
  svg('ellipse', { rx: 220, ry: 90, fill: 'none', stroke: '#e5484d', 'stroke-width': 34 }, collar)
  svg('circle', { cx: 0, cy: 110, r: 50, fill: '#ffd166', stroke: '#a67a10', 'stroke-width': 6 }, collar)
  txt(collar, 'ROCKY', { y: 124, 'font-size': 30, fill: '#6a4a10' })
  svg('path', { d: 'M 220 0 C 400 60 300 300 500 400', fill: 'none', stroke: '#3a3a3a', 'stroke-width': 18 }, collar)
  // E · Le père sous le projecteur ; le marteau.
  const Ev = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, Ev)
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, Ev)
  const pereE = makePerson(Ev, PERE)
  const eFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { A, Acam, bike, kid, rocky, dad, clang, clock, motion, hitRed, C1, rockyBig, C2, nathan, bandage, C3, pere, bigShovel, D, Dcam, rockyRun, dadRun, wall, dRed, D2, collar, Ev, pereE, eFlash, gavel, rwBands }
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
  // 04 : le premier coup et le onzième.
  const coups = prop((g) => {
    panel(g, 780, 360)
    for (const [x, n, lab, c] of [[-190, '1er', 'RÉFLEXE', '#12a150'], [190, '11e', 'RAGE', '#e5484d']]) {
      svg('rect', { x: x - 160, y: -140, width: 320, height: 280, rx: 20, fill: '#1f2a3a', stroke: c, 'stroke-width': 8 }, g)
      txt(g, n, { x, y: 10, 'font-size': 120, fill: '#ffffff' })
      txt(g, lab, { x, y: 100, 'font-size': 46, fill: c })
    }
  })
  // 05 : quatorze points de suture.
  const stitches = prop((g) => {
    panel(g, 640, 300, '#e5484d')
    svg('path', { d: 'M -260 0 Q 0 -30 260 0', fill: 'none', stroke: '#f0c4a0', 'stroke-width': 90, 'stroke-linecap': 'round' }, g)
    svg('path', { d: 'M -200 -6 Q 0 -30 200 -6', fill: 'none', stroke: '#b83a3a', 'stroke-width': 8 }, g)
    for (let k = 0; k < 14; k++) svg('path', { d: `M ${-195 + k * 30} -30 L ${-185 + k * 30} 18`, stroke: '#10121a', 'stroke-width': 6 }, g)
  })
  // 07 : l'école maternelle, à 50 mètres.
  const school = prop((g) => {
    panel(g, 620, 440, '#ffd166')
    svg('rect', { x: -220, y: -60, width: 440, height: 220, fill: '#f6efe2', stroke: '#8a7458', 'stroke-width': 6 }, g)
    svg('path', { d: 'M -250 -60 L 0 -190 L 250 -60 Z', fill: '#e5484d' }, g)
    for (const x of [-160, -40, 80]) svg('rect', { x, y: -20, width: 80, height: 70, fill: '#9fc8e8', stroke: '#ffffff', 'stroke-width': 5 }, g)
    svg('rect', { x: 150, y: 40, width: 50, height: 120, fill: '#3b82f6' }, g)
    txt(g, 'ÉCOLE MATERNELLE', { y: 130, 'font-size': 34, fill: '#10121a' })
    txt(g, '50 m', { x: 230, y: -130, 'font-size': 60, fill: '#ffd166' })
  })
  // 09 : vacciné, déclaré, assuré.
  const papers = prop((g) => {
    panel(g, 680, 420)
    g.items = ['VACCINÉ', 'DÉCLARÉ', 'ASSURÉ'].map((s, k) => {
      const it = svg('g', { transform: `translate(-280 ${-120 + k * 120})` }, g)
      svg('rect', { x: 0, y: -44, width: 560, height: 88, rx: 16, fill: '#1f2a3a' }, it)
      txt(it, '✓', { x: 50, y: 20, 'font-size': 60, fill: '#12e070' })
      const l = txt(it, s, { x: 110, y: 20, 'font-size': 56, fill: '#ffffff' })
      l.setAttribute('text-anchor', 'start')
      return it
    })
  })
  // 11 : devant son fils.
  const eyes = prop((g) => {
    panel(g, 520, 300, '#9fd0ff')
    for (const x of [-100, 100]) {
      svg('ellipse', { cx: x, cy: 0, rx: 80, ry: 60, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
      svg('circle', { cx: x, cy: 6, r: 30, fill: '#3a5a7a' }, g)
      svg('circle', { cx: x, cy: 6, r: 14, fill: '#10121a' }, g)
    }
    svg('path', { d: 'M -100 60 Q -96 110 -90 130', stroke: '#6fd0ff', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, coups, stitches, school, papers, eyes }
})

// ------------------------------------------------- 3 · Le vote : le père face à Rocky (le collier)
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const pere = makePerson(L.actor, PERE)
  const frame = svg('g', { transform: 'translate(810 1390)' }, L.actor)
  svg('rect', { x: -200, y: -260, width: 400, height: 500, rx: 10, fill: '#5a3a22', stroke: '#2a1a10', 'stroke-width': 10 }, frame)
  svg('rect', { x: -170, y: -230, width: 340, height: 440, fill: '#d8cdb8' }, frame)
  const fc = svg('clipPath', { id: 'frameClip' }, defs)
  svg('rect', { x: -170, y: -230, width: 340, height: 440 }, fc)
  const fin = svg('g', { 'clip-path': 'url(#frameClip)' }, frame)
  const rk = dog(fin)
  rk.update(0, 40, 1.05, 0, { run: 0 })
  svg('path', { d: 'M 90 -260 L 200 -150 L 200 -100 L 40 -260 Z', fill: '#0a0a0a' }, frame)
  txt(frame, 'ROCKY', { y: 300, 'font-size': 44, fill: '#ffffff' })
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { pere }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#e5484d' }, fxTop), d: (x + y) * 0.011 })
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
const hitTag = fs(tag('×1', 'slam red', { t0: K.OFF, t1: K.REWIND, y: 420, rot: -6, from: 2.4, dur: 0.12 }), 220)
hitTag.update = (t) => (hitTag.el.textContent = `×${1 + K.HITS.filter((h) => t >= h).length}`)
hitTag.kick = (t) => 1 + 0.25 * Math.max(...K.HITS.map((h) => (t >= h ? Math.exp(-(t - h) * 14) : 0)), 0)
fs(tag('ROCKY · AMERICAN STAFF', 'pill yellow', { t0: Wd('02', 'rocky') - 0.12, t1: K.NATHAN - 0.06, y: 300, rot: -2 }), 52)
fs(tag('NATHAN · 6 ANS', 'pill yellow', { t0: K.NATHAN, t1: K.PELLE - 0.06, y: 260, rot: 2 }), 60)
fs(tag('MORDU AU BRAS', 'pill red', { t0: Wd('02', 'bras') - 0.15, t1: K.PELLE - 0.06, y: 1200, rot: -3 }), 56)
fs(tag('SON PÈRE', 'pill', { t0: K.PELLE, t1: K.CHASE - 0.05, y: 260, rot: -2 }), 60)
fs(tag('IL AVAIT LÂCHÉ.', 'slam white', { t0: K.CHASE, t1: Wd('03', 'il') - 0.08, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 100)
fs(tag('IL S’ENFUYAIT.', 'slam white', { t0: Wd('03', 'il') - 0.08, t1: K.ONZE - 0.05, y: 330, rot: 3, from: 2.4, dur: 0.18 }), 100)
counterTag(K.ONZE, K.DEAD - 0.05, 11, 'COUPS', { y: 330, dur: 0.9 })
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('LE ONZIÈME : DE LA RAGE.', 'slam white', { t0: Wd('04', 'le', 1) - 0.1, t1: E('04') + 0.15, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 76)
counterTag(Wd('05', '14') - 0.15, Wd('05', 'vous') - 0.12, 14, 'POINTS DE SUTURE', { y: 300, dur: 0.5 })
fs(tag('« VOUS AURIEZ COMPTÉ ? »', 'slam white', { t0: Wd('05', 'vous') - 0.1, t1: E('05') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 72)
fs(tag('LA QUEUE ENTRE LES PATTES', 'pill', { t0: Wd('06', 'avec') - 0.15, t1: E('06') + 0.15, y: 300, rot: -2 }), 48)
fs(tag('« FINIR LE TRAVAIL LÀ-BAS ? »', 'slam white', { t0: Wd('07', 'vous') - 0.1, t1: E('07') + 0.1, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 64)
fs(tag('PÈRE HÉROÏQUE<br>OU BOURREAU ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 84)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
fs(tag('JAMAIS MORDU PERSONNE', 'pill', { t0: Wd('09', 'jamais') - 0.15, t1: Wd('09', 'il') - 0.12, y: 300, rot: -2 }), 50)
fs(tag('« GÉNIAL. »', 'slam yellow', { t0: Wd('10', 'genial') - 0.15, t1: Wd('10', 'ce') - 0.12, y: 330, rot: -4, from: 2.6, dur: 0.15 }), 130)
fs(tag('UN ENFANT DE 6 ANS.', 'slam white', { t0: Wd('10', 'ce') - 0.1, t1: E('10') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 82)
fs(tag('UN MASSACRE.', 'stamp', { t0: Wd('11', 'massacre') - 0.15, t1: Wd('11', 'devant') - 0.08, y: 330, rot: -6, from: 2.8, dur: 0.18 }), 110)
fs(tag('DEVANT SON FILS.', 'slam white', { t0: Wd('11', 'devant') - 0.08, t1: E('11') + 0.2, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 96)
fs(tag('ET UN PÈRE QUI EST VENU.', 'slam yellow', { t0: Wd('12', 'et') - 0.1, t1: E('12') + 0.3, y: 420, rot: -4, from: 2.6, dur: 0.18 }), 72)
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
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', pere: 'LE PÈRE' }

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
  [K.DOG, 6],
  [K.BITE, 14],
  [K.DAD, 8],
  [K.STRIKE, 26],
  ...K.HITS.map((h) => [h, 9]),
  [K.REPLAY, 10],
  [K.NATHAN, 8],
  [K.PELLE, 10],
  [K.CHASE, 8],
  ...Array.from({ length: 11 }, (_, k) => [K.ONZE + k * 0.12, 7]),
  [K.DEAD, 12],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'le', 1) - 0.1, 10],
  [Wd('11', 'massacre') - 0.15, 12],
  [Wd('12', 'et') - 0.1, 12],
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
    const phase = t < K.REWIND ? 'A' : t < K.NATHAN ? 'C1' : t < K.PELLE ? 'C2' : t < K.CHASE ? 'C3' : t < K.DEAD ? 'D' : t < K.TODAY ? 'D2' : 'E'
    for (const [k, el] of [['A', HOOK.A], ['C1', HOOK.C1], ['C2', HOOK.C2], ['C3', HOOK.C3], ['D', HOOK.D], ['D2', HOOK.D2], ['E', HOOK.Ev]]) show(el, phase === k)
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A') {
      // La sonnette : l'enfant à vélo, le chien qui charge, le père, la pelle ; puis l'allée vide.
      HOOK.clock.textContent = `16:42:${pad2(7 + t)}`
      HOOK.motion.setAttribute('opacity', t > K.DOG && t < K.OFF ? (Math.floor(t * 4) % 2 ? 1 : 0.4) : 0)
      const kidX = lerp(760, 520, clamp(t / K.BITE))
      const fall = ease.out3(clamp((t - K.BITE) / 0.3))
      HOOK.kid.update(kidX - 60 * fall, 1000 + 40 * fall, 1, t * 6, { run: t < K.BITE ? 0.4 : 0, fallen: fall * 0.9, dir: -1 })
      place(HOOK.bike, kidX + 40 * fall, 1060, 0.9, -70 * fall)
      // Le chien : sous la clôture, la charge, la morsure, la fuite.
      const out = ease.out2(clamp((t - K.DOG) / 0.35))
      const charge = ease.in2(clamp((t - (K.DOG + 0.35)) / (K.BITE - K.DOG - 0.35)))
      const flee = ease.in2(clamp((t - K.FLEE) / 0.8))
      let dx = lerp(900, kidX + 60, charge)
      let dy = lerp(860, 1030, out)
      if (t > K.FLEE) dx = lerp(kidX + 60, 1500, flee)
      const jump = t > K.BITE - 0.15 && t < K.BITE + 0.2 ? Math.sin(Math.PI * clamp((t - K.BITE + 0.15) / 0.35)) : 0
      const onKid = t > K.BITE && t < K.FLEE
      HOOK.rocky.update(dx + (onKid ? 8 * Math.sin(t * 40) : 0), dy, lerp(0.3, 0.55, out), t * 14, { run: onKid ? 0.2 : 1, flee: t > K.FLEE ? 1 : 0, dir: t > K.FLEE ? 1 : -1, jump })
      HOOK.rocky.g.setAttribute('opacity', t < K.DOG ? 0 : 1)
      // Le père : il surgit, lève la pelle, frappe, puis poursuit le chien hors champ.
      const run = ease.io2(clamp((t - K.DAD) / (K.STRIKE - K.DAD - 0.2)))
      const chase = ease.in2(clamp((t - K.FLEE - 0.1) / 0.9))
      const raise = t < K.STRIKE - 0.25 ? 0.3 : t < K.STRIKE ? ease.out3(clamp((t - (K.STRIKE - 0.25)) / 0.2)) : 1 - ease.in3(clamp((t - K.STRIKE) / 0.08))
      const px = t > K.FLEE ? lerp(kidX - 40, 1600, chase) : lerp(-200, kidX - 40, run)
      HOOK.dad.update(px, 1120, 0.95, t * 12, { run: run < 1 || t > K.FLEE ? 1 : 0.2, raise: t > K.FLEE ? 0.8 : raise })
      HOOK.dad.g.setAttribute('opacity', t < K.DAD ? 0 : 1)
      const cl = clamp(1 - (t - K.STRIKE) / 0.15)
      HOOK.clang.setAttribute('opacity', t > K.STRIKE && cl > 0 ? cl.toFixed(2) : 0)
      HOOK.clang.setAttribute('transform', `translate(${kidX + 50} 960) scale(${(0.6 + 0.8 * (1 - cl)).toFixed(2)})`)
      // Hors champ : les coups (flash rouge à chaque coup).
      const hk = Math.max(...K.HITS.map((h) => (t >= h ? Math.exp(-(t - h) * 12) : 0)), 0)
      HOOK.hitRed.setAttribute('opacity', (0.22 * hk).toFixed(2))
      HOOK.Acam.setAttribute('transform', SHOT(lerp(640, 580, clamp(t / K.BITE)), 960, 1.7 + 0.02 * t + (t > K.OFF ? 0.1 : 0), 0, hx, hy))
    }
    if (phase === 'C1') {
      const k = t - K.REWIND
      HOOK.rockyBig.update(420, 1300, 2.2, t * 2, { run: 0, flee: 0, dir: 1 })
      HOOK.C1.setAttribute('transform', SHOT(540, 1000, 1.0 + 0.03 * k, 0, hx + (t < K.REPLAY ? 30 * Math.sin(t * 70) : 0), hy))
    }
    if (phase === 'C2') {
      HOOK.nathan.update(t, { x: 540, y: 1200, scale: 0.95, brows: 'sad', look: [0, 0.2], armR: [0.7, 1.8], armL: [0.3, 0.5], tearT: t - K.NATHAN, seed: 1.5 })
      place(HOOK.bandage, 650, 1290, 1.1, -20)
    }
    if (phase === 'C3') {
      HOOK.pere.update(t, { x: 480, y: 1180, scale: 1.05, brows: 'angry', look: [0.4, 0], armR: [0.9, 0.4], armL: [0.3, 0.6], seed: 0.4 })
      place(HOOK.bigShovel, 820, 1150, 1, 12 + 4 * Math.sin(t * 3))
    }
    if (phase === 'D') {
      // La fuite (le chien, la queue basse ; le père, la pelle levée), puis le muret et les onze coups.
      const k = t - K.CHASE
      const hide = t > K.ONZE - 0.2
      const x = k * 520
      HOOK.rockyRun.update(hide ? 500 + x * 0.97 + 260 : 900 + x, hide ? 1420 : 1150, 1.0, t * 14, { run: hide ? 0 : 1, flee: 1, dir: 1 })
      HOOK.dadRun.update(500 + x * (hide ? 1 : 0.97), 1250, 1.3, t * 12, { run: hide ? 0 : 1, raise: hide ? 0.5 + 0.5 * Math.abs(Math.sin((t - K.ONZE) * 9)) : 0.8 })
      HOOK.wall.setAttribute('opacity', hide ? 1 : 0)
      const strikeK = hide ? Math.max(0, Math.sin((t - K.ONZE) * 9)) ** 6 : 0
      HOOK.dRed.setAttribute('opacity', (0.25 * strikeK).toFixed(2))
      HOOK.Dcam.setAttribute('transform', SHOT(700 + x, 1000, hide ? 1.15 : 1.0, 0, hx, hy))
    }
    if (phase === 'D2') {
      const k = t - K.DEAD
      HOOK.D2.setAttribute('transform', SHOT(540, 980, 1.0 + 0.06 * k, 0, hx, hy))
    }
    if (phase === 'E') {
      const k = t - K.TODAY
      HOOK.pereE.update(t, { x: 540, y: 1080, scale: 1.15, mouth: 0, brows: 'angry', look: [0, 0], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 0.4 })
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
    prop(TRIB.coups, Wd('04', 'le', 0) - 0.15, Wd('04', 'le', 1) - 0.12, 540, 660, 0.85)
    prop(TRIB.stitches, Wd('05', '14') - 0.2, Wd('05', 'vous') - 0.12, 540, 700, 0.85)
    prop(TRIB.school, Wd('07', 'lecole') - 0.2, Wd('07', 'vous') - 0.12, 540, 720, 0.85)
    if (prop(TRIB.papers, Wd('09', 'il') - 0.15, E('09') + 0.15, 540, 700, 0.85) > 0) TRIB.papers.items.forEach((it, k) => it.setAttribute('opacity', t > [Wd('09', 'vaccine'), Wd('09', 'declare'), Wd('09', 'assure')][k] - 0.15 ? 1 : 0))
    prop(TRIB.eyes, Wd('11', 'devant') - 0.1, E('11') + 0.2, 540, 720, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.pere.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'angry', look: [0.3, 0], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 3.1 })
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
