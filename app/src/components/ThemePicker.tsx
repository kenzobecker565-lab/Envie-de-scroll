import { Check, Info, Palette } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { APP_THEMES, isAppTheme, type AppTheme } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { api } from '../api/client.ts'
import { setAppTheme, THEME_INFO, useAppTheme } from '../lib/appTheme.ts'
import { popIn } from '../lib/motion.ts'
import { useAppState } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Bouton « Thème » (avec ou sans texte) qui ouvre le choix du thème dans une
 * feuille : Pop (par défaut), Pop Nuit, BD, Memphis.
 */
export function ThemeButton({ withLabel = false }: { withLabel?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="secondary"
        size={withLabel ? 'sm' : 'icon'}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={withLabel ? undefined : 'Changer de thème'}
      >
        <Palette aria-hidden="true" />
        {withLabel && 'Thème'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <ThemePicker />
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Graisse et style du « Aa » de chaque vignette (ceux du thème de l'app ne s'y appliquent pas). */
const PREVIEW_TYPE: Record<AppTheme, React.CSSProperties> = {
  pop: { fontWeight: 800 },
  nuit: { fontWeight: 900, fontStyle: 'italic' },
  bd: { fontWeight: 400, fontStyle: 'normal', letterSpacing: '0.03em' },
  memphis: { fontWeight: 700, fontStyle: 'normal', letterSpacing: '-0.04em' },
}

/** Vignette d'un thème, dessinée avec ses propres couleurs, polices et formes. */
function ThemePreview({ theme }: { theme: AppTheme }) {
  return (
    <span
      data-theme={theme}
      aria-hidden="true"
      className="relative flex h-20 w-24 shrink-0 flex-col justify-between overflow-hidden rounded-md border-[2.5px] border-outline bg-canvas p-2 text-ink"
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

/** Le choix du thème : il s'applique tout de suite, et s'enregistre dans le profil. */
function ThemePicker() {
  const theme = useAppTheme()
  const { state, dispatch } = useAppState()
  const [error, setError] = useState<string>()

  const choose = (next: AppTheme) => {
    haptics.selection()
    setError(undefined)
    setAppTheme(next)
    dispatch({ type: 'user', user: { ...state.me.user, theme: next } })
    api
      .updateTheme(next)
      .then(({ user }) => dispatch({ type: 'user', user }))
      .catch(() => setError('Ton choix n’a pas pu rejoindre ton profil : il reste gardé sur ce téléphone.'))
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Choisis ton style</DialogTitle>
        <DialogDescription>Le changement s’applique tout de suite. Tu peux revenir au style par défaut quand tu veux.</DialogDescription>
      </DialogHeader>
      <ToggleGroup
        type="single"
        variant="card"
        value={theme}
        onValueChange={(value) => isAppTheme(value) && choose(value)}
        className="flex-col flex-nowrap gap-3"
        aria-label="Thème de l’app"
      >
        {APP_THEMES.map((id, index) => (
          <ToggleGroupItem key={id} value={id} className="items-center gap-4 p-3" {...popIn(index)} whileTap={{ scale: 0.97 }}>
            <ThemePreview theme={id} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 font-display text-20 font-extrabold tracking-tight">
                {THEME_INFO[id].label}
                {id === 'pop' && (
                  <Badge variant="secondary" size="sm" className="font-sans">
                    Par défaut
                  </Badge>
                )}
              </span>
              <span className="text-13 font-normal text-ink-soft">{THEME_INFO[id].description}</span>
            </span>
            <AnimatePresence>
              {theme === id && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  className="flex h-9 w-9 shrink-0 -rotate-6 items-center justify-center rounded-pill border-[2.5px] border-outline bg-accent text-on-color"
                >
                  <Check size={18} strokeWidth={3.2} aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {error && (
        <Alert variant="warning" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Info aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  )
}
