import { Award, Flag } from 'lucide-react'
import { motion } from 'motion/react'
import { lastMilestone, nextMilestone, type Milestone } from '@scroll-up/shared'
import { Card } from '@/components/ui/card'
import { plural } from '../lib/format.ts'
import { Sparkle } from './decor/Sparkle.tsx'

/** Le sticker d'un palier franchi, à la confirmation d'une activité. */
export function MilestoneBanner({ milestone }: { milestone: Milestone }) {
  return (
    <Card
      tone="lilac"
      className="w-full flex-row items-center gap-4 text-left shadow-pop"
      initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
      transition={{ delay: 1.5, type: 'spring', stiffness: 260, damping: 14 }}
      role="status"
    >
      <span className="flex h-16 w-16 shrink-0 rotate-6 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-warm text-on-color">
        <Award size={32} strokeWidth={2.3} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-12 font-bold tracking-wider uppercase">Nouveau palier</span>
        <span className="font-display text-26 font-extrabold tracking-tight">{milestone.title}</span>
        <span className="text-14 font-semibold">{milestone.message}</span>
      </span>
      <Sparkle size={26} color="var(--warm)" className="motion-loop anim-twinkle absolute top-2 right-3" />
    </Card>
  )
}

/** La jauge vers le prochain palier (galerie) : du temps gagné, jamais du temps manqué. */
export function MilestoneProgress({ total }: { total: number }) {
  const next = nextMilestone(total)
  if (!next) return null
  const previous = lastMilestone(total)?.coins ?? 0
  const progress = Math.min(1, Math.max(0, (total - previous) / (next.coins - previous)))
  const left = next.coins - total
  return (
    <div className="flex flex-col gap-2" aria-label={`Prochain palier : ${next.title}, dans ${plural(left, 'minute')}`}>
      <div className="flex items-center justify-between gap-2 text-13 font-bold text-ink">
        <span className="inline-flex items-center gap-1">
          <Flag size={14} strokeWidth={2.6} aria-hidden="true" />
          Prochain palier&nbsp;: {next.title}
        </span>
        <span className="font-numbers tabular-nums">plus que {plural(left, 'min', 'min')}</span>
      </div>
      <span aria-hidden="true" className="h-3.5 overflow-hidden rounded-pill border-2 border-outline bg-surface-200">
        <motion.span
          className="block h-full origin-left bg-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
    </div>
  )
}
