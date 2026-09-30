import type { ReactNode } from 'react'
import { useMainButton } from '../telegram/buttons.ts'
import { Button } from './Button.tsx'

/**
 * Action principale d'un écran : le bouton natif de Telegram (MainButton,
 * toujours visible, même au-dessus du clavier) dans Telegram, un bouton de
 * l'app en bas d'écran ailleurs.
 */
export function PrimaryAction({
  text,
  onClick,
  enabled = true,
  loading = false,
  children,
}: {
  text: string
  onClick: () => void
  enabled?: boolean
  loading?: boolean
  /** Contenu affiché sous le bouton (action secondaire, message d'erreur…). */
  children?: ReactNode
}) {
  const native = useMainButton({ text, onClick, enabled, loading })
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-auto bg-gradient-to-t from-canvas from-70% to-transparent px-4 pt-6 pb-[max(16px,env(safe-area-inset-bottom))]">
      {!native && (
        <Button className="w-full" onClick={onClick} disabled={!enabled || loading} aria-busy={loading}>
          {loading ? 'Un instant…' : text}
        </Button>
      )}
      {children}
    </div>
  )
}
