/**
 * ============================================================================
 *  « Pourquoi ça chauffe ? Le micro-ondes » — explication en 3D (1080 × 1920)
 * ============================================================================
 *  Le micro-ondes construit problème après problème (« Mais… Alors… Ça
 *  s'appelle… »), en 3D (Three.js) et en motion design : objets qui
 *  rebondissent en apparaissant, caméra qui glisse, étiquettes, chiffres qui
 *  défilent, transitions en volets, sous-titres mot à mot.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) affiche l'image de
 *  l'instant t, dans n'importe quel ordre (rendu image par image, render.mjs).
 *  Les instants viennent de timeline.json (voix off, voir voix.py) via cues.js.
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT, WIDTH, makeCues } from './cues.js'

const $ = (s) => document.querySelector(s)
const timeline = await (await fetch('timeline.json')).json()
const C = makeCues(timeline)
const { S, E, W } = C
const DURATION = C.duration
const SEC = Object.fromEntries(C.sections.map((s) => [s.id, s]))

// ================================================================ rendu 3D

const renderer = new THREE.WebGLRenderer({ canvas: $('#gl'), antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(WIDTH, HEIGHT, false)
renderer.setClearColor(0x000000, 0)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMappingExposure = 1.05

const scene = new THREE.Scene()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.55

const camera = new THREE.PerspectiveCamera(34, WIDTH / HEIGHT, 0.1, 300)

scene.add(new THREE.HemisphereLight(0xffffff, 0xf0d8c0, 1.1))
const key = new THREE.DirectionalLight(0xffffff, 2.3)
key.position.set(6, 12, 8)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
Object.assign(key.shadow.camera, { left: -9, right: 9, top: 11, bottom: -6, near: 1, far: 40 })
key.shadow.bias = -0.0005
key.shadow.normalBias = 0.03
scene.add(key)
const fill = new THREE.DirectionalLight(0xdde8ff, 0.7)
fill.position.set(-8, 5, -4)
scene.add(fill)

const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.ShadowMaterial({ opacity: 0.17 }))
floor.rotation.x = -Math.PI / 2
floor.receiveShadow = true
scene.add(floor)

// ------------------------------------------------------------ fabrication

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, ...o })
const glow = (color, o = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, ...o })

function mesh(geo, mat, parent) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = m.receiveShadow = true
  if (parent) parent.add(m)
  return m
}
const rbox = (w, h, d, r, mat, parent) => mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat, parent)
const group = (parent, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  if (parent) parent.add(g)
  return g
}

const COL = {
  ink: '#1F2430',
  yellow: '#FFC83D',
  red: '#EF4B3F',
  blue: '#3B82F6',
  shell: '#F5F3F0',
  inner: '#D8DCE2',
  wood: '#E7C397',
  copper: '#C9824F',
  steel: '#C5CBD3',
}

/** Petit texte (signes + et −) en sprite, toujours face à la caméra. */
function textSprite(text, bg, fg = '#fff', size = 0.7) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.beginPath()
  g.arc(128, 128, 118, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 14
  g.strokeStyle = COL.ink
  g.stroke()
  g.fillStyle = fg
  g.font = '900 190px "Figtree Variable", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, 140)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }))
  s.scale.setScalar(size)
  s.renderOrder = 10
  return s
}

// ------------------------------------------------------------ animations

const back = ease.back(1.9)
/** Échelle « pop » : 0 avant t0, rebond à l'entrée, se rétracte à t1. */
function popS(t, t0, t1 = Infinity, dur = 0.5) {
  const a = t < t0 ? 0 : back(clamp((t - t0) / dur))
  const b = t1 === Infinity ? 1 : 1 - ease.in3(clamp((t - t1) / 0.28))
  return Math.max(0, a * b)
}
function pop(obj, t, t0, t1 = Infinity, base = 1, dur = 0.5) {
  const s = popS(t, t0, t1, dur)
  obj.visible = s > 0.002
  obj.scale.setScalar(Math.max(1e-4, s * base))
  return s
}

/**
 * Caméra : à l'instant `t` de chaque clé, elle glisse depuis la clé précédente
 * (pendant `dur`, 0,9 s par défaut) ; elle respire un peu en permanence.
 */
function camAt(t, keys, drift) {
  let i = 0
  while (i < keys.length - 1 && t >= keys[i + 1].t) i++
  const cur = keys[i]
  const prev = keys[Math.max(0, i - 1)]
  const p = i === 0 ? 1 : ease.io3(clamp((t - cur.t) / (cur.dur ?? 0.9)))
  const pos = cur.pos.map((v, k) => lerp(prev.pos[k], v, p))
  const look = cur.look.map((v, k) => lerp(prev.look[k], v, p))
  drift ??= 0.12
  camera.position.set(pos[0] + Math.sin(t * 0.5) * drift, pos[1] + Math.sin(t * 0.37 + 1) * drift * 0.5, pos[2])
  camera.lookAt(look[0], look[1], look[2])
  camera.updateMatrixWorld()
}

// ---------------------------------------------------------------- rubans

/** Ruban d'onde toujours tourné vers la caméra (épaisseur constante). */
class Ribbon {
  constructor(parent, { n = 220, color = COL.yellow, width = 0.12, opacity = 1 } = {}) {
    this.n = n
    this.width = width
    const pos = new Float32Array(n * 2 * 3)
    const idx = []
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
    this.geo = new THREE.BufferGeometry()
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    this.geo.setIndex(idx)
    this.mat = glow(color, { side: THREE.DoubleSide, opacity, depthWrite: false })
    this.mesh = new THREE.Mesh(this.geo, this.mat)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = 5
    parent.add(this.mesh)
    this.p = []
    for (let i = 0; i < n; i++) this.p.push(new THREE.Vector3())
  }
  /** fn(u) → Vector3 (coordonnées du parent), u de 0 à 1 ; width(u) facultatif. */
  update(fn, widthFn = null) {
    const { n, p } = this
    for (let i = 0; i < n; i++) fn(i / (n - 1), p[i])
    const arr = this.geo.attributes.position.array
    const parentInv = new THREE.Matrix4().copy(this.mesh.parent.matrixWorld).invert()
    const camLocal = camera.position.clone().applyMatrix4(parentInv)
    const tan = new THREE.Vector3()
    const view = new THREE.Vector3()
    const side = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      tan.subVectors(p[Math.min(n - 1, i + 1)], p[Math.max(0, i - 1)]).normalize()
      view.subVectors(camLocal, p[i]).normalize()
      side.crossVectors(tan, view).normalize()
      const w = (widthFn ? widthFn(i / (n - 1)) : 1) * this.width * 0.5
      arr.set([p[i].x + side.x * w, p[i].y + side.y * w, p[i].z + side.z * w], i * 6)
      arr.set([p[i].x - side.x * w, p[i].y - side.y * w, p[i].z - side.z * w], i * 6 + 3)
    }
    this.geo.attributes.position.needsUpdate = true
    this.mesh.visible = true
  }
  hide() {
    this.mesh.visible = false
  }
}

/** Anneau d'onde qui s'élargit et s'efface. */
function makeRing(parent, color = COL.yellow) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.028, 8, 96), glow(color, { depthWrite: false }))
  m.renderOrder = 4
  parent.add(m)
  return m
}

/** Tube qui se dessine le long d'un chemin (rebonds sur les parois). */
function makeTrail(parent, points, { color = COL.yellow, radius = 0.06 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.02)
  const geo = new THREE.TubeGeometry(curve, points.length * 40, radius, 10, false)
  const m = new THREE.Mesh(geo, glow(color))
  m.renderOrder = 4
  parent.add(m)
  const total = geo.index.count
  return {
    mesh: m,
    draw(p) {
      const n = Math.floor(clamp(p) * total / 6) * 6
      geo.setDrawRange(0, n)
      m.visible = n > 0
    },
  }
}

// ============================================================ modèles

/** Le personnage : un mannequin en bois articulé. */
function makeBuddy(parent) {
  const wood = M(COL.wood, { roughness: 0.62 })
  const g = group(parent)
  const hips = group(g, 0, 1.6, 0)
  const torso = group(hips)
  mesh(new THREE.CapsuleGeometry(0.44, 0.7, 8, 20), wood, torso).position.y = 0.68
  const head = group(torso, 0, 1.55, 0)
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.25, 16), wood, head).position.y = -0.05
  mesh(new THREE.SphereGeometry(0.43, 32, 24), wood, head).position.y = 0.36
  const limb = (p, x, y, l1, l2, r) => {
    const root = group(p, x, y, 0)
    mesh(new THREE.SphereGeometry(r * 1.15, 16, 12), wood, root)
    mesh(new THREE.CapsuleGeometry(r, l1 - 2 * r, 6, 14), wood, root).position.y = -l1 / 2
    const mid = group(root, 0, -l1, 0)
    mesh(new THREE.SphereGeometry(r * 1.1, 16, 12), wood, mid)
    mesh(new THREE.CapsuleGeometry(r * 0.92, l2 - 2 * r, 6, 14), wood, mid).position.y = -l2 / 2
    mesh(new THREE.SphereGeometry(r * 1.35, 16, 12), wood, mid).position.y = -l2
    return { root, mid }
  }
  const armL = limb(torso, 0.58, 1.18, 0.62, 0.6, 0.12)
  const armR = limb(torso, -0.58, 1.18, 0.62, 0.6, 0.12)
  const legL = limb(hips, 0.22, 0.02, 0.8, 0.78, 0.15)
  const legR = limb(hips, -0.22, 0.02, 0.8, 0.78, 0.15)
  // Pose : angles en radians ; bras « lever » = sur le côté, « avant » = vers l'avant.
  const pose = ({ lean = 0, twist = 0, nod = 0, tilt = 0, aL = [0.15, 0, 0.1], aR = [0.15, 0, 0.1], bounce = 0 } = {}) => {
    hips.position.y = 1.6 + bounce
    torso.rotation.set(lean, twist, 0)
    head.rotation.set(nod, 0, tilt)
    armL.root.rotation.set(-aL[1], 0, aL[0])
    armL.mid.rotation.set(-aL[2], 0, 0)
    armR.root.rotation.set(-aR[1], 0, -aR[0])
    armR.mid.rotation.set(-aR[2], 0, 0)
  }
  pose()
  return { g, pose, head }
}

