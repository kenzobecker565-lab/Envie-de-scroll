/**
 * ============================================================================
 *  « Le procès : à toi de juger » — le maire Robin des Bois (1080 × 1920)
 * ============================================================================
 *  1. L'accroche : « Cet homme a volé trois millions d'euros d'argent public. »
 *     L'accusé dans le noir, la foule qui le défend, « c'est toi qui décides ».
 *  2. Les faits, en montage rapide : la mairie, la maternité menacée (70 km),
 *     les fausses factures, la peine encourue.
 *  3. Le procès : procureur et avocate se répondent, chaque argument retourne
 *     le précédent (47 factures, 312 bébés, 300 000 € de campagne, 380 000 €
 *     de salaire reversé). Preuves en 3D, jauge « coupable ↔ non coupable ».
 *  4. Le vote : « Tu es le juré. » Coupable ou non coupable ?
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) affiche l'image de
 *  l'instant t (rendu image par image par ../render.mjs). Les instants viennent
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

/** Panneau de manifestant (texte sur un carton, au bout d'un bâton). */
function makeSign(parent, text, color = '#ffffff') {
  const g = group(parent)
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8), M('#8a5a36'), g).position.y = -0.8
  const tex = canvasTex(320, 200, (c, w, h) => {
    c.fillStyle = color
    c.fillRect(0, 0, w, h)
    c.fillStyle = COL.ink
    c.font = '900 52px "Figtree Variable", sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    const words = text.split(' ')
    const half = Math.ceil(words.length / 2)
    const lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : [text]
    lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 60))
  })
  tex.set(text)
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.94, 0.05), [M('#ddd'), M('#ddd'), M('#ddd'), M('#ddd'), new THREE.MeshStandardMaterial({ map: tex.tex, roughness: 0.8 }), M('#ddd')])
  g.add(board)
  return g
}

/** La foule devant la mairie : mannequins qui sautent, panneaux qui s'agitent. */
function makeCrowd(parent) {
  const g = group(parent)
  const rand = rng(21)
  const signs = ['LIBÉREZ DELMAS', 'MERCI MARC', 'SAUVEZ LA MATERNITÉ', '312 BÉBÉS', 'PAS COUPABLE', 'MARC = HÉROS']
  const signColors = ['#ffffff', '#ffd43b', '#ffffff', '#bfe0ff', '#ffffff', '#ffd6d6']
  const people = []
  const tones = ['#E7C397', '#EFD3AE', '#D9AE7E', '#C99A6B']
  const clothes = ['#3b82f6', '#ef4444', '#22a06b', '#f59e0b', '#6b7280', '#a855f7', '#0ea5e9']
  let k = 0
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 7; i++) {
      const b = makeBuddy(g, { skin: tones[(row + i) % 4], suit: clothes[(i * 3 + row) % clothes.length], hair: rand() > 0.4 ? ['#2b2118', '#6b3e22', '#d9d2c5'][i % 3] : null, shadows: false })
      b.g.position.set(-6 + i * 2 + (rand() - 0.5) * 0.6 + (row % 2) * 0.9, 0, 2.5 - row * 2.2 + (rand() - 0.5) * 0.5)
      b.g.rotation.y = (rand() - 0.5) * 0.5
      b.g.scale.setScalar(0.78 + rand() * 0.12)
      const hasSign = (i + row) % 2 === 0
      let sign = null
      if (hasSign) {
        sign = makeSign(b.torso, signs[k % signs.length], signColors[k % signs.length])
        sign.position.set(0.55, 2.8, 0.3)
        k++
      }
      people.push({ b, sign, phase: rand() * 6, speed: 4 + rand() * 2 })
    }
  }
  const update = (t, energy = 1) => {
    for (const p of people) {
      const j = Math.max(0, Math.sin(t * p.speed + p.phase)) * 0.35 * energy
      p.b.g.position.y = j
      p.b.pose({ bounce: 0, nod: -0.1, aL: p.sign ? [0.3, 2.6, 0.3] : [0.4 + 1.6 * energy * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase)), 0.2, 0.3], aR: [0.4 + 1.6 * energy * (0.5 + 0.5 * Math.sin(t * p.speed + p.phase + 1)), 0.2, 0.3] })
      if (p.sign) p.sign.rotation.z = Math.sin(t * p.speed * 0.7 + p.phase) * 0.12
    }
  }
  return { g, update }
}

