/**
 * ============================================================================
 *  « Affaire Classée ? » — le maître-nageur (≈ 80 s, 1080 × 1920)
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
grad('sunset', [[0, '#ff8a5a'], [0.45, '#ffc58a'], [1, '#ffe3b0']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('store', [[0, '#3a4766'], [0.6, '#232b40'], [1, '#141824']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('cctv', [[0, '#2c3a33'], [1, '#121a16']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
const KARIM = { robe: '#e0393e', jabot: false, collar: '#ffd43b', hair: 'short', hairColor: '#1d140e', beard: true, skin: '#c98e66', iris: '#2b1d12' }
const KARIM_BOX = { ...KARIM, robe: '#6b7280', collar: '#e5e7eb' }
const KIDS = [
  { robe: '#3b82f6', jabot: false, collar: '#9fd8ff', hair: 'short', hairColor: '#1d140e', skin: '#8a5636', iris: '#2b1d12' },
  { robe: '#f06a8a', jabot: false, collar: '#ffd1dc', hair: 'bob', hairColor: '#2a1a10', female: true, skin: '#d9a07a', iris: '#2b1d12' },
  { robe: '#ffd43b', jabot: false, collar: '#fff3b0', hair: 'messy', hairColor: '#3a2416', skin: '#b97a52', iris: '#2b1d12' },
]

// La bouée (réutilisée).
function buoy(parent, s = 1, label = '') {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  for (let k = 0; k < 8; k++) {
    const a0 = (k / 8) * Math.PI * 2
    const a1 = ((k + 1) / 8) * Math.PI * 2
    const P = (a, r) => `${Math.cos(a) * r} ${Math.sin(a) * r}`
    svg('path', { d: `M ${P(a0, 110)} A 110 110 0 0 1 ${P(a1, 110)} L ${P(a1, 55)} A 55 55 0 0 0 ${P(a0, 55)} Z`, fill: k % 2 ? '#ffffff' : '#e5484d', stroke: '#10121a', 'stroke-width': 6 }, g)
  }
  if (label) txt(g, label, { x: 0, y: 24, 'font-size': 64, fill: '#10121a' })
  return g
}

// La piscine au coucher du soleil : la cité derrière le grillage, Karim au bord,
// les enfants dans l'eau.
function bassin(L) {
  const r = rng(21)
  svg('circle', { cx: 820, cy: 520, r: 150, fill: '#fff1c1', opacity: 0.85 }, L.far)
  // La cité au loin.
  for (let i = 0; i < 6; i++) {
    const x = -120 + i * 230
    const h = 380 + r() * 260
    svg('rect', { x, y: 900 - h, width: 190, height: h, fill: '#b86a62', opacity: 0.85 }, L.far)
    for (let j = 0; j < Math.floor(h / 60); j++) for (let k = 0; k < 4; k++) svg('rect', { x: x + 18 + k * 44, y: 900 - h + 24 + j * 60, width: 22, height: 30, fill: r() > 0.5 ? '#ffd99a' : '#7a3f3a' }, L.far)
  }
  // Le grillage.
  const fence = svg('g', {}, L.far)
  svg('rect', { x: -400, y: 760, width: W + 800, height: 8, fill: '#6a6f7a' }, fence)
  for (let x = -400; x < W + 400; x += 36) {
    svg('path', { d: `M ${x} 768 L ${x + 140} 1010`, stroke: '#6a6f7a', 'stroke-width': 3, opacity: 0.8 }, fence)
    svg('path', { d: `M ${x + 140} 768 L ${x} 1010`, stroke: '#6a6f7a', 'stroke-width': 3, opacity: 0.8 }, fence)
  }
  for (let x = -400; x < W + 400; x += 280) svg('rect', { x, y: 740, width: 14, height: 280, fill: '#4a4f5a' }, fence)
  // Le bord carrelé.
  svg('rect', { x: -400, y: 1000, width: W + 800, height: 500, fill: '#e9e2d0' }, L.far)
  for (let x = -400; x < W + 400; x += 70) svg('rect', { x, y: 1000, width: 3, height: 500, fill: '#cfc6b0' }, L.far)
  for (let y = 1000; y < 1500; y += 70) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#cfc6b0' }, L.far)
  // La chaise haute du maître-nageur.
  const chair = svg('g', {}, L.mid)
  for (const x of [940, 1050]) svg('rect', { x, y: 640, width: 18, height: 600, fill: '#f4f1ea', stroke: '#9aa3b5', 'stroke-width': 3 }, chair)
  svg('rect', { x: 920, y: 760, width: 160, height: 22, rx: 8, fill: '#f4f1ea', stroke: '#9aa3b5', 'stroke-width': 3 }, chair)
  svg('rect', { x: 960, y: 640, width: 80, height: 120, rx: 10, fill: '#e0393e' }, chair)
  const karim = makePerson(L.mid, KARIM)
  // Les enfants dans l'eau (bustes), puis l'eau par-dessus.
  const kids = KIDS.map((k) => makePerson(L.actor, k))
  const water = svg('g', {}, L.front)
  svg('rect', { x: -400, y: 1460, width: W + 800, height: 900, fill: '#2fa6d8' }, water)
  svg('rect', { x: -400, y: 1460, width: W + 800, height: 26, fill: '#7fd6f2' }, water)
  const waves = []
  for (let k = 0; k < 9; k++) waves.push(svg('path', { fill: 'none', stroke: '#bff0ff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.75 }, water))
  // La ligne d'eau.
  const rope = svg('g', {}, water)
  for (let x = -380; x < W + 400; x += 44) svg('circle', { cx: x, cy: 1700, r: 16, fill: Math.floor(x / 44) % 2 ? '#ffffff' : '#e5484d', stroke: '#10121a', 'stroke-width': 3 }, rope)
  const splash = svg('g', {}, L.fx)
  const drops = Array.from({ length: 14 }, () => svg('circle', { r: 9, fill: '#e6fbff' }, splash))
  return { karim, kids, waves, rope, drops }
}

// 1 · La piscine : les enfants dans l'eau, et lui au bord.
const EMEUTE = scene('emeute', (L) => {
  bg(L, 'url(#sunset)')
  return bassin(L)
})

// 2 · La caméra de l'entrée : la porte de service.
const VIDEO = scene('video', (L) => {
  bg(L, 'url(#cctv)')
  // Le mur de la piscine, l'enseigne, la caisse et la porte de service.
  svg('rect', { x: -400, y: 300, width: W + 800, height: 1000, fill: '#d8cfc0' }, L.far)
  for (let y = 320; y < 1300; y += 50) for (let x = -400 + ((y / 50) % 2) * 50; x < W + 400; x += 100) svg('rect', { x, y, width: 96, height: 46, fill: '#cfc4b2' }, L.far)
  const sign = svg('g', { transform: 'translate(540 420)' }, L.far)
  svg('rect', { x: -360, y: -60, width: 720, height: 110, rx: 18, fill: '#2f7dd1' }, sign)
  txt(sign, 'PISCINE MUNICIPALE', { x: 0, y: 18, 'font-size': 56, fill: '#ffffff' })
  const caisse = svg('g', { transform: 'translate(220 860)' }, L.far)
  svg('rect', { x: -150, y: -200, width: 300, height: 400, rx: 14, fill: '#7a8aa0', stroke: '#4a5568', 'stroke-width': 6 }, caisse)
  svg('rect', { x: -110, y: -160, width: 220, height: 150, fill: '#bfe3ff' }, caisse)
  txt(caisse, 'CAISSE · 4 €', { x: 0, y: 60, 'font-size': 40, fill: '#ffffff' })
  svg('rect', { x: -400, y: 1300, width: W + 800, height: 700, fill: '#8d8794' }, L.far)
  const doorFrame = svg('rect', { x: 640, y: 760, width: 260, height: 540, fill: '#1b1620' }, L.mid)
  const door = svg('g', {}, L.mid)
  svg('rect', { x: 0, y: 0, width: 260, height: 540, fill: '#6a7a8a', stroke: '#3a4554', 'stroke-width': 8 }, door)
  txt(door, 'SERVICE', { x: 130, y: 120, 'font-size': 42, fill: '#ffffff' })
  svg('circle', { cx: 225, cy: 290, r: 12, fill: '#e6c34a' }, door)
  const kids = KIDS.map((k) => makePerson(L.actor, k))
  const karim = makePerson(L.actor, KARIM)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#3f7a52', opacity: 0.22 }, L.fx)
  for (let y = -200; y < H + 200; y += 12) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#000', opacity: 0.18 }, L.fx)
  const ring = svg('circle', { cx: 770, cy: 1030, r: 230, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 1500, 'stroke-dashoffset': 1500 }, L.fx)
  return { door, doorFrame, kids, karim, ring }
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
  const rows = ['KARIM', '38 ANS', 'MAÎTRE-NAGEUR · 15 ANS', '0 ACCIDENT'].map((s, k) => {
    const g = svg('g', {}, card)
    txt(g, s, { x: 0, y: 60 + k * 100, 'font-size': k === 0 ? 76 : 56, fill: k === 3 ? '#12a150' : '#1d2a5c' })
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
  // La piscine appartient à la ville.
  const ville = prop((g) => {
    svg('path', { d: 'M -300 -40 L 0 -230 L 300 -40 Z', fill: '#2850a8', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -260, y: -40, width: 520, height: 260, fill: '#f4efe6', stroke: '#10121a', 'stroke-width': 8 }, g)
    for (const x of [-180, -60, 60, 180]) svg('rect', { x: x - 26, y: 0, width: 52, height: 220, fill: '#d6dbe4', stroke: '#10121a', 'stroke-width': 5 }, g)
    for (const [k, c] of ['#2850a8', '#f4f1ea', '#d63a3a'].entries()) svg('rect', { x: -60 + k * 40, y: -330, width: 40, height: 80, fill: c, stroke: '#10121a', 'stroke-width': 4 }, g)
    svg('rect', { x: -64, y: -330, width: 8, height: 130, fill: '#10121a' }, g)
    txt(g, 'VILLE', { x: 0, y: -80, 'font-size': 54, fill: '#ffffff' })
  })
  // Le thermomètre : 36 °C.
  const thermo = prop((g) => {
    svg('circle', { cx: 170, cy: -150, r: 90, fill: '#ffd43b', stroke: '#10121a', 'stroke-width': 7 }, g)
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      svg('path', { d: `M ${170 + Math.cos(a) * 110} ${-150 + Math.sin(a) * 110} L ${170 + Math.cos(a) * 150} ${-150 + Math.sin(a) * 150}`, stroke: '#ffd43b', 'stroke-width': 14, 'stroke-linecap': 'round' }, g)
    }
    svg('rect', { x: -170, y: -250, width: 80, height: 380, rx: 40, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 7 }, g)
    svg('circle', { cx: -130, cy: 160, r: 70, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 7 }, g)
    g.level = svg('rect', { x: -146, y: -200, width: 32, height: 330, rx: 16, fill: '#e5484d' }, g)
    txt(g, '36 °C', { x: 60, y: 120, 'font-size': 90, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6, 'paint-order': 'stroke' })
  })
  // Les familles qui paient leur ticket.
  const queue = prop((g) => {
    g.people = []
    for (let k = 0; k < 5; k++) {
      const p = svg('g', { transform: `translate(${-300 + k * 150} 0)` }, g)
      svg('circle', { cy: -150, r: 44, fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 6 }, p)
      svg('path', { d: 'M -60 120 L -60 -40 Q -60 -96 0 -96 Q 60 -96 60 -40 L 60 120 Z', fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 6 }, p)
      const tk = svg('g', { transform: 'translate(45 -10) rotate(-12)' }, p)
      svg('rect', { x: -34, y: -22, width: 68, height: 44, rx: 6, fill: '#ffd43b', stroke: '#10121a', 'stroke-width': 4 }, tk)
      txt(tk, '4 €', { x: 0, y: 12, 'font-size': 26, fill: '#10121a' })
      g.people.push(p)
    }
  })
  // Le panneau du canal.
  const canal = prop((g) => {
    svg('rect', { x: -10, y: -40, width: 20, height: 300, fill: '#4a4f5a' }, g)
    svg('rect', { x: -280, y: -240, width: 560, height: 220, rx: 16, fill: '#fbf8f0', stroke: '#e5484d', 'stroke-width': 14 }, g)
    txt(g, 'CANAL', { x: 0, y: -150, 'font-size': 64, fill: '#10121a' })
    txt(g, 'BAIGNADE INTERDITE', { x: 0, y: -70, 'font-size': 44, fill: '#e5484d' })
    for (let k = 0; k < 3; k++) svg('path', { d: `M -320 ${170 + k * 40} q 40 -24 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0`, fill: 'none', stroke: '#2f7dd1', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
  })
  // La bouée : 43 enfants.
  const bouee = prop((g) => buoy(g, 1.6, '43'))
  // La caisse : 9 000 €.
  const register = prop((g) => {
    svg('rect', { x: -220, y: -60, width: 440, height: 200, rx: 20, fill: '#c9ced8', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -170, y: -190, width: 340, height: 120, rx: 14, fill: '#0b0d12', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '9 000 €', { x: 0, y: -108, 'font-size': 66, fill: '#9fe6bf', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
    for (let k = 0; k < 3; k++) {
      const b = svg('g', { transform: `translate(${-120 + k * 120} ${40 + (k % 2) * 10}) rotate(${(k - 1) * 10})` }, g)
      svg('rect', { x: -60, y: -34, width: 120, height: 68, rx: 8, fill: '#7fd19b', stroke: '#1d5a33', 'stroke-width': 5 }, b)
      txt(b, '€', { x: 0, y: 14, 'font-size': 40, fill: '#1d5a33' })
    }
  })
  // L'avis d'impôt.
  const impot = prop((g) => {
    svg('rect', { x: -240, y: -300, width: 480, height: 600, rx: 14, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 7 }, g)
    svg('rect', { x: -240, y: -300, width: 480, height: 110, rx: 14, fill: '#2850a8' }, g)
    txt(g, 'AVIS D’IMPÔT', { x: 0, y: -228, 'font-size': 50, fill: '#ffffff' })
    for (let k = 0; k < 5; k++) svg('rect', { x: -190, y: -140 + k * 56, width: 380 - (k % 2) * 110, height: 18, rx: 9, fill: '#d6dbe4' }, g)
    const st = svg('g', { transform: 'translate(0 200) rotate(-8)' }, g)
    svg('rect', { x: -170, y: -60, width: 340, height: 120, rx: 16, fill: 'none', stroke: '#12a150', 'stroke-width': 10 }, st)
    txt(st, 'PAYÉ', { x: 0, y: 30, 'font-size': 84, fill: '#12a150' })
  })
  // Dix ans de prison.
  const prison = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 20, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '10 ANS', { x: 0, y: 60, 'font-size': 160, fill: '#e5484d' })
    for (let i = 0; i < 6; i++) svg('rect', { x: -270 + i * 104, y: -260, width: 22, height: 520, rx: 11, fill: 'url(#bar)' }, g)
  })
  // La photo des enfants (fin).
  const photo = prop((g) => {
    svg('rect', { x: -260, y: -230, width: 520, height: 470, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -230, y: -200, width: 460, height: 320, fill: '#7fd6f2' }, g)
    const cl = svg('clipPath', { id: 'kidsClip' }, defs)
    svg('rect', { x: -230, y: -200, width: 460, height: 320 }, cl)
    const inner = svg('g', { 'clip-path': 'url(#kidsClip)' }, g)
    g.kids = KIDS.map((k) => makePerson(inner, k))
    g.water = svg('rect', { x: -230, y: 40, width: 460, height: 80, fill: '#2fa6d8' }, inner)
    txt(g, 'L’ÉTÉ DERNIER', { x: 0, y: 190, 'font-size': 46, fill: '#1d2a5c' })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, ville, thermo, queue, canal, bouee, register, impot, prison, photo }
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
txt(rec, 'REC · CAM 01 · ENTRÉE', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
const T_CONSOLE = Wd('02', 'referme') - 0.05
const fmtE = (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €'
tag('PENDANT 2 ÉTÉS', 'pill red', { t0: 0, t1: Wd('01', 'gratuitement') - 0.15, y: 250, rot: -2 })
fs(tag('GRATUIT', 'stamp', { t0: Wd('01', 'gratuitement') - 0.05, t1: Wd('01', 'tous') - 0.1, y: 470, rot: -8, from: 2.8, dur: 0.2 }), 130)
tag('TOUS LES SOIRS', 'pill', { t0: Wd('01', 'tous') - 0.1, t1: Wd('01', 'neuf') - 0.1, y: 250, rot: -2 })
counterTag(Wd('01', 'neuf') - 0.1, SEC.emeute.t1, 9000, 'D’ENTRÉES', { fmt: fmtE, y: 300 })
tag('PORTE DE SERVICE', 'pill', { t0: Wd('02', 'porte') - 0.1, t1: T_CONSOLE - 0.05, y: 330, rot: -2 })
fs(tag('ET IL REFERME', 'slam white', { t0: T_CONSOLE, t1: SEC.video.t1, y: 330, rot: -3, from: 2.4, dur: 0.2 }), 84)
fs(tag('JUGÉ', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
tag('PROPRIÉTÉ DE LA VILLE', 'pill red', { t0: Wd('04', 'ville') - 0.1, t1: Wd('04', 'il') - 0.1, y: 230, rot: -2 })
fs(tag('COMME CHEZ LUI.', 'slam white', { t0: Wd('04', 'chez') - 0.06, t1: E('04') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 96)
tag('À 800 M', 'pill', { t0: Wd('05', 'huit') - 0.1, t1: Wd('05', 'quatre') - 0.1, y: 230, rot: -2 })
fs(tag('4 € / ENFANT / JOUR', 'slam yellow', { t0: Wd('05', 'quatre') - 0.06, t1: E('05') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 78)
fs(tag('POURQUOI EUX ?', 'slam white', { t0: Wd('06', 'pourquoi') - 0.06, t1: E('06') + 0.1, y: 260, rot: -3, from: 2.4, dur: 0.2 }), 100)
tag('IL AVAIT 9 ANS', 'pill', { t0: Wd('07', 'avait') - 0.1, t1: E('07') + 0.15, y: 240, rot: -2 })
fs(tag('PAS À LUI DE DÉCIDER.', 'slam white', { t0: Wd('08', 'decider') - 0.06, t1: E('08') + 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 80)
fs(tag('QUI NE SE NOIE PAS.', 'slam yellow', { t0: Wd('09', 'noie') - 0.06, t1: Wd('09', 'en') - 0.1, y: 260, rot: -3, from: 2.4, dur: 0.2 }), 84)
counterTag(Wd('09', 'quarantetrois') - 0.1, E('09') + 0.1, 43, 'ENFANTS', { y: 230, dur: 0.6 })
tag('ARGENT PUBLIC', 'pill red', { t0: Wd('10', 'public') - 0.1, t1: E('10') + 0.1, y: 240, rot: -2 })
fs(tag('ILS SONT LA VILLE.', 'slam yellow', { t0: Wd('11', 'ville') - 0.06, t1: Wd('11', 'et') - 0.1, y: 240, rot: -3, from: 2.4, dur: 0.2 }), 84)
fs(tag('LA LOI.', 'slam white', { t0: Wd('12', 'loi') - 0.06, t1: E('12') + 0.1, y: 270, rot: -3, from: 2.6, dur: 0.2 }), 150)
tag('43 ENFANTS QUI NAGENT', 'pill yellow', { t0: Wd('13', 'quarantetrois') - 0.1, t1: Wd('13', 'coupable') - 0.1, y: 250, rot: -2 })
fs(tag('COUPABLE.', 'slam yellow', { t0: Wd('13', 'coupable') - 0.06, t1: E('13') + 0.15, y: 260, rot: -3, from: 3, dur: 0.2 }), 150)
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

const IMPACTS = [
  [0.05, 10],
  [Wd('01', 'gratuitement') - 0.05, 14],
  [Wd('01', 'neuf') - 0.1, 10],
  [T_CONSOLE, 14],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'chez') - 0.06, 10],
  [Wd('05', 'quatre') - 0.06, 10],
  [Wd('06', 'pourquoi') - 0.06, 10],
  [Wd('08', 'decider') - 0.06, 12],
  [Wd('09', 'noie') - 0.06, 14],
  [Wd('10', 'public') - 0.06, 10],
  [Wd('11', 'ville') - 0.06, 12],
  [Wd('12', 'loi') - 0.06, 14],
  [Wd('13', 'coupable') - 0.06, 16],
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

  // La caisse (scènes 1 et 2) : Léa, le tapis, le laser rouge, le total figé.
  // La piscine : Karim au bord, les enfants qui barbotent, les vagues.
  if (cur === EMEUTE) {
    const dive = prog(t, Wd('01', 'gratuitement') - 0.3, 0.9, ease.io3)
    cam(EMEUTE, t, { zoom: lerp(1.0, 1.16, dive), cx: lerp(560, 620, dive), cy: lerp(1100, 1080, dive), push: 0.02, hand: 3 })
    EMEUTE.karim.update(t, { x: 760, y: 1120, scale: 0.95, brows: 'neutral', look: [-0.5, 0.3], armR: [0.25, 1.0], armL: [0.2, 1.1], seed: 1.1, mouth: 0.15 + 0.1 * Math.sin(t * 2) })
    const kx = [190, 400, 590]
    EMEUTE.kids.forEach((k, i) => k.update(t, { x: kx[i], y: 1470 + 14 * Math.sin(t * 3 + i * 2), scale: 0.56, brows: 'neutral', mouth: 0.5 + 0.4 * Math.sin(t * 5 + i), look: [0.4, -0.2], armR: [0.3 + 0.5 * Math.abs(Math.sin(t * 4 + i)), 0.2], armL: [0.3 + 0.5 * Math.abs(Math.sin(t * 4 + i + 1)), 0.2], seed: 2 + i }))
    EMEUTE.waves.forEach((w, k) => {
      const y = 1520 + k * 55
      const ph = t * 2.2 + k
      let d = `M -400 ${y}`
      for (let x = -400; x < W + 400; x += 80) d += ` q 40 ${-16 * Math.sin(ph + x * 0.01)} 80 0`
      w.setAttribute('d', d)
    })
    EMEUTE.rope.setAttribute('transform', `translate(0 ${6 * Math.sin(t * 2)})`)
    EMEUTE.drops.forEach((dr, k) => {
      const i = k % 3
      const u = ((t * 1.3 + k * 0.37) % 1)
      const ang = -Math.PI / 2 + (((k * 1.7) % 1) - 0.5) * 2.2
      dr.setAttribute('cx', kx[i] + Math.cos(ang) * 160 * u)
      dr.setAttribute('cy', 1490 + Math.sin(ang) * 260 * u + 380 * u * u)
      dr.setAttribute('opacity', (1 - u).toFixed(2))
    })
  }
  if (cur === VIDEO) {
    // Caméra fixe ; arrêt sur image quand il referme la porte.
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    const zoomC = frozen ? 1 + 0.2 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 1
    cam(VIDEO, tt, { zoom: 1.05 * zoomC, cx: frozen ? 760 : 640, cy: frozen ? 1030 : 1000, push: 0.008, hand: 0 })
    const open = prog(tt, Wd('02', 'ouvre') - 0.1, 0.5, ease.io3) * (1 - prog(tt, Wd('02', 'referme') - 0.25, 0.3, ease.in3))
    VIDEO.door.setAttribute('transform', `translate(640 760) scale(${(1 - 0.85 * open).toFixed(3)} 1)`)
    VIDEO.karim.update(tt, { x: 960, y: 1110, scale: 0.9, brows: 'neutral', look: [-0.7, 0.2], armR: [0.3 + 0.6 * open, 0.9 - 0.4 * open], armL: [0.2, 1.1], seed: 1.4 })
    VIDEO.kids.forEach((kd, i) => {
      const t0 = Wd('02', 'enfants') - 0.3 + i * 0.35
      const u = clamp((tt - t0) / 1.1)
      const x = lerp(-120, 760, ease.io3(u))
      const gone = u >= 1
      show(kd.root, !gone && tt > t0 - 0.6)
      kd.update(tt, { x, y: 1300 + 8 * Math.abs(Math.sin(tt * 9 + i)), scale: 0.48, brows: 'neutral', look: [0.6, 0], mouth: 0.3, armR: [0.2, 0.8], armL: [0.2, 0.8], seed: 3 + i })
    })
    VIDEO.ring.setAttribute('stroke-dashoffset', 1500 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `19:00:${String(4 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['karim', 'trente', 'maitre', 'aucun']
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
      brows: isProc ? (['08', '10', '12'].includes(id) ? 'angry' : 'determined') : ['07', '13'].includes(id) ? 'sad' : ['11'].includes(id) ? 'determined' : 'neutral',
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
    prop(TRIB.ville, id === '04', Wd('04', 'piscine') - 0.15, E('04') + 0.05, 540, 560, 0.75)
    if (prop(TRIB.thermo, id === '05', Wd('05', 'trentesix') - 0.2, E('05') + 0.05, 540, 580, 0.75) > 0) {
      const lv = ease.out3(prog(t, Wd('05', 'trentesix') - 0.1, 0.7))
      TRIB.thermo.level.setAttribute('y', String(130 - 330 * lv))
      TRIB.thermo.level.setAttribute('height', String(Math.max(32, 330 * lv)))
    }
    if (prop(TRIB.queue, id === '06', Wd('06', 'dautres') - 0.15, E('06') + 0.05, 540, 600, 0.7) > 0) {
      TRIB.queue.people.forEach((p, k) => p.setAttribute('opacity', t > Wd('06', 'dautres') - 0.1 + k * 0.1 ? 1 : 0))
    }
    prop(TRIB.canal, id === '07', Wd('07', 'canal') - 0.2, E('07') + 0.1, 540, 600, 0.75)
    if (prop(TRIB.bouee, id === '09', Wd('09', 'appris') - 0.2, E('09') + 0.05, 540, 600, 0.75) > 0) TRIB.bouee.setAttribute('transform', TRIB.bouee.getAttribute('transform') + ` rotate(${8 * Math.sin(t * 3)})`)
    prop(TRIB.register, id === '10', Wd('10', 'neuf') - 0.15, E('10') + 0.05, 540, 560, 0.8)
    prop(TRIB.impot, id === '11', Wd('11', 'impots') - 0.2, E('11') + 0.05, 540, 580, 0.72, -3)
    prop(TRIB.prison, id === '12', Wd('12', 'dix') - 0.15, E('12') + 0.05, 540, 560, 0.62)
    if (prop(TRIB.photo, id === '13', Wd('13', 'quarantetrois') - 0.15, E('13') + 0.05, 540, 540, 0.72, 4) > 0) {
      TRIB.photo.kids.forEach((k, i) => k.update(t, { x: -140 + i * 140, y: 70 + 8 * Math.sin(t * 3 + i), scale: 0.4, brows: 'neutral', mouth: 0.6, look: [0, 0], armR: [0.6, 0.3], armL: [0.6, 0.3], seed: 4 + i }))
    }
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
