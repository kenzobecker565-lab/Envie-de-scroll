import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { PRESSED } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAppTheme } from '../lib/appTheme.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { ScrollPhone } from './decor/Ornaments.tsx'

const LABEL = 'J’ai envie de scroller'

/** Les stickers des passions, collés autour du gros bouton (Pop, Pop Nuit). */
const STICKERS = [
  { id: 'dessin', className: '-top-5 right-6 h-14 w-14', icon: 24, rotate: 12, delay: '0s' },
  { id: 'musique', className: 'top-24 -right-3 h-12 w-12', icon: 22, rotate: -10, delay: '-1.6s' },
  { id: 'ecriture', className: '-top-4 left-28 h-11 w-11', icon: 20, rotate: 8, delay: '-0.8s' },
] as const

const ENTER = {
  initial: { opacity: 0, scale: 0.9, rotate: -6 },
  transition: { type: 'spring', stiffness: 320, damping: 18 },
} as const

/**
 * Le gros bouton « J'ai envie de scroller », dans la forme de chaque thème :
 * un bloc penché entouré de stickers (Pop, Pop Nuit), une bulle de bande
 * dessinée (BD), un bloc à ombre rayée et formes géométriques (Memphis).
 */
export function HomeCta({ onStart }: { onStart: () => void }) {
  const theme = useAppTheme()
  if (theme === 'bd') return <BubbleCta onStart={onStart} />
  if (theme === 'memphis') return <MemphisCta onStart={onStart} />
  return <StickerCta onStart={onStart} />
}

function StickerCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mt-8 mb-6">
      <motion.button
        type="button"
        onClick={onStart}
        {...ENTER}
        animate={{ opacity: 1, scale: 1, rotate: -1.5 }}
        whileTap={PRESSED}
        className="relative flex h-72 w-full flex-col items-start justify-between rounded-[28px] border-[3px] border-outline bg-accent p-6 text-left text-on-color shadow-pop transition-shadow duration-150 active:shadow-press"
      >
        <span className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-md border-[2.5px] border-on-color bg-paper">
          <ScrollPhone />
        </span>
        <span className="flex w-full items-end justify-between gap-4">
          <span className="max-w-[230px] font-display text-46 font-extrabold tracking-tight">{LABEL}</span>
          <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color">
            <ArrowRight size={26} strokeWidth={2.8} />
          </span>
        </span>
      </motion.button>
      {STICKERS.map((sticker, index) => {
        const Icon = PASSION_ICONS[sticker.id]
        return (
          <motion.span
            key={sticker.id}
            aria-hidden="true"
            className={cn('pointer-events-none absolute', sticker.className)}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: sticker.rotate }}
            transition={{ delay: 0.35 + index * 0.12, type: 'spring', stiffness: 380, damping: 14 }}
          >
            <span
              className={cn('motion-loop anim-float flex h-full w-full items-center justify-center rounded-pill border-[2.5px] border-outline', PASSION_COLORS[sticker.id].bg)}
              style={{ '--float-duration': `${3.5 + index}s`, '--float-delay': sticker.delay } as React.CSSProperties}
            >
              <Icon size={sticker.icon} strokeWidth={2.3} className="text-on-color" />
            </span>
          </motion.span>
        )
      })}
    </div>
  )
}

/** Étoile d'explosion de bande dessinée, cernée d'encre. */
function Burst({ className, children }: { className?: string; children: React.ReactNode }) {
  const points = Array.from({ length: 24 }, (_, index) => {
    const radius = index % 2 === 0 ? 50 : 35
    const angle = (Math.PI * 2 * index) / 24
    return `${(50 + radius * Math.cos(angle)).toFixed(1)},${(50 + radius * Math.sin(angle)).toFixed(1)}`
  }).join(' ')
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute flex items-center justify-center', className)}>
      <svg viewBox="-4 -4 108 108" className="motion-loop anim-spin-slow absolute inset-0" style={{ '--spin-duration': '30s' } as React.CSSProperties}>
        <polygon points={points} style={{ fill: 'var(--warm)', stroke: 'var(--outline)', strokeWidth: 3, strokeLinejoin: 'round' }} />
      </svg>
      <span className="relative">{children}</span>
    </span>
  )
}

function BubbleCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mt-10 mb-12">
      <motion.button
        type="button"
        onClick={onStart}
        {...ENTER}
        animate={{ opacity: 1, scale: 1, rotate: -2 }}
        whileTap={PRESSED}
        className="relative flex h-64 w-full flex-col items-center justify-center gap-4 rounded-[50%] border-[3px] border-outline bg-surface-200 px-10 text-center text-ink shadow-pop transition-shadow duration-150 active:shadow-press"
      >
        <span className="max-w-[250px] font-display text-46 leading-[0.92]">{LABEL}</span>
        <span aria-hidden="true" className="flex h-13 w-13 items-center justify-center rounded-pill border-[3px] border-outline bg-accent text-on-color">
          <ArrowRight size={24} strokeWidth={3} />
        </span>
      </motion.button>
      {/* La pointe de la bulle. */}
      <svg aria-hidden="true" width="54" height="56" viewBox="0 0 54 56" className="pointer-events-none absolute -bottom-11 left-16 -rotate-2">
        <path d="M4 0 L10 52 L46 4" style={{ fill: 'var(--surface-200)', stroke: 'var(--outline)', strokeWidth: 3, strokeLinejoin: 'round' }} />
      </svg>
      <Burst className="-top-9 -right-2 h-24 w-24 rotate-12">
        <ScrollPhone />
      </Burst>
    </div>
  )
}

function MemphisCta({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative mt-12 mb-8 mr-2">
      {/* L'ombre rayée, décalée. */}
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-x-[9px] translate-y-[9px] rounded-sm border-[2.5px] border-outline"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--outline) 0 2px, transparent 2px 7px)' }}
      />
      <motion.button
        type="button"
        onClick={onStart}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ x: 6, y: 6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        className="relative flex h-68 w-full flex-col items-start justify-end rounded-sm border-[2.5px] border-outline bg-accent p-6 text-left text-on-color"
      >
        <span className="max-w-[230px] font-display text-46 font-extrabold">{LABEL}</span>
      </motion.button>
      <span aria-hidden="true" className="pointer-events-none absolute -top-8 -right-3 flex h-24 w-24 items-center justify-center rounded-pill border-[2.5px] border-outline bg-warm">
        <ScrollPhone />
      </span>
      <svg aria-hidden="true" width="64" height="58" viewBox="0 0 64 58" className="motion-loop anim-float pointer-events-none absolute top-6 left-6">
        <path d="M32 4 L60 54 L4 54 Z" style={{ fill: 'var(--good)', stroke: 'var(--outline)', strokeWidth: 2.5, strokeLinejoin: 'round' }} />
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-10 left-26 h-16 w-16 rounded-pill"
        style={{ backgroundImage: 'radial-gradient(var(--outline) 1.8px, transparent 2.2px)', backgroundSize: '9px 9px' }}
      />
      <span aria-hidden="true" className="pointer-events-none absolute right-5 bottom-5 flex h-14 w-14 items-center justify-center rounded-pill border-[2.5px] border-outline bg-sky text-on-color">
        <ArrowRight size={26} strokeWidth={2.8} />
      </span>
    </div>
  )
}
