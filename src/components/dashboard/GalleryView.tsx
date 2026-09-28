import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { usePhotoUrl } from '../../hooks/useData'
import { formatDayLabel, formatRelativeDay, pluralize } from '../../lib/dates'
import { fr } from '../../lib/typography'
import { attachPhoto, removePhoto } from '../../services/historyService'
import type { HistoryEntry } from '../../types'
import { Button } from '../ui/Button'
import { ConfirmDialog, Modal } from '../ui/Modal'
import { PhotoButton } from '../ui/PhotoButton'
import { useToast } from '../ui/Toast'

/**
 * Galerie (dessin) : les photos de ce que l'utilisateur a réalisé.
 * Les activités sans photo restent visibles, avec un bouton pour en ajouter une.
 */
export function GalleryView({ entries }: { entries: HistoryEntry[] }) {
  const [openedId, setOpenedId] = useState<number>()
  const toast = useToast()
  const withPhoto = entries.filter((entry) => entry.photoId !== undefined)
  const withoutPhoto = entries.filter((entry) => entry.photoId === undefined)
  const opened = entries.find((entry) => entry.id === openedId)

  const addPhoto = async (entry: HistoryEntry, file: File) => {
    if (entry.id === undefined) return
    try {
      await attachPhoto(entry.id, file)
      toast('Photo ajoutée à ta galerie')
    } catch {
      toast('Impossible d’ajouter cette photo')
    }
  }

  return (
    <>
      <p className="mb-3 text-sm text-ink-soft">
        {pluralize(withPhoto.length, 'photo')} · {pluralize(entries.length, 'activité')}
      </p>

      {withPhoto.length > 0 && (
        <ul className="grid grid-cols-2 gap-3">
          {withPhoto.map((entry) => (
            <li key={entry.id}>
              <GalleryTile entry={entry} onOpen={() => setOpenedId(entry.id)} />
            </li>
          ))}
        </ul>
      )}

      {withoutPhoto.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-sm font-bold text-ink-soft">Sans photo pour l’instant</h3>
          <ul className="grid grid-cols-2 gap-3">
            {withoutPhoto.map((entry) => (
              <li key={entry.id}>
                <PhotoButton
                  onFile={(file) => addPhoto(entry, file)}
                  label={`Ajouter une photo pour « ${entry.title} »`}
                  className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-card p-3 text-center transition hover:border-primary"
                >
                  <ImagePlus className="size-6 text-primary" aria-hidden />
                  <span className="text-sm font-semibold leading-tight">{entry.title}</span>
                  <span className="text-xs text-ink-soft">{formatRelativeDay(entry.dateKey)}</span>
                </PhotoButton>
              </li>
            ))}
          </ul>
        </>
      )}

      <PhotoViewer entry={opened} onClose={() => setOpenedId(undefined)} onReplace={addPhoto} />
    </>
  )
}

function GalleryTile({ entry, onOpen }: { entry: HistoryEntry; onOpen: () => void }) {
  const url = usePhotoUrl(entry.photoId)
  return (
    <button type="button" onClick={onOpen} className="group block w-full text-left">
      <div className="aspect-square overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
        {url ? (
          <img src={url} alt={entry.title} loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="size-full animate-pulse bg-line/50" />
        )}
      </div>
      <p className="mt-1.5 truncate text-sm font-semibold">{entry.title}</p>
      <p className="text-xs text-ink-soft">{formatRelativeDay(entry.dateKey)}</p>
    </button>
  )
}

function PhotoViewer({
  entry,
  onClose,
  onReplace,
}: {
  entry: HistoryEntry | undefined
  onClose: () => void
  onReplace: (entry: HistoryEntry, file: File) => Promise<void>
}) {
  const url = usePhotoUrl(entry?.photoId)
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  return (
    <>
      <Modal
        open={entry !== undefined && !confirming}
        onClose={onClose}
        variant="sheet"
        title={entry?.title ?? ''}
        description={entry ? formatDayLabel(entry.dateKey) : undefined}
        footer={
          entry && (
            <>
              <Button variant="ghost" icon={<Trash2 className="size-4" aria-hidden />} onClick={() => setConfirming(true)}>
                Retirer la photo
              </Button>
              <PhotoButton
                onFile={(file) => onReplace(entry, file)}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card px-5 font-semibold shadow-soft transition hover:border-ink-faint"
              >
                <RefreshCw className="size-4" aria-hidden /> Remplacer
              </PhotoButton>
            </>
          )
        }
      >
        {entry && (
          <div className="space-y-3">
            {url && <img src={url} alt={entry.title} className="max-h-[55dvh] w-full rounded-2xl border border-line bg-paper object-contain" />}
            <p className="leading-relaxed text-ink-soft">{fr(entry.description)}</p>
            {entry.note && <p className="rounded-2xl bg-paper p-3 italic leading-relaxed">{fr(entry.note)}</p>}
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={confirming}
        title="Retirer cette photo ?"
        message="L’activité reste dans ton historique, seule la photo est supprimée."
        confirmLabel="Retirer la photo"
        tone="danger"
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          if (entry?.id !== undefined) await removePhoto(entry.id)
          toast('Photo retirée')
          setConfirming(false)
          onClose()
        }}
      />
    </>
  )
}
