/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°7 : la fausse avocate
 * ============================================================================
 *  Style A (celui du faux chirurgien) : motion design 2D vectoriel en SVG.
 *
 *  Le hook (≈ 9 s), pensé pour accrocher même sans le son :
 *  1. « 47 victoires » : dès la première image, elle plaide sous un projecteur
 *     doré ; le compteur s'emballe, 47 tampons verts « GAGNÉ » recouvrent le
 *     fond en accélérant, puis coup de zoom sur son sourire.
 *  2. « Elle a raté l'examen. Trois fois. » : coupure au noir, la feuille de
 *     résultats, trois tampons rouges « RECALÉE ».
 *  3. « Jugée dans la salle même où elle plaidait » : le même plan qu'à 0 s ;
 *     un volet la fait passer de la robe d'avocate à la tenue d'accusée, la
 *     lumière vire au bleu, les barreaux du box tombent.
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

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('gold', [[0, '#6b4513'], [1, '#1e1206']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('cold', [[0, '#1f2b55'], [1, '#070b1c']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spotGold', [[0, '#ffd98a', 0.65], [0.5, '#ffb84d', 0.18], [1, '#ffb84d', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('spotCold', [[0, '#bcd2ff', 0.5], [0.5, '#7fa6ff', 0.14], [1, '#7fa6ff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('beamGold', [[0, '#ffe2a0', 0.55], [1, '#ffe2a0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('beamCold', [[0, '#cfe0ff', 0.5], [1, '#cfe0ff', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
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

const LAWYER = { robe: '#15171f', jabot: true, hair: 'bun', hairColor: '#3a2014', female: true, skin: '#f0c19c', iris: '#3b5a2a' }
const ACCUSED = { robe: '#7c8696', jabot: false, collar: '#e9edf5', hair: 'bun', hairColor: '#3a2014', female: true, skin: '#f0c19c', iris: '#3b5a2a' }

// La salle d'audience vue en contre-plongée (dorée ou froide).
function courtroom(layer, warm) {
  const g = svg('g', {}, layer)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: warm ? 'url(#gold)' : 'url(#cold)' }, g)
  // Plafond à caissons en perspective (lignes qui fuient vers le haut).
  for (let k = -6; k <= 6; k++) svg('path', { d: `M ${540 + k * 60} -200 L ${540 + k * 260} 760`, stroke: warm ? '#8a5a1c' : '#2c3a6e', 'stroke-width': 8, opacity: 0.6 }, g)
  for (let k = 0; k < 5; k++) svg('rect', { x: -400, y: -100 + k * 150 - k * k * 6, width: W + 800, height: 6, fill: warm ? '#8a5a1c' : '#2c3a6e', opacity: 0.5 }, g)
  // Colonnes et hautes fenêtres.
  for (const x of [80, 1000]) {
    svg('rect', { x: x - 70, y: 300, width: 140, height: 1700, fill: warm ? '#4a2c0c' : '#18224a' }, g)
    svg('rect', { x: x - 40, y: 300, width: 24, height: 1700, fill: warm ? '#7a4c1a' : '#2c3a6e', opacity: 0.8 }, g)
    svg('rect', { x: x - 100, y: 280, width: 200, height: 40, rx: 8, fill: warm ? '#7a4c1a' : '#2c3a6e' }, g)
  }
  svg('path', { d: 'M 360 760 L 360 300 A 180 180 0 0 1 720 300 L 720 760 Z', fill: warm ? '#ffcf7a' : '#5d77c0', opacity: warm ? 0.45 : 0.35 }, g)
  svg('path', { d: 'M 540 120 L 540 760 M 360 470 L 720 470', stroke: warm ? '#4a2c0c' : '#18224a', 'stroke-width': 16 }, g)
  // La balance de la justice au-dessus de la fenêtre.
  const sc = svg('g', { transform: 'translate(540 90) scale(0.55)' }, g)
  svg('rect', { x: -8, y: -20, width: 16, height: 160, fill: '#e1bf63' }, sc)
  svg('rect', { x: -170, y: -30, width: 340, height: 16, rx: 8, fill: '#e1bf63' }, sc)
  for (const x of [-150, 150]) svg('path', { d: `M ${x - 60} 60 Q ${x} 100 ${x + 60} 60 Z M ${x} -20 L ${x - 50} 60 M ${x} -20 L ${x + 50} 60`, fill: '#e1bf63', stroke: '#e1bf63', 'stroke-width': 4 }, sc)
  // Le faisceau du projecteur et son halo.
  svg('path', { d: 'M 420 -100 L 660 -100 L 1100 1900 L -20 1900 Z', fill: warm ? 'url(#beamGold)' : 'url(#beamCold)', opacity: 0.55 }, g)
  svg('circle', { cx: 540, cy: 900, r: 820, fill: warm ? 'url(#spotGold)' : 'url(#spotCold)' }, g)
  // Le banc des avocats (premier plan).
  return g
}

// 1 · Elle plaide : 47 tampons « GAGNÉ ».
const PLAIDE = scene('plaide', (L) => {
  courtroom(L.far, true)
  // Les tampons verts (dans le fond, derrière elle).
  const r = rng(47)
  const stamps = []
  for (let k = 0; k < 47; k++) {
    const g = svg('g', {}, L.mid)
    svg('rect', { x: -150, y: -52, width: 300, height: 104, rx: 18, fill: 'rgba(255,255,255,0.9)', stroke: '#12a150', 'stroke-width': 12 }, g)
    txt(g, 'GAGNÉ', { x: 0, y: 26, 'font-size': 72, fill: '#12a150' })
    // Répartis sur tout l'écran, en évitant un peu le centre au début.
    const x = 60 + r() * 960
    const y = 470 + r() * 1150
    stamps.push({ g, x, y, rot: -25 + r() * 50, s: 0.7 + r() * 0.5 })
  }
  // Le pupitre au premier plan.
  const desk = svg('g', {}, L.front)
  svg('rect', { x: -300, y: 1720, width: W + 600, height: 400, fill: '#5a3410' }, desk)
  svg('rect', { x: -300, y: 1705, width: W + 600, height: 30, rx: 10, fill: '#a8743a' }, desk)
  const actor = makePerson(L.actor, LAWYER)
  return { stamps, actor }
})

// 2 · La feuille de résultats : « RECALÉE », trois fois.
const EXAMEN = scene('examen', (L) => {
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#0b0d14' }, L.far)
  svg('circle', { cx: 540, cy: 900, r: 800, fill: '#2a2f45', opacity: 0.6 }, L.far)
  const sheet = svg('g', {}, L.mid)
  svg('rect', { x: -400, y: -560, width: 800, height: 1120, rx: 10, fill: '#fbf8f0' }, sheet)
  svg('rect', { x: -400, y: -560, width: 800, height: 150, rx: 10, fill: '#1d2a5c' }, sheet)
  txt(sheet, 'EXAMEN D’ENTRÉE', { x: 0, y: -490, 'font-size': 52, fill: '#fff' })
  txt(sheet, 'AU BARREAU · RÉSULTATS', { x: 0, y: -435, 'font-size': 36, fill: '#ffd166' })
  const rows = []
  const names = ['A. BERNARD', 'C. DUVAL', 'M. LAURENT', 'S. PETIT', 'T. ROUX', 'J. MOREAU', 'L. GIRARD']
  names.forEach((n, i) => {
    const y = -320 + i * 110
    const me = i === 2
    const hi = svg('rect', { x: -370, y: y - 50, width: 740, height: 80, rx: 10, fill: '#ffd166', opacity: 0 }, sheet)
    svg('text', { x: -340, y, 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 38, fill: '#1d2a5c' }, sheet).textContent = n
    svg('rect', { x: -60, y: y - 10, width: 200, height: 6, fill: '#d8d0bd' }, sheet)
    svg('text', { x: 340, y, 'text-anchor': 'end', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 38, fill: me ? '#e5484d' : '#12a150' }, sheet).textContent = me ? 'AJOURNÉE' : 'ADMIS'
    rows.push({ hi, me })
  })
  // Trois tampons rouges, avec l'année.
  const rec = ['2017', '2018', '2019'].map((year, k) => {
    const g = svg('g', {}, L.fx)
    svg('rect', { x: -260, y: -80, width: 520, height: 160, rx: 26, fill: 'rgba(255,255,255,0.85)', stroke: '#e5484d', 'stroke-width': 16 }, g)
    txt(g, 'RECALÉE', { x: 0, y: 30, 'font-size': 112, fill: '#e5484d' })
    txt(g, year, { x: 0, y: 128, 'font-size': 44, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 10, 'paint-order': 'stroke fill' })
    return { g, x: [360, 720, 540][k], y: [620, 880, 1150][k], rot: [-12, 9, -5][k] }
  })
  return { sheet, rows, rec }
})

// 3 · La même salle : robe d'avocate → tenue d'accusée, les barreaux tombent.
const BOX = scene('box', (L) => {
  // Deux versions de la même image, la froide révélée par un volet diagonal.
  const warm = svg('g', {}, L.far)
  courtroom(warm, true)
  const lawyer = makePerson(L.actor, LAWYER)
  const coldClip = svg('clipPath', { id: 'coldClip' }, defs)
  const clipPoly = svg('polygon', { points: '' }, coldClip)
  const coldFar = svg('g', { 'clip-path': 'url(#coldClip)' }, L.actor)
  courtroom(coldFar, false)
  const coldActor = svg('g', { 'clip-path': 'url(#coldClip)' }, L.actor)
  const accused = makePerson(coldActor, ACCUSED)
  // Le liseré lumineux du volet.
  const edge = svg('polygon', { fill: '#ffffff', opacity: 0.9 }, L.actor)
  // Les barreaux du box.
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)' }, bars)
  svg('rect', { x: -100, y: 260, width: W + 200, height: 28, rx: 14, fill: 'url(#bar)' }, bars)
  // Le rebord du box.
  const ledge = svg('g', {}, L.front)
  svg('rect', { x: -100, y: 1680, width: W + 200, height: 400, fill: '#1a2147' }, ledge)
  svg('rect', { x: -100, y: 1668, width: W + 200, height: 24, fill: '#3b4a86' }, ledge)
  const desk = svg('g', {}, L.front)
  svg('rect', { x: -300, y: 1720, width: W + 600, height: 400, fill: '#5a3410' }, desk)
  svg('rect', { x: -300, y: 1705, width: W + 600, height: 30, rx: 10, fill: '#a8743a' }, desk)
  return { lawyer, accused, clipPoly, edge, bars, ledge, desk }
})

// Transitions.
const fxTop = svg('g', {}, root)
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
const black = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0 }, fxTop)
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

