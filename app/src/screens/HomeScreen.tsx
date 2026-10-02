import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { dayMoment, getPathStep, homeLine, isFixedActivityId, passionLevel, seededRandom } from '@scroll-up/shared'
import { Button, PRESSED } from '@/components/ui/button'
import { cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Wordmark } from '../components/Brand.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { dayPeriod } from '../components/decor/Ornaments.tsx'
import { ChallengeCard, challengePassions, todayKey, wordDone } from '../components/Challenge.tsx'
import { MascotSays } from '../components/Mascot.tsx'
import { ActivePathCard, featuredPath } from '../components/Paths.tsx'
import { statsFor } from '../components/Progression.tsx'
import { track } from '../api/client.ts'
import { Screen } from '../components/Screen.tsx'
import { AmbientButton } from '../components/AmbientButton.tsx'
import { SettingsButton } from '../components/SettingsSheet.tsx'
import { tabStack } from '../components/TabBar.tsx'
import { Tirette } from '../components/Tirette.tsx'
import { formatNumber, plural } from '../lib/format.ts'
import { lessonStack } from '../lib/useLesson.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { fadeUp } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * L'onglet « Créer » (l'accueil) : bonjour, une seule carte (l'activité en
 * cours, sinon le mode d'emploi, le mot du jour, le parcours ou le mois), et
 * tout le bas de l'écran pour la tirette « J'ai envie de scroller ». Jamais
 * de compteur de jours, jamais de reproche.
 */
export function HomeScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const { user, stats, openProposal } = state.me

  const start = (how: 'pull' | 'tap') => {
    haptics.impact('heavy')
    track('cta')
    if (how === 'pull') track('pull')
    dispatch({ type: 'newFlow' })
    push({ name: 'signal' })
  }

  const openProgress = () => {
    haptics.impact('light')
    reset(tabStack('progress'))
  }

  const resume = () => {
    if (!openProposal) return
    haptics.impact('light')
    const fixed = isFixedActivityId(openProposal.activityId)
    dispatch({
      type: 'newFlow',
      flow: { mood: openProposal.mood ?? undefined, duration: openProposal.duration, passion: openProposal.passion, proposal: openProposal, ...(fixed ? { fixedStep: openProposal.activityId } : {}) },
    })
    // Une leçon reprend dans son parcours (le retour y ramène).
    const lesson = getPathStep(openProposal.activityId)
    reset(lesson ? lessonStack(lesson, { name: 'activity' }) : [{ name: 'home' }, { name: 'activity' }])
  }

  const ResumeIcon = openProposal ? PASSION_ICONS[openProposal.passion] : null
  // Une seule carte sous le bonjour, la plus utile maintenant : l'activité en cours,
  // le mode d'emploi (première fois), le mot du jour (pas encore fait), le parcours, sinon le mois.
  const playsWord = challengePassions(user.passions).length > 0
  const wordToday = playsWord && !wordDone(todayKey(), stats.challenge ?? [])
  const featured =
    !openProposal && stats.totalActivities > 0 && !wordToday
      ? featuredPath(
          user.passions,
          (passion) => statsFor(stats.byPassion, passion).steps,
          (passion) => passionLevel(passion, statsFor(stats.byPassion, passion).minutes).level,
          user.skills,
        )
      : null
  const card = openProposal && ResumeIcon ? 'resume' : stats.totalActivities === 0 ? 'how' : wordToday ? 'word' : featured ? 'path' : 'month'
  const hour = new Date().getHours()
  const period = dayPeriod(hour)
  // La phrase d'accueil suit l'heure ; elle ne change pas à chaque retour sur l'accueil.
  const line = homeLine(dayMoment(hour), seededRandom(`home:${user.id}:${new Date().toDateString()}:${dayMoment(hour)}`))
  const hello = period === 'dusk' || period === 'night' ? 'Bonsoir' : 'Bonjour'

  return (
    <Screen tabs className="pt-4 pb-0">
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-2 min-[380px]:gap-3">
          <AmbientButton />
          <SettingsButton />
          <Button variant="sun" size="sm" className="pl-2" haptic={false} onClick={openProgress} aria-label={`Progresser : ${formatNumber(stats.totalCoins)} minutons`}>
          <CoinIcon size={26} className="motion-loop anim-coin" />
          <span className="font-numbers text-17 font-extrabold">{formatNumber(stats.totalCoins)}</span>
          </Button>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-2">
        <motion.h1 className="home-hello font-display font-extrabold tracking-tight text-ink" {...fadeUp(0)}>
          {user.firstName ? `${hello} ${user.firstName}.` : `${hello}.`}
        </motion.h1>
        {/* Minuton, la mascotte, dit la phrase du moment. */}
        <MascotSays mood={dayMoment(hour) === 'nuit' ? 'sleepy' : dayMoment(hour) === 'matin' ? 'happy' : 'wink'} size={52} className="mt-1">
          {line}
        </MascotSays>
      </div>

      <div className="mt-5 flex flex-col">
        {card === 'resume' && openProposal && ResumeIcon && (
          <motion.button
            type="button"
            onClick={resume}
            {...fadeUp(0.2, 8)}
            whileTap={PRESSED}
            className={cn(cardVariants(), 'flex-row items-center text-left transition-shadow duration-150 active:shadow-press')}
          >
            <span className={cn('relative flex h-12 w-12 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-outline', PASSION_COLORS[openProposal.passion].bg)}>
              <ResumeIcon size={22} strokeWidth={2.3} className="text-on-color" aria-hidden="true" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">Tu étais en train de…</span>
              <span className="line-clamp-2 text-15 font-bold text-ink">{openProposal.text}</span>
              <span className="inline-flex items-center gap-1 text-14 font-bold text-accent-strong">
                Reprendre
                <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
              </span>
            </span>
          </motion.button>
        )}

        {card === 'how' && <HowItWorks />}

        {card === 'word' && (
          <ChallengeCard
            done={stats.challenge ?? []}
            onOpen={() => {
              haptics.impact('light')
              push({ name: 'challenge' })
            }}
          />
        )}

        {card === 'path' && featured && (
          <ActivePathCard
            progress={featured.progress}
            started={featured.started}
            onOpen={() => {
              haptics.impact('light')
              push({ name: 'path', pathId: featured.progress.path.id })
            }}
          />
        )}

        {card === 'month' && (
          <motion.button
            type="button"
            onClick={openProgress}
            {...fadeUp(0.2, 8)}
            whileTap={PRESSED}
            className={cn(cardVariants(), 'flex-row items-center gap-3 py-3 pr-3 pl-4 text-left transition-shadow duration-150 active:shadow-press')}
          >
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">Ce mois-ci</span>
              <MonthSummary monthActivities={stats.monthActivities} monthCoins={stats.monthCoins} totalActivities={stats.totalActivities} />
            </span>
            <ArrowRight size={20} strokeWidth={2.6} className="shrink-0 text-ink" aria-hidden="true" />
          </motion.button>
        )}
      </div>

      {/* Tout le bas de l'écran : la tirette, à tirer vers le haut (ou à toucher). */}
      <Tirette onStart={start} />
    </Screen>
  )
}

