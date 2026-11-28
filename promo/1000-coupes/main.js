/**
 * ============================================================================
 *  « 1000 coupes » — le gigot manga (≈ 21 s, 1080 × 1920)
 * ============================================================================
 *  Format « oddly satisfying » : un gigot façon manga (la viande sur l'os) coupé
 *  10 fois, puis 100 fois, puis 1000 fois.
 *  - Manche 1 : 10 coupes, les tranches s'écartent, la tranche du milieu se
 *    retourne et montre sa coupe (croûte, chair rosée, os).
 *  - Manche 2 : 100 coupes, puis les tranches tombent comme des dominos.
 *  - Manche 3 : 1000 coupes, le couteau devient flou, la viande s'effondre en
 *    copeaux… et il ne reste que l'os, propre.
 *  Dessin en canvas 2D (le gigot est peint une fois, puis découpé en bandes).
 *  Les instants des coupes sont aussi dans son.py (même formule).
 *
 *  Tout est une fonction du temps : window.__promo.seek(t) dessine l'instant t.
 */

import { clamp, ease, lerp, prog, rng } from '../engine.js'

const W = 1080
const H = 1920
const FPS = 30
const DURATION = 21.5
const canvas = document.getElementById('c')
const ctx = canvas.getContext('2d')
const ui = document.getElementById('ui')

// ------------------------------------------------------------ la géométrie

const CX = 540
const CY = 1080
const RX = 310 // demi-longueur de la viande
const RY = 180 // demi-hauteur
const BOARD_Y = CY + RY // la viande repose ici
const halfH = (x) => RY * Math.sqrt(Math.max(0, 1 - ((x - CX) / RX) ** 2))

// Les trois manches : nombre de coupes, instants des coupes.
const ROUNDS = [
  { n: 10, t0: 0.8, t1: 3.5, pow: 1, enter: -1, leave: 5.8 },
  { n: 100, t0: 6.4, t1: 9.4, pow: 0.85, enter: 5.8, leave: 11.4 },
  { n: 1000, t0: 12.0, t1: 16.0, pow: 0.7, enter: 11.4, leave: Infinity },
]
for (const R of ROUNDS) {
  R.times = Array.from({ length: R.n }, (_, k) => R.t0 + (R.t1 - R.t0) * (R.n === 1 ? 0 : (k / (R.n - 1)) ** R.pow))
  // Coupes réparties sur la viande (on laisse un peu de marge aux extrémités).
  R.xs = Array.from({ length: R.n }, (_, k) => CX - RX + 30 + ((2 * RX - 60) * (k + 1)) / (R.n + 1))
  R.bounds = [0, ...R.xs, W]
}
const roundAt = (t) => (t < ROUNDS[1].enter ? 0 : t < ROUNDS[2].enter ? 1 : 2)

// ------------------------------------------------------------ peinture du gigot

