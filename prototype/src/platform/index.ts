/**
 * ============================================================================
 *  PLATEFORME : navigateur aujourd'hui, Telegram Mini App demain
 * ============================================================================
 *
 * Tout ce qui dépend de l'endroit où tourne l'application passe par cet
 * « adaptateur ». Le reste du code ne sait pas s'il tourne dans un navigateur
 * classique ou dans Telegram : pour la migration, il suffira d'étoffer
 * l'adaptateur Telegram ci-dessous (bouton retour natif, thème Telegram,
 * stockage cloud…) sans toucher aux écrans.
 *
 * L'adaptateur Telegram ne s'active que si l'app est ouverte depuis Telegram
 * (le script https://telegram.org/js/telegram-web-app.js expose alors
 * `window.Telegram.WebApp` avec des `initData` non vides). Dans ce prototype,
 * ce script n'est pas chargé : c'est donc toujours l'adaptateur web qui sert.
 */

export interface PlatformAdapter {
  readonly name: 'web' | 'telegram'
  /** À appeler une fois, quand l'interface est prête. */
  ready(): void
  /** Prénom connu par la plateforme (ex. compte Telegram), pour pré-remplir l'onboarding. */
  suggestedFirstName(): string | undefined
  /** Petit retour tactile (vibration) sur les actions importantes. */
  haptic(kind: 'selection' | 'success' | 'warning'): void
}

/* ----------------------------- Navigateur web ----------------------------- */

const webAdapter: PlatformAdapter = {
  name: 'web',
  ready() {},
  suggestedFirstName: () => undefined,
  haptic(kind) {
    // Les navigateurs mobiles Android savent vibrer ; ailleurs, rien ne se passe.
    if (kind !== 'success') return
    try {
      navigator.vibrate?.(12)
    } catch {
      // Vibration refusée (page intégrée, réglages) : sans importance.
    }
  },
}

/* ------------------------ Telegram Mini App (à venir) ---------------------- */

/** Sous-ensemble minimal de l'API Telegram WebApp utilisé ici. */
interface TelegramWebApp {
  initData: string
  initDataUnsafe?: { user?: { first_name?: string } }
  ready(): void
  expand(): void
  HapticFeedback?: {
    selectionChanged(): void
    notificationOccurred(type: 'success' | 'warning' | 'error'): void
  }
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp }
  }
}

function createTelegramAdapter(webApp: TelegramWebApp): PlatformAdapter {
  return {
    name: 'telegram',
    ready() {
      webApp.ready()
      webApp.expand()
    },
    suggestedFirstName: () => webApp.initDataUnsafe?.user?.first_name,
    haptic(kind) {
      if (kind === 'selection') webApp.HapticFeedback?.selectionChanged()
      else webApp.HapticFeedback?.notificationOccurred(kind)
    },
  }
}

const telegramWebApp = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined

export const platform: PlatformAdapter = telegramWebApp?.initData
  ? createTelegramAdapter(telegramWebApp)
  : webAdapter
