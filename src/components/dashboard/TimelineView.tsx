import { getMood } from '../../data/moods'
import { passionAccent } from '../../lib/accent'
import { formatDayLabel, formatTime } from '../../lib/dates'
import { fr } from '../../lib/typography'
import type { HistoryEntry } from '../../types'

/** Frise chronologique des activités d'une passion, avec leur date. */
export function TimelineView({ entries }: { entries: HistoryEntry[] }) {
  return (
    <ol className="relative ml-2 space-y-5 border-l-2 border-line pl-5">
      {entries.map((entry) => {
        const mood = getMood(entry.mood)
        return (
          <li key={entry.id} className="relative">
            <span
              aria-hidden
              style={passionAccent(entry.passionId)}
              className="absolute -left-[27px] top-1 size-3 rounded-full bg-accent ring-4 ring-paper"
            />
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
              <time dateTime={entry.completedAt}>
                {formatDayLabel(entry.dateKey)} · {formatTime(entry.completedAt)}
              </time>
            </p>
            <p className="mt-0.5 font-display text-lg font-semibold leading-snug">{fr(entry.title)}</p>
            <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">{fr(entry.description)}</p>
            <p className="mt-1.5 flex flex-wrap gap-x-2 text-xs font-medium text-ink-soft">
              <span>
                <span aria-hidden>{mood.emoji}</span> {mood.label}
              </span>
              <span aria-hidden>·</span>
              <span>{entry.duration} min</span>
            </p>
            {entry.note && <p className="mt-2 rounded-xl bg-card p-2.5 text-sm italic leading-relaxed">{fr(entry.note)}</p>}
          </li>
        )
      })}
    </ol>
  )
}
