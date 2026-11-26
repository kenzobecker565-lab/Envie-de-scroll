/**
 * ============================================================================
 *  « Sauf moi » — projet séparé (vidéo pour le frère), ≈ 1 min 50, 1080 × 1920
 * ============================================================================
 *  Une ville en 3D « jouet » (blocs, couleurs chaudes, guirlandes de nuit) où
 *  tout le monde a les yeux sur son téléphone, sauf le héros. Il apprend la
 *  ville par cœur ; le soir de la grande panne, c'est lui qui guide tout le
 *  monde à la lampe torche.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 *  Les instants viennent de la voix (timeline.json) via cues.js.
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { clamp, ease, lerp, prog, rng } from '../engine.js'
import { FPS, HEIGHT, WIDTH, makeCues, norm } from './cues.js'

await document.fonts.load('900 80px "Figtree Variable"')
const tl = await (await fetch('timeline.json')).json()
const C = makeCues(tl)
const { S, E, W } = C
const SHOT = Object.fromEntries(C.shots.map((s) => [s.id, s]))
const V3 = (x, y, z) => new THREE.Vector3(x, y, z)
const smooth = (t, t0, d) => prog(t, t0, d, ease.io3)
const pop = (t, t0, d = 0.35) => (t < t0 ? 0 : ease.back(2.2)(clamp((t - t0) / d)))

// ================================================================== rendu

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true })
renderer.setPixelRatio(1)
renderer.setSize(WIDTH, HEIGHT, false)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.05
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, WIDTH / HEIGHT, 0.1, 600)

// Ciels (fond fixe) : nuit étoilée, aube, jour, noir.
function skyTex(stops, stars = 0) {
  const c = document.createElement('canvas')
  c.width = 270
  c.height = 480
  const g = c.getContext('2d')
  const gr = g.createLinearGradient(0, 0, 0, 480)
  for (const [o, col] of stops) gr.addColorStop(o, col)
  g.fillStyle = gr
  g.fillRect(0, 0, 270, 480)
  const r = rng(7)
  for (let i = 0; i < stars; i++) {
    g.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`
    const s = r() < 0.15 ? 2 : 1
    g.fillRect(r() * 270, r() * 300, s, s)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
const SKY = {
  night: skyTex([[0, '#0b1030'], [0.55, '#1d2a66'], [1, '#3b3f8a']], 160),
  dawn: skyTex([[0, '#4a5aa8'], [0.5, '#f29a7a'], [1, '#ffd59a']], 10),
  day: skyTex([[0, '#5fb4f0'], [1, '#cfeeff']]),
  black: skyTex([[0, '#020308'], [1, '#05070f']], 40),
}

const hemi = new THREE.HemisphereLight(0x8aa0ff, 0x2a2030, 0.9)
const moon = new THREE.DirectionalLight(0xb8c6ff, 0.6)
moon.position.set(-40, 80, 30)
const key = new THREE.PointLight(0xffb36b, 0, 30, 1.6)
const fillL = new THREE.PointLight(0x9fd0ff, 0, 18, 1.6)
const torch = new THREE.SpotLight(0xfff0c0, 0, 70, 0.42, 0.45, 1.1)
scene.add(hemi, moon, key, fillL, torch, torch.target)

// ============================================================ matières

const LAMB = new Map()
const mat = (color, o = {}) => {
  const k = color + JSON.stringify(o)
  if (!LAMB.has(k)) LAMB.set(k, new THREE.MeshLambertMaterial({ color, ...o }))
  return LAMB.get(k)
}
const box = (w, h, d, m, parent, x = 0, y = 0, z = 0) => {
  const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)
  me.position.set(x, y, z)
  if (parent) parent.add(me)
  return me
}
const rbox = (w, h, d, r, m, parent, x = 0, y = 0, z = 0) => {
  const me = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), m)
  me.position.set(x, y, z)
  if (parent) parent.add(me)
  return me
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
// Effets globaux pilotés par plan (allumé = 1, panne = 0).
const GLOW = { windows: 1, lamps: 1, garland: 1, screens: 1 }

// ============================================================ les visages

const FACE_CACHE = new Map()
/** Visage dessiné (yeux noirs ovales, sourcils épais, bouche), fond transparent. */
function faceTex(o = {}) {
  const { eyes = 'open', brows = 'neutral', mouth = 'flat', look = [0, 0], mustache = false, glasses = false, blush = true } = o
  const k = JSON.stringify(o)
  if (FACE_CACHE.has(k)) return FACE_CACHE.get(k)
  const t = canvasTex(256, 256, (g) => {
    const ink = '#22160f'
    const ex = [84, 172]
    const ey = 120 + look[1] * 14
    if (blush) {
      g.fillStyle = 'rgba(255,120,110,0.35)'
      for (const x of [60, 196]) {
        g.beginPath()
        g.ellipse(x, 168, 20, 12, 0, 0, Math.PI * 2)
        g.fill()
      }
    }
    for (const x0 of ex) {
      const x = x0 + look[0] * 10
      if (eyes === 'closed' || eyes === 'happy') {
        g.strokeStyle = ink
        g.lineWidth = 9
        g.lineCap = 'round'
        g.beginPath()
        if (eyes === 'closed') g.arc(x, ey - 4, 16, 0.15 * Math.PI, 0.85 * Math.PI)
        else g.arc(x, ey + 10, 16, 1.15 * Math.PI, 1.85 * Math.PI)
        g.stroke()
      } else {
        const big = eyes === 'wide' ? 1.25 : eyes === 'half' ? 0.6 : 1
        g.fillStyle = ink
        g.beginPath()
        g.ellipse(x, ey, 17 * (eyes === 'wide' ? 1.15 : 1), 23 * big, 0, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = '#fff'
        g.beginPath()
        g.arc(x - 5, ey - 8 * big, 6, 0, Math.PI * 2)
        g.fill()
        if (eyes === 'half') {
          g.fillStyle = 'rgba(0,0,0,0)'
          g.clearRect(x - 22, ey - 32, 44, 22)
          g.strokeStyle = ink
          g.lineWidth = 7
          g.beginPath()
          g.moveTo(x - 20, ey - 10)
          g.lineTo(x + 20, ey - 10)
          g.stroke()
        }
      }
    }
    // Sourcils.
    g.strokeStyle = ink
    g.lineWidth = 12
    g.lineCap = 'round'
    const B = { neutral: [0, 0, 0], sad: [10, -6, 0], angry: [-10, 8, 0], up: [0, 0, -14], worried: [12, -8, -8], focus: [-6, 4, 2] }[brows] ?? [0, 0, 0]
    for (const [i, x] of ex.entries()) {
      const s = i === 0 ? 1 : -1
      const inner = x + s * 18
      const outer = x - s * 18
      g.beginPath()
      g.moveTo(outer, ey - 44 + B[2] + B[1] * 0.2)
      g.lineTo(inner, ey - 44 + B[2] - B[0])
      g.stroke()
    }
    if (mustache) {
      g.fillStyle = '#3a2416'
      g.beginPath()
      g.ellipse(108, 176, 26, 12, -0.2, 0, Math.PI * 2)
      g.ellipse(148, 176, 26, 12, 0.2, 0, Math.PI * 2)
      g.fill()
    }
    // Bouche.
    g.strokeStyle = ink
    g.fillStyle = '#5a1f1a'
    g.lineWidth = 9
    g.beginPath()
    const my = mustache ? 200 : 192
    if (mouth === 'smile') g.arc(128, my - 18, 24, 0.2 * Math.PI, 0.8 * Math.PI)
    else if (mouth === 'grin') {
      g.moveTo(98, my - 6)
      g.quadraticCurveTo(128, my + 26, 158, my - 6)
      g.closePath()
      g.fill()
    } else if (mouth === 'sad') g.arc(128, my + 14, 20, 1.2 * Math.PI, 1.8 * Math.PI)
    else if (mouth === 'o') g.ellipse(128, my, 10, 13, 0, 0, Math.PI * 2)
    else if (mouth === 'open') g.ellipse(128, my, 18, 14, 0, 0, Math.PI * 2)
    else {
      g.moveTo(112, my)
      g.lineTo(144, my)
    }
    if (mouth === 'o' || mouth === 'open') g.fill()
    else if (mouth !== 'grin') g.stroke()
    if (glasses) {
      g.strokeStyle = '#1b1b1b'
      g.lineWidth = 8
      for (const x of ex) {
        roundRect(g, x - 32, ey - 30, 64, 56, 14)
        g.stroke()
      }
      g.beginPath()
      g.moveTo(116, ey - 6)
      g.lineTo(140, ey - 6)
      g.stroke()
    }
  })
  FACE_CACHE.set(k, t)
  return t
}

// =================================================== personnages en blocs

const PAL = ['#e85d5d', '#4a90d9', '#f2b632', '#58b368', '#a066c8', '#ef8a3c', '#3cb8b0', '#d65a9c', '#6c7a89', '#c9a27e']
const SKINS = ['#f2c49b', '#e0a87e', '#b97a52', '#8a5636', '#f6d2b5']

/**
 * Personnage en blocs : jambes, torse, bras, grosse tête arrondie avec un
 * visage dessiné. update(t, état) pose le personnage.
 */
function makeBlocky(o = {}) {
  const shirt = o.shirt ?? '#4a90d9'
  const pants = o.pants ?? '#2b3550'
  const skin = o.skin ?? '#f2c49b'
  const root = new THREE.Group()
  const body = new THREE.Group()
  root.add(body)
  const legs = [-0.2, 0.2].map((x) => {
    const p = new THREE.Group()
    p.position.set(x, 0.9, 0)
    box(0.36, 0.86, 0.4, mat(pants), p, 0, -0.43, 0)
    box(0.4, 0.14, 0.5, mat('#2a2220'), p, 0, -0.84, 0.05)
    body.add(p)
    return p
  })
  rbox(0.98, 0.84, 0.52, 0.08, mat(shirt), body, 0, 1.3, 0)
  const arms = [-0.64, 0.64].map((x) => {
    const p = new THREE.Group()
    p.position.set(x, 1.62, 0)
    rbox(0.3, 0.74, 0.32, 0.06, mat(shirt), p, 0, -0.34, 0)
    box(0.26, 0.2, 0.28, mat(skin), p, 0, -0.78, 0)
    body.add(p)
    return p
  })
  const neck = new THREE.Group()
  neck.position.set(0, 1.72, 0)
  body.add(neck)
  const head = rbox(0.92, 0.86, 0.82, 0.2, mat(skin), neck, 0, 0.44, 0)
  const faceMat = new THREE.MeshLambertMaterial({ map: faceTex({}), transparent: true })
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.82), faceMat)
  face.position.set(0, 0.42, 0.415)
  neck.add(face)
  // Coiffures et chapeaux.
  const hc = o.hairColor ?? '#3b2416'
  if (o.hat === 'beanie') {
    rbox(0.98, 0.42, 0.88, 0.16, mat(o.hatColor ?? '#2e9e5b'), neck, 0, 0.88, -0.01)
    box(1.0, 0.14, 0.9, mat(o.hatBand ?? '#26804a'), neck, 0, 0.72, 0)
    const pom = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('#f4f1ea'))
    pom.position.set(0, 1.14, 0)
    neck.add(pom)
  } else if (o.hat === 'cap') {
    rbox(0.96, 0.26, 0.86, 0.1, mat(o.hatColor ?? '#2f5fa8'), neck, 0, 0.92, 0)
    box(0.7, 0.06, 0.36, mat(o.hatColor ?? '#2f5fa8'), neck, 0, 0.82, 0.55)
    box(0.98, 0.08, 0.88, mat('#ffd43b'), neck, 0, 0.8, 0)
  } else if (o.hair === 'bun') {
    rbox(0.98, 0.26, 0.88, 0.1, mat(hc), neck, 0, 0.9, -0.02)
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(hc))
    b.position.set(0, 1.0, -0.38)
    neck.add(b)
  } else if (o.hair === 'long') {
    rbox(0.98, 0.26, 0.88, 0.1, mat(hc), neck, 0, 0.9, -0.02)
    box(0.98, 0.8, 0.2, mat(hc), neck, 0, 0.45, -0.38)
  } else if (o.hair === 'bald') {
    box(0.95, 0.18, 0.5, mat(hc), neck, 0, 0.66, -0.2)
  } else if (o.hair !== 'none') {
    rbox(0.96, 0.24, 0.86, 0.1, mat(hc), neck, 0, 0.9, -0.02)
  }
  // Accessoires.
  const extra = {}
  if (o.sash) {
    const s = new THREE.Group()
    s.position.set(0, 1.32, 0.27)
    s.rotation.z = -0.75
    for (const [k, c] of ['#2850a8', '#f4f1ea', '#d63a3a'].entries()) box(0.12, 1.2, 0.04, mat(c), s, -0.12 + k * 0.12, 0, 0)
    body.add(s)
  }
  if (o.bag) {
    const b = box(0.5, 0.45, 0.22, mat('#7a4a28'), body, 0.62, 1.05, 0.1)
    b.rotation.z = 0.1
  }
  if (o.jacketStripe) box(1.0, 0.1, 0.54, mat(o.jacketStripe), body, 0, 1.12, 0)
  // Le téléphone (dans le repère du corps), écran lumineux.
  const phone = new THREE.Group()
  box(0.34, 0.58, 0.06, mat('#15171c'), phone)
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff })
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.5), screenMat)
  screen.position.z = 0.032
  phone.add(screen)
  phone.visible = false
  body.add(phone)
  // Bandeau sur les yeux.
  const band = box(0.96, 0.2, 0.86, mat('#d63a3a'), neck, 0, 0.5, 0)
  band.visible = false
  // Lampe torche (main droite).
  const lamp = new THREE.Group()
  const lc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 12), mat('#2b2b30'))
  lc.rotation.x = Math.PI / 2
  lamp.add(lc)
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }))
  lens.position.z = 0.26
  lamp.add(lens)
  lamp.visible = false
  body.add(lamp)
  // Badge doré (fin).
  const badge = new THREE.Group()
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), mat('#ffcc33', { emissive: 0x553300 }))
  disc.rotation.x = Math.PI / 2
  badge.add(disc)
  box(0.12, 0.2, 0.02, mat('#2850a8'), badge, -0.05, -0.2, -0.01).rotation.z = 0.3
  box(0.12, 0.2, 0.02, mat('#2850a8'), badge, 0.05, -0.2, -0.01).rotation.z = -0.3
  badge.position.set(-0.24, 1.48, 0.29)
  badge.visible = false
  body.add(badge)

  const faceBase = { mustache: !!o.mustache, glasses: !!o.glasses, blush: o.blush ?? true }
  let faceKey = ''
  function update(t, st = {}) {
    const { x = 0, y = 0, z = 0, ry = 0, scale = 1, walk = null, stride = 1, armR = null, armL = null, headPitch = 0, headYaw = 0, headRoll = 0, lean = 0, hold = null, face = {}, blinkSeed = 0 } = st
    root.position.set(x, y, z)
    root.rotation.y = ry
    root.scale.setScalar(scale)
    body.rotation.x = lean
    let bob = 0
    let la = [0, 0]
    let aa = [0, 0]
    if (walk !== null) {
      const s = Math.sin(walk)
      la = [s * 0.6 * stride, -s * 0.6 * stride]
      aa = [-s * 0.5 * stride, s * 0.5 * stride]
      bob = Math.abs(Math.cos(walk)) * 0.07 * stride
    }
    body.position.y = bob
    legs[0].rotation.x = la[0]
    legs[1].rotation.x = la[1]
    // Bras : [tangage (négatif = vers l'avant), roulis].
    const setArm = (a, v, def, side) => {
      a.rotation.x = v ? v[0] : def
      a.rotation.z = v ? v[1] * side : 0.06 * side
    }
    phone.visible = hold === 'phone' || hold === 'phoneUp' || hold === 'phoneOut'
    lamp.visible = hold === 'torch'
    if (hold === 'phone') {
      phone.position.set(0.05, 1.62, 0.62)
      phone.rotation.set(-0.35, Math.PI, 0)
      setArm(arms[0], [-1.25, -0.35], 0, -1)
      setArm(arms[1], [-1.25, -0.35], 0, 1)
    } else if (hold === 'phoneUp') {
      phone.position.set(0.55, 2.75, 0.35)
      phone.rotation.set(0.15, 0, 0)
      setArm(arms[0], armL ?? [0, 0], aa[0], -1)
      setArm(arms[1], [-2.75, 0.05], 0, 1)
    } else if (hold === 'phoneOut') {
      // Bras tendu, l'écran vers soi (on filme devant).
      phone.position.set(0.5, 1.75, 0.95)
      phone.rotation.set(0, Math.PI, 0)
      setArm(arms[0], armL ?? [0, 0], aa[0], -1)
      setArm(arms[1], [-1.5, -0.15], 0, 1)
    } else if (hold === 'torch') {
      lamp.position.set(0.66, 1.35, 0.62)
      lamp.rotation.set(-0.05, 0, 0)
      setArm(arms[0], armL ?? null, aa[0], -1)
      setArm(arms[1], [-1.45, 0.02], 0, 1)
    } else {
      setArm(arms[0], armL, aa[0], -1)
      setArm(arms[1], armR, aa[1], 1)
    }
    neck.rotation.set(headPitch, headYaw, headRoll)
    // Clignement : un battement de 0,12 s toutes les ~3 s.
    const blink = (((t + blinkSeed * 1.7) % 3.1) + 3.1) % 3.1 < 0.12
    const f = { ...faceBase, ...face }
    if (blink && !f.eyes) f.eyes = 'closed'
    const k = JSON.stringify(f)
    if (k !== faceKey) {
      faceMat.map = faceTex(f)
      faceMat.needsUpdate = true
      faceKey = k
    }
    screenMat.color.setRGB(0.62 * GLOW.screens + 0.02, 0.85 * GLOW.screens + 0.02, 1.0 * GLOW.screens + 0.03)
  }
  return { root, body, neck, arms, legs, phone, screenMat, band, lamp, badge, update }
}

