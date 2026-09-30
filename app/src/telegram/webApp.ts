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

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
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
}

/** À appeler au démarrage : l'app est prête, en plein écran vertical. */
export function initTelegram(): void {
  if (!telegram) return
  telegram.ready()
  telegram.expand()
  // Évite que le glissement vers le bas (défilement de la galerie) ferme l'app.
  if (supports.verticalSwipes) telegram.disableVerticalSwipes?.()
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
