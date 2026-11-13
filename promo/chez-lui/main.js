/**
 * ============================================================================
 *  « Affaire Classée ? » — Chez lui (1080 × 1920)
 * ============================================================================
 *  Marc, 61 ans, a défoncé sa propre porte, changé les serrures et jeté dehors
 *  une famille de squatteurs (une mère et deux enfants) en plein novembre.
 *  Le hook : dix plans en quinze secondes, un par idée du narrateur (la porte,
 *  le chrono d'une heure, le calendrier de deux ans, Marc, la serrure, les
 *  affaires jetées, les enfants sous la pluie, novembre, le box). Le procès :
 *  avocats en costume, un dessin par argument, fond rouge sur les piques.
 *  Au milieu et à la fin : like + abonnement.
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




// Les personnages. Les avocats en costume ; Marc, le propriétaire ; la mère.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const MARC = { robe: '#6b2a22', jabot: false, collar: '#d9d2c3', hair: 'short', hairColor: '#8e8a84', skin: '#e9b48f', iris: '#3b2a1a' }
const MERE = { robe: '#4a6a8a', jabot: false, vneck: '#3a5674', hair: 'bob', hairColor: '#2a1810', female: true, skin: '#c98d68', iris: '#3b2a1a' }
grad('night', [[0, '#0b1024'], [0.6, '#16203a'], [1, '#1e2638']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lamp', [[0, '#ffd89a', 0.6], [1, '#ffd89a', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('doorG', [[0, '#7a4a2c'], [1, '#4e2c18']], { x1: 0, y1: 0, x2: 1, y2: 0 })
grad('greenG', [[0, '#0f3a24'], [1, '#05140c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('redG', [[0, '#4a0e12'], [1, '#14040a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('pauseBg', [[0, '#2a0a14'], [1, '#10121a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#3a1a14'], [1, '#0d0608']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitF', [[0, '#1a2a50'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })

const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)

// Un enfant en silhouette (avec un doudou, si teddy).
function kid(parent, { s = 1, color = '#e8eefc', teddy = false } = {}) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('path', { d: 'M -14 -60 L -18 0 M 14 -60 L 18 0', stroke: color, 'stroke-width': 20, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -32, y: -150, width: 64, height: 100, rx: 26, fill: color }, g)
  svg('circle', { cx: 0, cy: -178, r: 30, fill: color }, g)
  if (teddy) {
    const b = svg('g', { transform: 'translate(40 -90)' }, g)
    svg('circle', { cx: 0, cy: 0, r: 22, fill: '#b5793a' }, b)
    svg('circle', { cx: 0, cy: -30, r: 16, fill: '#b5793a' }, b)
    for (const x of [-12, 12]) svg('circle', { cx: x, cy: -42, r: 7, fill: '#b5793a' }, b)
  }
  return g
}
// Une façade la nuit, avec sa porte (qui peut s'ouvrir d'un coup).
function facade(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#night)' }, g)
  svg('rect', { x: 140, y: 300, width: 800, height: 1200, fill: '#3a3f4e' }, g)
  for (const [x, y] of [[200, 400], [740, 400]]) {
    svg('rect', { x, y, width: 140, height: 200, fill: '#ffcf7a', opacity: 0.25 }, g)
    svg('path', { d: `M ${x + 70} ${y} L ${x + 70} ${y + 200} M ${x} ${y + 100} L ${x + 140} ${y + 100}`, stroke: '#3a3f4e', 'stroke-width': 10 }, g)
  }
  svg('rect', { x: 400, y: 760, width: 280, height: 560, fill: '#0a0b10' }, g)
  svg('ellipse', { cx: 540, cy: 1040, rx: 160, ry: 300, fill: 'url(#lamp)', opacity: 0 }, g).classList.add('inside')
  const door = svg('g', { transform: 'translate(400 760)' }, g)
  svg('rect', { x: 0, y: 0, width: 280, height: 560, fill: 'url(#doorG)', stroke: '#2a160b', 'stroke-width': 8 }, door)
  for (const [x, y] of [[30, 40], [30, 300]]) svg('rect', { x, y, width: 220, height: 220, rx: 8, fill: 'none', stroke: '#2a160b', 'stroke-width': 6 }, door)
  svg('circle', { cx: 240, cy: 290, r: 14, fill: '#d9a441' }, door)
  svg('rect', { x: 0, y: 1320, width: W, height: 600, fill: '#1a1d26' }, g)
  svg('rect', { x: 0, y: 1320, width: W, height: 14, fill: '#2e3342' }, g)
  return { g, door }
}

// ------------------------------------------------- 1 · Le hook : une suite de plans courts, un par idée
const HOOK = scene('hook', (L) => {
  bg(L, '#06070c')
  const shot = (build) => {
    const g = svg('g', { display: 'none' }, L.actor)
    return { ...build(g), g }
  }
  // A · La porte défoncée.
  const A = shot((g) => {
    const f = facade(g)
    const chips = Array.from({ length: 14 }, (_, k) => ({ el: svg('rect', { width: 14 + (k % 4) * 8, height: 6, fill: '#c48a52' }, g), a: (k / 14) * Math.PI * 2, v: 400 + (k % 5) * 160 }))
    const marc = svg('g', {}, g)
    svg('rect', { x: -44, y: -250, width: 88, height: 170, rx: 30, fill: '#6b2a22' }, marc)
    svg('circle', { cx: 0, cy: -282, r: 38, fill: '#e9b48f' }, marc)
    svg('path', { d: 'M -14 -90 L -26 0', stroke: '#2a2f3a', 'stroke-width': 30, 'stroke-linecap': 'round' }, marc)
    const leg = svg('path', { stroke: '#2a2f3a', 'stroke-width': 30, 'stroke-linecap': 'round', fill: 'none' }, marc)
    return { ...f, chips, marc, leg }
  })
  // B · Le chrono : une heure.
  const B = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#greenG)' }, g)
    const c = svg('g', { transform: 'translate(540 820)' }, g)
    svg('circle', { r: 300, fill: '#10121a', stroke: '#7fd38a', 'stroke-width': 24 }, c)
    svg('rect', { x: -40, y: -360, width: 80, height: 50, rx: 12, fill: '#7fd38a' }, c)
    for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 -270 L 0 -240', stroke: '#7fd38a', 'stroke-width': 10, transform: `rotate(${k * 30})` }, c)
    const hand = svg('path', { d: 'M 0 20 L 0 -230', stroke: '#ffffff', 'stroke-width': 14, 'stroke-linecap': 'round' }, c)
    svg('circle', { r: 20, fill: '#ffffff' }, c)
    const sweepArc = svg('path', { fill: '#7fd38a', opacity: 0.35 }, c)
    return { hand, sweepArc }
  })
  // C · Le calendrier : deux ans.
  const C2 = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#redG)' }, g)
    const pages = Array.from({ length: 6 }, (_, k) => {
      const p = svg('g', {}, g)
      svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 26, fill: '#fbf7ef', stroke: '#10121a', 'stroke-width': 10 }, p)
      svg('rect', { x: -260, y: -300, width: 520, height: 130, rx: 26, fill: '#e5484d' }, p)
      const m = ['JANV.', 'MARS', 'JUIN', 'SEPT.', 'DÉC.', 'MARS'][k]
      txt(p, m, { y: -210, 'font-size': 70, fill: '#ffffff' })
      txt(p, String(2023 + Math.floor(k / 2.5)), { y: 60, 'font-size': 150, fill: '#10121a' })
      return p
    })
    return { pages }
  })
  // D · Marc, 61 ans, sous la pluie.
  const D = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#night)' }, g)
    svg('ellipse', { cx: 540, cy: 760, rx: 600, ry: 800, fill: 'url(#lamp)', opacity: 0.35 }, g)
    const marc = makePerson(g, MARC)
    return { marc }
  })
  // F · La serrure neuve.
  const F = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#doorG)' }, g)
    const lock = svg('g', { transform: 'translate(540 860)' }, g)
    svg('rect', { x: -170, y: -320, width: 340, height: 640, rx: 60, fill: '#c9cfd8', stroke: '#10121a', 'stroke-width': 12 }, lock)
    svg('circle', { cy: -100, r: 110, fill: '#9aa3b0', stroke: '#10121a', 'stroke-width': 10 }, lock)
    const key = svg('g', { transform: 'translate(0 -100)' }, lock)
    svg('rect', { x: -14, y: -60, width: 28, height: 120, rx: 8, fill: '#10121a' }, key)
    const bow = svg('g', {}, lock)
    svg('rect', { x: -26, y: -260, width: 52, height: 170, rx: 10, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 8 }, bow)
    svg('circle', { cy: -300, r: 70, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 8 }, bow)
    svg('circle', { cy: -300, r: 22, fill: '#6b4a1a' }, bow)
    const glint = svg('path', { d: 'M 0 -60 L 14 -14 L 60 0 L 14 14 L 0 60 L -14 14 L -60 0 L -14 -14 Z', fill: '#ffffff', opacity: 0 }, lock)
    return { key, bow, glint }
  })
  // G · La famille jetée dehors : matelas, sacs, jouets qui volent.
  const G = shot((g) => {
    const f = facade(g)
    const items = [
      ['M -110 -30 L 110 -30 L 110 30 L -110 30 Z', '#d9d2c3'],
      ['M -50 -40 L 50 -40 L 60 40 L -60 40 Z', '#3b82f6'],
      ['M -40 -40 L 40 -40 L 50 40 L -50 40 Z', '#e5484d'],
      ['M -26 -26 L 26 -26 L 26 26 L -26 26 Z', '#ffd166'],
      ['M -60 -20 L 60 -20 L 60 20 L -60 20 Z', '#7fd38a'],
    ].map(([d, fill], k) => ({ el: svg('path', { d, fill, stroke: '#10121a', 'stroke-width': 6 }, g), k }))
    return { ...f, items }
  })
  // H · Deux enfants, sous la pluie, la nuit.
  const Hs = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#night)' }, g)
    svg('path', { d: 'M 760 200 L 760 1400', stroke: '#2e3342', 'stroke-width': 26 }, g)
    svg('ellipse', { cx: 760, cy: 260, rx: 380, ry: 600, fill: 'url(#lamp)', opacity: 0.5 }, g)
    svg('rect', { x: -100, y: 1400, width: W + 200, height: 600, fill: '#1a1d26' }, g)
    const k1 = kid(g, { s: 2.2, color: '#c9d6f0', teddy: true })
    const k2 = kid(g, { s: 1.7, color: '#a9bce0' })
    const bags = svg('g', {}, g)
    svg('path', { d: 'M 120 1400 L 360 1400 L 330 1300 L 150 1300 Z', fill: '#d9d2c3', stroke: '#10121a', 'stroke-width': 6 }, bags)
    svg('rect', { x: 820, y: 1310, width: 140, height: 90, rx: 14, fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 6 }, bags)
    return { k1, k2 }
  })
  // I · Novembre.
  const I = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#0d1a2e' }, g)
    const p = svg('g', { transform: 'translate(540 800)' }, g)
    svg('rect', { x: -300, y: -340, width: 600, height: 680, rx: 30, fill: '#fbf7ef', stroke: '#10121a', 'stroke-width': 12 }, p)
    svg('rect', { x: -300, y: -340, width: 600, height: 150, rx: 30, fill: '#3b82f6' }, p)
    txt(p, 'NOVEMBRE', { y: -240, 'font-size': 80, fill: '#ffffff' })
    txt(p, '4°C', { y: 80, 'font-size': 200, fill: '#3b82f6' })
    txt(p, 'PLUIE', { y: 230, 'font-size': 70, fill: '#6b7280' })
    return {}
  })
  // J · Marc dans le box : la prison.
  const J = shot((g) => {
    svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#court)' }, g)
    svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, g)
    const marc = makePerson(g, MARC)
    const bars = svg('g', {}, g)
    for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)' }, bars)
    svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, bars)
    return { marc, bars }
  })
  // La pluie, par-dessus tout le hook.
  const r = rng(61)
  const rain = Array.from({ length: 70 }, () => ({ el: svg('path', { stroke: '#cfe0ff', 'stroke-width': 3, opacity: 0.35 }, L.front), x: r() * 1400 - 160, y: r() * 2200, v: 1600 + r() * 900, l: 40 + r() * 50 }))
  return { A, B, C: C2, D, F, G, H: Hs, I, J, rain }
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
  // 03 : deux enfants sur le trottoir, sous la pluie.
  const kids = prop((g) => {
    panel(g, 700, 380)
    svg('rect', { x: -340, y: 120, width: 680, height: 50, fill: '#2e3342' }, g)
    kid(g, { s: 0.9, teddy: true }).setAttribute('transform', 'translate(-120 130) scale(0.9)')
    kid(g, { s: 0.75, color: '#a9bce0' }).setAttribute('transform', 'translate(0 130) scale(0.75)')
    for (let k = 0; k < 14; k++) svg('path', { d: `M ${-320 + k * 48} ${-160 + (k % 3) * 40} l -14 50`, stroke: '#9fd0ff', 'stroke-width': 5, opacity: 0.7 }, g)
    txt(g, 'NOV.', { x: 220, y: 20, 'font-size': 70, fill: '#ffffff' })
  })
  // 04 : le gendarme et sa phrase.
  const gend = prop((g) => {
    panel(g, 860, 420, '#3b82f6')
    const h = svg('g', { transform: 'translate(-280 120)' }, g)
    svg('rect', { x: -60, y: -200, width: 120, height: 200, rx: 40, fill: '#1f2c4a' }, h)
    svg('circle', { cx: 0, cy: -240, r: 52, fill: '#e8bb98' }, h)
    svg('path', { d: 'M -60 -270 L 60 -270 L 50 -320 L -50 -320 Z', fill: '#1f2c4a' }, h)
    svg('rect', { x: -66, y: -276, width: 132, height: 14, fill: '#d9a441' }, h)
    svg('path', { d: 'M -120 -150 L 380 -150 Q 400 -150 400 -130 L 400 60 Q 400 80 380 80 L -80 80 L -120 120 L -110 80 L -130 80 Q -150 80 -150 60 L -150 -130 Q -150 -150 -130 -150 Z', fill: '#ffffff', transform: 'translate(-30 -40) scale(0.98)' }, g)
    txt(g, '« VOUS N’AVEZ', { x: 120, y: -110, 'font-size': 46, fill: '#10121a' })
    txt(g, 'PAS LE DROIT', { x: 120, y: -50, 'font-size': 46, fill: '#10121a' })
    txt(g, 'D’ENTRER', { x: 120, y: 10, 'font-size': 46, fill: '#10121a' })
    txt(g, 'CHEZ LUI. »', { x: 120, y: 70, 'font-size': 46, fill: '#e5484d' })
  })
  // 07 : deux potes et une barre de fer.
  const thugs = prop((g) => {
    panel(g, 760, 400, '#e5484d')
    for (const x of [-200, -40]) {
      const h = svg('g', { transform: `translate(${x} 170) scale(0.62)` }, g)
      svg('rect', { x: -44, y: -250, width: 88, height: 170, rx: 30, fill: '#c9d2e6' }, h)
      svg('circle', { cx: 0, cy: -282, r: 38, fill: '#c9d2e6' }, h)
      svg('path', { d: 'M -14 -90 L -26 0 M 16 -90 L 28 0', stroke: '#c9d2e6', 'stroke-width': 30, 'stroke-linecap': 'round' }, h)
    }
    svg('path', { d: 'M 60 -120 L 160 140', stroke: '#9aa6c4', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
    txt(g, '?', { x: 270, y: 50, 'font-size': 180, fill: '#e5484d' })
  })
  // 09 : occupant / criminel.
  const versus = prop((g) => {
    panel(g, 900, 420)
    svg('path', { d: 'M 0 -180 L 0 180', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.4 }, g)
    txt(g, 'SQUATTEUR', { x: -220, y: -110, 'font-size': 52, fill: '#ffffff' })
    txt(g, 'PROPRIÉTAIRE', { x: 220, y: -110, 'font-size': 52, fill: '#ffffff' })
    for (const x of [-220, 220]) {
      svg('rect', { x: x - 40, y: -60, width: 80, height: 110, rx: 18, fill: '#c9cfd8', stroke: '#10121a', 'stroke-width': 6 }, g)
      svg('circle', { cx: x, cy: -20, r: 18, fill: '#10121a' }, g)
    }
    g.left = txt(g, 'OCCUPANT', { x: -220, y: 140, 'font-size': 64, fill: '#7fd38a' })
    g.right = txt(g, 'CRIMINEL', { x: 220, y: 140, 'font-size': 64, fill: '#ff6b5e' })
  })
  // 10 : la mère et ses enfants, dans la voiture.
  const car = prop((g) => {
    panel(g, 760, 380)
    svg('path', { d: 'M -300 80 L -300 0 Q -280 -40 -200 -50 L -120 -130 L 140 -130 L 220 -50 Q 300 -40 300 0 L 300 80 Z', fill: '#3a4250', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('path', { d: 'M -100 -110 L 0 -110 L 0 -50 L -160 -50 Z M 20 -110 L 130 -110 L 190 -50 L 20 -50 Z', fill: '#9fc6ff', opacity: 0.8 }, g)
    for (const x of [-50, 60, 120]) svg('circle', { cx: x, cy: -76, r: x < 0 ? 20 : 14, fill: '#2a1810' }, g)
    for (const x of [-180, 180]) svg('circle', { cx: x, cy: 90, r: 50, fill: '#10121a', stroke: '#9aa6c4', 'stroke-width': 10 }, g)
    txt(g, 'Z Z z', { x: 230, y: -150, 'font-size': 48, fill: '#ffd166' })
  })
  // 12 : la porte cassée.
  const broken = prop((g) => {
    panel(g, 600, 420)
    svg('rect', { x: -110, y: -170, width: 220, height: 340, fill: '#0a0b10' }, g)
    svg('path', { d: 'M -110 -170 L 70 -150 L 40 -20 L 90 30 L 60 170 L -110 170 Z', fill: 'url(#doorG)', stroke: '#2a160b', 'stroke-width': 8 }, g)
    svg('path', { d: 'M 40 -20 L 90 30 M 70 -150 L 40 -20', stroke: '#ffd166', 'stroke-width': 6 }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, kids, gend, thugs, versus, car, broken }
})

// ------------------------------------------------- 3 · Le vote : Marc face à la mère
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitF)' }, L.far)
  const marc = makePerson(L.actor, MARC)
  const mere = makePerson(L.actor, MERE)
  kid(L.actor, { s: 0.9, teddy: true }).setAttribute('transform', 'translate(960 1700) scale(0.9)')
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { marc, mere }
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




// ------------------------------------------------------------------ le hook : les plans
const T_KICK = 0.12 // la porte vole en éclats
const T_KICK2 = Wd('02', 'defonce') - 0.08
const SHOTS = [
  ['A', 0, Wd('01', 'en') - 0.05],
  ['B', Wd('01', 'en') - 0.05, Wd('01', 'la') - 0.05],
  ['C', Wd('01', 'la') - 0.05, S('02') - 0.1],
  ['D', S('02') - 0.1, Wd('02', 'a') - 0.05],
  ['A', Wd('02', 'a') - 0.05, Wd('02', 'change') - 0.05],
  ['F', Wd('02', 'change') - 0.05, Wd('02', 'et') - 0.05],
  ['G', Wd('02', 'et') - 0.05, Wd('02', 'avec') - 0.05],
  ['H', Wd('02', 'avec') - 0.05, Wd('02', 'en') - 0.05],
  ['I', Wd('02', 'en') - 0.05, Wd('02', 'aujourdhui') - 0.05],
  ['J', Wd('02', 'aujourdhui') - 0.05, SEC.hook.t1],
]
const shotAt = (t) => SHOTS.findLast((s) => t >= s[1]) ?? SHOTS[0]
const HOT = [
  [Wd('04', 'chez', 1) - 0.05, Wd('04', 'dans') - 0.05],
  [Wd('06', 'vous', 2) - 0.1, E('06') + 0.1],
  [S('09') - 0.05, Wd('09', 'le') - 0.1],
  [Wd('09', 'justice') - 0.1, E('09') + 0.1],
  [S('13') - 0.05, Wd('13', 'cest') - 0.05],
]
const hotAt = (t) => HOT.find(([a, b]) => t >= a && t < b)
const LIKE = '<svg viewBox="0 0 24 24" width="84" height="84" style="vertical-align:middle;margin-right:20px"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#fe2c55"/></svg>LIKE'

// Le hook.
const sh = (k) => SHOTS.filter((s) => s[0] === k)
fs(tag('EN 1 HEURE', 'slam yellow', { t0: sh('B')[0][1], t1: sh('B')[0][2] - 0.05, y: 300, rot: -3, from: 2.6, dur: 0.18 }), 130)
tag('LA JUSTICE : « ATTENDEZ »', 'pill', { t0: sh('C')[0][1], t1: Wd('01', 'deux') - 0.15, y: 300, rot: -2 })
fs(tag('2 ANS', 'slam red', { t0: Wd('01', 'deux') - 0.1, t1: sh('C')[0][2] - 0.05, y: 300, rot: -4, from: 2.8, dur: 0.18 }), 170)
tag('MARC · 61 ANS · PROPRIÉTAIRE', 'pill yellow', { t0: sh('D')[0][1] + 0.05, t1: sh('D')[0][2] - 0.05, y: 300, rot: -2 })
tag('SA PROPRE PORTE', 'pill red', { t0: sh('A')[1][1] + 0.05, t1: sh('A')[1][2] - 0.05, y: 300, rot: 2 })
tag('SERRURES CHANGÉES', 'pill', { t0: sh('F')[0][1] + 0.05, t1: sh('F')[0][2] - 0.05, y: 300, rot: -2 })
tag('UNE FAMILLE À LA RUE', 'pill red', { t0: sh('G')[0][1] + 0.05, t1: sh('G')[0][2] - 0.05, y: 300, rot: 2 })
fs(tag('2 ENFANTS', 'slam white', { t0: sh('H')[0][1] + 0.05, t1: sh('H')[0][2] - 0.05, y: 300, rot: -3, from: 2.4, dur: 0.18 }), 140)
fs(tag('C’EST LUI QUI RISQUE LA PRISON', 'stamp', { t0: Wd('02', 'risque') - 0.3, t1: SEC.hook.t1, y: 340, rot: -5, from: 2.8, dur: 0.2 }), 58)
// Le procès.
fs(tag('« RENTRER CHEZ LUI »', 'slam yellow', { t0: Wd('03', 'rentrer') - 0.15, t1: E('03') + 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 84)
fs(tag('CHEZ LUI !', 'slam red', { t0: Wd('04', 'chez', 1) - 0.05, t1: Wd('04', 'dans') - 0.05, y: 560, rot: -5, from: 3, dur: 0.15 }), 160)
tag('SA MAISON · 20 ANS DE CRÉDIT', 'pill yellow', { t0: Wd('04', 'dans') - 0.1, t1: E('04') + 0.1, y: 300, rot: -2 })
tag('UNE PROCÉDURE', 'pill', { t0: Wd('05', 'procedure') - 0.15, t1: Wd('05', 'mais') - 0.1, y: 300, rot: -3 })
tag('UN PRÉFET', 'pill', { t0: Wd('05', 'prefet') - 0.15, t1: Wd('05', 'mais') - 0.1, y: 430, rot: 2 })
tag('UN JUGE', 'pill', { t0: Wd('05', 'juge') - 0.15, t1: Wd('05', 'mais') - 0.1, y: 560, rot: -2 })
fs(tag('PRESSÉ.', 'slam yellow', { t0: Wd('05', 'presse') - 0.15, t1: E('05') + 0.1, y: 430, rot: -4, from: 2.8, dur: 0.18 }), 150)
counterTag(Wd('06', '22') - 0.1, Wd('06', 'vous') - 0.1, 22, 'MOIS DE CRÉDIT', { y: 330, dur: 0.5 })
fs(tag('« VOUS, VOUS ÊTES LOGÉ. »', 'slam red', { t0: Wd('06', 'vous', 2) - 0.1, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 62)
tag('LA LOI DU PLUS FORT ?', 'pill red', { t0: Wd('07', 'deux') - 0.15, t1: E('07') + 0.1, y: 300, rot: -2 })
fs(tag('PROPRIÉTAIRE OU DÉLINQUANT ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.1, y: 600, from: 1.4, dur: 0.3 }), 56)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.1, y: 860, from: 2.2, dur: 0.25 }), 96)
const sub1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.05, t1: E('08') + 0.1, y: 1060, from: 2.2, dur: 0.25 }), 96)
fs(tag('ON MARCHE SUR LA TÊTE !', 'slam white', { t0: S('09') - 0.05, t1: Wd('09', 'le') - 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 78)
fs(tag('JUSTICE À DEUX VITESSES', 'slam red', { t0: Wd('09', 'justice') - 0.1, t1: E('09') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 66)
counterTag(Wd('10', 'trois') - 0.1, Wd('10', 'vide', 1) - 0.15, 3, 'MOIS DANS UNE VOITURE', { y: 330, dur: 0.4 })
fs(tag('VIDE. DEPUIS 2 ANS.', 'slam yellow', { t0: Wd('10', 'vide', 1) - 0.1, t1: E('10') + 0.1, y: 430, rot: -3, from: 2.6, dur: 0.18 }), 82)
fs(tag('EN VENTE · POUR L’EHPAD DE SA MÈRE', 'pill yellow', { t0: Wd('11', 'vente') - 0.15, t1: Wd('11', 'proprietaire') - 0.1, y: 300, rot: -2 }), 48)
fs(tag('PROPRIÉTAIRE, PAS RICHE.', 'slam white', { t0: Wd('11', 'proprietaire') - 0.1, t1: Wd('11', 'ca', 1) - 0.1, y: 430, rot: -3, from: 2.4, dur: 0.18 }), 68)
tag('40 ANS DEBOUT À 5 H', 'pill', { t0: Wd('11', '40') - 0.1, t1: E('11') + 0.1, y: 300, rot: 2 })
counterTag(Wd('12', 'six') - 0.1, E('12') + 0.1, 6, 'ANS', { y: 330, dur: 0.3 })
fs(tag('RELOGEZ-LA !', 'slam red', { t0: S('13') - 0.05, t1: Wd('13', 'cest') - 0.05, y: 560, rot: -4, from: 3, dur: 0.15 }), 118)
tag('C’EST LE TRAVAIL DE L’ÉTAT', 'pill yellow', { t0: Wd('13', 'travail') - 0.15, t1: E('13') + 0.1, y: 300, rot: -2 })
tag('JUGE', 'pill', { t0: Wd('14', 'juge') - 0.15, t1: Wd('14', 'et', 1) - 0.1, y: 300, rot: -3 })
tag('POLICIER', 'pill', { t0: Wd('14', 'policier') - 0.15, t1: Wd('14', 'et', 1) - 0.1, y: 420, rot: 2 })
tag('HUISSIER', 'pill', { t0: Wd('14', 'huissier') - 0.15, t1: Wd('14', 'et', 1) - 0.1, y: 540, rot: -2 })
fs(tag('IL A CONDAMNÉ UNE ENFANT.', 'slam white', { t0: Wd('14', 'condamne') - 0.3, t1: E('14') + 0.3, y: 430, rot: -2, from: 2.2, dur: 0.2 }), 62)
// Le vote, le like, l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('15') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('LÉGITIME COLÈRE ?', 'vote blue', { t0: Wd('15', 'legitime') - 0.1, t1: Wd('15', 'coupable') - 0.2, y: 470, rot: -3 }), 74)
fs(tag('VENGEANCE PRIVÉE ?', 'vote red', { t0: Wd('15', 'vengeance') - 0.1, t1: Wd('15', 'coupable') - 0.2, y: 620, rot: 3 }), 74)
fs(tag('COUPABLE', 'vote red', { t0: Wd('15', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('15', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('16', 'ecris') - 0.1, y: 780 }), 42)
const like2 = fs(tag(LIKE, 'subscribe like', { t0: Wd('16', 'like') - 0.1, y: 930, from: 2.2, dur: 0.25 }), 84)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('16', 'abonnement') - 0.1, y: 1100, from: 2.2, dur: 0.25 }), 84)
for (const b of [like1, sub1, like2, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE' }

// Gros sous-titres animés (pas sur les appels à liker et s'abonner : les boutons le disent).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['08-pause', '16-abonne'].includes(l.id))) {
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
  [T_KICK, 24],
  ...SHOTS.slice(1).map((s) => [s[1], 10]),
  [T_KICK2, 18],
  [sh('J')[0][1] + 0.35, 14],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('05', 'presse') - 0.15, 8],
  [Wd('10', 'vide', 1) - 0.1, 8],
  [Wd('14', 'condamne') - 0.3, 12],
  [Wd('15', 'jure') - 0.15, 8],
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
const ITEM_X = [200, 880, 330, 700, 520]

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const [id, s0, s1] = shotAt(t)
    const k = t - s0
    for (const key of ['A', 'B', 'C', 'D', 'F', 'G', 'H', 'I', 'J']) show(HOOK[key].g, key === id)
    // Chaque plan entre par un coup de zoom.
    const punch = 0.16 * Math.exp(-k * 7)
    const hand = id === 'A' || id === 'G' ? 6 : 3
    const zooms = { A: [1.05, 560, 1050], B: [1, 540, 860], C: [1, 540, 880], D: [1, 540, 1000], F: [1, 540, 900], G: [1.0, 540, 1100], H: [1.05, 500, 1150], I: [1, 540, 860], J: [1.04, 540, 980] }
    const [z, cx, cy] = zooms[id]
    cam(HOOK, t, { zoom: z + punch + 0.03 * k, cx, cy, push: 0, hand })
    if (id === 'A') {
      const kick = s0 < 1 ? T_KICK : T_KICK2
      const o = ease.out3(clamp((t - kick) / 0.18))
      HOOK.A.door.setAttribute('transform', `translate(400 760) scale(${(1 - 0.86 * o).toFixed(3)} 1)`)
      HOOK.A.g.querySelector('.inside').setAttribute('opacity', (0.8 * o).toFixed(2))
      HOOK.A.chips.forEach((c) => {
        const v = (t - kick) / 0.7
        const on = v > 0 && v < 1
        c.el.setAttribute('opacity', on ? (1 - v).toFixed(2) : 0)
        if (on) c.el.setAttribute('transform', `translate(${560 + Math.cos(c.a) * c.v * v} ${1040 + Math.sin(c.a) * c.v * v + 400 * v * v}) rotate(${v * 720})`)
      })
      // Marc, de dos : il arme la jambe, il frappe.
      const kk = clamp((t - kick + 0.12) / 0.12)
      HOOK.A.marc.setAttribute('transform', `translate(${lerp(210, 290, o)} 1700) scale(1.7)`)
      HOOK.A.leg.setAttribute('d', `M 16 -90 L ${lerp(20, 120, kk)} ${lerp(0, -110, kk)}`)
    }
    if (id === 'B') {
      const u = clamp(k / (s1 - s0))
      HOOK.B.hand.setAttribute('transform', `rotate(${(u * 1440).toFixed(1)})`)
      const a = Math.min(359.9, u * 360) * Math.PI / 180
      HOOK.B.sweepArc.setAttribute('d', `M 0 0 L 0 -270 A 270 270 0 ${a > Math.PI ? 1 : 0} 1 ${(270 * Math.sin(a)).toFixed(1)} ${(-270 * Math.cos(a)).toFixed(1)} Z`)
    }
    if (id === 'C') {
      const idx = Math.min(5, Math.floor(k / 0.36))
      HOOK.C.pages.forEach((p, i) => {
        const gone = i < idx
        const fly = gone ? clamp((k - (i + 1) * 0.36) / 0.25 + 1) : 0
        p.setAttribute('display', i <= idx ? 'inline' : 'none')
        p.setAttribute('transform', `translate(${540 + 30 * (5 - i) * 0} ${820 - 1400 * ease.in3(fly)}) rotate(${-20 * fly}) scale(${1 - 0.02 * (5 - i)})`)
      })
      // La dernière page reste devant.
      HOOK.C.pages.slice().reverse().forEach((p) => p.parentNode.append(p))
    }
    if (id === 'D') HOOK.D.marc.update(t, { x: 540, y: 1250, scale: 1.5, brows: 'angry', look: [0.3, 0.1], armR: [0.12, 0.5], armL: [0.12, 0.5], seed: 0.8 })
    if (id === 'F') {
      const tu = ease.out3(clamp((k - 0.15) / 0.35))
      HOOK.F.key.setAttribute('transform', `translate(0 -100) rotate(${90 * tu})`)
      HOOK.F.bow.setAttribute('transform', `rotate(${90 * tu} 0 -100)`)
      HOOK.F.glint.setAttribute('opacity', (k > 0.55 ? Math.max(0, 1 - (k - 0.55) / 0.3) : 0).toFixed(2))
      HOOK.F.glint.setAttribute('transform', `translate(120 -260) scale(${1 + k})`)
    }
    if (id === 'G') {
      HOOK.G.door.setAttribute('transform', 'translate(400 760) scale(0.14 1)')
      HOOK.G.g.querySelector('.inside').setAttribute('opacity', 0.8)
      HOOK.G.items.forEach((it, i) => {
        const v = clamp((k - i * 0.22) / 0.55)
        const on = k - i * 0.22 > 0
        it.el.setAttribute('display', on ? 'inline' : 'none')
        if (!on) return
        const x = lerp(540, ITEM_X[i], v)
        const y = lerp(1040, 1380 + (i % 2) * 40, v) - 380 * Math.sin(Math.PI * v)
        it.el.setAttribute('transform', `translate(${x} ${y}) rotate(${(v * 400 * (i % 2 ? 1 : -1)).toFixed(0)}) scale(${lerp(0.6, 1.3, v)})`)
      })
    }
    if (id === 'H') {
      HOOK.H.k1.setAttribute('transform', `translate(${380 + 3 * Math.sin(t * 20)} 1420) scale(2.2)`)
      HOOK.H.k2.setAttribute('transform', `translate(${620 + 3 * Math.sin(t * 23 + 1)} 1420) scale(1.7)`)
    }
    if (id === 'J') {
      HOOK.J.marc.update(t, { x: 540, y: 1230, scale: 1.4, brows: 'sad', look: [0, 0.3], headNod: 0.1, armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 1.2 })
      const fall = prog(t, s0 + 0.25, 0.35, ease.back(1.4))
      HOOK.J.bars.setAttribute('transform', `translate(0 ${lerp(-2300, 0, fall)})`)
    }
    for (const d of HOOK.rain) {
      const y = ((d.y + t * d.v) % 2300) - 200
      d.el.setAttribute('d', `M ${d.x + y * 0.12} ${y} l ${d.l * 0.12} ${d.l}`)
    }
    show(HOOK.L.front, ['A', 'D', 'G', 'H'].includes(id))
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '12' || id === '14'
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
    } else cam(TRIB, t, { zoom: (grave ? 1.08 : 1.0) + 0.25 * hk + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 820, hk), push: grave ? 0.035 : 0.02, from: l.start - 0.12, rot: side * 0.6 + hk * side * -3 })
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
    prop(TRIB.kids, Wd('03', 'deux') - 0.15, Wd('03', 'rentrer') - 0.2)
    prop(TRIB.gend, Wd('04', 'monsieur') - 0.2, Wd('04', 'chez', 1) - 0.1, 540, 660, 0.85)
    prop(TRIB.thugs, Wd('07', 'sinon') - 0.15, E('07') + 0.1)
    if (prop(TRIB.versus, Wd('09', 'squatteur') - 0.15, Wd('09', 'justice') - 0.15, 540, 680, 0.85) > 0) {
      TRIB.versus.left.setAttribute('opacity', prog(t, Wd('09', 'occupant') - 0.1, 0.15, ease.out3).toFixed(2))
      TRIB.versus.right.setAttribute('opacity', prog(t, Wd('09', 'criminel') - 0.1, 0.15, ease.out3).toFixed(2))
    }
    prop(TRIB.car, Wd('10', 'voiture') - 0.2, Wd('10', 'vide', 1) - 0.15)
    prop(TRIB.broken, Wd('12', 'porte') - 0.25, E('12') + 0.1)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.marc.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'angry', look: [0.3, 0.1], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    VOTE.mere.update(t, { x: 790, y: 1560, scale: 0.85, brows: 'sad', look: [-0.3, 0.2], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 0.7 })
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
  updateGrain(t, cur === HOOK ? 20 : 14)
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
