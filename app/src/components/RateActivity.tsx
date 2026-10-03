import { Heart, Meh, ThumbsUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { RATING_LABELS, type ActivityRating } from '@scroll-up/shared'
import { Card, CardEyebrow } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { api } from '../api/client.ts'
import { haptics } from '../telegram/webApp.ts'
import { FeedbackDialog } from './FeedbackDialog.tsx'

const CHOICES = [
  { value: 3, icon: Heart, tone: 'data-[state=on]:bg-accent' },
  { value: 2, icon: ThumbsUp, tone: 'data-[state=on]:bg-good' },
  { value: 1, icon: Meh, tone: 'data-[state=on]:bg-sky' },
] as const

/**
 * « Cette activité, tu l'as trouvée comment ? » : un tap, et la note part
 * au serveur. Elle aide à trier les activités pendant le test.
 */
export function RateActivity({ completionId, initial = null }: { completionId: string; initial?: ActivityRating | null }) {
  const [rating, setRating] = useState<ActivityRating | null>(initial)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const choose = (value: string) => {
    const next = Number(value) as ActivityRating
    if (!next) return
    haptics.selection()
    setRating(next)
    api.rate(completionId, next).catch(() => {
      // Pas grave : la note n'est qu'un indice pour l'équipe.
    })
  }

  return (
    <Card className="w-full gap-3 text-left" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}>
      <CardEyebrow>Ton avis sur cette activité</CardEyebrow>
      <ToggleGroup
        type="single"
        variant="chip"
        value={rating ? String(rating) : ''}
        onValueChange={choose}
        className="flex-wrap gap-2"
        aria-label="Cette activité, tu l’as trouvée comment ?"
      >
        {CHOICES.map((choice) => (
          <ToggleGroupItem key={choice.value} value={String(choice.value)} className={choice.tone} whileTap={{ scale: 0.94 }}>
            <choice.icon aria-hidden="true" />
            {RATING_LABELS[choice.value]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <AnimatePresence>
        {rating && (
          <motion.p
            className="text-13 text-ink-soft"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            Merci&nbsp;! Ça nous aide à choisir les prochaines activités.{' '}
            <button type="button" className="font-bold text-accent-strong underline decoration-2 underline-offset-4" onClick={() => setFeedbackOpen(true)}>
              Un mot à ajouter&nbsp;?
            </button>
          </motion.p>
        )}
      </AnimatePresence>
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} context="après une activité" />
    </Card>
  )
}
