/**
 * Petites scènes animées, une par passion :
 * - Dessin : un crayon trace une ligne ;
 * - Écriture : une plume écrit trois lignes ;
 * - Musique : un égaliseur danse et des notes s'envolent ;
 * - Cinéma : une pellicule défile ;
 * - Piano : les touches s'enfoncent l'une après l'autre, des notes s'envolent.
 *
 * Le tracé du crayon et de la plume utilise les animations SVG natives
 * (le trait et l'outil restent parfaitement synchronisés). Si le système
 * demande de réduire les animations, chaque scène reste figée sur une image
 * finie (ligne tracée, texte écrit…).
 */

import { useReducedMotion } from 'motion/react'
import { useId } from 'react'
import type { PassionId } from '@scroll-up/shared'
import { cn } from '@/lib/utils'

const DRAW_PATH = 'M14 62 C 30 22, 52 20, 62 48 S 88 82, 102 50 S 128 16, 146 38'

function DrawingScene({ animate }: { animate: boolean }) {
  return (
    <>
      <path
        d={DRAW_PATH}
        pathLength={1}
        style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 3.5, strokeLinecap: 'round', strokeDasharray: 1, strokeDashoffset: 0 }}
      >
        {animate && <animate attributeName="stroke-dashoffset" values="1;0;0;0" keyTimes="0;0.6;0.85;1" dur="4s" repeatCount="indefinite" />}
        {animate && <animate attributeName="opacity" values="1;1;1;0" keyTimes="0;0.6;0.85;1" dur="4s" repeatCount="indefinite" />}
      </path>
      {/* Le crayon : sa pointe est à l'origine, il suit le tracé. */}
      <g transform={animate ? undefined : 'translate(146 38)'}>
        {animate && <animateMotion dur="4s" repeatCount="indefinite" keyPoints="0;1;1;1" keyTimes="0;0.6;0.85;1" calcMode="linear" path={DRAW_PATH} />}
        <g transform="rotate(-40)">
          <polygon points="0,0 9,-4 9,4" style={{ fill: 'var(--warm-soft)' }} />
          <polygon points="0,0 3.5,-1.6 3.5,1.6" style={{ fill: 'var(--ink)' }} />
          <rect x="9" y="-4" width="26" height="8" style={{ fill: 'var(--warm)' }} />
          <rect x="35" y="-4" width="3" height="8" style={{ fill: 'var(--ink-soft)' }} />
          <rect x="38" y="-4" width="7" height="8" rx="2" style={{ fill: 'var(--accent)' }} />
        </g>
      </g>
    </>
  )
}

/** Trajet de la plume : chaque ligne, puis un retour en diagonale vers la suivante. */
const WRITE_PATH = 'M20 26 H132 L20 46 H124 L20 66 H92'
const WRITE_KEY_TIMES = '0;0.28;0.33;0.6;0.65;0.85;1'
const WRITE_KEY_POINTS = '0;0.2206;0.4448;0.6496;0.8582;1;1'