// Le compteur de victoires : visible dès la première image.
const C0 = Wd('01', '47') - 0.05
const C1 = Wd('01', 'pas') - 0.1
const counter = tag('<span class="num">0</span><span class="unit">VICTOIRE</span>', 'counter', { t0: 0, t1: SEC.plaide.t1 - 0.05, y: 290 })
const STAMP_T = Array.from({ length: 47 }, (_, k) => C0 + 0.15 + (C1 - C0 - 0.15) * (k / 46) ** 0.65)
counter.update = (t) => {
  const n = STAMP_T.filter((x) => t >= x).length
  counter.el.querySelector('.num').textContent = String(n)
  counter.el.querySelector('.unit').textContent = n > 1 ? 'VICTOIRES' : 'VICTOIRE'
}
// Petit coup à chaque tampon.
counter.kick = (t) => {
  const last = STAMP_T.filter((x) => t >= x).at(-1)
  return last === undefined ? 1 : 1 + 0.12 * Math.exp(-(t - last) * 25)
}
fs(tag('0 DÉFAITE', 'stamp green', { t0: Wd('01', 'defaite') - 0.1, t1: SEC.plaide.t1 - 0.05, y: 540, rot: -6, from: 2.6, dur: 0.22 }), 96)
tag('UN DÉTAIL…', 'pill small', { t0: S('02') - 0.05, t1: SEC.examen.t1, y: 230 })
tag('LA MÊME SALLE ↓', 'pill yellow', { t0: Wd('03', 'salle') - 0.1, t1: SEC.box.t1, y: 300, rot: -3 })
fs(tag('ACCUSÉE', 'stamp', { t0: Wd('03', 'plaidait') - 0.05, t1: SEC.box.t1, y: 470, rot: -6, from: 2.6, dur: 0.22 }), 130)

