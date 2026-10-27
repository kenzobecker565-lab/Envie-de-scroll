import { useEffect, useState } from 'react'
import { Onboarding } from './components/onboarding/Onboarding'
import { TriggerFlow } from './components/trigger/TriggerFlow'
import { AppMark } from './components/ui/Logo'
import { useProfile } from './hooks/useData'
import { useRoute } from './hooks/useRoute'
import { DashboardScreen } from './screens/DashboardScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { initializeApp } from './services/appInit'

/**
 * Racine de l'application :
 * 1. prépare la base locale (et la démo au premier lancement) ;
 * 2. sans profil → onboarding ;
 * 3. sinon → l'écran correspondant à l'adresse (#/, #/envie, #/progres…).
 */
export function App() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    initializeApp()
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch((error: unknown) => {
        console.error('Initialisation impossible', error)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'error') return <StorageError />
  if (status === 'loading') return <Splash />
  return <Screens />
}

function Screens() {
  const profile = useProfile()
  const route = useRoute()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [route])

  if (profile === undefined) return <Splash />
  // Sans profil (ou si toutes ses passions ont disparu du catalogue) : onboarding.
  if (profile === null || profile.passionIds.length === 0) return <Onboarding />

  switch (route) {
    case 'envie':
      return <TriggerFlow profile={profile} />
    case 'progres':
      return <DashboardScreen profile={profile} />
    case 'historique':
      return <HistoryScreen />
    case 'profil':
      return <ProfileScreen profile={profile} />
    default:
      return <HomeScreen profile={profile} />
  }
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper" role="status" aria-label="Chargement">
      <AppMark className="size-16 animate-pulse" />
    </div>
  )
}

function StorageError() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper p-6">
      <div role="alert" className="max-w-sm text-center">
        <AppMark className="mx-auto size-14" />
        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight">Stockage indisponible</h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          L’application enregistre tes données dans ton navigateur, mais il refuse l’accès. Vérifie que tu n’es pas en navigation
          privée et que les données de site ne sont pas bloquées, puis recharge la page.
        </p>
      </div>
    </div>
  )
}
