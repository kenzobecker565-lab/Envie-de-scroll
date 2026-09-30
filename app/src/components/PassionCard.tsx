import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Passion } from '@scroll-up/shared'
import { ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { PASSION_ICONS } from '../lib/icons.ts'
import { popIn } from '../lib/motion.ts'
import { PassionScene } from './decor/PassionScene.tsx'

/**
 * Carte illustrée d'une passion, à placer dans un ToggleGroup (shadcn/ui) :
 * grande icône sur fond doux (accent ou warm), qu'on touche pour la choisir.
 * Icône en ink-soft au repos, accent une fois sélectionnée.
 */
export function PassionCard({ passion, selected, index }: { passion: Passion; selected: boolean; index: number }) {
  const Icon = PASSION_ICONS[passion.id]
  const entrance = popIn(index)
  return (
    <ToggleGroupItem
      value={passion.id}
      variant="card"
      aria-label={`${passion.label} : ${passion.tagline}`}
      className={cn(
        'min-h-44 flex-col items-start justify-between overflow-hidden shadow-none data-[state=on]:shadow-card',
        passion.tone === 'warm' ? 'bg-warm-soft' : 'bg-accent-soft',
      )}
      initial={{ ...entrance.initial, rotate: index % 2 ? 3 : -3 }}
      animate={{ ...entrance.animate, rotate: 0 }}
      transition={entrance.transition}
    >
      {/* Motif décoratif : un grand cercle en fond, comme une tache de couleur. */}
      <span aria-hidden="true" className="absolute -right-10 -bottom-12 h-32 w-32 rounded-pill bg-surface-200 opacity-40" />
      {/* La petite scène animée de la passion. */}
      <span
        aria-hidden="true"
        className="absolute top-10 right-2 w-24 opacity-80 transition-[opacity,transform] duration-300 group-data-[state=on]/toggle:scale-110 group-data-[state=on]/toggle:opacity-100"
      >
        <PassionScene passion={passion.id} className="w-full" />
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-pill bg-surface-200">
        <Icon
          size={28}
          strokeWidth={1.75}
          className="text-ink-soft transition-colors duration-200 group-data-[state=on]/toggle:text-accent"
          aria-hidden="true"
        />
      </span>
      <span className="relative flex flex-col gap-1">
        <span className="text-15 font-bold text-ink">{passion.label}</span>
        <span className="text-12 font-normal text-ink-soft">{passion.tagline}</span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-pop"
          >
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </ToggleGroupItem>
  )
}