/** Le magnétron : noyau en cuivre, ailettes, aimants, antenne. */
function makeMagnetron(parent) {
  const g = group(parent)
  const core = M(COL.copper, { metalness: 0.75, roughness: 0.32, emissive: '#ff7a1a', emissiveIntensity: 0 })
  const fin = M('#DDE2E8', { metalness: 0.8, roughness: 0.3 })
  const magnet = M('#4A505C', { metalness: 0.3, roughness: 0.45 })
  const parts = []
  const add = (m, y) => {
    m.position.y = y
    parts.push(m)
    return m
  }
  add(rbox(2.0, 0.22, 2.0, 0.08, magnet, g), -0.95)
  add(mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.5, 40), core, g), 0)
  for (let i = 0; i < 6; i++) add(rbox(2.4, 0.05, 2.4, 0.02, fin, g), -0.5 + i * 0.2)
  add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.28, 40), magnet, g), 0.92)
  add(mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.5, 20), fin, g), 1.3)
  const dome = add(mesh(new THREE.SphereGeometry(0.32, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M('#8FA4BF', { metalness: 0.4, roughness: 0.3 }), g), 1.55)
  return { g, parts, core, top: dome }
}

/** Fabrique une texture de grille percée (porte du micro-ondes, gros plan). */
function holeTexture({ size = 512, holes = 16, metal = '#2B2F38', alpha = 0.85, hole = 0.32 } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.fillStyle = metal
  g.globalAlpha = alpha
  g.fillRect(0, 0, size, size)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'destination-out'
  const step = size / holes
  for (let y = 0; y < holes; y++) {
    for (let x = 0; x < holes; x++) {
      g.beginPath()
      g.arc((x + 0.5 + (y % 2) * 0.5) * step, (y + 0.5) * step, step * hole, 0, Math.PI * 2)
      g.fill()
    }
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  return tex
}

/** Écran d'affichage (canvas) : redessiné seulement quand le texte change. */
function makeDisplay(w, h) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = Math.round((256 * h) / w)
  const g = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  let last = null
  const set = (text, color = '#7CF2C8') => {
    if (text === last) return
    last = text
    g.fillStyle = '#0E1116'
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = color
    g.font = `800 ${Math.round(c.height * 0.72)}px "Figtree Variable", monospace`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, c.width / 2, c.height * 0.55)
    tex.needsUpdate = true
  }
  set('')
  return { tex, set }
}

/** Le micro-ondes (porte à gauche, commandes à droite), posé sur le sol. */
function makeMicrowave(parent) {
  const W = 5.2
  const H = 3.0
  const D = 3.6
  const T = 0.14
  const CW = 1.25
  const shell = M(COL.shell, { roughness: 0.32 })
  const inner = M(COL.inner, { roughness: 0.55, emissive: '#ffcf87', emissiveIntensity: 0 })
  const dark = M('#262A33', { roughness: 0.35 })
  const g = group(parent)
  const body = group(g)
  const y0 = 0.12
  const top = rbox(W, T, D, 0.07, shell, body)
  top.position.set(0, H - T / 2, 0)
  rbox(W, T, D, 0.07, shell, body).position.set(0, y0 + T / 2, 0)
  rbox(T, H - y0, D, 0.07, shell, body).position.set(-W / 2 + T / 2, (H + y0) / 2, 0)
  rbox(W, H - y0, T, 0.07, shell, body).position.set(0, (H + y0) / 2, -D / 2 + T / 2)
  const ctrl = rbox(CW, H - y0, D, 0.09, shell, body)
  ctrl.position.set(W / 2 - CW / 2, (H + y0) / 2, 0)
  for (const [x, z] of [[-2.2, 1.4], [2.2, 1.4], [-2.2, -1.4], [2.2, -1.4]]) mesh(new THREE.CylinderGeometry(0.16, 0.18, y0, 16), dark, body).position.set(x, y0 / 2, z)

  // Intérieur (cavité) : parois claires, qui s'éclairent quand il chauffe.
  const cx0 = -W / 2 + T
  const cx1 = W / 2 - CW
  const cx = (cx0 + cx1) / 2
  const cw = cx1 - cx0
  const ch = H - T - (y0 + T)
  const cy = y0 + T + ch / 2
  const cavity = group(body)
  rbox(cw, 0.03, D - T, 0.01, inner, cavity).position.set(cx, y0 + T + 0.015, T / 2)
  rbox(cw, 0.03, D - T, 0.01, inner, cavity).position.set(cx, H - T - 0.015, T / 2)
  rbox(cw, ch, 0.03, 0.01, inner, cavity).position.set(cx, cy, -D / 2 + T + 0.015)
  rbox(0.03, ch, D - T, 0.01, inner, cavity).position.set(cx0 + 0.015, cy, T / 2)
  rbox(0.03, ch, D - T, 0.01, inner, cavity).position.set(cx1 - 0.015, cy, T / 2)

  // Plateau tournant, assiette, plat.
  const turntable = group(cavity, cx, y0 + T + 0.05, 0.1)
  mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.05, 48), M('#cfe6f5', { transparent: true, opacity: 0.6, roughness: 0.1 }), turntable)
  mesh(new THREE.CylinderGeometry(1.05, 0.9, 0.08, 48), M('#ffffff', { roughness: 0.25 }), turntable).position.y = 0.065
  const food = mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.34, 40), M('#F2A65A', { roughness: 0.7 }), turntable)
  food.position.y = 0.27
  // Petit bol « soupe » sur le plat, pour lire la rotation.
  mesh(new THREE.SphereGeometry(0.12, 16, 12), M('#7BBF5E'), turntable).position.set(0.35, 0.47, 0.1)

  const light = new THREE.PointLight(0xffd9a0, 0, 7, 1.6)
  light.position.set(cx, H - 0.6, 0.4)
  g.add(light)

  // Panneau de commandes : écran, bouton rotatif, touche.
  const fz = D / 2 + 0.01
  const px = W / 2 - CW / 2
  rbox(CW - 0.2, H - 0.5, 0.05, 0.04, dark, body).position.set(px, (H + y0) / 2, fz)
  const display = makeDisplay(0.86, 0.36)
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.36), new THREE.MeshBasicMaterial({ map: display.tex, toneMapped: false }))
  screen.position.set(px, H - 0.62, fz + 0.035)
  body.add(screen)
  const dial = group(body, px, 1.55, fz + 0.03)
  const knob = mesh(new THREE.CylinderGeometry(0.33, 0.35, 0.16, 40), M('#E9ECF0', { metalness: 0.5, roughness: 0.25 }), dial)
  knob.rotation.x = Math.PI / 2
  knob.position.z = 0.08
  rbox(0.06, 0.22, 0.04, 0.02, M(COL.red), dial).position.set(0, 0.16, 0.17)
  rbox(0.75, 0.28, 0.06, 0.06, M('#3A404C'), body).position.set(px, 0.72, fz + 0.03)

  // Interrupteurs de sécurité (dans le cadre, côté loquet) et crochets de la porte.
  const switches = []
  for (const y of [0.85, 2.25]) {
    const s = group(body, cx1 + 0.08, y, D / 2 - 0.05)
    rbox(0.22, 0.34, 0.16, 0.04, M('#30343D'), s)
    const led = mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: '#4ade80' }), s)
    led.position.set(0, 0.06, 0.1)
    switches.push({ g: s, led })
  }

  // Porte (charnière à gauche) : cadre, vitre, cache plein (début), grille.
  const DW = W - CW + 0.02
  const doorPivot = group(g, -W / 2, 0, D / 2 + 0.08)
  const door = group(doorPivot)
  const frameMat = M(COL.shell, { roughness: 0.3, transparent: true, opacity: 1 })
  const frame = rbox(DW, H - y0 - 0.04, 0.14, 0.08, frameMat, door)
  frame.position.set(DW / 2, (H + y0) / 2, 0)
  const glassMat = M('#1a1f29', { transparent: true, opacity: 0.42, roughness: 0.05, metalness: 0.2 })
  const glass = rbox(DW - 0.95, H - 0.95, 0.16, 0.06, glassMat, door)
  glass.position.set(DW / 2 - 0.12, (H + y0) / 2, 0.005)
  glass.castShadow = false
  const gridTex = holeTexture({ holes: 14, alpha: 0.9 })
  gridTex.repeat.set(5, 3.2)
  const gridMat = new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0, depthWrite: false })
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(DW - 1.05, H - 1.05), gridMat)
  grid.position.set(DW / 2 - 0.12, (H + y0) / 2, 0.09)
  door.add(grid)
  const cover = rbox(DW - 0.9, H - 0.9, 0.18, 0.06, M(COL.shell, { roughness: 0.3 }), door)
  cover.position.set(DW / 2 - 0.12, (H + y0) / 2, 0.01)
  const handle = rbox(0.14, 1.7, 0.2, 0.07, M('#9AA3AF', { metalness: 0.6, roughness: 0.3 }), door)
  handle.position.set(DW - 0.32, (H + y0) / 2, 0.14)
  const hooks = []
  for (const y of [0.85, 2.25]) {
    const h = rbox(0.1, 0.22, 0.32, 0.03, M('#9AA3AF', { metalness: 0.6, roughness: 0.3 }), door)
    h.position.set(DW - 0.12, y, -0.2)
    hooks.push(h)
  }

  return { g, body, top, cavity, turntable, food, light, inner, display, dial, switches, doorPivot, door, frameMat, glass, glassMat, gridMat, cover, hooks, cx, cy, W, H, D }
}

