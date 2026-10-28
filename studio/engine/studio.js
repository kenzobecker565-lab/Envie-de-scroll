/**
 * Le moteur de rendu du studio : charge un épisode et dessine n'importe quelle image.
 *
 *   const studio = new Studio(canvas, episode)
 *   await studio.load()
 *   studio.render(12.5)   // dessine l'image à t = 12,5 s
 */
import { clamp, lerp } from './core.js'
import { BASE_R, drawMinuton, loadMinutonRig } from './draw-minuton.js'
import { drawCloud, drawImageActor, drawMoon, drawPuddle, drawRainbow, drawSkyClouds, drawStars, drawSun, loadImage } from './draw-props.js'
import { drawFx, drawRain, drawSnow } from './fx.js'
import { DECORS, IMAGES, RIGS } from './library.js'
import { compile, evaluate } from './timeline.js'

export const W = 1080
export const H = 1920

const canvas2 = (w = W, h = H) => {
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h })
  return c
}

export class Studio {
  constructor(canvas, episode, { root = '/' } = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.ep = episode
    this.root = root
    this.C = compile(episode)
    this.layer = canvas2()
    this.sky = canvas2()
  }

  async load() {
    const R = this.root
    this.rigs = { minuton: await loadMinutonRig(R + RIGS.minuton) }
    this.decors = {}
    const ids = new Set(this.C.decors.map((d) => d.id).filter(Boolean))
    for (const id of ids) {
      const def = DECORS[id]
      if (!def) throw new Error(`Décor inconnu : ${id} (connus : ${Object.keys(DECORS).join(', ')})`)
      const plates = {}
      for (const [k, src] of Object.entries(def.plates)) plates[k] = this.cover(await loadImage(R + src))
      this.decors[id] = { def, plates, skyMask: this.skyMask(plates.day) }
    }
    this.images = {}
    for (const a of Object.values(this.C.actors)) {
      if (a.type !== 'image') continue
      const key = a.def.img
      const def = IMAGES[key]
      if (!def) throw new Error(`Image inconnue : ${key} (connues : ${Object.keys(IMAGES).join(', ')})`)
      this.images[key] = { def, img: await loadImage(R + def.src) }
    }
    if (document.fonts) await document.fonts.ready
    return this
  }