/** La mairie : façade, colonnes, fronton, drapeau, horloge. */
function makeMairie(parent) {
  const g = group(parent)
  const stone = M('#efe6d6', { roughness: 0.7 })
  const dark = M('#b9ab94', { roughness: 0.7 })
  rbox(11, 6, 1.6, 0.08, stone, g).position.set(0, 3.4, 0)
  for (let i = 0; i < 3; i++) rbox(7 - i * 0.6, 0.2, 1.2 + i * 0.4, 0.04, dark, g).position.set(0, 0.1 + i * 0.2, 1.4 + i * 0.2 - 0.4 * i)
  for (const x of [-3, -1.2, 1.2, 3]) mesh(new THREE.CylinderGeometry(0.28, 0.32, 4.6, 24), M('#fbf6ec', { roughness: 0.6 }), g).position.set(x, 2.9, 1.0)
  rbox(8, 0.35, 1.0, 0.05, dark, g).position.set(0, 5.35, 1.0)
  const ped = mesh(new THREE.CylinderGeometry(2.2, 2.2, 8.4, 3, 1), stone, g)
  ped.rotation.set(0, 0, Math.PI / 2)
  ped.scale.set(0.42, 1, 0.35)
  ped.position.set(0, 6.3, 0.9)
  rbox(1.6, 2.6, 0.2, 0.06, M('#5B3A26'), g).position.set(0, 1.9, 0.95)
  const sign = canvasTex(512, 96, (c, w, h) => {
    c.fillStyle = '#efe6d6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#5b4a32'
    c.font = '900 70px "Figtree Variable", serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('MAIRIE', w / 2, h / 2 + 4)
  })
  sign.set('m')
  const s = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.68), new THREE.MeshStandardMaterial({ map: sign.tex }))
  s.position.set(0, 5.35, 1.51)
  g.add(s)
  // Horloge.
  const clock = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 32), M('#ffffff'), g)
  clock.rotation.x = Math.PI / 2
  clock.position.set(0, 6.45, 1.15)
  // Drapeau tricolore.
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 10), M('#9aa3af', { metalness: 0.6 }), g).position.set(4.6, 7.6, 0.6)
  ;['#1d4ed8', '#ffffff', '#dc2626'].forEach((c, i) => rbox(0.5, 1.0, 0.04, 0.01, M(c), g).position.set(4.9 + i * 0.5, 8.5, 0.6))
  return g
}

/** La maternité : bâtiment, enseigne, fenêtres. */
function makeMaternite(parent) {
  const g = group(parent)
  rbox(7, 4.2, 3, 0.1, M('#fdf2f4', { roughness: 0.7 }), g).position.y = 2.1
  rbox(7.3, 0.3, 3.3, 0.05, M('#e8b4c0'), g).position.y = 4.3
  for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) rbox(1.0, 0.9, 0.08, 0.05, M('#9cc3ff', { roughness: 0.2, metalness: 0.2 }), g).position.set(-2.4 + i * 1.6, 1.4 + r * 1.6, 1.52)
  const sign = canvasTex(512, 110, (c, w, h) => {
    c.fillStyle = '#e8577a'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#ffffff'
    c.font = '900 76px "Figtree Variable", sans-serif'
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('MATERNITÉ', w / 2, h / 2 + 4)
  })
  sign.set('m')
  const s = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), new THREE.MeshBasicMaterial({ map: sign.tex, toneMapped: false }))
  s.position.set(0, 5.0, 1.0)
  g.add(s)
  return g
}

/** Une fausse facture (feuille). */
function makeInvoice(parent, n) {
  const tex = canvasTex(200, 260, (c, w, h) => {
    c.fillStyle = '#fbfaf6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = COL.ink
    c.font = '900 30px "Figtree Variable", sans-serif'
    c.fillText('FACTURE', 16, 42)
    c.font = '600 18px "Figtree Variable", sans-serif'
    c.fillText(`N° 2019-${String(100 + n)}`, 16, 70)
    c.fillStyle = '#c7c2b5'
    for (let i = 0; i < 6; i++) c.fillRect(16, 96 + i * 18, 120 + ((n * 37 + i * 23) % 50), 7)
    c.fillStyle = '#b3261e'
    c.font = '900 30px "Figtree Variable", sans-serif'
    c.fillText(`${(48 + ((n * 13) % 40)).toFixed(0)} 200 €`, 16, 236)
  })
  tex.set(n)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.04), new THREE.MeshStandardMaterial({ map: tex.tex, side: THREE.DoubleSide, roughness: 0.9 }))
  m.castShadow = true
  parent.add(m)
  return m
}

