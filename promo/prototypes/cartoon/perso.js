/**
 * ============================================================================
 *  Personnages v2 : style « dessin animé 3D »
 * ============================================================================
 *  Tête expressive (yeux avec iris et reflet, paupières qui clignent, sourcils,
 *  bouche synchronisée sur la voix), mains, coiffures, rendu en aplats (toon)
 *  avec un contour sombre. Tout est une fonction du temps : `update(t, état)`.
 *
 *    const p = makeChar(parent, { outfit: 'robe', robe: '#B3261E', hair: 'short' })
 *    p.update(t, { mouth: 0.6, brows: 'angry', look: [x, y, z], arm: 'point' })
 */

import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

// ------------------------------------------------------------- matières

const GRADIENT = (() => {
  const data = new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 225, 225, 225, 255, 255, 255, 255, 255])
  const t = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat)
  t.minFilter = t.magFilter = THREE.NearestFilter
  t.needsUpdate = true
  return t
})()

/** Matière en aplats (3 niveaux d'ombre). */
export const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: GRADIENT, ...o })

const OUTLINE = new THREE.ShaderMaterial({
  uniforms: { width: { value: 0.022 }, color: { value: new THREE.Color('#1a1210') } },
  vertexShader: `
    uniform float width;
    void main() {
      vec3 p = position + normal * width;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 color;
    void main() { gl_FragColor = vec4(color, 1.0); }`,
  side: THREE.BackSide,
})

/** Ajoute un contour (coque inversée) à un maillage. */
export function outline(mesh, width = 0.022) {
  const mat = width === 0.022 ? OUTLINE : OUTLINE.clone()
  if (mat !== OUTLINE) mat.uniforms.width.value = width
  const o = new THREE.Mesh(mesh.geometry, mat)
  o.castShadow = false
  o.receiveShadow = false
  mesh.add(o)
  return mesh
}

function mesh(geo, mat, parent, { line = 0.022, shadow = true } = {}) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = shadow
  m.receiveShadow = true
  if (line) outline(m, line)
  if (parent) parent.add(m)
  return m
}
const group = (parent, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  if (parent) parent.add(g)
  return g
}
const rbox = (w, h, d, r, mat, parent, o) => mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2) * 0.999), mat, parent, o)
const sphere = (r, mat, parent, o, ws = 32, hs = 24) => mesh(new THREE.SphereGeometry(r, ws, hs), mat, parent, o)
const capsule = (r, l, mat, parent, o) => mesh(new THREE.CapsuleGeometry(r, l, 8, 20), mat, parent, o)

// --------------------------------------------------------------- la tête

