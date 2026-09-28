import type { CSSProperties } from 'react'
import { getPassionFamily } from '../data/passions'
import type { PassionId } from '../types'

/** Style qui pose la couleur d'accent utilisée par les classes `tint-accent`, `border-accent`… */
export function accentStyle(color: string): CSSProperties {
  return { '--accent': color } as CSSProperties
}

/** Couleur d'accent d'une passion (celle de sa famille). */
export function passionAccent(passionId: PassionId): CSSProperties {
  return accentStyle(getPassionFamily(passionId).color)
}
