import { Check } from 'lucide-react'
import { getPassion } from '../../data/passions'
import { passionAccent } from '../../lib/accent'
import { cn } from '../../lib/cn'
import type { PassionId } from '../../types'
import { Picto } from './Picto'

const PICTO_SIZES = {
  sm: 'size-7',
  md: 'size-9',
  lg: 'size-12',
}

/** Le pictogramme d'une passion, sur une tache à la couleur de sa famille. */
export function PassionPicto({ passionId, size = 'md', className }: { passionId: PassionId; size?: keyof typeof PICTO_SIZES; className?: string }) {
  return (
    <span style={passionAccent(passionId)} className={cn('inline-grid shrink-0 place-items-center text-ink', className)}>
      <Picto name={getPassion(passionId).picto} spot className={PICTO_SIZES[size]} />
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

/** Pastille cliquable représentant une passion ; choisie, elle passe à l'encre. */
export function PassionChip({ passionId, selected, onClick, size = 'md', count, role = 'toggle' }: PassionChipProps) {
  const passion = getPassion(passionId)
  return (
    <button
      type="button"
      onClick={onClick}
      {...(role === 'tab' ? { role: 'tab', 'aria-selected': selected } : { 'aria-pressed': selected })}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border-[1.5px] font-semibold transition duration-150 active:scale-[0.97]',
        size === 'lg' ? 'px-4 py-3 text-base' : 'px-3.5 py-2 text-sm',
        selected ? 'border-ink bg-ink text-card shadow-soft' : 'border-line bg-card text-ink hover:border-ink-faint',
      )}
    >
      <Picto name={passion.picto} className={size === 'lg' ? 'size-5' : 'size-[1.1rem]'} weight={2} />
      <span>{passion.label}</span>
      {count !== undefined && (
        <span className={cn('rounded-full px-1.5 text-xs font-bold tabular-nums', selected ? 'bg-card/15 text-card' : 'bg-ink/5 text-ink-soft')}>
          {count}
        </span>
      )}
      {role === 'toggle' && selected && <Check aria-hidden className="size-4" strokeWidth={3} />}
    </button>
  )
}
