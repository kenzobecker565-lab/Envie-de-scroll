/**
 * Actions des personnages. Chaque action est une fonction pure :
 *   apply(start, u, ev) → état, où u est le temps écoulé depuis le début de l'action
 *   dur(ev, start)      → durée de l'action (s)
 * L'état de fin d'une action sert d'état de départ à la suivante sur le même canal.
 *
 * Canaux de Minuton :
 *   body  : position, déplacements, sauts, posture (assis, couché), écrasement
 *   arms  : gestes des bras (sinon les bras suivent la marche automatiquement)
 *   face  : expression, regard, bouche
 * Les autres personnages n'ont qu'un canal « props » (propriétés numériques libres).
 */
import { clamp, ease, getEase, lerp, mix, prog, smooth, spring } from './core.js'

// ------------------------------------------------------------------ expressions

/** Paramètres du visage (voir draw-minuton.js). Les valeurs manquantes prennent NEUTRAL. */
export const EXPRESSIONS = {
  neutral: {},
  joy: { smile: 1, mouthOpen: 0.35, browY: 0.03, cheek: 0.85, squint: 0.12 },
  laugh: { happy: 1, smile: 1, mouthOpen: 0.8, cheek: 1, browY: 0.04 },
  happyClosed: { happy: 1, smile: 1, mouthOpen: 0.15, cheek: 0.9 },
  surprise: { wide: 1.14, browY: 0.09, mouthOpen: 0.55, round: 1, smile: 0, mouthW: 0.4, pupil: 0.85 },
  curious: { browL: 0.08, browR: -0.01, smile: 0.35, mouthW: 0.38, wide: 1.04 },
  idea: { wide: 1.1, browY: 0.07, smile: 0.95, mouthOpen: 0.32, cheek: 0.8 },
  focus: { squint: 0.32, browY: -0.03, browTilt: -0.35, smile: 0.1, mouthW: 0.3 },
  disappointed: { open: 0.7, browTilt: 0.5, browY: -0.01, smile: -0.55, mouthW: 0.38 },
  worried: { browTilt: 0.75, browY: 0.04, smile: -0.35, mouthW: 0.32, wide: 1.04 },
  relief: { happy: 0.75, smile: 0.85, mouthOpen: 0.12, browTilt: 0.25, cheek: 0.8 },
  sleep: { open: 0, smile: 0.35, mouthW: 0.3, browY: -0.02, cheek: 0.75 },
  mischief: { squint: 0.42, smile: 0.95, browTilt: -0.45, mouthW: 0.45, browL: 0.04 },
  sad: { browTilt: 0.85, open: 0.85, smile: -0.85, mouthW: 0.35, browY: 0.0 },
  grumpy: { squint: 0.3, browTilt: -0.6, browY: -0.04, smile: -0.5, mouthW: 0.36 },
  determined: { squint: 0.2, browTilt: -0.4, smile: 0.4, mouthW: 0.42 },
}
export const NEUTRAL_FACE = {
  open: 1, happy: 0, wide: 1, squint: 0, pupil: 1,
  browY: 0, browTilt: 0, browL: 0, browR: 0,
  mouthW: 0.42, smile: 0.5, mouthOpen: 0, round: 0, cheek: 0.65,
  lookX: 0, lookY: 0,
}
export const expr = (name) => ({ ...NEUTRAL_FACE, ...(EXPRESSIONS[name] ?? {}) })

// ------------------------------------------------------------------ poses de bras

