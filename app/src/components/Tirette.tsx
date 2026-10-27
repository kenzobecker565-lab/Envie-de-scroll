import { ArrowUp, ChevronUp } from 'lucide-react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from 'motion/react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAppTheme } from '../lib/appTheme.ts'
import { PASSION_COLORS, PASSION_ICONS } from '../lib/icons.ts'
import { haptics } from '../telegram/webApp.ts'
import { ScrollPhone } from './decor/Ornaments.tsx'

const LABEL = 'J’ai envie de scroller'
/** Au-delà de cette distance (px) vers le haut, ou d'un geste vif, la tirette part. */
const PULL_DISTANCE = 90
const PULL_VELOCITY = -550

/**
 * La tirette de l'accueil : tout le bas de l'écran est une grande languette
 * « J'ai envie de scroller ». On la tire vers le haut, comme on scrolle, mais
 * pour créer : elle monte et recouvre l'écran, et le parcours commence. Un
 * simple toucher (ou Entrée au clavier) marche aussi. Sa forme suit le thème :
 * stickers des passions (Pop, Pop Nuit), bulle tramée (BD), bandes et formes
 * géométriques (Memphis).
 */
export function Tirette({ onStart }: { onStart: (how: 'pull' | 'tap') => void }) {
  const theme = useAppTheme()
  const reduced = useReducedMotion()
  const y = useMotionValue(0)
  const [armed, setArmed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const dragged = useRef(false)
  // Les chevrons s'allument à mesure qu'on tire.
  const glow = useTransform(y, [-PULL_DISTANCE, 0], [1, 0.55])

  const launch = (how: 'pull' | 'tap') => {
    if (leaving) return
    setLeaving(true)
    if (reduced) return onStart(how)
    // La languette monte et recouvre l'écran, puis l'activité commence.
    void animate(y, -window.innerHeight, { duration: 0.32, ease: [0.4, 0, 0.2, 1] }).then(() => onStart(how))
  }

  const onDrag = (_: unknown, info: PanInfo) => {
    dragged.current = true
    const ready = info.offset.y < -PULL_DISTANCE
    if (ready !== armed) {
      setArmed(ready)
      if (ready) haptics.impact('medium')
    }
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    // Le « clic » qui suit parfois un geste arrive avant ce délai : il sera ignoré, les suivants non.
    window.setTimeout(() => {
      dragged.current = false
    }, 0)
    if (info.offset.y < -PULL_DISTANCE || info.velocity.y < PULL_VELOCITY) return launch('pull')
    setArmed(false)
    void animate(y, 0, { type: 'spring', stiffness: 420, damping: 32 })
  }

  const bd = theme === 'bd'
  const memphis = theme === 'memphis'

  return (
    // Collée en bas de l'écran : sur un petit téléphone, elle reste visible et
    // passe par-dessus la fin de la carte, qu'on lit en faisant défiler.
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex min-h-[18.5rem] flex-1 flex-col">
      <motion.button
        type="button"
        aria-label={LABEL}
        aria-describedby="tirette-hint"
        drag={leaving ? false : 'y'}
        dragConstraints={{ top: -220, bottom: 0 }}
        dragElastic={{ top: 0.18, bottom: 0.04 }}
        dragMomentum={false}
        onDragStart={() => {
          dragged.current = true
          haptics.selection()
        }}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        onClick={() => {
          // Un geste de tirette se termine parfois par un « clic » : on ne le compte pas deux fois.
          if (!dragged.current) launch('tap')
        }}
        style={{ y, boxShadow: memphis ? undefined : '0 -6px 0 var(--shadow-ink)' }}
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.15 }}
        className={cn(
          'relative z-10 flex flex-1 cursor-grab touch-pan-x flex-col items-center px-6 pt-3 pb-[calc(100px+env(safe-area-inset-bottom))] text-center select-none active:cursor-grabbing',
          'rounded-t-[34px] border-[3px] border-b-0 border-outline',
          bd ? 'bg-surface-200 text-ink' : 'bg-accent text-on-color',
          memphis && 'rounded-t-sm border-[2.5px] border-b-0',
        )}
      >
        {/* La trame de la BD, ou les bandes du Memphis. */}
        {bd && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-t-[31px] opacity-60"
            style={{ backgroundImage: 'radial-gradient(color-mix(in srgb, var(--warm) 70%, transparent) 2.2px, transparent 2.6px)', backgroundSize: '12px 12px' }}
          />
        )}
        {memphis && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-5 border-b-[2.5px] border-outline"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, var(--outline) 0 2px, transparent 2px 8px)' }}
          />
        )}

        {/* La poignée. */}
        <span aria-hidden="true" className={cn('relative h-3.5 w-24 shrink-0 rounded-pill border-[2.5px] bg-paper', bd ? 'border-outline' : 'border-on-color', memphis && 'mt-5')} />

        {/* Les chevrons montent en boucle : on comprend qu'il faut tirer. */}
        <motion.span aria-hidden="true" className="relative mt-4 flex flex-col items-center" style={{ opacity: glow }}>
          <ChevronUp size={26} strokeWidth={3} className="motion-loop anim-nudge-up" />
          <ChevronUp size={26} strokeWidth={3} className="motion-loop anim-nudge-up -mt-3.5 opacity-50" style={{ '--nudge-delay': '0.15s' } as React.CSSProperties} />
        </motion.span>

        <span className="tirette-label relative mt-2 block font-display font-extrabold tracking-tight">
          J’ai envie
          <br />
          de scroller
        </span>
        <span id="tirette-hint" aria-live="polite" className="relative mt-2 text-14 font-bold">
          {armed ? 'Lâche : on s’occupe de toi' : 'Tire vers le haut pour créer à la place'}
        </span>

        {theme === 'pop' || theme === 'nuit' ? <Stickers /> : null}
        {bd && (
          <span aria-hidden="true" className="pointer-events-none absolute -top-9 right-3 flex h-20 w-20 rotate-12 items-center justify-center">
            <svg viewBox="-4 -4 108 108" className="motion-loop anim-spin-slow absolute inset-0" style={{ '--spin-duration': '30s' } as React.CSSProperties}>
              <polygon points={BURST} style={{ fill: 'var(--warm)', stroke: 'var(--outline)', strokeWidth: 3, strokeLinejoin: 'round' }} />
            </svg>
            <ScrollPhone className="relative" />
          </span>
        )}
        {memphis && (
          <>
            <svg aria-hidden="true" width="48" height="44" viewBox="0 0 64 58" className="motion-loop anim-float pointer-events-none absolute top-10 left-5">
              <path d="M32 4 L60 54 L4 54 Z" style={{ fill: 'var(--good)', stroke: 'var(--outline)', strokeWidth: 2.5, strokeLinejoin: 'round' }} />
            </svg>
            <span aria-hidden="true" className="pointer-events-none absolute top-9 right-5 flex h-12 w-12 items-center justify-center rounded-pill border-[2.5px] border-outline bg-sky text-on-color">
              <ArrowUp size={24} strokeWidth={2.8} />
            </span>
          </>
        )}
      </motion.button>
    </div>
  )
}