/** Molécule d'eau : un oxygène (−), deux hydrogènes (+), 104,5° entre eux. */
function makeWater(parent, { signs = false, size = 1 } = {}) {
  const g = group(parent)
  const inner = group(g)
  const O = mesh(new THREE.SphereGeometry(0.62 * size, 32, 24), M('#E8524A', { roughness: 0.3, emissive: '#ff5a00', emissiveIntensity: 0 }), inner)
  O.position.y = 0.18 * size
  const hMat = M('#F7F7FA', { roughness: 0.3, emissive: '#ff8a00', emissiveIntensity: 0 })
  const a = (104.5 / 2) * (Math.PI / 180)
  for (const s of [-1, 1]) {
    const h = mesh(new THREE.SphereGeometry(0.4 * size, 28, 20), hMat, inner)
    h.position.set(s * Math.sin(a) * 0.78 * size, 0.18 * size - Math.cos(a) * 0.78 * size, 0)
  }
  let minus = null
  let plus = null
  if (signs) {
    minus = textSprite('−', COL.blue, '#fff', 0.62)
    minus.position.set(0, 0.18 * size + 0.95 * size, 0.2)
    inner.add(minus)
    plus = textSprite('+', COL.red, '#fff', 0.62)
    plus.position.set(0, 0.18 * size - Math.cos(a) * 0.78 * size - 0.75 * size, 0.2)
    inner.add(plus)
  }
  return { g, inner, O, hMat, minus, plus }
}

/** Flèche épaisse (champ électrique). */
function makeArrow(parent, color = COL.yellow, len = 3.4) {
  const s = new THREE.Shape()
  const hw = 0.22
  const hh = 0.62
  const hl = 1.0
  s.moveTo(-hw, -len / 2)
  s.lineTo(hw, -len / 2)
  s.lineTo(hw, len / 2 - hl)
  s.lineTo(hh, len / 2 - hl)
  s.lineTo(0, len / 2)
  s.lineTo(-hh, len / 2 - hl)
  s.lineTo(-hw, len / 2 - hl)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 })
  geo.translate(0, 0, -0.11)
  const g = group(parent)
  mesh(geo, M(color, { roughness: 0.35, emissive: color, emissiveIntensity: 0.15 }), g)
  return g
}

// ===================================================== étiquettes (HTML)

const labelsEl = $('#labels')
const LABELS = []
const tmpV = new THREE.Vector3()

/**
 * Étiquette en motion design : apparaît d'un rebond à t0, disparaît à t1.
 * Position : { x, y } en pixels, ou `anchor` (objet 3D ou point) projeté.
 */
function label(html, cls, { t0, t1, x = 540, y = 360, anchor = null, offset = [0, 0], rot = 0, dur = 0.45, wobble = 0 }) {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  labelsEl.append(el)
  const L = { el, t0, t1, x, y, anchor, offset, rot, dur, wobble, w: 0, h: 0, setText: null }
  LABELS.push(L)
  return L
}

function project(anchor) {
  if (anchor.isObject3D) anchor.getWorldPosition(tmpV)
  else tmpV.copy(anchor)
  tmpV.project(camera)
  return [((tmpV.x + 1) / 2) * WIDTH, ((1 - tmpV.y) / 2) * HEIGHT]
}

function updateLabels(t) {
  for (const L of LABELS) {
    const s = popS(t, L.t0, L.t1, L.dur)
    if (s <= 0.002) {
      L.el.style.visibility = 'hidden'
      continue
    }
    L.el.style.visibility = ''
    if (L.update) L.update(t)
    const [x, y] = L.anchor ? project(L.anchor) : [L.x, L.y]
    const rot = L.rot + (L.wobble ? Math.sin(t * 3.1) * L.wobble : 0) + (1 - Math.min(1, s)) * -8
    L.el.style.transform = `translate(${(x + L.offset[0] - L.w / 2).toFixed(1)}px, ${(y + L.offset[1] - L.h / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`
  }
}

function measureLabels() {
  for (const L of LABELS) {
    L.w = L.el.offsetWidth
    L.h = L.el.offsetHeight
  }
}

// ================================================================ décors

const SECTIONS = []
function section(id, bg, build) {
  const sec = SEC[id]
  const root = group(scene)
  root.visible = false
  const api = build(root, sec)
  SECTIONS.push({ ...sec, root, bg, ...api })
}

// ------------------------------------------------- 1 · le plat sur le feu

section('feu', ['#FFF6EA', '#F7D9BC'], (root, sec) => {
  const stove = group(root)
  rbox(4.4, 0.55, 3.3, 0.14, M(COL.shell, { roughness: 0.35 }), stove).position.y = 0.275
  rbox(4.0, 0.04, 2.9, 0.02, M('#2B2F38', { roughness: 0.3 }), stove).position.y = 0.57
  mesh(new THREE.CylinderGeometry(1.25, 1.3, 0.08, 40), M('#3B404B', { metalness: 0.5, roughness: 0.4 }), stove).position.y = 0.62
  for (let i = 0; i < 4; i++) {
    const knob = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24), M('#3B404B'), stove)
    knob.rotation.x = Math.PI / 2
    knob.position.set(-1.4 + i * 0.95, 0.28, 1.68)
  }
  // Flammes : petits cônes bleus, cœur orange, qui vacillent.
  const flames = group(stove, 0, 0.66, 0)
  const flameList = []
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const f = group(flames, Math.cos(a) * 1.18, 0, Math.sin(a) * 1.18)
    const outer = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.36, 12), glow('#4FA3FF', { opacity: 0.9 }))
    outer.position.y = 0.18
    f.add(outer)
    const core = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.24, 10), glow('#FFB347'))
    core.position.y = 0.12
    f.add(core)
    flameList.push(f)
  }

  // Casserole et soupe en coupe : un quart (la « part ») s'en va pour montrer l'intérieur.
  const R = 1.18
  const Hf = 0.95
  const potY = 0.8
  const potMat = M('#E2553F', { roughness: 0.3, side: THREE.DoubleSide })
  const potProfile = [[0.0, 0], [1.28, 0], [1.33, 0.06], [1.33, 1.3], [1.42, 1.36]].map(([x, y]) => new THREE.Vector2(x, y))
  const foodProfile = [[0, 0.05], [R, 0.05], [R, Hf], [0, Hf]].map(([x, y]) => new THREE.Vector2(x, y))
  const foodMat = M('#F2A65A', { roughness: 0.75, side: THREE.DoubleSide })
  const pot = group(root, 0, potY, 0)
  mesh(new THREE.LatheGeometry(potProfile, 64, 0, Math.PI * 1.5), potMat, pot)
  mesh(new THREE.LatheGeometry(foodProfile, 64, 0, Math.PI * 1.5), foodMat, pot)
  for (const s of [1, -1]) rbox(0.55, 0.16, 0.3, 0.07, M('#2B2F38'), pot).position.set(s * 1.6, 1.15, 0)
  const wedge = group(pot)
  mesh(new THREE.LatheGeometry(potProfile, 24, Math.PI * 1.5, Math.PI * 0.5), potMat, wedge)
  mesh(new THREE.LatheGeometry(foodProfile, 24, Math.PI * 1.5, Math.PI * 0.5), foodMat, wedge)

  // Faces de la coupe : la chaleur, du bleu (froid) au rouge (brûlant).
  const heat = document.createElement('canvas')
  heat.width = heat.height = 64
  const hctx = heat.getContext('2d')
  const himg = hctx.createImageData(64, 64)
  const heatTex = new THREE.CanvasTexture(heat)
  heatTex.colorSpace = THREE.SRGBColorSpace
  const faceMat = new THREE.MeshStandardMaterial({ map: heatTex, roughness: 0.8, side: THREE.DoubleSide })
  const faceA = mesh(new THREE.PlaneGeometry(R, Hf - 0.05), faceMat, pot)
  faceA.rotation.y = -Math.PI / 2
  faceA.position.set(-0.002, (Hf + 0.05) / 2, R / 2)
  const faceB = mesh(new THREE.PlaneGeometry(R, Hf - 0.05), faceMat, pot)
  faceB.scale.x = -1
  faceB.position.set(-R / 2, (Hf + 0.05) / 2, 0.002)
  const STOPS = [[0, [59, 130, 246]], [0.35, [125, 211, 252]], [0.55, [253, 224, 140]], [0.75, [251, 146, 60]], [1, [220, 38, 38]]]
  const heatRGB = (h) => {
    for (let i = 1; i < STOPS.length; i++) {
      if (h <= STOPS[i][0]) {
        const [a, ca] = STOPS[i - 1]
        const [b, cb] = STOPS[i]
        const p = (h - a) / (b - a)
        return ca.map((v, k) => v + (cb[k] - v) * p)
      }
    }
    return STOPS.at(-1)[1]
  }
  let lastHeat = -1
  const drawHeat = (p) => {
    const q = Math.round(p * 60) / 60
    if (q === lastHeat) return
    lastHeat = q
    for (let y = 0; y < 64; y++) {
      const v = 1 - y / 63 // 0 = fond
      for (let x = 0; x < 64; x++) {
        const u = x / 63 // 0 = axe, 1 = bord
        const bottom = clamp(1 - v / (0.06 + 0.3 * q))
        const edge = clamp(1 - (1 - u) / (0.04 + 0.22 * q)) * 0.85
        const h = clamp(0.12 + 0.95 * Math.max(bottom ** 0.8, edge) * (0.35 + 0.65 * q))
        const [r, g, b] = heatRGB(h)
        const i = (y * 64 + x) * 4
        himg.data[i] = r
        himg.data[i + 1] = g
        himg.data[i + 2] = b
        himg.data[i + 3] = 255
      }
    }
    hctx.putImageData(himg, 0, 0)
    heatTex.needsUpdate = true
  }

  // Flèches de chaleur qui avancent lentement vers le centre.
  const arrows = []
  for (let i = 0; i < 5; i++) {
    const a = group(root)
    const ang = Math.PI * 1.5 + ((i + 0.5) / 5) * Math.PI * 0.5 + Math.PI // côté opposé à la coupe : visibles de face
    const shaft = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), M(COL.red, { emissive: COL.red, emissiveIntensity: 0.3 }), a)
    shaft.rotation.z = Math.PI / 2
    const head = mesh(new THREE.ConeGeometry(0.15, 0.3, 16), M(COL.red, { emissive: COL.red, emissiveIntensity: 0.3 }), a)
    head.rotation.z = Math.PI / 2
    head.position.x = -0.38
    arrows.push({ a, ang })
  }

  const buddy = makeBuddy(root)
  buddy.g.position.set(3.4, 0, -0.6)
  buddy.g.rotation.y = -1.05
  buddy.g.scale.setScalar(0.92)

  const tFire = W('01', 'feu')
  const tCut = W('02', 'dessous') - 0.35
  const tHot = W('02', 'brule')
  const tCold = W('02', 'froid')
  const tSlow = W('02', 'chaleur')
  label('POURQUOI ÇA CHAUFFE ?<br><span class="sub">Le micro-ondes</span>', 'title', { t0: 0.12, t1: S('02') - 0.25, x: 540, y: 330, dur: 0.6 })
  label('BRÛLANT', 'pill red', { t0: tHot, t1: sec.t1, anchor: new THREE.Vector3(-0.25, potY + 0.25, 0.75), offset: [-40, 30] })
  label('FROID', 'pill blue', { t0: tCold, t1: sec.t1, anchor: new THREE.Vector3(-0.15, potY + 0.62, 0.2), offset: [0, -40] })
  label('très lentement…', 'pill small', { t0: W('02', 'lentement'), t1: sec.t1, x: 540, y: 380, wobble: 1.5 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: 0, pos: [1.2, 9.0, 19.0], look: [1.0, 1.6, 0] },
        { t: S('01') + 0.4, dur: 2.2, pos: [1.0, 7.6, 15.5], look: [1.0, 1.6, 0] },
        { t: tCut, dur: 1.1, pos: [-8.6, 6.0, 8.8], look: [0.2, 1.5, 0.2] },
        { t: tSlow, dur: 2.5, pos: [-7.4, 5.0, 7.6], look: [0.0, 1.45, 0.2] },
      ]),
    update(t) {
      pop(stove, t, sec.t0 + 0.05, Infinity, 1, 0.6)
      pop(pot, t, sec.t0 + 0.35, Infinity, 1, 0.6)
      pop(buddy.g, t, sec.t0 + 0.6, Infinity, 0.92)
      const fire = popS(t, tFire - 0.05, Infinity, 0.4)
      flames.visible = fire > 0.01
      flameList.forEach((f, i) => {
        const fl = 1 + 0.28 * Math.sin(t * 21 + i * 1.7) + 0.12 * Math.sin(t * 37 + i * 2.3)
        f.scale.set(fire, fire * fl, fire)
      })
      // La part qui s'écarte (coupe).
      const cutP = ease.io3(prog(t, tCut, 0.7))
      wedge.position.set(-2.4 * cutP, 0.3 * Math.sin(Math.PI * cutP), 2.4 * cutP)
      wedge.scale.setScalar(Math.max(1e-4, 1 - ease.in3(prog(t, tCut + 0.45, 0.35))))
      wedge.visible = wedge.scale.x > 0.01
      faceA.visible = faceB.visible = cutP > 0
      drawHeat(0.25 * prog(t, tHot - 0.4, 0.8, ease.out2) + 0.75 * prog(t, tSlow, E('02') - tSlow + 0.3, ease.sineIO))
      arrows.forEach(({ a, ang }, i) => {
        const s = popS(t, tSlow + i * 0.08, Infinity, 0.4)
        a.visible = s > 0.01
        const r = 2.15 - 0.35 * prog(t, tSlow, 3, ease.sineIO) - 0.06 * Math.sin(t * 3 + i)
        a.position.set(Math.cos(ang) * r * -1, potY + 0.55, Math.sin(ang) * r)
        a.rotation.y = Math.atan2(Math.sin(ang), Math.cos(ang)) - Math.PI
        a.scale.setScalar(Math.max(1e-4, s))
      })
      // Le mannequin se penche, puis se gratte la tête devant le centre froid.
      const think = prog(t, tCold - 0.1, 0.5, ease.out3)
      buddy.pose({ lean: 0.12, nod: 0.25, tilt: 0.2 * think, aR: [0.2, 1.9 * think + 0.1, 2.0 * think + 0.1], aL: [0.15, 0, 0.15], bounce: 0.02 * Math.sin(t * 2.4) })
    },
  }
})

