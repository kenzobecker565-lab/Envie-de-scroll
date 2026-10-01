/**
 * Le raccourci « Scroll-up » sur l'écran d'accueil du téléphone (Telegram 8+) :
 * ce que la ligne des réglages affiche selon l'état, et si on peut la toucher.
 * Toujours visible dans Telegram, pour que personne ne cherche un bouton absent :
 * quand l'ajout est impossible ici, elle dit pourquoi et quoi faire.
 */

export type HomeScreenState = 'checking' | 'missed' | 'unknown' | 'adding' | 'added' | 'unsupported' | 'failed'

export interface HomeScreenView {
  title: string
  description: string
  /** La ligne lance l'ajout quand on la touche. */
  action: boolean
  /** L'icône est déjà là. */
  done: boolean
}

/** Telegram sur ordinateur ou dans le navigateur : pas d'écran d'accueil où poser une icône. */
const DESKTOP_PLATFORMS = new Set(['tdesktop', 'macos', 'web', 'weba', 'webk', 'unigram'])

const ADD = 'Ajouter à l’écran d’accueil'

export function homeScreenView(state: HomeScreenState, { supported, platform }: { supported: boolean; platform: string }): HomeScreenView {
  if (state === 'added') return { title: 'Sur ton écran d’accueil', description: 'Scroll-up est à portée de pouce. Bien joué !', action: false, done: true }
  if (DESKTOP_PLATFORMS.has(platform)) {
    return { title: ADD, description: 'Sur ordinateur, Telegram ne sait pas le faire. Ouvre Scroll-up depuis ton téléphone et reviens ici.', action: false, done: false }
  }
  if (!supported) {
    return { title: ADD, description: 'Mets Telegram à jour : les versions récentes savent poser Scroll-up sur ton écran d’accueil.', action: false, done: false }
  }
  if (state === 'unsupported' || state === 'failed') {
    return {
      title: ADD,
      description: 'Ton téléphone ne l’accepte pas depuis Telegram. Astuce : épingle la conversation avec le bot en haut de tes discussions.',
      action: false,
      done: false,
    }
  }
  if (state === 'adding') return { title: ADD, description: 'Confirme dans la fenêtre qui vient de s’ouvrir.', action: false, done: false }
  return { title: ADD, description: 'Une icône juste à côté de tes autres apps : là où ton pouce a ses habitudes.', action: true, done: false }
}
