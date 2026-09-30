import { motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DURATIONS, ENERGY_FAMILIES, getPassion, MOODS, type Duration, type MoodId, type PassionId } from '@scroll-up/shared'
import { PassionCard } from '../components/PassionCard.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { cn } from '../lib/cn.ts'
import { MOOD_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Laisse voir la sélection un court instant avant de passer à l'écran suivant. */
function useAdvance() {
  const busy = useRef(false)
  return (action: () => void) => {
    if (busy.current) return
    busy.current = true
    window.setTimeout(action, 240)
  }
}

const enter = (index: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.04 * index, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
})

/* ---------------------------------- Mood ---------------------------------- */

export function MoodScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const advance = useAdvance()
  const [selected, setSelected] = useState<MoodId | undefined>(state.flow.mood)

  const choose = (mood: MoodId) => {
    haptics.selection()
    setSelected(mood)
    dispatch({ type: 'flow', flow: { mood } })
    advance(() => push({ name: 'time' }))
  }

  let index = 0
  return (
    <Screen>
      <ScreenTitle subtitle="Pas de mauvaise réponse. Un tap, et on continue.">Comment tu te sens, là&nbsp;?</ScreenTitle>
      <div className="space-y-6">
        {ENERGY_FAMILIES.map((family) => (
          <section key={family.energy} aria-label={family.label}>
            <h2 className="mb-2 text-11 font-bold tracking-wide text-ink-soft uppercase">{family.label}</h2>
            <div className="flex flex-wrap gap-2">
              {MOODS.filter((mood) => mood.energy === family.energy).map((mood) => {
                const Icon = MOOD_ICONS[mood.id]
                const active = selected === mood.id
                return (
                  <motion.button
                    key={mood.id}
                    type="button"
                    {...enter(index++)}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => choose(mood.id)}
                    aria-pressed={active}
                    className={cn(
                      'inline-flex min-h-12 items-center gap-2 rounded-pill border px-4 py-2 text-left text-14 font-bold transition-colors duration-200',
                      active ? 'border-accent bg-accent-soft text-ink' : 'border-line bg-surface-200 text-ink',
                    )}
                  >
                    <Icon size={18} className={cn('shrink-0 transition-colors duration-200', active ? 'text-accent' : 'text-ink-soft')} aria-hidden="true" />
                    {mood.label}
                  </motion.button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </Screen>
  )
}

/* ---------------------------------- Temps --------------------------------- */

const TIME_COPY: Record<Duration, { title: string; hint: string }> = {
  5: { title: 'Une parenthèse', hint: 'Le temps d’un café, ou presque.' },
  15: { title: 'Un vrai petit moment', hint: 'De quoi entrer dans le truc.' },
  30: { title: 'Une pause qui compte', hint: 'Tu t’offres une vraie coupure.' },
}

export function TimeScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const advance = useAdvance()
  const [selected, setSelected] = useState<Duration | undefined>(state.flow.duration)
  const passions = state.me.user.passions

  const choose = (duration: Duration) => {
    haptics.selection()
    setSelected(duration)
    const onlyPassion = passions.length === 1 ? passions[0] : undefined
    dispatch({ type: 'flow', flow: { duration, ...(onlyPassion ? { passion: onlyPassion } : {}) } })
    advance(() => push({ name: onlyPassion ? 'activity' : 'passion' }))
  }

  return (
    <Screen>
      <ScreenTitle subtitle="On adapte l’activité à ton créneau.">Tu as combien de temps&nbsp;?</ScreenTitle>
      <div className="flex flex-col gap-4">
        {DURATIONS.map((duration, index) => {
          const active = selected === duration
          return (
            <motion.button
              key={duration}
              type="button"
              {...enter(index)}
              whileTap={{ scale: 0.97 }}
              onClick={() => choose(duration)}
              aria-pressed={active}
              className={cn(
                'flex min-h-28 items-center gap-4 rounded-md border-2 bg-surface-200 p-4 text-left shadow-card transition-colors duration-200',
                active ? 'border-accent' : 'border-transparent',
              )}
            >
              <span
                className={cn(
                  'flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-md transition-colors duration-200',
                  active ? 'bg-accent text-accent-ink' : 'bg-accent-soft text-accent',
                )}
              >
                <span className="font-mono text-21 font-bold">{duration}</span>
                <span className="font-mono text-mono-xs font-bold">min</span>
              </span>
              <span>
                <span className="block text-15 font-bold text-ink">{TIME_COPY[duration].title}</span>
                <span className="mt-1 block text-13 text-ink-soft">{TIME_COPY[duration].hint}</span>
              </span>
            </motion.button>
          )
        })}
      </div>
    </Screen>
  )
}

/* ------------------------ Passion (si plusieurs) --------------------------- */

export function PassionPickScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const advance = useAdvance()
  const [selected, setSelected] = useState<PassionId | undefined>()

  const choose = (passion: PassionId) => {
    haptics.selection()
    setSelected(passion)
    dispatch({ type: 'flow', flow: { passion } })
    advance(() => push({ name: 'activity' }))
  }

  return (
    <Screen>
      <ScreenTitle subtitle={'Parmi tes passions, laquelle te tente maintenant\u00A0?'}>Et tu as envie de…&nbsp;?</ScreenTitle>
      <div className="grid grid-cols-2 gap-4">
        {state.me.user.passions.map((id, index) => (
          <motion.div key={id} {...enter(index)}>
            <PassionCard passion={getPassion(id)} selected={selected === id} onSelect={() => choose(id)} role="button" />
          </motion.div>
        ))}
      </div>
    </Screen>
  )
}
