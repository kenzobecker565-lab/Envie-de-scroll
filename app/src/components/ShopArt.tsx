import { Disc3, Flower2, Headphones, Leaf, NotebookPen, Orbit, Palette, Piano, Skull, Sparkles, Star, Sunset, type LucideIcon } from 'lucide-react'
import type { ShopItem } from '@scroll-up/shared'
const ART: Record<string, LucideIcon> = { 'ambiance-aube': Sunset, 'ambiance-orbite': Orbit, 'piano-lanterne': Piano, 'piano-constellation': Sparkles, 'piano-davy-jones': Skull, 'theme-crepuscule': Sunset, 'theme-jardin': Leaf, 'mascot-beret': Palette, 'mascot-casque': Headphones, 'cover-carnet': NotebookPen, 'cover-vinyle': Disc3, 'profile-etoiles': Star, 'profile-fleurs': Flower2, 'palette-pastel': Palette, 'palette-vintage': Palette }
export function ShopSymbol({ item, size = 48 }: { item: ShopItem; size?: number }) {
  const Icon = ART[item.id] ?? Sparkles
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}
