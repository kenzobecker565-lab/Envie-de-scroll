import { ArrowRight, CalendarHeart, Check } from 'lucide-react'
import { motion } from 'motion/react'
import { CHALLENGE_PASSIONS, challengeId, dailyWord, type ChallengePassion, type PassionId } from '@scroll-up/shared'
import { PRESSED } from '@/components/ui/button'
import { Card, cardVariants } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { plural } from '../lib/format.ts'
import { Sparkle } from './decor/Sparkle.tsx'

/**
 * Le mot du jour : un mot par jour, à dessiner ou à écrire. Ici la carte de
 * l'accueil et la bannière de la confirmation ; l'écran est ChallengeScreen.
 */

/** « 2026-10-01 », dans le fuseau du téléphone (le même que celui envoyé au serveur). */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Les passions du profil qui jouent au mot du jour (Dessin, Écriture). */
export function challengePassions(passions: readonly PassionId[]): ChallengePassion[] {
  return CHALLENGE_PASSIONS.filter((passion) => passions.includes(passion))
}

/** Le mot d'un jour est-il fait (dans au moins une passion) ? */
export function wordDone(day: string, done: readonly string[]): boolean {
  return CHALLENGE_PASSIONS.some((passion) => done.includes(challengeId(passion, day)))
}

/** Un mot en sticker, penché. */
export function WordSticker({ word, size = 'md', tone = 'bg-warm', className }: { word: string; size?: 'md' | 'lg'; tone?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-md border-[2.5px] border-outline font-display font-extrabold tracking-tight text-on-color shadow-chip',
        size === 'lg' ? 'min-h-20 px-6 py-3 text-40 leading-none' : 'min-h-12 px-3 py-1 text-17',
        tone,
        className,
      )}
    >
      {word}
    </span>
  )
}

/** Accueil : le mot du jour, à dessiner ou à écrire. */
export function ChallengeCard({ done, onOpen, delay = 0.2 }: { done: readonly string[]; onOpen: () => void; delay?: number }) {
  const today = todayKey()
  const { word } = dailyWord(today)
  const doneToday = wordDone(today, done)
  const count = new Set(done.map((id) => id.slice(-10))).size
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileTap={PRESSED}
      className={cn(cardVariants(), 'flex-row items-center gap-3 text-left transition-shadow duration-150 active:shadow-press')}
      aria-label={`Le mot du jour : ${word}. ${doneToday ? 'Fait.' : 'À dessiner ou à écrire.'}`}
    >
      <WordSticker word={word} tone={doneToday ? 'bg-good' : 'bg-warm'} className="max-w-[46%] -rotate-3 text-center text-15 leading-tight" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="inline-flex items-center gap-1 text-12 font-bold tracking-wider text-ink-soft uppercase">
          <CalendarHeart size={14} strokeWidth={2.4} aria-hidden="true" />
          Le mot du jour
        </span>
        <span className="text-14 font-bold text-ink">{doneToday ? `Fait ✓ · ${plural(count, 'mot')} ce mois-ci` : 'À dessiner ou à écrire, en 15 min'}</span>
        <span className="inline-flex items-center gap-1 text-14 font-bold text-accent-strong">
          {doneToday ? 'Les mots du mois' : 'J’y vais'}
          <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
        </span>
      </span>
    </motion.button>
  )
}

/** Confirmation : le mot du jour est fait. */
export function ChallengeBanner({ word, count, onOpen }: { word: string; count: number; onOpen: () => void }) {
  return (
    <Card
      tone="warm"
      className="w-full gap-3 text-left shadow-pop"
      initial={{ opacity: 0, scale: 0.7, rotate: 5 }}
      animate={{ opacity: 1, scale: 1, rotate: 1 }}
      transition={{ delay: 1.1, type: 'spring', stiffness: 260, damping: 15 }}
      role="status"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 -rotate-6 items-center justify-center rounded-pill border-[2.5px] border-on-color bg-paper text-on-color">
          <Check size={26} strokeWidth={3} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-12 font-bold tracking-wider uppercase">Le mot du jour</span>
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">«&nbsp;{word}&nbsp;», c’est fait&nbsp;!</span>
        </span>
      </span>
      <span className="text-14 font-semibold">{plural(count, 'mot')} ce mois-ci. Les mots passés se rattrapent quand tu veux.</span>
      <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 self-start text-14 font-extrabold underline decoration-2 underline-offset-4">
        Les mots du mois
        <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <Sparkle size={24} color="var(--surface-200)" className="motion-loop anim-twinkle absolute top-2 right-3" />
    </Card>
  )
}
