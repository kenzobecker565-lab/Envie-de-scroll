/**
 * ============================================================================
 *  LE DÉCOR VIVANT
 * ============================================================================
 *
 * Derrière tous les écrans, sur le fond uni : de petits stickers (pastilles,
 * étoiles, gribouillis) cernés d'encre, qui montent lentement en se
 * balançant, et un grain d'impression très léger. Leurs couleurs suivent
 * l'écran : calme (ciel, lilas), chaud (tomate, soleil), fête (menthe).
 *
 * Toutes les couleurs viennent du design system. Si le système demande de
 * réduire les animations, le décor reste immobile.
 */

import { useMemo } from 'react'

export type DecorTone = 'calm' | 'warm' | 'good' | 'mixed'

const TONES: Record<DecorTone, string[]> = {
  calm: ['var(--sky)', 'var(--lilac)', 'var(--good)'],
  warm: ['var(--accent)', 'var(--warm)', 'var(--lilac)'],
  good: ['var(--good)', 'var(--warm)', 'var(--sky)'],
  mixed: ['var(--accent)', 'var(--sky)', 'var(--warm)', 'var(--good)', 'var(--lilac)'],
}

/** Grain d'impression : du bruit SVG, utilisé comme masque sur une couche d'encre. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

type ShapeKind = 'dot' | 'star' | 'squiggle' | 'plus'
const KINDS: ShapeKind[] = ['dot', 'star', 'squiggle', 'dot', 'plus', 'star']

/** Générateur déterministe : le décor est le même d'un écran à l'autre. */
function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const OUTLINE = { stroke: 'var(--outline)', strokeWidth: 2, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

function Shape({ kind, color, size }: { kind: ShapeKind; color: string; size: number }) {
  if (kind === 'dot')
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" style={{ fill: color, transition: 'fill 1.2s ease', ...OUTLINE }} />
      </svg>
    )
  if (kind === 'star')
    return (
      <svg width={size * 1.3} height={size * 1.3} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2 C13 8 16 11 22 12 C16 13 13 16 12 22 C11 16 8 13 2 12 C8 11 11 8 12 2 Z" style={{ fill: color, transition: 'fill 1.2s ease', ...OUTLINE }} />
      </svg>
    )
  if (kind === 'squiggle')
    return (
      <svg width={size * 1.8} height={size} viewBox="0 0 36 20" aria-hidden="true">
        <path d="M3 12 C 8 2, 12 2, 14 10 S 22 18, 25 10 S 31 2, 33 8" style={{ fill: 'none', ...OUTLINE, strokeWidth: 3 }} />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 3v14M3 10h14" style={{ fill: 'none', ...OUTLINE, strokeWidth: 3 }} />
    </svg>
  )
}

export function Backdrop({ tone }: { tone: DecorTone }) {
  const colors = TONES[tone]
  const shapes = useMemo(() => {
    const random = seeded(7)
    return Array.from({ length: 8 }, (_, index) => {
      // À cheval sur le bord de l'écran, pour ne pas passer sous le texte.
      const offset = Math.round(random() * 8)
      return {
        kind: KINDS[index % KINDS.length] as ShapeKind,
        size: 10 + Math.round(random() * 8),
        left: index % 2 === 0 ? `${offset - 10}px` : `calc(100% - ${offset + 12}px)`,
        y: `${Math.round(random() * 92)}vh`,
        duration: `${34 + Math.round(random() * 24)}s`,
        delay: `${-Math.round(random() * 50)}s`,
        sway: `${5 + Math.round(random() * 4)}s`,
      }
    })
  }, [])

  return (
    <div aria-hidden="true" className="da-backdrop pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="da-backdrop-scene" /><div className="da-backdrop-light" />
      {shapes.map((shape, index) => (
        <div
          key={index}
          className="motion-loop anim-rise absolute"
          style={
            {
              left: shape.left,
              top: shape.y,
              '--y': shape.y,
              '--rise-duration': shape.duration,
              '--rise-delay': shape.delay,
            } as React.CSSProperties
          }
        >
          <div className="motion-loop anim-sway" style={{ '--sway-duration': shape.sway } as React.CSSProperties}>
            <Shape kind={shape.kind} color={colors[index % colors.length] as string} size={shape.size} />
          </div>
        </div>
      ))}

      {/* Grain d'impression, très léger. */}
      <div
        className="absolute inset-0 bg-ink opacity-[0.04]"
        style={{ WebkitMaskImage: GRAIN, maskImage: GRAIN, WebkitMaskSize: '180px', maskSize: '180px' }}
      />
    </div>
  )
}
