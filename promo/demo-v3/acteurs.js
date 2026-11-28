/**
 * ============================================================================
 *  Acteurs v3 : personnages 3D de Quaternius (CC0) animés par capture
 * ============================================================================
 *  - Corps : « Universal Base Characters » (homme, femme ; peau claire ou mate).
 *  - Coiffures et sourcils du même pack, rattachés au squelette par nom d'os.
 *  - Animations : « Universal Animation Library » (même squelette Unreal) :
 *    parler debout, assis, réactions… jouées de façon déterministe
 *    (on fixe l'instant de chaque animation, rien ne dépend de l'horloge).
 *  - Vêtements (robes d'avocat, pull) : pièces rigides accrochées aux os.
 *  - Bouche : une petite cavité accrochée à l'os de la tête, qui s'ouvre au
 *    rythme de la voix (le modèle n'a pas d'os de mâchoire).
 *
 *    const lib = await loadLibrary('assets/')
 *    const a = makeActor(lib, { body: 'male', hair: 'Hair_SimpleParted', outfit: { robe: '#7a1a14' } })
 *    a.pose([{ clip: 'Idle_Talking_Loop', time: t }], { mouth: 0.5, look: [...] })
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

const HAIRS = ['Hair_SimpleParted', 'Hair_Buns', 'Hair_Long', 'Hair_Beard', 'Hair_Buzzed', 'Eyebrows_Regular', 'Eyebrows_Female']

export async function loadLibrary(base) {
  const loader = new GLTFLoader()
  const load = (u) => loader.loadAsync(base + u)
  const tex = new THREE.TextureLoader()
  const skin = (u) =>
    tex.loadAsync(base + u).then((t) => {
      t.flipY = false
      t.colorSpace = THREE.SRGBColorSpace
      return t
    })
  const [male, female, ual, ...rest] = await Promise.all([
    load('Superhero_Male_FullBody.gltf'),
    load('Superhero_Female_FullBody.gltf'),
    load('UAL1_Standard.glb'),
    ...HAIRS.map((h) => load(h + '.gltf')),
    skin('T_Superhero_Male_Light.png'),
    skin('T_Superhero_Female_Light.png'),
  ])
  const hairs = Object.fromEntries(HAIRS.map((h, i) => [h, rest[i]]))
  const [maleLight, femaleLight] = rest.slice(HAIRS.length)
  const clips = Object.fromEntries(ual.animations.map((c) => [c.name, c]))
  return { male, female, hairs, clips, skins: { male: maleLight, female: femaleLight } }
}

/** Garde les rotations (et la position du bassin) : les proportions restent celles du personnage. */
function retarget(clip, bones, only = null) {
  const tracks = clip.tracks.filter((tr) => {
    const [node, prop] = tr.name.split('.')
    if (!bones[node]) return false
    if (only && !only.includes(node)) return false
    return prop === 'quaternion' || (prop === 'position' && node === 'pelvis')
  })
  return new THREE.AnimationClip(clip.name + (only ? '_part' : ''), clip.duration, tracks)
}

const ARM_R = ['clavicle_r', 'upperarm_r', 'lowerarm_r', 'hand_r']
const ARM_L = ['clavicle_l', 'upperarm_l', 'lowerarm_l', 'hand_l']

/**
 * Un acteur. body : 'male' | 'female' ; skin : 'light' | 'dark' ;
 * hair : nom d'une coiffure ; hairColor ; outfit : { robe } ou { sweater }.
 */
