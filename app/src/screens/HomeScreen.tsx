import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Button, PRESSED } from '@/components/ui/button'
import { cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Wordmark } from '../components/Brand.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { dayPeriod } from '../components/decor/Ornaments.tsx'
import { HomeCta } from '../components/HomeCta.tsx'
import { track } from '../api/client.ts'
import { FeedbackButton } from '../components/FeedbackDialog.tsx'
import { Screen } from '../components/Screen.tsx'
import { AmbientButton } from '../components/AmbientButton.tsx'
import { SettingsButton } from '../components/SettingsSheet.tsx'
import { formatNumber, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { fadeUp } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Accueil : le gros bouton « J'ai envie de scroller » domine l'écran.
 * En dessous, un aperçu discret de ce qui a été fait ce mois-ci : jamais de
 * compteur de jours, jamais de reproche.
 */
export function HomeScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const { user, stats, openProposal } = state.me

  const start = () => {
    haptics.impact('heavy')
    track('cta')
    dispatch({ type: 'newFlow' })
    push({ name: 'signal' })
  }

  const openGallery = () => {
    haptics.impact('light')
    push({ name: 'gallery' })
  }

  const resume = () => {
    if (!openProposal) return
    haptics.impact('light')
    dispatch({
      type: 'newFlow',
      flow: { mood: openProposal.mood, duration: openProposal.duration, passion: openProposal.passion, proposal: openProposal },
    })
    reset([{ name: 'home' }, { name: 'activity' }])
  }

  const ResumeIcon = openProposal ? PASSION_ICONS[openProposal.passion] : null
  const period = dayPeriod(new Date().getHours())
  const hello = period === 'dusk' || period === 'night' ? 'Bonsoir' : 'Bonjour'

  return (
    <Screen className="pt-4">
      <header className="flex items-center justify-between">
        <Wordmark />
        <div className="flex items-center gap-2 min-[380px]:gap-3">
          <AmbientButton />
          <SettingsButton />
          <Button variant="sun" size="sm" className="pl-2" haptic={false} onClick={openGallery} aria-label={`Ma galerie : ${formatNumber(stats.totalCoins)} minutons`}>
          <CoinIcon size={26} className="motion-loop anim-coin" />
          <span className="font-numbers text-17 font-extrabold">{formatNumber(stats.totalCoins)}</span>
          </Button>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-2">
        <motion.h1 className="font-display text-46 font-extrabold tracking-tight text-ink" {...fadeUp(0)}>
          {user.firstName ? `${hello} ${user.firstName}.` : `${hello}.`}
        </motion.h1>
        <motion.p className="max-w-[300px] text-16 text-ink-soft" {...fadeUp(0.1)}>
          Ton pouce te démange&nbsp;? Appuie ici, on s’occupe du reste.
        </motion.p>
      </div>

      {/* Le gros bouton, dans la forme du thème choisi. */}
      <HomeCta onStart={start} />

      <div className="mt-auto flex flex-col gap-4">
        {openProposal && ResumeIcon && (
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

        {stats.totalActivities === 0 && !openProposal ? (
          <HowItWorks />
        ) : (
          <motion.div {...fadeUp(0.3, 8)} className={cn(cardVariants(), 'flex-row items-center gap-3 py-3 pr-3 pl-4')}>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-12 font-bold tracking-wider text-ink-soft uppercase">Ce mois-ci</span>
              <MonthSummary monthActivities={stats.monthActivities} monthCoins={stats.monthCoins} totalActivities={stats.totalActivities} />
            </span>
            <Button variant="sky" size="sm" onClick={openGallery} haptic={false}>
              Galerie
              <ArrowRight aria-hidden="true" />
            </Button>
          </motion.div>
        )}

        {/* Pendant le test : un avis, en un geste. */}
        <FeedbackButton context="accueil" className="self-center" />
      </div>
    </Screen>
  )
}

/** Tant que la galerie est vide : le principe de l'app, en trois temps. */
const STEPS = [
  { text: 'Ton pouce te démange\u00A0? Appuie sur le gros bouton.' },
  { text: 'Ton humeur, ton temps, ta passion\u00A0: trois taps.' },
  { text: 'Une petite activité créative. Chaque minute = un minuton.' },
] as const

function HowItWorks() {
  return (
    <motion.section {...fadeUp(0.3, 8)} className={cn(cardVariants({ tone: 'muted' }), 'gap-3 py-4')} aria-labelledby="how-it-works">
      <h2 id="how-it-works" className="text-12 font-bold tracking-wider text-ink-soft uppercase">
        Comment ça marche
      </h2>
      <ol className="flex flex-col gap-3">
        {STEPS.map((step, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill border-2 border-outline bg-warm font-numbers text-15 font-extrabold text-on-color">
              {index + 1}
            </span>
            <span className="text-14 font-semibold text-ink">{step.text}</span>
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
