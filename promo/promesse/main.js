/**
 * ============================================================================
 *  « Affaire Classée ? » — la promesse (1080 × 1920)
 * ============================================================================
 *  Elle a débranché son mari, dans le coma depuis trois ans. Il le lui avait
 *  fait promettre. Leur fille l'accuse de meurtre. Style A (motion design 2D
 *  en SVG), gros sous-titres animés, pas de jauge.
 *
 *  Le hook :
 *  1. La chambre d'hôpital, 3 h du matin : un grand électrocardiogramme vert
 *     traverse l'écran, le soufflet du respirateur monte et descend, il pleut.
 *     Sa main avance vers l'interrupteur… le tracé devient plat, l'écran
 *     vire au rouge. Gros plan sur son visage, une larme.
 *  2. Trois ans en accéléré : le jour et la nuit défilent à la fenêtre, la
 *     fleur éclot et fane, les pages du calendrier s'envolent, le compteur
 *     monte à 1095 jours. Puis la lettre s'écrit : « laisse-moi partir ».
 *  3. La photo de famille se déchire entre la mère et la fille, qui la pointe
 *     du doigt : « ACCUSÉE DE MEURTRE ».
 *  Le procès : contre-champs, gestes, panoramiques filés, un schéma animé par
 *  argument. Au milieu, un carton « ABONNE-TOI » ; puis le vote et un second
 *  appel à s'abonner.
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

const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'bun', hairColor: '#5a3218', female: true, skin: '#f0c19c', iris: '#3b5a2a' }
const WIFE = { robe: '#7a5c8a', jabot: false, collar: '#f2efe8', hair: 'bob', hairColor: '#8d7d74', female: true, skin: '#efc6a6', iris: '#4a3a2a' }
const WIFE_BOX = { ...WIFE, robe: '#6b7280', collar: '#e5e7eb' }
const FILLE = { robe: '#c2703d', jabot: false, collar: '#f6efe2', hair: 'bob', hairColor: '#2a1810', female: true, skin: '#eebd9a', iris: '#2b1d12' }
const PERE = { robe: '#3d5a80', jabot: false, collar: '#f2efe8', hair: 'short', hairColor: '#b9bec6', skin: '#e8bb98', iris: '#3b2a1a' }
grad('roomNight', [[0, '#0a1226'], [1, '#0f1d38']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('roomWarm', [[0, '#5a4630'], [1, '#2a1f16']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('paperG', [[0, '#fbf6ea'], [1, '#efe5cf']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('redGlow', [[0, '#ff3b4f', 0.55], [1, '#ff3b4f', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('greenGlow', [[0, '#3dff9a', 0.35], [1, '#3dff9a', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })

// Un battement de cœur : écart vertical pour une phase p ∈ [0, 1).
function beatY(p) {
  if (p < 0.1) return -14 * Math.sin((p / 0.1) * Math.PI)
  if (p > 0.16 && p < 0.2) return 18 * ((p - 0.16) / 0.04)
  if (p >= 0.2 && p < 0.25) return 18 - 190 * ((p - 0.2) / 0.05)
  if (p >= 0.25 && p < 0.31) return -172 + 232 * ((p - 0.25) / 0.06)
  if (p >= 0.31 && p < 0.35) return 60 - 60 * ((p - 0.31) / 0.04)
  if (p > 0.45 && p < 0.62) return -34 * Math.sin(((p - 0.45) / 0.17) * Math.PI)
  return 0
}
// Tracé d'électrocardiogramme qui défile vers la gauche ; plat pour tout ce qui est « émis » après tFlat.
function ecgPath(t, { y0, x0 = 0, x1 = W, amp = 1, speed = 520, bpm = 66, tFlat = Infinity }) {
  const per = 60 / bpm
  let d = ''
  for (let x = x0; x <= x1; x += 6) {
    const te = t - (x1 - x) / speed
    const y = te >= tFlat ? 0 : beatY((((te / per) % 1) + 1) % 1)
    d += `${x === x0 ? 'M' : 'L'} ${x} ${(y0 + y * amp).toFixed(1)} `
  }
  return d
}

// La chambre d'hôpital (utilisée de nuit, puis en accéléré sur trois ans).
function room(L, { warm = false } = {}) {
  bg(L, warm ? 'url(#roomWarm)' : 'url(#roomNight)')
  const r = rng(31)
  // La fenêtre : ciel, astre, pluie.
  const win = svg('g', { transform: 'translate(90 330)' }, L.far)
  const sky = svg('rect', { width: 380, height: 470, rx: 14, fill: '#071022' }, win)
  const orb = svg('circle', { cx: 270, cy: 110, r: 46, fill: '#f4efd8' }, win)
  const city = svg('g', {}, win)
  for (let i = 0; i < 9; i++) {
    const h = 60 + r() * 150
    svg('rect', { x: i * 44, y: 470 - h, width: 40, height: h, fill: '#0c1830' }, city)
    for (let k = 0; k < 4; k++) if (r() < 0.5) svg('rect', { x: i * 44 + 8 + (k % 2) * 16, y: 470 - h + 12 + Math.floor(k / 2) * 26, width: 9, height: 12, fill: '#ffd166', opacity: 0.7 }, city)
  }
  const rain = Array.from({ length: 16 }, () => ({ el: svg('line', { stroke: '#9fc6ff', 'stroke-width': 3, opacity: 0.45 }, win), x: r() * 380, ph: r() }))
  svg('rect', { width: 380, height: 470, rx: 14, fill: 'none', stroke: warm ? '#8a6a48' : '#2a3a66', 'stroke-width': 16 }, win)
  svg('path', { d: 'M 190 0 L 190 470 M 0 235 L 380 235', stroke: warm ? '#8a6a48' : '#2a3a66', 'stroke-width': 10 }, win)
  // L'horloge numérique.
  const clock = svg('g', { transform: 'translate(760 420)', display: warm ? 'none' : 'inline' }, L.far)
  svg('rect', { x: -170, y: -80, width: 340, height: 160, rx: 22, fill: '#05070d', stroke: '#2a3a66', 'stroke-width': 8 }, clock)
  const clockTxt = svg('text', { x: 0, y: 40, 'text-anchor': 'middle', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 112, fill: '#ff3b4f' }, clock)
  clockTxt.textContent = '03:00'
  // Le moniteur cardiaque sur son pied.
  const mon = svg('g', { transform: 'translate(560 760)' }, L.mid)
  svg('rect', { x: -8, y: 100, width: 16, height: 300, fill: '#3a4666' }, mon)
  svg('rect', { x: -150, y: -100, width: 300, height: 200, rx: 20, fill: '#060b12', stroke: '#3a4666', 'stroke-width': 10 }, mon)
  const clipId = `mon${warm ? 'w' : 'n'}`
  const mc = svg('clipPath', { id: clipId }, defs)
  svg('rect', { x: -138, y: -88, width: 276, height: 176, rx: 12 }, mc)
  const monG = svg('g', { 'clip-path': `url(#${clipId})` }, mon)
  const monTrace = svg('path', { fill: 'none', stroke: '#3dff9a', 'stroke-width': 5, 'stroke-linejoin': 'round' }, monG)
  const monBpm = svg('text', { x: 124, y: -44, 'text-anchor': 'end', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 40, fill: '#3dff9a' }, mon)
  // La perfusion.
  const iv = svg('g', { transform: 'translate(150 900)' }, L.mid)
  svg('rect', { x: -5, y: -60, width: 10, height: 420, fill: '#3a4666' }, iv)
  svg('path', { d: 'M -40 -60 L 40 -60', stroke: '#3a4666', 'stroke-width': 10, 'stroke-linecap': 'round' }, iv)
  svg('rect', { x: 14, y: -50, width: 54, height: 90, rx: 14, fill: '#cfe8ff', opacity: 0.75 }, iv)
  svg('path', { d: 'M 41 40 L 41 110 Q 41 200 110 240', fill: 'none', stroke: '#cfe8ff', 'stroke-width': 4, opacity: 0.7 }, iv)
  const drop = svg('circle', { cx: 41, r: 6, fill: '#cfe8ff' }, iv)
  // Le respirateur : soufflet, voyant, interrupteur.
  const vent = svg('g', { transform: 'translate(890 1110)' }, L.mid)
  svg('rect', { x: -120, y: -170, width: 240, height: 400, rx: 22, fill: '#1b2540', stroke: '#3a4666', 'stroke-width': 8 }, vent)
  svg('rect', { x: -84, y: -140, width: 168, height: 170, rx: 14, fill: '#0a1020', stroke: '#5a6a96', 'stroke-width': 5 }, vent)
  const bellows = svg('g', {}, vent)
  const folds = Array.from({ length: 5 }, () => svg('rect', { x: -60, width: 120, height: 14, rx: 7, fill: '#7fd1ff' }, bellows))
  const led = svg('circle', { cx: -70, cy: 70, r: 14, fill: '#3dff9a' }, vent)
  svg('rect', { x: -20, y: 46, width: 110, height: 150, rx: 16, fill: '#0a1020', stroke: '#5a6a96', 'stroke-width': 5 }, vent)
  const sw = svg('g', { transform: 'translate(35 120)' }, vent)
  const swKnob = svg('rect', { x: -30, y: -52, width: 60, height: 60, rx: 12, fill: '#ff3b4f', stroke: '#10121a', 'stroke-width': 5 }, sw)
  // Le tuyau vers le masque.
  const tube = svg('path', { d: 'M 770 1020 C 620 900 420 980 330 1110', fill: 'none', stroke: '#9fc6ff', 'stroke-width': 12, 'stroke-linecap': 'round', opacity: 0.8 }, L.mid)
  // Le lit et le patient (au premier plan).
  const bed = svg('g', {}, L.front)
  svg('rect', { x: 60, y: 1010, width: 40, height: 380, rx: 12, fill: '#56637f' }, bed)
  svg('rect', { x: 60, y: 1190, width: 720, height: 150, rx: 20, fill: '#56637f' }, bed)
  svg('rect', { x: 80, y: 1120, width: 690, height: 110, rx: 30, fill: '#e9eef7' }, bed)
  svg('ellipse', { cx: 230, cy: 1120, rx: 130, ry: 48, fill: '#ffffff' }, bed)
  // La tête de profil, le masque.
  svg('ellipse', { cx: 250, cy: 1076, rx: 62, ry: 54, fill: '#e8bb98' }, bed)
  svg('path', { d: 'M 196 1060 C 196 1020 300 1010 306 1056 C 280 1040 230 1040 196 1060 Z', fill: '#b9bec6' }, bed)
  svg('path', { d: 'M 296 1070 q 30 4 34 30 q -20 14 -44 4 Z', fill: '#cfe8ff', opacity: 0.85, stroke: '#9fc6ff', 'stroke-width': 3 }, bed)
  svg('path', { d: 'M 262 1070 q 10 -6 20 0', fill: 'none', stroke: '#5a3a2a', 'stroke-width': 4, 'stroke-linecap': 'round' }, bed)
  const chest = svg('path', { fill: '#b9cdea' }, bed)
  svg('rect', { x: 60, y: 1330, width: 24, height: 90, fill: '#3a4666' }, bed)
  svg('rect', { x: 740, y: 1330, width: 24, height: 90, fill: '#3a4666' }, bed)
  // Le grand tracé qui traverse l'écran.
  const glow = svg('path', { fill: 'none', stroke: '#3dff9a', 'stroke-width': 26, opacity: 0.18, 'stroke-linejoin': 'round' }, L.fx)
  const trace = svg('path', { fill: 'none', stroke: '#3dff9a', 'stroke-width': 9, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, L.fx)
  // tFlat : instant où la machine est coupée (Infinity = elle tourne).
  function update(t, { tFlat = Infinity, big = true, clockStr = '03:00', day = null } = {}) {
    const dead = t >= tFlat
    const col = dead ? '#ff3b4f' : '#3dff9a'
    monTrace.setAttribute('d', ecgPath(t, { y0: 10, x0: -138, x1: 138, amp: 0.38, speed: 150, tFlat }))
    monTrace.setAttribute('stroke', t > tFlat + 1.6 ? '#ff3b4f' : '#3dff9a')
    monBpm.textContent = t > tFlat + 1.6 ? '---' : dead ? String(Math.max(0, Math.round(66 * (1 - (t - tFlat) / 1.6)))) : '66'
    monBpm.setAttribute('fill', t > tFlat + 1.6 ? '#ff3b4f' : '#3dff9a')
    trace.setAttribute('display', big ? 'inline' : 'none')
    glow.setAttribute('display', big ? 'inline' : 'none')
    if (big) {
      const d = ecgPath(t, { y0: 900, amp: 1.25, tFlat })
      trace.setAttribute('d', d)
      glow.setAttribute('d', d)
      const flatAll = t > tFlat + W / 520
      trace.setAttribute('stroke', flatAll ? '#ff3b4f' : col === '#ff3b4f' ? '#ffb347' : '#3dff9a')
      glow.setAttribute('stroke', flatAll ? '#ff3b4f' : '#3dff9a')
    }
    // Le soufflet monte et descend tant que la machine tourne (il s'affaisse ensuite).
    const stopK = dead ? Math.max(0, 1 - (t - tFlat) / 0.5) : 1
    const br = dead ? 0 : (Math.sin(t * 2.4) + 1) / 2
    const hgt = lerp(40, 130, br) * stopK + 30 * (1 - stopK)
    folds.forEach((f, k) => f.setAttribute('y', 10 - ((k + 1) / 5) * hgt))
    led.setAttribute('fill', dead ? '#3a4666' : '#3dff9a')
    swKnob.setAttribute('y', dead ? -8 : -52)
    swKnob.setAttribute('fill', dead ? '#6b1a22' : '#ff3b4f')
    chest.setAttribute('d', `M 300 1140 Q 480 ${1100 - 26 * br * stopK} 760 1150 L 760 1230 L 300 1230 Z`)
    const dp = (t * 0.9) % 1
    drop.setAttribute('cy', 44 + dp * 60)
    drop.setAttribute('opacity', dead ? 0.3 : 1 - dp)
    clockTxt.textContent = Math.floor(t * 2) % 2 ? clockStr.replace(':', ' ') : clockStr
    // Le ciel : nuit pluvieuse, ou cycle jour/nuit accéléré (day ∈ [0, 1) = phase du jour).
    if (day === null) {
      sky.setAttribute('fill', '#071022')
      orb.setAttribute('cx', 270)
      orb.setAttribute('cy', 110)
      orb.setAttribute('fill', '#f4efd8')
      for (const q of rain) {
        const u = (t * 1.6 + q.ph) % 1
        q.el.setAttribute('x1', q.x - u * 30)
        q.el.setAttribute('y1', u * 470)
        q.el.setAttribute('x2', q.x - u * 30 - 8)
        q.el.setAttribute('y2', u * 470 + 34)
        q.el.setAttribute('display', 'inline')
      }
      city.setAttribute('opacity', 1)
    } else {
      const sun = day < 0.5
      const a = (sun ? day : day - 0.5) * 2 * Math.PI
      sky.setAttribute('fill', sun ? '#7fb7ff' : '#0a1226')
      orb.setAttribute('cx', 190 - Math.cos(a) * 170)
      orb.setAttribute('cy', 300 - Math.sin(a) * 240)
      orb.setAttribute('fill', sun ? '#ffd166' : '#f4efd8')
      for (const q of rain) q.el.setAttribute('display', 'none')
      city.setAttribute('opacity', sun ? 0.45 : 1)
    }
  }
  return { update, tube }
}

// 1 · Trois heures du matin : elle débranche.
const NUIT = scene('nuit', (L) => {
  const R = room(L)
  const redWash = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#redGlow)', opacity: 0 }, L.fx)
  // Sa main, qui entre par la droite vers l'interrupteur.
  const hand = svg('g', {}, L.fx)
  svg('path', { d: 'M 60 0 L 700 -60', stroke: '#7a5c8a', 'stroke-width': 110, 'stroke-linecap': 'round' }, hand)
  svg('ellipse', { cx: 20, cy: 0, rx: 70, ry: 54, fill: '#efc6a6' }, hand)
  svg('rect', { x: -90, y: -22, width: 110, height: 34, rx: 17, fill: '#efc6a6' }, hand)
  for (let k = 0; k < 3; k++) svg('rect', { x: -50, y: 16 + k * 20, width: 70, height: 18, rx: 9, fill: '#e3b48f' }, hand)
  svg('circle', { cx: 30, cy: 30, r: 12, fill: 'none', stroke: '#f2c45a', 'stroke-width': 6 }, hand)
  // Gros plan sur son visage, éclairé par le moniteur.
  const face = svg('g', { display: 'none' }, L.fx)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#070a14' }, face)
  const faceGlow = svg('circle', { cx: 540, cy: 900, r: 900, fill: 'url(#redGlow)' }, face)
  const wife = makePerson(face, WIFE)
  const faceTrace = svg('path', { fill: 'none', stroke: '#ff3b4f', 'stroke-width': 9 }, face)
  return { R, redWash, hand, face, faceGlow, wife, faceTrace }
})

// 2 · Trois ans de coma en accéléré, puis la promesse écrite.
const PROMESSE = scene('promesse', (L) => {
  const R = room(L, { warm: true })
  // Elle, assise à son chevet (derrière le lit).
  const sit = svg('g', {}, L.actor)
  const wife = makePerson(sit, WIFE)
  // Le vase sur la table de chevet : la fleur éclot et fane, en boucle.
  const vase = svg('g', { transform: 'translate(900 1560)' }, L.front)
  svg('rect', { x: -110, y: 0, width: 220, height: 260, rx: 10, fill: '#6a4a30' }, vase)
  svg('path', { d: 'M -34 0 L -24 -110 L 24 -110 L 34 0 Z', fill: '#9fd8ff', opacity: 0.8 }, vase)
  const stem = svg('path', { fill: 'none', stroke: '#3f8a4a', 'stroke-width': 8, 'stroke-linecap': 'round' }, vase)
  const petals = svg('g', {}, vase)
  for (let k = 0; k < 6; k++) svg('ellipse', { cx: 0, cy: -26, rx: 13, ry: 26, fill: '#ff8fb1', transform: `rotate(${k * 60})` }, petals)
  svg('circle', { r: 12, fill: '#ffd166' }, petals)
  // Les pages du calendrier qui s'envolent.
  const pages = Array.from({ length: 14 }, (_, k) => {
    const g = svg('g', {}, L.fx)
    svg('rect', { x: -60, y: -70, width: 120, height: 140, rx: 10, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 5 }, g)
    svg('rect', { x: -60, y: -70, width: 120, height: 36, rx: 10, fill: '#e5484d' }, g)
    const n = txt(g, String(((k * 7) % 30) + 1), { x: 0, y: 40, 'font-size': 64, fill: '#10121a' })
    return { g, n, ph: k / 14 }
  })
  // La lettre.
  const letter = svg('g', { display: 'none' }, L.fx)
  svg('rect', { x: -800, y: -1200, width: W + 1600, height: H + 2400, fill: '#1a130c', opacity: 0.82 }, letter)
  const sheet = svg('g', {}, letter)
  svg('rect', { x: -400, y: -330, width: 800, height: 660, rx: 8, fill: '#000', opacity: 0.4, transform: 'translate(16 22)' }, sheet)
  svg('rect', { x: -400, y: -330, width: 800, height: 660, rx: 8, fill: 'url(#paperG)' }, sheet)
  svg('path', { d: 'M -400 -110 L 400 -110 M -400 110 L 400 110', stroke: '#d9cdb0', 'stroke-width': 3 }, sheet)
  const hw = { 'font-family': 'Fraunces Variable, serif', 'font-style': 'italic', 'font-weight': 600, fill: '#1c2a6b', 'text-anchor': 'middle' }
  const lines = ['Si un jour je ne suis', 'plus qu’un corps,', 'laisse-moi partir.'].map((s, k) => {
    const el = svg('text', { x: 0, y: -170 + k * 110, 'font-size': 72, ...hw }, sheet)
    el.textContent = s
    return el
  })
  const cid = 'letterClip'
  const clip = svg('clipPath', { id: cid }, defs)
  const rows = lines.map((_, k) => svg('rect', { x: -380, y: -250 + k * 110, width: 0, height: 120 }, clip))
  for (const l of lines) l.setAttribute('clip-path', `url(#${cid})`)
  const sign = svg('text', { x: 240, y: 250, 'font-size': 64, ...hw, opacity: 0 }, sheet)
  sign.textContent = 'Paul'
  svg('path', { d: 'M 150 268 Q 250 290 340 262', fill: 'none', stroke: '#1c2a6b', 'stroke-width': 5, opacity: 0.8 }, sheet)
  // Les deux alliances posées sur la lettre.
  for (const [x, c] of [[-270, '#f2c45a'], [-220, '#e8b84a']]) svg('circle', { cx: x, cy: 240, r: 36, fill: 'none', stroke: c, 'stroke-width': 12 }, sheet)
  return { R, sit, wife, stem, petals, pages, letter, sheet, rows, sign }
})

// 3 · La photo de famille se déchire : leur fille l'accuse.
const FILLE_S = scene('fille', (L) => {
  bg(L, '#0b0d14')
  svg('circle', { cx: 540, cy: 900, r: 820, fill: '#232a40', opacity: 0.7 }, L.far)
  const halves = [-1, 1].map((sd) => {
    const id = `tear${sd}`
    const c = svg('clipPath', { id }, defs)
    const jag = 'L 120 -330 L 90 -250 L 140 -170 L 100 -90 L 150 -10 L 110 70 L 160 150 L 120 230 L 150 330'
    svg('path', { d: `M ${sd * 460} -330 ${jag} L ${sd * 460} 330 Z` }, c)
    const h = svg('g', {}, L.mid)
    const inner = svg('g', { 'clip-path': `url(#${id})` }, h)
    svg('rect', { x: -460, y: -330, width: 920, height: 660, fill: '#f7f1e3' }, inner)
    svg('rect', { x: -430, y: -300, width: 860, height: 560, fill: sd < 0 ? '#bcd3ea' : '#bcd3ea' }, inner)
    svg('rect', { x: -430, y: 110, width: 860, height: 150, fill: '#8fb37a' }, inner)
    const tint = svg('rect', { x: -430, y: -300, width: 860, height: 560, fill: sd < 0 ? '#2f6bff' : '#ff2a3d', opacity: 0 }, inner)
    return { h, inner, tint, sd }
  })
  // Le père et la mère à gauche ; la fille à droite (retournée vers eux).
  const pere = makePerson(halves[0].inner, PERE)
  const mere = makePerson(halves[0].inner, WIFE)
  const fw = svg('g', {}, halves[1].inner)
  const fille = makePerson(fw, FILLE)
  for (const hf of halves) {
    hf.inner.append(hf.tint)
    svg('rect', { x: -460, y: 260, width: 920, height: 70, fill: '#f7f1e3' }, hf.inner)
    svg('rect', { x: -430, y: -300, width: 860, height: 560, fill: 'none', stroke: '#f7f1e3', 'stroke-width': 10 }, hf.inner)
  }
  return { halves, pere, mere, fille, fw }
})

// 4 · Le procès.
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
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  // Le carton « abonne-toi » du milieu.
  const pauseBg = svg('g', {}, L.far)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#10121a' }, pauseBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.08 }, pauseBg)
  const rays = svg('g', { transform: 'translate(540 1000)' }, pauseBg)
  for (let k = 0; k < 12; k++) svg('path', { d: 'M 0 0 L -90 -1600 L 90 -1600 Z', fill: '#fe2c55', opacity: 0.16, transform: `rotate(${k * 30})` }, rays)
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
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  const panel = (g, w = 820, h = 360) => svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 8 }, g)
  // 04 : le moniteur à plat.
  let flatTrace
  const flat = prop((g) => {
    svg('rect', { x: -400, y: -170, width: 800, height: 340, rx: 26, fill: '#060b12', stroke: '#3a4666', 'stroke-width': 10 }, g)
    flatTrace = svg('path', { fill: 'none', stroke: '#ff3b4f', 'stroke-width': 9, 'stroke-linejoin': 'round' }, g)
    txt(g, '03:04', { x: 290, y: -100, 'font-size': 52, fill: '#ff3b4f', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  })
  // 05 : la lettre, qui s'écrit au fil de la voix.
  let letterRows = []
  const letter = prop((g) => {
    svg('rect', { x: -360, y: -210, width: 720, height: 420, rx: 8, fill: 'url(#paperG)', stroke: '#10121a', 'stroke-width': 5 }, g)
    const hw = { 'font-family': 'Fraunces Variable, serif', 'font-style': 'italic', 'font-weight': 600, fill: '#1c2a6b', 'text-anchor': 'middle' }
    const c = svg('clipPath', { id: 'letter2' }, defs)
    ;['Si un jour je ne suis', 'plus qu’un corps,', 'laisse-moi partir.'].forEach((s, k) => {
      const el = svg('text', { x: 0, y: -90 + k * 86, 'font-size': 60, ...hw, 'clip-path': 'url(#letter2)' }, g)
      el.textContent = s
      letterRows.push(svg('rect', { x: -340, y: -150 + k * 86, width: 0, height: 96 }, c))
    })
    const sg = svg('text', { x: 230, y: 180, 'font-size': 50, ...hw }, g)
    sg.textContent = 'Paul'
  })
  // 06 : la main serrée.
  let squeeze
  const hands = prop((g) => {
    panel(g, 760, 360)
    svg('path', { d: 'M -340 40 L -120 30', stroke: '#e9eef7', 'stroke-width': 90, 'stroke-linecap': 'round' }, g)
    svg('path', { d: 'M 340 -10 L 120 10', stroke: '#c2703d', 'stroke-width': 90, 'stroke-linecap': 'round' }, g)
    svg('ellipse', { cx: -50, cy: 26, rx: 90, ry: 60, fill: '#e8bb98', stroke: '#10121a', 'stroke-width': 5 }, g)
    squeeze = svg('g', {}, g)
    svg('ellipse', { cx: 30, cy: 10, rx: 90, ry: 62, fill: '#eebd9a', stroke: '#10121a', 'stroke-width': 5 }, squeeze)
    for (let k = 0; k < 4; k++) svg('rect', { x: -70 + k * 34, y: -50, width: 28, height: 70, rx: 14, fill: '#e8bb98', stroke: '#10121a', 'stroke-width': 4 }, squeeze)
    g.pulse = [0, 1, 2].map((k) => svg('path', { d: `M ${-20 + k * 30} -110 l 0 -40`, stroke: '#ffd166', 'stroke-width': 9, 'stroke-linecap': 'round', transform: `rotate(${-20 + k * 20} 0 0)` }, g))
  })
  // 07 : 1095 visites contre 11.
  let barA, barB, numA, numB
  const bars = prop((g) => {
    panel(g, 860, 400)
    txt(g, 'ELLE', { x: -390, y: -80, 'font-size': 44, fill: '#ffffff', 'text-anchor': 'start' })
    txt(g, 'SA FILLE', { x: -390, y: 100, 'font-size': 44, fill: '#ffffff', 'text-anchor': 'start' })
    barA = svg('rect', { x: -390, y: -60, width: 0, height: 64, rx: 14, fill: '#ffd166' }, g)
    barB = svg('rect', { x: -390, y: 120, width: 0, height: 64, rx: 14, fill: '#e5484d' }, g)
    numA = txt(g, '0', { x: 390, y: -80, 'font-size': 56, fill: '#ffd166', 'text-anchor': 'end' })
    numB = txt(g, '0', { x: 390, y: 100, 'font-size': 56, fill: '#e5484d', 'text-anchor': 'end' })
  })
  // 09 : le traitement du lendemain.
  const tomorrow = prop((g) => {
    svg('rect', { x: -230, y: -220, width: 460, height: 440, rx: 26, fill: '#ffffff', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -230, y: -220, width: 460, height: 110, rx: 26, fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 8 }, g)
    txt(g, 'DEMAIN · 8 H', { x: 0, y: -146, 'font-size': 52, fill: '#fff' })
    txt(g, 'TRAITEMENT', { x: 0, y: -20, 'font-size': 56, fill: '#10121a' })
    txt(g, 'N°4', { x: 0, y: 110, 'font-size': 130, fill: '#3b82f6' })
  })
  // 10 : quatre flacons, trois échecs.
  const vials = prop((g) => {
    g.x = []
    for (let k = 0; k < 4; k++) {
      const v = svg('g', { transform: `translate(${-330 + k * 220} 0)` }, g)
      svg('rect', { x: -60, y: -110, width: 120, height: 240, rx: 22, fill: '#cfe8ff', stroke: '#10121a', 'stroke-width': 7 }, v)
      svg('rect', { x: -60, y: 10, width: 120, height: 120, rx: 22, fill: k < 3 ? '#9aa3b5' : '#3b82f6' }, v)
      svg('rect', { x: -44, y: -150, width: 88, height: 50, rx: 10, fill: '#10121a' }, v)
      txt(v, `N°${k + 1}`, { x: 0, y: -30, 'font-size': 40, fill: '#10121a' })
      if (k < 3) g.x.push(svg('path', { d: 'M -70 -120 L 70 140 M 70 -120 L -70 140', stroke: '#e5484d', 'stroke-width': 22, 'stroke-linecap': 'round', opacity: 0 }, v))
      else g.q = txt(v, '?', { x: 0, y: 110, 'font-size': 110, fill: '#ffffff' })
    }
  })
  // 11 : seule, la nuit.
  const night = prop((g) => {
    panel(g, 760, 380)
    svg('circle', { cx: -240, cy: -60, r: 70, fill: '#f4efd8' }, g)
    svg('circle', { cx: -210, cy: -80, r: 62, fill: '#10121a' }, g)
    const ct = svg('text', { x: 90, y: 40, 'text-anchor': 'middle', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 150, fill: '#ff3b4f' }, g)
    ct.textContent = '03:00'
  })
  // 13 : le code pénal.
  const code = prop((g) => {
    svg('rect', { x: -220, y: -280, width: 440, height: 560, rx: 18, fill: '#7a1a20', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -190, y: -250, width: 380, height: 500, rx: 10, fill: 'none', stroke: '#f2c45a', 'stroke-width': 6 }, g)
    txt(g, 'CODE', { x: 0, y: -60, 'font-size': 96, fill: '#f2c45a', 'font-family': 'Fraunces Variable, serif' })
    txt(g, 'PÉNAL', { x: 0, y: 50, 'font-size': 96, fill: '#f2c45a', 'font-family': 'Fraunces Variable, serif' })
    svg('path', { d: 'M -60 130 L 60 130', stroke: '#f2c45a', 'stroke-width': 8 }, g)
  })
  return { procBg, avoBg, hotBg, hotFill, pauseBg, rays, crowd, proc, avo, deskG, flat, get flatTrace() { return flatTrace }, letter, letterRows, hands, get squeeze() { return squeeze }, bars, get barA() { return barA }, get barB() { return barB }, get numA() { return numA }, get numB() { return numB }, tomorrow, vials, night, code }
})

// 5 · Le vote : elle, seule, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, WIFE_BOX)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.8 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  return { actor }
})

// Transitions.
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

// Les instants clés du hook.
const T_OFF = Wd('01', 'debranche') + 0.12 // elle coupe la machine
const T_FACE = Math.min(T_OFF + 1.0, SEC.nuit.t1 - 1.0) // gros plan sur son visage
const T_LET = Wd('02', 'il', 1) - 0.15 // la lettre
const T_TEAR = Wd('03', 'fille') - 0.1 // la photo se déchire

// Le hook.
fs(tag('DÉBRANCHÉ', 'stamp', { t0: T_OFF + 0.05, t1: T_FACE - 0.05, y: 300, rot: -8, from: 3, dur: 0.2 }), 130)
tag('03:04 · SON CŒUR S’ARRÊTE', 'pill red', { t0: T_FACE + 0.1, t1: SEC.nuit.t1, y: 260, rot: -2 })
counterTag(SEC.promesse.t0 + 0.1, T_LET - 0.05, 1095, 'JOURS DE COMA', { y: 250, dur: Math.max(0.6, T_LET - SEC.promesse.t0 - 0.3) })
tag('SA PROMESSE', 'pill yellow', { t0: Wd('02', 'promettre') - 0.1, t1: SEC.promesse.t1, y: 330, rot: -3 })
tag('LEUR PROPRE FILLE', 'pill', { t0: T_TEAR, t1: SEC.fille.t1, y: 260, rot: -2 })
const acc = fs(tag('ACCUSÉE<br>DE MEURTRE', 'stamp', { t0: Wd('03', 'meurtre') - 0.05, t1: SEC.fille.t1, y: 430, rot: -6, from: 2.8, dur: 0.2 }), 96)
acc.el.style.cssText += 'text-align:center;line-height:1.02'
// Le procès.
fs(tag('IL NE POUVAIT PLUS DIRE NON.', 'slam white', { t0: Wd('04', 'pouvait') - 0.06, t1: E('04') + 0.1, y: 280, rot: -2, from: 2.4, dur: 0.2 }), 68)
fs(tag('IL AVAIT DIT OUI.', 'slam yellow', { t0: Wd('05', 'oui') - 0.06, t1: E('05') + 0.1, y: 250, rot: -3, from: 2.6, dur: 0.2 }), 104)
tag('PAR ÉCRIT', 'pill', { t0: Wd('05', 'ecrit') - 0.1, t1: E('05') + 0.1, y: 400, rot: 2 })
tag('PROMESSE TENUE', 'pill yellow', { t0: Wd('05', 'tenu') - 0.1, t1: E('05') + 0.1, y: 1010, rot: -2 })
tag('UNE PROMESSE DE 10 ANS', 'pill', { t0: Wd('06', '10') - 0.3, t1: Wd('06', '12') - 0.1, y: 240, rot: -2 })
tag('12 JOURS AVANT SA MORT', 'pill red', { t0: Wd('06', '12') - 0.1, t1: E('06') + 0.1, y: 240, rot: -2 })
fs(tag('IL A SERRÉ SA MAIN.', 'slam white', { t0: Wd('06', 'serre') - 0.06, t1: E('06') + 0.1, y: 390, rot: -2, from: 2.4, dur: 0.2 }), 84)
const rf = fs(tag('RÉFLEXE', 'stamp', { t0: Wd('07', 'reflexe') - 0.05, t1: Wd('07', 'pendant') - 0.1, y: 300, rot: -6, from: 2.8, dur: 0.2 }), 120)
rf.el.style.color = '#3b82f6'
rf.el.style.borderColor = '#3b82f6'
tag('3 MÉDECINS L’ONT ÉCRIT', 'pill', { t0: Wd('07', 'medecins') - 0.1, t1: Wd('07', 'pendant') - 0.1, y: 470, rot: 2 })
tag('CHAQUE JOUR. 3 ANS.', 'pill yellow', { t0: Wd('07', 'pendant') - 0.1, t1: E('07') + 0.1, y: 250, rot: -2 })
// Le carton du milieu : abonne-toi.
fs(tag('AVANT LA SUITE…', 'big white', { t0: S('08') - 0.05, t1: E('08') + 0.1, y: 700, from: 1.4, dur: 0.3 }), 104)
const sub1 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('08', 'abonnetoi') - 0.1, t1: E('08') + 0.1, y: 980, from: 2.2, dur: 0.25 })
sub1.el.style.fontSize = '108px'
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('08', 'verdict') - 0.1, t1: E('08') + 0.1, y: 1200 }), 46)
// Suite du procès.
tag('1095 JOURS…', 'pill small', { t0: S('09') - 0.05, t1: Wd('09', 'nouveau') - 0.1, y: 230 })
fs(tag('…ET PAS UN DE PLUS ?', 'slam white', { t0: Wd('09', 'attendre') - 0.1, t1: Wd('09', 'nouveau') - 0.1, y: 360, rot: -2, from: 2.4, dur: 0.2 }), 84)
tag('LE LENDEMAIN MATIN', 'pill red', { t0: Wd('09', 'lendemain') - 0.1, t1: E('09') + 0.1, y: 250, rot: -2 })
tag('LE 4ᵉ TRAITEMENT', 'pill', { t0: S('10') - 0.05, t1: Wd('10', 'combien') - 0.1, y: 230, rot: -2 })
fs(tag('3 ÉCHECS', 'stamp', { t0: Wd('10', 'echoue') - 0.05, t1: Wd('10', 'combien') - 0.1, y: 390, rot: -8, from: 2.8, dur: 0.2 }), 100)
fs(tag('COMBIEN D’ESSAIS ?', 'slam yellow', { t0: Wd('10', 'combien') - 0.06, t1: E('10') + 0.1, y: 280, rot: -3, from: 2.4, dur: 0.2 }), 92)
tag('TANT QU’IL RESPIRE', 'pill', { t0: Wd('11', 'tant') - 0.1, t1: Wd('11', 'seule') - 0.1, y: 250, rot: -2 })
fs(tag('SEULE.', 'slam white', { t0: Wd('11', 'seule') - 0.06, t1: E('11') + 0.1, y: 240, x: 290, rot: -4, from: 2.6, dur: 0.18 }), 110)
fs(tag('LA NUIT.', 'slam white', { t0: Wd('11', 'nuit') - 0.06, t1: E('11') + 0.1, y: 240, x: 760, rot: 3, from: 2.6, dur: 0.18 }), 110)
tag('SANS PRÉVENIR PERSONNE', 'pill red', { t0: Wd('11', 'sans') - 0.06, t1: E('11') + 0.1, y: 400, rot: -2 })
tag('3 ANS À SON CHEVET', 'pill yellow', { t0: Wd('12', 'chevet') - 0.3, t1: Wd('12', 'elle', 1) - 0.1, y: 250, rot: -2 })
fs(tag('ELLE NE LUI A PAS PRIS LA VIE.', 'slam white', { t0: Wd('12', 'pris') - 0.2, t1: E('12') + 0.15, y: 250, rot: -2, from: 2.2, dur: 0.2 }), 62)
const rendu = fs(tag('ELLE LUI A RENDU<br>SA MORT.', 'slam yellow', { t0: Wd('12', 'rendu') - 0.1, t1: E('12') + 0.15, y: 450, rot: -3, from: 2.6, dur: 0.2 }), 100)
rendu.el.style.cssText += 'text-align:center;line-height:1.05'
fs(tag('ON NE REND PAS LA MORT.', 'slam white', { t0: Wd('13', 'rend') - 0.1, t1: E('13') + 0.2, y: 240, rot: -2, from: 2.2, dur: 0.2 }), 74)
fs(tag('ON LA DONNE.', 'slam yellow', { t0: Wd('13', 'donne') - 0.06, t1: E('13') + 0.2, y: 390, rot: 2, from: 2.8, dur: 0.2 }), 128)
// Le vote, puis l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, y: 300, from: 1.4, dur: 0.5 }), 110)
fs(tag('UN GESTE D’AMOUR ?', 'vote blue', { t0: Wd('14', 'geste') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 520, rot: -3 }), 74)
fs(tag('UN MEURTRE ?', 'vote red', { t0: Wd('14', 'meurtre') - 0.1, t1: Wd('14', 'coupable') - 0.2, y: 700, rot: 3 }), 74)
tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, y: 730, rot: 3 })
const sub2 = tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('15', 'abonnetoi') - 0.1, y: 1180, from: 2.2, dur: 0.25 })
fs(tag('ÉCRIS TON VERDICT EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('15', 'ecris') - 0.1, y: 1330 }), 44)
// Les boutons « abonne-toi » battent comme un cœur.
for (const b of [sub1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés (pas sur les deux appels à s'abonner : les boutons le disent).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['08-pause', '15-abonne'].includes(l.id))) {
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
  [T_OFF, 20],
  [T_LET, 8],
  [T_TEAR, 16],
  [Wd('03', 'meurtre') - 0.05, 16],
  [Wd('04', 'pouvait') - 0.06, 10],
  [Wd('05', 'oui') - 0.06, 10],
  [Wd('06', 'serre') - 0.06, 12],
  [Wd('07', 'reflexe') - 0.05, 10],
  [Wd('07', '11') - 0.05, 12],
  [Wd('08', 'abonnetoi') - 0.1, 8],
  [Wd('10', 'echoue') - 0.05, 10],
  [Wd('11', 'seule') - 0.06, 10],
  [Wd('11', 'nuit') - 0.06, 10],
  [Wd('12', 'rendu') - 0.1, 14],
  [Wd('13', 'donne') - 0.06, 16],
  [Wd('14', 'jure') - 0.15, 8],
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
// Caméra : le même cadrage pour tous les calques (pas de parallaxe quand flat est vrai).
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
const HOT = { 12: '#b3232b', 13: '#1d2a5c' }
const BEATS = C.lines.filter((l) => l.who !== 'narrateur').flatMap((l) => l.words.filter((w) => /[.?!…»]$/.test(w.w)).map((w) => ({ t: w.t, who: l.who })))

// Traînées du panoramique filé.
const streaks = svg('g', { opacity: 0 }, root)
for (let k = 0; k < 14; k++) svg('rect', { x: -100, y: 120 + k * 130, width: W + 200, height: 6 + (k % 3) * 4, fill: '#ffffff', opacity: 0.35 }, streaks)

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === NUIT) {
    const off = t >= T_OFF
    const inFace = t >= T_FACE
    // On entre dans la chambre ; la main arrive ; coup de zoom sur l'interrupteur ; puis son visage.
    const reach = prog(t, T_OFF - 0.75, 0.6, ease.out3)
    const punch = prog(t, T_OFF - 0.25, 0.3, ease.out3)
    if (!inFace) cam(NUIT, t, { zoom: lerp(1.08, 1.5, punch), cx: lerp(540, 800, punch), cy: lerp(980, 1150, punch), push: 0.04, hand: 3, flat: true })
    else cam(NUIT, t, { zoom: 1, push: 0.03, from: T_FACE, hand: 2, flat: true })
    NUIT.R.update(t, { tFlat: T_OFF, clockStr: off ? '03:04' : '03:00' })
    // La main : elle avance, appuie (petit recul), reste.
    const press = off ? Math.exp(-(t - T_OFF) * 10) : 0
    NUIT.hand.setAttribute('transform', `translate(${lerp(1500, 1012, reach) - 14 * press} ${lerp(1100, 1218, reach) + 10 * press}) rotate(${lerp(-10, 4, reach)})`)
    NUIT.redWash.setAttribute('opacity', off && !inFace ? (0.35 + 0.3 * Math.sin((t - T_OFF) * 14)).toFixed(2) : 0)
    show(NUIT.face, inFace)
    if (inFace) {
      const k = t - T_FACE
      NUIT.faceGlow.setAttribute('opacity', (0.6 + 0.3 * Math.sin(k * 6)).toFixed(2))
      NUIT.wife.update(t, { x: 540, y: 1260, scale: 1.75, brows: 'sad', look: [-0.5, 0.5], headNod: 0.3, headTilt: -0.08, tearT: Math.max(0, k - 0.2) * 0.8, armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.7, breathe: 2.5, blink: 0.45 + 0.45 * Math.sin(Math.PI * clamp(k / 0.5)) * (k < 0.5 ? 1 : 0) })
      NUIT.faceTrace.setAttribute('d', ecgPath(t, { y0: 1560, amp: 1, tFlat: T_OFF }))
    }
  }
  if (cur === PROMESSE) {
    const k = t - PROMESSE.t0
    const inLetter = t >= T_LET
    cam(PROMESSE, t, { zoom: 1.06, cx: 540 + 20 * Math.sin(k), cy: 990, push: 0.02, hand: 2, flat: true })
    const day = (k * 2.4) % 1
    const hh = String(Math.floor(day * 24)).padStart(2, '0')
    PROMESSE.R.update(t, { day, clockStr: `${hh}:${String(Math.floor((day * 24 * 60) % 60)).padStart(2, '0')}` })
    PROMESSE.wife.update(t, { x: 640, y: 1150, scale: 0.62, brows: 'sad', look: [-0.6, 0.4], headTilt: -0.12, armL: [1.2, 0.5], armR: [0.2, 0.9], seed: 0.3 })
    // La fleur : elle éclot, se fane, on la remplace… en boucle.
    const c = (k * 1.3) % 1
    const bloom = Math.sin(Math.PI * c)
    const droop = c > 0.6 ? (c - 0.6) / 0.4 : 0
    PROMESSE.stem.setAttribute('d', `M 0 -100 Q ${30 * droop} ${-180} ${60 * droop} ${-250 + 90 * droop}`)
    PROMESSE.petals.setAttribute('transform', `translate(${60 * droop} ${-250 + 90 * droop}) scale(${(0.3 + bloom).toFixed(2)}) rotate(${droop * 60})`)
    PROMESSE.petals.setAttribute('opacity', (1 - droop * 0.6).toFixed(2))
    for (const p of PROMESSE.pages) {
      const u = (k * 0.9 + p.ph) % 1
      show(p.g, !inLetter)
      place(p.g, lerp(1250, -200, u), 1760 - 100 * Math.sin(Math.PI * u) + 50 * Math.sin(p.ph * 20), 0.9, -20 + u * 60 + 30 * Math.sin(p.ph * 9))
    }
    show(PROMESSE.letter, inLetter)
    if (inLetter) {
      const q = t - T_LET
      const s = ease.back(1.6)(clamp(q / 0.4))
      place(PROMESSE.sheet, 540, 940 + (1 - s) * 500, 0.7 + 0.3 * s, -3 + 0.6 * Math.sin(t * 1.5))
      const span = Math.max(1.0, PROMESSE.t1 - T_LET - 1.3)
      PROMESSE.rows.forEach((r, i) => r.setAttribute('width', 760 * prog(t, T_LET + 0.3 + (i * span) / 3, span / 3, ease.io2)))
      PROMESSE.sign.setAttribute('opacity', prog(t, T_LET + 0.3 + span, 0.25))
    }
  }
  if (cur === FILLE_S) {
    const tear = prog(t, T_TEAR, 0.4, ease.back(1.6))
    const torn = t >= T_TEAR
    cam(FILLE_S, t, { zoom: lerp(1.12, 1.0, tear), cy: 940, push: 0.03, hand: 2, flat: true })
    const [hl, hr] = FILLE_S.halves
    hl.h.setAttribute('transform', `translate(${540 - 70 * tear} ${880 + 14 * tear}) rotate(${-5 * tear})`)
    hr.h.setAttribute('transform', `translate(${540 + 90 * tear} ${880 - 20 * tear}) rotate(${6 * tear}) scale(${1 + 0.12 * tear})`)
    hl.tint.setAttribute('opacity', (0.22 * tear).toFixed(2))
    hr.tint.setAttribute('opacity', (0.22 * tear).toFixed(2))
    FILLE_S.mere.update(t, { x: -310, y: 70, scale: 0.6, brows: torn ? 'sad' : 'neutral', look: torn ? [0.2, 0.5] : [0, 0], headNod: torn ? 0.2 : 0, armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 0.2 })
    FILLE_S.pere.update(t, { x: -100, y: 50, scale: 0.62, brows: 'neutral', armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 1.2 })
    FILLE_S.fw.setAttribute('transform', 'translate(300 70) scale(-0.6 0.6)')
    const pt = prog(t, T_TEAR + 0.15, 0.3, ease.back(2))
    FILLE_S.fille.update(t, { brows: torn ? 'angry' : 'neutral', mouth: torn ? 0.3 + 0.2 * Math.sin(t * 14) : 0, look: [0.4 * pt, 0], armR: [0.15 + 1.45 * pt, 0.5 - 0.4 * pt], armL: [0.1, 0.5], point: pt > 0.4, seed: 2.2 })
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '08'
    const isProc = l.who === 'procureur'
    const hot = HOT[id]
    show(TRIB.procBg, isProc && !hot && !pause)
    show(TRIB.avoBg, !isProc && !hot && !pause)
    show(TRIB.hotBg, !!hot)
    show(TRIB.pauseBg, pause)
    if (hot) TRIB.hotFill.setAttribute('fill', hot)
    show(TRIB.proc.root, isProc && !pause)
    show(TRIB.avo.root, !isProc && !pause)
    show(TRIB.deskG, !pause)
    for (const c of TRIB.crowd) show(c.g, !pause)
    const side = isProc ? -1 : 1
    const beat = BEATS.filter((b) => b.who === l.who && t >= b.t - 0.1 && t < b.t + 0.6).at(-1)
    const bk = beat ? Math.sin(Math.PI * clamp((t - beat.t + 0.1) / 0.7)) : 0
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…»]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    if (pause) {
      cam(TRIB, t, { zoom: 1, push: 0.04, from: l.start, hand: 0, flat: true })
      TRIB.rays.setAttribute('transform', `translate(540 1000) rotate(${(t * 40) % 360})`)
    } else cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch) + 0.04 * bk, cx: 540 + side * 40 + 30 * Math.sin(t * 0.7), cy: lerp(980, 900, Math.min(1, punch)), push: 0.02, from: l.start - 0.12, rot: side * 0.6 })
    const sp = speaking(l.who, t)
    const wave = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    if (!pause)
      P.update(t, {
        x: 540 + side * 60,
        y: 1170,
        scale: 1.4,
        lean: side * -0.03 + bk * side * -0.03,
        mouth: m,
        brows: isProc ? (['06', '11', '13'].includes(id) ? 'angry' : 'determined') : ['07', '12'].includes(id) ? 'determined' : id === '10' ? 'sad' : 'neutral',
        look: [side * -0.4, 0],
        armR: [0.35 + (sp ? 0.25 * m + 0.12 * wave : 0) + bk * 1.5, 1.0 + (sp ? 0.3 * wave : 0) - bk * 0.7],
        armL: [0.25 + (sp ? 0.15 * wave : 0), 1.2 + (sp ? 0.3 * Math.sin(t * 4.1) : 0)],
        point: bk > 0.3,
        seed: isProc ? 0.5 : 1.7,
        headTilt: 0.05 * Math.sin(t * 1.2) + side * -0.04,
        headNod: 0.08 * bk,
      })
    TRIB.crowd.forEach((c) => c.g.setAttribute('transform', `translate(${c.x + 6 * Math.sin(t * 1.3 + c.ph)} ${1640 + 8 * Math.abs(Math.sin(t * 2 + c.ph))})`))
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    if (prop(TRIB.flat, id === '04', S('04') - 0.05, E('04') + 0.05, 540, 660, 0.9) > 0) TRIB.flatTrace.setAttribute('d', ecgPath(t, { y0: 30, x0: -380, x1: 380, amp: 0.6, speed: 320, tFlat: Wd('04', 'tue') - 0.1 }))
    if (prop(TRIB.letter, id === '05', Wd('05', 'ecrit') - 0.25, E('05') + 0.05, 540, 690, 0.82, -3) > 0) {
      const ws = ['si', 'plus', 'laissemoi'].map((w) => Wd('05', w) - 0.05)
      const ends = [ws[1], ws[2], Wd('05', 'partir') + 0.4]
      TRIB.letterRows.forEach((r, i) => r.setAttribute('width', 680 * prog(t, ws[i], Math.max(0.2, ends[i] - ws[i]))))
    }
    if (prop(TRIB.hands, id === '06', Wd('06', '12') - 0.2, E('06') + 0.05, 540, 690, 0.85) > 0) {
      const q = t - (Wd('06', 'serre') - 0.06)
      const pu = q > 0 ? Math.exp(-q * 5) * Math.abs(Math.sin(q * 12)) : 0
      TRIB.squeeze.setAttribute('transform', `scale(${1 - 0.1 * pu})`)
      TRIB.hands.pulse.forEach((p) => p.setAttribute('opacity', q > 0 ? Math.min(1, pu * 2 + 0.2).toFixed(2) : 0))
    }
    if (prop(TRIB.bars, id === '07', Wd('07', 'pendant') - 0.2, E('07') + 0.05, 540, 690, 0.86) > 0) {
      const a = ease.out3(prog(t, Wd('07', 'pendant'), Math.max(0.6, Wd('07', '1095') + 0.4 - Wd('07', 'pendant'))))
      const b = ease.out3(prog(t, Wd('07', '11') - 0.1, 0.3))
      TRIB.barA.setAttribute('width', 780 * a)
      TRIB.numA.textContent = String(Math.round(1095 * a))
      TRIB.barB.setAttribute('width', 16 * b)
      TRIB.numB.textContent = String(Math.round(11 * b))
    }
    prop(TRIB.tomorrow, id === '09', Wd('09', 'nouveau') - 0.2, E('09') + 0.05, 540, 700, 0.72, 3 * Math.sin(t * 2))
    if (prop(TRIB.vials, id === '10', S('10') - 0.05, E('10') + 0.05, 540, 640, 0.7) > 0) {
      TRIB.vials.x.forEach((x, k) => x.setAttribute('opacity', t > Wd('10', 'echoue') - 0.3 + k * 0.12 ? 1 : 0))
      TRIB.vials.q.setAttribute('opacity', (0.5 + 0.5 * Math.sin(t * 8)).toFixed(2))
    }
    prop(TRIB.night, id === '11', Wd('11', 'seule') - 0.4, E('11') + 0.05, 540, 720, 0.8)
    prop(TRIB.code, id === '13', Wd('13', 'loi') - 0.2, E('13') + 0.2, 850, 650, 0.5, 8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions : flashes, volets de points, panoramiques filés entre les répliques.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, (a >= 20 ? 0.8 : 0.35) * (1 - (t - t0) / 0.1))
  if (t >= T_FACE && t < T_FACE + 0.15) f = Math.max(f, 0.7 * (1 - (t - T_FACE) / 0.15))
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
    const q = t - (l.start - 0.12)
    if (q > -0.12 && q < 0.12) {
      const dir = l.who === 'procureur' ? -1 : 1
      whip = q < 0 ? dir * -1400 * ease.in3(clamp((q + 0.12) / 0.12)) : dir * 1400 * (1 - ease.out3(clamp(q / 0.12)))
    }
  }
  TRIB.g.setAttribute('transform', `translate(${whip.toFixed(1)} 0)`)
  iris.setAttribute('r', 0)
  streaks.setAttribute('opacity', Math.min(1, Math.abs(whip) / 400).toFixed(2))

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCATE DE LA DÉFENSE') : ''
  who.className = `tag who ${w ? w.who : ''}`
  who.style.visibility = w ? '' : 'hidden'
  who.style.transform = 'translate(540px, 1310px) translate(-50%, -50%)'
  updateCaptions(t)
  updateGrain(t, 14)
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
