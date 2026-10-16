import {motion,useReducedMotion} from 'motion/react'
import {BookOpen,ChevronRight,FolderOpen,Plus} from 'lucide-react'
import type {CompletionDTO} from '@scroll-up/shared'
import {MinutonFigure} from './Mascot.tsx'
import {GalleryWorkPreview} from './LivingGallery.tsx'
import {creationTitle} from '../lib/gallery.ts'
import {formatDay} from '../lib/format.ts'
import './PassionRooms.css'

export function DrawingRoom({items,onOpen,onChoose,onStart}:{items:CompletionDTO[];onOpen:(item:CompletionDTO)=>void;onChoose:()=>void;onStart:()=>void}){
 const reduced=useReducedMotion(),first=items[0]
 return <section className="passion-room drawing-room"><div className="room-intro"><small>MON ATELIER</small><h2>Une place pour tes idées</h2></div><div className="drawing-stage"><div className="drawing-easel">{first?<motion.button type="button" initial={{rotate:reduced?0:-3,opacity:0}} animate={{rotate:0,opacity:1}} transition={{duration:reduced?0:.4}} onClick={()=>onOpen(first)} aria-label={`Ouvrir ${creationTitle(first)}`}><GalleryWorkPreview item={first}/></motion.button>:<button type="button" onClick={onStart}><Plus/><span>Ton prochain dessin<br/>commence ici</span></button>}</div><MinutonFigure pose="draw" size={150} animated={false}/></div><button className="room-action" onClick={onChoose}>Choisir les dessins<ChevronRight size={18}/></button><div className="room-sketchbook"><h3>Ton carnet de croquis</h3><div>{items.slice(0,6).map(item=><button type="button" key={item.id} onClick={()=>onOpen(item)} aria-label={creationTitle(item)}><GalleryWorkPreview item={item}/></button>)}<button type="button" onClick={onStart} aria-label="Créer un dessin"><Plus/></button></div><button type="button" className="room-action" onClick={onStart}>Créer un dessin<Plus size={18}/></button></div></section>
}
export function LogicRoom({items,onOpen,onStart}:{items:CompletionDTO[];onOpen:(item:CompletionDTO)=>void;onStart:()=>void}){
 const reduced=useReducedMotion()
 return <section className="passion-room logic-room"><div className="room-intro"><small>LE BUREAU DES DÉCLICS</small><h2>Chaque piste compte</h2></div><MinutonFigure pose="gallery-logic" size={125} animated={false}/><div className="logic-dossiers">{items.map((item,index)=><motion.button type="button" className="logic-dossier" key={item.id} initial={{opacity:reduced?1:0,y:reduced?0:14}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.3,delay:reduced?0:Math.min(index,3)*.05}} whileTap={reduced?undefined:{scale:.98}} onClick={()=>onOpen(item)}><span className="folder-tab"><FolderOpen size={15}/>DOSSIER {String(index+1).padStart(2,'0')}</span><strong>{creationTitle(item)}</strong><small>{formatDay(item.createdAt)} · {item.duration} min</small><span className="dossier-status">{item.workshop?.sawSolution?'Correction consultée':'Recherche conservée'}</span>{item.text&&<p>{item.text.slice(0,150)}</p>}<span className="dossier-open">Rouvrir le dossier<ChevronRight size={16}/></span></motion.button>)}{!items.length&&<div className="room-paper"><BookOpen/><h3>Ta première enquête t’attend</h3><p>Tes pistes et tes notes trouveront leur place ici.</p></div>}</div><button type="button" className="room-action" onClick={onStart}>Une nouvelle énigme<Plus size={18}/></button></section>
}
