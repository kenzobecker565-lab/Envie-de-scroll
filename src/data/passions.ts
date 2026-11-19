import type {
  Passion,
  PassionFamily,
  PassionFamilyId,
  PassionId,
} from '../types'

/**
 * Catalogue des passions, organisé par familles.
 *
 * - Pour ajouter une passion : ajoute son identifiant dans le type `PassionId`
 *   (src/types/index.ts), puis une entrée dans `PASSIONS` et dans la famille
 *   correspondante. TypeScript signale tout oubli.
 * - `progressView` choisit l'affichage dans le tableau de bord : `gallery`
 *   (photos), `films` (liste de films notés) ou `timeline` (liste datée).
 *   Tu peux par exemple passer `peinture` ou `cuisine` en `gallery`.
 */
export const PASSIONS: Record<PassionId, Passion> = {
  // Arts visuels
  dessin: { id: 'dessin', familyId: 'arts-visuels', label: 'Dessin', picto: 'pencil', progressView: 'gallery' },
  peinture: { id: 'peinture', familyId: 'arts-visuels', label: 'Peinture', picto: 'palette', progressView: 'timeline' },
  photographie: { id: 'photographie', familyId: 'arts-visuels', label: 'Photographie', picto: 'camera', progressView: 'timeline' },
  'illustration-numerique': { id: 'illustration-numerique', familyId: 'arts-visuels', label: 'Illustration numérique', picto: 'pen-tool', progressView: 'timeline' },
  'mode-stylisme': { id: 'mode-stylisme', familyId: 'arts-visuels', label: 'Mode / stylisme', picto: 'shirt', progressView: 'timeline' },

  // Audiovisuel
  cinema: { id: 'cinema', familyId: 'audiovisuel', label: 'Cinéma', picto: 'clapperboard', progressView: 'films' },
  animation: { id: 'animation', familyId: 'audiovisuel', label: 'Animation', picto: 'film', progressView: 'timeline' },
  'montage-video': { id: 'montage-video', familyId: 'audiovisuel', label: 'Montage vidéo', picto: 'scissors', progressView: 'timeline' },

  // Mots
  ecriture: { id: 'ecriture', familyId: 'mots', label: 'Écriture (fiction)', picto: 'notebook-pen', progressView: 'timeline' },
  poesie: { id: 'poesie', familyId: 'mots', label: 'Poésie', picto: 'feather', progressView: 'timeline' },
  'journal-intime': { id: 'journal-intime', familyId: 'mots', label: 'Journal intime', picto: 'book-heart', progressView: 'timeline' },
  'critique-blogging': { id: 'critique-blogging', familyId: 'mots', label: 'Critique / blogging', picto: 'newspaper', progressView: 'timeline' },

  // Son
  musique: { id: 'musique', familyId: 'son', label: 'Musique (instrument)', picto: 'guitar', progressView: 'timeline' },
  chant: { id: 'chant', familyId: 'son', label: 'Chant', picto: 'mic-vocal', progressView: 'timeline' },
  composition: { id: 'composition', familyId: 'son', label: 'Composition', picto: 'piano', progressView: 'timeline' },
  podcast: { id: 'podcast', familyId: 'son', label: 'Podcast / audio', picto: 'podcast', progressView: 'timeline' },

  // Corps & mouvement
  danse: { id: 'danse', familyId: 'corps-mouvement', label: 'Danse', picto: 'footprints', progressView: 'timeline' },
  sport: { id: 'sport', familyId: 'corps-mouvement', label: 'Sport', picto: 'dumbbell', progressView: 'timeline' },
  theatre: { id: 'theatre', familyId: 'corps-mouvement', label: 'Théâtre', picto: 'drama', progressView: 'timeline' },
  'arts-martiaux': { id: 'arts-martiaux', familyId: 'corps-mouvement', label: 'Arts martiaux', picto: 'hand-fist', progressView: 'timeline' },

  // Fabrication
  bricolage: { id: 'bricolage', familyId: 'fabrication', label: 'Bricolage / DIY', picto: 'hammer', progressView: 'timeline' },
  cuisine: { id: 'cuisine', familyId: 'fabrication', label: 'Cuisine', picto: 'chef-hat', progressView: 'timeline' },
  couture: { id: 'couture', familyId: 'fabrication', label: 'Couture', picto: 'spool', progressView: 'timeline' },
  jardinage: { id: 'jardinage', familyId: 'fabrication', label: 'Jardinage', picto: 'sprout', progressView: 'timeline' },

  // Esprit & stratégie
  'jeux-video-creatifs': { id: 'jeux-video-creatifs', familyId: 'esprit-strategie', label: 'Jeux vidéo créatifs', picto: 'gamepad-2', progressView: 'timeline' },
  'programmation-creative': { id: 'programmation-creative', familyId: 'esprit-strategie', label: 'Programmation créative', picto: 'code-xml', progressView: 'timeline' },
  'jeux-de-societe': { id: 'jeux-de-societe', familyId: 'esprit-strategie', label: 'Jeux de société', picto: 'dice-5', progressView: 'timeline' },
  echecs: { id: 'echecs', familyId: 'esprit-strategie', label: 'Échecs', picto: 'chess-knight', progressView: 'timeline' },

  // Nature & exploration
  randonnee: { id: 'randonnee', familyId: 'nature-exploration', label: 'Randonnée', picto: 'mountain', progressView: 'timeline' },
  'observation-nature': { id: 'observation-nature', familyId: 'nature-exploration', label: 'Observation de la nature', picto: 'binoculars', progressView: 'timeline' },
  voyage: { id: 'voyage', familyId: 'nature-exploration', label: 'Voyage / découverte de lieux', picto: 'compass', progressView: 'timeline' },
}