// --------------------------------------------- 2 · l'eau, la molécule, le champ

section('eau', ['#EEF7FF', '#C7E0F8'], (root, sec) => {
  // La goutte d'eau.
  const dropPts = []
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI
    dropPts.push(new THREE.Vector2(1.15 * Math.sin(a) * Math.sin(a / 2) ** 1.25, 1.45 * Math.cos(a)))
  }
  const drop = mesh(new THREE.LatheGeometry(dropPts, 48), M('#4FA8FF', { roughness: 0.08, metalness: 0.05, emissive: '#1d6fd8', emissiveIntensity: 0.15 }), root)
  const dropG = group(root, 0, 3.6, 0)
  dropG.add(drop)

  const mol = makeWater(root, { signs: true, size: 1.25 })
  mol.g.position.set(0, 3.6, 0)

  const arrowL = makeArrow(root)
  const arrowR = makeArrow(root)
  arrowL.position.set(-2.0, 3.6, -0.4)
  arrowR.position.set(2.0, 3.6, -0.4)

  // L'essaim de molécules.
  const swarm = []
  const rand = rng(7)
  for (let i = 0; i < 46; i++) {
    const m = makeWater(root, { size: 0.55 })
    m.home = new THREE.Vector3((rand() - 0.5) * 7.5, 0.8 + rand() * 6.4, (rand() - 0.5) * 4 - 1)
    m.phase = rand() * Math.PI * 2
    m.spin = rand() - 0.5
    m.g.position.copy(m.home)
    swarm.push(m)
  }
  const sparks = []
  for (let i = 0; i < 26; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glow('#FF9A3C', { opacity: 0.85 }))
    s.home = new THREE.Vector3((rand() - 0.5) * 7, rand() * 6, (rand() - 0.5) * 3)
    s.speed = 0.6 + rand()
    root.add(s)
    sparks.push(s)
  }

  const wave = new Ribbon(root, { width: 0.2 })

  // Les instants.
  const tDrop = S('03') + 0.3
  const tMol = S('04') - 0.05
  const tField = W('05', 'champ')
  const tTurn = W('05', 'retourne')
  const tSwarm = C.swarm
  const tRub = W('06', 'frottent')
  const tHeat = W('06', 'chauffent')
  const tWave = S('07') - 0.1
  const flips = C.flips
  const fieldAngle = (t) => Math.PI * flips.filter((x) => x <= t).length
  const molAngle = (t) => {
    // Avant le champ : flotte au hasard. Ensuite : suit le champ (H, côté +, vers la flèche).
    let a = lerp(0.55 + 0.18 * Math.sin(t * 1.3), Math.PI, ease.back(1.4)(prog(t, tField + 0.15, 0.6)))
    a += Math.PI * ease.back(1.6)(prog(t, tTurn, 0.5))
    for (const x of flips.slice(1)) a += Math.PI * ease.out3(prog(t, x + 0.04, Math.min(0.3, 0.25)))
    return a
  }

  label('EAU', 'pill blue', { t0: W('03', 'leau'), t1: tMol + 0.15, x: 540, y: 470 })
  label('2 450 000 000', 'big white', { t0: W('06', 'milliards') - 0.1, t1: tWave, x: 540, y: 330, dur: 0.35 }).update = function (t) {
    const n = Math.round(2.45e9 * ease.out4(prog(t, this.t0, 1.0)))
    this.el.firstChild.textContent = n.toLocaleString('fr-FR').replace(/ | /g, ' ')
  }
  label('fois par seconde', 'pill yellow', { t0: W('06', 'seconde'), t1: tWave, x: 540, y: 470 })
  label('MICRO-ONDE', 'pill yellow', { t0: W('07', 'micro'), t1: sec.t1, x: 540, y: 400, dur: 0.5, wobble: 1.2 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [0, 4.6, 14.5], look: [0, 3.5, 0] },
        { t: tMol, dur: 0.8, pos: [0.6, 4.2, 14.0], look: [0, 3.5, 0] },
        { t: tSwarm, dur: 1.0, pos: [0, 4.6, 17.5], look: [0, 3.8, 0] },
        { t: tWave, dur: 1.4, pos: [-1.0, 4.4, 16], look: [0, 3.8, 0] },
      ]),
    update(t) {
      const sd = pop(dropG, t, tDrop, tMol, 1, 0.55)
      dropG.rotation.y = t * 0.6
      dropG.position.y = 3.6 + 0.12 * Math.sin(t * 2) + (1 - Math.min(1, sd)) * 1.5
      // Molécule principale.
      const sm = pop(mol.g, t, tMol + 0.1, tSwarm + 0.1, 1, 0.55)
      if (sm > 0) {
        mol.inner.rotation.z = molAngle(t)
        mol.inner.rotation.y = 0.25 * Math.sin(t * 0.9) * (1 - prog(t, tField, 0.5))
        mol.minus.visible = t >= W('04', 'moins') - 0.05
        mol.plus.visible = t >= W('04', 'plus') - 0.05
        mol.minus.scale.setScalar(0.62 * popS(t, W('04', 'moins') - 0.05))
        mol.plus.scale.setScalar(0.62 * popS(t, W('04', 'plus') - 0.05))
        mol.g.position.y = 3.6 + 0.1 * Math.sin(t * 1.7)
      }
      // Flèches du champ.
      const sa = popS(t, tField - 0.1, tWave, 0.5)
      for (const [a, x] of [[arrowL, -2.0], [arrowR, 2.0]]) {
        a.visible = sa > 0.01
        a.scale.setScalar(Math.max(1e-4, sa * (t > tSwarm ? 1.25 : 1)))
        a.position.x = t > tSwarm ? x * 1.35 : x
        const fa = fieldAngle(t)
        // Bascule rapide (rebond) vers le nouvel angle.
        const last = flips.filter((z) => z <= t).at(-1)
        const p = last ? ease.back(1.4)(prog(t, last, Math.min(0.22, 0.6))) : 1
        a.rotation.z = fa - Math.PI * (1 - p) * (last ? 1 : 0)
      }
      // Essaim : chaque molécule tourne, s'agite, puis chauffe.
      const rub = prog(t, tRub - 0.2, 0.5)
      const hot = prog(t, tHeat - 0.1, 1.0, ease.out2)
      swarm.forEach((m, i) => {
        const s = popS(t, tSwarm + i * 0.012, Infinity, 0.45)
        m.g.visible = s > 0.01
        if (!m.g.visible) return
        m.g.scale.setScalar(Math.max(1e-4, s))
        const k = Math.floor(t * FPS)
        const jitter = 0.35 + 0.65 * rub
        const r = rng(k * 131 + i * 7)
        m.inner.rotation.z = m.phase + (k % 2 ? Math.PI : 0) + (r() - 0.5) * 0.9 * jitter
        m.inner.rotation.y = m.spin * t
        m.g.position.set(m.home.x + (r() - 0.5) * 0.16 * jitter, m.home.y + (r() - 0.5) * 0.16 * jitter, m.home.z)
        m.O.material.emissiveIntensity = 0.9 * hot
        m.hMat.emissiveIntensity = 0.6 * hot
      })
      sparks.forEach((s, i) => {
        const v = popS(t, tHeat + i * 0.03, Infinity, 0.3)
        s.visible = v > 0.01
        const y = (s.home.y + (t - tHeat) * s.speed) % 6.5
        s.position.set(s.home.x + 0.2 * Math.sin(t * 2 + i), 0.6 + y, s.home.z)
        s.scale.setScalar(Math.max(1e-4, v * (1 - y / 6.5)))
      })
      // L'onde : une sinusoïde qui traverse l'écran.
      const sw = prog(t, tWave, 0.9, ease.out3)
      if (sw > 0) {
        wave.update(
          (u, p) => p.set(lerp(-9, 9, u) * 1, 3.9 + 1.0 * Math.sin(u * Math.PI * 6 - t * 9), 1.5),
          (u) => clamp((sw * 1.15 - u) * 8) * clamp(u * 12) * clamp((1 - u) * 12),
        )
      } else wave.hide()
    },
  }
})

