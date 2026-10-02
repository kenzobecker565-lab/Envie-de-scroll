import { useState } from 'react'
import { ArrowRight, ArrowUpRight, ShoppingBag } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { getPassion, getPathStep, isFixedActivityId, passionLevel, PASSION_IDS, STEPS_PER_PATH, type PassionId } from '@scroll-up/shared'
import { PRESSED } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { BrandMark, Logo } from '../components/Brand.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { dayPeriod } from '../components/decor/Ornaments.tsx'
import { challengePassions, todayKey, wordDone } from '../components/Challenge.tsx'
import { currentPath, featuredPath } from '../components/Paths.tsx'
import { ProjectSheet } from '../components/Projects.tsx'
import { ProjectCoverArtwork } from '../components/ShopArt.tsx'
import { statsFor } from '../components/Progression.tsx'
import { track } from '../api/client.ts'
import { Screen } from '../components/Screen.tsx'
import { AmbientButton } from '../components/AmbientButton.tsx'
import { useEquipped, useShop } from '../lib/shop.ts'
import { formatNumber, plural } from '../lib/format.ts'
import { lessonStack } from '../lib/useLesson.ts'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation, type Route } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import './HomeScreen.css'
import { useAppearance } from '../lib/appearance.ts'
import { AppearancePicker } from '../components/AppearancePicker.tsx'
import { PassionArtwork as IllustratedPassion } from '../components/PassionArtwork.tsx'

