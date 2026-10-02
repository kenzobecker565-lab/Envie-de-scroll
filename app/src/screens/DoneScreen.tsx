import { ChevronDown, FolderPlus, House, Images, Lightbulb, Send } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { cheerFor, collectionSize, countWords, factFor, getChallengeActivity, getPassion, getPathStep, isBaseActivity, levelCrossed, milestoneCrossed, passionLevel, pathProgress, seededRandom } from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChallengeBanner } from '../components/Challenge.tsx'
import { CoinCounter, CoinIcon } from '../components/Coins.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { Rays } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { MilestoneBanner } from '../components/Milestones.tsx'
import { StepBanner } from '../components/Paths.tsx'
import { LevelUpBanner, statsFor } from '../components/Progression.tsx'
import { ProjectPicker } from '../components/Projects.tsx'
import { RateActivity } from '../components/RateActivity.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen } from '../components/Screen.tsx'
import { tabStack } from '../components/TabBar.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Confirmation : « Activité enregistrée. +X minutons ajoutés à ton total. »,
 * la fête, le compteur, UNE seule grande nouvelle (la plus importante), puis
 * la note. « Le savais-tu ? » et « Ranger dans un projet » sont repliés.
 */
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
  const challenge = getChallengeActivity(activityId)
  const stepProgress = step ? pathProgress(passion, after.steps, passionLevel(passion, after.minutes).level, state.me.user.skills[passion]).find((entry) => entry.path.id === step.pathId) : undefined
  // Une seule grande nouvelle à la fois : l'étape de parcours, sinon le niveau, le palier, le mot du jour, la collection.
  const news = step && stepProgress ? 'step' : level ? 'level' : milestone ? 'milestone' : challenge ? 'challenge' : discovered ? 'discovered' : null
  // Une félicitation et une anecdote, toujours les mêmes pour cette création.
  const { id: completionId, duration, text } = done.response.completion
  const cheer = cheerFor(passion, { duration, words: text ? countWords(text) : 0 }, seededRandom(`cheer:${completionId}`))
  const fact = factFor(passion, seededRandom(`fact:${completionId}`))

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
          {/* Minuton fait la fête. */}
          <span className="motion-loop anim-float" style={{ '--float-duration': '3s' } as React.CSSProperties}>
            <Mascot mood="cheer" size={74} className="mt-1" />
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
      <motion.p className="mt-3 max-w-[320px] text-15 font-semibold text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}>
        {cheer}
      </motion.p>
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

      {/* Une seule grande nouvelle : la plus importante. Le reste se retrouve dans « Progresser ». */}
      {news === 'step' && step && stepProgress && (
        <div className="mt-6 w-full">
          <StepBanner step={step} progress={stepProgress} onOpenPath={() => reset([...tabStack('progress'), { name: 'path', pathId: step.pathId }])} />
        </div>
      )}
      {news === 'level' && level && (
        <div className="mt-6 w-full">
          <LevelUpBanner passion={passion} step={level} />
        </div>
      )}
      {news === 'milestone' && milestone && (
        <div className="mt-6 w-full">
          <MilestoneBanner milestone={milestone} />
        </div>
      )}
      {news === 'challenge' && challenge && (
        <div className="mt-6 w-full">
          <ChallengeBanner word={challenge.word} count={new Set((done.response.stats.challenge ?? []).map((id) => id.slice(-10))).size} onOpen={() => reset([...tabStack('progress'), { name: 'challenge' }])} />
        </div>
      )}
      {news === 'discovered' && (
        <motion.p
          className="mt-6 inline-flex items-center gap-2 text-14 font-bold text-ink"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 16 }}
        >
          <Sparkle size={16} color="var(--accent)" />
          Nouvelle activité dans ta collection {getPassion(passion).label}&nbsp;: {after.tried.length}/{collectionSize(passion)}
        </motion.p>
      )}

      <div className="mt-6 w-full">
        <RateActivity completionId={done.response.completion.id} initial={done.response.completion.rating} />
      </div>

      {done.photoPending && (
        <Alert variant="info" role="status" className="mt-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Send aria-hidden="true" />
          <AlertDescription>Envoie la photo de ton dessin au bot quand tu veux&nbsp;: elle rejoindra ta galerie.</AlertDescription>
        </Alert>
      )}

      {/* Repliés : à ouvrir si on en a envie. */}
      <div className="mt-6 flex w-full flex-col gap-3 text-left">
        <Fold icon={<Lightbulb aria-hidden="true" />} title={'Le savais-tu\u00A0?'}>
          <p className="text-15 font-semibold text-ink">{fact}</p>
        </Fold>
        <Fold icon={<FolderPlus aria-hidden="true" />} title="Ranger dans un projet">
          <ProjectPicker completion={done.response.completion} label={false} />
        </Fold>
      </div>

      <div className="mt-auto flex w-full flex-col">
        <PrimaryAction text="Voir ma galerie" icon={<Images aria-hidden="true" />} onClick={() => reset(tabStack('gallery'))}>
          <Button variant="ghost" size="md" className="w-full" onClick={() => reset([{ name: 'home' }], -1)}>
            <House aria-hidden="true" />
            Retour à l’accueil
          </Button>
        </PrimaryAction>
      </div>
    </Screen>
  )
}

/** Une ligne repliée (« Le savais-tu ? », « Ranger dans un projet ») : un toucher l'ouvre. */
function Fold({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = `fold-${title.replace(/[^a-z]/gi, '').toLowerCase()}`
  return (
    <div className="overflow-hidden rounded-md border-[2.5px] border-outline bg-card shadow-chip">
      <button
        type="button"
        onClick={() => {
          haptics.selection()
          setOpen((value) => !value)
        }}
        aria-expanded={open}
        aria-controls={id}
        className="flex min-h-13 w-full items-center gap-3 px-4 py-2 text-left text-15 font-extrabold text-ink [&>svg]:size-5 [&>svg]:shrink-0"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className={open ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-t-2 border-outline/20 px-4 pt-3 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
