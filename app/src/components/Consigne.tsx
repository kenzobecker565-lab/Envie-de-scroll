import { ChevronDown, Clock3 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { getPassion, type ProposalDTO } from '@scroll-up/shared'
import { cn } from '@/lib/utils'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { haptics } from '../telegram/webApp.ts'

/**
 * La consigne de l'activité en cours, toujours sous les yeux : collée en haut
 * de l'écran pendant qu'on dessine, qu'on écrit ou qu'on note ce qu'on a
 * exploré, pour ne jamais devoir revenir en arrière. Repliée sur trois
 * lignes ; un toucher la déplie. Ce que l'appli a tiré (mots, film…) reste
 * toujours affiché.
 */
export function ConsigneBar({ proposal }: { proposal: ProposalDTO }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-2 bg-gradient-to-b from-canvas from-80% to-transparent px-4 pt-3 pb-5">
      <ConsigneCard proposal={proposal} />
    </div>
  )
}

/**
 * Sur l'écran de l'activité, la grande carte montre déjà la consigne : la
 * version collée en haut n'apparaît que lorsqu'on fait défiler l'écran
 * (aides, suggestions) et que la carte sort du champ.
 */
export function FloatingConsigne({ proposal, show }: { proposal: ProposalDTO | undefined; show: boolean }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 h-0">
      <AnimatePresence>
        {proposal && show && (
          <motion.div
            key={proposal.id}
            className="absolute inset-x-0 top-0 bg-gradient-to-b from-canvas from-80% to-transparent px-4 pt-3 pb-5"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <ConsigneCard proposal={proposal} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Vrai dès que l'élément commence à passer au-dessus du haut de l'écran (on
 * a fait défiler plus bas et il n'est plus lisible en entier).
 */
export function useScrolledPast<T extends Element>(): [(node: T | null) => void, boolean] {
  const [element, setElement] = useState<T | null>(null)
  const [passed, setPassed] = useState(false)
  useEffect(() => {
    setPassed(false)
    if (!element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        const top = entry.rootBounds?.top ?? 0
        setPassed(entry.intersectionRatio < 1 && entry.boundingClientRect.top < top)
      },
      { threshold: [0, 0.5, 1] },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])
  return [setElement, passed]
}

function ConsigneCard({ proposal }: { proposal: ProposalDTO }) {
  const [open, setOpen] = useState(false)
  const [clamped, setClamped] = useState(false)
  const text = useRef<HTMLSpanElement>(null)
  const Icon = PASSION_ICONS[proposal.passion]

  // Le texte dépasse-t-il les trois lignes ? (On ne propose de déplier que dans ce cas.)
  useLayoutEffect(() => {
    const element = text.current
    if (!element || open) return
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [proposal.text, open])

  const toggle = () => {
    haptics.selection()
    setOpen((value) => !value)
  }

  const content = (
    <>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline', PASSION_COLORS[proposal.passion].bg)}>
        <Icon size={17} strokeWidth={2.4} className="text-on-color" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-1.5 text-11 font-extrabold tracking-wider text-ink-soft uppercase">
          La consigne · {getPassion(proposal.passion).label}
          <Clock3 size={12} strokeWidth={2.6} aria-hidden="true" />
          <span className="font-numbers">{proposal.duration}&nbsp;min</span>
        </span>
        <span ref={text} className={cn('block text-15 leading-snug font-bold text-pretty text-ink', !open && 'line-clamp-3')}>
          {proposal.text}
        </span>
        {proposal.extra && (
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="text-12 font-bold text-ink-soft">{proposal.extra.label}&nbsp;:</span>
            {proposal.extra.items.map((item) => (
              <span key={item} className="rounded-pill border-2 border-outline bg-lilac px-2 py-0.5 text-12 font-extrabold text-on-color">
                {item}
              </span>
            ))}
          </span>
        )}
      </span>
      {clamped && (
        <>
          <ChevronDown size={20} strokeWidth={2.6} aria-hidden="true" className={cn('mt-1 shrink-0 text-ink-soft transition-transform duration-200', open && 'rotate-180')} />
          <span className="sr-only">{open ? 'Replier la consigne' : 'Lire la consigne en entier'}</span>
        </>
      )}
    </>
  )

  // Toujours le même élément (il se mesure lui-même) ; il devient un bouton quand le texte est coupé.
  return (
    <div
      className={cn('flex w-full items-start gap-3 rounded-md border-[2.5px] border-outline bg-surface-200 p-3 text-left shadow-chip', clamped && 'cursor-pointer')}
      {...(clamped
        ? {
            role: 'button',
            tabIndex: 0,
            'aria-expanded': open,
            onClick: toggle,
            onKeyDown: (event: KeyboardEvent) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              toggle()
            },
          }
        : { role: 'region', 'aria-label': 'La consigne' })}
    >
      {content}
    </div>
  )
}
