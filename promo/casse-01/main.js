/**
 * ============================================================================
 *  « Le casse » n°1 — il n'a jamais forcé une seule porte (≈ 50 s, 1080 × 1920)
 * ============================================================================
 *  Style « La Reconstitution » : la rue comme une maquette miniature vue de
 *  dessus (socle en bois, figurines, effet tilt-shift), avec des repères
 *  d'enquêteur posés sur le décor : horloges, trajectoires en pointillés,
 *  étiquettes qui suivent les figurines. La bijouterie est en coupe (sans toit)
 *  pour qu'on voie la visite et la remise de la mallette.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 *  Les instants viennent de la voix (timeline.json, voir voix.py) via cues.js.
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT as H, WIDTH as W, makeCues } from './cues.js'

const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W: Wd } = C
const DURATION = C.duration

// ------------------------------------------------------------------ rendu

const gl = document.getElementById('gl')
const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(W, H, false)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
const scene = new THREE.Scene()
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.3
const camera = new THREE.PerspectiveCamera(18, W / H, 1, 400)
const hemi = new THREE.HemisphereLight(0xc8d4ff, 0x3a3050, 1.0)
scene.add(hemi)
const sun = new THREE.DirectionalLight(0xffe2c0, 1.3)
sun.position.set(-14, 26, 10)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 90 })
sun.shadow.bias = -0.0005
sun.shadow.normalBias = 0.02
scene.add(sun)

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o })
const glow = (color) => new THREE.MeshBasicMaterial({ color })
function mesh(geo, mat, parent = scene) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = m.receiveShadow = true
  parent.add(m)
  return m
}
const rbox = (w, h, d, r, mat, parent) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat, parent)
const group = (parent = scene, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  parent.add(g)
  return g
}
function textTex(text, { w = 512, h = 128, bg = '#2b2b46', fg = '#ffe9b0', font = 76 } = {}) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.fillStyle = fg
  g.font = `900 ${font}px "Figtree Variable", sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, w / 2, h / 2 + 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
const sign = (parent, text, w, h, opts) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTex(text, opts) }))
  parent.add(m)
  return m
}

// --------------------------------------------------------------- la maquette

const Y0 = 0.27 // hauteur des trottoirs
rbox(24, 1.2, 16, 0.25, M('#7a5136', { roughness: 0.6 })).position.y = -0.6
rbox(23.4, 0.1, 15.4, 0.05, M('#4a4e6e')).position.y = 0.05
rbox(23.4, 0.06, 4.2, 0.02, M('#2e3044', { roughness: 0.95 })).position.set(0, 0.11, 1.6)
for (let x = -11; x < 11.5; x += 1.6) rbox(0.8, 0.02, 0.12, 0.01, glow('#d9d6c4'), scene).position.set(x, 0.15, 1.6)
for (let k = 0; k < 6; k++) rbox(0.28, 0.02, 1.4, 0.01, glow('#e8e4d4'), scene).position.set(-1.4 + k * 0.5, 0.15, 1.6)
rbox(23.4, 0.22, 2.0, 0.05, M('#a3a0bb')).position.set(0, 0.16, -1.5)
rbox(23.4, 0.22, 2.2, 0.05, M('#a3a0bb')).position.set(0, 0.16, 4.8)

// Façades pastel.
function building(x, w, h, color, roof, d = 3.6) {
  const g = group(scene, x, Y0, -4.4)
  rbox(w, h, d, 0.12, M(color), g).position.y = h / 2
  rbox(w + 0.3, 0.35, d + 0.3, 0.1, M(roof), g).position.y = h + 0.12
  for (let i = 0; i < Math.floor(w / 1.3); i++)
    for (let j = 1; j < Math.floor(h / 1.3); j++) rbox(0.7, 0.7, 0.08, 0.03, new THREE.MeshStandardMaterial({ color: '#ffe7b0', emissive: '#ffc96a', emissiveIntensity: (i + j) % 3 ? 0.15 : 0.7 }), g).position.set(-w / 2 + 0.75 + i * 1.3, 0.4 + j * 1.25, d / 2 + 0.02)
  return g
}
building(-9.6, 3.6, 4.6, '#f2d3a2', '#8a6a3a')
building(1.2, 3.4, 5.6, '#c8b7e3', '#5a4a78')

// La bijouterie, en coupe : murs bas, pas de toit, on voit l'intérieur.
const shop = group(scene, -4.2, Y0, -4.4)
const SW = 6.4
const SD = 3.8
rbox(SW, 0.06, SD, 0.02, M('#efe3cc'), shop).position.y = 0.03
const wallM = M('#e8b4b8')
rbox(SW, 1.6, 0.2, 0.06, wallM, shop).position.set(0, 0.8, -SD / 2)
rbox(0.2, 1.6, SD, 0.06, wallM, shop).position.set(-SW / 2, 0.8, 0)
rbox(0.2, 1.6, SD, 0.06, wallM, shop).position.set(SW / 2, 0.8, 0)
rbox(SW / 2 - 0.7, 0.9, 0.2, 0.06, wallM, shop).position.set(-SW / 4 - 0.35, 0.45, SD / 2)
rbox(SW / 2 - 0.7, 0.9, 0.2, 0.06, wallM, shop).position.set(SW / 4 + 0.35, 0.45, SD / 2)
// Cloison de la réserve, au fond à droite.
rbox(0.15, 1.2, 1.6, 0.05, wallM, shop).position.set(1.6, 0.6, -1.1)
// Enseigne posée devant la vitrine.
const shopSign = sign(shop, 'BIJOUX', 2.6, 0.62, { bg: '#3a2030', fg: '#ffd48a' })
shopSign.position.set(-1.6, 1.25, SD / 2 + 0.12)
// Comptoir et vitrines à bijoux.
rbox(2.6, 0.8, 0.7, 0.08, M('#6b4227'), shop).position.set(-0.6, 0.4, -0.3)
const gemM = new THREE.MeshStandardMaterial({ color: '#bff3ff', emissive: '#7fe8ff', emissiveIntensity: 0.6, metalness: 0.2, roughness: 0.1 })
for (const [x, z] of [[-2.4, 0.9], [-2.4, -0.9], [0.9, 1.0]]) {
  const v = group(shop, x, 0, z)
  rbox(0.9, 0.7, 0.6, 0.05, M('#3a2030'), v).position.y = 0.35
  const glass = mesh(new THREE.BoxGeometry(0.86, 0.36, 0.56), new THREE.MeshStandardMaterial({ color: '#d8f2ff', transparent: true, opacity: 0.35, roughness: 0.05 }), v)
  glass.position.y = 0.88
  glass.castShadow = false
  for (let k = 0; k < 4; k++) mesh(new THREE.OctahedronGeometry(0.06), gemM, v).position.set(-0.3 + k * 0.2, 0.76, 0)
}
// Coffre de la réserve.
rbox(0.8, 0.9, 0.7, 0.08, M('#55606e', { metalness: 0.6, roughness: 0.35 }), shop).position.set(2.4, 0.45, -1.2)

// La banque, en face de la bijouterie (côté droit), avec ses colonnes.
const bank = group(scene, 7.6, Y0, -4.4)
rbox(5.6, 4.6, 3.6, 0.12, M('#eae4d6'), bank).position.y = 2.3
rbox(6.0, 0.6, 3.9, 0.1, M('#b8ad94'), bank).position.y = 4.9
const ped = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.0, 4), M('#b8ad94'))
ped.rotation.y = Math.PI / 4
ped.scale.set(1, 1, 0.4)
ped.position.set(0, 5.6, 1.2)
ped.castShadow = true
bank.add(ped)
for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.16, 0.18, 3.6, 14), M('#f7f2e6'), bank).position.set(-2.2 + i * 1.1, 1.9, 2.0)
sign(bank, 'BANQUE', 3.2, 0.7, { bg: '#2b3a5a', fg: '#ffe9b0' }).position.set(0, 4.3, 1.86)

// L'entrée du métro, sur le trottoir d'en face.
const metro = group(scene, -7.2, Y0, 4.6)
rbox(1.8, 0.1, 1.2, 0.04, M('#1d1f27'), metro).position.y = 0.05
for (let k = 0; k < 4; k++) rbox(1.6, 0.06, 0.2, 0.02, M('#55596b'), metro).position.set(0, -0.02 - k * 0.12, -0.4 + k * 0.22)
for (const x of [-0.95, 0.95]) rbox(0.1, 0.7, 1.2, 0.04, M('#3f7a5a'), metro).position.set(x, 0.35, 0)
const mPole = group(metro, 1.2, 0, -0.6)
mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 10), M('#2b2b3a'), mPole).position.y = 0.8
const mSign = mesh(new THREE.SphereGeometry(0.28, 20, 14), new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 0.8 }), mPole)
mSign.position.y = 1.75
sign(mPole, 'M', 0.36, 0.36, { w: 128, h: 128, bg: '#ffd166', fg: '#1d1f27', font: 110 }).position.set(0, 1.75, 0.29)

// Réverbères et arbres.
const lamps = []
for (const x of [-7, -1, 5, 10]) {
  const p = group(scene, x, Y0, -0.7)
  mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 10), M('#2b2b3a'), p).position.y = 1.7
  mesh(new THREE.SphereGeometry(0.22, 16, 12), glow('#ffe2a8'), p).position.y = 3.45
  const l = new THREE.PointLight(0xffc77a, 0, 7, 1.6)
  l.position.y = 3.2
  p.add(l)
  lamps.push(l)
}
const rt = rng(3)
for (const x of [-10.4, -3.6, 2.2, 9.4]) {
  const tr = group(scene, x + rt() * 0.4, Y0, 5.4)
  mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.0, 8), M('#5a3d2a'), tr).position.y = 0.5
  mesh(new THREE.IcosahedronGeometry(0.75, 1), M('#4f8a66', { flatShading: true }), tr).position.y = 1.4
}

// ---------------------------------------------------------------- figurines

function figurine(color, { head = '#f2c4a0', cap = null, badge = false, tie = false } = {}) {
  const g = group(scene)
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 20), M('#f4f1ea'), g).position.y = 0.03
  mesh(new THREE.CapsuleGeometry(0.25, 0.6, 6, 14), M(color), g).position.y = 0.62
  mesh(new THREE.SphereGeometry(0.21, 18, 14), M(head), g).position.y = 1.2
  if (cap) {
    const c = mesh(new THREE.CylinderGeometry(0.22, 0.23, 0.12, 18), M(cap), g)
    c.position.y = 1.34
    const v = mesh(new THREE.BoxGeometry(0.24, 0.03, 0.16), M(cap), g)
    v.position.set(0, 1.3, 0.2)
  }
  if (badge) mesh(new THREE.BoxGeometry(0.14, 0.1, 0.03), glow('#ffd166'), g).position.set(0.1, 0.85, 0.25)
  if (tie) mesh(new THREE.BoxGeometry(0.06, 0.3, 0.03), M('#b3261e'), g).position.set(0, 0.8, 0.26)
  return g
}
const expert = figurine('#4a4f5c', { badge: true, tie: true })
const manager = figurine('#f4f1ea', { head: '#e8b48f', tie: true })
const fake = figurine('#d9822b', { cap: '#8a4b12' })
const real = figurine('#d9822b', { cap: '#8a4b12' })
// La mallette (avec les diamants qui brillent quand elle est ouverte).
function briefcase(parent) {
  const g = group(parent)
  rbox(0.5, 0.36, 0.14, 0.04, M('#c9ccd6', { metalness: 0.7, roughness: 0.3 }), g).position.y = 0.18
  rbox(0.18, 0.06, 0.04, 0.02, M('#55596b'), g).position.y = 0.39
  return g
}
const case1 = briefcase(scene)
// La grosse mallette ouverte de l'accroche, posée sur le comptoir.
const hero = group(scene, -4.8, Y0 + 0.8, -4.7)
rbox(1.3, 0.12, 0.9, 0.05, M('#c9ccd6', { metalness: 0.7, roughness: 0.3 }), hero).position.y = 0.06
const lid = group(hero, 0, 0.12, -0.45)
rbox(1.3, 0.9, 0.12, 0.05, M('#c9ccd6', { metalness: 0.7, roughness: 0.3 }), lid).position.set(0, 0.45, 0)
rbox(1.2, 0.08, 0.8, 0.03, M('#1d1f3a'), hero).position.y = 0.13
const heroGems = []
const rg = rng(11)
for (let k = 0; k < 18; k++) {
  const d = mesh(new THREE.OctahedronGeometry(0.07 + rg() * 0.03), gemM, hero)
  d.position.set(-0.5 + rg(), 0.2, -0.32 + rg() * 0.64)
  heroGems.push(d)
}
const sparkle = new THREE.PointLight(0x9fefff, 0, 5, 1.6)
sparkle.position.set(0, 0.8, 0.3)
hero.add(sparkle)

// Trajectoires en pointillés.
function dashed(points, color) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, Y0 + 0.08, z)))
  const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(120))
  const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.18 }))
  line.computeLineDistances()
  line.visible = false
  scene.add(line)
  return { curve, line }
}
// La visite de l'expert : entrée, vitrines, comptoir, réserve, coffre.
const visitPath = dashed([[-2.2, 2.4], [-4.2, -2.0], [-6.4, -3.6], [-5.8, -5.4], [-3.6, -5.4], [-2.6, -5.6], [-1.9, -5.4], [-3.2, -3.4], [-4.2, -2.0], [-4.0, 2.4]], '#7fb2ff')
// Le trajet de la mallette, chaque vendredi : de la bijouterie à la banque.
const fridayPath = dashed([[-4.2, -2.0], [-2.0, 0.6], [3.0, 1.2], [7.6, -1.2], [7.6, -2.6]], '#ffd166')
// Le faux coursier : il arrive, prend la mallette, file au métro.
const fakeIn = dashed([[-11, 2.6], [-6.0, 2.2], [-4.2, -2.0], [-4.6, -4.2]], '#ff9a4a')
const fakeOut = dashed([[-4.6, -4.2], [-4.2, -2.0], [-5.6, 1.6], [-7.2, 4.0], [-7.2, 4.8]], '#ff5a5a')
// Le vrai coursier, un quart d'heure trop tard.
const realIn = dashed([[11, 2.6], [5.0, 2.2], [-1.0, 1.6], [-4.2, -1.6]], '#ffd0a0')

// -------------------------------------------------------------- les textes (HTML)

const ui = document.getElementById('ui')
const tags = []
function tag(html, cls, { t0, t1 = Infinity, at = null, dy = 1.7, x = 540, y = 400, rot = 0, from = 1.6, dur = 0.3 }) {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  ui.append(el)
  const T = { el, t0, t1, at, dy, x, y, rot, from, dur }
  tags.push(T)
  return T
}
const v3 = new THREE.Vector3()
const project = (obj, dy) => {
  obj.getWorldPosition(v3)
  v3.y += dy
  v3.project(camera)
  return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * H]
}
function updateTags(t) {
  for (const T of tags) {
    const a = t < T.t0 ? 0 : ease.back(2)(clamp((t - T.t0) / T.dur))
    const b = T.t1 === Infinity ? 1 : 1 - ease.in3(clamp((t - T.t1) / 0.25))
    const s = a * b
    T.el.style.visibility = s > 0.01 ? '' : 'hidden'
    if (s <= 0.01) continue
    if (T.update) T.update(t)
    const [x, y] = T.at ? project(T.at, T.dy) : [T.x, T.y]
    const k = lerp(T.from, 1, Math.min(1, a)) * Math.min(1, s * 1.3)
    T.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, ${T.at ? '-100%' : '-50%'}) rotate(${T.rot}deg) scale(${k.toFixed(3)})`
  }
}
// Accroche.
const money = tag('<span class="num">0</span><span class="cur">€</span>', 'money', { t0: Wd('01', '4') - 0.1, t1: S('03') - 0.2, y: 300 })
const m0 = Wd('01', '4') - 0.1
money.update = (t) => {
  const v = Math.round(4000000 * ease.out3(clamp((t - m0) / 0.9)))
  money.el.querySelector('.num').textContent = v.toLocaleString('fr-FR').replace(/[  ]/g, ' ')
}
tag('0 PORTE FORCÉE', 'stamp', { t0: Wd('01', 'porte') - 0.1, t1: S('02') + 0.3, y: 520, rot: -6, from: 2.6, dur: 0.22 })
tag('VOICI COMMENT', 'slam', { t0: S('02') - 0.05, t1: S('03') - 0.2, y: 960, from: 2.2, dur: 0.22 })
// L'expert.
tag('3 MOIS AVANT', 'pill small', { t0: S('03') - 0.05, t1: Wd('03', 'il') - 0.1, y: 300 })
tag('« EXPERT EN ASSURANCES »', 'pin blue', { t0: Wd('03', 'expert') - 0.1, t1: E('03'), at: expert })
tag('COSTUME', 'pill', { t0: Wd('03', 'costume') - 0.1, t1: Wd('03', 'le') - 0.1, y: 300, x: 300, rot: -4 })
tag('BADGE', 'pill yellow', { t0: Wd('03', 'badge') - 0.1, t1: Wd('03', 'le') - 0.1, y: 300, x: 620, rot: 3 })
tag('CARTE DE VISITE', 'pill', { t0: Wd('03', 'carte') - 0.1, t1: Wd('03', 'le') - 0.1, y: 420, rot: -2 })
tag('LE GÉRANT', 'pin light', { t0: Wd('03', 'gerant') - 0.1, t1: E('03'), at: manager })
tag('TOUT', 'slam yellow', { t0: Wd('03', 'tout') - 0.08, t1: E('03') + 0.3, y: 330, from: 2.6, dur: 0.2 })
// Le détail.
tag('📝 IL NOTE TOUT', 'pill', { t0: Wd('04', 'observe') - 0.1, t1: Wd('04', 'chaque') - 0.1, y: 300 })
const cal = tag('', 'calendar', { t0: Wd('04', 'vendredi') - 0.15, t1: Wd('04', 'les') - 0.05, y: 420, from: 1.3 })
cal.el.innerHTML = `<div class="head">CHAQUE VENDREDI SOIR</div><div class="grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<b>${d}</b>`).join('')}${Array.from({ length: 28 }, (_, i) => `<span class="${i % 7 === 4 ? 'fri' : ''}">${i + 1}</span>`).join('')}</div>`
tag('BIJOUTERIE → BANQUE', 'pill yellow', { t0: Wd('04', 'banque') - 0.3, t1: E('04') + 0.2, y: 300, rot: -2 })
tag('UNE SIMPLE MALLETTE', 'pin yellow', { t0: Wd('04', 'mallette') - 0.15, t1: E('04') + 0.2, at: case1, dy: 0.7 })
// Le faux coursier.
const clock = tag('<span class="h">17:55</span>', 'clock', { t0: Wd('05', '17') - 0.2, t1: S('07') - 0.1, y: 260 })
tag('UN COURSIER', 'pin orange', { t0: Wd('05', 'coursier') - 0.1, t1: E('05'), at: fake })
tag('BON DE LIVRAISON', 'pill', { t0: Wd('05', 'bon') - 0.1, t1: E('05') + 0.2, y: 430, rot: -2 })
tag('✓ PARFAIT', 'stamp green', { t0: Wd('05', 'parfait') - 0.08, t1: E('05') + 0.2, y: 560, rot: -6, from: 2.6, dur: 0.22 })
tag('✓ SIGNATURE', 'stamp green', { t0: Wd('05', 'signature') - 0.08, t1: E('05') + 0.2, y: 700, rot: 4, from: 2.6, dur: 0.22 })
tag('LUI-MÊME.', 'slam yellow', { t0: Wd('06', 'lui-meme') - 0.08, t1: E('06') + 0.25, y: 330, from: 2.8, dur: 0.2 })
// Le vrai coursier.
const clock2 = tag('<span class="h">18:10</span>', 'clock red', { t0: Wd('07', '18') - 0.15, t1: S('08') + 0.2, y: 260, from: 2.2 })
tag('LE VRAI COURSIER', 'pin orange', { t0: Wd('07', 'vrai') - 0.1, t1: E('07') + 0.4, at: real })
tag('?', 'question', { t0: Wd('07', 'arrive') - 0.05, t1: E('07') + 0.4, y: 760, from: 3, dur: 0.25 })
// Le métro.
tag('LE FAUX', 'pin red', { t0: Wd('08', 'faux') - 0.1, t1: E('08'), at: fake })
tag('4 000 000 € DANS LE MÉTRO', 'pill red', { t0: Wd('08', '4') - 0.15, t1: E('08') + 0.2, y: 300, rot: -2 })
// La fin.
tag('JAMAIS RETROUVÉ', 'stamp', { t0: Wd('09', 'jamais') - 0.08, y: 330, rot: -6, from: 2.6, dur: 0.22 })
tag('Et toi… tu lui aurais donné la mallette ?', 'pill yellow', { t0: Wd('09', 'et') - 0.1, y: 1640, from: 1.2 }).el.style.fontSize = '48px'
void clock
void clock2

// Gros sous-titres animés (3 mots au plus, le mot prononcé dans un bloc).
const capsEl = document.createElement('div')
capsEl.className = 'caps'
ui.append(capsEl)
const CHUNKS = []
for (const line of C.lines) {
  const mine = []
  let cur = null
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 3 || /[,.:;?!…]$/.test(line.words[i - 1]?.w ?? '')) mine.push((cur = { words: [] }))
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
  c.el.className = 'line'
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
    for (const w of c.words) {
      const s = t < w.t - 0.05 ? 0 : ease.back(3)(clamp((t - (w.t - 0.05)) / 0.16))
      w.el.style.opacity = s > 0 ? '1' : '0'
      w.el.style.transform = `translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)})`
      w.el.classList.toggle('on', t >= w.t - 0.05 && t < w.next - 0.05)
    }
  }
}

// ------------------------------------------------------------ tilt-shift

const out = document.getElementById('out').getContext('2d')
const sharp = document.createElement('canvas')
sharp.width = W
sharp.height = H
const sctx = sharp.getContext('2d')
function composite(band) {
  out.clearRect(0, 0, W, H)
  out.filter = 'blur(9px) saturate(1.25)'
  out.drawImage(gl, -30, -30, W + 60, H + 60)
  out.filter = 'none'
  sctx.globalCompositeOperation = 'source-over'
  sctx.clearRect(0, 0, W, H)
  sctx.filter = 'saturate(1.25) contrast(1.06)'
  sctx.drawImage(gl, 0, 0)
  sctx.filter = 'none'
  const g = sctx.createLinearGradient(0, 0, 0, H)
  g.addColorStop(clamp(band[0] - 0.16), 'rgba(0,0,0,0)')
  g.addColorStop(band[0], 'rgba(0,0,0,1)')
  g.addColorStop(band[1], 'rgba(0,0,0,1)')
  g.addColorStop(clamp(band[1] + 0.16), 'rgba(0,0,0,0)')
  sctx.globalCompositeOperation = 'destination-in'
  sctx.fillStyle = g
  sctx.fillRect(0, 0, W, H)
  out.drawImage(sharp, 0, 0)
}

// ------------------------------------------------------------- la caméra

const WIDE = { pos: [-34, 50, 60], look: [-0.5, 0.6, 0] }
const CAM = [
  { t: 0, pos: [-8, 7.5, 6], look: [-4.8, 1.2, -4.6] },
  { t: S('02') - 0.2, ...WIDE, dur: 0.9 },
  { t: S('03') + 0.6, pos: [-11, 17, 15], look: [-4.2, 0.6, -3.4], dur: 1.2 },
  { t: Wd('04', 'chaque') - 0.2, pos: [-10, 36, 44], look: [1.6, 0.6, -1.6], dur: 1.2 },
  { t: S('05') - 0.1, pos: [-18, 22, 24], look: [-5.4, 0.6, -1.0], dur: 1.0 },
  { t: S('06') - 0.15, pos: [-8.5, 12, 10], look: [-4.6, 0.8, -3.8], dur: 0.6 },
  { t: S('07') - 0.1, pos: [16, 26, 28], look: [1.0, 0.6, 0.2], dur: 0.7 },
  { t: S('08') - 0.1, pos: [-20, 20, 26], look: [-6.4, 0.6, 2.4], dur: 1.0 },
  { t: S('09') - 0.1, pos: [30, 56, 58], look: [0, 0.4, 0], dur: 1.6 },
]
function camAt(t) {
  let i = 0
  while (i < CAM.length - 1 && t >= CAM[i + 1].t) i++
  const cur = CAM[i]
  const prev = CAM[Math.max(0, i - 1)]
  const p = i === 0 ? 1 : ease.io3(clamp((t - cur.t) / cur.dur))
  const pos = cur.pos.map((v, k) => lerp(prev.pos[k], v, p))
  const look = cur.look.map((v, k) => lerp(prev.look[k], v, p))
  // Lente dérive et respiration de la caméra.
  const a = Math.sin(t * 0.18) * 0.08
  camera.position.set(pos[0] * Math.cos(a) - pos[2] * Math.sin(a), pos[1], pos[0] * Math.sin(a) + pos[2] * Math.cos(a))
  camera.lookAt(...look)
}

// --------------------------------------------------------------- figurines

const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()
function walk(fig, path, t, t0, dur, { show = true } = {}) {
  const p = clamp((t - t0) / dur)
  const u = ease.io2(p)
  path.curve.getPointAt(u, tmpA)
  path.curve.getPointAt(Math.min(1, u + 0.01), tmpB)
  fig.position.set(tmpA.x, Y0 + (p > 0 && p < 1 ? Math.abs(Math.sin(t * 15)) * 0.07 : 0), tmpA.z)
  if (p < 1) fig.rotation.y = Math.atan2(tmpB.x - tmpA.x, tmpB.z - tmpA.z)
  path.line.visible = show && t >= t0
  path.line.geometry.setDrawRange(0, Math.max(2, Math.floor(121 * p)))
  return p
}
const park = (fig, x, z, ry = 0) => {
  fig.position.set(x, Y0, z)
  fig.rotation.y = ry
}

function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  camAt(t)
  // Le jour baisse : l'accroche est de nuit, le récit en fin de journée, puis la nuit tombe.
  const dusk = t < S('03') ? 1 : t < S('05') ? 0.2 : t < S('08') ? lerp(0.35, 0.7, prog(t, S('05'), 6)) : 1
  hemi.intensity = lerp(1.05, 0.55, dusk)
  sun.intensity = lerp(1.4, 0.45, dusk)
  sun.color.set(dusk > 0.5 ? '#b8c8ff' : '#ffe2c0')
  for (const l of lamps) l.intensity = 9 * dusk
  document.getElementById('stage').style.setProperty('--sky', dusk > 0.5 ? '#141733' : '#3a3f6a')

  // Accroche : la mallette ouverte, les diamants qui scintillent.
  const heroOn = t < S('03') - 0.2
  hero.visible = heroOn
  lid.rotation.x = -1.9 * ease.out3(clamp(t / 0.8))
  heroGems.forEach((g, k) => {
    g.rotation.y = t * 2 + k
    g.scale.setScalar(1 + 0.25 * Math.max(0, Math.sin(t * 6 + k * 1.7)))
  })
  sparkle.intensity = heroOn ? 6 + 3 * Math.sin(t * 8) : 0

  // L'expert visite tout, puis repart.
  expert.visible = t >= S('03') && t < S('05')
  if (expert.visible) walk(expert, visitPath, t, Wd('03', 'il') - 0.1, E('04') - Wd('03', 'il') - 0.6, { show: t < S('05') - 0.1 })
  else visitPath.line.visible = false
  // Le gérant : au comptoir, il suit l'expert pendant la visite, puis tend la mallette.
  park(manager, -4.8, -4.9, 0)
  manager.visible = !hero.visible
  if (t >= Wd('03', 'gerant') - 0.2 && t < E('03')) manager.rotation.y = Math.sin(t * 1.5) * 0.8
  // Le trajet du vendredi (la mallette part à la banque).
  fridayPath.line.visible = t >= Wd('04', 'banque') - 0.4 && t < S('05')
  fridayPath.line.geometry.setDrawRange(0, Math.max(2, Math.floor(121 * prog(t, Wd('04', 'banque') - 0.4, 1.0, ease.io2))))
  // La mallette : d'abord sur le comptoir, puis dans la main du faux coursier.
  const handOff = Wd('06', 'tend')
  // Le faux coursier.
  fake.visible = t >= S('05') - 0.2
  if (t < handOff + 0.2) walk(fake, fakeIn, t, S('05') - 0.2, Wd('05', 'presente') - S('05') + 0.4)
  else walk(fake, fakeOut, t, handOff + 0.6, S('08') + 2.8 - handOff)
  fakeIn.line.visible = fake.visible && t < S('07')
  fakeOut.line.visible = t >= handOff + 0.6 && t < S('09') + 1
  // Il descend dans le métro.
  const down = prog(t, Wd('08', 'metro') - 0.1, 0.8, ease.in2)
  if (down > 0) fake.position.y = Y0 - 1.2 * down
  fake.visible = fake.visible && down < 0.98
  if (t < handOff) {
    case1.position.set(-4.4, Y0 + 0.8, -4.4)
    case1.rotation.y = 0
  } else {
    fake.getWorldPosition(tmpA)
    const k = clamp((t - handOff) / 0.35)
    case1.position.set(lerp(-4.4, tmpA.x + 0.28, k), lerp(Y0 + 0.8, tmpA.y + 0.35, k), lerp(-4.4, tmpA.z, k))
    case1.rotation.y = fake.rotation.y
  }
  case1.visible = !hero.visible && (t < handOff || fake.visible)
  // Le vrai coursier, à 18 h 10.
  real.visible = t >= S('07') - 0.1 && t < S('09') + 2
  if (real.visible) walk(real, realIn, t, S('07') - 0.1, 2.4)
  else realIn.line.visible = false

  renderer.render(scene, camera)
  const close = camera.position.length() < 22
  composite(close ? [0.3, 0.7] : [0.36, 0.64])
  updateTags(t)
  updateCaptions(t)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  renderer.compile(scene, camera)
  seek(0)
})()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
