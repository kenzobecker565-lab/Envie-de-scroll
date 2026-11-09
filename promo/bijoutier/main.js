/**
 * ============================================================================
 *  « Affaire Classée ? » — le bijoutier (≈ 79 s, 1080 × 1920)
 * ============================================================================
 *  Style A (faux chirurgien, fausse avocate, pilleuse) : motion design 2D en
 *  SVG, gros sous-titres animés, pas de jauge.
 *
 *  Le hook, pour qu'on se projette :
 *  1. La rue, la nuit : le bijoutier dans l'encadrement de sa porte, fusil
 *     épaulé ; trois éclairs synchronisés avec « trois coups de feu » ; le
 *     garçon qui s'enfuit avec le sac tombe en avant. Pas de sang.
 *  2. Retour en arrière (bandes de bruit, « ◀◀ ») : le braquage. Le complice
 *     fracasse une vitrine, une arme entre dans le champ jusqu'au front du
 *     bijoutier, mains en l'air, en sueur.
 *  3. Le pistolet tombe au ralenti et se brise : c'était un jouet. Le ruban de
 *     police ; puis le bijoutier dans le box : « JUGÉ POUR MEURTRE ».
 *  Le procès est plus animé : contre-champs (chacun tourné vers l'autre),
 *  geste et coup de zoom sur chaque fin de phrase, panoramiques filés entre
 *  les répliques, public qui bouge, un schéma animé par argument.
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
const AVO = { robe: '#23262f', jabot: true, hair: 'bun', hairColor: '#5a3218', female: true, skin: '#f0c19c', iris: '#3b5a2a' }
const BIJ = { robe: '#3d4a5c', jabot: false, collar: '#f2efe8', hair: 'short', hairColor: '#a7adb5', skin: '#ecc3a0', iris: '#3b2a1a' }
const BIJ_BOX = { robe: '#59626f', jabot: false, collar: '#e5e7eb', hair: 'short', hairColor: '#a7adb5', skin: '#ecc3a0', iris: '#3b2a1a' }
grad('streetNight', [[0, '#0b1020'], [1, '#1d2338']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('shopWarm', [[0, '#ffe2a8', 0.95], [1, '#ffb75a', 0.6]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('shopIn', [[0, '#3a2a1c'], [1, '#160f0a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('glass', [[0, '#cfe8ff', 0.35], [1, '#cfe8ff', 0.12]], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('flashGlow', [[0, '#fff6c8', 1], [0.3, '#ffcf5a', 0.7], [1, '#ff8a1f', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })

// Le bijoutier en silhouette, fusil épaulé (vu de profil, vers la droite).
function shooter(parent) {
  const g = svg('g', {}, parent)
  const c = '#0d0f17'
  svg('rect', { x: -40, y: -250, width: 80, height: 160, rx: 30, fill: c }, g)
  svg('circle', { cx: 10, cy: -282, r: 34, fill: c }, g)
  svg('path', { d: 'M -10 -90 L -30 0 M 20 -90 L 40 0', stroke: c, 'stroke-width': 30, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M 10 -220 L 80 -200 L 120 -210', fill: 'none', stroke: c, 'stroke-width': 24, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: 40, y: -222, width: 190, height: 18, rx: 6, fill: '#1a1d29' }, g)
  svg('path', { d: 'M 40 -213 L 0 -190 L -6 -170 L 30 -190 Z', fill: '#3a2414' }, g)
  svg('path', { d: 'M 30 -300 A 34 34 0 0 1 44 -262', fill: 'none', stroke: '#ffcf7a', 'stroke-width': 7 }, g)
  const flash = svg('g', { transform: 'translate(236 -213)' }, g)
  svg('circle', { r: 120, fill: 'url(#flashGlow)' }, flash)
  svg('path', { d: 'M 0 -40 L 20 -8 L 90 0 L 20 8 L 0 40 L -6 6 L -40 0 L -6 -6 Z', fill: '#fff9d8' }, flash)
  return { g, flash }
}
// Un pistolet (noir, ou jouet en plastique avec l'embout orange).
function pistol(parent, toy = false) {
  const g = svg('g', {}, parent)
  const body = toy ? '#2a2d36' : '#14161d'
  svg('path', { d: 'M -150 -40 L 70 -40 L 70 0 L -60 0 L -80 90 L -140 90 L -120 0 L -150 0 Z', fill: body, stroke: '#4a4f5c', 'stroke-width': 5, 'stroke-linejoin': 'round' }, g)
  svg('rect', { x: -140, y: -52, width: 200, height: 14, rx: 6, fill: '#3a3f4c' }, g)
  svg('path', { d: 'M -70 0 Q -50 40 -30 0', fill: 'none', stroke: '#4a4f5c', 'stroke-width': 6 }, g)
  if (toy) svg('rect', { x: 60, y: -42, width: 26, height: 44, rx: 6, fill: '#ff7a1a' }, g)
  return g
}

// 1 · Les trois coups de feu, la nuit, devant la bijouterie.
const COUPS = scene('coups', (L) => {
  bg(L, 'url(#streetNight)')
  const r = rng(21)
  for (let i = 0; i < 40; i++) svg('circle', { cx: r() * W, cy: r() * 700, r: 1.5 + r() * 2.5, fill: '#fff', opacity: 0.3 + r() * 0.5 }, L.far)
  for (let i = 0; i < 6; i++) svg('rect', { x: -100 + i * 230, y: 300 - (i % 2) * 120, width: 210, height: 900, fill: '#121729' }, L.far)
  // La bijouterie (à gauche) : vitrine éclairée, enseigne dorée, porte ouverte.
  const shop = svg('g', { transform: 'translate(-200 0)' }, L.mid)
  svg('rect', { x: -120, y: 700, width: 640, height: 820, fill: '#1c1a24' }, shop)
  svg('rect', { x: -120, y: 700, width: 640, height: 120, fill: '#120f18' }, shop)
  txt(shop, 'BIJOUTERIE', { x: 200, y: 780, 'font-size': 70, fill: '#f2c45a', 'font-family': 'Fraunces Variable, serif' })
  svg('rect', { x: -80, y: 880, width: 300, height: 380, fill: 'url(#shopWarm)' }, shop)
  for (let i = 0; i < 14; i++) svg('circle', { cx: -50 + r() * 240, cy: 1150 + r() * 80, r: 6 + r() * 6, fill: '#ffe48a', stroke: '#b8892a', 'stroke-width': 3 }, shop)
  svg('rect', { x: 260, y: 860, width: 220, height: 660, fill: 'url(#shopWarm)' }, shop)
  // Le trottoir mouillé, avec le reflet de la vitrine.
  svg('rect', { x: -400, y: 1520, width: W + 800, height: 1400, fill: '#10131f' }, L.mid)
  svg('rect', { x: 40, y: 1525, width: 260, height: 300, fill: '#ffcf7a', opacity: 0.12 }, L.mid)
  // Un lampadaire.
  svg('rect', { x: 960, y: 700, width: 14, height: 830, fill: '#2a3150' }, L.mid)
  svg('path', { d: 'M 967 720 L 760 1530 L 1180 1530 Z', fill: '#ffe7a8', opacity: 0.12 }, L.mid)
  svg('rect', { x: 930, y: 690, width: 74, height: 24, rx: 10, fill: '#ffe7a8' }, L.mid)
  for (let i = 0; i < 8; i++) svg('rect', { x: -200 + i * 180, y: 1640, width: 90, height: 8, rx: 4, fill: '#2a3150' }, L.mid)
  // Le tireur dans l'encadrement de la porte.
  const gun = shooter(L.actor)
  // Le garçon qui s'enfuit (avec le sac de bijoux).
  const boyWrap = svg('g', {}, L.actor)
  const boy = walker(boyWrap, { carry: 'bags', dir: 1, hood: true, rim: '#ffcf7a', color: '#1d2130' })
  // Les impacts lumineux des tirs (traits de balles).
  const tracers = [0, 1, 2].map(() => svg('path', { stroke: '#fff2b0', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0 }, L.fx))
  // Les bijoux qui s'échappent du sac quand il tombe.
  const jewels = Array.from({ length: 16 }, (_, k) => ({ el: svg('circle', { r: 8 + (k % 3) * 4, fill: k % 2 ? '#ffe48a' : '#e6f4ff', stroke: '#b8892a', 'stroke-width': 3 }, L.actor), vx: 80 + r() * 380, vy: -200 - r() * 300 }))
  return { gun, boyWrap, boy, tracers, jewels }
})

// 2 · Deux minutes plus tôt : le braquage.
const BRAQUAGE = scene('braquage', (L) => {
  bg(L, 'url(#shopIn)')
  const r = rng(5)
  // Mur du fond : vitrines murales qui scintillent.
  for (let k = 0; k < 3; k++) {
    const x = 60 + k * 340
    svg('rect', { x, y: 300, width: 300, height: 420, rx: 12, fill: '#2a1d14', stroke: '#b8892a', 'stroke-width': 6 }, L.far)
    for (let j = 0; j < 3; j++) svg('rect', { x: x + 20, y: 340 + j * 130, width: 260, height: 8, fill: '#b8892a' }, L.far)
  }
  const sparkles = Array.from({ length: 30 }, () => ({ el: svg('path', { d: 'M 0 -12 L 3 -3 L 12 0 L 3 3 L 0 12 L -3 3 L -12 0 L -3 -3 Z', fill: '#fff6c8' }, L.far), x: 80 + r() * 920, y: 320 + r() * 380, ph: r() * 6 }))
  // Le comptoir vitré au premier plan.
  const counter = svg('g', {}, L.front)
  svg('rect', { x: -200, y: 1400, width: W + 400, height: 700, fill: '#2a1d14' }, counter)
  svg('rect', { x: -200, y: 1290, width: W + 400, height: 120, fill: 'url(#glass)', stroke: '#cfe8ff', 'stroke-width': 4 }, counter)
  for (let i = 0; i < 12; i++) svg('circle', { cx: 40 + i * 90, cy: 1360, r: 16, fill: 'none', stroke: '#ffd166', 'stroke-width': 7 }, counter)
  // Le bijoutier, mains en l'air.
  const bij = makePerson(L.actor, BIJ)
  // Le second braqueur qui fracasse une vitrine (au fond, à droite).
  const smash = svg('g', { transform: 'translate(860 900)' }, L.mid)
  svg('rect', { x: -40, y: -230, width: 80, height: 150, rx: 30, fill: '#0f1119' }, smash)
  svg('circle', { cx: 0, cy: -262, r: 34, fill: '#0f1119' }, smash)
  svg('path', { d: 'M -34 -270 C -40 -320 40 -320 40 -270', fill: '#0f1119' }, smash)
  const swing = svg('g', { transform: 'translate(-20 -200)' }, smash)
  svg('path', { d: 'M 0 0 L -80 -60', stroke: '#0f1119', 'stroke-width': 24, 'stroke-linecap': 'round' }, swing)
  svg('rect', { x: -120, y: -100, width: 24, height: 90, rx: 6, fill: '#3a3f4c', transform: 'rotate(-40 -108 -55)' }, swing)
  const shards = Array.from({ length: 18 }, () => ({ el: svg('path', { d: `M 0 0 l ${8 + r() * 14} ${-6} l ${4} ${14} Z`, fill: '#cfe8ff' }, L.mid), vx: (r() - 0.7) * 500, vy: -200 - r() * 400, r: r() * 6 }))
  // La main du braqueur et l'arme, qui entrent par la droite.
  const armG = svg('g', {}, L.fx)
  svg('path', { d: 'M 0 0 L 520 40', stroke: '#14161d', 'stroke-width': 90, 'stroke-linecap': 'round' }, armG)
  svg('circle', { cx: -10, cy: 0, r: 54, fill: '#c98d68' }, armG)
  const gunG = pistol(armG)
  gunG.setAttribute('transform', 'translate(-150 -20) scale(-1 1)')
  // Gouttes de sueur.
  const sweat = [0, 1].map((k) => svg('path', { d: 'M 0 0 C 8 12 10 22 0 26 C -10 22 -8 12 0 0 Z', fill: '#9fd8ff', opacity: 0 }, L.fx))
  return { sparkles, bij, smash, swing, shards, armG, sweat }
})

// 3 · L'arme était un jouet ; le garçon est mort ; le bijoutier est jugé.
const JOUET = scene('jouet', (L) => {
  bg(L, '#0a0c12')
  const spot = svg('circle', { cx: 540, cy: 900, r: 700, fill: '#222838', opacity: 0.8 }, L.far)
  svg('rect', { x: -400, y: 1250, width: W + 800, height: 1000, fill: '#151924' }, L.far)
  const toy = svg('g', {}, L.mid)
  const whole = pistol(toy, true)
  // Les morceaux de plastique (le jouet se casse en touchant le sol).
  const r = rng(13)
  const bits = Array.from({ length: 16 }, (_, k) => ({ el: svg('rect', { x: -25, y: -18, width: 36 + r() * 54, height: 25 + r() * 43, rx: 6, fill: k < 3 ? '#ff7a1a' : '#2a2d36', stroke: '#4a4f5c', 'stroke-width': 4 }, toy), vx: (r() - 0.5) * 900, vy: -300 - r() * 500, vr: (r() - 0.5) * 900 }))
  // Le ruban de police.
  const tape = svg('g', {}, L.fx)
  for (const [y, rot] of [[700, -12], [1050, 9]]) {
    const b = svg('g', { transform: `translate(540 ${y}) rotate(${rot})` }, tape)
    svg('rect', { x: -900, y: -45, width: 1800, height: 90, fill: '#ffd400' }, b)
    for (let k = -4; k <= 4; k++) txt(b, 'POLICE · NE PAS FRANCHIR', { x: k * 420, y: 14, 'font-size': 38, fill: '#111' })
  }
  const gyR = svg('ellipse', { cx: 0, cy: 900, rx: 900, ry: 900, fill: 'url(#glowRed)', opacity: 0 }, L.fx)
  const gyB = svg('ellipse', { cx: W, cy: 900, rx: 900, ry: 900, fill: 'url(#glowBlue)', opacity: 0 }, L.fx)
  // Le box.
  const box = svg('g', {}, L.actor)
  const bij = makePerson(box, BIJ_BOX)
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)' }, bars)
  svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, bars)
  const ledge = svg('rect', { x: -100, y: 1680, width: W + 200, height: 400, fill: '#1a2147' }, L.front)
  return { spot, toy, whole, bits, tape, gyR, gyB, box, bij, bars, ledge }
})

// 4 · Le procès, plus vivant : contre-champs, gestes, panoramiques filés, public.
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
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  // Le public, en silhouettes, qui bouge (au fond).
  const crowd = Array.from({ length: 9 }, (_, i) => {
    const g = svg('g', {}, L.mid)
    svg('circle', { cx: 0, cy: -60, r: 46, fill: '#0c0f1c', opacity: 0.85 }, g)
    svg('rect', { x: -70, y: -20, width: 140, height: 200, rx: 60, fill: '#0c0f1c', opacity: 0.85 }, g)
    return { g, x: -40 + i * 140, ph: r() * 6 }
  })
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 500, fill: 'url(#desk)' }, L.front)
  svg('rect', { x: -300, y: 1780, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, L.front)
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // Panneau « schéma » réutilisable (fond sombre, bordure jaune).
  const panel = (g, w = 820, h = 360) => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 8 }, g)
  // 04 : il s'enfuit, le danger s'éloigne.
  let fleeRunner
  const flee = prop((g) => {
    panel(g)
    svg('rect', { x: -380, y: -120, width: 160, height: 220, fill: '#3a2a1c', stroke: '#f2c45a', 'stroke-width': 5 }, g)
    txt(g, 'BOUTIQUE', { x: -300, y: 130, 'font-size': 26, fill: '#f2c45a' })
    svg('path', { d: 'M -180 120 L 360 120', stroke: '#3a4060', 'stroke-width': 6 }, g)
    fleeRunner = walker(g, { carry: 'bags', dir: 1, hood: true, rim: '#ffd166' })
  })
  // 05 : la coupure de journal de l'an dernier.
  const news = prop((g) => {
    svg('rect', { x: -330, y: -230, width: 660, height: 460, fill: '#f4efe2', stroke: '#10121a', 'stroke-width': 6 }, g)
    txt(g, 'FAITS DIVERS', { x: 0, y: -170, 'font-size': 44, fill: '#10121a', 'font-family': 'Fraunces Variable, serif' })
    svg('rect', { x: -300, y: -150, width: 600, height: 6, fill: '#10121a' }, g)
    txt(g, 'UN BIJOUTIER', { x: 0, y: -80, 'font-size': 52, fill: '#b3232b' })
    txt(g, 'FRAPPÉ À COUPS DE CROSSE', { x: 0, y: -24, 'font-size': 38, fill: '#10121a' })
    svg('rect', { x: -280, y: 10, width: 240, height: 180, fill: '#9aa3b5' }, g)
    for (let k = 0; k < 6; k++) svg('rect', { x: -10, y: 20 + k * 28, width: 290 - (k % 2) * 60, height: 10, rx: 5, fill: '#c9c2b0' }, g)
  })
  // 06 : le comptoir vu en coupe, le fusil caché dessous.
  const counterX = prop((g) => {
    svg('rect', { x: -380, y: -60, width: 760, height: 220, fill: '#5a3a24', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -400, y: -100, width: 800, height: 46, rx: 8, fill: 'url(#glass)', stroke: '#cfe8ff', 'stroke-width': 4 }, g)
    const xr = svg('g', {}, g)
    svg('rect', { x: -340, y: 30, width: 680, height: 90, rx: 10, fill: '#0c1830', stroke: '#7fd1ff', 'stroke-width': 4 }, xr)
    svg('rect', { x: -280, y: 64, width: 420, height: 16, rx: 6, fill: '#9fe0ff' }, xr)
    svg('path', { d: 'M 140 60 L 260 60 L 300 100 L 140 90 Z', fill: '#9fe0ff' }, xr)
    g.xr = xr
  })
  // 07 : le journal d'appels à la police.
  const calls = prop((g) => {
    svg('rect', { x: -170, y: -300, width: 340, height: 600, rx: 44, fill: '#10121a' }, g)
    svg('rect', { x: -150, y: -270, width: 300, height: 540, rx: 26, fill: '#f4f6fb' }, g)
    g.rows = Array.from({ length: 7 }, (_, k) => {
      const row = svg('g', { transform: `translate(0 ${-220 + k * 72})` }, g)
      svg('circle', { cx: -110, cy: 0, r: 18, fill: '#e5484d' }, row)
      txt(row, 'POLICE · 17', { x: -80, y: 10, 'font-size': 26, fill: '#10121a', 'text-anchor': 'start' })
      txt(row, 'sans suite', { x: 130, y: 10, 'font-size': 20, fill: '#9aa3b5', 'text-anchor': 'end', 'font-weight': 700 })
      return row
    })
  })
  // 08 : la distance, 12 mètres, de dos.
  let distArrow, distTxt, distRunner
  const dist = prop((g) => {
    panel(g)
    svg('rect', { x: -380, y: -120, width: 70, height: 220, fill: '#f2c45a' }, g)
    distArrow = svg('path', { d: '', stroke: '#ffd166', 'stroke-width': 8, 'marker-end': '' }, g)
    distTxt = txt(g, '0 M', { x: 0, y: -90, 'font-size': 64, fill: '#ffd166' })
    distRunner = walker(g, { carry: 'bags', dir: 1, hood: true, rim: '#ffd166' })
  })
  // 09 : les trois tirs, trois vignettes (de dos, de dos, retourné).
  let shotsV = []
  const shots = prop((g) => {
    shotsV = [0, 1, 2].map((k) => {
      const v = svg('g', { transform: `translate(${-300 + k * 300} 0)` }, g)
      svg('rect', { x: -130, y: -190, width: 260, height: 380, rx: 18, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 6 }, v)
      txt(v, `TIR ${k + 1}`, { x: 0, y: -140, 'font-size': 34, fill: '#ffd166' })
      const fig = svg('g', { transform: 'translate(0 160)' }, v)
      svg('rect', { x: -38, y: -230, width: 76, height: 140, rx: 30, fill: '#3a4060' }, fig)
      svg('circle', { cx: 0, cy: -262, r: 32, fill: '#3a4060' }, fig)
      svg('path', { d: 'M -14 -90 L -30 0 M 14 -90 L 30 0', stroke: '#3a4060', 'stroke-width': 26, 'stroke-linecap': 'round' }, fig)
      if (k === 2) {
        // Retourné : le bras se lève, avec l'arme (le jouet).
        svg('path', { d: 'M 20 -200 L 90 -230', stroke: '#3a4060', 'stroke-width': 22, 'stroke-linecap': 'round' }, fig)
        svg('rect', { x: 84, y: -248, width: 60, height: 22, rx: 5, fill: '#2a2d36' }, fig)
        svg('circle', { cx: -12, cy: -268, r: 5, fill: '#ffd166' }, fig)
        svg('circle', { cx: 12, cy: -268, r: 5, fill: '#ffd166' }, fig)
      }
      return v
    })
    g.ring = svg('circle', { cx: 300, cy: 0, r: 200, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 1300, 'stroke-dashoffset': 1300 }, g)
  })
  // 11 : l'arme sur le front.
  const forehead = prop((g) => {
    panel(g, 700, 380)
    svg('circle', { cx: -170, cy: -10, r: 110, fill: '#ecc3a0', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('path', { d: 'M -270 -60 C -260 -150 -80 -150 -70 -60 Z', fill: '#a7adb5' }, g)
    for (const sx of [-1, 1]) svg('ellipse', { cx: -170 + sx * 36, cy: -10, rx: 14, ry: 20, fill: '#fff', stroke: '#10121a', 'stroke-width': 4 }, g)
    const gp = pistol(g)
    gp.setAttribute('transform', 'translate(150 -60) scale(-0.9 0.9)')
  })
  return { procBg, avoBg, hotBg, hotFill, crowd, proc, avo, flee, get fleeRunner() { return fleeRunner }, news, counterX, calls, dist, get distArrow() { return distArrow }, get distTxt() { return distTxt }, get distRunner() { return distRunner }, shots, get shotsV() { return shotsV }, forehead }
})

// 5 · Le vote : le bijoutier, seul, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, BIJ_BOX)
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
// Cadre « vidéo de téléphone ».
const rec = svg('g', { display: 'none' }, root)
svg('rect', { x: 40, y: 140, width: W - 80, height: H - 280, fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.5, rx: 20 }, rec)
const recDot = svg('circle', { cx: 100, cy: 210, r: 16, fill: '#ff3b30' }, rec)
txt(rec, 'REC', { x: 160, y: 222, 'font-size': 36, fill: '#ffffff', 'text-anchor': 'start' })
const recTime = svg('text', { x: W - 90, y: 222, 'text-anchor': 'end', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 34, fill: '#ffffff' }, rec)
const freeze = svg('g', { display: 'none' }, root)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0.35 }, freeze)

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
    const k = lerp(T.from, 1, ease.out3(a)) * Math.min(1, s)
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

// Le hook.
const SHOTS = [0.08, 0.36, 0.64]
tag('19 ANS', 'pill yellow', { t0: Wd('01', '19') - 0.1, t1: SEC.coups.t1, y: 260, x: 760, rot: 3 })
tag('DANS LE DOS', 'pill red', { t0: Wd('01', 'dos') - 0.1, t1: SEC.coups.t1, y: 260, x: 330, rot: -3 })
tag('◀◀ 2 MINUTES PLUS TÔT', 'pill', { t0: S('02') - 0.05, t1: SEC.braquage.t1, y: 240 })
fs(tag('BRAQUAGE', 'stamp', { t0: Wd('02', 'braquait') - 0.05, t1: Wd('02', 'une', 1) - 0.1, y: 440, rot: -8, from: 2.8, dur: 0.2 }), 120)
tag('UNE ARME SUR LE FRONT', 'pill red', { t0: Wd('02', 'front') - 0.1, t1: SEC.braquage.t1, y: 420, rot: -2 })
const toyStamp = fs(tag('JOUET', 'stamp', { t0: Wd('03', 'jouet') - 0.05, t1: Wd('03', 'le') - 0.1, y: 520, rot: -10, from: 3, dur: 0.2 }), 190)
toyStamp.el.style.color = '#ff7a1a'
toyStamp.el.style.borderColor = '#ff7a1a'
tag('LE GARÇON EST MORT', 'pill', { t0: Wd('03', 'mort') - 0.15, t1: Wd('03', 'aujourdhui') - 0.1, y: 880 })
const jm = fs(tag('JUGÉ POUR<br>MEURTRE', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.jouet.t1, y: 420, rot: -6, from: 2.8, dur: 0.2 }), 110)
jm.el.style.cssText += 'text-align:center;line-height:1.02'
// Le procès.
tag('IL S’ENFUYAIT', 'pill', { t0: Wd('04', 'senfuyait') - 0.1, t1: E('04') + 0.1, y: 230, rot: -2 })
fs(tag('IL A TIRÉ QUAND MÊME.', 'slam white', { t0: Wd('04', 'tire') - 0.06, t1: E('04') + 0.1, y: 260, rot: -2, from: 2.4, dur: 0.2 }), 90)
tag('IL Y A 1 AN', 'pill yellow', { t0: Wd('05', 'an') - 0.1, t1: E('05') + 0.1, y: 230, rot: -3 })
fs(tag('LE DANGER N’EST JAMAIS PARTI.', 'slam white', { t0: Wd('05', 'jamais') - 0.06, t1: E('05') + 0.1, y: 300, rot: -2, from: 2.2, dur: 0.2 }), 70)
fs(tag('SANS PERMIS', 'stamp', { t0: Wd('06', 'permis') - 0.05, t1: E('06') + 0.1, y: 480, rot: -8, from: 2.8, dur: 0.2 }), 100)
fs(tag('PRÉPARATION.', 'slam yellow', { t0: Wd('06', 'preparation') - 0.06, t1: E('06') + 0.1, y: 260, rot: -3, from: 2.6, dur: 0.2 }), 120)
counterTag(Wd('07', '14') - 0.1, E('07') + 0.1, 14, 'APPELS À LA POLICE', { y: 230, dur: 0.6 })
tag('« INSTALLEZ UNE ALARME »', 'pill red', { t0: Wd('07', 'dinstaller') - 0.1, t1: E('07') + 0.1, y: 1000, rot: 2 })
counterTag(Wd('08', '12') - 0.1, Wd('08', 'ce') - 0.1, 12, 'MÈTRES · DE DOS', { y: 230, dur: 0.5 })
fs(tag('EXÉCUTION.', 'slam white', { t0: Wd('08', 'execution') - 0.06, t1: E('08') + 0.1, y: 260, rot: -3, from: 2.8, dur: 0.2 }), 140)
tag('AU 3ᵉ, IL SE RETOURNE', 'pill yellow', { t0: Wd('09', 'troisieme') - 0.1, t1: E('09') + 0.1, y: 230, rot: -2 })
tag('IL NE POUVAIT PAS LE SAVOIR', 'pill red', { t0: Wd('09', 'savoir') - 0.25, t1: E('09') + 0.1, y: 960, rot: 2 }).el.style.fontSize = '44px'
fs(tag('2 BALLES DANS LE DOS.', 'slam white', { t0: Wd('10', 'balles') - 0.06, t1: E('10') + 0.1, y: 300, rot: -2, from: 2.4, dur: 0.2 }), 90)
tag('N’IMPORTE QUI SE SERAIT RETOURNÉ', 'pill', { t0: Wd('10', 'nimporte') - 0.1, t1: E('10') + 0.1, y: 470 }).el.style.fontSize = '40px'
tag('2 MINUTES PLUS TÔT', 'pill yellow', { t0: Wd('11', 'deux') - 0.1, t1: E('11') + 0.1, y: 230, rot: -2 })
tag('CASIER VIERGE', 'pill', { t0: Wd('12', 'condamne') - 0.1, t1: Wd('12', 'il') - 0.1, y: 240, x: 300, rot: -3 })
tag('1ᵉʳ VOL', 'pill yellow', { t0: Wd('12', 'premier') - 0.1, t1: Wd('12', 'il') - 0.1, y: 240, x: 780, rot: 3 })
const proces = fs(tag('UN PROCÈS…<br>PAS 3 BALLES.', 'slam white', { t0: Wd('12', 'proces') - 0.06, t1: E('12') + 0.15, y: 380, rot: -2, from: 2.4, dur: 0.2 }), 110)
proces.el.style.cssText += 'text-align:center;line-height:1.05'
fs(tag('IL A CHOISI.', 'slam yellow', { t0: Wd('13', 'choisi') - 0.06, t1: E('13') + 0.15, y: 300, rot: -3, from: 2.8, dur: 0.2 }), 140)
tag('LA VIE D’UN AUTRE', 'pill', { t0: Wd('13', 'vie') - 0.1, t1: E('13') + 0.15, y: 480, rot: 2 })
// Le vote, puis l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, y: 300, from: 1.4, dur: 0.5 }), 110)
fs(tag('LÉGITIME DÉFENSE ?', 'vote blue', { t0: Wd('14', 'legitime') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 520, rot: -3 }), 74)
fs(tag('MEURTRE ?', 'vote red', { t0: Wd('14', 'meurtre') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 700, rot: 3 }), 74)
tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, y: 730, rot: 3 })
tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('15', 'abonne') - 0.1, y: 1180 })
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('15', 'verdict') - 0.1, y: 1330 }), 44)

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés (pas sur l'appel à s'abonner : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => l.id !== '15-abonne')) {
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

const T_FALL = SHOTS[2] + 0.05
const T_GUN = Wd('02', 'arme') - 0.2
const T_TOY = Wd('03', 'jouet') - 0.05
const T_BOX = Wd('03', 'aujourdhui') - 0.15
const IMPACTS = [
  ...SHOTS.map((x) => [x, 22]),
  [Wd('02', 'braquait') - 0.05, 10],
  [Wd('02', 'front') - 0.1, 10],
  [T_TOY, 16],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'tire') - 0.06, 10],
  [Wd('06', 'permis') - 0.05, 10],
  [Wd('08', 'execution') - 0.06, 14],
  [Wd('09', 'troisieme') - 0.1, 8],
  [Wd('10', 'balles') - 0.06, 12],
  [Wd('12', 'proces') - 0.06, 12],
  [Wd('13', 'choisi') - 0.06, 14],
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
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02, hand = 2, rot = 0, from = s.t0 } = {}) {
  const [sx, sy] = shakeAt(t, hand)
  const z = zoom * (1 + push * Math.max(0, t - from))
  const par = (k) => `translate(${540 + sx * k} ${960 + sy * k}) rotate(${rot * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.12) ?? TLINES[0]
const HOT = { 12: '#1d2a5c', 13: '#b3232b' }
// Les fins de phrases : on y place un geste (doigt pointé) et un petit coup de zoom.
const BEATS = C.lines.filter((l) => l.who !== 'narrateur').flatMap((l) => l.words.filter((w) => /[.?!…]$/.test(w.w)).map((w) => ({ t: w.t, who: l.who })))

// Effet « retour en arrière » : bandes de bruit et décalage horizontal.
const rewind = svg('g', { display: 'none' }, root)
const rwBands = Array.from({ length: 7 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0.25 }, rewind))
const rwTxt = txt(rewind, '◀◀', { x: 900, y: 240, 'font-size': 90, fill: '#ffffff' })

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)
  rec.setAttribute('display', 'none')
  freeze.setAttribute('display', 'none')

  if (cur === COUPS) {
    // Plan large de la rue ; il court, trois tirs, il tombe ; puis la caméra s'approche lentement.
    const run = clamp(t / T_FALL)
    const bx = lerp(330, 560, run)
    const slow = prog(t, T_FALL + 0.4, 2.4, ease.io2)
    cam(COUPS, t, { zoom: lerp(1.38, 1.62, slow), cx: lerp(420, 600, slow), cy: lerp(1330, 1450, slow), push: 0, hand: 4 })
    place(COUPS.gun.g, 170, 1520, 1.25)
    const fl = SHOTS.map((s, k) => (t >= s ? clamp(1 - (t - s) / 0.09) : 0))
    const f = Math.max(...fl)
    COUPS.gun.flash.setAttribute('opacity', f.toFixed(2))
    COUPS.gun.flash.setAttribute('transform', `translate(236 -213) scale(${0.6 + f})`)
    const fall = prog(t, T_FALL, 0.45, ease.in2)
    COUPS.boy.update(0, 0, 1.2, t * 15, { stride: 1 - fall })
    COUPS.boyWrap.setAttribute('transform', `translate(${bx + fall * 40} ${1600}) rotate(${fall * 80})`)
    COUPS.tracers.forEach((tr, k) => {
      const u = (t - SHOTS[k]) / 0.12
      const on = u > 0 && u < 1
      tr.setAttribute('opacity', on ? (1 - u).toFixed(2) : 0)
      if (on) tr.setAttribute('d', `M 470 1250 L ${lerp(500, bx - 10, u)} ${1290 + u * 20}`)
    })
    COUPS.jewels.forEach((j) => {
      const u = t - T_FALL - 0.2
      show(j.el, u > 0)
      if (u > 0) {
        const k = Math.min(u, 0.7)
        j.el.setAttribute('cx', 640 + j.vx * k)
        j.el.setAttribute('cy', Math.min(1600, 1450 + j.vy * k + 900 * k * k))
      }
    })
  }
  if (cur === BRAQUAGE) {
    // Plan sur le bijoutier ; l'arme entre ; coup de zoom sur le front.
    const z = prog(t, Wd('02', 'front') - 0.15, 0.35, ease.out3)
    cam(BRAQUAGE, t, { zoom: lerp(1.0, 1.35, z), cx: lerp(540, 470, z), cy: lerp(980, 860, z), push: 0.02, hand: 3 })
    for (const sp of BRAQUAGE.sparkles) {
      const a = Math.max(0, Math.sin(t * 5 + sp.ph))
      sp.el.setAttribute('transform', `translate(${sp.x} ${sp.y}) scale(${(0.3 + a).toFixed(2)})`)
      sp.el.setAttribute('opacity', a.toFixed(2))
    }
    BRAQUAGE.bij.update(t, { x: 440, y: 1240, scale: 1.3, brows: 'surprised', mouth: 0.25 + 0.1 * Math.sin(t * 12), look: [0.5, -0.1], armR: [2.6, 0.5 + 0.05 * Math.sin(t * 20)], armL: [2.6, 0.5 + 0.05 * Math.sin(t * 22)], seed: 0.4, headTilt: -0.05 })
    // Le second braqueur frappe la vitrine.
    const hit = Wd('02', 'bijouterie') - 0.2
    const sw = Math.sin(clamp((t - (hit - 0.3)) / 0.3) * Math.PI * 0.5)
    BRAQUAGE.swing.setAttribute('transform', `translate(-20 -200) rotate(${-60 + 110 * sw})`)
    BRAQUAGE.shards.forEach((s, k) => {
      const u = t - hit
      show(s.el, u > 0 && u < 1.4)
      if (u > 0) s.el.setAttribute('transform', `translate(${780 + s.vx * u} ${760 + s.vy * u + 900 * u * u}) rotate(${s.r * 60 * u})`)
    })
    // L'arme entre par la droite jusqu'au front.
    const a = prog(t, T_GUN, 0.45, ease.out3)
    BRAQUAGE.armG.setAttribute('transform', `translate(${lerp(1500, 690, a) + 6 * Math.sin(t * 18) * a} ${lerp(900, 820, a)}) rotate(${lerp(-8, -4, a)})`)
    BRAQUAGE.sweat.forEach((d, k) => {
      const u = ((t - T_GUN - k * 0.5) % 1.2) / 1.2
      d.setAttribute('opacity', t > T_GUN ? (Math.sin(Math.PI * u) * 0.9).toFixed(2) : 0)
      d.setAttribute('transform', `translate(${380 + k * 120} ${880 + u * 90})`)
    })
  }
  if (cur === JOUET) {
    // a) le pistolet tombe au ralenti et se brise ; b) le ruban de police ; c) le box.
    const inBox = t >= T_BOX
    show(JOUET.toy, !inBox)
    show(JOUET.box, inBox)
    show(JOUET.bars, inBox)
    show(JOUET.ledge, inBox)
    const tapeOn = t >= Wd('03', 'mort') - 0.25 && !inBox
    show(JOUET.tape, tapeOn)
    cam(JOUET, t, { zoom: inBox ? 1.05 : 1.15, cy: inBox ? 980 : 1000, push: 0.03, hand: 3 })
    if (!inBox) {
      const fallU = clamp((t - JOUET.t0) / (T_TOY - JOUET.t0))
      const broken = t >= T_TOY
      show(JOUET.whole, !broken)
      if (!broken) JOUET.whole.setAttribute('transform', `translate(540 ${lerp(300, 1240, ease.in2(fallU))}) rotate(${fallU * 280}) scale(1.6)`)
      JOUET.bits.forEach((b) => {
        const u = t - T_TOY
        show(b.el, broken)
        if (broken) b.el.setAttribute('transform', `translate(${540 + b.vx * u * 0.5} ${Math.min(1250, 1240 + b.vy * u + 1400 * u * u)}) rotate(${b.vr * u})`)
      })
      const ph = (t * 2.6) % 1
      JOUET.gyR.setAttribute('opacity', tapeOn ? (ph < 0.5 ? 0.5 : 0.1) : 0)
      JOUET.gyB.setAttribute('opacity', tapeOn ? (ph < 0.5 ? 0.1 : 0.5) : 0)
      if (tapeOn) {
        const s = ease.out3(prog(t, Wd('03', 'mort') - 0.25, 0.35))
        JOUET.tape.children[0].setAttribute('transform', `translate(${lerp(-1200, 540, s)} 700) rotate(-12)`)
        JOUET.tape.children[1].setAttribute('transform', `translate(${lerp(2200, 540, s)} 1050) rotate(9)`)
      }
    } else {
      JOUET.gyR.setAttribute('opacity', 0)
      JOUET.gyB.setAttribute('opacity', 0)
      const hit = prog(t, Wd('03', 'juge') - 0.05, 0.4, ease.out3)
      JOUET.bij.update(t, { x: 540, y: 1220, scale: 1.4, brows: 'sad', look: [-0.2, 0.2 + 0.3 * hit], headNod: 0.15 * hit, armR: [0.1, 0.7], armL: [0.1, 0.7], seed: 1.4 })
      const fall = prog(t, T_BOX + 0.15, 0.35, ease.back(1.4))
      JOUET.bars.setAttribute('transform', `translate(0 ${lerp(-2300, 0, fall)})`)
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const isProc = l.who === 'procureur'
    const hot = HOT[id]
    show(TRIB.procBg, isProc && !hot)
    show(TRIB.avoBg, !isProc && !hot)
    show(TRIB.hotBg, !!hot)
    if (hot) TRIB.hotFill.setAttribute('fill', hot)
    show(TRIB.proc.root, isProc)
    show(TRIB.avo.root, !isProc)
    // Contre-champ : le procureur un peu à gauche, l'avocate un peu à droite, chacun tourné vers l'autre.
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch) + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 900, Math.min(1, punch)), push: 0.02, from: l.start - 0.12, rot: side * 0.6 })
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
      brows: isProc ? (['08', '10', '12'].includes(id) ? 'angry' : 'determined') : ['13', '09'].includes(id) ? 'determined' : 'neutral',
      look: [side * -0.4, 0],
      // Sur chaque fin de phrase : bras qui se lève, index pointé.
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
    if (prop(TRIB.flee, id === '04', Wd('04', 'voleur') - 0.15, E('04') + 0.05, 540, 640, 0.85) > 0) {
      const u = clamp((t - Wd('04', 'voleur')) / 2.4)
      TRIB.fleeRunner.update(lerp(-120, 330, u), 120, 0.7, t * 14)
    }
    prop(TRIB.news, id === '05', Wd('05', 'an') - 0.2, E('05') + 0.05, 540, 640, 0.85, -4 + 2 * Math.sin(t * 2))
    if (prop(TRIB.counterX, id === '06', Wd('06', 'fusil') - 0.2, E('06') + 0.05, 540, 680, 0.95) > 0) TRIB.counterX.xr.setAttribute('opacity', (0.6 + 0.4 * Math.sin(t * 8)).toFixed(2))
    if (prop(TRIB.calls, id === '07', Wd('07', 'appele') - 0.2, E('07') + 0.05, 540, 720, 0.58, -3) > 0) TRIB.calls.rows.forEach((row, k) => row.setAttribute('opacity', t > Wd('07', 'appele') + k * 0.12 ? 1 : 0))
    if (prop(TRIB.dist, id === '08', Wd('08', 'garcon') - 0.2, E('08') + 0.05, 540, 660, 0.85) > 0) {
      const u = ease.out3(prog(t, Wd('08', '12') - 0.3, 0.6))
      const x1 = lerp(-300, 300, u)
      TRIB.distArrow.setAttribute('d', `M -300 40 L ${x1} 40`)
      TRIB.distTxt.textContent = `${Math.round(12 * u)} M`
      TRIB.distRunner.update(x1 + 50, 120, 0.6, t * 14)
    }
    if (prop(TRIB.shots, id === '09', Wd('09', 'deux') - 0.15, E('09') + 0.05, 540, 660, 0.8) > 0) {
      const tt = [Wd('09', 'deux') - 0.1, Wd('09', 'premiers') - 0.1, Wd('09', 'troisieme') - 0.1]
      TRIB.shotsV.forEach((v, k) => v.setAttribute('opacity', t > tt[k] ? 1 : 0.15))
      TRIB.shots.ring.setAttribute('stroke-dashoffset', 1300 * (1 - prog(t, Wd('09', 'arme') - 0.1, 0.4, ease.out3)))
    }
    prop(TRIB.forehead, id === '11', Wd('11', 'arme') - 0.2, E('11') + 0.05, 540, 660, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions : flashes (tirs, impacts), retour en arrière, volets, panoramiques filés entre répliques.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.85 : 0.35) * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  const rw = t - (SEC.braquage.t0 - 0.35)
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
    for (const s of [COUPS, BRAQUAGE]) s.g.setAttribute('transform', `translate(${jit} 0)`)
  } else for (const s of [COUPS, BRAQUAGE]) s.g.removeAttribute('transform')
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  // Panoramique filé entre deux répliques (le passe-passe).
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
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCATE DE LA DÉFENSE') : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === COUPS || cur === BRAQUAGE ? 26 : 14)
}

// Traînées du panoramique filé.
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)

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
