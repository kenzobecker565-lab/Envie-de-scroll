/**
 * ============================================================================
 *  « Affaire Classée ? » — le boulanger (≈ 80 s, 1080 × 1920)
 * ============================================================================
 *  Style A (celui du faux chirurgien et de la fausse avocate) : motion design
 *  2D vectoriel en SVG, gros sous-titres animés, pas de jauge.
 *
 *  Le hook, très animé, montre le pillage :
 *  1. La nuit d'émeutes : rue en feu, voiture qui brûle, fumée, braises,
 *     gyrophares ; des pilleurs sortent du supermarché en courant avec leur
 *     butin ; le vigile à terre devant la grille arrachée ; « COMA ».
 *  2. La vidéo du téléphone (cadre REC) : le rayon pillé, les produits qui
 *     tombent ; elle traverse et enjambe le corps ; ce qu'elle porte s'étiquette
 *     un à un, arrêt sur image sur la console.
 *  3. Sa fiche : 23 ans, aide-soignante, casier vierge… tampon « JUGÉE ».
 *  Puis le procès (un accessoire par réplique, coupes rapides) et le vote,
 *  avec l'appel à s'abonner.
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
grad('store', [[0, '#3a4766'], [0.6, '#232b40'], [1, '#141824']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('cctv', [[0, '#2c3a33'], [1, '#121a16']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('street', [[0, '#1d1a33'], [0.6, '#3a2440'], [1, '#120e18']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('warm', [[0, '#ffd9a0'], [1, '#e89a4a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
  } else if (carry === 'baton') {
    svg('path', { d: 'M 60 -200 L 150 -290', stroke: '#0b0d12', 'stroke-width': 16, 'stroke-linecap': 'round' }, loot)
    svg('path', { d: 'M 64 -206 L 146 -286', stroke: rim, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8 }, loot)
  } else if (carry === 'sack') {
    svg('path', { d: 'M -60 -230 q -40 10 -50 60 q 10 40 50 36 q 30 -30 0 -96 Z', fill: '#e5e7eb', stroke: '#111', 'stroke-width': 4 }, loot)
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
function lyingGuard(parent, { color = '#151924', rim = '#ff8a3d', vest = true, hood = false } = {}) {
  const g = svg('g', {}, parent)
  svg('ellipse', { cx: 0, cy: 8, rx: 190, ry: 18, fill: '#000', opacity: 0.35 }, g)
  svg('rect', { x: -150, y: -46, width: 200, height: 60, rx: 28, fill: color }, g)
  if (vest) for (const x of [-110, -60]) svg('rect', { x, y: -46, width: 16, height: 60, fill: '#e8ff3a' }, g)
  svg('circle', { cx: -180, cy: -22, r: 32, fill: color }, g)
  if (hood) svg('path', { d: 'M -150 -40 C -170 -70 -230 -60 -214 -10 L -150 -6 Z', fill: color }, g)
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
const KARIM = { robe: '#f4f1ea', jabot: false, collar: '#d9d2c3', hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#c98d68', iris: '#2b1d12' }
const KARIM_BOX = { robe: '#6b7280', jabot: false, collar: '#e5e7eb', hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#c98d68', iris: '#2b1d12' }

// Les articles (réutilisés partout).
function item(parent, kind, s = 1) {
  const g = svg('g', {}, parent)
  const h = svg('g', { transform: `scale(${s})` }, g)
  if (kind === 'croissant') {
    svg('path', { d: 'M -70 20 Q -60 -40 0 -44 Q 60 -40 70 20 Q 40 0 0 4 Q -40 0 -70 20 Z', fill: '#e2a04f', stroke: '#7a4a1a', 'stroke-width': 5 }, h)
    for (const x of [-30, 0, 30]) svg('path', { d: `M ${x} -38 Q ${x + 6} -16 ${x} 2`, stroke: '#7a4a1a', 'stroke-width': 4, fill: 'none' }, h)
  } else if (kind === 'sandwich') {
    svg('path', { d: 'M -80 0 Q -80 -30 -50 -32 L 60 -32 Q 84 -30 80 0 Z', fill: '#e8b46a', stroke: '#7a4a1a', 'stroke-width': 5 }, h)
    svg('rect', { x: -80, y: -2, width: 160, height: 14, fill: '#5fbf6a' }, h)
    svg('rect', { x: -80, y: 10, width: 160, height: 12, fill: '#f06a8a' }, h)
    svg('path', { d: 'M -80 22 L 80 22 Q 80 40 60 40 L -60 40 Q -80 40 -80 22 Z', fill: '#e8b46a', stroke: '#7a4a1a', 'stroke-width': 5 }, h)
  } else if (kind === 'canette') {
    svg('rect', { x: -30, y: -56, width: 60, height: 112, rx: 12, fill: '#e5484d', stroke: '#7a1010', 'stroke-width': 5 }, h)
    svg('rect', { x: -30, y: -10, width: 60, height: 22, fill: '#fbf8f0' }, h)
  } else if (kind === 'pain') {
    svg('path', { d: 'M -80 10 Q -80 -20 -50 -24 L 60 -24 Q 86 -20 82 8 Q 80 26 50 26 L -50 26 Q -80 26 -80 10 Z', fill: '#d9a05b', stroke: '#7a4a1a', 'stroke-width': 5 }, h)
    for (const x of [-36, 0, 36]) svg('path', { d: `M ${x - 10} -14 L ${x + 12} 4`, stroke: '#7a4a1a', 'stroke-width': 5 }, h)
  }
  return g
}

// Une silhouette d'ado à capuche, visage flouté (carrés).
function hoodie(parent, { color = '#3a4258', blur = true } = {}) {
  const g = svg('g', {}, parent)
  svg('path', { d: 'M -150 260 L -150 120 Q -150 40 -60 30 L 60 30 Q 150 40 150 120 L 150 260 Z', fill: color }, g)
  svg('path', { d: 'M -110 -20 C -130 -170 130 -170 110 -20 L 100 50 L -100 50 Z', fill: color }, g)
  if (blur) {
    const r = rng(5)
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) svg('rect', { x: -64 + i * 32, y: -76 + j * 32, width: 32, height: 32, fill: ['#c98d68', '#b97d58', '#d9a07a', '#a86e4c'][Math.floor(r() * 4)] }, g)
  }
  return g
}

// Le post Facebook : photo, « VOLEUR ! Reconnaissez-le », compteur de vues.
function phonePost(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -270, y: -500, width: 540, height: 1000, rx: 56, fill: '#10121a' }, g)
  svg('rect', { x: -245, y: -460, width: 490, height: 920, rx: 30, fill: '#fbf8f0' }, g)
  svg('rect', { x: -245, y: -460, width: 490, height: 90, rx: 30, fill: '#3b5bdb' }, g)
  txt(g, 'f', { x: -190, y: -395, 'font-size': 60, fill: '#fff' })
  svg('circle', { cx: -180, cy: -320, r: 30, fill: '#e2a04f' }, g)
  txt(g, 'Boulangerie Karim', { x: -135, y: -310, 'font-size': 28, fill: '#1d2a5c', 'text-anchor': 'start' })
  txt(g, 'VOLEUR !', { x: 0, y: -240, 'font-size': 56, fill: '#e5484d' })
  svg('rect', { x: -210, y: -210, width: 420, height: 380, rx: 12, fill: '#8a94a8' }, g)
  const ph = hoodie(svg('g', { transform: 'translate(0 20) scale(0.95)' }, g), { color: '#2a3142' })
  void ph
  txt(g, 'Reconnaissez-le.', { x: 0, y: 225, 'font-size': 40, fill: '#1d2a5c' })
  svg('rect', { x: -210, y: 260, width: 420, height: 3, fill: '#d6dbe4' }, g)
  const views = txt(g, '0 vues', { x: 0, y: 330, 'font-size': 46, fill: '#e5484d', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  txt(g, '♥ 48 k   💬 12 k   ↗ 30 k', { x: 0, y: 400, 'font-size': 30, fill: '#5a6478' })
  return { g, views }
}

// 1 · La vitrine de la boulangerie, puis le post qui explose.
const EMEUTE = scene('emeute', (L) => {
  bg(L, 'url(#street)')
  // Immeubles autour.
  for (const [x, w] of [[-200, 300], [980, 300]]) svg('rect', { x, y: 300, width: w, height: 1300, fill: '#1a1428' }, L.far)
  const shop = svg('g', {}, L.mid)
  svg('rect', { x: 100, y: 420, width: 880, height: 1200, fill: '#3a2a36' }, shop)
  // Le store rayé et l'enseigne.
  for (let i = 0; i < 11; i++) svg('path', { d: `M ${100 + i * 80} 560 L ${180 + i * 80} 560 L ${190 + i * 80} 680 L ${90 + i * 80} 680 Z`, fill: i % 2 ? '#fbf8f0' : '#c43a2f' }, shop)
  svg('rect', { x: 100, y: 440, width: 880, height: 120, fill: '#1d2a5c' }, shop)
  txt(shop, 'BOULANGERIE', { x: 540, y: 525, 'font-size': 80, fill: '#ffd166' })
  // La vitrine éclairée avec les pains.
  svg('rect', { x: 160, y: 720, width: 760, height: 620, rx: 10, fill: 'url(#warm)' }, shop)
  for (let k = 0; k < 3; k++) {
    svg('rect', { x: 180, y: 900 + k * 150, width: 720, height: 12, fill: '#7a4a1a' }, shop)
    for (let i = 0; i < 5; i++) {
      const it = item(shop, ['pain', 'croissant', 'pain', 'croissant', 'pain'][(i + k) % 5], 0.8)
      it.setAttribute('transform', `translate(${250 + i * 140} ${872 + k * 150})`)
    }
  }
  svg('rect', { x: 160, y: 720, width: 760, height: 620, rx: 10, fill: 'none', stroke: '#1d1420', 'stroke-width': 18 }, shop)
  // L'affiche « VOLEUR » scotchée sur la vitrine.
  const poster = svg('g', {}, L.actor)
  svg('rect', { x: -170, y: -230, width: 340, height: 460, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 5 }, poster)
  svg('rect', { x: -170, y: -230, width: 340, height: 90, fill: '#e5484d' }, poster)
  txt(poster, 'VOLEUR', { x: 0, y: -168, 'font-size': 60, fill: '#fff' })
  svg('rect', { x: -140, y: -120, width: 280, height: 270, fill: '#8a94a8' }, poster)
  const ph = svg('g', { transform: 'translate(0 -10) scale(0.62)' }, poster)
  hoodie(ph, { color: '#2a3142' })
  txt(poster, 'RECONNAISSEZ-LE', { x: 0, y: 200, 'font-size': 30, fill: '#10121a' })
  for (const [x, y, r] of [[-170, -230, -30], [170, -230, 30]]) svg('rect', { x: x - 40, y: y - 12, width: 80, height: 24, fill: '#ffe7a0', opacity: 0.85, transform: `rotate(${r} ${x} ${y})` }, poster)
  svg('rect', { x: -400, y: 1600, width: W + 800, height: 1000, fill: '#120e18' }, L.mid)
  // Le téléphone avec le post, qui surgit sur « Facebook ».
  const post = phonePost(L.fx)
  return { poster, post }
})

// 2 · La caméra de la boulangerie.
const VIDEO = scene('video', (L) => {
  bg(L, 'url(#cctv)')
  // Étagères de pain au fond.
  for (let k = 0; k < 3; k++) {
    svg('rect', { x: -200, y: 620 + k * 180, width: W + 400, height: 16, fill: '#7a4a1a' }, L.far)
    for (let i = 0; i < 8; i++) {
      const it = item(L.far, ['pain', 'croissant'][(i + k) % 2], 0.9)
      it.setAttribute('transform', `translate(${-40 + i * 160} ${588 + k * 180})`)
    }
  }
  svg('rect', { x: -400, y: 1240, width: W + 800, height: 1400, fill: '#3a3a40' }, L.far)
  // L'ado.
  const teen = walker(L.actor, { carry: 'none', dir: -1, hood: true, color: '#5a6480', rim: '#ffffff' })
  // La vitrine réfrigérée, au premier plan.
  const desk = svg('g', {}, L.front)
  svg('rect', { x: -200, y: 1520, width: W + 400, height: 600, fill: '#6a5040' }, desk)
  svg('rect', { x: -200, y: 1380, width: W + 400, height: 150, fill: '#cfe3f5', opacity: 0.55, stroke: '#9aa3b5', 'stroke-width': 6 }, desk)
  for (let i = 0; i < 9; i++) {
    const it = item(desk, ['croissant', 'sandwich', 'pain'][i % 3], 0.8)
    it.setAttribute('transform', `translate(${20 + i * 130} 1470)`)
  }
  const arms = svg('g', {}, L.actor)
  const loot = { croissants: item(arms, 'croissant', 1.1), sandwich: item(arms, 'sandwich', 1.0), canette: item(arms, 'canette', 0.9) }
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#3f7a52', opacity: 0.2 }, L.fx)
  for (let y = -200; y < H + 200; y += 12) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#000', opacity: 0.18 }, L.fx)
  const ring = svg('circle', { cx: 0, cy: 0, r: 150, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 1000, 'stroke-dashoffset': 1000 }, L.fx)
  return { teen, loot, ring }
})

// 3 · Sa fiche : la photo, les mentions, puis « JUGÉE ».
const FICHE = scene('fiche', (L) => {
  bg(L, '#0b0d14')
  svg('circle', { cx: 540, cy: 900, r: 820, fill: '#232a40', opacity: 0.7 }, L.far)
  const card = svg('g', {}, L.mid)
  svg('rect', { x: -420, y: -560, width: 840, height: 1120, rx: 30, fill: '#fbf8f0' }, card)
  svg('rect', { x: -420, y: -560, width: 840, height: 120, rx: 30, fill: '#1d2a5c' }, card)
  txt(card, 'FICHE · PRÉVENU', { x: 0, y: -480, 'font-size': 48, fill: '#fff' })
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16, fill: '#c9d6e8' }, card)
  const photo = svg('g', { 'clip-path': 'url(#photoClip)' }, card)
  const clip = svg('clipPath', { id: 'photoClip' }, defs)
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16 }, clip)
  const ines = makePerson(photo, KARIM)
  const rows = ['KARIM', '51 ANS', 'BOULANGER · 20 ANS', 'VOLÉ 40 FOIS'].map((s, k) => {
    const g = svg('g', {}, card)
    txt(g, s, { x: 0, y: 60 + k * 100, 'font-size': k === 0 ? 76 : 56, fill: k === 3 ? '#e5484d' : '#1d2a5c' })
    return g
  })
  return { card, ines, rows }
})

// 4 · Le procès : chaque réplique a son plan et son accessoire.
const TRIB = scene('tribunal', (L) => {
  const procBg = svg('g', {}, L.far)
  svg('rect', { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: 'url(#court)' }, procBg)
  svg('path', { d: 'M 640 220 L 640 760 L 960 760 L 960 220 A 160 160 0 0 0 640 220 Z', fill: '#3b4a86' }, procBg)
  svg('path', { d: 'M 800 120 L 800 760 M 640 450 L 960 450', stroke: '#27305a', 'stroke-width': 18 }, procBg)
  svg('path', { d: 'M 640 260 L 960 260 L 700 1900 L -200 1900 Z', fill: 'url(#beam)', opacity: 0.5 }, procBg)
  for (let i = 0; i < 9; i++) svg('rect', { x: -200 + i * 180, y: 900, width: 150, height: 1100, rx: 12, fill: '#1a2147', opacity: 0.9 }, procBg)
  const avoBg = svg('g', {}, L.far)
  svg('rect', { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: 'url(#courtRed)' }, avoBg)
  const r = rng(9)
  for (let i = 0; i < 16; i++) svg('circle', { cx: r() * W, cy: 200 + r() * 1100, r: 30 + r() * 90, fill: '#ffb36b', opacity: 0.06 + r() * 0.08 }, avoBg)
  for (let i = 0; i < 6; i++) svg('circle', { cx: 60 + i * 200, cy: 1180, r: 70, fill: '#2a120a' }, avoBg)
  svg('rect', { x: -100, y: 1200, width: W + 200, height: 400, fill: '#2a120a' }, avoBg)
  const hotBg = svg('g', {}, L.far)
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
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
  // Le post, en petit.
  const post = prop((g) => {
    const p = phonePost(g)
    g.views = p.views
    g.cap = svg('rect', { x: -230, y: 190, width: 460, height: 56, rx: 10, fill: 'none', stroke: '#e5484d', 'stroke-width': 8, opacity: 0 }, g)
  })
  // La pile de plaintes.
  const plaintes = prop((g) => {
    g.sheets = []
    for (let k = 0; k < 6; k++) {
      const s = svg('g', { transform: `translate(${-250 + k * 100} ${(k % 2) * 20}) rotate(${(k - 2.5) * 5})` }, g)
      svg('rect', { x: -80, y: -110, width: 160, height: 220, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, s)
      txt(s, 'PLAINTE', { x: 0, y: -60, 'font-size': 26, fill: '#1d2a5c' })
      for (let l = 0; l < 4; l++) svg('rect', { x: -56, y: -30 + l * 26, width: 112, height: 8, fill: '#c7cbd4' }, s)
      txt(s, `N°${k + 1}`, { x: 0, y: 90, 'font-size': 28, fill: '#e5484d' })
      g.sheets.push(s)
    }
  })
  // Le collège : fenêtres d'où on regarde.
  const college = prop((g) => {
    svg('rect', { x: -360, y: -200, width: 720, height: 380, fill: '#d9a07a', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -360, y: -260, width: 720, height: 70, fill: '#1d2a5c', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'COLLÈGE', { x: 0, y: -210, 'font-size': 44, fill: '#fff' })
    for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
      svg('rect', { x: -320 + i * 110, y: -150 + j * 150, width: 80, height: 100, fill: '#cfe3f5', stroke: '#10121a', 'stroke-width': 5 }, g)
      svg('circle', { cx: -280 + i * 110, cy: -110 + j * 150, r: 16, fill: '#10121a' }, g)
    }
  })
  // La caméra de surveillance.
  const cam2 = prop((g) => {
    svg('rect', { x: -200, y: -70, width: 360, height: 140, rx: 30, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('circle', { cx: 160, cy: 0, r: 60, fill: '#10121a' }, g)
    svg('circle', { cx: 160, cy: 0, r: 30, fill: '#3b82f6' }, g)
    svg('path', { d: 'M -120 70 L -120 160 L -260 160', stroke: '#10121a', 'stroke-width': 18, fill: 'none' }, g)
    g.dot = svg('circle', { cx: -150, cy: -30, r: 16, fill: '#ff3b30' }, g)
  })
  // Le compteur de vols qui tombe à zéro.
  let volsTxt
  const vols = prop((g) => {
    svg('rect', { x: -260, y: -170, width: 520, height: 340, rx: 30, fill: '#10121a', stroke: '#fbf8f0', 'stroke-width': 8 }, g)
    txt(g, 'VOLS / SEMAINE', { x: 0, y: -100, 'font-size': 38, fill: '#9aa3b5' })
    volsTxt = txt(g, '40', { x: 0, y: 100, 'font-size': 200, fill: '#e5484d', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  })
  // Le cartable qui part.
  const cartable = prop((g) => {
    svg('rect', { x: -160, y: -120, width: 320, height: 250, rx: 30, fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('path', { d: 'M -90 -120 Q 0 -220 90 -120', stroke: '#10121a', 'stroke-width': 18, fill: 'none' }, g)
    svg('rect', { x: -160, y: -20, width: 320, height: 20, fill: '#2563c9' }, g)
    svg('rect', { x: -30, y: -40, width: 60, height: 50, rx: 8, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, g)
  })
  // Le cahier de comptes dans le rouge.
  const compta = prop((g) => {
    svg('rect', { x: -300, y: -220, width: 600, height: 440, rx: 16, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -300, y: -220, width: 40, height: 440, fill: '#c43a2f' }, g)
    for (let l = 0; l < 7; l++) svg('rect', { x: -230, y: -170 + l * 50, width: 470, height: 4, fill: '#c7cbd4' }, g)
    const pts = [[-220, -140], [-120, -110], [-20, -40], [80, 0], [180, 90], [240, 150]]
    svg('path', { d: 'M ' + pts.map((p) => p.join(' ')).join(' L '), stroke: '#e5484d', 'stroke-width': 12, fill: 'none', 'stroke-linejoin': 'round' }, g)
    txt(g, '- 8 000 €', { x: 60, y: -120, 'font-size': 70, fill: '#e5484d' })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, post, plaintes, college, cam2, vols, get volsTxt() { return volsTxt }, cartable, compta }
})

// 5 · Le vote : elle, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, KARIM_BOX)
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
txt(rec, 'REC · CAM 2 · BOUTIQUE', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
tag('SUR SA VITRINE', 'pill red', { t0: 0, t1: Wd('01', 'facebook') - 0.15, y: 1290, rot: -2 })
const T_FB = Wd('01', 'facebook') - 0.15
counterTag(Wd('01', 'deux') - 0.1, SEC.emeute.t1, 2000000, 'VUES', { fmt: (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' '), y: 200, dur: 1.0 }).el.querySelector('.num').style.fontSize = '140px'
fs(tag('14 ANS', 'stamp', { t0: Wd('01', 'quatorze') - 0.05, t1: SEC.emeute.t1, y: 1150, rot: -8, from: 2.8, dur: 0.2 }), 170)
const LOOT_T = { croissants: Wd('02', 'croissants') - 0.1, sandwich: Wd('02', 'sandwich') - 0.1, canette: Wd('02', 'canette') - 0.1 }
const T_12 = Wd('02', 'douze') - 0.1
fs(tag('12 €', 'slam yellow', { t0: T_12, t1: SEC.video.t1, y: 360, rot: -3, from: 2.6, dur: 0.2 }), 150)
fs(tag('JUGÉ', 'stamp', { t0: Wd('03', 'lui') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
fs(tag('12 €', 'slam white', { t0: S('04') - 0.05, t1: Wd('04', 'et') - 0.1, y: 260, rot: -3, from: 2.4, dur: 0.2 }), 130)
tag('UN ENFANT · 2 M D’INCONNUS', 'pill red', { t0: Wd('04', 'enfant') - 0.1, t1: E('04') + 0.1, y: 230, rot: -2 }).el.style.fontSize = '40px'
tag('40 VOLS', 'pill yellow', { t0: Wd('05', 'quarante') - 0.1, t1: E('05') + 0.1, y: 230, rot: -2 })
fs(tag('POLICE : JAMAIS VENUE', 'slam white', { t0: Wd('05', 'police') - 0.06, t1: E('05') + 0.1, y: 720, rot: -2, from: 2.4, dur: 0.2 }), 76)
tag('SA PROPRE POLICE', 'pill red', { t0: Wd('06', 'propre') - 0.1, t1: Wd('06', 'cet') - 0.1, y: 230, rot: -2 })
fs(tag('ENFERMÉ CHEZ LUI', 'slam white', { t0: Wd('06', 'sortir') - 0.06, t1: E('06') + 0.1, y: 250, rot: -3, from: 2.4, dur: 0.2 }), 96)
fs(tag('0 MOT INVENTÉ', 'slam yellow', { t0: Wd('07', 'invente') - 0.06, t1: Wd('07', 'il', 1) - 0.1, y: 250, rot: -3, from: 2.4, dur: 0.2 }), 100)
tag('JUSTE SA CAMÉRA', 'pill', { t0: Wd('07', 'camera') - 0.1, t1: E('07') + 0.1, y: 250, rot: -2 })
fs(tag('UNE CHASSE.', 'slam white', { t0: Wd('08', 'chasse') - 0.06, t1: E('08') + 0.1, y: 250, rot: -3, from: 2.6, dur: 0.2 }), 130)
tag('EN 1 SEMAINE', 'pill yellow', { t0: Wd('09', 'semaine') - 0.1, t1: E('09') + 0.1, y: 230, rot: -2 })
tag('6 PLAINTES : RIEN', 'pill', { t0: Wd('09', 'six') - 0.1, t1: E('09') + 0.1, y: 720, rot: 2 })
tag('14 ANS', 'pill red', { t0: Wd('10', 'gamin') - 0.1, t1: E('10') + 0.1, y: 230, rot: -2 })
fs(tag('LE PRIX ?', 'slam white', { t0: Wd('10', 'prix') - 0.06, t1: E('10') + 0.1, y: 420, rot: -2, from: 2.4, dur: 0.2 }), 110)
fs(tag('IL A FAILLI FERMER', 'slam white', { t0: Wd('11', 'fermer') - 0.06, t1: E('11') + 0.1, y: 250, rot: -3, from: 2.4, dur: 0.2 }), 92)
tag('ÇA SE RELÈVE', 'pill', { t0: Wd('12', 'releve') - 0.1, t1: Wd('12', 'visage') - 0.1, y: 300, rot: -2 })
fs(tag('JAMAIS EFFACÉ.', 'slam white', { t0: Wd('12', 'jamais') - 0.06, t1: E('12') + 0.1, y: 380, rot: -2, from: 2.4, dur: 0.2 }), 120)
fs(tag('40 FOIS.', 'slam yellow', { t0: Wd('13', 'quarante') - 0.06, t1: Wd('13', 'et') - 0.1, y: 360, rot: -3, from: 2.6, dur: 0.2 }), 150)
fs(tag('LE BOULANGER.', 'slam yellow', { t0: Wd('13', 'boulanger') - 0.06, t1: E('13') + 0.15, y: 380, rot: -3, from: 3, dur: 0.2 }), 100)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, y: 330, from: 1.4, dur: 0.5 }), 110)
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

const T_CONSOLE = T_12
const IMPACTS = [
  [0.05, 10],
  [T_FB, 10],
  [Wd('01', 'quatorze') - 0.05, 16],
  [T_CONSOLE, 14],
  [Wd('03', 'lui') - 0.05, 16],
  [Wd('04', 'dinconnus') - 0.06, 10],
  [Wd('05', 'police') - 0.06, 12],
  [Wd('06', 'sortir') - 0.06, 10],
  [Wd('08', 'chasse') - 0.06, 14],
  [Wd('09', 'zero') - 0.06, 12],
  [Wd('10', 'prix') - 0.06, 10],
  [Wd('11', 'fermer') - 0.06, 10],
  [Wd('12', 'jamais') - 0.06, 12],
  [Wd('13', 'boulanger') - 0.06, 16],
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

function runner(R, t, base = 0) {
  const u = (t - base - R.t0) / R.dur
  const on = u > 0 && u < 1
  R.w.g.setAttribute('display', on ? 'inline' : 'none')
  if (on) R.w.update(lerp(R.from, R.to, u), R.y, R.s, (t - base) * 14)
}

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)
  rec.setAttribute('display', cur === VIDEO ? 'inline' : 'none')
  freeze.setAttribute('display', 'none')

  if (cur === EMEUTE) {
    // La vitrine, l'affiche ; puis le post surgit et les vues s'envolent.
    const fb = prog(t, T_FB, 0.45, ease.out3)
    cam(EMEUTE, t, { zoom: lerp(1.15, 1.35, prog(t, 0, T_FB, ease.io3)), cx: 560, cy: lerp(1000, 1080, prog(t, 0, T_FB)), push: 0.02, hand: 3 })
    place(EMEUTE.poster, 640, 1060, 0.95, 4 + 2 * Math.sin(t * 2))
    show(EMEUTE.post.g, fb > 0.01)
    place(EMEUTE.post.g, 540, lerp(1700, 960, fb), 0.85 * fb + 0.01, lerp(12, -3, fb))
    const n = Math.round(2000000 * ease.in3(prog(t, Wd('01', 'deux') - 0.1, 1.0)))
    EMEUTE.post.views.textContent = `${n.toLocaleString('fr-FR').replace(/\s/g, ' ')} vues`
  }
  if (cur === VIDEO) {
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    const zoomC = frozen ? 1 + 0.25 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 1
    // Il entre par la droite, se sert, puis repart en courant vers la gauche.
    const tIn = LOOT_T.croissants
    const tRun = Wd('02', 'courant') - 0.3
    const x = tt < tIn ? lerp(1250, 600, clamp((tt - VIDEO.t0) / (tIn - VIDEO.t0))) : tt < tRun ? 600 - 30 * clamp((tt - tIn) / (tRun - tIn)) : lerp(570, -300, clamp((tt - tRun) / 0.9))
    const run = tt >= tRun
    cam(VIDEO, tt, { zoom: 1.2 * zoomC, cx: frozen ? 600 : 560, cy: frozen ? 1180 : 1180, push: 0.008, hand: 0 })
    VIDEO.teen.update(x, 1560, 2.0, tt * (run ? 16 : 9), { stride: tt > tIn && !run ? 0.15 : 1 })
    const bx = x - 80
    const by = 1560 - 250 * 2.0
    for (const [name, dx, dy] of [['croissants', 0, 0], ['sandwich', -40, -70], ['canette', 30, -140]]) {
      const s = popS(tt, LOOT_T[name], Infinity, 0.3)
      show(VIDEO.loot[name], s > 0.01)
      place(VIDEO.loot[name], bx + dx, by + dy + Math.abs(Math.sin(tt * 9)) * 6, s, name === 'canette' ? 10 : -6)
    }
    VIDEO.ring.setAttribute('transform', `translate(${x} ${1560 - 262 * 2.0})`)
    VIDEO.ring.setAttribute('stroke-dashoffset', 1000 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `07:12:${String(40 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'neutral', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['karim', 'cinquante', 'boulanger', 'vole']
    FICHE.rows.forEach((g, k) => {
      const s = popS(t, Wd('03', keys[k]) - 0.1, Infinity, 0.3)
      g.setAttribute('opacity', Math.min(1, s))
      g.setAttribute('transform', `translate(0 ${(1 - Math.min(1, s)) * 30})`)
    })
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
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch), cy: lerp(980, 900, Math.min(1, punch)), push: 0.025, from: l.start - 0.12 })
    const sp = speaking(l.who, t)
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540,
      y: 1170,
      scale: 1.4,
      mouth: m,
      brows: isProc ? (['08', '10', '12'].includes(id) ? 'angry' : 'determined') : ['13', '09'].includes(id) ? 'determined' : 'neutral',
      look: [0, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * beat : 0), 1.0 + (sp ? 0.3 * beat : 0)],
      armL: [0.25 + (sp ? 0.1 * beat : 0), 1.2 + (sp ? 0.25 * Math.sin(t * 4.1) : 0)],
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.04 * Math.sin(t * 1.2),
    })
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    if (prop(TRIB.post, id === '04' || id === '08', id === '04' ? Wd('04', 'visage') - 0.15 : S('08') - 0.1, id === '04' ? E('04') + 0.05 : E('08') + 0.05, 540, 520, 0.46) > 0) {
      TRIB.post.views.textContent = '2 000 000 vues'
      TRIB.post.cap.setAttribute('opacity', id === '08' && t > Wd('08', 'reconnaissez') - 0.1 ? 1 : 0)
    }
    if (prop(TRIB.plaintes, id === '05', Wd('05', 'six') - 0.15, E('05') + 0.05, 540, 520, 0.8) > 0) {
      TRIB.plaintes.sheets.forEach((s, k) => s.setAttribute('opacity', t > Wd('05', 'six') - 0.1 + k * 0.1 ? 1 : 0))
    }
    prop(TRIB.college, id === '06', Wd('06', 'college') - 0.15, E('06') + 0.05, 540, 620, 0.7)
    if (prop(TRIB.cam2, id === '07', Wd('07', 'montre') - 0.15, E('07') + 0.05, 540, 540, 0.85) > 0) TRIB.cam2.dot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    if (prop(TRIB.vols, id === '09', S('09') - 0.1, E('09') + 0.05, 540, 500, 0.75) > 0) {
      const v = Math.round(40 * (1 - ease.io3(prog(t, Wd('09', 'cesse') - 0.2, Wd('09', 'zero') - Wd('09', 'cesse') + 0.2))))
      TRIB.volsTxt.textContent = String(v)
      TRIB.volsTxt.setAttribute('fill', v === 0 ? '#12a150' : '#e5484d')
    }
    prop(TRIB.cartable, id === '10', Wd('10', 'college') - 0.2, E('10') + 0.05, lerp(540, 380, prog(t, Wd('10', 'college'), 1.2)), 640, 0.7)
    if (prop(TRIB.compta, id === '11', Wd('11', 'huit') - 0.15, E('11') + 0.05, 540, 540, 0.75) > 0) void 0
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, 0.35 * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  let ir = 0
  for (const l of TLINES.slice(1)) {
    const q = t - (l.start - 0.12)
    if (q > -0.1 && q < 0.12) ir = q < 0 ? lerp(0, 1400, ease.in3(clamp((q + 0.1) / 0.1))) : lerp(1400, 0, ease.out3(clamp(q / 0.12)))
  }
  iris.setAttribute('r', ir)

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCAT DE LA DÉFENSE') : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === VIDEO ? 40 : 14)
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
