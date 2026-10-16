import { cva, type VariantProps } from 'class-variance-authority'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Carte shadcn/ui, style « Pop » : contour épais, ombre pleine, rayon 24 px,
 * 16 px de marge intérieure et 16 px entre les blocs. Fond blanc ou aplat de
 * couleur (le texte reste sombre sur la couleur). C'est un élément Framer
 * Motion : on peut l'animer directement.
 */
const cardVariants = cva('relative flex flex-col gap-4 overflow-hidden rounded-lg border-[2.5px] border-outline shadow-card', {
  variants: {
    tone: {
      default: 'bg-card text-card-foreground',
      muted: 'bg-surface-100 text-ink',
      accent: 'bg-accent text-on-color',
      warm: 'bg-warm text-on-color',
      good: 'bg-good text-on-color',
      sky: 'bg-sky text-on-color',
      lilac: 'bg-lilac text-on-color',
    },
    padding: {
      default: 'p-4',
      lg: 'p-6',
      none: 'p-0',
    },
  },
  defaultVariants: { tone: 'default', padding: 'default' },
})

function Card({ className, tone, padding, ...props }: HTMLMotionProps<'div'> & VariantProps<typeof cardVariants>) {
  return <motion.div data-slot="card" className={cn(cardVariants({ tone, padding }), className)} {...props} />
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1', className)} {...props} />
}

/** Petit intitulé en capitales, au-dessus du contenu d'une carte. */
function CardEyebrow({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="card-eyebrow"
      className={cn('inline-flex items-center gap-2 text-12 font-bold tracking-wider uppercase opacity-80 [&>svg]:size-[14px]', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('font-display text-22 font-extrabold tracking-tight', className)} {...props} />
}

function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-13 opacity-80', className)} {...props} />
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('relative', className)} {...props} />
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('relative flex items-center gap-2', className)} {...props} />
}

export { Card, CardContent, CardDescription, CardEyebrow, CardFooter, CardHeader, CardTitle, cardVariants }
