import { Music2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setAmbientEnabled, useAmbientEnabled } from '../lib/ambient.ts'
import { haptics } from '../telegram/webApp.ts'

/** Le bouton de l'accueil qui coupe ou remet la musique d'ambiance. */
export function AmbientButton() {
  const enabled = useAmbientEnabled()
  return (
    <Button
      variant="secondary"
      size="icon"
      haptic={false}
      onClick={() => {
        haptics.selection()
        setAmbientEnabled(!enabled)
      }}
      aria-pressed={enabled}
      aria-label={enabled ? 'Couper la musique d’ambiance' : 'Remettre la musique d’ambiance'}
    >
      {enabled ? <Music2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </Button>
  )
}