/** Chien en blocs (sable), queue qui remue. */
function makeDog() {
  const root = new THREE.Group()
  const fur = mat('#d9a55b')
  const dark = mat('#7a4a28')
  rbox(0.5, 0.45, 0.95, 0.1, fur, root, 0, 0.6, 0)
  const legs = [[-0.16, 0.3], [0.16, 0.3], [-0.16, -0.3], [0.16, -0.3]].map(([x, z]) => {
    const p = new THREE.Group()
    p.position.set(x, 0.45, z)
    box(0.14, 0.45, 0.14, fur, p, 0, -0.22, 0)
    root.add(p)
    return p
  })
  const head = new THREE.Group()
  head.position.set(0, 0.95, 0.5)
  root.add(head)
  rbox(0.5, 0.46, 0.46, 0.1, fur, head, 0, 0, 0)
  rbox(0.28, 0.22, 0.26, 0.06, mat('#f0d3a0'), head, 0, -0.08, 0.3)
  box(0.1, 0.08, 0.06, mat('#1b1410'), head, 0, -0.02, 0.44)
  for (const x of [-0.12, 0.12]) box(0.07, 0.09, 0.04, mat('#1b1410'), head, x, 0.08, 0.24)
  const ears = [-0.24, 0.24].map((x) => {
    const e = box(0.1, 0.26, 0.18, dark, head, x, 0.12, -0.02)
    return e
  })
  const tail = new THREE.Group()
  tail.position.set(0, 0.75, -0.48)
  box(0.08, 0.08, 0.38, fur, tail, 0, 0.1, -0.15).rotation.x = -0.7
  root.add(tail)
  // Collier rouge.
  box(0.52, 0.08, 0.3, mat('#d63a3a'), root, 0, 0.82, 0.38)
  function update(t, { x = 0, z = 0, ry = 0, walk = null, sit = false, tilt = 0, wag = 1, scale = 1 } = {}) {
    root.position.set(x, 0, z)
    root.rotation.y = ry
    root.scale.setScalar(scale)
    const s = walk === null ? 0 : Math.sin(walk)
    legs.forEach((l, i) => (l.rotation.x = (i % 3 === 0 ? s : -s) * 0.6))
    root.rotation.x = sit ? -0.35 : 0
    root.position.y = sit ? 0.1 : walk === null ? 0 : Math.abs(Math.cos(walk)) * 0.05
    head.rotation.set(sit ? 0.3 : 0, 0, tilt)
    ears.forEach((e, i) => (e.rotation.z = (i ? -1 : 1) * (0.2 + 0.15 * Math.sin(t * 3))))
    tail.rotation.y = Math.sin(t * 16) * 0.6 * wag
  }
  return { root, update }
}

/** Pigeon endormi. */
function makePigeon(parent, x, y, z, ry = 0) {
  const g = new THREE.Group()
  rbox(0.34, 0.3, 0.46, 0.1, mat('#8e97a8'), g, 0, 0.17, 0)
  rbox(0.22, 0.22, 0.22, 0.08, mat('#6f7a8e'), g, 0, 0.38, 0.14)
  box(0.06, 0.05, 0.1, mat('#f2a33a'), g, 0, 0.36, 0.28)
  box(0.18, 0.03, 0.02, mat('#1b1410'), g, 0, 0.42, 0.255)
  g.position.set(x, y, z)
  g.rotation.y = ry
  parent.add(g)
  return g
}

// ===================================================================== la ville

const city = new THREE.Group()
scene.add(city)
const P = 40 // pas des îlots
const STREET = 10
const BLOCK = P - STREET
// Façades : une texture de fenêtres (8 × 8 travées), répétée.
const winR = rng(11)
const WIN_LIT = []
const facadeMap = canvasTex(512, 512, (g) => {
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      g.fillStyle = '#3a4466'
      roundRect(g, i * 64 + 16, j * 64 + 12, 32, 40, 6)
      g.fill()
      g.fillStyle = 'rgba(0,0,0,0.18)'
      g.fillRect(i * 64 + 12, j * 64 + 52, 40, 6)
    }
})
const facadeEmit = canvasTex(512, 512, (g) => {
  g.fillStyle = '#000'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++) {
      const on = winR() < 0.55
      WIN_LIT.push(on)
      if (!on) continue
      g.fillStyle = ['#ffc879', '#ffd9a0', '#ffb45e', '#ffe6b8'][Math.floor(winR() * 4)]
      roundRect(g, i * 64 + 16, j * 64 + 12, 32, 40, 6)
      g.fill()
    }
})
for (const t of [facadeMap, facadeEmit]) t.wrapS = t.wrapT = THREE.RepeatWrapping
const FACADE_COLORS = ['#f3e3c8', '#e8b89a', '#c9d6e3', '#f2c6c2', '#d8e6c8', '#f4d58d', '#b9a7d6', '#e6a173']
const facadeMats = FACADE_COLORS.map((c) => new THREE.MeshLambertMaterial({ color: c, map: facadeMap, emissive: 0xffffff, emissiveMap: facadeEmit, emissiveIntensity: 1 }))
const roofMat = mat('#5a4a5e')

function building(x, z, w, d, h, ci) {
  const geo = new THREE.BoxGeometry(w, h, d)
  const uv = geo.attributes.uv
  // Faces : +x, -x, +y, -y, +z, -z (4 sommets chacune). Une travée = 4 m.
  const faceW = [d, d, 0, 0, w, w]
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k
      if (!faceW[f]) uv.setXY(i, 0.001, 0.001)
      else uv.setXY(i, (uv.getX(i) * faceW[f]) / 32 + ci * 0.25, (uv.getY(i) * h) / 32)
    }
  const m = new THREE.Mesh(geo, facadeMats[ci % facadeMats.length])
  m.position.set(x, h / 2, z)
  city.add(m)
  box(w + 0.6, 0.5, d + 0.6, roofMat, city, x, h + 0.25, z)
  return m
}

