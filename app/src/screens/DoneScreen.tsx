import {MinutonHangs} from '../components/MinutonHangs.tsx'
import { Check, ChevronDown, Clock3, House, Images, Lightbulb, Mountain, Piano, Play, Send, Shuffle, Sparkles } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
  SPORT_LESSONS,
  sportProgram,
  WORKSHOP_LESSONS,
  workshopConfig,
  workshopSolved,
  cheerFor,
  collectionSize,
  countWords,
  factFor,
  getChallengeActivity,
  getPassion,
  getPathStep,
  isBaseActivity,
  keyboardMelody,
  levelCrossed,
  milestoneCrossed,
  passionLevel,
  PATH_TIERS,
  pathProgress,
  seededRandom,
  STEPS_PER_PATH,
  type LevelStep,
  type PathProgress,
  type PathStep,
} from '@scroll-up/shared'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
import { BadgePin } from '../components/BadgePin.tsx'
import { ChallengeBanner } from '../components/Challenge.tsx'
import { CoinCounter } from '../components/Coins.tsx'
import { Confetti } from '../components/Confetti.tsx'
import { Rays } from '../components/decor/Ornaments.tsx'
import { Sparkle } from '../components/decor/Sparkle.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { MilestoneBanner } from '../components/Milestones.tsx'
import { LevelUpBanner, statsFor } from '../components/Progression.tsx'
import { RateActivity } from '../components/RateActivity.tsx'
import { PrimaryAction } from '../components/PrimaryAction.tsx'
import { Screen } from '../components/Screen.tsx'
import { tabStack } from '../components/TabBar.tsx'
import { PASSION_COLORS } from '../lib/icons.ts'
import { useStartLesson } from '../lib/useLesson.ts'
import { useAppState, useNavigation, type DoneResult } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'

/**
 * Confirmation : « Activité enregistrée. +X minutons ajoutés à ton total. »,
 * la fête, le compteur, UNE seule grande nouvelle (la plus importante), puis
 * la note. « Le savais-tu ? » est replié.
 */
