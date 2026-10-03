import { CalendarHeart, Check, Clock3, Hourglass, Info, LoaderCircle, Mountain, Piano, RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getChallengeActivity, getPassion, getPath, getPathStep, isFixedActivityId, keyboardMelody, STEPS_PER_PATH, type ActivityExtra, type ChallengeActivity, type PassionId, type PathStep, type ProposalDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api, ApiError } from '../api/client.ts'
import { ActivityHelp } from '../components/ActivityHelp.tsx'
import { FloatingConsigne, useScrolledPast } from '../components/Consigne.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { PianoKeyboard } from '../components/PianoKeyboard.tsx'
import { DifficultyMeter } from '../components/Paths.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { FlowStatus } from '../components/FlowStatus.tsx'
import { Screen } from '../components/Screen.tsx'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { lessonStack } from '../lib/useLesson.ts'
import { useUnlock } from '../lib/useUnlock.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * L'activité proposée, en grand. « Une autre idée » (discret) retire au sort ;
 * « Valider » mène à la preuve (photo, texte) ou au titre exploré.
 * Musique et Cinéma : « Valider » reste grisé jusqu'à la fin de la durée
 * choisie, avec un indicateur doux (pas de compte à rebours).
 *
 * Une leçon de parcours (le mode progression) arrive ici directement, sans
 * humeur, et sa réussite propose aussitôt l'étape suivante.
 *
 * Piano (tuto de chanson ou leçon) : le clavier est dans l'activité, avec la
 * partition. « Valider » s'active dès la dernière note jouée, sans attendre.
 */
