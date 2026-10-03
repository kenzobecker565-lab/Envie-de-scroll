import { Bug, Check, Heart, Info, Lightbulb, MessageCircleHeart, SendHorizontal, ThumbsDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { MAX_FEEDBACK_LENGTH } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api, ApiError, track } from '../api/client.ts'
import { haptics } from '../telegram/webApp.ts'

/** Le genre d'avis : il aide à trier les retours du test. */
const KINDS = [
  { id: 'j’aime', label: 'J’aime', icon: Heart, placeholder: 'Ce qui t’a plu, ce qui t’a fait du bien…' },
  { id: 'gêne', label: 'Ça me gêne', icon: ThumbsDown, placeholder: 'Ce qui t’a freiné, agacé, perdu…' },
  { id: 'idée', label: 'Une idée', icon: Lightbulb, placeholder: 'Une activité, une fonction, un détail…' },
  { id: 'bug', label: 'Un bug', icon: Bug, placeholder: 'Ce qui s’est passé, sur quel écran…' },
] as const
type Kind = (typeof KINDS)[number]['id']

/**
 * La feuille « Ton avis compte » : un genre d'avis (facultatif), un message,
 * et c'est envoyé. L'équipe le reçoit dans Telegram.
 */
export function FeedbackDialog({ open, onOpenChange, context }: { open: boolean; onOpenChange: (open: boolean) => void; context?: string }) {
  const [kind, setKind] = useState<Kind>()
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (!open) return
    track('feedback_open', context ? { from: context } : undefined)
    setStatus('idle')
    setError(undefined)
  }, [open, context])

  useEffect(() => {
    if (status !== 'sent') return
    const timer = window.setTimeout(() => {
      onOpenChange(false)
      setMessage('')
      setKind(undefined)
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [status, onOpenChange])

  const send = async () => {
    if (!message.trim()) return
    setStatus('sending')
    setError(undefined)
    try {
      await api.feedback(message.trim(), [kind, context].filter(Boolean).join(' · ') || undefined)
      haptics.success()
      setStatus('sent')
    } catch (caught) {
      haptics.error()
      setError(caught instanceof ApiError ? caught.message : 'Ton message n’est pas parti. Réessaie dans un instant.')
      setStatus('idle')
    }
  }

  const placeholder = KINDS.find((item) => item.id === kind)?.placeholder ?? 'Ce qui te plaît, ce qui te gêne, une idée…'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AnimatePresence mode="wait" initial={false}>
          {status === 'sent' ? (
            <motion.div
              key="sent"
              className="flex flex-col items-center gap-4 py-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="flex h-20 w-20 items-center justify-center rounded-pill border-[3px] border-outline bg-good text-on-color shadow-pop"
                initial={{ rotate: -30, scale: 0.4 }}
                animate={{ rotate: -6, scale: 1 }}
                transition={{ type: 'spring', stiffness: 380, damping: 14 }}
              >
                <Check size={40} strokeWidth={3} aria-hidden="true" />
              </motion.span>
              <DialogTitle>Merci, c’est transmis&nbsp;!</DialogTitle>
              <DialogDescription>L’équipe lit chaque message. Ton avis va vraiment compter pour la suite.</DialogDescription>
            </motion.div>
          ) : (
            <motion.div key="form" className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageCircleHeart aria-hidden="true" className="size-7 shrink-0" />
                  Ton avis compte
                </DialogTitle>
                <DialogDescription>Scroll-up est en test. Dis-nous tout, même en trois mots&nbsp;: l’équipe lit chaque message.</DialogDescription>
              </DialogHeader>
              <ToggleGroup
                type="single"
                variant="chip"
                value={kind ?? ''}
                onValueChange={(value) => setKind((value || undefined) as Kind | undefined)}
                className="flex-wrap gap-2"
                aria-label="Le genre de ton avis"
              >
                {KINDS.map((item) => (
                  <ToggleGroupItem key={item.id} value={item.id} whileTap={{ scale: 0.95 }}>
                    <item.icon aria-hidden="true" />
                    {item.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <div className="flex flex-col gap-1">
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, MAX_FEEDBACK_LENGTH))}
                  placeholder={placeholder}
                  rows={5}
                  aria-label="Ton message"
                />
                <span className="self-end text-12 text-ink-soft tabular-nums">
                  {message.length}/{MAX_FEEDBACK_LENGTH}
                </span>
              </div>
              {error && (
                <Alert variant="warning" role="status">
                  <Info aria-hidden="true" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button onClick={() => void send()} disabled={!message.trim() || status === 'sending'} aria-busy={status === 'sending'}>
                <SendHorizontal aria-hidden="true" />
                {status === 'sending' ? 'Envoi…' : 'Envoyer à l’équipe'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
