import type { Passion, PassionId } from './types.ts'

/**
 * Les passions, dans l'ordre d'affichage : les 4 de la V1, puis les nouvelles.
 * Les nouvelles passions demandent le niveau (`skill`) : on y apprend pas à
 * pas, avec des activités et des parcours adaptés à là où l'on en est.
 */
export const PASSIONS: readonly Passion[] = [
  { id: 'dessin', label: 'Dessin', tagline: 'Un crayon, une feuille, et c’est parti', proof: 'photo', timeGuard: false, tone: 'accent' },
  { id: 'ecriture', label: 'Écriture', tagline: 'Des mots pour dire, inventer, raconter', proof: 'texte', timeGuard: false, tone: 'warm' },
  { id: 'musique', label: 'Musique', tagline: 'Écouter vraiment, découvrir, creuser', proof: 'titre', timeGuard: true, tone: 'warm' },
  { id: 'cinema', label: 'Cinéma / Animation', tagline: 'Films, animes, courts\u00A0: explorer', proof: 'titre', timeGuard: true, tone: 'accent' },
  {
    id: 'piano',
    label: 'Piano',
    tagline: 'Apprendre à jouer, une touche après l’autre',
    proof: 'titre',
    timeGuard: true,
    tone: 'accent',
    skill: {
      question: 'Ton niveau au piano\u00A0?',
      options: {
        debutant: { label: 'Je n’ai jamais joué', hint: 'On part de zéro\u00A0: trouver les notes, poser la main, ton premier air.' },
        bases: { label: 'Je connais les bases', hint: 'Tu repères les notes et joues de petits airs à une main.' },
        confirme: { label: 'Je joue déjà', hint: 'Tu joues à deux mains et tu lis un peu les partitions.' },
      },
    },
  },
]

export const MIN_PASSIONS = 1
/** Pas de limite : on peut choisir toutes les passions. */
export const MAX_PASSIONS = PASSIONS.length

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
 * Valide une sélection de passions (au moins une, sans doublon, identifiants connus)
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
