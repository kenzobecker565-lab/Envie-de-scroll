/**
 * Prototype A — motion design 2D (vectoriel) : aplats, ombres douces, parallaxe,
 * transitions en formes, électrocardiogramme qui se dessine, mots qui claquent.
 */

import { E, H, S, T, W, WINDOW, clamp, ease, lerp, makeCaptions, makeGrain, mouthOf, prog, register, rng, shaker, speaking, svg } from '../commun.js'
import { makePerson } from './personnage.js'

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('wall1', [[0, '#27305a'], [1, '#141a36']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('beam', [[0, '#ffe7b0', 0.5], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('wall2', [[0, '#123a44'], [1, '#08151c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spot', [[0, '#7fd6ff', 0.35], [1, '#7fd6ff', 0]], { cx: 0.5, cy: 0.4, r: 0.5 })
grad('wall3', [[0, '#5a2a1a'], [1, '#1e0d08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.55]], { cx: 0.5, cy: 0.45, r: 0.75 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })

// ------------------------------------------------------------------ les plans

const shots = []
function shot(t0, t1, build) {
  const g = svg('g', {}, root)
  const layers = {
    far: svg('g', {}, g),
    mid: svg('g', {}, g),
    actor: svg('g', {}, g),
    front: svg('g', {}, g),
    fx: svg('g', {}, g),
  }
  const s = { t0, t1, g, layers, ...build(layers) }
  shots.push(s)
  return s
}

// Plan 1 : le procureur, devant la grande fenêtre du tribunal.
const P1 = shot(WINDOW[0] - 1, T.hopital - 0.12, (L) => {
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#wall1)' }, L.far)
  // Fenêtre en arc et rai de lumière.
  svg('path', { d: 'M 640 260 L 640 760 L 960 760 L 960 260 A 160 160 0 0 0 640 260 Z', fill: '#3b4a86' }, L.far)
  svg('path', { d: 'M 800 160 L 800 760 M 640 470 L 960 470', stroke: '#27305a', 'stroke-width': 18 }, L.far)
  svg('path', { d: 'M 640 300 L 960 300 L 700 1900 L -200 1900 Z', fill: 'url(#beam)', opacity: 0.55 }, L.far)
  // Lambris.
  for (let i = 0; i < 9; i++) svg('rect', { x: -200 + i * 180, y: 900, width: 150, height: 1100, rx: 12, fill: '#1a2147', opacity: 0.9 }, L.mid)
  svg('rect', { x: -300, y: 860, width: W + 600, height: 40, fill: '#0f1430' }, L.mid)
  // Poussière en suspension dans la lumière.
  const dust = []
  const r = rng(5)
  for (let i = 0; i < 40; i++) dust.push({ el: svg('circle', { r: 2 + r() * 4, fill: '#ffe7b0', opacity: 0.5 }, L.far), x: r() * W, y: r() * H, k: r() })
  // Bureau au premier plan.
  svg('rect', { x: -200, y: 1790, width: W + 400, height: 400, fill: 'url(#desk)' }, L.front)
  svg('rect', { x: -200, y: 1780, width: W + 400, height: 26, rx: 10, fill: '#b07a52' }, L.front)
  svg('rect', { x: 120, y: 1640, width: 260, height: 60, rx: 6, fill: '#f3ead8', transform: 'rotate(-4 250 1670)' }, L.front)
  const actor = makePerson(L.actor, { robe: '#c43a2f', hair: 'slick', hairColor: '#2a1a12', skin: '#f2c4a0' })
  return { actor, dust }
})

// Plan 2 : l'accusée, seule sous le projecteur ; l'électrocardiogramme s'emballe.
const P2 = shot(T.hopital - 0.12, S('17') - 0.08, (L) => {
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#wall2)' }, L.far)
  svg('ellipse', { cx: 540, cy: 900, rx: 700, ry: 900, fill: 'url(#spot)' }, L.far)
  for (let i = 0; i < 7; i++) svg('rect', { x: 40 + i * 170, y: 380, width: 10, height: 1500, fill: '#9fe0ff', opacity: 0.12 }, L.mid)
  svg('rect', { x: -100, y: 1640, width: W + 200, height: 400, fill: '#0b2229' }, L.front)
  svg('rect', { x: -100, y: 1630, width: W + 200, height: 18, fill: '#2b6b78' }, L.front)
  const actor = makePerson(L.actor, { robe: '#2aa198', jabot: false, hair: 'bun', hairColor: '#4a2a18', skin: '#f6d0ae', female: true, collar: '#1f7f78', iris: '#4c6b3a' })
  // Électrocardiogramme.
  const ecgG = svg('g', {}, L.fx)
  const pts = []
  for (let x = 0; x <= W; x += 6) {
    const p = (x % 360) / 360
    let y = 0
    if (p > 0.42 && p < 0.46) y = -40 * Math.sin(((p - 0.42) / 0.04) * Math.PI)
    if (p > 0.5 && p < 0.53) y = 30 * ((p - 0.5) / 0.03)
    if (p > 0.53 && p < 0.57) y = 30 - 230 * ((p - 0.53) / 0.04)
    if (p > 0.57 && p < 0.61) y = -200 + 260 * ((p - 0.57) / 0.04)
    if (p > 0.61 && p < 0.64) y = 60 - 60 * ((p - 0.61) / 0.03)
    if (p > 0.72 && p < 0.8) y = -50 * Math.sin(((p - 0.72) / 0.08) * Math.PI)
    pts.push(`${x},${560 + y}`)
  }
  const ecgGlow = svg('polyline', { points: pts.join(' '), fill: 'none', stroke: '#ff4d5e', 'stroke-width': 26, opacity: 0.25, 'stroke-linejoin': 'round' }, ecgG)
  const ecg = svg('polyline', { points: pts.join(' '), fill: 'none', stroke: '#ff6b78', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, ecgG)
  const len = ecg.getTotalLength?.() ?? 3000
  for (const e of [ecg, ecgGlow]) {
    e.setAttribute('stroke-dasharray', len)
    e.setAttribute('stroke-dashoffset', len)
  }
  return { actor, ecg, ecgGlow, len }
})

// Plan 3 : l'avocat contre-attaque.
const P3 = shot(S('17') - 0.08, WINDOW[1] + 1, (L) => {
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#wall3)' }, L.far)
  const r = rng(9)
  for (let i = 0; i < 16; i++) svg('circle', { cx: r() * W, cy: 200 + r() * 1100, r: 30 + r() * 90, fill: '#ffb36b', opacity: 0.06 + r() * 0.08 }, L.far)
  // Bancs du public (silhouettes).
  for (let i = 0; i < 6; i++) svg('circle', { cx: 60 + i * 200, cy: 1180, r: 70, fill: '#2a120a' }, L.mid)
  svg('rect', { x: -100, y: 1200, width: W + 200, height: 300, fill: '#2a120a' }, L.mid)
  const desk = svg('g', {}, L.front)
  svg('rect', { x: -200, y: 1700, width: W + 400, height: 400, fill: 'url(#desk)' }, desk)
  svg('rect', { x: -200, y: 1690, width: W + 400, height: 26, rx: 10, fill: '#b07a52' }, desk)
  const papers = [svg('rect', { x: 640, y: 1640, width: 240, height: 56, rx: 6, fill: '#f3ead8' }, desk), svg('rect', { x: 180, y: 1648, width: 200, height: 48, rx: 6, fill: '#e9dcc2' }, desk)]
  const actor = makePerson(L.actor, { robe: '#23262f', hair: 'short', hairColor: '#15100c', skin: '#b97f58', beard: true, iris: '#2b1b10' })
  // Éclat de l'impact.
  const burst = svg('g', { opacity: 0 }, L.fx)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    svg('path', { d: `M ${Math.cos(a) * 90} ${Math.sin(a) * 90} L ${Math.cos(a) * 220} ${Math.sin(a) * 220}`, stroke: '#ffd166', 'stroke-width': 16, 'stroke-linecap': 'round' }, burst)
  }
  return { actor, desk, papers, burst }
})

// Transitions : un disque rouge qui avale l'image, puis une bande diagonale.
const fxTop = svg('g', {}, root)
const iris = svg('circle', { cx: 1000, cy: 700, r: 0, fill: '#e5484d' }, fxTop)
const band = svg('rect', { x: -1500, y: -400, width: 900, height: 3200, fill: '#ffd166', transform: 'rotate(18)' }, fxTop)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vignette)', 'pointer-events': 'none' }, root)

// --------------------------------------------------------------- les textes

const ui = document.getElementById('ui')
const tag = (html, cls) => {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  ui.append(el)
  return el
}
const tHop = tag('<span class="cross">+</span> À L’HÔPITAL', 'stamp')
const tChoisi = tag('IL A CHOISI', 'slam white')
const tFrapper = tag('DE FRAPPER', 'slam red')
const meter = document.createElement('div')
meter.className = 'meter'
meter.innerHTML = '<span>COUPABLE</span><div class="bar"><div class="needle"></div></div><span>NON COUPABLE</span>'
ui.append(meter)
const needle = meter.querySelector('.needle')
const who = tag('', 'who')
const captions = makeCaptions(ui, { y: 1530 })
const grain = makeGrain(stage, { alpha: 16 })
const shake = shaker([
  [T.hopital - 0.02, 16],
  [T.frapper, 26],
])
const popIn = (el, t, t0, t1, { x = 540, y = 400, rot = 0, from = 2.2 } = {}) => {
  const a = prog(t, t0, 0.22, ease.back(2.4))
  const b = t1 ? 1 - prog(t, t1, 0.2, ease.in3) : 1
  const s = a * b
  el.style.opacity = s > 0.01 ? 1 : 0
  const k = lerp(from, 1, a) * (0.6 + 0.4 * b)
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot}deg) scale(${k.toFixed(3)})`
}

// ---------------------------------------------------------------- l'image à t

function seek(t) {
  const [sx, sy, sr] = shake(t)
  for (const s of shots) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cam = (s, { zoom = 1, cx = 540, cy = 900, push = 0.02 }) => {
    const z = zoom * (1 + push * (t - s.t0))
    const par = (k) => `translate(${540 + sx * k} ${cy + sy * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
    s.layers.far.setAttribute('transform', par(0.4))
    s.layers.mid.setAttribute('transform', par(0.7))
    s.layers.actor.setAttribute('transform', `${par(1)} rotate(${sr * 57})`)
    s.layers.front.setAttribute('transform', par(1.3))
    s.layers.fx.setAttribute('transform', par(1))
  }

  // Plan 1.
  if (t < P1.t1) {
    const punch = prog(t, T.fini - 0.15, 0.25, ease.out3)
    cam(P1, { zoom: lerp(1, 1.32, punch), cx: lerp(540, 600, punch), cy: lerp(1000, 820, punch), push: 0.03 })
    const pointing = prog(t, T.fini - 0.3, 0.28, ease.back(1.6))
    P1.actor.update(t, {
      x: 540,
      y: 1130,
      scale: 1.4,
      mouth: mouthOf('procureur', t),
      brows: t > T.fini - 0.5 ? 'angry' : 'determined',
      look: [lerp(0, 1, pointing), -0.1],
      armR: [lerp(0.25, 2.05, pointing) + 0.06 * Math.sin(t * 6) * (1 - pointing), lerp(0.5, -0.1, pointing)],
      armL: [0.2 + 0.08 * Math.sin(t * 4.2), 0.9 + 0.2 * Math.sin(t * 5)],
      point: pointing > 0.5,
      headTilt: 0.06 * pointing,
      lean: 0.03 * pointing,
      seed: 0.4,
    })
    for (const d of P1.dust) {
      d.el.setAttribute('cx', (d.x + Math.sin(t * 0.4 + d.k * 9) * 30) % W)
      d.el.setAttribute('cy', ((d.y - t * 12 * (0.5 + d.k)) % H + H) % H)
    }
  }
  // Plan 2.
  if (t >= P2.t0 && t < P2.t1) {
    cam(P2, { zoom: 1.05, cy: 960, push: 0.06 })
    const hurt = prog(t, T.hopital, 0.4, ease.out3)
    P2.actor.update(t, {
      x: 540,
      y: 1200,
      scale: 1.4,
      brows: 'sad',
      look: [-0.6, 0.6 * hurt],
      blink: 0.85 * hurt,
      headNod: 0.4 * hurt,
      headTilt: -0.08 * hurt,
      armR: [0.1, 0.9],
      armL: [0.1, 0.9],
      tearT: t - T.hopital - 0.05,
      seed: 1.3,
    })
    const draw = prog(t, P2.t0, 0.6, ease.io3)
    for (const e of [P2.ecg, P2.ecgGlow]) e.setAttribute('stroke-dashoffset', P2.len * (1 - draw))
  }
  // Plan 3.
  if (t >= P3.t0) {
    const slam = prog(t, T.frapper - 0.1, 0.12, ease.in3) * (1 - prog(t, T.frapper + 0.6, 0.4, ease.io3))
    const raise = prog(t, T.choisi - 0.25, 0.3, ease.back(1.8))
    cam(P3, { zoom: lerp(1.05, 1.22, prog(t, T.choisi - 0.2, 0.4, ease.out3)), cy: 940, push: 0.03 })
    const sp = speaking('avocate', t)
    P3.actor.update(t, {
      x: 540,
      y: 1130,
      scale: 1.4,
      mouth: mouthOf('avocate', t),
      brows: t > T.choisi - 0.3 ? 'angry' : 'determined',
      look: [0, 0.05],
      armR: slam > 0.01 ? [lerp(2.95, 1.0, slam), lerp(0.25, 0.1, slam)] : [lerp(0.3 + (sp ? 0.15 * Math.sin(t * 5) : 0), 2.95, raise), lerp(0.8, 0.25, raise)],
      armL: [0.25 + 0.1 * Math.sin(t * 4.6), 1.1 + 0.25 * Math.sin(t * 5.4)],
      lean: -0.04 * slam,
      headNod: 0.15 * slam,
      seed: 2.2,
    })
    const k = Math.exp(-Math.max(0, t - T.frapper) * 9) * (t >= T.frapper ? 1 : 0)
    P3.desk.setAttribute('transform', `translate(0 ${k * 14})`)
    P3.papers.forEach((p, i) => p.setAttribute('transform', `translate(0 ${-k * (50 + i * 30)}) rotate(${k * (i ? -8 : 6)} ${700 - i * 400} 1670)`))
    const b = t >= T.frapper ? prog(t, T.frapper, 0.3, ease.out3) : 0
    P3.burst.setAttribute('opacity', b > 0 ? 1 - b : 0)
    P3.burst.setAttribute('transform', `translate(800 1600) scale(${0.6 + 0.8 * b})`)
  }

  // Transitions.
  const ti = t - (T.hopital - 0.12)
  iris.setAttribute('r', ti > -0.22 && ti < 0.25 ? (ti < 0 ? lerp(0, 2300, ease.in3(clamp((ti + 0.22) / 0.22))) : lerp(2300, 0, ease.out3(clamp(ti / 0.25)))) : 0)
  iris.setAttribute('cx', ti < 0 ? 1000 : 540)
  const tb = t - (S('17') - 0.08)
  const bx = tb > -0.25 && tb < 0.3 ? lerp(-1600, 2200, ease.io3(clamp((tb + 0.25) / 0.55))) : -3000
  band.setAttribute('x', bx)

  // Textes.
  popIn(tHop, t, T.hopital - 0.05, S('17') - 0.15, { y: 330, rot: -4 })
  popIn(tChoisi, t, T.choisi - 0.08, null, { y: 330, rot: -3 })
  popIn(tFrapper, t, T.frapper - 0.05, null, { y: 480, rot: 3, from: 3 })
  const cur = [['procureur', 'LE PROCUREUR'], ['avocate', 'L’AVOCAT DE LA DÉFENSE']].find(([w]) => speaking(w, t))
  who.textContent = cur ? cur[1] : ''
  who.className = `tag who ${cur ? cur[0] : ''}`
  who.style.opacity = cur ? 1 : 0
  who.style.transform = 'translate(540px, 1460px) translate(-50%, -50%)'
  const v = t < S('17') ? -0.5 : lerp(-0.5, 0.15, prog(t, S('17') + 0.4, 0.6, ease.back(1.6)))
  needle.style.left = `${((v + 1) / 2) * 100}%`
  captions(t)
  grain(t)
}

register(seek)