function WritingScene({ animate }: { animate: boolean }) {
  const lines = [
    { d: 'M20 26 H132', values: '1;0;0', keyTimes: '0;0.28;1' },
    { d: 'M20 46 H124', values: '1;1;0;0', keyTimes: '0;0.33;0.6;1' },
    { d: 'M20 66 H92', values: '1;1;0;0', keyTimes: '0;0.65;0.85;1' },
  ]
  return (
    <>
      <g>
        {animate && <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.92;1" dur="5s" repeatCount="indefinite" />}
        {lines.map((line) => (
          <path
            key={line.d}
            d={line.d}
            pathLength={1}
            style={{ fill: 'none', stroke: 'var(--ink-soft)', strokeWidth: 4, strokeLinecap: 'round', strokeDasharray: 1, strokeDashoffset: 0 }}
          >
            {animate && <animate attributeName="stroke-dashoffset" values={line.values} keyTimes={line.keyTimes} dur="5s" repeatCount="indefinite" />}
          </path>
        ))}
      </g>
      {/* La plume : sa pointe est à l'origine. */}
      <g transform={animate ? undefined : 'translate(92 66)'}>
        {animate && <animateMotion dur="5s" repeatCount="indefinite" keyPoints={WRITE_KEY_POINTS} keyTimes={WRITE_KEY_TIMES} calcMode="linear" path={WRITE_PATH} />}
        <g transform="translate(0 -2) rotate(-38)">
          <path d="M0 0 L7 -2 C18 -12 34 -15 46 -13 C39 -4 25 2 7 2 Z" style={{ fill: 'var(--warm)' }} />
          <path d="M3 0 L42 -12" style={{ stroke: 'var(--warm-ink)', strokeWidth: 1.2, strokeLinecap: 'round' }} />
          <polygon points="0,0 4,-1.4 4,1.2" style={{ fill: 'var(--ink)' }} />
        </g>
      </g>
    </>
  )
}

const BARS = [
  { h: 22, d: '0.9s', delay: '-0.2s', color: 'var(--accent)' },
  { h: 38, d: '0.7s', delay: '-0.5s', color: 'var(--warm)' },
  { h: 30, d: '1.1s', delay: '-0.1s', color: 'var(--accent)' },
  { h: 46, d: '0.8s', delay: '-0.7s', color: 'var(--warm)' },
  { h: 26, d: '1.2s', delay: '-0.3s', color: 'var(--accent)' },
  { h: 40, d: '0.75s', delay: '-0.9s', color: 'var(--warm)' },
  { h: 18, d: '1s', delay: '-0.4s', color: 'var(--accent)' },
]

function Note({ x, y, delay, color }: { x: number; y: number; delay: string; color: string }) {
  return (
    <g className="motion-loop anim-note" style={{ '--note-delay': delay } as React.CSSProperties}>
      <g transform={`translate(${x} ${y})`}>
        <ellipse cx="0" cy="0" rx="4.2" ry="3.4" transform="rotate(-20)" style={{ fill: color }} />
        <rect x="3" y="-16" width="1.8" height="16" style={{ fill: color }} />
        <path d="M4.8 -16 C10 -14 11 -10 9 -6" style={{ fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' }} />
      </g>
    </g>
  )
}

function MusicScene() {
  return (
    <>
      {BARS.map((bar, index) => (
        <rect
          key={index}
          className="motion-loop anim-bar"
          x={22 + index * 12}
          y={76 - bar.h}
          width="8"
          height={bar.h}
          rx="3"
          style={{ fill: bar.color, '--bar-duration': bar.d, '--bar-delay': bar.delay } as React.CSSProperties}
        />
      ))}
      <Note x={122} y={50} delay="0s" color="var(--ink-soft)" />
      <Note x={138} y={62} delay="-1.6s" color="var(--accent)" />
    </>
  )
}

function FilmScene() {
  // Identifiant sans caractères spéciaux, utilisable dans url(#…).
  const clipId = `film${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const holes = Array.from({ length: 24 }, (_, index) => -40 + index * 10)
  const frames = Array.from({ length: 7 }, (_, index) => -40 + index * 40)
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <rect x="4" y="18" width="152" height="54" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <g className="motion-loop anim-film">
          <rect x="-40" y="18" width="240" height="54" style={{ fill: 'var(--ink)' }} />
          {holes.map((x) => (
            <g key={x}>
              <rect x={x + 2} y="22" width="6" height="5" rx="1" style={{ fill: 'var(--canvas)' }} />
              <rect x={x + 2} y="63" width="6" height="5" rx="1" style={{ fill: 'var(--canvas)' }} />
            </g>
          ))}
          {frames.map((x, index) => (
            <g key={x}>
              <rect x={x + 4} y="31" width="32" height="28" rx="2" style={{ fill: index % 2 ? 'var(--warm-soft)' : 'var(--accent-soft)' }} />
              <circle cx={x + 28} cy="38" r="3.5" style={{ fill: 'var(--warm)' }} />
              <path d={`M${x + 6} 57 L${x + 16} 45 L${x + 23} 52 L${x + 28} 47 L${x + 34} 57 Z`} style={{ fill: index % 2 ? 'var(--warm)' : 'var(--accent)' }} />
            </g>
          ))}
        </g>
      </g>
    </>
  )
}

/** Les touches blanches qui s'allument tour à tour : Do Mi Sol Mi, comme un petit arpège. */
const PIANO_SEQUENCE = [0, 2, 4, 2, 0, 3, 5, 7]

function PianoScene({ animate }: { animate: boolean }) {
  const whites = Array.from({ length: 9 }, (_, index) => 8 + index * 16)
  // Les touches noires : après Do, Ré, Fa, Sol, La (pas après Mi ni Si).
  const blacks = [0, 1, 3, 4, 5, 7].map((index) => 8 + index * 16 + 11)
  return (
    <>
      <rect x="4" y="30" width="152" height="52" rx="6" style={{ fill: 'var(--ink)' }} />
      {whites.map((x, index) => {
        const order = PIANO_SEQUENCE.indexOf(index)
        return (
          <g key={x}>
            <rect x={x} y="34" width="15" height="44" rx="2.5" style={{ fill: 'var(--surface-200)' }} />
            {order !== -1 && (
              <rect x={x} y="34" width="15" height="44" rx="2.5" style={{ fill: 'var(--accent)', opacity: animate ? 0 : index === 4 ? 0.85 : 0 }}>
                {animate && <animate attributeName="opacity" values="0;0.85;0;0" keyTimes="0;0.06;0.16;1" dur="3.2s" begin={`${order * 0.4}s`} repeatCount="indefinite" />}
              </rect>
            )}
          </g>
        )
      })}
      {blacks.map((x) => (
        <rect key={x} x={x} y="34" width="9" height="26" rx="2" style={{ fill: 'var(--ink)' }} />
      ))}
      <Note x={34} y={20} delay="0s" color="var(--accent)" />
      <Note x={118} y={14} delay="-1.6s" color="var(--ink-soft)" />
    </>
  )
}

/** Scène animée d'une passion. `className` fixe la taille (largeur ; hauteur auto). */
export function PassionScene({ passion, className }: { passion: PassionId; className?: string }) {
  const reduced = useReducedMotion()
  const animate = !reduced
  return (
    <svg viewBox="0 0 160 90" aria-hidden="true" className={cn('block overflow-visible', className)}>
      {passion === 'dessin' && <DrawingScene animate={animate} />}
      {passion === 'ecriture' && <WritingScene animate={animate} />}
      {passion === 'musique' && <MusicScene />}
      {passion === 'cinema' && <FilmScene />}
      {passion === 'piano' && <PianoScene animate={animate} />}
    </svg>
  )
}
