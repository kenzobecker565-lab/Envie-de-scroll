import {LearningOverview} from '../learning/LearningScreens.tsx'
import { BookOpen, ChevronRight, Clock3, Settings, ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { AppHeader } from '../components/AppHeader.tsx'
import { BadgePin } from '../components/BadgePin.tsx'
import { finishedPathIds } from '../components/Paths.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { getPassion, passionLevel, PATHS, LEARNING_PASSIONS, type PassionId } from '@scroll-up/shared'
import { useEquipped } from '../lib/shop.ts'
import { ProfileDecoration } from '../components/ShopArt.tsx'
import { Screen } from '../components/Screen.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'

export { PassionHubScreen, PassionSpaceScreen } from './PassionWorkshop.tsx'

export function LearnScreen() { return <LearningOverview/> }
export function LearnPassionScreen({ passion }: { passion: PassionId }) {return <LearningOverview passion={passion}/>}

export function ProfileScreen() {
 const {state}=useAppState(),{push}=useNavigation(),{user,stats}=state.me
 const decoration=useEquipped('profile')
 const best=[...stats.byPassion].sort((a,b)=>b.coins-a.coins)[0]
 const bestPassion=best?.passion??user.passions[0]??'piano', level=passionLevel(bestPassion,best?.coins??0)
 const earned=finishedPathIds(stats.byPassion)
 const badges=PATHS.filter(path=>earned.includes(path.id)).slice(0,5)
 return <Screen tabs className="studio-profile"><AppHeader settings onSettings={()=>push({name:'settings'})}/><section className="studio-profile-hero"><Mascot pose="cheer" size={180}/><div className="studio-profile-copy"><h1>{user.firstName||'Mon profil'}</h1><span className="studio-level">Niveau {level.level}</span><span className="studio-level-passion">{getPassion(bestPassion).label}</span><div className="studio-profile-gauge"><span className="studio-gauge"><i style={{width:`${level.progress*100}%`}}/></span><small>{best?.coins??0}{level.next?` / ${level.next.minutes}`:' · max'} minutons</small></div></div></section><div className="studio-profile-stats"><div><Zap size={27}/><span><strong>{stats.totalActivities}</strong><small>activités</small></span></div><div><Clock3 size={27}/><span><strong>{stats.monthMinutes}</strong><small>min de séance ce mois</small></span></div></div>{badges.length > 0 && <section className="studio-profile-badges"><div className="studio-section-heading"><h2>Mes badges</h2><button type="button" onClick={()=>push({name:'progress'})}>Tout voir<ChevronRight size={14}/></button></div><div className="studio-badge-row">{badges.map(path=><button type="button" key={path.id} onClick={()=>push(LEARNING_PASSIONS.some(id=>id===path.passion)?{name:'learnPassion',passion:path.passion}:{name:'learn'})} aria-label={`${path.badge}, ${earned.includes(path.id)?'gagné':'à débloquer'}`}><BadgePin pathId={path.id} earned={earned.includes(path.id)} size={56}/></button>)}</div><p className="text-12 text-ink-soft">Tes badges gagnés dans les premiers parcours sont conservés.</p></section>}<button type="button" className="studio-setting-row" onClick={()=>push({name:'learn'})}><BookOpen size={21}/><span>Mes leçons et ma progression</span><ChevronRight size={19}/></button>{decoration&&<div className="mt-4"><ProfileDecoration item={decoration} compact/></div>}<button type="button" className="studio-setting-row" onClick={()=>push({name:'shop',library:true})}><ShoppingBag size={21}/><span>Mes achats et personnalisations</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'challenge'})}><Sparkles size={21}/><span>Le mot du jour</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'settings'})}><Settings size={21}/><span>Mes réglages</span><ChevronRight size={19}/></button></Screen>
}
