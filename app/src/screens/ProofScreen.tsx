import { Camera, FileCheck2, ImageOff, Info, PenLine, RefreshCw, Save } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { countFor, countWords, getPassion, getPathStep, guideFor, MAX_TEXT_LENGTH, MAX_TITLE_LENGTH, suggestedTitle, unitLabel, type ProposalDTO, type WritingGoal } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, cardVariants } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api, ApiError } from '../api/client.ts'
import { ConsigneBar } from '../components/Consigne.tsx'
import { DrawingPad, type DrawingPadHandle } from '../components/DrawingPad.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { PASSION_ICONS } from '../lib/icons.ts'
import { prepareImage } from '../lib/image.ts'
import { lessonStack } from '../lib/useLesson.ts'
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
      const previousStats = state.me.stats
      const response = await api.complete({ proposalId: proposal.id, ...submission, ...(state.flow.projectId ? { projectId: state.flow.projectId } : {}) })
      dispatch({ type: 'stats', stats: response.stats })
      dispatch({ type: 'openProposal', proposal: null })
      dispatch({ type: 'done', done: { response, previousStats, photoPending: response.completion.photoPending } })
      dispatch({ type: 'newFlow' })
      // Une étape de parcours se fête dans son parcours (le retour y ramène).
      const lesson = getPathStep(proposal.activityId)
      reset(lesson ? lessonStack(lesson, { name: 'done' }) : [{ name: 'home' }, { name: 'done' }])
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

  if (passion.proof === 'photo') return <PhotoProof proposal={proposal} clockOffset={state.flow.clockOffset} pad={Boolean(state.flow.pad)} saving={saving} onSubmit={submit} footer={errorNote} />
  if (passion.proof === 'texte') return <TextProof proposal={proposal} clockOffset={state.flow.clockOffset} saving={saving} onSubmit={submit} footer={errorNote} />
  const idea = state.flow.idea?.proposalId === proposal.id ? state.flow.idea.text : undefined
  return <TitleProof proposal={proposal} idea={idea} saving={saving} onSubmit={submit} footer={errorNote} />
}

interface ProofProps {
  proposal: ProposalDTO
  saving: boolean
  onSubmit: (submission: Submission) => void
  footer: React.ReactNode
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

function PhotoProof({ proposal, clockOffset, pad: startWithPad, saving, onSubmit, footer }: ProofProps & { clockOffset: number; pad: boolean }) {
  const inputId = useId()
  const input = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<Blob>()
  const [preview, setPreview] = useState<string>()
  const [preparing, setPreparing] = useState(false)
  // Pas de papier : on dessine au doigt, dans l'app.
  const [pad, setPad] = useState(startWithPad)
  const [hasInk, setHasInk] = useState(false)
  const drawing = useRef<DrawingPadHandle>(null)

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

  if (pad) {
    return (
      <Screen className="pt-2">
        <ConsigneBar proposal={proposal} />
        {/* Titre court : la consigne est juste au-dessus, la feuille garde la place. */}
        <h1 className="mb-4 font-display text-26 font-extrabold tracking-tight text-ink">Dessine ici, au doigt</h1>
        <DrawingPad ref={drawing} onInkChange={setHasInk} />
        <button type="button" onClick={() => setPad(false)} className="mt-4 inline-flex items-center gap-2 self-center text-14 font-bold text-ink-soft underline decoration-2 underline-offset-4">
          <Camera size={16} aria-hidden="true" />
          Plutôt une photo d’un dessin sur papier&nbsp;?
        </button>
        <PrimaryAction
          text="Enregistrer mon dessin"
          icon={<Save aria-hidden="true" />}
          onClick={() => void drawing.current?.toBlob().then((blob) => blob && onSubmit({ photo: blob }))}
          enabled={hasInk}
          loading={saving}
        >
          {footer}
        </PrimaryAction>
      </Screen>
    )
  }

  return (
    <Screen className="pt-2">
      <ConsigneBar proposal={proposal} />
      <ScreenTitle subtitle={'Une photo, même rapide\u00A0: elle rejoindra ta galerie.'}>
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
                x="10"
                y="10"
                rx="14"
                className="motion-loop anim-march"
                style={{ width: 'calc(100% - 20px)', height: 'calc(100% - 20px)', fill: 'none', stroke: 'var(--outline)', strokeWidth: 2.5, strokeDasharray: '10 8', strokeLinecap: 'round', opacity: 0.55 }}
              />
            </svg>
            {preparing ? (
              <span className="skeleton h-16 w-16 rounded-pill" aria-label="Préparation de la photo" />
            ) : (
              <span className="motion-loop anim-float relative flex h-18 w-18 -rotate-6 items-center justify-center rounded-pill border-[2.5px] border-outline bg-sky shadow-chip" style={{ '--float-duration': '3.5s' } as React.CSSProperties}>
                <Camera size={32} strokeWidth={2.3} className="text-on-color" aria-hidden="true" />
              </span>
            )}
            <span className="flex flex-col gap-1">
              <span className="font-display text-20 font-extrabold tracking-tight text-ink">Prendre ou choisir une photo</span>
              <span className="text-13 text-ink-soft">Ton dessin tel qu’il est, pas besoin qu’il soit parfait.</span>
            </span>
          </motion.label>
        )}
      </AnimatePresence>
      {!preview && (
        <button type="button" onClick={() => setPad(true)} className="mt-4 inline-flex items-center gap-2 self-center text-14 font-bold text-ink-soft underline decoration-2 underline-offset-4">
          <PenLine size={16} aria-hidden="true" />
          Pas de papier&nbsp;? Dessine au doigt, ici.
        </button>
      )}

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
  // Le brouillon est gardé sur le téléphone : on peut quitter l'app et revenir.
  const draftKey = `scroll-up:brouillon:${proposal.id}`
  const [text, setText] = useState(() => readDraft(draftKey))
  const goal = guideFor(proposal.activityId)?.goal
  const words = countWords(text)
  const reached = goal ? countFor(goal.unit, text) >= goal.count : false
  const wasReached = useRef(reached)