/** Couronne dorée (« c'est un roi »). */
function makeCrown(parent) {
  const g = group(parent)
  const gold = M('#e2b53d', { metalness: 0.85, roughness: 0.25 })
  mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.4, 32, 1, true), M('#e2b53d', { metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide }), g)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const c = mesh(new THREE.ConeGeometry(0.12, 0.42, 12), gold, g)
    c.position.set(Math.cos(a) * 0.6, 0.38, Math.sin(a) * 0.6)
    const gem = mesh(new THREE.SphereGeometry(0.07, 12, 8), M(i % 2 ? '#dc2626' : '#2563eb', { roughness: 0.2 }), g)
    gem.position.set(Math.cos(a) * 0.63, 0.02, Math.sin(a) * 0.63)
  }
  return g
}

/** Affiche de campagne. */
function makePoster(parent) {
  const g = group(parent)
  const tex = canvasTex(300, 420, (c, w, h) => {
    c.fillStyle = '#1d4ed8'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#ffffff'
    c.fillRect(0, h * 0.62, w, h * 0.38)
    c.fillStyle = '#e7c397'
    c.beginPath()
    c.arc(w / 2, h * 0.33, 70, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#1d4ed8'
    c.font = '900 64px "Figtree Variable", sans-serif'
    c.textAlign = 'center'
    c.fillText('DELMAS', w / 2, h * 0.76)
    c.fillStyle = '#dc2626'
    c.font = '900 34px "Figtree Variable", sans-serif'
    c.fillText('RÉÉLECTION', w / 2, h * 0.88)
  })
  tex.set('p')
  rbox(1.5, 2.1, 0.06, 0.03, M('#ffffff'), g)
  const f = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 2.0), new THREE.MeshBasicMaterial({ map: tex.tex, toneMapped: false }))
  f.position.z = 0.035
  g.add(f)
  return g
}

/** Pile de pièces (le salaire reversé). */
function makeCoins(parent) {
  const g = group(parent)
  const gold = M('#e2b53d', { metalness: 0.85, roughness: 0.3 })
  const coins = []
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i < 8; i++) {
      const c = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 24), gold, g)
      c.position.set(-0.55 + s * 0.55, -0.4 + i * 0.075, (s % 2) * 0.1)
      coins.push(c)
    }
  }
  return { g, coins }
}

/** Berceau. */
function makeCrib(parent) {
  const g = group(parent)
  const w = M('#f1e4cf', { roughness: 0.6 })
  rbox(1.5, 0.12, 0.9, 0.04, w, g)
  for (let i = 0; i < 8; i++) for (const z of [-0.42, 0.42]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), w, g).position.set(-0.68 + i * 0.195, 0.4, z)
  for (const z of [-0.42, 0.42]) rbox(1.5, 0.08, 0.08, 0.03, w, g).position.set(0, 0.77, z)
  rbox(1.2, 0.22, 0.7, 0.1, M('#9cc3ff', { roughness: 0.9 }), g).position.y = 0.17
  return g
}

/** La salle d'audience : estrade du juge, tables, box de l'accusé. */
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
  marc: makeBuddy(COURT, { suit: '#26324a', hair: '#4a4038' }),
}
cast.juge.g.position.set(0, 1.0, -7.0)
cast.procureur.g.position.set(-5.3, 0, -2.3)
cast.procureur.g.rotation.y = 0.55
cast.avocate.g.position.set(5.3, 0, -2.3)
cast.avocate.g.rotation.y = -0.55
cast.avocate.g.scale.setScalar(0.95)
cast.marc.g.position.set(7.0, -0.35, -5.4)
cast.marc.g.rotation.y = -0.5

/** Le tribunal à l'instant t : gestes de l'orateur, accusé assis, coups de marteau. */
function courtUpdate(t, { marcNod = 0.35 } = {}) {
  const cur = C.lines.find((l) => t >= l.start && t < l.start + l.dur)
  talk(cast.juge, t, cur?.who === 'juge', { side: 'L' })
  talk(cast.procureur, t, cur?.who === 'procureur', { side: 'R' })
  talk(cast.avocate, t, cur?.who === 'avocate', { side: 'L' })
  const m = cast.marc
  m.pose({ lean: 0.2, nod: marcNod + 0.04 * Math.sin(t * 0.9), aL: [0.08, 0.6, 1.2], aR: [0.08, 0.6, 1.2] })
  m.legL.root.rotation.x = m.legR.root.rotation.x = -1.4
  m.legL.mid.rotation.x = m.legR.mid.rotation.x = 1.4
  let strike = 0
  for (const g of C.gavel) strike = Math.max(strike, prog(t, g - 0.25, 0.25, ease.in3) * (1 - prog(t, g + 0.05, 0.35, ease.out3)))
  court.gavel.rotation.z = -0.9 * (1 - strike)
  court.gavel.position.y = 0.25 * (1 - strike)
}

