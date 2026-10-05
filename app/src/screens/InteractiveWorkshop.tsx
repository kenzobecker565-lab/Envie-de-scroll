import { studioConfig } from '@scroll-up/shared'
import { StudioSession, StudioSaved } from './StudioSession.tsx'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Bookmark, Check, HelpCircle, Play, Plus, Square } from 'lucide-react'
import { BEAT_PALETTES, FRENCH_RULES, TRACKS, WORKSHOP_LESSONS, emptyPattern, getPassion, explainPuzzle, puzzleCorrect, referencePattern, validateWorkshop, workshopConfig, type Assignment, type Beat, type FrenchQuestion, type ProposalDTO, type Puzzle, type WorkshopResult, type WorkshopSubmission } from '@scroll-up/shared'
import { Button } from '../components/ui/button.tsx'
import { Screen } from '../components/Screen.tsx'
import { WorkshopHero } from '../components/WorkshopHero.tsx'
import { api } from '../api/client.ts'
import { playBeat } from '../lib/beatSound.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import './InteractiveWorkshop.css'

type Draft={logicReview?:boolean;beat:Beat;answers:Record<string,unknown>;notes:Record<string,number[]>;index:number;stage:number;checked:string[];review:string[]}
function readDraft(key:string,fallback:Draft):Draft {try{const raw=localStorage.getItem(key);if(raw){const value=JSON.parse(raw);if(value.beat&&value.answers&&Array.isArray(value.checked))return {...fallback,...value}}}catch{/* unavailable storage */}return fallback}
function remember(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{/* private storage can be full */}}
function initial(proposal:ProposalDTO):Draft {
 const c=workshopConfig(proposal.activityId)!,count=proposal.duration===30?3:proposal.duration===15?2:1
 const pattern=c.task.mode==='vary'?referencePattern():c.task.mode==='complete'?referencePattern().map((row,i)=>i===2?Array<boolean>(16).fill(false):row):emptyPattern()
 let copy:Beat|undefined;try{const raw=sessionStorage.getItem('scroll-up:beat-copy');if(raw){copy=JSON.parse(raw);sessionStorage.removeItem('scroll-up:beat-copy')}}catch{/* no copy */}
 return {beat:copy?{...copy,name:copy.name+' · copie',patterns:Array.from({length:count},(_,i)=>structuredClone(copy!.patterns[i%copy!.patterns.length]!))}:{name:'',tempo:90,palette:'hip-hop',patterns:Array.from({length:count},()=>structuredClone(pattern))},answers:{},notes:{},index:0,stage:c.lesson===undefined?2:0,checked:[],review:[]}
}

