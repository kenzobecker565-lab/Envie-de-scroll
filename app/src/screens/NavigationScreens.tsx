import { Check, ChevronRight, Clock3, Lock, Settings, ShoppingBag, Sparkles, Zap } from 'lucide-react'
import { AppHeader } from '../components/AppHeader.tsx'
import { BadgePin } from '../components/BadgePin.tsx'
import { currentPath, featuredPath, finishedPathIds } from '../components/Paths.tsx'
import { useStartLesson } from '../lib/useLesson.ts'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { useState } from 'react'
import { getPassion, passionLevel, PATHS, type PassionId } from '@scroll-up/shared'
import { useEquipped } from '../lib/shop.ts'
import { ProfileDecoration } from '../components/ShopArt.tsx'
import { Button } from '@/components/ui/button'
import { Screen } from '../components/Screen.tsx'
import { PassionDetail, statsFor } from '../components/Progression.tsx'
import { useAppState, useNavigation } from '../state/AppState.tsx'

export { PassionHubScreen, PassionSpaceScreen } from './PassionWorkshop.tsx'

export function LearnScreen() {
 const {state}=useAppState(),{push}=useNavigation(),startLesson=useStartLesson()
 const {user,stats}=state.me
 const initial=featuredPath(user.passions,id=>statsFor(stats.byPassion,id).steps,id=>passionLevel(id,statsFor(stats.byPassion,id).minutes).level,user.skills)
 const [selected,setSelected]=useState<PassionId|undefined>(initial?.progress.path.passion??user.passions[0])
 const passion=selected&&user.passions.includes(selected)?selected:user.passions[0]
 const row=passion?statsFor(stats.byPassion,passion):null
 const progress=passion&&row?currentPath(passion,row.steps,passionLevel(passion,row.minutes).level,user.skills[passion]):null
 return <Screen tabs className="studio-learn"><AppHeader/><h1 className="studio-page-title">Apprendre</h1>{progress?<article className="studio-learning-card"><div className="studio-learning-hero"><PassionArtwork passion={progress.path.passion}/><span className="studio-learning-character"><Mascot size={135}/></span><div className="studio-learning-title"><span className="studio-tag">{getPassion(progress.path.passion).label}</span><h2>{progress.path.title}</h2></div></div><div className="studio-learning-body"><p className="studio-learning-count">{progress.finished?'Parcours terminé':`Étape ${progress.next?.index??1} sur ${progress.path.steps.length}`}</p><div className="studio-learning-gauge"><i style={{width:`${progress.done/progress.path.steps.length*100}%`}}/></div><ol className="studio-lesson-list">{progress.path.steps.map(step=>{const done=step.index<=progress.done, current=step.index===progress.next?.index;return <li key={step.id}><button type="button" disabled={!done&&!current} aria-current={current?'step':undefined} onClick={()=>startLesson(step,'parcours')}><span className={`studio-step-number ${done?'is-done':''}`}>{done?<Check size={17}/>:current?step.index:<Lock size={14}/>}</span><span>{step.title}</span><ChevronRight size={16}/></button></li>})}</ol><Button className="studio-continue" onClick={()=>progress.next?startLesson(progress.next,'parcours'):push({name:'path',pathId:progress.path.id})}>{progress.finished?'Revoir le parcours':progress.done?'Continuer':'Commencer'}<ChevronRight/></Button></div></article>:<Button className="mt-5" onClick={()=>push({name:'passions',mode:'edit'})}>Choisir une passion</Button>}{user.passions.length>1&&<div className="studio-learn-passions" aria-label="Passion à apprendre">{user.passions.map(id=><button type="button" key={id} aria-pressed={id===passion} onClick={()=>setSelected(id)}>{getPassion(id).label}</button>)}</div>}{passion&&<button type="button" className="studio-all-paths" onClick={()=>push({name:'learnPassion',passion})}>Tous les parcours {getPassion(passion).label}<ChevronRight size={16}/></button>}</Screen>
}

export function LearnPassionScreen({ passion }: { passion: PassionId }) {
  const { state } = useAppState()
  const { push, reset } = useNavigation()
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
 return <Screen tabs className="studio-profile"><AppHeader settings onSettings={()=>push({name:'settings'})}/><section className="studio-profile-hero"><Mascot size={180}/><div className="studio-profile-copy"><h1>{user.firstName||'Mon profil'}</h1><span className="studio-level">Niveau {level.level}</span><span className="studio-level-passion">{getPassion(bestPassion).label}</span><div className="studio-profile-gauge"><span className="studio-gauge"><i style={{width:`${level.progress*100}%`}}/></span><small>{best?.minutes??0}{level.next?` / ${level.next.minutes}`:' · max'}</small></div></div></section><div className="studio-profile-stats"><div><Zap size={27}/><span><strong>{stats.totalActivities}</strong><small>activités</small></span></div><div><Clock3 size={27}/><span><strong>{stats.monthCoins}</strong><small>min ce mois</small></span></div></div><section className="studio-profile-badges"><div className="studio-section-heading"><h2>Mes badges</h2><button type="button" onClick={()=>push({name:'progress'})}>Tout voir<ChevronRight size={14}/></button></div><div className="studio-badge-row">{badges.map(path=><button type="button" key={path.id} onClick={()=>push({name:'path',pathId:path.id})} aria-label={`${path.badge}, ${earned.includes(path.id)?'gagné':'à débloquer'}`}><BadgePin pathId={path.id} earned={earned.includes(path.id)} size={56}/></button>)}</div></section>{decoration&&<div className="mt-4"><ProfileDecoration item={decoration} compact/></div>}<button type="button" className="studio-setting-row" onClick={()=>push({name:'shop',library:true})}><ShoppingBag size={21}/><span>Mes achats et personnalisations</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'challenge'})}><Sparkles size={21}/><span>Le mot du jour</span><ChevronRight size={19}/></button><button type="button" className="studio-setting-row" onClick={()=>push({name:'settings'})}><Settings size={21}/><span>Mes réglages</span><ChevronRight size={19}/></button></Screen>
}
