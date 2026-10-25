import {useEffect,useMemo,useRef,useState} from 'react'
import {pianoPracticePlan,pianoPracticeExcerpt,type Melody,type Duration} from '@scroll-up/shared'
import {PianoKeyboard} from './PianoKeyboard.tsx'
import './PianoPractice.css'

type Progress={step:number;mastered:boolean;attempted:boolean}
export function PianoPractice({melody,duration,draftKey,onProgress}:{melody:Melody;duration:Duration;draftKey:string;onProgress:(progress:Progress)=>void}){
 const plan=useMemo(()=>pianoPracticePlan(pianoPracticeExcerpt(melody,duration),duration),[melody,duration])
 const [progress,setProgress]=useState<Progress>(()=>{try{const v=JSON.parse(localStorage.getItem(draftKey)??'null');if(v?.version===1&&v.melody===JSON.stringify(melody.notes)&&Number.isInteger(v.step)&&v.step>=0&&v.step<=plan.length)return {step:v.step,mastered:v.mastered===true&&v.step===plan.length,attempted:v.attempted===true}}catch{}return {step:0,mastered:false,attempted:false}})
 const [attempt,setAttempt]=useState(0),[finished,setFinished]=useState(false),[retry,setRetry]=useState(false),[help,setHelp]=useState(false)
 const mistakes=useRef(0),completed=useRef(false)
 const save=(next:Progress)=>{setProgress(next);try{localStorage.setItem(draftKey,JSON.stringify({...next,version:1,melody:JSON.stringify(melody.notes)}))}catch{}}
 const callback=useRef(onProgress);callback.current=onProgress
 useEffect(()=>{callback.current(progress)},[progress])
 const stage=plan[Math.min(progress.step,plan.length-1)]!
 const restart=()=>{mistakes.current=0;completed.current=false;setFinished(false);setRetry(false);setHelp(false);setAttempt(n=>n+1)}
 const next=()=>{restart();save({...progress,step:Math.min(progress.step+1,plan.length),mastered:progress.step+1===plan.length})}
 return <section className="piano-practice" >
  <header><span className="piano-practice-level">Débutant · Une main</span><h2>{melody.title}</h2><span>Extrait de {duration===5?1:duration===15?2:4} phrase{duration===5?'':'s'} au maximum</span><p>{progress.mastered?'Tu as rejoué ton passage deux fois sans indication.':stage.title}</p></header>
  <progress aria-label="Progression de l’apprentissage" value={progress.step} max={plan.length}/>

  <p className="piano-practice-instruction">{help?'Reprends avec les indications. Cet essai ne compte pas comme un passage de mémoire.':stage.support==='guided'?'Écoute la phrase avec « Écouter », puis suis les touches et répète.':stage.support==='start'?'Seule la première note est indiquée. Retrouve la suite.':'À toi de retrouver les notes sans indication. Prends ton temps.'}</p>
  <PianoKeyboard key={`${progress.step}-${attempt}`} melody={stage.melody} layout="activity" support={help?'guided':stage.support} onMistake={()=>{mistakes.current++}} onNote={(_,down)=>{if(down&&!progress.attempted)save({...progress,attempted:true})}} onComplete={()=>{if(completed.current)return;completed.current=true;setFinished(true);setRetry((stage.support==='memory'&&mistakes.current>0)||help)}}/>
  <div className="piano-practice-actions">
   {!progress.mastered&&finished&&(retry?<><p role="status">Reprends cette phrase sans indication pour la retenir.</p><button type="button" onClick={restart}>Réessayer sans aide</button></>:<button type="button" onClick={next}>{stage.final?'Confirmer mon passage':'Continuer'}</button>)}
   {progress.mastered?<p role="status">Passage retenu pour cette séance. Rejoue-le demain pour vérifier ce qui reste.</p>:stage.support!=='guided'&&!help&&<button type="button" className="piano-practice-help" onClick={()=>{restart();setHelp(true)}}>Reprendre avec de l’aide</button>}
  </div>
 </section>
}
