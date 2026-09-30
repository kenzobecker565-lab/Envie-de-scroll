import { Check, Clock3, Hourglass, Info, RotateCcw, Shuffle, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, type ActivityExtra, type ProposalDTO } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Skeleton, SkeletonText } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { api, ApiError } from '../api/client.ts'
import { PassionScene } from '../components/decor/PassionScene.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Screen } from '../components/Screen.tsx'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { useUnlock } from '../lib/useUnlock.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * L'activité proposée, en grand. « Une autre idée » (discret) retire au sort ;
 * « Valider » mène à la preuve (photo, texte) ou au titre exploré.
 * Musique et Cinéma : « Valider » reste grisé jusqu'à la fin de la durée
 * choisie, avec un indicateur doux (pas de compte à rebours).
 */
export function ActivityScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const { flow } = state
  const { passion: passionId, mood, duration } = flow

  const matches = (proposal: ProposalDTO | undefined): proposal is ProposalDTO =>
    Boolean(proposal && proposal.passion === passionId && proposal.mood === mood && proposal.duration === duration)

  const proposal = matches(flow.proposal) ? flow.proposal : undefined
  const [loading, setLoading] = useState(!proposal)
  const [error, setError] = useState<string>()
  const requested = useRef(false)

  const load = useCallback(
    async (replacing?: string) => {
      if (!passionId || !mood || !duration) return
      setLoading(true)
      setError(undefined)
      try {
        const response = await api.propose({ passion: passionId, mood, duration, ...(replacing ? { replacing } : {}) })
        dispatch({ type: 'flow', flow: { proposal: response.proposal, clockOffset: Date.parse(response.serverTime) - Date.now() } })
        dispatch({ type: 'openProposal', proposal: response.proposal })
      } catch (caught) {
        haptics.error()
        setError(caught instanceof ApiError ? caught.message : 'Oups, impossible de trouver une idée. Réessaie\u00A0?')
      } finally {
        setLoading(false)
      }
    },
    [passionId, mood, duration, dispatch],
  )

  useEffect(() => {
    if (!proposal && !requested.current) {
      requested.current = true
      void load()
    }
  }, [proposal, load])

  if (!passionId || !mood || !duration) return null
  const passion = getPassion(passionId)
  const Icon = PASSION_ICONS[passionId]

  return (
    <Screen>
      {/* La scène de la passion, en grand, avec la passion et le temps choisis. */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={PASSION_COLORS[passionId].badge} tilt="left">
          <Icon aria-hidden="true" />
          {passion.label}
        </Badge>
        <Badge variant="warm" tilt="right">
          <Clock3 aria-hidden="true" />
          <span className="font-numbers">{duration} min</span>
        </Badge>
      </div>
      {/* Sur les petits écrans (ou avec un tirage à afficher), la scène se fait plus discrète. */}
      <Card
        className={cn('mt-5 items-center justify-center py-6 shadow-pop [@media(max-height:780px)]:py-3', proposal?.extra && 'py-3')}
        initial={{ opacity: 0, y: 12, scale: 0.97, rotate: -2 }}
        animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <span aria-hidden="true" className={cn('absolute -right-8 -bottom-10 h-32 w-32 rounded-pill border-[2.5px] border-outline', PASSION_COLORS[passionId].bg)} />
        <PassionScene passion={passionId} className={cn('relative h-28 w-auto [@media(max-height:780px)]:h-20', proposal?.extra && 'h-20')} />
      </Card>

      <div className="mt-5 flex-1" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait" initial={false}>
          {proposal && !loading ? (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-16 text-ink-soft">{proposal.intro}</p>
              <h1
                className={cn('mt-2 font-display font-extrabold tracking-tight text-pretty text-ink', proposal.text.length > 95 || proposal.extra ? 'text-26' : 'text-30')}
                aria-label={proposal.text}
              >
                <RevealWords text={proposal.text} />
              </h1>
              {proposal.extra && <ExtraCard extra={proposal.extra} />}
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
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton className="h-5 w-4/5" />
              <SkeletonText lines={3} className="mt-4 [&>div]:h-8" />
              <span className="sr-only">On cherche une idée pour toi…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-2 bg-gradient-to-t from-canvas from-60% to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
        {proposal ? (
          <ValidateButton
            key={proposal.id}
            proposal={proposal}
            timeGuard={passion.timeGuard}
            clockOffset={flow.clockOffset}
            disabled={loading}
            onValidate={() => push({ name: 'proof' })}
          />
        ) : (
          <Skeleton className="h-14 w-full rounded-pill" />
        )}
        <Button variant="secondary" size="md" className="w-full" disabled={loading || !proposal} onClick={() => proposal && void load(proposal.id)}>
          <Shuffle aria-hidden="true" />
          Une autre idée
        </Button>
      </div>
    </Screen>
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
            transition={{ delay: 0.15 + index * 0.045, type: 'spring', stiffness: 300, damping: 24 }}
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
        Valider
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
        <span className="relative">Valider</span>
      </Button>
      <p id="validate-hint" className="text-center text-12 text-ink-soft">
        {locked
          ? `Prends ton temps\u00A0: tu pourras valider à la fin des ${proposal.duration} minutes.`
          : 'C’est bon, tu peux valider quand tu veux.'}
      </p>
    </div>
  )
}
