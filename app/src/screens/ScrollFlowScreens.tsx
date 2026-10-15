import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowUpRight, Check, Clock3, LoaderCircle, Pause, Play, Shuffle } from 'lucide-react'
import { DURATIONS, SPORT_EXERCISES, studioConfig, sportProgram, getActivity, getPassion, guideFor, keyboardMelody, scrollSuggestions, type Duration } from '@scroll-up/shared'
import { StudioTaskPlayer } from './StudioSession.tsx'
import { SportInstructions } from '../components/SportMovement.tsx'
import { api, track } from '../api/client.ts'
import { Logo } from '../components/Brand.tsx'
import { MinutonFigure } from '../components/Mascot.tsx'
import { PassionArtwork } from '../components/PassionArtwork.tsx'
import { DrawingPad, type DrawingPadHandle } from '../components/DrawingPad.tsx'
import { Button } from '../components/ui/button.tsx'
import { Screen } from '../components/Screen.tsx'
import { prepareImage } from '../lib/image.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { haptics } from '../telegram/webApp.ts'
import './ScrollFlow.css'

const MATERIALS:Record<string,string>={dessin:'Papier et crayon, ou feuille numérique',ecriture:'Un carnet, ou l’éditeur de l’app',piano:'Ton piano, ou le clavier de l’app',sport:'Un peu d’espace, sans matériel',logique:'De quoi noter, ou les outils de l’app',francais:'Un carnet, ou les exercices de l’app'}
export function FlowShell({step,title,subtitle,children,illustration,heroExtra}:{step:number;title:string;subtitle?:string;children:ReactNode;illustration?:ReactNode;heroExtra?:ReactNode}) {
 const {back,canGoBack}=useNavigation()
 return <Screen className="scroll-flow carnet-page"><div className="scroll-flow-cover"><header>{canGoBack&&<button type="button" onClick={back} aria-label="Retour"><ArrowLeft size={22}/></button>}<Logo height={27}/><span className="flow-step" aria-label={`Étape ${step} sur 3`}>{[1,2,3].map(i=><i key={i} data-active={i<=step}/>)}</span></header><div className="scroll-flow-title"><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div>{illustration}</div>{heroExtra}</div>{children}</Screen>
}
export function DurationScreen() {
 const {state,dispatch}=useAppState(),{push}=useNavigation()
 const [index,setIndex]=useState(DURATIONS.indexOf(state.flow.duration??15))
 const duration=DURATIONS[index]!
 return <FlowShell step={1} title="Tu as combien de temps ?" subtitle="Une pause à ta mesure." heroExtra={<div className="duration-flight" aria-hidden="true"><div className="duration-flight-craft"><MinutonFigure pose="cheer" size={100} animated={false}/><img src="/art/home-takeoff.webp" alt=""/></div></div>}>
  <section className="duration-choice" aria-label="Choisir mon temps"><output htmlFor="duration-gauge"><strong>{duration}</strong> minutes</output><div className="duration-gauge"><input id="duration-gauge" type="range" min="0" max="2" step="1" value={index} aria-label="Durée disponible" aria-valuetext={`${duration} minutes`} onChange={e=>{setIndex(Number(e.target.value));haptics.selection()}}/><div className="duration-ticks" aria-hidden="true">{DURATIONS.map(value=><span key={value}>{value} min</span>)}</div></div><p>Le temps de créer quelque chose.</p></section>
  <Button className="scroll-primary" onClick={()=>{track('time',{duration});dispatch({type:'flow',flow:{duration,scrollFlow:true}});push({name:'ideas'})}}>Découvrir mes 3 idées<ArrowUpRight size={23}/></Button><p className="scroll-note">Selon tes passions enregistrées</p>
 </FlowShell>
}
export function IdeasScreen() {
 const {state,dispatch}=useAppState(),{push,back}=useNavigation(),duration=state.flow.duration??15
 const preferred=state.flow.fixedPassion?[state.flow.fixedPassion]:state.me.user.passions
 const tried=state.me.stats.byPassion.flatMap(row=>row.tried)
 const [recent,setRecent]=useState<string[]>([])
 const [ideas,setIdeas]=useState(()=>scrollSuggestions(preferred,duration,tried))
 const [batch,setBatch]=useState(0)
 const reduced=useReducedMotion()
 const another=()=>{const nextRecent=[...recent,...ideas.map(a=>a.id)].slice(-60);setRecent(nextRecent);setIdeas(scrollSuggestions(preferred,duration,tried,nextRecent));setBatch(v=>v+1);haptics.selection()}
 return <FlowShell step={2} title="3 idées pour toi" subtitle={`${duration} minutes · Laquelle te donne envie ?`} illustration={<MinutonFigure pose="idea" size={84} animated={false}/>}>
  <AnimatePresence mode="wait" initial={false}><motion.div key={batch} className="scroll-ideas" initial={{opacity:0,y:reduced?0:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-8}} transition={{duration:reduced?0:.22}}>{ideas.map((activity,index)=><motion.button type="button" className="scroll-idea" data-passion={activity.passion} key={activity.id} initial={{opacity:0,y:reduced?0:14}} animate={{opacity:1,y:0}} transition={{delay:reduced?0:index*.06,duration:.24}} onClick={()=>{dispatch({type:'flow',flow:{selectedActivity:activity.id,passion:activity.passion,duration,scrollFlow:true,proposal:undefined,fixedStep:undefined}});push({name:'activityBrief'})}}><span><small>{getPassion(activity.passion).label}</small><strong>{activity.text}</strong><em>{MATERIALS[activity.passion]}</em></span><PassionArtwork passion={activity.passion}/><ArrowUpRight size={20} aria-hidden="true"/></motion.button>)}</motion.div></AnimatePresence>
  {!ideas.length&&<p role="status">Aucune idée pour ce temps. Choisis une autre durée.</p>}
  <Button variant="secondary" onClick={another}><Shuffle size={19}/>Trois autres idées</Button><button type="button" className="scroll-text-button" onClick={()=>{if(state.stack.at(-2)?.name==='home')push({name:'signal'});else back()}}>Modifier mon temps</button>
 </FlowShell>
}
export function ActivityBriefScreen() {
 const {state,dispatch}=useAppState(),{push,back}=useNavigation()
 const activity=getActivity(state.flow.selectedActivity??'')
 const [external,setExternal]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const lock=useRef(false)
 const start=async()=>{
  if(!activity||lock.current)return;lock.current=true;setBusy(true);setError('')
  try{
   if(!state.me.user.passions.includes(activity.passion)){const response=await api.updatePassions([...state.me.user.passions,activity.passion]);dispatch({type:'user',user:response.user})}
   const response=await api.propose({passion:activity.passion,duration:activity.duration,step:activity.id,external})
   dispatch({type:'flow',flow:{passion:activity.passion,duration:activity.duration,fixedStep:activity.id,proposal:response.proposal,external,scrollFlow:true,clockOffset:Date.parse(response.serverTime)-Date.now()}})
   dispatch({type:'openProposal',proposal:response.proposal});haptics.impact('light')
   push(external||['dessin','ecriture'].includes(activity.passion)?{name:'creativeSession'}:{name:'activity'})
  }catch(e){setError((e as Error).message);setBusy(false);lock.current=false}
 }
 if(!activity)return <Screen><p>Choisis d’abord une activité.</p><Button onClick={back}>Voir les idées</Button></Screen>
 const support=activity.passion==='dessin'?'Sur papier':activity.passion==='piano'?'Sur mon piano':'Hors de l’app'
 return <FlowShell step={3} title={getPassion(activity.passion).label} subtitle={`${activity.duration} minutes · À toi de créer`}>
  <PassionArtwork passion={activity.passion} className="scroll-brief-art"/><h2 className="scroll-instruction">{activity.text}</h2><p className="scroll-materials">{MATERIALS[activity.passion]}</p>
  <fieldset className="scroll-support" disabled={busy}><legend>Où veux-tu pratiquer ?</legend><div><button type="button" aria-pressed={!external} onClick={()=>setExternal(false)}>Dans l’app</button><button type="button" aria-pressed={external} onClick={()=>setExternal(true)}>{support}</button></div></fieldset>
  <p className="scroll-note">Tu pourras valider avec ou sans création jointe.</p>{error&&<p role="alert">{error}</p>}<Button className="scroll-primary" disabled={busy} onClick={()=>void start()}>{busy?<LoaderCircle className="animate-spin"/>:<ArrowUpRight/>}{busy?'On ouvre ton activité…':'Commencer mon activité'}</Button><button type="button" className="scroll-text-button" disabled={busy} onClick={back}>Choisir une autre idée</button>
 </FlowShell>
}
export function SessionTimer({createdAt,duration,clockOffset}:{createdAt:string;duration:Duration;clockOffset:number}) {
 const [now,setNow]=useState(Date.now()),[paused,setPaused]=useState(false),[pauseTime,setPauseTime]=useState(0),pauseStart=useRef(0)
 useEffect(()=>{if(paused)return;const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[paused])
 const seconds=Math.max(0,duration*60-Math.floor((now+clockOffset-Date.parse(createdAt)-pauseTime)/1000))
 return <div className="session-timer"><Clock3 size={23}/><output aria-label="Temps restant">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</output><button type="button" aria-label={paused?'Reprendre le chronomètre':'Mettre le chronomètre en pause'} onClick={()=>{if(paused){const at=Date.now();setPauseTime(v=>v+at-pauseStart.current);setNow(at)}else pauseStart.current=Date.now();setPaused(v=>!v)}}>{paused?<Play size={22}/>:<Pause size={22}/>}</button>{seconds===0&&<small>Tu peux prendre ton temps.</small>}</div>
}
export function CreativeSessionScreen() {
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),proposal=state.flow.proposal
 const [external,setExternal]=useState(Boolean(state.flow.external??proposal?.external)),[hasInk,setHasInk]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[photo,setPhoto]=useState<Blob>(),[preview,setPreview]=useState(''),[preparing,setPreparing]=useState(false)
 const drawing=useRef<DrawingPadHandle>(null),lock=useRef(false)
 const draftKey=`scroll-up:brouillon:${proposal?.id}`
 const [text,setText]=useState(()=>{try{return localStorage.getItem(draftKey)??''}catch{return ''}})
 useEffect(()=>{try{localStorage.setItem(draftKey,text)}catch{/* A full device must not prevent completing. */}},[text,draftKey])
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview])
 const finish=async()=>{
  if(!proposal||lock.current)return;lock.current=true;setSaving(true);setError('')
  try{
   const image=!external&&proposal.passion==='dessin'&&hasInk?await drawing.current?.toBlob():photo
   const response=await api.complete({proposalId:proposal.id,external:true,...(image?{photo:image}:{}),...(text.trim()?proposal.passion==='ecriture'?{text}:{exploredTitle:text}:{} )})
   dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats:state.me.stats,photoPending:response.completion.photoPending}});dispatch({type:'newFlow'})
   try{localStorage.removeItem(draftKey)}catch{/* no-op */}reset([{name:'home'},{name:'done'}])
  }catch(e){setError((e as Error).message);setSaving(false);lock.current=false}
 }
 if(!proposal)return <Screen><p>Cette séance n’est plus ouverte.</p><Button onClick={()=>reset([{name:'home'}])}>Retour à l’accueil</Button></Screen>
 const isDrawing=proposal.passion==='dessin',isWriting=proposal.passion==='ecriture'
 const pick=async(file:File|undefined)=>{if(!file)return;setPreparing(true);setError('');try{const value=await prepareImage(file);setPhoto(value);setPreview(URL.createObjectURL(value))}catch{setError('Cette image n’a pas pu être ouverte. Essaie une autre photo.')}finally{setPreparing(false)}}
 const guide=guideFor(proposal.activityId)
 const melody=keyboardMelody(proposal.activityId)
 return <FlowShell step={3} title={getPassion(proposal.passion).label} subtitle={`${proposal.duration} minutes · Ton moment de pratique`}>
  <SessionTimer createdAt={proposal.createdAt} duration={proposal.duration} clockOffset={state.flow.clockOffset}/>
  <details className="session-instructions" open={external||Boolean(proposal.extra)}><summary>Revoir la consigne</summary><p>{proposal.text}</p>{proposal.extra&&<p>{proposal.extra.items.join(' · ')}</p>}{guide&&<p>{guide.tips.join(' ')}</p>}{melody&&<p>Au piano : {melody.title}</p>}</details>
  {isDrawing&&<div hidden={external}><DrawingPad ref={drawing} onInkChange={setHasInk}/></div>}
  {isWriting&&<label className="session-writing">{external?'Un texte ou une note à conserver (facultatif)':'Ton texte'}<textarea maxLength={6000} rows={10} value={text} disabled={saving} onChange={e=>setText(e.target.value)} placeholder="Tes premières lignes…"/><small>Brouillon gardé sur ce téléphone.</small></label>}
  {external&&<ExternalReference activityId={proposal.activityId}/>}
  {external&&!isWriting&&<section className="session-external"><MinutonFigure pose="idea" size={85} animated={false}/><h2>À toi de jouer, à ta façon.</h2><p>Garde la consigne sous les yeux, puis reviens valider quand tu as terminé.</p>{!isDrawing&&<label>Une note à conserver (facultatif)<textarea maxLength={200} value={text} onChange={e=>setText(e.target.value)} rows={3}/></label>}</section>}
  {isDrawing&&external&&<label className="session-photo">{preview?<img src={preview} alt="Aperçu de mon dessin"/>:<span>Ajouter une photo (facultatif)</span>}<input type="file" accept="image/*" disabled={saving||preparing} onChange={e=>{void pick(e.target.files?.[0]);e.target.value=''}}/></label>}
  {(isDrawing||isWriting)&&<button type="button" className="scroll-text-button" disabled={saving} onClick={()=>{setExternal(v=>!v);dispatch({type:'flow',flow:{external:!external}})}}>{external?'Revenir à la création dans l’app':isDrawing?'Je préfère dessiner sur papier':'Je préfère écrire ailleurs'}</button>}
  {error&&<p role="alert">{error}</p>}<Button className="scroll-primary" disabled={saving||preparing} onClick={()=>void finish()}>{saving?<LoaderCircle className="animate-spin"/>:<Check/>}{saving?'Enregistrement…':'J’ai terminé'}</Button><p className="scroll-note">La création jointe est facultative. L’expérience suit les minutes de pratique enregistrées.</p>
 </FlowShell>
}

