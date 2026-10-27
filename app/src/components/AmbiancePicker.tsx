import { CloudRain, Gamepad2, Guitar, Headphones, Martini, Piano, Shuffle, Sparkles, Sun, Sunset, TreePalm, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'motion/react'
import { AMBIANCES, PREMIUM_AMBIANCES, getAmbiance, type AmbianceChoice } from '@scroll-up/shared'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, track } from '../api/client.ts'
import { setAmbiance, useAmbiance } from '../lib/ambient.ts'
import { useAppState } from '../state/AppState.tsx'
import { useShop } from '../lib/shop.ts'
import { haptics } from '../telegram/webApp.ts'

const ICONS: Record<AmbianceChoice, LucideIcon> = {
  signature: Sparkles,
  aube: Sun,
  orbite: Sparkles,
  jazz: Martini,
  lofi: Headphones,
  piano: Piano,
  bossa: Sun,
  acoustique: Guitar,
  synthwave: Sunset,
  '8bit': Gamepad2,
  ambient: Sparkles,
  tropical: TreePalm,
  pluie: CloudRain,
  hasard: Shuffle,
}

/** Couleur du choix allumé (classes écrites en entier, pour Tailwind). */
const TONES = {
  accent: 'data-[state=on]:bg-accent',
  warm: 'data-[state=on]:bg-warm',
  good: 'data-[state=on]:bg-good',
  sky: 'data-[state=on]:bg-sky',
  lilac: 'data-[state=on]:bg-lilac',
} as const

const OPTIONS: readonly { id: AmbianceChoice; label: string; tone: keyof typeof TONES }[] = [
  ...AMBIANCES.map((ambiance) => ({ id: ambiance.id, label: ambiance.label, tone: ambiance.tone })),
  { id: 'hasard', label: 'Au hasard', tone: 'warm' },
]

/**
 * Le choix du style de musique d'ambiance, en pastilles : un tap, et le
 * morceau change tout de suite (la musique se remet si elle était coupée).
 * En dessous : ce qui joue, et le crédit du morceau.
 */
export function AmbiancePicker() {
  const { enabled, choice, current } = useAmbiance()
  const playing = getAmbiance(current)
  const shop = useShop()
  const { dispatch } = useAppState()
  const [error, setError] = useState<string>()

  const choose = (value: string) => {
    if (!value || value === choice) return
    haptics.selection()
    setError(undefined)
    const bonus = PREMIUM_AMBIANCES[value as keyof typeof PREMIUM_AMBIANCES]
    if (bonus || shop.equipped.ambiance) {
      api.equipItem('ambiance', bonus ?? null).then((next) => {
        dispatch({ type: 'shop', shop: next })
        setAmbiance(value as AmbianceChoice)
      }).catch((caught: Error) => setError(caught.message))
    } else setAmbiance(value as AmbianceChoice)
    track('music', { ambiance: value })
  }

  return (
    <div className="flex flex-col gap-3">
      <ToggleGroup type="single" variant="chip" value={enabled ? choice : ''} onValueChange={choose} className="gap-2" aria-label="Style de la musique d’ambiance">
        {OPTIONS.filter((option) => !(option.id in PREMIUM_AMBIANCES) || shop.owned.includes(PREMIUM_AMBIANCES[option.id as keyof typeof PREMIUM_AMBIANCES])).map((option) => {
          const Icon = ICONS[option.id]
          const on = enabled && option.id === choice
          return (
            <ToggleGroupItem key={option.id} value={option.id} className={TONES[option.tone]} whileTap={{ scale: 0.94 }}>
              {on ? <Bars /> : <Icon aria-hidden="true" />}
              {option.label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      {error && <p role="alert" className="text-13 text-accent-strong">{error}</p>}
      <p className="text-13 text-ink-soft" aria-live="polite">
        {enabled ? (
          <>
            <span className="font-bold text-ink">
              {choice === 'hasard' ? `Au hasard, aujourd’hui : ${playing.label}` : playing.label}
            </span>
            {' · '}
            {playing.mood}.
            {playing.credit && (
              <>
                {' '}
                «&nbsp;{playing.credit.title}&nbsp;», {playing.credit.author}.
              </>
            )}
          </>
        ) : (
          'La musique est coupée\u00A0: choisis un style pour la remettre.'
        )}
      </p>
    </div>
  )
}

/** Petit égaliseur qui danse sur le style qui joue. */
function Bars() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 items-end justify-center gap-[2px]">
      {[0, 0.25, 0.5].map((delay) => (
        <motion.span
          key={delay}
          className="w-[3px] rounded-pill bg-current"
          animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
          transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
      ))}
    </span>
  )
}