function makeHead(parent, { skin, hair, hairColor, eyes, brows: browColor, lashes }) {
  const head = group(parent)
  const skinM = toon(skin)
  const skull = sphere(0.5, skinM, head)
  skull.scale.set(1, 1.06, 0.96)
  skull.position.y = 0.42
  // Oreilles, nez, joues.
  for (const s of [-1, 1]) {
    const ear = sphere(0.1, skinM, head, { line: 0.015 })
    ear.scale.set(0.6, 1, 0.8)
    ear.position.set(s * 0.49, 0.4, -0.02)
  }
  const nose = sphere(0.075, skinM, head, { line: 0.012 })
  nose.scale.set(1, 0.9, 1.1)
  nose.position.set(0, 0.33, 0.49)
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(new THREE.CircleGeometry(0.075, 20), new THREE.MeshBasicMaterial({ color: '#ff8a7a', transparent: true, opacity: 0.35, depthWrite: false }))
    cheek.position.set(s * 0.27, 0.26, 0.44)
    cheek.rotation.y = s * 0.55
    head.add(cheek)
  }
  // Yeux : blanc, iris, pupille, reflet ; la paupière ferme l'œil (échelle verticale).
  const eyeL = [],
    irises = []
  for (const s of [-1, 1]) {
    const eye = group(head, s * 0.18, 0.47, 0.41)
    const white = sphere(0.105, toon('#ffffff'), eye, { line: 0.012 })
    white.scale.set(0.9, 1.05, 0.55)
    const iris = group(eye, 0, 0, 0.045)
    const irisM = sphere(0.062, new THREE.MeshBasicMaterial({ color: eyes }), iris, { line: 0 })
    irisM.scale.z = 0.4
    const pupil = sphere(0.032, new THREE.MeshBasicMaterial({ color: '#0d0b0a' }), iris, { line: 0 })
    pupil.position.z = 0.018
    pupil.scale.z = 0.4
    const glint = sphere(0.016, new THREE.MeshBasicMaterial({ color: '#ffffff' }), iris, { line: 0 })
    glint.position.set(0.022, 0.024, 0.03)
    if (lashes) {
      const lash = rbox(0.17, 0.03, 0.04, 0.012, toon('#1a1210'), eye, { line: 0 })
      lash.position.set(s * 0.015, 0.1, 0.02)
      lash.rotation.z = s * -0.15
    }
    eyeL.push(eye)
    irises.push(iris)
  }
  // Sourcils.
  const brows = [-1, 1].map((s) => {
    const b = rbox(0.17, 0.045, 0.05, 0.02, toon(browColor), head, { line: 0 })
    b.position.set(s * 0.19, 0.62, 0.42)
    b.userData.side = s
    return b
  })
  // Bouche : une cavité sombre qui s'ouvre, des dents en haut, une langue.
  const mouth = group(head, 0, 0.17, 0.455)
  const cavity = sphere(0.1, new THREE.MeshBasicMaterial({ color: '#3a0f12' }), mouth, { line: 0.01 })
  cavity.scale.set(1, 0.15, 0.35)
  const teeth = rbox(0.12, 0.03, 0.03, 0.01, new THREE.MeshBasicMaterial({ color: '#fdf8f0' }), mouth, { line: 0 })
  teeth.position.set(0, 0.02, 0.025)
  const tongue = sphere(0.05, new THREE.MeshBasicMaterial({ color: '#c4515a' }), mouth, { line: 0 })
  tongue.scale.set(1, 0.4, 0.5)
  tongue.position.set(0, -0.02, 0.01)
  // Coiffure.
  const hairM = toon(hairColor)
  const cap = (theta = 0.46) => {
    const c = mesh(new THREE.SphereGeometry(0.535, 32, 16, 0, Math.PI * 2, 0, Math.PI * theta), hairM, head)
    c.position.y = 0.44
    c.scale.set(1, 1.06, 0.98)
    return c
  }
  if (hair === 'short') {
    const c = cap(0.42)
    c.rotation.x = -0.18
    const fringe = rbox(0.62, 0.16, 0.22, 0.08, hairM, head)
    fringe.position.set(0.05, 0.78, 0.33)
    fringe.rotation.set(0.5, 0, -0.12)
  } else if (hair === 'bun') {
    const c = cap(0.5)
    c.rotation.x = -0.22
    const bun = sphere(0.2, hairM, head)
    bun.position.set(0, 0.92, -0.32)
    for (const s of [-1, 1]) {
      const lock = capsule(0.07, 0.28, hairM, head)
      lock.position.set(s * 0.42, 0.42, 0.18)
      lock.rotation.z = s * 0.15
    }
  } else if (hair === 'grey') {
    const c = cap(0.36)
    c.rotation.x = -0.45
    for (const s of [-1, 1]) {
      const side = sphere(0.2, hairM, head)
      side.scale.set(0.6, 0.9, 1.1)
      side.position.set(s * 0.42, 0.5, -0.08)
    }
  }
  return { head, eyes: eyeL, irises, brows, mouth: { g: mouth, cavity, teeth, tongue } }
}

// ------------------------------------------------------------ le corps

/** Main en moufle (paume + doigts + pouce) ; l'index peut se tendre. */
function makeHand(parent, skinM, s) {
  const hand = group(parent)
  const palm = rbox(0.2, 0.22, 0.1, 0.05, skinM, hand, { line: 0.012 })
  palm.position.y = -0.1
  const fingers = rbox(0.19, 0.14, 0.09, 0.045, skinM, hand, { line: 0.012 })
  fingers.position.set(0, -0.24, 0.02)
  const index = capsule(0.035, 0.16, skinM, hand, { line: 0.01 })
  index.position.set(s * 0.06, -0.33, 0.02)
  const thumb = capsule(0.035, 0.1, skinM, hand, { line: 0.01 })
  thumb.position.set(s * -0.11, -0.12, 0.04)
  thumb.rotation.z = s * 0.6
  return { hand, fingers, index }
}