const FOULE = sharedSet()
const crowd = makeCrowd(FOULE)
const mairieFoule = makeMairie(FOULE)
mairieFoule.position.set(0, 0, -6)
{
  const f = mesh(new THREE.PlaneGeometry(60, 40), M('#8f9298', { roughness: 0.9 }), FOULE)
  f.rotation.x = -Math.PI / 2
  f.castShadow = false
}

const SHOTS = {
  wide: { pos: [0, 6.6, 17.5], look: [0, 2.6, -3.5] },
  juge: { pos: [0.6, 4.4, 2.0], look: [0.3, 3.8, -7.0] },
  procureur: { pos: [-0.2, 3.6, 4.6], look: [-5.2, 2.7, -2.2] },
  avocate: { pos: [0.2, 3.6, 4.6], look: [5.2, 2.7, -2.2] },
  accuse: { pos: [10.6, 4.0, 2.6], look: [7.0, 2.2, -5.2] },
  accuseClose: { pos: [9.9, 3.6, 0.0], look: [7.0, 2.4, -5.4] },
  gavel: { pos: [3.4, 4.0, -2.6], look: [1.4, 3.0, -6.0] },
}
const spotOn = (who, i = 170) => {
  const tgt = { wide: [0, 2, -3], juge: [0, 3.5, -7], procureur: [-5.3, 2.5, -2.3], avocate: [5.3, 2.5, -2.3], accuse: [7, 2.2, -5.4], accuseClose: [7, 2.2, -5.4], gavel: [1.5, 3, -6] }[who]
  return { pos: [tgt[0] * 0.6, 11, tgt[2] + 6], target: tgt, i }
}
const DARK = { hemi: 0.12, key: 0.15 }
const COURT_LIGHT = { hemi: 0.22, key: 0.45 }

// ------------------------------------------------ 1 · l'accroche

section('accuse', ['#2a1d16', '#050403'], (root, sec) => {
  const t3 = W('01', 'trois') - 0.05
  const counter = label('0 €', 'big white', { t0: t3, t1: sec.t1, x: 540, y: 380, dur: 0.3 })
  counter.el.style.fontSize = '112px'
  counter.update = (t) => {
    const n = Math.round(3e6 * ease.out4(prog(t, t3, 0.9)))
    counter.el.textContent = `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} €`
  }
  label('D’ARGENT PUBLIC', 'pill red', { t0: W('01', 'public') - 0.05, t1: sec.t1, x: 540, y: 530, rot: -2 })
  return {
    sets: [COURT],
    light: (t) => ({ hemi: 0.05 + 0.07 * prog(t, 0.2, 1), key: 0.05 }),
    spot: (t) => ({ ...spotOn('accuse'), i: 420 * prog(t, 0.05, 0.6) }),
    cam: (t) => camAt(t, [{ t: 0, pos: [11.2, 4.2, 4.2], look: [7.0, 2.4, -5.4], push: 0.45 }]),
    update(t) {
      courtUpdate(t, { marcNod: lerp(0.5, 0.05, prog(t, 0.6, 1.6, ease.io3)) })
    },
  }
})

section('foule', ['#5a6b80', '#1b2430'], (root, sec) => {
  label('TOUTE SA VILLE LE DÉFEND', 'pill yellow', { t0: sec.t0 + 0.15, t1: sec.t1, x: 540, y: 360, rot: -2 })
  return {
    sets: [FOULE],
    light: { hemi: 0.75, key: 1.3 },
    spot: { pos: [0, 10, 6], target: [0, 1, 0], i: 0 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [-1.0, 4.6, 19.5], look: [0.3, 3.2, -2], push: 0.8 }]),
    update(t) {
      crowd.update(t)
    },
  }
})

