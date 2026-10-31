/**
 * Effets : particules ponctuelles (éclaboussure, poussière, étincelles, cœurs,
 * confettis, notes, Zzz…) et météo (pluie, neige). Tout est calculé à partir du
 * temps écoulé : aucune mémoire d'une image à l'autre.
 */
import { clamp, rng } from './core.js'

const PLUM = '#2a0b26'

function star(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 - Math.PI / 2
    const rr = i % 2 ? r * 0.35 : r
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  ctx.closePath()
}

function heart(ctx, s) {
  ctx.beginPath()
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI * 2
    const x = 16 * Math.sin(a) ** 3
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))
    ctx.lineTo((x * s) / 16, (y * s) / 16)
  }
  ctx.closePath()
}

function note(ctx, s) {
  ctx.beginPath()
  ctx.ellipse(0, 0, s * 0.45, s * 0.32, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(s * 0.32, -s * 1.3, s * 0.14, s * 1.3)
  ctx.beginPath()
  ctx.moveTo(s * 0.46, -s * 1.3)
  ctx.quadraticCurveTo(s * 1.1, -s * 1.0, s * 0.8, -s * 0.5)
  ctx.lineWidth = s * 0.14
  ctx.stroke()
}

/** Types d'effets : réglages par défaut. */
const TYPES = {
  splash: { n: 18, life: 0.9, speed: [350, 700], up: 0.9, spread: 1.2, g: 2200, size: [7, 14], color: '#7fb8f5' },
  dust: { n: 10, life: 0.8, speed: [80, 200], up: 0.3, spread: 1.6, g: -60, size: [18, 34], color: '#d8c3a0' },
  sparkle: { n: 10, life: 1.0, speed: [60, 200], up: 0.5, spread: 3.1, g: 0, size: [14, 28], color: '#fff2a8' },
  hearts: { n: 7, life: 2.0, speed: [60, 140], up: 1, spread: 0.7, g: -80, size: [20, 34], color: '#c58be8' },
  confetti: { n: 40, life: 2.2, speed: [400, 900], up: 1, spread: 0.8, g: 900, size: [10, 18], color: null },
  drops: { n: 6, life: 0.8, speed: [100, 250], up: 0.6, spread: 1.0, g: 1500, size: [7, 11], color: '#9fd0ff' },
  notes: { n: 5, life: 2.2, speed: [50, 110], up: 1, spread: 0.6, g: -40, size: [22, 32], color: '#8a3fc7' },
  zzz: { n: 3, life: 2.4, speed: [40, 70], up: 1, spread: 0.3, g: -20, size: [26, 40], color: '#7a5aa8' },
  stars: { n: 5, life: 1.4, speed: [0, 0], up: 0, spread: 0, g: 0, size: [16, 22], color: '#ffd84a' },
  leaves: { n: 8, life: 2.5, speed: [100, 260], up: 0.4, spread: 1.4, g: 220, size: [16, 26], color: '#7cc46a' },
  sweat: { n: 1, life: 0.9, speed: [60, 60], up: 0.6, spread: 0, g: 600, size: [14, 14], color: '#a8d8ff' },
}

/** Dessine les particules d'un événement fx à l'instant t. */
export function drawFx(ctx, ev, t) {
  const T = TYPES[ev.type] ?? TYPES.sparkle
  const age = t - ev.t
  const life = ev.life ?? T.life
  if (age < 0 || age > life + 1) return
  const r = rng(Math.round(ev.t * 1000) + (ev.seed ?? 0))
  const n = ev.n ?? T.n
  const k = ev.scale ?? 1
  ctx.save()
  for (let i = 0; i < n; i++) {
    const delay = ev.type === 'zzz' || ev.type === 'notes' || ev.type === 'hearts' ? i * (life / n) * 0.6 : 0
    const a = age - delay
    const pl = life - delay
    if (a < 0 || a > pl) continue
    const ang = -Math.PI / 2 + (r() - 0.5) * 2 * T.spread + (ev.dir ?? 0)
    const sp = (T.speed[0] + r() * (T.speed[1] - T.speed[0])) * k
    const vx = Math.cos(ang) * sp
    const vy = Math.sin(ang) * sp * T.up - (1 - T.up) * sp * 0.2
    let x = ev.x + vx * a + (ev.type === 'zzz' || ev.type === 'notes' || ev.type === 'leaves' ? Math.sin(a * 3 + i) * 20 * k : 0)
    let y = ev.y + vy * a + 0.5 * T.g * k * a * a
    const size = (T.size[0] + r() * (T.size[1] - T.size[0])) * k
    const fade = 1 - clamp((a - pl * 0.6) / (pl * 0.4))
    ctx.globalAlpha = fade
    ctx.save()
    ctx.translate(x, y)
    const color = T.color ?? ['#ff6b6b', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc', '#ffa94d'][i % 6]
    ctx.fillStyle = ev.color ?? color
    ctx.strokeStyle = PLUM
    ctx.lineWidth = 3
    switch (ev.type) {
      case 'sparkle':
      case 'stars': {
        if (ev.type === 'stars') {
          // étoiles qui tournent autour d'une tête étourdie
          const ra = a * 6 + (i / n) * Math.PI * 2
          ctx.translate(Math.cos(ra) * 70 * k - vx * a, Math.sin(ra) * 22 * k - vy * a)
        }
        ctx.rotate(a * 2)
        const s = size * Math.sin(Math.PI * clamp(a / pl))
        star(ctx, s)
        ctx.fill()
        ctx.globalAlpha *= 0.4
        ctx.scale(1.6, 1.6)
        star(ctx, s)
        ctx.fill()
        break
      }
      case 'hearts':
        heart(ctx, size)
        ctx.fill()
        ctx.stroke()
        break
      case 'confetti':
        ctx.rotate(a * 8 + i)
        ctx.scale(1, Math.cos(a * 10 + i))
        ctx.fillRect(-size / 2, -size / 4, size, size / 2)
        break
      case 'notes':
        ctx.strokeStyle = ctx.fillStyle
        note(ctx, size * 0.6)
        break
      case 'zzz':
        ctx.font = `bold ${size}px "Baloo 2", "Comic Sans MS", sans-serif`
        ctx.fillText('z', 0, 0)
        break
      case 'leaves':
        ctx.rotate(a * 3 + i)
        ctx.beginPath()
        ctx.ellipse(0, 0, size * 0.6, size * 0.28, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        break
      case 'dust':
        ctx.globalAlpha *= 0.7
        ctx.beginPath()
        ctx.arc(0, 0, size * (0.6 + a / pl), 0, Math.PI * 2)
        ctx.fill()
        break
      default: {
        // gouttes (éclaboussure, gouttes, sueur)
        ctx.rotate(Math.atan2(vy + T.g * k * a, vx) + Math.PI / 2)
        ctx.beginPath()
        ctx.ellipse(0, 0, size * 0.55, size, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }
    ctx.restore()
  }
  // anneau d'eau au sol pour les éclaboussures
  if (ev.type === 'splash' && age < 0.6) {
    const p = age / 0.6
    ctx.globalAlpha = 1 - p
    ctx.strokeStyle = '#e8f4ff'
    ctx.lineWidth = 6 * (1 - p)
    ctx.beginPath()
    ctx.ellipse(ev.x, ev.y + 10, (40 + p * 160) * k, (12 + p * 45) * k, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()
}

/** Pluie (écran entier) : intensité 0 … 1, vent −1 … 1. */
export function drawRain(ctx, W, H, k, wind, t) {
  if (k <= 0.01) return
  const r = rng(5)
  const n = Math.round(220 * k)
  ctx.save()
  ctx.strokeStyle = 'rgba(190,215,255,0.6)'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  const slant = wind * 0.35 + 0.08
  for (let i = 0; i < n; i++) {
    const x0 = r() * (W + 400) - 200
    const speed = 1800 + r() * 900
    const ph = r()
    const y = ((t * speed + ph * H * 1.3) % (H * 1.3)) - H * 0.15
    const len = 40 + r() * 30
    ctx.globalAlpha = 0.35 + r() * 0.5
    ctx.beginPath()
    ctx.moveTo(x0 + y * slant, y)
    ctx.lineTo(x0 + (y + len) * slant, y + len)
    ctx.stroke()
  }
  ctx.restore()
}

export function drawSnow(ctx, W, H, k, wind, t) {
  if (k <= 0.01) return
  const r = rng(9)
  ctx.save()
  ctx.fillStyle = 'white'
  for (let i = 0; i < 160 * k; i++) {
    const x0 = r() * W
    const sp = 80 + r() * 120
    const y = ((t * sp + r() * H) % (H + 40)) - 20
    const x = (x0 + Math.sin(t * 1.3 + i) * 30 + wind * y * 0.3 + W) % W
    ctx.globalAlpha = 0.6 + r() * 0.4
    ctx.beginPath()
    ctx.arc(x, y, 3 + r() * 5, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