/** Keep the full exercise/reference available even when the work is done on paper. */
function ExternalReference({activityId}:{activityId:string}) {
 const studio=studioConfig(activityId),sport=sportProgram(activityId),melody=keyboardMelody(activityId)
 const [answers,setAnswers]=useState<Record<string,unknown>>({})
 if(studio)return <section className="external-reference"><h2>Les exercices de ta séance</h2><p>Tu peux répondre sur papier. Les outils ci-dessous restent disponibles pour consulter les documents.</p>{studio.tasks.map((task,index)=><details key={task.id} open={index===0}><summary>{index+1}. {task.title}</summary><StudioTaskPlayer task={task} answer={answers[task.id]} onChange={value=>setAnswers(v=>({...v,[task.id]:value}))}/></details>)}</section>
 if(sport)return <section className="external-reference"><h2>Ta séance, à emporter</h2><p>{sport.equipment} · {sport.rounds} tour{sport.rounds>1?'s':''}.</p><ol>{sport.segments.map((part,index)=><li key={index}>{part.title} · {part.seconds} s</li>)}</ol>{sport.session.exercises.map(exercise=><details key={exercise}><summary>Voir le mouvement : {SPORT_EXERCISES[exercise].title}</summary><SportInstructions exercise={exercise} easy={false}/></details>)}</section>
 if(melody)return <section className="external-reference"><h2>{melody.title}</h2><p>Les notes, phrase par phrase, pour ton piano.</p>{melody.phrases.map((phrase,index)=><p className="external-notes" key={index}>{phrase.join(' · ')}</p>)}</section>
 return null
}
