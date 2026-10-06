import { useState } from 'react'
import { ArrowLeft, BookOpen, ChevronRight, ChevronsUp, Clock3, Images, Play, Shuffle } from 'lucide-react'
import { collection, dailyWord, getPassion, SHOP_ITEMS, studioConfig, type Duration, type PassionId } from '@scroll-up/shared'
import { AppHeader } from '../components/AppHeader.tsx'
import { Screen } from '../components/Screen.tsx'
import { StudioArt } from '../components/StudioArt.tsx'
import { WorkshopHero } from '../components/WorkshopHero.tsx'
import { todayKey } from '../components/Challenge.tsx'
import { useStartChallenge } from '../lib/useStartChallenge.ts'
import { useShop } from '../lib/shop.ts'
import { useAppState, useNavigation } from '../state/AppState.tsx'
import { GalleryScreen } from './GalleryScreen.tsx'
import './PassionStudio.css'
const titles:Partial<Record<PassionId,string[][]>>={
 dessin:[['Un objet du quotidien','Un animal en formes simples','Trois croquis express','Le thème du jour','Motifs et doodles'],['Essaie un nouveau style','Un personnage, trois mots','Ombres et lumière','Ton personnage préféré','Imagine une couverture'],['Un portrait stylisé','Réinterprète une illustration','Ta journée en trois cases','Un personnage et son décor','Un portrait d’après photo']],
 piano:[['Au clair de la lune','Frère Jacques','Ah ! vous dirai-je, maman','Vive le vent','Joyeux anniversaire'],['Ode à la joie','When the Saints Go Marching In','Berceuse de Brahms','Au matin','Une petite musique de nuit'],['Lettre à Élise','Menuet en sol','Canon de Pachelbel','Marche turque','Greensleeves']],
 ecriture:[['Trois phrases autour de toi','Aujourd’hui, j’ai remarqué…','Un personnage en dix mots','Un titre, une première phrase','Redécouvre un objet'],['Une microfiction de 100 mots','Un souvenir en dix lignes','Une lettre à un personnage','Continue l’histoire','Un lieu vu par un personnage'],['Un dialogue, deux personnalités','Interview de ton futur toi','Un événement marquant','Ta critique d’une œuvre','Une scène ailleurs']],
}
const subtitles:Partial<Record<PassionId,string>>={dessin:'Ton atelier, à ton rythme.',piano:'Les mélodies à portée de main.',ecriture:'Une page pour tes idées.',logique:'Chaque dossier raconte une histoire.',francais:'Les règles en pratique.'}
export function PassionCatalog({passion,onStart}:{passion:PassionId;onStart:(duration:Duration,id?:string)=>Promise<void>}){
 const {state}=useAppState(),{push,reset}=useNavigation(),shop=useShop(),startWord=useStartChallenge()
 const [duration,setDuration]=useState<Duration>(5),[gallery,setGallery]=useState(false),[busy,setBusy]=useState(false)
 const activities=collection(passion).find(g=>g.duration===duration)?.activities??[],di=duration===5?0:duration===15?1:2
 const owned=SHOP_ITEMS.filter(i=>i.category==='piano'&&shop.owned.includes(i.id)),tried=state.me.stats.byPassion.find(p=>p.passion===passion)?.tried??[]
 const start=async(id?:string)=>{if(busy)return;setBusy(true);try{await onStart(duration,id)}finally{setBusy(false)}}
 const day=todayKey()
 return <Screen tabs className="interactive-workshop passion-catalog"><AppHeader/><div className="catalog-nav"><button type="button" onClick={()=>reset([{name:'home'},{name:'passionHub'}])}><ArrowLeft size={16}/>Mes passions</button><button type="button" onClick={()=>setGallery(!gallery)}><Images size={16}/>{gallery?'Choisir une activité':passion==='ecriture'?'Mes textes':passion==='piano'?'Mon répertoire':'Mes séances'}</button></div><WorkshopHero passion={passion} title={getPassion(passion).label} subtitle={subtitles[passion]??''}/>
 {gallery?<>{passion==='piano'&&<section className="iw-card"><h2>Mon répertoire</h2>{owned.length?owned.map(item=><button type="button" className="iw-learn-row" key={item.id} onClick={()=>push({name:'bonusPiano',itemId:item.id})}><span><strong>{item.title}</strong><small>{item.composer}</small></span><Play size={18}/></button>):<p>Les morceaux débloqués trouveront leur place ici.</p>}</section>}<GalleryScreen passion={passion} embedded/></>:<>
 <h2 className="catalog-title">{passion==='francais'?'Choisir ma révision':passion==='logique'?'Choisir mon défi':passion==='piano'?'Choisir ma mélodie':'Choisir mon activité'}</h2>
 <div className="catalog-durations" aria-label="Durée de l’activité">{([5,15,30] as Duration[]).map(d=><button type="button" key={d} aria-pressed={duration===d} onClick={()=>setDuration(d)}>{d} min</button>)}</div>
 <button className="catalog-scroll" type="button" disabled={busy} onClick={()=>void start()}><ChevronsUp size={26}/>J’ai envie de scroll<Shuffle size={18}/></button><p className="catalog-surprise">{passion==='logique'?'Un dossier':passion==='francais'?'Une révision':'Une activité'} surprise de {duration} min</p>
 <div className="catalog-activities">{activities.map((a,i)=>{const c=studioConfig(a.id);return <button type="button" key={a.id} disabled={busy} className="catalog-row" onClick={()=>void start(a.id)}><StudioArt passion={passion} index={c?.art??i}/><span><strong>{c?.title??titles[passion]?.[di]?.[i]??a.text}</strong><small>{c?.description??(passion==='piano'?'Un extrait simplifié sur le clavier de l’app.':a.text)}</small><span className="catalog-meta"><Clock3 size={13}/>{duration} min{c?.passion==='logique'&&<em>{c.difficulty}</em>}{c?.revision?<em>Version approfondie</em>:tried.includes(a.id)&&<em>Déjà réalisée</em>}</span></span><ChevronRight size={19}/></button>})}</div>
 {(passion==='dessin'||passion==='ecriture')&&<section className="catalog-word"><div><small>Le mot du jour · 15 min</small><h2>{dailyWord(day).word}</h2><p>À toi de lui donner vie.</p></div><button type="button" onClick={()=>state.me.user.passions.includes(passion)?startWord(passion,day):push({name:'passions',mode:'edit'})}>{passion==='dessin'?'Dessiner':'Écrire'}<ChevronRight size={16}/></button></section>}
 <button className="catalog-learn" type="button" onClick={()=>push({name:'learnPassion',passion})}><BookOpen size={31}/><span><strong>{passion==='logique'?'Apprendre à raisonner':passion==='francais'?'Apprendre une règle':`Apprendre ${passion==='piano'?'le piano':passion==='dessin'?'le dessin':'à écrire'}`}</strong><small>Comprendre, essayer, pratiquer.</small></span><ChevronRight size={19}/></button>
 </>}
 </Screen>
}
