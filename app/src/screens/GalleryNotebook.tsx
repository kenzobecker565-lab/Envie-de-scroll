import {useEffect,useMemo,useRef,useState} from 'react'
import {AnimatePresence,motion,useReducedMotion} from 'motion/react'
import {ArrowLeft,ArrowRight,BookOpen,ChevronLeft,ChevronRight,List,Palette,Search} from 'lucide-react'
import {parseAtelierAppearance,type CompletionDTO} from '@scroll-up/shared'
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '../components/ui/dialog.tsx'
import {Button} from '../components/ui/button.tsx'
import {api} from '../api/client.ts'
import {useAppState} from '../state/AppState.tsx'
import {creationTitle,paginateText} from '../lib/gallery.ts'
import {formatDay} from '../lib/format.ts'
import {WorkshopGalleryDetail} from './InteractiveWorkshop.tsx'

type NotebookProps={items:CompletionDTO[];french?:boolean;more?:boolean;loading?:boolean;onMore:()=>void}
export function GalleryNotebook({items,french=false,more=false,loading=false,onMore}:NotebookProps){
 const {state,dispatch}=useAppState(),preferences=parseAtelierAppearance(state.me.user.atelier)
 const book=preferences.notebook??{title:'Mes petits élans',color:'violet' as const,motif:'avion' as const}
 const [reading,setReading]=useState(false),[contents,setContents]=useState(false),[editing,setEditing]=useState(false),[query,setQuery]=useState(''),[saving,setSaving]=useState(false),[error,setError]=useState(''),[draft,setDraft]=useState(book)
 const key=`scroll-up:lecture:${state.me.user.id}:${french?'francais':'ecriture'}`
 const [position,setPosition]=useState<{id:string;page:number}>(()=>{try{const value=JSON.parse(localStorage.getItem(key)??'null');return value&&typeof value.id==='string'&&Number.isInteger(value.page)&&value.page>=0?value:{id:'',page:0}}catch{return {id:'',page:0}}})
 const [restored,setRestored]=useState<CompletionDTO>()
 useEffect(()=>{if(!position.id||items.some(item=>item.id===position.id))return;let live=true;api.completion(position.id).then(({completion})=>{if(live&&completion.passion===(french?'francais':'ecriture'))setRestored(completion)}).catch(()=>{});return()=>{live=false}},[position.id,items,french])
 const entries=useMemo(()=>[...new Map([...items,...(restored?[restored]:[])].map(item=>[item.id,item])).values()].filter(item=>french?Boolean(item.workshop||item.text?.trim()||item.exploredTitle?.trim()):Boolean(item.text?.trim())).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[items,french,restored])
 const selected=entries.find(item=>item.id===position.id)??entries[0]
 const open=(item?:CompletionDTO)=>{if(item)setPosition({id:item.id,page:0});else if(selected)setPosition(p=>({...p,id:selected.id}));setContents(false);setReading(true)}
 const save=async()=>{if(saving)return;setSaving(true);setError('');try{const response=await api.updateAtelier({...preferences,notebook:draft});dispatch({type:'user',user:response.user});setEditing(false)}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
 return <>
  <div className="gallery-book-cover" data-color={book.color} data-motif={book.motif}>
   <img src="/art/gallery-notebook.webp" alt="" width="600" height="900"/>
   <div className="gallery-book-lettering"><strong>{french?'Mes pages de français':book.title}</strong><small>{state.me.user.firstName?`Le carnet de ${state.me.user.firstName}`:'Mon carnet personnel'}</small></div>
   {!french&&book.motif==='etoile'&&<span className="gallery-book-star" aria-hidden="true">★</span>}
  </div>
  <div className="gallery-book-caption"><h2>{entries.length} {french?(entries.length===1?'page conservée':'pages conservées'):(entries.length===1?'texte à feuilleter':'textes à feuilleter')}{more?' et la suite à charger':''}</h2><p>Un carnet qui grandit avec toi.</p></div>
  <Button disabled={!entries.length} onClick={()=>open()}>Ouvrir mon carnet<ArrowRight size={19}/></Button>
  <div className="gallery-book-actions"><Button variant="secondary" disabled={!entries.length} onClick={()=>setContents(true)}><List size={18}/>Sommaire</Button>{!french&&<Button variant="secondary" onClick={()=>{setDraft(book);setError('');setEditing(true)}}><Palette size={18}/>Personnaliser</Button>}</div>
  {french&&entries.slice(0,3).map(item=><button className="gallery-session-row" type="button" key={item.id} onClick={()=>open(item)}><BookOpen/><span><strong>{creationTitle(item)}</strong><small>{formatDay(item.createdAt)}</small></span><ChevronRight/></button>)}
  {more&&<Button variant="secondary" disabled={loading} onClick={onMore}>{loading?'Chargement…':'Charger les pages précédentes'}</Button>}
  <Dialog open={editing} onOpenChange={setEditing}><DialogContent><DialogTitle>Personnaliser mon carnet</DialogTitle><DialogDescription>Ta couverture est conservée sur ton compte.</DialogDescription><label>Titre du carnet<input className="gallery-input" maxLength={60} value={draft.title} disabled={saving} onChange={e=>setDraft(v=>({...v,title:e.target.value}))}/></label><fieldset disabled={saving}><legend>Couleur</legend><div className="gallery-chips">{(['violet','lavande','sauge'] as const).map(color=><button type="button" key={color} aria-pressed={draft.color===color} onClick={()=>setDraft(v=>({...v,color}))}>{color==='violet'?'Violet':color==='lavande'?'Lavande':'Sauge'}</button>)}</div></fieldset><fieldset disabled={saving}><legend>Motif</legend><div className="gallery-chips">{(['avion','etoile','aucun'] as const).map(motif=><button type="button" key={motif} aria-pressed={draft.motif===motif} onClick={()=>setDraft(v=>({...v,motif}))}>{motif==='avion'?'Avion':motif==='etoile'?'Étoile':'Sans motif'}</button>)}</div></fieldset>{error&&<p role="alert">{error}</p>}<Button disabled={saving||!draft.title.trim()} onClick={()=>void save()}>{saving?'Enregistrement…':'Enregistrer ma couverture'}</Button></DialogContent></Dialog>
  <Dialog open={contents} onOpenChange={setContents}><DialogContent className="gallery-contents"><DialogTitle>Sommaire</DialogTitle><DialogDescription>{entries.length} entrées chargées{more?' · D’autres pages sont disponibles':''}.</DialogDescription><label className="gallery-search"><Search size={19}/><input aria-label="Rechercher un texte" placeholder="Rechercher un texte" value={query} onChange={e=>setQuery(e.target.value)}/></label>{entries.filter(item=>`${creationTitle(item)} ${item.text??''}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).map(item=><button className="gallery-session-row" type="button" key={item.id} onClick={()=>open(item)}><span><strong>{creationTitle(item)}</strong><small>{formatDay(item.createdAt)}{item.id===position.id?' · Lecture en cours':''}</small></span><ChevronRight/></button>)}{more&&<Button variant="secondary" disabled={loading} onClick={onMore}>{loading?'Chargement…':'Charger la suite du sommaire'}</Button>}</DialogContent></Dialog>
  {selected&&<NotebookReader open={reading} close={()=>setReading(false)} entries={entries} selected={selected} position={position} setPosition={next=>{setPosition(next);try{localStorage.setItem(key,JSON.stringify(next))}catch{/* Reading works without device storage. */}}} title={french?'Mon carnet de français':book.title} french={french} showContents={()=>{setReading(false);setContents(true)}}/>}
 </>
}
function NotebookReader({open,close,entries,selected,position,setPosition,title,french,showContents}:{open:boolean;close:()=>void;entries:CompletionDTO[];selected:CompletionDTO;position:{id:string;page:number};setPosition:(v:{id:string;page:number})=>void;title:string;french:boolean;showContents:()=>void}){
 const reduced=useReducedMotion(),[size,setSize]=useState(18),[direction,setDirection]=useState(1)
 const touch=useRef<{x:number;y:number}|null>(null),body=useRef<HTMLDivElement>(null)
 const pages=useMemo(()=>french&&selected.workshop?['']:paginateText(selected.text??selected.exploredTitle??'',size===18?650:size===21?480:340),[selected,size,french])
 const page=Math.min(Math.max(0,position.page||0),pages.length-1),entryIndex=entries.findIndex(item=>item.id===selected.id)
 const hasPrev=page>0||entryIndex>0,hasNext=page<pages.length-1||entryIndex<entries.length-1
 const move=(step:number)=>{if(step<0&&!hasPrev||step>0&&!hasNext)return;setDirection(step)
  if(page+step>=0&&page+step<pages.length)setPosition({id:selected.id,page:page+step})
  else{const next=entries[entryIndex+step]!;const count=french&&next.workshop?1:paginateText(next.text??next.exploredTitle??'',size===18?650:size===21?480:340).length;setPosition({id:next.id,page:step>0?0:count-1})}
 }
 useEffect(()=>{body.current?.scrollTo({top:0})},[selected.id,page])
 return <Dialog open={open} onOpenChange={value=>{if(!value)close()}}><DialogContent className="gallery-reader" showCloseButton={false}><div className="gallery-reader-toolbar"><button type="button" aria-label="Fermer le carnet" onClick={close}><ArrowLeft/></button><DialogTitle>{title}</DialogTitle><button type="button" aria-label={`Taille du texte : ${size}. Changer la taille`} onClick={()=>{setSize(v=>v===18?21:v===21?24:18);setPosition({id:selected.id,page:0})}}>Aa</button><button type="button" aria-label="Ouvrir le sommaire" onClick={showContents}><List/></button></div><DialogDescription className="sr-only">Un texte par entrée. Utilise les flèches ou glisse horizontalement pour feuilleter.</DialogDescription><div className="gallery-reader-paper" ref={body} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}}} tabIndex={0} onTouchStart={e=>{const t=e.touches[0];if(t)touch.current={x:t.clientX,y:t.clientY}}} onTouchEnd={e=>{const t=e.changedTouches[0],start=touch.current;touch.current=null;if(t&&start&&Math.abs(t.clientX-start.x)>70&&Math.abs(t.clientY-start.y)<45)move(t.clientX<start.x?1:-1)}}>
 <AnimatePresence mode="wait" initial={false}><motion.article key={`${selected.id}-${page}-${size}`} initial={{opacity:reduced?1:0,rotateY:reduced?0:direction*45,x:reduced?0:direction*12}} animate={{opacity:1,rotateY:0,x:0}} exit={{opacity:reduced?1:0,rotateY:reduced?0:direction*-50,x:reduced?0:direction*-10}} transition={{duration:reduced?0:.28}}><h2>{creationTitle(selected)}</h2><small>{formatDay(selected.createdAt)} · {selected.duration} min</small>{french&&selected.workshop?<><WorkshopGalleryDetail result={selected.workshop} activityId={selected.activityId}/>{selected.text&&<section><h3>Mon texte conservé</h3><p className="gallery-reader-text" style={{fontSize:size}}>{selected.text}</p></section>}</>:<p className="gallery-reader-text" style={{fontSize:size}}>{pages[page]}</p>}</motion.article></AnimatePresence></div><footer className="gallery-reader-footer"><button type="button" disabled={!hasPrev} aria-label="Page précédente" onClick={()=>move(-1)}><ChevronLeft/></button><div aria-live="polite"><strong>{entryIndex+1} / {entries.length} · Page {page+1} sur {pages.length}</strong><small>Glisse pour feuilleter · Défile pour lire</small></div><button type="button" disabled={!hasNext} aria-label="Page suivante" onClick={()=>move(1)}><ChevronRight/></button></footer></DialogContent></Dialog>
}
