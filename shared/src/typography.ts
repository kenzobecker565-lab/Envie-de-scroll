const NBSP = ' '
/** Espace fine insécable, avant ; ! ? */
const NNBSP = ' '

/**
 * Typographie française pour l'affichage : apostrophes courbes, guillemets
 * « … », points de suspension, espaces insécables avant la ponctuation haute
 * (pour qu'un « : » ou un « ? » ne se retrouve jamais seul en début de ligne).
 * Le sens et les mots du texte ne changent pas.
 */
export function frenchTypography(text: string): string {
  return text
    .replace(/'/g, '’')
    .replace(/"([^"]*)"/g, `«${NBSP}$1${NBSP}»`)
    .replace(/\.\.\./g, '…')
    .replace(/ :/g, `${NBSP}:`)
    .replace(/ ([;!?])/g, `${NNBSP}$1`)
    .replace(/ —/g, `${NBSP}—`)
}
