/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°5 : l'adresse (≈ 1 min 30, 1080 × 1920)
 * ============================================================================
 *  1. L'accroche : Sarah donne une adresse à un ami ; le soir même, il agresse
 *     une femme ; c'est Sarah qui doit s'expliquer.
 *  2. Les faits : l'appartement, 11 mois sans loyer, la voiture où il dort, la
 *     locataire partie sans laisser d'adresse.
 *  3. Le procès : l'enseignante et le cahier de liaison, 15 ans d'amitié, le
 *     message « je vais régler ça moi-même », l'hôpital, phrases-chocs.
 *  4. Le vote, puis l'appel à s'abonner : le verdict tombe dans la vidéo
 *     suivante.
 *
 *  Même moteur que les affaires précédentes : tout est une fonction du temps,
 *  window.__promo.seek(t) affiche l'image de l'instant t. Les instants viennent
 *  des voix (timeline.json, voir voix.py) via cues.js.
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

const scene = new THREE.Scene()
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = 0.35

const camera = new THREE.PerspectiveCamera(34, WIDTH / HEIGHT, 0.1, 300)

const hemi = new THREE.HemisphereLight(0xfff1e0, 0x2a1a10, 0.8)
scene.add(hemi)
const key = new THREE.DirectionalLight(0xffe2c0, 1.6)
key.position.set(5, 12, 8)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -8, near: 1, far: 50 })
key.shadow.bias = -0.0005
key.shadow.normalBias = 0.03
scene.add(key)
// Projecteur sur la personne qui parle.
const spot = new THREE.SpotLight(0xffe7c2, 0, 30, 0.26, 0.7, 1.2)
scene.add(spot)
scene.add(spot.target)

// ------------------------------------------------------------ fabrication

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, ...o })
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

/** Texture dessinée sur un canvas, redessinée seulement quand la clé change. */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  let last = null
  return {
    tex,
    set(key, ...args) {
      if (key === last) return
      last = key
      g.clearRect(0, 0, w, h)
      draw(g, w, h, key, ...args)
      tex.needsUpdate = true
    },
  }
}

const back = ease.back(1.8)
function popS(t, t0, t1 = Infinity, dur = 0.5) {
  const a = t < t0 ? 0 : back(clamp((t - t0) / dur))
  const b = t1 === Infinity ? 1 : 1 - ease.in3(clamp((t - t1) / 0.3))
  return Math.max(0, a * b)
}
function pop(obj, t, t0, t1 = Infinity, base = 1, dur = 0.5) {
  const s = popS(t, t0, t1, dur)
  obj.visible = s > 0.002
  obj.scale.setScalar(Math.max(1e-4, s * base))
  return s
}

/** Caméra : à l'instant de chaque clé, elle glisse depuis la clé précédente (pendant `dur`). */
function camAt(t, keys, drift = 0.08) {
  let i = 0
  while (i < keys.length - 1 && t >= keys[i + 1].t) i++
  const cur = keys[i]
  const prev = keys[Math.max(0, i - 1)]
  const p = i === 0 ? 1 : ease.io3(clamp((t - cur.t) / (cur.dur ?? 0.8)))
  const pos = cur.pos.map((v, k) => lerp(prev.pos[k], v, p))
  const look = cur.look.map((v, k) => lerp(prev.look[k], v, p))
  // Lente poussée vers l'avant pendant chaque plan, et légère respiration.
  const push = (cur.push ?? 0.06) * Math.max(0, t - cur.t)
  const dir = new THREE.Vector3(look[0] - pos[0], look[1] - pos[1], look[2] - pos[2]).normalize()
  camera.position.set(pos[0] + dir.x * push + Math.sin(t * 0.45) * drift, pos[1] + dir.y * push + Math.sin(t * 0.33 + 1) * drift * 0.5, pos[2] + dir.z * push)
  camera.lookAt(look[0], look[1], look[2])
  camera.updateMatrixWorld()
}

// ============================================================ modèles

const COL = {
  ink: '#1F2430',
  wood: '#E7C397',
  woodDark: '#5B3A26',
  woodMid: '#7A4F33',
  red: '#B3261E',
  black: '#1B1D22',
}

/**
 * Mannequin en bois articulé, avec robe (juge, procureur, avocate) ou
 * cheveux (Paul, Anne) en option.
 */
function makeBuddy(parent, { robe = null, suit = null, jabot = false, hair = null, bun = false, skin = COL.wood, sash = false, shadows = true } = {}) {
  const wood = M(skin, { roughness: 0.62 })
  const sleeve = robe || suit ? M(robe || suit, { roughness: 0.7 }) : wood
  const g = group(parent)
  const hips = group(g, 0, 1.6, 0)
  const torso = group(hips)
  mesh(new THREE.CapsuleGeometry(0.44, 0.7, 8, 20), robe || suit ? sleeve : wood, torso).position.y = 0.68
  const head = group(torso, 0, 1.55, 0)
  mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.25, 16), wood, head).position.y = -0.05
  mesh(new THREE.SphereGeometry(0.43, 32, 24), wood, head).position.y = 0.36
  if (hair) {
    const h = mesh(new THREE.SphereGeometry(0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42), M(hair, { roughness: 0.9 }), head)
    h.position.y = 0.38
    h.rotation.x = -0.25
    if (bun) mesh(new THREE.SphereGeometry(0.17, 16, 12), M(hair, { roughness: 0.9 }), head).position.set(0, 0.62, -0.36)
  }
  const limb = (p, x, y, l1, l2, r, mat) => {
    const root = group(p, x, y, 0)
    mesh(new THREE.SphereGeometry(r * 1.15, 16, 12), mat, root)
    mesh(new THREE.CapsuleGeometry(r * (mat === wood ? 1 : 1.25), l1 - 2 * r, 6, 14), mat, root).position.y = -l1 / 2
    const mid = group(root, 0, -l1, 0)
    mesh(new THREE.SphereGeometry(r * 1.1, 16, 12), mat, mid)
    mesh(new THREE.CapsuleGeometry(r * (mat === wood ? 0.92 : 1.2), l2 - 2 * r, 6, 14), mat, mid).position.y = -l2 / 2
    mesh(new THREE.SphereGeometry(r * 1.35, 16, 12), wood, mid).position.y = -l2
    return { root, mid }
  }
  const armL = limb(torso, 0.58, 1.18, 0.62, 0.6, 0.12, sleeve)
  const armR = limb(torso, -0.58, 1.18, 0.62, 0.6, 0.12, sleeve)
  const legL = limb(hips, 0.22, 0.02, 0.8, 0.78, 0.15, wood)
  const legR = limb(hips, -0.22, 0.02, 0.8, 0.78, 0.15, wood)
  if (robe) {
    const pts = [[0.2, 3.02], [0.5, 2.9], [0.56, 2.4], [0.6, 1.6], [0.74, 0.5], [0.8, 0.12]].map(([x, y]) => new THREE.Vector2(x, y))
    mesh(new THREE.LatheGeometry(pts, 40), M(robe, { roughness: 0.75, side: THREE.DoubleSide }), g)
    legL.root.visible = legR.root.visible = false
  }
  if (jabot) {
    for (const s of [-1, 1]) {
      const j = rbox(0.13, 0.36, 0.05, 0.03, M('#ffffff', { roughness: 0.5 }), torso)
      j.position.set(s * 0.075, 1.12, 0.45)
      j.rotation.z = s * 0.06
    }
  }
  if (suit) {
    // Col de chemise et cravate.
    rbox(0.34, 0.3, 0.06, 0.03, M('#f4f4f4'), torso).position.set(0, 1.2, 0.43)
    rbox(0.1, 0.5, 0.05, 0.03, M('#9b1c1c'), torso).position.set(0, 1.0, 0.46)
  }
  if (sash) {
    // Écharpe tricolore du maire, en travers du torse.
    ;['#1d4ed8', '#ffffff', '#dc2626'].forEach((c, i) => {
      const b = rbox(0.13, 1.25, 0.06, 0.03, M(c, { roughness: 0.6 }), torso)
      b.position.set(-0.12 + i * 0.12, 0.75, 0.45)
      b.rotation.z = 0.55
    })
  }
  if (!shadows) g.traverse((o) => (o.castShadow = false))
  const pose = ({ lean = 0, twist = 0, nod = 0, turn = 0, tilt = 0, aL = [0.15, 0, 0.1], aR = [0.15, 0, 0.1], bounce = 0 } = {}) => {
    hips.position.y = 1.6 + bounce
    torso.rotation.set(lean, twist, 0)
    head.rotation.set(nod, turn, tilt)
    armL.root.rotation.set(-aL[1], 0, aL[0])
    armL.mid.rotation.set(-aL[2], 0, 0)
    armR.root.rotation.set(-aR[1], 0, -aR[0])
    armR.mid.rotation.set(-aR[2], 0, 0)
  }
  pose()
  return { g, pose, head, torso, armL, armR, legL, legR }
}

