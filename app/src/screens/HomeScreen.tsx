import { ArrowUpRight, BookOpen, ChevronRight, Images } from 'lucide-react'
import { ACTIVE_PASSION_IDS, dailyWord, getPassion, getPathStep, isFixedActivityId } from '@scroll-up/shared'
import { Screen } from '../components/Screen.tsx'
import { Logo, BrandMark } from '../components/Brand.tsx'
import { ScrollCallToAction } from '../components/ScrollCallToAction.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { todayKey, wordDone } from '../components/Challenge.tsx'
import { useLearning } from '../learning/useLearning.ts'
import { useAppearance } from '../lib/appearance.ts'
import { useShop } from '../lib/shop.ts'
import { formatNumber } from '../lib/format.ts'
import { lessonStack } from '../lib/useLesson.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import { track } from '../api/client.ts'
import './HomeScreen.css'

/** The approved third home, “Le déclic”. All changes stay on this screen. */
export function HomeScreen() {
 const {state,dispatch}=useAppState(), {push,reset}=useNavigation(), {scene}=useAppearance()
 const {user,stats,openProposal}=state.me
 const shop=useShop(), today=todayKey(), {word}=dailyWord(today)
 const doneToday=wordDone(today,stats.challenge??[])
 const {items:learningEntries}=useLearning()
 const learning=learningEntries.find(entry=>!entry.completed)
 const start=()=>{haptics.impact('heavy');track('cta');dispatch({type:'newFlow'});push({name:'signal'})}
 const quickStart=()=>{
  haptics.selection();track('cta',{source:'home-five-minutes'})
  const preferred=ACTIVE_PASSION_IDS.filter(passion=>user.passions.includes(passion))
  const pool=preferred.length?preferred:ACTIVE_PASSION_IDS
  const passion=pool[Math.floor(Math.random()*pool.length)]!
  dispatch({type:'newFlow',flow:{duration:5,passion}})
  push(passion==='dessin'?{name:'drawing',duration:5}:{name:'activity'})
 }
 const resume=()=>{
  if(!openProposal)return
  haptics.impact('light')
  dispatch({type:'newFlow',flow:{mood:openProposal.mood??undefined,duration:openProposal.duration,passion:openProposal.passion,proposal:openProposal,...(isFixedActivityId(openProposal.activityId)?{fixedStep:openProposal.activityId}:{})}})
  const lesson=getPathStep(openProposal.activityId)
  reset(lesson?lessonStack(lesson,{name:'activity'}):[{name:'home'},{name:'activity'}])
 }
 const resumePassion=openProposal?.passion??learning?.passion
 return <Screen tabs className={`studio-home grand-geste-home scene-${scene}`}>
  <header className="grand-geste-header">
   <Logo height={30}/>
   <div className="grand-geste-tools">
    <button type="button" className="grand-geste-wallet" data-tour-target="wallet" onClick={()=>push({name:'shop'})} aria-label={`Boutique : ${formatNumber(shop.balance)} minutons disponibles`}><BrandMark size={22}/><span>{formatNumber(shop.balance)}</span></button>
    <button type="button" className="grand-geste-profile" data-tour-target="settings" aria-label="Mon profil et mes réglages" onClick={()=>push({name:'profile'})}><Mascot size={40} animated={false}/></button>
   </div>
  </header>
  <h1 className="sr-only">Scroll-up : une activité pour toi</h1>
  <ScrollCallToAction onStart={start}/>
  <button type="button" className="grand-geste-quick" onClick={quickStart}>Une idée en 5 minutes <ArrowUpRight size={22} aria-hidden="true"/></button>
  {(openProposal||learning)&&<section className="grand-geste-resume" aria-label="Reprendre une activité">
   <button type="button" onClick={openProposal?resume:()=>learning&&push({name:'learningLesson',lessonId:learning.lessonId,entryId:learning.id})}>
    {resumePassion&&<PassionArtwork passion={resumePassion}/>}
    <span><strong>{openProposal?'Reprendre l’activité':'Reprendre la leçon'}</strong><small>{resumePassion?getPassion(resumePassion).label:'Apprendre'}{openProposal?` · ${openProposal.duration} min`:''}</small></span>
    <ChevronRight size={20} aria-hidden="true"/>
   </button>
  </section>}
  <div className="grand-geste-shortcuts">
   <button type="button" data-tour-target="word" onClick={()=>push({name:'challenge'})} aria-label={`Le mot du jour : ${word}. Ouvrir le défi`}><BookOpen size={19} aria-hidden="true"/><span><small>Le mot du jour{doneToday?' · Fait ✓':''}</small><strong>{word}</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
   <button type="button" data-tour-target="atelier" onClick={()=>push({name:'atelier'})}><Images size={19} aria-hidden="true"/><span><small>Chez Minuton</small><strong>Mes créations</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
  </div>
  <button type="button" className="grand-geste-passions-link" data-tour-target="passions" onClick={()=>push({name:'passionHub'})}>Explorer mes passions <ChevronRight size={17} aria-hidden="true"/></button>
 </Screen>
}