function LegacyInteractiveWorkshop({proposal,onAnother}:{proposal:ProposalDTO;onAnother?:()=>void}) {
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),config=workshopConfig(proposal.activityId)!
 const key=`scroll-up:workshop:${state.me.user.id}:${proposal.id}`
 const [draft,setDraft]=useState<Draft>(()=>readDraft(key,initial(proposal))),[saving,setSaving]=useState(false),[error,setError]=useState<string>()
 const savingRef=useRef(false)
 const lesson=config.lesson===undefined?undefined:WORKSHOP_LESSONS[proposal.passion as keyof typeof WORKSHOP_LESSONS][config.lesson]
 useEffect(()=>remember(key,draft),[key,draft])
 const update=(patch:Partial<Draft>)=>setDraft(prev=>({...prev,...patch}))
 const submission:WorkshopSubmission={version:1,passion:proposal.passion as WorkshopSubmission['passion'],...(proposal.passion==='rythme'?{beat:draft.beat}:{answers:draft.answers,savedRules:draft.review})}
 let valid=false;try{validateWorkshop(proposal.activityId,submission);valid=true}catch{/* incomplete, guidance shown after validation */}
 const finish=async()=>{
  if(savingRef.current)return;setError(undefined)
  try{validateWorkshop(proposal.activityId,submission)}catch(e){setError((e as Error).message);return}
  if(proposal.passion==='logique'&&!draft.logicReview){update({logicReview:true});window.setTimeout(()=>window.scrollTo(0,0),0);return}
  savingRef.current=true;setSaving(true)
  try{const previousStats=state.me.stats,response=await api.complete({proposalId:proposal.id,workshop:submission})
   dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats,photoPending:false,continuation:{}}});dispatch({type:'newFlow'})
   try{localStorage.removeItem(key)}catch{/* no storage */}
   reset([{name:'home'},{name:'done'}])
  }catch(e){setError(e instanceof Error?e.message:'L’enregistrement a échoué. Réessaie.');savingRef.current=false;setSaving(false)}
 }
 const lessonTry=()=>{
  if(proposal.passion==='rythme'){try{validateWorkshop(proposal.activityId,{...submission,beat:{...draft.beat,name:draft.beat.name||'Essai'}})}catch(e){setError((e as Error).message);return}}
  else if(proposal.passion==='logique'&&draft.notes.try?.[0]!==1){setError('Cet horaire correspond à 18 h 10. Reprends le calcul : 18 h 30 moins 20 minutes.');return}
  else if(proposal.passion==='francais'&&draft.notes.try?.[0]!==1){setError(config.lesson===0?'Après « si » + imparfait : conditionnel présent.':config.lesson===1?'Le sujet « groupe » est singulier.':'Le complément direct « lettres » est placé avant : on accorde au féminin pluriel.');return}
  setError(undefined);update({stage:2})
 }
 return <Screen tabs className="interactive-workshop"><WorkshopHero passion={proposal.passion} subtitle={`${getPassion(proposal.passion).label} · ${proposal.duration} min`} title={lesson?lesson.title:proposal.passion==='rythme'?'Ton studio':proposal.passion==='logique'?'À toi de déduire':'Les règles en pratique'}/>
 {lesson&&<><ol className="iw-stages">{['Comprendre','Essayer','Pratiquer'].map((s,i)=><li key={s} aria-current={draft.stage===i?'step':undefined}>{i+1}. {s}</li>)}</ol>{draft.stage===0?<section className="iw-card"><h2>La règle</h2><p>{lesson.rule}</p><blockquote>{lesson.example}</blockquote><Button onClick={()=>update({stage:1})}>Essayer<ArrowRight size={18}/></Button></section>:draft.stage===1?<section className="iw-card"><h2>À toi d’essayer</h2>{proposal.passion==='rythme'?<BeatStudio beat={draft.beat} onChange={beat=>update({beat})} model={config.lesson===0?{...draft.beat,patterns:[referencePattern().map((r,i)=>i===0?r:r.map(()=>false))]}:{...draft.beat,patterns:[referencePattern()]}}/>:<><p>{proposal.passion==='logique'?'Un accès a lieu 20 minutes avant 18 h 30. À quelle heure ?':config.lesson===0?'Si je pouvais, je … ce dossier.':config.lesson===1?'Le groupe de visiteurs … demain.':'Les lettres que j’ai … sont courtes.'}</p><div className="iw-options">{(proposal.passion==='logique'?['18 h 20','18 h 10']:config.lesson===0?['terminerai','terminerais']:config.lesson===1?['arrivent','arrive']:['écrit','écrites']).map((text,i)=><button type="button" key={text} aria-pressed={draft.notes.try?.[0]===i} onClick={()=>update({notes:{...draft.notes,try:[i]}})}>{text}</button>)}</div></>}<Button onClick={lessonTry}>Vérifier et pratiquer<ArrowRight size={18}/></Button></section>:null}</>}
 {draft.stage===2&&<>
 {proposal.passion==='rythme'?<><section className="iw-card iw-consigne"><h2>{config.task.title}</h2><p>{config.lesson===0?'Place seulement la grosse caisse sur les quatre temps : pas 1, 5, 9, 13.':config.task.instruction}</p>{proposal.duration>5&&<p>{proposal.duration===15?'Compose deux variations différentes.':'Construis trois sections distinctes : intro, thème et final.'}</p>}</section><BeatStudio beat={draft.beat} onChange={beat=>update({beat})} model={{...draft.beat,patterns:[config.lesson===0?referencePattern().map((r,i)=>i===0?r:r.map(()=>false)):referencePattern()]}}/><label className="iw-label">Nom de ton beat<input maxLength={80} placeholder="Mon premier beat" value={draft.beat.name} onChange={e=>update({beat:{...draft.beat,name:e.target.value}})}/></label></>:proposal.passion==='logique'?draft.logicReview?<><section className="iw-card"><h2>Ta séance compte, même sans tout résoudre</h2><p>Voici la correction de chaque dossier. Tu peux enregistrer ton activité et recevoir tes minutons.</p></section>{config.cases.map(p=><LogicCorrection key={p.id} puzzle={p} answer={draft.answers[p.id]}/>)}<button type="button" className="iw-text-button" onClick={()=>update({logicReview:false})}>Revenir à mes réponses</button></>:<LogicSession puzzles={config.cases} draft={draft} update={update}/>:<FrenchSession questions={config.questions} draft={draft} update={update} userId={state.me.user.id}/>}
 <div className="iw-save"><Button disabled={saving} onClick={()=>void finish()}><Check size={18}/>{saving?'Enregistrement…':proposal.passion==='rythme'?'Enregistrer mon beat':proposal.passion==='logique'&&!draft.logicReview?'Terminer et voir la correction':valid?'Enregistrer ma séance':'Vérifier ma séance'}</Button><small>Ton travail rejoint ta galerie · +{proposal.duration} minutons</small></div>
 {onAnother&&<button type="button" className="iw-text-button" onClick={onAnother}>Une autre activité</button>}
 </>}{error&&<p role="alert" className="iw-error">{error}</p>}<p className="iw-draft-note">Ta séance en cours est conservée sur cet appareil.</p>
 </Screen>
}

