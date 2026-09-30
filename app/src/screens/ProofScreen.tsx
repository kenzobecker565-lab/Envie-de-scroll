import { Camera, Clock3, FileCheck2, ImageOff, Info, RefreshCw, Save, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { getPassion, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH, suggestedTitle, type ProposalDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, cardVariants } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api, ApiError } from '../api/client.ts'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { PASSION_ICONS } from '../lib/icons.ts'
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
    <Alert variant="warning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Info aria-hidden="true" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
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

/** Rappel de l'activité en cours : passion et durée, au-dessus du titre. */
function ProofContext({ proposal }: { proposal: ProposalDTO }) {
  const Icon: LucideIcon = PASSION_ICONS[proposal.passion]
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="soft">
        <Icon aria-hidden="true" />
        {getPassion(proposal.passion).label}
      </Badge>
      <Badge variant="soft" className="font-mono">
        <Clock3 aria-hidden="true" />
        {proposal.duration} min
      </Badge>
    </div>
  )
}

/** « Enregistrer sans » : disponible à la fin de la durée choisie. */
function SkipProof({
  proposal,
  clockOffset,
  label,
  icon,
  hint,
  saving,
  onSkip,
}: {
  proposal: ProposalDTO
  clockOffset: number
  label: string
  icon: React.ReactNode
  hint: string
  saving: boolean
  onSkip: () => void
}) {
  const { unlocked } = useUnlock(proposal.createdAt, proposal.unlockAt, clockOffset)
  return (
    <div className="flex flex-col items-center">
      <Button variant="ghost" size="md" className="w-full" disabled={!unlocked || saving} onClick={onSkip}>
        {icon}
        {label}
      </Button>
      <p className="text-center text-12 text-ink-soft">{unlocked ? hint : `Possible à la fin des ${proposal.duration} minutes.`}</p>
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
      <ScreenTitle eyebrow={<ProofContext proposal={proposal} />} subtitle={'Une photo, même rapide\u00A0: elle rejoindra ta galerie.'}>
        Montre-nous ton dessin
      </ScreenTitle>
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
          <Card
            key="preview"
            className="p-2"
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <img src={preview} alt="Aperçu de ton dessin" className="max-h-[55vh] w-full rounded-sm bg-surface-300 object-contain" />
            <div className="absolute right-4 bottom-4">
              <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
                <RefreshCw aria-hidden="true" />
                Changer
              </Button>
            </div>
          </Card>
        ) : (
          <motion.label
            key="pick"
            htmlFor={inputId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.98 }}
            className={cn(cardVariants({ padding: 'lg' }), 'aspect-[4/3] w-full cursor-pointer items-center justify-center text-center')}
          >
            {/* Pointillés qui avancent tout autour de la zone. */}
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <rect
                x="1.5"
                y="1.5"
                width="99%"
                height="99%"
                rx="13"
                className="motion-loop anim-march"
                style={{ width: 'calc(100% - 3px)', height: 'calc(100% - 3px)', fill: 'none', stroke: 'var(--accent)', strokeWidth: 2, strokeDasharray: '8 6', opacity: 0.6 }}
              />
            </svg>
            {preparing ? (
              <span className="skeleton h-16 w-16 rounded-pill" aria-label="Préparation de la photo" />
            ) : (
              <span className="motion-loop anim-float relative flex h-16 w-16 items-center justify-center rounded-pill bg-accent-soft" style={{ '--float-duration': '3.5s' } as React.CSSProperties}>
                <span aria-hidden="true" className="motion-loop anim-pulse-soft absolute inset-0 rounded-pill border-2 border-accent opacity-30" />
                <Camera size={30} className="text-accent" aria-hidden="true" />
              </span>
            )}
            <span className="flex flex-col gap-1">
              <span className="text-15 font-bold text-ink">Prendre ou choisir une photo</span>
              <span className="text-13 text-ink-soft">Ton dessin tel qu’il est, pas besoin qu’il soit parfait.</span>
            </span>
          </motion.label>
        )}
      </AnimatePresence>

      <PrimaryAction text="Enregistrer mon dessin" icon={<Save aria-hidden="true" />} onClick={() => photo && onSubmit({ photo })} enabled={Boolean(photo)} loading={saving}>
        {footer}
        <SkipProof
          proposal={proposal}
          clockOffset={clockOffset}
          label="Enregistrer sans photo"
          icon={<ImageOff aria-hidden="true" />}
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
      <ScreenTitle eyebrow={<ProofContext proposal={proposal} />} subtitle={'Colle ou écris ici ce que tu as produit\u00A0: il rejoindra ta galerie.'}>
        Et ce texte, alors&nbsp;?
      </ScreenTitle>
      <label className="sr-only" htmlFor="proof-text">
        Ton texte
      </label>
      <Textarea id="proof-text" value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX_TEXT_LENGTH} rows={9} placeholder="Ton texte…" />
      <p className="mt-2 text-right font-mono text-mono-xs font-bold text-ink-soft" aria-live="polite">
        {words} {words > 1 ? 'mots' : 'mot'}
      </p>

      <PrimaryAction text="Enregistrer mon texte" icon={<Save aria-hidden="true" />} onClick={() => onSubmit({ text })} enabled={text.trim().length > 0} loading={saving}>
        {footer}
        <SkipProof
          proposal={proposal}
          clockOffset={clockOffset}
          label="Enregistrer sans le texte"
          icon={<FileCheck2 aria-hidden="true" />}
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
  const Icon = PASSION_ICONS[proposal.passion]
  return (
    <Screen>
      <ScreenTitle eyebrow={<ProofContext proposal={proposal} />} subtitle="C’est facultatif, mais ta galerie s’en souviendra.">
        Qu’as-tu exploré&nbsp;?
      </ScreenTitle>
      <label className="sr-only" htmlFor="proof-title">
        Ce que tu as exploré
      </label>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          id="proof-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          className="pl-12"
        />
      </div>
      <PrimaryAction text="Enregistrer" icon={<Save aria-hidden="true" />} onClick={() => onSubmit({ exploredTitle: title })} loading={saving}>
        {footer}
      </PrimaryAction>
    </Screen>
  )
}