export function DoneScreen() {
  const { state, dispatch } = useAppState()
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
  const discovered = isBaseActivity(activityId) && !activityId.includes('-lesson-') && !before.tried.includes(activityId)
  // Une étape de parcours : la marche franchie, la suivante qui s'ouvre (ou le badge).
  const step = getPathStep(activityId)
  const challenge = getChallengeActivity(activityId)
  const paths = step ? pathProgress(passion, after.steps, passionLevel(passion, after.minutes).level, state.me.user.skills[passion]) : []
  const stepProgress = step ? paths.find((entry) => entry.path.id === step.pathId) : undefined
  // Une seule grande nouvelle à la fois : l'étape de parcours, sinon le niveau, le palier, le mot du jour, la collection.
  const news = step && stepProgress ? 'step' : level ? 'level' : milestone ? 'milestone' : challenge ? 'challenge' : discovered ? 'discovered' : null
  // Une félicitation et une anecdote, toujours les mêmes pour cette création.
  const { id: completionId, duration, text } = done.response.completion
  const studiedLogic = passion === 'logique' && !!done.response.completion.workshop && !workshopSolved(done.response.completion.workshop)
  const cheer = studiedLogic ? 'Tu as pris le temps de chercher et de comprendre. Ta séance compte.' : cheerFor(passion, { duration, words: text ? countWords(text) : 0 }, seededRandom(`cheer:${completionId}`))
  const fact = factFor(passion, seededRandom(`fact:${completionId}`))

  const continuePassion = () => {
    haptics.selection()
    dispatch({ type: 'newFlow', flow: {
      passion,
      fixedPassion: passion,
      duration,
      quiet: done.continuation?.quiet,
      projectId: done.continuation?.projectId,
    } })
    reset([{ name: 'home' }, { name: 'activity' }])
  }

  const workshop = workshopConfig(activityId)
  const sportLesson=sportProgram(activityId)?.lesson
  const nextSportLesson=sportLesson!==undefined?SPORT_LESSONS[sportLesson+1]:undefined
  const continueSport=()=>{if(sportLesson===undefined||!nextSportLesson)return;dispatch({type:'newFlow',flow:{passion:'sport',fixedPassion:'sport',duration:5,fixedStep:`sport-lesson-${sportLesson+2}`}});reset([{name:'home'},{name:'learn'},{name:'learnPassion',passion:'sport'},{name:'activity'}])}
  const nextWorkshopLesson = workshop?.lesson !== undefined && workshop.lesson < 2 ? WORKSHOP_LESSONS[workshop.activity.passion as keyof typeof WORKSHOP_LESSONS][workshop.lesson + 1] : undefined
  const continueWorkshop = () => {
    if (!workshop || workshop.lesson === undefined || !nextWorkshopLesson) return
    dispatch({ type: 'newFlow', flow: { passion, fixedPassion: passion, duration: 5, fixedStep: `${passion}-lesson-${workshop.lesson + 2}` } })
    reset([{ name: 'home' }, { name: 'learn' }, { name: 'learnPassion', passion }, { name: 'activity' }])
  }

  // Le mode progression : une étape réussie propose aussitôt la suivante.
  if (step && stepProgress) return <StepDone done={done} step={step} progress={stepProgress} paths={paths} level={level} cheer={cheer} />

  return <Screen className="items-center text-center flow-done flow-done-compact">
    <h1 className="font-display text-32 font-extrabold">Bien joué !</h1>
    <p className="flow-completion-caption">{passion === 'dessin' && done.response.completion.photoUrl ? 'Ton dessin est enregistré.' : passion === 'ecriture' && text ? 'Ton texte est enregistré.' : 'Ton activité est enregistrée.'}</p>
    <section className="done-creation" aria-label="Ma création enregistrée">
      <MinutonHangs item={done.response.completion}/>
      {text && <p className="done-text-preview">{text}</p>}
      <small>{text ? 'Ton texte complet t’attend chez Minuton.' : 'Ce moment prend sa place dans ton atelier.'}</small>
    </section>
    {/* Atelier enregistré en moins d'une minute, sans tout résoudre : rien de perdu, mais pas de minuton. */}
    {earned > 0 ? <Badge variant="good">+{earned} minutons</Badge> : <p className="text-14 text-ink-soft">Les minutons viennent avec les minutes de recherche.</p>}
    <p className="text-14 text-ink-soft">{cheer}</p>
    <div className="done-primary-actions">
      <Button onClick={() => reset([{name:'home'},{name:'atelier',focus:completionId}])}><Images/>Voir chez Minuton</Button>
      <Button variant="secondary" onClick={nextSportLesson ? continueSport : nextWorkshopLesson ? continueWorkshop : continuePassion}><Shuffle/>{nextSportLesson || nextWorkshopLesson ? 'Continuer la leçon suivante' : 'Une nouvelle activité'}</Button>
      <Button variant="ghost" onClick={() => reset([{name:'home'}], -1)}><House/>Retour à l’accueil</Button>
    </div>
    {done.photoPending && <Alert variant="info"><Send/><AlertDescription>Envoie la photo de ton dessin au bot quand tu veux : elle rejoindra ton atelier.</AlertDescription></Alert>}
    <div className="done-details">
      <Fold icon={<Sparkles/>} title="Ma progression"><CoinCounter value={shown} tone="good"/><p className="text-13">minutons gagnés au total</p>
        {news === 'level' && level && <LevelUpBanner passion={passion} step={level}/>}
        {news === 'milestone' && milestone && <MilestoneBanner milestone={milestone}/>}
        {news === 'challenge' && challenge && <ChallengeBanner word={challenge.word} count={new Set((done.response.stats.challenge ?? []).map(id => id.slice(-10))).size} onOpen={() => reset([...tabStack('learn'),{name:'challenge'}])}/>}
        {news === 'discovered' && <p>Nouvelle activité dans tes découvertes : {after.tried.length}/{collectionSize(passion)}</p>}
      </Fold>
      <Fold icon={<Lightbulb/>} title="Une petite découverte"><p>{fact}</p></Fold>
      <Fold icon={<Check/>} title="Donner mon avis sur cette activité"><RateActivity completionId={completionId} initial={done.response.completion.rating}/></Fold>
    </div>
  </Screen>

}

/**
 * Une étape de parcours réussie : une fête courte, puis l'étape d'après,
 * proposée tout de suite pour enchaîner d'un toucher, sans humeur ni attente.
 * Au bout d'un parcours : le badge, puis la première leçon du palier suivant.
 */
