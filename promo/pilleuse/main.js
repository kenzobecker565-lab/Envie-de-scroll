/**
 * ============================================================================
 *  « Affaire Classée ? » — la pilleuse (≈ 75 s, 1080 × 1920)
 * ============================================================================
 *  Style A (celui du faux chirurgien et de la fausse avocate) : motion design
 *  2D vectoriel en SVG, gros sous-titres animés, pas de jauge.
 *
 *  Le hook, très animé, montre le pillage :
 *  1. La nuit d'émeutes : rue en feu, voiture qui brûle, fumée, braises,
 *     gyrophares ; des pilleurs sortent du supermarché en courant avec leur
 *     butin ; le vigile à terre devant la grille arrachée ; « COMA ».
 *  2. La vidéo du téléphone (cadre REC) : le rayon pillé, les produits qui
 *     tombent ; elle traverse et enjambe le corps ; ce qu'elle porte s'étiquette
 *     un à un, arrêt sur image sur la console.
 *  3. Sa fiche : 23 ans, aide-soignante, casier vierge… tampon « JUGÉE ».
 *  Puis le procès (un accessoire par réplique, coupes rapides) et le vote,
 *  avec l'appel à s'abonner.
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

// Silhouette qui marche ou court (vue de profil), avec un liseré de lumière.
function walker(parent, { color = '#1d2130', rim = '#ff8a3d', hood = false, dir = 1, carry = 'box', vest = false } = {}) {
  const g = svg('g', {}, parent)
  const inner = svg('g', { transform: `scale(${dir} 1)` }, g)
  const legB = svg('path', { fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  const armB = svg('path', { fill: 'none', stroke: color, 'stroke-width': 24, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  svg('rect', { x: -38, y: -230, width: 76, height: 140, rx: 32, fill: color }, inner)
  if (vest) for (const y of [-200, -160]) svg('rect', { x: -38, y, width: 76, height: 12, fill: '#e8ff3a' }, inner)
  svg('path', { d: 'M 30 -220 Q 46 -160 34 -100', fill: 'none', stroke: rim, 'stroke-width': 9, opacity: 0.95 }, inner)
  svg('circle', { cx: 6, cy: -262, r: 34, fill: color }, inner)
  if (hood) svg('path', { d: 'M -34 -250 C -40 -310 46 -316 46 -262 C 40 -240 30 -236 22 -234 Z', fill: color }, inner)
  svg('path', { d: 'M 22 -292 A 34 34 0 0 1 38 -246', fill: 'none', stroke: rim, 'stroke-width': 9, opacity: 0.95 }, inner)
  const legF = svg('path', { fill: 'none', stroke: color, 'stroke-width': 32, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  // Le butin, tenu devant.
  const loot = svg('g', {}, inner)
  if (carry === 'tv') {
    svg('rect', { x: 10, y: -250, width: 120, height: 84, rx: 8, fill: '#1c2230', stroke: rim, 'stroke-width': 4 }, loot)
    svg('rect', { x: 20, y: -240, width: 100, height: 62, fill: '#3a4a6a' }, loot)
  } else if (carry === 'box') {
    svg('rect', { x: 14, y: -230, width: 90, height: 74, rx: 6, fill: '#b98a4a', stroke: '#6a4a20', 'stroke-width': 4 }, loot)
    svg('path', { d: 'M 14 -200 L 104 -200', stroke: '#6a4a20', 'stroke-width': 4 }, loot)
  } else if (carry === 'bags') {
    for (const [x, c] of [[24, '#e5484d'], [62, '#3b82f6']]) svg('path', { d: `M ${x} -190 l 40 0 l 6 70 l -52 0 Z`, fill: c, stroke: '#111', 'stroke-width': 3 }, loot)
  }
  const armF = svg('path', { fill: 'none', stroke: color, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, inner)
  // phase : cycle de marche ; stride : amplitude ; high : jambe avant levée (enjamber).
  function update(x, y, s, phase, { stride = 1, high = 0 } = {}) {
    g.setAttribute('transform', `translate(${x} ${y - Math.abs(Math.sin(phase)) * 10 * stride}) scale(${s})`)
    const leg = (p, lift) => {
      const hipX = 0
      const hipY = -100
      const a = Math.sin(p) * 0.55 * stride
      const kx = hipX + Math.sin(a) * 60 + lift * 50
      const ky = hipY + Math.cos(a) * 60 - lift * 50
      const fx = kx + Math.sin(a - 0.4 * Math.max(0, Math.cos(p))) * 60 + lift * 30
      const fy = ky + 60 - lift * 20
      return `M ${hipX} ${hipY} L ${kx} ${ky} L ${fx} ${fy} l 18 0`
    }
    legF.setAttribute('d', leg(phase, high))
    legB.setAttribute('d', leg(phase + Math.PI, 0))
    const holding = carry !== 'none'
    armF.setAttribute('d', holding ? 'M 0 -200 L 40 -170 L 60 -200' : `M 0 -200 L ${Math.sin(phase + Math.PI) * 40} -140 L ${Math.sin(phase + Math.PI) * 60} -90`)
    armB.setAttribute('d', holding ? 'M -6 -200 L 30 -160 L 50 -190' : `M -6 -200 L ${Math.sin(phase) * 40} -140 L ${Math.sin(phase) * 60} -90`)
  }
  return { g, loot, update }
}
// Le vigile à terre (silhouette allongée, gilet fluo).
function lyingGuard(parent, { color = '#151924', rim = '#ff8a3d' } = {}) {
  const g = svg('g', {}, parent)
  svg('ellipse', { cx: 0, cy: 8, rx: 190, ry: 18, fill: '#000', opacity: 0.35 }, g)
  svg('rect', { x: -150, y: -46, width: 200, height: 60, rx: 28, fill: color }, g)
  for (const x of [-110, -60]) svg('rect', { x, y: -46, width: 16, height: 60, fill: '#e8ff3a' }, g)
  svg('circle', { cx: -180, cy: -22, r: 32, fill: color }, g)
  svg('path', { d: 'M 40 -20 L 150 -10 L 200 -30', fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M 40 0 L 160 10 L 190 -6', fill: 'none', stroke: color, 'stroke-width': 30, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g)
  svg('path', { d: 'M -100 -30 L -60 30 L -110 50', fill: 'none', stroke: color, 'stroke-width': 22, 'stroke-linecap': 'round' }, g)
  svg('path', { d: 'M -212 -36 A 32 32 0 0 1 -160 -48', fill: 'none', stroke: rim, 'stroke-width': 5, opacity: 0.8 }, g)
  return g
}
// Des flammes qui dansent (chaque langue oscille).
function fire(parent, x, y, s = 1, seed = 1) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent)
  svg('ellipse', { cx: 0, cy: -60, rx: 220, ry: 200, fill: 'url(#fireGlow)' }, g)
  const r = rng(seed)
  const tongues = Array.from({ length: 7 }, (_, k) => {
    const el = svg('path', { fill: ['#ff5a1f', '#ff8a1f', '#ffc04a', '#fff1a8'][k % 4], opacity: 0.95 }, g)
    return { el, x: (k - 3) * 26 + (r() - 0.5) * 10, h: 90 + r() * 90, w: 34 + r() * 20, ph: r() * 6, k }
  })
  return (t) => {
    for (const q of tongues) {
      const h = q.h * (0.75 + 0.25 * Math.sin(t * 11 + q.ph) + 0.1 * Math.sin(t * 23 + q.ph * 2))
      const sway = 14 * Math.sin(t * 7 + q.ph)
      q.el.setAttribute('d', `M ${q.x - q.w} 0 C ${q.x - q.w} ${-h * 0.4} ${q.x + sway - 6} ${-h * 0.7} ${q.x + sway} ${-h} C ${q.x + sway + 6} ${-h * 0.7} ${q.x + q.w} ${-h * 0.4} ${q.x + q.w} 0 Z`)
    }
  }
}

const PROC = { robe: '#c43a2f', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12' }
const AVO = { robe: '#23262f', jabot: true, hair: 'short', hairColor: '#2a1a10', beard: true, skin: '#d9a07a', iris: '#2b1d12' }
const INES = { robe: '#5fb3c9', jabot: false, vneck: '#4a98ad', hair: 'bob', hairColor: '#2a1810', female: true, skin: '#c98d68', iris: '#3b2a1a' }
const INES_BOX = { robe: '#6b7280', jabot: false, collar: '#e5e7eb', hair: 'bob', hairColor: '#2a1810', female: true, skin: '#c98d68', iris: '#3b2a1a' }

// 1 · La nuit d'émeutes.
const EMEUTE = scene('emeute', (L) => {
  bg(L, 'url(#nightFire)')
  const r = rng(3)
  // Immeubles au loin, fenêtres qui clignotent.
  const wins = []
  for (let i = 0; i < 7; i++) {
    const x = -60 + i * 170
    const h = 500 + r() * 400
    svg('rect', { x, y: 1000 - h, width: 160, height: h + 400, fill: '#120a18' }, L.far)
    for (let j = 0; j < 8; j++)
      for (let k = 0; k < 3; k++) if (r() < 0.55) wins.push({ el: svg('rect', { x: x + 18 + k * 46, y: 1040 - h + j * 70, width: 26, height: 36, fill: '#ffb347', opacity: 0.6 }, L.far), ph: r() * 10 })
  }
  // Fumée qui monte.
  const smoke = Array.from({ length: 10 }, (_, k) => ({ el: svg('circle', { r: 120 + r() * 120, fill: '#2a2230', opacity: 0.55 }, L.far), x: r() * W, ph: r(), sp: 0.05 + r() * 0.05 }))
  // Le supermarché : façade, enseigne, grille arrachée, vitre brisée.
  const shop = svg('g', {}, L.mid)
  svg('rect', { x: 120, y: 760, width: 840, height: 700, fill: '#1b2230' }, shop)
  svg('rect', { x: 120, y: 760, width: 840, height: 110, fill: '#0f141d' }, shop)
  const sign = txt(shop, 'SUPERMARCHÉ', { x: 540, y: 840, 'font-size': 76, fill: '#ff5d73' })
  svg('rect', { x: 250, y: 930, width: 580, height: 530, fill: '#0a0d14' }, shop)
  svg('rect', { x: 250, y: 930, width: 580, height: 530, fill: 'url(#shopLight)' }, shop)
  // Grille tordue.
  for (let i = 0; i < 12; i++) {
    const x = 262 + i * 48
    const bend = i > 4 && i < 9 ? 60 + (i - 4) * 20 : 0
    svg('path', { d: `M ${x} 930 L ${x} ${1100 - bend} Q ${x + bend * 0.6} ${1150 - bend} ${x + bend} ${1080 - bend * 0.6}`, fill: 'none', stroke: '#8a94a8', 'stroke-width': 8 }, shop)
  }
  svg('path', { d: 'M 250 930 L 830 930', stroke: '#8a94a8', 'stroke-width': 14 }, shop)
  // Éclats de verre au sol.
  for (let i = 0; i < 24; i++) svg('path', { d: `M ${200 + r() * 700} ${1470 + r() * 60} l ${8 + r() * 14} ${-6} l ${4} ${12} Z`, fill: '#cfe8ff', opacity: 0.8 }, shop)
  // Le trottoir.
  svg('rect', { x: -400, y: 1460, width: W + 800, height: 1400, fill: '#150f14' }, L.mid)
  svg('rect', { x: -200, y: 1460, width: W + 400, height: 10, fill: '#3a2a2a' }, L.mid)
  // La voiture qui brûle (gauche) et une poubelle en feu (droite).
  const car = svg('g', { transform: 'translate(-40 1500)' }, L.mid)
  svg('path', { d: 'M 0 0 L 0 -90 Q 10 -120 60 -120 L 100 -180 L 260 -180 L 320 -120 L 380 -110 Q 400 -100 400 -60 L 400 0 Z', fill: '#16161c' }, car)
  for (const x of [80, 320]) svg('circle', { cx: x, cy: 0, r: 46, fill: '#0b0b0f' }, car)
  const fires = [fire(L.mid, 150, 1350, 1.3, 2), fire(L.mid, 960, 1470, 0.7, 5)]
  // Les pilleurs qui sortent en courant.
  const runners = [
    { w: walker(L.actor, { carry: 'tv', dir: 1 }), t0: 0.0, dur: 2.0, y: 1560, s: 1.5, from: 420, to: 1350 },
    { w: walker(L.actor, { carry: 'box', dir: -1, hood: true, rim: '#7fb0ff' }), t0: 0.5, dur: 1.8, y: 1520, s: 1.3, from: 640, to: -280 },
    { w: walker(L.actor, { carry: 'bags', dir: 1, rim: '#7fb0ff' }), t0: 1.5, dur: 1.8, y: 1580, s: 1.6, from: 480, to: 1400 },
    { w: walker(L.actor, { carry: 'tv', dir: -1 }), t0: 2.7, dur: 1.8, y: 1540, s: 1.45, from: 620, to: -300 },
  ]
  // Le vigile à terre, devant la grille.
  const guard = svg('g', {}, L.actor)
  lyingGuard(guard)
  const ring = svg('circle', { cx: 0, cy: -10, r: 240, fill: 'none', stroke: '#ffd166', 'stroke-width': 10, 'stroke-dasharray': 1600, 'stroke-dashoffset': 1600 }, guard)
  // Braises.
  const embers = Array.from({ length: 40 }, () => ({ el: svg('circle', { r: 3 + r() * 4, fill: '#ffb347' }, L.fx), x: r() * W, ph: r(), sp: 0.25 + r() * 0.35 }))
  // Gyrophares.
  const gyroR = svg('ellipse', { cx: 0, cy: 1100, rx: 900, ry: 900, fill: 'url(#glowRed)', opacity: 0 }, L.fx)
  const gyroB = svg('ellipse', { cx: W, cy: 1100, rx: 900, ry: 900, fill: 'url(#glowBlue)', opacity: 0 }, L.fx)
  return { wins, smoke, sign, fires, runners, guard, ring, embers, gyroR, gyroB }
})

// 2 · La vidéo du téléphone, dans le rayon pillé.
const VIDEO = scene('video', (L) => {
  bg(L, 'url(#aisle)')
  const r = rng(8)
  // Rayons en perspective (deux murs de produits).
  const items = []
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const y = 520 + k * 170
      const x0 = side < 0 ? -40 : 700
      svg('rect', { x: x0, y, width: 420, height: 16, fill: '#5a6478' }, L.far)
      for (let i = 0; i < 6; i++) {
        if (r() < 0.35) continue
        const el = svg('rect', { x: x0 + 14 + i * 66, y: y - 70 - r() * 30, width: 52, height: 70, rx: 6, fill: ['#e5484d', '#3b82f6', '#ffd166', '#12a150', '#f06a8a'][Math.floor(r() * 5)] }, L.far)
        items.push({ el, x: x0 + 40 + i * 66, y: y - 40, fall: r() < 0.4, ph: r() })
      }
    }
  }
  svg('rect', { x: 380, y: 300, width: 320, height: 1300, fill: '#0e131c', opacity: 0.6 }, L.far)
  svg('rect', { x: -400, y: 1500, width: W + 800, height: 1400, fill: '#1a2130' }, L.mid)
  // Produits par terre.
  for (let i = 0; i < 18; i++) svg('rect', { x: r() * W, y: 1520 + r() * 260, width: 50, height: 34, rx: 5, fill: ['#e5484d', '#3b82f6', '#ffd166'][i % 3], transform: `rotate(${(r() - 0.5) * 80})`, opacity: 0.85 }, L.mid)
  // Pilleurs qui traversent au fond.
  const runners = [
    { w: walker(L.mid, { carry: 'box', dir: 1, rim: '#9fd0ff' }), t0: 0.1, dur: 1.6, y: 1360, s: 0.8, from: -150, to: 1200 },
    { w: walker(L.mid, { carry: 'bags', dir: -1, rim: '#9fd0ff' }), t0: 1.2, dur: 1.5, y: 1340, s: 0.75, from: 1200, to: -150 },
    { w: walker(L.mid, { carry: 'tv', dir: 1, rim: '#9fd0ff' }), t0: 3.4, dur: 1.7, y: 1380, s: 0.85, from: -150, to: 1200 },
  ]
  // Le vigile au premier plan, et elle qui arrive.
  const guard = svg('g', {}, L.actor)
  lyingGuard(guard, { rim: '#9fd0ff' })
  const her = walker(L.actor, { carry: 'none', dir: -1, hood: true, color: '#141821', rim: '#ffd166' })
  // Ce qu'elle porte (dessiné par-dessus, dans ses bras).
  const arms = svg('g', {}, L.actor)
  const loot = {
    couches: (() => {
      const g = svg('g', {}, arms)
      svg('rect', { x: -60, y: -40, width: 120, height: 80, rx: 14, fill: '#9fd8ff', stroke: '#1d5a8a', 'stroke-width': 5 }, g)
      txt(g, 'BÉBÉ', { x: 0, y: 12, 'font-size': 30, fill: '#1d5a8a' })
      return g
    })(),
    lait: (() => {
      const g = svg('g', {}, arms)
      svg('rect', { x: -26, y: -46, width: 52, height: 92, rx: 12, fill: '#ffffff', stroke: '#9aa3b5', 'stroke-width': 5 }, g)
      svg('rect', { x: -14, y: -62, width: 28, height: 20, rx: 6, fill: '#ffd166' }, g)
      return g
    })(),
    console: (() => {
      const g = svg('g', {}, arms)
      svg('rect', { x: -70, y: -46, width: 140, height: 92, rx: 12, fill: '#111827', stroke: '#e5484d', 'stroke-width': 6 }, g)
      txt(g, 'GAME', { x: 0, y: 12, 'font-size': 34, fill: '#e5484d' })
      return g
    })(),
  }
  return { items, runners, guard, her, arms, loot }
})

// 3 · Sa fiche : la photo, les mentions, puis « JUGÉE ».
const FICHE = scene('fiche', (L) => {
  bg(L, '#0b0d14')
  svg('circle', { cx: 540, cy: 900, r: 820, fill: '#232a40', opacity: 0.7 }, L.far)
  const card = svg('g', {}, L.mid)
  svg('rect', { x: -420, y: -560, width: 840, height: 1120, rx: 30, fill: '#fbf8f0' }, card)
  svg('rect', { x: -420, y: -560, width: 840, height: 120, rx: 30, fill: '#1d2a5c' }, card)
  txt(card, 'FICHE · PRÉVENUE', { x: 0, y: -480, 'font-size': 48, fill: '#fff' })
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16, fill: '#c9d6e8' }, card)
  const photo = svg('g', { 'clip-path': 'url(#photoClip)' }, card)
  const clip = svg('clipPath', { id: 'photoClip' }, defs)
  svg('rect', { x: -170, y: -400, width: 340, height: 380, rx: 16 }, clip)
  const ines = makePerson(photo, INES)
  const rows = ['INÈS', '23 ANS', 'AIDE-SOIGNANTE', 'CASIER : VIERGE'].map((s, k) => {
    const g = svg('g', {}, card)
    txt(g, s, { x: 0, y: 60 + k * 100, 'font-size': k === 0 ? 76 : 56, fill: k === 3 ? '#12a150' : '#1d2a5c' })
    return g
  })
  return { card, ines, rows }
})

// 4 · Le procès : chaque réplique a son plan et son accessoire.
const TRIB = scene('tribunal', (L) => {
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
  const hotBg = svg('g', {}, L.far)
  const hotFill = svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: '#b3232b' }, hotBg)
  svg('rect', { x: -800, y: -800, width: W + 1600, height: H + 1600, fill: 'url(#dots)', opacity: 0.12 }, hotBg)
  const proc = makePerson(L.actor, PROC)
  const avo = makePerson(L.actor, AVO)
  svg('rect', { x: -300, y: 1790, width: W + 600, height: 500, fill: 'url(#desk)' }, L.front)
  svg('rect', { x: -300, y: 1780, width: W + 600, height: 26, rx: 10, fill: '#b07a52' }, L.front)
  const P = svg('g', {}, L.fx)
  const prop = (build) => {
    const g = svg('g', { display: 'none' }, P)
    build(g)
    return g
  }
  // Les trois objets volés, posés comme des pièces à conviction.
  const goods = prop((g) => {
    const items = [
      (h) => {
        svg('rect', { x: -80, y: -60, width: 160, height: 120, rx: 18, fill: '#9fd8ff', stroke: '#1d5a8a', 'stroke-width': 6 }, h)
        txt(h, 'COUCHES', { x: 0, y: 14, 'font-size': 32, fill: '#1d5a8a' })
      },
      (h) => {
        svg('rect', { x: -40, y: -70, width: 80, height: 140, rx: 16, fill: '#ffffff', stroke: '#9aa3b5', 'stroke-width': 6 }, h)
        svg('rect', { x: -22, y: -94, width: 44, height: 28, rx: 8, fill: '#ffd166' }, h)
        txt(h, 'LAIT', { x: 0, y: 16, 'font-size': 30, fill: '#1d2a5c' })
      },
      (h) => {
        svg('rect', { x: -95, y: -60, width: 190, height: 120, rx: 18, fill: '#111827', stroke: '#e5484d', 'stroke-width': 7 }, h)
        txt(h, 'CONSOLE', { x: 0, y: 14, 'font-size': 32, fill: '#e5484d' })
      },
    ]
    g.items = items.map((build, k) => {
      const h = svg('g', { transform: `translate(${-300 + k * 300} 0)` }, g)
      build(h)
      return h
    })
    g.circle = svg('circle', { cx: 300, cy: 0, r: 130, fill: 'none', stroke: '#e5484d', 'stroke-width': 12, 'stroke-dasharray': 900, 'stroke-dashoffset': 900 }, g)
  })
  // Le cadeau.
  const gift = prop((g) => {
    svg('rect', { x: -120, y: -80, width: 240, height: 180, rx: 12, fill: '#e5484d', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -140, y: -120, width: 280, height: 60, rx: 10, fill: '#ff6b78', stroke: '#10121a', 'stroke-width': 8 }, g)
    svg('rect', { x: -18, y: -120, width: 36, height: 220, fill: '#ffd166' }, g)
    svg('path', { d: 'M 0 -120 C -80 -200 -120 -120 0 -120 C 120 -120 80 -200 0 -120 Z', fill: '#ffd166', stroke: '#10121a', 'stroke-width': 6 }, g)
  })
  // Des maisons aux fenêtres allumées (« restés chez eux »).
  const homes = prop((g) => {
    for (let k = 0; k < 18; k++) {
      const h = svg('g', { transform: `translate(${-375 + (k % 6) * 150} ${-130 + Math.floor(k / 6) * 130})` }, g)
      svg('path', { d: 'M -55 0 L 0 -46 L 55 0 Z', fill: '#3b82f6', stroke: '#10121a', 'stroke-width': 5 }, h)
      svg('rect', { x: -45, y: 0, width: 90, height: 64, fill: '#fbf6ea', stroke: '#10121a', 'stroke-width': 5 }, h)
      svg('rect', { x: -14, y: 14, width: 28, height: 28, fill: '#ffd166' }, h)
    }
  })
  // Le quartier qui brûle.
  let skyFires = []
  const skyline = prop((g) => {
    for (let k = 0; k < 6; k++) svg('rect', { x: -360 + k * 125, y: -(120 + (k % 3) * 70), width: 110, height: 260 + (k % 3) * 70, fill: '#1a1020', stroke: '#ff8a3d', 'stroke-width': 3 }, g)
    skyFires = [fire(g, -240, 140, 0.8, 11), fire(g, 60, 140, 1, 12), fire(g, 300, 140, 0.7, 13)]
  })
  // Le vigile à terre.
  const guard = prop((g) => lyingGuard(g, { color: '#10121a', rim: '#ffd166' }))
  // Le téléphone : appel sortant au SAMU.
  const phone = prop((g) => {
    svg('rect', { x: -130, y: -230, width: 260, height: 460, rx: 40, fill: '#10121a' }, g)
    svg('rect', { x: -112, y: -200, width: 224, height: 400, rx: 24, fill: '#0f2b1f' }, g)
    txt(g, 'APPEL SORTANT', { x: 0, y: -120, 'font-size': 26, fill: '#9fe6bf' })
    txt(g, '15', { x: 0, y: -10, 'font-size': 120, fill: '#ffffff' })
    txt(g, 'SAMU', { x: 0, y: 50, 'font-size': 44, fill: '#9fe6bf' })
    svg('circle', { cx: 0, cy: 140, r: 40, fill: '#12a150' }, g)
  })
  // Le chronomètre.
  let chronoTxt
  const chrono = prop((g) => {
    svg('circle', { r: 170, fill: '#fbf8f0', stroke: '#10121a', 'stroke-width': 12 }, g)
    svg('rect', { x: -30, y: -220, width: 60, height: 40, rx: 10, fill: '#10121a' }, g)
    chronoTxt = txt(g, '00:00', { x: 0, y: 30, 'font-size': 86, fill: '#e5484d', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700 })
  })
  // 300 pilleurs, un seul appel.
  const crowd = []
  const crowdG = prop((g) => {
    for (let k = 0; k < 300; k++) {
      const p = svg('g', { transform: `translate(${-430 + (k % 25) * 36} ${-200 + Math.floor(k / 25) * 36})` }, g)
      svg('circle', { cy: -10, r: 8, fill: '#c7cbd4' }, p)
      svg('rect', { x: -9, y: -2, width: 18, height: 18, rx: 6, fill: '#c7cbd4' }, p)
      crowd.push(p)
    }
  })
  return { procBg, avoBg, hotBg, hotFill, proc, avo, goods, gift, homes, skyline, get skyFires() { return skyFires }, guard, phone, chrono, get chronoTxt() { return chronoTxt }, crowdG, crowd }
})

// 5 · Le vote : elle, dans le box.
const VOTE = scene('vote', (L) => {
  bg(L, 'url(#courtDark)')
  svg('ellipse', { cx: 540, cy: 900, rx: 560, ry: 900, fill: 'url(#spot)' }, L.far)
  const actor = makePerson(L.actor, INES_BOX)
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
// Cadre « vidéo de téléphone ».
const rec = svg('g', { display: 'none' }, root)
svg('rect', { x: 40, y: 140, width: W - 80, height: H - 280, fill: 'none', stroke: '#ffffff', 'stroke-width': 4, opacity: 0.5, rx: 20 }, rec)
const recDot = svg('circle', { cx: 100, cy: 210, r: 16, fill: '#ff3b30' }, rec)
txt(rec, 'REC', { x: 160, y: 222, 'font-size': 36, fill: '#ffffff', 'text-anchor': 'start' })
const recTime = svg('text', { x: W - 90, y: 222, 'text-anchor': 'end', 'font-family': 'DejaVu Sans Mono, monospace', 'font-weight': 700, 'font-size': 34, fill: '#ffffff' }, rec)
const freeze = svg('g', { display: 'none' }, root)
svg('rect', { x: 0, y: 0, width: W, height: H, fill: '#000', opacity: 0.35 }, freeze)

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
    const k = lerp(T.from, 1, ease.out3(a)) * Math.min(1, s)
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

// Le hook.
tag('UNE NUIT D’ÉMEUTES', 'pill red', { t0: 0, t1: Wd('01', 'vigile') - 0.15, y: 250, rot: -2 })
tag('VIGILE · 58 ANS', 'pill', { t0: Wd('01', 'vigile') - 0.1, t1: SEC.emeute.t1, y: 250, rot: -2 })
fs(tag('COMA', 'stamp', { t0: Wd('01', 'coma') - 0.05, t1: SEC.emeute.t1, y: 470, rot: -8, from: 2.8, dur: 0.2 }), 170)
const LOOT_T = { couches: Wd('02', 'couches') - 0.1, lait: Wd('02', 'lait') - 0.1, console: Wd('02', 'console') - 0.1 }
tag('ELLE ENJAMBE SON CORPS', 'pill red', { t0: Wd('02', 'enjambe') - 0.1, t1: Wd('02', 'dans') - 0.1, y: 330, rot: -2 })
tag('COUCHES', 'pill yellow', { t0: LOOT_T.couches, t1: SEC.video.t1, y: 330, x: 250, rot: -4 })
tag('LAIT BÉBÉ', 'pill yellow', { t0: LOOT_T.lait, t1: SEC.video.t1, y: 330, x: 560, rot: 3 })
fs(tag('CONSOLE', 'stamp', { t0: LOOT_T.console, t1: SEC.video.t1, y: 480, x: 820, rot: 8, from: 2.8, dur: 0.2 }), 80)
fs(tag('JUGÉE', 'stamp', { t0: Wd('03', 'juge') - 0.05, t1: SEC.fiche.t1, y: 1130, rot: -10, from: 2.8, dur: 0.2 }), 150)
// Le procès.
tag('PAS POUR SURVIVRE', 'pill red', { t0: Wd('04', 'survivre') - 0.1, t1: Wd('04', 'les') - 0.1, y: 240, rot: -2 })
fs(tag('LE CHAOS.', 'slam white', { t0: Wd('04', 'chaos') - 0.06, t1: Wd('04', 'les') - 0.1, y: 420, rot: -3, from: 2.4, dur: 0.2 }), 120)
tag('SON FILS · 6 ANS', 'pill yellow', { t0: Wd('05', 'fils') - 0.1, t1: Wd('05', 'elle') - 0.1, y: 240, rot: -2 })
counterTag(Wd('05', '1300') - 0.1, E('05') + 0.1, 1300, 'PAR MOIS', { fmt: (v) => v.toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €', y: 300 })
tag('1 300 €…', 'pill small', { t0: S('06') - 0.05, t1: E('06') + 0.1, y: 220 })
tag('DES MILLIONS SONT RESTÉS CHEZ EUX', 'pill', { t0: Wd('06', 'restes') - 0.1, t1: E('06') + 0.1, y: 760 }).el.style.fontSize = '42px'
tag('ELLE, SI.', 'pill red', { t0: Wd('07', 'elle') - 0.1, t1: Wd('07', 'cette') - 0.1, y: 240, rot: -3 })
tag('PLUS DE RÈGLES', 'pill', { t0: Wd('07', 'regles') - 0.1, t1: E('07') + 0.1, y: 220, x: 300, rot: -3 })
tag('PLUS DE POLICE', 'pill', { t0: Wd('07', 'police') - 0.1, t1: E('07') + 0.1, y: 220, x: 780, rot: 3 })
fs(tag('PLUS RIEN.', 'slam white', { t0: Wd('07', 'rien') - 0.06, t1: E('07') + 0.1, y: 360, rot: -2, from: 2.4, dur: 0.2 }), 110)
fs(tag('ELLE L’A ENJAMBÉ.', 'slam white', { t0: Wd('08', 'enjambe') - 0.06, t1: E('08') + 0.1, y: 260, rot: -3, from: 2.4, dur: 0.2 }), 100)
tag('SOIGNANTE', 'pill red', { t0: Wd('08', 'soignante') - 0.1, t1: E('08') + 0.1, y: 760, rot: 3 })
tag('+ 11 MINUTES', 'pill yellow', { t0: Wd('09', 'onze') - 0.1, t1: E('09') + 0.1, y: 230, rot: -2 })
fs(tag('IL NE RESPIRAIT PLUS.', 'slam white', { t0: Wd('10', 'respirait') - 0.06, t1: E('10') + 0.1, y: 260, rot: -2, from: 2.4, dur: 0.2 }), 84)
counterTag(Wd('11', '300') - 0.1, Wd('11', 'une') - 0.1, 300, 'PILLEURS', { y: 250, dur: 0.5 })
fs(tag('1 SEULE.', 'slam yellow', { t0: Wd('11', 'une') - 0.06, t1: E('11') + 0.1, y: 280, rot: -3, from: 2.6, dur: 0.2 }), 130)
fs(tag('PAS UNE HÉROÏNE.', 'slam white', { t0: Wd('12', 'heroine') - 0.06, t1: E('12') + 0.1, y: 300, rot: -2, from: 2.4, dur: 0.2 }), 96)
fs(tag('DES REMORDS.', 'slam yellow', { t0: Wd('12', 'remords') - 0.06, t1: E('12') + 0.1, y: 460, rot: 2, from: 2.6, dur: 0.2 }), 120)
fs(tag('CONSCIENCE.', 'slam yellow', { t0: Wd('13', 'conscience') - 0.06, t1: E('13') + 0.15, y: 380, rot: -3, from: 3, dur: 0.2 }), 150)
// Le vote, puis l'abonnement.
fs(tag('TU ES LE JURÉ', 'big white', { t0: Wd('14', 'jure') - 0.15, y: 330, from: 1.4, dur: 0.5 }), 110)
tag('COUPABLE', 'vote red', { t0: Wd('14', 'coupable') - 0.1, y: 540, rot: -3 })
tag('NON COUPABLE', 'vote blue', { t0: Wd('14', 'non') - 0.1, y: 730, rot: 3 })
tag('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: Wd('15', 'abonne') - 0.1, y: 1180 })
fs(tag('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: Wd('15', 'verdict') - 0.1, y: 1330 }), 44)

const who = document.createElement('div')
who.className = 'tag who'
ui.append(who)

// Gros sous-titres animés (pas sur l'appel à s'abonner : le bouton le dit).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines.filter((l) => l.id !== '15-abonne')) {
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

const T_CONSOLE = Wd('02', 'console') - 0.1
const IMPACTS = [
  [0.05, 10],
  [Wd('01', 'coma') - 0.05, 16],
  [Wd('02', 'enjambe') - 0.1, 8],
  [T_CONSOLE, 14],
  [Wd('03', 'juge') - 0.05, 16],
  [Wd('04', 'chaos') - 0.06, 10],
  [Wd('07', 'rien') - 0.06, 10],
  [Wd('08', 'enjambe') - 0.06, 12],
  [Wd('10', 'respirait') - 0.06, 10],
  [Wd('11', 'une') - 0.06, 12],
  [Wd('12', 'remords') - 0.06, 12],
  [Wd('13', 'conscience') - 0.06, 16],
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
function cam(s, t, { zoom = 1, cx = 540, cy = 960, push = 0.02, hand = 2, rot = 0, from = s.t0 } = {}) {
  const [sx, sy] = shakeAt(t, hand)
  const z = zoom * (1 + push * Math.max(0, t - from))
  const par = (k) => `translate(${540 + sx * k} ${960 + sy * k}) rotate(${rot * k}) scale(${1 + (z - 1) * k}) translate(${-cx} ${-cy})`
  s.L.far.setAttribute('transform', par(0.4))
  s.L.mid.setAttribute('transform', par(0.75))
  s.L.actor.setAttribute('transform', par(1))
  s.L.front.setAttribute('transform', par(1.3))
  s.L.fx.setAttribute('transform', par(1))
}
const TLINES = C.lines.filter((l) => l.start >= SEC.tribunal.t0 - 0.5 && l.start < SEC.tribunal.t1)
const trialLine = (t) => [...TLINES].reverse().find((l) => t >= l.start - 0.12) ?? TLINES[0]
const HOT = { 12: '#1d2a5c', 13: '#b3232b' }

function runner(R, t, base = 0) {
  const u = (t - base - R.t0) / R.dur
  const on = u > 0 && u < 1
  R.w.g.setAttribute('display', on ? 'inline' : 'none')
  if (on) R.w.update(lerp(R.from, R.to, u), R.y, R.s, (t - base) * 14)
}

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  for (const s of scenes) s.g.setAttribute('display', t >= s.t0 && t < s.t1 ? 'inline' : 'none')
  const cur = scenes.find((s) => t >= s.t0 && t < s.t1) ?? scenes.at(-1)
  rec.setAttribute('display', cur === VIDEO ? 'inline' : 'none')
  freeze.setAttribute('display', 'none')

  if (cur === EMEUTE) {
    // On part large, la caméra plonge vers le vigile au moment de « coma ».
    const dive = prog(t, Wd('01', 'vigile') - 0.2, 1.2, ease.io3)
    cam(EMEUTE, t, { zoom: lerp(1.12, 1.4, dive), cx: lerp(540, 560, dive), cy: lerp(1200, 1430, dive), push: 0.02, hand: 4 })
    for (const w of EMEUTE.wins) w.el.setAttribute('opacity', (0.35 + 0.35 * Math.max(0, Math.sin(t * 6 + w.ph))).toFixed(2))
    for (const s of EMEUTE.smoke) {
      const u = (t * s.sp + s.ph) % 1
      s.el.setAttribute('cx', s.x + 60 * Math.sin(t + s.ph * 6))
      s.el.setAttribute('cy', 1100 - u * 1300)
      s.el.setAttribute('opacity', (0.5 * Math.sin(Math.PI * u)).toFixed(2))
    }
    EMEUTE.sign.setAttribute('opacity', Math.floor(t * 9) % 7 === 0 ? 0.2 : 1)
    for (const f of EMEUTE.fires) f(t)
    for (const R of EMEUTE.runners) runner(R, t)
    place(EMEUTE.guard, 560, 1500, 1.1)
    EMEUTE.ring.setAttribute('stroke-dashoffset', 1600 * (1 - prog(t, Wd('01', 'vigile') - 0.1, 0.5, ease.out3)))
    for (const e of EMEUTE.embers) {
      const u = (t * e.sp + e.ph) % 1
      e.el.setAttribute('cx', e.x + 30 * Math.sin(t * 3 + e.ph * 9))
      e.el.setAttribute('cy', 1600 - u * 1500)
      e.el.setAttribute('opacity', (1 - u).toFixed(2))
    }
    const ph = (t * 2.6) % 1
    EMEUTE.gyroR.setAttribute('opacity', ph < 0.5 ? 0.45 : 0.08)
    EMEUTE.gyroB.setAttribute('opacity', ph < 0.5 ? 0.08 : 0.45)
  }
  if (cur === VIDEO) {
    // Caméra « téléphone » : tenue à la main, qui suit la jeune femme.
    const k = t - VIDEO.t0
    const frozen = t >= T_CONSOLE && t < T_CONSOLE + 0.7
    const tt = frozen ? T_CONSOLE : t
    const zoomC = frozen ? 1 + 0.25 * ease.out3(clamp((t - T_CONSOLE) / 0.2)) : 1
    // Elle entre par la droite, enjambe le vigile au centre, s'arrête un instant puis repart.
    const tE = Wd('02', 'enjambe') - 0.15
    const x = tt < tE ? lerp(1250, 700, clamp((tt - VIDEO.t0) / (tE - VIDEO.t0))) : tt < tE + 0.9 ? lerp(700, 420, (tt - tE) / 0.9) : lerp(420, 260, clamp((tt - tE - 0.9) / 4))
    const high = tt > tE && tt < tE + 0.9 ? Math.sin(Math.PI * ((tt - tE) / 0.9)) : 0
    cam(VIDEO, tt, { zoom: 1.22 * zoomC, cx: lerp(560, x + 60, 0.35), cy: frozen ? 1420 : 1380, push: 0.01, hand: frozen ? 0 : 7, rot: frozen ? 0 : 0.6 * Math.sin(tt * 1.7) })
    for (const it of VIDEO.items) {
      if (!it.fall) continue
      const u = clamp((tt - VIDEO.t0 - it.ph * 4) / 0.6)
      it.el.setAttribute('transform', `translate(0 ${520 * ease.in2(u)}) rotate(${u * 80 * (it.ph - 0.5)} ${it.x} ${it.y})`)
    }
    for (const R of VIDEO.runners) runner(R, tt, VIDEO.t0)
    place(VIDEO.guard, 560, 1640, 1.2)
    VIDEO.her.update(x, 1700, 1.7, tt * 9, { stride: tt > tE + 0.9 && tt < tE + 1.6 ? 0.3 : 1, high })
    // Les objets dans ses bras apparaissent au fil des mots.
    const bx = x - 70
    const by = 1700 - 250 * 1.7
    for (const [name, dx, dy] of [['couches', 0, 0], ['lait', -60, -70], ['console', 30, -130]]) {
      const s = popS(tt, LOOT_T[name], Infinity, 0.3)
      show(VIDEO.loot[name], s > 0.01)
      place(VIDEO.loot[name], bx + dx, by + dy + Math.abs(Math.sin(tt * 9)) * 6, s * 1.25, name === 'console' ? -8 : 4)
    }
    freeze.setAttribute('display', frozen ? 'inline' : 'none')
    recDot.setAttribute('opacity', Math.floor(t * 2) % 2 ? 0.2 : 1)
    const secs = Math.floor(k * (frozen ? 0 : 1))
    recTime.textContent = `02:47:${String(13 + Math.floor(frozen ? T_CONSOLE - VIDEO.t0 : k)).padStart(2, '0')}`
    void secs
  }
  if (cur === FICHE) {
    cam(FICHE, t, { zoom: 1.0, cy: 960, push: 0.02 })
    const a = popS(t, FICHE.t0 + 0.05, Infinity, 0.45)
    place(FICHE.card, 540, 920, a * 0.95, -2)
    FICHE.ines.update(t, { x: 0, y: -120, scale: 0.62, brows: 'sad', look: [0.1, 0.1], armR: [0.1, 0.6], armL: [0.1, 0.6], seed: 0.8 })
    const keys = ['ines', '23', 'aidesoignante', 'casier']
    FICHE.rows.forEach((g, k) => {
      const s = popS(t, Wd('03', keys[k]) - 0.1, Infinity, 0.3)
      g.setAttribute('opacity', Math.min(1, s))
      g.setAttribute('transform', `translate(0 ${(1 - Math.min(1, s)) * 30})`)
    })
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
    const last = l.words.findLast((w, i) => i > 0 && /[.!?…]$/.test(l.words[i - 1].w)) ?? l.words[0]
    const punch = hot ? prog(t, l.start - 0.1, 0.25, ease.out3) + 0.6 * prog(t, last.t - 0.1, 0.25, ease.out3) : l.words.length > 6 ? prog(t, last.t - 0.15, 0.25, ease.out3) : 0
    cam(TRIB, t, { zoom: lerp(1.0, 1.14, punch), cy: lerp(980, 900, Math.min(1, punch)), push: 0.025, from: l.start - 0.12 })
    const sp = speaking(l.who, t)
    const beat = Math.sin(t * 5.3) * 0.5 + Math.sin(t * 2.1) * 0.5
    const P = isProc ? TRIB.proc : TRIB.avo
    const m = mouthOf(l.who, t)
    P.update(t, {
      x: 540,
      y: 1170,
      scale: 1.4,
      mouth: m,
      brows: isProc ? (['08', '10'].includes(id) ? 'angry' : 'determined') : id === '13' ? 'determined' : 'neutral',
      look: [0, 0],
      armR: [0.35 + (sp ? 0.25 * m + 0.12 * beat : 0), 1.0 + (sp ? 0.3 * beat : 0)],
      armL: [0.25 + (sp ? 0.1 * beat : 0), 1.2 + (sp ? 0.25 * Math.sin(t * 4.1) : 0)],
      seed: isProc ? 0.5 : 1.7,
      headTilt: 0.04 * Math.sin(t * 1.2),
    })
    const prop = (el, on, t0, t1, x, y, s, r = 0) => {
      const v = on ? popS(t, t0, t1, 0.35) : 0
      show(el, v > 0.01)
      if (v > 0.01) place(el, x, y + 8 * Math.sin(t * 2), v * s, r)
      return v
    }
    if (prop(TRIB.goods, id === '04', Wd('04', 'les') - 0.15, E('04') + 0.05, 540, 690, 0.88) > 0) {
      TRIB.goods.items.forEach((h, k) => h.setAttribute('opacity', t > Wd('04', 'les') + k * 0.12 ? 1 : 0))
      TRIB.goods.circle.setAttribute('stroke-dashoffset', 900 * (1 - prog(t, Wd('04', 'console') - 0.1, 0.4, ease.out3)))
    }
    prop(TRIB.gift, id === '05', Wd('05', 'cadeau') - 0.2, Wd('05', 'elle') - 0.1, 540, 660, 0.8, 4 * Math.sin(t * 3))
    prop(TRIB.homes, id === '06', Wd('06', 'millions') - 0.15, E('06') + 0.05, 540, 640, 0.75)
    if (prop(TRIB.skyline, id === '07', Wd('07', 'quartier') - 0.2, E('07') + 0.05, 540, 660, 0.75) > 0) for (const f of TRIB.skyFires) f(t)
    prop(TRIB.guard, id === '08', Wd('08', 'vigile') - 0.15, E('08') + 0.05, 540, 680, 1.0)
    prop(TRIB.phone, id === '09', Wd('09', 'appel') - 0.2, E('09') + 0.05, 540, 640, 0.62, -4)
    if (prop(TRIB.chrono, id === '10', S('10') - 0.1, E('10') + 0.05, 540, 650, 0.68) > 0) {
      const s = Math.round(11 * 60 * ease.out3(prog(t, S('10'), 1.4)))
      TRIB.chronoTxt.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    }
    if (prop(TRIB.crowdG, id === '11', Wd('11', '300') - 0.15, E('11') + 0.05, 540, 640, 0.85) > 0) {
      const one = t > Wd('11', 'une') - 0.1
      TRIB.crowd.forEach((p, k) => {
        for (const c of p.children) c.setAttribute('fill', one && k === 162 ? '#ffd166' : '#c7cbd4')
        p.setAttribute('opacity', one && k !== 162 ? 0.35 : 1)
      })
    }
  }
  if (cur === VOTE) {
    cam(VOTE, t, { zoom: 1.0, cy: 1000, push: 0.015 })
    VOTE.actor.update(t, { x: 540, y: 1360, scale: 1.1, brows: 'sad', look: [0, -0.2], armR: [0.1, 0.8], armL: [0.1, 0.8], seed: 2.6, headNod: 0.05 })
  }

  // Transitions.
  let f = 0
  for (const s of C.sections.filter((x) => x.cut === 'flash')) if (t >= s.t0 && t < s.t0 + 0.25) f = Math.max(f, 0.9 * (1 - (t - s.t0) / 0.25) ** 2)
  for (const [t0, a] of IMPACTS) if (a >= 10 && t >= t0 && t < t0 + 0.1) f = Math.max(f, 0.35 * (1 - (t - t0) / 0.1))
  flash.setAttribute('opacity', f.toFixed(3))
  for (const { el, d } of DOTS) {
    let r = 0
    for (const s of C.sections.filter((x) => x.cut === 'wipe')) {
      const u = t - (s.t0 - 0.24) - d
      if (u > 0 && u < 0.48) r = 96 * Math.sin(Math.PI * (u / 0.48))
    }
    el.setAttribute('r', r.toFixed(1))
  }
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
  updateGrain(t, cur === VIDEO ? 40 : 14)
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
