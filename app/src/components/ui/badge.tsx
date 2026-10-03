import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Pastille shadcn/ui, en « sticker » : contour, aplat de couleur, texte
 * sombre. `tilt` la penche un peu, comme collée à la main.
 */
const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden border-2 border-outline font-bold whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:stroke-[2.4]',
  {
    variants: {
      variant: {
        default: 'bg-accent text-on-color',
        secondary: 'bg-surface-200 text-ink',
        sky: 'bg-sky text-on-color',
        lilac: 'bg-lilac text-on-color',
        warm: 'bg-warm text-on-color',
        good: 'bg-good text-on-color',
        outline: 'text-ink',
      },
      size: {
        default: 'h-8 gap-2 rounded-sm px-3 text-13 shadow-chip [&>svg]:size-4',
        sm: 'h-6 rounded-pill px-2 text-12 font-extrabold [&>svg]:size-3',
        lg: 'min-h-10 gap-2 rounded-sm px-4 py-1 text-15 shadow-chip [&>svg]:size-4',
      },
      tilt: {
        none: '',
        left: '-rotate-3',
        right: 'rotate-2',
      },
    },
    defaultVariants: { variant: 'default', size: 'default', tilt: 'none' },
  },
)

function Badge({ className, variant, size, tilt, asChild = false, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'
  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant, size, tilt }), className)} {...props} />
}

export { Badge, badgeVariants }