export function ActivityScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const { flow } = state
  const { passion: passionId, mood, duration } = flow

  // Étape de parcours : l'étape elle-même, jamais un tirage. Une leçon se joue sans humeur.
  const fixedStep = flow.fixedStep
  const lesson = fixedStep ? getPathStep(fixedStep) : undefined
  const matches = (proposal: ProposalDTO | undefined): proposal is ProposalDTO =>
    Boolean(
      proposal &&
        proposal.passion === passionId &&
        (proposal.mood ?? undefined) === mood &&
        proposal.duration === duration &&
        (fixedStep ? proposal.activityId === fixedStep : !isFixedActivityId(proposal.activityId)),
    )

  const proposal = matches(flow.proposal) ? flow.proposal : undefined
  const [loading, setLoading] = useState(!proposal)
  // Quand la carte sort du champ (on lit les aides plus bas), la consigne se colle en haut.
  const [consigneRef, consignePassed] = useScrolledPast<HTMLHeadingElement>()
  const [error, setError] = useState<string>()
  const requested = useRef(false)

  const [quietNote, setQuietNote] = useState<string>()
  // Piano : la mélodie jouée jusqu'au bout sur le clavier, puis l'enregistrement.
  const [played, setPlayed] = useState<string>()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const reduced = useReducedMotion()
  const load = useCallback(
    async (replacing?: string, quiet = flow.quiet) => {
      if (!passionId || !duration) return
      setLoading(true)
      setError(undefined)
      setQuietNote(undefined)
      try {
        // Le dos de la carte reste visible un instant : on voit la carte se tirer.
        const shuffle = new Promise((resolve) => window.setTimeout(resolve, reduced ? 0 : 550))
        const response = await api.propose({
          passion: passionId,
          mood,
          duration,
          ...(fixedStep ? { step: fixedStep } : {}),
          ...(replacing ? { replacing } : {}),
          ...(quiet && !fixedStep ? { quiet: true } : {}),
        })
        await shuffle
        dispatch({ type: 'flow', flow: { proposal: response.proposal, quiet, clockOffset: Date.parse(response.serverTime) - Date.now() } })
        dispatch({ type: 'openProposal', proposal: response.proposal })
      } catch (caught) {
        haptics.error()
        // Rien de silencieux pour ce temps : on le dit, et on garde l'activité affichée.
        if (caught instanceof ApiError && caught.code === 'no_quiet') setQuietNote(caught.message)
        else setError(caught instanceof ApiError ? caught.message : 'Oups, impossible de trouver une idée. Réessaie\u00A0?')
      } finally {
        setLoading(false)
      }
    },
    [passionId, mood, lesson, duration, fixedStep, flow.quiet, reduced, dispatch],
  )

  useEffect(() => {
    if (!proposal && !requested.current) {
      requested.current = true
      void load()
    }
  }, [proposal, load])

  if (!passionId || !duration) return null
  const passion = getPassion(passionId)
  const Icon = PASSION_ICONS[passionId]
  const step = getPathStep(fixedStep ?? proposal?.activityId ?? '')
  const challenge = getChallengeActivity(fixedStep ?? proposal?.activityId ?? '')
  // Piano : le tuto ou la leçon se valide au clavier, sans durée à attendre.
  const melody = proposal ? keyboardMelody(proposal.activityId) : undefined
  // Jouée pour cette proposition-ci (« Une autre idée » tire une autre chanson).
  const playedNow = Boolean(proposal && played === proposal.id)

  const finishPlayed = async () => {
    if (!proposal || !melody || !playedNow || saving) return
    setSaving(true)
    setSaveError(undefined)
    try {
      const previousStats = state.me.stats
      const response = await api.complete({ proposalId: proposal.id, played: true, exploredTitle: melody.title, ...(flow.projectId ? { projectId: flow.projectId } : {}) })
      dispatch({ type: 'stats', stats: response.stats })
      dispatch({ type: 'openProposal', proposal: null })
      dispatch({ type: 'done', done: { response, previousStats, photoPending: false, continuation: { quiet: flow.quiet, projectId: flow.projectId } } })
      dispatch({ type: 'newFlow' })
      reset(lesson ? lessonStack(lesson, { name: 'done' }) : [{ name: 'home' }, { name: 'done' }])
    } catch (caught) {
      haptics.error()
      setSaveError(caught instanceof ApiError ? caught.message : 'Oups, l’enregistrement a échoué. Réessaie\u00A0?')
      setSaving(false)
    }
  }

  return (
    <Screen className="flow-activity">
      <FloatingConsigne proposal={proposal} show={!loading && consignePassed} compact={Boolean(proposal && keyboardMelody(proposal.activityId))} />
      {/* La scène de la passion, en grand, avec la passion et le temps choisis. */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={PASSION_COLORS[passionId].badge} tilt="left">
          <Icon aria-hidden="true" />
          {passion.label}
        </Badge>
        {melody ? (
          <Badge variant="warm" tilt="right">
            <Piano aria-hidden="true" />
            Au clavier
          </Badge>
        ) : (
          <Badge variant="warm" tilt="right">
            <Clock3 aria-hidden="true" />
            <span className="font-numbers">{duration} min</span>
          </Badge>
        )}
      </div>
      {step && <StepHeader step={step} />}
      {challenge && <ChallengeHeader challenge={challenge} />}
      {/* L'activité est une carte qu'on retourne ; « Une autre idée » en tire une nouvelle. */}
      <div className="mt-5 flex-1" aria-live="polite" aria-busy={loading} style={{ perspective: 1200 }}>
        <AnimatePresence mode="wait" initial={false}>
          {proposal && !loading ? (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'center' }}
            >
              <section className="flow-idea"><div><small>{step ? 'À toi de jouer' : 'Une idée pour toi'}</small><p>{step ? 'Avance à ton rythme.' : 'Un petit moment pour ta passion.'}</p></div><Mascot pose={melody ? 'piano' : 'idea'} size={90}/></section>
              <Card padding="none" className="gap-0 flow-task">
                {/* Le haut de la carte : la scène de la passion. */}
                <PassionArtwork passion={passionId} className="da-activity-art" />
                <div className="flex flex-col gap-2 p-4">
                  <p className="text-15 text-ink-soft">{proposal.intro}</p>
                  <h1
                    ref={consigneRef}
                    className={cn('font-display font-extrabold tracking-tight text-pretty text-ink', proposal.text.length > 95 || proposal.extra ? 'text-22' : 'text-26')}
                    aria-label={proposal.text}
                  >
                    <RevealWords text={proposal.text} />
                  </h1>
                </div>
              </Card>
              {proposal.extra && <ExtraCard extra={proposal.extra} />}
              {step && (
                <p className="mt-4 inline-flex items-center gap-2 text-14 font-semibold text-ink-soft">
                  <Sparkles size={16} aria-hidden="true" />
                  Tu travailles&nbsp;: {step.focus.charAt(0).toLowerCase() + step.focus.slice(1)}
                </p>
              )}
              {/* Piano : le tuto se joue ici même, partition sous les yeux, note après note. */}
              {melody && (
                <section className="mt-5 flex flex-col gap-2" aria-labelledby="lesson-keyboard">
                  <h2 id="lesson-keyboard" className="inline-flex items-center gap-2 text-13 font-extrabold text-ink-soft">
                    <Piano size={16} strokeWidth={2.4} aria-hidden="true" />
                    À toi de jouer, au clavier
                  </h2>
                  <Card tone="muted" className="gap-3">
                    <PianoKeyboard key={proposal.id} melody={melody} onComplete={() => setPlayed(proposal.id)} />
                  </Card>
                </section>
              )}
              {/* Un coup de pouce : idées, pistes, défi, et pour Dessin « Sans papier », pour Musique et Cinéma « Sans son ». */}
              <ActivityHelp
                proposal={proposal}
                onPad={
                  passionId === 'dessin'
                    ? () => {
                        dispatch({ type: 'flow', flow: { pad: true } })
                        push({ name: 'proof' })
                      }
                    : undefined
                }
                quiet={
                  !fixedStep && (passionId === 'musique' || passionId === 'cinema')
                    ? {
                        on: Boolean(flow.quiet),
                        busy: loading,
                        note: quietNote,
                        toggle: () => (flow.quiet ? dispatch({ type: 'flow', flow: { quiet: false } }) : void load(proposal.id, true)),
                      }
                    : undefined
                }
              />
            </motion.div>
          ) : error ? (
            <Alert key="error" variant="warning" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Info aria-hidden="true" />
              <AlertDescription>
                <p className="text-14">{error}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => void load()}>
                  <RotateCcw aria-hidden="true" />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <CardBack key="loading" passion={passionId} />
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-2 bg-gradient-to-t from-canvas from-60% to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        {proposal && melody ? (
          <PlayedValidate lesson={Boolean(lesson)} played={playedNow} saving={saving} error={saveError} disabled={loading} onValidate={() => void finishPlayed()} />
        ) : proposal ? (
          <ValidateButton
            key={proposal.id}
            proposal={proposal}
            timeGuard={passion.timeGuard}
            clockOffset={flow.clockOffset}
            disabled={loading}
            onValidate={() => {
              dispatch({ type: 'flow', flow: { pad: false } })
              push({ name: 'proof' })
            }}
          />
        ) : (
          <Skeleton className="h-14 w-full rounded-pill" />
        )}
        {!fixedStep && (
          <Button variant="secondary" size="md" className="w-full" disabled={loading || !proposal} onClick={() => proposal && void load(proposal.id)}>
            <Shuffle aria-hidden="true" />
            Une autre idée
          </Button>
        )}
      </div>
    </Screen>
  )
}

