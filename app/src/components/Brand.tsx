import { cn } from '@/lib/utils'

/** Minuton fait un clin d’œil : l’icône jaune du logo Scroll-up. */
export function BrandMark({ size = 28 }: { size?: number }) {
  return <img src="/minuton-icon.svg" width={size} height={size} alt="" aria-hidden="true" className="shrink-0" />
}

/** Logo complet, avec un nom lisible dans tous les thèmes de l’application. */
export function Wordmark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      role="img"
      aria-label="Scroll-up"
      className={cn('inline-flex shrink-0 items-center gap-1.5 text-ink', className)}
      style={{ fontFamily: "'Nunito Variable', 'Nunito', sans-serif", fontWeight: 1000, letterSpacing: '-0.055em', lineHeight: 1, fontSize: size * 0.66 }}
    >
      <BrandMark size={size} />
      <span aria-hidden="true">Scroll<span style={{ color: '#FF6A4D' }}>-</span>up</span>
    </span>
  )
}
