import type { UserDTO } from '@scroll-up/shared'

export const TOUR_STEPS = [
  { targets: ['swipe'], title: 'Ton premier moment pour toi', text: 'Envie de scroller ? Choisis ton temps et une passion : on te propose une activité.' },
  { targets: ['word'], title: 'Ton rendez-vous créatif', text: 'Un nouveau mot chaque jour, à dessiner ou à écrire.' },
  { targets: ['passions', 'learn'], title: 'Explore ce que tu aimes', text: 'Explore tes activités dans Passions. Dans Apprendre, suis des leçons indépendantes : tes essais restent dans tes carnets.' },
  { targets: ['atelier'], title: 'Bienvenue chez Minuton', text: 'Tes créations remplissent ton atelier. Ouvre-les en entier et mets ta préférée à l’honneur.' },
  { targets: ['wallet', 'shop'], title: 'Donne du style à Minuton', text: 'Termine des activités, gagne des minutons et personnalise Minuton dans la boutique.' },
] as const

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
