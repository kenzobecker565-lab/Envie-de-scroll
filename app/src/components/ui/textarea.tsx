import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Zone de texte shadcn/ui : grandit avec le contenu (navigateurs récents). */
function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-56 w-full resize-none rounded-sm border border-input bg-card p-4 text-15 text-foreground shadow-card transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-ink-faint',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
