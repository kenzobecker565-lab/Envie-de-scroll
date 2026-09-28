import { Check } from 'lucide-react'
import { getPassion } from '../../data/passions'
import { passionAccent } from '../../lib/accent'
import { cn } from '../../lib/cn'
import type { PassionId } from '../../types'

const EMOJI_SIZES = {
  sm: 'size-9 rounded-xl text-lg',
  md: 'size-11 rounded-2xl text-xl',
  lg: 'size-14 rounded-[1.1rem] text-2xl',
}

/** L'emoji d'une passion dans une pastille teintée à la couleur de sa famille. */
export function PassionEmoji({ passionId, size = 'md', className }: { passionId: PassionId; size?: keyof typeof EMOJI_SIZES; className?: string }) {
  return (
    <span aria-hidden style={passionAccent(passionId)} className={cn('grid shrink-0 place-items-center tint-accent-strong leading-none', EMOJI_SIZES[size], className)}>
      {getPassion(passionId).emoji}
    </span>
  )
}

interface PassionChipProps {
  passionId: PassionId
  selected: boolean
  onClick: () => void
  size?: 'md' | 'lg'
  /** Petit compteur affiché à droite (ex. nombre d'activités). */
  count?: number
  /** `toggle` (choix multiple, aria-pressed) ou `tab` (onglet, aria-selected). */
  role?: 'toggle' | 'tab'
}

/** Pastille cliquable représentant une passion. */
export function PassionChip({ passionId, selected, onClick, size = 'md', count, role = 'toggle' }: PassionChipProps) {
  const passion = getPassion(passionId)
  return (
    <button
      type="button"
      onClick={onClick}
      {...(role === 'tab' ? { role: 'tab', 'aria-selected': selected } : { 'aria-pressed': selected })}
      style={passionAccent(passionId)}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] font-medium text-ink transition duration-150 active:scale-[0.97]',
        size === 'lg' ? 'px-4 py-3 text-base' : 'px-3.5 py-2 text-sm',
        selected ? 'tint-accent-strong border-accent shadow-soft' : 'border-line bg-card hover:border-accent',
      )}
    >
      <span aria-hidden className={cn('leading-none', size === 'lg' ? 'text-xl' : 'text-base')}>
        {passion.emoji}
      </span>
      <span>{passion.label}</span>
      {count !== undefined && (
        <span className={cn('rounded-full px-1.5 text-xs font-bold tabular-nums', selected ? 'bg-card/70 text-accent' : 'bg-ink/5 text-ink-soft')}>
          {count}
        </span>
      )}
      {role === 'toggle' && selected && <Check aria-hidden className="size-4 text-accent" strokeWidth={3} />}
    </button>
  )
}
