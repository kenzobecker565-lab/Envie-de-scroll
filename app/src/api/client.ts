/**
 * Appels à l'API du serveur (même origine : /api).
 * Chaque requête porte les initData Telegram, que le serveur vérifie.
 */

import type {
  ActivityRating,
  ApiErrorBody,
  AssignProjectResponse,
  CreateProjectRequest,
  PassionDetailResponse,
  ProjectDetailResponse,
  ProjectsResponse,
  UpdateProjectRequest,
  AppEventName,
  AppTheme,
  ApiErrorCode,
  CompleteResponse,
  CompletionResponse,
  CompletionsPage,
  CreateProposalRequest,
  MeResponse,
  PassionId,
  ProposalResponse,
  UpdateSettingsRequest,
  UpdateSkillRequest,
  UserResponse,
} from '@scroll-up/shared'
import { telegram } from '../telegram/webApp.ts'

export class ApiError extends Error {
  readonly code: ApiErrorCode | 'network'
  readonly status: number

  constructor(code: ApiErrorCode | 'network', message: string, status = 0) {
    super(message)
    this.code = code
    this.status = status
  }
}

/**
 * Développement hors Telegram : identité factice, acceptée seulement par un
 * serveur lancé avec DEV_AUTH. `?dev_user=2` dans l'adresse change d'identité.
 */
function devUser(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('dev_user')
  return fromUrl && /^\d{1,15}$/.test(fromUrl) ? fromUrl : '1'
}

function authorization(): string | undefined {
  if (telegram?.initData) return `tma ${telegram.initData}`
  if (import.meta.env.DEV) return `dev ${devUser()}`
  return undefined
}

function timezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return undefined
  }
}

export const canAuthenticate = () => authorization() !== undefined

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const auth = authorization()
  if (auth) headers.set('Authorization', auth)
  const zone = timezone()
  if (zone) headers.set('X-Timezone', zone)
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch {
    throw new ApiError('network', 'La connexion a flanché. Vérifie ton réseau et réessaie.')
  }
  const body = (await response.json().catch(() => null)) as unknown
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error
    throw new ApiError(error?.code ?? 'internal', error?.message ?? 'Oups, quelque chose s’est mal passé.', response.status)
  }
  return body as T
}

