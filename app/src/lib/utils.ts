import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge doit connaître les tokens du design system : sans ça, il
 * prendrait `text-15` pour une couleur et le supprimerait à côté de `text-ink`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['11', '12', '13', '14', '15', '16', '17', '20', '21', '22', '26', '30', '34', '40', '46', '80', 'mono-xs'],
      radius: ['pill'],
      shadow: ['press', 'chip', 'card', 'pop'],
      font: ['display', 'sans', 'numbers'],
    },
  },
})

/** Assemble des classes CSS ; en cas de conflit, la dernière gagne. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
