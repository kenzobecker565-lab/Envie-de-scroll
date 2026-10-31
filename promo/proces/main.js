/**
 * ============================================================================
 *  « Le procès : à toi de juger » — 3D et motion design (1080 × 1920)
 * ============================================================================
 *  1. Paul et Anne, 52 ans de mariage (titre, compteur).
 *  2. La chambre : la maladie de Charcot, puis la nuit, le téléphone.
 *  3. Le tribunal : « assassinat », puis le débat. La caméra passe d'un
 *     orateur à l'autre (juge, procureur, avocate, accusé), les preuves
 *     apparaissent en 3D, la jauge « coupable ↔ non coupable » bascule.
 *  4. Le vote : « Le jury, c'est toi. » Coupable ou non coupable ?
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
function makeBuddy(parent, { robe = null, jabot = false, hair = null, bun = false, skin = COL.wood } = {}) {
  const wood = M(skin, { roughness: 0.62 })
  const sleeve = robe ? M(robe, { roughness: 0.7 }) : wood
  const g = group(parent)
  const hips = group(g, 0, 1.6, 0)
  const torso = group(hips)
  mesh(new THREE.CapsuleGeometry(0.44, 0.7, 8, 20), robe ? sleeve : wood, torso).position.y = 0.68
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
function section(id, bg, build) {
  const sec = SEC[id]
  const root = group(scene)
  root.visible = false
  SECTIONS.push({ ...sec, root, bg, ...build(root, sec) })
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

// ------------------------------------------------- 1 · 52 ans de mariage

section('couple', ['#4a3424', '#140e0a'], (root, sec) => {
  const stage = mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.3, 64), M('#6b4a35', { roughness: 0.7 }), root)
  stage.position.y = 0.15
  const paul = makeBuddy(root, { hair: '#cfcfcf' })
  paul.g.position.set(-0.78, 0.3, 0)
  paul.g.rotation.y = 0.12
  const anne = makeBuddy(root, { hair: '#d9d2c5', bun: true, skin: '#EFD3AE' })
  anne.g.position.set(0.78, 0.3, 0)
  anne.g.rotation.y = -0.12
  anne.g.scale.setScalar(0.93)
  // Cœur entre les deux.
  const heart = new THREE.Shape()
  heart.moveTo(0, -0.5)
  heart.bezierCurveTo(-0.9, 0.1, -0.5, 0.75, 0, 0.35)
  heart.bezierCurveTo(0.5, 0.75, 0.9, 0.1, 0, -0.5)
  const hg = new THREE.ExtrudeGeometry(heart, { depth: 0.18, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 })
  hg.translate(0, 0, -0.09)
  const heartM = mesh(hg, M('#e2553f', { roughness: 0.35, emissive: '#e2553f', emissiveIntensity: 0.25 }), root)
  heartM.position.set(0, 4.3, 0.2)
  const t52 = W('01', 'cinquante') - 0.05
  label('LE PROCÈS<br><span class="sub">Il a aidé sa femme à mourir</span>', 'title dark', { t0: 0.1, t1: S('01') + 1.6, x: 540, y: 340, dur: 0.6 })
  const counter = label('0', 'big white', { t0: t52, t1: sec.t1, x: 540, y: 360, dur: 0.35 })
  counter.update = (t) => {
    counter.el.innerHTML = `${Math.round(52 * ease.out3(prog(t, t52, 1.1)))}<span class="unit">ANS</span>`
  }
  return {
    light: { hemi: 0.5, key: 1.1 },
    spot: { pos: [0, 9, 4], target: [0, 1.5, 0], i: 140 },
    cam: (t) =>
      camAt(t, [
        { t: 0, pos: [0, 4.2, 15.5], look: [0, 2.5, 0], push: 0.25 },
      ]),
    update(t) {
      pop(stage, t, 0.02, Infinity, 1, 0.5)
      pop(paul.g, t, 0.25)
      pop(anne.g, t, 0.4, Infinity, 0.93)
      // Main dans la main, ils se regardent.
      const sway = Math.sin(t * 1.2) * 0.04
      paul.pose({ turn: 0.35, nod: 0.08, aL: [0.3, 0.12, 0.05], aR: [0.12, 0, 0.1], lean: sway })
      anne.pose({ turn: -0.35, nod: 0.1, aR: [0.3, 0.12, 0.05], aL: [0.12, 0, 0.1], lean: -sway })
      const sh = pop(heartM, t, t52 + 0.2, Infinity, 1, 0.6)
      heartM.rotation.y = Math.sin(t * 1.4) * 0.35
      if (sh > 0) heartM.scale.setScalar(sh * (1 + 0.06 * Math.max(0, Math.sin(t * 7.5)) ** 8))
    },
  }
})

// ---------------------------------------- 2 · la chambre, la maladie, la nuit

section('chambre', ['#2f3a44', '#0c1014'], (root, sec) => {
  room(root, { floor: '#3b4249', wall: '#56616b', wallZ: -4 })
  // Lit médicalisé.
  const bed = group(root, 0, 0, 0)
  const metal = M('#d7dce2', { metalness: 0.6, roughness: 0.3 })
  rbox(2.4, 0.18, 4.4, 0.06, metal, bed).position.y = 0.95
  for (const [x, z] of [[-1.05, 2.0], [1.05, 2.0], [-1.05, -2.0], [1.05, -2.0]]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.95, 12), metal, bed).position.set(x, 0.48, z)
  rbox(2.4, 1.4, 0.12, 0.05, metal, bed).position.set(0, 1.5, -2.2)
  rbox(2.25, 0.32, 4.2, 0.12, M('#f4f6f8', { roughness: 0.8 }), bed).position.y = 1.2
  rbox(1.2, 0.22, 0.7, 0.1, M('#ffffff', { roughness: 0.8 }), bed).position.set(0, 1.45, -1.55)
  // Anne, allongée, sous la couverture.
  const anne = makeBuddy(bed, { hair: '#d9d2c5', bun: false, skin: '#EFD3AE' })
  anne.g.rotation.x = -Math.PI / 2
  anne.g.position.set(0, 1.5, 1.75)
  anne.g.scale.setScalar(0.92)
  anne.pose({ aL: [0.05, 0, 0], aR: [0.05, 0, 0], nod: -0.2 })
  const blanket = rbox(2.1, 0.3, 2.9, 0.14, M('#9bb7d4', { roughness: 0.85 }), bed)
  blanket.position.set(0, 1.55, 0.65)
  // Moniteur cardiaque.
  const mon = group(root, 2.3, 0, -1.6)
  mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 12), metal, mon).position.y = 1.2
  rbox(1.3, 0.9, 0.25, 0.08, M('#2b2f38'), mon).position.y = 2.7
  const ecg = canvasTex(256, 160, (g, w, h, k, t) => {
    g.fillStyle = '#0b1a14'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#4ade80'
    g.lineWidth = 5
    g.beginPath()
    for (let x = 0; x < w; x++) {
      const ph = ((x / w) * 2 + t * 1.1) % 1
      const y = ph > 0.42 && ph < 0.5 ? (ph < 0.46 ? -1 : 0.6) * Math.sin(((ph - 0.42) / 0.08) * Math.PI) : 0
      g.lineTo(x, h * 0.55 - y * h * 0.38)
    }
    g.stroke()
    g.fillStyle = '#4ade80'
    g.font = '800 34px "Figtree Variable", sans-serif'
    g.fillText(String(62 + Math.round(Math.sin(t) * 3)), 18, 40)
  })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), new THREE.MeshBasicMaterial({ map: ecg.tex, toneMapped: false }))
  screen.position.set(0, 2.7, 0.13)
  mon.add(screen)
  // Lampe de chevet et Paul assis à côté (la nuit).
  const lampG = group(root, -2.2, 0, -1.4)
  rbox(0.9, 1.1, 0.9, 0.08, M('#6b4a35'), lampG).position.y = 0.55
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10), metal, lampG).position.y = 1.45
  const shadeMat = M('#f7e7c4', { emissive: '#ffcf87', emissiveIntensity: 0, side: THREE.DoubleSide })
  mesh(new THREE.CylinderGeometry(0.25, 0.42, 0.45, 24, 1, true), shadeMat, lampG).position.y = 1.9
  const lamp = new THREE.PointLight(0xffc27a, 0, 9, 1.5)
  lamp.position.set(-2.2, 2.0, -1.0)
  root.add(lamp)
  const chair = group(root, -2.0, 0, 0.7)
  rbox(1.1, 0.12, 1.1, 0.05, M('#5B3A26'), chair).position.y = 1.0
  rbox(1.1, 1.2, 0.12, 0.05, M('#5B3A26'), chair).position.set(0, 1.6, -0.5)
  const paul = makeBuddy(root, { hair: '#cfcfcf' })
  paul.g.position.set(-2.0, -0.55, 0.75)
  paul.g.rotation.y = 1.25
  // Téléphone (il appelle la police).
  const phone = group(root, -1.2, 2.6, 1.6)
  rbox(0.5, 0.95, 0.07, 0.07, M('#1b1d22', { metalness: 0.3, roughness: 0.3 }), phone)
  const call = canvasTex(160, 300, (g, w, h) => {
    g.fillStyle = '#0f1218'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = '900 110px "Figtree Variable", sans-serif'
    g.fillText('17', w / 2, 140)
    g.font = '700 22px "Figtree Variable", sans-serif'
    g.fillText('Police secours', w / 2, 190)
    g.fillStyle = '#22c55e'
    g.beginPath()
    g.arc(w / 2, 250, 26, 0, Math.PI * 2)
    g.fill()
  })
  call.set('17')
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.86), new THREE.MeshBasicMaterial({ map: call.tex, toneMapped: false }))
  phoneScreen.position.z = 0.04
  phone.add(phoneScreen)

  const tNight = S('03') - 0.1
  const tDose = W('03', 'dose')
  const tCall = W('03', 'appele') - 0.1
  const words = [['BOUGER', W('02', 'bouger')], ['MANGER', W('02', 'manger')], ['RESPIRER', W('02', 'respirer')]]
  label('MALADIE DE CHARCOT', 'pill', { t0: W('02', 'charcot') - 0.1, t1: tNight - 0.2, x: 540, y: 330 })
  words.forEach(([w, t0], i) => {
    const L = label(`<s>${w}</s>`, 'pill small', { t0, t1: tNight - 0.2, x: 540, y: 470 + i * 100 })
    L.el.querySelector('s').style.textDecorationThickness = '0px'
    L.update = (t) => {
      const p = prog(t, t0 + 0.35, 0.3)
      L.el.style.textDecoration = p > 0 ? 'line-through' : 'none'
      L.el.style.textDecorationThickness = '8px'
      L.el.style.opacity = String(1 - 0.35 * p)
    }
  })
  label('UNE NUIT', 'pill small', { t0: tNight + 0.1, t1: tCall - 0.2, x: 540, y: 340 })
  label('IL APPELLE LA POLICE', 'pill red', { t0: tCall + 0.2, t1: sec.t1, x: 540, y: 340, rot: -2 })

  return {
    light: (t) => {
      const n = prog(t, tNight, 0.8)
      return { hemi: lerp(0.75, 0.12, n), key: lerp(1.4, 0.15, n) }
    },
    spot: { pos: [0, 9, 3], target: [0, 1.2, 0], i: 80 },
    bgAt: (t) => (t < tNight ? null : ['#16202e', '#05070b']),
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [4.2, 6.2, 9.6], look: [0, 1.4, 0], push: 0.12 },
        { t: tNight, dur: 1.2, pos: [-0.8, 4.6, 8.4], look: [-0.8, 1.6, 0], push: 0.1 },
        { t: tCall - 0.15, dur: 0.8, pos: [-0.3, 3.4, 5.6], look: [-1.0, 2.2, 1.0], push: 0.1 },
      ]),
    update(t) {
      pop(bed, t, sec.t0 + 0.05, Infinity, 1, 0.5)
      pop(mon, t, sec.t0 + 0.2)
      ecg.set(Math.floor(t * FPS), t)
      const night = prog(t, tNight, 0.8)
      const lampOn = night * (1 - prog(t, tDose + 0.6, 0.8))
      lamp.intensity = 14 * lampOn
      shadeMat.emissiveIntensity = 1.2 * lampOn
      lampG.visible = chair.visible = paul.g.visible = night > 0
      paul.pose({ lean: 0.35, nod: 0.35, aL: [0.1, 0.9, 1.4], aR: [0.1, 0.9, 1.4] })
      paul.legL.root.rotation.x = paul.legR.root.rotation.x = -1.45
      paul.legL.mid.rotation.x = paul.legR.mid.rotation.x = 1.45
      // L'électrocardiogramme s'arrête quand la lampe s'éteint.
      screen.visible = t < tDose + 1.2
      const sp = pop(phone, t, tCall, Infinity, 1, 0.45)
      if (sp > 0) {
        phone.rotation.z = Math.sin(t * 40) * 0.08 * (Math.sin(t * 6) > 0 ? 1 : 0)
        phone.rotation.y = -0.4
      }
    },
  }
})

// --------------------------------------------------------- 3 · le tribunal

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

const SHOTS = {
  wide: { pos: [0, 6.6, 17.5], look: [0, 2.6, -3.5] },
  juge: { pos: [0.6, 4.4, 2.0], look: [0.3, 3.8, -7.0] },
  procureur: { pos: [-0.2, 3.6, 4.6], look: [-5.2, 2.7, -2.2] },
  avocate: { pos: [0.2, 3.6, 4.6], look: [5.2, 2.7, -2.2] },
  accuse: { pos: [10.6, 4.0, 2.6], look: [7.0, 2.2, -5.2] },
  gavel: { pos: [3.4, 4.0, -2.6], look: [1.4, 3.0, -6.0] },
}

section('tribunal', ['#3a2a20', '#0e0a08'], (root, sec) => {
  const court = makeCourt(root)
  const juge = makeBuddy(root, { robe: '#a3201a', jabot: true, hair: '#8a8a8a' })
  juge.g.position.set(0, 1.0, -7.0)
  const proc = makeBuddy(root, { robe: COL.red, jabot: true, hair: '#2b2118' })
  proc.g.position.set(-5.3, 0, -2.3)
  proc.g.rotation.y = 0.55
  const avo = makeBuddy(root, { robe: COL.black, jabot: true, hair: '#6b3e22', bun: true, skin: '#EFD3AE' })
  avo.g.position.set(5.3, 0, -2.3)
  avo.g.rotation.y = -0.55
  avo.g.scale.setScalar(0.95)
  const paul = makeBuddy(root, { hair: '#cfcfcf' })
  paul.g.position.set(7.0, -0.35, -5.4)
  paul.g.rotation.y = -0.5

  // Les preuves, qui apparaissent devant l'orateur.
  const props = {}
  // Calendrier : les jours défilent jusqu'à 21.
  const cal = group(root)
  const calTex = canvasTex(256, 300, (g, w, h, day) => {
    g.fillStyle = '#ffffff'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#d93a30'
    g.fillRect(0, 0, w, 80)
    g.fillStyle = '#ffffff'
    g.font = '800 44px "Figtree Variable", sans-serif'
    g.textAlign = 'center'
    g.fillText('JOUR', w / 2, 56)
    g.fillStyle = COL.ink
    g.font = '900 150px "Figtree Variable", sans-serif'
    g.fillText(String(day), w / 2, 230)
  })
  rbox(1.3, 1.55, 0.12, 0.06, M('#ffffff'), cal)
  const calFace = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), new THREE.MeshBasicMaterial({ map: calTex.tex, toneMapped: false }))
  calFace.position.z = 0.07
  cal.add(calFace)
  for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.09, 0.025, 8, 20), M('#9aa3af', { metalness: 0.7 }), cal).position.set(s * 0.35, 0.78, 0.08)
  props.cal = cal
  // Bulles « elle l'a supplié » (onze).
  const bubbles = group(root)
  const bubbleList = []
  const rb = rng(3)
  for (let i = 0; i < 11; i++) {
    const b = textSprite('…', { bg: '#ffffff', fg: COL.ink, size: 0.55, font: 120 })
    b.position.set((rb() - 0.5) * 2.2, (rb() - 0.5) * 2.0, (rb() - 0.5) * 0.6)
    bubbles.add(b)
    bubbleList.push(b)
  }
  props.bubbles = bubbles
  // Berceau (le petit-fils).
  const crib = group(root)
  const cribWood = M('#f1e4cf', { roughness: 0.6 })
  rbox(1.5, 0.12, 0.9, 0.04, cribWood, crib).position.y = 0
  for (let i = 0; i < 8; i++) {
    for (const z of [-0.42, 0.42]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), cribWood, crib).position.set(-0.68 + i * 0.195, 0.4, z)
  }
  for (const z of [-0.42, 0.42]) rbox(1.5, 0.08, 0.08, 0.03, cribWood, crib).position.set(0, 0.77, z)
  rbox(1.2, 0.22, 0.7, 0.1, M('#9cc3ff', { roughness: 0.9 }), crib).position.y = 0.17
  props.crib = crib
  // Téléphone « 17 ».
  const phone = group(root)
  rbox(0.55, 1.05, 0.08, 0.08, M('#1b1d22', { metalness: 0.3, roughness: 0.3 }), phone)
  const call = canvasTex(160, 300, (g, w, h) => {
    g.fillStyle = '#0f1218'
    g.fillRect(0, 0, w, h)
    g.fillStyle = '#ffffff'
    g.textAlign = 'center'
    g.font = '900 110px "Figtree Variable", sans-serif'
    g.fillText('17', w / 2, 140)
    g.font = '700 26px "Figtree Variable", sans-serif'
    g.fillText('Appel sortant', w / 2, 190)
  })
  call.set('17')
  const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.95), new THREE.MeshBasicMaterial({ map: call.tex, toneMapped: false }))
  ps.position.z = 0.045
  phone.add(ps)
  props.phone = phone
  // Croix médicale (la sédation profonde, encadrée par des médecins).
  const cross = group(root)
  const green = M('#22a06b', { roughness: 0.35, emissive: '#22a06b', emissiveIntensity: 0.2 })
  rbox(0.38, 1.2, 0.25, 0.08, green, cross)
  rbox(1.2, 0.38, 0.25, 0.08, green, cross)
  props.cross = cross

  // Où et quand chaque preuve apparaît (devant la caméra du plan).
  const showings = [
    { obj: cal, shot: 'procureur', t0: W('06', 'semaines') - 0.2, t1: E('06') - 0.1, side: 1 },
    { obj: bubbles, shot: 'avocate', t0: W('07', 'onze') - 0.2, t1: E('07') - 0.1, side: -1 },
    { obj: crib, shot: 'procureur', t0: W('08', 'petit') - 0.3, t1: W('08', 'qui') - 0.1, side: 1 },
    { obj: phone, shot: 'avocate', t0: W('09', 'appele') - 0.25, t1: W('09', 'ce') - 0.1, side: -1 },
    { obj: cross, shot: 'procureur', t0: W('10', 'sedation') - 0.2, t1: W('10', 'si') - 0.1, side: 1 },
  ]
  for (const s of showings) {
    const sh = SHOTS[s.shot]
    const cam = new THREE.Vector3(...sh.pos)
    const look = new THREE.Vector3(...sh.look)
    const dir = look.clone().sub(cam).normalize()
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
    s.at = cam.clone().addScaledVector(dir, 4.6).addScaledVector(right, 0.42 * s.side).add(new THREE.Vector3(0, 0.45, 0))
    s.obj.visible = false
  }

  // Les plans, réplique après réplique.
  const plan = [
    { t: sec.t0, shot: 'wide', push: 0.15 },
    { t: S('05') - 0.3, shot: 'juge', dur: 0.9, push: 0.08 },
    { t: S('06') - 0.15, shot: 'procureur', dur: 0.7 },
    { t: S('07') - 0.15, shot: 'avocate', dur: 0.7 },
    { t: S('08') - 0.15, shot: 'procureur', dur: 0.7 },
    { t: W('08', 'sauf') - 0.1, shot: 'accuse', dur: 0.5 },
    { t: S('09') - 0.15, shot: 'avocate', dur: 0.7 },
    { t: S('10') - 0.15, shot: 'procureur', dur: 0.7 },
    { t: S('11') - 0.15, shot: 'accuse', dur: 0.8 },
    { t: S('12') - 0.1, shot: 'procureur', dur: 0.45 },
    { t: S('13') - 0.1, shot: 'avocate', dur: 0.45 },
    { t: S('14') - 0.3, shot: 'gavel', dur: 0.7, push: 0.05 },
  ]
  const shotAt = (t) => plan.filter((p) => p.t <= t).at(-1).shot

  // Étiquettes et citations.
  label('ASSASSINAT', 'stamp', { t0: W('04', 'assassinat'), t1: S('05') - 0.4, x: 540, y: 520, rot: -8, dur: 0.3 })
  label('3 SEMAINES', 'big white', { t0: W('06', 'trois', 1) - 0.1, t1: E('06'), x: 540, y: 420 })
  label('UNE DÉCISION PRÉPARÉE', 'pill red', { t0: W('06', 'decision') - 0.1, t1: E('06'), x: 540, y: 560, rot: -2 })
  const fois = label('0', 'big white', { t0: W('07', 'onze') - 0.1, t1: E('07'), x: 540, y: 420, dur: 0.35 })
  fois.update = (t) => {
    fois.el.innerHTML = `${Math.min(11, 1 + Math.floor((t - fois.t0) / 0.09))}<span class="unit">FOIS</span>`
  }
  label('SON PETIT-FILS', 'pill blue', { t0: W('08', 'petit') - 0.1, t1: W('08', 'qui') - 0.1, x: 540, y: 420 })
  label('?', 'big white', { t0: W('08', 'qui') - 0.05, t1: E('08'), x: 540, y: 430, wobble: 4 })
  label('« Je lui avais promis. »', 'quote', { t0: W('09', 'je') - 0.05, t1: E('09'), x: 540, y: 480 })
  label('SÉDATION PROFONDE', 'pill', { t0: W('10', 'sedation') - 0.1, t1: W('10', 'si') - 0.1, x: 540, y: 420 })
  label('IL A CHOISI SEUL', 'pill red', { t0: W('10', 'choisi') - 0.1, t1: E('10'), x: 540, y: 540, rot: 2 })
  label('79<span class="unit">ANS</span>', 'big white', { t0: W('11', '79') - 0.1, t1: E('11'), x: 540, y: 420 })
  label('La compassion n’est pas un permis de tuer.', 'quote red', { t0: S('12') + 0.05, t1: E('12') + 0.2, x: 540, y: 520, dur: 0.35 })
  label('La loi n’est pas faite pour punir l’amour.', 'quote blue', { t0: S('13') + 0.05, t1: E('13') + 0.2, x: 540, y: 520, dur: 0.35 })
  label('LES DÉBATS SONT CLOS', 'pill', { t0: C.gavel[1] - 0.05, t1: sec.t1, x: 540, y: 420 })

  return {
    light: { hemi: 0.22, key: 0.45 },
    spot: (t) => {
      const who = shotAt(t)
      const tgt = { wide: [0, 2, -3], juge: [0, 3.5, -7], procureur: [-5.3, 2.5, -2.3], avocate: [5.3, 2.5, -2.3], accuse: [7, 2.2, -5.4], gavel: [1.5, 3, -6] }[who]
      return { pos: [tgt[0] * 0.6, 11, tgt[2] + 6], target: tgt, i: who === 'wide' ? 60 : 170 }
    },
    cam: (t) => camAt(t, plan.map((p) => ({ t: p.t, dur: p.dur, push: p.push ?? 0.1, ...SHOTS[p.shot] }))),
    update(t) {
      pop(juge.g, t, sec.t0 + 0.05)
      const cur = C.lines.find((l) => t >= l.start && t < l.start + l.dur)
      const speaking = (who) => cur?.who === who
      talk(juge, t, speaking('juge'), { side: 'L' })
      talk(proc, t, speaking('procureur'), { side: 'R' })
      talk(avo, t, speaking('avocate'), { side: 'L' })
      // Paul, tête baissée dans le box.
      paul.pose({ lean: 0.3, nod: 0.45 + 0.04 * Math.sin(t * 0.9), aL: [0.08, 0.6, 1.2], aR: [0.08, 0.6, 1.2] })
      paul.legL.root.rotation.x = paul.legR.root.rotation.x = -1.4
      paul.legL.mid.rotation.x = paul.legR.mid.rotation.x = 1.4
      // Coups de marteau.
      let strike = 0
      for (const g of C.gavel) strike = Math.max(strike, prog(t, g - 0.25, 0.25, ease.in3) * (1 - prog(t, g + 0.05, 0.35, ease.out3)))
      court.gavel.rotation.z = -0.9 * (1 - strike) + 0.0
      court.gavel.position.y = 0.25 * (1 - strike)
      // Les preuves.
      for (const s of showings) {
        const v = pop(s.obj, t, s.t0, s.t1, 0.36, 0.5)
        if (v <= 0) continue
        s.obj.position.copy(s.at)
        s.obj.position.y += 0.06 * Math.sin(t * 2)
        s.obj.lookAt(camera.position)
        if (s.obj === phone) s.obj.rotation.z += Math.sin(t * 38) * 0.06 * (Math.sin(t * 6) > 0 ? 1 : 0)
        if (s.obj === crib) s.obj.rotation.z += Math.sin(t * 1.6) * 0.06
      }
      const day = 1 + Math.floor(20 * ease.io2(prog(t, W('06', 'semaines'), 1.4)))
      calTex.set(day)
      bubbleList.forEach((b, i) => {
        const v = popS(t, W('07', 'onze') - 0.1 + i * 0.09, Infinity, 0.35)
        b.visible = v > 0.01
        b.scale.setScalar(Math.max(1e-4, v * 0.5))
      })
    },
  }
})

// ---------------------------------------------------------- 4 · le vote

section('vote', ['#2a1d16', '#070504'], (root, sec) => {
  makeCourt(root)
  const paul = makeBuddy(root, { hair: '#cfcfcf' })
  paul.g.position.set(7.0, -0.35, -5.4)
  paul.g.rotation.y = -0.5
  const t0 = S('15')
  const tVote = W('15', 'coupable') - 0.1
  const tNon = W('15', 'non') - 0.1
  const tCom = W('15', 'donne') - 0.1
  label('LE JURY, C’EST TOI', 'big white', { t0: W('15', 'jury') - 0.1, t1: Infinity, x: 540, y: 330, dur: 0.5 }).el.style.fontSize = '104px'
  label('COUPABLE', 'vote red', { t0: tVote, t1: Infinity, x: 540, y: 580, rot: -3 })
  label('NON COUPABLE', 'vote blue', { t0: tNon, t1: Infinity, x: 540, y: 820, rot: 3 })
  label('Ton verdict en commentaire', 'pill yellow', { t0: tCom, t1: Infinity, x: 540, y: 1180, wobble: 1.5 })
  return {
    light: { hemi: 0.12, key: 0.15 },
    spot: { pos: [5.5, 11, 1], target: [7, 2.2, -5.4], i: 260 },
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [11.0, 5.0, 5.5], look: [7.0, 2.4, -5.2], push: 0.12 },
      ]),
    update(t) {
      paul.pose({ lean: 0.3, nod: 0.45 + 0.04 * Math.sin(t * 0.9) - 0.4 * prog(t, t0 + 0.6, 1.5, ease.io3), aL: [0.08, 0.6, 1.2], aR: [0.08, 0.6, 1.2] })
      paul.legL.root.rotation.x = paul.legR.root.rotation.x = -1.4
      paul.legL.mid.rotation.x = paul.legR.mid.rotation.x = 1.4
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
const meterOn = [S('05') + 0.3, S('14') + 0.4]

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
const WIPES = C.sections.slice(1).map((s, i) => {
  const els = ['#B3261E', '#0e0a08'].map((col) => {
    const el = document.createElement('div')
    el.className = 'wipe'
    el.style.background = col
    wipesEl.append(el)
    return el
  })
  return { cut: s.t0, els, dir: i % 2 ? 1 : -1 }
})

function updateWipes(t) {
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
