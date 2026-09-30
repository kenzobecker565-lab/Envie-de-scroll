import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MAX_PASSIONS, PASSIONS, type PassionId } from '@scroll-up/shared'
import { api, ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { Underline } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Illustration } from '../components/Illustration.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'

/** Les quatre passions, en bulles qui flottent autour de l'illustration. */
const ORBIT = [
  { id: 'dessin', className: 'top-2 left-0', tone: 'bg-accent-soft', delay: '0s' },
  { id: 'musique', className: 'top-0 right-2', tone: 'bg-warm-soft', delay: '-1.4s' },
  { id: 'ecriture', className: 'bottom-4 left-4', tone: 'bg-warm-soft', delay: '-2.6s' },
  { id: 'cinema', className: '-bottom-2 right-8', tone: 'bg-accent-soft', delay: '-0.8s' },
] as const

const enter = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
})

/** Onboarding, étape 1 : une bienvenue courte. */
export function WelcomeScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const name = state.me.user.firstName
  return (
    <Screen className="justify-between">
      <motion.div
        className="relative mx-auto mt-4 w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        <div className="motion-loop anim-float" style={{ '--float-duration': '6s' } as React.CSSProperties}>
          <Illustration name="welcome" className="aspect-[782/458] w-full" />
        </div>
        {ORBIT.map((bubble, index) => {
          const Icon = PASSION_ICONS[bubble.id]
          return (
            <motion.span
              key={bubble.id}
              aria-hidden="true"
              className={`absolute ${bubble.className}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.12, type: 'spring', stiffness: 300, damping: 16 }}
            >
              <span
                className={`motion-loop anim-float flex h-11 w-11 items-center justify-center rounded-pill shadow-card ${bubble.tone}`}
                style={{ '--float-duration': `${4 + index}s`, '--float-delay': bubble.delay } as React.CSSProperties}
              >
                <Icon size={20} strokeWidth={1.9} className="text-accent" />
              </span>
            </motion.span>
          )
        })}
        <Sparkle size={14} className="motion-loop anim-twinkle absolute top-1/2 -left-1" style={{ '--twinkle-delay': '-0.4s' } as React.CSSProperties} />
        <Sparkle size={10} color="var(--accent)" className="motion-loop anim-twinkle absolute top-6 left-1/2" style={{ '--twinkle-delay': '-1.3s' } as React.CSSProperties} />
      </motion.div>
      <div className="mt-8">
        <motion.p className="text-13 font-bold text-accent" {...enter(0.15)}>
          {name ? `Bienvenue, ${name}` : 'Bienvenue'}
        </motion.p>
        <motion.h1 className="mt-2 font-display text-34 font-semibold text-balance text-ink" {...enter(0.25)}>
          Et si ton envie de scroller devenait{' '}
          <span className="relative inline-block whitespace-nowrap">
            autre chose
            <Underline className="-bottom-2 left-0 h-3 w-full" delay={0.9} />
          </span>
          &nbsp;?
        </motion.h1>
        <motion.p className="mt-4 text-15 text-ink-soft" {...enter(0.4)}>
          Quand ton pouce te démange, appuie sur un bouton&nbsp;: on te propose une petite activité créative, liée à ce que tu aimes. Tout ce que tu fais
          rejoint ta galerie.
        </motion.p>
      </div>
      <motion.div {...enter(0.55)}>
        <Button className="anim-shine motion-loop mt-8 w-full" onClick={() => push({ name: 'passions', mode: 'onboarding' })}>
          C’est parti
        </Button>
      </motion.div>
    </Screen>
  )
}

/** Choix de 1 à 3 passions (onboarding, ou modification depuis la galerie). */
export function PassionsScreen({ mode }: { mode: 'onboarding' | 'edit' }) {
  const { state, dispatch } = useAppState()
  const { reset, back } = useNavigation()
  const [selected, setSelected] = useState<PassionId[]>(state.me.user.passions)
  const [limitHit, setLimitHit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  const toggle = (id: PassionId) => {
    setError(undefined)
    if (selected.includes(id)) {
      haptics.selection()
      setLimitHit(false)
      setSelected(selected.filter((passion) => passion !== id))
      return
    }
    if (selected.length >= MAX_PASSIONS) {
      haptics.warning()
      setLimitHit(true)
      return
    }
    haptics.selection()
    setSelected([...selected, id])
  }

  const save = async () => {
    if (selected.length === 0 || saving) return
    setSaving(true)
    try {
      const { user } = await api.updatePassions(selected)
      dispatch({ type: 'user', user })
      haptics.success()
      if (mode === 'onboarding') {
        requestWriteAccessIfNeeded()
        reset([{ name: 'home' }])
      } else {
        back()
      }
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
      setSaving(false)
    }
  }

  const count = selected.length
  const label = count === 0 ? 'Choisis au moins une passion' : mode === 'onboarding' ? 'C’est parti' : 'Enregistrer'

  return (
    <Screen>
      <ScreenTitle subtitle={`Choisis entre 1 et ${MAX_PASSIONS} passions. Tu pourras changer d’avis quand tu veux.`}>
        Qu’est-ce qui te fait vibrer&nbsp;?
      </ScreenTitle>

      <div className="grid grid-cols-2 gap-4">
        {PASSIONS.map((passion, index) => (
          <motion.div
            key={passion.id}
            initial={{ opacity: 0, y: 24, rotate: index % 2 ? 3 : -3 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.08 * index, type: 'spring', stiffness: 220, damping: 20 }}
          >
            <PassionCard passion={passion} selected={selected.includes(passion.id)} onSelect={() => toggle(passion.id)} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {limitHit && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 rounded-sm bg-warm-soft px-4 py-2 text-13 text-warm-ink"
            role="status"
          >
            3 passions au maximum pour commencer&nbsp;: retire-en une pour en choisir une autre.
          </motion.p>
        )}
      </AnimatePresence>

      <PrimaryAction text={label} onClick={save} enabled={count > 0} loading={saving}>
        {error && (
          <p className="mt-2 text-center text-13 text-warm-ink" role="alert">
            {error}
          </p>
        )}
      </PrimaryAction>
    </Screen>
  )
}
