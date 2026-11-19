/**
 * Prototype E — « La Reconstitution » : la scène comme une maquette miniature.
 * Vue plongeante (focale longue, presque isométrique), couleurs pastel de nuit,
 * figurines, effet « tilt-shift » (flou en haut et en bas de l'image), et
 * repères d'enquêteur posés sur le décor (chronomètre, trajectoires, étiquettes).
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { clamp, ease, lerp, prog, rng } from '../../engine.js'

const W = 1080
const H = 1920
const FPS = 30
const timeline = await (await fetch('timeline.json')).json()
const LINE = timeline.lines[0]
const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
const Wd = (word, n = 0) => LINE.words.filter((w) => norm(w.w).startsWith(norm(word)))[n].t
const T = { heure: LINE.words[0].t, alarme: Wd('lalarme'), sonne: Wd('sonne'), instant: Wd('instant'), voisin: Wd('voisin'), batte: Wd('batte') }
const DURATION = timeline.duration

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
scene.environmentIntensity = 0.25
const camera = new THREE.PerspectiveCamera(18, W / H, 1, 400)
scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x2a2340, 0.9))
const moon = new THREE.DirectionalLight(0xb8c8ff, 1.2)
moon.position.set(-14, 26, 10)
moon.castShadow = true
moon.shadow.mapSize.set(2048, 2048)
Object.assign(moon.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 80 })
moon.shadow.bias = -0.0005
moon.shadow.normalBias = 0.02
scene.add(moon)

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

// --------------------------------------------------------------- la maquette

// Le socle en bois, avec sa tranche visible (c'est ce qui fait « maquette »).
rbox(22, 1.2, 15, 0.25, M('#7a5136', { roughness: 0.6 })).position.y = -0.6
rbox(21.4, 0.1, 14.4, 0.05, M('#3b3f5c')).position.y = 0.05
// La rue, les trottoirs, les passages piétons.
rbox(21.4, 0.06, 4.2, 0.02, M('#2a2c3d', { roughness: 0.95 })).position.set(0, 0.11, 1.6)
for (let x = -10; x < 10.5; x += 1.6) rbox(0.8, 0.02, 0.12, 0.01, glow('#d9d6c4')).position.set(x, 0.15, 1.6)
rbox(21.4, 0.22, 2.0, 0.05, M('#8d8aa6')).position.set(0, 0.16, -1.5)
rbox(21.4, 0.22, 1.6, 0.05, M('#8d8aa6')).position.set(0, 0.16, 4.5)

// Les façades (pastel) : la bijouterie, la maison du voisin, et leurs voisines.
function building(x, w, h, color, roof) {
  const g = group(scene, x, 0.27, -4.2)
  rbox(w, h, 3.6, 0.12, M(color), g).position.y = h / 2
  rbox(w + 0.3, 0.35, 3.9, 0.1, M(roof), g).position.y = h + 0.12
  return g
}
const shop = building(-3.4, 4.2, 3.2, '#e8b4b8', '#7a4b5a')
const house = building(1.4, 3.6, 5.4, '#a9c9de', '#3f5872')
building(-8.2, 4.6, 4.4, '#f2d3a2', '#8a6a3a')
building(6.4, 5.4, 3.8, '#c8b7e3', '#5a4a78')
// Vitrine éclairée et enseigne de la bijouterie.
const showcase = rbox(2.8, 1.5, 0.1, 0.05, new THREE.MeshStandardMaterial({ color: '#ffe3a0', emissive: '#ffcf70', emissiveIntensity: 1.2 }), shop)
showcase.position.set(-0.4, 1.2, 1.82)
rbox(0.9, 2.0, 0.1, 0.05, M('#4a2c34'), shop).position.set(1.3, 1.0, 1.82)
const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.8), new THREE.MeshBasicMaterial({ map: textTex('BIJOUX', { bg: '#3a2030', fg: '#ffd48a' }) }))
sign.position.set(0, 2.75, 1.86)
shop.add(sign)
// Gyrophare de l'alarme.
const alarmBulb = mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 0 }), shop)
alarmBulb.position.set(1.7, 3.0, 1.9)
const alarmLight = new THREE.PointLight(0xff2a2a, 0, 9, 1.5)
alarmLight.position.set(1.7, 3.2, 2.6)
shop.add(alarmLight)
// Maison du voisin : fenêtres allumées, porte qui s'ouvre.
for (const [x, y] of [[-0.9, 1.6], [0.9, 1.6], [-0.9, 3.8], [0.9, 3.8]]) {
  const win = rbox(0.9, 0.9, 0.1, 0.04, new THREE.MeshStandardMaterial({ color: '#ffe7b0', emissive: '#ffc96a', emissiveIntensity: y > 3 ? 1.1 : 0.3 }), house)
  win.position.set(x, y, 1.82)
}
const doorPivot = group(house, -0.45 + 0.9, 0, 1.84)
const door = rbox(0.9, 1.8, 0.1, 0.04, M('#3f5872'), doorPivot)
door.position.set(-0.45, 0.9, 0)
const doorGlow = rbox(0.86, 1.76, 0.02, 0.01, glow('#ffd88a'), house)
doorGlow.position.set(0, 0.9, 1.8)

// Réverbères.
for (const x of [-6, 0, 6]) {
  const p = group(scene, x, 0.27, -0.7)
  mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.4, 10), M('#2b2b3a'), p).position.y = 1.7
  mesh(new THREE.SphereGeometry(0.22, 16, 12), glow('#ffe2a8'), p).position.y = 3.45
  const l = new THREE.PointLight(0xffc77a, 9, 7, 1.6)
  l.position.y = 3.2
  p.add(l)
}
// Arbres.
const rt = rng(3)
for (const x of [-10, -5.6, 3.6, 9.4]) {
  const tr = group(scene, x + rt() * 0.4, 0.27, 5.1)
  mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.0, 8), M('#5a3d2a'), tr).position.y = 0.5
  mesh(new THREE.IcosahedronGeometry(0.75, 1), M('#3f7a5a', { flatShading: true }), tr).position.y = 1.4
}
// La voiture garée en face (le véhicule de fuite).
const car = group(scene, 4.6, 0.27, 2.6)
rbox(2.8, 0.7, 1.3, 0.25, M('#2f2f3f', { metalness: 0.3, roughness: 0.4 }), car).position.y = 0.55
rbox(1.6, 0.55, 1.2, 0.2, M('#2f2f3f', { metalness: 0.3, roughness: 0.4 }), car).position.set(-0.2, 1.1, 0)
for (const [x, z] of [[-0.9, 0.62], [0.9, 0.62], [-0.9, -0.62], [0.9, -0.62]]) {
  const w = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16), M('#111'), car)
  w.rotation.x = Math.PI / 2
  w.position.set(x, 0.3, z)
}
for (const z of [-0.4, 0.4]) rbox(0.05, 0.14, 0.26, 0.03, glow('#fff3c4'), car).position.set(1.42, 0.62, z)

// Figurines (corps en pilule, tête ronde, socle rond comme un jouet).
function figurine(color, { head = '#f2c4a0', hood = false } = {}) {
  const g = group(scene)
  mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20), M('#f4f1ea'), g).position.y = 0.03
  mesh(new THREE.CapsuleGeometry(0.26, 0.6, 6, 14), M(color), g).position.y = 0.62
  const h = mesh(new THREE.SphereGeometry(0.22, 18, 14), M(hood ? color : head), g)
  h.position.y = 1.22
  if (hood) mesh(new THREE.SphereGeometry(0.15, 14, 10), M(head), g).position.set(0, 1.2, 0.12)
  return g
}
const thief = figurine('#1d1f27', { hood: true })
const bag = mesh(new THREE.BoxGeometry(0.34, 0.3, 0.14), M('#c9a24a', { metalness: 0.4 }), thief)
bag.position.set(0.32, 0.55, 0)
const neighbor = figurine('#5b7fb8')
const bat = mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.9, 10), M('#c49a6c'), neighbor)
bat.position.set(0.32, 1.2, 0)
bat.rotation.z = -0.4

// Trajectoires en pointillés sur le sol.
function dashedPath(points, color) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0.32, z)))
  const g = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80))
  const line = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.18, linewidth: 2 }))
  line.computeLineDistances()
  scene.add(line)
  return { curve, line, total: g.attributes.lineDistance.array.at(-1) }
}
const thiefPath = dashedPath([[-2.1, -2.3], [-1.2, -1.2], [1.2, -0.9], [2.8, 0.2], [3.6, 1.8]], '#ff5a5a')
const neighPath = dashedPath([[1.4, -2.3], [1.5, -1.3], [2.0, -0.6], [2.6, 0.0]], '#7fb2ff')

// ----------------------------------------------------------- texte (HTML)

const ui = document.getElementById('ui')
const tag = (html, cls) => {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  ui.append(el)
  return el
}
const clock = tag('<span class="h">23:16</span><span class="s">:00</span>', 'clock')
const tAlarm = tag('🚨 ALARME', 'pin red')
const tThief = tag('LE VOLEUR', 'pin dark')
const tNeigh = tag('LE VOISIN', 'pin blue')
const tBat = tag('UNE BATTE', 'pin yellow')
const v3 = new THREE.Vector3()
const project = (obj, dy = 0) => {
  obj.getWorldPosition(v3)
  v3.y += dy
  v3.project(camera)
  return [((v3.x + 1) / 2) * W, ((1 - v3.y) / 2) * H]
}
const place = (el, t, t0, [x, y], from = 1.6) => {
  const s = t < t0 ? 0 : ease.back(2)(clamp((t - t0) / 0.3))
  el.style.visibility = s > 0.01 ? '' : 'hidden'
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scale(${lerp(from, 1, Math.min(1, s)) * Math.min(1, s * 1.4)})`
}

// Sous-titres : gros, animés, le mot prononcé dans un bloc.
const caps = tag('', 'caps')
caps.style.cssText = 'left:0;right:0;top:1440px;display:flex;justify-content:center'
const chunks = []
LINE.words.forEach((w, i) => {
  if (!chunks.length || chunks.at(-1).length >= 3 || /[,.:;?!…]$/.test(LINE.words[i - 1]?.w ?? '')) chunks.push([])
  chunks.at(-1).push(w)
})
function updateCaps(t) {
  const i = chunks.findLastIndex((c) => t >= c[0].t - 0.06)
  const c = chunks[i]
  if (!c || t > LINE.start + LINE.dur + 0.2) {
    caps.innerHTML = ''
    return
  }
  const end = chunks[i + 1]?.[0].t ?? LINE.start + LINE.dur
  caps.innerHTML = c
    .map((w, k) => {
      const s = t < w.t - 0.05 ? 0 : ease.back(3)(clamp((t - (w.t - 0.05)) / 0.16))
      const next = c[k + 1]?.t ?? end
      const on = t >= w.t - 0.05 && t < next - 0.05
      return `<span class="w${on ? ' on' : ''}" style="opacity:${s > 0 ? 1 : 0};transform:translateY(${((1 - s) * 30).toFixed(1)}px) scale(${(0.5 + 0.5 * s).toFixed(3)})">${w.w}</span>`
    })
    .join('')
}

// --------------------------------------------------------- tilt-shift

const out = document.getElementById('out').getContext('2d')
const sharp = document.createElement('canvas')
sharp.width = W
sharp.height = H
const sctx = sharp.getContext('2d')
function composite() {
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
  g.addColorStop(0.18, 'rgba(0,0,0,0)')
  g.addColorStop(0.36, 'rgba(0,0,0,1)')
  g.addColorStop(0.64, 'rgba(0,0,0,1)')
  g.addColorStop(0.82, 'rgba(0,0,0,0)')
  sctx.globalCompositeOperation = 'destination-in'
  sctx.fillStyle = g
  sctx.fillRect(0, 0, W, H)
  out.drawImage(sharp, 0, 0)
}

// ------------------------------------------------------------ l'instant t

const CAM = [
  { t: 0, pos: [-40, 54, 64], look: [0, 0.4, 0] },
  { t: T.instant - 0.4, pos: [-15, 22, 27], look: [-2.4, 1.2, -1.6], dur: 1.3 },
  { t: T.voisin - 0.2, pos: [13, 19, 24], look: [1.8, 1.4, -1.0], dur: 1.0 },
  { t: T.batte + 0.4, pos: [36, 50, 60], look: [1.0, 0.4, 0.0], dur: 1.4 },
]
function camAt(t) {
  let i = 0
  while (i < CAM.length - 1 && t >= CAM[i + 1].t) i++
  const cur = CAM[i]
  const prev = CAM[Math.max(0, i - 1)]
  const p = i === 0 ? 1 : ease.io3(clamp((t - cur.t) / cur.dur))
  const pos = cur.pos.map((v, k) => lerp(prev.pos[k], v, p))
  const look = cur.look.map((v, k) => lerp(prev.look[k], v, p))
  // Lente rotation autour de la maquette.
  const a = t * 0.05
  const [x, z] = [pos[0] * Math.cos(a) - pos[2] * Math.sin(a), pos[0] * Math.sin(a) + pos[2] * Math.cos(a)]
  camera.position.set(x, pos[1], z)
  camera.lookAt(...look)
}

function walk(fig, path, t, t0, dur) {
  const p = clamp((t - t0) / dur)
  const u = ease.io2(p)
  const pt = path.curve.getPointAt(u)
  const ahead = path.curve.getPointAt(Math.min(1, u + 0.01))
  fig.position.set(pt.x, 0.27 + (p > 0 && p < 1 ? Math.abs(Math.sin(t * 16)) * 0.08 : 0), pt.z)
  fig.rotation.y = Math.atan2(ahead.x - pt.x, ahead.z - pt.z)
  path.line.material.dashSize = 0.3
  path.line.geometry.setDrawRange(0, Math.max(2, Math.floor(81 * p)))
  return p
}

function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  camAt(t)
  // Alarme.
  const on = t >= T.alarme - 0.05
  const blink = on ? (Math.sin(t * 14) > 0 ? 1 : 0.15) : 0
  alarmBulb.material.emissiveIntensity = 3 * blink
  alarmLight.intensity = 22 * blink
  showcase.material.emissiveIntensity = on ? 0.8 + 0.6 * blink : 1.2
  // Le voleur sort et court vers la voiture ; le voisin descend, batte à la main.
  walk(thief, thiefPath, t, T.alarme + 0.1, 3.4)
  doorPivot.rotation.y = -1.6 * prog(t, T.instant, 0.5, ease.out3)
  const np = walk(neighbor, neighPath, t, T.voisin - 0.1, 2.0)
  neighbor.visible = t >= T.instant + 0.2
  bat.rotation.z = -0.4 - 0.5 * Math.sin(t * 6) * (np > 0 && np < 1 ? 1 : 0.2)
  // Chronomètre : 23:16, les secondes défilent.
  const sec = Math.floor(clamp(t - T.heure, 0, 59) * 3) % 60
  clock.querySelector('.s').textContent = `:${String(sec).padStart(2, '0')}`
  const cs = ease.back(2)(clamp((t - T.heure + 0.1) / 0.35))
  clock.style.transform = `translate(540px, 250px) translate(-50%, -50%) scale(${cs.toFixed(3)})`
  clock.style.visibility = cs > 0.01 ? '' : 'hidden'
  renderer.render(scene, camera)
  // Étiquettes posées sur la maquette.
  place(tAlarm, t, T.sonne - 0.1, project(alarmBulb, 0.6))
  place(tThief, t, T.alarme + 0.6, project(thief, 1.7))
  place(tNeigh, t, T.voisin - 0.05, project(neighbor, 1.7))
  place(tBat, t, T.batte - 0.1, project(bat, 0.9))
  tBat.style.marginTop = '-90px'
  composite()
  updateCaps(t)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  renderer.compile(scene, camera)
  seek(0)
})()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
