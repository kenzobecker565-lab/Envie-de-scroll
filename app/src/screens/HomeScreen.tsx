import { useState } from 'react'
import { SavedSessions } from '../components/SavedSessions.tsx'
import {sessionFlow,sessionStack} from '../lib/resumeSession.ts'
import {api} from '../api/client.ts'
import { Clock3, Compass, ChevronRight, Images } from 'lucide-react'
import { getPassion } from '@scroll-up/shared'
import { Screen } from '../components/Screen.tsx'
import { Logo, BrandMark } from '../components/Brand.tsx'
import { ScrollCallToAction } from '../components/ScrollCallToAction.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { useLearning } from '../learning/useLearning.ts'
import { useShop } from '../lib/shop.ts'
import { formatNumber } from '../lib/format.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import { track } from '../api/client.ts'
import './HomeScreen.css'

/** The approved “Le décollage” home. Existing activity flows are preserved. */
export function HomeScreen() {
 const {state,dispatch}=useAppState(), {push,reset}=useNavigation()
 const {openProposal}=state.me
 const shop=useShop()
 const {items:learningEntries}=useLearning()
 const learning=learningEntries.find(entry=>!entry.completed)
 const start=()=>{haptics.impact('heavy');track('cta');dispatch({type:'newFlow',flow:{scrollFlow:true}});push({name:'signal'})}
 const quickStart=()=>{
  haptics.selection();track('cta',{source:'home-five-minutes'})
  dispatch({type:'newFlow',flow:{duration:5,scrollFlow:true}})
  push({name:'ideas'})
 }
 const [resumeError,setResumeError]=useState(''),[resuming,setResuming]=useState(false)
 const resume=async()=>{
  if(!openProposal||resuming)return
  setResuming(true);setResumeError('')
  try{const r=await api.session(openProposal.id,'resume');dispatch({type:'openProposal',proposal:r.proposal});dispatch({type:'newFlow',flow:sessionFlow(r.proposal,r.serverTime)});reset(sessionStack(r.proposal))}catch(e){setResumeError((e as Error).message)}finally{setResuming(false)}
 }
 const resumePassion=openProposal?.passion??learning?.passion
 return <Screen tabs className="studio-home grand-geste-home">
  <div className="flight-cover">
  <header className="grand-geste-header">
   <Logo height={30}/>
   <div className="grand-geste-tools">
    <button type="button" className="grand-geste-wallet" data-tour-target="wallet" onClick={()=>push({name:'shop'})} aria-label={`Boutique : ${formatNumber(shop.balance)} minutons disponibles`}><BrandMark size={22}/><span>{formatNumber(shop.balance)}</span></button>
    <button type="button" className="grand-geste-profile" data-tour-target="profile" aria-label="Mon profil" onClick={()=>push({name:'profile'})}><Mascot size={40} animated={false}/></button>
   </div>
  </header>
  <h1 className="sr-only">Scroll-up : une activité pour toi</h1>
  <ScrollCallToAction onStart={start}/>
  </div>
  <div className="flight-content">
  <button type="button" className="grand-geste-quick" onClick={quickStart}><Clock3 size={25} aria-hidden="true"/><span>Juste 5 minutes ?</span><ChevronRight size={20} aria-hidden="true"/></button>
  {(openProposal||learning)&&<section className="grand-geste-resume" aria-label="Reprendre une activité">
   <button type="button" onClick={openProposal?resume:()=>learning&&push({name:'learningLesson',lessonId:learning.lessonId,entryId:learning.id})}>
    {resumePassion&&<PassionArtwork passion={resumePassion}/>}
    <span><strong>{openProposal&&resumePassion==='dessin'?'Reprendre mon dessin':openProposal?'Reprendre l’activité':'Reprendre la leçon'}</strong><small>{resumePassion?getPassion(resumePassion).label:'Apprendre'}{openProposal?` · ${openProposal.duration} min`:''}</small></span>
    <ChevronRight size={20} aria-hidden="true"/>
   </button>
  </section>}
  {resumeError&&<p role="alert">{resumeError}</p>}<SavedSessions/>
  <div className="grand-geste-shortcuts">
   <button type="button" data-tour-target="passions" onClick={()=>push({name:'passionHub'})}><Compass size={23} aria-hidden="true"/><span><strong>Mes passions</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
   <button type="button" data-tour-target="atelier" onClick={()=>push({name:'atelier'})}><Images size={23} aria-hidden="true"/><span><strong>Mes créations</strong></span><ChevronRight size={17} aria-hidden="true"/></button>
  </div>
  </div>
 </Screen>
}
