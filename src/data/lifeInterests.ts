import type { LifeInterest, LifeInterestId, PassionFamilyId, PassionId } from '../types'

/**
 * Chemin alternatif de l'onboarding : si l'utilisateur ne coche aucune
 * passion, on lui demande « Qu'est-ce qui te plaît dans la vie ? ».
 * Chaque réponse redirige vers une ou plusieurs familles de passions, avec
 * quelques passions pré-cochées pour démarrer en douceur (mode débutant).
 */
export const LIFE_INTERESTS: LifeInterest[] = [
  {
    id: 'creer-mains',
    label: 'Créer des choses de mes mains',
    picto: 'hand',
    familyIds: ['fabrication', 'arts-visuels'],
    suggestedPassionIds: ['dessin', 'cuisine', 'bricolage'],
  },
  {
    id: 'raconter',
    label: 'Raconter des histoires',
    picto: 'book-open',
    familyIds: ['mots', 'audiovisuel'],
    suggestedPassionIds: ['ecriture', 'cinema'],
  },
  {
    id: 'bouger',
    label: 'Bouger, me dépenser',
    picto: 'bike',
    familyIds: ['corps-mouvement'],
    suggestedPassionIds: ['sport', 'danse'],
  },
  {
    id: 'comprendre',
    label: 'Observer, comprendre comment les choses fonctionnent',
    picto: 'search',
    familyIds: ['esprit-strategie', 'nature-exploration'],
    suggestedPassionIds: ['programmation-creative', 'observation-nature'],
  },
  {
    id: 'musique',
    label: 'Écouter ou faire de la musique',
    picto: 'headphones',
    familyIds: ['son'],
    suggestedPassionIds: ['musique', 'chant'],
  },
  {
    id: 'nature',
    label: 'Être dans la nature',
    picto: 'trees',
    familyIds: ['nature-exploration', 'fabrication'],
    suggestedPassionIds: ['randonnee', 'observation-nature', 'jardinage'],
  },
  {
    id: 'autres',
    label: 'Aider ou être avec les autres',
    picto: 'heart-handshake',
    familyIds: ['corps-mouvement', 'esprit-strategie', 'fabrication'],
    suggestedPassionIds: ['theatre', 'jeux-de-societe', 'cuisine'],
  },
  {
    id: 'jouer',
    label: 'Jouer, résoudre des problèmes',
    picto: 'puzzle',
    familyIds: ['esprit-strategie'],
    suggestedPassionIds: ['echecs', 'jeux-video-creatifs'],
  },
]

const INTERESTS_BY_ID = Object.fromEntries(
  LIFE_INTERESTS.map((interest) => [interest.id, interest]),
) as Record<LifeInterestId, LifeInterest>

/** Garde de type : vérifie qu'une chaîne (ex. lue en base) est une réponse connue. */
export function isLifeInterestId(value: string): value is LifeInterestId {
  return Object.hasOwn(INTERESTS_BY_ID, value)
}

/**
 * Traduit les réponses de l'utilisateur en familles et passions suggérées
 * (sans doublons, dans l'ordre des réponses).
 */
export function resolveLifeInterests(ids: LifeInterestId[]): {
  familyIds: PassionFamilyId[]
  suggestedPassionIds: PassionId[]
} {
  const familyIds = new Set<PassionFamilyId>()
  const suggestedPassionIds = new Set<PassionId>()
  for (const id of ids) {
    const interest = INTERESTS_BY_ID[id]
    interest.familyIds.forEach((familyId) => familyIds.add(familyId))
    interest.suggestedPassionIds.forEach((passionId) => suggestedPassionIds.add(passionId))
  }
  return { familyIds: [...familyIds], suggestedPassionIds: [...suggestedPassionIds] }
}
