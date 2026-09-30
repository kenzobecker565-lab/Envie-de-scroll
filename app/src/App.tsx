import { AnimatePresence, motion, MotionConfig, type Variants } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import type { MeResponse } from '@pqs/shared'
import { api, ApiError, canAuthenticate } from './api/client.ts'
import { BrandMark } from './components/Brand.tsx'
import { Button } from './components/Button.tsx'
import { Skeleton } from './components/Skeleton.tsx'
import { ActivityScreen } from './screens/ActivityScreen.tsx'
import { MoodScreen, PassionPickScreen, TimeScreen } from './screens/ChoiceScreens.tsx'
import { DoneScreen } from './screens/DoneScreen.tsx'
import { GalleryScreen } from './screens/GalleryScreen.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { PassionsScreen, WelcomeScreen } from './screens/OnboardingScreens.tsx'
import { ProofScreen } from './screens/ProofScreen.tsx'
import { SignalScreen } from './screens/SignalScreen.tsx'
import { AppStateProvider, useNavigation, type Route } from './state/AppState.tsx'
import { useBackButton } from './telegram/buttons.ts'
import { syncTheme } from './telegram/theme.ts'
import { initTelegram } from './telegram/webApp.ts'

type Boot = { status: 'loading' } | { status: 'ready'; me: MeResponse } | { status: 'error'; error: ApiError | Error }

export function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' })

  const load = useCallback(async () => {
    setBoot({ status: 'loading' })
    try {
      setBoot({ status: 'ready', me: await api.me() })
    } catch (error) {
      setBoot({ status: 'error', error: error as Error })
    }
  }, [])

  useEffect(() => {
    initTelegram()
    const stopTheme = syncTheme()
    void load()
    return stopTheme
  }, [load])

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-[480px]">
        {boot.status === 'loading' && <BootSkeleton />}
        {boot.status === 'error' && <BootError error={boot.error} onRetry={load} />}
        {boot.status === 'ready' && (
          <AppStateProvider me={boot.me}>
            <Router />
          </AppStateProvider>
        )}
      </div>
    </MotionConfig>
  )
}

/* ----------------------------- Transitions -------------------------------- */

const screenVariants: Variants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 28 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -20, transition: { duration: 0.16, ease: 'easeIn' } }),
}

function screenFor(route: Route) {
  switch (route.name) {
    case 'welcome':
      return <WelcomeScreen />
    case 'passions':
      return <PassionsScreen mode={route.mode} />
    case 'home':
      return <HomeScreen />
    case 'signal':
      return <SignalScreen />
    case 'mood':
      return <MoodScreen />
    case 'time':
      return <TimeScreen />
    case 'passion':
      return <PassionPickScreen />
    case 'activity':
      return <ActivityScreen />
    case 'proof':
      return <ProofScreen />
    case 'done':
      return <DoneScreen />
    case 'gallery':
      return <GalleryScreen />
  }
}

function Router() {
  const { route, direction, canGoBack, back } = useNavigation()
  // Bouton retour natif de Telegram dès qu'on n'est plus sur le premier écran.
  useBackButton(canGoBack ? back : undefined)

  const key = route.name === 'passions' ? `passions-${route.mode}` : route.name
  return (
    <AnimatePresence mode="wait" custom={direction} initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
      <motion.div key={key} custom={direction} variants={screenVariants} initial="enter" animate="center" exit="exit">
        {screenFor(route)}
      </motion.div>
    </AnimatePresence>
  )
}

/* --------------------------- Démarrage de l'app --------------------------- */

function BootSkeleton() {
  return (
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col px-4 pt-4 pb-8" aria-busy="true" aria-label="Chargement">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40 rounded-pill" />
        <Skeleton className="h-10 w-24 rounded-pill" />
      </div>
      <Skeleton className="mt-8 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="flex flex-1 items-center">
        <Skeleton className="h-24 w-full rounded-pill" />
      </div>
      <Skeleton className="h-20 w-full rounded-md" />
    </div>
  )
}

function BootError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const outsideTelegram = (error instanceof ApiError && error.code === 'unauthorized') || !canAuthenticate()
  const botUsername = import.meta.env.VITE_BOT_USERNAME as string | undefined
  return (
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col items-center justify-center px-6 text-center">
      <BrandMark size={48} />
      <h1 className="mt-6 font-display text-26 font-semibold text-ink">{outsideTelegram ? 'Ouvre l’app depuis Telegram' : 'Petit souci de connexion'}</h1>
      <p className="mt-2 max-w-xs text-15 text-ink-soft">
        {outsideTelegram
          ? 'Plutôt Que Scroller vit dans Telegram\u00A0: lance-la depuis le bot, avec le bouton « Ouvrir ».'
          : 'On n’arrive pas à joindre le serveur. Vérifie ta connexion, puis réessaie.'}
      </p>
      {outsideTelegram && botUsername ? (
        <a
          href={`https://t.me/${botUsername}`}
          className="mt-8 inline-flex h-14 items-center justify-center rounded-pill bg-accent px-6 text-15 font-bold text-accent-ink"
        >
          Ouvrir le bot
        </a>
      ) : (
        !outsideTelegram && (
          <Button className="mt-8" onClick={onRetry}>
            Réessayer
          </Button>
        )
      )}
    </div>
  )
}
