/**
 * ============================================================================
 *  « Affaire Classée ? » — Le Dossier n°1 : « Fermé de l'intérieur » (≈ 44 s)
 * ============================================================================
 *  Style « dossier tramé » (halftone-dossier, bibliothèque Lemo-Opuscar) : un
 *  dossier d'archives qu'on feuillette. Papier crème, trame de points, gros
 *  titres à l'ombre décalée, tampons qui claquent, transitions en points.
 *
 *  Pages : la couverture → le plan du bureau (porte fermée de l'intérieur) →
 *  les trois suspects → une fiche par suspect et son alibi → l'indice →
 *  « Qui ment ? ». La solution (la secrétaire : un 14 décembre à 19 h, il fait
 *  nuit) n'est jamais montrée : les trois pièces sont traitées pareil.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT as H, WIDTH as W, makeCues } from './cues.js'

const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W: Wd } = C
const SEC = Object.fromEntries(C.sections.map((s) => [s.id, s]))

const INK = '#1d2a5c'
const RED = '#e2402f'
const YEL = '#f5b82e'
const PINK = '#f06a8a'
const PAPER = '#f4ead2'
const MONO = 'DejaVu Sans Mono, monospace'

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
const place = (el, x, y, s = 1, r = 0) => el.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${Math.max(0.001, s)})`)
const back = (k = 2) => ease.back(k)
const popIn = (t, t0, dur = 0.35, k = 2.2) => (t < t0 ? 0 : back(k)(clamp((t - t0) / dur)))

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
defs.innerHTML = `
  <filter id="boil"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
  <filter id="stampInk"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency="0.05" seed="7" result="d"/><feDisplacementMap in="g" in2="d" scale="4"/></filter>
`
const halftone = (id, color, step, r, angle) => {
  const p = svg('pattern', { id, width: step, height: step, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${angle})` }, defs)
  svg('circle', { cx: step / 2, cy: step / 2, r, fill: color }, p)
}
halftone('dotsYel', YEL, 24, 8, 15)
halftone('dotsPink', PINK, 22, 6, 45)
halftone('dotsInk', INK, 20, 4, 75)
halftone('dotsRed', RED, 22, 7, 30)
halftone('dotsPaper', PAPER, 22, 3, 20)

const cam = svg('g', {}, root)
svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: PAPER }, cam)

// ------------------------------------------------------------ pages

const pages = []
const page = (id) => {
  const g = svg('g', {}, cam)
  const s = SEC[id]
  pages.push({ g, t0: s.t0, t1: s.t1 })
  return g
}

// Couverture : la chemise s'ouvre sur la silhouette à la craie.
const P_COVER = page('couverture')
svg('circle', { cx: 900, cy: 260, r: 520, fill: 'url(#dotsYel)', opacity: 0.85 }, P_COVER)
svg('rect', { x: 0, y: 1500, width: W, height: 420, fill: 'url(#dotsInk)', opacity: 0.35 }, P_COVER)
const bodyBg = svg('rect', { x: 90, y: 520, width: 900, height: 780, rx: 30, fill: INK, opacity: 0 }, P_COVER)
const bodyDots = svg('rect', { x: 90, y: 520, width: 900, height: 780, rx: 30, fill: 'url(#dotsPaper)', opacity: 0 }, P_COVER)
const chalk = svg('g', { filter: 'url(#boil)', opacity: 0 }, P_COVER)
const chalkPath = svg('path', {
  d: 'M 540 620 C 610 620 640 680 620 740 C 700 760 780 820 840 900 L 790 940 C 740 880 690 850 650 840 C 660 940 650 1040 700 1160 L 640 1180 C 600 1080 570 1000 540 960 C 510 1000 470 1080 420 1180 L 360 1160 C 420 1040 420 940 430 840 C 380 860 330 900 280 960 L 230 920 C 300 820 380 760 460 740 C 440 680 470 620 540 620 Z',
  fill: 'none', stroke: '#fffaf0', 'stroke-width': 18, 'stroke-linejoin': 'round', 'stroke-dasharray': 4200, 'stroke-dashoffset': 4200,
}, chalk)
const cover = svg('g', {}, P_COVER)
svg('rect', { x: 110, y: 380, width: 860, height: 1120, rx: 26, fill: '#e3c27c', stroke: INK, 'stroke-width': 8 }, cover)
svg('rect', { x: 110, y: 340, width: 360, height: 80, rx: 18, fill: '#e3c27c', stroke: INK, 'stroke-width': 8 }, cover)
svg('rect', { x: 110, y: 380, width: 860, height: 1120, rx: 26, fill: 'url(#dotsPink)', opacity: 0.35 }, cover)
txt(cover, 'DOSSIER', { x: 540, y: 820, 'font-family': 'Fraunces Variable', 'font-size': 120, fill: INK })
txt(cover, 'N°1', { x: 540, y: 1060, 'font-family': 'Fraunces Variable', 'font-size': 260, fill: RED, stroke: INK, 'stroke-width': 8, 'paint-order': 'stroke fill' })
txt(cover, 'FERMÉ DE L’INTÉRIEUR', { x: 540, y: 1200, 'font-family': MONO, 'font-weight': 700, 'font-size': 42, fill: INK })

// Plan du bureau.
const P_PLAN = page('plan')
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsYel)', opacity: 0.25 }, P_PLAN)
const plan = svg('g', { transform: 'translate(540 1000)' }, P_PLAN)
svg('rect', { x: -380, y: -330, width: 760, height: 660, fill: '#fffaf0', stroke: INK, 'stroke-width': 14 }, plan)
svg('rect', { x: -380, y: -330, width: 760, height: 660, fill: 'url(#dotsPink)', opacity: 0.25 }, plan)
svg('rect', { x: -230, y: -200, width: 300, height: 150, rx: 10, fill: '#c98b5a', stroke: INK, 'stroke-width': 8 }, plan)
svg('circle', { cx: -80, cy: 10, r: 46, fill: '#8aa3d6', stroke: INK, 'stroke-width': 8 }, plan)
for (let k = 0; k < 4; k++) svg('line', { x1: 250 + k * 22, y1: -330, x2: 250 + k * 22, y2: -250, stroke: INK, 'stroke-width': 6 }, plan)
txt(plan, 'FENÊTRE', { x: 300, y: -270, 'font-family': MONO, 'font-weight': 700, 'font-size': 28, fill: INK })
svg('rect', { x: 120, y: 316, width: 170, height: 28, fill: PAPER, stroke: INK, 'stroke-width': 8 }, plan)
svg('path', { d: 'M 120 330 A 170 170 0 0 1 290 160', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-dasharray': '14 10' }, plan)
const key = svg('g', {}, plan)
svg('circle', { cx: 0, cy: -46, r: 26, fill: YEL, stroke: INK, 'stroke-width': 7 }, key)
svg('rect', { x: -7, y: -24, width: 14, height: 46, fill: YEL, stroke: INK, 'stroke-width': 6 }, key)
svg('rect', { x: 6, y: 4, width: 16, height: 9, fill: YEL, stroke: INK, 'stroke-width': 5 }, key)
const keyRing = svg('circle', { cx: 205, cy: 260, r: 92, fill: 'none', stroke: RED, 'stroke-width': 10, 'stroke-dasharray': 600, 'stroke-dashoffset': 600 }, plan)
const keyTxt = txt(plan, '▼ CÔTÉ INTÉRIEUR', { x: 205, y: 130, 'font-family': MONO, 'font-weight': 700, 'font-size': 36, fill: RED, opacity: 0 })
svg('path', { d: 'M -260 160 l 60 -30 l 40 20 l 70 -10 l -10 40 l -70 10 l -40 30 z', fill: 'none', stroke: RED, 'stroke-width': 7, 'stroke-dasharray': '10 8' }, plan)
// Croix rouges : personne n'est entré (porte), personne n'est sorti (fenêtre).
const cross = (x, y) => {
  const g = svg('g', {}, plan)
  svg('path', { d: 'M -60 -60 L 60 60 M 60 -60 L -60 60', stroke: RED, 'stroke-width': 22, 'stroke-linecap': 'round' }, g)
  return { g, x, y }
}
const xDoor = cross(205, 330)
const xWin = cross(300, -290)
// Fond rouge du « quelqu'un l'a tué ».
const planRed = svg('g', { opacity: 0 }, P_PLAN)
svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: RED }, planRed)
svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#dotsInk)', opacity: 0.25 }, planRed)

// Les trois suspects.
const SUSPECTS = [
  { name: 'LA FEMME', hair: '#7a3b2a', skin: '#f2c49a', color: '#f06a8a', shirt: '#3a2a4a', style: 0 },
  { name: 'L’ASSOCIÉ', hair: '#2b2118', skin: '#d9a072', color: '#5b8de0', shirt: '#2e3f73', style: 1 },
  { name: 'LA SECRÉTAIRE', hair: '#e0b04a', skin: '#f6d2b0', color: '#4fb38a', shirt: '#3a2a4a', style: 2 },
]
function card(parent, s) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -150, y: -230, width: 300, height: 430, rx: 18, fill: '#fffaf0', stroke: INK, 'stroke-width': 6 }, g)
  svg('rect', { x: -130, y: -210, width: 260, height: 260, fill: s.color }, g)
  svg('rect', { x: -130, y: -210, width: 260, height: 260, fill: 'url(#dotsInk)', opacity: 0.3 }, g)
  const face = svg('g', { filter: 'url(#boil)' }, g)
  svg('path', { d: 'M -95 50 C -95 -20 -50 -40 0 -40 C 50 -40 95 -20 95 50 Z', fill: s.shirt, stroke: INK, 'stroke-width': 7 }, face)
  svg('ellipse', { cx: 0, cy: -95, rx: 62, ry: 70, fill: s.skin, stroke: INK, 'stroke-width': 7 }, face)
  svg('path', { d: s.style === 0 ? 'M -66 -95 C -70 -170 70 -175 66 -95 C 70 -40 92 -20 80 10 C 60 -60 40 -120 0 -130 C -40 -120 -60 -60 -80 10 C -92 -20 -70 -40 -66 -95 Z' : s.style === 1 ? 'M -64 -110 C -60 -175 60 -175 64 -110 C 30 -140 -30 -140 -64 -110 Z' : 'M -66 -100 C -72 -175 72 -175 66 -100 C 40 -135 -40 -135 -66 -100 Z M 40 -160 C 90 -170 110 -130 80 -110 C 70 -130 55 -140 40 -150 Z', fill: s.hair, stroke: INK, 'stroke-width': 6 }, face)
  const eyes = svg('g', {}, face)
  for (const sd of [-1, 1]) {
    svg('ellipse', { cx: sd * 22, cy: -95, rx: 9, ry: 12, fill: INK }, eyes)
    svg('circle', { cx: sd * 22 + 3, cy: -100, r: 3, fill: '#fff' }, eyes)
  }
  svg('path', { d: 'M -14 -58 Q 0 -64 14 -58', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, face)
  txt(g, s.name, { x: 0, y: 120, 'font-size': 34, fill: INK })
  const q = txt(g, '?', { x: 0, y: 182, 'font-family': 'Fraunces Variable', 'font-size': 64, fill: RED })
  return { g, eyes, q }
}
const P_SUS = page('suspects')
svg('rect', { x: 0, y: 0, width: W, height: H, fill: INK }, P_SUS)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsPink)', opacity: 0.22 }, P_SUS)
const cal = svg('g', {}, P_SUS)
svg('rect', { x: -150, y: -140, width: 300, height: 290, rx: 20, fill: '#fffaf0', stroke: PAPER, 'stroke-width': 6 }, cal)
svg('rect', { x: -150, y: -140, width: 300, height: 80, rx: 20, fill: RED }, cal)
txt(cal, 'DÉCEMBRE', { x: 0, y: -84, 'font-size': 40, fill: '#fff' })
txt(cal, '14', { x: 0, y: 100, 'font-family': 'Fraunces Variable', 'font-size': 160, fill: INK })
const susCards = SUSPECTS.map((s) => card(P_SUS, s))
const alibiTags = SUSPECTS.map(() => {
  const g = svg('g', {}, P_SUS)
  svg('rect', { x: -95, y: -30, width: 190, height: 60, rx: 12, fill: YEL, stroke: INK, 'stroke-width': 5 }, g)
  txt(g, 'ALIBI', { x: 0, y: 14, 'font-size': 36, fill: INK })
  return g
})

// Une fiche par suspect : portrait, pièce à conviction, déposition tapée à la machine.
function filePage(id, s, n, buildEvidence) {
  const P = page(id)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${['dotsPink', 'dotsYel', 'dotsInk'][n]})`, opacity: n === 2 ? 0.12 : 0.22 }, P)
  // Feuille de déposition.
  svg('rect', { x: 70, y: 1140, width: 940, height: 360, rx: 8, fill: '#fffaf0', stroke: INK, 'stroke-width': 8 }, P)
  svg('rect', { x: 70, y: 1140, width: 940, height: 70, rx: 8, fill: INK }, P)
  txt(P, `DÉPOSITION · SUSPECT N°${n + 1}`, { x: 540, y: 1188, 'font-family': MONO, 'font-weight': 700, 'font-size': 34, fill: PAPER })
  for (let k = 0; k < 4; k++) svg('line', { x1: 110, y1: 1290 + k * 62, x2: 970, y2: 1290 + k * 62, stroke: '#d9cdb0', 'stroke-width': 3 }, P)
  const fo = svg('foreignObject', { x: 100, y: 1220, width: 880, height: 270 }, P)
  const dep = document.createElement('div')
  dep.className = 'dep'
  fo.append(dep)
  const c = card(P, s)
  const ev = svg('g', {}, P)
  buildEvidence(ev)
  return { P, card: c, ev, dep }
}
const FEMME = filePage('femme', SUSPECTS[0], 0, (g) => {
  // Le ticket de cinéma.
  svg('path', { d: 'M -200 -110 L 200 -110 L 200 -40 A 30 30 0 0 0 200 20 L 200 110 L -200 110 L -200 20 A 30 30 0 0 0 -200 -40 Z', fill: '#ffe08a', stroke: INK, 'stroke-width': 8 }, g)
  svg('line', { x1: 110, y1: -100, x2: 110, y2: 100, stroke: INK, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, g)
  txt(g, 'CINÉMA', { x: -40, y: -40, 'font-size': 52, fill: RED })
  txt(g, '14/12 · 21:00', { x: -40, y: 20, 'font-family': MONO, 'font-weight': 700, 'font-size': 36, fill: INK })
  txt(g, 'SALLE 3', { x: -40, y: 70, 'font-family': MONO, 'font-weight': 700, 'font-size': 30, fill: INK })
  txt(g, 'N°', { x: 155, y: 10, 'font-family': MONO, 'font-weight': 700, 'font-size': 30, fill: INK })
})
let bolt
const ASSOCIE = filePage('associe', SUSPECTS[1], 1, (g) => {
  // Le nuage d'orage.
  svg('path', { d: 'M -170 60 C -230 60 -230 -30 -170 -30 C -170 -110 -60 -130 -20 -70 C 20 -140 150 -120 150 -30 C 220 -30 220 60 160 60 Z', fill: '#8a93b8', stroke: INK, 'stroke-width': 8 }, g)
  bolt = svg('path', { d: 'M 10 50 L -40 150 L 10 150 L -20 240 L 70 120 L 20 120 L 50 50 Z', fill: YEL, stroke: INK, 'stroke-width': 7 }, g)
  for (let k = 0; k < 7; k++) svg('line', { x1: -150 + k * 50, y1: 90, x2: -170 + k * 50, y2: 150, stroke: '#5b8de0', 'stroke-width': 8, 'stroke-linecap': 'round' }, g)
  txt(g, 'ORAGE', { x: 0, y: -170, 'font-size': 48, fill: INK })
})
let clockHands
const SECRET = filePage('secretaire', SUSPECTS[2], 2, (g) => {
  // L'horloge : 19 h 00, et le soleil.
  svg('circle', { r: 130, fill: '#fffaf0', stroke: INK, 'stroke-width': 10 }, g)
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2
    svg('line', { x1: Math.sin(a) * 100, y1: -Math.cos(a) * 100, x2: Math.sin(a) * 118, y2: -Math.cos(a) * 118, stroke: INK, 'stroke-width': k % 3 ? 4 : 9 }, g)
  }
  clockHands = svg('g', {}, g)
  svg('line', { x1: 0, y1: 0, x2: 0, y2: -95, stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round', class: 'min' }, clockHands)
  svg('line', { x1: 0, y1: 0, x2: 0, y2: -62, stroke: RED, 'stroke-width': 12, 'stroke-linecap': 'round', class: 'hr' }, clockHands)
  svg('circle', { r: 12, fill: INK }, g)
  txt(g, '19:00', { x: 0, y: 200, 'font-family': MONO, 'font-weight': 700, 'font-size': 44, fill: INK })
})

// L'indice : les trois pièces côte à côte, la loupe passe.
const P_IND = page('indice')
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsYel)', opacity: 0.25 }, P_IND)
const pieces = [
  (g) => {
    svg('path', { d: 'M -120 -66 L 120 -66 L 120 -24 A 18 18 0 0 0 120 12 L 120 66 L -120 66 L -120 12 A 18 18 0 0 0 -120 -24 Z', fill: '#ffe08a', stroke: INK, 'stroke-width': 6 }, g)
    txt(g, 'CINÉMA', { x: 0, y: -6, 'font-size': 38, fill: RED })
    txt(g, '21:00', { x: 0, y: 40, 'font-family': MONO, 'font-weight': 700, 'font-size': 30, fill: INK })
  },
  (g) => {
    svg('path', { d: 'M -110 40 C -150 40 -150 -20 -110 -20 C -110 -70 -40 -84 -14 -44 C 14 -90 96 -76 96 -20 C 140 -20 140 40 104 40 Z', fill: '#8a93b8', stroke: INK, 'stroke-width': 6 }, g)
    svg('path', { d: 'M 6 34 L -26 98 L 6 98 L -12 154 L 46 76 L 14 76 L 32 34 Z', fill: YEL, stroke: INK, 'stroke-width': 5 }, g)
    txt(g, 'ORAGE', { x: 0, y: -100, 'font-size': 34, fill: INK })
  },
  (g) => {
    svg('circle', { r: 82, fill: '#fffaf0', stroke: INK, 'stroke-width': 7 }, g)
    svg('line', { x1: 0, y1: 0, x2: 0, y2: 60, stroke: INK, 'stroke-width': 6 }, g)
    svg('line', { x1: 0, y1: 0, x2: -36, y2: -20, stroke: RED, 'stroke-width': 9 }, g)
    txt(g, '19:00', { x: 0, y: 130, 'font-family': MONO, 'font-weight': 700, 'font-size': 32, fill: INK })
  },
].map((build, i) => {
  const g = svg('g', {}, P_IND)
  svg('rect', { x: -150, y: -150, width: 300, height: 320, rx: 16, fill: '#fffaf0', stroke: INK, 'stroke-width': 6 }, g)
  const inner = svg('g', { transform: 'translate(0 -10)' }, g)
  build(inner)
  txt(g, `PIÈCE ${i + 1}`, { x: 0, y: 150, 'font-family': MONO, 'font-weight': 700, 'font-size': 26, fill: INK })
  return g
})
const loupe = svg('g', {}, P_IND)
svg('circle', { r: 120, fill: '#fff', opacity: 0.25 }, loupe)
svg('circle', { r: 120, fill: 'none', stroke: INK, 'stroke-width': 18 }, loupe)
svg('rect', { x: 80, y: 80, width: 40, height: 180, rx: 18, fill: INK, transform: 'rotate(-45 100 100)' }, loupe)
const eye = svg('g', {}, P_IND)
svg('path', { d: 'M -200 0 Q 0 -150 200 0 Q 0 150 -200 0 Z', fill: '#fffaf0', stroke: INK, 'stroke-width': 12 }, eye)
svg('circle', { r: 70, fill: '#5b8de0', stroke: INK, 'stroke-width': 10 }, eye)
svg('circle', { r: 32, fill: INK }, eye)
svg('circle', { cx: 18, cy: -20, r: 12, fill: '#fff' }, eye)

// Le vote : « Qui ment ? ».
const P_VOTE = page('vote')
svg('rect', { x: 0, y: 0, width: W, height: H, fill: INK }, P_VOTE)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsRed)', opacity: 0.18 }, P_VOTE)
const voteCards = SUSPECTS.map((s) => card(P_VOTE, s))

// ------------------------------------------------------------ titres, tampons

const fx = svg('g', {}, root)
function headline(text, { x = 80, y, size = 150, color = INK, shadow = PINK, anchor = 'left' }) {
  const g = svg('g', {}, fx)
  const glyphs = [...text].map((ch, i) => {
    const gg = svg('g', {}, g)
    const sh = svg('text', { x: 9, y: 9, 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': size, fill: shadow, opacity: 0.85 }, gg)
    const tx = svg('text', { x: 0, y: 0, 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': size, fill: color }, gg)
    sh.textContent = tx.textContent = ch
    return { gg, tx, i }
  })
  let laid = false
  const layout = () => {
    let cx = 0
    for (const gl of glyphs) {
      gl.x = cx
      cx += gl.tx.getComputedTextLength() || size * 0.5
    }
    const x0 = anchor === 'center' ? 540 - cx / 2 : x
    for (const gl of glyphs) gl.x += x0
    laid = true
  }
  return (t, t0, t1 = Infinity) => {
    if (!laid) layout()
    const out = t1 === Infinity ? 0 : prog(t, t1, 0.18, ease.in3)
    for (const gl of glyphs) {
      const a = prog(t, t0 + gl.i * 0.035, 0.3, ease.back(2.4))
      const vis = a > 0.001 && out < 0.99
      gl.gg.style.display = vis ? '' : 'none'
      if (!vis) continue
      const sq = 1 + 0.25 * Math.sin(Math.PI * clamp((t - t0 - gl.i * 0.035) / 0.3)) * (1 - a)
      gl.gg.setAttribute('transform', `translate(${gl.x} ${y - (1 - a) * 90 - out * 40}) scale(${1 / sq} ${sq})`)
      gl.gg.style.opacity = String(1 - out)
    }
  }
}
function stamp(text, { x, y, rot = -8, color = RED, size = 110 }) {
  const g = svg('g', { filter: 'url(#stampInk)' }, fx)
  const tx = svg('text', { x: 0, y: size * 0.35, 'text-anchor': 'middle', 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': size, fill: color, 'letter-spacing': '4' }, g)
  tx.textContent = text
  const r1 = svg('rect', { fill: 'none', stroke: color, 'stroke-width': 12, rx: 22 }, g)
  const r2 = svg('rect', { fill: 'none', stroke: color, 'stroke-width': 5, rx: 16 }, g)
  let laid = false
  return (t, t0, t1 = Infinity) => {
    if (!laid) {
      const w = tx.getComputedTextLength() + 80
      const h = size * 1.25
      Object.entries({ x: -w / 2, y: -h / 2, width: w, height: h }).forEach(([k, v]) => r1.setAttribute(k, v))
      Object.entries({ x: -w / 2 + 16, y: -h / 2 + 16, width: w - 32, height: h - 32 }).forEach(([k, v]) => r2.setAttribute(k, v))
      laid = true
    }
    const vis = t >= t0 && t < t1
    g.style.display = vis ? '' : 'none'
    if (!vis) return
    const u = t - t0
    const k = u < 0.09 ? lerp(2.6, 1, ease.in3(u / 0.09)) : 1 + 0.06 * Math.exp(-(u - 0.09) * 14) * Math.cos((u - 0.09) * 40)
    g.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${k})`)
    g.style.opacity = '0.93'
  }
}

// Les titres, page par page.
const T = {
  homme: headline('UN HOMME', { y: 330, size: 150 }),
  mort: headline('MORT.', { y: 490, size: 190, color: RED, shadow: INK }),
  ferme: headline('FERMÉ À CLÉ.', { y: 330, size: 118 }),
  inter: headline('DE L’INTÉRIEUR.', { y: 480, size: 104, color: RED, shadow: INK }),
  personne: headline('PERSONNE.', { y: 380, size: 150 }),
  pourtant: headline('ET POURTANT…', { y: 380, size: 108, color: PAPER, shadow: INK }),
  suspects: headline('3 SUSPECTS.', { x: 350, y: 330, size: 90, color: PAPER, shadow: RED }),
  alibis: headline('3 ALIBIS.', { x: 350, y: 470, size: 90, color: YEL, shadow: RED }),
  seul: headline('UN SEUL MENT.', { y: 1500, size: 104, color: PAPER, shadow: RED, anchor: 'center' }),
  femme: headline('LA FEMME', { y: 300, size: 140, color: INK, shadow: PINK }),
  associe: headline('L’ASSOCIÉ', { y: 300, size: 140, color: INK, shadow: '#5b8de0' }),
  secret: headline('LA SECRÉTAIRE', { y: 300, size: 100, color: INK, shadow: '#4fb38a' }),
  unseul: headline('UN SEUL.', { y: 330, size: 160, color: RED, shadow: INK }),
  yeux: headline('SOUS TES YEUX.', { y: 1480, size: 104, anchor: 'center' }),
  qui: headline('QUI MENT ?', { y: 380, size: 140, color: YEL, shadow: RED, anchor: 'center' }),
}
const ST = {
  confid: stamp('CONFIDENTIEL', { x: 760, y: 1420, rot: 9, size: 72 }),
  impossible: stamp('IMPOSSIBLE', { x: 540, y: 820, rot: -10, size: 120 }),
  homicide: stamp('HOMICIDE', { x: 540, y: 1000, rot: -8, size: 150, color: '#fffaf0' }),
  alibi1: stamp('ALIBI N°1', { x: 780, y: 520, rot: 8, size: 70 }),
  alibi2: stamp('ALIBI N°2', { x: 780, y: 520, rot: 8, size: 70, color: INK }),
  alibi3: stamp('ALIBI N°3', { x: 780, y: 520, rot: 8, size: 70, color: '#2f8a5f' }),
  imposs2: stamp('IMPOSSIBLE', { x: 540, y: 1130, rot: -6, size: 110 }),
}

// ------------------------------------------------------------ HUD, sous-titres

const ui = document.getElementById('ui')
ui.innerHTML = `<div class="hud l">DOSSIER N°001 <span class="chip">PIÈCE 1/7</span></div><div class="hud r"><span class="rec"></span> 14.12 · 21:47</div>`
const chip = ui.querySelector('.chip')
const rec = ui.querySelector('.rec')
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const endEl = document.createElement('div')
endEl.className = 'end'
endEl.innerHTML = '<div class="comment">ÉCRIS-LE EN COMMENTAIRE ↓</div><div class="subscribe"><span class="plus">+</span> ABONNE-TOI</div><div class="next">LE DOSSIER S’OUVRE DANS LA PROCHAINE VIDÉO</div>'
ui.append(endEl)
const endParts = [...endEl.children]

// Gros sous-titres : 3 mots au plus, le mot prononcé surligné.
// Pas de sous-titres sur les dépositions (la feuille tapée à la machine les montre) ni sur la fin (les étiquettes).
const DEP = ['04', '05', '06']
const CHUNKS = []
for (const line of C.lines) {
  const id = line.id.slice(0, 2)
  if (DEP.includes(id)) continue
  const words = id === '08' ? line.words.slice(0, 3) : line.words
  const mine = []
  let cur = null
  words.forEach((w, i) => {
    if (!cur || cur.words.length >= 3 || /[,.:;?!…»]$/.test(words[i - 1]?.w ?? '')) mine.push((cur = { words: [] }))
    cur.words.push({ ...w, w: w.w.replace(/[«»]/g, '').trim() })
  })
  const end = id === '08' ? line.words[3].t - 0.1 : line.start + line.dur + 0.2
  mine.forEach((c, i) => {
    c.t0 = c.words[0].t - 0.06
    c.t1 = i < mine.length - 1 ? mine[i + 1].words[0].t - 0.06 : end
  })
  CHUNKS.push(...mine)
}
for (const c of CHUNKS) {
  c.el = document.createElement('div')
  c.el.className = 'line'
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
      w.el.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)})`
      w.el.classList.toggle('on', t >= w.t - 0.05 && t < w.next - 0.05)
    }
  }
}
// Dépositions tapées à la machine, mot à mot.
const DEPS = [[FEMME, '04'], [ASSOCIE, '05'], [SECRET, '06']].map(([F, id]) => {
  const l = C.line(id)
  const i = l.words.findIndex((w) => /[.«]/.test(w.w))
  return { F, l, name: i >= 0 ? i + 1 : 2 }
})
function updateDeps(t) {
  for (const { F, l, name } of DEPS) {
    const words = l.words.slice(name).filter((w) => t >= w.t - 0.03)
    const s = words.map((w) => w.w.replace(/[«»]/g, '').trim()).join(' ')
    const caret = Math.floor(t * 3) % 2 ? '▌' : ''
    F.dep.innerHTML = `<span class="q">«&nbsp;</span>${s}${t < l.start + l.dur ? caret : ''}${t > l.start + l.dur - 0.1 ? '<span class="q">&nbsp;»</span>' : ''}`
  }
}

// ------------------------------------------------------------ transitions

const wipe = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 17; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: INK }, wipe), d: (x + y) * 0.012 })
const CUT_COL = { suspects: RED, femme: PINK, associe: '#5b8de0', secretaire: '#4fb38a', indice: YEL, vote: RED }
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, root)

// Papier (une fois) et poussière (toutes les 2 images).
const paper = document.createElement('canvas')
paper.width = 540
paper.height = 960
paper.className = 'paper'
stage.append(paper)
{
  const g = paper.getContext('2d')
  const r = rng(5)
  const img = g.createImageData(540, 960)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 236 + r() * 19
    img.data[i] = v
    img.data[i + 1] = v - 4
    img.data[i + 2] = v - 14
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  const vg = g.createRadialGradient(270, 480, 200, 270, 480, 620)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(90,60,30,0.35)')
  g.fillStyle = vg
  g.fillRect(0, 0, 540, 960)
  g.fillStyle = 'rgba(120,90,50,0.12)'
  g.fillRect(268, 0, 4, 960)
}
const dust = document.createElement('canvas')
dust.width = 540
dust.height = 960
dust.className = 'dust'
stage.append(dust)
const dctx = dust.getContext('2d')

// ------------------------------------------------------------ l'instant t

const IMPACTS = [Wd('01', 'mort'), Wd('01', 'linterieur'), Wd('02', 'tue'), Wd('03', 'ment'), Wd('07', 'impossible'), Wd('08', 'ment')]
function shakeAt(t) {
  let x = 0
  let y = 0
  for (const t0 of IMPACTS) {
    if (t < t0 || t > t0 + 0.5) continue
    const k = 18 * Math.exp(-(t - t0) * 9)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 55 + 1)
  }
  return [x, y]
}
const pieceIdx = { couverture: 1, plan: 2, suspects: 3, femme: 4, associe: 5, secretaire: 6, indice: 7, vote: 7 }

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const p of pages) p.g.style.display = t >= p.t0 && t < p.t1 ? '' : 'none'
  const sec = C.sections.find((s) => t >= s.t0 && t < s.t1) ?? C.sections.at(-1)
  const [sx, sy] = shakeAt(t)
  const zoom = 1 + 0.035 * clamp((t - sec.t0) / 4)
  cam.setAttribute('transform', `translate(${540 + sx} ${960 + sy}) scale(${zoom}) translate(-540 -960)`)
  fx.setAttribute('transform', `translate(${sx} ${sy})`)

  // Couverture.
  const open = prog(t, 0.05, 0.45, ease.in3)
  cover.setAttribute('transform', `translate(110 380) scale(${1 - open} 1) translate(-110 -380)`)
  cover.style.display = open < 0.99 ? '' : 'none'
  const reveal = prog(t, 0.3, 0.35, ease.out3)
  bodyBg.setAttribute('opacity', reveal)
  bodyDots.setAttribute('opacity', 0.25 * reveal)
  chalk.setAttribute('opacity', reveal)
  chalkPath.setAttribute('stroke-dashoffset', 4200 * (1 - prog(t, 0.3, 0.8, ease.out3)))
  T.homme(t, Wd('01', 'un') - 0.05, SEC.couverture.t1 - 0.12)
  T.mort(t, Wd('01', 'mort') - 0.08, SEC.couverture.t1 - 0.12)
  ST.confid(t, Wd('01', 'mort') + 0.25, SEC.couverture.t1)

  // Plan.
  const turn = prog(t, Wd('01', 'cle') - 0.2, 0.35, ease.back(2))
  key.setAttribute('transform', `translate(205 290) rotate(${-90 * turn})`)
  keyRing.setAttribute('stroke-dashoffset', 600 * (1 - prog(t, Wd('01', 'linterieur') - 0.2, 0.4, ease.out3)))
  keyTxt.setAttribute('opacity', prog(t, Wd('01', 'linterieur'), 0.2))
  T.ferme(t, Wd('01', 'porte') - 0.1, S('02') - 0.1)
  T.inter(t, Wd('01', 'linterieur') - 0.1, S('02') - 0.1)
  ST.impossible(t, Wd('01', 'linterieur') + 0.35, S('02') - 0.1)
  for (const [X, w] of [[xDoor, Wd('02', 'entre')], [xWin, Wd('02', 'sorti')]]) {
    const v = popIn(t, w - 0.1, 0.25, 2.6)
    X.g.setAttribute('transform', `translate(${X.x} ${X.y}) scale(${Math.max(0.001, v)})`)
    X.g.style.display = v > 0.01 ? '' : 'none'
  }
  T.personne(t, Wd('02', 'personne') - 0.08, Wd('02', 'et') - 0.15)
  T.pourtant(t, Wd('02', 'et') - 0.05, SEC.plan.t1)
  planRed.setAttribute('opacity', (prog(t, Wd('02', 'et') - 0.1, 0.25, ease.out3) * 0.92).toFixed(3))
  ST.homicide(t, Wd('02', 'tue') - 0.05, SEC.plan.t1)

  // Les suspects.
  place(cal, 200, 400 + 8 * Math.sin(t * 2), popIn(t, S('03') - 0.05, 0.35), -6 + 3 * prog(t, S('03'), 0.3))
  susCards.forEach((c, i) => {
    const a = popIn(t, Wd('03', 'suspects') - 0.15 + i * 0.12, 0.4)
    c.g.setAttribute('transform', `translate(${200 + i * 340} ${lerp(1500, 1000, a) + Math.sin(t * 2.4 + i) * 5}) rotate(${(i - 1) * 4 * a}) scale(0.95)`)
    c.q.style.display = t > Wd('03', 'ment') - 0.1 ? '' : 'none'
    const g = alibiTags[i]
    const s = popIn(t, Wd('03', 'alibis') - 0.15 + i * 0.1, 0.3, 2.6)
    place(g, 200 + i * 340, 1270, s * 0.95, (i - 1) * -5)
  })
  T.suspects(t, Wd('03', 'trois') - 0.08, SEC.suspects.t1 - 0.1)
  T.alibis(t, Wd('03', 'trois', 1) - 0.08, SEC.suspects.t1 - 0.1)
  T.seul(t, Wd('03', 'un') - 0.08, SEC.suspects.t1 - 0.1)

  // Fiches des suspects.
  for (const [F, id, head, st] of [[FEMME, 'femme', T.femme, ST.alibi1], [ASSOCIE, 'associe', T.associe, ST.alibi2], [SECRET, 'secretaire', T.secret, ST.alibi3]]) {
    const s = SEC[id]
    if (!(t >= s.t0 && t < s.t1)) {
      head(t, s.t0 + 0.1, s.t0 + 0.1)
      st(t, -1, -1)
      continue
    }
    const a = popIn(t, s.t0 + 0.1, 0.4)
    F.card.g.setAttribute('transform', `translate(290 ${lerp(1400, 760, a) + Math.sin(t * 2) * 6}) rotate(${-5 * a}) scale(1.15)`)
    F.card.q.style.display = 'none'
    place(F.ev, 790, 820 + Math.sin(t * 2.3) * 8, popIn(t, s.t0 + 0.6, 0.4) * 0.9, 4)
    head(t, s.t0 + 0.15, s.t1 - 0.1)
    st(t, s.t0 + 0.9, s.t1)
  }
  if (bolt) bolt.style.opacity = Math.floor(t * 7) % 5 === 0 ? 0.2 : 1
  if (clockHands) {
    const sp = prog(t, SEC.secretaire.t0 + 0.6, 1.4, ease.out3)
    const [mn, hr] = clockHands.children
    mn.setAttribute('transform', `rotate(${360 * 3 * sp})`)
    hr.setAttribute('transform', `rotate(${lerp(90, 210, sp)})`)
  }

  // L'indice.
  pieces.forEach((g, i) => {
    const a = popIn(t, S('07') + i * 0.12, 0.4)
    place(g, 190 + i * 350, 1000 + Math.sin(t * 2 + i) * 6, a * 0.95, (i - 1) * 4)
  })
  const sweep = prog(t, Wd('07', 'impossible') - 0.4, 2.2, ease.io2)
  const lx = 190 + 700 * Math.sin(sweep * Math.PI * 1.5) ** 2 * (sweep < 2 / 3 ? 1 : 1)
  place(loupe, lerp(190, 890, (1 - Math.cos(sweep * Math.PI * 2)) / 2), 980, popIn(t, Wd('07', 'impossible') - 0.4, 0.3) * (t < Wd('07', 'et') - 0.1 ? 1 : 0), 0)
  void lx
  T.unseul(t, Wd('07', 'un', 1) - 0.08, SEC.indice.t1 - 0.1)
  ST.imposs2(t, Wd('07', 'impossible') - 0.05, Wd('07', 'un', 1) - 0.1)
  const eyeS = popIn(t, Wd('07', 'reponse') - 0.15, 0.35)
  const blink = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - Wd('07', 'yeux')) / 0.18)) * Math.PI))
  eye.setAttribute('transform', `translate(540 620) scale(${Math.max(0.001, eyeS)} ${Math.max(0.001, eyeS * (1 - 0.9 * blink))})`)
  T.yeux(t, Wd('07', 'sous') - 0.08, SEC.indice.t1 - 0.1)

  // Le vote.
  voteCards.forEach((c, i) => {
    const a = popIn(t, SEC.vote.t0 + 0.2 + i * 0.12, 0.4)
    const look = Math.sin(t * 1.7 + i * 2) * 4
    c.eyes.setAttribute('transform', `translate(${look} 0)`)
    c.g.setAttribute('transform', `translate(${200 + i * 340} ${lerp(1500, 860, a) + Math.sin(t * 2.4 + i) * 5}) rotate(${(i - 1) * 4 * a}) scale(0.95)`)
  })
  T.qui(t, Wd('08', 'qui') - 0.08)
  endParts.forEach((el, i) => {
    const t0 = [Wd('08', 'ecris'), Wd('08', 'dossier') - 0.4, Wd('08', 'dossier')][i] - 0.1
    const a = popIn(t, t0, 0.35)
    el.style.visibility = a > 0.01 ? '' : 'hidden'
    el.style.transform = `translate(-50%, 0) scale(${a.toFixed(3)}) rotate(${[-2, 0, 1][i]}deg)`
  })

  // Transitions.
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'dots')) {
      const u = t - (s.t0 - 0.22) - d
      if (u > 0 && u < 0.44) {
        r = 95 * Math.sin(Math.PI * (u / 0.44))
        el.setAttribute('fill', CUT_COL[s.id])
      }
    }
    el.setAttribute('r', r.toFixed(1))
  }
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.22) f = 0.8 * (1 - (t - s.t0) / 0.22) ** 2
  for (const t0 of IMPACTS) if (t >= t0 && t < t0 + 0.1) f = Math.max(f, 0.3 * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))

  // HUD.
  chip.textContent = `PIÈCE ${pieceIdx[sec.id]}/7`
  rec.style.opacity = Math.floor(t * 2) % 2 ? '0.2' : '1'
  const dark = ['suspects', 'vote'].includes(sec.id) || (sec.id === 'plan' && t > Wd('02', 'et') - 0.1)
  ui.classList.toggle('dark', dark)
  updateCaptions(t)
  updateDeps(t)

  const r = rng(Math.floor((t * FPS) / 2) + 9)
  dctx.clearRect(0, 0, 540, 960)
  for (let i = 0; i < 260; i++) {
    dctx.fillStyle = i < 200 ? 'rgba(244,234,210,0.9)' : 'rgba(29,42,92,0.5)'
    dctx.fillRect(r() * 540, r() * 960, 1 + r() * 1.5, 1 + r() * 1.5)
  }
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 120px "Fraunces Variable"')
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
