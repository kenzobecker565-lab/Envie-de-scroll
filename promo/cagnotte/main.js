/**
 * ============================================================================
 *  « Affaire Classée ? » — La cagnotte (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : le téléphone d'un passager dans
 *  un TER de nuit. Le contrôleur fait descendre Manon, 15 ans, en larmes ; les
 *  portes se ferment ; le train repart et elle rétrécit, seule sur le quai sous
 *  un lampadaire. Le narrateur explique pendant le replay (la gare déserte, le
 *  téléphone mort, le contrôleur), puis la départementale, les phares, le noir,
 *  l'hôpital. Le marteau tombe.
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
grad('splitL', [[0, '#1f2d55'], [1, '#060a18']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#5a1a3a'], [1, '#18040e']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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
grad('trainIn', [[0, '#2a3440'], [1, '#141a22']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('seatG', [[0, '#2f6fa0'], [1, '#1d4a70']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('neon', [[0, '#eaf6ff', 0.9], [1, '#eaf6ff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('nightF', [[0, '#05070f'], [0.6, '#0c1220'], [1, '#141a28']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lampG', [[0, '#ffd28a', 0.85], [0.4, '#ffb050', 0.3], [1, '#ffb050', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('headl', [[0, '#ffffff', 1], [0.3, '#fff6d8', 0.6], [1, '#fff6d8', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('hospWall', [[0, '#e8f3ef'], [1, '#bcd6cc']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('judgeBg', [[0, '#1a1e30'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })

// Les personnages. Les avocats en costume ; le contrôleur (casquette SNCF) ; Manon, 15 ans.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const AGENT = { robe: '#1f2d55', jabot: false, collar: '#ffffff', hair: 'short', hairColor: '#6a6a6a', skin: '#e2b08a', iris: '#2b1d12' }
const MANON = { robe: '#ff7aa8', jabot: false, collar: '#ffd0e0', hair: 'bob', hairColor: '#3a2414', skin: '#f6d0b0', iris: '#3a5a2a', female: true }
// La casquette du contrôleur.
function kepi(p) {
  const g = svg('g', {}, p.head)
  svg('path', { d: 'M -170 -220 C -170 -340 170 -340 170 -220 Z', fill: '#1f2d55' }, g)
  svg('rect', { x: -172, y: -238, width: 344, height: 30, fill: '#c8322a' }, g)
  svg('path', { d: 'M -180 -212 C -60 -240 60 -240 180 -212 L 196 -186 C 60 -214 -60 -214 -196 -186 Z', fill: '#10182e' }, g)
  svg('circle', { cy: -276, r: 20, fill: '#d9a930' }, g)
  return g
}
const agent = (parent) => {
  const p = makePerson(parent, AGENT)
  kepi(p)
  const badge = svg('rect', { x: 60, y: 60, width: 70, height: 46, rx: 8, fill: '#ffffff', stroke: '#c8322a', 'stroke-width': 5 }, p.root.firstChild)
  void badge
  return p
}
// Un téléphone dont la batterie est vide.
function phoneDead(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: -90, y: -170, width: 180, height: 340, rx: 26, fill: '#111' }, g)
  svg('rect', { x: -78, y: -156, width: 156, height: 312, rx: 16, fill: '#1a1d24' }, g)
  svg('rect', { x: -40, y: -30, width: 70, height: 36, rx: 6, fill: 'none', stroke: '#ff3b3b', 'stroke-width': 6 }, g)
  svg('rect', { x: 32, y: -20, width: 8, height: 16, fill: '#ff3b3b' }, g)
  svg('rect', { x: -34, y: -24, width: 6, height: 24, fill: '#ff3b3b' }, g)
  txt(g, '1 %', { y: 60, 'font-size': 40, fill: '#ff3b3b' })
  return g
}

// ------------------------------------------------- Outils « motion comic » (cases de BD, onomatopées, ombres)
{
  const f = svg('filter', { id: 'sil', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs)
  svg('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0.04  0 0 0 0 0.03  0 0 0 0 0.05  0 0 0 1 0' }, f)
  const p = svg('pattern', { id: 'dotsK', width: 18, height: 18, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, defs)
  svg('circle', { cx: 9, cy: 9, r: 3.4, fill: '#000000' }, p)
}
// Une onomatopée dans une explosion de BD.
function burst(parent, text, { fill = '#ffd166', ink = '#e5484d', size = 150, r = 300, points = 14 } = {}) {
  const g = svg('g', { opacity: 0 }, parent)
  let d = ''
  for (let k = 0; k < points * 2; k++) {
    const a = (k / (points * 2)) * Math.PI * 2
    const rr = k % 2 ? r * 0.62 : r * (0.92 + 0.16 * ((k * 7) % 3) / 2)
    d += `${k ? 'L' : 'M'} ${(Math.cos(a) * rr * 1.3).toFixed(0)} ${(Math.sin(a) * rr).toFixed(0)} `
  }
  svg('path', { d: `${d}Z`, fill, stroke: '#10121a', 'stroke-width': 14, 'stroke-linejoin': 'round' }, g)
  txt(g, text, { y: size * 0.35, 'font-size': size, fill: ink, stroke: '#10121a', 'stroke-width': 12, 'paint-order': 'stroke fill' })
  return g
}
// Animation d'une onomatopée : surgit, tremble, disparaît.
function burstAt(el, t, t0, t1, x, y, rot = -8, s = 1) {
  const v = popS(t, t0, t1, 0.18)
  el.setAttribute('opacity', v > 0.01 ? 1 : 0)
  if (v > 0.01) el.setAttribute('transform', `translate(${x + 6 * Math.sin(t * 50)} ${y + 6 * Math.cos(t * 43)}) rotate(${rot + 3 * Math.sin(t * 30)}) scale(${(v * s).toFixed(3)})`)
}
// Lignes de vitesse (rayons depuis le centre).
function speedLines(parent, n = 46, color = '#ffffff') {
  const g = svg('g', { opacity: 0 }, parent)
  const r = rng(77)
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + r() * 0.1
    const w = 0.012 + r() * 0.02
    const r0 = 380 + r() * 260
    svg('path', { d: `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a - w) * 2000} ${Math.sin(a - w) * 2000} L ${Math.cos(a + w) * 2000} ${Math.sin(a + w) * 2000} Z`, fill: color }, g)
  }
  return g
}
// Le cadre de la case de BD (bord noir épais, trame aux angles).
function comicFrame(parent) {
  const g = svg('g', {}, parent)
  svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsK)', opacity: 0.12 }, g)
  svg('rect', { x: 14, y: 14, width: W - 28, height: H - 28, rx: 10, fill: 'none', stroke: '#10121a', 'stroke-width': 28 }, g)
  return g
}
// La main droite d'un personnage (repère local), d'après les angles du bras.
function handOf(sh, el, side = 1) {
  const sx = side * 200
  const sy = 70
  const a1 = Math.PI / 2 - side * sh
  const ex = sx + Math.cos(a1) * 170
  const ey = sy + Math.sin(a1) * 170
  const a2 = Math.PI / 2 - side * (sh + el)
  return [ex + Math.cos(a2) * 194, ey + Math.sin(a2) * 194, (a2 * 180) / Math.PI]
}
// Les angles (épaule, coude) qui amènent la main au plus près d'un point (repère local).
function reach(tx, ty, side = 1) {
  let best = [0, 0]
  let bd = Infinity
  for (let sh = -0.6; sh <= 3.2; sh += 0.05) {
    for (let el = -0.2; el <= 2.2; el += 0.05) {
      const [x, y] = handOf(sh, el, side)
      const d = (x - tx) ** 2 + (y - ty) ** 2
      if (d < bd) [bd, best] = [d, [sh, el]]
    }
  }
  return best
}
// ------------------------------------------------- 1 · Le hook
grad('wagon', [[0, '#d6dde4'], [1, '#9aa6b4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lensV', [[0.55, '#000', 0], [0.85, '#000', 0.5], [1, '#000', 0.9]], { cx: 0.5, cy: 0.5, r: 0.62 })
const kit = {
  svg, txt, defs, place, show, popS, clamp, ease, lerp, rng, makePerson, handOf, reach, burst, burstAt, W, H,
  speedLines: (p, n, c) => {
    const g = speedLines(p, n, c)
    g.setAttribute('opacity', 1)
    return g
  },
  box: (parent, text, x, y, w, size = 50) => {
    const g = svg('g', {}, parent)
    svg('rect', { x, y, width: w, height: size * 1.9, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 10 }, g)
    txt(g, text, { x: x + w / 2, y: y + size * 1.32, 'font-size': size, fill: '#10121a' })
    return g
  },
  bg: (parent, fill) => svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill }, parent),
  mouth: (who, t) => mouthOf(who, t),
  W3: (w) => Wd('03', w),
}
const SEC_HOOK_END = SEC.hook.t1
const MAELYS = { robe: '#ff9ab0', jabot: false, collar: '#ffe0ea', hair: 'bob', hairColor: '#e8c070', skin: '#f2c8a6', iris: '#3a6a8a', female: true }
const GERARD = { robe: '#5a4a3a', jabot: false, collar: '#3a3026', hair: 'cap', cap: '#2a4a3a', beard: true, hairColor: '#8a8a86', skin: '#d6a07a', iris: '#3a2a1a' }
// Les temps forts du live (cues.js).
const T = K
// La caméra du live : [instant, centre x, centre y, zoom]. Un seul plan : on ne coupe jamais, on cadre.
const CAM = [
  [0, 560, 1040, 1.25],
  [T.GIVE - 0.15, 560, 1060, 1.3],
  [T.GIVE + 0.15, 560, 1120, 1.2],
  [T.OPEN, 640, 1180, 1.65],
  [T.COUNT_END + 0.05, 640, 1180, 1.65],
  [T.COUNT_END + 0.35, 760, 900, 1.3],
  [T.STICKER - 0.05, 760, 900, 1.35],
  [T.STICKER + 0.25, 640, 1000, 1.15],
  [T.PANIC - 0.1, 640, 1000, 1.15],
  [T.PANIC + 0.15, 330, 930, 1.35],
  [T.END, 330, 930, 1.5],
]
function camAt(k, t) {
  const i = CAM.findIndex((c) => c[0] > t)
  if (i < 0) return CAM.at(-1).slice(1)
  if (i === 0) return CAM[0].slice(1)
  const a = CAM[i - 1]
  const b = CAM[i]
  const p = k.ease.io2(k.clamp((t - a[0]) / Math.min(0.3, b[0] - a[0])))
  return [k.lerp(a[1], b[1], p), k.lerp(a[2], b[2], p), k.lerp(a[3], b[3], p)]
}

// Le live (le moment « filmé »), puis le replay raconté par le narrateur.
const SHOTS = [
    {
      // Le live de la remise : un seul plan, du sourire à « on coupe ! ».
      t1: K.REWIND,
      build(k, g) {
        const { svg, txt, bg, defs } = k
        bg(g, '#0a0a0c')
        // La scène filmée (tout ce qui bouge avec la caméra).
        const world = svg('g', {}, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 1700, fill: '#d8d2c4' }, world)
        for (let y = 0; y < 1300; y += 70) for (let x = (y / 70) % 2 ? -460 : -400; x < 1500; x += 120) svg('rect', { x, y, width: 116, height: 66, fill: '#ece8de', stroke: '#c9c2b2', 'stroke-width': 4 }, world)
        svg('rect', { x: -400, y: 1300, width: 1900, height: 1100, fill: '#7a7468' }, world)
        svg('rect', { x: 600, y: 1260, width: 520, height: 120, fill: '#c8a06a', stroke: '#8a6a40', 'stroke-width': 8 }, world)
        const gp = k.makePerson(world, GERARD)
        const m = k.makePerson(world, MAELYS)
        // L'enveloppe, puis les billets qui sortent un à un (12 × 500 €).
        const env = svg('g', {}, world)
        svg('rect', { x: -130, y: -80, width: 260, height: 160, rx: 10, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 6 }, env)
        const flap = svg('path', { d: 'M -130 -80 L 0 10 L 130 -80', fill: '#efe5d0', stroke: '#b8a888', 'stroke-width': 6 }, env)
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(0 30) scale(0.5)' }, env)
        const bills = Array.from({ length: 12 }, () => {
          const b = svg('g', { opacity: 0 }, world)
          svg('rect', { x: -95, y: -50, width: 190, height: 100, rx: 8, fill: '#c9a8d8', stroke: '#6a4a7a', 'stroke-width': 5 }, b)
          txt(b, '500', { y: 18, 'font-size': 48, fill: '#4a2a5a' })
          return b
        })
        const count = svg('g', { opacity: 0 }, world)
        svg('rect', { x: -170, y: -60, width: 340, height: 120, rx: 20, fill: '#10121a', opacity: 0.85 }, count)
        const countT = txt(count, '', { y: 26, 'font-size': 76, fill: '#ffffff' })
        const ring = svg('ellipse', { rx: 300, ry: 190, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': '46 24', opacity: 0 }, world)
        // L'objectif de la caméra : la main qui le couvre.
        const hand = svg('g', { opacity: 0 }, g)
        svg('ellipse', { cx: 540, cy: 1060, rx: 760, ry: 900, fill: '#e8b896' }, hand)
        svg('ellipse', { cx: 380, cy: 860, rx: 260, ry: 340, fill: '#f2c8a6', opacity: 0.6 }, hand)
        // L'interface du live (fixe, par-dessus la caméra).
        const ui = svg('g', {}, g)
        svg('circle', { cx: 105, cy: 120, r: 38, fill: '#ff9ab0', stroke: '#ffffff', 'stroke-width': 6 }, ui)
        txt(ui, '@maelys.lifestyle', { x: 165, y: 112, 'font-size': 38, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 6, 'paint-order': 'stroke fill' })
        const subs = txt(ui, '412 k abonnés', { x: 165, y: 152, 'font-size': 30, fill: '#ffffff', 'text-anchor': 'start', stroke: '#10121a', 'stroke-width': 5, 'paint-order': 'stroke fill' })
        svg('rect', { x: 760, y: 88, width: 120, height: 56, rx: 12, fill: '#fe2c55' }, ui)
        txt(ui, 'LIVE', { x: 820, y: 128, 'font-size': 36, fill: '#ffffff' })
        svg('rect', { x: 890, y: 88, width: 140, height: 56, rx: 12, fill: '#000', opacity: 0.5 }, ui)
        const views = txt(ui, '', { x: 960, y: 128, 'font-size': 34, fill: '#ffffff' })
        // Le widget épinglé de la cagnotte.
        const pin = svg('g', { transform: 'translate(540 260)' }, ui)
        const pinBox = svg('rect', { x: -330, y: -62, width: 660, height: 124, rx: 26, fill: '#ffffff', stroke: '#12a150', 'stroke-width': 6 }, pin)
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(-270 0) scale(0.7)' }, pin)
        txt(pin, 'CAGNOTTE POUR GÉRARD', { x: 20, y: -12, 'font-size': 34, fill: '#10121a' })
        txt(pin, '80 000 € récoltés', { x: 20, y: 36, 'font-size': 40, fill: '#12a150' })
        const hearts = Array.from({ length: 10 }, (_, i) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff9ab0', '#ffd166'][i % 3], opacity: 0 }, ui), d: i * 0.13, x: 940 + (i % 3) * 30 }))
        const msgs = [
          ['@lea.b', 'trop émouvant', '#ffffff'],
          ['@sam', 'la cagnotte c’est 80 000 €…', '#ffd166'],
          ['@kz', 'elle est bien fine l’enveloppe', '#ffd166'],
          ['@nono', 'attends… 6 000 ???', '#ff6b6b'],
          ['@jojo', 'IL Y A QUE 6 000 € !!!', '#ff6b6b'],
          ['@yanis', 'OÙ SONT LES 74 000 € ?', '#ff6b6b'],
          ['@inès', 'ARNAQUEUSE', '#ff6b6b'],
          ['@paul', 'j’ai donné 50 € pour ça', '#ffd166'],
          ['@mamie.jo', 'RENDS L’ARGENT', '#ff6b6b'],
        ].map(([w, m2, c]) => {
          const b = svg('g', { opacity: 0 }, ui)
          svg('rect', { x: 0, y: -40, width: 40 + 21 * (w.length + m2.length), height: 74, rx: 37, fill: c === '#ff6b6b' ? '#7a1018' : '#000', opacity: c === '#ffffff' ? 0.55 : 0.85 }, b)
          const t = txt(b, '', { x: 24, y: 12, 'font-size': 36, 'text-anchor': 'start' })
          svg('tspan', { fill: '#9fd0ff', 'font-weight': 900 }, t).textContent = `${w} `
          svg('tspan', { fill: c }, t).textContent = m2
          return b
        })
        // La fin du live.
        const endCard = svg('g', { opacity: 0 }, g)
        svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#0a0a0c' }, endCard)
        txt(endCard, 'Le LIVE est terminé', { x: 540, y: 900, 'font-size': 70, fill: '#ffffff' })
        txt(endCard, '@maelys.lifestyle', { x: 540, y: 990, 'font-size': 44, fill: '#9aa6b4' })
        void defs
        return { world, gp, m, env, flap, bills, count, countT, ring, hand, subs, views, pinBox, hearts, msgs, endCard }
      },
      draw(k, s, t) {
        // La caméra (tenue à la main : un léger tremblement permanent).
        const [cx, cy, z] = camAt(k, t)
        const jx = 6 * Math.sin(t * 7.3) + 3 * Math.sin(t * 17)
        const jy = 5 * Math.sin(t * 6.1 + 1)
        s.world.setAttribute('transform', `translate(${540 + jx} ${960 + jy}) scale(${z}) translate(${-cx} ${-cy})`)
        // Maëlys : face caméra, le bras tendu (le téléphone) ; elle tend l'enveloppe ; puis panique.
        const panic = t > T.PANIC
        const give = k.ease.out3(k.clamp((t - (T.GIVE - 0.2)) / 0.4)) * (1 - k.ease.io2(k.clamp((t - T.TAKE) / 0.3)))
        s.m.update(t, { x: 300, y: 1150, scale: 0.95, mouth: k.mouth(panic ? 'maelys2' : 'maelys', t), brows: panic ? 'surprised' : 'neutral', look: panic ? [0.6, 0.2] : [0, 0], armL: [2.5, 0.7], armR: [k.lerp(0.4, 1.3, give), k.lerp(1.0, 0.2, give)], headTilt: panic ? -0.1 : 0.12, seed: 2 })
        // Gérard : il prend l'enveloppe, l'ouvre, compte ; ému aux larmes.
        const holding = t > T.TAKE
        s.gp.update(t, { x: 840, y: 1060, scale: 0.92, mouth: k.mouth('gerard', t), brows: t > T.COUNT_END ? 'sad' : 'surprised', look: t > T.COUNT && t < T.COUNT_END ? [-0.4, 0.6] : [-0.3, 0.1], armR: [0.5, 1.5], armL: holding ? [0.9, 1.0] : [0.3, 0.6], tearT: t > T.COUNT_END ? t - T.COUNT_END : -1, headTilt: 0.08 * Math.sin(t * 2), seed: 4 })
        const ex = holding ? k.lerp(560, 620, k.ease.io2(k.clamp((t - T.TAKE) / 0.35))) : k.lerp(470, 560, give)
        const ey = holding ? 1240 : 1250
        k.place(s.env, ex, ey, 1, holding ? 4 : -6)
        s.flap.setAttribute('transform', t > T.OPEN ? 'translate(0 -80) scale(1 -1) translate(0 80)' : '')
        // Les billets : un par un, en éventail au-dessus de l'enveloppe.
        const n = Math.min(12, Math.max(0, Math.floor((t - T.COUNT) / ((T.COUNT_END - T.COUNT) / 12)) + 1))
        s.bills.forEach((b, i) => {
          const on = t > T.COUNT && i < n
          b.setAttribute('opacity', on ? 1 : 0)
          if (on) {
            const a = (i - 5.5) * 7
            b.setAttribute('transform', `translate(${ex} ${ey - 40}) rotate(${a}) translate(0 -140)`)
          }
        })
        s.count.setAttribute('opacity', t > T.COUNT ? 1 : 0)
        s.countT.textContent = `${(n * 500).toLocaleString('fr-FR')} €`
        s.countT.setAttribute('fill', t > T.COUNT_END ? '#ff6b6b' : '#ffffff')
        k.place(s.count, ex + 120, ey - 350, 1 + (t > T.COUNT_END ? 0.15 * Math.exp(-(t - T.COUNT_END) * 6) : 0), 0)
        s.ring.setAttribute('opacity', t > T.STICKER ? 1 : 0)
        s.ring.setAttribute('transform', `translate(${ex} ${ey - 90}) rotate(${t * 20})`)
        // La main sur l'objectif, puis la fin du live.
        const hv = k.ease.in2(k.clamp((t - T.HAND) / 0.6))
        s.hand.setAttribute('opacity', hv > 0 ? 1 : 0)
        s.hand.setAttribute('transform', `translate(${k.lerp(-700, 0, hv)} ${k.lerp(900, 0, hv)}) rotate(${k.lerp(-25, 0, hv)} 540 960)`)
        s.endCard.setAttribute('opacity', t > T.END ? 1 : 0)
        // L'interface : spectateurs, cœurs, widget, commentaires, abonnés.
        s.views.textContent = `${(12.4 + t * 0.9 + (t > T.CHAT ? (t - T.CHAT) * 6 : 0)).toFixed(1).replace('.', ',')} k`
        s.pinBox.setAttribute('stroke', t > T.STICKER && Math.floor(t * 6) % 2 ? '#e5484d' : '#12a150')
        s.pinBox.setAttribute('stroke-width', t > T.STICKER ? 14 : 6)
        for (const h of s.hearts) {
          const u = ((t + h.d) % 1.3) / 1.3
          h.el.setAttribute('opacity', t < T.CHAT ? (Math.sin(Math.PI * u) * 0.9).toFixed(2) : 0)
          k.place(h.el, h.x + 20 * Math.sin(u * 8 + h.d * 9), 1300 - u * 500, 0.7, 0)
        }
        const times = [0.6, T.GIVE + 0.1, T.TAKE + 0.1, T.COUNT + 0.6, T.COUNT_END - 0.15, T.COUNT_END + 0.4, T.CHAT + 0.3, T.STICKER + 0.2, T.STICKER + 0.6]
        const shown = times.filter((a) => t >= a).length
        s.msgs.forEach((b, i) => {
          const a = times[i]
          const row = shown - 1 - i
          b.setAttribute('opacity', t >= a && row < 4 ? (1 - row * 0.12).toFixed(2) : 0)
          if (t >= a) k.place(b, 30, k.lerp(880, 700, k.ease.io2(k.clamp((t - T.STICKER) / 0.3))) - row * 82 + 30 * Math.exp(-(t - a) * 18), 0.98 + 0.15 * Math.exp(-(t - a) * 10), 0)
        })
        s.subs.textContent = `${Math.max(380, Math.round(412 - Math.max(0, t - T.STICKER) * 12))} k abonnés`
        s.subs.setAttribute('fill', t > T.STICKER ? '#ff6b6b' : '#ffffff')
      },
    },
    {
      // C1 · Le replay : Maëlys sous son anneau lumineux, 412 000 abonnés.
      t1: K.GERARD_R,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#f6e2ea')
        svg('circle', { cx: 540, cy: 760, r: 420, fill: 'none', stroke: '#ffffff', 'stroke-width': 60 }, g)
        svg('circle', { cx: 540, cy: 760, r: 420, fill: 'none', stroke: '#ffe7f0', 'stroke-width': 20 }, g)
        svg('circle', { cx: 540, cy: 760, r: 470, fill: '#fff6fa', opacity: 0.35 }, g)
        const m = k.makePerson(g, MAELYS)
        return { m }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1180, scale: 1.2 + 0.04 * l, mouth: 0.3 + 0.2 * Math.abs(Math.sin(t * 7)), brows: 'neutral', look: [0, 0], armR: [2.6, 0.4], armL: [0.3, 0.5], headTilt: 0.12 * Math.sin(t * 1.5), seed: 2 })
      },
    },
    {
      // C2 · Gérard, 61 ans, sur son carton.
      t1: K.EIGHTY,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#d8d2c4')
        for (let y = 0; y < 1300; y += 70) for (let x = (y / 70) % 2 ? -60 : 0; x < 1100; x += 120) svg('rect', { x, y, width: 116, height: 66, fill: '#ece8de', stroke: '#c9c2b2', 'stroke-width': 4 }, g)
        svg('rect', { x: -400, y: 1300, width: 1900, height: 900, fill: '#7a7468' }, g)
        svg('rect', { x: 120, y: 1240, width: 840, height: 130, fill: '#c8a06a', stroke: '#8a6a40', 'stroke-width': 8 }, g)
        const gp = k.makePerson(g, GERARD)
        const cup = svg('g', { transform: 'translate(860 1300)' }, g)
        svg('path', { d: 'M -50 -60 L 50 -60 L 38 60 L -38 60 Z', fill: '#ffffff', stroke: '#9aa6b4', 'stroke-width': 6 }, cup)
        return { gp }
      },
      draw(k, s, t, l) {
        s.gp.update(t, { x: 520, y: 1180, scale: 1.0 + 0.05 * l, mouth: 0, brows: 'sad', look: [0.2, 0.4], armR: [0.3, 1.4], armL: [0.3, 1.4], headTilt: 0.15, seed: 4 })
      },
    },
    {
      // S6 · La cagnotte s'emballe : compteur à rouleaux, fil des dons, objectif pulvérisé.
      t1: K.SIX,
      build(k, g) {
        const { svg, txt, bg, speedLines, burst, defs } = k
        bg(g, '#0b2a1a')
        const lines = speedLines(g, 60, '#0f3a24')
        txt(g, 'CAGNOTTE POUR GÉRARD', { x: 540, y: 250, 'font-size': 62, fill: '#ffffff' })
        svg('path', { d: heartD, fill: '#fe2c55', transform: 'translate(540 330) scale(1.1)' }, g)
        // Le compteur à rouleaux : 5 chiffres, chacun une bande 0-9 qui défile.
        const cnt = svg('g', { transform: 'translate(540 640)' }, g)
        svg('rect', { x: -470, y: -150, width: 940, height: 300, rx: 40, fill: '#06180e', stroke: '#12e070', 'stroke-width': 10 }, cnt)
        const clip = svg('clipPath', { id: 'odo' }, defs)
        svg('rect', { x: -450, y: -130, width: 900, height: 260 }, clip)
        const reel = svg('g', { 'clip-path': 'url(#odo)' }, cnt)
        const xs = [-380, -255, -55, 70, 195]
        const strips = xs.map((x, p) => {
          const st = svg('g', {}, reel)
          for (let d = 0; d <= 10; d++) txt(st, String(d % 10), { x, y: 68 + d * 230, 'font-size': 200, fill: '#12e070' })
          return { st, pow: 10 ** (4 - p) }
        })
        txt(cnt, '€', { x: 345, y: 68, 'font-size': 180, fill: '#12e070' })
        svg('rect', { x: -470, y: -150, width: 940, height: 70, fill: '#06180e', opacity: 0.6 }, cnt)
        svg('rect', { x: -470, y: 80, width: 940, height: 70, fill: '#06180e', opacity: 0.6 }, cnt)
        // L'objectif : 5 000 €. La barre déborde.
        txt(g, 'OBJECTIF : 5 000 €', { x: 120, y: 900, 'font-size': 44, fill: '#9fe0b0', 'text-anchor': 'start' })
        svg('rect', { x: 120, y: 930, width: 840, height: 50, rx: 25, fill: '#173a26' }, g)
        const bar = svg('rect', { x: 120, y: 930, width: 0, height: 50, rx: 25, fill: '#12e070' }, g)
        const pct = txt(g, '', { x: 960, y: 900, 'font-size': 56, fill: '#ffd166', 'text-anchor': 'end' })
        // Le fil des dons.
        const names = ['Sarah · 20 €', 'Anonyme · 100 €', 'Yanis · 50 €', 'Mamie Jo · 10 €', 'Théo · 5 €', 'Inès · 200 €', 'Anonyme · 50 €', 'Karim · 30 €', 'Lucie · 20 €', 'Anonyme · 500 €', 'Max · 15 €', 'Nadia · 40 €', 'Paul · 100 €', 'Anonyme · 20 €']
        const feed = names.map((n, i) => {
          const c = svg('g', { opacity: 0 }, g)
          svg('rect', { x: 0, y: -42, width: 560, height: 84, rx: 42, fill: '#ffffff' }, c)
          svg('circle', { cx: 42, cy: 0, r: 26, fill: ['#fe2c55', '#3b82f6', '#ffd166', '#12a150'][i % 4] }, c)
          txt(c, n, { x: 86, y: 14, 'font-size': 40, fill: '#10121a', 'text-anchor': 'start' })
          return c
        })
        const marks = [['10 000 € !', 0.3], ['50 000 € !', 0.68], ['80 000 € !', 1.0]].map(([m, at]) => ({ b: burst(g, m, { fill: '#ffd166', ink: '#0b2a1a', size: 84, r: 240 }), at }))
        return { lines, strips, bar, pct, feed, marks }
      },
      draw(k, s, t, l) {
        const D = 1.6
        const u = k.clamp(l / D)
        const v = 80000 * (u < 1 ? (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1) : 1)
        s.lines.setAttribute('transform', `translate(540 640) rotate(${t * 60})`)
        s.lines.setAttribute('opacity', (0.4 + 0.6 * u).toFixed(2))
        for (const st of s.strips) {
          const d = st.pow === 1 ? (v / st.pow) % 10 : Math.floor(v / st.pow) % 10 + Math.max(0, ((v % st.pow) / st.pow - 0.85) / 0.15)
          st.st.setAttribute('transform', `translate(0 ${(-d * 230).toFixed(1)})`)
        }
        s.bar.setAttribute('width', (840 * Math.min(1, v / 5000)).toFixed(0))
        s.bar.setAttribute('fill', v > 5000 ? (Math.floor(t * 12) % 2 ? '#ffd166' : '#12e070') : '#12e070')
        s.pct.textContent = `${Math.round((v / 5000) * 100).toLocaleString('fr-FR')} %`
        // Le fil : le don le plus récent arrive en bas et pousse les autres vers le haut.
        const shown = s.feed.filter((_, i) => l >= i * (D / s.feed.length)).length
        s.feed.forEach((c, i) => {
          const a = i * (D / s.feed.length)
          const q = l - a
          const row = shown - 1 - i
          c.setAttribute('opacity', q > 0 && row < 2 ? (1 - row * 0.17).toFixed(2) : 0)
          if (q > 0) k.place(c, 260, 1760 - row * 96 + 40 * Math.exp(-q * 20), 1, 0)
        })
        const t0 = t - l
        for (const m of s.marks) k.burstAt(m.b, t, t0 + m.at * D, m.at < 1 ? t0 + m.at * D + 0.3 : K.SIX, 540 + (m.at < 1 ? (m.at < 0.5 ? -200 : 200) : 0), 1130, m.at < 0.5 ? -10 : 8, m.at < 1 ? 0.7 : 0.95)
      },
    },
    {
      // C4 · 6 000 €. En liquide : douze billets de 500 qui tombent dans l'enveloppe.
      t1: K.HEART,
      build(k, g) {
        const { svg, txt, bg } = k
        bg(g, '#2a2e36')
        svg('ellipse', { cx: 540, cy: 1100, rx: 600, ry: 500, fill: 'url(#lampG)', opacity: 0.4 }, g)
        const env = svg('g', { transform: 'translate(540 1150)' }, g)
        svg('rect', { x: -300, y: -180, width: 600, height: 360, rx: 20, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 10 }, env)
        const bills = Array.from({ length: 12 }, () => {
          const b = svg('g', { opacity: 0 }, g)
          svg('rect', { x: -150, y: -78, width: 300, height: 156, rx: 10, fill: '#c9a8d8', stroke: '#6a4a7a', 'stroke-width': 6 }, b)
          txt(b, '500', { y: 28, 'font-size': 76, fill: '#4a2a5a' })
          return b
        })
        svg('path', { d: 'M -300 -180 L 0 20 L 300 -180', fill: '#efe5d0', stroke: '#b8a888', 'stroke-width': 8, transform: 'translate(540 1150)' }, g)
        return { bills }
      },
      draw(k, s, t, l) {
        s.bills.forEach((b, i) => {
          const a = i * 0.11
          const u = k.clamp((l - a) / 0.28)
          b.setAttribute('opacity', l > a && u < 1 ? 1 : 0)
          k.place(b, 540 + 40 * Math.sin(i * 2.1), k.lerp(200, 1100, k.ease.in2(u)), 1, (i % 2 ? 1 : -1) * (12 - 10 * u))
        })
      },
    },
    {
      // C5 · L'enveloppe avec un cœur, qui bat.
      t1: K.TODAY,
      build(k, g) {
        const { svg, bg } = k
        bg(g, '#1a0f14')
        const env = svg('g', {}, g)
        svg('rect', { x: -380, y: -230, width: 760, height: 460, rx: 24, fill: '#f2ead8', stroke: '#b8a888', 'stroke-width': 12 }, env)
        svg('path', { d: 'M -380 -230 L 0 40 L 380 -230', fill: 'none', stroke: '#b8a888', 'stroke-width': 10 }, env)
        const h = svg('path', { d: heartD, fill: '#fe2c55' }, env)
        return { env, h }
      },
      draw(k, s, t, l) {
        k.place(s.env, 540, 1000, 1 + 0.03 * l, -3)
        const beat = 1 + 0.25 * Math.max(0, Math.sin(t * 7)) ** 6
        s.h.setAttribute('transform', `translate(0 60) scale(${(2.4 * beat).toFixed(3)})`)
      },
    },
    {
      // E · Maëlys sous le projecteur ; le marteau.
      t1: SEC_HOOK_END,
      build(k, g) {
        const { svg, bg } = k
        bg(g, 'url(#judgeBg)')
        svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 800, fill: 'url(#spot)' }, g)
        const m = k.makePerson(g, MAELYS)
        const fl = svg('rect', { x: -400, y: -400, width: 1900, height: 2700, fill: '#ffffff', opacity: 0 }, g)
        const gavel = svg('g', {}, g)
        svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
        svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
        for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
        return { m, fl, gavel }
      },
      draw(k, s, t, l) {
        s.m.update(t, { x: 540, y: 1080, scale: 1.15, brows: 'sad', look: [0, 0.2], armR: [0.2, 0.4], armL: [0.2, 0.4], seed: 2 })
        s.fl.setAttribute('opacity', (0.7 * Math.exp(-l * 8)).toFixed(3))
        const g = k.ease.in3(k.clamp((t - (K.GAVEL - 0.35)) / 0.35))
        const after = t - K.GAVEL
        k.show(s.gavel, t > K.GAVEL - 0.4)
        s.gavel.setAttribute('transform', `translate(${k.lerp(1000, 720, g)} ${k.lerp(200, 640, g)}) rotate(${k.lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
      },
    },
]

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#020306')
  let t0 = 0
  for (const s of SHOTS) {
    s.t0 = t0
    t0 = s.t1
    s.wrap = svg('g', { display: 'none' }, L.actor)
    s.g = svg('g', {}, s.wrap)
    s.st = s.build(kit, s.g) ?? {}
  }
  comicFrame(L.hud)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { rwBands }
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
  // 04 : la nuit, une enfant seule.
  const alone = prop((g) => {
    panel(g, 620, 420, '#9fd0ff')
    svg('rect', { x: -300, y: -200, width: 600, height: 400, rx: 20, fill: '#05070f' }, g)
    svg('circle', { cx: 200, cy: -110, r: 50, fill: '#f2f2d8' }, g)
    svg('circle', { cx: 222, cy: -126, r: 46, fill: '#05070f' }, g)
    svg('ellipse', { cx: -40, cy: 60, rx: 180, ry: 150, fill: 'url(#lampG)' }, g)
    svg('rect', { x: -46, y: -60, width: 10, height: 200, fill: '#5a5f70' }, g)
    svg('circle', { cx: 30, cy: 70, r: 16, fill: '#ff7aa8' }, g)
    svg('path', { d: 'M 18 86 L 42 86 L 48 140 L 12 140 Z', fill: '#ff7aa8' }, g)
  })
  // 06 : la balance, un crachat contre une jambe cassée.
  const scale = prop((g) => {
    panel(g, 760, 420)
    g.beam = svg('g', {}, g)
    svg('rect', { x: -280, y: -10, width: 560, height: 20, rx: 10, fill: '#d9a930' }, g.beam)
    for (const sd of [-1, 1]) {
      svg('path', { d: `M ${sd * 260} 0 L ${sd * 260 - 90} 110 M ${sd * 260} 0 L ${sd * 260 + 90} 110`, stroke: '#d9a930', 'stroke-width': 6 }, g.beam)
      svg('path', { d: `M ${sd * 260 - 110} 110 Q ${sd * 260} 170 ${sd * 260 + 110} 110 Z`, fill: '#d9a930' }, g.beam)
    }
    svg('path', { d: 'M -260 50 C -240 80 -230 95 -230 110 A 30 30 0 0 1 -290 110 C -290 95 -280 80 -260 50 Z', fill: '#cfe8ff', stroke: '#4a7aa0', 'stroke-width': 4 }, g.beam)
    txt(g.beam, 'UNE MAIN', { x: -260, y: 160, 'font-size': 26, fill: '#ffffff' })
    const leg = svg('g', { transform: 'translate(260 70) rotate(-8)' }, g.beam)
    svg('rect', { x: -70, y: -20, width: 140, height: 50, rx: 24, fill: '#ffffff', stroke: '#9aa6b8', 'stroke-width': 4 }, leg)
    txt(g.beam, 'UN CRÂNE', { x: 260, y: 160, 'font-size': 26, fill: '#ffffff' })
    svg('rect', { x: -8, y: 0, width: 16, height: 180, fill: '#d9a930' }, g)
    svg('path', { d: 'M -60 190 L 60 190 L 40 170 L -40 170 Z', fill: '#d9a930' }, g)
  })
  // 09 : les options qu'il avait.
  const options = prop((g) => {
    panel(g, 780, 520)
    g.items = ['18 MOIS DE LOYER', 'UN DENTISTE', 'UNE FORMATION', 'REÇUS : 9 000 €'].map((s, k) => {
      const it = svg('g', { transform: `translate(-330 ${-170 + k * 110})` }, g)
      const bad = k === 3
      svg('rect', { x: 0, y: -40, width: 660, height: 80, rx: 16, fill: bad ? '#e5484d' : '#1f2a3a' }, it)
      txt(it, bad ? '✕' : '✓', { x: 46, y: 18, 'font-size': 52, fill: bad ? '#ffffff' : '#12e070' })
      const l = txt(it, s, { x: 100, y: 16, 'font-size': 40, fill: '#ffffff' })
      l.setAttribute('text-anchor', 'start')
      return it
    })
  })
  // 11 : la nuit « trop noire ».
  const moon = prop((g) => {
    svg('circle', { r: 170, fill: '#f2f2d8' }, g)
    svg('circle', { cx: 60, cy: -40, r: 160, fill: '#10121a' }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, alone, scale, options, moon }
})

// ------------------------------------------------- 3 · Le vote : le contrôleur face à Manon (béquille)
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const ag = makePerson(L.actor, MAELYS)
  const manon = makePerson(L.actor, GERARD)
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { ag, manon }
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
// Le hook (replay).
fs(tag('MAËLYS · 23 ANS', 'pill yellow', { t0: K.REPLAY, t1: K.GERARD_R - 0.06, y: 300, rot: -2 }), 60)
counterTag(Wd('02', '412') - 0.12, K.GERARD_R - 0.06, 412000, 'ABONNÉS', { y: 560, dur: 0.7, fmt: fr })
fs(tag('GÉRARD · 61 ANS · SANS-ABRI', 'pill', { t0: K.GERARD_R, t1: K.EIGHTY - 0.06, y: 300, rot: 2 }), 52)
fs(tag('EN 3 JOURS', 'slam white', { t0: K.EIGHTY, t1: K.SIX - 0.06, y: 425, rot: -3, from: 2.4, dur: 0.18 }), 90)
fs(tag('6 000 €. EN LIQUIDE.', 'slam yellow', { t0: Wd('03', 'en') - 0.1, t1: K.HEART - 0.06, y: 330, rot: -3, from: 2.6, dur: 0.18 }), 70)
fs(tag('ABUS DE CONFIANCE', 'pill red', { t0: Wd('03', 'abus') - 0.12, t1: SEC.hook.t1, y: 1560, rot: -2 }), 60)
fs(tag('JUGÉE.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1 - 0.25, y: 400, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('6 000 € SUR 80 000 €', 'slam white', { t0: S('04') + 0.3, t1: Wd('04', 'moi') - 0.1, y: 300, rot: -3, from: 2.4, dur: 0.18 }), 84)
fs(tag('« UNE COMMISSION. »', 'slam yellow', { t0: Wd('04', 'commission') - 0.15, t1: E('04') + 0.15, y: 330, rot: -4, from: 2.8, dur: 0.18 }), 100)
fs(tag('« IL A REÇU UNE VIE. »', 'slam white', { t0: Wd('05', 'il', 1) - 0.1, t1: E('05') + 0.15, y: 1560, rot: -3, from: 2.4, dur: 0.18 }), 76)
counterTag(Wd('06', 'soixante') - 0.15, Wd('06', 'et') - 0.1, 65000, 'EUROS MANQUANTS', { y: 300, dur: 0.5, fmt: fr })
fs(tag('UNE VOITURE NEUVE.', 'slam yellow', { t0: Wd('06', 'et') - 0.1, t1: E('06') + 0.15, y: 330, rot: -4, from: 2.8, dur: 0.18 }), 96)
fs(tag('« PLUS EN UNE STORY<br>QUE VOUS EN UN MOIS »', 'slam white', { t0: Wd('07', 'elle') - 0.1, t1: E('07') - 0.2, y: 330, rot: -4, from: 2.8, dur: 0.15 }), 62)
fs(tag('BIENFAITRICE MALADROITE<br>OU ARNAQUEUSE ?', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.15, y: 470, from: 1.4, dur: 0.3 }), 70)
fs(tag('ICI, C’EST TOI QUI JUGES', 'pill yellow', { t0: Wd('08', 'ici') - 0.1, t1: E('08') + 0.15, y: 760, rot: -2 }), 56)
const like1 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.15, y: 960, from: 2.2, dur: 0.25 }), 84)
const arrow1 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('08', 'pour') - 0.05, t1: E('08') + 0.15, y: 1130 }), 44)
counterTag(S('09') - 0.05, Wd('09', 'pas') - 0.1, 6412, 'DONATEURS', { y: 300, dur: 0.6, fmt: fr })
fs(tag('PAS POUR VOS FRAIS DE GESTION', 'pill red', { t0: Wd('09', 'pas') - 0.1, t1: E('09') + 0.15, y: 300, rot: -2 }), 46)
fs(tag('ZÉRO.', 'slam yellow', { t0: Wd('10', 'zero') - 0.1, t1: Wd('10', 'ceux') - 0.08, y: 380, rot: -4, from: 2.8, dur: 0.15 }), 190)
fs(tag('« ILS PASSAIENT SANS LE REGARDER »', 'pill', { t0: Wd('10', 'ceux') - 0.08, t1: E('10') + 0.1, y: 300, rot: -2 }), 40)
fs(tag('ELLE A ENCAISSÉ POUR ELLE.', 'slam white', { t0: Wd('11', 'elle', 1) - 0.1, t1: E('11') + 0.1, y: 330, rot: -3, from: 2.6, dur: 0.18 }), 72)
fs(tag('IL NE PORTE PAS PLAINTE.', 'slam yellow', { t0: Wd('12', 'ne') - 0.1, t1: E('12') + 0.3, y: 420, rot: -4, from: 2.6, dur: 0.18 }), 76)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('13') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('13', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('13', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('13', 'ecris') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('13', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
const arrow2 = fs(tag('TOUCHE LE + SUR MA PHOTO<svg viewBox="0 0 120 80" width="84" height="56" style="vertical-align:middle;margin-left:18px"><path d="M8 40 H88 M62 14 L98 40 L62 66" fill="none" stroke="#ffd166" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>', 'pill', { t0: Wd('13', 'prochain') - 0.1, y: 1285 }), 42)
for (const a of [arrow1, arrow2]) a.update = (t) => (a.x = 540 + 14 * Math.max(0, Math.sin((t - a.t0) * 7)))
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', maelys: 'MAËLYS · EN DIRECT', maelys2: 'MAËLYS · EN DIRECT', gerard: 'GÉRARD' }

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
CHUNKS.sort((x, y) => x.t0 - y.t0)
CHUNKS.forEach((c, i) => {
  if (CHUNKS[i + 1]) c.t1 = Math.min(c.t1, CHUNKS[i + 1].t0)
})
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
  [K.OPEN, 8],
  [K.CHAT, 10],
  [K.STICKER, 14],
  [K.HAND, 18],
  [K.REPLAY, 10],
  [K.GERARD_R, 8],
  [K.EIGHTY, 10],
  [K.SIX, 12],
  [K.HEART, 8],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'commission') - 0.15, 10],
  [Wd('06', 'et') - 0.1, 12],
  [Wd('12', 'ne') - 0.1, 12],
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

const pad2 = (n) => String(Math.floor(n)).padStart(2, '0')

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    // Une case = une action : coupe sèche, petit coup de zoom à l'entrée.
    const sh = SHOTS.find((x) => t < x.t1) ?? SHOTS.at(-1)
    for (const x of SHOTS) show(x.wrap, x === sh)
    const k = t - sh.t0
    const cutK = Math.exp(-k * 18)
    const [hx, hy] = shakeAt(t, 0)
    sh.wrap.setAttribute('transform', `translate(${540 + hx + 14 * cutK * Math.sin(t * 90)} ${960 + hy}) scale(${1 + 0.08 * cutK}) translate(-540 -960)`)
    sh.draw(kit, sh.st, t, k)
    const rw = t >= K.REWIND && t < K.REPLAY
    HOOK.rwBands.forEach((b, i) => {
      const r = rng(Math.floor(t * 30) + i)
      b.setAttribute('y', r() * H)
      b.setAttribute('height', 10 + r() * 40)
      b.setAttribute('opacity', rw ? 0.3 : 0)
    })
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
    if (prop(TRIB.options, S('05') - 0.05, Wd('06', 'il') - 0.1, 540, 700, 0.85) > 0) TRIB.options.items.forEach((it, k) => it.setAttribute('opacity', t > [Wd('05', 'dixhuit'), Wd('05', 'un'), Wd('05', 'une'), Wd('06', 'neuf')][k] - 0.2 ? 1 : 0))
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.ag.update(t, { x: 270, y: 1480, scale: 0.92, brows: 'neutral', look: [0.3, 0], armR: [0.8, 2.0], armL: [0.8, 2.0], seed: 3.1 })
    VOTE.manon.update(t, { x: 800, y: 1460, scale: 0.88, brows: 'sad', look: [-0.3, 0.1], armR: [0.4, 0.3], armL: [0.1, 0.5], seed: 0.7 })
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
