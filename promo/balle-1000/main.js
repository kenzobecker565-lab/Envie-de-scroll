/**
 * ============================================================================
 *  « 1000 morceaux » — la balle de tennis (≈ 24 s, 1080 × 1920)
 * ============================================================================
 *  Format « oddly satisfying » : une balle tombe sur la table, des traits de
 *  coupe la quadrillent, puis ses morceaux carrés s'effondrent et s'empilent.
 *  Manches : 2, 8, 100, puis 1000 morceaux.
 *  Canvas 2D : la balle est peinte une fois ; chaque morceau en est un carré,
 *  dessiné avec une petite épaisseur (côté plus sombre) pour faire « cube ».
 *  Les instants sont repris dans son.py.
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'

const W = 1080
const H = 1920
const FPS = 30
const DURATION = 24
const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
const ui = document.getElementById('ui')

const CX = 540
const CY = 1080
const R = 300
const FLOOR = CY + R + 4

// ------------------------------------------------------------ la balle

const ballC = document.createElement('canvas')
ballC.width = 2 * R + 20
ballC.height = 2 * R + 20
const BX = CX - R - 10 // coin du calque dans la scène
const BY = CY - R - 10
// texC : la même peinture sans le découpage rond (les morceaux du bord restent des carrés pleins).
const texC = document.createElement('canvas')
texC.width = ballC.width
texC.height = ballC.height
for (const [cv, round] of [[ballC, true], [texC, false]]) {
  const g = cv.getContext('2d')
  const c = R + 10
  const r = rng(4)
  g.save()
  if (round) {
    g.beginPath()
    g.arc(c, c, R, 0, Math.PI * 2)
    g.clip()
  }
  const base = g.createRadialGradient(c - 110, c - 120, 30, c, c, R * 1.05)
  base.addColorStop(0, '#f4ff8a')
  base.addColorStop(0.5, '#d6ef2e')
  base.addColorStop(1, '#93ad12')
  g.fillStyle = base
  g.fillRect(0, 0, 2 * c, 2 * c)
  // Feutre : des milliers de petits poils.
  for (let i = 0; i < 9000; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * (R + 10) * (round ? 1 : 1.42)
    const x = c + Math.cos(a) * d
    const y = c + Math.sin(a) * d
    g.strokeStyle = r() < 0.5 ? 'rgba(255,255,200,0.25)' : 'rgba(90,110,0,0.22)'
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + (r() - 0.5) * 6, y + (r() - 0.5) * 6)
    g.stroke()
  }
  // Les deux coutures blanches.
  g.strokeStyle = '#fbfbf0'
  g.lineWidth = 26
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(c - R * 0.95, c - R * 0.55)
  g.bezierCurveTo(c - R * 0.15, c - R * 0.25, c - R * 0.15, c + R * 0.25, c - R * 0.95, c + R * 0.55)
  g.stroke()
  g.beginPath()
  g.moveTo(c + R * 0.95, c - R * 0.55)
  g.bezierCurveTo(c + R * 0.15, c - R * 0.25, c + R * 0.15, c + R * 0.25, c + R * 0.95, c + R * 0.55)
  g.stroke()
  g.strokeStyle = 'rgba(0,0,0,0.12)'
  g.lineWidth = 6
  g.beginPath()
  g.moveTo(c - R * 0.95, c - R * 0.5)
  g.bezierCurveTo(c - R * 0.1, c - R * 0.2, c - R * 0.1, c + R * 0.3, c - R * 0.95, c + R * 0.6)
  g.stroke()
  // Ombre propre et reflet.
  const sh = g.createRadialGradient(c - 90, c - 100, R * 0.5, c, c, R * 1.02)
  sh.addColorStop(0, 'rgba(0,0,0,0)')
  sh.addColorStop(1, 'rgba(30,40,0,0.45)')
  g.fillStyle = sh
  g.fillRect(0, 0, 2 * c, 2 * c)
  const hl = g.createRadialGradient(c - 120, c - 140, 5, c - 120, c - 140, 110)
  hl.addColorStop(0, 'rgba(255,255,255,0.55)')
  hl.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = hl
  g.fillRect(0, 0, 2 * c, 2 * c)
  g.restore()
}

// ------------------------------------------------------------ le décor

const bgC = document.createElement('canvas')
bgC.width = W
bgC.height = H
{
  const g = bgC.getContext('2d')
  const wall = g.createLinearGradient(0, 0, 0, FLOOR)
  wall.addColorStop(0, '#1b2a3a')
  wall.addColorStop(1, '#0c141d')
  g.fillStyle = wall
  g.fillRect(0, 0, W, FLOOR)
  const light = g.createRadialGradient(CX, 700, 50, CX, 900, 900)
  light.addColorStop(0, 'rgba(160,210,255,0.22)')
  light.addColorStop(1, 'rgba(160,210,255,0)')
  g.fillStyle = light
  g.fillRect(0, 0, W, FLOOR)
  const table = g.createLinearGradient(0, FLOOR, 0, H)
  table.addColorStop(0, '#e9e4dc')
  table.addColorStop(1, '#a9a196')
  g.fillStyle = table
  g.fillRect(0, FLOOR, W, H - FLOOR)
  g.fillStyle = 'rgba(255,255,255,0.6)'
  g.fillRect(0, FLOOR, W, 4)
}

// ------------------------------------------------------------ les manches

// Découpage : 2 moitiés ; 8 = 4 colonnes × 2 rangées ; 100 et 1000 : grille dont
// le nombre de carrés touchant la balle est le plus proche possible du nombre visé.
function cellsFor(s, cols, rows) {
  const out = []
  const x0 = CX - (cols * s) / 2
  const y0 = CY - (rows * s) / 2
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * s
      const y = y0 + j * s
      // Le carré touche-t-il la balle ?
      const nx = clamp(CX, x, x + s)
      const ny = clamp(CY, y, y + s)
      if ((nx - CX) ** 2 + (ny - CY) ** 2 < R * R) out.push({ x, y, w: s, h: s, i, j })
    }
  return out
}
function gridFor(target) {
  let best = null
  for (let s = 6; s < 400; s += 0.25) {
    const n = Math.ceil((2 * R) / s)
    const c = cellsFor(s, n, n)
    if (!best || Math.abs(c.length - target) < Math.abs(best.length - target)) best = c
    if (c.length < target * 0.8) break
  }
  return best
}
const ROUNDS = [
  { n: 2, t0: 0, drop: 0.0, cut: [1.0, 1.35], fall: 1.6, fallDur: 0.6, leave: 4.0, cells: [{ x: CX - R, y: CY - R, w: R, h: 2 * R }, { x: CX, y: CY - R, w: R, h: 2 * R }] },
  { n: 8, t0: 4.5, drop: 4.5, cut: [5.4, 6.2], fall: 6.45, fallDur: 1.0, leave: 9.0, cells: [] },
  { n: 100, t0: 9.5, drop: 9.5, cut: [10.3, 11.5], fall: 11.75, fallDur: 1.8, leave: 14.6, cells: gridFor(100) },
  { n: 1000, t0: 15.1, drop: 15.1, cut: [15.9, 17.6], fall: 17.85, fallDur: 2.4, leave: Infinity, cells: gridFor(1000) },
]
for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) ROUNDS[1].cells.push({ x: CX - R + i * (R / 2), y: CY - R + j * R, w: R / 2, h: R, i, j })

// Pour chaque morceau : instant de chute, point d'arrivée dans le tas, rotation.
const G = 5200 // gravité (px/s²)
for (const [ri, Rd] of ROUNDS.entries()) {
  const r = rng(100 + ri)
  const cells = Rd.cells
  // Les rangées du bas tombent d'abord, avec un peu de hasard.
  const order = cells.map((c, k) => ({ c, k, key: -(c.y + c.h) + r() * Rd.fallDur * 120 * (ri > 1 ? 1 : 0.2) }))
  order.sort((a, b) => a.key - b.key)
  const colW = Math.max(6, cells[0].w * 0.9)
  const heights = new Map()
  order.forEach(({ c }, idx) => {
    c.ts = Rd.fall + (idx / order.length) * Rd.fallDur * (ri === 0 ? 0.1 : 1)
    const spread = ri === 0 ? 0 : ri === 1 ? 70 : 160
    let cx = c.x + c.w / 2 + (r() - 0.5) * spread + (c.x + c.w / 2 - CX) * (ri === 0 ? 0.35 : 0.25)
    if (ri === 0) {
      // Les deux moitiés basculent vers l'extérieur.
      c.side = c.x < CX ? -1 : 1
      c.tx = CX + c.side * (R * 0.95)
      c.ty = FLOOR - R * 0.55
      c.rot = c.side * (Math.PI / 2)
      return
    }
    const col = Math.round(cx / colW)
    // Le tas se répand : un morceau glisse vers le côté plus bas.
    let best = col
    for (const d of [-2, -1, 1, 2]) if ((heights.get(col + d) ?? 0) + 6 < (heights.get(best) ?? 0)) best = col + d
    const h = heights.get(best) ?? 0
    c.tx = best * colW
    c.ty = FLOOR - h - c.h / 2
    heights.set(best, h + Math.min(c.w, c.h) * 0.82)
    c.rot = (r() - 0.5) * (ri === 1 ? 0.6 : 1.2)
  })
  // Durée de chute (gravité) jusqu'au tas.
  for (const c of cells) c.T = ri === 0 ? 0.55 : Math.max(0.18, Math.sqrt((2 * Math.max(10, c.ty - (c.y + c.h / 2))) / G))
}

// ------------------------------------------------------------ dessin

function drawPiece(c, x, y, rot, alpha = 1, inBall = false) {
  const d = Math.max(2, Math.min(10, c.w * 0.12)) // épaisseur
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.rotate(rot)
  // Côté (épaisseur) : la chair grise du caoutchouc.
  ctx.fillStyle = '#7d8a3a'
  if (!inBall) ctx.fillRect(-c.w / 2 + d * 0.6, -c.h / 2 + d * 0.6, c.w, c.h)
  ctx.drawImage(inBall ? ballC : texC, c.x - BX, c.y - BY, c.w, c.h, -c.w / 2, -c.h / 2, c.w, c.h)
  if (c.w > 14 && !inBall) {
    ctx.strokeStyle = 'rgba(40,50,0,0.35)'
    ctx.lineWidth = 2
    ctx.strokeRect(-c.w / 2, -c.h / 2, c.w, c.h)
  }
  ctx.restore()
}

// Les morceaux sont découpés dans un carré de la balle : on ne garde que la partie dans le disque.
const clipBall = new Path2D()
clipBall.arc(CX, CY, R, 0, Math.PI * 2)

function drawRound(Rd, ri, t) {
  // La balle tombe et rebondit.
  const u = t - Rd.drop
  let by = 0
  let squash = 1
  if (ri > 0 || u >= 0) {
    if (u < 0.35) by = -1300 * (1 - ease.in2(clamp(u / 0.35)))
    else {
      const v = u - 0.35
      by = -90 * Math.abs(Math.sin(v * 9)) * Math.exp(-v * 6)
      squash = 1 - 0.12 * Math.exp(-v * 14) * Math.cos(v * 30)
    }
  }
  const cut0 = Rd.cut[0]
  const cut1 = Rd.cut[1]
  // Ombre.
  const shadowK = clamp(1 + by / 1300)
  ctx.fillStyle = `rgba(0,0,0,${0.35 * shadowK})`
  ctx.beginPath()
  ctx.ellipse(CX, FLOOR + 6, R * 0.85 * shadowK, 26 * shadowK, 0, 0, Math.PI * 2)
  ctx.fill()

  if (t < Rd.fall) {
    ctx.save()
    ctx.translate(CX, FLOOR)
    ctx.scale(1 / squash, squash)
    ctx.translate(-CX, -FLOOR + by)
    ctx.drawImage(ballC, BX, BY)
    // Les traits de coupe (laser) qui balaient la balle.
    const cp = prog(t, cut0, cut1 - cut0)
    if (cp > 0) {
      const xs = [...new Set(Rd.cells.map((c) => c.x).concat(Rd.cells.map((c) => c.x + c.w)))].sort((a, b) => a - b).filter((x) => x > CX - R + 1 && x < CX + R - 1)
      const ys = [...new Set(Rd.cells.map((c) => c.y).concat(Rd.cells.map((c) => c.y + c.h)))].sort((a, b) => a - b).filter((y) => y > CY - R + 1 && y < CY + R - 1)
      const lines = [...xs.map((x) => ['v', x]), ...ys.map((y) => ['h', y])]
      ctx.save()
      ctx.clip(clipBall)
      lines.forEach(([o, p], k) => {
        const lt = clamp(cp * lines.length * 1.0 - k * 0.6)
        if (lt <= 0) return
        const len = 2 * R * Math.min(1, lt * 1.6)
        const glow = Math.max(0, 1 - (lt - 0.6) * 1.5)
        ctx.strokeStyle = `rgba(30,40,0,0.75)`
        ctx.lineWidth = Math.max(1, Math.min(4, 220 / lines.length))
        ctx.beginPath()
        if (o === 'v') {
          ctx.moveTo(p, CY - R)
          ctx.lineTo(p, CY - R + len)
        } else {
          ctx.moveTo(CX - R, p)
          ctx.lineTo(CX - R + len, p)
        }
        ctx.stroke()
        if (glow > 0) {
          ctx.strokeStyle = `rgba(255,80,80,${0.9 * glow})`
          ctx.lineWidth = Math.max(2, Math.min(8, 400 / lines.length))
          ctx.stroke()
        }
      })
      ctx.restore()
    }
    ctx.restore()
    return
  }
  // L'effondrement : chaque morceau tombe, tourne, rebondit sur le tas.
  const pieces = []
  for (const c of Rd.cells) {
    const k = t - c.ts
    const x0 = c.x + c.w / 2
    const y0 = c.y + c.h / 2
    if (k <= 0) {
      pieces.push([c, x0, y0, 0, -1])
      continue
    }
    let x
    let y
    let rot
    if (ri === 0) {
      const p = ease.in2(clamp(k / c.T))
      const land = clamp((k - c.T) / 0.4)
      x = lerp(x0, c.tx, p)
      y = lerp(y0, c.ty, p) - 30 * Math.sin(Math.PI * land) * (1 - land)
      rot = c.rot * p
    } else if (k < c.T) {
      const p = k / c.T
      x = lerp(x0, c.tx, ease.out2(p))
      y = y0 + 0.5 * G * k * k
      y = Math.min(y, c.ty)
      rot = c.rot * p
    } else {
      const b = k - c.T
      x = c.tx
      y = c.ty - Math.min(c.h, 40) * 0.5 * Math.abs(Math.sin(b * 18)) * Math.exp(-b * 10)
      rot = c.rot
    }
    pieces.push([c, x, y, rot, y])
  }
  // On dessine d'abord ceux qui n'ont pas bougé (encore dans la balle), puis par hauteur.
  ctx.save()
  ctx.beginPath()
  for (const [c, x, y, rot, moved] of pieces) if (moved < 0) {
    ctx.save()
    ctx.clip(clipBall)
    drawPiece(c, x, y, 0, 1, true)
    ctx.restore()
  }
  ctx.restore()
  // Les 2 et 8 morceaux gardent leur bord arrondi ; à partir de 100, ce sont des carrés pleins.
  pieces.filter((p) => p[4] >= 0).sort((a, b) => a[2] - b[2]).forEach(([c, x, y, rot]) => drawPiece(c, x, y, rot, 1, ri <= 1))
}

// ------------------------------------------------------------ texte

ui.innerHTML = `
  <div class="t title">UNE BALLE DE TENNIS</div><div class="t sub">EN COMBIEN DE MORCEAUX ?</div>
  <div class="t count">0</div><div class="t label">MORCEAUX</div>
  <div class="t end1">ON TENTE<br>10 000 ?</div><div class="t end2">DIS-LE EN COMMENTAIRE ↓</div>`
const $ = (s) => ui.querySelector(s)
const T = { title: $('.title'), sub: $('.sub'), count: $('.count'), label: $('.label'), end1: $('.end1'), end2: $('.end2') }
const showT = (el, s, extra = '') => {
  el.style.visibility = s > 0.01 ? '' : 'hidden'
  el.style.transform = `translate(-50%, 0) scale(${Math.max(0.001, s).toFixed(3)}) ${extra}`
}

function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  ctx.fillStyle = '#0c141d'
  ctx.fillRect(0, 0, W, H)
  // Caméra : plan serré sur la balle (le format est vertical).
  ctx.save()
  ctx.translate(CX, 1180)
  ctx.scale(1.42, 1.42)
  ctx.translate(-CX, -1180)
  ctx.drawImage(bgC, 0, 0)
  const ri = ROUNDS.findLastIndex((r) => t >= r.t0)
  const Rd = ROUNDS[ri]
  // Changement de manche : la table glisse vers la gauche.
  const out = prog(t, Rd.leave, 0.5, ease.in3)
  ctx.save()
  ctx.translate(-out * 1100, 0)
  drawRound(Rd, ri, t)
  ctx.restore()
  ctx.restore()

  // Texte.
  showT(T.title, t < 1.4 ? ease.back(2)(prog(t, 0.05, 0.3)) * (1 - prog(t, 1.1, 0.25, ease.in3)) : 0)
  showT(T.sub, t < 1.4 ? ease.back(2)(prog(t, 0.25, 0.3)) * (1 - prog(t, 1.1, 0.25, ease.in3)) : 0)
  const cutDone = t >= Rd.cut[1]
  const shown = t >= Rd.fall ? Rd.n : t >= Rd.cut[0] ? Math.round(Rd.n * ease.out3(prog(t, Rd.cut[0], Rd.cut[1] - Rd.cut[0]))) : 1
  T.count.textContent = String(Math.max(1, shown))
  T.label.textContent = shown > 1 ? 'MORCEAUX' : 'MORCEAU'
  const cIn = t > 1.25 || ri > 0 ? ease.back(2)(prog(t, Math.max(1.25, Rd.t0 + 0.2), 0.3)) : 0
  const kick = cutDone ? 1 + 0.15 * Math.exp(-(t - Rd.cut[1]) * 12) : 1
  showT(T.count, cIn * kick * (1 - out) * (t < 20.6 ? 1 : 1 - prog(t, 20.6, 0.3)))
  showT(T.label, cIn * (1 - out) * (t < 20.6 ? 1 : 1 - prog(t, 20.6, 0.3)))
  showT(T.end1, ease.back(2)(prog(t, 20.8, 0.4)))
  showT(T.end2, ease.back(2.4)(prog(t, 21.3, 0.4)), 'rotate(-2deg)')
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