// Le sol : bitume, trottoirs, place pavée.
const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), mat('#34303c'))
ground.rotation.x = -Math.PI / 2
city.add(ground)
const blocks = []
for (let bx = -3; bx <= 3; bx++)
  for (let bz = -4; bz <= 4; bz++) {
    const cx = bx * P
    const cz = bz * P
    const plaza = bx === 0 && bz === 0
    box(BLOCK, 0.2, BLOCK, mat(plaza ? '#c8b89c' : '#8d8794'), city, cx, 0.1, cz)
    if (plaza) continue
    blocks.push([cx, cz])
    const r = rng(100 + bx * 17 + bz * 31)
    const half = BLOCK / 2 - 1
    // 2 × 2 immeubles par îlot (sauf les façades « métier » posées à part).
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const special = (bx === 1 && bz === 0 && sx === -1) || (bx === 1 && bz === -1 && sx === -1) || (bx === 0 && bz === 1 && sz === -1)
        if (special) continue
        const h = 9 + Math.floor(r() * 5) * 3
        building(cx + sx * half / 2, cz + sz * half / 2, half - 0.4, half - 0.4, h, Math.floor(r() * 8))
      }
  }

// Boutiques et bâtiments repères (façade côté rue).
function signTex(text, bg, fg, w = 1024, h = 192) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg
    roundRect(g, 0, 0, w, h, 30)
    g.fill()
    g.fillStyle = fg
    g.font = `900 ${Math.round(h * 0.52)}px Figtree Variable`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, w / 2, h / 2 + 6)
  })
}
function shopfront({ x, z, ry, w, h, color, sign, signBg, signFg, awning }) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = ry
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 13), new THREE.MeshLambertMaterial({ color, map: facadeMap, emissive: 0xffffff, emissiveMap: facadeEmit }))
  const uv = m.geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) {
    const f = Math.floor(i / 4)
    if (f === 2 || f === 3) uv.setXY(i, 0.001, 0.001)
    else uv.setXY(i, (uv.getX(i) * (f < 2 ? 13 : w)) / 32, (uv.getY(i) * h) / 32)
  }
  m.position.set(0, h / 2, -6.5)
  g.add(m)
  facadeMats.push(m.material)
  // Rez-de-chaussée : vitrine lumineuse, porte, enseigne, store.
  box(w, 4, 0.3, mat('#f4efe6'), g, 0, 2, 0.1)
  const vit = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.55, 2.4), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }))
  vit.position.set(-w * 0.15, 1.8, 0.27)
  g.add(vit)
  box(1.6, 2.8, 0.1, mat('#6a3f26'), g, w * 0.3, 1.4, 0.28)
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, w * 0.86 * 0.1875), new THREE.MeshBasicMaterial({ map: signTex(sign, signBg, signFg) }))
  s.position.set(0, 4.6, 0.32)
  g.add(s)
  if (awning) {
    for (let i = 0; i < 8; i++) {
      const a = box(w / 8, 0.12, 1.6, mat(i % 2 ? '#f4efe6' : awning), g, -w / 2 + w / 16 + (i * w) / 8, 3.6, 0.9)
      a.rotation.x = 0.35
    }
  }
  city.add(g)
  return { g, vit }
}
// Boulangerie : îlot (40, 0), façade x = 25 tournée vers la rue x = 20.
const BAKERY = shopfront({ x: 25.2, z: 2, ry: -Math.PI / 2, w: 13, h: 12, color: '#f4d58d', sign: 'BOULANGERIE', signBg: '#7a3b1e', signFg: '#ffe6b8', awning: '#d63a3a' })
// Office du tourisme : îlot (40, -40).
const OFFICE = shopfront({ x: 25.2, z: -40, ry: -Math.PI / 2, w: 13, h: 15, color: '#c9d6e3', sign: 'OFFICE DU TOURISME', signBg: '#2850a8', signFg: '#ffffff', awning: '#2850a8' })
// Mairie : îlot (0, 40), façade z = 25 tournée vers la place.
const MAIRIE = shopfront({ x: 0, z: 25.2, ry: Math.PI, w: 26, h: 16, color: '#f3e3c8', sign: 'MAIRIE', signBg: '#f4efe6', signFg: '#2850a8', awning: null })
for (const [x, c] of [[-2, '#2850a8'], [0, '#f4f1ea'], [2, '#d63a3a']]) {
  const f = box(1.9, 2.6, 0.06, mat(c), MAIRIE.g, x, 9, 0.6)
  f.rotation.x = 0.1
}
// Horloge de l'office.
const clockMat = new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => {
  g.fillStyle = '#fff'
  g.beginPath()
  g.arc(128, 128, 120, 0, Math.PI * 2)
  g.fill()
  g.lineWidth = 14
  g.strokeStyle = '#1b1410'
  g.stroke()
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(128, 128)
  g.lineTo(128, 48)
  g.moveTo(128, 128)
  g.lineTo(58, 128)
  g.stroke()
}) })
const officeClock = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), clockMat)
officeClock.position.set(0, 6.4, 0.35)
OFFICE.g.add(officeClock)

// La fontaine, au centre de la place.
const fountain = new THREE.Group()
{
  const stone = mat('#d9d2c4')
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.9, 32), stone)
  basin.position.y = 0.45
  fountain.add(basin)
  const water = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.1, 32), new THREE.MeshLambertMaterial({ color: 0x4aa8e0, emissive: 0x1a4a70 }))
  water.position.y = 0.85
  fountain.add(water)
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.6, 16), stone)
  col.position.y = 1.9
  fountain.add(col)
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.6, 0.5, 24), stone)
  bowl.position.y = 3.2
  fountain.add(bowl)
}
city.add(fountain)

// Lampadaires le long des rues (instanciés).
const LAMPS = []
for (let k = -3; k <= 3; k++) {
  const sx = k * P + P / 2
  for (let z = -150; z <= 150; z += 14) for (const s of [-1, 1]) LAMPS.push([sx + s * 4.2, z + (s > 0 ? 7 : 0)])
  for (let x = -130; x <= 130; x += 14) for (const s of [-1, 1]) LAMPS.push([x + (s > 0 ? 7 : 0), sx + s * 4.2])
}
const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 5, 8)
poleGeo.translate(0, 2.5, 0)
const poles = new THREE.InstancedMesh(poleGeo, mat('#2a2d3a'), LAMPS.length)
const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd28a })
const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 12, 10), lampMat, LAMPS.length)
{
  const m = new THREE.Matrix4()
  LAMPS.forEach(([x, z], i) => {
    poles.setMatrixAt(i, m.makeTranslation(x, 0, z))
    heads.setMatrixAt(i, m.makeTranslation(x, 5.2, z))
  })
}
city.add(poles, heads)

// Guirlandes : ampoules colorées en chaînette au-dessus des rues.
const BULBS = []
{
  const r = rng(5)
  const span = (a, b, sag, n) => {
    for (let i = 0; i <= n; i++) {
      const u = i / n
      const p = a.clone().lerp(b, u)
      p.y -= sag * 4 * u * (1 - u)
      BULBS.push([p, Math.floor(r() * 5)])
    }
  }
  // Rue principale (x = 20) et rue x = -20 : en travers tous les 7 m.
  for (const sx of [20, -20]) for (let z = -100; z <= 100; z += 7) span(V3(sx - 5, 8.5, z), V3(sx + 5, 8.5, z + 2), 1.4, 9)
  // Sur la place : en étoile depuis la fontaine.
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2
    span(V3(0, 9, 0), V3(Math.cos(a) * 15, 7.5, Math.sin(a) * 15), 1.2, 14)
  }
}
const BULB_COLORS = ['#ffcc44', '#ff6b6b', '#6be0ff', '#8cff8c', '#ff9ef0'].map((c) => new THREE.Color(c))
const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 8, 6), bulbMat, BULBS.length)
{
  const m = new THREE.Matrix4()
  BULBS.forEach(([p, c], i) => {
    bulbs.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z))
    bulbs.setColorAt(i, BULB_COLORS[c])
  })
}
city.add(bulbs)

// La scène du concert (côté nord de la place), avec son grand écran.
const stage = new THREE.Group()
stage.position.set(0, 0, -11)
city.add(stage)
box(22, 1.4, 7, mat('#2a2430'), stage, 0, 0.7, -1)
box(22, 0.6, 1, mat('#1b1620'), stage, 0, 12, -3.5)
for (const x of [-11, 11]) box(0.6, 12, 0.6, mat('#3a3440'), stage, x, 6, -3.5)
let bigScreenCtx = null
const bigScreenTex = canvasTex(512, 256, (g) => (bigScreenCtx = g))
const bigScreen = new THREE.Mesh(new THREE.PlaneGeometry(13, 6.5), new THREE.MeshBasicMaterial({ map: bigScreenTex }))
bigScreen.position.set(0, 7.5, -3.6)
stage.add(bigScreen)
const beams = []
for (let i = 0; i < 6; i++) {
  const geo = new THREE.ConeGeometry(2.4, 18, 20, 1, true)
  geo.translate(0, -9, 0)
  const b = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: [0xff4fa0, 0x4fd2ff, 0xffd84f][i % 3], transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
  b.position.set(-9 + i * 3.6, 11.5, -3)
  stage.add(b)
  beams.push(b)
}
function drawBigScreen(text, sub = '', on = 1) {
  const g = bigScreenCtx
  g.fillStyle = on ? '#10162e' : '#000'
  g.fillRect(0, 0, 512, 256)
  if (on) {
    g.fillStyle = '#ffffff'
    g.font = '900 120px Figtree Variable'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(text, 256, 118)
    if (sub) {
      g.font = '900 36px Figtree Variable'
      g.fillStyle = '#ff6bd5'
      g.fillText(sub, 256, 214)
    }
  }
  bigScreenTex.needsUpdate = true
}

// La foule (instanciée) : corps, têtes, écrans levés.
const CROWD_N = 420
const crowdBody = new THREE.InstancedMesh(new RoundedBoxGeometry(0.98, 1.9, 0.52, 2, 0.08), mat('#ffffff'), CROWD_N)
const crowdHead = new THREE.InstancedMesh(new RoundedBoxGeometry(0.9, 0.84, 0.8, 2, 0.18), mat('#ffffff'), CROWD_N)
const crowdScreenMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff })
const crowdScreen = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.56, 0.06), crowdScreenMat, CROWD_N)
const CROWD = []
{
  const r = rng(21)
  for (let i = 0; i < CROWD_N; i++) {
    CROWD.push({ x: 0, z: 0, ph: r() * 6.28, shirt: new THREE.Color(PAL[Math.floor(r() * PAL.length)]), skin: new THREE.Color(SKINS[Math.floor(r() * SKINS.length)]), h: 0.92 + r() * 0.16, rx: r(), rz: r() })
    crowdBody.setColorAt(i, CROWD[i].shirt)
    crowdHead.setColorAt(i, CROWD[i].skin)
  }
}
const crowd = new THREE.Group()
crowd.add(crowdBody, crowdHead, crowdScreen)
scene.add(crowd)
const _m = new THREE.Matrix4()
const _q = new THREE.Quaternion()
const _e = new THREE.Euler()
/** Place la foule : positions données par pos(i) → {x, z, ry}, téléphones levés ou non. */
function layoutCrowd(t, pos, { phones = 1, look = 0 } = {}) {
  for (let i = 0; i < CROWD_N; i++) {
    const c = CROWD[i]
    const p = pos(i, c)
    if (!p) {
      _m.makeScale(0, 0, 0)
      crowdBody.setMatrixAt(i, _m)
      crowdHead.setMatrixAt(i, _m)
      crowdScreen.setMatrixAt(i, _m)
      continue
    }
    const bob = Math.sin(t * 4 + c.ph) * 0.06 * (p.bob ?? 1)
    const s = c.h
    _q.setFromEuler(_e.set(0, p.ry ?? 0, 0))
    _m.compose(V3(p.x, (0.95 + bob) * s, p.z), _q, V3(s, s, s))
    crowdBody.setMatrixAt(i, _m)
    _q.setFromEuler(_e.set(look ? -0.35 : 0.35 * (p.down ?? 0), p.ry ?? 0, 0))
    _m.compose(V3(p.x, (2.32 + bob) * s, p.z), _q, V3(s, s, s))
    crowdHead.setMatrixAt(i, _m)
    if (phones) {
      const up = p.up ?? 1
      const off = new THREE.Vector3(0.45, lerp(1.85, 3.0, up), lerp(0.55, 0.2, up)).applyAxisAngle(V3(0, 1, 0), p.ry ?? 0)
      _q.setFromEuler(_e.set(lerp(-0.4, 0.1, up), (p.ry ?? 0) + (up > 0.5 ? 0 : Math.PI), 0))
      _m.compose(V3(p.x + off.x, (off.y + bob) * s, p.z + off.z), _q, V3(1, 1, 1))
    } else _m.makeScale(0, 0, 0)
    crowdScreen.setMatrixAt(i, _m)
  }
  crowdBody.instanceMatrix.needsUpdate = true
  crowdHead.instanceMatrix.needsUpdate = true
  crowdScreen.instanceMatrix.needsUpdate = true
}

