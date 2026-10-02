import { ShoppingBag, GraduationCap, Heart, Home, UserRound, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { track } from '../api/client.ts'
import { useNavigation, type Route } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Les six espaces principaux. La barre se retire pendant les activités. */

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
export const TAB_BAR_SPACE = 'pb-[calc(104px+env(safe-area-inset-bottom))]'

export function TabBar() {
  const { route, reset } = useNavigation()
  const current = route.name === 'progress' ? 'profile' : route.name === 'learnPassion' ? 'learn' : route.name === 'passionSpace' ? 'passionHub' : route.name === 'gallery' ? (route.passion ? 'passionHub' : 'profile') : isTab(route.name) ? route.name : null

  const open = (tab: Tab) => {
    if (!current || tab === current) return
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
          className="da-tabbar fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto grid max-w-[480px] grid-cols-5 gap-1 rounded-[22px] border-[2.5px] border-outline bg-surface-200 p-1.5 shadow-card"
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
                type="button"
                onClick={() => open(id)}
                aria-current={active ? 'page' : undefined}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  'relative isolate flex min-h-13 flex-col items-center justify-center gap-0.5 rounded-[15px] min-w-0 border-2 text-12 min-[360px]:text-[8.5px] min-[390px]:text-[9px] min-[430px]:text-[10px] font-extrabold transition-colors duration-200',
                  active ? 'border-outline text-on-color' : 'border-transparent text-ink',
                )}
              >
                {active && <motion.span layoutId="tab-active" className="absolute inset-0 -z-10 rounded-[13px] bg-accent" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Icon size={20} strokeWidth={2.4} aria-hidden="true" />
                <span className="text-center leading-tight">{label}</span>
              </motion.button>
            )
          })}
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
