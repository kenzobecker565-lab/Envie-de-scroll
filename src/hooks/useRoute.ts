import { useSyncExternalStore } from 'react'

/**
 * Navigation minimaliste par « hash » (#/progres, #/profil…).
 *
 * Pourquoi pas une bibliothèque de routage ? Il n'y a que 5 écrans, et le
 * hash fonctionne partout sans configuration serveur : en local, sur un
 * hébergement statique, et dans la webview d'une Telegram Mini App. Le bouton
 * « retour » du navigateur fonctionne aussi.
 */

export const ROUTES = {
  accueil: '/',
  envie: '/envie',
  progres: '/progres',
  historique: '/historique',
  profil: '/profil',
} as const

export type RouteName = keyof typeof ROUTES

function currentRoute(): RouteName {
  const path = window.location.hash.replace(/^#/, '') || '/'
  const match = (Object.keys(ROUTES) as RouteName[]).find((name) => ROUTES[name] === path)
  return match ?? 'accueil'
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/** L'écran actuellement affiché. */
export function useRoute(): RouteName {
  return useSyncExternalStore(subscribe, currentRoute, () => 'accueil')
}

/** Lien utilisable dans un `href`. */
export function hrefFor(route: RouteName): string {
  return `#${ROUTES[route]}`
}

/**
 * Change d'écran. Avec `replace`, l'écran courant est remplacé dans
 * l'historique du navigateur (le bouton retour ne revient pas dessus).
 */
export function navigate(route: RouteName, options: { replace?: boolean } = {}): void {
  const target = hrefFor(route)
  if (options.replace) {
    window.history.replaceState(null, '', target)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else if (window.location.hash !== target) {
    window.location.hash = target
  }
}
