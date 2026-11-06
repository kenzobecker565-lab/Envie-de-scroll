import { Star } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { FilmLog } from '../../types'

type Rating = FilmLog['rating']

interface StarRatingProps {
  value: Rating
  /** Sans `onChange`, les étoiles sont simplement affichées. */
  onChange?: (value: Rating) => void
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = { sm: 'size-4', md: 'size-6', lg: 'size-8' }
const STARS = [1, 2, 3, 4, 5] as const

/** Note sur 5. Cliquer à nouveau sur la note actuelle la remet à zéro. */
export function StarRating({ value, onChange, size = 'md', label = 'Note sur 5' }: StarRatingProps) {
  if (!onChange) {
    return (
      <span className="inline-flex items-center gap-0.5" role="img" aria-label={value ? `Noté ${value} sur 5` : 'Pas encore noté'}>
        {STARS.map((n) => (
          <Star key={n} aria-hidden className={cn(SIZES[size], n <= value ? 'fill-saffron text-saffron' : 'text-ink-faint/60')} />
        ))}
      </span>
    )
  }

  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center">
      {STARS.map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={n === 1 ? '1 étoile' : `${n} étoiles`}
          onClick={() => onChange(value === n ? 0 : n)}
          className="grid place-items-center rounded-lg p-1 transition active:scale-90"
        >
          <Star
            aria-hidden
            className={cn(SIZES[size], 'transition', n <= value ? 'fill-saffron text-saffron' : 'text-ink-faint hover:text-saffron')}
          />
        </button>
      ))}
    </div>
  )
}
