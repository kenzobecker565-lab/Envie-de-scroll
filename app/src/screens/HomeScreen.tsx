import { ArrowRight, Images } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { BrandMark } from '../components/Brand.tsx'
import { CoinIcon } from '../components/Coins.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatNumber, plural } from '../lib/format.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
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

  return (
    <Screen className="pt-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-13 font-bold text-ink-soft">
          <BrandMark />
          Plutôt Que Scroller
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            haptics.impact('light')
            push({ name: 'gallery' })
          }}
          className="inline-flex h-10 items-center gap-2 rounded-pill bg-surface-200 pr-4 pl-2 shadow-card"
          aria-label={`Ma galerie : ${formatNumber(stats.totalCoins)} pièces d’or`}
        >
          <CoinIcon size={24} />
          <span className="font-mono text-14 font-bold text-ink">{formatNumber(stats.totalCoins)}</span>
        </motion.button>
      </div>

      <div className="mt-8">
        <h1 className="font-display text-28 font-semibold text-ink">{user.firstName ? `Salut ${user.firstName}.` : 'Salut.'}</h1>
        <p className="mt-2 text-15 text-ink-soft">Ton pouce te démange&nbsp;? Appuie ici, on s’occupe du reste.</p>
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
        <motion.button
          type="button"
          onClick={start}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="relative flex h-24 w-full items-center justify-center gap-2 rounded-pill bg-accent px-6 text-accent-ink shadow-pop"
        >
          <span className="font-display text-26 font-semibold">J’ai envie de scroller</span>
        </motion.button>
      </div>

      {openProposal && ResumeIcon && (
        <motion.button
          type="button"
          onClick={resume}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          className="mb-4 flex w-full items-center gap-4 rounded-md bg-surface-200 p-4 text-left shadow-card"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-accent-soft">
            <ResumeIcon size={20} className="text-accent" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-12 text-ink-soft">Tu étais en train de…</span>
            <span className="line-clamp-2 text-14 font-bold text-ink">{openProposal.text}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-13 font-bold text-accent">
            Reprendre
            <ArrowRight size={16} aria-hidden="true" />
          </span>
        </motion.button>
      )}

      <motion.button
        type="button"
        onClick={() => {
          haptics.impact('light')
          push({ name: 'gallery' })
        }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center gap-4 rounded-md bg-surface-100 p-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-11 font-bold tracking-wide text-ink-soft uppercase">Ce mois-ci</span>
          <MonthSummary monthActivities={stats.monthActivities} monthCoins={stats.monthCoins} totalActivities={stats.totalActivities} />
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-13 font-bold text-accent">
          <Images size={16} aria-hidden="true" />
          Galerie
        </span>
      </motion.button>
    </Screen>
  )
}

function MonthSummary({ monthActivities, monthCoins, totalActivities }: { monthActivities: number; monthCoins: number; totalActivities: number }) {
  if (monthActivities > 0) {
    return (
      <span className="mt-1 block text-14 text-ink">
        <span className="font-mono font-bold">{formatNumber(monthActivities)}</span> {monthActivities > 1 ? 'activités réalisées' : 'activité réalisée'} ·{' '}
        <span className="font-mono font-bold">{formatNumber(monthCoins)}</span> pièces d’or
      </span>
    )
  }
  if (totalActivities > 0) {
    return <span className="mt-1 block text-14 text-ink">Nouveau mois, nouvelle page. Ta galerie compte déjà {plural(totalActivities, 'création')}.</span>
  }
  return <span className="mt-1 block text-14 text-ink">Ta galerie se remplira au fil de tes envies.</span>
}
