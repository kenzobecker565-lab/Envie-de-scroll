import type { Passion, PassionId } from './types.ts'

/** Les 4 passions de la V1, dans l'ordre d'affichage. */
export const PASSIONS: readonly Passion[] = [
  { id: 'dessin', label: 'Dessin', tagline: 'Un crayon, une feuille, et c’est parti', proof: 'photo', timeGuard: false, tone: 'accent' },
  { id: 'ecriture', label: 'Écriture', tagline: 'Des mots pour dire, inventer, raconter', proof: 'texte', timeGuard: false, tone: 'warm' },
  { id: 'musique', label: 'Musique', tagline: 'Écouter vraiment, découvrir, creuser', proof: 'titre', timeGuard: true, tone: 'warm' },
  { id: 'cinema', label: 'Cinéma / Animation', tagline: 'Films, animes, courts\u00A0: explorer', proof: 'titre', timeGuard: true, tone: 'accent' },
]

export const MIN_PASSIONS = 1
export const MAX_PASSIONS = 3

const BY_ID = new Map(PASSIONS.map((passion) => [passion.id, passion]))

export function getPassion(id: PassionId): Passion {
  const passion = BY_ID.get(id)
  if (!passion) throw new Error(`Passion inconnue : ${id}`)
  return passion
}

export function isPassionId(value: unknown): value is PassionId {
  return typeof value === 'string' && BY_ID.has(value as PassionId)
}

/**
 * Valide une sélection de passions (1 à 3, sans doublon, identifiants connus)
 * et la renvoie dans l'ordre d'affichage. Renvoie `null` si elle est invalide.
 */
export function normalizePassions(value: unknown): PassionId[] | null {
  if (!Array.isArray(value)) return null
  if (!value.every(isPassionId)) return null
  const unique = new Set(value)
  if (unique.size !== value.length) return null
  if (unique.size < MIN_PASSIONS || unique.size > MAX_PASSIONS) return null
  return PASSIONS.map((passion) => passion.id).filter((id) => unique.has(id))
}
