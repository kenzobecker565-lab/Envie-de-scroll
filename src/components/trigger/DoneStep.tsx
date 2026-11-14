import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Check, Flame, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getPassion } from '../../data/passions'
import { usePhotoUrl, useStats } from '../../hooks/useData'
import { navigate, type RouteName } from '../../hooks/useRoute'
import { pluralize } from '../../lib/dates'
import { attachPhoto, getEntry, updateEntryDetails } from '../../services/historyService'
import type { Activity, FilmLog } from '../../types'
import { Button } from '../ui/Button'
import { PassionPicto } from '../ui/Passion'
import { PhotoButton } from '../ui/PhotoButton'
import { StarRating } from '../ui/StarRating'
import { BottomBar, StepHeading } from '../ui/StepHeading'
import { useToast } from '../ui/Toast'

interface Draft {
  note: string
  filmTitle: string
  rating: FilmLog['rating']
}

/** Enregistre la note et le film saisis, s'il y a quelque chose à enregistrer. */
async function saveDraft(entryId: number, draft: Draft, isFilm: boolean): Promise<void> {
  const hasFilm = isFilm && draft.filmTitle.trim() !== ''
  if (!draft.note.trim() && !hasFilm) return
  await updateEntryDetails(entryId, {
    note: draft.note,
    ...(hasFilm ? { film: { title: draft.filmTitle, rating: draft.rating } } : {}),
  })
}

/**
 * Après « C'est fait » : l'activité est DÉJÀ enregistrée. On célèbre, puis on
 * propose d'enrichir l'entrée selon la passion : une photo (galerie), un film
 * et sa note (cinéma), ou simplement une petite note.
 *
 * Ce qui a été saisi n'est jamais perdu : si l'on quitte l'écran autrement
 * que par « Terminer » (croix, bouton retour du navigateur…), la saisie est
 * enregistrée quand même.
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
  const isFilm = passion.progressView === 'films'

  // Sauvegarde de secours au départ de l'écran (voir plus haut).
  const draftRef = useRef<Draft>({ note: '', filmTitle: '', rating: 0 })
  const savedRef = useRef(false)
  useEffect(() => {
    draftRef.current = { note, filmTitle, rating }
  }, [note, filmTitle, rating])
  useEffect(
    () => () => {
      if (!savedRef.current) void saveDraft(entryId, draftRef.current, isFilm)
    },
    [entryId, isFilm],
  )

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
      await saveDraft(entryId, { note, filmTitle, rating }, isFilm)
      savedRef.current = true
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
          {/* Petits traits d'emphase et gribouillis, comme au feutre sur un carnet */}
          <svg aria-hidden viewBox="0 0 28 28" className="absolute -left-8 -top-2 size-8 animate-fade-up text-primary [animation-delay:250ms]">
            <path d="M14 3v7M4.5 9.5l5.5 4M23.5 9.5l-5.5 4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <PassionPicto passionId={activity.passionId} className="absolute -right-11 top-7 animate-fade-up [animation-delay:400ms]" />
          <svg aria-hidden viewBox="0 0 40 16" className="absolute -bottom-2 -left-9 h-4 w-10 animate-fade-up text-saffron [animation-delay:550ms]">
            <path d="M2 10c4-7 7-7 9 0s5 7 9 0 5-7 9 0 5 5 9-2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
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
            <h2 className="mb-2 font-display text-lg font-extrabold tracking-tight">
              {passion.id === 'dessin' ? 'Garde une trace de ton dessin' : 'Garde une trace de ta création'}
            </h2>
            {photoUrl ? (
              <div className="flex items-center gap-3">
                <img src={photoUrl} alt="Ta photo" className="size-20 rounded-2xl border border-line object-cover" />
                <div className="space-y-1.5">
                  <p className="flex items-center gap-1 text-sm font-semibold text-sage">
                    Ajoutée à ta galerie <Check className="size-4" strokeWidth={3} aria-hidden />
                  </p>
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

        {isFilm && (
          <div>
            <label htmlFor="film-title" className="mb-2 block font-display text-lg font-extrabold tracking-tight">
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
          <label htmlFor="entry-note" className="mb-2 block font-display text-lg font-extrabold tracking-tight">
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
