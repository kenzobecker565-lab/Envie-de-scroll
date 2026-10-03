import { ArrowLeft, ArrowRight, ChevronRight, Clock3, Plus, Sparkles, Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { collection, dailyWord, getPassion, passionLevel, SHOP_ITEMS, type CompletionDTO, type Duration, type PassionId } from '@scroll-up/shared'
import { Button } from '@/components/ui/button'
import { api } from '../api/client.ts'
import { AppHeader } from '../components/AppHeader.tsx'
import { todayKey } from '../components/Challenge.tsx'
import { Mascot } from '../components/Mascot.tsx'
import { PassionArtwork, PassionPoster } from '../components/PassionArtwork.tsx'
import { currentPath } from '../components/Paths.tsx'
import { PassionDetail, statsFor } from '../components/Progression.tsx'
import { Screen } from '../components/Screen.tsx'
import { formatDay, plural } from '../lib/format.ts'
import { useShop } from '../lib/shop.ts'
import { useStartChallenge } from '../lib/useStartChallenge.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { GalleryScreen } from './GalleryScreen.tsx'

/** Starts a real catalog activity, keeping the existing completion and project flow. */
function useWorkshopStart() {
 const { state, dispatch } = useAppState()
 const { push, reset } = useNavigation()
 return (passion: PassionId, duration?: Duration, activityId?: string) => {
  if (!state.me.user.passions.includes(passion)) { push({ name:'passions', mode:'edit' }); return }
  dispatch({type:'newFlow',flow:{fixedPassion:passion, ...(duration?{passion,duration}:{}), ...(activityId?{fixedStep:activityId}:{})}})
  reset([{name:'home'},{name:'passionHub'},{name:'passionSpace',passion},{name:duration?'activity':'signal'}])
 }
}

function RecentCreations() {
 const {push}=useNavigation()
 const [items,setItems]=useState<CompletionDTO[]>([])
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading')
 const load=()=>{setStatus('loading');return api.completions().then(page=>{setItems(page.items.slice(0,2));setStatus('ready')}).catch(()=>setStatus('error'))}
 useEffect(()=>{let alive=true;api.completions().then(page=>{if(alive){setItems(page.items.slice(0,2));setStatus('ready')}}).catch(()=>alive&&setStatus('error'));return()=>{alive=false}},[])
 return <section className="workshop-recent"><div className="studio-section-heading"><h2>Dernières créations</h2><button onClick={()=>push({name:'gallery'})}>Tout voir<ChevronRight size={15}/></button></div>{status==='loading'?<p role="status">Chargement de tes créations…</p>:status==='error'?<Button variant="secondary" size="sm" onClick={()=>void load()}>Réessayer</Button>:items.length?<div className="workshop-gallery-grid">{items.map(item=><button type="button" key={item.id} className="workshop-creation" onClick={()=>push({name:'gallery',passion:item.passion})}><span className="workshop-creation-preview">{item.photoUrl?<img src={item.photoUrl} alt={item.activityText} loading="lazy"/>:<span>{item.text??item.exploredTitle??item.activityText}</span>}</span><strong>{item.exploredTitle??getPassion(item.passion).label}</strong><small>{formatDay(item.createdAt)}</small></button>)}</div>:<div className="workshop-empty"><p>Tes premières créations trouveront leur place ici.</p><button type="button" onClick={()=>push({name:'passions',mode:'edit'})}>Choisir mon atelier<ArrowRight size={16}/></button></div>}</section>
}

export function PassionHubScreen() {
 const {state}=useAppState(),{push}=useNavigation(),start=useWorkshopStart()
 const {user,stats}=state.me
 const passions=(['piano','dessin','ecriture','cinema','musique'] as PassionId[]).filter(id=>user.passions.includes(id)||stats.byPassion.some(row=>row.passion===id))
 const passion=user.passions.includes('dessin')?'dessin':user.passions[0]
 const idea=passion?collection(passion).find(group=>group.duration===5)?.activities[0]:undefined
 return <Screen tabs className="studio-passions"><AppHeader/><div className="studio-page-heading"><h1>Mes passions</h1><button type="button" className="studio-icon-button" aria-label="Gérer mes passions" onClick={()=>push({name:'passions',mode:'edit'})}><Plus size={22}/></button></div><p className="workshop-subtitle">Un peu chaque jour, à ta façon.</p>{passion&&idea&&<section className="workshop-idea"><Sparkles size={24}/><div><small>Une idée pour aujourd’hui</small><h2>{idea.text}</h2><span><Clock3 size={13}/>5 min · {getPassion(passion).label}</span></div><button type="button" onClick={()=>start(passion,5,idea.id)}>Essayer<ChevronRight size={16}/></button></section>}<div className="studio-passions-grid">{passions.map(id=><PassionPoster key={id} passion={id} stats={statsFor(stats.byPassion,id)} onOpen={()=>push({name:'passionSpace',passion:id})}/>)}</div>{!passions.length&&<Button onClick={()=>push({name:'passions',mode:'edit'})}>Choisir mes passions</Button>}<RecentCreations/></Screen>
}

const COPY:Record<PassionId,{create:string;gallery:string;title:string;cta:string;first:string}>={
 dessin:{create:'Créer',gallery:'Ma galerie',title:'Ton atelier, à ton rythme.',cta:'Créer un dessin',first:'Faire mon premier dessin'},
 ecriture:{create:'Créer',gallery:'Mes textes',title:'Une page pour tes idées.',cta:'Commencer un texte',first:'Écrire mon premier texte'},
 piano:{create:'Jouer',gallery:'Mon répertoire',title:'Ton piano, à portée de main.',cta:'Jouer du piano',first:'Jouer pour la première fois'},
 cinema:{create:'Explorer',gallery:'Mes films',title:'Le cinéma, à ta façon.',cta:'Explorer le cinéma',first:'Faire ma première découverte'},
 musique:{create:'Écouter',gallery:'Mes écoutes',title:'Une pause pour tes oreilles.',cta:'Explorer la musique',first:'Faire ma première écoute'},
}

export function PassionSpaceScreen({passion}:{passion:PassionId}) {
 const {state}=useAppState(),{push,reset}=useNavigation(),start=useWorkshopStart(),startWord=useStartChallenge(),shop=useShop()
 const [section,setSection]=useState<'create'|'gallery'>('create')
 const row=statsFor(state.me.stats.byPassion,passion),copy=COPY[passion]
 const progress=currentPath(passion,row.steps,passionLevel(passion,row.minutes).level,state.me.user.skills[passion])
 const day=todayKey(),word=dailyWord(day).word
 const owned=SHOP_ITEMS.filter(item=>item.category==='piano'&&shop.owned.includes(item.id))
 const available=state.me.user.passions.includes(passion)
 return <Screen tabs className="studio-workshop"><AppHeader/><button type="button" className="workshop-back" onClick={()=>reset([{name:'home'},{name:'passionHub'}])}><ArrowLeft size={17}/>Mes passions</button><header className="workshop-cover" data-passion={passion}><PassionArtwork passion={passion}/><h1>{getPassion(passion).label}</h1></header><div className="workshop-tabs" aria-label="Rubriques de la passion">{([{id:'create',label:copy.create},{id:'gallery',label:copy.gallery}] as const).map(tab=><button key={tab.id} type="button" aria-pressed={section===tab.id} onClick={()=>setSection(tab.id)}>{tab.label}</button>)}</div>
 {section==='gallery'?passion==='piano'?<section className="workshop-section"><h2>Mon répertoire</h2><p>Les morceaux que tu as débloqués.</p>{owned.length?owned.map(item=><button key={item.id} type="button" className="workshop-repertoire" onClick={()=>push({name:'bonusPiano',itemId:item.id})}><span><strong>{item.title}</strong><small>{[item.composer,item.edition??item.difficulty].filter(Boolean).join(' · ')}</small></span><Play size={20}/></button>):<div className="workshop-empty"><p>Ton répertoire commence avec un premier morceau.</p><Button onClick={()=>push({name:'shop',category:'piano'})}>Découvrir les morceaux</Button></div>}<h2 className="mt-5">Mes séances au piano</h2><GalleryScreen key={passion} passion={passion} embedded/></section>:<GalleryScreen key={passion} passion={passion} embedded/>:<>
 <div className="workshop-intro"><h2>{row.activities?copy.title:'Ton atelier commence ici.'}</h2><p>{plural(row.activities,'activité')} · {row.minutes} min de pratique</p></div>
 {!row.activities&&<section className="workshop-welcome"><Mascot size={94}/><div><h3>Un premier pas suffit pour commencer.</h3><p>Chaque création construira ton atelier.</p></div></section>}
 <Button className="workshop-main-cta" onClick={()=>start(passion)}>{available?row.activities?copy.cta:copy.first:'Ajouter cette passion'}<ArrowRight size={19}/></Button>
 {(passion==='dessin'||passion==='ecriture')&&<section className="workshop-word"><div><small>Le mot du jour</small><h2>{word}</h2><p>À toi de lui donner vie · 15 min</p></div><button type="button" onClick={()=>available?startWord(passion,day):push({name:'passions',mode:'edit'})}>{passion==='dessin'?'Dessiner':'Écrire'}<ChevronRight size={17}/></button></section>}
 <section className="workshop-section"><h2>Une petite pause créative</h2><div className="workshop-quick">{([5,15] as Duration[]).map(duration=>{const activity=collection(passion).find(group=>group.duration===duration)?.activities[0];return activity&&<button type="button" key={duration} onClick={()=>start(passion,duration,activity.id)}><Clock3 size={19}/><strong>{activity.text}</strong><span>{duration} min<ChevronRight size={15}/></span></button>})}</div></section>
 {progress&&<section className="workshop-current"><small>Pour progresser</small><h2>{progress.path.title}</h2><p>{progress.done} leçons sur {progress.path.steps.length}</p><span className="workshop-gauge"><i style={{width:`${progress.done/progress.path.steps.length*100}%`}}/></span>{progress.next&&<p>Prochaine leçon : {progress.next.title}</p>}<Button variant="secondary" size="sm" onClick={()=>push({name:'path',pathId:progress.path.id})}>Continuer dans Apprendre<ChevronRight size={16}/></Button></section>}
 {passion==='piano'&&owned.slice(0,2).map(item=><button key={item.id} type="button" className="workshop-repertoire" onClick={()=>push({name:'bonusPiano',itemId:item.id})}><span><strong>{item.title}</strong><small>{[item.composer,item.edition??item.difficulty].filter(Boolean).join(' · ')}</small></span><Play size={20}/></button>)}
 {passion==='piano'&&<button type="button" className="workshop-repertoire" onClick={()=>setSection('gallery')}><span><strong>Mon répertoire</strong><small>{plural(owned.length,'morceau débloqué','morceaux débloqués')}</small></span><ChevronRight size={22}/></button>}
 <details className="workshop-details"><summary>Ma progression et mes découvertes</summary><div><PassionDetail passion={passion} stats={row} section="overview" canStart={false} onOpenPath={pathId=>push({name:'path',pathId})} onChangeSkill={()=>push({name:'skill',passion,mode:'edit'})}/><PassionDetail passion={passion} stats={row} section="collection" canStart={false} onOpenPath={pathId=>push({name:'path',pathId})} onChangeSkill={()=>push({name:'skill',passion,mode:'edit'})}/></div></details>
 </>}
 </Screen>
}