export const PASSION_FAMILIES: PassionFamily[] = [
  {
    id: 'arts-visuels',
    label: 'Arts visuels',
    picto: 'frame',
    color: '#E4572E',
    passionIds: ['dessin', 'peinture', 'photographie', 'illustration-numerique', 'mode-stylisme'],
    starterPassionIds: ['dessin', 'photographie'],
  },
  {
    id: 'audiovisuel',
    label: 'Audiovisuel',
    picto: 'video',
    color: '#9B5DE5',
    passionIds: ['cinema', 'animation', 'montage-video'],
    starterPassionIds: ['cinema', 'animation'],
  },
  {
    id: 'mots',
    label: 'Mots',
    picto: 'quote',
    color: '#3D7DD8',
    passionIds: ['ecriture', 'poesie', 'journal-intime', 'critique-blogging'],
    starterPassionIds: ['journal-intime', 'ecriture'],
  },
  {
    id: 'son',
    label: 'Son',
    picto: 'audio-lines',
    color: '#13A89E',
    passionIds: ['musique', 'chant', 'composition', 'podcast'],
    starterPassionIds: ['chant', 'musique'],
  },
  {
    id: 'corps-mouvement',
    label: 'Corps & mouvement',
    picto: 'activity',
    color: '#F08A24',
    passionIds: ['danse', 'sport', 'theatre', 'arts-martiaux'],
    starterPassionIds: ['sport', 'danse'],
  },
  {
    id: 'fabrication',
    label: 'Fabrication',
    picto: 'hand',
    color: '#C9971A',
    passionIds: ['bricolage', 'cuisine', 'couture', 'jardinage'],
    starterPassionIds: ['cuisine', 'bricolage'],
  },
  {
    id: 'esprit-strategie',
    label: 'Esprit & stratégie',
    picto: 'brain',
    color: '#D6457A',
    passionIds: ['jeux-video-creatifs', 'programmation-creative', 'jeux-de-societe', 'echecs'],
    starterPassionIds: ['echecs', 'jeux-de-societe'],
  },
  {
    id: 'nature-exploration',
    label: 'Nature & exploration',
    picto: 'tent',
    color: '#4F9D69',
    passionIds: ['randonnee', 'observation-nature', 'voyage'],
    starterPassionIds: ['observation-nature', 'randonnee'],
  },
]

export const ALL_PASSION_IDS = Object.keys(PASSIONS) as PassionId[]

const FAMILIES_BY_ID = Object.fromEntries(
  PASSION_FAMILIES.map((family) => [family.id, family]),
) as Record<PassionFamilyId, PassionFamily>

export function getPassion(id: PassionId): Passion {
  return PASSIONS[id]
}

export function getFamily(id: PassionFamilyId): PassionFamily {
  return FAMILIES_BY_ID[id]
}

export function getPassionFamily(passionId: PassionId): PassionFamily {
  return FAMILIES_BY_ID[PASSIONS[passionId].familyId]
}

/** Garde de type : vérifie qu'une chaîne (ex. lue en base) est une passion connue. */
export function isPassionId(value: string): value is PassionId {
  // `Object.hasOwn` et non `in` : « constructor » ou « toString » ne sont pas des passions.
  return Object.hasOwn(PASSIONS, value)
}
