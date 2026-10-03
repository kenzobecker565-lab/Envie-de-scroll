/**
 * Contrat de l'API REST entre la Mini App et le serveur.
 *
 * Authentification : chaque requête porte l'en-tête
 *   Authorization: tma <initData brut de Telegram>
 * que le serveur vérifie avec le token du bot.
 */

import type { ActivityRating, AppEventName } from './feedback.ts'
import type { ScrollMoment } from './reminders.ts'
import type { Skills } from './skills.ts'
import type { AppTheme } from './themes.ts'
import type { ActivityExtra, Duration, MoodId, PassionId, SkillLevel } from './types.ts'

export interface UserDTO {
  id: string
  firstName: string
  passions: PassionId[]
  /** Vrai une fois les passions choisies. */
  onboarded: boolean
  /** Tutoriel terminé ou passé, mémorisé pour tout le compte. */
  tutorialCompleted: boolean
  /** Thème choisi dans l'app. */
  theme: AppTheme
  /** Relances du bot (au plus une par jour). */
  remindersEnabled: boolean
  /** Le moment où la personne scrolle le plus : la relance arrive juste avant (sinon vers 19 h). */
  scrollMoment: ScrollMoment | null
  /** Le niveau déclaré dans les passions qui le demandent (Piano). */
  skills: Skills
}

/** Ce qu'une personne a fait dans une passion : de quoi calculer son niveau et sa collection. */
export interface PassionStatsDTO {
  passion: PassionId
  /** Minutons gagnés dans la passion (1 minute = 1 minuton). */
  minutes: number
  /** Activités validées dans la passion. */
  activities: number
  /** Identifiants des activités déjà faites au moins une fois (la collection, sans les étapes de parcours). */
  tried: string[]
  /** Étapes de parcours réussies (voir paths.ts). */
  steps: string[]
  /** Dessin : créations avec une photo. */
  drawings: number
  /** Écriture : mots écrits en tout. */
  words: number
  /** Musique, Cinéma : titres explorés notés. */
  explored: number
}

export interface StatsDTO {
  /** Minutons gagnés en tout (1 minute = 1 minuton). */
  totalCoins: number
  totalActivities: number
  /** Activités et minutons du mois en cours (fuseau horaire de l'utilisateur). */
  monthActivities: number
  monthCoins: number
  /** Par passion, seulement celles où une activité a été validée. */
  byPassion: PassionStatsDTO[]
  /** Les mots du jour faits ce mois-ci (identifiants `defi-<passion>-<jour>`, voir monthly.ts). */
  challenge: string[]
}

export interface ProposalDTO {
  id: string
  activityId: string
  passion: PassionId
  /** L’humeur éventuellement choisie ; null pour les parcours sans humeur. */
  mood: MoodId | null
  duration: Duration
  /** Texte de l'activité (typographie française appliquée). */
  text: string
  /** Introduction dont le ton dépend du mood (pour une leçon : une phrase d'encouragement). */
  intro: string
  extra: ActivityExtra | null
  createdAt: string
  /** À partir de quand valider sans preuve est possible (voir rules.ts). */
  unlockAt: string
}

export interface CompletionDTO {
  id: string
  activityId: string
  passion: PassionId
  mood: MoodId | null
  duration: Duration
  activityText: string
  extra: ActivityExtra | null
  coins: number
  /** Écriture : le texte produit. */
  text: string | null
  /** Musique, Cinéma : ce qui a été exploré (facultatif). */
  exploredTitle: string | null
  /** Dessin : URL signée de la photo. */
  photoUrl: string | null
  /** Dessin enregistré sans photo : une photo envoyée au bot viendra s'y ranger. */
  photoPending: boolean
  /** Ce que l'utilisateur a pensé de l'activité, s'il l'a noté. */
  rating: ActivityRating | null
  /** Le projet où la création est rangée, s'il y en a un. */
  projectId: string | null
  createdAt: string
}

/** Un projet : des créations d'une passion rangées ensemble, avec un objectif si on veut. */
export interface ProjectDTO {
  id: string
  passion: PassionId
  name: string
  /** Objectif : nombre de créations (null : sans objectif). */
  goal: number | null
  creations: number
  /** Minutons gagnés avec les créations du projet. */
  minutes: number
  /** Écriture : mots écrits dans le projet. */
  words: number
  /** Dessin : la dernière photo du projet, en couverture. */
  coverUrl: string | null
  createdAt: string
  finishedAt: string | null
}

/* ------------------------------- Requêtes -------------------------------- */

