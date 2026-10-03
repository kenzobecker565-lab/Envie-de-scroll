import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Zone de texte shadcn/ui : grandit avec le contenu (navigateurs récents). */
function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'field-sizing-content flex min-h-56 w-full resize-none rounded-md border-[2.5px] border-input bg-card p-4 text-16 text-foreground transition-[box-shadow] duration-150 outline-none placeholder:text-ink-faint',
        'focus-visible:shadow-card',
        'disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
