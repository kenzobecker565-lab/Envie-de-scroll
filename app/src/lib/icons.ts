/** Une icône Lucide par passion et par mood. */

import {
  Clapperboard,
  CloudLightning,
  Coffee,
  Feather,
  Flame,
  Headphones,
  Hourglass,
  MoonStar,
  Pencil,
  Rocket,
  Snail,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { MoodId, PassionId } from '@scroll-up/shared'

export const PASSION_ICONS: Record<PassionId, LucideIcon> = {
  dessin: Pencil,
  ecriture: Feather,
  musique: Headphones,
  cinema: Clapperboard,
}

export const MOOD_ICONS: Record<MoodId, LucideIcon> = {
  ennui: Hourglass,
  souffler: Wind,
  'pause-travail': Coffee,
  fatigue: MoonStar,
  stress: CloudLightning,
  frustration: Flame,
  procrastination: Snail,
  'trop-energie': Rocket,
}

/**
 * Couleur de sticker de chaque passion (classes Tailwind écrites en entier,
 * pour que Tailwind les trouve) : fond, fond une fois choisie, fond doux, pastille.
 */
export const PASSION_COLORS: Record<PassionId, { bg: string; on: string; soft: string; badge: 'sky' | 'lilac' | 'good' | 'warm' }> = {
  dessin: { bg: 'bg-sky', on: 'data-[state=on]:bg-sky', soft: 'bg-sky-soft', badge: 'sky' },
  ecriture: { bg: 'bg-lilac', on: 'data-[state=on]:bg-lilac', soft: 'bg-lilac-soft', badge: 'lilac' },
  musique: { bg: 'bg-good', on: 'data-[state=on]:bg-good', soft: 'bg-good-soft', badge: 'good' },
  cinema: { bg: 'bg-warm', on: 'data-[state=on]:bg-warm', soft: 'bg-warm-soft', badge: 'warm' },
}
