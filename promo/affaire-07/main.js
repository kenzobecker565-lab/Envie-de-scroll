/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°7 : la fausse avocate
 * ============================================================================
 *  Style A (celui du faux chirurgien) : motion design 2D vectoriel en SVG.
 *
 *  Le hook (≈ 11 s), pensé pour accrocher même sans le son :
 *  1. « 47 victoires » : dès la première image, elle plaide sous un projecteur
 *     doré ; le compteur s'emballe, 47 tampons verts « GAGNÉ » recouvrent le
 *     fond en accélérant ; les juges la citent en exemple, zoom sur son visage.
 *  2. « Elle n'a jamais été avocate » : coupure au noir, l'annuaire de l'Ordre,
 *     on tape son nom… « 0 RÉSULTAT », tampon « FAUSSE ».
 *  3. « Jugée dans la salle même où elle plaidait » : le même plan qu'à 0 s ;
 *     un volet la fait passer de la robe d'avocate à la tenue d'accusée, la
 *     lumière vire au bleu, les barreaux du box tombent.
 *  Puis le procès (un accessoire par réplique, coupes rapides entre les
 *  répliques qui se répondent) et le vote. Pas de jauge.
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

// 2 · L'annuaire de l'Ordre des avocats : on tape son nom… 0 résultat.
const REGISTRE = scene('registre', (L) => {
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#0b0d14' }, L.far)
  svg('circle', { cx: 540, cy: 900, r: 800, fill: '#2a2f45', opacity: 0.6 }, L.far)
  const screen = svg('g', {}, L.mid)
  svg('rect', { x: -420, y: -600, width: 840, height: 1160, rx: 40, fill: '#10131d', stroke: '#3a4060', 'stroke-width': 10 }, screen)
  svg('rect', { x: -380, y: -560, width: 760, height: 1080, rx: 18, fill: '#fbf8f0' }, screen)
  svg('rect', { x: -380, y: -560, width: 760, height: 170, rx: 18, fill: '#1d2a5c' }, screen)
  txt(screen, 'ORDRE DES AVOCATS', { x: 0, y: -485, 'font-size': 50, fill: '#fff' })
  txt(screen, 'ANNUAIRE OFFICIEL', { x: 0, y: -425, 'font-size': 34, fill: '#ffd166' })
  // Champ de recherche.
  svg('rect', { x: -330, y: -330, width: 660, height: 110, rx: 55, fill: '#fff', stroke: '#1d2a5c', 'stroke-width': 8 }, screen)
  svg('circle', { cx: -270, cy: -275, r: 22, fill: 'none', stroke: '#1d2a5c', 'stroke-width': 8 }, screen)
  svg('path', { d: 'M -254 -259 L -236 -241', stroke: '#1d2a5c', 'stroke-width': 9, 'stroke-linecap': 'round' }, screen)
  const query = svg('text', { x: -220, y: -260, 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 46, fill: '#1d2a5c' }, screen)
  const caret = svg('rect', { y: -300, width: 6, height: 52, fill: '#1d2a5c' }, screen)
  // Résultats : d'abord des lignes grises qui chargent, puis « 0 RÉSULTAT ».
  const loading = svg('g', {}, screen)
  for (let k = 0; k < 4; k++) {
    svg('rect', { x: -330, y: -150 + k * 140, width: 90, height: 90, rx: 45, fill: '#e3ddcf' }, loading)
    svg('rect', { x: -210, y: -135 + k * 140, width: 420, height: 22, rx: 11, fill: '#e3ddcf' }, loading)
    svg('rect', { x: -210, y: -95 + k * 140, width: 260, height: 18, rx: 9, fill: '#ece7db' }, loading)
  }
  const none = svg('g', {}, screen)
  txt(none, '0', { x: 0, y: 120, 'font-size': 260, fill: '#e5484d' })
  txt(none, 'RÉSULTAT', { x: 0, y: 220, 'font-size': 70, fill: '#e5484d' })
  txt(none, 'Aucune avocate inscrite à ce nom', { x: 0, y: 300, 'font-size': 36, 'font-weight': 700, fill: '#6b7280' })
  // Le grand tampon.
  const fake = svg('g', {}, L.fx)
  svg('rect', { x: -400, y: -120, width: 800, height: 240, rx: 34, fill: 'rgba(255,255,255,0.88)', stroke: '#e5484d', 'stroke-width': 20 }, fake)
  txt(fake, 'FAUSSE', { x: 0, y: 60, 'font-size': 190, fill: '#e5484d' })
  return { screen, query, caret, loading, none, fake }
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

const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12' }

// 4 · Le procès : chaque réplique a son plan et son accessoire.
const TRIB = scene('tribunal', (L) => {
  const procBg = svg('g', {}, L.far)
  courtroom(procBg, false)
  const avoBg = svg('g', {}, L.far)
  courtroom(avoBg, true)
  // Fond des répliques-chocs : trame de points.
  const hotBg = svg('g', {}, L.far)
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  const desk = svg('g', {}, L.front)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 400, fill: '#6a3f26' }, desk)
  svg('rect', { x: -300, y: 1775, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, desk)
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // Billets qui pleuvent (les honoraires).
  const bills = []
  const rb = rng(7)
  for (let k = 0; k < 14; k++) {
    const g = svg('g', { display: 'none' }, P)
    svg('rect', { x: -80, y: -40, width: 160, height: 80, rx: 8, fill: '#7fc98a', stroke: '#10121a', 'stroke-width': 6 }, g)
    svg('circle', { r: 24, fill: '#a9e0b0', stroke: '#10121a', 'stroke-width': 5 }, g)
    txt(g, '€', { x: 0, y: 12, 'font-size': 32, fill: '#10121a' })
    bills.push({ g, x: 60 + rb() * 960, d: rb() * 0.9, r: -40 + rb() * 80, v: 0.8 + rb() * 0.6 })
  }
  // 47 dossiers « ACQUITTÉ » qui deviennent « ANNULÉ ».
  const files = []
  const grid = prop((g) => {
    for (let k = 0; k < 47; k++) {
      const f = svg('g', { transform: `translate(${-405 + (k % 8) * 116} ${-250 + Math.floor(k / 8) * 92})` }, g)
      svg('rect', { x: -50, y: -36, width: 100, height: 72, rx: 6, fill: '#f2e4c8', stroke: '#10121a', 'stroke-width': 4 }, f)
      svg('rect', { x: -50, y: -46, width: 44, height: 14, rx: 4, fill: '#f2e4c8', stroke: '#10121a', 'stroke-width': 4 }, f)
      const ok = svg('rect', { x: -40, y: -12, width: 80, height: 26, rx: 5, fill: '#12a150' }, f)
      files.push({ f, ok })
    }
  })
  // Le château de cartes (« tout s'effondrerait un jour »).
  const cards = []
  const castle = prop((g) => {
    const rows = 4
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < rows - r; c++) {
        const x = (c - (rows - r - 1) / 2) * 120
        const y = 200 - r * 120
        for (const sd of [-1, 1]) {
          const card = svg('g', {}, g)
          svg('rect', { x: -10, y: -60, width: 20, height: 120, rx: 4, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 5 }, card)
          cards.push({ card, x: x + sd * 26, y, rot: sd * 22, k: cards.length })
        }
      }
  })
  // Le tableau d'affichage : ELLE 1 – 0 LUI.
  const board = prop((g) => {
    svg('rect', { x: -330, y: -110, width: 660, height: 220, rx: 24, fill: '#10121a', stroke: '#ffd166', 'stroke-width': 10 }, g)
    txt(g, 'ELLE', { x: -200, y: -40, 'font-size': 44, fill: '#ffd166' })
    txt(g, 'LUI', { x: 200, y: -40, 'font-size': 44, fill: '#9fe0ff' })
    txt(g, '1', { x: -200, y: 80, 'font-size': 120, fill: '#ffffff' })
    txt(g, '0', { x: 200, y: 80, 'font-size': 120, fill: '#ffffff' })
    txt(g, '–', { x: 0, y: 70, 'font-size': 100, fill: '#ffffff' })
  })
  // Le diplôme (« un bout de papier »).
  const paper = prop((g) => {
    svg('rect', { x: -200, y: -140, width: 400, height: 280, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -175, y: -115, width: 350, height: 230, fill: 'none', stroke: '#c9a24a', 'stroke-width': 6 }, g)
    txt(g, 'DIPLÔME', { x: 0, y: -40, 'font-size': 52, fill: '#2b2b2b' })
    for (let k = 0; k < 2; k++) svg('rect', { x: -120, y: 0 + k * 34, width: 240, height: 10, rx: 5, fill: '#d8d0bd' }, g)
    svg('circle', { cx: 130, cy: 80, r: 34, fill: '#c9a24a' }, g)
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, bills, grid, files, castle, cards, board, paper }
})

// 5 · Le vote : elle, seule, dans le box.
const VOTE = scene('vote', (L) => {
  courtroom(L.far, false)
  const actor = makePerson(L.actor, ACCUSED)
  const bars = svg('g', {}, L.front)
  for (let i = 0; i < 9; i++) svg('rect', { x: 20 + i * 130, y: -200, width: 26, height: 2100, rx: 13, fill: 'url(#bar)', opacity: 0.85 }, bars)
  svg('rect', { x: -100, y: 1700, width: W + 200, height: 400, fill: '#0b0f22' }, L.front)
  return { actor }
})

// Transitions.
const fxTop = svg('g', {}, root)
const flash = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff', opacity: 0 }, fxTop)
const black = svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0 }, fxTop)
const iris = svg('circle', { cx: 540, cy: 960, r: 0, fill: '#ffd166' }, fxTop)
const DOTS = []
for (let y = -1; y < 18; y++) for (let x = -1; x < 10; x++) DOTS.push({ el: svg('circle', { cx: x * 120 + (y % 2) * 60, cy: y * 120, r: 0, fill: '#ffd166' }, fxTop), d: (x + y) * 0.011 })
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
const C1 = Wd('01', 'victoires') + 0.3
const counter = tag('<span class="num">0</span><span class="unit">VICTOIRE</span>', 'counter', { t0: 0, t1: SEC.plaide.t1 - 0.05, y: 290 })
const STAMP_T = Array.from({ length: 47 }, (_, k) => C0 + 0.1 + (C1 - C0 - 0.1) * (k / 46) ** 0.65)
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
const T_FACE = Wd('01', 'des') - 0.1
fs(tag('0 DÉFAITE', 'stamp green', { t0: C1 + 0.05, t1: SEC.plaide.t1 - 0.05, y: 540, rot: -6, from: 2.6, dur: 0.22 }), 96)
// Ce que disent les juges, autour de son visage.
tag('« BRILLANTE »', 'pill yellow', { t0: Wd('01', 'juges') - 0.1, t1: SEC.plaide.t1 - 0.05, y: 760, x: 250, rot: -6 })
tag('« EXEMPLAIRE »', 'pill', { t0: Wd('01', 'citaient') - 0.1, t1: SEC.plaide.t1 - 0.05, y: 1000, x: 830, rot: 5 })
tag('« UNE RÉFÉRENCE »', 'pill yellow', { t0: Wd('01', 'exemple') - 0.1, t1: SEC.plaide.t1 - 0.05, y: 1220, x: 300, rot: -3 })
tag('UN DÉTAIL…', 'pill small', { t0: S('02') - 0.05, t1: SEC.registre.t1, y: 200 })
tag('LA MÊME SALLE ↓', 'pill yellow', { t0: Wd('03', 'salle') - 0.1, t1: SEC.box.t1, y: 300, rot: -3 })
fs(tag('ACCUSÉE', 'stamp', { t0: Wd('03', 'plaidait') - 0.05, t1: SEC.box.t1, y: 470, rot: -6, from: 2.6, dur: 0.22 }), 130)
// Le procès.
function counterTag(t0, t1, to, unit, { y = 420, fmt = (v) => String(v), dur = 0.7 } = {}) {
  const T = tag(`<span class="num">0</span><span class="unit">${unit}</span>`, 'counter', { t0, t1, y, from: 1.3 })
  T.update = (t) => (T.el.querySelector('.num').textContent = fmt(Math.round(to * ease.out3(clamp((t - t0) / dur)))))
  return T
}
const euros = (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €'
tag('6 ANS', 'pill', { t0: Wd('04', '6') - 0.1, t1: Wd('04', 'titre') - 0.15, y: 230, rot: -2 })
counterTag(Wd('04', '300') - 0.1, E('04') + 0.1, 300000, 'D’HONORAIRES', { fmt: euros, dur: 0.8 })
tag('POUR UN TITRE QU’ELLE N’AVAIT PAS', 'pill red', { t0: Wd('04', 'titre') - 0.1, t1: E('04') + 0.1, y: 230, rot: -2 }).el.style.fontSize = '46px'
tag('300 000 €…', 'pill small', { t0: S('05') - 0.05, t1: Wd('05', '47') - 0.1, y: 230 })
counterTag(Wd('05', '47') - 0.1, E('05') + 0.1, 47, 'PERSONNES LIBRES', { dur: 0.6 })
tag('CHEZ ELLES', 'pill yellow', { t0: Wd('05', 'chez') - 0.1, t1: E('05') + 0.1, y: 620, x: 290, rot: -4 })
tag('PAS EN PRISON', 'pill red', { t0: Wd('05', 'prison') - 0.1, t1: E('05') + 0.1, y: 620, x: 770, rot: 4 })
fs(tag('POUR L’INSTANT.', 'slam white', { t0: S('06') - 0.05, t1: Wd('06', 'un') - 0.05, y: 300, rot: -3, from: 2.4, dur: 0.2 }), 110)
tag('PEUT ÊTRE ANNULÉ', 'pill red', { t0: Wd('06', 'annule') - 0.15, t1: E('06') + 0.1, y: 230, rot: -2 })
fs(tag('REJUGÉES', 'stamp', { t0: Wd('06', 'rejugees') - 0.05, t1: E('06') + 0.1, y: 600, rot: -8, from: 2.8, dur: 0.2 }), 120)
tag('SON TRAVAIL', 'pill yellow', { t0: Wd('07', 'travail') - 0.1, t1: E('07') + 0.1, y: 240, x: 290, rot: -3 })
tag('UN BOUT DE PAPIER', 'pill red', { t0: Wd('07', 'bout') - 0.1, t1: E('07') + 0.1, y: 240, x: 760, rot: 3 })
fs(tag('ELLE SAVAIT.', 'slam white', { t0: Wd('08', 'savait') - 0.06, t1: E('08') + 0.1, y: 260, rot: -3, from: 2.6, dur: 0.2 }), 130)
tag('IL Y A 3 ANS', 'pill small', { t0: S('09') - 0.05, t1: Wd('09', 'lui') - 0.1, y: 230 })
const lui = fs(tag('LUI…<br>AVAIT SON DIPLÔME.', 'slam yellow', { t0: Wd('09', 'diplome') - 0.08, t1: E('09') + 0.15, y: 400, rot: -3, from: 2.6, dur: 0.2 }), 96)
lui.el.style.cssText += 'text-align:center;line-height:1.05'
fs(tag('IL M’INTERDIT', 'slam white', { t0: Wd('10', 'minterdit') - 0.06, t1: E('10') + 0.25, y: 300, rot: -2, from: 2.4, dur: 0.2 }), 110)
fs(tag('DE MENTIR.', 'slam yellow', { t0: Wd('10', 'mentir') - 0.06, t1: E('10') + 0.25, y: 460, rot: 2, from: 2.8, dur: 0.2 }), 140)
// Le vote.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('11', 'jure') - 0.15, y: 330, from: 1.4, dur: 0.5 }), 110)
tag('COUPABLE', 'vote red', { t0: Wd('11', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('11', 'non') - 0.1, y: 730, rot: 3 })
tag('Et toi, tu lui aurais confié ta défense ?', 'pill yellow', { t0: Wd('11', 'et') - 0.1, y: 1640, from: 1.2 }).el.style.fontSize = '46px'

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

const T_SWAP = Wd('03', 'jugee') - 0.15
const T_SEARCH = S('02') - 0.05
const T_ZERO = Wd('02', 'jamais') - 0.1
const T_FAKE = Wd('02', 'avocate') - 0.05
const IMPACTS = [
  ...STAMP_T.map((x) => [x, 3]),
  [C1 + 0.05, 12],
  [T_ZERO, 10],
  [T_FAKE, 20],
  [T_SWAP + 0.35, 12],
  [Wd('03', 'plaidait') - 0.05, 14],
  [Wd('06', 'rejugees') - 0.05, 12],
  [Wd('08', 'savait') - 0.06, 10],
  [Wd('08', 'seffondrerait'), 12],
  [Wd('09', 'diplome') - 0.08, 16],
  [Wd('10', 'mentir') - 0.06, 16],
  [Wd('11', 'jure') - 0.15, 8],
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
const show = (el, on) => el.setAttribute('display', on ? 'inline' : 'none')
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.12) ?? TLINES[0]
// Les répliques-chocs : fond tramé (rouge pour la défense, bleu nuit pour le procureur).
const HOT = { '09': '#b3232b', '10': '#1d2a5c' }
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
    // Contre-plongée qui pousse, puis coup de zoom sur le visage (« des juges qui la citaient en exemple »).
    const punch = prog(t, T_FACE, 0.3, ease.out3)
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
    const smile = prog(t, T_FACE, 0.3)
    PLAIDE.actor.update(t, pleading(t, smile > 0 ? { mouth: 0, brows: 'determined', look: [0, -0.1], armR: [lerp(2.75, 1.2, smile), lerp(0.2, 1.2, smile)] } : {}))
  }
  if (cur === REGISTRE) {
    const z = prog(t, REGISTRE.t0, 1.4, ease.out3)
    const hit = prog(t, T_FAKE, 0.25, ease.out3)
    cam(REGISTRE, t, { zoom: lerp(1.0, 1.1, z) + 0.08 * hit, cy: 960, push: 0.02 })
    place(REGISTRE.screen, 540, 980, 1, -2 + 2 * z)
    // On tape son nom, lettre par lettre.
    const name = 'Marie LAURENT'
    const n = Math.floor(clamp((t - T_SEARCH - 0.1) / 0.55) * name.length)
    REGISTRE.query.textContent = name.slice(0, n)
    const qw = n > 0 ? REGISTRE.query.getComputedTextLength() : 0
    REGISTRE.caret.setAttribute('x', -218 + qw)
    REGISTRE.caret.setAttribute('opacity', Math.floor(t * 4) % 2 ? 1 : 0.2)
    // Chargement (lignes qui clignotent), puis « 0 RÉSULTAT ».
    const zero = t >= T_ZERO
    REGISTRE.loading.setAttribute('display', !zero && t > T_SEARCH + 0.7 ? 'inline' : 'none')
    REGISTRE.loading.setAttribute('opacity', 0.5 + 0.5 * Math.sin(t * 14))
    const zs = zero ? ease.back(2.6)(clamp((t - T_ZERO) / 0.25)) : 0
    REGISTRE.none.setAttribute('display', zero ? 'inline' : 'none')
    REGISTRE.none.setAttribute('transform', `translate(0 ${-40 * (1 - zs)}) scale(${Math.max(0.001, zs)})`)
    const u = t - T_FAKE
    REGISTRE.fake.setAttribute('display', u >= 0 ? 'inline' : 'none')
    if (u >= 0) {
      const sc = u < 0.09 ? lerp(3, 1, ease.in3(u / 0.09)) : 1 + 0.06 * Math.exp(-(u - 0.09) * 14) * Math.cos((u - 0.09) * 40)
      place(REGISTRE.fake, 540, 760, sc, -12)
    }
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

  if (cur === TRIB) {
    const l = trialLine(t)
    const id = l.id.slice(0, 2)
    const isProc = l.who === 'procureur'
    const hot = HOT[id]
    show(TRIB.procBg, isProc && !hot)
    show(TRIB.avoBg, !isProc && !hot)
    show(TRIB.hotBg, !!hot)
    if (hot) TRIB.hotFill.setAttribute('fill', hot)
    show(TRIB.proc.root, isProc)
    show(TRIB.avo.root, !isProc)
    // Coup de zoom sur la dernière phrase de chaque réplique ; d'entrée sur les répliques-chocs.
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch), cy: lerp(980, 900, Math.min(1, punch)), push: 0.03 })
    const sp = speaking(l.who, t)
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540,
      y: 1170,
      scale: 1.4,
      mouth: m,
      brows: isProc ? (['06', '08'].includes(id) ? 'angry' : 'determined') : id === '09' ? 'determined' : 'neutral',
      look: [0, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * beat : 0), 1.0 + (sp ? 0.3 * beat : 0)],
      armL: [0.25 + (sp ? 0.1 * beat : 0), 1.2 + (sp ? 0.25 * Math.sin(t * 4.1) : 0)],
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.04 * Math.sin(t * 1.2) + (id === '09' ? 0.06 : 0),
    })
    // Billets qui pleuvent sur les honoraires.
    const b0 = Wd('04', '300') - 0.2
    for (const B of TRIB.bills) {
      const u = t - b0 - B.d
      const on = id === '04' && u > 0
      show(B.g, on)
      if (on) place(B.g, B.x + 40 * Math.sin(u * 3 + B.r), -120 + 700 * B.v * u, 0.8, B.r + u * 60)
    }
    // Les 47 dossiers : « ACQUITTÉ » (vert) puis « ANNULÉ » (rouge), en vague.
    const gs = id === '06' ? popS(t, Wd('06', 'proces') - 0.15, E('06'), 0.35) : 0
    show(TRIB.grid, gs > 0.01)
    if (gs > 0.01) {
      place(TRIB.grid, 540, 620, gs * 0.6)
      TRIB.files.forEach((F, k) => F.ok.setAttribute('fill', t > Wd('06', 'annule') - 0.1 + k * 0.018 ? '#e5484d' : '#12a150'))
    }
    // Le diplôme : un bout de papier, qui tourne au vent.
    const ps = id === '07' ? popS(t, Wd('07', 'bout') - 0.15, E('07') + 0.05, 0.35) : 0
    show(TRIB.paper, ps > 0.01)
    if (ps > 0.01) place(TRIB.paper, 540, 560 + 10 * Math.sin(t * 3), ps * 0.8, 8 * Math.sin(t * 2))
    // Le château de cartes : il se monte, puis s'effondre.
    const cs = id === '08' ? popS(t, Wd('08', 'elle') - 0.15, E('08') + 0.05, 0.3) : 0
    show(TRIB.castle, cs > 0.01)
    if (cs > 0.01) {
      place(TRIB.castle, 540, 660, cs * 0.6)
      const fall = t - Wd('08', 'seffondrerait')
      for (const K of TRIB.cards) {
        const u = clamp((fall - K.k * 0.012) / 0.7)
        const dx = (K.x > 0 ? 1 : -1) * 160 * ease.out2(u) + K.x * 0.4 * u
        K.card.setAttribute('transform', `translate(${K.x + dx} ${K.y + 420 * ease.in2(u) - 120 * Math.sin(u * Math.PI) * 0.5}) rotate(${K.rot + u * (K.k % 2 ? 140 : -160)})`)
      }
    }
    // Le score : ELLE 1 – 0 LUI.
    const bs = id === '09' ? popS(t, Wd('09', 'battu') - 0.1, Wd('09', 'lui') - 0.1, 0.35) : 0
    show(TRIB.board, bs > 0.01)
    if (bs > 0.01) place(TRIB.board, 540, 720, bs * 0.8, -3)
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions : flash blanc, et une coupure au noir avant l'annuaire.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, 0.35 * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  const k = t - (SEC.registre.t0 - 0.12)
  black.setAttribute('opacity', k > 0 && k < 0.12 ? 1 : 0)
  // Volet de points jaunes (vers le procès, vers le vote).
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
  // Entre deux répliques du procès : disque jaune, très court (le passe-passe).
  let ir = 0
  for (const l of TLINES.slice(1)) {
    const q = t - (l.start - 0.12)
    if (q > -0.1 && q < 0.12) ir = q < 0 ? lerp(0, 1400, ease.in3(clamp((q + 0.1) / 0.1))) : lerp(1400, 0, ease.out3(clamp(q / 0.12)))
  }
  iris.setAttribute('r', ir)

  updateTags(t)
  const w = C.lines.find((l) => t >= l.start - 0.05 && t < l.start + l.dur && (l.who === 'procureur' || l.who === 'avocate'))
  who.textContent = w ? (w.who === 'procureur' ? 'LE PROCUREUR' : 'L’AVOCAT DE LA DÉFENSE') : ''
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