// Pluie (lignes) pour le plan « seul ».
const rainGeo = new THREE.BufferGeometry()
const RAIN = 900
{
  const r = rng(3)
  const a = new Float32Array(RAIN * 6)
  for (let i = 0; i < RAIN; i++) {
    const x = 14 + r() * 12
    const y = r() * 14
    const z = -30 + r() * 50
    a.set([x, y, z, x, y - 0.6, z], i * 6)
  }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(a, 3))
}
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: 0.45 }))
scene.add(rain)

// Feux d'artifice (fin).
const FW_N = 6
const FW_P = 90
const fwGeo = new THREE.BufferGeometry()
fwGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FW_N * FW_P * 3), 3))
fwGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(FW_N * FW_P * 3), 3))
const fireworks = new THREE.Points(fwGeo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))
scene.add(fireworks)
const FW_DIRS = []
{
  const r = rng(9)
  for (let i = 0; i < FW_N * FW_P; i++) {
    const u = r() * 2 - 1
    const th = r() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    FW_DIRS.push(V3(s * Math.cos(th), u, s * Math.sin(th)).multiplyScalar(0.7 + r() * 0.3))
  }
}
function updateFireworks(t, t0, on) {
  fireworks.visible = on
  if (!on) return
  const pos = fwGeo.attributes.position
  const col = fwGeo.attributes.color
  const cols = ['#ffcc44', '#ff6b9e', '#6be0ff', '#8cff8c', '#ff9e4f', '#c59cff'].map((c) => new THREE.Color(c))
  for (let f = 0; f < FW_N; f++) {
    const start = t0 + f * 0.9
    const age = (((t - start) % 3.2) + 3.2) % 3.2
    const k = t < start ? -1 : age
    const cx = [-22, 14, -6, 26, -30, 4][f]
    const cy = [24, 30, 34, 22, 28, 36][f]
    const cz = [-60, -70, -80, -55, -75, -90][f]
    const R = 9 * ease.out3(clamp(k / 1.2))
    const fade = k < 0 ? 0 : clamp(1 - (k - 0.8) / 1.6)
    for (let i = 0; i < FW_P; i++) {
      const j = f * FW_P + i
      const d = FW_DIRS[j]
      pos.setXYZ(j, cx + d.x * R, cy + d.y * R - k * k * 0.8, cz + d.z * R)
      const c = cols[f]
      col.setXYZ(j, c.r * fade, c.g * fade, c.b * fade)
    }
  }
  pos.needsUpdate = true
  col.needsUpdate = true
}

// ============================================================ décors intérieurs

// La chambre du héros (loin de la ville).
const room = new THREE.Group()
room.position.set(400, 0, 0)
scene.add(room)
{
  const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 12), new THREE.MeshLambertMaterial({ color: '#f2d7b0', side: THREE.BackSide }))
  wall.position.y = 3.5
  room.add(wall)
  box(12, 0.1, 12, mat('#b07a52'), room, 0, 0.05, 0)
  // Le plan de la ville au mur : rues, punaises, fils rouges.
  const mapTex = canvasTex(1024, 768, (g) => {
    g.fillStyle = '#f7f1e3'
    g.fillRect(0, 0, 1024, 768)
    g.strokeStyle = '#9aa7b8'
    g.lineWidth = 22
    for (let x = 60; x < 1024; x += 150) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x + 30, 768)
      g.stroke()
    }
    for (let y = 50; y < 768; y += 130) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(1024, y - 20)
      g.stroke()
    }
    g.fillStyle = '#8fd3a5'
    g.fillRect(430, 300, 160, 140)
    const r = rng(4)
    const pins = Array.from({ length: 22 }, () => [40 + r() * 940, 40 + r() * 690])
    g.strokeStyle = '#d63a3a'
    g.lineWidth = 4
    g.beginPath()
    pins.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)))
    g.stroke()
    for (const [x, y] of pins) {
      g.fillStyle = '#d63a3a'
      g.beginPath()
      g.arc(x, y, 12, 0, Math.PI * 2)
      g.fill()
    }
  })
  const map = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.8), new THREE.MeshLambertMaterial({ map: mapTex }))
  map.position.set(-1.2, 3.6, -5.9)
  room.add(map)
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3), new THREE.MeshLambertMaterial({ map: canvasTex(256, 350, (g) => {
    g.fillStyle = '#2850a8'
    g.fillRect(0, 0, 256, 350)
    g.fillStyle = '#ffcc33'
    g.beginPath()
    g.arc(128, 130, 70, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    g.font = '900 44px Figtree Variable'
    g.textAlign = 'center'
    g.fillText('GUIDE', 128, 260)
    g.fillText('OFFICIEL', 128, 310)
  }) }))
  poster.position.set(3.6, 3.8, -5.9)
  room.add(poster)
  // Lit, lampe de chevet, fenêtre de nuit.
  box(3, 0.8, 5, mat('#4a6fa8'), room, 4, 0.4, 2)
  box(3, 0.4, 1.2, mat('#f4f1ea'), room, 4, 1.0, 0.2)
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3), new THREE.MeshBasicMaterial({ map: SKY.night }))
  win.position.set(-5.9, 3.8, 1)
  win.rotation.y = Math.PI / 2
  room.add(win)
  // Les baskets.
  for (const x of [-0.3, 0.3]) box(0.4, 0.3, 0.8, mat('#f4f1ea'), room, 1.6 + x, 0.25, 3)
}

// Le bureau de l'office du tourisme.
const office = new THREE.Group()
office.position.set(400, 0, 60)
scene.add(office)
{
  const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 14), new THREE.MeshLambertMaterial({ color: '#dfe8f2', side: THREE.BackSide }))
  wall.position.y = 3.5
  office.add(wall)
  box(14, 0.1, 14, mat('#c9b08a'), office, 0, 0.05, 0)
  box(5, 1.1, 2, mat('#7a4a28'), office, 0, 0.55, -1)
  box(5.2, 0.15, 2.2, mat('#9a6542'), office, 0, 1.15, -1)
  // Brochures et plante.
  for (let i = 0; i < 4; i++) box(0.5, 0.7, 0.06, mat(PAL[i]), office, -1.8 + i * 0.25, 1.55, -1.5).rotation.x = -0.2
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 12), mat('#c0603a'))
  pot.position.set(4.5, 0.35, -4)
  office.add(pot)
  const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 8), mat('#3e9e5a'))
  leaves.position.set(4.5, 1.4, -4)
  office.add(leaves)
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), new THREE.MeshLambertMaterial({ map: signTex('GUIDOU ★★★★', '#3b82f6', '#ffffff', 1024, 560) }))
  poster.position.set(0, 4.4, -6.9)
  office.add(poster)
}

// L'application « Guidou » : écran de téléphone dessiné (logo, étoiles, ou chargement).
let guidouCtx = null
const guidouTex = canvasTex(320, 560, (g) => (guidouCtx = g))
function drawGuidou(mode, k = 0) {
  const g = guidouCtx
  g.fillStyle = '#3b82f6'
  g.fillRect(0, 0, 320, 560)
  const pin = (x, y, s) => {
    g.fillStyle = '#ffffff'
    g.beginPath()
    g.arc(x, y, 44 * s, Math.PI, 0)
    g.lineTo(x, y + 80 * s)
    g.closePath()
    g.fill()
    g.fillStyle = '#1b1410'
    for (const dx of [-14, 14]) {
      g.beginPath()
      g.ellipse(x + dx * s, y - 6 * s, 6 * s, 9 * s, 0, 0, Math.PI * 2)
      g.fill()
    }
  }
  g.textAlign = 'center'
  if (mode === 'logo') {
    pin(160, 200, 1.5)
    g.fillStyle = '#fff'
    g.font = '900 64px Figtree Variable'
    g.fillText('GUIDOU', 160, 380)
    g.font = '900 54px Figtree Variable'
    const n = clamp(k, 0, 4)
    for (let i = 0; i < 5; i++) {
      g.fillStyle = i < n ? '#ffd43b' : 'rgba(255,255,255,0.35)'
      g.fillText('★', 60 + i * 50, 470)
    }
  } else {
    // Chargement : la mascotte tourne en rond.
    g.fillStyle = 'rgba(255,255,255,0.25)'
    g.lineWidth = 10
    g.strokeStyle = 'rgba(255,255,255,0.35)'
    g.beginPath()
    g.arc(160, 260, 90, 0, Math.PI * 2)
    g.stroke()
    const a = k * 5
    pin(160 + Math.cos(a) * 90, 250 + Math.sin(a) * 90, 0.6)
    g.fillStyle = '#fff'
    g.font = '900 40px Figtree Variable'
    g.fillText('Recherche…', 160, 460)
  }
  guidouTex.needsUpdate = true
}
drawGuidou('logo', 4)
const bigPhone = new THREE.Group()
box(1.9, 3.3, 0.2, mat('#15171c'), bigPhone)
const bigPhoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 3.0), new THREE.MeshBasicMaterial({ map: guidouTex }))
bigPhoneScreen.position.z = 0.11
bigPhone.add(bigPhoneScreen)
scene.add(bigPhone)

// Toit (plan des pigeons) : rebord sur l'immeuble à côté de la boulangerie.
const roof = new THREE.Group()
roof.position.set(400, 0, -60)
scene.add(roof)
{
  box(20, 1, 8, mat('#7a6a7e'), roof, 0, 0.5, 0)
  box(20, 0.6, 0.6, mat('#9a8a9e'), roof, 0, 1.3, 3.6)
  box(1.6, 3, 1.6, mat('#a0524a'), roof, -6, 2.5, -2)
  // Antenne.
  box(0.1, 4, 0.1, mat('#cfd6e0'), roof, 6, 3, -2)
  box(1.6, 0.1, 0.1, mat('#cfd6e0'), roof, 6, 4.4, -2)
}
const PIGEONS = [-3, -1.6, -0.2, 1.2, 2.6].map((x, i) => makePigeon(roof, x, 1.6, 3.6, (i % 2 ? 0.2 : -0.2)))
// Les toits de la ville au loin, derrière le rebord.
{
  const r = rng(77)
  for (let i = 0; i < 24; i++) {
    const h = 4 + r() * 16
    const b = new THREE.Mesh(new THREE.BoxGeometry(6 + r() * 6, h, 6), facadeMats[i % 8])
    b.position.set(-60 + i * 5.5, h / 2 - 22, -40 - r() * 40)
    roof.add(b)
  }
}

