import { Check, Info } from 'lucide-react'
import { useState } from 'react'
import { APP_THEMES, isAppTheme, type AppTheme } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { api } from '../api/client.ts'
import { setAppTheme, THEME_INFO, useAppTheme } from '../lib/appTheme.ts'
import { useAppState } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Graisse et style du « Aa » de chaque vignette (ceux du thème de l'app ne s'y appliquent pas). */
const PREVIEW_TYPE: Record<AppTheme, React.CSSProperties> = {
  pop: { fontWeight: 800 },
  nuit: { fontWeight: 900, fontStyle: 'italic' },
  bd: { fontWeight: 400, fontStyle: 'normal', letterSpacing: '0.03em' },
  memphis: { fontWeight: 700, fontStyle: 'normal', letterSpacing: '-0.04em' },
}

/** Vignette d'un thème, dessinée avec ses propres couleurs, polices et formes. */
export function ThemePreview({ theme, className }: { theme: AppTheme; className?: string }) {
  return (
    <span
      data-theme={theme}
      aria-hidden="true"
      className={cn('relative flex h-20 w-24 shrink-0 flex-col justify-between overflow-hidden rounded-md border-[2.5px] border-outline bg-canvas p-2 text-ink', className)}
      style={{ backgroundImage: 'var(--page-pattern)', backgroundSize: 'var(--page-pattern-size)' }}
    >
      <span className="flex gap-1">
        {['bg-accent', 'bg-sky', 'bg-good', 'bg-warm', 'bg-lilac'].map((color) => (
          <span key={color} className={cn('h-3 w-3 rounded-pill border-[1.5px] border-outline', color)} />
        ))}
      </span>
      <span className="flex items-end justify-between">
        <span className="font-display text-26 leading-none" style={PREVIEW_TYPE[theme]}>
          Aa
        </span>
        <span className="h-6 w-8 rounded-sm border-2 border-outline bg-accent shadow-chip" />
      </span>
    </span>
  )
}

/** Choisir un thème : il s'applique tout de suite, et s'enregistre dans le profil. */
export function useThemeChooser() {
  const theme = useAppTheme()
  const { state, dispatch } = useAppState()
  const [error, setError] = useState<string>()

  const choose = (next: AppTheme) => {
    haptics.selection()
    setError(undefined)
    if (state.me.shop?.equipped.theme) {
      api.equipItem('theme', null).then((shop) => dispatch({ type: 'shop', shop })).catch(() => setError('Le thème de la boutique n’a pas pu être désactivé. Réessaie.'))
    }
    setAppTheme(next)
    dispatch({ type: 'user', user: { ...state.me.user, theme: next } })
    api
      .updateTheme(next)
      .then(({ user }) => dispatch({ type: 'user', user }))
      .catch(() => setError('Ton choix n’a pas pu rejoindre ton profil : il reste gardé sur ce téléphone.'))
  }
  return { theme, choose, error }
}

/** Les quatre thèmes en grille compacte (feuille des réglages). */
export function ThemeGrid() {
  const { theme, choose, error } = useThemeChooser()
  return (
    <>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => isAppTheme(value) && choose(value)}
        className="grid grid-cols-2 gap-3"
        aria-label="Thème de l’app"
      >
        {APP_THEMES.map((id) => (
          <ToggleGroupItem
            key={id}
            value={id}
            variant="card"
            className="flex-col items-stretch gap-2 p-2 text-center"
            whileTap={{ scale: 0.96 }}
            aria-label={`${THEME_INFO[id].label}${id === 'pop' ? ' (par défaut)' : ''}`}
          >
            <ThemePreview theme={id} className="h-16 w-full" />
            <span className="flex items-center justify-center gap-1 font-display text-15 font-extrabold tracking-tight">
              {theme === id && <Check size={16} strokeWidth={3.2} aria-hidden="true" />}
              {THEME_INFO[id].label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && (
        <Alert variant="warning" role="status">
          <Info aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  )
}
