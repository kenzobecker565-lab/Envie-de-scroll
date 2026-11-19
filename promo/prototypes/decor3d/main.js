/**
 * Essai : le tribunal low-poly (../../decors/tribunal.glb) rendu en 3D, la caméra
 * qui entre dans la salle, et le procureur en costume (personnage SVG de
 * ../costume) posé dans la scène comme un découpage en carton qui fait face à
 * la caméra. Voix et lèvres : la réplique 04 de lbd-01.
 */
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { makePerson } from '../costume/personnage.js'

const W = 1080
const H = 1920
const FPS = 30
const T0 = 13.0 // début de l'extrait dans la timeline de lbd-01
const DURATION = 6.2
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (x) => x * x * (3 - 2 * x)
const lerp = (a, b, k) => a + (b - a) * k

const TL = await (await fetch('../../lbd-01/timeline.json')).json()
const LIP = await (await fetch('../../lbd-01/levres.json')).json()
function mouthAt(t) {
  const l = TL.lines.find((x) => x.who === 'procureur' && t >= x.start && t < x.start + x.dur + 0.1)
  if (!l) return 0
  const env = LIP[l.id] ?? []
  const i = (t - l.start) * 60
  return lerp(env[Math.floor(i)] ?? 0, env[Math.floor(i) + 1] ?? 0, i % 1)
}

// ---------------------------------------------------------------- la scène
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, preserveDrawingBuffer: true })
renderer.setSize(W, H, false)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.25
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
const scene = new THREE.Scene()
scene.background = new THREE.Color('#0b1024')
scene.fog = new THREE.Fog('#0b1024', 9, 22)
const camera = new THREE.PerspectiveCamera(52, W / H, 0.05, 60)

scene.add(new THREE.HemisphereLight('#ffe6c4', '#1a2350', 1.1))
const key = new THREE.DirectionalLight('#ffe2b8', 2.2)
key.position.set(3, 7, 6)
key.castShadow = true
key.shadow.mapSize.set(2048, 2048)
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 0.5, far: 25 })
key.shadow.bias = -0.0004
scene.add(key)
const windowLight = new THREE.DirectionalLight('#8fb6ff', 1.4)
windowLight.position.set(-8, 4, -0.3)
scene.add(windowLight)
const lamp = new THREE.PointLight('#7dffb0', 3, 3.5, 2)
lamp.position.set(3.15, 1.35, -0.75)
scene.add(lamp)
const spot = new THREE.SpotLight('#fff1d6', 25, 9, 0.45, 0.6, 1.5)
spot.position.set(-1.2, 4.6, 1.5)
spot.target.position.set(-2.0, 1.0, -0.6)
scene.add(spot, spot.target)

const gltf = await new GLTFLoader().loadAsync('../../decors/tribunal.glb')
gltf.scene.traverse((o) => {
  if (!o.isMesh) return
  o.castShadow = !o.name.startsWith('Room')
  o.receiveShadow = true
  const m = o.material
  m.flatShading = true
  m.roughness = Math.max(0.55, m.roughness ?? 1)
  m.metalness = o.name.includes('Brass') ? 0.35 : 0
  if (o.name.includes('Window_Window')) {
    m.emissive = new THREE.Color('#9cc8ff')
    m.emissiveIntensity = 0.9
  }
  if (o.name.includes('BankerLamp_Green')) {
    m.emissive = new THREE.Color('#2cff7a')
    m.emissiveIntensity = 0.6
  }
  m.needsUpdate = true
})
scene.add(gltf.scene)

// ------------------------------------------- le procureur, en carton 2D
const VB = { x: -520, y: -420, w: 1040, h: 1340 }
const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
svgEl.setAttribute('viewBox', `${VB.x} ${VB.y} ${VB.w} ${VB.h}`)
svgEl.setAttribute('width', 780)
svgEl.setAttribute('height', 1005)
const PROC = { suit: '#2b2d35', shirt: '#ffffff', tie: '#c8322a', pocket: '#c8322a', hair: 'slick', hairColor: '#1d140e', skin: '#f2c4a0', iris: '#2b1d12', jabot: false }
const proc = makePerson(svgEl, PROC)
const cv = document.createElement('canvas')
cv.width = 780
cv.height = 1005
const cx = cv.getContext('2d')
const tex = new THREE.CanvasTexture(cv)
tex.colorSpace = THREE.SRGBColorSpace
tex.anisotropy = 8
const M_PER_UNIT = 1.85 / 1180
const planeH = VB.h * M_PER_UNIT
const planeW = VB.w * M_PER_UNIT
const card = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.02, toneMapped: false }))
const FEET = 842 // pieds du personnage, en unités SVG
const STAND = new THREE.Vector3(-2.0, 0, -0.55)
card.position.set(STAND.x, planeH / 2 - (VB.y + VB.h - FEET) * M_PER_UNIT, STAND.z)
card.castShadow = true
scene.add(card)
const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.38, depthWrite: false }))
shadow.rotation.x = -Math.PI / 2
shadow.scale.set(1, 0.45, 1)
shadow.position.set(STAND.x, 0.012, STAND.z)
scene.add(shadow)

async function drawCard(t) {
  const lt = T0 + t
  const m = mouthAt(lt)
  // Les gestes suivent la voix : le bras droit martèle les mots forts.
  const g = clamp(m * 1.4)
  proc.update(lt, { mouth: m, brows: 'angry', look: [0.15, 0.05], armR: [0.35 + 0.55 * g, 0.9 + 0.5 * g], armL: [0.12, 0.35], point: g > 0.5, seed: 1.1 })
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svgEl))
  const img = new Image()
  img.src = url
  await img.decode()
  cx.clearRect(0, 0, cv.width, cv.height)
  cx.drawImage(img, 0, 0, cv.width, cv.height)
  tex.needsUpdate = true
}

// ----------------------------------------------------------- la caméra
const SHOTS = [
  // [temps, position, cible]
  [0.0, [2.2, 3.5, 4.6], [-1.1, 1.5, -2.6]],
  [2.4, [-0.5, 1.75, 2.3], [-2.0, 1.5, -0.6]],
  [DURATION, [-1.15, 1.7, 1.25], [-2.0, 1.55, -0.6]],
]
function cameraAt(t) {
  let i = 0
  while (i < SHOTS.length - 2 && t > SHOTS[i + 1][0]) i++
  const [ta, pa, la] = SHOTS[i]
  const [tb, pb, lb] = SHOTS[i + 1]
  const k = i === 0 ? smooth(clamp((t - ta) / (tb - ta))) : clamp((t - ta) / (tb - ta))
  camera.position.set(...pa.map((v, j) => lerp(v, pb[j], k)))
  // Léger flottement de caméra à l'épaule.
  camera.position.x += Math.sin(t * 1.3) * 0.015
  camera.position.y += Math.sin(t * 1.7 + 1) * 0.01
  camera.lookAt(...la.map((v, j) => lerp(v, lb[j], k)))
}

async function seek(t) {
  cameraAt(t)
  await drawCard(t)
  // Le carton fait toujours face à la caméra (rotation autour de la verticale seulement).
  card.rotation.y = Math.atan2(camera.position.x - card.position.x, camera.position.z - card.position.z)
  renderer.render(scene, camera)
}
const ready = seek(0)
window.__dbg = () => { const d = cx.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) n += d[i] > 0; return { opaque: n, cam: camera.position.toArray().map((v) => v.toFixed(2)), rotY: card.rotation.y.toFixed(2), card: card.position.toArray() } }
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