export const api = {
  testers: (page = 1, q = '') => call<import('@scroll-up/shared').TestersResponse>(`/admin/testers?page=${page}&q=${encodeURIComponent(q)}`),
  learning:()=>call<{items:import('@scroll-up/shared').LearningRecord[]}>('/learning'),
  learningEntry:(id:string)=>call<import('@scroll-up/shared').LearningRecord>(`/learning/${encodeURIComponent(id)}`),
  setLearningReview:(id:string,review:boolean)=>call<import('@scroll-up/shared').LearningRecord>(`/learning/${encodeURIComponent(id)}/review`,{method:'PATCH',body:JSON.stringify({review})}),
  saveLearning:(id:string,lessonId:string,work:import('@scroll-up/shared').LearningWork)=>call<import('@scroll-up/shared').LearningRecord>(`/learning/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify({lessonId,work})}),
  shop: () => call<import('@scroll-up/shared').ShopState>('/shop'),
  claimShopTestCredit: () => call<import('@scroll-up/shared').ShopState>('/shop/test-credit', { method: 'POST' }),
  redeemSkinCode: (code: string) => call<import('@scroll-up/shared').ShopState & { redeemedItemId: string }>('/shop/codes', { method: 'POST', body: JSON.stringify({ code }) }),
  buyItem: (itemId: string) => call<import('@scroll-up/shared').ShopState>('/shop/purchases', { method: 'POST', body: JSON.stringify({ itemId }) }),
  equipItem: (category: import('@scroll-up/shared').ShopCategory, itemId: string | null) => call<import('@scroll-up/shared').ShopState>('/shop/equipment', { method: 'PUT', body: JSON.stringify({ category, itemId }) }),
  bonusMelody: (id: string) => call<{ melody: import('@scroll-up/shared').Melody }>(`/shop/piano/${id}`),
  me: () => call<MeResponse>('/me'),

  updateTheme: (theme: AppTheme) => call<UserResponse>('/me/theme', { method: 'PUT', body: JSON.stringify({ theme }) }),
  updatePassions: (passions: PassionId[]) => call<UserResponse>('/me/passions', { method: 'PUT', body: JSON.stringify({ passions }) }),

  propose: (request: CreateProposalRequest) => call<ProposalResponse>('/proposals', { method: 'POST', body: JSON.stringify(request) }),

  complete: ({ proposalId, text, exploredTitle, played, photo, projectId, workshop, sport }: { proposalId: string; text?: string; exploredTitle?: string; played?: boolean; photo?: Blob; projectId?: string; sport?: import('@scroll-up/shared').SportSubmission; workshop?: import('@scroll-up/shared').WorkshopSubmission }) => {
    if (photo) {
      const form = new FormData()
      form.set('proposalId', proposalId)
      if (projectId) form.set('projectId', projectId)
      form.set('photo', photo, 'dessin.jpg')
      return call<CompleteResponse>('/completions', { method: 'POST', body: form })
    }
    return call<CompleteResponse>('/completions', { method: 'POST', body: JSON.stringify({ proposalId, text, exploredTitle, played, projectId, workshop, sport }) })
  },

  completion: (id:string) => call<CompletionResponse>(`/completions/${encodeURIComponent(id)}`),
  completions: (cursor?: string, passion?: PassionId, limit=12) =>
    call<CompletionsPage>(`/completions?limit=${limit}${passion ? `&passion=${passion}` : ''}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`),

  rate: (completionId: string, rating: ActivityRating) =>
    call<CompletionResponse>(`/completions/${encodeURIComponent(completionId)}/rating`, { method: 'PUT', body: JSON.stringify({ rating }) }),

  assignProject: (completionId: string, projectId: string | null) =>
    call<AssignProjectResponse>(`/completions/${encodeURIComponent(completionId)}/project`, { method: 'PUT', body: JSON.stringify({ projectId }) }),

  /** La signature d'une passion : avant / après, texte le plus long, titres explorés. */
  passion: (passion: PassionId) => call<PassionDetailResponse>(`/passions/${passion}`),

  projects: () => call<ProjectsResponse>('/projects'),
  project: (id: string) => call<ProjectDetailResponse>(`/projects/${encodeURIComponent(id)}`),
  createProject: (request: CreateProjectRequest) => call<ProjectDetailResponse>('/projects', { method: 'POST', body: JSON.stringify(request) }),
  updateProject: (id: string, request: UpdateProjectRequest) =>
    call<ProjectDetailResponse>(`/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(request) }),
  deleteProject: (id: string) => call<null>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  /** Le niveau dans une passion qui le demande (Piano). */
  updateSkill: (request: UpdateSkillRequest) => call<UserResponse>('/me/skills', { method: 'PUT', body: JSON.stringify(request) }),

  /** Efface toutes les données du compte : la prochaine ouverture repart de l'inscription. */
  deleteMe: () => call<null>('/me', { method: 'DELETE' }),

  updateSettings: (settings: UpdateSettingsRequest) => call<UserResponse>('/me/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  feedback: (message: string, context?: string) => call<{ ok: true }>('/feedback', { method: 'POST', body: JSON.stringify({ message, context }) }),
}

/**
 * Suivi d'usage pendant la phase de test : où le parcours se perd. Aucun
 * texte libre n'est envoyé, et un échec ne gêne jamais l'utilisateur.
 */
export function track(name: AppEventName, data?: Record<string, string | number | boolean>): void {
  if (!canAuthenticate()) return
  void call<unknown>('/events', { method: 'POST', body: JSON.stringify({ name, data }) }).catch(() => {})
}
