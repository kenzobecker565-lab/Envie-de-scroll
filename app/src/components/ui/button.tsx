import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/telegram/webApp'

/**
 * Bouton shadcn/ui, aux couleurs et aux mesures du design system : pilule,
 * Manrope 700, hauteurs 40 / 48 / 56 px, icône Lucide à gauche du texte.
 */
const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden rounded-pill text-15 font-bold whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-200 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg.lucide:not([class*='size-'])]:size-[18px]",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-pop disabled:bg-muted disabled:text-ink-faint disabled:shadow-none',
        secondary: 'border border-border bg-secondary text-secondary-foreground shadow-card disabled:text-ink-faint',
        soft: 'bg-accent-soft text-foreground disabled:text-ink-faint [&_svg]:text-primary',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:text-ink-faint',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-14 px-6',
        md: 'h-12 px-6',
        sm: "h-10 px-4 text-13 [&_svg.lucide:not([class*='size-'])]:size-4",
        icon: 'size-10',
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

function Button({ className, variant = 'default', size = 'default', haptic = true, type = 'button', disabled, onClick, ...props }: ButtonProps) {
  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={type}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 520, damping: 30 }}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={(event) => {
        if (haptic) haptics.impact(variant === 'default' ? 'medium' : 'light')
        onClick?.(event)
      }}
      {...props}
    />
  )
}

export { Button, buttonVariants, type ButtonProps }
