import { Send } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/Button.tsx'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { Rays } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
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
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!done) return
    haptics.success()
    // Le compteur part de l'ancien total, puis roule jusqu'au nouveau, une fois
    // que les pièces sont tombées dedans.
    const timer = window.setTimeout(() => setShown(done.response.stats.totalCoins), reduced ? 300 : 1250)
    return () => window.clearTimeout(timer)
  }, [done, reduced])

  if (!done) return null
  const earned = done.response.coinsEarned

  return (
    <Screen className="items-center text-center">
      <div className="relative mt-8 flex h-32 w-32 items-center justify-center" style={{ perspective: 600 }}>
        {/* Rayons qui tournent, puis la pièce qui arrive en tournoyant. */}
        <motion.div className="absolute -inset-20" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <Rays className="h-full w-full" />
        </motion.div>
        <Confetti count={34} />
        <span aria-hidden="true" className="motion-loop anim-pulse-soft absolute h-28 w-28 rounded-pill border-2 border-warm opacity-40" />
        <motion.span
          className="relative flex h-24 w-24 items-center justify-center rounded-pill bg-warm-soft shadow-card"
          initial={{ scale: 0.3, opacity: 0, rotateY: 0 }}
          animate={{ scale: 1, opacity: 1, rotateY: 720 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="motion-loop anim-float" style={{ '--float-duration': '3s' } as React.CSSProperties}>
            <CoinIcon size={56} />
          </span>
        </motion.span>
        <Sparkle size={16} className="motion-loop anim-twinkle absolute -top-2 right-0" />
        <Sparkle size={11} color="var(--good)" className="motion-loop anim-twinkle absolute bottom-2 -left-3" style={{ '--twinkle-delay': '-1s' } as React.CSSProperties} />
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
        className="relative mt-8 flex flex-col items-center gap-2 rounded-lg bg-surface-200 px-6 py-6 shadow-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {/* Les pièces gagnées tombent dans le compteur. */}
        {!reduced &&
          Array.from({ length: 6 }, (_, index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              className="absolute top-6"
              style={{ left: `${30 + index * 8}%` }}
              initial={{ y: -190, opacity: 0, rotate: 0 }}
              animate={{ y: [-190, -150, -8, 6], opacity: [0, 1, 1, 0], rotate: [0, index % 2 ? 40 : -40, index % 2 ? 180 : -180, index % 2 ? 200 : -200] }}
              transition={{ delay: 0.55 + index * 0.08, duration: 0.65, ease: 'easeIn', times: [0, 0.2, 0.85, 1] }}
            >
              <CoinIcon size={18} />
            </motion.span>
          ))}
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
