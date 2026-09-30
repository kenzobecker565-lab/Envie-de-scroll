/** Petite marque de l'app : un cercle (le bouton) et un point chaud. */
export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" style={{ fill: 'var(--accent)' }} />
      <circle cx="12" cy="12" r="5.5" style={{ fill: 'none', stroke: 'var(--accent-ink)', strokeWidth: 2.2 }} />
      <circle cx="12" cy="12" r="1.8" style={{ fill: 'var(--warm)' }} />
    </svg>
  )
}
