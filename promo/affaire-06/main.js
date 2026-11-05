/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°6 : le faux chirurgien (≈ 45 s, 1080 × 1920)
 * ============================================================================
 *  Style A : motion design 2D vectoriel (SVG). Aplats, ombres douces,
 *  parallaxe, transitions en formes, mots qui claquent, gros sous-titres animés.
 *  Pas de jauge « coupable / non coupable » : le vote reste libre.
 *
 *  1. L'accroche : le bloc opératoire, 3 000 opérations, 22 ans, 0 patient perdu.
 *  2. « Un détail : il n'a jamais été médecin » : le diplôme se déchire.
 *  3. Le box : 5 ans de prison.
 *  4. Le procès : procureur et avocate se répondent.
 *  5. Le vote.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 *  Les instants viennent des voix (timeline.json, voir voix.py) via cues.js.
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

// ------------------------------------------------------------------ la scène

const stage = document.getElementById('stage')
const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, stage)
const defs = svg('defs', {}, root)
const grad = (id, stops, attrs = {}) => {
  const g = svg(attrs.r ? 'radialGradient' : 'linearGradient', { id, ...attrs }, defs)
  for (const [o, c, a = 1] of stops) svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)
}
grad('bloc', [[0, '#0f4a4c'], [1, '#04181a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('lamp', [[0, '#fffbe8', 0.85], [0.4, '#fff2c0', 0.25], [1, '#fff2c0', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('cone', [[0, '#fff6d8', 0.35], [1, '#fff6d8', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('wallBeige', [[0, '#efe3cc'], [1, '#d8c6a4']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('court', [[0, '#27305a'], [1, '#121733']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtRed', [[0, '#5a1f1a'], [1, '#1e0b08']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('courtDark', [[0, '#141a33'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('spot', [[0, '#bcd2ff', 0.35], [1, '#bcd2ff', 0]], { cx: 0.5, cy: 0.35, r: 0.55 })
grad('beam', [[0, '#ffe7b0', 0.45], [1, '#ffe7b0', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('desk', [[0, '#9a6542'], [1, '#6a3f26']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('vignette', [[0.55, '#000', 0], [1, '#000', 0.55]], { cx: 0.5, cy: 0.45, r: 0.75 })

const scenes = []
function scene(id, build) {
  const sec = SEC[id]
  const g = svg('g', {}, root)
  const L = { far: svg('g', {}, g), mid: svg('g', {}, g), actor: svg('g', {}, g), front: svg('g', {}, g), fx: svg('g', {}, g) }
  const s = { ...sec, g, L, ...build(L, sec) }
  scenes.push(s)
  return s
}
const bg = (L, fill) => svg('rect', { x: -600, y: -600, width: W + 1200, height: H + 1200, fill }, L.far)
const desk = (layer, y = 1790) => {
  const g = svg('g', {}, layer)
  svg('rect', { x: -300, y, width: W + 600, height: 500, fill: 'url(#desk)' }, g)
  svg('rect', { x: -300, y: y - 10, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, g)
  return g
}
const ecgPoints = (y0, amp = 1) => {
  const pts = []
  for (let x = -60; x <= W + 60; x += 6) {
    const p = (((x + 60) % 360) + 360) % 360 / 360
    let y = 0
    if (p > 0.42 && p < 0.46) y = -30 * Math.sin(((p - 0.42) / 0.04) * Math.PI)
    if (p > 0.5 && p < 0.53) y = 26 * ((p - 0.5) / 0.03)
    if (p > 0.53 && p < 0.57) y = 26 - 200 * ((p - 0.53) / 0.04)
    if (p > 0.57 && p < 0.61) y = -174 + 224 * ((p - 0.57) / 0.04)
    if (p > 0.61 && p < 0.64) y = 50 - 50 * ((p - 0.61) / 0.03)
    if (p > 0.72 && p < 0.8) y = -40 * Math.sin(((p - 0.72) / 0.08) * Math.PI)
    pts.push(`${x},${y0 + y * amp}`)
  }
  return pts.join(' ')
}

const SURGEON = { robe: '#2aa198', jabot: false, vneck: '#1d7f78', hair: 'cap', cap: '#1f8f88', skin: '#f2c4a0', mask: true, gloves: '#a9dcff', iris: '#3b2a1a', hairColor: '#3a2416' }
const ACCUSED = { robe: '#59626f', jabot: false, collar: '#ffffff', hair: 'slick', hairColor: '#3a2416', skin: '#f2c4a0', iris: '#3b2a1a' }
const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', hair: 'bun', hairColor: '#4a2a18', skin: '#e3a98a', female: true, iris: '#3b5a2a' }

// 1 · Le bloc opératoire.
const BLOC = scene('bloc', (L) => {
  bg(L, 'url(#bloc)')
  // Le scialytique (la lampe du bloc) et son cône de lumière.
  svg('path', { d: 'M 340 160 L 740 160 L 1100 1900 L -20 1900 Z', fill: 'url(#cone)', opacity: 0.5 }, L.far)
  const lamp = svg('g', { transform: 'translate(540 150)' }, L.far)
  svg('circle', { r: 360, fill: 'url(#lamp)' }, lamp)
  svg('ellipse', { rx: 210, ry: 70, fill: '#d9e7e8' }, lamp)
  for (const [x, y] of [[-110, 0], [0, -14], [110, 0], [-55, 30], [55, 30]]) svg('circle', { cx: x, cy: y, r: 30, fill: '#fffbe8' }, lamp)
  svg('rect', { x: -14, y: -260, width: 28, height: 200, fill: '#9fb4b6' }, lamp)
  // Moniteur cardiaque.
  const mon = svg('g', { transform: 'translate(70 520)' }, L.mid)
  svg('rect', { width: 330, height: 220, rx: 22, fill: '#0b1416', stroke: '#2f4a4c', 'stroke-width': 10 }, mon)
  const ecgClip = svg('clipPath', { id: 'monClip' }, defs)
  svg('rect', { x: 80, y: 530, width: 310, height: 200 }, ecgClip)
  const ecgG = svg('g', { 'clip-path': 'url(#monClip)' }, L.mid)
  const ecg = svg('polyline', { points: ecgPoints(650, 0.45), fill: 'none', stroke: '#3dff9a', 'stroke-width': 6, 'stroke-linejoin': 'round' }, ecgG)
  svg('text', { x: 300, y: 590, fill: '#3dff9a', 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 40 }, mon.parentNode).textContent = ''
  const bpm = svg('text', { x: 340, y: 572, fill: '#3dff9a', 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 34, 'text-anchor': 'end' }, L.mid)
  bpm.textContent = '72'
  // Table d'opération au premier plan.
  svg('rect', { x: -200, y: 1760, width: W + 400, height: 400, fill: '#9fc6c8' }, L.front)
  svg('rect', { x: -200, y: 1745, width: W + 400, height: 30, rx: 12, fill: '#d6eef0' }, L.front)
  const actor = makePerson(L.actor, SURGEON)
  return { actor, ecg }
})

// 2 · Le diplôme encadré, qui se déchire.
const DIPLOME = scene('diplome', (L) => {
  bg(L, 'url(#wallBeige)')
  for (let i = 0; i < 12; i++) svg('rect', { x: -200 + i * 120, y: -200, width: 6, height: 2400, fill: '#cdb995', opacity: 0.5 }, L.far)
  const frame = svg('g', { transform: 'translate(540 860)' }, L.mid)
  svg('rect', { x: -380, y: -280, width: 760, height: 560, rx: 18, fill: '#6b4227' }, frame)
  svg('rect', { x: -350, y: -250, width: 700, height: 500, fill: '#fbf6ea' }, frame)
  const halves = [-1, 1].map((sd) => {
    const clip = svg('clipPath', { id: `half${sd}` }, defs)
    svg('path', { d: sd < 0 ? 'M -360 -260 L 20 -260 L -20 -80 L 30 60 L -10 260 L -360 260 Z' : 'M 20 -260 L 360 -260 L 360 260 L -10 260 L 30 60 L -20 -80 Z' }, clip)
    const h = svg('g', {}, frame)
    const inner = svg('g', { 'clip-path': `url(#half${sd})` }, h)
    svg('rect', { x: -350, y: -250, width: 700, height: 500, fill: '#fbf6ea' }, inner)
    svg('rect', { x: -320, y: -220, width: 640, height: 440, fill: 'none', stroke: '#c9a24a', 'stroke-width': 8 }, inner)
    const t1 = svg('text', { x: 0, y: -110, 'text-anchor': 'middle', 'font-family': 'Figtree Variable', 'font-weight': 900, 'font-size': 54, fill: '#2b2b2b' }, inner)
    t1.textContent = 'DIPLÔME D’ÉTAT'
    const t2 = svg('text', { x: 0, y: -30, 'text-anchor': 'middle', 'font-family': 'Figtree Variable', 'font-weight': 700, 'font-size': 40, fill: '#555' }, inner)
    t2.textContent = 'DE DOCTEUR EN MÉDECINE'
    for (let k = 0; k < 3; k++) svg('rect', { x: -220, y: 40 + k * 40, width: 440, height: 10, rx: 5, fill: '#d8d0bd' }, inner)
    svg('circle', { cx: 230, cy: 150, r: 58, fill: '#c9a24a' }, inner)
    svg('circle', { cx: 230, cy: 150, r: 40, fill: '#e1bf63' }, inner)
    return h
  })
  return { halves }
})

// 3 · Le box des accusés.
const BOX = scene('box', (L) => {
  bg(L, 'url(#court)')
  svg('ellipse', { cx: 540, cy: 760, rx: 640, ry: 900, fill: 'url(#spot)' }, L.far)
  for (let i = 0; i < 7; i++) svg('rect', { x: 50 + i * 165, y: 500, width: 12, height: 1500, fill: '#9fe0ff', opacity: 0.14 }, L.front)
  svg('rect', { x: -100, y: 1620, width: W + 200, height: 400, fill: '#1a2147' }, L.front)
  svg('rect', { x: -100, y: 1610, width: W + 200, height: 20, fill: '#3b4a86' }, L.front)
  const actor = makePerson(L.actor, ACCUSED)
  return { actor }
})

// 4 · Le procès : chaque réplique a son plan.
const TRIB = scene('tribunal', (L) => {
  // Deux décors : le côté du procureur (fenêtre, lumière froide) et celui de la défense (chaud).
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
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  const d = desk(L.front)
  // Accessoires des arguments.
  const props = svg('g', {}, L.fx)
  // 3 000 lits (une grille de petits lits qui se remplit).
  const beds = svg('g', {}, props)
  const bedEls = []
  for (let k = 0; k < 40; k++) {
    const b = svg('g', { transform: `translate(${110 + (k % 8) * 120} ${330 + Math.floor(k / 8) * 92})` }, beds)
    svg('rect', { x: -44, y: -14, width: 88, height: 30, rx: 10, fill: '#e6f1ff' }, b)
    svg('circle', { cx: -26, cy: -20, r: 16, fill: '#f2c4a0' }, b)
    svg('rect', { x: -10, y: -26, width: 56, height: 18, rx: 8, fill: '#7fb7ff' }, b)
    bedEls.push(b)
  }
  // Dé (la chance).
  const dice = svg('g', {}, props)
  svg('rect', { x: -90, y: -90, width: 180, height: 180, rx: 34, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10 }, dice)
  for (const [x, y] of [[-45, -45], [45, 45], [0, 0], [45, -45], [-45, 45]]) svg('circle', { cx: x, cy: y, r: 17, fill: '#10121a' }, dice)
  // Blouse blanche.
  const coat = svg('g', {}, props)
  svg('path', { d: 'M -120 -170 L -40 -200 L 0 -150 L 40 -200 L 120 -170 L 170 160 L 60 170 L 0 -80 L -60 170 L -170 160 Z', fill: '#ffffff', stroke: '#10121a', 'stroke-width': 10, 'stroke-linejoin': 'round' }, coat)
  svg('path', { d: 'M -40 -200 L 0 -60 L 40 -200', fill: 'none', stroke: '#10121a', 'stroke-width': 8 }, coat)
  svg('rect', { x: 50, y: 20, width: 60, height: 50, rx: 8, fill: '#e6f1ff', stroke: '#10121a', 'stroke-width': 6 }, coat)
  // La balance : un papier contre un cœur.
  const scale = svg('g', {}, props)
  svg('rect', { x: -10, y: -40, width: 20, height: 300, fill: '#e1bf63' }, scale)
  svg('rect', { x: -110, y: 250, width: 220, height: 30, rx: 12, fill: '#e1bf63' }, scale)
  const beamG = svg('g', {}, scale)
  svg('rect', { x: -300, y: -50, width: 600, height: 20, rx: 10, fill: '#e1bf63' }, beamG)
  const panL = svg('g', {}, beamG)
  const panR = svg('g', {}, beamG)
  for (const [pan, x] of [[panL, -280], [panR, 280]]) {
    svg('path', { d: `M ${x} -40 L ${x - 70} 90 M ${x} -40 L ${x + 70} 90`, stroke: '#e1bf63', 'stroke-width': 6 }, pan)
    svg('path', { d: `M ${x - 100} 90 Q ${x} 150 ${x + 100} 90 Z`, fill: '#e1bf63' }, pan)
  }
  svg('rect', { x: -330, y: 30, width: 100, height: 64, rx: 6, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 6, transform: 'rotate(-6 -280 60)' }, panL)
  svg('path', { d: 'M 280 92 C 220 40 230 -10 280 20 C 330 -10 340 40 280 92 Z', fill: '#ff4d5e', stroke: '#10121a', 'stroke-width': 6 }, panR)
  // Électrocardiogramme (cas désespérés).
  const ecg = svg('polyline', { points: ecgPoints(560, 0.8), fill: 'none', stroke: '#ff6b78', 'stroke-width': 10, 'stroke-linejoin': 'round' }, props)
  ecg.setAttribute('stroke-dasharray', 4000)
  return { procBg, avoBg, proc, avo, desk: d, bedEls, dice, coat, scale, beamG, panL, panR, ecg }
})

// 5 · Le vote : l'accusé seul dans le noir.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  for (let i = 0; i < 7; i++) svg('rect', { x: 50 + i * 165, y: 600, width: 12, height: 1500, fill: '#9fe0ff', opacity: 0.1 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  const actor = makePerson(L.actor, ACCUSED)
  return { actor }
})

// Transitions : disque, bande, flash.
const fxTop = svg('g', {}, root)
const iris = svg('circle', { cx: 540, cy: 960, r: 0, fill: '#e5484d' }, fxTop)
const band = svg('rect', { x: -3000, y: -400, width: 900, height: 3200, fill: '#ffd166', transform: 'rotate(18)' }, fxTop)
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
const n1 = (id) => C.line(id)
// Accroche.
const counter = tag('<span class="num">0</span><span class="unit">OPÉRATIONS</span>', 'counter', { t0: Wd('01', '3') - 0.1, t1: SEC.bloc.t1, y: 300, from: 1.3 })
const c0 = Wd('01', '3') - 0.1
counter.update = (t) => {
  const v = Math.round(3000 * ease.out3(clamp((t - c0) / 0.7)))
  counter.el.querySelector('.num').textContent = v.toLocaleString('fr-FR').replace(/ /g, ' ')
}
tag('22 ANS DE CARRIÈRE', 'pill', { t0: Wd('01', '22') - 0.1, t1: SEC.bloc.t1, y: 470, rot: -2 })
tag('0 PATIENT PERDU', 'stamp green', { t0: Wd('01', 'perdu') - 0.1, t1: SEC.bloc.t1, y: 610, rot: -6, from: 2.6, dur: 0.22 })
tag('UN DÉTAIL…', 'pill small', { t0: S('02') - 0.05, t1: SEC.diplome.t1, y: 300 })
tag('FAUX', 'stamp', { t0: Wd('02', 'jamais') - 0.05, t1: SEC.diplome.t1, y: 860, rot: -14, from: 3, dur: 0.2 }).el.style.fontSize = '230px'
tag('CE MATIN', 'pill small', { t0: S('03') - 0.05, t1: SEC.box.t1, y: 300 })
tag('5 ANS<br>DE PRISON', 'stamp', { t0: Wd('03', '5') - 0.1, t1: SEC.box.t1, y: 480, rot: -6, from: 2.6, dur: 0.22 }).el.style.cssText += 'text-align:center;line-height:1.02'
// Procès.
tag('3 000 PATIENTS ENDORMIS', 'pill', { t0: Wd('04', '3') - 0.1, t1: E('04'), y: 250 })
tag('AUCUNE NE SAVAIT', 'pill red', { t0: Wd('04', 'aucune') - 0.1, t1: E('04'), y: 830, rot: -2 })
tag('Et aucune ne s’est réveillée pour s’en plaindre.', 'quote', { t0: S('05') + 0.05, t1: E('05') + 0.2, y: 420, from: 1.3 })
tag('UN DON ?', 'pill yellow', { t0: Wd('06', 'don') - 0.1, t1: E('06'), y: 280, rot: -3 })
tag('DE LA CHANCE', 'pill red', { t0: Wd('06', 'chance') - 0.1, t1: E('06'), y: 400, rot: 2 })
tag('22 ANS<br>DE CHANCE ?', 'big', { t0: Wd('07', '22') - 0.1, t1: Wd('07', 'quand') - 0.05, y: 380, from: 1.4 }).el.style.cssText += 'text-align:center;line-height:1'
tag('LES CAS DÉSESPÉRÉS', 'pill red', { t0: Wd('07', 'desespere') - 0.1, t1: Wd('07', 'pas') - 0.1, y: 330, rot: -2 })
tag('PAS LES DIPLÔMÉS.', 'slam white', { t0: Wd('07', 'pas') - 0.08, t1: E('07') + 0.15, y: 330, rot: -3, from: 2.2, dur: 0.2 })
tag('LUI.', 'slam yellow', { t0: Wd('07', 'lui', 1) - 0.06, t1: E('07') + 0.15, y: 520, rot: 3, from: 3, dur: 0.18 })
tag('N’IMPORTE QUI', 'pill red', { t0: Wd('08', 'nimporte') - 0.1, t1: E('08'), y: 300, rot: -2 })
tag('UN BOUT DE PAPIER', 'pill', { t0: Wd('09', 'papier') - 0.2, t1: E('09') + 0.2, y: 240, x: 330, rot: -3 })
tag('LEUR VIE', 'pill red', { t0: Wd('09', 'vie') - 0.1, t1: E('09') + 0.2, y: 240, x: 820, rot: 3 })
// Vote.
tag('TU ES LE JURÉ', 'big white', { t0: Wd('10', 'jure') - 0.15, y: 330, from: 1.4, dur: 0.5 })
tag('COUPABLE', 'vote red', { t0: Wd('10', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('10', 'non') - 0.1, y: 720, rot: 3 })
tag('Et toi, tu l’aurais laissé t’opérer ?', 'pill yellow', { t0: Wd('10', 'et') - 0.1, y: 880, from: 1.2 }).el.style.fontSize = '50px'

// Qui parle.
const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés : 3 mots au plus, le mot prononcé dans un bloc de couleur.
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines) {
  const mine = []
  let cur = null
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 3 || /[,.:;?!…]$/.test(line.words[i - 1]?.w ?? '')) mine.push((cur = { words: [], who: line.who }))
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
    w.el.textContent = w.w.replace(/…/g, '…')
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
      w.el.style.opacity = s > 0 ? '1' : '0.0'
      w.el.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)}) rotate(${((1 - s) * -6).toFixed(1)}deg)`
      w.el.classList.toggle('on', t >= w.t - 0.05 && t < w.next - 0.05)
    }
  }
}

// ------------------------------------------------------------------ l'instant t

const IMPACTS = [
  [Wd('01', 'perdu'), 10],
  [Wd('02', 'jamais'), 18],
  [Wd('03', '5'), 14],
  [Wd('07', 'lui', 1), 16],
  [S('09'), 10],
]
function shakeAt(t) {
  let x = 0,
    y = 0
  for (const [t0, a] of IMPACTS) {
    if (t < t0 || t > t0 + 0.6) continue
    const k = a * Math.exp(-(t - t0) * 8)
    x += k * Math.sin((t - t0) * 70)
    y += k * Math.sin((t - t0) * 53 + 1)
  }
  return [x + 2 * Math.sin(t * 1.3), y + 2 * Math.sin(t * 1.1 + 1)]
}
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02 } = {}) {
  const [sx, sy] = shakeAt(t)
  const z = zoom * (1 + push * (t - s.t0))
  const par = (k) => `translate(${540 + sx * k} ${cy + sy * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}

// Le procès, réplique par réplique : qui est à l'écran, quel accessoire.
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
function trialShot(t) {
  const cur = [...TLINES].reverse().find((l) => t >= l.start - 0.2) ?? TLINES[0]
  return cur
}

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === BLOC) {
    const punch = prog(t, Wd('01', 'perdu') - 0.15, 0.3, ease.out3)
    cam(BLOC, t, { zoom: lerp(1.0, 1.15, punch), cy: lerp(960, 900, punch), push: 0.03 })
    BLOC.actor.update(t, { x: 540, y: 1160, scale: 1.4, brows: 'determined', look: [0.2, -0.3], armR: [0.5, 2.0 + 0.1 * Math.sin(t * 3)], armL: [0.5, 2.0 + 0.1 * Math.sin(t * 3 + 1)], seed: 0.2, headTilt: 0.03 * Math.sin(t) })
    BLOC.ecg.setAttribute('transform', `translate(${-((t * 260) % 360)} 0)`)
  }
  if (cur === DIPLOME) {
    const z = prog(t, DIPLOME.t0, 1.4, ease.out3)
    cam(DIPLOME, t, { zoom: lerp(1.0, 1.25, z), cy: 900, push: 0.02 })
    const rip = prog(t, Wd('02', 'jamais') - 0.05, 0.5, ease.out3)
    DIPLOME.halves.forEach((h, i) => {
      const sd = i ? 1 : -1
      h.setAttribute('transform', `translate(${sd * 90 * rip} ${30 * rip}) rotate(${sd * 9 * rip})`)
    })
  }
  if (cur === BOX) {
    cam(BOX, t, { zoom: 1.05, cy: 960, push: 0.05 })
    const hit = prog(t, Wd('03', '5') - 0.05, 0.4, ease.out3)
    BOX.actor.update(t, { x: 540, y: 1200, scale: 1.4, brows: 'sad', look: [-0.3, 0.3 + 0.4 * hit], headNod: 0.25 * hit, blink: 0.3 * hit, armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 1.1 })
  }
  if (cur === TRIB) {
    const l = trialShot(t)
    const isProc = l.who === 'procureur'
    TRIB.procBg.setAttribute('display', isProc ? 'inline' : 'none')
    TRIB.avoBg.setAttribute('display', isProc ? 'none' : 'inline')
    TRIB.proc.root.setAttribute('display', isProc ? 'inline' : 'none')
    TRIB.avo.root.setAttribute('display', isProc ? 'none' : 'inline')
    const t0 = l.start - 0.2
    // Coup de zoom sur la dernière phrase de chaque réplique.
    const last = l.words.findLast((w, i) => i > 0 && /[.!?]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.18, punch), cy: lerp(980, 900, punch), push: 0.025, cx: 540 })
    const sp = speaking(l.who, t)
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540,
      y: 1150,
      scale: 1.4,
      mouth: m,
      brows: isProc ? (l.id.startsWith('08') ? 'angry' : 'determined') : l.id.startsWith('09') || l.id.startsWith('07') ? 'angry' : 'determined',
      look: [0, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * beat : 0), 1.0 + (sp ? 0.3 * beat : 0)],
      armL: [0.25 + (sp ? 0.1 * beat : 0), 1.2 + (sp ? 0.25 * Math.sin(t * 4.1) : 0)],
      point: false,
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.04 * Math.sin(t * 1.2),
    })
    // Accessoires.
    const in04 = t >= Wd('04', '3') - 0.1 && t < E('04')
    TRIB.bedEls.forEach((b, k) => {
      const s = in04 ? popS(t, Wd('04', '3') + k * 0.035, E('04') - 0.2, 0.25) : 0
      b.setAttribute('opacity', Math.min(1, s))
      const [x, y] = b.getAttribute('transform').match(/[-\d.]+/g).slice(0, 2)
      b.setAttribute('transform', `translate(${x} ${y}) scale(${Math.max(0.001, s)})`)
    })
    const ds = t >= Wd('06', 'chance') - 0.1 && t < E('06') ? popS(t, Wd('06', 'chance') - 0.1, E('06') - 0.15, 0.3) : 0
    TRIB.dice.setAttribute('transform', `translate(780 640) rotate(${(t - Wd('06', 'chance')) * 400 * Math.exp(-(t - Wd('06', 'chance')) * 2)}) scale(${Math.max(0.001, ds * 0.9)})`)
    const cs = t >= Wd('08', 'blouse') - 0.15 && t < E('08') + 0.1 ? popS(t, Wd('08', 'blouse') - 0.15, E('08'), 0.3) : 0
    TRIB.coat.setAttribute('transform', `translate(780 560) rotate(-6) scale(${Math.max(0.001, cs * 0.6)})`)
    const ss = t >= Wd('09', 'papier') - 0.2 && t < E('09') + 0.25 ? popS(t, Wd('09', 'papier') - 0.2, E('09') + 0.1, 0.3) : 0
    const tilt = lerp(0, -12, prog(t, Wd('09', 'vie') - 0.1, 0.5, ease.back(1.6)))
    TRIB.scale.setAttribute('transform', `translate(540 500) scale(${Math.max(0.001, ss * 0.55)})`)
    TRIB.beamG.setAttribute('transform', `rotate(${tilt})`)
    TRIB.panL.setAttribute('transform', `rotate(${-tilt} -280 -40)`)
    TRIB.panR.setAttribute('transform', `rotate(${-tilt} 280 -40)`)
    const ed = t >= Wd('07', 'desespere') - 0.2 && t < Wd('07', 'pas') - 0.05
    TRIB.ecg.setAttribute('display', ed ? 'inline' : 'none')
    TRIB.ecg.setAttribute('stroke-dashoffset', 4000 * (1 - prog(t, Wd('07', 'desespere') - 0.2, 0.6, ease.io3)))
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
  let bx = -3000
  for (const s of wipes) {
    const k = t - s.t0
    if (k > -0.25 && k < 0.3) bx = lerp(-1600, 2200, ease.io3(clamp((k + 0.25) / 0.55)))
  }
  band.setAttribute('x', bx)
  // Coupe entre deux répliques du procès : petit disque rouge.
  let ir = 0
  for (const l of TLINES.slice(1)) {
    const k = t - (l.start - 0.2)
    if (k > -0.14 && k < 0.16) ir = k < 0 ? lerp(0, 1400, ease.in3(clamp((k + 0.14) / 0.14))) : lerp(1400, 0, ease.out3(clamp(k / 0.16)))
  }
  iris.setAttribute('r', ir)
  iris.setAttribute('fill', '#ffd166')

  // Texte.
  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCATE DE LA DÉFENSE') : ''
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
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }

if (!new URLSearchParams(location.search).has('render')) {
  ready.then(() => {
    const audio = new Audio('../build/affaire-06/audio.wav')
    let t0 = null
    document.body.addEventListener('click', () => {
      t0 = performance.now()
      audio.currentTime = 0
      audio.play()
    })
    const loop = () => {
      seek(t0 ? (performance.now() - t0) / 1000 : 0)
      requestAnimationFrame(loop)
    }
    loop()
  })
}