// ============================================================ la distribution

const HERO = makeBlocky({ shirt: '#f4c430', pants: '#3b4a7a', skin: '#e9b48a', hat: 'beanie', hatColor: '#2e9e5b', hatBand: '#24804a', jacketStripe: '#e0a91f' })
const NEIGHBOR = makeBlocky({ shirt: '#7b4bb3', pants: '#2b2b33', skin: '#c98e66', hair: 'short', hairColor: '#1b1410' })
const POSTMAN = makeBlocky({ shirt: '#2f5fa8', pants: '#1f3c6e', skin: '#f2c49b', hat: 'cap', hatColor: '#2f5fa8', bag: true, mustache: true })
const DIRECTOR = makeBlocky({ shirt: '#c0392b', pants: '#2b2b33', skin: '#f6d2b5', hair: 'bun', hairColor: '#6a4a3a', glasses: true })
const MAYOR = makeBlocky({ shirt: '#2b3550', pants: '#1f2533', skin: '#f2c49b', hair: 'bald', hairColor: '#8a8a8a', mustache: true, sash: true })
const DOG = makeDog()
const EXTRAS = Array.from({ length: 14 }, (_, i) => {
  const r = rng(300 + i)
  return makeBlocky({ shirt: PAL[i % PAL.length], pants: ['#2b3550', '#3a3a44', '#5a4030', '#1f3c6e'][i % 4], skin: SKINS[Math.floor(r() * SKINS.length)], hair: ['short', 'long', 'bun', 'short', 'bald'][i % 5], hairColor: ['#3b2416', '#1b1410', '#a0522d', '#d9b26a', '#6a4a3a'][Math.floor(r() * 5)], glasses: i % 6 === 2 })
})
const CAST = [HERO, NEIGHBOR, POSTMAN, DIRECTOR, MAYOR, ...EXTRAS]
for (const c of CAST) scene.add(c.root)
scene.add(DOG.root)
// Le chien a sa « star » : un téléphone sur trépied devant lui.
const tripod = new THREE.Group()
{
  for (const a of [0, 2.1, 4.2]) {
    const l = box(0.05, 1.3, 0.05, mat('#2a2d3a'), tripod, Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.25)
    l.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)
  }
  box(0.6, 0.36, 0.05, mat('#15171c'), tripod, 0, 1.35, 0)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  ring.position.set(0, 1.35, -0.03)
  tripod.add(ring)
}
scene.add(tripod)
// Table de café, assiette, croissant, tasse.
const cafe = new THREE.Group()
{
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 20), mat('#f4f1ea'))
  top.position.y = 1.1
  cafe.add(top)
  box(0.1, 1.1, 0.1, mat('#2a2d3a'), cafe, 0, 0.55, 0)
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.04, 20), mat('#ffffff'))
  plate.position.set(0, 1.17, 0.1)
  cafe.add(plate)
  const crois = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.08, 8, 12, Math.PI * 1.2), mat('#e0a24a'))
  crois.rotation.x = Math.PI / 2
  crois.position.set(0, 1.24, 0.1)
  cafe.add(crois)
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.2, 14), mat('#d63a3a'))
  cup.position.set(0.4, 1.24, -0.2)
  cafe.add(cup)
}
scene.add(cafe)
// Rond lumineux sous le héros (vue du ciel), et cône de la lampe torche.
const heroMark = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.4, 32), new THREE.MeshBasicMaterial({ color: 0xffd43b, transparent: true, opacity: 0.9 }))
heroMark.rotation.x = -Math.PI / 2
scene.add(heroMark)
const trailGeo = new THREE.BufferGeometry()
const TRAIL_N = 200
trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL_N * 3), 3))
const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0xffd43b, linewidth: 4 }))
scene.add(trail)
const coneGeo = new THREE.ConeGeometry(4.5, 16, 24, 1, true)
coneGeo.translate(0, -8, 0)
coneGeo.rotateX(-Math.PI / 2)
const torchCone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))
scene.add(torchCone)

// =============================================================== HTML

const ui = document.getElementById('ui')
const el = (cls, html, parent = ui) => {
  const d = document.createElement('div')
  d.className = cls
  d.innerHTML = html
  parent.append(d)
  return d
}
const rec = el('', '<div class="dot"></div><div class="txt">REC</div><div class="time"></div>')
rec.id = 'rec'
const recTime = rec.querySelector('.time')
const fadeEl = el('', '')
fadeEl.id = 'fade'
const flashEl = el('', '')
flashEl.id = 'flash'
const vig = el('', '')
vig.id = 'vignette'
ui.prepend(vig)

