/**
 * ============================================================================
 *  « Affaire Classée ? » — le verdict de Sophie · — le verdict de la cantinière (≈ 60 s, 1080 × 1920)
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
grad('canteen', [[0, '#cfe3e0'], [1, '#8fb5b0']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('pharma', [[0, '#eef6f1'], [1, '#bcd3c6']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk2', [[0, '#e9dcc2'], [1, '#c9b48f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
const SOPHIE = { robe: '#f4f6f8', jabot: false, collar: '#2fa36b', hair: 'bob', hairColor: '#5a3420', female: true, skin: '#f0c2a0', iris: '#2f5a3a' }
const SOPHIE_BOX = { ...SOPHIE, robe: '#6b7280', collar: '#e5e7eb' }
const PERE = { robe: '#3a4a6a', jabot: false, collar: '#9aa3b5', hair: 'short', hairColor: '#1d140e', beard: true, skin: '#c98e66', iris: '#2b1d12' }
const INES = { robe: '#f06a8a', jabot: false, collar: '#ffd1dc', hair: 'bob', hairColor: '#2a1a10', female: true, skin: '#d9a07a', iris: '#2b1d12' }
const JUGE = { robe: '#10121a', jabot: true, hair: 'short', hairColor: '#d6d6d6', skin: '#f0c2a0', iris: '#2b1d12' }

// La boîte d'insuline (réutilisée partout).
function item(parent, kind = 'insuline', s = 1) {
  const g = svg('g', {}, parent)
  const h = svg('g', { transform: `scale(${s})` }, g)
  svg('rect', { x: -56, y: -36, width: 112, height: 72, rx: 8, fill: '#ffffff', stroke: '#1d5a8a', 'stroke-width': 5 }, h)
  svg('rect', { x: -56, y: -36, width: 112, height: 22, rx: 8, fill: '#2f7dd1' }, h)
  txt(h, 'INSULINE', { x: 0, y: 22, 'font-size': 20, fill: '#1d2a5c' })
  return g
}
const greenCross = (parent, x, y, s = 1) => {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('path', { d: 'M -25 -75 H 25 V -25 H 75 V 25 H 25 V 75 H -25 V 25 H -75 V -25 H -25 Z', fill: '#2fd27a', stroke: '#0e5a32', 'stroke-width': 6 }, g)
  return g
}

// La pharmacie : étagères au fond, le frigo des médicaments, Sophie derrière le comptoir,
// le père et Inès côté client, l'écran de caisse et le sac.
function comptoir(L) {
  const r = rng(21)
  for (let i = 0; i < 3; i++) svg('rect', { x: 60 + i * 340, y: 300, width: 280, height: 18, rx: 9, fill: '#ffffff', opacity: 0.95 }, L.far)
  for (let k = 0; k < 4; k++) {
    const y = 560 + k * 150
    svg('rect', { x: -300, y, width: W + 600, height: 12, fill: '#9fb3a8' }, L.far)
    for (let i = 0; i < 26; i++) if (r() > 0.15) svg('rect', { x: -280 + i * 66, y: y - 64 + r() * 18, width: 50, height: 64 - r() * 18, rx: 4, fill: ['#ffffff', '#9fd8ff', '#7fd19b', '#ffd166', '#f6a5b5', '#e6ecff'][Math.floor(r() * 6)], opacity: 0.95 }, L.far)
  }
  const cross = svg('g', {}, L.far)
  svg('circle', { cx: 190, cy: 400, r: 130, fill: '#2fd27a', opacity: 0.2 }, cross)
  greenCross(cross, 190, 400, 1)
  svg('rect', { x: -400, y: 1180, width: W + 800, height: 1400, fill: '#c5d0c9' }, L.far)
  // Le frigo des médicaments (porte vitrée).
  const fr = svg('g', { transform: 'translate(1010 900)' }, L.far)
  svg('rect', { x: -140, y: -320, width: 280, height: 600, rx: 18, fill: '#e9eef5', stroke: '#10121a', 'stroke-width': 7 }, fr)
  svg('rect', { x: -120, y: -300, width: 240, height: 560, rx: 10, fill: '#bfe3ff' }, fr)
  for (const y of [-160, -20, 120]) {
    svg('rect', { x: -120, y: y + 30, width: 240, height: 7, fill: '#7a8aa0' }, fr)
    for (let i = 0; i < 3; i++) item(fr, 'insuline', 0.55).setAttribute('transform', `translate(${-72 + i * 72} ${y})`)
  }
  txt(fr, '+2 / +8 °C', { x: 0, y: -340, 'font-size': 34, fill: '#1d2a5c' })
  const door = svg('rect', { x: -140, y: -320, width: 280, height: 600, rx: 18, fill: '#e6f6ff', opacity: 0.45, stroke: '#10121a', 'stroke-width': 7 }, fr)
  const sophie = makePerson(L.mid, SOPHIE)
  const pere = makePerson(L.actor, PERE)
  // Le comptoir.
  const desk = svg('g', {}, L.front)
  svg('rect', { x: 380, y: 1370, width: 1000, height: 700, fill: '#2f7d5a' }, desk)
  svg('rect', { x: 380, y: 1370, width: 1000, height: 16, fill: '#58b88a' }, desk)
  svg('rect', { x: 360, y: 1300, width: 1040, height: 76, rx: 10, fill: '#f4f6f8', stroke: '#9aa3b5', 'stroke-width': 4 }, desk)
  greenCross(desk, 900, 1640, 1.1)
  // L'écran de caisse.
  const screen = svg('g', { transform: 'translate(1150 1110) scale(0.75)' }, desk)
  svg('rect', { x: -14, y: 60, width: 28, height: 260, fill: '#8a93a6' }, screen)
  svg('rect', { x: -150, y: -70, width: 300, height: 140, rx: 14, fill: '#0b0d12', stroke: '#9aa3b5', 'stroke-width': 6 }, screen)
  txt(screen, 'TOTAL', { x: 0, y: -26, 'font-size': 26, fill: '#9fe6bf' })
  const total = txt(screen, '0,00 €', { x: 0, y: 40, 'font-size': 50, fill: '#9fe6bf', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  // Les boîtes glissent derrière le sac de la pharmacie.
  const items = svg('g', {}, L.front)
  const bag = svg('g', { transform: 'translate(490 1300)' }, L.front)
  svg('path', { d: 'M -80 0 L 80 0 L 68 -160 L -68 -160 Z', fill: '#fbf8f0', stroke: '#9aa3b5', 'stroke-width': 5 }, bag)
  svg('path', { d: 'M -40 -160 Q -40 -210 0 -210 Q 40 -210 40 -160', fill: 'none', stroke: '#9aa3b5', 'stroke-width': 8 }, bag)
  greenCross(bag, 0, -80, 0.45)
  const ines = makePerson(L.front, INES)
  return { sophie, pere, ines, cross, door, total, items }
}

const pharmacy = (banner) => (L) => {
  bg(L, 'url(#pharma)')
  const C1 = comptoir(L)
  let ban = null
  if (banner) {
    ban = svg('g', {}, L.fx)
    svg('rect', { x: -380, y: -80, width: 760, height: 160, rx: 20, fill: '#12a150', stroke: '#10121a', 'stroke-width': 8 }, ban)
    txt(ban, 'DE RETOUR', { x: 0, y: 28, 'font-size': 76, fill: '#fff' })
  }
  return { ...C1, ban }
}
const EMEUTE = scene('emeute', pharmacy(false))
const APRES = scene('apres', pharmacy(true))

// 2 · Rappel des faits : 18 mois, puis la fiche de paie (− 100 € par mois).
const VIDEO = scene('video', (L) => {
  bg(L, 'url(#desk2)')
  const cal = svg('g', {}, L.mid)
  svg('rect', { x: -380, y: -250, width: 760, height: 500, rx: 22, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, cal)
  svg('rect', { x: -380, y: -250, width: 760, height: 80, rx: 22, fill: '#e5484d' }, cal)
  txt(cal, '18 MOIS', { x: 0, y: -192, 'font-size': 48, fill: '#ffffff' })
  cal.days = []
  for (let k = 0; k < 18; k++) cal.days.push(svg('rect', { x: -350 + (k % 6) * 118, y: -150 + Math.floor(k / 6) * 125, width: 100, height: 105, rx: 10, fill: '#d6dbe4' }, cal))
  const paie = svg('g', {}, L.actor)
  svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 14, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 7 }, paie)
  txt(paie, 'FICHE DE PAIE', { x: 0, y: -230, 'font-size': 46, fill: '#1d2a5c' })
  for (let k = 0; k < 4; k++) svg('rect', { x: -200, y: -170 + k * 50, width: 400 - (k % 2) * 120, height: 16, rx: 8, fill: '#d6dbe4' }, paie)
  paie.stamp = svg('g', { transform: 'translate(0 150) rotate(-8)' }, paie)
  svg('rect', { x: -210, y: -70, width: 420, height: 140, rx: 16, fill: 'none', stroke: '#e5484d', 'stroke-width': 10 }, paie.stamp)
  txt(paie.stamp, '− 100 €', { x: 0, y: 30, 'font-size': 90, fill: '#e5484d' })
  const boxes = svg('g', {}, L.front)
  for (let k = 0; k < 5; k++) item(boxes, 'insuline', 1.6).setAttribute('transform', `translate(${180 + k * 170} ${1640 + (k % 2) * 40}) rotate(${(k - 2) * 7})`)
  const ring = svg('circle', { cx: 0, cy: 0, r: 190, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 1300, 'stroke-dashoffset': 1300 }, L.fx)
  return { cal, paie, boxes, ring }
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
  const ines = makePerson(photo, SOPHIE)
  const rows = ['SOPHIE', '46 ANS', 'PRÉPARATRICE', 'RELAXÉE'].map((s, k) => {
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
  const judge = makePerson(L.actor, JUGE)
  const accused = makePerson(L.actor, SOPHIE_BOX)
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.75 }, bars)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 500, fill: 'url(#desk)' }, L.front)
  svg('rect', { x: -300, y: 1780, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, L.front)
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // Le marteau du juge.
  const gavel = prop((g) => {
    svg('rect', { x: -40, y: -20, width: 300, height: 40, rx: 16, fill: '#7a4a1a', stroke: '#10121a', 'stroke-width': 7, transform: 'rotate(-30)' }, g)
    svg('rect', { x: -130, y: -90, width: 180, height: 110, rx: 22, fill: '#9a6542', stroke: '#10121a', 'stroke-width': 8, transform: 'rotate(-30)' }, g)
  })
  // Le Code pénal ouvert à l'article 122-7.
  const code = prop((g) => {
    svg('rect', { x: -300, y: -200, width: 600, height: 400, rx: 18, fill: '#7a1f1f', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -280, y: -185, width: 270, height: 370, rx: 8, fill: '#fbf8f0' }, g)
    svg('rect', { x: 10, y: -185, width: 270, height: 370, rx: 8, fill: '#fbf8f0' }, g)
    txt(g, 'CODE', { x: -145, y: -110, 'font-size': 40, fill: '#7a1f1f' })
    txt(g, 'PÉNAL', { x: -145, y: -65, 'font-size': 40, fill: '#7a1f1f' })
    txt(g, 'ART. 122-7', { x: 145, y: -110, 'font-size': 38, fill: '#1d2a5c' })
    for (let l = 0; l < 5; l++) svg('rect', { x: 40, y: -60 + l * 40, width: 200 - (l % 2) * 50, height: 10, rx: 5, fill: '#c7cbd4' }, g)
    for (let l = 0; l < 4; l++) svg('rect', { x: -250, y: -10 + l * 40, width: 200 - (l % 2) * 60, height: 10, rx: 5, fill: '#c7cbd4' }, g)
    g.hl = svg('rect', { x: 30, y: -72, width: 230, height: 70, rx: 8, fill: '#ffd43b', opacity: 0.55 }, g)
  })
  // Les boîtes d'insuline (les faits).
  const boites = prop((g) => {
    for (let k = 0; k < 5; k++) item(g, 'insuline', 1.5).setAttribute('transform', `translate(${-280 + k * 140} ${(k % 2) * 40}) rotate(${(k - 2) * 6})`)
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, judge, accused, bars, gavel, code, boites }
})

// 5 · Le vote : elle, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, SOPHIE)
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
txt(rec, 'REC · CAM 07 · CAISSE 3', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
const fmtE = (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €'
tag('ÉPISODE 2', 'pill yellow', { t0: 0, t1: Wd('01', 'quarante') - 0.1, y: 230, rot: -2 })
tag('VOUS AVEZ JUGÉ SOPHIE', 'pill', { t0: 0.2, t1: Wd('01', 'quarante') - 0.1, y: 340, rot: 2 })
counterTag(Wd('01', 'quarante') - 0.1, Wd('01', 'non') - 0.1, 40000, 'JURÉS', { fmt: (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' +', y: 340 })
const nc = fs(tag('NON COUPABLE', 'stamp', { t0: Wd('01', 'non') - 0.05, t1: SEC.emeute.t1, y: 330, rot: -6, from: 2.8, dur: 0.2 }), 120)
nc.el.style.color = '#2f7dd1'
nc.el.style.borderColor = '#2f7dd1'
tag('RAPPEL DES FAITS', 'pill', { t0: S('02') - 0.05, t1: Wd('02', 'dixhuit') - 0.1, y: 250, rot: -2 })
counterTag(Wd('02', 'dixhuit') - 0.1, Wd('02', 'six') - 0.1, 18, 'MOIS', { y: 270, dur: 0.5 })
counterTag(Wd('02', 'six') - 0.1, Wd('02', 'cent') - 0.1, 6000, 'D’INSULINE', { fmt: fmtE, y: 270 })
fs(tag('− 100 € DE SON SALAIRE', 'slam yellow', { t0: Wd('02', 'cent') - 0.06, t1: SEC.video.t1, y: 270, rot: -3, from: 2.6, dur: 0.2 }), 78)
// Le tribunal.
tag('REQUIS : 6 MOIS AVEC SURSIS', 'pill red', { t0: Wd('03', 'requis') - 0.1, t1: E('03') + 0.1, y: 250, rot: -2 }).el.style.fontSize = '44px'
fs(tag('LES FAITS SONT ÉTABLIS.', 'slam white', { t0: Wd('04', 'faits') - 0.06, t1: E('04') + 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 76)
tag('LE PÈRE D’INÈS', 'pill', { t0: Wd('05', 'pere') - 0.1, t1: E('05') + 0.1, y: 250, rot: -2 })
tag('UNE EXCEPTION', 'pill yellow', { t0: Wd('06', 'exception') - 0.1, t1: Wd('06', 'quand') - 0.1, y: 230, rot: -2 })
tag('LA VIE D’UN ENFANT', 'pill red', { t0: Wd('06', 'vie') - 0.1, t1: Wd('06', 'letat') - 0.1, y: 230, rot: 2 })
fs(tag('ÉTAT DE NÉCESSITÉ', 'slam yellow', { t0: Wd('06', 'letat') - 0.06, t1: E('06') + 0.15, y: 240, rot: -3, from: 3, dur: 0.2 }), 92)
fs(tag('RELAXÉE', 'stamp', { t0: Wd('07', 'relaxe') - 0.05, t1: E('07') + 0.1, y: 330, rot: -8, from: 2.8, dur: 0.2 }), 150).el.style.cssText += ';color:#12a150;border-color:#12a150'
fs(tag('LIBRE.', 'slam white', { t0: Wd('07', 'libre') - 0.06, t1: E('07') + 0.1, y: 520, rot: -2, from: 2.4, dur: 0.2 }), 120)
fs(tag('NON COUPABLE', 'slam yellow', { t0: Wd('08', 'non') - 0.06, t1: Wd('08', 'et') - 0.1, y: 260, rot: -3, from: 2.6, dur: 0.2 }), 110)
tag('COMME VOUS L’AVIEZ DIT', 'pill', { t0: Wd('08', 'exactement') - 0.1, t1: Wd('08', 'et') - 0.1, y: 400, rot: 2 })
tag('👏 LA SALLE APPLAUDIT', 'pill yellow', { t0: Wd('08', 'applaudir') - 0.3, t1: E('08') + 0.2, y: 260, rot: -2 })
// Après.
tag('3 SEMAINES PLUS TARD', 'pill yellow', { t0: S('09') - 0.05, t1: Wd('09', 'et') - 0.1, y: 230, rot: -2 })
fs(tag('SÉCU RÉTABLIE ✅', 'slam white', { t0: Wd('09', 'retablis') - 0.06, t1: Wd('09', 'et') - 0.1, y: 330, rot: -2, from: 2.4, dur: 0.2 }), 80)
// La question et l'abonnement.
tag('✅ JUSTICE EST FAITE', 'vote blue', { t0: Wd('10', 'justice') - 0.1, y: 520, rot: -3 }).el.style.fontSize = '56px'
tag('💊 J’AURAIS FAIT PAREIL', 'vote red', { t0: Wd('10', 'toi') - 0.1, y: 720, rot: 3 }).el.style.fontSize = '54px'
fs(tag('DIS-LE EN COMMENTAIRE 👇', 'pill yellow', { t0: Wd('10', 'commentaire') - 0.1, y: 300 }), 50)
tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('11', 'abonne') - 0.1, y: 1180 })
fs(tag('DEMAIN : UNE NOUVELLE AFFAIRE', 'pill yellow', { t0: Wd('11', 'demain') - 0.1, y: 1330 }), 44)

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés (pas sur l'appel à s'abonner : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => l.id !== '11-abonne')) {
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

const T_CONSOLE = 9999
const IMPACTS = [
  [0.05, 10],
  [Wd('01', 'non') - 0.05, 14],
  [Wd('02', 'cent') - 0.06, 10],
  [Wd('04', 'faits') - 0.06, 10],
  [Wd('06', 'letat') - 0.06, 14],
  [Wd('07', 'relaxe') - 0.05, 18],
  [Wd('08', 'non') - 0.06, 12],
  [Wd('10', 'commentaire') - 0.06, 8],
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
  rec.setAttribute('display', 'none')
  freeze.setAttribute('display', 'none')

  for (const CS of [EMEUTE, APRES]) {
    if (cur !== CS) continue
    const dive = CS === EMEUTE ? prog(t, Wd('01', 'non') - 0.3, 0.9, ease.io3) : 0
    cam(CS, t, { zoom: lerp(1.15, 1.3, dive), cx: lerp(560, 640, dive), cy: lerp(1220, 1180, dive), push: 0.02, hand: 3 })
    const happy = CS === APRES
    CS.sophie.update(t, { x: 700, y: 1160, scale: 1.05, brows: 'neutral', look: [-0.4, 0.2], mouth: happy ? 0.2 : 0.05, armR: [0.25, 1.0], armL: [0.2, 1.1], seed: 1.1 })
    CS.pere.update(t, { x: 190, y: 1250, scale: 0.85, brows: 'neutral', look: [0.5, 0.1], mouth: happy ? 0.25 : 0, armR: [0.1, 0.7], armL: [0.1, 0.7], seed: 2.2 })
    CS.ines.update(t, { x: 330, y: 1400, scale: 0.55, brows: 'neutral', look: [0.6, -0.3], mouth: happy ? 0.35 : 0.1, armR: happy ? [0.9 + 0.3 * Math.sin(t * 8), 0.3] : [0.1, 0.6], armL: [0.1, 0.6], seed: 3.3, headTilt: 0.05 * Math.sin(t * 1.5) })
    CS.cross.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.7 : 1)
    CS.total.textContent = happy ? 'REMBOURSÉ' : '0,00 €'
    if (CS.ban) {
      const b = popS(t, Wd('09', 'repris') - 0.15, Infinity, 0.35)
      show(CS.ban, b > 0.01)
      place(CS.ban, 540, 520, b, -3)
    }
  }
  if (cur === VIDEO) {
    const on = prog(t, Wd('02', 'cent') - 0.4, 0.5, ease.io3)
    cam(VIDEO, t, { zoom: 1.05, cx: 540, cy: 960, push: 0.01, hand: 3 })
    place(VIDEO.cal, 540 - on * 1300, 900, 1.05, -3)
    const n = Math.round(18 * ease.out3(prog(t, Wd('02', 'dixhuit') - 0.1, 1.0)))
    VIDEO.cal.days.forEach((d, k) => d.setAttribute('fill', k < n ? '#e5484d' : '#d6dbe4'))
    show(VIDEO.paie, on > 0.01)
    place(VIDEO.paie, 540 + (1 - on) * 1300, 920, 1.05, 3)
    VIDEO.paie.stamp.setAttribute('opacity', t > Wd('02', 'salaire') - 0.1 ? 1 : 0)
    VIDEO.boxes.setAttribute('opacity', t > Wd('02', 'six') - 0.1 ? 1 : 0)
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'neutral', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['sophie', 'quarante', 'preparatrice', 'non']
    FICHE.rows.forEach((g, k) => {
      const s = popS(t, Wd('03', keys[k]) - 0.1, Infinity, 0.3)
      g.setAttribute('opacity', Math.min(1, s))
      g.setAttribute('transform', `translate(0 ${(1 - Math.min(1, s)) * 30})`)
    })
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const isJ = l.who === 'juge'
    const hot = id === '07' || id === '08' ? '#12a150' : null
    show(TRIB.procBg, isJ && !hot)
    show(TRIB.avoBg, !isJ && !hot)
    show(TRIB.hotBg, !!hot)
    if (hot) TRIB.hotFill.setAttribute('fill', hot)
    show(TRIB.proc.root, false)
    show(TRIB.avo.root, false)
    show(TRIB.judge.root, isJ)
    show(TRIB.accused.root, !isJ)
    show(TRIB.bars, !isJ && !hot)
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch), cy: lerp(980, 900, Math.min(1, punch)), push: 0.025, from: l.start - 0.12 })
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    if (isJ) {
      const m = mouthOf('juge', t)
      const sp = speaking('juge', t)
      TRIB.judge.update(t, {
        x: 540, y: 1170, scale: 1.4, mouth: m,
        brows: id === '06' || id === '07' ? 'neutral' : 'determined', look: [0, 0],
        armR: [0.35 + (sp ? 0.2 * m + 0.1 * beat : 0), 1.0 + (sp ? 0.25 * beat : 0)],
        armL: [0.25, 1.2], seed: 0.9, headTilt: 0.03 * Math.sin(t * 1.2),
      })
    } else {
      const free = id === '08'
      TRIB.accused.update(t, { x: 540, y: 1250, scale: 1.3, brows: free ? 'neutral' : 'sad', look: [0, id === '05' ? 0.5 : -0.1], mouth: free ? 0.35 : 0, armR: free ? [1.0 + 0.3 * Math.sin(t * 10), 0.4] : [0.1, 0.8], armL: free ? [1.0 + 0.3 * Math.sin(t * 10 + 1), 0.4] : [0.1, 0.8], seed: 2.6, headNod: id === '05' ? 0.05 : 0.02 })
    }
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    const hit = id === '07' ? Wd('07', 'relaxe') : 0
    const sw = hit ? (t < hit - 0.2 ? 0 : t < hit ? -40 * ease.out3((t - hit + 0.2) / 0.2) : -40 + 40 * ease.out3(clamp((t - hit) / 0.1))) : 0
    prop(TRIB.gavel, id === '07', hit - 0.6, E('07') + 0.05, 900, 960, 1.0, sw)
    if (prop(TRIB.code, id === '06', Wd('06', 'loi') - 0.15, E('06') + 0.05, 540, 560, 0.75) > 0) TRIB.code.hl.setAttribute('opacity', t > Wd('06', 'letat') - 0.1 ? 0.6 : 0)
    prop(TRIB.boites, id === '04', Wd('04', 'medicaments') - 0.15, E('04') + 0.05, 540, 560, 0.9)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'neutral', look: [0, 0], mouth: 0.25, armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.03 })
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
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && l.who === 'juge')
  who.textContent = w ? 'LE JUGE' : ''
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
