import { Send } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button.tsx'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Confirmation : « Activité enregistrée. +X minutes ajoutées à ton total. » */
export function DoneScreen() {
  const { state } = useAppState()
  const { reset } = useNavigation()
  const done = state.done
  const [shown, setShown] = useState(done?.previousTotal ?? 0)

  useEffect(() => {
    if (!done) return
    haptics.success()
    // Le compteur part de l'ancien total, puis roule jusqu'au nouveau.
    const timer = window.setTimeout(() => setShown(done.response.stats.totalCoins), 450)
    return () => window.clearTimeout(timer)
  }, [done])

  if (!done) return null
  const earned = done.response.coinsEarned

  return (
    <Screen className="items-center text-center">
      <div className="relative mt-8 flex h-32 w-32 items-center justify-center">
        <Confetti />
        <motion.span
          className="flex h-24 w-24 items-center justify-center rounded-pill bg-warm-soft"
          initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        >
          <CoinIcon size={56} />
        </motion.span>
      </div>

      <motion.h1
        className="mt-6 font-display text-28 font-semibold text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        Activité enregistrée.
      </motion.h1>
      <motion.p className="mt-2 text-15 text-ink-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <span className="font-bold text-good-ink">+{earned} minutes</span> ajoutées à ton total.
      </motion.p>

      <motion.div
        className="mt-8 flex flex-col items-center gap-2 rounded-lg bg-surface-200 px-6 py-6 shadow-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <CoinCounter value={shown} tone="good" />
        <span className="inline-flex items-center gap-2 text-12 text-ink-soft">
          <span className="rounded-pill bg-good-soft px-2 font-mono text-mono-xs font-bold text-good-ink">+{earned}</span>
          pièces d’or au total
        </span>
      </motion.div>

      {done.photoPending && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 inline-flex items-start gap-2 rounded-md bg-accent-soft p-4 text-left text-13 text-ink"
        >
          <Send size={16} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
          Envoie la photo de ton dessin au bot quand tu veux&nbsp;: elle rejoindra ta galerie.
        </motion.p>
      )}

      <div className="mt-auto flex w-full flex-col">
        <PrimaryAction text="Voir ma galerie" onClick={() => reset([{ name: 'home' }, { name: 'gallery' }])}>
          <Button variant="ghost" className="mt-2 w-full" onClick={() => reset([{ name: 'home' }], -1)}>
            Retour à l’accueil
          </Button>
        </PrimaryAction>
      </div>
    </Screen>
  )
}
