/**
 * Règles de progression et de validation, identiques côté app et serveur.
 */

import { getPassion } from './passions.ts'
import type { Duration, PassionId } from './types.ts'

/** 1 minute d'activité complétée = 1 pièce d'or. */
export const COINS_PER_MINUTE = 1

export function coinsFor(duration: Duration): number {
  return duration * COINS_PER_MINUTE
}

/**
 * Moment à partir duquel une activité peut être validée sans preuve :
 * - Musique, Cinéma : « Valider » se débloque quand la durée est écoulée ;
 * - Dessin, Écriture : valider avec une photo ou un texte est toujours
 *   possible ; « enregistrer sans » suit le même garde-fou temporel.
 */
export function unlockTime(proposedAt: Date, duration: Duration): Date {
  return new Date(proposedAt.getTime() + duration * 60_000)
}

/** Marge tolérée côté serveur (horloges, latence réseau). */
export const UNLOCK_TOLERANCE_MS = 15_000

export function needsTimeGuard(passion: PassionId): boolean {
  return getPassion(passion).timeGuard
}

/** Limites des contenus envoyés à la validation. */
export const MAX_TEXT_LENGTH = 20_000
export const MAX_TITLE_LENGTH = 200
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024
