import { ShoppingBag, GraduationCap, Heart, Home, UserRound, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { useNavigation, type Route } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Les cinq onglets principaux. La barre se retire pendant les activités. */

export type Tab = 'home' | 'learn' | 'passionHub' | 'progress' | 'profile' | 'shop'

const TABS: readonly { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'passionHub', label: 'Passions', icon: Heart },
  { id: 'learn', label: 'Apprendre', icon: GraduationCap },
  { id: 'shop', label: 'Boutique', icon: ShoppingBag },
  { id: 'profile', label: 'Profil', icon: UserRound },
]

/** La pile d'un onglet : l'accueil en dessous, pour que le bouton retour de Telegram y ramène. */
export function tabStack(tab: Tab | 'gallery'): Route[] {
  if (tab === 'gallery') return [{ name: 'home' }, { name: 'progress' }, { name: 'gallery' }]
  return tab === 'home' ? [{ name: 'home' }] : [{ name: 'home' }, { name: tab }]
}

export function isTab(name: string): name is Tab {
  return name === 'progress' || TABS.some((tab) => tab.id === name)
}

/** Hauteur réservée en bas des écrans à onglets (barre + marge + zone sûre). */
export const TAB_BAR_SPACE = 'pb-[calc(86px+env(safe-area-inset-bottom))]'

export function TabBar() {
  const { route, reset } = useNavigation()
  const current = route.name === 'settings' ? 'profile' : route.name === 'challenge' ? 'learn' : route.name === 'progress' ? 'profile' : route.name === 'learnPassion' ? 'learn' : route.name === 'passionSpace' ? 'passionHub' : route.name === 'gallery' ? (route.passion ? 'passionHub' : 'profile') : isTab(route.name) ? route.name : null

  const open = (tab: Tab) => {
    if (!current || (tab === current && route.name === current)) return
    haptics.selection()
    track('tab', { tab })
    const from = TABS.findIndex((entry) => entry.id === current)
    const to = TABS.findIndex((entry) => entry.id === tab)
    reset(tabStack(tab), to > from ? 1 : -1)
  }

  return (
    <AnimatePresence>
      {current && (
        <motion.nav
          key="tabbar"
          aria-label="Navigation"
          className="studio-tabbar"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = id === current
            return (
              <motion.button
                key={id}
                data-tour-target={id === 'learn' ? 'learn' : id === 'shop' ? 'shop' : undefined}
                type="button"
                onClick={() => open(id)}
                aria-current={active ? 'page' : undefined}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  'relative isolate flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[15px] min-w-0 border-2 text-12 min-[360px]:text-[8.5px] min-[390px]:text-[9px] min-[430px]:text-[10px] font-extrabold transition-colors duration-200',
                  active ? 'border-outline text-on-color' : 'border-transparent text-ink',
                )}
              >

                <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                <span className="text-center leading-tight">{label}</span>
              </motion.button>
            )
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