export function BeatStudio({beat,onChange,model,readOnly=false}:{beat:Beat;onChange?:(beat:Beat)=>void;model?:Beat;readOnly?:boolean}) {
 const [section,setSection]=useState(0),[step,setStep]=useState(-1),[playing,setPlaying]=useState(false),[error,setError]=useState<string>()
 const stop=useRef<(()=>void)|undefined>(undefined),alive=useRef(true),starting=useRef(false),generation=useRef(0)
 const stopNow=()=>{generation.current++;stop.current?.();stop.current=undefined;setPlaying(false);setStep(-1)}
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;stop.current?.()}},[])
 useEffect(()=>{stopNow()},[beat.tempo,beat.palette,beat.patterns])
 const play=async(value:Beat)=>{if(starting.current)return;if(playing){stopNow();return}starting.current=true;const id=++generation.current;setError(undefined)
  try{const cancel=await playBeat(value,(i,s)=>{if(alive.current){setStep(i);if(i<0)setPlaying(false);else if(value===beat)setSection(s)}});if(!alive.current||id!==generation.current){cancel();return}stop.current=cancel;setPlaying(true)}catch(e){if(alive.current)setError((e as Error).message)}finally{starting.current=false}}
 const labels=beat.patterns.length===3?['Intro','Thème','Final']:beat.patterns.length===2?['Boucle A','Variation B']:['Boucle']
 const selected=Math.min(section,beat.patterns.length-1)
 return <section className="beat-studio iw-card"><div className="iw-section-tabs">{labels.map((label,i)=><button type="button" key={label} aria-pressed={selected===i} onClick={()=>{stopNow();setSection(i)}}>{label}</button>)}</div>
 <div className="beat-steps" role="group" aria-label="Séquenceur à seize pas"><div className="beat-count"><span/>{Array.from({length:16},(_,i)=><span key={i}>{i%4===0?i/4+1:'·'}</span>)}</div>{TRACKS.map((name,t)=><div className="beat-row" key={name}><span className="beat-track">{name}</span>{beat.patterns[selected]![t]!.map((on,i)=><button type="button" key={i} data-track={t} data-on={on} data-current={step===i} disabled={readOnly} aria-label={`${name}, pas ${i+1}`} aria-pressed={on} onClick={()=>{stopNow();const patterns=structuredClone(beat.patterns);patterns[selected]![t]![i]=!on;onChange?.({...beat,patterns})}}/>)}</div>)}</div>
 <div className="beat-transport"><Button size="sm" onClick={()=>void play(beat)}>{playing?<Square size={17}/>:<Play size={17}/>} {playing?'Arrêter':'Lire mon beat'}</Button>{model&&!readOnly&&<button type="button" className="iw-text-button" onClick={()=>void play(model)}>Écouter le modèle</button>}</div>
 {!readOnly&&<><label className="iw-label">Tempo <strong>{beat.tempo} BPM</strong><input type="range" min={50} max={180} value={beat.tempo} onChange={e=>onChange?.({...beat,tempo:Number(e.target.value)})}/></label><div className="iw-section-tabs" aria-label="Palette sonore">{BEAT_PALETTES.map(p=><button type="button" key={p} aria-pressed={beat.palette===p} onClick={()=>onChange?.({...beat,palette:p})}>{p}</button>)}</div>{beat.patterns.length>1&&<button type="button" className="iw-text-button" onClick={()=>{stopNow();const patterns=structuredClone(beat.patterns);patterns[(selected+1)%patterns.length]=structuredClone(patterns[selected]!);onChange?.({...beat,patterns});setSection((selected+1)%patterns.length)}}>Copier dans la section suivante</button>}</>}{error&&<p role="alert">{error}</p>}
 </section>
}

