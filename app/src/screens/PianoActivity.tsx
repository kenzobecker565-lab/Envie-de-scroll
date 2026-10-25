import {useRef,useState} from 'react'
import {Check} from 'lucide-react'
import {isPianoPracticeActivity,activityBrief,getActivity,guideFor,keyboardMelody,type ProposalDTO} from '@scroll-up/shared'
import {ActivityStage,ActivityClock} from '../components/ActivityStage.tsx'
import {PianoPractice} from '../components/PianoPractice.tsx'
import {PianoKeyboard} from '../components/PianoKeyboard.tsx'
import {Button} from '../components/ui/button.tsx'
import {useCreativeClock} from '../lib/useCreativeClock.ts'
import {useAppState,useNavigation} from '../state/AppState.tsx'
import {api} from '../api/client.ts'
export function PianoActivity({proposal}:{proposal:ProposalDTO}){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),clock=useCreativeClock(proposal,state.flow.clockOffset,false)
 const melody=keyboardMelody(proposal.activityId),activity=getActivity(proposal.activityId),brief=activity&&activityBrief(activity),help=guideFor(proposal.activityId)
 const [practice,setPractice]=useState({step:0,attempted:false,mastered:false})
 const [played,setPlayed]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),lock=useRef(false)
 const draftKey=`scroll-up:piano:${state.me.user.id}:${proposal.id}`
 const memoryMode=!!melody&&isPianoPracticeActivity(proposal.activityId)
 const enoughPractice=memoryMode?practice.attempted&&clock.elapsed>=proposal.duration*60:played
 const finish=async()=>{if(lock.current||clock.busy||(!!melody&&!enoughPractice))return;lock.current=true;setSaving(true);setError('');try{
  const response=await api.complete({proposalId:proposal.id,played:!!melody&&(memoryMode?practice.attempted:played),exploredTitle:melody?`${melody.title}${memoryMode?(practice.mastered?' · Notes rejouées sans aide':' · Séance de pratique'):''}`:undefined})
  clock.markFinished();dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats:state.me.stats,photoPending:false}});dispatch({type:'newFlow'});try{localStorage.removeItem(draftKey);localStorage.removeItem(draftKey+':memory')}catch{}reset([{name:'home'},{name:'done'}])
 }catch(e){setError((e as Error).message);lock.current=false;setSaving(false)}}
 return <ActivityStage passion="piano" clock={<ActivityClock clock={clock}/>}>
  {!melody&&<section className="stage-task-heading"><h2>{brief?.title??'Joue librement'}</h2><p>{proposal.text}</p></section>}
  {memoryMode&&melody?<PianoPractice key={proposal.id} melody={melody} duration={proposal.duration} draftKey={draftKey+':memory'} onProgress={setPractice}/>:<PianoKeyboard key={proposal.id} melody={melody} layout="activity" draftKey={draftKey} onComplete={()=>setPlayed(true)} help={<><p>{proposal.text}</p>{help?.tips.map(tip=><p key={tip}>{tip}</p>)}{brief?.steps.map(step=><p key={step.title}><strong>{step.title}.</strong> {step.text}</p>)}</>}/>}
  <footer className="stage-actions">{error&&<p role="alert">{error}</p>}<Button className="scroll-primary" disabled={saving||clock.busy||(melody?!enoughPractice:clock.elapsed<proposal.duration*60)} onClick={()=>void finish()}><Check/>{saving?'Enregistrement…':'J’ai terminé'}</Button>
  {melody&&<p className="scroll-note">{memoryMode?(practice.mastered?'Tu as retrouvé les notes sans aide. Continue à les rejouer jusqu’à la fin de la séance.':'La séance peut être terminée à la fin du temps prévu, même si tu as encore besoin d’aide.'):!played?'Joue chaque partie pour valider le morceau.':''}</p>}
  <button type="button" className="scroll-text-button" disabled={saving||clock.busy} onClick={async()=>{if(await clock.pause())reset([{name:'home'}])}}>Garder pour plus tard</button></footer>
 </ActivityStage>
}
