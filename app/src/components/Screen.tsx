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
          <Button variant="ghost" size="sm" className="-ml-2 pr-4 pl-2" onClick={back}>
            <ChevronLeft className="size-5" aria-hidden="true" />
            Retour
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
 * Fraunces 28, puis le sous-titre. 8 px entre chaque, 24 px avant le contenu.
 */
export function ScreenTitle({ children, subtitle, eyebrow, aside, className }: { children: ReactNode; subtitle?: ReactNode; eyebrow?: ReactNode; aside?: ReactNode; className?: string }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-2', className)}>
      {(eyebrow || aside) && (
        <div className="mb-2 flex items-end justify-between gap-4">
          {eyebrow}
          {aside}
        </div>
      )}
      <h1 className="font-display text-28 font-semibold text-balance text-ink">{children}</h1>
      {subtitle && <p className="text-15 text-ink-soft">{subtitle}</p>}
    </header>
  )
}

/**
 * Où on en est dans un parcours : « Étape 2 sur 3 » et des segments qui se
 * remplissent (le segment de l'étape en cours se remplit à l'arrivée).
 */
export function StepProgress({ current, total, label }: { current: number; total: number; label?: string }) {
  return (
    <div
      className="flex w-fit min-w-40 flex-col gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Étape ${current} sur ${total}${label ? ` : ${label}` : ''}`}
    >
      <p className="text-11 font-bold tracking-wide whitespace-nowrap text-ink-soft uppercase" aria-hidden="true">
        Étape <span className="font-mono text-mono-xs">{current}</span> sur <span className="font-mono text-mono-xs">{total}</span>
        {label && <span className="text-accent"> · {label}</span>}
      </p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: total }, (_, index) => (
          <span key={index} className="h-1 flex-1 overflow-hidden rounded-pill bg-line">
            {index < current && (
              <motion.span
                className="block h-full origin-left rounded-pill bg-accent"
                initial={{ scaleX: index === current - 1 ? 0 : 1 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
