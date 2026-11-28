/**
 * ============================================================================
 *  « Affaire Classée ? » — la propriétaire (≈ 80 s, 1080 × 1920)
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
grad('snow', [[0, '#0e1a33'], [0.7, '#22345c'], [1, '#3a4f7a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('palier', [[0, '#d9c9a8'], [1, '#a8936c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('warmRoom', [[0, '#5a3a2a'], [1, '#2a1a14']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lamp', [[0, '#fff1b8', 0.9], [0.5, '#ffd166', 0.35], [1, '#ffd166', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
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
const MARTINE = { robe: '#b0705a', jabot: false, collar: '#f4f1ea', hair: 'bun', hairColor: '#e8e6e2', female: true, skin: '#f2c8aa', iris: '#3b5b8a' }
const MARTINE_BOX = { robe: '#6b7280', jabot: false, collar: '#e5e7eb', hair: 'bun', hairColor: '#e8e6e2', female: true, skin: '#f2c8aa', iris: '#3b5b8a' }
const SERRURIER = { robe: '#2b3a55', jabot: false, collar: '#ffd166', hair: 'cap', hairColor: '#2b2b2b', cap: '#e5484d', skin: '#d9a07a', iris: '#2b1d12' }
// Le palier : mur, porte de l'appartement, cartons et jouets.
function palier(L) {
  bg(L, 'url(#palier)')
  svg('rect', { x: -400, y: 1350, width: W + 800, height: 1200, fill: '#7a5a3a' }, L.far)
  for (let i = 0; i < 12; i++) svg('rect', { x: -400 + i * 140, y: 1350, width: 6, height: 1200, fill: '#5a4026' }, L.far)
  const door = svg('g', { transform: 'translate(640 1350)' }, L.far)
  svg('rect', { x: -190, y: -720, width: 380, height: 720, fill: '#2a1a10' }, door)
  const leaf = svg('g', {}, door)
  svg('rect', { x: -180, y: -710, width: 360, height: 710, fill: '#7a2e2e', stroke: '#10121a', 'stroke-width': 8 }, leaf)
  for (const y of [-640, -330]) svg('rect', { x: -130, y, width: 260, height: 240, rx: 8, fill: 'none', stroke: '#5a1e1e', 'stroke-width': 8 }, leaf)
  const lock = svg('g', { transform: 'translate(120 -360)' }, leaf)
  svg('rect', { x: -22, y: -60, width: 44, height: 120, rx: 10, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, lock)
  svg('circle', { r: 12, fill: '#10121a' }, lock)
  const shine = svg('circle', { cx: 120, cy: -360, r: 90, fill: 'url(#fireGlow)', opacity: 0.6 }, leaf)
  txt(door, 'APPT 3B', { x: 0, y: -760, 'font-size': 40, fill: '#5a4026' })
  // Les affaires des locataires sur le palier.
  const cartons = svg('g', {}, L.mid)
  for (const [x, y, w, h] of [[120, 1330, 200, 160], [260, 1290, 160, 200], [900, 1340, 220, 150], [960, 1210, 160, 130]]) {
    svg('rect', { x: x - w / 2, y: y - h, width: w, height: h, fill: '#c9a26a', stroke: '#6a4a20', 'stroke-width': 6 }, cartons)
    svg('path', { d: `M ${x - w / 2} ${y - h + 30} L ${x + w / 2} ${y - h + 30}`, stroke: '#6a4a20', 'stroke-width': 5 }, cartons)
  }
  const jouets = svg('g', {}, L.mid)
  // Un ours en peluche et un ballon.
  const ours = svg('g', { transform: 'translate(330 1380)' }, jouets)
  for (const [cx, cy, r] of [[0, 0, 60], [0, -80, 44], [-34, -116, 18], [34, -116, 18]]) svg('circle', { cx, cy, r, fill: '#b9814a', stroke: '#6a4020', 'stroke-width': 5 }, ours)
  svg('circle', { cx: -14, cy: -86, r: 6, fill: '#10121a' }, ours)
  svg('circle', { cx: 14, cy: -86, r: 6, fill: '#10121a' }, ours)
  const ballon = svg('g', { transform: 'translate(860 1400)' }, jouets)
  svg('circle', { r: 50, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 5 }, ballon)
  svg('path', { d: 'M -50 0 Q 0 -30 50 0 M 0 -50 Q 20 0 0 50', stroke: '#fbf8f0', 'stroke-width': 8, fill: 'none' }, ballon)
  return { leaf, lock, shine, cartons, jouets }
}

// La nouvelle clé, brillante.
function newKey(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('circle', { cy: -90, r: 48, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 7 }, g)
  svg('circle', { cy: -90, r: 18, fill: '#10121a' }, g)
  svg('rect', { x: -12, y: -46, width: 24, height: 160, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 7 }, g)
  svg('rect', { x: 10, y: 60, width: 34, height: 18, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 6 }, g)
  svg('rect', { x: 10, y: 92, width: 26, height: 16, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 6 }, g)
  return g
}
// Le trousseau de clés.
function keys(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('circle', { r: 70, fill: 'none', stroke: '#c9ced8', 'stroke-width': 16 }, g)
  for (const [a, c] of [[-0.5, '#ffd166'], [0.3, '#c9ced8'], [1.1, '#e8b04a']]) {
    const k = svg('g', { transform: `rotate(${a * 57}) translate(0 70)` }, g)
    svg('circle', { cy: 40, r: 34, fill: c, stroke: '#10121a', 'stroke-width': 6 }, k)
    svg('rect', { x: -10, y: 70, width: 20, height: 150, fill: c, stroke: '#10121a', 'stroke-width': 6 }, k)
    svg('rect', { x: 10, y: 170, width: 30, height: 16, fill: c, stroke: '#10121a', 'stroke-width': 5 }, k)
    svg('rect', { x: 10, y: 200, width: 22, height: 14, fill: c, stroke: '#10121a', 'stroke-width': 5 }, k)
  }
  return g
}

// Le rapport d'intervention : « COUPURE EFFECTUÉE », coché, signé.
function report(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('rect', { x: -230, y: -300, width: 460, height: 600, rx: 14, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 7 }, g)
  svg('rect', { x: -90, y: -330, width: 180, height: 60, rx: 12, fill: '#8a93a6', stroke: '#10121a', 'stroke-width': 6 }, g)
  txt(g, 'RAPPORT', { x: 0, y: -210, 'font-size': 46, fill: '#1d2a5c' })
  txt(g, "D'INTERVENTION", { x: 0, y: -160, 'font-size': 34, fill: '#1d2a5c' })
  for (let l = 0; l < 3; l++) svg('rect', { x: -180, y: -110 + l * 40, width: 360, height: 10, fill: '#d6dbe4' }, g)
  svg('rect', { x: -180, y: 30, width: 50, height: 50, fill: '#fff', stroke: '#10121a', 'stroke-width': 5 }, g)
  svg('path', { d: 'M -172 52 L -158 70 L -134 34', stroke: '#e5484d', 'stroke-width': 9, fill: 'none', 'stroke-linecap': 'round' }, g)
  txt(g, 'COUPURE', { x: -110, y: 50, 'font-size': 32, fill: '#10121a', 'text-anchor': 'start' })
  txt(g, 'EFFECTUÉE', { x: -110, y: 86, 'font-size': 32, fill: '#10121a', 'text-anchor': 'start' })
  svg('path', { d: 'M -150 220 q 30 -50 60 0 t 60 -10 t 60 10 t 50 -20', stroke: '#1d4fd1', 'stroke-width': 6, fill: 'none' }, g)
  txt(g, 'Signature', { x: -100, y: 260, 'font-size': 24, fill: '#5a6478' })
  return g
}

// 1 · Le palier : Jeannine, de face, sa nouvelle clé à la main.
const EMEUTE = scene('emeute', (L) => {
  const P = palier(L)
  const smith = makePerson(L.actor, SERRURIER)
  const tech = makePerson(L.actor, MARTINE)
  const key = svg('g', {}, L.front)
  newKey(key, 1)
  return { ...P, smith, tech, key }
})

// 2 · La vidéo du voisin, filmée au téléphone.
const VIDEO = scene('video', (L) => {
  const P = palier(L)
  const smith = makePerson(L.actor, SERRURIER)
  const her = makePerson(L.actor, MARTINE)
  const ring = svg('circle', { r: 190, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 1300, 'stroke-dashoffset': 1300 }, L.fx)
  return { ...P, smith, her, ring }
})

// 3 · Sa fiche : la photo, les mentions, puis « JUGÉE ».
const FICHE = scene('fiche', (L) => {
  bg(L, '#0b0d14')
  svg('circle', { cx: 540, cy: 900, r: 820, fill: '#232a40', opacity: 0.7 }, L.far)
  const card = svg('g', {}, L.mid)
  svg('rect', { x: -420, y: -560, width: 840, height: 1120, rx: 30, fill: '#fbf8f0' }, card)
  svg('rect', { x: -420, y: -560, width: 840, height: 120, rx: 30, fill: '#1d2a5c' }, card)
  txt(card, 'FICHE · PRÉVENUE', { x: 0, y: -480, 'font-size': 48, fill: '#fff' })
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16, fill: '#c9d6e8' }, card)
  const photo = svg('g', { 'clip-path': 'url(#photoClip)' }, card)
  const clip = svg('clipPath', { id: 'photoClip' }, defs)
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16 }, clip)
  const ines = makePerson(photo, MARTINE)
  const rows = ['JEANNINE', '74 ANS · VEUVE', 'RETRAITE : 900 €', 'LOYER : 0 € DEPUIS 14 MOIS'].map((s, k) => {
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
  // Le Code civil.
  const code = prop((g) => {
    svg('rect', { x: -220, y: -300, width: 440, height: 600, rx: 20, fill: '#c43a2f', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -220, y: -300, width: 50, height: 600, fill: '#8a2620' }, g)
    txt(g, 'CODE', { x: 30, y: -80, 'font-size': 80, fill: '#ffd166' })
    txt(g, 'PÉNAL', { x: 30, y: 10, 'font-size': 70, fill: '#ffd166' })
    txt(g, 'Art. 226-4-2', { x: 30, y: 120, 'font-size': 34, fill: '#fbf8f0' })
  })
  // Procédure, huissier, jugement.
  const papiers = prop((g) => {
    g.sheets = ['PROCÉDURE', 'HUISSIER', 'JUGEMENT'].map((t, k) => {
      const h = svg('g', { transform: `translate(${-260 + k * 260} ${k === 1 ? -20 : 0}) rotate(${(k - 1) * 7})` }, g)
      svg('rect', { x: -120, y: -170, width: 240, height: 340, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, h)
      txt(h, t, { x: 0, y: -100, 'font-size': 30, fill: '#1d2a5c' })
      for (let l = 0; l < 5; l++) svg('rect', { x: -90, y: -60 + l * 36, width: 180, height: 8, fill: '#c7cbd4' }, h)
      svg('circle', { cy: 120, r: 36, fill: 'none', stroke: '#e5484d', 'stroke-width': 6 }, h)
      return h
    })
    g.none = svg('g', { transform: 'translate(0 260) rotate(-6)' }, g)
    svg('rect', { x: -300, y: -50, width: 600, height: 100, rx: 12, fill: '#fbf8f0', stroke: '#e5484d', 'stroke-width': 10 }, g.none)
    txt(g.none, 'EXPULSION : JAMAIS', { x: 0, y: 24, 'font-size': 56, fill: '#e5484d' })
  })
  // La file : un client, puis d'autres qui suivent.
  const queue = prop((g) => {
    g.people = []
    for (let k = 0; k < 6; k++) {
      const p = svg('g', { transform: `translate(${-375 + k * 150} 0) scale(${k === 0 ? 1.15 : 1})` }, g)
      svg('circle', { cy: -150, r: 44, fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 6 }, p)
      svg('path', { d: 'M -60 120 L -60 -40 Q -60 -96 0 -96 Q 60 -96 60 -40 L 60 120 Z', fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 6 }, p)
      g.people.push(p)
    }
  })
  // Février, deux enfants.
  const froid = prop((g) => {
    svg('rect', { x: -380, y: -230, width: 320, height: 360, rx: 18, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -380, y: -230, width: 320, height: 90, rx: 18, fill: '#3b82f6' }, g)
    txt(g, 'FÉVRIER', { x: -220, y: -170, 'font-size': 44, fill: '#fff' })
    txt(g, '-3 °C', { x: -220, y: 20, 'font-size': 80, fill: '#3b82f6' })
    for (const [x, s] of [[130, 1.0], [290, 0.75]]) {
      const k = svg('g', { transform: `translate(${x} 120) scale(${s})` }, g)
      svg('circle', { cy: -190, r: 60, fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 7 }, k)
      svg('path', { d: 'M -80 130 L -80 -70 Q -80 -120 0 -120 Q 80 -120 80 -70 L 80 130 Z', fill: '#c7cbd4', stroke: '#10121a', 'stroke-width': 7 }, k)
    }
    g.ages = []
  })
  // La voiture neuve.
  const voiture = prop((g) => {
    svg('path', { d: 'M -330 60 L -330 -20 Q -320 -60 -260 -70 L -170 -150 L 150 -150 L 240 -70 L 310 -60 Q 340 -50 340 0 L 340 60 Z', fill: '#e5484d', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('path', { d: 'M -150 -130 L 130 -130 L 200 -75 L -220 -75 Z', fill: '#cfe8ff', stroke: '#10121a', 'stroke-width': 6 }, g)
    for (const x of [-200, 210]) svg('circle', { cx: x, cy: 60, r: 62, fill: '#10121a' }, g)
    g.sparks = [[-260, -180], [280, -170], [0, -220]].map(([x, y]) => svg('path', { d: `M ${x} ${y - 30} L ${x + 8} ${y - 8} L ${x + 30} ${y} L ${x + 8} ${y + 8} L ${x} ${y + 30} L ${x - 8} ${y + 8} L ${x - 30} ${y} L ${x - 8} ${y - 8} Z`, fill: '#ffd166' }, g))
    txt(g, 'NEUVE', { x: 0, y: 180, 'font-size': 56, fill: '#ffd166' })
  })
  // L'alliance vendue.
  const alliance = prop((g) => {
    svg('ellipse', { rx: 170, ry: 150, fill: 'none', stroke: '#ffd166', 'stroke-width': 48 }, g)
    svg('ellipse', { rx: 170, ry: 150, fill: 'none', stroke: '#b8860b', 'stroke-width': 8 }, g)
    g.tag = svg('g', { transform: 'translate(200 140) rotate(12)' }, g)
    svg('rect', { x: -120, y: -40, width: 240, height: 80, rx: 12, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, g.tag)
    txt(g.tag, 'VENDUE', { x: 0, y: 18, 'font-size': 48, fill: '#e5484d' })
  })
  // Des maisons et des locataires.
  const maisons = prop((g) => {
    for (let k = 0; k < 5; k++) {
      const h = svg('g', { transform: `translate(${-340 + k * 170} 0)` }, g)
      svg('path', { d: 'M -70 0 L 0 -60 L 70 0 Z', fill: '#c43a2f', stroke: '#10121a', 'stroke-width': 5 }, h)
      svg('rect', { x: -58, y: 0, width: 116, height: 100, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 5 }, h)
      svg('rect', { x: -16, y: 40, width: 32, height: 60, fill: '#7a2e2e' }, h)
    }
  })
  // La balance déséquilibrée.
  const balance = prop((g) => {
    svg('rect', { x: -12, y: -260, width: 24, height: 380, fill: '#c9a24a', stroke: '#10121a', 'stroke-width': 5 }, g)
    svg('rect', { x: -120, y: 120, width: 240, height: 30, rx: 10, fill: '#c9a24a', stroke: '#10121a', 'stroke-width': 5 }, g)
    g.beam = svg('g', { transform: 'translate(0 -240)' }, g)
    svg('rect', { x: -300, y: -10, width: 600, height: 20, rx: 10, fill: '#c9a24a', stroke: '#10121a', 'stroke-width': 5 }, g.beam)
    for (const [x, t] of [[-280, 'LA LOI'], [280, 'JEANNINE']]) {
      const p = svg('g', { transform: `translate(${x} 0)` }, g.beam)
      svg('path', { d: 'M 0 0 L -80 140 M 0 0 L 80 140', stroke: '#10121a', 'stroke-width': 4 }, p)
      svg('path', { d: 'M -100 140 Q 0 200 100 140 Z', fill: '#c9a24a', stroke: '#10121a', 'stroke-width': 5 }, p)
      txt(p, t, { x: 0, y: 250, 'font-size': 36, fill: '#fbf8f0' })
    }
  })
  // Trois ans de prison.
  const prison = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 20, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '3 ANS', { x: 0, y: 60, 'font-size': 170, fill: '#e5484d' })
    for (let i = 0; i < 6; i++) svg('rect', { x: -270 + i * 104, y: -260, width: 22, height: 520, rx: 11, fill: 'url(#bar)' }, g)
  })
  // Les poches retournées.
  const pockets = prop((g) => {
    for (const s of [-1, 1]) {
      const p = svg('g', { transform: `translate(${s * 170} 0) scale(${s} 1)` }, g)
      svg('path', { d: 'M -90 -120 L 90 -120 L 70 60 Q 0 140 -70 60 Z', fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, p)
      svg('path', { d: 'M -90 -120 L 90 -120', stroke: '#10121a', 'stroke-width': 14 }, p)
    }
    txt(g, '0,00 €', { x: 0, y: 230, 'font-size': 84, fill: '#ffd166', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, code, papiers, froid, voiture, alliance, maisons, balance, prison, pockets }
})

// 5 · Le vote : elle, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, MARTINE_BOX)
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
txt(rec, 'VIDÉO DU VOISIN', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
tag('74 ANS', 'pill yellow', { t0: 0, t1: Wd('01', 'ses') - 0.15, y: 250, rot: -2 })
tag('SES PROPRES SERRURES', 'pill', { t0: 0.3, t1: Wd('01', 'ses') - 0.15, y: 340, rot: 2 })
fs(tag('14 MOIS SANS LOYER', 'stamp', { t0: Wd('01', 'quatorze') - 0.05, t1: Wd('01', 'dix') - 0.1, y: 280, rot: -6, from: 2.8, dur: 0.2 }), 88)
counterTag(Wd('01', 'dix') - 0.1, SEC.emeute.t1, 18000, 'IMPAYÉS', { fmt: (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €', y: 300 })
const LOOT_T = { affaires: Wd('02', 'affaires') - 0.1, jouets: Wd('02', 'jouets') - 0.1, porte: Wd('02', 'porte') - 0.1 }
tag('UN SERRURIER', 'pill', { t0: Wd('02', 'serrurier') - 0.1, t1: LOOT_T.affaires, y: 300, rot: -2 })
tag('LES JOUETS DES ENFANTS', 'pill red', { t0: LOOT_T.jouets, t1: LOOT_T.porte, y: 300, rot: -2 })
fs(tag('LA PORTE SE REFERME', 'slam white', { t0: LOOT_T.porte, t1: SEC.video.t1, y: 320, rot: -3, from: 2.4, dur: 0.2 }), 84)
fs(tag('JUGÉE', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
fs(tag('ON N’EXPULSE PAS SOI-MÊME', 'slam white', { t0: Wd('04', 'nexpulse') - 0.06, t1: E('04') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 72)
tag('2 ANS DE PROCÉDURE', 'pill yellow', { t0: Wd('05', 'deux') - 0.1, t1: E('05') + 0.1, y: 230, rot: -2 })
tag('2 ENFANTS', 'pill red', { t0: Wd('06', 'enfants') - 0.1, t1: E('06') + 0.1, y: 230, rot: -2 })
fs(tag('À LA RUE.', 'slam white', { t0: Wd('06', 'rue') - 0.06, t1: E('06') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 120)
fs(tag('IL SAVAIT.', 'slam yellow', { t0: Wd('07', 'savait') - 0.06, t1: E('07') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 120)
fs(tag('ELLE L’A VIOLÉE.', 'slam white', { t0: Wd('08', 'violee') - 0.06, t1: E('08') + 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 110)
tag('14 MOIS SANS LOYER', 'pill', { t0: Wd('09', 'quatorze') - 0.1, t1: Wd('09', 'elle', 1) - 0.1, y: 230, rot: -2 })
fs(tag('SON ALLIANCE', 'slam yellow', { t0: Wd('09', 'alliance') - 0.06, t1: E('09') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 110)
fs(tag('PLUS AUCUN LOCATAIRE PROTÉGÉ', 'slam white', { t0: Wd('10', 'plus') - 0.06, t1: E('10') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 64)
fs(tag('SEULE FACE À LA LOI', 'slam yellow', { t0: Wd('11', 'seule', 1) - 0.06, t1: E('11') + 0.1, y: 860, rot: -2, from: 2.4, dur: 0.2 }), 84)
fs(tag('3 ANS DE PRISON', 'slam white', { t0: Wd('12', 'trois') - 0.06, t1: E('12') + 0.1, y: 380, rot: -2, from: 2.4, dur: 0.2 }), 100)
tag('SA PROPRE MAISON', 'pill', { t0: Wd('13', 'propre') - 0.1, t1: Wd('13', 'qui') - 0.1, y: 300, rot: -2 })
fs(tag('QUI PROTÈGE JEANNINE ?', 'slam yellow', { t0: Wd('13', 'qui') - 0.06, t1: E('13') + 0.15, y: 380, rot: -3, from: 3, dur: 0.2 }), 84)
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

const T_CONSOLE = Wd('02', 'referme') + 0.2
const IMPACTS = [
  [0.05, 10],
  [Wd('01', 'quatorze') - 0.05, 14],
  [Wd('01', 'dix') - 0.1, 10],
  [T_CONSOLE, 12],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'nexpulse') - 0.06, 10],
  [Wd('06', 'rue') - 0.06, 12],
  [Wd('07', 'savait') - 0.06, 10],
  [Wd('08', 'violee') - 0.06, 12],
  [Wd('09', 'alliance') - 0.06, 12],
  [Wd('11', 'seule', 1) - 0.06, 10],
  [Wd('12', 'trois') - 0.06, 14],
  [Wd('13', 'qui') - 0.06, 16],
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
    // Jeannine au premier plan, la clé levée ; la caméra pousse sur « quatorze mois ».
    const dive = prog(t, Wd('01', 'quatorze') - 0.3, 0.8, ease.io3)
    cam(EMEUTE, t, { zoom: lerp(1.1, 1.28, dive), cx: lerp(500, 420, dive), cy: lerp(1120, 1060, dive), push: 0.015, hand: 2 })
    EMEUTE.smith.update(t, { x: 820, y: 1560, scale: 0.85, brows: 'neutral', look: [-0.5, 0], armR: [0.7, 0.4], armL: [0.3, 0.8], seed: 3.1 })
    EMEUTE.tech.update(t, { x: 360, y: 1470, scale: 1.2, brows: 'determined', look: [0.2, 0], armR: [0.85, 0.3], armL: [0.2, 1.0], seed: 1.3, headTilt: 0.03 * Math.sin(t * 1.2) })
    place(EMEUTE.key, 600, 1060 + 10 * Math.sin(t * 3), 0.9, -18 + 6 * Math.sin(t * 2))
    EMEUTE.shine.setAttribute('opacity', 0.4 + 0.3 * Math.sin(t * 4))
  }
  if (cur === VIDEO) {
    // Le téléphone du voisin : le serrurier à la porte, Jeannine sort les affaires, la porte se referme.
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    cam(VIDEO, tt, { zoom: frozen ? 1.25 : 1.12, cx: frozen ? 600 : 560, cy: 1100, push: 0.008, hand: frozen ? 0 : 7, rot: frozen ? 0 : 0.6 * Math.sin(tt * 1.7) })
    VIDEO.smith.update(tt, { x: 820, y: 1560, scale: 0.85, brows: 'neutral', look: [-0.3, 0], armR: [0.7 + 0.15 * Math.sin(tt * 8), 0.4], armL: [0.3, 0.8], seed: 3.1 })
    VIDEO.her.update(tt, { x: 330, y: 1500, scale: 1.0, brows: 'sad', look: [0.4, 0.1], armR: [0.3, 0.9], armL: [0.2, 1.0], seed: 1.3 })
    VIDEO.cartons.setAttribute('opacity', tt > LOOT_T.affaires ? 1 : 0.15)
    VIDEO.jouets.setAttribute('opacity', tt > LOOT_T.jouets ? 1 : 0)
    const close = ease.io3(clamp((tt - LOOT_T.porte) / 0.6))
    VIDEO.leaf.setAttribute('transform', `scale(${lerp(0.35, 1, close)} 1)`)
    VIDEO.ring.setAttribute('transform', 'translate(640 980)')
    VIDEO.ring.setAttribute('stroke-dashoffset', 1300 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `19:42:${String(10 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'neutral', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['jeannine', 'veuve', 'neuf', 'loyer']
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
    prop(TRIB.code, id === '04', S('04') - 0.1, E('04') + 0.05, 540, 520, 0.6, -6)
    if (prop(TRIB.papiers, id === '05', Wd('05', 'procedure') - 0.15, E('05') + 0.05, 540, 520, 0.75) > 0) {
      const ws = ['procedure', 'huissier', 'jugement']
      TRIB.papiers.sheets.forEach((h, k) => h.setAttribute('opacity', t > Wd('05', ws[k]) - 0.1 ? 1 : 0))
      TRIB.papiers.none.setAttribute('opacity', t > Wd('05', 'lexpulsion') - 0.1 ? 1 : 0)
    }
    prop(TRIB.froid, id === '06', Wd('06', 'deux') - 0.15, E('06') + 0.05, 540, 540, 0.75)
    if (prop(TRIB.voiture, id === '07', Wd('07', 'voiture') - 0.15, E('07') + 0.05, 540, 540, 0.75) > 0) TRIB.voiture.sparks.forEach((s, k) => s.setAttribute('opacity', 0.5 + 0.5 * Math.sin(t * 6 + k)))
    if (prop(TRIB.alliance, id === '09', Wd('09', 'alliance') - 0.2, E('09') + 0.05, 540, 520, 0.8) > 0) TRIB.alliance.tag.setAttribute('opacity', t > Wd('09', 'vendu') - 0.1 ? 1 : 0)
    prop(TRIB.maisons, id === '10', Wd('10', 'proprietaire') - 0.15, E('10') + 0.05, 540, 520, 0.85)
    if (prop(TRIB.balance, id === '11', S('11') - 0.1, E('11') + 0.05, 540, 560, 0.7) > 0) {
      const tilt = 14 * ease.io3(prog(t, Wd('11', 'seule', 1) - 0.2, 0.6))
      TRIB.balance.beam.setAttribute('transform', `translate(0 -240) rotate(${-tilt})`)
    }
    prop(TRIB.prison, id === '12', Wd('12', 'prison') - 0.15, E('12') + 0.05, 540, 560, 0.7)
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
