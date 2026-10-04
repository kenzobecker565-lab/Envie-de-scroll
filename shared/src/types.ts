/**
 * Modèle de données partagé par la Mini App et le serveur.
 *
 * Les identifiants (passions, moods, durées) sont des chaînes ou des nombres
 * simples, stockés tels quels en base : ne pas les renommer une fois en
 * production, sinon l'historique des utilisateurs ne correspondrait plus.
 */

export const PASSION_IDS = ['dessin', 'ecriture', 'musique', 'cinema', 'piano', 'rythme', 'logique', 'francais'] as const
export type PassionId = (typeof PASSION_IDS)[number]

/** Les trois temps proposés dans cette V1 (en minutes). */
export const DURATIONS = [5, 15, 30] as const
export type Duration = (typeof DURATIONS)[number]

export const MOOD_IDS = [
  'ennui',
  'souffler',
  'pause-travail',
  'fatigue',
  'stress',
  'frustration',
  'procrastination',
  'trop-energie',
] as const
export type MoodId = (typeof MOOD_IDS)[number]

/** Les deux familles de moods : le ton de l'introduction, et un tirage plutôt calme ou plutôt vif. */
export type Energy = 'basse' | 'haute'

/**
 * Ce que l'appli « tire au hasard » pour certaines activités
 * (« 3 mots que l'appli tire au hasard », « un film que l'appli te propose »…).
 */
export type ExtraKind =
  | 'trois-mots'
  | 'un-mot'
  | 'premiere-phrase'
  | 'deux-traits'
  | 'genre-musical'
  | 'film'
  | 'film-ou-anime'
  | 'court-ou-episode'

/** Ce qui est demandé après « Valider », selon la passion. */
export type ProofKind =
  /** Dessin : une photo du dessin. */
  | 'photo'
  /** Écriture : le texte produit, collé ou écrit. */
  | 'texte'
  /** Musique, Cinéma : rien à prouver, juste noter (facultatif) le titre exploré. */
  | 'titre'

export interface Passion {
  id: PassionId
  label: string
  /** Petite phrase sous le nom, sur les cartes de l'onboarding. */
  tagline: string
  proof: ProofKind
  /**
   * Garde-fou temporel léger : « Valider » reste grisé tant que la durée
   * choisie ne s'est pas écoulée (Musique, Cinéma).
   */
  timeGuard: boolean
  /** Couleur de fond de la carte illustrée (tokens du design system). */
  tone: 'accent' | 'warm'
  /**
   * Passion où l'on part de plus ou moins loin (Piano) : une page demande le
   * niveau, et les activités comme les parcours s'y adaptent (voir skills.ts).
   */
  skill?: SkillQuestion
}

/** Le niveau déclaré dans une passion : il cible le contenu. */
export const SKILL_LEVELS = ['debutant', 'bases', 'confirme'] as const
export type SkillLevel = (typeof SKILL_LEVELS)[number]

/** La page « Ton niveau » d'une passion : la question, et une réponse par niveau. */
export interface SkillQuestion {
  question: string
  options: Record<SkillLevel, { label: string; hint: string }>
}

export interface Mood {
  id: MoodId
  label: string
  energy: Energy
}

export interface Activity {
  /** Identifiant stable : `<passion>-<durée>-<numéro>` (ex. `dessin-15-7`). */
  id: string
  passion: PassionId
  duration: Duration
  /** Numéro de 1 à 15 dans la liste validée de la passion. */
  number: number
  text: string
  /** Si l'activité demande que l'appli tire quelque chose au hasard. */
  extra?: ExtraKind
}

/** Le tirage associé à une activité, conservé avec la proposition. */
export interface ActivityExtra {
  kind: ExtraKind
  /** Ex. « Tes 3 mots », « Le film proposé ». */
  label: string
  items: string[]
}
