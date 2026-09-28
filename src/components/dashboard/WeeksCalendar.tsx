import { fromDateKey, pluralize } from '../../lib/dates'
import { cn } from '../../lib/cn'
import type { DayCell } from '../../types'
import { Card, SectionTitle } from '../layout/AppShell'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const dayFormat = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

function cellClass(day: DayCell): string {
  if (day.isFuture) return 'border border-dashed border-line text-ink-faint'
  if (day.count === 0) return 'bg-line/70 text-ink-soft'
  if (day.count === 1) return 'bg-primary/35 text-ink'
  if (day.count === 2) return 'bg-primary/65 text-on-primary'
  return 'bg-primary text-on-primary'
}

/** Calendrier des 5 dernières semaines : plus la case est foncée, plus il y a eu d'envies transformées. */
export function WeeksCalendar({ days }: { days: DayCell[] }) {
  const activeDays = days.filter((day) => day.count > 0).length

  return (
    <Card>
      <SectionTitle action={<span className="text-sm text-ink-soft">{pluralize(activeDays, 'jour actif', 'jours actifs')}</span>}>
        Tes 5 dernières semaines
      </SectionTitle>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.7rem] font-bold text-ink-soft" aria-hidden>
        {WEEKDAYS.map((label, index) => (
          <span key={index}>{label}</span>
        ))}
      </div>
      <div
        role="img"
        aria-label={`${pluralize(activeDays, 'jour actif', 'jours actifs')} sur les 5 dernières semaines`}
        className="mt-1.5 grid grid-cols-7 gap-1.5"
      >
        {days.map((day) => {
          const date = fromDateKey(day.dateKey)
          return (
            <span
              key={day.dateKey}
              title={day.isFuture ? undefined : `${dayFormat.format(date)} : ${pluralize(day.count, 'activité')}`}
              className={cn(
                'grid aspect-square place-items-center rounded-[0.6rem] text-[0.7rem] font-semibold tabular-nums',
                cellClass(day),
                day.isToday && 'ring-2 ring-ink ring-offset-2 ring-offset-card',
              )}
            >
              {date.getDate()}
            </span>
          )
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-soft" aria-hidden>
        Moins
        <span className="size-3 rounded-[0.25rem] bg-line/70" />
        <span className="size-3 rounded-[0.25rem] bg-primary/35" />
        <span className="size-3 rounded-[0.25rem] bg-primary/65" />
        <span className="size-3 rounded-[0.25rem] bg-primary" />
        Plus
      </div>
    </Card>
  )
}
