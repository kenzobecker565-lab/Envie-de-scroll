import type { UserDTO } from '@scroll-up/shared'

export type TourPose = 'welcome' | 'think' | 'idea' | 'draw' | 'write' | 'piano' | 'cheer' | 'wait'
/** La page où se joue l'étape : le tutoriel y emmène vraiment. */
export type TourPage = 'home' | 'atelier' | 'gallery' | 'passionHub' | 'learn' | 'shop' | 'profile'
export interface TourStep {
  page: TourPage
  /** Éléments mis en lumière (`data-tour-target`). Aucun : la carte s'affiche au centre, pour ce qui ne se voit pas sur l'accueil. */
  targets: readonly string[]
  /** Carte posée en bas, au-dessus des onglets, pour laisser voir la page. */
  dock?: boolean
  /** Opacité du voile : plus léger sur une page qu'on fait découvrir. */
  dim?: number
  chapter: string
  title: string
  text: string
  pose: TourPose
  /** Arrondi du halo, pour épouser les gros boutons. */
  radius?: number
}

/** Le tour complet de l'app, de l'envie de scroller jusqu'au bot Telegram. « Passer » reste possible à chaque étape. */
export const TOUR_STEPS: readonly TourStep[] = [
 {page:'home',targets:[],chapter:'Le principe',pose:'welcome',title:'Une envie. Une création.',text:'Quelques minutes suffisent pour dessiner, écrire, bouger ou découvrir quelque chose. Choisis ce qui te fait envie.'},
 {page:'home',targets:['swipe'],chapter:'À toi de choisir',pose:'idea',radius:30,title:'Ton temps, trois idées',text:'Touche « Je me lance », choisis 5, 15 ou 30 minutes, puis une des trois idées. Tu peux pratiquer dans l’app ou ailleurs.'},
 {page:'home',targets:['atelier'],chapter:'Ton espace',pose:'draw',title:'Tes créations restent avec toi',text:'Les activités terminées rejoignent ta galerie. Une séance inachevée ? Garde-la pour plus tard et retrouve-la sur l’accueil.'},
]

const key = (userId: string) => `scroll-up:tutorial:v1:${userId}`
/** Account flag is authoritative; local fallback covers an interrupted save. */
export function tutorialSeen(user: Pick<UserDTO, 'id' | 'tutorialCompleted'>): boolean {
  if (user.tutorialCompleted) return true
  try { return localStorage.getItem(key(user.id)) === 'done' } catch { return false }
}
export function rememberTutorial(userId: string) {
  try { localStorage.setItem(key(userId), 'done') } catch { /* Account persistence still applies. */ }
}

export interface TourRect { x: number; y: number; width: number; height: number }
export function tourCardPosition(rect: TourRect, viewport: { width: number; height: number }, cardHeight: number) {
  const maxTop = Math.max(16, viewport.height - cardHeight - 16)
  const below = rect.y + rect.height + 20
  const above = rect.y - cardHeight - 20
  const side = below <= maxTop ? 'below' : above >= 58 ? 'above' : 'below'
  // Below a target, leave a full Minuton beside the card, as in the approved mockup.
  const width = side === 'below' ? Math.min(320, viewport.width - 96) : Math.min(360, viewport.width - 32)
  const left = (viewport.width - width + (side === 'below' ? 64 : 0)) / 2
  const top = Math.max(16, Math.min(maxTop, side === 'below' ? below : above))
  const pointer = Math.max(26, Math.min(width - 26, rect.x + rect.width / 2 - left))
  const showPointer = side === 'below' ? top >= rect.y + rect.height + 8 : top + cardHeight <= rect.y - 8
  return { top, left, width, side, pointer, showPointer }
}

/** Carte centrée, pour une étape sans élément à montrer. */
export function tourCardCenter(viewport: { width: number; height: number }, cardHeight: number) {
  const width = Math.min(360, viewport.width - 32)
  // De la place au-dessus pour Minuton, qui dépasse de la carte.
  const top = Math.max(64, Math.round((viewport.height - cardHeight) / 2))
  return { top, left: (viewport.width - width) / 2, width, side: 'center' as const, pointer: 0, showPointer: false }
}

/** Carte posée en bas, juste au-dessus des onglets, pour laisser voir la page qu'on découvre. */
export function tourCardDock(viewport: { width: number; height: number }, cardHeight: number, navTop: number) {
  const width = Math.min(360, viewport.width - 32)
  const top = Math.max(64, Math.round(navTop - cardHeight - 14))
  return { top, left: (viewport.width - width) / 2, width, side: 'center' as const, pointer: 0, showPointer: false }
}
