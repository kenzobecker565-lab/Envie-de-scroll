import { BookOpen, Brush, ChevronRight, Feather, Sparkles } from 'lucide-react'
import { dailyWord, getPassion, getPathStep, isFixedActivityId, passionLevel, type PassionId } from '@scroll-up/shared'
import { Screen } from '../components/Screen.tsx'
import { AppHeader } from '../components/AppHeader.tsx'
import { ScrollCallToAction } from '../components/ScrollCallToAction.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork, PassionPoster } from '../components/PassionArtwork.tsx'
import { todayKey, wordDone } from '../components/Challenge.tsx'
import { useStartChallenge } from '../lib/useStartChallenge.ts'
import { statsFor } from '../components/Progression.tsx'
import { featuredPath } from '../components/Paths.tsx'
import { dayPeriod } from '../components/decor/Ornaments.tsx'
import { useAppearance } from '../lib/appearance.ts'
import { lessonStack } from '../lib/useLesson.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import { track } from '../api/client.ts'
import './HomeScreen.css'

export function HomeScreen() {
 const {state,dispatch}=useAppState(),{push,reset}=useNavigation(),{scene}=useAppearance()
 const {user,stats,openProposal}=state.me
 const today=todayKey(), {word}=dailyWord(today), startChallenge=useStartChallenge()
 const doneToday=wordDone(today,stats.challenge??[])
 const period=dayPeriod(new Date().getHours()), hello=period==='night'||period==='dusk'?'Bonsoir':'Bonjour'
 const ordered=['dessin','piano','ecriture','rythme','logique','francais'] as PassionId[]
 const passions=ordered.filter(id=>user.passions.includes(id)||stats.byPassion.some(row=>row.passion===id))
 const featured=featuredPath(user.passions,id=>statsFor(stats.byPassion,id).steps,id=>passionLevel(id,statsFor(stats.byPassion,id).minutes).level,user.skills)
 const learning=featured?.progress
 const start=()=>{haptics.impact('heavy');track('cta');dispatch({type:'newFlow'});push({name:'signal'})}
 const resume=()=>{if(!openProposal)return;haptics.impact('light');dispatch({type:'newFlow',flow:{mood:openProposal.mood??undefined,duration:openProposal.duration,passion:openProposal.passion,proposal:openProposal,...(isFixedActivityId(openProposal.activityId)?{fixedStep:openProposal.activityId}:{})}});const lesson=getPathStep(openProposal.activityId);reset(lesson?lessonStack(lesson,{name:'activity'}):[{name:'home'},{name:'activity'}])}
 const resumePassion=openProposal?.passion??learning?.path.passion
 return <Screen tabs className={`studio-home scene-${scene}`}>
  <AppHeader/>
  <section className="studio-home-hero" aria-labelledby="home-greeting">
   <h1 id="home-greeting"><span>{hello}</span><span className="home-name">{user.firstName||'à toi'}.</span></h1>
   <button className="studio-home-minuton" type="button" aria-label="Personnaliser Minuton" onClick={()=>push({name:'shop',category:'mascot'})}><Mascot size={200}/></button>
  </section>
  <ScrollCallToAction onStart={start}/>
  <section className="studio-daily-card" data-tour-target="word" aria-labelledby="home-daily-word">
   <button type="button" className="studio-daily-open" onClick={()=>push({name:'challenge'})} aria-label={`Le mot du jour : ${word}. Voir le défi et les mots du mois`}>
    <span className="studio-daily-heading"><Sparkles size={18}/><h2 id="home-daily-word">Le mot du jour</h2>{doneToday&&<span className="studio-daily-done">Fait ✓</span>}</span>
    <strong className="studio-daily-word">{word}</strong><span className="studio-daily-subtitle">Un mot, deux façons de créer</span>
    <span className="studio-daily-illustration" aria-hidden="true"><BookOpen/><Feather/></span>
   </button>
   <div className="studio-daily-actions"><button type="button" onClick={()=>user.passions.includes('dessin')?startChallenge('dessin',today):push({name:'challenge'})}><Brush size={19}/>Dessiner</button><button type="button" onClick={()=>user.passions.includes('ecriture')?startChallenge('ecriture',today):push({name:'challenge'})}><Feather size={19}/>Écrire</button></div>
  </section>
  <section className="studio-home-resume"><h2>{openProposal||featured?.started?'Reprendre mon activité':'À découvrir'}</h2><button type="button" className="studio-resume-row" onClick={openProposal?resume:()=>learning?push({name:'path',pathId:learning.path.id}):push({name:'learn'})}>{resumePassion&&<PassionArtwork passion={resumePassion}/>}<span className="studio-resume-copy"><strong>{openProposal?.text??learning?.path.title??'Trouve ta prochaine passion'}</strong><span>{resumePassion?getPassion(resumePassion).label:'Apprendre'}{learning&&!openProposal?` · Étape ${learning.next?.index??learning.path.steps.length} sur ${learning.path.steps.length}`:openProposal?` · ${openProposal.duration} min`:''}</span></span><span className="studio-resume-arrow"><ChevronRight size={22}/></span></button></section>
  <section className="studio-home-passions" data-tour-target="passions" aria-labelledby="home-passions">
   <div className="studio-section-heading"><h2 id="home-passions">Tes passions</h2><button type="button" onClick={()=>push({name:'passionHub'})}>Tout voir <ChevronRight size={14}/></button></div>
   <div className="studio-home-cards">{passions.slice(0,2).map(passion=><PassionPoster key={passion} passion={passion} compact stats={statsFor(stats.byPassion,passion)} onOpen={()=>push({name:'passionSpace',passion})}/>)}{passions.length===0&&<button className="studio-empty-passions" type="button" onClick={()=>push({name:'passions',mode:'edit'})}>Choisir mes passions <ChevronRight/></button>}</div>
  </section>
 </Screen>
}
