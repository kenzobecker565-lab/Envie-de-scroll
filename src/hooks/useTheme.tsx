import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readThemePreference, writeThemePreference, type ThemePreference } from '../services/preferences'

interface ThemeContextValue {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/** Applique le thème choisi et suit le thème du système en mode « Auto ». */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readThemePreference)

  useEffect(() => {
    applyTheme(preference)
    if (preference !== 'system') return
    // En mode « Auto » : suivre le système… et la page hôte si elle change de thème.
    const onChange = () => applyTheme('system')
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    media?.addEventListener('change', onChange)
    const observer = new MutationObserver(onChange)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      media?.removeEventListener('change', onChange)
      observer.disconnect()
    }
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    writeThemePreference(next)
    setPreferenceState(next)
  }, [])

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme doit être utilisé dans <ThemeProvider>.')
  return context
}