// Deux calques hors écran : l'os (traverse toute la viande) et la chair.
const OY = 760
const OH = 640
const mk = () => {
  const c = document.createElement('canvas')
  c.width = W
  c.height = OH
  return c
}
const boneC = mk()
const meatC = mk()
{
  const g = boneC.getContext('2d')
  g.translate(0, -OY)
  const by = CY + 10
  const grad = g.createLinearGradient(0, by - 40, 0, by + 40)
  grad.addColorStop(0, '#fff8e6')
  grad.addColorStop(0.5, '#efe0bd')
  grad.addColorStop(1, '#c9b183')
  g.fillStyle = grad
  g.strokeStyle = '#5a4022'
  g.lineWidth = 8
  // Le fût de l'os.
  g.beginPath()
  g.roundRect(120, by - 34, 840, 68, 30)
  g.fill()
  g.stroke()
  // Les deux bouts noueux.
  for (const x of [110, 970]) {
    for (const dy of [-34, 34]) {
      g.beginPath()
      g.arc(x, by + dy, 46, 0, Math.PI * 2)
      g.fillStyle = grad
      g.fill()
      g.stroke()
    }
    g.fillStyle = grad
    g.fillRect(x - 30, by - 34, 60, 68)
  }
  // Reflet.
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  g.lineWidth = 8
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(150, by - 18)
  g.lineTo(930, by - 18)
  g.stroke()
}
{
  const g = meatC.getContext('2d')
  g.translate(0, -OY)
  const r = rng(12)
  // Silhouette un peu bosselée, comme un gros gigot dessiné.
  const shape = new Path2D()
  const N = 80
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2
    const bump = 1 + 0.035 * Math.sin(a * 5 + 1) + 0.02 * Math.sin(a * 9)
    const x = CX + Math.cos(a) * RX * bump
    const y = CY + Math.sin(a) * RY * bump * (Math.sin(a) < 0 ? 1.04 : 0.98)
    i ? shape.lineTo(x, y) : shape.moveTo(x, y)
  }
  shape.closePath()
  const grad = g.createRadialGradient(CX - 120, CY - 110, 30, CX, CY, RX * 1.1)
  grad.addColorStop(0, '#e48a45')
  grad.addColorStop(0.45, '#b85a24')
  grad.addColorStop(1, '#6e2d10')
  g.fillStyle = grad
  g.fill(shape)
  g.save()
  g.clip(shape)
  // Marques de grill.
  g.strokeStyle = 'rgba(60,20,5,0.55)'
  g.lineWidth = 18
  g.lineCap = 'round'
  for (let k = -3; k <= 3; k++) {
    g.beginPath()
    g.moveTo(CX + k * 110 - 120, CY - 200)
    g.lineTo(CX + k * 110 + 60, CY + 200)
    g.stroke()
  }
  // Grain de la croûte et petites herbes.
  for (let i = 0; i < 500; i++) {
    g.fillStyle = r() < 0.7 ? 'rgba(80,30,8,0.35)' : 'rgba(255,200,140,0.35)'
    g.beginPath()
    g.arc(CX - RX + r() * 2 * RX, CY - RY + r() * 2 * RY, 1 + r() * 3, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = '#3f6b2a'
    g.fillRect(CX - RX + 40 + r() * (2 * RX - 80), CY - RY + 30 + r() * (2 * RY - 60), 6, 3)
  }
  // Brillant (graisse laquée).
  const gl = g.createRadialGradient(CX - 140, CY - 110, 10, CX - 140, CY - 110, 190)
  gl.addColorStop(0, 'rgba(255,240,210,0.55)')
  gl.addColorStop(1, 'rgba(255,240,210,0)')
  g.fillStyle = gl
  g.fillRect(0, 0, W, H)
  g.restore()
  g.strokeStyle = '#3a1606'
  g.lineWidth = 9
  g.stroke(shape)
}