/** Le dos de la carte, pendant qu'on en tire une : la couleur de la passion, des motifs, un point d'interrogation. */
function CardBack({ passion }: { passion: PassionId }) {
  return <div className="flow-loading">
    <PassionArtwork passion={passion} className="da-activity-art"/>
    <FlowStatus title="Une idée arrive" description="On prépare ton activité." pose="think"/>
    <Skeleton className="h-5 w-3/4"/><Skeleton className="mt-3 h-4 w-full"/><Skeleton className="mt-2 h-4 w-4/5"/>
  </div>
}

/** Étape de parcours : le parcours, la marche (difficulté) et sa place dans l'ascension. */
function StepHeader({ step }: { step: PathStep }) {
  const path = getPath(step.pathId)
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-13 font-bold text-ink">
      <Mountain size={16} strokeWidth={2.4} aria-hidden="true" />
      {path?.title} · étape {step.index}/{STEPS_PER_PATH}
      <span className={cn('rounded-pill border-2 border-outline px-2 text-12 font-extrabold', step.index === STEPS_PER_PATH ? 'bg-accent text-on-color' : 'bg-surface-200')}>{step.difficulty}</span>
      <DifficultyMeter level={step.index} tone={PASSION_COLORS[step.passion].bg} />
    </p>
  )
}

/** Le mot du jour : le thème du mois. */
function ChallengeHeader({ challenge }: { challenge: ChallengeActivity }) {
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-13 font-bold text-ink">
      <CalendarHeart size={16} strokeWidth={2.4} aria-hidden="true" />
      Le mot du jour · {challenge.theme}
    </p>
  )
}

