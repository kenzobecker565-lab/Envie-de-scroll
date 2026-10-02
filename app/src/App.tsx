import { AnimatePresence, motion, MotionConfig, type Variants } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { getMood, getPassion, type MeResponse } from '@scroll-up/shared'
import { api, ApiError, canAuthenticate } from './api/client.ts'
import { RotateCcw, Send } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Wordmark } from './components/Brand.tsx'
import { Backdrop, type DecorTone } from './components/decor/Backdrop.tsx'
import { EmptyState } from './components/Illustration.tsx'
import { suppressAmbient } from './lib/ambient.ts'
import { setAppTheme } from './lib/appTheme.ts'
import { ActivityScreen } from './screens/ActivityScreen.tsx'
import { PassionPickScreen, TimeScreen } from './screens/ChoiceScreens.tsx'
import { DoneScreen } from './screens/DoneScreen.tsx'
import { GalleryScreen } from './screens/GalleryScreen.tsx'
import { ChallengeScreen } from './screens/ChallengeScreen.tsx'
import { PathScreen } from './screens/PathScreen.tsx'
import { ProgressScreen } from './screens/ProgressScreen.tsx'
import { TabBar } from './components/TabBar.tsx'
import { LearnScreen, LearnPassionScreen, PassionHubScreen, PassionSpaceScreen, ProfileScreen } from './screens/NavigationScreens.tsx'
import { HomeScreen } from './screens/HomeScreen.tsx'
import { MomentScreen, PassionsScreen, SkillScreen, WelcomeScreen } from './screens/OnboardingScreens.tsx'
import { ProofScreen } from './screens/ProofScreen.tsx'
import { SignalScreen } from './screens/SignalScreen.tsx'
import { AppStateProvider, useAppState, useNavigation, type Flow, type Route } from './state/AppState.tsx'
import { useBackButton } from './telegram/buttons.ts'
import { syncTheme } from './telegram/theme.ts'
import { initTelegram } from './telegram/webApp.ts'

type Boot = { status: 'loading' } | { status: 'ready'; me: MeResponse } | { status: 'error'; error: ApiError | Error }

