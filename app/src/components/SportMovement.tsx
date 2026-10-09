import { useState, type CSSProperties } from 'react'
import { Play, Pause } from 'lucide-react'
import { SPORT_EXERCISES, type SportExerciseId, type SportSession } from '@scroll-up/shared'
import './SportMovement.css'

// Each adjacent pair is the same adult in two poses, in a regular sprite atlas.
const SPRITES = {
 squat:['standing',0],lunge:['standing',2],wall:['standing',4],calf:['standing',6],
 march:['standing',8],side:['standing',10],leg:['standing',12],shoulders:['standing',14],
 push:['floor',0],plank:['floor',2],bridge:['floor',4],bird:['floor',6],sideplank:['floor',8],
} as const
export function sportSessionFigure(session: SportSession): SportExerciseId {
 const preferences=/Jambes|Bas du corps/.test(session.title)?['lunge','lungeleft','bridge']:/Haut du corps/.test(session.title)?['push','wall']:/gainage|centre/.test(session.title)?['plank','sideleft']:/sans aller au sol|sans saut|Cardio/.test(session.title)?['side','march']:[]
 return session.exercises.find(id=>preferences.includes(id))??session.exercises[0]!
}
export function SportFigure({exercise,frame=1,side,easy=false}:{exercise:SportExerciseId;frame?:0|1;side?:'left'|'right';easy?:boolean}) {
 const e=SPORT_EXERCISES[exercise],[atlas,first]=SPRITES[e.pose]
 const index=easy&&e.pose==='bird'?10+frame:e.pose==='march'&&frame===0?0:first+frame,rows=atlas==='standing'?4:3
 const mirrored=(side??e.side)==='right'
 const style:CSSProperties={backgroundImage:`url('/art/sport-studio-${atlas}.webp')`,backgroundSize:`400% ${rows*100}%`,backgroundPosition:`${index%4/3*100}% ${Math.floor(index/4)/(rows-1)*100}%`,transform:mirrored?'scaleX(-1)':undefined}
 return <span className="sport-figure" data-atlas={atlas} style={style} role="img" aria-label={`${e.title} · ${frame===0?'départ':'mouvement'}`}/>
}
export function SportMovement({exercise,compact=false,side,easy=false}:{exercise:SportExerciseId;compact?:boolean;side?:'left'|'right';easy?:boolean}) {
 const [playing,setPlaying]=useState(false)
 return <div className={`sport-movement ${compact?'is-compact':''}`} data-playing={playing}>
  <div className="sport-studio-stage" aria-hidden="true">
   <div className="sport-stage-frame sport-stage-start"><SportFigure exercise={exercise} frame={0} side={side} easy={easy}/></div>
   <div className="sport-stage-frame sport-stage-end"><SportFigure exercise={exercise} side={side} easy={easy}/></div>
  </div>
  <button type="button" className="sport-play" aria-pressed={playing} onClick={()=>setPlaying(!playing)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Arrêter la démonstration':'Voir le mouvement'}</button>
  <div className="sport-poses"><div><SportFigure exercise={exercise} frame={0} side={side} easy={easy}/><small>Départ</small></div><div><SportFigure exercise={exercise} side={side} easy={easy}/><small>Mouvement</small></div></div>
 </div>
}
export function SportInstructions({exercise,easy,onEasy,intro}:{exercise:SportExerciseId;easy:boolean;onEasy?:(easy:boolean)=>void;intro?:string}) {
 const e=SPORT_EXERCISES[exercise],shown=easy&&e.easyExercise?e.easyExercise:exercise
 return <section className="iw-card sport-instructions"><h2>{easy&&e.easyExercise?SPORT_EXERCISES[shown].title+' · variante':e.title}</h2><span className="sport-understand">Comprendre le mouvement</span><SportMovement exercise={shown} easy={easy}/><h3>Les repères utiles</h3>{intro&&<p>{intro}</p>}<ol>{SPORT_EXERCISES[shown].steps.map((step,i)=><li key={step}><span>{i+1}</span>{step}</li>)}</ol><p className="sport-cue">{easy?e.easier:SPORT_EXERCISES[shown].cue}</p><details><summary>Version plus facile</summary><p>{e.easier}</p>{onEasy&&<button className="iw-text-button" type="button" aria-pressed={easy} onClick={()=>onEasy(!easy)}>{easy?'Version plus facile sélectionnée · changer':'Choisir cette version pour la séance'}</button>}</details><details><summary>Le repère à garder</summary><p>{e.mistake}</p></details></section>
}
