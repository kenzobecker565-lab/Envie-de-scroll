import { cva, type VariantProps } from 'class-variance-authority'
import { Toggle as TogglePrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Élément sélectionnable shadcn/ui (chips de mood, cartes de durée, de
 * passion), en sticker : contour épais ; une fois choisi, il se colore en
 * tomate, se penche un peu et prend une ombre pleine. Icône en ink-soft au
 * repos, sombre sur la couleur une fois choisi.
 * `group/toggle` permet aux enfants de réagir à l'état (group-data-[state=on]/toggle:…).
 */
const toggleVariants = cva(
  'group/toggle relative inline-flex items-center gap-2 border-outline text-left font-semibold text-foreground transition-[color,background-color,box-shadow,rotate,translate] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&>svg]:pointer-events-none [&>svg]:shrink-0 [&>svg]:stroke-[2.2] [&>svg]:transition-colors [&>svg]:duration-200',
  {
    variants: {
      variant: {
        chip: 'min-h-12 rounded-pill border-2 bg-card px-4 py-2 text-14 [&>svg]:size-[18px] [&>svg]:text-ink-soft data-[state=on]:-rotate-2 data-[state=on]:bg-accent data-[state=on]:font-bold data-[state=on]:text-on-color data-[state=on]:shadow-chip data-[state=on]:[&>svg]:text-on-color',
        card: 'w-full rounded-lg border-[2.5px] bg-card p-4 text-15 shadow-card data-[state=on]:-translate-y-0.5 data-[state=on]:bg-accent-soft data-[state=on]:shadow-pop',
      },
    },
    defaultVariants: { variant: 'chip' },
  },
)

function Toggle({ className, variant, ...props }: ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant }), className)} {...props} />
}

export { Toggle, toggleVariants }
