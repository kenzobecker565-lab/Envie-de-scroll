/**
 * Dessin de la marionnette de Minuton sur un canvas 2D.
 * Le corps (disque, couronne, bouton) vient de l'image d'origine, visage effacé.
 * Bras, jambes, pieds et visage sont dessinés en vectoriel, dans la même palette.
 * Unité : R = rayon du disque en pixels (180 × échelle).
 */
import { clamp, lerp } from './core.js'
import { ARM_POSES } from './actions.js'

export const BASE_R = 180

/** Charge la marionnette (rig.json + corps de face + corps tournés). */
export async function loadMinutonRig(base) {
  const rig = await (await fetch(`${base}/rig.json`)).json()
  rig.views ??= { front: { ...rig.body, face: { cx: 0, cy: 0, hw: 0.88, hh: 0.88 }, bodyX: [-0.98, 0.98] } }
  for (const v of Object.values(rig.views)) {
    v.img = new Image()
    v.img.src = `${base}/${v.file}`
    await v.img.decode()
  }
  return rig
}

/**
 * Vue du corps selon l'orientation : face, trois-quarts, profil, dos.
 * turn : -1 (profil gauche) … 0 (face) … 1 (profil droit) ; spin < 0 : de dos.
 * Renvoie les vues à superposer (fondu pendant qu'il tourne) et la géométrie
 * interpolée : ellipse du cadran (où projeter le visage) et largeur du boîtier.
 */
function viewGeometry(rig, tau, spin) {
  const V = rig.views
  const a = Math.abs(tau)
  const side = tau >= 0 ? 'r' : 'l'
  const pick = (k) => V[k] ?? V.front
  const band = (x, edge) => clamp((x - edge + 0.025) / 0.05) // fondu très court : un vrai changement de pose
  let list
  if (spin < 0 && V.back) list = [{ v: V.back, w: 1 }]
  else {
    const q = band(a, 0.3) // face → trois-quarts
    const pr = band(a, 0.78) // trois-quarts → profil
    const q3 = pick(side === 'r' ? 'q3r' : 'q3l')
    const prof = pick(side === 'r' ? 'profR' : 'profL')
    list = [
      { v: V.front, w: 1 - q },
      { v: q3, w: q * (1 - pr) },
      { v: prof, w: q * pr },
    ].filter((x) => x.w > 0.001)
  }
  const face = list.every((x) => x.v.face)
    ? ['cx', 'cy', 'hw', 'hh'].reduce((o, k) => ((o[k] = list.reduce((s, x) => s + x.v.face[k] * x.w, 0)), o), {})
    : null
  const halfW = list.reduce((s, x) => s + ((x.v.bodyX[1] - x.v.bodyX[0]) / 2) * x.w, 0)
  const midX = list.reduce((s, x) => s + ((x.v.bodyX[1] + x.v.bodyX[0]) / 2) * x.w, 0)
  // squeeze : rétrécit le corps de face quand il n'y a pas de vue tournée (spin, vieux rig)
  const squeeze = Math.max(0.08, Math.abs(spin))
  return { list, face, halfW: halfW * squeeze, midX, squeeze, back: spin < 0 }
}

const PLUM = '#2a0b26'
const WHITE = '#fffdf8'