function LogicSession({puzzles,draft,update}:{puzzles:Puzzle[];draft:Draft;update:(d:Partial<Draft>)=>void}) {
 const [explainedId,setExplainedId]=useState<string>(),[tab,setTab]=useState('Témoignages'),[hints,setHints]=useState<Record<string,number>>({}),[feedback,setFeedback]=useState<string>()
 const index=Math.min(draft.index,puzzles.length-1),p=puzzles[index]!,answer=draft.answers[p.id],checked=draft.checked.includes(p.id)
 const assignment=(answer as Assignment|undefined)??{rooms:[-1,-1,-1,-1],times:[-1,-1,-1,-1]}
 const verify=()=>{setExplainedId(p.id);if(puzzleCorrect(p,answer)){update({checked:[...new Set([...draft.checked,p.id])]});setFeedback('Tous les indices concordent. Dossier résolu.')}else setFeedback('Ce n’est pas encore la solution. Voici le raisonnement détaillé ; tu peux terminer la séance même sans avoir trouvé.')}
 const notes=draft.notes[p.id]??Array<number>(16).fill(0),hint=hints[p.id]??0
 return <><div className="iw-section-tabs" aria-label="Dossiers">{puzzles.map((v,i)=><button type="button" key={v.id} aria-pressed={index===i} onClick={()=>{update({index:i});setFeedback(undefined)}}>{i+1}. {draft.checked.includes(v.id)?'Résolu':v.family}</button>)}</div><section className="iw-card"><span className="iw-eyebrow">{p.family} · {index+1}/{puzzles.length}</span><h2>{p.title}</h2>{p.kind==='grid'?<><p>Quatre personnes, quatre salles, quatre accès. Chacun est entré dans une salle différente à un horaire différent. Retrouve toute la chronologie.</p><div className="iw-section-tabs">{['Témoignages','Accès','Plan'].map(v=><button type="button" aria-pressed={tab===v} key={v} onClick={()=>setTab(v)}>{v}</button>)}</div>{tab==='Témoignages'?<ol className="logic-clues">{p.clues.map((clue,i)=><li key={clue.text}><span>Indice {i+1}</span>{clue.text}</li>)}</ol>:tab==='Accès'?<ul className="logic-access">{p.times.map(t=><li key={t}>{t} · un seul accès</li>)}</ul>:<div className="logic-plan">{p.rooms.map(r=><span key={r}>{r}<small>Une seule personne</small></span>)}</div>}
 <h3>Ta grille de déduction</h3><p className="iw-muted">Appuie pour alterner : indéterminé → exclu → confirmé. La grille sert de carnet ; les choix ci-dessous constituent ta réponse.</p><div className="logic-matrix"><table><thead><tr><th>Personne</th>{p.rooms.map(r=><th key={r}>{r}</th>)}</tr></thead><tbody>{p.people.map((person,r)=><tr key={person}><th>{person}</th>{p.rooms.map((room,c)=>{const i=r*4+c,status=notes[i]??0;return <td key={room}><button type="button" aria-label={`${person}, ${room} : ${['indéterminé','exclu','confirmé'][status]}`} data-status={status} onClick={()=>{const next=[...notes];next[i]=(status+1)%3;update({notes:{...draft.notes,[p.id]:next}})}}>{['·','×','✓'][status]}</button></td>})}</tr>)}</tbody></table></div>
 <div className="logic-assignments">{p.people.map((person,i)=><div key={person}><strong>{person}</strong>{(['rooms','times'] as const).map(kind=><label key={kind}><span className="sr-only">{person} : {kind==='rooms'?'salle':'horaire'}</span><select value={assignment[kind][i]} onChange={e=>{const a=structuredClone(assignment);a[kind][i]=Number(e.target.value);update({answers:{...draft.answers,[p.id]:a},checked:draft.checked.filter(id=>id!==p.id)});setFeedback(undefined);setExplainedId(undefined)}}><option value={-1}>{kind==='rooms'?'Salle':'Horaire'}</option>{(kind==='rooms'?p.rooms:p.times).map((v,j)=><option key={v} value={j}>{v}</option>)}</select></label>)}</div>)}</div></>:<><p className="logic-message">{p.prompt}</p><label className="iw-label">Ta réponse<input value={typeof answer==='string'?answer:''} maxLength={80} autoComplete="off" onChange={e=>{update({answers:{...draft.answers,[p.id]:e.target.value},checked:draft.checked.filter(id=>id!==p.id)});setFeedback(undefined);setExplainedId(undefined)}}/></label></>}
 <Button variant="secondary" onClick={verify}>{checked?<Check size={17}/>:null}Vérifier mon raisonnement</Button>{feedback&&<p role="status" className={checked?'iw-correct':'iw-muted'}>{feedback}</p>}</section>{explainedId===p.id&&<LogicCorrection puzzle={p} answer={answer}/>}<section className="logic-help iw-card"><h3><HelpCircle size={18}/>Un coup de pouce</h3><p>Aucun minuton dépensé. Prends le temps de comprendre.</p>{hint>0&&<p className="logic-hint">{p.hints[hint-1]}</p>}<div className="iw-section-tabs">{['Une piste','La méthode','L’explication'].map((label,i)=><button type="button" key={label} onClick={()=>setHints({...hints,[p.id]:i+1})}>{label}</button>)}</div></section></>
}