  useEffect(() => {
    const timer = window.setTimeout(() => writeDraft(draftKey, text), 400)
    return () => window.clearTimeout(timer)
  }, [draftKey, text])

  useEffect(() => {
    if (reached && !wasReached.current) haptics.success()
    wasReached.current = reached
  }, [reached])

  const submit = (submission: Submission) => {
    writeDraft(draftKey, '')
    onSubmit(submission)
  }

  return (
    <Screen className="pt-2">
      <ConsigneBar proposal={proposal} />
      <ScreenTitle subtitle={'Écris ici, ou colle ce que tu as écrit ailleurs\u00A0: ton texte rejoindra ta galerie.'}>
        Ton carnet
      </ScreenTitle>
      <label className="sr-only" htmlFor="proof-text">
        Ton texte
      </label>
      {/* Une page de carnet : spirale, lignes, marge. */}
      <div className="overflow-hidden rounded-md border-[2.5px] border-outline bg-paper shadow-card">
        <div aria-hidden="true" className="flex justify-around border-b-2 border-outline bg-lilac px-4 py-2">
          {Array.from({ length: 9 }, (_, index) => (
            <span key={index} className="h-3 w-3 rounded-pill border-2 border-outline bg-canvas" />
          ))}
        </div>
        <Textarea
          id="proof-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MAX_TEXT_LENGTH}
          rows={9}
          placeholder="Il était une fois…"
          className="min-h-[268px] rounded-none border-0 bg-transparent pt-[10px] pr-4 pl-12 text-17 leading-[28px] font-semibold text-on-color focus-visible:shadow-none"
          style={NOTEBOOK_PAPER}
        />
      </div>
      <WritingGauge goal={goal} text={text} words={words} reached={reached} />

      <PrimaryAction text="Enregistrer mon texte" icon={<Save aria-hidden="true" />} onClick={() => submit({ text })} enabled={text.trim().length > 0} loading={saving}>
        {footer}
        <SkipProof
          proposal={proposal}
          clockOffset={clockOffset}
          label="Enregistrer sans le texte"
          icon={<FileCheck2 aria-hidden="true" />}
          hint="Ton activité comptera quand même."
          saving={saving}
          onSkip={() => submit({})}
        />
      </PrimaryAction>
    </Screen>
  )
}

