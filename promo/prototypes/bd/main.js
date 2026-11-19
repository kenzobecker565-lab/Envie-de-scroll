/**
 * Prototype B — motion comic (BD animée) : une planche de trois cases, la
 * caméra glisse de case en case puis recule pour révéler la planche entière.
 * Personnages Open Peeps (Pablo Stanley, CC0) : on change de visage et de pose
 * comme on tourne les cases (bouche ouverte / fermée au rythme de la voix).
 * Bulles de dialogue, trame de points, lignes de vitesse, onomatopée.
 */

import { E, H, LINES, S, T, W, WINDOW, clamp, ease, lerp, makeGrain, mouthOf, prog, register, rng, shaker, speaking, svg } from '../commun.js'
import { peep } from './peeps.js'

const lib = await (await fetch('peeps.json')).json()
const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
// Trame de points (demi-ton) et papier.
const dots = (id, color, r, gap) => {
  const p = svg('pattern', { id, width: gap, height: gap, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(20)' }, defs)
  svg('circle', { cx: gap / 2, cy: gap / 2, r, fill: color }, p)
}
dots('dotsRed', '#a8231c', 5, 16)
dots('dotsBlue', '#123c66', 5, 16)
dots('dotsOrange', '#b65a12', 5, 16)
dots('dotsPaper', '#e3d6b8', 2.2, 12)

const page = svg('g', {}, root)
svg('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: '#f6eedb' }, page)
svg('rect', { x: -2000, y: -2000, width: 6000, height: 6000, fill: 'url(#dotsPaper)' }, page)

// Les trois cases de la planche (coordonnées de la planche = celles de l'écran en plan large).
// Format « webtoon » : trois grandes cases verticales, la caméra descend de l'une à l'autre.
const PANELS = [
  { x: 40, y: 60, w: 1000, h: 1800, bg: '#e8443a', dots: 'url(#dotsRed)' },
  { x: 40, y: 1940, w: 1000, h: 1800, bg: '#2c6fb0', dots: 'url(#dotsBlue)' },
  { x: 40, y: 3820, w: 1000, h: 1800, bg: '#f29a38', dots: 'url(#dotsOrange)' },
]
const panels = PANELS.map((P, i) => {
  const clip = svg('clipPath', { id: `clip${i}` }, defs)
  svg('rect', { x: P.x, y: P.y, width: P.w, height: P.h }, clip)
  const g = svg('g', { 'clip-path': `url(#clip${i})` }, page)
  svg('rect', { x: P.x, y: P.y, width: P.w, height: P.h, fill: P.bg }, g)
  const inner = svg('g', {}, g)
  svg('rect', { x: P.x - 200, y: P.y - 200, width: P.w + 400, height: P.h + 400, fill: P.dots, opacity: 0.55 }, inner)
  // Lignes de vitesse rayonnantes.
  const speed = svg('g', { opacity: 0 }, inner)
  const r = rng(i + 3)
  for (let k = 0; k < 46; k++) {
    const a = (k / 46) * Math.PI * 2 + r() * 0.05
    const r0 = 260 + r() * 140
    svg('path', { d: `M ${Math.cos(a) * r0} ${Math.sin(a) * r0} L ${Math.cos(a) * 1500} ${Math.sin(a) * 1500}`, stroke: '#fff', 'stroke-width': 4 + r() * 10, opacity: 0.55 }, speed)
  }
  const actor = svg('g', {}, inner)
  const front = svg('g', {}, inner)
  svg('rect', { x: P.x, y: P.y, width: P.w, height: P.h, fill: 'none', stroke: '#141414', 'stroke-width': 14 }, page)
  return { ...P, g, inner, speed, actor, front }
})

// ------------------------------------------------------------- les personnages

/** Toutes les variantes (pose × visage) d'un personnage, prêtes à être affichées. */
function cast(parent, { x, y, w, base, variants }) {
  const els = {}
  for (const [key, v] of Object.entries(variants)) {
    const el = peep(lib, { ...base, ...v, colors: { ...base.colors, ...(v.colors ?? {}) } })
    el.setAttribute('x', x)
    el.setAttribute('y', y)
    el.setAttribute('width', w)
    el.setAttribute('height', w * (1130 / 940))
    el.style.display = 'none'
    parent.append(el)
    els[key] = el
  }
  let cur = null
  return (key, { dx = 0, dy = 0, tilt = 0 } = {}) => {
    if (cur !== key) {
      if (cur) els[cur].style.display = 'none'
      els[key].style.display = ''
      cur = key
    }
    els[key].setAttribute('x', x + dx)
    els[key].setAttribute('y', y + dy)
    els[key].querySelector('.head').setAttribute('transform', `rotate(${tilt} 640 900)`)
  }
}

const proc = cast(panels[0].actor, {
  x: 20,
  y: 600,
  w: 1040,
  base: { head: 'Pomp', colors: { hairColor: '#1d1410', skinColor: '#f2c8a2', jacketColor: '#ffffff', topColor: '#ffffff', pocketColor: '#e8443a' } },
  variants: {
    calm: { body: 'ShirtCoat', face: 'Serious' },
    talk: { body: 'ShirtCoat', face: 'Explaining' },
    point: { body: 'PolkadotJacket', face: 'Angry' },
    pointTalk: { body: 'PolkadotJacket', face: 'Rage' },
  },
})
const sarah = cast(panels[1].actor, {
  x: 80,
  y: 2560,
  w: 920,
  base: { head: 'ColorBun', body: 'Turtleneck', colors: { hairColor: '#5a3520', skinColor: '#f6d0ae', topColor: '#2aa198' } },
  variants: { worry: { face: 'Concerned' }, hurt: { face: 'Solemn' }, closed: { face: 'EyesClosed' } },
})
const avo = cast(panels[2].actor, {
  x: 20,
  y: 4400,
  w: 1040,
  base: { head: 'ShortOne', beard: 'FullMedium', colors: { hairColor: '#120c08', beardColor: '#120c08', skinColor: '#b97f58', blazerColor: '#1c1f27', topColor: '#ffffff' } },
  variants: {
    calm: { body: 'BlazerBlackTee', face: 'Driven' },
    talk: { body: 'BlazerBlackTee', face: 'Explaining' },
    up: { body: 'PointingUp', face: 'Serious', colors: { topColor: '#1c1f27' } },
    upTalk: { body: 'PointingUp', face: 'Rage', colors: { topColor: '#1c1f27' } },
  },
})

// ---------------------------------------------------------- bulles et lettrage

const bubbles = svg('g', {}, page)
function bubble({ x, y, w, tail, color = '#fff' }) {
  const g = svg('g', {}, bubbles)
  const shape = svg('path', { fill: color, stroke: '#141414', 'stroke-width': 8, 'stroke-linejoin': 'round' }, g)
  const text = svg('text', { 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 64, fill: '#141414', 'text-anchor': 'middle' }, g)
  return {
    g,
    set(words, t) {
      // Les mots apparaissent au fil de la voix ; on coupe en lignes d'environ 14 caractères.
      // La phrase en cours seulement : on repart à zéro après un point.
      let start = 0
      words.forEach((wd, i) => {
        if (i > 0 && /[.!?]$/.test(words[i - 1].w) && t >= wd.t - 0.04) start = i
      })
      const shown = words.slice(start).filter((wd) => t >= wd.t - 0.04)
      const lines = []
      let cur = ''
      for (const wd of shown) {
        const nxt = cur ? `${cur} ${wd.w}` : wd.w
        if (nxt.length > 15 && cur) {
          lines.push(cur)
          cur = wd.w
        } else cur = nxt
      }
      if (cur) lines.push(cur)
      text.innerHTML = lines.map((l, i) => `<tspan x="${x}" dy="${i ? 70 : 0}">${l.toUpperCase()}</tspan>`).join('')
      text.setAttribute('y', y - (lines.length - 1) * 35 + 22)
      const hh = Math.max(1, lines.length) * 70 + 60
      const ww = w
      const [tx, ty] = tail
      const x0 = x - ww / 2,
        y0 = y - hh / 2,
        r = 46
      shape.setAttribute(
        'd',
        `M ${x0 + r} ${y0} H ${x0 + ww - r} Q ${x0 + ww} ${y0} ${x0 + ww} ${y0 + r} V ${y0 + hh - r} Q ${x0 + ww} ${y0 + hh} ${x0 + ww - r} ${y0 + hh}
         H ${x + 60} L ${tx} ${ty} L ${x - 10} ${y0 + hh} H ${x0 + r} Q ${x0} ${y0 + hh} ${x0} ${y0 + hh - r} V ${y0 + r} Q ${x0} ${y0} ${x0 + r} ${y0} Z`,
      )
      g.style.display = shown.length ? '' : 'none'
    },
  }
}
const b1 = bubble({ x: 450, y: 360, w: 720, tail: [600, 700] })
const b3 = bubble({ x: 430, y: 4130, w: 720, tail: [560, 4470] })
// Encadré narratif rouge sur la case de l'accusée.
const boxNarr = svg('g', {}, page)
svg('rect', { x: 120, y: 2080, width: 840, height: 150, fill: '#ffd23f', stroke: '#141414', 'stroke-width': 8 }, boxNarr)
svg('text', { x: 540, y: 2180, 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 84, fill: '#141414', 'text-anchor': 'middle' }, boxNarr).textContent = '… À L’HÔPITAL.'
// Onomatopée.
const bam = svg('g', {}, page)
const star = []
for (let k = 0; k < 16; k++) {
  const a = (k / 16) * Math.PI * 2
  const rr = k % 2 ? 150 : 250
  star.push(`${Math.cos(a) * rr},${Math.sin(a) * rr * 0.8}`)
}
svg('polygon', { points: star.join(' '), fill: '#ffd23f', stroke: '#141414', 'stroke-width': 10, 'stroke-linejoin': 'round' }, bam)
const bamText = svg('text', { x: 0, y: 34, 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 120, fill: '#e8443a', stroke: '#141414', 'stroke-width': 8, 'paint-order': 'stroke fill', 'text-anchor': 'middle' }, bam)
bamText.textContent = 'BAM !'

const grain = makeGrain(stage, { alpha: 14, blend: 'multiply' })
const shake = shaker([
  [T.hopital - 0.02, 12],
  [T.frapper, 22],
])

// ------------------------------------------------------------------ la caméra

// Chaque plan cadre une case (centre, zoom) ; la fin recule sur la planche entière.
const VIEW = {
  p1: [540, 960, 1.04],
  p1close: [540, 820, 1.2],
  p2: [540, 2840, 1.05],
  p3: [540, 4720, 1.04],
  p3close: [540, 4600, 1.22],
}
const keys = [
  [WINDOW[0] - 1, 'p1', 0.01],
  [T.fini - 0.2, 'p1close', 0.25],
  [T.hopital - 0.14, 'p2', 0.3],
  [S('17') - 0.12, 'p3', 0.35],
  [T.frapper - 0.08, 'p3close', 0.14],
]
function camAt(t) {
  let i = 0
  while (i < keys.length - 1 && t >= keys[i + 1][0]) i++
  const [t0, k, dur] = keys[i]
  const prev = VIEW[keys[Math.max(0, i - 1)][1]]
  const cur = VIEW[k]
  const p = i === 0 ? 1 : ease.io3(clamp((t - t0) / dur))
  const push = 1 + 0.025 * (t - t0)
  return [lerp(prev[0], cur[0], p), lerp(prev[1], cur[1], p), lerp(prev[2], cur[2], p) * push]
}

const lineWords = (id) => LINES.find((l) => l.id.startsWith(id)).words

function seek(t) {
  const [cx, cy, z] = camAt(t)
  const [sx, sy] = shake(t)
  page.setAttribute('transform', `translate(${540 + sx} ${960 + sy}) scale(${z}) translate(${-cx} ${-cy})`)
  // Case 1 : le procureur.
  const m1 = mouthOf('procureur', t)
  const pointing = t >= T.fini - 0.1
  proc(pointing ? (m1 > 0.3 ? 'pointTalk' : 'point') : m1 > 0.3 ? 'talk' : 'calm', { dy: 6 * Math.sin(t * 2.3), tilt: 2 * Math.sin(t * 1.7) + (pointing ? -4 : 0) })
  panels[0].speed.setAttribute('opacity', pointing ? 1 : 0)
  panels[0].speed.setAttribute('transform', `translate(560 1000) rotate(${t * 8})`)
  b1.set(lineWords('16'), t)
  // Case 2 : l'accusée.
  sarah(t < T.hopital ? 'worry' : t < T.hopital + 0.35 ? 'hurt' : 'closed', { dy: 3 * Math.sin(t * 2), tilt: t > T.hopital ? 6 * prog(t, T.hopital, 0.5, ease.out3) : 0 })
  boxNarr.style.display = t >= T.hopital - 0.05 ? '' : 'none'
  const nb = prog(t, T.hopital - 0.05, 0.2, ease.back(2))
  boxNarr.setAttribute('transform', `translate(540 2155) rotate(-2) scale(${nb}) translate(-540 -2155)`)
  // Case 3 : l'avocat.
  const m3 = mouthOf('avocate', t)
  const up = t >= T.choisi - 0.15 && t < T.sarah + 0.2
  avo(up ? (m3 > 0.3 ? 'upTalk' : 'up') : m3 > 0.3 ? 'talk' : 'calm', { dy: 5 * Math.sin(t * 2.6), tilt: up ? 3 : 1.5 * Math.sin(t * 1.9) })
  panels[2].speed.setAttribute('opacity', t >= T.frapper - 0.05 ? 1 : 0)
  panels[2].speed.setAttribute('transform', `translate(560 4800) rotate(${-t * 8})`)
  b3.set(lineWords('17'), t)
  // BAM !
  const bp = prog(t, T.frapper - 0.04, 0.22, ease.back(2.6))
  bam.style.display = t >= T.frapper - 0.04 ? '' : 'none'
  bam.setAttribute('transform', `translate(800 5080) rotate(${-8 + 4 * Math.sin(t * 20) * Math.exp(-(t - T.frapper) * 5)}) scale(${0.95 * bp})`)
  grain(t)
}

register(seek)
