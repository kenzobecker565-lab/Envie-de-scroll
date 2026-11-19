/**
 * ============================================================================
 *  « Affaire Classée ? » — La gifle (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : on est dans le téléphone de
 *  l'élève qui filme en direct ; le prof avance, la gifle (CLAC !), le
 *  téléphone tombe en tournoyant et son écran éclate. Le narrateur explique
 *  pendant le replay (dix minutes d'insultes, filmé, devant la classe), puis la
 *  vidéo devient virale (4 millions de vues) et le marteau tombe : le procès.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT as H, WIDTH as W, makeCues } from './cues.js'
import { makePerson } from './personnage.js'

const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W: Wd } = C
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
// Fonds peints (images) : chargés avant le premier rendu.
const PHOTOS = []
const paint = (href, parent, { x = -210, y = -45, w = 1500, h = 2010, opacity = 1 } = {}) => {
  const el = svg('image', { x, y, width: w, height: h, preserveAspectRatio: 'xMidYMid slice', opacity }, parent)
  PHOTOS.push([el, href])
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

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('nightFire', [[0, '#1a0f2a'], [0.55, '#5a1f1a'], [1, '#c4501c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('fireGlow', [[0, '#ffb347', 0.75], [0.5, '#ff6a1f', 0.25], [1, '#ff6a1f', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowRed', [[0, '#ff2a3d', 0.85], [1, '#ff2a3d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowBlue', [[0, '#2f6bff', 0.85], [1, '#2f6bff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('shopLight', [[0, '#d9f0ff', 0.35], [1, '#d9f0ff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('aisle', [[0, '#26303f'], [1, '#0d1118']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('court', [[0, '#27305a'], [1, '#121733']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtRed', [[0, '#5a1f1a'], [1, '#1e0b08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtDark', [[0, '#141a33'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('shade', [[0, '#0b0f1e', 0], [0.5, '#0b0f1e', 0.12], [1, '#0b0f1e', 0.72]], { cx: 0.5, cy: 0.42, r: 0.72 })
grad('spot', [[0, '#bcd2ff', 0.38], [1, '#bcd2ff', 0]], { cx: 0.5, cy: 0.35, r: 0.55 })
grad('beam', [[0, '#ffe7b0', 0.45], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('bar', [[0, '#9aa6c4'], [0.5, '#e6ecff'], [1, '#6c7896']], { x1: 0, y1: 0, x2: 1, y2: 0 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.6]], { cx: 0.5, cy: 0.45, r: 0.75 })
{
  const p = svg('pattern', { id: 'dots', width: 22, height: 22, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
  svg('circle', { cx: 11, cy: 11, r: 4, fill: '#ffffff' }, p)
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

// Silhouette qui marche ou court (vue de profil), avec un liseré de lumière.
function walker(parent, { color = '#1d2130', rim = '#ff8a3d', hood = false, dir = 1, carry = 'box', vest = false } = {}) {
  const g = svg('g', {}, parent)
  const inner = svg('g', { transform: `scale(${dir} 1)` }, g)
  const legB = svg('path', { fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  const armB = svg('path', { fill: 'none', stroke: color, 'stroke-width': 24, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  svg('rect', { x: -38, y: -230, width: 76, height: 140, rx: 32, fill: color }, inner)
  if (vest) for (const y of [-200, -160]) svg('rect', { x: -38, y, width: 76, height: 12, fill: '#e8ff3a' }, inner)
  svg('path', { d: 'M 30 -220 Q 46 -160 34 -100', fill: 'none', stroke: rim, 'stroke-width': 9, opacity: 0.95 }, inner)
  svg('circle', { cx: 6, cy: -262, r: 34, fill: color }, inner)
  if (hood) svg('path', { d: 'M -34 -250 C -40 -310 46 -316 46 -262 C 40 -240 30 -236 22 -234 Z', fill: color }, inner)
  svg('path', { d: 'M 22 -292 A 34 34 0 0 1 38 -246', fill: 'none', stroke: rim, 'stroke-width': 9, opacity: 0.95 }, inner)
  const legF = svg('path', { fill: 'none', stroke: color, 'stroke-width': 32, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  // Le butin, tenu devant.
  const loot = svg('g', {}, inner)
  if (carry === 'tv') {
    svg('rect', { x: 10, y: -250, width: 120, height: 84, rx: 8, fill: '#1c2230', stroke: rim, 'stroke-width': 4 }, loot)
    svg('rect', { x: 20, y: -240, width: 100, height: 62, fill: '#3a4a6a' }, loot)
  } else if (carry === 'box') {
    svg('rect', { x: 14, y: -230, width: 90, height: 74, rx: 6, fill: '#b98a4a', stroke: '#6a4a20', 'stroke-width': 4 }, loot)
    svg('path', { d: 'M 14 -200 L 104 -200', stroke: '#6a4a20', 'stroke-width': 4 }, loot)
  } else if (carry === 'bags') {
    for (const [x, c] of [[24, '#e5484d'], [62, '#3b82f6']]) svg('path', { d: `M ${x} -190 l 40 0 l 6 70 l -52 0 Z`, fill: c, stroke: '#111', 'stroke-width': 3 }, loot)
  }
  const armF = svg('path', { fill: 'none', stroke: color, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  // phase : cycle de marche ; stride : amplitude ; high : jambe avant levée (enjamber).
  function update(x, y, s, phase, { stride = 1, high = 0 } = {}) {
    g.setAttribute('transform', `translate(${x} ${y - Math.abs(Math.sin(phase)) * 10 * stride}) scale(${s})`)
    const leg = (p, lift) => {
      const hipX = 0
      const hipY = -100
      const a = Math.sin(p) * 0.55 * stride
      const kx = hipX + Math.sin(a) * 60 + lift * 50
      const ky = hipY + Math.cos(a) * 60 - lift * 50
      const fx = kx + Math.sin(a - 0.4 * Math.max(0, Math.cos(p))) * 60 + lift * 30
      const fy = ky + 60 - lift * 20
      return `M ${hipX} ${hipY} L ${kx} ${ky} L ${fx} ${fy} l 18 0`
    }
    legF.setAttribute('d', leg(phase, high))
    legB.setAttribute('d', leg(phase + Math.PI, 0))
    const holding = carry !== 'none'
    armF.setAttribute('d', holding ? 'M 0 -200 L 40 -170 L 60 -200' : `M 0 -200 L ${Math.sin(phase + Math.PI) * 40} -140 L ${Math.sin(phase + Math.PI) * 60} -90`)
    armB.setAttribute('d', holding ? 'M -6 -200 L 30 -160 L 50 -190' : `M -6 -200 L ${Math.sin(phase) * 40} -140 L ${Math.sin(phase) * 60} -90`)
  }
  return { g, loot, update }
}
// Le vigile à terre (silhouette allongée, gilet fluo).
function lyingGuard(parent, { color = '#151924', rim = '#ff8a3d' } = {}) {
  const g = svg('g', {}, parent)
  svg('ellipse', { cx: 0, cy: 8, rx: 190, ry: 18, fill: '#000', opacity: 0.35 }, g)
  svg('rect', { x: -150, y: -46, width: 200, height: 60, rx: 28, fill: color }, g)
  for (const x of [-110, -60]) svg('rect', { x, y: -46, width: 16, height: 60, fill: '#e8ff3a' }, g)
  svg('circle', { cx: -180, cy: -22, r: 32, fill: color }, g)
  svg('path', { d: 'M 40 -20 L 150 -10 L 200 -30', fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M 40 0 L 160 10 L 190 -6', fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M -100 -30 L -60 30 L -110 50', fill: 'none', stroke: color, 'stroke-width': 22, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -212 -36 A 32 32 0 0 1 -160 -48', fill: 'none', stroke: rim, 'stroke-width': 5, opacity: 0.8 }, g)
  return g
}
// Des flammes qui dansent (chaque langue oscille).
function fire(parent, x, y, s = 1, seed = 1) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('ellipse', { cx: 0, cy: -60, rx: 220, ry: 200, fill: 'url(#fireGlow)' }, g)
  const r = rng(seed)
  const tongues = Array.from({ length: 7 }, (_, k) => {
    const el = svg('path', { fill: ['#ff5a1f', '#ff8a1f', '#ffc04a', '#fff1a8'][k % 4], opacity: 0.95 }, g)
    return { el, x: (k - 3) * 26 + (r() - 0.5) * 10, h: 90 + r() * 90, w: 34 + r() * 20, ph: r() * 6, k }
  })
  return (t) => {
    for (const q of tongues) {
      const h = q.h * (0.75 + 0.25 * Math.sin(t * 11 + q.ph) + 0.1 * Math.sin(t * 23 + q.ph * 2))
      const sway = 14 * Math.sin(t * 7 + q.ph)
      q.el.setAttribute('d', `M ${q.x - q.w} 0 C ${q.x - q.w} ${-h * 0.4} ${q.x + sway - 6} ${-h * 0.7} ${q.x + sway} ${-h} C ${q.x + sway + 6} ${-h * 0.7} ${q.x + q.w} ${-h * 0.4} ${q.x + q.w} 0 Z`)
    }
  }
}

grad('streetGas', [[0, '#0b0f1c'], [0.6, '#16203a'], [1, '#232a3a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('gas', [[0, '#c9d6c4', 0.55], [1, '#c9d6c4', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('flare', [[0, '#ff5a3d', 0.8], [0.4, '#ff3b1f', 0.3], [1, '#ff3b1f', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('skinEye', [[0, '#f3cdb0'], [1, '#d9a585']], { gradientUnits: 'userSpaceOnUse', x1: 0, y1: -700, x2: 0, y2: 1100 })
grad('irisG', [[0, '#7a4a2a'], [0.7, '#4a2a16'], [1, '#2a160a']], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('ballG', [[0, '#ffffff'], [0.4, '#e4e7ee'], [1, '#8a92a6']], { cx: 0.35, cy: 0.35, r: 0.7 })
grad('flashGlow', [[0, '#fff6c8', 1], [0.3, '#ffcf5a', 0.7], [1, '#ff8a1f', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('shieldG', [[0, '#d7e6ff', 0.55], [1, '#9fb8de', 0.3]], { x1: 0, y1: 0, x2: 1, y2: 1 })

// Le pavé (un cube de granit, vu de trois quarts).
function pave(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('path', { d: 'M -40 -20 L 0 -40 L 40 -20 L 0 0 Z', fill: '#b8bcc4', stroke: '#10121a', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M -40 -20 L 0 0 L 0 44 L -40 24 Z', fill: '#8a8f99', stroke: '#10121a', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M 40 -20 L 0 0 L 0 44 L 40 24 Z', fill: '#6e737d', stroke: '#10121a', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g)
  for (const [x, y] of [[-20, -18], [8, -26], [-24, 10], [20, 14]]) svg('circle', { cx: x, cy: y, r: 3, fill: '#4a4f58', opacity: 0.6 }, g)
  return g
}
// Le lanceur LBD 40 (canon épais, crosse, viseur).
function lbd(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('rect', { x: -10, y: -26, width: 190, height: 52, rx: 14, fill: '#2a2f3a', stroke: '#10121a', 'stroke-width': 5 }, g)
  svg('rect', { x: 150, y: -30, width: 44, height: 60, rx: 10, fill: '#ffcf3a', stroke: '#10121a', 'stroke-width': 5 }, g)
  svg('path', { d: 'M -10 -10 L -120 -26 L -130 30 L -10 22 Z', fill: '#1b1f28', stroke: '#10121a', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g)
  svg('rect', { x: 20, y: 24, width: 26, height: 60, rx: 8, fill: '#1b1f28', stroke: '#10121a', 'stroke-width': 5, transform: 'rotate(12 33 24)' }, g)
  svg('rect', { x: 40, y: -50, width: 70, height: 26, rx: 8, fill: '#1b1f28', stroke: '#10121a', 'stroke-width': 5 }, g)
  svg('circle', { cx: 100, cy: -37, r: 7, fill: '#e5484d' }, g)
  return g
}
// Un CRS en silhouette, bouclier au bras ; armé du LBD s'il le faut.
function cop(parent, { armed = false, rim = '#9fd0ff' } = {}) {
  const g = svg('g', {}, parent)
  const c = armed ? '#222b42' : '#141a2a'
  svg('path', { d: 'M -14 -90 L -26 0 M 16 -90 L 28 0', stroke: c, 'stroke-width': 30, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -44, y: -250, width: 88, height: 170, rx: 30, fill: c }, g)
  for (const y of [-230, -200]) svg('rect', { x: -44, y, width: 88, height: 10, fill: '#3a4666' }, g)
  svg('circle', { cx: 0, cy: -282, r: 40, fill: '#20283c' }, g)
  svg('path', { d: 'M -42 -290 L 42 -290 L 46 -262 L -46 -262 Z', fill: '#9fc6ff', opacity: 0.55 }, g)
  svg('path', { d: 'M -30 -320 A 40 40 0 0 1 32 -316', fill: 'none', stroke: rim, 'stroke-width': 6, opacity: 0.9 }, g)
  if (armed) {
    svg('path', { d: 'M 44 -240 Q 52 -170 44 -100', fill: 'none', stroke: rim, 'stroke-width': 9 }, g)
    svg('path', { d: 'M 10 -220 L 70 -210', stroke: c, 'stroke-width': 26, 'stroke-linecap': 'round' }, g)
    const w = lbd(g, 0.55)
    w.setAttribute('transform', 'translate(30 -226) scale(0.55)')
    const flash = svg('g', { transform: 'translate(140 -226)', opacity: 0 }, g)
    svg('circle', { r: 90, fill: 'url(#flashGlow)' }, flash)
    svg('path', { d: 'M 0 -30 L 16 -6 L 70 0 L 16 6 L 0 30 L -6 6 L -30 0 L -6 -6 Z', fill: '#fff9d8' }, flash)
    return { g, flash }
  }
  // Bouclier transparent devant lui.
  svg('rect', { x: -10, y: -290, width: 96, height: 250, rx: 18, fill: 'url(#shieldG)', stroke: '#d7e6ff', 'stroke-width': 5 }, g)
  txt(g, 'POLICE', { x: 38, y: -170, 'font-size': 22, fill: '#ffffff', opacity: 0.85 })
  return { g }
}
// Le lanceur de pavé : silhouette dont le bras droit décrit le lancer.
function thrower(parent, { rim = '#ffb347' } = {}) {
  const g = svg('g', {}, parent)
  const c = '#2b3246'
  svg('path', { d: 'M -10 -100 L -40 0 M 14 -100 L 36 0', stroke: c, 'stroke-width': 30, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -40, y: -250, width: 80, height: 160, rx: 32, fill: c }, g)
  svg('circle', { cx: -4, cy: -282, r: 34, fill: c }, g)
  svg('path', { d: 'M -40 -276 C -44 -330 36 -334 34 -280 C 26 -262 14 -258 4 -256 Z', fill: c }, g)
  svg('path', { d: 'M -42 -300 A 34 34 0 0 0 -30 -256', fill: 'none', stroke: rim, 'stroke-width': 10 }, g)
  svg('path', { d: 'M -40 -230 Q -50 -170 -40 -110', fill: 'none', stroke: rim, 'stroke-width': 10 }, g)
  svg('path', { d: 'M -40 -90 L -40 -10', fill: 'none', stroke: rim, 'stroke-width': 8, opacity: 0.8 }, g)
  const arm = svg('path', { fill: 'none', stroke: c, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  // a = angle du bras (0 : armé derrière la tête, 1 : bras tendu vers l'avant).
  function update(a) {
    const sh = [-10, -220]
    const ang = lerp(-2.4, -0.4, a) - Math.PI
    const el = [sh[0] + Math.cos(ang) * 80, sh[1] + Math.sin(ang) * 80]
    const ang2 = ang + lerp(0.9, 0.1, a)
    const hd = [el[0] + Math.cos(ang2) * 80, el[1] + Math.sin(ang2) * 80]
    arm.setAttribute('d', `M ${sh[0]} ${sh[1]} L ${el[0]} ${el[1]} L ${hd[0]} ${hd[1]}`)
    return hd
  }
  return { g, update }
}





// Les personnages. Les avocats en costume ; M. Garnier, le prof ; l'élève.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const PROF = { suit: '#6b5a45', shirt: '#e8f0ff', tie: '#2a4a7a', legs: false, hair: 'short', hairColor: '#b0aca4', skin: '#e9b48f', iris: '#3b2a1a', jabot: false }
const ELEVE = { robe: '#2a2f3a', jabot: false, collar: '#3a4250', hair: 'messy', hairColor: '#2a1a10', skin: '#d9a07a', iris: '#2b1d12' }
grad('wallG', [[0, '#e3d9b8'], [1, '#c9bc94']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('floorG', [[0, '#9a7a56'], [1, '#5a4430']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('darkFloor', [[0, '#3a2a1c'], [1, '#120c08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('socialBg', [[0, '#1a1030'], [1, '#05050a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('cardFade', [[0.6, '#000', 0], [1, '#000', 0.75]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('pauseBg', [[0, '#2a0a14'], [1, '#10121a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitP', [[0, '#3a2a14'], [1, '#0d0806']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitE', [[0, '#1a2a50'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sepia', [[0, '#3a2a10', 0.35], [1, '#10121a', 0.55]], { x1: 0, y1: 0, x2: 0, y2: 1 })

const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)
const heartD = 'M 0 30 C -36 6 -60 -14 -48 -38 C -38 -58 -12 -56 0 -36 C 12 -56 38 -58 48 -38 C 60 -14 36 6 0 30 Z'
function glasses(person) {
  const g = svg('g', {}, person.head)
  for (const x of [-56, 56]) svg('circle', { cx: x, cy: -140, r: 46, fill: '#ffffff', 'fill-opacity': 0.12, stroke: '#2a2a2a', 'stroke-width': 9 }, g)
  svg('path', { d: 'M -12 -146 Q 0 -156 12 -146 M -102 -150 L -142 -160 M 102 -150 L 142 -160', fill: 'none', stroke: '#2a2a2a', 'stroke-width': 8 }, g)
  return g
}
// Des fissures qui partent d'un point (comme un écran brisé).
function cracks(parent, cx, cy, scale, seed) {
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
    svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 4 / scale + 2, 'stroke-linejoin': 'round', 'stroke-dasharray': 900, 'stroke-dashoffset': 900, opacity: 0.9 }, g)
  }
  for (let k = 0; k < 3; k++) svg('circle', { r: 30 + k * 50, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.5, 'stroke-dasharray': '30 22' }, g)
  return g
}

// ------------------------------------------------- La salle de classe, vue du téléphone de l'élève (réutilisée partout)
const POV = svg('g', { id: 'pov' }, defs)
{
  svg('rect', { x: -200, y: -200, width: W + 400, height: 1520, fill: 'url(#wallG)' }, POV)
  svg('rect', { x: 80, y: 360, width: 920, height: 540, rx: 10, fill: '#7a5a3a' }, POV)
  svg('rect', { x: 100, y: 380, width: 880, height: 500, fill: '#1f4a3a' }, POV)
  txt(POV, 'x² + 3x − 4 = 0', { x: 360, y: 500, 'font-size': 54, fill: '#ffffff', opacity: 0.75, 'font-family': 'Fraunces Variable', 'font-style': 'italic', 'font-weight': 400 })
  txt(POV, 'Devoir : lundi', { x: 780, y: 820, 'font-size': 40, fill: '#ffffff', opacity: 0.6, 'font-family': 'Fraunces Variable', 'font-style': 'italic', 'font-weight': 400 })
  svg('path', { d: 'M 160 600 Q 260 560 360 610 T 560 600', fill: 'none', stroke: '#ffffff', 'stroke-width': 5, opacity: 0.5 }, POV)
  const clock = svg('g', { transform: 'translate(900 230)' }, POV)
  svg('circle', { r: 70, fill: '#ffffff', stroke: '#2a2a2a', 'stroke-width': 10 }, clock)
  POV.hourHand = svg('path', { d: 'M 0 0 L 0 -36', stroke: '#2a2a2a', 'stroke-width': 9, 'stroke-linecap': 'round' }, clock)
  POV.minHand = svg('path', { d: 'M 0 0 L 0 -56', stroke: '#e5484d', 'stroke-width': 6, 'stroke-linecap': 'round' }, clock)
  svg('rect', { x: -200, y: 1300, width: W + 400, height: 900, fill: 'url(#floorG)' }, POV)
  for (let k = 0; k < 10; k++) svg('path', { d: `M ${-100 + k * 130} 1300 L ${-500 + k * 230} 2200`, stroke: '#6a5038', 'stroke-width': 5 }, POV)
}
const PROFP = makePerson(POV, PROF)
glasses(PROFP)
{
  // Premier plan de la classe : têtes de dos, pupitres, téléphones levés.
  const front = svg('g', {}, POV)
  svg('path', { d: 'M -100 1720 L 1180 1720 L 1180 2100 L -100 2100 Z', fill: '#b8925e', stroke: '#7a5a3a', 'stroke-width': 10 }, front)
  for (const [x, y, r] of [[80, 1640, 90], [1000, 1660, 100], [300, 1760, 70]]) {
    svg('circle', { cx: x, cy: y, r, fill: '#2a1d14' }, front)
    svg('rect', { x: x - r * 1.3, y: y + r * 0.6, width: r * 2.6, height: 400, rx: r, fill: '#3a4250' }, front)
  }
  const ph = svg('g', { transform: 'translate(930 1420) rotate(8)' }, front)
  svg('rect', { x: -60, y: -110, width: 120, height: 220, rx: 18, fill: '#111' }, ph)
  svg('rect', { x: -50, y: -98, width: 100, height: 196, rx: 10, fill: '#9fd0ff', opacity: 0.85 }, ph)
  svg('circle', { cx: 30, cy: -80, r: 8, fill: '#ff3b3b' }, ph)
  svg('path', { d: 'M -50 110 Q -70 200 -40 300', stroke: '#d9a07a', 'stroke-width': 46, fill: 'none', 'stroke-linecap': 'round' }, ph)
}
const usePov = (parent, attrs = {}) => svg('use', { href: '#pov', ...attrs }, parent)

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#05050a')
  const root2 = L.actor
  // A · La vue du téléphone, en direct.
  const A = svg('g', {}, root2)
  const Acam = svg('g', {}, A)
  usePov(Acam)
  const swish = svg('g', { opacity: 0 }, Acam)
  for (let k = 0; k < 7; k++) svg('path', { d: `M ${200 + k * 20} ${900 + k * 40} Q 540 ${700 + k * 30} ${880 - k * 10} ${1100 + k * 50}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 18 - k * 2, opacity: 0.6 - k * 0.07, 'stroke-linecap': 'round' }, swish)
  const ui = svg('g', {}, A)
  svg('rect', { x: 50, y: 150, width: 170, height: 64, rx: 14, fill: '#ff2d55' }, ui)
  txt(ui, 'LIVE', { x: 135, y: 196, 'font-size': 40, fill: '#ffffff' })
  svg('rect', { x: 236, y: 150, width: 210, height: 64, rx: 14, fill: '#000', opacity: 0.45 }, ui)
  const viewers = txt(ui, '', { x: 341, y: 196, 'font-size': 38, fill: '#ffffff' })
  const rec = svg('circle', { cx: 1000, cy: 182, r: 18, fill: '#ff3b3b' }, ui)
  const timer = txt(ui, '', { x: 900, y: 196, 'font-size': 38, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  const comments = ['MDR 💀', 'IL VA CRAQUER', 'FILME FILME', 'OH LA LA', 'IL S\'ÉNERVE', 'T\'ES MORT 😂'].map((s, k) => {
    const g = svg('g', { opacity: 0 }, ui)
    svg('rect', { x: 0, y: -40, width: 30 + s.length * 24, height: 58, rx: 28, fill: '#000', opacity: 0.5 }, g)
    txt(g, s.replace(/[💀😂]/gu, ''), { x: 15 + s.length * 12, y: 0, 'font-size': 34, fill: '#ffffff' })
    return { g, t0: 0.15 + k * 0.6 }
  })
  // B · Le téléphone qui tombe, l'écran qui se brise.
  const B = svg('g', { display: 'none' }, root2)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#darkFloor)' }, B)
  for (let k = 0; k < 12; k++) svg('path', { d: `M ${-200 + k * 130} 700 L ${-700 + k * 260} 2200`, stroke: '#2a1c12', 'stroke-width': 6 }, B)
  for (const x of [180, 900]) svg('rect', { x: x - 20, y: -200, width: 40, height: 900, fill: '#4a3a2a' }, B)
  const shadow = svg('ellipse', { cx: 540, cy: 1380, rx: 220, ry: 40, fill: '#000', opacity: 0 }, B)
  const ghosts = [0, 1, 2].map(() => svg('rect', { x: -180, y: -360, width: 360, height: 720, rx: 50, fill: '#ffffff', opacity: 0 }, B))
  const phone = svg('g', {}, B)
  svg('rect', { x: -180, y: -360, width: 360, height: 720, rx: 50, fill: '#111', stroke: '#3a3a3a', 'stroke-width': 6 }, phone)
  const sc = svg('clipPath', { id: 'phoneScreen' }, defs)
  svg('rect', { x: -165, y: -345, width: 330, height: 690, rx: 36 }, sc)
  const screen = svg('g', { 'clip-path': 'url(#phoneScreen)' }, phone)
  svg('rect', { x: -165, y: -345, width: 330, height: 690, fill: '#000' }, screen)
  usePov(screen, { transform: 'translate(-194 -345) scale(0.359)' })
  const pCracks = cracks(screen, 50, -110, 1, 13)
  const shards = Array.from({ length: 16 }, (_, k) => ({ el: svg('path', { d: 'M 0 -10 L 8 6 L -8 6 Z', fill: '#cfe8ff', opacity: 0 }, B), a: -Math.PI * (0.1 + 0.8 * ((k * 37) % 16) / 16), v: 300 + ((k * 53) % 7) * 70 }))
  // C · Le replay : la scène, dix minutes plus tôt, à travers l'écran fissuré.
  const Cr = svg('g', { display: 'none' }, root2)
  const Ccam = svg('g', {}, Cr)
  usePov(Ccam)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#sepia)' }, Cr)
  const bubbles = ['VIEUX CON', 'T\'ES QUI TOI ?', 'BOUFFON', 'DÉGAGE', 'IL VA PLEURER', 'T\'OSES PAS', 'MDR', 'À LA RETRAITE !'].map((s, k) => {
    const g = svg('g', { display: 'none' }, Cr)
    const w = 60 + s.length * 30
    svg('rect', { x: -w / 2, y: -46, width: w, height: 84, rx: 24, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 7 }, g)
    svg('path', { d: 'M -20 36 L 0 70 L 16 36 Z', fill: '#ffffff' }, g)
    txt(g, s, { y: 12, 'font-size': 46, fill: '#e5484d' })
    const pos = [[300, 1060], [800, 980], [260, 1260], [820, 1200], [540, 1500], [250, 820], [850, 760], [540, 1380]][k]
    return { g, x: pos[0], y: pos[1], rot: (k % 2 ? 1 : -1) * (4 + k) }
  })
  const phonesUp = Array.from({ length: 6 }, (_, k) => {
    const g = svg('g', {}, Cr)
    svg('path', { d: 'M 0 120 Q -10 220 10 400', stroke: ['#d9a07a', '#f2c4a0', '#c98d68'][k % 3], 'stroke-width': 50, fill: 'none', 'stroke-linecap': 'round' }, g)
    svg('rect', { x: -55, y: -100, width: 110, height: 200, rx: 16, fill: '#111' }, g)
    svg('rect', { x: -46, y: -90, width: 92, height: 180, rx: 10, fill: '#9fd0ff', opacity: 0.85 }, g)
    svg('circle', { cx: 26, cy: -72, r: 8, fill: '#ff3b3b' }, g)
    return { g, x: 120 + k * 170, d: k * 0.07, tilt: (k % 2 ? 1 : -1) * (6 + k * 2) }
  })
  const bigCracks = cracks(Cr, 590, 760, 2.8, 13)
  const replayUi = svg('g', {}, Cr)
  svg('rect', { x: 50, y: 150, width: 260, height: 64, rx: 14, fill: '#000', opacity: 0.55 }, replayUi)
  txt(replayUi, '◀◀ REPLAY', { x: 180, y: 196, 'font-size': 38, fill: '#ffffff' })
  const rtimer = txt(replayUi, '', { x: 900, y: 196, 'font-size': 40, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  const rwBandsH = Array.from({ length: 7 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, Cr))
  // D · La vidéo devient virale : 4 millions de vues.
  const D = svg('g', { display: 'none' }, root2)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#socialBg)' }, D)
  const card = svg('g', {}, D)
  const cc = svg('clipPath', { id: 'cardClip' }, defs)
  svg('rect', { x: 160, y: 240, width: 760, height: 1340, rx: 44 }, cc)
  const cardIn = svg('g', { 'clip-path': 'url(#cardClip)' }, card)
  svg('rect', { x: 160, y: 240, width: 760, height: 1340, fill: '#000' }, cardIn)
  usePov(cardIn, { transform: 'translate(162 240) scale(0.7)' })
  cracks(cardIn, 575, 772, 1.96, 13)
  svg('rect', { x: 160, y: 240, width: 760, height: 1340, fill: 'url(#cardFade)' }, cardIn)
  svg('rect', { x: 160, y: 240, width: 760, height: 1340, rx: 44, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.25 }, card)
  txt(card, '@classe_2B', { x: 200, y: 1470, 'font-size': 40, fill: '#ffffff', 'text-anchor': 'start' }).setAttribute('text-anchor', 'start')
  txt(card, '#prof #clash #gifle', { x: 200, y: 1525, 'font-size': 34, fill: '#ffffff', opacity: 0.8 }).setAttribute('text-anchor', 'start')
  const icons = svg('g', { transform: 'translate(850 980)' }, card)
  const heartIcon = svg('path', { d: heartD, fill: '#fe2c55', transform: 'scale(0.9)' }, icons)
  const likeCount = txt(icons, '', { y: 80, 'font-size': 32, fill: '#ffffff' })
  svg('path', { d: 'M -40 150 Q -40 120 0 120 Q 40 120 40 150 Q 40 180 0 180 L -24 196 L -18 176 Q -40 172 -40 150 Z', fill: '#ffffff' }, icons)
  const comCount = txt(icons, '', { y: 240, 'font-size': 32, fill: '#ffffff' })
  svg('path', { d: 'M -36 330 L 4 290 L 4 312 Q 40 312 40 350 Q 24 330 4 332 L 4 354 Z', fill: '#ffffff' }, icons)
  const shareCount = txt(icons, '', { y: 400, 'font-size': 32, fill: '#ffffff' })
  const hearts = Array.from({ length: 14 }, (_, k) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff6b8a', '#ffd166'][k % 3], opacity: 0 }, D), ph: k / 14, dx: ((k * 37) % 11) - 5 }))
  const gavel = svg('g', { display: 'none' }, D)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  // Le « CLAC » de la gifle, par-dessus tout.
  const clac = svg('g', { display: 'none' }, L.hud)
  for (let k = 0; k < 16; k++) svg('path', { d: 'M 0 0 L -40 -700 L 40 -700 Z', fill: k % 2 ? '#ffd166' : '#ff3b3b', opacity: 0.9, transform: `rotate(${k * 22.5})` }, clac)
  svg('circle', { r: 260, fill: '#ffffff' }, clac)
  const clacTxt = txt(clac, 'CLAC !', { y: 60, 'font-size': 200, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 18, 'paint-order': 'stroke fill', transform: 'rotate(-8)' })
  return { A, Acam, swish, ui, viewers, rec, timer, comments, B, shadow, ghosts, phone, pCracks, shards, Cr, Ccam, bubbles, phonesUp, bigCracks, replayUi, rtimer, rwBandsH, D, card, heartIcon, likeCount, comCount, shareCount, hearts, gavel, clac, clacTxt }
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
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: '#fe2c55', opacity: 0.14, transform: `rotate(${k * 30})` }, rays)
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
  // 04 : l'adulte et le mineur.
  const minor = prop((g) => {
    panel(g, 700, 380)
    const a = svg('g', { transform: 'translate(-180 150) scale(0.75)' }, g)
    svg('rect', { x: -50, y: -260, width: 100, height: 180, rx: 34, fill: '#c9d2e6' }, a)
    svg('circle', { cx: 0, cy: -295, r: 42, fill: '#c9d2e6' }, a)
    const b = svg('g', { transform: 'translate(60 150) scale(0.55)' }, g)
    svg('rect', { x: -50, y: -260, width: 100, height: 180, rx: 34, fill: '#ffd166' }, b)
    svg('circle', { cx: 0, cy: -295, r: 42, fill: '#ffd166' }, b)
    txt(g, '16 ANS', { x: 220, y: 20, 'font-size': 64, fill: '#ffd166' })
    txt(g, '58 ANS', { x: -180, y: -150, 'font-size': 40, fill: '#c9d2e6' })
  })
  // 07 : le téléphone, le prof en « contenu ».
  const content = prop((g) => {
    panel(g, 560, 460, '#fe2c55')
    svg('rect', { x: -120, y: -200, width: 240, height: 400, rx: 30, fill: '#111' }, g)
    const cl = svg('clipPath', { id: 'miniClip' }, defs)
    svg('rect', { x: -108, y: -188, width: 216, height: 376, rx: 20 }, cl)
    const inn = svg('g', { 'clip-path': 'url(#miniClip)' }, g)
    usePov(inn, { transform: 'translate(-108 -188) scale(0.2)' })
    svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(70 120) scale(0.5)' }, g)
    txt(g, '▶ 4 M', { x: -50, y: 170, 'font-size': 34, fill: '#ffffff' })
  })
  // 10 : trois conseils de discipline, zéro sanction.
  const files = prop((g) => {
    panel(g, 760, 380)
    for (let k = 0; k < 3; k++) {
      const f = svg('g', { transform: `translate(${-220 + k * 120} ${-10 + k * 6}) rotate(${-8 + k * 8})` }, g)
      svg('rect', { x: -70, y: -100, width: 140, height: 190, rx: 10, fill: '#f4efe2', stroke: '#10121a', 'stroke-width': 5 }, f)
      for (let j = 0; j < 4; j++) svg('path', { d: `M -46 ${-60 + j * 34} L 46 ${-60 + j * 34}`, stroke: '#9aa6c4', 'stroke-width': 6 }, f)
    }
    g.zero = txt(g, '0', { x: 230, y: 50, 'font-size': 170, fill: '#e5484d' })
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, minor, content, files }
})

// ------------------------------------------------- 3 · Le vote : le prof face à l'élève
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitP)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitE)' }, L.far)
  const prof = makePerson(L.actor, PROF)
  glasses(prof)
  const eleve = makePerson(L.actor, ELEVE)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { prof, eleve }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#fe2c55' }, fxTop), d: (x + y) * 0.011 })
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





// ------------------------------------------------------------------ les instants du hook
const T_WIND = Wd('01', 'vieux') - 0.15 // il arme le bras
const T_SLAP = E('01') + 0.1 // CLAC
const T_FALL = T_SLAP + 0.28 // le téléphone part
const T_HIT = T_FALL + 0.85 // il touche le sol
const T_IN = T_HIT + 0.2 // on plonge dans l'écran
const T_REPLAY = S('02') + 0.15 // le replay
const T_CRACK = Wd('02', 'craquer') - 0.05 // il craque (dans le replay)
const T_SOCIAL = S('03') - 0.08
const T_GAVEL = Wd('03', 'jugement') - 0.1
const HOT = [
  [Wd('05', 'vous') - 0.1, E('05') + 0.1],
  [Wd('06', 'cest') - 0.1, E('06') + 0.15],
  [Wd('07', 'pas') - 0.1, E('07') + 0.1],
]
const hotAt = (t) => HOT.find(([a, b]) => t >= a && t < b)
const LIKE = '<svg viewBox="0 0 24 24" width="84" height="84" style="vertical-align:middle;margin-right:20px"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#fe2c55"/></svg>LIKE'
const fr = (v) => Math.round(v).toLocaleString('fr-FR')

// Le hook.
tag('◀◀ 10 MINUTES PLUS TÔT', 'pill', { t0: T_REPLAY, t1: Wd('02', 'se') - 0.1, y: 300, rot: -2 })
fs(tag('M. GARNIER · 58 ANS · PROF DE MATHS', 'pill yellow', { t0: Wd('02', 'monsieur') - 0.1, t1: Wd('02', 'se') - 0.1, y: 420, rot: 2 }), 42)
counterTag(Wd('02', 'insulter') - 0.1, Wd('02', 'filme') - 0.1, 10, 'MINUTES D’INSULTES', { y: 330, dur: 0.6 })
fs(tag('FILMÉ.', 'stamp', { t0: Wd('02', 'filme') - 0.08, t1: Wd('02', 'devant') - 0.05, y: 360, rot: -6, from: 2.8, dur: 0.18 }), 120)
tag('DEVANT TOUTE LA CLASSE', 'pill red', { t0: Wd('02', 'devant') - 0.1, t1: Wd('02', 'il') - 0.05, y: 330, rot: -2 })
fs(tag('IL CRAQUE.', 'slam white', { t0: Wd('02', 'craquer') - 0.2, t1: E('02') + 0.3, y: 330, rot: -4, from: 2.6, dur: 0.15 }), 120)
counterTag(Wd('03', 'video') - 0.1, T_GAVEL - 0.05, 4000000, 'VUES', { y: 150, dur: 1.3, fmt: fr })
fs(tag('JUGÉ.', 'stamp', { t0: T_GAVEL + 0.12, t1: SEC.hook.t1, y: 900, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('LE RESTE, C’EST DU BRUIT.', 'slam yellow', { t0: Wd('04', 'reste') - 0.15, t1: E('04') + 0.1, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 70)
counterTag(Wd('05', '10') - 0.1, Wd('05', 'vous') - 0.15, 10, 'MINUTES D’INSULTES', { y: 330, dur: 0.4 })
fs(tag('VOUS AURIEZ TENU, VOUS ?', 'slam red', { t0: Wd('05', 'vous') - 0.1, t1: E('05') + 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 72)
fs(tag('« C’EST POUR ÇA QU’ON LE PAIE. »', 'slam red', { t0: Wd('06', 'cest') - 0.1, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 58)
fs(tag('PAS POUR SERVIR DE CONTENU.', 'slam red', { t0: Wd('07', 'pas') - 0.1, t1: E('07') + 0.1, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 62)
fs(tag('T’ES DE QUEL CÔTÉ ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 84)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
counterTag(Wd('09', '30') - 0.1, Wd('09', 'et') - 0.1, 30, 'ANS DE CARRIÈRE', { y: 330, dur: 0.5 })
fs(tag('INEXCUSABLE.', 'slam white', { t0: Wd('09', 'excuser') - 0.15, t1: E('09') + 0.15, y: 430, rot: -3, from: 2.6, dur: 0.18 }), 110)
tag('3 CONSEILS DE DISCIPLINE', 'pill', { t0: Wd('10', 'trois') - 0.1, t1: Wd('10', 'lecole') - 0.1, y: 300, rot: -2 })
fs(tag('0 SANCTION', 'stamp', { t0: Wd('10', 'zero') - 0.08, t1: Wd('10', 'lecole') - 0.1, y: 860, rot: -6, from: 2.8, dur: 0.18 }), 84)
fs(tag('SEUL.', 'slam yellow', { t0: Wd('10', 'seul') - 0.1, t1: E('10') + 0.15, y: 420, rot: -4, from: 2.8, dur: 0.18 }), 170)
tag('JUGEZ L’ÉCOLE', 'pill', { t0: Wd('11', 'jugez') - 0.1, t1: Wd('11', 'mais') - 0.1, y: 300, rot: -2 })
fs(tag('« QUAND IL EST FATIGUÉ. »', 'slam white', { t0: Wd('11', 'quand') - 0.15, t1: E('11') + 0.3, y: 430, rot: -3, from: 2.4, dur: 0.2 }), 70)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('12') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('12', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('12', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('12', 'ecrisle') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('12', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', eleve: 'L’ÉLÈVE, QUI FILME' }

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
  [T_SLAP, 30],
  [T_HIT, 22],
  [T_REPLAY - 0.4, 10],
  [Wd('02', 'filme') - 0.08, 12],
  [T_CRACK + 0.12, 20],
  [T_GAVEL + 0.1, 24],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('09', 'excuser') - 0.15, 10],
  [Wd('10', 'zero') - 0.08, 10],
  [Wd('11', 'quand') - 0.15, 12],
  [Wd('12', 'jure') - 0.15, 8],
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
const pad = (n) => String(Math.floor(n)).padStart(2, '0')

// La pose du prof dans la scène filmée (réutilisée par le replay et par la vidéo virale).
function profPose(t, tp) {
  // tp : le temps « dans la scène » (approche puis gifle).
  const near = ease.io2(clamp((tp - 0.9) / 2.9))
  const wind = prog(tp, T_WIND, 0.3, ease.out3)
  const swing = clamp((tp - (T_SLAP - 0.08)) / 0.1)
  const sh = swing > 0 ? lerp(2.7, -0.5, ease.in3(swing)) : lerp(0.15, 2.7, wind)
  const el = swing > 0 ? lerp(0.5, -0.3, swing) : lerp(0.4, 0.5, wind)
  PROFP.update(t, {
    x: 540 + 18 * Math.sin(tp * 4) * (1 - near) + 40 * swing,
    y: lerp(1180, 1560, near) + 14 * Math.abs(Math.sin(tp * 6)) * (1 - near),
    scale: lerp(0.8, 2.1, near),
    mouth: tp > T_WIND && tp < T_SLAP ? 0.5 : 0,
    brows: 'angry',
    look: [0, 0.15],
    armR: [sh, el],
    armL: [0.15, 0.45],
    lean: -0.12 * swing,
    seed: 2,
  })
}
const SHOT = (cx, cy, z, rot = 0, dx = 0, dy = 0) => `translate(${540 + dx} ${960 + dy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const phase = t < T_FALL ? 'A' : t < T_IN + 0.35 ? 'B' : t < T_SOCIAL ? 'C' : 'D'
    show(HOOK.A, phase === 'A')
    show(HOOK.B, phase === 'B')
    show(HOOK.Cr, phase === 'C')
    show(HOOK.D, phase === 'D')
    const [hx, hy] = shakeAt(t, 0)
    // La scène filmée : en direct jusqu'à la gifle, figée ensuite, rejouée pendant le replay.
    if (phase === 'A' || phase === 'B') profPose(t, Math.min(t, T_SLAP + 0.02))
    POV.minHand.setAttribute('transform', `rotate(${(t * 6) % 360})`)
    POV.hourHand.setAttribute('transform', `rotate(${(t * 0.5 + 120) % 360})`)
    show(HOOK.clac, t >= T_SLAP - 0.02 && t < T_FALL + 0.05)
    if (t >= T_SLAP - 0.02 && t < T_FALL + 0.05) {
      const k = clamp((t - T_SLAP + 0.02) / 0.12)
      HOOK.clac.setAttribute('transform', `translate(560 900) scale(${(0.2 + 1.0 * ease.back(2.5)(k)).toFixed(3)}) rotate(${(t * 40) % 360 * 0})`)
      HOOK.clacTxt.setAttribute('transform', `rotate(${-8 + 4 * Math.sin(t * 60)})`)
    }
    if (phase === 'A') {
      // Le téléphone qui filme : tremble, avance vers le prof ; à la gifle, il part de côté.
      const near = ease.io2(clamp((t - 0.9) / 2.9))
      const hit = clamp((t - T_SLAP) / 0.08)
      const shake = 7 * Math.sin(t * 9) + 4 * Math.sin(t * 23)
      HOOK.Acam.setAttribute('transform', SHOT(540, lerp(1000, 1080, near), lerp(1.0, 1.1, near) + 0.25 * hit, -32 * ease.out3(hit), shake + hx + 320 * ease.out3(hit), 4 * Math.sin(t * 13) + hy + 120 * hit))
      HOOK.swish.setAttribute('opacity', (t > T_SLAP - 0.1 ? clamp(1 - (t - T_SLAP) / 0.25) : 0).toFixed(2))
      HOOK.viewers.textContent = `👁 ${fr(120 + 900 * clamp(t / T_SLAP) ** 2)}`.replace('👁 ', '')
      HOOK.rec.setAttribute('opacity', Math.floor(t * 2) % 2 ? 1 : 0.2)
      HOOK.timer.textContent = `09:${pad(47 + t)}`
      HOOK.comments.forEach((c, k) => {
        const v = (t - c.t0) / 1.6
        const on = v > 0 && v < 1
        c.g.setAttribute('opacity', on ? Math.min(1, (1 - v) * 3).toFixed(2) : 0)
        if (on) c.g.setAttribute('transform', `translate(60 ${1300 - 260 * v - (k % 2) * 40})`)
      })
    }
    if (phase === 'B') {
      // Le téléphone tombe en tournoyant, frappe le sol, l'écran éclate.
      const u = clamp((t - T_FALL) / (T_HIT - T_FALL))
      const after = t - T_HIT
      const bounce = after > 0 ? 60 * Math.exp(-after * 9) * Math.abs(Math.sin(after * 18)) : 0
      const y = lerp(560, 1200, ease.in2(u)) - bounce
      const rot = lerp(-20, 340, ease.in2(u)) + (after > 0 ? 8 * Math.exp(-after * 6) * Math.sin(after * 30) : 0)
      const sc = lerp(1.25, 0.95, u)
      const zin = ease.io3(clamp((t - T_IN) / 0.35))
      HOOK.B.setAttribute('transform', SHOT(lerp(540, 590, zin), lerp(960, y - 40, zin), 1 + 1.9 * zin, 0, hx, hy))
      HOOK.phone.setAttribute('transform', `translate(${lerp(560, 540, u)} ${y}) rotate(${rot}) scale(${sc})`)
      HOOK.ghosts.forEach((g, i) => {
        const uu = clamp(u - (i + 1) * 0.06)
        g.setAttribute('opacity', u < 1 && uu > 0 ? (0.12 - i * 0.03).toFixed(2) : 0)
        g.setAttribute('transform', `translate(${lerp(560, 540, uu)} ${lerp(560, 1200, ease.in2(uu))}) rotate(${lerp(-20, 340, ease.in2(uu))}) scale(${lerp(1.25, 0.95, uu)})`)
      })
      HOOK.shadow.setAttribute('opacity', (0.5 * u).toFixed(2))
      HOOK.shadow.setAttribute('rx', (120 + 120 * u).toFixed(0))
      ;[...HOOK.pCracks.querySelectorAll('path')].forEach((c, i) => c.setAttribute('stroke-dashoffset', 900 * (1 - prog(t, T_HIT + i * 0.01, 0.2, ease.out3))))
      HOOK.shards.forEach((s) => {
        const v = (t - T_HIT) / 0.7
        const on = v > 0 && v < 1
        s.el.setAttribute('opacity', on ? (1 - v).toFixed(2) : 0)
        if (on) s.el.setAttribute('transform', `translate(${540 + Math.cos(s.a) * s.v * v} ${1200 + Math.sin(s.a) * s.v * v + 600 * v * v}) rotate(${v * 600})`)
      })
    }
    if (phase === 'C') {
      // Le replay, à travers l'écran fissuré : le rembobinage, puis les dix minutes en accéléré.
      const rw = t < T_REPLAY
      const k = t - T_REPLAY
      if (rw) profPose(t, lerp(T_SLAP, 0.2, clamp((t - T_IN) / (T_REPLAY - T_IN))))
      else if (t < T_CRACK - 0.6) {
        // Au tableau, il encaisse : il se retourne, serre les poings, tremble.
        PROFP.update(t, { x: 540 + 6 * Math.sin(t * 2), y: 1180, scale: 0.8, brows: Math.sin(t * 1.3) > 0 ? 'angry' : 'sad', look: [0, 0.2], armR: [0.15, 0.45], armL: [0.15, 0.45], headNod: 0.05 * Math.sin(t * 3), seed: 2 })
      } else profPose(t, lerp(1.0, T_SLAP + 0.02, clamp((t - (T_CRACK - 0.6)) / 0.6 + 0) ** 1.5))
      HOOK.rwBandsH.forEach((b, i) => {
        const r = rng(Math.floor(t * 30) + i)
        b.setAttribute('y', r() * H)
        b.setAttribute('height', 10 + r() * 40)
        b.setAttribute('opacity', rw ? 0.3 : 0)
      })
      const z = rw ? 1.0 : 1.0 + 0.02 * k
      HOOK.Ccam.setAttribute('transform', SHOT(540, 1000, z, rw ? 2 * Math.sin(t * 40) : 0, (rw ? 30 * Math.sin(t * 70) : 0) + hx, hy))
      HOOK.rtimer.textContent = rw ? `09:${pad(57 - 57 * clamp((t - T_IN) / (T_REPLAY - T_IN)))}` : `${pad(Math.min(9, k * 1.6))}:${pad((k * 96) % 60)}`
      HOOK.bubbles.forEach((b, i) => {
        const t0 = Wd('02', 'insulter') - 0.2 + i * 0.32
        const v = popS(t, t0, Wd('02', 'filme') + 0.6 + i * 0.05, 0.25)
        show(b.g, v > 0.01)
        if (v > 0.01) place(b.g, b.x + 6 * Math.sin(t * 3 + i), b.y, 0.95 * v, b.rot)
      })
      HOOK.phonesUp.forEach((p) => {
        const v = ease.back(1.6)(clamp((t - (Wd('02', 'devant') - 0.15) - p.d) / 0.35))
        p.g.setAttribute('transform', `translate(${p.x} ${lerp(2200, 1560, v)}) rotate(${p.tilt})`)
      })
      ;[...HOOK.bigCracks.querySelectorAll('path')].forEach((c) => c.setAttribute('stroke-dashoffset', 0))
    }
    if (phase === 'D') {
      // La vidéo devient virale : compteurs, cœurs, puis le marteau du juge.
      profPose(t, T_SLAP + 0.02)
      const k = t - T_SOCIAL
      const intro = ease.out3(clamp(k / 0.35))
      const g = prog(t, T_GAVEL - 0.12, 0.12, ease.in3)
      const after = t - T_GAVEL
      const shake = after > 0 ? 20 * Math.exp(-after * 8) * Math.sin(after * 60) : 0
      HOOK.card.setAttribute('transform', `translate(${540 + shake} ${960 + lerp(400, 0, intro)}) scale(${lerp(0.6, 1, intro) - (after > 0 ? 0.04 * Math.exp(-after * 6) : 0)}) translate(-540 -960) rotate(${lerp(8, 0, intro)} 540 960)`)
      const views = clamp((t - (Wd('03', 'video') - 0.1)) / 1.3)
      HOOK.likeCount.textContent = fr(1200000 * ease.out3(views)).replace(/\s?\d{3}\s?\d{3}$/, ' K').replace(/^(\d+) K$/, '$1 K')
      HOOK.likeCount.textContent = views < 1 ? `${fr(1200 * ease.out3(views))} K` : '1,2 M'
      HOOK.comCount.textContent = `${fr(48 * ease.out3(views))} K`
      HOOK.shareCount.textContent = `${fr(310 * ease.out3(views))} K`
      HOOK.heartIcon.setAttribute('transform', `scale(${(0.9 + 0.15 * Math.max(0, Math.sin(t * 12)) ** 4).toFixed(3)})`)
      HOOK.hearts.forEach((h) => {
        const v = (k * 0.9 + h.ph) % 1
        h.el.setAttribute('opacity', k > 0.4 ? (0.9 * (1 - v)).toFixed(2) : 0)
        h.el.setAttribute('transform', `translate(${850 + h.dx * 12 + 30 * Math.sin(v * 8 + h.ph * 6)} ${980 - 700 * v}) scale(${0.35 + 0.3 * v})`)
      })
      show(HOOK.gavel, t > T_GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(980, 700, g)} ${lerp(120, 560, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
      HOOK.D.setAttribute('transform', SHOT(540, 960, 1 + 0.03 * k, 0, hx, hy))
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '11'
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
    prop(TRIB.minor, Wd('04', 'adulte') - 0.2, Wd('04', 'reste') - 0.2)
    prop(TRIB.content, Wd('07', 'enseigner') - 0.2, Wd('07', 'pas') - 0.15, 540, 680, 0.85)
    if (prop(TRIB.files, Wd('10', 'conseils') - 0.2, Wd('10', 'lecole') - 0.15) > 0) TRIB.files.zero.setAttribute('opacity', prog(t, Wd('10', 'zero') - 0.1, 0.15, ease.out3).toFixed(2))
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.prof.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'sad', look: [0.3, 0.2], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    VOTE.eleve.update(t, { x: 790, y: 1560, scale: 0.85, brows: 'angry', look: [-0.3, 0], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 0.7 })
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
  await Promise.all(PHOTOS.map(([el, href]) => new Promise((res) => {
    el.addEventListener('load', res, { once: true })
    el.addEventListener('error', res, { once: true })
    el.setAttribute('href', href)
  })))
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
