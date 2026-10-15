import { ArrowUpRight, Home, Star } from 'lucide-react'
import { progressFor } from '@scroll-up/shared'
import { FlowShell } from './ScrollFlowScreens.tsx'
import { MinutonFigure } from '../components/Mascot.tsx'
import { MinutonHangs } from '../components/MinutonHangs.tsx'
import { BrandMark } from '../components/Brand.tsx'
import { PracticeProgress } from '../components/PracticeProgress.tsx'
import { Button } from '../components/ui/button.tsx'
import { useAppState, useNavigation, type DoneResult } from '../state/AppState.tsx'
export function CompletionCelebration({done}:{done:DoneResult}) {
 const {dispatch}=useAppState(),{reset}=useNavigation(),{completion,stats,coinsEarned}=done.response
 const after=progressFor(completion.passion,stats.byPassion),before=progressFor(completion.passion,done.previousStats.byPassion)
 const hasCreation=Boolean(completion.photoUrl||completion.text)
 return <FlowShell step={3} title="Tu l’as fait !" subtitle={hasCreation?'Ta création est enregistrée.':'Ton activité est enregistrée.'} illustration={<MinutonFigure pose="cheer" size={100} animated={false}/>}>
  <div className="completion-preview"><MinutonHangs item={completion}/></div>
  <div className="completion-rewards"><span><Star size={25}/>+{Math.max(0,after.xp-before.xp)} XP</span><span><BrandMark size={30}/>+{coinsEarned}<small>minutons</small></span></div>
  <PracticeProgress passion={completion.passion} rows={stats.byPassion}/>
  {!hasCreation&&<p className="completion-keep">Même sans fichier joint, cette activité garde sa place dans ton atelier.</p>}
  <Button className="scroll-primary" onClick={()=>reset([{name:'home'},{name:'atelier',focus:completion.id}])}>Voir dans mon atelier<ArrowUpRight/></Button>
  <Button variant="secondary" onClick={()=>{dispatch({type:'newFlow',flow:{duration:completion.duration,scrollFlow:true}});reset([{name:'home'},{name:'ideas'}])}}>Une nouvelle activité</Button><button type="button" className="scroll-text-button" onClick={()=>reset([{name:'home'}],-1)}><Home size={16} className="inline"/> Retour à l’accueil</button>
 </FlowShell>
}
