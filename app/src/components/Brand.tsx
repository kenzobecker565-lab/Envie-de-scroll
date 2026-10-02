import { cn } from '@/lib/utils'
import { ICON_PATHS, ICON_SIZE, LOGO_COLORS, WORD_PATHS, WORD_SIZE } from './logoPaths.ts'

/**
 * Le logo de Scroll-up : Minuton qui fait un clin d'œil sur son carré jaune,
 * et le nom avec son trait d'union tomate. L'icône garde ses couleurs dans
 * tous les thèmes ; les lettres du nom prennent la couleur du texte (claires
 * en thème sombre).
 */

/** L'icône : Minuton sur son carré jaune (`square` : sans arrondi, pour un fond plein). */
export function LogoIcon({ size = 32, square = false, className }: { size?: number; square?: boolean; className?: string }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${ICON_SIZE} ${ICON_SIZE}`} className={cn('shrink-0', className)} aria-hidden="true">
      <rect width={ICON_SIZE} height={ICON_SIZE} rx={square ? 0 : 70} fill={LOGO_COLORS.yellow} />
      <path d={ICON_PATHS.cheeks} fill={LOGO_COLORS.tomato} />
      <path d={ICON_PATHS.ink} fill={LOGO_COLORS.ink} fillRule="evenodd" />
      <path d={ICON_PATHS.shine} fill={LOGO_COLORS.shine} stroke={LOGO_COLORS.shine} strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  )
}

/** Le nom « Scroll-up », à la hauteur voulue. */
export function Wordmark({ height = 20, decorative = false, className, style }: { height?: number; decorative?: boolean; className?: string; style?: React.CSSProperties }) {
  const width = (height * WORD_SIZE.width) / WORD_SIZE.height
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${WORD_SIZE.width} ${WORD_SIZE.height}`}
      className={cn('shrink-0 text-ink', className)}
      style={style}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Scroll-up' })}
    >
      <path d={WORD_PATHS.letters} fill="currentColor" fillRule="evenodd" />
      <path d={WORD_PATHS.dash} fill={LOGO_COLORS.tomato} />
    </svg>
  )
}

/** Le logo entier, l'icône et le nom côte à côte, dans les proportions du logo d'origine. */
export function Logo({ height = 32, className }: { height?: number; className?: string }) {
  const scale = height / ICON_SIZE
  return (
    <span className={cn('inline-flex shrink-0 items-start', className)} style={{ gap: 27 * scale }} role="img" aria-label="Scroll-up">
      <LogoIcon size={height} />
      <Wordmark height={WORD_SIZE.height * scale} decorative style={{ marginTop: 98.5 * scale }} />
    </span>
  )
}

/** Minuton fait un clin d'œil : l'icône jaune du logo Scroll-up. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return <LogoIcon size={size} />
}
