/**
 * Prototype G — « Le Dossier » (style halftone-dossier de Lemo-Opuscar) : un
 * dossier d'archives rétro qu'on feuillette. Papier crème, trame de points,
 * gros titres à l'ombre décalée, tampons qui claquent, personnages au gros
 * contour, transitions en points. 5,6 s, sans voix (le texte est à l'écran).
 */

import { clamp, ease, lerp, prog, rng } from '../../engine.js'

const W = 1080
const H = 1920
const FPS = 30
const DURATION = 5.6
const INK = '#1d2a5c' // encre sombre : contours, texte
const RED = '#e2402f' // tampons, alarmes
const YEL = '#f5b82e' // surlignage
const PINK = '#f06a8a' // ombre de surimpression
const PAPER = '#f4ead2'

const NS = 'http://www.w3.org/2000/svg'
function svg(tag, attrs = {}, parent = null) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (parent) parent.append(el)
  return el
}

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
defs.innerHTML = `
  <filter id="boil"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="1" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
  <filter id="stampInk"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.25" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in" result="g"/><feTurbulence type="fractalNoise" baseFrequency="0.05" seed="7" result="d"/><feDisplacementMap in="g" in2="d" scale="4"/></filter>
`
// Trame de points (demi-teinte) : un motif par encre, angles différents.
const halftone = (id, color, step, r, angle) => {
  const p = svg('pattern', { id, width: step, height: step, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${angle})` }, defs)
  svg('circle', { cx: step / 2, cy: step / 2, r, fill: color }, p)
}
halftone('dotsYel', YEL, 24, 8, 15)
halftone('dotsPink', PINK, 22, 6, 45)
halftone('dotsInk', INK, 20, 4, 75)
halftone('dotsRed', RED, 22, 7, 30)

const cam = svg('g', {}, root)
svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: PAPER }, cam)

// --------------------------------------------------------------- les pages

const pages = []
const page = (t0, t1) => {
  const g = svg('g', {}, cam)
  pages.push({ g, t0, t1 })
  return g
}

// Page 1 : la couverture du dossier, puis « UN HOMME MORT. »
const P1 = page(0, 2.05)
// Halo de points jaunes dans un coin, points d'encre au bord du cadre.
svg('circle', { cx: 900, cy: 260, r: 520, fill: 'url(#dotsYel)', opacity: 0.85 }, P1)
svg('rect', { x: 0, y: 1500, width: W, height: 420, fill: 'url(#dotsInk)', opacity: 0.35 }, P1)
// Couverture (chemise cartonnée) qui s'ouvre.
const cover = svg('g', {}, P1)
svg('rect', { x: 110, y: 380, width: 860, height: 1120, rx: 26, fill: '#e3c27c', stroke: INK, 'stroke-width': 8 }, cover)
svg('rect', { x: 110, y: 340, width: 360, height: 80, rx: 18, fill: '#e3c27c', stroke: INK, 'stroke-width': 8 }, cover)
svg('rect', { x: 110, y: 380, width: 860, height: 1120, rx: 26, fill: 'url(#dotsPink)', opacity: 0.35 }, cover)
const coverTitle = svg('text', { x: 540, y: 860, 'text-anchor': 'middle', 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': 120, fill: INK }, cover)
coverTitle.textContent = 'AFFAIRE'
const coverNum = svg('text', { x: 540, y: 1080, 'text-anchor': 'middle', 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': 260, fill: RED, stroke: INK, 'stroke-width': 8, 'paint-order': 'stroke fill' }, cover)
coverNum.textContent = 'N°1'
const coverMono = svg('text', { x: 540, y: 1220, 'text-anchor': 'middle', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 40, fill: INK }, cover)
coverMono.textContent = 'CLASSÉE SANS SUITE ?'
// Le corps : silhouette à la craie, comme sur une scène de crime.
const body = svg('g', { filter: 'url(#boil)', opacity: 0 }, P1)
svg('path', {
  d: 'M 540 620 C 610 620 640 680 620 740 C 700 760 780 820 840 900 L 790 940 C 740 880 690 850 650 840 C 660 940 650 1040 700 1160 L 640 1180 C 600 1080 570 1000 540 960 C 510 1000 470 1080 420 1180 L 360 1160 C 420 1040 420 940 430 840 C 380 860 330 900 280 960 L 230 920 C 300 820 380 760 460 740 C 440 680 470 620 540 620 Z',
  fill: 'none', stroke: '#fffaf0', 'stroke-width': 18, 'stroke-linejoin': 'round',
}, body)
const bodyBg = svg('rect', { x: 90, y: 520, width: 900, height: 780, rx: 30, fill: INK, opacity: 0 }, P1)
P1.insertBefore(bodyBg, body)
svg('rect', { x: 90, y: 520, width: 900, height: 780, rx: 30, fill: 'url(#dotsInk)', opacity: 0 }, P1)

// Page 2 : le plan du bureau, la clé dans la serrure… côté intérieur.
const P2 = page(2.05, 4.2)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsYel)', opacity: 0.25 }, P2)
const plan = svg('g', { transform: 'translate(540 980)' }, P2)
svg('rect', { x: -380, y: -330, width: 760, height: 660, fill: '#fffaf0', stroke: INK, 'stroke-width': 14 }, plan)
svg('rect', { x: -380, y: -330, width: 760, height: 660, fill: 'url(#dotsPink)', opacity: 0.25 }, plan)
// Bureau, chaise, fenêtre condamnée.
svg('rect', { x: -230, y: -200, width: 300, height: 150, rx: 10, fill: '#c98b5a', stroke: INK, 'stroke-width': 8 }, plan)
svg('circle', { cx: -80, cy: 10, r: 46, fill: '#8aa3d6', stroke: INK, 'stroke-width': 8 }, plan)
for (let k = 0; k < 4; k++) svg('line', { x1: 250 + k * 22, y1: -330, x2: 250 + k * 22, y2: -250, stroke: INK, 'stroke-width': 6 }, plan)
svg('text', { x: 300, y: -270, 'text-anchor': 'middle', 'font-family': 'DejaVu Sans Mono', 'font-weight': 700, 'font-size': 28, fill: INK }, plan).textContent = 'FENÊTRE'
// La porte (en bas) et sa serrure, la clé côté intérieur.
svg('rect', { x: 120, y: 316, width: 170, height: 28, fill: PAPER, stroke: INK, 'stroke-width': 8 }, plan)
const doorArc = svg('path', { d: 'M 120 330 A 170 170 0 0 1 290 160', fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-dasharray': '14 10' }, plan)
void doorArc
const key = svg('g', { transform: 'translate(205 290)' }, plan)
svg('circle', { cx: 0, cy: -46, r: 26, fill: YEL, stroke: INK, 'stroke-width': 7 }, key)
svg('rect', { x: -7, y: -24, width: 14, height: 46, fill: YEL, stroke: INK, 'stroke-width': 6 }, key)
svg('rect', { x: 6, y: 4, width: 16, height: 9, fill: YEL, stroke: INK, 'stroke-width': 5 }, key)
// Le cercle rouge et la flèche « INTÉRIEUR ».
const circle = svg('circle', { cx: 205, cy: 260, r: 92, fill: 'none', stroke: RED, 'stroke-width': 10, 'stroke-dasharray': 600, 'stroke-dashoffset': 600 }, plan)
const arrowTxt = svg('text', { x: 205, y: 130, 'text-anchor': 'middle', 'font-family': 'DejaVu Sans Mono', 'font-weight': 700, 'font-size': 36, fill: RED, opacity: 0 }, plan)
arrowTxt.textContent = '▼ CÔTÉ INTÉRIEUR'
// Le corps sur le plan.
svg('path', { d: 'M -260 160 l 60 -30 l 40 20 l 70 -10 l -10 40 l -70 10 l -40 30 z', fill: 'none', stroke: RED, 'stroke-width': 7, 'stroke-dasharray': '10 8' }, plan)

// Page 3 : les trois suspects.
const P3 = page(4.2, DURATION + 1)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: INK }, P3)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotsPink)', opacity: 0.22 }, P3)
const SUSPECTS = [
  { x: 210, name: 'LA FEMME', hair: '#7a3b2a', skin: '#f2c49a', color: '#f06a8a' },
  { x: 540, name: "L'ASSOCIÉ", hair: '#2b2118', skin: '#d9a072', color: '#5b8de0' },
  { x: 870, name: 'LA SECRÉTAIRE', hair: '#e0b04a', skin: '#f6d2b0', color: '#4fb38a' },
]
const cards = SUSPECTS.map((s, i) => {
  const g = svg('g', {}, P3)
  svg('rect', { x: -150, y: -230, width: 300, height: 430, rx: 18, fill: '#fffaf0', stroke: PAPER, 'stroke-width': 6 }, g)
  svg('rect', { x: -130, y: -210, width: 260, height: 260, fill: s.color }, g)
  svg('rect', { x: -130, y: -210, width: 260, height: 260, fill: 'url(#dotsInk)', opacity: 0.3 }, g)
  const face = svg('g', { filter: 'url(#boil)' }, g)
  svg('path', { d: 'M -95 50 C -95 -20 -50 -40 0 -40 C 50 -40 95 -20 95 50 Z', fill: s.color === '#5b8de0' ? '#2e3f73' : '#3a2a4a', stroke: INK, 'stroke-width': 7 }, face)
  svg('ellipse', { cx: 0, cy: -95, rx: 62, ry: 70, fill: s.skin, stroke: INK, 'stroke-width': 7 }, face)
  svg('path', { d: i === 0 ? 'M -66 -95 C -70 -170 70 -175 66 -95 C 70 -40 92 -20 80 10 C 60 -60 40 -120 0 -130 C -40 -120 -60 -60 -80 10 C -92 -20 -70 -40 -66 -95 Z' : i === 1 ? 'M -64 -110 C -60 -175 60 -175 64 -110 C 30 -140 -30 -140 -64 -110 Z' : 'M -66 -100 C -72 -175 72 -175 66 -100 C 40 -135 -40 -135 -66 -100 Z M 40 -160 C 90 -170 110 -130 80 -110 C 70 -130 55 -140 40 -150 Z', fill: s.hair, stroke: INK, 'stroke-width': 6 }, face)
  for (const sd of [-1, 1]) {
    svg('ellipse', { cx: sd * 22, cy: -95, rx: 9, ry: 12, fill: INK }, face)
    svg('circle', { cx: sd * 22 + 3, cy: -100, r: 3, fill: '#fff' }, face)
  }
  svg('path', { d: 'M -14 -58 Q 0 -64 14 -58', fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, face)
  const label = svg('text', { x: 0, y: 120, 'text-anchor': 'middle', 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 34, fill: INK }, g)
  label.textContent = s.name
  const q = svg('text', { x: 0, y: 178, 'text-anchor': 'middle', 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': 64, fill: RED }, g)
  q.textContent = '?'
  return { g, s }
})

// --------------------------------------------------------- titres et tampons

const fx = svg('g', {}, root)
function headline(text, { x = 80, y, size = 150, color = INK, shadow = PINK }) {
  const g = svg('g', {}, fx)
  const glyphs = [...text].map((ch, i) => {
    const gg = svg('g', {}, g)
    const sh = svg('text', { x: 0, y: 0, 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': size, fill: shadow, opacity: 0.85 }, gg)
    const tx = svg('text', { x: 0, y: 0, 'font-family': 'Fraunces Variable', 'font-weight': 900, 'font-size': size, fill: color }, gg)
    sh.textContent = tx.textContent = ch
    return { gg, sh, tx, i }
  })
  // Placement des lettres (mesuré après le chargement des polices).
  let laid = false
  const layout = () => {
    let cx = x
    for (const gl of glyphs) {
      gl.x = cx
      cx += gl.tx.getComputedTextLength() || size * 0.5
    }
    laid = true
  }
  return (t, t0, t1 = Infinity) => {
    if (!laid) layout()
    const out = t1 === Infinity ? 0 : prog(t, t1, 0.18, ease.in3)
    for (const gl of glyphs) {
      const a = prog(t, t0 + gl.i * 0.045, 0.32, ease.back(2.4))
      const vis = a > 0.001 && out < 0.99
      gl.gg.style.display = vis ? '' : 'none'
      if (!vis) continue
      const sq = 1 + 0.25 * Math.sin(Math.PI * clamp((t - t0 - gl.i * 0.045) / 0.32)) * (1 - a)
      gl.gg.setAttribute('transform', `translate(${gl.x} ${y - (1 - a) * 90 - out * 40}) scale(${1 / sq} ${sq})`)
      gl.gg.style.opacity = String(1 - out)
      gl.sh.setAttribute('x', 9)
      gl.sh.setAttribute('y', 9)
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
    // Claque : de 2,6× à 1× en 0,09 s, puis un petit rebond amorti.
    const u = t - t0
    const k = u < 0.09 ? lerp(2.6, 1, ease.in3(u / 0.09)) : 1 + 0.06 * Math.exp(-(u - 0.09) * 14) * Math.cos((u - 0.09) * 40)
    g.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${k})`)
    g.style.opacity = '0.93'
  }
}
const H1 = headline('UN HOMME', { y: 330, size: 150 })
const H1b = headline('MORT.', { y: 490, size: 190, color: RED, shadow: INK })
const S1 = stamp('CONFIDENTIEL', { x: 760, y: 1420, rot: 9, color: RED, size: 72 })
const H2 = headline('FERMÉ À CLÉ.', { y: 330, size: 118 })
const H2b = headline("DE L'INTÉRIEUR.", { x: 60, y: 1600, size: 92, color: RED, shadow: INK })
const S2 = stamp('IMPOSSIBLE', { x: 540, y: 980, rot: -10, color: RED, size: 120 })
const H3 = headline('UN SEUL', { y: 330, size: 150, color: PAPER, shadow: RED })
const H3b = headline('MENT.', { y: 500, size: 200, color: YEL, shadow: RED })