/** Tant que la galerie est vide : le principe de l'app, en trois temps. */
const STEPS = [
  { text: 'Ton pouce te démange\u00A0? Tire la languette du bas.' },
  { text: 'Ton humeur, ton temps, ta passion\u00A0: trois taps.' },
  { text: 'Une petite activité créative. Chaque minute = un minuton.' },
] as const

function HowItWorks() {
  return (
    <motion.section {...fadeUp(0.3, 8)} className={cn(cardVariants({ tone: 'muted' }), 'gap-2 py-3')} aria-labelledby="how-it-works">
      <h2 id="how-it-works" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
        Comment ça marche
      </h2>
      <ol className="flex flex-col gap-2">
        {STEPS.map((step, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-warm font-numbers text-13 font-extrabold text-on-color">
              {index + 1}
            </span>
            <span className="text-13 leading-snug font-semibold text-ink">{step.text}</span>
          </li>
        ))}
      </ol>
    </motion.section>
  )
}

function MonthSummary({ monthActivities, monthCoins, totalActivities }: { monthActivities: number; monthCoins: number; totalActivities: number }) {
  if (monthActivities > 0) {
    return (
      <span className="font-display text-20 font-extrabold tracking-tight text-ink">
        {plural(monthActivities, 'activité')} · {formatNumber(monthCoins)} minutons
      </span>
    )
  }
  if (totalActivities > 0) {
    return <span className="text-15 font-semibold text-ink">Nouveau mois, nouvelle page. Ta galerie compte déjà {plural(totalActivities, 'création')}.</span>
  }
  return <span className="text-15 font-semibold text-ink">Ta galerie se remplira au fil de tes envies.</span>
}
