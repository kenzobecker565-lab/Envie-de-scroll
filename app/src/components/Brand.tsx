import { cn } from '@/lib/utils'

/** Petite marque de l'app : un téléphone barré sur une pastille tomate. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="16" style={{ fill: 'var(--accent)', stroke: 'var(--outline)', strokeWidth: 5 }} />
      <rect x="22" y="13" width="20" height="38" rx="5" style={{ fill: 'var(--surface-200)', stroke: 'var(--on-color)', strokeWidth: 4 }} />
      <path d="M13 51 51 13" style={{ stroke: 'var(--on-color)', strokeWidth: 5, strokeLinecap: 'round' }} />
    </svg>
  )
}

/** Le nom de l'app en sticker tomate, un peu penché. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-9 -rotate-3 items-center rounded-sm border-[2.5px] border-outline bg-accent px-3 font-display text-17 font-extrabold tracking-tight text-on-color shadow-chip',
        className,
      )}
    >
      scroll-up
    </span>
  )
}
