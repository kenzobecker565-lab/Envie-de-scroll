import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { countDemoEntries } from '../services/demoData'
import { getPhoto, listHistory } from '../services/historyService'
import { getProfile } from '../services/profileService'
import { computeStats } from '../services/stats'
import type { HistoryEntry, Stats, UserProfile } from '../types'

/**
 * Hooks de lecture « en direct » : grâce à `useLiveQuery` (Dexie), les
 * composants se mettent à jour tout seuls dès que la base change — par
 * exemple, enregistrer une activité rafraîchit immédiatement l'accueil et le
 * tableau de bord, sans rechargement ni état global à synchroniser.
 *
 * Convention : `undefined` = chargement en cours.
 */

/** Profil de l'utilisateur ; `null` s'il n'a pas encore fait l'onboarding. */
export function useProfile(): UserProfile | null | undefined {
  return useLiveQuery(getProfile)
}

/** Historique complet, du plus récent au plus ancien. */
export function useHistory(): HistoryEntry[] | undefined {
  return useLiveQuery(listHistory)
}

/** Historique + statistiques calculées à partir de lui. */
export function useStats(): { history: HistoryEntry[] | undefined; stats: Stats | undefined } {
  const history = useHistory()
  const stats = useMemo(() => (history ? computeStats(history) : undefined), [history])
  return { history, stats }
}

/** Nombre d'entrées de démonstration encore présentes. */
export function useDemoCount(): number | undefined {
  return useLiveQuery(countDemoEntries)
}

/**
 * URL affichable d'une photo stockée dans la base. L'URL temporaire
 * (« blob: ») est libérée automatiquement quand le composant disparaît.
 */
export function usePhotoUrl(photoId: number | undefined): string | undefined {
  const record = useLiveQuery(() => (photoId === undefined ? undefined : getPhoto(photoId)), [photoId])
  const [url, setUrl] = useState<string>()

  useEffect(() => {
    if (!record?.blob) {
      setUrl(undefined)
      return
    }
    const objectUrl = URL.createObjectURL(record.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [record])

  return photoId === undefined ? undefined : url
}
