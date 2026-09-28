import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { fr } from '../../lib/typography'

/**
 * Titre d'une étape de parcours. À l'arrivée sur l'étape, le focus est placé
 * sur le titre : les lecteurs d'écran annoncent la nouvelle étape.
 */
export function StepHeading({
  title,
  subtitle,
  focus = true,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  focus?: boolean
  className?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focus) ref.current?.focus({ preventScroll: true })
  }, [focus])

  return (
    <div className={cn('mb-6', className)}>
      <h1 ref={ref} tabIndex={-1} className="font-display text-[1.9rem] font-semibold leading-[1.12] tracking-tight outline-none">
        {typeof title === 'string' ? fr(title) : title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[1.02rem] leading-relaxed text-ink-soft">{typeof subtitle === 'string' ? fr(subtitle) : subtitle}</p>
      )}
    </div>
  )
}

/** Barre d'actions collée en bas de l'écran pendant les parcours. */
export function BottomBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-4 mt-auto space-y-2 bg-linear-to-t from-paper from-70% to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
