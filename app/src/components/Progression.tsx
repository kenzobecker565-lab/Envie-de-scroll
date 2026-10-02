import { ArrowRight, Check, Gauge as Gauge2, Lock, Sparkles, Star } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import {
  collection,
  collectionSize,
  getPassion,
  levelSteps,
  passionLevel,
  pathProgress,
  PASSION_IDS,
  type LevelStep,
  type PassionId,
  type PassionStatsDTO,
} from '@scroll-up/shared'
import { Button, PRESSED } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { formatMinutes, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import { Sparkle } from './decor/Sparkle.tsx'
import { PathCard } from './Paths.tsx'
import { SignatureSection, signatureLabel } from './Signature.tsx'

/**
 * La progression par passion (galerie) : un niveau qui monte avec les minutons
 * gagnés dans la passion, et la collection de ses 15 activités. Toucher une
 * carte ouvre le détail : les parcours (six étapes de plus en plus
 * exigeantes), la signature de la passion (avant / maintenant, mots, titres
 * explorés), les cinq niveaux, la collection, et de quoi lancer une activité.
 */

const EMPTY: Omit<PassionStatsDTO, 'passion'> = { minutes: 0, activities: 0, tried: [], steps: [], drawings: 0, words: 0, explored: 0 }

/** Les chiffres d'une passion (zéro si rien n'a encore été fait). */
export function statsFor(byPassion: readonly PassionStatsDTO[] | undefined, passion: PassionId): PassionStatsDTO {
  return byPassion?.find((row) => row.passion === passion) ?? { passion, ...EMPTY }
}

/** Une phrase par niveau, pour la bannière de la confirmation. */
const LEVEL_MESSAGES = [
  'Premier pas fait. Le plus dur, c’est de commencer\u00A0: c’est fait.',
  'Ça devient une habitude, et une bonne.',
  'Tu as trouvé ton rythme. Ça se voit.',
  'Là, ça devient sérieux. Respect.',
  'Le sommet. Chapeau bas, vraiment.',
]

export function PassionProgressGrid({ title = 'Ta progression' }: { title?: string }) {
  const { state } = useAppState()
  const { push } = useNavigation()
  const { user, stats } = state.me
  const [opened, setOpened] = useState<PassionId>()
  const [open, setOpen] = useState(false)
  // Les passions du profil, et celles où l'on a déjà créé quelque chose.
  const shown = PASSION_IDS.filter((passion) => user.passions.includes(passion) || stats.byPassion?.some((row) => row.passion === passion))
  if (!shown.length) return null

  return (
    <section className="mt-8 flex flex-col gap-3" aria-labelledby="progression-title">
      <h2 id="progression-title" className="font-display text-26 font-extrabold tracking-tight text-ink">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {shown.map((passion, index) => (
          <PassionCard
            key={passion}
            passion={passion}
            stats={statsFor(stats.byPassion, passion)}
            index={index}
            onOpen={() => {
              haptics.impact('light')
              track('progress_open', { passion })
              setOpened(passion)
              setOpen(true)
            }}
          />
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {opened && (
            <PassionDetail
              passion={opened}
              stats={statsFor(stats.byPassion, opened)}
              canStart={user.passions.includes(opened)}
              onOpenPath={(pathId) => {
                haptics.impact('light')
                setOpen(false)
                push({ name: 'path', pathId })
              }}
              onChangeSkill={() => {
                haptics.impact('light')
                setOpen(false)
                push({ name: 'skill', passion: opened, mode: 'edit' })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function PassionCard({ passion, stats, index, onOpen }: { passion: PassionId; stats: PassionStatsDTO; index: number; onOpen: () => void }) {
  const info = getPassion(passion)
  const Icon = PASSION_ICONS[passion]
  const level = passionLevel(passion, stats.minutes)
  const size = collectionSize(passion)
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      whileTap={PRESSED}
      initial={{ opacity: 0, y: 12, rotate: index % 2 ? 1.5 : -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.6 : -0.6 }}
      transition={{ delay: 0.15 + index * 0.06, type: 'spring', stiffness: 260, damping: 20 }}
      aria-haspopup="dialog"
      aria-label={`${info.label} : ${level.title ? `niveau ${level.level}, ${level.title}` : 'à découvrir'}. ${plural(stats.tried.length, 'activité découverte', 'activités découvertes')} sur ${size}.`}
      className={cn('flex w-full items-start gap-3 rounded-md border-[2.5px] border-outline p-3 text-left shadow-chip transition-shadow duration-150 active:shadow-press', PASSION_COLORS[passion].soft)}
    >
      <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border-2 border-outline text-on-color [&>svg]:size-5', PASSION_COLORS[passion].bg)}>
        <Icon aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 flex-col">
            <span className="text-12 font-bold text-ink-soft">
              {info.label}
              {signatureLabel(passion, stats) && ` · ${signatureLabel(passion, stats)}`}
            </span>
            <span className="font-display text-20 leading-tight font-extrabold tracking-tight text-ink">{level.title ?? 'À découvrir'}</span>
          </span>
          <LevelChip level={level.level} className="shrink-0" />
        </span>
        <Gauge value={level.progress} delay={0.35 + index * 0.06} />
        <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-12 font-semibold text-ink-soft">
            {level.next ? (level.level === 0 ? 'Ta 1re activité\u00A0: niveau 1' : `Encore ${formatMinutes(level.next.minutes - stats.minutes)}`) : 'Niveau maximal'}
          </span>
          <CollectionDots passion={passion} tried={stats.tried} />
        </span>
      </span>
    </motion.button>
  )
}

/** « Niv. 2 », en pastille ; « Niv. 0 » s'affiche « Nouveau ». */
function LevelChip({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 rounded-pill border-2 border-outline bg-surface-200 px-2 font-numbers text-12 font-extrabold text-ink', className)}>
      {level > 0 ? (
        <>
          <Star size={12} strokeWidth={2.8} aria-hidden="true" />
          Niv.&nbsp;{level}
        </>
      ) : (
        'Nouveau'
      )}
    </span>
  )
}

/** La jauge vers le niveau suivant. */
function Gauge({ value, delay = 0.3, className }: { value: number; delay?: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('block h-3 overflow-hidden rounded-pill border-2 border-outline bg-surface-200', className)}>
      <motion.span
        className="block h-full origin-left bg-accent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: value }}
        transition={{ delay, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </span>
  )
}

/** La collection en un coup d'œil : 15 points, 5 par temps, pleins quand l'activité a été faite. */
function CollectionDots({ passion, tried }: { passion: PassionId; tried: readonly string[] }) {
  const groups = collection(passion)
  const count = groups.reduce((sum, group) => sum + group.activities.filter((activity) => tried.includes(activity.id)).length, 0)
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-1.5" aria-hidden="true">
        {groups.map((group) => (
          <span key={group.duration} className="flex gap-0.5">
            {group.activities.map((activity) => (
              <span
                key={activity.id}
                className={cn('h-1.5 w-1.5 rounded-pill border border-outline', tried.includes(activity.id) ? 'bg-ink' : 'bg-surface-200')}
              />
            ))}
          </span>
        ))}
      </span>
      <span className="font-numbers text-12 font-extrabold text-ink tabular-nums">
        {count}/{collectionSize(passion)}
      </span>
    </span>
  )
}

/* ------------------------------------------------------- le détail d'une passion */

function PassionDetail({
  passion,
  stats,
  canStart,
  onOpenPath,
  onChangeSkill,
}: {
  passion: PassionId
  stats: PassionStatsDTO
  canStart: boolean
  onOpenPath: (pathId: string) => void
  onChangeSkill: () => void
}) {
  const info = getPassion(passion)
  const Icon = PASSION_ICONS[passion]
  const level = passionLevel(passion, stats.minutes)
  const { state, dispatch } = useAppState()
  const skill = state.me.user.skills[passion]
  const { reset } = useNavigation()
  const groups = collection(passion)
  const found = stats.tried.length

  const start = () => {
    haptics.impact('heavy')
    track('cta', { from: 'progression', passion })
    dispatch({ type: 'newFlow', flow: { fixedPassion: passion } })
    reset([{ name: 'home' }, { name: 'signal' }])
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline text-on-color [&>svg]:size-[18px]', PASSION_COLORS[passion].bg)}>
            <Icon aria-hidden="true" />
          </span>
          {info.label}
        </DialogTitle>
        <DialogDescription>
          {plural(stats.activities, 'activité réalisée', 'activités réalisées')} · {plural(stats.minutes, 'minuton')}
        </DialogDescription>
      </DialogHeader>

      {/* Le niveau actuel, en grand. */}
      <Card tone={PASSION_COLORS[passion].card} className="shrink-0 flex-row items-center gap-4 shadow-pop" initial={{ rotate: -1.5, scale: 0.96 }} animate={{ rotate: -0.8, scale: 1 }}>
        <span className="flex h-16 w-16 shrink-0 rotate-6 flex-col items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color">
          <span className="text-11 font-bold tracking-wider uppercase">Niv.</span>
          <span className="font-numbers text-26 leading-none font-extrabold">{level.level}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">{level.title ?? 'À découvrir'}</span>
          <Gauge value={level.progress} />
          <span className="text-13 font-semibold">
            {level.next ? `Encore ${formatMinutes(level.next.minutes - stats.minutes)} pour devenir ${level.next.title}` : 'Tu as atteint le niveau maximal. Bravo\u00A0!'}
          </span>
        </span>
        <Sparkle size={22} color="var(--surface-200)" className="motion-loop anim-twinkle absolute top-2 right-3" />
      </Card>

      {/* Passion avec niveau (Piano) : d'où l'on part, et de quoi le changer. */}
      {info.skill && (
        <button
          type="button"
          onClick={onChangeSkill}
          className="flex shrink-0 items-center gap-3 rounded-md border-[2.5px] border-outline bg-card p-3 text-left shadow-chip transition-shadow duration-150 active:shadow-press"
        >
          <Gauge2 className="size-5 shrink-0 text-ink" aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">Ton niveau</span>
            <span className="text-15 font-extrabold text-ink">{skill ? info.skill.options[skill].label : 'Pas encore dit'}</span>
          </span>
          <span className="text-14 font-bold text-accent-strong">Changer</span>
        </button>
      )}

      {/* Les parcours : progresser étape par étape, de plus en plus exigeant. */}
      <section className="flex shrink-0 flex-col gap-2" aria-labelledby="paths-title">
        <h3 id="paths-title" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Tes parcours
        </h3>
        <p className="text-13 text-ink-soft">Six étapes, de l’échauffement au défi final&nbsp;: chacune un cran plus exigeante que la précédente.</p>
        {pathProgress(passion, stats.steps, level.level, skill).map((progress, index) => (
          <PathCard key={progress.path.id} progress={progress} index={index} onOpen={() => onOpenPath(progress.path.id)} />
        ))}
      </section>

      <SignatureSection passion={passion} stats={stats} />

      {/* Les cinq niveaux. */}
      <section className="flex shrink-0 flex-col gap-2" aria-labelledby="levels-title">
        <h3 id="levels-title" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
          Les niveaux
        </h3>
        <ol className="flex flex-col gap-2">
          {levelSteps(passion).map((step) => (
            <LevelRow key={step.level} step={step} passion={passion} reached={stats.minutes >= step.minutes} current={step.level === level.level} />
          ))}
        </ol>
      </section>

      {/* La collection : les activités faites se dévoilent, les autres restent à découvrir. */}
      <section className="flex shrink-0 flex-col gap-3" aria-labelledby="collection-title">
        <h3 id="collection-title" className="flex items-baseline justify-between gap-2 text-12 font-bold tracking-wider text-ink-soft uppercase">
          Ta collection
          <span className="font-numbers text-13 tracking-normal text-ink normal-case">
            {found}/{collectionSize(passion)} découvertes
          </span>
        </h3>
        {groups.map((group) => (
          <div key={group.duration} className="flex flex-col gap-2">
            <p className="text-13 font-bold text-ink">{group.duration}&nbsp;min</p>
            <ul className="flex flex-col gap-2">
              {group.activities.map((activity) => {
                const done = stats.tried.includes(activity.id)
                return (
                  <li
                    key={activity.id}
                    className={cn(
                      'flex items-start gap-3 rounded-sm border-2 p-3 text-13',
                      done ? cn('border-outline text-ink shadow-chip', PASSION_COLORS[passion].soft) : 'border-dashed border-ink-faint text-ink-soft',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill border-2 [&>svg]:size-3.5',
                        done ? cn('border-outline text-on-color', PASSION_COLORS[passion].bg) : 'border-ink-faint',
                      )}
                    >
                      {done ? <Check strokeWidth={3} aria-hidden="true" /> : <Lock strokeWidth={2.5} aria-hidden="true" />}
                    </span>
                    {done ? <span className="font-semibold">{activity.text}</span> : <span>À découvrir. Elle te sera peut-être proposée la prochaine fois.</span>}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </section>

      {canStart && (
        <Button className="w-full shrink-0" onClick={start}>
          <Sparkles aria-hidden="true" />
          Une activité {info.label}
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </>
  )
}

function LevelRow({ step, passion, reached, current }: { step: LevelStep; passion: PassionId; reached: boolean; current: boolean }) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-sm border-2 px-3 py-2',
        current ? cn('border-outline shadow-chip', PASSION_COLORS[passion].soft) : reached ? 'border-outline' : 'border-dashed border-ink-faint',
      )}
      aria-current={current ? 'step' : undefined}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 font-numbers text-13 font-extrabold',
          reached ? cn('border-outline text-on-color', PASSION_COLORS[passion].bg) : 'border-ink-faint text-ink-faint',
        )}
      >
        {step.level}
      </span>
      <span className={cn('min-w-0 flex-1 font-display text-15 font-extrabold tracking-tight', reached ? 'text-ink' : 'text-ink-soft')}>{step.title}</span>
      <span className={cn('shrink-0 text-12 font-bold', reached ? 'text-ink' : 'text-ink-faint')}>{reached ? <Check size={16} strokeWidth={3} aria-label="atteint" /> : `à ${formatMinutes(step.minutes)}`}</span>
    </li>
  )
}

/* -------------------------------------------------------- à la confirmation */

/** Le sticker d'un niveau franchi dans une passion. */
export function LevelUpBanner({ passion, step }: { passion: PassionId; step: LevelStep }) {
  const info = getPassion(passion)
  const Icon = PASSION_ICONS[passion]
  return (
    <Card
      tone={PASSION_COLORS[passion].card}
      className="w-full flex-row items-center gap-4 text-left shadow-pop"
      initial={{ opacity: 0, scale: 0.6, rotate: 8 }}
      animate={{ opacity: 1, scale: 1, rotate: 1.5 }}
      transition={{ delay: 1.3, type: 'spring', stiffness: 260, damping: 14 }}
      role="status"
    >
      <span className="relative flex h-16 w-16 shrink-0 -rotate-6 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color [&>svg]:size-7">
        <Icon aria-hidden="true" />
        <span className="absolute -right-2 -bottom-1 flex h-7 min-w-7 items-center justify-center rounded-pill border-2 border-on-color bg-warm px-1 font-numbers text-14 font-extrabold text-on-color">
          {step.level}
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-12 font-bold tracking-wider uppercase">
          {info.label} · niveau {step.level}
        </span>
        <span className="font-display text-26 leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere]">{step.title}</span>
        <span className="text-14 font-semibold">{LEVEL_MESSAGES[step.level - 1]}</span>
      </span>
      <Sparkle size={26} color="var(--surface-200)" className="motion-loop anim-twinkle absolute top-2 right-3" />
    </Card>
  )
}
