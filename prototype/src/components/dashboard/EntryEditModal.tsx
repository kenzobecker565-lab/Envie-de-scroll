import { useState } from 'react'
import { getPassion } from '../../data/passions'
import { updateEntryDetails } from '../../services/historyService'
import type { FilmLog, HistoryEntry } from '../../types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { StarRating } from '../ui/StarRating'
import { useToast } from '../ui/Toast'

/**
 * Modifier les détails d'une activité passée : la note, et pour les
 * passions « films » (cinéma), le film regardé et sa note sur 5.
 * Le contenu n'est monté qu'à l'ouverture : les champs repartent toujours
 * des valeurs enregistrées.
 */
export function EntryEditModal({ entry, onClose }: { entry: HistoryEntry | undefined; onClose: () => void }) {
  return (
    <Modal open={entry !== undefined} onClose={onClose} title={entry?.title ?? ''} description="Ajoute ou modifie les détails de cette activité.">
      {entry && <EntryEditForm key={entry.id} entry={entry} onClose={onClose} />}
    </Modal>
  )
}

function EntryEditForm({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const toast = useToast()
  const isFilm = getPassion(entry.passionId).progressView === 'films'
  const [note, setNote] = useState(entry.note ?? '')
  const [filmTitle, setFilmTitle] = useState(entry.film?.title ?? '')
  const [rating, setRating] = useState<FilmLog['rating']>(entry.film?.rating ?? 0)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (entry.id === undefined) return
    setSaving(true)
    try {
      await updateEntryDetails(entry.id, {
        note,
        ...(isFilm ? { film: filmTitle.trim() ? { title: filmTitle, rating } : null } : {}),
      })
      toast('Modifications enregistrées')
      onClose()
    } catch {
      toast('Impossible d’enregistrer')
      setSaving(false)
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      {isFilm && (
        <div>
          <label htmlFor="edit-film" className="mb-1.5 block font-semibold">
            Film regardé
          </label>
          <input
            id="edit-film"
            data-autofocus
            value={filmTitle}
            onChange={(event) => setFilmTitle(event.target.value)}
            maxLength={120}
            placeholder="Titre du film"
            className="h-12 w-full rounded-2xl border-[1.5px] border-line bg-paper px-4 text-base outline-none transition placeholder:text-ink-faint focus:border-primary"
          />
          <div className="mt-2 flex items-center gap-2">
            <span className="text-sm text-ink-soft">Note&nbsp;:</span>
            <StarRating value={rating} onChange={setRating} label="Note du film" />
          </div>
        </div>
      )}
      <div>
        <label htmlFor="edit-note" className="mb-1.5 block font-semibold">
          Ta note
        </label>
        <textarea
          id="edit-note"
          data-autofocus={isFilm ? undefined : true}
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={500}
          placeholder="Ce que tu as créé, ce que tu as ressenti…"
          className="w-full resize-none rounded-2xl border-[1.5px] border-line bg-paper px-4 py-3 text-base leading-relaxed outline-none transition placeholder:text-ink-faint focus:border-primary"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button type="submit" busy={saving}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
