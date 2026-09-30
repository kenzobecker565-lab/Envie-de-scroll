import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Button, PRESSED } from '@/components/ui/button'
import { cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Wordmark } from '../components/Brand.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { dayPeriod, ScrollPhone } from '../components/decor/Ornaments.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatNumber, plural } from '../lib/format.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { fadeUp } from '../lib/motion.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Les stickers des passions, collés autour du gros bouton. */
const STICKERS = [
  { id: 'dessin', className: '-top-5 right-6 h-14 w-14', icon: 24, rotate: 12, delay: '0s' },
  { id: 'musique', className: 'top-24 -right-3 h-12 w-12', icon: 22, rotate: -10, delay: '-1.6s' },
  { id: 'ecriture', className: '-top-4 left-28 h-11 w-11', icon: 20, rotate: 8, delay: '-0.8s' },
] as const

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
        <Button variant="sun" size="sm" className="pl-2" haptic={false} onClick={openGallery} aria-label={`Ma galerie : ${formatNumber(stats.totalCoins)} pièces d’or`}>
          <CoinIcon size={26} className="motion-loop anim-coin" />
          <span className="font-numbers text-17 font-extrabold">{formatNumber(stats.totalCoins)}</span>
        </Button>
      </header>

      <div className="mt-8 flex flex-col gap-2">
        <motion.h1 className="font-display text-46 font-extrabold tracking-tight text-ink" {...fadeUp(0)}>
          {user.firstName ? `${hello} ${user.firstName}.` : `${hello}.`}
        </motion.h1>
        <motion.p className="max-w-[300px] text-16 text-ink-soft" {...fadeUp(0.1)}>
          Ton pouce te démange&nbsp;? Appuie ici, on s’occupe du reste.
        </motion.p>
      </div>

      {/* Le gros bouton : un bloc tomate penché, entouré de stickers qui flottent. */}
      <div className="relative mt-8 mb-6">
        <motion.button
          type="button"
          onClick={start}
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
          whileTap={PRESSED}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="relative flex h-72 w-full flex-col items-start justify-between rounded-[28px] border-[3px] border-outline bg-accent p-6 text-left text-on-color shadow-pop transition-shadow duration-150 active:shadow-press"
        >
          <span className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-md border-[2.5px] border-on-color bg-paper">
            <ScrollPhone />
          </span>
          <span className="flex w-full items-end justify-between gap-4">
            <span className="max-w-[230px] font-display text-46 font-extrabold tracking-tight">J’ai envie de scroller</span>
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color">
              <ArrowRight size={26} strokeWidth={2.8} />
            </span>
          </span>
        </motion.button>
        {STICKERS.map((sticker, index) => {
          const Icon = PASSION_ICONS[sticker.id]
          return (
            <motion.span
              key={sticker.id}
              aria-hidden="true"
              className={cn('pointer-events-none absolute', sticker.className)}
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: sticker.rotate }}
              transition={{ delay: 0.35 + index * 0.12, type: 'spring', stiffness: 380, damping: 14 }}
            >
              <span
                className={cn('motion-loop anim-float flex h-full w-full items-center justify-center rounded-pill border-[2.5px] border-outline', PASSION_COLORS[sticker.id].bg)}
                style={{ '--float-duration': `${3.5 + index}s`, '--float-delay': sticker.delay } as React.CSSProperties}
              >
                <Icon size={sticker.icon} strokeWidth={2.3} className="text-on-color" />
              </span>
            </motion.span>
          )
        })}
      </div>

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
      </div>
    </Screen>
  )
}

function MonthSummary({ monthActivities, monthCoins, totalActivities }: { monthActivities: number; monthCoins: number; totalActivities: number }) {
  if (monthActivities > 0) {
    return (
      <span className="font-display text-20 font-extrabold tracking-tight text-ink">
        {plural(monthActivities, 'activité')} · {formatNumber(monthCoins)} pièces
      </span>
    )
  }
  if (totalActivities > 0) {
    return <span className="text-15 font-semibold text-ink">Nouveau mois, nouvelle page. Ta galerie compte déjà {plural(totalActivities, 'création')}.</span>
  }
  return <span className="text-15 font-semibold text-ink">Ta galerie se remplira au fil de tes envies.</span>
}
