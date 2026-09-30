import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { DURATIONS, ENERGY_FAMILIES, getPassion, MOODS, type Duration, type MoodId, type PassionId } from '@scroll-up/shared'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EnergyLine, TimeDial } from '../components/decor/Ornaments.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { MOOD_ICONS } from '../lib/icons.ts'
import { popIn } from '../lib/motion.ts'
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

/** Étapes du parcours : humeur, temps, puis passion si l'on en a plusieurs. */
function useFlowSteps() {
  const { state } = useAppState()
  return state.me.user.passions.length > 1 ? 3 : 2
}

/** Pastille « choisi » qui apparaît sur la carte sélectionnée. */
function SelectedMark({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-accent text-accent-ink"
        >
          <Check size={16} strokeWidth={3} aria-hidden="true" />
        </motion.span>
      )}
    </AnimatePresence>
  )
}

/* ---------------------------------- Mood ---------------------------------- */

export function MoodScreen() {
  const { state, dispatch } = useAppState()
  const { push } = useNavigation()
  const advance = useAdvance()
  const steps = useFlowSteps()
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
      <ScreenTitle eyebrow={<StepProgress current={1} total={steps} label="Ton humeur" />} subtitle="Pas de mauvaise réponse. Un tap, et on continue.">
        Comment tu te sens, là&nbsp;?
      </ScreenTitle>
      <div className="flex flex-col gap-6">
        {ENERGY_FAMILIES.map((family) => (
          <section key={family.energy} aria-labelledby={`family-${family.energy}`} className="flex flex-col gap-2">
            <h2 id={`family-${family.energy}`} className="flex items-center gap-2 text-11 font-bold tracking-wide text-ink-soft uppercase">
              {family.label}
              <EnergyLine energy={family.energy} />
            </h2>
            <ToggleGroup
              type="single"
              variant="chip"
              value={selected ?? ''}
              onValueChange={(value) => choose((value || selected) as MoodId)}
              aria-labelledby={`family-${family.energy}`}
            >
              {MOODS.filter((mood) => mood.energy === family.energy).map((mood) => {
                const Icon = MOOD_ICONS[mood.id]
                return (
                  <ToggleGroupItem key={mood.id} value={mood.id} {...popIn(index++)} whileTap={{ scale: 0.95 }}>
                    <Icon className={selected === mood.id ? 'anim-wiggle' : undefined} aria-hidden="true" />
                    {mood.label}
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
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
  const steps = useFlowSteps()
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
      <ScreenTitle eyebrow={<StepProgress current={2} total={steps} label="Ton temps" />} subtitle="On adapte l’activité à ton créneau.">
        Tu as combien de temps&nbsp;?
      </ScreenTitle>
      <ToggleGroup
        type="single"
        variant="card"
        value={selected ? String(selected) : ''}
        onValueChange={(value) => choose(Number(value || selected) as Duration)}
        className="flex-col flex-nowrap gap-4"
        aria-label="Ton temps disponible"
      >
        {DURATIONS.map((duration, index) => (
          <ToggleGroupItem key={duration} value={String(duration)} className="min-h-28 gap-4" {...popIn(index)} whileTap={{ scale: 0.97 }}>
            <TimeDial minutes={duration} active={selected === duration} delay={index * 0.12} />
            <span className="flex flex-1 flex-col gap-1">
              <span className="text-15 font-bold text-ink">{TIME_COPY[duration].title}</span>
              <span className="text-13 font-normal text-ink-soft">{TIME_COPY[duration].hint}</span>
            </span>
            <SelectedMark visible={selected === duration} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
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
      <ScreenTitle eyebrow={<StepProgress current={3} total={3} label="Ta passion" />} subtitle={'Parmi tes passions, laquelle te tente maintenant ?'}>
        Et tu as envie de…&nbsp;?
      </ScreenTitle>
      <ToggleGroup
        type="single"
        variant="card"
        value={selected ?? ''}
        onValueChange={(value) => choose((value || selected) as PassionId)}
        className="grid grid-cols-2 gap-4"
        aria-label="Ta passion du moment"
      >
        {state.me.user.passions.map((id, index) => (
          <PassionCard key={id} passion={getPassion(id)} index={index} selected={selected === id} />
        ))}
      </ToggleGroup>
    </Screen>
  )
}
