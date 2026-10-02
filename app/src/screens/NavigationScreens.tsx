import { useState } from 'react'
import { getPassion, PASSION_IDS, type PassionId } from '@scroll-up/shared'
import { useEquipped } from '../lib/shop.ts'
import { ProfileDecoration } from '../components/ShopArt.tsx'
import { Button } from '@/components/ui/button'
import { Screen } from '../components/Screen.tsx'
import { PassionCard, PassionDetail, statsFor } from '../components/Progression.tsx'
import { ProjectsSection } from '../components/Projects.tsx'
import { SettingsContent, EraseDialog } from '../components/SettingsSheet.tsx'
import { FeedbackDialog } from '../components/FeedbackDialog.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'

export function PassionHubScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const { user, stats, projects } = state.me
  const passions = PASSION_IDS.filter((id) => user.passions.includes(id) || stats.byPassion.some((row) => row.passion === id) || projects.some((project) => project.passion === id))
  return <Screen tabs>
    <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">Mes passions</h1>
    <p className="mt-2 text-15 text-ink-soft">Choisis une passion pour retrouver ses créations, ses découvertes et ses projets.</p>
    <div className="mt-6 flex flex-col gap-4">
      {passions.map((passion, index) => <PassionCard key={passion} passion={passion} index={index} stats={statsFor(stats.byPassion, passion)} onOpen={() => push({ name: 'passionSpace', passion })} />)}
      <Button variant="secondary" onClick={() => push({ name: 'passions', mode: 'edit' })}>Gérer mes passions</Button>
    </div>
  </Screen>
}

export function PassionSpaceScreen({ passion }: { passion: PassionId }) {
  const { state } = useAppState()
  const { push, reset } = useNavigation()
  const [section, setSection] = useState<'overview' | 'collection' | 'projects'>('overview')
  const sections = [{ id: 'overview', label: 'Aperçu' }, { id: 'collection', label: 'Découvertes' }, { id: 'projects', label: 'Projets' }] as const
  return <Screen tabs>
    <Button variant="ghost" size="sm" onClick={() => reset([{ name: 'home' }, { name: 'passionHub' }])}>Toutes mes passions</Button>
    <h1 className="mt-3 font-display text-46 font-extrabold tracking-tight text-ink">{getPassion(passion).label}</h1>
    <div className="mt-5 grid grid-cols-2 gap-2" aria-label="Rubriques de la passion">
      {sections.map(({ id, label }) => <Button key={id} variant={section === id ? 'default' : 'secondary'} aria-pressed={section === id} onClick={() => setSection(id)}>{label}</Button>)}
    </div>
    <Button className="mt-3" variant="secondary" onClick={() => push({ name: 'gallery', passion })}>Mes créations</Button>
    <div className="mt-6 flex flex-col gap-5">
      {section === 'projects' ? <ProjectsSection passion={passion} /> : <PassionDetail passion={passion} stats={statsFor(state.me.stats.byPassion, passion)} section={section} canStart={state.me.user.passions.includes(passion)} onOpenPath={(pathId) => push({ name: 'path', pathId })} onChangeSkill={() => push({ name: 'skill', passion, mode: 'edit' })} />}
    </div>
  </Screen>
}

export function LearnScreen() {
  const { state } = useAppState()
  const { push } = useNavigation()
  const { user, stats } = state.me
  const passions = PASSION_IDS.filter((id) => user.passions.includes(id) || stats.byPassion.some((row) => row.passion === id && row.steps.length > 0))
  return <Screen tabs>
    <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">Apprendre</h1>
    <p className="mt-2 text-15 text-ink-soft">Choisis une passion et avance à ton rythme, une leçon à la fois.</p>
    <div className="mt-6 flex flex-col gap-4">
      {passions.map((passion, index) => <PassionCard key={passion} passion={passion} index={index} stats={statsFor(stats.byPassion, passion)} onOpen={() => push({ name: 'learnPassion', passion })} />)}
      {passions.length === 0 && <Button variant="secondary" onClick={() => push({ name: 'passions', mode: 'edit' })}>Choisir mes passions</Button>}
    </div>
  </Screen>
}

export function LearnPassionScreen({ passion }: { passion: PassionId }) {
  const { state } = useAppState()
  const { push, reset } = useNavigation()
  return <Screen tabs>
    <Button variant="ghost" size="sm" onClick={() => reset([{ name: 'home' }, { name: 'learn' }])}>Toutes les passions à apprendre</Button>
    <h1 className="mt-3 font-display text-46 font-extrabold tracking-tight text-ink">{getPassion(passion).label}</h1>
    <p className="mt-2 text-15 text-ink-soft">Des leçons progressives, de l’échauffement au défi final.</p>
    {passion === 'piano' && <Button className="mt-4" variant="secondary" onClick={() => push({ name: 'shop', category: 'piano', library: true })}>Mon répertoire bonus</Button>}
    <div className="mt-6 flex flex-col gap-5">
      <PassionDetail passion={passion} stats={statsFor(state.me.stats.byPassion, passion)} section="paths" canStart={false} onOpenPath={(pathId) => push({ name: 'path', pathId })} onChangeSkill={() => push({ name: 'skill', passion, mode: 'edit' })} />
    </div>
  </Screen>
}

export function ProfileScreen() {
  const decoration = useEquipped('profile')
  const { push } = useNavigation()
  const [feedback, setFeedback] = useState(false)
  const [erase, setErase] = useState(false)
  return <Screen tabs>
    <h1 className="font-display text-46 font-extrabold tracking-tight text-ink">Profil</h1>
    <div className="mt-5"><ProfileDecoration item={decoration} /></div>
    <Button className="mt-4" variant="secondary" onClick={() => push({ name: 'shop', library: true })}>Mes achats et personnalisations</Button>
    <p className="mt-2 text-15 text-ink-soft">Tes préférences, tes relances et tes données.</p>
    <div className="mt-6 flex flex-col gap-5">
      <SettingsContent embedded onEditPassions={() => push({ name: 'passions', mode: 'edit' })} onFeedback={() => setFeedback(true)} onErase={() => setErase(true)} />
    </div>
    <FeedbackDialog open={feedback} onOpenChange={setFeedback} context="réglages" />
    <EraseDialog open={erase} onOpenChange={setErase} />
  </Screen>
}
