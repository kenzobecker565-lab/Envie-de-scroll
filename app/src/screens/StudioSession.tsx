import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Bookmark, Check, ChevronRight, HelpCircle, RotateCcw, Save } from 'lucide-react'
import { FRENCH_RULES, studioAnswerLabel, studioConfig, studioCorrect, studioReviewRules, validateWorkshop, type ProposalDTO, type StudioConfig, type StudioSavedStep, type StudioTask, type WorkshopResult } from '@scroll-up/shared'
import { api } from '../api/client.ts'
import { ApprovedMinuton, StudioArt } from '../components/StudioArt.tsx'
import { Screen } from '../components/Screen.tsx'
import { Button } from '../components/ui/button.tsx'
import { keepReview } from '../lib/frenchReview.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import './PassionStudio.css'
export type StudioDraft={version:2;answers:Record<string,unknown>;index:number;checked:string[];hints:Record<string,number>;started:boolean;review:boolean;savedRules:string[]}
function loadDraft(key:string,c:StudioConfig):StudioDraft{
 const empty:StudioDraft={version:2,answers:{},index:0,checked:[],hints:{},started:false,review:false,savedRules:[]}
 try{const v=JSON.parse(localStorage.getItem(key)??'null');if(v?.version===2&&v.answers&&typeof v.answers==='object'&&!Array.isArray(v.answers)&&Array.isArray(v.checked)&&v.hints&&typeof v.hints==='object')return {...empty,...v,index:Number.isInteger(v.index)?Math.max(0,Math.min(c.tasks.length-1,v.index)):0,checked:v.checked.filter((id:string)=>c.tasks.some(t=>t.id===id)),savedRules:Array.isArray(v.savedRules)?v.savedRules:[]}}catch{}return empty
}
export function StudioSession({proposal,onAnother}:{proposal:ProposalDTO;onAnother?:()=>void}){
 const c=studioConfig(proposal.activityId)!,{state,dispatch}=useAppState(),{reset}=useNavigation(),userId=String(state.me.user.id)
 const key=`scroll-up:studio:${userId}:${proposal.id}`
 const [draft,setDraft]=useState(()=>loadDraft(key,c)),[saving,setSaving]=useState(false),[error,setError]=useState<string>(),[storageOK,setStorageOK]=useState(true),savingRef=useRef(false)
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(draft));setStorageOK(true)}catch{setStorageOK(false)}},[draft,key])
 const t=c.tasks[draft.index]!,answer=draft.answers[t.id],checked=draft.checked.includes(t.id)
 const submission={version:2 as const,passion:c.passion,answers:draft.answers,savedRules:draft.savedRules}
 const quit=()=>{dispatch({type:'openProposal',proposal});reset([{name:'home'},{name:'passionHub'},{name:'passionSpace',passion:c.passion}])}
 const changed=(value:unknown)=>setDraft(v=>({...v,answers:{...v.answers,[t.id]:value},checked:v.checked.filter(id=>id!==t.id)}))
 const verify=()=>{if(c.passion==='francais'&&!taskAnswered(t,answer)){setError('Complète cet exercice avant de vérifier.');return}setError(undefined);setDraft(v=>({...v,checked:[...new Set([...v.checked,t.id])]}));if(c.passion==='francais'&&studioCorrect(t,answer)===false){keepReview(userId,studioReviewRules(t,answer))}}
 const finish=async()=>{
  if(savingRef.current)return
  if(c.passion==='francais'&&!c.tasks.every(t=>draft.checked.includes(t.id))){setError('Vérifie chaque exercice avant d’enregistrer.');return}
  if(!draft.review){setDraft(v=>({...v,review:true}));window.scrollTo(0,0);return}
  try{validateWorkshop(proposal.activityId,submission)}catch(e){setError((e as Error).message);return}
  savingRef.current=true;setSaving(true);setError(undefined)
  try{const previousStats=state.me.stats,response=await api.complete({proposalId:proposal.id,workshop:submission});if(response.completion.workshop?.reviewRules)keepReview(userId,response.completion.workshop.reviewRules)
   dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats,photoPending:false,continuation:{}}});dispatch({type:'newFlow'});try{localStorage.removeItem(key)}catch{}reset([{name:'home'},{name:'done'}])
  }catch(e){setError((e as Error).message);savingRef.current=false;setSaving(false)}
 }
 return <Screen tabs className="interactive-workshop passion-studio" ><header className="studio-session-hero"><StudioArt passion={c.passion} index={c.art} large/><div><h1>{c.title}</h1><span>{c.duration} min environ{c.passion==='logique'?` · ${c.difficulty}`:''}</span></div></header>
 {!draft.started?<><section className="iw-card studio-brief"><p>{c.description}</p>{c.lesson&&<><h2>La règle</h2><p>{c.lesson.rule}</p><blockquote>{c.lesson.example}</blockquote></>}<h2>{c.lesson?'À toi de pratiquer':c.passion==='logique'?'Les étapes de ton enquête':'Dans cette séance'}</h2><ol>{c.tasks.map((v,i)=><li key={v.id}><span>{i+1}</span><strong>{v.title}</strong></li>)}</ol><p className="studio-mint">{storageOK?'Ta progression est conservée sur cet appareil.':'Le stockage est indisponible : garde cette page ouverte pour conserver ta progression.'}</p><Button onClick={()=>setDraft(v=>({...v,started:true}))}>{c.lesson?'Essayer la règle':c.passion==='logique'?'Commencer l’enquête':'Commencer ma révision'}<ChevronRight size={18}/></Button><Button variant="secondary" onClick={onAnother??quit}>{c.passion==='logique'?'Changer de dossier':'Changer de séance'}</Button></section></>:draft.review?<><h2 className="studio-section-title">{c.passion==='logique'?'Comprendre la solution':'Ma séance et ses corrections'}</h2>{c.passion==='logique'&&<p>Ta séance compte aussi sans avoir tout résolu. Voici les réponses et le raisonnement.</p>}{c.tasks.map(v=><StudioCorrection key={v.id} task={v} answer={draft.answers[v.id]}/>)}<Button variant="secondary" onClick={()=>setDraft(v=>({...v,review:false}))}>Revenir à mes réponses</Button></>:<>
 <div className="studio-step-count"><span>{c.lesson?'Pratiquer':c.passion==='logique'?'Étape':'Exercice'} {draft.index+1} / {c.tasks.length}</span><span>{draft.checked.length} vérifié{draft.checked.length>1?'s':''}</span></div><div className="iw-progress"><i style={{width:`${draft.checked.length/c.tasks.length*100}%`}}/></div>
 <StudioTaskPlayer key={t.id} task={t} answer={answer} onChange={changed}/>
 <div className="studio-action-pair"><Button variant="secondary" onClick={()=>setDraft(v=>({...v,hints:{...v.hints,[t.id]:Math.min(3,(v.hints[t.id]??0)+1)}}))}><HelpCircle size={18}/>Un indice</Button><Button onClick={verify}>{checked?<Check size={17}/>:null}{t.kind==='rewrite'?'Comparer aux pistes':'Vérifier'}</Button></div>
 {(draft.hints[t.id]??0)>0&&<aside className="studio-hint"><ApprovedMinuton size={52}/><div><strong>Indice {draft.hints[t.id]} / 3</strong><p>{t.hints[(draft.hints[t.id]??1)-1]}</p></div></aside>}
 {checked&&<><StudioCorrection task={t} answer={answer}/>{c.passion==='francais'&&t.rule&&<button type="button" className="iw-text-button" onClick={()=>{keepReview(userId,[t.rule!]);setDraft(v=>({...v,savedRules:[...new Set([...v.savedRules,t.rule!])]}))}}><Bookmark size={17}/>{draft.savedRules.includes(t.rule)?'Règle gardée dans mes révisions':'Garder cette règle à revoir'}</button>}</>}
 <div className="studio-action-pair"><Button variant="secondary" disabled={draft.index===0} onClick={()=>{setError(undefined);setDraft(v=>({...v,index:v.index-1}));window.scrollTo(0,0)}}>Précédent</Button>{draft.index<c.tasks.length-1&&<Button disabled={c.passion==='francais'&&!checked} onClick={()=>{setError(undefined);setDraft(v=>({...v,index:v.index+1}));window.scrollTo(0,0)}}>Suivant<ChevronRight size={18}/></Button>}</div>
 </>}
 {draft.started&&<><div className="studio-save"><Button disabled={saving} onClick={()=>void finish()}>{saving?'Enregistrement…':draft.review?'Enregistrer mon activité':c.passion==='logique'?'Terminer et voir la correction':'Voir le bilan de ma séance'}</Button><small>Dans ta galerie · +{proposal.duration} minutons après enregistrement</small></div><button type="button" className="iw-text-button" onClick={quit}><Save size={17}/>Sauvegarder et quitter</button></>}
 {error&&<p className="iw-error" role="alert">{error}</p>}{!storageOK&&<p role="status" className="iw-error">Le stockage est indisponible. Ne ferme pas cette page avant d’enregistrer la séance.</p>}
 </Screen>
}
export function taskAnswered(t:StudioTask,v:unknown):boolean{
 if(t.kind==='choice')return Number.isInteger(v)&&Number(v)>=0&&Number(v)<t.options!.length
 if(t.kind==='repair')return Array.isArray(v)&&v.length===t.repairs!.length&&v.every(x=>typeof x==='string'&&x.trim().length>0)
 if(t.kind==='order')return Array.isArray(v)&&v.length===t.options!.length
 if(t.kind==='circuit')return Array.isArray(v)&&v.length>1
 return typeof v==='string'&&v.trim().length>=(t.kind==='rewrite'?15:1)
}
export function StudioTaskPlayer({task:t,answer,onChange}:{task:StudioTask;answer:unknown;onChange:(value:unknown)=>void}){
 const [tab,setTab]=useState(0),[undo,setUndo]=useState<number[][]>([])
 const nodes=Array.isArray(answer)?answer as number[]:[0]
 const move=(i:number,dir:number)=>{const v=Array.isArray(answer)?[...answer] as number[]:t.options!.map((_,j)=>j);[v[i],v[i+dir]]=[v[i+dir]!,v[i]!];onChange(v)}
 return <section className="iw-card studio-task"><span className="iw-eyebrow">{t.kind==='rewrite'?'Atelier de réécriture':t.kind==='repair'?'Mise en pratique':t.rule?FRENCH_RULES.find(r=>r.id===t.rule)?.title:'À toi de raisonner'}</span><h2>{t.title}</h2><p>{t.prompt}</p>
 {t.evidence.length>0&&<><div className="iw-section-tabs" aria-label="Documents">{t.evidence.map((e,i)=><button key={e.title} type="button" aria-pressed={tab===i} onClick={()=>setTab(i)}>{e.title}</button>)}</div><article className="studio-evidence"><strong>{t.evidence[tab]!.title}</strong><p>{t.evidence[tab]!.text}</p></article></>}
 {t.kind==='choice'?<div className="iw-options">{t.options!.map((v,i)=><button type="button" key={v} aria-pressed={answer===i} onClick={()=>onChange(i)}>{v}</button>)}</div>:t.kind==='input'?<label className="iw-label">Ta réponse<input maxLength={200} autoComplete="off" value={typeof answer==='string'?answer:''} onChange={e=>onChange(e.target.value)}/></label>:t.kind==='order'?<div className="studio-order">{(Array.isArray(answer)?answer as number[]:t.options!.map((_,i)=>i)).map((v,i)=><div key={v}><span>{i+1}</span><strong>{t.options![v]}</strong><button type="button" aria-label={`Monter ${t.options![v]}`} disabled={i===0} onClick={()=>move(i,-1)}><ArrowUp size={17}/></button><button type="button" aria-label={`Descendre ${t.options![v]}`} disabled={i===t.options!.length-1} onClick={()=>move(i,1)}><ArrowDown size={17}/></button></div>)}{!Array.isArray(answer)&&<Button variant="secondary" size="sm" onClick={()=>onChange(t.options!.map((_,i)=>i))}>Confirmer cet ordre</Button>}</div>:t.kind==='circuit'?<>
 <div className="studio-energy">Énergie : {nodes.reduce((n,i)=>n+(t.circuit!.nodes[i]?.cost??0),0)} / {t.circuit!.budget} · Terminaux : C, F, I</div>
 <div className="studio-circuit"><svg viewBox="0 0 300 300" aria-hidden="true">{t.circuit!.edges.map(([a,b])=><line key={`${a}-${b}`} x1={50+t.circuit!.nodes[a]!.x*100} y1={50+t.circuit!.nodes[a]!.y*100} x2={50+t.circuit!.nodes[b]!.x*100} y2={50+t.circuit!.nodes[b]!.y*100} className={nodes.includes(a)&&nodes.includes(b)?'active':''}/>)}</svg>{t.circuit!.nodes.map((n,i)=><button type="button" key={n.label} style={{left:`${(50+n.x*100)/3}%`,top:`${(50+n.y*100)/3}%`}} aria-pressed={nodes.includes(i)} aria-label={`${n.label}, coût ${n.cost}${t.circuit!.targets.includes(i)?', terminal':''}`} disabled={i===0} onClick={()=>{setUndo(v=>[...v,nodes]);onChange(nodes.includes(i)?nodes.filter(v=>v!==i):[...nodes,i])}}><strong>{n.label}</strong><small>{n.cost} unité{n.cost>1?'s':''}</small>{nodes.includes(i)&&<Check size={12}/>}</button>)}</div>
 <div className="studio-action-pair"><Button size="sm" variant="secondary" disabled={!undo.length} onClick={()=>{onChange(undo[undo.length-1]!);setUndo(v=>v.slice(0,-1))}}>Annuler</Button><Button size="sm" variant="secondary" onClick={()=>{setUndo(v=>[...v,nodes]);onChange([0])}}><RotateCcw size={15}/>Réinitialiser</Button></div><p className="iw-muted">S : source fixe · C, F et I : terminaux. Une ligne relie uniquement deux nœuds activés. Le symbole ✓ indique un nœud actif.</p>
 </>:t.kind==='repair'?<div className="studio-repairs">{t.repairs!.map((r,i)=><label className="iw-label" key={`${r.wrong}-${i}`}><span>Remplacer « {r.wrong} »</span><input maxLength={120} aria-label={`Correction de ${r.wrong}`} value={Array.isArray(answer)&&typeof answer[i]==='string'?answer[i] as string:''} onChange={e=>{const v=Array.isArray(answer)?[...answer]:t.repairs!.map(()=> '');v[i]=e.target.value;onChange(v)}}/></label>)}</div>:<><label className="iw-label">Ma proposition<textarea maxLength={6000} rows={7} placeholder="Écris ta reformulation…" value={typeof answer==='string'?answer:''} onChange={e=>onChange(e.target.value)}/></label><aside className="studio-mint">Plusieurs formulations sont possibles. Le texte sera enregistré sans note automatique.</aside></>}
 </section>
}
export function StudioCorrection({task:t,answer}:{task:StudioTask;answer:unknown}){
 const correct=studioCorrect(t,answer),solution=t.kind==='repair'?t.repairs!.map(r=>r.right):t.solution
 return <section className="iw-card studio-correction"><h2>{t.title}</h2><div className="studio-your-answer"><strong>{t.kind==='rewrite'?'Ma proposition':'Ta réponse'}</strong><p>{studioAnswerLabel(t,answer)}</p></div>{correct!==null&&<div className={correct?'studio-mint':'studio-correction-answer'}><strong>{correct?'Les contraintes sont respectées.':'La solution à retenir'}</strong><p>{studioAnswerLabel(t,solution)}</p></div>}
 <h3>{t.kind==='rewrite'?'Pistes de relecture':'Le raisonnement'}</h3><ol className="studio-explanation">{t.explanation.map((s,i)=><li key={s}><span>{i+1}</span><p>{s}</p></li>)}</ol>{t.repairs&&t.repairs.map(r=><div className="studio-mint" key={r.wrong}><strong>{r.wrong} → {r.right}</strong><p>{FRENCH_RULES.find(v=>v.id===r.rule)?.explanation}</p></div>)}{t.rule&&!t.repairs&&<aside className="studio-mint"><strong>À retenir</strong><p>{FRENCH_RULES.find(r=>r.id===t.rule)?.explanation}</p></aside>}</section>
}
export function StudioSaved({result}:{result:WorkshopResult}){return <div className="workshop-gallery-detail passion-studio"><h2>{result.summary}</h2>{result.studio?.steps.map((s:StudioSavedStep)=><StudioCorrection key={s.task.id} task={s.task} answer={s.response}/>)}</div>}
