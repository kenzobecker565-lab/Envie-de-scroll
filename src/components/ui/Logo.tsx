import { cn } from '../../lib/cn'

/**
 * Logo typographique : « plutôt que scroller », avec le mot « scroller »
 * barré d'un trait de crayon. Tout le concept en une image.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-baseline gap-[0.3em] font-brand font-semibold tracking-tight text-ink', className)}>
      <span>plutôt que</span>
      <span className="relative">
        scroller
        <svg
          aria-hidden
          viewBox="0 0 100 12"
          preserveAspectRatio="none"
          className="pointer-events-none absolute -left-[4%] top-[48%] h-[0.45em] w-[108%] -translate-y-1/2 text-primary"
        >
          <path d="M2 7 Q 14 1 26 6 T 50 6 T 74 6 T 98 4" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  )
}

/** Petite icône de l'app (crayon), reprise du favicon. */
export function AppMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className}>
      <rect width="64" height="64" rx="18" fill="var(--color-primary)" />
      <g transform="rotate(-45 32 32) translate(2.5 0)">
        <rect x="17" y="27" width="27" height="10" rx="2" fill="#FFF7EE" />
        <rect x="44" y="27" width="7" height="10" rx="2" fill="#F2B632" />
        <path d="M17 27 L8 32 L17 37 Z" fill="#F3D9C2" />
        <path d="M11 30.3 L8 32 L11 33.7 Z" fill="#2A1F1A" />
      </g>
    </svg>
  )
}
