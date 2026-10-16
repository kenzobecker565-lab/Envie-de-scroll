import { ArrowRight, BellOff, BellRing, Check, Footprints, Info, Mountain, Sprout, Star, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import {
  formatClock,
  reminderMinutes,
  getPassion,
  isSkillLevel,
  MAX_PASSIONS,
  missingSkills,
  PASSIONS,
  LEARNING_LESSONS,
  SKILL_LEVELS,
  SKILL_TIER,
  type PassionId,
  type SkillLevel,
  type UpdateSettingsRequest,
} from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, ApiError, track } from '../api/client.ts'
import { Logo } from '../components/Brand.tsx'
import { MinutonFigure } from '../components/Mascot.tsx'
import { PassionCard } from '../components/PassionCard.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen, ScreenTitle, StepProgress } from '../components/Screen.tsx'
import { popIn } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics, requestWriteAccessIfNeeded } from '../telegram/webApp.ts'
import { ReminderTimePicker } from '../components/ReminderTimePicker.tsx'
import './OnboardingScreens.css'

/** Deux étapes avant la première activité ; les rappels restent facultatifs. */
const ONBOARDING_STEPS = 2

/** Première impression avec le Minuton et les repères actuels. */
export function WelcomeScreen() {
  const { push } = useNavigation()
  return <Screen className="studio-onboarding onboarding-refresh onboarding-welcome">
    <div className="onboarding-welcome-cover"><Logo height={30}/><div><h1>Une envie.<br/>Une création.</h1><MinutonFigure pose="cheer" size={160} animated={false}/></div><p>Fais quelque chose de ton envie de scroller.</p></div>
    <StepProgress current={1} total={ONBOARDING_STEPS} label="Bienvenue"/>
    <section className="onboarding-essentials"><h2>Quelques minutes pour toi.</h2><p>Choisis ton temps, découvre trois idées et lance-toi, dans l’app ou ailleurs.</p><div><span>5 min</span><span>15 min</span><span>30 min</span></div><small>Tes créations trouveront leur place dans ta galerie.</small></section>
    <Button className="w-full" onClick={() => push({name:'passions',mode:'onboarding'})}>Choisir mes passions<ArrowRight/></Button>
  </Screen>
}

/** Choix des passions, autant qu'on veut (onboarding, ou modification depuis les réglages). */
export function PassionsScreen({ mode }: { mode: 'onboarding' | 'edit' }) {
  const { state, dispatch } = useAppState()
  const { back, replace, reset } = useNavigation()
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
      // Le niveau reste accessible lors de la modification des passions.
      const missing = missingSkills(user.passions, user.skills)[0]
      if (mode === 'onboarding') {
        const settings=await api.updateSettings({remindersEnabled:false})
        dispatch({type:'user',user:settings.user})
        reset([{name:'home'}])
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
 * Onboarding, étape 3 : une heure locale précise pour le rappel facultatif.
 */
export function MomentScreen() {
  const { state, dispatch } = useAppState()
  const { reset } = useNavigation()
  const [reminderTime, setReminderTime] = useState(() => reminderMinutes(state.me.user.scrollMoment, 19, state.me.user.reminderTime))
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

  return <Screen className="studio-onboarding onboarding-refresh">
    <ScreenTitle subtitle="Choisis l’heure de ton petit rappel.">
      Ton moment pour créer
    </ScreenTitle>
    <ReminderTimePicker value={reminderTime} onChange={setReminderTime} disabled={saving !== null}/>
    <PrimaryAction text={`Me rappeler à ${formatClock(reminderTime)}`} icon={<BellRing aria-hidden="true"/>} onClick={() => void save({ reminderTime, remindersEnabled: true }, 'moment')} enabled={saving === null} loading={saving === 'moment'}>
      {error && <Alert variant="warning"><Info aria-hidden="true"/><AlertDescription>{error}</AlertDescription></Alert>}
      <Button variant="ghost" size="md" className="w-full" disabled={saving !== null} onClick={() => void save({ remindersEnabled: false }, 'none')}><BellOff aria-hidden="true"/>Pas de notification</Button>
      <p className="reminder-footnote">Tu pourras modifier l’heure dans tes réglages.</p>
    </PrimaryAction>
  </Screen>
}
