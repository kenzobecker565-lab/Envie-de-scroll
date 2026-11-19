/**
 * Prototype C — noir cinématique : ombres profondes, lumière de stores
 * vénitiens sur les visages, pluie, contre-jour rouge, électrocardiogramme au
 * néon, grandes lettres à empattements. Personnages Open Peeps (CC0) éclairés
 * comme dans un film policier.
 */

import { H, LINES, S, T, W, WINDOW, clamp, ease, lerp, makeCaptions, makeGrain, mouthOf, prog, register, rng, shaker, speaking, svg } from '../commun.js'
import { peep } from '../bd/peeps.js'

const lib = await (await fetch('../bd/peeps.json')).json()
const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
defs.innerHTML = `
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
  <filter id="rim" x="-20%" y="-20%" width="140%" height="140%">
    <feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/>
    <feOffset in="d" dx="-10" dy="-4" result="o"/>
    <feComposite in="o" in2="SourceAlpha" operator="out" result="edge"/>
    <feFlood flood-color="#ff3b3b" result="c"/><feComposite in="c" in2="edge" operator="in" result="redge"/>
    <feGaussianBlur in="redge" stdDeviation="3" result="rb"/>
    <feMerge><feMergeNode in="rb"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <radialGradient id="spotTop" cx="0.5" cy="0.2" r="0.7"><stop offset="0" stop-color="#cfd8ff" stop-opacity="0.45"/><stop offset="1" stop-color="#cfd8ff" stop-opacity="0"/></radialGradient>
  <radialGradient id="redBack" cx="0.5" cy="0.35" r="0.6"><stop offset="0" stop-color="#ff2a2a" stop-opacity="0.75"/><stop offset="0.6" stop-color="#5a0808" stop-opacity="0.35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="blindsFade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.35" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0.85"/></linearGradient>
`
// Stores vénitiens : bandes de lumière obliques (masque doux).
const blinds = svg('mask', { id: 'blinds', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs)
const bl = svg('g', { filter: 'url(#soft)', transform: 'rotate(-16 540 960)' }, blinds)
for (let i = -6; i < 30; i++) svg('rect', { x: -600, y: i * 110, width: 2400, height: 58, fill: 'url(#blindsFade)' }, bl)

// Un personnage en deux couches : la silhouette noire (contre-jour) et la
// version éclairée, visible seulement à travers les stores.
function noirActor(parent, { x, y, w, base, variants, lit = 'blinds' }) {
  const g = svg('g', {}, parent)
  const sil = svg('g', { filter: 'url(#rim)' }, g)
  const litG = svg('g', lit === 'blinds' ? { mask: 'url(#blinds)' } : { opacity: 0.9 }, g)
  const make = (layer, colors) => {
    const els = {}
    for (const [k, v] of Object.entries(variants)) {
      const el = peep(lib, { ...base, ...v, colors: { ...base.colors, ...(v.colors ?? {}), ...colors } })
      el.setAttribute('x', x)
      el.setAttribute('y', y)
      el.setAttribute('width', w)
      el.setAttribute('height', w * (1130 / 940))
      el.style.display = 'none'
      layer.append(el)
      els[k] = el
    }
    return els
  }
  const dark = '#07070a'
  const A = make(sil, { skinColor: dark, hairColor: dark, beardColor: dark, topColor: dark, blazerColor: dark, jacketColor: dark, pocketColor: dark, outlineColor: '#000' })
  const B = make(litG, {})
  let cur = null
  return (k, { dx = 0, dy = 0, tilt = 0 } = {}) => {
    for (const set of [A, B]) {
      if (cur !== k) {
        if (cur) set[cur].style.display = 'none'
        set[k].style.display = ''
      }
      set[k].setAttribute('x', x + dx)
      set[k].setAttribute('y', y + dy)
      set[k].querySelector('.head').setAttribute('transform', `rotate(${tilt} 640 900)`)
    }
    cur = k
  }
}

const shots = []
const shot = (t0, t1) => {
  const g = svg('g', {}, root)
  const s = { t0, t1, g, cam: svg('g', {}, g) }
  shots.push(s)
  return s
}

// Plan 1 : bureau sombre, le procureur dans la lumière des stores.
const P1 = shot(WINDOW[0] - 1, T.hopital - 0.1)
svg('rect', { x: -500, y: -500, width: W + 1000, height: H + 1000, fill: '#0b0d14' }, P1.cam)
svg('rect', { x: -500, y: -500, width: W + 1000, height: H + 1000, fill: '#8aa2ff', mask: 'url(#blinds)', opacity: 0.12 }, P1.cam)
const proc = noirActor(P1.cam, {
  x: 40,
  y: 560,
  w: 1000,
  base: { head: 'Pomp', colors: { hairColor: '#1a1410', skinColor: '#e9c3a0', jacketColor: '#8c1a14', topColor: '#141414', pocketColor: '#8c1a14' } },
  variants: { calm: { body: 'ShirtCoat', face: 'Serious' }, talk: { body: 'ShirtCoat', face: 'Explaining' }, point: { body: 'PolkadotJacket', face: 'Angry' }, pointTalk: { body: 'PolkadotJacket', face: 'Rage' } },
})
// Fumée.
const smoke = []
const rs = rng(4)
for (let i = 0; i < 8; i++) smoke.push({ el: svg('ellipse', { rx: 260 + rs() * 200, ry: 90 + rs() * 60, fill: '#9aa8d8', opacity: 0.05, filter: 'url(#soft)' }, P1.cam), k: rs() })

// Plan 2 : noir complet, un électrocardiogramme au néon, puis l'accusée sous une lampe.
const P2 = shot(T.hopital - 0.1, S('17') - 0.06)
svg('rect', { x: -500, y: -500, width: W + 1000, height: H + 1000, fill: '#040406' }, P2.cam)
svg('ellipse', { cx: 540, cy: 900, rx: 700, ry: 1000, fill: 'url(#spotTop)' }, P2.cam)
const sarah = noirActor(P2.cam, {
  x: 120,
  y: 820,
  w: 840,
  lit: 'full',
  base: { head: 'ColorBun', body: 'Turtleneck', colors: { hairColor: '#4a2c1a', skinColor: '#e8cdb6', topColor: '#1f3e44' } },
  variants: { worry: { face: 'Concerned' }, closed: { face: 'EyesClosed' } },
})
const ecgPts = []
for (let x = -40; x <= W + 40; x += 6) {
  const p = ((x + 40) % 380) / 380
  let y = 0
  if (p > 0.5 && p < 0.53) y = 30 * ((p - 0.5) / 0.03)
  if (p > 0.53 && p < 0.57) y = 30 - 260 * ((p - 0.53) / 0.04)
  if (p > 0.57 && p < 0.61) y = -230 + 290 * ((p - 0.57) / 0.04)
  if (p > 0.61 && p < 0.64) y = 60 - 60 * ((p - 0.61) / 0.03)
  ecgPts.push(`${x},${560 + y}`)
}
const ecg = svg('polyline', { points: ecgPts.join(' '), fill: 'none', stroke: '#ff3346', 'stroke-width': 8, 'stroke-linejoin': 'round', filter: 'url(#glow)' }, P2.cam)
const ecgLen = 4200
ecg.setAttribute('stroke-dasharray', `${ecgLen}`)

// Plan 3 : contre-jour rouge, pluie ; l'avocat.
const P3 = shot(S('17') - 0.06, WINDOW[1] + 1)
svg('rect', { x: -500, y: -500, width: W + 1000, height: H + 1000, fill: '#060304' }, P3.cam)
svg('ellipse', { cx: 540, cy: 760, rx: 900, ry: 1100, fill: 'url(#redBack)' }, P3.cam)
const avo = noirActor(P3.cam, {
  x: 30,
  y: 600,
  w: 1020,
  base: { head: 'ShortOne', beard: 'FullMedium', colors: { hairColor: '#0e0a08', beardColor: '#0e0a08', skinColor: '#a8765a', blazerColor: '#15161b', topColor: '#ffffff' } },
  variants: { calm: { body: 'BlazerBlackTee', face: 'Driven' }, talk: { body: 'BlazerBlackTee', face: 'Explaining' }, up: { body: 'PointingUp', face: 'Serious', colors: { topColor: '#15161b' } }, upTalk: { body: 'PointingUp', face: 'Rage', colors: { topColor: '#15161b' } } },
})
const rain = []
const rr = rng(8)
for (let i = 0; i < 160; i++) rain.push({ el: svg('line', { stroke: '#ff9a9a', 'stroke-width': 2 + rr() * 2, opacity: 0.15 + rr() * 0.25 }, P3.cam), x: rr() * 1400 - 160, y: rr() * 2200, v: 1800 + rr() * 1400, l: 40 + rr() * 60 })

// Voile noir des transitions + barres de cinéma.
const fade = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0 }, root)
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#ff2a2a', opacity: 0 }, root)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#vig)' }, root)
defs.insertAdjacentHTML('beforeend', '<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.8"/></radialGradient>')

