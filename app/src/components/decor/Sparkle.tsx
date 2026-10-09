/** Petite étoile à quatre branches (éclats, étoiles du ciel, particules). */
export function Sparkle({ size = 12, color = 'var(--warm)', className, style }: { size?: number; color?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="-2 -2 28 28" aria-hidden="true" className={className} style={style}>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" style={{ fill: color, stroke: 'var(--outline)', strokeWidth: 2, strokeLinejoin: 'round' }} />
    </svg>
  )
}
