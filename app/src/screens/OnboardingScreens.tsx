import { ArrowRight, BellOff, BellRing, Check, Footprints, Info, Mountain, Sparkles, Sprout, Star, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import {
  formatClock,
  getPassion,
  isScrollMoment,
  isSkillLevel,
  MAX_PASSIONS,
  missingSkills,
  PASSIONS,
  pathsFor,
  SKILL_LEVELS,
  SKILL_TIER,
  SCROLL_MOMENT_INFO,
  SCROLL_MOMENTS,
  type PassionId,
  type ScrollMoment,
  type SkillLevel,
  type UpdateSettingsRequest,
} from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { api, ApiError, track } from '../api/client.ts'
import { Logo } from '../components/Brand.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Illustration } from '../components/Illustration.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { MOMENT_STYLE, PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { fadeUp, popIn } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'

/** Bienvenue, passions, moment de scroll. */
const ONBOARDING_STEPS = 3

/** Les passions, en bulles qui flottent autour de l'illustration. */
const ORBIT = [
  { id: 'dessin', className: '-top-3 -left-2', rotate: -10, delay: '0s' },
  { id: 'musique', className: '-top-4 right-2', rotate: 8, delay: '-1.4s' },
  { id: 'piano', className: 'top-[40%] -right-5', rotate: 10, delay: '-2s' },
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
      <div className="mb-5 flex justify-center">
        <Logo height={34} />
      </div>
      <StepProgress current={1} total={ONBOARDING_STEPS} label="Bienvenue" />
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
          Quand ton pouce te démange, touche « J’ai envie de swipe »&nbsp;: choisis ton temps et une passion, puis découvre une activité créative. Tout ce que tu fais
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

/** Choix des passions, autant qu'on veut (onboarding, ou modification depuis les réglages). */
export function PassionsScreen({ mode }: { mode: 'onboarding' | 'edit' }) {
  const { state, dispatch } = useAppState()
  const { push, back, replace } = useNavigation()
  const [selected, setSelected] = useState<PassionId[]>(state.me.user.passions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Autant de passions qu'on veut (au moins une).
  const change = (next: PassionId[]) => {
    setError(undefined)
    haptics.selection()
    setSelected(next)
  }

  const save = async () => {
    if (selected.length === 0 || saving) return
    setSaving(true)
    try {
      const { user } = await api.updatePassions(selected)
      dispatch({ type: 'user', user })
      haptics.success()
      // Une passion qui demande le niveau (Piano) : la page « Ton niveau » d'abord.
      const missing = missingSkills(user.passions, user.skills)[0]
      if (mode === 'onboarding') {
        push(missing ? { name: 'skill', passion: missing, mode: 'onboarding' } : { name: 'moment' })
      } else if (missing) {
        replace({ name: 'skill', passion: missing, mode: 'edit' })
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
  const label = count === 0 ? 'Choisis au moins une passion' : mode === 'onboarding' ? 'Continuer' : 'Enregistrer'

  return (
    <Screen>
      <ScreenTitle
        eyebrow={mode === 'onboarding' ? <StepProgress current={2} total={ONBOARDING_STEPS} label="Tes passions" /> : undefined}
        aside={
          mode === 'onboarding' ? (
            <div className="motion-loop anim-float shrink-0" style={{ '--float-duration': '5s' } as React.CSSProperties}>
              <div className="rotate-3 rounded-md border-[2.5px] border-outline bg-surface-200 p-2 shadow-chip">
                <Illustration name="choose-passions" className="h-16" />
              </div>
            </div>
          ) : undefined
        }
        subtitle="Choisis-en autant que tu veux. Tu pourras changer d’avis quand tu veux."
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
          {count === MAX_PASSIONS ? 'Toutes choisies' : `${count} ${count > 1 ? 'choisies' : 'choisie'}`}
        </Badge>
      </p>

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

/** Une icône par niveau, du semis à l'étoile. */
const SKILL_ICONS: Record<SkillLevel, LucideIcon> = { debutant: Sprout, bases: Footprints, confirme: Star }

/**
 * « Ton niveau au piano ? » : juste après le choix des passions (pour celles
 * qui le demandent), ou plus tard depuis le détail de la passion. Le niveau
 * cible le contenu : les activités tirées, et le parcours par lequel on
 * commence (affiché sous chaque réponse).
 */
export function SkillScreen({ passion, mode }: { passion: PassionId; mode: 'onboarding' | 'edit' }) {
  const { state, dispatch } = useAppState()
  const { push, back, replace } = useNavigation()
  const info = getPassion(passion)
  const [level, setLevel] = useState<SkillLevel | null>(state.me.user.skills[passion] ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const Icon = PASSION_ICONS[passion]
  if (!info.skill) return null
  const question = info.skill

  const save = async () => {
    if (!level || saving) return
    setSaving(true)
    setError(undefined)
    try {
      const { user } = await api.updateSkill({ passion, level })
      dispatch({ type: 'user', user })
      haptics.success()
      track('skill', { passion, level })
      if (mode === 'edit') return back()
      const next = missingSkills(user.passions, user.skills)[0]
      if (next) replace({ name: 'skill', passion: next, mode: 'onboarding' })
      else push({ name: 'moment' })
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
      setSaving(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle
        eyebrow={mode === 'onboarding' ? <StepProgress current={2} total={ONBOARDING_STEPS} label="Ton niveau" /> : undefined}
        aside={
          <span className="motion-loop anim-float shrink-0" style={{ '--float-duration': '5s' } as React.CSSProperties}>
            <span className={cn('flex h-14 w-14 -rotate-6 items-center justify-center rounded-pill border-[2.5px] border-outline shadow-chip', PASSION_COLORS[passion].bg)}>
              <Icon size={26} strokeWidth={2.3} className="text-on-color" aria-hidden="true" />
            </span>
          </span>
        }
        subtitle="Pour te proposer des exercices à ta mesure, pas à pas. Tu pourras le changer quand tu veux."
      >
        {question.question}
      </ScreenTitle>

      <ToggleGroup
        type="single"
        variant="card"
        value={level ?? ''}
        onValueChange={(value) => {
          if (!isSkillLevel(value)) return
          haptics.selection()
          setLevel(value)
        }}
        className="flex-col flex-nowrap gap-3"
        aria-label={question.question}
      >
        {SKILL_LEVELS.map((id, index) => {
          const option = question.options[id]
          const LevelIcon = SKILL_ICONS[id]
          const firstPath = pathsFor(passion).find((path) => path.tier === SKILL_TIER[id])
          return (
            <ToggleGroupItem key={id} value={id} className={cn('items-start gap-3 p-4 text-ink', PASSION_COLORS[passion].on, 'data-[state=on]:text-on-color')} {...popIn(index)} whileTap={{ scale: 0.98 }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline bg-paper text-on-color">
                <LevelIcon size={20} strokeWidth={2.3} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-20 leading-tight font-extrabold tracking-tight">{option.label}</span>
                <span className="text-13 font-medium opacity-85">{option.hint}</span>
                {firstPath && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-12 font-extrabold">
                    <Mountain size={14} strokeWidth={2.4} aria-hidden="true" />
                    Tu commences par «&nbsp;{firstPath.title}&nbsp;»
                  </span>
                )}
              </span>
              <AnimatePresence>
                {level === id && (
                  <motion.span
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: -8 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline bg-paper text-on-color"
                  >
                    <Check size={16} strokeWidth={3.2} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <PrimaryAction text={level ? (mode === 'edit' ? 'Enregistrer' : 'Continuer') : 'Choisis ton niveau'} icon={level ? <Check aria-hidden="true" /> : undefined} onClick={() => void save()} enabled={Boolean(level)} loading={saving}>
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

/**
 * Onboarding, étape 3 : le moment où l'on scrolle le plus. Le bot relance
 * juste avant (une fois par jour au plus) ; on peut aussi refuser les messages.
 */
export function MomentScreen() {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const [moment, setMoment] = useState<ScrollMoment | null>(state.me.user.scrollMoment)
  const [saving, setSaving] = useState<'moment' | 'none' | null>(null)
  const [error, setError] = useState<string>()

  const save = async (settings: UpdateSettingsRequest, kind: 'moment' | 'none') => {
    if (saving) return
    setSaving(kind)
    setError(undefined)
    try {
      const { user } = await api.updateSettings(settings)
      dispatch({ type: 'user', user })
      haptics.success()
      if (settings.remindersEnabled) requestWriteAccessIfNeeded()
      reset([{ name: 'home' }])
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Oups, réessaie dans un instant.')
      setSaving(null)
    }
  }

  const chosen = moment ? SCROLL_MOMENT_INFO[moment] : null
  return (
    <Screen>
      <ScreenTitle
        eyebrow={<StepProgress current={3} total={ONBOARDING_STEPS} label="Ton moment" />}
        aside={
          <span className="motion-loop anim-float shrink-0" style={{ '--float-duration': '5s' } as React.CSSProperties}>
            <span className="flex h-14 w-14 rotate-6 items-center justify-center rounded-pill border-[2.5px] border-outline bg-warm shadow-chip">
              <BellRing size={26} strokeWidth={2.3} className="text-on-color" aria-hidden="true" />
            </span>
          </span>
        }
        subtitle="Le bot t’enverra un petit message juste avant. Une fois par jour au plus, et jamais les jours où tu as déjà créé."
      >
        Tu scrolles surtout quand&nbsp;?
      </ScreenTitle>

      <ToggleGroup
        type="single"
        variant="card"
        value={moment ?? ''}
        onValueChange={(value) => {
          if (!isScrollMoment(value)) return
          haptics.selection()
          setMoment(value)
        }}
        className="grid grid-cols-2 gap-4"
        aria-label="Ton moment de scroll"
      >
        {SCROLL_MOMENTS.map((id, index) => {
          const info = SCROLL_MOMENT_INFO[id]
          const { icon: Icon, bg, on } = MOMENT_STYLE[id]
          const entrance = popIn(index)
          return (
            <ToggleGroupItem
              key={id}
              value={id}
              aria-label={`${info.label} : ${info.hint}. Message vers ${formatClock(info.remindAt)}.`}
              className={cn('min-h-40 flex-col items-start justify-between gap-3 text-on-color', bg, on)}
              initial={{ ...entrance.initial, rotate: index % 2 ? 4 : -4 }}
              animate={{ ...entrance.animate, rotate: index % 2 ? 1 : -1 }}
              transition={entrance.transition}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper">
                <Icon size={24} strokeWidth={2.2} className="text-on-color" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-display text-20 font-extrabold tracking-tight">{info.label}</span>
                <span className="text-12 font-medium opacity-80">{info.hint}</span>
              </span>
              <AnimatePresence>
                {moment === id && (
                  <motion.span
                    initial={{ scale: 0, rotate: -40 }}
                    animate={{ scale: 1, rotate: -8 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-pill border-[2.5px] border-outline bg-paper text-on-color"
                  >
                    <Check size={18} strokeWidth={3.2} aria-hidden="true" />
                  </motion.span>
                )}
              </AnimatePresence>
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>

      <p className="mt-6 flex justify-center" aria-live="polite">
        <Badge variant={chosen ? 'good' : 'secondary'} size="sm" className="px-3">
          <BellRing aria-hidden="true" />
          {chosen ? `Message vers ${formatClock(chosen.remindAt)}` : 'Choisis ton moment'}
        </Badge>
      </p>

      <PrimaryAction
        text={chosen ? 'C’est parti' : 'Choisis ton moment'}
        icon={chosen ? <Check aria-hidden="true" /> : undefined}
        onClick={() => moment && void save({ scrollMoment: moment, remindersEnabled: true }, 'moment')}
        enabled={Boolean(moment)}
        loading={saving === 'moment'}
      >
        {error && (
          <Alert variant="warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Info aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button variant="ghost" size="md" className="w-full" disabled={saving !== null} onClick={() => void save({ remindersEnabled: false }, 'none')}>
          <BellOff aria-hidden="true" />
          Pas de message, merci
        </Button>
      </PrimaryAction>
    </Screen>
  )
}
