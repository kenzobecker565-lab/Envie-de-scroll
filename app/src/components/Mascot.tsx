import { motion } from 'motion/react'
import { useEquipped } from '../lib/shop.ts'
import { cn } from '@/lib/utils'

/**
 * Minuton, la mascotte : le jeton-chrono de l'app, avec une bouille. Il
 * accueille sur l'accueil, réfléchit avec toi quand tu bloques, et fait la
 * fête à chaque création. Dessiné en SVG avec les couleurs du thème
 * (soleil, encre) : il change d'habit avec le thème.
 *
 * Humeurs : `happy` (sourire), `cheer` (bras en l'air, yeux plissés de joie),
 * `wink` (clin d'œil), `think` (regarde en l'air, main au menton), `sleepy`
 * (tard le soir).
 */
export type MascotMood = 'happy' | 'cheer' | 'wink' | 'think' | 'sleepy'

const INK = { stroke: 'var(--on-color)', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }

export function Mascot({ mood = 'happy', size = 64, className, animated = true, accessory }: { accessory?: string; mood?: MascotMood; size?: number; className?: string; animated?: boolean }) {
  const equipped = useEquipped('mascot')
  const outfit = accessory ?? equipped?.id
  const arms = ARMS[mood]
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" aria-hidden="true" className={cn('shrink-0 overflow-visible', className)}>
      {/* Jambes. */}
      <path d="M40 92 L37 104 M60 92 L63 104" style={{ ...INK, strokeWidth: 5 }} />
      <path d="M31 104 h9 M60 104 h9" style={{ ...INK, strokeWidth: 6 }} />
      {/* Bras (derrière le corps). */}
      <g className={cn(animated && mood === 'cheer' && 'motion-loop anim-mascot-wave')} style={{ transformOrigin: '22px 60px' }}>
        <path d={arms.left} style={{ ...INK, strokeWidth: 5 }} />
      </g>
      <g className={cn(animated && mood === 'cheer' && 'motion-loop anim-mascot-wave-right')} style={{ transformOrigin: '78px 60px' }}>
        <path d={arms.right} style={{ ...INK, strokeWidth: 5 }} />
      </g>
      {/* Le remontoir et le petit bouton du chrono. */}
      <rect x="42" y="4" width="16" height="9" rx="3" style={{ fill: 'var(--on-color)' }} />
      <rect x="47" y="11" width="6" height="6" style={{ fill: 'var(--on-color)' }} />
      <path d="M76 22 l6 -6" style={{ ...INK, strokeWidth: 5 }} />
      {/* Le corps-cadran. */}
      <circle cx="50" cy="56" r="37" style={{ fill: 'var(--warm)', stroke: 'var(--on-color)', strokeWidth: 4 }} />
      {/* Reflet. */}
      <path d="M26 42 a28 28 0 0 1 14 -14" style={{ ...INK, stroke: 'var(--paper)', strokeWidth: 4, opacity: 0.8 }} />
      {/* Graduations : midi, 3 h, 6 h, 9 h. */}
      <path d="M50 22 v5 M84 56 h-5 M50 90 v-5 M16 56 h5" style={{ ...INK, strokeWidth: 3 }} />
      {/* Joues. */}
      <ellipse cx="31" cy="66" rx="6" ry="4" style={{ fill: 'var(--accent)', opacity: 0.55 }} />
      <ellipse cx="69" cy="66" rx="6" ry="4" style={{ fill: 'var(--accent)', opacity: 0.55 }} />
      <Face mood={mood} animated={animated} />
      {outfit === 'mascot-beret' && <g><ellipse cx="47" cy="20" rx="31" ry="11" transform="rotate(-12 47 20)" fill="#6B4585" stroke="var(--on-color)" strokeWidth="3" /><path d="M45 12 l3 -7" stroke="var(--on-color)" strokeWidth="4" /></g>}
      {outfit === 'mascot-casque' && <g fill="#8BB7EF" stroke="var(--on-color)" strokeWidth="3"><path d="M14 55 C10 2 90 2 86 55" fill="none" strokeWidth="6" /><rect x="8" y="45" width="13" height="23" rx="5" /><rect x="79" y="45" width="13" height="23" rx="5" /></g>}
      {mood === 'sleepy' && (
        <g className={cn(animated && 'motion-loop anim-twinkle')} style={{ fill: 'var(--on-color)', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          <text x="84" y="20" fontSize="14">
            z
          </text>
          <text x="94" y="8" fontSize="10">
            z
          </text>
        </g>
      )}
    </svg>
  )
}

const ARMS: Record<MascotMood, { left: string; right: string }> = {
  happy: { left: 'M18 60 Q8 66 10 78', right: 'M82 60 Q92 66 90 78' },
  cheer: { left: 'M18 52 Q6 40 10 26', right: 'M82 52 Q94 40 90 26' },
  wink: { left: 'M18 60 Q8 66 10 78', right: 'M82 58 Q96 50 92 36' },
  think: { left: 'M18 60 Q8 66 10 78', right: 'M80 66 Q70 84 58 76' },
  sleepy: { left: 'M18 62 Q10 72 14 82', right: 'M82 62 Q90 72 86 82' },
}

function Face({ mood, animated }: { mood: MascotMood; animated: boolean }) {
  const ink = { fill: 'var(--on-color)' }
  const blink = cn(animated && 'motion-loop anim-blink')
  switch (mood) {
    case 'cheer':
      return (
        <>
          <path d="M33 52 q5 -7 10 0 M57 52 q5 -7 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <path d="M38 62 h24 q0 14 -12 14 q-12 0 -12 -14 z" style={{ ...ink, stroke: 'var(--on-color)', strokeWidth: 3, strokeLinejoin: 'round' }} />
          <path d="M44 71 q6 4 12 0" style={{ fill: 'var(--accent)' }} />
        </>
      )
    case 'wink':
      return (
        <>
          <ellipse cx="38" cy="52" rx="4.5" ry="6" style={ink} className={blink} />
          <path d="M57 53 q5 -5 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <path d="M39 66 q11 10 22 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
    case 'think':
      return (
        <>
          <ellipse cx="40" cy="50" rx="4.5" ry="6" style={ink} />
          <ellipse cx="62" cy="50" rx="4.5" ry="6" style={ink} />
          <circle cx="41.5" cy="47" r="1.6" style={{ fill: 'var(--paper)' }} />
          <circle cx="63.5" cy="47" r="1.6" style={{ fill: 'var(--paper)' }} />
          <path d="M43 69 q7 -3 14 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
    case 'sleepy':
      return (
        <>
          <path d="M33 54 q5 4 10 0 M57 54 q5 4 10 0" style={{ ...INK, strokeWidth: 4 }} />
          <ellipse cx="50" cy="69" rx="4" ry="4.5" style={ink} />
        </>
      )
    default:
      return (
        <>
          <g className={blink} style={{ transformOrigin: '50px 52px' }}>
            <ellipse cx="38" cy="52" rx="4.5" ry="6" style={ink} />
            <ellipse cx="62" cy="52" rx="4.5" ry="6" style={ink} />
            <circle cx="39.5" cy="49.5" r="1.6" style={{ fill: 'var(--paper)' }} />
            <circle cx="63.5" cy="49.5" r="1.6" style={{ fill: 'var(--paper)' }} />
          </g>
          <path d="M39 65 q11 10 22 0" style={{ ...INK, strokeWidth: 4 }} />
        </>
      )
  }
}

/** Minuton qui parle : la mascotte et sa bulle. */
export function MascotSays({ mood = 'happy', children, size = 56, className, delay = 0.2 }: { mood?: MascotMood; children: React.ReactNode; size?: number; className?: string; delay?: number }) {
  return (
    <div className={cn('flex items-end gap-2', className)}>
      <motion.span
        className="motion-loop anim-float shrink-0"
        style={{ '--float-duration': '3.6s' } as React.CSSProperties}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay, type: 'spring', stiffness: 300, damping: 14 }}
      >
        <Mascot mood={mood} size={size} />
      </motion.span>
      <motion.p
        className="relative mb-4 rounded-md border-[2.5px] border-outline bg-card px-3 py-2 text-15 font-semibold text-ink shadow-chip"
        initial={{ opacity: 0, x: -8, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: delay + 0.15, type: 'spring', stiffness: 260, damping: 18 }}
      >
        {/* La pointe de la bulle, vers Minuton. */}
        <span aria-hidden="true" className="absolute bottom-3 -left-[9px] h-4 w-4 rotate-45 border-b-[2.5px] border-l-[2.5px] border-outline bg-card" />
        <span className="relative">{children}</span>
      </motion.p>
    </div>
  )
}
