import { useEffect, useRef, useState } from 'react'
import { BookOpen, Check, ChevronRight, Pause, Play, Shuffle } from 'lucide-react'
import { SPORT_ACTIVITIES, SPORT_EXERCISES, SPORT_LESSONS, sportPosition, sportProgram, type ProposalDTO, type SportExerciseId } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { AppHeader } from '../components/AppHeader.tsx'
import { WorkshopHero } from '../components/WorkshopHero.tsx'
import { SportFigure, SportInstructions, SportMovement, sportSessionFigure } from '../components/SportMovement.tsx'
import { Button } from '../components/ui/button.tsx'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog.tsx'
import { Screen } from '../components/Screen.tsx'
import { advanceSportClock, restoredSportTime, type SportClock } from '../lib/sportClock.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import './InteractiveWorkshop.css'
import './SportSession.css'

function remember(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{/* private storage */}}
function read<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem(key)??'null')??fallback}catch{return fallback}}
function time(seconds:number){return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${Math.ceil(seconds%60).toString().padStart(2,'0')}`}
function useSportClock(key:string,totalMs:number){
 const clock=useRef<SportClock>({elapsedMs:restoredSportTime(read(key,0),totalMs),running:false,lastTickMs:0})
 const [view,setView]=useState(clock.current)
 const persist=useRef(true)
 const publish=()=>{clock.current={...clock.current};setView(clock.current);if(persist.current)remember(key,clock.current.elapsedMs)}
 const tick=()=>{clock.current=advanceSportClock(clock.current,performance.now(),totalMs);publish()}
 const pause=()=>{clock.current=advanceSportClock(clock.current,performance.now(),totalMs);clock.current.running=false;publish()}
 const start=()=>{if(document.hidden||clock.current.elapsedMs>=totalMs)return;clock.current.running=true;clock.current.lastTickMs=performance.now();publish()}
 const reset=()=>{clock.current={elapsedMs:0,running:false,lastTickMs:0};publish()}
 useEffect(()=>{
  const interval=window.setInterval(()=>{if(clock.current.running)tick()},250)
  const hide=()=>{if(document.hidden)pause()};document.addEventListener('visibilitychange',hide)
  return()=>{clearInterval(interval);document.removeEventListener('visibilitychange',hide);clock.current=advanceSportClock(clock.current,performance.now(),totalMs);clock.current.running=false;if(persist.current)remember(key,clock.current.elapsedMs)}
 },[key,totalMs])
 const discard=()=>{persist.current=false;clock.current.running=false;try{localStorage.removeItem(key)}catch{}}
 return {...view,start,pause,reset,discard}
}
export function SportSession({proposal}:{proposal:ProposalDTO}){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),program=sportProgram(proposal.activityId)!
 const key=`scroll-up:sport:${state.me.user.id}:${proposal.id}`
 const lesson=program.lesson===undefined?undefined:SPORT_LESSONS[program.lesson]
 const saved=read<{phase?:string;easy?:boolean}>(key+':lesson',{})
 const [phase,setPhase]=useState(lesson&&saved.phase!=='practice'?(saved.phase==='check'?'check':'learn'):'practice')
 const [easy,setEasy]=useState(saved.easy===true),[begun,setBegun]=useState(read<number>(key+':practice',0)>0),[review,setReview]=useState<SportExerciseId>(),[saving,setSaving]=useState(false),[error,setError]=useState<string>()
 const savingRef=useRef(false),practice=useSportClock(key+':practice',program.totalSeconds*1000),trial=useSportClock(key+':try',20_000)
 const [changing,setChanging]=useState(false),[selected,setSelected]=useState<string>(),[switching,setSwitching]=useState(false),[switchError,setSwitchError]=useState<string>()
 const switchRef=useRef(false)
 const alternatives=SPORT_ACTIVITIES.filter(a=>a.duration===proposal.duration&&a.number<16)
 const openChange=()=>{practice.pause();trial.pause();setSwitchError(undefined);setSelected(alternatives.find(a=>a.id!==proposal.activityId)?.id);setChanging(true)}
 const changeSession=async()=>{
  if(!selected||selected===proposal.activityId||switchRef.current)return
  switchRef.current=true;setSwitching(true);setSwitchError(undefined)
  try{
   const response=await api.propose({passion:'sport',duration:proposal.duration,step:selected,replacing:proposal.id})
   practice.discard();trial.discard();try{localStorage.removeItem(key+':lesson')}catch{}
   dispatch({type:'newFlow',flow:{passion:'sport',fixedPassion:'sport',duration:proposal.duration,fixedStep:selected,proposal:response.proposal,clockOffset:Date.parse(response.serverTime)-Date.now()}})
   dispatch({type:'openProposal',proposal:response.proposal})
   reset([{name:'home'},{name:'passionHub'},{name:'passionSpace',passion:'sport'},{name:'activity'}])
  }catch(e){setSwitchError((e as Error).message);switchRef.current=false;setSwitching(false)}
 }
 useEffect(()=>remember(key+':lesson',{phase,easy}),[key,phase,easy])
 useEffect(()=>{if(phase==='try'&&trial.elapsedMs>=20_000)setPhase('check')},[trial.elapsedMs,phase])
 const position=sportPosition(program.segments,practice.elapsedMs),segment=position.segment,next=program.segments[position.index+1]
 const base=segment?.exercise??program.session.exercises[0]!,exercise=easy&&SPORT_EXERCISES[base].easyExercise?SPORT_EXERCISES[base].easyExercise!:base
 const completed=practice.elapsedMs>=program.totalSeconds*1000
 const finish=async()=>{
  if(!completed||savingRef.current)return;savingRef.current=true;setSaving(true);setError(undefined)
  try{const previousStats=state.me.stats,response=await api.complete({proposalId:proposal.id,sport:{version:1,activeSeconds:program.totalSeconds,easy}})
   dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats,photoPending:false,continuation:{}}});dispatch({type:'newFlow'})
   practice.discard();trial.discard();try{localStorage.removeItem(key+':lesson')}catch{}
   reset([{name:'home'},{name:'done'}])
  }catch(e){setError((e as Error).message);savingRef.current=false;setSaving(false)}
 }
 const beginTry=()=>{trial.reset();setPhase('try');trial.start()}
 const startPractice=()=>{trial.pause();setPhase('practice');setBegun(true);practice.start();window.scrollTo(0,0)}
 const openReview=()=>{practice.pause();trial.pause();setReview(phase==='practice'?base:lesson?.exercise??base)}
 return <Screen tabs className={`interactive-workshop sport-session ${begun&&phase==='practice'&&!completed&&!review?'sport-live':''}`}><>{lesson&&phase==='learn'?<h1 className="sport-title sport-lesson-title">{lesson.title}</h1>:<WorkshopHero passion="sport" title={program.session.title} subtitle={`${proposal.duration} min · poids du corps`}/>}</>
 {lesson&&<ol className="iw-stages">{['Comprendre','Essayer','Pratiquer'].map((label,i)=><li key={label} aria-current={(phase==='learn'?0:phase==='try'||phase==='check'?1:2)===i?'step':undefined}>{label}</li>)}</ol>}
 {review?<><SportInstructions exercise={review} easy={easy} onEasy={setEasy}/><Button onClick={()=>setReview(undefined)}>Revenir à ma séance</Button><p className="iw-draft-note">Le chronomètre est en pause. Reprends quand tu es prêt.</p></>:phase==='learn'&&lesson?<><SportInstructions exercise={lesson.exercise} easy={easy} onEasy={setEasy} intro={lesson.rule}/>{program.lesson===5&&<section className="iw-card"><h2>Ta séance en quatre mouvements</h2><p>Un mouvement pour les jambes, un pour pousser, un pour le bassin et un pour rester stable. Chaque mouvement est suivi de 30 secondes de récupération.</p><ul className="sport-program-list">{lesson.practice.map((id,i)=><li key={i}>{SPORT_EXERCISES[id].title}</li>)}</ul></section>}<Button onClick={beginTry}>Essayer le mouvement · 20 s<ChevronRight size={18}/></Button></>:phase==='try'&&lesson?<><h2 className="sport-title">À toi d’essayer</h2><SportMovement exercise={easy&&SPORT_EXERCISES[lesson.exercise].easyExercise?SPORT_EXERCISES[lesson.exercise].easyExercise!:lesson.exercise}/><Timer seconds={Math.ceil((20_000-trial.elapsedMs)/1000)} progress={trial.elapsedMs/20_000} label="Essai guidé"/><p className="sport-cue">{SPORT_EXERCISES[lesson.exercise].cue}</p><Button onClick={trial.running?trial.pause:trial.start}>{trial.running?<Pause size={18}/>:<Play size={18}/>} {trial.running?'Pause':'Reprendre l’essai'}</Button><button type="button" className="iw-text-button" onClick={openReview}>Revoir le mouvement</button><button type="button" className="iw-text-button" onClick={()=>{trial.pause();setPhase('check')}}>Arrêter l’essai et faire le point</button></>:phase==='check'?<section className="iw-card"><h2>Comment s’est passé le mouvement ?</h2><p>Choisis la suite qui te convient. Il n’y a aucune posture vérifiée par l’application.</p><Button onClick={startPractice}>Confortable · passer à la pratique</Button><Button variant="secondary" onClick={()=>{setEasy(true);setPhase('learn')}}>Trop difficile · essayer une version plus facile</Button><button type="button" className="iw-text-button" onClick={()=>setPhase('learn')}>J’ai besoin de revoir le geste</button></section>:completed?<section className="iw-card sport-finished"><Check size={36}/><h2>Ta séance est terminée</h2><p>{program.activity.duration} minutes de préparation, de mouvements et de récupération.</p><Button disabled={saving} onClick={()=>void finish()}>{saving?'Enregistrement…':'Enregistrer ma séance'} · +{proposal.duration} minutons</Button></section>:!begun?<><SportInstructions exercise={program.session.exercises[0]!} easy={easy} onEasy={setEasy}/><details className="sport-plan"><summary>Ta séance en un regard</summary><p>{program.equipment}</p><p>Préparation incluse · 30 s de mouvement / 30 s de récupération{program.rounds>1?` · ${program.rounds} tours`:''}</p><ul className="sport-program-list">{program.session.exercises.map((id,i)=><li key={i}>{SPORT_EXERCISES[id].title}</li>)}</ul></details><p className="sport-safety">Garde une amplitude confortable. Arrête le mouvement en cas de douleur ou de malaise.</p><Button onClick={startPractice}>J’ai compris · commencer<Play size={18}/></Button></>:<>
 <ol className="iw-stages"><li aria-current={segment?.kind==='warmup'?'step':undefined}>Préparation</li><li aria-current={segment?.kind!=='warmup'?'step':undefined}>Exercices</li></ol>
 <h2 className="sport-title" aria-live="polite">{easy&&segment?.exercise?SPORT_EXERCISES[exercise].title:segment?.title}</h2>
 {segment?.exercise?<><SportMovement exercise={exercise} compact easy={easy} side={base==='sideplank'?(position.segmentElapsedMs<15000?'left':'right'):undefined}/><button type="button" className="sport-review-button" onClick={openReview}><BookOpen size={16}/>Revoir le mouvement et sa variante</button></>:<p className="sport-cue">{segment?.instruction}</p>}
 <Timer seconds={position.remainingSeconds} progress={segment?position.segmentElapsedMs/(segment.seconds*1000):0} label={segment?.kind==='exercise'?`Mouvement ${segment.movement} / ${program.session.exercises.length}${program.rounds>1?` · tour ${segment.round} / ${program.rounds}`:''}`:segment?.kind==='warmup'?'Préparation':'Récupération'}/>
 {segment?.exercise&&<p className="sport-cue">{easy?SPORT_EXERCISES[base].easier:SPORT_EXERCISES[exercise].cue}</p>}
 {base==='sideplank'&&segment?.kind==='exercise'&&<p className="sport-side" role="status">{position.segmentElapsedMs<15000?'Côté gauche · change à mi-temps':'Côté droit · dernière moitié'}</p>}
 {next&&<div className="sport-next">Ensuite : {next.title} · {next.seconds} s</div>}
 <div className="sport-actions"><Button size="md" onClick={practice.running?practice.pause:practice.start}>{practice.running?<Pause size={18}/>:<Play size={18}/>} {practice.running?'Pause':'Reprendre ma séance'}</Button>
 <Button size="md" variant="secondary" className="sport-change-button" onClick={openChange}><Shuffle size={18}/>Changer de séance</Button></div>
 {!practice.running&&<p role="status" className="iw-draft-note">La séance est en pause.</p>}
 <p className="sport-total">Temps total restant : {time(Math.ceil((program.totalSeconds*1000-practice.elapsedMs)/1000))}</p>
 </>}
 <Dialog open={changing} onOpenChange={open=>{if(!switching)setChanging(open)}}><DialogContent className="sport-change-sheet" showCloseButton={!switching} onEscapeKeyDown={event=>{if(switching)event.preventDefault()}} onPointerDownOutside={event=>{if(switching)event.preventDefault()}}><DialogHeader><DialogTitle>Changer de séance</DialogTitle><DialogDescription>Choisis une autre séance de {proposal.duration} minutes.</DialogDescription></DialogHeader><p className="sport-change-paused"><Pause size={16}/>Chronomètre en pause</p><div className="sport-session-list" aria-label="Autres séances">{alternatives.map(activity=><button type="button" key={activity.id} className="sport-session-row" disabled={switching||activity.id===proposal.activityId} aria-pressed={selected===activity.id} onClick={()=>setSelected(activity.id)}><SportFigure exercise={sportSessionFigure(sportProgram(activity.id)!.session)}/><strong>{activity.text}</strong>{activity.id===proposal.activityId?<small>En cours</small>:selected===activity.id?<Check size={18}/>:<span className="sport-choice-circle"/>}</button>)}</div><p className="sport-change-note">La nouvelle séance repart à zéro.</p>{switchError&&<p role="alert" className="iw-error">{switchError}</p>}<Button size="md" disabled={switching||!selected} onClick={()=>void changeSession()}>{switching?'Changement…':'Commencer cette séance'}</Button><Button size="md" variant="secondary" disabled={switching} onClick={()=>setChanging(false)}>Revenir à ma séance</Button></DialogContent></Dialog>
 {error&&<p role="alert" className="iw-error">{error}</p>}<p className="iw-draft-note">Ta progression est conservée sur cet appareil. Le chrono se met en pause lorsque tu quittes cet écran.</p>
 </Screen>
}
function Timer({seconds,progress,label}:{seconds:number;progress:number;label:string}){
 return <div className="sport-timer" role="timer" aria-label={`${label} : ${seconds} secondes restantes`} style={{background:`conic-gradient(#70DDB3 ${Math.max(0,1-progress)*360}deg, #E1F5EC 0deg)`}}><div><strong>{time(Math.max(0,seconds))}</strong><small>{label}</small></div></div>
}
export function SportLearning(){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),[busy,setBusy]=useState(false),[error,setError]=useState<string>()
 const done=state.me.stats.byPassion.find(p=>p.passion==='sport')?.tried??[]
 const start=async(index:number)=>{if(busy)return;setBusy(true);setError(undefined);try{
  if(!state.me.user.passions.includes('sport')){const r=await api.updatePassions([...state.me.user.passions,'sport']);dispatch({type:'user',user:r.user})}
  dispatch({type:'newFlow',flow:{passion:'sport',fixedPassion:'sport',fixedStep:`sport-lesson-${index+1}`,duration:5}});reset([{name:'home'},{name:'learn'},{name:'learnPassion',passion:'sport'},{name:'activity'}])
 }catch(e){setError((e as Error).message);setBusy(false)}}
 return <Screen tabs className="interactive-workshop sport-learning"><AppHeader/><WorkshopHero passion="sport" title="Les bases du poids du corps" subtitle="Comprendre, essayer, pratiquer"/><ol className="iw-stages">{['Comprendre','Essayer','Pratiquer'].map(v=><li key={v}>{v}</li>)}</ol><div className="iw-learn-list sport-lesson-list">{SPORT_LESSONS.map((lesson,i)=><button type="button" key={lesson.title} disabled={busy} className="iw-learn-row sport-lesson-row" onClick={()=>void start(i)}><span className="sport-lesson-number">{done.includes(`sport-lesson-${i+1}`)?<Check size={16}/>:i+1}</span><SportFigure exercise={lesson.exercise}/><span className="sport-lesson-copy"><strong>{lesson.title}</strong>{done.includes(`sport-lesson-${i+1}`)&&<small>Leçon terminée · revoir</small>}</span><ChevronRight size={18}/></button>)}</div><section className="sport-learn-card"><BookOpen size={30}/><div><h2>Un essai de 20 s, puis 5 min de pratique.</h2><p>Des explications claires, puis tu passes à l’action à ton rythme. Les six leçons sont accessibles librement.</p></div></section>{error&&<p role="alert" className="iw-error">{error}</p>}</Screen>
}
export function SportGalleryDetail({activityId}:{activityId:string}){
 const program=sportProgram(activityId);if(!program)return null
 return <div className="workshop-gallery-detail"><p>{program.activity.duration} minutes au poids du corps · {program.rounds} tour{program.rounds>1?'s':''}</p><ul className="sport-program-list">{program.session.exercises.map((id,i)=><li key={i}>{SPORT_EXERCISES[id].title}</li>)}</ul><p>Préparation et récupérations incluses.</p></div>
}
