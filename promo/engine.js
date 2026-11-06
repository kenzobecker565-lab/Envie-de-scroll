/**
 * ============================================================================
 *  Mini-moteur d'animation déterministe
 * ============================================================================
 * Chaque propriété animée d'un élément est une suite de segments
 * (début, durée, valeur de départ, valeur d'arrivée, courbe d'accélération).
 * Pour un instant t, on recalcule TOUT à partir de zéro : on peut se placer
 * sur n'importe quelle image, dans n'importe quel ordre, et obtenir toujours
 * exactement la même image. C'est ce qui permet le rendu image par image.
 *
 *   tw(el, 1.2, 0.4, { x: [0, 300], opacity: [0, 1] }, ease.back(1.6))
 *   set(el, 2.0, { opacity: 0 })
 *   onFrame((t) => { ... })   // animation procédurale (fonction pure de t)
 */

// ---------------------------------------------------------------- easings

const c1 = 1.70158

export const ease = {
  linear: (p) => p,
  in2: (p) => p * p,
  out2: (p) => 1 - (1 - p) * (1 - p),
  io2: (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
  in3: (p) => p ** 3,
  out3: (p) => 1 - (1 - p) ** 3,
  io3: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  in4: (p) => p ** 4,
  out4: (p) => 1 - (1 - p) ** 4,
  io4: (p) => (p < 0.5 ? 8 * p ** 4 : 1 - (-2 * p + 2) ** 4 / 2),
  out5: (p) => 1 - (1 - p) ** 5,
  io5: (p) => (p < 0.5 ? 16 * p ** 5 : 1 - (-2 * p + 2) ** 5 / 2),
  expoIn: (p) => (p === 0 ? 0 : 2 ** (10 * p - 10)),
  expoOut: (p) => (p === 1 ? 1 : 1 - 2 ** (-10 * p)),
  expoIO: (p) =>
    p === 0 ? 0 : p === 1 ? 1 : p < 0.5 ? 2 ** (20 * p - 10) / 2 : (2 - 2 ** (-20 * p + 10)) / 2,
  sineIn: (p) => 1 - Math.cos((p * Math.PI) / 2),
  sineOut: (p) => Math.sin((p * Math.PI) / 2),
  sineIO: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  /** Dépasse la cible puis revient (s = amplitude du dépassement). */
  back: (s = c1) => (p) => 1 + (s + 1) * (p - 1) ** 3 + s * (p - 1) ** 2,
  backIn: (s = c1) => (p) => (s + 1) * p ** 3 - s * p ** 2,
  /** Ressort amorti. */
  elastic: (period = 0.35) => (p) =>
    p === 0 || p === 1 ? p : 2 ** (-10 * p) * Math.sin(((p - period / 4) * (2 * Math.PI)) / period) + 1,
}

// ------------------------------------------------------------ utilitaires

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, p) => a + (b - a) * p
/** Progression 0 → 1 de t entre t0 et t0 + dur, passée dans une courbe. */
export const prog = (t, t0, dur, easing = ease.linear) => easing(clamp((t - t0) / dur))

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ------------------------------------------ couleurs (mélange en OKLab)

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function parseColor(hex) {
  const h = hex.replace('#', '')
  const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255
  return [n(0), n(2), n(4), h.length >= 8 ? n(6) : 1]
}

function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)]
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => clamp(toSrgb(clamp(c))))
}

const colorCache = new Map()
function lab(hex) {
  let v = colorCache.get(hex)
  if (!v) {
    const rgba = parseColor(hex)
    v = [...rgbToOklab(rgba), rgba[3]]
    colorCache.set(hex, v)
  }
  return v
}

