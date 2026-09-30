import emptyGallery from '../illustrations/empty-gallery.svg?raw'
import welcome from '../illustrations/welcome.svg?raw'
import { cn } from '../lib/cn.ts'

/**
 * Illustrations unDraw (https://undraw.co), recolorées avec les variables du
 * design system par scripts/recolor-undraw.mjs : elles suivent le thème.
 */
const ILLUSTRATIONS = { welcome, 'empty-gallery': emptyGallery } as const

export function Illustration({ name, className }: { name: keyof typeof ILLUSTRATIONS; className?: string }) {
  return <div aria-hidden="true" className={cn('illustration', className)} dangerouslySetInnerHTML={{ __html: ILLUSTRATIONS[name] }} />
}