/** a = angle du bras depuis la verticale (vers l'extérieur), b = pliage du coude. En radians. */
export const ARM_POSES = {
  down: { aL: 0.35, bL: 0.15, aR: 0.35, bR: 0.15 },
  up: { aL: 2.6, bL: 0.1, aR: 2.6, bR: 0.1 },
  out: { aL: 1.5, bL: 0.1, aR: 1.5, bR: 0.1 },
  cheer: { aL: 2.35, bL: -0.3, aR: 2.35, bR: -0.3 },
  hips: { aL: 0.7, bL: 2.3, aR: 0.7, bR: 2.3 },
  think: { aL: 0.35, bL: 0.15, aR: 0.4, bR: 2.7 },
  shrug: { aL: 1.1, bL: -1.3, aR: 1.1, bR: -1.3 },
  hold: { aL: 0.55, bL: 1.6, aR: 0.55, bR: 1.6 },
  cover: { aL: 0.5, bL: 2.9, aR: 0.5, bR: 2.9 },
  reachUp: { aL: 0.35, bL: 0.15, aR: 2.9, bR: 0 },
  open: { aL: 1.0, bL: 0.2, aR: 1.0, bR: 0.2 },
}

// ------------------------------------------------------------------ état initial

export function initialBody(def) {
  return {
    x: def.x ?? 540, y: def.y ?? 1500, lift: 0, turn: def.turn ?? 0, lean: 0, rot: 0,
    sx: 1, sy: 1, phase: 0, amp: 0, style: 0, tuck: 0, sit: 0, lie: 0, armsUp: 0, shake: 0,
    scale: def.scale ?? 1, alpha: def.alpha ?? 1, z: def.z ?? 0,
  }
}
export const initialArms = () => ({ w: 0, ...ARM_POSES.down, flapL: 0, flapR: 0 })
export const initialFace = (def) => expr(def.expr ?? 'neutral')

// ------------------------------------------------------------------ corps

const STRIDE = { walk: 1.15, run: 1.6, tiptoe: 0.7, sneak: 0.8, skip: 1.4 } // longueur de pas (en R)
const GAIT_AMP = { walk: 1, run: 1.35, tiptoe: 0.55, sneak: 0.7, skip: 1.2 }