export function drawMinuton(ctx, a, rig, opts = {}) {
  const b = a.body
  const R = BASE_R * b.scale
  const C = rig.colors
  const H = rig.centerHeight
  const ow = rig.outlineWidth * R * 0.95
  const tau = clamp(b.turn, -1, 1)
  const spin = b.spin ?? 1
  const G = viewGeometry(rig, tau, spin)
  const t = a.t

  // respiration au repos
  const breath = b.amp < 0.1 && b.lift < 1 ? Math.sin(t * 2.4 + (b.x % 7)) * 0.012 * (1 - b.lie) : 0
  const jitter = b.shake ? (Math.sin(t * 90) * 0.02 + Math.sin(t * 67) * 0.015) * R * b.shake : 0

  ctx.save()
  ctx.globalAlpha *= b.alpha ?? 1
  ctx.translate(b.x + jitter, b.y - b.lift)
  // couché : on pivote autour du sol et on remonte pour que le disque repose dessus
  if (b.lie) {
    ctx.translate(0, -b.lie * 0.15 * R)
    ctx.rotate(-b.lie * Math.PI * 0.5 * Math.sign(b.lie || 1))
    ctx.translate(-b.lie * (H - 1) * R * 0.5, 0)
  }
  ctx.rotate((b.rot ?? 0) + (b.lean ?? 0))
  ctx.scale(b.sx, b.sy * (1 + breath))
  // assis : le corps descend, les jambes se raccourcissent
  const sitDrop = b.sit * 0.3 * R
  ctx.translate(0, sitDrop)

  const cy = -H * R
  const arms = armAngles(a)
  const legs = legGeometry(a, R, G, tau)

  // Ordre : bras derrière, jambes, corps, visage, bras devant
  for (const side of ['L', 'R']) if (!arms[side].front || G.back) drawArm(ctx, arms[side], side, R, cy, G, tau, C, ow)
  drawLegs(ctx, legs, R, C, ow, b.sit)
  drawBody(ctx, R, cy, G)
  if (G.face && !G.back) drawFace(ctx, a.face, R, cy, G, tau, C)
  for (const side of ['L', 'R']) if (arms[side].front && !G.back) drawArm(ctx, arms[side], side, R, cy, G, tau, C, ow)
  if (opts.debug) {
    ctx.strokeStyle = 'red'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, cy, R, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

// ---------------------------------------------------------------- corps

function drawBody(ctx, R, cy, G) {
  ctx.save()
  ctx.translate(0, cy)
  ctx.scale(G.squeeze, 1)
  // la vue dominante d'abord, opaque, puis l'autre en fondu par-dessus
  const order = [...G.list].sort((x, y) => y.w - x.w)
  order.forEach(({ v, w }, i) => {
    const k = v.scale * R
    ctx.globalAlpha = i === 0 ? 1 : w / (w + order[0].w)
    ctx.drawImage(v.img, v.pos[0] * R, v.pos[1] * R, v.img.width * k, v.img.height * k)
  })
  ctx.restore()
}

// ---------------------------------------------------------------- bras

function armAngles(a) {
  const b = a.body
  const s = a.arms
  const swing = Math.sin(b.phase * Math.PI * 2) * 0.55 * b.amp
  const up = b.armsUp ?? 0
  const auto = {
    aL: ARM_POSES.down.aL + swing + up * 2.0 + b.sit * 0.2,
    bL: ARM_POSES.down.bL + Math.max(0, swing) * 0.6 + up * 0.2,
    aR: ARM_POSES.down.aR - swing + up * 2.0 + b.sit * 0.2,
    bR: ARM_POSES.down.bR + Math.max(0, -swing) * 0.6 + up * 0.2,
  }
  const w = clamp(s.w ?? 0)
  const out = {}
  for (const side of ['L', 'R']) {
    const A = lerp(auto[`a${side}`], s[`a${side}`], w)
    const B = lerp(auto[`b${side}`], s[`b${side}`], w)
    out[side] = { a: A, b: B, front: B > 1.9 }
  }
  return out
}

function armPoints(arm, side, R, cy, G, tau) {
  const sgn = side === 'L' ? -1 : 1
  const sx = (G.midX + sgn * G.halfW * 0.88) * R
  const sy = cy + 0.32 * R
  const L1 = 0.26 * R
  const L2 = 0.21 * R
  const ex = sx + sgn * Math.sin(arm.a) * L1
  const ey = sy + Math.cos(arm.a) * L1
  const a2 = arm.a - arm.b
  const hx = ex + sgn * Math.sin(a2) * L2
  const hy = ey + Math.cos(a2) * L2
  return { sx, sy, ex, ey, hx, hy, a2, sgn }
}

function drawArm(ctx, arm, side, R, cy, G, tau, C, ow) {
  const p = armPoints(arm, side, R, cy, G, tau)
  const th = 0.2 * R
  const hand = 0.15 * R
  const dirx = p.sgn * Math.sin(p.a2)
  const diry = Math.cos(p.a2)
  // trois doigts arrondis au bout de la main, plus un pouce
  const lobes = [-0.75, 0, 0.75].map((da) => {
    const ang = Math.atan2(diry, dirx) + da * 0.9
    return [p.hx + Math.cos(ang) * hand * 0.75, p.hy + Math.sin(ang) * hand * 0.75, hand * 0.55]
  })
  const thumbAng = Math.atan2(diry, dirx) - p.sgn * 1.7
  const thumb = [p.hx + Math.cos(thumbAng) * hand * 0.85, p.hy + Math.sin(thumbAng) * hand * 0.85, hand * 0.45]
  const shape = (extra) => {
    ctx.beginPath()
    ctx.moveTo(p.sx, p.sy)
    ctx.lineTo(p.ex, p.ey)
    ctx.lineTo(p.hx, p.hy)
    ctx.lineWidth = th + extra
    ctx.stroke()
    for (const [x, y, r] of [[p.hx, p.hy, hand], ...lobes, thumb]) {
      ctx.beginPath()
      ctx.arc(x, y, r + extra / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = ctx.fillStyle = PLUM
  shape(ow * 2)
  ctx.strokeStyle = ctx.fillStyle = C.limbShade
  shape(0)
  ctx.save()
  ctx.translate(-0.025 * R, -0.03 * R)
  ctx.strokeStyle = ctx.fillStyle = C.limb
  shape(-0.05 * R)
  ctx.restore()
  // reflet
  ctx.globalAlpha *= 0.55
  ctx.strokeStyle = '#fff6b0'
  ctx.lineWidth = th * 0.18
  ctx.beginPath()
  ctx.moveTo(lerp(p.sx, p.ex, 0.3) - 0.05 * R, lerp(p.sy, p.ey, 0.3))
  ctx.lineTo(lerp(p.sx, p.ex, 0.85) - 0.05 * R, lerp(p.sy, p.ey, 0.85))
  ctx.stroke()
  ctx.restore()
}

// ---------------------------------------------------------------- jambes

function legGeometry(a, R, G, tau) {
  const b = a.body
  const H = 1.2976
  const legs = []
  for (const [i, side] of [[0, 'L'], [1, 'R']]) {
    const sgn = side === 'L' ? -1 : 1
    const hx = (G.midX + (sgn * 0.27 * G.halfW) / 0.98) * R + tau * 0.04 * R
    const hy = (-H + 0.86) * R
    const ph = b.phase * Math.PI * 2 + i * Math.PI
    const dir = Math.abs(tau) > 0.15 ? Math.sign(tau) : 1
    const swing = Math.sin(ph) * 0.5 * b.amp * dir
    const lift = Math.max(0, Math.cos(ph)) * 0.16 * R * b.amp
    const L = 0.33 * R * (1 - 0.4 * (b.tuck ?? 0)) * (1 - b.sit * 0.55)
    let ax = hx + Math.sin(swing) * L
    let ay = hy + Math.cos(swing) * L - lift
    if (b.sit) {
      ax = lerp(ax, hx + sgn * 0.12 * R, b.sit)
    }
    const footDir = Math.abs(tau) > 0.2 ? Math.sign(tau) : sgn * 0.35
    legs.push({ hx, hy, ax, ay, footDir, side })
  }
  return legs
}

function drawLegs(ctx, legs, R, C, ow, sit) {
  const th = 0.19 * R
  const shape = (extra) => {
    for (const l of legs) {
      ctx.beginPath()
      ctx.moveTo(l.hx, l.hy)
      ctx.lineTo(l.ax, l.ay)
      ctx.lineWidth = th + extra
      ctx.stroke()
      const fx = l.ax + l.footDir * 0.07 * R
      const fy = l.ay + 0.0 * R
      const rx = 0.21 * R * (1 - Math.abs(l.footDir) * 0.05) * (1 - sit * 0.25)
      const ry = 0.115 * R * (1 + sit * 0.35)
      ctx.beginPath()
      ctx.ellipse(fx, fy, rx + extra / 2, ry + extra / 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = ctx.fillStyle = PLUM
  shape(ow * 2)
  ctx.strokeStyle = ctx.fillStyle = C.limbShade
  shape(0)
  ctx.save()
  ctx.translate(-0.02 * R, -0.025 * R)
  ctx.strokeStyle = ctx.fillStyle = C.limb
  shape(-0.045 * R)
  ctx.restore()
  // reflet sur le dessus des pieds
  ctx.fillStyle = 'rgba(255,248,190,0.65)'
  for (const l of legs) {
    ctx.beginPath()
    ctx.ellipse(l.ax + l.footDir * 0.07 * R + 0.03 * R, l.ay - 0.05 * R, 0.08 * R, 0.025 * R, -0.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ---------------------------------------------------------------- visage

function drawFace(ctx, f, R, cy, G, tau, C) {
  const F = G.face
  ctx.save()
  ctx.translate(0, cy)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  // Projection sur l'ellipse du cadran de la vue : x, y en unités « de face » (cadran de rayon 0,88)
  const sx = (F.hw / 0.88) * G.squeeze
  const sy = F.hh / 0.88
  const profile = sx < 0.42
  const dir = tau >= 0 ? 1 : -1
  const fx = (x) => (F.cx * G.squeeze + x * sx) * R
  const fy = (y) => (F.cy + y * sy) * R
  // côté visible : en profil, seuls les traits du côté du regard ; de 3/4, l'œil lointain rapetisse
  const shown = (s) => !profile || s === dir
  const far = (s) => (Math.abs(tau) > 0.2 && s !== dir ? 0.82 : 1)
  // en profil, on « déplie » un peu le visage pour garder un œil lisible
  const px = (s, x) => (profile ? (F.cx + dir * 0.03 + s * x * 0.12) * R : fx(s * x))
  const ew = profile ? 0.5 : sx

  // graduations du cadran
  ctx.strokeStyle = PLUM
  ctx.lineWidth = 0.032 * R
  ctx.beginPath()
  ctx.moveTo(fx(0), fy(-0.8))
  ctx.lineTo(fx(0), fy(-0.71))
  if (!profile)
    for (const s of [-1, 1]) {
      if (s * tau < -0.4) continue
      ctx.moveTo(fx(s * 0.86), fy(0.02))
      ctx.lineTo(fx(s * 0.79), fy(0.02))
    }
  ctx.stroke()

  // joues
  for (const s of [-1, 1]) {
    if (!shown(s)) continue
    const x = profile ? (F.cx + dir * 0.02) * R : fx(s * 0.6)
    const y = fy(0.2)
    const k = far(s)
    const g = ctx.createRadialGradient(x, y, 0, x, y, 0.17 * R * k)
    g.addColorStop(0, `rgba(255,130,115,${0.8 * f.cheek})`)
    g.addColorStop(0.6, `rgba(255,140,120,${0.55 * f.cheek})`)
    g.addColorStop(1, 'rgba(255,150,120,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(x, y, 0.18 * R * k * Math.max(ew, 0.5), 0.12 * R, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // yeux
  for (const s of [-1, 1]) if (shown(s)) drawEye(ctx, f, s, px(s, 0.4), fy(-0.05), R * far(s), ew, C)

  // sourcils
  ctx.strokeStyle = PLUM
  ctx.lineWidth = 0.044 * R
  for (const s of [-1, 1]) {
    if (!shown(s)) continue
    const k = far(s)
    const x = px(s, 0.4)
    const raise = (f.browY + (s < 0 ? f.browL : f.browR)) * R
    const y = fy(-0.4) - raise - (f.wide - 1) * 0.6 * R
    const tilt = f.browTilt * 0.07 * R
    const w = 0.12 * R * k * ew
    const outer = x + s * w
    const inner = x - s * w
    ctx.beginPath()
    ctx.moveTo(outer, y + 0.025 * R + tilt * 0.3)
    ctx.quadraticCurveTo(x, y - 0.04 * R, inner, y + 0.02 * R - tilt)
    ctx.stroke()
  }

  const mx = profile ? (F.cx + dir * 0.09) * R : fx(0) + f.lookX * 0.03 * R
  drawMouth(ctx, f, mx, fy(0.25), R, profile ? 0.55 : sx)
  ctx.restore()
}

function drawEye(ctx, f, s, x, y, R, wf, C) {
  const rx = 0.18 * R * f.wide * wf
  const ry = 0.23 * R * f.wide
  const happy = clamp(f.happy)
  const open = clamp(f.open)
  ctx.save()
  if (happy < 0.98 && open > 0.08) {
    ctx.globalAlpha *= 1 - happy
    // blanc de l'œil
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fillStyle = WHITE
    ctx.fill()
    ctx.save()
    ctx.clip()
    // iris et pupille, qui suivent le regard
    const ix = x + f.lookX * 0.075 * R * wf
    const iy = y + 0.03 * R + f.lookY * 0.07 * R
    const ir = 0.16 * R * (0.85 + 0.15 * f.wide)
    const g = ctx.createRadialGradient(ix - ir * 0.2, iy - ir * 0.3, ir * 0.1, ix, iy, ir)
    g.addColorStop(0, '#8a4cc4')
    g.addColorStop(0.5, '#4f167a')
    g.addColorStop(1, '#250536')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(ix, iy, ir, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1c0328'
    ctx.beginPath()
    ctx.arc(ix, iy + ir * 0.05, ir * 0.48 * f.pupil, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(ix + ir * 0.32, iy - ir * 0.38, ir * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(ix - ir * 0.35, iy + ir * 0.35, ir * 0.13, 0, Math.PI * 2)
    ctx.fill()
    // paupière supérieure (clignement, yeux mi-clos) et inférieure (yeux plissés)
    ctx.fillStyle = C.face
    const lidY = y - ry + (1 - open) * ry * 2
    ctx.fillRect(x - rx - 2, y - ry - 2, rx * 2 + 4, lidY - (y - ry) + 2)
    const low = y + ry - clamp(f.squint) * ry * 1.1
    ctx.fillRect(x - rx - 2, low, rx * 2 + 4, ry * 2)
    ctx.restore()
    // contour, cils du haut plus épais
    ctx.strokeStyle = PLUM
    ctx.lineWidth = 0.034 * R
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 0.06 * R
    ctx.beginPath()
    if (open > 0.97) ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.12, Math.PI * 1.88)
    else {
      const half = Math.sqrt(Math.max(0, 1 - ((lidY - y) / ry) ** 2)) * rx
      ctx.moveTo(x - half, lidY)
      ctx.lineTo(x + half, lidY)
    }
    ctx.stroke()
    if (f.squint > 0.05) {
      const half = Math.sqrt(Math.max(0, 1 - ((low - y) / ry) ** 2)) * rx
      ctx.lineWidth = 0.034 * R
      ctx.beginPath()
      ctx.moveTo(x - half, low)
      ctx.quadraticCurveTo(x, low - 0.02 * R, x + half, low)
      ctx.stroke()
    }
  }
  ctx.restore()
  ctx.save()
  ctx.strokeStyle = PLUM
  ctx.lineCap = 'round'
  if (happy > 0.02) {
    // yeux rieurs « ^ »
    ctx.globalAlpha *= happy
    ctx.lineWidth = 0.055 * R
    ctx.beginPath()
    ctx.arc(x, y + 0.08 * R, 0.14 * R * wf, Math.PI * 1.18, Math.PI * 1.82)
    ctx.stroke()
  } else if (open <= 0.08) {
    // yeux fermés (sommeil, clignement complet) : arc vers le bas
    ctx.lineWidth = 0.05 * R
    ctx.beginPath()
    ctx.arc(x, y - 0.02 * R, 0.14 * R * wf, Math.PI * 0.18, Math.PI * 0.82)
    ctx.stroke()
  }
  ctx.restore()
}

function drawMouth(ctx, f, x, y, R, wf) {
  const round = clamp(f.round)
  const o = clamp(f.mouthOpen)
  const hw = f.mouthW * 0.42 * R * wf * (1 - 0.45 * round)
  const smile = f.smile
  const cy = y - smile * 0.06 * R
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = PLUM
  ctx.lineWidth = 0.042 * R
  if (o < 0.04) {
    ctx.beginPath()
    ctx.moveTo(x - hw, cy)
    ctx.quadraticCurveTo(x, y + smile * 0.09 * R, x + hw, cy)
    ctx.stroke()
    ctx.restore()
    return
  }
  const path = () => {
    ctx.beginPath()
    if (round > 0.5) {
      ctx.ellipse(x, y + 0.03 * R, hw * 0.8, (0.05 + o * 0.13) * R, 0, 0, Math.PI * 2)
    } else {
      // bouche en « D » : bord du haut presque droit, bord du bas bien arrondi
      ctx.moveTo(x - hw, cy)
      ctx.quadraticCurveTo(x, cy + 0.03 * R, x + hw, cy)
      ctx.quadraticCurveTo(x, cy + (0.1 + o * 0.42 + Math.max(0, smile) * 0.06) * R, x - hw, cy)
      ctx.closePath()
    }
  }
  path()
  ctx.fillStyle = '#4a0f35'
  ctx.fill()
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#f2708f'
  ctx.beginPath()
  const depth = round > 0.5 ? 0.06 + o * 0.12 : 0.09 + o * 0.32
  ctx.ellipse(x, y + depth * R, hw * 0.7, (0.04 + o * 0.1) * R, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  path()
  ctx.stroke()
  ctx.restore()
}
