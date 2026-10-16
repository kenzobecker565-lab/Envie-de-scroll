import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import choosePassions from '../illustrations/choose-passions.svg?raw'
import emptyGallery from '../illustrations/empty-gallery.svg?raw'
import offline from '../illustrations/offline.svg?raw'
import openTelegram from '../illustrations/open-telegram.svg?raw'
import welcome from '../illustrations/welcome.svg?raw'
import { Sparkle } from './decor/Sparkle.tsx'

/**
 * Illustrations unDraw (https://undraw.co), recolorées avec les variables du
 * design system par scripts/recolor-undraw.mjs : elles suivent le thème.
 */
const ILLUSTRATIONS = {
  welcome: { svg: welcome, ratio: '782/458' },
  'choose-passions': { svg: choosePassions, ratio: '728/668' },
  'empty-gallery': { svg: emptyGallery, ratio: '551/568' },
  offline: { svg: offline, ratio: '651/800' },
  'open-telegram': { svg: openTelegram, ratio: '881/523' },
} as const

export type IllustrationName = keyof typeof ILLUSTRATIONS

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  const { svg, ratio } = ILLUSTRATIONS[name]
  return <div aria-hidden="true" className={cn('illustration', className)} style={{ aspectRatio: ratio }} dangerouslySetInnerHTML={{ __html: svg }} />
}

/**
 * État vide ou d'erreur : une illustration collée comme un sticker sur une
 * carte penchée, qui flotte ; puis un titre, une phrase et une action.
 * 24 px entre l'illustration et le texte, 8 px entre le titre et la phrase,
 * 24 px avant l'action.
 */
export function EmptyState({
  illustration,
  illustrationClassName = 'w-40',
  title,
  description,
  action,
  className,
}: {
  illustration: IllustrationName
  illustrationClassName?: string
  title: ReactNode
  description: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={cn('flex flex-col items-center text-center', className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="relative">
        <div className="motion-loop anim-float" style={{ '--float-duration': '6s' } as React.CSSProperties}>
          <div className="-rotate-2 rounded-lg border-[2.5px] border-outline bg-surface-200 p-4 shadow-card">
            <Illustration name={illustration} className={illustrationClassName} />
          </div>
        </div>
        <Sparkle size={22} className="motion-loop anim-twinkle absolute -top-3 -right-3" />
        <Sparkle size={16} color="var(--sky)" className="motion-loop anim-twinkle absolute top-1/2 -left-5" style={{ '--twinkle-delay': '-1s' } as React.CSSProperties} />
      </div>
      <h2 className="mt-6 font-display text-30 font-extrabold tracking-tight text-balance text-ink">{title}</h2>
      <p className="mt-2 max-w-xs text-15 text-ink-soft">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  )
}