  cover(img) {
    const c = canvas2()
    const k = Math.max(W / img.width, H / img.height)
    c.getContext('2d').drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k)
    return c
  }

  /** Masque du ciel : pixels bleus ou blancs reliés au haut de l'image. */
  skyMask(plate) {
    const ctx = plate.getContext('2d')
    const d = ctx.getImageData(0, 0, W, H).data
    const sky = new Uint8Array(W * H)
    const isSky = (i) => {
      const r = d[i * 4]
      const g = d[i * 4 + 1]
      const b = d[i * 4 + 2]
      return (b > r + 25 || Math.min(r, g, b) > 225) && i / W < 1050
    }
    const stack = []
    for (let x = 0; x < W; x++) if (isSky(x)) (sky[x] = 1), stack.push(x)
    while (stack.length) {
      const i = stack.pop()
      const x = i % W
      for (const j of [i - 1, i + 1, i - W, i + W]) {
        if (j < 0 || j >= W * H || sky[j] || (j === i - 1 && x === 0) || (j === i + 1 && x === W - 1)) continue
        if (isSky(j)) (sky[j] = 1), stack.push(j)
      }
    }
    const m = canvas2()
    const mctx = m.getContext('2d')
    const out = mctx.createImageData(W, H)
    for (let i = 0; i < W * H; i++) out.data[i * 4 + 3] = sky[i] * 255
    mctx.putImageData(out, 0, 0)
    // bord adouci
    const soft = canvas2()
    const sctx = soft.getContext('2d')
    sctx.filter = 'blur(2px)'
    sctx.drawImage(m, 0, 0)
    return soft
  }

  get duration() {
    return this.C.duration
  }

  state(t) {
    return evaluate(this.C, t)
  }

  render(t, opts = {}) {
    const S = evaluate(this.C, t)
    const ctx = this.ctx
    const cam = S.camera
    // une caméra penchée montrerait les coins vides : on zoome juste assez pour les cacher
    const z = Math.max(0.2, cam.zoom) * (1 + Math.abs(cam.rot) * 2.4)
    if (!cam.free) {
      cam.x = clamp(cam.x, W / (2 * z), W - W / (2 * z))
      cam.y = clamp(cam.y, H / (2 * z), H - H / (2 * z))
    }
    const applyCam = (c) => {
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.translate(W / 2, H / 2)
      c.rotate(cam.rot)
      c.scale(z, z)
      c.translate(-cam.x, -cam.y)
    }
    const env = S.env
    const tm = clamp(env.time, 0, 2)
    const wDay = clamp(1 - tm)
    const wSunset = tm <= 1 ? tm : 2 - tm
    const wNight = clamp(tm - 1)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)

    // --- décor (flou de profondeur quand la caméra se rapproche)
    const D = this.decors[S.decor]
    applyCam(ctx)
    if (D) {
      const blur = Math.min(8, Math.max(0, (z - 1.25) * 5) + (env.blur ?? 0))
      ctx.filter = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none'
      ctx.drawImage(D.plates.day, 0, 0)
      if (tm > 0 && tm <= 1) {
        ctx.globalAlpha = tm
        ctx.drawImage(D.plates.sunset, 0, 0)
      } else if (tm > 1) {
        ctx.drawImage(D.plates.sunset, 0, 0)
        ctx.globalAlpha = tm - 1
        ctx.drawImage(D.plates.night, 0, 0)
      }
      ctx.globalAlpha = 1
      ctx.filter = 'none'

      // --- ciel : soleil, lune, étoiles, nuages de fond (masqués par le décor)
      const sc = this.sky.getContext('2d')
      sc.setTransform(1, 0, 0, 1, 0, 0)
      sc.globalCompositeOperation = 'source-over'
      sc.clearRect(0, 0, W, H)
      drawStars(sc, W, H, wNight * (env.stars ?? 1), t)
      const [sx, sy] = [env.sunX ?? D.def.sun[0], env.sunY ?? D.def.sun[1]]
      drawSun(sc, sx, sy + wSunset * 520, (env.sun ?? 1) * clamp(wDay + wSunset * 0.9), t)
      drawMoon(sc, env.moonX ?? D.def.moon[0], env.moonY ?? D.def.moon[1], wNight)
      drawSkyClouds(sc, W, (env.clouds ?? 1) * (1 - wNight * 0.6), t, env.wind ?? 0)
      sc.globalCompositeOperation = 'destination-in'
      sc.drawImage(D.skyMask, 0, 0)
      ctx.drawImage(this.sky, 0, 0)
    }

    // --- ombres de contact puis personnages (sur un calque, pour l'éclairage)
    const ground = D?.def.ground ?? 1330
    const actors = [...S.actors].sort((a, b) => zOf(a) - zOf(b))
    for (const a of actors) this.shadow(ctx, a, wDay + wSunset * 0.6)
    const L = this.layer.getContext('2d')
    L.setTransform(1, 0, 0, 1, 0, 0)
    L.globalCompositeOperation = 'source-over'
    L.clearRect(0, 0, W, H)
    applyCam(L)
    for (const a of actors) this.drawActor(L, a, t, ground, opts)
    // éclairage du moment : bleuté la nuit, doré au coucher
    L.setTransform(1, 0, 0, 1, 0, 0)
    L.globalCompositeOperation = 'source-atop'
    if (wSunset > 0.01) {
      L.fillStyle = `rgba(255,120,40,${0.16 * wSunset})`
      L.fillRect(0, 0, W, H)
    }
    if (wNight > 0.01) {
      L.fillStyle = `rgba(25,35,110,${0.42 * wNight})`
      L.fillRect(0, 0, W, H)
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(this.layer, 0, 0)

    // --- effets
    applyCam(ctx)
    for (const e of S.fx) drawFx(ctx, e, t)

    // --- météo (écran entier)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    drawRain(ctx, W, H, env.rain ?? 0, env.wind ?? 0, t)
    drawSnow(ctx, W, H, env.snow ?? 0, env.wind ?? 0, t)
    if ((env.rain ?? 0) > 0.01) {
      ctx.fillStyle = `rgba(60,80,120,${0.18 * env.rain})`
      ctx.fillRect(0, 0, W, H)
    }

    // --- vignette
    const v = env.vignette ?? 0.35
    if (v > 0) {
      const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, H * 0.75)
      g.addColorStop(0, 'rgba(20,0,30,0)')
      g.addColorStop(1, `rgba(20,0,30,${v})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }

    // --- transitions
    for (const tr of S.transitions) this.transition(ctx, tr, t)

    if (opts.safe) drawSafeZones(ctx)
    return S
  }

  shadow(ctx, a, k) {
    let x
    let y
    let w
    let lift
    if (a.type === 'minuton') {
      const b = a.body
      if (b.alpha <= 0) return
      x = b.x
      y = b.y
      w = BASE_R * b.scale * (1.5 + b.lie * 1.2)
      lift = b.lift
    } else if (a.type === 'image' && a.def.shadow !== false) {
      x = a.props.x
      y = a.props.y
      w = (a.def.shadowW ?? 200) * (a.props.scale ?? 1)
      lift = 0
    } else return
    const s = 1 / (1 + lift / 160)
    ctx.save()
    ctx.globalAlpha = 0.22 * k * s + 0.08
    ctx.fillStyle = '#2a1030'
    ctx.filter = 'blur(6px)'
    ctx.beginPath()
    ctx.ellipse(x + 10, y, (w / 2) * s, (w / 9) * s, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  drawActor(ctx, a, t, ground, opts) {
    if (a.type === 'minuton') return drawMinuton(ctx, a, this.rigs.minuton, opts)
    const p = a.props
    if ((p.alpha ?? 1) <= 0) return
    if (a.type === 'cloud') return drawCloud(ctx, { ground, ...p }, t)
    if (a.type === 'puddle') return drawPuddle(ctx, p, t)
    if (a.type === 'rainbow') return drawRainbow(ctx, p)
    if (a.type === 'image') {
      const I = this.images[a.def.img]
      return drawImageActor(ctx, p, I.img, I.def)
    }
  }

  transition(ctx, tr, t) {
    const d = tr.dur ?? 0.6
    const p = clamp((t - tr.t) / d)
    const type = tr.type ?? 'dip'
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = tr.color ?? '#000'
    if (type === 'fadeIn' || type === 'fadeOut' || type === 'dip') {
      const a = type === 'fadeIn' ? 1 - p : type === 'fadeOut' ? p : 1 - Math.abs(p * 2 - 1)
      ctx.globalAlpha = clamp(a)
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1
    } else if (type === 'iris' || type === 'irisIn' || type === 'irisOut') {
      // cercle qui se ferme (irisOut), s'ouvre (irisIn) ou les deux (iris)
      const k = type === 'irisOut' ? 1 - p : type === 'irisIn' ? p : Math.abs(p * 2 - 1)
      const r = k * Math.hypot(W, H) * 0.6
      ctx.beginPath()
      ctx.rect(0, 0, W, H)
      ctx.arc(tr.x ?? W / 2, tr.y ?? H / 2, Math.max(0.01, r), 0, Math.PI * 2, true)
      ctx.fill('evenodd')
    } else if (type === 'wipe') {
      const x = lerp(-W, W, p)
      ctx.fillRect(x, 0, W, H)
    }
  }
}

const zOf = (a) => (a.type === 'minuton' ? (a.body.z ?? 0) * 10000 + a.body.y : (a.props.z ?? 0) * 10000 + (a.props.y ?? 0))

/** Zones masquées par l'interface YouTube Shorts (titre, boutons) : repère pour cadrer. */
export function drawSafeZones(ctx) {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = 'rgba(255,0,80,0.18)'
  ctx.fillRect(0, H - 420, W, 420)
  ctx.fillRect(W - 150, H - 1100, 150, 680)
  ctx.fillRect(0, 0, W, 140)
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'
  ctx.setLineDash([12, 10])
  ctx.lineWidth = 3
  ctx.strokeRect(60, 140, W - 210, H - 560)
  ctx.restore()
}
