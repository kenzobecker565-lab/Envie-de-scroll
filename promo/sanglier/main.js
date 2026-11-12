/**
 * ============================================================================
 *  « Affaire Classée ? » — Le Sanglier (1080 × 1920)
 * ============================================================================
 *  Un chasseur, Gérard, a tiré sur ce qu'il croyait être un sanglier : c'était
 *  Thomas, 25 ans, qui faisait son jogging. Le hook : la forêt vue dans la
 *  lunette, le coup, les corbeaux, la basket dans les feuilles. Le procès : les
 *  avocats en costume s'insultent (mots censurés, bipés dans le son, fond rouge
 *  qui claque), un dessin par argument. Au milieu et à la fin : « abonne-toi ».
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



// Les personnages. Les avocats en costume ; Gérard en gilet de chasse orange.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const GERARD = { robe: '#ff7a1a', jabot: false, collar: '#6b7a3a', hair: 'short', hairColor: '#9a958c', beard: true, skin: '#e9b48f', iris: '#3b2a1a' }
const THOMAS = { robe: '#22252e', jabot: false, vneck: '#3fb3ff', hair: 'messy', hairColor: '#c99a4a', skin: '#f2c4a0', iris: '#2b4a7a' }
grad('forestSky', [[0, '#9fb8c9'], [0.5, '#5f7f8c'], [1, '#2a3b36']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('fog', [[0, '#e8f0f2', 0.0], [0.5, '#e8f0f2', 0.55], [1, '#e8f0f2', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sunRay', [[0, '#fff1c4', 0.5], [1, '#fff1c4', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('scopeVig', [[0.62, '#000', 0], [0.64, '#000', 1], [1, '#000', 1]], { cx: 540, cy: 960, r: 700, gradientUnits: 'userSpaceOnUse' })
grad('splitG', [[0, '#5a2a10'], [1, '#160a04']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitT', [[0, '#1a2a50'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('pauseBg', [[0, '#3a1a08'], [1, '#10121a']], { x1: 0, y1: 0, x2: 0, y2: 1 })

const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)

// Un chasseur en silhouette : casquette et gilet orange, fusil épaulé (vers la droite).
function hunter(parent, { aim = true } = {}) {
  const g = svg('g', {}, parent)
  const c = '#2a2f24'
  svg('path', { d: 'M -14 -90 L -26 0 M 16 -90 L 30 0', stroke: c, 'stroke-width': 30, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -44, y: -250, width: 88, height: 170, rx: 30, fill: '#ff7a1a' }, g)
  svg('rect', { x: -44, y: -190, width: 88, height: 14, fill: '#ffe14a' }, g)
  svg('circle', { cx: 0, cy: -284, r: 38, fill: '#e9b48f' }, g)
  svg('path', { d: 'M -40 -292 Q 0 -340 40 -292 L 70 -290 L 40 -280 L -40 -284 Z', fill: '#ff7a1a' }, g)
  if (aim) {
    svg('path', { d: 'M 20 -228 L 190 -246', stroke: '#3a2a1a', 'stroke-width': 12, 'stroke-linecap': 'round' }, g)
    svg('path', { d: 'M 150 -243 L 300 -258', stroke: '#1b1f28', 'stroke-width': 9, 'stroke-linecap': 'round' }, g)
    svg('path', { d: 'M 0 -220 L 70 -232 L 120 -240', fill: 'none', stroke: c, 'stroke-width': 24, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  } else svg('path', { d: 'M 40 -230 L 60 -60', stroke: '#3a2a1a', 'stroke-width': 12, 'stroke-linecap': 'round' }, g)
  return g
}
// Une basket de course (vue de profil).
function shoe(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('path', { d: 'M -120 20 L -120 -40 C -120 -70 -90 -80 -60 -70 L -10 -50 C 30 -40 80 -30 120 -10 C 140 0 140 20 120 20 Z', fill: '#3fb3ff', stroke: '#10121a', 'stroke-width': 6, 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M -126 20 L 126 20 L 120 38 L -120 38 Z', fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
  for (const x of [-40, -14, 12]) svg('path', { d: `M ${x} -54 L ${x + 18} -36`, stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -100 -10 L 40 -10', stroke: '#ffd166', 'stroke-width': 8 }, g)
  return g
}
// Des feuilles mortes.
function leaves(parent, n, seed, box) {
  const r = rng(seed)
  for (let k = 0; k < n; k++) {
    const x = box[0] + r() * box[2]
    const y = box[1] + r() * box[3]
    svg('ellipse', { cx: x, cy: y, rx: 26 + r() * 20, ry: 10 + r() * 6, fill: ['#b5651d', '#8a4a1a', '#d08a2a', '#6a3a14'][k % 4], transform: `rotate(${r() * 180} ${x} ${y})`, opacity: 0.9 }, parent)
  }
}
// La forêt : troncs, brume, rayons de soleil, fougères.
function forest(L, seed) {
  bg(L, 'url(#forestSky)')
  const r = rng(seed)
  for (let k = 0; k < 4; k++) svg('path', { d: `M ${100 + k * 260} -200 L ${260 + k * 260} -200 L ${520 + k * 200} 2000 L ${330 + k * 200} 2000 Z`, fill: 'url(#sunRay)', opacity: 0.5 }, L.far)
  for (let k = 0; k < 14; k++) svg('rect', { x: -100 + k * 95 + r() * 40, y: -200, width: 26 + r() * 30, height: 1500, fill: '#3d5048', opacity: 0.55 }, L.far)
  svg('rect', { x: -400, y: 700, width: W + 800, height: 500, fill: 'url(#fog)' }, L.far)
  for (let k = 0; k < 7; k++) svg('rect', { x: -120 + k * 190 + r() * 40, y: -300, width: 60 + r() * 40, height: 1700, fill: '#24302b' }, L.mid)
  svg('rect', { x: -400, y: 1250, width: W + 800, height: 1200, fill: '#3a3020' }, L.mid)
  leaves(L.mid, 60, seed + 1, [-200, 1260, W + 400, 700])
  return r
}
function bush(parent, x, y, s = 1) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  for (const [cx, cy, rr] of [[-120, -40, 110], [0, -90, 140], [130, -40, 110], [60, 10, 100], [-70, 20, 90]]) svg('circle', { cx, cy, r: rr, fill: '#2f4a2c' }, g)
  for (const [cx, cy, rr] of [[-90, -80, 50], [40, -150, 60], [150, -80, 40]]) svg('circle', { cx, cy, r: rr, fill: '#4a6a3a' }, g)
  return g
}

// ------------------------------------------------- 1 · La forêt : la lunette, le coup, la basket
const FORET = scene('foret', (L) => {
  forest(L, 31)
  // Les fourrés où quelque chose bouge (Thomas, en noir).
  const runner = svg('g', {}, L.actor)
  svg('rect', { x: -40, y: -250, width: 80, height: 170, rx: 30, fill: '#15171d' }, runner)
  svg('circle', { cx: 0, cy: -282, r: 34, fill: '#15171d' }, runner)
  svg('path', { d: 'M -10 -90 L -40 0 M 14 -90 L 36 0', stroke: '#15171d', 'stroke-width': 30, 'stroke-linecap': 'round' }, runner)
  svg('path', { d: 'M -36 -300 A 34 34 0 0 1 30 -300 M 40 -230 Q 48 -170 40 -110', fill: 'none', stroke: '#e8f6ff', 'stroke-width': 9, opacity: 0.9 }, runner)
  svg('circle', { cx: 30, cy: -276, r: 8, fill: '#ffffff' }, runner)
  const bushG = bush(L.actor, 700, 1260, 1.2)
  // Après le coup : la basket dans les feuilles.
  const shoeG = svg('g', { opacity: 0 }, L.actor)
  leaves(shoeG, 18, 77, [480, 1420, 420, 120])
  const sh = shoe(shoeG, 1.1)
  sh.setAttribute('transform', 'translate(700 1450) rotate(-12) scale(1.1)')
  // Le chasseur, de dos, au premier plan à gauche.
  const hunt = hunter(L.front)
  const smoke = Array.from({ length: 6 }, () => svg('circle', { r: 0, fill: '#d8dcd8', opacity: 0 }, L.front))
  // Les corbeaux qui s'envolent.
  const crows = Array.from({ length: 9 }, (_, k) => {
    const g = svg('g', {}, L.fx)
    const wing = svg('path', { fill: '#111214' }, g)
    svg('ellipse', { rx: 22, ry: 12, fill: '#111214' }, g)
    return { g, wing, x0: 300 + k * 70, y0: 500 + (k % 3) * 60, vx: (k % 2 ? 1 : -1) * (160 + k * 30), vy: -(260 + (k % 4) * 60), ph: k }
  })
  // La lunette : noir autour, réticule.
  const scope = svg('g', {}, L.hud)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#scopeVig)' }, scope)
  svg('path', { d: 'M 540 560 L 540 1360 M 140 960 L 940 960', stroke: '#000000', 'stroke-width': 5 }, scope)
  svg('path', { d: 'M 540 900 L 540 1020 M 480 960 L 600 960', stroke: '#e5484d', 'stroke-width': 8 }, scope)
  svg('circle', { cx: 540, cy: 960, r: 420, fill: 'none', stroke: '#000', 'stroke-width': 30 }, scope)
  // La carte de Thomas.
  const card = svg('g', { display: 'none' }, L.hud)
  svg('rect', { x: -330, y: -200, width: 660, height: 400, rx: 30, fill: '#fbf7ef', stroke: '#10121a', 'stroke-width': 10 }, card)
  svg('rect', { x: -300, y: -170, width: 240, height: 300, rx: 16, fill: '#cfe8f5' }, card)
  const cc = svg('clipPath', { id: 'thomasClip' }, defs)
  svg('rect', { x: -300, y: -170, width: 240, height: 300, rx: 16 }, cc)
  const ph = svg('g', { 'clip-path': 'url(#thomasClip)' }, card)
  const tp = svg('g', { transform: 'translate(-180 110) scale(0.5)' }, ph)
  makePerson(tp, THOMAS).update(0.4, { mouth: 0.3, brows: 'neutral', armR: [0.1, 0.4], armL: [0.1, 0.4] })
  txt(card, 'THOMAS', { x: 150, y: -60, 'font-size': 70, fill: '#10121a' })
  txt(card, '25 ANS', { x: 150, y: 20, 'font-size': 60, fill: '#3b82f6' })
  txt(card, 'JOGGEUR', { x: 150, y: 90, 'font-size': 40, fill: '#6b7280' })
  const cardDead = svg('g', { opacity: 0 }, card)
  svg('rect', { x: -330, y: -200, width: 660, height: 400, rx: 30, fill: '#000', opacity: 0.35 }, cardDead)
  svg('path', { d: 'M -300 -170 L -60 130 M -60 -170 L -300 130', stroke: '#e5484d', 'stroke-width': 16, 'stroke-linecap': 'round' }, cardDead)
  return { runner, bushG, shoeG, hunt, smoke, crows, scope, card, cardDead }
})

// ------------------------------------------------- 2 · Gérard
const GER = scene('gerard', (L) => {
  forest(L, 47)
  svg('ellipse', { cx: 540, cy: 900, rx: 640, ry: 900, fill: 'url(#spot)', opacity: 0.7 }, L.far)
  const ger = makePerson(L.actor, GERARD)
  // Son fusil, posé sur l'épaule.
  const rifle = svg('g', {}, L.actor)
  svg('path', { d: 'M 0 0 L 360 -300', stroke: '#3a2a1a', 'stroke-width': 26, 'stroke-linecap': 'round' }, rifle)
  svg('path', { d: 'M 250 -208 L 460 -384', stroke: '#1b1f28', 'stroke-width': 18, 'stroke-linecap': 'round' }, rifle)
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)' }, bars)
  svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, bars)
  const dark = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#000', opacity: 0 }, L.fx)
  return { ger, rifle, bars, dark }
})

// ------------------------------------------------- 3 · Le procès
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
  // Fond « insulte » : rouge tramé, qui claque.
  const hotBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#d42a2a' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.14 }, hotBg)
  // Fond grave (la dernière réplique du procureur).
  const graveBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#courtDark)' }, graveBg)
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, graveBg)
  // Le carton du milieu.
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
  // 03 : la règle n°1 (on ne voit pas → on ne tire pas), puis la bouteille.
  const rule = prop((g) => {
    panel(g, 760, 340)
    svg('ellipse', { cx: -200, cy: 0, rx: 120, ry: 70, fill: '#ffffff' }, g)
    svg('circle', { cx: -200, cy: 0, r: 46, fill: '#3b2a1a' }, g)
    svg('rect', { x: -330, y: -30, width: 260, height: 60, fill: '#c9d2d6', opacity: 0.85 }, g)
    svg('path', { d: 'M -330 -90 L -70 90', stroke: '#e5484d', 'stroke-width': 16, 'stroke-linecap': 'round' }, g)
    txt(g, 'PAS VU ?', { x: 150, y: -10, 'font-size': 72, fill: '#ffffff' })
    txt(g, 'PAS DE TIR.', { x: 150, y: 70, 'font-size': 56, fill: '#ffd166' })
  })
  const bottle = prop((g) => {
    panel(g, 760, 340, '#e5484d')
    svg('path', { d: 'M -230 130 L -230 -40 C -230 -80 -200 -90 -200 -120 L -200 -160 L -160 -160 L -160 -120 C -160 -90 -130 -80 -130 -40 L -130 130 Z', fill: '#2f6b3a', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -224, y: -10, width: 88, height: 60, fill: '#f4efe2' }, g)
    svg('path', { d: 'M -280 -150 L -80 150 M -80 -150 L -280 150', stroke: '#e5484d', 'stroke-width': 16, 'stroke-linecap': 'round' }, g)
    txt(g, 'RÈGLE N°0', { x: 150, y: -10, 'font-size': 66, fill: '#ffffff' })
    txt(g, 'PAS D’ALCOOL', { x: 150, y: 70, 'font-size': 52, fill: '#ff6b5e' })
  })
  // 04 : un homme en noir dans le brouillard.
  const fogMan = prop((g) => {
    panel(g, 760, 360)
    svg('rect', { x: -360, y: -160, width: 720, height: 320, rx: 20, fill: '#7f939a' }, g)
    const m = svg('g', { transform: 'translate(-60 150) scale(0.75)' }, g)
    svg('rect', { x: -40, y: -250, width: 80, height: 170, rx: 30, fill: '#15171d' }, m)
    svg('circle', { cx: 0, cy: -282, r: 34, fill: '#15171d' }, m)
    svg('path', { d: 'M -10 -90 L -40 0 M 14 -90 L 36 0', stroke: '#15171d', 'stroke-width': 30, 'stroke-linecap': 'round' }, m)
    for (let k = 0; k < 4; k++) svg('rect', { x: -360, y: -150 + k * 80, width: 720, height: 40, fill: '#e8f0f2', opacity: 0.35 }, g)
    txt(g, 'TOUT EN NOIR', { x: 160, y: 20, 'font-size': 52, fill: '#10121a' })
  })
  // 05 : la thermos.
  const thermos = prop((g) => {
    panel(g, 700, 360)
    svg('rect', { x: -260, y: -130, width: 120, height: 260, rx: 30, fill: '#7a8a96', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -250, y: -160, width: 100, height: 40, rx: 12, fill: '#3a4250', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -260, y: -30, width: 120, height: 40, fill: '#e5484d' }, g)
    txt(g, 'THERMOS', { x: 130, y: 20, 'font-size': 70, fill: '#ffffff' })
  })
  // 06 : café contre latte au lait d'avoine.
  const cups = prop((g) => {
    panel(g, 820, 380)
    const cup = (x, fill, label, col) => {
      svg('path', { d: `M ${x - 80} -60 L ${x + 80} -60 L ${x + 60} 90 L ${x - 60} 90 Z`, fill, stroke: '#10121a', 'stroke-width': 6 }, g)
      svg('path', { d: `M ${x + 76} -30 C ${x + 130} -30 ${x + 130} 40 ${x + 66} 40`, fill: 'none', stroke: '#10121a', 'stroke-width': 10 }, g)
      for (const k of [-30, 0, 30]) svg('path', { d: `M ${x + k} -90 C ${x + k - 12} -110 ${x + k + 12} -120 ${x + k} -140`, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.6 }, g)
      txt(g, label, { x, y: 150, 'font-size': 38, fill: col })
    }
    cup(-200, '#5a3418', 'CAFÉ', '#ffd166')
    cup(200, '#efe2c8', 'LATTE AVOINE', '#ffffff')
    txt(g, 'VS', { x: 0, y: 20, 'font-size': 64, fill: '#e5484d' })
  })
  // 07 : le bon et le mauvais chasseur (identiques).
  const hunters = prop((g) => {
    panel(g, 860, 460)
    for (const [x, label, col] of [[-220, 'MAUVAIS', '#ff6b5e'], [200, 'BON', '#7fd38a']]) {
      const h = hunter(g)
      h.setAttribute('transform', `translate(${x - 60} 170) scale(0.62)`)
      txt(g, label, { x, y: -160, 'font-size': 52, fill: col })
    }
    g.eq = txt(g, '=', { x: 0, y: 40, 'font-size': 140, fill: '#ffd166' })
  })
  // 10 : le sanglier dans l'assiette.
  const plate = prop((g) => {
    panel(g, 740, 360)
    svg('ellipse', { cx: -150, cy: 40, rx: 200, ry: 80, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('ellipse', { cx: -150, cy: 30, rx: 140, ry: 50, fill: '#e9e4da' }, g)
    // Une tête de sanglier stylisée.
    svg('ellipse', { cx: -150, cy: -20, rx: 90, ry: 66, fill: '#5a4030', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('ellipse', { cx: -150, cy: 10, rx: 44, ry: 30, fill: '#d99a8a', stroke: '#10121a', 'stroke-width': 5 }, g)
    for (const x of [-170, -130]) svg('circle', { cx: x, cy: 10, r: 7, fill: '#10121a' }, g)
    for (const s of [-1, 1]) svg('path', { d: `M ${-150 + s * 40} 30 Q ${-150 + s * 70} 10 ${-150 + s * 66} -20`, fill: 'none', stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round' }, g)
    for (const x of [-185, -115]) svg('circle', { cx: x, cy: -40, r: 8, fill: '#10121a' }, g)
    txt(g, 'AU RESTO', { x: 170, y: 20, 'font-size': 64, fill: '#ffffff' })
  })
  // 12 : le panneau « chasse en cours » et les écouteurs.
  const sign = prop((g) => {
    panel(g, 760, 400)
    svg('path', { d: 'M -200 -150 L -60 110 L -340 110 Z', fill: '#ff7a1a', stroke: '#10121a', 'stroke-width': 8, 'stroke-linejoin': 'round' }, g)
    svg('path', { d: 'M -200 -60 L -200 40', stroke: '#10121a', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
    svg('circle', { cx: -200, cy: 76, r: 10, fill: '#10121a' }, g)
    txt(g, 'CHASSE', { x: 150, y: -20, 'font-size': 76, fill: '#ffffff' })
    txt(g, 'EN COURS', { x: 150, y: 60, 'font-size': 60, fill: '#ff7a1a' })
  })
  const buds = prop((g) => {
    panel(g, 640, 300)
    for (const x of [-150, -40]) {
      svg('circle', { cx: x, cy: 0, r: 44, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
      svg('rect', { x: x - 12, y: 30, width: 24, height: 80, rx: 12, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
    }
    for (const k of [0, 1, 2]) svg('path', { d: `M ${40 + k * 40} -40 Q ${70 + k * 40} 0 ${40 + k * 40} 40`, fill: 'none', stroke: '#ffd166', 'stroke-width': 8 }, g)
    txt(g, '♪', { x: 210, y: 30, 'font-size': 120, fill: '#ffd166' })
  })
  // 13 : le joggeur en gilet orange, avec un sifflet.
  const vestRunner = prop((g) => {
    panel(g, 760, 440)
    const w = walker(g, { carry: 'none', vest: true, color: '#ff7a1a', rim: '#ffe14a' })
    g.walker = w
    svg('path', { d: 'M 10 -230 L 60 -200', stroke: '#e5e7eb', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
  })
  // 14 : la trottinette.
  const scooter = prop((g) => {
    panel(g, 700, 360)
    svg('path', { d: 'M -220 90 L 140 90 M 120 90 L 60 -130 M 30 -130 L 100 -130', fill: 'none', stroke: '#10121a', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
    svg('path', { d: 'M -220 90 L 140 90 M 120 90 L 60 -130 M 30 -130 L 100 -130', fill: 'none', stroke: '#3fb3ff', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
    for (const x of [-220, 140]) svg('circle', { cx: x, cy: 110, r: 40, fill: '#10121a', stroke: '#9aa6c4', 'stroke-width': 8 }, g)
    txt(g, '#', { x: 260, y: 30, 'font-size': 140, fill: '#ff6bd6' })
  })
  // 15 : la basket de Thomas, seule.
  const lone = prop((g) => {
    leaves(g, 22, 91, [-360, 40, 720, 120])
    const s = shoe(g, 1.5)
    s.setAttribute('transform', 'translate(0 60) rotate(-10) scale(1.5)')
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, rule, bottle, fogMan, thermos, cups, hunters, plate, sign, buds, vestRunner, scooter, lone }
})

// ------------------------------------------------- 4 · Le vote : Gérard, seul dans le box
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitG)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitT)' }, L.far)
  const ger = makePerson(L.actor, GERARD)
  const sh = svg('g', {}, L.actor)
  leaves(sh, 16, 93, [640, 1500, 360, 120])
  shoe(sh, 1.1).setAttribute('transform', 'translate(810 1540) rotate(-10) scale(1.1)')
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { ger }
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



// Les instants clés.
const T_BANG = Wd('01', 'sanglier') + 0.15 // le coup part
const T_BOX = Wd('02', 'aujourdhui') - 0.1 // les barreaux tombent
const BIPS = C.bips
const isBip = (t) => BIPS.some((b) => t >= b.t0 - 0.1 && t < b.t1 + 0.5)
// « bouffon » → « B*****N » : on garde la première et la dernière lettre.
const mask = (w) => w.replace(/^(\p{L})(\p{L}+)(\p{L})/u, (_, a, b, c) => a + '*'.repeat(b.length) + c)

// Le hook.
fs(tag('UN SANGLIER ?', 'pill yellow', { t0: Wd('01', 'voir') - 0.1, t1: T_BANG - 0.05, y: 300, rot: -3 }), 64)
fs(tag('BANG.', 'slam white', { t0: T_BANG, t1: Wd('01', 'thomas') - 0.2, y: 520, rot: -6, from: 3, dur: 0.15 }), 150)
fs(tag('CE N’ÉTAIT PAS UN SANGLIER', 'stamp', { t0: Wd('01', 'jogging') - 0.1, t1: SEC.foret.t1, y: 1120, rot: -5, from: 2.8, dur: 0.2 }), 62)
counterTag(Wd('02', '40') - 0.1, Wd('02', 'thomas') - 0.15, 40, 'ANS DE CHASSE', { y: 300, dur: 0.5 })
tag('UN DIMANCHE MATIN', 'pill', { t0: Wd('02', 'dimanche') - 0.15, t1: Wd('02', 'thomas') - 0.15, y: 560, rot: 2 })
fs(tag('MORT SUR LE COUP.', 'slam white', { t0: Wd('02', 'mort') - 0.1, t1: T_BOX - 0.05, y: 400, rot: -3, from: 2.4, dur: 0.2 }), 92)
fs(tag('JUGÉ POUR HOMICIDE', 'stamp', { t0: Wd('02', 'juge') - 0.05, t1: SEC.gerard.t1, y: 400, rot: -6, from: 2.8, dur: 0.2 }), 84)
// Le procès.
fs(tag('RÈGLE N°1', 'slam yellow', { t0: Wd('03', 'premiere') - 0.15, t1: Wd('03', 'juste') - 0.1, y: 280, rot: -3, from: 2.4, dur: 0.2 }), 110)
fs(tag('À JEUN.', 'pill', { t0: Wd('04', 'jeun') - 0.15, t1: Wd('04', 'espece') - 0.05, y: 300, rot: -2 }), 64)
fs(tag('PARDON ?!', 'slam white', { t0: S('05') - 0.06, t1: Wd('05', 'peu') - 0.1, y: 320, rot: -4, from: 2.6, dur: 0.18 }), 150)
tag('8 H DU MATIN', 'pill red', { t0: Wd('05', '8') - 0.15, t1: Wd('05', 'on') - 0.1, y: 320, rot: -2 })
fs(tag('VERVEINE ?', 'stamp', { t0: Wd('05', 'verveine') - 0.1, t1: E('05') + 0.1, y: 820, rot: -6, from: 2.6, dur: 0.2 }), 80)
fs(tag('GROS MALIN.', 'slam yellow', { t0: Wd('06', 'gros') - 0.1, t1: Wd('06', 'je') - 0.1, y: 320, rot: -3, from: 2.4, dur: 0.2 }), 120)
fs(tag('LE BON CHASSEUR…', 'pill', { t0: S('07') - 0.05, t1: Wd('07', 'le') - 0.1, y: 300, rot: -2 }), 56)
fs(tag('UN HOMME EST MORT.', 'slam white', { t0: S('08') - 0.05, t1: Wd('08', 'connard') - 0.1, y: 320, rot: -3, from: 2.4, dur: 0.2 }), 90)
fs(tag('PARDON, MADAME LA PRÉSIDENTE.', 'pill small', { t0: Wd('08', 'pardon') - 0.1, t1: Wd('08', 'mais') - 0.1, y: 320, rot: 2 }), 40)
fs(tag('C’EST ÇA, VOTRE RÉQUISITOIRE ?', 'slam yellow', { t0: Wd('08', 'mais') - 0.1, t1: E('08') + 0.1, y: 320, rot: -3, from: 2.2, dur: 0.2 }), 62)
fs(tag('ACCIDENT OU HOMICIDE ?', 'big white', { t0: S('09') - 0.05, t1: E('09') + 0.1, y: 640, from: 1.4, dur: 0.3 }), 80)
const sub1 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('09', 'abonnetoi') - 0.05, t1: E('09') + 0.1, y: 960, from: 2.2, dur: 0.25 })
sub1.el.style.fontSize = '108px'
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('09', 'verdict') - 0.1, t1: E('09') + 0.1, y: 1180 }), 44)
counterTag(Wd('10', '20') - 0.1, Wd('10', 'qui') - 0.1, 20000, 'ACCIDENTS PAR AN', { y: 330, dur: 0.6, fmt: (v) => v.toLocaleString('fr-FR') })
fs(tag('QUI LES RÉGULE ?', 'slam yellow', { t0: Wd('10', 'qui') - 0.1, t1: Wd('10', 'vous', 1) - 0.1, y: 320, rot: -3, from: 2.2, dur: 0.2 }), 96)
fs(tag('JE RETIRE.', 'pill', { t0: Wd('11', 'retire') - 0.15, t1: Wd('11', '40') - 0.1, y: 320, rot: 2 }), 64)
fs(tag('SANGLIERS = CHASSEURS BOURRÉS', 'pill red', { t0: Wd('11', 'bourres') - 0.25, t1: E('11') + 0.1, y: 320, rot: -2 }), 48)
fs(tag('SECTEUR INTERDIT', 'stamp', { t0: Wd('12', 'interdit') - 0.15, t1: Wd('12', 'elle') - 0.1, y: 820, rot: -5, from: 2.6, dur: 0.2 }), 72)
fs(tag('« JE NE SUIS PAS UN SANGLIER ! »', 'pill yellow', { t0: Wd('13', 'je') - 0.1, t1: Wd('13', 'tous') - 0.05, y: 300, rot: -3 }), 46)
fs(tag('DÉCOR INSTAGRAM', 'pill', { t0: Wd('14', 'decor') - 0.15, t1: E('14') + 0.1, y: 300, rot: 3 }), 60)
fs(tag('LUI, SI.', 'slam white', { t0: Wd('15', 'lui') - 0.1, t1: Wd('15', 'et') - 0.05, y: 360, rot: -3, from: 2.6, dur: 0.2 }), 170)
// Les insultes : le mot, censuré, claque en rouge.
const INSULT_TXT = { bouffon: 'ESPÈCE DE B*****N !', connard: 'CE C*****D', nud: 'TÊTE DE N**D', gueule: 'FERME TA G****E.', abruti: 'AB***I ?', tocard: 'T****D.' }
for (const b of BIPS) fs(tag(INSULT_TXT[b.word], 'slam red', { t0: b.t0 - 0.02, t1: b.t1 + 0.45, y: 560, rot: -5, from: 3, dur: 0.15 }), INSULT_TXT[b.word].length > 12 ? 78 : 104)
// Le vote, puis l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('16') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('ACCIDENT ?', 'vote blue', { t0: Wd('16', 'accident') - 0.1, t1: Wd('16', 'coupable') - 0.2, y: 480, rot: -3 }), 80)
fs(tag('HOMICIDE ?', 'vote red', { t0: Wd('16', 'homicide') - 0.1, t1: Wd('16', 'coupable') - 0.2, y: 640, rot: 3 }), 80)
fs(tag('COUPABLE', 'vote red', { t0: Wd('16', 'coupable') - 0.1, y: 480, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('16', 'non') - 0.1, y: 640, rot: 3 }), 80)
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('17', 'ecris') - 0.1, y: 800 }), 42)
const sub2 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('17', 'abonnetoi') - 0.1, y: 1180, from: 2.2, dur: 0.25 })
fs(tag('VERDICT DANS LA PROCHAINE VIDÉO', 'pill small', { t0: Wd('17', 'verdict') - 0.1, y: 1315 }), 34)
for (const b of [sub1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE' }

// Gros sous-titres animés ; les insultes sont censurées (et bipées dans le son).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['09-pause', '17-abonne'].includes(l.id))) {
  const mine = []
  let cur = null
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 3 || /[,.:;?!…»]$/.test(line.words[i - 1]?.w ?? '')) mine.push((cur = { words: [], who: line.who }))
    const bip = BIPS.some((b) => Math.abs(b.t0 + 0.03 - w.t) < 0.02)
    cur.words.push({ ...w, w: bip ? mask(w.w) : w.w, bip })
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
    w.el.className = w.bip ? 'w bip' : 'w'
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
  [T_BANG, 28],
  [Wd('02', 'mort') - 0.1, 10],
  [T_BOX + 0.3, 16],
  [Wd('02', 'juge') - 0.05, 12],
  ...BIPS.map((b) => [b.t0, 14]),
  [S('05') - 0.06, 10],
  [Wd('07', 'chasseur', 1) + 0.1, 8],
  [Wd('15', 'lui') - 0.1, 14],
  [Wd('16', 'jure') - 0.15, 8],
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

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === FORET) {
    const shot = t >= T_BANG
    const k = t - T_BANG
    // Avant le coup : dans la lunette, les fourrés bougent. Après : plan large, recul, corbeaux.
    show(FORET.scope, !shot)
    show(FORET.hunt, shot)
    const pre = clamp(t / T_BANG)
    if (!shot) cam(FORET, t, { zoom: lerp(2.3, 2.6, pre), cx: 660 + 30 * Math.sin(t * 1.7), cy: 990 + 20 * Math.sin(t * 2.3), push: 0, hand: 3 })
    else {
      const out = ease.out3(clamp(k / 0.5))
      const push = prog(t, Wd('01', 'cetait') - 0.1, 1.2, ease.io2)
      cam(FORET, t, { zoom: lerp(1.6, 1.0, out) + 0.5 * push, cx: lerp(700, 540, out) + 160 * push, cy: lerp(1080, 1050, out) + 320 * push, push: 0, hand: 3, from: T_BANG })
    }
    // Les fourrés tremblent ; la silhouette disparaît après le coup.
    const shake = !shot ? 6 * Math.sin(t * 23) * (0.5 + 0.5 * Math.sin(t * 3)) : 0
    FORET.bushG.setAttribute('transform', `translate(${700 + shake} 1260) scale(1.2)`)
    FORET.runner.setAttribute('transform', `translate(${lerp(560, 680, pre)} ${1100 + 10 * Math.sin(t * 7)}) scale(0.9)`)
    show(FORET.runner, !shot)
    FORET.shoeG.setAttribute('opacity', prog(t, Wd('01', 'cetait') - 0.1, 0.4, ease.out3).toFixed(2))
    FORET.hunt.setAttribute('transform', `translate(${110 - 30 * Math.exp(-k * 6) * (shot ? 1 : 0)} 1950) scale(2.2) rotate(${shot ? -6 * Math.exp(-k * 5) : 0})`)
    FORET.smoke.forEach((c, i) => {
      const v = (k - i * 0.05) / 1.6
      const on = shot && v > 0 && v < 1
      c.setAttribute('cx', 770 + 120 * v + i * 20)
      c.setAttribute('cy', 1382 - 80 * v - i * 10)
      c.setAttribute('r', on ? (30 + 90 * v).toFixed(1) : 0)
      c.setAttribute('opacity', on ? (0.6 * (1 - v)).toFixed(2) : 0)
    })
    FORET.crows.forEach((c) => {
      const v = Math.max(0, k)
      const on = shot
      show(c.g, on)
      if (!on) return
      c.g.setAttribute('transform', `translate(${c.x0 + c.vx * v} ${c.y0 + c.vy * v + 60 * v * v * 0})`)
      const fl = Math.sin(t * 22 + c.ph)
      c.wing.setAttribute('d', `M -40 ${-20 * fl} Q -20 -6 0 0 Q 20 -6 40 ${-20 * fl} Q 20 6 0 4 Q -20 6 -40 ${-20 * fl} Z`)
    })
    // La carte de Thomas ; « jogging » : barrée.
    const c = popS(t, Wd('01', 'thomas') - 0.15, Infinity, 0.35)
    show(FORET.card, c > 0.01)
    place(FORET.card, 540, 520 + 6 * Math.sin(t * 3), 0.95 * Math.min(1.1, c), -3)
    FORET.cardDead.setAttribute('opacity', prog(t, Wd('01', 'jogging') - 0.1, 0.2, ease.out3).toFixed(2))
  }
  if (cur === GER) {
    const box = prog(t, T_BOX, 0.35, ease.back(1.4))
    cam(GER, t, { zoom: 1.05 + 0.1 * prog(t, Wd('02', 'mort') - 0.1, 0.3, ease.out3), cy: 1000, push: 0.02, hand: 2 })
    GER.ger.update(t, { x: 540, y: 1220, scale: 1.4, brows: box > 0.5 ? 'sad' : 'determined', look: [0.2, box > 0.5 ? 0.3 : 0], headNod: 0.1 * box, armR: [0.3, 1.6], armL: [0.12, 0.4], seed: 0.9 })
    show(GER.rifle, false)
    GER.bars.setAttribute('transform', `translate(0 ${lerp(-2300, 0, box)})`)
    const d = Wd('02', 'mort') - 0.1
    GER.dark.setAttribute('opacity', (t > d && t < T_BOX ? 0.55 * prog(t, d, 0.2, ease.out3) : 0).toFixed(2))
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '09'
    const isProc = l.who === 'procureur'
    const hot = isBip(t)
    const grave = id === '15'
    show(TRIB.procBg, isProc && !hot && !pause && !grave)
    show(TRIB.avoBg, !isProc && !hot && !pause && !grave)
    show(TRIB.hotBg, hot && !pause)
    show(TRIB.graveBg, grave && !hot)
    show(TRIB.pauseBg, pause)
    const alone = grave && t > Wd('15', 'thomas') - 0.15
    show(TRIB.proc.root, isProc && !pause && !alone)
    show(TRIB.avo.root, !isProc && !pause)
    show(TRIB.deskG, !pause && !alone)
    for (const c of TRIB.crowd) show(c.g, !pause && !grave)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const hb = BIPS.find((b) => t >= b.t0 - 0.1 && t < b.t1 + 0.5)
    const insult = hb ? prog(t, hb.t0 - 0.05, 0.12, ease.out3) * (1 - prog(t, hb.t1 + 0.3, 0.2, ease.io2)) : 0
    if (pause) {
      cam(TRIB, t, { zoom: 1, push: 0.02, from: l.start, hand: 0, flat: true })
      TRIB.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 30) % 360})`)
    } else cam(TRIB, t, { zoom: (grave ? 1.08 : 1.0) + 0.25 * insult + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 820, insult), push: grave ? 0.035 : 0.02, from: l.start - 0.12, rot: side * 0.6 + insult * side * -3 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    const surprised = id === '05' && t < Wd('05', 'peu')
    if (!pause)
      P.update(t, {
        x: 540 + side * 60,
        y: 1170,
        scale: 1.4,
        lean: side * -0.03 + bk * side * -0.03 + insult * side * -0.06,
        mouth: m,
        brows: surprised ? 'surprised' : insult > 0.2 || grave ? 'angry' : 'determined',
        look: [side * -0.4, 0],
        armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5 + insult * 1.2, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
        armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
        point: bk > 0.3 || insult > 0.3,
        seed: isProc ? 0.5 : 1.7,
        headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
        headNod: 0.08 * bk,
      })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph)) - (id === '07' && t > Wd('07', 'chasseur', 1) ? 14 * Math.abs(Math.sin(t * 9 + c.ph)) : 0)})`))
    const prop = (el, t0, t1, x = 540, y = 600, s = 0.8) => {
      const v = popS(t, t0, t1, 0.35)
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, 0)
      return v
    }
    prop(TRIB.rule, Wd('03', 'voit') - 0.2, Wd('03', 'juste') - 0.15)
    prop(TRIB.bottle, Wd('03', 'juste') - 0.1, E('03') + 0.1)
    prop(TRIB.fogMan, Wd('04', 'brouillard') - 0.2, E('04') + 0.1)
    prop(TRIB.thermos, Wd('05', 'thermos') - 0.2, E('05') + 0.1)
    prop(TRIB.cups, Wd('06', 'lattes') - 0.25, E('06') + 0.1)
    if (prop(TRIB.hunters, Wd('07', 'mauvais') - 0.2, E('07') + 0.3) > 0) TRIB.hunters.eq.setAttribute('opacity', prog(t, Wd('07', 'aussi') - 0.1, 0.2, ease.out3).toFixed(2))
    prop(TRIB.plate, Wd('10', 'assiette') - 0.25, Wd('10', 'tete') - 0.1)
    prop(TRIB.sign, Wd('12', 'panneaux') - 0.2, Wd('12', 'victime') - 0.1)
    prop(TRIB.buds, Wd('12', 'ecouteurs') - 0.2, E('12') + 0.1)
    if (prop(TRIB.vestRunner, Wd('13', 'gilet') - 0.2, Wd('13', 'abruti') - 0.15) > 0) TRIB.vestRunner.walker.update(0, 200, 1.1, t * 9, { stride: 1.1 })
    prop(TRIB.scooter, Wd('14', 'trottinette') - 0.2, E('14') + 0.1)
    prop(TRIB.lone, Wd('15', 'thomas') - 0.15, E('15') + 0.4, 540, 820, 1.3)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.ger.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'sad', look: [0.3, 0.2], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
  }

  // Transitions : flash, pastilles orange, panoramique filé entre les répliques.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
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
  streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && WHO[l.who])
  who.textContent = w ? WHO[w.who] : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === FORET ? 20 : 14)
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