function makeArm(parent, x, sleeveM, skinM, s) {
  const root = group(parent, x, 1.18, 0)
  capsule(0.14, 0.42, sleeveM, root).position.y = -0.3
  const mid = group(root, 0, -0.6, 0)
  sphere(0.135, sleeveM, mid, { line: 0.015 })
  capsule(0.125, 0.38, sleeveM, mid).position.y = -0.28
  const cuff = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 20), toon('#f4f1ea'), mid, { line: 0.012 })
  cuff.position.y = -0.52
  const wrist = group(mid, 0, -0.56, 0)
  return { root, mid, wrist, ...makeHand(wrist, skinM, s) }
}

/**
 * Un personnage. outfit : 'robe' (robe d'avocat ou de juge, avec rabat blanc)
 * ou 'sweater'. hair : 'short', 'bun' ou 'grey'.
 */
export function makeChar(parent, o = {}) {
  const { skin = '#f2c9a0', outfit = 'robe', robe = '#1B1D22', sweater = '#2f7a8a', hair = 'short', hairColor = '#2b2118', eyes = '#5a3a22', lashes = false, scale = 1 } = o
  const g = group(parent)
  g.scale.setScalar(scale)
  const skinM = toon(skin)
  const cloth = toon(outfit === 'robe' ? robe : sweater)
  const hips = group(g, 0, 1.55, 0)
  const torso = group(hips)
  if (outfit === 'robe') {
    // Robe évasée jusqu'au sol, épaulettes arrondies, rabat blanc.
    // Du bas vers le haut : les normales pointent vers l'extérieur (sinon le contour passe devant).
    const pts = [[0.8, -1.55], [0.72, -0.8], [0.62, 0.3], [0.6, 1.0], [0.52, 1.3], [0.24, 1.42]].map(([x, y]) => new THREE.Vector2(x, y))
    mesh(new THREE.LatheGeometry(pts, 48), cloth, torso)
    for (const s of [-1, 1]) {
      const tab = rbox(0.13, 0.34, 0.05, 0.03, toon('#ffffff'), torso, { line: 0.012 })
      tab.position.set(s * 0.075, 1.18, 0.5)
      tab.rotation.set(-0.12, 0, s * 0.06)
    }
    // Revers de la robe.
    for (const s of [-1, 1]) {
      const lapel = rbox(0.18, 0.7, 0.05, 0.03, toon(new THREE.Color(robe).multiplyScalar(0.7)), torso, { line: 0.012 })
      lapel.position.set(s * 0.24, 1.0, 0.5)
      lapel.rotation.set(-0.12, 0, s * -0.22)
    }
  } else {
    const body = capsule(0.5, 0.75, cloth, torso)
    body.position.y = 0.72
    body.scale.set(1, 1, 0.85)
    const collar = mesh(new THREE.TorusGeometry(0.2, 0.06, 10, 24), cloth, torso, { line: 0.012 })
    collar.rotation.x = Math.PI / 2
    collar.position.y = 1.36
    // Badge d'enseignante.
    const badge = rbox(0.16, 0.2, 0.03, 0.02, toon('#f4f1ea'), torso, { line: 0.01 })
    badge.position.set(-0.22, 1.0, 0.43)
  }
  mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.3, 20), skinM, torso, { line: 0.015 }).position.y = 1.45
  const neck = group(torso, 0, 1.5, 0)
  const H = makeHead(neck, { skin, hair, hairColor, eyes, brows: hairColor, lashes })
  const armL = makeArm(torso, 0.6, cloth, skinM, 1)
  const armR = makeArm(torso, -0.6, cloth, skinM, -1)
  // Jambes (cachées par la robe ou le box, mais présentes pour les plans larges).
  const legs = []
  if (outfit !== 'robe') {
    for (const s of [-1, 1]) {
      const leg = group(hips, s * 0.22, 0, 0)
      capsule(0.17, 0.6, toon('#3b3f4a'), leg).position.y = -0.4
      const knee = group(leg, 0, -0.8, 0)
      capsule(0.15, 0.55, toon('#3b3f4a'), knee).position.y = -0.38
      const shoe = rbox(0.24, 0.16, 0.42, 0.07, toon('#1f2430'), knee)
      shoe.position.set(0, -0.78, 0.1)
      legs.push({ leg, knee })
    }
  }

  const tmp = new THREE.Vector3()
  const BROWS = {
    neutral: [0, 0],
    angry: [-0.05, 0.35],
    sad: [0.02, -0.4],
    surprised: [0.08, 0],
    determined: [-0.03, 0.2],
  }
  /**
   * L'état du personnage à l'instant t :
   *  mouth 0 → 1, brows (nom ou [hauteur, angle]), look (point du monde regardé),
   *  blink 0 → 1 (forcé) sinon clignements automatiques, lean / nod / turn / tilt,
   *  arms : { L: [épaule avant, épaule côté, coude], R: [...] }, point : index tendu.
   */
  function update(t, st = {}) {
    const { mouth = 0, brows = 'neutral', look = null, lean = 0, nod = 0, turn = 0, tilt = 0, twist = 0, breathe = 1, arms = {}, point = null, seed = 0, eyesClosed = 0 } = st
    // Respiration.
    const br = Math.sin(t * 2.1 + seed) * 0.012 * breathe
    torso.scale.set(1 + br * 0.5, 1 + br, 1 + br * 0.5)
    torso.rotation.set(lean, twist, 0)
    neck.rotation.set(nod + Math.sin(t * 1.3 + seed) * 0.02, turn + Math.sin(t * 0.7 + seed) * 0.03, tilt)
    // Bras.
    const setArm = (A, v, s) => {
      const [fwd = 0.25, side = 0.12, elbow = 0.3, wrist = 0] = v
      A.root.rotation.set(-fwd, 0, s * side)
      A.mid.rotation.set(-elbow, 0, 0)
      A.wrist.rotation.set(wrist, 0, 0)
    }
    setArm(armL, arms.L ?? [0.2, 0.12, 0.35], 1)
    setArm(armR, arms.R ?? [0.2, 0.12, 0.35], -1)
    armL.index.visible = point === 'L'
    armR.index.visible = point === 'R'
    armL.fingers.scale.y = point === 'L' ? 0.55 : 1
    armR.fingers.scale.y = point === 'R' ? 0.55 : 1
    // Sourcils.
    const [bh, ba] = Array.isArray(brows) ? brows : BROWS[brows] ?? BROWS.neutral
    for (const b of H.brows) {
      const s = b.userData.side
      b.position.y = 0.62 + bh
      b.rotation.z = s * ba * -1
    }
    // Clignements : toutes les 2,6 à 4 s, 0,14 s.
    const period = 3.1 + (seed % 1) * 0.9
    const ph = (t + seed * 1.7) % period
    const auto = ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0
    const lid = Math.max(auto, eyesClosed)
    for (const e of H.eyes) e.scale.y = Math.max(0.08, 1 - lid)
    // Regard : les iris glissent vers la cible.
    if (look) {
      H.head.updateWorldMatrix(true, false)
      for (const iris of H.irises) {
        tmp.set(...look)
        iris.parent.worldToLocal(tmp)
        tmp.normalize()
        iris.position.set(tmp.x * 0.04, tmp.y * 0.035, 0.045)
      }
    }
    // Bouche : ouverture + un peu de largeur sur les voyelles ouvertes.
    const m = Math.max(0, Math.min(1, mouth))
    H.mouth.cavity.scale.set(1 + 0.15 * m, 0.15 + 0.95 * m, 0.35)
    H.mouth.teeth.visible = m > 0.25
    H.mouth.tongue.visible = m > 0.45
    H.mouth.tongue.position.y = -0.02 - 0.05 * m
  }
  update(0)
  return { g, hips, torso, head: H.head, neck, armL, armR, legs, update }
}
