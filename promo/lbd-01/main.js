/**
 * ============================================================================
 *  « Affaire Classée ? » — le tir (LBD), épisode 1/2 (1080 × 1920)
 * ============================================================================
 *  Un policier tire au LBD sur un étudiant qui venait de lancer un pavé ;
 *  l'étudiant perd un œil. Le policier est jugé. Style A (motion design 2D en
 *  SVG), gros sous-titres animés, pas de jauge.
 *
 *  Le hook, pour comprendre en quelques secondes :
 *  1. Très gros plan sur un œil, les gyrophares dans la pupille ; une balle de
 *     défense arrive face caméra : impact, ondes, fissures comme sur un objectif
 *     brisé, la paupière tombe, la moitié gauche de l'image s'éteint.
 *  2. Retour en arrière (« 3 secondes plus tôt ») : la rue sous les gaz, la
 *     ligne de CRS et leurs boucliers, les manifestants ; Théo lance un pavé,
 *     qu'on suit au ralenti ; le tireur épaule son LBD : « 6 M », tir.
 *  3. Le policier dans le box : « JUGÉ », violences volontaires, mutilation.
 *  Le procès : contre-champs, gestes, panoramiques filés, un schéma animé par
 *  argument. Au milieu, un carton : le verdict du public sur Inès (la pilleuse),
 *  puis « ABONNE-TOI » ; à la fin, le vote et un second appel à s'abonner.
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
  const L = { far: svg('g', {}, g), mid: svg('g', {}, g), actor: svg('g', {}, g), front: svg('g', {}, g), fx: svg('g', {}, g) }
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

const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12' }
const FLIC = { robe: '#1f2c4a', jabot: false, collar: '#9fb8de', hair: 'short', hairColor: '#3a2a1e', skin: '#e8bb98', iris: '#3b2a1a' }
const INES = { robe: '#5fb3c9', jabot: false, vneck: '#4a98ad', hair: 'bob', hairColor: '#2a1810', female: true, skin: '#c98d68', iris: '#3b2a1a' }
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

// 1 · Le tir : très gros plan sur l'œil, la balle arrive, impact.
const TIR = scene('tir', (L) => {
  bg(L, '#06080f')
  // Reflets de gyrophares sur la peau, gaz en suspension.
  const gyR = svg('ellipse', { cx: 120, cy: 600, rx: 900, ry: 900, fill: 'url(#glowRed)', opacity: 0.3 }, L.far)
  const gyB = svg('ellipse', { cx: 960, cy: 600, rx: 900, ry: 900, fill: 'url(#glowBlue)', opacity: 0.3 }, L.far)
  // Le visage, cadré serré sur l'œil gauche.
  const face = svg('g', { transform: 'translate(540 860)' }, L.mid)
  svg('rect', { x: -900, y: -900, width: 1800, height: 2200, fill: 'url(#skinEye)' }, face)
  svg('path', { d: 'M -520 -330 Q -60 -470 470 -300', fill: 'none', stroke: '#3a2416', 'stroke-width': 70, 'stroke-linecap': 'round' }, face)
  svg('path', { d: 'M -700 -720 L 700 -720 L 700 -470 Q 0 -620 -700 -520 Z', fill: '#2a1a10' }, face)
  svg('path', { d: 'M 520 -120 Q 600 200 520 520', fill: 'none', stroke: '#c48f6e', 'stroke-width': 30, opacity: 0.6 }, face)
  // L'œil.
  const eyeClip = svg('clipPath', { id: 'eyeClip' }, defs)
  const eyeShape = svg('path', { d: 'M -420 0 C -240 -280 240 -280 420 0 C 240 220 -240 220 -420 0 Z' }, eyeClip)
  void eyeShape
  const eyeG = svg('g', { 'clip-path': 'url(#eyeClip)' }, face)
  svg('rect', { x: -440, y: -300, width: 880, height: 600, fill: '#fbf7f2' }, eyeG)
  svg('path', { d: 'M -420 0 C -240 -280 240 -280 420 0', fill: 'none', stroke: '#e6c2b2', 'stroke-width': 40, opacity: 0.5 }, eyeG)
  const iris = svg('g', {}, eyeG)
  svg('circle', { r: 175, fill: 'url(#irisG)' }, iris)
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2
    svg('path', { d: `M ${Math.cos(a) * 70} ${Math.sin(a) * 70} L ${Math.cos(a) * 165} ${Math.sin(a) * 165}`, stroke: '#9a6a40', 'stroke-width': 5, opacity: 0.45 }, iris)
  }
  const pupil = svg('circle', { r: 72, fill: '#07050a' }, iris)
  const reflR = svg('rect', { x: 18, y: -66, width: 40, height: 26, rx: 8, fill: '#ff3b4f' }, iris)
  const reflB = svg('rect', { x: -60, y: -56, width: 34, height: 22, rx: 8, fill: '#3b82f6' }, iris)
  svg('circle', { cx: 46, cy: -40, r: 18, fill: '#ffffff', opacity: 0.9 }, iris)
  // Le petit reflet de la balle qui arrive, dans la pupille.
  const reflBall = svg('circle', { cx: -10, cy: 10, r: 4, fill: '#ffffff' }, iris)
  // Paupière (descend après l'impact).
  const lid = svg('path', { fill: 'url(#skinEye)' }, face)
  const lidEdge = svg('path', { fill: 'none', stroke: '#2a1a10', 'stroke-width': 14, 'stroke-linecap': 'round' }, face)
  svg('path', { d: 'M -420 0 C -240 -280 240 -280 420 0', fill: 'none', stroke: '#2a1a10', 'stroke-width': 16, 'stroke-linecap': 'round' }, face)
  for (let k = 0; k < 9; k++) svg('path', { d: `M ${-300 + k * 75} ${-205 + Math.abs(k - 4) * 14} l ${-8 + k * 2} -60`, stroke: '#2a1a10', 'stroke-width': 8, 'stroke-linecap': 'round' }, face)
  // La balle qui arrive face caméra.
  const ball = svg('g', {}, L.fx)
  svg('circle', { r: 60, fill: 'url(#ballG)', stroke: '#2a2f3a', 'stroke-width': 4 }, ball)
  svg('path', { d: 'M -60 0 A 60 22 0 0 0 60 0', fill: 'none', stroke: '#8a92a6', 'stroke-width': 4 }, ball)
  const trail = Array.from({ length: 6 }, () => svg('circle', { r: 60, fill: '#ffffff', opacity: 0 }, L.fx))
  // Les fissures (comme un objectif brisé) et les ondes de choc.
  const cracks = svg('g', { transform: 'translate(560 860)' }, L.fx)
  const rc = rng(7)
  for (let k = 0; k < 11; k++) {
    let x = 0
    let y = 0
    let d = 'M 0 0'
    const a0 = (k / 11) * Math.PI * 2 + rc() * 0.4
    for (let s = 0; s < 6; s++) {
      const a = a0 + (rc() - 0.5) * 0.7
      x += Math.cos(a) * (70 + rc() * 120)
      y += Math.sin(a) * (70 + rc() * 120)
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`
    }
    svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 6, 'stroke-linejoin': 'round', 'stroke-dasharray': 1400, 'stroke-dashoffset': 1400 }, cracks)
  }
  const rings = [0, 1, 2].map(() => svg('circle', { cx: 560, cy: 860, r: 0, fill: 'none', stroke: '#ffffff', 'stroke-width': 14, opacity: 0 }, L.fx))
  // La moitié gauche de la vue qui s'éteint.
  const dark = svg('rect', { x: -400, y: -400, width: 940, height: H + 800, fill: '#000000', opacity: 0 }, L.fx)
  const darkEdge = svg('rect', { x: 500, y: -400, width: 120, height: H + 800, fill: '#000000', opacity: 0 }, L.fx)
  return { gyR, gyB, face, iris, pupil, reflR, reflB, reflBall, lid, lidEdge, ball, trail, cracks, rings, dark, darkEdge }
})

// 2 · Trois secondes plus tôt : la ligne de police, le pavé, le tir.
const PAVE = scene('pave', (L) => {
  bg(L, 'url(#streetGas)')
  const r = rng(17)
  // Immeubles, lampadaires, fenêtres.
  for (let i = 0; i < 7; i++) {
    const x = -120 + i * 190
    const h = 520 + r() * 380
    svg('rect', { x, y: 1180 - h, width: 180, height: h + 300, fill: '#0e1426' }, L.far)
    for (let j = 0; j < 7; j++) for (let k = 0; k < 3; k++) if (r() < 0.4) svg('rect', { x: x + 20 + k * 52, y: 1220 - h + j * 74, width: 28, height: 38, fill: '#ffcf7a', opacity: 0.45 }, L.far)
  }
  // Le sol (pavés), les fumigènes.
  svg('rect', { x: -400, y: 1180, width: W + 800, height: 1400, fill: '#1a1f2c' }, L.far)
  for (let k = 0; k < 14; k++) svg('path', { d: `M ${-300 + k * 120} 1180 L ${-600 + k * 200} 2000`, stroke: '#232a3a', 'stroke-width': 6 }, L.far)
  // Contre-jours : projecteurs bleutés derrière la police, lueur orange des fumigènes derrière la foule.
  svg('ellipse', { cx: 200, cy: 1150, rx: 520, ry: 420, fill: 'url(#spot)', opacity: 0.9 }, L.far)
  svg('ellipse', { cx: 880, cy: 1200, rx: 520, ry: 420, fill: 'url(#flare)', opacity: 0.7 }, L.far)
  const flares = [fire(L.mid, 980, 1290, 0.45, 41), fire(L.mid, 700, 1330, 0.3, 42)]
  // La ligne de police (à gauche), le tireur un peu en avant.
  const line = svg('g', {}, L.mid)
  const cops = [0, 1, 2, 3].map((k) => {
    const c = cop(line)
    c.g.setAttribute('transform', `translate(${-60 + k * 110} ${1350 + (k % 2) * 16}) scale(${0.9 + (k % 2) * 0.06})`)
    return c
  })
  const shooterCop = cop(L.actor, { armed: true })
  // Les manifestants (à droite), bannière, silhouettes qui bougent.
  const crowd = Array.from({ length: 8 }, (_, k) => {
    const g = svg('g', {}, L.mid)
    svg('circle', { cx: 0, cy: -230, r: 30, fill: '#0c0f1c' }, g)
    svg('rect', { x: -38, y: -200, width: 76, height: 200, rx: 28, fill: '#0c0f1c' }, g)
    return { g, x: 640 + (k % 4) * 120 + (k > 3 ? 60 : 0), y: 1330 - (k > 3 ? 70 : 0), ph: r() * 6, s: k > 3 ? 0.8 : 0.95 }
  })
  const banner = svg('g', { transform: 'translate(860 960) rotate(-4) scale(0.7)' }, L.mid)
  svg('rect', { x: -230, y: -60, width: 460, height: 120, rx: 8, fill: '#f4efe2', stroke: '#10121a', 'stroke-width': 5 }, banner)
  txt(banner, 'JUSTICE ! ', { x: 0, y: 22, 'font-size': 64, fill: '#c43a2f' })
  // Théo, au premier plan, qui lance le pavé.
  const theo = thrower(L.actor)
  const stone = pave(L.fx, 1)
  const stoneTrail = Array.from({ length: 5 }, () => pave(L.fx, 1))
  // La mesure « 6 mètres ».
  const meas = svg('g', { opacity: 0 }, L.fx)
  const measLine = svg('path', { fill: 'none', stroke: '#ffd166', 'stroke-width': 8, 'stroke-dasharray': '22 14' }, meas)
  const measTxt = txt(meas, '6 M', { 'font-size': 70, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10, 'paint-order': 'stroke fill' })
  // La trajectoire de la balle de défense.
  const tracer = svg('path', { fill: 'none', stroke: '#fff2b0', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0 }, L.fx)
  // Gaz lacrymogène qui dérive.
  const gas = Array.from({ length: 9 }, () => ({ el: svg('circle', { r: 160 + r() * 160, fill: 'url(#gas)', opacity: 0.6 }, L.front), x: r() * W, y: 900 + r() * 700, ph: r() }))
  const gyR = svg('ellipse', { cx: -100, cy: 1000, rx: 900, ry: 900, fill: 'url(#glowRed)', opacity: 0 }, L.front)
  const gyB = svg('ellipse', { cx: 300, cy: 1000, rx: 900, ry: 900, fill: 'url(#glowBlue)', opacity: 0 }, L.front)
  return { flares, cops, shooterCop, crowd, theo, stone, stoneTrail, meas, measLine, measTxt, tracer, gas, gyR, gyB }
})

// 3 · Le policier dans le box.
const JUGE = scene('juge', (L) => {
  bg(L, 'url(#court)')
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, L.far)
  const flic = makePerson(L.actor, FLIC)
  // Son casque posé sur le rebord du box.
  const helmet = svg('g', { transform: 'translate(800 1620)' }, L.front)
  svg('path', { d: 'M -110 0 C -110 -140 110 -140 110 0 Z', fill: '#20283c', stroke: '#10121a', 'stroke-width': 6 }, helmet)
  svg('path', { d: 'M -100 -40 L 100 -40 L 108 10 L -108 10 Z', fill: '#9fc6ff', opacity: 0.6 }, helmet)
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)' }, bars)
  svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, bars)
  svg('rect', { x: -100, y: 1640, width: W + 200, height: 400, fill: '#1a2147' }, L.front)
  svg('rect', { x: -100, y: 1630, width: W + 200, height: 20, fill: '#3b4a86' }, L.front)
  L.front.append(helmet)
  return { flic, bars }
})

// 4 · Le procès.
const TRIB = scene('tribunal', (L) => {
  const procBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#court)' }, procBg)
  svg('path', { d: 'M 640 220 L 640 760 L 960 760 L 960 220 A 160 160 0 0 0 640 220 Z', fill: '#3b4a86' }, procBg)
  svg('path', { d: 'M 800 120 L 800 760 M 640 450 L 960 450', stroke: '#27305a', 'stroke-width': 18 }, procBg)
  svg('path', { d: 'M 640 260 L 960 260 L 700 1900 L -200 1900 Z', fill: 'url(#beam)', opacity: 0.5 }, procBg)
  paint('../fonds/essai/fond-procureur.jpg', procBg)
  svg('rect', { x: -210, y: -45, width: 1500, height: 2010, fill: 'url(#shade)' }, procBg)
  const avoBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#courtRed)' }, avoBg)
  const r = rng(9)
  for (let i = 0; i < 16; i++) svg('circle', { cx: r() * W, cy: 200 + r() * 1100, r: 30 + r() * 90, fill: '#ffb36b', opacity: 0.06 + r() * 0.08 }, avoBg)
  paint('../fonds/essai/fond-defense.jpg', avoBg)
  svg('rect', { x: -210, y: -45, width: 1500, height: 2010, fill: 'url(#shade)' }, avoBg)
  const hotBg = svg('g', {}, L.far)
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  // Le carton du milieu : le verdict d'Inès, puis « abonne-toi ».
  const pauseBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#10121a' }, pauseBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.08 }, pauseBg)
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
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  const panel = (g, w = 820, h = 380) => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 8 }, g)
  // Une silhouette-cible (pour le règlement et la visée).
  const target = (g, s = 1) => {
    const t = svg('g', { transform: `scale(${s})` }, g)
    const legs = svg('path', { d: 'M -40 60 L -50 200 L -20 200 L 0 90 L 20 200 L 50 200 L 40 60 Z', fill: '#12a150' }, t)
    const torso = svg('rect', { x: -70, y: -90, width: 140, height: 160, rx: 40, fill: '#12a150' }, t)
    const head = svg('circle', { cy: -140, r: 50, fill: '#e5484d' }, t)
    return { t, legs, torso, head }
  }
  // 04 : le règlement.
  let rule
  const rules = prop((g) => {
    panel(g, 820, 460)
    rule = target(g, 1)
    rule.t.setAttribute('transform', 'translate(-200 10) scale(0.95)')
    txt(g, 'AUTORISÉ', { x: 160, y: 40, 'font-size': 52, fill: '#12a150' })
    txt(g, 'JAMBES · TORSE', { x: 160, y: 96, 'font-size': 34, fill: '#9fe6bf' })
    txt(g, 'INTERDIT', { x: 160, y: -120, 'font-size': 52, fill: '#e5484d' })
    txt(g, 'LA TÊTE', { x: 160, y: -66, 'font-size': 34, fill: '#ffb3b3' })
    g.hit = svg('circle', { cx: -200, cy: -123, r: 0, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 10 }, g)
  })
  // 05 : le casque fendu.
  let crack
  const helmet = prop((g) => {
    svg('path', { d: 'M -200 40 C -200 -230 200 -230 200 40 Z', fill: '#20283c', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('path', { d: 'M -186 -40 L 186 -40 L 196 50 L -196 50 Z', fill: '#9fc6ff', opacity: 0.55, stroke: '#d7e6ff', 'stroke-width': 4 }, g)
    svg('rect', { x: -60, y: -190, width: 120, height: 18, rx: 6, fill: '#3a4666' }, g)
    crack = svg('path', { d: 'M -20 -205 L 10 -160 L -16 -120 L 22 -80 L -4 -40', fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-dasharray': 300, 'stroke-dashoffset': 300 }, g)
  })
  // 06 : le viseur sur la tête, puis l'appareil photo.
  let scopeT, cam
  const scope = prop((g) => {
    panel(g, 760, 440)
    scopeT = target(g, 0.9)
    scopeT.t.setAttribute('transform', 'translate(-170 30) scale(0.9)')
    const c = svg('g', {}, g)
    svg('circle', { r: 90, fill: 'none', stroke: '#e5484d', 'stroke-width': 8 }, c)
    svg('path', { d: 'M -120 0 L -40 0 M 40 0 L 120 0 M 0 -120 L 0 -40 M 0 40 L 0 120', stroke: '#e5484d', 'stroke-width': 7 }, c)
    g.cross = c
    cam = svg('g', { transform: 'translate(190 0)' }, g)
    svg('rect', { x: -130, y: -80, width: 260, height: 170, rx: 24, fill: '#2a2f3a', stroke: '#10121a', 'stroke-width': 6 }, cam)
    svg('rect', { x: -70, y: -110, width: 80, height: 36, rx: 8, fill: '#2a2f3a', stroke: '#10121a', 'stroke-width': 6 }, cam)
    svg('circle', { cx: 0, cy: 6, r: 62, fill: '#10121a', stroke: '#9aa3b5', 'stroke-width': 8 }, cam)
    g.lens = svg('circle', { cx: 0, cy: 6, r: 40, fill: '#3b82f6' }, cam)
    g.half = svg('path', { d: 'M 0 -34 A 40 40 0 0 0 0 46 Z', fill: '#000000', opacity: 0 }, cam)
  })
  // 07 : la balance, un appareil contre un pavé de 10 kg.
  const scale = prop((g) => {
    svg('rect', { x: -10, y: -40, width: 20, height: 300, fill: '#e1bf63' }, g)
    svg('rect', { x: -110, y: 250, width: 220, height: 30, rx: 12, fill: '#e1bf63' }, g)
    const beam = svg('g', {}, g)
    svg('rect', { x: -300, y: -50, width: 600, height: 20, rx: 10, fill: '#e1bf63' }, beam)
    const panL = svg('g', {}, beam)
    const panR = svg('g', {}, beam)
    for (const [pan, x] of [[panL, -280], [panR, 280]]) {
      svg('path', { d: `M ${x} -40 L ${x - 70} 90 M ${x} -40 L ${x + 70} 90`, stroke: '#e1bf63', 'stroke-width': 6 }, pan)
      svg('path', { d: `M ${x - 100} 90 Q ${x} 150 ${x + 100} 90 Z`, fill: '#e1bf63' }, pan)
    }
    const c = svg('g', { transform: 'translate(-280 50) scale(0.5)' }, panL)
    svg('rect', { x: -130, y: -80, width: 260, height: 170, rx: 24, fill: '#2a2f3a', stroke: '#10121a', 'stroke-width': 8 }, c)
    svg('circle', { cx: 0, cy: 6, r: 62, fill: '#10121a', stroke: '#9aa3b5', 'stroke-width': 8 }, c)
    const p = pave(panR, 1.25)
    p.setAttribute('transform', 'translate(280 40) scale(1.25)')
    txt(panR, '10 KG', { x: 280, y: -50, 'font-size': 44, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 8, 'paint-order': 'stroke fill' })
    g.beam = beam
    g.panL = panL
    g.panR = panR
  })
  // 09 : le pavé ? / le tir prouvé.
  const proof = prop((g) => {
    panel(g, 820, 360)
    const p = pave(g, 1.6)
    p.setAttribute('transform', 'translate(-220 20) scale(1.6)')
    g.q = txt(g, '?', { x: -220, y: -80, 'font-size': 110, fill: '#ffd166' })
    const w = lbd(g, 0.9)
    w.setAttribute('transform', 'translate(130 10) scale(0.9)')
    g.ok = svg('g', { transform: 'translate(200 -110) rotate(-8)', opacity: 0 }, g)
    svg('rect', { x: -130, y: -40, width: 260, height: 80, rx: 14, fill: 'rgba(255,255,255,0.9)', stroke: '#e5484d', 'stroke-width': 8 }, g.ok)
    txt(g.ok, 'PROUVÉ', { x: 0, y: 20, 'font-size': 52, fill: '#e5484d' })
  })
  // 10 : le chaos, puis le choix en une seconde.
  const choice = prop((g) => {
    for (const sd of [-1, 1]) {
      const p = svg('g', { transform: `translate(${sd * 215} 0)` }, g)
      svg('rect', { x: -200, y: -200, width: 400, height: 400, rx: 24, fill: '#10121a', stroke: sd < 0 ? '#3b82f6' : '#e5484d', 'stroke-width': 8 }, p)
      if (sd < 0) {
        const lg = lyingGuard(p, { color: '#3a4060', rim: '#7fb0ff' })
        lg.setAttribute('transform', 'translate(10 90) scale(0.85)')
        txt(p, 'SON COLLÈGUE', { x: 0, y: -130, 'font-size': 38, fill: '#7fb0ff' })
        txt(p, 'À TERRE', { x: 0, y: -84, 'font-size': 38, fill: '#7fb0ff' })
      } else {
        const fig = svg('g', { transform: 'translate(0 170) scale(0.62)' }, p)
        svg('rect', { x: -40, y: -230, width: 80, height: 140, rx: 30, fill: '#3a4060', transform: 'rotate(28 0 -90)' }, fig)
        svg('circle', { cx: 80, cy: -230, r: 32, fill: '#3a4060' }, fig)
        svg('path', { d: 'M -10 -90 L -40 0 M 14 -90 L 36 0', stroke: '#3a4060', 'stroke-width': 28, 'stroke-linecap': 'round' }, fig)
        svg('path', { d: 'M 40 -170 L 120 -40', stroke: '#3a4060', 'stroke-width': 24, 'stroke-linecap': 'round' }, fig)
        const pv = pave(fig, 1)
        pv.setAttribute('transform', 'translate(140 -10)')
        txt(p, 'UN HOMME', { x: 0, y: -130, 'font-size': 38, fill: '#ff9aa2' })
        txt(p, 'QUI SE BAISSE', { x: 0, y: -84, 'font-size': 38, fill: '#ff9aa2' })
      }
    }
    g.bar = svg('rect', { x: -420, y: 214, width: 840, height: 22, rx: 11, fill: '#ffd166' }, g)
    g.secs = txt(g, '1,0 S', { x: 0, y: 320, 'font-size': 60, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 8, 'paint-order': 'stroke fill' })
  })
  // Explosions de grenades (au début de la réplique 10).
  const booms = Array.from({ length: 5 }, (_, k) => {
    const g = svg('g', { display: 'none' }, P)
    svg('circle', { r: 120, fill: 'url(#flashGlow)' }, g)
    svg('path', { d: 'M 0 -60 L 14 -16 L 60 0 L 14 16 L 0 60 L -14 16 L -60 0 L -14 -16 Z', fill: '#fff9d8' }, g)
    return { g, x: 160 + ((k * 337) % 760), y: 300 + ((k * 211) % 500), d: k * 0.14 }
  })
  // 12 : le collègue à l'hôpital.
  const hosp = prop((g) => {
    panel(g, 760, 400)
    svg('rect', { x: -300, y: 60, width: 600, height: 60, rx: 18, fill: '#e9eef7' }, g)
    svg('rect', { x: -320, y: 110, width: 640, height: 30, rx: 10, fill: '#9aa3b5' }, g)
    svg('circle', { cx: -200, cy: 40, r: 60, fill: '#e8bb98' }, g)
    svg('path', { d: 'M -262 20 C -250 -40 -150 -40 -138 20', fill: '#ffffff', stroke: '#d0d6e2', 'stroke-width': 6 }, g)
    svg('rect', { x: -264, y: 10, width: 128, height: 26, rx: 10, fill: '#ffffff', stroke: '#d0d6e2', 'stroke-width': 4 }, g)
    svg('rect', { x: -140, y: 30, width: 420, height: 50, rx: 24, fill: '#9fc6ff' }, g)
    const ecg = svg('path', { fill: 'none', stroke: '#3dff9a', 'stroke-width': 6 }, g)
    g.ecg = ecg
    svg('path', { d: 'M 150 -150 L 210 -150 L 210 -110 L 250 -110 L 250 -50 L 210 -50 L 210 -10 L 150 -10 L 150 -50 L 110 -50 L 110 -110 L 150 -110 Z', fill: '#e5484d' }, g)
  })
  // 13 : deux victimes.
  const victims = prop((g) => {
    for (const sd of [-1, 1]) {
      const v = svg('g', { transform: `translate(${sd * 200} 0)` }, g)
      svg('rect', { x: -170, y: -220, width: 340, height: 440, rx: 22, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, v)
      svg('circle', { cy: -40, r: 90, fill: sd < 0 ? '#eebd9a' : '#e8bb98', stroke: '#10121a', 'stroke-width': 5 }, v)
      if (sd < 0) {
        svg('path', { d: 'M -90 -70 C -80 -150 80 -150 90 -70 C 60 -110 -60 -110 -90 -70 Z', fill: '#2a1810' }, v)
        svg('ellipse', { cx: -32, cy: -40, rx: 30, ry: 26, fill: '#10121a' }, v)
        svg('path', { d: 'M -90 -60 L 90 -20', stroke: '#10121a', 'stroke-width': 6 }, v)
        svg('circle', { cx: 34, cy: -40, r: 10, fill: '#10121a' }, v)
        txt(v, 'THÉO', { y: 120, 'font-size': 46, fill: '#10121a' })
        txt(v, 'UN ŒIL EN MOINS', { y: 170, 'font-size': 30, fill: '#e5484d' })
      } else {
        svg('path', { d: 'M -94 -50 C -90 -140 90 -140 94 -50 Z', fill: '#ffffff', stroke: '#d0d6e2', 'stroke-width': 5 }, v)
        svg('rect', { x: -96, y: -76, width: 192, height: 28, rx: 10, fill: '#ffffff', stroke: '#d0d6e2', 'stroke-width': 4 }, v)
        for (const x of [-32, 32]) svg('circle', { cx: x, cy: -30, r: 10, fill: '#10121a' }, v)
        txt(v, 'SON COLLÈGUE', { y: 120, 'font-size': 46, fill: '#10121a' })
        txt(v, 'À L’HÔPITAL', { y: 170, 'font-size': 30, fill: '#3b82f6' })
      }
    }
  })
  // 08 : la fiche d'Inès (l'affaire précédente) et son verdict.
  const ines = svg('g', { display: 'none' }, P)
  svg('rect', { x: -330, y: -380, width: 660, height: 760, rx: 26, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, ines)
  svg('rect', { x: -330, y: -380, width: 660, height: 100, rx: 26, fill: '#1d2a5c' }, ines)
  txt(ines, 'L’AFFAIRE PRÉCÉDENTE', { y: -312, 'font-size': 40, fill: '#ffffff' })
  svg('rect', { x: -150, y: -250, width: 300, height: 320, rx: 16, fill: '#c9d6e8' }, ines)
  const ic = svg('clipPath', { id: 'inesClip' }, defs)
  svg('rect', { x: -150, y: -250, width: 300, height: 320, rx: 16 }, ic)
  const photo = svg('g', { 'clip-path': 'url(#inesClip)' }, ines)
  const inesP = makePerson(photo, INES)
  txt(ines, 'INÈS', { y: 150, 'font-size': 72, fill: '#1d2a5c' })
  txt(ines, 'LA PILLEUSE', { y: 210, 'font-size': 40, fill: '#e5484d' })
  const verdict = svg('g', { transform: 'translate(0 300) rotate(-8)' }, ines)
  svg('rect', { x: -250, y: -62, width: 500, height: 124, rx: 20, fill: 'rgba(255,255,255,0.92)', stroke: '#e5484d', 'stroke-width': 14 }, verdict)
  txt(verdict, 'COUPABLE', { y: 32, 'font-size': 92, fill: '#e5484d' })
  return { procBg, avoBg, hotBg, hotFill, pauseBg, rays, crowd, proc, avo, deskG, rules, get rule() { return rule }, helmet, get crack() { return crack }, scope, get scopeT() { return scopeT }, scale, proof, choice, booms, hosp, victims, ines, inesP, verdict }
})

// 5 · Le vote : le policier, seul, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, FLIC)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.8 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  return { actor }
})

// Transitions.
const fxTop = svg('g', {}, root)
const iris = svg('circle', { cx: 540, cy: 960, r: 0, fill: '#ffd166' }, fxTop)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ffd166' }, fxTop), d: (x + y) * 0.011 })
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)' }, root)
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

// Les instants clés du hook.
const T_HIT = Wd('01', 'tir') - 0.02 // la balle touche
const T_DARK = Wd('01', 'perd') - 0.1 // la moitié gauche s'éteint
const T_THROW = Wd('02', 'lancait') - 0.1 // le bras part
const T_SHOT = Wd('02', 'tire') - 0.05 // le policier tire
const T_BOX = SEC.juge.t0

// Le hook.
tag('UN TIR DE LBD', 'pill red', { t0: T_HIT + 0.05, t1: SEC.tir.t1, y: 250, rot: -2 })
tag('LBD = LANCEUR DE BALLES DE DÉFENSE', 'pill small', { t0: Wd('01', 'seconde') - 0.1, t1: SEC.tir.t1, y: 350 }).el.style.fontSize = '32px'
tag('ÉTUDIANT · 22 ANS', 'pill yellow', { t0: Wd('01', '22') - 0.15, t1: SEC.tir.t1, y: 1210, x: 760, rot: 3 })
fs(tag('ŒIL PERDU', 'stamp', { t0: Wd('01', 'gauche') - 0.05, t1: SEC.tir.t1, y: 1050, x: 300, rot: -8, from: 2.8, dur: 0.2 }), 96)
tag('◀◀ 3 SECONDES PLUS TÔT', 'pill', { t0: S('02') - 0.05, t1: SEC.pave.t1, y: 240 })
tag('PAVÉ', 'pill red', { t0: Wd('02', 'pave') - 0.1, t1: T_SHOT - 0.1, y: 430, x: 700, rot: 4 }).el.style.fontSize = '44px'
tag('LBD 40', 'pill yellow', { t0: Wd('02', 'policier') - 0.15, t1: SEC.pave.t1, y: 430, x: 300, rot: -4 }).el.style.fontSize = '44px'
fs(tag('JUGÉ', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.juge.t1, y: 330, rot: -8, from: 2.8, dur: 0.2 }), 150)
tag('VIOLENCES VOLONTAIRES', 'pill', { t0: Wd('03', 'violences') - 0.1, t1: SEC.juge.t1, y: 520, rot: -2 })
tag('AVEC MUTILATION', 'pill red', { t0: Wd('03', 'mutilation') - 0.1, t1: SEC.juge.t1, y: 630, rot: 2 })
// Le procès.
tag('ON NE VISE JAMAIS LA TÊTE', 'pill', { t0: Wd('04', 'jamais') - 0.15, t1: Wd('04', 'il') - 0.05, y: 230, rot: -2 })
counterTag(Wd('04', '6') - 0.1, E('04') + 0.1, 6, 'MÈTRES', { y: 230, dur: 0.35 })
fs(tag('EN PLEIN VISAGE.', 'stamp', { t0: Wd('04', 'visage') - 0.05, t1: E('04') + 0.1, y: 960, rot: -6, from: 2.8, dur: 0.2 }), 84)
tag('6 M · UN PAVÉ', 'pill yellow', { t0: S('05') - 0.05, t1: Wd('05', 'son') - 0.05, y: 230, rot: -2 })
tag('SON COLLÈGUE S’EFFONDRE', 'pill red', { t0: Wd('05', 'collegue') - 0.1, t1: Wd('05', 'et') - 0.1, y: 230, rot: -2 })
tag('CASQUE FENDU', 'pill', { t0: Wd('05', 'casque') - 0.1, t1: E('05') + 0.1, y: 370, rot: 3 })
fs(tag('AVEC PRÉCISION ?', 'slam yellow', { t0: Wd('05', 'avec') - 0.06, t1: E('05') + 0.1, y: 250, rot: -3, from: 2.6, dur: 0.2 }), 104)
counterTag(Wd('06', '100') - 0.1, Wd('06', 'theo') - 0.1, 100, 'HEURES DE FORMATION', { y: 230, dur: 0.5 })
tag('THÉO · FUTUR PHOTOGRAPHE', 'pill yellow', { t0: Wd('06', 'photographe') - 0.2, t1: E('06') + 0.1, y: 230, rot: -2 })
fs(tag('PLUS JAMAIS DE L’ŒIL GAUCHE.', 'slam white', { t0: Wd('06', 'jamais') - 0.06, t1: E('06') + 0.1, y: 380, rot: -2, from: 2.2, dur: 0.2 }), 62)
tag('PAS UN APPAREIL.', 'pill', { t0: Wd('07', 'appareil') - 0.2, t1: E('07') + 0.1, y: 230, x: 330, rot: -3 })
tag('UN PAVÉ.', 'pill red', { t0: Wd('07', 'pave', 1) - 0.1, t1: E('07') + 0.1, y: 230, x: 780, rot: 3 })
tag('INTERDICTION DE RECULER', 'pill yellow', { t0: Wd('07', 'reculer') - 0.4, t1: E('07') + 0.1, y: 1000, rot: -2 })
// Le carton du milieu : le verdict d'Inès, puis « abonne-toi ».
tag('TON VERDICT', 'pill small', { t0: Wd('08', 'tu') - 0.1, t1: Wd('08', 'abonnetoi') - 0.15, y: 200 })
fs(tag('LA MAJORITÉ D’ENTRE VOUS', 'pill yellow', { t0: Wd('08', 'majorite') - 0.1, t1: Wd('08', 'abonnetoi') - 0.15, y: 1340, rot: -2 }), 54)
fs(tag('MERCI D’AVOIR VOTÉ', 'big white', { t0: Wd('08', 'merci') - 0.1, t1: Wd('08', 'abonnetoi') - 0.15, y: 1480, from: 1.3, dur: 0.3 }), 70)
fs(tag('AVANT LA SUITE…', 'big white', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.1, y: 700, from: 1.4, dur: 0.3 }), 104)
const sub1 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.05, t1: E('08') + 0.1, y: 980, from: 2.2, dur: 0.25 })
sub1.el.style.fontSize = '108px'
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('08', 'verdict') - 0.1, t1: E('08') + 0.1, y: 1200 }), 46)
// Suite du procès.
tag('RIEN NE PROUVE…', 'pill', { t0: S('09') - 0.05, t1: Wd('09', 'ce') - 0.1, y: 230, rot: -2 })
fs(tag('0 SOMMATION', 'stamp', { t0: Wd('09', 'sommation') - 0.05, t1: E('09') + 0.1, y: 1000, rot: -6, from: 2.8, dur: 0.2 }), 96)
counterTag(Wd('10', '300') - 0.1, Wd('10', 'il') - 0.1, 300, 'MANIFESTANTS', { y: 230, dur: 0.5 })
tag('UNE SECONDE POUR CHOISIR', 'pill red', { t0: Wd('10', 'seconde') - 0.1, t1: E('10') + 0.1, y: 230, rot: -2 })
fs(tag('SE BAISSER N’EST PAS UN CRIME.', 'slam white', { t0: Wd('11', 'crime') - 0.3, t1: Wd('11', 'il') - 0.05, y: 300, rot: -2, from: 2.2, dur: 0.2 }), 64)
fs(tag('IL N’A PAS ATTENDU.', 'slam yellow', { t0: Wd('11', 'attendu') - 0.1, t1: E('11') + 0.1, y: 300, rot: -3, from: 2.6, dur: 0.2 }), 100)
fs(tag('ATTENDRE.', 'slam yellow', { t0: S('12') - 0.06, t1: Wd('12', 'il') - 0.1, y: 260, rot: -3, from: 2.8, dur: 0.2 }), 140)
fs(tag('TOUJOURS À L’HÔPITAL.', 'slam white', { t0: Wd('12', 'lhopital') - 0.3, t1: E('12') + 0.15, y: 270, rot: -2, from: 2.4, dur: 0.2 }), 84)
fs(tag('2 VICTIMES', 'pill', { t0: Wd('13', 'deux') - 0.1, t1: Wd('13', 'mais') - 0.05, y: 230 }), 56)
const prot = fs(tag('SON MÉTIER :<br>PROTÉGER.', 'slam yellow', { t0: Wd('13', 'metier') - 0.1, t1: E('13') + 0.2, y: 330, rot: -3, from: 2.6, dur: 0.2 }), 110)
prot.el.style.cssText += 'text-align:center;line-height:1.05'
// Le vote, puis l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, y: 300, from: 1.4, dur: 0.5 }), 110)
fs(tag('LÉGITIME DÉFENSE ?', 'vote blue', { t0: Wd('14', 'legitime') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 520, rot: -3 }), 74)
fs(tag('VIOLENCE POLICIÈRE ?', 'vote red', { t0: Wd('14', 'violence') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 700, rot: 3 }), 70)
tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, y: 730, rot: 3 })
const sub2 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('15', 'abonnetoi') - 0.1, y: 1180, from: 2.2, dur: 0.25 })
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('15', 'ecris') - 0.1, y: 1330 }), 44)
fs(tag('VERDICT DANS LA PROCHAINE VIDÉO', 'pill small', { t0: Wd('15', 'verdict') - 0.1, y: 1430 }), 34)
// Les boutons « abonne-toi » battent comme un cœur.
for (const b of [sub1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés (pas sur les deux appels à s'abonner : les boutons le disent).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['08-pause', '15-abonne'].includes(l.id))) {
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
  [T_HIT, 26],
  [Wd('01', 'gauche') - 0.05, 10],
  [T_SHOT, 18],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'visage') - 0.05, 12],
  [Wd('05', 'casque') - 0.1, 10],
  [Wd('05', 'avec') - 0.06, 8],
  [Wd('06', 'jamais') - 0.06, 12],
  [Wd('07', 'pave', 1) - 0.1, 10],
  [Wd('08', 'coupable') - 0.05, 14],
  [Wd('08', 'abonnetoi') - 0.1, 8],
  [Wd('09', 'sommation') - 0.05, 12],
  [Wd('11', 'attendu') - 0.1, 10],
  [Wd('12', 'lhopital') - 0.3, 10],
  [Wd('13', 'proteger') - 0.06, 16],
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
const HOT = { 12: '#b3232b', 13: '#1d2a5c' }
const BEATS = C.lines.filter((l) => l.who !== 'narrateur').flatMap((l) => l.words.filter((w) => /[.?!…»]$/.test(w.w)).map((w) => ({ t: w.t, who: l.who })))

// Traînées du panoramique filé.
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)
// Effet « retour en arrière » : bandes de bruit, décalage horizontal.
const rewind = svg('g', { display: 'none' }, root)
const rwBands = Array.from({ length: 7 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0.25 }, rewind))
const rwTxt = txt(rewind, '◀◀', { x: 900, y: 240, 'font-size': 90, fill: '#ffffff' })

// Trajectoire du pavé (scène 2) : de la main de Théo vers la ligne de police.
const STONE_FROM = [850, 1050]
const STONE_TO = [250, 1150]
const stoneAt = (u) => [lerp(STONE_FROM[0], STONE_TO[0], u), lerp(STONE_FROM[1], STONE_TO[1], u) - 420 * Math.sin(Math.PI * u)]

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === TIR) {
    const hit = t >= T_HIT
    const k = t - T_HIT
    // Avant l'impact : l'œil regarde, les gyrophares se reflètent ; la balle grossit, face caméra.
    cam(TIR, t, { zoom: hit ? 1.0 + 0.05 * Math.exp(-k * 3) : lerp(1.15, 1.25, clamp(t / T_HIT)), cx: 540, cy: 900, push: 0.02, from: T_HIT, hand: hit ? 3 : 1, flat: true })
    const ph = (t * 2.6) % 1
    TIR.gyR.setAttribute('opacity', ph < 0.5 ? 0.38 : 0.08)
    TIR.gyB.setAttribute('opacity', ph < 0.5 ? 0.08 : 0.38)
    TIR.reflR.setAttribute('opacity', ph < 0.5 ? 1 : 0.25)
    TIR.reflB.setAttribute('opacity', ph < 0.5 ? 0.25 : 1)
    const look = hit ? 0 : Math.sin(t * 4) * 12
    TIR.iris.setAttribute('transform', `translate(${look} ${-6})`)
    TIR.pupil.setAttribute('r', hit ? 40 : 72 - 20 * clamp(t / T_HIT))
    const u = clamp((t + 0.05) / (T_HIT + 0.05))
    show(TIR.ball, !hit)
    TIR.reflBall.setAttribute('r', hit ? 0 : 3 + 16 * ease.in3(u))
    if (!hit) TIR.ball.setAttribute('transform', `translate(${lerp(640, 560, u)} ${lerp(760, 860, u)}) scale(${(0.08 + 3.4 * ease.in3(u)).toFixed(3)})`)
    TIR.trail.forEach((c, i) => {
      const uu = clamp(u - (i + 1) * 0.06)
      c.setAttribute('cx', lerp(640, 560, uu))
      c.setAttribute('cy', lerp(760, 860, uu))
      c.setAttribute('r', (60 * (0.08 + 3.4 * ease.in3(uu))).toFixed(1))
      c.setAttribute('opacity', !hit && uu > 0 ? (0.12 * (1 - i / 6)).toFixed(2) : 0)
    })
    // Impact : ondes, fissures ; la paupière tombe ; la moitié gauche de la vue s'éteint.
    TIR.rings.forEach((rg, i) => {
      const v = (k - i * 0.1) / 0.6
      const on = v > 0 && v < 1
      rg.setAttribute('r', on ? 60 + 700 * ease.out3(v) : 0)
      rg.setAttribute('opacity', on ? (1 - v).toFixed(2) : 0)
    })
    ;[...TIR.cracks.children].forEach((c, i) => c.setAttribute('stroke-dashoffset', 1400 * (1 - prog(t, T_HIT + i * 0.012, 0.25, ease.out3))))
    const lidD = hit ? clamp(0.55 + 0.45 * prog(t, T_HIT + 0.05, 0.5, ease.out3)) : 0
    const yl = lerp(-260, 200, lidD)
    TIR.lid.setAttribute('d', `M -470 -330 L 470 -330 L 470 0 C 240 ${yl * 0.9} -240 ${yl * 0.9} -470 0 Z`)
    TIR.lidEdge.setAttribute('d', hit ? `M -420 0 C -240 ${yl * 0.9} 240 ${yl * 0.9} 420 0` : '')
    const dk = prog(t, T_DARK, 0.6, ease.io3)
    TIR.dark.setAttribute('opacity', (0.92 * dk).toFixed(2))
    TIR.darkEdge.setAttribute('opacity', (0.55 * dk).toFixed(2))
    TIR.dark.setAttribute('x', lerp(-1400, -400, ease.out3(dk)))
  }
  if (cur === PAVE) {
    // Plan large : on part sur Théo (à droite), on suit le pavé vers la ligne de police (à gauche).
    const u = prog(t, T_THROW + 0.15, T_SHOT - T_THROW - 0.25, ease.linear)
    const fol = ease.io2(prog(t, T_THROW, T_SHOT - T_THROW, ease.linear))
    const shotK = prog(t, T_SHOT, 0.3, ease.out3)
    cam(PAVE, t, { zoom: lerp(1.3, 1.12, fol) + 0.12 * shotK, cx: lerp(760, 520, fol), cy: lerp(1260, 1240, fol), push: 0, hand: 4 })
    for (const f of PAVE.flares) f(t)
    PAVE.cops.forEach((c, i) => {
      const [x, y] = [-60 + i * 110, 1350 + (i % 2) * 16]
      c.g.setAttribute('transform', `translate(${x + 3 * Math.sin(t * 2 + i)} ${y}) scale(${0.9 + (i % 2) * 0.06})`)
    })
    // Le tireur avance d'un pas et épaule.
    const aim = prog(t, Wd('02', 'policier') - 0.3, 0.4, ease.out3)
    PAVE.shooterCop.g.setAttribute('transform', `translate(${lerp(250, 300, aim)} 1500) scale(1.5) rotate(${lerp(6, 0, aim)})`)
    PAVE.shooterCop.flash.setAttribute('opacity', t >= T_SHOT ? clamp(1 - (t - T_SHOT) / 0.12).toFixed(2) : 0)
    PAVE.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 8 * Math.sin(t * 1.7 + c.ph)} ${c.y + 6 * Math.abs(Math.sin(t * 3 + c.ph))}) scale(${c.s})`))
    // Théo : il ramasse, arme, lance ; puis il se baisse.
    const arm = t < T_THROW ? 0 : ease.out3(clamp((t - T_THROW) / 0.25))
    PAVE.theo.g.setAttribute('transform', `translate(930 1540) scale(1.6) rotate(${lerp(-6, 8, arm)})`)
    const hand = PAVE.theo.update(arm)
    void hand
    // Le pavé, au ralenti, avec sa traînée.
    const flying = t >= T_THROW + 0.15 && t < T_SHOT + 0.5
    show(PAVE.stone, flying || t < T_THROW + 0.15)
    if (t < T_THROW + 0.15) PAVE.stone.setAttribute('transform', `translate(${STONE_FROM[0] - 30} ${STONE_FROM[1] - 40}) scale(1.5)`)
    else {
      const [x, y] = stoneAt(Math.min(1, u))
      PAVE.stone.setAttribute('transform', `translate(${x} ${y}) rotate(${u * 540}) scale(1.5)`)
    }
    PAVE.stoneTrail.forEach((s, i) => {
      const uu = u - (i + 1) * 0.035
      show(s, flying && uu > 0)
      if (uu > 0) {
        const [x, y] = stoneAt(uu)
        s.setAttribute('transform', `translate(${x} ${y}) rotate(${uu * 540}) scale(1.5)`)
        s.setAttribute('opacity', (0.28 * (1 - i / 5)).toFixed(2))
      }
    })
    // La mesure « 6 M » entre le tireur et Théo.
    const m = prog(t, Wd('02', 'ligne') - 0.1, 0.4, ease.out3)
    PAVE.meas.setAttribute('opacity', m.toFixed(2))
    PAVE.measLine.setAttribute('d', `M 400 1560 L ${lerp(400, 880, m)} 1560`)
    PAVE.measTxt.setAttribute('x', 640)
    PAVE.measTxt.setAttribute('y', 1530)
    // Le tir : trait lumineux vers le visage de Théo.
    const tr = (t - T_SHOT) / 0.18
    PAVE.tracer.setAttribute('opacity', tr > 0 && tr < 1.6 ? clamp(1.6 - tr).toFixed(2) : 0)
    PAVE.tracer.setAttribute('d', `M 520 1150 L ${lerp(520, 920, clamp(tr))} ${lerp(1150, 1100, clamp(tr))}`)
    for (const g of PAVE.gas) {
      const v = (t * 0.06 + g.ph) % 1
      g.el.setAttribute('cx', g.x + 120 * Math.sin(v * 6.28))
      g.el.setAttribute('cy', g.y - 60 * v)
    }
    const ph = (t * 2.6) % 1
    PAVE.gyR.setAttribute('opacity', ph < 0.5 ? 0.4 : 0.06)
    PAVE.gyB.setAttribute('opacity', ph < 0.5 ? 0.06 : 0.4)
  }
  if (cur === JUGE) {
    const hit = prog(t, Wd('03', 'juge') - 0.05, 0.4, ease.out3)
    cam(JUGE, t, { zoom: 1.05 + 0.08 * hit, cy: 980, push: 0.03, hand: 2 })
    JUGE.flic.update(t, { x: 540, y: 1230, scale: 1.4, brows: 'sad', look: [-0.2, 0.15 + 0.3 * hit], headNod: 0.15 * hit, armR: [0.1, 0.7], armL: [0.1, 0.7], seed: 1.4 })
    const fall = prog(t, T_BOX + 0.15, 0.35, ease.back(1.4))
    JUGE.bars.setAttribute('transform', `translate(0 ${lerp(-2300, 0, fall)})`)
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = HOT[id]
    show(TRIB.procBg, isProc && !hot && !pause)
    show(TRIB.avoBg, !isProc && !hot && !pause)
    show(TRIB.hotBg, !!hot)
    show(TRIB.pauseBg, pause)
    if (hot) TRIB.hotFill.setAttribute('fill', hot)
    show(TRIB.proc.root, isProc && !pause)
    show(TRIB.avo.root, !isProc && !pause)
    show(TRIB.deskG, !pause)
    for (const c of TRIB.crowd) show(c.g, !pause)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…»]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    if (pause) {
      cam(TRIB, t, { zoom: 1, push: 0.02, from: l.start, hand: 0, flat: true })
      TRIB.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 30) % 360})`)
    } else cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch) + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 900, Math.min(1, punch)), push: 0.02, from: l.start - 0.12, rot: side * 0.6 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    if (!pause)
      P.update(t, {
        x: 540 + side * 60,
        y: 1170,
        scale: 1.4,
        lean: side * -0.03 + bk * side * -0.03,
        mouth: m,
        brows: isProc ? (['06', '11', '13'].includes(id) ? 'angry' : 'determined') : ['10', '12'].includes(id) ? 'angry' : 'determined',
        look: [side * -0.4, 0],
        armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
        armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
        point: bk > 0.3,
        seed: isProc ? 0.5 : 1.7,
        headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
        headNod: 0.08 * bk,
      })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph))})`))
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    if (prop(TRIB.rules, id === '04', S('04') + 0.2, E('04') + 0.05, 540, 680, 0.82) > 0) {
      const pulse = t > Wd('04', 'tete') - 0.1 ? 0.5 + 0.5 * Math.sin(t * 14) : 0
      TRIB.rule.head.setAttribute('stroke', '#ffffff')
      TRIB.rule.head.setAttribute('stroke-width', (pulse * 10).toFixed(1))
      const hk = prog(t, Wd('04', 'visage') - 0.05, 0.25, ease.back(2))
      TRIB.rules.hit.setAttribute('r', (hk * 26).toFixed(1))
    }
    if (prop(TRIB.helmet, id === '05', Wd('05', 'son') - 0.15, E('05') + 0.05, 540, 690, 0.8, -6) > 0) TRIB.crack.setAttribute('stroke-dashoffset', 300 * (1 - prog(t, Wd('05', 'fendu') - 0.15, 0.25, ease.out3)))
    if (prop(TRIB.scope, id === '06', Wd('06', 'vise', 1) - 0.4, E('06') + 0.05, 540, 690, 0.85) > 0) {
      // Le viseur glisse des jambes jusqu'à la tête ; puis l'objectif de l'appareil s'éteint à moitié.
      const v = prog(t, Wd('06', 'vise', 1) - 0.3, 0.6, ease.io3)
      TRIB.scope.cross.setAttribute('transform', `translate(-170 ${lerp(150, -96, v)}) scale(0.62)`)
      TRIB.scope.half.setAttribute('opacity', prog(t, Wd('06', 'jamais') - 0.1, 0.4).toFixed(2))
    }
    if (prop(TRIB.scale, id === '07', Wd('07', 'pave') - 0.25, E('07') + 0.05, 540, 640, 0.8) > 0) {
      const tilt = 16 * prog(t, Wd('07', 'pave') + 0.1, 0.6, ease.back(1.6))
      TRIB.scale.beam.setAttribute('transform', `rotate(${tilt})`)
      TRIB.scale.panL.setAttribute('transform', `rotate(${-tilt} -280 -40)`)
      TRIB.scale.panR.setAttribute('transform', `rotate(${-tilt} 280 -40)`)
    }
    // Le carton du milieu : la fiche d'Inès, puis elle s'efface pour le bouton.
    const iv = pause ? popS(t, S('08') + 0.1, Wd('08', 'abonnetoi') - 0.35, 0.45) : 0
    show(TRIB.ines, iv > 0.01)
    if (iv > 0.01) {
      place(TRIB.ines, 540, 820 + 6 * Math.sin(t * 2), iv * 1.12, -2)
      TRIB.inesP.update(t, { x: 0, y: -40, scale: 0.55, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
      const sv = t < Wd('08', 'coupable') - 0.05 ? 0 : (() => {
        const u = t - (Wd('08', 'coupable') - 0.05)
        return u < 0.09 ? lerp(2.6, 1, ease.in3(u / 0.09)) : 1 + 0.06 * Math.exp(-(u - 0.09) * 14) * Math.cos((u - 0.09) * 40)
      })()
      TRIB.verdict.setAttribute('display', sv > 0 ? 'inline' : 'none')
      TRIB.verdict.setAttribute('transform', `translate(0 300) rotate(-8) scale(${sv})`)
    }
    if (prop(TRIB.proof, id === '09', S('09') - 0.05, E('09') + 0.05, 540, 690, 0.82) > 0) {
      TRIB.proof.q.setAttribute('opacity', (0.6 + 0.4 * Math.sin(t * 8)).toFixed(2))
      const ok = prog(t, Wd('09', 'prouve', 1) - 0.1, 0.2, ease.back(2.4))
      TRIB.proof.ok.setAttribute('opacity', ok.toFixed(2))
      TRIB.proof.ok.setAttribute('transform', `translate(200 -110) rotate(-8) scale(${lerp(2.2, 1, ok)})`)
    }
    // 10 : les grenades éclatent, puis le choix d'une seconde (la barre se vide).
    TRIB.booms.forEach((b) => {
      const u = (t - (Wd('10', 'bruit') - 0.1) - b.d) / 0.35
      const on = id === '10' && u > 0 && u < 1
      show(b.g, on)
      if (on) place(b.g, b.x, b.y, 0.4 + 0.8 * ease.out3(u), 0)
      if (on) b.g.setAttribute('opacity', (1 - u).toFixed(2))
    })
    if (prop(TRIB.choice, id === '10', Wd('10', 'seconde') - 0.2, E('10') + 0.05, 540, 540, 0.78) > 0) {
      const c = clamp((t - (Wd('10', 'choisir') - 0.1)) / 1.0)
      TRIB.choice.bar.setAttribute('width', (840 * (1 - c)).toFixed(1))
      TRIB.choice.bar.setAttribute('x', (-420 + 420 * c).toFixed(1))
      TRIB.choice.secs.setAttribute('opacity', 0)
    }
    if (prop(TRIB.hosp, id === '12', Wd('12', 'collegue') - 0.2, E('12') + 0.05, 540, 690, 0.82) > 0) TRIB.hosp.ecg.setAttribute('d', ecgLine(t))
    prop(TRIB.victims, id === '13', Wd('13', 'deux') - 0.15, Wd('13', 'metier') - 0.15, 540, 690, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.9 : 0.35) * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  const rw = t - (SEC.pave.t0 - 0.35)
  const rwOn = rw > 0 && rw < 0.7
  show(rewind, rwOn)
  if (rwOn) {
    const r = rng(Math.floor(t * 30))
    rwBands.forEach((b) => {
      b.setAttribute('y', r() * H)
      b.setAttribute('height', 10 + r() * 40)
    })
    rwTxt.setAttribute('opacity', Math.floor(t * 8) % 2 ? 1 : 0.3)
    const jit = 30 * Math.sin(t * 90)
    for (const s of [TIR, PAVE]) s.g.setAttribute('transform', `translate(${jit} 0)`)
  } else for (const s of [TIR, PAVE]) s.g.removeAttribute('transform')
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
    const q = t - (l.start - 0.12)
    if (q > -0.12 && q < 0.12) {
      const dir = l.who === 'procureur' ? -1 : 1
      whip = q < 0 ? dir * -1400 * ease.in3(clamp((q + 0.12) / 0.12)) : dir * 1400 * (1 - ease.out3(clamp(q / 0.12)))
    }
  }
  TRIB.g.setAttribute('transform', `translate(${whip.toFixed(1)} 0)`)
  iris.setAttribute('r', 0)
  streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCAT DE LA DÉFENSE') : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === TIR || cur === PAVE ? 24 : 14)
}

// Petit électrocardiogramme (le collègue à l'hôpital).
function ecgLine(t) {
  let d = ''
  for (let x = -120; x <= 280; x += 6) {
    const p = (((t * 1.1 - x / 300) % 1) + 1) % 1
    let y = 0
    if (p > 0.2 && p < 0.25) y = -60 * Math.sin(((p - 0.2) / 0.05) * Math.PI)
    else if (p > 0.3 && p < 0.34) y = 20 * Math.sin(((p - 0.3) / 0.04) * Math.PI)
    d += `${x === -120 ? 'M' : 'L'} ${x} ${(-110 + y).toFixed(1)} `
  }
  return d
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