// Une coupe vue de face : croûte, chair rosée persillée, os au centre.
const discCache = new Map()
function drawDisc(x, y, r, sx, seed, alpha = 1) {
  if (r < 2 || sx < 0.01) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  ctx.scale(sx, 1)
  ctx.fillStyle = '#5a240c'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r * 0.92)
  g.addColorStop(0, '#f5a3a0')
  g.addColorStop(0.6, '#e2797a')
  g.addColorStop(1, '#b6474c')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.88, 0, Math.PI * 2)
  ctx.fill()
  // Persillé : quelques filets de gras.
  if (!discCache.has(seed)) {
    const q = rng(seed)
    discCache.set(seed, Array.from({ length: 6 }, () => [q() * 6.28, 0.3 + q() * 0.5, q() * 1.2 + 0.4]))
  }
  ctx.strokeStyle = 'rgba(255,240,230,0.75)'
  ctx.lineWidth = Math.max(1, r * 0.035)
  ctx.lineCap = 'round'
  for (const [a, d, len] of discCache.get(seed)) {
    ctx.beginPath()
    ctx.arc(Math.cos(a) * r * d * 0.3, Math.sin(a) * r * d * 0.3, r * d, a, a + len * 0.6)
    ctx.stroke()
  }
  // L'os.
  ctx.fillStyle = '#f3e6c6'
  ctx.strokeStyle = '#7a5a30'
  ctx.lineWidth = Math.max(1, r * 0.04)
  ctx.beginPath()
  ctx.arc(0, 10 * (r / RY), r * 0.24, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#c98f6a'
  ctx.beginPath()
  ctx.arc(0, 10 * (r / RY), r * 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Une tranche : bande verticale [a, b] du gigot (os + chair), déplacée de (dx, dy), tournée de rot autour de (px, py).
function drawStrip(a, b, { dx = 0, dy = 0, rot = 0, px = 0, py = 0, meat = true, bone = true } = {}) {
  const w = Math.max(1, b - a)
  ctx.save()
  ctx.translate(dx, dy)
  if (rot) {
    ctx.translate(px, py)
    ctx.rotate(rot)
    ctx.translate(-px, -py)
  }
  if (bone) ctx.drawImage(boneC, a, 0, w, OH, a, OY, w, OH)
  if (meat) ctx.drawImage(meatC, a, 0, w, OH, a, OY, w, OH)
  ctx.restore()
}

// ------------------------------------------------------------ le décor

const bgC = document.createElement('canvas')
bgC.width = W
bgC.height = H
{
  const g = bgC.getContext('2d')
  const wall = g.createLinearGradient(0, 0, 0, H)
  wall.addColorStop(0, '#2d2420')
  wall.addColorStop(1, '#0f0b09')
  g.fillStyle = wall
  g.fillRect(0, 0, W, H)
  // Carrelage discret.
  g.strokeStyle = 'rgba(255,255,255,0.04)'
  g.lineWidth = 3
  for (let y = 0; y < 1150; y += 120) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(W, y)
    g.stroke()
  }
  for (let x = 0; x < W; x += 120) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, 1150)
    g.stroke()
  }
  // Plan de travail.
  g.fillStyle = '#3b3633'
  g.fillRect(0, 1130, W, H - 1130)
  // Planche à découper en bois.
  const r = rng(3)
  g.fillStyle = 'rgba(0,0,0,0.45)'
  g.beginPath()
  g.roundRect(50, 1180, 980, 520, 40)
  g.fill()
  const wood = g.createLinearGradient(0, 1150, 0, 1640)
  wood.addColorStop(0, '#d7a46a')
  wood.addColorStop(1, '#b37a43')
  g.fillStyle = wood
  g.beginPath()
  g.roundRect(40, 1150, 1000, 470, 36)
  g.fill()
  g.fillStyle = '#8a5a2e'
  g.beginPath()
  g.roundRect(40, 1590, 1000, 70, { lowerLeft: 36, lowerRight: 36 })
  g.fill()
  g.strokeStyle = 'rgba(120,70,30,0.35)'
  g.lineWidth = 3
  for (let i = 0; i < 26; i++) {
    const y = 1170 + r() * 420
    g.beginPath()
    g.moveTo(60, y)
    g.bezierCurveTo(300, y + (r() - 0.5) * 30, 700, y + (r() - 0.5) * 30, 1020, y + (r() - 0.5) * 20)
    g.stroke()
  }
  // Lumière d'en haut.
  const light = g.createRadialGradient(CX, 900, 50, CX, 1000, 900)
  light.addColorStop(0, 'rgba(255,225,170,0.28)')
  light.addColorStop(1, 'rgba(255,225,170,0)')
  g.fillStyle = light
  g.fillRect(0, 0, W, H)
}

