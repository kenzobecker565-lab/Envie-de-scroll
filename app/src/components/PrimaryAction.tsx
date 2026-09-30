import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useMainButton } from '../telegram/buttons.ts'

/**
 * Action principale d'un écran : le bouton natif de Telegram (MainButton,
 * toujours visible, même au-dessus du clavier) dans Telegram, un bouton de
 * l'app en bas d'écran ailleurs.
 */
export function PrimaryAction({
  text,
  icon,
  onClick,
  enabled = true,
  loading = false,
  children,
}: {
  text: string
  /** Icône Lucide du bouton de l'app (le bouton natif de Telegram n'en a pas). */
  icon?: ReactNode
  onClick: () => void
  enabled?: boolean
  loading?: boolean
  /** Contenu affiché sous le bouton (action secondaire, message d'erreur…). */
  children?: ReactNode
}) {
  const native = useMainButton({ text, onClick, enabled, loading })
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-auto flex flex-col gap-2 bg-gradient-to-t from-canvas/80 to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
      {!native && (
        <Button className="w-full" onClick={onClick} disabled={!enabled || loading} aria-busy={loading}>
          {loading ? <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" /> : icon}
          {loading ? 'Un instant…' : text}
        </Button>
      )}
      {children}
    </div>
  )
}
