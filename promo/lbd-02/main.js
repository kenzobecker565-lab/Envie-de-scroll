/**
 * ============================================================================
 *  « Affaire Classée ? » — le tir (LBD), épisode 2/2 « Le verdict » (1080 × 1920)
 * ============================================================================
 *  1. La caméra-piéton du policier, « image jamais vue » : le pavé de Théo
 *     retombe à 2 m de la ligne ; au ralenti, une autre pierre, venue de
 *     derrière, frappe le collègue ; le lanceur, jamais identifié.
 *  2. Le procès : la défense (« qu'auriez-vous cru ? »), le procureur
 *     (« j'aurais regardé »). Les avocats sont en costume.
 *  3. Carton « abonne-toi », puis Théo (bandeau sur l'œil) et le policier
 *     dans le box, chacun seul ; le verdict ; le vote et l'abonnement.
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


// Les personnages. Les avocats en costume (veste, chemise, cravate).
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const FLIC = { robe: '#1f2c4a', jabot: false, collar: '#9fb8de', hair: 'short', hairColor: '#3a2a1e', skin: '#e8bb98', iris: '#3b2a1a' }
const THEO = { robe: '#3f5a7a', jabot: false, hair: 'messy', hairColor: '#4a2e1c', skin: '#f0c09a', iris: '#3b2a1a' }
grad('bodycam', [[0, '#9fe0c0', 0.1], [1, '#0a1a14', 0.25]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('camVig', [[0.5, '#000', 0], [0.85, '#000', 0.55], [1, '#000', 0.95]], { cx: 0.5, cy: 0.5, r: 0.72 })
grad('pauseRay', [[0, '#fe2c55', 0.25], [1, '#fe2c55', 0]], { x1: 0, y1: 1, x2: 0, y2: 0 })
grad('wood', [[0, '#8a5634'], [1, '#4e2c18']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitL', [[0, '#3a1a22'], [1, '#0d0608']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitR', [[0, '#1a2550'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
{
  const p = svg('pattern', { id: 'scan', width: 8, height: 8, patternUnits: 'userSpaceOnUse' }, defs)
  svg('rect', { width: 8, height: 3, fill: '#000', opacity: 0.35 }, p)
}

// Bandeau sur l'œil gauche de Théo (il suit la tête).
function eyePatch(person) {
  const g = svg('g', {}, person.head)
  svg('path', { d: 'M -150 -205 C -60 -150 60 -150 150 -100', fill: 'none', stroke: '#121318', 'stroke-width': 12 }, g)
  svg('ellipse', { cx: 58, cy: -138, rx: 50, ry: 44, fill: '#16171d' }, g)
  svg('ellipse', { cx: 44, cy: -152, rx: 18, ry: 10, fill: '#ffffff', opacity: 0.12 }, g)
  return g
}

// Un panneau d'illustration (fond sombre, liseré jaune).
const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)

// ------------------------------------------------- 1 · La caméra-piéton
const CAM = scene('cam', (L) => {
  bg(L, 'url(#streetGas)')
  const r = rng(23)
  // La rue en perspective : immeubles, fenêtres, lampadaires.
  for (let i = 0; i < 9; i++) {
    const x = -160 + i * 150
    const h = 380 + r() * 300
    svg('rect', { x, y: 1000 - h, width: 150, height: h + 20, fill: i % 2 ? '#0e1426' : '#111830' }, L.far)
    for (let j = 0; j < 6; j++) for (let k = 0; k < 3; k++) if (r() < 0.35) svg('rect', { x: x + 18 + k * 44, y: 1030 - h + j * 62, width: 22, height: 32, fill: '#ffcf7a', opacity: 0.4 }, L.far)
  }
  svg('rect', { x: -400, y: 990, width: W + 800, height: 1400, fill: '#1a1f2c' }, L.far)
  for (let k = -8; k <= 8; k++) svg('path', { d: `M ${540 + k * 40} 990 L ${540 + k * 260} 2000`, stroke: '#232a3a', 'stroke-width': 5 }, L.far)
  for (let k = 0; k < 8; k++) svg('path', { d: `M -400 ${1010 + k * k * 16} L ${W + 400} ${1010 + k * k * 16}`, stroke: '#232a3a', 'stroke-width': 4 }, L.far)
  svg('ellipse', { cx: 880, cy: 1000, rx: 520, ry: 360, fill: 'url(#flare)', opacity: 0.6 }, L.far)
  const flares = [fire(L.mid, 980, 1060, 0.3, 41), fire(L.mid, 160, 1050, 0.22, 43)]
  // La foule au loin, la banderole.
  const crowd = Array.from({ length: 11 }, (_, k) => {
    const g = svg('g', {}, L.mid)
    svg('circle', { cx: 0, cy: -230, r: 30, fill: '#0c0f1c' }, g)
    svg('rect', { x: -38, y: -200, width: 76, height: 200, rx: 28, fill: '#0c0f1c' }, g)
    return { g, x: 120 + k * 88 + (k % 2) * 20, y: 1120 + (k % 3) * 14, ph: r() * 6, s: 0.5 + (k % 3) * 0.04 }
  })
  const banner = svg('g', { transform: 'translate(560 900) rotate(-3) scale(0.5)' }, L.mid)
  svg('rect', { x: -230, y: -60, width: 460, height: 120, rx: 8, fill: '#f4efe2', stroke: '#10121a', 'stroke-width': 5 }, banner)
  txt(banner, 'JUSTICE !', { x: 0, y: 22, 'font-size': 64, fill: '#c43a2f' })
  // Le lanceur inconnu, au fond, capuche.
  const other = thrower(L.mid, { rim: '#ff8a3d' })
  // Théo, à six mètres.
  svg('ellipse', { cx: 560, cy: 1150, rx: 360, ry: 460, fill: 'url(#spot)', opacity: 0.9 }, L.mid)
  const theo = thrower(L.actor)
  const stone = pave(L.fx, 1)
  const trail = Array.from({ length: 5 }, () => pave(L.fx, 1))
  const stone2 = pave(L.fx, 1)
  const path2 = svg('path', { fill: 'none', stroke: '#ff4d4f', 'stroke-width': 10, 'stroke-dasharray': '26 18', 'stroke-linecap': 'round', opacity: 0 }, L.fx)
  // Premier plan : le collègue (bouclier), le canon du LBD de celui qui filme.
  const coll = cop(L.front)
  // Repères de l'enquête : cercles rouges, mesure « 2 M », point d'interrogation.
  const ring = svg('circle', { r: 0, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 12, opacity: 0 }, L.fx)
  const ring2 = svg('circle', { r: 0, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 12, opacity: 0 }, L.fx)
  const meas = svg('g', { opacity: 0 }, L.fx)
  svg('path', { d: 'M -420 0 L 420 0', stroke: '#9fd0ff', 'stroke-width': 8, 'stroke-dasharray': '24 14' }, meas)
  txt(meas, 'LIGNE DE POLICE', { x: 0, y: 56, 'font-size': 38, fill: '#9fd0ff', stroke: '#10121a', 'stroke-width': 8, 'paint-order': 'stroke fill' })
  const measArrow = svg('path', { fill: 'none', stroke: '#ffd166', 'stroke-width': 10, 'stroke-linecap': 'round' }, L.fx)
  const measTxt = txt(L.fx, '2 M', { 'font-size': 92, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 14, 'paint-order': 'stroke fill', opacity: 0 })
  const qmark = txt(L.fx, '?', { 'font-size': 220, fill: '#ff3b3b', stroke: '#10121a', 'stroke-width': 16, 'paint-order': 'stroke fill', opacity: 0 })
  const gas = Array.from({ length: 7 }, () => ({ el: svg('circle', { r: 160 + r() * 140, fill: 'url(#gas)', opacity: 0.5 }, L.front), x: r() * W, y: 800 + r() * 500, ph: r() }))
  const gyR = svg('ellipse', { cx: -100, cy: 1100, rx: 800, ry: 800, fill: 'url(#glowRed)', opacity: 0 }, L.front)
  const gyB = svg('ellipse', { cx: 1180, cy: 1100, rx: 800, ry: 800, fill: 'url(#glowBlue)', opacity: 0 }, L.front)
  // L'écran de la caméra-piéton : teinte, lignes, coins, REC, horodatage.
  const hud = svg('g', {}, L.hud)
  svg('rect', { width: W, height: H, fill: 'url(#bodycam)' }, hud)
  svg('rect', { width: W, height: H, fill: 'url(#scan)', opacity: 0.5 }, hud)
  svg('rect', { width: W, height: H, fill: 'url(#camVig)' }, hud)
  for (const [x, y, sx, sy] of [[60, 160, 1, 1], [1020, 160, -1, 1], [60, 1760, 1, -1], [1020, 1760, -1, -1]]) svg('path', { d: `M ${x} ${y + sy * 90} L ${x} ${y} L ${x + sx * 90} ${y}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 7, opacity: 0.8 }, hud)
  const rec = svg('circle', { cx: 112, cy: 222, r: 16, fill: '#ff3b3b' }, hud)
  txt(hud, 'REC', { x: 180, y: 236, 'font-size': 40, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  const clock = txt(hud, '', { x: 760, y: 236, 'font-size': 40, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  txt(hud, 'CAM 04 · POLICE NATIONALE', { x: 540, y: 1720, 'font-size': 34, fill: '#ffffff', opacity: 0.8, 'font-family': 'monospace', 'font-weight': 700 })
  const pauseIcon = svg('g', { opacity: 0, transform: 'translate(960 330) scale(0.6)' }, hud)
  for (const x of [-40, 16]) svg('rect', { x, y: -60, width: 30, height: 120, rx: 6, fill: '#ffffff' }, pauseIcon)
  const boot = svg('g', {}, hud)
  const bootBg = svg('rect', { width: W, height: H, fill: '#0a0c10' }, boot)
  const bootBands = Array.from({ length: 16 }, () => svg('rect', { x: 0, width: W, height: 20, fill: '#ffffff', opacity: 0.25 }, boot))
  return { flares, crowd, other, theo, stone, trail, stone2, path2, coll, ring, ring2, meas, measArrow, measTxt, qmark, gas, gyR, gyB, rec, clock, pauseIcon, boot, bootBg, bootBands }
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
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // 04 : le pavé qu'il n'a pas vu retomber.
  const notSeen = prop((g) => {
    panel(g, 760, 340)
    const s = pave(g, 1.6)
    s.setAttribute('transform', 'translate(-150 10) scale(1.6)')
    svg('path', { d: 'M -230 -80 L -70 100 M -70 -80 L -230 100', stroke: '#ff3b3b', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
    txt(g, 'PAS VU', { x: 160, y: 30, 'font-size': 92, fill: '#ffffff' })
  })
  // 04 : son ami à terre.
  const friend = prop((g) => {
    panel(g, 760, 340, '#ff3b3b')
    const c = cop(g)
    c.g.setAttribute('transform', 'translate(-60 70) rotate(-84) scale(0.7)')
    svg('path', { d: 'M -150 -60 L -120 -20 L -140 10', fill: 'none', stroke: '#ffd166', 'stroke-width': 8 }, g)
    txt(g, 'SON AMI', { x: 170, y: -10, 'font-size': 64, fill: '#ffffff' })
    txt(g, 'À TERRE', { x: 170, y: 64, 'font-size': 64, fill: '#ff6b5e' })
  })
  // 04 : l'homme qui se baisse.
  const crouch = prop((g) => {
    panel(g, 760, 360)
    const th = thrower(g)
    th.update(0.1)
    th.g.setAttribute('transform', 'translate(-150 150) scale(0.8 0.62)')
    svg('path', { d: 'M -80 -110 L -80 -40 M -105 -65 L -80 -40 L -55 -65', fill: 'none', stroke: '#ffd166', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
    txt(g, 'IL SE BAISSE', { x: 150, y: 24, 'font-size': 64, fill: '#ffffff' })
  })
  // 05 : un étudiant seul, à six mètres.
  const alone = prop((g) => {
    panel(g, 820, 400)
    const c = cop(g, { armed: true })
    c.g.setAttribute('transform', 'translate(-300 170) scale(0.62)')
    const th = thrower(g)
    th.update(0.9)
    th.g.setAttribute('transform', 'translate(300 170) scale(0.62)')
    svg('path', { d: 'M -200 120 L 220 120', stroke: '#ffd166', 'stroke-width': 8, 'stroke-dasharray': '22 14' }, g)
    txt(g, '6 M', { x: 0, y: 100, 'font-size': 76, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
    svg('circle', { cx: 300, cy: 20, r: 120, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-dasharray': '16 12' }, g)
  })
  return { procBg, avoBg, crowd, proc, avo, deskG, notSeen, friend, crouch, alone }
})

// ------------------------------------------------- 3 · Carton « abonne-toi »
const PAUSE = scene('pause', (L) => {
  bg(L, '#10121a')
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.08 }, L.far)
  const rays = svg('g', { transform: 'translate(540 1000)' }, L.far)
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: '#fe2c55', opacity: 0.14, transform: `rotate(${k * 30})` }, rays)
  return { rays }
})

// ------------------------------------------------- 4 · Théo, à la barre
const THEOS = scene('theo', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, L.far)
  const r = rng(5)
  for (let i = 0; i < 10; i++) svg('circle', { cx: r() * W, cy: 200 + r() * 900, r: 20 + r() * 60, fill: '#9fd0ff', opacity: 0.04 + r() * 0.05 }, L.far)
  const theo = makePerson(L.actor, THEO)
  eyePatch(theo)
  // La barre des témoins.
  svg('rect', { x: -100, y: 1660, width: W + 200, height: 400, fill: 'url(#wood)' }, L.front)
  svg('rect', { x: -100, y: 1640, width: W + 200, height: 34, rx: 14, fill: '#b07a52' }, L.front)
  for (let i = 0; i < 6; i++) svg('rect', { x: 40 + i * 200, y: 1680, width: 30, height: 400, rx: 10, fill: '#3e2414', opacity: 0.6 }, L.front)
  return { theo }
})

// ------------------------------------------------- 5 · Le policier, dans le box
const VIDAL = scene('vidal', (L) => {
  bg(L, 'url(#court)')
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, L.far)
  const flic = makePerson(L.actor, FLIC)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, L.front)
  svg('rect', { x: -100, y: 1640, width: W + 200, height: 400, fill: '#1a2147' }, L.front)
  svg('rect', { x: -100, y: 1630, width: W + 200, height: 20, fill: '#3b4a86' }, L.front)
  return { flic }
})

// ------------------------------------------------- 6 · Le verdict
const VERD = scene('verdict', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 1100, rx: 700, ry: 800, fill: 'url(#beam)', opacity: 0.5 }, L.far)
  // Le socle et le marteau du président.
  const base = svg('g', { transform: 'translate(540 1260)' }, L.actor)
  svg('ellipse', { cx: 0, cy: 40, rx: 260, ry: 50, fill: '#000', opacity: 0.4 }, base)
  svg('rect', { x: -220, y: -40, width: 440, height: 80, rx: 30, fill: '#5a3420' }, base)
  svg('rect', { x: -220, y: -40, width: 440, height: 26, rx: 13, fill: '#8a5634' }, base)
  const gavel = svg('g', {}, L.actor)
  const head = svg('g', {}, gavel)
  svg('rect', { x: -40, y: -380, width: 34, height: 380, rx: 14, fill: '#6a3f26' }, head)
  svg('rect', { x: -140, y: -470, width: 240, height: 110, rx: 30, fill: '#7a4a2c' }, head)
  svg('rect', { x: -150, y: -470, width: 34, height: 110, rx: 10, fill: '#d9a441' }, head)
  svg('rect', { x: 76, y: -470, width: 34, height: 110, rx: 10, fill: '#d9a441' }, head)
  const rings = [0, 1, 2].map(() => svg('ellipse', { cx: 540, cy: 1250, rx: 0, ry: 0, fill: 'none', stroke: '#ffd166', 'stroke-width': 10, opacity: 0 }, L.fx))
  return { gavel, rings }
})

// ------------------------------------------------- 7 · Le vote : deux vies, face à face
const FIN = scene('fin', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitR)' }, L.far)
  svg('ellipse', { cx: 270, cy: 1200, rx: 380, ry: 700, fill: 'url(#spot)', opacity: 0.7 }, L.far)
  svg('ellipse', { cx: 810, cy: 1200, rx: 380, ry: 700, fill: 'url(#spot)', opacity: 0.7 }, L.far)
  const theo = makePerson(L.actor, THEO)
  eyePatch(theo)
  const flic = makePerson(L.actor, FLIC)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { theo, flic }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ffd166' }, fxTop), d: (x + y) * 0.011 })
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
const dip = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0 }, fxTop)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)' }, root)
// Traînées du panoramique filé.
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)
// Effet « retour en arrière ».
const rewind = svg('g', { display: 'none' }, root)
const rwBands = Array.from({ length: 7 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0.25 }, rewind))
const rwTxt = txt(rewind, '◀◀ REPLAY', { x: 780, y: 330, 'font-size': 72, fill: '#ffffff' })

// ------------------------------------------------------------------ le texte (HTML)

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


// Les instants clés de la caméra-piéton.
const T_THROW = Wd('01', 'seconde') - 0.05 // Théo lance
const T_LAND = Wd('02', 'touche') // le pavé retombe
const T_FREEZE = T_LAND + 0.12
const T_RW = S('03') - 0.3 // retour en arrière
const T_OTHER = T_RW + 0.45 // l'autre pierre part
const T_HITC = Wd('03', 'frappe') + 0.05 // elle frappe le collègue
const T_FREEZE2 = Wd('03', 'venue')
const T_STRIKE = Wd('09', 'coupable') - 0.08 // coup de marteau

// Le hook.
tag('HIER, TU AS VOTÉ', 'pill', { t0: 0, t1: Wd('01', 'mais') - 0.1, y: 290, rot: -2 })
tag('<span style="color:#ff6b5e">COUPABLE</span> · <span style="color:#7fb4ff">NON COUPABLE</span>', 'pill small', { t0: 0, t1: Wd('01', 'mais') - 0.1, y: 400, rot: 2 })
fs(tag('IMAGE JAMAIS VUE', 'stamp', { t0: Wd('01', 'image') - 0.1, t1: Wd('01', 'seconde') - 0.15, y: 420, rot: -6, from: 2.8, dur: 0.2 }), 92)
tag('SECONDE PAR SECONDE', 'pill red', { t0: Wd('01', 'seconde') - 0.1, t1: S('02') - 0.1, y: 290, rot: -2 })
fs(tag('N’A TOUCHÉ PERSONNE', 'pill yellow', { t0: Wd('02', 'touche') - 0.1, t1: E('02') + 0.1, y: 290, rot: -2 }), 56)
tag('UNE AUTRE PIERRE', 'pill red', { t0: Wd('03', 'autre') - 0.1, t1: Wd('03', 'lancee') - 0.1, y: 290, rot: -2 })
tag('VENUE DE DERRIÈRE', 'pill', { t0: Wd('03', 'venue') - 0.1, t1: Wd('03', 'lancee') - 0.1, y: 400, rot: 2 })
fs(tag('JAMAIS IDENTIFIÉ', 'stamp', { t0: Wd('03', 'jamais') - 0.1, t1: SEC.cam.t1, y: 420, rot: -5, from: 2.8, dur: 0.2 }), 84)
// Le procès.
counterTag(Wd('04', 'trois') - 0.1, Wd('04', 'place') - 0.6, 3, 'SECONDES', { y: 250, dur: 0.4 })
fs(tag('QU’AURIEZ-VOUS CRU ?', 'slam yellow', { t0: Wd('04', 'place') - 0.25, t1: E('04') + 0.1, y: 560, rot: -3, from: 2.6, dur: 0.2 }), 74)
fs(tag('J’AURAIS REGARDÉ.', 'slam white', { t0: Wd('05', 'jaurais') - 0.15, t1: Wd('05', 'il') - 0.1, y: 560, rot: -2, from: 2.4, dur: 0.2 }), 96)
tag('DES IMAGES', 'pill', { t0: Wd('05', 'images') - 0.15, t1: Wd('05', 'et') - 0.1, y: 420, rot: -3 })
tag('DES ORDRES', 'pill', { t0: Wd('05', 'ordres') - 0.15, t1: Wd('05', 'et') - 0.1, y: 560, rot: 2 })
tag('UN CHEF À SES CÔTÉS', 'pill yellow', { t0: Wd('05', 'chef') - 0.15, t1: Wd('05', 'et') - 0.1, y: 700, rot: -2 })
fs(tag('SEUL.', 'slam yellow', { t0: Wd('05', 'seul') - 0.1, t1: E('05') + 0.1, y: 250, rot: -4, from: 2.8, dur: 0.2 }), 150)
// Le carton du milieu.
fs(tag('AVANT LA FIN…', 'big white', { t0: Wd('06', 'avant') - 0.1, t1: E('06') + 0.1, y: 700, from: 1.4, dur: 0.3 }), 104)
const sub1 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('06', 'abonnetoi') - 0.05, t1: E('06') + 0.1, y: 980, from: 2.2, dur: 0.25 })
sub1.el.style.fontSize = '108px'
fs(tag('LE VERDICT DANS QUELQUES SECONDES', 'pill yellow', { t0: Wd('06', 'verdict') - 0.1, t1: E('06') + 0.1, y: 1200 }), 44)
// Théo, puis le policier.
tag('THÉO · 22 ANS · LA VICTIME', 'pill yellow', { t0: S('07') - 0.05, t1: Wd('07', 'jai') - 0.1, y: 260, rot: -2 })
fs(tag('J’AI LANCÉ CE PAVÉ.', 'slam white', { t0: Wd('07', 'lance') - 0.2, t1: Wd('07', 'mais') - 0.1, y: 260, rot: -2, from: 2.2, dur: 0.2 }), 80)
fs(tag('IL M’A PRIS UN ŒIL.', 'slam yellow', { t0: Wd('07', 'pris') - 0.25, t1: E('07') + 0.2, y: 260, rot: -3, from: 2.4, dur: 0.2 }), 96)
tag('LE BRIGADIER VIDAL · LE TIREUR', 'pill', { t0: S('08') - 0.05, t1: Wd('08', 'je', 2) - 0.1, y: 380, rot: -2 })
fs(tag('JE ME SUIS TROMPÉ.', 'slam white', { t0: Wd('08', 'trompe') - 0.3, t1: E('08') + 0.2, y: 380, rot: -2, from: 2.2, dur: 0.2 }), 84)
// Le verdict.
fs(tag('COUPABLE', 'stamp', { t0: T_STRIKE, t1: SEC.verdict.t1, y: 380, rot: -6, from: 2.8, dur: 0.2 }), 150)
counterTag(Wd('09', '18') - 0.1, SEC.verdict.t1, 18, 'MOIS AVEC SURSIS', { y: 720, dur: 0.5 })
fs(tag('INTERDICTION D’EXERCER : 5 ANS', 'pill red', { t0: Wd('09', 'interdiction') - 0.1, t1: SEC.verdict.t1, y: 1010, rot: -2 }), 50)
// Le vote, puis l'abonnement.
fs(tag('TOI, TU AVAIS VOTÉ QUOI ?', 'big white', { t0: S('10') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 64)
fs(tag('COUPABLE', 'vote red', { t0: Wd('10', 'vote') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('10', 'quoi') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('DIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('10', 'commentaire') - 0.2, y: 780 }), 48)
const sub2 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('11', 'abonnetoi') - 0.1, y: 1180, from: 2.2, dur: 0.25 })
fs(tag('LA PROCHAINE AFFAIRE ARRIVE', 'pill small', { t0: Wd('11', 'prochaine') - 0.1, y: 1315 }), 36)
for (const b of [sub1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', theo: 'THÉO', policier: 'LE POLICIER' }

// Gros sous-titres animés (pas sur les appels à s'abonner : les boutons le disent).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['06-pause', '11-abonne'].includes(l.id))) {
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
  [Wd('01', 'image') - 0.1, 10],
  [T_LAND, 10],
  [T_HITC, 18],
  [Wd('03', 'jamais') - 0.1, 10],
  [Wd('04', 'place') - 0.25, 8],
  [Wd('05', 'seul') - 0.1, 12],
  [T_STRIKE, 26],
  [Wd('11', 'abonnetoi') - 0.1, 6],
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

// Trajectoires dans l'image de la caméra-piéton.
const HAND = [585, 1000] // la main de Théo
const LAND = [470, 1700] // là où son pavé retombe
const OTHER_HAND = [890, 950] // le lanceur inconnu
const HELMET = [130, 1390] // le casque du collègue
const arc = (a, b, h, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - h * Math.sin(Math.PI * u)]
const pad = (n) => String(Math.floor(n)).padStart(2, '0')

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === CAM) {
    const replay = t >= T_RW + 0.25
    const frozen = (!replay && t >= T_FREEZE) || t >= T_FREEZE2
    // « Seconde par seconde » : l'image avance par à-coups pendant le lancer.
    let tf = frozen ? (replay ? T_FREEZE2 : T_FREEZE) : t
    if (!replay && tf > Wd('01', 'seconde') - 0.1 && tf < T_LAND) tf = Math.floor(tf * 6) / 6
    const z1 = !replay ? prog(t, T_FREEZE, 0.6, ease.io3) : 0
    const z2 = replay ? prog(t, T_FREEZE2, 0.7, ease.io3) : 0
    cam(CAM, t, {
      zoom: 1.04 + 0.22 * z1 + 0.3 * z2,
      cx: lerp(lerp(540, 480, z1), 760, z2),
      cy: lerp(lerp(1100, 1560, z1), 1080, z2),
      push: 0,
      hand: frozen ? 0 : 6,
    })
    for (const f of CAM.flares) f(tf)
    CAM.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(tf * 1.7 + c.ph)} ${c.y + 5 * Math.abs(Math.sin(tf * 3 + c.ph))}) scale(${c.s})`))
    // Théo : il arme et lance (pas pendant le replay, qui remonte avant son lancer).
    const arm = replay || tf < T_THROW ? 0 : ease.out3(clamp((tf - T_THROW) / 0.25))
    CAM.theo.g.setAttribute('transform', `translate(560 1440) scale(1.5) rotate(${lerp(-4, 6, arm)})`)
    CAM.theo.update(arm)
    const u = replay ? 0 : clamp((tf - T_THROW - 0.1) / (T_LAND - T_THROW - 0.1))
    const inHand = replay || tf < T_THROW + 0.1
    if (inHand) place(CAM.stone, HAND[0] - 40, HAND[1] - 20, 0.7)
    else {
      const [x, y] = arc(HAND, LAND, 300, u)
      place(CAM.stone, x, y, lerp(0.55, 1.5, u), u * 600)
    }
    CAM.trail.forEach((s, i) => {
      const uu = u - (i + 1) * 0.04
      const on = !inHand && uu > 0 && u < 1
      show(s, on)
      if (on) {
        const [x, y] = arc(HAND, LAND, 300, uu)
        place(s, x, y, lerp(0.55, 1.5, uu), uu * 600)
        s.setAttribute('opacity', (0.25 * (1 - i / 5)).toFixed(2))
      }
    })
    // Repères du premier gel : cercle, ligne de police, « 2 M ».
    const ringA = !replay ? popS(t, T_FREEZE, Infinity, 0.3) : 0
    CAM.ring.setAttribute('cx', LAND[0])
    CAM.ring.setAttribute('cy', LAND[1])
    CAM.ring.setAttribute('r', (150 * ringA).toFixed(1))
    CAM.ring.setAttribute('opacity', Math.min(1, ringA).toFixed(2))
    const m = !replay ? prog(t, Wd('02', 'retombe') - 0.1, 0.4, ease.out3) : 0
    CAM.meas.setAttribute('opacity', m.toFixed(2))
    CAM.meas.setAttribute('transform', `translate(540 1880)`)
    const m2 = !replay ? prog(t, Wd('02', '2') - 0.15, 0.35, ease.out3) : 0
    CAM.measArrow.setAttribute('d', m2 > 0 ? `M ${LAND[0]} 1770 L ${LAND[0]} ${lerp(1770, 1860, m2)} M ${LAND[0] - 22} ${lerp(1770, 1860, m2) - 26} L ${LAND[0]} ${lerp(1770, 1860, m2)} L ${LAND[0] + 22} ${lerp(1770, 1860, m2) - 26}` : '')
    CAM.measTxt.setAttribute('x', LAND[0] + 150)
    CAM.measTxt.setAttribute('y', 1850)
    CAM.measTxt.setAttribute('opacity', m2.toFixed(2))
    // Le replay : l'autre pierre, venue de derrière, frappe le collègue.
    const oArm = replay ? ease.out3(clamp((tf - T_OTHER) / 0.25)) : 0
    CAM.other.g.setAttribute('transform', `translate(880 1120) scale(0.5) rotate(${lerp(-4, 6, oArm)})`)
    CAM.other.update(oArm)
    const u2 = replay ? clamp((tf - T_OTHER - 0.1) / (T_HITC - T_OTHER - 0.1)) : 0
    show(CAM.stone2, replay && u2 > 0 && u2 < 1)
    if (replay && u2 > 0) {
      const [x, y] = arc(OTHER_HAND, HELMET, 520, u2)
      place(CAM.stone2, x, y, lerp(0.4, 1.7, u2), u2 * 700)
    }
    const fall = replay ? ease.in3(clamp((tf - T_HITC) / 0.45)) : 0
    CAM.coll.g.setAttribute('transform', `translate(${130 - 160 * fall} ${2120 + 260 * fall}) scale(2.6) rotate(${-70 * fall})`)
    // Le trajet de la pierre retracé, le lanceur entouré, « ? ».
    const p2 = replay ? prog(t, Wd('03', 'venue') - 0.1, 0.6, ease.io2) : 0
    const len2 = 1400
    CAM.path2.setAttribute('d', `M ${HELMET[0]} ${HELMET[1]} Q ${(HELMET[0] + OTHER_HAND[0]) / 2} ${Math.min(HELMET[1], OTHER_HAND[1]) - 520} ${OTHER_HAND[0]} ${OTHER_HAND[1]}`)
    CAM.path2.setAttribute('stroke-dasharray', `${len2 * p2} ${len2}`)
    CAM.path2.setAttribute('opacity', p2 > 0 ? 1 : 0)
    const r2 = replay ? popS(t, Wd('03', 'quelquun') - 0.15, Infinity, 0.3) : 0
    CAM.ring2.setAttribute('cx', 880)
    CAM.ring2.setAttribute('cy', 1020)
    CAM.ring2.setAttribute('r', (130 * r2).toFixed(1))
    CAM.ring2.setAttribute('opacity', Math.min(1, r2).toFixed(2))
    const q = replay ? popS(t, Wd('03', 'jamais') - 0.1, Infinity, 0.3) : 0
    CAM.qmark.setAttribute('x', 880)
    CAM.qmark.setAttribute('y', 880)
    CAM.qmark.setAttribute('opacity', Math.min(1, q).toFixed(2))
    CAM.qmark.setAttribute('font-size', (220 * Math.max(0.01, q)).toFixed(0))
    for (const g of CAM.gas) {
      const v = (tf * 0.06 + g.ph) % 1
      g.el.setAttribute('cx', g.x + 120 * Math.sin(v * 6.28))
      g.el.setAttribute('cy', g.y - 60 * v)
    }
    const ph = (tf * 2.6) % 1
    CAM.gyR.setAttribute('opacity', ph < 0.5 ? 0.35 : 0.05)
    CAM.gyB.setAttribute('opacity', ph < 0.5 ? 0.05 : 0.35)
    // L'écran de la caméra : horodatage, REC, pause pendant les gels, démarrage.
    const clockT = (replay ? tf - 3.2 : tf) + 7.4
    CAM.clock.textContent = `14/03  18:42:${pad(clockT)}:${pad((clockT % 1) * 25)}`
    CAM.rec.setAttribute('opacity', frozen ? 0.25 : Math.floor(t * 2) % 2 ? 1 : 0.2)
    CAM.pauseIcon.setAttribute('opacity', frozen && Math.floor(t * 2.5) % 2 === 0 ? 0.7 : 0)
    const bootK = clamp(1 - t / 0.4)
    CAM.boot.setAttribute('opacity', bootK.toFixed(2))
    if (bootK > 0) {
      const r = rng(Math.floor(t * 30) + 9)
      CAM.bootBands.forEach((b) => {
        b.setAttribute('y', r() * H)
        b.setAttribute('height', 6 + r() * 40)
      })
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const isProc = l.who === 'procureur'
    show(TRIB.procBg, isProc)
    show(TRIB.avoBg, !isProc)
    show(TRIB.proc.root, isProc)
    show(TRIB.avo.root, !isProc)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…»]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = prog(t, last.t - 0.15, 0.25, ease.out3)
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch) + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 900, punch), push: 0.02, from: l.start - 0.12, rot: side * 0.6 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540 + side * 60,
      y: 1170,
      scale: 1.4,
      lean: side * -0.03 + bk * side * -0.03,
      mouth: m,
      brows: isProc ? 'angry' : 'determined',
      look: [side * -0.4, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
      armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
      point: bk > 0.3,
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
      headNod: 0.08 * bk,
    })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph))})`))
    const prop = (el, t0, t1, x, y, s) => {
      const v = popS(t, t0, t1, 0.35)
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, 0)
    }
    prop(TRIB.notSeen, Wd('04', 'pas') - 0.15, Wd('04', 'il') - 0.15, 540, 560, 0.85)
    prop(TRIB.friend, Wd('04', 'il') - 0.1, Wd('04', 'et') - 0.15, 540, 560, 0.85)
    prop(TRIB.crouch, Wd('04', 'homme') - 0.2, Wd('04', 'place') - 0.6, 540, 640, 0.85)
    prop(TRIB.alone, Wd('05', 'devant') - 0.2, E('05') + 0.05, 540, 600, 0.9)
  }
  if (cur === PAUSE) {
    cam(PAUSE, t, { zoom: 1, push: 0.02, hand: 0, flat: true })
    PAUSE.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 30) % 360})`)
  }
  if (cur === THEOS) {
    cam(THEOS, t, { zoom: 1.02, cy: 1000, push: 0.012, hand: 1 })
    const m = mouthOf('theo', t)
    const hit = prog(t, Wd('07', 'pris') - 0.2, 0.4, ease.out3)
    THEOS.theo.update(t, { x: 540, y: 1190, scale: 1.45, mouth: m, brows: hit > 0.5 ? 'determined' : 'sad', look: [0.1, 0.1 - 0.2 * hit], armR: [0.12, 0.5], armL: [0.12, 0.5], seed: 2.2, headNod: 0.06 * Math.sin(t * 1.4), headTilt: -0.04 })
  }
  if (cur === VIDAL) {
    cam(VIDAL, t, { zoom: 1.04, cy: 1000, push: 0.015, hand: 1 })
    const m = mouthOf('policier', t)
    VIDAL.flic.update(t, { x: 540, y: 1230, scale: 1.4, mouth: m, brows: 'sad', look: [-0.15, 0.35], headNod: 0.12, armR: [0.1, 0.7], armL: [0.1, 0.7], seed: 1.4, tearT: t - (Wd('08', 'trompe') - 0.2) })
  }
  if (cur === VERD) {
    cam(VERD, t, { zoom: 1.0, cy: 1000, push: 0.01, hand: 1 })
    const k = t - T_STRIKE
    const ang = k < -0.14 ? -35 - 5 * Math.sin(t * 3) : k < 0 ? lerp(-35, -90, ease.in3(clamp((k + 0.14) / 0.14))) : -90 + 8 * Math.exp(-k * 9) * Math.sin(k * 30)
    VERD.gavel.setAttribute('transform', `translate(900 1215) rotate(${ang.toFixed(2)})`)
    VERD.rings.forEach((rg, i) => {
      const v = (k - i * 0.08) / 0.6
      const on = v > 0 && v < 1
      rg.setAttribute('rx', on ? (80 + 520 * ease.out3(v)).toFixed(1) : 0)
      rg.setAttribute('ry', on ? (20 + 130 * ease.out3(v)).toFixed(1) : 0)
      rg.setAttribute('opacity', on ? (1 - v).toFixed(2) : 0)
    })
  }
  if (cur === FIN) {
    cam(FIN, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    FIN.theo.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'sad', look: [0.3, 0.2], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    FIN.flic.update(t, { x: 810, y: 1560, scale: 0.85, brows: 'sad', look: [-0.3, 0.3], headNod: 0.1, armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.7 })
  }

  // Transitions : flash, fondu au noir, pastilles, retour en arrière, panoramique filé.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.9 : 0.35) * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  let d = 0
  for (const s of C.sections.filter((x) => x.cut === 'dip')) {
    const q = Math.abs(t - s.t0)
    if (q < 0.3) d = Math.max(d, 1 - q / 0.3)
  }
  dip.setAttribute('opacity', d.toFixed(3))
  for (const { el, d: dd } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - dd
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  const rw = t - T_RW
  const rwOn = rw > 0 && rw < 0.5
  show(rewind, rwOn)
  if (rwOn) {
    const r = rng(Math.floor(t * 30))
    rwBands.forEach((b) => {
      b.setAttribute('y', r() * H)
      b.setAttribute('height', 10 + r() * 40)
    })
    rwTxt.setAttribute('opacity', Math.floor(t * 8) % 2 ? 1 : 0.3)
    CAM.g.setAttribute('transform', `translate(${(30 * Math.sin(t * 90)).toFixed(1)} 0)`)
  } else CAM.g.removeAttribute('transform')
  let whip = 0
  for (const l of TLINES.slice(1)) {
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
  updateGrain(t, cur === CAM ? 26 : 14)
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
