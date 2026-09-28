import { ArrowLeft, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useHistory } from '../../hooks/useData'
import { navigate } from '../../hooks/useRoute'
import { platform } from '../../platform'
import { suggestActivity, type Suggestion } from '../../services/activityEngine'
import { recordActivity } from '../../services/historyService'
import type { Duration, MoodId, PassionId, UserProfile } from '../../types'
import { AppShell } from '../layout/AppShell'
import { IconButton } from '../ui/Button'
import { PassionChip } from '../ui/Passion'
import { StepHeading } from '../ui/StepHeading'
import { StepProgress, StepTransition, type StepDirection } from '../ui/StepTransition'
import { useToast } from '../ui/Toast'
import { ActivityStep } from './ActivityStep'
import { DoneStep } from './DoneStep'
import { MoodStep } from './MoodStep'
import { TimeStep } from './TimeStep'

type Step = 'mood' | 'passion' | 'time' | 'activity' | 'done'

/** Nombre d'activités récentes que le moteur essaie de ne pas reproposer. */
const RECENT_WINDOW = 15

/**
 * Le parcours « J'ai envie de scroller » :
 * A. mood → B. passion du moment → C. temps dispo → D. activité proposée.
 * (Si le profil ne compte qu'une passion, l'étape B est sautée.)
 */
export function TriggerFlow({ profile }: { profile: UserProfile }) {
  const history = useHistory()
  const toast = useToast()
  const hasSinglePassion = profile.passionIds.length === 1

  const [step, setStep] = useState<Step>('mood')
  const [direction, setDirection] = useState<StepDirection>('forward')
  const [mood, setMood] = useState<MoodId>()
  const [passionId, setPassionId] = useState<PassionId | undefined>(hasSinglePassion ? profile.passionIds[0] : undefined)
  const [duration, setDuration] = useState<Duration>()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [shownIds, setShownIds] = useState<string[]>([])
  const [entryId, setEntryId] = useState<number>()
  const [saving, setSaving] = useState(false)

  const steps: Step[] = hasSinglePassion ? ['mood', 'time', 'activity'] : ['mood', 'passion', 'time', 'activity']
  const recentIds = useMemo(() => (history ?? []).slice(0, RECENT_WINDOW).map((entry) => entry.activityId), [history])

  const goTo = (next: Step, dir: StepDirection = 'forward') => {
    setDirection(dir)
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  const goBack = () => {
    const index = steps.indexOf(step)
    if (index <= 0) navigate('accueil')
    else goTo(steps[index - 1]!, 'back')
  }

  /** Premier tirage, à l'arrivée sur l'étape D. */
  const showFirstIdea = (chosenMood: MoodId, chosenPassion: PassionId, chosenDuration: Duration) => {
    const first = suggestActivity({
      passionId: chosenPassion,
      mood: chosenMood,
      duration: chosenDuration,
      beginnerMode: profile.beginnerMode,
      recentIds,
    })
    setSuggestion(first)
    setShownIds(first ? [first.activity.id] : [])
    goTo('activity')
  }

  /** « Une autre idée » : nouveau tirage, sans repasser par les étapes. */
  const showAnotherIdea = () => {
    if (!mood || !passionId || !duration) return
    const next = suggestActivity({ passionId, mood, duration, beginnerMode: profile.beginnerMode, shownIds, recentIds })
    if (!next) return
    platform.haptic('selection')
    setSuggestion(next)
    setShownIds(next.cycled ? [next.activity.id] : [...shownIds, next.activity.id])
  }

  /** « C'est fait, je l'enregistre ». */
  const saveActivity = async () => {
    if (!suggestion || !mood) return
    setSaving(true)
    try {
      const id = await recordActivity(suggestion.activity, mood)
      platform.haptic('success')
      setEntryId(id)
      goTo('done')
    } catch {
      toast('Oups, l’enregistrement a échoué. Réessaie.')
    } finally {
      setSaving(false)
    }
  }

  const stepNumber = steps.indexOf(step) + 1

  return (
    <AppShell hideNav>
      <header className="flex items-center gap-2 py-1">
        {step === 'done' ? (
          <span className="size-10" aria-hidden />
        ) : (
          <IconButton label={step === 'mood' ? 'Retour à l’accueil' : 'Étape précédente'} onClick={goBack} className="-ml-2">
            <ArrowLeft className="size-5" aria-hidden />
          </IconButton>
        )}
        {step === 'done' ? (
          <span className="flex-1" />
        ) : (
          <StepProgress current={stepNumber} total={steps.length} label="Progression du parcours" />
        )}
        <IconButton label="Fermer et revenir à l’accueil" onClick={() => navigate('accueil')} className="-mr-2">
          <X className="size-5" aria-hidden />
        </IconButton>
      </header>

      <StepTransition stepKey={step} direction={direction} className="flex flex-1 flex-col pt-4">
        {step === 'mood' && (
          <MoodStep
            selected={mood}
            onSelect={(chosen) => {
              setMood(chosen)
              platform.haptic('selection')
              goTo(hasSinglePassion ? 'time' : 'passion')
            }}
          />
        )}

        {step === 'passion' && (
          <>
            <StepHeading title="Quelle passion te tente maintenant ?" subtitle="Une seule, parmi les tiennes." />
            <div className="flex flex-wrap gap-2.5">
              {profile.passionIds.map((id) => (
                <PassionChip
                  key={id}
                  passionId={id}
                  size="lg"
                  selected={passionId === id}
                  onClick={() => {
                    setPassionId(id)
                    platform.haptic('selection')
                    goTo('time')
                  }}
                />
              ))}
            </div>
            <p className="mt-6 text-sm text-ink-soft">
              Envie d’en ajouter une&nbsp;?{' '}
              <a href="#/profil" className="font-semibold text-primary underline-offset-4 hover:underline">
                Modifie tes passions dans ton profil
              </a>
              .
            </p>
          </>
        )}

        {step === 'time' && (
          <TimeStep
            selected={duration}
            onSelect={(chosen) => {
              setDuration(chosen)
              if (mood && passionId) showFirstIdea(mood, passionId, chosen)
            }}
          />
        )}

        {step === 'activity' && mood && duration && suggestion && (
          <ActivityStep
            suggestion={suggestion}
            mood={mood}
            availableTime={duration}
            saving={saving}
            onAnother={showAnotherIdea}
            onDone={saveActivity}
            onChangeChoices={() => goTo('mood', 'back')}
          />
        )}

        {step === 'activity' && !suggestion && (
          <StepHeading
            title="Pas d’idée pour cette passion"
            subtitle="La bibliothèque n’a encore aucune activité pour elle. Choisis une autre passion ou enrichis la bibliothèque."
          />
        )}

        {step === 'done' && entryId !== undefined && suggestion && <DoneStep entryId={entryId} activity={suggestion.activity} />}
      </StepTransition>
    </AppShell>
  )
}
