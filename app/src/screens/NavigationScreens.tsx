import { SportLearning } from './SportSession.tsx'
import { WorkshopLearningOverview, WorkshopLearning } from './WorkshopLearning.tsx'
import { ChevronRight, Clock3, Settings, ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { AppHeader } from '../components/AppHeader.tsx'
import { BadgePin } from '../components/BadgePin.tsx'
import { finishedPathIds } from '../components/Paths.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { isWorkshop, getPassion, passionLevel, PATHS, type PassionId } from '@scroll-up/shared'
import { useEquipped } from '../lib/shop.ts'
import { ProfileDecoration } from '../components/ShopArt.tsx'
import { Button } from '@/components/ui/button'
import { Screen } from '../components/Screen.tsx'
import { PassionDetail, statsFor } from '../components/Progression.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'

export { PassionHubScreen, PassionSpaceScreen } from './PassionWorkshop.tsx'

export function LearnScreen() { return <WorkshopLearningOverview/> }

export function LearnPassionScreen({ passion }: { passion: PassionId }) {
  const { state } = useAppState()
  const { push, reset } = useNavigation()
  if (passion==='sport') return <SportLearning/>
  if (isWorkshop(passion)) return <WorkshopLearning passion={passion}/>
  return <Screen tabs>
    <Button variant="ghost" size="sm" onClick={() => reset([{ name: 'home' }, { name: 'learn' }])}>Toutes les passions à apprendre</Button>
    <PassionArtwork passion={passion} className="da-passion-banner" /><h1 className="mt-3 font-display text-46 font-extrabold tracking-tight text-ink">{getPassion(passion).label}</h1>
    <p className="mt-2 text-15 text-ink-soft">Des leçons progressives, de l’échauffement au défi final.</p>
    {passion === 'piano' && <Button className="mt-4" variant="secondary" onClick={() => push({ name: 'shop', category: 'piano', library: true })}>Mon répertoire bonus</Button>}
    <div className="mt-6 flex flex-col gap-5">
      <PassionDetail passion={passion} stats={statsFor(state.me.stats.byPassion, passion)} section="paths" canStart={false} onOpenPath={(pathId) => push({ name: 'path', pathId })} onChangeSkill={() => push({ name: 'skill', passion, mode: 'edit' })} />
    </div>
  </Screen>
}

export function ProfileScreen() {
 const {state}=useAppState(),{push}=useNavigation(),{user,stats}=state.me
 const decoration=useEquipped('profile')
 const best=[...stats.byPassion].sort((a,b)=>b.minutes-a.minutes)[0]
 const bestPassion=best?.passion??user.passions[0]??'piano', level=passionLevel(bestPassion,best?.minutes??0)
 const earned=finishedPathIds(stats.byPassion)
 const badges=[...PATHS].sort((a,b)=>Number(earned.includes(b.id))-Number(earned.includes(a.id))).slice(0,5)
 return <Screen tabs className="studio-profile"><AppHeader settings onSettings={()=>push({name:'settings'})}/><section className="studio-profile-hero"><Mascot pose="cheer" size={180}/><div className="studio-profile-copy"><h1>{user.firstName||'Mon profil'}</h1><span className="studio-level">Niveau {level.level}</span><span className="studio-level-passion">{getPassion(bestPassion).label}</span><div className="studio-profile-gauge"><span className="studio-gauge"><i style={{width:`${level.progress*100}%`}}/></span><small>{best?.minutes??0}{level.next?` / ${level.next.minutes}`:' · max'}</small></div></div></section><div className="studio-profile-stats"><div><Zap size={27}/><span><strong>{stats.totalActivities}</strong><small>activités</small></span></div><div><Clock3 size={27}/><span><strong>{stats.monthCoins}</strong><small>min ce mois</small></span></div></div><section className="studio-profile-badges"><div className="studio-section-heading"><h2>Mes badges</h2><button type="button" onClick={()=>push({name:'progress'})}>Tout voir<ChevronRight size={14}/></button></div><div className="studio-badge-row">{badges.map(path=><button type="button" key={path.id} onClick={()=>push({name:'path',pathId:path.id})} aria-label={`${path.badge}, ${earned.includes(path.id)?'gagné':'à débloquer'}`}><BadgePin pathId={path.id} earned={earned.includes(path.id)} size={56}/></button>)}</div></section>{decoration&&<div className="mt-4"><ProfileDecoration item={decoration} compact/></div>}<button type="button" className="studio-setting-row" onClick={()=>push({name:'shop',library:true})}><ShoppingBag size={21}/><span>Mes achats et personnalisations</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'challenge'})}><Sparkles size={21}/><span>Le mot du jour</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'settings'})}><Settings size={21}/><span>Mes réglages</span><ChevronRight size={19}/></button></Screen>
}
