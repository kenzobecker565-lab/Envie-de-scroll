import '../components/Carnet.css'
import {LearningOverview} from '../learning/LearningScreens.tsx'
import { BookOpen, ChevronRight, Clock3, Settings, ShoppingBag, Images, Zap } from 'lucide-react'
import {CarnetHeader} from '../components/CarnetHeader.tsx'
import {PassionArtwork} from '../components/PassionArtwork.tsx'
import { BadgePin } from '../components/BadgePin.tsx'
import { finishedPathIds } from '../components/Paths.tsx'
import { getPassion, experience, PATHS, LEARNING_PASSIONS, type PassionId } from '@scroll-up/shared'
import { useEquipped } from '../lib/shop.ts'
import { ProfileDecoration } from '../components/ShopArt.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'

export { PassionHubScreen, PassionSpaceScreen } from './PassionWorkshop.tsx'

export function LearnScreen() { return <LearningOverview/> }
export function LearnPassionScreen({ passion }: { passion: PassionId }) {return <LearningOverview passion={passion}/>}

export function ProfileScreen() {
 const {state}=useAppState(),{push,back}=useNavigation(),{user,stats}=state.me
 const decoration=useEquipped('profile')
 const best=[...stats.byPassion].sort((a,b)=>b.minutes-a.minutes)[0]
 const bestPassion=best?.passion??user.passions[0]??'piano', level=experience(bestPassion,best?.minutes??0)
 const earned=finishedPathIds(stats.byPassion)
 const badges=PATHS.filter(path=>earned.includes(path.id)).slice(0,5)
 return <Screen tabs className="studio-profile carnet-page carnet-profile harmonized-profile"><CarnetHeader title="Mon profil" subtitle={user.firstName||'Ton espace personnel'} pose="cheer" variant="banner" onBack={back}/>
 <section className="profile-experience" aria-label="Mon expérience"><div className="studio-section-heading"><h2>Mon expérience</h2><span className="profile-level">{getPassion(bestPassion).label} · Niveau {level.level}</span></div><div className="profile-xp"><span className="studio-gauge"><i style={{width:`${level.progress*100}%`}}/></span><strong>{level.xp}{level.nextXp?` / ${level.nextXp}`:' · max'} XP</strong></div><div className="studio-profile-stats"><div><Zap size={25}/><span><strong>{stats.totalActivities}</strong><small>activités</small></span></div><div><Clock3 size={25}/><span><strong>{stats.monthMinutes} min</strong><small>de séance ce mois</small></span></div></div></section>
 <section className="profile-passions"><h2>Mes passions</h2><div>{user.passions.map(id=>{const row=stats.byPassion.find(item=>item.passion===id),xp=experience(id,row?.minutes??0);return <button type="button" key={id} onClick={()=>push({name:'passionSpace',passion:id})}><PassionArtwork passion={id}/><strong>{getPassion(id).label}</strong><small>Niveau {xp.level}</small><span className="studio-gauge"><i style={{width:`${xp.progress*100}%`}}/></span></button>})}</div></section>
 {badges.length>0&&<section className="studio-profile-badges"><div className="studio-section-heading"><h2>Mes badges</h2><button type="button" onClick={()=>push({name:'progress'})}>Tout voir<ChevronRight size={14}/></button></div><div className="studio-badge-row">{badges.map(path=><button type="button" key={path.id} onClick={()=>push(LEARNING_PASSIONS.some(id=>id===path.passion)?{name:'learnPassion',passion:path.passion}:{name:'learn'})} aria-label={`${path.badge}, gagné`}><BadgePin pathId={path.id} earned size={56}/></button>)}</div></section>}
 <h2>Mes raccourcis</h2><div className="profile-shortcuts"><button type="button" className="studio-setting-row" onClick={()=>push({name:'passionHub'})}><BookOpen size={21}/><span>Mes passions et mes leçons</span><ChevronRight size={19}/></button>{decoration&&<ProfileDecoration item={decoration} compact/>}<button type="button" className="studio-setting-row" onClick={()=>push({name:'shop',library:true})}><ShoppingBag size={21}/><span>Mes tenues</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'gallery'})}><Images size={21}/><span>Ma galerie</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" data-tour-target="settings" onClick={()=>push({name:'settings'})}><Settings size={21}/><span>Mes réglages</span><ChevronRight size={19}/></button></div></Screen>
}
