/**
 * Timeline : transforme un épisode (liste d'événements) en un état du monde pour
 * n'importe quel instant t. Fonction pure de t, sans navigateur : on peut sauter à
 * n'importe quelle image, dans n'importe quel ordre (rendu parallèle, éditeur, audio).
 */
import { ACTIONS, CHANNEL_OF, initialArms, initialBody, initialFace } from './actions.js'
import { clamp, getEase, lerp, prog, rng, smooth } from './core.js'

export const TIMES = { day: 0, sunset: 1, night: 2 }

const DEFAULT_ENV = { time: 0, rain: 0, snow: 0, wind: 0, sun: 1, vignette: 0.35, warmth: 0, blur: 0, stars: 1, clouds: 1 }

function compileChannel(events, start, table) {
  const out = []
  let s = start
  let last = null
  for (const ev of events) {
    // état réel au début de cet événement = l'événement précédent évalué à ev.t
    if (last) s = last.apply(last.start, Math.min(ev.t - last.t, last.dur), last.ev, last.dur)
    const act = table[ev.do]
    const dur = act.dur(ev, s)
    last = { t: ev.t, dur, ev, start: s, apply: act.apply }
    out.push(last)
  }
  return { start, events: out }
}

function evalChannel(ch, t) {
  let e = null
  for (const x of ch.events) {
    if (x.t <= t) e = x
    else break
  }
  if (!e) return ch.start
  return e.apply(e.start, Math.min(t - e.t, e.dur), e.ev, e.dur)
}

export function compile(ep) {
  const events = (ep.track ?? []).map((e, i) => ({ ...e, _i: i })).sort((a, b) => a.t - b.t || a._i - b._i)
  const actors = {}
  for (const [id, def] of Object.entries(ep.cast ?? {})) {
    const mine = events.filter((e) => e.a === id)
    if (def.type === 'minuton') {
      const by = (c) => mine.filter((e) => (CHANNEL_OF[e.do] ?? 'props') === c)
      actors[id] = {
        id, def, type: 'minuton',
        body: compileChannel(by('body'), initialBody(def), ACTIONS.body),
        arms: compileChannel(by('arms'), initialArms(), ACTIONS.arms),
        face: compileChannel(by('face'), initialFace(def), ACTIONS.face),
        blinkSeed: hash(id),
      }
    } else {
      const base = { x: 540, y: 1500, scale: 1, alpha: 1, rot: 0, z: 0, ...def }
      actors[id] = { id, def, type: def.type, props: compileChannel(mine.filter((e) => e.do === 'set' || e.do === 'move'), base, ACTIONS.props) }
    }
  }
  const envEvents = events.filter((e) => e.do === 'env').map((e) => ({ ...e, time: typeof e.time === 'string' ? TIMES[e.time] : e.time }))
  const camEvents = events.filter((e) => e.do === 'camera')
  return {
    ep,
    duration: ep.duration,
    actors,
    env: { start: { ...DEFAULT_ENV, ...normEnv(ep.env ?? {}) }, events: envEvents },
    camera: { start: { x: 540, y: 960, zoom: 1, rot: 0, follow: null, fw: 0, fy: 0, ...(ep.camera ?? {}) }, events: camEvents },
    shakes: events.filter((e) => e.do === 'shake'),
    fx: events.filter((e) => e.do === 'fx'),
    transitions: events.filter((e) => e.do === 'transition'),
    decors: [{ t: -1, id: ep.decor }, ...events.filter((e) => e.do === 'decor')],
  }
}

function normEnv(e) {
  return { ...e, time: typeof e.time === 'string' ? TIMES[e.time] : e.time ?? 0 }
}

/** Interpolation par segments : chaque événement part de la valeur atteinte au moment où il commence. */
function evalKeyed(start, events, t, keys) {
  let s = { ...start }
  for (const ev of events) {
    if (ev.t > t) break
    const dur = ev.dur ?? 0
    const next = events.find((e) => e.t > ev.t)
    const until = next ? Math.min(t, next.t) : t
    const p = prog(until, ev.t, dur, ev.ease ?? 'inOut')
    const tgt = {}
    for (const k of keys) if (ev[k] !== undefined) tgt[k] = ev[k]
    for (const k in tgt) {
      if (typeof tgt[k] === 'number' && typeof s[k] === 'number') s[k] = lerp(s[k], tgt[k], p)
      else s[k] = tgt[k]
    }
  }
  return s
}

const hash = (str) => [...str].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

/** Clignements automatiques : toutes les 2,5 à 4,5 s, 0,16 s chacun. */
function autoBlink(t, seed) {
  const r = rng(seed)
  let at = 0.8 + r() * 2
  while (at < t + 1) {
    const d = t - at
    if (d >= 0 && d < 0.16) return Math.sin((d / 0.16) * Math.PI)
    at += 2.5 + r() * 2
    if (r() < 0.2) at -= 2.2 // double clignement de temps en temps
  }
  return 0
}