section('toi', ['#2a1d16', '#050403'], (root, sec) => {
  label('C’EST TOI QUI DÉCIDES', 'big white', { t0: W('03', 'toi') - 0.1, t1: sec.t1, x: 540, y: 380, dur: 0.4 }).el.style.fontSize = '82px'
  const timer = label('2:00', 'pill red', { t0: W('03', 'deux') - 0.1, t1: sec.t1, x: 540, y: 540 })
  timer.update = (t) => {
    const s = Math.max(0, 120 - Math.floor((t - timer.t0) * 3))
    timer.el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
  return {
    sets: [COURT],
    light: DARK,
    spot: spotOn('accuse', 380),
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [10.6, 4.0, 2.6], look: [7.0, 2.4, -5.2], push: 0.6 }]),
    update(t) {
      courtUpdate(t, { marcNod: 0.05 })
      // Marc lève les yeux vers la caméra.
      cast.marc.head.rotation.y = -0.6
    },
  }
})

// ------------------------------------------------ 2 · les faits, en montage

section('mairie', ['#9cc6ea', '#e9f1f8'], (root, sec) => {
  const mairie = makeMairie(root)
  mairie.position.set(0, 0, -3)
  const f = mesh(new THREE.PlaneGeometry(60, 40), M('#9a9da3', { roughness: 0.9 }), root)
  f.rotation.x = -Math.PI / 2
  const marc = makeBuddy(root, { suit: '#26324a', hair: '#4a4038', sash: true })
  marc.g.position.set(0, 0.6, 0.4)
  const t18 = W('04', 'dix') - 0.1
  label('MARC DELMAS', 'pill', { t0: sec.t0 + 0.1, t1: sec.t1, x: 540, y: 330 })
  const c = label('0 ANS', 'big white', { t0: t18, t1: sec.t1, x: 540, y: 480, dur: 0.3 })
  c.update = (t) => {
    c.el.innerHTML = `${Math.round(18 * ease.out3(prog(t, t18, 0.7)))}<span class="unit">ANS DE MANDAT</span>`
  }
  return {
    light: { hemi: 0.9, key: 1.6 },
    spot: { pos: [0, 10, 6], target: [0, 1, 0], i: 0 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0, 2.6, 9.5], look: [0, 3.0, -1], push: -0.5 }]),
    update(t) {
      pop(marc.g, t, sec.t0, Infinity, 1, 0.4)
      marc.pose({ nod: -0.05, aR: [0.3 + 2.2 * prog(t, sec.t0 + 0.2, 0.5, ease.back(1.6)), 0.1, 0.25], aL: [0.15, 0, 0.1], turn: 0.1 * Math.sin(t) })
    },
  }
})

section('maternite', ['#f6d6de', '#fbeef2'], (root, sec) => {
  const mat = makeMaternite(root)
  mat.position.set(-1.0, 0, -1)
  const f = mesh(new THREE.PlaneGeometry(80, 120), M('#a8c08a', { roughness: 0.95 }), root)
  f.rotation.x = -Math.PI / 2
  // La route, qui file vers l'hôpital suivant, au loin.
  const road = mesh(new THREE.PlaneGeometry(2.4, 80), M('#55595f', { roughness: 0.9 }), root)
  road.rotation.x = -Math.PI / 2
  road.position.set(3.6, 0.01, -38)
  for (let i = 0; i < 26; i++) {
    const d = mesh(new THREE.PlaneGeometry(0.16, 1.2), M('#ffffff'), root)
    d.rotation.x = -Math.PI / 2
    d.position.set(3.6, 0.02, 1 - i * 3)
  }
  const far = makeMaternite(root)
  far.position.set(3.6, 0, -76)
  far.scale.setScalar(1.3)
  const tFerme = W('05', 'fermer') - 0.05
  const tKm = W('05', 'soixante') - 0.1
  label('FERMETURE', 'stamp', { t0: tFerme, t1: tKm - 0.1, x: 540, y: 560, rot: -9, dur: 0.3 })
  label('70<span class="unit">KM</span>', 'big white', { t0: tKm, t1: sec.t1, x: 540, y: 400 })
  label('la plus proche', 'pill small', { t0: tKm + 0.2, t1: sec.t1, x: 540, y: 530 })
  return {
    light: { hemi: 0.85, key: 1.5 },
    spot: { pos: [0, 10, 6], target: [0, 1, 0], i: 0 },
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [-0.4, 4.0, 23.0], look: [-0.4, 2.8, -1] },
        { t: tKm - 0.2, dur: 1.4, pos: [3.6, 4.5, 6.5], look: [3.6, 1.5, -60], push: 0.4 },
      ]),
    update() {},
  }
})