// Gros sous-titres animés : 3 mots au plus, le mot prononcé dans un bloc de couleur.
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines) {
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

const REC_T = [Wd('02', 'trois') - 0.05, Wd('02', 'trois') + 0.22, Wd('02', 'fois') + 0.05]
const T_SWAP = Wd('03', 'jugee') - 0.15
const IMPACTS = [
  ...STAMP_T.map((x) => [x, 3]),
  [Wd('01', 'defaite') - 0.1, 12],
  ...REC_T.map((x) => [x, 16]),
  [T_SWAP + 0.35, 10],
  [Wd('03', 'plaidait') - 0.05, 14],
]
function shakeAt(t) {
  let x = 0
  let y = 0
  for (const [t0, a] of IMPACTS) {
    if (t < t0 || t > t0 + 0.5) continue
    const k = a * Math.exp(-(t - t0) * 10)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 53 + 1)
  }
  return [x + 2 * Math.sin(t * 1.3), y + 2 * Math.sin(t * 1.1 + 1)]
}
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02 } = {}) {
  const [sx, sy] = shakeAt(t)
  const z = zoom * (1 + push * (t - s.t0))
  const par = (k) => `translate(${540 + sx * k} ${960 + sy * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}
// La pose de plaidoirie : bras droit levé, index tendu, bras gauche ouvert.
const pleading = (t, extra = {}) => ({
  x: 540,
  y: 1240,
  scale: 1.55,
  brows: 'determined',
  look: [0.15, -0.35],
  mouth: 0.35 + 0.3 * Math.max(0, Math.sin(t * 9)) * Math.max(0, Math.sin(t * 3.1)),
  armR: [2.75 + 0.08 * Math.sin(t * 4), 0.2 + 0.12 * Math.sin(t * 4 + 1)],
  armL: [0.9 + 0.1 * Math.sin(t * 3), 0.9],
  point: true,
  seed: 0.3,
  headTilt: -0.06 + 0.03 * Math.sin(t * 2),
  ...extra,
})

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === PLAIDE) {
    // Contre-plongée qui pousse, puis coup de zoom sur le visage (« pas une seule défaite »).
    const punch = prog(t, Wd('01', 'pas') - 0.1, 0.3, ease.out3)
    cam(PLAIDE, t, { zoom: lerp(1.06, 1.5, punch), cx: lerp(540, 525, punch), cy: lerp(980, 860, punch), push: 0.03 })
    PLAIDE.stamps.forEach((st, k) => {
      const t0 = STAMP_T[k]
      const u = t - t0
      const on = u >= 0
      st.g.setAttribute('display', on ? 'inline' : 'none')
      if (!on) return
      const sc = u < 0.08 ? lerp(2.4, 1, ease.in3(u / 0.08)) : 1 + 0.05 * Math.exp(-(u - 0.08) * 14) * Math.cos((u - 0.08) * 40)
      place(st.g, st.x, st.y, sc * st.s, st.rot)
    })
    const smile = prog(t, Wd('01', 'pas') - 0.1, 0.3)
    PLAIDE.actor.update(t, pleading(t, smile > 0 ? { mouth: 0, brows: 'determined', look: [0, -0.1], armR: [lerp(2.75, 1.2, smile), lerp(0.2, 1.2, smile)] } : {}))
  }
  if (cur === EXAMEN) {
    const z = prog(t, EXAMEN.t0, 1.2, ease.out3)
    cam(EXAMEN, t, { zoom: lerp(1.0, 1.12, z), cy: 960, push: 0.02 })
    place(EXAMEN.sheet, 540, 980, 1, -2 + 2 * z)
    const hi = prog(t, Wd('02', 'rate') - 0.1, 0.25)
    EXAMEN.rows.forEach((r) => r.hi.setAttribute('opacity', r.me ? hi * 0.9 : 0))
    EXAMEN.rec.forEach((r, k) => {
      const u = t - REC_T[k]
      r.g.setAttribute('display', u >= 0 ? 'inline' : 'none')
      if (u < 0) return
      const sc = u < 0.09 ? lerp(2.8, 1, ease.in3(u / 0.09)) : 1 + 0.06 * Math.exp(-(u - 0.09) * 14) * Math.cos((u - 0.09) * 40)
      place(r.g, r.x, r.y, sc, r.rot)
    })
  }
  if (cur === BOX) {
    // Même plan qu'à 0 s, puis le volet diagonal (de gauche à droite).
    const sw = prog(t, T_SWAP, 0.45, ease.io3)
    cam(BOX, t, { zoom: lerp(1.06, 1.0, sw), cy: 980, push: 0.02 })
    const x = lerp(-700, 1500, sw)
    BOX.clipPoly.setAttribute('points', `-900,-900 ${x + 300},-900 ${x - 300},2900 -900,2900`)
    BOX.edge.setAttribute('points', `${x + 300},-900 ${x + 330},-900 ${x - 270},2900 ${x - 300},2900`)
    BOX.edge.setAttribute('opacity', sw > 0 && sw < 1 ? 0.9 : 0)
    BOX.lawyer.update(t, pleading(t))
    BOX.lawyer.root.setAttribute('display', sw < 1 ? 'inline' : 'none')
    const hit = prog(t, T_SWAP + 0.3, 0.5, ease.out3)
    BOX.accused.update(t, { x: 540, y: 1240, scale: 1.55, brows: 'sad', look: [-0.2, 0.25 + 0.3 * hit], headNod: 0.15 * hit, armR: [0.1, 0.7], armL: [0.1, 0.7], seed: 1.4 })
    // Les barreaux tombent, rebondissent.
    const fall = prog(t, T_SWAP + 0.35, 0.35, ease.back(1.4))
    BOX.bars.setAttribute('transform', `translate(0 ${lerp(-2300, 0, fall)})`)
    BOX.ledge.setAttribute('display', sw > 0.5 ? 'inline' : 'none')
    BOX.desk.setAttribute('display', sw > 0.5 ? 'none' : 'inline')
  }

  // Transitions : flash blanc, et une coupure au noir avant l'examen.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, 0.35 * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  const k = t - (SEC.examen.t0 - 0.12)
  black.setAttribute('opacity', k > 0 && k < 0.12 ? 1 : 0)

  updateTags(t)
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
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