// Le couteau (vu de dos : lame fine et manche), avec un flou de vitesse.
function drawKnife(x, yTip, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, yTip)
  const blade = ctx.createLinearGradient(-26, 0, 26, 0)
  blade.addColorStop(0, '#7f8894')
  blade.addColorStop(0.45, '#f4f7fb')
  blade.addColorStop(1, '#9aa3ae')
  ctx.fillStyle = blade
  ctx.strokeStyle = '#2a2f36'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(-4, 0)
  ctx.lineTo(4, 0)
  ctx.lineTo(24, -520)
  ctx.lineTo(-24, -520)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#1b1b1f'
  ctx.beginPath()
  ctx.roundRect(-34, -760, 68, 250, 22)
  ctx.fill()
  ctx.fillStyle = '#c9ced6'
  for (const y of [-720, -640, -560]) {
    ctx.beginPath()
    ctx.arc(0, y, 9, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

// ------------------------------------------------------------ le texte

ui.innerHTML = `
  <div class="t title">UN GIGOT MANGA</div><div class="t sub">COMBIEN DE COUPES ?</div>
  <div class="t count">0</div><div class="t label">COUPES</div>
  <div class="t end1">QU'EST-CE QUE<br>JE COUPE ENSUITE ?</div><div class="t end2">DIS-LE EN COMMENTAIRE ↓</div>`
const $ = (s) => ui.querySelector(s)
const T = { title: $('.title'), sub: $('.sub'), count: $('.count'), label: $('.label'), end1: $('.end1'), end2: $('.end2') }
const showT = (el, s, extra = '') => {
  el.style.visibility = s > 0.01 ? '' : 'hidden'
  el.style.transform = `translate(-50%, 0) scale(${Math.max(0.001, s).toFixed(3)}) ${extra}`
}

// ------------------------------------------------------------ copeaux (manche 3)

const SHAV = []
{
  const r = rng(77)
  const R = ROUNDS[2]
  for (let i = 0; i <= R.n; i++) {
    const a = R.bounds[i]
    const b = R.bounds[i + 1]
    const x = (a + b) / 2
    if (x < CX - RX || x > CX + RX) continue
    // Point d'arrivée dans un tas en dôme.
    const u = r() * 2 - 1
    const px = CX + u * 330 * Math.sqrt(r())
    const top = 240 * (1 - (u * u) ** 0.8)
    SHAV.push({ x, y0: CY - halfH(x) * (0.2 + r() * 0.6), tx: px, ty: BOARD_Y + 30 - r() * top, rot: r() * 6.28, len: 16 + r() * 22, col: r() < 0.25 ? '#7a3412' : r() < 0.6 ? '#e2797a' : '#f2a3a0', d: r() })
  }
}
const COLLAPSE = 16.2

// ------------------------------------------------------------ l'instant t

function knifeState(R, t) {
  // Manche 1 : un aller-retour franc par coupe. Manches 2-3 : la lame rebondit à chaque coupe.
  const { times, xs } = R
  if (t < times[0] - 0.5 || t > times.at(-1) + 0.6) return null
  let k = times.findIndex((x) => x > t)
  if (k < 0) k = times.length
  const prev = k > 0 ? times[k - 1] : times[0] - 0.4
  const next = k < times.length ? times[k] : prev + 0.4
  const xPrev = k > 0 ? xs[k - 1] : xs[0]
  const xNext = k < xs.length ? xs[k] : xs.at(-1)
  const u = clamp((t - prev) / Math.max(1e-3, next - prev))
  const up = 820
  const down = BOARD_Y + 8
  if (R.n === 10) {
    const dDown = 0.09
    const span = next - prev
    const dn = next - t
    let y
    if (dn < dDown && k < times.length) y = lerp(up, down, ease.in2(1 - dn / dDown))
    else y = lerp(down, up, ease.out3(clamp((t - prev) / 0.14)))
    const x = lerp(xPrev, xNext, ease.io2(clamp((t - prev - 0.1) / Math.max(0.05, span - 0.2))))
    return { x, y, blur: 0 }
  }
  const y = lerp(down, up - 60, Math.sin(Math.PI * u) ** 0.6)
  return { x: lerp(xPrev, xNext, u), y, blur: Math.min(1, 1 / Math.max(0.01, next - prev) / 25) }
}

function seek(t) {
  t = clamp(t, 0, DURATION - 1e-6)
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#0f0b09'
  ctx.fillRect(0, 0, W, H)
  // Caméra : plan serré sur la planche (le format est vertical), léger zoom pendant la manche 3.
  const Z = 1.12 + 0.1 * prog(t, 12.0, 4.0, ease.io2) * (1 - prog(t, 16.2, 0.6, ease.io2))
  ctx.save()
  ctx.translate(CX, 1150)
  ctx.scale(Z, Z)
  ctx.translate(-CX, -1150)
  ctx.drawImage(bgC, 0, 0)
  const ri = roundAt(t)
  const R = ROUNDS[ri]
  // Changement de manche : la planche glisse, la nouvelle arrive.
  const slideIn = R.enter < 0 ? 1 : prog(t, R.enter, 0.5, ease.out3)
  const slideOut = prog(t, R.leave, 0.5, ease.in3)
  const shiftX = (1 - slideIn) * 1100 - slideOut * 1100
  // Petite secousse à chaque coupe (manche 1) et à l'effondrement.
  let sh = 0
  const lastCut = R.times.filter((x) => x <= t).at(-1)
  if (ri === 0 && lastCut !== undefined) sh = 5 * Math.exp(-(t - lastCut) * 30) * Math.sin((t - lastCut) * 90)
  ctx.save()
  ctx.translate(shiftX + sh, 0)

  // Ombre portée.
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.ellipse(CX, BOARD_Y + 16, RX * 1.05, 28, 0, 0, Math.PI * 2)
  ctx.fill()

  const done = R.times.filter((x) => x <= t).length
  const B = R.bounds
  if (ri === 0) {
    // Manche 1 : tranches nettes, puis elles s'écartent ; celle du milieu se retourne.
    const spread = prog(t, 3.7, 0.5, ease.back(1.6))
    const flip = prog(t, 4.3, 0.6, ease.back(1.4))
    const m = 5
    for (let i = 0; i <= R.n; i++) {
      const cutL = i > 0 && i <= done
      const off = (i - R.n / 2) * 22 * spread
      if (i === m && flip > 0) continue
      drawStrip(B[i] + (cutL ? 1.5 : 0), B[i + 1] - (i < done ? 1.5 : 0), { dx: off })
    }
    if (flip > 0) {
      const x0 = (B[m] + B[m + 1]) / 2
      const r = halfH(x0)
      // La tranche se soulève et pivote face à nous.
      drawStrip(B[m], B[m + 1], { dx: (m - R.n / 2) * 22 * spread, dy: -260 * flip, meat: flip < 0.25, bone: flip < 0.25 })
      drawDisc(x0 + (m - R.n / 2) * 22 * spread, CY - 260 * flip, r * lerp(1, 1.35, flip), Math.max(0.05, flip), 9)
    }
  } else if (ri === 1) {
    // Manche 2 : 100 tranches qui s'écartent en accordéon, puis une vague les traverse.
    const spread = prog(t, 9.6, 0.5, ease.back(1.4)) * (1 - prog(t, 11.0, 0.35, ease.io2))
    const wave = prog(t, 9.9, 1.2)
    for (let i = 0; i <= R.n; i++) {
      const a = B[i]
      const b = B[i + 1]
      const ph = i / R.n - wave * 1.4 + 0.2
      const bump = wave > 0 && wave < 1 ? Math.exp(-((ph / 0.08) ** 2)) : 0
      drawStrip(a + (i > 0 && i <= done ? 1 : 0), b, { dx: (i - R.n / 2) * 3.2 * spread, dy: -70 * bump })
    }
  } else {
    // Manche 3 : 1000 coupes, puis la chair s'effondre en copeaux ; l'os reste.
    const collapsing = t >= COLLAPSE
    if (!collapsing) {
      for (let i = 0; i <= R.n; i += 1) drawStrip(B[i], B[i + 1], {})
      // Les fines lignes des coupes déjà faites (une sur 4, sinon tout devient gris).
      ctx.strokeStyle = 'rgba(40,10,0,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let k = 0; k < done; k += 4) {
        const x = R.xs[k]
        const h = halfH(x)
        ctx.moveTo(x, CY - h)
        ctx.lineTo(x, CY + h)
      }
      ctx.stroke()
    } else {
      // L'os (avec un petit saut à la fin), puis la chair qui n'est pas encore tombée.
      const hop = prog(t, 17.8, 0.8)
      const hy = -120 * Math.sin(Math.PI * hop)
      ctx.save()
      ctx.translate(0, hy)
      ctx.drawImage(boneC, 0, OY)
      ctx.restore()
      for (const s of SHAV) {
        const st = COLLAPSE + ((s.x - (CX - RX)) / (2 * RX)) * 1.0
        const u = clamp((t - st) / 0.45)
        if (u <= 0) {
          drawStrip(s.x - 0.4, s.x + 0.9, { bone: false })
          continue
        }
        const x = lerp(s.x, s.tx, ease.out2(u))
        const y = lerp(s.y0, s.ty, ease.in2(u)) - 40 * Math.sin(Math.PI * u)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(s.rot + u * 4)
        ctx.strokeStyle = s.col
        ctx.lineWidth = 7
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(0, 0, s.len * 0.5, 0, 2.2)
        ctx.stroke()
        ctx.restore()
      }
      // Étincelles sur l'os propre.
      const sp = prog(t, 18.0, 1.2)
      if (sp > 0 && sp < 1) {
        for (const [x, y, k] of [[260, -60, 0], [700, -80, 0.3], [930, 40, 0.6]]) {
          const a = Math.sin(Math.PI * clamp((sp - k * 0.4) / 0.6))
          if (a <= 0) continue
          ctx.save()
          ctx.translate(x, CY + y + hy)
          ctx.fillStyle = `rgba(255,255,255,${a})`
          ctx.beginPath()
          for (let j = 0; j < 8; j++) {
            const rr = j % 2 ? 8 : 34 * a
            ctx.lineTo(Math.cos((j * Math.PI) / 4) * rr, Math.sin((j * Math.PI) / 4) * rr)
          }
          ctx.fill()
          ctx.restore()
        }
      }
    }
  }

  // Vapeur au début (le gigot sort du four).
  if (t < 2.5) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 16
    ctx.lineCap = 'round'
    for (let k = 0; k < 4; k++) {
      const ph = (t * 0.6 + k * 0.25) % 1
      const x = CX - 180 + k * 120
      ctx.globalAlpha = Math.sin(Math.PI * ph) * (1 - t / 2.5)
      ctx.beginPath()
      ctx.moveTo(x, CY - RY - 10 - ph * 200)
      ctx.bezierCurveTo(x + 30, CY - RY - 60 - ph * 200, x - 30, CY - RY - 110 - ph * 200, x, CY - RY - 160 - ph * 200)
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  // Le couteau (avec flou de vitesse dans les manches 2 et 3).
  const ks = knifeState(R, t)
  if (ks) {
    if (ks.blur > 0) for (let g = 1; g <= 4; g++) {
      const k2 = knifeState(R, t - (g * 0.012) / Math.max(0.3, 1 - ks.blur * 0.6))
      if (k2) drawKnife(k2.x, k2.y, 0.18 * ks.blur)
    }
    drawKnife(ks.x, ks.y, 1)
  }
  ctx.restore()
  ctx.restore()

  // Texte : titre d'ouverture, compteur, fin.
  showT(T.title, t < 1.2 ? 1 - prog(t, 0.9, 0.25, ease.in3) : 0)
  showT(T.sub, t < 1.2 ? ease.back(2)(prog(t, 0.15, 0.3)) * (1 - prog(t, 0.9, 0.25, ease.in3)) : 0)
  const inRound = t > 0.75 && t < 18.6
  const lastC = R.times.filter((x) => x <= t).at(-1)
  const kick = lastC === undefined ? 1 : 1 + 0.12 * Math.exp(-(t - lastC) * 20)
  T.count.textContent = String(done)
  T.label.textContent = `COUPES SUR ${R.n}`
  const cIn = inRound ? Math.min(prog(t, Math.max(0.75, R.enter + 0.3), 0.3, ease.back(2)), 1) : 0
  showT(T.count, cIn * kick * (1 - slideOut))
  showT(T.label, cIn * (1 - slideOut))
  const endIn = ease.back(2)(prog(t, 18.8, 0.4))
  showT(T.end1, endIn)
  showT(T.end2, ease.back(2.4)(prog(t, 19.3, 0.4)), `rotate(-2deg)`)
}

const ready = (async () => {
  await document.fonts.ready
  await document.fonts.load('900 80px "Figtree Variable"')
  seek(0)
})()
window.__promo = { ready, seek, duration: DURATION, fps: FPS }
