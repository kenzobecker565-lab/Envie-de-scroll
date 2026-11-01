/**
 * ============================================================================
 *  « Affaire Classée ? » — affaire n°2 : la mère justicière (≈ 47 s, 1080 × 1920)
 * ============================================================================
 *  1. L'accroche : le téléphone de sa fille, les insultes qui arrivent, le
 *     compteur qui s'emballe. Trois plaintes, trois tampons « classée sans
 *     suite ». La rue, la nuit : « elle lui a cassé le nez ». 5 ans de prison.
 *  2. Le procès : procureur et avocate se répondent (la loi du plus fort, 3
 *     plaintes, 17 ans contre 45, 400 messages), jauge « coupable ↔ non
 *     coupable », phrases-chocs.
 *  3. Le vote : « Tu es le juré. »
 *
 *  Même moteur que l'affaire n°1 (../proces/main.js) : tout est une fonction du
 *  temps, window.__promo.seek(t) affiche l'image de l'instant t. Les instants
 *  viennent des voix (timeline.json, voir voix.py) via cues.js.
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

/** Messages reçus par la fille (fictifs) : insultes affichées sur le téléphone. */
const INSULTES = [
  'T’es pathétique',
  'Personne veut de toi ici',
  'Dégage du lycée',
  'Tout le monde se moque de toi',
  'Regarde-toi',
  'Même tes potes te supportent plus',
  'Ne reviens pas lundi',
  'T’aurais jamais dû venir',
]

/**
 * Téléphone : conversation avec un « Inconnu », bulles d'insultes qui
 * arrivent, compteur de messages. set(n, total) affiche les n derniers.
 */
