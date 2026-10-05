/** Une icône Lucide par passion et par mood. */

import {
  Dumbbell,
  Search,
  BookOpen,
  Clapperboard,
  CloudLightning,
  Coffee,
  Feather,
  Flame,
  Headphones,
  Hourglass,
  Moon,
  MoonStar,
  Pencil,
  Piano,
  Rocket,
  Snail,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import type { MoodId, PassionId, ScrollMoment } from '@scroll-up/shared'

export const PASSION_ICONS: Record<PassionId, LucideIcon> = {
 sport: Dumbbell, rythme: Headphones, logique: Search, francais: BookOpen,
  dessin: Pencil,
  ecriture: Feather,
  musique: Headphones,
  cinema: Clapperboard,
  piano: Piano,
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
 * pour que Tailwind les trouve) : fond, fond une fois choisie, fond doux,
 * pastille (variante de Badge) et carte (ton de Card).
 */
export const PASSION_COLORS: Record<
  PassionId,
  { bg: string; on: string; soft: string; badge: 'sky' | 'lilac' | 'good' | 'warm' | 'default'; card: 'sky' | 'lilac' | 'good' | 'warm' | 'accent' }
> = {
 sport: { bg: 'bg-good', on: 'data-[state=on]:bg-good', soft: 'bg-good-soft', badge: 'good', card: 'good' }, rythme: { bg: 'bg-good', on: 'data-[state=on]:bg-good', soft: 'bg-good-soft', badge: 'good', card: 'good' }, logique: { bg: 'bg-warm', on: 'data-[state=on]:bg-warm', soft: 'bg-warm-soft', badge: 'warm', card: 'warm' }, francais: { bg: 'bg-lilac', on: 'data-[state=on]:bg-lilac', soft: 'bg-lilac-soft', badge: 'lilac', card: 'lilac' },
  dessin: { bg: 'bg-sky', on: 'data-[state=on]:bg-sky', soft: 'bg-sky-soft', badge: 'sky', card: 'sky' },
  ecriture: { bg: 'bg-lilac', on: 'data-[state=on]:bg-lilac', soft: 'bg-lilac-soft', badge: 'lilac', card: 'lilac' },
  musique: { bg: 'bg-good', on: 'data-[state=on]:bg-good', soft: 'bg-good-soft', badge: 'good', card: 'good' },
  cinema: { bg: 'bg-warm', on: 'data-[state=on]:bg-warm', soft: 'bg-warm-soft', badge: 'warm', card: 'warm' },
  piano: { bg: 'bg-accent', on: 'data-[state=on]:bg-accent', soft: 'bg-accent-soft', badge: 'default', card: 'accent' },
}

/** Le moment où l'on scrolle le plus : une icône et une couleur de sticker (fond, fond une fois choisi). */
export const MOMENT_STYLE: Record<ScrollMoment, { icon: LucideIcon; bg: string; on: string }> = {
  matin: { icon: Sunrise, bg: 'bg-warm', on: 'data-[state=on]:bg-warm' },
  midi: { icon: Sun, bg: 'bg-sky', on: 'data-[state=on]:bg-sky' },
  soir: { icon: Sunset, bg: 'bg-accent', on: 'data-[state=on]:bg-accent' },
  nuit: { icon: Moon, bg: 'bg-lilac', on: 'data-[state=on]:bg-lilac' },
}
