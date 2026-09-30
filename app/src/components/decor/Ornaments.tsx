/**
 * Ornements animés, utilisés ici et là dans les écrans.
 * Toutes les boucles portent `motion-loop` (arrêt si animations réduites).
 */

import { motion } from 'motion/react'
import { cn } from '../../lib/cn.ts'
import { Sparkle } from './Sparkle.tsx'

/* ---------------------------------- Ciel ----------------------------------- */

export type DayPeriod = 'morning' | 'day' | 'dusk' | 'night'

export function dayPeriod(hour: number): DayPeriod {
  if (hour >= 6 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 18) return 'day'
  if (hour >= 18 && hour < 21) return 'dusk'
  return 'night'
}

function Cloud({ className, style, scale = 1 }: { className?: string; style?: React.CSSProperties; scale?: number }) {
  return (
    <svg width={96 * scale} height={40 * scale} viewBox="0 0 96 40" aria-hidden="true" className={className} style={style}>
      <path
        d="M14 38 C4 38 2 26 12 23 C10 12 24 7 32 14 C36 3 56 0 62 12 C70 6 84 10 82 22 C94 22 96 38 84 38 Z"
        style={{ fill: 'var(--surface-200)', opacity: 0.85 }}
      />
    </svg>
  )
}

/** Le ciel de l'accueil : soleil (matin, journée, soir) ou lune et étoiles (nuit), nuages qui passent. */
export function Sky({ period }: { period: DayPeriod }) {
  const night = period === 'night'
  const low = period === 'dusk' || period === 'morning'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden">
      {night ? (
        <>
          <div className="motion-loop anim-float absolute top-[220px] right-10" style={{ '--float-duration': '9s' } as React.CSSProperties}>
            <svg width="54" height="54" viewBox="0 0 54 54">
              <defs>
                <mask id="moon-crescent">
                  <rect width="54" height="54" fill="white" />
                  <circle cx="36" cy="18" r="19" fill="black" />
                </mask>
              </defs>
              <circle cx="27" cy="27" r="22" mask="url(#moon-crescent)" style={{ fill: 'var(--warm)' }} />
            </svg>
          </div>
          {[
            { top: '214px', left: '14%', size: 10, delay: '0s' },
            { top: '262px', left: '36%', size: 7, delay: '-1.2s' },
            { top: '226px', left: '58%', size: 12, delay: '-0.6s' },
            { top: '300px', left: '72%', size: 8, delay: '-2s' },
            { top: '318px', left: '22%', size: 7, delay: '-1.7s' },
            { top: '350px', left: '50%', size: 6, delay: '-0.3s' },
          ].map((star, index) => (
            <Sparkle
              key={index}
              size={star.size}
              color={index % 2 ? 'var(--accent)' : 'var(--warm)'}
              className="motion-loop anim-twinkle absolute"
              style={{ top: star.top, left: star.left, '--twinkle-delay': star.delay } as React.CSSProperties}
            />
          ))}
        </>
      ) : (
        <div className={cn('absolute right-10', low ? 'top-[250px]' : 'top-[216px]')}>
          {/* Rayons qui tournent lentement autour du soleil. */}
          <svg
            width="112"
            height="112"
            viewBox="0 0 112 112"
            className="motion-loop anim-spin-slow absolute -top-6 -left-6"
            style={{ '--spin-duration': '60s' } as React.CSSProperties}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <rect
                key={index}
                x="54"
                y="4"
                width="4"
                height="14"
                rx="2"
                transform={`rotate(${index * 30} 56 56)`}
                style={{ fill: 'var(--warm)', opacity: 0.45 }}
              />
            ))}
          </svg>
          <div className="relative h-16 w-16 rounded-pill bg-warm-soft p-2">
            <div className="h-full w-full rounded-pill bg-warm" />
          </div>
        </div>
      )}

      <Cloud className="motion-loop anim-cloud absolute top-[262px] left-[6%]" style={{ '--cloud-duration': '80s', '--cloud-delay': '-30s' } as React.CSSProperties} />
      <Cloud
        scale={0.7}
        className="motion-loop anim-cloud absolute top-[330px] left-[48%]"
        style={{ '--cloud-duration': '110s', '--cloud-delay': '-75s' } as React.CSSProperties}
      />
    </div>
  )
}

/* ------------------------------ Cadran de temps ----------------------------- */

/** Un petit cadran : l'arc se remplit jusqu'à la durée (5, 15 ou 30 min sur 60). */
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
              stroke: 'var(--ink-faint)',
              strokeWidth: 1.5,
              strokeDasharray: '1.5 5',
              strokeLinecap: 'round',
              transformBox: 'fill-box',
              transformOrigin: 'center',
              '--spin-duration': `${24 + minutes}s`,
            } as React.CSSProperties
          }
        />
        <circle cx="40" cy="40" r="31" style={{ fill: active ? 'var(--accent)' : 'var(--accent-soft)', stroke: 'var(--line)', strokeWidth: 5, transition: 'fill 0.3s' }} />
        <motion.circle
          cx="40"
          cy="40"
          r="31"
          transform="rotate(-90 40 40)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: minutes / 60 }}
          transition={{ delay: 0.25 + delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ fill: 'none', stroke: active ? 'var(--warm)' : 'var(--accent)', strokeWidth: 5, strokeLinecap: 'round' }}
        />
      </svg>
      <span className={cn('relative flex flex-col items-center leading-none transition-colors duration-300', active ? 'text-accent-ink' : 'text-accent')}>
        <span className="font-mono text-21 font-bold">{minutes}</span>
        <span className="font-mono text-mono-xs font-bold">min</span>
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

/** Ligne qui ondule (famille de moods) : douce pour l'énergie basse, en dents de scie pour l'énergie haute. */
export function EnergyLine({ energy }: { energy: 'basse' | 'haute' }) {
  const low = energy === 'basse'
  const path = low
    ? 'M0 6 Q 6 1 12 6 T 24 6 T 36 6 T 48 6 T 60 6 T 72 6'
    : 'M0 8 L4 3 L8 9 L12 2 L16 8 L20 3 L24 9 L28 2 L32 8 L36 3 L40 9 L44 2 L48 8 L52 3 L56 9 L60 2 L64 8 L68 3 L72 9'
  return (
    <svg width="36" height="12" viewBox="0 0 36 12" aria-hidden="true" className="overflow-hidden">
      <g className="motion-loop anim-wave" style={{ '--wave-duration': low ? '3s' : '0.9s', '--wave-shift': low ? '-24px' : '-16px' } as React.CSSProperties}>
        <path d={path} style={{ fill: 'none', stroke: low ? 'var(--accent)' : 'var(--warm)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      </g>
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
          background: 'repeating-conic-gradient(var(--warm-soft) 0deg 9deg, transparent 9deg 22.5deg)',
          WebkitMaskImage: mask,
          maskImage: mask,
          '--spin-duration': '36s',
        } as React.CSSProperties
      }
    />
  )
}
