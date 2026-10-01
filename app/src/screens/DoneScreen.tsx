import { House, Images, Send } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { collectionSize, getPassion, getPathStep, isBaseActivity, levelCrossed, milestoneCrossed, passionLevel, pathProgress } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { Rays } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { MilestoneBanner } from '../components/Milestones.tsx'
import { StepBanner } from '../components/Paths.tsx'
import { LevelUpBanner, statsFor } from '../components/Progression.tsx'
import { ProjectPicker } from '../components/Projects.tsx'
import { RateActivity } from '../components/RateActivity.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/** Confirmation : « Activité enregistrée. +X minutons ajoutés à ton total. », niveau et collection. */
export function DoneScreen() {
  const { state } = useAppState()
  const { reset } = useNavigation()
  const done = state.done
  const [shown, setShown] = useState(done?.previousStats.totalCoins ?? 0)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!done) return
    haptics.success()
    // Le compteur part de l'ancien total, puis roule jusqu'au nouveau, une fois
    // que les minutons sont tombés dedans.
    const timer = window.setTimeout(() => setShown(done.response.stats.totalCoins), reduced ? 300 : 1250)
    return () => window.clearTimeout(timer)
  }, [done, reduced])

  if (!done) return null
  const earned = done.response.coinsEarned
  const milestone = milestoneCrossed(done.previousStats.totalCoins, done.response.stats.totalCoins)
  // La progression de la passion : niveau franchi, nouvelle activité dans la collection.
  const { passion, activityId } = done.response.completion
  const before = statsFor(done.previousStats.byPassion, passion)
  const after = statsFor(done.response.stats.byPassion, passion)
  const level = levelCrossed(passion, before.minutes, after.minutes)
  const discovered = isBaseActivity(activityId) && !before.tried.includes(activityId)
  // Une étape de parcours : la marche franchie, la suivante qui s'ouvre (ou le badge).
  const step = getPathStep(activityId)
  const stepProgress = step ? pathProgress(passion, after.steps, passionLevel(passion, after.minutes).level).find((entry) => entry.path.id === step.pathId) : undefined

  return (
    <Screen className="items-center text-center">
      <div className="relative mt-8 flex h-32 w-32 items-center justify-center" style={{ perspective: 600 }}>
        {/* Rayons qui tournent, puis le minuton qui arrive en tournoyant. */}
        <motion.div className="absolute -inset-20" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
          <Rays className="h-full w-full" />
        </motion.div>
        <Confetti count={34} />
        <span aria-hidden="true" className="motion-loop anim-pulse-soft absolute h-32 w-32 rounded-pill border-[3px] border-dashed border-outline opacity-40" />
        <motion.span
          className="relative flex h-28 w-28 items-center justify-center rounded-pill border-[3px] border-outline bg-surface-200 shadow-pop"
          initial={{ scale: 0.3, opacity: 0, rotateY: 0 }}
          animate={{ scale: 1, opacity: 1, rotateY: 720 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="motion-loop anim-float" style={{ '--float-duration': '3s' } as React.CSSProperties}>
            <CoinIcon size={68} />
          </span>
        </motion.span>
        <Sparkle size={24} color="var(--accent)" className="motion-loop anim-twinkle absolute -top-3 -right-2" />
        <Sparkle size={18} color="var(--good)" className="motion-loop anim-twinkle absolute bottom-0 -left-5" style={{ '--twinkle-delay': '-1s' } as React.CSSProperties} />
      </div>

      <motion.h1
        className="mt-8 font-display text-40 font-extrabold tracking-tight text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        Activité enregistrée.
      </motion.h1>
      <motion.p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-16 text-ink-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <Badge variant="good" tilt="left" className="text-15">
          +{earned} minutons
        </Badge>
        ajoutés à ton total.
      </motion.p>
      {discovered && (
        <motion.p
          className="mt-3 inline-flex items-center gap-2 text-14 font-bold text-ink"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 16 }}
        >
          <Sparkle size={16} color="var(--accent)" />
          Nouvelle activité dans ta collection {getPassion(passion).label}&nbsp;: {after.tried.length}/{collectionSize(passion)}
        </motion.p>
      )}

      <Card
        padding="lg"
        className="mt-8 items-center gap-3 overflow-visible bg-warm text-on-color"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        {/* Les minutons gagnés tombent dans le compteur. */}
        {!reduced &&
          Array.from({ length: 6 }, (_, index) => (
            <motion.span
              key={index}
              aria-hidden="true"
              className="absolute top-6"
              style={{ left: `${30 + index * 8}%` }}
              initial={{ y: -190, opacity: 0, rotate: 0 }}
              animate={{ y: [-190, -150, -8, 6], opacity: [0, 1, 1, 0], rotate: [0, index % 2 ? 40 : -40, index % 2 ? 180 : -180, index % 2 ? 200 : -200] }}
              transition={{ delay: 0.55 + index * 0.08, duration: 0.65, ease: 'easeIn', times: [0, 0.2, 0.85, 1] }}
            >
              <CoinIcon size={18} />
            </motion.span>
          ))}
        <CoinCounter value={shown} tone="good" />
        <span className="text-14 font-bold">minutons au total</span>
      </Card>

      {step && stepProgress && (
        <div className="mt-6 w-full">
          <StepBanner step={step} progress={stepProgress} onOpenPath={() => reset([{ name: 'home' }, { name: 'path', pathId: step.pathId }])} />
        </div>
      )}

      {level && (
        <div className="mt-6 w-full">
          <LevelUpBanner passion={passion} step={level} />
        </div>
      )}

      {milestone && (
        <div className="mt-6 w-full">
          <MilestoneBanner milestone={milestone} />
        </div>
      )}

      <Card className="mt-6 w-full text-left" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.4 }}>
        <ProjectPicker completion={done.response.completion} />
      </Card>

      <div className="mt-6 w-full">
        <RateActivity completionId={done.response.completion.id} initial={done.response.completion.rating} />
      </div>

      {done.photoPending && (
        <Alert variant="info" role="status" className="mt-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Send aria-hidden="true" />
          <AlertDescription>Envoie la photo de ton dessin au bot quand tu veux&nbsp;: elle rejoindra ta galerie.</AlertDescription>
        </Alert>
      )}

      <div className="mt-auto flex w-full flex-col">
        <PrimaryAction text="Voir ma galerie" icon={<Images aria-hidden="true" />} onClick={() => reset([{ name: 'home' }, { name: 'gallery' }])}>
          <Button variant="ghost" size="md" className="w-full" onClick={() => reset([{ name: 'home' }], -1)}>
            <House aria-hidden="true" />
            Retour à l’accueil
          </Button>
        </PrimaryAction>
      </div>
    </Screen>
  )
}
