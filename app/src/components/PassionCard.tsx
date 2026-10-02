import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Passion } from '@scroll-up/shared'
import { ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { popIn } from '../lib/motion.ts'
import { PassionScene } from './decor/PassionScene.tsx'

/**
 * Carte d'une passion, à placer dans un ToggleGroup (shadcn/ui) : un grand
 * sticker de sa couleur (ciel, lilas, menthe, soleil, tomate), avec sa petite
 * scène animée. Une fois choisie, elle se soulève et reçoit une coche tomate
 * (crème sur la carte déjà tomate).
 */
export function PassionCard({ passion, selected, index }: { passion: Passion; selected: boolean; index: number }) {
  const Icon = PASSION_ICONS[passion.id]
  const colors = PASSION_COLORS[passion.id]
  const entrance = popIn(index)
  return (
    <ToggleGroupItem
      value={passion.id}
      variant="card"
      aria-label={`${passion.label} : ${passion.tagline}`}
      className={cn('min-h-44 flex-col items-start justify-between text-on-color', colors.bg, colors.on)}
      initial={{ ...entrance.initial, rotate: index % 2 ? 4 : -4 }}
      animate={{ ...entrance.animate, rotate: index % 2 ? 1 : -1 }}
      transition={entrance.transition}
    >
      {/* La petite scène animée de la passion. */}
      <span
        aria-hidden="true"
        className="absolute top-5 right-3 w-20 transition-[scale] duration-300 group-data-[state=on]/toggle:scale-110"
      >
        <PassionScene passion={passion.id} className="w-full" />
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper">
        <Icon size={26} strokeWidth={2.2} className="text-on-color" aria-hidden="true" />
      </span>
      <span className="relative flex flex-col gap-1">
        <span className="font-display text-20 font-extrabold tracking-tight">{passion.label}</span>
        <span className="text-12 font-medium opacity-80">{passion.tagline}</span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: -8 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className={cn(
              'absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-pill border-[2.5px] border-outline text-on-color',
              colors.bg === 'bg-accent' ? 'bg-paper' : 'bg-accent',
            )}
          >
            <Check size={18} strokeWidth={3.2} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </ToggleGroupItem>
  )
}
