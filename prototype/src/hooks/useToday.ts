import { useEffect, useState } from 'react'
import { toDateKey } from '../lib/dates'

/**
 * Le jour en cours (AAAA-MM-JJ), mis à jour quand on passe minuit ou quand
 * on revient sur l'app après l'avoir laissée ouverte en arrière-plan : la
 * série et le calendrier restent justes sans recharger la page.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => toDateKey(new Date()))

  useEffect(() => {
    const check = () => setToday(toDateKey(new Date()))
    const timer = window.setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return today
}