export interface UpdateThemeRequest {
  theme: AppTheme
}

/** Le niveau dans une passion qui le demande (page « Ton niveau »). */
export interface UpdateSkillRequest {
  passion: PassionId
  level: SkillLevel
}

export interface UpdateSettingsRequest {
  tutorialCompleted?: true
  remindersEnabled?: boolean
  scrollMoment?: ScrollMoment
}

/** Un avis écrit, envoyé depuis l'app. */
export interface FeedbackRequest {
  message: string
  /** D'où vient l'avis (écran, activité…), pour le relire dans son contexte. */
  context?: string
}

export interface RateCompletionRequest {
  rating: ActivityRating
}

export interface EventRequest {
  name: AppEventName
  /** Détails sans texte libre (identifiants, nombres). */
  data?: Record<string, string | number | boolean>
}

export interface UpdatePassionsRequest {
  passions: PassionId[]
}

export interface CreateProposalRequest {
  passion: PassionId
  /** Facultatif : le parcours envie de scroller ne demande plus l’humeur. */
  mood?: MoodId
  duration: Duration
  /** « Une autre idée » : la proposition affichée, à remplacer. */
  replacing?: string
  /** Une étape de parcours à jouer (sa passion et sa durée doivent correspondre). */
  /** An explicitly selected catalog activity, a lesson, or a daily word. */
  step?: string
  /** « Pas de son autour de toi » : seulement des activités qui se font sans écouter. */
  quiet?: boolean
}

/**
 * Validation d'une activité. Envoyée en JSON, ou en multipart/form-data
 * quand une photo (champ `photo`) accompagne un dessin.
 */
export interface CompleteRequest {
  proposalId: string
  text?: string
  exploredTitle?: string
  /** Leçon de piano : la mélodie a été jouée jusqu'au bout sur le clavier de l'appli (elle vaut preuve, sans attendre). */
  played?: boolean
  /** Ranger tout de suite la création dans ce projet. */
  projectId?: string
}

export interface CreateProjectRequest {
  passion: PassionId
  name: string
  goal?: number | null
}

export interface UpdateProjectRequest {
  name?: string
  goal?: number | null
  /** Terminer (true) ou rouvrir (false) le projet. */
  finished?: boolean
}

/** Ranger une création dans un projet (null : la sortir de son projet). */
export interface AssignProjectRequest {
  projectId: string | null
}

/* ------------------------------- Réponses -------------------------------- */

export interface MeResponse {
  shop?: import('./shop.ts').ShopState
  user: UserDTO
  stats: StatsDTO
  /** Activité proposée mais pas encore validée, à reprendre. */
  openProposal: ProposalDTO | null
  serverTime: string
  /** Identifiant du bot (pour les liens d'invitation), s'il est connu. */
  botUsername: string | null
  projects: ProjectDTO[]
}

export interface UserResponse {
  user: UserDTO
}

export interface ProposalResponse {
  proposal: ProposalDTO
  serverTime: string
}

export interface CompleteResponse {
  completion: CompletionDTO
  coinsEarned: number
  stats: StatsDTO
}

export interface CompletionResponse {
  completion: CompletionDTO
}

export interface ProjectsResponse {
  projects: ProjectDTO[]
}

export interface ProjectDetailResponse {
  project: ProjectDTO
  /** Les créations du projet, de la plus ancienne à la plus récente. */
  items: CompletionDTO[]
}

/** Ranger une création renvoie la création et la liste des projets à jour. */
export interface AssignProjectResponse {
  completion: CompletionDTO
  projects: ProjectDTO[]
}

/** Ce qui fait la signature d'une passion (détail de la progression). */
export interface PassionDetailResponse {
  passion: PassionId
  /** Dessin : le premier et le dernier dessin en photo (avant / après). */
  firstDrawing: CompletionDTO | null
  lastDrawing: CompletionDTO | null
  /** Écriture : le texte le plus long (en mots). */
  longestText: { words: number; completion: CompletionDTO } | null
  /** Musique, Cinéma : les titres explorés, du plus récent au plus ancien. */
  titles: { title: string; createdAt: string }[]
}

export interface CompletionsPage {
  items: CompletionDTO[]
  nextCursor: string | null
}

export type ApiErrorCode =
  | 'unauthorized'
  | 'locked'
  | 'no_quiet'
  | 'invalid_request'
  | 'not_found'
  | 'already_completed'
  | 'too_early'
  | 'proof_required'
  | 'photo_failed'
  | 'internal'

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string }
}
