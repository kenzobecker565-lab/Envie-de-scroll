import { MinutonFigure } from './Mascot.tsx'
import { cn } from '@/lib/utils'

/** Le Minuton validé : des tracés SVG complets, lisibles à toutes les tailles. */
export function LogoIcon({ size = 32, square = false, className }: { size?: number; square?: boolean; className?: string }) {
  return <span className={cn('inline-flex shrink-0', square && 'rounded-none', className)}><MinutonFigure size={size} mood="wink" animated={false} /></span>
}

/** Le nom reste lisible et suit la couleur du texte du thème. */
export function Wordmark({ height = 20, decorative = false, className, style }: { height?: number; decorative?: boolean; className?: string; style?: React.CSSProperties }) {
  return <span className={cn('inline-flex shrink-0 text-ink', className)} style={{ fontFamily: "'Nunito Variable', 'Nunito', sans-serif", fontWeight: 1000, letterSpacing: '-0.055em', lineHeight: 1, fontSize: height * 1.3, ...style }} {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Swipe Up' })}>
    Swipe<span style={{ color: 'var(--accent-strong)' }}> Up</span>
  </span>
}

/** Même API pour tous les écrans, avec l'icône et le nom complets. */
export function Logo({ height = 32, className }: { height?: number; className?: string }) {
  return <span className={cn('inline-flex shrink-0 items-center gap-1.5', className)} role="img" aria-label="Swipe Up">
    <LogoIcon size={height} /><Wordmark height={height * .51} decorative />
  </span>
}

export function BrandMark({ size = 28 }: { size?: number }) { return <LogoIcon size={size} /> }
