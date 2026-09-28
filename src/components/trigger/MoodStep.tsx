import { Moon, Zap } from 'lucide-react'
import { ENERGY_LABELS, moodsByEnergy } from '../../data/moods'
import { cn } from '../../lib/cn'
import type { MoodId } from '../../types'
import { StepHeading } from '../ui/StepHeading'

/**
 * Étape A — le mood. Deux familles bien distinctes visuellement :
 * - énergie basse : cartes douces et arrondies, teinte « crépuscule » ;
 * - énergie haute : cartes plus anguleuses, bordure marquée, teinte « braise »,
 *   légèrement de travers, comme si elles ne tenaient pas en place.
 */
export function MoodStep({ selected, onSelect }: { selected?: MoodId; onSelect: (mood: MoodId) => void }) {
  const low = moodsByEnergy('basse')
  const high = moodsByEnergy('haute')

  return (
    <>
      <StepHeading title="Qu’est-ce qui se passe, là ?" subtitle="Choisis ce qui ressemble le plus à ton état du moment." />

      <section aria-labelledby="mood-basse" className="mb-7">
        <h2 id="mood-basse" className="mb-3 flex items-center gap-2 text-sm font-bold text-dusk">
          <Moon className="size-4" aria-hidden />
          {ENERGY_LABELS.basse.title}
          <span className="font-medium text-ink-soft">· {ENERGY_LABELS.basse.subtitle}</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {low.map((mood, index) => {
            const isLastAlone = index === low.length - 1 && low.length % 2 === 1
            return (
              <button
                key={mood.id}
                type="button"
                aria-pressed={selected === mood.id}
                onClick={() => onSelect(mood.id)}
                className={cn(
                  'flex gap-2 rounded-[1.5rem] bg-dusk-soft p-3.5 text-left transition duration-200 hover:-translate-y-0.5 active:scale-[0.98]',
                  isLastAlone ? 'col-span-2 flex-row items-center' : 'flex-col items-start',
                  selected === mood.id && 'ring-2 ring-dusk ring-offset-2 ring-offset-paper',
                )}
              >
                <span aria-hidden className="text-[1.7rem] leading-none">
                  {mood.emoji}
                </span>
                <span className="flex flex-col">
                  <span className="font-semibold leading-tight">{mood.label}</span>
                  <span className="mt-0.5 text-sm leading-snug text-ink-soft">{mood.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="mood-haute" className="mb-6">
        <h2 id="mood-haute" className="mb-3 flex items-center gap-2 text-sm font-bold text-ember">
          <Zap className="size-4" aria-hidden />
          {ENERGY_LABELS.haute.title}
          <span className="font-medium text-ink-soft">· {ENERGY_LABELS.haute.subtitle}</span>
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {high.map((mood, index) => (
            <button
              key={mood.id}
              type="button"
              aria-pressed={selected === mood.id}
              onClick={() => onSelect(mood.id)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border-2 bg-ember-soft p-3.5 text-left transition duration-200 hover:rotate-0 active:scale-[0.98]',
                index % 2 === 0 ? '-rotate-[0.8deg]' : 'rotate-[0.8deg]',
                selected === mood.id ? 'border-ember' : 'border-ember/30 hover:border-ember/60',
              )}
            >
              <span aria-hidden className="text-[1.7rem] leading-none">
                {mood.emoji}
              </span>
              <span className="flex flex-col">
                <span className="font-bold leading-tight">{mood.label}</span>
                <span className="mt-0.5 text-sm leading-snug text-ink-soft">{mood.hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
