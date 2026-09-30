/**
 * Contrat de l'API REST entre la Mini App et le serveur.
 *
 * Authentification : chaque requête porte l'en-tête
 *   Authorization: tma <initData brut de Telegram>
 * que le serveur vérifie avec le token du bot.
 */

import type { ActivityRating, AppEventName } from './feedback.ts'
import type { AppTheme } from './themes.ts'
import type { ActivityExtra, Duration, MoodId, PassionId } from './types.ts'

export interface UserDTO {
  id: string
  firstName: string
  passions: PassionId[]
  /** Vrai une fois les passions choisies. */
  onboarded: boolean
  /** Thème choisi dans l'app. */
  theme: AppTheme
  /** Relances du bot (vers 19 h, au plus une par jour). */
  remindersEnabled: boolean
}

export interface StatsDTO {
  totalCoins: number
  totalActivities: number
  /** Activités et pièces du mois en cours (fuseau horaire de l'utilisateur). */
  monthActivities: number
  monthCoins: number
}

export interface ProposalDTO {
  id: string
  activityId: string
  passion: PassionId
  mood: MoodId
  duration: Duration
  /** Texte de l'activité (typographie française appliquée). */
  text: string
  /** Introduction dont le ton dépend du mood. */
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
  mood: MoodId
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
  createdAt: string
}

/* ------------------------------- Requêtes -------------------------------- */

export interface UpdateThemeRequest {
  theme: AppTheme
}

export interface UpdateSettingsRequest {
  remindersEnabled?: boolean
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
  mood: MoodId
  duration: Duration
  /** « Une autre idée » : la proposition affichée, à remplacer. */
  replacing?: string
}

/**
 * Validation d'une activité. Envoyée en JSON, ou en multipart/form-data
 * quand une photo (champ `photo`) accompagne un dessin.
 */
export interface CompleteRequest {
  proposalId: string
  text?: string
  exploredTitle?: string
}

/* ------------------------------- Réponses -------------------------------- */

export interface MeResponse {
  user: UserDTO
  stats: StatsDTO
  /** Activité proposée mais pas encore validée, à reprendre. */
  openProposal: ProposalDTO | null
  serverTime: string
  /** Identifiant du bot (pour les liens d'invitation), s'il est connu. */
  botUsername: string | null
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

export interface CompletionsPage {
  items: CompletionDTO[]
  nextCursor: string | null
}

export type ApiErrorCode =
  | 'unauthorized'
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
