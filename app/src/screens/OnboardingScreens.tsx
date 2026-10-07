import { BookOpen, ArrowRight, BellOff, BellRing, Check, Footprints, Info, Mountain, Sparkles, Sprout, Star, type LucideIcon } from 'lucide-react'
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
  LEARNING_LESSONS,
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
import { api, ApiError, track } from '../api/client.ts'
import { Logo } from '../components/Brand.tsx'
import { Mascot, MinutonFigure } from '../components/Mascot.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { popIn } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'
import './OnboardingScreens.css'

/** Bienvenue, passions, moment de scroll. */
const ONBOARDING_STEPS = 3

/** Première impression avec le Minuton et les repères actuels. */
export function WelcomeScreen() {
  const { state } = useAppState(), { push } = useNavigation()
  const name = state.me.user.firstName
  return <Screen className="studio-onboarding onboarding-refresh">
    <Logo height={30}/><StepProgress current={1} total={ONBOARDING_STEPS} label="Bienvenue"/>
    <div className="onboarding-minuton"><Mascot pose="welcome" size={160}/><span>5 · 15 · 30 minutes pour toi</span></div>
    <header><small>{name ? `Bienvenue, ${name}` : 'Bienvenue'}</small><h1>Ton envie de scroller peut créer quelque chose.</h1><p>Avec « J’ai envie de scroll », choisis ton temps et une passion. Minuton t’aide à te lancer.</p></header>
    <div className="onboarding-landmarks">
      <div><Sparkles/><span><strong>J’ai envie de scroll</strong><small>Une activité à faire maintenant.</small></span></div>
      <div><BookOpen/><span><strong>Apprendre</strong><small>Des leçons pour comprendre et essayer.</small></span></div>
      <div><MinutonFigure pose="draw" size={40} animated={false}/><span><strong>Chez Minuton</strong><small>Tes créations réunies dans ton atelier.</small></span></div>
    </div>
    <Button className="w-full" onClick={() => push({name:'passions',mode:'onboarding'})}>Choisir mes passions<ArrowRight/></Button>
  </Screen>
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
    <Screen className="studio-onboarding onboarding-refresh">
      <ScreenTitle
        eyebrow={mode === 'onboarding' ? <StepProgress current={2} total={ONBOARDING_STEPS} label="Tes passions" /> : undefined}
        aside={
          mode === 'onboarding' ? (
            <MinutonFigure pose="think" size={64} animated={false}/>
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
        className="onboarding-choice-grid"
        aria-label="Tes passions"
      >
        {PASSIONS.map((passion, index) => (
          <PassionCard key={passion.id} passion={passion} index={index} selected={selected.includes(passion.id)} illustrated />
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
    <Screen className="studio-onboarding onboarding-refresh">
      <ScreenTitle
        eyebrow={mode === 'onboarding' ? <StepProgress current={2} total={ONBOARDING_STEPS} label="Ton niveau" /> : undefined}
        aside={
          <MinutonFigure pose="piano" size={64} animated={false}/>
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
          const firstPath = LEARNING_LESSONS.find(lesson => lesson.passion === passion && lesson.level === SKILL_TIER[id] - 1)
          return (
            <ToggleGroupItem key={id} value={id} className="onboarding-level-card items-start gap-3 p-4" {...popIn(index)} whileTap={{ scale: 0.98 }}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline bg-paper text-on-color">
                <LevelIcon size={20} strokeWidth={2.3} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-20 leading-tight font-extrabold tracking-tight">{option.label}</span>
                <span className="text-13 font-medium opacity-85">{option.hint}</span>
                {firstPath && (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-12 font-extrabold">
                    <Mountain size={14} strokeWidth={2.4} aria-hidden="true" />
                    Tu peux découvrir «&nbsp;{firstPath.title}&nbsp;»
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
                    className="onboarding-level-check flex h-8 w-8 shrink-0 items-center justify-center rounded-pill"
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
    <Screen className="studio-onboarding onboarding-refresh">
      <ScreenTitle
        eyebrow={<StepProgress current={3} total={ONBOARDING_STEPS} label="Ton moment" />}
        aside={
          <MinutonFigure pose="wait" size={64} animated={false}/>
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
        className="onboarding-choice-grid"
        aria-label="Ton moment de scroll"
      >
        {SCROLL_MOMENTS.map((id, index) => {
          const info = SCROLL_MOMENT_INFO[id]
          return (
            <ToggleGroupItem
              key={id}
              value={id}
              aria-label={`${info.label} : ${info.hint}. Message vers ${formatClock(info.remindAt)}.`}
              className="onboarding-moment-card"
              data-moment={id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .05 }}
              whileTap={{ scale: .98 }}
            >
              <span className="onboarding-moment-scene" aria-hidden="true"><span className="onboarding-moment-orb"/><span className="onboarding-moment-hill"/><span className="onboarding-selection">{moment === id && <Check size={16}/>}</span></span>
              <span className="onboarding-moment-copy"><strong>{info.label}</strong><small>{info.hint}</small></span>
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