// HUD : numéro de dossier, date, point REC.
const ui = document.getElementById('ui')
ui.innerHTML = `<div class="hud l">DOSSIER N°001 <span class="chip">PIÈCE 1/3</span></div><div class="hud r"><span class="rec"></span> 14.12 · 21:47</div><div class="bar"><span></span></div>`
const chip = ui.querySelector('.chip')
const rec = ui.querySelector('.rec')
const bar = ui.querySelector('.bar span')
const LINES = [
  [0.9, 2.0, 'Un homme <b>mort</b>.'],
  [2.15, 3.15, 'Une porte <b>fermée à clé</b>.'],
  [3.15, 4.15, '<b>De l’intérieur.</b>'],
  [4.3, 5.6, 'Trois suspects. <b>Un seul ment.</b>'],
]

// Transition : une grille de points qui grossit, couvre l'image, puis rétrécit.
const wipe = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 17; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: INK }, wipe), d: (x + y) * 0.012 })
const CUTS = [[2.05, RED], [4.2, YEL]]

// Papier : marbrures, vignette, pli central (une fois) ; poussière (toutes les 2 images).
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

function shakeAt(t) {
  let x = 0, y = 0
  for (const t0 of [1.05, 3.55, 4.95]) {
    if (t < t0 || t > t0 + 0.5) continue
    const k = 18 * Math.exp(-(t - t0) * 9)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 55 + 1)
  }
  return [x, y]
}

