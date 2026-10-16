import type { CSSProperties } from 'react'
import { getPassionFamily } from '../data/passions'
import type { EnergyLevel, PassionId } from '../types'

/** Style qui pose la couleur d'accent utilisée par les classes `tint-accent`, `border-accent`… */
export function accentStyle(color: string): CSSProperties {
  return { '--accent': color } as CSSProperties
}

/** Couleur d'accent d'une passion (celle de sa famille). */
export function passionAccent(passionId: PassionId): CSSProperties {
  return accentStyle(getPassionFamily(passionId).color)
}

/** Tache de couleur des pictogrammes d'humeur : froide (énergie basse) ou chaude (énergie haute). */
export const MOOD_SPOT: Record<EnergyLevel, string> = {
  basse: 'color-mix(in oklab, var(--color-dusk) 42%, var(--color-card))',
  haute: 'color-mix(in oklab, var(--color-ember) 40%, var(--color-card))',
}
