/**
 * Thème de l'app choisi par l'utilisateur (Pop, Pop Nuit, BD, Memphis).
 *
 * Le choix est posé sur <html data-theme="…"> ; les couleurs, polices et
 * rayons suivent (voir styles/index.css). Il est gardé sur le téléphone
 * (pour s'appliquer dès le démarrage, sans flash) et dans le profil, côté
 * serveur (pour suivre l'utilisateur d'un appareil à l'autre).
 */

import { getShopItem, DEFAULT_THEME, isAppTheme, type AppTheme } from '@scroll-up/shared'
import { useSyncExternalStore } from 'react'

/** Mode imposé par chaque thème (null : suit Telegram ou le système). */
export const THEME_SCHEME: Record<AppTheme, 'light' | 'dark' | null> = {
  pop: null,
  nuit: 'dark',
  bd: 'light',
  memphis: 'light',
}

export const THEME_INFO: Record<AppTheme, { label: string; description: string }> = {
  pop: { label: 'Pop', description: 'Stickers et couleurs franches. Suit le mode clair ou sombre de Telegram.' },
  nuit: { label: 'Pop Nuit', description: 'Fond noir, contours crème, ombres violettes. Toujours sombre.' },
  bd: { label: 'BD', description: 'Cases, bulles et trame de points. Toujours clair.' },
  memphis: { label: 'Memphis', description: 'Formes géométriques des années 80. Toujours clair.' },
}

const STORAGE_KEY = 'scroll-up:theme'
let current: AppTheme = DEFAULT_THEME
const listeners = new Set<() => void>()

function stored(): AppTheme {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return isAppTheme(value) ? value : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

function paint(theme: AppTheme): void {
  current = theme
  const root = document.documentElement
  if (theme === DEFAULT_THEME) delete root.dataset.theme
  else root.dataset.theme = theme
}

/** Au démarrage, avant le premier rendu : le dernier thème choisi sur ce téléphone. */
export function initAppTheme(): void {
  paint(stored())
}

export function getAppTheme(): AppTheme {
  return current
}

/** Change de thème tout de suite, et s'en souvient sur ce téléphone. */
export function setAppTheme(theme: AppTheme): void {
  if (theme === current) return
  paint(theme)
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Stockage indisponible (navigation privée…) : le profil s'en souviendra.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeAppTheme(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Le thème en cours, qui fait se redessiner le composant quand il change. */
export function useAppTheme(): AppTheme {
  return useSyncExternalStore(subscribeAppTheme, getAppTheme)
}

/** Palette achetée : ses deux variantes sont claires et suivent le profil serveur. */
let shopTheme: string | undefined
export function getShopTheme(): string | undefined { return shopTheme }
export function setShopTheme(id?: string): void {
  const next = id && getShopItem(id)?.category === 'theme' ? id : undefined
  if (next === shopTheme) return
  shopTheme = next
  if (next) document.documentElement.dataset.shopTheme = next
  else delete document.documentElement.dataset.shopTheme
  listeners.forEach((listener) => listener())
}
