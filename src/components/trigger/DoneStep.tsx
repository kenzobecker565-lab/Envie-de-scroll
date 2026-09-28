import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, Flame, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { getPassion } from '../../data/passions'
import { usePhotoUrl, useStats } from '../../hooks/useData'
import { navigate, type RouteName } from '../../hooks/useRoute'
import { pluralize } from '../../lib/dates'
import { attachPhoto, getEntry, updateEntryDetails } from '../../services/historyService'
import type { Activity, FilmLog } from '../../types'
import { Button } from '../ui/Button'
import { PhotoButton } from '../ui/PhotoButton'
import { StarRating } from '../ui/StarRating'
import { BottomBar, StepHeading } from '../ui/StepHeading'
import { useToast } from '../ui/Toast'

/**
 * Après « C'est fait » : l'activité est DÉJÀ enregistrée. On célèbre, puis on
 * propose d'enrichir l'entrée selon la passion : une photo (galerie), un film
 * et sa note (cinéma), ou simplement une petite note.
 */
export function DoneStep({ entryId, activity }: { entryId: number; activity: Activity }) {
  const entry = useLiveQuery(() => getEntry(entryId), [entryId])
  const { stats } = useStats()
  const toast = useToast()
  const passion = getPassion(activity.passionId)

  const [note, setNote] = useState('')
  const [filmTitle, setFilmTitle] = useState('')
  const [rating, setRating] = useState<FilmLog['rating']>(0)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const photoUrl = usePhotoUrl(entry?.photoId)

  const addPhoto = async (file: File) => {
    setUploading(true)
    try {
      await attachPhoto(entryId, file)
      toast('Photo ajoutée à ta galerie')
    } catch {
      toast('Impossible d’ajouter cette photo')
    } finally {
      setUploading(false)
    }
  }

  const finish = async (route: RouteName) => {
    setSaving(true)
    try {
      const hasFilm = passion.progressView === 'films' && filmTitle.trim() !== ''
      if (note.trim() || hasFilm) {
        await updateEntryDetails(entryId, {
          note,
          ...(hasFilm ? { film: { title: filmTitle, rating } } : {}),
        })
      }
      navigate(route)
    } catch {
      toast('Impossible d’enregistrer ces détails')
      setSaving(false)
    }
  }

  const streak = stats?.currentStreak ?? 0

  return (
    <>
      <div className="flex flex-col items-center pt-2 text-center">
        <div className="relative">
          <div className="grid size-24 animate-pop place-items-center rounded-full bg-sage text-card shadow-lift">
            <Check className="size-12" strokeWidth={3} aria-hidden />
          </div>
          <span aria-hidden className="absolute -left-7 top-1 animate-fade-up text-2xl [animation-delay:250ms]">
            ✨
          </span>
          <span aria-hidden className="absolute -right-8 top-8 animate-fade-up text-2xl [animation-delay:400ms]">
            {passion.emoji}
          </span>
          <span aria-hidden className="absolute -bottom-1 -left-5 animate-fade-up text-xl [animation-delay:550ms]">
            🎉
          </span>
        </div>
        <StepHeading
          title="Envie transformée !"
          subtitle={`+${activity.duration} min passées à créer plutôt qu’à scroller.`}
          className="mb-0 mt-6"
        />
        {streak > 0 && (
          <p className="mt-4 inline-flex animate-fade-up items-center gap-1.5 rounded-full bg-saffron-soft px-3.5 py-1.5 font-semibold [animation-delay:300ms]">
            <Flame className="size-4 text-primary" aria-hidden />
            {streak === 1 ? 'Premier jour de ta série' : `Série de ${pluralize(streak, 'jour')} d’affilée`}
          </p>
        )}
      </div>

      <section className="mt-7 space-y-5 rounded-[1.6rem] border border-line bg-card p-4 shadow-soft" aria-label="Détails facultatifs">
        {passion.progressView === 'gallery' && (
          <div>
            <h2 className="mb-2 font-display text-lg font-semibold">
              {passion.id === 'dessin' ? 'Garde une trace de ton dessin' : 'Garde une trace de ta création'}
            </h2>
            {photoUrl ? (
              <div className="flex items-center gap-3">
                <img src={photoUrl} alt="Ta photo" className="size-20 rounded-2xl border border-line object-cover" />
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-sage">Ajoutée à ta galerie ✓</p>
                  <PhotoButton
                    onFile={addPhoto}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    <RefreshCw className="size-4" aria-hidden /> Changer la photo
                  </PhotoButton>
                </div>
              </div>
            ) : (
              <PhotoButton
                onFile={addPhoto}
                disabled={uploading}
                className="flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-5 text-center transition hover:border-primary disabled:opacity-60"
              >
                <Camera className="size-7 text-primary" aria-hidden />
                <span className="font-semibold">{uploading ? 'Ajout en cours…' : 'Ajouter une photo'}</span>
                <span className="text-sm text-ink-soft">Elle rejoindra ta galerie, sur ton appareil uniquement.</span>
              </PhotoButton>
            )}
          </div>
        )}

        {passion.progressView === 'films' && (
          <div>
            <label htmlFor="film-title" className="mb-2 block font-display text-lg font-semibold">
              Quel film as-tu regardé&nbsp;?
            </label>
            <input
              id="film-title"
              value={filmTitle}
              onChange={(event) => setFilmTitle(event.target.value)}
              maxLength={120}
              placeholder="Titre du film ou du court-métrage"
              className="h-12 w-full rounded-2xl border-[1.5px] border-line bg-paper px-4 text-base outline-none transition placeholder:text-ink-faint focus:border-primary"
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-ink-soft">Ta note&nbsp;:</span>
              <StarRating value={rating} onChange={setRating} label="Ta note du film" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="entry-note" className="mb-2 block font-display text-lg font-semibold">
            Un mot sur ce que tu as fait&nbsp;? <span className="font-sans text-sm font-normal text-ink-soft">(facultatif)</span>
          </label>
          <textarea
            id="entry-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="Ce que tu as créé, ce que tu as ressenti…"
            className="w-full resize-none rounded-2xl border-[1.5px] border-line bg-paper px-4 py-3 text-base leading-relaxed outline-none transition placeholder:text-ink-faint focus:border-primary"
          />
        </div>
      </section>

      <BottomBar>
        <Button size="lg" block busy={saving} onClick={() => finish('accueil')}>
          Terminer
        </Button>
        <Button size="lg" variant="ghost" block disabled={saving} onClick={() => finish('progres')}>
          Voir ma progression
        </Button>
      </BottomBar>
    </>
  )
}
