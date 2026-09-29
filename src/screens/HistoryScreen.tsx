import { ArrowLeft, ChevronDown, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { EntryEditModal } from '../components/dashboard/EntryEditModal'
import { AppShell, ScreenTitle } from '../components/layout/AppShell'
import { Button, IconButton } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/Modal'
import { PassionEmoji } from '../components/ui/Passion'
import { StarRating } from '../components/ui/StarRating'
import { useToast } from '../components/ui/Toast'
import { MOODS, getMood } from '../data/moods'
import { getPassion } from '../data/passions'
import { useHistory, usePhotoUrl } from '../hooks/useData'
import { navigate } from '../hooks/useRoute'
import { cn } from '../lib/cn'
import { formatDayLabel, formatTime, pluralize } from '../lib/dates'
import { fr } from '../lib/typography'
import { deleteEntry } from '../services/historyService'
import type { HistoryEntry, MoodId, PassionId } from '../types'

/** Historique complet, filtrable par passion et par mood. */
export function HistoryScreen() {
  const history = useHistory()
  const toast = useToast()
  const [passionFilter, setPassionFilter] = useState<PassionId | 'all'>('all')
  const [moodFilter, setMoodFilter] = useState<MoodId | 'all'>('all')
  const [expandedId, setExpandedId] = useState<number>()
  const [editingId, setEditingId] = useState<number>()
  const [deletingId, setDeletingId] = useState<number>()

  const entries = history ?? []

  // Passions présentes dans l'historique, les plus fréquentes d'abord.
  const passions = useMemo(() => {
    const counts = new Map<PassionId, number>()
    for (const entry of entries) counts.set(entry.passionId, (counts.get(entry.passionId) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)
  }, [entries])

  const filtered = entries.filter(
    (entry) => (passionFilter === 'all' || entry.passionId === passionFilter) && (moodFilter === 'all' || entry.mood === moodFilter),
  )

  // Regroupement par jour (l'historique est déjà trié du plus récent au plus ancien).
  const groups: { dateKey: string; entries: HistoryEntry[] }[] = []
  for (const entry of filtered) {
    const last = groups.at(-1)
    if (last?.dateKey === entry.dateKey) last.entries.push(entry)
    else groups.push({ dateKey: entry.dateKey, entries: [entry] })
  }

  const hasFilters = passionFilter !== 'all' || moodFilter !== 'all'
  const editing = entries.find((entry) => entry.id === editingId)

  return (
    <AppShell activeTab="historique">
      <div className="-ml-2 pt-1">
        <IconButton label="Retour à ta progression" onClick={() => navigate('progres')}>
          <ArrowLeft className="size-5" aria-hidden />
        </IconButton>
      </div>
      <ScreenTitle title="Historique" subtitle="Toutes tes envies transformées, une par une." />

      <div className="mb-4 space-y-3">
        <FilterRow label="Passion">
          <FilterChip selected={passionFilter === 'all'} onClick={() => setPassionFilter('all')}>
            Toutes
          </FilterChip>
          {passions.map((id) => (
            <FilterChip key={id} selected={passionFilter === id} onClick={() => setPassionFilter(id)}>
              <span aria-hidden>{getPassion(id).emoji}</span> {getPassion(id).label}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Humeur">
          <FilterChip selected={moodFilter === 'all'} onClick={() => setMoodFilter('all')}>
            Toutes
          </FilterChip>
          {MOODS.map((mood) => (
            <FilterChip key={mood.id} selected={moodFilter === mood.id} onClick={() => setMoodFilter(mood.id)}>
              <span aria-hidden>{mood.emoji}</span> {mood.shortLabel}
            </FilterChip>
          ))}
        </FilterRow>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm" aria-live="polite">
        <span className="font-semibold text-ink-soft">{pluralize(filtered.length, 'activité')}</span>
        {hasFilters && (
          <button
            type="button"
            className="font-semibold text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setPassionFilter('all')
              setMoodFilter('all')
            }}
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {history === undefined ? (
        <p className="text-ink-soft">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-[1.4rem] border border-dashed border-line p-6 text-center text-ink-soft">
          <p className="text-2xl" aria-hidden>
            🔍
          </p>
          <p className="mt-1">{hasFilters ? 'Aucune activité ne correspond à ces filtres.' : 'Ton historique est encore vide.'}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.dateKey} aria-label={formatDayLabel(group.dateKey)}>
              <h2 className="sticky top-0 z-10 -mx-4 bg-paper/95 px-4 py-1.5 text-sm font-bold text-ink-soft backdrop-blur">
                {formatDayLabel(group.dateKey)}
              </h2>
              <ul className="mt-1 space-y-2">
                {group.entries.map((entry) => (
                  <HistoryItem
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? undefined : entry.id)}
                    onEdit={() => setEditingId(entry.id)}
                    onDelete={() => setDeletingId(entry.id)}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <EntryEditModal entry={editing} onClose={() => setEditingId(undefined)} />
      <ConfirmDialog
        open={deletingId !== undefined}
        title="Supprimer cette activité ?"
        message="Elle disparaîtra de ton historique et de tes statistiques. Cette action est définitive."
        confirmLabel="Supprimer"
        tone="danger"
        onCancel={() => setDeletingId(undefined)}
        onConfirm={async () => {
          try {
            if (deletingId !== undefined) await deleteEntry(deletingId)
            setExpandedId(undefined)
            toast('Activité supprimée')
          } catch {
            toast('Impossible de supprimer cette activité')
          } finally {
            setDeletingId(undefined)
          }
        }}
      />
    </AppShell>
  )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={`Filtrer par ${label.toLowerCase()}`}>
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">{label}</p>
      <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">{children}</div>
    </div>
  )
}

function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-[0.97]',
        selected ? 'border-ink bg-ink text-paper' : 'border-line bg-card text-ink hover:border-ink-faint',
      )}
    >
      {children}
    </button>
  )
}

function HistoryItem({
  entry,
  expanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  entry: HistoryEntry
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const passion = getPassion(entry.passionId)
  const mood = getMood(entry.mood)
  const detailsId = `entry-details-${entry.id}`

  return (
    <li className="rounded-[1.25rem] border border-line bg-card shadow-soft">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
        className="flex w-full items-start gap-3 p-3 text-left"
      >
        <PassionEmoji passionId={entry.passionId} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">
            {entry.title}
            {entry.isDemo && (
              <span className="ml-1.5 inline-block rounded-md bg-saffron-soft px-1.5 py-px align-middle text-[0.65rem] font-bold uppercase tracking-wide">
                démo
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-ink-soft">
            {passion.label} · <span aria-hidden>{mood.emoji}</span> {mood.shortLabel} · {entry.duration} min · {formatTime(entry.completedAt)}
          </span>
        </span>
        <ChevronDown className={cn('mt-1 size-5 shrink-0 text-ink-faint transition-transform', expanded && 'rotate-180')} aria-hidden />
      </button>

      {expanded && (
        <div id={detailsId} className="animate-fade-in space-y-3 border-t border-line px-3 pb-3 pt-3">
          <p className="text-[0.95rem] leading-relaxed">{fr(entry.description)}</p>
          {entry.photoId !== undefined && <EntryPhoto photoId={entry.photoId} alt={entry.title} />}
          {entry.film && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">🎬 {entry.film.title}</span>
              <StarRating value={entry.film.rating} size="sm" />
            </p>
          )}
          {entry.note && <p className="rounded-xl bg-paper p-2.5 text-sm italic leading-relaxed">{fr(entry.note)}</p>}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<Pencil className="size-4" aria-hidden />} onClick={onEdit}>
              {passion.progressView === 'films' ? 'Note ou film' : 'Modifier la note'}
            </Button>
            <Button size="sm" variant="danger-ghost" icon={<Trash2 className="size-4" aria-hidden />} onClick={onDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

function EntryPhoto({ photoId, alt }: { photoId: number; alt: string }) {
  const url = usePhotoUrl(photoId)
  if (!url) return null
  return <img src={url} alt={alt} className="max-h-60 rounded-2xl border border-line object-cover" />
}
