import { useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, Clock3, Images } from 'lucide-react'
import { SPORT_SESSIONS, type Duration } from '@scroll-up/shared'
import { Screen } from '../components/Screen.tsx'
import { AppHeader } from '../components/AppHeader.tsx'
import { WorkshopHero } from '../components/WorkshopHero.tsx'
import { SportFigure, sportSessionFigure } from '../components/SportMovement.tsx'
import { Button } from '../components/ui/button.tsx'
import { useNavigation } from '../state/AppState.tsx'
import { GalleryScreen } from './GalleryScreen.tsx'
import './InteractiveWorkshop.css'
import './SportSession.css'

export function SportSpace({onStart,onBack}:{onStart:(duration:Duration,id:string)=>Promise<void>;onBack:()=>void}) {
 const {push}=useNavigation(),[duration,setDuration]=useState<Duration>(5),[gallery,setGallery]=useState(false),[busy,setBusy]=useState(false)
 const start=async(index:number)=>{if(busy)return;setBusy(true);try{await onStart(duration,`sport-${duration}-${(duration===5?0:duration===15?5:10)+index+1}`)}finally{setBusy(false)}}
 return <Screen tabs className="interactive-workshop sport-space"><AppHeader/>
  <div className="sport-space-nav"><button className="workshop-back" type="button" onClick={onBack}><ArrowLeft size={16}/>Mes passions</button><button type="button" onClick={()=>setGallery(!gallery)}><Images size={16}/>{gallery?'Mes séances à choisir':'Mes séances terminées'}</button></div>
  <WorkshopHero passion="sport" title="Sport" subtitle="Un moment pour bouger"/>
  {gallery?<GalleryScreen passion="sport" embedded/>:<>
   <h2 className="sport-title">Choisir ma séance</h2>
   <div className="sport-duration-options" aria-label="Durée de la séance">{([5,15,30] as Duration[]).map(time=><button key={time} type="button" aria-pressed={duration===time} onClick={()=>setDuration(time)}>{time} min</button>)}</div>
   <div className="sport-session-list">{SPORT_SESSIONS[duration].map((session,i)=><button type="button" className="sport-session-row" key={session.title} disabled={busy} onClick={()=>void start(i)}><SportFigure exercise={sportSessionFigure(session)}/><span><strong>{session.title}</strong><small><Clock3 size={13}/>{duration} min</small></span><ChevronRight size={18}/></button>)}</div>
   <p className="sport-space-note">Poids du corps · préparation et pauses incluses</p>
   <section className="sport-learn-card"><BookOpen size={34}/><div><h2>Les bases du poids du corps</h2><p>12 leçons pour comprendre les gestes</p><Button variant="secondary" size="sm" onClick={()=>push({name:'learnPassion',passion:'sport'})}>Apprendre<ChevronRight size={16}/></Button></div></section>
  </>}
 </Screen>
}
