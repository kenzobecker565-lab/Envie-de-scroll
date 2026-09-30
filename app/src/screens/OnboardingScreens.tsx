import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { MAX_PASSIONS, PASSIONS, type PassionId } from '@scroll-up/shared'
import { api, ApiError } from '../api/client.ts'
import { Button } from '../components/Button.tsx'
import { Illustration } from '../components/Illustration.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'

/** Onboarding, étape 1 : une bienvenue courte. */
export function WelcomeScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const name = state.me.user.firstName
  return (
    <Screen className="justify-between">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <Illustration name="welcome" className="mx-auto mt-4 aspect-[782/458] w-full max-w-sm" />
      </motion.div>
      <div className="mt-8">
        <p className="text-13 font-bold text-accent">{name ? `Bienvenue, ${name}` : 'Bienvenue'}</p>
        <h1 className="mt-2 font-display text-34 font-semibold text-balance text-ink">Et si ton envie de scroller devenait autre chose&nbsp;?</h1>
        <p className="mt-4 text-15 text-ink-soft">
          Quand ton pouce te démange, appuie sur un bouton&nbsp;: on te propose une petite activité créative, liée à ce que tu aimes. Tout ce que tu fais
          rejoint ta galerie.
        </p>
      </div>
      <Button className="mt-8 w-full" onClick={() => push({ name: 'passions', mode: 'onboarding' })}>
        C’est parti
      </Button>
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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