section('factures', ['#efe6d6', '#cfc2a8'], (root, sec) => {
  const m1 = makeMairie(root)
  m1.scale.setScalar(0.32)
  m1.position.set(-2.4, 0, -2)
  const m2 = makeMaternite(root)
  m2.scale.setScalar(0.42)
  m2.position.set(2.4, 0, -2)
  const f = mesh(new THREE.PlaneGeometry(60, 40), M('#d9cdb4', { roughness: 0.9 }), root)
  f.rotation.x = -Math.PI / 2
  const sheets = []
  for (let i = 0; i < 14; i++) sheets.push(makeInvoice(root, i))
  const bills = []
  for (let i = 0; i < 10; i++) bills.push(rbox(0.5, 0.06, 0.26, 0.02, M('#5fae6b', { roughness: 0.6 }), root))
  const t6 = W('06', 'six') - 0.1
  const tFaus = W('06', 'fausses') - 0.1
  label('6<span class="unit">ANS</span>', 'big white', { t0: t6, t1: sec.t1, x: 540, y: 360 })
  label('FAUSSES FACTURES', 'pill red', { t0: tFaus, t1: sec.t1, x: 540, y: 500, rot: 2 })
  return {
    light: { hemi: 0.85, key: 1.5 },
    spot: { pos: [0, 10, 6], target: [0, 1, 0], i: 0 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0, 4.2, 10.5], look: [0, 1.5, -1], push: 0.4 }]),
    update(t) {
      // L'argent part de la mairie vers la maternité, en arc.
      bills.forEach((b, i) => {
        const p = ((t - sec.t0) * 0.8 + i / bills.length) % 1
        b.position.set(lerp(-2.0, 2.0, p), 2.4 + Math.sin(Math.PI * p) * 2.2, -1.2)
        b.rotation.set(t * 3 + i, t * 2, 0)
        b.visible = t > sec.t0 + 0.2
      })
      // Les factures tombent et s'empilent au premier plan.
      sheets.forEach((s, i) => {
        const t0 = tFaus - 0.4 + i * 0.09
        const p = prog(t, t0, 0.45, ease.out3)
        s.visible = p > 0
        s.position.set(Math.sin(i * 2.3) * 0.4, lerp(5, 0.05 + i * 0.012, p), 2.4 + Math.cos(i * 1.7) * 0.3)
        s.rotation.set(-Math.PI / 2 + (1 - p) * 1.2, 0, i * 0.4 + (1 - p) * 2)
      })
    },
  }
})

section('peine', ['#2a1d16', '#050403'], (root, sec) => {
  label('DÉTOURNEMENT DE FONDS PUBLICS', 'pill red small', { t0: W('07', 'detournement') - 0.1, t1: sec.t1, x: 540, y: 360 })
  label('10<span class="unit">ANS DE PRISON</span>', 'big white', { t0: W('07', 'dix') - 0.1, t1: sec.t1, x: 540, y: 520, dur: 0.35 })
  return {
    sets: [COURT],
    light: DARK,
    spot: spotOn('accuse', 380),
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [10.6, 4.0, 2.6], look: [7.0, 2.4, -5.2], push: 0.5 }]),
    update(t) {
      courtUpdate(t, { marcNod: 0.4 })
    },
  }
})

// ------------------------------------------------ 3 · le procès

/** Les preuves qui apparaissent devant l'orateur (position calculée à partir du plan). */
function evidence(obj, shot, t0, t1, side, scale = 0.36) {
  const sh = SHOTS[shot]
  const cam = new THREE.Vector3(...sh.pos)
  const look = new THREE.Vector3(...sh.look)
  const dir = look.clone().sub(cam).normalize()
  const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
  const at = cam.clone().addScaledVector(dir, 4.6).addScaledVector(right, 0.42 * side).add(new THREE.Vector3(0, 0.45, 0))
  obj.visible = false
  return { obj, t0, t1, at, scale }
}