function StepDone({
  done,
  step,
  progress,
  paths,
  level,
  cheer,
}: {
  done: DoneResult
  step: PathStep
  progress: PathProgress
  paths: PathProgress[]
  level: LevelStep | null
  cheer: string
}) {
  const { state } = useAppState()
  const { reset } = useNavigation()
  const startLesson = useStartLesson()
  const { passion } = step
  const { path, finished } = progress
  // La suite : l'étape d'après, ou au bout du parcours, le palier suivant s'il est ouvert.
  const nextPath = finished ? paths.find((entry) => entry.path.tier === path.tier + 1 && entry.unlocked && !entry.finished) : undefined
  const upNext = state.me.user.passions.includes(passion) ? (finished ? nextPath?.next : progress.next) ?? null : null
  const openPath = () => reset([...tabStack('learn'), { name: 'learnPassion', passion: step.passion }, { name: 'path', pathId: (upNext ?? step).pathId }])

  return (
    <Screen className="items-center text-center flow-done">
      <div className="relative mt-6 flex h-28 w-28 items-center justify-center">
        <motion.div className="absolute -inset-16" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}>
          <Rays className="h-full w-full" />
        </motion.div>
        <Confetti count={finished ? 40 : 24} />
        {finished ? (
          <BadgePin pathId={path.id} earned size={104} animate />
        ) : (
          <motion.span
            className="flow-celebration relative flex h-24 w-24 items-center justify-center"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
          >
            <Mascot mood="cheer" size={116} className="mt-1" />
          </motion.span>
        )}
      </div>

      <motion.p className="mt-6 text-12 font-extrabold tracking-wider text-ink-soft uppercase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {getPassion(passion).label} · {path.title}
      </motion.p>
      <motion.h1
        className="mt-1 font-display text-34 leading-tight font-extrabold tracking-tight text-ink"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        {finished ? `Parcours terminé\u00A0!` : `Étape ${step.index}/${STEPS_PER_PATH} réussie\u00A0!`}
      </motion.h1>
      <motion.p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-15 text-ink-soft" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Badge variant="good" tilt="left">
          +{done.response.coinsEarned} minutons
        </Badge>
        {finished ? `Badge «\u00A0${path.badge}\u00A0» gagné.` : cheer}
      </motion.p>
      {level && (
        <motion.p className="mt-3 inline-flex items-center gap-2 text-14 font-bold text-ink" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 16 }}>
          <Sparkle size={16} color="var(--accent)" />
          Niveau {level.level} en {getPassion(passion).label}&nbsp;: {level.title}
        </motion.p>
      )}

      {/* L'ascension : les marches franchies du parcours. */}
      <div className="mt-6 flex w-full items-end gap-1.5 border-b-[2.5px] border-outline" aria-label={`${progress.done} étapes sur ${STEPS_PER_PATH}`} role="img">
        {path.steps.map((other, index) => (
          <motion.span
            key={other.id}
            className={cn('flex-1 rounded-t-[6px] border-[2.5px] border-b-0 border-outline', index < progress.done ? PASSION_COLORS[passion].bg : 'bg-card')}
            style={{ height: `${14 + index * 7}px` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3 + index * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
          />
        ))}
      </div>

      {/* La suite, tout de suite. */}
      {upNext ? (
        <Card
          tone={PASSION_COLORS[passion].card}
          className="mt-6 w-full gap-2 text-left shadow-pop"
          initial={{ opacity: 0, x: 40, rotate: 2 }}
          animate={{ opacity: 1, x: 0, rotate: -1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 240, damping: 20 }}
        >
          <CardEyebrow>
            <Sparkles aria-hidden="true" />
            {finished && nextPath ? `Palier suivant · parcours ${PATH_TIERS[nextPath.path.tier].toLowerCase()}` : `À suivre · étape ${upNext.index}/${STEPS_PER_PATH} · ${upNext.difficulty}`}
          </CardEyebrow>
          <span className="font-display text-22 leading-tight font-extrabold tracking-tight">{finished && nextPath ? `${nextPath.path.title} : ${upNext.title}` : upNext.title}</span>
          <span className="text-14 font-semibold">Tu travailles&nbsp;: {upNext.focus.charAt(0).toLowerCase() + upNext.focus.slice(1)}</span>
          <span className="inline-flex items-center gap-1.5 text-13 font-bold">
            {keyboardMelody(upNext.id) ? <Piano size={14} strokeWidth={2.4} aria-hidden="true" /> : <Clock3 size={14} strokeWidth={2.4} aria-hidden="true" />}
            {keyboardMelody(upNext.id) ? `Au clavier · «\u00A0${keyboardMelody(upNext.id)?.title}\u00A0»` : `${upNext.duration}\u00A0min`}
          </span>
        </Card>
      ) : (
        <motion.p className="mt-6 inline-flex items-center gap-2 text-15 font-semibold text-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <Mountain size={18} aria-hidden="true" />
          {finished ? 'Tu es au sommet de ce que l’appli propose ici. Chapeau.' : 'La suite t’attend dans le parcours.'}
        </motion.p>
      )}

      <div className="mt-auto flex w-full flex-col pt-6">
        <PrimaryAction
          text={upNext ? (finished ? 'Commencer le palier suivant' : 'Étape suivante') : 'Voir le parcours'}
          icon={upNext ? <Play aria-hidden="true" /> : <Mountain aria-hidden="true" />}
          onClick={() => (upNext ? startLesson(upNext, 'enchainement') : openPath())}
        >
          {upNext && (
            <Button variant="ghost" size="md" className="w-full" onClick={openPath}>
              <Mountain aria-hidden="true" />
              Revoir le parcours
            </Button>
          )}
        </PrimaryAction>
      </div>
    </Screen>
  )
}

/** Une ligne repliée (« Le savais-tu ? ») : un toucher l'ouvre. */
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