function makePhone(parent, { w = 1.6, h = 3.2 } = {}) {
  const g = group(parent)
  rbox(w, h, 0.14, 0.18, M('#16181d', { metalness: 0.3, roughness: 0.25 }), g)
  const screen = canvasTex(360, 720, (c, W, H, key, n, total) => {
    c.fillStyle = '#0f1115'
    c.fillRect(0, 0, W, H)
    c.fillStyle = '#1c1f26'
    c.fillRect(0, 0, W, 92)
    c.fillStyle = '#9aa3af'
    c.beginPath()
    c.arc(44, 46, 22, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#ffffff'
    c.font = '800 26px "Figtree Variable", sans-serif'
    c.fillText('Inconnu', 80, 44)
    c.fillStyle = '#ef4444'
    c.font = '700 18px "Figtree Variable", sans-serif'
    c.fillText(`${total} messages`, 80, 70)
    // Bulles, de bas en haut.
    let y = H - 30
    c.font = '600 22px "Figtree Variable", sans-serif'
    for (let i = 0; i < Math.min(n, 9) && y > 110; i++) {
      const text = INSULTES[(total - 1 - i + INSULTES.length * 99) % INSULTES.length]
      const tw = Math.min(W - 70, c.measureText(text).width + 32)
      const bh = 50
      y -= bh + 12
      c.fillStyle = '#2a2e37'
      c.beginPath()
      c.roundRect(18, y, tw, bh, 18)
      c.fill()
      c.fillStyle = '#f3f4f6'
      c.fillText(text, 34, y + 32)
    }
  })
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.16, h - 0.24), new THREE.MeshBasicMaterial({ map: screen.tex, toneMapped: false }))
  s.position.z = 0.075
  g.add(s)
  // Pastille rouge du nombre de notifications.
  const badge = textSprite('0', { bg: '#ef4444', fg: '#ffffff', size: 0.75, font: 110 })
  badge.position.set(w / 2 - 0.05, h / 2 - 0.05, 0.2)
  g.add(badge)
  let lastBadge = -1
  const setBadge = (n) => {
    if (n === lastBadge) return
    lastBadge = n
    const cv = badge.material.map.image
    const c = cv.getContext('2d')
    c.clearRect(0, 0, 256, 256)
    c.fillStyle = '#ef4444'
    c.beginPath()
    c.roundRect(14, 40, 228, 176, 88)
    c.fill()
    c.fillStyle = '#ffffff'
    c.font = `900 ${n > 99 ? 96 : 120}px "Figtree Variable", sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(String(n), 128, 132)
    badge.material.map.needsUpdate = true
  }
  return {
    g,
    set(n, total) {
      screen.set(`${n}/${total}`, n, total)
      setBadge(total)
    },
  }
}

/** Dossier de plainte, avec le tampon rouge « CLASSÉE SANS SUITE » (stamp de 0 à 1). */
function makeFolder(parent, n) {
  const g = group(parent)
  const tan = M('#c9a46a', { roughness: 0.8 })
  rbox(1.7, 0.08, 1.2, 0.03, tan, g)
  rbox(0.6, 0.08, 0.2, 0.03, tan, g).position.set(-0.45, 0, -0.68)
  const tex = canvasTex(340, 240, (c, W, H, key, stamp) => {
    c.fillStyle = '#d6b679'
    c.fillRect(0, 0, W, H)
    c.fillStyle = 'rgba(60,40,20,0.85)'
    c.font = '900 30px "Figtree Variable", sans-serif'
    c.fillText(`PLAINTE N°${n}`, 22, 46)
    c.font = '600 20px "Figtree Variable", sans-serif'
    c.fillText('Harcèlement scolaire', 22, 76)
    c.fillStyle = 'rgba(60,40,20,0.25)'
    for (let i = 0; i < 5; i++) c.fillRect(22, 100 + i * 22, 180 + ((n * 41 + i * 29) % 90), 6)
    if (stamp > 0) {
      c.save()
      c.globalAlpha = Math.min(1, stamp)
      c.translate(W / 2 + 18, H / 2 + 34)
      c.rotate(-0.22)
      c.scale(1 + 0.6 * (1 - Math.min(1, stamp)), 1 + 0.6 * (1 - Math.min(1, stamp)))
      c.strokeStyle = '#d6332a'
      c.lineWidth = 7
      c.strokeRect(-150, -44, 300, 88)
      c.fillStyle = '#d6332a'
      c.textAlign = 'center'
      c.font = '900 34px "Figtree Variable", sans-serif'
      c.fillText('CLASSÉE', 0, -6)
      c.font = '900 26px "Figtree Variable", sans-serif'
      c.fillText('SANS SUITE', 0, 28)
      c.restore()
    }
  })
  const top = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 1.12), new THREE.MeshStandardMaterial({ map: tex.tex, roughness: 0.85 }))
  top.rotation.x = -Math.PI / 2
  top.position.y = 0.045
  g.add(top)
  tex.set('0', 0)
  return { g, stamp: (p) => tex.set(String(Math.round(p * 20)), p) }
}

/** La rue, la nuit : maison du harceleur (fenêtre allumée), lampadaire. */
function makeStreet(parent) {
  const g = group(parent)
  const ground = mesh(new THREE.PlaneGeometry(60, 40), M('#2a2d33', { roughness: 0.95 }), g)
  ground.rotation.x = -Math.PI / 2
  ground.castShadow = false
  rbox(30, 0.2, 3, 0.04, M('#4a4e57', { roughness: 0.9 }), g).position.set(0, 0.1, -1.5)
  // Maison.
  const house = group(g, -1.2, 0, -4.5)
  rbox(7, 5, 3, 0.08, M('#5d6370', { roughness: 0.9 }), house).position.y = 2.5
  const roof = mesh(new THREE.CylinderGeometry(2.6, 2.6, 7.4, 3, 1), M('#3a2f2a', { roughness: 0.9 }), house)
  roof.rotation.set(0, 0, Math.PI / 2)
  roof.scale.set(0.55, 1, 0.75)
  roof.position.set(0, 5.6, 0)
  rbox(1.2, 2.3, 0.15, 0.05, M('#4a2f22'), house).position.set(-1.5, 1.15, 1.52)
  const win = rbox(1.5, 1.2, 0.1, 0.04, M('#ffd27a', { emissive: '#ffb84d', emissiveIntensity: 1.2 }), house)
  win.position.set(1.4, 3.1, 1.52)
  const winLight = new THREE.PointLight(0xffc06a, 6, 8, 1.6)
  winLight.position.set(0.2, 3.1, -2.3)
  g.add(winLight)
  // Lampadaire.
  const lamp = group(g, 3.2, 0, 0.2)
  const metal = M('#2f333b', { metalness: 0.6, roughness: 0.4 })
  mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.2, 12), metal, lamp).position.y = 2.6
  rbox(0.9, 0.18, 0.4, 0.06, metal, lamp).position.set(-0.35, 5.2, 0)
  const bulb = mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffe3a3' }), lamp)
  bulb.position.set(-0.55, 5.05, 0)
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8, 4.8, 32, 1, true), glow('#ffe3a3', { opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }))
  cone.position.set(-0.55, 2.65, 0)
  lamp.add(cone)
  const lampLight = new THREE.SpotLight(0xffd99a, 140, 14, 0.55, 0.6, 1.4)
  lampLight.position.set(2.65, 5.0, 0.2)
  lampLight.target.position.set(2.2, 0, 0.6)
  lampLight.castShadow = true
  lampLight.shadow.mapSize.set(1024, 1024)
  g.add(lampLight, lampLight.target)
  return g
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
  mere: makeBuddy(COURT, { suit: '#6b3f52', hair: '#4a2e1e', bun: true, skin: '#EFD3AE' }),
}
cast.juge.g.position.set(0, 1.0, -7.0)
cast.procureur.g.position.set(-5.3, 0, -2.3)
cast.procureur.g.rotation.y = 0.55
cast.avocate.g.position.set(5.3, 0, -2.3)
cast.avocate.g.rotation.y = -0.55
cast.avocate.g.scale.setScalar(0.95)
cast.mere.g.position.set(7.0, -0.35, -5.4)
cast.mere.g.rotation.y = -0.5
cast.mere.g.scale.setScalar(0.95)

/** Le tribunal à l'instant t : gestes de l'orateur, accusée assise, coups de marteau. */
function courtUpdate(t, { nod = 0.3 } = {}) {
  const cur = C.lines.find((l) => t >= l.start && t < l.start + l.dur)
  talk(cast.juge, t, cur?.who === 'juge', { side: 'L' })
  talk(cast.procureur, t, cur?.who === 'procureur', { side: 'R' })
  talk(cast.avocate, t, cur?.who === 'avocate', { side: 'L' })
  const m = cast.mere
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
const PLAIN = { hemi: 0.75, key: 1.2 }
const NO_SPOT = { pos: [0, 10, 6], target: [0, 1, 0], i: 0 }

// ------------------------------------------------ 1 · l'accroche

section('messages', ['#1b1f2a', '#05060a'], (root, sec) => {
  const phone = makePhone(root)
  phone.g.position.set(0, 2.6, 0)
  const tPend = W('01', 'pendant') - 0.1
  label('1 AN DE HARCÈLEMENT', 'pill red', { t0: tPend, t1: sec.t1, x: 540, y: 330, rot: -2 })
  return {
    light: PLAIN,
    spot: NO_SPOT,
    cam: (t) => camAt(t, [{ t: 0, pos: [0.4, 2.9, 7.2], look: [0, 2.5, 0], push: 0.5 }]),
    update(t) {
      pop(phone.g, t, 0.02, Infinity, 1, 0.4)
      phone.g.rotation.set(-0.08, 0.18 * Math.sin(t * 0.7), 0.04 * Math.sin(t * 1.3))
      // Les messages arrivent de plus en plus vite ; le compteur s'emballe.
      const p = prog(t, 0.15, sec.t1 - 0.15, ease.in2)
      const total = Math.max(1, Math.round(1 + 399 * p))
      const n = Math.min(9, 1 + Math.floor(t * 4.5))
      phone.set(n, total)
      phone.g.position.x = Math.sin(t * 45) * 0.02 * p
    },
  }
})

section('plaintes', ['#3a2a20', '#0e0a08'], (root, sec) => {
  const desk = rbox(8, 0.3, 5, 0.06, M('#5B3A26', { roughness: 0.6 }), root)
  desk.position.set(0, 0.15, 0)
  const folders = [1, 2, 3].map((n, i) => {
    const f = makeFolder(root, n)
    f.g.position.set(0, 0.36 + i * 0.1, 0)
    f.g.rotation.y = (i - 1) * 0.12
    return f
  })
  const tIn = [S('02') - 0.05, W('02', 'plaintes') - 0.05, W('02', 'trois', 1) - 0.1]
  const tStamp = W('02', 'classees') - 0.1
  label('3 PLAINTES', 'big white', { t0: S('02'), t1: sec.t1, x: 540, y: 340, dur: 0.35 })
  return {
    light: { hemi: 0.4, key: 1.0 },
    spot: { pos: [0, 8, 3], target: [0, 0.4, 0], i: 160 },
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [0, 6.2, 3.4], look: [0, 0.3, 0.1], push: 0.3 }]),
    update(t) {
      folders.forEach((f, i) => {
        // Chaque dossier tombe sur le bureau, puis reçoit son tampon.
        const p = prog(t, tIn[i], 0.3, ease.in2)
        f.g.visible = p > 0
        f.g.position.y = 0.36 + i * 0.1 + (1 - p) * 3
        f.g.position.x = (i - 1) * 0.35
        f.stamp(prog(t, tStamp + i * 0.16, 0.18, ease.out3))
      })
    },
  }
})

section('nuit', ['#121a2c', '#03050a'], (root, sec) => {
  makeStreet(root)
  const mere = makeBuddy(root, { suit: '#6b3f52', hair: '#4a2e1e', bun: true, skin: '#EFD3AE' })
  mere.g.position.set(2.4, 0.2, 0.9)
  mere.g.rotation.y = -0.9
  mere.g.scale.setScalar(0.95)
  const tNez = W('03', 'nez') - 0.05
  label('ELLE L’ATTEND', 'pill small', { t0: W('03', 'attendu') - 0.1, t1: tNez - 0.1, x: 540, y: 340 })
  label('NEZ CASSÉ', 'stamp', { t0: tNez, t1: sec.t1, x: 540, y: 520, rot: -8, dur: 0.25 })
  return {
    light: { hemi: 0.18, key: 0.12 },
    spot: NO_SPOT,
    cam: (t) =>
      camAt(t, [
        { t: sec.t0, pos: [7.5, 4.2, 15.5], look: [0.4, 2.6, -2.5], push: 0.5 },
        { t: tNez - 0.05, dur: 0.12, pos: [6.0, 3.6, 11.0], look: [1.0, 2.6, -2.5], push: 0.15 },
      ]),
    update(t) {
      const tense = prog(t, tNez - 0.5, 0.4)
      mere.pose({ lean: 0.05, turn: -0.3, nod: 0.1, aL: [0.12, 0.2 + 0.4 * tense, 0.6 + 1.0 * tense], aR: [0.12, 0.2 + 0.4 * tense, 0.6 + 1.0 * tense] })
      // Secousse de caméra au moment du coup (on ne montre pas le geste).
      const shake = Math.exp(-Math.max(0, t - tNez) * 6) * (t > tNez ? 1 : 0)
      camera.position.x += Math.sin(t * 90) * 0.12 * shake
      camera.position.y += Math.cos(t * 70) * 0.08 * shake
    },
  }
})

section('peine', ['#2a1d16', '#050403'], (root, sec) => {
  label('5<span class="unit">ANS DE PRISON</span>', 'big white', { t0: W('04', 'cinq') - 0.1, t1: sec.t1, x: 540, y: 400, dur: 0.35 })
  return {
    sets: [COURT],
    light: DARK,
    spot: spotOn('accuse', 380),
    cam: (t) => camAt(t, [{ t: sec.t0, pos: [10.6, 4.0, 2.6], look: [7.0, 2.4, -5.2], push: 0.6 }]),
    update(t) {
      courtUpdate(t, { nod: 0.15 })
    },
  }
})

// ------------------------------------------------ 2 · le procès

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
  const pile = group(root)
  ;[1, 2, 3].forEach((n, i) => {
    const f = makeFolder(pile, n)
    f.g.position.y = i * 0.1
    f.g.rotation.set(1.2, (i - 1) * 0.1, 0)
    f.stamp(1)
  })
  const phone = makePhone(root, { w: 1.4, h: 2.8 })
  const shows = [
    evidence(pile, 'avocate', W('06', 'trois') - 0.15, E('06') - 0.05, -1, 0.42),
    evidence(phone.g, 'avocate', W('08', '400') - 0.25, E('08') - 0.05, -1, 0.3),
  ]
  const plan = [
    { t: sec.t0, shot: 'gavel', push: 0.06 },
    { t: S('05') - 0.15, shot: 'procureur', dur: 0.45 },
    { t: S('06') - 0.15, shot: 'avocate', dur: 0.5 },
    { t: S('07') - 0.15, shot: 'procureur', dur: 0.5 },
    { t: W('07', 'elle') - 0.1, shot: 'accuseClose', dur: 0.4 },
    { t: S('08') - 0.15, shot: 'avocate', dur: 0.5 },
    { t: S('09') - 0.12, shot: 'procureur', dur: 0.4 },
    { t: S('10') - 0.1, shot: 'avocate', dur: 0.4 },
  ]
  const shotAt = (t) => plan.filter((p) => p.t <= t).at(-1).shot

  label('LA LOI DU PLUS FORT', 'pill red', { t0: W('05', 'loi') - 0.1, t1: E('05') + 0.1, x: 540, y: 420, rot: -2 })
  label('3<span class="unit">FOIS</span>', 'big white', { t0: W('06', 'trois') - 0.1, t1: E('06'), x: 540, y: 380 })
  label('6 MOIS SANS ALLER EN COURS', 'pill yellow', { t0: W('06', 'six') - 0.1, t1: E('06'), x: 540, y: 520, rot: 2 })
  label('17<span class="unit">ANS</span>', 'big white', { t0: W('07', '17') - 0.1, t1: E('07'), x: 330, y: 400, dur: 0.35 })
  label('45<span class="unit">ANS</span>', 'big white', { t0: W('07', '45') - 0.1, t1: E('07'), x: 760, y: 400, dur: 0.35 })
  label('SEULE, EN PLEINE NUIT', 'pill red', { t0: W('07', 'seule') - 0.1, t1: E('07'), x: 540, y: 540, rot: -2 })
  const msg = label('0', 'big white', { t0: W('08', '400') - 0.1, t1: E('08'), x: 540, y: 370, dur: 0.3 })
  msg.update = (t) => {
    msg.el.textContent = String(Math.round(400 * ease.out3(prog(t, msg.t0, 0.8))))
  }
  label('MESSAGES D’INSULTES', 'pill red', { t0: W('08', 'messages') - 0.1, t1: W('08', 'savait') - 0.15, x: 540, y: 510, rot: -2 })
  label('IL SAVAIT', 'pill red', { t0: W('08', 'savait') - 0.1, t1: E('08'), x: 540, y: 510, rot: 2 })
  label('La violence ne répare rien.', 'quote red', { t0: S('09') + 0.05, t1: E('09') + 0.15, x: 540, y: 500, dur: 0.3 })
  label('Une plainte classée non plus.', 'quote blue', { t0: S('10') + 0.05, t1: E('10') + 0.4, x: 540, y: 500, dur: 0.3 })

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
      }
      phone.set(Math.min(9, 1 + Math.floor((t - W('08', '400')) * 8)), Math.max(1, Math.round(400 * ease.out3(prog(t, W('08', '400') - 0.1, 0.8)))))
    },
  }
})

// ------------------------------------------------ 3 · le vote

section('vote', ['#2a1d16', '#070504'], (root, sec) => {
  const tVote = W('11', 'coupable') - 0.1
  const tNon = W('11', 'non') - 0.1
  const tQ = W('11', 'et') - 0.1
  label('TU ES LE JURÉ', 'big white', { t0: W('11', 'jure') - 0.15, t1: Infinity, x: 540, y: 330, dur: 0.5 }).el.style.fontSize = '110px'
  label('COUPABLE', 'vote red', { t0: tVote, t1: Infinity, x: 540, y: 560, rot: -3 })
  label('NON COUPABLE', 'vote blue', { t0: tNon, t1: Infinity, x: 540, y: 790, rot: 3 })
  label('Et toi, à sa place, tu aurais fait quoi ?', 'pill yellow', { t0: tQ, t1: Infinity, x: 540, y: 1150, wobble: 1.2 }).el.style.fontSize = '46px'
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
const meterOn = [S('05') + 0.2, E('10') + 0.4]

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
    const audio = new Audio('../build/affaire-02/audio.wav')
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