// --------------------------------------------------- 3 · le magnétron, 1945

section('magnetron', ['#FFF1E6', '#F5CDAF'], (root, sec) => {
  const mag = makeMagnetron(root)
  mag.g.position.set(0, 1.15, 0)
  const rings = [0, 1, 2, 3].map(() => makeRing(root))

  // Poche de jean + barre chocolatée (qui fond).
  const pocket = group(root, 4.6, 0, 0.6)
  const denim = M('#3E5C8A', { roughness: 0.8 })
  rbox(2.4, 2.6, 0.3, 0.2, denim, pocket).position.y = 1.3
  rbox(2.3, 0.06, 0.05, 0.02, M('#E8B04B'), pocket).position.set(0, 2.25, 0.17)
  const bar = group(pocket, 0, 2.2, 0.0)
  const choc = M('#5B3420', { roughness: 0.45 })
  const barBody = group(bar)
  rbox(1.0, 1.7, 0.24, 0.06, choc, barBody).position.y = 0.4
  for (let y = 0; y < 3; y++) for (let x = 0; x < 2; x++) rbox(0.42, 0.42, 0.08, 0.05, choc, barBody).position.set(-0.23 + x * 0.46, 0.65 + y * 0.46 - 0.46, 0.15)
  rbox(1.08, 0.9, 0.3, 0.06, M('#E2553F', { roughness: 0.5 }), barBody).position.y = -0.15
  const drips = []
  for (let i = 0; i < 3; i++) {
    const d = mesh(new THREE.SphereGeometry(0.12, 16, 12), choc, pocket)
    d.position.set(-0.35 + i * 0.35, 2.2, 0.2)
    drips.push(d)
  }
  const puddle = mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.03, 32), choc, pocket)
  puddle.position.set(0, 0.02, 0.9)
  const beam = new Ribbon(root, { width: 0.14 })

  const tBuild = S('08') + 0.15
  const tName = W('08', 'magnetron')
  const t45 = W('09', '1945')
  const tBar = W('09', 'ingenieur') - 0.1
  const tMelt = W('09', 'fondre')
  label('MAGNÉTRON', 'pill', { t0: tName, t1: S('09') + 0.3, x: 540, y: 380, wobble: 1.2 })
  label('1945', 'big white', { t0: t45 - 0.05, t1: sec.t1, x: 540, y: 340, dur: 0.4 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [0, 4.4, 13.5], look: [0, 1.6, 0] },
        { t: tBuild + 0.4, dur: 2.6, pos: [1.5, 5.0, 16.5], look: [0, 1.7, 0] },
        { t: S('09') - 0.1, dur: 1.1, pos: [2.4, 5.4, 22.5], look: [2.3, 1.9, 0] },
      ]),
    update(t) {
      mag.parts.forEach((p, i) => {
        const s = popS(t, tBuild + i * 0.13, Infinity, 0.45)
        p.visible = s > 0.01
        p.scale.setScalar(Math.max(1e-4, s))
      })
      mag.g.rotation.y = 0.4 + t * 0.35
      const on = prog(t, tName - 0.2, 0.6)
      mag.core.emissiveIntensity = 0.5 * on * (0.8 + 0.2 * Math.sin(t * 18))
      rings.forEach((r, i) => {
        const age = (t - tName - i * 0.45) % 1.8
        const live = t > tName + i * 0.45
        r.visible = live
        if (!live) return
        const p = age / 1.8
        r.position.set(0, 1.15 + 1.6 + p * 0.6, 0)
        r.rotation.x = Math.PI / 2
        r.scale.setScalar(0.3 + p * 3.2)
        r.material.opacity = (1 - p) * 0.9
      })
      pop(pocket, t, tBar, Infinity, 1, 0.5)
      // Fonte : la barre s'affaisse, des gouttes coulent, une flaque s'étale.
      const m = ease.io2(prog(t, tMelt, 1.8))
      barBody.scale.set(1 + 0.18 * m, 1 - 0.55 * m, 1 + 0.4 * m)
      barBody.rotation.z = -0.22 * m
      barBody.position.y = -0.45 * m
      drips.forEach((d, i) => {
        const p = prog(t, tMelt + 0.3 + i * 0.25, 1.4, ease.in2)
        d.visible = p > 0
        d.position.y = 1.9 - 1.9 * p
        d.scale.set(1, 1 + 1.2 * Math.sin(Math.PI * p), 1)
      })
      puddle.visible = m > 0.05
      puddle.scale.set(Math.max(1e-4, prog(t, tMelt + 0.9, 1.4, ease.out3)), 1, Math.max(1e-4, prog(t, tMelt + 0.9, 1.4, ease.out3)))
      // L'onde va du magnétron vers la poche.
      const b = prog(t, tBar + 0.3, 0.6, ease.out3)
      if (b > 0) {
        const p0 = new THREE.Vector3(0.4, 2.8, 0)
        const p1 = new THREE.Vector3(4.2, 2.4, 0.9)
        beam.update(
          (u, p) => {
            p.lerpVectors(p0, p1, u)
            p.y += 0.28 * Math.sin(u * Math.PI * 8 - t * 12)
          },
          (u) => clamp((b * 1.1 - u) * 6),
        )
      } else beam.hide()
    },
  }
})

// ------------------------------------- 4 · les ondes partout, la boîte en métal

