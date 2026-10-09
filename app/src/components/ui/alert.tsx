import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Message shadcn/ui (information, limite atteinte, erreur), en sticker à
 * contour. Jamais d'alarme : les erreurs restent jaune soleil, sans dramatiser.
 */
const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-md border-2 border-outline p-4 text-left text-14 font-medium has-[>svg]:grid-cols-[18px_1fr] has-[>svg]:gap-x-2 [&>svg]:size-[18px] [&>svg]:translate-y-[1px] [&>svg]:stroke-[2.4]',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground shadow-chip',
        info: 'bg-sky-soft text-ink',
        warning: 'bg-warm-soft text-ink',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Alert({ className, variant, ...props }: HTMLMotionProps<'div'> & VariantProps<typeof alertVariants>) {
  return <motion.div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('col-start-2 font-display text-16 font-extrabold', className)} {...props} />
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('col-start-2 grid justify-items-start gap-2', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
