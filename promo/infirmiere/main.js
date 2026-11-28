/**
 * ============================================================================
 *  « Affaire Classée ? » — l’infirmière (≈ 76 s, 1080 × 1920)
 * ============================================================================
 *  Style A : motion design 2D vectoriel en SVG, gros sous-titres animés.
 *
 *  1. La rue, la nuit, devant l'hôpital : Camille et Gérard dès la première
 *     image ; « PENDANT 14 MOIS » placé pour rester lisible dans la grille.
 *  2. La caméra du parking (cadre REC) : elle s'agenouille, défait le bandage…
 *  3. Sa fiche : 34 ans, infirmière depuis 12 ans… tampon « JUGÉE ».
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
grad('nuit', [[0, '#0b1230'], [0.6, '#1d2a5c'], [1, '#2a3350']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
const CAMILLE = { robe: '#3fa7a3', jabot: false, vneck: '#e8f4f4', hair: 'bun', hairColor: '#6a4228', female: true, skin: '#f0c4a0', iris: '#3b5b8a' }
const CAMILLE_BOX = { ...CAMILLE, robe: '#6b7280', vneck: null, collar: '#e5e7eb' }
const GERARD = { robe: '#5a4a3a', jabot: false, collar: '#8a7a6a', hair: 'messy', hairColor: '#b8b8b8', beard: true, skin: '#e8b48c', iris: '#3b5b8a' }

// Une boîte de soins (compresses, pansements…).
function box(parent, label, color = '#3b82f6', s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('rect', { x: -70, y: -44, width: 140, height: 88, rx: 10, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 6 }, g)
  svg('rect', { x: -70, y: -44, width: 140, height: 26, rx: 8, fill: color }, g)
  svg('path', { d: 'M -10 4 L 10 4 M 0 -6 L 0 14', stroke: '#e5484d', 'stroke-width': 7, 'stroke-linecap': 'round' }, g)
  txt(g, label, { x: 0, y: 36, 'font-size': 18, fill: '#10121a' })
  return g
}
// La jambe de Gérard, tendue sur le trottoir, et son bandage.
function leg(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: 0, y: -40, width: 330, height: 80, rx: 36, fill: '#3a4256', stroke: '#10121a', 'stroke-width': 6 }, g)
  svg('path', { d: 'M 320 -46 L 380 -46 Q 410 -46 410 -10 L 410 40 L 320 40 Z', fill: '#2a1f18', stroke: '#10121a', 'stroke-width': 6 }, g)
  g.wound = svg('ellipse', { cx: 230, cy: 0, rx: 44, ry: 26, fill: '#d9707a', opacity: 0 }, g)
  g.band = [0, 1, 2, 3].map((k) => svg('rect', { x: 170 + k * 30, y: -44, width: 24, height: 88, rx: 6, fill: '#fbf8f0', stroke: '#c9c2b0', 'stroke-width': 3 }, g))
  return g
}

// La rue, la nuit, devant l'hôpital : Camille, Gérard sur son carton.
function rue(L, id) {
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#nuit)' }, L.far)
  const r = rng(5)
  for (let i = 0; i < 40; i++) svg('circle', { cx: r() * W, cy: 60 + r() * 400, r: 2 + r() * 3, fill: '#fff', opacity: 0.6 }, L.far)
  // L'hôpital.
  svg('rect', { x: -200, y: 300, width: 760, height: 1000, fill: '#dfe6ee' }, L.far)
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) svg('rect', { x: -150 + x * 170, y: 360 + y * 150, width: 110, height: 90, rx: 6, fill: (x + y) % 3 ? '#ffe7a0' : '#4a5a7a' }, L.far)
  svg('rect', { x: 120, y: 640, width: 380, height: 90, rx: 12, fill: '#e5484d' }, L.far)
  txt(L.far, 'URGENCES', { x: 310, y: 702, 'font-size': 58, fill: '#fff' })
  svg('rect', { x: 180, y: 1100, width: 260, height: 200, fill: '#9fc4e0', stroke: '#7a869e', 'stroke-width': 8 }, L.far)
  // Le réverbère.
  svg('rect', { x: 960, y: 520, width: 20, height: 800, fill: '#2b3344' }, L.far)
  svg('path', { d: 'M 970 520 Q 970 480 900 480 L 880 480', fill: 'none', stroke: '#2b3344', 'stroke-width': 18 }, L.far)
  svg('path', { d: 'M 860 490 L 1100 1300 L 600 1300 Z', fill: 'url(#beam)', opacity: 0.55 }, L.far)
  svg('rect', { x: -400, y: 1290, width: W + 800, height: 1000, fill: '#3a3f4a' }, L.far)
  svg('rect', { x: -400, y: 1290, width: W + 800, height: 16, fill: '#6b7280' }, L.far)
  // Gérard, assis contre le mur, sur son carton.
  svg('rect', { x: 600, y: 1240, width: 470, height: 70, rx: 6, fill: '#b98a4a', stroke: '#6a4a20', 'stroke-width': 5 }, L.mid)
  const gerard = makePerson(L.actor, GERARD)
  const legG = svg('g', {}, L.actor)
  const l = leg(legG)
  const camille = makePerson(L.actor, CAMILLE)
  // Le sac, et les boîtes qui sortent des poches.
  const bag = svg('g', {}, L.actor)
  svg('path', { d: 'M -60 -40 L 60 -40 L 76 70 L -76 70 Z', fill: '#2b3344', stroke: '#10121a', 'stroke-width': 6 }, bag)
  svg('path', { d: 'M -36 -40 Q 0 -100 36 -40', fill: 'none', stroke: '#10121a', 'stroke-width': 10 }, bag)
  const items = [['PANSEMENTS', '#3b82f6'], ['COMPRESSES', '#2fd27a'], ['BANDES', '#ff9e4f']].map(([lab, c]) => {
    const g = svg('g', {}, L.fx)
    box(g, lab, c, 1)
    return g
  })
  return { gerard, legG, leg: l, camille, bag, items }
}

// 1 · La rue : quatorze mois, chaque soir.
const EMEUTE = scene('emeute', (L) => rue(L, 'a'))

// 2 · La caméra du parking.
const VIDEO = scene('video', (L) => {
  const B = rue(L, 'b')
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#3f7a52', opacity: 0.22 }, L.fx)
  for (let y = -200; y < H + 200; y += 12) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#000', opacity: 0.18 }, L.fx)
  const ring = svg('ellipse', { cx: 0, cy: 0, rx: 150, ry: 100, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 820, 'stroke-dashoffset': 820 }, L.fx)
  return { ...B, ring }
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
  const ines = makePerson(photo, CAMILLE)
  const rows = ['CAMILLE', '34 ANS', 'INFIRMIÈRE · 12 ANS', '0 REPROCHE'].map((s, k) => {
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
  // La facture : quatorze mois de matériel.
  const facture = prop((g) => {
    svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'MATÉRIEL SORTI', { x: 0, y: -220, 'font-size': 46, fill: '#1d2a5c' })
    for (let k = 0; k < 6; k++) {
      svg('rect', { x: -210, y: -170 + k * 50, width: 260, height: 16, rx: 8, fill: '#c9d6e8' }, g)
      svg('rect', { x: 120, y: -170 + k * 50, width: 90, height: 16, rx: 8, fill: '#9aa6b8' }, g)
    }
    svg('rect', { x: -230, y: 150, width: 460, height: 4, fill: '#10121a' }, g)
    g.total = txt(g, 'PAYÉ PAR : NOUS TOUS', { x: 0, y: 230, 'font-size': 42, fill: '#e5484d' })
  })
  // La balance : deux euros contre une jambe.
  const balance = prop((g) => {
    svg('rect', { x: -10, y: -220, width: 20, height: 400, fill: '#9aa3b5' }, g)
    svg('rect', { x: -120, y: 170, width: 240, height: 30, rx: 10, fill: '#9aa3b5' }, g)
    g.beam = svg('g', { transform: 'translate(0 -200)' }, g)
    svg('rect', { x: -280, y: -10, width: 560, height: 20, rx: 10, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, g.beam)
    g.left = svg('g', { transform: 'translate(-250 0)' }, g.beam)
    g.right = svg('g', { transform: 'translate(250 0)' }, g.beam)
    for (const p of [g.left, g.right]) {
      svg('path', { d: 'M 0 0 L -80 120 M 0 0 L 80 120', stroke: '#10121a', 'stroke-width': 4 }, p)
      svg('path', { d: 'M -100 120 L 100 120 Q 80 160 0 160 Q -80 160 -100 120 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, p)
    }
    const a = svg('g', { transform: 'translate(0 70) scale(0.95)' }, g.left)
    box(a, '2 €', '#3b82f6', 1)
    const b = svg('g', { transform: 'translate(-110 105) scale(0.55)' }, g.right)
    leg(b)
  })
  // L'ordonnance barrée.
  const ordonnance = prop((g) => {
    svg('rect', { x: -240, y: -300, width: 480, height: 600, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'ORDONNANCE', { x: 0, y: -210, 'font-size': 52, fill: '#1d2a5c' })
    for (let k = 0; k < 5; k++) svg('rect', { x: -190, y: -150 + k * 60, width: 380 - k * 40, height: 16, rx: 8, fill: '#c9d6e8' }, g)
    txt(g, 'MÉDECIN : —', { x: -190, y: 200, 'font-size': 40, fill: '#6b7280', 'text-anchor': 'start' })
    g.cross = svg('path', { d: 'M -200 -260 L 200 260 M 200 -260 L -200 260', stroke: '#e5484d', 'stroke-width': 26, 'stroke-linecap': 'round' }, g)
  })
  // Les urgences : la pendule, trois passages.
  const urgences = prop((g) => {
    svg('rect', { x: -320, y: -260, width: 640, height: 120, rx: 16, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'URGENCES', { x: 0, y: -175, 'font-size': 74, fill: '#fff' })
    svg('circle', { cx: -130, cy: 90, r: 150, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 10 }, g)
    g.arc = svg('path', { fill: '#e5484d', opacity: 0.35, transform: 'translate(-130 90)' }, g)
    g.hand = svg('rect', { x: -6, y: -120, width: 12, height: 120, rx: 6, fill: '#10121a' }, g)
    g.tally = [0, 1, 2].map((k) => svg('rect', { x: 110 + k * 50, y: 10, width: 24, height: 160, rx: 10, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 5 }, g))
  })
  // Les placards de l'hôpital.
  const placard = prop((g) => {
    svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 14, fill: '#dfe6ee', stroke: '#10121a', 'stroke-width': 8 }, g)
    for (let k = 0; k < 3; k++) {
      svg('rect', { x: -240, y: -180 + k * 170, width: 480, height: 14, fill: '#9aa6b8' }, g)
      for (let i = 0; i < 3; i++) {
        const b = svg('g', { transform: `translate(${-150 + i * 150} ${-215 + k * 170}) scale(0.7)` }, g)
        box(b, '', ['#3b82f6', '#2fd27a', '#ff9e4f'][(i + k) % 3], 1)
      }
    }
    g.doors = [-1, 1].map((s) => svg('rect', { x: s < 0 ? -260 : 0, y: -300, width: 260, height: 600, rx: 10, fill: '#a9b6c8', stroke: '#10121a', 'stroke-width': 6 }, g))
  })
  // La poubelle : les boîtes périmées.
  const poubelle = prop((g) => {
    svg('path', { d: 'M -200 -120 L 200 -120 L 170 280 L -170 280 Z', fill: '#4a5568', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -230, y: -150, width: 460, height: 40, rx: 12, fill: '#2b3344', stroke: '#10121a', 'stroke-width': 6 }, g)
    for (const [x, y, r, c] of [[-90, -190, -12, '#3b82f6'], [70, -200, 10, '#2fd27a'], [-10, -260, 4, '#ff9e4f']]) {
      const b = svg('g', { transform: `translate(${x} ${y}) rotate(${r})` }, g)
      box(b, 'ENTAMÉ', c, 1)
    }
    g.stamp = svg('g', { transform: 'translate(0 90) rotate(-10)' }, g)
    svg('rect', { x: -170, y: -50, width: 340, height: 100, rx: 14, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 10 }, g.stamp)
    txt(g.stamp, 'PÉRIMÉ', { x: 0, y: 24, 'font-size': 66, fill: '#e5484d' })
  })
  // Le procès-verbal : « VOL ».
  const pv = prop((g) => {
    svg('rect', { x: -250, y: -300, width: 500, height: 600, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'PROCÈS-VERBAL', { x: 0, y: -210, 'font-size': 46, fill: '#1d2a5c' })
    for (let k = 0; k < 6; k++) svg('rect', { x: -200, y: -150 + k * 55, width: 400 - (k % 2) * 80, height: 16, rx: 8, fill: '#c9d6e8' }, g)
    g.stamp = svg('g', { transform: 'translate(0 160) rotate(-12)' }, g)
    svg('rect', { x: -150, y: -70, width: 300, height: 140, rx: 18, fill: 'rgba(255,255,255,0.9)', stroke: '#e5484d', 'stroke-width': 12 }, g.stamp)
    txt(g.stamp, 'VOL', { x: 0, y: 40, 'font-size': 110, fill: '#e5484d' })
  })
  // Le compte rendu du chirurgien.
  const rapport = prop((g) => {
    svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -260, y: -300, width: 520, height: 90, rx: 10, fill: '#3fa7a3' }, g)
    txt(g, 'COMPTE RENDU', { x: 0, y: -240, 'font-size': 44, fill: '#fff' })
    txt(g, 'AMPUTATION :', { x: 0, y: -110, 'font-size': 48, fill: '#1d2a5c' })
    g.ok = txt(g, 'ÉVITÉE', { x: 0, y: -30, 'font-size': 76, fill: '#12a150' })
    g.walk = svg('g', { transform: 'translate(0 170)' }, g)
    svg('circle', { cx: 0, cy: -80, r: 26, fill: '#1d2a5c' }, g.walk)
    g.legs = svg('path', { stroke: '#1d2a5c', 'stroke-width': 20, 'stroke-linecap': 'round', fill: 'none' }, g.walk)
  })
  // Trois ans, et l'interdiction d'exercer.
  const prison = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 20, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '3 ANS', { x: 0, y: 60, 'font-size': 170, fill: '#e5484d' })
    for (let i = 0; i < 6; i++) svg('rect', { x: -270 + i * 104, y: -260, width: 22, height: 520, rx: 11, fill: 'url(#bar)' }, g)
  })
  // Gérard, debout.
  const photo = prop((g) => {
    svg('rect', { x: -260, y: -250, width: 520, height: 500, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, g)
    const cl = svg('clipPath', { id: 'gerardClip' }, defs)
    svg('rect', { x: -230, y: -220, width: 460, height: 340 }, cl)
    const inner = svg('g', { 'clip-path': 'url(#gerardClip)' }, g)
    svg('rect', { x: -230, y: -220, width: 460, height: 340, fill: '#bfe3f2' }, inner)
    svg('circle', { cx: 150, cy: -150, r: 40, fill: '#ffd166' }, inner)
    g.p = makePerson(inner, GERARD)
    txt(g, 'IL MARCHE', { x: 0, y: 200, 'font-size': 52, fill: '#1d2a5c' })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, facture, balance, ordonnance, urgences, placard, poubelle, pv, rapport, prison, photo }
})

// 5 · Le vote, puis l'appel à l'abonnement : la démo du « + ».
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, CAMILLE_BOX)
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
  txt(jure, 'JURÉ OFFICIEL', { x: -170, y: 66, 'font-size': 58, fill: '#10121a', 'text-anchor': 'start' })
  const valide = svg('g', { transform: 'translate(292 -66) rotate(-12)' }, jure)
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
txt(rec, 'REC · CAM 07 · PARKING', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
    const s = T.t0 <= 0 && t < 0.3 ? (t < T.t1 ? 1 : 0) : Math.min(popS(t, T.t0, Infinity, T.dur), t < T.t1 ? 1 : 1 - clamp((t - T.t1) / 0.1))
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

// Le hook (titres placés dans la zone visible de la grille du profil, entre 240 et 1680 px).
const T_CONSOLE = Wd('02', 'jambe') - 0.05
fs(tag('PENDANT 14 MOIS', 'pill red', { t0: 0, t1: Wd('01', 'vole') - 0.1, y: 420, rot: -2 }), 64)
fs(tag('ELLE A VOLÉ SON HÔPITAL', 'slam white', { t0: Wd('01', 'vole') - 0.06, t1: Wd('01', 'chaque') - 0.1, y: 500, rot: -3, from: 2.4, dur: 0.2 }), 74)
tag('CHAQUE SOIR', 'pill', { t0: Wd('01', 'chaque') - 0.1, t1: Wd('01', 'pansements') - 0.1, y: 420, rot: -2 })
fs(tag('DES PANSEMENTS PLEIN LES POCHES', 'pill yellow', { t0: Wd('01', 'pansements') - 0.1, t1: Wd('01', 'aujourdhui') - 0.1, y: 500, rot: -2 }), 46)
fs(tag('ACCUSÉE', 'stamp', { t0: Wd('01', 'accuses') - 0.05, t1: SEC.emeute.t1, y: 450, rot: -6, from: 2.8, dur: 0.2 }), 110)
tag('ELLE NE RENTRE PAS CHEZ ELLE', 'pill', { t0: Wd('02', 'rentre') - 0.1, t1: Wd('02', 'homme') - 0.1, y: 400, rot: -2 }).el.style.fontSize = '50px'
tag('UN HOMME À LA RUE', 'pill red', { t0: Wd('02', 'homme') - 0.1, t1: Wd('02', 'defait') - 0.1, y: 480, rot: -2 })
tag('ELLE DÉFAIT LE BANDAGE…', 'pill yellow', { t0: Wd('02', 'defait') - 0.1, t1: T_CONSOLE - 0.05, y: 400, rot: -2 })
fs(tag('ELLE SOIGNE SA JAMBE.', 'slam white', { t0: T_CONSOLE, t1: SEC.video.t1, y: 500, rot: -3, from: 2.4, dur: 0.2 }), 82)
fs(tag('JUGÉE', 'stamp', { t0: Wd('03', 'jugee') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
tag('14 MOIS DE VOL', 'pill red', { t0: S('04') - 0.05, t1: Wd('04', 'nous') - 0.1, y: 230, rot: -2 })
fs(tag('PAYÉ PAR NOUS TOUS.', 'slam white', { t0: Wd('04', 'nous') - 0.06, t1: E('04') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 92)
fs(tag('2 €', 'slam yellow', { t0: Wd('05', 'deux') - 0.06, t1: Wd('05', 'contre') - 0.05, y: 230, rot: -3, from: 3, dur: 0.2 }), 190)
tag('CONTRE UNE JAMBE', 'pill red', { t0: Wd('05', 'contre') - 0.05, t1: E('05') + 0.1, y: 230, rot: -2 })
tag('SOIGNER DEHORS ?', 'pill', { t0: Wd('06', 'soigner') - 0.1, t1: Wd('06', 'aucun') - 0.1, y: 230, rot: -2 })
fs(tag('SANS AUCUN CADRE.', 'slam white', { t0: Wd('06', 'aucun') - 0.06, t1: E('06') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 100)
tag('3 FOIS AUX URGENCES', 'pill yellow', { t0: Wd('07', 'trois') - 0.1, t1: Wd('07', 'six') - 0.1, y: 230, rot: -2 })
counterTag(Wd('07', 'six') - 0.1, Wd('07', 'renvoyait') - 0.25, 6, 'HEURES D’ATTENTE', { y: 230, dur: 0.4 })
tag('RENVOYÉ DEHORS', 'pill red', { t0: Wd('07', 'renvoyait') - 0.05, t1: E('07') + 0.1, y: 230, rot: -2 })
tag('SE SERVIR DANS LES PLACARDS', 'pill', { t0: Wd('08', 'sert') - 0.1, t1: Wd('08', 'lhopital') - 0.1, y: 230, rot: -2 }).el.style.fontSize = '50px'
fs(tag('L’HÔPITAL NE TIENT PAS.', 'slam white', { t0: Wd('08', 'lhopital') - 0.06, t1: E('08') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 80)
fs(tag('PAS SERVIE.', 'slam yellow', { t0: Wd('09', 'servie') - 0.06, t1: Wd('09', 'pris') - 0.1, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 140)
tag('CE QUI PARTAIT À LA POUBELLE', 'pill yellow', { t0: Wd('09', 'pris') - 0.1, t1: Wd('09', 'perimees') - 0.1, y: 230, rot: -2 }).el.style.fontSize = '48px'
tag('PÉRIMÉ DANS LA SEMAINE', 'pill red', { t0: Wd('09', 'perimees') - 0.1, t1: E('09') + 0.1, y: 230, rot: -2 })
tag('PAS À ELLE', 'pill', { t0: Wd('10', 'netait') - 0.1, t1: Wd('10', 'un') - 0.1, y: 230, rot: -2 })
fs(tag('UN VOL RESTE UN VOL.', 'slam white', { t0: Wd('10', 'un') - 0.06, t1: E('10') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 88)
tag('LE CHIRURGIEN CONFIRME', 'pill', { t0: Wd('11', 'chirurgien') - 0.1, t1: Wd('11', 'lamputation') - 0.1, y: 230, rot: -2 })
fs(tag('AMPUTATION ÉVITÉE.', 'slam yellow', { t0: Wd('11', 'lamputation') - 0.06, t1: Wd('11', 'marche') - 0.1, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 92)
fs(tag('IL MARCHE.', 'slam white', { t0: Wd('11', 'marche') - 0.06, t1: E('11') + 0.15, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 140)
tag('3 ANS DE PRISON', 'pill red', { t0: Wd('12', 'trois') - 0.1, t1: Wd('12', 'linterdiction') - 0.1, y: 240, rot: -2 })
fs(tag('INTERDITE D’EXERCER.', 'slam white', { t0: Wd('12', 'linterdiction') - 0.06, t1: E('12') + 0.1, y: 240, rot: -3, from: 2.4, dur: 0.2 }), 84)
tag('POUR DES PANSEMENTS', 'pill yellow', { t0: Wd('13', 'pansements') - 0.1, t1: Wd('13', 'et') - 0.1, y: 240, rot: -2 })
fs(tag('ET UNE JAMBE SAUVÉE.', 'slam yellow', { t0: Wd('13', 'et') - 0.1, t1: E('13') + 0.15, y: 260, rot: -3, from: 3, dur: 0.2 }), 82)
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
  [Wd('01', 'vole') - 0.06, 16],
  [Wd('01', 'pansements') - 0.06, 10],
  [Wd('01', 'accuses') - 0.05, 14],
  [T_CONSOLE, 14],
  [Wd('03', 'jugee') - 0.05, 16],
  [Wd('04', 'nous') - 0.06, 12],
  [Wd('05', 'deux') - 0.06, 14],
  [Wd('06', 'aucun') - 0.06, 10],
  [Wd('07', 'renvoyait') - 0.05, 10],
  [Wd('08', 'lhopital') - 0.06, 12],
  [Wd('09', 'servie') - 0.06, 12],
  [Wd('10', 'un') - 0.06, 14],
  [Wd('11', 'marche') - 0.06, 14],
  [Wd('12', 'linterdiction') - 0.06, 14],
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

  // La rue (scènes 1 et 2).
  const street = (B, tt, { cx = 340, kneel = 0, unwrap = 0, items = 0, look = 0.6 } = {}) => {
    B.gerard.update(tt, { x: 830, y: 1090, scale: 0.56, brows: 'sad', look: [-0.6, 0.3], armR: [0.15, 0.5], armL: [0.2, 0.6], seed: 3.1, headTilt: 0.08 })
    B.legG.setAttribute('transform', 'translate(850 1300) scale(-0.95 0.95)')
    B.leg.band.forEach((b, k) => b.setAttribute('opacity', unwrap > (k + 1) / 5 ? 0 : 1))
    B.leg.wound.setAttribute('opacity', unwrap > 0.5 ? 0.9 : 0)
    const y = lerp(1080, 1190, kneel)
    const armR = [lerp(0.2, 0.9, kneel), lerp(0.4, 0.7, kneel)]
    B.camille.update(tt, { x: cx, y, scale: 0.7, brows: kneel > 0.3 ? 'sad' : 'determined', look: [look, 0.3 + 0.3 * kneel], armR, armL: [0.25, 0.6], seed: 1.2, headTilt: 0.12 * kneel })
    const [bx, by] = handAt(cx, y, 0.7, [0.25, 0.6], -1)
    place(B.bag, bx, by + 30, 0.8, 0)
    B.items.forEach((g, k) => {
      const s = popS(tt, items + k * 0.25, Infinity, 0.3)
      show(g, items > 0 && s > 0.01)
      place(g, cx - 130 + k * 130, y - 390 - (k % 2) * 40 + 6 * Math.sin(tt * 3 + k), 0.95 * s, (k - 1) * 8)
    })
  }
  if (cur === EMEUTE) {
    const a = prog(t, Wd('01', 'chaque') - 0.3, 0.5, ease.io3)
    const b = prog(t, Wd('01', 'aujourdhui') - 0.2, 0.6, ease.io3)
    cam(EMEUTE, t, { zoom: lerp(lerp(1.0, 1.22, a), 1.05, b), cx: lerp(lerp(560, 400, a), 540, b), cy: lerp(lerp(1020, 980, a), 1000, b), push: 0.012, hand: 3 })
    street(EMEUTE, t, { cx: 340, items: Wd('01', 'pansements') - 0.15, look: 0.5 })
  }
  if (cur === VIDEO) {
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    const walk = prog(tt, Wd('02', 'rentre') - 0.3, 1.4, ease.io3)
    const kneel = prog(tt, Wd('02', 'sagenouille') - 0.2, 0.5, ease.out3)
    const unwrap = prog(tt, Wd('02', 'defait'), 1.0)
    street(VIDEO, tt, { cx: lerp(120, 430, walk), kneel, unwrap, items: 0, look: 0.7 })
    const zoomC = frozen ? 0.15 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 0
    const focus = prog(tt, Wd('02', 'defait') - 0.4, 0.6, ease.io3)
    cam(VIDEO, tt, { zoom: 1.0 + 0.25 * focus + zoomC, cx: lerp(540, 760, focus), cy: lerp(1000, 1150, focus), push: 0.006, hand: 0 })
    place(VIDEO.ring, 850 - 0.95 * 230, 1300, 1, 0)
    VIDEO.ring.setAttribute('stroke-dashoffset', 820 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `22:47:${String(10 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['camille', 'trente', 'infirmiere', 'jamais']
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
    if (prop(TRIB.facture, id === '04', S('04') + 0.1, E('04') + 0.05, 540, 500, 0.6, -3) > 0) TRIB.facture.total.setAttribute('opacity', t > Wd('04', 'nous') - 0.1 ? 1 : 0)
    if (prop(TRIB.balance, id === '05', S('05'), E('05') + 0.05, 540, 520, 0.75) > 0) {
      const tip = prog(t, Wd('05', 'jambe') - 0.2, 0.5, ease.out3)
      const a = lerp(-8, 14, tip)
      TRIB.balance.beam.setAttribute('transform', `translate(0 -200) rotate(${a})`)
      TRIB.balance.left.setAttribute('transform', `translate(-250 0) rotate(${-a})`)
      TRIB.balance.right.setAttribute('transform', `translate(250 0) rotate(${-a})`)
    }
    if (prop(TRIB.ordonnance, id === '06', Wd('06', 'sans') - 0.2, E('06') + 0.05, 540, 500, 0.58, 3) > 0) TRIB.ordonnance.cross.setAttribute('opacity', t > Wd('06', 'aucun') - 0.1 ? 1 : 0)
    if (prop(TRIB.urgences, id === '07', Wd('07', 'trois') - 0.2, E('07') + 0.05, 540, 520, 0.62) > 0) {
      TRIB.urgences.tally.forEach((r, k) => r.setAttribute('opacity', t > Wd('07', 'trois') + k * 0.15 ? 1 : 0))
      const a = 2 * Math.PI * 0.5 * ease.out3(prog(t, Wd('07', 'six'), 1.0))
      TRIB.urgences.hand.setAttribute('transform', `translate(-130 90) rotate(${(a * 180) / Math.PI})`)
      TRIB.urgences.arc.setAttribute('d', `M 0 0 L 0 -140 A 140 140 0 ${a > Math.PI ? 1 : 0} 1 ${140 * Math.sin(a)} ${-140 * Math.cos(a)} Z`)
    }
    if (prop(TRIB.placard, id === '08', Wd('08', 'sert') - 0.2, E('08') + 0.05, 540, 500, 0.58) > 0) {
      const o = prog(t, Wd('08', 'placards') - 0.1, 0.4, ease.out3)
      const k = 1 - 0.92 * o
      TRIB.placard.doors[0].setAttribute('transform', `translate(-260 0) scale(${k} 1) translate(260 0)`)
      TRIB.placard.doors[1].setAttribute('transform', `translate(260 0) scale(${k} 1) translate(-260 0)`)
    }
    if (prop(TRIB.poubelle, id === '09', Wd('09', 'pris') - 0.2, E('09') + 0.05, 540, 520, 0.64) > 0) {
      const s = popS(t, Wd('09', 'perimees') - 0.1, Infinity, 0.25)
      TRIB.poubelle.stamp.setAttribute('transform', `translate(0 90) rotate(-10) scale(${Math.max(0.001, s)})`)
    }
    if (prop(TRIB.pv, id === '10', S('10') + 0.1, E('10') + 0.05, 540, 500, 0.58, -2) > 0) {
      const s = popS(t, Wd('10', 'un') - 0.06, Infinity, 0.22)
      TRIB.pv.stamp.setAttribute('transform', `translate(0 160) rotate(-12) scale(${Math.max(0.001, lerp(2.2, 1, Math.min(1, s)) * (s > 0.01 ? 1 : 0))})`)
    }
    if (prop(TRIB.rapport, id === '11', Wd('11', 'chirurgien') - 0.2, E('11') + 0.05, 540, 500, 0.58, 3) > 0) {
      TRIB.rapport.ok.setAttribute('opacity', t > Wd('11', 'lamputation') - 0.1 ? 1 : 0)
      const ph = t * 8
      TRIB.rapport.walk.setAttribute('opacity', t > Wd('11', 'marche') - 0.2 ? 1 : 0)
      TRIB.rapport.legs.setAttribute('d', `M 0 -50 L 0 20 M 0 20 L ${30 * Math.sin(ph)} 90 M 0 20 L ${-30 * Math.sin(ph)} 90 M 0 -40 L ${-30 * Math.sin(ph)} 10 M 0 -40 L ${30 * Math.sin(ph)} 10`)
    }
    prop(TRIB.prison, id === '12', Wd('12', 'trois') - 0.15, E('12') + 0.05, 540, 480, 0.62)
    if (prop(TRIB.photo, id === '13', S('13') + 0.1, E('13') + 0.05, 540, 490, 0.68, 4) > 0) {
      TRIB.photo.p.update(t, { x: 0, y: 140, scale: 0.46, brows: 'neutral', mouth: 0.3, look: [0, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 5 })
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
    VOTE.valide.setAttribute('transform', `translate(292 -66) rotate(-12) scale(${Math.max(0.001, lerp(2.4, 0.72, Math.min(1, v)) * (v > 0.01 ? 1 : 0))})`)
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