/** Lignes du carnet (une tous les 28 px, qui défilent avec le texte) et marge rouge. */
const NOTEBOOK_PAPER: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(to right, transparent 34px, color-mix(in srgb, var(--accent) 60%, transparent) 34px, color-mix(in srgb, var(--accent) 60%, transparent) 36px, transparent 36px), linear-gradient(to bottom, transparent 27px, color-mix(in srgb, var(--lilac) 80%, transparent) 27px)',
  backgroundSize: '100% 100%, 100% 28px',
  backgroundPosition: '0 0, 0 10px',
  backgroundAttachment: 'local, local',
  color: '#151515',
}

/** Le compteur : l'objectif de l'activité (« 63 / 100 mots »), sinon le nombre de mots. */
function WritingGauge({ goal, text, words, reached }: { goal?: WritingGoal; text: string; words: number; reached: boolean }) {
  if (!goal) {
    return (
      <p className="mt-2 text-right font-numbers text-14 font-extrabold text-ink-soft" aria-live="polite">
        {words} {words > 1 ? 'mots' : 'mot'}
      </p>
    )
  }
  const count = countFor(goal.unit, text)
  const ratio = Math.min(1, count / goal.count)
  return (
    <div className="mt-3 flex flex-col gap-1.5" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-13 font-bold">
        <span className="text-ink-soft">Objectif&nbsp;: {goal.label}</span>
        <span className={cn('font-numbers text-14 font-extrabold', reached ? 'text-good-ink' : 'text-ink')}>
          {reached ? 'Objectif atteint\u00A0✓' : `${count} / ${goal.count} ${unitLabel(goal.unit, goal.count)}`}
        </span>
      </div>
      <span aria-hidden="true" className="block h-3 overflow-hidden rounded-pill border-2 border-outline bg-surface-200">
        <motion.span className={cn('block h-full origin-left', reached ? 'bg-good' : 'bg-lilac')} animate={{ scaleX: ratio }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
      </span>
    </div>
  )
}

function readDraft(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function writeDraft(key: string, text: string): void {
  try {
    if (text.trim()) localStorage.setItem(key, text)
    else localStorage.removeItem(key)
  } catch {
    // Stockage indisponible (navigation privée) : tant pis pour le brouillon.
  }
}

/* --------------------------- Musique, Cinéma, Piano ------------------------ */

const TITLE_PROOF: Partial<Record<ProposalDTO['passion'], { question: string; label: string; placeholder: string }>> = {
  musique: { question: 'Qu’as-tu exploré\u00A0?', label: 'Ce que tu as exploré', placeholder: 'Un titre, un album, un artiste…' },
  cinema: { question: 'Qu’as-tu exploré\u00A0?', label: 'Ce que tu as exploré', placeholder: 'Un film, un anime, un court…' },
  piano: { question: 'Qu’as-tu joué\u00A0?', label: 'Ce que tu as joué', placeholder: 'Un morceau, un exercice, une gamme…' },
}

function TitleProof({ proposal, idea, saving, onSubmit, footer }: ProofProps & { idea?: string }) {
  // L'idée choisie sous l'activité, sinon ce que l'appli avait tiré, sinon la mélodie du clavier.
  const [title, setTitle] = useState(() => (idea ?? suggestedTitle(proposal.extra) ?? guideFor(proposal.activityId)?.melody?.title ?? '').slice(0, MAX_TITLE_LENGTH))
  const copy = TITLE_PROOF[proposal.passion] ?? TITLE_PROOF.cinema!
  const Icon = PASSION_ICONS[proposal.passion]
  return (
    <Screen className="pt-2">
      <ConsigneBar proposal={proposal} />
      <ScreenTitle subtitle="C’est facultatif, mais ta galerie s’en souviendra.">{copy.question}</ScreenTitle>
      <label className="sr-only" htmlFor="proof-title">
        {copy.label}
      </label>
      <div className="relative">
        <Icon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          id="proof-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder={copy.placeholder}
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
