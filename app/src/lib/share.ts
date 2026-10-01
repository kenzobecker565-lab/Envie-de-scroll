/**
 * Partager Scroll-up : une création de la galerie, ou une invitation.
 * Dans Telegram, on ouvre le sélecteur de conversation de Telegram ; ailleurs,
 * le partage du système (ou un nouvel onglet).
 */

import { getPassion, type CompletionDTO, type ProjectDTO } from '@scroll-up/shared'
import { formatMinutes } from './format.ts'
import { telegram } from '../telegram/webApp.ts'

/** Lien vers le bot (ou, faute de mieux, vers l'app). */
export function appLink(botUsername: string | null): string {
  return botUsername ? `https://t.me/${botUsername}` : window.location.origin
}

function shareLink(text: string, url: string): void {
  const link = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
  if (telegram?.openTelegramLink) {
    telegram.openTelegramLink(link)
    return
  }
  if (typeof navigator.share === 'function') {
    navigator.share({ text, url }).catch(() => {})
    return
  }
  window.open(link, '_blank', 'noopener')
}

export const INVITE_TEXT =
  'Quand ton pouce te démange, Scroll-up te propose une petite activité créative à la place (dessin, écriture, musique, cinéma). Je teste, essaie aussi :'

export function invite(botUsername: string | null): void {
  shareLink(INVITE_TEXT, appLink(botUsername))
}

/** « J'ai transformé une envie de scroller en 15 min de dessin. » */
export function creationText(item: Pick<CompletionDTO, 'duration' | 'passion'>): string {
  const passion = getPassion(item.passion).label.toLowerCase().replace(' / animation', '')
  const of = /^[aeiouyéèê]/.test(passion) ? 'd’' : 'de '
  return `J’ai transformé une envie de scroller en ${item.duration} min ${of}${passion}. Et toi ?`
}

export function shareCreation(item: Pick<CompletionDTO, 'duration' | 'passion'>, botUsername: string | null): void {
  shareLink(creationText(item), appLink(botUsername))
}

/** « J'ai terminé mon projet « Ma nouvelle » sur Scroll-up : 6 créations, 2 h 15 de création. » */
export function projectText(project: Pick<ProjectDTO, 'name' | 'creations' | 'minutes'>): string {
  const creations = `${project.creations} création${project.creations > 1 ? 's' : ''}`
  return `J’ai terminé mon projet «\u00A0${project.name}\u00A0» sur Scroll-up\u00A0: ${creations}, ${formatMinutes(project.minutes)} de création. Et toi ?`
}

export function shareProject(project: Pick<ProjectDTO, 'name' | 'creations' | 'minutes'>, botUsername: string | null): void {
  shareLink(projectText(project), appLink(botUsername))
}
