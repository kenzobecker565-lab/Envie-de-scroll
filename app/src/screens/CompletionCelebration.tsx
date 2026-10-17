import {useState} from 'react'
import {Check,Images,Sparkles} from 'lucide-react'
import {activityBrief,getActivity,getPassion,progressFor} from '@scroll-up/shared'
import {Screen} from '../components/Screen.tsx'
import {MinutonFigure} from '../components/Mascot.tsx'
import {Logo,BrandMark} from '../components/Brand.tsx'
import {PassionIllustration} from '../components/PassionIllustration.tsx'
import {Button} from '../components/ui/button.tsx'
import {creationTitle} from '../lib/gallery.ts'
import {useNavigation,type DoneResult} from '../state/AppState.tsx'
import '../components/ActivityStage.css'
import './CompletionCelebration.css'

export function CompletionCelebration({done}:{done:DoneResult}) {
 const {reset}=useNavigation(),{completion,stats,coinsEarned}=done.response
 const [failedPhoto,setFailedPhoto]=useState(false)
 const after=progressFor(completion.passion,stats.byPassion),before=progressFor(completion.passion,done.previousStats.byPassion)
 const earnedXp=Math.max(0,after.xp-before.xp),label=getPassion(completion.passion).label
 const photo=Boolean(completion.photoUrl&&!failedPhoto),writing=completion.passion==='ecriture'&&Boolean(completion.text?.trim())
 const activity=getActivity(completion.activityId)
 const title=completion.exploredTitle?.trim()||(writing&&activity?activityBrief(activity)?.title:undefined)||creationTitle(completion)
 return <Screen className="scroll-flow activity-stage completion-celebration">
  <header className="activity-stage-cover"><div className="activity-stage-brand"><Logo height={30}/></div><div className="activity-stage-heading"><h1>Bien joué !</h1><MinutonFigure pose="cheer" size={140} animated={false}/><span className="celebration-sparkles" aria-hidden="true">✦ · ✧</span></div></header>
  <section className="celebration-result" aria-label="Ton activité enregistrée">
   <div className={`celebration-art ${photo?'is-photo':writing?'is-notebook':'is-illustration'}`}>
    {photo?<img src={completion.photoUrl!} alt="Ta création" onError={()=>setFailedPhoto(true)}/>:writing?<p>{completion.text}</p>:<PassionIllustration passion={completion.passion}/>}
    {writing&&<span className="celebration-page-curl" aria-hidden="true"/>}
   </div>
   <span className="celebration-passion">{label}</span>
   <h2>{title}</h2>
   <p className="celebration-saved" role="status"><Check size={18}/>{photo||writing?'Ajouté à ta galerie':'Activité enregistrée'}</p>
  </section>
  {(coinsEarned>0||earnedXp>0)&&<div className="celebration-rewards" aria-label="Tes récompenses">{earnedXp>0&&<span><Sparkles size={26} fill="currentColor"/>+{earnedXp} XP</span>}{coinsEarned>0&&<span><BrandMark size={30}/><strong>+{coinsEarned} <small>minutons</small></strong></span>}</div>}
  <section className="celebration-progress" aria-label={`Ma progression en ${label}`}><div><strong>{label} · Niveau {after.level}</strong>{after.total>0&&<span>{after.count} / {after.total} activités découvertes</span>}</div><progress aria-label="Expérience vers le niveau suivant" value={after.progress} max={1}/><div className="celebration-xp-caption"><span>{after.xp}{after.nextXp?` / ${after.nextXp}`:''} XP</span><span>{after.next?`${Math.max(0,(after.nextXp??after.xp)-after.xp)} XP avant le niveau ${after.next.level}`:'Niveau maximum atteint'}</span></div></section>
  <div className="celebration-actions"><Button onClick={()=>reset([{name:'home'},{name:'gallery',passion:completion.passion,focus:completion.id}])}><Images size={22}/>Voir dans ma galerie</Button><button type="button" onClick={()=>reset([{name:'home'}],-1)}>Retour à l’accueil</button></div>
 </Screen>
}
