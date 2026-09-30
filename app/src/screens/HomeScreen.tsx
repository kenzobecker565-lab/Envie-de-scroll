import { ArrowRight, ChevronRight, Images, Sparkles } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { CardEyebrow, cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { BrandMark } from '../components/Brand.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { dayPeriod, ScrollPhone, Sky } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatNumber, plural } from '../lib/format.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
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
  const reduced = useReducedMotion()

  const start = () => {
    haptics.impact('heavy')
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
    <div className="relative">
      <Sky period={period} />
      <div className="relative z-10">
        <Screen className="pt-4">
          <header className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-13 font-bold text-ink-soft">
              <BrandMark />
              Scroll-up
            </span>
            <Button variant="secondary" size="sm" className="pl-2" haptic={false} onClick={openGallery} aria-label={`Ma galerie : ${formatNumber(stats.totalCoins)} pièces d’or`}>
              <CoinIcon size={24} className="motion-loop anim-coin" />
              <span className="font-mono text-14 text-ink">{formatNumber(stats.totalCoins)}</span>
            </Button>
          </header>

          <div className="mt-8 flex flex-col gap-2">
            <motion.h1 className="font-display text-28 font-semibold text-ink" {...fadeUp(0)}>
              {user.firstName ? `${hello} ${user.firstName}.` : `${hello}.`}
            </motion.h1>
            <motion.p className="max-w-[80%] text-15 text-ink-soft" {...fadeUp(0.1)}>
              Ton pouce te démange&nbsp;? Appuie ici, on s’occupe du reste.
            </motion.p>
          </div>

          {/* Le bouton principal, entouré d'un halo qui respire doucement. */}
          <div className="relative flex flex-1 items-center justify-center py-8">
            {!reduced &&
              [0, 1].map((ring) => (
                <motion.span
                  key={ring}
                  aria-hidden="true"
                  className="absolute inset-x-0 h-24 rounded-pill bg-accent-soft"
                  initial={{ opacity: 0.7, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.14 }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: ring * 1.4, ease: 'easeOut' }}
                />
              ))}
            {/* Petits éclats qui scintillent autour du bouton. */}
            {[
              { className: 'top-0 left-4', size: 14, delay: '0s', color: 'var(--warm)' },
              { className: 'top-4 right-2', size: 10, delay: '-1.1s', color: 'var(--accent)' },
              { className: 'bottom-2 left-12', size: 9, delay: '-0.5s', color: 'var(--accent)' },
              { className: 'bottom-0 right-10', size: 13, delay: '-1.8s', color: 'var(--warm)' },
            ].map((spark, index) => (
              <Sparkle
                key={index}
                size={spark.size}
                color={spark.color}
                className={`motion-loop anim-twinkle absolute ${spark.className}`}
                style={{ '--twinkle-delay': spark.delay } as React.CSSProperties}
              />
            ))}
            <Button
              onClick={start}
              haptic={false}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
              className="anim-shine motion-loop h-24 w-full gap-4 px-6 font-display text-26 leading-tight font-semibold whitespace-normal"
              style={{ '--shine-duration': '4.5s' } as React.CSSProperties}
            >
              <ScrollPhone className="shrink-0" />
              <span className="relative">J’ai envie de scroller</span>
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {openProposal && ResumeIcon && (
              <motion.button
                type="button"
                onClick={resume}
                {...fadeUp(0.2, 8)}
                whileTap={{ scale: 0.98 }}
                className={cn(cardVariants(), 'flex-row items-center text-left')}
              >
                <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-accent-soft">
                  <span aria-hidden="true" className="motion-loop anim-pulse-soft absolute inset-0 rounded-pill border-2 border-accent opacity-40" />
                  <ResumeIcon size={20} className="text-accent" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-12 text-ink-soft">Tu étais en train de…</span>
                  <span className="line-clamp-2 text-14 font-bold text-ink">{openProposal.text}</span>
                  <span className="inline-flex items-center gap-1 text-13 font-bold text-accent">
                    Reprendre
                    <ArrowRight size={16} aria-hidden="true" />
                  </span>
                </span>
              </motion.button>
            )}

            <motion.button
              type="button"
              onClick={openGallery}
              {...fadeUp(0.3, 8)}
              whileTap={{ scale: 0.98 }}
              className={cn(cardVariants({ tone: 'muted' }), 'flex-row items-center text-left')}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-surface-200 text-accent">
                <Images size={20} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <CardEyebrow>
                  <Sparkles aria-hidden="true" className="text-warm" />
                  Ce mois-ci
                </CardEyebrow>
                <MonthSummary monthActivities={stats.monthActivities} monthCoins={stats.monthCoins} totalActivities={stats.totalActivities} />
              </span>
              <ChevronRight size={20} className="shrink-0 text-ink-soft" aria-hidden="true" />
              <span className="sr-only">Ouvrir ma galerie</span>
            </motion.button>
          </div>
        </Screen>
      </div>
    </div>
  )
}

function MonthSummary({ monthActivities, monthCoins, totalActivities }: { monthActivities: number; monthCoins: number; totalActivities: number }) {
  if (monthActivities > 0) {
    return (
      <span className="text-14 text-ink">
        <span className="font-mono font-bold">{formatNumber(monthActivities)}</span> {monthActivities > 1 ? 'activités réalisées' : 'activité réalisée'} ·{' '}
        <span className="font-mono font-bold">{formatNumber(monthCoins)}</span> pièces d’or
      </span>
    )
  }
  if (totalActivities > 0) {
    return <span className="text-14 text-ink">Nouveau mois, nouvelle page. Ta galerie compte déjà {plural(totalActivities, 'création')}.</span>
  }
  return <span className="text-14 text-ink">Ta galerie se remplira au fil de tes envies.</span>
}
