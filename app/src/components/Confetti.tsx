import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'

const COLORS = ['var(--accent)', 'var(--warm)', 'var(--good)', 'var(--sky)', 'var(--lilac)']

/** Petite gerbe de confettis, discrète (rien si les animations sont réduites). */
export function Confetti({ count = 26 }: { count?: number }) {
  const reduced = useReducedMotion()
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + Math.random() * 0.4
        const distance = 70 + Math.random() * 90
        return {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          rotate: Math.random() * 540 - 270,
          color: COLORS[index % COLORS.length],
          round: index % 3 === 0,
          delay: Math.random() * 0.12,
        }
      }),
    [count],
  )
  if (reduced) return null

  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 h-0 w-0">
      {pieces.map((piece, index) => (
        <motion.span
          key={index}
          className={piece.round ? 'absolute h-2.5 w-2.5 rounded-pill border-[1.5px] border-outline' : 'absolute h-3.5 w-2 rounded-[2px] border-[1.5px] border-outline'}
          style={{ backgroundColor: piece.color }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
          animate={{ x: piece.x, y: [0, piece.y, piece.y + 90], opacity: [1, 1, 0], rotate: piece.rotate, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: piece.delay, times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  )
}
