import type { Transition } from 'motion/react'

/** Courbe de sortie douce, commune à toutes les apparitions. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const

/** Apparition en fondu, en glissant un peu vers le haut. */
export function fadeUp(delay = 0, distance = 12) {
  return {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5, ease: EASE_OUT } satisfies Transition,
  }
}

/** Apparition en cascade d'une liste (petit ressort). */
export function popIn(index: number) {
  return {
    initial: { opacity: 0, y: 16, scale: 0.94 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { delay: 0.05 * index, type: 'spring', stiffness: 260, damping: 22 } satisfies Transition,
  }
}
