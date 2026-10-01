import { Music2, VolumeX } from 'lucide-react'
import { getAmbiance } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { track } from '../api/client.ts'
import { setAmbientEnabled, useAmbiance } from '../lib/ambient.ts'
import { haptics } from '../telegram/webApp.ts'

/** Le bouton de l'accueil qui coupe ou remet la musique d'ambiance (le style se choisit dans les réglages). */
export function AmbientButton() {
  const { enabled, current } = useAmbiance()
  const style = getAmbiance(current).label
  return (
    <Button
      variant="secondary"
      size="icon"
      haptic={false}
      onClick={() => {
        haptics.selection()
        if (enabled) track('music_off')
        setAmbientEnabled(!enabled)
      }}
      aria-pressed={enabled}
      aria-label={enabled ? `Couper la musique d’ambiance (${style})` : `Remettre la musique d’ambiance (${style})`}
    >
      {enabled ? <Music2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </Button>
  )
}
