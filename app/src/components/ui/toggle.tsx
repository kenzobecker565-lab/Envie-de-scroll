import { cva, type VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Élément sélectionnable shadcn/ui (chips de mood, cartes de durée, de
 * passion). Icône en ink-soft au repos, accent une fois sélectionné.
 * `group/toggle` permet aux enfants de réagir à l'état (group-data-[state=on]/toggle:…).
 */
const toggleVariants = cva(
  'group/toggle relative inline-flex items-center gap-2 text-left font-bold text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:transition-colors [&>svg]:duration-200',
  {
    variants: {
      variant: {
        chip: 'min-h-12 rounded-pill border border-border bg-card px-4 py-2 text-14 [&>svg]:size-[18px] [&>svg]:text-ink-soft data-[state=on]:border-primary data-[state=on]:bg-accent-soft data-[state=on]:[&>svg]:text-primary',
        card: 'w-full rounded-md border-2 border-transparent bg-card p-4 text-15 shadow-card data-[state=on]:border-primary',
      },
    },
    defaultVariants: { variant: 'chip' },
  },
)

function Toggle({ className, variant, ...props }: ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant }), className)} {...props} />
}

export { Toggle, toggleVariants }
