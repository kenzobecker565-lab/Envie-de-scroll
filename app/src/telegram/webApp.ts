/**
 * ============================================================================
 *  SDK TELEGRAM MINI APPS
 * ============================================================================
 *
 * Le script https://telegram.org/js/telegram-web-app.js (chargé dans
 * index.html) expose `window.Telegram.WebApp`. Tout l'accès à Telegram passe
 * par ce module : hors de Telegram (navigateur de développement), chaque
 * fonction devient simplement sans effet.
 * https://core.telegram.org/bots/webapps
 */

type HapticImpact = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'
type HapticNotification = 'error' | 'success' | 'warning'

interface BottomButton {
  text: string
  isVisible: boolean
  isActive: boolean
  isProgressVisible: boolean
  setParams(params: {
    text?: string
    color?: string
    text_color?: string
    is_active?: boolean
    is_visible?: boolean
    has_shine_effect?: boolean
  }): BottomButton
  onClick(callback: () => void): BottomButton
  offClick(callback: () => void): BottomButton
  showProgress(leaveActive?: boolean): BottomButton
  hideProgress(): BottomButton
  show(): BottomButton
  hide(): BottomButton
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: { user?: { id: number; first_name: string; allows_write_to_pm?: boolean } }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  isExpanded: boolean
  ready(): void
  expand(): void
  close(): void
  isVersionAtLeast(version: string): boolean
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  setBottomBarColor?(color: string): void
  disableVerticalSwipes?(): void
  requestWriteAccess?(callback?: (granted: boolean) => void): void
  openTelegramLink?(url: string): void
  openLink?(url: string): void
  addToHomeScreen?(): void
  requestFullscreen?(): void
  exitFullscreen?(): void
  isFullscreen?: boolean
  checkHomeScreenStatus?(callback: (status: 'unsupported' | 'unknown' | 'added' | 'missed') => void): void
  showPopup?(
    params: { title?: string; message: string; buttons?: { id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string }[] },
    callback?: (buttonId: string) => void,
  ): void
  onEvent(event: string, handler: () => void): void
  offEvent(event: string, handler: () => void): void
  BackButton: {
    isVisible: boolean
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
  MainButton: BottomButton
  HapticFeedback: {
    impactOccurred(style: HapticImpact): void
    notificationOccurred(type: HapticNotification): void
    selectionChanged(): void
  }
}

/** Les événements bruts de Telegram, pour ceux que WebApp ne relaie pas (home_screen_failed). */
type RawEventHandler = (eventType: string, eventData: unknown) => void
interface TelegramWebView {
  onEvent(eventType: string, callback: RawEventHandler): void
  offEvent(eventType: string, callback: RawEventHandler): void
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp; WebView?: TelegramWebView }
  }
}

const candidate = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

/** L'app tourne-t-elle vraiment dans Telegram ? (initData non vides) */
export const telegram: TelegramWebApp | undefined = candidate?.initData ? candidate : undefined
export const isTelegram = telegram !== undefined

function atLeast(version: string): boolean {
  try {
    return telegram?.isVersionAtLeast(version) ?? false
  } catch {
    return false
  }
}

export const supports = {
  backButton: atLeast('6.1'),
  mainButton: atLeast('6.0'),
  haptics: atLeast('6.1'),
  headerColor: atLeast('6.9'),
  bottomBarColor: atLeast('7.10'),
  verticalSwipes: atLeast('7.7'),
  shine: atLeast('7.10'),
  writeAccess: atLeast('6.9'),
  popup: atLeast('6.2'),
  homeScreen: atLeast('8.0'),
  fullscreen: atLeast('8.0'),
}

/** À appeler au démarrage : l'app est prête, en plein écran vertical. */
export function initTelegram(): void {
  if (!telegram) return
  telegram.ready()
  telegram.expand()
  // Évite que le glissement vers le bas (défilement de la galerie) ferme l'app.
  if (supports.verticalSwipes) telegram.disableVerticalSwipes?.()
}

/* ------------------------------- Plein écran ------------------------------- */

/**
 * Le plein écran de Telegram (8.0 et plus) : plus d'en-tête Telegram, toute
 * la hauteur pour l'app (le piano en grand, en paysage). Sans effet ailleurs.
 */
export function enterFullscreen(): void {
  if (!telegram || !supports.fullscreen || telegram.isFullscreen) return
  try {
    telegram.requestFullscreen?.()
  } catch {
    // Pas de plein écran (ordinateur, version trop ancienne) : l'app reste comme elle est.
  }
}

export function exitFullscreen(): void {
  if (!telegram || !supports.fullscreen || !telegram.isFullscreen) return
  try {
    telegram.exitFullscreen?.()
  } catch {
    // Rien à faire.
  }
}

/* ------------------------- Raccourci sur l'écran d'accueil ------------------------- */

