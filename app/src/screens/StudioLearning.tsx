import { useEffect, useState } from 'react'
import { BookOpen, Check, ChevronRight } from 'lucide-react'
import { FRENCH_RULES, STUDIO_LESSONS, reviewStudioConfig, type StudioTask } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { AppHeader } from '../components/AppHeader.tsx'
import { Screen } from '../components/Screen.tsx'
import { StudioArt } from '../components/StudioArt.tsx'
import { WorkshopHero } from '../components/WorkshopHero.tsx'
import { Button } from '../components/ui/button.tsx'
import { keepReview, readReview, removeReview } from '../lib/frenchReview.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { StudioCorrection, StudioTaskPlayer, taskAnswered } from './StudioSession.tsx'
import './PassionStudio.css'
const practiceId=(id:string)=>`francais-5-${['present'].includes(id)?1:['conditionnel'].includes(id)?2:['a','on','son','ces','infinitif'].includes(id)?3:['sujet','etre','avoir','tout'].includes(id)?4:5}`
export function StudioLearning({passion}:{passion:'logique'|'francais'}){
 const {state,dispatch}=useAppState(),{reset,push}=useNavigation(),userId=String(state.me.user.id)
 const [category,setCategory]=useState('Toutes'),[review,setReview]=useState(()=>readReview(userId)),[practice,setPractice]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string>()
 const done=state.me.stats.byPassion.find(p=>p.passion===passion)?.tried??[]
 useEffect(()=>{if(passion!=='francais')return;let alive=true;api.completions(undefined,'francais').then(p=>{if(!alive)return;let mastered:string[]=[];try{const v=JSON.parse(localStorage.getItem(`scroll-up:french-review:${userId}:mastered`)??'[]');if(Array.isArray(v))mastered=v}catch{}const ids=p.items.flatMap(i=>i.workshop?.reviewRules??[]).filter(id=>!mastered.includes(id));setReview(keepReview(userId,ids))}).catch(()=>{});return()=>{alive=false}},[passion,userId])
 const start=async(id:string)=>{if(busy)return;setBusy(true);setError(undefined);try{if(!state.me.user.passions.includes(passion)){const r=await api.updatePassions([...state.me.user.passions,passion]);dispatch({type:'user',user:r.user})}dispatch({type:'newFlow',flow:{passion,fixedPassion:passion,fixedStep:id,duration:5}});reset([{name:'home'},{name:'learn'},{name:'learnPassion',passion},{name:'activity'}])}catch(e){setError((e as Error).message);setBusy(false)}}
 return <Screen tabs className="interactive-workshop passion-studio"><AppHeader/><WorkshopHero passion={passion} title={passion==='francais'?'Apprendre le français':'Apprendre à raisonner'} subtitle="Une méthode, un exemple, un entraînement."/>
 <div className="iw-learn-list">{STUDIO_LESSONS[passion].map((l,i)=><button type="button" disabled={busy} key={l.title} className="iw-learn-row" onClick={()=>void start(`${passion}-lesson-${i+1}`)}><StudioArt passion={passion} index={i}/><span><strong>{l.title}</strong><small>{done.includes(`${passion}-lesson-${i+1}`)?'Déjà pratiquée · revoir':'Comprendre et pratiquer · 5 min'}</small></span>{done.includes(`${passion}-lesson-${i+1}`)?<Check size={18}/>:<ChevronRight size={18}/>}</button>)}</div>
 {passion==='francais'&&<><section className="iw-card studio-review"><h2>Mes révisions</h2><p>Retrouver les règles rencontrées dans tes corrections.</p>{review.length?FRENCH_RULES.filter(r=>review.includes(r.id)).map(r=><details className="iw-review-rule" key={r.id}><summary>{r.title}</summary><p>{r.explanation}</p><blockquote>{r.example}</blockquote><button type="button" className="iw-text-button" onClick={()=>setReview(removeReview(userId,r.id))}>Je la maîtrise · retirer</button></details>):<p>Les règles à revoir apparaîtront ici après tes premières séances.</p>}{reviewStudioConfig(review).tasks.length>0&&<Button onClick={()=>setPractice(!practice)}>Révision express · 5 min</Button>}{practice&&<ReviewPractice userId={userId} rules={review}/>}</section>
 <h2 className="studio-section-title">Les règles en pratique</h2><div className="iw-section-tabs">{['Toutes','Conjugaison','Orthographe','Grammaire et accords','Ponctuation et syntaxe'].map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="iw-learn-list">{FRENCH_RULES.filter(r=>category==='Toutes'||r.category===category).map(r=><details className="iw-review-rule" key={r.id}><summary>{r.title}</summary><p>{r.explanation}</p><blockquote>{r.example}</blockquote><Button size="sm" variant="secondary" disabled={busy} onClick={()=>['passe','imperatif'].includes(r.id)?void start(`francais-lesson-${r.id==='passe'?3:4}`):r.id==='infinitif'||r.id==='style'?setReview(keepReview(userId,[r.id])):void start(practiceId(r.id))}>{r.id==='style'||r.id==='infinitif'?'Garder cette règle':'Pratiquer'}</Button></details>)}</div>
 <button type="button" className="catalog-learn" onClick={()=>push({name:'learnPassion',passion:'logique'})}><BookOpen size={25}/><span><strong>Apprendre à raisonner</strong><small>Côté énigmes · éliminer, croiser, vérifier.</small></span><ChevronRight size={18}/></button></>}
 {state.me.openProposal&&<section className="iw-card"><h2>Reprendre mon activité</h2><p>{state.me.openProposal.text}</p><Button variant="secondary" onClick={()=>{const p=state.me.openProposal!;dispatch({type:'newFlow',flow:{passion:p.passion,fixedPassion:p.passion,duration:p.duration,fixedStep:p.activityId,proposal:p}});reset([{name:'home'},{name:'learn'},{name:'activity'}])}}>Reprendre</Button></section>}
 {error&&<p role="alert" className="iw-error">{error}</p>}
 </Screen>
}
function ReviewPractice({rules,userId}:{rules:string[];userId:string}){
 const tasks=reviewStudioConfig(rules).tasks
 const [index,setIndex]=useState(0),[answers,setAnswers]=useState<Record<string,unknown>>({}),[checked,setChecked]=useState<string[]>([])
 const t:StudioTask|undefined=tasks[Math.min(index,tasks.length-1)];if(!t)return null
 return <div className="studio-review-practice"><p>Exemple {index+1} / {tasks.length} · entraînement sans minutons</p><StudioTaskPlayer key={t.id} task={t} answer={answers[t.id]} onChange={v=>{setAnswers(a=>({...a,[t.id]:v}));setChecked(a=>a.filter(id=>id!==t.id))}}/><Button disabled={!taskAnswered(t,answers[t.id])} onClick={()=>setChecked(a=>[...new Set([...a,t.id])])}>Vérifier</Button>{checked.includes(t.id)&&<StudioCorrection task={t} answer={answers[t.id]}/>}<Button disabled={!checked.includes(t.id)} variant="secondary" onClick={()=>{if(index<tasks.length-1)setIndex(i=>i+1);else {keepReview(userId,rules);setIndex(0);setChecked([]);setAnswers({})}}}>{index<tasks.length-1?'Un autre exemple':'Recommencer la révision'}</Button></div>
}
