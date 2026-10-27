/**
 * Thèmes de l'app, au choix de chacun. « pop » est le thème par défaut : il
 * suit le mode clair ou sombre de Telegram. Les autres ont un mode fixe.
 */

export const APP_THEMES = ['pop', 'nuit', 'bd', 'memphis'] as const

export type AppTheme = (typeof APP_THEMES)[number]

export const DEFAULT_THEME: AppTheme = 'pop'

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value)
}
