import {useRef,useState} from 'react'
import {Check} from 'lucide-react'
import {activityBrief,getActivity,guideFor,keyboardMelody,type ProposalDTO} from '@scroll-up/shared'
import {ActivityStage,ActivityClock} from '../components/ActivityStage.tsx'
import {PianoKeyboard} from '../components/PianoKeyboard.tsx'
import {Button} from '../components/ui/button.tsx'
import {useCreativeClock} from '../lib/useCreativeClock.ts'
import {useAppState,useNavigation} from '../state/AppState.tsx'
import {api} from '../api/client.ts'
export function PianoActivity({proposal}:{proposal:ProposalDTO}){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),clock=useCreativeClock(proposal,state.flow.clockOffset,false)
 const melody=keyboardMelody(proposal.activityId),activity=getActivity(proposal.activityId),brief=activity&&activityBrief(activity),help=guideFor(proposal.activityId)
 const [played,setPlayed]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),lock=useRef(false)
 const draftKey=`scroll-up:piano:${state.me.user.id}:${proposal.id}`
 const finish=async()=>{if(lock.current||clock.busy||(!played&&!!melody))return;lock.current=true;setSaving(true);setError('');try{
  const response=await api.complete({proposalId:proposal.id,played:!!melody&&played,exploredTitle:melody?.title})
  clock.markFinished();dispatch({type:'stats',stats:response.stats});dispatch({type:'openProposal',proposal:null});dispatch({type:'done',done:{response,previousStats:state.me.stats,photoPending:false}});dispatch({type:'newFlow'});try{localStorage.removeItem(draftKey)}catch{}reset([{name:'home'},{name:'done'}])
 }catch(e){setError((e as Error).message);lock.current=false;setSaving(false)}}
 return <ActivityStage passion="piano" clock={<ActivityClock clock={clock}/>}>
  {!melody&&<section className="stage-task-heading"><h2>{brief?.title??'Joue librement'}</h2><p>{proposal.text}</p></section>}
  <PianoKeyboard key={proposal.id} melody={melody} layout="activity" draftKey={draftKey} onComplete={()=>setPlayed(true)} help={<><p>{proposal.text}</p>{help?.tips.map(tip=><p key={tip}>{tip}</p>)}{brief?.steps.map(step=><p key={step.title}><strong>{step.title}.</strong> {step.text}</p>)}</>}/>
  <footer className="stage-actions">{error&&<p role="alert">{error}</p>}<Button className="scroll-primary" disabled={saving||clock.busy||(melody?!played:clock.elapsed<proposal.duration*60)} onClick={()=>void finish()}><Check/>{saving?'Enregistrement…':'J’ai terminé'}</Button>
  {melody&&!played&&<p className="scroll-note">Joue chaque partie pour valider le morceau.</p>}
  <button type="button" className="scroll-text-button" disabled={saving||clock.busy} onClick={async()=>{if(await clock.pause())reset([{name:'home'}])}}>Garder pour plus tard</button></footer>
 </ActivityStage>
}