function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  for (const p of pages) p.g.style.display = t >= p.t0 && t < p.t1 ? '' : 'none'
  const [sx, sy] = shakeAt(t)
  const zoom = 1 + 0.03 * ((t % 2.1) / 2.1)
  cam.setAttribute('transform', `translate(${540 + sx} ${960 + sy}) scale(${zoom}) translate(-540 -960)`)

  // Page 1 : la chemise s'ouvre (elle bascule et disparaît), le corps apparaît.
  const open = prog(t, 0.35, 0.5, ease.in3)
  cover.setAttribute('transform', `translate(110 380) scale(${1 - open} 1) translate(-110 -380)`)
  cover.style.display = open < 0.99 ? '' : 'none'
  const reveal = prog(t, 0.7, 0.35, ease.back(1.6))
  bodyBg.setAttribute('opacity', reveal)
  bodyBg.nextSibling.setAttribute('opacity', 0.4 * reveal)
  body.setAttribute('opacity', reveal)
  H1(t, 0.9, 1.95)
  H1b(t, 1.05, 1.95)
  S1(t, 1.55, 2.05)

  // Page 2 : la clé tourne, le cercle rouge se trace, « IMPOSSIBLE ».
  H2(t, 2.25, 4.1)
  const turn = prog(t, 2.9, 0.35, ease.back(2))
  key.setAttribute('transform', `translate(205 290) rotate(${-90 * turn})`)
  circle.setAttribute('stroke-dashoffset', 600 * (1 - prog(t, 3.1, 0.4, ease.out3)))
  arrowTxt.setAttribute('opacity', prog(t, 3.3, 0.2))
  H2b(t, 3.15, 4.1)
  S2(t, 3.55, 4.2)

  // Page 3 : les suspects arrivent par en dessous, en rebondissant.
  cards.forEach((c, i) => {
    const a = prog(t, 4.45 + i * 0.12, 0.4, ease.back(2.2))
    const breathe = Math.sin(t * 2.4 + i) * 4
    c.g.setAttribute('transform', `translate(${c.s.x} ${lerp(1500, 1160, a) + breathe}) rotate(${(i - 1) * 4 * a})`)
  })
  H3(t, 4.4)
  H3b(t, 4.6)

  // Transitions en points.
  for (const { el, d } of DOTS) {
    let r = 0
    for (const [c, col] of CUTS) {
      const u = t - (c - 0.22) - d
      if (u > 0 && u < 0.44) {
        r = 95 * Math.sin(Math.PI * (u / 0.44))
        el.setAttribute('fill', col)
      }
    }
    el.setAttribute('r', r.toFixed(1))
  }

  // HUD et barre de légende.
  chip.textContent = t < 2.05 ? 'PIÈCE 1/3' : t < 4.2 ? 'PIÈCE 2/3' : 'PIÈCE 3/3'
  rec.style.opacity = Math.floor(t * 2) % 2 ? '0.2' : '1'
  const L = LINES.find(([a, b]) => t >= a && t < b)
  bar.parentNode.style.visibility = L ? '' : 'hidden'
  if (L) {
    bar.innerHTML = L[2]
    const a = prog(t, L[0], 0.3, ease.back(2))
    bar.parentNode.style.transform = `translate(-50%, ${((1 - a) * 80).toFixed(1)}px) scale(${(0.8 + 0.2 * a).toFixed(3)})`
  }
  ui.classList.toggle('dark', t >= 4.2)

  // Poussière d'impression (renouvelée toutes les deux images).
  const r = rng(Math.floor(t * FPS / 2) + 9)
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
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
