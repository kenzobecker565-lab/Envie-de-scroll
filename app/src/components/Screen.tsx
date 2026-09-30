import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigation } from '../state/AppState.tsx'
import { cn } from '../lib/cn.ts'
import { hasNativeBackButton } from '../telegram/buttons.ts'

/**
 * Cadre d'un écran : marges, zones sûres, et bouton retour dans l'app quand
 * celui de Telegram n'est pas disponible (navigateur de développement).
 */
export function Screen({ children, className, footer }: { children: ReactNode; className?: string; footer?: ReactNode }) {
  const { canGoBack, back } = useNavigation()
  return (
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col">
      {!hasNativeBackButton && canGoBack && (
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={back}
            className="-ml-2 inline-flex h-10 items-center gap-1 rounded-pill pr-4 pl-2 text-14 font-bold text-ink-soft"
          >
            <ChevronLeft size={20} aria-hidden="true" />
            Retour
          </button>
        </div>
      )}
      <main className={cn('flex flex-1 flex-col px-4 pt-6 pb-8', className)}>{children}</main>
      {footer}
    </div>
  )
}

/** Titre d'écran en Fraunces, avec un sous-titre facultatif. */
export function ScreenTitle({ children, subtitle, className }: { children: ReactNode; subtitle?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-6', className)}>
      <h1 className="font-display text-28 font-semibold text-balance text-ink">{children}</h1>
      {subtitle && <p className="mt-2 text-15 text-ink-soft">{subtitle}</p>}
    </header>
  )
}
