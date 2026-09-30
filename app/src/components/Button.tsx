import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { haptics } from '../telegram/webApp.ts'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'h-14 px-6 bg-accent text-accent-ink font-bold shadow-pop disabled:bg-surface-300 disabled:text-ink-faint disabled:shadow-none',
  secondary: 'h-12 px-6 bg-surface-200 text-ink font-bold border border-line disabled:text-ink-faint',
  ghost: 'h-12 px-4 text-ink-soft font-bold disabled:text-ink-faint',
}

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant
  icon?: ReactNode
  children: ReactNode
  /** Petit retour tactile au toucher (désactivé pour les boutons qui vibrent déjà autrement). */
  haptic?: boolean
}

/** Bouton « pilule » du design system, avec un léger enfoncement au toucher. */
export function Button({ variant = 'primary', icon, children, className, haptic = true, onClick, disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96, opacity: 0.9 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-pill text-15 transition-colors duration-200',
        VARIANTS[variant],
        className,
      )}
      disabled={disabled}
      onClick={(event) => {
        if (haptic) haptics.impact(variant === 'primary' ? 'medium' : 'light')
        onClick?.(event)
      }}
      {...props}
    >
      {icon}
      <span className="relative">{children}</span>
    </motion.button>
  )
}
