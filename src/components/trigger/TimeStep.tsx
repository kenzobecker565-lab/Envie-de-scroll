import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/cn'
import type { Duration } from '../../types'
import { StepHeading } from '../ui/StepHeading'

const OPTIONS: { duration: Duration; caption: string }[] = [
  { duration: 5, caption: 'Juste une petite pause' },
  { duration: 15, caption: 'Le temps d’un vrai moment' },
  { duration: 30, caption: 'Une vraie session créative' },
]

/** Étape C — le temps disponible. */
export function TimeStep({ selected, onSelect }: { selected?: Duration; onSelect: (duration: Duration) => void }) {
  return (
    <>
      <StepHeading title="Tu as combien de temps ?" subtitle="Sois honnête : on s’adapte." />
      <div className="space-y-3">
        {OPTIONS.map(({ duration, caption }) => (
          <button
            key={duration}
            type="button"
            aria-pressed={selected === duration}
            onClick={() => onSelect(duration)}
            className={cn(
              'flex w-full items-center gap-4 rounded-[1.5rem] border-[1.5px] bg-card p-4 text-left shadow-soft transition hover:border-primary active:scale-[0.99]',
              selected === duration ? 'border-primary' : 'border-line',
            )}
          >
            <ClockPie minutes={duration} />
            <span className="flex-1">
              <span className="block font-display text-2xl font-extrabold tracking-tight">{duration} minutes</span>
              <span className="text-ink-soft">{caption}</span>
            </span>
            <ChevronRight className="size-5 text-ink-faint" aria-hidden />
          </button>
        ))}
      </div>
    </>
  )
}

/** Petit cadran : la part colorée représente la durée sur une heure. */
function ClockPie({ minutes }: { minutes: number }) {
  const radius = 9
  const circumference = 2 * Math.PI * radius
  return (
    <svg viewBox="0 0 40 40" className="size-14 shrink-0 -rotate-90" aria-hidden>
      <circle cx="20" cy="20" r="19" className="fill-primary-soft" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        className="stroke-primary"
        strokeWidth={radius * 2}
        strokeDasharray={`${(minutes / 60) * circumference} ${circumference}`}
      />
      <circle cx="20" cy="20" r="2" className="fill-card" />
    </svg>
  )
}
