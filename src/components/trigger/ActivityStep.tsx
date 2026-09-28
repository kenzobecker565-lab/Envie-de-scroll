import { Check, Clock, Info, Shuffle } from 'lucide-react'
import { getMood } from '../../data/moods'
import { getPassion } from '../../data/passions'
import { passionAccent } from '../../lib/accent'
import { fr } from '../../lib/typography'
import { describeMatch, type Suggestion } from '../../services/activityEngine'
import type { Duration, MoodId } from '../../types'
import { Button } from '../ui/Button'
import { BottomBar, StepHeading } from '../ui/StepHeading'

interface ActivityStepProps {
  suggestion: Suggestion
  mood: MoodId
  availableTime: Duration
  saving: boolean
  onAnother: () => void
  onDone: () => void
  onChangeChoices: () => void
}

/** Étape D — la carte d'activité, avec « une autre idée » et « c'est fait ». */
export function ActivityStep({ suggestion, mood, availableTime, saving, onAnother, onDone, onChangeChoices }: ActivityStepProps) {
  const { activity } = suggestion
  const passion = getPassion(activity.passionId)
  const moodInfo = getMood(mood)
  const matchMessage = describeMatch(suggestion)

  return (
    <>
      <StepHeading title="Ton idée du moment" className="mb-3" />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <span className="rounded-full border border-line bg-card px-2.5 py-1">
          <span aria-hidden>{moodInfo.emoji}</span> {moodInfo.shortLabel}
        </span>
        <span className="rounded-full border border-line bg-card px-2.5 py-1">
          <span aria-hidden>{passion.emoji}</span> {passion.label}
        </span>
        <span className="rounded-full border border-line bg-card px-2.5 py-1">{availableTime} min dispo</span>
        <button type="button" onClick={onChangeChoices} className="ml-auto rounded-lg px-1 py-1 font-semibold text-primary underline-offset-4 hover:underline">
          Modifier
        </button>
      </div>

      <div aria-live="polite">
        <article
          key={activity.id}
          style={passionAccent(activity.passionId)}
          className="relative animate-fade-up overflow-hidden rounded-[1.75rem] border border-line bg-card shadow-lift"
        >
          <div className="h-2 bg-accent" aria-hidden />
          <div className="p-5 pt-4">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
              <span className="flex items-center gap-1.5 rounded-full tint-accent px-2.5 py-1">
                <span aria-hidden>{passion.emoji}</span>
                {passion.label}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-ink-soft">
                <Clock className="size-3.5" aria-hidden />
                {activity.duration} min
              </span>
              {activity.level && (
                <span className="rounded-full bg-sage-soft px-2.5 py-1 text-sage">
                  {activity.level === 'debutant' ? 'Niveau débutant' : 'Niveau intermédiaire'}
                </span>
              )}
            </div>
            <h2 className="font-display text-[1.8rem] font-semibold leading-[1.1] tracking-tight">{fr(activity.title)}</h2>
            <p className="mt-3 text-[1.08rem] leading-relaxed">{fr(activity.description)}</p>
          </div>
        </article>

        {matchMessage && (
          <p className="mt-3 flex gap-2.5 rounded-2xl bg-saffron-soft p-3 text-sm leading-snug">
            <Info className="mt-px size-4 shrink-0" aria-hidden />
            {fr(matchMessage)}
          </p>
        )}
      </div>

      <BottomBar>
        <p className="pb-1 text-center text-sm text-ink-soft">Fais l’activité, puis reviens l’enregistrer ici.</p>
        <Button size="lg" block icon={<Check className="size-5" strokeWidth={2.6} aria-hidden />} busy={saving} onClick={onDone}>
          C’est fait, je l’enregistre
        </Button>
        <Button size="lg" variant="secondary" block icon={<Shuffle className="size-5" aria-hidden />} disabled={saving} onClick={onAnother}>
          Une autre idée
        </Button>
      </BottomBar>
    </>
  )
}
