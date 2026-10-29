/**
 * Marionnette de Minuton en images : toutes les pièces sont dessinées par ChatGPT
 * (corps, yeux, bouches, joues, bras, jambes), sur un même canevas de 1024 px aligné.
 * Le moteur choisit la bonne pièce à chaque image (substitution de dessins, comme
 * en dessin animé découpé) et anime l'ensemble : rebonds, écrasement, retard des
 * parties (le visage et les bras « traînent » un peu derrière le corps), regard,
 * clignements, syllabes.
 */
import { clamp } from './core.js'
import { BASE_R } from './draw-minuton.js'

/** Visage de chaque expression du moteur : yeux, bouche, joues. */
export const FACE_LAYERS = {
  neutral: ['neutre', 'sourire'],
  joy: ['joie', 'joie'],
  laugh: ['rire', 'rire'],
  happyClosed: ['rire', 'grand_sourire'],
  surprise: ['surprise', 'grand_o'],
  curious: ['curiosite', 'sourire'],
  idea: ['idee', 'joie'],
  focus: ['concentration', 'plate'],
  disappointed: ['deception', 'triste'],
  worried: ['inquietude', 'ondulee'],
  relief: ['soulagement', 'sourire'],
  sleep: ['sommeil', 'dort'],
  mischief: ['malice', 'coin'],
  sad: ['tristesse', 'tres_triste'],
  grumpy: ['boudeur', 'moue'],
  determined: ['determine', 'grand_sourire'],
  wonder: ['emerveille', 'joie'],
  fear: ['peur', 'ondulee'],
  embarrassed: ['gene', 'ondulee', 'rouges'],
  dizzy: ['etourdi', 'ondulee'],
  wink: ['clin_gauche', 'grand_sourire'],
  winkRight: ['clin_droit', 'grand_sourire'],
  yawn: ['mi_clos', 'baille'],
  tongue: ['rire', 'langue'],
  oops: ['inquietude', 'dents'],
  shock: ['peur', 'grand_o'],
  smug: ['malice', 'grand_sourire'],
}

/** Yeux qui peuvent cligner et regarder ailleurs (les autres gardent leur dessin). */
const BLINKABLE = new Set(['neutre', 'joie', 'curiosite', 'determine', 'idee', 'surprise', 'emerveille', 'concentration', 'deception', 'inquietude', 'boudeur', 'gene', 'peur'])
const GAZE = new Set(['neutre'])

/** Poses de bras du moteur → dessins (côté gauche de l'image, côté droit de l'image). */
const ARM_LAYERS = {
  down: ['repos', 'repos'], up: ['leve', 'leve'], out: ['horizontal', 'horizontal'], cheer: ['leve45', 'leve45'],
  hips: ['hanche', 'hanche'], think: ['repos', 'menton'], shrug: ['ecarte', 'ecarte'], hold: ['tenir', 'tenir'],
  cover: ['bouche', 'bouche'], reachUp: ['repos', 'pointe_haut'], open: ['ecarte', 'ecarte'], heart: ['coeur', 'coeur'],
  thumbs: ['pouce', 'pouce'], victory: ['victoire', 'victoire'], stop: ['stop', 'stop'], pointFront: ['repos', 'pointe_avant'],
}

export async function loadBitmapRig(base) {
  const res = await fetch(`${base}/front/layers.json`)
  if (!res.ok) return null
  const L = await res.json()
  const imgs = {}
  const all = [L.body, L.marks, ...Object.values(L.eyes), ...Object.values(L.mouths), ...Object.values(L.cheeks), ...Object.values(L.arms.G), ...Object.values(L.arms.D), ...Object.values(L.legs)]
  await Promise.all(
    all.map(async (p) => {
      const im = new Image()
      im.src = `${base}/front/${p.file}`
      await im.decode()
      imgs[p.file] = im
    }),
  )
  return { L, imgs }
}

