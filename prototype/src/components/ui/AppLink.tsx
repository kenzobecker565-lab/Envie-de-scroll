import type { AnchorHTMLAttributes, MouseEvent } from 'react'
import { hrefFor, navigate, type RouteName } from '../../hooks/useRoute'

interface AppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: RouteName
}

/**
 * Lien vers un écran de l'app. C'est un vrai lien (clic du milieu, lecteurs
 * d'écran…), mais le clic normal passe par `navigate()` : la navigation
 * marche aussi dans un cadre qui bloque les changements d'adresse.
 */
export function AppLink({ to, onClick, children, ...props }: AppLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={hrefFor(to)} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}
