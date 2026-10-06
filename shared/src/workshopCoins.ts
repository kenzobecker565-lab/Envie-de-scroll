/**
 * Minutons d'un atelier : énigmes, français (et Rythme, l'ancien atelier).
 *
 * Un atelier s'enregistre quand on veut, même sans tout résoudre : rien ne se
 * perd. Mais 1 minuton reste 1 minute de création :
 * - tout est juste sans avoir vu de solution → la durée entière de l'activité ;
 * - sinon → les minutes réellement passées depuis l'ouverture, au plus la durée.
 */

import { coinsFor } from './rules.ts'
import type { Duration } from './types.ts'
import type { WorkshopResult } from './workshops.ts'

/**
 * Vrai quand chaque étape notée est juste. Un beat de Rythme n'a pas de bonne
 * réponse : il compte comme réussi. Un autre format sans correction : non.
 */
export function workshopSolved(result: WorkshopResult): boolean {
  const steps = result.studio?.steps
  if (steps) {
    const scored = steps.filter((step) => step.correct !== null)
    return scored.length > 0 && scored.every((step) => step.correct === true)
  }
  if (result.logicResults) return result.logicResults.length > 0 && result.logicResults.every((entry) => entry.correct)
  return result.passion === 'rythme'
}

export function workshopCoins(duration: Duration, { solved, elapsedMs }: { solved: boolean; elapsedMs: number }): number {
  const full = coinsFor(duration)
  if (solved) return full
  return Math.max(0, Math.min(full, Math.floor(elapsedMs / 60_000)))
}
