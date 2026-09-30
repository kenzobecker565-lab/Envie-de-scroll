import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Pastille shadcn/ui (passion, durée, pièces gagnées…), en pilule. */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-pill font-bold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-card text-muted-foreground [&>svg]:text-primary',
        outline: 'border border-border text-foreground',
        soft: 'bg-accent-soft text-foreground [&>svg]:text-primary',
        warm: 'bg-warm-soft text-warm-ink',
        good: 'bg-good-soft text-good-ink',
      },
      size: {
        default: 'h-8 gap-2 px-4 text-12 [&>svg]:size-4',
        sm: 'h-6 px-2 text-11 [&>svg]:size-3',
        lg: 'min-h-10 gap-2 px-4 py-1 text-15 [&>svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Badge({ className, variant, size, asChild = false, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
