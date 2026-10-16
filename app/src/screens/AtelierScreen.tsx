import {useEffect,useState} from 'react'
import {Check,Palette,Frame,Leaf,X} from 'lucide-react'
import {parseAtelierAppearance,ATELIER_AMBIANCES,ATELIER_FRAMES,ATELIER_DECORS,type AtelierAppearance,type CompletionDTO} from '@scroll-up/shared'
import {api} from '../api/client.ts'
import {Screen} from '../components/Screen.tsx'
import {CarnetHeader} from '../components/CarnetHeader.tsx'
import {ExhibitionRoom,ExhibitionTray} from '../components/LivingGallery.tsx'
import {Button} from '../components/ui/button.tsx'
import {useAppState,useNavigation} from '../state/AppState.tsx'
import {creationTitle,hasCreation} from '../lib/gallery.ts'
import {CreationDialog,CreationPreview} from './PersonalGallery.tsx'
import {useGallery} from './useGallery.ts'
import './PersonalGallery.css'
/** The historical route is retained so old entry points still reach the exhibition. */
export function AtelierScreen({focus}:{focus?:string}){
 const {state,dispatch}=useAppState(),{reset}=useNavigation(),gallery=useGallery()
 const appearance=parseAtelierAppearance(state.me.user.atelier)
 const [draft,setDraft]=useState<AtelierAppearance>(appearance),[editing,setEditing]=useState(false),[choosing,setChoosing]=useState(false),[selection,setSelection]=useState<string[]>([]),[saving,setSaving]=useState(false),[error,setError]=useState(''),[opened,setOpened]=useState<CompletionDTO>(),[extra,setExtra]=useState<CompletionDTO[]>([])
 const [legacyPins]=useState<string[]>(()=>{try{const value=JSON.parse(localStorage.getItem(`scroll-up:atelier-pins:${state.me.user.id}`)??'{}');return value&&typeof value==='object'?Object.values(value).filter((id):id is string=>typeof id==='string'):[]}catch{return []}})
 useEffect(()=>{document.documentElement.toggleAttribute('data-gallery-editing',editing||choosing);return()=>document.documentElement.removeAttribute('data-gallery-editing')},[editing,choosing])
 const visible=editing?draft:appearance
 const all=[...new Map([...gallery.items,...extra].map(item=>[item.id,item])).values()]
 const defaults=[...new Set([...legacyPins.filter(id=>all.some(item=>item.id===id&&hasCreation(item))),...all.filter(item=>hasCreation(item)&&(item.photoUrl||item.text)).map(item=>item.id)])].slice(0,4)
 const ids=appearance.exposed??defaults
 const works=ids.flatMap(id=>{const item=all.find(value=>value.id===id);return item?[item]:[]})
 useEffect(()=>{let live=true;setExtra([]);setError('');const ids=appearance.exposed??legacyPins;Promise.allSettled(ids.map(id=>api.completion(id).then(r=>r.completion))).then(results=>{if(live){setExtra(results.flatMap(result=>result.status==='fulfilled'?[result.value]:[]));if(results.some(result=>result.status==='rejected'))setError('Certaines créations exposées n’ont pas pu être chargées. Réouvre l’exposition pour réessayer.')}});return()=>{live=false}},[JSON.stringify(appearance.exposed),legacyPins])
 useEffect(()=>{if(!focus)return;let live=true;api.completion(focus).then(r=>{if(live)setOpened(r.completion)}).catch(()=>{if(live)setError('Cette création n’a pas pu être ouverte.')});return()=>{live=false}},[focus])
 const save=async(value:AtelierAppearance)=>{if(saving)return;setSaving(true);setError('');try{const response=await api.updateAtelier(value);dispatch({type:'user',user:response.user});setEditing(false);setChoosing(false)}catch(e){setError((e as Error).message)}finally{setSaving(false)}}
 return <Screen tabs className="carnet-page personal-gallery living-gallery living-gallery-exhibition"><CarnetHeader title="Mon exposition" subtitle="Un lieu qui raconte tes pauses." variant="banner" pose="gallery-drawing"/>
 <div className="gallery-segment"><button type="button" onClick={()=>reset([{name:'home'},{name:'gallery'}])}>Mes univers</button><button type="button" aria-pressed="true">Mon exposition</button></div>
 <button className="gallery-text-button" type="button" disabled={saving} onClick={()=>{setDraft(appearance);setEditing(v=>!v);setChoosing(false);setError('')}}><Palette size={18}/>Personnaliser</button>
 <ExhibitionRoom items={works} appearance={visible} onOpen={setOpened} loading={gallery.loading}/>
 <ExhibitionTray items={all.filter(hasCreation)} onOpen={setOpened} onChoose={()=>{setSelection(ids);setChoosing(v=>!v);setEditing(false);setError('')}}/>
 <div className="living-decor-shortcuts">{[{label:'Ambiance',Icon:Palette},{label:'Cadres',Icon:Frame},{label:'Décor',Icon:Leaf}].map(({label,Icon})=><button type="button" key={label} onClick={()=>{setDraft(appearance);setEditing(true);setChoosing(false);setError('');setTimeout(()=>document.querySelector('.gallery-customizer')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}),50)}}><Icon size={19}/>{label}</button>)}</div>

 {editing&&<section className="gallery-customizer" aria-label="Personnalisation de mon exposition"><div className="gallery-list-heading"><h2>L’ambiance de ma galerie</h2><button type="button" aria-label="Annuler la personnalisation" disabled={saving} onClick={()=>setEditing(false)}><X/></button></div><fieldset disabled={saving}><legend>Ambiance</legend><div className="gallery-chips">{ATELIER_AMBIANCES.map(value=><button type="button" key={value} data-ambiance={value} aria-pressed={draft.ambiance===value} onClick={()=>setDraft(v=>({...v,ambiance:value}))}><span className="gallery-ambiance-preview"/>{({lavande:'Lavande',sauge:'Sauge',crepuscule:'Crépuscule'})[value]}</button>)}</div></fieldset><fieldset disabled={saving}><legend>Cadres</legend><div className="gallery-chips">{ATELIER_FRAMES.map(value=><button type="button" key={value} aria-pressed={draft.frames===value} onClick={()=>setDraft(v=>({...v,frames:value}))}>{({bois:'Bois',violet:'Violet',papier:'Papier'})[value]}</button>)}</div></fieldset><fieldset disabled={saving}><legend>Décor</legend><div className="gallery-chips">{ATELIER_DECORS.map(value=><button type="button" key={value} aria-pressed={draft.decor===value} onClick={()=>setDraft(v=>({...v,decor:value}))}>{value==='atelier'?'Atelier créatif':'Épuré'}</button>)}</div></fieldset><label><input type="checkbox" checked={draft.mascot} disabled={saving} onChange={e=>setDraft(v=>({...v,mascot:e.target.checked}))}/> Afficher Minuton</label><Button disabled={saving} onClick={()=>void save(draft)}><Check size={18}/>{saving?'Enregistrement…':'Enregistrer mon décor'}</Button><small>Aperçu avant enregistrement</small></section>}
 {choosing&&<section className="gallery-customizer" aria-label="Choisir les créations exposées"><h2>Choisir mes créations · {selection.length}/12</h2><p>Retire une pièce en la touchant à nouveau. Rien n’est supprimé de ta galerie.</p><div className="gallery-creation-grid">{all.filter(hasCreation).map(item=><button type="button" className="gallery-creation-card" key={item.id} aria-pressed={selection.includes(item.id)} onClick={()=>setSelection(old=>old.includes(item.id)?old.filter(id=>id!==item.id):old.length<12?[...old,item.id]:old)}><CreationPreview item={item}/><strong>{creationTitle(item)}</strong>{selection.includes(item.id)&&<Check className="gallery-card-pin"/>}</button>)}</div>{gallery.cursor&&<Button variant="secondary" disabled={gallery.loading} onClick={()=>void gallery.load(gallery.cursor!)}>Charger les créations précédentes</Button>}<Button disabled={saving} onClick={()=>void save({...appearance,exposed:selection})}>{saving?'Enregistrement…':'Enregistrer ma sélection'}</Button><Button variant="secondary" disabled={saving} onClick={()=>setChoosing(false)}>Annuler</Button></section>}
 {(error||gallery.error)&&<p role="alert">{error||gallery.error}</p>}
 <CreationDialog item={opened} close={()=>setOpened(undefined)} onUpdate={item=>{gallery.update(item);setExtra(old=>old.map(value=>value.id===item.id?item:value));setOpened(item)}}/>
 </Screen>
}
