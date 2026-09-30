import { LifeBuoy } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { SIGNAL_MESSAGE } from '@scroll-up/shared'
import { useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Déclenchement : « On a reçu ton signal de détresse pré-scroll. On s'occupe
 * de toi. » puis on enchaîne tout seul sur le choix du mood (un toucher
 * permet de passer plus vite).
 */
export function SignalScreen() {
  const { replace } = useNavigation()
  const reduced = useReducedMotion()

  useEffect(() => {
    haptics.impact('medium')
    const timer = window.setTimeout(() => replace({ name: 'mood' }), 2800)
    return () => window.clearTimeout(timer)
  }, [replace])

  return (
    <button
      type="button"
      onClick={() => replace({ name: 'mood' })}
      className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] w-full flex-col items-center justify-center px-6 text-center"
      aria-label={`${SIGNAL_MESSAGE.first} ${SIGNAL_MESSAGE.second} Toucher pour continuer.`}
    >
      <span className="relative flex h-40 w-40 items-center justify-center" aria-hidden="true">
        {!reduced &&
          [0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-0 rounded-pill border-2 border-accent"
              initial={{ scale: 0.35, opacity: 0.8 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: ring * 0.7, ease: 'easeOut' }}
            />
          ))}
        <motion.span
          className="relative flex h-20 w-20 items-center justify-center rounded-pill bg-accent-soft"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          <LifeBuoy size={36} strokeWidth={1.75} className="text-accent" />
        </motion.span>
      </span>

      <motion.span
        className="mt-8 block font-display text-28 font-semibold text-balance text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {SIGNAL_MESSAGE.first}
      </motion.span>
      <motion.span
        className="mt-2 block font-display text-28 font-semibold text-accent"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {SIGNAL_MESSAGE.second}
      </motion.span>
      <motion.span className="mt-8 block text-12 text-ink-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
        Touche l’écran pour continuer
      </motion.span>
    </button>
  )
}
