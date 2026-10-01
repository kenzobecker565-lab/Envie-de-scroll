import { ArrowRight, Check, Clock3, Footprints, Lock, Mountain, Play, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { CONFIRMED_PATH_LEVEL, getPassion, getPath, PATH_TIERS, passionLevel, pathProgress, pathsFor, STEPS_PER_PATH, type PathStep } from '@scroll-up/shared'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { BadgePin } from '../components/BadgePin.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { DifficultyMeter } from '../components/Paths.tsx'
import { statsFor } from '../components/Progression.tsx'
import { Screen } from '../components/Screen.tsx'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Un parcours, comme une ascension : le départ en bas, le défi final au
 * sommet. Chaque étape réussie ouvre la suivante, un cran plus exigeante
 * (5, puis 15, puis 30 minutes). On ne voit en entier que l'étape à jouer ;
 * les suivantes montrent seulement ce qu'elles feront travailler.
 */
export function PathScreen({ pathId }: { pathId: string }) {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const current = useRef<HTMLLIElement>(null)
  const path = getPath(pathId)

  useEffect(() => {
    track('path_open', { path: pathId })
    // On arrive à hauteur de l'étape à jouer.
    const timer = window.setTimeout(() => current.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 450)
    return () => window.clearTimeout(timer)
  }, [pathId])

  if (!path) return null
  const stats = statsFor(state.me.stats.byPassion, path.passion)
  const level = passionLevel(path.passion, stats.minutes).level
  const progress = pathProgress(path.passion, stats.steps, level).find((entry) => entry.path.id === path.id)
  if (!progress) return null
  const passion = getPassion(path.passion)
  const Icon = PASSION_ICONS[path.passion]
  const canStart = progress.unlocked && state.me.user.passions.includes(path.passion)
  const firstTitle = pathsFor(path.passion).find((other) => other.tier === 1)?.title ?? ''
  // Le palier suivant : une fois ce parcours terminé, le parcours plus exigeant s'ouvre.
  const nextPath = progress.finished ? pathsFor(path.passion).find((other) => other.tier === path.tier + 1) : undefined

  const start = (step: PathStep) => {
    haptics.impact('heavy')
    track('cta', { from: 'parcours', step: step.id })
    dispatch({ type: 'newFlow', flow: { fixedPassion: path.passion, fixedStep: step.id } })
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  return (
    <Screen>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PASSION_COLORS[path.passion].badge} tilt="left">
            <Icon aria-hidden="true" />
            {passion.label}
          </Badge>
          <Badge variant="secondary" tilt="right">
            Parcours {PATH_TIERS[path.tier].toLowerCase()}
          </Badge>
        </div>
        <h1 className="font-display text-40 font-extrabold tracking-tight text-ink">{path.title}</h1>
        <p className="text-16 text-ink-soft">{path.pitch}</p>
        <p className="text-14 font-semibold text-ink">
          {STEPS_PER_PATH} étapes de plus en plus exigeantes&nbsp;: de l’échauffement (5&nbsp;min) au défi final (30&nbsp;min). Chacune se débloque en réussissant la précédente.
        </p>
      </header>

      {progress.finished && (
        <Card tone={PASSION_COLORS[path.passion].badge} className="mt-6 flex-row items-center gap-4 shadow-pop" initial={{ scale: 0.8, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: -1, opacity: 1 }}>
          <Confetti count={20} />
          <BadgePin pathId={path.id} earned size={64} animate className="rotate-6" />
          <span className="flex flex-col">
            <span className="text-12 font-bold tracking-wider uppercase">Badge gagné</span>
            <span className="font-display text-26 font-extrabold tracking-tight">{path.badge}</span>
          </span>
        </Card>
      )}

      {nextPath && (
        <motion.button
          type="button"
          onClick={() => push({ name: 'path', pathId: nextPath.id })}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex w-full items-center gap-3 rounded-md border-[2.5px] border-outline bg-card p-3 text-left shadow-chip transition-shadow duration-150 active:shadow-press"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline bg-warm text-on-color">
            <Mountain size={22} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">Palier suivant · {PATH_TIERS[nextPath.tier]}</span>
            <span className="font-display text-20 leading-tight font-extrabold tracking-tight text-ink">{nextPath.title}</span>
            <span className="text-13 text-ink-soft">{nextPath.pitch}</span>
          </span>
          <ArrowRight size={20} strokeWidth={2.6} className="shrink-0 text-ink" aria-hidden="true" />
        </motion.button>
      )}

      {!progress.unlocked && (
        <Card className="mt-6 flex-row items-center gap-3 border-dashed">
          <Lock size={22} className="shrink-0 text-ink-soft" aria-hidden="true" />
          <span className="text-14 font-semibold text-ink">
            Ce parcours s’ouvre en finissant «&nbsp;{firstTitle}&nbsp;», ou au niveau {CONFIRMED_PATH_LEVEL} en {passion.label}.
          </span>
        </Card>
      )}

      {/* L'ascension : le sommet en haut, le départ en bas. */}
      <ol className="relative mt-8 flex flex-col gap-4" aria-label={`Les ${STEPS_PER_PATH} étapes, du sommet au départ`}>
        <span aria-hidden="true" className="absolute top-6 bottom-6 left-[23px] border-l-[3px] border-dashed border-ink-faint" />
        <li className="relative flex items-center gap-3">
          <span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-canvas">
            <BadgePin pathId={path.id} earned={progress.finished} size={48} />
          </span>
          <span className="font-display text-17 font-extrabold text-ink">
            Sommet · badge «&nbsp;{path.badge}&nbsp;»
          </span>
        </li>
        {[...path.steps].reverse().map((step) => {
          const done = step.index <= progress.done
          const isCurrent = progress.unlocked && step.index === progress.done + 1
          return (
            <StepRow key={step.id} step={step} done={done} current={isCurrent} canStart={canStart && isCurrent} onStart={() => start(step)} ref={isCurrent ? current : undefined} />
          )
        })}
        <li className="relative flex items-center gap-3">
          <span className="z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline bg-surface-200 text-ink">
            <Footprints size={20} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <span className="font-display text-17 font-extrabold text-ink-soft">Départ</span>
        </li>
      </ol>
    </Screen>
  )
}

function StepRow({ step, done, current, canStart, onStart, ref }: { step: PathStep; done: boolean; current: boolean; canStart: boolean; onStart: () => void; ref?: React.Ref<HTMLLIElement> }) {
  const final = step.index === STEPS_PER_PATH
  const tone = PASSION_COLORS[step.passion]
  return (
    <motion.li
      ref={ref}
      className="relative flex items-start gap-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * (STEPS_PER_PATH - step.index) }}
      aria-current={current ? 'step' : undefined}
    >
      <span
        className={cn(
          'z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-[2.5px] font-numbers text-17 font-extrabold',
          done ? cn('border-outline text-on-color', tone.bg) : current ? 'motion-loop anim-pulse-soft border-outline bg-paper text-on-color shadow-chip' : 'border-ink-faint bg-canvas text-ink-faint',
        )}
      >
        {done ? <Check size={22} strokeWidth={3} aria-label="réussie" /> : current ? step.index : final ? <Trophy size={20} aria-hidden="true" /> : <Lock size={18} aria-hidden="true" />}
      </span>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col gap-2 rounded-md border-[2.5px] p-3',
          done ? cn('border-outline shadow-chip', tone.soft) : current ? 'border-outline bg-card shadow-pop' : 'border-dashed border-ink-faint',
        )}
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-12 font-bold">
          <span className={cn(current || done ? 'text-ink' : 'text-ink-faint')}>Étape {step.index}</span>
          <span className={cn('rounded-pill border-2 px-2 font-extrabold', final ? 'border-outline bg-accent text-on-color' : current || done ? 'border-outline bg-surface-200 text-ink' : 'border-ink-faint text-ink-faint')}>
            {step.difficulty}
          </span>
          <DifficultyMeter level={step.index} tone={done ? 'bg-ink' : current ? tone.bg : 'bg-ink-faint'} />
          <span className={cn('inline-flex items-center gap-1', current || done ? 'text-ink-soft' : 'text-ink-faint')}>
            <Clock3 size={12} strokeWidth={2.6} aria-hidden="true" />
            {step.duration}&nbsp;min
          </span>
        </span>
        <span className={cn('font-display leading-tight font-extrabold tracking-tight', current ? 'text-22 text-ink' : done ? 'text-17 text-ink' : 'text-17 text-ink-soft')}>{step.title}</span>
        {current && <p className="text-15 font-semibold text-ink">{step.text}</p>}
        <span className={cn('text-13', current || done ? 'text-ink-soft' : 'text-ink-faint')}>Tu travailles&nbsp;: {step.focus.charAt(0).toLowerCase() + step.focus.slice(1)}</span>
        {current && canStart && (
          <Button className="mt-1 w-full" onClick={onStart}>
            <Play aria-hidden="true" />
            Commencer l’étape {step.index}
          </Button>
        )}
        {done && <span className="text-12 font-extrabold text-ink">Réussie&nbsp;✓</span>}
      </div>
    </motion.li>
  )
}
