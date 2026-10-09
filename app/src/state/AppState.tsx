/**
 * État de l'app : l'utilisateur (renvoyé par /api/me), la pile d'écrans et
 * les choix du parcours en cours (mood, temps, passion, activité proposée).
 */

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import type { CompleteResponse, Duration, MeResponse, MoodId, PassionId, ProjectDTO, ProposalDTO, StatsDTO, UserDTO } from '@scroll-up/shared'

export type Route =
  | { name: 'welcome' }
  | { name: 'passions'; mode: 'onboarding' | 'edit' }
  | { name: 'moment' }
  /** « Ton niveau » dans une passion qui le demande (Piano), à l'inscription ou plus tard. */
  | { name: 'skill'; passion: PassionId; mode: 'onboarding' | 'edit' }
  | { name: 'home' }
  | { name: 'signal' }
  | { name: 'time' }
  | { name: 'passion' }
  | { name: 'activity' }
  | { name: 'proof' }
  | { name: 'done' }
  | { name: 'progress' }
  | { name: 'gallery'; passion?: PassionId }
  | { name: 'shop'; category?: import('@scroll-up/shared').ShopCategory; library?: boolean }
  | { name: 'bonusPiano'; itemId: string }
  | { name: 'learningLesson'; lessonId: string; entryId?:string }
  | { name: 'learningNotebooks'; passion?:import('@scroll-up/shared').LearningPassion; review?:boolean }
  | { name: 'atelier'; focus?:string }
  | { name: 'learn' }
  | { name: 'learnPassion'; passion: PassionId }
  | { name: 'passionHub' }
  | { name: 'passionSpace'; passion: PassionId }
  | { name: 'profile' }
  | { name: 'settings' }
  | { name: 'testers' }
  | { name: 'path'; pathId: string }
  | { name: 'challenge' }

export interface Flow {
  mood?: MoodId
  duration?: Duration
  passion?: PassionId
  /** Passion imposée d'avance (« Une activité Dessin » depuis la progression) : pas d'écran de choix. */
  fixedPassion?: PassionId
  /** Étape de parcours à jouer : sa passion et sa durée sont fixées, pas de « Une autre idée ». */
  fixedStep?: string
  /** Projet où ranger la création (lancée depuis le projet). */
  projectId?: string
  proposal?: ProposalDTO
  /** Dessin : « Pas de papier ? » ouvre la feuille à dessiner au doigt plutôt que la photo. */
  pad?: boolean
  /** Musique, Cinéma : « Pas de son autour de toi ? », seulement des activités sans écoute. */
  quiet?: boolean
  /** L'idée choisie sous l'activité (un album, un film…) : elle pré-remplit « Qu'as-tu exploré ? ». */
  idea?: { proposalId: string; text: string }
  /** Écart entre l'horloge du serveur et celle du téléphone (ms). */
  clockOffset: number
}

export interface DoneResult {
  response: CompleteResponse
  /** Les chiffres d'avant la validation : pour faire rouler le compteur, repérer palier et niveau. */
  previousStats: StatsDTO
  /** Dessin enregistré sans photo : on rappelle qu'on peut l'envoyer au bot. */
  photoPending: boolean
  /** Options à conserver quand on continue dans la même passion. */
  continuation?: Pick<Flow, 'quiet' | 'projectId'>
}

interface State {
  tutorialOpen: boolean
  me: MeResponse
  stack: Route[]
  /** 1 : on avance (l'écran arrive de la droite), -1 : on revient. */
  direction: 1 | -1
  flow: Flow
  done?: DoneResult
}

type Action =
  | { type: 'tutorial'; open: boolean }
  | { type: 'tutorialCompleted' }
  | { type: 'push'; route: Route }
  | { type: 'back' }
  | { type: 'replace'; route: Route }
  | { type: 'reset'; stack: Route[]; direction?: 1 | -1 }
  | { type: 'flow'; flow: Partial<Flow> }
  | { type: 'newFlow'; flow?: Partial<Flow> }
  | { type: 'user'; user: UserDTO }
  | { type: 'shop'; shop: import('@scroll-up/shared').ShopState }
  | { type: 'stats'; stats: StatsDTO }
  | { type: 'projects'; projects: ProjectDTO[] }
  | { type: 'openProposal'; proposal: ProposalDTO | null }
  | { type: 'done'; done: DoneResult }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'tutorial': return { ...state, tutorialOpen: action.open }
    case 'tutorialCompleted': return { ...state, tutorialOpen: false, me: { ...state.me, user: { ...state.me.user, tutorialCompleted: true } } }
    case 'push':
      return { ...state, stack: [...state.stack, action.route], direction: 1 }
    case 'back':
      return state.stack.length > 1 ? { ...state, stack: state.stack.slice(0, -1), direction: -1 } : state
    case 'replace':
      return { ...state, stack: [...state.stack.slice(0, -1), action.route], direction: 1 }
    case 'reset':
      return { ...state, stack: action.stack, direction: action.direction ?? 1 }
    case 'flow':
      return { ...state, flow: { ...state.flow, ...action.flow } }
    case 'newFlow':
      return { ...state, flow: { clockOffset: state.flow.clockOffset, ...action.flow } }
    case 'user':
      return { ...state, me: { ...state.me, user: action.user } }
    case 'shop':
      return { ...state, me: { ...state.me, shop: action.shop } }
    case 'stats':
      return { ...state, me: { ...state.me, stats: action.stats } }
    case 'projects':
      return { ...state, me: { ...state.me, projects: action.projects } }
    case 'openProposal':
      return { ...state, me: { ...state.me, openProposal: action.proposal } }
    case 'done':
      return { ...state, done: action.done }
  }
}

interface AppContextValue {
  state: State
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function initialStack(me: MeResponse): Route[] {
  return me.user.onboarded ? [{ name: 'home' }] : [{ name: 'welcome' }]
}

export function AppStateProvider({ me, children }: { me: MeResponse; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    me,
    tutorialOpen: false,
    stack: initialStack(me),
    direction: 1 as const,
    flow: { clockOffset: Date.parse(me.serverTime) - Date.now() },
  }))
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextValue {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppState hors de AppStateProvider')
  return context
}

export function useNavigation() {
  const { state, dispatch } = useAppState()
  const push = useCallback((route: Route) => dispatch({ type: 'push', route }), [dispatch])
  const back = useCallback(() => dispatch({ type: 'back' }), [dispatch])
  const replace = useCallback((route: Route) => dispatch({ type: 'replace', route }), [dispatch])
  const reset = useCallback((stack: Route[], direction?: 1 | -1) => dispatch({ type: 'reset', stack, direction }), [dispatch])
  return {
    route: state.stack.at(-1) ?? { name: 'home' },
    canGoBack: state.stack.length > 1,
    direction: state.direction,
    push,
    back,
    replace,
    reset,
  }
}
