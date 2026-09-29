import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { formatRelativeDay, pluralize } from '../../lib/dates'
import { updateEntryDetails } from '../../services/historyService'
import type { HistoryEntry } from '../../types'
import { Button, IconButton } from '../ui/Button'
import { StarRating } from '../ui/StarRating'
import { useToast } from '../ui/Toast'
import { EntryEditModal } from './EntryEditModal'

/** Cinéma : la liste des films regardés, avec une note sur 5 modifiable. */
export function FilmsView({ entries }: { entries: HistoryEntry[] }) {
  const [editingId, setEditingId] = useState<number>()
  const toast = useToast()
  const films = entries.filter((entry) => entry.film)
  const withoutFilm = entries.filter((entry) => !entry.film)
  const rated = films.filter((entry) => (entry.film?.rating ?? 0) > 0)
  const average = rated.length ? rated.reduce((sum, entry) => sum + (entry.film?.rating ?? 0), 0) / rated.length : 0
  const editing = entries.find((entry) => entry.id === editingId)

  return (
    <>
      <p className="mb-3 text-sm text-ink-soft">
        {pluralize(films.length, 'film noté', 'films notés')}
        {average > 0 && ` · moyenne ${average.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} / 5`}
      </p>

      {films.length > 0 && (
        <ul className="space-y-2.5">
          {films.map((entry) => (
            <li key={entry.id} className="rounded-2xl border border-line bg-card p-3 shadow-soft">
              <div className="flex items-start gap-3">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">
                  🎬
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[1.05rem] font-semibold leading-snug">{entry.film?.title}</p>
                  <p className="text-xs text-ink-soft">
                    {formatRelativeDay(entry.dateKey)} · {entry.title}
                  </p>
                </div>
                <IconButton label={`Modifier « ${entry.film?.title} »`} onClick={() => setEditingId(entry.id)} className="-mr-1 -mt-1 size-9">
                  <Pencil className="size-4" aria-hidden />
                </IconButton>
              </div>
              <div className="mt-1 pl-12">
                <StarRating
                  value={entry.film?.rating ?? 0}
                  label={`Ta note pour « ${entry.film?.title} »`}
                  onChange={(rating) => {
                    if (entry.id === undefined || !entry.film) return
                    updateEntryDetails(entry.id, { film: { ...entry.film, rating } }).catch(() => toast('Impossible d’enregistrer la note'))
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {withoutFilm.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-sm font-bold text-ink-soft">Activités ciné sans film noté</h3>
          <ul className="space-y-2">
            {withoutFilm.map((entry) => (
              <li key={entry.id} className="flex items-center gap-3 rounded-2xl border border-line bg-card p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{entry.title}</p>
                  <p className="text-xs text-ink-soft">{formatRelativeDay(entry.dateKey)}</p>
                </div>
                <Button size="sm" variant="soft" onClick={() => setEditingId(entry.id)}>
                  Noter un film
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <EntryEditModal entry={editing} onClose={() => setEditingId(undefined)} />
    </>
  )
}
