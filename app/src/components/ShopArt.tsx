import { Disc3, Flower2, Headphones, Leaf, NotebookPen, Orbit, Palette, Piano, Skull, Sparkles, Star, Sunset, type LucideIcon } from 'lucide-react'
import type { ShopItem } from '@scroll-up/shared'
import { cn } from '@/lib/utils'
import { BrandMark } from './Brand.tsx'
import { Mascot } from './Mascot.tsx'

const ART: Record<string, LucideIcon> = { 'ambiance-aube': Sunset, 'ambiance-orbite': Orbit, 'piano-lanterne': Piano, 'piano-constellation': Sparkles, 'piano-davy-jones': Skull, 'theme-crepuscule': Sunset, 'theme-jardin': Leaf, 'mascot-beret': Palette, 'mascot-casque': Headphones, 'cover-carnet': NotebookPen, 'cover-vinyle': Disc3, 'profile-etoiles': Star, 'profile-fleurs': Flower2, 'palette-pastel': Palette, 'palette-vintage': Palette }
export function ShopSymbol({ item, size = 48 }: { item: ShopItem; size?: number }) {
  const Icon = ART[item.id] ?? Sparkles
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />
}

/** Le même dessin de couverture sur les projets et dans leur aperçu. */
export function ProjectCoverArtwork({ item, icon: Icon = NotebookPen }: { item: ShopItem; icon?: LucideIcon }) {
  return <span data-cover-id={item.id} aria-label={item.title} className="relative flex h-full w-full items-center justify-center overflow-hidden" style={{ background: item.id === 'cover-carnet' ? `repeating-linear-gradient(135deg, ${item.colors[0]} 0 10px, ${item.colors[1]} 10px 20px, ${item.colors[2]} 20px 30px)` : item.colors[0], color: '#292329' }}>
    {item.id === 'cover-vinyle' ? <svg viewBox="0 0 100 100" className="h-[82%] w-[82%]" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#2C2640" />{[35,29,23].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#5D5375" strokeWidth="1.5" />)}<circle cx="50" cy="50" r="14" fill="#EDBD8E" /><circle cx="50" cy="50" r="4" fill="#2C2640" /></svg> : <><span className="absolute inset-y-0 left-0 w-[12%] border-r-2 border-[#292329] bg-[#fffdf7]/60" /><span className="flex h-[54%] w-[54%] items-center justify-center rounded-sm border-2 border-[#292329] bg-[#fffdf7]"><Icon size={26} strokeWidth={2} /></span></>}
  </span>
}

export function ProfileDecoration({ item, compact = false }: { item?: ShopItem; compact?: boolean }) {
  return <div className={cn('flex items-center justify-center rounded-md border-[2.5px] border-outline text-on-color shadow-chip', compact ? 'gap-2 p-2' : 'gap-4 p-4')} style={{ background: item ? `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})` : 'var(--surface-200)' }}>
    {item && <ShopSymbol item={item} size={compact ? 20 : 32} />}<Mascot mood="wink" size={compact ? 52 : 72} />{item && <ShopSymbol item={item} size={compact ? 20 : 32} />}
  </div>
}

export function ShopPreview({ item, detail = false }: { item: ShopItem; detail?: boolean }) {
  const gradient = `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]})`
  return <div aria-label={`Aperçu : ${item.title}`} className={cn('relative flex items-center justify-center overflow-hidden text-on-color', detail ? 'min-h-52 rounded-md border-2 border-outline p-5' : 'h-36 p-3')} style={{ background: gradient }}>
    <span className="absolute -top-7 -right-5 h-28 w-28 rounded-pill border-2 border-[#292329]/10 bg-[#fffdf7]/20" aria-hidden="true" />
    <span className="absolute -bottom-10 -left-7 h-28 w-28 rounded-pill border-2 border-[#292329]/10" aria-hidden="true" />
    {item.category === 'cover' ? detail ? <div className="relative flex w-full max-w-72 items-center gap-3 rounded-md border-[2.5px] border-[#292329] bg-[#fffdf7] p-3 text-[#292329] shadow-chip"><span className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 border-[#292329]"><ProjectCoverArtwork item={item} /></span><span className="min-w-0"><span className="block text-11 font-bold uppercase">Exemple de projet</span><span className="block font-display text-17 font-extrabold">Mon carnet créatif</span><span className="mt-2 block h-2 w-24 rounded-pill bg-[#EADFC8]"><span className="block h-full w-1/2 rounded-pill bg-[#FFA995]" /></span></span></div> : <span className="relative h-24 w-24 rotate-[-6deg] overflow-hidden rounded-sm border-[2.5px] border-[#292329] shadow-card"><ProjectCoverArtwork item={item} /></span>
      : item.category === 'mascot' ? <span className="relative"><Mascot mood="wink" size={detail ? 110 : 88} accessory={item.id} /></span>
      : item.category === 'profile' ? <span className="relative"><ProfileDecoration item={item} compact={!detail} /></span>
      : item.category === 'theme' ? <div className="relative flex h-28 w-36 rotate-[-4deg] flex-col gap-2 rounded-md border-[2.5px] border-[#292329] p-3 shadow-card" style={{ background: item.colors[0], color: '#292329' }}><span className="flex items-center justify-between"><BrandMark size={22} /><span className="h-3 w-12 rounded-pill" style={{ background: item.colors[1] }} /></span><span className="font-display text-17 font-extrabold">Ta pause créative</span><span className="flex gap-2"><span className="h-5 w-14 rounded-sm border border-[#292329]" style={{ background: item.colors[1] }} /><span className="h-5 w-10 rounded-sm border border-[#292329]" style={{ background: item.colors[2] }} /></span></div>
      : item.category === 'palette' ? <div className="relative flex w-full max-w-56 flex-col gap-3 rounded-sm border-2 border-[#292329] bg-[#fffdf7] p-3 shadow-chip"><svg viewBox="0 0 180 50" className="w-full" aria-hidden="true">{item.colors.map((color, index) => <path key={color} d={`M${10+index*28} 40 Q${22+index*28} 20 ${12+index*28} 10`} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />)}</svg><span className="flex justify-between gap-1">{item.colors.map((color) => <span key={color} className="h-4 w-4 rounded-pill border border-[#292329]" style={{ background: color }} />)}</span></div>
      : <div className="relative flex h-24 w-24 items-center justify-center rounded-pill border-[3px] border-[#292329] bg-[#292329] text-[#fffdf7] shadow-card"><span className="absolute inset-2 rounded-pill border border-[#fffdf7]/20" /><span className="absolute inset-4 rounded-pill border border-[#fffdf7]/20" /><span className="relative flex h-14 w-14 items-center justify-center rounded-pill" style={{ background: item.colors[0], color: '#292329' }}><ShopSymbol item={item} size={30} /></span></div>}
  </div>
}
