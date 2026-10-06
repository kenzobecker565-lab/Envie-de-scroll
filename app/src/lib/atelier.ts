import type { CompletionDTO, LearningPassion } from '@scroll-up/shared'
export const ATELIER_CAPACITY: Record<LearningPassion, number> = {
  dessin: 6,
  ecriture: 4,
  piano: 3,
  logique: 2,
  francais: 2,
  sport: 2,
}
export function atelierSelection(items: CompletionDTO[], passion: LearningPassion) {
  return [...new Map(items.filter((i) => i.passion === passion).map((i) => [i.id, i])).values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id))
    .slice(0, ATELIER_CAPACITY[passion])
}
