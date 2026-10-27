/** Durée écoulée d'une séance enregistrée, plafonnée à la durée choisie.
 * Les dates existantes permettent aussi de recalculer l'historique.
 * Ce compteur est indépendant des récompenses ; il ne mesure pas l'activité
 * à l'écran (une pause pendant la séance peut être incluse).
 */
export function sessionMinutes(row: { duration: number; createdAt: Date; proposal: { createdAt: Date } }): number {
  return Math.max(0, Math.min(row.duration, Math.floor((row.createdAt.getTime() - row.proposal.createdAt.getTime()) / 60_000)))
}
