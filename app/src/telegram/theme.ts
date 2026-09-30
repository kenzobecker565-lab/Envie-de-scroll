/**
 * Thème clair / sombre, synchronisé avec Telegram (`colorScheme`, événement
 * `themeChanged`) ou, hors de Telegram, avec le réglage du système.
 *
 * On ne reprend pas les couleurs de Telegram (`themeParams`) : l'app garde sa
 * propre palette. En revanche, on colore l'en-tête et le fond de Telegram
 * avec le « canvas » de l'app, pour que tout se fonde.
 */

import { supports, telegram } from './webApp.ts'

export type Scheme = 'light' | 'dark'

function systemScheme(): Scheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function currentScheme(): Scheme {
  return telegram ? telegram.colorScheme : systemScheme()
}

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function apply(scheme: Scheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', scheme === 'dark')

  if (!telegram) return
  const canvas = cssColor('--canvas')
  try {
    if (supports.headerColor) telegram.setHeaderColor(canvas)
    telegram.setBackgroundColor(canvas)
    if (supports.bottomBarColor) telegram.setBottomBarColor?.(canvas)
  } catch {
    // Anciennes versions de Telegram : couleurs par défaut, sans gravité.
  }
}

/** Applique le thème et le suit ; renvoie une fonction pour arrêter de suivre. */
export function syncTheme(onChange?: (scheme: Scheme) => void): () => void {
  const update = () => {
    const scheme = currentScheme()
    apply(scheme)
    onChange?.(scheme)
  }
  update()

  const webApp = telegram
  if (webApp) {
    webApp.onEvent('themeChanged', update)
    return () => webApp.offEvent('themeChanged', update)
  }
  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  media?.addEventListener('change', update)
  return () => media?.removeEventListener('change', update)
}

/** Lit la valeur d'une couleur du design system (pour les boutons natifs). */
export function themeColor(name: '--accent' | '--accent-ink' | '--surface-300' | '--ink-faint'): string {
  return cssColor(name)
}
