/**
 * Noyau du moteur : courbes, interpolations, hasard reproductible.
 * Aucune dépendance au navigateur : ce module tourne aussi dans Node (bande son).
 */

const c1 = 1.70158

export const ease = {
  linear: (p) => p,
  in: (p) => p * p,
  out: (p) => 1 - (1 - p) * (1 - p),
  inOut: (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2),
  in3: (p) => p ** 3,
  out3: (p) => 1 - (1 - p) ** 3,
  inOut3: (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2),
  sine: (p) => -(Math.cos(Math.PI * p) - 1) / 2,
  back: (p) => 1 + (c1 + 1) * (p - 1) ** 3 + c1 * (p - 1) ** 2,
  backIn: (p) => (c1 + 1) * p ** 3 - c1 * p ** 2,
  elastic: (p) => (p === 0 || p === 1 ? p : 2 ** (-10 * p) * Math.sin(((p - 0.35 / 4) * (2 * Math.PI)) / 0.35) + 1),
  bounce: (p) => {
    const n = 7.5625
    const d = 2.75
    if (p < 1 / d) return n * p * p
    if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375
    return n * (p -= 2.625 / d) * p + 0.984375
  },
  step: (p) => (p < 1 ? 0 : 1),
}

export const getEase = (e) => (typeof e === 'function' ? e : ease[e ?? 'inOut'] ?? ease.inOut)

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a, b, p) => a + (b - a) * p
export const smooth = (x) => {
  x = clamp(x)
  return x * x * (3 - 2 * x)
}
/** Progression 0 → 1 de t entre t0 et t0 + dur, passée dans une courbe. */
export const prog = (t, t0, dur, e = 'inOut') => (dur <= 0 ? (t >= t0 ? 1 : 0) : getEase(e)(clamp((t - t0) / dur)))

/** Interpole deux objets de nombres (les clés absentes de b gardent la valeur de a). */
export function mix(a, b, p) {
  const out = { ...a }
  for (const k in b) {
    const va = a[k]
    const vb = b[k]
    if (typeof vb === 'number' && typeof va === 'number') out[k] = lerp(va, vb, p)
    else if (p >= 0.5 || va === undefined) out[k] = vb
  }
  return out
}

/** Hasard reproductible (mulberry32). */
export function rng(seed) {
  let a = (seed * 2654435761) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Petit bruit continu 1D (somme de sinus), pour les mouvements vivants. */
export const wobble = (t, seed = 0) =>
  (Math.sin(t * 1.7 + seed * 12.9) + Math.sin(t * 2.9 + seed * 4.1) * 0.6 + Math.sin(t * 5.3 + seed * 7.7) * 0.25) / 1.85

/** Ressort amorti déclenché à t0 (renvoie 0 avant), pour les rebonds. */
export const spring = (t, t0, { freq = 9, damp = 5 } = {}) =>
  t < t0 ? 0 : Math.exp(-(t - t0) * damp) * Math.sin((t - t0) * freq)

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}
