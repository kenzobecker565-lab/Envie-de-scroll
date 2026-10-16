import {useEffect,useState} from 'react'
import {ArchiveRestore,ChevronRight} from 'lucide-react'
import {activityBrief,getActivity,getPassion,type ProposalDTO} from '@scroll-up/shared'
import {api} from '../api/client.ts'
import {useAppState,useNavigation} from '../state/AppState.tsx'
import {sessionFlow,sessionStack} from '../lib/resumeSession.ts'
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from './ui/dialog.tsx'
import {PassionArtwork} from './PassionArtwork.tsx'
import './SavedSessions.css'
export function SavedSessions(){
 const {state,dispatch}=useAppState(),{reset}=useNavigation()
 const [items,setItems]=useState<ProposalDTO[]>([]),[open,setOpen]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState('')
 useEffect(()=>{let alive=true;api.savedSessions().then(r=>{if(alive)setItems(r.items)}).catch(()=>{if(alive)setError('Tes séances n’ont pas pu être chargées. Réessaie en rouvrant cette liste.')});return()=>{alive=false}},[state.me.openProposal?.id,open])
 const resume=async(item:ProposalDTO)=>{if(busy)return;setBusy(item.id);setError('');try{const r=await api.session(item.id,'resume');dispatch({type:'openProposal',proposal:r.proposal});dispatch({type:'newFlow',flow:sessionFlow(r.proposal,r.serverTime)});setOpen(false);reset(sessionStack(r.proposal))}catch(e){setError((e as Error).message)}finally{setBusy('')}}
 if(!items.length&&!error)return null
 return <><button type="button" className="saved-sessions-link" onClick={()=>setOpen(true)}><ArchiveRestore size={20}/><span>Mes séances à reprendre{items.length>0&&<small>{items.length} en cours · tes brouillons restent avec toi</small>}</span><ChevronRight size={18}/></button>
 <Dialog open={open} onOpenChange={setOpen}><DialogContent className="saved-sessions-dialog"><DialogHeader><DialogTitle>À ton rythme.</DialogTitle><DialogDescription>Reprends une séance là où tu l’as laissée. Les textes et dessins en cours sont gardés sur cet appareil.</DialogDescription></DialogHeader><div className="saved-sessions-list">{items.map(item=>{const activity=getActivity(item.activityId);return <button type="button" key={item.id} disabled={!!busy} onClick={()=>void resume(item)}><PassionArtwork passion={item.passion}/><span><small>{getPassion(item.passion).label} · {item.duration} min</small><strong>{activity&&activityBrief(activity)?.title||item.text}</strong><em>{busy===item.id?'Ouverture…':'Reprendre ma séance'}</em></span><ChevronRight size={18}/></button>})}</div>{error&&<p role="alert">{error}</p>}</DialogContent></Dialog></>
}
