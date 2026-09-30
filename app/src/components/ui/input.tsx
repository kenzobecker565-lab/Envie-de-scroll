import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Champ texte shadcn/ui : 56 px de haut, bordure qui passe à l'accent au focus. */
function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-14 w-full min-w-0 rounded-sm border border-input bg-card px-4 text-15 text-foreground shadow-card transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-ink-faint',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
