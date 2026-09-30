import { ArrowRight, Check, Info, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { MAX_PASSIONS, PASSIONS, type PassionId } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup } from '@/components/ui/toggle-group'
import { api, ApiError } from '../api/client.ts'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Illustration } from '../components/Illustration.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { fadeUp } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'

/** Les quatre passions, en bulles qui flottent autour de l'illustration. */
const ORBIT = [
  { id: 'dessin', className: '-top-3 -left-2', rotate: -10, delay: '0s' },
  { id: 'musique', className: '-top-4 right-2', rotate: 8, delay: '-1.4s' },
  { id: 'ecriture', className: 'bottom-2 -left-3', rotate: 6, delay: '-2.6s' },
  { id: 'cinema', className: '-bottom-4 right-6', rotate: -6, delay: '-0.8s' },
] as const

/** Onboarding, étape 1 : une bienvenue courte. */
export function WelcomeScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const name = state.me.user.firstName
  return (
    <Screen>
      <StepProgress current={1} total={2} label="Bienvenue" />
      <motion.div
        className="relative mx-auto mt-8 w-full max-w-sm"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
      >
        <div className="motion-loop anim-float" style={{ '--float-duration': '6s' } as React.CSSProperties}>
          <div className="-rotate-2 rounded-lg border-[2.5px] border-outline bg-surface-200 p-4 shadow-card">
            <Illustration name="welcome" className="w-full" />
          </div>
        </div>
        {ORBIT.map((bubble, index) => {
          const Icon = PASSION_ICONS[bubble.id]
          return (
            <motion.span
              key={bubble.id}
              aria-hidden="true"
              className={`absolute ${bubble.className}`}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: 1, scale: 1, rotate: bubble.rotate }}
              transition={{ delay: 0.5 + index * 0.12, type: 'spring', stiffness: 300, damping: 14 }}
            >
              <span
                className={`motion-loop anim-float flex h-12 w-12 items-center justify-center rounded-pill border-[2.5px] border-outline ${PASSION_COLORS[bubble.id].bg}`}
                style={{ '--float-duration': `${4 + index}s`, '--float-delay': bubble.delay } as React.CSSProperties}
              >
                <Icon size={22} strokeWidth={2.3} className="text-on-color" />
              </span>
            </motion.span>
          )
        })}
        <Sparkle size={22} className="motion-loop anim-twinkle absolute top-1/2 -right-3" style={{ '--twinkle-delay': '-0.4s' } as React.CSSProperties} />
        <Sparkle size={16} color="var(--accent)" className="motion-loop anim-twinkle absolute -top-4 left-1/2" style={{ '--twinkle-delay': '-1.3s' } as React.CSSProperties} />
      </motion.div>

      <div className="mt-8 flex flex-col items-start gap-4">
        <motion.div {...fadeUp(0.15)}>
          <Badge variant="sky" tilt="left">
            <Sparkles aria-hidden="true" />
            {name ? `Bienvenue, ${name}` : 'Bienvenue'}
          </Badge>
        </motion.div>
        <motion.h1 className="font-display text-40 font-extrabold tracking-tight text-balance text-ink" {...fadeUp(0.25)}>
          Et si ton envie de scroller devenait{' '}
          <motion.span
            className="inline-block rounded-sm border-[2.5px] border-outline bg-warm px-2 whitespace-nowrap text-on-color"
            initial={{ rotate: 0, scale: 0.9 }}
            animate={{ rotate: -2, scale: 1 }}
            transition={{ delay: 0.8, type: 'spring', stiffness: 300, damping: 12 }}
          >
            autre chose
          </motion.span>
          &nbsp;?
        </motion.h1>
        <motion.p className="text-16 text-ink-soft" {...fadeUp(0.4)}>
          Quand ton pouce te démange, appuie sur un bouton&nbsp;: on te propose une petite activité créative, liée à ce que tu aimes. Tout ce que tu fais
          rejoint ta galerie.
        </motion.p>
      </div>

      <motion.div className="mt-auto pt-8" {...fadeUp(0.55)}>
        <Button className="w-full" onClick={() => push({ name: 'passions', mode: 'onboarding' })}>
          C’est parti
          <ArrowRight aria-hidden="true" />
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
  const limitNote = useRef<HTMLDivElement>(null)

  // Le message de limite apparaît sous les cartes : on le fait remonter à l'écran.
  useEffect(() => {
    if (limitHit) limitNote.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [limitHit])

  const change = (next: PassionId[]) => {
    setError(undefined)
    if (next.length > MAX_PASSIONS) {
      haptics.warning()
      setLimitHit(true)
      return
    }
    haptics.selection()
    if (next.length < selected.length) setLimitHit(false)
    setSelected(next)
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
      <ScreenTitle
        eyebrow={mode === 'onboarding' ? <StepProgress current={2} total={2} label="Tes passions" /> : undefined}
        aside={
          mode === 'onboarding' ? (
            <div className="motion-loop anim-float shrink-0" style={{ '--float-duration': '5s' } as React.CSSProperties}>
              <div className="rotate-3 rounded-md border-[2.5px] border-outline bg-surface-200 p-2 shadow-chip">
                <Illustration name="choose-passions" className="h-16" />
              </div>
            </div>
          ) : undefined
        }
        subtitle={`Choisis entre 1 et ${MAX_PASSIONS} passions. Tu pourras changer d’avis quand tu veux.`}
      >
        Qu’est-ce qui te fait vibrer&nbsp;?
      </ScreenTitle>

      <ToggleGroup
        type="multiple"
        variant="card"
        value={selected}
        onValueChange={(value) => change(value as PassionId[])}
        className="grid grid-cols-2 gap-4"
        aria-label="Tes passions"
      >
        {PASSIONS.map((passion, index) => (
          <PassionCard key={passion.id} passion={passion} index={index} selected={selected.includes(passion.id)} />
        ))}
      </ToggleGroup>

      <p className="mt-6 flex justify-center" aria-live="polite">
        <Badge variant={count > 0 ? 'good' : 'secondary'} size="sm" className="px-3">
          {count}/{MAX_PASSIONS} {count > 1 ? 'choisies' : 'choisie'}
        </Badge>
      </p>

      <AnimatePresence>
        {limitHit && (
          <Alert
            ref={limitNote}
            variant="warning"
            role="status"
            className="mt-4"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Info aria-hidden="true" />
            <AlertDescription>{MAX_PASSIONS} passions au maximum pour commencer&nbsp;: retire-en une pour en choisir une autre.</AlertDescription>
          </Alert>
        )}
      </AnimatePresence>

      <PrimaryAction text={label} icon={count > 0 ? <Check aria-hidden="true" /> : undefined} onClick={save} enabled={count > 0} loading={saving}>
        {error && (
          <Alert variant="warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Info aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </PrimaryAction>
    </Screen>
  )
}
