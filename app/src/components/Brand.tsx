import { cn } from '@/lib/utils'

/** Le Minuton validé : des tracés SVG complets, lisibles à toutes les tailles. */
export function LogoIcon({ size = 32, square = false, className }: { size?: number; square?: boolean; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 100 100" className={cn('shrink-0', className)} aria-hidden="true">
    <rect width="100" height="100" rx={square ? 0 : 22} fill="#FFD54A" />
    <g fill="none" stroke="#151515" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="62" r="36" fill="#FFD54A" />
      <path d="M50 20v14M15 62h7M78 62h7M78 19l-4 8M88 29l-6 5" />
      <path d="M63 56q6-7 12-2M63 56q5-1 10 3" />
      <path d="M41 74q9 12 19 0" strokeWidth="5" />
    </g>
    <rect x="41" y="10" width="18" height="10" rx="3" fill="#151515" />
    <ellipse cx="37" cy="56" rx="4.4" ry="6" fill="#151515" />
    <ellipse cx="35.8" cy="53.5" rx="1.4" ry="1.8" fill="#FFFDF7" />
    <ellipse cx="30" cy="70" rx="5.6" ry="3.5" fill="#FF6A4D" />
    <ellipse cx="72" cy="70" rx="5.6" ry="3.5" fill="#FF6A4D" />
    <path d="M25 43q5-8 12-11" fill="none" stroke="#FFFDF7" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
}

/** Le nom reste lisible et suit la couleur du texte du thème. */
export function Wordmark({ height = 20, decorative = false, className, style }: { height?: number; decorative?: boolean; className?: string; style?: React.CSSProperties }) {
  return <span className={cn('inline-flex shrink-0 text-ink', className)} style={{ fontFamily: "'Nunito Variable', 'Nunito', sans-serif", fontWeight: 1000, letterSpacing: '-0.055em', lineHeight: 1, fontSize: height * 1.3, ...style }} {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Scroll-up' })}>
    Scroll<span style={{ color: '#FF6A4D' }}>-</span>up
  </span>
}

/** Même API pour tous les écrans, avec l'icône et le nom complets. */
export function Logo({ height = 32, className }: { height?: number; className?: string }) {
  return <span className={cn('inline-flex shrink-0 items-center gap-1.5', className)} role="img" aria-label="Scroll-up">
    <LogoIcon size={height} /><Wordmark height={height * .51} decorative />
  </span>
}

export function BrandMark({ size = 28 }: { size?: number }) { return <LogoIcon size={size} /> }
