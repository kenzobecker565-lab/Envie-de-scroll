import { cn } from '../../lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}

/** Interrupteur on/off accessible (rôle « switch »). */
export function Switch({ checked, onChange, label, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full border transition-colors',
        checked ? 'border-sage bg-sage' : 'border-line bg-ink-faint/35',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute left-0.5 top-0.5 size-[1.375rem] rounded-full bg-card shadow-soft transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}
