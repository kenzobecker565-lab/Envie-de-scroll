/**
 * Le raccourci « Scroll-up » sur l'écran d'accueil du téléphone (Telegram 8+) :
 * ce que la ligne des réglages affiche selon l'état, et si on peut la toucher.
 * Toujours visible dans Telegram, pour que personne ne cherche un bouton absent :
 * quand l'ajout est impossible ici, elle dit pourquoi et quoi faire.
 */

/** `silent` : la demande est partie, mais le téléphone n'a rien affiché ni ajouté. */
export type HomeScreenState = 'checking' | 'missed' | 'unknown' | 'adding' | 'added' | 'unsupported' | 'failed' | 'silent'

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

/**
 * La fenêtre de confirmation native de Telegram (titre de 64 caractères au
 * plus, message de 256). Son bouton « Ajouter » compte comme un toucher sur
 * Telegram lui-même : sans lui, Telegram Android ignore la demande.
 */
export function homeScreenConfirm(platform: string): { title: string; message: string; button: string } {
  return {
    title: 'Scroll-up sur ton écran d’accueil',
    message:
      platform === 'ios'
        ? 'Telegram va ouvrir une page dans Safari pour poser l’icône de Scroll-up à côté de tes autres apps.'
        : 'Une icône à côté de tes autres apps, pour ouvrir Scroll-up d’un geste. Ton téléphone va te demander de confirmer.',
    button: 'Ajouter',
  }
}

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
  if (state === 'silent') {
    // Telegram transmet la demande au téléphone, qui la bloque sans rien dire tant que
    // Telegram n'a pas le droit de créer des raccourcis (fréquent chez Xiaomi, Huawei, Oppo…).
    return {
      title: ADD,
      description:
        'Rien ne s’est affiché ? Autorise Telegram à créer des raccourcis : Paramètres du téléphone › Applications › Telegram › Autorisations (« Raccourcis sur l’écran d’accueil »). Puis touche ici pour réessayer.',
      action: true,
      done: false,
    }
  }
  if (state === 'adding') {
    // Sur iPhone, Telegram ouvre une page dans Safari ; ailleurs, le téléphone demande de confirmer.
    const description = platform === 'ios' ? 'Termine dans la page ouverte par Telegram pour poser l’icône.' : 'Confirme dans la fenêtre de ton téléphone.'
    return { title: ADD, description, action: false, done: false }
  }
  return { title: ADD, description: 'Une icône juste à côté de tes autres apps : là où ton pouce a ses habitudes.', action: true, done: false }
}