section('boite', ['#ECF9F2', '#C2E8D6'], (root, sec) => {
  const mag = makeMagnetron(root)
  mag.g.position.set(0, 1.1, -0.3)
  mag.g.scale.setScalar(0.62)
  const rings = []
  const axes = []
  const rand = rng(11)
  for (let i = 0; i < 6; i++) {
    rings.push(makeRing(root))
    axes.push(new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI))
  }
  const buddy = makeBuddy(root)
  buddy.g.position.set(4.4, 0, 0.6)
  buddy.g.rotation.y = -1.2
  buddy.g.scale.setScalar(0.85)

  // La boîte : cinq plaques de métal qui arrivent de partout.
  const metal = M(COL.steel, { metalness: 0.85, roughness: 0.28 })
  const B = { w: 4.6, h: 3.4, d: 3.8 }
  const plates = [
    { size: [B.w, 0.12, B.d], at: [0, 0.06, 0], from: [0, -3, 0] },
    { size: [B.w, B.h, 0.12], at: [0, B.h / 2, -B.d / 2], from: [0, 0, -6] },
    { size: [0.12, B.h, B.d], at: [-B.w / 2, B.h / 2, 0], from: [-6, 0, 0] },
    { size: [0.12, B.h, B.d], at: [B.w / 2, B.h / 2, 0], from: [6, 0, 0] },
    { size: [B.w, 0.12, B.d], at: [0, B.h, 0], from: [0, 6, 0] },
  ].map((p) => ({ ...p, m: rbox(...p.size, 0.05, metal, root) }))

  // Rebonds dans la boîte (vue par l'avant, ouvert).
  const rand2 = rng(5)
  const path = []
  let pnt = new THREE.Vector3(0, 1.8, -0.3)
  let dir = new THREE.Vector3(0.9, 0.55, 0.35).normalize()
  path.push(pnt.clone())
  for (let i = 0; i < 9; i++) {
    // Avance jusqu'à la paroi la plus proche, puis rebondit.
    const lim = [B.w / 2 - 0.25, B.h - 0.25, B.d / 2 - 0.25]
    let best = Infinity
    let axis = 0
    for (let k = 0; k < 3; k++) {
      const v = dir.getComponent(k)
      if (Math.abs(v) < 1e-3) continue
      const p = pnt.getComponent(k)
      const target = k === 1 ? (v > 0 ? lim[1] : 0.25) : v > 0 ? lim[k] : -lim[k]
      const d = (target - p) / v
      if (d > 1e-3 && d < best) {
        best = d
        axis = k
      }
    }
    pnt = pnt.clone().addScaledVector(dir, best)
    path.push(pnt.clone())
    dir.setComponent(axis, -dir.getComponent(axis))
    dir.x += (rand2() - 0.5) * 0.2
    dir.normalize()
  }
  const trail = makeTrail(root, path, { radius: 0.055 })

  const tToi = W('10', 'toi')
  const tWater = W('10', 'plein')
  const tBox = W('11', 'boite') - 0.45
  const tBounce = W('11', 'renvoie') - 0.1
  label('≈ 60 % d’eau', 'pill blue', { t0: tWater, t1: tBox - 0.2, anchor: buddy.head, offset: [0, -150] })
  label('CAGE DE FARADAY', 'pill', { t0: W('12', 'cage'), t1: sec.t1, x: 540, y: 380, wobble: 1.2 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [1.0, 6.0, 19.5], look: [1.0, 1.9, 0] },
        { t: tToi - 0.4, dur: 1.0, pos: [2.2, 5.8, 22.5], look: [2.1, 2.0, 0] },
        { t: tBox - 0.2, dur: 1.2, pos: [0, 5.2, 17.0], look: [0, 1.8, 0] },
        { t: S('12') - 0.3, dur: 1.4, pos: [0, 4.6, 14.5], look: [0, 1.7, 0] },
      ]),
    update(t) {
      pop(mag.g, t, sec.t0 + 0.1, Infinity, 0.62)
      mag.g.rotation.y = t * 0.3
      mag.core.emissiveIntensity = 0.5
      const boxed = prog(t, tBox + 0.5, 0.6)
      rings.forEach((r, i) => {
        const age = (t - sec.t0 - i * 0.22) % 2.0
        const p = age / 2.0
        r.visible = t > sec.t0 + i * 0.22 && boxed < 1
        r.position.set(0, 1.8, -0.3)
        r.rotation.copy(axes[i])
        const maxR = lerp(7.5, 2.0, boxed)
        r.scale.setScalar(0.3 + p * maxR)
        r.material.opacity = (1 - p) * 0.9 * (1 - boxed)
      })
      // Le mannequin arrive, reçoit les ondes, recule, puis s'en va.
      const sb = pop(buddy.g, t, tToi - 0.15, tBox - 0.1, 0.85)
      if (sb > 0) {
        const hit = prog(t, tWater - 0.3, 0.4, ease.out3)
        buddy.pose({ lean: -0.3 * hit, nod: -0.2 * hit, aL: [0.5 + 0.6 * hit, 1.2 * hit, 1.6 * hit], aR: [0.5 + 0.6 * hit, 1.2 * hit, 1.6 * hit], bounce: 0.03 * Math.sin(t * 9) * hit })
        buddy.g.position.x = 4.4 + 0.3 * hit
      }
      plates.forEach((p, i) => {
        const k = prog(t, tBox + i * 0.12, 0.5, ease.out3)
        p.m.visible = k > 0
        p.m.position.set(p.at[0] + p.from[0] * (1 - k), p.at[1] + p.from[1] * (1 - k), p.at[2] + p.from[2] * (1 - k))
        p.m.rotation.set((1 - k) * 0.8, (1 - k) * 0.6, 0)
      })
      trail.draw(prog(t, tBounce, 2.2, ease.io2))
    },
  }
})

// ------------------------- 5 · la vitre, la grille, puis gros plan sur les trous

section('vitre', ['#F3F0FF', '#D7CFF8'], (root, sec) => {
  const mw = makeMicrowave(root)
  mw.light.intensity = 0
  mw.display.set('1:30')

  // Gros plan : la tôle percée, l'onde de 12 cm qui rebondit, la lumière qui passe.
  const macro = group(root)
  const sheetTex = holeTexture({ size: 512, holes: 10, metal: '#9aa3ae', alpha: 1, hole: 0.24 })
  sheetTex.repeat.set(3, 3)
  const sheet = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 9, 9),
    new THREE.MeshStandardMaterial({ map: sheetTex, alphaTest: 0.5, metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }),
  )
  sheet.castShadow = true
  sheet.position.set(0, 4.5, 0)
  macro.add(sheet)
  const inWave = new Ribbon(macro, { width: 0.22 })
  const outWave = new Ribbon(macro, { width: 0.22, color: '#FFB020' })
  const rays = []
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 10), glow('#FFE45C', { opacity: 0.95 }))
    r.rotation.z = Math.PI / 2
    macro.add(r)
    rays.push(r)
  }

  const tQ = W('13', 'plat')
  const tGlass = W('13', 'vitre') - 0.1
  const tGrid = W('13', 'grille')
  const tWave = S('14') + 0.1
  const t12 = W('14', '12')
  const tBounce = W('14', 'trop') + 0.2
  const tLight = W('14', 'lumiere') - 0.1
  const L = 6.0 // longueur d'onde affichée (12 cm, à l'échelle du gros plan)
  label('?', 'big white', { t0: tQ, t1: tGlass + 0.1, x: 540, y: 420 })
  label('12 cm', 'big white', { t0: t12, t1: sec.t1, x: 540, y: 330, dur: 0.4 })
  label('trous de quelques mm', 'pill small', { t0: W('14', 'trop') - 0.1, t1: sec.t1, x: 540, y: 1180 })
  label('TROP GROSSE', 'pill red', { t0: W('14', 'grosse') - 0.05, t1: tLight, x: 540, y: 490, rot: -4 })
  label('LA LUMIÈRE PASSE', 'pill yellow', { t0: W('14', 'passe', 1) - 0.1, t1: sec.t1, x: 540, y: 490, rot: 3 })

  return {
    cam: (t) => {
      if (t < C.macro)
        camAt(t, [
          { t: sec.t0, pos: [2.6, 4.6, 19.5], look: [0, 1.6, 0] },
          { t: tGlass - 0.2, dur: 1.2, pos: [0.8, 3.4, 16.0], look: [-0.2, 1.6, 0] },
          { t: tGrid, dur: 1.4, pos: [-0.3, 2.3, 10.0], look: [-0.5, 1.6, 1.8] },
        ])
      else
        camAt(t, [
          { t: C.macro, pos: [3.0, 6.6, 21.0], look: [-4.0, 4.8, 0] },
          { t: tBounce, dur: 2.0, pos: [4.0, 6.4, 20.0], look: [-3.4, 4.7, 0] },
          { t: tLight, dur: 1.2, pos: [10.5, 5.6, 17.0], look: [1.0, 4.5, 0] },
        ])
    },
    update(t) {
      const isMacro = t >= C.macro
      mw.g.visible = !isMacro
      macro.visible = isMacro
      if (!isMacro) {
        pop(mw.g, t, sec.t0 + 0.05, Infinity, 1, 0.55)
        // Le cache plein disparaît : la vitre apparaît, l'intérieur s'éclaire.
        const c = 1 - ease.backIn(1.6)(prog(t, tGlass, 0.35))
        mw.cover.visible = c > 0.01
        mw.cover.scale.setScalar(Math.max(1e-4, c))
        const lit = prog(t, tGlass + 0.2, 0.4)
        mw.light.intensity = 9 * lit
        mw.inner.emissiveIntensity = 0.25 * lit
        mw.turntable.rotation.y = t * 0.8
        mw.gridMat.opacity = prog(t, tGrid - 0.1, 0.6)
        return
      }
      // Gros plan : onde incidente (de la gauche) jusqu'à la tôle, puis réfléchie.
      const k = (2 * Math.PI) / L
      const front = lerp(-14, 0, prog(t, tWave, t12 - tWave + 0.2, ease.out2))
      inWave.update(
        (u, p) => {
          const x = lerp(-14, 0, u)
          p.set(x, 4.6 + 1.2 * Math.sin(k * x - t * 6), -0.4)
        },
        (u) => clamp((front - lerp(-14, 0, u)) * 2 + 0.0) * clamp(u * 6),
      )
      const r = prog(t, tBounce, 1.6, ease.out2)
      if (r > 0) {
        outWave.update(
          (u, p) => {
            const d = u * 12
            p.set(-d * 0.82, 4.6 + d * 0.55 + 1.2 * Math.sin(k * d + t * 6), 0.6)
          },
          (u) => clamp((r * 1.05 - u) * 6) * clamp(u * 10),
        )
      } else outWave.hide()
      rays.forEach((ray, i) => {
        const start = tLight + i * 0.11
        const p = ((t - start) * 0.8) % 1
        ray.visible = t > start
        const y = 2.6 + (i % 4) * 1.18
        const z = -2.4 + (i * 1.7) % 5
        ray.position.set(lerp(-6, 6, p), y, z)
        ray.material.opacity = 0.95 * Math.sin(Math.PI * p)
      })
    },
  }
})

// --------------------------- 6 · points chauds et froids, le plateau tournant