// --------------------------------------------------------------- lettrage

const ui = document.getElementById('ui')
const word = (text, cls) => {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = text
  ui.append(el)
  return el
}
const wHop = word('À L’HÔPITAL', 'serif red')
const wChoisi = word('IL A <em>CHOISI</em>', 'serif white')
const wFrapper = word('DE FRAPPER', 'serif red big')
const captions = makeCaptions(ui, { y: 1600 })
const grain = makeGrain(stage, { alpha: 28 })
const shake = shaker([
  [T.hopital - 0.02, 10],
  [T.frapper, 24],
])
const show = (el, t, t0, t1, { y = 360, spread = 0.4 } = {}) => {
  const a = prog(t, t0, 0.35, ease.out3)
  const b = t1 ? 1 - prog(t, t1, 0.25, ease.in3) : 1
  el.style.opacity = (a * b).toFixed(3)
  el.style.letterSpacing = `${lerp(spread, 0.04, a)}em`
  el.style.filter = `blur(${((1 - a) * 12).toFixed(1)}px)`
  el.style.transform = `translate(540px, ${y}px) translate(-50%, -50%) scale(${lerp(1.15, 1, a).toFixed(3)})`
}

function seek(t) {
  const [sx, sy, sr] = shake(t)
  for (const s of shots) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const camT = (s, z, cx, cy) => s.cam.setAttribute('transform', `translate(${540 + sx} ${960 + sy}) rotate(${sr * 57}) scale(${z}) translate(${-cx} ${-cy})`)
  // Plan 1 : lente avancée, puis coup de zoom sur « fini ».
  if (t < P1.t1) {
    const punch = prog(t, T.fini - 0.1, 0.3, ease.out3)
    camT(P1, lerp(1.02, 1.28, punch) + 0.03 * (t - P1.t0), lerp(540, 560, punch), lerp(960, 880, punch))
    const m = mouthOf('procureur', t)
    const pointing = t >= T.fini - 0.05
    proc(pointing ? (m > 0.3 ? 'pointTalk' : 'point') : m > 0.3 ? 'talk' : 'calm', { dy: 5 * Math.sin(t * 2), tilt: 1.5 * Math.sin(t * 1.4) })
    smoke.forEach((s, i) => {
      s.el.setAttribute('cx', ((s.k * 1400 + t * 40 * (0.5 + s.k)) % 1600) - 260)
      s.el.setAttribute('cy', 300 + i * 200 + 40 * Math.sin(t * 0.6 + i))
    })
  }
  // Plan 2.
  if (t >= P2.t0 && t < P2.t1) {
    camT(P2, 1.04 + 0.05 * (t - P2.t0), 540, 980)
    const d = prog(t, P2.t0, 0.55, ease.io3)
    ecg.setAttribute('stroke-dashoffset', ecgLen * (1 - d))
    ecg.setAttribute('opacity', 0.6 + 0.4 * Math.sin(t * 40) ** 2)
    sarah(t < T.hopital + 0.25 ? 'worry' : 'closed', { dy: 3 * Math.sin(t * 2), tilt: 5 * prog(t, T.hopital, 0.5, ease.out3) })
  }
  // Plan 3.
  if (t >= P3.t0) {
    const punch = prog(t, T.frapper - 0.08, 0.12, ease.out3)
    camT(P3, lerp(1.0 + 0.04 * (t - P3.t0), 1.22, punch), 540, lerp(960, 900, punch))
    const m = mouthOf('avocate', t)
    const up = t >= T.choisi - 0.15
    avo(up ? (m > 0.3 ? 'upTalk' : 'up') : m > 0.3 ? 'talk' : 'calm', { dy: 4 * Math.sin(t * 2.4), tilt: up ? 3 : 1.5 * Math.sin(t * 1.7) })
    for (const d of rain) {
      const yy = ((d.y + t * d.v) % 2300) - 200
      d.el.setAttribute('x1', d.x + yy * 0.12)
      d.el.setAttribute('y1', yy)
      d.el.setAttribute('x2', d.x + (yy + d.l) * 0.12)
      d.el.setAttribute('y2', yy + d.l)
    }
  }
  // Transitions : coupe au noir très courte, flash rouge sur les coups.
  let f = 0
  for (const c of [T.hopital - 0.1, S('17') - 0.06]) {
    const k = t - c
    if (k > -0.12 && k < 0.18) f = Math.max(f, k < 0 ? (k + 0.12) / 0.12 : 1 - k / 0.18)
  }
  fade.setAttribute('opacity', f.toFixed(3))
  let fl = 0
  for (const c of [T.hopital, T.frapper]) if (t >= c && t < c + 0.2) fl = Math.max(fl, 0.45 * (1 - (t - c) / 0.2))
  flash.setAttribute('opacity', fl.toFixed(3))
  // Lettrage.
  show(wHop, t, T.hopital - 0.05, S('17') - 0.15, { y: 330 })
  show(wChoisi, t, T.choisi - 0.1, null, { y: 300 })
  show(wFrapper, t, T.frapper - 0.06, null, { y: 440, spread: 0.3 })
  captions(t)
  grain(t)
}

register(seek)
