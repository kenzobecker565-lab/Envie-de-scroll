import { X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { fr } from '../../lib/typography'
import { Button, IconButton } from './Button'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Petit texte sous le titre. */
  description?: ReactNode
  children?: ReactNode
  /** Zone de boutons collée en bas de la fenêtre. */
  footer?: ReactNode
  /** `dialog` : fenêtre centrée ; `sheet` : panneau qui monte du bas (listes longues). */
  variant?: 'dialog' | 'sheet'
  /** Masque la croix de fermeture (ex. pour une confirmation). */
  hideClose?: boolean
}

/**
 * Fenêtre modale accessible, construite à la main (pas de dialogue natif
 * bloquant du navigateur) :
 * - Échap ou un clic sur le fond la ferme ;
 * - le focus clavier reste à l'intérieur tant qu'elle est ouverte, puis
 *   revient sur l'élément qui l'a ouverte ;
 * - la page derrière ne défile plus.
 * Un élément portant `data-autofocus` reçoit le focus à l'ouverture.
 */
export function Modal({ open, onClose, title, description, children, footer, variant = 'dialog', hideClose }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  // Garde la dernière version de `onClose` sans relancer l'effet d'ouverture.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const target = panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel
    target?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusables = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return
      const first = focusables[0]!
      const last = focusables[focusables.length - 1]!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-[#140d0a]/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full max-w-[440px] animate-sheet-up flex-col bg-card text-ink shadow-lift outline-none',
          variant === 'sheet'
            ? 'max-h-[92dvh] rounded-t-[2rem] sm:rounded-[2rem]'
            : 'mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] max-h-[88dvh] rounded-[1.75rem] sm:m-0',
        )}
      >
        <div className="flex items-start gap-3 px-5 pb-2 pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="font-display text-xl font-extrabold tracking-tight leading-snug">
              {fr(title)}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
                {typeof description === 'string' ? fr(description) : description}
              </div>
            )}
          </div>
          {!hideClose && (
            <IconButton label="Fermer" onClick={onClose} className="-mr-2 -mt-1">
              <X className="size-5" aria-hidden />
            </IconButton>
          )}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">{children}</div>}
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `danger` : action destructive (bouton rouge). */
  tone?: 'default' | 'danger'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

/**
 * Demande de confirmation (remplace `window.confirm`). Le focus est placé
 * sur « Annuler » : on ne détruit rien en appuyant sur Entrée par réflexe.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Annuler',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      description={message}
      hideClose
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy} data-autofocus className="sm:min-w-28">
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} busy={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
