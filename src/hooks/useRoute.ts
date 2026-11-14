import { useSyncExternalStore } from 'react'

/**
 * Navigation minimaliste par « hash » (#/progres, #/profil…).
 *
 * Pourquoi pas une bibliothèque de routage ? Il n'y a que 5 écrans, et le
 * hash fonctionne partout sans configuration serveur : en local, sur un
 * hébergement statique, dans la webview d'une Telegram Mini App ou dans un
 * cadre intégré. Le bouton « retour » du navigateur fonctionne aussi.
 *
 * L'écran courant est gardé en mémoire : l'adresse est mise à jour quand
 * c'est possible (history.pushState), mais la navigation fonctionne même
 * dans un cadre qui interdit de modifier l'adresse.
 */

export const ROUTES = {
  accueil: '/',
  envie: '/envie',
  progres: '/progres',
  historique: '/historique',
  profil: '/profil',
} as const

export type RouteName = keyof typeof ROUTES

function routeFromHash(hash: string): RouteName {
  const path = hash.replace(/^#/, '') || '/'
  const match = (Object.keys(ROUTES) as RouteName[]).find((name) => ROUTES[name] === path)
  return match ?? 'accueil'
}

const hasWindow = typeof window !== 'undefined'
let current: RouteName = hasWindow ? routeFromHash(window.location.hash) : 'accueil'
const listeners = new Set<() => void>()

function setCurrent(next: RouteName) {
  if (next === current) return
  current = next
  listeners.forEach((listener) => listener())
}

if (hasWindow) {
  // Bouton retour / avant du navigateur, ou adresse modifiée à la main.
  const syncWithAddress = () => setCurrent(routeFromHash(window.location.hash))
  window.addEventListener('popstate', syncWithAddress)
  window.addEventListener('hashchange', syncWithAddress)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** L'écran actuellement affiché. */
export function useRoute(): RouteName {
  return useSyncExternalStore(subscribe, () => current, () => 'accueil')
}

/** Adresse d'un écran, pour un `href`. */
export function hrefFor(route: RouteName): string {
  return `#${ROUTES[route]}`
}

/**
 * Change d'écran. Avec `replace`, l'écran courant est remplacé dans
 * l'historique du navigateur (le bouton retour ne revient pas dessus).
 */
export function navigate(route: RouteName, options: { replace?: boolean } = {}): void {
  const target = hrefFor(route)
  try {
    if (options.replace) window.history.replaceState(null, '', target)
    else if (window.location.hash !== target) window.history.pushState(null, '', target)
  } catch {
    // Adresse non modifiable (cadre restreint) : la navigation continue en mémoire.
  }
  setCurrent(route)
}
