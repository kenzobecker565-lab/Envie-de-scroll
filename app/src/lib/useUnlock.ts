import { useEffect, useState } from 'react'

/**
 * Garde-fou temporel léger : indique si la durée de l'activité est écoulée,
 * et la progression (0 → 1) pour l'indicateur doux. `clockOffset` corrige
 * l'écart entre l'horloge du téléphone et celle du serveur.
 */
export function useUnlock(createdAt: string | undefined, unlockAt: string | undefined, clockOffset = 0) {
  const [now, setNow] = useState(() => Date.now() + clockOffset)

  const start = createdAt ? Date.parse(createdAt) : 0
  const end = unlockAt ? Date.parse(unlockAt) : 0
  const unlocked = end > 0 && now >= end

  useEffect(() => {
    setNow(Date.now() + clockOffset)
    if (!end || Date.now() + clockOffset >= end) return
    const timer = window.setInterval(() => setNow(Date.now() + clockOffset), 1000)
    return () => window.clearInterval(timer)
  }, [end, clockOffset])

  const progress = end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 0
  return { unlocked, progress, remainingMs: Math.max(0, end - now) }
}