export type HomeScreenStatus = 'unsupported' | 'unknown' | 'added' | 'missed'

/**
 * Où en est l'icône de Scroll-up sur l'écran d'accueil (Telegram 8+). Certains
 * téléphones ne répondent jamais : au bout de `timeoutMs`, on considère l'état
 * inconnu (l'ajout reste proposé).
 */
export function checkHomeScreen(timeoutMs = 1500): Promise<HomeScreenStatus> {
  return new Promise((resolve) => {
    if (!telegram?.checkHomeScreenStatus || !supports.homeScreen) return resolve('unsupported')
    const timer = window.setTimeout(() => resolve('unknown'), timeoutMs)
    try {
      telegram.checkHomeScreenStatus((status) => {
        window.clearTimeout(timer)
        resolve(status)
      })
    } catch {
      window.clearTimeout(timer)
      resolve('unsupported')
    }
  })
}

export type HomeScreenResult = 'added' | 'failed' | 'cancelled'

/**
 * Demande à Telegram de poser l'icône sur l'écran d'accueil.
 *
 * Telegram Android ignore la demande si elle ne suit pas de près un toucher
 * sur un élément de Telegram lui-même (un bouton dans la page ne compte pas) :
 * on passe donc d'abord par une fenêtre de confirmation native (`confirm`),
 * dont le bouton « Ajouter » ouvre ensuite la fenêtre du téléphone.
 *
 * `onSent` : la demande part (après « Ajouter »). `onDone` : « added » quand
 * Telegram confirme, « failed » si l'appareil refuse, « cancelled » si on
 * renonce dans la fenêtre. Certains téléphones ne confirment jamais : rien
 * n'arrive alors (revérifier avec checkHomeScreen). Renvoie de quoi tout arrêter.
 */
export function requestHomeScreen({
  confirm,
  onSent,
  onDone,
}: {
  confirm?: { title: string; message: string; button: string }
  onSent?: () => void
  onDone: (result: HomeScreenResult) => void
}): () => void {
  const app = telegram
  if (!app?.addToHomeScreen || !supports.homeScreen) {
    onDone('failed')
    return () => {}
  }
  const webView = window.Telegram?.WebView
  let finished = false
  const added = () => finish('added')
  const failed = () => finish('failed')
  const stopListening = () => {
    app.offEvent('homeScreenAdded', added)
    webView?.offEvent('home_screen_failed', failed)
  }
  function finish(result: HomeScreenResult) {
    if (finished) return
    finished = true
    stopListening()
    onDone(result)
  }
  const send = () => {
    if (finished) return
    app.onEvent('homeScreenAdded', added)
    webView?.onEvent('home_screen_failed', failed)
    onSent?.()
    try {
      app.addToHomeScreen?.()
    } catch {
      finish('failed')
    }
  }
  const stop = () => {
    finished = true
    stopListening()
  }

  if (confirm && supports.popup && app.showPopup) {
    try {
      app.showPopup(
        { title: confirm.title, message: confirm.message, buttons: [{ id: 'add', type: 'default', text: confirm.button }, { type: 'cancel' }] },
        (buttonId) => (buttonId === 'add' ? send() : finish('cancelled')),
      )
      return stop
    } catch {
      // Une autre fenêtre est déjà ouverte : on tente la demande directement.
    }
  }
  send()
  return stop
}

/** Ouvre une page externe (YouTube, Spotify…) : dans le navigateur de Telegram, ou un nouvel onglet. */
export function openExternal(url: string): void {
  if (telegram?.openLink) telegram.openLink(url)
  else window.open(url, '_blank', 'noopener,noreferrer')
}

/* ------------------------------- Vibrations ------------------------------- */

export const haptics = {
  /** Appui sur un bouton important. */
  impact(style: HapticImpact = 'light') {
    if (supports.haptics) telegram?.HapticFeedback.impactOccurred(style)
  },
  /** Sélection d'une option (mood, temps, passion). */
  selection() {
    if (supports.haptics) telegram?.HapticFeedback.selectionChanged()
  },
  success() {
    if (supports.haptics) telegram?.HapticFeedback.notificationOccurred('success')
  },
  warning() {
    if (supports.haptics) telegram?.HapticFeedback.notificationOccurred('warning')
  },
  error() {
    if (supports.haptics) telegram?.HapticFeedback.notificationOccurred('error')
  },
}

/** Demande au passage l'autorisation d'écrire (relances), si elle manque. */
export function requestWriteAccessIfNeeded(): void {
  if (!telegram || !supports.writeAccess) return
  if (telegram.initDataUnsafe.user?.allows_write_to_pm) return
  try {
    telegram.requestWriteAccess?.()
  } catch {
    // Refusé ou indisponible : l'app fonctionne sans relances.
  }
}
