import {Clock3,Share2,BookOpen} from 'lucide-react'
import {motion,useReducedMotion} from 'motion/react'
import {getPassion,type CompletionDTO} from '@scroll-up/shared'
import {DialogHeader,DialogTitle,DialogDescription} from './ui/dialog.tsx'
import {Button} from './ui/button.tsx'
import {MinutonFigure,type MinutonPose} from './Mascot.tsx'
import {PassionIllustration} from './PassionIllustration.tsx'
import {WorkshopGalleryDetail} from '../screens/InteractiveWorkshop.tsx'
import {SportGalleryDetail} from '../screens/SportSession.tsx'
import {creationTitle} from '../lib/gallery.ts'
import {formatDay} from '../lib/format.ts'
import {shareCreation} from '../lib/share.ts'
import {track} from '../api/client.ts'
import {useAppState} from '../state/AppState.tsx'
import './SavedActivity.css'

const POSES:Record<string,MinutonPose>={dessin:'gallery-drawing',ecriture:'gallery-writing',piano:'gallery-piano',sport:'gallery-sport',logique:'gallery-logic',francais:'gallery-reading'}
/** Same presentation from every gallery entry point; saved content is never shortened. */
export function SavedActivity({item,title}:{item:CompletionDTO;title?:string}){
 const {state}=useAppState(),reduced=useReducedMotion(),passion=getPassion(item.passion)
 return <div className="saved-activity" data-passion={item.passion}>
  <DialogHeader className="saved-activity-header"><div className="saved-activity-meta"><span>{passion.label}</span><span><Clock3 size={13}/>{item.duration} min</span></div><DialogTitle>{title??creationTitle(item)}</DialogTitle><DialogDescription>{formatDay(item.createdAt)}</DialogDescription><MinutonFigure pose={POSES[item.passion]??'idea'} size={90} animated={false}/></DialogHeader>
  <motion.div className="saved-activity-body" initial={{opacity:reduced?1:0,y:reduced?0:8}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.25}}>
   {item.photoUrl&&<figure className="saved-artwork"><div><img src={item.photoUrl} alt={`Mon dessin : ${creationTitle(item)}`} width="600" height="600"/></div><figcaption>Mon dessin conservé</figcaption></figure>}
   {!item.photoUrl&&!item.workshop&&!item.sport&&!item.text&&<div className="saved-session-illustration"><PassionIllustration passion={item.passion}/><span>{item.passion==='piano'?'Un moment au piano':item.passion==='sport'?'Une pause pour bouger':item.passion==='logique'?'Un temps pour chercher':'Un moment pour toi'}</span></div>}
   {item.photoPending&&!item.photoUrl&&<p className="saved-activity-notice" role="status">La photo de ton dessin est attendue. Envoie-la au bot pour la retrouver ici.</p>}
   {item.text&&<section className="saved-writing-page"><span className="saved-page-label"><BookOpen size={15}/>{item.passion==='ecriture'?'Mes mots, à relire':'Mon texte conservé'}</span><p>{item.text}</p></section>}
   {item.workshop&&<section className="saved-activity-review"><h2>{item.passion==='logique'?'Mon dossier et ses pistes':'Ma séance et ses corrections'}</h2><WorkshopGalleryDetail result={item.workshop} activityId={item.activityId}/></section>}
   {item.sport&&<section className="saved-activity-review"><h2>Ma séance conservée</h2><p className="saved-session-summary">{item.sport.summary}</p><SportGalleryDetail activityId={item.activityId} easy={item.sport.easy}/></section>}
   <details className="saved-activity-instructions"><summary>Revoir la consigne</summary><p>{item.activityText}</p>{item.exploredTitle&&item.passion!=='piano'&&<p>{item.exploredTitle}</p>}{item.extra&&<ul>{item.extra.items.map((value,index)=><li key={index}>{value}</li>)}</ul>}</details>
   <Button variant="secondary" className="saved-share" onClick={()=>{track('share',{passion:item.passion});shareCreation(item,state.me.botUsername)}}><Share2 size={17}/>Partager à un ami</Button>
  </motion.div>
 </div>
}