function FrenchSession({questions,draft,update,userId}:{questions:FrenchQuestion[];draft:Draft;update:(d:Partial<Draft>)=>void;userId:string}) {
 const index=Math.min(draft.index,questions.length-1),q=questions[index]!,rule=FRENCH_RULES.find(r=>r.id===q.rule)!,answer=draft.answers[q.id] as number|undefined,checked=draft.checked.includes(q.id)
 const [saved,setSaved]=useState(false),[retry,setRetry]=useState<number>(),[retryChecked,setRetryChecked]=useState(false)
 const retryQuestion=questions.find(v=>v.rule===q.rule&&v.id!==q.id)??q
 useEffect(()=>{setRetry(undefined);setRetryChecked(false);setSaved(draft.review.includes(q.rule))},[q.id])
 const verify=()=>{if(answer!==0&&answer!==1)return;const review=answer===q.answer?draft.review:[...new Set([...draft.review,q.rule])];update({checked:[...new Set([...draft.checked,q.id])],review});if(answer!==q.answer){const key=`scroll-up:french-review:${userId}`;let old:string[]=[];try{old=JSON.parse(localStorage.getItem(key)??'[]')}catch{}remember(key,[...new Set([...old,q.rule])])}}
 const saveRule=()=>{const key=`scroll-up:french-review:${userId}`;let old:string[]=[];try{old=JSON.parse(localStorage.getItem(key)??'[]')}catch{}remember(key,[...new Set([...old,q.rule])]);update({review:[...new Set([...draft.review,q.rule])]});setSaved(true)}
 const finished=questions.every(v=>draft.checked.includes(v.id))
 return <><div className="french-session-count"><span>{rule.category}</span><strong>{index+1} / {questions.length}</strong></div><div className="iw-progress"><i style={{width:`${draft.checked.length/questions.length*100}%`}}/></div><section className="iw-card french-exercise"><span className="iw-eyebrow">{q.id.startsWith('text-')?'Correction de texte':rule.title}</span><h2>{q.prompt}</h2><div className="iw-options">{q.options.map((option,i)=><button type="button" key={option} aria-pressed={answer===i} data-result={checked?(i===q.answer?'correct':answer===i?'wrong':''):undefined} disabled={checked} onClick={()=>update({answers:{...draft.answers,[q.id]:i}})}>{option}{checked&&i===q.answer&&<Check size={18}/>}</button>)}</div>{!checked?<Button onClick={verify} disabled={answer!==0&&answer!==1}>Vérifier</Button>:<><p role="status" className={answer===q.answer?'iw-correct':'iw-muted'}>{answer===q.answer?'Bien vu.':'La bonne réponse : '+q.options[q.answer]}</p><div className="french-rule"><h3>Pourquoi ?</h3><p>{rule.explanation}</p><blockquote>{rule.example}</blockquote><button type="button" className="iw-text-button" onClick={saveRule}><Bookmark size={16}/>{saved?'Règle ajoutée à mes révisions':'Garder cette règle à revoir'}</button></div><details className="french-retry"><summary>Réessayer cette règle</summary><p>{retryQuestion.prompt}</p><div className="iw-options">{retryQuestion.options.map((v,i)=><button type="button" aria-pressed={retry===i} key={v} onClick={()=>{setRetry(i);setRetryChecked(false)}}>{v}</button>)}</div><button type="button" className="iw-text-button" disabled={retry===undefined} onClick={()=>setRetryChecked(true)}>Vérifier cet essai</button>{retryChecked&&<p role="status">{retry===retryQuestion.answer?'Exact. Tu as appliqué la règle.':rule.explanation}</p>}</details></>}
 <div className="french-navigation"><button type="button" className="iw-text-button" disabled={index===0} onClick={()=>update({index:index-1})}>Précédent</button>{index<questions.length-1&&<Button size="sm" disabled={!checked} onClick={()=>update({index:index+1})}>Suivant<ArrowRight size={16}/></Button>}</div></section>{finished&&<section className="iw-card"><h2>Ta séance est terminée</h2><p>{questions.filter(v=>draft.answers[v.id]===v.answer).length} / {questions.length} réponses justes.</p><p>{draft.review.length?`${draft.review.length} règle(s) à revoir dans Apprendre.`:'Les règles de cette séance sont bien appliquées.'}</p></section>}</>
}

