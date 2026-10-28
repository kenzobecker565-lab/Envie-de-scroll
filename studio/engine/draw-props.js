/**
 * Personnages et objets dessinés en vectoriel : nuage (avec visage), flaque,
 * arc-en-ciel, image de la bibliothèque, soleil, lune.
 * Chaque fonction reçoit l'état `p` de l'acteur (propriétés numériques animables).
 */
import { clamp, lerp, rng, wobble } from './core.js'

const PLUM = '#2a0b26'

// ---------------------------------------------------------------- nuage

/**
 * Nuage : { x, y, scale, face (0/1), mood (-1 triste … 1 joyeux), mouthOpen, eyesClosed,
 *           dark (0 blanc … 1 gris d'orage), rain (0 … 1), ground (y du sol pour la pluie), lookX }
 */
export function drawCloud(ctx, p, t) {
  const s = 1.0 * (p.scale ?? 1)
  const W = 260 * s
  const bob = Math.sin(t * 1.6 + (p.seed ?? 0)) * 6 * s
  const x = p.x
  const y = p.y + bob
  const dark = clamp(p.dark ?? 0)
  // pluie sous le nuage
  if ((p.rain ?? 0) > 0.01) drawCloudRain(ctx, x, y + 40 * s, W * 0.75, (p.ground ?? 1330) - (y + 40 * s), p.rain, t, s)
  const puffs = [
    [-0.62, 0.12, 0.34], [-0.3, -0.12, 0.42], [0.08, -0.25, 0.5], [0.45, -0.06, 0.4], [0.7, 0.14, 0.3], [0, 0.18, 0.42], [-0.35, 0.2, 0.34], [0.38, 0.22, 0.34],
  ]
  const sq = 1 + Math.sin(t * 3.1 + (p.seed ?? 0)) * 0.015
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(sq, 1 / sq)
  ctx.globalAlpha *= p.alpha ?? 1
  const path = (grow) => {
    ctx.beginPath()
    for (const [px, py, r] of puffs) {
      ctx.moveTo(px * W + r * W + grow, py * W)
      ctx.arc(px * W, py * W, r * W + grow, 0, Math.PI * 2)
    }
  }
  ctx.fillStyle = PLUM
  path(7 * s)
  ctx.fill()
  const top = `rgb(${lerp(255, 150, dark)},${lerp(255, 155, dark)},${lerp(255, 175, dark)})`
  const bot = `rgb(${lerp(214, 110, dark)},${lerp(228, 116, dark)},${lerp(246, 140, dark)})`
  const g = ctx.createLinearGradient(0, -0.7 * W, 0, 0.55 * W)
  g.addColorStop(0, top)
  g.addColorStop(1, bot)
  ctx.fillStyle = g
  path(0)
  ctx.fill()
  // reflets
  ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - dark)})`
  ctx.beginPath()
  ctx.ellipse(-0.25 * W, -0.32 * W, 0.16 * W, 0.07 * W, -0.3, 0, Math.PI * 2)
  ctx.ellipse(0.12 * W, -0.52 * W, 0.12 * W, 0.05 * W, -0.1, 0, Math.PI * 2)
  ctx.fill()
  if (p.face) drawCloudFace(ctx, p, W, t)
  ctx.restore()
}

function drawCloudFace(ctx, p, W, t) {
  const mood = p.mood ?? 0.5
  const lx = (p.lookX ?? 0) * 0.04 * W
  const ly = (p.lookY ?? 0) * 0.03 * W
  ctx.save()
  ctx.translate(lx, 0.05 * W + ly)
  ctx.fillStyle = PLUM
  ctx.strokeStyle = PLUM
  ctx.lineCap = 'round'
  ctx.lineWidth = 0.035 * W
  for (const s of [-1, 1]) {
    const ex = s * 0.2 * W
    const ey = -0.05 * W
    if (p.eyesClosed > 0.5 || mood > 0.85) {
      ctx.beginPath()
      if (mood > 0.85) ctx.arc(ex, ey + 0.03 * W, 0.06 * W, Math.PI * 1.15, Math.PI * 1.85)
      else ctx.arc(ex, ey - 0.02 * W, 0.06 * W, Math.PI * 0.15, Math.PI * 0.85)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.ellipse(ex, ey, 0.05 * W, 0.068 * W, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.arc(ex + 0.018 * W, ey - 0.025 * W, 0.018 * W, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = PLUM
    }
    // sourcils tristes quand l'humeur baisse
    if (mood < -0.2) {
      ctx.lineWidth = 0.025 * W
      ctx.beginPath()
      ctx.moveTo(ex + s * 0.07 * W, ey - 0.1 * W)
      ctx.lineTo(ex - s * 0.04 * W, ey - 0.13 * W + mood * 0.03 * W)
      ctx.stroke()
      ctx.lineWidth = 0.035 * W
    }
  }
  // joues
  ctx.fillStyle = 'rgba(255,150,170,0.55)'
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(s * 0.33 * W, 0.06 * W, 0.06 * W, 0.035 * W, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // bouche
  const o = clamp(p.mouthOpen ?? 0)
  ctx.strokeStyle = PLUM
  ctx.beginPath()
  if (o > 0.05) {
    ctx.fillStyle = '#4a0f35'
    ctx.ellipse(0, 0.07 * W, 0.05 * W, 0.02 * W + o * 0.05 * W, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  } else {
    ctx.moveTo(-0.07 * W, 0.06 * W - mood * 0.02 * W)
    ctx.quadraticCurveTo(0, 0.06 * W + mood * 0.05 * W, 0.07 * W, 0.06 * W - mood * 0.02 * W)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCloudRain(ctx, x, y0, w, h, k, t, s) {
  const r = rng(7)
  const n = Math.round(26 * k)
  ctx.save()
  ctx.strokeStyle = 'rgba(120,175,240,0.85)'
  ctx.lineCap = 'round'
  ctx.lineWidth = 5 * s
  for (let i = 0; i < n; i++) {
    const dx = (r() - 0.5) * w
    const speed = 900 + r() * 300
    const ph = r()
    const yy = ((t * speed + ph * h) % h)
    const len = 34 * s
    ctx.globalAlpha = 0.9 * Math.min(1, (h - yy) / 60)
    ctx.beginPath()
    ctx.moveTo(x + dx, y0 + yy)
    ctx.lineTo(x + dx - 4, y0 + yy + len)
    ctx.stroke()
  }
  ctx.restore()
}

// ---------------------------------------------------------------- flaque

/** Flaque : { x, y, size (0 … 1), w (largeur max), ripple (0 … 1) } */
export function drawPuddle(ctx, p, t) {
  const k = clamp(p.size ?? 1)
  if (k <= 0.01) return
  const w = (p.w ?? 300) * k
  const h = w * 0.22
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.globalAlpha *= p.alpha ?? 1
  ctx.beginPath()
  // bord un peu irrégulier
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2
    const r = 1 + Math.sin(a * 3 + 1) * 0.05 + Math.sin(a * 5) * 0.03
    const px = Math.cos(a) * w * 0.5 * r
    const py = Math.sin(a) * h * 0.5 * r
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  }
  ctx.closePath()
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2)
  g.addColorStop(0, '#9fd0ff')
  g.addColorStop(1, '#5f9fe6')
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = PLUM
  ctx.stroke()
  ctx.clip()
  // reflet du ciel
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.beginPath()
  ctx.ellipse(-w * 0.18, -h * 0.12, w * 0.16, h * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()
  // ronds dans l'eau
  const rip = clamp(p.ripple ?? 0)
  if (rip > 0) {
    const r = rng(3)
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      const cx = (r() - 0.5) * w * 0.8
      const cy = (r() - 0.5) * h * 0.6
      const ph = (t * 1.3 + r()) % 1
      ctx.globalAlpha = rip * (1 - ph)
      ctx.beginPath()
      ctx.ellipse(cx, cy, 6 + ph * 40, (6 + ph * 40) * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()
}

// ---------------------------------------------------------------- arc-en-ciel

/** Arc-en-ciel : { x, y (centre de l'arc), r (rayon), reveal (0 … 1), width } */
export function drawRainbow(ctx, p) {
  const k = clamp(p.reveal ?? 1)
  if (k <= 0) return
  const colors = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc']
  const bw = (p.width ?? 26) * (p.scale ?? 1)
  const r0 = (p.r ?? 300) * (p.scale ?? 1)
  ctx.save()
  ctx.globalAlpha *= (p.alpha ?? 0.9)
  ctx.lineCap = 'round'
  colors.forEach((c, i) => {
    ctx.strokeStyle = c
    ctx.lineWidth = bw
    ctx.beginPath()
    ctx.arc(p.x, p.y, r0 - i * bw, Math.PI, Math.PI + Math.PI * k)
    ctx.stroke()
  })
  ctx.restore()
}

// ---------------------------------------------------------------- image

const imgCache = new Map()
export function loadImage(src) {
  if (!imgCache.has(src)) {
    const img = new Image()
    img.src = src
    imgCache.set(src, img.decode().then(() => img))
  }
  return imgCache.get(src)
}

/** Image de la bibliothèque : { x, y (point d'ancrage), scale, rot, alpha, flip } */
export function drawImageActor(ctx, p, img, def) {
  const k = ((def.height ?? img.height) / img.height) * (p.scale ?? 1)
  ctx.save()
  ctx.globalAlpha *= p.alpha ?? 1
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot ?? 0)
  ctx.scale(k * (p.flip ? -1 : 1), k)
  ctx.drawImage(img, -def.anchor[0], -def.anchor[1])
  ctx.restore()
}

// ---------------------------------------------------------------- ciel

export function drawSun(ctx, x, y, k, t) {
  if (k <= 0.01) return
  ctx.save()
  ctx.globalAlpha *= k
  const g = ctx.createRadialGradient(x, y, 20, x, y, 260)
  g.addColorStop(0, 'rgba(255,240,170,0.9)')
  g.addColorStop(0.35, 'rgba(255,220,120,0.35)')
  g.addColorStop(1, 'rgba(255,220,120,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - 260, y - 260, 520, 520)
  ctx.translate(x, y)
  ctx.rotate(t * 0.15)
  ctx.fillStyle = 'rgba(255,230,140,0.55)'
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6)
    ctx.beginPath()
    ctx.moveTo(0, -95)
    ctx.lineTo(14, -140 - 10 * Math.sin(t * 2 + i))
    ctx.lineTo(-14, -140 - 10 * Math.sin(t * 2 + i))
    ctx.fill()
  }
  ctx.fillStyle = '#ffd84a'
  ctx.strokeStyle = PLUM
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(0, 0, 80, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function drawMoon(ctx, x, y, k) {
  if (k <= 0.01) return
  ctx.save()
  ctx.globalAlpha *= k
  const g = ctx.createRadialGradient(x, y, 20, x, y, 200)
  g.addColorStop(0, 'rgba(220,230,255,0.5)')
  g.addColorStop(1, 'rgba(220,230,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - 200, y - 200, 400, 400)
  ctx.beginPath()
  ctx.arc(x, y, 62, 0, Math.PI * 2)
  ctx.arc(x + 30, y - 18, 54, 0, Math.PI * 2, true)
  ctx.fillStyle = '#f4f1ff'
  ctx.fill('evenodd')
  ctx.restore()
}

export function drawStars(ctx, W, H, k, t) {
  if (k <= 0.01) return
  const r = rng(11)
  ctx.save()
  for (let i = 0; i < 70; i++) {
    const x = r() * W
    const y = r() * H * 0.5
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + r() * 2) + r() * 6)
    ctx.globalAlpha = k * (0.35 + 0.65 * tw)
    ctx.fillStyle = '#fffbe0'
    const s = 2 + r() * 3
    ctx.beginPath()
    ctx.arc(x, y, s, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Petits nuages de fond qui dérivent (dans le ciel, derrière tout). */
export function drawSkyClouds(ctx, W, k, t, wind) {
  if (k <= 0.01) return
  const r = rng(21)
  for (let i = 0; i < 2; i++) {
    const y = 470 + r() * 200
    const sp = 8 + r() * 10 + wind * 60
    const x = ((r() * W + t * sp) % (W + 500)) - 250
    drawCloud(ctx, { x, y, scale: 0.45 + r() * 0.3, alpha: 0.85 * k, seed: i }, t)
  }
}

export { wobble }