/** Geste de parole : la main s'ouvre et bat la mesure pendant que la personne parle. */
function talk(b, t, speaking, { side = 'R', base = {} } = {}) {
  const s = speaking ? 1 : 0
  const beat = Math.sin(t * 5.2) * 0.5 + Math.sin(t * 2.3) * 0.5
  const arm = [0.25 + 0.15 * s, 0.6 + 0.5 * s + 0.12 * beat * s, 1.0 + 0.35 * s + 0.15 * beat * s]
  const rest = [0.15, 0.25, 0.5]
  b.pose({ lean: 0.04, nod: 0.05 * Math.sin(t * 3.1) * s - 0.03, aR: side === 'R' ? arm : rest, aL: side === 'L' ? arm : rest, ...base })
}

// --------------------------------------------------- texte des sprites

function textSprite(text, { bg = '#fff', fg = COL.ink, size = 0.8, font = 150 } = {}) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  g.fillStyle = bg
  g.beginPath()
  g.roundRect(14, 40, 228, 176, 60)
  g.fill()
  g.fillStyle = fg
  g.font = `900 ${font}px "Figtree Variable", sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, 132)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex }))
  s.scale.setScalar(size)
  return s
}

// ===================================================== étiquettes (HTML)

const labelsEl = $('#labels')
const LABELS = []
const tmpV = new THREE.Vector3()

function label(html, cls, { t0, t1, x = 540, y = 400, anchor = null, offset = [0, 0], rot = 0, dur = 0.45, wobble = 0, parent = labelsEl }) {
  const el = document.createElement('div')
  el.className = `tag ${cls}`
  el.innerHTML = html
  parent.append(el)
  const L = { el, t0, t1, x, y, anchor, offset, rot, dur, wobble, w: 0, h: 0 }
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
    const rot = L.rot + (L.wobble ? Math.sin(t * 2.6) * L.wobble : 0) + (1 - Math.min(1, s)) * -6
    L.el.style.transform = `translate(${(x + L.offset[0] - L.w / 2).toFixed(1)}px, ${(y + L.offset[1] - L.h / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`
  }
}

// ================================================================ décors

const SECTIONS = []
/** Décors partagés entre plusieurs sections (tribunal, foule) : construits une fois. */
const SETS = []
function sharedSet() {
  const g = group(scene)
  g.visible = false
  SETS.push(g)
  return g
}
function section(id, bg, build) {
  const sec = SEC[id]
  const root = group(scene)
  root.visible = false
  SECTIONS.push({ sets: [], ...sec, root, bg, ...build(root, sec) })
}

/** Sol et mur de fond (pièces fermées, ambiance sombre). */
function room(root, { floor = '#4a3326', wall = '#6b4a35', w = 30, d = 30, wallZ = -9 } = {}) {
  const f = mesh(new THREE.PlaneGeometry(w, d), M(floor, { roughness: 0.8 }), root)
  f.rotation.x = -Math.PI / 2
  f.castShadow = false
  const wl = mesh(new THREE.PlaneGeometry(w, 16), M(wall, { roughness: 0.85 }), root)
  wl.position.set(0, 8, wallZ)
  wl.castShadow = false
  return { floor: f, wall: wl }
}



// --------------------------------------------------------- les modèles

/** Panneau plat portant une texture dessinée (papier, écran, calendrier). */
function card(parent, w, h, tex, { depth = 0.04, color = '#ffffff', r = 0.03 } = {}) {
  const g = group(parent)
  rbox(w, h, depth, r, M(color, { roughness: 0.7 }), g)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.94, h * 0.94), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }))
  face.position.z = depth / 2 + 0.002
  g.add(face)
  return g
}

const FONT = '"Figtree Variable", sans-serif'

/** Le papier avec l'adresse (post-it jaune, écrit à la main). */
function makeNote(parent) {
  const tex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#ffe36e'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#1f2a6b'
    c.textAlign = 'center'
    c.font = `800 64px ${FONT}`
    c.fillText('Mme Morel', w / 2, 170)
    c.font = `700 56px ${FONT}`
    c.fillText('8, rue des Lilas', w / 2, 270)
    c.fillText('3e étage', w / 2, 360)
    c.strokeStyle = '#1f2a6b'
    c.lineWidth = 8
    c.beginPath()
    c.moveTo(120, 410)
    c.quadraticCurveTo(256, 450, 392, 405)
    c.stroke()
  })
  tex.set('note')
  return card(parent, 1.1, 1.1, tex.tex, { depth: 0.02, color: '#ffe36e', r: 0.01 })
}

/** Le cahier de liaison de l'école (preuve). */
function makeNotebook(parent) {
  const tex = canvasTex(400, 512, (c, w, h) => {
    c.fillStyle = '#2f7dd1'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#ffffff'
    c.fillRect(40, 120, w - 80, 170)
    c.fillStyle = '#1f2430'
    c.textAlign = 'center'
    c.font = `900 50px ${FONT}`
    c.fillText('CAHIER DE', w / 2, 190)
    c.fillText('LIAISON', w / 2, 255)
    c.fillStyle = '#ffffff'
    c.font = `800 40px ${FONT}`
    c.fillText('Lucas · CE2', w / 2, 400)
  })
  tex.set('cahier')
  return card(parent, 0.9, 1.15, tex.tex, { depth: 0.08, color: '#2f7dd1' })
}

/** Téléphone : le message de l'ami. */
function makePhone(parent) {
  const tex = canvasTex(360, 720, (c, w, h) => {
    c.fillStyle = '#10131a'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#e9edf5'
    c.font = `800 30px ${FONT}`
    c.textAlign = 'center'
    c.fillText('Marc', w / 2, 80)
    c.fillStyle = '#2b3040'
    c.beginPath()
    c.roundRect(30, 200, 300, 250, 30)
    c.fill()
    c.fillStyle = '#ffffff'
    c.textAlign = 'left'
    c.font = `700 30px ${FONT}`
    ;['Puisque personne', 'ne fait rien, je', 'vais régler ça', 'moi-même.'].forEach((l, i) => c.fillText(l, 55, 255 + i * 46))
    c.fillStyle = '#3b82f6'
    c.beginPath()
    c.roundRect(150, 500, 180, 70, 30)
    c.fill()
    c.fillStyle = '#fff'
    c.fillText('Adresse ?', 170, 545)
  })
  tex.set('sms')
  const g = card(parent, 0.75, 1.5, tex.tex, { depth: 0.08, color: '#1b1d22', r: 0.08 })
  return g
}

/** Maison de poupée (preuve : « le domicile d'une mère et de son enfant »). */
function makeHouse(parent, { scale = 1 } = {}) {
  const g = group(parent)
  rbox(1.2, 0.9, 0.9, 0.05, M('#f1e3c8'), g).position.y = 0.45
  const roof = mesh(new THREE.ConeGeometry(0.95, 0.6, 4), M('#b3261e'), g)
  roof.position.y = 1.2
  roof.rotation.y = Math.PI / 4
  rbox(0.26, 0.42, 0.04, 0.02, M('#5b3a26'), g).position.set(0, 0.21, 0.46)
  for (const x of [-0.36, 0.36]) rbox(0.22, 0.22, 0.04, 0.02, glow('#ffd27a'), g).position.set(x, 0.6, 0.46)
  g.scale.setScalar(scale)
  return g
}

/** Calendrier : le nombre de mois sans loyer. */
function makeCalendar(parent) {
  const tex = canvasTex(400, 460, (c, w, h, n) => {
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#b3261e'
    c.fillRect(0, 0, w, 110)
    c.fillStyle = '#ffffff'
    c.textAlign = 'center'
    c.font = `900 60px ${FONT}`
    c.fillText('LOYER', w / 2, 78)
    c.fillStyle = '#1f2430'
    c.font = `900 200px ${FONT}`
    c.fillText(String(n), w / 2, 330)
    c.font = `800 46px ${FONT}`
    c.fillText(n > 1 ? 'MOIS IMPAYÉS' : 'MOIS IMPAYÉ', w / 2, 420)
  })
  tex.set(0, 0)
  const g = card(parent, 1.4, 1.6, tex.tex, { depth: 0.06 })
  return { g, set: (n) => tex.set(n, n) }
}

/** Voiture (le propriétaire y dort). */
function makeCar(parent, { color = '#4f6d8f' } = {}) {
  const g = group(parent)
  const paint = M(color, { roughness: 0.35, metalness: 0.3 })
  rbox(4.2, 0.9, 1.9, 0.3, paint, g).position.y = 0.75
  // Habitacle : toit et montants, vitres transparentes (on voit l'intérieur).
  rbox(2.4, 0.14, 1.75, 0.07, paint, g).position.set(-0.2, 1.93, 0)
  for (const x of [-1.35, 0.95]) for (const z of [-0.82, 0.82]) rbox(0.12, 0.75, 0.1, 0.04, paint, g).position.set(x, 1.55, z)
  rbox(1.6, 0.5, 0.2, 0.08, M('#2a2f3a'), g).position.set(-0.6, 1.35, 0.45)
  const glass = M('#9fc2dd', { transparent: true, opacity: 0.35, roughness: 0.05 })
  for (const z of [-0.88, 0.88]) {
    const w = mesh(new THREE.BoxGeometry(2.1, 0.6, 0.02), glass, g)
    w.position.set(-0.2, 1.58, z)
    w.castShadow = false
  }
  for (const x of [-1.42, 1.02]) {
    const w = mesh(new THREE.BoxGeometry(0.02, 0.6, 1.5), glass, g)
    w.position.set(x, 1.58, 0)
    w.castShadow = false
  }
  const tyre = M('#1b1d22', { roughness: 0.8 })
  for (const x of [-1.35, 1.35]) {
    for (const z of [-0.95, 0.95]) {
      const w = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 24), tyre, g)
      w.rotation.x = Math.PI / 2
      w.position.set(x, 0.42, z)
    }
  }
  for (const z of [-0.6, 0.6]) rbox(0.06, 0.18, 0.35, 0.03, glow('#fff3c4'), g).position.set(2.1, 0.85, z)
  return g
}

/** Petit carton de déménagement. */
function makeBox(parent, x, z, s = 1) {
  const b = rbox(0.8 * s, 0.6 * s, 0.6 * s, 0.03, M('#c9a46a', { roughness: 0.9 }), parent)
  b.position.set(x, 0.3 * s, z)
  rbox(0.82 * s, 0.05, 0.12, 0.01, M('#e8d9a8'), parent).position.set(x, 0.6 * s + 0.01, z)
  return b
}

/** La rue la nuit : façade, porte, fenêtre allumée, réverbère, gyrophares. */
function makeNightStreet(parent) {
  const g = group(parent)
  const ground = mesh(new THREE.PlaneGeometry(60, 40), M('#2b2f3a', { roughness: 0.95 }), g)
  ground.rotation.x = -Math.PI / 2
  ground.castShadow = false
  rbox(30, 0.2, 3, 0.05, M('#4a4f5c'), g).position.set(0, 0.1, -3.5)
  const house = group(g, 0, 0, -6)
  rbox(12, 7, 1, 0.06, M('#5a5f73', { roughness: 0.9 }), house).position.y = 3.5
  rbox(1.4, 2.4, 0.1, 0.04, M('#3a2a20'), house).position.set(0.6, 1.2, 0.52)
  for (const [x, y] of [[-3, 2.2], [-3, 5], [3.2, 2.2], [3.2, 5], [0.6, 5]]) rbox(1.4, 1.2, 0.08, 0.04, glow(y > 4 && x > 0 ? '#ffd27a' : '#1d2433'), house).position.set(x, y, 0.53)
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.2, 12), M('#22252e'), g)
  pole.position.set(-2.4, 2.6, -3.0)
  const lamp = mesh(new THREE.SphereGeometry(0.26, 16, 12), glow('#ffe0a0'), g)
  lamp.position.set(-2.4, 5.25, -3.0)
  const lampLight = new THREE.PointLight(0xffcf8a, 18, 12, 1.4)
  lampLight.position.set(-2.4, 5.0, -2.6)
  g.add(lampLight)
  const red = new THREE.PointLight(0xff2a2a, 0, 14, 1.2)
  red.position.set(4.5, 1.5, 2)
  const blue = new THREE.PointLight(0x2a6bff, 0, 14, 1.2)
  blue.position.set(5.5, 1.5, 1)
  g.add(red, blue)
  return { g, red, blue }
}

function makeCourt(root) {
  room(root, { floor: '#3a271c', wall: '#6b4630', wallZ: -9.2 })
  const wood = M(COL.woodMid, { roughness: 0.55 })
  const dark = M(COL.woodDark, { roughness: 0.55 })
  // Lambris.
  for (let i = -6; i <= 6; i++) rbox(0.18, 5.5, 0.2, 0.05, dark, root).position.set(i * 1.8, 2.75, -9.0)
  rbox(22, 0.3, 0.35, 0.08, dark, root).position.set(0, 5.6, -9.0)
  // Emblème : la balance de la justice, sur un disque doré.
  const emblem = group(root, 0, 7.2, -8.95)
  const gold = M('#c9a14a', { metalness: 0.85, roughness: 0.3 })
  const disc = mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.12, 48), gold, emblem)
  disc.rotation.x = Math.PI / 2
  const ink = M('#3a2a1a', { metalness: 0.4 })
  rbox(0.08, 1.4, 0.05, 0.02, ink, emblem).position.set(0, 0, 0.1)
  rbox(1.6, 0.08, 0.05, 0.02, ink, emblem).position.set(0, 0.55, 0.1)
  for (const s of [-1, 1]) {
    const pan = mesh(new THREE.CylinderGeometry(0.28, 0.12, 0.12, 24), ink, emblem)
    pan.position.set(s * 0.7, 0.05, 0.12)
  }
  // Estrade et bureau du juge.
  rbox(9, 1.2, 3.0, 0.08, wood, root).position.set(0, 0.6, -7.2)
  const bench = rbox(8.6, 1.6, 0.4, 0.08, dark, root)
  bench.position.set(0, 2.0, -5.9)
  rbox(8.8, 0.15, 1.2, 0.05, wood, root).position.set(0, 2.85, -6.3)
  // Tables du procureur (à gauche) et de la défense (à droite).
  const desks = {}
  for (const [name, x, r] of [['procureur', -4.6, 0.35], ['avocate', 4.6, -0.35]]) {
    const d = group(root, x, 0, -1.3)
    d.rotation.y = r
    rbox(3.0, 1.2, 1.3, 0.06, dark, d).position.y = 0.6
    rbox(3.2, 0.12, 1.5, 0.04, wood, d).position.y = 1.26
    // Dossiers sur la table.
    rbox(0.8, 0.12, 0.6, 0.03, M('#e9e3d6'), d).position.set(-0.6, 1.38, 0)
    rbox(0.7, 0.08, 0.5, 0.03, M('#c9b48a'), d).position.set(0.5, 1.36, 0.1)
    desks[name] = d
  }
  // Box de l'accusé (vitré), derrière la défense.
  const box = group(root, 7.0, 0, -5.2)
  rbox(3.0, 1.2, 2.4, 0.06, dark, box).position.y = 0.6
  const glass = M('#cfe3f0', { transparent: true, opacity: 0.18, roughness: 0.05 })
  for (const [w, d, x, z] of [[3.0, 0.06, 0, 1.2], [0.06, 2.4, -1.5, 0], [0.06, 2.4, 1.5, 0]]) {
    const p = mesh(new THREE.BoxGeometry(w, 1.6, d), glass, box)
    p.position.set(x, 2.0, z)
    p.castShadow = false
  }
  // Bancs du public (au premier plan).
  for (const z of [3.2, 4.8]) {
    for (const x of [-4.5, 4.5]) {
      const b = group(root, x, 0, z)
      rbox(5, 0.15, 0.8, 0.05, dark, b).position.y = 0.8
      rbox(5, 0.9, 0.12, 0.05, dark, b).position.set(0, 1.25, 0.4)
    }
  }
  // Marteau du juge.
  const gavel = group(root, 2.2, 2.95, -6.0)
  const gHead = group(gavel, 0, 0, 0)
  const handle = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 12), wood, gHead)
  handle.rotation.z = Math.PI / 2
  handle.position.x = -0.55
  const hd = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.5, 20), dark, gHead)
  hd.position.set(-1.1, 0, 0)
  const block = mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.1, 24), dark, root)
  block.position.set(1.1, 2.97, -6.0)
  return { desks, box, gavel: gHead, emblem }
}
// --------------------------------------------------- décors partagés

const COURT = sharedSet()
const court = makeCourt(COURT)
const cast = {
  juge: makeBuddy(COURT, { robe: '#a3201a', jabot: true, hair: '#8a8a8a' }),
  procureur: makeBuddy(COURT, { robe: COL.red, jabot: true, hair: '#2b2118' }),
  avocate: makeBuddy(COURT, { robe: COL.black, jabot: true, hair: '#6b3e22', bun: true, skin: '#EFD3AE' }),
  accuse: makeBuddy(COURT, { suit: '#2f7a8a', hair: '#4a2c1a', bun: true, skin: '#EFD3AE' }),
}
cast.juge.g.position.set(0, 1.0, -7.0)
cast.procureur.g.position.set(-5.3, 0, -2.3)
cast.procureur.g.rotation.y = 0.55
cast.avocate.g.position.set(5.3, 0, -2.3)
cast.avocate.g.rotation.y = -0.55
cast.avocate.g.scale.setScalar(0.95)
cast.accuse.g.position.set(7.0, -0.35, -5.4)
cast.accuse.g.rotation.y = -0.5
cast.accuse.g.scale.setScalar(0.9)

/** Le tribunal à l'instant t : gestes de l'orateur, accusée assise, coups de marteau. */
function courtUpdate(t, { nod = 0.3 } = {}) {
  const cur = C.lines.find((l) => t >= l.start && t < l.start + l.dur)
  talk(cast.juge, t, cur?.who === 'juge', { side: 'L' })
  talk(cast.procureur, t, cur?.who === 'procureur', { side: 'R' })
  talk(cast.avocate, t, cur?.who === 'avocate', { side: 'L' })
  const m = cast.accuse
  m.pose({ lean: 0.15, nod: nod + 0.04 * Math.sin(t * 0.9), aL: [0.08, 0.6, 1.25], aR: [0.08, 0.6, 1.25] })
  m.legL.root.rotation.x = m.legR.root.rotation.x = -1.4
  m.legL.mid.rotation.x = m.legR.mid.rotation.x = 1.4
  let strike = 0
  for (const g of C.gavel) strike = Math.max(strike, prog(t, g - 0.25, 0.25, ease.in3) * (1 - prog(t, g + 0.05, 0.35, ease.out3)))
  court.gavel.rotation.z = -0.9 * (1 - strike)
  court.gavel.position.y = 0.25 * (1 - strike)
}

const SHOTS = {
  wide: { pos: [0, 6.6, 17.5], look: [0, 2.6, -3.5] },
  procureur: { pos: [-0.2, 3.6, 4.6], look: [-5.2, 2.7, -2.2] },
  avocate: { pos: [0.2, 3.6, 4.6], look: [5.2, 2.7, -2.2] },
  accuse: { pos: [10.6, 4.0, 2.6], look: [7.0, 2.2, -5.2] },
  accuseClose: { pos: [9.9, 3.6, 0.0], look: [7.0, 2.4, -5.4] },
  gavel: { pos: [3.4, 4.0, -2.6], look: [1.4, 3.0, -6.0] },
}
const spotOn = (who, i = 170) => {
  const tgt = { wide: [0, 2, -3], procureur: [-5.3, 2.5, -2.3], avocate: [5.3, 2.5, -2.3], accuse: [7, 2.2, -5.4], accuseClose: [7, 2.2, -5.4], gavel: [1.5, 3, -6] }[who]
  return { pos: [tgt[0] * 0.6, 11, tgt[2] + 6], target: tgt, i }
}
const DARK = { hemi: 0.12, key: 0.15 }
const COURT_LIGHT = { hemi: 0.22, key: 0.45 }
const NO_SPOT = { pos: [0, 10, 6], target: [0, 1, 0], i: 0 }


// ------------------------------------------------ 1 · l'accroche

const SARAH = { suit: '#2f7a8a', hair: '#4a2c1a', bun: true, skin: '#EFD3AE' }
const MARC = { suit: '#6b5a48', hair: '#2b2118' }

section('adresse', ['#f0dcc0', '#c9a47e'], (root, sec) => {
  room(root, { floor: '#a17a56', wall: '#ead8bd', wallZ: -3 })
  const sarah = makeBuddy(root, SARAH)
  sarah.g.position.set(-1.25, 0, 0)
  sarah.g.rotation.y = 0.9
  sarah.g.scale.setScalar(0.92)
  const marc = makeBuddy(root, MARC)
  marc.g.position.set(1.35, 0, 0)
  marc.g.rotation.y = -0.9
  const note = makeNote(root)
  const tGive = W('01', 'donne') - 0.1
  const tAmi = W('01', 'ami') - 0.1
  label('UNE ADRESSE', 'pill yellow', { t0: W('01', 'adresse') - 0.15, t1: sec.t1, x: 540, y: 380, rot: -2 })
  label('À UN AMI', 'pill', { t0: tAmi, t1: sec.t1, x: 540, y: 500, rot: 2 })
  return {
    light: { hemi: 0.7, key: 1.2 },
    spot: NO_SPOT,
    // Gros plan sur le papier, puis on recule : Sarah le tend à son ami.
    cam: (t) => camAt(t, [
      { t: 0, pos: [0.1, 2.4, 5.4], look: [0.0, 2.0, 0.2], push: 0.2 },
      { t: tAmi - 0.25, pos: [0.3, 3.4, 10.5], look: [0.0, 2.2, 0], dur: 0.8, push: 0.25 },
    ]),
    update(t) {
      const p = ease.io3(prog(t, tGive + 0.3, 1.0))
      sarah.pose({ lean: 0.05, nod: 0.1, aR: [0.2, 1.1 - 0.2 * p, 0.25], aL: [0.15, 0.1, 0.2] })
      marc.pose({ lean: 0.05, nod: 0.12, aL: [0.2, 0.3 + 0.7 * p, 0.35], aR: [0.15, 0.1, 0.2] })
      note.position.set(lerp(-0.2, 0.35, p), 2.15 + 0.04 * Math.sin(t * 2), lerp(0.6, 0.45, p))
      note.rotation.set(-0.15, lerp(0.25, -0.2, p), lerp(0.08, -0.05, p))
    },
  }
})

section('soir', ['#0b1020', '#020308'], (root, sec) => {
  const street = makeNightStreet(root)
  const femme = makeBuddy(root, { suit: '#a04a5a', hair: '#3b2a20', bun: true, skin: '#EFD3AE' })
  femme.g.position.set(0.6, 0, -4.6)
  femme.g.rotation.y = 0.15
  femme.g.scale.setScalar(0.9)
  const tSoir = W('02', 'soir') - 0.15
  const tAgr = W('02', 'agresse') - 0.1
  label('LE SOIR MÊME', 'pill', { t0: tSoir, t1: sec.t1, x: 540, y: 360, rot: -2 })
  label('AGRESSÉE', 'stamp', { t0: tAgr, t1: sec.t1, x: 540, y: 560, rot: -8, dur: 0.25 }).el.style.fontSize = '130px'
  return {
    light: { hemi: 0.18, key: 0.25 },
    spot: { pos: [0.6, 9, 0], target: [0.6, 1.5, -4.6], i: 120 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0.4, 3.4, 8.5], look: [0.4, 2.2, -4.0], push: 0.5 }]),
    update(t) {
      // Gyrophares après l'agression ; on ne montre aucun geste violent.
      const on = t > tAgr ? 1 : 0
      street.red.intensity = on * 30 * (Math.sin(t * 14) > 0 ? 1 : 0.1)
      street.blue.intensity = on * 30 * (Math.sin(t * 14) > 0 ? 0.1 : 1)
      const fall = ease.out3(prog(t, tAgr, 0.5))
      femme.pose({ lean: 0.25 * fall, nod: 0.2 + 0.3 * fall, aR: [0.3, 1.6 * fall, 1.5 * fall], aL: [0.3, 1.6 * fall, 1.5 * fall] })
    },
  }
})

section('box', ['#2a1d16', '#050403'], (root, sec) => {
  label('AUJOURD’HUI', 'pill small', { t0: W('03', 'aujourdhui') - 0.1, t1: sec.t1, x: 540, y: 330 })
  label('C’EST SARAH<br>QUI DOIT S’EXPLIQUER', 'pill red', { t0: W('03', 'sarah') - 0.1, t1: sec.t1, x: 540, y: 470, rot: -2 }).el.style.cssText += 'text-align:center;line-height:1.1'
  return {
    sets: [COURT],
    light: DARK,
    spot: spotOn('accuse', 380),
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [10.6, 4.0, 2.6], look: [7.0, 2.4, -5.2], push: 0.6 }]),
    update(t) {
      courtUpdate(t, { nod: 0.2 })
    },
  }
})

// --------------------------------------------- les faits : le propriétaire

section('appart', ['#cfe0ee', '#eef3f8'], (root, sec) => {
  room(root, { floor: '#b8a28a', wall: '#f1e7d6', wallZ: -3 })
  // La porte de l'appartement loué.
  const door = group(root, -1.2, 0, -2.9)
  rbox(1.5, 3.0, 0.15, 0.04, M('#7a4f33'), door).position.y = 1.5
  mesh(new THREE.SphereGeometry(0.08, 12, 8), M('#d9b04a', { metalness: 0.7, roughness: 0.3 }), door).position.set(0.5, 1.5, 0.12)
  const cal = makeCalendar(root)
  cal.g.position.set(1.0, 2.9, -2.85)
  const marc = makeBuddy(root, MARC)
  marc.g.position.set(-0.3, 0, -0.9)
  marc.g.rotation.y = 0.2
  marc.g.scale.setScalar(0.9)
  const tCount = W('04', 'pendant') - 0.1
  const tLoyer = W('04', 'loyer')
  const n = (t) => clamp(Math.floor(1 + ((t - tCount) / Math.max(0.3, tLoyer - tCount)) * 11), 0, 11)
  label('SON APPARTEMENT', 'pill', { t0: W('04', 'appartement') - 0.2, t1: sec.t1, x: 540, y: 330 })
  const count = label('11 MOIS SANS LOYER', 'pill red', { t0: tCount, t1: sec.t1, x: 540, y: 450, rot: -2 })
  count.update = (t) => {
    const k = n(t)
    count.el.textContent = `${k} MOIS SANS LOYER`
  }
  return {
    light: { hemi: 0.75, key: 1.1 },
    spot: NO_SPOT,
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0.6, 3.4, 11.5], look: [0.3, 2.3, -1.5], push: 0.3 }]),
    update(t) {
      cal.set(Math.max(1, n(t)))
      marc.pose({ lean: 0.08, nod: 0.25 + 0.05 * Math.sin(t * 1.3), aR: [0.15, 0.2, 0.3], aL: [0.15, 0.2, 0.3] })
    },
  }
})

section('voiture', ['#0d1424', '#03050a'], (root, sec) => {
  const street = makeNightStreet(root)
  const car = makeCar(root)
  car.position.set(0.3, 0, -1.2)
  car.rotation.y = -0.25
  // Il dort sur la banquette, allongé.
  const marc = makeBuddy(car, { ...MARC, shadows: false })
  // Assis au volant, siège incliné : on voit sa tête par la vitre.
  marc.g.position.set(-0.45, 0.2, 0.35)
  marc.g.rotation.y = Math.PI / 2
  marc.g.scale.setScalar(0.5)
  marc.pose({ lean: -0.55, nod: -0.25, tilt: 0.3, aL: [0.1, 0.4, 0.6], aR: [0.1, 0.4, 0.6] })
  marc.legL.root.rotation.x = marc.legR.root.rotation.x = -1.3
  marc.legL.mid.rotation.x = marc.legR.mid.rotation.x = 1.1
  const zzz = [0, 1, 2].map((i) => {
    const s = textSprite('z', { bg: 'rgba(0,0,0,0)', fg: '#ffffff', size: 0.5 + i * 0.12 })
    root.add(s)
    return s
  })
  label('ÉTRANGLÉ PAR SON CRÉDIT', 'pill red', { t0: W('05', 'etrangle') - 0.15, t1: sec.t1, x: 540, y: 360, rot: -2 })
  label('IL DORT DANS SA VOITURE', 'pill', { t0: W('05', 'dormir') - 0.1, t1: sec.t1, x: 540, y: 480, rot: 2 })
  return {
    light: { hemi: 0.22, key: 0.3 },
    spot: { pos: [0, 9, 3], target: [0.3, 1.2, -1.2], i: 160 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [3.0, 4.0, 12.0], look: [0.2, 1.6, -1.2], push: 0.4 }]),
    update(t) {
      street.red.intensity = street.blue.intensity = 0
      zzz.forEach((s, i) => {
        const p = (t * 0.5 + i / 3) % 1
        s.position.set(-0.2 + p * 0.8, 2.4 + p * 1.4, -0.9)
        s.material.opacity = Math.sin(Math.PI * p)
      })
    },
  }
})

section('partie', ['#d9d4cc', '#a9a39a'], (root, sec) => {
  room(root, { floor: '#9c8a74', wall: '#e4ddd0', wallZ: -3 })
  // L'appartement vide : la porte grande ouverte, deux cartons oubliés.
  const door = group(root, -1.2, 0, -2.9)
  const leaf = group(door, -0.75, 0, 0)
  rbox(1.5, 3.0, 0.15, 0.04, M('#7a4f33'), leaf).position.set(0.75, 1.5, 0)
  rbox(1.5, 3.0, 0.05, 0.02, glow('#fff4d6'), door).position.set(0, 1.5, -0.1)
  makeBox(root, 1.3, -1.6)
  makeBox(root, 1.9, -1.2, 0.7)
  const q = textSprite('?', { bg: '#b3261e', fg: '#ffffff', size: 1.2 })
  root.add(q)
  label('PARTIE', 'stamp', { t0: W('06', 'partie') - 0.1, t1: sec.t1, x: 540, y: 400, rot: -8, dur: 0.25 }).el.style.fontSize = '130px'
  label('DETTE NON REMBOURSÉE', 'pill red', { t0: W('06', 'dette') - 0.15, t1: sec.t1, x: 540, y: 580, rot: 2 })
  label('AUCUNE ADRESSE', 'pill', { t0: W('06', 'dadresse') - 0.15, t1: sec.t1, x: 540, y: 690, rot: -2 })
  const tQ = W('06', 'dadresse') - 0.1
  return {
    light: { hemi: 0.6, key: 0.9 },
    spot: NO_SPOT,
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0.4, 3.0, 8.5], look: [0.0, 1.8, -1.8], push: 0.35 }]),
    update(t) {
      leaf.rotation.y = -1.25 * ease.out3(prog(t, sec.t0, 0.8)) - 0.1
      const s = popS(t, tQ, Infinity, 0.5)
      q.visible = s > 0.01
      q.scale.setScalar(Math.max(1e-4, 1.2 * s))
      q.position.set(-1.2, 2.0 + 0.08 * Math.sin(t * 2.5), -1.8)
    },
  }
})

// ------------------------------------------------ 2 · le procès

/** Les preuves qui apparaissent devant l'orateur (position calculée à partir du plan). */
function evidence(obj, shot, t0, t1, side, scale = 0.36, dy = 0) {
  const sh = SHOTS[shot]
  const cam = new THREE.Vector3(...sh.pos)
  const look = new THREE.Vector3(...sh.look)
  const dir = look.clone().sub(cam).normalize()
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
  const at = cam.clone().addScaledVector(dir, 4.6).addScaledVector(right, 0.42 * side).add(new THREE.Vector3(0, 0.45 + dy, 0))
  obj.visible = false
  return { obj, t0, t1, at, scale }
}

section('tribunal', ['#3a2a20', '#0e0a08'], (root, sec) => {
  const notebook = makeNotebook(root)
  const phone = makePhone(root)
  const house = makeHouse(root)
  const car = makeCar(root)
  const shows = [
    evidence(notebook, 'procureur', W('07', 'lenseignante') - 0.2, E('08') - 0.05, 1, 0.5),
    evidence(car, 'avocate', W('11', 'voiture') - 0.25, E('11') - 0.05, -1, 0.14, -0.35),
    evidence(phone, 'procureur', W('12', 'message') - 0.25, E('13') - 0.05, 1, 0.42, -0.55),
    evidence(house, 'procureur', W('15', 'domicile') - 0.2, E('15') - 0.05, 1, 0.45, -0.25),
  ]
  const plan = [
    { t: sec.t0, shot: 'gavel', push: 0.06 },
    { t: S('07') - 0.15, shot: 'procureur', dur: 0.45 },
    { t: S('09') - 0.1, shot: 'accuseClose', dur: 0.4 },
    { t: S('10') - 0.15, shot: 'avocate', dur: 0.5 },
    { t: S('12') - 0.15, shot: 'procureur', dur: 0.5 },
    { t: S('14') - 0.15, shot: 'avocate', dur: 0.5 },
    { t: S('15') - 0.15, shot: 'procureur', dur: 0.5 },
    { t: S('16') - 0.05, shot: 'accuseClose', dur: 0.35 },
    { t: S('17') - 0.15, shot: 'avocate', dur: 0.5 },
    { t: S('19') - 0.12, shot: 'procureur', dur: 0.4 },
    { t: S('20') - 0.1, shot: 'avocate', dur: 0.4 },
  ]
  const shotAt = (t) => plan.filter((p) => p.t <= t).at(-1).shot

  label('SON ENSEIGNANTE', 'pill yellow', { t0: W('07', 'lenseignante') - 0.1, t1: E('07') + 0.1, x: 540, y: 400, rot: -2 })
  label('NOUVELLE ADRESSE<br>CONFIÉE À L’ÉCOLE', 'pill', { t0: W('08', 'adresse') - 0.15, t1: E('08'), x: 540, y: 400, rot: 2 }).el.style.cssText += 'text-align:center;line-height:1.1'
  label('PAS AUTORISÉE', 'stamp', { t0: W('09', 'autorisee') - 0.1, t1: E('09'), x: 540, y: 430, rot: -8, dur: 0.25 }).el.style.fontSize = '120px'
  label('15<span class="unit">ANS</span>', 'big white', { t0: W('10', '15') - 0.1, t1: E('10') + 0.1, x: 540, y: 350, dur: 0.35 })
  label('D’AMITIÉ', 'pill blue', { t0: W('10', '15') - 0.05, t1: E('10') + 0.1, x: 540, y: 480, rot: -2 })
  label('SES ÉCONOMIES PERDUES', 'pill', { t0: W('11', 'economies') - 0.15, t1: E('11'), x: 540, y: 380, rot: 2 })
  label('L’AIDER À RÉCUPÉRER SON DÛ', 'pill blue', { t0: W('11', 'laider') - 0.1, t1: E('11'), x: 540, y: 500, rot: -2 })
  const sms = label('« Puisque personne ne fait rien, je vais régler ça moi-même. »', 'sms', { t0: S('13') - 0.05, t1: W('13', 'elle') - 0.1, x: 540, y: 420, dur: 0.35 })
  label('ELLE CONNAISSAIT SA COLÈRE', 'pill red', { t0: W('13', 'colere') - 0.2, t1: E('13'), x: 540, y: 400, rot: -2 })
  label('JAMAIS VIOLENT', 'pill blue', { t0: W('14', 'jamais') - 0.1, t1: E('14'), x: 540, y: 380, rot: 2 })
  label('EN 15 ANS', 'pill small', { t0: W('14', '15') - 0.1, t1: E('14'), x: 540, y: 280 })
  label('RÉCLAMER SON ARGENT', 'pill', { t0: W('14', 'reclamer') - 0.15, t1: E('14'), x: 540, y: 500, rot: -2 })
  label('TRANSMETTRE UN MESSAGE ?', 'pill yellow', { t0: W('15', 'transmettre') - 0.15, t1: W('15', 'elle', 1) - 0.1, x: 540, y: 400, rot: -2 })
  label('UNE MÈRE<br>ET SON ENFANT', 'pill red', { t0: W('15', 'mere') - 0.15, t1: E('15'), x: 540, y: 400, rot: 2 }).el.style.cssText += 'text-align:center;line-height:1.1'
  label('À L’HÔPITAL', 'stamp', { t0: W('16', 'lhopital') - 0.1, t1: E('16') + 0.15, x: 540, y: 440, rot: -8, dur: 0.25 }).el.style.fontSize = '130px'
  label('IL A CHOISI DE FRAPPER', 'pill blue', { t0: W('17', 'choisi') - 0.1, t1: E('17'), x: 540, y: 380, rot: -2 })
  label('AIDER UN AMI ≠ PRÉPARER<br>UNE AGRESSION', 'pill', { t0: W('17', 'aider') - 0.15, t1: E('17'), x: 540, y: 520, rot: 2 }).el.style.cssText += 'text-align:center;line-height:1.1'
  label('Devait-elle prévoir un geste qu’il n’avait jamais eu ?', 'quote blue', { t0: S('18') + 0.05, t1: E('18') + 0.15, x: 540, y: 385, dur: 0.3 }).el.style.fontSize = '72px'
  label('Son amitié lui a fait oublier la confiance d’une mère.', 'quote red', { t0: S('19') + 0.05, t1: E('19') + 0.15, x: 540, y: 385, dur: 0.3 }).el.style.fontSize = '72px'
  label('Ou elle a cru pouvoir lui faire confiance, elle aussi.', 'quote blue', { t0: S('20') + 0.05, t1: E('20') + 0.4, x: 540, y: 385, dur: 0.3 }).el.style.fontSize = '72px'
  void sms

  return {
    sets: [COURT],
    light: COURT_LIGHT,
    spot: (t) => spotOn(shotAt(t), shotAt(t) === 'gavel' ? 120 : 170),
    cam: (t) => camAt(t, plan.map((p) => ({ t: p.t, dur: p.dur, push: p.push ?? 0.1, ...SHOTS[p.shot] }))),
    update(t) {
      courtUpdate(t)
      for (const s of shows) {
        const v = pop(s.obj, t, s.t0, s.t1, s.scale, 0.5)
        if (v <= 0) continue
        s.obj.position.copy(s.at)
        s.obj.position.y += 0.06 * Math.sin(t * 2)
        s.obj.lookAt(camera.position)
        s.obj.rotation.x = 0.15
      }
    },
  }
})

// ------------------------------------------------ 3 · le vote

section('vote', ['#2a1d16', '#070504'], (root, sec) => {
  const tJure = W('22', 'jure') - 0.15
  const tVerdict = W('22', 'verdict') - 0.1
  const tSub = S('23') - 0.05
  label('UN DANGER ÉVIDENT ?', 'vote red', { t0: W('21', 'danger') - 0.15, t1: tJure - 0.2, x: 540, y: 520, rot: -3 }).el.style.fontSize = '70px'
  label('TRAHIE PAR SON AMI ?', 'vote blue', { t0: W('21', 'trahie') - 0.15, t1: tJure - 0.2, x: 540, y: 720, rot: 3 }).el.style.fontSize = '70px'
  label('TU ES LE JURÉ', 'big white', { t0: tJure, t1: Infinity, x: 540, y: 330, dur: 0.5 }).el.style.fontSize = '110px'
  label('COUPABLE', 'vote red', { t0: tVerdict, t1: Infinity, x: 540, y: 540, rot: -3 })
  label('NON COUPABLE', 'vote blue', { t0: tVerdict + 0.25, t1: Infinity, x: 540, y: 730, rot: 3 })
  // L'appel à s'abonner : le verdict tombe dans la prochaine vidéo.
  label('<span class="plus">+</span> ABONNE-TOI', 'subscribe', { t0: tSub, t1: Infinity, x: 540, y: 1180, wobble: 1.5 })
  label('LE VERDICT DANS LA PROCHAINE VIDÉO', 'pill yellow', { t0: W('23', 'verdict') - 0.1, t1: Infinity, x: 540, y: 1330 }).el.style.fontSize = '44px'
  return {
    sets: [COURT],
    light: DARK,
    spot: { pos: [5.5, 11, 1], target: [7, 2.2, -5.4], i: 260 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [11.0, 5.0, 5.5], look: [7.0, 2.4, -5.2], push: 0.12 }]),
    update(t) {
      courtUpdate(t, { nod: lerp(0.35, 0.0, prog(t, sec.t0 + 0.4, 1.4, ease.io3)) })
    },
  }
})


// ===================================================== jauge et orateur (HUD)

const hud = $('#hud')
const meter = document.createElement('div')
meter.className = 'meter'
meter.innerHTML = '<div class="end l">COUPABLE</div><div class="end r">NON COUPABLE</div><div class="bar"></div><div class="needle"></div>'
hud.append(meter)
const needle = meter.querySelector('.needle')
const meterOn = [S('07') + 0.2, E('20') + 0.4]

function balanceAt(t) {
  let v = 0
  let prev = 0
  for (const [t0, target] of C.balance) {
    if (t < t0 + 0.4) break
    const p = ease.back(1.6)(prog(t, t0 + 0.4, 0.7))
    v = lerp(prev, target, p)
    prev = target
  }
  return v
}

const ROLE = { juge: 'LE JUGE', procureur: 'LE PROCUREUR', avocate: 'L’AVOCATE DE LA DÉFENSE' }
for (const l of C.lines.filter((x) => ROLE[x.who])) label(ROLE[l.who], `who ${l.who}`, { t0: l.start - 0.05, t1: l.start + l.dur, x: 540, y: 1250, dur: 0.3, parent: hud })

function updateHud(t) {
  const s = popS(t, meterOn[0], meterOn[1], 0.5)
  meter.style.visibility = s > 0.01 ? '' : 'hidden'
  meter.style.opacity = String(Math.min(1, s))
  meter.style.transform = `translateY(${(-60 * (1 - Math.min(1, s))).toFixed(1)}px)`
  const v = balanceAt(t) + 0.015 * Math.sin(t * 7)
  needle.style.left = `${(((v + 1) / 2) * 100).toFixed(2)}%`
}

// ========================================================= sous-titres

const capsEl = $('#captions')
const CHUNKS = []
for (const line of C.lines) {
  let cur = null
  const mine = []
  line.words.forEach((w, i) => {
    if (!cur || cur.words.length >= 4 || /[,.:;?!…»]$/.test(line.words[i - 1]?.w ?? '')) {
      cur = { words: [] }
      mine.push(cur)
    }
    cur.words.push({ ...w })
  })
  const end = line.start + line.dur + 0.15
  mine.forEach((c, i) => {
    c.t0 = c.words[0].t - 0.05
    c.t1 = i < mine.length - 1 ? mine[i + 1].words[0].t - 0.05 : end
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
      const s = t < w.t - 0.04 ? 0 : ease.back(2.2)(prog(t, w.t - 0.04, 0.16))
      w.el.style.opacity = s > 0 ? '1' : '0'
      w.el.style.transform = `scale(${(0.55 + 0.45 * s).toFixed(3)})`
      w.el.classList.toggle('on', t >= w.t - 0.04 && t < w.next - 0.04)
    }
  }
}

// ========================================================= transitions

const wipesEl = $('#wipes')
const WIPES = C.sections.filter((s) => s.cut === 'wipe').map((s, i) => {
  const els = ['#B3261E', '#0e0a08'].map((col) => {
    const el = document.createElement('div')
    el.className = 'wipe'
    el.style.background = col
    wipesEl.append(el)
    return el
  })
  return { cut: s.t0, els, dir: i % 2 ? 1 : -1 }
})

// Flash blanc (coupes rapides du montage).
const flashEl = document.createElement('div')
flashEl.className = 'layer'
flashEl.style.background = '#fff'
wipesEl.append(flashEl)
const FLASHES = C.sections.filter((s) => s.cut === 'flash').map((s) => s.t0)

function updateWipes(t) {
  let f = 0
  for (const c of FLASHES) if (t >= c && t < c + 0.25) f = Math.max(f, 0.85 * (1 - (t - c) / 0.25) ** 2)
  flashEl.style.opacity = f.toFixed(3)
  flashEl.style.visibility = f > 0.003 ? '' : 'hidden'
  for (const w of WIPES) {
    w.els.forEach((el, k) => {
      const local = t - w.cut - (k === 0 ? -0.05 : 0)
      if (local < -0.24 || local > 0.3) {
        el.style.visibility = 'hidden'
        return
      }
      const y = local < 0 ? lerp(2500, 0, ease.out3(clamp((local + 0.24) / 0.24))) : lerp(0, -2600, ease.in3(clamp(local / 0.3)))
      el.style.visibility = ''
      el.style.transform = `translateY(${(y * w.dir).toFixed(1)}px) skewY(${(8 * w.dir).toFixed(1)}deg)`
    })
  }
}

// ======================================================== image de l'instant t

const bgEl = $('#bg')
const val = (v, t) => (typeof v === 'function' ? v(t) : v)
function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  const sec = SECTIONS.find((s) => t >= s.t0 && t < s.t1) ?? SECTIONS.at(-1)
  for (const s of SECTIONS) s.root.visible = s === sec
  for (const g of SETS) g.visible = sec.sets.includes(g)
  const colors = sec.bgAt?.(t) ?? sec.bg
  bgEl.style.setProperty('--bg1', colors[0])
  bgEl.style.setProperty('--bg2', colors[1])
  const light = val(sec.light, t)
  hemi.intensity = light.hemi
  key.intensity = light.key
  const sp = val(sec.spot, t)
  spot.position.set(...sp.pos)
  spot.target.position.set(...sp.target)
  spot.intensity = sp.i
  sec.cam(t)
  scene.updateMatrixWorld()
  sec.update(t)
  scene.updateMatrixWorld()
  updateLabels(t)
  updateHud(t)
  updateCaptions(t)
  updateWipes(t)
  renderer.render(scene, camera)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  for (const L of LABELS) {
    L.w = L.el.offsetWidth
    L.h = L.el.offsetHeight
  }
  for (const s of SECTIONS) s.root.visible = true
  for (const g of SETS) g.visible = true
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
    const audio = new Audio('../build/affaire-05/audio.wav')
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