export function App() {
  const [boot, setBoot] = useState<Boot>({ status: 'loading' })
  const [tone, setTone] = useState<DecorTone>('mixed')

  const load = useCallback(async () => {
    setBoot({ status: 'loading' })
    try {
      const me = await api.me()
      // Le thème du profil l'emporte sur celui gardé sur ce téléphone.
      setAppTheme(me.user.theme)
      setBoot({ status: 'ready', me })
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
      <Backdrop tone={tone} />
      <div className="relative z-10 mx-auto w-full max-w-[480px]">
        {boot.status === 'loading' && <BootSkeleton />}
        {boot.status === 'error' && <BootError error={boot.error} onRetry={load} />}
        {boot.status === 'ready' && (
          <AppStateProvider me={boot.me}>
            <Router onTone={setTone} />
          </AppStateProvider>
        )}
      </div>
    </MotionConfig>
  )
}

/* ----------------------------- Transitions -------------------------------- */

const screenVariants: Variants = {
  enter: (direction: 1 | -1) => ({ opacity: 0, x: direction * 32, y: 10, scale: 0.985 }),
  center: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  exit: (direction: 1 | -1) => ({ opacity: 0, x: direction * -24, scale: 0.99, transition: { duration: 0.16, ease: 'easeIn' } }),
}

/** Couleur du décor selon l'écran et les choix du parcours. */
function toneFor(route: Route, flow: Flow): DecorTone {
  const moodTone: DecorTone = flow.mood ? (getMood(flow.mood).energy === 'basse' ? 'calm' : 'warm') : 'mixed'
  switch (route.name) {
    case 'signal':
      return 'calm'
    case 'time':
    case 'passion':
      return moodTone
    case 'activity':
    case 'proof':
      return flow.passion ? (getPassion(flow.passion).tone === 'warm' ? 'warm' : 'calm') : moodTone
    case 'done':
      return 'good'
    case 'progress':
    case 'gallery':
    case 'path':
    case 'challenge':
      return 'warm'
    default:
      return 'mixed'
  }
}

function screenFor(route: Route) {
  switch (route.name) {
    case 'welcome':
      return <WelcomeScreen />
    case 'passions':
      return <PassionsScreen mode={route.mode} />
    case 'moment':
      return <MomentScreen />
    case 'skill':
      return <SkillScreen passion={route.passion} mode={route.mode} />
    case 'home':
      return <HomeScreen />
    case 'learn': return <LearnScreen />
    case 'learnPassion': return <LearnPassionScreen passion={route.passion} />
    case 'passionHub': return <PassionHubScreen />
    case 'passionSpace': return <PassionSpaceScreen passion={route.passion} />
    case 'profile': return <ProfileScreen />
    case 'signal':
      return <SignalScreen />
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
    case 'progress':
      return <ProgressScreen />
    case 'gallery':
      return <GalleryScreen passion={route.passion} />
    case 'path':
      return <PathScreen pathId={route.pathId} />
    case 'challenge':
      return <ChallengeScreen />
  }
}

function Router({ onTone }: { onTone: (tone: DecorTone) => void }) {
  const { route, direction, canGoBack, back } = useNavigation()
  const { state } = useAppState()
  const tone = toneFor(route, state.flow)
  useEffect(() => onTone(tone), [tone, onTone])
  // Pendant une activité Musique, Cinéma ou Piano, on écoute, regarde ou joue autre chose : la musique d'ambiance se retire.
  const elsewhere = (route.name === 'activity' || route.name === 'proof') && (state.flow.passion === 'musique' || state.flow.passion === 'cinema' || state.flow.passion === 'piano')
  useEffect(() => (elsewhere ? suppressAmbient('activité') : undefined), [elsewhere])
  // Bouton retour natif de Telegram dès qu'on n'est plus sur le premier écran.
  useBackButton(canGoBack ? back : undefined)

  const key = route.name === 'learnPassion' ? `learn-${route.passion}` : route.name === 'passionSpace' ? `space-${route.passion}` : route.name === 'gallery' ? `gallery-${route.passion ?? 'all'}` : route.name === 'passions' ? `passions-${route.mode}` : route.name === 'path' ? `path-${route.pathId}` : route.name === 'skill' ? `skill-${route.passion}` : route.name
  return (
    <>
      <AnimatePresence mode="wait" custom={direction} initial={false} onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.div key={key} custom={direction} variants={screenVariants} initial="enter" animate="center" exit="exit">
          {screenFor(route)}
        </motion.div>
      </AnimatePresence>
      {/* Navigation des cinq espaces, masquée pendant les activités. */}
      <TabBar />
    </>
  )
}

/* --------------------------- Démarrage de l'app --------------------------- */

function BootSkeleton() {
  return (
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col px-4 pt-4 pb-8" aria-busy="true" aria-label="Chargement">
      <div className="flex items-center justify-between">
        <Wordmark size={36} />
        <Skeleton className="h-10 w-24 rounded-pill" />
      </div>
      <Skeleton className="mt-8 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="flex flex-1 items-center py-8">
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
    <div className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] flex-col items-center justify-center gap-8 px-6">
      <span className="inline-flex items-center gap-2 text-13 font-bold text-ink-soft">
        <Wordmark size={40} />
      </span>
      <EmptyState
        illustration={outsideTelegram ? 'open-telegram' : 'offline'}
        illustrationClassName={outsideTelegram ? 'w-56' : 'w-32'}
        title={outsideTelegram ? 'Ouvre l’app depuis Telegram' : 'Petit souci de connexion'}
        description={
          outsideTelegram
            ? 'Scroll-up vit dans Telegram\u00A0: lance-la depuis le bot, avec le bouton « Ouvrir ».'
            : 'On n’arrive pas à joindre le serveur. Vérifie ta connexion, puis réessaie.'
        }
        action={
          outsideTelegram ? (
            botUsername && (
              <motion.a href={`https://t.me/${botUsername}`} className={cn(buttonVariants())} whileTap={{ scale: 0.96 }}>
                <Send aria-hidden="true" />
                Ouvrir le bot
              </motion.a>
            )
          ) : (
            <Button onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Réessayer
            </Button>
          )
        }
      />
    </div>
  )
}
