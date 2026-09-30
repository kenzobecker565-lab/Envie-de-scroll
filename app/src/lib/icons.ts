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
import type { MoodId, PassionId } from '@pqs/shared'

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
