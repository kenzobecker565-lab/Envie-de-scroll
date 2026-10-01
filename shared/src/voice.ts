/**
 * Le ton de l'app, au-delà des phrases fixes du cahier des charges :
 * - une félicitation variée sous « Activité enregistrée. », selon la passion
 *   et ce qui a été fait (les mots écrits, la durée) ;
 * - une phrase d'accueil qui tient compte de l'heure.
 *
 * ⚠️ Ces textes ne font pas partie du contenu validé : à relire librement.
 */

import { frenchTypography } from './typography.ts'
import type { PassionId } from './types.ts'

/** `{d}` : la durée en minutes ; `{n}` : le nombre de mots écrits (Écriture, si un texte a été enregistré). */
const RAW_CHEERS: Record<PassionId, string[]> = {
  dessin: [
    'Un dessin de plus dans ton carnet.',
    'Ta main progresse, même quand tu ne le vois pas.',
    'Chaque trait compte. Celui-là aussi.',
    'Ce dessin n\'existait pas il y a {d} minutes.',
    'Ton toi du futur sera content de retrouver ce dessin.',
  ],
  ecriture: [
    'Une page de plus, pas une de moins.',
    'Ton carnet s\'épaissit.',
    'Écrire, c\'est déjà s\'entraîner à mieux écrire.',
    'Ces mots-là, personne d\'autre n\'aurait pu les écrire.',
    'Des mots qui n\'existaient pas il y a {d} minutes.',
  ],
  musique: [
    'Tes oreilles te remercient.',
    'Un peu plus de musique dans ta journée, un peu moins de fil sans fin.',
    '{d} minutes d\'écoute vraie : c\'est rare, et précieux.',
    'Ta discothèque intérieure s\'agrandit.',
  ],
  cinema: [
    'Ta culture ciné s\'agrandit, une séance à la fois.',
    '{d} minutes de cinéma choisi, pas subi.',
    'Un regard un peu plus affûté qu\'hier.',
    'Mieux qu\'une vidéo de 15 secondes, non ?',
  ],
}

/** Écriture avec un texte : on célèbre les mots eux-mêmes. */
const RAW_WORD_CHEERS = ['{n} mots qui n\'existaient pas il y a {d} minutes.', '{n} mots, rien qu\'à toi.', 'Et de {n} mots de plus dans ton carnet.']

/** La félicitation sous « Activité enregistrée. », toujours la même pour une même graine. */
export function cheerFor(passion: PassionId, { duration, words = 0 }: { duration: number; words?: number }, random: () => number = Math.random): string {
  const list = passion === 'ecriture' && words >= 2 && random() < 0.6 ? RAW_WORD_CHEERS : RAW_CHEERS[passion]
  const raw = list[Math.floor(random() * list.length)] ?? list[0] ?? ''
  return frenchTypography(raw.replace('{d}', String(duration)).replace('{n}', String(words)))
}

/** Le moment de la journée, pour adapter l'accueil et les introductions. */
export type DayMoment = 'matin' | 'journee' | 'soir' | 'nuit'

export function dayMoment(hour: number): DayMoment {
  if (hour >= 5 && hour < 11) return 'matin'
  if (hour >= 11 && hour < 18) return 'journee'
  if (hour >= 18 && hour < 22) return 'soir'
  return 'nuit'
}

/** Sous « Bonjour Camille. » sur l'accueil. */
const RAW_HOME_LINES: Record<DayMoment, string[]> = {
  matin: ['Ton pouce te démange ? Appuie ici, on s\'occupe du reste.', 'Avant de scroller, un petit café créatif ? Appuie ici.'],
  journee: ['Ton pouce te démange ? Appuie ici, on s\'occupe du reste.', 'Une pause qui fait du bien, c\'est juste là. Appuie ici.'],
  soir: ['Ton pouce te démange ? Appuie ici, on s\'occupe du reste.', 'La journée est finie ? Offre-toi mieux que le fil. Appuie ici.'],
  nuit: ['Un dernier scroll avant de dormir ? On a plus doux. Appuie ici.', 'Encore debout ? Appuie ici, on fait calme.'],
}

export function homeLine(moment: DayMoment, random: () => number = Math.random): string {
  const list = RAW_HOME_LINES[moment]
  return frenchTypography(list[Math.floor(random() * list.length)] ?? list[0] ?? '')
}
