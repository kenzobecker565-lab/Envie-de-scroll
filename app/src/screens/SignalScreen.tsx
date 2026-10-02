import { LifeBuoy } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { getActivity, SIGNAL_MESSAGE } from '@scroll-up/shared'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Déclenchement : « On a reçu ton signal de détresse pré-scroll. On s'occupe
 * de toi. » puis on enchaîne tout seul sur le choix du temps (un toucher
 * permet de passer plus vite).
 */
export function SignalScreen() {
  const { replace } = useNavigation()
  const { state, dispatch } = useAppState()
  const step = state.flow.fixedStep ? getActivity(state.flow.fixedStep) : undefined
  const next = () => {
    if (step) dispatch({ type: 'flow', flow: { passion: step.passion, duration: step.duration } })
    replace({ name: step ? 'activity' : 'time' })
  }
  const reduced = useReducedMotion()

  useEffect(() => {
    haptics.impact('medium')
    const timer = window.setTimeout(() => {
      if (step) dispatch({ type: 'flow', flow: { passion: step.passion, duration: step.duration } })
      replace({ name: step ? 'activity' : 'time' })
    }, 2800)
    return () => window.clearTimeout(timer)
  }, [replace, dispatch, step])

  return (
    <button
      type="button"
      onClick={next}
      className="flex min-h-[var(--tg-viewport-stable-height,100dvh)] w-full flex-col items-center justify-center px-6 text-center"
      aria-label={`${SIGNAL_MESSAGE.first} ${SIGNAL_MESSAGE.second} Toucher pour continuer.`}
    >
      <span className="relative flex h-40 w-40 items-center justify-center" aria-hidden="true">
        {!reduced &&
          [0, 1, 2].map((ring) => (
            <motion.span
              key={ring}
              className="absolute inset-0 rounded-pill border-[3px] border-outline"
              initial={{ scale: 0.35, opacity: 0.8 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ duration: 2.2, repeat: Infinity, delay: ring * 0.7, ease: 'easeOut' }}
            />
          ))}
        {/* Des éclats venus de partout convergent vers la bouée : le signal arrive. */}
        {!reduced &&
          Array.from({ length: 10 }, (_, index) => {
            const angle = (index / 10) * Math.PI * 2
            return (
              <motion.span
                key={`spark-${index}`}
                className="absolute"
                initial={{ x: Math.cos(angle) * 150, y: Math.sin(angle) * 150, opacity: 0, scale: 0.6 }}
                animate={{ x: [Math.cos(angle) * 150, 0], y: [Math.sin(angle) * 150, 0], opacity: [0, 1, 0], scale: [0.6, 1, 0.3] }}
                transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.16, ease: 'easeIn' }}
              >
                <Sparkle size={index % 3 === 0 ? 16 : 11} color={['var(--warm)', 'var(--sky)', 'var(--good)', 'var(--lilac)'][index % 4]} />
              </motion.span>
            )
          })}
        <motion.span
          className="relative flex h-24 w-24 items-center justify-center rounded-pill border-[3px] border-outline bg-accent shadow-pop"
          initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        >
          <LifeBuoy size={46} strokeWidth={2.2} className="motion-loop anim-spin-slow text-on-color" style={{ '--spin-duration': '8s' } as React.CSSProperties} />
        </motion.span>
      </span>

      <motion.span
        className="mt-8 block font-display text-34 font-extrabold tracking-tight text-balance text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {SIGNAL_MESSAGE.first}
      </motion.span>
      <motion.span
        className="mt-4 inline-block -rotate-2 rounded-md border-[2.5px] border-outline bg-warm px-4 py-1 font-display text-30 font-extrabold tracking-tight text-on-color shadow-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {SIGNAL_MESSAGE.second}
      </motion.span>
      <motion.span className="mt-8 block text-13 font-semibold text-ink-soft" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
        Touche l’écran pour continuer
      </motion.span>
    </button>
  )
}
