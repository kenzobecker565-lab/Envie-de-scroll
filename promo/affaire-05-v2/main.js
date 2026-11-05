/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°5, version 2 : l'adresse (≈ 1 min 29)
 * ============================================================================
 *  Style A (celui du faux chirurgien) : motion design 2D vectoriel en SVG.
 *  Aplats, parallaxe, mots qui claquent, gros sous-titres animés, pas de jauge.
 *  Mêmes voix ElevenLabs que la version 1 (voir README).
 *
 *  1. L'accroche, refaite pour frapper dès la première image :
 *     - le post-it : l'adresse s'écrit sous nos yeux, entourée au feutre
 *       rouge, puis une main l'arrache ;
 *     - la carte de nuit : la voiture suit l'itinéraire GPS jusqu'à la
 *       maison, et à « agressé » l'écran explose en gyrophares ;
 *     - le box : le projecteur s'allume sur Sarah, le post-it sous scellé.
 *  2. Les faits : l'immeuble et les 11 mois impayés, la voiture, l'appartement vide.
 *  3. Le procès : procureur et avocat se répondent, un accessoire par argument.
 *  4. Le vote, puis l'appel à s'abonner.
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

// ------------------------------------------------------------------ outils

const NS = 'http://www.w3.org/2000/svg'
function svg(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.append(el)
  return el
}
const txt = (parent, s, attrs) => {
  const el = svg('text', { 'font-family': 'Figtree Variable', 'font-weight': 900, ...attrs }, parent)
  el.textContent = s
  return el
}
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
const back = ease.back(1.8)
const popS = (t, t0, t1 = Infinity, dur = 0.4) => {
  const a = t < t0 ? 0 : back(clamp((t - t0) / dur))
  const b = t1 === Infinity ? 1 : 1 - ease.in3(clamp((t - t1) / 0.25))
  return Math.max(0, a * b)
}
const show = (el, on) => el.setAttribute('display', on ? 'inline' : 'none')
const place = (el, x, y, s = 1, r = 0) => el.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${Math.max(0.001, s)})`)

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('deskTop', [[0, '#3a2418'], [1, '#160c08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lampHot', [[0, '#fff1c8', 0.55], [0.5, '#ffd88a', 0.15], [1, '#ffd88a', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowRed', [[0, '#ff2a3d', 0.9], [1, '#ff2a3d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowBlue', [[0, '#2f6bff', 0.9], [1, '#2f6bff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('court', [[0, '#27305a'], [1, '#121733']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtRed', [[0, '#5a1f1a'], [1, '#1e0b08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtDark', [[0, '#141a33'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spot', [[0, '#bcd2ff', 0.38], [1, '#bcd2ff', 0]], { cx: 0.5, cy: 0.35, r: 0.55 })
grad('beam', [[0, '#ffe7b0', 0.45], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('dusk', [[0, '#3b3f8f'], [0.55, '#e0806a'], [1, '#f6c48a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('night', [[0, '#0a1030'], [1, '#1c2350']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lampCone', [[0, '#ffe7a8', 0.5], [1, '#ffe7a8', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('wallBeige', [[0, '#efe3cc'], [1, '#d8c6a4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('doorLight', [[0, '#fff6d8', 0.7], [1, '#fff6d8', 0]], { x1: 1, y1: 0, x2: 0, y2: 0 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.55]], { cx: 0.5, cy: 0.45, r: 0.75 })
// Trame de points (impression BD) pour les fonds des répliques-chocs.
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
const desk = (layer, y = 1790) => {
  const g = svg('g', {}, layer)
  svg('rect', { x: -300, y, width: W + 600, height: 500, fill: 'url(#desk)' }, g)
  svg('rect', { x: -300, y: y - 10, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, g)
  return g
}
const ecgPoints = (y0, amp = 1) => {
  const pts = []
  for (let x = -60; x <= W + 60; x += 6) {
    const p = ((((x + 60) % 360) + 360) % 360) / 360
    let y = 0
    if (p > 0.42 && p < 0.46) y = -30 * Math.sin(((p - 0.42) / 0.04) * Math.PI)
    if (p > 0.5 && p < 0.53) y = 26 * ((p - 0.5) / 0.03)
    if (p > 0.53 && p < 0.57) y = 26 - 200 * ((p - 0.53) / 0.04)
    if (p > 0.57 && p < 0.61) y = -174 + 224 * ((p - 0.57) / 0.04)
    if (p > 0.61 && p < 0.64) y = 50 - 50 * ((p - 0.61) / 0.03)
    pts.push(`${x},${y0 + y * amp}`)
  }
  return pts.join(' ')
}
// Gyrophares : deux halos (rouge, bleu) qui alternent.
function gyro(layer, { r = 900, y = 960 } = {}) {
  const red = svg('ellipse', { cx: 0, cy: y, rx: r, ry: r, fill: 'url(#glowRed)', opacity: 0 }, layer)
  const blue = svg('ellipse', { cx: W, cy: y, rx: r, ry: r, fill: 'url(#glowBlue)', opacity: 0 }, layer)
  return (t, k) => {
    const ph = (t * 2.6) % 1
    red.setAttribute('opacity', (k * (ph < 0.5 ? 1 : 0.15)).toFixed(3))
    blue.setAttribute('opacity', (k * (ph < 0.5 ? 0.15 : 1)).toFixed(3))
  }
}

const SARAH = { robe: '#2f7d6d', jabot: false, collar: '#f6f1e6', hair: 'bob', hairColor: '#6b3a1e', female: true, skin: '#f2c4a0', iris: '#3b5a2a' }
const AMI = { robe: '#5b6573', jabot: false, hair: 'messy', hairColor: '#2a1c12', beard: true, skin: '#e0a982', iris: '#2b1d12' }
const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12' }

// Le post-it (dessiné une fois, réutilisé sous scellé dans le box).
function postit(parent, { write = true } = {}) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -300, y: -290, width: 620, height: 620, rx: 10, fill: '#000', opacity: 0.35, transform: 'translate(18 26)' }, g)
  svg('path', { d: 'M -310 -310 L 310 -310 L 310 250 Q 250 300 200 310 L -310 310 Z', fill: '#ffd84d' }, g)
  svg('path', { d: 'M -310 -310 L 310 -310 L 310 -230 L -310 -230 Z', fill: '#f2c53a' }, g)
  svg('path', { d: 'M 310 250 Q 250 300 200 310 Q 230 270 240 230 Z', fill: '#d9a92a' }, g)
  const hand = { 'font-family': 'Fraunces Variable', 'font-style': 'italic', 'font-weight': 600, fill: '#1c2a6b' }
  const lines = [
    svg('text', { x: -250, y: -110, 'font-size': 84, ...hand }, g),
    svg('text', { x: -250, y: 10, 'font-size': 84, ...hand }, g),
    svg('text', { x: -250, y: 150, 'font-size': 64, ...hand }, g),
  ]
  lines[0].textContent = '12, rue'
  lines[1].textContent = 'des Lilas'
  lines[2].textContent = 'Bât. B – 3ᵉ ét.'
  svg('path', { d: 'M -250 40 Q 0 52 230 34', fill: 'none', stroke: '#1c2a6b', 'stroke-width': 7, 'stroke-linecap': 'round' }, g)
  const clipId = `pc${Math.random().toString(36).slice(2, 7)}`
  const clip = svg('clipPath', { id: clipId }, defs)
  const rows = [[-200, 40], [-80, 50], [70, 120]].map(([y, h]) => svg('rect', { x: -260, y: y - 10, width: write ? 0 : 560, height: h + 120 }, clip))
  for (const l of lines) l.setAttribute('clip-path', `url(#${clipId})`)
  g.lastChild.setAttribute('clip-path', `url(#${clipId})`)
  // Entouré au feutre rouge.
  const ring = svg('path', { d: 'M -280 -90 C -300 -230 260 -240 270 -110 C 280 40 -200 80 -270 -20 C -300 -70 -240 -150 -150 -170', fill: 'none', stroke: '#e5484d', 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-dasharray': 1900, 'stroke-dashoffset': write ? 1900 : 0 }, g)
  return { g, rows, ring }
}

// 1 · Le post-it sur le bureau, la nuit.
const ADRESSE = scene('adresse', (L) => {
  bg(L, 'url(#deskTop)')
  const r = rng(3)
  for (let i = 0; i < 14; i++) svg('rect', { x: -400, y: -300 + i * 190, width: W + 800, height: 6, fill: '#000', opacity: 0.25 }, L.far)
  for (let i = 0; i < 40; i++) svg('path', { d: `M ${r() * W} ${r() * H} q ${60 + r() * 80} ${-6 + r() * 12} ${160 + r() * 200} 0`, fill: 'none', stroke: '#5a3a26', 'stroke-width': 3, opacity: 0.5 }, L.far)
  svg('circle', { cx: 540, cy: 860, r: 760, fill: 'url(#lampHot)' }, L.far)
  const gy = gyro(L.far, { r: 1000, y: 700 })
  // Accessoires du bureau : un stylo, un trousseau, une tasse vue de dessus.
  const cup = svg('g', { transform: 'translate(900 1530)' }, L.mid)
  svg('circle', { r: 140, fill: '#f4efe6' }, cup)
  svg('circle', { r: 108, fill: '#3b2416' }, cup)
  svg('rect', { x: 120, y: -30, width: 80, height: 60, rx: 28, fill: 'none', stroke: '#f4efe6', 'stroke-width': 24 }, cup)
  const keys = svg('g', { transform: 'translate(150 1560) rotate(-20)' }, L.mid)
  svg('circle', { r: 46, fill: 'none', stroke: '#c9ced6', 'stroke-width': 12 }, keys)
  svg('path', { d: 'M 40 20 L 200 70 L 196 96 L 170 90 L 166 110 L 146 104', fill: 'none', stroke: '#e1bf63', 'stroke-width': 22, 'stroke-linejoin': 'round' }, keys)
  const note = postit(L.actor)
  // Le feutre qui écrit.
  const pen = svg('g', {}, L.fx)
  svg('rect', { x: -22, y: -330, width: 44, height: 300, rx: 18, fill: '#e5484d' }, pen)
  svg('rect', { x: -22, y: -330, width: 44, height: 70, rx: 18, fill: '#10121a' }, pen)
  svg('path', { d: 'M -22 -32 L 22 -32 L 6 0 L -6 0 Z', fill: '#10121a' }, pen)
  // La main qui arrache le post-it.
  const hand = svg('g', {}, L.fx)
  svg('rect', { x: 120, y: -70, width: 700, height: 150, rx: 70, fill: '#5b6573' }, hand)
  svg('ellipse', { cx: 40, cy: 0, rx: 130, ry: 100, fill: '#e0a982' }, hand)
  for (let k = 0; k < 4; k++) svg('rect', { x: -110, y: -76 + k * 42, width: 120, height: 36, rx: 18, fill: '#e0a982' }, hand)
  svg('rect', { x: -40, y: -120, width: 110, height: 40, rx: 20, fill: '#e0a982', transform: 'rotate(-30)' }, hand)
  // Traînées de vitesse.
  const streaks = svg('g', {}, L.fx)
  for (let k = 0; k < 9; k++) svg('rect', { x: -900 - k * 40, y: 520 + k * 70, width: 600 + (k % 3) * 200, height: 10, rx: 5, fill: '#fff', opacity: 0.55 }, streaks)
  return { note, pen, hand, streaks, gy }
})

// 2 · La carte de nuit : l'itinéraire GPS jusqu'à la maison.
const SOIR = scene('soir', (L) => {
  bg(L, '#0b1222')
  const map = svg('g', {}, L.far)
  const r = rng(11)
  // Pâtés de maisons (une grille irrégulière), une rivière, des parcs.
  for (let gx = -6; gx < 14; gx++)
    for (let gy = -6; gy < 22; gy++) {
      const x = gx * 150 + (gy % 2) * 30
      const y = gy * 150
      svg('rect', { x: x + 14, y: y + 14, width: 122, height: 122, rx: 14, fill: r() < 0.12 ? '#13301f' : '#18213b' }, map)
      if (r() < 0.35) svg('rect', { x: x + 34, y: y + 34, width: 40 + r() * 40, height: 40 + r() * 40, rx: 6, fill: '#202b4d' }, map)
    }
  svg('path', { d: 'M -800 1500 C -200 1300 200 1700 700 1450 S 1500 1100 2000 1300', fill: 'none', stroke: '#0f2a4a', 'stroke-width': 90 }, map)
  // L'itinéraire.
  const routeD = 'M 160 1620 L 160 1320 L 470 1320 L 470 1020 L 780 1020 L 780 720 L 620 720 L 620 450 L 900 450'
  svg('path', { d: routeD, fill: 'none', stroke: '#ffd166', 'stroke-width': 40, opacity: 0.15, 'stroke-linejoin': 'round' }, L.mid)
  const route = svg('path', { d: routeD, fill: 'none', stroke: '#ffd166', 'stroke-width': 16, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, L.mid)
  const len = route.getTotalLength()
  route.setAttribute('stroke-dasharray', `${len}`)
  // Le point d'arrivée : l'épingle, avec une maison.
  const pin = svg('g', { transform: 'translate(900 450)' }, L.mid)
  const rings = [0, 1, 2].map(() => svg('circle', { r: 0, fill: 'none', stroke: '#ff4d5e', 'stroke-width': 10, opacity: 0 }, pin))
  const pinBody = svg('g', {}, pin)
  const pinFill = svg('path', { d: 'M 0 0 C -30 -60 -90 -100 -90 -170 A 90 90 0 1 1 90 -170 C 90 -100 30 -60 0 0 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10 }, pinBody)
  svg('path', { d: 'M -40 -150 L 0 -200 L 40 -150 L 40 -110 L -40 -110 Z', fill: '#10121a' }, pinBody)
  // La voiture qui suit l'itinéraire (vue de dessus).
  const car = svg('g', {}, L.mid)
  svg('rect', { x: -40, y: -70, width: 80, height: 140, rx: 26, fill: '#7fd1ff', stroke: '#10121a', 'stroke-width': 8 }, car)
  svg('rect', { x: -28, y: -40, width: 56, height: 36, rx: 8, fill: '#10121a' }, car)
  for (const sx of [-1, 1]) svg('path', { d: `M ${sx * 20} -70 L ${sx * 140} -360 L ${sx * -140 + sx * 200} -360 Z`, fill: 'url(#lampCone)', opacity: 0 }, car)
  const beams = svg('path', { d: 'M -30 -70 L -180 -420 L 180 -420 L 30 -70 Z', fill: 'url(#lampCone)', opacity: 0.5 }, car)
  car.insertBefore(beams, car.firstChild)
  // Fissures qui partent de l'épingle.
  const cracks = svg('g', { transform: 'translate(900 340)' }, L.fx)
  const rc = rng(4)
  for (let k = 0; k < 9; k++) {
    let x = 0
    let y = 0
    let d = 'M 0 0'
    const a0 = (k / 9) * Math.PI * 2 + rc()
    for (let s = 0; s < 5; s++) {
      const a = a0 + (rc() - 0.5) * 0.8
      x += Math.cos(a) * (60 + rc() * 90)
      y += Math.sin(a) * (60 + rc() * 90)
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`
    }
    svg('path', { d, fill: 'none', stroke: '#ffffff', 'stroke-width': 7, 'stroke-linejoin': 'round', 'stroke-dasharray': 900, 'stroke-dashoffset': 900 }, cracks)
  }
  const strobe = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#ff2a3d', opacity: 0 }, L.fx)
  const gy = gyro(L.fx, { r: 1100, y: 900 })
  return { route, len, pin, pinFill, rings, car, cracks, strobe, gy }
})

// 3 · Le box : le projecteur s'allume sur Sarah.
const BOX = scene('box', (L) => {
  bg(L, 'url(#court)')
  const spot = svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, L.far)
  const dark = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#000' }, L.front)
  for (let i = 0; i < 7; i++) svg('rect', { x: 50 + i * 165, y: 500, width: 12, height: 1500, fill: '#9fe0ff', opacity: 0.14 }, L.front)
  svg('rect', { x: -100, y: 1620, width: W + 200, height: 400, fill: '#1a2147' }, L.front)
  svg('rect', { x: -100, y: 1610, width: W + 200, height: 20, fill: '#3b4a86' }, L.front)
  const actor = makePerson(L.actor, SARAH)
  // Le post-it sous scellé.
  const bag = svg('g', {}, L.fx)
  const inner = svg('g', { transform: 'scale(0.42) rotate(-6)' }, bag)
  postit(inner, { write: false })
  svg('rect', { x: -170, y: -190, width: 340, height: 400, rx: 18, fill: '#dff3ff', opacity: 0.28, stroke: '#ffffff', 'stroke-width': 6 }, bag)
  svg('rect', { x: -170, y: -190, width: 340, height: 30, rx: 10, fill: '#e5484d' }, bag)
  svg('rect', { x: -110, y: 150, width: 220, height: 52, rx: 10, fill: '#ffffff' }, bag)
  txt(bag, 'PIÈCE N°1', { x: 0, y: 188, 'text-anchor': 'middle', 'font-size': 34, fill: '#10121a' })
  return { actor, spot, dark, bag }
})

// 4 · L'immeuble, les mois impayés.
const APPART = scene('appart', (L) => {
  bg(L, 'url(#dusk)')
  svg('circle', { cx: 820, cy: 1000, r: 160, fill: '#ffe2a8', opacity: 0.8 }, L.far)
  for (let i = 0; i < 6; i++) svg('rect', { x: -200 + i * 230, y: 1100 - (i % 3) * 120, width: 200, height: 1200, fill: '#6a5a8a', opacity: 0.5 }, L.far)
  const bld = svg('g', { transform: 'translate(180 280)' }, L.mid)
  svg('rect', { width: 720, height: 1500, fill: '#e9d9c0' }, bld)
  svg('rect', { x: 400, width: 320, height: 1500, fill: '#d2bfa2' }, bld)
  svg('rect', { x: -20, y: -30, width: 760, height: 40, fill: '#b49b7a' }, bld)
  const wins = []
  for (let r2 = 0; r2 < 6; r2++)
    for (let c = 0; c < 3; c++) {
      const w = svg('rect', { x: 70 + c * 220, y: 70 + r2 * 230, width: 150, height: 160, rx: 8, fill: '#41507e' }, bld)
      svg('rect', { x: 70 + c * 220, y: 220 + r2 * 230, width: 150, height: 14, fill: '#b49b7a' }, bld)
      wins.push(w)
    }
  const target = wins[7]
  const ring = svg('rect', { x: 270, y: 280, width: 210, height: 220, rx: 18, fill: 'none', stroke: '#ffd166', 'stroke-width': 12, opacity: 0 }, bld)
  // Calendrier qui défile.
  const cal = svg('g', {}, L.fx)
  svg('rect', { x: -170, y: -150, width: 340, height: 320, rx: 26, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10 }, cal)
  svg('path', { d: 'M -170 -124 Q -170 -150 -144 -150 L 144 -150 Q 170 -150 170 -124 L 170 -60 L -170 -60 Z', fill: '#e5484d', stroke: '#10121a', 'stroke-width': 10 }, cal)
  for (const x of [-90, 90]) svg('rect', { x: x - 12, y: -186, width: 24, height: 70, rx: 12, fill: '#10121a' }, cal)
  const month = txt(cal, 'JANV.', { x: 0, y: -84, 'text-anchor': 'middle', 'font-size': 52, fill: '#fff' })
  const unpaid = svg('g', { transform: 'translate(0 70) rotate(-12)' }, cal)
  svg('rect', { x: -140, y: -48, width: 280, height: 96, rx: 14, fill: 'none', stroke: '#e5484d', 'stroke-width': 10 }, unpaid)
  txt(unpaid, 'IMPAYÉ', { x: 0, y: 20, 'text-anchor': 'middle', 'font-size': 56, fill: '#e5484d' })
  const actor = makePerson(L.actor, AMI)
  return { actor, cal, month, unpaid, ring, target }
})

// 5 · La voiture, la nuit.
const VOITURE = scene('voiture', (L) => {
  bg(L, 'url(#night)')
  const r = rng(21)
  for (let i = 0; i < 60; i++) svg('circle', { cx: r() * W, cy: r() * 900, r: 2 + r() * 3, fill: '#fff', opacity: 0.3 + r() * 0.6 }, L.far)
  svg('circle', { cx: 830, cy: 260, r: 90, fill: '#f4efd8' }, L.far)
  svg('circle', { cx: 870, cy: 240, r: 80, fill: '#0f1638' }, L.far)
  for (let i = 0; i < 6; i++) svg('rect', { x: -100 + i * 220, y: 700 - (i % 2) * 140, width: 190, height: 900, fill: '#131a3e' }, L.far)
  // Lampadaire.
  const lamp = svg('g', { transform: 'translate(160 520)' }, L.mid)
  svg('path', { d: 'M -20 -40 L 420 1300 L -420 1300 Z', fill: 'url(#lampCone)', opacity: 0.6 }, lamp)
  svg('rect', { x: -8, y: -60, width: 16, height: 1400, fill: '#2a3158' }, lamp)
  svg('rect', { x: -50, y: -70, width: 100, height: 30, rx: 12, fill: '#ffe7a8' }, lamp)
  svg('rect', { x: -200, y: 1280, width: W + 400, height: 700, fill: '#151a33' }, L.mid)
  svg('rect', { x: -200, y: 1280, width: W + 400, height: 16, fill: '#2a3158' }, L.mid)
  // La voiture (vue de côté) ; l'ami dort derrière la vitre.
  const car = svg('g', { transform: 'translate(540 1150)' }, L.actor)
  const clip = svg('clipPath', { id: 'carWin' }, defs)
  svg('path', { d: 'M -240 -40 L -150 -230 L 170 -230 L 270 -40 Z', transform: 'translate(540 1150)' }, clip)
  svg('path', { d: 'M -470 120 L -470 -20 Q -460 -60 -380 -60 L -270 -60 L -170 -260 Q -160 -280 -130 -280 L 190 -280 Q 220 -280 240 -260 L 350 -60 L 430 -60 Q 490 -50 490 20 L 490 120 Z', fill: '#5a6b8a', stroke: '#10121a', 'stroke-width': 12, 'stroke-linejoin': 'round' }, car)
  svg('path', { d: 'M -240 -40 L -150 -230 L 170 -230 L 270 -40 Z', fill: '#1c2547' }, car)
  const sleeper = svg('g', { 'clip-path': 'url(#carWin)' }, L.actor)
  const ami = makePerson(sleeper, AMI)
  const car2 = svg('g', { transform: 'translate(540 1150)' }, L.actor)
  svg('path', { d: 'M -240 -40 L -150 -230 L 170 -230 L 270 -40 Z', fill: '#9fc6ff', opacity: 0.12 }, car2)
  svg('path', { d: 'M -130 -220 L -200 -60', stroke: '#ffffff', 'stroke-width': 14, opacity: 0.25, 'stroke-linecap': 'round' }, car2)
  svg('rect', { x: 10, y: -240, width: 18, height: 220, fill: '#10121a' }, car2)
  for (const x of [-300, 300]) {
    svg('circle', { cx: x, cy: 120, r: 92, fill: '#10121a' }, car2)
    svg('circle', { cx: x, cy: 120, r: 40, fill: '#9aa3b5' }, car2)
  }
  svg('rect', { x: 440, y: -10, width: 50, height: 30, rx: 10, fill: '#ffe7a8' }, car2)
  const zs = [0, 1, 2].map((k) => txt(L.fx, 'Z', { 'font-size': 60 + k * 16, fill: '#ffffff', opacity: 0 }))
  // Les lettres de relance qui tombent.
  const letters = []
  for (let k = 0; k < 6; k++) {
    const g = svg('g', {}, L.fx)
    svg('rect', { x: -90, y: -60, width: 180, height: 120, rx: 10, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 7 }, g)
    svg('path', { d: 'M -90 -60 L 0 10 L 90 -60', fill: 'none', stroke: '#10121a', 'stroke-width': 7 }, g)
    svg('rect', { x: -60, y: 20, width: 120, height: 26, rx: 6, fill: '#e5484d' }, g)
    letters.push({ g, x: 120 + ((k * 197) % 840), r0: (k % 2 ? 1 : -1) * (8 + k * 3), d: k * 0.12 })
  }
  return { ami, zs, letters }
})

// 6 · L'appartement vide.
const PARTIE = scene('partie', (L) => {
  bg(L, 'url(#wallBeige)')
  for (let i = 0; i < 12; i++) svg('rect', { x: -200 + i * 120, y: -200, width: 6, height: 2400, fill: '#cdb995', opacity: 0.5 }, L.far)
  // Traces des cadres décrochés.
  for (const [x, y, w, h] of [[120, 380, 220, 280], [400, 320, 160, 200], [130, 760, 160, 160]]) svg('rect', { x, y, width: w, height: h, fill: '#f8efdc', stroke: '#e3d3b4', 'stroke-width': 4 }, L.far)
  svg('circle', { cx: 230, cy: 370, r: 7, fill: '#8a7650' }, L.far)
  // Porte ouverte, lumière du palier.
  svg('rect', { x: 640, y: 300, width: 360, height: 1150, fill: '#fff6d8' }, L.mid)
  svg('path', { d: 'M 640 300 L 760 340 L 760 1420 L 640 1450 Z', fill: '#8a5a3a' }, L.mid)
  svg('path', { d: 'M 640 1450 L 1000 1450 L 1300 1900 L 300 1900 Z', fill: 'url(#doorLight)', opacity: 0.6 }, L.mid)
  svg('rect', { x: -200, y: 1450, width: W + 400, height: 600, fill: '#b98d62' }, L.mid)
  for (let i = 0; i < 8; i++) svg('rect', { x: -200 + i * 190, y: 1450, width: 6, height: 600, fill: '#9a714b' }, L.mid)
  // Un carton oublié, les clés par terre.
  const box = svg('g', { transform: 'translate(300 1430)' }, L.actor)
  svg('rect', { x: -150, y: -200, width: 300, height: 200, fill: '#c9955a', stroke: '#10121a', 'stroke-width': 8 }, box)
  svg('path', { d: 'M -150 -200 L -190 -270 L 0 -270 L 0 -200 M 150 -200 L 190 -250 L 0 -250', fill: '#d9a86c', stroke: '#10121a', 'stroke-width': 8 }, box)
  svg('rect', { x: -60, y: -140, width: 120, height: 40, fill: '#fbf6ea' }, box)
  const keys = svg('g', { transform: 'translate(560 1560) rotate(15)' }, L.actor)
  svg('circle', { r: 30, fill: 'none', stroke: '#c9ced6', 'stroke-width': 9 }, keys)
  svg('path', { d: 'M 26 12 L 130 50 L 128 68 L 110 64', fill: 'none', stroke: '#e1bf63', 'stroke-width': 16, 'stroke-linejoin': 'round' }, keys)
  // Une épingle avec un point d'interrogation.
  const q = svg('g', {}, L.fx)
  svg('path', { d: 'M 0 0 C -30 -60 -90 -100 -90 -170 A 90 90 0 1 1 90 -170 C 90 -100 30 -60 0 0 Z', fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10 }, q)
  txt(q, '?', { x: 0, y: -135, 'text-anchor': 'middle', 'font-size': 110, fill: '#e5484d' })
  return { q }
})

// 7 · Le procès : chaque réplique a son plan et son accessoire.
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
  // Fond des répliques-chocs : trame de points rouge.
  const hotBg = svg('g', {}, L.far)
  svg('rect', { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -600, y: -600, width: W + 1200, height: H + 1200, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  desk(L.front)
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // L'école.
  const school = prop((g) => {
    svg('rect', { x: -230, y: -120, width: 460, height: 260, fill: '#f2e4c8', stroke: '#10121a', 'stroke-width': 10 }, g)
    svg('path', { d: 'M -270 -110 L 0 -270 L 270 -110 Z', fill: '#e5484d', stroke: '#10121a', 'stroke-width': 10, 'stroke-linejoin': 'round' }, g)
    svg('circle', { cx: 0, cy: -170, r: 40, fill: '#fff', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('path', { d: 'M 0 -170 L 0 -196 M 0 -170 L 18 -162', stroke: '#10121a', 'stroke-width': 7 }, g)
    svg('rect', { x: -50, y: 40, width: 100, height: 100, fill: '#7fd1ff', stroke: '#10121a', 'stroke-width': 8 }, g)
    for (const x of [-170, 110]) svg('rect', { x, y: -60, width: 70, height: 70, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -120, y: -100, width: 240, height: 0, fill: 'none' }, g)
    txt(g, 'ÉCOLE', { x: 0, y: 26, 'text-anchor': 'middle', 'font-size': 44, fill: '#10121a' })
  })
  // Le cahier de liaison.
  let addrMark
  const notebook = prop((g) => {
    svg('rect', { x: -250, y: -190, width: 500, height: 380, rx: 16, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10 }, g)
    svg('rect', { x: -250, y: -190, width: 500, height: 90, rx: 16, fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 10 }, g)
    for (let k = 0; k < 7; k++) svg('circle', { cx: -200 + k * 66, cy: -190, r: 14, fill: '#fff', stroke: '#10121a', 'stroke-width': 6 }, g)
    txt(g, 'CAHIER DE LIAISON', { x: 0, y: -130, 'text-anchor': 'middle', 'font-size': 38, fill: '#fff' })
    for (let k = 0; k < 4; k++) svg('rect', { x: -200, y: -60 + k * 56, width: 400 - (k % 2) * 80, height: 10, rx: 5, fill: '#d8d0bd' }, g)
    addrMark = svg('rect', { x: -214, y: 0, width: 0, height: 52, rx: 8, fill: '#ffd166', opacity: 0.8 }, g)
    const a = svg('text', { x: -200, y: 38, 'font-family': 'Fraunces Variable', 'font-style': 'italic', 'font-weight': 600, 'font-size': 46, fill: '#1c2a6b' }, g)
    a.textContent = '12, rue des Lilas'
  })
  // La tirelire cassée.
  const pig = prop((g) => {
    const L1 = svg('g', {}, g)
    const R1 = svg('g', {}, g)
    for (const [half, clipX] of [[L1, -1], [R1, 1]]) {
      const id = `pig${clipX}`
      const c = svg('clipPath', { id }, defs)
      svg('path', { d: clipX < 0 ? 'M -400 -300 L 10 -300 L -20 -60 L 20 60 L -10 300 L -400 300 Z' : 'M 10 -300 L 400 -300 L 400 300 L -10 300 L 20 60 L -20 -60 Z' }, c)
      const inner = svg('g', { 'clip-path': `url(#${id})` }, half)
      svg('ellipse', { cx: 0, cy: 0, rx: 240, ry: 170, fill: '#ff8fb1', stroke: '#10121a', 'stroke-width': 10 }, inner)
      svg('circle', { cx: 230, cy: -10, r: 60, fill: '#ff8fb1', stroke: '#10121a', 'stroke-width': 10 }, inner)
      for (const x of [-140, -50, 60, 150]) svg('rect', { x: x - 26, y: 140, width: 52, height: 70, rx: 12, fill: '#ff8fb1', stroke: '#10121a', 'stroke-width': 8 }, inner)
      svg('rect', { x: -60, y: -176, width: 120, height: 22, rx: 11, fill: '#10121a' }, inner)
      svg('circle', { cx: 150, cy: -60, r: 14, fill: '#10121a' }, inner)
    }
    g.halves = [L1, R1]
    g.coins = [0, 1, 2, 3, 4].map((k) => {
      const c = svg('g', {}, g)
      svg('circle', { r: 34, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 7 }, c)
      txt(c, '€', { x: 0, y: 16, 'text-anchor': 'middle', 'font-size': 44, fill: '#10121a' })
      return c
    })
  })
  // La maison (une mère et son enfant).
  const house = prop((g) => {
    svg('rect', { x: -200, y: -100, width: 400, height: 300, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 10 }, g)
    svg('path', { d: 'M -250 -90 L 0 -290 L 250 -90 Z', fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 10, 'stroke-linejoin': 'round' }, g)
    svg('rect', { x: -150, y: -40, width: 300, height: 190, fill: '#ffd166' }, g)
    // Silhouettes.
    svg('circle', { cx: -40, cy: 10, r: 40, fill: '#10121a' }, g)
    svg('path', { d: 'M -110 150 Q -40 40 30 150 Z', fill: '#10121a' }, g)
    svg('circle', { cx: 60, cy: 60, r: 28, fill: '#10121a' }, g)
    svg('path', { d: 'M 14 150 Q 60 80 106 150 Z', fill: '#10121a' }, g)
  })
  // L'hôpital.
  const hosp = prop((g) => {
    svg('rect', { x: -130, y: -130, width: 260, height: 260, rx: 40, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10 }, g)
    svg('path', { d: 'M -30 -90 L 30 -90 L 30 -30 L 90 -30 L 90 30 L 30 30 L 30 90 L -30 90 L -30 30 L -90 30 L -90 -30 L -30 -30 Z', fill: '#e5484d' }, g)
  })
  const ecg = svg('polyline', { points: ecgPoints(560, 0.8), fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linejoin': 'round', 'stroke-dasharray': 4000, display: 'none' }, P)
  // La balance : l'amitié contre la confiance d'une mère.
  const scale = prop((g) => {
    svg('rect', { x: -10, y: -40, width: 20, height: 300, fill: '#e1bf63' }, g)
    svg('rect', { x: -110, y: 250, width: 220, height: 30, rx: 12, fill: '#e1bf63' }, g)
    const beamG = svg('g', {}, g)
    svg('rect', { x: -300, y: -50, width: 600, height: 20, rx: 10, fill: '#e1bf63' }, beamG)
    const panL = svg('g', {}, beamG)
    const panR = svg('g', {}, beamG)
    for (const [pan, x] of [[panL, -280], [panR, 280]]) {
      svg('path', { d: `M ${x} -40 L ${x - 70} 90 M ${x} -40 L ${x + 70} 90`, stroke: '#e1bf63', 'stroke-width': 6 }, pan)
      svg('path', { d: `M ${x - 100} 90 Q ${x} 150 ${x + 100} 90 Z`, fill: '#e1bf63' }, pan)
    }
    // Deux mains serrées (l'amitié) ; une petite maison (la confiance d'une mère).
    svg('path', { d: 'M -340 80 Q -330 30 -290 34 L -230 50 Q -210 60 -220 84 Z', fill: '#e0a982', stroke: '#10121a', 'stroke-width': 6 }, panL)
    svg('path', { d: 'M -330 84 Q -300 50 -260 60 L -230 80 Z', fill: '#f2c4a0', stroke: '#10121a', 'stroke-width': 6 }, panL)
    svg('rect', { x: 240, y: 40, width: 80, height: 52, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 6 }, panR)
    svg('path', { d: 'M 228 44 L 280 6 L 332 44 Z', fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 6, 'stroke-linejoin': 'round' }, panR)
    g.beamG = beamG
    g.panL = panL
    g.panR = panR
  })
  return { procBg, avoBg, hotBg, proc, avo, school, notebook, pig, house, hosp, ecg, scale, get addrMark() { return addrMark } }
})

// 8 · Le vote : Sarah seule dans le noir.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  for (let i = 0; i < 7; i++) svg('rect', { x: 50 + i * 165, y: 600, width: 12, height: 1500, fill: '#9fe0ff', opacity: 0.1 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  const actor = makePerson(L.actor, SARAH)
  return { actor }
})

// Transitions : grille de points (volet), disque, flash.
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
    const s = popS(t, T.t0, T.t1, T.dur)
    T.el.style.visibility = s > 0.01 ? '' : 'hidden'
    if (s <= 0.01) continue
    if (T.update) T.update(t)
    const a = clamp((t - T.t0) / T.dur)
    const k = lerp(T.from, 1, ease.out3(a)) * Math.min(1, s)
    T.el.style.opacity = Math.min(1, s * 1.5)
    T.el.style.transform = `translate(${T.x}px, ${T.y}px) translate(-50%, -50%) rotate(${T.rot}deg) scale(${k.toFixed(3)})`
  }
}
const fs = (T, px) => ((T.el.style.fontSize = `${px}px`), T)
function counter(t0, t1, to, unit, { y = 300, x = 540, dur = 0.7 } = {}) {
  const T = tag(`<span class="num">0</span><span class="unit">${unit}</span>`, 'counter', { t0, t1, y, x, from: 1.3 })
  T.update = (t) => (T.el.querySelector('.num').textContent = String(Math.round(to * ease.out3(clamp((t - t0) / dur)))))
  return T
}

// L'accroche.
tag('PIÈCE À CONVICTION N°1', 'pill red', { t0: -1, t1: Wd('01', 'ami') - 0.2, y: 1250, x: 600, rot: -4, dur: 0.01 })
tag('SARAH, 34 ANS · ENSEIGNANTE', 'pill small', { t0: Wd('01', 'sarah') - 0.1, t1: SEC.adresse.t1 - 0.3, y: 250, rot: -2 })
tag('21:47', 'pill red', { t0: Wd('02', 'soir') - 0.1, t1: SEC.soir.t1, y: 250, x: 300, rot: -3 })
tag('LE SOIR MÊME', 'pill', { t0: Wd('02', 'meme') - 0.1, t1: SEC.soir.t1, y: 250, x: 730, rot: 2 })
fs(tag('AGRESSÉE', 'stamp', { t0: Wd('02', 'agresse') - 0.05, t1: SEC.soir.t1, y: 900, rot: -10, from: 3, dur: 0.2 }), 170)
tag('AUJOURD’HUI', 'pill small', { t0: S('03') - 0.05, t1: SEC.box.t1, y: 250 })
fs(tag('ACCUSÉE', 'stamp', { t0: Wd('03', 'sexpliquer') - 0.1, t1: SEC.box.t1, y: 420, rot: -6, from: 2.6, dur: 0.22 }), 130)
// Les faits.
tag('SON APPARTEMENT', 'pill', { t0: Wd('04', 'appartement') - 0.15, t1: Wd('04', 'pendant') - 0.1, y: 210, rot: -2 })
counter(Wd('04', '11') - 0.1, SEC.appart.t1, 11, 'MOIS SANS LOYER', { y: 300, x: 330, dur: 1.2 })
tag('ÉTRANGLÉ PAR SON CRÉDIT', 'pill red', { t0: Wd('05', 'etrangle') - 0.1, t1: SEC.voiture.t1, y: 250, rot: -2 })
tag('IL DORT DANS SA VOITURE', 'pill', { t0: Wd('05', 'dormir') - 0.1, t1: SEC.voiture.t1, y: 380, rot: 2 })
fs(tag('PARTIE', 'stamp', { t0: Wd('06', 'partie') - 0.05, t1: SEC.partie.t1, y: 300, rot: -8, from: 2.8, dur: 0.2 }), 170)
tag('SANS REMBOURSER', 'pill red', { t0: Wd('06', 'rembourser') - 0.1, t1: SEC.partie.t1, y: 500, x: 360, rot: -3 })
tag('AUCUNE ADRESSE', 'pill', { t0: Wd('06', 'dadresse') - 0.15, t1: SEC.partie.t1, y: 640, x: 600, rot: 3 })
// Le procès.
tag('L’ENSEIGNANTE DU FILS', 'pill yellow', { t0: Wd('07', 'lenseignante') - 0.1, t1: E('07') + 0.1, y: 240, rot: -2 })
tag('POUR L’ÉCOLE', 'pill yellow', { t0: Wd('08', 'lecole') - 0.1, t1: E('08') + 0.1, y: 200, rot: -2 })
tag('À SON ANCIEN PROPRIÉTAIRE ?', 'pill', { t0: Wd('09', 'transmettre') - 0.1, t1: E('09') + 0.1, y: 240 })
fs(tag('PAS AUTORISÉE', 'stamp', { t0: Wd('09', 'autorisee') - 0.05, t1: E('09') + 0.1, y: 520, rot: -8, from: 2.8, dur: 0.2 }), 120)
counter(Wd('10', '15') - 0.1, E('10') + 0.15, 15, 'ANS D’AMITIÉ', { y: 400, dur: 0.6 })
tag('SES ÉCONOMIES', 'pill red', { t0: Wd('11', 'economies') - 0.1, t1: Wd('11', 'elle', 1) - 0.1, y: 240, rot: -2 })
tag('SA VOITURE', 'pill', { t0: Wd('11', 'voiture') - 0.1, t1: Wd('11', 'elle', 1) - 0.1, y: 360, rot: 2 })
fs(tag('L’AIDER', 'slam yellow', { t0: Wd('11', 'laider') - 0.08, t1: E('11') + 0.1, y: 420, rot: -3, from: 2.6, dur: 0.2 }), 160)
tag('LE MESSAGE', 'pill red', { t0: Wd('12', 'message') - 0.1, t1: E('13') + 0.15, y: 220, rot: -2 })
const chat = tag('<span class="from">LUI · 18:52</span><span class="msg"></span>', 'chat', { t0: S('13') - 0.15, t1: E('13') + 0.15, y: 480, from: 1.3 })
const MSG = C.line('13').words.slice(0, 10)
chat.update = (t) => {
  const n = MSG.filter((w) => t >= w.t - 0.04).length
  chat.el.querySelector('.msg').textContent = MSG.slice(0, Math.max(1, n)).map((w) => w.w.replace(/[«»]/g, '')).join(' ')
}
fs(tag('SA COLÈRE', 'slam white', { t0: Wd('13', 'colere') - 0.08, t1: E('13') + 0.15, y: 760, rot: -3, from: 2.4, dur: 0.2 }), 120)
fs(tag('JAMAIS VIOLENT', 'stamp green', { t0: Wd('14', 'jamais') - 0.05, t1: E('14') + 0.1, y: 300, rot: -6, from: 2.6, dur: 0.22 }), 100)
tag('15 ANS', 'pill', { t0: Wd('14', '15') - 0.1, t1: Wd('14', 'jamais') - 0.1, y: 300 })
tag('RÉCLAMER SON ARGENT', 'pill yellow', { t0: Wd('14', 'reclamer') - 0.1, t1: E('14') + 0.1, y: 500, rot: 2 })
tag('UN MESSAGE ?', 'pill yellow', { t0: Wd('15', 'transmettre') - 0.1, t1: E('15') + 0.1, y: 200, x: 290, rot: -3 })
tag('LEUR DOMICILE', 'pill red', { t0: Wd('15', 'domicile') - 0.1, t1: E('15') + 0.1, y: 200, x: 790, rot: 3 })
fs(tag('À L’HÔPITAL.', 'slam white', { t0: Wd('16', 'lhopital') - 0.08, t1: E('16') + 0.2, y: 300, rot: -3, from: 2.6, dur: 0.2 }), 130)
tag('IL A CHOISI', 'pill red', { t0: Wd('17', 'choisi') - 0.1, t1: Wd('17', 'sarah') - 0.1, y: 220, rot: -2 })
fs(tag('AIDER', 'slam yellow', { t0: Wd('17', 'aider') - 0.08, t1: E('17') + 0.1, y: 220, x: 540, rot: -4, from: 2.4, dur: 0.2 }), 120)
fs(tag('≠', 'slam white', { t0: Wd('17', 'pas') - 0.08, t1: E('17') + 0.1, y: 360, x: 540, from: 2.4, dur: 0.2 }), 140)
fs(tag('AGRESSER', 'slam white', { t0: Wd('17', 'preparer') - 0.08, t1: E('17') + 0.1, y: 500, x: 540, rot: 4, from: 2.4, dur: 0.2 }), 120)
fs(tag('PRÉVOIR ?', 'slam yellow', { t0: Wd('18', 'prevoir') - 0.08, t1: E('18') + 0.15, y: 330, rot: -3, from: 2.6, dur: 0.2 }), 170)
tag('JAMAIS AUPARAVANT', 'pill red', { t0: Wd('18', 'jamais') - 0.1, t1: E('18') + 0.15, y: 520, rot: 2 })
tag('SON AMITIÉ', 'pill yellow', { t0: Wd('19', 'amitie') - 0.1, t1: E('20') + 0.15, y: 230, x: 290, rot: -3 })
tag('LA CONFIANCE D’UNE MÈRE', 'pill', { t0: Wd('19', 'confiance') - 0.1, t1: E('20') + 0.15, y: 330, x: 640, rot: 2 }).el.style.fontSize = '44px'
fs(tag('ELLE AUSSI.', 'slam white', { t0: Wd('20', 'aussi') - 0.08, t1: E('20') + 0.15, y: 520, rot: -3, from: 2.4, dur: 0.2 }), 120)
// Le vote, puis l'abonnement.
const tJure = Wd('22', 'jure') - 0.15
fs(tag('UN DANGER ÉVIDENT ?', 'vote red', { t0: Wd('21', 'danger') - 0.15, t1: tJure - 0.2, y: 520, rot: -3 }), 70)
fs(tag('TRAHIE PAR SON AMI ?', 'vote blue', { t0: Wd('21', 'trahie') - 0.15, t1: tJure - 0.2, y: 720, rot: 3 }), 70)
fs(tag('TU ES LE JURÉ', 'big white', { t0: tJure, y: 330, from: 1.4, dur: 0.5 }), 110)
tag('COUPABLE', 'vote red', { t0: Wd('22', 'verdict') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('22', 'verdict') + 0.15, y: 730, rot: 3 })
tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: S('23') - 0.05, y: 1180 })
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('23', 'verdict') - 0.1, y: 1330 }), 44)

