import { ArrowRight, Award, Lock, Mountain } from 'lucide-react'
import { motion } from 'motion/react'
import {
  CONFIRMED_PATH_LEVEL,
  getPassion,
  passionLevel,
  PATH_TIERS,
  pathProgress,
  pathsFor,
  SKILL_TIER,
  STEPS_PER_PATH,
  type SkillLevel,
  type Skills,
  type PassionId,
  type PathProgress,
  type PathStep,
} from '@scroll-up/shared'
import { PRESSED } from '@/components/ui/button'
import { Card, cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { BadgePin } from './BadgePin.tsx'
import { Sparkle } from './decor/Sparkle.tsx'

/**
 * Les parcours : six étapes de plus en plus exigeantes, de l'échauffement au
 * défi final. Ici les pièces communes : la jauge de difficulté, la carte d'un
 * parcours, la bannière de la confirmation et la carte de l'accueil.
 */

/** La difficulté en marches d'escalier : six barres qui montent, pleines jusqu'à `level`. */
export function DifficultyMeter({ level, tone, className }: { level: number; tone?: string; className?: string }) {
  return (
    <span className={cn('inline-flex h-5 items-end gap-[2px]', className)} role="img" aria-label={`Difficulté ${level} sur ${STEPS_PER_PATH}`}>
      {Array.from({ length: STEPS_PER_PATH }, (_, index) => (
        <span
          key={index}
          className={cn('w-[6px] rounded-[2px] border-[1.5px] border-outline', index < level ? (tone ?? 'bg-ink') : 'bg-surface-200')}
          style={{ height: `${35 + (index / (STEPS_PER_PATH - 1)) * 65}%` }}
        />
      ))}
    </span>
  )
}

/** Une carte de parcours (détail d'une passion) : niveau, avancée en marches, prochaine étape. */
export function PathCard({ progress, onOpen, index = 0 }: { progress: PathProgress; onOpen: () => void; index?: number }) {
  const { path, done, finished, unlocked, next } = progress
  const firstTitle = pathsFor(path.passion).find((other) => other.tier === 1)?.title ?? ''
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      disabled={!unlocked}
      whileTap={unlocked ? PRESSED : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      aria-label={`Parcours ${path.title}, ${PATH_TIERS[path.tier]}. ${finished ? 'Terminé.' : unlocked ? `${done} étapes sur ${STEPS_PER_PATH}.` : 'Verrouillé.'}`}
      className={cn(
        'flex w-full flex-col gap-2 rounded-md border-[2.5px] p-3 text-left transition-shadow duration-150',
        unlocked ? cn('border-outline shadow-chip active:shadow-press', finished ? PASSION_COLORS[path.passion].soft : 'bg-card') : 'border-dashed border-ink-faint bg-transparent',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className={cn('rounded-pill border-2 px-2 text-11 font-extrabold tracking-wider uppercase', unlocked ? 'border-outline bg-surface-200 text-ink' : 'border-ink-faint text-ink-faint')}>
          {PATH_TIERS[path.tier]}
        </span>
        {finished ? (
          <span className="inline-flex items-center gap-1 text-12 font-extrabold text-ink">
            <Award size={14} strokeWidth={2.6} aria-hidden="true" />
            {path.badge}
          </span>
        ) : unlocked ? (
          <span className="font-numbers text-12 font-extrabold text-ink">
            {done}/{STEPS_PER_PATH}
          </span>
        ) : (
          <Lock size={14} strokeWidth={2.6} className="text-ink-faint" aria-hidden="true" />
        )}
      </span>
      <span className={cn('font-display text-20 leading-tight font-extrabold tracking-tight', unlocked ? 'text-ink' : 'text-ink-soft')}>{path.title}</span>
      <span className="text-13 text-ink-soft">{path.pitch}</span>
      <Stairs done={done} passion={path.passion} dim={!unlocked} />
      <span className={cn('flex items-center justify-between gap-2 text-13 font-bold', unlocked ? 'text-ink' : 'text-ink-faint')}>
        {finished ? (
          <span>Parcours terminé. Bravo&nbsp;!</span>
        ) : unlocked && next ? (
          <>
            <span className="min-w-0">
              Étape {next.index}&nbsp;: {next.title} <span className="font-semibold text-ink-soft">· {next.difficulty}</span>
            </span>
            <ArrowRight size={16} strokeWidth={2.6} className="shrink-0" aria-hidden="true" />
          </>
        ) : (
          <span className="font-semibold">
            S’ouvre en finissant «&nbsp;{firstTitle}&nbsp;», ou au niveau {CONFIRMED_PATH_LEVEL}.
          </span>
        )}
      </span>
    </motion.button>
  )
}

/** Six marches qui montent : pleines pour les étapes réussies. */
function Stairs({ done, passion, dim }: { done: number; passion: PassionId; dim?: boolean }) {
  return (
    <span aria-hidden="true" className="flex h-7 items-end gap-1">
      {Array.from({ length: STEPS_PER_PATH }, (_, index) => (
        <motion.span
          key={index}
          className={cn('flex-1 rounded-t-[4px] border-2 border-b-0', dim ? 'border-ink-faint' : 'border-outline', index < done ? PASSION_COLORS[passion].bg : 'bg-surface-200')}
          initial={{ height: '20%' }}
          animate={{ height: `${28 + (index / (STEPS_PER_PATH - 1)) * 72}%` }}
          transition={{ delay: 0.2 + index * 0.05, type: 'spring', stiffness: 220, damping: 18 }}
        />
      ))}
    </span>
  )
}

/** À la confirmation d'une étape : l'étape réussie, et la suivante qui s'ouvre (ou le badge). */
export function StepBanner({ step, progress, onOpenPath }: { step: PathStep; progress: PathProgress; onOpenPath: () => void }) {
  const passion = getPassion(step.passion)
  const Icon = PASSION_ICONS[step.passion]
  const { path, finished, next } = progress
  const nextPath = finished ? pathsFor(step.passion).find((other) => other.tier === path.tier + 1) : undefined
  return (
    <Card
      tone={PASSION_COLORS[step.passion].card}
      className="w-full gap-3 text-left shadow-pop"
      initial={{ opacity: 0, scale: 0.7, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: -1 }}
      transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 15 }}
      role="status"
    >
      <span className="flex items-center gap-3">
        {finished ? (
          <BadgePin pathId={path.id} earned size={60} animate className="rotate-6" />
        ) : (
          <span className="relative flex h-14 w-14 shrink-0 rotate-6 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color [&>svg]:size-6">
            <Icon aria-hidden="true" />
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-12 font-bold tracking-wider uppercase">
            {passion.label} · {path.title}
          </span>
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">
            {finished ? `Parcours terminé\u00A0! Badge «\u00A0${path.badge}\u00A0»` : `Étape ${step.index}/${STEPS_PER_PATH} réussie\u00A0!`}
          </span>
        </span>
      </span>
      <span className="flex items-end gap-1" aria-hidden="true">
        {path.steps.map((other, index) => (
          <span
            key={other.id}
            className={cn('flex-1 rounded-t-[4px] border-2 border-b-0 border-on-color', index < progress.done ? 'bg-paper' : 'bg-transparent opacity-50')}
            style={{ height: `${10 + index * 5}px` }}
          />
        ))}
      </span>
      {!finished && next && (
        <span className="text-14 font-semibold">
          Prochaine marche&nbsp;: <strong>{next.title}</strong> · {next.difficulty}, {next.duration}&nbsp;min. Un cran plus exigeant.
        </span>
      )}
      {finished && nextPath && (
        <span className="text-14 font-semibold">
          Palier suivant&nbsp;: le parcours {PATH_TIERS[nextPath.tier].toLowerCase()} «&nbsp;<strong>{nextPath.title}</strong>&nbsp;» s’ouvre pour toi.
        </span>
      )}
      <button type="button" onClick={onOpenPath} className="inline-flex items-center gap-1 self-start text-14 font-extrabold underline decoration-2 underline-offset-4">
        Voir le parcours
        <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <Sparkle size={24} color="var(--surface-200)" className="motion-loop anim-twinkle absolute top-2 right-3" />
    </Card>
  )
}

/** Accueil : le parcours en cours (ou une invitation à en commencer un). */
export function ActivePathCard({ progress, started, onOpen, delay = 0.2 }: { progress: PathProgress; started: boolean; onOpen: () => void; delay?: number }) {
  const { path, next, done } = progress
  const Icon = PASSION_ICONS[path.passion]
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={PRESSED}
      className={cn(cardVariants(), 'flex-row items-center text-left transition-shadow duration-150 active:shadow-press')}
    >
      <span className={cn('relative flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline text-on-color', PASSION_COLORS[path.passion].bg)}>
        {started ? <Icon size={22} strokeWidth={2.3} aria-hidden="true" /> : <Mountain size={22} strokeWidth={2.3} aria-hidden="true" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">{started ? `Ton parcours · ${done}/${STEPS_PER_PATH}` : 'Nouveau : les parcours'}</span>
        <span className="line-clamp-2 text-15 font-bold text-ink">
          {started && next ? `${path.title} · étape ${next.index} : ${next.title}` : `${path.title} : ${STEPS_PER_PATH} étapes, de plus en plus exigeantes`}
        </span>
        <span className="inline-flex items-center gap-2 text-14 font-bold text-accent-strong">
          {started ? 'Continuer' : 'Commencer'}
          {next && <DifficultyMeter level={next.index} tone="bg-accent" />}
          <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
        </span>
      </span>
    </motion.button>
  )
}

/** Le meilleur parcours à montrer sur l'accueil : celui en cours le plus avancé, sinon le premier à commencer (au palier du niveau déclaré). */
export function featuredPath(
  passions: readonly PassionId[],
  stepsByPassion: (passion: PassionId) => readonly string[],
  levelOf: (passion: PassionId) => number,
  skills: Skills = {},
): { progress: PathProgress; started: boolean } | null {
  const all = passions.flatMap((passion) => pathProgress(passion, stepsByPassion(passion), levelOf(passion), skills[passion]))
  const ongoing = all.filter((entry) => entry.unlocked && entry.done > 0 && !entry.finished).sort((a, b) => b.done - a.done)[0]
  if (ongoing) return { progress: ongoing, started: true }
  const fresh = all.find((entry) => entry.unlocked && entry.done === 0 && entry.path.tier >= startTier(entry.path.passion, skills)) ?? all.find((entry) => entry.unlocked && entry.done === 0)
  return fresh ? { progress: fresh, started: false } : null
}

/** Le palier par lequel commencer : celui du niveau déclaré, sinon le premier. */
function startTier(passion: PassionId, skills: Skills): number {
  const skill = skills[passion]
  return skill ? SKILL_TIER[skill] : 1
}

/** Le parcours du moment dans une passion : celui en cours, sinon le prochain ouvert (au palier du niveau déclaré), sinon le dernier terminé. */
export function currentPath(passion: PassionId, steps: readonly string[], level: number, skill?: SkillLevel): PathProgress | null {
  const all = pathProgress(passion, steps, level, skill)
  const tier = skill ? SKILL_TIER[skill] : 1
  return (
    all.find((entry) => entry.unlocked && !entry.finished && entry.done > 0) ??
    all.find((entry) => entry.unlocked && !entry.finished && entry.path.tier >= tier) ??
    all.find((entry) => entry.unlocked && !entry.finished) ??
    all.filter((entry) => entry.finished).at(-1) ??
    null
  )
}

/** Les parcours terminés, toutes passions confondues (pour la vitrine des badges). */
export function finishedPathIds(byPassion: readonly { passion: PassionId; steps: readonly string[]; coins: number }[]): string[] {
  return byPassion.flatMap((row) => pathProgress(row.passion, row.steps, passionLevel(row.passion, row.coins).level).filter((entry) => entry.finished).map((entry) => entry.path.id))
}
