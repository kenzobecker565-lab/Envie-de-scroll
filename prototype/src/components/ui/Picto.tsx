import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import { PICTOS, spotFor } from '../../lib/pictos'
import type { PictoName } from '../../types'

interface PictoProps {
  name: PictoName
  /**
   * Tache de couleur sous le trait : `true` prend l'accent de l'élément
   * parent (variable --accent), une chaîne est une couleur CSS.
   */
  spot?: boolean | string
  className?: string
  /** Épaisseur du trait, dans la grille de 24 (1,8 par défaut). */
  weight?: number
}

/**
 * Un pictogramme au trait, à la couleur du texte (voir src/lib/pictos.ts).
 * Toujours décoratif : le libellé est affiché à côté.
 */
export function Picto({ name, spot, className, weight = 1.8 }: PictoProps) {
  const spotStyle: CSSProperties | undefined = typeof spot === 'string' ? { fill: spot } : undefined
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
    >
      {spot && <path d={spotFor(name)} stroke="none" className={spot === true ? 'spot-accent' : undefined} style={spotStyle} />}
      {PICTOS[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  )
}
