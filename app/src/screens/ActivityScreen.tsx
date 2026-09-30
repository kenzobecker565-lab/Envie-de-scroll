import { Shuffle, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPassion, type ActivityExtra, type ProposalDTO } from '@scroll-up/shared'
import { api, ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { Screen } from '../components/Screen.tsx'
import { Skeleton, SkeletonText } from '../components/Skeleton.tsx'
import { cn } from '../lib/cn.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 items-center gap-2 rounded-pill bg-surface-200 px-4 text-12 font-bold text-ink-soft">
          <Icon size={16} className="text-accent" aria-hidden="true" />
          {passion.label}
        </span>
        <span className="inline-flex h-8 items-center rounded-pill bg-surface-200 px-4 font-mono text-12 font-bold text-ink-soft">{duration} min</span>
      </div>

      <div className="mt-8 flex-1" aria-live="polite" aria-busy={loading}>
        <AnimatePresence mode="wait" initial={false}>
          {proposal && !loading ? (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-15 text-ink-soft">{proposal.intro}</p>
              <h1 className={cn('mt-4 font-display font-semibold text-pretty text-ink', proposal.text.length > 95 ? 'text-26' : 'text-28')}>
                {proposal.text}
              </h1>
              {proposal.extra && <ExtraCard extra={proposal.extra} />}
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-md bg-warm-soft p-4">
              <p className="text-14 text-warm-ink">{error}</p>
              <Button variant="secondary" className="mt-4" onClick={() => void load()}>
                Réessayer
              </Button>
            </motion.div>
          ) : (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Skeleton className="h-5 w-4/5" />
              <SkeletonText lines={3} className="mt-6 [&>div]:h-8" />
              <span className="sr-only">On cherche une idée pour toi…</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 bg-gradient-to-t from-canvas from-75% to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
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
        <Button
          variant="ghost"
          className="mt-2 w-full"
          icon={<Shuffle size={18} aria-hidden="true" />}
          disabled={loading || !proposal}
          onClick={() => proposal && void load(proposal.id)}
        >
          Une autre idée
        </Button>
      </div>
    </Screen>
  )
}

/** Ce que l'appli a tiré au hasard pour l'activité (mots, film, traits…). */
function ExtraCard({ extra }: { extra: ActivityExtra }) {
  const asChips = extra.kind === 'trois-mots' || extra.kind === 'un-mot'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.35 }}
      className="mt-6 rounded-md bg-warm-soft p-4"
    >
      <p className="inline-flex items-center gap-2 text-11 font-bold tracking-wide text-warm-ink uppercase">
        <Sparkles size={14} aria-hidden="true" />
        L’appli a tiré pour toi · {extra.label}
      </p>
      {asChips ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {extra.items.map((item, index) => (
            <motion.li
              key={item}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.12 }}
              className="rounded-pill bg-surface-200 px-4 py-1 text-15 font-bold text-ink"
            >
              {item}
            </motion.li>
          ))}
        </ul>
      ) : (
        <ul className="mt-2 space-y-1">
          {extra.items.map((item) => (
            <li key={item} className="text-15 font-bold text-ink">
              {item}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
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
      <Button className="w-full" onClick={onValidate} disabled={disabled}>
        Valider
      </Button>
    )
  }

  return (
    <div>
      <motion.button
        type="button"
        disabled={locked || disabled}
        onClick={() => {
          haptics.impact('medium')
          onValidate()
        }}
        whileTap={locked ? undefined : { scale: 0.96 }}
        className={cn(
          'relative flex h-14 w-full items-center justify-center overflow-hidden rounded-pill text-15 font-bold transition-colors duration-500',
          locked ? 'bg-surface-300 text-ink-faint' : 'bg-accent text-accent-ink shadow-pop',
        )}
        aria-describedby="validate-hint"
      >
        {locked && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 bg-accent-soft transition-[width] duration-1000 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        )}
        <span className="relative">Valider</span>
      </motion.button>
      <p id="validate-hint" className="mt-2 text-center text-12 text-ink-soft">
        {locked
          ? `Prends ton temps\u00A0: tu pourras valider à la fin des ${proposal.duration} minutes.`
          : 'C’est bon, tu peux valider quand tu veux.'}
      </p>
    </div>
  )
}
