/**
 * ============================================================================
 *  « Affaire Classée ? » — Le piège (1080 × 1920)
 * ============================================================================
 *  Le hook entre directement dans l'action : on est dans le direct de Yanis,
 *  « chasseur de prédateurs », sur un parking, la nuit. Il fonce sur un homme
 *  qui tient un bouquet, lampe allumée, 82 000 spectateurs… capture d'écran,
 *  « PRÉDATEUR ? », partagée partout. Le narrateur explique pendant le replay :
 *  sa chaîne (onze arrestations), l'erreur (ce n'était pas lui : il avait
 *  rendez-vous avec Sophie), trois jours de haine, le suicide. Yanis est jugé.
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
grad('splitL', [[0, '#4a0a18'], [1, '#12040a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('splitM', [[0, '#2a3040'], [1, '#05070f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
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

// Des fissures qui partent d'un point (comme un écran brisé).
function cracks(parent, cx, cy, scale, seed) {
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
    svg('path', { d, fill: 'none', stroke: '#2a2a2a', 'stroke-width': 4 / scale + 3, 'stroke-linejoin': 'round', 'stroke-dasharray': 900, 'stroke-dashoffset': 900 }, g)
  }
  return g
}
grad('nightSky', [[0, '#05070f'], [0.6, '#141a33'], [1, '#2a2440']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('sodium', [[0, '#ffc070', 0.7], [0.4, '#ff9a3a', 0.2], [1, '#ff9a3a', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('torch', [[0, '#ffffff', 0.42], [0.5, '#e8f0ff', 0.14], [1, '#e8f0ff', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })
grad('topShade', [[0, '#000', 0.6], [1, '#000', 0]], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('banner', [[0, '#e5484d'], [1, '#2a0a10']], { x1: 0, y1: 0, x2: 1, y2: 1 })
grad('dateBg', [[0, '#3a1030'], [1, '#12060f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('hateBg', [[0, '#2a0a10'], [1, '#05050a']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('studio', [[0, '#1a1030'], [1, '#07060f']], { x1: 0, y1: 0, x2: 0, y2: 1 })
grad('ringGlow', [[0.7, '#fff6e0', 0], [0.83, '#fff6e0', 0.55], [1, '#fff6e0', 0]], { cx: 0.5, cy: 0.5, r: 0.5 })

// Les personnages. Les avocats en costume ; Yanis, le streamer (casquette) ; l'homme du parking ; le vrai suspect.
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', legs: false, hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const AVO = { suit: '#1f2d55', shirt: '#eef3fb', tie: '#d4a72c', tieStripe: '#1f2d55', pocket: '#eef3fb', legs: false, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12', jabot: false }
const YANIS = { robe: '#1c1c22', jabot: false, collar: '#e5484d', hair: 'short', hairColor: '#1a120c', skin: '#c98d68', iris: '#2b1d12' }
const HOMME = { robe: '#b89a6a', jabot: false, collar: '#e8eef6', hair: 'short', hairColor: '#5a4630', skin: '#f0c4a0', iris: '#3b5a7a' }
const SUSPECT = { robe: '#3a4a3a', jabot: false, collar: '#222222', hair: 'messy', hairColor: '#2a1a10', beard: true, skin: '#e2b08a', iris: '#2b1d12' }
function glasses(person) {
  const g = svg('g', {}, person.head)
  for (const x of [-56, 56]) svg('circle', { cx: x, cy: -140, r: 46, fill: '#ffffff', 'fill-opacity': 0.12, stroke: '#2a2a2a', 'stroke-width': 9 }, g)
  svg('path', { d: 'M -12 -146 Q 0 -156 12 -146 M -102 -150 L -142 -160 M 102 -150 L 142 -160', fill: 'none', stroke: '#2a2a2a', 'stroke-width': 8 }, g)
  return g
}
// La casquette de Yanis (logo « Y »).
function capOn(person, color = '#e5484d') {
  const g = svg('g', {}, person.head)
  svg('path', { d: 'M -168 -212 C -176 -360 176 -360 168 -212 Z', fill: color }, g)
  svg('path', { d: 'M -60 -330 C -20 -344 40 -340 80 -320', fill: 'none', stroke: '#ffffff', 'stroke-width': 10, opacity: 0.3, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -176 -214 C -60 -242 60 -242 176 -214 L 186 -192 C 60 -216 -60 -216 -186 -192 Z', fill: '#8f1f24' }, g)
  txt(g, 'Y', { y: -246, 'font-size': 78, fill: '#ffffff' })
  return g
}
const person = (parent, o, { gl = false, cap = false } = {}) => {
  const p = makePerson(parent, o)
  if (gl) glasses(p)
  if (cap) capOn(p)
  return p
}
const HATE = ['PORC', 'ON SAIT OÙ TU HABITES', 'CRÈVE', 'BALANCE SON ADRESSE', 'DÉGUEULASSE', 'HONTE À TOI', 'TA FEMME VA SAVOIR', 'ON VA TE RETROUVER', 'POUBELLE', 'PARTAGEZ !!', 'SA PHOTO EST PARTOUT', 'TU VAS PAYER']
const COMMENTS = [['nono_93', 'C’EST LUI !!'], ['lila.x', 'FILME SA TÊTE'], ['kev', '🔥🔥🔥'], ['sam_off', 'BALANCE SON NOM'], ['jordy', 'DÉGOÛTANT'], ['inès', 'APPELEZ LA POLICE'], ['max77', 'IL TREMBLE MDR'], ['zoé', 'BRAVO YANIS']]

// ------------------------------------------------- 1 · Le hook
const HOOK = scene('hook', (L) => {
  bg(L, '#05050a')
  const R = L.actor
  // A · Le direct de Yanis, sur un parking, la nuit.
  const A = svg('g', {}, R)
  const Aw = svg('g', {}, A)
  svg('rect', { x: -500, y: -500, width: W + 1000, height: 1400, fill: 'url(#nightSky)' }, Aw)
  {
    const rs = rng(8)
    for (let x = -400; x < W + 400; ) {
      const w = 80 + rs() * 140
      const h = 160 + rs() * 340
      svg('rect', { x, y: 880 - h, width: w, height: h, fill: '#11152a' }, Aw)
      for (let yy = 880 - h + 24; yy < 860; yy += 46) for (let xx = x + 14; xx < x + w - 20; xx += 34) if (rs() > 0.62) svg('rect', { x: xx, y: yy, width: 16, height: 22, fill: '#ffd28a', opacity: 0.55 }, Aw)
      x += w + 10
    }
  }
  svg('rect', { x: -500, y: 860, width: W + 1000, height: 1600, fill: '#16181f' }, Aw)
  for (let k = -6; k <= 6; k++) svg('path', { d: `M ${540 + k * 60} 880 L ${540 + k * 420} 2100`, stroke: '#d8dce4', 'stroke-width': 7, opacity: 0.45 }, Aw)
  svg('path', { d: 'M -500 1010 L 1580 1010', stroke: '#d8dce4', 'stroke-width': 6, opacity: 0.35 }, Aw)
  for (const x of [80, 1000]) {
    svg('rect', { x: x - 9, y: 300, width: 18, height: 600, fill: '#2a2e3a' }, Aw)
    svg('rect', { x: x - 60, y: 290, width: 120, height: 26, rx: 10, fill: '#2a2e3a' }, Aw)
    svg('ellipse', { cx: x, cy: 330, rx: 360, ry: 300, fill: 'url(#sodium)' }, Aw)
    svg('ellipse', { cx: x, cy: 920, rx: 260, ry: 60, fill: '#ffb050', opacity: 0.18 }, Aw)
  }
  // Voitures garées (de côté).
  const parked = (x, y, s, c) => {
    const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, Aw)
    svg('path', { d: 'M -300 40 L -280 -40 L -150 -60 L -90 -130 L 120 -130 L 200 -60 L 300 -40 L 310 40 Z', fill: c, stroke: '#07080c', 'stroke-width': 6 }, g)
    svg('path', { d: 'M -70 -116 L 110 -116 L 170 -64 L -130 -64 Z', fill: '#2a3550', opacity: 0.9 }, g)
    for (const wx of [-180, 190]) svg('circle', { cx: wx, cy: 40, r: 52, fill: '#07080c' }, g)
    svg('path', { d: 'M -270 -20 L 280 -20', stroke: '#ffb050', 'stroke-width': 5, opacity: 0.35 }, g)
  }
  parked(-60, 1010, 0.9, '#23293a')
  parked(1150, 1000, 0.9, '#3a2328')
  const homme = person(Aw, HOMME, { gl: true })
  const bouquet = svg('g', {}, Aw)
  for (const [dx, dy] of [[-30, -60], [0, -80], [30, -60], [-14, -100], [18, -104]]) {
    svg('path', { d: `M 0 60 L ${dx} ${dy + 30}`, stroke: '#2f7a3a', 'stroke-width': 8 }, bouquet)
    svg('circle', { cx: dx, cy: dy, r: 26, fill: '#e5384d', stroke: '#8f1f24', 'stroke-width': 4 }, bouquet)
  }
  svg('path', { d: 'M -50 -10 L 50 -10 L 16 90 L -16 90 Z', fill: '#f6efe2', stroke: '#9a8a6a', 'stroke-width': 4 }, bouquet)
  // Sa voiture, au premier plan.
  const fg = svg('g', {}, Aw)
  svg('path', { d: 'M -300 1420 C 100 1350 900 1350 1380 1420 L 1380 2300 L -300 2300 Z', fill: '#1d2130', stroke: '#07080c', 'stroke-width': 8 }, fg)
  svg('path', { d: 'M -100 1440 C 300 1395 700 1395 1100 1440', fill: 'none', stroke: '#ffb050', 'stroke-width': 8, opacity: 0.35 }, fg)
  // La lampe du téléphone sur lui.
  const torch = svg('ellipse', { cx: 0, cy: 0, rx: 380, ry: 520, fill: 'url(#torch)' }, Aw)
  // La main de Yanis qui le pointe du doigt.
  const hand = svg('g', {}, A)
  svg('path', { d: 'M 0 40 L 360 560', stroke: '#2e2e3c', 'stroke-width': 160, 'stroke-linecap': 'round' }, hand)
  svg('path', { d: 'M -40 60 L 300 560', stroke: '#4a4a5c', 'stroke-width': 26, 'stroke-linecap': 'round', opacity: 0.6 }, hand)
  const fistG = svg('g', { transform: 'rotate(-34)' }, hand)
  svg('rect', { x: -30, y: -250, width: 60, height: 220, rx: 30, fill: '#c98d68', stroke: '#7a4a2a', 'stroke-width': 6 }, fistG)
  svg('ellipse', { cx: 0, cy: 10, rx: 96, ry: 80, fill: '#c98d68', stroke: '#7a4a2a', 'stroke-width': 6 }, fistG)
  for (const x of [-50, -10, 30]) svg('path', { d: `M ${x} -40 Q ${x + 20} -60 ${x + 40} -40`, fill: 'none', stroke: '#7a4a2a', 'stroke-width': 6 }, fistG)
  svg('path', { d: 'M -14 -230 Q 0 -244 14 -230', fill: 'none', stroke: '#f2d0b8', 'stroke-width': 8, 'stroke-linecap': 'round' }, fistG)
  // L'interface du direct.
  const ui = svg('g', {}, A)
  svg('rect', { x: 0, y: 0, width: W, height: 230, fill: 'url(#topShade)' }, ui)
  svg('circle', { cx: 92, cy: 112, r: 50, fill: '#1c1c22', stroke: '#fe2c55', 'stroke-width': 7 }, ui)
  txt(ui, 'Y', { x: 92, y: 134, 'font-size': 56, fill: '#ffffff' })
  const nm = txt(ui, '@yanis_traque', { x: 166, y: 100, 'font-size': 38, fill: '#ffffff' })
  nm.setAttribute('text-anchor', 'start')
  svg('rect', { x: 166, y: 118, width: 104, height: 44, rx: 10, fill: '#ff2d55' }, ui)
  txt(ui, 'LIVE', { x: 218, y: 151, 'font-size': 30, fill: '#ffffff' })
  svg('rect', { x: 282, y: 118, width: 210, height: 44, rx: 10, fill: '#000', opacity: 0.5 }, ui)
  const viewers = txt(ui, '', { x: 387, y: 151, 'font-size': 30, fill: '#ffffff' })
  txt(ui, '✕', { x: 1010, y: 130, 'font-size': 50, fill: '#ffffff', opacity: 0.8 })
  const comments = COMMENTS.map(([u, s], k) => {
    const g = svg('g', { opacity: 0 }, ui)
    const w = 60 + Math.max(u.length * 17, s.length * 23)
    svg('rect', { x: 0, y: -50, width: w, height: 92, rx: 24, fill: '#000', opacity: 0.45 }, g)
    const a = txt(g, u, { x: 24, y: -14, 'font-size': 26, fill: '#9fd0ff', 'font-weight': 700 })
    a.setAttribute('text-anchor', 'start')
    const b = txt(g, s.replace(/🔥/gu, '!!!'), { x: 24, y: 26, 'font-size': 34, fill: '#ffffff' })
    b.setAttribute('text-anchor', 'start')
    return { g, t0: 0.1 + k * 0.48 }
  })
  const hearts = Array.from({ length: 14 }, (_, k) => ({ el: svg('path', { d: heartD, fill: ['#fe2c55', '#ff6b8a', '#ffd166'][k % 3], opacity: 0 }, ui), ph: k / 14, dx: ((k * 37) % 11) - 5 }))
  // B · La capture d'écran : bord blanc, partages qui s'envolent.
  const shotFrame = svg('rect', { x: 0, y: 0, width: W, height: H, rx: 40, fill: 'none', stroke: '#ffffff', 'stroke-width': 26, opacity: 0 }, R)
  const shares = Array.from({ length: 14 }, (_, k) => {
    const g = svg('g', { opacity: 0 }, L.hud)
    svg('circle', { r: 44, fill: ['#fe2c55', '#25d366', '#3b82f6', '#ffd166'][k % 4] }, g)
    svg('path', { d: 'M -18 14 L -18 2 Q -18 -12 4 -12 L 4 -24 L 24 -4 L 4 16 L 4 4 Q -10 4 -18 14 Z', fill: '#ffffff' }, g)
    return { g, a: (k / 14) * Math.PI * 2 + 0.3, v: 520 + ((k * 53) % 5) * 90 }
  })

  // C · La chaîne de Yanis : onze arrestations… et la douzième.
  const Cr = svg('g', { display: 'none' }, R)
  const Ccam = svg('g', {}, Cr)
  svg('rect', { x: -2000, y: -2000, width: 5000, height: 6000, fill: '#0f0f14' }, Ccam)
  svg('rect', { x: 0, y: 0, width: W, height: 300, fill: 'url(#banner)' }, Ccam)
  txt(Ccam, 'TRAQUE EN DIRECT', { x: 540, y: 190, 'font-size': 92, fill: '#ffffff', 'font-style': 'italic', 'letter-spacing': 2 })
  const avc = svg('clipPath', { id: 'avatarClip' }, defs)
  svg('circle', { cx: 170, cy: 390, r: 110 }, avc)
  svg('circle', { cx: 170, cy: 390, r: 122, fill: '#fe2c55' }, Ccam)
  const avIn = svg('g', { 'clip-path': 'url(#avatarClip)' }, Ccam)
  svg('circle', { cx: 170, cy: 390, r: 110, fill: '#2a2f45' }, avIn)
  const yanisAv = person(avIn, YANIS, { cap: true })
  const nm2 = txt(Ccam, '@yanis_traque', { x: 320, y: 380, 'font-size': 56, fill: '#ffffff' })
  nm2.setAttribute('text-anchor', 'start')
  const subs = txt(Ccam, '', { x: 320, y: 444, 'font-size': 40, fill: '#9aa0b0', 'font-weight': 700 })
  subs.setAttribute('text-anchor', 'start')
  svg('path', { d: 'M 40 548 L 1040 548', stroke: '#2a2d38', 'stroke-width': 4 }, Ccam)
  svg('rect', { x: 40, y: 540, width: 180, height: 10, fill: '#ffffff' }, Ccam)
  const thumbs = Array.from({ length: 12 }, (_, k) => {
    const c = k % 3
    const r = Math.floor(k / 3)
    const x = 40 + c * 340
    const y = 590 + r * 235
    const g = svg('g', { transform: `translate(${x} ${y})` }, Ccam)
    svg('rect', { width: 320, height: 210, rx: 18, fill: k === 11 ? '#2a1a20' : '#2a1416' }, g)
    svg('circle', { cx: 160, cy: 92, r: 42, fill: '#5a5f70' }, g)
    svg('path', { d: 'M 80 210 C 80 140 240 140 240 210 Z', fill: '#5a5f70' }, g)
    if (k === 11) {
      for (const [dx, dy] of [[-16, -10], [0, -22], [16, -10]]) svg('circle', { cx: 230 + dx, cy: 160 + dy, r: 12, fill: '#e5384d' }, g)
    }
    svg('rect', { x: 0, y: 160, width: 320, height: 50, fill: '#000', opacity: 0.5 }, g)
    const tt = txt(g, k === 11 ? 'PIÉGÉ #12 · LIVE' : `PIÉGÉ #${k + 1}`, { x: 16, y: 196, 'font-size': 28, fill: '#ffffff' })
    tt.setAttribute('text-anchor', 'start')
    const badge = svg('g', { transform: 'translate(240 40)' }, g)
    svg('rect', { x: -66, y: -26, width: 132, height: 52, rx: 14, fill: k === 11 ? '#e5484d' : '#12a150' }, badge)
    txt(badge, k === 11 ? '?' : 'ARRÊTÉ ✓', { y: 11, 'font-size': k === 11 ? 40 : 24, fill: '#ffffff' })
    return { g, badge, x, y, k }
  })
  // La comparaison : le suspect recherché ≠ l'homme du parking.
  const diff = svg('g', { display: 'none' }, L.hud)
  svg('rect', { x: -470, y: -330, width: 940, height: 660, rx: 34, fill: '#10121a', stroke: '#e5484d', 'stroke-width': 10 }, diff)
  for (const [sx, o, label, gl] of [[-230, SUSPECT, 'LE SUSPECT', false], [230, HOMME, 'LUI', true]]) {
    const cl = svg('clipPath', { id: `cmp${sx}` }, defs)
    svg('rect', { x: sx - 190, y: -280, width: 380, height: 470, rx: 20 }, cl)
    const g = svg('g', { 'clip-path': `url(#cmp${sx})` }, diff)
    svg('rect', { x: sx - 190, y: -280, width: 380, height: 470, fill: sx < 0 ? '#3a4050' : '#4a3a2a' }, g)
    const p = person(g, o, { gl })
    p.update(0, { x: sx, y: 30, scale: 0.62, brows: sx < 0 ? 'angry' : 'surprised', armR: [0.1, 0.4], armL: [0.1, 0.4], seed: sx })
    txt(diff, label, { x: sx, y: 262, 'font-size': 52, fill: sx < 0 ? '#ffd166' : '#ffffff' })
  }
  const neq = txt(diff, '≠', { x: 0, y: 70, 'font-size': 240, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 14, 'paint-order': 'stroke fill' })

  // D1 · Son vrai rendez-vous : Sophie, au parking du cinéma.
  const D = svg('g', { display: 'none' }, R)
  const Dcam = svg('g', {}, D)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#dateBg)' }, Dcam)
  {
    const rb = rng(21)
    for (let i = 0; i < 18; i++) svg('circle', { cx: rb() * W, cy: rb() * H, r: 40 + rb() * 120, fill: '#ff8ab0', opacity: 0.08 + rb() * 0.08 }, Dcam)
  }
  const ph = svg('g', { transform: 'translate(540 860)' }, Dcam)
  svg('rect', { x: -290, y: -520, width: 580, height: 1040, rx: 64, fill: '#111', stroke: '#3a3a3a', 'stroke-width': 8 }, ph)
  svg('rect', { x: -268, y: -498, width: 536, height: 996, rx: 46, fill: '#fff5f8' }, ph)
  svg('rect', { x: -268, y: -498, width: 536, height: 150, rx: 46, fill: '#ff5a8a' }, ph)
  svg('circle', { cx: -170, cy: -420, r: 46, fill: '#ffd0dc', stroke: '#ffffff', 'stroke-width': 6 }, ph)
  txt(ph, 'S', { x: -170, y: -402, 'font-size': 50, fill: '#ff5a8a' })
  const sn = txt(ph, 'Sophie, 39 ✓', { x: -100, y: -404, 'font-size': 44, fill: '#ffffff' })
  sn.setAttribute('text-anchor', 'start')
  const bub = (y, s, mine) => {
    const g = svg('g', { transform: `translate(0 ${y})` }, ph)
    const w = 50 + s.length * 25
    const x = mine ? 250 - w : -250
    svg('rect', { x, y: -50, width: w, height: 100, rx: 40, fill: mine ? '#3b82f6' : '#ece6ea' }, g)
    const tt = txt(g, s, { x: x + w / 2, y: 14, 'font-size': 40, fill: mine ? '#ffffff' : '#10121a', 'font-weight': 800 })
    void tt
    return g
  }
  const bubbles = [bub(-250, 'On se voit ce soir ? 😊', false), bub(-90, 'Parking du ciné, 21 h', true), bub(70, 'J’apporte des fleurs 🌹', true), bub(230, 'Hâte !! ❤️', false)]
  // D2 · Trois jours de harcèlement ; puis plus rien.
  const D2 = svg('g', { display: 'none' }, R)
  const D2cam = svg('g', {}, D2)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#hateBg)' }, D2cam)
  const portrait = svg('g', {}, D2cam)
  svg('rect', { x: 190, y: 560, width: 700, height: 860, rx: 20, fill: '#d8cdb8', stroke: '#2a1a10', 'stroke-width': 14 }, portrait)
  const pc = svg('clipPath', { id: 'portClip' }, defs)
  svg('rect', { x: 204, y: 574, width: 672, height: 832 }, pc)
  const pin = svg('g', { 'clip-path': 'url(#portClip)' }, portrait)
  const hommeP = person(pin, HOMME, { gl: true })
  const ribbon = svg('path', { d: 'M 700 560 L 890 750 L 890 830 L 620 560 Z', fill: '#0a0a0a', opacity: 0 }, portrait)
  const dark = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#000', opacity: 0 }, D2)
  const hate = HATE.map((s, k) => {
    const g = svg('g', { display: 'none' }, D2)
    const w = 60 + s.length * 30
    svg('rect', { x: -w / 2, y: -46, width: w, height: 84, rx: 24, fill: '#ffffff', stroke: '#e5484d', 'stroke-width': 7 }, g)
    txt(g, s, { y: 12, 'font-size': 44, fill: '#e5484d' })
    const pos = [[300, 520], [780, 640], [260, 860], [820, 980], [300, 1180], [760, 1320], [540, 460], [240, 1360], [840, 520], [540, 1500], [300, 700], [780, 1180]][k]
    return { g, x: pos[0], y: pos[1], rot: (k % 2 ? 1 : -1) * (3 + (k % 5)) }
  })
  // E · Yanis devant son anneau lumineux ; le marteau le brise.
  const Ev = svg('g', { display: 'none' }, R)
  const Ecam = svg('g', {}, Ev)
  svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: 'url(#studio)' }, Ecam)
  svg('rect', { x: -400, y: 300, width: W + 800, height: 14, fill: '#b04aff', opacity: 0.8 }, Ecam)
  const ring = svg('g', { transform: 'translate(540 820)' }, Ecam)
  svg('circle', { r: 360, fill: 'url(#ringGlow)' }, ring)
  const ringC = svg('circle', { r: 300, fill: 'none', stroke: '#fffaf0', 'stroke-width': 46 }, ring)
  const ringCracks = cracks(ring, -200, -210, 0.9, 7)
  const yanisE = person(Ecam, YANIS, { cap: true })
  const mic = svg('g', { transform: 'translate(860 1180)' }, Ecam)
  svg('path', { d: 'M 120 -400 L 40 -120 L -60 -60', fill: 'none', stroke: '#2a2a2a', 'stroke-width': 18, 'stroke-linecap': 'round' }, mic)
  svg('rect', { x: -110, y: -120, width: 90, height: 170, rx: 44, fill: '#2a2a2a', transform: 'rotate(30)' }, mic)
  const eFlash = svg('rect', { x: -400, y: -400, width: W + 800, height: H + 800, fill: '#ffffff', opacity: 0 }, Ev)
  const gavel = svg('g', { display: 'none' }, Ev)
  svg('rect', { x: -26, y: -20, width: 52, height: 360, rx: 16, fill: '#6a3f26' }, gavel)
  svg('rect', { x: -150, y: -110, width: 300, height: 120, rx: 34, fill: '#7a4a2c' }, gavel)
  for (const x of [-150, 110]) svg('rect', { x, y: -110, width: 40, height: 120, rx: 10, fill: '#d9a441' }, gavel)
  const rwBands = Array.from({ length: 8 }, () => svg('rect', { x: 0, width: W, height: 26, fill: '#ffffff', opacity: 0 }, L.hud))
  return { A, Aw, homme, bouquet, torch, hand, ui, viewers, comments, hearts, shotFrame, shares, Cr, Ccam, yanisAv, subs, thumbs, diff, neq, D, Dcam, bubbles, D2, D2cam, portrait, hommeP, ribbon, dark, hate, Ev, Ecam, ring, ringC, ringCracks, yanisE, eFlash, gavel, rwBands }
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
  // 05 : onze prédateurs derrière les barreaux.
  const bars = prop((g) => {
    panel(g, 760, 420)
    for (let k = 0; k < 11; k++) {
      const x = -300 + (k % 6) * 120
      const y = k < 6 ? -80 : 80
      const m = svg('g', { transform: `translate(${x + (k < 6 ? 0 : 60)} ${y})` }, g)
      svg('circle', { cy: -30, r: 30, fill: '#5a5f70' }, m)
      svg('path', { d: 'M -46 60 C -46 0 46 0 46 60 Z', fill: '#5a5f70' }, m)
    }
    for (let x = -340; x <= 340; x += 68) svg('rect', { x: x - 8, y: -190, width: 16, height: 380, rx: 6, fill: '#c9d0da' }, g)
    g.n = txt(g, '11', { x: 0, y: 70, 'font-size': 200, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 18, 'paint-order': 'stroke fill' })
  })
  // 09 : une erreur sur onze.
  const tally = prop((g) => {
    panel(g, 800, 300)
    for (let k = 0; k < 11; k++) {
      const x = -330 + k * 66
      const bad = k === 10
      svg('circle', { cx: x, r: 28, fill: bad ? '#e5484d' : '#12a150' }, g)
      txt(g, bad ? '✕' : '✓', { x, y: 13, 'font-size': 36, fill: '#ffffff' })
    }
    g.lab = txt(g, '1 ERREUR = 1 MORT', { y: 110, 'font-size': 50, fill: '#e5484d' })
  })
  // 10 : le sweat à son nom.
  const hoodie = prop((g) => {
    panel(g, 560, 520, '#fe2c55')
    svg('path', { d: 'M -150 -160 Q 0 -230 150 -160 L 250 0 L 190 40 L 150 -30 L 150 200 L -150 200 L -150 -30 L -190 40 L -250 0 Z', fill: '#1c1c22', stroke: '#e5484d', 'stroke-width': 8, 'stroke-linejoin': 'round' }, g)
    svg('path', { d: 'M -60 -175 Q 0 -110 60 -175', fill: 'none', stroke: '#e5484d', 'stroke-width': 8 }, g)
    txt(g, 'YANIS', { y: 30, 'font-size': 80, fill: '#ffffff' })
    txt(g, 'TRAQUE', { y: 90, 'font-size': 44, fill: '#e5484d' })
    const tg = svg('g', { transform: 'translate(170 160) rotate(-12)' }, g)
    svg('rect', { x: -90, y: -44, width: 180, height: 88, rx: 14, fill: '#ffd166', stroke: '#10121a', 'stroke-width': 6 }, tg)
    txt(tg, '49 €', { y: 20, 'font-size': 56, fill: '#10121a' })
  })
  // 11 : le pouce bleu.
  const thumb = prop((g) => {
    panel(g, 420, 420, '#3b82f6')
    svg('circle', { r: 150, fill: '#3b82f6' }, g)
    svg('path', { d: 'M -70 -10 L -70 90 L -20 90 L -20 -10 Z M -10 90 L 60 90 C 80 90 90 76 90 60 L 100 0 C 104 -20 90 -30 74 -30 L 20 -30 L 30 -80 C 34 -100 20 -110 6 -104 L -10 -10 Z', fill: '#ffffff' }, g)
  })
  return { procBg, avoBg, hotBg, graveBg, pauseBg, rays, crowd, proc, avo, deskG, bars, tally, hoodie, thumb }
})

// ------------------------------------------------- 3 · Le vote : Yanis face au portrait de l'homme du parking
const VOTE = scene('vote', (L) => {
  svg('rect', { x: -800, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitL)' }, L.far)
  svg('rect', { x: 540, y: -800, width: 540 + 800, height: H + 1600, fill: 'url(#splitM)' }, L.far)
  const yanis = person(L.actor, YANIS, { cap: true })
  const frame = svg('g', { transform: 'translate(810 1390)' }, L.actor)
  svg('rect', { x: -200, y: -260, width: 400, height: 500, rx: 10, fill: '#5a3a22', stroke: '#2a1a10', 'stroke-width': 10 }, frame)
  svg('rect', { x: -170, y: -230, width: 340, height: 440, fill: '#d8cdb8' }, frame)
  const fc = svg('clipPath', { id: 'frameClip' }, defs)
  svg('rect', { x: -170, y: -230, width: 340, height: 440 }, fc)
  const fin = svg('g', { 'clip-path': 'url(#frameClip)', filter: 'url(#desat)' }, frame)
  const homme = person(fin, HOMME, { gl: true })
  svg('path', { d: 'M 90 -260 L 200 -150 L 200 -100 L 40 -260 Z', fill: '#0a0a0a' }, frame)
  txt(frame, 'L’HOMME DU PARKING', { y: 300, 'font-size': 38, fill: '#ffffff' })
  svg('rect', { x: 532, y: -200, width: 16, height: H + 400, fill: '#ffffff', opacity: 0.85 }, L.front)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#07080d', opacity: 0.85 }, L.front)
  return { yanis, homme }
})

// Transitions.
const fxTop = svg('g', {}, root)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#fe2c55' }, fxTop), d: (x + y) * 0.011 })
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
fs(tag('PRÉDATEUR ?', 'stamp', { t0: K.BURST + 0.1, t1: K.REWIND, y: 1080, rot: -8, from: 2.8, dur: 0.18 }), 130)
counterTag(K.BURST + 0.35, K.REWIND, 40000, 'PARTAGES', { y: 330, dur: 0.8, fmt: fr })
fs(tag('YANIS · 24 ANS · STREAMER', 'pill yellow', { t0: K.REPLAY, t1: Wd('02', 'onze') - 0.12, y: 1000, rot: 2 }), 50)
counterTag(Wd('02', 'onze') - 0.1, K.WRONG - 0.1, 11, 'ARRESTATIONS', { y: 1060, dur: 0.6 })
fs(tag('PAS LE BON.', 'stamp', { t0: K.DIFF + 0.1, t1: K.DATE, y: 1260, rot: -6, from: 2.8, dur: 0.18 }), 110)
fs(tag('MAUVAIS RENDEZ-VOUS', 'pill red', { t0: S('03') - 0.05, t1: K.HATE - 0.08, y: 230, rot: -2 }), 52)
counterTag(K.HATE, K.DEAD - 0.08, 3, 'JOURS DE HAINE', { y: 300, dur: 0.9, fmt: (v) => `J+${v}` })
fs(tag('JUGÉ.', 'stamp', { t0: K.GAVEL + 0.12, t1: SEC.hook.t1, y: 330, rot: -8, from: 2.8, dur: 0.18 }), 170)
// Le procès.
fs(tag('NI POLICIER', 'pill', { t0: Wd('04', 'policier') - 0.25, t1: Wd('04', 'il', 1) - 0.1, y: 300, rot: -2 }), 60)
fs(tag('NI JUGE', 'pill red', { t0: Wd('04', 'juge') - 0.2, t1: Wd('04', 'il', 1) - 0.1, y: 420, rot: 2 }), 60)
fs(tag('STREAMER.', 'stamp', { t0: Wd('04', 'streamer') - 0.15, t1: Wd('04', 'et') - 0.1, y: 360, rot: -6, from: 2.8, dur: 0.18 }), 120)
counterTag(Wd('04', '82') - 0.15, E('04') + 0.15, 82000, 'SPECTATEURS', { y: 330, dur: 0.6, fmt: fr })
fs(tag('« COMBIEN ? »', 'slam yellow', { t0: Wd('05', 'combien') - 0.15, t1: E('05') + 0.15, y: 330, rot: -4, from: 2.6, dur: 0.15 }), 130)
fs(tag('LE DÉCOR', 'pill', { t0: Wd('06', 'decor') - 0.15, t1: Wd('06', 'les', 1) - 0.12, y: 300, rot: -2 }), 60)
counterTag(Wd('06', 'les', 1) - 0.1, Wd('06', 'salaire') - 0.15, 1200000, 'ABONNÉS', { y: 330, dur: 0.5, fmt: fr })
fs(tag('« LE SALAIRE. »', 'slam red', { t0: Wd('06', 'salaire') - 0.15, t1: E('06') + 0.15, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 110)
fs(tag('JUSTICIER OU BOURREAU ?', 'big white', { t0: S('07') - 0.05, t1: E('07') + 0.15, y: 620, from: 1.4, dur: 0.3 }), 80)
const like1 = fs(tag(LIKE, 'subscribe like', { t0: Wd('07', 'like') - 0.1, t1: E('07') + 0.15, y: 900, from: 2.2, dur: 0.25 }), 104)
tag('L’ENQUÊTE ? APRÈS.', 'pill', { t0: Wd('08', 'ouvrir') - 0.15, t1: Wd('08', 'lui') - 0.1, y: 300, rot: -2 })
fs(tag('IL ARRIVE AVANT.', 'slam yellow', { t0: Wd('08', 'arrive') - 0.15, t1: E('08') + 0.15, y: 430, rot: -4, from: 2.8, dur: 0.18 }), 110)
fs(tag('« SANS QUE PERSONNE NE FILME ? »', 'slam red', { t0: Wd('09', 'sans') - 0.1, t1: E('09') + 0.1, y: 560, rot: -4, from: 2.8, dur: 0.15 }), 54)
tag('LA JUSTICE SE TROMPE', 'pill', { t0: S('10') - 0.05, t1: Wd('10', 'mais') - 0.12, y: 300, rot: -2 })
fs(tag('« DES SWEATS À SON NOM »', 'slam yellow', { t0: Wd('10', 'sweats') - 0.15, t1: E('10') + 0.15, y: 300, rot: -4, from: 2.8, dur: 0.15 }), 62)
fs(tag('IL RESSEMBLAIT À UN COUPABLE', 'pill red', { t0: Wd('11', 'ressemblait') - 0.15, t1: Wd('11', 'sur') - 0.1, y: 300, rot: -2 }), 46)
fs(tag('« UN POUCE BLEU… »', 'slam white', { t0: Wd('11', 'pouce') - 0.3, t1: Wd('11', 'et') - 0.08, y: 330, rot: -3, from: 2.4, dur: 0.2 }), 90)
fs(tag('« …ET UNE CORDE ? »', 'slam red', { t0: Wd('11', 'et') - 0.1, t1: E('11') + 0.3, y: 330, rot: -4, from: 2.8, dur: 0.18 }), 96)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: S('12') - 0.05, y: 260, from: 1.4, dur: 0.4 }), 100)
fs(tag('COUPABLE', 'vote red', { t0: Wd('12', 'coupable') - 0.1, y: 470, rot: -3 }), 80)
fs(tag('NON COUPABLE', 'vote blue', { t0: Wd('12', 'non') - 0.1, y: 620, rot: 3 }), 80)
fs(tag('ÉCRIS-LE EN COMMENTAIRE ↓', 'pill yellow', { t0: Wd('12', 'ecrisle') - 0.1, y: 780 }), 44)
const sub2 = fs(tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('12', 'abonnetoi') - 0.1, y: 1135, from: 2.2, dur: 0.25 }), 76)
for (const b of [like1, sub2]) b.kick = (t) => 1 + 0.06 * Math.max(0, Math.sin((t - b.t0) * 9)) ** 4

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)
const WHO = { procureur: 'LE PROCUREUR', avocate: 'L’AVOCAT DE LA DÉFENSE', youtubeur: 'YANIS, EN DIRECT' }

// Gros sous-titres animés (pas sur l'appel au like : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => !['07-like'].includes(l.id))) {
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
  [K.RUSH, 8],
  [K.FACE, 12],
  [K.BURST, 30],
  [K.REPLAY, 10],
  [K.WRONG, 10],
  [K.DIFF, 16],
  [K.HATE, 10],
  [K.DEAD, 14],
  [K.TODAY, 10],
  [K.GAVEL + 0.1, 26],
  ...HOT.map(([a]) => [a, 14]),
  [Wd('04', 'streamer') - 0.15, 10],
  [Wd('05', 'combien') - 0.15, 10],
  [Wd('08', 'arrive') - 0.15, 10],
  [Wd('11', 'et') - 0.1, 14],
  [C.impact, 10],
  [Wd('12', 'jure') - 0.15, 8],
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

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)

  if (cur === HOOK) {
    const phase = t < K.REWIND ? 'A' : t < K.DATE ? 'C' : t < K.HATE ? 'D' : t < K.TODAY ? 'D2' : 'E'
    const freeze = t >= K.BURST
    show(HOOK.A, phase === 'A')
    show(HOOK.Cr, phase === 'C')
    show(HOOK.D, phase === 'D')
    show(HOOK.D2, phase === 'D2')
    show(HOOK.Ev, phase === 'E')
    const [hx, hy] = shakeAt(t, 0)
    if (phase === 'A') {
      // Le direct : Yanis fonce sur l'homme, lampe allumée ; gros plan ; capture d'écran.
      const tt = Math.min(t, K.BURST)
      const rush = ease.io2(clamp((tt - K.RUSH) / 0.6))
      const face = ease.io3(clamp((tt - K.FACE) / 0.35))
      const run = 14 * Math.sin(tt * 15) * (1 - face) * (0.4 + rush)
      const shield = ease.out3(clamp((tt - (K.FACE + 0.15)) / 0.3))
      HOOK.homme.update(t, {
        x: 560 - 30 * rush,
        y: 1150,
        scale: 0.72,
        mouth: tt > K.RUSH && tt < K.FACE ? 0.35 + 0.2 * Math.sin(tt * 13) : 0,
        brows: tt > 0.6 ? 'surprised' : 'neutral',
        look: [0.1 * Math.sin(tt * 2), lerp(0, -0.2, rush)],
        armR: [0.35, 2.1],
        armL: [lerp(0.2, 2.55, shield), lerp(0.4, 1.25, shield)],
        lean: -0.04 * rush,
        seed: 2.2,
      })
      place(HOOK.bouquet, 560 - 30 * rush + 70, 1225, 0.9, -10 + 4 * Math.sin(tt * 3))
      HOOK.torch.setAttribute('cx', 560 - 30 * rush)
      HOOK.torch.setAttribute('cy', 1050)
      let cx = 560
      let cy = lerp(1080, 1060, rush)
      let z = lerp(1.0 + 0.04 * tt, 1.35, rush)
      cx = lerp(cx, 530, face)
      cy = lerp(cy, 1040, face)
      z = lerp(z, 2.6, face)
      HOOK.Aw.setAttribute('transform', SHOT(cx, cy, z, 2 * Math.sin(tt * 3) + rush * 3 * Math.sin(tt * 7), 6 * Math.sin(tt * 7) + hx + run * 0.6, 5 * Math.sin(tt * 11) + hy + run))
      const jab = Math.max(0, Math.sin(tt * 9)) * (tt > K.RUSH ? 1 : 0.3)
      HOOK.hand.setAttribute('transform', `translate(${lerp(1200, 790, ease.out3(clamp(tt / 0.5))) - 40 * jab} ${1560 - 50 * jab + 30 * face}) rotate(${-8 + 6 * jab})`)
      HOOK.viewers.textContent = `👁 ${fr(12400 + 69600 * clamp(tt / K.BURST) ** 2)}`
      HOOK.comments.forEach((c, k) => {
        const v = (tt - c.t0) / 1.8
        const on = v > 0 && v < 1
        c.g.setAttribute('opacity', on ? Math.min(1, (1 - v) * 3).toFixed(2) : 0)
        if (on) c.g.setAttribute('transform', `translate(40 ${1800 - 300 * v})`)
      })
      HOOK.hearts.forEach((h) => {
        const v = (tt * 1.1 + h.ph) % 1
        h.el.setAttribute('opacity', (0.9 * (1 - v)).toFixed(2))
        h.el.setAttribute('transform', `translate(${980 + h.dx * 8 + 22 * Math.sin(v * 8 + h.ph * 6)} ${1800 - 700 * v}) scale(${0.4 + 0.3 * v})`)
      })
      // La capture : l'image se fige, rétrécit en carte, et part dans tous les sens.
      const u = ease.out3(clamp((t - K.BURST) / 0.35))
      if (freeze) HOOK.A.setAttribute('filter', 'url(#desat)')
      else HOOK.A.removeAttribute('filter')
      const shrink = `translate(540 960) rotate(${-4 * u}) scale(${1 - 0.22 * u}) translate(-540 -960)`
      HOOK.A.setAttribute('transform', shrink)
      HOOK.shotFrame.setAttribute('transform', shrink)
      HOOK.shotFrame.setAttribute('opacity', freeze ? 1 : 0)
      HOOK.shares.forEach((s, i) => {
        const v = (t - K.BURST - 0.3 - i * 0.03) / 0.7
        const on = v > 0 && v < 1
        s.g.setAttribute('opacity', on ? (1 - v * v).toFixed(2) : 0)
        if (on) s.g.setAttribute('transform', `translate(${540 + Math.cos(s.a) * s.v * ease.out3(v)} ${960 + Math.sin(s.a) * s.v * ease.out3(v)}) scale(${0.6 + 0.6 * v})`)
      })
    } else {
      HOOK.A.removeAttribute('filter')
      HOOK.shares.forEach((s) => s.g.setAttribute('opacity', 0))
    }
    if (phase === 'C') {
      // Rembobinage, puis la chaîne : onze arrestations, la douzième vidéo, l'erreur.
      const rw = t < K.REPLAY
      const k = Math.max(0, t - K.REPLAY)
      const zin = ease.io3(clamp((t - K.WRONG) / 0.5))
      const th = HOOK.thumbs[11]
      HOOK.Ccam.setAttribute('transform', SHOT(lerp(540, th.x + 160, zin), lerp(820 + 40 * k, th.y + 105, zin), lerp(1.0 + 0.02 * k, 2.8, zin), rw ? 3 * Math.sin(t * 40) : 0, (rw ? 30 * Math.sin(t * 70) : 0) + hx, hy))
      HOOK.yanisAv.update(t, { x: 170, y: 470, scale: 0.42, mouth: 0.3 * Math.max(0, Math.sin(t * 5)), brows: 'determined', look: [0.2, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 1 })
      HOOK.subs.textContent = `${fr(1180000 + 20000 * clamp(k / 3))} abonnés`
      HOOK.thumbs.forEach((b) => {
        const t0 = b.k < 11 ? Wd('02', 'onze') - 0.1 + b.k * 0.07 : K.WRONG - 0.05
        const v = b.k < 11 ? popS(t, t0, Infinity, 0.25) : popS(t, t0, Infinity, 0.25) * (1 + 0.08 * Math.max(0, Math.sin(t * 10)))
        show(b.badge, v > 0.01)
        if (v > 0.01) b.badge.setAttribute('transform', `translate(240 40) scale(${v.toFixed(3)}) rotate(${b.k === 11 ? 6 * Math.sin(t * 12) : 0})`)
      })
      const dv = popS(t, K.DIFF - 0.05, K.DATE, 0.35)
      show(HOOK.diff, dv > 0.01)
      if (dv > 0.01) {
        place(HOOK.diff, 540, 760 + 6 * Math.sin(t * 2), dv * 0.98, -2)
        HOOK.neq.setAttribute('transform', `scale(${(1 + 0.12 * Math.max(0, Math.sin(t * 8)) ** 4).toFixed(3)})`)
      }
      HOOK.rwBands.forEach((b, i) => {
        const r = rng(Math.floor(t * 30) + i)
        b.setAttribute('y', r() * H)
        b.setAttribute('height', 10 + r() * 40)
        b.setAttribute('opacity', rw ? 0.3 : 0)
      })
    } else {
      HOOK.rwBands.forEach((b) => b.setAttribute('opacity', 0))
      show(HOOK.diff, false)
    }
    if (phase === 'D') {
      // Le vrai rendez-vous : la conversation avec Sophie.
      const k = t - K.DATE
      HOOK.Dcam.setAttribute('transform', SHOT(540, 900, 1.0 + 0.03 * k, -1.5, hx, hy))
      HOOK.bubbles.forEach((b, i) => {
        const v = popS(t, K.DATE + 0.05 + i * ((K.HATE - K.DATE - 0.3) / 4), Infinity, 0.3)
        b.setAttribute('opacity', v > 0.01 ? 1 : 0)
        b.setAttribute('transform', `translate(${(1 - Math.min(1, v)) * (i === 1 || i === 2 ? 200 : -200)} ${[-250, -90, 70, 230][i]}) scale(${Math.max(0.01, v).toFixed(3)})`)
      })
    }
    if (phase === 'D2') {
      // Trois jours de haine sur son visage, puis le deuil.
      const dead = t >= K.DEAD
      const dk = clamp((t - K.DEAD) / 0.6)
      HOOK.hommeP.update(t, { x: 540, y: 1120, scale: 1.05, brows: dead ? 'sad' : 'surprised', look: [0, 0.1], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 2.2, blink: dead ? 0 : null, breathe: dead ? 0 : 1 })
      if (dead) HOOK.portrait.setAttribute('filter', 'url(#desat)')
      else HOOK.portrait.removeAttribute('filter')
      HOOK.ribbon.setAttribute('opacity', ease.out3(dk).toFixed(2))
      HOOK.dark.setAttribute('opacity', (0.45 * ease.out3(dk)).toFixed(2))
      HOOK.hate.forEach((b, i) => {
        const t0 = K.HATE + 0.05 + i * ((K.DEAD - K.HATE - 0.2) / HOOK.hate.length)
        const v = popS(t, t0, K.DEAD - 0.05, 0.22)
        show(b.g, v > 0.01)
        if (v > 0.01) place(b.g, b.x + 5 * Math.sin(t * 3 + i), b.y, v * 0.9, b.rot)
      })
      HOOK.D2cam.setAttribute('transform', SHOT(540, 990, 1.0 + 0.04 * (t - K.HATE) + (dead ? 0.06 * dk : 0), 0, hx + (dead ? 0 : 3 * Math.sin(t * 23)), hy))
    }
    if (phase === 'E') {
      // Yanis dans son studio : le marteau tombe, l'anneau lumineux se brise et s'éteint.
      const k = t - K.TODAY
      const after = t - K.GAVEL
      HOOK.yanisE.update(t, { x: 540, y: 1180, scale: 1.15, mouth: 0, brows: after > 0 ? 'surprised' : 'determined', look: [0, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 1.4 })
      HOOK.eFlash.setAttribute('opacity', (0.8 * Math.exp(-k * 8)).toFixed(3))
      const g = prog(t, K.GAVEL - 0.12, 0.12, ease.in3)
      show(HOOK.gavel, t > K.GAVEL - 0.4)
      HOOK.gavel.setAttribute('transform', `translate(${lerp(1000, 720, g)} ${lerp(100, 520, g)}) rotate(${lerp(-70, -10, g) + (after > 0 ? 6 * Math.exp(-after * 8) * Math.sin(after * 40) : 0)})`)
      ;[...HOOK.ringCracks.querySelectorAll('path')].forEach((c, i) => c.setAttribute('stroke-dashoffset', 900 * (1 - prog(t, K.GAVEL + i * 0.01, 0.2, ease.out3))))
      const off = after > 0 ? (after < 0.5 ? (Math.floor(after * 20) % 2 ? 0.3 : 1) : 0.15) : 1
      HOOK.ringC.setAttribute('opacity', off)
      HOOK.ring.firstChild.setAttribute('opacity', off)
      HOOK.Ecam.setAttribute('transform', SHOT(540, 960, 1.0 + 0.04 * k, 0, hx, hy))
    }
  }
  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const pause = id === '07'
    const isProc = l.who === 'procureur'
    const hot = !!hotAt(t)
    const grave = id === '11'
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
    if (prop(TRIB.bars, S('05') - 0.05, Wd('05', 'la') - 0.12, 540, 660, 0.85) > 0) TRIB.bars.n.setAttribute('transform', `scale(${(1 + 0.1 * Math.max(0, Math.sin(t * 8)) ** 4).toFixed(3)})`)
    prop(TRIB.tally, S('09') - 0.05, Wd('09', 'sans') - 0.15, 540, 680, 0.85)
    prop(TRIB.hoodie, Wd('10', 'mais') - 0.1, E('10') + 0.15, 540, 700, 0.8)
    prop(TRIB.thumb, Wd('11', 'pouce') - 0.3, E('11') + 0.2, 540, 720, 0.8)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.012, hand: 1 })
    VOTE.yanis.update(t, { x: 270, y: 1560, scale: 0.85, brows: 'determined', look: [0.3, 0], armR: [0.1, 0.5], armL: [0.1, 0.5], seed: 3.1 })
    VOTE.homme.update(t, { x: 0, y: 60, scale: 0.55, brows: 'sad', look: [0, 0], armR: [0.1, 0.4], armL: [0.1, 0.4], seed: 0.7, breathe: 0, blink: 0 })
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
    if (l.id.startsWith('07') || l.id.startsWith('08')) continue
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