export function WorkshopGalleryDetail({result,activityId}:{result:WorkshopResult;activityId:string}) {
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),config=workshopConfig(activityId)
 const [error,setError]=useState<string>(),[copying,setCopying]=useState(false)
 const copy=async()=>{if(!result.beat||copying)return;setCopying(true);setError(undefined);try{
  if(!state.me.user.passions.includes('rythme')){const response=await api.updatePassions([...state.me.user.passions,'rythme']);dispatch({type:'user',user:response.user})}
  sessionStorage.setItem('scroll-up:beat-copy',JSON.stringify(result.beat))
  dispatch({type:'newFlow',flow:{passion:'rythme',fixedPassion:'rythme',duration:result.beat.patterns.length===3?30:result.beat.patterns.length===2?15:5,fixedStep:`rythme-${result.beat.patterns.length===3?30:result.beat.patterns.length===2?15:5}-${result.beat.patterns.length===3?15:result.beat.patterns.length===2?10:5}`}})
  reset([{name:'home'},{name:'passionHub'},{name:'passionSpace',passion:'rythme'},{name:'activity'}])
 }catch(e){setError((e as Error).message);setCopying(false)}}
 if(result.version===2&&result.studio)return <StudioSaved result={result}/>
 return <div className="workshop-gallery-detail"><h2>{result.summary}</h2>{result.beat?<><BeatStudio beat={result.beat} readOnly/><Button disabled={copying} onClick={()=>void copy()}><Plus size={17}/>Modifier une copie</Button>{error&&<p role="alert">{error}</p>}</>:result.passion==='francais'?config?.questions.map(q=><section className="iw-card" key={q.id}><h3>{q.prompt}</h3><p>Ta réponse : {q.options[result.answers?.[q.id] as number]}</p><p className="iw-correct">Correction : {q.options[q.answer]}</p><p>{FRENCH_RULES.find(r=>r.id===q.rule)?.explanation}</p></section>):config?.cases.map(p=><LogicCorrection key={p.id} puzzle={p} answer={result.answers?.[p.id]}/>)}</div>
}


function LogicCorrection({puzzle,answer}:{puzzle:Puzzle;answer?:unknown}) {
 const explanation=explainPuzzle(puzzle,answer),correct=puzzleCorrect(puzzle,answer)
 return <section className="iw-card logic-correction" aria-label={`Correction : ${puzzle.title}`}><span className="iw-eyebrow">{puzzle.family} · {correct?'Réponse juste':'À comprendre'}</span><h2>Correction : {puzzle.title}</h2>{explanation.mistakes.length>0&&<div className="logic-mistakes"><h3>Ce qui manquait dans ta réponse</h3><ul>{explanation.mistakes.map(text=><li key={text}>{text}</li>)}</ul></div>}<div className="logic-solution"><h3>La solution</h3><ul>{explanation.solution.map(text=><li key={text}>{text}</li>)}</ul></div><h3>Le raisonnement, étape par étape</h3><ol className="logic-explanation">{explanation.steps.map((text,i)=><li key={i}><span>{i+1}</span><p>{text}</p></li>)}</ol><p className="iw-muted">Comprendre la méthode fait partie de l’activité. Une réponse incorrecte n’empêche pas d’enregistrer ta séance.</p></section>
}

export function InteractiveWorkshop(props:{proposal:ProposalDTO;onAnother?:()=>void}) { return studioConfig(props.proposal.activityId)?<StudioSession {...props}/>:<LegacyInteractiveWorkshop {...props}/> }