function put(ctx, B, part, dx = 0, dy = 0) {
  if (!part) return
  ctx.drawImage(B.imgs[part.file], part.x + dx, part.y + dy)
}

/** Pièce tournée autour de son articulation (bras). */
function putRot(ctx, B, part, joint, ang) {
  if (!part) return
  if (!ang) return put(ctx, B, part)
  ctx.save()
  ctx.translate(joint[0], joint[1])
  ctx.rotate(ang)
  ctx.translate(-joint[0], -joint[1])
  put(ctx, B, part)
  ctx.restore()
}

export function chooseEyes(f) {
  const base = f.eyes ?? (FACE_LAYERS[f.name] ?? FACE_LAYERS.neutral)[0]
  let code = base
  if (GAZE.has(base) && (Math.abs(f.lookX) > 0.35 || Math.abs(f.lookY) > 0.35)) {
    const h = f.lookX > 0.35 ? 'droite' : f.lookX < -0.35 ? 'gauche' : ''
    const v = f.lookY > 0.35 ? 'bas' : f.lookY < -0.35 ? 'haut' : ''
    code = 'regard_' + [v, h].filter(Boolean).join('_')
  }
  const blink = f.blink ?? 0
  if (BLINKABLE.has(base) || code.startsWith('regard_')) {
    if (blink > 0.66) code = 'ferme'
    else if (blink > 0.2) code = 'mi_clos'
  }
  return code
}

export function chooseMouth(f) {
  if (f.babbling) {
    // syllabes : le babil choisit une forme selon l'ouverture et l'arrondi
    if (f.round > 0.3) return f.mouthOpen > 0.3 ? 'vise_O' : 'vise_U'
    if (f.mouthOpen < 0.12) return 'vise_M'
    if (f.mouthOpen < 0.3) return 'vise_E'
    if (f.mouthOpen < 0.45) return 'vise_I'
    return 'vise_A'
  }
  return f.mouth ?? (FACE_LAYERS[f.name] ?? FACE_LAYERS.neutral)[1]
}

function chooseArms(a) {
  const b = a.body
  const s = a.arms
  const t = a.t
  const tick = (period) => Math.floor(t / period) % 2
  let L = 'repos'
  let R = 'repos'
  if ((s.w ?? 0) >= 0.5) {
    if (s.gesture === 'wave') {
      const w = tick(0.17) ? 'coucou' : 'coucou2'
      s.side === 'L' ? (L = w) : (R = w)
    } else if (s.gesture === 'cheer') {
      L = R = tick(0.2) ? 'leve' : 'leve45'
    } else if (s.gesture === 'flap') {
      L = R = tick(0.09) ? 'horizontal' : 'leve45'
    } else if (s.gesture === 'point') {
      const p = (s.angle ?? 1.7) > 2.3 ? 'pointe_haut' : 'pointe_cote'
      s.side === 'L' ? (L = p) : (R = p)
    } else {
      const m = ARM_LAYERS[s.pose] ?? ARM_LAYERS.down
      L = s.L ?? m[0]
      R = s.R ?? m[1]
    }
  } else if (b.lift > 3 && (b.armsUp ?? 0) > 0.5) {
    L = R = 'leve45'
  } else if (b.amp > 0.25) {
    const swing = Math.sin(b.phase * Math.PI * 2)
    const run = b.style === 1
    const fwd = run ? 'course_avant' : 'marche_avant'
    const back = run ? 'course_arriere' : 'marche_arriere'
    L = swing > 0.4 ? fwd : swing < -0.4 ? back : 'repos'
    R = swing < -0.4 ? fwd : swing > 0.4 ? back : 'repos'
  }
  return { L, R }
}

