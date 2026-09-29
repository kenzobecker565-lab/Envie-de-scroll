/**
 * Préférences d'affichage propres à l'appareil (thème clair / sombre).
 *
 * Contrairement aux données de l'utilisateur (IndexedDB), le thème est gardé
 * dans le localStorage : il doit être lu instantanément au chargement de la
 * page, avant même que React démarre, pour éviter un « flash » blanc en mode
 * sombre (voir le petit script dans index.html, qui lit la même clé).
 */

export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'pqs-theme'

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export function writeThemePreference(value: ThemePreference): void {
  try {
    if (value === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    // Stockage indisponible (navigation privée…) : le thème s'applique quand même pour cette session.
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

/**
 * Thème imposé par une page hôte, quand l'app est intégrée ailleurs (par
 * exemple claude.ai pose `data-theme="dark"` ou `"light"` sur <html>).
 */
export function hostTheme(): 'light' | 'dark' | null {
  const value = document.documentElement.getAttribute('data-theme')
  return value === 'light' || value === 'dark' ? value : null
}

/**
 * Applique le thème à la page (classe `dark` sur <html>). En mode « Auto »,
 * on suit la page hôte si elle impose un thème, sinon le réglage du système.
 */
export function applyTheme(preference: ThemePreference): void {
  const automatic = hostTheme() ? hostTheme() === 'dark' : systemPrefersDark()
  const dark = preference === 'dark' || (preference === 'system' && automatic)
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.style.colorScheme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#17120F' : '#FBF5EC')
}
