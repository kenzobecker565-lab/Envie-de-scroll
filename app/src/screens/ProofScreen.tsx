import { Camera, RefreshCw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { getPassion, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH, suggestedTitle, type ProposalDTO } from '@scroll-up/shared'
import { api, ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { prepareImage } from '../lib/image.ts'
import { useUnlock } from '../lib/useUnlock.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

interface Submission {
  photo?: Blob
  text?: string
  exploredTitle?: string
}

/**
 * Après « Valider » :
 * - Dessin : ajouter une photo du dessin ;
 * - Écriture : coller ou écrire le texte produit ;
 * - Musique, Cinéma : noter (si on veut) ce qu'on a exploré.
 * Dessin et Écriture : « enregistrer sans » est possible une fois la durée
 * écoulée (même garde-fou léger que pour Musique et Cinéma).
 */
export function ProofScreen() {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const proposal = state.flow.proposal
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  if (!proposal) return null
  const passion = getPassion(proposal.passion)

  const submit = async (submission: Submission) => {
    if (saving) return
    setSaving(true)
    setError(undefined)
    try {
      const previousTotal = state.me.stats.totalCoins
      const response = await api.complete({ proposalId: proposal.id, ...submission })
      dispatch({ type: 'stats', stats: response.stats })
      dispatch({ type: 'openProposal', proposal: null })
      dispatch({ type: 'done', done: { response, previousTotal, photoPending: response.completion.photoPending } })
      dispatch({ type: 'newFlow' })
      reset([{ name: 'home' }, { name: 'done' }])
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Oups, l’enregistrement a échoué. Réessaie\u00A0?')
      setSaving(false)
    }
  }

  const errorNote = error && (
    <p className="mt-2 text-center text-13 text-warm-ink" role="alert">
      {error}
    </p>
  )

  if (passion.proof === 'photo') return <PhotoProof proposal={proposal} clockOffset={state.flow.clockOffset} saving={saving} onSubmit={submit} footer={errorNote} />
  if (passion.proof === 'texte') return <TextProof proposal={proposal} clockOffset={state.flow.clockOffset} saving={saving} onSubmit={submit} footer={errorNote} />
  return <TitleProof proposal={proposal} saving={saving} onSubmit={submit} footer={errorNote} />
}

interface ProofProps {
  proposal: ProposalDTO
  saving: boolean
  onSubmit: (submission: Submission) => void
  footer: React.ReactNode
}

/** « Enregistrer sans » : disponible à la fin de la durée choisie. */
function SkipProof({ proposal, clockOffset, label, hint, saving, onSkip }: { proposal: ProposalDTO; clockOffset: number; label: string; hint: string; saving: boolean; onSkip: () => void }) {
  const { unlocked } = useUnlock(proposal.createdAt, proposal.unlockAt, clockOffset)
  return (
    <div className="mt-2 text-center">
      <Button variant="ghost" className="w-full" disabled={!unlocked || saving} onClick={onSkip}>
        {label}
      </Button>
      <p className="text-12 text-ink-soft">{unlocked ? hint : `Possible à la fin des ${proposal.duration} minutes.`}</p>
    </div>
  )
}

/* ---------------------------------- Dessin --------------------------------- */

function PhotoProof({ proposal, clockOffset, saving, onSubmit, footer }: ProofProps & { clockOffset: number }) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<Blob>()
  const [preview, setPreview] = useState<string>()
  const [preparing, setPreparing] = useState(false)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  const pick = async (file: File | undefined) => {
    if (!file) return
    setPreparing(true)
    const prepared = await prepareImage(file)
    setPhoto(prepared)
    setPreview(URL.createObjectURL(prepared))
    setPreparing(false)
    haptics.selection()
  }

  return (
    <Screen>
      <ScreenTitle subtitle={'Une photo, même rapide\u00A0: elle rejoindra ta galerie.'}>Montre-nous ton dessin</ScreenTitle>
      <input
        ref={input}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void pick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <AnimatePresence mode="wait" initial={false}>
        {preview ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative">
            <img src={preview} alt="Aperçu de ton dessin" className="max-h-[55vh] w-full rounded-md bg-surface-300 object-contain shadow-card" />
            <div className="absolute right-2 bottom-2">
              <Button variant="secondary" className="h-10 text-13" icon={<RefreshCw size={16} aria-hidden="true" />} onClick={() => input.current?.click()}>
                Changer
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.label
            key="pick"
            htmlFor={inputId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-md border-2 border-dashed border-line bg-surface-200 p-6 text-center"
          >
            {preparing ? (
              <span className="skeleton h-16 w-16 rounded-pill" aria-label="Préparation de la photo" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-accent-soft">
                <Camera size={30} className="text-accent" aria-hidden="true" />
              </span>
            )}
            <span>
              <span className="block text-15 font-bold text-ink">Prendre ou choisir une photo</span>
              <span className="mt-1 block text-13 text-ink-soft">Ton dessin tel qu’il est, pas besoin qu’il soit parfait.</span>
            </span>
          </motion.label>
        )}
      </AnimatePresence>

      <PrimaryAction text="Enregistrer mon dessin" onClick={() => photo && onSubmit({ photo })} enabled={Boolean(photo)} loading={saving}>
        {footer}
        <SkipProof
          proposal={proposal}
          clockOffset={clockOffset}
          label="Enregistrer sans photo"
          hint="Tu pourras aussi envoyer ta photo au bot plus tard."
          saving={saving}
          onSkip={() => onSubmit({})}
        />
      </PrimaryAction>
    </Screen>
  )
}

/* --------------------------------- Écriture -------------------------------- */

function TextProof({ proposal, clockOffset, saving, onSubmit, footer }: ProofProps & { clockOffset: number }) {
  const [text, setText] = useState('')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return (
    <Screen>
      <ScreenTitle subtitle={'Colle ou écris ici ce que tu as produit\u00A0: il rejoindra ta galerie.'}>Et ce texte, alors&nbsp;?</ScreenTitle>
      <label className="sr-only" htmlFor="proof-text">
        Ton texte
      </label>
      <textarea
        id="proof-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX_TEXT_LENGTH}
        rows={9}
        placeholder="Ton texte…"
        className="w-full resize-none rounded-sm border border-line bg-surface-200 p-4 text-15 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <p className="mt-2 text-right font-mono text-mono-xs font-bold text-ink-soft" aria-live="polite">
        {words} {words > 1 ? 'mots' : 'mot'}
      </p>

      <PrimaryAction text="Enregistrer mon texte" onClick={() => onSubmit({ text })} enabled={text.trim().length > 0} loading={saving}>
        {footer}
        <SkipProof
          proposal={proposal}
          clockOffset={clockOffset}
          label="Enregistrer sans le texte"
          hint="Ton activité comptera quand même."
          saving={saving}
          onSkip={() => onSubmit({})}
        />
      </PrimaryAction>
    </Screen>
  )
}

/* ------------------------------ Musique, Cinéma ---------------------------- */

function TitleProof({ proposal, saving, onSubmit, footer }: ProofProps) {
  const [title, setTitle] = useState(() => suggestedTitle(proposal.extra) ?? '')
  const placeholder = proposal.passion === 'musique' ? 'Un titre, un album, un artiste…' : 'Un film, un anime, un court…'
  return (
    <Screen>
      <ScreenTitle subtitle="C’est facultatif, mais ta galerie s’en souviendra.">Qu’as-tu exploré&nbsp;?</ScreenTitle>
      <label className="sr-only" htmlFor="proof-title">
        Ce que tu as exploré
      </label>
      <input
        id="proof-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="done"
        className="h-14 w-full rounded-sm border border-line bg-surface-200 px-4 text-15 text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <PrimaryAction text="Enregistrer" onClick={() => onSubmit({ exploredTitle: title })} loading={saving}>
        {footer}
      </PrimaryAction>
    </Screen>
  )
}