/** Pulse : une action principale, puis apprentissage, mois et projet par passion. */
export function HomeScreen() {
  const { state, dispatch } = useAppState()
  const { push, reset } = useNavigation()
  const shop = useShop()
  const cover = useEquipped('cover')
  const { scene } = useAppearance()
  const actualPeriod = dayPeriod(new Date().getHours())
  const sceneLabel = { morning: 'Lumière du matin', day: 'Énergie du jour', dusk: 'Heure dorée', night: 'Sous les aurores' }[scene]

  const { user, stats, openProposal, projects } = state.me
  const passions = PASSION_IDS.filter((id) => user.passions.includes(id) || stats.byPassion.some((row) => row.passion === id) || projects.some((project) => project.passion === id))
  const recommended = featuredPath(user.passions, (id) => statsFor(stats.byPassion, id).steps, (id) => passionLevel(id, statsFor(stats.byPassion, id).minutes).level, user.skills)
  const [selection, setSelection] = useState<PassionId | undefined>(openProposal?.passion ?? recommended?.progress.path.passion ?? passions[0])
  const passion = selection && passions.includes(selection) ? selection : passions[0]
  const [projectId, setProjectId] = useState<string>()
  const passionStats = passion ? statsFor(stats.byPassion, passion) : null
  const learning = passion && passionStats ? currentPath(passion, passionStats.steps, passionLevel(passion, passionStats.minutes).level, user.skills[passion]) : null
  const project = [...projects].filter((entry) => entry.passion === passion).sort((a, b) => Number(Boolean(a.finishedAt)) - Number(Boolean(b.finishedAt)) || b.createdAt.localeCompare(a.createdAt))[0]
  const Icon = passion ? PASSION_ICONS[passion] : null
  const period = actualPeriod
  const hello = period === 'dusk' || period === 'night' ? 'Bonsoir' : 'Bonjour'
  const wordToday = challengePassions(user.passions).length > 0 && !wordDone(todayKey(), stats.challenge ?? [])

  const open = (route: Route) => { haptics.impact('light'); push(route) }
  const start = () => {
    haptics.impact('heavy')
    track('cta')
    dispatch({ type: 'newFlow' })
    push({ name: 'signal' })
  }
  const resume = () => {
    if (!openProposal) return
    haptics.impact('light')
    dispatch({ type: 'newFlow', flow: { mood: openProposal.mood ?? undefined, duration: openProposal.duration, passion: openProposal.passion, proposal: openProposal, ...(isFixedActivityId(openProposal.activityId) ? { fixedStep: openProposal.activityId } : {}) } })
    const lesson = getPathStep(openProposal.activityId)
    reset(lesson ? lessonStack(lesson, { name: 'activity' }) : [{ name: 'home' }, { name: 'activity' }])
  }

  return (
    <Screen tabs className={`pulse-home club-home scene-${scene}`}>

      <header className="pulse-header">
        <Logo height={30} />
        <div className="pulse-tools">
          <AmbientButton />
          <motion.button type="button" className="pulse-wallet" whileTap={PRESSED} onClick={() => open({ name: 'shop' })} aria-label={`Boutique : ${formatNumber(shop.balance)} minutons disponibles`}>
            <span>{formatNumber(shop.balance)}</span><BrandMark size={24} />
          </motion.button>
        </div>
      </header>

      <section className="pulse-hero club-hero" aria-labelledby="pulse-start-title">
        <div className="club-hero-copy"><p className="pulse-eyebrow">{sceneLabel}</p><h1 id="pulse-start-title"><span className="club-hello">{hello}</span><span className="club-name">{user.firstName || 'à toi'}<span className="club-dot">.</span></span></h1><span className="club-daily">{openProposal ? 'Une création t’attend' : 'Ta prochaine pause commence ici'}</span></div>
        <button type="button" className="club-minuton" onClick={() => open({ name: 'shop', category: 'mascot' })} aria-label="Personnaliser la tenue de Minuton"><span className="club-orbit" /><Mascot mood="wink" size={152} /><span className="club-mascot-tag">Ton Minuton ↗</span></button>
        <motion.button type="button" className="pulse-start" whileTap={PRESSED} onClick={openProposal ? resume : start}>
          <span>{openProposal ? 'Reprendre mon activité' : 'J’ai envie de scroller'}</span><ArrowUpRight size={22} aria-hidden="true" />
        </motion.button>
        {stats.totalActivities === 0 && <p className="pulse-first-time">Un temps, une passion, et une première création.</p>}
      </section>

      {openProposal && <motion.button type="button" className="pulse-resume" whileTap={PRESSED} onClick={resume}>
        <span><span className="pulse-eyebrow">Ton activité en cours · {getPassion(openProposal.passion).label}</span><span className="pulse-resume-title">{openProposal.text}</span><span className="pulse-link">Reprendre →</span></span>
        <ArrowRight size={20} aria-hidden="true" />
      </motion.button>}

      <section aria-labelledby="pulse-passions-title">
        <div className="pulse-section-head">
          <h2 id="pulse-passions-title">Tes passions</h2>
          <button type="button" className="pulse-text-button" onClick={() => open({ name: 'passionHub' })}>Tout voir <ArrowUpRight size={14} aria-hidden="true" /></button>
        </div>
        {passions.length > 0 ? <div className="pulse-passions" aria-label="Choisir une passion">
          {passions.map((id) => {
            const PassionIcon = PASSION_ICONS[id]
            const selected = passion === id
            return <motion.button key={id} type="button" className="pulse-passion" data-passion={id} aria-pressed={selected} aria-controls="pulse-learning pulse-project" whileTap={{ scale: .96 }} onClick={() => { haptics.selection(); setSelection(id) }}>
              {selected && <motion.span className="pulse-passion-active" layoutId="pulse-passion-active" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
              <span className="club-passion-art" aria-hidden="true"><IllustratedPassion passion={id} /></span><motion.span className="pulse-passion-icon" aria-hidden="true" animate={{ rotate: selected ? -8 : 0, scale: selected ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 350, damping: 18 }}><PassionIcon size={18} strokeWidth={2.2} /></motion.span>
              <span className="pulse-passion-label">{getPassion(id).label}<span className="club-passion-count">{statsFor(stats.byPassion, id).activities} activités · niv. {passionLevel(id, statsFor(stats.byPassion, id).minutes).level}</span></span>
            </motion.button>
          })}
        </div> : <button type="button" className="pulse-choose" onClick={() => open({ name: 'passions', mode: 'edit' })}>Choisir mes passions <ArrowRight size={18} aria-hidden="true" /></button>}

        <div className="pulse-bento">
          <div id="pulse-learning" className="pulse-learning-slot" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.button key={passion ?? 'empty'} type="button" className="pulse-tile pulse-learning" initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -7 }} transition={{ duration: .16 }} whileTap={PRESSED}
                onClick={() => learning ? open({ name: 'path', pathId: learning.path.id }) : passion ? open({ name: 'learnPassion', passion }) : open({ name: 'learn' })}
                aria-label={learning ? `${learning.done > 0 && !learning.finished ? 'Continuer' : learning.finished ? 'Revoir' : 'Commencer'} ${learning.path.title}, ${getPassion(learning.path.passion).label}${learning.next ? `, étape ${learning.next.index} : ${learning.next.title}` : ''}` : 'Choisir une passion à apprendre'}>
                <div>
                  <p className="pulse-eyebrow">Apprendre{passion && ` · ${getPassion(passion).label}`}</p>
                  <PassionArtwork passion={passion} />
                  <h3>{learning ? learning.path.title : 'Une passion à découvrir'}</h3>
                </div>
                <span className="pulse-lesson-footer"><span>{learning?.next ? `Étape ${learning.next.index} / ${STEPS_PER_PATH} · ${learning.next.duration} min` : learning?.finished ? 'Parcours terminé · revoir' : 'À ton rythme'}</span><ArrowUpRight size={18} aria-hidden="true" /></span>
              </motion.button>
            </AnimatePresence>
          </div>
          <motion.button type="button" className="pulse-tile pulse-month" whileTap={PRESSED} onClick={() => open({ name: 'progress' })} aria-label={`Ma progression : ${plural(stats.monthActivities, 'activité réalisée', 'activités réalisées')} ce mois`}>
            <p className="pulse-eyebrow">Ce mois</p>
            <strong className="pulse-stat">{formatNumber(stats.monthActivities)}</strong>
            <span className="pulse-tile-caption">{stats.monthActivities === 1 ? 'activité réalisée' : 'activités réalisées'} <ArrowUpRight size={14} aria-hidden="true" /></span>
          </motion.button>
          <motion.button type="button" className="pulse-tile pulse-shop" whileTap={PRESSED} onClick={() => open({ name: 'shop' })}>
            <span className="pulse-shop-icons"><ShoppingBag size={22} aria-hidden="true" /><ArrowUpRight size={18} aria-hidden="true" /></span>
            <h3>Tes envies</h3>
            <span className="pulse-tile-caption">{formatNumber(shop.balance)} <BrandMark size={19} /><span className="sr-only">Minutons</span> disponibles</span>
          </motion.button>
        </div>
      </section>

      <section id="pulse-project" aria-labelledby="pulse-project-title" aria-live="polite">
        <div className="pulse-section-head"><h2 id="pulse-project-title">À retrouver</h2><button type="button" className="pulse-text-button" onClick={() => passion ? open({ name: 'passionSpace', passion }) : open({ name: 'passionHub' })}>Ma passion <ArrowUpRight size={14} aria-hidden="true" /></button></div>
        <motion.button key={project?.id ?? passion ?? 'gallery'} type="button" className="pulse-project" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2 }} whileTap={PRESSED} aria-haspopup={project ? 'dialog' : undefined} onClick={() => { if (project) { haptics.impact('light'); setProjectId(project.id) } else { open({ name: 'gallery', passion }) } }}>
          <span className="pulse-project-cover">{project?.coverUrl ? <img src={project.coverUrl} alt="" loading="lazy" /> : cover && Icon ? <ProjectCoverArtwork item={cover} icon={Icon} /> : Icon ? <Icon size={28} aria-hidden="true" /> : <BrandMark size={34} />}</span>
          <span className="pulse-project-copy"><span className="pulse-eyebrow">{passion ? getPassion(passion).label : 'Mes passions'} · {project ? project.finishedAt ? 'projet terminé' : 'projet en cours' : 'mes créations'}</span><strong>{project?.name ?? 'Ta galerie'}</strong><span className="pulse-link">{project ? 'Ouvrir le projet' : passionStats?.activities ? 'Retrouver mes créations' : 'Découvrir ma galerie'} <ArrowRight size={14} aria-hidden="true" /></span></span>
        </motion.button>
      </section>
      <AppearancePicker />
      <div className="pulse-summary"><span>{formatNumber(stats.totalCoins)} Minutons gagnés au total</span>{wordToday && <button type="button" className="pulse-text-button" onClick={() => open({ name: 'challenge' })}>Mot du jour <ArrowUpRight size={14} aria-hidden="true" /></button>}</div>
      <Dialog open={Boolean(projectId)} onOpenChange={(isOpen) => { if (!isOpen) setProjectId(undefined) }}><DialogContent>{projectId && <ProjectSheet key={projectId} id={projectId} onClose={() => setProjectId(undefined)} />}</DialogContent></Dialog>
    </Screen>
  )
}

function PassionArtwork({ passion }: { passion?: PassionId }) {
  const Icon = passion ? PASSION_ICONS[passion] : null
  return <span className="pulse-art" aria-hidden="true">{passion === 'piano' ? <span className="pulse-keys">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</span> : <span className="pulse-art-card">{Icon ? <Icon size={42} strokeWidth={1.8} /> : <BrandMark size={54} />}</span>}</span>
}
