/**
 * ============================================================================
 *  « Affaire Classée ? » — la chauffeuse de bus (≈ 72 s, 1080 × 1920)
 * ============================================================================
 *  Style A : motion design 2D vectoriel en SVG, gros sous-titres animés.
 *
 *  1. Le bus de nuit : Nadia verrouille les portes et file au commissariat ;
 *     la jeune femme et l'homme visibles dès la première image.
 *  2. La caméra du bus (cadre REC) : il la colle, sa main… arrêt sur image.
 *  3. Sa fiche : 41 ans, chauffeuse depuis 15 ans… tampon « JUGÉE ».
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
const NADIA = { robe: '#1d3557', jabot: false, collar: '#9ec5ff', hair: 'bun', hairColor: '#1d140e', female: true, skin: '#a86b45', iris: '#2b1d12' }
const NADIA_BOX = { ...NADIA, robe: '#6b7280', collar: '#e5e7eb' }
const JEUNE = { robe: '#e07a5f', jabot: false, collar: '#f2cc8f', hair: 'bob', hairColor: '#7a3b1f', female: true, skin: '#f6d2b5', iris: '#3b5b8a' }
const HOMME = { robe: '#4a5568', jabot: false, collar: '#cbd5e0', hair: 'slick', hairColor: '#5a4a3a', skin: '#e8b48c', iris: '#2b1d12' }
const PASS1 = { robe: '#2a9d8f', jabot: false, hair: 'short', hairColor: '#1d140e', skin: '#7a4a2e', iris: '#2b1d12' }
const PASS2 = { robe: '#ffb703', jabot: false, hair: 'bun', hairColor: '#b5835a', female: true, skin: '#f0c4a0', iris: '#2b1d12' }

// La main posée (vue de dessus).
function hand(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('path', { d: 'M -60 -30 Q -70 -70 -30 -70 L 50 -70 Q 76 -70 76 -44 L 76 -10 Q 76 14 50 14 L -30 14 Q -60 14 -60 -30 Z', fill: '#e8b48c', stroke: '#10121a', 'stroke-width': 6 }, g)
  for (let k = 0; k < 4; k++) svg('path', { d: `M ${-34 + k * 26} 12 L ${-34 + k * 26} 48`, stroke: '#10121a', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
  for (let k = 0; k < 4; k++) svg('path', { d: `M ${-34 + k * 26} 12 L ${-34 + k * 26} 46`, stroke: '#e8b48c', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
  return g
}
// Le cadenas.
function padlock(parent, s = 1) {
  const g = svg('g', { transform: `scale(${s})` }, parent)
  svg('path', { d: 'M -46 -10 L -46 -60 Q -46 -110 0 -110 Q 46 -110 46 -60 L 46 -10', fill: 'none', stroke: '#cfd8e8', 'stroke-width': 22 }, g)
  svg('rect', { x: -76, y: -20, width: 152, height: 130, rx: 20, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 7 }, g)
  svg('circle', { cx: 0, cy: 34, r: 16, fill: '#10121a' }, g)
  svg('rect', { x: -6, y: 40, width: 12, height: 40, rx: 6, fill: '#10121a' }, g)
  return g
}
// La ville qui défile derrière les vitres (une bande qu'on fait glisser).
function city(parent, seed) {
  const g = svg('g', {}, parent)
  const r = rng(seed)
  for (let i = 0; i < 30; i++) {
    const x = i * 150
    const h = 140 + r() * 260
    svg('rect', { x, y: 780 - h, width: 130, height: h, fill: ['#2a3350', '#33405f', '#222a42'][i % 3] }, g)
    for (let k = 0; k < 6; k++) if (r() > 0.45) svg('rect', { x: x + 16 + (k % 3) * 38, y: 800 - h + Math.floor(k / 3) * 50, width: 22, height: 26, fill: '#ffd99a', opacity: 0.8 }, g)
    if (i % 5 === 2) {
      svg('rect', { x: x + 60, y: 560, width: 10, height: 220, fill: '#9aa3b5' }, g)
      svg('rect', { x: x + 30, y: 540, width: 70, height: 50, rx: 8, fill: '#3b82f6' }, g)
      txt(g, 'ARRÊT', { x: x + 65, y: 574, 'font-size': 18, fill: '#fff' })
    }
    if (i === 17) {
      svg('rect', { x: x - 20, y: 470, width: 260, height: 310, fill: '#1d2a5c' }, g)
      svg('rect', { x: x - 10, y: 490, width: 240, height: 54, fill: '#3b82f6' }, g)
      txt(g, 'POLICE', { x: x + 110, y: 532, 'font-size': 40, fill: '#fff' })
    }
  }
  for (let i = 0; i < 40; i++) svg('circle', { cx: i * 120 + 40, cy: 430, r: 6, fill: '#ffe7a0', opacity: 0.8 }, g)
  return g
}

// L'intérieur du bus : vitres, barres, passagers, la jeune femme et l'homme, Nadia au volant.
function bus(L, id) {
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#cfd6e2' }, L.far)
  svg('rect', { x: -400, y: -400, width: W + 800, height: 660, fill: '#9aa6bd' }, L.far)
  for (const x of [200, 560, 920]) svg('rect', { x: x - 110, y: 230, width: 220, height: 22, rx: 10, fill: '#ffffff' }, L.far)
  const clip = svg('clipPath', { id: `win-${id}` }, defs)
  svg('rect', { x: -400, y: 380, width: W + 800, height: 400, rx: 26 }, clip)
  const winG = svg('g', { 'clip-path': `url(#win-${id})` }, L.far)
  svg('rect', { x: -400, y: 380, width: W + 800, height: 400, fill: '#121831' }, winG)
  const strip = city(winG, 11)
  svg('rect', { x: -400, y: 380, width: W + 800, height: 400, fill: '#9fc4e0', opacity: 0.08 }, winG)
  for (const x of [-60, 320, 700, 1080]) svg('rect', { x: x - 14, y: 370, width: 28, height: 420, fill: '#9aa6bd' }, L.far)
  svg('rect', { x: -400, y: 780, width: W + 800, height: 30, fill: '#7a869e' }, L.far)
  // Les sièges du fond.
  for (const x of [150, 400]) svg('rect', { x: x - 90, y: 760, width: 180, height: 220, rx: 30, fill: '#2f5d8a' }, L.far)
  const p1 = makePerson(L.mid, PASS1)
  const p2 = makePerson(L.mid, PASS2)
  const phones = [0, 1].map(() => {
    const g = svg('g', {}, L.mid)
    svg('rect', { x: -18, y: -30, width: 36, height: 60, rx: 8, fill: '#10121a' }, g)
    svg('rect', { x: -13, y: -24, width: 26, height: 44, rx: 4, fill: '#9fd8ff' }, g)
    return g
  })
  for (const x of [150, 400]) svg('rect', { x: x - 110, y: 930, width: 220, height: 120, rx: 30, fill: '#244a70' }, L.mid)
  // La banquette de la jeune femme.
  svg('rect', { x: 500, y: 760, width: 560, height: 260, rx: 34, fill: '#2f5d8a' }, L.mid)
  for (let k = 0; k < 7; k++) svg('rect', { x: 530 + k * 74, y: 790, width: 30, height: 200, rx: 12, fill: '#3b6ea0', opacity: 0.5 }, L.mid)
  const jeune = makePerson(L.actor, JEUNE)
  const homme = makePerson(L.actor, HOMME)
  const handG = svg('g', {}, L.actor)
  hand(handG, 0.8)
  svg('rect', { x: 480, y: 1060, width: 620, height: 110, rx: 30, fill: '#244a70' }, L.actor)
  // Barre jaune.
  svg('rect', { x: 448, y: 200, width: 26, height: 1300, rx: 13, fill: '#ffd166', stroke: '#b8892a', 'stroke-width': 4 }, L.actor)
  // Le poste de conduite (premier plan).
  const nadia = makePerson(L.front, NADIA)
  const dash = svg('g', {}, L.front)
  svg('path', { d: 'M -300 1290 L 700 1240 L 760 1900 L -300 1900 Z', fill: '#2b3344', stroke: '#10121a', 'stroke-width': 8 }, dash)
  svg('ellipse', { cx: 250, cy: 1250, rx: 200, ry: 62, fill: 'none', stroke: '#10121a', 'stroke-width': 30 }, dash)
  svg('ellipse', { cx: 250, cy: 1250, rx: 200, ry: 62, fill: 'none', stroke: '#3a4256', 'stroke-width': 16 }, dash)
  // Le bouton des portes.
  const panel = svg('g', { transform: 'translate(590 1300)' }, dash)
  svg('rect', { x: -80, y: -40, width: 160, height: 90, rx: 14, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 5 }, panel)
  txt(panel, 'PORTES', { x: 0, y: -8, 'font-size': 26, fill: '#cfd8e8' })
  const lamp = svg('circle', { cx: 0, cy: 22, r: 14, fill: '#2fd27a' }, panel)
  const lock = svg('g', {}, L.fx)
  padlock(lock, 1)
  return { strip, p1, p2, phones, jeune, homme, handG, nadia, lamp, lock }
}

// 1 · Le bus : Nadia verrouille les portes et file vers le commissariat.
const EMEUTE = scene('emeute', (L) => {
  bg(L, '#cfd6e2')
  return bus(L, 'a')
})

// 2 · La caméra du bus (fish-eye).
const VIDEO = scene('video', (L) => {
  bg(L, '#cfd6e2')
  const B = bus(L, 'b')
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#3f7a52', opacity: 0.22 }, L.fx)
  for (let y = -200; y < H + 200; y += 12) svg('rect', { x: -400, y, width: W + 800, height: 3, fill: '#000', opacity: 0.18 }, L.fx)
  const ring = svg('circle', { cx: 0, cy: 0, r: 110, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 700, 'stroke-dashoffset': 700 }, L.fx)
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
  const ines = makePerson(photo, NADIA)
  const rows = ['NADIA', '41 ANS', 'CHAUFFEUSE · 15 ANS', '0 ACCIDENT'].map((s, k) => {
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
  // Les portes du bus, verrouillées, qu'on frappe.
  const portes = prop((g) => {
    svg('rect', { x: -260, y: -300, width: 520, height: 600, rx: 16, fill: '#9aa6bd', stroke: '#10121a', 'stroke-width': 8 }, g)
    for (const x of [-240, 10]) svg('rect', { x, y: -280, width: 230, height: 560, rx: 10, fill: '#7fa8c8', stroke: '#10121a', 'stroke-width': 6 }, g)
    g.lock = svg('g', { transform: 'translate(0 40)' }, g)
    padlock(g.lock, 0.9)
    g.boum = [[-170, -180, -12], [170, -120, 10]].map(([x, y, r]) => {
      const b = svg('g', { transform: `translate(${x} ${y}) rotate(${r})` }, g)
      txt(b, 'BOUM !', { x: 0, y: 0, 'font-size': 64, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10, 'paint-order': 'stroke' })
      return b
    })
  })
  // La vitre : elle, coincée ; lui, tout contre.
  const vitre = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 30, fill: '#121831', stroke: '#9aa6bd', 'stroke-width': 18 }, g)
    const cl = svg('clipPath', { id: 'vitreClip' }, defs)
    svg('rect', { x: -290, y: -250, width: 580, height: 500, rx: 24 }, cl)
    const inner = svg('g', { 'clip-path': 'url(#vitreClip)' }, g)
    for (let i = 0; i < 6; i++) svg('rect', { x: -290 + i * 100, y: 0, width: 80, height: 250, fill: '#2a3350' }, inner)
    g.j = makePerson(inner, JEUNE)
    g.h = makePerson(inner, HOMME)
  })
  // Le téléphone (17) et le panneau « prochain arrêt ».
  const tel = prop((g) => {
    const p = svg('g', { transform: 'translate(-150 0) rotate(-6)' }, g)
    svg('rect', { x: -130, y: -240, width: 260, height: 480, rx: 36, fill: '#10121a' }, p)
    svg('rect', { x: -110, y: -210, width: 220, height: 420, rx: 18, fill: '#1d2a5c' }, p)
    txt(p, '17', { x: 0, y: -20, 'font-size': 130, fill: '#fff' })
    svg('circle', { cx: 0, cy: 120, r: 44, fill: '#2fd27a' }, p)
    g.stop = svg('g', { transform: 'translate(170 0)' }, g)
    svg('rect', { x: -10, y: -120, width: 20, height: 360, fill: '#9aa3b5' }, g.stop)
    svg('rect', { x: -120, y: -230, width: 240, height: 140, rx: 16, fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 6 }, g.stop)
    txt(g.stop, 'PROCHAIN', { x: 0, y: -170, 'font-size': 36, fill: '#fff' })
    txt(g.stop, 'ARRÊT', { x: 0, y: -118, 'font-size': 50, fill: '#fff' })
  })
  // L'arrêt : la silhouette qui file.
  const fuite = prop((g) => {
    svg('rect', { x: -320, y: -240, width: 640, height: 480, rx: 20, fill: '#1b2030', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -320, y: 150, width: 640, height: 90, fill: '#2b3344' }, g)
    svg('rect', { x: -230, y: -150, width: 16, height: 300, fill: '#9aa3b5' }, g)
    svg('rect', { x: -300, y: -200, width: 160, height: 90, rx: 12, fill: '#3b82f6' }, g)
    txt(g, 'ARRÊT', { x: -220, y: -140, 'font-size': 40, fill: '#fff' })
    g.run = svg('g', {}, g)
    svg('circle', { cx: 0, cy: -110, r: 38, fill: '#0b0d12' }, g.run)
    svg('path', { d: 'M -10 -70 L 10 40 M 10 40 L -40 140 M 10 40 L 70 120 M 0 -40 L -60 10 M 0 -40 L 70 -10', stroke: '#0b0d12', 'stroke-width': 30, 'stroke-linecap': 'round', fill: 'none' }, g.run)
    for (const y of [-60, 0, 60]) svg('path', { d: `M -150 ${y} L -90 ${y}`, stroke: '#9aa6b8', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.7 }, g.run)
    txt(g, '?', { x: 230, y: -90, 'font-size': 160, fill: '#ffd166' })
  })
  // Le badge : chauffeuse, pas juge.
  const badge = prop((g) => {
    svg('rect', { x: -290, y: -200, width: 580, height: 400, rx: 26, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'CHAUFFEUSE', { x: 0, y: -80, 'font-size': 70, fill: '#1d3557' })
    txt(g, 'JUGE', { x: 0, y: 90, 'font-size': 100, fill: '#6b7280' })
    g.cross = svg('path', { d: 'M -150 20 L 150 120 M 150 20 L -150 120', stroke: '#e5484d', 'stroke-width': 22, 'stroke-linecap': 'round' }, g)
  })
  // Le bus devant le commissariat.
  const commissariat = prop((g) => {
    svg('rect', { x: -330, y: -260, width: 660, height: 520, rx: 20, fill: '#121831', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -220, y: -230, width: 440, height: 300, fill: '#1d2a5c' }, g)
    svg('rect', { x: -200, y: -210, width: 400, height: 70, fill: '#3b82f6' }, g)
    txt(g, 'POLICE', { x: 0, y: -158, 'font-size': 56, fill: '#fff' })
    for (let k = 0; k < 4; k++) svg('rect', { x: -180 + k * 95, y: -110, width: 60, height: 70, fill: '#ffd99a', opacity: 0.8 }, g)
    g.bus = svg('g', {}, g)
    svg('rect', { x: -300, y: 60, width: 520, height: 150, rx: 22, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 7 }, g.bus)
    for (let k = 0; k < 5; k++) svg('rect', { x: -280 + k * 96, y: 80, width: 76, height: 56, rx: 8, fill: '#7fa8c8' }, g.bus)
    for (const x of [-200, 120]) svg('circle', { cx: x, cy: 214, r: 34, fill: '#10121a' }, g.bus)
    g.gyro = svg('circle', { cx: 230, cy: -230, r: 30, fill: '#3b82f6' }, g)
  })
  // La ligne paralysée.
  const ligne = prop((g) => {
    svg('rect', { x: -330, y: -200, width: 660, height: 400, rx: 24, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'LIGNE 38', { x: -300, y: -120, 'font-size': 54, fill: '#1d3557', 'text-anchor': 'start' })
    svg('path', { d: 'M -270 40 L 270 40', stroke: '#9aa3b5', 'stroke-width': 18, 'stroke-linecap': 'round' }, g)
    g.red = svg('path', { d: 'M -270 40 L 270 40', stroke: '#e5484d', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-dasharray': 540, 'stroke-dashoffset': 540 }, g)
    for (let k = 0; k < 6; k++) svg('circle', { cx: -270 + k * 108, cy: 40, r: 18, fill: '#fff', stroke: '#10121a', 'stroke-width': 6 }, g)
    txt(g, 'PERTURBÉE', { x: 0, y: 140, 'font-size': 52, fill: '#e5484d' })
  })
  // Le dossier : déjà connu.
  const dossier = prop((g) => {
    svg('path', { d: 'M -300 -200 L -100 -200 L -70 -240 L 300 -240 L 300 220 L -300 220 Z', fill: '#d9b77a', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -260, y: -170, width: 520, height: 350, fill: '#fbf8f0' }, g)
    txt(g, 'ANTÉCÉDENTS', { x: 0, y: -100, 'font-size': 50, fill: '#1d2a5c' })
    g.rows = [0, 1, 2].map((k) => {
      const r = svg('g', {}, g)
      txt(r, `AGRESSION · BUS ${['12', '27', '38'][k]}`, { x: 0, y: -20 + k * 62, 'font-size': 40, fill: '#e5484d' })
      return r
    })
  })
  // Cinq ans de prison.
  const prison = prop((g) => {
    svg('rect', { x: -300, y: -260, width: 600, height: 520, rx: 20, fill: '#1d2130', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, '5 ANS', { x: 0, y: 60, 'font-size': 170, fill: '#e5484d' })
    for (let i = 0; i < 6; i++) svg('rect', { x: -270 + i * 104, y: -260, width: 22, height: 520, rx: 11, fill: 'url(#bar)' }, g)
  })
  // Elle, arrivée.
  const photo = prop((g) => {
    svg('rect', { x: -260, y: -250, width: 520, height: 500, rx: 10, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 6 }, g)
    const cl = svg('clipPath', { id: 'jeuneClip' }, defs)
    svg('rect', { x: -230, y: -220, width: 460, height: 340 }, cl)
    const inner = svg('g', { 'clip-path': 'url(#jeuneClip)' }, g)
    svg('rect', { x: -230, y: -220, width: 460, height: 340, fill: '#f6c98a' }, inner)
    svg('rect', { x: 90, y: -190, width: 110, height: 140, fill: '#9fd8ff', stroke: '#c48a4a', 'stroke-width': 8 }, inner)
    g.j = makePerson(inner, JEUNE)
    txt(g, 'ARRIVÉE', { x: 0, y: 200, 'font-size': 52, fill: '#1d2a5c' })
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, portes, vitre, tel, fuite, badge, commissariat, ligne, dossier, prison, photo }
})

// 5 · Le vote, puis l'appel à l'abonnement : la démo du « + ».
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, NADIA_BOX)
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
txt(rec, 'REC · CAM 04 · BUS 38', { x: 160, y: 222, 'font-size': 32, fill: '#ffffff', 'text-anchor': 'start' })
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
const T_LOCK = Wd('01', 'verrouille') - 0.05
const T_CONSOLE = Wd('02', 'main') - 0.05
tag('UNE CHAUFFEUSE DE BUS', 'pill', { t0: 0, t1: T_LOCK - 0.05, y: 250, rot: -2 })
fs(tag('PORTES VERROUILLÉES.', 'slam white', { t0: T_LOCK, t1: Wd('01', 'quinze') - 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 82)
counterTag(Wd('01', 'quinze') - 0.1, Wd('01', 'jusquau') - 0.1, 15, 'PASSAGERS À BORD', { y: 300, dur: 0.5 })
tag('DIRECTION : COMMISSARIAT', 'pill red', { t0: Wd('01', 'jusquau') - 0.1, t1: Wd('01', 'sans') - 0.1, y: 250, rot: -2 })
fs(tag('SANS S’ARRÊTER.', 'slam yellow', { t0: Wd('01', 'sans') - 0.06, t1: Wd('01', 'aujourdhui') - 0.1, y: 300, rot: -3, from: 2.6, dur: 0.2 }), 104)
fs(tag('C’EST ELLE QU’ON JUGE', 'stamp', { t0: Wd('01', 'elle', 1) - 0.05, t1: SEC.emeute.t1, y: 320, rot: -6, from: 2.8, dur: 0.2 }), 80)
tag('IL LA COLLE', 'pill red', { t0: Wd('02', 'coller') - 0.1, t1: Wd('02', 'six') - 0.1, y: 300, rot: -2 })
tag('DEPUIS 6 ARRÊTS', 'pill', { t0: Wd('02', 'six') - 0.1, t1: T_CONSOLE - 0.05, y: 300, rot: -2 })
fs(tag('SA MAIN SUR SA CUISSE.', 'slam white', { t0: T_CONSOLE, t1: Wd('02', 'personne') - 0.1, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 80)
tag('PERSONNE NE BOUGE', 'pill red', { t0: Wd('02', 'personne') - 0.1, t1: SEC.video.t1, y: 300, rot: -2 })
fs(tag('JUGÉE', 'stamp', { t0: Wd('03', 'jugee') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
tag('ENFERMÉS CONTRE LEUR GRÉ', 'pill', { t0: Wd('04', 'enfermees') - 0.1, t1: Wd('04', 'tape') - 0.1, y: 230, rot: -2 })
tag('ILS TAPENT SUR LES PORTES', 'pill red', { t0: Wd('04', 'tape') - 0.1, t1: Wd('04', 'crise') - 0.1, y: 230, rot: -2 }).el.style.fontSize = '50px'
fs(tag('CRISE DE PANIQUE.', 'slam white', { t0: Wd('04', 'crise') - 0.06, t1: E('04') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 96)
tag('ET ELLE ?', 'pill yellow', { t0: Wd('05', 'jeune') - 0.1, t1: Wd('05', 'coincee') - 0.1, y: 230, rot: -2 })
fs(tag('COINCÉE CONTRE LA VITRE', 'slam white', { t0: Wd('05', 'coincee') - 0.06, t1: Wd('05', 'vingt') - 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 76)
counterTag(Wd('05', 'vingt') - 0.1, E('05') + 0.1, 20, 'MINUTES', { y: 230, dur: 0.5 })
tag('APPELER LA POLICE', 'pill', { t0: Wd('06', 'dappeler') - 0.1, t1: Wd('06', 'douvrir') - 0.1, y: 230, rot: -2 })
fs(tag('OUVRIR LES PORTES.', 'slam white', { t0: Wd('06', 'douvrir') - 0.06, t1: E('06') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 96)
fs(tag('IL DESCENDAIT.', 'slam yellow', { t0: Wd('07', 'descendait') - 0.06, t1: Wd('07', 'police') - 0.1, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 130)
tag('PLUS PERSONNE À ARRÊTER', 'pill red', { t0: Wd('07', 'police') - 0.1, t1: E('07') + 0.1, y: 230, rot: -2 })
tag('PAS À ELLE DE DÉCIDER', 'pill', { t0: Wd('08', 'chauffeuse') - 0.1, t1: Wd('08', 'qui') - 0.1, y: 230, rot: -2 })
fs(tag('QUI EST COUPABLE ?', 'slam white', { t0: Wd('08', 'qui') - 0.06, t1: E('08') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 100)
fs(tag('RIEN DÉCIDÉ.', 'slam yellow', { t0: Wd('09', 'rien') - 0.06, t1: Wd('09', 'amene') - 0.1, y: 230, rot: -3, from: 2.6, dur: 0.2 }), 140)
tag('DEVANT CEUX QUI DÉCIDENT', 'pill yellow', { t0: Wd('09', 'amene') - 0.1, t1: E('09') + 0.1, y: 230, rot: -2 }).el.style.fontSize = '52px'
counterTag(Wd('10', 'quarante') - 0.1, Wd('10', 'ligne') - 0.3, 40, 'MIN DE RETARD', { y: 230, dur: 0.5 })
tag('UNE LIGNE PARALYSÉE', 'pill red', { t0: Wd('10', 'ligne') + 0.02, t1: Wd('10', 'simple') - 0.15, y: 230, rot: -2 })
fs(tag('UN SIMPLE SOUPÇON.', 'slam white', { t0: Wd('10', 'simple') - 0.15, t1: E('10') + 0.1, y: 230, rot: -3, from: 2.4, dur: 0.2 }), 92)
tag('UN SOUPÇON ?', 'pill yellow', { t0: S('11') - 0.05, t1: Wd('11', 'trois') - 0.1, y: 230, rot: -2 })
fs(tag('3 AGRESSIONS.', 'slam yellow', { t0: Wd('11', 'trois') - 0.06, t1: E('11') + 0.15, y: 230, rot: -3, from: 3, dur: 0.2 }), 140)
tag('5 ANS DE PRISON', 'pill red', { t0: Wd('12', 'cinq') - 0.1, t1: Wd('12', 'quinze') - 0.1, y: 240, rot: -2 })
fs(tag('15 INNOCENTS ?', 'slam white', { t0: Wd('12', 'quinze') - 0.06, t1: E('12') + 0.1, y: 240, rot: -3, from: 2.4, dur: 0.2 }), 120)
tag('15 PASSAGERS EN RETARD', 'pill', { t0: Wd('13', 'quinze') - 0.1, t1: Wd('13', 'une') - 0.1, y: 240, rot: -2 })
tag('ELLE : ARRIVÉE TOUT COURT', 'pill yellow', { t0: Wd('13', 'une') - 0.1, t1: Wd('13', 'cest') - 0.1, y: 240, rot: -2 }).el.style.fontSize = '50px'
fs(tag('C’EST ÇA QU’ON PUNIT ?', 'slam yellow', { t0: Wd('13', 'cest') - 0.1, t1: E('13') + 0.15, y: 260, rot: -3, from: 3, dur: 0.2 }), 70)
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
  [T_LOCK, 16],
  [Wd('01', 'sans') - 0.06, 14],
  [Wd('01', 'elle', 1) - 0.05, 12],
  [T_CONSOLE, 14],
  [Wd('03', 'jugee') - 0.05, 16],
  [Wd('04', 'crise') - 0.06, 12],
  [Wd('05', 'coincee') - 0.06, 12],
  [Wd('06', 'douvrir') - 0.06, 10],
  [Wd('07', 'descendait') - 0.06, 14],
  [Wd('08', 'qui') - 0.06, 10],
  [Wd('09', 'rien') - 0.06, 12],
  [Wd('10', 'simple') - 0.15, 12],
  [Wd('11', 'trois') - 0.06, 16],
  [Wd('12', 'quinze') - 0.06, 14],
  [Wd('13', 'cest') - 0.1, 16],
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

  // Le bus (scènes 1 et 2).
  const ride = (B, tt, { scroll = 0, press = 0, lockOn = 0, close = 0, handOn = 0, tremble = 0, nadiaLook = -0.3 } = {}) => {
    B.strip.setAttribute('transform', `translate(${-(scroll % 3000)} 0)`)
    B.p1.update(tt, { x: 150, y: 830, scale: 0.42, brows: 'neutral', look: [0.2, 0.6], armR: [0.3, 1.6], armL: [0.3, 1.6], seed: 3.3, headNod: 0.3 })
    B.p2.update(tt, { x: 400, y: 830, scale: 0.42, brows: 'neutral', look: [-0.2, 0.6], armR: [0.3, 1.6], armL: [0.3, 1.6], seed: 4.4, headNod: 0.3 })
    place(B.phones[0], 150, 905, 1, 0)
    place(B.phones[1], 400, 905, 1, 0)
    const jx = 650 + 10 * tremble * Math.sin(tt * 60)
    B.jeune.update(tt, { x: jx, y: 900, scale: 0.56, brows: close > 0.3 ? 'sad' : 'neutral', look: [-0.6, 0.3], armR: [0.15, 0.4], armL: [0.1, 0.4], seed: 2.1, headTilt: -0.25 * close })
    const hx = lerp(900, 830, close)
    const arm = [lerp(0.15, 0.32, handOn), lerp(0.4, 0.5, handOn)]
    B.homme.update(tt, { x: hx, y: 890, scale: 0.6, brows: 'neutral', look: [-0.8, 0.4], armR: [0.15, 0.4], armL: arm, seed: 1.7, headTilt: -0.15 * close })
    const [ax, ay] = handAt(hx, 890, 0.6, arm, -1)
    show(B.handG, handOn > 0.01)
    place(B.handG, lerp(ax, 640, handOn), lerp(ay, 1050, handOn), 0.8, -10)
    // Nadia, au volant.
    const armR = [lerp(0.3, 0.75, press), lerp(0.8, 0.6, press)]
    B.nadia.update(tt, { x: 250, y: 1150, scale: 0.72, brows: press > 0.3 ? 'determined' : 'neutral', look: [nadiaLook, -0.1], armR, armL: [0.3, 0.8], seed: 0.9, headTilt: 0.05 })
    B.lamp.setAttribute('fill', lockOn > 0.5 ? '#e5484d' : '#2fd27a')
    show(B.lock, lockOn > 0.01)
    place(B.lock, 640, 1110 - 40 * lockOn, 0.9 * lockOn, -8)
    return { hand: [lerp(ax, 640, handOn), lerp(ay, 1050, handOn)] }
  }
  if (cur === EMEUTE) {
    const a = prog(t, T_LOCK - 0.3, 0.4, ease.io3)
    const b = prog(t, Wd('01', 'quinze') - 0.3, 0.5, ease.io3)
    const c = prog(t, Wd('01', 'elle', 1) - 0.2, 0.5, ease.io3)
    const zoom = lerp(lerp(lerp(1.12, 1.3, a), 1.0, b), 1.06, c)
    const cx = lerp(lerp(lerp(420, 470, a), 540, b), 520, c)
    const cy = lerp(lerp(lerp(1080, 1180, a), 980, b), 1000, c)
    cam(EMEUTE, t, { zoom, cx, cy, push: 0.01, hand: 3 })
    const press = prog(t, T_LOCK - 0.3, 0.25, ease.out3) * (1 - prog(t, T_LOCK + 0.4, 0.3, ease.io3))
    const lockOn = popS(t, T_LOCK, Wd('01', 'quinze') + 0.6, 0.3)
    // Vitesse de la ville : douce, puis pied au plancher.
    const fast = prog(t, Wd('01', 'roule') - 0.3, 0.8, ease.in3)
    const scroll = t * 260 + Math.max(0, t - Wd('01', 'roule')) * 1600 * fast
    ride(EMEUTE, t, { scroll, press, lockOn, close: 1, handOn: 0, nadiaLook: t > Wd('01', 'quinze') ? -0.4 : -0.1 })
  }
  if (cur === VIDEO) {
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.8
    const tt = frozen ? T_CONSOLE : t
    const close = prog(tt, Wd('02', 'coller') - 0.3, 0.8, ease.io3)
    const handOn = prog(tt, T_CONSOLE - 0.35, 0.3, ease.out3)
    const tremble = tt > Wd('02', 'tremble') - 0.1 ? 1 : 0
    const P = ride(VIDEO, tt, { scroll: tt * 220, close, handOn, tremble, nadiaLook: -0.2 })
    const focus = prog(tt, Wd('02', 'homme') - 0.3, 0.6, ease.io3) * (1 - prog(tt, Wd('02', 'personne') - 0.3, 0.5, ease.io3))
    const zoomC = frozen ? 0.15 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 0
    cam(VIDEO, tt, { zoom: 1.0 + 0.3 * focus + zoomC, cx: frozen ? 700 : lerp(540, 740, focus), cy: frozen ? 920 : lerp(1000, 900, focus), push: 0.006, hand: 0 })
    place(VIDEO.ring, P.hand[0], P.hand[1] + 10, 1, 0)
    VIDEO.ring.setAttribute('stroke-dashoffset', 700 * (1 - prog(t, T_CONSOLE + 0.05, 0.4, ease.out3)))
    VIDEO.ring.setAttribute('opacity', 1 - prog(t, Wd('02', 'personne') - 0.2, 0.3))
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    recTime.textContent = `23:14:${String(30 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['nadia', 'quarante', 'chauffeuse', 'jamais']
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
    if (prop(TRIB.portes, id === '04', Wd('04', 'enfermees') - 0.2, E('04') + 0.05, 540, 500, 0.64) > 0) {
      TRIB.portes.boum.forEach((b, k) => b.setAttribute('opacity', t > Wd('04', 'tape') - 0.1 + k * 0.2 && Math.floor(t * 6 + k) % 2 ? 1 : 0))
    }
    if (prop(TRIB.vitre, id === '05', Wd('05', 'jeune') - 0.2, E('05') + 0.05, 540, 500, 0.66) > 0) {
      const c = prog(t, Wd('05', 'coincee') - 0.2, 0.4, ease.out3)
      TRIB.vitre.j.update(t, { x: lerp(-60, -150, c), y: 230, scale: 0.55, brows: 'sad', look: [-0.6, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 3, headTilt: -0.3 * c })
      TRIB.vitre.h.update(t, { x: lerp(200, 60, c), y: 220, scale: 0.6, brows: 'neutral', look: [-0.8, 0.3], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 4 })
    }
    if (prop(TRIB.tel, id === '06', Wd('06', 'dappeler') - 0.2, E('06') + 0.05, 540, 500, 0.62) > 0) {
      const s = popS(t, Wd('06', 'prochain') - 0.2, Infinity, 0.3)
      TRIB.tel.stop.setAttribute('transform', `translate(170 0) scale(${Math.max(0.001, s)})`)
    }
    if (prop(TRIB.fuite, id === '07', S('07') - 0.05, E('07') + 0.05, 540, 500, 0.62) > 0) {
      const u = prog(t, Wd('07', 'descendait') - 0.1, 0.9, ease.in3)
      TRIB.fuite.run.setAttribute('transform', `translate(${lerp(-60, 420, u)} 30)`)
    }
    if (prop(TRIB.badge, id === '08', Wd('08', 'chauffeuse') - 0.2, E('08') + 0.05, 540, 500, 0.68, -3) > 0) {
      TRIB.badge.cross.setAttribute('opacity', t > Wd('08', 'decider') - 0.1 ? 1 : 0)
    }
    if (prop(TRIB.commissariat, id === '09', Wd('09', 'amene') - 0.2, E('09') + 0.05, 540, 500, 0.62) > 0) {
      TRIB.commissariat.bus.setAttribute('transform', `translate(${lerp(-500, 0, prog(t, Wd('09', 'amene'), 0.8, ease.out3))} 0)`)
      TRIB.commissariat.gyro.setAttribute('fill', Math.floor(t * 4) % 2 ? '#3b82f6' : '#e5484d')
    }
    if (prop(TRIB.ligne, id === '10', Wd('10', 'ligne') - 0.2, E('10') + 0.05, 540, 500, 0.75) > 0) {
      TRIB.ligne.red.setAttribute('stroke-dashoffset', 540 * (1 - prog(t, Wd('10', 'paralysee') - 0.3, 0.7, ease.out3)))
    }
    if (prop(TRIB.dossier, id === '11', Wd('11', 'lhomme') - 0.2, E('11') + 0.05, 540, 500, 0.72, 3) > 0) {
      TRIB.dossier.rows.forEach((r, k) => r.setAttribute('opacity', t > Wd('11', 'trois') - 0.1 + k * 0.15 ? 1 : 0))
    }
    prop(TRIB.prison, id === '12', Wd('12', 'cinq') - 0.15, E('12') + 0.05, 540, 480, 0.62)
    if (prop(TRIB.photo, id === '13', Wd('13', 'une') - 0.15, E('13') + 0.05, 540, 490, 0.68, 4) > 0) {
      TRIB.photo.j.update(t, { x: -40, y: 130, scale: 0.46, brows: 'neutral', mouth: 0.25, look: [0.1, 0], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 5 })
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
