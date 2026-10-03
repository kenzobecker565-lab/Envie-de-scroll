import { XIcon } from 'lucide-react'
import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { createContext, useCallback, useContext, useState, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { useBackButtonOverlay } from '@/telegram/buttons'
import { haptics } from '@/telegram/webApp'

/**
 * Fenêtre modale shadcn/ui (Radix Dialog), présentée en feuille qui monte du
 * bas de l'écran, comme dans les apps mobiles. Framer Motion anime l'entrée
 * et la sortie ; on la ferme en la glissant vers le bas, en touchant le
 * fond, avec la croix, Échap ou le bouton retour de Telegram.
 */
const DialogContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({ open: false, setOpen: () => {} })

function Dialog({ open: openProp, defaultOpen = false, onOpenChange, ...props }: ComponentProps<typeof DialogPrimitive.Root>) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen)
  const open = openProp ?? innerOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInnerOpen(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange],
  )
  useBackButtonOverlay(open ? () => setOpen(false) : undefined)
  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      <DialogPrimitive.Root data-slot="dialog" open={open} onOpenChange={setOpen} {...props} />
    </DialogContext.Provider>
  )
}

function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, 'asChild' | 'forceMount'> & { showCloseButton?: boolean }) {
  const { open, setOpen } = useContext(DialogContext)
  const drag = useDragControls()
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Portal forceMount>
          <DialogPrimitive.Overlay asChild forceMount>
            <motion.div
              data-slot="dialog-overlay"
              className="fixed inset-0 z-50 bg-on-color/55"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            />
          </DialogPrimitive.Overlay>
          <DialogPrimitive.Content asChild forceMount {...props}>
            <motion.div
              data-slot="dialog-content"
              className={cn(
                'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] w-full max-w-[480px] flex-col rounded-t-lg border-[2.5px] border-b-0 border-outline bg-popover text-popover-foreground outline-none',
                className,
              )}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              drag="y"
              dragControls={drag}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.7 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) {
                  haptics.impact('light')
                  setOpen(false)
                }
              }}
            >
              {/* Poignée : on attrape la feuille ici pour la glisser vers le bas. */}
              <div className="flex h-8 shrink-0 touch-none items-center justify-center" onPointerDown={(event) => drag.start(event)} aria-hidden="true">
                <span className="h-1.5 w-12 rounded-pill bg-outline" />
              </div>
              <div data-slot="dialog-scroll" className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-[max(24px,env(safe-area-inset-bottom))] [&>*]:shrink-0">{children}</div>
              {showCloseButton && (
                <DialogPrimitive.Close
                  data-slot="dialog-close"
                  className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-sm border-2 border-outline bg-surface-200 text-ink shadow-chip transition-shadow outline-none active:shadow-press focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <XIcon size={20} strokeWidth={2.6} aria-hidden="true" />
                  <span className="sr-only">Fermer</span>
                </DialogPrimitive.Close>
              )}
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      )}
    </AnimatePresence>
  )
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-2 pr-12', className)} {...props} />
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex flex-col gap-2', className)} {...props} />
}

function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn('font-display text-30 font-extrabold tracking-tight text-foreground', className)} {...props} />
}

function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn('text-13 text-muted-foreground', className)} {...props} />
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger }
