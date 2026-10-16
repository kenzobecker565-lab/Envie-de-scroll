import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Champ texte shadcn/ui : 56 px de haut, contour épais, ombre pleine au focus. */
function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-14 w-full min-w-0 rounded-md border-[2.5px] border-input bg-card px-4 text-16 text-foreground transition-[box-shadow] duration-150 outline-none placeholder:text-ink-faint',
        'focus-visible:shadow-card',
        'disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