export const BODY = {
  /** Marcher ou courir jusqu'à x (et éventuellement y) : { to, y, speed | dur, style } */
  walk: {
    dur: (ev, s) => ev.dur ?? (Math.abs((ev.to ?? s.x) - s.x) / ((ev.speed ?? (ev.style === 'run' ? 520 : 230)) * s.scale) || 0.01),
    apply(s, u, ev, d) {
      const style = ev.style ?? 'walk'
      const dist = (ev.to ?? s.x) - s.x
      const dir = Math.sign(dist) || Math.sign(s.turn) || 1
      const R = 180 * s.scale
      const ramp = Math.min(0.25, d / 3)
      // vitesse en « trapèze » : démarre et s'arrête en douceur
      const p = d <= 0 ? 1 : trapezoid(u / d, ramp / d)
      const x = s.x + dist * p
      const y = ev.y !== undefined ? lerp(s.y, ev.y, p) : s.y
      const travelled = Math.abs(dist * p) + (ev.y !== undefined ? Math.abs(ev.y - s.y) * p : 0)
      const amp = GAIT_AMP[style] * Math.min(smooth(u / 0.15), smooth((d - u) / 0.15 + 0.001))
      const turnTo = ev.face ?? dir * (style === 'run' ? 0.7 : 0.6) // trois-quarts : visage lisible
      return {
        ...s,
        x, y,
        phase: s.phase + travelled / (STRIDE[style] * R),
        amp,
        style: style === 'run' ? 1 : style === 'tiptoe' ? 2 : style === 'sneak' ? 3 : style === 'skip' ? 4 : 0,
        turn: lerp(s.turn, turnTo, smooth(u / 0.2)),
        lean: lerp(s.lean, (style === 'run' ? 0.12 : style === 'sneak' ? 0.08 : 0.04) * dir * (u < d - 0.15 ? 1 : (d - u) / 0.15), smooth(u / 0.2)),
        lift: style === 'skip' ? Math.abs(Math.sin(Math.PI * (s.phase + travelled / (STRIDE[style] * R)) * 2)) * 0.35 * R * amp : s.lift,
        sit: 0, lie: 0,
      }
    },
  },
  /** Saut : { to, height, dur } */
  jump: {
    dur: (ev) => ev.dur ?? 0.9,
    apply(s, u, ev, d) {
      const R = 180 * s.scale
      const h = (ev.height ?? 1.4) * R
      const pre = 0.16
      const land = 0.18
      const air = Math.max(0.1, d - pre - land)
      const to = ev.to ?? s.x
      let lift = 0
      let sx = 1
      let sy = 1
      let tuck = 0
      let armsUp = 0
      let x = s.x
      if (u < pre) {
        const k = Math.sin((u / pre) * Math.PI * 0.5)
        sy = 1 - 0.16 * k
        sx = 1 + 0.1 * k
        armsUp = -0.3 * k
      } else if (u < pre + air) {
        const q = (u - pre) / air
        lift = h * 4 * q * (1 - q)
        x = lerp(s.x, to, ease.inOut(q))
        const st = Math.max(0, 1 - q * 2.5)
        sy = 1 + 0.14 * st
        sx = 1 - 0.07 * st
        tuck = Math.sin(q * Math.PI)
        armsUp = 1 - Math.abs(q - 0.4) * 0.6
      } else {
        x = to
        const k = Math.sin(clamp((u - pre - air) / land) * Math.PI)
        sy = 1 - 0.18 * k
        sx = 1 + 0.12 * k
        armsUp = 0.4 * (1 - clamp((u - pre - air) / land))
      }
      const dir = Math.sign(to - s.x)
      return { ...s, x, lift, sx, sy, tuck, armsUp, amp: 0, turn: dir ? lerp(s.turn, dir * 0.5, smooth(u / 0.2)) : s.turn }
    },
  },
  /** Petits sauts sur place : { n, height } */
  hop: {
    dur: (ev) => (ev.n ?? 1) * (ev.each ?? 0.38),
    apply(s, u, ev) {
      const each = ev.each ?? 0.38
      const R = 180 * s.scale
      const q = (u % each) / each
      const lift = (ev.height ?? 0.35) * R * Math.max(0, Math.sin(q * Math.PI))
      const squash = q < 0.12 || q > 0.9 ? 0.08 : -0.05
      return { ...s, lift, sy: 1 - squash, sx: 1 + squash * 0.6, tuck: lift / R, amp: 0 }
    },
  },
  /** Se tourner : { to } de -1 (gauche) à 1 (droite) */
  turn: { dur: (ev) => ev.dur ?? 0.3, apply: (s, u, ev, d) => ({ ...s, turn: lerp(s.turn, ev.to ?? 0, prog(u, 0, d)), amp: 0 }) },
  /** Déplacement libre (glisser, flotter, être emporté) : { x, y, lift, rot, scale, dur, ease } */
  move: {
    dur: (ev) => ev.dur ?? 1,
    apply(s, u, ev, d) {
      const p = prog(u, 0, d, ev.ease ?? 'inOut')
      const tgt = {}
      for (const k of ['x', 'y', 'lift', 'rot', 'scale', 'alpha', 'lean', 'turn', 'z']) if (ev[k] !== undefined) tgt[k] = ev[k]
      return { ...mix(s, tgt, p), amp: 0 }
    },
  },
  /** S'asseoir, se relever, s'allonger pour dormir : { dur } */
  sit: { dur: (ev) => ev.dur ?? 0.5, apply: (s, u, ev, d) => ({ ...s, sit: lerp(s.sit, 1, prog(u, 0, d)), lie: lerp(s.lie, 0, prog(u, 0, d)), amp: 0 }) },
  stand: { dur: (ev) => ev.dur ?? 0.45, apply: (s, u, ev, d) => ({ ...s, sit: lerp(s.sit, 0, prog(u, 0, d, 'back')), lie: lerp(s.lie, 0, prog(u, 0, d)), amp: 0 }) },
  lie: { dur: (ev) => ev.dur ?? 0.8, apply: (s, u, ev, d) => ({ ...s, lie: lerp(s.lie, ev.side ?? 1, prog(u, 0, d)), sit: lerp(s.sit, 0.6, prog(u, 0, d)), amp: 0 }) },
  /** Tremblement (froid, peur, colère) : { dur, amount } */
  shiver: { dur: (ev) => ev.dur ?? 0.8, apply: (s, u, ev, d) => ({ ...s, shake: (ev.amount ?? 1) * Math.sin(Math.PI * clamp(u / d)), amp: 0 }) },
  /** Écrasement / étirement ponctuel : { amount } (positif = s'écrase) */
  squash: {
    dur: (ev) => ev.dur ?? 0.5,
    apply(s, u, ev) {
      const k = (ev.amount ?? 0.2) * spring(u, 0, { freq: 16, damp: 7 }) * -1 + (ev.amount ?? 0.2) * Math.exp(-u * 18) * (u < 0.06 ? u / 0.06 : 1)
      return { ...s, sy: 1 - k, sx: 1 + k * 0.6 }
    },
  },
  /** Tour sur soi-même : { turns } */
  spin: {
    dur: (ev) => ev.dur ?? 0.8,
    apply(s, u, ev, d) {
      const a = prog(u, 0, d, 'inOut') * (ev.turns ?? 1) * Math.PI * 2
      return { ...s, turn: Math.sin(a) * 0.9, spin: Math.cos(a), amp: 0 }
    },
  },
}

