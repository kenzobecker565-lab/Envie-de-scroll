import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type StepDirection = 'forward' | 'back'

/**
 * Anime l'arrivée d'une étape (glissement léger + fondu). Changer `stepKey`
 * remonte le contenu et rejoue l'animation ; la direction indique le sens.
 */
export function StepTransition({
  stepKey,
  direction,
  children,
  className,
}: {
  stepKey: string
  direction: StepDirection
  children: ReactNode
  className?: string
}) {
  return (
    <div key={stepKey} className={cn(direction === 'back' ? 'animate-step-back' : 'animate-step-forward', className)}>
      {children}
    </div>
  )
}

/** Barre de progression en segments, en haut des parcours. */
export function StepProgress({ current, total, label }: { current: number; total: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`Étape ${current} sur ${total}`}
      className="flex flex-1 items-center gap-1.5"
    >
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', index < current ? 'bg-primary' : 'bg-line')}
        />
      ))}
    </div>
  )
}
