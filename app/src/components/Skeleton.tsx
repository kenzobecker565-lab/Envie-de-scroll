import { cn } from '../lib/cn.ts'

/** Bloc de chargement (reflet doux, immobile si les animations sont réduites). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton rounded-sm', className)} />
}

/** Plusieurs lignes de texte en attente. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-4', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn('h-6', index === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  )
}