// Qui parle.
const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés : 3 mots au plus, le mot prononcé dans un bloc de couleur.
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
// Pas de sous-titres sur l'appel à s'abonner (le bouton le dit), ni sur le message lu (la bulle le montre).
for (const line of C.lines.filter((l) => l.id !== '23-abonne')) {
  const mine = []
  let cur = null
  line.words.forEach((w, i) => {
    if (line.id === '13-regler' && i < 10) return
    if (!cur || cur.words.length >= 3 || /[,.:;?!…»]$/.test(line.words[i - 1]?.w ?? '')) mine.push((cur = { words: [], who: line.who }))
    cur.words.push({ ...w, w: w.w.replace(/[«»]/g, '') })
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

const T_AGR = Wd('02', 'agresse')
const IMPACTS = [
  [Wd('01', 'ami') + 0.05, 10],
  [T_AGR, 26],
  [Wd('03', 'sarah') - 0.05, 12],
  [Wd('06', 'partie'), 14],
  [Wd('09', 'autorisee'), 10],
  [Wd('16', 'lhopital'), 18],
  [Wd('18', 'prevoir'), 10],
  [Wd('20', 'aussi'), 10],
]
function shakeAt(t) {
  let x = 0
  let y = 0
  for (const [t0, a] of IMPACTS) {
    if (t < t0 || t > t0 + 0.7) continue
    const k = a * Math.exp(-(t - t0) * 7)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 53 + 1)
  }
  return [x + 2 * Math.sin(t * 1.3), y + 2 * Math.sin(t * 1.1 + 1)]
}
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02, rot = 0 } = {}) {
  const [sx, sy] = shakeAt(t)
  const z = zoom * (1 + push * (t - s.t0))
  const par = (k) => `translate(${540 + sx * k} ${960 + sy * k}) rotate(${rot * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}

const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.2) ?? TLINES[0]
const HOT = ['16', '18']

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === ADRESSE) {
    // Très gros plan sur le post-it, puis on recule ; coup de fouet vers la droite quand on l'arrache.
    const pull = prog(t, 0, 1.6, ease.io3)
    const grab = Wd('01', 'ami') - 0.1
    const whip = prog(t, grab + 0.1, 0.35, ease.in3)
    cam(ADRESSE, t, { zoom: lerp(1.55, 1.05, pull), cx: lerp(470, 540, pull) + whip * 250, cy: lerp(760, 880, pull), push: 0, rot: lerp(-4, 0, pull) })
    ADRESSE.gy(t, 0.18 + 0.1 * Math.sin(t * 3))
    // L'écriture : trois lignes, puis le cercle rouge.
    // Dès la première image, la première ligne est déjà écrite.
    const spans = [[-1, 0.45], [0.0, 0.55], [0.6, 0.5]]
    let px = -260
    let py = -200
    ADRESSE.note.rows.forEach((r, i) => {
      const p = prog(t, spans[i][0], spans[i][1], ease.io2)
      r.setAttribute('width', 560 * p)
      if (p > 0 && p < 1) {
        px = -260 + 560 * p
        py = [-130, -10, 130][i]
      }
    })
    const ringP = prog(t, Wd('01', 'adresse') - 0.15, 0.45, ease.out3)
    ADRESSE.note.ring.setAttribute('stroke-dashoffset', 1900 * (1 - ringP))
    const writing = t < 1.1
    const penOut = prog(t, 1.1, 0.3, ease.in3)
    if (!writing) {
      px = lerp(-260 + 560, 600, penOut)
      py = lerp(130, -500, penOut)
    }
    const jiggle = writing ? 10 * Math.sin(t * 60) : 0
    // Le post-it est au centre (540, 860), tourné de −4°.
    const rad = (-4 * Math.PI) / 180
    const gx = 540 + px * Math.cos(rad) - py * Math.sin(rad)
    const gy = 860 + px * Math.sin(rad) + py * Math.cos(rad)
    place(ADRESSE.pen, gx, gy + jiggle, 1, 28)
    // La main arrive, saisit, arrache.
    const handIn = prog(t, grab - 0.35, 0.3, ease.out3)
    const yank = prog(t, grab, 0.35, ease.in3)
    place(ADRESSE.hand, lerp(1700, 860, handIn) + yank * 1300, 860 - yank * 60, 1, -8)
    ADRESSE.note.g.setAttribute('transform', `translate(${540 + yank * 1300} ${860 - yank * 60}) rotate(${-4 + yank * 25})`)
    ADRESSE.streaks.setAttribute('transform', `translate(${yank * 2400} 0)`)
    ADRESSE.streaks.setAttribute('opacity', yank > 0 && yank < 1 ? 1 : 0)
  }
  if (cur === SOIR) {
    const t0 = SOIR.t0
    const drive = prog(t, t0 + 0.1, T_AGR - 0.25 - t0, ease.io2)
    const L = SOIR.len * drive
    SOIR.route.setAttribute('stroke-dashoffset', SOIR.len - L)
    const pt = SOIR.route.getPointAtLength(L)
    const pt2 = SOIR.route.getPointAtLength(Math.min(SOIR.len, L + 4))
    const ang = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI + 90
    place(SOIR.car, pt.x, pt.y, 1, ang)
    const hit = prog(t, T_AGR - 0.05, 0.25, ease.out3)
    cam(SOIR, t, { zoom: lerp(1.5, 1.25, drive) + 0.35 * hit, cx: lerp(pt.x, 900, hit), cy: lerp(pt.y, 520, hit) - 120 * (1 - hit), push: 0 })
    const red = t >= T_AGR - 0.05
    SOIR.pinFill.setAttribute('fill', red ? '#ff4d5e' : '#ffd166')
    SOIR.pin.setAttribute('transform', `translate(900 450) scale(${1 + 0.35 * Math.exp(-Math.max(0, t - T_AGR) * 8) * (red ? 1 : 0)})`)
    SOIR.rings.forEach((rg, k) => {
      const u = (t - T_AGR - k * 0.18) / 0.8
      const on = u > 0 && u < 1
      rg.setAttribute('r', on ? 40 + 380 * ease.out3(u) : 0)
      rg.setAttribute('opacity', on ? 1 - u : 0)
    })
    ;[...SOIR.cracks.children].forEach((c, k) => c.setAttribute('stroke-dashoffset', 900 * (1 - prog(t, T_AGR + k * 0.01, 0.25, ease.out3))))
    SOIR.strobe.setAttribute('opacity', red ? (0.25 * Math.exp(-(t - T_AGR) * 6)).toFixed(3) : 0)
    SOIR.gy(t, red ? 0.75 : 0)
  }
  if (cur === BOX) {
    const on = Wd('03', 'sarah') - 0.05
    const lit = t >= on
    cam(BOX, t, { zoom: lit ? 1.12 : 1.0, cy: 960, push: 0.05 })
    BOX.dark.setAttribute('opacity', lit ? 0 : 0.78)
    BOX.actor.update(t, { x: 540, y: 1220, scale: 1.4, brows: 'sad', look: lit ? [0, -0.15] : [-0.5, 0.4], headNod: lit ? 0.05 : 0.2, armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 1.1 })
    const bs = popS(t, S('03') + 0.2, Infinity, 0.45)
    place(BOX.bag, 840, 640 + 10 * Math.sin(t * 2), bs * 1.05, 8 + 3 * Math.sin(t * 1.4))
  }
  if (cur === APPART) {
    cam(APPART, t, { zoom: 1.0, cy: 960, push: 0.03 })
    const months = ['JANV.', 'FÉVR.', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUIL.', 'AOÛT', 'SEPT.', 'OCT.', 'NOV.']
    const m0 = Wd('04', 'pendant') - 0.1
    const m1 = Wd('04', 'loyer')
    const k = clamp(Math.floor(((t - m0) / (m1 - m0)) * 11), 0, 10)
    const calS = popS(t, m0 - 0.2, Infinity, 0.35)
    APPART.month.textContent = months[k]
    const flip = ((t - m0) / (m1 - m0)) * 11
    const fp = flip > 0 && flip < 11 ? flip % 1 : 1
    place(APPART.cal, 780, 620, calS * 0.95, -4)
    APPART.unpaid.setAttribute('transform', `translate(0 70) rotate(-12) scale(${lerp(1.8, 1, ease.out3(clamp(fp / 0.3)))})`)
    APPART.unpaid.setAttribute('opacity', t >= m0 ? 1 : 0)
    APPART.ring.setAttribute('opacity', prog(t, Wd('04', 'appartement') - 0.1, 0.2))
    APPART.actor.update(t, { x: 330, y: 1300, scale: 1.15, brows: t > m0 ? 'sad' : 'neutral', look: [0.5, -0.4], armR: [0.2, 0.6], armL: [0.2, 0.6], seed: 0.4, headTilt: -0.05 })
  }
  if (cur === VOITURE) {
    cam(VOITURE, t, { zoom: 1.05, cy: 1000, push: 0.04 })
    VOITURE.ami.update(t, { x: 560, y: 1150, scale: 0.62, brows: 'sad', blink: 1, look: [0, 0], headTilt: 0.35, headNod: 0.4, armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 2, breathe: 2 })
    VOITURE.zs.forEach((z, k) => {
      const u = ((t - VOITURE.t0 + k * 0.6) % 1.8) / 1.8
      z.setAttribute('x', 640 + u * 140 + k * 10)
      z.setAttribute('y', 860 - u * 260)
      z.setAttribute('opacity', (Math.sin(u * Math.PI) * 0.9).toFixed(2))
    })
    const t0 = Wd('05', 'credit') - 0.2
    for (const L of VOITURE.letters) {
      const u = t - t0 - L.d
      const on = u > 0 && t < Wd('05', 'dormir') + 0.2
      L.g.setAttribute('display', on ? 'inline' : 'none')
      if (on) place(L.g, L.x, -100 + 900 * ease.out2(clamp(u / 0.9)), 0.9, L.r0 + u * 30)
    }
  }
  if (cur === PARTIE) {
    cam(PARTIE, t, { zoom: lerp(1.0, 1.12, prog(t, PARTIE.t0, 4, ease.io2)), cy: 980, cx: 560, push: 0 })
    const qs = popS(t, Wd('06', 'dadresse') - 0.15, Infinity, 0.4)
    place(PARTIE.q, 820, 1000 + 16 * Math.sin(t * 3), qs * 1.1, 6 * Math.sin(t * 2))
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const isProc = l.who === 'procureur'
    const hot = HOT.includes(id)
    show(TRIB.procBg, isProc && !hot)
    show(TRIB.avoBg, !isProc && !hot)
    show(TRIB.hotBg, hot)
    show(TRIB.proc.root, isProc)
    show(TRIB.avo.root, !isProc)
    const last = l.words.findLast((w, i) => i > 0 && /[.!?]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : hot ? prog(t, l.start, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.16, punch), cy: lerp(980, 900, punch), push: 0.025 })
    const sp = speaking(l.who, t)
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540,
      y: 1160,
      scale: 1.4,
      mouth: m,
      brows: isProc ? (['13', '15', '16', '19'].includes(id) ? 'angry' : 'determined') : ['17', '18'].includes(id) ? 'angry' : 'determined',
      look: [0, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * beat : 0), 1.0 + (sp ? 0.3 * beat : 0)],
      armL: [0.25 + (sp ? 0.1 * beat : 0), 1.2 + (sp ? 0.25 * Math.sin(t * 4.1) : 0)],
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.04 * Math.sin(t * 1.2),
    })
    // Accessoires.
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    prop(TRIB.school, id === '07', Wd('07', 'lenseignante') - 0.2, E('07'), 540, 580, 0.8, -3)
    prop(TRIB.notebook, id === '08', S('08') - 0.1, E('08'), 540, 560, 0.8, 3)
    TRIB.addrMark.setAttribute('width', 440 * prog(t, Wd('08', 'adresse') - 0.1, 0.35, ease.out3))
    const ps = prop(TRIB.pig, id === '11' && t < Wd('11', 'elle', 1), Wd('11', 'economies') - 0.4, Wd('11', 'elle', 1) - 0.2, 540, 500, 0.6)
    if (ps > 0) {
      const brk = prog(t, Wd('11', 'economies'), 0.4, ease.out3)
      TRIB.pig.halves.forEach((h, i) => h.setAttribute('transform', `translate(${(i ? 1 : -1) * 60 * brk} ${20 * brk}) rotate(${(i ? 1 : -1) * 10 * brk})`))
      TRIB.pig.coins.forEach((c, k) => {
        const u = clamp((t - Wd('11', 'economies') - k * 0.05) / 0.8)
        c.setAttribute('transform', `translate(${(k - 2) * 70 + (k - 2) * 60 * u} ${300 * ease.in2(u) - 120 * Math.sin(u * Math.PI)}) scale(${u > 0 ? 1 : 0.001})`)
      })
    }
    prop(TRIB.house, id === '15', Wd('15', 'domicile') - 0.2, E('15'), 540, 600, 0.7)
    prop(TRIB.hosp, id === '16', Wd('16', 'lhopital') - 0.1, E('16') + 0.2, 540, 560, 0.9)
    show(TRIB.ecg, id === '16')
    TRIB.ecg.setAttribute('stroke-dashoffset', 4000 * (1 - prog(t, S('16'), 0.9, ease.io3)))
    const ss = prop(TRIB.scale, id === '19' || id === '20', Wd('19', 'amitie') - 0.2, E('20') + 0.1, 540, 560, 0.6)
    if (ss > 0) {
      const tilt = lerp(0, -14, prog(t, Wd('19', 'oublier') - 0.1, 0.5, ease.back(1.6))) + 14 * prog(t, Wd('20', 'croire') - 0.1, 0.6, ease.back(1.4)) - 6 * prog(t, Wd('20', 'aussi') - 0.1, 0.5, ease.back(1.6))
      TRIB.scale.beamG.setAttribute('transform', `rotate(${tilt})`)
      TRIB.scale.panL.setAttribute('transform', `rotate(${-tilt} -280 -40)`)
      TRIB.scale.panR.setAttribute('transform', `rotate(${-tilt} 280 -40)`)
    }
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.85 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0] of IMPACTS) if (t >= t0 && t < t0 + 0.12) f = Math.max(f, 0.35 * (1 - (t - t0) / 0.12))
  flash.setAttribute('opacity', f.toFixed(3))
  const wipes = C.sections.filter((x) => x.cut === 'wipe')
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of wipes) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  // Coupe entre deux répliques du procès : petit disque jaune.
  let ir = 0
  for (const l of TLINES.slice(1)) {
    const k = t - (l.start - 0.2)
    if (k > -0.14 && k < 0.16) ir = k < 0 ? lerp(0, 1400, ease.in3(clamp((k + 0.14) / 0.14))) : lerp(1400, 0, ease.out3(clamp(k / 0.16)))
  }
  iris.setAttribute('r', ir)

  // Texte.
  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCAT DE LA DÉFENSE') : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t)
}

// Grain de pellicule léger.
const grainC = document.createElement('canvas')
grainC.width = 270
grainC.height = 480
grainC.className = 'grain'
stage.append(grainC)
const gctx = grainC.getContext('2d')
const gimg = gctx.createImageData(270, 480)
function updateGrain(t) {
  const r = rng(Math.floor(t * FPS) + 3)
  for (let i = 0; i < gimg.data.length; i += 4) {
    const v = r() * 255
    gimg.data[i] = gimg.data[i + 1] = gimg.data[i + 2] = v
    gimg.data[i + 3] = 14
  }
  gctx.putImageData(gimg, 0, 0)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  await document.fonts.load('italic 600 80px "Fraunces Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
