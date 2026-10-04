import { BookOpen, Check, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ACTIVE_PASSION_IDS, FRENCH_RULES, WORKSHOP_IDS, WORKSHOP_LESSONS, isFixedActivityId, isWorkshop, getPassion, type WorkshopId } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { AppHeader } from '../components/AppHeader.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { Screen } from '../components/Screen.tsx'
import { Button } from '../components/ui/button.tsx'
import { PASSION_ICONS } from '../lib/icons.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import './InteractiveWorkshop.css'

export function WorkshopLearningOverview(){
 const {state,dispatch}=useAppState(),{push,reset}=useNavigation()
 const open=state.me.openProposal
 const started=WORKSHOP_IDS.find(id=>state.me.stats.byPassion.find(p=>p.passion===id)?.tried.some(a=>a.includes('-lesson-')))
 const completed=started?state.me.stats.byPassion.find(p=>p.passion===started)?.tried??[]:[]
 const next=started?WORKSHOP_LESSONS[started].findIndex((_,i)=>!completed.includes(`${started}-lesson-${i+1}`)):-1
 const resume=()=>{if(!open)return;dispatch({type:'newFlow',flow:{passion:open.passion,duration:open.duration,proposal:open,mood:open.mood??undefined,...(isFixedActivityId(open.activityId)?{fixedStep:open.activityId}:{})}});reset([{name:'home'},{name:'learn'},{name:'activity'}])}
 return <Screen tabs className="interactive-workshop"><AppHeader/><header className="iw-heading"><div><h1>Apprendre</h1><p className="workshop-subtitle">Comprendre une règle. L’essayer. La pratiquer.</p></div><Mascot pose="idea" size={76}/></header><ol className="iw-stages iw-learn-steps">{['Comprendre','Essayer','Pratiquer'].map((v,i)=><li key={v}>{i+1}. {v}</li>)}</ol>{open&&isFixedActivityId(open.activityId)?<section className="iw-card"><span className="iw-eyebrow">Ta leçon en cours</span><h2>{open.text}</h2><Button onClick={resume}>Reprendre ma leçon<ChevronRight size={18}/></Button></section>:started&&next>=0?<button type="button" className="iw-learn-row" onClick={()=>push({name:'learnPassion',passion:started})}><span><strong>Continuer en {getPassion(started).label}</strong><small>{next} / 3 leçons terminées · {WORKSHOP_LESSONS[started][next]!.title}</small></span><ChevronRight size={18}/></button>:null}<div className="iw-learn-list">{ACTIVE_PASSION_IDS.map(id=>{const Icon=PASSION_ICONS[id];return <button type="button" key={id} className="iw-learn-row" onClick={()=>push({name:'learnPassion',passion:id})}><Icon size={26}/><span><strong>{getPassion(id).label}</strong><small>{isWorkshop(id)?WORKSHOP_LESSONS[id][0]!.title:id==='dessin'?'Construire les formes et les ombres':id==='piano'?'Trouver les notes et jouer un premier air':'Construire une scène et un dialogue'}</small></span><ChevronRight size={18}/></button>})}</div><button type="button" className="iw-learn-row" onClick={()=>push({name:'learnPassion',passion:'francais'})}><BookOpen size={23}/><span><strong>Mes règles à revoir</strong><small>Reprendre les erreurs de mes séances de français</small></span><ChevronRight size={18}/></button></Screen>
}
export function WorkshopLearning({passion}:{passion:WorkshopId}){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),[busy,setBusy]=useState(false),[error,setError]=useState<string>()
 const key=`scroll-up:french-review:${state.me.user.id}`
 const [review,setReview]=useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem(key)??'[]')}catch{return []}})
 useEffect(()=>{if(passion!=='francais')return;let alive=true
  api.completions(undefined,'francais').then(page=>{if(!alive)return;let mastered:string[]=[];try{mastered=JSON.parse(localStorage.getItem(key+':mastered')??'[]')}catch{}
   const stored=page.items.flatMap(item=>item.workshop?.reviewRules??[])
   setReview(previous=>{const next=[...new Set([...previous,...stored])].filter(id=>!mastered.includes(id));try{localStorage.setItem(key,JSON.stringify(next))}catch{}return next})
  }).catch(()=>{});return()=>{alive=false}
 },[passion,key])
 const [category,setCategory]=useState('Toutes')
 const done=state.me.stats.byPassion.find(p=>p.passion===passion)?.tried??[]
 const start=async(id:string,duration:5|15|30=5)=>{if(busy)return;setBusy(true);setError(undefined);try{
  if(!state.me.user.passions.includes(passion)){const response=await api.updatePassions([...state.me.user.passions,passion]);dispatch({type:'user',user:response.user})}
  dispatch({type:'newFlow',flow:{passion,fixedPassion:passion,fixedStep:id,duration}})
  reset([{name:'home'},{name:'learn'},{name:'learnPassion',passion},{name:'activity'}])
 }catch(e){setError((e as Error).message);setBusy(false)}}
 const removeRule=(id:string)=>{const next=review.filter(r=>r!==id);setReview(next);try{localStorage.setItem(key,JSON.stringify(next));const mastered=JSON.parse(localStorage.getItem(key+':mastered')??'[]');localStorage.setItem(key+':mastered',JSON.stringify([...new Set([...mastered,id])]))}catch{}}
 return <Screen tabs className="interactive-workshop"><AppHeader/><header className="iw-heading"><div><h1>{getPassion(passion).label}</h1><p className="workshop-subtitle">Un parcours concret, à ton rythme.</p></div><Mascot pose={passion==='logique'?'think':passion==='francais'?'write':'idea'} size={76}/></header><ol className="iw-stages">{['Comprendre','Essayer','Pratiquer'].map((v,i)=><li key={v}>{i+1}. {v}</li>)}</ol><div className="iw-learn-list">{WORKSHOP_LESSONS[passion].map((lesson,i)=>{const id=`${passion}-lesson-${i+1}`;return <button type="button" disabled={busy} key={id} className="iw-learn-row" onClick={()=>void start(id)}>{done.includes(id)?<Check size={22}/>:<span>{i+1}</span>}<span><strong>{lesson.title}</strong><small>{done.includes(id)?'Leçon terminée · revoir':'Règle, exercice guidé, mise en pratique'}</small></span><ChevronRight size={18}/></button>})}</div>
 {passion==='francais'&&<><h2 className="font-bold text-xl">Mes règles à revoir</h2>{!review.length&&<p className="iw-reviewed">Les règles gardées depuis tes corrections apparaîtront ici. Elles sont conservées sur cet appareil.</p>}{FRENCH_RULES.filter(r=>review.includes(r.id)).map(rule=><section key={rule.id} className="iw-review-rule"><h3>{rule.title}</h3><p>{rule.explanation}</p><p>{rule.example}</p><button type="button" onClick={()=>removeRule(rule.id)}>Je la maîtrise · retirer de mes révisions</button></section>)}<h2 className="font-bold text-xl">Réviser les bases</h2><div className="iw-section-tabs">{['Toutes','Conjugaison','Orthographe','Grammaire et accords','Ponctuation et syntaxe'].map(c=><button type="button" key={c} aria-pressed={category===c} onClick={()=>setCategory(c)}>{c}</button>)}</div><div className="iw-learn-list">{FRENCH_RULES.filter(r=>category==='Toutes'||r.category===category).map(r=><details className="iw-review-rule" key={r.id}><summary>{r.title}</summary><p>{r.explanation}</p><p>{r.example}</p><Button size="sm" disabled={busy} onClick={()=>void start(`francais-5-${r.category==='Conjugaison'?1:r.category==='Orthographe'?2:r.category==='Grammaire et accords'?3:4}`)}>Pratiquer cette catégorie</Button></details>)}</div></>}
 {error&&<p role="alert">{error}</p>}
 </Screen>
}
