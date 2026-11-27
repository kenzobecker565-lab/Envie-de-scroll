/**
 * ============================================================================
 *  « Affaire Classée ? » — le garagiste (≈ 80 s, 1080 × 1920)
 * ============================================================================
 *  Style A : motion design 2D vectoriel en SVG, gros sous-titres animés.
 *
 *  1. L'atelier : pendant que le client paie, Samir retire un fusible ; les
 *     deux enfants à l'arrière de la voiture, visibles dès la première image.
 *  2. La caméra de l'atelier (cadre REC) : le client titube, les enfants, les
 *     clés… arrêt sur image sur la canette.
 *  3. Sa fiche : 49 ans, garagiste depuis 25 ans… tampon « JUGÉ ».
 *  4. Le procès (un accessoire par réplique, coupes rapides).
 *  5. Le vote, puis le nouvel appel à l'abonnement : une fausse carte de
 *     profil, un doigt qui appuie sur le « + », confettis, « ABONNÉ », la carte
 *     de juré officiel tamponnée « VALIDÉ », puis « À TOI DE JOUER ».
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
grad('garage', [[0, '#1b2130'], [0.6, '#2b3344'], [1, '#11151d']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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

// Position (dans le repère du personnage) de la main d'un bras [épaule, coude] (voir personnage.js).
function handLocal([sh, el], side) {
  const a1 = Math.PI / 2 - side * sh
  const ex = side * 200 + Math.cos(a1) * 170
  const ey = 70 + Math.sin(a1) * 170
  const a2 = Math.PI / 2 - side * (sh + el)
  return [ex + Math.cos(a2) * 194, ey + Math.sin(a2) * 194]
}
const handAt = (x, y, s, arm, side) => {
  const [hx, hy] = handLocal(arm, side)
  return [x + hx * s, y + hy * s]
}

const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'short', hairColor: '#1d140e', beard: true, skin: '#8a5a3a', iris: '#2b1d12' }
const SAMIR = { robe: '#2f5d8a', jabot: false, collar: '#f2a93b', hair: 'short', hairColor: '#1d140e', beard: true, skin: '#c68a5e', iris: '#2b1d12' }
const SAMIR_BOX = { ...SAMIR, robe: '#6b7280', collar: '#e5e7eb' }
const CLIENT = { robe: '#7a4a2e', jabot: false, collar: '#c9b79c', hair: 'messy', hairColor: '#8a6a3a', skin: '#efc09a', iris: '#3b5b8a' }
const KID1 = { robe: '#ff9e4f', jabot: false, hair: 'bob', hairColor: '#4a2a14', female: true, skin: '#f6d2b5', iris: '#2b1d12' }
const KID2 = { robe: '#3b82f6', jabot: false, hair: 'short', hairColor: '#1d140e', skin: '#d9a07a', iris: '#2b1d12' }

// Le fusible (lame, 30 A).
function fuse(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  for (const x of [-18, 18]) svg('rect', { x: x - 7, y: 10, width: 14, height: 46, rx: 3, fill: '#d7dde8', stroke: '#10121a', 'stroke-width': 4 }, g)
  svg('rect', { x: -40, y: -40, width: 80, height: 56, rx: 10, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 5 }, g)
  txt(g, '30', { x: 0, y: 2, 'font-size': 34, fill: '#fff' })
  return g
}
// La canette (sans marque) et le trousseau de clés.
function can(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('rect', { x: -26, y: -46, width: 52, height: 92, rx: 10, fill: '#d7dde8', stroke: '#10121a', 'stroke-width': 5 }, g)
  svg('rect', { x: -24, y: -26, width: 48, height: 46, fill: '#2fa84f' }, g)
  svg('rect', { x: -24, y: -12, width: 48, height: 8, fill: '#ffd43b' }, g)
  return g
}
function keys(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('circle', { r: 18, fill: 'none', stroke: '#cfd8e8', 'stroke-width': 7 }, g)
  svg('path', { d: 'M 8 14 L 30 58 L 22 62 L 26 70 M -8 14 L -26 56 L -18 60', fill: 'none', stroke: '#cfd8e8', 'stroke-width': 9, 'stroke-linecap': 'round' }, g)
  svg('rect', { x: -40, y: 20, width: 34, height: 40, rx: 8, fill: '#10121a' }, g)
  return g
}
// La voiture du client, de profil (capot ouvert ou fermé), les deux enfants à l'arrière.
function car(parent, { color = '#3c6e71', kids = true, id = 'k' } = {}) {
  const g = svg('g', {}, parent)
  const hood = svg('g', {}, g)
  svg('rect', { x: -275, y: -16, width: 280, height: 24, rx: 10, fill: shadeHex(color, -0.15), stroke: '#10121a', 'stroke-width': 7 }, hood)
  svg('path', { d: 'M 110 1320 L 110 1170 Q 115 1125 170 1118 L 395 1112 L 470 990 Q 485 970 520 970 L 840 970 Q 880 972 900 1000 L 960 1110 Q 985 1130 985 1170 L 985 1320 Z', fill: color, stroke: '#10121a', 'stroke-width': 8 }, g)
  // Le compartiment moteur, la boîte à fusibles.
  const bay = svg('g', {}, g)
  svg('rect', { x: 130, y: 1100, width: 250, height: 30, rx: 6, fill: '#10141f' }, bay)
  svg('rect', { x: 210, y: 1092, width: 90, height: 30, rx: 5, fill: '#1d2130', stroke: '#4a5568', 'stroke-width': 3 }, bay)
  for (let k = 0; k < 4; k++) svg('rect', { x: 218 + k * 20, y: 1096, width: 14, height: 18, rx: 2, fill: ['#e5484d', '#ffd43b', '#3b82f6', '#2fd27a'][k] }, bay)
  const slot = svg('rect', { x: 218, y: 1096, width: 14, height: 18, rx: 2, fill: '#000' }, bay)
  svg('path', { d: 'M 420 1150 L 960 1150', stroke: shadeHex(color, -0.3), 'stroke-width': 5 }, g)
  svg('path', { d: 'M 650 990 L 650 1300', stroke: shadeHex(color, -0.3), 'stroke-width': 5 }, g)
  svg('rect', { x: 112, y: 1170, width: 30, height: 34, rx: 8, fill: '#ffe7a0', stroke: '#10121a', 'stroke-width': 4 }, g)
  svg('rect', { x: 950, y: 1170, width: 30, height: 34, rx: 8, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 4 }, g)
  // Vitres.
  svg('path', { d: 'M 495 995 L 635 995 L 635 1105 L 425 1105 Z', fill: '#9fc4e0', stroke: '#10121a', 'stroke-width': 6 }, g)
  const rear = 'M 665 995 L 845 995 Q 862 996 872 1012 L 920 1105 L 665 1105 Z'
  svg('path', { d: rear, fill: '#7fa8c8', stroke: '#10121a', 'stroke-width': 6 }, g)
  const clip = svg('clipPath', { id: `rear-${id}` }, defs)
  svg('path', { d: rear }, clip)
  const inside = svg('g', { 'clip-path': `url(#rear-${id})` }, g)
  const k1 = kids ? makePerson(inside, KID1) : null
  const k2 = kids ? makePerson(inside, KID2) : null
  svg('path', { d: 'M 690 1000 L 720 1000 L 680 1100 L 666 1100 Z', fill: '#fff', opacity: 0.25 }, g)
  svg('path', { d: 'M 760 1000 L 776 1000 L 736 1100 L 720 1100 Z', fill: '#fff', opacity: 0.18 }, g)
  for (const x of [270, 820]) {
    svg('circle', { cx: x, cy: 1320, r: 80, fill: '#10121a' }, g)
    svg('circle', { cx: x, cy: 1320, r: 38, fill: '#9aa3b5', stroke: '#4a5568', 'stroke-width': 6 }, g)
  }
  const kidsUpdate = (t, worried = 0) => {
    if (!kids) return
    k1.update(t, { x: 722, y: 1128, scale: 0.29, brows: worried > 0.5 ? 'sad' : 'neutral', look: [0.6, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 4.1 })
    k2.update(t, { x: 838, y: 1134, scale: 0.27, brows: worried > 0.5 ? 'sad' : 'neutral', look: [-0.3, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 5.3 })
  }
  const setHood = (open) => hood.setAttribute('transform', `translate(395 1112) rotate(${38 * open})`)
  return { g, hood, slot, kidsUpdate, setHood }
}
function shadeHex(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

// L'atelier : le mur à outils, le comptoir, Samir au capot, le client à la caisse, la voiture.
function garage(L, id) {
  svg('rect', { x: -400, y: 220, width: W + 800, height: 1120, fill: '#2b3344' }, L.far)
  svg('rect', { x: 70, y: 300, width: 940, height: 430, rx: 12, fill: '#3a4456', stroke: '#1b2130', 'stroke-width': 8 }, L.far)
  for (let y = 330; y < 720; y += 34) for (let x = 100; x < 1000; x += 34) svg('circle', { cx: x, cy: y, r: 4, fill: '#232a38' }, L.far)
  // Outils accrochés.
  const tool = (d, c = '#9aa3b5') => svg('path', { d, fill: 'none', stroke: c, 'stroke-width': 18, 'stroke-linecap': 'round' }, L.far)
  for (let k = 0; k < 5; k++) tool(`M ${150 + k * 46} 360 L ${150 + k * 46} ${470 + k * 18}`)
  tool('M 480 360 L 480 560', '#e5484d')
  svg('rect', { x: 452, y: 340, width: 56, height: 40, rx: 8, fill: '#9aa3b5' }, L.far)
  tool('M 600 380 L 700 520', '#ffd43b')
  svg('circle', { cx: 860, cy: 470, r: 70, fill: 'none', stroke: '#10121a', 'stroke-width': 34 }, L.far)
  svg('circle', { cx: 860, cy: 470, r: 70, fill: 'none', stroke: '#2b2f3a', 'stroke-width': 20 }, L.far)
  // Le comptoir et le terminal de paiement.
  svg('rect', { x: 600, y: 900, width: 700, height: 120, fill: '#5a4636', stroke: '#2a1f18', 'stroke-width': 6 }, L.far)
  svg('rect', { x: 600, y: 886, width: 700, height: 22, rx: 6, fill: '#8a6a50' }, L.far)
  // Lampes d'atelier.
  for (const x of [300, 800]) {
    svg('path', { d: `M ${x - 70} 240 L ${x + 70} 240 L ${x + 360} 1400 L ${x - 360} 1400 Z`, fill: 'url(#beam)', opacity: 0.35 }, L.far)
    svg('rect', { x: x - 80, y: 222, width: 160, height: 26, rx: 12, fill: '#e6ecff' }, L.far)
  }
  svg('rect', { x: -400, y: 1330, width: W + 800, height: 1200, fill: '#1b2029' }, L.far)
  for (let i = 0; i < 6; i++) svg('rect', { x: -100 + i * 230, y: 1480, width: 130, height: 16, fill: '#ffd43b', opacity: 0.55 }, L.far)
  const term = svg('g', {}, L.actor)
  svg('rect', { x: -34, y: -60, width: 68, height: 110, rx: 12, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 5 }, term)
  const screen = svg('rect', { x: -24, y: -48, width: 48, height: 34, rx: 4, fill: '#9fd8ff' }, term)
  const samir = makePerson(L.actor, SAMIR)
  const client = makePerson(L.actor, CLIENT)
  const C1 = car(L.actor, { id })
  const fuseG = svg('g', {}, L.actor)
  fuse(fuseG, 1)
  const canG = svg('g', {}, L.actor)
  can(canG, 1)
  const keysG = svg('g', {}, L.actor)
  keys(keysG, 1)
  // Établi à roulettes au premier plan.
  svg('rect', { x: -60, y: 1520, width: 300, height: 220, rx: 14, fill: '#c43a2f', stroke: '#10121a', 'stroke-width': 8 }, L.front)
  for (const y of [1580, 1650]) svg('rect', { x: -40, y, width: 260, height: 10, fill: '#7a1f18' }, L.front)
  return { samir, client, car: C1, fuseG, canG, keysG, term, screen }
}

// 1 · L'atelier : pendant que le client paie, Samir retire un fusible.
const EMEUTE = scene('emeute', (L) => {
  bg(L, 'url(#garage)')
  return garage(L, 'a')
})

// 2 · La caméra de l'atelier.
const VIDEO = scene('video', (L) => {
  bg(L, 'url(#garage)')
  const B = garage(L, 'b')
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#3f7a52', opacity: 0.22 }, L.fx)
  for (let y = -200; y < H + 200; y += 12) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#000', opacity: 0.18 }, L.fx)
  const ring = svg('circle', { cx: 0, cy: 0, r: 120, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 760, 'stroke-dashoffset': 760 }, L.fx)
  const ringKids = svg('rect', { x: 655, y: 985, width: 280, height: 132, rx: 24, fill: 'none', stroke: '#ffd43b', 'stroke-width': 10, 'stroke-dasharray': 840, 'stroke-dashoffset': 840 }, L.fx)
  return { ...B, ring, ringKids }
})

// 3 · Sa fiche : la photo, les mentions, puis « JUGÉ ».
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
  const ines = makePerson(photo, SAMIR)
  const rows = ['SAMIR', '49 ANS', 'GARAGISTE · 25 ANS', '0 LITIGE'].map((s, k) => {
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
  // La carte grise : ce n'est pas sa voiture.
  const grise = prop((g) => {
    svg('rect', { x: -300, y: -210, width: 600, height: 420, rx: 18, fill: '#d9e6c8', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -300, y: -210, width: 600, height: 90, rx: 18, fill: '#4a7a3a' }, g)
    txt(g, 'CARTE GRISE', { x: 0, y: -150, 'font-size': 52, fill: '#fff' })
    txt(g, 'PROPRIÉTAIRE :', { x: -260, y: -50, 'font-size': 40, fill: '#1d2a5c', 'text-anchor': 'start' })
    txt(g, 'LE CLIENT', { x: -260, y: 20, 'font-size': 60, fill: '#1d2a5c', 'text-anchor': 'start' })
    for (let k = 0; k < 3; k++) svg('rect', { x: -260, y: 60 + k * 40, width: 420 - k * 90, height: 16, rx: 8, fill: '#9aae88' }, g)
    g.stamp = svg('g', { transform: 'translate(150 110) rotate(-12)' }, g)
    svg('rect', { x: -150, y: -50, width: 300, height: 100, rx: 14, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 10 }, g.stamp)
    txt(g.stamp, 'PAS À LUI', { x: 0, y: 22, 'font-size': 56, fill: '#e5484d' })
  })
  // Les deux bulles : « tes clés, s'il te plaît » / l'insulte.
  const bulles = prop((g) => {
    g.a = svg('g', { transform: 'translate(-60 -110)' }, g)
    svg('path', { d: 'M -300 -90 L 300 -90 Q 330 -90 330 -60 L 330 50 Q 330 80 300 80 L -180 80 L -250 140 L -230 80 L -300 80 Q -330 80 -330 50 L -330 -60 Q -330 -90 -300 -90 Z', fill: '#fff', stroke: '#10121a', 'stroke-width': 7 }, g.a)
    txt(g.a, 'Tes clés, s’il te plaît.', { x: 0, y: 14, 'font-size': 50, fill: '#10121a', 'font-weight': 800 })
    g.b = svg('g', { transform: 'translate(110 150)' }, g)
    svg('path', { d: 'M -200 -80 L 200 -80 Q 230 -80 230 -50 L 230 40 Q 230 70 200 70 L 160 70 L 190 130 L 100 70 L -200 70 Q -230 70 -230 40 L -230 -50 Q -230 -80 -200 -80 Z', fill: '#e5484d', stroke: '#10121a', 'stroke-width': 7 }, g.b)
    txt(g.b, '#@%$ !!', { x: 0, y: 18, 'font-size': 76, fill: '#fff' })
  })
  // Le téléphone : le 17.
  const tel = prop((g) => {
    svg('rect', { x: -170, y: -300, width: 340, height: 600, rx: 44, fill: '#10121a' }, g)
    svg('rect', { x: -146, y: -260, width: 292, height: 520, rx: 22, fill: '#1d2a5c' }, g)
    txt(g, 'APPEL', { x: 0, y: -170, 'font-size': 40, fill: '#9fb4ff' })
    txt(g, '17', { x: 0, y: -40, 'font-size': 160, fill: '#fff' })
    svg('circle', { cx: 0, cy: 170, r: 52, fill: '#2fd27a' }, g)
    svg('path', { d: 'M -22 150 Q -26 186 10 196 L 22 184 L 8 170 L -2 176 Q -10 168 -8 158 L 2 150 L -8 136 Z', fill: '#fff' }, g)
  })
  // Les deux panneaux : école à 2 min, police à 40 min.
  const panneaux = prop((g) => {
    svg('rect', { x: -14, y: -260, width: 28, height: 560, fill: '#9aa3b5', stroke: '#10121a', 'stroke-width': 5 }, g)
    g.police = svg('g', { transform: 'translate(0 -170)' }, g)
    svg('path', { d: 'M -300 -70 L 250 -70 L 320 0 L 250 70 L -300 70 Z', fill: '#e5e7eb', stroke: '#10121a', 'stroke-width': 7 }, g.police)
    txt(g.police, 'POLICE · 40 MIN', { x: -10, y: 20, 'font-size': 52, fill: '#1d2a5c' })
    g.ecole = svg('g', { transform: 'translate(0 20)' }, g)
    svg('path', { d: 'M 300 -70 L -250 -70 L -320 0 L -250 70 L 300 70 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 7 }, g.ecole)
    txt(g.ecole, 'ÉCOLE · 2 MIN', { x: 10, y: 20, 'font-size': 56, fill: '#10121a' })
  })
  // La voiture en panne au bord de la route, triangle posé.
  const panne = prop((g) => {
    svg('rect', { x: -360, y: -220, width: 720, height: 440, rx: 20, fill: '#2b3344', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -360, y: 90, width: 720, height: 130, fill: '#3a3f4a' }, g)
    for (let i = 0; i < 4; i++) svg('rect', { x: -330 + i * 190, y: 148, width: 110, height: 14, fill: '#fff', opacity: 0.7 }, g)
    const c = svg('g', { transform: 'translate(-200 -500) scale(0.45)' }, g)
    g.car = car(c, { kids: true, id: 'p' })
    g.car.setHood(1)
    g.tri = svg('path', { d: 'M 230 60 L 290 -50 L 350 60 Z', fill: 'none', stroke: '#e5484d', 'stroke-width': 16, 'stroke-linejoin': 'round' }, g)
  })
  // Le parking : la voiture garée, « n'a pas démarré ».
  const parking = prop((g) => {
    svg('rect', { x: -360, y: -240, width: 720, height: 480, rx: 20, fill: '#2b3344', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -330, y: -210, width: 110, height: 110, rx: 16, fill: '#3b82f6' }, g)
    txt(g, 'P', { x: -275, y: -122, 'font-size': 90, fill: '#fff' })
    for (const x of [-150, 230]) svg('rect', { x, y: -160, width: 12, height: 340, fill: '#fff', opacity: 0.7 }, g)
    const c = svg('g', { transform: 'translate(-190 -470) scale(0.42)' }, g)
    g.car = car(c, { kids: true, id: 'q' })
    g.car.setHood(0)
    g.stamp = svg('g', { transform: 'translate(40 170) rotate(-8)' }, g)
    svg('rect', { x: -250, y: -50, width: 500, height: 100, rx: 14, fill: '#ffffff', stroke: '#12a150', 'stroke-width': 10 }, g.stamp)
    txt(g.stamp, 'PAS DÉMARRÉ', { x: 0, y: 22, 'font-size': 60, fill: '#12a150' })
  })
  // Les avis du garage : cinq étoiles qui tombent.
  const avis = prop((g) => {
    svg('rect', { x: -330, y: -190, width: 660, height: 380, rx: 24, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'GARAGE SAMIR', { x: 0, y: -100, 'font-size': 56, fill: '#1d2a5c' })
    g.stars = [0, 1, 2, 3, 4].map((k) => {
      const s = svg('path', { d: 'M 0 -46 L 13 -15 L 46 -14 L 20 7 L 29 40 L 0 21 L -29 40 L -20 7 L -46 -14 L -13 -15 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5, transform: `translate(${-220 + k * 110} 30)` }, g)
      return s
    })
    txt(g, 'AVIS CLIENTS', { x: 0, y: 140, 'font-size': 40, fill: '#6b7280' })
  })
  // L'éthylotest : 1,8 g/L.
  const ethylo = prop((g) => {
    svg('rect', { x: -170, y: -280, width: 340, height: 560, rx: 60, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -40, y: -360, width: 80, height: 100, rx: 18, fill: '#e5e7eb', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('rect', { x: -130, y: -200, width: 260, height: 170, rx: 14, fill: '#2a120a' }, g)
    g.val = txt(g, '0,0', { x: 0, y: -90, 'font-size': 96, fill: '#ff5a5a', 'font-family': 'DejaVu Sans Mono, monospace' })
    txt(g, 'g / L', { x: 0, y: 30, 'font-size': 44, fill: '#9aa6b8' })
    g.led = svg('circle', { cx: 0, cy: 150, r: 40, fill: '#e5484d' }, g)
  })
  // Deux ans de prison.
  const prison = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 20, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '2 ANS', { x: 0, y: 60, 'font-size': 170, fill: '#e5484d' })
    for (let i = 0; i < 6; i++) svg('rect', { x: -270 + i * 104, y: -260, width: 22, height: 520, rx: 11, fill: 'url(#bar)' }, g)
  })
  // Les enfants, rentrés à la maison.
  const photo = prop((g) => {
    svg('rect', { x: -260, y: -250, width: 520, height: 500, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, g)
    const cl = svg('clipPath', { id: 'kidsClip' }, defs)
    svg('rect', { x: -230, y: -220, width: 460, height: 340 }, cl)
    const inner = svg('g', { 'clip-path': 'url(#kidsClip)' }, g)
    svg('rect', { x: -230, y: -220, width: 460, height: 340, fill: '#f6c98a' }, inner)
    svg('rect', { x: 80, y: -190, width: 110, height: 120, fill: '#9fd8ff', stroke: '#c48a4a', 'stroke-width': 8 }, inner)
    g.k1 = makePerson(inner, KID1)
    g.k2 = makePerson(inner, KID2)
    txt(g, 'RENTRÉS VIVANTS', { x: 0, y: 200, 'font-size': 44, fill: '#1d2a5c' })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, grise, bulles, tel, panneaux, panne, parking, avis, ethylo, prison, photo }
})

// 5 · Le vote, puis l'appel à l'abonnement : la démo du « + ».
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, SAMIR_BOX)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.8 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  // Hors caméra : l'écran d'abonnement.
  const cta = svg('g', {}, L.fx.parentNode)
  const dim = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#05070f', opacity: 0 }, cta)
  // La carte de profil.
  const card = svg('g', {}, cta)
  svg('rect', { x: -400, y: -340, width: 800, height: 660, rx: 48, fill: '#000', opacity: 0.35, transform: 'translate(0 18)' }, card)
  svg('rect', { x: -400, y: -340, width: 800, height: 660, rx: 48, fill: '#ffffff' }, card)
  const avClip = svg('clipPath', { id: 'avClip' }, defs)
  svg('circle', { cx: 0, cy: -150, r: 140 }, avClip)
  svg('circle', { cx: 0, cy: -150, r: 152, fill: '#fe2c55' }, card)
  svg('circle', { cx: 0, cy: -150, r: 144, fill: '#ffffff' }, card)
  const avatar = svg('image', { x: -140, y: -290, width: 280, height: 280, 'clip-path': 'url(#avClip)', preserveAspectRatio: 'xMidYMid slice' }, card)
  const ripple = [0, 1, 2].map(() => svg('circle', { cx: 0, cy: -10, r: 46, fill: 'none', stroke: '#fe2c55', 'stroke-width': 10, opacity: 0 }, card))
  const plus = svg('g', { transform: 'translate(0 -10)' }, card)
  const plusDisc = svg('circle', { r: 46, fill: '#fe2c55', stroke: '#fff', 'stroke-width': 8 }, plus)
  const plusSign = svg('path', { d: 'M -20 0 L 20 0 M 0 -20 L 0 20', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round' }, plus)
  const plusCheck = svg('path', { d: 'M -20 2 L -6 16 L 22 -14', fill: 'none', stroke: '#fe2c55', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, plus)
  txt(card, '@affaireclassee0', { x: 0, y: 108, 'font-size': 60, fill: '#10121a' })
  txt(card, 'Affaire Classée ?', { x: 0, y: 160, 'font-size': 36, fill: '#6b7280', 'font-weight': 700 })
  const btn = svg('g', { transform: 'translate(0 248)' }, card)
  const btnBg = svg('rect', { x: -290, y: -52, width: 580, height: 104, rx: 18, fill: '#fe2c55' }, btn)
  const btnOn = txt(btn, 'S’ABONNER', { x: 0, y: 20, 'font-size': 56, fill: '#fff' })
  const btnDone = svg('g', {}, btn)
  txt(btnDone, 'ABONNÉ', { x: 26, y: 20, 'font-size': 56, fill: '#10121a' })
  svg('path', { d: 'M -150 0 L -130 20 L -96 -18', fill: 'none', stroke: '#12a150', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, btnDone)
  // Les confettis.
  const r = rng(77)
  const confetti = Array.from({ length: 34 }, (_, k) => ({
    el: svg('rect', { x: -9, y: -5, width: 18, height: 10, rx: 3, fill: ['#fe2c55', '#ffd166', '#2fd27a', '#3b82f6', '#ffffff'][k % 5], opacity: 0 }, cta),
    a: r() * Math.PI * 2,
    v: 420 + r() * 520,
    spin: (r() - 0.5) * 1400,
  }))
  // Le doigt qui appuie.
  const finger = svg('g', {}, cta)
  svg('path', { d: 'M -26 0 L -26 -150 Q -26 -178 0 -178 Q 26 -178 26 -150 L 26 -40 L 70 -50 Q 100 -52 104 -24 L 110 60 Q 110 150 40 160 L -30 160 Q -80 150 -90 100 L -110 30 Q -118 4 -92 -2 Q -70 -6 -56 18 L -26 54 Z', fill: '#f2c49b', stroke: '#10121a', 'stroke-width': 7, 'stroke-linejoin': 'round' }, finger)
  svg('path', { d: 'M -16 -150 Q 0 -166 16 -150', fill: 'none', stroke: '#fff', 'stroke-width': 6, opacity: 0.6, 'stroke-linecap': 'round' }, finger)
  // La carte de juré officiel.
  const jure = svg('g', {}, cta)
  svg('rect', { x: -380, y: -120, width: 760, height: 240, rx: 26, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 8 }, jure)
  svg('rect', { x: -380, y: -120, width: 760, height: 46, rx: 22, fill: '#1d2a5c' }, jure)
  txt(jure, 'TRIBUNAL DES ABONNÉS', { x: 0, y: -86, 'font-size': 28, fill: '#ffd166' })
  const jClip = svg('clipPath', { id: 'jClip' }, defs)
  svg('circle', { cx: -270, cy: 30, r: 70 }, jClip)
  svg('circle', { cx: -270, cy: 30, r: 78, fill: '#10121a' }, jure)
  const avatar2 = svg('image', { x: -340, y: -40, width: 140, height: 140, 'clip-path': 'url(#jClip)', preserveAspectRatio: 'xMidYMid slice' }, jure)
  txt(jure, 'CARTE DE', { x: -170, y: -2, 'font-size': 40, fill: '#1d2a5c', 'text-anchor': 'start' })
  txt(jure, 'JURÉ OFFICIEL', { x: -170, y: 66, 'font-size': 62, fill: '#10121a', 'text-anchor': 'start' })
  const valide = svg('g', { transform: 'translate(250 70) rotate(-14)' }, jure)
  svg('rect', { x: -130, y: -44, width: 260, height: 88, rx: 14, fill: 'rgba(255,255,255,0.85)', stroke: '#12a150', 'stroke-width': 9 }, valide)
  txt(valide, 'VALIDÉ', { x: 0, y: 20, 'font-size': 56, fill: '#12a150' })
  return { actor, cta, dim, card, avatar, avatar2, ripple, plus, plusDisc, plusSign, plusCheck, btnBg, btnOn, btnDone, confetti, finger, jure, valide }
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
txt(rec, 'REC · CAM 02 · ATELIER', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
const T_FUSE = Wd('01', 'retire') - 0.1
const T_CONSOLE = Wd('02', 'canette') - 0.05
tag('IL A SABOTÉ SA VOITURE', 'pill red', { t0: 0, t1: Wd('01', 'expres') - 0.1, y: 250, rot: -2 })
fs(tag('EXPRÈS.', 'slam yellow', { t0: Wd('01', 'expres') - 0.06, t1: Wd('01', 'pendant') - 0.1, y: 300, rot: -3, from: 2.6, dur: 0.2 }), 170)
tag('PENDANT QU’IL PAYAIT…', 'pill', { t0: Wd('01', 'pendant') - 0.1, t1: Wd('01', 'fusible') - 0.1, y: 250, rot: -2 })
fs(tag('UN FUSIBLE.', 'slam white', { t0: Wd('01', 'fusible') - 0.06, t1: Wd('01', 'et') - 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 120)
fs(tag('C’EST LUI QU’ON JUGE', 'stamp', { t0: Wd('01', 'garagiste', 1) - 0.05, t1: SEC.emeute.t1, y: 320, rot: -6, from: 2.8, dur: 0.2 }), 80)
tag('IL TITUBE', 'pill red', { t0: Wd('02', 'titubant') - 0.1, t1: Wd('02', 'enfants') - 0.1, y: 300, rot: -2 })
tag('2 ENFANTS À L’ARRIÈRE', 'pill yellow', { t0: Wd('02', 'enfants') - 0.1, t1: Wd('02', 'cles') - 0.1, y: 300, rot: -2 })
tag('LES CLÉS…', 'pill', { t0: Wd('02', 'cles') - 0.1, t1: T_CONSOLE - 0.05, y: 300, rot: -2 })
fs(tag('ET UNE CANETTE.', 'slam white', { t0: T_CONSOLE, t1: SEC.video.t1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 100)
fs(tag('JUGÉ', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
tag('PAS SA VOITURE', 'pill', { t0: Wd('04', 'appartenait') - 0.1, t1: Wd('04', 'justice') - 0.1, y: 230, rot: -2 })
fs(tag('JUSTICE LUI-MÊME.', 'slam white', { t0: Wd('04', 'justice') - 0.06, t1: E('04') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 92)
tag('IL A DEMANDÉ LES CLÉS', 'pill yellow', { t0: Wd('05', 'demande') - 0.1, t1: Wd('05', 'poliment') - 0.1, y: 230, rot: -2 })
fs(tag('POLIMENT.', 'slam yellow', { t0: Wd('05', 'poliment') - 0.06, t1: Wd('05', 'insulte') - 0.1, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 150)
tag('INSULTÉ. IL DÉMARRE.', 'pill red', { t0: Wd('05', 'insulte') - 0.1, t1: E('05') + 0.1, y: 230, rot: -2 })
tag('APPELER LA POLICE', 'pill', { t0: Wd('06', 'appeler') - 0.1, t1: Wd('06', 'pas') - 0.1, y: 230, rot: -2 })
fs(tag('PAS SON MÉTIER.', 'slam white', { t0: Wd('06', 'pas') - 0.06, t1: E('06') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 104)
counterTag(Wd('07', 'quarante') - 0.1, Wd('07', 'route') - 0.1, 40, 'MINUTES', { y: 230, dur: 0.6 })
fs(tag('L’ÉCOLE : 2 MIN.', 'slam yellow', { t0: Wd('07', 'deux') - 0.06, t1: E('07') + 0.15, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 110)
tag('EN PANNE AU BORD DE LA ROUTE', 'pill red', { t0: Wd('08', 'panne') - 0.1, t1: Wd('08', 'avec') - 0.1, y: 230, rot: -2 }).el.style.fontSize = '46px'
fs(tag('AVEC 2 ENFANTS.', 'slam white', { t0: Wd('08', 'avec') - 0.06, t1: E('08') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 104)
tag('JAMAIS QUITTÉ LE PARKING', 'pill yellow', { t0: Wd('09', 'jamais') - 0.1, t1: Wd('09', 'but') - 0.2, y: 230, rot: -2 }).el.style.fontSize = '50px'
fs(tag('TOUT LE BUT.', 'slam yellow', { t0: Wd('09', 'but') - 0.1, t1: E('09') + 0.15, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 130)
tag('QUI PEUT CONDUIRE ?', 'pill', { t0: Wd('10', 'decide') - 0.1, t1: Wd('10', 'plus') - 0.1, y: 230, rot: -2 })
fs(tag('PLUS AUCUN CLIENT.', 'slam white', { t0: Wd('10', 'plus') - 0.06, t1: E('10') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 92)
tag('UNE HEURE PLUS TARD', 'pill', { t0: Wd('11', 'heure') - 0.1, t1: Wd('11', 'gramme') - 0.3, y: 230, rot: -2 })
fs(tag('1,8 G/L', 'slam yellow', { t0: Wd('11', 'gramme') - 0.3, t1: Wd('11', 'trois') - 0.1, y: 230, rot: -3, from: 3, dur: 0.2 }), 170)
tag('3 FOIS LA LIMITE', 'pill red', { t0: Wd('11', 'trois') - 0.1, t1: E('11') + 0.15, y: 230, rot: -2 })
tag('2 ANS DE PRISON', 'pill red', { t0: Wd('12', 'deux') - 0.1, t1: Wd('12', 'pas') - 0.1, y: 240, rot: -2 })
fs(tag('PAS LA SIENNE.', 'slam white', { t0: Wd('12', 'pas') - 0.06, t1: E('12') + 0.1, y: 240, rot: -3, from: 2.4, dur: 0.2 }), 110)
tag('POUR UN FUSIBLE', 'pill yellow', { t0: Wd('13', 'fusible') - 0.1, t1: Wd('13', 'et') - 0.1, y: 240, rot: -2 })
fs(tag('ET C’EST LUI QU’ON JUGE ?', 'slam yellow', { t0: Wd('13', 'et') - 0.1, t1: E('13') + 0.15, y: 260, rot: -3, from: 3, dur: 0.2 }), 76)
// Le vote.
const T_CTA = S('15')
const T_TAP = Wd('15', 'plus') - 0.02
const T_RESET = Wd('15', 'jamais') + 0.7
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, t1: T_CTA, y: 330, from: 1.4, dur: 0.5 }), 110)
tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, t1: T_CTA, y: 560, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, t1: T_CTA, y: 750, rot: 3 })
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE', 'pill yellow', { t0: Wd('14', 'ecris') - 0.1, t1: T_CTA, y: 930, rot: -1 }), 42)
// L'abonnement.
fs(tag('LE VERDICT ? DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('15', 'verdict') - 0.1, y: 250, rot: -1 }), 44)
fs(tag('APPUIE SUR LE +', 'big white', { t0: Wd('15', 'appuie') - 0.1, t1: Wd('15', 'jure') - 0.15, y: 1600, from: 1.6, dur: 0.3 }), 96)
fs(tag('SINON… TU NE SAURAS JAMAIS', 'pill red', { t0: Wd('15', 'sinon') - 0.1, t1: T_RESET, y: 1620, rot: -2 }), 50)
fs(tag('À TOI DE JOUER, JURÉ', 'big white', { t0: T_RESET, y: 1620, from: 1.6, dur: 0.35 }), 84)

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
  [Wd('01', 'expres') - 0.06, 14],
  [Wd('01', 'fusible') - 0.06, 16],
  [Wd('01', 'garagiste', 1) - 0.05, 12],
  [T_CONSOLE, 14],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'justice') - 0.06, 12],
  [Wd('05', 'poliment') - 0.06, 12],
  [Wd('06', 'pas') - 0.06, 10],
  [Wd('07', 'deux') - 0.06, 14],
  [Wd('08', 'avec') - 0.06, 12],
  [Wd('09', 'but') - 0.1, 12],
  [Wd('10', 'plus') - 0.06, 12],
  [Wd('11', 'gramme') - 0.3, 16],
  [Wd('12', 'pas') - 0.06, 14],
  [Wd('13', 'et') - 0.1, 16],
  [Wd('14', 'jure') - 0.15, 8],
  [T_TAP, 6],
  [Wd('15', 'officiel') - 0.05, 8],
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

  // L'atelier (scènes 1 et 2).
  const shop = (B, tt, { fuseUp = 0, payArm = 0, enter = 1, sway = 0, keysOn = 0, canOn = 0, worried = 0, samirLook = 0 } = {}) => {
    B.car.setHood(1)
    B.car.kidsUpdate(tt, worried)
    // Samir, au capot.
    const sArm = [lerp(0.35, 2.5, fuseUp), lerp(0.9, 0.35, fuseUp)]
    const sx = 250
    const sy = 790
    B.samir.update(tt, { x: sx, y: sy, scale: 0.68, brows: fuseUp > 0.3 ? 'determined' : 'neutral', look: [samirLook, 0.2], armR: sArm, armL: [0.2, 0.5], seed: 1.3, headTilt: 0.06 })
    const [fx, fy] = handAt(sx, sy, 0.68, sArm, 1)
    show(B.fuseG, fuseUp > 0.02)
    place(B.fuseG, fx, fy - 26 * fuseUp, 0.6 + 1.1 * ease.out3(fuseUp), -12 * fuseUp)
    B.car.slot.setAttribute('fill', fuseUp > 0.05 ? '#000' : '#e5484d')
    // Le client, à la caisse (ou qui arrive en titubant).
    const cx = lerp(1260, 850, enter) + 22 * sway * Math.sin(tt * 2.6)
    const cy = 770 + 8 * sway * Math.sin(tt * 5.2)
    const armL = [lerp(0.2, 0.55, Math.max(payArm, keysOn)), lerp(0.5, 1.0, Math.max(payArm, keysOn))]
    const armR = [lerp(0.2, 0.9, canOn), lerp(0.5, 1.3, canOn)]
    B.client.update(tt, { x: cx, y: cy, scale: 0.66, brows: sway > 0.5 ? 'sad' : 'neutral', look: [-0.5, 0.2], mouth: sway > 0.5 ? 0.15 : 0, armR, armL, seed: 2.2, headTilt: sway * 0.5 * Math.sin(tt * 2.6 + 1), blink: sway > 0.5 ? 0.45 : null })
    const [tx, ty] = handAt(cx, cy, 0.66, armL, -1)
    place(B.term, 540, 860, 0.9, -8)
    show(B.term, payArm > 0.01)
    B.screen.setAttribute('fill', payArm > 0.9 ? '#2fd27a' : '#9fd8ff')
    show(B.keysG, keysOn > 0.01)
    place(B.keysG, tx, ty + 10, 0.8 * keysOn, 10 * Math.sin(tt * 4))
    const [kx, ky] = handAt(cx, cy, 0.66, armR, 1)
    show(B.canG, canOn > 0.01)
    place(B.canG, kx, ky - 40, 1.35 * canOn, 8)
    return { can: [kx, ky - 40] }
  }
  if (cur === EMEUTE) {
    const a = prog(t, Wd('01', 'pendant') - 0.25, 0.5, ease.io3)
    const b = prog(t, T_FUSE - 0.3, 0.45, ease.io3)
    const c = prog(t, Wd('01', 'et') - 0.15, 0.6, ease.io3)
    const zoom = lerp(lerp(lerp(1.0, 1.28, a), 1.36, b), 1.04, c)
    const cx = lerp(lerp(lerp(540, 760, a), 290, b), 540, c)
    const cy = lerp(lerp(lerp(1000, 920, a), 930, b), 990, c)
    cam(EMEUTE, t, { zoom, cx, cy, push: 0.012, hand: 3 })
    const pay = prog(t, Wd('01', 'pendant') - 0.2, 0.4, ease.out3) * (t > Wd('01', 'payait') + 0.3 ? 1 : 0.85)
    const fuseUp = prog(t, T_FUSE, 0.4, ease.out3)
    shop(EMEUTE, t, { payArm: pay, fuseUp, samirLook: 0.6 })
  }
  if (cur === VIDEO) {
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    const enter = prog(tt, Wd('02', 'lhomme') - 0.3, 1.4, ease.out3)
    const keysOn = prog(tt, Wd('02', 'cles') - 0.15, 0.3, ease.out3)
    const canOn = prog(tt, T_CONSOLE - 0.35, 0.3, ease.out3)
    const kidsZ = prog(tt, Wd('02', 'enfants') - 0.3, 0.4, ease.io3) * (1 - prog(tt, Wd('02', 'cles') - 0.3, 0.4, ease.io3))
    const P = shop(VIDEO, tt, { enter, sway: 1, keysOn, canOn, worried: 1, samirLook: 0.8 })
    const zoomC = frozen ? 0.12 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 0
    cam(VIDEO, tt, { zoom: 1.0 + 0.25 * kidsZ + zoomC, cx: frozen ? (P.can[0] + 850) / 2 : lerp(560, 790, kidsZ), cy: frozen ? (P.can[1] + 640) / 2 + 90 : lerp(1000, 1060, kidsZ), push: 0.006, hand: 0 })
    place(VIDEO.ring, P.can[0], P.can[1], 1, 0)
    VIDEO.ring.setAttribute('stroke-dashoffset', 760 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    VIDEO.ringKids.setAttribute('stroke-dashoffset', 840 * (1 - prog(t, Wd('02', 'enfants') - 0.05, 0.4, ease.out3)))
    VIDEO.ringKids.setAttribute('opacity', 1 - prog(t, Wd('02', 'cles') - 0.2, 0.3))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `18:32:${String(10 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['samir', 'quarante', 'garagiste', 'jamais']
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
    if (prop(TRIB.grise, id === '04', Wd('04', 'voiture') - 0.2, E('04') + 0.05, 540, 530, 0.78, -3) > 0) TRIB.grise.stamp.setAttribute('opacity', t > Wd('04', 'appartenait') + 0.2 ? 1 : 0)
    if (prop(TRIB.bulles, id === '05', Wd('05', 'demande') - 0.2, E('05') + 0.05, 540, 500, 0.75) > 0) {
      TRIB.bulles.a.setAttribute('opacity', 1)
      const b = popS(t, Wd('05', 'insulte') - 0.15, Infinity, 0.3)
      TRIB.bulles.b.setAttribute('transform', `translate(110 150) scale(${Math.max(0.001, b)}) rotate(${3 * Math.sin(t * 20) * b})`)
    }
    prop(TRIB.tel, id === '06', Wd('06', 'appeler') - 0.2, E('06') + 0.05, 540, 490, 0.6, 6)
    if (prop(TRIB.panneaux, id === '07', Wd('07', 'temps') - 0.2, E('07') + 0.05, 540, 550, 0.58) > 0) {
      TRIB.panneaux.police.setAttribute('opacity', 1)
      const e = popS(t, Wd('07', 'route') - 0.15, Infinity, 0.3)
      TRIB.panneaux.ecole.setAttribute('transform', `translate(0 20) scale(${Math.max(0.001, e)})`)
    }
    if (prop(TRIB.panne, id === '08', Wd('08', 'fusible') - 0.2, E('08') + 0.05, 540, 490, 0.78) > 0) {
      TRIB.panne.car.kidsUpdate(t, 1)
      TRIB.panne.tri.setAttribute('opacity', Math.floor(t * 3) % 2 ? 0.35 : 1)
    }
    if (prop(TRIB.parking, id === '09', Wd('09', 'jamais') - 0.25, E('09') + 0.05, 540, 490, 0.74) > 0) {
      TRIB.parking.car.kidsUpdate(t, 0)
      const s = popS(t, Wd('09', 'demarre') - 0.15, Infinity, 0.25)
      TRIB.parking.stamp.setAttribute('transform', `translate(40 170) rotate(-8) scale(${Math.max(0.001, s)})`)
    }
    if (prop(TRIB.avis, id === '10', Wd('10', 'garagiste') - 0.2, E('10') + 0.05, 540, 490, 0.85) > 0) {
      TRIB.avis.stars.forEach((s, k) => {
        const d = prog(t, Wd('10', 'plus') + 0.1 + (4 - k) * 0.12, 0.5, ease.in3)
        const fall = k > 0 ? d : 0
        s.setAttribute('transform', `translate(${-220 + k * 110} ${30 + 420 * fall}) rotate(${200 * fall})`)
        s.setAttribute('opacity', 1 - fall)
      })
    }
    if (prop(TRIB.ethylo, id === '11', Wd('11', 'dalcool') - 0.2, E('11') + 0.05, 540, 545, 0.52) > 0) {
      const v = 1.8 * ease.out3(prog(t, Wd('11', 'gramme') - 0.5, 0.8))
      TRIB.ethylo.val.textContent = v.toFixed(1).replace('.', ',')
      TRIB.ethylo.led.setAttribute('opacity', v > 1.7 && Math.floor(t * 4) % 2 ? 1 : 0.3)
    }
    prop(TRIB.prison, id === '12', Wd('12', 'deux') - 0.15, E('12') + 0.05, 540, 480, 0.62)
    if (prop(TRIB.photo, id === '13', Wd('13', 'enfants') - 0.15, E('13') + 0.05, 540, 490, 0.68, 4) > 0) {
      TRIB.photo.k1.update(t, { x: -80, y: 110, scale: 0.42, brows: 'neutral', mouth: 0.25, look: [0.2, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 5 })
      TRIB.photo.k2.update(t, { x: 90, y: 120, scale: 0.4, brows: 'neutral', mouth: 0.3, look: [-0.2, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 6 })
    }
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
    VOTE.dim.setAttribute('opacity', 0.72 * prog(t, T_CTA - 0.1, 0.4, ease.out3))
    const cIn = popS(t, Wd('15', 'tombe') - 0.1, Infinity, 0.45)
    show(VOTE.card, cIn > 0.01)
    const reset = t > T_RESET
    const pulse = reset ? 1 + 0.06 * Math.max(0, Math.sin((t - T_RESET) * 7)) : 1
    place(VOTE.card, 540, 800, cIn * 0.95, 0)
    // Le doigt arrive, appuie sur le +, repart.
    const fin = prog(t, Wd('15', 'appuie') - 0.1, T_TAP - Wd('15', 'appuie') + 0.05, ease.io3)
    const out = prog(t, T_TAP + 0.35, 0.4, ease.in3)
    const press = t > T_TAP - 0.06 && t < T_TAP + 0.14 ? 0.86 : 1
    show(VOTE.finger, fin > 0.01 && out < 0.99)
    const fsc = 0.9 * press
    place(VOTE.finger, lerp(940, 540, fin) + 380 * out, lerp(1700, 790 + 178 * fsc, fin) + 600 * out, fsc, lerp(-25, 0, fin))
    const done = t > T_TAP + 0.06 && !reset
    VOTE.plusSign.setAttribute('opacity', done ? 0 : 1)
    VOTE.plusCheck.setAttribute('opacity', done ? 1 : 0)
    VOTE.plusDisc.setAttribute('fill', done ? '#ffffff' : '#fe2c55')
    VOTE.plus.setAttribute('transform', `translate(0 -10) scale(${(done ? 1 + 0.25 * Math.exp(-(t - T_TAP) * 6) : pulse).toFixed(3)})`)
    VOTE.btnBg.setAttribute('fill', done ? '#e5e7eb' : '#fe2c55')
    show(VOTE.btnOn, !done)
    show(VOTE.btnDone, done)
    VOTE.ripple.forEach((c, k) => {
      const base = reset ? T_RESET + Math.floor((t - T_RESET) / 1.2) * 1.2 : T_TAP
      const u = (t - base - k * 0.12) / 0.7
      const on = t > T_TAP && u > 0 && u < 1
      c.setAttribute('opacity', on ? (1 - u) * 0.8 : 0)
      c.setAttribute('r', 46 + 120 * u)
    })
    for (const p of VOTE.confetti) {
      const u = t - T_TAP
      const on = u > 0 && u < 1.6
      p.el.setAttribute('opacity', on ? Math.min(1, 2 * (1.6 - u)) : 0)
      if (!on) continue
      const x = 540 + Math.cos(p.a) * p.v * u
      const y = 790 + Math.sin(p.a) * p.v * u + 900 * u * u
      p.el.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(p.spin * u).toFixed(0)})`)
    }
    // La carte de juré.
    const j = prog(t, Wd('15', 'jure') - 0.2, 0.4, ease.out3)
    show(VOTE.jure, j > 0.01)
    place(VOTE.jure, 540, lerp(2100, 1330, j), 0.92, lerp(8, -3, j))
    const v = popS(t, Wd('15', 'officiel') - 0.05, Infinity, 0.22)
    VOTE.valide.setAttribute('transform', `translate(250 70) rotate(-14) scale(${Math.max(0.001, lerp(2.4, 1, Math.min(1, v)) * (v > 0.01 ? 1 : 0))})`)
    VOTE.valide.setAttribute('opacity', v > 0.01 ? 1 : 0)
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
  const blob = await (await fetch('../proces/marque/photo-de-profil.png')).blob()
  const url = await new Promise((res) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.readAsDataURL(blob)
  })
  for (const im of [VOTE.avatar, VOTE.avatar2]) im.setAttribute('href', url)
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
