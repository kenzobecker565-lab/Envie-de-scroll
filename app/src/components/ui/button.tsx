import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/telegram/webApp'

/**
 * Bouton shadcn/ui, style « Pop » : gros contour, ombre pleine décalée, et
 * au toucher le bouton s'enfonce dans son ombre. Hauteurs 44 / 48 / 56 px,
 * icône Lucide à côté du texte.
 */
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-md text-15 font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg.lucide:not([class*='size-'])]:size-[18px] [&_svg.lucide]:stroke-[2.4]",
  {
    variants: {
      variant: {
        default:
          'border-[2.5px] border-outline bg-primary font-display text-17 font-extrabold text-on-color shadow-card active:shadow-press disabled:border-ink-faint disabled:bg-muted disabled:text-ink-faint disabled:shadow-none',
        good: 'border-[2.5px] border-outline bg-good font-display text-17 font-extrabold text-on-color shadow-card active:shadow-press disabled:border-ink-faint disabled:bg-muted disabled:text-ink-faint disabled:shadow-none',
        secondary: 'border-2 border-outline bg-secondary text-secondary-foreground shadow-chip active:shadow-press disabled:border-ink-faint disabled:text-ink-faint disabled:shadow-none',
        sky: 'border-2 border-outline bg-sky text-on-color shadow-chip active:shadow-press',
        sun: 'border-2 border-outline bg-warm text-on-color shadow-chip active:shadow-press',
        ghost: 'text-ink-soft hover:bg-muted hover:text-foreground disabled:text-ink-faint',
        link: 'text-accent-strong underline decoration-2 underline-offset-4',
      },
      size: {
        default: 'h-14 px-6',
        md: 'h-12 px-6',
        sm: "h-11 rounded-pill px-4 text-14 [&_svg.lucide:not([class*='size-'])]:size-4",
        icon: 'size-11 rounded-sm',
      },
    },
    compoundVariants: [{ variant: 'link', class: 'h-auto px-0' }],
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

type ButtonProps = HTMLMotionProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Petit retour tactile au toucher (à couper quand l'action vibre déjà autrement). */
    haptic?: boolean
  }

/** Les variantes à ombre pleine s'enfoncent au toucher ; les autres rétrécissent un peu. */
const PRESSED = { x: 3, y: 3 }
const SHRUNK = { scale: 0.96 }

function Button({ className, variant = 'default', size = 'default', haptic = true, type = 'button', disabled, onClick, ...props }: ButtonProps) {
  const flat = variant === 'ghost' || variant === 'link'
  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : flat ? SHRUNK : PRESSED}
      transition={{ type: 'spring', stiffness: 700, damping: 32 }}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(event) => {
        if (haptic) haptics.impact(variant === 'default' || variant === 'good' ? 'medium' : 'light')
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export { Button, buttonVariants, PRESSED, type ButtonProps }
