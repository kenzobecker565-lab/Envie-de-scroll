/**
 * ============================================================================
 *  LE DÉCOR VIVANT
 * ============================================================================
 *
 * Derrière tous les écrans : trois grandes taches de couleur douces qui
 * dérivent lentement, de petites formes qui montent en ondulant, et un grain
 * de papier très léger. La couleur des taches change avec l'écran (calme,
 * chaud, doré…) et glisse d'une teinte à l'autre au lieu de sauter.
 *
 * Toutes les couleurs viennent du design system. Si le système demande de
 * réduire les animations, le décor reste immobile.
 */

import { useMemo } from 'react'
import { Sparkle } from './Sparkle.tsx'

export type DecorTone = 'calm' | 'warm' | 'good' | 'mixed'

const TONES: Record<DecorTone, [string, string, string]> = {
  calm: ['var(--accent-soft)', 'var(--surface-100)', 'var(--accent-soft)'],
  warm: ['var(--warm-soft)', 'var(--surface-100)', 'var(--warm-soft)'],
  good: ['var(--good-soft)', 'var(--warm-soft)', 'var(--surface-100)'],
  mixed: ['var(--accent-soft)', 'var(--warm-soft)', 'var(--good-soft)'],
}

const BLOBS = [
  { className: 'anim-drift-a', style: { top: '-30vmax', left: '-30vmax', width: '85vmax', height: '85vmax' } },
  { className: 'anim-drift-b', style: { top: '18vh', right: '-40vmax', width: '80vmax', height: '80vmax' } },
  { className: 'anim-drift-c', style: { bottom: '-40vmax', left: '-15vmax', width: '90vmax', height: '90vmax' } },
] as const

/** Tache floue sans filtre coûteux : une couleur pleine, adoucie par un masque radial. */
const BLOB_MASK = 'radial-gradient(closest-side, #000 0%, rgba(0,0,0,0.55) 50%, transparent 100%)'

/** Grain de papier : du bruit SVG, utilisé comme masque sur une couche d'encre. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

type ParticleKind = 'dot' | 'ring' | 'plus' | 'spark'
const KINDS: ParticleKind[] = ['dot', 'ring', 'spark', 'plus', 'dot', 'spark', 'ring']
const COLORS = ['var(--accent)', 'var(--warm)', 'var(--good)']

/** Générateur déterministe : le décor est le même d'un écran à l'autre. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function Particle({ kind, color, size }: { kind: ParticleKind; color: string; size: number }) {
  if (kind === 'dot') return <span className="block rounded-pill" style={{ width: size * 0.6, height: size * 0.6, background: color }} />
  if (kind === 'ring') return <span className="block rounded-pill border-2" style={{ width: size, height: size, borderColor: color }} />
  if (kind === 'spark') return <Sparkle size={size * 1.3} color={color} />
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden="true">
      <path d="M5 1v8M1 5h8" style={{ stroke: color, strokeWidth: 2, strokeLinecap: 'round' }} />
    </svg>
  )
}

export function Backdrop({ tone }: { tone: DecorTone }) {
  const colors = TONES[tone]
  const particles = useMemo(() => {
    const random = seeded(7)
    return Array.from({ length: 12 }, (_, index) => ({
      kind: KINDS[index % KINDS.length] as ParticleKind,
      color: COLORS[index % COLORS.length] as string,
      size: 6 + Math.round(random() * 6),
      left: `${Math.round(random() * 96)}%`,
      y: `${Math.round(random() * 92)}vh`,
      duration: `${26 + Math.round(random() * 22)}s`,
      delay: `${-Math.round(random() * 40)}s`,
      sway: `${4 + Math.round(random() * 4)}s`,
      opacity: 0.25 + random() * 0.2,
    }))
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {BLOBS.map((blob, index) => (
        <div
          key={index}
          className={`motion-loop absolute rounded-pill ${blob.className}`}
          style={{
            ...blob.style,
            backgroundColor: colors[index],
            transition: 'background-color 1.4s ease',
            WebkitMaskImage: BLOB_MASK,
            maskImage: BLOB_MASK,
          }}
        />
      ))}

      {particles.map((particle, index) => (
        <div
          key={index}
          className="motion-loop anim-rise absolute"
          style={
            {
              left: particle.left,
              top: particle.y,
              opacity: particle.opacity,
              '--y': particle.y,
              '--rise-duration': particle.duration,
              '--rise-delay': particle.delay,
            } as React.CSSProperties
          }
        >
          <div className="motion-loop anim-sway" style={{ '--sway-duration': particle.sway } as React.CSSProperties}>
            <Particle kind={particle.kind} color={particle.color} size={particle.size} />
          </div>
        </div>
      ))}

      {/* Grain de papier, très léger. */}
      <div
        className="absolute inset-0 bg-ink opacity-[0.045]"
        style={{ WebkitMaskImage: GRAIN, maskImage: GRAIN, WebkitMaskSize: '180px', maskSize: '180px' }}
      />
    </div>
  )
}