/** Mélange deux couleurs #RRGGBB(AA) ; renvoie une couleur CSS. */
export function mixColor(from, to, p) {
  const A = lab(from)
  const B = lab(to)
  const [r, g, b] = oklabToRgb([lerp(A[0], B[0], p), lerp(A[1], B[1], p), lerp(A[2], B[2], p)])
  const alpha = lerp(A[3], B[3], p)
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(3)})`
}

// ------------------------------------------------------------------ pistes

const DEFAULTS = {
  x: 0, y: 0, scale: 1, sx: 1, sy: 1, rot: 0, skx: 0, rx: 0, ry: 0,
  opacity: 1, blur: 0, bright: 1, gray: 0, sat: 1,
  d0: 0, d1: 1,
}
const TRANSFORM = new Set(['x', 'y', 'scale', 'sx', 'sy', 'rot', 'skx', 'rx', 'ry'])
const FILTER = new Set(['blur', 'bright', 'gray', 'sat'])
const CLIP = ['ciT', 'ciR', 'ciB', 'ciL', 'ciRad']

/** @type {Map<Element, Map<string, Array<{t0:number,dur:number,from:any,to:any,ease:Function}>>>} */
const tracks = new Map()

const toArray = (targets) =>
  targets == null ? [] : typeof targets === 'string' ? [...document.querySelectorAll(targets)] : targets instanceof Element ? [targets] : [...targets]

export function tw(targets, t0, dur, props, easing = ease.out3) {
  for (const el of toArray(targets)) {
    let byProp = tracks.get(el)
    if (!byProp) tracks.set(el, (byProp = new Map()))
    for (const [prop, value] of Object.entries(props)) {
      const [from, to] = Array.isArray(value) ? value : [undefined, value]
      if (!byProp.has(prop)) byProp.set(prop, [])
      byProp.get(prop).push({ t0, dur, from, to, ease: easing })
    }
  }
}

export const set = (targets, t, props) => tw(targets, t, 0, props, ease.linear)

export function stagger(targets, t0, each, dur, props, easing) {
  toArray(targets).forEach((el, i) => tw(el, t0 + i * each, dur, props, easing))
}

/** À appeler une fois toutes les pistes déclarées : complète les valeurs de départ. */
export function finalize() {
  for (const byProp of tracks.values()) {
    for (const [prop, segs] of byProp) {
      segs.sort((a, b) => a.t0 - b.t0)
      let previous = DEFAULTS[prop]
      for (const seg of segs) {
        if (seg.from === undefined) seg.from = previous ?? seg.to
        previous = seg.to
      }
    }
  }
}

function valueAt(segs, t) {
  let seg = null
  for (const s of segs) {
    if (s.t0 <= t) seg = s
    else break
  }
  if (!seg) return segs[0].from
  if (seg.dur <= 0) return seg.to
  const p = seg.ease(clamp((t - seg.t0) / seg.dur))
  if (typeof seg.from === 'number') return seg.from + (seg.to - seg.from) * p
  if (typeof seg.from === 'string' && seg.from.startsWith('#')) return mixColor(seg.from, seg.to, p)
  return p < 1 ? seg.from : seg.to
}

const colorValue = (v) => v

function apply(el, values) {
  const style = el.style
  let transform = false
  let filter = false
  let clip = false
  let hidden = null // null : visibilité non gérée par cet élément
  for (const key in values) {
    if (TRANSFORM.has(key)) transform = true
    else if (FILTER.has(key)) filter = true
    else if (CLIP.includes(key)) clip = true
  }
  if (transform && el.dataset.pivot !== undefined) {
    // Élément SVG avec pivot explicite (coordonnées du dessin) : attribut transform.
    const v = (k) => values[k] ?? DEFAULTS[k]
    const [px, py] = el.dataset.pivot.split(/[ ,]+/).map(Number)
    const scale = v('scale')
    el.setAttribute(
      'transform',
      `translate(${v('x').toFixed(2)} ${v('y').toFixed(2)}) rotate(${v('rot').toFixed(3)} ${px} ${py}) ` +
        `translate(${px} ${py}) scale(${(scale * v('sx')).toFixed(4)} ${(scale * v('sy')).toFixed(4)}) translate(${-px} ${-py})`,
    )
  } else if (transform) {
    const v = (k) => values[k] ?? DEFAULTS[k]
    const scale = v('scale')
    let s = `translate(${v('x').toFixed(2)}px, ${v('y').toFixed(2)}px)`
    if (v('rx') || v('ry')) s = `perspective(1400px) ${s} rotateX(${v('rx')}deg) rotateY(${v('ry')}deg)`
    s += ` rotate(${v('rot').toFixed(3)}deg)`
    if (v('skx')) s += ` skewX(${v('skx')}deg)`
    s += ` scale(${(scale * v('sx')).toFixed(4)}, ${(scale * v('sy')).toFixed(4)})`
    style.transform = s
  }
  if (filter) {
    const parts = []
    if (values.blur > 0.01) parts.push(`blur(${values.blur.toFixed(2)}px)`)
    if (values.bright !== undefined && values.bright !== 1) parts.push(`brightness(${values.bright.toFixed(3)})`)
    if (values.gray > 0.001) parts.push(`grayscale(${values.gray.toFixed(3)})`)
    if (values.sat !== undefined && values.sat !== 1) parts.push(`saturate(${values.sat.toFixed(3)})`)
    style.filter = parts.join(' ') || 'none'
  }
  if (clip) {
    const c = (k) => (values[k] ?? 0).toFixed(2)
    style.clipPath = `inset(${c('ciT')}px ${c('ciR')}px ${c('ciB')}px ${c('ciL')}px round ${c('ciRad')}px)`
  }
  for (const key in values) {
    const value = values[key]
    switch (key) {
      case 'opacity':
        style.opacity = value.toFixed(4)
        hidden = (hidden ?? false) || value <= 0.001
        break
      case 'd0':
      case 'd1': {
        if (key === 'd1' && values.d0 !== undefined) break // traité avec d0
        el.__len ??= el.getTotalLength()
        const L = el.__len
        const d0 = values.d0 ?? 0
        const d1 = values.d1 ?? 1
        const seg = Math.max(0, d1 - d0) * L
        style.strokeDasharray = `${seg.toFixed(2)} ${(L * 2 + 10).toFixed(2)}`
        style.strokeDashoffset = (-d0 * L).toFixed(2)
        hidden = (hidden ?? false) || seg < 0.5
        break
      }
      case 'fill':
      case 'stroke':
        el.setAttribute(key, colorValue(value))
        break
      case 'bg':
        style.backgroundColor = colorValue(value)
        break
      case 'color':
        style.color = colorValue(value)
        break
      case 'w':
        style.width = `${value.toFixed(2)}px`
        break
      case 'h':
        style.height = `${value.toFixed(2)}px`
        break
      case 'left':
        style.left = `${value.toFixed(2)}px`
        break
      case 'top':
        style.top = `${value.toFixed(2)}px`
        break
      case 'radius':
        style.borderRadius = `${value.toFixed(2)}px`
        break
      case 'text':
        el.textContent = el.__fmt ? el.__fmt(value) : String(Math.round(value))
        break
      default:
        if (key.startsWith('attr:')) el.setAttribute(key.slice(5), typeof value === 'number' ? value.toFixed(3) : colorValue(value))
        else if (key.startsWith('--')) style.setProperty(key, typeof value === 'number' ? value.toFixed(4) : colorValue(value))
    }
  }
  if (hidden !== null) style.visibility = hidden ? 'hidden' : ''
}

export function evaluate(t) {
  for (const [el, byProp] of tracks) {
    const values = {}
    for (const [prop, segs] of byProp) values[prop] = valueAt(segs, t)
    apply(el, values)
  }
}

const frameHooks = []
/** Ajoute une animation procédurale : une fonction pure du temps t. */
export function onFrame(fn) {
  frameHooks.push(fn)
}

/** Affiche l'image de l'instant t (en secondes). */
export function seek(t) {
  evaluate(t)
  for (const fn of frameHooks) fn(t)
}