function trapezoid(x, r) {
  // position (0→1) pour une vitesse en trapèze : accélération sur r, plateau, décélération sur r
  r = clamp(r, 0.001, 0.5)
  x = clamp(x)
  const vmax = 1 / (1 - r)
  if (x < r) return (vmax * x * x) / (2 * r)
  if (x > 1 - r) return 1 - (vmax * (1 - x) ** 2) / (2 * r)
  return (vmax * r) / 2 + vmax * (x - r)
}

// ------------------------------------------------------------------ bras

export const ARMS = {
  /** Pose de bras : { pose: 'up' | 'cheer' | 'hips' | ..., dur } ou angles libres aL, bL, aR, bR */
  arms: {
    dur: (ev) => ev.dur ?? 0.3,
    apply(s, u, ev, d) {
      const tgt = { ...(ARM_POSES[ev.pose] ?? {}), ...pick(ev, ['aL', 'bL', 'aR', 'bR']), w: 1 }
      return { ...mix(s, tgt, prog(u, 0, d, ev.ease ?? 'out3')), flapL: 0, flapR: 0 }
    },
  },
  /** Retour aux bras automatiques (balancement de marche) */
  auto: { dur: (ev) => ev.dur ?? 0.3, apply: (s, u, ev, d) => ({ ...s, w: lerp(s.w, 0, prog(u, 0, d)), flapL: 0, flapR: 0 }) },
  /** Saluer : { side: 'R' | 'L', n } */
  wave: {
    dur: (ev) => ev.dur ?? 0.3 + (ev.n ?? 3) * 0.32,
    apply(s, u, ev, d) {
      const side = ev.side ?? 'R'
      const up = prog(u, 0, 0.25, 'out3') * (1 - prog(u, d - 0.2, 0.2))
      const osc = Math.sin(((u - 0.25) / 0.32) * Math.PI * 2) * 0.45 * (u > 0.25 ? 1 : 0)
      const o = { ...s, w: Math.max(s.w, up) }
      o[`a${side}`] = lerp(s[`a${side}`], 2.5, up)
      o[`b${side}`] = lerp(s[`b${side}`], 0.5 + osc, up)
      if (s.w < 0.5) {
        const other = side === 'R' ? 'L' : 'R'
        o[`a${other}`] = ARM_POSES.down[`a${other}`]
        o[`b${other}`] = ARM_POSES.down[`b${other}`]
      }
      return o
    },
  },
  /** Bras en l'air qui sautillent de joie : { dur } */
  cheer: {
    dur: (ev) => ev.dur ?? 1.2,
    apply(s, u, ev, d) {
      const k = prog(u, 0, 0.2, 'out3') * (1 - prog(u, d - 0.25, 0.25))
      const b = Math.sin(u * 14) * 0.25
      return { ...mix(s, { ...ARM_POSES.cheer, w: 1 }, k), bL: lerp(s.bL, -0.3 + b, k), bR: lerp(s.bR, -0.3 - b, k) }
    },
  },
  /** Battre des bras (panique, envol) : { dur } */
  flap: {
    dur: (ev) => ev.dur ?? 1,
    apply(s, u, ev, d) {
      const k = prog(u, 0, 0.15) * (1 - prog(u, d - 0.15, 0.15))
      const f = Math.sin(u * 22) * 0.6
      return { ...s, w: Math.max(s.w, k), aL: lerp(s.aL, 1.6 + f, k), aR: lerp(s.aR, 1.6 + f, k), bL: lerp(s.bL, 0.2, k), bR: lerp(s.bR, 0.2, k) }
    },
  },
  /** Montrer du doigt : { side, angle } */
  point: {
    dur: (ev) => ev.dur ?? 0.3,
    apply(s, u, ev, d) {
      const side = ev.side ?? 'R'
      const o = { ...s, w: 1 }
      o[`a${side}`] = lerp(s[`a${side}`], ev.angle ?? 1.7, prog(u, 0, d, 'back'))
      o[`b${side}`] = lerp(s[`b${side}`], 0, prog(u, 0, d))
      return o
    },
  },
}

