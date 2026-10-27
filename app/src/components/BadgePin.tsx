import { BookOpen, Clapperboard, Ear, Eye, Feather, Globe, Hand, Lock, Music, Piano, Popcorn, ScanFace, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import { getPath, PATHS, type PassionId } from '@scroll-up/shared'
import { cn } from '@/lib/utils'

/**
 * Les badges des parcours, dessinés comme des pins émaillés : un liseré doré,
 * l'émail à la couleur de la passion, une icône, et un reflet. Rond pour un
 * parcours débutant, en écusson pour un parcours confirmé. Pas encore gagné :
 * une silhouette en pointillés, avec un cadenas.
 */

const ICONS: Record<string, LucideIcon> = {
  'premiers-traits': Eye,
  visages: ScanFace,
  'premieres-pages': Feather,
  nouvelle: BookOpen,
  'oreille-curieuse': Ear,
  'voyage-musical': Globe,
  'regard-curieux': Popcorn,
  'oeil-de-cineaste': Clapperboard,
  'premieres-touches': Hand,
  'premiers-morceaux': Music,
  'jouer-pour-de-vrai': Piano,
}

const ENAMEL: Record<PassionId, string> = { sport: 'var(--good)', rythme: 'var(--good)', logique: 'var(--warm)', francais: 'var(--lilac)', dessin: 'var(--sky)', ecriture: 'var(--lilac)', musique: 'var(--good)', cinema: 'var(--accent)', piano: 'var(--warm)' }

/** Le contour : un rond (débutant), un écusson (confirmé) ou un hexagone (avancé), dans un carré de 100. */
const SHAPES = {
  1: { outer: 'M50 4 a46 46 0 1 1 0 92 a46 46 0 1 1 0 -92 z', inner: 'M50 15 a35 35 0 1 1 0 70 a35 35 0 1 1 0 -70 z' },
  2: {
    outer: 'M50 3 L90 16 Q92 60 50 97 Q8 60 10 16 Z',
    inner: 'M50 14 L80 24 Q81 57 50 85 Q19 57 20 24 Z',
  },
  3: {
    outer: 'M50 3 L90.7 26.5 L90.7 73.5 L50 97 L9.3 73.5 L9.3 26.5 Z',
    inner: 'M50 14 L81.2 32 L81.2 68 L50 86 L18.8 68 L18.8 32 Z',
  },
} as const

export function BadgePin({ pathId, earned, size = 72, className, animate = false }: { pathId: string; earned: boolean; size?: number; className?: string; animate?: boolean }) {
  const path = getPath(pathId)
  if (!path) return null
  const shape = SHAPES[path.tier]
  const Icon = earned ? (ICONS[pathId] ?? Eye) : Lock
  return (
    <motion.span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      initial={animate ? { scale: 0, rotate: -30 } : false}
      animate={animate ? { scale: 1, rotate: 0 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 12 }}
      role="img"
      aria-label={earned ? `Badge ${path.badge}` : `Badge ${path.badge}, pas encore gagné`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {earned ? (
          <>
            {/* Ombre pleine décalée, comme les autres stickers. */}
            <path d={shape.outer} transform="translate(4 4)" style={{ fill: 'var(--shadow-ink)' }} />
            {/* Liseré doré, puis l'émail. */}
            <path d={shape.outer} style={{ fill: '#F2C14E', stroke: 'var(--outline)', strokeWidth: 3.5, strokeLinejoin: 'round' }} />
            <path d={shape.outer} style={{ fill: 'none', stroke: '#FFE7A3', strokeWidth: 2, strokeDasharray: '2 7', opacity: 0.9 }} transform="translate(50 50) scale(0.9) translate(-50 -50)" />
            <path d={shape.inner} style={{ fill: ENAMEL[path.passion], stroke: '#9A6B00', strokeWidth: 3, strokeLinejoin: 'round' }} />
            {/* Reflet de l'émail. */}
            <path d="M30 34 Q36 22 50 20" style={{ fill: 'none', stroke: '#FFFFFF', strokeWidth: 5, strokeLinecap: 'round', opacity: 0.55 }} />
          </>
        ) : (
          <path d={shape.outer} style={{ fill: 'none', stroke: 'var(--ink-faint)', strokeWidth: 3, strokeDasharray: '7 6', strokeLinejoin: 'round' }} />
        )}
      </svg>
      <Icon
        aria-hidden="true"
        className={cn('relative', earned ? 'text-on-color' : 'text-ink-faint')}
        style={{ width: size * (earned ? 0.36 : 0.28), height: size * (earned ? 0.36 : 0.28), marginTop: path.tier === 2 ? -size * 0.04 : 0 }}
        strokeWidth={2.4}
      />
    </motion.span>
  )
}

/** La vitrine : les 8 badges, gagnés en couleur, les autres en silhouette. */
export function BadgeShelf({ finished }: { finished: readonly string[] }) {
  const badges = PATHS.filter((path) => finished.includes(path.id))
  const earned = badges.length
  if (!earned) return null
  return (
    <section className="mt-8 flex flex-col gap-3" aria-labelledby="badges-title">
      <h2 id="badges-title" className="flex items-baseline justify-between gap-2">
        <span className="font-display text-26 font-extrabold tracking-tight text-ink">Tes badges</span>
        <span className="font-numbers text-15 font-extrabold text-ink-soft">
          {earned} conservés
        </span>
      </h2>
      <div className="grid grid-cols-4 gap-x-2 gap-y-4 rounded-lg border-[2.5px] border-outline bg-surface-100 p-4 shadow-card">
        {badges.map((path, index) => {
          const has = finished.includes(path.id)
          return (
            <motion.div
              key={path.id}
              className="flex flex-col items-center gap-1 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, rotate: has ? (index % 2 ? 4 : -4) : 0 }}
              transition={{ delay: 0.05 * index }}
            >
              <BadgePin pathId={path.id} earned={has} size={58} />
              <span className={cn('text-11 leading-tight font-bold', has ? 'text-ink' : 'text-ink-faint')}>{path.badge}</span>
            </motion.div>
          )
        })}
      </div>
      <p className="text-13 text-ink-soft">Tes badges des premiers parcours restent acquis. Retrouve les nouvelles leçons dans Apprendre.</p>
    </section>
  )
}
