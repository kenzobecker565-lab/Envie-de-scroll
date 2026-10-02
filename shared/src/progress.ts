/**
 * La progression par passion : un niveau qui monte avec les minutons gagnés
 * dans la passion (1 minute = 1 minuton), et la collection de ses 15
 * activités (3 temps × 5), à découvrir une à une.
 *
 * Comme le reste de l'app : on compte ce qui a été créé, jamais les jours
 * manqués. Un niveau ne redescend pas.
 */

import { ACTIVITIES } from './activities.ts'
import { DURATIONS, type Activity, type Duration, type PassionId } from './types.ts'

/** Minutons à gagner dans une passion pour atteindre les niveaux 1 à 5. */
export const LEVEL_MINUTES = [5, 30, 120, 300, 600] as const

/** Le titre de chaque niveau, du 1 au 5, par passion. */
export const LEVEL_TITLES: Record<PassionId, readonly [string, string, string, string, string]> = {
  dessin: ['Gribouilleur·euse', 'Croqueur·euse', 'Dessinateur·rice', 'Illustrateur·rice', 'Virtuose du trait'],
  ecriture: ['Griffonneur·euse', 'Plume', 'Conteur·euse', 'Auteur·rice', 'Romancier·ère'],
  musique: ['Curieux·euse', 'Auditeur·rice', 'Mélomane', 'Dénicheur·euse', 'Encyclopédie sonore'],
  cinema: ['Spectateur·rice', 'Cinéphile', 'Explorateur·rice', 'Critique', 'Cinémathèque ambulante'],
  piano: ['Pianoteur·euse', 'Doigts agiles', 'Musicien·ne', 'Pianiste', 'Virtuose du clavier'],
}

export const MAX_LEVEL = LEVEL_MINUTES.length

export interface LevelStep {
  level: number
  title: string
  /** Minutons à atteindre. */
  minutes: number
}

export interface PassionLevel {
  /** 0 : pas encore commencé ; 1 à 5 ensuite. */
  level: number
  /** Titre du niveau atteint (null au niveau 0). */
  title: string | null
  /** Le niveau suivant, ou null au niveau maximal. */
  next: LevelStep | null
  /** Avancée vers le niveau suivant, de 0 à 1 (1 au niveau maximal). */
  progress: number
}

/** Les cinq niveaux d'une passion, avec leur titre et leur seuil. */
export function levelSteps(passion: PassionId): LevelStep[] {
  return LEVEL_MINUTES.map((minutes, index) => ({ level: index + 1, title: LEVEL_TITLES[passion][index] ?? '', minutes }))
}

/** Le niveau atteint dans une passion avec `minutes` minutons. */
export function passionLevel(passion: PassionId, minutes: number): PassionLevel {
  const steps = levelSteps(passion)
  const reached = steps.filter((step) => minutes >= step.minutes)
  const current = reached.at(-1)
  const next = steps[reached.length] ?? null
  const floor = current?.minutes ?? 0
  return {
    level: current?.level ?? 0,
    title: current?.title ?? null,
    next,
    progress: next ? Math.min(1, Math.max(0, (minutes - floor) / (next.minutes - floor))) : 1,
  }
}

/** Le niveau franchi en passant de `before` à `after` minutons (le plus haut), ou null. */
export function levelCrossed(passion: PassionId, before: number, after: number): LevelStep | null {
  const crossed = levelSteps(passion).filter((step) => before < step.minutes && after >= step.minutes)
  return crossed.at(-1) ?? null
}

/** La collection d'une passion : ses activités, rangées par temps. */
export function collection(passion: PassionId): { duration: Duration; activities: Activity[] }[] {
  return DURATIONS.map((duration) => ({ duration, activities: ACTIVITIES.filter((activity) => activity.passion === passion && activity.duration === duration) }))
}

/** Nombre d'activités dans la collection d'une passion. */
export function collectionSize(passion: PassionId): number {
  return ACTIVITIES.filter((activity) => activity.passion === passion).length
}

/** Nombre de mots d'un texte (écriture). */
export function countWords(text: string | null | undefined): number {
  return text?.trim() ? text.trim().split(/\s+/).length : 0
}