/** Les stickers des passions, collés sur le bord de la tirette (Pop, Pop Nuit). */
const STICKERS = [
  { id: 'dessin', className: '-top-6 right-7 h-13 w-13', icon: 22, rotate: 12, delay: '0s' },
  { id: 'ecriture', className: '-top-5 left-7 h-11 w-11', icon: 20, rotate: -8, delay: '-0.8s' },
  { id: 'musique', className: 'top-14 right-4 h-10 w-10', icon: 18, rotate: -10, delay: '-1.6s' },
] as const

function Stickers() {
  return (
    <>
      {STICKERS.map((sticker, index) => {
        const Icon = PASSION_ICONS[sticker.id]
        return (
          <motion.span
            key={sticker.id}
            aria-hidden="true"
            className={cn('pointer-events-none absolute', sticker.className)}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: sticker.rotate }}
            transition={{ delay: 0.45 + index * 0.12, type: 'spring', stiffness: 380, damping: 14 }}
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
    </>
  )
}

/** L'étoile d'explosion de la BD (24 pointes). */
const BURST = Array.from({ length: 24 }, (_, index) => {
  const radius = index % 2 === 0 ? 50 : 35
  const angle = (Math.PI * 2 * index) / 24
  return `${(50 + radius * Math.cos(angle)).toFixed(1)},${(50 + radius * Math.sin(angle)).toFixed(1)}`
}).join(' ')