export function makeActor(lib, { body = 'male', skin = 'light', hair = null, beard = false, hairColor = '#3a2416', outfit = {}, height = 3.35 } = {}) {
  const src = lib[body]
  const root = SkeletonUtils.clone(src.scene)
  const bones = {}
  root.traverse((o) => {
    if (o.isBone) bones[o.name] = o
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = true
      o.frustumCulled = false
      o.material = o.material.clone()
      if (skin === 'light' && /Superhero/.test(o.material.name)) o.material.map = lib.skins[body]
    }
  })
  // Coiffure, barbe et sourcils : maillages rattachés à nos os, par leur nom.
  const attachSkinned = (gltf, color) => {
    const sc = SkeletonUtils.clone(gltf.scene)
    const found = []
    sc.traverse((o) => o.isSkinnedMesh && found.push(o))
    for (const o of found) {
      const skel = new THREE.Skeleton(
        o.skeleton.bones.map((b) => bones[b.name] ?? b),
        o.skeleton.boneInverses,
      )
      o.material = o.material.clone()
      o.material.color = new THREE.Color(color)
      o.castShadow = true
      o.frustumCulled = false
      root.add(o)
      o.bind(skel, o.bindMatrix)
    }
  }
  if (hair) attachSkinned(lib.hairs[hair], hairColor)
  if (beard) attachSkinned(lib.hairs.Hair_Beard, hairColor)
  // Les sourcils du corps prennent la couleur des cheveux.
  root.traverse((o) => {
    if (o.isMesh && /Hair/.test(o.material.name)) o.material.color = new THREE.Color(hairColor)
  })

  // Taille : le modèle mesure environ 1,8 m ; on le met à l'échelle de nos décors.
  const box = new THREE.Box3().setFromObject(root)
  const g = new THREE.Group()
  const s = height / (box.max.y - box.min.y)
  root.scale.setScalar(s)
  g.add(root)

  // Vêtements. Le haut et le pantalon sont des copies du corps, gonflées et
  // coupées (on ne garde que la zone voulue, mesurée en pose de repos) : ils
  // épousent la silhouette et suivent chaque mouvement. Le bas de la robe est
  // une jupe évasée accrochée au bassin.
  root.updateMatrixWorld(true)
  const bodyMesh = (() => {
    let best = null
    root.traverse((o) => o.isSkinnedMesh && /Superhero/.test(o.material.name) && (best = o))
    return best
  })()
  const local = (name) => bodyMesh.worldToLocal(bones[name].getWorldPosition(new THREE.Vector3()))
  const zone = {
    neck: local('neck_01').y + (local('Head').y - local('neck_01').y) * 0.15,
    hips: local('thigh_l').y + 0.02,
    knee: local('calf_l').y,
    ankle: local('foot_l').y + 0.04,
    wrist: Math.abs(local('hand_l').x) - 0.02,
    shoulder: Math.abs(local('upperarm_l').x) + 0.03,
  }
  const garment = (color, { top = zone.neck, bottom = zone.hips, minX = -1, maxX = zone.wrist, inflate = 0.006, roughness = 0.8 }) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness })
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, { uTop: { value: top }, uBottom: { value: bottom }, uMinX: { value: minX }, uMaxX: { value: maxX }, uInflate: { value: inflate } })
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform float uInflate;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;\ntransformed += normal * uInflate;')
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vBind;\nuniform float uTop, uBottom, uMinX, uMaxX;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vBind.y > uTop || vBind.y < uBottom || abs(vBind.x) > uMaxX || abs(vBind.x) < uMinX) discard;')
    }
    const m = new THREE.SkinnedMesh(bodyMesh.geometry, mat)
    m.castShadow = m.receiveShadow = true
    m.frustumCulled = false
    bodyMesh.parent.add(m)
    m.position.copy(bodyMesh.position)
    m.quaternion.copy(bodyMesh.quaternion)
    m.scale.copy(bodyMesh.scale)
    m.bind(bodyMesh.skeleton, bodyMesh.bindMatrix)
    return m
  }
  if (outfit.robe) {
    // Manches ajustées (elles suivent les bras) ; le buste est une pièce plus raide, qui cache la musculature.
    garment(outfit.robe, { minX: zone.shoulder - 0.1, bottom: zone.hips, inflate: 0.022 })
    // Les jambes, sous la robe, prennent sa couleur (elles ne dépassent plus de la fente).
    garment(outfit.robe, { top: zone.hips + 0.02, bottom: zone.ankle, inflate: 0.012 })
    const k0 = height / 3.35
    const neckW = bones.neck_01.getWorldPosition(new THREE.Vector3())
    const pelvisW = bones.pelvis.getWorldPosition(new THREE.Vector3())
    const shW = bones.upperarm_l.getWorldPosition(new THREE.Vector3()).distanceTo(bones.upperarm_r.getWorldPosition(new THREE.Vector3()))
    const h = neckW.y - pelvisW.y
    const bust = new THREE.Mesh(
      new THREE.LatheGeometry([[shW * 0.5, -0.05 * h], [shW * 0.56, 0.45 * h], [shW * 0.62, 0.78 * h], [shW * 0.55, 0.92 * h], [shW * 0.3, 1.0 * h], [shW * 0.17, 1.04 * h]].map(([x, y]) => new THREE.Vector2(x, y)), 48),
      new THREE.MeshStandardMaterial({ color: outfit.robe, roughness: 0.85 }),
    )
    bust.name = 'bust'
    const headW = bones.Head.getWorldPosition(new THREE.Vector3())
    bust.scale.set(1, 1, 0.78)
    bust.position.set(neckW.x, pelvisW.y, headW.z + 0.02 * k0)
    bust.castShadow = bust.receiveShadow = true
    g.add(bust)
    g.updateMatrixWorld(true)
    bones.spine_02.attach(bust)
    // Rabat blanc, accroché au haut du buste.
    const neck = bones.neck_01.getWorldPosition(new THREE.Vector3())
    const k = height / 3.35
    const white = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 })
    for (const sd of [-1, 1]) {
      const tab = new THREE.Mesh(new THREE.BoxGeometry(0.075 * k, 0.22 * k, 0.025 * k), white)
      tab.position.set(neck.x + sd * 0.055 * k, neck.y - 0.13 * k, bones.Head.getWorldPosition(new THREE.Vector3()).z + shW * 0.39)
      tab.rotation.x = -0.2
      g.add(tab)
      g.updateMatrixWorld(true)
      bones.spine_03.attach(tab)
    }
    // Jupe de la robe : de la taille jusqu'au sol.
    const pelvis = bones.pelvis.getWorldPosition(new THREE.Vector3())
    const hipW = bones.thigh_l.getWorldPosition(new THREE.Vector3()).distanceTo(bones.thigh_r.getWorldPosition(new THREE.Vector3()))
    const skirt = new THREE.Mesh(
      new THREE.LatheGeometry([[hipW * 2.3, -pelvis.y + 0.04], [hipW * 1.75, -pelvis.y * 0.5], [shW * 0.56, -pelvis.y * 0.1], [shW * 0.51, 0.2 * k]].map(([x, y]) => new THREE.Vector2(x, y)), 40),
      new THREE.MeshStandardMaterial({ color: outfit.robe, roughness: 0.8 }),
    )
    skirt.scale.set(1, 1, 0.75)
    skirt.position.copy(pelvis)
    skirt.castShadow = skirt.receiveShadow = true
    g.add(skirt)
    g.updateMatrixWorld(true)
    bones.pelvis.attach(skirt)
  }
  if (outfit.sweater) {
    garment(outfit.sweater, { bottom: zone.hips - 0.04, inflate: 0.016 })
    garment(outfit.pants ?? '#3b3f4a', { top: zone.hips, bottom: zone.ankle, inflate: 0.007 })
  }

  // Bouche : cavité sombre devant les lèvres, rattachée à l'os de la tête.
  const head = bones.Head
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshBasicMaterial({ color: '#3a1216' }))
  mouth.visible = false
  head.add(mouth)

  // Animations.
  const mixer = new THREE.AnimationMixer(root)
  const actions = {}
  const action = (name, part = null) => {
    const key = part ? `${name}:${part}` : name
    if (!actions[key]) {
      const only = part === 'armR' ? ARM_R : part === 'armL' ? ARM_L : null
      const a = mixer.clipAction(retarget(lib.clips[name], bones, only))
      a.play()
      a.paused = true
      actions[key] = a
    }
    return actions[key]
  }
  const tmpQ = new THREE.Quaternion()
  const tmpE = new THREE.Euler()
  const add = (bone, x = 0, y = 0, z = 0) => {
    tmpQ.setFromEuler(tmpE.set(x, y, z))
    bones[bone].quaternion.multiply(tmpQ)
  }

  /**
   * layers : [{ clip, time, weight = 1, part = null | 'armR' | 'armL' }]
   * extra : { mouth 0 → 1, nod, turn, tilt (radians, ajoutés à la tête), straightIndex: 'r' | 'l' }
   */
  function pose(layers, extra = {}) {
    for (const a of Object.values(actions)) a.setEffectiveWeight(0)
    // Les gestes d'un bras (part) passent par-dessus le reste du corps, après le mélange.
    const overrides = layers.filter((l) => l.part)
    for (const l of layers.filter((l) => !l.part)) {
      const a = action(l.clip, l.part)
      a.time = l.loop === false ? Math.min(l.time, a.getClip().duration - 1e-3) : ((l.time % a.getClip().duration) + a.getClip().duration) % a.getClip().duration
      a.setEffectiveWeight(l.weight ?? 1)
    }
    mixer.update(0)
    for (const l of overrides) {
      if (!(l.weight > 0.001)) continue
      const only = l.part === 'armR' ? ARM_R : ARM_L
      const clip = lib.clips[l.clip]
      const time = Math.min(Math.max(0, l.time), clip.duration - 1e-3)
      for (const tr of clip.tracks) {
        const [node, prop] = tr.name.split('.')
        if (prop !== 'quaternion' || !only.includes(node)) continue
        const v = (tr._interp ??= tr.createInterpolant()).evaluate(time)
        tmpQ.fromArray(v)
        bones[node].quaternion.slerp(tmpQ, Math.min(1, l.weight))
      }
    }
    const { nod = 0, turn = 0, tilt = 0, spine = 0, mouthOpen = 0, straightIndex = null } = extra
    add('neck_01', nod * 0.4, turn * 0.4, tilt * 0.4)
    add('Head', nod * 0.6, turn * 0.6, tilt * 0.6)
    if (spine) add('spine_02', spine, 0, 0)
    if (straightIndex) for (const b of ['index_01', 'index_02', 'index_03']) bones[`${b}_${straightIndex}`].quaternion.identity()
    const m = Math.max(0, Math.min(1, mouthOpen))
    mouth.visible = m > 0.04
    mouth.userData.open = m
    placeMouth(m)
  }
  // Position de la bouche dans le repère de l'os de la tête (réglée sur le modèle).
  const M = body === 'male' ? { y: 0.035, z: 0.113, w: 0.016 } : { y: 0.03, z: 0.106, w: 0.014 }
  function placeMouth(m) {
    mouth.position.set(0, M.y, M.z)
    mouth.scale.set(M.w * (0.9 + 0.2 * m), M.w * (0.08 + 0.5 * m), M.w * 0.3)
  }
  pose([{ clip: 'Idle_Loop', time: 0 }])
  return { g, root, bones, pose, mouth, setMouth: (y, z, w) => Object.assign(M, { y, z, w }) }
}
