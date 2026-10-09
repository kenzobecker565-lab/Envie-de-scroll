import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Bloc de chargement shadcn/ui, avec le reflet doux du design system (immobile si les animations sont réduites). */
function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('skeleton rounded-sm', className)} {...props} />
}

/** Plusieurs lignes de texte en attente. */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-6', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonText }
