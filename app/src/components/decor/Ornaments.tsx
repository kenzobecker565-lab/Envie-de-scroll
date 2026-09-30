/**
 * Ornements animés, utilisés ici et là dans les écrans.
 * Toutes les boucles portent `motion-loop` (arrêt si animations réduites).
 */

import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

/* ------------------------------- Moment du jour ----------------------------- */

export type DayPeriod = 'morning' | 'day' | 'dusk' | 'night'

export function dayPeriod(hour: number): DayPeriod {
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'dusk'
  return 'night'
}

/* ------------------------------ Cadran de temps ----------------------------- */

/**
 * Un petit cadran en sticker : l'arc tomate se remplit jusqu'à la durée
 * (5, 15 ou 30 min sur 60) ; une fois choisi, le cadran devient soleil.
 */
export function TimeDial({ minutes, active, delay = 0 }: { minutes: number; active: boolean; delay?: number }) {
  return (
    <span className="relative flex h-20 w-20 shrink-0 items-center justify-center">
      <svg viewBox="0 0 80 80" className="absolute inset-0" aria-hidden="true">
        <circle
          cx="40"
          cy="40"
          r="37"
          className="motion-loop anim-spin-slow"
          style={
            {
              fill: 'none',
              stroke: 'var(--ink-soft)',
              strokeWidth: 2,
              strokeDasharray: '2 5',
              strokeLinecap: 'round',
              transformBox: 'fill-box',
              transformOrigin: 'center',
              '--spin-duration': `${24 + minutes}s`,
            } as React.CSSProperties
          }
        />
        <circle cx="40" cy="40" r="30" style={{ fill: active ? 'var(--warm)' : 'var(--surface-200)', stroke: 'var(--outline)', strokeWidth: 2.5, transition: 'fill 0.3s' }} />
        <motion.circle
          cx="40"
          cy="40"
          r="24"
          transform="rotate(-90 40 40)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: minutes / 60 }}
          transition={{ delay: 0.25 + delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 6, strokeLinecap: 'round' }}
        />
      </svg>
      <span className={cn('relative flex flex-col items-center leading-none transition-colors duration-300', active ? 'text-on-color' : 'text-ink')}>
        <span className="font-numbers text-21 font-extrabold">{minutes}</span>
        <span className="font-numbers text-mono-xs font-bold">min</span>
      </span>
    </span>
  )
}

/* ------------------------- Trait dessiné à la main -------------------------- */

/** Soulignement tracé à la main, qui se dessine à l'apparition. */
export function Underline({ className, delay = 0.5, color = 'var(--warm)' }: { className?: string; delay?: number; color?: string }) {
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" aria-hidden="true" className={cn('pointer-events-none absolute', className)}>
      <motion.path
        d="M4 10 C 40 3, 80 14, 120 7 S 180 5, 196 9"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        style={{ fill: 'none', stroke: color, strokeWidth: 4, strokeLinecap: 'round' }}
      />
    </svg>
  )
}

/* --------------------------- Glyphe du gros bouton --------------------------- */

/** Un petit téléphone dont le fil défile sans fin : l'envie de scroller, en image. */
export function ScrollPhone({ className }: { className?: string }) {
  return (
    <svg width="26" height="40" viewBox="0 0 26 40" aria-hidden="true" className={className}>
      <defs>
        <clipPath id="scroll-phone-screen">
          <rect x="4" y="5" width="18" height="30" rx="2" />
        </clipPath>
      </defs>
      <rect x="1.5" y="1.5" width="23" height="37" rx="6" style={{ fill: 'none', stroke: 'var(--accent-ink)', strokeWidth: 2 }} />
      <g clipPath="url(#scroll-phone-screen)">
        <g className="motion-loop anim-feed">
          {Array.from({ length: 9 }, (_, index) => (
            <rect
              key={index}
              x="6"
              y={7 + index * 6}
              width={index % 2 ? 9 : 14}
              height="3"
              rx="1.5"
              style={{ fill: 'var(--accent-ink)', opacity: index % 3 === 0 ? 0.95 : 0.55 }}
            />
          ))}
        </g>
      </g>
    </svg>
  )
}

/* ---------------------------- Rayons de fête ------------------------------ */

/** Rayons qui tournent derrière la pièce, à la confirmation. */
export function Rays({ className }: { className?: string }) {
  const mask = 'radial-gradient(closest-side, #000 25%, transparent 100%)'
  return (
    <div
      aria-hidden="true"
      className={cn('motion-loop anim-spin-slow pointer-events-none rounded-pill', className)}
      style={
        {
          background: 'repeating-conic-gradient(var(--warm) 0deg 9deg, transparent 9deg 22.5deg)',
          WebkitMaskImage: mask,
          maskImage: mask,
          '--spin-duration': '36s',
        } as React.CSSProperties
      }
    />
  )
}