/** État complet du monde à l'instant t. */
export function evaluate(C, t) {
  const env = evalKeyed(C.env.start, C.env.events, t, Object.keys(DEFAULT_ENV))
  const actors = []
  for (const A of Object.values(C.actors)) {
    if (A.type === 'minuton') {
      const body = evalChannel(A.body, t)
      const arms = evalChannel(A.arms, t)
      const face = { ...evalChannel(A.face, t) }
      const blink = face.open > 0.3 && face.happy < 0.5 ? autoBlink(t, A.blinkSeed) : 0
      face.open = face.open * (1 - blink)
      actors.push({ id: A.id, type: 'minuton', def: A.def, body, arms, face, t })
    } else {
      actors.push({ id: A.id, type: A.type, def: A.def, props: evalChannel(A.props, t), t })
    }
  }
  const byId = Object.fromEntries(actors.map((a) => [a.id, a]))
  // objets accrochés à un personnage (sur la tête, dans la main…) : { attach: 'minuton', attachW: 0 … 1, ax, ay }
  for (const a of actors) {
    const p = a.props
    if (!p || !p.attach || !(p.attachW > 0) || !byId[p.attach]) continue
    const tg = byId[p.attach]
    const tx = tg.type === 'minuton' ? tg.body.x : tg.props.x
    const ty = tg.type === 'minuton' ? tg.body.y - tg.body.lift - 481 * tg.body.scale * tg.body.sy : tg.props.y
    p.x = lerp(p.x, tx + (p.ax ?? 0), p.attachW)
    p.y = lerp(p.y, ty + (p.ay ?? 0), p.attachW)
  }
  // regard vers une cible (autre personnage ou point)
  for (const a of actors) {
    if (a.type !== 'minuton' || !a.face.lookTarget || !(a.face.lookW > 0)) continue
    const tg = typeof a.face.lookTarget === 'string' ? byId[a.face.lookTarget] : null
    const p = tg ? (tg.type === 'minuton' ? { x: tg.body.x, y: tg.body.y - 240 * tg.body.scale - tg.body.lift } : { x: tg.props.x, y: tg.props.y }) : a.face.lookTarget
    if (!p) continue
    const ex = a.body.x
    const ey = a.body.y - a.body.lift - 230 * a.body.scale
    const dx = p.x - ex
    const dy = p.y - ey
    const n = Math.hypot(dx, dy) || 1
    a.face.lookX = lerp(a.face.lookX, dx / n, a.face.lookW)
    a.face.lookY = lerp(a.face.lookY, dy / n, a.face.lookW)
  }

  // caméra (+ suivi d'un personnage, + secousses)
  const cam = evalKeyed(C.camera.start, C.camera.events, t, ['x', 'y', 'zoom', 'rot', 'follow', 'fw', 'fy', 'fx'])
  if (cam.follow && cam.fw > 0 && byId[cam.follow]) {
    const f = byId[cam.follow]
    const fxp = f.type === 'minuton' ? f.body.x : f.props.x
    const fyp = f.type === 'minuton' ? f.body.y - f.body.lift - 200 * f.body.scale : f.props.y
    cam.x = lerp(cam.x, fxp + (cam.fx ?? 0), cam.fw)
    cam.y = lerp(cam.y, fyp + (cam.fy ?? 0), cam.fw * (cam.fy !== undefined ? 1 : 0))
  }
  let sx = 0
  let sy = 0
  let sr = 0
  for (const sh of C.shakes) {
    const d = t - sh.t
    const dur = sh.dur ?? 0.4
    if (d < 0 || d > dur) continue
    const k = (sh.amp ?? 14) * (1 - d / dur) ** 2
    const f = sh.freq ?? 28
    sx += Math.sin(d * f * 6.28) * k
    sy += Math.cos(d * f * 5.1) * k * 0.8
    sr += Math.sin(d * f * 3.7) * k * 0.0015
  }
  cam.x += sx
  cam.y += sy
  cam.rot += sr

  const decor = [...C.decors].reverse().find((d) => d.t <= t)?.id
  const fx = C.fx.filter((e) => t >= e.t && t < e.t + (e.life ?? 2.5))
  const transitions = C.transitions.filter((e) => t >= e.t && t <= e.t + (e.dur ?? 0.6))
  return { t, env, actors, camera: cam, decor, fx, transitions }
}

/**
 * Repère les événements sonores automatiques (pas, décollages, atterrissages),
 * en échantillonnant les personnages. Sert à la bande son.
 */
export function analyze(C, rate = 240) {
  const cues = []
  const prev = {}
  for (let i = 0; i <= C.duration * rate; i++) {
    const t = i / rate
    for (const A of Object.values(C.actors)) {
      if (A.type !== 'minuton') continue
      const b = evalChannel(A.body, t)
      const p = prev[A.id]
      if (p) {
        if (b.amp > 0.25 && b.lift < 5 && Math.floor(b.phase * 2) !== Math.floor(p.phase * 2))
          cues.push({ t, kind: 'step', who: A.id, x: b.x, run: b.style === 1, soft: b.style === 2 || b.style === 3 })
        if (p.lift < 3 && b.lift >= 3) cues.push({ t, kind: 'takeoff', who: A.id, x: b.x })
        if (p.lift >= 3 && b.lift < 3) cues.push({ t, kind: 'land', who: A.id, x: b.x, h: p.maxLift })
        b.maxLift = b.lift > 3 ? Math.max(p.maxLift ?? 0, b.lift) : 0
      }
      prev[A.id] = b
    }
  }
  return cues
}

export { clamp, smooth, getEase }
