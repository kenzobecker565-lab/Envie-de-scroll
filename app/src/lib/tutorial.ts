import type { UserDTO } from '@scroll-up/shared'

export type TourPose = 'welcome' | 'think' | 'idea' | 'draw' | 'write' | 'piano' | 'cheer' | 'wait'
export interface TourStep {
  /** Éléments mis en lumière (`data-tour-target`). Aucun : la carte s'affiche au centre, pour ce qui ne se voit pas sur l'accueil. */
  targets: readonly string[]
  chapter: string
  title: string
  text: string
  pose: TourPose
  /** Arrondi du halo, pour épouser les gros boutons. */
  radius?: number
}

/** Le tour complet de l'app, de l'envie de scroller jusqu'au bot Telegram. « Passer » reste possible à chaque étape. */
export const TOUR_STEPS: readonly TourStep[] = [
  { targets: [], chapter: 'Le principe', pose: 'welcome', title: 'Bienvenue sur Scroll-up', text: 'Ici, l’envie de scroller devient 5, 15 ou 30 minutes de création. Voici l’app en une minute ; tu peux passer quand tu veux.' },
  { targets: ['swipe'], chapter: 'Le principe', pose: 'idea', radius: 30, title: 'Ton bouton anti-scroll', text: 'Quand ton pouce te démange, touche « J’ai envie de scroll » : choisis ton temps et une passion, on te propose une activité.' },
  { targets: [], chapter: 'Créer', pose: 'draw', title: 'Pendant une activité', text: 'La consigne reste sous tes yeux. Tu bloques ? « Un coup de pouce » donne des pistes, « Une autre idée » en tire une nouvelle.' },
  { targets: [], chapter: 'Créer', pose: 'write', title: 'Garde une trace', text: 'Dessine au doigt ou photographie ton dessin, écris dans ton carnet, joue au clavier, suis le chrono du sport ou mène l’enquête. Tout rejoint ton atelier.' },
  { targets: ['wallet'], chapter: 'Créer', pose: 'cheer', title: '1 minute = 1 minuton', text: 'Chaque minute de création rapporte un minuton. Énigmes et français : la durée entière si tout est juste, sinon tes minutes de recherche.' },
  { targets: ['word'], chapter: 'Chaque jour', pose: 'idea', title: 'Le mot du jour', text: 'Un mot à dessiner ou à écrire, chaque jour. Pas de jour raté : les mots du mois se rattrapent quand tu veux.' },
  { targets: ['atelier'], chapter: 'Chaque jour', pose: 'cheer', radius: 24, title: 'Chez Minuton', text: 'Tes créations s’accrochent dans ton atelier. Ouvre-les en entier et mets ta préférée à l’honneur.' },
  { targets: ['passions-tab'], chapter: 'Explorer', pose: 'think', title: 'L’espace de chaque passion', text: 'Dans Passions, chaque passion a son coin : activités par durée, énigmes, séances de sport, révisions, morceaux au piano.' },
  { targets: ['learn'], chapter: 'Explorer', pose: 'write', title: 'Apprendre à ton rythme', text: 'Des leçons courtes et indépendantes : comprendre, essayer, pratiquer. Tes essais restent dans tes carnets.' },
  { targets: ['shop'], chapter: 'Explorer', pose: 'cheer', title: 'La boutique de Minuton', text: 'Dépense tes minutons en tenues pour Minuton. Acheter ne fait jamais baisser tes niveaux ni tes badges.' },
  { targets: ['profile'], chapter: 'Ton espace', pose: 'welcome', title: 'Ton profil', text: 'Tes niveaux, tes badges et tes réglages : passions, musique d’ambiance, rappels, et un bouton pour nous donner ton avis.' },
  { targets: [], chapter: 'Ton espace', pose: 'wait', title: 'Scroll-up vit dans Telegram', text: 'Le bot t’envoie un petit rappel au moment où tu scrolles d’habitude, jamais les jours où tu as créé. Un dessin sans photo ? Envoie-la-lui.' },
  { targets: [], chapter: 'Ton espace', pose: 'cheer', title: 'Ici, rien ne se perd', text: 'Pas de série à tenir, pas de reproche : chaque création compte. Ce tutoriel t’attend dans tes réglages si tu veux le revoir.' },
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