function chooseLegs(a, L) {
  const b = a.body
  if (b.lift > 3) return (b.tuck ?? 0) > 0.45 ? 'saut_replie' : 'saut_ecarte'
  if (b.sit > 0.5) return 'assis'
  if (b.sy < 0.9) return 'reception'
  if (b.amp > 0.25) {
    if (b.style === 2 || b.style === 3) return 'pointe'
    return `vers_cam_${(Math.floor(((b.phase % 1) + 1) % 1 * 6) % 6) + 1}`
  }
  return 'debout'
}

export function drawMinutonBitmap(ctx, a, B, opts = {}) {
  const { L } = B
  const b = a.body
  const f = a.face
  const t = a.t
  const k = (BASE_R * b.scale) / L.R // pixels du monde par pixel du canevas
  const tau = clamp(b.turn, -1, 1)
  const breath = b.amp < 0.1 && b.lift < 1 ? Math.sin(t * 2.4 + (b.x % 7)) * 0.012 * (1 - b.lie) : 0
  const jitter = b.shake ? (Math.sin(t * 90) * 0.02 + Math.sin(t * 67) * 0.015) * BASE_R * b.scale * b.shake : 0
  const bob = b.amp > 0.25 && b.lift < 3 ? -Math.abs(Math.sin(b.phase * Math.PI * 2)) * 0.05 * BASE_R * b.scale * b.amp : 0
  // retard des parties : le visage et les bras traînent derrière le mouvement du corps
  const vx = a.vel?.x ?? 0
  const vy = a.vel?.y ?? 0
  const lagX = clamp(-vx * 0.012, -9, 9)
  const lagY = clamp(-vy * 0.01, -9, 9)

  ctx.save()
  ctx.globalAlpha *= b.alpha ?? 1
  ctx.translate(b.x + jitter, b.y - b.lift + bob)
  if (b.lie) {
    ctx.translate(0, -b.lie * 0.15 * BASE_R * b.scale)
    ctx.rotate(-b.lie * Math.PI * 0.5)
  }
  ctx.rotate((b.rot ?? 0) + (b.lean ?? 0))
  ctx.scale(b.sx, b.sy * (1 + breath))
  ctx.scale(k, k)
  // pivot au sol, au milieu des pieds
  ctx.translate(-L.center[0], -L.ground)
  // trois-quarts léger : le corps se resserre un peu et le visage glisse vers le regard
  const squeeze = 1 - 0.08 * Math.abs(tau)
  const faceShift = tau * 0.14 * L.R
  ctx.translate(L.center[0], 0)
  ctx.scale(squeeze, 1)
  ctx.translate(-L.center[0], 0)

  const legs = chooseLegs(a, L)
  const arms = chooseArms(a)
  const ja = L.joints
  // balancement des bras : petit retard + respiration
  const sway = Math.sin(t * 2.1 + b.x * 0.01) * 0.02
  const armLag = clamp(vy * 0.00035 + vx * 0.0002, -0.25, 0.25)

  put(ctx, B, L.legs[legs] ?? L.legs.debout)
  put(ctx, B, L.body)
  put(ctx, B, L.marks, faceShift * 0.6, 0)
  const cheeks = f.cheeks ?? (FACE_LAYERS[f.name] ?? [])[2] ?? 'normales'
  ctx.save()
  ctx.globalAlpha *= clamp(0.35 + (f.cheek ?? 0.65))
  put(ctx, B, L.cheeks[cheeks], faceShift + lagX * 0.6, lagY * 0.6)
  ctx.restore()
  put(ctx, B, L.mouths[chooseMouth(f)] ?? L.mouths.sourire, faceShift + lagX, lagY)
  put(ctx, B, L.eyes[chooseEyes(f)] ?? L.eyes.neutre, faceShift + lagX * 1.2, lagY * 1.2)
  putRot(ctx, B, L.arms.G[arms.L] ?? L.arms.G.repos, ja.G, sway - armLag)
  putRot(ctx, B, L.arms.D[arms.R] ?? L.arms.D.repos, ja.D, -sway + armLag)
  if (opts.debug) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(L.center[0], L.center[1], L.R, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}
