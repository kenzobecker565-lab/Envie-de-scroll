import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'danger-ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Icône affichée avant le texte. */
  icon?: ReactNode
  /** Prend toute la largeur disponible. */
  block?: boolean
  /** Affiche un indicateur de chargement et désactive le bouton. */
  busy?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-soft hover:bg-primary-strong',
  secondary: 'border border-line bg-card text-ink shadow-soft hover:border-ink-faint',
  soft: 'bg-primary-soft text-ink hover:bg-primary-soft/70',
  ghost: 'text-ink-soft hover:bg-ink/5 hover:text-ink',
  danger: 'bg-danger text-on-primary shadow-soft hover:brightness-110',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 rounded-xl px-3.5 text-sm',
  md: 'h-12 gap-2 rounded-2xl px-5 text-[0.95rem]',
  lg: 'h-14 gap-2.5 rounded-2xl px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  block,
  busy,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center font-semibold transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...props}
    >
      {busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texte lu par les lecteurs d'écran (le bouton n'a pas de texte visible). */
  label: string
  children: ReactNode
}

/** Bouton rond ne contenant qu'une icône (retour, fermer…). */
export function IconButton({ label, children, className, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full text-ink-soft transition hover:bg-ink/5 hover:text-ink active:scale-95',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
