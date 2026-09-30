import { ChevronLeft } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useNavigation } from '../state/AppState.tsx'
import { hasNativeBackButton } from '../telegram/buttons.ts'

/**
 * Cadre d'un écran : marges (16 px sur les côtés, 24 px en haut, 32 px en
 * bas), zones sûres, et bouton retour dans l'app quand celui de Telegram
 * n'est pas disponible (navigateur de développement).
 */
export function Screen({ children, className, footer }: { children: ReactNode; className?: string; footer?: ReactNode }) {
  const { canGoBack, back } = useNavigation()
  return (
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col">
      {!hasNativeBackButton && canGoBack && (
        <div className="px-4 pt-4">
          <Button variant="secondary" size="icon" onClick={back} aria-label="Retour">
            <ChevronLeft className="size-6" aria-hidden="true" />
          </Button>
        </div>
      )}
      <main className={cn('flex flex-1 flex-col px-4 pt-6 pb-8', className)}>{children}</main>
      {footer}
    </div>
  )
}

/**
 * En-tête d'écran : un repère facultatif (étape, contexte), le titre en
 * Bricolage Grotesque 40, puis le sous-titre. 8 px entre chaque, 24 px avant
 * le contenu.
 */
export function ScreenTitle({ children, subtitle, eyebrow, aside, className }: { children: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-2', className)}>
      {(eyebrow || aside) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {eyebrow}
          {aside}
        </div>
      )}
      <h1 className="font-display text-40 font-extrabold tracking-tight text-balance text-ink">{children}</h1>
      {subtitle && <p className="text-16 text-ink-soft">{subtitle}</p>}
    </header>
  )
}

/**
 * Où on en est dans un parcours : « 1/3 » en sticker soleil, puis une jauge
 * cernée d'encre qui se remplit de tomate à l'arrivée sur l'écran.
 */
export function StepProgress({ current, total, label }: { current: number; total: number; label?: string }) {
  const from = (current - 1) / total
  return (
    <div
      className="flex flex-1 items-center gap-3"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Étape ${current} sur ${total}${label ? ` : ${label}` : ''}`}
    >
      <span aria-hidden="true" className="-rotate-4 rounded-[8px] border-[2.5px] border-outline bg-warm px-2 py-0.5 font-numbers text-15 font-extrabold text-on-color">
        {current}/{total}
      </span>
      <span aria-hidden="true" className="h-3.5 flex-1 overflow-hidden rounded-pill border-[2.5px] border-outline bg-surface-200">
        <motion.span
          className="block h-full origin-left bg-accent"
          initial={{ scaleX: from }}
          animate={{ scaleX: current / total }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </div>
  )
}
