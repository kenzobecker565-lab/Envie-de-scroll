import { ChartColumn, House, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { RouteName } from '../../hooks/useRoute'
import { cn } from '../../lib/cn'
import { isStorageTemporary } from '../../services/appInit'
import { fr } from '../../lib/typography'
import { AppLink } from '../ui/AppLink'

/**
 * Cadre « application mobile » : pleine largeur sur téléphone, colonne
 * centrée façon téléphone sur un grand écran, avec la barre d'onglets en bas.
 */
export function AppShell({ children, activeTab, hideNav }: { children: ReactNode; activeTab?: RouteName; hideNav?: boolean }) {
  return (
    <div className="min-h-dvh bg-paper-deep bg-dots sm:px-6 sm:py-6">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-paper sm:min-h-[calc(100dvh-3rem)] sm:overflow-clip sm:rounded-[2.25rem] sm:border sm:border-line sm:shadow-lift">
        <main className={cn('flex flex-1 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))]', hideNav ? 'pb-0' : 'pb-8')}>
          {isStorageTemporary() && (
            <p role="status" className="mb-3 rounded-2xl bg-saffron-soft px-3.5 py-2.5 text-sm leading-snug">
              Ton navigateur bloque le stockage&nbsp;: l’app fonctionne, mais tes activités ne seront pas gardées après la fermeture
              de la page.
            </p>
          )}
          {children}
        </main>
        {!hideNav && <BottomNav active={activeTab} />}
      </div>
    </div>
  )
}

const TABS: { route: RouteName; label: string; Icon: typeof House }[] = [
  { route: 'accueil', label: 'Accueil', Icon: House },
  { route: 'progres', label: 'Progrès', Icon: ChartColumn },
  { route: 'profil', label: 'Profil', Icon: UserRound },
]

function BottomNav({ active }: { active?: RouteName }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="sticky bottom-0 z-30 border-t border-line bg-card/90 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
    >
      <ul className="grid grid-cols-3 gap-1">
        {TABS.map(({ route, label, Icon }) => {
          const isActive = active === route || (route === 'progres' && active === 'historique')
          return (
            <li key={route}>
              <AppLink
                to={route}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-xs font-semibold transition',
                  isActive ? 'text-primary' : 'text-ink-soft hover:text-ink',
                )}
              >
                <span className={cn('grid h-8 w-14 place-items-center rounded-full transition', isActive && 'bg-primary-soft')}>
                  <Icon className="size-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden />
                </span>
                {label}
              </AppLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** En-tête des écrans secondaires : bouton retour + titre. */
export function ScreenTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-5 mt-2 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight tracking-tight">{fr(title)}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{fr(subtitle)}</p>}
      </div>
      {children}
    </header>
  )
}

/** Carte de base : fond « carte », coins arrondis, ombre douce. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-[1.6rem] border border-line bg-card p-4 shadow-soft', className)}>{children}</section>
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  )
}