// ------------------------------------------------------------------ visage

export const FACE = {
  /** Expression : { name, dur } (+ réglages fins facultatifs) */
  expr: {
    dur: (ev) => ev.dur ?? 0.22,
    apply(s, u, ev, d) {
      const tgt = { ...expr(ev.name ?? 'neutral'), ...pick(ev, Object.keys(NEUTRAL_FACE)) }
      delete tgt.lookX
      delete tgt.lookY
      return mix(s, tgt, prog(u, 0, d, 'out'))
    },
  },
  /** Regard : { x, y } de -1 à 1 */
  look: { dur: (ev) => ev.dur ?? 0.18, apply: (s, u, ev, d) => ({ ...mix(s, { lookX: ev.x ?? 0, lookY: ev.y ?? 0 }, prog(u, 0, d, 'out')), lookW: lerp(s.lookW ?? 0, 0, prog(u, 0, d)) }) },
  /** Suivre du regard un autre personnage ou un point : { target: 'nuage' | { x, y } } */
  lookAt: { dur: (ev) => ev.dur ?? 0.2, apply: (s, u, ev, d) => ({ ...s, lookTarget: ev.target, lookW: lerp(s.lookW ?? 0, 1, prog(u, 0, d, 'out')) }) },
  /** Parler sans mots (bouche qui bouge, pour un « babil » ou une chanson) : { dur } */
  babble: {
    dur: (ev) => ev.dur ?? 1,
    apply(s, u, ev, d) {
      const k = prog(u, 0, 0.1) * (1 - prog(u, d - 0.1, 0.1))
      const o = Math.max(0, Math.sin(u * 17) * 0.5 + Math.sin(u * 7.3) * 0.3)
      return { ...s, mouthOpen: lerp(s.mouthOpen, o, k), round: lerp(s.round, Math.max(0, Math.sin(u * 5)) * 0.5, k) }
    },
  },
}

// ------------------------------------------------------------------ autres personnages

export const PROPS = {
  /** Change n'importe quelle propriété numérique : { x: 300, rain: 1, dur, ease } */
  set: {
    dur: (ev) => ev.dur ?? 0,
    apply(s, u, ev, d) {
      const tgt = {}
      for (const k in ev) if (!['t', 'a', 'do', 'dur', 'ease'].includes(k)) tgt[k] = ev[k]
      return mix(s, tgt, prog(u, 0, d, ev.ease ?? 'inOut'))
    },
  },
}
PROPS.move = PROPS.set

function pick(o, keys) {
  const r = {}
  for (const k of keys) if (o[k] !== undefined) r[k] = o[k]
  return r
}

export const CHANNEL_OF = {}
for (const k in BODY) CHANNEL_OF[k] = 'body'
for (const k in ARMS) CHANNEL_OF[k] = 'arms'
for (const k in FACE) CHANNEL_OF[k] = 'face'
export const ACTIONS = { body: BODY, arms: ARMS, face: FACE, props: PROPS }