section('tribunal', ['#3a2a20', '#0e0a08'], (root, sec) => {
  // Les preuves.
  const pile = group(root)
  const pileSheets = []
  for (let i = 0; i < 12; i++) {
    const s = makeInvoice(pile, i + 20)
    s.rotation.set(-1.25, 0, (i % 3) * 0.08)
    s.position.set(0, i * 0.05, 0)
    pileSheets.push(s)
  }
  const crown = makeCrown(root)
  const crib = makeCrib(root)
  const poster = makePoster(root)
  const coins = makeCoins(root)
  const shows = [
    evidence(pile, 'procureur', W('09', 'quarante') - 0.15, W('09', 'six') + 1.2, 1),
    evidence(crown, 'procureur', W('09', 'roi') - 0.2, E('09') + 0.1, 1, 0.5),
    evidence(crib, 'avocate', W('10', 'trois') - 0.15, E('10') - 0.1, -1),
    evidence(poster, 'procureur', W('11', 'campagne') - 0.2, E('11') - 0.05, 1, 0.42),
    evidence(coins.g, 'avocate', W('12', 'salaire') - 0.2, E('12') - 0.1, -1, 0.5),
  ]
  const plan = [
    { t: sec.t0, shot: 'wide', push: 0.15 },
    { t: S('08') - 0.2, shot: 'juge', dur: 0.8, push: 0.08 },
    { t: S('09') - 0.15, shot: 'procureur', dur: 0.6 },
    { t: W('09', 'roi') - 0.1, shot: 'accuse', dur: 0.4 },
    { t: S('10') - 0.15, shot: 'avocate', dur: 0.6 },
    { t: S('11') - 0.15, shot: 'procureur', dur: 0.6 },
    { t: W('11', 'sauveur') - 0.1, shot: 'accuseClose', dur: 0.45 },
    { t: S('12') - 0.15, shot: 'avocate', dur: 0.6 },
    { t: W('12', 'seul') - 0.15, shot: 'accuseClose', dur: 0.45 },
    { t: S('13') - 0.15, shot: 'procureur', dur: 0.6 },
    { t: S('14') - 0.15, shot: 'avocate', dur: 0.6 },
  ]
  const shotAt = (t) => plan.filter((p) => p.t <= t).at(-1).shot

  label('47', 'big white', { t0: W('09', 'quarante') - 0.1, t1: W('09', 'six') + 1.2, x: 540, y: 380 }).update = function (t) {
    this.el.textContent = String(Math.min(47, Math.floor((t - this.t0) * 40)))
  }
  label('FAUSSES FACTURES', 'pill red', { t0: W('09', 'fausses') - 0.05, t1: W('09', 'six') + 1.2, x: 540, y: 520, rot: -2 })
  label('C’EST UN ROI', 'pill red', { t0: W('09', 'roi') - 0.05, t1: E('09') + 0.1, x: 540, y: 400, rot: -3 })
  const bb = label('312', 'big white', { t0: W('10', 'trois') - 0.1, t1: W('10', 'trois', 1) - 0.1, x: 540, y: 380, dur: 0.3 })
  bb.update = (t) => {
    bb.el.innerHTML = `${Math.min(312, Math.floor(312 * ease.out3(prog(t, bb.t0, 0.8))))}<span class="unit">BÉBÉS</span>`
  }
  label('3 VIES', 'big white', { t0: W('10', 'trois', 1) - 0.05, t1: E('10'), x: 540, y: 380, dur: 0.35 })
  label('300 000 €', 'big white', { t0: W('11', 'trois', 1) - 0.1, t1: E('11'), x: 540, y: 380 })
  label('POUR SA CAMPAGNE', 'pill red', { t0: W('11', 'campagne') - 0.1, t1: E('11'), x: 540, y: 520, rot: 2 })
  label('380 000 €', 'big white', { t0: W('12', 'trois') - 0.1, t1: W('12', 'faites') - 0.1, x: 540, y: 380 })
  label('DE SA POCHE', 'pill yellow', { t0: W('12', 'poche') - 0.1, t1: W('12', 'faites') - 0.1, x: 540, y: 520, rot: -2 })
  label('BILAN POUR LUI : <span style="color:#ff8a80">−80 000 €</span>', 'pill', { t0: W('12', 'calcul') - 0.05, t1: E('12'), x: 540, y: 420 })
  label('Aujourd’hui une maternité. Demain, qui ?', 'quote red', { t0: W('13', 'aujourdhui') - 0.05, t1: E('13') + 0.1, x: 540, y: 500 })
  label('LES DÉBATS SONT CLOS', 'pill', { t0: C.gavel[1] - 0.05, t1: SEC.vote.t0 - 0.2, x: 540, y: 420 })

  return {
    sets: [COURT],
    light: COURT_LIGHT,
    spot: (t) => spotOn(shotAt(t), shotAt(t) === 'wide' ? 60 : 170),
    cam: (t) => camAt(t, plan.map((p) => ({ t: p.t, dur: p.dur, push: p.push ?? 0.1, ...SHOTS[p.shot] }))),
    update(t) {
      courtUpdate(t)
      for (const s of shows) {
        const v = pop(s.obj, t, s.t0, s.t1, s.scale, 0.5)
        if (v <= 0) continue
        s.obj.position.copy(s.at)
        s.obj.position.y += 0.06 * Math.sin(t * 2)
        s.obj.lookAt(camera.position)
        if (s.obj === crown) s.obj.rotation.x += 0.35
        if (s.obj === crib) s.obj.rotation.z += Math.sin(t * 1.6) * 0.06
      }
      coins.coins.forEach((c, i) => {
        const p = prog(t, W('12', 'salaire') - 0.1 + i * 0.05, 0.3, ease.out3)
        c.visible = p > 0
        c.position.y = -0.4 + (i % 8) * 0.075 + (1 - p) * 1.5
      })
    },
  }
})