section('plateau', ['#FFF9E5', '#F5E2A6'], (root, sec) => {
  const mw = makeMicrowave(root)
  mw.top.visible = false
  mw.doorPivot.visible = false
  mw.light.intensity = 6
  mw.inner.emissiveIntensity = 0.12
  // Un grand plat dont le dessus montre la chaleur.
  mw.food.visible = false
  const heat = document.createElement('canvas')
  heat.width = heat.height = 96
  const hctx = heat.getContext('2d')
  const himg = hctx.createImageData(96, 96)
  const heatTex = new THREE.CanvasTexture(heat)
  heatTex.colorSpace = THREE.SRGBColorSpace
  const side = M('#F2A65A', { roughness: 0.7 })
  const topMat = new THREE.MeshStandardMaterial({ map: heatTex, roughness: 0.75 })
  const dish = mesh(new THREE.CylinderGeometry(0.98, 1.0, 0.22, 64), [side, topMat, side], mw.turntable)
  dish.position.y = 0.2
  const RAD = 0.98
  // Ondes stationnaires (ventres tous les 6 cm à peu près) : motif fixe dans le four.
  const field = (x, z) => (Math.cos(x * 4.3 + 0.6) * Math.cos(z * 4.3 - 0.4)) ** 2
  const COLD = [70, 130, 240]
  const MID = [244, 170, 96]
  const HOT = [230, 40, 30]
  const colorOf = (h) => (h < 0.5 ? COLD.map((v, k) => v + (MID[k] - v) * h * 2) : MID.map((v, k) => v + (HOT[k] - v) * (h - 0.5) * 2))
  let lastKey = ''
  const drawHeat = (amount, turned) => {
    const key = `${amount.toFixed(2)}|${turned.toFixed(2)}`
    if (key === lastKey) return
    lastKey = key
    const steps = Math.max(1, Math.min(28, Math.ceil(turned / 0.22)))
    for (let j = 0; j < 96; j++) {
      for (let i = 0; i < 96; i++) {
        // Coordonnées du dessus du plat (repère du plat), puis dans le four.
        const x = (i / 95) * 2 - 1
        const z = (j / 95) * 2 - 1
        let h = 0
        for (let s = 0; s < steps; s++) {
          const a = steps === 1 ? 0 : (turned * s) / (steps - 1)
          const wx = x * Math.cos(a) - z * Math.sin(a)
          const wz = x * Math.sin(a) + z * Math.cos(a)
          h += field(wx * RAD, wz * RAD)
        }
        h = 0.5 + (h / steps - 0.5) * amount
        const [r, g, b] = colorOf(clamp(h))
        const k = (j * 96 + i) * 4
        himg.data[k] = r
        himg.data[k + 1] = g
        himg.data[k + 2] = b
        himg.data[k + 3] = 255
      }
    }
    hctx.putImageData(himg, 0, 0)
    heatTex.needsUpdate = true
  }
  // Ondes qui rebondissent dans la cavité.
  const cx = mw.cx
  const pts = [[-1.6, 2.3, -1.2], [0.9, 0.7, 1.2], [-1.4, 2.5, 1.0], [0.8, 0.8, -1.3], [-1.5, 2.0, -0.2], [0.9, 2.4, 1.3]]
  const trails = [
    makeTrail(root, pts.map(([x, y, z]) => new THREE.Vector3(cx + x, y, z)), { radius: 0.045 }),
    makeTrail(root, pts.map(([x, y, z]) => new THREE.Vector3(cx - x * 0.9, 3.0 - y * 0.9, -z)), { radius: 0.045, color: '#FFB020' }),
  ]

  const tBounce = S('15')
  const tSpots = W('15', 'superposent') - 0.1
  const tTurn = W('16', 'tourner') - 0.1
  label('CHAUD', 'pill red', { t0: W('15', 'fort') - 0.05, t1: tTurn + 0.6, anchor: new THREE.Vector3(cx - 0.05, 0.6, 0.25), offset: [-150, -80] })
  label('FROID', 'pill blue', { t0: W('15', 'pas') - 0.05, t1: tTurn + 0.6, anchor: new THREE.Vector3(cx + 0.55, 0.6, 0.45), offset: [140, 90] })
  label('PLATEAU TOURNANT', 'pill yellow', { t0: W('16', 'plateau') - 0.05, t1: sec.t1, x: 540, y: 360, wobble: 1.2 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [cx + 0.6, 7.2, 8.4], look: [cx, 0.9, 0] },
        { t: tSpots, dur: 1.2, pos: [cx + 0.2, 6.6, 5.6], look: [cx, 0.4, 0.1] },
        { t: tTurn, dur: 1.5, pos: [cx - 0.5, 7.6, 7.2], look: [cx, 0.5, 0.1] },
      ]),
    update(t) {
      pop(mw.g, t, sec.t0 + 0.05, Infinity, 1, 0.5)
      trails.forEach((tr, i) => tr.draw(prog(t, tBounce + i * 0.35, 1.6, ease.io2) * (1 - prog(t, tTurn, 0.4))))
      const turned = Math.max(0, t - tTurn) * 2.2
      mw.turntable.rotation.y = turned
      drawHeat(prog(t, tSpots, 1.2, ease.out2), Math.min(turned, Math.PI * 2))
    },
  }
})

// ----------------------------------------- 7 · la porte et les interrupteurs

section('porte', ['#FFEEF1', '#F6C8D1'], (root, sec) => {
  const mw = makeMicrowave(root)
  mw.cover.visible = false
  mw.gridMat.opacity = 1
  const tOpen = W('17', 'ouvre')
  const tClose = W('17', 'alors') - 0.2
  const tSw = W('17', 'interrupteurs') - 0.1
  const tOpen2 = W('17', 'souvre')
  const tStop = W('17', 'sarrete') - 0.05
  label('EN PLEINE MARCHE ?', 'pill red', { t0: W('17', 'marche') - 0.1, t1: tClose + 0.2, x: 540, y: 360, rot: -3 })
  label('INTERRUPTEURS', 'pill', { t0: tSw, t1: sec.t1, x: 540, y: 360, wobble: 1.2 })
  label('STOP', 'stamp', { t0: tStop, t1: sec.t1, x: 540, y: 560, rot: -9, dur: 0.3 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [5.5, 5.2, 18.5], look: [0.3, 1.6, 0] },
        { t: tSw - 0.3, dur: 1.2, pos: [7.0, 4.4, 12.5], look: [1.0, 1.5, 1.4] },
        { t: tStop, dur: 0.8, pos: [6.0, 4.8, 15.5], look: [0.5, 1.6, 0.8] },
      ]),
    update(t) {
      pop(mw.g, t, sec.t0 + 0.05, Infinity, 1, 0.5)
      // Ouverte, refermée, puis rouverte : la seconde fois, tout s'arrête.
      const o1 = ease.out3(prog(t, tOpen, 0.5)) * (1 - ease.io3(prog(t, tClose, 0.45)))
      const o2 = ease.out3(prog(t, tOpen2, 0.45))
      mw.doorPivot.rotation.y = -1.25 * Math.max(o1, o2)
      // Vue « rayons X » sur la porte pendant qu'on montre les interrupteurs.
      const xr = prog(t, tSw - 0.1, 0.4) * (1 - prog(t, tOpen2 - 0.2, 0.3))
      mw.frameMat.opacity = 1 - 0.75 * xr
      mw.frameMat.depthWrite = xr < 0.05
      const stopped = t >= tStop
      const running = !stopped
      mw.light.intensity = running ? 8 : 8 * (1 - prog(t, tStop, 0.15))
      mw.inner.emissiveIntensity = running ? 0.25 : 0
      mw.turntable.rotation.y = Math.min(t, tStop) * 0.9
      const remain = Math.max(0, 90 - Math.floor(Math.min(t, tStop) - sec.t0))
      mw.display.set(stopped ? 'STOP' : `${Math.floor(remain / 60)}:${String(remain % 60).padStart(2, '0')}`, stopped ? '#FF6B6B' : '#7CF2C8')
      mw.switches.forEach((s, i) => {
        const glowS = popS(t, tSw + i * 0.12, Infinity, 0.4)
        s.g.scale.setScalar(1 + 0.6 * glowS * (1 + 0.1 * Math.sin(t * 8)))
        s.led.material.color.set(stopped ? '#ef4444' : '#4ade80')
      })
    },
  }
})

// --------------------------------------------- 8 · demi-puissance : marche / arrêt