/** Étiquettes : position fixe (x, y) ou accrochée à un point 3D (at). */
const TAGS = []
function tag(cls, html, { t0, t1, x = 540, y = 300, at = null, rot = 0, from = 1.6, count = null }) {
  const d = el(`tag ${cls}`, html)
  const T = { d, t0, t1, x, y, at, rot, from, count }
  TAGS.push(T)
  return T
}
const _v = new THREE.Vector3()
function project(p) {
  _v.copy(p).project(camera)
  return [(_v.x * 0.5 + 0.5) * WIDTH, (-_v.y * 0.5 + 0.5) * HEIGHT, _v.z < 1]
}
function updateTags(t) {
  for (const T of TAGS) {
    const out = t >= T.t1 ? clamp(1 - (t - T.t1) / 0.18) : 1
    const s = pop(t, T.t0, 0.32) * out
    if (s <= 0.01 || t < T.t0) {
      T.d.style.visibility = 'hidden'
      continue
    }
    T.d.style.visibility = ''
    let { x, y } = T
    if (T.at) {
      const [px, py, ok] = project(typeof T.at === 'function' ? T.at(t) : T.at)
      if (!ok) {
        T.d.style.visibility = 'hidden'
        continue
      }
      x = px + (T.dx ?? 0)
      y = py + (T.dy ?? 0)
    }
    if (T.count) T.d.querySelector('.n').textContent = T.count(t)
    const k = lerp(T.from, 1, ease.out3(clamp((t - T.t0) / 0.3))) * Math.min(1, s)
    T.d.style.opacity = String(Math.min(1, s * 1.4))
    T.d.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${T.rot}deg) scale(${k.toFixed(3)})`
  }
}
const fmt = (v) => Math.round(v).toLocaleString('fr-FR').replace(/\s/g, ' ')
const counter = (t0, t1, to, unit, o = {}) =>
  tag(`counter ${o.cls ?? ''}`, `<span class="n">0</span>${unit ? `<small>${unit}</small>` : ''}`, { t0, t1, y: o.y ?? 260, x: o.x ?? 540, from: 1.3, count: (t) => (o.text ? o.text : fmt(to * ease.out3(clamp((t - t0) / (o.dur ?? 0.8))))) })

// Sous-titres : un mot à la fois.
const wordEl = el('word', '')
const WORDS = C.lines.flatMap((l) => l.words.map((w, i) => ({ w: w.w.replace(/[«»"]/g, ''), t: w.t, end: l.words[i + 1]?.t ?? l.start + l.dur + 0.15 })))
function updateWord(t) {
  const w = WORDS.findLast((x) => t >= x.t - 0.04 && t < x.end)
  if (!w) {
    wordEl.style.visibility = 'hidden'
    return
  }
  wordEl.style.visibility = ''
  if (wordEl.textContent !== w.w) wordEl.textContent = w.w
  const k = ease.back(3)(clamp((t - w.t + 0.04) / 0.14))
  wordEl.style.transform = `translate(-50%, -50%) scale(${(0.6 + 0.4 * k).toFixed(3)})`
}

scene.updateMatrixWorld(true)
// ----------------------------------------------------------- les étiquettes

counter(W('02', 'deux') - 0.1, SHOT.facteur.t0, 2000000, 'VUES', { y: 300, dur: 0.9 })
tag('label red', '● LIVE', { t0: W('03', 'live') - 0.1, t1: SHOT.chien.t0, at: () => POSTMAN.phone.getWorldPosition(new THREE.Vector3()).add(V3(0, 0.6, 0)), from: 2 })
counter(W('03', 'quarante') - 0.1, SHOT.ecrans.t0, 40000, 'ABONNÉS', { y: 280, dur: 0.7 })
tag('zzz', '?', { t0: W('03', 'lire') - 0.05, t1: W('03', 'ca') - 0.05, at: V3(23.3, 2.3, 2.6), from: 2 })
tag('label yellow', 'GUIDE OFFICIEL', { t0: W('05', 'officiel') - 0.1, t1: SHOT.aube.t0, y: 300, rot: -3 })
tag('counter gold', '<span class="n"></span>', { t0: SHOT.aube.t0 + 0.05, t1: W('06', 'marche'), y: 270, count: () => '6:00' })
tag('label dark', 'RUE DES LILAS', { t0: W('06', 'rue') - 0.1, t1: W('06', 'chaque', 1) - 0.1, y: 300, rot: -2 })
tag('label dark', 'RUELLE DU CHAT', { t0: W('06', 'ruelle') - 0.1, t1: W('06', 'chaque', 2) - 0.1, y: 300, rot: 2 })
tag('label yellow', 'RACCOURCI SECRET', { t0: W('06', 'raccourci') - 0.1, t1: SHOT.lampadaire.t0, y: 300, rot: -2 })
counter(W('07', 'trois') - 0.1, W('07', 'mille') - 0.1, 312, 'RUES', { y: 260, dur: 0.5 })
counter(W('07', 'mille') - 0.1, W('07', 'je') - 0.05, 1400, 'LAMPADAIRES', { y: 260, dur: 0.6 })
tag('label yellow', 'GÉRARD', { t0: W('07', 'prenom') - 0.15, t1: SHOT.toit.t0, at: V3(15.8, 6.6, 4), rot: -4, from: 2 })
tag('label', 'WI-FI ?', { t0: W('08', 'wifi') - 0.15, t1: W('08', 'mais') + 0.2, y: 330, rot: -3 })
PIGEONS.forEach((p, i) => tag('zzz', 'z<small>z</small>', { t0: W('08', 'pigeon') - 0.2 + i * 0.08, t1: SHOT.bandeau.t0, at: p.localToWorld(V3(0, 1.0, 0)), from: 0.5 }))
tag('stamp', 'BONK', { t0: W('09', 'cogne') - 0.05, t1: W('09', 'recommence') - 0.1, y: 520, rot: -8, from: 2.4 })
const WAY = [
  ['GAUCHE', 'gauche', V3(-10, 0, 26)],
  ['DROITE', 'droite', V3(4, 0, 27)],
  ['FONTAINE', 'fontaine', V3(0, 0, 0)],
  ['BOULANGERIE', 'boulangerie', V3(13, 0, -2)],
]
for (const [txt, w, p] of WAY) tag('label yellow', txt, { t0: W('09', w) - 0.1, t1: SHOT.voisin.t0, at: p.clone().add(V3(0, 0, -4)), from: 1.8 })
tag('label', 'À PIED', { t0: W('10', 'pied') - 0.1, t1: SHOT.office.t0, y: 420, rot: -3 })
tag('counter gold', '<span class="n"></span>', { t0: W('11', 'pile') - 0.1, t1: SHOT.bureau.t0, y: 260, count: () => '9:00 PILE' })
tag('label red', 'SANS GPS', { t0: W('11', 'sans') - 0.1, t1: SHOT.bureau.t0, y: 420, rot: 3 })
tag('stamp', 'REFUSÉ', { t0: W('13', 'poste') - 0.05, t1: W('13', 'le', 0) + 0.6, y: 520, rot: -10, from: 2.4 })
counter(W('15', 'trois') - 0.1, W('15', 'trois', 1) - 0.1, 3000, 'PERSONNES', { y: 260, dur: 0.6 })
counter(W('15', 'trois', 1) - 0.1, SHOT.panne.t0, 3000, 'ÉCRANS', { y: 260, dur: 0.6 })
tag('counter red', '<span class="n"></span>', { t0: W('16', 'vingtdeux') - 0.1, t1: W('16', 'panne') + 0.25, y: 260, count: () => '22:04' })
tag('label red', 'PLUS DE RÉSEAU', { t0: W('16', 'plus') - 0.1, t1: SHOT.noir.t0, y: 300, rot: -3 })
tag('label red', 'PLUS DE GPS', { t0: W('16', 'plus', 1) - 0.1, t1: SHOT.noir.t0, y: 420, rot: 2 })
tag('label red', 'PLUS RIEN', { t0: W('16', 'plus', 2) - 0.1, t1: SHOT.noir.t0, y: 540, rot: -2 })
tag('label yellow', 'SUIVEZ-MOI', { t0: W('18', 'suivezmoi') - 0.1, t1: SHOT.file.t0, y: 330, rot: -3 })
const WAY2 = WAY
for (const [txt, w, p] of WAY2) tag('label yellow', txt, { t0: W('19', w) - 0.1, t1: W('19', 'trois') - 0.1, at: p.clone().add(V3(0, 0, -4)), from: 1.8 })
counter(W('19', 'trois') - 0.1, W('19', 'vingt') - 0.1, 312, 'RUES', { y: 260, dur: 0.4 })
counter(W('19', 'vingt') - 0.1, W('19', 'personne') - 0.1, 20, 'MIN', { y: 260, dur: 0.4 })
tag('counter', '<span class="n"></span><small>PERDU</small>', { t0: W('19', 'personne') - 0.1, t1: SHOT.chien2.t0, y: 260, count: () => '0' })
tag('label yellow', 'GUIDE OFFICIEL', { t0: W('21', 'officiel') - 0.1, t1: W('21', 'comment') - 0.1, y: 330, rot: -3 })
tag('title', 'SAUF MOI.', { t0: E('22') + 0.25, t1: C.duration + 1, y: 520, from: 2 })

// ================================================================ les plans

const hide = () => {
  for (const c of CAST) {
    c.root.visible = false
    c.band.visible = false
    c.badge.visible = false
  }
  DOG.root.visible = false
  crowd.visible = false
  rain.visible = false
  tripod.visible = false
  cafe.visible = false
  heroMark.visible = false
  trail.visible = false
  torchCone.visible = false
  bigPhone.visible = false
  fireworks.visible = false
  stage.visible = true
}
const show = (...cs) => cs.forEach((c) => (c.root.visible = true))
function lookCam(px, py, pz, tx, ty, tz, roll = 0) {
  camera.position.set(px, py, pz)
  camera.up.set(Math.sin(roll), Math.cos(roll), 0)
  camera.lookAt(tx, ty, tz)
}
/** Ambiance : ciel, lumières, éléments allumés. */
function mood(kind) {
  const M = {
    night: { sky: 'night', hemi: [0x8aa0ff, 0x2a2030, 0.85], moon: 0.55, fog: [0x1d2450, 40, 170], glow: [1, 1, 1, 1] },
    dawn: { sky: 'dawn', hemi: [0xffd2b0, 0x6a5060, 1.15], moon: 0.9, fog: [0xf2b08a, 50, 200], glow: [0.15, 0, 0, 1] },
    day: { sky: 'day', hemi: [0xdff2ff, 0x7a6a5a, 1.5], moon: 1.4, fog: [0xbfe4f8, 60, 240], glow: [0, 0, 0, 1] },
    rain: { sky: 'night', hemi: [0x6a7aa8, 0x1a1a24, 0.6], moon: 0.25, fog: [0x141a30, 25, 120], glow: [0.5, 1, 0, 1] },
    dark: { sky: 'black', hemi: [0x3a4a7a, 0x05050a, 0.22], moon: 0.12, fog: [0x020308, 20, 110], glow: [0, 0, 0, 0] },
  }[kind]
  scene.background = SKY[M.sky]
  hemi.color.set(M.hemi[0])
  hemi.groundColor.set(M.hemi[1])
  hemi.intensity = M.hemi[2]
  moon.intensity = M.moon
  scene.fog = new THREE.Fog(M.fog[0], M.fog[1], M.fog[2])
  ;[GLOW.windows, GLOW.lamps, GLOW.garland, GLOW.screens] = M.glow
}
function applyGlow(t) {
  for (const m of facadeMats) m.emissiveIntensity = GLOW.windows
  lampMat.color.setRGB(1 * GLOW.lamps + 0.12, 0.82 * GLOW.lamps + 0.12, 0.54 * GLOW.lamps + 0.14)
  const tw = 0.85 + 0.15 * Math.sin(t * 6)
  bulbMat.color.setScalar(0.03 + 0.97 * GLOW.garland * tw)
  crowdScreenMat.color.setRGB(0.62 * GLOW.screens + 0.02, 0.85 * GLOW.screens + 0.02, 1.0 * GLOW.screens + 0.03)
  BAKERY.vit.material.color.setScalar(0.15 + 0.85 * Math.max(GLOW.windows, 0.0)).multiply(new THREE.Color(0xffd9a0))
}
const walkers = (t, xs, { phones = true, zSpan = [-30, 40], speed = 1.1 } = {}) => {
  xs.forEach((_, i) => {
    const c = EXTRAS[EXTRAS.length - 1 - i]
    const dir = i % 2 ? 1 : -1
    const len = zSpan[1] - zSpan[0]
    const z = zSpan[0] + ((((i * 9.7 + dir * t * speed) % len) + len) % len)
    c.root.visible = true
    c.update(t, { x: xs[i], z, ry: dir > 0 ? 0 : Math.PI, walk: t * 6 + i, stride: 0.5, hold: phones ? 'phone' : null, headPitch: phones ? 0.45 : 0, face: phones ? { look: [0, 0.6] } : {}, blinkSeed: i })
  })
}
/** Chemin à angles droits (plan du ciel) : position à la distance d. */
function pathAt(pts, d) {
  for (let i = 0; i < pts.length - 1; i++) {
    const L = pts[i].distanceTo(pts[i + 1])
    if (d <= L) return { p: pts[i].clone().lerp(pts[i + 1], d / L), dir: pts[i + 1].clone().sub(pts[i]).normalize() }
    d -= L
  }
  const n = pts.length
  return { p: pts[n - 1].clone(), dir: pts[n - 1].clone().sub(pts[n - 2]).normalize() }
}
const pathLen = (pts) => pts.slice(1).reduce((s, p, i) => s + p.distanceTo(pts[i]), 0)
const ROUTE = [V3(-20, 0, 56), V3(-20, 0, 20), V3(0, 0, 20), V3(0, 0, 4.5), V3(5.5, 0, 0), V3(22, 0, 2)]
const ROUTE_LEN = pathLen(ROUTE)
/** Distance parcourue sur ROUTE à t, avec un passage aux repères aux bons mots. */
function routeD(t, marks) {
  const D = [0, ...ROUTE.slice(1).map((_, i) => pathLen(ROUTE.slice(0, i + 2)))]
  const keys = [[marks[0] - 2.4, 0], [marks[0], D[1]], [marks[1], D[2]], [marks[2], D[3] + 1.5], [marks[3], ROUTE_LEN]]
  if (t <= keys[0][0]) return 0
  for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]))
  return ROUTE_LEN
}
/** Caméra « drone » qui suit le chemin, derrière le héros, au-dessus de la rue. */
function droneCam(d) {
  const back = d - 13
  const b = back >= 0 ? pathAt(ROUTE, back).p : ROUTE[0].clone().add(V3(0, 0, -back))
  const { p, dir } = pathAt(ROUTE, d)
  lookCam(b.x + 1.5, 15, b.z, p.x + dir.x * 1.5, 1.2, p.z + dir.z * 1.5)
}
function drawTrail(d) {
  const pos = trailGeo.attributes.position
  for (let i = 0; i < TRAIL_N; i++) {
    const { p } = pathAt(ROUTE, (d * i) / (TRAIL_N - 1))
    pos.setXYZ(i, p.x, 0.35, p.z)
  }
  pos.needsUpdate = true
  trail.visible = true
}

const SHOTS = {
  // 01 · La rue de nuit : tout le monde sur son téléphone… sauf lui.
  rue(t, k) {
    mood('night')
    show(HERO)
    walkers(t, [16.4, 23.6, 17, 23, 15.8, 24.2])
    HERO.update(t, { x: 20, z: 22, ry: 0, face: t > W('01', 'sauf') ? { brows: 'up', mouth: 'flat' } : {}, armR: [0, 0.1], armL: [0, 0.1], headYaw: 0.05 * Math.sin(t) })
    const push = smooth(t, W('01', 'sauf') - 0.3, 0.7)
    lookCam(20 + Math.sin(t * 0.4) * 0.3, lerp(3.1, 2.6, push), lerp(29.5, 26.3, push), 20, lerp(2.7, 2.35, push), 18)
    key.position.set(21.5, 4, 26)
    key.intensity = 18
  },
  // 02 · Le café : on filme son petit-déjeuner… puis son voisin.
  cafe(t) {
    mood('night')
    cafe.visible = true
    cafe.position.set(10, 0, 8)
    const A = EXTRAS[0]
    const B = EXTRAS[3]
    show(A, B)
    A.update(t, { x: 10, z: 7, ry: 0, hold: 'phoneOut', headPitch: 0.5, face: { look: [0, 0.8] } })
    A.phone.position.set(0.15, 1.7, 0.8)
    A.phone.rotation.set(-1.15, Math.PI, 0)
    B.update(t, { x: 7.8, z: 10.4, ry: 2.58, hold: 'phoneOut', headPitch: 0.1, face: { brows: 'focus' } })
    walkers(t, [16, 18.5], { zSpan: [-10, 30] })
    const pan = smooth(t, W('02', 'voisin') - 0.4, 0.6)
    lookCam(lerp(12.4, 12.6, pan), lerp(2.5, 2.9, pan), lerp(11.2, 15.2, pan), lerp(10.1, 8.8, pan), lerp(1.8, 2.2, pan), lerp(7.4, 9.4, pan))
    key.position.set(11, 4, 11)
    key.intensity = 14
  },
  // 02 · Un type filme un type qui filme : deux millions de vues.
  chaine(t, k) {
    mood('night')
    // En file vers la caméra : le premier pose, chacun filme celui de devant.
    const G = [EXTRAS[1], EXTRAS[4], EXTRAS[7], EXTRAS[9]]
    show(...G)
    const P = G.map((_, i) => [-4 + (i % 2) * 1.6, 11 - i * 2.8])
    G.forEach((c, i) => {
      const [x, z] = P[i]
      const n = P[Math.max(0, i - 1)]
      const ry = i ? Math.atan2(n[0] - x, n[1] - z) : 0.25
      c.update(t, i ? { x, z, ry, hold: 'phoneOut', face: { brows: 'focus' }, blinkSeed: i } : { x, z, ry, armR: [-2.6 + 0.2 * Math.sin(t * 8), 0.4], face: { mouth: 'grin', eyes: 'happy' } })
    })
    const u = smooth(t, SHOT.chaine.t0, SHOT.chaine.t1 - SHOT.chaine.t0)
    lookCam(lerp(1.5, -0.5, u), lerp(2.8, 3.6, u), lerp(18.5, 17, u), -3.4, 2.2, 5.5)
    key.position.set(-1, 5, 15)
    key.intensity = 20
  },
  // 03 · Le facteur livre en live.
  facteur(t) {
    mood('night')
    show(POSTMAN)
    const z = lerp(4, 10, (t - SHOT.facteur.t0) / 2)
    POSTMAN.update(t, { x: 20, z, ry: 0, walk: t * 6, stride: 0.6, hold: 'phoneOut', face: { mouth: 'grin', eyes: 'happy' } })
    POSTMAN.phone.position.set(0.45, 2.3, 1.1)
    POSTMAN.phone.rotation.set(0.2, Math.PI, 0)
    walkers(t, [16.4, 23.6, 24], { zSpan: [-20, 20] })
    lookCam(19, 2.6, z + 7, 20, 2.2, z)
    key.position.set(21, 4, z + 4)
    key.intensity = 16
  },
  // 03 · Le chien de la boulangère : 40 000 abonnés, il ne sait pas lire.
  chien(t) {
    mood('night')
    DOG.root.visible = true
    tripod.visible = true
    tripod.position.set(21.5, 0, 0.6)
    tripod.rotation.y = Math.PI / 2
    const tilt = smooth(t, W('03', 'lire') - 0.2, 0.3) * (1 - smooth(t, W('03', 'ca') + 0.2, 0.3)) * 0.45
    DOG.update(t, { x: 23.3, z: 2.4, ry: -Math.PI / 2, sit: true, tilt, wag: t > W('03', 'ca') ? 1 : 0.3, scale: 1.3 })
    lookCam(17.2, 1.9, 5.2, 23.2, 1.5, 2.2)
    key.position.set(19.5, 3, 4)
    key.intensity = 20
  },
  // 04 · Tous les écrans… et lui, qui regarde la ville.
  ecrans(t) {
    mood('night')
    show(HERO)
    walkers(t, [16.4, 23.6, 17, 23, 15.8, 24.2, 18.5, 21.5, 16.8, 23.2, 19, 22.5], { zSpan: [-6, 30], speed: 0.5 })
    const up = smooth(t, W('04', 'moi') - 0.2, 0.8)
    HERO.update(t, { x: 20, z: 14, ry: 0, headPitch: -0.45 * up, face: up > 0.5 ? { look: [0, -0.8], mouth: 'smile' } : {} })
    const crane = smooth(t, W('04', 'moi'), 1.6)
    lookCam(lerp(26, 20, crane), lerp(10, 3, crane), lerp(26, 22, crane), lerp(20, 20, crane), lerp(1, 7, crane), lerp(12, 0, crane))
    key.position.set(20, 4, 18)
    key.intensity = 12
  },
  // 05 · Sa chambre : le plan de la ville au mur.
  chambre(t) {
    mood('night')
    scene.fog = null
    show(HERO)
    const u = t - SHOT.chambre.t0
    HERO.update(t, { x: 402.6, z: -1, ry: -0.2, headPitch: -0.1, armR: t > W('05', 'mentraine') - 0.3 ? [-2.6, 0.2] : [0, 0.1], face: { mouth: 'smile', brows: 'up' } })
    lookCam(400.4 + Math.sin(u * 0.3) * 0.4, 3.2, 7.4, 401.6, 3.0, -3)
    key.position.set(402, 5, 2)
    key.intensity = 30
    fillL.position.set(397, 3, -3)
    fillL.intensity = 8
  },
  // 06 · Six heures du matin : il marche, chaque rue, chaque ruelle.
  aube(t) {
    mood('dawn')
    show(HERO)
    const u = t - SHOT.aube.t0
    const z = 30 - u * 2.4
    HERO.update(t, { x: 20, z, ry: Math.PI, walk: t * 6.5, stride: 0.8, face: { mouth: 'smile' } })
    lookCam(14.8, 2.8, z - 4.6, 20, 2.3, z)
  },
  // 07 · 312 rues, 1 400 lampadaires… dont Gérard.
  lampadaire(t) {
    mood('night')
    show(HERO)
    const wave = t > W('07', 'prenom') - 0.3
    HERO.update(t, { x: 17.4, z: 6.2, ry: 0.35, armR: wave ? [-2.7 + 0.25 * Math.sin(t * 14), 0.3] : [0, 0.1], face: wave ? { mouth: 'grin', eyes: 'happy' } : { mouth: 'smile' } })
    const push = smooth(t, SHOT.lampadaire.t0, SHOT.lampadaire.t1 - SHOT.lampadaire.t0)
    lookCam(lerp(19.4, 19, push), lerp(3.1, 3.2, push), lerp(12.6, 11.4, push), 16.8, 3.4, 5)
    key.position.set(18, 5, 9)
    key.intensity = 20
  },
  // 08 · Le Wi-Fi, il ne sait pas ; les pigeons, si.
  toit(t) {
    mood('night')
    scene.fog = new THREE.Fog(0x1d2450, 60, 200)
    show(HERO)
    HERO.update(t, { x: 405.5, y: 1, z: -58.5, ry: -0.9, armR: t > W('08', 'pigeon') - 0.4 ? [-1.5, 0.5] : [0, 0.1], face: { mouth: 'smile', look: [-0.6, 0.2] } })
    const u = smooth(t, W('08', 'mais') - 0.2, 0.9)
    lookCam(lerp(405, 401.8, u), lerp(4.2, 3.2, u), lerp(-49, -51.4, u), lerp(404.6, 400.2, u), lerp(3.4, 1.9, u), lerp(-59, -56.4, u))
    key.position.set(402, 6, -53)
    key.intensity = 22
  },
  // 09 · Les yeux bandés : il se cogne, il recommence.
  bandeau(t) {
    mood('night')
    show(HERO)
    HERO.band.visible = true
    const tc = W('09', 'cogne')
    const tr = W('09', 'recommence')
    let z = lerp(10.5, 4.75, clamp((t - SHOT.bandeau.t0) / (tc - SHOT.bandeau.t0)))
    let lean = 0
    if (t > tc) lean = -0.35 * Math.exp(-(t - tc) * 5) * Math.cos((t - tc) * 18)
    if (t > tr) z = lerp(4.75, 5.4, clamp((t - tr) / 0.6))
    const walking = t < tc || t > tr
    HERO.update(t, { x: 15.85, z, ry: Math.PI, walk: walking ? t * 6 : null, stride: 0.6, lean, armR: [-1.0, 0.1], armL: [-1.0, 0.1], face: t > tc && t < tr ? { mouth: 'o' } : { mouth: 'flat' } })
    const shake = t > tc ? 0.25 * Math.exp(-(t - tc) * 6) * Math.sin((t - tc) * 50) : 0
    lookCam(19 + shake, 2.8, z - 4.6, 16, 2.4, z + 0.3)
    key.position.set(18, 4, z - 3)
    key.intensity = 18
  },
  // 09 · Vu du ciel : gauche, droite, fontaine, boulangerie.
  plan(t) {
    mood('night')
    show(HERO)
    const marks = ['gauche', 'droite', 'fontaine', 'boulangerie'].map((w) => W('09', w))
    const d = routeD(t, marks)
    const { p, dir } = pathAt(ROUTE, d)
    HERO.band.visible = true
    HERO.update(t, { x: p.x, z: p.z, ry: Math.atan2(dir.x, dir.z), walk: t * 7, stride: 0.7, scale: 1.4 })
    heroMark.visible = true
    heroMark.scale.setScalar(0.55)
    heroMark.position.set(p.x, 0.3, p.z)
    drawTrail(d)
    hemi.intensity = 1.3
    droneCam(d)
    key.position.set(p.x + 2, 6, p.z + 3)
    key.intensity = 40
  },
  // 10 · Le voisin le filme : « T'es en retard sur ton époque. »
  voisin(t) {
    mood('night')
    show(HERO)
    const feet = smooth(t, W('10', 'pied') - 0.4, 0.5)
    HERO.update(t, { x: 20, z: 10, ry: 0, walk: feet > 0.2 ? t * 6 : null, stride: 0.6, face: t > W('10', 'je') ? { eyes: 'half', mouth: 'flat' } : { mouth: 'flat' } })
    walkers(t, [16.4, 23.6], { zSpan: [-20, 6] })
    lookCam(20.4, lerp(2.4, 1.2, feet), 14.5, 20, lerp(2.3, 0.4, feet), 10)
    key.position.set(21, 4, 13)
    key.intensity = 16
  },
  // 11 · L'office du tourisme : pile à l'heure, sans GPS.
  office(t) {
    mood('day')
    show(HERO)
    const u = clamp((t - SHOT.office.t0) / 2.6)
    HERO.update(t, { x: lerp(19.5, 22.6, ease.out3(u)), z: lerp(-28, -36.2, ease.out3(u)), ry: Math.atan2(3.1, -8.2), walk: u < 1 ? t * 6 : null, stride: 0.7, face: { mouth: 'smile', brows: 'up' } })
    walkers(t, [16.4, 23.6, 17.5], { zSpan: [-60, -20] })
    lookCam(16.6, 3.8, -23.5, 23.5, 4.4, -38)
    key.intensity = 0
  },
  // 12 · « Montre-moi ton appli. » — « J'ai des jambes. »
  bureau(t) {
    mood('day')
    scene.fog = null
    scene.background = new THREE.Color('#dfe8f2')
    show(HERO, DIRECTOR)
    DIRECTOR.update(t, { x: 400, z: 62 - 2.6, ry: 0, hold: t > W('12', 'montremoi') - 0.3 ? 'phoneOut' : null, face: { brows: 'up', mouth: t > W('12', 'montremoi') - 0.1 && t < W('12', 'appli') + 0.3 ? 'open' : 'flat' } })
    DIRECTOR.phone.position.set(0.3, 1.8, 1.0)
    DIRECTOR.phone.rotation.set(0, 0, 0)
    const legs = smooth(t, W('12', 'jambes') - 0.5, 0.45)
    HERO.update(t, { x: 400, z: 62 + 1.2, ry: Math.PI, armR: [0, 0.1], face: { mouth: 'flat', eyes: 'half' } })
    HERO.legs[1].rotation.x = legs > 0.5 ? -0.9 * Math.abs(Math.sin((t - W('12', 'jambes')) * 6)) : 0
    lookCam(lerp(402.4, 401.5, legs), lerp(3.8, 1.4, legs), lerp(68, 66, legs), lerp(399.6, 400, legs), lerp(2.2, 0.6, legs), lerp(59.8, 63, legs))
    key.position.set(402, 5, 64)
    key.intensity = 24
  },
  // 13 · Le poste donné à une appli : Guidou, quatre étoiles.
  guidou(t) {
    mood('day')
    scene.fog = null
    scene.background = new THREE.Color('#dfe8f2')
    show(HERO)
    HERO.update(t, { x: 401, z: 62 - 3, ry: -0.15, face: { brows: 'sad', mouth: 'sad' }, headPitch: 0.15 })
    bigPhone.visible = true
    const enter = ease.out3(clamp((t - SHOT.guidou.t0) / 0.5))
    bigPhone.position.set(399.7, 2.8 + (1 - enter) * -2, 62.6)
    bigPhone.scale.setScalar(0.62)
    bigPhone.rotation.set(-0.05, 0.12, -0.08)
    drawGuidou('logo', (t - W('13', 'quatre') + 0.1) * 8)
    lookCam(400.6, 2.8, 62 + 6.2, 400.2, 2.6, 62)
    key.position.set(401, 5, 66)
    key.intensity = 20
  },
  // 14 · Alors il retourne marcher (seul, sous la pluie).
  seul(t) {
    mood('rain')
    show(HERO)
    rain.visible = true
    const u = t - SHOT.seul.t0
    const z = 4 - u * 1.5
    HERO.update(t, { x: 20, z, ry: Math.PI, walk: t * 5, stride: 0.5, headPitch: 0.2 })
    const pos = rainGeo.attributes.position
    for (let i = 0; i < RAIN; i++) {
      const y = (((pos.array[i * 6 + 1] - 0.3) % 14) + 14) % 14
      pos.array[i * 6 + 1] = y
      pos.array[i * 6 + 4] = y - 0.6
    }
    pos.needsUpdate = true
    lookCam(20, 3.2, 12, 20, 2, z - 6)
    key.position.set(16, 5.5, 6)
    key.intensity = 10
  },
  // 15 · Le grand concert : 3 000 personnes, 3 000 écrans levés.
  concert(t) {
    mood('night')
    crowd.visible = true
    layoutCrowd(t, (i, c) => ({ x: -14 + c.rx * 28, z: -4 + c.rz * 30 + (c.rx > 0.5 ? 0 : 0), ry: Math.PI, up: 1, bob: 1.4 }), { phones: 1 })
    drawBigScreen('LIVE', 'CONCERT DE LA PLACE', 1)
    beams.forEach((b, i) => (b.rotation.z = Math.sin(t * 1.4 + i) * 0.5))
    const u = smooth(t, SHOT.concert.t0, SHOT.concert.t1 - SHOT.concert.t0)
    lookCam(lerp(6, -4, u), lerp(13, 17, u), lerp(22, 23.5, u), 0, 4, -4)
    key.intensity = 0
  },
  // 16 · 22:04 : panne. Plus de réseau, plus de GPS, plus rien.
  panne(t) {
    const tp = W('16', 'panne')
    const off = t >= tp
    mood(off ? 'dark' : 'night')
    crowd.visible = true
    layoutCrowd(t, (i, c) => ({ x: -14 + c.rx * 28, z: -4 + c.rz * 30, ry: Math.PI, up: off ? 0.6 : 1, bob: off ? 0.2 : 1.4 }), { phones: 1 })
    drawBigScreen(off ? '' : '22:04', off ? '' : 'RÉSEAU ✓', off ? 0 : 1)
    beams.forEach((b) => (b.visible = !off))
    // Les lumières tombent en cascade, du plus proche au plus loin.
    const flick = t > tp - 0.15 && t < tp + 0.1 && Math.floor(t * 40) % 2
    if (flick) GLOW.windows = GLOW.lamps = GLOW.garland = GLOW.screens = 1
    lookCam(0, 5.5, 18, 0, 6.5, -10)
  },
  // 17 · Trois mille personnes dans le noir ; Guidou tourne en rond.
  noir(t) {
    mood('dark')
    crowd.visible = true
    layoutCrowd(t, (i, c) => {
      const x = -14 + c.rx * 28
      const z = -4 + c.rz * 30
      if (z > 11.5 || Math.hypot(x - 2, z - 10) < 2.4) return null
      return { x, z, ry: Math.PI + (c.rx - 0.5), up: 0.3, bob: 0.2 }
    }, { phones: 0 })
    beams.forEach((b) => (b.visible = false))
    show(MAYOR)
    const tg = W('17', 'maire') - 0.2
    MAYOR.update(t, { x: 2, z: 10, ry: 0.2, hold: t > tg ? 'phone' : null, headPitch: t > tg ? 0.35 : 0, face: { brows: 'worried', mouth: 'o', look: t > tg ? [0, 0.7] : [0, 0] } })
    MAYOR.screenMat.color.set(0x3b82f6)
    bigPhone.visible = t > W('17', 'guidou') - 0.2
    drawGuidou('load', t)
    bigPhone.position.set(2.9, 2.45, 13.2)
    bigPhone.rotation.set(-0.1, 0.25, 0)
    bigPhone.scale.setScalar(0.55)
    const u = smooth(t, tg, 0.8)
    lookCam(lerp(-2, 3.2, u), lerp(6, 3.2, u), lerp(24, 16.2, u), lerp(0, 2.4, u), lerp(2, 2.6, u), lerp(6, 11, u))
    fillL.position.set(2.6, 2.6, 12)
    fillL.intensity = t > tg ? 8 : 0
    fillL.color.set(0x6fa8ff)
  },
  // 18 · Clic : la lampe torche. « Suivez-moi. »
  torche(t) {
    mood('dark')
    crowd.visible = true
    layoutCrowd(t, (i, c) => {
      const x = -14 + c.rx * 28
      const z = -4 + c.rz * 30
      if (z > 14 || Math.hypot(x, z - 15) < 2.4) return null
      return { x, z, ry: Math.PI + (c.rx - 0.5), up: 0.3, bob: 0.2 }
    }, { phones: 0 })
    beams.forEach((b) => (b.visible = false))
    show(HERO)
    const on = t > W('18', 'allume') - 0.05
    const turn = smooth(t, W('18', 'suivezmoi') - 0.3, 0.5)
    HERO.update(t, { x: 0, z: 15, ry: lerp(0, -0.9, turn), hold: on ? 'torch' : null, face: on ? { brows: 'focus', mouth: turn > 0.5 ? 'open' : 'flat' } : { mouth: 'flat' } })
    torch.intensity = on ? 220 : 0
    HERO.root.updateMatrixWorld(true)
    const lp = HERO.lamp.getWorldPosition(new THREE.Vector3())
    const dir = V3(0, -0.12, 1).applyAxisAngle(V3(0, 1, 0), lerp(0, -0.9, turn))
    torch.position.copy(lp)
    torch.target.position.copy(lp.clone().add(dir.multiplyScalar(10)))
    torchCone.visible = on
    torchCone.position.copy(lp)
    torchCone.lookAt(torch.target.position)
    key.position.copy(lp).add(V3(0, -0.6, 0.5))
    key.color.set(0xfff0c0)
    key.intensity = on ? 10 : 0
    lookCam(1.2, 2.5, 20.5, 0, 2.3, 14.5)
  },
  // 19 · Il guide la foule dans le noir (vue du ciel).
  file(t) {
    mood('dark')
    hemi.color.set(0x8fa5f0)
    hemi.intensity = 1.2
    const marks = ['gauche', 'droite', 'fontaine', 'boulangerie'].map((w) => W('19', w))
    const d = routeD(t, marks)
    const { p, dir } = pathAt(ROUTE, d)
    show(HERO)
    HERO.update(t, { x: p.x, z: p.z, ry: Math.atan2(dir.x, dir.z), walk: t * 7, stride: 0.7, hold: 'torch', scale: 1.4 })
    heroMark.visible = true
    heroMark.scale.setScalar(0.55)
    heroMark.position.set(p.x, 0.3, p.z)
    drawTrail(d)
    crowd.visible = true
    layoutCrowd(t, (i) => {
      const back = d - 2.4 - i * 0.6
      if (back < -40 || i > 300) return null
      const q = back >= 0 ? pathAt(ROUTE, back) : { p: ROUTE[0].clone().add(V3(0, 0, -back)), dir: V3(0, 0, -1) }
      const side = ((i % 3) - 1) * 1.1
      const n = V3(-q.dir.z, 0, q.dir.x)
      return { x: q.p.x + n.x * side, z: q.p.z + n.z * side, ry: Math.atan2(q.dir.x, q.dir.z), bob: 1 }
    }, { phones: 0 })
    HERO.root.updateMatrixWorld(true)
    const lp = HERO.lamp.getWorldPosition(new THREE.Vector3())
    torch.intensity = 260
    torch.angle = 0.5
    torch.position.copy(lp)
    torch.target.position.set(lp.x + dir.x * 10, 0, lp.z + dir.z * 10)
    torchCone.visible = true
    torchCone.position.copy(lp)
    torchCone.lookAt(torch.target.position)
    droneCam(d)
  },
  // 20 · Le chien rentre aussi : lui aussi connaissait le chemin.
  chien2(t) {
    mood('dark')
    hemi.intensity = 1.1
    DOG.root.visible = true
    const u = t - SHOT.chien2.t0
    const into = smooth(t, W('20', 'chemin') - 0.6, 0.9)
    const z = lerp(14 - u * 2.6, 2, into)
    const x = lerp(20, 23.5, into)
    DOG.update(t, { x, z, ry: lerp(Math.PI, Math.PI / 2, into), walk: t * 12, wag: 1.4, scale: 1.3 })
    GLOW.windows = 0.3
    key.position.set(22, 3, 4)
    key.color.set(0xffd9a0)
    key.intensity = 60
    key.position.set(x - 1.5, 3, z + 2)
    lookCam(17.4, 1.6, z + 4.5, x, 0.9, z)
  },
  // 21 · Le lendemain : le badge de guide officiel.
  badge(t) {
    mood('day')
    show(HERO, MAYOR)
    const tb = W('21', 'badge')
    HERO.badge.visible = t > tb - 0.1
    HERO.badge.scale.setScalar(pop(t, tb - 0.1, 0.4))
    const scratch = t > W('21', 'comment') - 0.2
    MAYOR.update(t, { x: -1.2, z: 18.5, ry: Math.PI / 2 + 0.3, armR: scratch ? [-2.6, -0.4] : t > tb - 0.6 && t < tb + 0.2 ? [-1.4, 0.2] : [0, 0.1], face: scratch ? { brows: 'worried', mouth: 'o' } : { mouth: 'smile' } })
    HERO.update(t, { x: 1.4, z: 18.5, ry: -Math.PI / 2 - 0.3, face: t > tb ? { mouth: 'grin', eyes: 'happy' } : { mouth: 'smile' } })
    walkers(t, [-6, 6, -9, 9], { phones: false, zSpan: [8, 22], speed: 0.6 })
    lookCam(0.2, 3.0, 8.0, 0, 2.3, 18.5)
    key.intensity = 0
  },
  // 22 · Fin : la ville lève les yeux ; feux d'artifice.
  fin(t) {
    mood('night')
    show(HERO)
    HERO.update(t, { x: 0, y: 0.9, z: 4.1, ry: Math.PI - 0.5, headPitch: -0.45, face: { mouth: 'smile', look: [0, -0.8] } })
    crowd.visible = true
    layoutCrowd(t, (i, c) => {
      if (i > 160) return null
      const a = c.rx * Math.PI * 2
      const r = 6 + c.rz * 9
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r + 2
      if (z > 4 && Math.abs(x) < 3) return null
      return { x, z, ry: Math.PI, bob: 0.6, down: 0 }
    }, { phones: 0, look: 1 })
    stage.visible = false
    updateFireworks(t, SHOT.fin.t0 + 0.3, true)
    const u = smooth(t, SHOT.fin.t0, SHOT.fin.t1 - SHOT.fin.t0)
    lookCam(lerp(3.8, 0, u), lerp(3.0, 6, u), lerp(0.2, 16, u), 0, lerp(3.4, 8, u), lerp(4.2, -30, u))
    key.position.set(0, 5, 11)
    key.intensity = 18
  },
}

// ================================================================== seek

function seek(t) {
  t = clamp(t, 0, C.duration - 1e-6)
  const sh = C.shots.findLast((s) => t >= s.t0) ?? C.shots[0]
  hide()
  key.intensity = 0
  key.color.set(0xffb36b)
  fillL.intensity = 0
  fillL.color.set(0x9fd0ff)
  torch.intensity = 0
  torch.angle = 0.42
  bigPhone.scale.setScalar(1)
  heroMark.scale.setScalar(1)
  beams.forEach((b) => (b.visible = true))
  SHOTS[sh.id](t, t - sh.t0)
  applyGlow(t)
  // Le voisin filme : cadre REC.
  rec.style.display = sh.id === 'voisin' ? 'block' : 'none'
  recTime.textContent = `00:0${Math.floor(t - SHOT.voisin.t0)}`
  // Fondu au noir à la panne ; flash au clic de la lampe.
  const tp = W('16', 'panne')
  fadeEl.style.opacity = String(t > tp && t < tp + 0.35 ? 0.85 * (1 - (t - tp) / 0.35) : 0)
  const ta = W('18', 'allume') - 0.05
  flashEl.style.opacity = String(t > ta && t < ta + 0.2 ? 0.6 * (1 - (t - ta) / 0.2) : 0)
  renderer.render(scene, camera)
  updateTags(t)
  updateWord(t)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  // Les textures dessinées attendent la police.
  for (const t of [guidouTex]) t.needsUpdate = true
  seek(0)
})()
window.__promo = { ready, seek, duration: C.duration, fps: FPS }
