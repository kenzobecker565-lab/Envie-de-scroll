import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Message shadcn/ui (information, limite atteinte, erreur). Jamais de rouge :
 * les erreurs restent dans les tons chauds, sans dramatiser.
 */
const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-md p-4 text-left text-13 has-[>svg]:grid-cols-[16px_1fr] has-[>svg]:gap-x-2 [&>svg]:size-4 [&>svg]:translate-y-[2px]',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground shadow-card [&>svg]:text-primary',
        info: 'bg-accent-soft text-foreground [&>svg]:text-primary',
        warning: 'bg-warm-soft text-warm-ink [&>svg]:text-warm',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Alert({ className, variant, ...props }: HTMLMotionProps<'div'> & VariantProps<typeof alertVariants>) {
  return <motion.div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-title" className={cn('col-start-2 text-14 font-bold', className)} {...props} />
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="alert-description" className={cn('col-start-2 grid justify-items-start gap-2', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