/** Le texte apparaît mot après mot, comme s'il s'écrivait. */
function RevealWords({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <span aria-hidden="true">
      {words.map((word, index) => (
        <span key={index}>
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, y: 12, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.3 + index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </span>
  )
}

/** Ce que l'appli a tiré au hasard pour l'activité (mots, film, traits…). */
function ExtraCard({ extra }: { extra: ActivityExtra }) {
  const asChips = extra.kind === 'trois-mots' || extra.kind === 'un-mot'
  return (
    <Card tone="lilac" className="mt-5 gap-3" initial={{ opacity: 0, scale: 0.97, rotate: 0 }} animate={{ opacity: 1, scale: 1, rotate: 1 }} transition={{ delay: 0.25, duration: 0.35 }}>
      <Sparkle size={40} color="var(--warm)" className="motion-loop anim-spin-slow absolute -top-3 -right-3" style={{ '--spin-duration': '14s' } as React.CSSProperties} />
      <CardEyebrow>
        <Sparkles aria-hidden="true" className="motion-loop anim-twinkle" />
        L’appli a tiré pour toi · {extra.label}
      </CardEyebrow>
      {asChips ? (
        <ul className="flex flex-wrap gap-2">
          {extra.items.map((item, index) => (
            <motion.li key={item} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + index * 0.12 }}>
              <Badge variant="secondary" size="lg">
                {item}
              </Badge>
            </motion.li>
          ))}
        </ul>
      ) : (
        <ul className="flex flex-col gap-1">
          {extra.items.map((item) => (
            <li key={item} className="font-display text-17 font-extrabold">
              {item}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/**
 * Piano : « Valider » attend la mélodie, pas une durée. Dès la dernière note,
 * il s'active (avec une vibration), et l'activité s'enregistre d'un toucher,
 * sans écran de preuve (le titre du morceau rejoint la galerie).
 */
function PlayedValidate({
  lesson,
  played,
  saving,
  error,
  disabled,
  onValidate,
}: {
  lesson: boolean
  played: boolean
  saving: boolean
  error?: string
  disabled: boolean
  onValidate: () => void
}) {
  const wasPlayed = useRef(played)
  useEffect(() => {
    if (!wasPlayed.current && played) haptics.success()
    wasPlayed.current = played
  }, [played])
  return (
    <div className="flex flex-col gap-2">
      {saving && <FlowStatus title="Ton morceau rejoint ta galerie" description="On enregistre ce que tu viens de jouer." pose="wait"/>}
      <Button variant="good" className="w-full" disabled={!played || saving || disabled} onClick={onValidate} aria-describedby="lesson-hint">
        {saving ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : played ? <Check aria-hidden="true" /> : <Piano aria-hidden="true" />}
        {saving ? 'Enregistrement…' : played ? (lesson ? 'Valider la leçon' : 'J’ai terminé') : 'Joue le morceau pour valider'}
      </Button>
      <p id="lesson-hint" role={error ? 'alert' : undefined} className={cn('text-center text-12', error ? 'font-bold text-ink' : 'text-ink-soft')}>
        {error ?? (played ? (lesson ? 'Bravo\u00A0! Valide, et l’étape suivante t’attend.' : 'Bravo\u00A0! Il rejoint ton répertoire.') : 'Ça se valide au clavier, dès la dernière note.')}
      </p>
    </div>
  )
}

/**
 * « Valider ». Pour Musique et Cinéma, le bouton se remplit doucement
 * pendant la durée de l'activité, puis s'active.
 */
function ValidateButton({
  proposal,
  timeGuard,
  clockOffset,
  disabled,
  onValidate,
}: {
  proposal: ProposalDTO
  timeGuard: boolean
  clockOffset: number
  disabled: boolean
  onValidate: () => void
}) {
  const { unlocked, progress } = useUnlock(proposal.createdAt, proposal.unlockAt, clockOffset)
  const locked = timeGuard && !unlocked
  const wasLocked = useRef(locked)

  useEffect(() => {
    if (wasLocked.current && !locked) haptics.success()
    wasLocked.current = locked
  }, [locked])

  if (!timeGuard) {
    return (
      <Button variant="good" className="w-full" onClick={onValidate} disabled={disabled}>
        <Check aria-hidden="true" />
        J’ai terminé
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="good"
        disabled={locked || disabled}
        onClick={onValidate}
        className="w-full duration-500"
        aria-describedby="validate-hint"
      >
        {locked && (
          <span
            aria-hidden="true"
            className="motion-loop anim-stripes absolute inset-y-0 left-0 bg-good-soft transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        )}
        {locked ? <Hourglass className="relative" aria-hidden="true" /> : <Check aria-hidden="true" />}
        <span className="relative">J’ai terminé</span>
      </Button>
      <p id="validate-hint" className="text-center text-12 text-ink-soft">
        {locked
          ? `Prends ton temps\u00A0: tu pourras valider à la fin des ${proposal.duration} minutes.`
          : 'C’est bon, tu peux valider quand tu veux.'}
      </p>
    </div>
  )
}
