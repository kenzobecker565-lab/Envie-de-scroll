import type { Activity, PassionId } from '../../types'
import { dessin, illustrationNumerique, modeStylisme, peinture, photographie } from './artsVisuels'
import { animation, cinema, montageVideo } from './audiovisuel'
import { artsMartiaux, danse, sport, theatre } from './corps'
import { echecs, jeuxDeSociete, jeuxVideoCreatifs, programmationCreative } from './esprit'
import { bricolage, couture, cuisine, jardinage } from './fabrication'
import { critiqueBlogging, ecriture, journalIntime, poesie } from './mots'
import { observationNature, randonnee, voyage } from './nature'
import { chant, composition, musique, podcast } from './son'

/**
 * ============================================================================
 *  BIBLIOTHÈQUE D'ACTIVITÉS
 * ============================================================================
 *
 * Les activités sont rédigées dans les fichiers voisins, un par famille :
 *   artsVisuels.ts, audiovisuel.ts, mots.ts, son.ts, corps.ts,
 *   fabrication.ts, esprit.ts, nature.ts
 *
 * Pour en ajouter une : ouvre le fichier de la famille, trouve la passion puis
 * le mood, et ajoute une ligne sur le modèle des autres. C'est tout — l'app la
 * proposera automatiquement. `npm test` vérifie ensuite que rien ne manque.
 *
 * Ce tableau `Record<PassionId, …>` oblige à avoir une entrée pour chaque
 * passion du catalogue : TypeScript refuse de compiler s'il en manque une.
 */
export const ACTIVITIES_BY_PASSION: Record<PassionId, Activity[]> = {
  dessin,
  peinture,
  photographie,
  'illustration-numerique': illustrationNumerique,
  'mode-stylisme': modeStylisme,
  cinema,
  animation,
  'montage-video': montageVideo,
  ecriture,
  poesie,
  'journal-intime': journalIntime,
  'critique-blogging': critiqueBlogging,
  musique,
  chant,
  composition,
  podcast,
  danse,
  sport,
  theatre,
  'arts-martiaux': artsMartiaux,
  bricolage,
  cuisine,
  couture,
  jardinage,
  'jeux-video-creatifs': jeuxVideoCreatifs,
  'programmation-creative': programmationCreative,
  'jeux-de-societe': jeuxDeSociete,
  echecs,
  randonnee,
  'observation-nature': observationNature,
  voyage,
}

/** Toutes les activités, à plat. */
export const ACTIVITIES: Activity[] = Object.values(ACTIVITIES_BY_PASSION).flat()

const ACTIVITIES_BY_ID = new Map(ACTIVITIES.map((activity) => [activity.id, activity]))

export function getActivity(id: string): Activity | undefined {
  return ACTIVITIES_BY_ID.get(id)
}
