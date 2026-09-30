import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { Passion } from '@pqs/shared'
import { cn } from '../lib/cn.ts'
import { PASSION_ICONS } from '../lib/icons.ts'

/**
 * Carte illustrée d'une passion : grande icône sur fond doux (accent ou
 * warm), qu'on touche pour la choisir. Icône en ink-soft au repos, accent
 * une fois sélectionnée.
 */
export function PassionCard({
  passion,
  selected,
  onSelect,
  role = 'checkbox',
}: {
  passion: Passion
  selected: boolean
  onSelect: () => void
  role?: 'checkbox' | 'button'
}) {
  const Icon = PASSION_ICONS[passion.id]
  const warm = passion.tone === 'warm'
  return (
    <motion.button
      type="button"
      role={role}
      aria-checked={role === 'checkbox' ? selected : undefined}
      onClick={onSelect}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 480, damping: 30 }}
      className={cn(
        'relative flex min-h-44 flex-col items-start justify-between overflow-hidden rounded-md border-2 p-4 text-left transition-colors duration-200',
        warm ? 'bg-warm-soft' : 'bg-accent-soft',
        selected ? 'border-accent shadow-card' : 'border-transparent',
      )}
    >
      {/* Motif décoratif : un grand cercle en fond, comme une tache de couleur. */}
      <span
        aria-hidden="true"
        className="absolute -right-8 -bottom-10 h-32 w-32 rounded-pill bg-surface-200 opacity-50"
      />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-pill bg-surface-200">
        <Icon size={28} strokeWidth={1.75} className={cn('transition-colors duration-200', selected ? 'text-accent' : 'text-ink-soft')} aria-hidden="true" />
      </span>
      <span className="relative mt-4 block">
        <span className="block text-15 font-bold text-ink">{passion.label}</span>
        <span className="mt-1 block text-12 text-ink-soft">{passion.tagline}</span>
      </span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 26 }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-pill bg-accent text-accent-ink"
          >
            <Check size={16} strokeWidth={3} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