section('dehors', ['#5a6b80', '#1b2430'], (root, sec) => {
  label('ILS LE DÉFENDENT', 'pill yellow', { t0: sec.t0 + 0.1, t1: sec.t1, x: 540, y: 360, rot: 2 })
  return {
    sets: [FOULE],
    light: { hemi: 0.75, key: 1.3 },
    spot: { pos: [0, 10, 6], target: [0, 1, 0], i: 0 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [2.0, 2.6, 10.0], look: [0, 2.8, 0], push: 0.8 }]),
    update(t) {
      crowd.update(t, 1.2)
    },
  }
})

section('tribunal2', ['#3a2a20', '#0e0a08'], (root, sec) => {
  const plan = [
    { t: sec.t0, shot: 'procureur', push: 0.12 },
    { t: S('16') - 0.1, shot: 'avocate', dur: 0.45 },
    { t: S('17') - 0.3, shot: 'gavel', dur: 0.7, push: 0.05 },
  ]
  const shotAt = (t) => plan.filter((p) => p.t <= t).at(-1).shot
  label('Un voleur généreux reste un voleur.', 'quote red', { t0: S('15') + 0.05, t1: E('15') + 0.2, x: 540, y: 520, dur: 0.35 })
  label('Un État qui ferme les maternités n’a pas de leçon de morale à donner.', 'quote blue', { t0: S('16') + 0.05, t1: E('16') + 0.2, x: 540, y: 500, dur: 0.35 }).el.style.fontSize = '80px'
  return {
    sets: [COURT],
    light: COURT_LIGHT,
    spot: (t) => spotOn(shotAt(t)),
    cam: (t) => camAt(t, plan.map((p) => ({ t: p.t, dur: p.dur, push: p.push ?? 0.1, ...SHOTS[p.shot] }))),
    update(t) {
      courtUpdate(t)
    },
  }
})

// ------------------------------------------------ 4 · le vote

section('vote', ['#2a1d16', '#070504'], (root, sec) => {
  const tVote = W('18', 'coupable') - 0.1
  const tNon = W('18', 'non') - 0.1
  const tQ = W('18', 'et') - 0.1
  label('TU ES LE JURÉ', 'big white', { t0: W('18', 'jure') - 0.15, t1: Infinity, x: 540, y: 330, dur: 0.5 }).el.style.fontSize = '110px'
  label('COUPABLE', 'vote red', { t0: tVote, t1: Infinity, x: 540, y: 560, rot: -3 })
  label('NON COUPABLE', 'vote blue', { t0: tNon, t1: Infinity, x: 540, y: 790, rot: 3 })
  label('Et toi, tu aurais laissé fermer la maternité ?', 'pill yellow', { t0: tQ, t1: Infinity, x: 540, y: 1150, wobble: 1.2 }).el.style.fontSize = '46px'
  return {
    sets: [COURT],
    light: DARK,
    spot: { pos: [5.5, 11, 1], target: [7, 2.2, -5.4], i: 260 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [11.0, 5.0, 5.5], look: [7.0, 2.4, -5.2], push: 0.12 }]),
    update(t) {
      courtUpdate(t, { marcNod: lerp(0.45, 0.05, prog(t, sec.t0 + 0.6, 1.5, ease.io3)) })
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
const meterOn = [S('08') + 0.3, S('17') + 0.4]

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
    const audio = new Audio('../build/proces/audio.wav')
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
