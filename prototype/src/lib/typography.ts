const NBSP = ' '

/**
 * Typographie française : remplace l'espace avant « ? ! : ; » et à
 * l'intérieur des guillemets par une espace insécable, pour qu'un point
 * d'interrogation ne se retrouve jamais seul en début de ligne.
 *
 * Appliqué à l'affichage : dans la bibliothèque d'activités, on peut donc
 * écrire avec des espaces normales.
 */
export function fr(text: string): string {
  return text.replace(/ +([?!:;»])/g, `${NBSP}$1`).replace(/« +/g, `«${NBSP}`)
}