section('puissance', ['#EAF2FF', '#C5D8F6'], (root, sec) => {
  const mag = makeMagnetron(root)
  mag.g.position.set(0, 1.15, 0)
  mag.g.scale.setScalar(0.95)
  const rings = [0, 1, 2].map(() => makeRing(root))
  // Gros bouton de puissance.
  const knob = group(root, 0, 6.1, 0)
  const k = mesh(new THREE.CylinderGeometry(1.0, 1.05, 0.45, 48), M('#F3F4F6', { metalness: 0.45, roughness: 0.25 }), knob)
  k.rotation.x = Math.PI / 2
  rbox(0.16, 0.6, 0.12, 0.05, M(COL.red), knob).position.set(0, 0.55, 0.28)
  const ticks = group(root, 0, 6.1, -0.05)
  for (let i = 0; i <= 8; i++) {
    const a = lerp(-2.2, 2.2, i / 8)
    const tk = rbox(0.06, 0.22, 0.05, 0.02, M(COL.ink), ticks)
    tk.position.set(Math.sin(a) * 1.35, Math.cos(a) * 1.35, 0)
    tk.rotation.z = -a
  }

  const tHalf = W('18', 'moitie') - 0.1
  const tFull = C.pw.full
  const tOn = C.pw.on
  const isOn = C.powerOn
  label('50 %', 'big white', { t0: tHalf + 0.25, t1: sec.t1, anchor: knob, offset: [0, -250], dur: 0.4 })
  label('TOUJOURS À FOND', 'pill red', { t0: tFull, t1: tOn - 0.1, x: 540, y: 1150, rot: -3 })
  const onOff = label('MARCHE', 'pill yellow', { t0: tOn, t1: sec.t1, x: 540, y: 1150, dur: 0.3 })
  onOff.update = (t) => {
    const on = isOn(t)
    onOff.el.textContent = on ? 'MARCHE' : 'ARRÊT'
    onOff.el.className = `tag pill ${on ? 'yellow' : ''}`
  }

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [0, 5.0, 19.0], look: [0, 3.5, 0] },
        { t: tOn, dur: 1.6, pos: [0.4, 4.6, 17.5], look: [0, 3.3, 0] },
      ]),
    update(t) {
      pop(mag.g, t, sec.t0 + 0.05, Infinity, 0.95)
      pop(knob, t, sec.t0 + 0.2, Infinity, 1)
      pop(ticks, t, sec.t0 + 0.3, Infinity, 1)
      knob.rotation.z = lerp(-2.2, 0, ease.back(1.5)(prog(t, tHalf, 0.6)))
      mag.g.rotation.y = 0.5 + t * 0.25
      const on = isOn(t)
      mag.core.emissiveIntensity = on ? 1.1 + 0.15 * Math.sin(t * 30) : 0
      rings.forEach((r, i) => {
        const age = (t - i * 0.4) % 1.2
        const p = age / 1.2
        r.visible = on
        r.position.set(0, 3.0 + p * 0.6, 0)
        r.rotation.x = Math.PI / 2
        r.scale.setScalar(0.4 + p * 3)
        r.material.opacity = (1 - p) * 0.9
      })
    },
  }
})

// ------------------------------------------------------- 9 · félicitations

section('bravo', ['#FFF7D6', '#FBD98A'], (root, sec) => {
  const mw = makeMicrowave(root)
  mw.cover.visible = false
  mw.gridMat.opacity = 1
  mw.g.position.set(-1.0, 0, 0)
  const buddy = makeBuddy(root)
  buddy.g.position.set(3.6, 0, 0.6)
  buddy.g.rotation.y = -0.5
  buddy.g.scale.setScalar(0.85)
  // Confettis : trajectoires balistiques reproductibles.
  const rand = rng(99)
  const colors = ['#EF4B3F', '#3B82F6', '#FFC83D', '#22C55E', '#A855F7', '#F97316']
  const confetti = []
  for (let i = 0; i < 90; i++) {
    const m = mesh(new THREE.BoxGeometry(0.16, 0.04, 0.26), M(colors[i % colors.length], { roughness: 0.6, side: THREE.DoubleSide }), root)
    m.castShadow = false
    m.v = new THREE.Vector3((rand() - 0.5) * 9, 7 + rand() * 6, (rand() - 0.5) * 4)
    m.o = new THREE.Vector3((rand() - 0.5) * 2, 2.5, 1.5)
    m.spin = new THREE.Vector3(rand() * 9, rand() * 9, rand() * 9)
    confetti.push(m)
  }
  const tBravo = W('19', 'felicitations') - 0.1
  label('FÉLICITATIONS', 'big white', { t0: tBravo, t1: Infinity, x: 540, y: 360, dur: 0.5, wobble: 2 }).el.style.fontSize = '118px'
  label('tu as construit un micro-ondes', 'pill yellow', { t0: W('19', 'construit') - 0.1, t1: Infinity, x: 540, y: 500 })
  label('DING !', 'pill red', { t0: C.ding, t1: Infinity, anchor: new THREE.Vector3(1.0, 3.6, 1.8), offset: [40, -60], rot: 8, dur: 0.35 })

  return {
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [2.6, 6.8, 26.5], look: [0.3, 2.4, 0] },
        { t: tBravo + 0.4, dur: 2.5, pos: [-1.2, 6.0, 25.0], look: [0.3, 2.4, 0] },
      ]),
    update(t) {
      pop(mw.g, t, sec.t0 + 0.05, Infinity, 1, 0.5)
      pop(buddy.g, t, sec.t0 + 0.25, Infinity, 0.85)
      const cooking = t < C.ding
      mw.light.intensity = cooking ? 8 : 3
      mw.inner.emissiveIntensity = cooking ? 0.25 : 0.05
      mw.turntable.rotation.y = Math.min(t, C.ding) * 0.9
      const remain = Math.max(0, Math.ceil(C.ding - t))
      mw.display.set(cooking ? `0:${String(remain).padStart(2, '0')}` : 'FIN')
      const cheer = prog(t, tBravo - 0.1, 0.35, ease.back(2))
      const jump = Math.max(0, Math.sin((t - tBravo) * 7)) * 0.35 * prog(t, tBravo, 0.2)
      buddy.pose({ lean: -0.1 * cheer, nod: -0.25 * cheer, aL: [0.2 + 2.3 * cheer, 0, 0.3 * cheer], aR: [0.2 + 2.3 * cheer, 0, 0.3 * cheer], bounce: jump })
      buddy.g.position.y = jump * 0.6
      confetti.forEach((m) => {
        const dt = t - tBravo
        m.visible = dt > 0
        if (!m.visible) return
        const g = 9.0
        const drag = 1 - Math.exp(-dt * 1.4)
        m.position.set(m.o.x + (m.v.x * drag) / 1.4, Math.max(0.05, m.o.y + (m.v.y * drag) / 1.4 - 0.5 * g * dt * dt * 0.45), m.o.z + (m.v.z * drag) / 1.4)
        m.rotation.set(m.spin.x * dt, m.spin.y * dt, m.spin.z * dt)
      })
    },
  }
})

// ========================================================= sous-titres

const capsEl = $('#captions')
const CHUNKS = []
for (const line of C.lines) {
  let cur = null
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 4 || /[,.:;?!…]$/.test(line.words[i - 1]?.w ?? '')) {
      cur = { words: [] }
      CHUNKS.push(cur)
    }
    cur.words.push({ ...w })
  })
  const end = line.start + line.dur + 0.15
  const chunks = CHUNKS.slice(CHUNKS.length - CHUNKS.filter((c) => c.words[0].t >= line.start).length)
  chunks.forEach((c, i) => {
    c.t0 = c.words[0].t - 0.05
    c.t1 = i < chunks.length - 1 ? chunks[i + 1].words[0].t - 0.05 : end
  })
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
      const s = t < w.t - 0.04 ? 0 : ease.back(2.2)(prog(t, w.t - 0.04, 0.16))
      w.el.style.opacity = s > 0 ? '1' : '0'
      w.el.style.transform = `scale(${(0.55 + 0.45 * s).toFixed(3)})`
      w.el.classList.toggle('on', t >= w.t - 0.04 && t < w.next - 0.04)
    }
  }
}

// ========================================================= transitions

const wipesEl = $('#wipes')
const CUTS = [...C.sections.slice(1).map((s) => s.t0), C.macro]
const WIPES = CUTS.map((cut, i) => {
  const colors = ['#FFC83D', '#1F2430']
  const els = colors.map((col) => {
    const el = document.createElement('div')
    el.className = 'wipe'
    el.style.background = col
    wipesEl.append(el)
    return el
  })
  return { cut, els, dir: i % 2 ? 1 : -1 }
})

function updateWipes(t) {
  for (const w of WIPES) {
    w.els.forEach((el, k) => {
      // Volet qui entre (0,22 s), couvre l'image au moment de la coupe, puis sort.
      const lag = k === 0 ? -0.05 : 0
      const local = t - w.cut - lag
      let y
      if (local < -0.24 || local > 0.3) {
        el.style.visibility = 'hidden'
        return
      }
      if (local < 0) y = lerp(2500, 0, ease.out3(clamp((local + 0.24) / 0.24)))
      else y = lerp(0, -2600, ease.in3(clamp(local / 0.3)))
      el.style.visibility = ''
      el.style.transform = `translateY(${(y * w.dir).toFixed(1)}px) skewY(${(8 * w.dir).toFixed(1)}deg)`
    })
  }
}

// ======================================================== image de l'instant t

const bgEl = $('#bg')
function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  const sec = SECTIONS.find((s) => t >= s.t0 && t < s.t1) ?? SECTIONS.at(-1)
  for (const s of SECTIONS) s.root.visible = s === sec
  bgEl.style.setProperty('--bg1', sec.bg[0])
  bgEl.style.setProperty('--bg2', sec.bg[1])
  sec.cam(t)
  scene.updateMatrixWorld()
  sec.update(t)
  scene.updateMatrixWorld()
  updateLabels(t)
  updateCaptions(t)
  updateWipes(t)
  renderer.render(scene, camera)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  measureLabels()
  // Compile les shaders de toutes les sections une fois (premières images plus rapides).
  for (const s of SECTIONS) s.root.visible = true
  renderer.compile(scene, camera)
  seek(0)
})()

window.__promo = { ready, seek, duration: DURATION, fps: FPS }

if (!new URLSearchParams(location.search).has('render')) {
  document.body.classList.add('preview')
  ready.then(() => {
    const scrub = $('#scrub')
    const clock = $('#clock')
    const play = $('#play')
    scrub.max = String(DURATION)
    const audio = new Audio('../build/micro-ondes/audio.wav')
    let playing = false
    const show = (t) => {
      seek(t)
      scrub.value = String(t)
      clock.textContent = `${t.toFixed(2).replace('.', ',')} s`
    }
    scrub.addEventListener('input', () => {
      audio.currentTime = Number(scrub.value)
      show(Number(scrub.value))
    })
    play.addEventListener('click', () => {
      playing = !playing
      play.textContent = playing ? 'Pause' : 'Lecture'
      if (playing) {
        audio.currentTime = Number(scrub.value)
        audio.play().catch(() => {})
        const loop = () => {
          if (!playing) return
          show(audio.currentTime)
          requestAnimationFrame(loop)
        }
        loop()
      } else audio.pause()
    })
  })
}
