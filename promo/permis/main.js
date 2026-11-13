/**
 * ============================================================================
 *  « Affaire Classée ? » — Le permis (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : la dashcam de Bernard, 87 ans,
 *  dans une rue de village. Un ballon rouge traverse le passage piéton, le
 *  moteur s'emballe (la vitesse grimpe en rouge), dans l'incrustation Bernard
 *  hurle « Je freine ! »… crissement de pneus, écran noir, et le ballon roule
 *  seul. Le narrateur explique pendant le replay : les pédales confondues, la
 *  famille qui le suppliait, trois accidents, le permis gardé. Léa réapprend à
 *  marcher ; le marteau brise le permis.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT as H, WIDTH as W, makeCues } from './cues.js'
import { makePerson } from './personnage.js'

const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W: Wd } = C
const K = C.hook
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
const win = (t, a, b, fade = 0.16) => ease.io2(clamp((t - a) / fade)) * (1 - ease.io2(clamp((t - b) / fade)))

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('glowRed', [[0, '#ff2a3d', 0.85], [1, '#ff2a3d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glowBlue', [[0, '#3d7bff', 0.9], [1, '#3d7bff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('court', [[0, '#27305a'], [1, '#121733']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtRed', [[0, '#5a1f1a'], [1, '#1e0b08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtDark', [[0, '#141a33'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spot', [[0, '#bcd2ff', 0.38], [1, '#bcd2ff', 0]], { cx: 0.5, cy: 0.35, r: 0.55 })
grad('beam', [[0, '#ffe7b0', 0.45], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.6]], { cx: 0.5, cy: 0.45, r: 0.75 })
grad('pauseBg', [[0, '#0a2a14'], [1, '#10121a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitL', [[0, '#3a3220'], [1, '#0e0c06']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#3a2a10'], [1, '#100a04']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('skyAm', [[0, '#6f8aa6'], [0.55, '#d9a888'], [1, '#f4cfa2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('asph', [[0, '#6a6c72'], [1, '#2a2c31']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('dash', [[0, '#24262c'], [1, '#0d0e11']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sunG', [[0, '#fff3cf', 0.95], [0.4, '#ffd59a', 0.5], [1, '#ffb070', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('glare', [[0, '#ffffff', 0], [0.5, '#ffffff', 0.09], [1, '#ffffff', 0]], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('ambuWall', [[0, '#e9eef4'], [1, '#b9c4d2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('mugBg', [[0, '#2c3140'], [1, '#12141c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('ecgBg', [[0, '#04120a', 0.82], [1, '#000000', 0.92]], { x1: 0, y1: 0, x2: 0, y2: 1 })
{
  const p = svg('pattern', { id: 'dots', width: 22, height: 22, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
  svg('circle', { cx: 11, cy: 11, r: 4, fill: '#ffffff' }, p)
  const g = svg('pattern', { id: 'grid', width: 60, height: 60, patternUnits: 'userSpaceOnUse' }, defs)
  svg('path', { d: 'M 60 0 L 0 0 0 60', fill: 'none', stroke: '#1fbf5a', 'stroke-width': 2, opacity: 0.25 }, g)
  const f = svg('filter', { id: 'desat', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs)
  svg('feColorMatrix', { type: 'saturate', values: '0.12' }, f)
}

const scenes = []
function scene(id, build) {
  const sec = SEC[id]
  const g = svg('g', {}, root)
  const L = { far: svg('g', {}, g), mid: svg('g', {}, g), actor: svg('g', {}, g), front: svg('g', {}, g), fx: svg('g', {}, g), hud: svg('g', {}, g) }
  const s = { ...sec, g, L, ...build(L, sec) }
  scenes.push(s)
  return s
}
const bg = (L, fill) => svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill }, L.far)
const panel = (g, w = 820, h = 380, stroke = '#ffd166') => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke, 'stroke-width': 8 }, g)
const heartD = 'M 0 30 C -36 6 -60 -14 -48 -38 C -38 -58 -12 -56 0 -36 C 12 -56 38 -58 48 -38 C 60 -14 36 6 0 30 Z'

// Des fissures qui partent d'un point.
function cracks(parent, cx, cy, scale, seed, color = '#2a2a2a') {
  const g = svg('g', { transform: `translate(${cx} ${cy}) scale(${scale})` }, parent)
  const rc = rng(seed)
  for (let k = 0; k < 13; k++) {
    let x = 0
    let y = 0
    let d = 'M 0 0'
    const a0 = (k / 13) * Math.PI * 2 + rc() * 0.4
    for (let s = 0; s < 6; s++) {
      const a = a0 + (rc() - 0.5) * 0.7
      x += Math.cos(a) * (40 + rc() * 90)
      y += Math.sin(a) * (40 + rc() * 90)
      d += ` L ${x.toFixed(0)} ${y.toFixed(0)}`
    }
    svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 4 / scale + 3, 'stroke-linejoin': 'round', 'stroke-dasharray': 900, 'stroke-dashoffset': 900 }, g)
  }
  return g
}
grad('skyDay', [[0, '#8fb8d8'], [1, '#e6eef2']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('roadG', [[0, '#7a7c82'], [1, '#3a3c42']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('hood', [[0, '#4a5a7a'], [1, '#1a2230']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lens', [[0.6, '#000', 0], [1, '#000', 0.75]], { cx: 0.5, cy: 0.5, r: 0.72 })
grad('ballG', [[0, '#ff6a6a'], [0.6, '#e5282d'], [1, '#8f1014']], { cx: 0.35, cy: 0.35, r: 0.7 })
grad('ballLight', [[0, '#ffffff', 0.18], [1, '#ffffff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('carIn', [[0, '#2a2f3a'], [1, '#0d0f14']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('footwell', [[0, '#1a1c22'], [1, '#07080b']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('famBg', [[0, '#14304a'], [1, '#060c14']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('hospWall', [[0, '#e8f3ef'], [1, '#bcd6cc']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('permisG', [[0, '#f9d8e4'], [1, '#e9b0c6']], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('judgeBg', [[0, '#1a1e30'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })

// Les personnages. Les avocats en costume ; Bernard, 87 ans (béret, lunettes) ; Léa, 7 ans.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const BERNARD = { robe: '#7a6a4a', jabot: false, collar: '#e8eef6', hair: 'short', hairColor: '#e2ded6', skin: '#e9b48f', iris: '#3b5a7a' }
const LEA = { robe: '#ffd166', jabot: false, collar: '#ffffff', hair: 'bun', hairColor: '#6a3a1a', skin: '#f6d0b0', iris: '#3a5a2a', female: true }
function glasses(person) {
  const g = svg('g', {}, person.head)
  for (const x of [-56, 56]) svg('circle', { cx: x, cy: -140, r: 46, fill: '#ffffff', 'fill-opacity': 0.12, stroke: '#2a2a2a', 'stroke-width': 9 }, g)
  svg('path', { d: 'M -12 -146 Q 0 -156 12 -146 M -102 -150 L -142 -160 M 102 -150 L 142 -160', fill: 'none', stroke: '#2a2a2a', 'stroke-width': 8 }, g)
  return g
}
// Le béret de Bernard.
function beret(person) {
  const g = svg('g', {}, person.head)
  svg('path', { d: 'M -180 -238 C -190 -360 170 -380 186 -250 C 120 -226 -100 -222 -180 -238 Z', fill: '#2a2f45' }, g)
  svg('path', { d: 'M 0 -352 L 6 -380', stroke: '#2a2f45', 'stroke-width': 14, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -120 -310 C -60 -340 40 -346 100 -324', fill: 'none', stroke: '#ffffff', 'stroke-width': 8, opacity: 0.18 }, g)
  return g
}
const bernard = (parent) => {
  const p = makePerson(parent, BERNARD)
  glasses(p)
  beret(p)
  return p
}
// Une petite fille (silhouette en pied, robe jaune, couettes).
function girl(parent) {
  const g = svg('g', {}, parent)
  const legB = svg('path', { fill: 'none', stroke: '#f0c4a0', 'stroke-width': 9, 'stroke-linecap': 'round' }, g)
  const legF = svg('path', { fill: 'none', stroke: '#f0c4a0', 'stroke-width': 9, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -20 -62 L 20 -62 L 30 -26 L -30 -26 Z', fill: '#ffd166', stroke: '#b8892a', 'stroke-width': 2 }, g)
  const arms = svg('path', { fill: 'none', stroke: '#f0c4a0', 'stroke-width': 7, 'stroke-linecap': 'round' }, g)
  svg('circle', { cy: -78, r: 17, fill: '#f6d0b0' }, g)
  svg('path', { d: 'M -17 -80 C -18 -100 18 -100 17 -80 C 10 -90 -10 -90 -17 -80 Z', fill: '#6a3a1a' }, g)
  for (const sd of [-1, 1]) svg('circle', { cx: sd * 20, cy: -84, r: 7, fill: '#6a3a1a' }, g)
  return { g, legB, legF, arms }
}

// ------------------------------------------------- 1 · Le hook
const F = 2292 // focale de la dashcam (pixels pour 1 m à 1 m)
const CAMH = 1.2 // hauteur de la caméra
const HZ = 820 // horizon
const proj = (X, Y, z) => [540 + (X * F) / z, HZ + ((CAMH - Y) * F) / z]
const quad = (X0, X1, Y0, Y1, z0, z1, plane = 'x') => {
  // Un quadrilatère dans un plan vertical parallèle à la route (plane 'x', X0 = X1) ou au sol (plane 'y').
  const pts = plane === 'x' ? [[X0, Y0, z0], [X0, Y1, z0], [X0, Y1, z1], [X0, Y0, z1]] : [[X0, Y0, z0], [X1, Y0, z0], [X1, Y0, z1], [X0, Y0, z1]]
  return pts.map(([x, y, z]) => proj(x, y, Math.max(0.3, z)).map((v) => v.toFixed(1)).join(' ')).join(' L ')
}
const HOOK = scene('hook', (L) => {
  bg(L, '#000000')
  const R = L.actor
  // A · La dashcam de Bernard.
  const A = svg('g', {}, R)
  const Aw = svg('g', {}, A)
  svg('rect', { x: -400, y: -400, width: W + 800, height: HZ + 400, fill: 'url(#skyDay)' }, Aw)
  // Façades (deux plans infinis), trottoirs, route.
  const far = 120
  svg('path', { d: `M ${quad(-5.5, -5.5, 0, 7, 1.2, far)} Z`, fill: '#e2cfae' }, Aw)
  svg('path', { d: `M ${quad(5.5, 5.5, 0, 7, 1.2, far)} Z`, fill: '#d8bfa0' }, Aw)
  svg('path', { d: `M ${quad(-5.5, -3.6, 0, 0, 1.2, far, 'y')} Z`, fill: '#b9b4aa' }, Aw)
  svg('path', { d: `M ${quad(3.6, 5.5, 0, 0, 1.2, far, 'y')} Z`, fill: '#b9b4aa' }, Aw)
  svg('path', { d: `M ${quad(-3.6, 3.6, 0, 0, 1.2, far, 'y')} Z`, fill: 'url(#roadG)' }, Aw)
  svg('path', { d: `M ${quad(-5.6, 5.6, 7, 7, 60, 60.1, 'y')} Z`, fill: 'none' }, Aw)
  // Le fond de la rue : l'église du village.
  {
    const [x0, y0] = proj(-5.5, 9, far)
    const [x1, y1] = proj(5.5, 0, far)
    svg('rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: '#cdb48e' }, Aw)
    const [cx, cy] = proj(0, 14, far)
    svg('path', { d: `M ${cx - 14} ${y0} L ${cx - 14} ${cy + 20} L ${cx} ${cy} L ${cx + 14} ${cy + 20} L ${cx + 14} ${y0} Z`, fill: '#b89c74' }, Aw)
  }
  // Éléments qui défilent : fenêtres, portes, lampadaires, tirets, enseigne.
  const pool = (n, make) => Array.from({ length: n }, (_, k) => make(k))
  const wins = pool(28, (k) => ({ el: svg('path', { fill: k % 7 === 3 ? '#4a6a8a' : '#5a7a9a', stroke: '#6a4a2a', 'stroke-width': 2 }, Aw), side: k % 2 ? 1 : -1, z: Math.floor(k / 2) * 3.5, door: k % 6 === 4 }))
  const shutters = pool(28, (k) => ({ el: svg('path', { fill: ['#3a7a5a', '#4a6aa0', '#a04a3a'][k % 3], opacity: 0.9 }, Aw) }))
  const dashes = pool(14, (k) => ({ el: svg('path', { fill: '#f2f2f2' }, Aw), z: k * 6 }))
  const poles = pool(8, (k) => ({ el: svg('path', { stroke: '#4a4e58', 'stroke-width': 1, 'stroke-linecap': 'round' }, Aw), side: k % 2 ? 1 : -1, z: Math.floor(k / 2) * 18 + 9 }))
  // Le passage piéton, le panneau 30, l'enseigne de la boulangerie (positions fixes dans la rue).
  const zebra = pool(7, () => svg('path', { fill: '#f6f6f6' }, Aw))
  const sign30 = svg('g', {}, Aw)
  const signPole = svg('path', { stroke: '#8a8e98', 'stroke-linecap': 'round' }, sign30)
  const signDisc = svg('circle', { fill: '#ffffff', stroke: '#e5282d' }, sign30)
  const signTxt = txt(sign30, '30', { fill: '#10121a' })
  const bakery = svg('g', {}, Aw)
  const bakeryBoard = svg('path', { fill: '#7a2a1a', stroke: '#3a1008', 'stroke-width': 3 }, bakery)
  // La petite fille et le ballon rouge.
  const lea = girl(Aw)
  const ballShadow = svg('ellipse', { fill: '#000', opacity: 0.25 }, Aw)
  const ball = svg('g', {}, Aw)
  svg('circle', { r: 50, fill: 'url(#ballG)' }, ball)
  svg('path', { d: 'M -48 -10 Q 0 20 48 -10', fill: 'none', stroke: '#ffffff', 'stroke-width': 6, opacity: 0.6 }, ball)
  // Le capot.
  svg('path', { d: 'M -200 1760 C 200 1640 880 1640 1280 1760 L 1280 2200 L -200 2200 Z', fill: 'url(#hood)' }, A)
  svg('path', { d: 'M 120 1720 C 380 1666 700 1666 960 1720', fill: 'none', stroke: '#ffffff', 'stroke-width': 8, opacity: 0.25 }, A)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#lens)' }, A)
  // L'incrustation : la caméra intérieure, Bernard.
  const pip = svg('g', { transform: 'translate(640 210)' }, A)
  svg('rect', { x: -6, y: -6, width: 392, height: 312, rx: 18, fill: '#ffffff' }, pip)
  const pc = svg('clipPath', { id: 'pipClip' }, defs)
  svg('rect', { x: 0, y: 0, width: 380, height: 300, rx: 14 }, pc)
  const pin = svg('g', { 'clip-path': 'url(#pipClip)' }, pip)
  svg('rect', { width: 380, height: 300, fill: 'url(#carIn)' }, pin)
  svg('rect', { x: 230, y: 20, width: 160, height: 140, fill: '#8fb8d8', opacity: 0.6 }, pin)
  const bPip = bernard(pin)
  svg('rect', { x: 10, y: 10, width: 96, height: 38, rx: 8, fill: '#000', opacity: 0.6 }, pip)
  txt(pip, 'CAM 2', { x: 58, y: 38, 'font-size': 24, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  // L'interface de la dashcam.
  const hud = svg('g', {}, A)
  svg('circle', { cx: 74, cy: 110, r: 16, fill: '#ff3b3b' }, hud)
  const recT = txt(hud, 'REC · DASHCAM', { x: 104, y: 122, 'font-size': 34, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  recT.setAttribute('text-anchor', 'start')
  const clock = txt(hud, '', { x: 60, y: 1860, 'font-size': 34, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  clock.setAttribute('text-anchor', 'start')
  const speed = txt(hud, '', { x: 1000, y: 1830, 'font-size': 120, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700 })
  speed.setAttribute('text-anchor', 'end')
  txt(hud, 'km/h', { x: 1010, y: 1874, 'font-size': 34, fill: '#ffffff' }).setAttribute('text-anchor', 'end')
  // B · Le noir, et le ballon qui roule seul.
  const Bk = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#000' }, Bk)
  svg('ellipse', { cx: 560, cy: 1150, rx: 520, ry: 380, fill: 'url(#ballLight)' }, Bk)
  const bkShadow = svg('ellipse', { cx: 0, cy: 1200, rx: 70, ry: 14, fill: '#000', opacity: 0.6 }, Bk)
  const bkBall = svg('g', {}, Bk)
  svg('circle', { r: 64, fill: 'url(#ballG)' }, bkBall)
  svg('path', { d: 'M -62 -12 Q 0 26 62 -12', fill: 'none', stroke: '#ffffff', 'stroke-width': 8, opacity: 0.6 }, bkBall)
  const lost = txt(Bk, 'SIGNAL PERDU', { x: 540, y: 960, 'font-size': 54, fill: '#ffffff', 'font-family': 'monospace', 'font-weight': 700, opacity: 0 })

  // C · Le replay. C0 : Bernard au volant.
  const C0 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#carIn)' }, C0)
  svg('path', { d: 'M -100 300 L 1180 300 L 1180 1000 L -100 1000 Z', fill: '#8fb8d8', opacity: 0.55 }, C0)
  const streaksIn = svg('g', {}, C0)
  for (let k = 0; k < 8; k++) svg('rect', { x: 0, y: 420 + k * 70, width: 260, height: 10, fill: '#ffffff', opacity: 0.35 }, streaksIn)
  const bC0 = bernard(C0)
  const wheel0 = svg('g', {}, C0)
  svg('circle', { cx: 760, cy: 1560, r: 300, fill: 'none', stroke: '#0c0d10', 'stroke-width': 60 }, wheel0)
  // C1 : les pédales.
  const C1 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#footwell)' }, C1)
  const brake = svg('g', { transform: 'translate(360 980)' }, C1)
  svg('path', { d: 'M 0 -520 L 0 -60', stroke: '#2a2e38', 'stroke-width': 30 }, brake)
  svg('rect', { x: -130, y: -70, width: 260, height: 150, rx: 26, fill: '#3a3e48', stroke: '#5a5e68', 'stroke-width': 6 }, brake)
  for (let k = 0; k < 4; k++) svg('rect', { x: -110, y: -50 + k * 32, width: 220, height: 12, rx: 6, fill: '#2a2e38' }, brake)
  const gas = svg('g', { transform: 'translate(760 1000)' }, C1)
  svg('path', { d: 'M 0 -540 L 0 -160', stroke: '#2a2e38', 'stroke-width': 24 }, gas)
  svg('rect', { x: -60, y: -170, width: 120, height: 300, rx: 22, fill: '#3a3e48', stroke: '#5a5e68', 'stroke-width': 6 }, gas)
  for (let k = 0; k < 7; k++) svg('rect', { x: -44, y: -150 + k * 38, width: 88, height: 12, rx: 6, fill: '#2a2e38' }, gas)
  const shoe = svg('g', {}, C1)
  svg('path', { d: 'M -60 -520 L -40 -60', stroke: '#5a5a6a', 'stroke-width': 120, 'stroke-linecap': 'round' }, shoe)
  svg('path', { d: 'M -110 -90 C -110 -150 20 -160 60 -120 L 200 -40 C 240 -10 230 40 180 44 L -90 44 C -130 44 -130 -20 -110 -90 Z', fill: '#6a3f26', stroke: '#2a1408', 'stroke-width': 8 }, shoe)
  svg('path', { d: 'M -100 30 L 200 30', stroke: '#2a1408', 'stroke-width': 14 }, shoe)
  // C2 : la conversation de famille.
  const C2 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#famBg)' }, C2)
  const ph = svg('g', { transform: 'translate(540 860)' }, C2)
  svg('rect', { x: -300, y: -540, width: 600, height: 1080, rx: 64, fill: '#111', stroke: '#3a3a3a', 'stroke-width': 8 }, ph)
  svg('rect', { x: -278, y: -518, width: 556, height: 1036, rx: 46, fill: '#eef2f6' }, ph)
  svg('rect', { x: -278, y: -518, width: 556, height: 150, rx: 46, fill: '#2a7a5a' }, ph)
  const fn = txt(ph, 'Famille ❤️ (5)', { x: -190, y: -424, 'font-size': 44, fill: '#ffffff' })
  fn.setAttribute('text-anchor', 'start')
  svg('circle', { cx: -228, cy: -440, r: 30, fill: '#ffffff', opacity: 0.85 }, ph)
  const msg = (y, who, s, mine) => {
    const g = svg('g', { transform: `translate(0 ${y})` }, ph)
    const w = 60 + s.length * 24
    const x = mine ? 258 - w : -258
    svg('rect', { x, y: -64, width: w, height: 120, rx: 34, fill: mine ? '#d9f7c8' : '#ffffff', stroke: '#c9d0da', 'stroke-width': 2 }, g)
    const a = txt(g, who, { x: x + 26, y: -24, 'font-size': 26, fill: mine ? '#2a7a5a' : '#c0392b', 'font-weight': 800 })
    a.setAttribute('text-anchor', 'start')
    const b = txt(g, s, { x: x + 26, y: 28, 'font-size': 38, fill: '#10121a', 'font-weight': 800 })
    b.setAttribute('text-anchor', 'start')
    return g
  }
  const msgs = [msg(-250, 'Claire', 'Papa, rends ton permis.', false), msg(-90, 'Marc', 'Papa, s’il te plaît 🙏', false), msg(70, 'Bernard', 'Je conduis très bien.', true), msg(230, 'Bernard', 'Laissez-moi tranquille.', true)]
  // C3 : trois accidents en deux ans.
  const C3 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, C3)
  const crashes = ['2023', '2024', '2025'].map((y, k) => {
    const g = svg('g', {}, C3)
    svg('rect', { x: -170, y: -110, width: 340, height: 220, rx: 24, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 6 }, g)
    const car = svg('g', { transform: 'translate(0 10) scale(0.9)' }, g)
    svg('path', { d: 'M -130 40 L -120 -10 L -60 -20 L -30 -60 L 50 -60 L 80 -20 L 130 -10 L 130 40 Z', fill: ['#3b82f6', '#8a96a6', '#12a150'][k], stroke: '#07080c', 'stroke-width': 5 }, car)
    svg('path', { d: k === 0 ? 'M 90 -20 L 110 0 L 96 10 L 130 30' : k === 1 ? 'M -120 -6 L -100 10 L -120 24' : 'M -20 -60 L 0 -40 L 20 -58 L 40 -40', fill: 'none', stroke: '#ff3b3b', 'stroke-width': 8 }, car)
    for (const wx of [-80, 80]) svg('circle', { cx: wx, cy: 40, r: 24, fill: '#07080c' }, car)
    txt(g, y, { y: 92, 'font-size': 40, fill: '#ffd166' })
    return g
  })
  // C4 : le permis qu'il n'a pas rendu (réutilisé pour le jugement).
  let PHOTO = 0
  const permis = (parent) => {
    const g = svg('g', {}, parent)
    svg('rect', { x: -380, y: -240, width: 760, height: 480, rx: 34, fill: 'url(#permisG)', stroke: '#b06a8a', 'stroke-width': 8 }, g)
    txt(g, 'PERMIS DE CONDUIRE', { x: 60, y: -150, 'font-size': 52, fill: '#7a1a4a' })
    txt(g, 'RÉPUBLIQUE FRANÇAISE', { x: 60, y: -100, 'font-size': 28, fill: '#7a1a4a', opacity: 0.8 })
    svg('rect', { x: -340, y: -200, width: 70, height: 50, rx: 8, fill: '#1d3fa0' }, g)
    const pc2 = svg('clipPath', { id: `photo${++PHOTO}` }, defs)
    svg('rect', { x: -340, y: -120, width: 240, height: 300, rx: 12 }, pc2)
    svg('rect', { x: -340, y: -120, width: 240, height: 300, rx: 12, fill: '#c9d6e2' }, g)
    const ph2 = svg('g', { 'clip-path': `url(#${pc2.id})` }, g)
    const b = bernard(ph2)
    b.update(0, { x: -220, y: 100, scale: 0.42, brows: 'neutral', armR: [0.1, 0.4], armL: [0.1, 0.4], breathe: 0, blink: 0 })
    for (const [y, a, v] of [[-30, '1. NOM', 'MARTIN'], [30, '2. PRÉNOM', 'BERNARD'], [90, '3. NÉ LE', '14.02.1938'], [150, '9. CATÉGORIE', 'B']]) {
      const l = txt(g, a, { x: -60, y, 'font-size': 24, fill: '#7a1a4a', opacity: 0.7 })
      l.setAttribute('text-anchor', 'start')
      const v2 = txt(g, v, { x: 120, y, 'font-size': 38, fill: '#2a0a1a' })
      v2.setAttribute('text-anchor', 'start')
    }
    return g
  }
  const C4 = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, C4)
  const card = permis(C4)
  // D · Léa, en rééducation.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#hospWall)' }, Dcam)
  for (const [x, y, c, r] of [[160, 380, '#ffd166', -6], [420, 330, '#ff8ab0', 4], [780, 400, '#9fd0ff', -3]]) {
    const d = svg('g', { transform: `translate(${x} ${y}) rotate(${r})` }, Dcam)
    svg('rect', { x: -110, y: -80, width: 220, height: 160, fill: '#ffffff', stroke: '#c9d0da', 'stroke-width': 4 }, d)
    svg('circle', { cx: -40, cy: -10, r: 34, fill: c }, d)
    svg('path', { d: 'M -90 60 Q 0 0 90 60', fill: 'none', stroke: '#12a150', 'stroke-width': 8 }, d)
  }
  svg('rect', { x: -400, y: 1500, width: W + 800, height: 700, fill: '#9fb8ae' }, Dcam)
  const lea2 = makePerson(Dcam, LEA)
  for (const y of [1330]) svg('rect', { x: 60, y, width: 960, height: 26, rx: 13, fill: '#c9d0da', stroke: '#7a8698', 'stroke-width': 4 }, Dcam)
  for (const x of [80, 1000]) svg('rect', { x: x - 12, y: 1330, width: 24, height: 300, fill: '#7a8698' }, Dcam)
  const dBall = svg('g', { transform: 'translate(900 1560)' }, Dcam)
  svg('circle', { r: 60, fill: 'url(#ballG)' }, dBall)
  // E · Le jugement : le permis brisé par le marteau.
  const Ev = svg('g', { display: 'none' }, R)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#judgeBg)' }, Ev)
  const halves = [-1, 1].map((sd) => {
    const cp = svg('clipPath', { id: `half${sd}` }, defs)
    svg('path', { d: sd < 0 ? 'M -500 -400 L 40 -400 L -20 -60 L 50 40 L -10 400 L -500 400 Z' : 'M 40 -400 L 500 -400 L 500 400 L -10 400 L 50 40 L -20 -60 Z' }, cp)
    const g = svg('g', {}, Ev)
    const inner = svg('g', { 'clip-path': `url(#half${sd})` }, g)
    permis(inner)
    return g
  })
  const eFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { A, Aw, wins, shutters, dashes, poles, zebra, sign30, signPole, signDisc, signTxt, bakery, bakeryBoard, lea, ball, ballShadow, bPip, clock, speed, Bk, bkBall, bkShadow, lost, C0, bC0, streaksIn, C1, shoe, C2, msgs, C3, crashes, C4, card, D, Dcam, lea2, dBall, Ev, halves, eFlash, gavel, rwBands }
})

// ------------------------------------------------- 2 · Le procès
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
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#d42a2a' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.14 }, hotBg)
  const graveBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#courtDark)' }, graveBg)
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, graveBg)
  const pauseBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#pauseBg)' }, pauseBg)
  const rays = svg('g', { transform: 'translate(540 1000)' }, pauseBg)
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: k % 2 ? '#3b82f6' : '#fe2c55', opacity: 0.14, transform: `rotate(${k * 30})` }, rays)
  const crowd = Array.from({ length: 9 }, (_, i) => {
    const g = svg('g', {}, L.mid)
    svg('circle', { cx: 0, cy: -60, r: 46, fill: '#0c0f1c', opacity: 0.85 }, g)
    svg('rect', { x: -70, y: -20, width: 140, height: 200, rx: 60, fill: '#0c0f1c', opacity: 0.85 }, g)
    return { g, x: -40 + i * 140, ph: r() * 6 }
  })
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  const deskG = svg('g', {}, L.front)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 500, fill: 'url(#desk)' }, deskG)
  svg('rect', { x: -300, y: 1780, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, deskG)
  const P = svg('g', {}, L.hud)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // 05 : la baguette.
  const bread = prop((g) => {
    panel(g, 640, 300, '#ffd166')
    svg('path', { d: 'M -250 40 C -270 -30 -180 -70 -100 -60 L 200 -20 C 280 -10 290 70 220 80 L -180 90 C -230 92 -245 70 -250 40 Z', fill: '#d9a050', stroke: '#8a5a20', 'stroke-width': 6 }, g)
    for (let k = 0; k < 5; k++) svg('path', { d: `M ${-170 + k * 90} -20 Q ${-140 + k * 90} 10 ${-120 + k * 90} 50`, fill: 'none', stroke: '#f2d0a0', 'stroke-width': 10, 'stroke-linecap': 'round' }, g)
  })
  // 07 : la radio des hanches, deux prothèses.
  const xray = prop((g) => {
    panel(g, 640, 440, '#9fd0ff')
    svg('rect', { x: -280, y: -180, width: 560, height: 360, rx: 16, fill: '#0a1420' }, g)
    svg('path', { d: 'M -200 -150 C -120 -60 120 -60 200 -150 L 160 -20 C 80 30 -80 30 -160 -20 Z', fill: '#cfe6ff', opacity: 0.55 }, g)
    for (const sd of [-1, 1]) {
      svg('path', { d: `M ${sd * 120} -40 L ${sd * 150} 160`, stroke: '#cfe6ff', 'stroke-width': 46, 'stroke-linecap': 'round', opacity: 0.6 }, g)
      svg('circle', { cx: sd * 112, cy: -50, r: 40, fill: '#ffffff' }, g)
      svg('path', { d: `M ${sd * 112} -50 L ${sd * 140} 90`, stroke: '#ffffff', 'stroke-width': 22, 'stroke-linecap': 'round' }, g)
    }
  })
  // 09 : l'arrêt de bus du village.
  const bus = prop((g) => {
    panel(g, 560, 520, '#ffd166')
    svg('rect', { x: -10, y: -200, width: 20, height: 380, fill: '#8a8e98' }, g)
    svg('rect', { x: -170, y: -220, width: 340, height: 120, rx: 18, fill: '#1d4fd0' }, g)
    txt(g, 'ARRÊT : L’ÉGLISE', { y: -146, 'font-size': 36, fill: '#ffffff' })
    svg('rect', { x: -200, y: -70, width: 400, height: 150, rx: 14, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 5 }, g)
    txt(g, 'PROCHAIN BUS :', { y: -14, 'font-size': 34, fill: '#10121a' })
    txt(g, 'MARDI', { y: 52, 'font-size': 64, fill: '#e5484d' })
  })
  // 12 : le ballon rouge.
  const redBall = prop((g) => {
    svg('circle', { r: 150, fill: 'url(#ballG)' }, g)
    svg('path', { d: 'M -146 -30 Q 0 60 146 -30', fill: 'none', stroke: '#ffffff', 'stroke-width': 14, opacity: 0.6 }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, bread, xray, bus, redBall }
})

// ------------------------------------------------- 3 · Le vote : Bernard face à Léa
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const b = bernard(L.actor)
  const lea = makePerson(L.actor, LEA)
  const ball = svg('g', { transform: 'translate(960 1640)' }, L.actor)
  svg('circle', { r: 70, fill: 'url(#ballG)' }, ball)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { b, lea }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ffd166' }, fxTop), d: (x + y) * 0.011 })
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)' }, root)
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)

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
    const k = lerp(T.from, 1, ease.out3(a)) * Math.min(1, s) * (T.kick ? T.kick(t) : 1)
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

// ------------------------------------------------------------------ les instants
const HOT = C.hot
const hotAt = (t) => HOT.find(([a, b]) => t >= a && t < b)
const LIKE = '<svg viewBox="0 0 24 24" width="84" height="84" style="vertical-align:middle;margin-right:20px"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.2 4.3 2.4.7-1.2 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" fill="#fe2c55"/></svg>LIKE'
const fr = (v) => Math.round(v).toLocaleString('fr-FR')
const pad = (n) => String(Math.floor(n)).padStart(2, '0')
// Le hook.
fs(tag('BERNARD · 87 ANS', 'pill yellow', { t0: K.REPLAY, t1: K.PEDALS - 0.05, y: 300, rot: -2 }), 60)
fs(tag('FREIN', 'pill green', { t0: K.PEDALS + 0.1, t1: K.FAMILY - 0.05, x: 360, y: 560, rot: -3 }), 60)
fs(tag('ACCÉLÉRATEUR', 'pill red', { t0: K.PEDALS + 0.25, t1: K.FAMILY - 0.05, x: 720, y: 330, rot: 3 }), 60)
counterTag(K.CRASHES, K.REFUSE - 0.05, 3, 'ACCIDENTS EN 2 ANS', { y: 250, dur: 0.6 })
fs(tag('REFUSÉ.', 'stamp', { t0: K.REFUSE + 0.15, t1: K.LEA - 0.02, y: 1240, rot: -8, from: 2.8, dur: 0.18 }), 150)
fs(tag('LÉA · 7 ANS', 'pill yellow', { t0: K.LEA + 0.05, t1: K.TODAY - 0.05, y: 300, rot: 2 }), 60)
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('IL SAVAIT', 'pill', { t0: Wd('04', 'savai', 0) - 0.2, t1: Wd('04', 'et') - 0.12, y: 260, rot: -2 }), 54)
fs(tag('SES ENFANTS SAVAIENT', 'pill', { t0: Wd('04', 'savai', 1) - 0.2, t1: Wd('04', 'et') - 0.12, y: 370, rot: 2 }), 54)
fs(tag('SON MÉDECIN SAVAIT', 'pill red', { t0: Wd('04', 'savai', 2) - 0.2, t1: Wd('04', 'et') - 0.12, y: 480, rot: -2 }), 54)
fs(tag('IL A REPRIS LE VOLANT.', 'slam white', { t0: Wd('04', 'repris') - 0.2, t1: E('04') + 0.15, y: 380, rot: -3, from: 2.4, dur: 0.18 }), 84)
fs(tag('LA LOI LE PERMETTAIT', 'pill', { t0: Wd('05', 'loi') - 0.15, t1: Wd('05', 'jugez') - 0.12, y: 300, rot: -2 }), 54)
fs(tag('« JUGEZ LA LOI »', 'slam yellow', { t0: Wd('05', 'jugez') - 0.1, t1: Wd('05', 'pain') - 0.3, y: 330, rot: -4, from: 2.6, dur: 0.15 }), 110)
counterTag(Wd('06', '200') - 0.15, Wd('06', 'il') - 0.12, 200, 'MÈTRES', { y: 330, dur: 0.5 })
fs(tag('« IL POUVAIT MARCHER. »', 'slam red', { t0: Wd('06', 'il') - 0.1, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 74)
tag('2 PROTHÈSES DE HANCHE', 'pill', { t0: Wd('07', 'deux') - 0.15, t1: Wd('07', 'vous') - 0.12, y: 300, rot: -2 })
fs(tag('« VOUS L’AURIEZ PORTÉ ? »', 'slam red', { t0: Wd('07', 'vous') - 0.1, t1: E('07') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 72)
fs(tag('RETIRER LE PERMIS<br>AUX SENIORS ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 80)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('08', 'like') - 0.1, t1: E('08') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
fs(tag('ON ATTEND LA MORT.', 'slam white', { t0: Wd('09', 'on', 1) - 0.1, t1: E('09') + 0.15, y: 330, rot: -3, from: 2.4, dur: 0.18 }), 96)
fs(tag('75 ?', 'slam yellow', { t0: Wd('10', '75') - 0.1, t1: Wd('10', '80') - 0.1, y: 380, rot: -5, from: 2.6, dur: 0.15 }), 200)
fs(tag('80 ?', 'slam yellow', { t0: Wd('10', '80') - 0.08, t1: Wd('10', 'vous') - 0.12, y: 380, rot: 5, from: 2.6, dur: 0.15 }), 200)
fs(tag('« VOUS FIXEREZ LA DATE ? »', 'slam red', { t0: Wd('10', 'vous') - 0.1, t1: E('10') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 66)
tag('PAS UN ÂGE.', 'pill', { t0: S('11') - 0.05, t1: Wd('11', 'un', 1) - 0.12, y: 300, rot: -2 })
fs(tag('UN EXAMEN.', 'stamp', { t0: Wd('11', 'un', 1) - 0.1, t1: Wd('11', 'il') - 0.1, y: 360, rot: -6, from: 2.8, dur: 0.18 }), 110)
fs(tag('REFUSÉ × 3', 'stamp', { t0: Wd('11', 'refuse') - 0.15, t1: E('11') + 0.15, y: 360, rot: 5, from: 2.8, dur: 0.18 }), 110)
fs(tag('« C’EST CHER PAYÉ, SA LIBERTÉ. »', 'slam white', { t0: Wd('12', 'cest') - 0.15, t1: E('12') + 0.3, y: 330, rot: -3, from: 2.4, dur: 0.2 }), 56)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('13') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('13', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('13', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecrisle') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', conducteur: 'BERNARD, AU VOLANT' }

// Gros sous-titres animés (pas sur l'appel au like : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['08-like'].includes(l.id))) {
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
  [K.REV, 6],
  [K.SCREECH, 10],
  [K.HIT, 30],
  [K.REPLAY, 10],
  [K.PEDALS, 10],
  [K.CRASHES, 8],
  [K.REFUSE + 0.15, 14],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'repris') - 0.2, 10],
  [Wd('09', 'on', 1) - 0.1, 10],
  [Wd('11', 'un', 1) - 0.1, 10],
  [Wd('11', 'refuse') - 0.15, 10],
  [C.impact, 10],
  [Wd('13', 'jure') - 0.15, 8],
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
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02, hand = 2, rot = 0, from = s.t0, flat = false } = {}) {
  const [sx, sy] = shakeAt(t, hand)
  const z = zoom * (1 + push * Math.max(0, t - from))
  const par = (k0) => {
    const k = flat ? 1 : k0
    return `translate(${540 + sx * k} ${960 + sy * k}) rotate(${rot * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  }
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.12) ?? TLINES[0]
const BEATS = C.lines.filter((l) => l.who !== 'narrateur').flatMap((l) => l.words.filter((w) => /[.?!…»]$/.test(w.w)).map((w) => ({ t: w.t, who: l.who })))
const SHOT = (cx, cy, z, rot = 0, dx = 0, dy = 0) => `translate(${540 + dx} ${960 + dy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`
const siren = (t) => (Math.floor(t * 4) % 2 ? 1 : 0) * (0.6 + 0.4 * Math.sin(t * 50) ** 2)

// La dashcam : vitesse (km/h) et distance parcourue (m).
const kmh = (t) => (t < K.REV ? 22 : t < K.SCREECH ? lerp(22, 68, ease.in2(clamp((t - K.REV) / (K.SCREECH - K.REV)))) : lerp(68, 41, clamp((t - K.SCREECH) / (K.HIT - K.SCREECH))))
const TRAVEL = []
for (let i = 0, d = 0; i <= Math.ceil(K.HIT * 120) + 1; i++) {
  TRAVEL.push(d)
  d += kmh(i / 120) / 3.6 / 120
}
const travel = (t) => {
  const i = clamp(t, 0, K.HIT) * 120
  const a = TRAVEL[Math.floor(i)] ?? TRAVEL.at(-1)
  const b = TRAVEL[Math.floor(i) + 1] ?? a
  return a + (b - a) * (i % 1)
}
const ZC = travel(K.HIT) + 2.3 // le passage piéton (bord le plus proche)
const wrap = (z, period) => ((z % period) + period) % period
const pts = (arr) => arr.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
function dashcam(t) {
  const tr = travel(t)
  for (const w of HOOK.wins) {
    const z = wrap(w.z - tr, 49) + 1.2
    const X = w.side * 5.48
    const [y0, y1] = w.door ? [0, 2.2] : [1.3, 2.6]
    w.el.setAttribute('d', `M ${pts([proj(X, y0, z), proj(X, y1, z), proj(X, y1, z + 1.3), proj(X, y0, z + 1.3)])} Z`)
  }
  HOOK.shutters.forEach((s, k) => {
    const w = HOOK.wins[k]
    const z = wrap(w.z - tr, 49) + 1.2 + 1.3
    const X = w.side * 5.47
    s.el.setAttribute('d', w.door ? '' : `M ${pts([proj(X, 1.3, z), proj(X, 2.6, z), proj(X, 2.6, z + 0.5), proj(X, 1.3, z + 0.5)])} Z`)
  })
  for (const d of HOOK.dashes) {
    const z = wrap(d.z - tr, 84) + 1.2
    d.el.setAttribute('d', `M ${pts([proj(-0.07, 0, z), proj(0.07, 0, z), proj(0.07, 0, z + 3), proj(-0.07, 0, z + 3)])} Z`)
  }
  for (const p of HOOK.poles) {
    const z = wrap(p.z - tr, 72) + 1.2
    const [x0, y0] = proj(p.side * 4.2, 0, z)
    const [x1, y1] = proj(p.side * 4.2, 4.2, z)
    p.el.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1} L ${x1 - p.side * (0.6 * F) / z} ${y1}`)
    p.el.setAttribute('stroke-width', ((0.14 * F) / z).toFixed(1))
  }
  const zc = ZC - tr
  HOOK.zebra.forEach((s, k) => {
    const X0 = -3.3 + k * 0.97
    s.setAttribute('d', zc > 0.35 ? `M ${pts([proj(X0, 0, zc), proj(X0 + 0.5, 0, zc), proj(X0 + 0.5, 0, zc + 3), proj(X0, 0, zc + 3)])} Z` : '')
  })
  const zs = zc - 5
  show(HOOK.sign30, zs > 1)
  if (zs > 1) {
    const [x0, y0] = proj(4.0, 0, zs)
    const [x1, y1] = proj(4.0, 2.3, zs)
    HOOK.signPole.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1}`)
    HOOK.signPole.setAttribute('stroke-width', ((0.08 * F) / zs).toFixed(1))
    const r = (0.36 * F) / zs
    HOOK.signDisc.setAttribute('cx', x1)
    HOOK.signDisc.setAttribute('cy', y1 - r)
    HOOK.signDisc.setAttribute('r', r)
    HOOK.signDisc.setAttribute('stroke-width', r * 0.22)
    HOOK.signTxt.setAttribute('x', x1)
    HOOK.signTxt.setAttribute('y', y1 - r * 0.62)
    HOOK.signTxt.setAttribute('font-size', r * 1.1)
  }
  const zb = zc + 6
  HOOK.bakeryBoard.setAttribute('d', `M ${pts([proj(5.45, 2.8, zb), proj(5.45, 3.5, zb), proj(5.45, 3.5, zb + 6), proj(5.45, 2.8, zb + 6)])} Z`)
  // Le ballon traverse, la petite fille court derrière.
  const bu = clamp((t - 0.5) / (K.HIT - 0.5))
  const bX = lerp(-4.2, 1.6, bu)
  const bz = zc + 1.4
  const hop = Math.abs(Math.sin(t * 7)) * 0.25 * (1 - bu * 0.5)
  const [bx, by] = proj(bX, 0.11 + hop, bz)
  const bs = (0.11 * F) / bz / 50
  place(HOOK.ball, bx, by, bs, t * 400)
  const [sx, sy] = proj(bX, 0, bz)
  HOOK.ballShadow.setAttribute('cx', sx)
  HOOK.ballShadow.setAttribute('cy', sy)
  HOOK.ballShadow.setAttribute('rx', 50 * bs)
  HOOK.ballShadow.setAttribute('ry', 14 * bs)
  const gu = ease.in2(clamp((t - K.GIRL) / (K.HIT - K.GIRL)))
  const gX = lerp(-4.6, -0.5, gu)
  const gz = zc + 1.6
  const [gx, gy] = proj(gX, 0, gz)
  const gs = (1.15 * F) / gz / 100
  show(HOOK.lea.g, t > K.GIRL - 0.3)
  HOOK.lea.g.setAttribute('transform', `translate(${gx} ${gy}) scale(${gs})`)
  const ph = t * 16
  const leg = (p) => `M 0 -26 L ${Math.sin(p) * 14} -12 L ${Math.sin(p) * 18} 0`
  HOOK.lea.legF.setAttribute('d', t > K.GIRL ? leg(ph) : 'M -6 -26 L -6 0')
  HOOK.lea.legB.setAttribute('d', t > K.GIRL ? leg(ph + Math.PI) : 'M 6 -26 L 6 0')
  HOOK.lea.arms.setAttribute('d', t > K.GIRL ? `M -16 -56 L ${-26 + 8 * Math.sin(ph)} -36 M 16 -56 L ${30} -66` : 'M -16 -56 L -20 -34 M 16 -56 L 20 -34')
}

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const phase = t < K.HIT ? 'A' : t < K.REWIND ? 'B' : t < K.PEDALS ? 'C0' : t < K.FAMILY ? 'C1' : t < K.CRASHES ? 'C2' : t < K.REFUSE ? 'C3' : t < K.LEA ? 'C4' : t < K.TODAY ? 'D' : 'E'
    for (const [k, el] of [['A', HOOK.A], ['B', HOOK.Bk], ['C0', HOOK.C0], ['C1', HOOK.C1], ['C2', HOOK.C2], ['C3', HOOK.C3], ['C4', HOOK.C4], ['D', HOOK.D], ['E', HOOK.Ev]]) show(el, phase === k)
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A') {
      // La dashcam : la rue, le ballon, la vitesse qui grimpe ; dans l'incrustation, Bernard panique.
      dashcam(t)
      const v = kmh(t)
      const rumble = (v / 68) * (2 * Math.sin(t * 37) + 1.5 * Math.sin(t * 53))
      const dive = ease.out3(clamp((t - K.SCREECH) / 0.2))
      HOOK.Aw.setAttribute('transform', SHOT(540, 960 - 40 * dive, 1 + 0.002 * v + 0.05 * dive, 1.5 * dive * Math.sin(t * 30), hx + rumble, hy + rumble * 0.7 + 30 * dive))
      HOOK.speed.textContent = String(Math.round(v))
      HOOK.speed.setAttribute('fill', v > 31 ? '#ff3b3b' : '#ffffff')
      HOOK.clock.textContent = `12/03/2026 08:12:${pad(41 + t)}`
      const m = mouthOf('conducteur', t)
      const panic = ease.out3(clamp((t - K.REV - 0.4) / 0.4))
      HOOK.bPip.update(t, { x: 180, y: 250, scale: 0.42, mouth: m, brows: panic > 0.5 ? 'surprised' : 'neutral', look: [0.2, -0.2], armR: [lerp(0.9, 2.3, panic), lerp(0.7, 0.5, panic)], armL: [lerp(0.9, 2.2, panic), 0.6], headTilt: panic * 0.12 * Math.sin(t * 9), seed: 1.3 })
    }
    if (phase === 'B') {
      // Noir. Le ballon rouge roule seul et s'arrête.
      const k = t - K.HIT
      HOOK.lost.setAttribute('opacity', k < 0.5 ? (Math.floor(k * 16) % 2 ? 0.8 : 0) : 0)
      const u = ease.out3(clamp((k - 0.45) / 1.1))
      const x = lerp(-120, 560, u)
      const y = 1136 - Math.abs(Math.sin(u * Math.PI * 3)) * 60 * (1 - u)
      show(HOOK.bkBall, k > 0.4)
      place(HOOK.bkBall, x, y, 1, u * 540)
      HOOK.bkShadow.setAttribute('cx', x)
      HOOK.bkShadow.setAttribute('opacity', k > 0.4 ? 0.6 : 0)
    }
    if (phase.startsWith('C')) {
      const rw = t < K.REPLAY
      HOOK.rwBands.forEach((b, i) => {
        const r = rng(Math.floor(t * 30) + i)
        b.setAttribute('y', r() * H)
        b.setAttribute('height', 10 + r() * 40)
        b.setAttribute('opacity', rw ? 0.3 : 0)
      })
      if (phase === 'C0') {
        HOOK.bC0.update(t, { x: 520, y: 1220, scale: 1.1, mouth: 0, brows: 'determined', look: [0.4, 0], armR: [0.95, 0.6], armL: [0.95, 0.6], headNod: 0.05 * Math.sin(t * 2), seed: 1.3 })
        HOOK.streaksIn.setAttribute('transform', `translate(${1200 - ((t * 1400) % 1500)} 0)`)
        HOOK.C0.setAttribute('transform', SHOT(540, 980, 1.0 + 0.03 * (t - K.REWIND), 0, hx + (rw ? 30 * Math.sin(t * 70) : 0), hy))
      }
      if (phase === 'C1') {
        const k = t - K.PEDALS
        const press = 0.5 + 0.5 * Math.sin(k * 10)
        HOOK.shoe.setAttribute('transform', `translate(${lerp(560, 760, ease.out3(clamp(k / 0.3)))} ${960 + 30 * press}) rotate(${-4 + 4 * press})`)
        HOOK.C1.setAttribute('transform', SHOT(560, 860, 1.05 + 0.04 * k, 0, hx, hy))
      }
      if (phase === 'C2') {
        const k = t - K.FAMILY
        HOOK.msgs.forEach((g, i) => {
          const v = popS(t, K.FAMILY + 0.05 + i * ((K.CRASHES - K.FAMILY - 0.25) / 4), Infinity, 0.3)
          g.setAttribute('opacity', v > 0.01 ? 1 : 0)
          g.setAttribute('transform', `translate(${(1 - Math.min(1, v)) * (i > 1 ? 200 : -200)} ${[-250, -90, 70, 230][i]}) scale(${Math.max(0.01, v).toFixed(3)})`)
        })
        HOOK.C2.setAttribute('transform', SHOT(540, 900, 1.0 + 0.03 * k, -1.5, hx, hy))
      }
      if (phase === 'C3') {
        HOOK.crashes.forEach((g, i) => {
          const v = popS(t, K.CRASHES + 0.05 + i * 0.22, Infinity, 0.3)
          g.setAttribute('opacity', v > 0.01 ? 1 : 0)
          place(g, 540 + (i - 1) * 30, 560 + i * 300, Math.max(0.01, v) * 1.3, (i - 1) * 4)
        })
      }
      if (phase === 'C4') {
        const k = t - K.REFUSE
        place(HOOK.card, 540, 880 + 10 * Math.sin(t * 2), 1.15 + 0.03 * k, -4 + 2 * Math.sin(t))
      }
    } else HOOK.rwBands.forEach((b) => b.setAttribute('opacity', 0))
    if (phase === 'D') {
      // Léa, entre les barres parallèles, fait un pas.
      const k = t - K.LEA
      const step = Math.sin(k * 3)
      HOOK.lea2.update(t, { x: 540 + 20 * step, y: 1180 + 8 * Math.abs(step), scale: 0.78, mouth: 0, brows: 'determined', look: [0, 0.3], armR: [0.85, -0.25], armL: [0.85, -0.25], headTilt: 0.06 * step, seed: 0.4 })
      HOOK.Dcam.setAttribute('transform', SHOT(540, 1000, 1.0 + 0.04 * k, 0, hx, hy))
    }
    if (phase === 'E') {
      // Le marteau brise le permis en deux.
      const k = t - K.TODAY
      const after = t - K.GAVEL
      const sp = after > 0 ? ease.out3(clamp(after / 0.5)) : 0
      HOOK.halves.forEach((g, i) => {
        const sd = i ? 1 : -1
        g.setAttribute('transform', `translate(${540 + sd * 120 * sp} ${900 + 60 * sp}) rotate(${-3 + sd * 10 * sp}) scale(${1.2 + 0.03 * k})`)
      })
      HOOK.eFlash.setAttribute('opacity', after > 0 ? (0.8 * Math.exp(-after * 8)).toFixed(3) : 0)
      const g = prog(t, K.GAVEL - 0.12, 0.12, ease.in3)
      show(HOOK.gavel, t > K.GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(1000, 640, g)} ${lerp(160, 720, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '12'
    show(TRIB.procBg, isProc && !hot && !pause && !grave)
    show(TRIB.avoBg, !isProc && !hot && !pause && !grave)
    show(TRIB.hotBg, hot && !pause)
    show(TRIB.graveBg, grave && !hot)
    show(TRIB.pauseBg, pause)
    show(TRIB.proc.root, isProc && !pause)
    show(TRIB.avo.root, !isProc && !pause)
    show(TRIB.deskG, !pause)
    for (const c of TRIB.crowd) show(c.g, !pause && !grave)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const hs = hotAt(t)
    const hk = hs ? prog(t, hs[0], 0.12, ease.out3) * (1 - prog(t, hs[1] - 0.2, 0.2, ease.io2)) : 0
    if (pause) {
      cam(TRIB, t, { zoom: 1, push: 0.02, from: l.start, hand: 0, flat: true })
      TRIB.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 30) % 360})`)
    } else cam(TRIB, t, { zoom: (grave ? 1.08 : 1.0) + 0.25 * hk + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 820, hk), push: grave ? 0.035 : 0.025, from: l.start - 0.12, rot: side * 0.6 + hk * side * -3 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    if (!pause)
      P.update(t, {
        x: 540 + side * 60,
        y: 1170,
        scale: 1.4,
        lean: side * -0.03 + bk * side * -0.03 + hk * side * -0.06,
        mouth: m,
        brows: hk > 0.2 || grave || isProc ? 'angry' : 'determined',
        look: [side * -0.4, 0],
        armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5 + hk * 1.2, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
        armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
        point: bk > 0.3 || hk > 0.3,
        seed: isProc ? 0.5 : 1.7,
        headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
        headNod: 0.08 * bk,
      })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph))})`))
    const prop = (el, t0, t1, x = 540, y = 640, s = 0.8) => {
      const v = popS(t, t0, t1, 0.35)
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, 0)
      return v
    }
    prop(TRIB.bread, Wd('05', 'pain') - 0.25, E('05') + 0.15, 540, 640, 0.85)
    prop(TRIB.xray, Wd('07', 'deux') - 0.2, Wd('07', 'vous') - 0.12, 540, 680, 0.85)
    prop(TRIB.bus, S('09') - 0.05, Wd('09', 'on', 1) - 0.12, 540, 700, 0.85)
    prop(TRIB.redBall, Wd('12', 'petite') - 0.2, Wd('12', 'cest') - 0.15, 540, 700, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.b.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'sad', look: [0.3, 0.1], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    VOTE.lea.update(t, { x: 805, y: 1530, scale: 0.8, brows: 'determined', look: [-0.3, 0], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 0.7 })
  }

  // Transitions : flash, pastilles, panoramique filé.
  let f = 0
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.95 : 0.3) * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  let whip = 0
  for (const l of TLINES.slice(1)) {
    if (l.id.startsWith('08') || l.id.startsWith('09')) continue
    const q = t - (l.start - 0.12)
    if (q > -0.12 && q < 0.12) {
      const dir = l.who === 'procureur' ? -1 : 1
      whip = q < 0 ? dir * -1400 * ease.in3(clamp((q + 0.12) / 0.12)) : dir * 1400 * (1 - ease.out3(clamp(q / 0.12)))
    }
  }
  TRIB.g.setAttribute('transform', `translate(${whip.toFixed(1)} 0)`)
  streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && WHO[l.who])
  who.textContent = w ? WHO[w.who] : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, cur === HOOK ? 22 : 14)
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
