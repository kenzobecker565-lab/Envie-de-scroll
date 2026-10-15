import { BrandMark } from './Brand.tsx'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { formatNumber } from '../lib/format.ts'

/**
 * Un minuton, la monnaie de l'app (1 minute = 1 minuton) : un petit chrono
 * soleil cerné d'encre, aiguilles sur la minute.
 */
export function CoinIcon({ size = 20, className }: { size?: number; className?: string }) {
  return <span className={cn('inline-flex shrink-0',className)}><BrandMark size={size}/></span>
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

/** Un chiffre du compteur, qui roule jusqu'à sa valeur. */
function Digit({ digit, dim, tone }: { digit: number; dim: boolean; tone: 'ink' | 'good' }) {
  return (
    <span
      className={cn(
        'relative inline-block h-11 w-8 overflow-hidden rounded-[8px] border-2 border-outline bg-surface-200 text-center font-numbers text-21 font-extrabold tabular-nums',
        dim ? 'text-ink-faint' : tone === 'good' ? 'text-good-ink' : 'text-ink',
        'transition-colors duration-500',
      )}
    >
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: -digit * 40 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18, mass: 0.9 }}
      >
        {DIGITS.map((value) => (
          <span key={value} className="block h-10 leading-10">
            {value}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/**
 * Compteur de minutons « à rouleaux ». Les zéros de tête sont estompés :
 * le compteur a l'air d'un vrai compteur, sans jamais afficher un gros zéro.
 */
export function CoinCounter({ value, tone = 'ink', minDigits = 4, className }: { value: number; tone?: 'ink' | 'good'; minDigits?: number; className?: string }) {
  const text = String(Math.max(0, Math.floor(value))).padStart(minDigits, '0')
  const significant = text.length - String(Math.max(0, Math.floor(value))).length
  return (
    <span className={cn('inline-flex items-center gap-1', className)} role="img" aria-label={`${formatNumber(value)} minutons`}>
      {text.split('').map((char, index) => (
        <Digit key={text.length - index} digit={Number(char)} dim={index < significant} tone={tone} />
      ))}
    </span>
  )
}
